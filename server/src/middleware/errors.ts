import { Request, Response, NextFunction } from 'express';

export interface ApiError {
  error: string;
  code?: string;
}

export class AppError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Global error handler middleware
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error details
  const reqId = res.getHeader('x-request-id') || 'unknown';
  console.error(`[${reqId}] Error:`, err);

  // Handle known app errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code
    } as ApiError);
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Invalid request data',
      code: 'validation_error'
    } as ApiError);
  }

  // Handle generic errors
  const isDev = process.env.NODE_ENV === 'development';
  return res.status(500).json({
    error: isDev ? err.message : 'Internal server error',
    code: 'internal_error'
  } as ApiError);
}

// Async error wrapper
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}