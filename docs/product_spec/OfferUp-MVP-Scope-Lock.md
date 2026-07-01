# OfferUp — MVP Scope Lock

**Status:** Product scope locked; technical freeze in progress  
**Last updated:** 2026-06-19  
**Purpose:** Lock product behavior before UI system design and technical refactor.

---

## 1. Current Scope Lock Notes

This document captures product decisions that are stable enough to guide design, data modeling, and implementation.

The current priority is to clarify:

- Feedback
- Answer Polish
- Answer Bank
- Question Library
- Voice scope
- Locked future features

---

## 2. Answer Polish MVP

### 2.1 Product Decision

Answer Polish is part of the MVP.

It is **not generated automatically for every answer**. It is generated **only when the user clicks the Polish action**.

This keeps the feedback page lighter, avoids overwhelming the user, and makes Polish feel like an intentional next step rather than extra noise.

---

### 2.2 Trigger

User clicks:

```text
Polish this answer
```

or an equivalent action inside a question-level feedback block.

Behavior:

- Generate Polish for the selected answer only.
- Do not generate Polish for all answers at once.
- Each click can generate a new Polish result for that answer.
- MVP does not need a standalone Polish version-history UI.
- The latest generated Polish result can replace the previous one in the active feedback UI.
- If the user saves a Polish result to Answer Bank for an answer that already has a saved record, save it as a new Answer Bank version instead of overwriting the old one.

---

### 2.3 Output

The primary output is **one complete improved answer**.

The output should not be a long report by default. It should first give the user the polished answer they can actually use.

Required output:

```json
{
  "polished_answer": "A complete improved answer based on the user's original answer, the question, and the role/JD context.",
  "why_changed": [
    "A short reason explaining why this version is stronger.",
    "Another short reason if needed."
  ]
}
```

MVP may optionally include:

```json
{
  "reuse_phrases": [
    "Reusable phrase 1",
    "Reusable phrase 2"
  ]
}
```

But the MVP should not make reusable phrases the main output.

---

### 2.4 Progressive Disclosure

Answer Polish must use progressive disclosure.

Do **not** show everything at once.

Recommended UI flow:

1. User clicks `Polish this answer`.
2. UI shows a short loading state.
3. UI first reveals the complete polished answer.
4. Under the answer, show a collapsed or secondary section:

```text
Why this version works better
```

5. User can expand it to see the explanation.

Reason:

The user first needs a usable answer. Explanation is helpful, but should not visually compete with the improved answer.

---

### 2.5 Explanation Style

The explanation should be short and specific.

Good explanation:

```text
This version names your personal ownership earlier, adds a concrete decision, and makes the outcome measurable.
```

Bad explanation:

```text
This answer is more professional, clearer, and better structured.
```

Explanation should focus on:

- What signal was added.
- What ambiguity was removed.
- What made the answer more interview-ready.
- How it maps better to the role/JD.

---

### 2.6 Editing

MVP does **not** need an inline editing workflow for the polished answer.

Do not build a separate `bank_answer` editing experience inside Polish for MVP.

The user can save the generated polished answer directly to Answer Bank.

---

### 2.7 Save Behavior

User can click:

```text
Save to Answer Bank
```

This saves the polished answer and its source context to the user's personal saved library.

Important naming note:

- User-facing name is **Answer Bank**.
- Internally, keep the data model clear: this is a user-saved answer asset, not the same thing as Question Library.

Minimum saved fields:

```json
{
  "answer_group_id": "Shared UUID for all saved versions of the same source answer",
  "version_number": 1,
  "question_text": "Original interview question",
  "original_answer": "User's original answer",
  "polished_answer": "Generated polished answer",
  "bank_answer": "Editable saved answer initialized from original_answer or polished_answer",
  "source": "feedback_polish",
  "category": "resume_deep_dive | behavioral | motivation_fit | other",
  "role": "Target role",
  "language": "en",
  "saved_at": "ISO timestamp"
}
```

MVP P0 save behavior:

- Saving the original feedback answer creates the first Bank record for that source answer.
- Re-saving the same original feedback answer should not create a duplicate record; show a saved state.
- Saving a polished result for an already saved source answer creates a new Bank version with the same `answer_group_id` and an incremented `version_number`.
- Do not silently overwrite a previous saved version.

