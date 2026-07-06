# OfferUp — Dev Handoff

**Last updated:** 2026-07-06
**Current branch:** `codex/meeting-session-part`
**Current status:** Production-shaped setup-to-feedback flow is implemented locally through Slice 7, and the interview module has started Slice 9 voice-first work. Local Supabase authenticated API smoke testing has passed for sign-in, session creation, credit spend idempotency, question generation, text answer submission, session completion, feedback generation, and feedback result retrieval. The interview UI now prioritizes spoken answers with toggle-to-talk controls, OpenAI STT/TTS route handlers, and DeepSeek-backed follow-up decision support with deterministic fallback.

---

## 1. Core Direction

OfferUp is being rebuilt from the old `demo-mvp/` prototype into a production Next.js App Router application.

Important product/design correction from the user:

- Do not rewrite a new product experience from scratch.
- The old landing page and several demo flows were already polished by the user.
- The right approach is to identify which old pages/content/interactions can be reused, migrate them into the new architecture, and only adjust where the current MVP/product decisions require it.

The old demo remains visually and structurally valuable, but not architecturally production-ready.

Use this document as the source for the next agent/developer to avoid drifting back into a fresh generic SaaS UI.

---

## 2. Current Architecture

The new production skeleton has been created at the project root.

Implemented production stack:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn-style local components
- Radix UI behavior primitives where needed
- lucide-react icons
- Supabase wrappers, local Supabase config, schema migrations, RLS, and credit RPCs

Important files/directories:

```text
app/
components/
components/ui/
components/layout/
components/product/
lib/
lib/supabase/
styles/
supabase/migrations/
docs/product_spec/
```

Do not continue production work inside `demo-mvp/`.

Implemented production flow:

- `/home`
- `/setup`
- `/session/[id]/prep`
- `/session/[id]/call`
- `/session/[id]/interview`
- `/session/[id]/wrap`
- `/session/[id]/feedback`
- Session route handlers under `app/api/session/*`
- Deterministic workflow boundaries under `lib/ai/workflows/*`
- Voice-first interview UI in `components/product/interview/interview-room.tsx`
- OpenAI audio route handlers:
  - `POST /api/session/transcribe`
  - `POST /api/session/speech`

---

## 3. Design System Contract

Primary reference:

```text
docs/product_spec/OfferUp-Design-System.md
```

Visual preview:

```text
docs/offerup-design-system-preview.html
```

Design direction:

- Refined editorial workspace.
- Warm, precise, calm, practice-focused.
- Avoid generic SaaS dashboard visuals.
- Avoid score-first analytics pages.
- Avoid green-dominant UI.
- Avoid page-local visual systems.

Component strategy:

- Use local `components/ui/*`.
- Use shadcn-style source-owned components, not external visual defaults.
- Use OfferUp tokens for color, type, radius, spacing, state, and surfaces.
- Use Tailwind, but map styling through project tokens.

Do not introduce:

- Raw hex colors outside token files.
- Page-local button/input/card variants.
- Nested cards.
- Decorative gradient blobs/orbs.
- New page copy that replaces already-polished old content without reason.

---

## 4. Product Decisions Locked During This Session

AI/feedback:

- Full final feedback can be slow, so feedback should be progressive.
- Show a high-level summary first when possible.
- Single-question feedback can be generated or expanded on demand if needed.
- Fallback must not silently replace AI in real user scenarios.
- LangSmith should be connected in MVP if not too much trouble, so the user can learn engineering observability practice.

Fit map:

- `fit_map` means the structured match between resume/materials and target role/JD.
- It should guide question generation, follow-up logic, and evaluation.
- It should be persisted rather than being only a temporary prompt artifact.

Voice/STT:

- The product is for spoken interview practice, so text-only answer input is not acceptable as the main path.
- MVP voice path should be: user records audio -> STT converts audio to text -> text is sent to the LLM.
- Do not send raw audio to the main reasoning LLM as the default MVP path.
- Limit one recording to about 5 minutes because STT cost can exceed text LLM cost.
- Do not use cheap/mechanical browser TTS as a fake interviewer voice.

Credit/cost control:

- Add a credit system so users cannot repeatedly consume expensive AI/STT calls without limit.
- Keep credit accounting separate enough to support ledger/audit/expiration/usage history later.
- It is okay to show current credit balance on profile/dashboard, but do not make the profile row the only source of truth.

Weakness tracking:

- Add cross-session identity for weak points.
- Reuse `question_library.tags` style capability tags such as `ownership`, `impact`, `conflict`.
- Feedback JSON should include something like `weak_signal_tags: string[]`.
- Add or plan `user_skill_signals` for lightweight aggregation across sessions.

Mentor quality:

