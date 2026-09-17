import { Request, Response, NextFunction } from 'express';
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
  // - If `role` is present it MUST be on the public allowlist. Unknown, typo'd,
  //   or privileged roles (e.g. `ADMIN`) are rejected rather than coerced, so a
  //   client bug is surfaced instead of silently masked.
  if (role !== undefined && role !== null) {
    if (typeof role !== 'string' || !(PUBLIC_SIGNUP_ROLES as readonly string[]).includes(role)) {
      return next(
        new AppError(
          `Invalid role. Self-service registration permits only: ${PUBLIC_SIGNUP_ROLES.join(', ')}`,
          400
        )
      );
    }
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
