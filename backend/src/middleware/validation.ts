import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { validationResult } from 'express-validator';
import { AppError } from './errorMiddleware';

/**
 * Roles that a public, self-serve signup is ALLOWED to claim for itself.
 *
 * SECURITY: `ADMIN` is deliberately absent. Privileged roles must never be
 * self-assignable through the unauthenticated `/api/auth/register` endpoint;
 * admins are provisioned only through the authenticated, admin-guarded
 * `POST /api/users` route (see src/routes/usersRoutes.ts) or the seed script.
 */
export const PUBLIC_SIGNUP_ROLES = [
  'TENANT',
  'OWNER',
  'PROPERTY_MANAGER',
  'USER',
  'VENDOR',
] as const;

export type PublicSignupRole = (typeof PUBLIC_SIGNUP_ROLES)[number];

const PUBLIC_SIGNUP_ROLE_SET: ReadonlySet<string> = new Set(PUBLIC_SIGNUP_ROLES);

/**
 * Canonicalises a client-supplied role to the uppercase `SNAKE_CASE` form used
 * by the Prisma `UserRole` enum, so that client naming conventions do not change
 * the *semantics* of a role:
 *
 *   - `'tenant'`          -> `'TENANT'`
 *   - `'propertyManager'` -> `'PROPERTY_MANAGER'`  (camelCase -> SNAKE_CASE)
 *   - `'property-manager'`-> `'PROPERTY_MANAGER'`  (kebab-case -> SNAKE_CASE)
 *   - `'TENANT'`          -> `'TENANT'`            (idempotent)
 *
 * Normalisation is *only* about casing/separators. It never widens the set of
 * permitted roles: `'ADMIN'`/`'admin'` still normalise to `'ADMIN'`, which is
 * deliberately absent from `PUBLIC_SIGNUP_ROLES`, so privilege escalation stays
 * blocked. Returns `undefined` for non-string input (caller decides policy).
 */
export const normalizeRoleToEnum = (role: unknown): string | undefined => {
  if (typeof role !== 'string') {
    return undefined;
  }
  return role
    .trim()
    .replace(/[\s-]+/g, '_') // kebab / spaced -> snake
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2') // camelCase -> snake_case
    .toUpperCase();
};

/**
 * Normalises a submitted role and returns it as a validated enum value.
 *
 * FAIL CLOSED: returns `undefined` when the normalised value is not on the
 * public allowlist (or not a valid enum member at all). Callers that require an
 * explicit, valid role use `undefined` as the rejection signal; the registration
 * controller uses it to fall back to the Prisma column default when no role was
 * supplied at all.
 */
export const normalizePublicSignupRole = (role: unknown): UserRole | undefined => {
  const normalized = normalizeRoleToEnum(role);
  if (normalized && PUBLIC_SIGNUP_ROLE_SET.has(normalized)) {
    return normalized as UserRole;
  }
  return undefined;
};

export const validateRegistration = (req: Request, res: Response, next: NextFunction) => {
  const { email, password, firstName, lastName, role } = req.body;

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return next(new AppError('Please provide a valid email address', 400));
  }

  // Password validation
  if (!password || password.length < 6) {
    return next(new AppError('Password must be at least 6 characters long', 400));
  }

  // Name validation
  if (!firstName || !lastName) {
    return next(new AppError('First name and last name are required', 400));
  }

  // Role validation (fail CLOSED).
  // - If `role` is omitted, the Prisma-level default (`TENANT`) is applied by
  //   the controller. We do not supply a different default here.
  // - If `role` is present it is normalised to the enum's uppercase SNAKE_CASE
  //   form (so the mobile client's `tenant` / `propertyManager` are accepted)
  //   and MUST then be on the public allowlist. Unknown, typo'd, or privileged
  //   roles (e.g. `ADMIN`) are rejected rather than coerced, so a client bug is
  //   surfaced instead of silently masked.
  if (role !== undefined && role !== null) {
    const normalizedRole = normalizePublicSignupRole(role);
    if (!normalizedRole) {
      return next(
        new AppError(
          `Invalid role. Self-service registration permits only: ${PUBLIC_SIGNUP_ROLES.join(', ')}`,
          400
        )
      );
    }
    // Propagate the canonical value so the controller (and anything else
    // downstream) sees a single, enum-safe representation of the role.
    req.body.role = normalizedRole;
  }

  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  next();
};