- Mentor output must add value beyond rephrasing Interviewer feedback.
- Minimum value forms:
  - concrete improved wording/example answer, or
  - translation of how an interviewer is likely interpreting the answer.

Answer Bank:

- `Answer Bank` is the user’s saved personal answer library.
- Do not call it `Question Bank`.
- `Question Library` means the public/system question source.
- Old demo copy that says `Question Bank` should be renamed during migration.

---

## 5. Documentation Updated

These docs have been updated or added during the planning/build pass:

```text
docs/product_spec/OfferUp-Tech-Architecture.md
docs/product_spec/OfferUp-Implementation-Plan.md
docs/product_spec/OfferUp-Legacy-Reuse-Audit.md
```

Most important addition:

```text
docs/product_spec/OfferUp-Legacy-Reuse-Audit.md
```

That file records which old demo surfaces should be reused and how.

---

## 6. Implementation Already Done

New production skeleton:

- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `next.config.mjs`
- `postcss.config.mjs`
- `tailwind.config.ts`
- `.env.example`
- `.eslintrc.json`
- `middleware.ts`
- `next-env.d.ts`

Styles:

- `styles/tokens.css`
- `styles/globals.css`

Layouts:

- `components/layout/marketing-shell.tsx`
- `components/layout/app-shell.tsx`
- `components/layout/report-shell.tsx`

UI primitives:

- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/textarea.tsx`
- `components/ui/badge.tsx`
- `components/ui/panel.tsx`
- `components/ui/list-row.tsx`
- `components/ui/report-block.tsx`
- `components/ui/modal.tsx`
- `components/ui/toast.tsx`
- `components/ui/tooltip.tsx`

Supabase:

- `lib/supabase/env.ts`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/admin.ts`
- `supabase/migrations/202606190001_initial_schema.sql`
- `supabase/migrations/202607011113_api_grants.sql`
- `supabase/config.toml`

Important database status:

- Local Supabase project config exists.
- `.env.local` exists locally and remains gitignored.
- Both migrations have been applied and reset-tested locally.
- Auth bootstrap, RLS, credit account bootstrap, credit ledger bootstrap, and credit RPCs have been smoke-tested locally.
- On 2026-07-05, an authenticated API smoke test completed the full local Supabase setup-to-feedback path and confirmed `spend_credits` idempotency for session creation.

Landing page:

- `components/product/landing/landing-page.tsx`
- `app/page.tsx`

The landing page has already been migrated from the old polished demo content and is the current example of the right migration approach.

Verification after landing migration:

```text
npm run lint
npm run typecheck
npm run build
curl -I http://127.0.0.1:3000/
```

All passed at the time of migration.

---

## 7. Current Local Server

A dev server was started earlier:

```text
npm run dev
```

Expected local URL:

```text
http://localhost:3000/
```

If continuing work, check whether the session is still running before starting another server.

---

## 8. Current UI State

Done:

- Landing page has been migrated from the polished old demo into new Next.js/Tailwind architecture.
- `/home` has a production dashboard shell and modules.
- `/setup` has the production setup flow with resume upload/parsing, privacy filtering, target role/JD input, and session creation wiring.
- `/session/[id]/prep`, `/call`, `/interview`, `/wrap`, and `/feedback` exist as the first production text-answer loop.

Still needs hardening:

- Browser-level regression coverage for the full setup-to-feedback path.
- Product acceptance review for setup spec deviations documented in `docs/qa/setup-module-handoff.md`.
- Real microphone QA for toggle-to-talk, OpenAI STT, OpenAI TTS playback, and AI follow-up quality.
- Answer polish / save-to-bank flow is not complete.

---

## 9. Legacy Demo Reuse Map

Old demo source files:

```text
demo-mvp/public/landing.html
demo-mvp/public/index.html
demo-mvp/public/setup.html
demo-mvp/public/interview.html
demo-mvp/public/feedback.html
```

Reuse priorities:

1. Landing page
   - Status: migrated.
   - Source: `demo-mvp/public/landing.html`.

2. Dashboard/Home
   - Status: production shell implemented; needs product acceptance and browser QA.
   - Source: old `index.html` / dashboard state in `landing.html`.
   - Keep the existing dashboard information structure:
     - greeting
     - practice mode entries
     - recent sessions
     - Answer Bank / saved answers entry
     - profile/resume material entry
     - credit balance can be added without taking over the page

3. Setup
   - Status: production setup flow implemented; needs product acceptance on deliberate spec deviations and browser QA.
   - Source: `demo-mvp/public/setup.html` and setup modal in `landing.html`.
   - Keep:
     - resume material section
     - target role section
     - optional custom JD
     - interview focus
     - preparation/waiting copy
   - Adjust:
     - old 5-question language -> current 3-question MVP
     - full simulation -> locked/later unless user says otherwise

