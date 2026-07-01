# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js App Router rebuild of OfferUp, an interview practice product. Main source lives in `app/`, with route pages such as `app/home/page.tsx`, `app/setup/page.tsx`, and auth route handlers under `app/auth/`. Shared UI and layout primitives live in `components/`, grouped by `components/ui/`, `components/layout/`, and `components/product/`. Supabase clients and helpers live in `lib/supabase/`; general utilities live in `lib/utils.ts`. Global styles and design tokens are in `styles/`. Database schema migrations are in `supabase/migrations/`. Product, design, and architecture specs are in `docs/product_spec/`.

`demo-mvp/` is a historical runnable prototype only. Do not extend it as production architecture, and do not copy its logic directly into production code — if a prototype behavior (e.g. a scoring heuristic or prompt) needs to move into production, re-derive and re-spec it under `docs/product_spec/` first, then implement it fresh in `app/` or `lib/`. `docs/archive/` is reference material, not implementation authority.

## Build, Test, and Development Commands
- `npm run dev`: start the local Next.js development server.
- `npm run build`: create a production build and run Next.js type validation.
- `npm run start`: serve the production build locally.
- `npm run lint`: run Next.js ESLint checks.
- `npm run typecheck`: run TypeScript with `tsc --noEmit`.
- `PORT=8790 node demo-mvp/server.js`: run the historical prototype only.

Before handing off code changes, run `npm run lint`, `npm run typecheck`, and `npm run build`. These three commands are the required verification gate — there is no dedicated test framework yet (see Testing Guidelines).

## Secrets & Environment Variables
- Never commit `.env`, `.env.local`, or any file containing a Supabase key, DeepSeek API key, or connection string. Confirm `.gitignore` covers them before adding new env files.
- Never hardcode a key or secret directly in source, scripts, or sample code, even temporarily "for testing."
- Never print, log, or echo full env variable values (including in debug output, error messages, or commit messages). If a key needs to appear in a discussion, redact all but the last 4 characters.
- If a new environment variable is introduced, add a placeholder entry to `.env.example` (create one if it doesn't exist) with a description of what it's for — do not leave new required config undocumented.

## Database Migrations (`supabase/migrations/`)
- Treat any migration file that has already been applied (locally or in production) as immutable. Fix mistakes with a new forward migration, never by editing an old one — editing an applied migration silently desyncs local and production schema.
- Every new migration must be run and verified locally before being treated as done. Don't write a migration "blind" without confirming it applies cleanly.
- Migrations that drop columns, drop tables, or change column types are destructive — flag these explicitly and confirm with the project owner before applying, even in a solo-dev setup, since these are hard or impossible to reverse once data exists.
- Note any RLS (Row Level Security) policy implications when a migration touches a table that holds user data.

## LLM API Usage (DeepSeek)
- Local development and any automated checks must mock or stub LLM calls by default. Don't let `npm run dev`, lint, typecheck, or build trigger real DeepSeek API calls.
- If a task genuinely requires hitting the real API (e.g. validating a new prompt), say so explicitly before doing it, since it incurs real cost.
- Don't loop or retry LLM calls without an explicit cap — a silent retry loop against a paid API is a cost risk, not just a performance one.

## Coding Style & Naming Conventions
Use TypeScript, React Server Components by default, and client components only when interactivity requires them. Follow existing formatting: two-space indentation, double quotes, semicolons omitted, and named exports for shared components. Use kebab-case filenames for components and routes, for example `credit-balance.tsx` and `saved-resume-picker.tsx`. Keep styling tied to `styles/tokens.css`, Tailwind config, and shared UI components; do not invent page-specific colors, shadows, radii, or button variants.

## Testing Guidelines
No dedicated test framework is currently configured. Treat `lint`, `typecheck`, and `build` as the required verification gate. Core business logic — scoring/evaluation, cross-session weakness tracking, feedback generation — has no automated safety net yet, so any change touching these areas should come with a short manual verification note in the PR/commit (what was checked, with what input, what output was expected) until real tests exist. If adding tests later, prefer colocated `*.test.ts` / `*.test.tsx` files for unit behavior and Playwright specs for user flows such as auth, setup, dashboard, and answer bank.

## Scope Discipline ("Unrelated Changes")
- A change's diff should match its stated task. If you notice an unrelated bug, inconsistency, or improvement opportunity while working, report it (e.g. as a comment or follow-up note) instead of fixing it inline in the same change.
- Do not reformat, rename, or refactor code you weren't asked to touch, even if it doesn't match current style conventions. Raise it separately.
- Preserve unrelated user changes already present in the working tree — never discard or overwrite local edits outside the scope of the current task.

## Operations Requiring Explicit Confirmation
Do not perform the following without first checking with the project owner, even when the request seems to imply it:
- Editing or deleting an already-applied migration file.
- Dropping or renaming an existing database column, table, or API route.
- Introducing a new third-party dependency.
- Changing authentication, authorization, or session-handling logic.
- Any destructive operation on data (bulk delete, bulk update) outside of a reviewed migration.
- Modifying anything under `docs/product_spec/` as if it were just another doc — these are the architecture source of truth; changes here are a decision, not a typo fix.

If a requirement is ambiguous and doesn't fall into the list above, clarify scope before editing rather than guessing.

## Commit & Pull Request Guidelines
Recent history uses short Conventional Commits such as `feat: ...` and `chore: ...`. Keep commits focused and descriptive. In this solo-developer setup, commits may merge directly without a formal PR review — but the verification gate (lint, typecheck, build) still applies to every change. When a PR is used, include a concise summary, verification commands run, linked issue or product spec when relevant, and screenshots for UI changes.

## Agent-Specific Instructions
Before production work, read `README.md`, `docs/HANDOFF.md`, `docs/README.md`, `docs/product_spec/OfferUp-Implementation-Plan.md`, `docs/product_spec/OfferUp-Tech-Architecture.md`, and `docs/product_spec/OfferUp-Design-System.md`. At the start of any non-trivial task, state in one line which spec/phase the task maps to — this is a self-check, not paperwork, and it's the cheapest way to catch a misunderstanding before writing code. Preserve unrelated user changes. If requirements are unclear, clarify scope before editing.