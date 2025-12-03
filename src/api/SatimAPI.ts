import axios, { AxiosInstance, AxiosError } from 'axios';
import { Config } from '../config/Config';
import { Logger } from '../utils/logger';
import { SatimError, NetworkError, TimeoutError } from '../utils/errors';
import {
  SatimRegisterPaymentRequest,
  SatimRegisterPaymentResponse,
  SatimVerifyPaymentRequest,
  SatimVerifyPaymentResponse,
  SatimRefundRequest,
  SatimRefundResponse,
} from '../types/api.types';
import { 
  SATIM_ERROR_CODES, 
  ERROR_MESSAGES, 
  ACKNOWLEDGE_ERROR_MESSAGES, 
  REFUND_ERROR_MESSAGES,
  API_ENDPOINTS,
  MIN_AMOUNT
} from '../config/constants';

/**
 * SATIM API client for REST API calls
 * Implements register.do, acknowledgeTransaction.do, and refund.do endpoints
 */
export class SatimAPI {
  private logger: Logger;
  private httpClient: AxiosInstance;

  constructor(config: Config, logger: Logger) {
    this.logger = logger;

    // Initialize HTTP client with default configuration
    this.httpClient = axios.create({
      baseURL: config.getApiUrl(),
      timeout: config.get().apiTimeout,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'CIBPAY-SATIM-Module/1.0',
      },
    });

