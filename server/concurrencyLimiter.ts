import type { NextFunction, Request, Response } from 'express';

export function createConcurrencyLimiter(maxConcurrent: number) {
  if (!Number.isInteger(maxConcurrent) || maxConcurrent < 1) {
    throw new Error('maxConcurrent must be a positive integer');
  }

  let activeRequests = 0;

  return (_req: Request, res: Response, next: NextFunction): void => {
    if (activeRequests >= maxConcurrent) {
      res.setHeader('Retry-After', '5');
      res.status(503).json({ error: 'The data service is busy. Please retry shortly.' });
      return;
    }

    activeRequests += 1;
    let released = false;
    const release = (): void => {
      if (released) return;
      released = true;
      activeRequests -= 1;
    };

    res.once('finish', release);
    res.once('close', release);
    next();
  };
}
