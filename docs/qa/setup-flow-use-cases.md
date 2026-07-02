# Setup Flow Use Cases And Spec Verification

Source of truth: `docs/product_spec/OfferUp-Setup-Page-Spec.md`

Implementation under review: `components/product/setup/setup-flow.tsx`

Scope mapping: Slice 3 - Dashboard And Setup.

This document turns the setup-page spec into executable use cases. It is intentionally a QA checklist, not a product-spec replacement.

## Verification Summary

Current conformance: partial.

The reference-inspired setup flow is directionally aligned with the desired visual hierarchy and reduced-friction setup experience, but several P0 product behaviors from the spec are not implemented yet.

High-risk gaps:

- Resume validation does not enforce the spec's minimum 100-character rule.
- The current UI does not expose the required interview language selector with English selected and Deutsch locked.
- Mode 2 and locked focus types are visually locked, but they do not show the required "coming soon" tooltip/inline message on click.
- The sticky preview bar is missing several required summary fields, including target role, interviewer, interview language, follow-up max, and main question count.
- Clicking Start interview does not assemble and send the `session_config` payload to the backend yet.
- The current step architecture is `Resume -> Target role -> Session settings`, while the spec describes `Resume -> Mode selection -> Mode-specific settings`. This may be acceptable as a deliberate IA adaptation, but it should be treated as a product decision, not silent spec compliance.

## Test Data

Use this resume as a valid resume:

```text
Product Manager with experience in AI workflow products and interview preparation tools.

WORK EXPERIENCE
- Led discovery interviews with students and early-career candidates to identify interview preparation gaps.
- Designed an AI interview practice workflow that turns resumes and target roles into structured mock interview questions.
- Collaborated with engineering and design to prioritize onboarding clarity and measurable completion.

PROJECTS
- OfferUp interview practice product: built a focused setup flow and improved user trust by showing extracted resume signals before the session starts.

SKILLS
Product discovery, stakeholder communication, AI product strategy, React, TypeScript, data-informed prioritization.

RESULTS
Reduced setup confusion and created a repeatable 3-question focused practice flow.
```

Use this short invalid resume:

```text
Product manager. React. AI.
```

Use this valid JD:

```text
We are looking for a Product Manager working student to support discovery, analytics, stakeholder alignment, roadmap decisions, and clear communication with engineering and design teams. The candidate should be able to synthesize user feedback, prioritize product opportunities, define success metrics, and communicate trade-offs clearly.
```

Use this invalid JD:

```text
Product Manager internship.
```

Use this local PDF as the real resume parsing/privacy test fixture:

```text
/Users/miumiu/Documents/项目/job_applications/resume/output/resume_en.pdf
```

Observed extraction audit on 2026-07-01:

- PDF text extraction is possible with `pdfplumber`: 2 pages, 82 non-empty lines, about 4,201 characters.
- The PDF contains a contact line with email, phone, LinkedIn, and portfolio/domain-like personal URL data.
- The current privacy-line filter removes that contact line after PDF text extraction.
- The current privacy-line filter would still leave at least one location-style field in the AI preview: city/country attached to education.
- The privacy-line filter previously had a false positive that removed a project line containing "Telegram"; this is covered by `npm run test:setup`.
- The current product UI parses PDF content through `POST /api/setup/parse-resume`, removes privacy lines, then keeps the remaining extracted text as the AI resume material. Structured experience parsing is only used as preview metadata.
- DOC/DOCX files are still rejected until a separate parser is added.

## P0 Use Cases

### SETUP-P0-01 - Default Page State

Goal: verify low-friction defaults.

Steps:

1. Open `/setup`.
2. Observe the setup flow before changing any field.

Expected:

- Page is an independent setup page, not a dashboard modal.
- Mode 1 / Focused Practice is selected by default.
- Experience level defaults to Junior.
- Question focus defaults to Resume Deep Dive.
- Follow-up intensity defaults to medium.
- Interview language defaults to English.
- Start interview is disabled until required fields are complete.

Current result:

