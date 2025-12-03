import { Request, Response } from 'express';
import { SignatureValidator } from '../security/SignatureValidator';
import { Logger } from '../utils/logger';
import { CallbackRequest, CallbackResponse, PaymentStatus } from '../types';
import { SignatureError } from '../utils/errors';
import { STATUS_MAPPING } from '../config/constants';

/**
 * Callback handler for SATIM webhooks
 */
export class CallbackHandler {
  private signatureValidator: SignatureValidator;
  private logger: Logger;
  private onPaymentSuccess?: (payment: CallbackRequest) => Promise<void>;
  private onPaymentFailed?: (payment: CallbackRequest) => Promise<void>;
  private onPaymentCancelled?: (payment: CallbackRequest) => Promise<void>;

  constructor(secretKey: string, logger: Logger) {
    this.signatureValidator = new SignatureValidator(secretKey);
    this.logger = logger;
  }

  /**
   * Register callback for successful payments
   */
  onSuccess(callback: (payment: CallbackRequest) => Promise<void>): void {
    this.onPaymentSuccess = callback;
  }

  /**
   * Register callback for failed payments
   */
  onFailure(callback: (payment: CallbackRequest) => Promise<void>): void {
    this.onPaymentFailed = callback;
  }

  /**
   * Register callback for cancelled payments
   */
  onCancellation(callback: (payment: CallbackRequest) => Promise<void>): void {
    this.onPaymentCancelled = callback;
  }

  /**
   * Handle SATIM callback (Express middleware compatible)
   */
  async handle(req: Request, res: Response): Promise<void> {
    this.logger.info('Received SATIM callback', {
      paymentId: req.body?.paymentId,
      status: req.body?.status,
    });

    try {
      const callbackData = req.body as CallbackRequest;

      // Validate required fields
      this.validateCallbackData(callbackData);

      // Verify signature
      const signature = callbackData.signature || req.headers['x-satim-signature'] as string;
      
      if (!signature) {
        throw new SignatureError('Missing signature');
      }

      // Remove signature from payload for verification
      const { signature: _, ...payloadWithoutSignature } = callbackData;
      
      this.signatureValidator.verifyCallback(payloadWithoutSignature, signature);

      // Map status
      const status = this.mapStatus(callbackData.status);

      // Process callback based on status
      await this.processCallback({ ...callbackData, status });

      // Send success response
      const response: CallbackResponse = {
        success: true,
        message: 'Callback processed successfully',
        paymentId: callbackData.paymentId,
      };

      this.logger.logPayment('callback-processed', callbackData.paymentId, status);

      res.status(200).json(response);
    } catch (error) {
      this.logger.error('Callback processing error', error);

      const errorResponse: CallbackResponse = {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        paymentId: req.body?.paymentId || 'unknown',
      };

      res.status(400).json(errorResponse);
    }
  }

  /**
   * Validate callback data
   */
  private validateCallbackData(data: CallbackRequest): void {
    const requiredFields = ['paymentId', 'orderId', 'status', 'amount', 'currency'];

    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  /**
   * Process callback based on payment status
   */
  private async processCallback(callbackData: CallbackRequest & { status: string }): Promise<void> {
    const status = this.mapStatus(callbackData.status);

    switch (status) {
      case PaymentStatus.SUCCESS:
        if (this.onPaymentSuccess) {
          await this.onPaymentSuccess(callbackData);
        }
        break;

      case PaymentStatus.FAILED:
        if (this.onPaymentFailed) {
          await this.onPaymentFailed(callbackData);
        }
        break;

      case PaymentStatus.CANCELLED:
        if (this.onPaymentCancelled) {
          await this.onPaymentCancelled(callbackData);
        }
        break;

      default:
        this.logger.warn('Unhandled payment status', { status });
    }
  }

  /**
   * Map SATIM status to internal status
   */
  private mapStatus(satimStatus: string): PaymentStatus {
    const mapped = STATUS_MAPPING[satimStatus];
    return (mapped as PaymentStatus) || PaymentStatus.FAILED;
  }

  /**
   * Create Express middleware
   */
  middleware() {
    return async (req: Request, res: Response) => {
      await this.handle(req, res);
    };
  }
}
