import { v4 as uuidv4 } from 'uuid';

/**
 * Generate unique transaction ID
 */
export function generateTransactionId(): string {
  return `TXN_${Date.now()}_${uuidv4().substring(0, 8)}`;
}

/**
 * Generate unique order ID
 * SATIM requires orderNumber to be max 10 chars, so we use timestamp + random
 */
export function generateOrderId(prefix: string = 'ORD'): string {
  // Generate 10-char unique ID: prefix (3) + timestamp last 4 digits + random 3 digits
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix.substring(0, 3)}${timestamp}${random}`;
}

/**
 * Format amount to centimes (smallest currency unit)
 */
export function formatAmount(amount: number): number {
  // Ensure amount is in centimes
  return Math.round(amount * 100) / 100;
}

/**
 * Convert amount from centimes to main currency unit
 */
export function centimesToAmount(centimes: number): number {
  return centimes / 100;
}

/**
 * Get current timestamp in ISO format
 */
export function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Parse ISO timestamp to Date
 */
export function parseTimestamp(timestamp: string): Date {
  return new Date(timestamp);
}

/**
 * Check if timestamp is expired
 */
export function isExpired(timestamp: string, timeoutMs: number): boolean {
  const expiryTime = new Date(timestamp).getTime() + timeoutMs;
  return Date.now() > expiryTime;
}

/**
 * Mask card number (show only last 4 digits)
 */
export function maskCardNumber(cardNumber: string): string {
  if (!cardNumber || cardNumber.length < 4) {
    return '****';
  }
  return `****${cardNumber.slice(-4)}`;
}

/**
 * Validate amount
 */
export function validateAmount(amount: number): boolean {
  return amount > 0 && Number.isFinite(amount);
}

/**
 * Validate currency code
 */
export function validateCurrency(currency: string): boolean {
  return /^[A-Z]{3}$/.test(currency);
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        const delay = delayMs * Math.pow(2, attempt - 1); // Exponential backoff
        await sleep(delay);
      }
    }
  }

  throw lastError!;
}

/**
 * Sleep helper
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sanitize object for logging (remove sensitive data)
 */
export function sanitizeForLogging(obj: any): any {
  if (!obj) return obj;

  const sanitized = { ...obj };
  const sensitiveKeys = ['password', 'secretKey', 'authorization', 'token', 'cardNumber', 'cvv'];

  for (const key of sensitiveKeys) {
    if (sanitized[key]) {
      sanitized[key] = '***REDACTED***';
    }
  }

  return sanitized;
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if URL is HTTPS
 */
export function isHTTPS(url: string): boolean {
  return url.toLowerCase().startsWith('https://');
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
