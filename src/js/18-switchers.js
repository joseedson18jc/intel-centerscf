  // ========== CURRENCY, THEME & LANGUAGE SWITCHERS ==========
  function updateCcyTexts() {
    $("heroSub").textContent = T(
      `Program health, approved-limit check and where to grow next · ${BASE_SUP} suppliers and ${bn(SPEND / 1000, 1)} annual spend in scope.`,
      `Saúde do programa, checagem de limite aprovado e decisão de onde crescer · ${BASE_SUP} fornecedores e ${bn(SPEND / 1000, 1)} em compras anuais no escopo.`
    );
    $("csNote").textContent = ccy === "USD"
      ? T("Projected balance at the selected horizon, in millions of USD (PTAX R$5.89).","Saldo projetado no horizonte escolhido, em milhões de dólares (PTAX R$ 5,89).")
      : T("Projected balance at the selected horizon, in millions of reais.","Saldo projetado no horizonte escolhido, em milhões de reais.");
    $("limUnit").textContent = ccy === "USD" ? T("USD m","US$ mi") : T("R$ m","R$ mi");
    $("limit").value = Math.round(limitBRL / fx());
    const fxEl = $("fxBadge");
    fxEl.hidden = ccy !== "USD";
    fxEl.textContent = T("BCB PTAX 19 Nov 2026: R$5.89 / US$","PTAX BCB 19/11/2026: R$ 5,89 / US$");
  }
  function setCcy(c, redraw = true) {
    ccy = c === "USD" ? "USD" : "BRL";
    try { localStorage.setItem("scf-ccy", ccy); } catch (e) {}
    document.querySelectorAll(".ccy-switch button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.ccy === ccy)));
    updateCcyTexts();
    if (redraw) { renderPipeline(); renderMarket(); render(week); if (!deck.hidden) renderSlide(); if (!proofModal.hidden && activeProofKey) renderProof(activeProofKey); if (!$("m-brief").hidden) $("brief-body").innerHTML = briefHTML(); if (!$("m-ai").hidden && lastAiResult) renderAiResults(); }
  }
  function setTheme(t, redraw = true) {
    theme = t === "dark" ? "dark" : "light";
    try { localStorage.setItem("scf-theme", theme); } catch (e) {}
    document.documentElement.dataset.theme = theme;
    Object.assign(C, isDark() ? THEME_DARK : THEME_LIGHT);
    document.querySelectorAll(".theme-switch button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.theme === theme)));
    if (redraw) { renderMarket(); render(week); deciles(); if (!deck.hidden) renderSlide(); }
  }
  function setLang(l) {
    lang = l; try { localStorage.setItem("scf-lang", l); } catch (e) {}
    document.documentElement.lang = l === "pt" ? "pt-BR" : "en";
    document.title = T("SCF Brazil · Specialist weekly cockpit (concept)","Risco Sacado Brasil · Cockpit semanal do especialista (conceito)");
    document.querySelectorAll("[data-i18n]").forEach(e => { const v = I18N[e.dataset.i18n]; if (v) e.textContent = L(v); });
    document.querySelectorAll("[data-i18n-html]").forEach(e => { const v = I18N[e.dataset.i18nHtml]; if (v) e.innerHTML = L(v); });
    document.querySelectorAll("[data-i18n-aria]").forEach(e => { const v = I18N[e.dataset.i18nAria]; if (v) e.setAttribute("aria-label", L(v)); });
    document.querySelectorAll(".lang button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === l)));
    $("tk-start").textContent = WL() + "1"; $("tk-end").textContent = WL() + W;
    updateCcyTexts(); srcChip(); buildKpis(); renderPipeline(); renderMarket(); render(week); funnel(); deciles(); renderFriction(); updateClock(); updateStepView(false); syncAiStatusUi();
    $("play").setAttribute("aria-label", timer ? T("Pause weekly playback","Pausar reprodução") : L(I18N["aria.play"]));
    if (!deck.hidden) renderSlide();
    if (!proofModal.hidden && activeProofKey) renderProof(activeProofKey);
    if (!$("m-brief").hidden) $("brief-body").innerHTML = briefHTML();
  }
