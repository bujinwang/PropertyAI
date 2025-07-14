import passport from 'passport';
import { Strategy as GoogleStrategy, Profile as GoogleProfile, VerifyCallback } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy, Profile as FacebookProfile } from 'passport-facebook';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const configurePassport = (): void => {
  // Google Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: '/api/auth/google/callback',
      },
      async (accessToken: string, refreshToken: string, profile: GoogleProfile, done: VerifyCallback) => {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found in Google profile'), undefined);
        }

        try {
          let user = await prisma.user.findUnique({ where: { email } });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                firstName: profile.name?.givenName || '',
                lastName: profile.name?.familyName || '',
                password: '', // No password for OAuth users
                role: 'TENANT',
              },
            });
          }

          await (prisma as any).oAuthConnection.upsert({
            where: { provider_userId: { provider: 'GOOGLE', userId: user.id } },
            update: { accessToken, refreshToken, expiresAt: new Date(Date.now() + 3600 * 1000) },
            create: {
              provider: 'GOOGLE',
              providerUserId: profile.id,
              accessToken,
              refreshToken,
              expiresAt: new Date(Date.now() + 3600 * 1000),
              userId: user.id,
            },
          });

          return done(null, user);
        } catch (error) {
          return done(error, undefined);
        }
      }
    )
  );

  // Facebook Strategy
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_CLIENT_ID!,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
        callbackURL: '/api/auth/facebook/callback',
        profileFields: ['id', 'emails', 'name'],
      },
      async (accessToken: string, refreshToken: string, profile: FacebookProfile, done: (error: any, user?: any) => void) => {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found in Facebook profile'), undefined);
        }

        try {
          let user = await prisma.user.findUnique({ where: { email } });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                firstName: profile.name?.givenName || '',
                lastName: profile.name?.familyName || '',
                password: '', // No password for OAuth users
                role: 'TENANT',
              },
            });
          }

          await (prisma as any).oAuthConnection.upsert({
            where: { provider_userId: { provider: 'FACEBOOK', userId: user.id } },
            update: { accessToken, refreshToken, expiresAt: new Date(Date.now() + 3600 * 1000) },
            create: {
              provider: 'FACEBOOK',
              providerUserId: profile.id,
              accessToken,
              refreshToken,
              expiresAt: new Date(Date.now() + 3600 * 1000),
              userId: user.id,
            },
          });

          return done(null, user);
        } catch (error) {
          return done(error, undefined);
        }
      }
    )
  );

  // Configure serialization/deserialization
  passport.serializeUser((user: any, done: (err: any, id?: any) => void) => done(null, user.id));
  passport.deserializeUser(async (id: string, done: (err: any, user?: any) => void) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
};

export default configurePassport;
