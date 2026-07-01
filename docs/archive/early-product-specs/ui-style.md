# UI Style Guide — OfferUp

## Positioning

OfferUp should feel like a calm European career coach workspace: structured, candid, warm, and precise. The interface should reduce interview anxiety without becoming cute, decorative, or generic SaaS.

Design phrase: **Calm but precise.**

## Principles

1. **Clarity before decoration**  
   Every screen should make the next action obvious within a few seconds.

2. **Supportive pressure**  
   The product is honest about performance, but feedback should point toward the next useful action.

3. **Two preparation paths**  
   UI should consistently distinguish focused drills from role-based interview plans.

4. **Compounding assets**  
   Sessions should feel like they build a reusable preparation library, not like one-off practice.

5. **Single-layer composition**  
   Prefer one clear surface with dividers and spacing. Avoid cards inside cards.

## Design Tokens

```css
:root {
  --paper:          #faf7f1;   /* base page background */
  --paper-2:        #f1ece4;   /* warm cream — section bg step 2 (e.g. how-it-works) */
  --paper-3:        #e8e2d8;   /* deepest warm layer — section bg step 3 (e.g. proof) */
  --paper-card:     rgba(255,253,248,.92);
  --surface:        #ffffff;   /* pure white card face — for contrast on paper-2/3 bgs */

  --ink:            #29241f;
  --ink-2:          #3a342d;
  --ink-soft:       #6f665e;
  --muted:          #8a8178;

  --line:           #ddd5ca;
  --line-soft:      #ebe4da;
  --line-strong:    #c8beb1;

  --accent:         #3f6b52;
  --accent-soft:    #e6f0e9;
  --accent-border:  #b9d3c1;
  --accent-text:    #2f5842;

  --role:           #4a647a;
  --role-soft:      #e6edf2;
  --role-border:    #becbd5;

  --drill:          #9a6b2f;
  --drill-soft:     #f4eadb;
  --drill-border:   #dec796;

  --danger:         #9a4f4f;
  --danger-bg:      #f8eded;
  --danger-border:  #cfb1b1;

  --font-display: "Iowan Old Style", "Palatino", "Times New Roman", serif;
  --font-ui:      "Avenir Next", "SF Pro Text", sans-serif;
  --font-label:   "Avenir Next", "SF Pro Text", sans-serif;
  --font-mono:    "DM Mono", "SF Mono", ui-monospace, monospace;
  --serif:        var(--font-display);
  --sans:         var(--font-ui);
  --mono:         var(--font-mono);

  --weight-regular:  400;
  --weight-medium:   500;
  --weight-semibold: 600;
  --weight-bold:     700;

  --shadow-card:       0 14px 34px rgba(38,34,28,.055);
  --shadow-card-hover: 0 18px 42px rgba(38,34,28,.085);
  --header-height:     74px;

  --radius-sm:      8px;
  --radius-md:      12px;
  --radius-lg:      14px;
  --radius-pill:    999px;
}
```

## Color Usage

- **Paper neutrals** are the base for page backgrounds and quiet surfaces.
  - `--paper` → base page background
  - `--paper-2` → section background step 2 (warm cream, e.g. "how it works")
  - `--paper-3` → section background step 3 (deepest warm, e.g. proof/contrast)
  - `--surface` → pure white card face for contrast on paper-2/paper-3 backgrounds
- **Sage green** is for primary actions, improvement, feedback, and progress.
- **Blue-gray** is for role-based interview plans and structured preparation.
- **Amber** is for focused drills and short practice energy.
- **Ink background** (`--ink`) is reserved for high-impact closing sections (final CTA, dark footer). Text on ink uses `var(--paper)` with alpha for hierarchy: `rgba(250,247,241,1/.5/.28)`.
- Avoid a fully beige product: every important user choice should have a distinct semantic color.

## Typography

- Brand and hero titles may use the serif stack.
- Functional UI, forms, interview controls, feedback content, and reports should use the sans stack.
- Use italic serif sparingly. It can feel premium, but too much makes the product less precise.
- Avoid heavy black sans-serif headings in cards. Use medium serif or semibold UI text instead.
- Keep letter spacing at `0` for normal text. Use uppercase tracking only for small labels.

## Core Components

- `Button`: primary sage, neutral secondary, clear hover/focus state.
- `PathCard`: two major preparation paths, using `--drill` and `--role`; use refined numeric markers instead of unexplained acronym icons.
- `ProcessStep`: lightweight onboarding explanation, not a heavy task list.
- `UploadCard`: resume, LinkedIn, or notes input.
- `RoleCard`: saved job descriptions and target roles.
- `InterviewRoom`: immersive voice-first mock experience.
- `FeedbackPanel`: recruiter lens, coach lens, and next recommended practice.
- `QuestionBankItem`: saved question, answer status, and replay action.
- `ScoreBadge`: clear status without harsh colors.

## New User Landing Pattern

The first page should explain the product as a preparation system:

1. Add your background.
2. Choose focused drill or role interview plan.
3. Practice live with adaptive follow-ups.
4. Get targeted feedback.
5. Build saved questions, answers, roles, and progress history.

The first CTA should say **Start your first practice**, not **Start your first interview**, because the first session may be a drill or a role-based mock.

Recommended hero promise:

> Turn your real experience into interview-ready answers.

Supporting copy should make the non-native job-seeker value explicit: OfferUp uses the user's resume and target role to help them speak naturally, professionally, and still like themselves.

## Design QA

- Can the user identify the main action in 3 seconds?
- Are focused drills and role plans visually distinct?
- Is text contrast strong enough on warm backgrounds?
- Is the page calm without becoming low-contrast?
- Is the experience clearly more than a question bank?
- Does the feedback lead to a next practice action?