4. Interview session
   - Status: first production text-answer loop implemented; voice-first UI and STT/TTS route handlers added; real microphone/TTS QA still pending.
   - Source: `demo-mvp/public/interview.html`.
   - Keep:
     - incoming/live interview structure
     - spoken-answer rhythm
     - push-to-talk direction
   - Adjust:
     - 3-question MVP
     - real STT path
     - 5-minute recording cap
     - no silent AI fallback
     - no cheap browser TTS as primary interviewer voice

5. Feedback
   - Status: first production feedback report implemented with deterministic feedback generation.
   - Source: `demo-mvp/public/feedback.html`.
   - Keep:
     - overall feedback
     - per-question review cards
     - interviewer/mentor distinction where valuable
     - polish and save flow
   - Adjust:
     - progressive feedback
     - weak signal tags
     - Answer Bank naming
     - on-demand polish

---

## 10. Database Work Plan

This section maps to `OfferUp-Implementation-Plan.md` Slice 2: Supabase Schema, RLS, And Auth.

Current branch:

```text
codex/meeting-session-part
```

Current database status:

- Local-first Supabase path is initialized, migrated, and smoke-tested.
- `.env.local` exists locally and remains gitignored.
- Cloud Supabase is not confirmed linked/pushed from this repository.
- Treat local Supabase as verified for development, but do a separate cloud smoke before deployment.

Already present:

- Initial migration: `supabase/migrations/202606190001_initial_schema.sql`.
- API grants migration: `supabase/migrations/202607011113_api_grants.sql`.
- Local Supabase config: `supabase/config.toml`.
- Supabase client wrappers:
  - `lib/supabase/env.ts`
  - `lib/supabase/client.ts`
  - `lib/supabase/server.ts`
  - `lib/supabase/admin.ts`
- Env placeholders in `.env.example`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

Still not done:

- No cloud Supabase project has been linked.
- Auth settings such as email confirmation and Google OAuth have not been configured in Supabase Dashboard.
- No cloud migration push has been run.
- No production/staging Supabase env values have been added.
- No browser-level authenticated regression test has been added to the repo.

Done locally:

- `supabase/config.toml` was generated with Supabase CLI v2.109.0.
- Local Supabase Docker stack was started successfully.
- Initial schema migration was applied locally.
- API grants migration was added and applied locally:
  - `supabase/migrations/202607011113_api_grants.sql`
- `.env.local` was generated with local Supabase values and remains gitignored.
- Local smoke checks passed for:
  - public table creation
  - RLS enabled on all public tables
  - RLS policies present
  - auth user bootstrap trigger present
  - `profiles` bootstrap
  - `credit_accounts` bootstrap with balance `10`
  - `credit_ledger` bootstrap with `signup_grant`
  - authenticated user can read only own profile/credit rows
  - authenticated user cannot directly update `credit_accounts`
  - authenticated user can read `question_library`

Next database-related work:

1. Before deployment, choose or create the cloud Supabase project.
2. Link the project and push/replay migrations there.
3. Configure auth settings in Supabase Dashboard, especially email confirmation and Google OAuth.
4. Add production/staging env values outside git.
5. Repeat the authenticated setup-to-feedback smoke test against cloud.

Safety notes:

- Do not edit an already-applied migration; add a forward migration instead.
- Do not drop/rename tables, columns, or auth/session logic without explicit confirmation.
- Do not print full Supabase keys in logs or handoff notes.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only and never expose it through `NEXT_PUBLIC_*`.

Verification record:

