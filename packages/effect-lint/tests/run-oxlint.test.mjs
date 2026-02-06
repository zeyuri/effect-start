import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');
const pluginPath = resolve(__dirname, '../src/index.js');

const parseExpectedDiagnostics = (sourceText) => {
  const expected = [];
  const lines = sourceText.split(/\r?\n/);

  lines.forEach((line, idx) => {
    const match = line.match(/eslint-disable-next-line\s+(.+)$/);
    if (!match) return;

    const rulesPart = match[1].split('--')[0];
    const rules = rulesPart
      .split(',')
      .map((rule) => rule.trim())
      .filter((rule) => rule.startsWith('effect/'));

    for (const ruleId of rules) {
      expected.push({ ruleId, line: idx + 2 });
    }
  });

  return expected;
};

const runOxlint = (fixturePath, ruleIds, sourceOverride) => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'effect-lint-'));
  const configPath = join(tmpDir, '.oxlintrc.json');
  const targetPath = sourceOverride
    ? join(tmpDir, basename(fixturePath))
    : fixturePath;

  if (sourceOverride) {
    writeFileSync(targetPath, sourceOverride);
  }

  const rules = Object.fromEntries(ruleIds.map((ruleId) => [ruleId, 'error']));
  const config = {
    jsPlugins: [pluginPath],
    rules,
  };

  writeFileSync(configPath, JSON.stringify(config, null, 2));

  const result = spawnSync(
    resolve(__dirname, '../node_modules/.bin/oxlint'),
    ['--format', 'json', '--config', configPath, targetPath],
    { encoding: 'utf8' }
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status === null) {
    throw new Error('oxlint did not exit cleanly');
  }

  const output = result.stdout.trim();
  if (!output) {
    const details = result.stderr ? `\n${result.stderr}` : '';
    throw new Error(`No JSON output from oxlint.${details}`);
  }

  const extractJson = (text) => {
    const start = text.search(/[\[{]/);
    if (start === -1) return null;
    const slice = text.slice(start).trim();
    const end = Math.max(slice.lastIndexOf(']'), slice.lastIndexOf('}'));
    if (end === -1) return null;
    return slice.slice(0, end + 1);
  };

  let parsed;
  try {
    const jsonText = extractJson(output);
    if (!jsonText) {
      const details = result.stderr ? `\n${result.stderr}` : '';
      throw new Error(`No JSON payload found in oxlint output.${details}`);
    }
    parsed = JSON.parse(jsonText);
  } catch (error) {
    const details = result.stderr ? `\n${result.stderr}` : '';
    throw new Error(`Failed to parse oxlint JSON output.${details}`);
  }

  const diagnostics = Array.isArray(parsed)
    ? parsed.flatMap((entry) => entry.diagnostics || entry.messages || [])
    : parsed.diagnostics || parsed.messages || [];

  return diagnostics;
};

const normalizeDiagnostics = (diagnostics) =>
  diagnostics
    .map((diag) => {
      const rawId = diag.ruleId || diag.code || diag.rule || '';
      const match = rawId.match(/^([^()]+)\(([^()]+)\)$/);
      const ruleId = match ? `${match[1]}/${match[2]}` : rawId;
      return {
        ruleId,
        line:
          diag.location?.start?.line ??
          diag.line ??
          diag.location?.line ??
          diag.labels?.[0]?.span?.line ??
          0,
      };
    })
    .filter((diag) => diag.ruleId.startsWith('effect/'));

const assertDiagnostics = (fixtureName, expected, actual) => {
  const expectedKeyed = [...new Set(expected.map((diag) => `${diag.ruleId}@${diag.line}`))].sort();
  const actualKeyed = [...new Set(actual.map((diag) => `${diag.ruleId}@${diag.line}`))].sort();

  assert.deepEqual(
    actualKeyed,
    expectedKeyed,
    `Diagnostics mismatch for ${fixtureName}\nExpected: ${expectedKeyed.join(', ')}\nActual: ${actualKeyed.join(', ')}`
  );
};

const fixtures = readdirSync(fixturesDir)
  .filter((file) => file.endsWith('.test.ts'))
  .sort();

for (const fixture of fixtures) {
  test(`oxlint matches expected diagnostics: ${fixture}`, () => {
    const fixturePath = join(fixturesDir, fixture);
    const source = readFileSync(fixturePath, 'utf8');
    const expected = parseExpectedDiagnostics(source);
    const ruleIds = [...new Set(expected.map((entry) => entry.ruleId))];

    const transformedSource = source.replace(
      /eslint-disable-next-line/g,
      'expect-effect-next-line'
    );

    const diagnostics = runOxlint(fixturePath, ruleIds, transformedSource);
    const effectDiagnostics = normalizeDiagnostics(diagnostics);

    assertDiagnostics(fixture, expected, effectDiagnostics);
  });
}
