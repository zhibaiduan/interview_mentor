# OfferUp Documentation Map

This folder separates current source-of-truth specs from historical reference material.

## Read First

- `HANDOFF.md` — latest project state, locked decisions, and next action.
- `product_spec/OfferUp-Implementation-Plan.md` — production rebuild order.
- `product_spec/OfferUp-MVP-PRD.md` — master MVP product requirements.
- `product_spec/OfferUp-MVP-Scope-Lock.md` — locked scope boundaries and key product decisions.
- `product_spec/OfferUp-Tech-Architecture.md` — technical architecture, routes, data model, RLS, AI workflows.
- `product_spec/OfferUp-Design-System.md` — authoritative UI system and implementation contract.
- `offerup-design-system-preview.html` — visual review page for the design system.

## Current Source Of Truth

All future development should reference `product_spec/` first. The specs are split by responsibility:

| Area | Primary files |
|---|---|
| Product scope | `OfferUp-MVP-PRD.md`, `OfferUp-MVP-Scope-Lock.md`, `OfferUp-Pre-Development-Readiness-Checklist.md` |
| Module behavior | `OfferUp-Setup-Page-Spec.md`, `OfferUp-Interview-Session-Spec.md`, `OfferUp-Feedback-Module-Spec.md`, `OfferUp-Answer-Polish-Spec.md`, `OfferUp-Answer-Bank-Spec.md`, `OfferUp-Auth-Spec.md`, `OfferUp-Dashboard-Spec.md` |
| AI and data | `OfferUp-Agent-Design.md`, `OfferUp-Tech-Architecture.md`, `OfferUp-Demo-Scenario.md` |
| Design | `OfferUp-Design-System.md`, `offerup-design-system-preview.html` |
| Evaluation | `OfferUp-Product-Evaluation-Metrics.md` |
| Execution | `OfferUp-Implementation-Plan.md`, `OfferUp-Workplan-And-Refactor-Roadmap.md` |

## Reference Only

- `../demo-mvp/` — runnable historical prototype. Useful for understanding the earlier flow and landing direction, but not the production architecture.
- `archive/early-product-specs/` — old PRDs and product briefs created before the OfferUp scope lock.
- `archive/design-explorations/` — setup-flow UI explorations.
- `archive/prototypes/` — old static visual prototypes.
- `archive/external-design-references/` — external design-md inspiration material.

## Development Rule

When specs conflict, prefer this order:

1. `HANDOFF.md` for latest status and locked decisions.
2. `OfferUp-Pre-Development-Readiness-Checklist.md` for resolved consistency decisions.
3. `OfferUp-MVP-Scope-Lock.md` and `OfferUp-MVP-PRD.md` for product scope.
4. Module specs for page-level behavior.
5. `OfferUp-Tech-Architecture.md` for implementation structure and database rules.
6. `OfferUp-Design-System.md` for UI tokens, components, and visual constraints.

Archived files should never override current specs.
