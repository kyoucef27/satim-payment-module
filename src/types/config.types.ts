/**
 * Environment type
 */
export type Environment = 'sandbox' | 'production';

/**
 * SATIM configuration options
 */
export interface SatimConfig {
  environment: Environment;
  
  // SATIM Credentials
  terminalId: string; // Terminal ID provided by SATIM
  username: string; // Merchant username provided by SATIM
  password: string; // Merchant password
  
  merchantName?: string;
  merchantId?: string;
  
  // Optional overrides
  apiUrl?: string;
  returnUrl?: string; // Default return URL for successful payments
  failUrl?: string; // Default fail URL for failed payments
  
  // Timeouts
  apiTimeout?: number; // Default: 30000ms
  paymentSessionTimeout?: number; // Default: 900000ms (15 min)
  
  // Logging
  enableLogging?: boolean;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
  logToFile?: boolean;
  logDir?: string;
}

/**
 * Validated and processed configuration
 */
export interface ProcessedConfig extends Required<Omit<SatimConfig, 'merchantName' | 'merchantId' | 'failUrl'>> {
  merchantName: string;
  merchantId: string;
  failUrl: string;
}

/**
 * API endpoint configuration
 */
export interface ApiEndpoints {
  registerPayment: string;
  verifyPayment: string;
  refundPayment: string;
  transactionStatus: string;
}
