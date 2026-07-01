# OfferUp — Design System

**Status:** Draft for implementation freeze  
**Last updated:** 2026-06-18  
**Purpose:** Define the visual language, design tokens, component rules, and implementation guardrails for the production rebuild.

This document is the source of truth for OfferUp UI. New pages should not invent colors, shadows, typography, radius, spacing, or component variants locally. If a screen needs a new visual decision, add it here first, then consume it through shared tokens or shared components.

---

## 1. Design Direction

OfferUp should feel like a refined editorial career workspace: minimal, warm, precise, tactile, and supportive. It should not feel like a generic SaaS dashboard, a heavy analytics product, or a decorative marketing site.

Design phrase:

```text
Refined editorial workspace.
```

### 1.1 Design Philosophy

The design philosophy is a hierarchy of priorities. Later layers can only add refinement after earlier layers are working.

1. **Simplicity first**
   - Remove unrelated decoration, extra containers, unnecessary icons, and redundant text.
   - Every page should have one obvious primary action.
   - Simplicity here means deliberate and edited, not empty or underdesigned.

2. **Hierarchy serves information**
   - Design exists to make the product's information easier to understand.
   - Typography, spacing, color, surface contrast, and component weight should clarify what matters first, second, and third.
   - Feedback pages must make `Answer signal → Interviewer heard → Next version` immediately legible.

3. **Warm refinement**
   - The product should feel human and supportive, not cold or mechanical.
   - Warmth comes from paper canvas, limewash black, Lora display type, soft surfaces, and restrained sage/amber accents.
   - Refinement comes from precise alignment, careful spacing, calm surfaces, and fewer but better visual moves.

4. **Atmosphere after structure**
   - Texture, subtle gradients, and material feel are allowed only after the layout hierarchy is clear.
   - Atmosphere should reduce monotony and add craft, not become decoration.
   - Dense product areas stay cleaner than landing or empty states.

### 1.2 Reference Boundary

References are used to define boundaries, not to copy surfaces.

| Reference | Take | Do not take |
|---|---|---|
| Current OfferUp landing | Warm paper, limewash black, serif headline, calm CTA | Old demo score-first dashboard patterns |
| ElevenLabs-style editorial restraint | Quiet confidence, off-white canvas, typography-led beauty | Floating gradient orbs, voice-AI marketing drama |
| Linear/Notion-like workspace discipline | Precise spacing, low visual noise, information hierarchy | Cold monochrome, generic productivity sameness |
| Editorial report design | Reading rhythm, section pacing, strong typography hierarchy | Dense magazine ornament or decorative layouts |

Style constraints:

- **Quiet confidence:** Use warm paper, limewash black ink, exact spacing, and very selective lines.
- **Texture with restraint:** Use subtle paper grain and low-opacity ambient gradients only as atmosphere.
- **Diagnosis over scoring:** Feedback and dashboard surfaces prioritize words, structure, and next actions over numbers.
- **Single-layer composition:** Use sections, spacing, rows, and compact panels. Do not put cards inside cards.
- **Soft separation first:** Prefer whitespace, alignment, surface tone, and typography before adding borders or divider lines.
- **Action stays visible:** Every page has one primary action, styled consistently.
- **No ornament without function:** Aesthetic details must support mood, hierarchy, or readability.

---

## 2. Token Ownership Rules

All production styles must come from shared tokens.

Allowed:

- CSS variables in `styles/tokens.css`.
- Tailwind theme values mapped from those variables.
- Shared component variants in `components/ui/*`.
- Page layout primitives in `components/layout/*`.

Not allowed:

- Hardcoded hex colors inside page components.
- Page-local shadows, border radii, font stacks, or ad hoc gradients.
- New button/input/card variants created inside a page file.
- One-off `style={{ ... }}` for visual styling except dynamic layout values that cannot reasonably be tokenized.

When a new style is needed:

1. Add or extend a token in this document.
2. Add it to the token file.
3. Expose it through Tailwind or a shared component variant.
4. Use the shared token/component in the page.

---

## 3. Core Tokens

### 3.1 Color Tokens

Use semantic names in product code. Hex values should live only in the token layer.

