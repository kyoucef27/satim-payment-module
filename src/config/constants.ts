/**
 * SATIM API URLs
 */
export const SATIM_URLS = {
  SANDBOX: 'https://test2.satim.dz/payment/rest',
  PRODUCTION: 'https://satim.dz/payment/rest',
} as const;

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  REGISTER_PAYMENT: '/register.do',
  VERIFY_PAYMENT: '/public/acknowledgeTransaction.do',
  REFUND_PAYMENT: '/refund.do',
} as const;

/**
 * Default configuration values
 */
export const DEFAULTS = {
  API_TIMEOUT: 30000, // 30 seconds
  PAYMENT_SESSION_TIMEOUT: 900000, // 15 minutes
  LOG_LEVEL: 'info' as const,
  LOG_DIR: './logs',
  CURRENCY: 'DZD',
} as const;

/**
 * SATIM error codes
 */
export const SATIM_ERROR_CODES = {
  SUCCESS: '0', // No system error
  DUPLICATE_ORDER: '1', // Order already processed
  UNKNOWN_CURRENCY: '3',
  MISSING_PARAMETER: '4', // Required parameter not specified
  INVALID_PARAMETER: '5', // Incorrect parameter value or access denied
  SYSTEM_ERROR: '7',
  INVALID_PAYMENTWAY: '14',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
} as const;

/**
 * Order status codes from SATIM acknowledgeTransaction.do response
 */
export const ORDER_STATUS_CODES: Record<number, string> = {
  0: 'Order registered, but not paid.',
  [-1]: 'Transaction declined - none of the specified statuses is suitable.',
  1: 'Transaction has been approved (one-phase payment) or preauthorization amount was put on hold (two-phase payment).',
  2: 'Amount was deposited successfully.',
  3: 'Authorization has been reversed.',
  4: 'Transaction has been refunded.',
  6: 'Authorization is declined.',
  7: 'Card Added.',
  8: 'Card Updated.',
  9: 'Card verified.',
  10: 'Recurring Template Added.',
  11: 'Debited.'
};

/**
 * Error messages for SATIM register.do endpoint
 */
export const ERROR_MESSAGES: Record<string, string> = {
  '0': 'No system error.',
  '1': 'Order with given order number has already been processed or the childId is incorrect. Order with this number was registered but not paid. Submerchant is blocked or deleted.',
  '3': 'Unknown currency.',
  '4': 'Order number is not specified. Merchant user name is not specified. Amount is not specified. Return URL cannot be empty. Password cannot be empty.',
  '5': 'Incorrect value of a request parameter. Incorrect value in the Language parameter. Access is denied. Merchant must change the password. Invalid jsonParams[].',
  '7': 'System error.',
  '14': 'Paymentway is invalid.',
};

/**
 * Error messages for SATIM acknowledgeTransaction.do endpoint
 */
export const ACKNOWLEDGE_ERROR_MESSAGES: Record<string, string> = {
  '0': 'Success.',
  '2': 'The order is declined because of an error in the payment credentials.',
  '5': 'Access is denied. The user must change the password. orderId is empty.',
  '6': 'Unregistered order Id.',
  '7': 'System error.'
};

/**
 * Error messages for SATIM refund.do endpoint
 */
export const REFUND_ERROR_MESSAGES: Record<string, string> = {
  '0': 'No system error',
  '5': 'Access is denied. The user must change their password. Invalid amount. Deposit amount must be zero, or more than 1 currency unit (for example, 1 euro). Refund with this externalRefundId already exists for merchant.',
  '6': 'Unregistered OrderId.',
  '7': 'System error. Payment must be in a correct state.'
};

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TIMEOUT: 408,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Payment status mapping from SATIM to internal
 */
export const STATUS_MAPPING: Record<string, string> = {
  '0': 'success', // Transaction approved
  '1': 'success', // Transaction approved (deposited)
  '2': 'success', // Transaction approved (reversed)
  '3': 'failed', // Transaction declined
  '4': 'pending', // Transaction pending
  '5': 'failed', // Card blocked
  '6': 'cancelled', // Transaction cancelled
  'DEPOSITED': 'success',
  'REVERSED': 'success',
  'DECLINED': 'failed',
  'CANCELLED': 'cancelled',
  'PENDING': 'pending',
};

/**
 * Currency code for Algerian Dinar (ISO 4217 numeric)
 */
export const CURRENCY_DZD = '012';

/**
 * Currency code mapping (alphabetic to numeric ISO 4217)
 */
export const CURRENCY_CODES: Record<string, string> = {
  'DZD': '012',
  '012': '012', // Allow passing numeric code directly
};

/**
 * Minimum payment amount (50 DA in centimes)
 */
export const MIN_AMOUNT = 5000;
