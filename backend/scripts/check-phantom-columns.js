#!/usr/bin/env node
/**
 * Detect phantom column names in `(prisma as any)` queries.
 *
 * WHY THIS EXISTS
 * ---------------
 * `(prisma as any)` erases type checking. A query naming a column that does
 * not exist therefore compiles cleanly, passes every unit test that mocks the
 * ORM, and throws `PrismaClientValidationError` at runtime -- often AFTER a
 * vendor has already been billed.
 *
 * Two live defects were found this way:
 *   - `GET /api/ai/usage-stats` queried `feature`/`createdAt`; the model has
 *     `toolName`/`timestamp`. The `orderBy` was unconditional, so EVERY
 *     request 500'd. The endpoint had never worked.
 *   - Google AND Facebook sign-in wrote `providerUserId` / `provider_userId`;
 *     the model has `providerId` and `@@unique([provider, providerId])`, so the
 *     compound key is `provider_providerId`. Both OAuth logins failed 100% of
 *     the time.
 *
 * USAGE
 *   node scripts/check-phantom-columns.js            # whole src/
 *   node scripts/check-phantom-columns.js src/x.ts   # one file
 *
 * Exit code 1 if any phantom key is found, so it can gate CI.
 *
 * SCOPE / LIMITS -- read before trusting a clean result
 * -----------------------------------------------------
 * This is a TEXTUAL check, not a type check. It understands:
 *   - `(prisma as any).model.op({ ... })`
 *   - `where` / `orderBy` / `data` / `cursor` given inline
 *   - `where` passed as a shorthand identifier, resolved to a `const x = {...}`
 *   - `...(cond && { key: value })` spreads
 * It does NOT understand computed keys, variables built by mutation, or models
 * reached through a helper. Those are silently skipped -- so a clean run means
 * "no phantom keys among the patterns it can see", not "no phantom keys".
 *
 * The real fix for this class is deleting the `as any`. Run this to find them.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCHEMA = path.join(ROOT, 'prisma', 'schema.prisma');

// Prisma operation ARGUMENTS. Never columns; must never be reported.
const ARGS = new Set([
  'where', 'orderBy', 'select', 'include', 'data', 'take', 'skip', 'cursor',
  'distinct', 'by', 'having', '_count', '_avg', '_sum', '_min', '_max',
  'create', 'update', 'connect', 'connectOrCreate', 'disconnect', 'delete',
  'deleteMany', 'set', 'upsert', 'createMany', 'updateMany', 'increment',
  'decrement', 'multiply', 'divide', 'push', 'unset', 'omit',
  'relationLoadStrategy',
]);

// Filters / logical ops that are valid anywhere inside a where clause.
const PSEUDO = new Set([
  'AND', 'OR', 'NOT', 'some', 'every', 'none', 'is', 'isNot',
  '_count', '_avg', '_sum', '_min', '_max', '_relevance',
  'equals', 'in', 'notIn', 'lt', 'lte', 'gt', 'gte', 'contains',
  'startsWith', 'endsWith', 'mode', 'search', 'has', 'hasEvery', 'hasSome',
  'isEmpty', 'isSet', 'not', '_all',
]);

function parseSchema(file) {
  const text = fs.readFileSync(file, 'utf8');
  const models = {};
  const enums = new Set();
  // model name -> Set of compound-unique key names, e.g.
  //   @@unique([provider, providerId])  ->  "provider_providerId"
  // These are used as `where: { provider_providerId: {...} }`. They look exactly
  // like phantom columns (no such field exists) but are valid Prisma syntax.
  // Without this set the detector reported 12 false positives across 4 files.
  const compound = {};
  for (const m of text.matchAll(/^enum\s+(\w+)\s*\{/gm)) enums.add(m[1]);
  for (const m of text.matchAll(/^model\s+(\w+)\s*\{/gm)) {
    const start = m.index + m[0].length;
    let depth = 1;
    let i = start;
    while (i < text.length && depth > 0) {
      if (text[i] === '{') depth++;
      else if (text[i] === '}') depth--;
      i++;
    }
    const body = text.slice(start, i - 1);
    const fields = new Set();
    const uniques = new Set();
    for (const line of body.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('//')) continue;
      if (t.startsWith('@@')) {
        const um = t.match(/^@@(?:unique|id)\s*\(\s*\[([^\]]+)\]/);
        if (um) {
          const cols = um[1].split(',').map((c) => c.trim().split(/\s+/)[0]).filter(Boolean);
          uniques.add(cols.join('_'));
        }
        continue;
      }
      const fm = t.match(/^(\w+)\s+/);
      if (fm) fields.add(fm[1]);
    }
    models[m[1]] = fields;
    compound[m[1]] = uniques;
  }
  return { models, enums, compound };
}

/** Extract the body of the brace block starting at `start` (index of '{'). */
function braceBlock(text, start) {
  if (text[start] !== '{') return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) return text.slice(start + 1, i);
    }
  }
  return text.slice(start + 1);
}

