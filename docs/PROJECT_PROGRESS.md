# Stratum Project Progress

Last updated: 2026-07-22

## Purpose

Stratum helps people understand dense privacy policies, terms of service, and related agreements. The product should extract policy text, produce a plain-language summary, identify risky clauses, and show the source evidence behind each important finding.

This is the living implementation record for the project. Update it whenever a meaningful feature, architecture decision, migration, validation result, blocker, or roadmap priority changes. Never add API keys, access tokens, passwords, or other credentials to this file.

## Current status

The React frontend, Supabase authentication, document upload and extraction pipeline, and NVIDIA NIM analysis pipeline are implemented locally. A real uploaded policy has completed extraction and Nano analysis successfully. Native TOTP MFA, persisted response-style controls, and persisted multilingual summaries are implemented. Database-level AAL2 enforcement migration `005` has been applied.

### Immediate next verification

- Verify direct AAL1 database access is rejected now that migration `005` is applied.
- Reload Stratum, complete the first-login authenticator enrollment, log out, and verify the next login requests a TOTP code.
- Move the response-style slider, wait for the Saved status, and retry a policy to verify the selected style is recorded in summary metadata.
- Use a policy with a clearly high-risk clause to verify selective reasoning escalation.
- Upload the same file again to verify the user-scoped cache path.

## Completed work

### Frontend and product experience

- Built the application in React and Vite from the Stratum designs.
- Added language selection and a short onboarding flow.
- Persist the onboarding language to Supabase and expose the same seven-language selector in Settings.
- Added a shared React i18n provider so the navigation shell and product screens update immediately when language changes.
- Bundled French, Spanish, Portuguese, Hausa, Yorùbá, and Igbo UI catalogs; runtime UI switching does not call a translation API.
- Added locale-aware policy dates and a catalog coverage checker.
- Added Regenerate on completed policies so language and response-style changes can be applied.
- Added Dashboard, Policy Library, Demo, Help, Settings, login, signup, signed-out, and password-recovery experiences.
- Added light and dark themes, personalization controls, and a concise-to-detailed response-style setting.
- Replaced the former AI Assistant navigation action with policy upload.
- Added a blurred upload-modal backdrop and automatic modal dismissal after a successful upload.
- Added responsive featured-policy cards, search, category filters, selection, and comparison behavior.
- Added a simulated text-selection demo and staged Stratum summary interaction.
- Updated the dashboard with user profile and account statistics.
- Removed the redundant New Summary action, Data Analytics item, and Delete Account action.

### Authentication and sessions

- Added Supabase email and phone signup and login flows.
- Added email confirmation handling.
- Added forgot-password and update-password flows.
- Added logout and server-side session restoration.
- Store access and refresh tokens in `HttpOnly`, `SameSite=Lax` cookies.
- Added same-origin request protection and authentication rate limiting.
- Added user profile and preference persistence foundations.
- Made the public application URL configurable for confirmation and password-reset redirects.
- Added mandatory first-login TOTP enrollment through Supabase MFA.
- Added TOTP challenges for subsequent AAL1 logins after the 30-day sliding session cookie expires.
- Added server-side AAL2 enforcement for protected API routes and rate-limited MFA verification.
- Added an MFA setup QR code, manual secret, six-digit verification screen, and pending-session recovery.

### Policy upload and extraction

- Added authenticated policy upload, listing, detail, retry, and deletion API routes.
- Added a private Supabase Storage bucket and per-user policy records.
- Supported PDF, JPG, PNG, DOC, and DOCX uploads.
- Limited uploads to five files per request and 10 MB per file.
- Added direct text extraction for text PDFs, DOCX, and legacy DOC files.
- Added local English OCR for images and scanned PDFs.
- Limited scanned-PDF OCR to 25 pages and extracted text to 1,000,000 characters.
- Added live frontend processing states, polling, retry controls, errors, and extracted-text details.
- Verified extraction locally with PDF, DOCX, PNG OCR, and scanned-PDF OCR fixtures.

### AI analysis pipeline

