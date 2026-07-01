# OfferUp — Legacy Demo Reuse Audit

**Status:** Working migration guide  
**Last updated:** 2026-06-19  
**Purpose:** Decide which parts of the historical `demo-mvp/` prototype should be reused in the production Next.js rebuild.

The old static demo is not the production architecture, but it contains useful product decisions, copy, UI rhythm, interaction ideas, and demo data. Production work should migrate the useful parts into shared components and route handlers instead of rebuilding the experience from a blank page.

---

## 1. Migration Principle

Reuse at four levels:

1. **Product content:** page copy, labels, flow names, feedback phrases.
2. **Interaction behavior:** setup steps, incoming call transition, push-to-talk, feedback reveal, save-to-bank.
3. **Information structure:** dashboard sections, setup sequence, interview transcript layout, feedback blocks.
4. **Visual mood:** warm editorial tone, paper canvas, compact rows, report-like feedback.

Do not reuse:

- Inline CSS as production styling.
- LocalStorage/sessionStorage as production state.
- Static HTML structure copied wholesale into route files.
- Old score-first or dashboard-heavy patterns that conflict with the current design system.
- Browser/mechanical TTS fallback as a product experience.

Production implementation should translate reusable legacy pieces into:

```text
styles/tokens.css
components/ui/*
components/layout/*
components/product/*
app/* route composition
lib/ai/workflows/*
supabase/migrations/*
```

---

## 2. Page-Level Reuse Map

| Legacy file | Production target | Reuse level | Decision |
|-------------|-------------------|-------------|----------|
| `demo-mvp/public/index.html` / `landing.html` | `/`, `/home`, Setup entry patterns | High | Reuse dashboard content structure, setup modal flow ideas, answer bank preview language, brand mood. Do not copy inline CSS. |
| `demo-mvp/public/setup.html` | `/setup` | High | Reuse setup sequence, section copy, role chips, JD optional behavior, prep animation copy. Adapt to page-based setup, not modal-only. |
| `demo-mvp/public/interview.html` | `/session/[id]/call`, `/session/[id]/interview`, later STT slice | High | Reuse incoming call concept, live transcript layout, push-to-talk flow, STT/TTS API shape ideas, call timer, session completion payload. Adapt to 3-question MVP and Supabase state. |
| `demo-mvp/public/feedback.html` | `/session/[id]/feedback`, Answer Polish, Save to Bank | High | Reuse feedback narrative, envelope/reveal idea if still tasteful, question review cards, transcript/recruiter/coach/polish structure, save-to-bank interaction. Adapt to progressive `summary_ready` state. |
| `demo-mvp/server.js` | Route handler behavior reference | Medium | Reuse local fallback logic shape and `/api/stt`/`/api/tts` learnings. Do not reuse as production server. |

---

## 3. Directly Reusable Product Decisions

### Dashboard / Home

From `index.html`:

- Profile/resume saved state.
- Recent sessions / activity rhythm.
- Answer Bank preview and empty state.
- Setup entry as the primary action.
- Qualitative progress over analytics-heavy dashboard.

Production action:

- Current `/home` placeholder should be replaced with migrated Dashboard modules:
  - `ModeEntry`
  - `PracticeActivityList`
  - `AssetShortcut`
  - `CreditBalance`
  - Answer Bank preview
  - Resume/JD status rows

### Setup

From `setup.html` and `index.html` setup modal:

- Page title idea: "Set up your session".
- Resume first, role/JD second, interview focus third.
- Role chips:
  - Product Manager
  - Software Engineer
  - Frontend Engineer
  - Backend Engineer
  - Full Stack Engineer
  - Data Scientist
  - UX Designer
  - Solution Consultant
- Optional custom JD behavior.
- Focus types:
  - Behavioral
  - Resume Deep Dive
  - Case Study / situational equivalent
- Prep animation copy:
  - Reading your resume
  - Finding role signals
  - Building interview focus
  - Preparing the call

Production action:

- Keep `/setup` as a full page, not a dashboard modal.
- Reuse step logic and copy, but store state in React/server workflow rather than DOM globals.
- Replace old 5-question promise with current 3-question MVP language.
- Add credit availability state before start.

