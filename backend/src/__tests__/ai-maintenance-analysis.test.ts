// @ts-nocheck
/**
 * `POST /api/ai/maintenance-analysis` — a fabricated verdict, and why it is the
 * NORMAL path rather than an exceptional one.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * `ai.service.ts` `analyzeMaintenanceRequest()` ends with:
 *
 *     } catch (error) {
 *       logger.error(...);
 *       return this.basicMaintenanceAnalysis(request);   // <-- fabricated
 *     }
 *
 * `basicMaintenanceAnalysis` is a keyword grep, not a model. It returns
 * `urgency: 'EMERGENCY'`, `estimatedCost: 2000` for any text containing the
 * word "broken" (it is also in the MEDIUM list, but the urgent list is checked
 * first). The route wraps that in `{ success: true, data: result }` with a 200,
 * so a property manager reading `urgency: EMERGENCY` / `estimatedCost: 2000`
 * cannot distinguish a model verdict from a substring match. That is the same
 * defect family as Session 10's `sentimentService.analyze()` returning
 * `'NEUTRAL'` for "the vendor was unreachable".
 *
 * THE PART THAT MAKES IT ROUTINE, NOT RARE
 * ----------------------------------------
 * The success path is:
 *
 *     const model = this.googleAI.getGenerativeModel({ model: 'gemini-pro' });
 *     const result  = await model.generateContent(prompt);
 *     const response = await result.response;
 *     const jsonResponse = JSON.parse(response.text());
 *
 * No `generationConfig.responseMimeType` is set, yet the result is handed
 * straight to `JSON.parse`. Asked for JSON, Gemini routinely answers with a
 * markdown fence:
 *
 *     ```json
 *     { "urgency": "HIGH", ... }
 *     ```
 *
 * `JSON.parse` throws `SyntaxError: Unexpected token` on the backtick, the throw
 * lands in the SAME `catch` that fabricates the verdict, and the caller is told
 * the model was consulted. So the "fallback" is the path most real requests
 * take — the fake is not a degradation, it is the product.
 *
 * THE THIRD DEFECT: THE RETURN TYPE LIES
 * --------------------------------------
 * The declared return type says `estimatedCost: number`. The prompt asks for
 * "Estimated cost range ($50-100, $100-500, $500-2000, $2000+)" — so the model
 * answers with a STRING. `JSON.parse` yields `any`, so `tsc` never sees the
 * mismatch: one branch returns `"$100-500"` and the other returns `2000`, both
 * behind a `number` annotation. Anything doing arithmetic on it gets `NaN`.
 * `urgency` is likewise unchecked, so a model answering "HIGH PRIORITY" produces
 * a value outside the `'LOW'|'MEDIUM'|'HIGH'|'EMERGENCY'` union at runtime.
 *
 * WHAT IS ASSERTED
 * ----------------
 *  1. A vendor outage yields a documented FAILURE, never a fabricated success.
 *  2. The fabrication is pinned specifically — not just "no urgency field".
 *  3. Fenced JSON is parsed, not silently converted into a fake verdict.
 *  4. The declared contract holds: numeric cost, enum urgency.
 *  5. Garbage model output is a failure, not a partial "success".
 *  6. No vendor/ORM detail leaks to the caller.
 *  7. The DEGRADING variant still degrades, so internal callers are unaffected.
 *
 * `aiService.googleAI` is replaced rather than the service method, because the
 * defects live inside the method body. Mocking the method would assert nothing.
 */
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { prisma } from '../config/database';
import { aiService } from '../services/ai.service';
import { resetDatabase } from './testDb';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

let token: string;
let realGoogleAI: any;

/**
 * Swap the Gemini client for a scripted one.
 *
 * `generateContent` is what the method actually calls; `getGenerativeModel` is
 * captured so the test can assert the REQUEST (JSON mode), not only the
 * response — setting `responseMimeType` is the root-cause fix for the fence
 * problem, and a test that only checked parsing would pass on a lucky answer.
 */
function stubGemini(behaviour: { text?: string; reject?: Error }) {
  const calls: any[] = [];
  const generateContent = behaviour.reject
    ? jest.fn().mockRejectedValue(behaviour.reject)
    : jest.fn().mockResolvedValue({ response: { text: () => behaviour.text } });

  const getGenerativeModel = jest.fn((config: any) => {
    calls.push(config);
    return { generateContent };
  });

  (aiService as any).googleAI = { getGenerativeModel };

  return { getGenerativeModel, generateContent, calls };
}

const post = (body: unknown) =>
  request(app)
    .post('/api/ai/maintenance-analysis')
    .set('Authorization', `Bearer ${token}`)
    .send(body);

const REQUEST_BODY = {
  title: 'Broken furnace',
  description: 'The furnace is broken and there is no heat.',
  category: 'HVAC',
};

beforeAll(async () => {
  await resetDatabase(prisma);
  const user = await prisma.user.create({
    data: {
      email: 'ai-maint-analysis@example.com',
      password: 'hashed-not-used',
      firstName: 'Maint',
      lastName: 'Analysis',
      role: 'ADMIN',
    },
  });
  token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
  realGoogleAI = (aiService as any).googleAI;
});

