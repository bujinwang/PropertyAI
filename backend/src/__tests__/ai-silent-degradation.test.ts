// @ts-nocheck
/**
 * The other three silent degradations on `/api/ai/*`.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Session 13 fixed `analyzeMaintenanceRequest`: it caught every failure and
 * returned a keyword grep, which the route reported as `{ success: true }`. The
 * same shape remains in THREE more methods, all reachable on live routes:
 *
 *   POST /api/ai/sentiment  -> analyzeSentiment  -> basicSentimentAnalysis
 *   POST /api/ai/entities   -> extractEntities   -> basicEntityExtraction
 *   POST /api/ai/keywords   -> extractKeywords   -> basicKeywordExtraction
 *
 * Each fallback is a local heuristic that produces plausible-looking values, so
 * the caller cannot tell "the model judged this NEUTRAL" from "HuggingFace was
 * unreachable". `analyzeSentiment` is the worst of the three because its
 * fabricator is confidently neutral: an outage on a strongly negative message
 * comes back as `{ label: 'NEUTRAL', score: 0.5 }`, i.e. a vendor failure
 * presented as a finding of no sentiment.
 *
 * WHAT IS *NOT* WRONG HERE
 * ------------------------
 * Unlike `analyzeMaintenanceRequest`, these three have no `JSON.parse` defect —
 * the HF SDK returns structured objects, not model-authored text. So the only
 * defect is the fabricated success. That makes this a smaller, cleaner fix:
 * keep the degrading method, add a throwing `try*` sibling, point the route at
 * the sibling. This is exactly the `sentimentService.analyze`/`tryAnalyze`
 * convention established in Session 10.
 *
 * WHY THE FABRICATED VALUES ARE ASSERTED BY NAME
 * ----------------------------------------------
 * Asserting only "no `label` field" would pass if the shape changed for an
 * unrelated reason. Naming the exact fabricated outputs (`score: 0.5`,
 * `confidence: 0.6`) is what makes the test fail when the fabrication is
 * restored — and those constants are visible in the source, so this is a
 * precise claim, not a guess.
 *
 * THE UNDOTTED `aiService.ts` IS OUT OF SCOPE, DELIBERATELY
 * --------------------------------------------------------
 * `src/services/aiService.ts` (no dot) also has a silently-parsing
 * `analyzeSentiment`, but it is reachable only through `aiController.sentiment`,
 * which is NOT mounted on any router — the only `aiController` functions that
 * are mounted (`getInsights`, `getDashboardSummary`, `getInsightCategories`,
 * `regenerateInsight`, `generateDescription`) never touch it. Fixing dead code
 * would add tests that pin behaviour nothing can call. Recorded, not touched.
 */
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { prisma } from '../config/database';
import { aiService } from '../services/ai.service';
import { resetDatabase } from './testDb';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

let token: string;
let realHfInference: any;
let realGoogleAI: any;

/**
 * Script the HuggingFace client.
 *
 * `analyzeSentiment` and `extractEntities` call `this.hfInference.textClassification`
 * / `.tokenClassification`, so the mock is installed at that level rather than on
 * the service method — mocking the method would bypass the very `catch` under test.
 */
function stubHf(behaviour: { resolve?: any; reject?: Error }) {
  const textClassification = behaviour.reject
    ? jest.fn().mockRejectedValue(behaviour.reject)
    : jest.fn().mockResolvedValue(behaviour.resolve);
  const tokenClassification = textClassification;

  (aiService as any).hfInference = { textClassification, tokenClassification };
  return { textClassification, tokenClassification };
}

/**
 * Script the Gemini client — needed for `extractKeywords`, which despite living
 * next to two HuggingFace calls actually uses `googleAI.getGenerativeModel`.
 * Stubbing HuggingFace for it would silently do nothing and the "vendor is down"
 * test would fail for the wrong reason (no stub took effect, so the real
 * placeholder-key client was hit).
 */
function stubGemini(behaviour: { text?: string; reject?: Error }) {
  const generateContent = behaviour.reject
    ? jest.fn().mockRejectedValue(behaviour.reject)
    : jest.fn().mockResolvedValue({ response: { text: () => behaviour.text } });

  (aiService as any).googleAI = {
    getGenerativeModel: jest.fn(() => ({ generateContent })),
  };
  return { generateContent };
}

