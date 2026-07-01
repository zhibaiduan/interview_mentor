# MVP Plan — Fastest Path to Aha

## Goal
In MVP, the only goal is to help users feel clear value in one session:
"This product helps me answer better in real interviews."

## Aha Moment Definition
Aha happens when user sees and feels improvement on one question:
1. finishes one 5-question round,
2. sees round summary + single-question polish,
3. re-attempts one answer,
4. saves polished answer to Question Bank.

## Product Scope (Minimum)
Only 6 pages/states:
1. Landing
2. Setup (Resume + JD only)
3. Question Plan (5 generated questions)
4. Round (answer 5 questions)
5. Results (summary + polish + retry)
6. Question Bank + History

## Setup Inputs
Required only:
- Resume text
- JD text

Auto-parsed:
- Company name
- Role title
- Suggested focus mode

## Core Flow
1. User clicks "Start Round" on landing.
2. User pastes Resume + JD.
3. System parses and shows quick confirmation.
4. System generates 5 questions from JD + resume highlights.
5. User answers each question (audio prototype uses text input simulation).
6. Results page shows:
   - Recruiter Lens
   - Coach Lens
   - Top 3 fixes
   - Before/After polish for one question
7. User clicks:
   - Re-practice this question
   - Save to Question Bank

## Why This Is Minimal
- No video
- No complex config
- No community
- No heavy analytics dashboard
- No complex question-bank editor

## Interaction Strategy
- Single primary action per screen
- One-layer panel layout (no nested card stacks)
- Calm paper-tone visual language
- Sage green only for accents and CTA

## Validation Metrics (MVP)
1. Time to first value (TTV)
2. Round completion rate
3. Re-practice click rate
4. Save-to-bank rate
5. Next-round intent

## Success Criteria
MVP is considered promising if users:
- complete round,
- re-practice at least one answer,
- save at least one polished answer,
- and self-report they would use the polished answer in real interview.
