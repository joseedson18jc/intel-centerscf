# Changelog

## 15.0.0 (2026-11-26): one page per step

Structure taken from the owner's reference redesign, on the neutral system layer (`94-system.css`). No function, number or data flow was removed or changed.

- Page head (`html/15-hero.html`, `css/95-shell.css`): the page title is now the title of the current step, with the step question and who uses it under it; the step-by-step / full-view switch sits on the right of the head. In the full view the title goes back to "Intel Center - SCF Team".
- Top bar: three quick actions on the right (assistant, Export, theme). Each one triggers the side-menu control it mirrors, so there is one code path per action.
- Steps 2, 3 and 4 open with a row of four numbers (`js/32-v15.js`), read from the same functions as the cards below (`fcModel`, `totals`, `engBands`, `engShareTotals`, `engSigGroups`), so they follow every control on the page. Step 1 now opens with its eight indicators, and the action plan comes right after them.
- Side menu: new "Sinal da semana" card with the most urgent live reading of the current step; clicking it opens that reading's calculation. Menu sections of step 1 follow the new order.
- On screens of 1100px and wider the four step tabs are hidden (the side menu is the navigation); they stay on tablets and phones, where the menu is a drawer. The step banner that repeated the title is visually hidden in step mode and kept in the full view.

## 14.5.0 (2026-11-26): clean layout on phone and desktop
- New last CSS layer `src/css/93-clean.css` (screen only): quieter borders and surfaces, no glows, no uppercase letter-spaced labels on the page, metadata as plain text instead of pills.
- The owner's notice moved from a full-width banner above the header to one quiet line under the title, next to the "Dados ilustrativos" badge (same text).
- Step cards show number, cadence and title; the description and "Quem usa" are dropped from the cards (the role and cadence stay in the line below them). The "Etapa n de 4" pill above each step title is hidden, since the top bar already shows it. The hero illustration is hidden.
- Phones: one-row top bar (menu, step, week buttons; the week slider is hidden, play and arrows cover it), step cards 2 x 2, KPI tiles 2 per row with the question and "Ver cálculo" hidden (the whole tile still opens the calculation), action-plan checkbox on the title row.
- Highlighted KPI tile is outlined instead of filled navy.

## 14.4.0 (2026-11-24): measured forecast range, Embraer base at the panel rate

