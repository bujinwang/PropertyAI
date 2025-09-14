import { Request, Response, NextFunction } from 'express';
import { enhancedAuthService } from '../services/enhancedAuthService';
import { AppError } from './errorMiddleware';

export interface SessionConfig {
  timeout: number; // in milliseconds
  extendOnActivity: boolean;
  maxConcurrentSessions: number;
}

const defaultConfig: SessionConfig = {
  timeout: 3600000, // 1 hour
  extendOnActivity: true,
  maxConcurrentSessions: 5,
};

export const sessionMiddleware = (config: Partial<SessionConfig> = {}) => {
  const sessionConfig = { ...defaultConfig, ...config };

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        return next();
      }

      // Validate session
      const user = await enhancedAuthService.validateSession(token);
      if (!user) {
        return next(new AppError('Session expired or invalid', 401));
      }

      // Check session timeout
      const session = await enhancedAuthService.getSessionByToken(token);
      if (session && session.expiresAt < new Date()) {
        await enhancedAuthService.invalidateSession(token);
        return next(new AppError('Session expired', 401));
      }

      // Extend session if configured
      if (sessionConfig.extendOnActivity && session) {
        const newExpiry = new Date(Date.now() + sessionConfig.timeout);
        await enhancedAuthService.extendSession(session.id, newExpiry);
      }

      // Check concurrent sessions limit
      const activeSessions = await enhancedAuthService.getActiveSessionsCount(user.id);
      if (activeSessions > sessionConfig.maxConcurrentSessions) {
        // Invalidate oldest sessions if limit exceeded
        await enhancedAuthService.cleanupOldSessions(user.id, sessionConfig.maxConcurrentSessions);
      }

      // Attach user to request
      req.user = user;
      (req as any).sessionId = session?.id;

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Helper methods that need to be added to enhancedAuthService
declare module '../services/enhancedAuthService' {
  interface EnhancedAuthService {
    getSessionByToken(token: string): Promise<any>;
    extendSession(sessionId: string, newExpiry: Date): Promise<void>;
    getActiveSessionsCount(userId: string): Promise<number>;
    cleanupOldSessions(userId: string, keepCount: number): Promise<void>;
  }
}