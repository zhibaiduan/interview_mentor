# OfferUp

OfferUp is an interview training product for non-native technology candidates. The MVP focuses on one complete practice loop: configure a target role, run a short mock interview, review the answers, polish selected answers, and save useful versions to Answer Bank.

## Current Development Contract

For new development, use these files as the source of truth:

```text
docs/HANDOFF.md
docs/README.md
docs/product_spec/
docs/offerup-design-system-preview.html
```

Do not use archived early PRDs or the old static demo as implementation authority. They remain available for context and visual memory only.

## Project Structure

```text
.
├── docs/
│   ├── README.md
│   ├── HANDOFF.md
│   ├── offerup-design-system-preview.html
│   ├── product_spec/          # Current authoritative product, design, tech, and implementation specs
│   └── archive/               # Historical references and design explorations
└── demo-mvp/                  # Historical runnable prototype; reference only, not production architecture
```

## Next Build Direction

The production rebuild should follow `docs/product_spec/OfferUp-Implementation-Plan.md`.

The intended production architecture is a new Next.js App Router app using Tailwind, Supabase, and shared OfferUp design tokens/components. The old `demo-mvp/` Node/static prototype should not be extended into the production app.

## Run Historical Prototype

```bash
PORT=8790 node demo-mvp/server.js
```

Then open:

```text
http://127.0.0.1:8790/
```
