import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const configurePassport = (): void => {
  // Configure Google Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: '/api/auth/google/callback',
  }, async (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void
  ) => {
    try {
      let user = await prisma.user.findUnique({ where: { email: profile.emails?.[0].value || '' } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: profile.emails?.[0].value || '',
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            role: 'TENANT',
            password: '', // OAuth users don't need a password
          }
        });
      }
      done(null, user);
    } catch (error) {
      done(error);
    }
  }));

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