/** Split an object body on depth-0 commas, respecting brackets and strings. */
function segments(inner) {
  const out = [];
  let buf = '';
  let depth = 0;
  let quote = null;
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (quote) {
      buf += c;
      if (c === quote && inner[i - 1] !== '\\') quote = null;
    } else if (c === "'" || c === '"' || c === '`') {
      quote = c;
      buf += c;
    } else if ('{([ '.includes(c) && c !== ' ') {
      depth++;
      buf += c;
    } else if ('})]'.includes(c)) {
      depth--;
      buf += c;
    } else if (c === ',' && depth === 0) {
      out.push(buf);
      buf = '';
    } else {
      buf += c;
    }
  }
  if (buf.trim()) out.push(buf);
  return out;
}

/** Top-level keys of an object body, descending into `...(x && {a:1})` spreads. */
function keysOf(inner, allowSpread = true) {
  const out = [];
  for (const raw of segments(inner)) {
    const s = raw.trim();
    if (!s) continue;
    if (s.startsWith('...')) {
      if (!allowSpread) continue;
      const b = s.indexOf('{');
      if (b !== -1) {
        const sub = braceBlock(s, b);
        if (sub !== null) out.push(...keysOf(sub, false));
      }
      continue;
    }
    const km = s.match(/^(\w+|'[^']+'|"[^"]+")\s*:/);
    if (km) {
      out.push({ key: km[1].replace(/^['"]|['"]$/g, ''), value: s.slice(km[0].length).trim() });
      continue;
    }
    const im = s.match(/^(\w+)\s*$/);
    if (im) out.push({ key: im[1], value: `@IDENT:${im[1]}` });
  }
  return out;
}

/**
 * `const NAME [: T] = { ... }` -> name to list of { body, at }.
 *
 * `at` is the character offset of the declaration. It is REQUIRED, not
 * decorative: a file may declare the same name many times (rentalService.ts
 * declares `where` six times). Resolving to "the last one in the file" silently
 * compares a call against an unrelated block, and the control test for exactly
 * that bug reported a clean 0. The caller must pick the nearest PRECEDING
 * declaration.
 */
function objectVars(text) {
  const vars = {};
  for (const m of text.matchAll(/(?:const|let|var)\s+(\w+)\s*(?::[^=]+)?=\s*\{/g)) {
    const body = braceBlock(text, m.index + m[0].length - 1);
    if (body !== null) {
      (vars[m[1]] = vars[m[1]] || []).push({ body, at: m.index });
    }
  }
  return vars;
}

/** Nearest declaration of `name` at or before `offset`. */
function resolveVar(vars, name, offset) {
  const cands = vars[name];
  if (!cands || !cands.length) return null;
  let best = null;
  for (const c of cands) {
    if (c.at <= offset && (best === null || c.at > best.at)) best = c;
  }
  // Fall back to the first declaration if the call precedes all of them
  // (e.g. the object is built by a helper that receives it).
  return best ? best.body : cands[0].body;
}

const pascal = (s) => s[0].toUpperCase() + s.slice(1);
const unFilter = (k) =>
  k.replace(/_(equals|in|notIn|lt|lte|gt|gte|contains|startsWith|endsWith|mode|has|hasEvery|hasSome|isEmpty|isSet)$/, '');

function scan(file, models, enums, compound) {
  const text = fs.readFileSync(file, 'utf8');
  const vars = objectVars(text);
  const findings = [];
  const unresolved = [];

  // TWO call shapes are scanned:
  //  1. `(prisma as any).model.op(...)` -- the `any` disables tsc entirely.
  //  2. `prisma.model.op(...)`           -- typed, so tsc normally saves you...
  //     EXCEPT when the argument is a separate `const x: any = {...}` variable.
  //     An `any`-typed object is never checked against the model, so a phantom
  //     key inside it compiles clean. Confirmed on rentalService.ts: planting
  //     `bogusColumn: 1` in `const where: any` passed `tsc --noEmit` at zero
  //     errors. That hole is invisible to the compiler and was invisible to
  //     this script until it started scanning shape 2. It is the reason
  //     `const where: any` (18+ sites) is a live risk, not just tidiness.
  const CALL_RE = /(?:\bprisma|\(prisma\s+as\s+any\))\s*\.\s*(\w+)\s*\.\s*(\w+)\s*\(/g;

  for (const m of text.matchAll(CALL_RE)) {
    const [, prop, op] = m;
    const model = pascal(prop);
    const line = text.slice(0, m.index).split('\n').length;
    if (!models[model]) {
      unresolved.push({ line, prop, op });
      continue;
    }
    const fields = new Set([...models[model], ...enums, ...(compound[model] || [])]);

    const openParen = m.index + m[0].length - 1;
    const brace = text.indexOf('{', openParen);
    if (brace === -1) continue;
    const closeParen = text.indexOf(')', openParen);
    if (closeParen !== -1 && closeParen < brace) continue;

    const inner = braceBlock(text, brace);
    if (inner === null) continue;

    for (const { key, value } of keysOf(inner)) {
      if (!ARGS.has(key)) continue;

      let body = null;
      if (value.startsWith('@IDENT:')) {
        const ident = value.slice('@IDENT:'.length);
        body = resolveVar(vars, ident, m.index);
      } else if (value.startsWith('{')) {
        body = braceBlock(value, 0);
      } else if (key === 'orderBy' && value.startsWith('[')) {
        for (const om of value.matchAll(/\{([^{}]*)\}/g)) {
          for (const { key: k2 } of keysOf(om[1], false)) {
            if (PSEUDO.has(k2) || ARGS.has(k2)) continue;
            if (!fields.has(unFilter(k2))) {
              findings.push({ line, model, op, container: key, key: k2 });
            }
          }
        }
        continue;
      }

      if (body === null) continue;
      for (const { key: k2 } of keysOf(body)) {
        if (PSEUDO.has(k2) || ARGS.has(k2)) continue;
        if (fields.has(unFilter(k2))) continue;
        findings.push({ line, model, op, container: key, key: k2 });
      }
    }
  }
  return { findings, unresolved };
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
      out.push(...walk(p));
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      out.push(p);
    }
  }
  return out;
}

function main() {
  if (!fs.existsSync(SCHEMA)) {
    console.error(`schema not found: ${SCHEMA}`);
    process.exit(2);
  }
  const { models, enums, compound } = parseSchema(SCHEMA);
  if (Object.keys(models).length < 90) {
    console.error(`only ${Object.keys(models).length} models parsed -- refusing to trust this run`);
    process.exit(2);
  }

  const args = process.argv.slice(2);
  const files = args.length ? args.map((a) => path.resolve(a)) : walk(path.join(ROOT, 'src'));

  let total = 0;
  const unresolvedAll = [];
  for (const f of files) {
    if (!fs.existsSync(f)) {
      console.error(`missing: ${f}`);
      continue;
    }
    const { findings, unresolved } = scan(f, models, enums, compound);
    unresolvedAll.push(...unresolved.map((u) => ({ file: f, ...u })));
    for (const x of findings) {
      total++;
      console.log(`${path.relative(ROOT, f)}:${x.line}  ${x.model}.${x.op}  ${x.container}.${x.key}`);
    }
  }

  console.log(`\nPHANTOM KEYS: ${total}`);
  if (unresolvedAll.length) {
    console.log(`UNRESOLVED MODEL PROPERTIES: ${unresolvedAll.length}`);
    for (const u of unresolvedAll.slice(0, 25)) {
      console.log(`  ${path.relative(ROOT, u.file)}:${u.line}  ${u.prop}.${u.op}`);
    }
  }
  process.exit(total > 0 ? 1 : 0);
}

main();
