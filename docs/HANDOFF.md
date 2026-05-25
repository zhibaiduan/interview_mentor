# Interview Mentor — Dev Handoff

**Last updated:** 2026-05-11  
**Branch:** main  
**Status:** MVP frontend mostly complete, API integration not wired end-to-end

---

## 1. What exists right now

### File map

```
demo-mvp/
  public/
    index.html        # 1418 lines — setup + incoming call + live interview (single-page)
    feedback.html     # 1195 lines — feedback page (two-tab, single-file)
  server.js           # 267 lines — Node.js HTTP server (port 8787)
  .env                # OPENAI_API_KEY, LLM_MODEL, STT_MODEL, TTS_MODEL
  OPENAI_CONFIG_TEMPLATE.txt   # template for .env
docs/
  product/
    mvp-prd.md        # full PRD
    ui-style.md       # design system spec
    mvp-plan-aha.md
    product-brief-en.md
  HANDOFF.md          # this file
```

### Run locally

```bash
cd demo-mvp
node server.js        # → http://127.0.0.1:8787
```

- No API key → falls back to offline mode (local rubric, no STT/TTS)
- With key → full OpenAI STT (gpt-4o-mini-transcribe), TTS (gpt-4o-mini-tts), chat (gpt-4o-mini by default)

---

## 2. Design token system

Both `index.html` and `feedback.html` share a unified `:root` token set. **All hardcoded hex values have been removed from CSS** (only SVG attributes in the envelope animation retain literal hex).

### Token categories

| Category | Tokens |
|---|---|
| Surface | `--paper`, `--paper-2`, `--paper-card` |
| Text | `--ink`, `--ink-2`, `--ink-soft`, `--muted` |
| Border | `--line`, `--line-soft` |
| Accent (sage green) | `--accent`, `--accent-soft`, `--accent-border`, `--accent-text`, `--accent-deep`, `--accent-dim` |
| Warm (amber brown) | `--warm`, `--warm-soft`, `--warm-border`, `--warm-text`, `--warm-dim`, `--warm-muted`, `--warm-faint` |
| Weak (red-adjacent) | `--weak`, `--weak-soft`, `--weak-border`, `--weak-text` |
| Danger | `--danger`, `--danger-bg`, `--danger-border`, `--danger-text` |
| Typography | `--serif`, `--sans`, `--text-label` (10px) → `--text-3xl` (42px) |
| Radius | `--radius-sm` (8px), `--radius-md` (12px), `--radius-lg` (14px), `--radius-pill` (999px) |
| Atmosphere | `--peach`, `--lavender`, `--blue-mist` |

---

## 3. `index.html` — Interview flow

### Page states (single HTML file, CSS class switching)

```
default              → setup panel visible
body.live-mode       → immersive-shell visible, setup/incoming hidden
#incoming            → incoming call panel (within setup layout)
```

### Key sections

- **`#setup`** — Resume textarea + JD textarea + 5-step round plan strip  
- **`#incoming`** — Caller profile, Decline / Accept buttons  
- **`#live`** — immersive shell: call stage (avatar, wave viz, captions, talk/hang buttons) + call log panel  

### Session data written to `sessionStorage`

```js
{
  role, company, jd, resume,
  interviewer: { name, title, initial },
  startedAt, endedAt,
  turnCount, maxTurns, durationLabel,
  turns: [{ question, transcript, followUp, recruiterLens, coachTip, polish, nextAction }],
  summary: { overall, strengths, risks, nextAction }
}
```

### API calls from `index.html`

| Endpoint | Triggered by |
|---|---|
| `POST /api/stt` | After user stops recording (MediaRecorder stop) |
| `POST /api/chat` | After each transcribed answer |
| `POST /api/tts` | For interviewer speech (question text → audio) |

---

## 4. `feedback.html` — Feedback page

### Entry points

1. **From interview end** → ending overlay animates (SVG envelope) → user clicks "Open Your Feedback" → `openFeedback()` fades overlay, shows `#main`
2. **Direct URL** (no `sessionStorage.endedAt`) → `skipEnvelope()` bypasses overlay immediately

### Two-tab layout

```
Tab 1: Overview       #tab-overview   (default visible)
Tab 2: Question Review #tab-questions  (.hidden until tab click)
```

`switchTab(name)` toggles `.hidden` on both sections + `.active` on tab buttons.

### Tab 1 — Overview modules (top to bottom)

