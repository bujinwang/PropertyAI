import { Request, Response } from 'express';
import { translationService } from '../services/translation.service';
import { checkBilledText, checkLanguageCode, badRequest } from '../middleware/billedEndpointGuards';

/**
 * `POST /api/translation/translate`
 *
 * Cost profile: Google Translate is billed PER CHARACTER, and `text` comes
 * straight from the body. Before this rewrite the handler forwarded it
 * unvalidated and uncapped, so the only ceiling was `express.json()`'s 100 kb
 * body limit — a body-parser setting, not a policy.
 *
 * Two further defects fixed here:
 *
 *   1. RESPONSE SHAPE. `translationService.translate()` returns an object
 *      (`{ translatedText, detectedSourceLanguage, confidence }`), and the
 *      handler nested it whole: `res.json({ translatedText })` produced
 *      `{ translatedText: { translatedText: '...' } }`. Any consumer doing
 *      `.toUpperCase()` on it would throw; one doing `.toString()` got
 *      `[object Object]`. The string is now unwrapped and the metadata is
 *      surfaced as siblings, so nothing the service provides is lost.
 *
 *   2. KEY LEAK. The old `catch` returned `error.message` verbatim. The
 *      translation service wraps axios errors, and axios embeds the request URL
 *      — which is `.../translate/v2?key=<GOOGLE_TRANSLATE_API_KEY>`. A 403 from
 *      the vendor therefore echoed the platform's API key to any authenticated
 *      caller. Upstream failures now return a fixed 502 message and the detail
 *      is logged server-side only.
 */

const UPSTREAM_FAILURE_MESSAGE = 'Translation is temporarily unavailable. Please try again later.';
const UNEXPECTED_FAILURE_MESSAGE = 'Internal server error';

/**
 * NOTE 3 — THE OUTER try/catch IS NOT DEFENSIVE PADDING.
 *
 * Express 4 does NOT catch a rejected promise from an `async` handler: the
 * request never receives a response, the client waits until it times out, and
 * `server.close()` never resolves. Validation here runs real code
 * (`value.trim()`, a regex), so a throw in that path — from a malformed body,
 * or from a future edit to a guard — would HANG the request rather than fail it.
 *
 * This was found empirically, not theorised: the mutation that disables the
 * `typeof value !== 'string'` check inside `checkBilledText` makes
 * `value.trim()` throw, and with validation outside a try/catch it wedged the
 * whole test suite instead of reddening one test. A hang is the worst failure
 * mode available — it looks like a slow test, and a 5000 ms hook timeout never
 * names the assertion that was supposed to fail.
 */
export const translateText = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { text, targetLanguage, sourceLanguage } = req.body ?? {};

    // Validate BEFORE the billed call. A cap enforced afterwards still pays.
    const textFailure = checkBilledText(text, 'text');
    if (textFailure) return badRequest(res, textFailure);

    const languageFailure = checkLanguageCode(targetLanguage);
    if (languageFailure) return badRequest(res, languageFailure);

    // `sourceLanguage` is optional, but when present it is interpolated into the
    // vendor request, so it gets the same treatment.
    if (sourceLanguage !== undefined && sourceLanguage !== null) {
      const sourceFailure = checkLanguageCode(sourceLanguage, 'sourceLanguage');
      if (sourceFailure) return badRequest(res, sourceFailure);
  }

  try {
    const result = await translationService.translate(
      text as string,
      targetLanguage as string,
      sourceLanguage as string | undefined
    );

    // Unwrap the string, keep the metadata as siblings.
    return res.status(200).json({
      translatedText: result.translatedText,
      detectedSourceLanguage: result.detectedSourceLanguage,
      confidence: result.confidence,
    });
  } catch (error) {
    // Logged, never returned: the message can contain the keyed vendor URL.
    console.error('Translation request failed:', error);
    return res.status(502).json({ status: 'error', message: UPSTREAM_FAILURE_MESSAGE });
  }
  } catch (error) {
    // Safety net for a throw in the VALIDATION path — see NOTE 3 above.
    console.error('Translation request failed unexpectedly:', error);
    return res.status(500).json({ status: 'error', message: UNEXPECTED_FAILURE_MESSAGE });
  }
};
