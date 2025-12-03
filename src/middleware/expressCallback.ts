import { Request, Response, NextFunction } from 'express';
import { CallbackHandler } from '../handlers/CallbackHandler';

/**
 * Express middleware for SATIM callbacks
 */
export function createCallbackMiddleware(callbackHandler: CallbackHandler) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await callbackHandler.handle(req, res);
    } catch (error) {
      next(error);
    }
  };
}

/**
 * HTTPS enforcement middleware
 */
export function requireHTTPS(req: Request, res: Response, next: NextFunction): void {
  if (req.protocol !== 'https' && process.env.NODE_ENV === 'production') {
    res.status(403).json({
      success: false,
      message: 'HTTPS required',
    });
    return;
  }
  next();
}

/**
 * Body parser middleware (JSON)
 */
export function bodyParser() {
  return (req: Request, res: Response, next: NextFunction) => {
    let data = '';

    req.on('data', (chunk) => {
      data += chunk;
    });

    req.on('end', () => {
      try {
        req.body = JSON.parse(data);
        next();
      } catch (error) {
        res.status(400).json({
          success: false,
          message: 'Invalid JSON',
        });
      }
    });
  };
}
