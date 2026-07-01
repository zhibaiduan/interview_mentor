# OfferUp — Implementation Plan

**Status:** Ready for production rebuild  
**Last updated:** 2026-06-19  
**Purpose:** Convert the frozen product, design, technical, and database specs into an execution order for the Next.js rebuild.

---

## 1. Build Principles

- Build the actual app first, not a marketing shell.
- Keep P0 text-answer flow reliable before adding voice.
- Use the design system through tokens and shared components, not page-local styling.
- Use Route Handlers for AI and database workflows.
- Keep demo fallback complete and deterministic from the first AI slice.
- Do not create `/resumes` or `/jd-history` pages in MVP; use Setup picker panels.
- Add credit checks before high-cost AI workflows; use ledger/idempotency rather than ad hoc balance edits.
- Trace AI workflows through LangSmith via a local wrapper; tracing must never break user-facing flows.
- Persist weak skill signals early so cross-session coaching has a stable foundation.
- Keep voice as Push to Talk + STT for MVP; single answer recordings have a 5-minute hard cap.

Primary source documents:

- `OfferUp-MVP-PRD.md`
- `OfferUp-Design-System.md`
- `OfferUp-Tech-Architecture.md`
- `OfferUp-Demo-Scenario.md`
- `OfferUp-Legacy-Reuse-Audit.md`

---

## 2. Implementation Slices

### Slice 0 — Project Skeleton And Design Foundation

Goal: create the production app foundation before feature pages.

Build:

- Next.js App Router project structure.
- `styles/tokens.css`
- `styles/globals.css`
- Tailwind config mapped to CSS variables.
- Font loading: Google-hosted Lora + IBM Plex Sans.
- Base shells:
  - `MarketingShell`
  - `AppShell`
  - `ReportShell`

Acceptance:

- App boots locally.
- No raw hex values outside token/global style files.
- App canvas uses warm paper background and CSS-only texture.
- Sidebar keeps labels until 768px.
- No border-heavy page scaffolding.

Do not build yet:

- AI calls.
- Supabase schema.
- Full product pages.

---

### Slice 1 — UI Primitives

Goal: make route pages composable without inventing local visual variants.

Build:

- `Button`
- `Input`
- `Textarea`
- `Badge`
- `Panel`
- `ListRow`
- `ReportBlock`
- `Modal`
- `Toast`
- `Tooltip`

Acceptance:

- Component variants match `OfferUp-Design-System.md`.
- Primary app actions use ink by default.
- Sage appears only for save/success/completion.
- `developing` state uses amber-soft.
- Locked states do not look like errors.

Do not build:

- Page-local card/button/input styles.

---

### Slice 2 — Supabase Schema, RLS, And Auth

Goal: establish persistent identity and safe user-owned data access.

Build:

- Supabase migrations for:
  - `profiles`
  - `resumes`
  - `jd_history`
  - `interview_sessions`
  - `question_chains`
  - `session_feedback`
  - `answer_bank`
  - `question_library`
  - `credit_accounts`
  - `credit_ledger`
  - `user_skill_signals`
- RLS policies and indexes from `OfferUp-Tech-Architecture.md`.
- Credit RPC / transaction helpers:
  - `spend_credits`
  - `grant_credits` or equivalent admin/refund path
- Supabase clients:
  - `lib/supabase/client.ts`
  - `lib/supabase/server.ts`
  - `lib/supabase/admin.ts`
- `/auth` unified page with sign in / sign up tabs.
- `/auth/callback` for Google OAuth.
- Protected-route middleware.

Acceptance:

- Email/password auth works.
- Google OAuth works.
- Session persists on refresh.
- New user gets a `profiles` row.
- New user gets a `credit_accounts` row with the default free credit grant and a `signup_grant` ledger entry.
- Unauthenticated protected routes redirect to `/auth?returnTo=...`.
- RLS prevents cross-user access.
- Client-side users can read their own credit balance, credit ledger, and skill signals, but cannot directly mutate them.
- Credit spend is atomic and idempotent; duplicate idempotency keys do not double charge.

Do not build:

- Password reset.
- Email verification.
- GitHub/LinkedIn OAuth.

---

### Slice 3 — Dashboard And Setup

Goal: let a logged-in user start a focused interview with minimal friction.