```css
:root {
  /* Canvas */
  --color-paper: #faf7f1;
  --color-paper-soft: #f6f1e8;
  --color-paper-deep: #eee7dc;
  --color-surface: #fffaf2;
  --color-surface-muted: rgba(255, 250, 242, 0.72);

  /* Ink */
  --color-ink: #29241f;
  --color-ink-2: #3a342d;
  --color-ink-soft: #6f665e;
  --color-muted: #8a8178;
  --color-muted-soft: #b4aaa0;

  /* Lines */
  --color-line: #ddd5ca;
  --color-line-soft: #ebe4da;
  --color-line-strong: #c8beb1;

  /* Semantic accents */
  --color-sage: #3f6b52;
  --color-sage-soft: #e6f0e9;
  --color-sage-border: #b9d3c1;
  --color-sage-text: #2f5842;

  --color-blue-gray: #4a647a;
  --color-blue-gray-soft: #e6edf2;
  --color-blue-gray-border: #becbd5;
  --color-blue-gray-text: #334c60;

  --color-amber: #9a6b2f;
  --color-amber-soft: #f4eadb;
  --color-amber-border: #dec796;
  --color-amber-text: #6a4f28;

  --color-clay-red: #9a4f4f;
  --color-clay-red-soft: #f8eded;
  --color-clay-red-border: #cfb1b1;
  --color-clay-red-text: #884040;
}
```

Usage rules:

- `--color-ink` is the signature limewash black. Use it for brand, headings, primary body text, and primary CTA background.
- `--color-paper` is the default page canvas.
- `--color-surface` is for forms, report reading areas, and focused content panels. It should read as warm porcelain, not pure white.
- Sage is for primary action, saved, success, and completion.
- Blue-gray is for interviewer/role structure.
- Amber is for focused drill, mentor guidance, and next action.
- Clay red is only for risk, concern, destructive, or error states.
- Do not introduce purple-blue AI gradients.
- Do not use pure black `#000000` or pure white `#ffffff` as default UI foundations.

### 3.2 Atmosphere Tokens

Atmosphere is allowed, but it must be subtle and centralized.

```css
:root {
  --texture-paper-opacity: 0.035;
  --gradient-page:
    radial-gradient(44rem 28rem at 8% 8%, rgba(255, 253, 248, 0.78), transparent 64%),
    radial-gradient(34rem 24rem at 92% 18%, rgba(230, 240, 233, 0.46), transparent 68%),
    radial-gradient(30rem 22rem at 86% 86%, rgba(244, 234, 219, 0.38), transparent 70%);
  --gradient-report:
    radial-gradient(36rem 24rem at 90% 12%, rgba(230, 237, 242, 0.44), transparent 70%),
    radial-gradient(30rem 20rem at 14% 88%, rgba(230, 240, 233, 0.36), transparent 72%);
}
```

Usage rules:

- Texture and gradients belong to page shells, landing hero, quiet empty states, and report backgrounds.
- Do not place gradients inside buttons, cards, or dense content areas.
- Do not use visible floating orbs, bokeh blobs, or decorative color spots.
- Content surfaces must remain readable over atmosphere.

### 3.3 Typography Tokens

```css
:root {
  --font-display: "Lora", "Iowan Old Style", "Palatino", "Times New Roman", serif;
  --font-ui: "IBM Plex Sans", "Avenir Next", "SF Pro Text", "Inter", "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif;
  --font-cjk: "PingFang SC", "Noto Sans SC", "Microsoft YaHei", "Heiti SC", sans-serif;
  --font-de: "IBM Plex Sans", "Avenir Next", "SF Pro Text", "Inter", "Helvetica Neue", Arial, sans-serif;
  --font-mono: "DM Mono", "SF Mono", "Menlo", "Consolas", ui-monospace, monospace;

  --text-label: 11px;
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 24px;
  --text-2xl: 32px;
  --text-3xl: 48px;

  --leading-tight: 1.08;
  --leading-heading: 1.18;
  --leading-body: 1.62;
}
```

Usage rules:

- Use display serif for brand, landing headlines, dashboard hero lines, report titles, and major page headings.
- Use UI sans for forms, navigation, body text, report content, and controls.
- Use `--text-label` only for tiny mono uppercase labels, metadata, and technical rhythm such as dates.
- Use even-numbered sizes for core UI/body text so typography aligns better with the spacing scale and is easier to maintain.
- No viewport-based font scaling.
- Letter spacing is `0` for normal text. Uppercase labels may use positive tracking.
- Avoid heavy bold headings. Prefer medium serif or semibold UI text.