afterEach(() => {
  (aiService as any).googleAI = realGoogleAI;
  jest.restoreAllMocks();
});

afterAll(async () => {
  (aiService as any).googleAI = realGoogleAI;
  await prisma.$disconnect();
});

describe('vendor failure must not be dressed up as analysis', () => {
  it('returns a failure status, not a fabricated 200 verdict', async () => {
    stubGemini({ reject: new Error('503 Service Unavailable from generativelanguage.googleapis.com') });

    const res = await post(REQUEST_BODY);

    // Pre-fix this is 200 + `basicMaintenanceAnalysis`, i.e. a keyword match
    // presented as a model verdict.
    expect(res.status).not.toBe(200);
    expect(res.status).toBeGreaterThanOrEqual(500);
    expect(res.body.success).not.toBe(true);
  });

  it('never returns the specific fabricated values on an outage', async () => {
    stubGemini({ reject: new Error('quota exceeded') });

    const res = await post(REQUEST_BODY);

    // "broken" is in `urgentKeywords`, so the fabricator returns EMERGENCY/2000.
    // Asserting the absence of these exact values is stronger than asserting the
    // absence of the word "urgency": it names the fabrication.
    const body = JSON.stringify(res.body);
    expect(body).not.toContain('EMERGENCY');
    expect(body).not.toContain('2000');
    expect(res.body).not.toHaveProperty('data.urgency');
    expect(res.body).not.toHaveProperty('data.estimatedCost');
  });

  it('does not leak the upstream error detail to the caller', async () => {
    stubGemini({
      reject: new Error('API key AIzaSyFAKE_SENTINEL invalid for googleapis.com/v1beta'),
    });

    const res = await post(REQUEST_BODY);

    // Pin the status FIRST. Without this the test also passes when the route
    // returns a 200 with a fabricated verdict — there is no error to leak, so
    // all three negative assertions below hold for free. Mutation C proved it:
    // every other fabrication test reddened, this one stayed green.
    expect(res.status).toBe(502);

    const body = JSON.stringify(res.body);
    expect(body).not.toContain('AIzaSyFAKE_SENTINEL');
    expect(body).not.toContain('googleapis.com');
    expect(body).not.toContain('stack');
  });
});