- Connected the backend to NVIDIA NIM through its OpenAI-compatible chat-completions API.
- Configured `nvidia/nemotron-3-nano-30b-a3b` as the normal fast-analysis model.
- Configured `nvidia/nemotron-3-super-120b-a12b` as the selective reasoning and verification model.
- Kept `google/gemma-4-31b-it` as the challenger model for later evaluation rather than normal traffic.
- Added model routing based on confidence, model-requested review, high-risk clauses, and document complexity.
- Added a reasoning-model fallback when the fast model fails.
- Added provider timeouts, one retry for timeouts and transient provider failures, and a short circuit breaker.
- Added strict Zod validation and one JSON-repair attempt.
- Treat policy text as untrusted content to reduce prompt-injection risk.
- Replaced fixed character slicing with paragraph-aware chunks and stable evidence IDs such as `E0001`.
- Require risk findings to include supporting excerpts and evidence IDs.
- Added confidence, uncertainty, and review-needed fields to structured summaries.
- Added UI labels for confidence, reasoning verification, cached results, and evidence IDs.
- Made the concise-to-detailed preference part of policy-v3 prompts and analysis-cache identity.
- Added English, French, Spanish, Portuguese, Hausa, Yorùbá, and Igbo summary output.
- Added a translation-provider boundary: direct NVIDIA generation by default, with optional server-side Google Cloud Translation.
- Preserve exact evidence excerpts and internal risk enums while translating user-facing summary fields.
- Made language and translation provider part of analysis-cache identity.

### Durable processing and observability

- Replaced the in-memory processing queue with a durable Supabase job design.
- Added atomic job claiming with `FOR UPDATE SKIP LOCKED`.
- Added abandoned-job recovery and exponential retry backoff.
- Added per-user SHA-256 document deduplication and analysis caching.
- Cache matching also requires the same prompt version and provider.
- Added auditable AI-run records for model role, model name, latency, token counts, confidence, and escalation state.
- Added AI model-routing details to the API health response.

### Security and configuration

- Keep Supabase secret and NVIDIA API keys on the server only.
- `.env.local` and other environment files are ignored by Git, while `.env.example` contains safe placeholders.
- Added origin validation, Helmet headers, request size limits, upload validation, and route-level authentication.
- Verified that tracked and unignored files do not contain live NVIDIA or Supabase secret keys.
- Credentials shared during development should be rotated before deployment.

## Database migrations

| Migration | Purpose | Status |
| --- | --- | --- |
| `202607210001_profiles_preferences.sql` | User profiles and preferences | Applied |
| `202607210002_policy_documents.sql` | Policy metadata, private storage bucket, and RLS | Applied |
| `202607210003_policy_processing.sql` | Reserved/empty migration | No action required |
| `202607210004_ai_processing_pipeline.sql` | Content hashes, durable jobs, AI runs, and atomic claiming | Applied |
| `202607220005_enforce_mfa.sql` | Restrictive AAL2 policies for profiles, preferences, documents, and policy storage | Applied |

## Current architecture

```text
React client
  -> same-origin Express API
      -> Supabase Auth and HttpOnly session cookies
      -> Supabase Postgres and private Storage
      -> durable policy-processing worker
          -> deterministic extraction or local OCR
          -> evidence-aware segmentation
          -> Nemotron Nano structured analysis
          -> confidence and risk routing
              -> normal result: persist
              -> ambiguous/high-risk result: Nemotron Super verification
          -> selected-language generation or Google translation
          -> summary, unchanged evidence, metrics, and cache metadata
```

The frontend never receives server-only provider credentials. The application stores final structured conclusions and audit metadata, not private model reasoning traces.

## Important implementation decisions

- Use deterministic parsers and OCR before invoking an LLM.
- Use a fast model for normal traffic and a stronger model only when escalation rules fire.
- Optimize against Stratum-specific evaluation results, not generic model benchmarks alone.
- Every important risk finding must be traceable to policy evidence.
- Keep cache entries scoped to the same user to avoid leaking private policy-derived results.
- Version prompts so cached results and evaluation data remain reproducible.
- Use durable jobs before horizontal scaling; do not return to an in-memory production queue.
- Keep quoted evidence in the source language; translate only explanatory fields.
- Use direct NVIDIA generation for a one-call local path and keep Google Cloud Translation as an optional production provider.
- Treat public hosted model endpoints as development infrastructure until latency and concurrency are measured under representative load.

## Validation record

Latest local checks on 2026-07-22:

