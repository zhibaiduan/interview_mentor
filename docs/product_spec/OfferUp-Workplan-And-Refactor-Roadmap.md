# OfferUp — Workplan and Refactor Roadmap

**Status:** Working plan  
**Last updated:** 2026-06-09  
**Purpose:** Preserve the current decision state and define the order of work before UI and technical refactor begin.

---

## 1. Current Decision

We should **not start technical refactor immediately** and should **not redesign every page first**.

The next correct step is to **tighten and lock the product requirements**, especially the modules that define the core product value:

- Feedback
- Answer Polish
- Question Library
- Answer Bank
- Voice experience scope
- Locked future features

Reason: several important modules are not yet specified deeply enough. If we start implementation now, we risk building a clean technical architecture around unstable product decisions.

---

## 2. Product Naming Decision

Use **OfferUp** as the product-facing brand name.

All product-facing specs should use **OfferUp**.

Action later:

- Ensure UI copy, route labels, app metadata, and design docs use OfferUp consistently.

---

## 3. Immediate Work: Product Spec Lock

### Goal

Create a locked MVP scope before UI system and technical implementation.

### Deliverable

Create or update:

```text
docs/product_spec/OfferUp-MVP-Scope-Lock.md
```

### This document must define

- What is P0 for the June MVP.
- What is P1 after demo.
- What is shown as locked / coming soon.
- What is explicitly out of scope.
- Exact product behavior for each important module.
- Acceptance criteria that design and engineering can implement against.

---

## 4. Module Spec Inventory

Each core module should eventually have one independent spec file. Current status:

| Module | Spec file | Status |
|--------|-----------|--------|
| MVP master scope | `OfferUp-MVP-PRD.md` / `OfferUp-MVP-Scope-Lock.md` | Exists, needs final consistency pass |
| Setup | `OfferUp-Setup-Page-Spec.md` | Exists |
| Interview Session | `OfferUp-Interview-Session-Spec.md` | Exists |
| Feedback | `OfferUp-Feedback-Module-Spec.md` | Exists |
| Answer Polish | `OfferUp-Answer-Polish-Spec.md` | Exists |
| Answer Bank | `OfferUp-Answer-Bank-Spec.md` | Exists |
| Agent System | `OfferUp-Agent-Design.md` | Exists |
| Tech Architecture | `OfferUp-Tech-Architecture.md` | Exists |
| Landing Page | Current product landing design | Use current implemented design as reference |
| Auth | `OfferUp-Auth-Spec.md` | Exists |
| Home / Dashboard | `OfferUp-Dashboard-Spec.md` | Exists |
| Question Library | Covered in `OfferUp-MVP-Scope-Lock.md` | Functional plan exists; content plan placeholder |
| Voice Experience | Covered across session/tech docs | Needs standalone scope note if voice becomes P0 |

Immediate documentation priority:

1. Finish consistency pass across existing specs.
2. Use the current product Landing Page design as the Landing spec reference.
3. Keep Question Library content planning as a placeholder for later.

---

## 5. Module Decisions To Resolve First

### 5.1 Feedback Module

Feedback is the core value page and must be specified before UI or AI implementation.

Need to define:

- Global feedback sections.
- Per-question feedback sections.
- Difference between interviewer view and mentor view.
- Whether scoring exists, and how visually important it should be.
- Required fields for each question.
- Whether every question uses:
  - Answer Signal
  - Interviewer Heard
  - Next Version Should Include
- What the user's next action should be:
  - Save answer
  - Polish answer
  - Re-practice question
  - Go to Answer Bank
  - Start another session

Important product principle:

Feedback should not feel like only a test score. The core aha moment is:

> What I thought I said vs. what the interviewer actually heard.

### 5.2 Answer Polish

Answer Polish should be part of the MVP, but with realistic expectations.

MVP Polish should not promise a perfect final answer. It should produce a useful next version.

Need to define:

