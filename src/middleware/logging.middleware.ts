import { Request, Response, NextFunction } from 'express';

interface RequestLog {
  timestamp: string;
  method: string;
  path: string;
  statusCode?: number;
  duration?: number;
  userId?: string;
  error?: string;
}

// Format timestamp to readable format: YYYY-MM-DD HH:MM:SS.mmm
const formatTimestamp = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
};

export const requestLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const startTimestamp = formatTimestamp(new Date());
  
  // Get user ID if authenticated
  const userId = (req.session as any)?.userId || (req.query.userId as string) || 'anonymous';

  // Capture the original send function
  const originalSend = res.send;

  // Override send to log response
  res.send = function (data: any) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    const log: RequestLog = {
      timestamp: startTimestamp,
      method: req.method,
      path: req.originalUrl || req.path,
      statusCode,
      duration,
      userId: userId !== 'anonymous' ? userId : undefined,
    };

    // Color code based on status
    let statusColor = '\x1b[32m'; // Green
    if (statusCode >= 400 && statusCode < 500) statusColor = '\x1b[33m'; // Yellow
    if (statusCode >= 500) statusColor = '\x1b[31m'; // Red

    const logMsg = `${startTimestamp} | ${req.method.padEnd(6)} | ${res.statusCode} | ${req.originalUrl || req.path} | ${duration}ms${userId !== 'anonymous' ? ` | User: ${userId}` : ''}`;
    
    console.log(`${statusColor}${logMsg}\x1b[0m`);

    // Call original send
    return originalSend.call(this, data);
  };

  next();
};

export const errorLoggingMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  const timestamp = formatTimestamp(new Date());
  const userId = (req.session as any)?.userId || 'anonymous';
  
  console.error(`\x1b[31m${timestamp} | ERROR | ${req.method} ${req.originalUrl || req.path} | ${err.message} | User: ${userId}\x1b[0m`);
  console.error(err.stack);
  
  next(err);
};
