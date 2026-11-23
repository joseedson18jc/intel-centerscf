  // ========== AUTO-GENERATED MONDAY ACTION PLAN (DECISIONS 1–3) ==========
  const OWN = {spec:["SCF specialist","Especialista SCF"], rm:["Relationship manager","Gerente de relacionamento"], risk:["Credit & risk","Crédito e risco"], ops:["Onboarding ops","Operações de cadastro"], lead:["Commercial leadership","Liderança comercial"]};
  const DUE = {1:["by Wednesday","até quarta"], 2:["by Friday","até sexta"], 3:["monitor","acompanhar"], m:["monthly committee","comitê mensal"]};
  let ACTS = [];
  // First untested lever for the weakest funnel step. firstLever() is provided by the adoption module when present;
  // it may return a ready sentence, a bare lever name or an [en, pt] pair.
  function leverNote(stepIndex) {
    let lv = "";
    try { lv = typeof firstLever === "function" ? firstLever(stepIndex) : ""; } catch (e) { lv = ""; }
    if (Array.isArray(lv)) lv = L(lv);
    lv = lv ? String(lv).trim() : "";
    if (!lv) return "";
    if (/[:.!?]/.test(lv)) return " " + lv;                                   // already a sentence
    return T(` First lever to test: ${lv.charAt(0).toLowerCase() + lv.slice(1)}.`,` Primeira alavanca a testar: ${lv.charAt(0).toLowerCase() + lv.slice(1)}.`);
  }
  function plan(w) {
    const i = w - 1, A = [];
    const add = (id, pri, dec, own, title, why, due) => A.push({id, pri, dec, own, title, why, due:due || DUE[pri]});
    // Decision 2: approved limit & error
    if (FS.kBase >= 0) add("limit", 1, 2, ["risk","spec"], T(`Request a limit increase of ${money(FS.need)}`,`Pedir aumento de limite de ${money(FS.need)}`), FS.kBase === 0 ? T(`Current balance is already above the ${money(FS.lim)} limit; top of range reaches ${money(FS.peakHigh)}.`,`Saldo atual já ultrapassa o limite de ${money(FS.lim)}; topo da faixa chega a ${money(FS.peakHigh)}.`) : T(`${scName(FS.sc)} case crosses ${money(FS.lim)} in W${w + FS.kBase}; top of range reaches ${money(FS.peakHigh)}.`,`Cenário ${scName(FS.sc).toLowerCase()} cruza ${money(FS.lim)} na S${w + FS.kBase}; topo da faixa chega a ${money(FS.peakHigh)}.`));
    else if (FS.kHigh >= 0) add("limit", 2, 2, ["risk","spec"], T(`Pre-approve ${money(FS.need)} of extra limit`,`Pré-aprovar ${money(FS.need)} de limite adicional`), T(`${scName(FS.sc)} case fits, but top of range crosses ${money(FS.lim)} in W${w + FS.kHigh}.`,`Cenário ${scName(FS.sc).toLowerCase()} cabe, mas topo da faixa cruza ${money(FS.lim)} na S${w + FS.kHigh}.`));
    else add("limit", 3, 2, ["spec"], T("Balance fits approved limit · no action","Saldo cabe no limite aprovado · sem ação"), T(`Peak of range ${money(FS.peakHigh)} = ${nf(100 * FS.peakHigh / FS.lim, 0)}% of the ${money(FS.lim)} limit.`,`Pico da faixa ${money(FS.peakHigh)} = ${nf(100 * FS.peakHigh / FS.lim, 0)}% do limite de ${money(FS.lim)}.`));
    if (D.err[i] > 8) add("err", 1, 2, ["spec"], T("Recalibrate the balance forecast","Recalibrar a projeção de saldo"), T(`Forecast error ${nf(D.err[i], 1)}% exceeds the 8.0% governance ceiling.`,`Erro de projeção de ${nf(D.err[i], 1)}% acima do teto de governança de 8,0%.`));
    if (!SRCINFO && w >= 10) add("season", 2, 2, ["risk","rm"], T("Pre-approve supplier limits for harvest peak","Pré-aprovar limites para o pico da safra"), T(`Seasonality alert: peak expected in ~${Math.max(1, 15 - w)} weeks; utilization jumps before forecast catches up.`,`Alerta de sazonalidade: pico previsto em ~${Math.max(1, 15 - w)} semanas; utilização sobe antes do modelo captar.`));
    // Decision 1: risk gate, campaign, funnel
    if (D.flags[i] >= 3) add("gate", 1, 1, ["risk"], T(`Hold campaign and clear ${D.flags[i]} open risk flags`,`Segurar campanha e resolver ${D.flags[i]} alertas de risco`), T("Growth gate: ≥3 open flags. Review duplicate invoices, expired KYC and concentration before expanding.","Trava de crescimento: ≥ 3 alertas abertos. Revisar duplicatas, KYC vencido e concentração antes de ampliar."));
    else { const exp = Math.round(30 * (DEC[0] + DEC[1] + DEC[2]) / 300); add("scale", 2, 1, ["rm"], T("Scale campaign to next 30 suppliers by propensity score","Escalar campanha para próximos 30 fornecedores pelo score"), T(`Risk flags are low (${D.flags[i]}). Deciles D1–D3 activate at ${DEC[0]}/${DEC[1]}/${DEC[2]}%: expect ~${exp} new active suppliers.`,`Alertas baixos (${D.flags[i]}). Decis D1–D3 ativam ${DEC[0]}/${DEC[1]}/${DEC[2]}%: expectativa de ~${exp} novos ativos.`)); }
    const fv = mode === "after" ? F.after : F.before; let worst = 1, wr = 1;
    for (let s = 1; s < fv.length; s++) { const r = fv[s] / fv[s - 1]; if (r < wr) { wr = r; worst = s; } }
    add("funnel", (!SRCINFO && w < 5 && worst === 3) ? 1 : 2, 1, ["ops","rm"], T(`Attack the "${L(STEPS[worst - 1])} → ${L(STEPS[worst])}" step`,`Atacar etapa "${L(STEPS[worst - 1])} → ${L(STEPS[worst])}"`), T(`Weakest conversion in funnel: ${nf(wr * 100, 0)}% (${fv[worst - 1] - fv[worst]} suppliers lost).`,`Pior conversão do funil: ${nf(wr * 100, 0)}% (${fv[worst - 1] - fv[worst]} fornecedores perdidos).`) + leverNote(worst));
    if (D.days[i] > 10) add("days", 2, 1, ["ops"], T(`Cut days to 1st discount from ${D.days[i]} to ≤10 days`,`Reduzir prazo até 1º desconto de ${D.days[i]} para ≤ 10 dias`), T("Suppliers waiting >10 days show materially higher abandonment before first discount.","Fornecedores que aguardam > 10 dias têm abandono bem maior antes da 1ª antecipação."));
    // Decision 3: pipeline #1, with the white-space note from the market module (fabricated market figures)
    const t = totals(), top = t.flows.indexOf(Math.max(...t.flows)), b = balOf(t.flows[top]), ws = MKT_STATE.bestWS;
    add("grow", 2, 3, ["lead","spec"], T(`Take ${esc(ANCHORS[top].name)} to credit committee`,`Levar ${esc(ANCHORS[top].name)} ao comitê de crédito`), T(`#1 in pipeline: ${bn(t.flows[top])} annual flow, ${money(b)} balance, ${moneyD(revOf(b))}/yr spread.`, `Nº 1 do pipeline: fluxo anual de ${bn(t.flows[top])}, saldo de ${money(b)}, spread de ${moneyD(revOf(b))}/ano.`)
      + (ws ? T(` Market (fabricated figures): ${esc(ws.name)} has the largest white space (${bn(ws.ws, 1)}).`,` Mercado (números fabricados): ${esc(ws.name)} tem o maior espaço livre (${bn(ws.ws, 1)}).`) : ""), DUE.m);
    // Decision 3: pricing review, driven by the price bands of the active dataset (MKT_STATE is filled by the price module)
    if (MKT_STATE.above.length) add("price", 2, 3, ["lead","spec"], T(`Review pricing for ${esc(MKT_STATE.above.join(", "))}`,`Rever o preço para ${esc(MKT_STATE.above.join(", "))}`), T(`The CDI + ${nf(mktSpread, 2)}% proposal sits above the market band for their rating (fabricated bands). Either cut the spread in the pipeline or build the offer on tenor and limit.`,`A proposta de CDI + ${nf(mktSpread, 2)}% fica acima da faixa de mercado para o rating dessas âncoras (faixas fabricadas). Reduzir o spread no pipeline ou montar a oferta em prazo e limite.`), DUE.m);
    // Decision 3: red external signal holds the credit request (signals come from the active dataset and are fabricated)
    ANCHORS.forEach(a => { const sg = sigOf(a.id); if (sg.sev !== "red") return;
      const note = sg.note ? L(sg.note) : "", out = sg.out ? ` (${L(sg.out).toLowerCase()})` : "";
      add("sig-" + a.id, 2, 3, ["risk","lead"], T(`Hold the credit request for ${esc(a.name)}`,`Segurar o pedido de crédito para ${esc(a.name)}`), T(`Red external signal (fabricated)${note ? ": " + note.charAt(0).toLowerCase() + note.slice(1) : ""}${out}.`,`Sinal externo vermelho (fabricado)${note ? ": " + note.charAt(0).toLowerCase() + note.slice(1) : ""}${out}.`), DUE.m); });

    A.sort((a, b2) => a.pri - b2.pri || a.dec - b2.dec);
    ACTS = A.slice(0, 7);
    const openCnt = ACTS.filter(a => a.pri < 3).length;
    $("act-n").textContent = T(`Week ${w} · ${openCnt} priority action${openCnt === 1 ? "" : "s"} · auto-generated`,`Semana ${w} · ${openCnt} aç${openCnt === 1 ? "ão prioritária" : "ões prioritárias"} · gerado automaticamente`);
    const key = a => `scf-done-${w}-${a.id}`;
    const isDone = a => { try { return localStorage.getItem(key(a)) === "1"; } catch (e) { return false; } };
    $("act-list").innerHTML = ACTS.map((a, j) => `<li class="act p${a.pri}${isDone(a) ? " done" : ""}"><span class="pr">${j + 1}</span><div><b>${a.title}</b><p>${a.why}</p><div class="meta"><span>${T("Decision","Decisão")} ${a.dec}</span><span>${a.own.map(o => L(OWN[o])).join(" + ")}</span><span>${L(a.due)}</span></div></div><label><input type="checkbox" data-a="${j}" ${isDone(a) ? "checked" : ""}> ${T("done","feito")}</label></li>`).join("");
    $("act-list").querySelectorAll("input").forEach(cb => cb.onchange = () => {
      const a = ACTS[+cb.dataset.a]; try { localStorage.setItem(key(a), cb.checked ? "1" : "0"); } catch (e) {}
      cb.closest("li").classList.toggle("done", cb.checked);
    });
  }