- Input:
  - Original question
  - User answer
  - Role / JD context
  - Feedback gaps
  - Language
- Output:
  - Improved answer
  - Why this version is better
  - Reusable phrases
  - What the user should still personalize
- UI placement:
  - Feedback page
  - Answer Bank detail view
- Data relationship:
  - `original_answer`
  - `polished_answer`
  - `bank_answer`

### 5.3 Question Library

The system question library should have an MVP structure even if content is small.

Need to define:

- Categories:
  - Resume Deep Dive
  - Behavioral
  - Motivation & Fit
  - Culture & Collaboration
  - Situational / Case
- Role mapping:
  - Product Manager
  - Software Engineer
  - Frontend Engineer
  - Backend Engineer
  - Data / Analytics
  - UX Designer
  - Other
- Difficulty:
  - Junior
  - Mid-level
  - Senior
- Language:
  - English available now
  - Deutsch coming soon
- Metadata:
  - intent
  - expected signals
  - common weak answers
  - strong answer ingredients
  - tags

### 5.4 Answer Bank

Do not mix system question library and user's personal answer bank.

Need to define:

- Answer Bank is personal.
- It stores user-owned answer assets.
- Initial MVP should support:
  - Save from feedback
  - View saved answers
  - Edit `bank_answer`
  - Preserve `original_answer`
  - Optionally store `polished_answer`

### 5.5 Voice Experience

Current decision:

- Text answer remains P0 as the reliability fallback.
- Push to Talk recording + Whisper transcription is P1.
- Interviewer voice must not use cheap or mechanical browser TTS.
- If interviewer voice is included, it should use a more realistic voice experience, such as high-quality voice model audio or pre-generated natural audio.
- If realistic interviewer voice is not ready, the MVP should show text-only interviewer questions instead of using low-quality synthetic speech.
- Real-time voice streaming and automatic pause detection are out of scope.

### 5.6 Locked Future Features

Locked features can be shown, but must not look available.

Apply this rule to:

- Full-round simulation
- Deutsch interview language
- Advanced Answer Polish capabilities beyond the MVP
- Any future case/situational modes if not implemented

Required locked state:

- Disabled visual treatment
- Coming soon label
- No active CTA that starts the feature
- Optional hover/click explanation
- No misleading product promise

---

## 6. UI System Work Comes After Scope Lock

After the product scope is locked, create a real design system spec.

### Deliverable

Create:

```text
DESIGN.md
```

or:

```text
docs/design/DESIGN.md
```

### Purpose

This should follow the `awesome-design-md` idea: a plain-text design system that AI agents and developers can read to generate consistent UI.

### Must include

- Brand: OfferUp.
- Product feel:
  - Calm
  - Precise
  - Candid
  - Supportive
  - Professional
- Color tokens.
- Typography tokens.
- Spacing scale.
- Radius scale.
- Shadow scale.
- Motion rules.
- Breakpoints.
- Component rules.
- Locked state rules.
- Feedback component rules.
- Form and validation rules.
- Accessibility rules.

### Important

Do not let each page invent temporary CSS. All future UI should use shared tokens and shared components.

---

## 7. Technical Refactor Comes After Product + Design Lock

The current implementation is a static HTML / Node demo. It should be preserved as a prototype reference, not extended as the production foundation.

Recommended future stack:

- Next.js App Router
- Tailwind CSS
- Supabase Auth
- Supabase Postgres
- DeepSeek API
- OpenAI Whisper only if voice transcription is in scope

### Proposed future structure

```text
app/
  page.tsx
  auth/
    login/page.tsx
    register/page.tsx
  setup/page.tsx
  session/
    [id]/
      call/page.tsx
      interview/page.tsx
      feedback/page.tsx
  home/page.tsx
  bank/page.tsx
  library/page.tsx
  api/

components/
  ui/
  layout/
  setup/
  interview/
  feedback/
  bank/
  library/

lib/
  supabase/
  ai/
  session/
  validation/
  constants/

styles/
  globals.css
  tokens.css

supabase/
  migrations/
  seed.sql

docs/
  product_spec/
  design/

demo-mvp/
  # keep as prototype reference
```