MVP P1 Bank page behavior:

- Editing `bank_answer`, browsing versions, deleting records, and resetting to original belong to the Answer Bank page experience.

---

### 2.8 Product Promise

Do not describe Polish as a perfect final answer.

Use language like:

- `A stronger version`
- `A clearer version`
- `A more interview-ready draft`
- `Polish into a better answer`

Avoid language like:

- `Perfect answer`
- `Final answer`
- `Guaranteed best answer`

Product principle:

Polish should help the user move from a weak or vague answer to a better usable draft, while still allowing future improvement.

---

### 2.9 Acceptance Criteria

- User can generate Polish by clicking a button.
- Polish is generated for one selected answer only.
- The first visible output is a complete improved answer.
- Explanation is shown after the polished answer, not before it.
- Explanation is progressively disclosed or visually secondary.
- User can save the polished answer to Answer Bank.
- MVP does not require editing the polished answer.
- Saving a polished answer for an already saved source answer creates a new Answer Bank version.
- UI copy does not promise a perfect answer.

---

## 3. Question Library and Answer Bank

### 3.1 Product Decision

OfferUp has two different concepts:

1. **Question Library**
   - A system-managed library of common interview questions.
   - Organized by focused practice module, role, level, and language.
   - Users can browse it.
   - The interview engine can draw from it or adapt questions from it.

2. **Answer Bank**
   - The user's personal saved library.
   - Contains questions and answers saved from the user's own practice sessions.
   - Can include original answers and polished answers.

These two should stay separate in product logic and data modeling.

---

### 3.2 Question Library Purpose

The Question Library is a curated resource of common questions for each focused practice module.

It supports two use cases:

1. **User browsing**
   - Users can browse questions by category, role, level, and language.
   - MVP browsing is read-only.
   - MVP does not need "practice this exact question" from the library page.

2. **Interview generation**
   - During a mock interview, the AI can select from this library.
   - The AI can also adapt a library question into a more realistic, role-specific, resume-aware version.
   - The library is a reference pool, not only a fixed question bank.

Example:

```text
Library question:
Tell me about a project where you had to work with unclear requirements.

Adapted interview question:
In your WPS Smart Spreadsheet project, how did you handle unclear requirements from product and engineering stakeholders?
```

---

### 3.3 Question Library MVP Page

MVP should include a basic Question Library page.

The page should allow users to browse questions only.

Frontend should show:

- Category / focused practice module
- Role
- Level
- Language
- Question text

Frontend does not need to show the deeper AI/evaluation metadata.

Do not show by default:

- intent
- expected signals
- common weak answer patterns
- strong answer ingredients
- evaluation tags

Those fields are mainly for AI generation, AI evaluation, and internal quality control.

---

### 3.4 Question Library Categories

The first library structure should follow the focused practice modules.

Categories:

- `resume_deep_dive`
  - Resume Deep Dive
  - Questions about projects, ownership, impact, decisions, and specific experience.
- `behavioral`
  - Behavioral / STAR
  - Questions about past behavior, conflict, collaboration, failure, leadership, and pressure.
- `motivation_fit`
  - Motivation & Fit
  - Questions about why this role, why this company, career direction, and working abroad.
- `culture_collaboration`
  - Culture & Collaboration
  - Can exist in the library structure, but may be locked or lower priority in MVP.
- `situational`
  - Situational / Case
  - Can exist in the library structure, but may be locked or lower priority in MVP.

MVP content priority:

1. Resume Deep Dive
2. Behavioral
3. Motivation & Fit

---

### 3.5 Question Library Fields

Each public library question should support these fields.

```json
{
  "id": "uuid",
  "category": "resume_deep_dive | behavioral | motivation_fit | culture_collaboration | situational",
  "role": "product_manager | software_engineer | frontend_engineer | backend_engineer | data_analytics | ux_designer | general",
  "level": "junior | mid | senior",
  "language": "en | de",
  "question_text": "The question shown to users and used as a source for interview generation.",
  "intent": "What this question is trying to evaluate.",
  "expected_signals": [
    "Signals a strong answer should show."
  ],
  "common_weak_answer_patterns": [
    "Typical weak patterns, such as vague ownership or no metric."
  ],
  "strong_answer_ingredients": [
    "Specific ingredients that would make the answer stronger."
  ],
  "tags": [
    "ownership",
    "impact",
    "decision",
    "stakeholder",
    "language_clarity"
  ],
  "is_active": true,
  "created_at": "ISO timestamp",
  "updated_at": "ISO timestamp"
}
```

