# OfferUp

OfferUp is an interview training product for non-native technology candidates. The current MVP focuses on one complete practice loop: configure a target role, run a short mock interview, and review the answers afterward.

## Product Areas

- Home / Dashboard: entry point for practice, recent rounds, saved answers, and next recommended action.
- Practice: setup, live mock interview, and round review.
- Question Bank: saved questions, polished answers, answer skeletons, and role/company tags.
- Materials: reusable resume, target JD, project stories, and role preferences.
- Progress: past rounds, weak areas, and improvement signals over time.

## Current Structure

```text
.
├── docs/
│   └── product/
│       ├── mvp-prd.md
│       ├── mvp-plan-aha.md
│       ├── product-brief-en.md
│       ├── semester-project-ai-interview.md
│       └── ui-style.md
├── prototypes/
│   ├── calm-ui.html
│   └── calm-ui.svg
└── demo-mvp/
    ├── API-SETUP.md
    ├── OPENAI_CONFIG_TEMPLATE.txt
    ├── server.js
    └── public/
        ├── index.html
        └── feedback.html
```

## MVP Flow

```text
Home / Setup -> Live Mock Interview -> Round Review -> Next Round or Question Bank
```

`demo-mvp/public/index.html` currently contains the setup and live practice flow. `demo-mvp/public/feedback.html` contains the round review. The next structural step is to split shared styles, speech logic, API calls, and interview flow state into separate files under `demo-mvp/src/`.

## Run Locally

```bash
PORT=8790 node demo-mvp/server.js
```

Then open:

```text
http://127.0.0.1:8790/
```
