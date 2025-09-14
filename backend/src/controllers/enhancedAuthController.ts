import { Request, Response, NextFunction } from 'express';
import { enhancedAuthService, LoginAttempt } from '../services/enhancedAuthService';
import { biometricAuthService } from '../services/biometricAuthService';
import { AppError } from '../middleware/errorMiddleware';

export const enhancedLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const attempt: LoginAttempt = {
      email,
      password,
      ipAddress: ipAddress as string,
      userAgent,
      deviceInfo: {
        userAgent,
        ip: ipAddress,
      }
    };

    const result = await enhancedAuthService.authenticate(attempt);

    if (result.requiresMFA) {
      return res.json({
        data: {
          requiresMFA: true,
          user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
          }
        }
      });
    }

    res.json({
      data: {
        user: result.user,
        token: result.accessToken,
        refreshToken: result.refreshToken,
        sessionId: result.sessionId,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const verifyMFA = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, code } = req.body;

    const result = await enhancedAuthService.verifyMFA(userId, code);

    res.json({
      data: {
        user: result.user,
        token: result.accessToken,
        refreshToken: result.refreshToken,
        sessionId: result.sessionId,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const biometricRegister = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { credentialId, publicKey, deviceType, deviceModel } = req.body;

    await enhancedAuthService.registerBiometric({
      userId,
      credentialId,
      publicKey,
      deviceType,
      deviceModel,
    });

    res.json({ message: 'Biometric authentication registered successfully' });
  } catch (error) {
    next(error);
  }
};

export const biometricLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { credentialId } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const result = await enhancedAuthService.authenticateBiometric(credentialId, {
      userAgent,
      ip: ipAddress,
    });

    res.json({
      data: {
        user: result.user,
        token: result.accessToken,
        refreshToken: result.refreshToken,
        sessionId: result.sessionId,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getBiometricCredentials = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    const credentials = await biometricAuthService.getUserBiometricCredentials(userId);

    res.json({ data: credentials });
  } catch (error) {
    next(error);
  }
};

export const removeBiometricCredential = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { credentialId } = req.params;

    await biometricAuthService.removeBiometricCredential(userId, credentialId);

    res.json({ message: 'Biometric credential removed successfully' });
  } catch (error) {
    next(error);
  }
};

export const generateBiometricRegistrationOptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    const options = await biometricAuthService.generateRegistrationOptions(userId);

    res.json({ data: options });
  } catch (error) {
    next(error);
  }
};

export const generateBiometricAuthenticationOptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    const options = await biometricAuthService.generateAuthenticationOptions(userId);

    res.json({ data: options });
  } catch (error) {
    next(error);
  }
};

export const updatePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { currentPassword, newPassword } = req.body;

    await enhancedAuthService.updatePassword(userId, currentPassword, newPassword);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    const result = await enhancedAuthService.refreshToken(refreshToken);

    res.json({
      data: {
        token: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await enhancedAuthService.invalidateSession(token);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const getSecuritySettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    const settings = await enhancedAuthService.getSecuritySettings(userId);

    res.json({ data: settings });
  } catch (error) {
    next(error);
  }
};

export const updateSecuritySettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const settings = req.body;

    await enhancedAuthService.updateSecuritySettings(userId, settings);

    res.json({ message: 'Security settings updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const getActiveSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    const sessions = await enhancedAuthService.getActiveSessions(userId);

    res.json({ data: sessions });
  } catch (error) {
    next(error);
  }
};

export const invalidateSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;

    await enhancedAuthService.invalidateSessionById(sessionId);

    res.json({ message: 'Session invalidated successfully' });
  } catch (error) {
    next(error);
  }
};

export const invalidateAllSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    await enhancedAuthService.invalidateAllUserSessions(userId);

    res.json({ message: 'All sessions invalidated successfully' });
  } catch (error) {
    next(error);
  }
};