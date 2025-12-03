import { Config } from '../../src/config/Config';
import { SatimConfig } from '../../src/types';

describe('Config', () => {
  const validConfig: SatimConfig = {
    environment: 'sandbox',
    terminalId: process.env.SATIM_TERMINAL_ID || 'MOCK_TERMINAL_ID',
    username: process.env.SATIM_USERNAME || 'MOCK_USERNAME',
    password: process.env.SATIM_PASSWORD || 'MOCK_PASSWORD',
    returnUrl: 'https://example.com/return',
  };

  describe('constructor', () => {
    it('should create config with valid input', () => {
      const config = new Config(validConfig);

      expect(config).toBeDefined();
      expect(config.getEnvironment()).toBe('sandbox');
      expect(config.get().terminalId).toBe(validConfig.terminalId);
    });

    it('should throw error for missing required fields', () => {
      const invalidConfig = {
        environment: 'sandbox',
        // missing terminalId
      } as SatimConfig;

      expect(() => new Config(invalidConfig)).toThrow();
    });

    it('should set default values', () => {
      const config = new Config(validConfig);
      const cfg = config.get();

      expect(cfg.apiTimeout).toBeDefined();
      expect(cfg.paymentSessionTimeout).toBeDefined();
      expect(cfg.logLevel).toBe('info');
    });
  });

  describe('getApiUrl', () => {
    it('should return sandbox URL for sandbox environment', () => {
      const config = new Config(validConfig);

      expect(config.getApiUrl()).toContain('test2.satim');
    });

    it('should return production URL for production environment', () => {
      const config = new Config({
        ...validConfig,
        environment: 'production',
      });

      expect(config.getApiUrl()).not.toContain('test');
    });

    it('should use custom API URL if provided', () => {
      const customUrl = 'https://custom.satim.dz/api';
      const config = new Config({
        ...validConfig,
        apiUrl: customUrl,
      });

      expect(config.getApiUrl()).toBe(customUrl);
    });
  });

  describe('environment checks', () => {
    it('should identify sandbox environment', () => {
      const config = new Config(validConfig);

      expect(config.isSandbox()).toBe(true);
      expect(config.isProduction()).toBe(false);
    });

    it('should identify production environment', () => {
      const config = new Config({
        ...validConfig,
        environment: 'production',
      });

      expect(config.isProduction()).toBe(true);
      expect(config.isSandbox()).toBe(false);
    });
  });

  describe('getCredentials', () => {
    it('should return credentials', () => {
      const config = new Config(validConfig);
      const credentials = config.getCredentials();

      expect(credentials).toEqual({
        username: validConfig.username,
        password: validConfig.password,
      });
    });
  });

  describe('update', () => {
    it('should update configuration', () => {
      const config = new Config({
        ...validConfig,
        returnUrl: 'https://example.com/return',
        failUrl: 'https://example.com/failed',
      });
      
      config.update({ 
        terminalId: 'UPDATED123',
        returnUrl: 'https://example.com/return',
        failUrl: 'https://example.com/failed',
      });

      expect(config.get().terminalId).toBe('UPDATED123');
    });
  });
});