/**
 * Terminal validation middleware.
 *
 * WHY THIS IS SHAPED THE WAY IT IS — READ BEFORE CHANGING
 * ------------------------------------------------------
 * This function has now been wrong in TWO different ways, and both bugs were
 * invisible because the symptom was "the request still works".
 *
 * BUG 1 — it was a middleware FACTORY:
 *
 *     export const validateRequest = (validationRules: any) => (req, res, next) => next();
 *
 * but every call site passes it UNINVOKED, as a bare element of the route's
 * middleware array:
 *
 *     router.get('/:id', [param('id').isString(), validateRequest], handler)
 *
 * Express therefore called `validateRequest(req, res, next)`, which ran the
 * FACTORY BODY, built a closure, and returned it. It never called `next()`, so
 * the request never reached the handler and never got a response: the connection
 * hung until the client timed out. 38 routes across 4 files were dead on
 * arrival, and because the failure mode is "hangs" rather than "500" it reads
 * as a network problem, not a code defect.
 *
 * BUG 2 — after Bug 1 was fixed by turning it into a pure pass-through, it
 * validated NOTHING. `express-validator` does not reject anything by itself: its
 * `body()`/`param()`/`query()` chains only *record* failures on the request, and
 * `validationResult(req)` is the only thing that reads them. Nothing in
 * `src/` called `validationResult` — so all 64 chains across `ai.routes.ts`,
 * `googleCalendar.routes.ts` and `alertGroups.routes.ts` were declared,
 * executed, and discarded. The router advertised `body('text').isString()
 * .notEmpty()` and then happily handed `undefined` to a BILLED AI vendor.
 * A controller-level test cannot catch this: the endpoint returns 200 either
 * way. Only asserting the middleware's own contract does.
 *
 * It is now a real Express middleware that BOTH continues and enforces:
 *
 *   - called with `(req, res, next)`  -> Express: runs `validationResult`,
 *     rejects with 400 when any chain failed, otherwise continues.
 *   - called with an array / anything else -> returns that same middleware,
 *     preserving the factory contract so neither spelling can reintroduce a hang.
 *
 * `next()` must be reachable on EVERY success path. Do not add an early `return`
 * that skips it — that is exactly Bug 1.
 *
 * Response shape matches `errorMiddleware` (`{status:'error', message}`) because
 * every other 4xx in this API uses it. `message` is the first failing chain's
 * message so a client gets one actionable sentence, and `errors` carries the
 * per-field detail. Neither leaks internals: these strings come from the route
 * definitions, not from the ORM or the vendor.
 */
function rejectWhenInvalid(req: Request, res: Response, next: NextFunction): any {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array();
  return res.status(400).json({
    status: 'error',
    message: errors[0]?.msg || 'Invalid request',
    errors: errors.map((e) => ({
      field: 'path' in e ? e.path : undefined,
      message: e.msg,
    })),
  });
}

export function validateRequest(
  validationRulesOrReq?: any,
  res?: Response,
  next?: NextFunction
): any {
  // Express call style: (req, res, next). `res` and `next` are both present.
  if (typeof next === 'function') {
    return rejectWhenInvalid(validationRulesOrReq as Request, res as Response, next);
  }

  // Factory call style: (rules) -> middleware. Kept for backwards compatibility.
  return (req: Request, resFn: Response, nextFn: NextFunction) =>
    rejectWhenInvalid(req, resFn, nextFn);
}