- Partial. Focused Practice, Junior, Resume Deep Dive, and medium follow-up are defaulted.
- Gap: interview language is not rendered.
- Gap: current step order differs from the spec's Step 2 mode-selection model.

### SETUP-P0-02 - Resume Under 100 Characters Blocks Start

Goal: enforce the minimum resume quality bar.

Steps:

1. Provide a resume with fewer than 100 characters.
2. Try to confirm resume or start the interview.

Expected:

- The user sees: "Resume content is too short; add project experience" or equivalent.
- Start interview remains disabled.

Current result:

- Gap. The current reference-style flow selects from saved/uploaded resume assets and does not enforce a 100-character validation rule before confirmation.

### SETUP-P0-03 - Valid Resume Can Be Confirmed

Goal: verify Step 1 completion.

Steps:

1. Select or upload a valid resume.
2. Wait for extraction to finish if parsing UI appears.
3. Click Confirm resume.

Expected:

- Resume is marked complete.
- Extracted resume signals are visible before confirmation.
- The flow advances to the target role step.
- Private-looking fields are not shown in the AI preview.

Current result:

- Mostly aligned for the local mocked saved/uploaded resume flow.
- Production caveat: parsing is local/mock UI, not backed by a real resume parser or saved-resume API.

### SETUP-P0-03A - Real PDF Resume Is Parsed Before Privacy Filtering

Goal: verify that a production resume upload uses the user's actual resume text rather than placeholder text.

Steps:

1. Upload `/Users/miumiu/Documents/项目/job_applications/resume/output/resume_en.pdf`.
2. Wait for parsing to finish.
3. Inspect the extracted resume signals.

Expected:

- The extracted signals come from the PDF's actual education, work experience, projects, skills, and achievements.
- Placeholder text such as "Uploaded resume file" does not appear in the extracted material.
- The parser supports PDF text extraction or rejects unsupported PDFs clearly.

Current result:

- Aligned for text-based PDFs. The UI accepts PDF files, sends them to the setup parsing API, and stores parser-returned resume material rather than placeholder text.
- Remaining risk: scanned/image-only PDFs need OCR, which is not implemented.

### SETUP-P0-03B - Real PDF Privacy Fields Are Removed

Goal: verify that personally sensitive fields are removed from the material shown to AI.

Steps:

1. Extract text from the real PDF fixture.
2. Run the same privacy filter used by setup preview.
3. Inspect whether email, phone, LinkedIn, portfolio/personal URL, home address/location-like fields, and visa/work-permit details remain in AI-visible text.

Expected:

- Email is removed.
- Phone number is removed.
- LinkedIn and portfolio/personal URL are removed.
- Home address or precise location fields are removed.
- The privacy filter avoids false positives that remove useful project lines.
- The AI preview reports which private field types were removed without exposing the values.

Current result:

- Partial only if real PDF text is manually extracted before filtering.
- Email, phone, LinkedIn, and portfolio/personal URL data are removed because they appear on a line matched by the current regex.
- Gap: city/country location-like data can remain in AI-visible text.
- Gap: visa/work-permit status can remain, although this may be sensitive depending on product policy.
- Uploaded PDFs reach the same privacy filter after server-side text extraction.

### SETUP-P0-04 - Saved Resume Picker Works In-Page

Goal: verify saved resume selection does not leave setup.

Steps:

1. Open `/setup`.
2. Click Resume history or Change.
3. Select a saved resume.

Expected:

- A picker modal/drawer opens in the current page.
- Selecting a resume fills the current setup state.
- The user remains on `/setup`.
- The user must reconfirm the selected resume.

Current result:

- Aligned for local mock data.
- Production caveat: saved resumes are hardcoded and not loaded from the user's profile/database yet.

### SETUP-P0-05 - `/setup?panel=resumes` Opens Resume Picker

Goal: verify Dashboard deep link behavior.

Steps:

1. Navigate directly to `/setup?panel=resumes`.

Expected:

- The resume picker opens automatically.
- Selecting a resume fills the setup form without leaving the page.

Current result:

- Aligned in the current client implementation.

### SETUP-P0-06 - Target Role Required

Goal: block session start until the target role is valid.

Steps:

