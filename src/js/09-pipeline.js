  // ========== ANCHOR PIPELINE (STEP 3): SIZING MODEL OVER THE ACTIVE DATASET ==========
  const SRC = {
    linea:["https://www.bloomberglinea.com.br/2025/07/08/empresas-brasileiras-estao-mais-globais-e-isso-demanda-mais-servicos-diz-citi/","Bloomberg Línea, 08/07/2025"],
    citiProd:["https://corporateportal.brazil.citibank.com/produtos-servicos/credito-financiamento/antecipacao-fornecedor-risco-sacado/","Citi Brasil · Risco Sacado"],
    citiPdf:["https://www.citigroup.com/rcs/citigpa/storage/public/icpublic/taking-a-holistic-view-of-supplier-payments.pdf","Citi · Holistic View of Supplier Payments"],
    jbs:["https://ir.jbsglobal.com/","JBS IR · 3T26 (09/nov/2026)"],
    mbrf:["https://ri.mbrf.com/","MBRF RI · 3T26 (12/nov/2026)"],
    vot:["https://www.votorantim.com.br/","Votorantim / V. Cimentos · 3T26 (nov/2026)"],
    emb:["https://embraer.com/media-center/pt/?mediatype=NEWS&detail=33864","Embraer · 3T26 (10/nov/2026)"],
    embEst:["https://www.estadao.com.br/einvestidor/cenarios-e-mercado/embraer-tem-queda-no-lucro-mas-receita-recorde-de-r-121-bilhoes-e-projecoes-surpreendem-no-3t26/","Estadão E-Investidor · Embraer 3T26"],
    nat:["https://ri.natura.com.br/","Natura RI · 3T26 (nov/2026)"],
    // 2025 full-year sources used by the "v13" dataset
    jbs25:["https://agfeed.com.br/negocios/jbs-bate-recorde-de-receita-e-lucro-em-2025-apesar-de-pressao-no-negocio-de-bovinos-nos-eua","AgFeed · JBS 2025"],
    mbrf25:["https://forbes.com.br/forbes-agro/2026/03/mbrf-tem-lucro-de-r-358-milhoes-em-2025-e-projeta-vantagem-logistica-no-oriente-medio/","Forbes · MBRF 2025"],
    vot25:["https://investnews.com.br/negocios/votorantim-resultado-2025/","InvestNews · Votorantim 2025"],
    emb25:["https://www.panrotas.com.br/aviacao/empresas/2026/03/embraer-registra-receita-recorde-em-2025-e-projeta-alta-nas-entregas-em-2026_226650.html","Panrotas · Embraer 2025"],
    nat25:["https://visnoinvest.com.br/news/12121/natura-natu3-registra-lucro-de-r-463-mi-em-2025","Visno · Natura 2025"],
    merger:["https://www.infomoney.com.br/mercados/novas-acoes-da-mbrf-fusao-entre-marfrig-e-brf-estreiam-na-b3-relembre-fusao/amp/","InfoMoney · fusão MBRF"],
    copom:["https://www.bcb.gov.br/content/copom/atascopom/Copom282-not20261104282.pdf","BCB · Ata Copom 282 (nov/2026)"],
    selic:["https://atlaspublico.com.br/bcb/noticias/copom-mantem-selic-em-13-75pct-ao-ano-por-unanimidade-e-ve-99107","Copom mantém Selic em 13,75%"],
    b3:["https://content.b3.com.br/wp-content/uploads/2025/12/B3-Ebook_Duplicatas_VF.pdf","B3 · e-book Duplicatas"],
    dup:["https://catracalivre.com.br/economize/duplicata-escritural-avanca-no-brasil-veja-o-que-muda-para-as-empresas-e-como-se-preparar/","Cronograma duplicata escritural"],
    dupAuth:["https://www.dgabc.com.br/noticia/4332379/cronograma-do-bc-para-duplicatas-escriturais-preve-implementacao-escalonada-ate-junho-de-2028","DGABC · B3, CERC e Núclea"],
    fidc:["https://neofeed.com.br/negocios/depois-da-crise-da-americanas-o-risco-sacado-tem-um-novo-dono-os-fidcs/","NeoFeed · risco sacado em FIDCs"],
    ref:["https://www.bcb.gov.br/content/publicacoes/ref/202304/RELESTAB202304-refPub.pdf","BCB · REF mai/2023"],
  };
  const src = k => `<a href="${SRC[k][0]}" target="_blank" rel="noopener">${SRC[k][1]}</a>`;
  const SELIC = 13.75;

  // Anchor rows live in 09a-datasets.js; this container is refilled in place by setDataset().
  const ANCHORS = dsRefill([], DS().anchors);
  const ACOL = ANCHORS.map(a => a.color);
  const DEF = {cov:50, adh:40, util:60, tenor:TENOR, spread:1.2};
  const G = {tenor:DEF.tenor, spread:DEF.spread};
  const P = ANCHORS.map(a => ({addr:a.addr, cov:DEF.cov, adh:DEF.adh, util:DEF.util}));
  const eligOf = i => ANCHORS[i].rev * P[i].addr / 100;
  const flowOf = (i, o = {}) => { const p = {...P[i], ...o}; return ANCHORS[i].rev * p.addr/100 * p.cov/100 * p.adh/100 * p.util/100; };
  const balOf  = (f, tenor = G.tenor) => f * 1000 * tenor / 365;
  const revOf  = b => b * G.spread / 100;
  const totals = () => {
    const flows = ANCHORS.map((_, i) => flowOf(i));
    const flow = flows.reduce((s, f) => s + f, 0);
    return {flows, flow, elig:ANCHORS.reduce((s, _, i) => s + eligOf(i), 0), bal:balOf(flow), rev:revOf(balOf(flow))};
  };

  function formulaHTML() {
    return [T("Eligible annual purchases","Compras anuais elegíveis"), T("Program coverage","Cobertura do programa"), T("Supplier adoption","Adesão dos fornecedores"), T("Discount utilization","Utilização da antecipação")]
      .map(s => `<span>${s}</span>`).join(" × ") + ` = <span class="res">${T("Potential annual discounting flow","Fluxo anual potencial de antecipação")}</span>`;
  }
  function renderPipeline() {
    $("formula").innerHTML = formulaHTML();
    const d = DS();
    const colLbl = {addr:I18N["pp.th.addr"], cov:I18N["pp.th.cov"], adh:I18N["pp.th.adh"], util:I18N["pp.th.util"]};
    const inp = (i, k, step, max) => `<input type="number" data-i="${i}" data-k="${k}" value="${P[i][k]}" min="0" max="${max}" step="${step}" aria-label="${esc(ANCHORS[i].name)} · ${esc(colLbl[k] ? L(colLbl[k]) : k)}">`;
    // Quarter line only where the dataset has a quarterly figure; otherwise name the reporting period.
    const revSub = a => a.q3 != null ? `${L(d.revTag)}: ${bn(a.q3, a.q3 < 15 ? 3 : 1)}` : T(`full year ${L(d.revTag)}`,`ano de ${L(d.revTag)}`);
    const asRep = T("Revenue notes on the cards quote the figures as reported by each company (BRL unless stated); the table converts them at the display rate.","As notas de receita das fichas citam os valores como divulgados por cada empresa (em reais, salvo indicação); a tabela os converte pela taxa de exibição.");
    $("pipe-rows").innerHTML = ANCHORS.map((a, i) => `<tr>
      <td><div class="anchor-cell">${brandBadge(a.id)}<span><b>${a.name}</b><small>${L(a.sector)}</small></span></div></td>
      <td title="${esc(L(a.revNote))}"><b>${bn(a.rev, 1)}</b><small class="rev-sub">${revSub(a)}</small></td>
      <td>${inp(i, "addr", 0.5, 100)}</td><td id="el-${i}"></td>
      <td>${inp(i, "cov", 5, 100)}</td><td>${inp(i, "adh", 5, 100)}</td><td>${inp(i, "util", 5, 100)}</td>
      <td><div class="flowcell"><span class="rank" id="rk-${i}"></span><div class="track"><div class="fill" id="fb-${i}" style="background:${a.color}"></div></div><b id="fl-${i}"></b></div></td>
      <td id="bl-${i}"></td><td id="rv-${i}"></td></tr>`).join("");

    $("pipe-detail").innerHTML = ANCHORS.map((a, i) => `<div class="card anchor-card">
      <div class="anchor-card-head">${brandBadge(a.id, "sm")}<div><h4>${a.name}</h4><small>${L(a.sector)}</small></div></div>
      <div class="anchor-kpis">
        <div><span>${T("Flow/yr","Fluxo/ano")}</span><b id="ac-fl-${i}">–</b></div>
        <div><span>${T("Balance","Saldo")}</span><b id="ac-bl-${i}">–</b></div>
        <div><span>${T("Spread/yr","Spread/ano")}</span><b id="ac-rv-${i}">–</b></div>
      </div>
      <dl>
        <dt>${T("Relationship evidence","Evidência de relacionamento")}</dt><dd>${T("Named as a client by Citi Corporate Banking heads, Jul 2025.","Citada como cliente pelos responsáveis do Corporate Banking do Citi, jul/2025.")} · ${src("linea")}</dd>
        <dt>${L(d.revCardLbl)}</dt><dd><span title="${esc(asRep)}">${L(a.q3Note)}</span> · ${src(a.src)}${datasetId === "q3" && a.id === "emb" ? " · " + src("embEst") : ""}</dd>
        <dt>${T("Where to look","Onde investigar")}</dt><dd>${L(a.look)}</dd>
        <dt>${T("Decisive check","Validação decisiva")}</dt><dd>${L(a.check)}</dd>
      </dl></div>`).join("") + (ccy === "USD" ? `<p class="as-rep">${asRep}</p>` : "");
    $("g-tenor").value = G.tenor; $("g-spread").value = G.spread;
    updatePipeline(false);
  }
  function updatePipeline(cascade = true) {
    const t = totals(), max = Math.max(...t.flows, 0.0001);
    const order = t.flows.map((f, i) => [f, i]).sort((a, b) => b[0] - a[0]).map(x => x[1]);
    t.flows.forEach((f, i) => {
      const b = balOf(f), r = revOf(b);
      $("el-" + i).textContent = bn(eligOf(i), 1); $("fl-" + i).textContent = bn(f);
      $("fb-" + i).style.width = (100 * f / max) + "%"; $("rk-" + i).textContent = "#" + (order.indexOf(i) + 1);
      $("bl-" + i).textContent = money(b); $("rv-" + i).textContent = moneyD(r);
      if ($("ac-fl-" + i)) { $("ac-fl-" + i).textContent = bn(f); $("ac-bl-" + i).textContent = money(b); $("ac-rv-" + i).textContent = moneyD(r); }
    });
    $("pt-elig").textContent = bn(t.elig, 1); $("pt-revenue").textContent = bn(ANCHORS.reduce((s, a) => s + a.rev, 0), 0);
    $("pt-flow").textContent = bn(t.flow); $("pt-bal").textContent = money(t.bal); $("pt-rev").textContent = moneyD(t.rev);
    if (cascade) {
      recomputeBook();
      updateKpis(week);
      forecast(week);
      mktSpread = Math.min(2.6, Math.max(0.6, G.spread));
      renderMarket();
      plan(week);
    }
  }
  function syncPipelineInputs() {
    document.querySelectorAll("#pipe-rows input").forEach(inp => { inp.value = P[+inp.dataset.i][inp.dataset.k]; });
    $("g-tenor").value = G.tenor; $("g-spread").value = G.spread;
    updatePipeline(true);
  }
  $("pipe-rows").addEventListener("input", e => {
    const t = e.target; if (!t.dataset.k) return;
    const v = Math.min(100, Math.max(0, parseFloat(t.value)));
    if (!isNaN(v)) { P[+t.dataset.i][t.dataset.k] = v; document.querySelectorAll("[data-preset]").forEach(b => b.classList.remove("active")); updatePipeline(true); }
  });
  $("g-tenor").oninput = e => { const v = parseFloat(e.target.value); if (v > 0 && v <= 360) { G.tenor = v; updatePipeline(true); } };
  $("g-spread").oninput = e => { const v = parseFloat(e.target.value); if (v >= 0 && v <= 10) { G.spread = v; updatePipeline(true); } };
  const PRESETS = { cons:{cov:35,adh:30,util:50,tenor:60,spread:1.0}, base:{cov:50,adh:40,util:60,tenor:75,spread:1.2}, stretch:{cov:65,adh:55,util:70,tenor:90,spread:1.4} };
  document.querySelectorAll("[data-preset]").forEach(btn => {
    btn.onclick = () => {
      const pr = PRESETS[btn.dataset.preset];
      ANCHORS.forEach((a, i) => Object.assign(P[i], {addr:a.addr, cov:pr.cov, adh:pr.adh, util:pr.util}));
      G.tenor = pr.tenor; G.spread = pr.spread;
      document.querySelectorAll("[data-preset]").forEach(b => b.classList.toggle("active", b === btn));
      syncPipelineInputs();
    };
  });
  $("pipeReset").onclick = () => document.querySelector('[data-preset="base"]').click();