- Forecast range (Step 2) is now built on the error the model actually made: root mean square of its past one-week-ahead errors (the backtest), with the reported forecast-error KPI / 2.2 counted as one more observation so weeks 1 and 2 still have a range; it grows with the square root of the weeks ahead. Before, the range was the reported KPI / 2.2, which was 2 to 3 times wider than the measured error in the early weeks and never missed a past projection (66 of 66). The measured range is 18% narrower in week 12 (±1.16% instead of ±1.41% for one week ahead; 13-week range R$ 608-661 m instead of R$ 602-667 m, pre-approval ask R$ 11 m instead of R$ 17 m; in week 4 the range is R$ 527-603 m instead of R$ 492-638 m) and contained 57 of 66 past projections (86%). The page prints the width and that hit rate next to the chart.
- The limit verdict, live insights, assistant answers, proofs and the exported context use the same range (`fcModel().e1`, `fcErr`, `bandCoverage`). The 8% governance tolerance still reads the reported KPI.
- Embraer annual base in the 3Q26 dataset: the US$ 8.5 bn guidance midpoint is converted at the panel rate (R$ 50.1 bn at 5.8889, was a fixed R$ 43.7 bn at the quarter's 5.14) and follows the FX field. Embraer flow goes from R$ 0.42 bn to R$ 0.48 bn; pipeline total R$ 3.29 bn of flow, R$ 677 m of balance, R$ 8.1 m of spread revenue. The quarter figure stays as published in reais.
- `tools/audit-numbers.mjs` follows the new range and also checks the range width, its hit rate and the pipeline totals: 2,798 checks, 0 mismatches.

## 14.3.1 (2026-11-24): numbers audit

- New `tools/audit-numbers.mjs`: recomputes the pilot book, the 8 KPIs and their weekly change, the forecast (3 scenarios x 3 horizons), the modelled range, the limit verdict and the one-week backtest for each of the 12 weeks, independently of the page code, and compares with what the page prints. 2,578 checks, 0 mismatches.
- Fixed: on load the adoption funnel showed the "with document AI" numbers while the "Before" tab looked selected; the tab is now written on every draw.

## 14.3.0 (2026-11-24): modern fintech finish

Visual direction set by the owner: minimal and quiet, in the family of Linear, Stripe and Mercury (`src/css/81-fintech.css`, after the polish layer).
- Neutral canvas without the decorative glow; hairline borders and a single faint shadow instead of layered blue shadows; no decorative gradients on cards.
- 12 px card radius; 8 px radius on actions and 6 px on chips, badges and inputs instead of pills; cards no longer lift on hover, the border darkens.
- Segmented controls as a grey well with a white selected chip; guidance and result messages as neutral cards with a thin accent.
- Quieter labels and a lighter page title so the numbers carry the page; tables without a tinted header band or sticky-column shadow.
- Kept: Early Money navy band, fonts and semantic colours; dark theme unchanged apart from radii.

## 14.2.0 (2026-11-24): design, chart and performance pass

**Design**
- New polish layer (`src/css/80-polish.css`, after the feature partials, before dark/print/responsive): 8/12/16/24/32 spacing rhythm, one type scale, softer card shadows, uniform table headers, one focus ring and one hover/pressed transition for every control.
- KPI tiles: larger value, unit no longer squeezed by the heading letter-spacing ("em aberto", "mi / ano"), question line reserves two lines so sparklines align across a row.
- Journey cards: number and cadence stacked, so the four headers wrap the same way.
- Lever chips wrap inside their column instead of running into the next one.
- Pipeline and competitor tables: money never breaks across two lines; the pipeline table fits 1440 px without sideways scroll.
- Empty containers show a shimmer placeholder; empty charts show a dashed message block.

**Cockpit and data**
- Forecast chart redrawn: gradient area and band, light dashed grid, limit label with a halo, end-of-horizon value label that moves out of the way of the limit line, and a hover/tap guide over the whole plot (week, value, range, % of limit). The tooltip flips below the point near the top edge.
- "Closing balance by scenario" bars share one scale with the approved limit (red mark, % of limit, over-limit in red) instead of an unanchored bar.
- KPI sparklines: gradient fill, constant stroke width, round end dot.
- Quarter revenue in the pipeline uses one decimal for every anchor (was three for Embraer).
- Share donut: centre text fits the hole (base value moved to a short third line).
- Backtest shows an explicit empty state on week 1.

**Performance**
- Editing a pipeline input no longer recomputes the pilot book, KPIs and forecast (they do not depend on it).
- Levers, dataset bars and side-menu labels rebuild only when their inputs change.
- Header metrics write CSS variables only on change; scroll progress uses `transform` in one animation frame.
- Pulsing dots animate `transform`/`opacity` on a pseudo-element instead of `box-shadow`.

## 14.1.0 (2026-11-23): Early Money design system applied

- Brand fonts embedded (Inter and Plus Jakarta Sans, Latin subset, SIL OFL 1.1): same typography on every device, still no network request.
- Top bar and side-menu header use the one brand gradient (fixed navy, white text, sky accent) in both themes; week control restyled for it.
- Tokens completed (`--tint`, `--cyan`, `--red-bg`, `--green-bg`, spacing, `--radius-pill`, safe areas, `--brand-grad`); range sliders, touch sizes and component paddings follow the design system.
- Product mark as favicon.
- Kept on purpose: left side menu instead of the design system's top navigation and bottom tab bar; `green`, `amber` and `subtle` one shade darker than the design system so small text keeps 4.5:1.

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
- Left sidebar menu by section (steps, tools, preferences), collapsible to icons, drawer on phones
- Quick tutorial on every load (add `?notour` to the URL to skip it), dismissible tip per step, field hints
- Quarter countdown and data-source line moved from the hero to the left menu
- Open Finance wordmark; brand "Early Money"; title "Intel Center - SCF Team"
- System font stack (no external font request); the file makes no network call unless a Claude key is used
- API test explains the cause when the page cannot reach the API (offline, embedded preview, blocked)
- Wording pass: example data, working hypotheses and fabricated market figures labelled where they
  appear; "audited/verified" wording replaced by what the page actually does (reproduces the arithmetic)

**Fixed**
- Tour card, guide menu and assistant footer kept clear of a host badge pinned to the bottom-right corner
  (the tour could not be advanced on phones and tablets on the hosted site)
- Review pass: limit verdicts named by scenario, physical ceiling of the book, NaN guards, per-dataset restore,
  field clamping, CSV maxima, market figures relabelled as illustrative, invented positions removed, deck layout,
  keyboard and contrast fixes
- Parameter fields that did nothing until a CSV was loaded
- Decimal handling in CSV import
- Proofs and forecast notes showing pipeline tenor and spread for the pilot book
- Hard-coded FX rate, slide count and supplier base in several texts
- Step navigation leaving the chosen step below the fold on phones
