/**
 * Global Express type augmentations for the backend.
 *
 * `req.user` is already provided by passport's own global augmentation
 * (`@types/passport`); we only add the project-specific `rawBody` slot here.
 */
declare global {
  namespace Express {
    interface Request {
      /**
       * The exact, unparsed request body bytes.
       *
       * Populated by the `verify` hook on `express.json()` in `src/app.ts`. It is
       * required by Stripe's `webhooks.constructEvent`, which authenticates a
       * webhook by recomputing a signature over the exact bytes Stripe sent.
       * A parsed (`req.body`) object has already been deserialized and cannot be
       * re-serialized byte-for-byte, so it can never be used for verification.
       */
      rawBody?: Buffer;
    }
  }
}

export {};