Before building new page content, migrate reusable structure and copy from `demo-mvp/public/index.html`, `demo-mvp/public/landing.html`, and `demo-mvp/public/setup.html` according to `OfferUp-Legacy-Reuse-Audit.md`.

Build:

- `/home`
- `/setup?mode=focused`
- `/setup?panel=resumes`
- `/setup?panel=jd-history`
- Dashboard modules:
  - `ModeEntry`
  - `PracticeActivityList`
  - `AssetShortcut`
  - `CreditBalance`
- Setup modules:
  - `SavedResumePicker`
  - `ResumeTextarea`
  - `JDInput`
  - `JDHistoryPicker`
  - `ModeSelector`
  - `LockedModeEntry`

Acceptance:

- Dashboard shows full P0 logged-in experience.
- Dashboard and Setup show current credits without making credits the visual center of the page.
- `Start` routes to `/setup?mode=focused`.
- My resumes routes to `/setup?panel=resumes`.
- JD history routes to `/setup?panel=jd-history`.
- Setup is an independent page, not a Dashboard modal.
- Saved resume / JD picker opens inside Setup and fills the form.
- Setup blocks Start Interview when credits are insufficient and shows the MVP request-more-credits path.
- Mode 2, Deutsch, and locked modules use shared locked state.

Do not build:

- `/resumes` page.
- `/jd-history` page.
- Advanced dashboard analytics.

---

### Slice 4 — Demo Fallback Data

Goal: make the full demo reliable before depending on live AI.

Build:

- `lib/demo/demo-scenario.ts`
- `lib/demo/fallback-session.ts`
- `DEMO_MODE` handling in workflow helpers.
- Fixed demo resume, JD, generated questions, exchanges, feedback, polish output, and Answer Bank example.

Acceptance:

- Missing DeepSeek key in local development does not break the demo.
- Demo data can drive Setup, Interview, Feedback, Polish, and Save to Bank.
- Fallback data matches `OfferUp-Demo-Scenario.md`.

Do not build:

- Randomized fake content.
- Page-local hardcoded fallback snippets.

---

### Slice 5 — Session Creation And Question Generation

Goal: create a session and generate interview questions from real setup input.

Build Route Handlers:

- `POST /api/session/create`
- `POST /api/session/questions`

Build AI workflows:

- `create-session`
- `generate-questions`
- `fit-map`
- question-library reference retrieval
- LangSmith tracing via `traceAiWorkflow`

Acceptance:

- Setup submit creates `interview_sessions`.
- Starting an interview spends the configured credits exactly once, using an idempotency key.
- AI or fallback creates 3 main `question_chains`.
- `fit_map`, resume/JD snapshots, workflow stage, and question generation metadata are persisted.
- Questions are based on resume/JD context, not generic prompts.
- Call transition page can load the created session.
- Missing LangSmith env vars do not break session creation.
- Production failures do not silently replace a real user's data with unrelated demo fallback.

Do not build:

- Feedback generation.
- Voice.

---

### Slice 6 — Interview Text Flow

Goal: complete the core text interview loop.

Build pages:

- `/session/[id]/call`
- `/session/[id]/interview`

Build Route Handlers:

- `POST /api/session/answer`
- `POST /api/session/end`

Build AI workflow:

- `submit-answer`
- follow-up decision
- LangSmith tracing for `followup.decide`

Acceptance:

- User accepts call and enters session.
- Current question displays with `Q1 of 3` progress.
- User submits text answer.
- AI or fallback decides follow-up vs next question.
- Exchanges are persisted in `question_chains.exchanges`.
- `POST /api/session/answer` accepts `client_message_id` and does not duplicate exchanges on retry/double submit.
- `current_chain_index` and `workflow_stage` stay accurate enough for session recovery.
- End interview confirms before ending.

Do not build:

- Push to Talk.
- Browser TTS.
- Real-time voice.

---

### Slice 7 — Feedback Generation And Feedback UI

Goal: deliver the product's core aha moment.

Build Route Handlers:

- `POST /api/session/feedback`
- `GET /api/session/[id]/feedback-status`
- `GET /api/session/[id]/result`

Build AI workflows:

- `generate-feedback`
- overall summary feedback
- per-question interviewer feedback
- per-question mentor feedback
- skill signal aggregation to `user_skill_signals`
- aggregator to `Answer signal -> Interviewer heard -> Next version`
- LangSmith tracing for feedback workflows

Build page:

