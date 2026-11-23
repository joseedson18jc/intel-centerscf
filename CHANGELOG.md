# Changelog

## 14.0.0 (2026-11-23): unified, modular version

Merges two single-file versions (kept untouched under `legacy/`).

**Kept from the uploaded fork** (`legacy/uploaded-fork_risco-sacado-cockpit_final.html`)
- Four-step journey with step-by-step and full views, proof windows on KPI cards, briefing, slide deck
- Parameter-suggestion flow with the Claude API, settings window
- 3Q26 dataset for pipeline and market, FX default 5.8889 (owner's decision: default)

**Kept from v13** (`legacy/v13_produtos_citi.html`)
- Rule engine that answers questions from the dashboard's own numbers, offline
- Levers per funnel step, product reference, Open Finance demo window
- Action-plan rules (red-signal rule, pricing rule, up to seven actions)
- The v13 pipeline and market dataset, selectable

**New**
- Source split into CSS, HTML and JS partials with a manifest, a build script and a browser smoke test
- Programme parameters, pilot tenor and spread, and FX rate editable live; on-screen weekly data grid;
  stricter CSV import with row and column in each error; CSV export; saved state with restore defaults
- Pilot assumptions separated from pipeline assumptions
- Dataset switch for Steps 3 and 4
- Live insights at the top of each step
- One assistant panel: rule engine by default, Claude optional; every suggested parameter change is
  validated against allowed ranges, shown before and after, accepted one by one, and undoable
- First-run tour, dismissible tip per step, field hints, compact header on phones
- Wording pass: example data, working hypotheses and fabricated market figures labelled where they
  appear; "audited/verified" wording replaced by what the page actually does (reproduces the arithmetic)

**Fixed**
- Parameter fields that did nothing until a CSV was loaded
- Decimal handling in CSV import
- Proofs and forecast notes showing pipeline tenor and spread for the pilot book
- Hard-coded FX rate, slide count and supplier base in several texts
- Step navigation leaving the chosen step below the fold on phones
