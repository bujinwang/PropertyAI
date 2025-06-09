"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurePassport = void 0;
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_facebook_1 = require("passport-facebook");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const configurePassport = () => {
    // Google Strategy
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
    }, async (accessToken, refreshToken, profile, done) => {
        var _a, _b, _c, _d;
        const email = (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value;
        if (!email) {
            return done(new Error('No email found in Google profile'), undefined);
        }
        try {
            let user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                user = await prisma.user.create({
                    data: {
                        email,
                        firstName: ((_c = profile.name) === null || _c === void 0 ? void 0 : _c.givenName) || '',
                        lastName: ((_d = profile.name) === null || _d === void 0 ? void 0 : _d.familyName) || '',
                        password: '', // No password for OAuth users
                        role: 'TENANT',
                    },
                });
            }
            await prisma.oAuthConnection.upsert({
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
        }
        catch (error) {
            return done(error, undefined);
        }
    }));
    // Facebook Strategy
    passport_1.default.use(new passport_facebook_1.Strategy({
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: '/api/auth/facebook/callback',
        profileFields: ['id', 'emails', 'name'],
    }, async (accessToken, refreshToken, profile, done) => {
        var _a, _b, _c, _d;
        const email = (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value;
        if (!email) {
            return done(new Error('No email found in Facebook profile'), undefined);
        }
        try {
            let user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                user = await prisma.user.create({
                    data: {
                        email,
                        firstName: ((_c = profile.name) === null || _c === void 0 ? void 0 : _c.givenName) || '',
                        lastName: ((_d = profile.name) === null || _d === void 0 ? void 0 : _d.familyName) || '',
                        password: '', // No password for OAuth users
                        role: 'TENANT',
                    },
                });
            }
            await prisma.oAuthConnection.upsert({
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
        }
        catch (error) {
            return done(error, undefined);
        }
    }));
    // Configure serialization/deserialization
    passport_1.default.serializeUser((user, done) => done(null, user.id));
    passport_1.default.deserializeUser(async (id, done) => {
        try {
            const user = await prisma.user.findUnique({ where: { id } });
            done(null, user);
        }
        catch (error) {
            done(error);
        }
    });
};
exports.configurePassport = configurePassport;
exports.default = exports.configurePassport;
//# sourceMappingURL=passport.js.map