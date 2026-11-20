import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

/**
 * Cost controls for endpoints that spend money on a third-party API.
 *
 * WHY THIS MODULE EXISTS
 * ----------------------
 * `POST /api/ai-content/generate`, `POST /api/translation/translate` and
 * `POST /api/sentiment/sentiment/analyze` all forward caller-supplied text to a
 * billed vendor. They had no length cap and no throttle, so the only ceiling on
 * spend was `express.json()`'s 100 kb body limit — a body-parser setting, not a
 * policy, and repeatable as fast as a client can send.
 *
 * The controls live here, once, for two reasons:
 *   1. A per-controller copy drifts. The `ai-content` route grew a cap first and
 *      the other two did not, which is how this gap survived an audit pass.
 *   2. The cap and the message must agree. If two files each hold a constant,
 *      the boundary tests pin one and silently validate the other.
 *
 * WHAT THIS IS NOT
 * ----------------
 * These are cost ceilings, not authorization. Translation and sentiment are
 * ordinary product features any authenticated user may call; the proportionate
 * control on a cheap-per-unit operation is a cap plus a throttle, not a role
 * gate. Restricting them to operators would be an over-restriction.
 */

/**
 * Largest free-text payload forwarded to a billed vendor, in characters.
 *
 * 10 000 characters is roughly 2 500 tokens — comfortably more than any real
 * listing description, maintenance note or chat message, and small enough that
 * a single request cannot produce a surprising invoice. It also bounds the
 * SECOND hop of the sentiment pipeline, whose prompt interpolates the
 * translated text and therefore inherits this bound.
 */
export const MAX_BILLED_TEXT_CHARS = 10_000;

/** Language codes are BCP-47-ish: a primary subtag of 2-3 letters, optionally
 * followed by a region/script subtag. Anything else is not a language and must
 * never reach the vendor request. */
const LANGUAGE_CODE = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;

export type ValidationFailure = { field: string; message: string };

/**
 * Validate a required, non-empty string field and enforce the billed-length cap.
 *
 * Returns `null` on success so callers read as:
 *
 *     const bad = checkBilledText(req.body?.text, 'text');
 *     if (bad) return badRequest(res, bad);
 */
export function checkBilledText(
  value: unknown,
  field: string,
  maxChars: number = MAX_BILLED_TEXT_CHARS
): ValidationFailure | null {
  if (value === undefined || value === null) {
    return { field, message: `${field} is required` };
  }
  if (typeof value !== 'string') {
    // Rejects the object shape the extended query/body parsers can produce
    // (`{ $ne: null }`), which a vendor would otherwise receive verbatim.
    return { field, message: `${field} must be a string` };
  }
  if (value.trim().length === 0) {
    return { field, message: `${field} must not be empty` };
  }
  if (value.length > maxChars) {
    return {
      field,
      message: `${field} exceeds the maximum length of ${maxChars} characters`,
    };
  }
  return null;
}

/** Validate a language code. Returns `null` when acceptable. */
export function checkLanguageCode(value: unknown, field = 'targetLanguage'): ValidationFailure | null {
  if (value === undefined || value === null) {
    return { field, message: `${field} is required` };
  }
  if (typeof value !== 'string') {
    return { field, message: `${field} must be a string` };
  }
  if (!LANGUAGE_CODE.test(value)) {
    return { field, message: `${field} must be a valid language code (e.g. "en", "fr", "pt-BR")` };
  }
  return null;
}

/** Validate a required identifier field. Returns `null` when acceptable. */
export function checkRequiredId(value: unknown, field: string): ValidationFailure | null {
  if (value === undefined || value === null) {
    return { field, message: `${field} is required` };
  }
  if (typeof value !== 'string') {
    return { field, message: `${field} must be a string` };
  }
  if (value.trim().length === 0) {
    return { field, message: `${field} must not be empty` };
  }
  if (value.length > 200) {
    return { field, message: `${field} is unreasonably long` };
  }
  return null;
}

/** Uniform 400 for a validation failure. */
export function badRequest(res: Response, failure: ValidationFailure): Response {
  return res.status(400).json({ status: 'error', message: failure.message });
}

/**
 * Throttle for billed endpoints.
 *
 * 60 calls per 15 minutes per IP: a human translating a listing or checking the
 * tone of a message will not approach this, while it bounds an automated loop to
 * 60 × 10 000 characters per quarter hour instead of unbounded.
 *
 * Keyed by IP rather than user id on purpose — `express-rate-limit` runs before
 * this module's callers read `req.user`, and keying on an unauthenticated value
 * would let a caller rotate it. The global `requireAuth` mount has already
 * rejected anonymous traffic before this runs.
 *
 * In-memory: resets on restart, and is per-process. Adequate for a single
 * instance; a multi-instance deployment needs a shared store (Redis), which is
 * recorded as a follow-up rather than silently assumed.
 */
export const billedEndpointLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests to a metered endpoint. Please try again later.',
  },
});

/**
 * Wrap an async handler so a rejected promise cannot escape.
 *
 * Express 4 does not catch a rejected promise from an async handler: the request
 * HANGS until the client times out, and no response is ever written. Every
 * handler in this family is `async`, so this is a real failure mode, not a
 * theoretical one.
 */
export function asyncHandler(
  fn: (req: Request, res: Response) => Promise<unknown>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    void fn(req, res).catch(next);
  };
}
