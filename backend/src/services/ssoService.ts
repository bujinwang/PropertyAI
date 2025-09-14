import { PrismaClient } from '@prisma/client';
import { enhancedAuthService } from './enhancedAuthService';
import { AppError } from '../middleware/errorMiddleware';
import axios from 'axios';

const prisma = new PrismaClient();

export interface SSOProvider {
  id: string;
  name: string;
  type: 'oauth2' | 'saml' | 'openid';
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
  redirectUri: string;
  isActive: boolean;
}

export interface SSOConfig {
  provider: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes?: string[];
  metadataUrl?: string;
  certificate?: string;
}

export interface SSOUserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  provider: string;
  providerId: string;
}

export class SSOService {
  private readonly DEFAULT_SCOPES = {
    google: ['openid', 'email', 'profile'],
    microsoft: ['openid', 'email', 'profile', 'User.Read'],
    github: ['user:email', 'read:user'],
  };

  private readonly PROVIDER_ENDPOINTS = {
    google: {
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    },
    microsoft: {
      authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
    },
    github: {
      authorizationUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userInfoUrl: 'https://api.github.com/user',
    },
  };

  async configureProvider(config: SSOConfig): Promise<SSOProvider> {
    const endpoints = this.PROVIDER_ENDPOINTS[config.provider as keyof typeof this.PROVIDER_ENDPOINTS];

    if (!endpoints) {
      throw new AppError(`Unsupported SSO provider: ${config.provider}`, 400);
    }

    const ssoConfig = await prisma.sSOConfig.upsert({
      where: {
        provider_providerId: {
          provider: config.provider,
          providerId: config.provider,
        }
      },
      update: {
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        redirectUri: config.redirectUri,
        scopes: config.scopes || this.DEFAULT_SCOPES[config.provider as keyof typeof this.DEFAULT_SCOPES] || ['openid', 'email', 'profile'],
        metadataUrl: config.metadataUrl,
        certificate: config.certificate,
        isActive: true,
      },
      create: {
        provider: config.provider,
        providerId: config.provider,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        redirectUri: config.redirectUri,
        scopes: config.scopes || this.DEFAULT_SCOPES[config.provider as keyof typeof this.DEFAULT_SCOPES] || ['openid', 'email', 'profile'],
        metadataUrl: config.metadataUrl,
        certificate: config.certificate,
        isActive: true,
      }
    });

    return {
      id: ssoConfig.id,
      name: config.provider,
      type: 'oauth2',
      clientId: ssoConfig.clientId,
      clientSecret: ssoConfig.clientSecret,
      authorizationUrl: endpoints.authorizationUrl,
      tokenUrl: endpoints.tokenUrl,
      userInfoUrl: endpoints.userInfoUrl,
      scopes: ssoConfig.scopes,
      redirectUri: ssoConfig.redirectUri,
      isActive: ssoConfig.isActive,
    };
  }

