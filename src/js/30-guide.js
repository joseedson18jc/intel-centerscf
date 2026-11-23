
  // ========== GUIDE: FIRST-RUN TOUR, STEP TIPS, FIELD HINTS ==========
  // Markup: html/slots/guide-button.html, guide-layer.html, tips-N.html. Styles: css/60-guide.css.
  // Persistence (localStorage): scf-tour-done, scf-tip-1..4, scf-hints.
  Object.assign(I18N, {
    "gd.btn":["Guide","Guia"],
    "gd.menu.h":["Help with using the cockpit","Ajuda para usar o cockpit"],
    "gd.menu.tour":["Take the guided tour","Fazer o tour guiado"],
    "gd.menu.tour.n":["8 stops, about 1 minute","8 paradas, cerca de 1 minuto"],
    "gd.menu.tips":["Show the tips again","Mostrar as dicas de novo"],
    "gd.menu.hints":["Field explanations","Explicações dos campos"],
    "tip.lbl":["How to use this step","Como usar esta etapa"],
    "tip.close":["Dismiss this tip","Dispensar esta dica"],
    "tip.1":["Start with the action plan, then check the indicators and alerts behind it. Move the week slider at the top to see how the program evolved, and click any card to see its calculation.",
             "Comece pelo plano de ação e depois confira os indicadores e alertas que o sustentam. Mova o controle de semanas no topo para ver a evolução do programa e clique em qualquer card para ver o cálculo."],
    "tip.2":["Check whether the projected balance fits the approved limit. Change the limit, the scenario and the horizon: the chart, the verdict and the action plan update at once.",
             "Veja se o saldo projetado cabe no limite aprovado. Altere o limite, o cenário e o horizonte: o gráfico, o veredito e o plano de ação se atualizam na hora."],
    "tip.3":["See which anchor offers the largest potential flow. Edit the assumptions in the table or pick a quick scenario: flow, balance and spread revenue are recalculated.",
             "Veja qual âncora oferece o maior fluxo potencial. Edite as hipóteses na tabela ou escolha um cenário rápido: fluxo, saldo e receita de spread são recalculados."],
    "tip.4":["Compare competitors, prices and share by anchor, and move the proposed-rate slider to test a CDI + rate against the market bands. The competitor and market figures in this step are fabricated for the demo, not real market data.",
             "Compare concorrentes, preços e participação por âncora e mova o controle da taxa proposta para testar um CDI + contra as faixas de mercado. Os números de concorrentes e de mercado desta etapa são fabricados para a demonstração, não dados reais de mercado."]
  });
  const guideStore = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  const guideLayer = $("guideLayer"), guideCard = $("guideCard"), guideSpot = $("guideSpot"), guideMenu = $("guideMenu"), hintPop = $("hintPop");
  const guideSmall = () => innerWidth <= 680;
  // Touch-first device: no hover, so field hints come from the first tap on a control (see section 3).
  const hintTouch = () => !!(window.matchMedia && matchMedia("(hover: none)").matches);
  const guideVisible = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
  const guideSlideCount = () => { try { return SLIDES.length; } catch (e) { return 0; } };
  const tourOpen = () => !!guideLayer && !guideLayer.hidden;
  // True while a modal, the proof view or the presentation deck is showing: the guide never starts on top of them.
  const guideBlocked = () => !!document.querySelector('.modal-backdrop:not([hidden]),[role="dialog"]:not([hidden]):not(#guideCard)');

  // ---------- 1. Guided tour ----------
  // sel: CSS selector (several matches are framed together); selSmall replaces it on phones.
  // step: step panel that must be showing; menu: the target sits in the side menu, so on narrow screens the drawer opens.
  const TOUR = [
    { sel:".hero > div:first-child",
      title:["Welcome to the weekly cockpit","Bem-vindo ao cockpit semanal"],
      text:() => SRCINFO
        ? T("This cockpit helps a supply chain finance specialist review the program every week: its health, the approved-limit check and where to grow next. It is now running on the data you loaded.",
            "Este cockpit ajuda o especialista de risco sacado a revisar o programa toda semana: a saúde, a checagem do limite aprovado e onde crescer. Agora ele roda com os dados que você carregou.")
        : T("This cockpit helps a supply chain finance specialist review the program every week: its health, the approved-limit check and where to grow next. It runs on example data until you load your own.",
            "Este cockpit ajuda o especialista de risco sacado a revisar o programa toda semana: a saúde, a checagem do limite aprovado e onde crescer. Ele roda com dados de exemplo até você carregar os seus.") },
    { sel:".week-bar",
      title:["Move through the weeks","Navegue pelas semanas"],
      text:() => T("Drag the slider or press play to move through the weekly history. The indicators, the projection and the action plan are recalculated for the week you choose.",
                   "Arraste o controle ou aperte o play para percorrer o histórico semanal. Os indicadores, a projeção e o plano de ação são recalculados para a semana escolhida.") },
    { sel:"#topStepNav", menu:true,
      title:["Four steps, one decision in each","Quatro etapas, uma decisão em cada"],
      text:() => T("The work is split into four steps: diagnose, project the balance, size the pipeline and read the market. Open a step in this menu; the sections of the open step are listed under it and the highlight follows your reading.",
                   "O trabalho se divide em quatro etapas: diagnosticar, projetar o saldo, dimensionar o pipeline e ler o mercado. Abra uma etapa neste menu; as seções da etapa aberta aparecem logo abaixo dela e o destaque acompanha a leitura.") },
    { sel:".actions-card", step:1,
      title:["Your action plan for the week","Seu plano de ação da semana"],
      text:() => T("This list is generated from the limit check, the forecast error, risk alerts, the onboarding funnel, the pipeline and market pricing. Tick an action when it is done; the tick is saved on this device.",
                   "Esta lista é gerada a partir da checagem de limite, do erro de projeção, dos alertas de risco, do funil de adesão, do pipeline e do preço de mercado. Marque uma ação quando concluir; a marcação fica salva neste dispositivo.") },
    { sel:"#kpis > :first-child", step:1,
      title:["Every number can be checked","Todo número pode ser conferido"],
      text:() => T("Click any indicator or card in this step to open the calculation behind it: the formula and the numbers that feed it.",
                   "Clique em qualquer indicador ou card desta etapa para abrir o cálculo por trás dele: a fórmula e os números que a alimentam.")
        + (SRCINFO ? "" : T(" The values are example data, so the proof shows how a number is built; it is not an audited figure.",
                            " Os valores são dados de exemplo, então a prova mostra como o número é construído; não é um valor auditado.")) },
    { sel:"#openData", menu:true,
      title:["Use your own data","Use os seus dados"],
      text:() => T("Download the CSV template, replace the example with your weekly extract and load it back. Everything stays in this browser; nothing is sent anywhere.",
                   "Baixe o modelo CSV, troque o exemplo pela sua extração semanal e carregue de volta. Tudo fica neste navegador; nada é enviado para fora.") },
    { sel:".sidenav .sn-pref", menu:true,
      title:["Currency, language and theme","Moeda, idioma e tema"],
      text:() => T("Switch between reais and dollars, Portuguese and English, light and dark. Your choices are remembered on this device.",
                   "Alterne entre reais e dólares, português e inglês, claro e escuro. Suas escolhas ficam salvas neste dispositivo.") },
    { sel:"#openDeck", menu:true,
      title:["Presentation mode","Modo apresentação"],
      text:() => { const n = guideSlideCount(), sl = n ? T(` (${n} slides)`, ` (${n} slides)`) : "";
        return T(`Opens the executive presentation${sl} over the cockpit, in the language and currency you selected. You can reopen this tour at any time from Guide, in the side menu.`,
                 `Abre a apresentação executiva${sl} sobre o cockpit, no idioma e na moeda selecionados. Você pode reabrir este tour a qualquer momento pelo item Guia, no menu lateral.`); } }
  ];
  let tourIdx = 0, tourRaf = 0, tourPlace = "below", tourReturn = null;
  function tourTargets(st) {
    const sel = guideSmall() && st.selSmall ? st.selSmall : st.sel;
    return [...document.querySelectorAll(sel)].filter(guideVisible);
  }
  function tourRect(els) {
    let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
    els.forEach(e => { const q = e.getBoundingClientRect(); l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom); });
    return {left:l, top:t, right:r, bottom:b, width:r - l, height:b - t};
  }
  // Runs every frame while the tour is open, so the frame follows scrolling, re-renders and resizes.
  // A host can pin its own badge to the bottom-right corner of the page (hosting badges do). The tour card and its
  // buttons stay this far above the bottom edge so they are never under it. Matches bottom:84px in 60-guide.css.
  const TOUR_CLEAR = 72;
  function tourFrame() {
    if (!tourOpen()) return;
    const st = TOUR[tourIdx], els = tourTargets(st), pad = 6, vw = innerWidth, vh = innerHeight;
    const cardH = guideCard.offsetHeight, cardW = guideCard.offsetWidth;
    const docked = guideSmall() || tourPlace === "docked" || !els.length;
    guideCard.classList.toggle("docked", docked);
    if (!els.length) {
      guideSpot.classList.add("none");
      Object.assign(guideSpot.style, {left:"50%", top:"50%", width:"0px", height:"0px"});
    } else {
      const r = tourRect(els);
      // Never frame more than the free area: tall targets are clipped above the docked card.
      const floor = Math.max(0, r.top - pad), ceil = Math.min(docked ? vh - cardH - (guideSmall() ? 8 : TOUR_CLEAR + 24) : vh, r.bottom + pad);
      guideSpot.classList.remove("none");
      Object.assign(guideSpot.style, {left:Math.max(4, r.left - pad) + "px", top:floor + "px", width:Math.min(vw - 8, r.right + pad) - Math.max(4, r.left - pad) + "px", height:Math.max(0, ceil - floor) + "px"});
      if (!docked && tourPlace === "side") {
        // Targets in the side menu: the card sits beside the menu, level with the target.
        guideCard.style.left = Math.min(vw - cardW - 12, r.right + pad + 14) + "px";
        guideCard.style.top = Math.min(vh - cardH - TOUR_CLEAR, Math.max(12, r.top + r.height / 2 - cardH / 2)) + "px";
      } else if (!docked) {
        const left = Math.min(vw - cardW - 12, Math.max(12, r.left + r.width / 2 - cardW / 2));
        const top = Math.min(vh - cardH - TOUR_CLEAR, Math.max(12, r.bottom + pad + 12));
        guideCard.style.left = left + "px"; guideCard.style.top = top + "px";
      }
    }
    if (docked) { guideCard.style.left = ""; guideCard.style.top = ""; }
    tourRaf = requestAnimationFrame(tourFrame);
  }
  function tourShow(i) {
    tourIdx = Math.max(0, Math.min(TOUR.length - 1, i));
    const st = TOUR[tourIdx], last = tourIdx === TOUR.length - 1;
    if (st.step && viewMode === "step" && activeStep !== st.step) goStep(st.step, false);
    // Targets in the side menu: on narrow screens it is a drawer, opened (without taking focus) to show them.
    if (st.menu && !tourTargets(st).length) setNavDrawer(true, {focus:false}); else if (!st.menu) setNavDrawer(false, {back:false});
    $("guideCount").textContent = T(`Step ${tourIdx + 1} of ${TOUR.length}`, `Passo ${tourIdx + 1} de ${TOUR.length}`);
    $("guideDots").innerHTML = TOUR.map((_, k) => `<i${k === tourIdx ? ' class="on"' : ""}></i>`).join("");
    $("guideTitle").textContent = L(st.title);
    $("guideText").textContent = st.text();
    $("guideSkip").textContent = T("Skip the tour","Pular o tour"); $("guideSkip").hidden = last;
    $("guideBack").textContent = T("Back","Voltar"); $("guideBack").hidden = tourIdx === 0;
    $("guideNext").textContent = last ? T("Done","Concluir") : T("Next","Próximo");
    guideCard.setAttribute("aria-label", T("Guided tour","Tour guiado"));
    // Keep the target in view: under the sticky header, with room for the card.
    const els = tourTargets(st), cardH = guideCard.offsetHeight, small = guideSmall();
    tourPlace = "below";
    // Inside the menu, scroll its own list so the target clears the card docked at the bottom of a phone screen.
    const menuBody = els.length && els[0].closest(".sn-body");
    // On a phone the card covers the bottom of the drawer: room below the list lets it scroll the target clear of it.
    const snb = $("snBody"); if (snb) snb.style.paddingBottom = menuBody && small ? (cardH + 16) + "px" : "";
    if (menuBody) { const r0 = tourRect(els), mb = menuBody.getBoundingClientRect(), room = innerHeight - (small ? cardH + 16 : 24); if (r0.bottom > room || r0.top < mb.top) menuBody.scrollTop += r0.top - Math.max(mb.top + 8, Math.min(r0.top, room - r0.height)); }
    if (els.length) {
      const r = tourRect(els), fixed = !!els[0].closest(".topbar,.sidenav");
      const top0 = (typeof stickyHeaderH === "function" ? stickyHeaderH() : 0) + 14;
      const freeH = innerHeight - top0 - TOUR_CLEAR;
      if (fixed && !small && els[0].closest(".sidenav") && r.right + 14 + guideCard.offsetWidth <= innerWidth - 12) tourPlace = "side";
      else if (fixed) { if (r.bottom + 18 + cardH > innerHeight - TOUR_CLEAR) tourPlace = "docked"; }
      else {
        const need = r.height + 18 + cardH;
        let want;
        if (small) { const room = innerHeight - cardH - top0 - 14; want = r.height < room ? top0 + (room - r.height) / 2 : top0; }
        else if (need <= freeH) want = top0 + Math.min(120, (freeH - need) / 2);
        else { tourPlace = "docked"; want = top0; }
        const maxY = document.documentElement.scrollHeight - innerHeight;
        const y = Math.max(0, Math.min(maxY, scrollY + r.top - want));
        // If the page cannot scroll far enough for the card to sit below the target, dock the card instead.
        if (!small && tourPlace === "below" && (r.top - (y - scrollY)) + need > innerHeight - TOUR_CLEAR) tourPlace = "docked";
        if (Math.abs(y - scrollY) > 2) window.scrollTo({top:y, behavior:reducedMotion() ? "instant" : "smooth"});
      }
    }
    guideCard.style.animation = "none"; void guideCard.offsetWidth; guideCard.style.animation = "";
    $("guideNext").focus({preventScroll:true});
  }
  function startTour() {
    if (!guideLayer || tourOpen() || guideBlocked()) return false;
    setPlaying(false); closeGuideMenu(false); hideHint();
    tourReturn = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
    guideLayer.hidden = false;
    tourShow(0);
    cancelAnimationFrame(tourRaf); tourRaf = requestAnimationFrame(tourFrame);
    return true;
  }
  function endTour() {
    if (!tourOpen()) return;
    guideLayer.hidden = true; cancelAnimationFrame(tourRaf);
    guideStore.set("scf-tour-done", "1");
    setNavDrawer(false, {back:false});
    const snb = $("snBody"); if (snb) snb.style.paddingBottom = "";
    window.scrollTo({top:0, behavior:reducedMotion() ? "instant" : "smooth"});
    // The drawer is closing (its items stay painted for a moment): never send focus into it.
    const back = [tourReturn, $("openGuide"), $("navMenuBtn")].find(el => guideVisible(el) && !(snDrawerMode() && el.closest(".sidenav")));
    if (back) back.focus({preventScroll:true});
  }
  if (guideLayer) {
    $("guideNext").onclick = () => { if (tourIdx >= TOUR.length - 1) endTour(); else tourShow(tourIdx + 1); };
    $("guideBack").onclick = () => tourShow(tourIdx - 1);
    $("guideSkip").onclick = endTour;
    // Capture phase: while the tour is open its keys never reach the week / deck shortcuts.
    document.addEventListener("keydown", e => {
      if (!tourOpen()) return;
      const k = e.key;
      if (k === "Escape") { e.preventDefault(); e.stopPropagation(); endTour(); return; }
      if (k === "ArrowRight" || k === "ArrowLeft") {
        e.preventDefault(); e.stopPropagation();
        if (k === "ArrowRight") $("guideNext").click(); else if (tourIdx > 0) $("guideBack").click();
        return;
      }
      if (k === "Enter" && !(e.target.closest && e.target.closest("#guideCard button"))) { e.preventDefault(); e.stopPropagation(); $("guideNext").click(); return; }
      if (k === "Tab") {
        const f = [...guideCard.querySelectorAll("button")].filter(guideVisible), at = f.indexOf(document.activeElement);
        e.preventDefault(); e.stopPropagation();
        if (f.length) f[(at < 0 ? 0 : at + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus({preventScroll:true});
        return;
      }
      e.stopPropagation();
    }, true);
    // Focus cannot leave the card while the tour is open.
    document.addEventListener("focusin", e => { if (tourOpen() && !guideCard.contains(e.target)) $("guideNext").focus({preventScroll:true}); });
    // First visit: start once the first render is done, never over the deck or a modal.
    // Owner's rule: the quick tutorial opens on EVERY load, for every user (it has a visible Skip). "?notour" in the
    // address skips it (used by the automated tests and handy for a deep link).
    if (!/[?&]notour\b/.test(location.search)) setTimeout(() => { if (!guideBlocked() && !navDrawerOpen()) startTour(); }, 600);
  }

  // ---------- 2. Guide menu + contextual tips ----------
  const TIP_IDS = [1, 2, 3, 4];
  const tipEl = n => document.querySelector(`[data-tip="${n}"]`);
  const hintsOn = () => guideStore.get("scf-hints") !== "0";
  function syncTips() { TIP_IDS.forEach(n => { const el = tipEl(n); if (el) el.hidden = guideStore.get("scf-tip-" + n) === "1"; }); }
  function syncGuideMenu() {
    if (!guideMenu) return;
    const hiddenTips = TIP_IDS.filter(n => tipEl(n) && guideStore.get("scf-tip-" + n) === "1").length;
    $("guideTips").disabled = false;
    $("guideTipsNote").textContent = hiddenTips
      ? T(`${hiddenTips} of ${TIP_IDS.length} step tips dismissed`, `${hiddenTips} de ${TIP_IDS.length} dicas de etapa dispensadas`)
      : T("All step tips are showing","Todas as dicas de etapa estão visíveis");
    $("guideHints").setAttribute("aria-checked", String(hintsOn()));
    $("guideHintsNote").textContent = !hintsOn() ? T("Off","Desligadas")
      : hintTouch() ? T("On: shown the first time you tap each control, and when you type in a field","Ligadas: aparecem no primeiro toque em cada controle e ao digitar em um campo")
      : T("On: shown when you hover or focus a control","Ligadas: aparecem ao passar o mouse ou focar um controle");
  }
  function placeGuideMenu() {
    if (guideSmall()) { guideMenu.style.left = guideMenu.style.top = ""; return; }
    const a = [$("openGuide"), $("navMenuBtn")].find(guideVisible);
    const r = a ? a.getBoundingClientRect() : {left:16, right:innerWidth - 16, top:60, bottom:60};
    const w = guideMenu.offsetWidth, h = guideMenu.offsetHeight;
    // Opened from the side menu: beside the Guide item; otherwise under the button that opened it.
    if (a && a.closest(".sidenav")) {
      guideMenu.style.left = Math.min(innerWidth - w - 8, r.right + 10) + "px";
      guideMenu.style.top = Math.max(8, Math.min(innerHeight - h - 8, r.top - 8)) + "px";
      return;
    }
    guideMenu.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.right - w)) + "px";
    guideMenu.style.top = (r.bottom + 8) + "px";
  }
  function openGuideMenu() {
    if (!guideMenu) return;
    hideHint(); syncGuideMenu();
    guideMenu.hidden = false; placeGuideMenu();
    const b = $("openGuide"); if (b) b.setAttribute("aria-expanded", "true");
    $("guideStart").focus({preventScroll:true});
  }
  function closeGuideMenu(refocus = true) {
    if (!guideMenu || guideMenu.hidden) return;
    guideMenu.hidden = true;
    const b = $("openGuide"); if (b) b.setAttribute("aria-expanded", "false");
    if (refocus) { const back = [b, $("navMenuBtn")].find(guideVisible); if (back) back.focus({preventScroll:true}); }
  }
  if (guideMenu) {
    const gb = $("openGuide");
    // stopPropagation: the document click handler below must not close the menu this click opens.
    if (gb) gb.addEventListener("click", e => { e.stopPropagation(); if (guideMenu.hidden) openGuideMenu(); else closeGuideMenu(); });
    $("guideStart").onclick = () => { closeGuideMenu(false); startTour(); };
    $("guideTips").onclick = () => {
      TIP_IDS.forEach(n => guideStore.del("scf-tip-" + n)); syncTips(); syncGuideMenu();
      closeGuideMenu(false);
      // Take the reader to the tip of the step that is showing.
      const el = tipEl(activeStep);
      if (guideVisible(el)) { scrollToPanel(activeStep, true); el.setAttribute("tabindex", "-1"); el.focus({preventScroll:true}); }
    };
    $("guideHints").onclick = () => { guideStore.set("scf-hints", hintsOn() ? "0" : "1"); hideHint(); syncGuideMenu(); };
    document.addEventListener("click", e => { if (!guideMenu.hidden && !e.target.closest("#guideMenu,#openGuide")) closeGuideMenu(false); });
    document.addEventListener("keydown", e => {
      if (guideMenu.hidden) return;
      if (e.key === "Escape") { e.stopPropagation(); closeGuideMenu(); }
      else if (e.key === "Tab") {
        const f = [...guideMenu.querySelectorAll("button")], at = f.indexOf(document.activeElement);
        if ((e.shiftKey && at <= 0) || (!e.shiftKey && at === f.length - 1)) { e.preventDefault(); closeGuideMenu(); }
      }
    }, true);
    addEventListener("resize", () => { if (!guideMenu.hidden) placeGuideMenu(); }, {passive:true});
  }
  document.addEventListener("click", e => {
    const x = e.target.closest("[data-tip-close]"); if (!x) return;
    guideStore.set("scf-tip-" + x.dataset.tipClose, "1"); syncTips(); syncGuideMenu();
  });
  syncTips();

  // ---------- 3. Field hints ----------
  // selector -> hint. Resolved at event time through delegation, so re-rendered controls keep working.
  const HINTS = [
    ["#limit, .limit-ctl", () => T("Credit limit approved for the program, in millions of the selected currency. The chart and the action plan compare the projected balance with this number.",
                                   "Limite de crédito aprovado para o programa, em milhões na moeda selecionada. O gráfico e o plano de ação comparam o saldo projetado com este número.")],
    ["#scenarioGroup", () => T(`Growth assumed in the projection: ${L(I18N["sc.Base"])} keeps the recent weekly growth, ${L(I18N["sc.Downside"])} takes off half of that growth and ${L(I18N["sc.Upside"])} adds half.`,
                               `Crescimento assumido na projeção: ${L(I18N["sc.Base"])} mantém o crescimento semanal recente, ${L(I18N["sc.Downside"])} tira metade desse crescimento e ${L(I18N["sc.Upside"])} soma metade.`)],
    ["#horizonGroup", () => T("How many weeks ahead the balance is projected. The limit check looks at every week of this horizon.",
                              "Quantas semanas à frente o saldo é projetado. A checagem de limite considera todas as semanas desse horizonte.")],
    [".pipe-presets", () => T("Fills coverage, adoption, utilization, tenor and spread for every anchor with a conservative, base or stretch set of assumptions.",
                              "Preenche cobertura, adesão, utilização, prazo e spread de todas as âncoras com um conjunto de hipóteses conservador, base ou de expansão.")],
    ["#pipe-rows input", () => T("Assumption for this anchor, in %. Change it and flow, balance and revenue are recalculated; the action plan follows the anchor ranked first.",
                                 "Hipótese desta âncora, em %. Ao alterar, fluxo, saldo e receita são recalculados; o plano de ação acompanha a âncora em 1º lugar.")],
    ["#g-tenor", () => T("Average number of days discounted. It turns the annual flow into the implied balance (flow × days ÷ 365).",
                         "Prazo médio antecipado, em dias. Transforma o fluxo anual em saldo implícito (fluxo × dias ÷ 365).")],
    ["#g-spread", () => T("Annual spread earned on the balance. Spread revenue = implied balance × this rate.",
                          "Spread anual ganho sobre o saldo. Receita de spread = saldo implícito × esta taxa.")],
    ["#mktSpreadSlider", () => T("The rate you would propose, as CDI + x% a year. Anchors whose example market band sits below it are flagged, and a pricing action enters the action plan.",
                                 "A taxa que você proporia, em CDI + x% ao ano. As âncoras cuja faixa de mercado de exemplo fica abaixo dela são sinalizadas, e uma ação de preço entra no plano de ação.")],
    [".view-toggle", () => T(`"${L(I18N["vm.step"])}" shows one step at a time. "${L(I18N["vm.all"])}" shows the four steps on one page.`,
                             `"${L(I18N["vm.step"])}" mostra uma etapa por vez. "${L(I18N["vm.all"])}" mostra as quatro etapas em uma só página.`)],
    ["#src-chip", () => T("Where the numbers come from: example data or the CSV you loaded. Click to load or replace the data.",
                          "De onde vêm os números: dados de exemplo ou o CSV que você carregou. Clique para carregar ou trocar os dados.")],
    ["#play", () => T("Plays the weekly history forward, one week every few seconds. Press again to pause.",
                      "Reproduz o histórico semanal, uma semana a cada poucos segundos. Aperte de novo para pausar.")],
    ["#topStepNav", () => T("The four steps. The sections of the open step are listed under it: click one to go straight there. The highlight follows your reading.",
                            "As quatro etapas. As seções da etapa aberta aparecem logo abaixo dela: clique em uma para ir direto até ela. O destaque acompanha a leitura.")]
  ];
  let hintAnchor = null, hintTimer = 0, hintMuted = null, hintDescribed = null, hintPointer = "", hintTouchT = 0, hintScrollT = 0;
  const hintSeen = new Set();
  const hintFor = t => { if (!t || !t.closest) return null; for (const [sel, text] of HINTS) { const a = t.closest(sel); if (a) return {a, text}; } return null; };
  function hideHint() {
    clearTimeout(hintTimer);
    if (hintDescribed) { if (hintDescribed.getAttribute("aria-describedby") === "hintPop") hintDescribed.removeAttribute("aria-describedby"); hintDescribed = null; }
    hintAnchor = null; if (hintPop) hintPop.hidden = true;
  }
  function showHint(a, text, describe) {
    if (!hintPop || !hintsOn() || tourOpen() || guideBlocked() || !a.isConnected || a === hintMuted) return;
    hideHint();
    hintAnchor = a; hintPop.textContent = text(); hintPop.hidden = false;
    // Above the control when there is room, otherwise below; never on top of it.
    // In a table the headings above say which column is being edited, so there the hint goes below first.
    // In the side menu (wide screens) it goes beside the menu, so it covers neither the menu nor the control.
    const r = a.getBoundingClientRect(), w = hintPop.offsetWidth, h = hintPop.offsetHeight, gap = 8;
    const top0 = typeof stickyHeaderH === "function" ? stickyHeaderH() : 0;
    const side = a.closest(".sidenav");
    if (side && !snDrawerMode()) {
      hintPop.style.left = (side.getBoundingClientRect().right + 10) + "px";
      hintPop.style.top = Math.max(8, Math.min(innerHeight - h - 8, r.top)) + "px";
    } else {
      const above = r.top - gap - h >= top0 + 4, below = r.bottom + gap + h <= innerHeight - 4;
      if (!above && !below) { hideHint(); return; }
      const up = above && !(below && a.closest("table"));
      hintPop.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + "px";
      hintPop.style.top = (up ? r.top - gap - h : r.bottom + gap) + "px";
    }
    if (describe && !describe.hasAttribute("aria-describedby")) { describe.setAttribute("aria-describedby", "hintPop"); hintDescribed = describe; }
  }
  if (hintPop) {
    document.addEventListener("pointerover", e => {
      if (e.pointerType !== "mouse") return;
      const hit = hintFor(e.target);
      if (!hit) return;
      if (hit.a === hintAnchor) return;
      clearTimeout(hintTimer); hintTimer = setTimeout(() => showHint(hit.a, hit.text, null), 380);
    });
    document.addEventListener("pointerout", e => {
      if (e.pointerType !== "mouse") return;
      const hit = hintFor(e.target); if (!hit) return;
      if (e.relatedTarget && hit.a.contains(e.relatedTarget)) return;
      if (hit.a === hintMuted) hintMuted = null;
      clearTimeout(hintTimer); if (hit.a === hintAnchor && !hit.a.contains(document.activeElement)) hideHint();
    });
    document.addEventListener("focusin", e => {
      const hit = hintFor(e.target);
      if (!hit) { if (hintAnchor) hideHint(); return; }
      let kb = true; try { kb = e.target.matches(":focus-visible"); } catch (_) {}
      if (kb && hit.a !== hintAnchor) showHint(hit.a, hit.text, e.target);
    });
    document.addEventListener("focusout", e => { const hit = hintFor(e.target); if (hit) { if (hit.a === hintMuted) hintMuted = null; if (hit.a === hintAnchor && !(e.relatedTarget && hit.a.contains(e.relatedTarget))) hideHint(); } });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && hintAnchor) { hintMuted = hintAnchor; hideHint(); } });
    document.addEventListener("pointerdown", e => { hintPointer = e.pointerType; if (hintAnchor && e.pointerType !== "mouse") hideHint(); });
    // Touch: there is no hover, so a control explains itself on its first tap (once per control and page visit).
    // Typed fields already get their hint on focus. Capture phase: the control's own handler may re-render what was tapped.
    document.addEventListener("click", e => {
      if (hintPointer === "mouse" || !hintPointer || e.detail === 0) return;
      const hit = hintFor(e.target); if (!hit || e.target.closest("input:not([type=range]),textarea,select")) return;
      const k = HINTS.findIndex(x => x[1] === hit.text); if (hintSeen.has(k)) return;
      // A control that scrolls the page (the view switch, for one) explains itself once the page stops moving.
      const show = n => {
        if (performance.now() - hintScrollT < 160 && n < 20) { setTimeout(() => show(n + 1), 120); return; }
        showHint(hit.a, hit.text, null);
        if (hintAnchor === hit.a) { hintSeen.add(k); clearTimeout(hintTouchT); hintTouchT = setTimeout(() => { if (hintAnchor === hit.a) hideHint(); }, 5000); }
      };
      setTimeout(() => show(0), 120);
    }, true);
    addEventListener("scroll", () => { hintScrollT = performance.now(); if (hintAnchor) hideHint(); }, {passive:true, capture:true});
    addEventListener("resize", () => { if (hintAnchor) hideHint(); }, {passive:true});
  }

  // Language, currency, data or week changed: refresh the texts that are generated here.
  onRefresh(() => {
    syncGuideMenu();
    if (hintAnchor && !hintAnchor.isConnected) hideHint();
    if (tourOpen()) { const st = TOUR[tourIdx]; $("guideTitle").textContent = L(st.title); $("guideText").textContent = st.text(); }
  });
