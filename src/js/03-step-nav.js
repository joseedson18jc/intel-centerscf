  // ========== STEP NAVIGATION & VIEW MODE ==========
  let activeStep = 1, viewMode = "step";
  const STEP_META = {
    1:() => ({role:T("SCF Specialist · Anchor RM","Especialista SCF · Gerente da Âncora"), cadence:T("Every Monday","Toda segunda-feira"), question:T("What are this week's actions, and where to intervene in onboarding?","Quais as ações da semana e onde intervir na adesão?")}),
    2:() => ({role:T("SCF Specialist · Credit Risk","Especialista SCF · Risco de Crédito"), cadence:T("Weekly","Semanal"), question:T("Does the projected balance fit the approved limit and 8% error tolerance?","O saldo projetado cabe no limite aprovado e na tolerância de 8%?")}),
    3:() => ({role:T("Corporate / SCF Leadership","Liderança Corporate / SCF"), cadence:T("Monthly / Quarterly","Mensal / Trimestral"), question:T("Which anchor to prioritize (3Q26 scale), with what offer and credit limit?","Qual âncora priorizar (escala 3T26), com qual oferta e quanto crédito pedir?")}),
    4:() => ({role:T("Leadership · Product","Liderança · Produto"), cadence:T("External Intelligence","Inteligência Externa"), question:T("How do competitors, CDI+x pricing, registrars and 3Q26 credit signals shape our strategy?","Como concorrentes, preço CDI+x, registradoras e sinais 3T26 orientam nossa estratégia?")})
  };
  Object.assign(I18N, {
    "hdr.notice":["Functional use proven, but for now this version is illustrative only and belongs to J.E.M.Costa.","Uso funcional comprovado porém esta versão é somente por ora, ilustrativa e pertence a J.E.M.Costa."],
    "nav.present":["Present","Apresentar"], // the slide count is appended at refresh time, from SLIDES.length
    "nav.settings.short":["Settings","Configurações"],
    "nav.steps.aria":["Cockpit steps","Etapas do cockpit"],
    "jr.aria":["Decision flow in 4 steps","Fluxo de decisão em 4 etapas"],
    "vm.aria":["View mode","Modo de visualização"]
  });
  const topbarEl = document.querySelector(".topbar");
  const reducedMotion = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  // Height of the sticky header as it sits when stuck (on phones the notice scrolls away: see --notice-h in 10-topbar.css).
  function stickyHeaderH() {
    if (!topbarEl) return 0;
    const top = parseFloat(getComputedStyle(topbarEl).top) || 0;
    return Math.max(0, topbarEl.offsetHeight + Math.min(0, top));
  }
  function scrollToY(y) { window.scrollTo({top:Math.max(0, Math.round(y)), behavior:reducedMotion() ? "instant" : "smooth"}); }
  // Brings the heading of a step panel right under the sticky header. Does nothing when it is already there.
  function scrollToPanel(step, force = false) {
    const panel = $("panel-" + step); if (!panel || panel.hidden) return;
    const bar = document.querySelector(".step-toolbar");
    // On wide screens keep the context line (role and question) attached to the heading.
    const first = [...document.querySelectorAll("[data-step-panel]")].find(p => !p.hidden) === panel;
    const anchor = (first && innerWidth > 980 && bar) ? bar : (panel.querySelector(".step-banner") || panel);
    // Layout position (offsetTop chain), so the panel's entrance animation does not skew the target.
    let y = 0; for (let e = anchor; e; e = e.offsetParent) y += e.offsetTop;
    const h = stickyHeaderH(), top = y - scrollY;
    if (!force && top >= h && top <= h + innerHeight * 0.22) return;
    scrollToY(y - h - 10);
  }
  // Scroll spy: in the "everything" view, highlight the step that is being read.
  // stepViewHook: set by 31-sidenav.js, called whenever the step shown or spied changes.
  let spyStep = 0, spyPending = false, stepViewHook = null;
  function stepSpy() {
    spyPending = false;
    if (viewMode !== "all") { if (spyStep) { spyStep = 0; document.querySelectorAll(".step-card.in-view").forEach(c => c.classList.remove("in-view")); } return; }
    const line = stickyHeaderH() + Math.min(220, innerHeight * 0.3);
    let cur = 0;
    document.querySelectorAll("[data-step-panel]").forEach(p => { if (!p.hidden && p.getBoundingClientRect().top <= line) cur = +p.dataset.stepPanel; });
    if (cur === spyStep) return;
    spyStep = cur; if (cur) activeStep = cur;
    document.querySelectorAll(".sn-step").forEach(b => { if (+b.dataset.step === cur) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
    document.querySelectorAll(".step-card").forEach(c => c.classList.toggle("in-view", +c.dataset.step === cur));
    if (stepViewHook) stepViewHook();
  }
  function updateStepView(scrollToTarget = false) {
    document.querySelectorAll(".sn-step").forEach(b => {
      if (viewMode === "step" && +b.dataset.step === activeStep) b.setAttribute("aria-current", "step");
      else b.removeAttribute("aria-current");
    });
    document.querySelectorAll(".step-card").forEach(b => b.setAttribute("aria-pressed", viewMode === "all" ? "false" : String(+b.dataset.step === activeStep)));
    $("modeStep").setAttribute("aria-pressed", String(viewMode === "step"));
    $("modeAll").setAttribute("aria-pressed", String(viewMode === "all"));
    document.querySelectorAll("[data-step-panel]").forEach(p => { p.hidden = viewMode === "step" && +p.dataset.stepPanel !== activeStep; });
    document.querySelectorAll("[data-step-nav]").forEach(n => { n.style.display = viewMode === "step" ? "flex" : "none"; });
    if (viewMode === "all") {
      $("stepContext").innerHTML = `<strong>${T("Full cockpit view","Visão completa do cockpit")}</strong> · <span>${T("All 4 decision steps displayed sequentially.","Todas as 4 etapas de decisão exibidas em sequência.")}</span>`;
    } else {
      const m = STEP_META[activeStep]();
      $("stepContext").innerHTML = `<span class="role-chip">${m.role} · ${m.cadence}</span> <strong>${m.question}</strong>`;
    }
    const target = activeStep;
    spyStep = -1; stepSpy();          // in the "everything" view the spy follows the reading position...
    if (scrollToTarget) { activeStep = target; scrollToPanel(target); }   // ...but an explicit choice wins
    if (stepViewHook) stepViewHook();
  }
  function goStep(step, scroll = true) {
    activeStep = step;
    updateStepView(scroll);
  }
  document.querySelectorAll("[data-step]").forEach(b => b.addEventListener("click", () => goStep(+b.dataset.step, true)));
  document.querySelectorAll("[data-go-step]").forEach(b => b.addEventListener("click", () => goStep(+b.dataset.goStep, true)));
  $("modeStep").onclick = () => { viewMode = "step"; updateStepView(true); };
  $("modeAll").onclick  = () => { const keep = activeStep; viewMode = "all"; updateStepView(false); activeStep = keep; scrollToPanel(keep); };

  // Scroll progress bar + scroll spy
  addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    $("scrollProg").style.width = (max > 0 ? Math.min(100, 100 * scrollY / max) : 0) + "%";
    if (viewMode === "all" && !spyPending) { spyPending = true; requestAnimationFrame(stepSpy); }
  }, {passive:true});

  // ========== HEADER: STICKY METRICS, DERIVED LABELS ==========
  // The tools and preferences live in the side menu (31-sidenav.js); the header keeps the notice, the step name and the week control.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => syncHeaderMetrics());
  function syncHeaderMetrics() {
    const n = document.querySelector(".header-notice"), root = document.documentElement;
    root.style.setProperty("--notice-h", (n ? n.offsetHeight : 0) + "px");
    root.style.scrollPaddingTop = (stickyHeaderH() + 12) + "px";
  }
  addEventListener("resize", () => { syncHeaderMetrics(); if (viewMode === "all") stepSpy(); }, {passive:true});
  onRefresh(() => {
    // The slide count comes from the deck itself (SLIDES is defined later, in 16-deck.js).
    let n = 0; try { n = SLIDES.length; } catch (e) {}
    if (n) {
      I18N["nav.present"] = [`Present (${n})`, `Apresentar (${n})`];
      I18N["nav.present.end"] = [`Open executive presentation (${n} slides)`, `Abrir apresentação executiva (${n} slides)`];
      document.querySelectorAll('[data-i18n="nav.present"],[data-i18n="nav.present.end"]').forEach(e => { e.textContent = L(I18N[e.dataset.i18n]); });
    }
    syncHeaderMetrics();
  });
