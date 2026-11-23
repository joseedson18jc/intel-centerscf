  // ========== PILOT DATA + CONFIGURABLE PARAMETERS ==========
  let W = 12, SPEND = 6000, BASE_SUP = 300;
  const TENOR = 75; // default average days discounted (also the pipeline default in 09-pipeline)
  // Pilot programme assumptions. They belong to the pilot book only (Steps 1 and 2) and are independent
  // of the pipeline assumptions G (Step 3): changing a pipeline preset never rewrites the pilot history.
  const PILOT = { tenor: 75, spread: 1.2 };
  // Accepted range of each editable programme parameter (spend in BRL bn, tenor in days, spread in % p.a.).
  const PARAM_RANGE = { spend:[0.1, 500], base:[10, 50000], tenor:[1, 360], spread:[0, 10], fx:[FX_MIN, FX_MAX] };
  const clampNum = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  let appReady = false; // set by 99-boot after the first render
  const D = {
    spend:   [52,53,54,55,56,57,57,58,59,59,60,60],
    active:  [40,44,51,60,72,85,97,110,121,133,142,150],
    util:    [58,59,60,61,62,64,65,66,67,68,69,70],
    days:    [21,21,20,19,16,14,13,12,11,10,9,9],
    err:     [9.8,9.1,8.4,7.9,7.0,6.1,5.5,4.9,4.2,3.8,3.4,3.1],
    sow:     [34,35,36,37,39,40,42,43,45,46,47,48],
    flags:   [5,4,6,3,3,2,2,3,1,2,1,1],
    supShare:[28,28,29,30,31,32,33,34,35,35,36,37],
  };
  let rev = [];
  const DEMO = JSON.parse(JSON.stringify(D));
  function recomputeBook() {
    D.bal = D.spend.map((s, i) => +(SPEND * s / 100 * D.util[i] / 100 * PILOT.tenor / 365).toFixed(1));
    rev = D.bal.map(b => +(b * PILOT.spread / 100).toFixed(1));
    KPIS.forEach(m => { m.series = m.k === "rev" ? rev : D[m.k]; });
  }
  // The supplier base can never be smaller than the largest number of active suppliers in the weekly data.
  const minBase = () => Math.max(PARAM_RANGE.base[0], Math.ceil(Math.max(0, ...D.active)));
  // Full re-render after a parameter or data change made outside the core render paths.
  // setCcy(ccy, true) is the existing "redraw everything that shows money" path (pipeline, market, week view,
  // open deck / proof / briefing); KPI tiles are rebuilt because their unit shows the supplier base.
  function refreshAll() {
    if (!appReady) return;
    recomputeBook();
    buildKpis();
    srcChip();
    setCcy(ccy, true);
  }
  // Bridge for FX wording owned by other partials (hero badge, closing note, currency switch tooltip):
  // keeps them in line with the editable rate until those partials call fxLabel() themselves.
  function syncFxTexts() {
    const badge = $("fxBadge"); if (badge) badge.textContent = fxLabel();
    const note = $("csNote");
    if (note && ccy === "USD") note.textContent = T(`Projected balance at the selected horizon, in millions of USD (${fxLabel(true)}, rate entered in the panel).`,`Saldo projetado no horizonte escolhido, em milhões de dólares (${fxLabel(true)}, câmbio informado no painel).`);
    document.querySelectorAll(".ccy-switch").forEach(e => { e.title = fxLabel(); });
  }
  onRefresh(syncFxTexts);

  const KPIS = [
    {k:"spend",  lbl:["Spend under program","Gasto sob o programa"], q:["Are we capturing the anchor's flows?","Estamos capturando os fluxos da âncora?"], d:0, u:["%","%"], good:1},
    {k:"active", lbl:["Active suppliers","Fornecedores ativos"],     q:["Is adoption growing?","A adesão está crescendo?"], d:0, u:() => `/ ${BASE_SUP}`, good:1, hl:true},
    {k:"util",   lbl:["Utilization","Utilização"],                   q:["Do suppliers actually use it?","Os fornecedores usam de fato?"], d:0, u:["%","%"], good:1},
    {k:"days",   lbl:["Days to first discount","Dias até o 1º desconto"], q:["Is onboarding fast enough?","O cadastro é rápido o suficiente?"], d:0, u:["days","dias"], good:-1},
    {k:"rev",    lbl:["Spread revenue","Receita de spread"],         q:["Is the book growing profitably?","A carteira cresce com rentabilidade?"], d:1, u:["m / yr","mi / ano"], good:1},
    {k:"err",    lbl:["Forecast error","Erro de projeção"],          q:["Are we predictable?","Somos previsíveis?"], d:1, u:["%","%"], good:-1},
    {k:"sow",    lbl:["Share of wallet","Share of wallet"],          q:["Are we winning share?","Estamos ganhando participação?"], d:0, u:["%","%"], good:1},
    {k:"flags",  lbl:["Risk flags","Alertas de risco"],              q:["Is growth safe?","O crescimento é seguro?"], d:0, u:["open","em aberto"], good:-1},
  ];
  const unitOf = m => typeof m.u === "function" ? m.u() : L(m.u);

  // Cancellable animation tweener (eliminates race conditions!)
  const ease = t => 1 - Math.pow(1 - t, 3);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rafMap = new Map();
  function tween(key, from, to, ms, cb) {
    if (rafMap.has(key)) cancelAnimationFrame(rafMap.get(key));
    if (reduce || Math.abs(to - from) < 0.001) { cb(to); return; }
    const t0 = performance.now();
    const tick = now => {
      const p = Math.min(1, (now - t0) / ms);
      cb(from + (to - from) * ease(p));
      if (p < 1) rafMap.set(key, requestAnimationFrame(tick));
      else rafMap.delete(key);
    };
    rafMap.set(key, requestAnimationFrame(tick));
  }
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const a in attrs) e.setAttribute(a, attrs[a]); if (parent) parent.appendChild(e); return e; };

