import { Request, Response, NextFunction } from 'express';

export const cacheMiddleware = (req: Request, res: Response, next: NextFunction) => {
  next();
};

export const clearCache = (key: string) => {};
