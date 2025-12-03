import Joi from 'joi';
import dotenv from 'dotenv';
import { SatimConfig, ProcessedConfig, Environment } from '../types';
import { SATIM_URLS, DEFAULTS } from './constants';

// Load environment variables
dotenv.config();

/**
 * Configuration validation schema
 */
const configSchema = Joi.object<SatimConfig>({
  environment: Joi.string().valid('sandbox', 'production').required(),
  terminalId: Joi.string().required(),
  username: Joi.string().required(),
  password: Joi.string().required(),
  merchantName: Joi.string().optional(),
  merchantId: Joi.string().optional(),
  apiUrl: Joi.string().uri().optional(),
  returnUrl: Joi.string().uri().optional(),
  failUrl: Joi.string().uri().optional(),
  apiTimeout: Joi.number().min(1000).optional(),
  paymentSessionTimeout: Joi.number().min(60000).optional(),
  enableLogging: Joi.boolean().optional(),
  logLevel: Joi.string().valid('error', 'warn', 'info', 'debug').optional(),
  logToFile: Joi.boolean().optional(),
  logDir: Joi.string().optional(),
});

/**
 * Configuration manager class
 */
export class Config {
  private config: ProcessedConfig;

  constructor(config: SatimConfig) {
    this.config = this.validateAndProcess(config);
  }

  /**
   * Create configuration from environment variables
   */
  static fromEnv(): Config {
    const config: SatimConfig = {
      environment: (process.env.NODE_ENV || 'sandbox') as Environment,
      terminalId: process.env.SATIM_TERMINAL_ID || '',
      username: process.env.SATIM_USERNAME || '',
      password: process.env.SATIM_PASSWORD || '',
      merchantName: process.env.MERCHANT_NAME,
      merchantId: process.env.MERCHANT_ID,
      returnUrl: process.env.RETURN_URL,
      failUrl: process.env.FAIL_URL,
      apiTimeout: process.env.API_TIMEOUT ? parseInt(process.env.API_TIMEOUT) : undefined,
      paymentSessionTimeout: process.env.PAYMENT_SESSION_TIMEOUT
        ? parseInt(process.env.PAYMENT_SESSION_TIMEOUT)
        : undefined,
      enableLogging: process.env.LOG_LEVEL !== undefined,
      logLevel: (process.env.LOG_LEVEL as any) || undefined,
      logToFile: process.env.LOG_TO_FILE === 'true',
      logDir: process.env.LOG_DIR,
    };

    return new Config(config);
  }

  /**
   * Validate and process configuration
   */
  private validateAndProcess(config: SatimConfig): ProcessedConfig {
    const { error, value } = configSchema.validate(config, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      throw new Error(
        `Configuration validation failed: ${error.details.map((d) => d.message).join(', ')}`
      );
    }

    // Set defaults and process
    const processed: ProcessedConfig = {
      ...value,
      apiUrl: value.apiUrl || this.getDefaultApiUrl(value.environment),
      returnUrl: value.returnUrl || '',
      failUrl: value.failUrl || '',
      apiTimeout: value.apiTimeout || DEFAULTS.API_TIMEOUT,
      paymentSessionTimeout: value.paymentSessionTimeout || DEFAULTS.PAYMENT_SESSION_TIMEOUT,
      enableLogging: value.enableLogging ?? true,
      logLevel: value.logLevel || DEFAULTS.LOG_LEVEL,
      logToFile: value.logToFile ?? false,
      logDir: value.logDir || DEFAULTS.LOG_DIR,
      merchantName: value.merchantName || 'Default Merchant',
      merchantId: value.merchantId || value.terminalId,
    };

    return processed;
  }

  /**
   * Get default API URL based on environment
   */
  private getDefaultApiUrl(environment: Environment): string {
    return environment === 'production' ? SATIM_URLS.PRODUCTION : SATIM_URLS.SANDBOX;
  }

  /**
   * Get the processed configuration
   */
  get(): ProcessedConfig {
    return { ...this.config };
  }

  /**
   * Get API base URL
   */
  getApiUrl(): string {
    return this.config.apiUrl;
  }

  /**
   * Get environment
   */
  getEnvironment(): Environment {
    return this.config.environment;
  }

  /**
   * Check if running in production
   */
  isProduction(): boolean {
    return this.config.environment === 'production';
  }

  /**
   * Check if running in sandbox
   */
  isSandbox(): boolean {
    return this.config.environment === 'sandbox';
  }

  /**
   * Get terminal ID
   */
  getTerminalId(): string {
    return this.config.terminalId;
  }

  /**
   * Get credentials
   */
  getCredentials(): { username: string; password: string } {
    return {
      username: this.config.username,
      password: this.config.password,
    };
  }



  /**
   * Update configuration (for testing purposes)
   */
  update(partialConfig: Partial<SatimConfig>): void {
    const merged = { ...this.config, ...partialConfig };
    this.config = this.validateAndProcess(merged);
  }
}
