import http from 'http';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { app } from '../app';
import { prisma } from '../config/database';
import { resetDatabase } from './testDb';

/**
 * `/api/translation` and `/api/sentiment/analyze` — unbounded billed cost
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Both surfaces are authenticated by the global `app.use('/api', requireAuth)`
 * mount and gated by NOTHING else. Neither controller reads `req.user`, neither
 * route carries a limiter, and neither validates its input beyond destructuring
 * the body. That is the same defect class as `POST /api/ai-content/generate`,
 * which was closed in the previous pass — except here it costs MORE per request.
 *
 * WHAT A SINGLE REQUEST SPENDS
 * ----------------------------
 * `POST /api/translation/translate`
 *     text ──▶ Google Translate API        (billed PER CHARACTER)
 *
 * `POST /api/sentiment/sentiment/analyze`
 *     text ──▶ translationService.translate  (billed PER CHARACTER)
 *          ──▶ aiOrchestration.generateText  (billed PER TOKEN)
 *     ↑ TWO vendor calls for one HTTP request, and the second one's cost grows
 *       with the length of the FIRST one's output. The prompt is built by
 *       interpolating the translated text, so input length is amplified.
 *
 * Neither has a length cap. `express.json()`'s default 100 kb body limit is the
 * ONLY ceiling, and it is a body-parser setting, not a policy: 100 kb of text is
 * roughly 25 000 tokens, per request, repeatable as fast as the client can send.
 *
 * THE RESPONSE-CONTRACT BUG
 * -------------------------
 * `translationService.translate()` returns an OBJECT
 * (`{ translatedText, detectedSourceLanguage, confidence }`), but the controller
 * does:
 *
 *     const translatedText = await translationService.translate(text, targetLanguage);
 *     res.status(200).json({ translatedText });
 *
 * so the client receives `{ translatedText: { translatedText, ... } }` — a
 * nested object where a string is documented. Any consumer calling
 * `res.data.translatedText.toString()` gets `[object Object]`, and one doing
 * `.toUpperCase()` throws. Nothing in the repo consumes this endpoint, which is
 * exactly why it survived.
 *
 * THE ERROR-LEAK BUG
 * ------------------
 * Both controllers do `catch (error: any) { res.status(500).json({ message:
 * error.message }) }`. For the translation service that message is
 * `Failed to translate text: <axios error>`, which embeds the upstream URL —
 * and that URL carries the API key as a query parameter
 * (`.../translate/v2?key=<GOOGLE_TRANSLATE_API_KEY>`). Axios error messages do
 * include the request URL, so a misconfigured or rate-limited upstream can
 * return the platform's Google API key to any authenticated caller. Asserted
 * below with a sentinel key.
 *
 * WHAT IS *NOT* ASSERTED, AND WHY
 * -------------------------------
 * There is no assertion that a TENANT may not call these. Translation and
 * sentiment are ordinary product features, not operator-only admin writes —
 * restricting them to operators would be an over-restriction, and the fix is a
 * cost ceiling rather than a role gate. The distinguishing constraint versus
 * `POST /generate` is that this is *per-user* spend on a *cheap-per-unit*
 * operation, so a cap plus a throttle is the proportionate control.
 */

// Both services are mocked: no vendor is contacted from a test suite, and the
// mocks are the instrument that proves a rejected request never spent anything.
jest.mock('../services/translation.service', () => ({
  translationService: {
    translate: jest.fn().mockResolvedValue({
      translatedText: 'MOCK-TRANSLATED',
      detectedSourceLanguage: 'en',
      confidence: 0.95,
    }),
    translateMultiple: jest.fn(),
    detectLanguage: jest.fn(),
    getSupportedLanguages: jest.fn().mockReturnValue([]),
    translateWithFallback: jest.fn(),
    translatePropertyDescription: jest.fn(),
  },
}));

