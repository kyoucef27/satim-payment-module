import { SatimAPI } from '../api/SatimAPI';
import { Config } from '../config/Config';
import { Logger } from '../utils/logger';
import {
  PaymentOrder,
  PaymentResponse,
  PaymentVerification,
  RefundResponse,
  PaymentStatus,
} from '../types';
import {
  SatimRegisterPaymentRequest,
  SatimVerifyPaymentRequest,
  SatimRefundRequest,
} from '../types/api.types';
import { generateOrderId } from '../utils/helpers';
import { CURRENCY_DZD, ORDER_STATUS_CODES } from '../config/constants';

/**
 * Payment handler - converts high-level payment operations to SATIM API calls
 * Acts as an adapter between our types and SATIM API types
 */
export class PaymentHandler {
  private api: SatimAPI;
  private config: Config;
  private logger: Logger;

  constructor(api: SatimAPI, config: Config, logger: Logger) {
    this.api = api;
    this.config = config;
    this.logger = logger;
  }

  /**
   * Create and register a payment
   */
  async createPayment(order: Partial<PaymentOrder>): Promise<PaymentResponse> {
    // Generate order ID if not provided (already max 10 chars)
    const orderNumber = order.orderId || generateOrderId();

    // Ensure required fields
    if (!order.amount) {
      throw new Error('Amount is required');
    }

    // Convert currency code to numeric ISO 4217 (DZD -> 012)
    let currency = order.currency || CURRENCY_DZD;
    if (currency === 'DZD') {
      currency = CURRENCY_DZD; // Convert to '012'
    }

    this.logger.info('Creating payment', { orderNumber, amount: order.amount });

    // Build SATIM API request
    const request: SatimRegisterPaymentRequest = {
      userName: this.config.get().username,
      password: this.config.get().password,
      orderNumber: orderNumber, // Already 10 chars max from generateOrderId()
      amount: order.amount,
      currency,
      returnUrl: order.returnUrl || this.config.get().returnUrl,
      failUrl: order.returnUrl || this.config.get().failUrl, // Use returnUrl as fallback
      language: 'fr', // SATIM accepts 'fr', 'ar', 'en' (lowercase)
      jsonParams: {
        force_terminal_id: this.config.get().terminalId,
        udf1: order.description?.substring(0, 20) || orderNumber,
      } as any, // Will be stringified in SatimAPI
    };

    const response = await this.api.registerPayment(request);

    this.logger.info('Payment created successfully', {
      orderId: response.orderId,
      orderNumber,
    });

    // Convert SATIM response to our PaymentResponse type
    const paymentResponse: PaymentResponse = {
      success: true,
      paymentId: response.orderId!, // mdOrder is the payment ID
      paymentUrl: response.formUrl!,
      orderId: orderNumber,
      amount: order.amount,
      currency,
      status: PaymentStatus.PENDING,
      createdAt: new Date(),
      message: 'Payment registered successfully',
    };

    return paymentResponse;
  }

  /**
   * Verify a payment using mdOrder (payment ID)
   */
  async verifyPayment(paymentId: string): Promise<PaymentVerification> {
    this.logger.info('Verifying payment', { paymentId });

    // Build SATIM verification request
    const request: SatimVerifyPaymentRequest = {
      userName: this.config.get().username,
      password: this.config.get().password,
      mdOrder: paymentId,
      language: 'en', // SATIM accepts 'fr', 'ar', 'en' (lowercase)
    };

    const response = await this.api.verifyPayment(request);

    this.logger.info('Payment verification complete', {
      paymentId,
      orderStatus: response.OrderStatus,
      orderNumber: response.OrderNumber,
    });

    // Map OrderStatus to PaymentStatus
    const status = this.mapOrderStatusToPaymentStatus(response.OrderStatus);

    // Convert SATIM response to our PaymentVerification type
    const verification: PaymentVerification = {
      success: response.ErrorCode === '0',
      paymentId,
      orderId: response.OrderNumber || paymentId,
      status,
      amount: response.Amount || 0,
      currency: response.currency || CURRENCY_DZD,
      transactionId: response.approvalCode,
      authorizationCode: response.authorizationResponseId,
      cardMask: response.Pan,
      paymentDate: response.expiration
        ? new Date(
            parseInt(response.expiration.substring(0, 4)),
            parseInt(response.expiration.substring(4, 6)) - 1
          )
        : undefined,
      message:
        response.actionCodeDescription ||
        response.ErrorMessage ||
        ORDER_STATUS_CODES[response.OrderStatus || 0],
      rawResponse: response,
    };

    return verification;
  }

  /**
   * Refund a payment (full or partial)
   */
  async refundPayment(
    paymentId: string,
    amount: number,
    reason?: string
  ): Promise<RefundResponse> {
    this.logger.info('Processing refund', { paymentId, amount, reason });

    // Build SATIM refund request
    const request: SatimRefundRequest = {
      userName: this.config.get().username,
      password: this.config.get().password,
      orderId: paymentId, // mdOrder
      amount,
    };

    const response = await this.api.refundPayment(request);

    this.logger.info('Refund processed', {
      paymentId,
      amount,
    });

    // Convert SATIM response to our RefundResponse type
    const refundResponse: RefundResponse = {
      success: response.errorCode === '0',
      refundId: `REFUND-${paymentId}-${Date.now()}`,
      paymentId,
      amount,
      status: response.errorCode === '0' ? PaymentStatus.REFUNDED : PaymentStatus.FAILED,
      message: response.errorMessage || 'Refund processed successfully',
      refundedAt: new Date(),
    };

    return refundResponse;
  }

  /**
   * Check if payment is successful
   */
  async isPaymentSuccessful(paymentId: string): Promise<boolean> {
    const verification = await this.verifyPayment(paymentId);
    return verification.status === PaymentStatus.SUCCESS;
  }

  /**
   * Check if payment is pending
   */
  async isPaymentPending(paymentId: string): Promise<boolean> {
    const verification = await this.verifyPayment(paymentId);
    return verification.status === PaymentStatus.PENDING;
  }

  /**
   * Wait for payment completion (polling)
   */
  async waitForPayment(
    paymentId: string,
    timeoutMs: number = 300000,
    intervalMs: number = 5000
  ): Promise<PaymentVerification> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const verification = await this.verifyPayment(paymentId);

      if (verification.status !== PaymentStatus.PENDING) {
        return verification;
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error('Payment verification timeout');
  }

  /**
   * Map SATIM OrderStatus to our PaymentStatus
   */
  private mapOrderStatusToPaymentStatus(orderStatus?: number): PaymentStatus {
    if (!orderStatus && orderStatus !== 0) {
      return PaymentStatus.PENDING;
    }

    switch (orderStatus) {
      case 1: // Transaction approved (one-phase or preauth)
      case 2: // Amount deposited successfully
      case 11: // Debited
        return PaymentStatus.SUCCESS;
      case 4: // Transaction refunded
        return PaymentStatus.REFUNDED;
      case 6: // Authorization declined
      case -1: // Transaction declined
        return PaymentStatus.FAILED;
      case 3: // Authorization reversed
        return PaymentStatus.CANCELLED;
      case 0: // Order registered, not paid
      default:
        return PaymentStatus.PENDING;
    }
  }
}