- `npm run lint` passed.
- `npm run build` passed.
- `npm audit --audit-level=high` reported zero vulnerabilities.
- Backend JavaScript syntax checks passed.
- Evidence chunking produced stable, unique evidence IDs across multiple chunks.
- Local environment resolves Nano as the fast model and Super as the reasoning model.
- Git diff whitespace validation passed.
- Repository secret scan passed.
- Live database checks confirmed that the durable job table, AI-run table, and atomic job-claim function are available.
- The updated API started successfully and reports the Nano fast model, Super reasoning model, Gemma challenger, and policy-v3 prompt through /api/health.
- A real policy document reached `ready`; its durable job is `completed` and its recorded fast run used Nemotron Nano.
- The preference record currently loads successfully and defaults to balanced (`50`).
- The live API reports `policy-v3`; unauthenticated MFA-start and preference requests correctly return HTTP 401.
- The final MFA and preference frontend production build passed.
- The automated regression suite passed five tests covering JWT AAL parsing, verified MFA factors, evidence IDs, response-style prompts, and evidence-safe language translation.
- The API health response confirms NVIDIA translation mode is configured, and the production frontend build with full-interface language switching passed.
- Locale validation confirms all 196 literal translation calls are registered and all six non-English catalogs contain safe values.

Earlier NVIDIA hosted-trial checks confirmed the API key and model availability, but Gemma inference requests timed out. This is why Gemma is currently a challenger rather than the production default. Hosted trial latency must not be treated as production capacity.

## Roadmap

### P0 - Complete and prove the AI upload path

- [x] Apply migration `202607210004_ai_processing_pipeline.sql`.
- [x] Restart the API with the durable worker enabled.
- [x] Upload one text PDF and verify extraction, Nano analysis, persistence, and UI rendering.
- [ ] Upload a policy containing a high-risk clause and verify Super escalation.
- [ ] Upload the same document twice and verify a user-scoped cache hit.
- [ ] Force a transient provider error and verify retry/backoff behavior.

### P1 - Evaluation and model selection

- [ ] Build a 30-50 document evaluation set covering privacy policies, terms, subscriptions, arbitration, data sharing, and retention.
- [ ] Add expected risk flags and supporting excerpts for each evaluation document.
- [ ] Measure high-risk-clause recall, hallucination rate, evidence accuracy, JSON validity, latency, and cost per policy.
- [ ] Compare Nano, Super, and Gemma using the same prompt version and evaluation data.
- [ ] Tune escalation thresholds using measured false-positive and false-negative rates.
- [ ] Add an internal processing-runs view or export for evaluation analysis.

### P1 - Production authentication and delivery

- [ ] Deploy the UI and API to a public HTTPS origin.
- [ ] Set `APP_PUBLIC_URL` and Supabase allowed redirect URLs to the deployed origin.
- [ ] Configure production email delivery/SMTP and verify confirmation and recovery links across devices.
- [ ] Rotate all development credentials before deployment.
- [ ] Define cookie, proxy, CORS/origin, and environment settings for production.

### P2 - Product integration

- [ ] Replace or clearly separate remaining featured demo policies from real uploaded policies.
- [x] Persist Settings personalization, theme, and response style to Supabase preferences.
- [x] Apply response-style preferences to AI output generation without weakening factual completeness.
- [x] Persist the onboarding and Settings language preference to `profiles.preferred_language`.
- [x] Localize the application shell, Dashboard, Settings, Policy Library, upload, Demo, Help, authentication, MFA, and onboarding without a runtime translation API.
- [ ] Have native speakers review and refine the Hausa, Yorùbá, and Igbo long-form/technical fallback copy.
- [x] Apply the selected language to new and regenerated AI summaries without translating exact evidence.
- [ ] Enable and evaluate Google Cloud Translation for Hausa, Yorùbá, and Igbo before choosing the production translation provider.
- [ ] Connect the browser-style Demo summary interaction to real analysis data where appropriate.
- [ ] Add policy versioning and comparison for a user's uploaded documents.
- [ ] Add account usage counts based on real uploaded and processed documents.

### P2 - Reliability and operations

- [ ] Add automated tests for authentication, upload validation, extraction, job claiming, caching, routing, and schema validation.
- [ ] Add structured server logging with request and job correlation IDs while excluding policy text and credentials.
- [ ] Add monitoring for queue depth, job age, provider latency, failure rate, escalation rate, and token use.
- [ ] Add retention and deletion rules for uploaded files, extracted text, summaries, and AI-run metadata.
- [ ] Add deployment and rollback instructions.
- [ ] Decide whether production inference uses hosted NVIDIA endpoints or a dedicated/self-hosted NIM deployment after load testing.

## Maintenance rule

For every meaningful future change:

1. Update the relevant completed-work section.
2. Record any new architecture or security decision.
3. Update migration status and immediate blockers.
4. Mark roadmap items complete or add newly discovered work.
5. Add the latest validation evidence and date.
6. Do not document secrets or paste raw private policy contents.
