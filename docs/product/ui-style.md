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
  --paper:          #faf7f1;
  --paper-2:        #fffdf8;
  --paper-card:     rgba(255,253,248,.92);

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

  --serif: "Iowan Old Style", "Palatino", "Times New Roman", serif;
  --sans:  "Avenir Next", "SF Pro Text", sans-serif;

  --radius-sm:      8px;
  --radius-md:      12px;
  --radius-lg:      14px;
  --radius-pill:    999px;
}
```

## Color Usage

- **Paper neutrals** are the base for page backgrounds and quiet surfaces.
- **Sage green** is for primary actions, improvement, feedback, and progress.
- **Blue-gray** is for role-based interview plans and structured preparation.
- **Amber** is for focused drills and short practice energy.
- Avoid a fully beige product: every important user choice should have a distinct semantic color.

## Typography

- Brand and hero titles may use the serif stack.
- Functional UI, forms, interview controls, feedback content, and reports should use the sans stack.
- Use italic serif sparingly. It can feel premium, but too much makes the product less precise.
- Keep letter spacing at `0` for normal text. Use uppercase tracking only for small labels.

## Core Components

- `Button`: primary sage, neutral secondary, clear hover/focus state.
- `PathCard`: two major preparation paths, using `--drill` and `--role`.
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

## Design QA

- Can the user identify the main action in 3 seconds?
- Are focused drills and role plans visually distinct?
- Is text contrast strong enough on warm backgrounds?
- Is the page calm without becoming low-contrast?
- Is the experience clearly more than a question bank?
- Does the feedback lead to a next practice action?
