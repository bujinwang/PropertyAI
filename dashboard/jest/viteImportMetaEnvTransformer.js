/**
 * Jest transformer: `ts-jest`, plus a rewrite of Vite's `import.meta.env`.
 *
 * WHY THIS EXISTS
 * ---------------
 * This app is built by Vite, so 17 source files read configuration through
 * `import.meta.env.VITE_*`. That is valid ESM, but Jest runs CommonJS: `ts-jest`
 * compiles those files down to `require(...)` while leaving `import.meta.env`
 * in the emitted text, and Node then throws
 *
 *     SyntaxError: Cannot use 'import.meta' outside a module
 *
 * at the first `import` of any such file. Because the 17 files are core
 * services (`api.ts`, `authService.ts`, `config/environment.ts`, `App.tsx`, ...)
 * they sit in the import graph of most of the 90 test suites, so the suites
 * failed to even load.
 *
 * WHAT IT DOES
 * ------------
 * Rewrites `import.meta.env` into a reference to `globalThis.__VITE_ENV__`,
 * which `jest/viteEnv.setup.js` populates. Everything else is delegated to the
 * stock `ts-jest` transformer, so compiler behaviour is unchanged.
 *
 * Deliberately NOT solved with `babel-plugin-transform-vite-meta-env`: that
 * needs a new dependency, and `npm install` is unreliable in this environment.
 * This is ~40 lines of dependency-free code in the same spirit.
 */

const tsJest = require('ts-jest');

/**
 * Bumped whenever the rewrite below changes, so Jest's transform cache is
 * invalidated and stale un-rewritten output is never reused.
 */
const REWRITE_VERSION = 'vite-import-meta-env-rewrite:v1';

/** Matches `import.meta.env` as a whole word, leaving the property access that follows intact. */
const IMPORT_META_ENV = /\bimport\.meta\.env\b/g;

/**
 * Reading `globalThis.__VITE_ENV__` inline (rather than assuming it exists)
 * keeps the emitted code self-contained: a file that somehow runs before the
 * setup file still degrades to `undefined` and falls back to its own defaults
 * instead of throwing a ReferenceError.
 */
const ENV_ACCESSOR = '(globalThis.__VITE_ENV__ = globalThis.__VITE_ENV__ || {})';

/** Applies the rewrite to a ts-jest result, which is either a string or `{ code, map }`. */
function rewriteImportMetaEnv(result) {
  if (result == null) return result;

  if (typeof result === 'string') {
    return result.replace(IMPORT_META_ENV, ENV_ACCESSOR);
  }

  if (typeof result.code === 'string') {
    const code = result.code.replace(IMPORT_META_ENV, ENV_ACCESSOR);
    return code === result.code ? result : { ...result, code };
  }

  return result;
}

function createTransformer(transformerConfig) {
  const base = tsJest.default.createTransformer(transformerConfig);

  // Prototype from `base` so every other property Jest may look for
  // (`canInstrument`, `supportsStaticESM`, ...) keeps working; only the
  // four methods below are overridden.
  const transformer = Object.create(base);

  transformer.process = (sourceText, sourcePath, transformOptions) =>
    rewriteImportMetaEnv(base.process(sourceText, sourcePath, transformOptions));

  transformer.processAsync = (sourceText, sourcePath, transformOptions) =>
    Promise.resolve(base.processAsync(sourceText, sourcePath, transformOptions)).then(
      rewriteImportMetaEnv,
    );

  // The cache key must change with the rewrite, otherwise Jest could serve
  // cached output produced before this transformer existed.
  transformer.getCacheKey = (sourceText, sourcePath, transformOptions) =>
    `${base.getCacheKey(sourceText, sourcePath, transformOptions)}:${REWRITE_VERSION}`;

  transformer.getCacheKeyAsync = (sourceText, sourcePath, transformOptions) =>
    Promise.resolve(
      base.getCacheKeyAsync(sourceText, sourcePath, transformOptions),
    ).then((key) => `${key}:${REWRITE_VERSION}`);

  return transformer;
}

module.exports = { createTransformer };