Language rules:

- English UI uses `--font-ui` for body/control text and `--font-display` for major editorial headings.
- German content uses `--font-de` or `--font-ui`; both must render umlauts cleanly (`ä`, `ö`, `ü`, `ß`) and keep generous line height.
- Chinese content uses `--font-cjk`; do not force the serif display stack onto Chinese paragraphs or dense UI.
- Mixed English/German/Chinese paragraphs should use `--font-ui` because its fallback includes CJK fonts.
- Do not use monospace for German or Chinese body content. Mono is only for labels, dates, IDs, and code-like metadata.
- Keep body line height at `1.62` for English/German and at least `1.7` for Chinese-heavy paragraphs.

Font pairing candidates before freeze:

| Pairing | Best use | Character |
|---|---|---|
| `Lora` + `IBM Plex Sans` | Production app, Dashboard, Feedback | Warm editorial + precise professional structure |
| `Newsreader` + `Manrope` | More editorial alternate | Refined, bookish, less generic |
| `Lora` + `DM Sans` | Softer fallback | Warm, calm, friendlier |
| `Source Serif 4` + `IBM Plex Sans` | Feedback/report-heavy pages | Serious, structured, precise |
| `Fraunces` + `Plus Jakarta Sans` | Landing or rare brand moments | Distinctive, polished, more expressive |
| `Cormorant Garamond` + `Manrope` | Large sparse editorial moments only | Beautiful but fragile in dense UI |
| `Noto Serif SC` + `Noto Sans SC` | Chinese support content | Clear CJK hierarchy |

Default exclusions:

- Do not use Arial, Helvetica, Times New Roman, Georgia-only, Roboto-only, or Inter-only as the primary brand expression.
- These fonts are acceptable as system fallbacks, but they are too familiar to carry OfferUp's visual identity by themselves.
- Choose typography for aesthetic signal, not only availability.

