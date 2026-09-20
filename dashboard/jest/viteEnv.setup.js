/**
 * Seeds `globalThis.__VITE_ENV__`, the stand-in for Vite's `import.meta.env`
 * that `jest/viteImportMetaEnvTransformer.js` rewrites source references to.
 *
 * Must be registered under `setupFiles` (not `setupFilesAfterEach`) so the value
 * exists before any test imports a module that reads it at module scope —
 * e.g. `services/api.ts:5`, which computes `baseURL` during evaluation.
 *
 * Values mirror what the Vite dev server would inject for a test run: `MODE`
 * is `test`, and `DEV`/`PROD` follow Vite's development semantics so the
 * app's `isDevelopment` branch is the one under test. Any real `VITE_*`
 * variable present in the environment overrides these, so a suite can opt
 * into a specific backend URL by exporting it.
 */

const fromProcessEnv = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => key.startsWith('VITE_')),
);

globalThis.__VITE_ENV__ = {
  MODE: 'test',
  DEV: true,
  PROD: false,
  ...fromProcessEnv,
};
