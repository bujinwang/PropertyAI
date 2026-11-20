import { Request, Response, NextFunction } from 'express';
import { body, param, query as queryChain, validationResult } from 'express-validator';
import { validateRequest } from '../middleware/validation';

/**
 * Direct unit test for `validateRequest`.
 *
 * WHY A UNIT TEST AND NOT AN ENDPOINT TEST
 * ----------------------------------------
 * The original defect: `validateRequest` was a middleware FACTORY
 * (`(rules) => (req,res,next) => ...`) but all 38 call sites — in
 * `ai.routes.ts`, `templates.routes.ts`, `googleCalendar.routes.ts` and
 * `alertGroups.routes.ts` — passed it UNINVOKED as a bare array element:
 *
 *     router.get('/:id', [param('id').isString(), validateRequest], handler)
 *
 * Express called the factory, received a closure, and nothing called `next()`.
 * The request never reached the handler and never got a response, so the
 * connection hung until the client timed out.
 *
 * The failure mode is the reason this test is written at this level. A hanging
 * endpoint surfaces as a client-side timeout or a 5-second Jest test timeout,
 * which reads as load or a network problem, not as a code defect — and once a
 * route is rewritten to drop its `validateRequest` reference, no endpoint test
 * can observe the middleware at all. Asserting the contract directly is the only
 * pin that survives that refactor.
 *
 * THE SECOND BUG, AND WHY THE FIRST VERSION OF THIS TEST MISSED IT
 * ---------------------------------------------------------------
 * Fixing the hang turned this into a pure pass-through, and the test below
 * asserted exactly that: "next() is called". A do-nothing function satisfies
 * that perfectly — so the suite was green while all 64 `express-validator`
 * chains in the repo validated nothing. `express-validator` never rejects on
 * its own; `validationResult(req)` is the only thing that reads the failures,
 * and nothing called it.
 *
 * The tests that would have caught it are the ones that matter now:
 *
 *   - a FAILING chain must produce 400 and must NOT call `next()`
 *   - a PASSING chain must call `next()` and must not respond
 *   - validation must actually RUN the chains (they are async — a middleware
 *     that reads `validationResult` without awaiting the chain sees an empty
 *     result and silently passes; see the `runValidationChains` helper)
 *
 * Mutation targets: replacing the 400 branch with `next()`, and dropping the
 * `await` before reading results, each redden a different assertion below.
 */

/** Minimal Express doubles. */
const makeReq = (overrides: Partial<Request> = {}) =>
  ({ headers: {}, body: {}, params: {}, query: {}, ...overrides } as unknown as Request);
const makeRes = () => {
  const res: any = {
    statusCode: undefined as number | undefined,
    payload: undefined as any,
    status: jest.fn().mockImplementation(function (this: any, code: number) {
      res.statusCode = code;
      return res;
    }),
    json: jest.fn().mockImplementation(function (this: any, body: any) {
      res.payload = body;
      return res;
    }),
    send: jest.fn().mockReturnThis(),
  };
  return res as Response & { statusCode?: number; payload?: any };
};

/**
 * express-validator 7 chains are ASYNC: `body('x').isString()` only records a
 * failure once its promise settles. Calling `validateRequest` immediately would
 * read an empty result and pass — which is exactly the silent-pass shape of the
 * bug this file exists to pin.
 *
 * In a real Express route the chains and `validateRequest` are siblings in the
 * same middleware array, so Express has already awaited each chain before
 * reaching `validateRequest`. This helper reproduces that ordering.
 */
async function runValidationChains(chains: any[], req: Request) {
  for (const chain of chains) {
    await chain.run(req);
  }
}

