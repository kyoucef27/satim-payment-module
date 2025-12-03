import { SignatureValidator, hashData, generateRandomString } from '../../src/security/SignatureValidator';

describe('SignatureValidator', () => {
  const secretKey = 'test-secret-key';
  let validator: SignatureValidator;

  beforeEach(() => {
    validator = new SignatureValidator(secretKey);
  });

  describe('generateSignature', () => {
    it('should generate consistent signature for same payload', () => {
      const payload = {
        terminalId: 'TEST123',
        orderId: 'ORDER001',
        amount: '5000',
        currency: 'DZD',
      };

      const signature1 = validator.generateSignature(payload);
      const signature2 = validator.generateSignature(payload);

      expect(signature1).toBe(signature2);
      expect(signature1).toHaveLength(64); // SHA-256 hex length
    });

    it('should generate different signatures for different payloads', () => {
      const payload1 = { orderId: 'ORDER001', amount: '5000' };
      const payload2 = { orderId: 'ORDER002', amount: '5000' };

      const signature1 = validator.generateSignature(payload1);
      const signature2 = validator.generateSignature(payload2);

      expect(signature1).not.toBe(signature2);
    });

    it('should sort keys before generating signature', () => {
      const payload1 = { amount: '5000', orderId: 'ORDER001' };
      const payload2 = { orderId: 'ORDER001', amount: '5000' };

      const signature1 = validator.generateSignature(payload1);
      const signature2 = validator.generateSignature(payload2);

      expect(signature1).toBe(signature2);
    });
  });

  describe('verifySignature', () => {
    it('should verify valid signature', () => {
      const payload = { orderId: 'ORDER001', amount: '5000' };
      const signature = validator.generateSignature(payload);

      const isValid = validator.verifySignature(payload, signature);

      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = { orderId: 'ORDER001', amount: '5000' };
      const invalidSignature = 'INVALID_SIGNATURE';

      const isValid = validator.verifySignature(payload, invalidSignature);

      expect(isValid).toBe(false);
    });

    it('should reject signature for different payload', () => {
      const payload1 = { orderId: 'ORDER001', amount: '5000' };
      const payload2 = { orderId: 'ORDER002', amount: '5000' };
      const signature = validator.generateSignature(payload1);

      const isValid = validator.verifySignature(payload2, signature);

      expect(isValid).toBe(false);
    });
  });

  describe('signRequest', () => {
    it('should generate signature for request', () => {
      const signature = validator.signRequest(
        'TEST123',
        'ORDER001',
        5000,
        'DZD',
        '2024-01-01T00:00:00Z'
      );

      expect(signature).toBeDefined();
      expect(signature).toHaveLength(64);
    });
  });
});

describe('Hash utilities', () => {
  it('should generate consistent hash', () => {
    const data = 'test-data';
    const hash1 = hashData(data);
    const hash2 = hashData(data);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('should generate different hashes for different data', () => {
    const hash1 = hashData('data1');
    const hash2 = hashData('data2');

    expect(hash1).not.toBe(hash2);
  });
});

describe('generateRandomString', () => {
  it('should generate random string of specified length', () => {
    const str = generateRandomString(16);

    expect(str).toHaveLength(32); // hex doubles the length
  });

  it('should generate different strings each time', () => {
    const str1 = generateRandomString();
    const str2 = generateRandomString();

    expect(str1).not.toBe(str2);
  });
});
