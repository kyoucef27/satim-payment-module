import {
  generateTransactionId,
  generateOrderId,
  formatAmount,
  centimesToAmount,
  maskCardNumber,
  validateAmount,
  validateCurrency,
  isHTTPS,
  validateUrl,
} from '../../src/utils/helpers';

describe('ID Generators', () => {
  describe('generateTransactionId', () => {
    it('should generate unique transaction ID', () => {
      const id1 = generateTransactionId();
      const id2 = generateTransactionId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^TXN_\d+_[a-f0-9]{8}$/);
    });
  });

  describe('generateOrderId', () => {
    it('should generate order ID with default prefix', () => {
      const id = generateOrderId();

      expect(id).toMatch(/^ORD_\d+_[a-f0-9]{8}$/);
    });

    it('should generate order ID with custom prefix', () => {
      const id = generateOrderId('CUSTOM');

      expect(id).toMatch(/^CUSTOM_\d+_[a-f0-9]{8}$/);
    });
  });
});

describe('Amount utilities', () => {
  describe('formatAmount', () => {
    it('should format amount correctly', () => {
      expect(formatAmount(50.5)).toBe(50.5);
      expect(formatAmount(100)).toBe(100);
      expect(formatAmount(0.1)).toBe(0.1);
    });

    it('should round to 2 decimal places', () => {
      expect(formatAmount(50.555)).toBe(50.56);
      expect(formatAmount(50.554)).toBe(50.55);
    });
  });

  describe('centimesToAmount', () => {
    it('should convert centimes to amount', () => {
      expect(centimesToAmount(5000)).toBe(50);
      expect(centimesToAmount(10050)).toBe(100.5);
      expect(centimesToAmount(1)).toBe(0.01);
    });
  });

  describe('validateAmount', () => {
    it('should validate positive amounts', () => {
      expect(validateAmount(100)).toBe(true);
      expect(validateAmount(0.01)).toBe(true);
    });

    it('should reject invalid amounts', () => {
      expect(validateAmount(0)).toBe(false);
      expect(validateAmount(-100)).toBe(false);
      expect(validateAmount(Infinity)).toBe(false);
      expect(validateAmount(NaN)).toBe(false);
    });
  });
});

describe('Card utilities', () => {
  describe('maskCardNumber', () => {
    it('should mask card number correctly', () => {
      expect(maskCardNumber('1234567890123456')).toBe('****3456');
      expect(maskCardNumber('1234')).toBe('****1234');
    });

    it('should handle short card numbers', () => {
      expect(maskCardNumber('123')).toBe('****');
      expect(maskCardNumber('')).toBe('****');
    });
  });
});

describe('Validation utilities', () => {
  describe('validateCurrency', () => {
    it('should validate valid currency codes', () => {
      expect(validateCurrency('DZD')).toBe(true);
      expect(validateCurrency('USD')).toBe(true);
      expect(validateCurrency('EUR')).toBe(true);
    });

    it('should reject invalid currency codes', () => {
      expect(validateCurrency('dz')).toBe(false);
      expect(validateCurrency('DZDD')).toBe(false);
      expect(validateCurrency('123')).toBe(false);
      expect(validateCurrency('')).toBe(false);
    });
  });

  describe('isHTTPS', () => {
    it('should detect HTTPS URLs', () => {
      expect(isHTTPS('https://example.com')).toBe(true);
      expect(isHTTPS('HTTPS://EXAMPLE.COM')).toBe(true);
    });

    it('should reject non-HTTPS URLs', () => {
      expect(isHTTPS('http://example.com')).toBe(false);
      expect(isHTTPS('ftp://example.com')).toBe(false);
    });
  });

  describe('validateUrl', () => {
    it('should validate valid URLs', () => {
      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl('http://example.com/path')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validateUrl('not-a-url')).toBe(false);
      expect(validateUrl('')).toBe(false);
      expect(validateUrl('example.com')).toBe(false);
    });
  });
});
