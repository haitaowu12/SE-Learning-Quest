// A manual, commit-bound publication request is separate from code integration.
// This checks dispatch intent and identity, not human usability or learning evidence.
const { GITHUB_EVENT_NAME, GITHUB_REF, GITHUB_SHA, PUBLISH_REQUESTED, APPROVED_SHA } = process.env;
const fullSha = /^[0-9a-f]{40}$/;
const validSha = value => typeof value === 'string' && value.length === 40 && fullSha.test(value);
const allowed = GITHUB_EVENT_NAME === 'workflow_dispatch'
  && GITHUB_REF === 'refs/heads/main'
  && PUBLISH_REQUESTED === 'true'
  && validSha(GITHUB_SHA) && validSha(APPROVED_SHA)
  && APPROVED_SHA === GITHUB_SHA;
if (!allowed) {
  console.error('Publication refused: use manual dispatch on main, select publish, and supply its exact accepted commit SHA.');
  process.exitCode = 1;
} else {
  console.log(`Explicit publication request verified for ${GITHUB_SHA}; this is not a usability or educational-effectiveness attestation.`);
}
