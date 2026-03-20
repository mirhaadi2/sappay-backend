import { Response } from 'express';
import logger from '../../utils/logger';

export class ValidationError extends Error {
  constructor(public code: string, public details: any = {}) {
    super();
  }
}

export const validateRequest = (schema: any) => {
  return async (req: any, res: Response, next: any) => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.validated = validated;
      next();
    } catch (error: any) {
      logger.warn('Validation error', { path: req.path, error: error.errors });
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        code: 'VALIDATION_ERROR',
      });
    }
  };
};

export const handleError = (error: any, res: Response) => {
  if (error instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: error.message,
      code: error.code,
    });
  }

  if (error.message?.includes('not found')) {
    return res.status(404).json({
      success: false,
      error: 'Resource not found',
      code: 'NOT_FOUND',
    });
  }

  if (error.message?.includes('already exists')) {
    return res.status(409).json({
      success: false,
      error: 'Resource already exists',
      code: 'DUPLICATE_RESOURCE',
    });
  }

  logger.error('Unhandled error', { error });
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
};
