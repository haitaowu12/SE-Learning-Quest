import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const sha = 'a'.repeat(40);
const script = new URL('../scripts/verify-publication-request.mjs', import.meta.url);
const valid = {
  GITHUB_EVENT_NAME: 'workflow_dispatch',
  GITHUB_REF: 'refs/heads/main',
  GITHUB_SHA: sha,
  PUBLISH_REQUESTED: 'true',
  APPROVED_SHA: sha
};
function check(overrides: Record<string, string> = {}) {
  return spawnSync(process.execPath, [script.pathname], {
    env: { ...process.env, ...valid, ...overrides }, encoding: 'utf8'
  });
}

test('publication accepts only an explicit manual request for the exact tested main commit', () => {
  const result = check();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /not a usability or educational-effectiveness attestation/);
});

test('publication refuses push, PR, alternate branch, missing intent and mismatched identity', () => {
  const cases: Record<string, string>[] = [
    { GITHUB_EVENT_NAME: 'push' },
    { GITHUB_EVENT_NAME: 'pull_request' },
    { GITHUB_REF: 'refs/heads/feature' },
    { PUBLISH_REQUESTED: 'false' },
    { PUBLISH_REQUESTED: '' },
    { APPROVED_SHA: '' },
    { APPROVED_SHA: sha.slice(0, 12) },
    { APPROVED_SHA: 'b'.repeat(40) },
    { APPROVED_SHA: sha + '\n' },
    { GITHUB_SHA: '' },
    { GITHUB_SHA: sha + '\n', APPROVED_SHA: sha + '\n' }
  ];
  for (const overrides of cases) {
    const result = check(overrides);
    assert.equal(result.status, 1, JSON.stringify(overrides));
    assert.match(result.stderr, /Publication refused/);
  }
});

test('workflow wires the fail-closed gate before Pages publishing and retains three-browser validation', () => {
  const workflow = readFileSync(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8');
  assert.match(workflow, /type: boolean\s+required: false\s+default: false/);
  assert.match(workflow, /if: github\.event_name == 'workflow_dispatch' && github\.ref == 'refs\/heads\/main' && inputs\.publish == true/);
  assert.match(workflow, /needs: validate/);
  assert.match(workflow, /browser: \[chromium, firefox, webkit\]/);
  assert.match(workflow, /ref: \$\{\{ github\.sha \}\}/);
  assert.match(workflow, /APPROVED_SHA: \$\{\{ inputs\.approved_sha \}\}/);
  assert.ok(workflow.indexOf('run: node scripts/verify-publication-request.mjs') < workflow.indexOf('uses: actions/configure-pages'));
});
