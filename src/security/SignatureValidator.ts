import crypto from 'crypto';
import { SignatureError } from '../utils/errors';

/**
 * Signature validator for SATIM callbacks
 */
export class SignatureValidator {
  private secretKey: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  /**
   * Generate HMAC-SHA256 signature
   */
  generateSignature(payload: Record<string, any>): string {
    const sortedKeys = Object.keys(payload).sort();
    const dataString = sortedKeys.map((key) => `${key}=${payload[key]}`).join('&');

    return crypto
      .createHmac('sha256', this.secretKey)
      .update(dataString)
      .digest('hex')
      .toUpperCase();
  }

  /**
   * Verify signature from SATIM callback
   */
  verifySignature(payload: Record<string, any>, receivedSignature: string): boolean {
    const expectedSignature = this.generateSignature(payload);
    return this.secureCompare(expectedSignature, receivedSignature);
  }

  /**
   * Secure string comparison to prevent timing attacks
   */
  private secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    try {
      return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    } catch {
      return false;
    }
  }

  /**
   * Generate signature for API request
   */
  signRequest(
    terminalId: string,
    orderId: string,
    amount: number,
    currency: string,
    timestamp: string
  ): string {
    const payload = {
      terminalId,
      orderId,
      amount: amount.toString(),
      currency,
      timestamp,
    };

    return this.generateSignature(payload);
  }

  /**
   * Verify callback with detailed validation
   */
  verifyCallback(callbackData: Record<string, any>, signature: string): void {
    if (!signature) {
      throw new SignatureError('Missing signature in callback');
    }

    // Extract signature from payload for verification
    const { signature: _, ...payload } = callbackData;

    const isValid = this.verifySignature(payload, signature);

    if (!isValid) {
      throw new SignatureError('Invalid signature', {
        received: signature,
        payload: Object.keys(payload),
      });
    }
  }
}

/**
 * Hash data using SHA-256
 */
export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate random string
 */
export function generateRandomString(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Encrypt sensitive data (AES-256-CBC)
 */
export function encrypt(text: string, secretKey: string): string {
  const key = crypto.createHash('sha256').update(secretKey).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive data (AES-256-CBC)
 */
export function decrypt(encryptedText: string, secretKey: string): string {
  const key = crypto.createHash('sha256').update(secretKey).digest();
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0]!, 'hex');
  const encrypted = parts[1]!;

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Validate HTTPS URL
 */
export function validateHTTPS(url: string): boolean {
  return url.toLowerCase().startsWith('https://');
}

/**
 * Ensure URL is HTTPS
 */
export function ensureHTTPS(url: string): void {
  if (!validateHTTPS(url)) {
    throw new Error(`URL must use HTTPS: ${url}`);
  }
}
