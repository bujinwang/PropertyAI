import { Request, Response } from 'express';
import { sentimentService } from '../services/sentiment.service';
import { checkBilledText, checkRequiredId, badRequest } from '../middleware/billedEndpointGuards';

/**
 * `POST /api/sentiment/sentiment/analyze`
 *
 * NOTE ON THE PATH: the router file mounts this handler at `/sentiment/analyze`
 * and `app.ts` mounts that router at `/api/sentiment`, so the effective URL is
 * `/api/sentiment/sentiment/analyze` — the segment is doubled. Left as-is: it is
 * the path any existing caller already uses, and renaming it is a breaking
 * change with no consumer to justify it. Recorded rather than silently "fixed".
 *
 * COST PROFILE — TWO vendors per request
 * --------------------------------------
 *   text ──▶ translationService.translate  (billed PER CHARACTER)
 *        ──▶ aiOrchestration.generateText  (billed PER TOKEN)
 *
 * The second hop's prompt is built by interpolating the FIRST hop's output, so
 * cost is roughly quadratic in the input length: a long input is paid for once
 * as characters and again as tokens. `text` was previously unvalidated, so the
 * only bound was the body-parser limit.
 *
 * The cap is applied before EITHER call. Asserting only the translate mock in
 * the suite would leave the token-billed hop free to run.
 *
 * NO KEY LEAK: the old `catch` returned `error.message`, which carries axios
 * internals (and the keyed vendor URL) straight to the caller. `analyze()` also
 * swallows its own errors and returns `NEUTRAL`, so the "success" path here does
 * not mean analysis worked — it is reported truthfully as `sentiment: null`
 * rather than a fabricated neutral, because the service intentionally degrades.
 */

export const analyzeSentiment = async (req: Request, res: Response): Promise<Response> => {
  // The outer try/catch covers the VALIDATION path, not just the vendor call.
  // Express 4 does not catch a rejected promise from an `async` handler — the
  // request hangs with no response and `server.close()` never resolves, which
  // reads as a slow test rather than a failure. See the matching note in
  // `translation.controller.ts`; this was found by mutation, not theorised.
  try {
    const { messageId, text } = req.body ?? {};

    const idFailure = checkRequiredId(messageId, 'messageId');
    if (idFailure) return badRequest(res, idFailure);

    // Same cap as translation: this text is translated AND sent to the model.
    const textFailure = checkBilledText(text, 'text');
    if (textFailure) return badRequest(res, textFailure);

    try {
      // `tryAnalyze`, not `analyze`: `analyze` swallows every failure and
      // returns the string 'NEUTRAL', which is indistinguishable from a real
      // neutral reading. Reporting that to a user would present a vendor outage
      // as a finding. Internal callers keep the degrading `analyze`.
      const sentiment = await sentimentService.tryAnalyze(text as string);
      // `analyzeAndSaveSentiment` only logs — `Message` has no sentiment column —
      // so it is deliberately NOT called here; invoking it would spend a second
      // pair of vendor calls to produce nothing but a console line.
      return res.status(200).json({ messageId, sentiment });
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      return res.status(502).json({
        status: 'error',
        message: 'Sentiment analysis is temporarily unavailable. Please try again later.',
      });
    }
  } catch (error) {
    console.error('Sentiment request failed unexpectedly:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
