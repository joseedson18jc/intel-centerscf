  // ========== STEP NAVIGATION & VIEW MODE ==========
  let activeStep = 1, viewMode = "step";
  const STEP_META = {
    1:() => ({role:T("SCF Specialist · Anchor RM","Especialista SCF · Gerente da Âncora"), cadence:T("Every Monday","Toda segunda-feira"), question:T("What are this week's actions, and where to intervene in onboarding?","Quais as ações da semana e onde intervir na adesão?")}),
    2:() => ({role:T("SCF Specialist · Credit Risk","Especialista SCF · Risco de Crédito"), cadence:T("Weekly","Semanal"), question:T("Does the projected balance fit the approved limit and 8% error tolerance?","O saldo projetado cabe no limite aprovado e na tolerância de 8%?")}),
    3:() => ({role:T("Corporate / SCF Leadership","Liderança Corporate / SCF"), cadence:T("Monthly / Quarterly","Mensal / Trimestral"), question:T("Which anchor to prioritize (3Q26 scale), with what offer and credit limit?","Qual âncora priorizar (escala 3T26), com qual oferta e quanto crédito pedir?")}),
    4:() => ({role:T("Leadership · Product","Liderança · Produto"), cadence:T("External Intelligence","Inteligência Externa"), question:T("How do competitors, CDI+x pricing, registrars and 3Q26 credit signals shape our strategy?","Como concorrentes, preço CDI+x, registradoras e sinais 3T26 orientam nossa estratégia?")})
  };
  function updateStepView(scrollToPanel = false) {
    document.querySelectorAll(".nav-step-btn").forEach(b => {
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
    if (scrollToPanel) { const t = $("panel-" + activeStep); if (t) t.scrollIntoView({behavior:"smooth", block:"start"}); }
  }
  function goStep(step, scroll = true) {
    activeStep = step;
    if (viewMode === "all") updateStepView(true);
    else { updateStepView(false); if (scroll) $("journeyBar").scrollIntoView({behavior:"smooth", block:"nearest"}); }
  }
  document.querySelectorAll("[data-step]").forEach(b => b.addEventListener("click", () => goStep(+b.dataset.step, true)));
  document.querySelectorAll("[data-go-step]").forEach(b => b.addEventListener("click", () => {
    activeStep = +b.dataset.goStep; updateStepView(false); $("panel-" + activeStep).scrollIntoView({behavior:"smooth", block:"start"});
  }));
  $("modeStep").onclick = () => { viewMode = "step"; updateStepView(false); };
  $("modeAll").onclick  = () => { viewMode = "all";  updateStepView(false); };

  // Scroll progress bar
  addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    $("scrollProg").style.width = (max > 0 ? Math.min(100, 100 * scrollY / max) : 0) + "%";
  }, {passive:true});

