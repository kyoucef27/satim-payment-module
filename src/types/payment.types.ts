/**
 * Payment status enumeration
 */
export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout',
  REFUNDED = 'refunded',
  PARTIAL_REFUND = 'partial_refund',
}

/**
 * Payment order input
 */
export interface PaymentOrder {
  orderId: string;
  amount: number; // Amount in centimes (smallest currency unit)
  currency: string; // e.g., 'DZD'
  customerEmail?: string;
  customerPhone?: string;
  description?: string;
  returnUrl?: string; // URL to redirect after payment
  metadata?: Record<string, any>;
}

/**
 * Payment response from SATIM API
 */
export interface PaymentResponse {
  success: boolean;
  paymentId: string;
  paymentUrl: string; // URL to redirect customer to SATIM payment page
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: Date;
  expiresAt?: Date;
  transactionId?: string;
  message?: string;
}

/**
 * Payment verification result
 */
export interface PaymentVerification {
  success: boolean;
  paymentId: string;
  orderId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  transactionId?: string;
  authorizationCode?: string;
  cardMask?: string; // Masked card number (e.g., "****1234")
  paymentDate?: Date;
  message?: string;
  rawResponse?: any;
}

/**
 * Refund request
 */
export interface RefundRequest {
  paymentId: string;
  amount?: number; // Optional: partial refund. If not provided, full refund
  reason?: string;
}

/**
 * Refund response
 */
export interface RefundResponse {
  success: boolean;
  refundId: string;
  paymentId: string;
  amount: number;
  status: PaymentStatus;
  message?: string;
  refundedAt?: Date;
}

/**
 * Transaction status response
 */
export interface TransactionStatus {
  paymentId: string;
  orderId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  transactionId?: string;
  lastUpdated: Date;
  history?: TransactionHistoryEntry[];
}

/**
 * Transaction history entry
 */
export interface TransactionHistoryEntry {
  status: PaymentStatus;
  timestamp: Date;
  message?: string;
}

/**
 * Callback request payload from SATIM
 */
export interface CallbackRequest {
  paymentId: string;
  orderId: string;
  status: string;
  amount: number;
  currency: string;
  transactionId?: string;
  authorizationCode?: string;
  signature: string;
  timestamp: string;
  [key: string]: any; // Additional fields from SATIM
}

/**
 * Callback response to SATIM
 */
export interface CallbackResponse {
  success: boolean;
  message: string;
  paymentId: string;
}

/**
 * SATIM API error
 */
export interface SatimAPIError extends Error {
  code: string;
  statusCode?: number;
  details?: any;
}