Field meaning:

- `category`
  - Which focused practice module this question belongs to.
- `role`
  - Which target role this question is most relevant for.
- `level`
  - Candidate seniority level.
- `language`
  - Question language. MVP frontend should show English available; Deutsch can exist in structure but is coming soon.
- `question_text`
  - The actual question users browse.
- `intent`
  - Internal explanation of what the question tests.
- `expected_signals`
  - What a good answer should communicate.
- `common_weak_answer_patterns`
  - Common failure modes to help feedback and evaluation.
- `strong_answer_ingredients`
  - Concrete elements that make an answer strong.
- `tags`
  - Flexible labels used for filtering, generation, and evaluation.

---

### 3.6 Content Creation

MVP question library content should be human-curated first.

AI can help draft question candidates, but questions should be reviewed manually before being added as active library content.

Content planning is intentionally left as a placeholder for now. A later content plan should define first-batch categories, roles, levels, number of questions, and review rules.

Reason:

The library becomes part of the quality baseline for the product. If the library is generic or low quality, generated interviews and feedback will also feel generic.

---

### 3.7 Relationship To Interview Generation

During interview generation, the system should not simply ask the public library question word-for-word every time.

Recommended behavior:

- Pull several relevant questions based on:
  - selected category
  - role
  - level
  - language
  - resume/JD context
- Use them as reference examples.
- Either select one directly if it already fits, or adapt it to the user's resume/JD.

The goal is:

```text
Common interview pattern + user's real context = realistic personalized question
```

Acceptance criteria:

- Generated interview questions should feel based on the user's resume/JD.
- Generated questions can still trace back to a library category and intent.
- The library should improve consistency without making interviews feel templated.

---

### 3.8 Answer Bank

Answer Bank is separate from Question Library.

It contains saved personal assets from the user's practice.

MVP sources:

- Save polished answer from Answer Polish.
- Save a question + answer from Feedback.

MVP saved item should include:

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "question_text": "Question the user practiced or saved.",
  "category": "resume_deep_dive | behavioral | motivation_fit | other",
  "role": "Target role",
  "level": "junior | mid | senior",
  "language": "en",
  "original_answer": "User's original answer, if available.",
  "polished_answer": "Generated polished answer, if available.",
  "bank_answer": "The version shown as the user's saved answer in Answer Bank.",
  "source": "feedback | feedback_polish | manual_save",
  "saved_at": "ISO timestamp"
}
```

Frontend should allow the user to view saved questions and saved answers.

MVP does not need:

- Inline editing inside the Answer Polish flow
- Practicing directly from saved bank
- Multiple Polish versions
- Advanced search

These can be later improvements.

---

## 4. Voice Scope

### 4.1 Product Decision

OfferUp should feel voice-first over time, but MVP must not sacrifice reliability or realism.

Current scope:

- Text answer input is P0 and must be stable.
- Push to Talk recording + Whisper transcription is P1.
- Real-time voice streaming is out of scope.
- Automatic pause detection / VAD is out of scope.

### 4.2 Candidate Voice Input

P1 candidate voice flow:

1. User presses and holds to record.
2. User releases to stop recording.
3. Audio is sent to Whisper.
4. Transcription is briefly shown as a visual receipt.
5. The answer is submitted automatically.

If transcription fails, the product falls back to text input.

### 4.3 Interviewer Voice

Interviewer voice must not use cheap or mechanical browser TTS.

If interviewer voice is included, it should use a more realistic voice experience:

- high-quality voice model audio, or
- pre-generated natural interviewer audio.

If realistic interviewer voice is not ready, the MVP should show text-only interviewer questions instead of using low-quality synthetic speech.

Product principle:

```text
Bad interviewer voice is worse than no interviewer voice.
```
