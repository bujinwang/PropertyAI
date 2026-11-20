// @ts-nocheck
/**
 * Cost-control tests for the TEN billed handlers on /api/ai.
 *
 * Session 10 capped `/api/translation` and `/api/sentiment/analyze` with
 * `billedEndpointGuards.ts`. This router — 34 handlers, mounted live at
 * `routes/index.ts:106` but COMMENTED OUT in app.ts — was missed entirely.
 *
 * Its handlers declare `body('text').isString().notEmpty()` etc., and as of
 * Session 11 those chains are finally ENFORCED. But NONE of them has a length
 * cap. A 10 MB `text` is billed in full by Gemini: the global 100/15min IP
 * limiter bounds REQUESTS, not the cost of each request.
 *
 * The service methods are mocked so the pre-fix behaviour is a clean 200 (not a
 * network timeout with a placeholder key), and so "the vendor was never called"
 * is an assertion rather than an inference from the status code.
 */
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { prisma } from '../config/database';
import { aiService } from '../services/ai.service';
import { resetDatabase } from './testDb';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const CAP = 10_000;
const OVERSIZED = 'x'.repeat(CAP + 1);
const AT_CAP = 'x'.repeat(CAP);

let token: string;

const textResult = { text: 'ok', confidence: 1, metadata: {} };

beforeAll(async () => {
  await resetDatabase(prisma);
  const user = await prisma.user.create({
    data: {
      email: 'ai-billed-caps@example.com',
      password: 'hashed-not-used',
      firstName: 'Billed',
      lastName: 'Caps',
      role: 'ADMIN',
    },
  });
  token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
});

afterAll(async () => {
  jest.restoreAllMocks();
  await prisma.$disconnect();
});

/**
 * Every billed service method resolves. Without this, a placeholder API key
 * would make the pre-fix run fail with a 500 for the WRONG reason (vendor
 * unreachable), and "no vendor call" could not be distinguished from "vendor
 * call that happened to fail".
 */
function mockAllBilledServices() {
  jest.spyOn(aiService, 'generateText').mockResolvedValue(textResult as any);
  jest.spyOn(aiService, 'analyzeSentiment').mockResolvedValue({ label: 'POSITIVE', score: 1, confidence: 1 } as any);
  jest.spyOn(aiService, 'extractEntities').mockResolvedValue({ entities: [] } as any);
  jest.spyOn(aiService, 'classifyText').mockResolvedValue(textResult as any);
  jest.spyOn(aiService, 'chat').mockResolvedValue({ message: 'ok', conversationId: 'c1' } as any);
  jest.spyOn(aiService, 'generatePropertyDescription').mockResolvedValue(textResult as any);
  jest.spyOn(aiService, 'analyzeMaintenanceRequest').mockResolvedValue({
    urgency: 'LOW', category: 'other', estimatedCost: 100, keywords: [], recommendedVendors: [],
  } as any);
  jest.spyOn(aiService, 'generateLeaseSummary').mockResolvedValue(textResult as any);
  jest.spyOn(aiService, 'translateText').mockResolvedValue(textResult as any);
  jest.spyOn(aiService, 'extractKeywords').mockResolvedValue(['ok'] as any);
}

const post = (path: string, body: unknown) =>
  request(app).post(path).set('Authorization', `Bearer ${token}`).send(body);

