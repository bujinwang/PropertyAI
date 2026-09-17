import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
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

export const validateRequest = (validationRules: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Basic validation middleware
    // You can implement specific validation logic here
    next();
  };
};
