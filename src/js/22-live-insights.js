  // ========== LIVE INSIGHTS (a compact strip at the top of each step panel) ==========
  // insightsFor(step) -> Array<{ id, tone: "good"|"warn"|"bad"|"info", text, ask }>
  //   text is plain text, one sentence with the number and the threshold the app already uses
  //   (8% error tolerance, gate of 3 risk flags, 10 days to first discount, approved limit, price bands);
  //   ask is a question askLocal() answers to explain the reading.
  // The strip re-renders through onRefresh (week, language, currency, theme, dataset, data edits) and after any
  // user input, because several controls of other modules (limit, scenario, pipeline inputs, spread slider)
  // change state without calling touch(). It only reads state.
  Object.assign(I18N, {
    "li.lbl": ["Live insights", "Leituras ao vivo"],
    "li.aria": ["Live insights for this step, computed from the numbers on screen", "Leituras ao vivo desta etapa, calculadas com os números da tela"]
  });
  const LI_TONE = { good: ["On track", "No alvo"], warn: ["Attention", "Atenção"], bad: ["Action needed", "Exige ação"], info: ["Reading", "Leitura"] };
  const LI_ICON = { good: "✓", warn: "!", bad: "✕", info: "i" };

  function insightsFor(step) {
    const out = [], add = (id, tone, text, ask) => out.push({ id, tone, text, ask });
    const i = week - 1, ds = engDsName();
    if (step === 1) {
      const n = D.flags[i];
      add("flags", n >= 3 ? "bad" : "good",
        n >= 3 ? T(`${n} open risk flags, at or above the growth gate of 3: hold the campaign until they are cleared.`, `${n} alertas de risco abertos, na trava de crescimento (3 ou mais): segurar a campanha até resolver.`)
               : T(`${n} open risk flag${n === 1 ? "" : "s"}, below the growth gate of 3: the campaign can scale.`, `${n} ${n === 1 ? "alerta de risco aberto" : "alertas de risco abertos"}, abaixo da trava de crescimento de 3: a campanha pode escalar.`),
        T("How many risk flags are open and what does the gate say?", "Quantos alertas de risco estão abertos e o que diz a trava?"));
      const v = F[mode], w = worstStep(v), lever = firstLever(w);
      add("funnel", "warn",
        T(`Example funnel: the weakest step is ${L(STEPS[w - 1])} → ${L(STEPS[w])}, ${Math.round(100 * v[w] / v[w - 1])}% conversion (${nf(v[w - 1] - v[w])} lost)${lever ? "; first lever to test: " + engLc1(lever) : ""}.`,
          `Funil de exemplo: a etapa mais fraca é ${L(STEPS[w - 1])} → ${L(STEPS[w])}, ${Math.round(100 * v[w] / v[w - 1])}% de conversão (${nf(v[w - 1] - v[w])} perdidos)${lever ? "; primeira alavanca a testar: " + engLc1(lever) : ""}.`),
        T("Where is the funnel bottleneck and which levers reduce it?", "Onde está o gargalo do funil e quais alavancas reduzem a perda?"));
      const d = D.days[i];
      add("days", d > 10 ? "warn" : "good",
        d > 10 ? T(`${nf(d)} days to first discount, above the 10-day mark of the action plan (${nf(d - 10)} to cut).`, `${nf(d)} dias até o primeiro desconto, acima da marca de 10 dias do plano de ação (${nf(d - 10)} a reduzir).`)
               : T(`${nf(d)} days to first discount, within the 10-day mark of the action plan.`, `${nf(d)} dias até o primeiro desconto, dentro da marca de 10 dias do plano de ação.`),
        T("How are the days to first discount evolving?", "Como estão os dias até o primeiro desconto?"));
    } else if (step === 2) {
      const f = engFc(), tone = engFcTone(f);
      add("limit", tone,
        f.kBase === 0 ? T(`The balance of ${money(f.now)} is already above the ${money(f.lim)} approved limit: request +${money(f.need)}.`, `O saldo de ${money(f.now)} já está acima do limite aprovado de ${money(f.lim)}: pedir +${money(f.need)}.`)
        : f.kBase > 0 ? T(`The ${scName(f.sc)} forecast crosses the ${money(f.lim)} approved limit in ${engWk(week + f.kBase)}: request +${money(f.need)} before then.`, `A projeção do cenário ${scName(f.sc).toLowerCase()} cruza o limite aprovado de ${money(f.lim)} na ${engWk(week + f.kBase)}: pedir +${money(f.need)} antes disso.`)
        : f.kHigh >= 0 ? T(`The ${scName(f.sc)} forecast fits, but the top of the range crosses the ${money(f.lim)} limit in ${engWk(week + f.kHigh)}: pre-approve +${money(f.need)}.`, `A projeção do cenário ${scName(f.sc).toLowerCase()} cabe, mas o topo da faixa cruza o limite de ${money(f.lim)} na ${engWk(week + f.kHigh)}: pré-aprovar +${money(f.need)}.`)
        : T(`The top of the forecast range peaks at ${money(f.peakHigh)}, ${nf(100 * f.peakHigh / f.lim, 0)}% of the ${money(f.lim)} limit: ${money(f.lim - f.peakHigh)} of headroom through ${engWk(week + f.h)}.`, `O topo da faixa projetada chega a ${money(f.peakHigh)}, ${nf(100 * f.peakHigh / f.lim, 0)}% do limite de ${money(f.lim)}: folga de ${money(f.lim - f.peakHigh)} até a ${engWk(week + f.h)}.`),
        tone === "good" ? T("Does the balance fit the approved limit?", "O saldo cabe no limite aprovado?") : T("When does the balance cross the approved limit?", "Quando o saldo passa do limite aprovado?"));
      const e = D.err[i];
      add("err", e <= 8 ? "good" : "bad",
        e <= 8 ? T(`Forecast error of ${nf(e, 1)}% is inside the 8% tolerance, with ${nf(8 - e, 1)} pp of room.`, `Erro de projeção de ${nf(e, 1)}% dentro da tolerância de 8%, com ${nf(8 - e, 1)} pp de folga.`)
               : T(`Forecast error of ${nf(e, 1)}% is ${nf(e - 8, 1)} pp above the 8% tolerance: recalibrate the forecast.`, `Erro de projeção de ${nf(e, 1)}% está ${nf(e - 8, 1)} pp acima da tolerância de 8%: recalibrar a projeção.`),
        T("Is the forecast error inside the tolerance?", "O erro de projeção está dentro da tolerância?"));
      const b = engBacktestAvg();
      add("backtest", !b.n ? "info" : b.model < b.flat ? "good" : "warn",
        !b.n ? week > 1 ? T("No forecast can be scored yet: the balances so far round to zero.", "Nenhuma projeção pode ser avaliada ainda: os saldos até aqui arredondam para zero.") : T("The first one-week forecast can be scored when week 2 closes.", "A primeira projeção de uma semana pode ser avaliada quando a semana 2 fechar.")
             : T(`One-week backtest over ${b.n} week${b.n === 1 ? "" : "s"}: the model misses by ${nf(b.model, 2)}% on average, against ${nf(b.flat, 2)}% for repeating the prior balance.`, `Backtest de uma semana em ${b.n} ${b.n === 1 ? "semana" : "semanas"}: o modelo erra ${nf(b.model, 2)}% em média, contra ${nf(b.flat, 2)}% ao repetir o saldo anterior.`),
        T("How accurate was the one-week forecast?", "Qual foi a precisão da projeção de uma semana?"));
    } else if (step === 3) {
      const t = totals(), ord = engOrder(t), top = ANCHORS[ord[0][1]], g = engSigGroups();
      add("totals", "info",
        T(`Pipeline on the "${ds}" dataset: ${bn(t.flow)} of potential annual flow, ${money(t.bal)} of implied balance and ${moneyD(t.rev)} of spread revenue a year.`, `Pipeline no conjunto "${ds}": ${bn(t.flow)} de fluxo anual potencial, ${money(t.bal)} de saldo implícito e ${moneyD(t.rev)} de receita de spread por ano.`),
        T("What is the pipeline total and ranking?", "Qual o total e o ranking do pipeline?"));
      add("top", "info",
        T(`${top.name} ranks first with ${bn(ord[0][0])} of annual flow, ${nf(100 * ord[0][0] / (t.flow || 1), 0)}% of the pipeline: first to take to credit committee.`, `${top.name} lidera com ${bn(ord[0][0])} de fluxo anual, ${nf(100 * ord[0][0] / (t.flow || 1), 0)}% do pipeline: primeira a levar ao comitê de crédito.`),
        T(`Tell me about ${top.name}`, `Fale sobre a ${top.name}`));
      add("signals", g.red.length ? "bad" : g.amber.length ? "warn" : "good",
        g.red.length ? T(`Red external signal (fabricated) for ${g.red.join(", ")}: the action plan holds that credit request.`, `Sinal externo vermelho (fabricado) em ${g.red.join(", ")}: o plano de ação segura esse pedido de crédito.`)
        : g.amber.length ? T(`No red external signal among the ${ANCHORS.length} anchors; amber for ${g.amber.join(", ")} (fabricated signals).`, `Nenhum sinal externo vermelho nas ${ANCHORS.length} âncoras; amarelo em ${g.amber.join(", ")} (sinais fabricados).`)
        : T(`All ${ANCHORS.length} anchors show a green external signal (fabricated signals).`, `As ${ANCHORS.length} âncoras têm sinal externo verde (sinais fabricados).`),
        T("What do the external signals say about the anchors?", "O que dizem os sinais externos sobre as âncoras?"));
    } else if (step === 4) {
      const b = engBands(mktSpread), x = "CDI + " + nf(mktSpread, 2) + "%", s = engShareTotals();
      add("price", b.above.length ? "bad" : b.below.length ? "warn" : "good",
        b.above.length ? T(`The ${x} proposal is above the fabricated market band for ${b.above.join(", ")}: likely to lose on price.`, `A proposta de ${x} fica acima da faixa de mercado fabricada em ${b.above.join(", ")}: tende a perder no preço.`)
        : b.below.length ? T(`The ${x} proposal is below the fabricated market band for ${b.below.join(", ")}: margin left on the table.`, `A proposta de ${x} fica abaixo da faixa de mercado fabricada em ${b.below.join(", ")}: margem deixada na mesa.`)
        : T(`The ${x} proposal is inside the fabricated market band for all ${ANCHORS.length} anchors.`, `A proposta de ${x} fica dentro da faixa de mercado fabricada nas ${ANCHORS.length} âncoras.`),
        T("Is our spread competitive against the market band?", "Nosso spread é competitivo frente à faixa de mercado?"));
      add("space", "info",
        T(`Largest unfinanced space: ${s.best.name}, ${bn(s.best.free, 1)} of eligible purchases (fabricated shares).`, `Maior espaço não financiado: ${s.best.name}, ${bn(s.best.free, 1)} das compras elegíveis (shares fabricados).`),
        T("Where is the largest white space?", "Onde está o maior espaço livre?"));
      add("share", "info",
        T(`Across the ${s.rows.length} anchors, Citi covers ${nf(s.pc, 0)}% of eligible purchases and ${nf(s.pw, 0)}% is unfinanced (fabricated figures, "${ds}" dataset).`, `Nas ${s.rows.length} âncoras, o Citi cobre ${nf(s.pc, 0)}% das compras elegíveis e ${nf(s.pw, 0)}% não é financiado (números fabricados, conjunto "${ds}").`),
        T("Who leads among competitors?", "Quem lidera entre os concorrentes?"));
    }
    return out.slice(0, 3);
  }

  // ---------- rendering ----------
  const LI_PREV = {};          // "step:id" -> last rendered text
  let liSig = "", liQueued = false, liPopStep = 0, liPopFocus = null;
  function liExplain(strip, ask, trigger) {
    if (typeof openAssistant === "function") { try { openAssistant(ask); return; } catch (e) {} }
    liPopOpen(strip, ask, trigger);
  }
  // Inline answer, used only while no assistant panel exists: the same askLocal() answer, shown under the strip.
  function liPopOpen(strip, ask, trigger) {
    const pop = strip.querySelector("[data-li-pop]"); if (!pop) return;
    if (trigger) liPopFocus = trigger;
    document.querySelectorAll("[data-li-pop]").forEach(p => { if (p !== pop) { p.hidden = true; p.innerHTML = ""; } });
    const a = askLocal(ask);
    pop.dataset.ask = ask; liPopStep = +strip.dataset.insights;
    pop.innerHTML = `<div class="li-pop-head"><div><span class="li-pop-q">${esc(ask)}</span><b class="li-pop-t" tabindex="-1">${a.title}</b></div>
        <button type="button" class="li-pop-x" data-li-close aria-label="${T("Close answer", "Fechar resposta")}">✕</button></div>
      <div class="li-pop-body">${a.html}</div>
      ${a.chips.length ? `<div class="li-pop-chips" role="group" aria-label="${T("Follow-up questions", "Perguntas de continuação")}">${a.chips.map(c => `<button type="button" data-li-chip="${esc(c)}">${esc(c)}</button>`).join("")}</div>` : ""}
      <div class="li-pop-note">${T("Computed in this browser by fixed rules over the numbers on screen. Nothing is sent anywhere.", "Calculado neste navegador por regras fixas sobre os números da tela. Nada é enviado para lugar nenhum.")}</div>`;
    pop.hidden = false;
    strip.querySelectorAll("[data-li-ask]").forEach(b => b.setAttribute("aria-expanded", String(b.dataset.liAsk === ask)));
    const t = pop.querySelector(".li-pop-t");
    if (t && trigger) { t.focus({ preventScroll: true }); if (pop.scrollIntoView) pop.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" }); }
  }
  function liPopClose(restore) {
    document.querySelectorAll("[data-li-pop]").forEach(p => { p.hidden = true; p.innerHTML = ""; delete p.dataset.ask; });
    document.querySelectorAll("[data-li-ask][aria-expanded]").forEach(b => b.setAttribute("aria-expanded", "false"));
    liPopStep = 0;
    if (restore && liPopFocus && document.contains(liPopFocus)) liPopFocus.focus({ preventScroll: true });
    liPopFocus = null;
  }
  function renderInsights() {
    liQueued = false;
    const strips = document.querySelectorAll("[data-insights]"); if (!strips.length) return;
    // A change of language, currency, FX rate or dataset rewrites every sentence: that is not news, so no flash.
    const sig = [lang, ccy, FX_RATE, datasetId].join("|"), sameView = sig === liSig, playing = !!timer;
    liSig = sig;
    strips.forEach(strip => {
      const step = +strip.dataset.insights, list = strip.querySelector("[data-li-list]"); if (!list) return;
      let items = [];
      try { items = insightsFor(step); } catch (e) { console.error("[insights]", e); }
      strip.hidden = !items.length;
      const wk = strip.querySelector("[data-li-wk]");
      if (wk) wk.textContent = (step <= 2 ? engWk(week) + " · " : "") + (step <= 2 ? (SRCINFO ? T("your data", "seus dados") : T("example data", "dados de exemplo")) : step === 3 ? T("public revenues × hypotheses", "receitas públicas × hipóteses") : T("fabricated figures", "números fabricados"));
      // No announcements while the weekly playback is running: a screen reader would get three lines per tick.
      list.setAttribute("aria-live", playing ? "off" : "polite");
      const usePop = typeof openAssistant !== "function";
      const keys = items.map(x => x.id).join(",");
      if (list.dataset.keys !== keys) {
        list.dataset.keys = keys;
        list.innerHTML = items.map(x => `<button type="button" class="li-item" data-li-id="${esc(x.id)}"><span class="li-ic" aria-hidden="true"></span><span class="li-txt"><span class="li-sr"></span><span class="li-t"></span></span><span class="li-go" aria-hidden="true">›</span></button>`).join("");
      }
      [...list.children].forEach((btn, k) => {
        const x = items[k], key = step + ":" + x.id, changed = LI_PREV[key] !== undefined && LI_PREV[key] !== x.text;
        if (btn.dataset.tone !== x.tone) { btn.dataset.tone = x.tone; btn.querySelector(".li-ic").textContent = LI_ICON[x.tone]; }
        const sr = btn.querySelector(".li-sr"), srTxt = L(LI_TONE[x.tone]) + ": ";
        if (sr.textContent !== srTxt) sr.textContent = srTxt;
        const t = btn.querySelector(".li-t");
        if (t.textContent !== x.text) t.textContent = x.text;
        btn.dataset.liAsk = x.ask;
        btn.title = T("See how this is computed", "Ver como isso é calculado");
        if (usePop) { btn.setAttribute("aria-expanded", String(liPopStep === step && strip.querySelector("[data-li-pop]").dataset.ask === x.ask)); } else btn.removeAttribute("aria-expanded");
        if (changed && sameView && !reduce && !playing) {   // during playback only the quiet ring marks a change
          btn.classList.remove("li-flash"); void btn.offsetWidth; btn.classList.add("li-flash");
        }
        if (changed && sameView) { btn.dataset.liChanged = "1"; clearTimeout(btn._liT); btn._liT = setTimeout(() => { delete btn.dataset.liChanged; btn.classList.remove("li-flash"); }, 2600); }
        LI_PREV[key] = x.text;
      });
      // Keep an open inline answer in step with the numbers.
      const pop = strip.querySelector("[data-li-pop]");
      if (pop && !pop.hidden && pop.dataset.ask) { if (usePop) { const y = pop.querySelector(".li-pop-body"), a = askLocal(pop.dataset.ask); if (y && y.innerHTML !== a.html) liPopOpen(strip, pop.dataset.ask, null); } else liPopClose(false); }
    });
  }
  function liQueue() { if (liQueued) return; liQueued = true; setTimeout(renderInsights, 0); }
  onRefresh(renderInsights);
  ["input", "change", "click"].forEach(ev => document.addEventListener(ev, liQueue, true));
  document.addEventListener("click", e => {
    const t = e.target.closest ? e.target : null; if (!t) return;
    const item = t.closest("[data-li-ask]");
    if (item) { const strip = item.closest("[data-insights]"); if (strip) liExplain(strip, item.dataset.liAsk, item); return; }
    if (t.closest("[data-li-close]")) { liPopClose(true); return; }
    const chip = t.closest("[data-li-chip]");
    if (chip) { const strip = chip.closest("[data-insights]"); if (strip) liPopOpen(strip, chip.dataset.liChip, liPopFocus || chip); }
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && liPopStep && e.target.closest && e.target.closest("[data-insights]")) { e.stopPropagation(); liPopClose(true); } }, true);
