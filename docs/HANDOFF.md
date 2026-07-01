# OfferUp — Dev Handoff

**Last updated:** 2026-07-01  
**Current branch:** `codex/database`  
**Current status:** Production rebuild started. Current focus is Slice 2 database setup: the initial Supabase schema migration exists, but no actual Supabase project/local database has been initialized, linked, or verified yet.

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
- Supabase wrappers and initial schema migration

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

Important database status:

- The repository has a schema migration file.
- The repository does not currently have `supabase/config.toml`.
- The repository does not currently have `.env.local` or `.env` with Supabase values.
- Therefore the database has not yet been created/applied for this project. Treat the SQL migration as planned schema, not as proof that a local or cloud database exists.

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

Still temporary / needs replacement:

- `/home`
- `/setup`

These two routes currently contain scaffolded or newly-created placeholder modules. They should be replaced with migrated old demo content/structure.

Do not treat the current `/home` and `/setup` as product-approved.

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
   - Status: next to migrate.
   - Source: old `index.html` / dashboard state in `landing.html`.
   - Keep the existing dashboard information structure:
     - greeting
     - practice mode entries
     - recent sessions
     - Answer Bank / saved answers entry
     - profile/resume material entry
     - credit balance can be added without taking over the page

3. Setup
   - Status: migrate after Dashboard.
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
   - Status: after Dashboard/Setup.
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
   - Status: after Interview.
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
codex/database
```

Current user intent:

- Plan the database work clearly before execution.
- Maintain the work plan and status in this handoff document.
- Avoid confusing "migration file exists" with "database has been created."

Already present:

- Initial migration: `supabase/migrations/202606190001_initial_schema.sql`.
- Supabase client wrappers:
  - `lib/supabase/env.ts`
  - `lib/supabase/client.ts`
  - `lib/supabase/server.ts`
  - `lib/supabase/admin.ts`
- Env placeholders in `.env.example`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

Not done yet:

- No cloud Supabase project has been linked.
- Auth settings such as email confirmation and Google OAuth have not been configured in Supabase Dashboard.
- No cloud migration push has been run.
- No production/staging Supabase env values have been added.

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

Execution plan:

1. Confirm target database mode.
   - Local-first option: initialize Supabase locally, start the local stack, apply migrations, and verify schema/RLS locally.
   - Cloud option: create or select a Supabase cloud project, add local `.env.local`, link the project, push migrations, and verify in Dashboard/SQL.

2. Initialize project config.
   - Run Supabase CLI initialization if `supabase/config.toml` is absent.
   - Keep generated config minimal and review before committing.
   - Do not commit real secrets.

3. Apply and verify migration.
   - Apply `202606190001_initial_schema.sql` to the selected target.
   - Verify tables, indexes, RLS policies, triggers, and RPC functions exist.
   - Specifically verify `handle_new_user`, `spend_credits`, and `grant_credits`.

4. Verify auth bootstrap behavior.
   - Create a test user in the selected environment.
   - Confirm a matching `profiles` row is created.
   - Confirm a `credit_accounts` row is created with default balance `10`.
   - Confirm a `credit_ledger` row is created with reason `signup_grant`.

5. Verify RLS behavior.
   - Confirm authenticated users can read their own rows.
   - Confirm cross-user access is blocked.
   - Confirm users can read their own credit account, credit ledger, and skill signals.
   - Confirm users cannot directly mutate credit or skill signal tables from the client role.
   - Confirm `question_library` is readable by authenticated users and not client-writable.

6. Connect Next.js.
   - Create `.env.local` locally with real Supabase values.
   - Keep `.env.local` uncommitted.
   - Run `npm run lint`, `npm run typecheck`, and `npm run build`.
   - Start the app and smoke test auth/database-dependent routes once auth UI is ready.

Open decision before execution:

- Choose local Supabase first or cloud Supabase first.
- If cloud: the user/project owner must provide or create the Supabase project and supply the required env values locally.

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

---

## 11. Exact Next Step

First, execute the database work plan above. After the target database is initialized, migrated, and verified, continue with Dashboard/Home migration.

Target route:

```text
app/home/page.tsx
```

Existing temporary components that may be edited/replaced:

```text
components/product/dashboard/credit-balance.tsx
components/product/dashboard/mode-entry.tsx
components/product/dashboard/practice-activity-list.tsx
components/product/dashboard/asset-shortcut.tsx
```

Migration goal:

- Make `/home` feel like the old polished dashboard, not a newly invented admin panel.
- Keep the old copy/information architecture where still valid.
- Rename `Question Bank` to `Answer Bank`.
- Add credit balance carefully as a small operational affordance, not the main narrative.
- Show full simulation as locked/later for MVP unless user confirms it should be active.

After `/home`, migrate `/setup`.

Target route:

```text
app/setup/page.tsx
```

Existing temporary components that may be edited/replaced:

```text
components/product/setup/mode-selector.tsx
components/product/setup/locked-mode-entry.tsx
components/product/setup/resume-textarea.tsx
components/product/setup/jd-input.tsx
components/product/setup/saved-resume-picker.tsx
components/product/setup/jd-history-picker.tsx
```

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
