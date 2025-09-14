import { Request, Response, NextFunction } from 'express';
import { ssoService } from '../services/ssoService';
import { AppError } from '../middleware/errorMiddleware';

export const getSSOProviders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const providers = await ssoService.getConfiguredProviders();
    res.json({ data: providers });
  } catch (error) {
    next(error);
  }
};

export const configureSSOProvider = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider, clientId, clientSecret, redirectUri, scopes, metadataUrl, certificate } = req.body;

    if (!provider || !clientId || !clientSecret || !redirectUri) {
      throw new AppError('Missing required SSO configuration fields', 400);
    }

    const ssoProvider = await ssoService.configureProvider({
      provider,
      clientId,
      clientSecret,
      redirectUri,
      scopes,
      metadataUrl,
      certificate,
    });

    res.json({ data: ssoProvider });
  } catch (error) {
    next(error);
  }
};

export const getAuthorizationUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider } = req.params;
    const { state } = req.query;

    const authorizationUrl = await ssoService.getAuthorizationUrl(provider, state as string);

    res.json({ data: { authorizationUrl } });
  } catch (error) {
    next(error);
  }
};

export const handleSSOCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider } = req.params;
    const { code, state, error, error_description } = req.query;

    if (error) {
      throw new AppError(`SSO authentication failed: ${error_description || error}`, 400);
    }

    if (!code) {
      throw new AppError('Authorization code is required', 400);
    }

    const deviceInfo = {
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    };

    const result = await ssoService.authenticateWithSSO(provider, code as string, deviceInfo);

    res.json({
      data: {
        user: result.user,
        token: result.accessToken,
        refreshToken: result.refreshToken,
        sessionId: result.sessionId,
        isNewUser: result.isNewUser,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const disableSSOProvider = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider } = req.params;

    await ssoService.disableProvider(provider);

    res.json({ message: `SSO provider ${provider} disabled successfully` });
  } catch (error) {
    next(error);
  }
};

export const initiateSSOFlow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider } = req.params;
    const { redirectUrl } = req.query;

    const authorizationUrl = await ssoService.getAuthorizationUrl(provider, redirectUrl as string);

    // Redirect to SSO provider
    res.redirect(authorizationUrl);
  } catch (error) {
    next(error);
  }
};