    // Add request interceptor for logging
    this.httpClient.interceptors.request.use(
      (config) => {
        this.logger.debug('API Request', {
          method: config.method,
          url: config.url,
        });
        return config;
      },
      (error) => {
        this.logger.error('API Request Error', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.httpClient.interceptors.response.use(
      (response) => {
        this.logger.debug('API Response', {
          status: response.status,
          errorCode: response.data?.errorCode || response.data?.ErrorCode,
        });
        return response;
      },
      (error) => {
        this.logger.error('API Response Error', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Register a new payment with SATIM (register.do)
   * @param request - Payment registration request
   * @returns Payment registration response with formUrl and orderId (mdOrder)
   */
  async registerPayment(
    request: SatimRegisterPaymentRequest
  ): Promise<SatimRegisterPaymentResponse> {
    try {
      this.logger.info('Registering payment order', { orderNumber: request.orderNumber });

      // Validate amount
      if (request.amount < MIN_AMOUNT) {
        throw new SatimError(
          `Amount must be at least ${MIN_AMOUNT} centimes (50 DA)`,
          SATIM_ERROR_CODES.INVALID_PARAMETER
        );
      }

      if (request.amount % 100 !== 0) {
        throw new SatimError(
          'Amount must be a multiple of 100 centimes',
          SATIM_ERROR_CODES.INVALID_PARAMETER
        );
      }

      // Build jsonParams string from object
      const jsonParamsString = JSON.stringify(request.jsonParams);
      
      // Prepare request parameters as URLSearchParams
      const params = new URLSearchParams();
      params.append('userName', request.userName);
      params.append('password', request.password);
      params.append('orderNumber', request.orderNumber);
      params.append('amount', request.amount.toString());
      params.append('currency', request.currency);
      params.append('returnUrl', request.returnUrl);
      if (request.failUrl) {
        params.append('failUrl', request.failUrl);
      }
      params.append('language', request.language);
      params.append('jsonParams', jsonParamsString);

      const startTime = Date.now();
      const response = await this.httpClient.post<SatimRegisterPaymentResponse>(
        API_ENDPOINTS.REGISTER_PAYMENT,
        params.toString()
      );
      const duration = Date.now() - startTime;

      this.logger.logAPICall('POST', API_ENDPOINTS.REGISTER_PAYMENT, response.status, duration);

      // Log full response for debugging
      this.logger.debug('SATIM register.do response', {
        errorCode: response.data.errorCode,
        errorMessage: response.data.errorMessage,
        orderId: response.data.orderId,
        formUrl: response.data.formUrl,
        fullResponse: response.data
      });

      // Check for errors - errorCode "0" means success
      if (String(response.data.errorCode) !== '0') {
        const errorMessage = ERROR_MESSAGES[response.data.errorCode] || response.data.errorMessage || 'Unknown error';
        throw new SatimError(
          `Payment registration failed: ${errorMessage}`,
          response.data.errorCode
        );
      }

      // Check if we got the required fields
      if (!response.data.orderId || !response.data.formUrl) {
        this.logger.error('Missing required fields in SATIM response', response.data);
        throw new SatimError(
          `Payment registration failed: Missing orderId or formUrl in response`,
          response.data.errorCode
        );
      }

      this.logger.info('Payment order registered successfully', {
        orderId: response.data.orderId,
        formUrl: response.data.formUrl
      });

      return response.data;
    } catch (error) {
      return this.handleError(error, 'registerPayment');
    }
  }

  /**
   * Verify and acknowledge payment transaction (acknowledgeTransaction.do)
   * This confirms that the merchant successfully handled the client redirect after payment
   * @param request - Verification request with mdOrder
   * @returns Payment verification response with full transaction details
   */
  async verifyPayment(
    request: SatimVerifyPaymentRequest
  ): Promise<SatimVerifyPaymentResponse> {
    try {
      this.logger.info('Verifying payment', { orderId: request.mdOrder });

      // Prepare request parameters as URLSearchParams
      const params = new URLSearchParams({
        userName: request.userName,
        password: request.password,
        mdOrder: request.mdOrder,
        language: request.language
      });

      const startTime = Date.now();
      const response = await this.httpClient.get<SatimVerifyPaymentResponse>(
        `${API_ENDPOINTS.VERIFY_PAYMENT}?${params.toString()}`
      );
      const duration = Date.now() - startTime;

      this.logger.logAPICall('GET', API_ENDPOINTS.VERIFY_PAYMENT, response.status, duration);

      // Check for errors (note: ErrorCode with capital E)
      if (response.data.ErrorCode !== SATIM_ERROR_CODES.SUCCESS) {
        const errorMessage = ACKNOWLEDGE_ERROR_MESSAGES[response.data.ErrorCode] || response.data.ErrorMessage || 'Unknown error';
        throw new SatimError(
          `Payment verification failed: ${errorMessage}`,
          response.data.ErrorCode
        );
      }

      this.logger.info('Payment verified successfully', {
        orderId: request.mdOrder,
        orderStatus: response.data.OrderStatus,
        orderNumber: response.data.OrderNumber
      });

      return response.data;
    } catch (error) {
      return this.handleError(error, 'verifyPayment');
    }
  }

  /**
   * Refund a payment (refund.do)
   * Returns money to the customer's card
   * @param request - Refund request with orderId and amount
   * @returns Refund response
   */
  async refundPayment(request: SatimRefundRequest): Promise<SatimRefundResponse> {
    try {
      this.logger.info('Refunding payment', { 
        orderId: request.orderId,
        amount: request.amount 
      });

      // Validate amount - SATIM refund format:
      // For 50 DA order -> send amount=5000 (not 500000)
      // Amount should be in the same format as sent in register.do
      if (request.amount < 100) {
        throw new SatimError(
          `Refund amount must be at least 100 centimes (1.00 DZD)`,
          SATIM_ERROR_CODES.INVALID_PARAMETER
        );
      }

      if (request.amount % 100 !== 0) {
        throw new SatimError(
          'Refund amount must be a multiple of 100 centimes',
          SATIM_ERROR_CODES.INVALID_PARAMETER
        );
      }

      // IMPORTANT: Remove externalRefundId as it's not in official documentation
      // and may be causing the duplicate error
      
      // Prepare request parameters as URLSearchParams
      const params = new URLSearchParams({
        userName: request.userName,
        password: request.password,
        orderId: request.orderId,
        amount: request.amount.toString() // Send same format as register.do
      });

      const startTime = Date.now();
      const response = await this.httpClient.get<SatimRefundResponse>(
        `${API_ENDPOINTS.REFUND_PAYMENT}?${params.toString()}`
      );
      const duration = Date.now() - startTime;

      this.logger.logAPICall('GET', API_ENDPOINTS.REFUND_PAYMENT, response.status, duration);

      // Log full refund response for debugging
      this.logger.debug('SATIM refund.do response', {
        errorCode: response.data.errorCode,
        errorMessage: response.data.errorMessage,
        fullResponse: response.data
      });

      // Check for errors
      if (String(response.data.errorCode) !== '0') {
        let errorMessage = REFUND_ERROR_MESSAGES[response.data.errorCode] || response.data.errorMessage || 'Unknown error';
        
        // Add specific guidance for common refund issues
        if (response.data.errorCode === '5') {
          errorMessage += '. POSSIBLE CAUSES: 1) Refund already processed for this payment, 2) Payment not in correct state for refund, 3) Sandbox account may not support refunds, 4) Invalid amount format.';
        } else if (response.data.errorCode === '6') {
          errorMessage += '. The payment ID does not exist or is invalid.';
        } else if (response.data.errorCode === '7') {
          errorMessage += '. The payment must be fully settled (OrderStatus=2) before refund.';
        }
        
        throw new SatimError(
          `Refund failed: ${errorMessage}`,
          response.data.errorCode
        );
      }

      this.logger.info('Payment refunded successfully', {
        orderId: request.orderId
      });

      return response.data;
    } catch (error) {
      return this.handleError(error, 'refundPayment');
    }
  }

  /**
   * Handle API errors and convert them to appropriate error types
   */
  private handleError(error: unknown, operation: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // Timeout error
      if (axiosError.code === 'ECONNABORTED') {
        this.logger.error('Request timeout', { operation });
        throw new TimeoutError('Request timeout', { operation });
      }

      // Server responded with error
      if (axiosError.response) {
        const data = axiosError.response.data as any;
        const errorCode = data?.errorCode || data?.ErrorCode || SATIM_ERROR_CODES.SYSTEM_ERROR;
        const errorMessage = data?.errorMessage || data?.ErrorMessage || 'Unknown server error';
        
        this.logger.error('SATIM API error', { 
          operation, 
          errorCode, 
          errorMessage,
          status: axiosError.response.status 
        });
        
        throw new SatimError(errorMessage, errorCode);
      }
      
      // No response received (network error)
      if (axiosError.request) {
        this.logger.error('Network error - no response from SATIM', { operation });
        throw new NetworkError('No response from SATIM server', { operation });
      }
    }

    // SatimError - rethrow as is
    if (error instanceof SatimError) {
      throw error;
    }

    // Unknown error
    this.logger.error('Unknown error in SATIM API', { operation, error });
    throw new SatimError(
      error instanceof Error ? error.message : 'Unknown error',
      SATIM_ERROR_CODES.SYSTEM_ERROR
    );
  }
}
