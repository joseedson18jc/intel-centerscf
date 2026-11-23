  // ========== STEP 4: MARKET & COMPETITION (ALL 4 INTERACTIVE MODULES) ==========
  const FUNDERS = [
    {k:"itau", name:"Itaú BBA",        abbr:"IB",  col:"#EC7000", type:"bank"},
    {k:"brad", name:"Bradesco BBI",    abbr:"BR",  col:"#CC092F", type:"bank"},
    {k:"sant", name:"Santander",       abbr:"ST",  col:"#DC0000", type:"bank"},
    {k:"btg",  name:"BTG Pactual",     abbr:"BTG", col:"#001E62", type:"bank"},
    {k:"bb",   name:"Banco do Brasil", abbr:"BB",  col:"#003882", type:"bank"},
    {k:"fidc", name:"FIDCs (CVM)",     abbr:"FD",  col:"#0E8A5F", type:"fidc"},
    {k:"citi", name:"Citi",            abbr:"CT",  col:"#056DAE", type:"citi"}
  ];
  const COMP_DATA = [
    {id:"jbs", itau:420, brad:310, sant:260, btg:180, bb:290, fidc:240, citi:110, gap:360,
      iasTerms:["90–120d financed vs. 45–60d standard payables (IAS 7 Note · illustrative).","90–120d no risco sacado vs. 45–60d padrão (Nota IAS 7 · ilustrativo)."],
      cvmNote:["3 multi-originator FIDCs active in CVM filings; senior quotas priced around CDI + 1.45%.","3 FIDCs multicedentes ativos na CVM; cotas sênior perto de CDI + 1,45%."],
      play:["Target Brazil packaging & MRO entities where FIDC pricing is wider than bank balance sheet.","Atacar compradoras Brasil de embalagens e MRO onde o FIDC está mais caro que balanço bancário."]},
    {id:"mbrf", itau:280, brad:220, sant:190, btg:140, bb:210, fidc:195, citi:65, gap:250,
      iasTerms:["85–110d financed vs. 45–55d standard; post-merger Marfrig + BRF perimeter under unification.","85–110d no programa vs. 45–55d padrão; perímetro Marfrig + BRF em unificação."],
      cvmNote:["Legacy BRF & Marfrig FIDC pools overlap on packaging suppliers — consolidation window.","FIDCs legados de BRF e Marfrig se sobrepõem em embalagens — janela de consolidação."],
      play:["Propose unified post-merger onboarding with Document AI to win consolidated CNPJs.","Propor onboarding unificado pós-fusão com IA de documentos para capturar CNPJs consolidados."]},
    {id:"vot", itau:240, brad:195, sant:150, btg:110, bb:130, fidc:120, citi:85, gap:280,
      iasTerms:["75–105d across cement, metals & energy operating companies (decentralized notes).","75–105d nas operacionais de cimento, metais e energia (notas descentralizadas)."],
      cvmNote:["Selective FIDC usage in mid-tier subsidiaries; flagship V. Cimentos relies on core banks.","Uso seletivo de FIDCs em subsidiárias médias; V. Cimentos opera com bancos principais."],
      play:["Map buying CNPJs unit by unit and pitch expansion to 2 under-served operating companies.","Mapear CNPJs compradores por unidade e propor expansão em 2 operacionais subatendidas."]},
    {id:"emb", itau:145, brad:95, sant:110, btg:60, bb:120, fidc:55, citi:70, gap:165,
      iasTerms:["60–90d domestic industrial payables; export flows separated. Record 3Q26 R$12.067bn.","60–90d em compras industriais domésticas; exportação separada. Recorde 3T26 R$ 12,067 bi."],
      cvmNote:["Low FIDC reliance — preference for Tier-1 relationship banks with global trade capabilities.","Baixa dependência de FIDC — preferência por bancos Tier-1 com atuação global em trade."],
      play:["Differentiate with fast invoice-approval integration ahead of Q4 seasonal delivery peak.","Diferenciar com integração rápida de aceite antes do pico sazonal de entregas no 4T."]},
    {id:"nat", itau:125, brad:110, sant:90, btg:85, bb:50, fidc:140, citi:40, gap:145,
      iasTerms:["75–105d on B2B packaging, fragrances & contract manufacturing suppliers.","75–105d para fornecedores B2B de embalagens, fragrâncias e manufatura terceirizada."],
      cvmNote:["Active FIDC usage helped cut 3Q26 leverage to 1.83×; fast onboarding attracts mid-sized suppliers.","Uso ativo de FIDC ajudou a reduzir alavancagem 3T26 p/ 1,83×; cadastro ágil atrai médios."],
      play:["Win back FIDC-funded B2B suppliers via competitive CDI spread + frictionless Document AI.","Reconquistar fornecedores B2B financiados em FIDC combinando spread competitivo + IA de docs."]}
  ];
  const PRICE_TIERS = [
    {code:"AAA", anchors:["vot","emb"], min:0.75, med:1.05, max:1.35, fidc:1.30},
    {code:"AA+", anchors:["jbs"],       min:0.95, med:1.25, max:1.60, fidc:1.45},
    {code:"AA",  anchors:["mbrf"],      min:1.15, med:1.50, max:1.95, fidc:1.75},
    {code:"AA-", anchors:["nat"],       min:1.35, med:1.75, max:2.25, fidc:2.05}
  ];
  const RM_LOSS = [
    {lbl:["Spread / rate vs. peers & FIDCs","Spread / taxa vs. pares e FIDCs"], pct:42, col:() => C.navy},
    {lbl:["Onboarding & KYC friction","Atrito no cadastro e KYC"],            pct:26, col:() => C.red},
    {lbl:["Credit limit or tenor cap","Limite de crédito ou teto de prazo"],  pct:19, col:() => C.blue},
    {lbl:["ERP / registry integration lead time","Prazo de integração ERP / registradora"], pct:13, col:() => C.amber}
  ];
  const SHARE_DATA = [
    {id:"jbs",  citi:12, peers:44, fidc:14, free:30, reg:"b3",     regPct:78},
    {id:"mbrf", citi:8,  peers:42, fidc:17, free:33, reg:"cerc",   regPct:71},
    {id:"vot",  citi:14, peers:39, fidc:11, free:36, reg:"b3",     regPct:66},
    {id:"emb",  citi:16, peers:40, fidc:8,  free:36, reg:"nuclea", regPct:82},
    {id:"nat",  citi:10, peers:35, fidc:22, free:33, reg:"cerc",   regPct:69}
  ];
  const EXT_HEALTH = [
    {id:"jbs",  rating:"brAA+", outlook:["Stable","Estável"],   outCls:"pos", reg:"b3",     dupPct:78, stress:["Moderate","Moderado"],stCls:"neu", net:["Balanced","Equilibrado"],netCls:"neu"},
    {id:"mbrf", rating:"brAA",  outlook:["Positive","Positiva"],outCls:"pos", reg:"cerc",   dupPct:71, stress:["Moderate","Moderado"],stCls:"neu", net:["Tailwind","A favor"],   netCls:"pos"},
    {id:"vot",  rating:"brAAA", outlook:["Stable","Estável"],   outCls:"pos", reg:"b3",     dupPct:66, stress:["Low","Baixo"],        stCls:"pos", net:["Strong","Forte"],       netCls:"pos"},
    {id:"emb",  rating:"brAAA", outlook:["Positive","Positiva"],outCls:"pos", reg:"nuclea", dupPct:82, stress:["Low","Baixo"],        stCls:"pos", net:["Strong","Forte"],       netCls:"pos"},
    {id:"nat",  rating:"brAA−", outlook:["Watch","Observação"], outCls:"warn",reg:"cerc",   dupPct:69, stress:["Elevated","Atenção"], stCls:"warn",net:["Selective","Cautela"],  netCls:"warn"}
  ];
  const EXT_SIGNALS = [
    {id:"emb", route:"step3", sev:() => C.green, sources:["nuclea","bcb"],
      title:["Record 3Q26 revenue (R$12.067bn) + 2026 guidance raised to US$8.4–8.6bn","Receita recorde no 3T26 (R$ 12,067 bi) + guidance 2026 elevado p/ US$ 8,4–8,6 bi"],
      body:["Free cash flow guidance lifted to ≥US$700m alongside 82% Núclea electronic-duplicata readiness — strong credit case for limit expansion.","Projeção de FCL elevada para ≥ US$ 700 mi com 82% de prontidão na Núclea — cenário forte de crédito para ampliar limite."]},
    {id:"nat", route:"step1", sev:() => C.amber, sources:["cerc","cvm"],
      title:["3Q26 Brazil sales −9% (R$2.920bn) despite leverage falling to 1.83× w/ FIDC","Vendas Brasil −9% no 3T26 (R$ 2,920 bi), embora alavancagem tenha caído p/ 1,83× com FIDC"],
      body:["Returned to net profit (R$49m), but product-availability bottlenecks in Brazil warrant monitoring supplier cadence before scaling wave 2.","Reverteu prejuízo (lucro R$ 49 mi), mas gargalos de abastecimento no Brasil pedem atenção à cadência dos fornecedores antes da onda 2."]},
    {id:"mbrf", route:"step3", sev:() => C.blue, sources:["cerc","cvm"],
      title:["3Q26 net income +123.5% (R$210m) on R$41.424bn revenue; leverage at 3.45×","Lucro +123,5% no 3T26 (R$ 210 mi) com receita de R$ 41,424 bi; alavancagem em 3,45×"],
      body:["Post-merger Marfrig + BRF payables unification opens bankable headroom vs. legacy FIDCs; calibrate credit request against R$45.7bn net debt.","Unificação pós-fusão Marfrig + BRF abre espaço frente a FIDCs legados; calibrar pedido de crédito considerando dívida líquida de R$ 45,7 bi."]},
    {id:"jbs", route:"step3", sev:() => C.amber, sources:["b3","cvm"],
      title:["3Q26 revenue R$116.8bn (US$22.7bn) with 3.51× leverage; Beef NA back to positive EBITDA","Receita 3T26 R$ 116,8 bi (US$ 22,7 bi) com alavancagem 3,51×; Beef NA voltou ao EBITDA positivo"],
      body:["Cattle-cost pressure compressed EBITDA margin to 5.2%; B3 registrar trail (78%) strengthens collateral verification for credit requests.","Pressão do gado comprimiu margem EBITDA para 5,2%; trilha na B3 (78%) reforça lastro verificável no pedido de crédito."]},
    {id:"vot", route:"step1", sev:() => C.green, sources:["b3","bcb"],
      title:["3Q26 holding net cash R$8.4bn; V. Cimentos R$8.5bn revenue & 1.71× leverage","Caixa líquido holding R$ 8,4 bi no 3T26; V. Cimentos R$ 8,5 bi de receita e 1,71×"],
      body:["Strong balance sheet across operating companies; stage supplier campaigns by CNPJ/unit where ERP integration with B3 is complete.","Balanço sólido nas operacionais; fatiar campanhas por CNPJ/unidade onde a integração ERP com a B3 já está concluída."]},
    {id:"jbs", route:"step1", sev:() => C.red, sources:["b3","cerc"],
      title:["Cross-registrar double-pledge check active across B3 & CERC","Checagem anti-duplicidade ativa entre B3 e CERC"],
      body:["Real-time interoperability flags invoices already discounted in FIDC pools — feeds directly into Step 1 duplicate-invoice alerts.","Interoperabilidade em tempo real sinaliza duplicatas já cedidas a FIDCs — alimenta diretamente os alertas da Etapa 1."]}
  ];

  let mktSub = "all", compFilter = "all", selCompIdx = 0, ratingFilter = "all", mktSpread = 1.20, sigFilter = "all";
  const MKT_STATE = {above:[], bestWS:null};

  function updateMktSubnav() {
    document.querySelectorAll("#mktSubnav button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mmod === mktSub)));
    document.querySelectorAll("[data-mkt-panel]").forEach(p => { p.hidden = mktSub !== "all" && p.dataset.mktPanel !== mktSub; });
  }
  $("mktSubnav").addEventListener("click", e => { const b = e.target.closest("[data-mmod]"); if (!b) return; mktSub = b.dataset.mmod; updateMktSubnav(); });

  function renderCompetitors() {
    const visibleFunders = FUNDERS.filter(f => compFilter === "banks" ? (f.type === "bank" || f.type === "citi") : compFilter === "fidc" ? (f.type === "fidc" || f.type === "citi") : true);
    const lvlCls = v => v >= 260 ? "lvl-3" : v >= 140 ? "lvl-2" : "lvl-1";
    const headCols = visibleFunders.map(f => `<th><div class="funder-hd"><span class="funder-dot" style="background:${f.col}">${f.abbr}</span><span>${f.name}</span></div></th>`).join("");
    const bodyRows = COMP_DATA.map((row, idx) => {
      const a = ANCHORS[idx], total = FUNDERS.reduce((s, f) => s + (row[f.k] || 0), 0);
      const cells = visibleFunders.map(f => {
        const v = row[f.k] || 0;
        if (!v) return `<td><span class="mcell empty" aria-label="${T("None","Sem programa")}">—</span></td>`;
        if (f.k === "citi") return `<td><span class="mcell citi-cell">${money(v)}</span></td>`;
        return `<td><span class="mcell ${lvlCls(v)}">${money(v)}</span></td>`;
      }).join("");
      return `<tr data-cidx="${idx}" class="${idx === selCompIdx ? "selected" : ""}">
        <td><div class="anchor-cell">${brandBadge(a.id, "sm")}<span><b>${a.name}</b><small>${L(a.sector)}</small></span></div></td>
        ${cells}<td><b>${money(total)}</b></td><td><span class="mcell gap-cell">+${money(row.gap)}</span></td></tr>`;
    }).join("");
    const colTotals = visibleFunders.map(f => `<td>${money(COMP_DATA.reduce((s, r) => s + (r[f.k] || 0), 0))}</td>`).join("");
    const grandTotal = COMP_DATA.reduce((s, r) => s + FUNDERS.reduce((x, f) => x + (r[f.k] || 0), 0), 0);
    const totalGap = COMP_DATA.reduce((s, r) => s + r.gap, 0);
    $("compMatrix").innerHTML = `<thead><tr><th>${T("Anchor (click row for IAS 7 note)","Âncora (clique p/ nota IAS 7)")}</th>${headCols}<th>${T("Disclosed (IAS 7)","Divulgado (IAS 7)")}</th><th>${T("Citi headroom","Espaço Citi")}</th></tr></thead><tbody>${bodyRows}</tbody><tfoot><tr><td>${T("5-anchor total","Total 5 âncoras")}</td>${colTotals}<td>${money(grandTotal)}</td><td style="color:var(--green)">+${money(totalGap)}</td></tr></tfoot>`;

    const sel = COMP_DATA[selCompIdx], anc = ANCHORS[selCompIdx], selTot = FUNDERS.reduce((s, f) => s + (sel[f.k] || 0), 0), fidcPct = Math.round(sel.fidc / selTot * 100);
    $("iasDrawer").innerHTML = `
      <div><h4>${brandBadge(anc.id, "xs")}<span>${anc.name} · ${T("IAS 7 / IFRS 7 disclosure snapshot","Nota explicativa IAS 7 / IFRS 7")}</span></h4><p><strong>${money(selTot)}</strong> ${T("estimated total supplier finance balance","de saldo estimado de risco sacado")} (${fidcPct}% ${T("in CVM FIDCs","em FIDCs CVM")}). ${L(sel.iasTerms)}</p></div>
      <div><span class="lbl">${T("CVM FIDC filings","Informes FIDC · CVM")}</span><p>${L(sel.cvmNote)}</p></div>
      <div><span class="lbl">${T("Commercial play","Ação comercial recomendada")}</span><p><strong>+${money(sel.gap)}</strong> ${T("addressable headroom:","de espaço endereçável:")} ${L(sel.play)}</p></div>`;
  }
  $("compMatrix").addEventListener("click", e => { const tr = e.target.closest("tr[data-cidx]"); if (!tr) return; selCompIdx = +tr.dataset.cidx; renderCompetitors(); });
  $("compFilter").addEventListener("click", e => { const b = e.target.closest("[data-cf]"); if (!b) return; compFilter = b.dataset.cf; $("compFilter").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); renderCompetitors(); });

  function renderPricing() {
    $("mktSpreadSlider").value = mktSpread;
    $("mktSpreadVal").textContent = "CDI + " + nf(mktSpread, 2) + "%";
    const scaleMin = 0.50, scaleMax = 2.60, pos = v => Math.max(0, Math.min(100, (v - scaleMin) / (scaleMax - scaleMin) * 100));
    const aboveList = [];
    PRICE_TIERS.forEach(t => { if (mktSpread > t.max) t.anchors.forEach(id => aboveList.push(ANCHORS.find(a => a.id === id).name)); });
    MKT_STATE.above = aboveList;

    const tiers = PRICE_TIERS.filter(t => ratingFilter === "all" || t.code === ratingFilter);
    $("ratingBands").innerHTML = tiers.map(t => {
      const anchorsHtml = t.anchors.map(id => { const a = ANCHORS.find(x => x.id === id); return `${brandBadge(id, "xs")}<span>${a.name.split(" ")[0]}</span>`; }).join("");
      let vCls = "mid", vTxt = T("In market band","Na faixa de mercado");
      if (mktSpread <= t.med) { vCls = "win"; vTxt = T("Competitive · beats median","Competitivo · abaixo da mediana"); }
      else if (mktSpread > t.max) { vCls = "high"; vTxt = T("Above market · loss risk","Acima do mercado · risco de perda"); }
      else if (mktSpread > t.fidc) { vCls = "high"; vTxt = T("Wider than FIDC senior","Mais caro que FIDC sênior"); }
      return `<div class="rb-row"><div class="rb-top"><div class="rb-title"><span class="rb-code">br${t.code}</span><span class="rb-anchors">${anchorsHtml}</span></div><span class="verdict ${vCls}">${vTxt}</span></div>
        <div class="rb-track"><div class="rb-range" style="left:${pos(t.min)}%;width:${pos(t.max) - pos(t.min)}%"></div><div class="rb-med" style="left:${pos(t.med)}%" title="${T("Median","Mediana")}: CDI+${nf(t.med,2)}%"></div><div class="rb-fidc" style="left:${pos(t.fidc)}%" title="FIDC: CDI+${nf(t.fidc,2)}%"></div><div class="rb-citi" style="left:${pos(mktSpread)}%" title="Citi: CDI+${nf(mktSpread,2)}%"></div></div>
        <div class="rb-axis"><span>${T("Min","Mín")}: CDI + ${nf(t.min,2)}%</span><span>${T("Median","Mediana")}: <b>${nf(t.med,2)}%</b> · FIDC: <b style="color:var(--amber)">${nf(t.fidc,2)}%</b></span><span>${T("Max","Máx")}: CDI + ${nf(t.max,2)}%</span></div></div>`;
    }).join("");
    $("rmLossBars").innerHTML = RM_LOSS.map(r => `<div class="loss-row"><div class="loss-row-top"><span>${L(r.lbl)}</span><span>${r.pct}%</span></div><div class="track"><div class="fill" style="width:${r.pct}%;background:${r.col()}"></div></div></div>`).join("");
    $("rmLossNote").innerHTML = T(`<b>Insight:</b> 26% of lost deals stem from onboarding friction — fixing documents (Step 1) wins mandates even when spread matches median.`,`<b>Leitura:</b> 26% das perdas vêm de atrito no cadastro — destravar documentos (Etapa 1) ganha mandatos mesmo com spread na mediana.`);
  }
  $("mktSpreadSlider").oninput = e => { mktSpread = parseFloat(e.target.value); renderPricing(); plan(week); };
  $("ratingFilter").addEventListener("click", e => { const b = e.target.closest("[data-rt]"); if (!b) return; ratingFilter = b.dataset.rt; $("ratingFilter").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); renderPricing(); });

  function renderShareReal() {
    let totElig = 0, wCiti = 0, wPeers = 0, wFidc = 0, wFree = 0, bestWS = null;
    $("realShareRows").innerHTML = SHARE_DATA.map((s, i) => {
      const a = ANCHORS[i], elg = eligOf(i), freeAmt = elg * s.free / 100;
      totElig += elg; wCiti += elg * s.citi / 100; wPeers += elg * s.peers / 100; wFidc += elg * s.fidc / 100; wFree += freeAmt;
      if (!bestWS || freeAmt > bestWS.ws) bestWS = {name:a.name, ws:freeAmt};
      return `<div class="sh-item"><div class="sh-top"><div class="sh-left">${brandBadge(a.id, "sm")}<div><b>${a.name}</b><small>${T("Eligible payables","Contas a pagar elegíveis")}: ${bn(elg, 1)} / ${T("yr","ano")}</small></div></div><div class="sh-right">${INFRA_SVGS[s.reg]}<span>${s.regPct}% ${T("electronic","escritural")}</span></div></div>
        <div class="sh-stack"><div class="sh-seg" style="width:${s.citi}%;background:var(--bar-citi)">${s.citi}%</div><div class="sh-seg" style="width:${s.peers}%;background:var(--bar-peers)">${s.peers}%</div><div class="sh-seg" style="width:${s.fidc}%;background:var(--bar-fidc)">${s.fidc >= 10 ? s.fidc + "%" : ""}</div><div class="sh-seg free" style="width:${s.free}%">${s.free}%</div></div>
        <div class="sh-sub"><span>Citi: <b>${bn(elg * s.citi / 100, 2)}</b> (${s.citi}%)</span><span>${T("Unfinanced headroom","Espaço não financiado")}: <b style="color:var(--green)">${bn(freeAmt, 2)}</b> (${s.free}%)</span></div></div>`;
    }).join("");
    MKT_STATE.bestWS = bestWS;

    const pCiti = totElig ? wCiti / totElig * 100 : 0, pPeers = totElig ? wPeers / totElig * 100 : 0, pFidc = totElig ? wFidc / totElig * 100 : 0, pFree = totElig ? wFree / totElig * 100 : 0;
    const r = 68, circ = 2 * Math.PI * r;
    const segs = [{pct:pCiti, col:isDark() ? "#0284C7" : "#00205B"}, {pct:pPeers, col:isDark() ? "#2563EB" : "#056DAE"}, {pct:pFidc, col:"#D97706"}, {pct:pFree, col:C.freeSeg}];
    let offset = 0;
    const arcs = segs.map(sg => { const len = circ * sg.pct / 100, c = `<circle cx="90" cy="90" r="${r}" fill="none" stroke="${sg.col}" stroke-width="20" stroke-dasharray="${len.toFixed(2)} ${(circ - len).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 90 90)"/>`; offset += len; return c; }).join("");
    $("realShareRing").innerHTML = arcs + `<text x="90" y="86" text-anchor="middle" font-family="Plus Jakarta Sans,sans-serif" font-size="28" font-weight="800" fill="${C.navy}">${nf(pCiti, 1)}%</text><text x="90" y="106" text-anchor="middle" font-size="11.5" font-weight="600" fill="${C.muted}">${T("Citi measured share","Share medido Citi")}</text><text x="90" y="122" text-anchor="middle" font-size="10.5" fill="${C.subtle}">${bn(totElig, 1)} ${T("eligible","elegíveis")}</text>`;
    $("realShareKpis").innerHTML = `<div><span><i style="background:var(--bar-citi)"></i>Citi</span><b>${bn(wCiti, 2)} (${nf(pCiti, 1)}%)</b></div><div><span><i style="background:var(--bar-peers)"></i>${T("Peer banks","Bancos pares")}</span><b>${bn(wPeers, 2)} (${nf(pPeers, 1)}%)</b></div><div><span><i style="background:var(--bar-fidc)"></i>FIDCs</span><b>${bn(wFidc, 2)} (${nf(pFidc, 1)}%)</b></div><div><span><i style="background:var(--bar-free)"></i>${T("Open headroom","Espaço livre")}</span><b style="color:var(--green)">${bn(wFree, 2)} (${nf(pFree, 1)}%)</b></div>`;
  }

  function renderSignals() {
    $("sigHealthGrid").innerHTML = EXT_HEALTH.map((h, i) => {
      const a = ANCHORS[i];
      return `<div class="sig-card"><div class="sig-card-head">${brandBadge(a.id, "xs")}<div><b>${a.name.split(" ")[0]}</b><small>${h.rating} · ${L(h.outlook)}</small></div></div>
        <div class="sig-kv"><span>Duplicata 2027</span><strong>${h.dupPct}%</strong></div>
        <div class="track" style="height:6px"><div class="fill" style="width:${h.dupPct}%;background:${a.color}"></div></div>
        <div class="sig-kv"><span>${T("Registrar","Registradora")}</span>${INFRA_SVGS[h.reg]}</div>
        <div class="sig-kv"><span>${T("Chain stress","Estresse cadeia")}</span><span class="sig-badge ${h.stCls}">${L(h.stress)}</span></div>
        <div class="sig-kv"><span>${T("Net signal","Sinal líquido")}</span><span class="sig-badge ${h.netCls}">${L(h.net)}</span></div></div>`;
    }).join("");
    const filtered = EXT_SIGNALS.filter(s => sigFilter === "all" || s.route === sigFilter);
    $("sigFeed").innerHTML = filtered.map(s => {
      const a = ANCHORS.find(x => x.id === s.id), stepNum = s.route === "step1" ? 1 : 3;
      return `<div class="sig-event"><div class="sig-event-top"><div class="sig-event-brand">${brandBadge(a.id, "xs")}<span class="sev" style="background:${s.sev()};margin-top:0"></span><b>${a.name}</b></div><span class="sig-badge ${s.route === "step1" ? "warn" : "neu"}">${s.route === "step1" ? T("Feeds Step 1 · Risk","Alimenta Etapa 1 · Risco") : T("Feeds Step 3 · Credit","Alimenta Etapa 3 · Crédito")}</span></div>
        <strong style="font-size:13.5px;color:var(--navy);line-height:1.35">${L(s.title)}</strong><p>${L(s.body)}</p>
        <div class="sig-event-foot"><div class="infra-logos" style="margin-top:0">${s.sources.map(k => INFRA_SVGS[k]).join("")}</div><button class="sig-route-btn" data-route-step="${stepNum}">${s.route === "step1" ? T("→ Open Step 1 (Risk)","→ Abrir Etapa 1 (Risco)") : T("→ Open Step 3 (Credit)","→ Abrir Etapa 3 (Crédito)")}</button></div></div>`;
    }).join("");
  }
  $("sigFilter").addEventListener("click", e => { const b = e.target.closest("[data-sf]"); if (!b) return; sigFilter = b.dataset.sf; $("sigFilter").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); renderSignals(); });
  $("sigFeed").addEventListener("click", e => { const b = e.target.closest("[data-route-step]"); if (!b) return; goStep(+b.dataset.routeStep, true); });
  function renderMarket() { updateMktSubnav(); renderCompetitors(); renderPricing(); renderShareReal(); renderSignals(); }

