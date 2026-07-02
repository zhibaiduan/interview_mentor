# Setup Module Handoff

**Last updated:** 2026-07-02  
**Branch:** `codex/meeting-session-part`  
**Scope:** Slice 3 - Dashboard And Setup  
**Status:** Usable local setup flow with PDF resume parsing, privacy filtering, and simplified session configuration. Still needs backend persistence/session creation before production release.

## What Is Done

- Built the production setup page at `app/setup/page.tsx` using `components/product/setup/setup-flow.tsx`.
- Implemented the reference-inspired stepped IA:
  - Step 1: Resume
  - Step 2: Target role
  - Step 3: Session settings
- Added PDF, `.txt`, and `.md` upload support through `POST /api/setup/parse-resume`.
- Added server-side PDF text extraction with `pdf-parse`.
- Added privacy-line filtering before any resume material is shown or passed into setup config.
- Changed resume preview from extracted chips/tags to one simple information box:
  - show all non-private resume content
  - preserve original order
  - bold common section headings such as `Summary`, `Professional Experience`, `Projects`, `Education`, and `Skills`
- Simplified empty/default resume state:
  - no default selected resume
  - shows `No resume selected`
  - only `Add resume` before selection
- Simplified target role interaction:
  - removed `Confirm role`
  - JD/quick role validity automatically unlocks settings
- Simplified settings:
  - removed follow-up intensity UI
  - kept default `medium` follow-up intensity internally for the session config contract
- Added a fixed bottom summary bar aligned to the setup shell width.
- Added setup validation tests via `npm run test:setup`.

## Key Product Decisions

- The setup module should not over-structure resume parsing.
  The important path is `PDF/text extraction -> privacy removal -> complete remaining material for AI`.
- Structured extraction is not the source of truth for the AI context because it can drop important resume information.
- Privacy filtering is intentionally simple and line-based for now.
  This is safer than partial redaction in early MVP, but it can remove a whole line if private data and useful content are mixed.
- Session settings are mostly pre-set.
  The user should only provide resume + target role, then lightly adjust focus/level if needed.
- Follow-up intensity remains in the backend config as a default, but is not exposed in the UI.

## Important Files

```text
components/product/setup/setup-flow.tsx
app/api/setup/parse-resume/route.ts
lib/product/setup-validation.ts
scripts/setup-validation.test.ts
docs/qa/setup-flow-use-cases.md
package.json
package-lock.json
next.config.mjs
tsconfig.json
```

## Verification Already Run

```text
npm run test:setup
npm run lint
npm run typecheck
npm run build
```

Known build warning:

- Supabase package emits a Next Edge Runtime warning about `process.version`.
- Build still succeeds.
- This warning predates the setup UI changes and should be handled with the auth/middleware work, not inside the setup UI patch.

Real PDF fixture used for validation:

```text
/Users/miumiu/Documents/项目/job_applications/resume/output/resume_en.pdf
```

Observed real PDF parser result:

- API returned `200`.
- Non-private extracted text was preserved.
- Email, phone, LinkedIn/social URL, personal website, and work authorization were removed.
- Project keywords such as `Telegram`, `n8n`, `Airtable`, and `AI agents` were preserved.

## What Is Left And Why

1. Persist uploaded resumes.
   Current uploaded resumes live in client state only. Production needs a Supabase table/object-storage path so a user can return later and reuse the parsed resume.

2. Create the real interview session on Start.
   The UI currently builds and validates `session_config`, but does not persist a session row or navigate into the interview runtime. This is required before the setup module can be considered end-to-end complete.

3. Connect setup output to question generation.
   The sanitized resume material and target role/JD need to feed the interviewer/mentor generation pipeline. Without this, setup is visually complete but not functionally connected to interview quality.

4. Add authenticated-user ownership and RLS checks.
   Resume uploads and sessions are user data. Production needs database ownership, RLS policies, and storage access rules before real deployment.

5. Decide whether to support OCR/scanned PDFs.
   Current parser supports text-layer PDFs. Image-only PDFs need OCR, which adds dependency, latency, privacy, and cost questions. This should be a product decision, not an implicit parser change.

6. Revisit privacy redaction granularity.
   Line-level removal is simple and safe for MVP, but can remove useful content if contact/private data appears on a content-rich line. A later version can use field-level redaction with tests.

7. Update the setup product spec or mark deliberate deviations.
   The implementation now intentionally differs from parts of `docs/product_spec/OfferUp-Setup-Page-Spec.md`, especially the simplified settings and hidden follow-up intensity. These should be accepted as product decisions or the UI should be changed back to spec.

8. Add browser-level regression tests.
   Current tests cover validation/parsing logic. The actual upload modal, empty state, PDF upload interaction, fixed bottom bar, and target role auto-unlock need Playwright coverage before release.

## Local Preview

Use the auth-bypass preview while iterating on setup:

```text
http://localhost:3001/setup?mode=focused
```

`localhost:3000/setup` may redirect to `/auth?returnTo=%2Fsetup` because it uses the real Supabase auth env.

