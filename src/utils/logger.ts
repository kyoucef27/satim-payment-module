import winston from 'winston';
import path from 'path';
import fs from 'fs';

/**
 * Logger class for SATIM module
 */
export class Logger {
  private logger: winston.Logger;

  constructor(
    logLevel: string = 'info',
    logToFile: boolean = false,
    logDir: string = './logs'
  ) {
    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.printf(
            ({ timestamp, level, message, ...meta }) =>
              `${timestamp} [${level}]: ${message} ${
                Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
              }`
          )
        ),
      }),
    ];

    // Add file transport if enabled
    if (logToFile) {
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      transports.push(
        new winston.transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error',
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        })
      );

      transports.push(
        new winston.transports.File({
          filename: path.join(logDir, 'combined.log'),
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        })
      );
    }

    this.logger = winston.createLogger({
      level: logLevel,
      transports,
    });
  }

  /**
   * Log info message
   */
  info(message: string, meta?: any): void {
    this.logger.info(message, this.sanitizeMeta(meta));
  }

  /**
   * Log warning message
   */
  warn(message: string, meta?: any): void {
    this.logger.warn(message, this.sanitizeMeta(meta));
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | any, meta?: any): void {
    const errorMeta = error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
          ...meta,
        }
      : { error, ...meta };

    this.logger.error(message, this.sanitizeMeta(errorMeta));
  }

  /**
   * Log debug message
   */
  debug(message: string, meta?: any): void {
    this.logger.debug(message, this.sanitizeMeta(meta));
  }

  /**
   * Sanitize metadata to remove sensitive information
   */
  private sanitizeMeta(meta?: any): any {
    if (!meta) return undefined;

    const sanitized = { ...meta };
    const sensitiveKeys = ['password', 'secretKey', 'authorization', 'token', 'cardNumber', 'cvv'];

    for (const key of sensitiveKeys) {
      if (sanitized[key]) {
        sanitized[key] = '***REDACTED***';
      }
    }

    // Recursively sanitize nested objects
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeMeta(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Log payment operation
   */
  logPayment(operation: string, paymentId: string, status: string, meta?: any): void {
    this.info(`Payment ${operation}`, {
      operation,
      paymentId,
      status,
      ...meta,
    });
  }

  /**
   * Log API call
   */
  logAPICall(method: string, url: string, statusCode?: number, duration?: number): void {
    this.debug('API Call', {
      method,
      url,
      statusCode,
      duration: duration ? `${duration}ms` : undefined,
    });
  }
}

// Export singleton instance
let loggerInstance: Logger | null = null;

export function getLogger(
  logLevel?: string,
  logToFile?: boolean,
  logDir?: string
): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger(logLevel, logToFile, logDir);
  }
  return loggerInstance;
}

export function setLogger(logger: Logger): void {
  loggerInstance = logger;
}
