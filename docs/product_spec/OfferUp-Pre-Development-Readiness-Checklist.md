# OfferUp — Pre-Development Readiness Checklist

**Status:** Technical and database freeze in progress  
**Last updated:** 2026-06-19  
**Purpose:** PRD consistency pass before design-system work, technical structure freeze, database schema freeze, and the formal Next.js rebuild.

---

## 1. Summary

The current product specs and design system are coherent enough to proceed into the technical structure and database freeze. Product priority decisions are now resolved; the remaining open items are implementation architecture, database/RLS detail, demo fallback content, and four final design-system choices.

The most important product direction is consistent across the handoff and module specs:

- Product-facing brand is `OfferUp`.
- `Question Library` means the public/system question library.
- `Answer Bank` means the user's saved personal answer assets.
- `bank_answer` is the editable saved answer field.
- Answer Polish is an MVP feature and is generated only after a user action.
- Text answer input is P0.
- Push to Talk + Whisper transcription is P1.
- Real-time voice streaming and automatic pause detection are out of scope.
- Low-quality interviewer TTS should not be used.

The remaining readiness work is now mostly about freezing technical structure and demo reliability.

---

## 2. Must Resolve Before Development

### 2.1 Google OAuth Priority

**Resolved issue:** Google OAuth previously had inconsistent priority across the PRD and the Auth spec.

- `OfferUp-MVP-PRD.md` now lists Google OAuth as P0 in both the auth section and the priority table.
- `OfferUp-Auth-Spec.md` already includes Google OAuth in P0 acceptance criteria.
- The Google OAuth open question has been removed from the PRD.

**User decision:** Google OAuth is P0.

**Implementation meaning:** Email + Password and Google OAuth both belong in the P0 auth acceptance criteria.

**Action status:**

- Done in `OfferUp-MVP-PRD.md`.
- `OfferUp-Auth-Spec.md` was already aligned.

### 2.2 Answer Bank Scope Wording

**Issue:** Answer Bank is described in two overlapping ways:

- As a P1 module/page experience.
- As a P0 save action from Feedback and Answer Polish.

This is not a product conflict, but it can confuse implementation scope.

**User decision:** OK.

**Locked decision:** Define the split explicitly:

- P0: Save to Answer Bank from Feedback and Polish, write database record, show success toast, prevent duplicate save for the same question.
- P1: Answer Bank list, search, filters, detail page, editing `bank_answer`, delete, reset actions.

**Action status:**

- Done in `OfferUp-MVP-PRD.md`.
- Done in `OfferUp-Answer-Bank-Spec.md`.
- Continue avoiding wording like "Answer Bank is P1" without clarifying that P0 save actions still exist.

### 2.3 Existing Bank Record Behavior When Saving Polish

**Issue:** Polish save behavior differs across specs.

- `OfferUp-Answer-Polish-Spec.md` says that if a Bank record already exists, MVP can update `polished_answer` and directly sync `bank_answer` to the latest polished answer.
- `OfferUp-Answer-Bank-Spec.md` says that if a Bank record already exists, update `polished_answer` and ask whether to sync `bank_answer`.

**User decision:** Save as a new version.

**Implementation meaning:** Do not silently overwrite the existing saved version when a user saves a Polish result for an answer that already exists in Answer Bank. Preserve the earlier saved answer and save the new polished result as a separate version.

**Action status:**

- Done in `OfferUp-Answer-Polish-Spec.md`.
- Done in `OfferUp-Answer-Bank-Spec.md`.
- Done in `OfferUp-Tech-Architecture.md`.
- Use multiple `answer_bank` rows grouped by shared `answer_group_id`, with `version_number` incrementing inside the group.

### 2.4 Dashboard / Home Priority

**Issue:** The PRD labels the personal homepage/dashboard module as P1 in the module map and priority table, but the detailed homepage section lists several P0 features.

**User decision:** The logged-in Home/Dashboard should be complete in P0.

**Implementation meaning:** The P0 logged-in experience is not only a minimal landing shell. It should include the full returning-user dashboard experience: start practice CTA, history, saved resumes, JD history, Answer Bank entry, Question Library entry, asset/status summaries, and account dropdown/sign out.

**Action status:**

- Done in `OfferUp-MVP-PRD.md`.
- Done in `OfferUp-Dashboard-Spec.md`.
- Dashboard supports saved resume reuse entry points for Setup.

**Plain-language explanation:** This point is now locked as the full version: after login, users should see a real Home/Dashboard, not just a transitional page.

### 2.5 Saved Resume Reuse Priority

**Issue:** The PRD says Setup can use saved resumes if they exist; the Setup spec marks saved resume reuse as P1.

**User decision:** Saved resume reuse must be supported.

**Implementation meaning:** Setup P0 should support selecting an existing saved resume when one exists, while still allowing manual paste.

**Action status:**

- Done in `OfferUp-MVP-PRD.md`.
- Done in `OfferUp-Setup-Page-Spec.md`.
- Done in `OfferUp-Dashboard-Spec.md`.
- Done in `OfferUp-Tech-Architecture.md`.
- Remaining route-level detail: decide whether resume/JD management uses standalone pages or setup-integrated drawers during technical structure freeze.

---

## 3. Consistent And Ready

### 3.1 Naming

Current docs consistently use:

- `OfferUp`
- `Answer Bank`
- `Question Library`
- `bank_answer`

**Status:** Ready.

**Small cleanup:** Avoid the landing-page phrase "not a question bank" unless it clearly means generic question bank. Since `Question Library` is a real feature, the safer copy is:

```text
Questions from your resume and target role, not generic prompts.
```

### 3.2 Answer Polish

