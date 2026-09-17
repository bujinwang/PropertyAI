import rateLimit from 'express-rate-limit';

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Increased limit for development testing
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Rate limiter for the public, unauthenticated `POST /api/auth/register`
 * endpoint.
 *
 * Why tighter than `loginRateLimiter` (50 / 15 min)?
 *  - Registration is far more expensive per request: a bcrypt hash (CPU-bound),
 *    a row insert, and (on the forgot-password / welcome path) outbound email.
 *    Login is a single indexed read plus a bcrypt compare.
 *  - Registration is far rarer: a legitimate human signs up once, not dozens of
 *    times an hour. Under normal use this limit is invisible.
 *  - The endpoint is the entry point for the (now patched) privilege-escalation
 *    attempt and for mass-account-creation / resource-exhaustion abuse, so the
 *    throttle is deliberately low.
 *
 * Chosen values: 5 registrations per IP per hour (windowMs 60 min, max 5). This
 * is 40x tighter than the login limit in throughput terms and is in line with
 * common SaaS/auth-provider defaults (≈5 signups/hour/IP). It comfortably
 * absorbs several people signing up from one shared NAT (household, small
 * office, cafe) while still bounding automated abuse. The limiter is in-memory,
 * so it resets whenever the server restarts.
 */
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations per IP per hour
  message: 'Too many registration attempts from this IP, please try again after an hour',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