describe('validateRequest', () => {
  it('calls next() when invoked as Express middleware (the call-site style)', () => {
    const next = jest.fn() as unknown as NextFunction;

    // This is EXACTLY what Express does with a bare array element:
    // validateRequest(req, res, next)
    const result = validateRequest(makeReq(), makeRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    // And it must not return a stray closure that Express would ignore.
    expect(typeof result).not.toBe('function');
  });

  it('still supports the factory style', () => {
    const middleware = validateRequest([{ fake: 'rule' }]);

    expect(typeof middleware).toBe('function');

    const next = jest.fn() as unknown as NextFunction;
    (middleware as NextFunction)(makeReq(), makeRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('ENFORCES on the factory path too — the second, unexercised branch', async () => {
    // `validateRequest(rules)` returns its own closure. Mutation-testing showed
    // the enforcement branch inside that closure was completely unpinned: it
    // could have returned `next()` unconditionally and every other test here
    // stayed green. The factory spelling is still supported, so it must also
    // reject.
    const middleware: any = validateRequest([{ fake: 'rule' }]);

    const req = makeReq({ body: {} });
    const res = makeRes();
    const next = jest.fn() as unknown as NextFunction;

    await runValidationChains([body('text').isString().notEmpty()], req);
    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
  });

  it('does not call next() with an error argument on a happy path', () => {
    const next = jest.fn() as unknown as NextFunction;

    validateRequest(makeReq(), makeRes(), next);

    // `next(err)` would route into the error handler and turn a happy path into
    // a 500. On success it must call next() bare.
    expect(next).toHaveBeenCalledWith();
  });

  describe('enforcement (the bug that a pass-through cannot catch)', () => {
    it('rejects with 400 when a body chain fails, and does NOT call next()', async () => {
      const chains = [body('text').isString().notEmpty()];
      // `text` is absent -> `.notEmpty()` fails.
      const req = makeReq({ body: {} });
      const res = makeRes();
      const next = jest.fn() as unknown as NextFunction;

      await runValidationChains(chains, req);
      validateRequest(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(400);
      expect((res as any).payload).toHaveProperty('status', 'error');
      expect(typeof (res as any).payload.message).toBe('string');
    });

    it('rejects a wrong TYPE, which is the case that reaches a billed vendor', async () => {
      // This is the real-world risk: `body('text').isString()` was declared but
      // never enforced, so `/api/ai/generate` passed a non-string straight into
      // a paid AI call.
      const chains = [body('text').isString().notEmpty()];
      const req = makeReq({ body: { text: { $ne: null } } });
      const res = makeRes();
      const next = jest.fn() as unknown as NextFunction;

      await runValidationChains(chains, req);
      validateRequest(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(400);
    });

    it('calls next() when every chain passes', async () => {
      const chains = [body('text').isString().notEmpty()];
      const req = makeReq({ body: { text: 'hello' } });
      const res = makeRes();
      const next = jest.fn() as unknown as NextFunction;

      await runValidationChains(chains, req);
      validateRequest(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.statusCode).toBeUndefined(); // nothing written
    });

    it('enforces param() and query() chains too, not just body()', async () => {
      // A body-only implementation would leave these two branches unpinned.
      const paramReq = makeReq({ params: {} as any });
      const paramRes = makeRes();
      const paramNext = jest.fn() as unknown as NextFunction;
      const paramChains = [param('id').isString().notEmpty()];

      await runValidationChains(paramChains, paramReq);
      validateRequest(paramReq, paramRes, paramNext);
      expect(paramNext).not.toHaveBeenCalled();
      expect(paramRes.statusCode).toBe(400);

      const queryReq = makeReq({ query: { maxLength: '9999' } as any });
      const queryRes = makeRes();
      const queryNext = jest.fn() as unknown as NextFunction;
      const queryChains = [queryChain('maxLength').isInt({ min: 1, max: 4000 })];

      await runValidationChains(queryChains, queryReq);
      validateRequest(queryReq, queryRes, queryNext);
      expect(queryNext).not.toHaveBeenCalled();
      expect(queryRes.statusCode).toBe(400);
    });

    it('surfaces the first failing message and the per-field detail', async () => {
      const chains = [
        body('groupType').isIn(['MAINTENANCE']).withMessage('Invalid group type'),
      ];
      const req = makeReq({ body: { groupType: 'NOT_A_TYPE' } });
      const res = makeRes();
      const next = jest.fn() as unknown as NextFunction;

      await runValidationChains(chains, req);
      validateRequest(req, res, next);

      expect((res as any).payload.message).toBe('Invalid group type');
      expect((res as any).payload.errors[0]).toHaveProperty('field', 'groupType');
    });

    it('does not leak a stack trace or an ORM/vendor detail in the 400 body', async () => {
      const chains = [body('text').isString().notEmpty()];
      const req = makeReq({ body: {} });
      const res = makeRes();
      const next = jest.fn() as unknown as NextFunction;

      await runValidationChains(chains, req);
      validateRequest(req, res, next);

      const serialized = JSON.stringify((res as any).payload);
      expect(serialized).not.toContain('stack');
      expect(serialized).not.toContain('prisma');
    });
  });

  describe('the chains themselves (guards the declaration, not just the middleware)', () => {
    it('a declared chain really does record a failure — so the 64 call sites are live', async () => {
      // If express-validator ever silently stopped recording, this reddens
      // instead of the whole API quietly accepting anything.
      const req = makeReq({ body: {} });
      await runValidationChains([body('text').isString().notEmpty()], req);

      expect(validationResult(req).isEmpty()).toBe(false);
    });
  });
});