- `/session/[id]/feedback`

Acceptance:

- Feedback generation status moves `pending -> generating -> summary_ready -> ready` or `failed`.
- Overall summary is visible before all per-question details are complete.
- Mentor per-question feedback runs after the matching Interviewer feedback and adds either cognitive translation or example rewrite.
- Feedback page renders global and per-question feedback.
- Global feedback reads from `session_feedback`; per-question feedback reads from `question_chains`.
- Per-question feedback uses the three-part structure.
- `interviewer_feedback.weak_signal_tags` is saved and updates `user_skill_signals`.
- `language_note` appears only when language/expression affects understanding, credibility, or professional signal.
- UI is report-like, not score-first.

Do not build:

- Heavy analytics dashboard.
- Radar charts, large score widgets, or score-first hierarchy.

---

### Slice 8 — Answer Polish And Save To Bank

Goal: let users turn one answer into a better usable draft and save it.

Build Route Handlers:

- `POST /api/polish`
- `POST /api/bank/save`
- `GET /api/bank/[id]`

Build AI workflow:

- `polish-answer`
- LangSmith tracing for `answer.polish`

Build product modules:

- `PolishedAnswerPanel`
- `SaveToBankButton`
- Answer Bank list/detail P1 shell if time permits.

Acceptance:

- Polish is generated only after user click.
- Polish spends the configured credit exactly once per generated polished version.
- First visible output is a complete polished answer.
- `why_changed` is secondary/progressively disclosed.
- Saving original answer creates one `answer_bank` record.
- Re-saving original answer does not duplicate.
- Saving Polish for an existing source answer creates a new version with the same `answer_group_id`.
- Saved answers preserve `skill_tags`, `source_session_id`, `source_chain_id`, and `mastery_status`.
- Answer Bank behaves as a practice surface, not only a storage archive.

Do not build:

- Batch polish.
- "Perfect answer" copy.
- Polish version history inside the Polish panel.

---

### Slice 9 — Push To Talk And STT

Goal: make spoken answer practice usable without moving to real-time voice streaming.

Build Route Handlers:

- `POST /api/stt`

Build product modules:

- `PushToTalkRecorder`
- `TranscriptReview`

Acceptance:

- User can record a spoken answer and submit the transcript into the existing interview answer flow.
- Single answer recording has a 5-minute hard cap.
- UI gives a light nudge after 2 minutes to help the user wrap up.
- Transcription failure lets the user retry recording or edit/type the transcript.
- STT cost is covered by the interview credit for MVP and is not charged per recording.
- No automatic pause detection / VAD.
- No real-time streaming voice agent.

Do not build:

- Real-time voice streaming.
- Browser/mechanical interviewer TTS.
- Automatic pause detection / VAD.

---

### Slice 10 — Final QA And Demo Readiness

Goal: make the MVP presentation reliable.

Run:

- Auth smoke test.
- Dashboard/Setup flow.
- Full demo fallback flow.
- Real AI flow when env vars exist.
- LangSmith trace sanity check.
- Credit spend/refund/idempotency sanity check.
- RLS cross-user sanity check.
- Skill signal aggregation sanity check.
- STT recording length and failure handling sanity check.
- Mobile layout check for Landing, Auth, Dashboard, Setup, Interview, Feedback.
- Code review gate from `OfferUp-Design-System.md`.

Acceptance:

- A user can complete Landing → Auth → Dashboard → Setup → Call → Interview → Feedback → Polish → Save to Bank.
- A user can complete the core flow with spoken answers after STT is enabled.
- Demo still works if AI fails.
- Turning off LangSmith env vars does not break the app.
- No raw hex outside token/global files.
- No page-local visual systems.
- No border-heavy scaffolding.

---

## 3. First Commit Boundary

Recommended first production commit:

- Next.js skeleton.
- Token/global styles.
- Tailwind variable mapping.
- UI primitives.
- Layout shells.

Keep Supabase/Auth for the second commit so visual foundation and backend setup remain reviewable separately.

---

## 4. MVP Deferrals

Do not implement in the first production rebuild:

- Real-time voice streaming.
- Browser/mechanical interviewer TTS.
- Automatic pause detection / VAD.
- PDF resume parsing.
- `/resumes` or `/jd-history` standalone management pages.
- Advanced dashboard analytics.
- Batch Answer Polish.
- Large seeded Question Library content plan.