describe('/api/ai — every billed handler caps its input', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    mockAllBilledServices();
  });

  // [label, path, body, the service method that must not be called]
  const cases: Array<[string, string, unknown, keyof typeof aiService]> = [
    ['generate', '/api/ai/generate', { text: OVERSIZED }, 'generateText'],
    ['sentiment', '/api/ai/sentiment', { text: OVERSIZED }, 'analyzeSentiment'],
    ['entities', '/api/ai/entities', { text: OVERSIZED }, 'extractEntities'],
    ['classify', '/api/ai/classify', { text: OVERSIZED, labels: ['a'] }, 'classifyText'],
    ['chat', '/api/ai/chat', { message: OVERSIZED }, 'chat'],
    ['property-description (location)', '/api/ai/property-description',
      { type: 'house', bedrooms: 2, bathrooms: 1, location: OVERSIZED, amenities: [], price: 100 },
      'generatePropertyDescription'],
    ['maintenance-analysis (title)', '/api/ai/maintenance-analysis',
      { title: OVERSIZED, description: 'short' }, 'analyzeMaintenanceRequest'],
    ['maintenance-analysis (description)', '/api/ai/maintenance-analysis',
      { title: 'short', description: OVERSIZED }, 'analyzeMaintenanceRequest'],
    ['lease-summary', '/api/ai/lease-summary', { leaseText: OVERSIZED }, 'generateLeaseSummary'],
    ['translate', '/api/ai/translate', { text: OVERSIZED, targetLanguage: 'fr' }, 'translateText'],
    ['keywords', '/api/ai/keywords', { text: OVERSIZED }, 'extractKeywords'],
  ];

  it.each(cases)('%s rejects CAP+1 characters with 400', async (_label, path, body, method) => {
    const res = await post(path, body);

    expect(res.status).toBe(400);
    // The cap must reject BEFORE the billed vendor is reached.
    expect(aiService[method] as jest.Mock).not.toHaveBeenCalled();
  });

  it('accepts exactly the cap on a representative billed handler', async () => {
    const res = await post('/api/ai/generate', { text: AT_CAP });

    expect(res.status).toBe(200);
    expect(aiService.generateText).toHaveBeenCalledTimes(1);
  });

  it('rejects a huge context object on /generate (serialized input is billed too)', async () => {
    const res = await post('/api/ai/generate', {
      text: 'short',
      context: 'a'.repeat(CAP + 1),
    });

    expect(res.status).toBe(400);
    expect(aiService.generateText).not.toHaveBeenCalled();
  });

  it('rejects a huge OBJECT context on /chat (the .custom() branch)', async () => {
    // DISTINCT BRANCH from /generate's string `context`. This exercises
    // `body('context').optional().isObject().custom(...)`. Mutation testing
    // showed the object branch was completely unpinned: removing its cap left
    // the whole suite green because every other "context" test sent a string.
    const res = await post('/api/ai/chat', {
      message: 'short',
      context: { notes: 'a'.repeat(CAP + 1) },
    });

    expect(res.status).toBe(400);
    expect(aiService.chat).not.toHaveBeenCalled();
  });

  it('rejects an oversized array element on /classify (labels are in the prompt)', async () => {
    const res = await post('/api/ai/classify', {
      text: 'short',
      labels: ['a'.repeat(CAP + 1)],
    });

    expect(res.status).toBe(400);
    expect(aiService.classifyText).not.toHaveBeenCalled();
  });

  it('rejects a huge amenities entry on /property-description (joined into the prompt)', async () => {
    const res = await post('/api/ai/property-description', {
      type: 'house', bedrooms: 2, bathrooms: 1, location: 'here',
      amenities: ['a'.repeat(CAP + 1)], price: 100,
    });

    expect(res.status).toBe(400);
    expect(aiService.generatePropertyDescription).not.toHaveBeenCalled();
  });
});

describe('/api/ai — usage logging uses the real schema fields', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    mockAllBilledServices();
  });

  it('writes toolName/input/output, not the phantom feature/prompt/response keys', async () => {
    // The schema (AIUsageLog) has `toolName`, `input`, `output`, `cost`.
    // Every handler wrote `feature`/`prompt`/`response` behind `(prisma as any)`,
    // so tsc stayed clean while EVERY successful billed call 500'd at the log
    // write -- after the vendor had already been charged.
    const res = await post('/api/ai/generate', { text: 'a short prompt' });

    expect(res.status).toBe(200);
    const row = await prisma.aIUsageLog.findFirst({ orderBy: { timestamp: 'desc' } });
    expect(row).not.toBeNull();
    expect(row!.toolName).toBe('text_generation');
    expect(JSON.stringify(row!.input)).toContain('a short prompt');
    expect(JSON.stringify(row!.output)).toContain('ok');
  });
});