1. **Verdict banner** (`#signalBadge`, `#overallScore`) — Hire Signal chip (3 tiers: Strong ≥80 / Developing 60–79 / Weak <60) + overall score + one-line summary + 2 CTAs
2. **Verdict sidebar** (`#verdictMiniScores`) — 4 mini dimension bars rendered by `renderMiniScores()`
3. **Scorecard** (`#scoreRows`) — rendered by `renderScores()` from `SCORES[]`, each row now includes: name + definition + **score reason** (left-border paragraph explaining the specific why) + progress bar + level badge
4. **Recruiter Lens** — static HTML: avatar, criteria table (`#criteriaRows` rendered by `renderCriteria()` from `CRITERIA[]`), overall assessment quote, "compared to candidates who pass" list
5. **Coach Lens** — static HTML: diagnosis block (warm-soft bg), quick wins list, pattern box (accent-soft bg)
6. **Priority Repair** — links to weakest Q in Tab 2 via `scrollToQ(i)` + `switchTab('questions')`

### Tab 2 — Question Review

Rendered by `renderQCards()` from `QUESTIONS[]`. Each `.q-card` contains:

- Header row: colored dot + Q number + title + level badge (Strong / Medium / Weakest)
- Intent line (what the question tests)
- **Answer text** — plain body font (`--ink-soft`, 14px, 1.7 line-height), no label, no quotes, no italic
- **Views grid** (2-col): Recruiter View | Coach View — each with targeted feedback referencing the user's actual words
- Action row: Re-practice / Polish my answer / Save to Question Bank (buttons not yet wired)

### Data arrays (static demo data, will be replaced by real session data)

```js
SCORES[]    // { name, desc, reason, pct, level }
CRITERIA[]  // { name, signal }
QUESTIONS[] // { id, title, level, intent, transcript, recruiter, coach, polish }
```

---

## 5. `server.js` — Backend

Pure Node.js, no dependencies.

| Route | Handler | Notes |
|---|---|---|
| `GET *` | `serveFile()` | Serves from `demo-mvp/public/` |
| `POST /api/chat` | `handleChat()` | OpenAI Responses API; falls back to `localInterviewReply()` if no key |
| `POST /api/stt` | `handleSTT()` | Accepts `{ audioBase64, mimeType }`, calls Whisper transcription API |
| `POST /api/tts` | `handleTTS()` | Accepts `{ text }`, returns `audio/mpeg` |

**LLM response format** (structured output):
```json
{ "followUp": "", "recruiterLens": "", "coachTip": "", "polish": "", "nextAction": "follow_up|next_question|end_round" }
```

---

## 6. What's done vs. not done

### Done ✓

- Full visual flow: setup → incoming call → live interview → ending overlay → feedback
- Feedback page two-tab layout (Overview + Question Review)
- Verdict banner with Hire Signal + overall score + dimension mini bars
- Scorecard with 4 dimensions, progress bars, level badges, **score reasons**
- Recruiter Lens with criteria table + benchmark comparison
- Coach Lens with diagnosis + quick wins + pattern box
- Priority Repair panel with cross-tab scroll link
- Q cards: plain answer text, targeted Recruiter/Coach views, 3 action buttons
- Unified design token system across both pages (zero bare hex in CSS)
- Offline fallback mode (no API key needed for flow demo)
- `sessionStorage` plumbing between pages

### Not done / P1

- **Feedback page reads real session data** — `SCORES`, `CRITERIA`, `QUESTIONS` are still static demo arrays; need to be derived from `sessionStorage.turns` via a scoring function
- **PDF resume upload** — UI entry exists, parsing not implemented
- **"Polish my answer" button** — needs a modal or inline expand showing the `polish` field
- **"Re-practice this question"** — needs to re-enter live interview at a specific question
- **"Save to Question Bank"** — no persistence layer yet
- **Interviewer persona generation** — currently hardcoded "Ava Chen / Leo Martin"; should be generated from user's JD input

### Not doing in MVP (out of scope per PRD)

- User accounts / auth
- Multi-session history
- Progress dashboard
- Video analysis
- Paid tier

---

## 7. Known issues

1. `color-mix()` in `.bar` gradient (`index.html:623`) — not supported in Safari < 16.4. Low priority (visual only).
2. Tab 2 Q cards use `level: 'weakest'` but the level badge system in the scorecard uses `strong / developing / gap` — these are two separate rating scales. When wiring real session data, decide which scale the Q-level badge should use.
3. `#incoming` section is inside the `#setup` panel's parent `<section class="layout">` — when switching to `body.live-mode` the layout collapses. This works but the DOM structure is brittle; worth cleaning up before adding more states.

---

## 8. Next session priorities

1. **Wire real session data to feedback page** — write a `scoreSession(turns)` function that computes `SCORES`, `CRITERIA`, `QUESTIONS` from the actual `sessionStorage` turns array
2. **"Polish my answer" expand** — inline expand on the Q card (toggle `.hidden` on a `polish-block` div)
3. **PDF upload** — use PDF.js or a simple `/api/parse-pdf` server endpoint to extract text into the resume textarea
