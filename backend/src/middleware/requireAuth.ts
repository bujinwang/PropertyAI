import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { prisma } from '../config/database';

/**
 * Deny-by-default authentication guard for the whole `/api` surface.
 *
 * WHY THIS EXISTS
 * ---------------
 * `src/routes/index.ts` ends with a catch-all 404 (`router.use(\`${API_PREFIX}/*\`)`)
 * and `src/app.ts` mounts the route barrel LAST. That means every router the
 * barrel (or app.ts) mounts is reachable without any per-router auth. An audit
 * found ~188 handlers with no auth at any level — no per-handler middleware, no
 * `router.use()` guard, and no `req.user` check in the controller. Guarding them
 * one by one is N edits that the next added route file will silently bypass.
 *
 * Instead of allow-listing protection (a permanent game of whack-a-mole), this
 * middleware protects EVERYTHING under `/api` by default and only lets a small,
 * explicitly-justified PUBLIC allowlist through. A newly added route is therefore
 * protected automatically — the failure mode is "public endpoint got locked",
 * which is loud and safe, rather than "private endpoint got exposed", which is
 * silent and dangerous.
 *
 * MOUNTING (critical)
 * -------------------
 *   app.use('/api', requireAuth)   // MUST be placed after the `/uploads` static
 *                                  // mount and BEFORE the first `/api` route mount
 * Placed there it covers every router registered below it (all 34 app.ts mounts
 * AND the barrel) with a single statement. In `app.ts` that is between the
 * `/uploads` static mount and the first route mount.
 *
 * REQ.USER CONTRACT
 * -----------------
 * On success `req.user` is set to the **full Prisma `User` row**, matching
 * `authMiddleware.protect` (src/middleware/authMiddleware.ts:20-28), because the
 * majority of existing controllers read `req.user.id` / `req.user.role` from a
 * hydrated row. Note there is a SECOND, incompatible middleware at
 * src/middleware/auth.ts:7 (`isAuthenticated`) that sets `req.user` to the raw
 * JWT **payload** instead; that inconsistency is called out in the task report
 * and deliberately NOT changed here.
 */

/**
 * Paths under `/api` that are intentionally reachable WITHOUT a JWT.
 *
 * Entries are exact paths unless suffixed with `/*` (prefix match). Every entry
 * is derived from evidence: a route's own `@access Public` doc comment, an
 * explicit "public" route group, or an unauthenticated call made by one of the
 * client apps (dashboard / propertyapp / ContractorApp).
 *
 * Keep this list SHORT. Prefer adding auth to a questionable endpoint over
 * widening this list.
 */
export const PUBLIC_API_PATHS: readonly string[] = [
  // --- Health / readiness probes (monitoring, load balancers; never auth'd) ---
  '/health',
  '/health/*',

  // --- Authentication entry points: by definition cannot require a token ---
  // The mobile client (propertyapp/src/constants/api.ts:13) and dashboard
  // (services/authService.ts:16) both POST here while unauthenticated.
  '/auth/login',
  // Public self-serve signup (see PUBLIC_SIGNUP_ROLES); dashboard
  // RegisterScreen.tsx:63 and mobile RegisterScreen both POST here.
  '/auth/register',
  // Token refresh: caller presents a refresh token, not an access token.
  '/auth/refresh-token',
  // Password recovery is necessarily anonymous.
  '/auth/forgot-password',
  '/auth/reset-password',

  // --- OAuth redirects (browser navigations, no Authorization header) ---
  // Only Google and Facebook strategies exist (src/config/passport.ts:10,60), so
  // we enumerate the concrete provider paths rather than a broad '/auth/:provider'
  // wildcard — a wildcard would also expose guarded siblings such as '/auth/me'
  // to the guard bypass. Both spellings are covered: the explicit ones in
  // src/routes/authRoutes.ts and the generic ':provider' pair in
  // src/routes/oauthRoutes.ts.
  '/auth/google',
  '/auth/google/callback',
  '/auth/facebook',
  '/auth/facebook/callback',

  // --- MFA verification during login ---
  // src/routes/mfaRoutes.ts:167-171 — "@desc Verify a MFA code during login",
  // "@access Public". The caller has no token yet (login hasn't completed).
  '/mfa/verify',

  // --- Password reset service ---
  // src/routes/passwordResetRoutes.ts (mounted at /api/password-reset) has no
  // auth middleware at all; both handlers are anonymous by nature. The dashboard
  // calls /auth/password-reset (see dashboardService.ts:1784) — a *different,
  // unregistered* path — so it is captured here too for forward-compat.
  '/password-reset/*',
  '/auth/password-reset',
  '/auth/password-reset/*',

  // --- Public marketplace browsing (anonymous visitors browsing listings) ---
  // Explicit "Public routes (no authentication required)" group in
  // src/routes/rentalRoutes.ts:9-11.
  '/rentals/public',
  '/rentals/public/*',
  // src/routes/publicListing.routes.ts is a single public endpoint by design
  // (getPublicListings); mounted at /api/listings/public.
  '/listings/public',
  // src/routes/searchRoutes.ts:7-26 marks all three endpoints "@access Public";
  // this is anonymous marketplace search over already-public listings.
  '/search/properties',
  '/search/units',
  '/search/property-types',

  // --- Payment-provider webhooks (authenticated by provider SIGNATURE, not JWT) ---
  // Stripe cannot present a user JWT. paymentController.handleWebhook reads the
  // `stripe-signature` header and verifies it in paymentService.processPaymentWebhook;
  // vendorPayment.controller.handleStripeWebhook does the same.
  '/payments/webhooks',
  '/vendor-payments/stripe-webhooks',
];

/** True when `path` matches an allowlist entry (exact, or `prefix/*`). */
export const isPublicApiPath = (path: string): boolean => {
  return PUBLIC_API_PATHS.some((entry) => {
    if (entry.endsWith('/*')) {
      const prefix = entry.slice(0, -2);
      return path === prefix || path.startsWith(`${prefix}/`);
    }
    return path === entry;
  });
};

/**
 * Express middleware: fail closed.
 *
 * - PUBLIC allowlist match -> passthrough (never inspects the token).
 * - Otherwise a valid `Authorization: Bearer <jwt>` is required; the JWT subject
 *   (`payload.id`) is re-hydrated from Postgres and assigned to `req.user`.
 * - Anything missing / expired / malformed / unknown-user -> HTTP 401 and the
 *   request is terminated (no `next()`), so no downstream handler runs.
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  // 1) Explicit public allowlist -> always allowed.
  if (isPublicApiPath(req.path)) {
    return next();
  }

  // 2) Everything else must be authenticated (fail closed).
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith('Bearer')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  const token = authorization.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id?: string };

    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    // Hydrate the FULL user row, matching authMiddleware.protect semantics so
    // existing controllers that assume a hydrated user keep working.
    const user: User | null = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export default requireAuth;