1. Confirm a valid resume.
2. Leave the target role/JD empty.
3. Try to proceed.

Expected:

- Confirm role is disabled.
- Start interview remains disabled.

Current result:

- Aligned.

### SETUP-P0-07 - Quick Role Path Is Valid

Goal: verify the generic-role path.

Steps:

1. Confirm a valid resume.
2. Switch to the no-JD / quick-role mode.
3. Select Product Manager.
4. Confirm role.

Expected:

- Role is accepted as `target_role.type = generic_role`.
- The flow advances to session settings.
- Preview reflects Product Manager as the target role.

Current result:

- Partial. Quick role selection and confirmation work.
- Gap: no backend `session_config` payload is assembled yet.
- Gap: sticky preview does not show the selected target role.

### SETUP-P0-08 - JD Under 50 Characters Is Invalid

Goal: enforce target-role validation for JD input.

Steps:

1. Confirm a valid resume.
2. Paste the invalid JD.
3. Try to confirm role.

Expected:

- Confirm role is disabled until the JD reaches at least 50 characters.
- Start interview remains disabled.

Current result:

- Aligned.

### SETUP-P0-09 - Valid JD Path Shows Optional Company Field

Goal: verify JD-specific behavior.

Steps:

1. Confirm a valid resume.
2. Paste the valid JD.
3. Observe the form.
4. Optionally enter a company name.
5. Confirm role.

Expected:

- JD is accepted once it has at least 50 characters.
- Company name field appears after the JD becomes valid.
- Company name remains optional.
- Role confirmation advances to settings.

Current result:

- Aligned for frontend state.
- Production caveat: JD parsing into structured requirements is not implemented.

### SETUP-P0-10 - `/setup?panel=jd-history` Opens JD Picker

Goal: verify Dashboard JD-history deep link behavior.

Steps:

1. Navigate directly to `/setup?panel=jd-history`.
2. Select a previous JD.

Expected:

- JD picker opens automatically.
- Selecting a JD fills the JD textarea.
- The user remains on `/setup`.

Current result:

- Aligned for local mock data.
- Production caveat: JD history is hardcoded, not loaded from user data.

### SETUP-P0-11 - Mode 2 Is Locked But Informative

Goal: verify Full Interview Sim is unavailable without being confusing.

Steps:

1. Open the session settings area.
2. Click Full Interview Sim.

Expected:

- The card is visibly disabled or locked.
- A tooltip or inline message appears: "Full interview simulation is coming soon" or equivalent.
- No settings expand.
- Start interview does not switch to Mode 2.

Current result:

- Partial. The card is visibly locked.
- Gap: click behavior and tooltip/inline message are not implemented.

### SETUP-P0-12 - Question Focus Available And Locked States

Goal: verify available MVP focus types and locked placeholders.

Steps:

1. Open session settings.
2. Select Resume Deep Dive, Behavioral, and Motivation & Fit.
3. Try Culture & Collaboration.
4. Try Situational / Case.

Expected:

- Resume Deep Dive, Behavioral, and Motivation & Fit are selectable.
- Culture & Collaboration and Situational / Case are locked.
- Clicking locked focus types shows a "coming soon" tooltip/inline message and does not change selection.

Current result:

- Partial. Selectable and locked states are correct.
- Gap: locked options are disabled and therefore do not show the required message on click.

### SETUP-P0-13 - Interview Language Defaults And Deutsch Lock

Goal: verify language behavior.

Steps:

1. Open setup.
2. Observe language choices.
3. Click Deutsch.

Expected:

- English is selected by default.
- Deutsch is visible, greyed out, and marked coming soon.
- Clicking Deutsch shows a coming-soon tooltip without changing the language.
- UI explains that users may answer in any language, while questions and feedback remain English.

Current result:

- Gap. Language selection UI is not implemented.

### SETUP-P0-14 - Follow-Up Intensity Changes Duration

Goal: verify question-chain controls.

Steps:

1. Complete resume and target role.
2. Change follow-up intensity to Off, Low, Medium, and High.
3. Observe the preview bar.

Expected:

