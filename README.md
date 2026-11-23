# SCF weekly cockpit (risco sacado)

A weekly cockpit for a supply chain finance (risco sacado) specialist: programme health, whether the
projected balance fits the approved limit, which anchor to prioritise next, and a market view.
Bilingual (Portuguese and English), BRL and USD, light and dark.

**Everything in it is example data, working hypotheses or figures labelled as fabricated. It is a
personal prototype by José Edson Matos da Costa. It is not a bank product and contains no bank data.**

> Em português: cockpit semanal do especialista de risco sacado. Abra `dist/index.html` com dois
> cliques. Todos os números são dados de exemplo, hipóteses de trabalho ou números marcados como
> fabricados. Protótipo pessoal, sem dados de banco.

## Use it

Open `dist/index.html` in a browser. No server, no install, no network access needed.

| Where | What it does |
|---|---|
| Step 1, Diagnose | Weekly action plan generated from the numbers, KPIs with the calculation behind each card, alerts, onboarding funnel and levers per funnel step |
| Step 2, Forecast | Balance forecast by scenario and horizon, checked against the approved limit |
| Step 3, Pipeline | Five anchors, editable hypotheses, estimated credit and revenue |
| Step 4, Market | Funder matrix, pricing band, share and signals (fabricated figures), product reference |
| Live insights | Up to three readings at the top of each step, recomputed on every change |
| Assistant (`/`) | Answers questions from the numbers on screen with a rule engine that runs in the page. Optionally asks Claude with your own API key |
| Data | Edit programme parameters, FX rate and the weekly series on screen, or import and export CSV |
| Guide | First-run tour, a tip per step, hints on the main controls |
| Present | Slide deck built from the same numbers |

What you change is saved in this browser (`localStorage`) and restored on the next visit.
"Restore defaults" in the Data window clears it.

### Datasets

Step 3 and Step 4 have two selectable datasets: `q3` (default; public-company figures entered by the
author from 3Q26 releases, verify before use) and `v13` (the earlier set). The pilot programme data
(weekly series, funnel, deciles, alerts) is the same in both.

### Optional: ask Claude

The assistant works offline with the rule engine. If you save an Anthropic API key in Settings, it can
also send your question and a snapshot of the dashboard to the API. The key stays in this browser's
`localStorage`, readable by anyone using the same browser profile, so treat this as personal demo use.
Model answers are labelled and should be checked against the panel.

## Develop

```
node tools/build.mjs     # src/ -> dist/index.html (plain Node, no dependencies)
node tools/smoke.mjs     # headless browser check (needs Playwright with Chromium)
```

Source layout, load order and the rules every module follows are in
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). In short: `src/manifest.json` lists every partial in
load order; CSS, HTML and JS partials are concatenated into one self-contained file; all JS shares one
closure; feature modules redraw through `onRefresh()` and plug into the page through named slots.

```
src/css/   styles, one partial per area         src/html/        page sections and windows
src/js/    modules, numbered in load order      src/html/slots/  feature blocks injected at slots
tools/     build and smoke test                 legacy/          the two original single-file versions
```

`dist/index.html` is committed so the repository can be served as is (for example with GitHub Pages).

See [CHANGELOG.md](CHANGELOG.md) for what came from each earlier version.