  async getAuthorizationUrl(provider: string, state?: string): Promise<string> {
    const ssoConfig = await prisma.sSOConfig.findFirst({
      where: { provider, isActive: true }
    });

    if (!ssoConfig) {
      throw new AppError(`SSO provider ${provider} not configured`, 404);
    }

    const endpoints = this.PROVIDER_ENDPOINTS[provider as keyof typeof this.PROVIDER_ENDPOINTS];
    if (!endpoints) {
      throw new AppError(`Unsupported SSO provider: ${provider}`, 400);
    }

    const params = new URLSearchParams({
      client_id: ssoConfig.clientId,
      redirect_uri: ssoConfig.redirectUri,
      scope: ssoConfig.scopes.join(' '),
      response_type: 'code',
      access_type: 'offline', // For refresh tokens
      prompt: 'consent', // Force consent screen
    });

    if (state) {
      params.append('state', state);
    }

    return `${endpoints.authorizationUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(provider: string, code: string): Promise<any> {
    const ssoConfig = await prisma.sSOConfig.findFirst({
      where: { provider, isActive: true }
    });

    if (!ssoConfig) {
      throw new AppError(`SSO provider ${provider} not configured`, 404);
    }

    const endpoints = this.PROVIDER_ENDPOINTS[provider as keyof typeof this.PROVIDER_ENDPOINTS];
    if (!endpoints) {
      throw new AppError(`Unsupported SSO provider: ${provider}`, 400);
    }

    try {
      const response = await axios.post(endpoints.tokenUrl, {
        client_id: ssoConfig.clientId,
        client_secret: ssoConfig.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: ssoConfig.redirectUri,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
      });

      return response.data;
    } catch (error: any) {
      throw new AppError(`Failed to exchange code for token: ${error.message}`, 400);
    }
  }

  async getUserInfo(provider: string, accessToken: string): Promise<SSOUserInfo> {
    const ssoConfig = await prisma.sSOConfig.findFirst({
      where: { provider, isActive: true }
    });

    if (!ssoConfig) {
      throw new AppError(`SSO provider ${provider} not configured`, 404);
    }

    const endpoints = this.PROVIDER_ENDPOINTS[provider as keyof typeof this.PROVIDER_ENDPOINTS];
    if (!endpoints) {
      throw new AppError(`Unsupported SSO provider: ${provider}`, 400);
    }

    try {
      const response = await axios.get(endpoints.userInfoUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      return this.normalizeUserInfo(provider, response.data);
    } catch (error: any) {
      throw new AppError(`Failed to get user info: ${error.message}`, 400);
    }
  }

  async authenticateWithSSO(provider: string, code: string, deviceInfo?: any): Promise<{
    user: any;
    accessToken: string;
    refreshToken: string;
    sessionId: string;
    isNewUser: boolean;
  }> {
    // Exchange code for token
    const tokenData = await this.exchangeCodeForToken(provider, code);

    // Get user info
    const userInfo = await this.getUserInfo(provider, tokenData.access_token);

    // Check if user exists
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: userInfo.email },
          {
            OAuthConnection: {
              some: {
                provider: provider,
                providerId: userInfo.id,
              }
            }
          }
        ]
      },
      include: { OAuthConnection: true }
    });

    let isNewUser = false;

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: userInfo.email,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          role: 'TENANT', // Default role
          isActive: true,
          ssoEnabled: true,
          ssoProvider: provider,
          ssoProviderId: userInfo.providerId,
        }
      });
      isNewUser = true;
    } else {
      // Update existing user with SSO info if not already connected
      const existingConnection = user.OAuthConnection.find(conn => conn.provider === provider);
      if (!existingConnection) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            ssoEnabled: true,
            ssoProvider: provider,
            ssoProviderId: userInfo.providerId,
          }
        });
      }
    }

    // Create or update OAuth connection
    await prisma.oAuthConnection.upsert({
      where: {
        provider_providerId: {
          provider: provider,
          providerId: userInfo.id,
        }
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        provider: provider,
        providerId: userInfo.id,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
      }
    });

    // Complete login
    const loginResult = await enhancedAuthService.authenticate({
      email: user.email,
      password: '', // SSO doesn't use password
      deviceInfo,
    });

    // Audit log
    await enhancedAuthService.auditLog(user.id, 'SSO_LOGIN', {
      provider,
      isNewUser,
      deviceInfo,
    });

    return {
      user: loginResult.user,
      accessToken: loginResult.accessToken,
      refreshToken: loginResult.refreshToken,
      sessionId: loginResult.sessionId,
      isNewUser,
    };
  }

  async getConfiguredProviders(): Promise<SSOProvider[]> {
    const configs = await prisma.sSOConfig.findMany({
      where: { isActive: true }
    });

    return configs.map(config => {
      const endpoints = this.PROVIDER_ENDPOINTS[config.provider as keyof typeof this.PROVIDER_ENDPOINTS];

      return {
        id: config.id,
        name: config.provider,
        type: 'oauth2',
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        authorizationUrl: endpoints?.authorizationUrl || '',
        tokenUrl: endpoints?.tokenUrl || '',
        userInfoUrl: endpoints?.userInfoUrl || '',
        scopes: config.scopes,
        redirectUri: config.redirectUri,
        isActive: config.isActive,
      };
    });
  }

  async disableProvider(provider: string): Promise<void> {
    await prisma.sSOConfig.updateMany({
      where: { provider },
      data: { isActive: false }
    });
  }

  private normalizeUserInfo(provider: string, data: any): SSOUserInfo {
    switch (provider) {
      case 'google':
        return {
          id: data.id,
          email: data.email,
          firstName: data.given_name,
          lastName: data.family_name,
          avatar: data.picture,
          provider,
          providerId: data.id,
        };

      case 'microsoft':
        return {
          id: data.id,
          email: data.mail || data.userPrincipalName,
          firstName: data.givenName,
          lastName: data.surname,
          avatar: data.photo,
          provider,
          providerId: data.id,
        };

      case 'github':
        return {
          id: data.id.toString(),
          email: data.email,
          firstName: data.name?.split(' ')[0] || data.login,
          lastName: data.name?.split(' ').slice(1).join(' ') || '',
          avatar: data.avatar_url,
          provider,
          providerId: data.id.toString(),
        };

      default:
        throw new AppError(`Unsupported provider for user info normalization: ${provider}`, 400);
    }
  }
}

export const ssoService = new SSOService();