### Interview

From `interview.html`:

- Incoming call overlay is valuable.
- Live call state labels are useful:
  - Interviewer speaking
  - Your turn
  - Interviewer is analyzing your answer
- Push-to-talk flow is a strong interaction model.
- Live transcript preview should remain.
- STT failure should return user to retry/edit, not kill the round.
- Completion should save a session summary payload.

Production action:

- Split into `/session/[id]/call` and `/session/[id]/interview`.
- Use text-first MVP loop first, then migrate push-to-talk in Slice 9.
- Keep text visible before any interviewer audio.
- Do not keep browser SpeechSynthesis fallback as a user-facing interviewer voice.
- Replace static seed questions with AI/fallback `question_chains`.

### Feedback

From `feedback.html`:

- Feedback should feel like a report/reveal, not an analytics dashboard.
- The question review structure is valuable:
  - transcript
  - recruiter/interviewer heard
  - mentor/coach tip
  - polish / next version
- The hardcoded example polished answers are useful demo fallback examples.
- Save to bank action belongs near question-level feedback.

Production action:

- Migrate into progressive feedback:
  - `session_feedback` for global summary
  - `question_chains` for per-question details
- Keep the product structure:
  - Answer signal
  - Interviewer heard
  - Next version
- Rename any old "Question Bank" copy to "Answer Bank".
- Use `weak_signal_tags` and `skill_tags` in the saved answer flow.

---

## 4. Things To Rewrite, Not Copy

### Styling

Do not copy legacy page CSS. It has useful visual memory, but production styling must come from:

- `styles/tokens.css`
- `styles/globals.css`
- Tailwind variable mappings
- shared UI primitives

Legacy tokens that survived into the current design system:

- paper canvas
- limewash black ink
- sage success/save
- blue-gray role/interviewer
- amber mentor/focused drill
- clay red risk/error
- serif display + precise sans UI

### State

Replace:

```text
localStorage im_profile
localStorage im_sessions
localStorage im_bank
sessionStorage im_setup
DOM globals
```

With:

```text
Supabase Auth
profiles
resumes
jd_history
interview_sessions
question_chains
session_feedback
answer_bank
credit_accounts
user_skill_signals
```

### API

Legacy:

```text
/api/chat
/api/stt
/api/tts
```

Production:

```text
POST /api/session/create
POST /api/session/questions
POST /api/session/answer
POST /api/session/end
POST /api/session/feedback
POST /api/polish
POST /api/bank/save
POST /api/stt
```

The old `/api/stt` implementation is useful as a reference for multipart transcription, but should be rewritten as a Next Route Handler.

---

## 5. Current New Skeleton Correction

The current production skeleton is useful as infrastructure:

- Next.js App Router
- Tailwind + tokens
- shared UI primitives
- layout shells
- Supabase wrappers
- initial schema migration

But the current `/home` and `/setup` content should be treated as temporary scaffolding. It should be replaced by migrated legacy product structure instead of continuing from blank placeholder copy.

Immediate correction:

1. Keep the skeleton and shared primitives.
2. Replace `/home` with migrated dashboard structure from `index.html`.
3. Replace `/setup` with migrated setup sequence from `setup.html` / setup modal.
4. Then migrate call/interview and feedback flows from the legacy demo into the new architecture.

---

## 6. Reuse Priority

### P0 Reuse Before More New Feature Work

1. Dashboard/home structure from `index.html`.
2. Setup sequence from `setup.html` and setup modal.
3. Incoming call and live interview state model from `interview.html`.
4. Feedback report/question review structure from `feedback.html`.

### P1 Reuse

1. Push-to-talk recording behavior.
2. STT retry/edit transcript behavior.
3. Feedback reveal/envelope moment if it still fits the new design system.
4. Answer Bank preview and empty state.

### Do Not Reuse

1. Inline CSS as implementation.
2. Browser SpeechSynthesis interviewer voice fallback.
3. Old 5-question promise where current MVP says 3 questions.
4. LocalStorage as durable app data.
5. "Question Bank" naming.

