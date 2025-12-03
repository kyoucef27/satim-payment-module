import { Config } from './config/Config';
import { SatimAPI } from './api/SatimAPI';
import { CallbackHandler } from './handlers/CallbackHandler';
import { PaymentHandler } from './handlers/PaymentHandler';
import { Logger, getLogger, setLogger } from './utils/logger';
import { ensureHTTPS } from './security/SignatureValidator';
import {
  SatimConfig,
  PaymentOrder,
  PaymentResponse,
  PaymentVerification,
  RefundResponse,
  TransactionStatus,
  CallbackRequest,
} from './types';

/**
 * Main SATIM Client
 */
export class SatimClient {
  private config: Config;
  private logger: Logger;
  private api: SatimAPI;
  private callbackHandler: CallbackHandler;
  private paymentHandler: PaymentHandler;

  constructor(config: SatimConfig) {
    // Initialize configuration
    this.config = new Config(config);

    // Initialize logger
    const cfg = this.config.get();
    this.logger = getLogger(cfg.logLevel, cfg.logToFile, cfg.logDir);
    setLogger(this.logger);

    // Validate HTTPS in production
    if (this.config.isProduction()) {
      if (cfg.returnUrl) ensureHTTPS(cfg.returnUrl);
      if (cfg.failUrl) ensureHTTPS(cfg.failUrl);
    }

    // Initialize components
    this.api = new SatimAPI(this.config, this.logger);
    this.callbackHandler = new CallbackHandler('', this.logger); // Signature validation not used in SATIM API
    this.paymentHandler = new PaymentHandler(this.api, this.config, this.logger);

    this.logger.info('SATIM Client initialized', {
      environment: this.config.getEnvironment(),
      terminalId: cfg.terminalId,
      username: cfg.username,
    });
  }

  /**
   * Create from environment variables
   */
  static fromEnv(): SatimClient {
    return new SatimClient(Config.fromEnv().get());
  }

  /**
   * Register a new payment
   * orderId is optional - will be auto-generated if not provided
   */
  async registerPayment(order: Partial<PaymentOrder> & { amount: number }): Promise<PaymentResponse> {
    return this.paymentHandler.createPayment(order);
  }

  /**
   * Redirect user to SATIM payment page
   * Note: This method is intended for client-side use only
   */
  redirectUser(paymentUrl: string): void {
    // This method should be called from client-side code
    // For server-side, return the paymentUrl to the client
    this.logger.info('Redirect user to payment URL', { paymentUrl });
    
    // In a browser environment, you would do: window.location.href = paymentUrl
    // This is just a helper method that returns the URL for redirection
  }

  /**
   * Verify payment status
   */
  async verifyPayment(paymentId: string): Promise<PaymentVerification> {
    return this.paymentHandler.verifyPayment(paymentId);
  }

  /**
   * Refund a payment
   * @param paymentId - The mdOrder from payment registration
   * @param amount - The amount to refund in centimes (required)
   * @param reason - Optional reason for refund
   */
  async refundPayment(paymentId: string, amount: number, reason?: string): Promise<RefundResponse> {
    return this.paymentHandler.refundPayment(paymentId, amount, reason);
  }

  /**
   * Get transaction status (alias for verifyPayment)
   */
  async getTransactionStatus(paymentId: string): Promise<TransactionStatus> {
    const verification = await this.paymentHandler.verifyPayment(paymentId);
    return {
      paymentId: verification.paymentId,
      orderId: verification.orderId,
      status: verification.status,
      amount: verification.amount,
      currency: verification.currency,
      transactionId: verification.transactionId,
      lastUpdated: verification.paymentDate || new Date(),
    };
  }

  /**
   * Get callback handler
   */
  getCallbackHandler(): CallbackHandler {
    return this.callbackHandler;
  }

  /**
   * Register callback for successful payments
   */
  onPaymentSuccess(callback: (payment: CallbackRequest) => Promise<void>): void {
    this.callbackHandler.onSuccess(callback);
  }

  /**
   * Register callback for failed payments
   */
  onPaymentFailure(callback: (payment: CallbackRequest) => Promise<void>): void {
    this.callbackHandler.onFailure(callback);
  }

  /**
   * Register callback for cancelled payments
   */
  onPaymentCancellation(callback: (payment: CallbackRequest) => Promise<void>): void {
    this.callbackHandler.onCancellation(callback);
  }

  /**
   * Get configuration
   */
  getConfig(): Config {
    return this.config;
  }

  /**
   * Check if running in sandbox mode
   */
  isSandbox(): boolean {
    return this.config.isSandbox();
  }

  /**
   * Check if running in production mode
   */
  isProduction(): boolean {
    return this.config.isProduction();
  }

  /**
   * Get logger instance
   */
  getLogger(): Logger {
    return this.logger;
  }
}
