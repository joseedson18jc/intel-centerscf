  // ========== PILOT DATA + CONFIGURABLE PARAMETERS ==========
  let W = 12, SPEND = 6000, BASE_SUP = 300;
  const TENOR = 75;
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
    const tenor = (typeof G !== "undefined" ? G.tenor : TENOR);
    const spPct = (typeof G !== "undefined" ? G.spread : 1.2) / 100;
    D.bal = D.spend.map((s, i) => +(SPEND * s / 100 * D.util[i] / 100 * tenor / 365).toFixed(1));
    rev = D.bal.map(b => +(b * spPct).toFixed(1));
    KPIS.forEach(m => { m.series = m.k === "rev" ? rev : D[m.k]; });
  }

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

