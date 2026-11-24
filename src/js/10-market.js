  // ========== STEP 4: MARKET & COMPETITION (4 INTERACTIVE MODULES OVER THE ACTIVE DATASET) ==========
  // Every figure here is fabricated for the prototype. The tables live in 09a-datasets.js; these containers
  // are refilled in place by loadMarketDataset() so other modules always read the active dataset.
  const FUNDERS = [], COMP_DATA = [], PRICE_TIERS = [], RM_LOSS = [], SHARE_DATA = [], EXT_HEALTH = [], EXT_SIGNALS = [];
  function loadMarketDataset() {
    const d = DS();
    dsRefill(FUNDERS, d.funders); dsRefill(COMP_DATA, d.comp); dsRefill(PRICE_TIERS, d.tiers); dsRefill(RM_LOSS, d.rmLoss);
    dsRefill(SHARE_DATA, d.share || []); dsRefill(EXT_HEALTH, d.health); dsRefill(EXT_SIGNALS, d.signals);
  }
  loadMarketDataset();

  let mktSub = "all", compFilter = "all", selCompIdx = 0, ratingFilter = "all", mktSpread = 1.20, sigFilter = "all";
  const MKT_STATE = {above:[], below:[], bestWS:null, sp:mktSpread};

  const fName = f => Array.isArray(f.name) ? L(f.name) : f.name;
  const isFlowSet = () => DS().matrixUnit === "flow";
  // Matrix values are stored in BRL million. Flow sets read better in billions when shown in BRL.
  const mxFmt = v => isFlowSet() && ccy !== "USD" ? bn(v / 1000, 1) : money(v);
  const rowFunded = row => FUNDERS.reduce((s, f) => s + (row[f.k] || 0), 0);
  const naTxt = () => `<span class="ds-na">${L(DS_NA)}</span>`;
  const rtLbl = code => DS().ratingPrefix + code.replace("-", "−");
  const cdi = v => "CDI + " + nf(v, 2) + "%";

  function updateMktSubnav() {
    document.querySelectorAll("#mktSubnav button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mmod === mktSub)));
    document.querySelectorAll("[data-mkt-panel]").forEach(p => { p.hidden = mktSub !== "all" && p.dataset.mktPanel !== mktSub; });
  }
  $("mktSubnav").addEventListener("click", e => { const b = e.target.closest("[data-mmod]"); if (!b) return; mktSub = b.dataset.mmod; updateMktSubnav(); });

  // ---------- 4.1 Competitors by anchor ----------
  function renderCompetitors() {
    const flow = isFlowSet();
    if (selCompIdx >= COMP_DATA.length) selCompIdx = 0;
    // White space is derived (Step 3 eligible purchases minus funded flow) only where the dataset carries flows.
    if (flow) COMP_DATA.forEach((row, idx) => { row.gap = Math.max(0, Math.round(eligOf(idx) * 1000 - rowFunded(row))); });
    const visibleFunders = FUNDERS.filter(f => compFilter === "banks" ? (f.type === "bank" || f.type === "citi") : compFilter === "fidc" ? (f.type === "fidc" || f.type === "citi") : true);
    const mxMax = Math.max(1, ...COMP_DATA.map(r => Math.max(...FUNDERS.map(f => r[f.k] || 0))));
    const lvlCls = v => v / mxMax >= 0.6 ? "lvl-3" : v / mxMax >= 0.33 ? "lvl-2" : "lvl-1";
    const citiZero = T("Assumed zero: there is no public information on a Citi program at this anchor","Assumido como zero: não há informação pública sobre programa do Citi nesta âncora");
    const dotTxt = h => { const n = parseInt(h.slice(1), 16), c = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * c(n >> 16 & 255) + .7152 * c(n >> 8 & 255) + .0722 * c(n & 255) > .18 ? "#1A1200" : "#fff"; };   // readable text on brand colours
    const headCols = visibleFunders.map(f => `<th><div class="funder-hd"><span class="funder-dot" style="background:${f.col};color:${dotTxt(f.col)}">${f.abbr}</span><span>${esc(fName(f))}</span></div></th>`).join("");
    const bodyRows = COMP_DATA.map((row, idx) => {
      const a = ANCHORS[idx], total = rowFunded(row);
      const cells = visibleFunders.map(f => {
        const v = row[f.k] || 0;
        if (f.k === "citi") return v ? `<td><span class="mcell citi-cell">${mxFmt(v)}</span></td>` : `<td><span class="mcell citi-cell zero" title="${esc(citiZero)}">${mxFmt(0)}</span></td>`;
        if (!v) return `<td><span class="mcell empty" aria-label="${T("None","Sem programa")}">—</span></td>`;
        return `<td><span class="mcell ${lvlCls(v)}">${mxFmt(v)}</span></td>`;
      }).join("");
      return `<tr data-cidx="${idx}" class="${idx === selCompIdx ? "selected" : ""}">
        <td><div class="anchor-cell">${brandBadge(a.id, "sm")}<span><b>${esc(a.name)}</b><small>${L(a.sector)}</small></span></div></td>
        ${cells}<td><b>${mxFmt(total)}</b></td><td><span class="mcell gap-cell">+${mxFmt(row.gap)}</span></td></tr>`;
    }).join("");
    const colTot = k => COMP_DATA.reduce((s, r) => s + (r[k] || 0), 0);
    const colTotals = visibleFunders.map(f => `<td>${mxFmt(colTot(f.k))}</td>`).join("");
    const grandTotal = COMP_DATA.reduce((s, r) => s + rowFunded(r), 0);
    const totalGap = COMP_DATA.reduce((s, r) => s + r.gap, 0);
    const thAnchor = T("Anchor (click row for detail)","Âncora (clique p/ detalhe)");
    const thTotal = flow ? T("Total funded","Total financiado") : T("Estimated total (fabricated)","Total estimado (fabricado)");
    const thGap = flow ? `<span title="${T("Step 3 eligible purchases minus funded flow","Compras elegíveis da Etapa 3 menos o fluxo financiado")}">${T("White space","Espaço livre")}</span>` : T("Citi headroom","Espaço Citi");
    $("compMatrix").innerHTML = `<thead><tr><th>${thAnchor}</th>${headCols}<th>${thTotal}</th><th>${thGap}</th></tr></thead><tbody>${bodyRows}</tbody><tfoot><tr><td>${T("5-anchor total","Total 5 âncoras")}</td>${colTotals}<td>${mxFmt(grandTotal)}</td><td style="color:var(--green)">+${mxFmt(totalGap)}</td></tr></tfoot>`;

    if ($("compUnit")) $("compUnit").innerHTML = `<span class="fab-tag">${L(I18N["ds.fab.tag"])}</span> ` + (flow
      ? T("Estimated annual reverse-factoring flow by funder. Darker = bigger program. White space = Step 3 eligible purchases not funded by anyone.","Fluxo anual estimado de risco sacado por financiador. Mais escuro = programa maior. Espaço livre = compras elegíveis da Etapa 3 sem nenhum financiador.")
      : T("Estimated supplier-finance balance by funder. Darker = bigger program. The Citi column is assumed zero: there is no public information on a Citi program at these anchors.","Saldo estimado de risco sacado por financiador. Mais escuro = programa maior. A coluna do Citi é assumida como zero: não há informação pública sobre programa do Citi nessas âncoras."));

    // Result line: who leads, how much sits in FIDCs, where Citi stands in this dataset.
    if ($("compRes")) {
      const others = FUNDERS.filter(f => f.type !== "citi"), cnt = {};
      COMP_DATA.forEach(r => { const top = others.slice().sort((x, y) => (r[y.k] || 0) - (r[x.k] || 0))[0]; cnt[top.k] = (cnt[top.k] || 0) + 1; });
      const topF = others.slice().sort((x, y) => (cnt[y.k] || 0) - (cnt[x.k] || 0) || colTot(y.k) - colTot(x.k))[0];
      const pTop = nf(100 * colTot(topF.k) / grandTotal, 0), pFidc = nf(100 * colTot("fidc") / grandTotal, 0), n = COMP_DATA.length;
      $("compRes").innerHTML = T(`<b>${esc(fName(topF))}</b> leads in ${cnt[topF.k]} of ${n} anchors and funds ${pTop}% of the ${mxFmt(grandTotal)} mapped. FIDCs already hold ${pFidc}%. `,`<b>${esc(fName(topF))}</b> lidera em ${cnt[topF.k]} de ${n} âncoras e financia ${pTop}% dos ${mxFmt(grandTotal)} mapeados. Os FIDCs já têm ${pFidc}%. `)
        + (colTot("citi") ? T(`Citi position in this dataset: ${mxFmt(colTot("citi"))} across the ${n} anchors (invented for the prototype).`,`Posição do Citi neste conjunto: ${mxFmt(colTot("citi"))} nas ${n} âncoras (inventada para o protótipo).`)
                          : T(`Citi: public relationship with all ${n}; its program position is assumed zero, as there is no public information.`,`Citi: relacionamento público com as ${n}; a posição em programa é assumida como zero, pois não há informação pública.`));
    }

    const sel = COMP_DATA[selCompIdx], anc = ANCHORS[selCompIdx], selTot = rowFunded(sel), fidcPct = selTot ? Math.round((sel.fidc || 0) / selTot * 100) : 0;
    if (flow) {
      const lead = FUNDERS.filter(f => f.type !== "citi").slice().sort((x, y) => (sel[y.k] || 0) - (sel[x.k] || 0))[0];
      $("iasDrawer").innerHTML = `
        <div><h4>${brandBadge(anc.id, "xs")}<span>${esc(anc.name)} · ${T("funding snapshot","retrato do financiamento")}</span></h4><p><strong>${mxFmt(selTot)}</strong> ${T("of estimated annual flow funded today","de fluxo anual estimado financiado hoje")} (${fidcPct}% ${T("by FIDCs and fintechs","por FIDCs e fintechs")}). ${T("Lead funder","Principal financiador")}: <strong>${esc(fName(lead))}</strong> (${mxFmt(sel[lead.k] || 0)}).</p></div>
        <div><span class="lbl">${T("Citi position","Posição do Citi")}</span><p>${T("Public relationship; no public information on a supplier-finance program, so assumed zero in this dataset.","Relacionamento público; sem informação pública sobre programa de risco sacado, por isso assumido como zero neste conjunto.")}</p></div>
        <div><span class="lbl">${T("White space","Espaço livre")}</span><p><strong>+${mxFmt(sel.gap)}</strong> ${T(`of the ${bn(eligOf(selCompIdx), 1)} eligible purchases in Step 3 not funded by anyone.`,`dos ${bn(eligOf(selCompIdx), 1)} de compras elegíveis da Etapa 3 sem nenhum financiador.`)} ${T("IAS 7 terms and CVM notes:","Prazos IAS 7 e notas da CVM:")} ${naTxt()}.</p></div>`;
    } else {
      $("iasDrawer").innerHTML = `
        <div><h4>${brandBadge(anc.id, "xs")}<span>${esc(anc.name)} · ${T("illustrative snapshot (real data would come from the IAS 7 / IFRS 7 note)","retrato ilustrativo (o dado real viria da nota IAS 7 / IFRS 7)")}</span></h4><p><strong>${mxFmt(selTot)}</strong> ${T("of estimated supplier finance balance (fabricated)","de saldo estimado de risco sacado (fabricado)")} (${fidcPct}% ${T("in CVM FIDCs","em FIDCs CVM")}). ${sel.iasTerms ? L(sel.iasTerms) : naTxt()}</p></div>
        <div><span class="lbl">${T("CVM FIDC filings (illustrative)","Informes FIDC · CVM (ilustrativo)")}</span><p>${sel.cvmNote ? L(sel.cvmNote) : naTxt()}</p></div>
        <div><span class="lbl">${T("Commercial play","Ação comercial recomendada")}</span><p><strong>+${mxFmt(sel.gap)}</strong> ${T("addressable headroom:","de espaço endereçável:")} ${sel.play ? L(sel.play) : naTxt()}</p></div>`;
    }
  }
  $("compMatrix").addEventListener("click", e => { const tr = e.target.closest("tr[data-cidx]"); if (!tr) return; selCompIdx = +tr.dataset.cidx; renderCompetitors(); });
  $("compFilter").addEventListener("click", e => { const b = e.target.closest("[data-cf]"); if (!b) return; compFilter = b.dataset.cf; $("compFilter").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); renderCompetitors(); });

  // ---------- 4.2 Price benchmark ----------
  function renderPricing() {
    $("mktSpreadSlider").value = mktSpread;
    $("mktSpreadVal").textContent = cdi(mktSpread);
    const scaleMin = 0.50, scaleMax = 2.60, pos = v => Math.max(0, Math.min(100, (v - scaleMin) / (scaleMax - scaleMin) * 100));
    const nameOf = id => ANCHORS.find(a => a.id === id).name;
    const above = [], below = [];
    PRICE_TIERS.forEach(t => { if (mktSpread > t.max) t.anchors.forEach(id => above.push(nameOf(id))); else if (mktSpread < t.min) t.anchors.forEach(id => below.push(nameOf(id))); });
    MKT_STATE.above = above; MKT_STATE.below = below; MKT_STATE.sp = mktSpread;

    $("ratingFilter").querySelectorAll("[data-rt]").forEach(b => { if (b.dataset.rt !== "all") b.textContent = rtLbl(b.dataset.rt); });
    const hasFidc = PRICE_TIERS.some(t => t.fidc != null);
    if ($("lgFidc")) $("lgFidc").hidden = !hasFidc;

    const tiers = PRICE_TIERS.filter(t => ratingFilter === "all" || t.code === ratingFilter);
    $("ratingBands").innerHTML = tiers.map(t => {
      const anchorsHtml = t.anchors.map(id => { const a = ANCHORS.find(x => x.id === id); return `${brandBadge(id, "xs")}<span>${esc(a.name.split(" ")[0])}</span>`; }).join("");
      let vCls = "mid", vTxt = T("In market band","Na faixa de mercado");
      if (t.med != null && mktSpread <= t.med) { vCls = "win"; vTxt = T("Competitive · beats median","Competitivo · abaixo da mediana"); }
      else if (mktSpread > t.max) { vCls = "high"; vTxt = T("Above market · loss risk","Acima do mercado · risco de perda"); }
      else if (t.fidc != null && mktSpread > t.fidc) { vCls = "high"; vTxt = T("Wider than FIDC senior","Mais caro que FIDC sênior"); }
      else if (t.med == null && mktSpread < t.min) { vCls = "low"; vTxt = T("Below band · margin left on the table","Abaixo da faixa · margem deixada na mesa"); }
      const mid = t.med != null
        ? `${T("Median","Mediana")}: <b>${nf(t.med, 2)}%</b>` + (t.fidc != null ? ` · FIDC: <b style="color:var(--amber)">${nf(t.fidc, 2)}%</b>` : "")
        : `${T("Median and FIDC mark","Mediana e marca de FIDC")}: ${naTxt()}`;
      return `<div class="rb-row"><div class="rb-top"><div class="rb-title"><span class="rb-code">${rtLbl(t.code)}</span><span class="rb-anchors">${anchorsHtml}</span></div><span class="verdict ${vCls}">${vTxt}</span></div>
        <div class="rb-track"><div class="rb-range" style="left:${pos(t.min)}%;width:${pos(t.max) - pos(t.min)}%"></div>${t.med != null ? `<div class="rb-med" style="left:${pos(t.med)}%" title="${T("Median","Mediana")}: CDI+${nf(t.med, 2)}%"></div>` : ""}${t.fidc != null ? `<div class="rb-fidc" style="left:${pos(t.fidc)}%" title="FIDC: CDI+${nf(t.fidc, 2)}%"></div>` : ""}<div class="rb-citi" style="left:${pos(mktSpread)}%" title="Citi: CDI+${nf(mktSpread, 2)}%"></div></div>
        <div class="rb-axis"><span>${T("Min","Mín")}: ${cdi(t.min)}</span><span>${mid}</span><span>${T("Max","Máx")}: ${cdi(t.max)}</span></div></div>`;
    }).join("");

    if ($("priceRes")) $("priceRes").innerHTML = `<span class="fab-tag">${L(I18N["ds.fab.tag"])}</span> ` + (above.length
      ? T(`At ${cdi(mktSpread)}, the Citi proposal is <b>above the market band</b> for ${esc(above.join(", "))}: expect to lose on price unless the offer wins on tenor, platform or limit.`,`Com ${cdi(mktSpread)}, a proposta do Citi fica <b>acima da faixa de mercado</b> em ${esc(above.join(", "))}: tende a perder no preço, a menos que a oferta ganhe em prazo, plataforma ou limite.`)
      : below.length ? T(`At ${cdi(mktSpread)}, the Citi proposal is below the band for ${esc(below.join(", "))}: margin left on the table.`,`Com ${cdi(mktSpread)}, a proposta do Citi fica abaixo da faixa em ${esc(below.join(", "))}: margem deixada na mesa.`)
      : T(`At ${cdi(mktSpread)}, the Citi proposal is inside the market band for all ${ANCHORS.length} anchors.`,`Com ${cdi(mktSpread)}, a proposta do Citi fica dentro da faixa de mercado nas ${ANCHORS.length} âncoras.`));

    if (RM_LOSS.length) {
      $("rmLossBars").innerHTML = RM_LOSS.map(r => `<div class="loss-row"><div class="loss-row-top"><span>${L(r.lbl)}</span><span>${r.pct}%</span></div><div class="track"><div class="fill" style="width:${r.pct}%;background:${r.col()}"></div></div></div>`).join("");
      const fr = RM_LOSS[1];
      $("rmLossNote").hidden = !fr;
      if (fr) $("rmLossNote").innerHTML = T(`<b>Insight:</b> ${fr.pct}% of lost deals stem from onboarding friction: fixing documents (Step 1) wins mandates even when spread matches median.`,`<b>Leitura:</b> ${fr.pct}% das perdas vêm de atrito no cadastro: destravar documentos (Etapa 1) ganha mandatos mesmo com spread na mediana.`);
    } else {
      $("rmLossBars").innerHTML = `<p class="ds-na-block">${T("Lost-deal feedback from relationship managers is not part of this dataset.","O feedback dos gerentes sobre negócios perdidos não faz parte deste conjunto.")}</p>`;
      $("rmLossNote").hidden = true;
    }
  }
  $("mktSpreadSlider").oninput = e => { mktSpread = parseFloat(e.target.value); renderPricing(); plan(week); };
  $("ratingFilter").addEventListener("click", e => { const b = e.target.closest("[data-rt]"); if (!b) return; ratingFilter = b.dataset.rt; $("ratingFilter").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); renderPricing(); });

  // ---------- 4.3 Share of eligible payables ----------
  // One row per anchor, amounts in BRL bn. Sets with a share table use its percentages; flow sets derive
  // the split from the funder matrix against Step 3 eligible purchases (Citi stays at zero there).
  function shareRows() {
    const d = DS();
    if (d.share) return d.share.map((s, i) => { const elg = eligOf(i);
      return {id:s.id, name:ANCHORS[i].name, elig:elg, base:elg, pc:s.citi, pp:s.peers, pf:s.fidc, pw:s.free, citi:elg * s.citi / 100, peers:elg * s.peers / 100, fidc:elg * s.fidc / 100, free:elg * s.free / 100, reg:s.reg, regPct:s.regPct}; });
    return COMP_DATA.map((row, i) => {
      const elg = eligOf(i), citi = (row.citi || 0) / 1000;
      const peers = FUNDERS.filter(f => f.type === "bank").reduce((s, f) => s + (row[f.k] || 0), 0) / 1000;
      const fidc = FUNDERS.filter(f => f.type === "fidc").reduce((s, f) => s + (row[f.k] || 0), 0) / 1000;
      const base = Math.max(elg, citi + peers + fidc, 0.0001), free = Math.max(0, elg - citi - peers - fidc), h = EXT_HEALTH[i] || {};
      return {id:row.id, name:ANCHORS[i].name, elig:elg, base, pc:100 * citi / base, pp:100 * peers / base, pf:100 * fidc / base, pw:100 * free / base, citi, peers, fidc, free, reg:h.reg || null, regPct:h.dupPct, over:citi + peers + fidc > elg + 1e-9};
    });
  }
  function renderShareReal() {
    const d = DS(), rows = shareRows();
    // Keep the container other modules read in step with what is on screen.
    dsRefill(SHARE_DATA, rows.map(r => ({id:r.id, citi:Math.round(r.pc), peers:Math.round(r.pp), fidc:Math.round(r.pf), free:Math.round(r.pw), reg:r.reg, regPct:r.regPct})));
    // totBase: per anchor the larger of eligible and funded, so the consolidated shares never add up to more than 100%.
    let totElig = 0, totBase = 0, wCiti = 0, wPeers = 0, wFidc = 0, wFree = 0, bestWS = null;
    rows.forEach(r => { totElig += r.elig; totBase += r.base; wCiti += r.citi; wPeers += r.peers; wFidc += r.fidc; wFree += r.free; if (!bestWS || r.free > bestWS.ws) bestWS = {name:r.name, ws:r.free}; });
    MKT_STATE.bestWS = bestWS;

    const seg = (p, bg, cls = "") => `<div class="sh-seg${cls}" style="width:${p}%${bg ? ";background:" + bg : ""}">${p >= 8 ? nf(p, 0) + "%" : ""}</div>`;
    const item = (r, badge) => `<div class="sh-item"><div class="sh-top"><div class="sh-left">${badge}<div><b>${esc(r.name)}</b><small>${T("Eligible payables","Contas a pagar elegíveis")}: ${bn(r.elig, 1)} / ${T("yr","ano")}</small></div></div><div class="sh-right">${r.reg ? INFRA_SVGS[r.reg] : ""}${r.regPct != null ? `<span>${r.regPct}% ${T("electronic","escritural")}</span>` : ""}</div></div>
        <div class="sh-stack">${seg(r.pc, "var(--bar-citi)")}${seg(r.pp, "var(--bar-peers)")}${seg(r.pf, "var(--bar-fidc)", " dk")}${seg(r.pw, "", " free")}</div>
        <div class="sh-sub"><span>Citi: <b>${bn(r.citi, 2)}</b> (${nf(r.pc, 0)}%)</span><span>${T("Unfinanced headroom","Espaço não financiado")}: <b style="color:var(--green)">${bn(r.free, 2)}</b> (${nf(r.pw, 0)}%)</span></div>${r.note ? `<small class="sh-over">${r.note}</small>` : ""}${r.over ? `<small class="sh-over">${T("Funded flow in this dataset exceeds the Step 3 eligible estimate: bars are scaled to the funded total.","O fluxo financiado neste conjunto supera a estimativa elegível da Etapa 3: barras na escala do total financiado.")}</small>` : ""}</div>`;
    let html = rows.map(r => item(r, brandBadge(r.id, "sm"))).join(""), pilot = null;
    if (d.pilotOthers) {
      // Pilot anchor row (V13). Citi = the pilot's discounted flow, as in the Step 1 utilization proof (spend × % under program
      // × utilization). Share of wallet is a share of the financed wallet, so the peers + FIDCs block is citi × (100 − sow) / sow,
      // split as in the Step 1 share-of-wallet proof (illustrative weights). d.pilotOthers only marks that the set has this row.
      const wi = Math.max(0, Math.min(W, week) - 1), elg = SPEND / 1000, citi = elg * D.spend[wi] / 100 * D.util[wi] / 100, sw = Math.max(1, D.sow[wi]);
      const othersPct = 100 - sw, peersPct = Math.round(othersPct * .68), peers = citi * peersPct / sw, fidc = citi * (othersPct - peersPct) / sw;
      const base = Math.max(elg, citi + peers + fidc, 0.0001), free = Math.max(0, elg - citi - peers - fidc);
      pilot = {id:"pilot", name:SRCINFO ? SRCINFO.name : T("Pilot anchor","Âncora piloto"), elig:elg, pc:100 * citi / base, pp:100 * peers / base, pf:100 * fidc / base, pw:100 * free / base, citi, peers, fidc, free, reg:null, regPct:null, over:citi + peers + fidc > elg + 1e-9,
        note:T(`Citi = the pilot's discounted flow in week ${wi + 1} (${bn(elg, 1)} × ${D.spend[wi]}% × ${D.util[wi]}%, example data). Peers and FIDCs complete the financed wallet so that Citi holds the ${D.sow[wi]}% share of wallet of the Step 1 proof (illustrative split).`,`Citi = fluxo antecipado do piloto na semana ${wi + 1} (${bn(elg, 1)} × ${D.spend[wi]}% × ${D.util[wi]}%, dados de exemplo). Bancos pares e FIDCs completam o volume financiado para que o Citi tenha o share of wallet de ${D.sow[wi]}% da prova da Etapa 1 (divisão ilustrativa).`)};
      html = item(pilot, `<span class="brand-badge sm ds-pilot" aria-hidden="true">PIL</span>`) + html;
    }
    $("realShareRows").innerHTML = html;

    const pCiti = totBase ? wCiti / totBase * 100 : 0, pPeers = totBase ? wPeers / totBase * 100 : 0, pFidc = totBase ? wFidc / totBase * 100 : 0, pFree = totBase ? wFree / totBase * 100 : 0;
    const r = 72, circ = 2 * Math.PI * r, sum = Math.max(100, pCiti + pPeers + pFidc + pFree);
    const segs = [{pct:pCiti, col:isDark() ? "#0369A1" : "#00205B"}, {pct:pPeers, col:isDark() ? "#2563EB" : "#056DAE"}, {pct:pFidc, col:"#D97706"}, {pct:pFree, col:C.freeSeg}];
    let offset = 0;
    const arcs = segs.map(sg => { const len = circ * sg.pct / sum, c = `<circle cx="90" cy="90" r="${r}" fill="none" stroke="${sg.col}" stroke-width="15" stroke-dasharray="${len.toFixed(2)} ${(circ - len).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 90 90)"/>`; offset += len; return c; }).join("");
    $("realShareRing").innerHTML = arcs + `<text x="90" y="86" text-anchor="middle" font-family="Plus Jakarta Sans,sans-serif" font-size="28" font-weight="800" fill="${C.navy}">${nf(pCiti, 1)}%</text><text x="90" y="106" text-anchor="middle" font-size="11.5" font-weight="600" fill="${C.muted}">${T("Citi share","Share do Citi")}</text><text x="90" y="122" text-anchor="middle" font-size="10.5" fill="${C.subtle}"><title>${T("Eligible payables of the anchors shown","Contas a pagar elegível das âncoras exibidas")}</title>${T("base","base")} ${bn(totElig, 1)}</text>`;
    $("realShareKpis").innerHTML = `<div><span><i style="background:var(--bar-citi)"></i>Citi</span><b>${bn(wCiti, 2)} (${nf(pCiti, 1)}%)</b></div><div><span><i style="background:var(--bar-peers)"></i>${T("Peer banks","Bancos pares")}</span><b>${bn(wPeers, 2)} (${nf(pPeers, 1)}%)</b></div><div><span><i style="background:var(--bar-fidc)"></i>FIDCs</span><b>${bn(wFidc, 2)} (${nf(pFidc, 1)}%)</b></div><div><span><i style="background:var(--bar-free)"></i>${T("Open headroom","Espaço livre")}</span><b style="color:var(--green)">${bn(wFree, 2)} (${nf(pFree, 1)}%)</b></div>`;

    if ($("shareRes")) $("shareRes").innerHTML = `<span class="fab-tag">${L(I18N["ds.fab.tag"])}</span> ` + (pilot
      ? T(`Citi covers ${nf(100 * pilot.citi / pilot.elig, 0)}% of the pilot anchor's eligible payables (example data) and is assumed at zero at the ${rows.length} pipeline anchors. `,`O Citi cobre ${nf(100 * pilot.citi / pilot.elig, 0)}% do contas a pagar elegível da âncora piloto (dados de exemplo) e é assumido como zero nas ${rows.length} âncoras do pipeline. `)
      : wCiti ? T(`In this dataset Citi holds ${nf(pCiti, 1)}% of the eligible payables of the ${rows.length} pipeline anchors. `,`Neste conjunto o Citi tem ${nf(pCiti, 1)}% do contas a pagar elegível das ${rows.length} âncoras do pipeline. `)
      : T(`Citi is assumed at zero at the ${rows.length} pipeline anchors (no public information on a program). `,`O Citi é assumido como zero nas ${rows.length} âncoras do pipeline (sem informação pública sobre programa). `))
      + (bestWS ? T(`Biggest white space: <b>${esc(bestWS.name)}</b>, ${bn(bestWS.ws, 1)} a year not funded by anyone.`,`Maior espaço livre: <b>${esc(bestWS.name)}</b>, ${bn(bestWS.ws, 1)} por ano sem nenhum financiador.`) : "")
      + (totBase > totElig + 1e-9 ? " " + T(`Funded flow exceeds the Step 3 eligible estimate at ${esc(rows.filter(r => r.over).map(r => r.name).join(", "))}: the consolidated shares are taken on ${bn(totBase, 1)} (eligible or funded, whichever is larger, per anchor).`,`O fluxo financiado supera a estimativa elegível da Etapa 3 em ${esc(rows.filter(r => r.over).map(r => r.name).join(", "))}: os shares consolidados são calculados sobre ${bn(totBase, 1)} (o maior entre elegível e financiado, por âncora).`) : "");
  }

  // ---------- 4.4 External signals ----------
  function renderSignals() {
    const d = DS();
    $("sigHealthGrid").innerHTML = EXT_HEALTH.map((h, i) => {
      const a = ANCHORS[i];
      return `<div class="sig-card"><div class="sig-card-head">${brandBadge(a.id, "xs")}<div><b>${esc(a.name.split(" ")[0])}</b><small>${String(h.rating).replace("-", "−")} · ${L(h.outlook)}</small></div></div>
        <div class="sig-kv"><span>${L(d.dupLbl)}</span><strong>${h.dupPct}%</strong></div>
        <div class="track" style="height:6px"><div class="fill" style="width:${h.dupPct}%;background:${a.color}"></div></div>
        <div class="sig-kv"><span>${T("Registrar","Registradora")}</span>${h.reg ? INFRA_SVGS[h.reg] : naTxt()}</div>
        <div class="sig-kv"><span>${T("Chain stress","Estresse cadeia")}</span>${h.stCls === "na" ? naTxt() : `<span class="sig-badge ${h.stCls}">${L(h.stress)}</span>`}</div>
        <div class="sig-kv"><span>${T("Net signal","Sinal líquido")}</span><span class="sig-badge ${h.netCls}">${L(h.net)}</span></div>${h.note ? `<small class="sig-note">${L(h.note)}</small>` : ""}</div>`;
    }).join("");
    const filtered = EXT_SIGNALS.filter(s => sigFilter === "all" || s.route === sigFilter);
    $("sigFeed").innerHTML = filtered.length ? filtered.map(s => {
      const a = ANCHORS.find(x => x.id === s.id), stepNum = s.route === "step1" ? 1 : 3;
      return `<div class="sig-event"><div class="sig-event-top"><div class="sig-event-brand">${brandBadge(a.id, "xs")}<span class="sev" style="background:${C[s.sev] || C.blue};margin-top:0"></span><b>${esc(a.name)}</b></div><span class="sig-badge ${s.route === "step1" ? "warn" : "neu"}">${s.route === "step1" ? T("Feeds Step 1 · Risk","Alimenta Etapa 1 · Risco") : T("Feeds Step 3 · Credit","Alimenta Etapa 3 · Crédito")}</span></div>
        <strong class="sig-title">${s.pub ? `<span class="sig-pub">${T("Public · 3Q26 release","Público · release do 3T26")}</span> ` : `<span class="fab-tag">${L(I18N["ds.fab.tag"])}</span> `}${L(s.title)}</strong><p>${s.pub && s.bodyFab ? `<span class="fab-tag">${T("Invented for the prototype","Inventado para o protótipo")}</span> ` : ""}${L(s.body)}</p>
        <div class="sig-event-foot"><div class="infra-logos" style="margin-top:0">${s.sources.length ? s.sources.map(k => INFRA_SVGS[k]).join("") : `<span class="fab-tag">${L(I18N["ds.fab.tag"])}</span>`}</div><button class="sig-route-btn" data-route-step="${stepNum}">${s.route === "step1" ? T("→ Open Step 1 (Risk)","→ Abrir Etapa 1 (Risco)") : T("→ Open Step 3 (Credit)","→ Abrir Etapa 3 (Crédito)")}</button></div></div>`;
    }).join("") + (ccy === "USD" && filtered.some(x => /R\$/.test(L(x.title) + L(x.body))) ? `<p class="fnote sig-asrep">${T("Amounts inside the signal texts are quoted as reported by the companies (BRL unless stated).","Os valores dentro dos textos dos sinais são citados como divulgados pelas empresas (em reais, salvo indicação).")}</p>` : "")
      : `<p class="ds-na-block">${T("No signal in this dataset feeds this step.","Nenhum sinal deste conjunto alimenta esta etapa.")}</p>`;
  }
  $("sigFilter").addEventListener("click", e => { const b = e.target.closest("[data-sf]"); if (!b) return; sigFilter = b.dataset.sf; $("sigFilter").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); renderSignals(); });
  $("sigFeed").addEventListener("click", e => { const b = e.target.closest("[data-route-step]"); if (!b) return; goStep(+b.dataset.routeStep, true); });
  function renderMarket() { updateMktSubnav(); renderCompetitors(); renderPricing(); renderShareReal(); renderSignals(); }
  // The pilot row of the share module follows the selected week (only datasets that carry it).
  onRefresh(() => { if (DS().pilotOthers) renderShareReal(); });
