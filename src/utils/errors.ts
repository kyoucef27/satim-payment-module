import { SATIM_ERROR_CODES } from '../config/constants';

/**
 * Base SATIM error class
 */
export class SatimError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly details?: any;

  constructor(message: string, code: string, statusCode?: number, details?: any) {
    super(message);
    this.name = 'SatimError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends SatimError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIGURATION_ERROR', undefined, details);
    this.name = 'ConfigurationError';
  }
}

/**
 * API error
 */
export class APIError extends SatimError {
  constructor(message: string, code: string, statusCode?: number, details?: any) {
    super(message, code, statusCode, details);
    this.name = 'APIError';
  }
}

/**
 * Signature verification error
 */
export class SignatureError extends SatimError {
  constructor(message: string = 'Invalid signature', details?: any) {
    super(message, SATIM_ERROR_CODES.INVALID_PARAMETER, 401, details);
    this.name = 'SignatureError';
  }
}

/**
 * Payment not found error (unregistered order ID)
 */
export class PaymentNotFoundError extends SatimError {
  constructor(paymentId: string) {
    super(
      `Payment not found: ${paymentId}`,
      SATIM_ERROR_CODES.MISSING_PARAMETER,
      404,
      { paymentId }
    );
    this.name = 'PaymentNotFoundError';
  }
}

/**
 * Payment expired error (timeout)
 */
export class PaymentExpiredError extends SatimError {
  constructor(paymentId: string) {
    super(
      `Payment expired: ${paymentId}`,
      SATIM_ERROR_CODES.TIMEOUT,
      410,
      { paymentId }
    );
    this.name = 'PaymentExpiredError';
  }
}

/**
 * Network error
 */
export class NetworkError extends SatimError {
  constructor(message: string, details?: any) {
    super(message, SATIM_ERROR_CODES.NETWORK_ERROR, 503, details);
    this.name = 'NetworkError';
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends SatimError {
  constructor(message: string = 'Request timeout', details?: any) {
    super(message, SATIM_ERROR_CODES.TIMEOUT, 408, details);
    this.name = 'TimeoutError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends SatimError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Parse SATIM error response
 */
export function parseSatimError(response: any): SatimError {
  const errorCode = response?.errorCode || response?.ErrorCode || 'SERVER_ERROR';
  const message = response?.message || response?.errorMessage || response?.ErrorMessage || 'Unknown error occurred';
  const statusCode = response?.statusCode;

  switch (errorCode) {
    case SATIM_ERROR_CODES.INVALID_PARAMETER:
      return new SignatureError(message, response);
    case SATIM_ERROR_CODES.MISSING_PARAMETER:
      return new PaymentNotFoundError(response?.paymentId || response?.orderId || 'unknown');
    case SATIM_ERROR_CODES.TIMEOUT:
      return new PaymentExpiredError(response?.paymentId || response?.orderId || 'unknown');
    case SATIM_ERROR_CODES.NETWORK_ERROR:
      return new NetworkError(message, response);
    case SATIM_ERROR_CODES.DUPLICATE_ORDER:
    case SATIM_ERROR_CODES.UNKNOWN_CURRENCY:
    case SATIM_ERROR_CODES.SYSTEM_ERROR:
    case SATIM_ERROR_CODES.INVALID_PAYMENTWAY:
      return new APIError(message, errorCode, statusCode, response);
    default:
      return new APIError(message, errorCode, statusCode, response);
  }
}
