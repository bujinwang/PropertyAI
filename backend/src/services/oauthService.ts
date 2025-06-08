import { PrismaClient } from '@prisma/client';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as ZillowStrategy } from 'passport-zillow'; // Assuming a Zillow strategy exists

const prisma = new PrismaClient();

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      // Find or create user
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
    async (accessToken, refreshToken, profile, done) => {
      // Find or create user
    }
  )
);

// Zillow Strategy (conceptual)
// Note: Zillow does not have a standard OAuth2 provider. This is a placeholder.
// You would likely use a custom strategy or their API key authentication.
// For the purpose of this example, we'll assume a passport strategy exists.
passport.use(
  new ZillowStrategy(
    {
      clientID: process.env.ZILLOW_CLIENT_ID!,
      clientSecret: process.env.ZILLOW_CLIENT_SECRET!,
      callbackURL: '/api/auth/zillow/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      // Find or create user and store connection
    }
  )
);

export default passport;