describe('a real model answer is parsed and normalised', () => {
  it('parses a markdown-fenced JSON answer instead of falling back', async () => {
    // This is what Gemini actually returns when asked for JSON without
    // `responseMimeType`. Pre-fix, `JSON.parse` throws and the caller is handed
    // the keyword-grep verdict instead of these values.
    stubGemini({
      text: '```json\n{"urgency":"HIGH","category":"HVAC","estimatedCost":350,"keywords":["furnace"],"recommendedVendors":["HVAC Technician"]}\n```',
    });

    const res = await post(REQUEST_BODY);

    expect(res.status).toBe(200);
    expect(res.body.data.urgency).toBe('HIGH');
    expect(res.body.data.category).toBe('HVAC');
    expect(res.body.data.estimatedCost).toBe(350);
  });

  it('requests JSON mode from the model (the root cause of the fence)', async () => {
    const stub = stubGemini({
      text: '{"urgency":"LOW","category":"General","estimatedCost":100,"keywords":[],"recommendedVendors":[]}',
    });

    await post(REQUEST_BODY);

    expect(stub.getGenerativeModel).toHaveBeenCalled();
    const config = stub.calls[0];
    expect(config.generationConfig).toBeDefined();
    expect(config.generationConfig.responseMimeType).toBe('application/json');
  });

  it('honours the declared contract: numeric cost, enum urgency', async () => {
    // The prompt asks for a cost RANGE, so a compliant model answers with a
    // string. The declared return type is `number`.
    stubGemini({
      text: '{"urgency":"medium","category":"plumbing","estimatedCost":"$100-500","keywords":[],"recommendedVendors":[]}',
    });

    const res = await post(REQUEST_BODY);

    expect(res.status).toBe(200);
    expect(typeof res.body.data.estimatedCost).toBe('number');
    expect(Number.isFinite(res.body.data.estimatedCost)).toBe(true);
    // Case-insensitive normalisation into the union.
    expect(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY']).toContain(res.body.data.urgency);
  });

  it('reduces a cost RANGE to a single number', async () => {
    // The prompt used to ask for a range ("$100-500") while the declared return
    // type said `number`. `JSON.parse` is `any`, so nothing caught it. The range
    // is now reduced to its midpoint — a documented choice, asserted here so the
    // rule cannot drift silently.
    stubGemini({
      text: '{"urgency":"MEDIUM","category":"plumbing","estimatedCost":"$100-500","keywords":[],"recommendedVendors":[]}',
    });

    const res = await post(REQUEST_BODY);

    expect(res.status).toBe(200);
    expect(res.body.data.estimatedCost).toBe(300);
  });

  it('treats unusable model output as a failure, not a partial success', async () => {
    stubGemini({ text: 'I am sorry, I cannot help with that request.' });

    const res = await post(REQUEST_BODY);

    expect(res.status).not.toBe(200);
    expect(res.body).not.toHaveProperty('data.urgency');
  });

  it('rejects valid JSON whose cost is not a number', async () => {
    // Pins the `Number.isFinite` guard specifically. Without it, `estimatedCost`
    // would reach the caller as the string "unknown" while the declared type says
    // `number` — the exact lie this method exists to fix.
    stubGemini({
      text: '{"urgency":"HIGH","category":"HVAC","estimatedCost":"unknown","keywords":[],"recommendedVendors":[]}',
    });

    const res = await post(REQUEST_BODY);

    expect(res.status).not.toBe(200);
    expect(res.body).not.toHaveProperty('data.estimatedCost');
  });

  it('rejects an urgency outside the declared union', async () => {
    // Pins the union enforcement, which mutation F (return the raw value instead
    // of throwing) proved was completely unpinned: the only urgency the contract
    // test exercised was "medium", which the normaliser maps successfully. A
    // model answering with an invented level would otherwise escape the
    // `'LOW'|'MEDIUM'|'HIGH'|'EMERGENCY'` type at runtime — `tsc` cannot see it,
    // because `JSON.parse` is `any`.
    stubGemini({
      text: '{"urgency":"CRITICAL","category":"HVAC","estimatedCost":350,"keywords":[],"recommendedVendors":[]}',
    });

    const res = await post(REQUEST_BODY);

    expect(res.status).not.toBe(200);
    expect(res.body).not.toHaveProperty('data.urgency');
  });

  it('maps a verbose urgency onto the union instead of rejecting it', async () => {
    // The complement of the test above: a model that says "HIGH PRIORITY" is
    // being obedient, not wrong, so it must be NORMALISED rather than refused.
    // Asserting only rejection would push toward the union check being too
    // strict, which would turn a compliant answer into an outage.
    stubGemini({
      text: '{"urgency":"HIGH PRIORITY","category":"HVAC","estimatedCost":350,"keywords":[],"recommendedVendors":[]}',
    });

    const res = await post(REQUEST_BODY);

    expect(res.status).toBe(200);
    expect(res.body.data.urgency).toBe('HIGH');
  });

  it('rejects JSON that is not an object', async () => {
    // End-to-end pin on the array case.
    stubGemini({ text: '["HIGH","HVAC",350]' });

    const res = await post(REQUEST_BODY);

    expect(res.status).not.toBe(200);
    expect(res.body).not.toHaveProperty('data.urgency');
  });

  it('rejects an object with no usable fields at all', async () => {
    // `{}` passes the non-object guard and must be rejected by the field
    // validators. Together with the array case above this covers both layers.
    stubGemini({ text: '{}' });

    const res = await post(REQUEST_BODY);

    expect(res.status).not.toBe(200);
    expect(res.body).not.toHaveProperty('data.urgency');
  });

  it('normalizeMaintenanceAnalysis rejects a non-object at the unit level', async () => {
    // WHY THIS EXISTS: mutation E (delete the non-object guard) left the whole
    // suite GREEN — twice. First because the array test passes for the wrong
    // reason (`parsed.urgency` on an array is `undefined`, which fails the
    // urgency-union check, so the endpoint still returns non-200). Then again
    // after switching to this unit test, because `toThrow()` with no argument
    // accepts ANY throw — and every malformed input below throws somewhere else:
    // the union check, or a `TypeError` on `null`.
    //
    // So the assertion is on the SPECIFIC message. That is the only form that
    // distinguishes "the guard rejected this" from "something downstream
    // happened to fail", which is the same lesson as `toContain` on a plain
    // object being vacuously true.
    const normalize = (aiService as any).normalizeMaintenanceAnalysis.bind(aiService);
    const GUARD_MESSAGE = /non-object/i;

    // An array masquerading as a response.
    expect(() => normalize('["HIGH","HVAC",350]')).toThrow(GUARD_MESSAGE);
    // A bare JSON string.
    expect(() => normalize('"EMERGENCY"')).toThrow(GUARD_MESSAGE);
    // A bare JSON number.
    expect(() => normalize('42')).toThrow(GUARD_MESSAGE);
    // `null` parses successfully but is not an object.
    expect(() => normalize('null')).toThrow(GUARD_MESSAGE);
  });
});

describe('the degrading variant is preserved for internal callers', () => {
  it('analyzeMaintenanceRequest still degrades instead of throwing', async () => {
    // The route switches to a throwing variant. `analyzeMaintenanceRequest`
    // keeps its never-throw contract so any internal caller relying on it is
    // unaffected — pinning this prevents "fix" from silently becoming
    // "change every caller's failure mode".
    stubGemini({ reject: new Error('upstream down') });

    const result = await aiService.analyzeMaintenanceRequest(REQUEST_BODY);

    expect(result).toBeDefined();
    expect(result.urgency).toBeDefined();
    expect(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY']).toContain(result.urgency);
    expect(typeof result.estimatedCost).toBe('number');
  });

  it('the throwing variant propagates', async () => {
    stubGemini({ reject: new Error('upstream down') });

    await expect(
      (aiService as any).tryAnalyzeMaintenanceRequest(REQUEST_BODY)
    ).rejects.toThrow();
  });
});