const post = (path: string, body: unknown) =>
  request(app).post(path).set('Authorization', `Bearer ${token}`).send(body);

beforeAll(async () => {
  await resetDatabase(prisma);
  const user = await prisma.user.create({
    data: {
      email: 'ai-silent-degrade@example.com',
      password: 'hashed-not-used',
      firstName: 'Silent',
      lastName: 'Degrade',
      role: 'ADMIN',
    },
  });
  token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
  realHfInference = (aiService as any).hfInference;
  realGoogleAI = (aiService as any).googleAI;
});

afterEach(() => {
  (aiService as any).hfInference = realHfInference;
  (aiService as any).googleAI = realGoogleAI;
  jest.restoreAllMocks();
});

afterAll(async () => {
  (aiService as any).hfInference = realHfInference;
  (aiService as any).googleAI = realGoogleAI;
  await prisma.$disconnect();
});

describe('POST /api/ai/sentiment', () => {
  it('reports a vendor outage instead of a fabricated NEUTRAL', async () => {
    stubHf({ reject: new Error('503 Service Unavailable from api-inference.huggingface.co') });

    const res = await post('/api/ai/sentiment', {
      // Deliberately strongly negative, so a fabricated verdict is maximally
      // misleading: the true answer is NEGATIVE, the fabricator says NEUTRAL.
      text: 'This is terrible, awful, horrible. I hate it.',
    });

    // Pre-fix: 200 + { label: 'NEUTRAL', score: 0.5 }.
    expect(res.status).toBeGreaterThanOrEqual(500);
    expect(res.body.success).not.toBe(true);
    expect(res.body).not.toHaveProperty('data.label');
    expect(res.body).not.toHaveProperty('data.score');
  });

  it('never returns the fabricated score on an outage', async () => {
    stubHf({ reject: new Error('model is currently loading') });

    const res = await post('/api/ai/sentiment', { text: 'terrible awful horrible' });

    // 0.5 is the hardcoded neutral score in `basicSentimentAnalysis`; 0.7 is the
    // hardcoded positive/negative score. Neither may appear on a failure.
    const body = JSON.stringify(res.body);
    expect(body).not.toContain('NEUTRAL');
    expect(body).not.toContain('0.5');
    expect(body).not.toContain('0.7');
  });

  it('passes a real vendor verdict through unchanged', async () => {
    stubHf({ resolve: [{ label: 'NEGATIVE', score: 0.9987 }] });

    const res = await post('/api/ai/sentiment', { text: 'terrible awful horrible' });

    expect(res.status).toBe(200);
    expect(res.body.data.label).toBe('NEGATIVE');
    expect(res.body.data.score).toBeCloseTo(0.9987);
  });

  it('treats an empty vendor result as a failure, not a success', async () => {
    // A classifier that loaded but produced nothing returns `[]`.
    stubHf({ resolve: [] });

    const res = await post('/api/ai/sentiment', { text: 'anything at all' });

    expect(res.status).toBe(502);
    expect(res.body).not.toHaveProperty('data.label');
  });

  it('the empty-result guard throws its OWN error, not a TypeError', async () => {
    // WHY THIS EXISTS — and why the endpoint test above is not enough.
    // Mutation D (delete the `if (!prediction) throw`) left the whole suite GREEN.
    // Without the guard, `prediction.label` raises `TypeError: Cannot read
    // properties of undefined`, which propagates and ALSO becomes a 502 — the
    // endpoint outcome is identical, so the guard was unobservable there.
    //
    // The guard therefore needs a unit-level pin on the SPECIFIC message, exactly
    // as Session 13's non-object guard did. A bare `.rejects.toThrow()` would not
    // do: the TypeError satisfies it.
    stubHf({ resolve: [] });

    await expect((aiService as any).tryAnalyzeSentiment('anything'))
      .rejects.toThrow(/returned no prediction/i);
  });

  it('does not leak the upstream error detail', async () => {
    stubHf({ reject: new Error('token hf_FAKE_SENTINEL invalid for api-inference.huggingface.co') });

    const res = await post('/api/ai/sentiment', { text: 'hello' });

    // Pin the status FIRST — otherwise the negative assertions hold for free
    // when the route returns 200 with a fabricated verdict (Session 13's
    // mutation C). A leak test that passes on success tests nothing.
    expect(res.status).toBe(502);
    const body = JSON.stringify(res.body);
    expect(body).not.toContain('hf_FAKE_SENTINEL');
    expect(body).not.toContain('huggingface.co');
    expect(body).not.toContain('stack');
  });
});