- Off maps to 0 follow-ups.
- Low maps to 0-1 follow-up per question.
- Medium maps to 0-3 follow-ups per question.
- High maps to 0-5 follow-ups per question.
- Estimated duration changes with the selected intensity.

Current result:

- Partial. Intensity selection and duration summary update.
- Gap: preview does not explicitly show max follow-ups per question.
- Gap: payload mapping to `max_follow_ups_per_question` is not implemented.

### SETUP-P0-15 - Preview Confirmation Bar Shows Required Fields

Goal: verify the final setup summary.

Steps:

1. Complete resume and target role.
2. Leave defaults for settings.
3. Observe the bottom confirmation bar.

Expected:

- Preview shows training mode.
- Preview shows interviewer identity.
- Preview shows target role.
- Preview shows experience level.
- Preview shows interview language.
- Preview shows follow-up intensity and max follow-ups.
- Preview shows estimated duration.
- Preview shows main question count: 3.
- Start interview is enabled only when required fields are complete.

Current result:

- Partial. Mode, focus, level, time, disabled/enabled state are shown.
- Gap: target role, interviewer, interview language, exact follow-up max, and question count are missing.

### SETUP-P0-16 - Start Interview Sends Correct Session Config

Goal: verify production handoff to backend.

Steps:

1. Complete setup with a valid resume and valid JD.
2. Select Behavioral, Mid-level, High follow-up.
3. Click Start interview.
4. Inspect the request payload or server action input.

Expected payload shape:

```json
{
  "session_config": {
    "mode": "focused",
    "resume_text": "...",
    "target_role": {
      "type": "jd",
      "generic_role_name": null,
      "jd_text": "...",
      "company_name": "...",
      "parsed_requirements": []
    },
    "focus_type": "behavioral",
    "level": "mid",
    "interview_language": "en",
    "follow_up_intensity": "high",
    "max_follow_ups_per_question": 5,
    "main_question_count": 3
  }
}
```

Expected:

- The payload is sent to the backend/session creation boundary.
- Credit spend/session creation behavior is handled by the backend slice, or explicitly stubbed with a typed boundary.
- User is routed into the interview session when creation succeeds.

Current result:

- Gap. Start interview currently only shows a local notice and does not submit a typed config.

## P1 Use Cases

### SETUP-P1-01 - Resume Content Detection Shows Useful Hints

Goal: help users understand resume quality.

Steps:

1. Select a resume with project experience, work experience, and measurable results.
2. Select or upload a resume without numbers/results.

Expected:

- UI shows detected project experience.
- UI shows detected work experience.
- UI warns when concrete numbers or results are missing.

Current result:

- Partial. Extracted signal chips are shown.
- Gap: the spec's explicit quality-hint checklist is not implemented.

### SETUP-P1-02 - Mobile Layout Does Not Overflow

Goal: verify usability on small screens.

Steps:

1. Open `/setup` at 390 x 844.
2. Complete resume and target role.
3. Open resume and JD pickers.
4. Switch focus, level, and intensity selections.

Expected:

- No horizontal scrolling.
- Buttons, chips, modals, and sticky summary remain usable.
- Text does not overlap or escape controls.

Current result:

- Previously screenshot-checked after the mobile indentation fix.
- Recommended follow-up: repeat after any summary-bar or language-selector changes.

## Recommended Fix Order

1. Add explicit language selector with English selected and Deutsch locked.
2. Add tooltip/inline message behavior for Mode 2, Deutsch, and locked focus types.
3. Add resume text validation boundary with the 100-character minimum and 10,000-word maximum rules.
4. Expand the sticky preview bar to include the required spec fields.
5. Add a typed `session_config` builder and submit boundary, even if backend session creation remains stubbed.
6. Decide whether the reference-inspired step order is an accepted product deviation. If accepted, document the decision outside `docs/product_spec/` first, then update the source spec only with owner approval.

## Handoff Gate

Before marking setup logic spec-complete, run:

```bash
npm run test:setup
npm run lint
npm run typecheck
npm run build
```

Manual QA must cover all P0 use cases above. P1 mobile layout should be screenshot-checked on desktop and mobile widths.
