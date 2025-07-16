import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  google: {
    apiKey: process.env.GEMINI_API_KEY,
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
    privateKey: process.env.GOOGLE_PRIVATE_KEY,
    projectId: process.env.GOOGLE_PROJECT_ID,
  },
  aws: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  redis: {
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD,
  },
  apn: {
    key: process.env.APN_KEY,
    keyId: process.env.APN_KEY_ID,
    teamId: process.env.APN_TEAM_ID,
    bundleId: process.env.APN_BUNDLE_ID,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
  },
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
  },
  transunion: {
    apiKey: process.env.TRANSUNION_API_KEY,
  },
  experian: {
    apiKey: process.env.EXPERIAN_API_KEY,
  },
  zillow: {
    apiKey: process.env.ZILLOW_API_KEY,
  },
  apartmentsCom: {
    apiKey: process.env.APARTMENTS_COM_API_KEY,
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_FROM_NUMBER,
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL,
  },
};
