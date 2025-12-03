/**
 * SATIM Payment Module
 * Main entry point
 */

export { SatimClient } from './SatimClient';
export { Config } from './config/Config';
export { CallbackHandler } from './handlers/CallbackHandler';
export { PaymentHandler } from './handlers/PaymentHandler';

// Export types
export * from './types';

// Export utilities
export { Logger, getLogger } from './utils/logger';
export {
  SatimError,
  APIError,
  SignatureError,
  PaymentNotFoundError,
  PaymentExpiredError,
  NetworkError,
  TimeoutError,
  ValidationError,
  ConfigurationError,
} from './utils/errors';

// Export middleware
export { createCallbackMiddleware, requireHTTPS } from './middleware/expressCallback';

// Export constants
export { SATIM_URLS, API_ENDPOINTS, DEFAULTS, SATIM_ERROR_CODES } from './config/constants';
