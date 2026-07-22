# Stratum

Stratum turns dense policy and terms-and-conditions text into plain-language summaries with risky clauses flagged.

See [docs/PROJECT_PROGRESS.md](docs/PROJECT_PROGRESS.md) for the living implementation record, architecture decisions, current blockers, validation history, and roadmap.

## Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and add the Supabase project URL and keys.

3. Start the React UI and Node API together:

   ```bash
   npm run dev
   ```

The UI runs on `http://127.0.0.1:5173` and proxies `/api` to the API on `http://127.0.0.1:3001`.

## Authentication

The React application calls the same-origin Node API. The API performs Supabase Auth operations and stores the returned access and refresh tokens in `HttpOnly`, `SameSite=Lax` cookies. The Supabase secret key is loaded only by the server and must never use a `VITE_` environment-variable prefix.

Stratum requires Supabase TOTP MFA. A user enrolls an authenticator app on the first authenticated login, and later AAL1 logins require a fresh six-digit TOTP challenge. The refresh cookie uses a 30-day sliding lifetime, so a cold session beyond that window returns to password plus TOTP. Protected API routes enforce AAL2, and migration `202607220005_enforce_mfa.sql` adds matching restrictive RLS policies for direct Supabase access. TOTP enrollment must be enabled in the Supabase Auth MFA settings; it is enabled by default on Supabase projects.

Available endpoints:

- `GET /api/health`
- `GET /api/auth/session`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/mfa/start`
- `POST /api/auth/mfa/verify`
- `POST /api/auth/session/consume`
- `POST /api/auth/password/forgot`
- `POST /api/auth/password/update`
- `POST /api/auth/logout`
- `GET /api/preferences`
- `PATCH /api/preferences`
- `GET /api/policies`
- `POST /api/policies` (multipart field: `files`)
- `GET /api/policies/:documentId`
- `POST /api/policies/:documentId/retry`
- `DELETE /api/policies/:documentId`

## Policy processing

New uploads create durable rows in `policy_processing_jobs`. Workers claim jobs atomically, retry transient failures with backoff, and recover abandoned work after a restart. Documents move through `uploaded`, `processing`, and `ready` or `failed`. Text PDFs and Word files are parsed directly; images and scanned PDFs use local English OCR. Scanned-PDF OCR is limited to 25 pages and extracted text is limited to 1,000,000 characters per document.

Analysis results are cached per user by the document SHA-256, prompt version, provider, selected response style, summary language, and translation provider. Concise, balanced, and detailed settings alter `policy-v3` generation instructions for new and retried analyses. Each provider call is recorded in `policy_ai_runs` with the model role, latency, token counts, confidence, and escalation state.

## NVIDIA NIM

Stratum uses a routed model cascade. Nemotron Nano performs the normal structured analysis pass. Low-confidence, high-risk, or unusually complex results are verified by Nemotron Super. Gemma remains available as an offline challenger rather than serving normal traffic.

```env
NVIDIA_NIM_API_KEY=nvapi-your-new-key
NVIDIA_NIM_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_NIM_FAST_MODEL=nvidia/nemotron-3-nano-30b-a3b
NVIDIA_NIM_REASONING_MODEL=nvidia/nemotron-3-super-120b-a12b
NVIDIA_NIM_CHALLENGER_MODEL=google/gemma-4-31b-it
AI_PROMPT_VERSION=policy-v3
AI_ESCALATION_THRESHOLD=0.78
```

Prompts use stable evidence IDs, strict JSON validation, one repair attempt, provider retries, and a short circuit breaker. Never expose the API key through a `VITE_` variable or frontend code. Without a key, extraction still completes and the document can be retried after NVIDIA is configured.
## Summary languages

Users choose English, French, Spanish, Portuguese, Hausa, Yorùbá, or Igbo during onboarding and can change the selection in Settings. The choice is stored in `profiles.preferred_language`, updates the React interface immediately, and is applied to new or regenerated summaries. Exact policy evidence excerpts and internal severity enums remain in their original form.

The default local mode uses the existing NVIDIA NIM request to generate the structured summary directly in the chosen language:

```env
TRANSLATION_PROVIDER=nvidia
```

For a separate production translation pass, enable Google Cloud Translation Basic, create a server-restricted API key, and use:

```env
TRANSLATION_PROVIDER=google
GOOGLE_TRANSLATE_API_KEY=your-server-only-key
TRANSLATION_TIMEOUT_MS=30000
```

In Google mode, Stratum analyzes once in English and translates only user-facing summary fields. The key is server-only and must never use a `VITE_` prefix. Changing a language does not rewrite saved summaries automatically; use **Regenerate** on a policy or upload a new document.
Interface translations are bundled in `src/i18n/locales`, so navigation and page copy do not use a translation API at runtime. Run `npm run check:locales` to verify that every literal `t()` phrase is registered and each locale contains a safe value. French, Spanish, and Portuguese catalogs are machine-assisted drafts; Hausa, Yorùbá, and Igbo use curated core-interface dictionaries with explicit English fallbacks for longer technical or legal copy until native-speaker review. Update the locale JSON files to improve wording without changing components.

## Email redirects

Set `APP_PUBLIC_URL` to the public HTTPS URL where Stratum is deployed. In Supabase, open **Authentication > URL Configuration**, set the Site URL to the same deployed origin, and allow these exact redirect URLs:

- `https://your-domain.example/?auth_action=confirmed`
- `https://your-domain.example/?auth_action=recovery`

Keep `http://127.0.0.1:5173/**` as an additional redirect only for same-computer local testing. A localhost link cannot work when opened on another device.

## Database

Apply every SQL file in `supabase/migrations` in filename order through the Supabase SQL editor or Supabase CLI. The migrations create user profiles and preferences, a private policy-document bucket, document metadata, durable processing jobs, auditable AI runs, Row Level Security policies, and the new-user trigger.

## Validation

```bash
npm test
npm run check:locales
npm run lint
npm run build
npm audit --audit-level=high
```