Specs agree on the core behavior:

- P0 feature.
- User-triggered only.
- Generated for one selected answer.
- First output is a complete improved answer.
- Explanation is secondary or progressively disclosed.
- No inline editing inside Polish for MVP.
- No inline Polish editor or standalone Polish version-history UI for MVP.
- Can save polished result to Answer Bank.
- If the answer already exists in Answer Bank, saving a Polish result creates a new Bank version rather than overwriting the previous saved answer.
- Must avoid "perfect answer" language.

**Status:** Ready.

### 3.3 Question Library

Specs agree on the core behavior:

- Public/system-managed library.
- Separate from Answer Bank.
- Browse-only in MVP/P1 scope.
- Used by AI as a reference pool, not as fixed templated questions.
- Content planning can remain a placeholder.
- English first; Deutsch locked/coming soon.

**Status:** Ready for structure, not ready for seed content.

**Action later:** Create a separate content plan only when seed content becomes necessary.

### 3.4 Voice Scope

Specs agree:

- Text answer input is P0.
- Push to Talk + Whisper transcription is P1.
- Real-time voice streaming is out of scope.
- Automatic pause detection / VAD is out of scope.
- Browser/default mechanical TTS should not be used.
- If natural interviewer voice is not ready, use text-only interviewer questions.

**Status:** Ready.

### 3.5 Locked Features

Specs consistently treat these as locked or future:

- Mode 2 full-process simulation.
- Deutsch interview language.
- Culture & Collaboration and Situational / Case as lower-priority/locked focused modules.
- Advanced Answer Polish features.
- PDF resume parsing.
- Real-time voice streaming.
- Video/expression/body-language analysis.

**Status:** Ready.

---

## 4. Priority Freeze Recommendation

Use this as the source of truth for the next implementation plan.

| Area | P0 | P1 | Out of scope / V2 |
|---|---|---|---|
| Landing | Page, CTA, logged-in/logged-out routing | FAQ, social proof | Complex marketing site |
| Auth | Email/password, Google OAuth, redirect, session persistence, sign out | Password UX polish | Password reset, GitHub/LinkedIn OAuth, account deletion |
| Dashboard/Home | Full logged-in dashboard, start practice CTA, history, saved resumes, JD history, Answer Bank entry, Question Library entry, summaries, sign out | Advanced filters and analytics polish if needed | Advanced analytics |
| Setup | Manual resume paste, saved resume reuse, JD/manual role input, Mode 1 setup, locked Mode 2 | PDF upload | Full template system |
| Interview | Call transition, text answer flow, 3-5 questions, follow-ups, end session | Push to Talk + Whisper, timer, skip question | Voice streaming, VAD, video analysis |
| Feedback | Global feedback, per-question Signal/Heard/Next Version, save original answer | Tags, richer visual scoring | Heavy analytics dashboards |
| Answer Polish | Generate one selected answer, show polished answer first, save to Bank as a new version when needed | Re-generate UX | Batch Polish |
| Answer Bank | Save records from Feedback/Polish | List, search, detail, edit `bank_answer`, delete/reset | PDF export |
| Question Library | Data structure and locked/reference role in AI generation | Browse page and seed content | Large curated catalog |

---

## 5. Development Readiness Checklist

### PRD Consistency

- [x] Decide Google OAuth priority: P0.
- [x] Clarify Answer Bank P0 save action vs P1 page experience.
- [x] Decide existing-record Polish save behavior: save as a new version.
- [x] Clarify Home/Dashboard priority: full logged-in dashboard is P0.
- [x] Clarify saved resume reuse: P0 support required.
- [x] Replace or clarify "question bank" marketing copy.

### Design System Readiness

- [x] Create `OfferUp-Design-System.md`.
- [x] Define shared tokens and component rules before UI implementation.
- [x] Define locked-state pattern for Mode 2, Deutsch, lower-priority modules, and future features.
- [x] Define Feedback and Polish disclosure components.
- [x] Confirm final design-system choices: Google-hosted fonts, amber-soft `developing`, tablet labels until 768px, CSS-only paper texture.

### Technical Readiness

- [x] Freeze Next.js folder structure.
- [x] Decide route handlers vs server actions.
- [x] Decide Supabase client/server wrapper pattern.
- [x] Decide AI prompt file locations.
- [x] Decide fallback demo data location and format.
- [x] Freeze environment variable contract.

### Database Readiness

- [x] Freeze `profiles`.
- [x] Freeze `resumes`.
- [x] Freeze `jd_history`.
- [x] Freeze `interview_sessions`.
- [x] Freeze `question_chains`, especially `exchanges`.
- [x] Freeze `session_feedback`, especially `feedback_status`.
- [x] Freeze `answer_bank`, especially `original_answer`, `polished_answer`, and `bank_answer`.
- [x] Freeze `question_library`.
- [x] Confirm RLS policies and indexes.

### Demo Readiness

- [x] Create `OfferUp-Demo-Scenario.md`.
- [x] Prepare fixed demo resume.
- [x] Prepare fixed demo JD.
- [x] Prepare fixed questions and exchanges.
- [x] Prepare fixed feedback.
- [x] Prepare fixed Polish output.
- [x] Prepare fixed Answer Bank example.

---

## 6. Recommended Next Action

Next work should proceed in this order:

1. Resolve the four remaining design-system choices.
2. Freeze technical structure and database/RLS details.
3. Use `OfferUp-Implementation-Plan.md` as the production rebuild order.
4. Use `OfferUp-Demo-Scenario.md` as the fallback data blueprint.
5. Start the formal Next.js rebuild with the token/component slice described in `OfferUp-Design-System.md`.
