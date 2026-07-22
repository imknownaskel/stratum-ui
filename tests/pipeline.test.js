import assert from 'node:assert/strict'
import test from 'node:test'

process.env.SUPABASE_URL ||= 'http://127.0.0.1:54321'
process.env.SUPABASE_PUBLISHABLE_KEY ||= 'test-publishable-key'
process.env.SUPABASE_SECRET_KEY ||= 'test-secret-key'

const { hasVerifiedMfa, tokenAssuranceLevel } = await import('../server/auth/session.js')
const { createEvidenceChunks, languageInstructions, responseStyleInstructions } = await import('../server/services/nvidiaService.js')
const { translatableSummaryReferences } = await import('../server/services/translationService.js')

function jwtWith(payload) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
  return encode({ alg: 'none' }) + '.' + encode(payload) + '.'
}

test('reads the authenticator assurance level from a JWT', () => {
  assert.equal(tokenAssuranceLevel(jwtWith({ aal: 'aal2' })), 'aal2')
  assert.equal(tokenAssuranceLevel(jwtWith({})), 'aal1')
  assert.equal(tokenAssuranceLevel('not-a-jwt'), 'aal1')
})

test('requires a verified MFA factor', () => {
  assert.equal(hasVerifiedMfa({ factors: [{ status: 'unverified' }] }), false)
  assert.equal(hasVerifiedMfa({ factors: [{ status: 'verified', factor_type: 'totp' }] }), true)
  assert.equal(hasVerifiedMfa({}), false)
})

test('creates stable unique evidence IDs across semantic chunks', () => {
  const policy = Array.from({ length: 12 }, (_, index) => (
    'Section ' + (index + 1) + '\n\nThis clause explains an obligation, a user right, and a data practice in enough detail to be cited.'
  )).join('\n\n')
  const chunks = createEvidenceChunks(policy, 260)
  const evidence = chunks.flat()
  assert.ok(chunks.length > 1)
  assert.equal(evidence[0].id, 'E0001')
  assert.equal(new Set(evidence.map((item) => item.id)).size, evidence.length)
})

test('maps the response slider to concise, balanced, and detailed prompts', () => {
  assert.match(responseStyleInstructions(0), /concise/i)
  assert.match(responseStyleInstructions(50), /balanced/i)
  assert.match(responseStyleInstructions(100), /detailed/i)
})

test('keeps schema values and evidence stable while localizing user-facing text', () => {
  assert.match(languageInstructions('yo'), /Yoruba/)
  assert.match(languageInstructions('yo'), /evidence excerpts unchanged/)
  const summary = {
    overview: 'Overview',
    uncertainties: [],
    key_points: ['Point'],
    risk_flags: [{ title: 'Flag', explanation: 'Explanation', evidence: 'Exact source quote', evidence_ids: ['E0001'] }],
    data_practices: { collected: [], shared_with: [], purposes: [], retention: 'Not specified' },
    user_rights: [],
    financial_terms: [],
    recommended_actions: [],
  }
  const values = translatableSummaryReferences(summary).map((reference) => reference.value)
  assert.ok(values.includes('Overview'))
  assert.ok(values.includes('Explanation'))
  assert.ok(!values.includes('Exact source quote'))
})