describe('POST /api/ai/entities', () => {
  it('reports a vendor outage instead of fabricated regex entities', async () => {
    stubHf({ reject: new Error('503 from api-inference.huggingface.co') });

    const res = await post('/api/ai/entities', {
      // "John Smith" matches `basicEntityExtraction`'s PERSON pattern, so the
      // fabricator would confidently return one entity at confidence 0.6.
      text: 'John Smith reported the leak.',
    });

    expect(res.status).toBeGreaterThanOrEqual(500);
    expect(res.body).not.toHaveProperty('data.entities');
    const body = JSON.stringify(res.body);
    expect(body).not.toContain('"PERSON"');
    expect(body).not.toContain('0.6');
  });

  it('passes real vendor entities through unchanged', async () => {
    stubHf({
      resolve: [
        { word: 'John', entity_group: 'PER', score: 0.99, start: 0, end: 4 },
        { word: 'Smith', entity_group: 'PER', score: 0.98, start: 5, end: 10 },
      ],
    });

    const res = await post('/api/ai/entities', { text: 'John Smith reported the leak.' });

    expect(res.status).toBe(200);
    expect(res.body.data.entities).toHaveLength(2);
    expect(res.body.data.entities[0].label).toBe('PER');
  });
});

describe('POST /api/ai/keywords', () => {
  it('reports a vendor outage instead of fabricated word frequencies', async () => {
    stubGemini({ reject: new Error('503 from generativelanguage.googleapis.com') });

    const res = await post('/api/ai/keywords', {
      text: 'furnace repair furnace broken furnace heating',
      maxKeywords: 3,
    });

    expect(res.status).toBeGreaterThanOrEqual(500);
    expect(res.body).not.toHaveProperty('data.keywords');
    // The fabricator ranks by frequency, so it would return `furnace` first.
    expect(JSON.stringify(res.body)).not.toContain('furnace');
  });

  it('passes real vendor keywords through unchanged', async () => {
    stubGemini({ text: 'hvac, thermostat, warranty' });

    const res = await post('/api/ai/keywords', { text: 'anything', maxKeywords: 3 });

    expect(res.status).toBe(200);
    expect(res.body.data.keywords).toEqual(['hvac', 'thermostat', 'warranty']);
  });
});

describe('the degrading variants are preserved for internal callers', () => {
  it('analyzeSentiment still degrades instead of throwing', async () => {
    // The routes switch to throwing variants. The originals keep their
    // never-throw contract so any best-effort enrichment call site is
    // unaffected — and so this "fix" does not silently become "change every
    // caller's failure mode". Mirrors Session 13's maintenance-analysis split.
    stubHf({ reject: new Error('vendor down') });

    const result = await aiService.analyzeSentiment('good great excellent');

    expect(result).toBeDefined();
    expect(['POSITIVE', 'NEGATIVE', 'NEUTRAL']).toContain(result.label);
    expect(typeof result.score).toBe('number');
  });

  it('extractEntities and extractKeywords still degrade instead of throwing', async () => {
    stubHf({ reject: new Error('vendor down') });

    const entities = await aiService.extractEntities('John Smith reported the leak.');
    const keywords = await aiService.extractKeywords('furnace repair furnace', 2);

    expect(Array.isArray(entities.entities)).toBe(true);
    expect(Array.isArray(keywords)).toBe(true);
  });

  it('the throwing variants propagate', async () => {
    stubHf({ reject: new Error('vendor down') });

    await expect((aiService as any).tryAnalyzeSentiment('x')).rejects.toThrow();
    await expect((aiService as any).tryExtractEntities('x')).rejects.toThrow();
    await expect((aiService as any).tryExtractKeywords('x', 3)).rejects.toThrow();
  });
});