jest.mock('../services/aiOrchestration.service', () => ({
  aiOrchestrationService: {
    generateText: jest.fn().mockResolvedValue('POSITIVE'),
    submitWorkflow: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { translationService } = require('../services/translation.service');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { aiOrchestrationService } = require('../services/aiOrchestration.service');

const translateMock = translationService.translate as jest.Mock;
const generateMock = aiOrchestrationService.generateText as jest.Mock;

let server: http.Server;

describe('billed AI surfaces: length caps, validation, no key leak', () => {
  let tenant: { id: string; token: string };

  // The service caps must agree with the controller caps. Kept as constants so
  // the boundary tests below read as "exactly at" and "one over".
  const MAX_TRANSLATE_CHARS = 10_000;

  const signToken = (id: string, role: UserRole): string =>
    jwt.sign({ id, role }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

  const mkUser = async (email: string, role: UserRole) => {
    const user = await prisma.user.create({
      data: {
        email,
        password: 'SENTINEL-BCRYPT-HASH-DO-NOT-LEAK',
        firstName: 'First',
        lastName: 'Fixture',
        role,
        mfaEnabled: true,
        mfaSecret: 'SENTINEL-MFA-SECRET-DO-NOT-LEAK',
      },
    });
    return { id: user.id, token: signToken(user.id, role) };
  };

  const postTranslate = (token: string | null, body: unknown) => {
    const r = request(server).post('/api/translation/translate').send(body as object);
    return token ? r.set('Authorization', `Bearer ${token}`) : r;
  };

  const postSentiment = (token: string | null, body: unknown) => {
    const r = request(server).post('/api/sentiment/sentiment/analyze').send(body as object);
    return token ? r.set('Authorization', `Bearer ${token}`) : r;
  };

  beforeAll(async () => {
    server = await new Promise<http.Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    // Reset AFTER listen(0), BEFORE fixtures: `requireAuth` re-hydrates the user
    // from Postgres, so a neighbour truncating first turns every request into a
    // 401 and the whole file fails for an unrelated reason.
    await resetDatabase(prisma);
    tenant = await mkUser('billed-tenant@example.com', UserRole.TENANT);
  }, 60000);

  afterAll(async () => {
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  beforeEach(() => {
    translateMock.mockClear();
    generateMock.mockClear();
  });

  // ---------------------------------------------------------------- baseline
  it('rejects anonymous callers on both surfaces', async () => {
    expect((await postTranslate(null, { text: 'hi', targetLanguage: 'fr' })).status).toBe(401);
    expect((await postSentiment(null, { messageId: 'm1', text: 'hi' })).status).toBe(401);
  });

  // ------------------------------------------- 1. translation: input contract
  it('rejects a missing text', async () => {
    const res = await postTranslate(tenant.token, { targetLanguage: 'fr' });
    expect(res.status).toBe(400);
    expect(translateMock).not.toHaveBeenCalled();
  });

  it('rejects a non-string text', async () => {
    // A non-string would be forwarded to the vendor as-is; an object reaches
    // axios as a body field the API ignores, so the caller pays for a request
    // that cannot succeed.
    const res = await postTranslate(tenant.token, { text: { $ne: null }, targetLanguage: 'fr' });
    expect(res.status).toBe(400);
    expect(translateMock).not.toHaveBeenCalled();
  });

  it('rejects an empty or whitespace-only text', async () => {
    expect((await postTranslate(tenant.token, { text: '', targetLanguage: 'fr' })).status).toBe(400);
    expect((await postTranslate(tenant.token, { text: '   ', targetLanguage: 'fr' })).status).toBe(
      400
    );
    expect(translateMock).not.toHaveBeenCalled();
  });

  it('rejects a missing targetLanguage', async () => {
    const res = await postTranslate(tenant.token, { text: 'hello' });
    expect(res.status).toBe(400);
    expect(translateMock).not.toHaveBeenCalled();
  });

  it('rejects a targetLanguage that is not a 2-5 letter code', async () => {
    // The value is interpolated into the vendor request; a long or structured
    // value is not a language and should never reach the billed call.
    const res = await postTranslate(tenant.token, {
      text: 'hello',
      targetLanguage: 'not-a-language-code-at-all',
    });
    expect(res.status).toBe(400);
    expect(translateMock).not.toHaveBeenCalled();
  });

  // --------------------------------------------- 2. translation: cost ceiling
  it('rejects an oversized text BEFORE spending a vendor call', async () => {
    const res = await postTranslate(tenant.token, {
      text: 'x'.repeat(MAX_TRANSLATE_CHARS + 1),
      targetLanguage: 'fr',
    });

    expect(res.status).toBe(400);
    // The decisive assertion. A cap enforced after `translate()` would still
    // return 400 while the characters had already been billed.
    expect(translateMock).not.toHaveBeenCalled();
  });

  it('accepts text exactly at the cap (boundary, over-restriction guard)', async () => {
    const res = await postTranslate(tenant.token, {
      text: 'x'.repeat(MAX_TRANSLATE_CHARS),
      targetLanguage: 'fr',
    });
    expect(res.status).toBe(200);
    expect(translateMock).toHaveBeenCalledTimes(1);
  });

  // ---------------------------------------- 3. translation: response contract
  it('returns translatedText as a STRING, not a nested object', async () => {
    const res = await postTranslate(tenant.token, { text: 'hello', targetLanguage: 'fr' });

    expect(res.status).toBe(200);
    // The documented contract is a string. Pre-fix this is
    // `{ translatedText: { translatedText: 'MOCK-TRANSLATED', ... } }`, so the
    // assertion below fails with an object — and a consumer doing .toUpperCase()
    // on it would throw at runtime.
    expect(typeof res.body.translatedText).toBe('string');
    expect(res.body.translatedText).toBe('MOCK-TRANSLATED');
  });

  it('still surfaces the detected source language alongside the string', async () => {
    const res = await postTranslate(tenant.token, { text: 'hello', targetLanguage: 'fr' });
    expect(res.status).toBe(200);
    // Widening the response must not DROP information the service provides.
    expect(res.body.detectedSourceLanguage).toBe('en');
  });

  // ------------------------------------------------ 4. sentiment: cost ceiling
  it('rejects sentiment text over the cap WITHOUT spending either vendor call', async () => {
    const res = await postSentiment(tenant.token, {
      messageId: 'msg-1',
      text: 'x'.repeat(MAX_TRANSLATE_CHARS + 1),
    });

    expect(res.status).toBe(400);
    // Sentiment has TWO billing hops; both must be untouched. Asserting only the
    // translate mock would leave the Gemini call free to run.
    expect(translateMock).not.toHaveBeenCalled();
    expect(generateMock).not.toHaveBeenCalled();
  });

  it('rejects sentiment with a missing messageId', async () => {
    const res = await postSentiment(tenant.token, { text: 'I am unhappy' });
    expect(res.status).toBe(400);
    expect(translateMock).not.toHaveBeenCalled();
    expect(generateMock).not.toHaveBeenCalled();
  });

  it('rejects sentiment with a non-string text', async () => {
    const res = await postSentiment(tenant.token, { messageId: 'msg-2', text: 42 });
    expect(res.status).toBe(400);
    expect(generateMock).not.toHaveBeenCalled();
  });

  it('accepts a legitimate sentiment request', async () => {
    const res = await postSentiment(tenant.token, { messageId: 'msg-3', text: 'I am happy' });
    expect(res.status).toBe(200);
    expect(translateMock).toHaveBeenCalledTimes(1);
    expect(generateMock).toHaveBeenCalledTimes(1);
  });

  // ------------------------------------------------------- 5. no key leakage
  it('does not leak the upstream API key when the vendor call fails', async () => {
    // Axios embeds the request URL in its error message, and the service builds
    // that URL as `.../translate/v2?key=<API_KEY>`. Reproduce that shape.
    const SENTINEL_KEY = 'SENTINEL-GOOGLE-TRANSLATE-KEY-DO-NOT-LEAK';
    translateMock.mockRejectedValueOnce(
      new Error(
        `Failed to translate text: Request failed with status code 403 ` +
          `(url: https://translation.googleapis.com/language/translate/v2?key=${SENTINEL_KEY})`
      )
    );

    const res = await postTranslate(tenant.token, { text: 'hello', targetLanguage: 'fr' });

    expect(res.status).toBe(502);
    const raw = JSON.stringify(res.body ?? {});
    expect(raw).not.toContain(SENTINEL_KEY);
    // Nor the generic internals: the client gets a stable message, the detail
    // goes to the server log.
    expect(raw).not.toContain('translation.googleapis.com');
    expect(raw).not.toContain('status code 403');
  });

  it('reports a pipeline failure honestly instead of a fake NEUTRAL', async () => {
    // `sentimentService.analyze` swallows every error and returns the STRING
    // 'NEUTRAL', so a vendor outage is indistinguishable from a real neutral
    // reading. The controller therefore calls `tryAnalyze`, which propagates.
    //
    // This test previously asserted the opposite (200 + NEUTRAL). That was a
    // B-class assertion — it pinned behaviour the endpoint should not have —
    // and it passed for free, because nothing made the mocked service throw.
    // Mutation K (returning `error.message`) stayed GREENT, which exposed it.
    generateMock.mockRejectedValueOnce(new Error('SENTINEL-UPSTREAM-INTERNAL-DETAIL'));

    const res = await postSentiment(tenant.token, { messageId: 'msg-4', text: 'I am happy' });

    expect(res.status).toBe(502);
    expect(JSON.stringify(res.body ?? {})).not.toContain('SENTINEL-UPSTREAM-INTERNAL-DETAIL');
    // And crucially: no fabricated verdict.
    expect(JSON.stringify(res.body ?? {})).not.toContain('NEUTRAL');
  });

  it('keeps analyze() DEGRADING for internal callers (triage, message persist)', async () => {
    // `tryAnalyze` propagates; `analyze` must NOT, because `triage.service` and
    // `conversation.service.createMessage` depend on a vendor outage not aborting
    // their work. Pinned explicitly so a future "deduplicate these two methods"
    // cleanup cannot silently change that behaviour.
    generateMock.mockRejectedValueOnce(new Error('vendor down'));

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { sentimentService } = require('../services/sentiment.service');
    await expect(sentimentService.analyze('I am happy')).resolves.toBe('NEUTRAL');
  });
});
