  // ========== ANCHOR PIPELINE (STEP 3 — UPDATED TO 3T26 / NOV 2026) ==========
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

  const ANCHORS = [
    {id:"jbs", name:"JBS", color:"#C8102E", src:"jbs", q3:116.8, rev:467.2,
      q3Note:["3Q26: R$116.8bn (US$22.7bn, +0.6% YoY USD · −5.1% BRL); leverage 3.54× (USD)","3T26: R$ 116,8 bi (US$ 22,7 bi, +0,6% a/a USD · −5,1% BRL); alavancagem 3,54× (USD)"],
      revNote:["3Q26 R$116.8bn (US$22.7bn) → R$467.2bn annualized","3T26 R$ 116,8 bi (US$ 22,7 bi) → R$ 467,2 bi anualizado"],
      addr:2.0, sector:["Protein & food","Proteína e alimentos"],
      look:["Packaging, ingredients, maintenance and industrial services in Brazil.","Embalagens, ingredientes, manutenção e serviços industriais no Brasil."],
      check:["Which group buying entities would join, eligible payables and accepted categories. Monitor 3Q26 leverage (3.54× USD).","Quais compradoras do grupo participariam, contas a pagar elegível e categorias aceitas. Monitorar alavancagem do 3T26 (3,54× USD)."]},
    {id:"mbrf", name:"Marfrig (MBRF)", color:"#006B3F", src:"mbrf", q3:41.424, rev:165.7,
      q3Note:["3Q26: R$41.424bn (−0.8% YoY, +1.7% QoQ); net income R$210m (+123.5%); leverage 3.45×","3T26: R$ 41,424 bi (−0,8% a/a, +1,7% t/t); lucro R$ 210 mi (+123,5%); alavancagem 3,45×"],
      revNote:["3Q26 R$41.424bn → R$165.7bn annualized (post-merger)","3T26 R$ 41,424 bi → R$ 165,7 bi anualizado (pós-fusão)"],
      addr:3.5, sector:["Multi-protein food","Alimentos multiproteína"],
      look:["Recurring suppliers of industrial inputs, packaging and services across combined MBRF entities.","Fornecedores recorrentes de insumos industriais, embalagens e serviços na base combinada MBRF."],
      check:["Post-merger Marfrig + BRF perimeter (net debt R$45.7bn, 3.45× in 3Q26): unify payables and avoid double counting.","Perímetro pós-fusão Marfrig + BRF (dívida líq. R$ 45,7 bi, 3,45× no 3T26): unificar contas a pagar e evitar contagem dupla."]},
    {id:"vot", name:"Votorantim", color:"#0033A0", src:"vot", q3:16.3, rev:65.2,
      q3Note:["3Q26: R$16.3bn holding economic (+3% YoY; net cash R$8.4bn) · V. Cimentos R$8.5bn (Brazil R$4.2bn, 1.71×)","3T26: R$ 16,3 bi econômica holding (+3% a/a; caixa líq. R$ 8,4 bi) · V. Cimentos R$ 8,5 bi (Brasil R$ 4,2 bi, 1,71×)"],
      revNote:["3Q26 R$16.3bn holding economic (V. Cimentos R$8.5bn) → R$65.2bn annualized","3T26 R$ 16,3 bi econômica holding (V. Cimentos R$ 8,5 bi) → R$ 65,2 bi anualizado"],
      addr:9.0, sector:["Industrial holding","Holding industrial"],
      look:["Map opportunity by operating company (V. Cimentos, metals, energy), not as one group-level anchor.","Mapear oportunidade por empresa operacional (V. Cimentos, metais, energia), não como âncora única."],
      check:["Which CNPJ buys, which entity holds the Citi relationship and limit, and which units can join.","Qual CNPJ compra, qual entidade tem relacionamento e limite com o Citi e quais unidades podem aderir."]},
    {id:"emb", name:"Embraer", color:"#056DAE", src:"emb", q3:12.067, rev:43.7,
      q3Note:["3Q26 record: R$12.067bn (US$2.347bn, +17% YoY USD, 10 Nov 2026); 2026 guidance raised to US$8.4–8.6bn","Recorde 3T26: R$ 12,067 bi (US$ 2,347 bi, +17% a/a USD, 10/nov/2026); guidance 2026 elevado p/ US$ 8,4–8,6 bi"],
      revNote:["3Q26 record R$12.067bn (US$2.347bn) · 2026 guidance US$8.4–8.6bn (≈ R$43.7bn)","Recorde 3T26 R$ 12,067 bi (US$ 2,347 bi) · guidance 2026 US$ 8,4–8,6 bi (≈ R$ 43,7 bi)"],
      addr:8.0, sector:["Aerospace","Aeroespacial"],
      look:["Industrial suppliers, components, engineering and services — domestic receivables separated from exports.","Fornecedores industriais, componentes, engenharia e serviços — separando recebíveis domésticos dos internacionais."],
      check:["Which invoices are already approved and free of acceptance conditions; Q4 delivery ramp drives seasonal peak.","Quais títulos já estão aprovados e livres de condições de aceite; pico de entregas no 4T eleva sazonalidade."]},
    {id:"nat", name:"Natura", color:"#F47920", src:"nat", q3:5.038, rev:20.2,
      q3Note:["3Q26: R$5.038bn (−3.0% YoY; Brazil R$2.920bn, −9%); net income R$49m; leverage 1.83× w/ FIDC inflow","3T26: R$ 5,038 bi (−3,0% a/a; Brasil R$ 2,920 bi, −9%); lucro R$ 49 mi; alavancagem 1,83× com entrada de FIDC"],
      revNote:["3Q26 R$5.038bn (Brazil R$2.920bn) → R$20.2bn annualized","3T26 R$ 5,038 bi (Brasil R$ 2,920 bi) → R$ 20,2 bi anualizado"],
      addr:12.0, sector:["Beauty & personal care","Beleza e cuidados pessoais"],
      look:["Packaging, ingredients, contract manufacturing and recurring B2B services.","Embalagens, ingredientes, fabricação terceirizada e serviços B2B recorrentes."],
      check:["Eligible B2B purchase volume (not consultants or retail); watch Brazil supply availability & active FIDC usage.","Volume de compras B2B elegível (sem confundir com consultoras ou varejo); acompanhar abastecimento Brasil e uso de FIDC."]},
  ];
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
    const inp = (i, k, step, max) => `<input type="number" data-i="${i}" data-k="${k}" value="${P[i][k]}" min="0" max="${max}" step="${step}" aria-label="${ANCHORS[i].name} ${k}">`;
    $("pipe-rows").innerHTML = ANCHORS.map((a, i) => `<tr>
      <td><div class="anchor-cell">${brandBadge(a.id)}<span><b>${a.name}</b><small>${L(a.sector)}</small></span></div></td>
      <td title="${L(a.revNote)}"><b>${bn(a.rev, 1)}</b><small style="display:block;font-size:11px;color:var(--muted)">${T("3Q26","3T26")}: ${bn(a.q3, a.q3 < 15 ? 3 : 1)}</small></td>
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
        <dt>${T("3Q26 net revenue & 2026 base (public)","Receita líquida 3T26 & base 2026 (pública)")}</dt><dd>${L(a.q3Note)} · ${src(a.src)}${a.id === "emb" ? " · " + src("embEst") : ""}</dd>
        <dt>${T("Where to look","Onde investigar")}</dt><dd>${L(a.look)}</dd>
        <dt>${T("Decisive check","Validação decisiva")}</dt><dd>${L(a.check)}</dd>
      </dl></div>`).join("");
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