- 2026-06-30: Created branch `codex/database`.
- 2026-06-30: Confirmed only the migration file exists; no Supabase project config or local env file is present.
- 2026-06-30: Added this database work plan to `docs/HANDOFF.md`.
- 2026-07-01: Opened Docker Desktop and started local Supabase.
- 2026-07-01: Homebrew install for Supabase CLI failed because local Command Line Tools are outdated; `npx supabase` failed on darwin-arm64 binary package lookup.
- 2026-07-01: Downloaded Supabase CLI v2.109.0 darwin-arm64 from the official GitHub release into `/private/tmp/supabase-cli`, verified SHA-256, and used it without committing the binary.
- 2026-07-01: Ran `supabase init`; generated `supabase/config.toml`.
- 2026-07-01: Ran `supabase start`; initial schema migration applied locally.
- 2026-07-01: RLS smoke test found missing SQL privileges for the `authenticated` role; fixed with forward migration `202607011113_api_grants.sql`.
- 2026-07-01: Applied `202607011113_api_grants.sql` with `supabase migration up`.
- 2026-07-01: Generated `.env.local` with local Supabase values; secrets were not printed in handoff or final notes.
- 2026-07-01: Ran `supabase db reset`; both migrations replayed from an empty local database successfully.
- 2026-07-01: Re-ran smoke checks after reset: 11 public tables, 11 RLS-enabled tables, 12 policies, 4 public helper/RPC functions.
- 2026-07-01: Recreated a local smoke-test auth user after reset; confirmed profile bootstrap, `credit_accounts` balance `10`, `signup_grant` ledger row, own-row reads, and direct credit update denial.
- 2026-07-01: Ran `npm run lint`, `npm run typecheck`, and `npm run build`; all passed. Build still reports a Supabase package Edge Runtime warning, but completes successfully.
- 2026-07-05: Ran `npm run test:setup`, `npm run lint`, `npm run typecheck`, and `npm run build`; all passed.
- 2026-07-05: Started local Next.js dev server and ran authenticated local Supabase API smoke with a `codex-smoke-*` test user. Verified `/setup` authenticated access, `POST /api/session/create`, duplicate create idempotency, `POST /api/session/questions`, three `POST /api/session/answer` calls, `POST /api/session/end`, `POST /api/session/feedback`, `GET /api/session/[id]/result`, credit balance `10 -> 7`, and exactly one `interview_start` ledger spend row.
- 2026-07-05: Ran partial authenticated browser smoke with gstack browse and `codex-ui-qa-*` users. Verified sign-up -> setup, resume picker, resume parsing/confirm, JD input, Start interview, call page, Accept call, interview page, text answer submit, and follow-up rendering. No console errors were observed. Full browser wrap/feedback pass is still pending.
- 2026-07-05: Added voice-first interview UI, OpenAI STT/TTS route handlers, call-page ringtone, live browser speech-recognition preview where supported, and DeepSeek follow-up decision support with fallback. Ran `npm run lint`, `npm run typecheck`, `npm run test:setup`, and `npm run build`; all passed. Browser smoke reached the new interview UI and showed voice controls, Space hint, replay, text fallback, and no console errors. Real microphone and paid API quality testing still pending.
- 2026-07-06: Changed voice input from hold-to-speak to toggle-to-talk: press Space or the mic button once to start, press again to send. Live browser speech preview now accumulates confirmed transcript across brief pauses/restarts while OpenAI STT remains the final submitted transcript source. Ran `npm run lint`, `npm run typecheck`, and `npm run build`; all passed.
- 2026-07-06: Tightened the interview room layout for the fixed bottom console: conversation content now scrolls inside the visible viewport and auto-centers the active dialogue. The voice console was compressed into a single prompt line plus one compact action row, and the old replay/playing control was removed. Candidate speech now remains visible as a pending bubble through transcribing/submitting until the saved exchange returns. TTS defaults were tuned to `cedar` with professional interviewer instructions for a steadier, more natural pace. Ran `npm run lint`, `npm run typecheck`, and `npm run build`; all passed.

---

## 11. Exact Next Step

Next engineering step:

1. Move into Feedback page hardening: compare the current `/session/[id]/feedback` implementation against `docs/product_spec/OfferUp-Feedback-Module-Spec.md` and the legacy `demo-mvp/public/feedback.html` reuse map.
2. Manually QA real microphone recording in Chrome/Safari when doing the next full setup-to-feedback pass: press Space once to start, press again to send, STT transcript, answer persistence, follow-up rendering, and fixed-console auto-scroll.
3. Run one paid OpenAI TTS/STT + DeepSeek follow-up quality test with a short session and record observed latency/quality.
4. Add browser-level regression coverage for the authenticated setup-to-feedback path, or run a manual browser QA pass if a test framework is still deferred.
5. Replace deterministic `fit_map` and question generation with DeepSeek-backed logic behind `lib/ai/workflows/create-session.ts` and `lib/ai/workflows/generate-questions.ts`.

---

## 12. Verification Commands

Run after meaningful UI changes:

```text
npm run lint
npm run typecheck
npm run build
```

Smoke test important routes:

```text
curl -I http://127.0.0.1:3000/
curl -I http://127.0.0.1:3000/home
curl -I http://127.0.0.1:3000/setup
```

If the in-app Browser tool is available, inspect the actual pages visually after significant frontend changes.

---

## 13. Worktree Notes

The worktree has many modified/untracked files from the rebuild and earlier project migration.

Do not revert unrelated user changes.

Known status characteristics:

- Many new production files are currently untracked.
- Old `Interview-Mentor-*` docs appear deleted because the project has moved to `OfferUp-*` specs.
- `.DS_Store` and some legacy files may show modified; ignore unless directly relevant.

Before committing, review the full diff intentionally.

---

## 14. Most Important Reminder

The user does not want a fresh parallel product.

The correct build posture is:

```text
preserve the polished legacy experience -> migrate into production architecture -> adjust only for locked MVP/product decisions
```

When in doubt, compare against `demo-mvp/public/*` before inventing new UI or copy.