---

## 8. Recommended Execution Order

### Phase 1 — Product Scope Lock

Deliver:

- `OfferUp-MVP-Scope-Lock.md`
- Updated module priority table
- Clear P0/P1/P2 decisions
- Feedback spec
- Answer Polish MVP spec
- Question Library structure
- Answer Bank structure
- Voice scope decision
- Locked feature rules

Exit criteria:

- We can describe every MVP module's behavior without ambiguity.
- Feedback and Polish fields are clear enough to define database schema and prompts.
- Question Library and Answer Bank are clearly separated.

### Phase 2 — Design System Lock

Deliver:

- `DESIGN.md`
- Shared token definitions
- Component inventory
- Page layout rules
- Locked state pattern
- Feedback UI pattern

Exit criteria:

- Developers and AI agents can build new pages without inventing new visual rules.
- No page should need its own full custom color/radius/type system.

### Phase 3 — Technical Architecture Lock

Deliver:

- Final Next.js folder structure
- Supabase schema
- API route contracts
- Environment variable contract
- Fallback demo data structure
- Validation schema decisions

Exit criteria:

- Data model supports Feedback, Polish, Question Library, and Answer Bank.
- API flow supports session creation, question generation, answer submission, feedback generation, and saving answers.

### Phase 4 — Build MVP Skeleton

Deliver:

- Next.js project scaffold
- Tailwind configured with tokens
- Auth
- Supabase client/server utilities
- Basic layout shell
- Landing
- Setup
- Locked feature components

Exit criteria:

- A user can sign in and reach Setup.
- UI uses shared components and tokens.
- Full-round and Deutsch are shown as locked, not available.

### Phase 5 — Build Core Practice Flow

Deliver:

- Session create
- Call screen
- Interview screen
- 3-question focused drill
- Text answer submission
- Follow-up logic, initially with fallback/local data if needed

Exit criteria:

- User can complete one focused drill session end to end.
- Session data is saved.

### Phase 6 — Build Feedback + Polish + Bank

Deliver:

- Feedback page
- Per-question feedback
- Global feedback
- Answer Polish MVP
- Save to Answer Bank
- Answer Bank list/detail/edit

Exit criteria:

- User sees useful feedback.
- User can generate or view a polished answer.
- User can save and edit final answer.

### Phase 7 — AI Integration

Deliver:

- DeepSeek fit_map generation
- DeepSeek question generation
- Follow-up decision
- Interviewer Agent feedback
- Mentor Agent feedback
- Structured JSON validation
- Retry/fallback behavior

Exit criteria:

- The app can run with real AI.
- The app can still demo with fallback data if AI fails.

### Phase 8 — QA and Demo Prep

Deliver:

- Mobile QA
- Core flow QA
- Empty/loading/error state QA
- Demo script
- Golden demo case
- Seed content for Question Library

Exit criteria:

- Demo can run reliably.
- The product is coherent enough for seed-user recruitment.

---

## 9. Do Not Do Yet

Do not start these before Phase 1 is complete:

- Full production Next.js rebuild
- Full UI redesign
- Supabase schema finalization
- Prompt engineering finalization
- Complex voice-first experience
- Full-round simulation implementation
- Deutsch interview support

---

## 10. Next Concrete Task

Create the MVP scope lock document:

```text
docs/product_spec/OfferUp-MVP-Scope-Lock.md
```

Recommended first sections:

1. MVP purpose
2. Product principles
3. P0/P1/P2 module table
4. Feedback spec
5. Answer Polish spec
6. Question Library spec
7. Answer Bank spec
8. Voice scope
9. Locked feature rules
10. Development readiness checklist
