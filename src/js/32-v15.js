  // ========== v15 PAGE STRUCTURE ==========
  // One page per step: the page title is the step title, the step question sits under it, and steps 2 to 4 open with
  // a row of four numbers read from the same functions as the cards below (fcModel, totals, engBands, engShareTotals),
  // so the row can never disagree with them. The top-bar quick actions trigger the side-menu controls they mirror.
  Object.assign(I18N, {
    "tb.export":["Export","Exportar"], "tb.ask":["Assistant","Assistente"], "tb.theme":["Switch theme","Trocar tema"]
  });
  const v15Tile = (lbl, val, sub, tone) => `<div class="v15-kpi${tone ? " " + tone : ""}"><span class="v15-kpi-l">${esc(lbl)}</span><strong class="v15-kpi-v">${esc(val)}</strong><span class="v15-kpi-s">${esc(sub)}</span></div>`;
  const V15_ROWS = {
    2: () => {
      const m = fcModel(), room = m.lim - m.peakHigh, use = 100 * m.peakHigh / m.lim, err = D.err[m.w - 1];
      if (!(m.now > 0)) return [];
      return [
        [T("Top of the range", "Topo da faixa"), money(m.peakHigh), T(`${scName(m.sc)} case · ${m.h} weeks`, `Cenário ${scName(m.sc).toLowerCase()} · ${m.h} semanas`)],
        [room >= 0 ? T("Headroom under the limit", "Folga de limite") : T("Above the limit", "Acima do limite"), money(Math.abs(room)), room >= 0 ? T("Available capacity", "Capacidade disponível") : T(`Request +${money(m.need)}`, `Pedir +${money(m.need)}`), room >= 0 ? "" : "bad"],
        [T("Limit used at the peak", "Uso do limite no pico"), nf(use, 0) + "%", T(`Limit of ${money(m.lim)}`, `Limite de ${money(m.lim)}`), use > 100 ? "bad" : m.kHigh >= 0 ? "warn" : ""],
        [T("Forecast error", "Erro de projeção"), nf(err, 1) + "%", T(`Tolerance 8% · measured ±${nf(m.e1, 2)}% a week`, `Tolerância de 8% · medido ±${nf(m.e1, 2)}% por semana`), err > 8 ? "warn" : ""]
      ];
    },
    3: () => {
      const t = totals();
      return [
        [T("Anchors in the pipeline", "Âncoras no pipeline"), String(ANCHORS.length), T("Editable hypotheses", "Hipóteses editáveis")],
        [T("Potential annual flow", "Fluxo anual potencial"), bn(t.flow), T(`${bn(t.elig, 1)} of eligible purchases`, `${bn(t.elig, 1)} de compras elegíveis`)],
        [T("Implied balance", "Saldo implícito"), money(t.bal), T(`Credit to request · ${G.tenor} days`, `Crédito a pedir · ${G.tenor} dias`)],
        [T("Spread revenue a year", "Receita de spread ao ano"), moneyD(t.rev), T(`At ${nf(G.spread, 2)}% a year`, `A ${nf(G.spread, 2)}% ao ano`)]
      ];
    },
    4: () => {
      const b = engBands(mktSpread), s = engShareTotals(), inside = ANCHORS.length - b.above.length - b.below.length, g = engSigGroups();
      const alerts = g.red.length + g.amber.length;
      return [
        [T("Proposed rate", "Taxa proposta"), "CDI + " + nf(mktSpread, 2) + "%", T("Moves with the slider below", "Segue o controle abaixo")],
        [T("Inside the market band", "Dentro da faixa de mercado"), T(`${inside} of ${ANCHORS.length}`, `${inside} de ${ANCHORS.length}`), b.above.length ? T(`Above for ${b.above.join(", ")}`, `Acima em ${b.above.join(", ")}`) : b.below.length ? T(`Below for ${b.below.join(", ")}`, `Abaixo em ${b.below.join(", ")}`) : T("All anchors", "Todas as âncoras"), b.above.length ? "warn" : ""],
        [T("Unfinanced purchases", "Compras sem financiamento"), bn(s.free, 1), T(`Largest: ${s.best.name}`, `Maior: ${s.best.name}`)],
        [T("Anchors with a credit signal", "Âncoras com sinal de crédito"), T(`${alerts} of ${ANCHORS.length}`, `${alerts} de ${ANCHORS.length}`), T("Fabricated market figures", "Números de mercado fabricados"), g.red.length ? "bad" : alerts ? "warn" : ""]
      ];
    }
  };
  function v15Rows() {
    document.querySelectorAll("[data-v15-kpis]").forEach(box => {
      let rows = [];
      try { rows = V15_ROWS[box.dataset.v15Kpis](); } catch (e) { console.error("[v15]", e); }
      const html = rows.map(r => v15Tile(r[0], r[1], r[2], r[3])).join("");
      if (box._html !== html) { box._html = html; box.innerHTML = html; }
      box.hidden = !rows.length;
    });
  }
  // Signal of the week (side menu): the most urgent live reading of the current step, from the same list as the page.
  // Clicking it opens that reading's calculation, exactly as the reading on the page does.
  function v15Signal() {
    const nav = $("topStepNav"); if (!nav || typeof insightsFor !== "function") return;
    let box = $("snSignal");
    if (!box) {
      box = document.createElement("button"); box.type = "button"; box.id = "snSignal"; box.className = "sn-signal";
      box.innerHTML = '<span class="sn-signal-h"><i aria-hidden="true"></i><span class="sn-signal-k"></span></span><span class="sn-signal-t"></span>';
      nav.closest(".sn-group").after(box);
      box.onclick = () => { const b = document.querySelector(`[data-insights="${box.dataset.step}"] [data-li-id="${box.dataset.id}"]`); if (viewMode !== "all" && +box.dataset.step !== activeStep) goStep(+box.dataset.step); if (b) b.click(); };
    }
    let items = [];
    try { items = insightsFor(activeStep); } catch (e) { console.error("[v15]", e); }
    const x = ["bad", "warn", "info", "good"].map(t => items.find(i => i.tone === t)).find(Boolean);
    box.hidden = !x; if (!x) return;
    const k = T("Signal of the week", "Sinal da semana") + " · " + L(LI_TONE[x.tone]);
    box.dataset.step = activeStep; box.dataset.id = x.id; box.dataset.tone = x.tone;
    const ke = box.querySelector(".sn-signal-k"), te = box.querySelector(".sn-signal-t");
    if (ke.textContent !== k) ke.textContent = k;
    if (te.textContent !== x.text) te.textContent = x.text;
  }
  function v15Head() {
    const root = document.documentElement, h = $("pageTitle");
    if (root.dataset.view !== viewMode) root.dataset.view = viewMode;
    if (h) { const t = viewMode === "all" ? L(I18N.h1) : L(I18N["st." + activeStep + ".title"]); if (h.textContent !== t) h.textContent = t; }
    const ex = $("tbExportLbl"); if (ex) ex.textContent = L(I18N["tb.export"]);
    const ask = $("tbAsk"); if (ask) ask.setAttribute("aria-label", L(I18N["tb.ask"]));
    const th = $("tbTheme"); if (th) { th.setAttribute("aria-label", L(I18N["tb.theme"])); th.title = L(I18N["tb.theme"]); th.setAttribute("aria-pressed", String(isDark())); }
  }
  {
    const prevHook = stepViewHook;
    stepViewHook = () => { if (prevHook) prevHook(); v15Head(); v15Signal(); };
    const via = (id, target) => { const b = $(id); if (b) b.onclick = () => { const t = typeof target === "function" ? target() : $(target); if (t) t.click(); }; };
    via("tbAsk", "openAssistant");
    via("tbExport", "openBrief");
    via("tbTheme", () => document.querySelector(`.theme-switch [data-theme="${isDark() ? "light" : "dark"}"]`));
  }
  onRefresh(() => { v15Head(); v15Rows(); v15Signal(); });
  // Several controls (limit, scenario, pipeline inputs, spread slider) change state without calling touch(), so the
  // row and the signal also re-read after any user input, as the live readings do. They only read state.
  {
    let queued = false;
    const later = () => { if (queued) return; queued = true; setTimeout(() => { queued = false; v15Rows(); v15Signal(); }, 0); };
    ["input", "change", "click"].forEach(ev => document.addEventListener(ev, later, true));
  }