### 3.4 Spacing, Radius, Shadow

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Product density */
  --density-section-y: 32px;
  --density-panel-pad: 18px;
  --density-card-min: 150px;

  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 14px;
  --radius-pill: 999px;

  --shadow-panel: 0 12px 30px rgba(38, 34, 28, 0.045);
  --shadow-float: 0 24px 60px rgba(38, 34, 28, 0.12);
}
```

Usage rules:

- Default card/panel radius is `8px`.
- Use `12px` or `14px` only for modal and large page-level surfaces.
- Avoid heavy shadows. Most app surfaces should rely on spacing and subtle surface contrast.
- Use row rhythm and whitespace instead of boxed cards when the information is list-like.
- Do not let borders become the main organizing device of a page.
- Product app density should be compact by default: enough air to feel refined, but no oversized dashboard cards, inflated hero blocks, or decorative dead space.
- Use `--density-section-y`, `--density-panel-pad`, and `--density-card-min` for internal app pages and design-system preview surfaces.
- Landing pages and rare editorial moments may use the larger spacing scale, but Dashboard, Setup, Feedback, and Answer Bank should start from compact density.

### 3.5 Semantic Alias Tokens

Primitive tokens define raw material. Product code should prefer semantic aliases so future visual changes can happen in one place.

```css
:root {
  /* Text */
  --text-primary: var(--color-ink);
  --text-secondary: var(--color-ink-soft);
  --text-muted: var(--color-muted);
  --text-inverse: var(--color-paper);
  --text-success: var(--color-sage-text);
  --text-info: var(--color-blue-gray-text);
  --text-warning: var(--color-amber-text);
  --text-danger: var(--color-clay-red-text);

  /* Background */
  --bg-page: var(--color-paper);
  --bg-page-soft: var(--color-paper-soft);
  --bg-surface: var(--color-surface);
  --bg-surface-muted: var(--color-surface-muted);
  --bg-success: var(--color-sage-soft);
  --bg-info: var(--color-blue-gray-soft);
  --bg-warning: var(--color-amber-soft);
  --bg-danger: var(--color-clay-red-soft);

  /* Border */
  --border-default: var(--color-line);
  --border-subtle: var(--color-line-soft);
  --border-strong: var(--color-line-strong);
  --border-success: var(--color-sage-border);
  --border-info: var(--color-blue-gray-border);
  --border-warning: var(--color-amber-border);
  --border-danger: var(--color-clay-red-border);

  /* Product semantics */
  --accent-primary: var(--color-ink);
  --accent-action: var(--color-ink);
  --accent-save: var(--color-sage);
  --accent-role: var(--color-blue-gray);
  --accent-drill: var(--color-amber);
  --accent-risk: var(--color-clay-red);
}
```

Usage rules:

- Component code should use `--text-primary`, `--bg-surface`, and `--border-default` before reaching for primitive tokens.
- Primitive colors are allowed inside token definitions and rare custom visualization logic only.
- Product concepts map to accents consistently:
  - primary navigation / start action = ink
  - save / success / completed state = sage
  - interviewer/role = blue-gray
  - focused drill/mentor action = amber
  - risk/error/destructive = clay red

Sage usage limit:

- Sage should be visually limited. It is not the page's dominant brand color.
- Use ink for core CTA buttons such as `Start practice`, `Continue`, `Submit answer`, and `Polish answer` when they are the main action.
- Use sage for `Save`, `Saved`, `Success`, completed calendar cells only when a softer success signal is needed, and positive status accents.
- Avoid large green panels or green page backgrounds.

### 3.6 Layout Tokens

```css
:root {
  --layout-sidebar: 224px;
  --layout-sidebar-collapsed: 76px;
  --layout-content-max: 1080px;
  --layout-report-max: 960px;
  --layout-landing-max: 1160px;
  --layout-topbar: 64px;
  --layout-page-x: 48px;
  --layout-page-y: 64px;
  --layout-panel-padding: 24px;
  --layout-row-padding: 16px;
  --measure-readable: 680px;
}
```

Usage rules:

- Dashboard, Setup, Answer Bank, and Feedback should share shell widths.
- Feedback report content should use `--layout-report-max` and `--measure-readable` to avoid overly long lines.
- Do not define page-specific max widths unless a product spec explicitly requires it.

### 3.7 State Tokens

```css
:root {
  --state-hover-bg: rgba(255, 253, 248, 0.58);
  --state-active-bg: var(--color-surface);
  --state-selected-bg: var(--color-sage-soft);
  --state-disabled-opacity: 0.46;
  --state-locked-opacity: 0.58;
  --state-skeleton-bg: rgba(221, 213, 202, 0.46);
  --focus-ring: 0 0 0 4px rgba(63, 107, 82, 0.10);
}
```

Usage rules:

- Locked future features use `--state-locked-opacity`, not danger styling.
- Disabled controls use opacity plus cursor semantics; they should not look broken.
- Focus states must be visible and use the shared focus ring.
- Loading skeletons are local to the component area; do not block the entire page while independent regions load.

### 3.8 Motion Tokens

```css
:root {
  --motion-fast: 140ms;
  --motion-base: 180ms;
  --motion-slow: 260ms;
  --ease-standard: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-enter: cubic-bezier(0.22, 0.68, 0, 1);
}
```

Usage rules:

- Motion is functional and quiet: hover lift, modal enter, toast enter/exit, and step transitions.
- Avoid decorative looping animations in the product app.
- Feedback/report reading pages should be almost still.

### 3.9 Foundation Freeze Checklist

Before production UI work starts, freeze these foundation decisions:

- [x] Design philosophy: simplicity, hierarchy, warm refinement, atmosphere after structure.
- [x] Primary font pairing: Lora + IBM Plex Sans.
- [x] Core text scale: 11 label, then 12/14/16/18/24/32/48.
- [x] Primary palette: warm paper, limewash black, sage, blue-gray, amber, clay red.
- [x] `developing` status color: amber-soft by default.
- [x] Paper texture approach: CSS-only grid/grain, no image asset for MVP.
- [x] Dashboard and AppShell tablet behavior: keep sidebar text labels until 768px, then collapse.
- [x] Primary app CTA is ink by default; sage is limited to save/success/completion.

---

## 4. Component System

All components below should be implemented once as shared primitives. Product pages should compose these primitives instead of creating new page-local styles.

### 4.1 Page Shell

Variants:

- `MarketingShell`: landing page, top nav, full-width bands.
- `AppShell`: logged-in product, fixed left sidebar, warm paper canvas.
- `ReportShell`: feedback/report reading pages, same sidebar, narrower reading rhythm.

Rules:

- Sidebar width: `200–224px` desktop.
- Main content max width: `1040–1080px`.
- App pages use warm paper canvas plus subtle atmosphere.
- Dense content areas use `--color-surface` or transparent sections with generous spacing. Use dividers only when adjacent content would otherwise become ambiguous.

### 4.2 Buttons

Variants:

- `primary`: limewash black background, warm paper text.
- `secondary`: transparent or soft surface, ink text, optional line border only when needed for affordance.
- `save`: sage background for save/success actions only.
- `ghost`: text-only for tertiary actions.
- `danger`: clay red text/border only for destructive actions.

States:

- `default`
- `hover`
- `focus`
- `disabled`
- `loading`

Rules:

- Primary button appears once per page region.
- Landing CTA may be larger; app CTAs should be compact and precise.
- `Start practice`, `Continue`, `Submit answer`, `Polish answer`, and primary navigation actions use `primary`.
- `Save`, `Saved`, and success-confirming actions use `save`.
- Destructive actions use `danger` and must be visually quieter than primary until confirmation.
- Buttons use icons only when the command benefits from a familiar symbol.
- Do not create page-specific button colors.
- Loading buttons keep their width stable and swap label with spinner/text without layout shift.

### 4.3 Inputs And Textareas

States:

- default
- focus
- disabled
- error
- success/saved

Rules:

- Inputs use soft surface background, a quiet boundary, and sage focus ring.
- Textareas must have stable min-height and cannot resize layout unexpectedly.
- Error copy uses clay red semantic tokens.
- Helper text uses muted text.
- Labels use mono label or semibold UI text consistently; do not mix label styles inside one form.
- Textareas used for answers should be large enough to feel like a writing surface, not a comment box.
- Disabled fields should preserve text readability.

### 4.4 Panels, Cards, Rows

Types:

- `Panel`: page-level surface, used sparingly.
- `EntryCard`: mode choice or asset shortcut.
- `ListRow`: history, saved answers, JD history.
- `ReportBlock`: feedback reading block.
- `ActionRail`: compact right-side action area for Feedback/Polish.

Rules:

- Do not nest cards.
- Prefer `ListRow` with spacing, type hierarchy, and subtle hover surface for repeated items.
- Asset shortcuts can be compact cards or rows, but must use the same shared variant.
- Panels should not use strong shadows in the app shell.
- Dashboard should lean on rows, whitespace, and compact entries instead of chunky cards or divider-heavy layouts.
- Feedback uses report blocks and action rails, not analytics widgets.

### 4.5 Badges And Status Pills

Variants:

- `strong`: sage.
- `growing`: amber.
- `developing`: amber soft by default; clay red only if the context is explicitly risk/concern.
- `locked`: muted neutral.
- `role`: blue-gray.
- `drill`: amber.
- `saved`: sage.
- `risk`: clay red.

Rules:

- Status pills describe state; they are not decorative.
- Dashboard must not use score numbers as the primary progress signal.
- Locked pills are visually quiet and never look like errors.
- Badges should be small and sparse. Do not build badge-heavy pages.
- Use sentence case labels, not all caps, except tiny mono metadata outside badges.

### 4.6 Modal, Toast, Tooltip

Modal:

- Use `--color-paper-soft` surface.
- Use `--shadow-float`.
- Backdrop uses warm ink with low opacity and blur.
- Header uses serif title plus muted subtitle.
- Primary action sits bottom-right on desktop and full-width last on mobile.
- Destructive confirmation modals require explicit copy and a secondary cancel action.

Toast:

- Fixed bottom-right on desktop, bottom-center on mobile.
- Success uses sage soft.
- Error uses clay red soft.
- Toast copy is short and action-specific.
- Toasts auto-dismiss unless they contain an undo action.

Tooltip:

- Use for locked features, icon buttons, truncated text, and brief clarifications.
- Tooltip background uses ink; text uses paper.
- Tooltips must not contain long instructions.
- If explanation needs more than one sentence, use inline helper text instead.

### 4.7 Locked State

Used for Mode 2, Deutsch, Culture & Collaboration, Situational / Case, and future features.

Rules:

- Opacity around `0.52–0.62`.
- Neutral, quiet boundary.
- Label: `Coming soon` or `Locked`.
- Click shows tooltip or inline note; it must not navigate or error.
- Locked content should still communicate product direction without feeling broken.

---

## 5. Product-Specific Components

Product-specific components are where OfferUp's information structure becomes reusable UI. They should sit above generic `ui/*` primitives and below page-level composition.

### 5.0 Component Abstraction Rules

Use mature headless primitives for common interactive behavior:

- Dialog / Modal
- Toast
- Tooltip
- Dropdown / Menu
- Tabs
- Checkbox / Radio / Switch
- Select / Combobox when needed

Rules:

- Mature primitives provide accessibility, keyboard behavior, focus management, and overlay mechanics.
- OfferUp owns the visual styling through tokens and shared variants.
- Do not copy a full external visual system into OfferUp. Import behavior and structure, not brand expression.
- Good default implementation direction: Radix-style headless primitives or shadcn-style local wrappers, connected to OfferUp tokens.

Abstract a product component when:

- It appears in two or more places.
- It carries product meaning, even if it appears on one page only.
- It contains a recurring state model such as locked, saved, selected, developing, or generated.
- It protects a core information structure such as `Answer signal -> Interviewer heard -> Next version`.

Do not abstract when:

- The UI is a one-off page layout with no reusable product meaning.
- The pattern is still exploratory and likely to change.
- A shared primitive plus page composition is clearer than a named component.
- The abstraction would hide important page-specific hierarchy.

Layering rule:

```text
Headless primitive behavior
-> OfferUp UI primitive styling
-> OfferUp product components
-> Page-specific composition
```

### 5.1 Dashboard Components

Required components:

- `ModeEntry`
- `PracticeCalendar`
- `PracticeActivityList`
- `AssetShortcut`
- `AccountMenu`

Rules:

- No score widgets, radar charts, line charts, or percent improvement.
- Progress is shown by practice rhythm, completed count, and qualitative labels.
- Zero state should feel calm, not empty or punitive.
- Normal state should feel like a refined workspace, not an analytics dashboard.
- `ModeEntry` and `AssetShortcut` are product components because they encode OfferUp actions.
- The dashboard page header and section arrangement can remain page composition unless reused elsewhere.

### 5.2 Setup Components

Required components:

- `SavedResumePicker`
- `ResumeTextarea`
- `JDInput`
- `ModeSelector`
- `FocusTypeSelector`
- `LockedModeEntry`

Rules:

- Setup should guide, not overwhelm.
- Saved resume reuse is P0 and must look like a first-class path.
- Mode 2 locked state uses the shared locked pattern.
- `SavedResumePicker`, `ModeSelector`, and `LockedModeEntry` should be components because they carry reusable choice/state logic.
- One-off explanatory copy and step layout can stay in the setup page.

### 5.3 Interview Components

Required components:

- `InterviewRoom`
- `QuestionPanel`
- `AnswerTextarea`
- `ProgressSteps`
- `SessionContextRail`
- `EndSessionDialog`

Rules:

- Text answer input is P0 and must be visually stable.
- Push to Talk is P1 and should not dominate the P0 text experience.
- Do not use cheap voice-call metaphors as the main UI if text-only is active.
- `QuestionPanel`, `AnswerTextarea`, `ProgressSteps`, and `SessionContextRail` should be product components.
- The exact interview page grid can stay page-level until the interaction model stabilizes.

### 5.4 Feedback Components

Required components:

- `FeedbackHeader`
- `LensSummary`
- `QuestionIndex`
- `AnswerSignalBlock`
- `InterviewerHeardBlock`
- `NextVersionBlock`
- `FeedbackActionRail`

Rules:

- The three-part structure is the core visual system:
  - `Answer signal`
  - `Interviewer heard`
  - `Next version should include`
- `Next version should include` gets slightly stronger emphasis because it drives action.
- Do not make scores the visual center.
- Use report-like reading rhythm: section labels, whitespace, occasional hairlines, and calm contrast.
- `AnswerSignalBlock`, `InterviewerHeardBlock`, and `NextVersionBlock` are product components even if they only appear in Feedback, because they define OfferUp's feedback language.
- `FeedbackActionRail` is a component if reused by polish/save/export flows; otherwise it can begin as page composition and be extracted after reuse appears.

### 5.5 Answer Polish Components

Required components:

- `PolishAction`
- `PolishedAnswerPanel`
- `PolishExplanationDisclosure`
- `SavePolishToBankButton`

Rules:

- Show the complete improved answer first.
- Explanation is secondary and progressively disclosed.
- Avoid wording like `perfect answer`.
- Save to Answer Bank creates a new version when needed.

### 5.6 Answer Bank Components

Required components:

- `AnswerBankList`
- `AnswerSearch`
- `AnswerFilterBar`
- `AnswerVersionSelector`
- `AnswerDetail`
- `BankAnswerEditor`

Rules:

- Distinguish `original_answer`, `polished_answer`, and `bank_answer`.
- `bank_answer` is editable; original and polished answers are read-only.
- Versioning must be visible but quiet.
- Use rows and split panes over bulky card grids.
- `AnswerBankList`, `AnswerVersionSelector`, and `BankAnswerEditor` should be components because they encode answer lifecycle state.

---

## 6. Responsive Rules

Breakpoints:

```text
mobile: 0–767px
tablet: 768–1023px
desktop: 1024px+
```

Rules:

- Sidebar collapses to top navigation or icon rail on mobile.
- Dashboard stacks sections in this order: welcome/mode, practice rhythm, practice activity, assets.
- Feedback stacks as: header, global summary, question selector, selected question feedback, actions.
- Setup becomes a single-column wizard on mobile.
- Textareas and report content must never become too narrow to read.

---

## 7. Implementation Contract

This contract turns the design system into implementation rules. If implementation needs to break one of these rules, update this document first.

### 7.1 File Ownership

Recommended file ownership for the production rebuild:

```text
styles/
  tokens.css          # CSS variables only
  globals.css         # base reset, font smoothing, body canvas
  typography.css      # optional type utilities if not handled by Tailwind

components/
  ui/
    Button.tsx
    Input.tsx
    Textarea.tsx
    Badge.tsx
    Panel.tsx
    Modal.tsx
    Toast.tsx
    Tooltip.tsx
    ListRow.tsx
    ReportBlock.tsx
  layout/
    MarketingShell.tsx
    AppShell.tsx
    ReportShell.tsx
  product/
    dashboard/
    setup/
    interview/
    feedback/
    answer-bank/
```

Ownership rules:

- `styles/tokens.css` owns all primitive, semantic, atmosphere, layout, state, motion, radius, spacing, and density tokens.
- `styles/globals.css` owns reset, body canvas, base font smoothing, and page background only.
- `components/ui/*` owns reusable styled primitives and variants.
- `components/layout/*` owns shell composition and page-level atmosphere.
- `components/product/*` owns OfferUp-specific modules and product state semantics.
- Route/page files own data loading, page ordering, and one-off composition only.

### 7.2 Token Mapping

Tailwind should reference CSS variables instead of raw hex values:

```js
colors: {
  paper: "var(--color-paper)",
  surface: "var(--color-surface)",
  ink: "var(--color-ink)",
  muted: "var(--color-muted)",
  line: "var(--color-line)",
  sage: "var(--color-sage)",
  role: "var(--color-blue-gray)",
  amber: "var(--color-amber)",
  danger: "var(--color-clay-red)"
}
```

Minimum Tailwind mappings:

```js
fontFamily: {
  display: "var(--font-display)",
  ui: "var(--font-ui)",
  cjk: "var(--font-cjk)",
  mono: "var(--font-mono)"
},
borderRadius: {
  xs: "var(--radius-xs)",
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
  pill: "var(--radius-pill)"
},
boxShadow: {
  panel: "var(--shadow-panel)",
  float: "var(--shadow-float)"
}
```

Rules:

- Raw values are allowed inside token files only.
- Page components should use semantic aliases before primitive tokens.
- Tailwind utility usage should still resolve to token-backed values.
- Ad hoc gradients, shadows, radii, and colors are implementation bugs unless added to the design system first.

### 7.3 Component API Rules

Shared component props should be narrow and semantic:

```ts
Button variant = "primary" | "secondary" | "save" | "ghost" | "danger"
Badge variant = "strong" | "growing" | "developing" | "locked" | "role" | "drill" | "saved" | "risk"
Panel variant = "surface" | "quiet" | "report"
ListRow state = "default" | "selected" | "locked" | "disabled"
ReportBlock tone = "signal" | "interviewer" | "next" | "risk"
```

Rules:

- Component APIs should expose product meaning, not raw color choices.
- Do not add props like `color="#..."`, `rounded="..."`, or `shadow="..."`.
- If a component needs a new visual state, add the token and variant first.
- Product modules can accept content and state, but should not accept arbitrary class overrides by default.
- `className` escape hatches are allowed only for layout positioning, not visual identity.

### 7.4 Build Order

Implementation should proceed in this order:

1. Add `styles/tokens.css` and base global styles.
2. Configure Tailwind to consume CSS variables.
3. Build `components/ui/*` primitives and their variants.
4. Build `MarketingShell`, `AppShell`, and `ReportShell`.
5. Build product components for Dashboard and Setup first.
6. Build Interview and Feedback product components.
7. Build Answer Bank and polish/versioning components.
8. Implement route pages by composing existing components.

### 7.5 Code Review Gate

Code review checklist:

- No new raw hex values outside token files.
- No page-local button/input/card variants.
- No nested card composition.
- No border-heavy page scaffolding; unnecessary divider lines should be removed.
- No new gradients outside page shell tokens.
- No score-first dashboard or feedback UI.
- All locked/future features use the shared locked state.
- Primary actions use ink by default; sage is limited to save/success/completion.
- No page-specific shadows, radii, or text scales.
- No one-off component variants inside route files.
- Product modules use shared UI primitives instead of restyling native elements.
- Feedback preserves `Answer signal -> Interviewer heard -> Next version`.
- Dashboard uses rows, rhythm, and qualitative progress instead of analytics widgets.

---

## 8. Design Freeze Checklist

This checklist is the last stop before production implementation. Freeze means product pages can start building against this system without inventing new visual rules.

### 8.1 Frozen Decisions

- [x] Design phrase: `Refined editorial workspace`.
- [x] Design philosophy: simplicity first, hierarchy serves information, warm refinement, atmosphere after structure.
- [x] Reference boundary: warm editorial workspace, not generic SaaS, analytics dashboard, or AI-gradient spectacle.
- [x] Primary palette: warm paper, limewash black, sage, blue-gray, amber, clay red.
- [x] Primary CTA behavior: ink by default; sage only for save, success, and completion.
- [x] Font pairing direction: Lora + IBM Plex Sans.
- [x] Core type scale: label 11, then 12 / 14 / 16 / 18 / 24 / 32 / 48.
- [x] Product density: compact by default for app pages.
- [x] Component strategy: mature headless behavior, OfferUp-owned visual tokens and product modules.
- [x] Product-specific component layer: Dashboard, Setup, Interview, Feedback, Answer Polish, Answer Bank.
- [x] Implementation contract: token file, global styles, UI primitives, layout shells, product modules, page composition.

### 8.2 Finalized Implementation Decisions

- [x] Final production font delivery: Google-hosted Lora + IBM Plex Sans for MVP.
- [x] `developing` status color: amber-soft by default; reserve clay-red-soft for true risk/gap states.
- [x] App sidebar behavior on tablet: keep text labels until 768px, then collapse into a compact rail.
- [x] Paper texture approach: CSS-only grid/grain for MVP.

### 8.3 Development Entry Gate

Implementation can start when:

- [ ] `styles/tokens.css` contains every token defined in this document.
- [ ] Tailwind maps to CSS variables instead of raw values.
- [ ] Shared UI primitives exist for Button, Input, Textarea, Badge, Panel, ListRow, ReportBlock, Modal, Toast, and Tooltip.
- [ ] Layout shells exist for MarketingShell, AppShell, and ReportShell.
- [ ] Dashboard and Setup product modules are implemented before their route pages.
- [ ] Code review uses the gate in section 7.5.

### 8.4 First Implementation Slice

Recommended first slice:

1. Create token and global style files.
2. Build UI primitives and layout shells.
3. Implement Dashboard using `ModeEntry`, `PracticeActivityList`, and `AssetShortcut`.
4. Implement Setup using `SavedResumePicker`, `ResumeTextarea`, `JDInput`, `ModeSelector`, and `LockedModeEntry`.
5. Only then move into Interview and Feedback.
