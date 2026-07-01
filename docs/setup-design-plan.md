# Setup Flow Design Plan

## Goal

Setup should help the user move from "I want to practice" to "this session is ready" with low friction and clear progress. It is a guided session builder, not a generic configuration form.

## Confirmed Flow

Use a three-step flow:

1. Resume
2. Role
3. Practice

The page keeps a session brief visible so the user can see what is complete and what is still missing. The session brief is the only persistent progress surface; avoid a second stepper in the page header.

## Resume Step

Primary action: upload a resume.

Fallback action: paste resume text.

After upload or paste, show one editable structured resume block rather than many separate fields. The block should use stable section headings so it is easy for both the user and AI to read:

```text
PROFILE SUMMARY

WORK EXPERIENCE

EDUCATION

SKILLS

SELECTED PROJECTS

PORTFOLIO LINKS
```

The user can review and edit the extracted material before continuing. Contact details should not be included in this structured block.

## Role Step

Role and job post are mutually exclusive target sources.

Use a segmented control:

- Common role
- Job post

When Common role is selected, show role chips. When Job post is selected, show the job post textarea and hide the role chips. This interaction makes the active target clear without relying on long explanatory copy.

## Practice Step

Current MVP path is short focused practice. Do not expose question count in the primary UI because it may become configurable later.

The user chooses one practice focus:

- Behavioral
- Resume deep dive
- Case scenario

Full simulation is shown only as a low-priority "coming later" item and does not participate in configuration.

## Copy Principles

Use short, task-focused English:

- "Upload your resume."
- "Review what we extracted."
- "Choose your target."
- "Choose what to practice."

Avoid product-value explanations and long privacy copy. Let the UI state show what is active and what will be used.

## Layout Principles

- Keep the setup screen as close to one viewport as possible.
- Use a two-column layout on desktop: current step on the left, session brief on the right.
- Keep the top header compact and include a clear Exit action back to the dashboard.
- Do not show a header stepper. The right-side session brief carries progress and completion state.
- Long extracted resume content should scroll inside its editor instead of pushing the full page down.
