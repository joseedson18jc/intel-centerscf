  // ========== SIDE MENU: STEPS AND THEIR SECTIONS, TOOLS, PREFERENCES ==========
  // Markup: html/05-sidenav.html (+ tool buttons from html/slots). Styles: css/61-sidenav.css.
  // >= 1100px: fixed column, 232px or 64px (icons only; choice saved in localStorage "scf-nav").
  // <  1100px: off-canvas drawer opened by the header menu button (#navMenuBtn).
  Object.assign(I18N, {
    "sn.aria":["Cockpit menu","Menu do cockpit"],
    "sn.skip":["Skip to content","Pular para o conteúdo"],
    "sn.steps":["Steps","Etapas"],
    "sn.tools":["Tools","Ferramentas"],
    "sn.prefs":["Preferences","Preferências"],
    "sn.lang":["Language","Idioma"],
    "sn.ccy":["Currency","Moeda"],
    "sn.theme":["Theme","Tema"],
    "sn.of":["Open Finance","Open Finance"],
    "sn.collapse":["Collapse menu","Recolher menu"],
    "sn.expand":["Expand menu","Expandir menu"],
    "sn.open":["Open menu","Abrir menu"],
    "sn.close":["Close menu","Fechar menu"]
  });
  const sideNav = $("sideNav"), snBody = $("snBody"), snBackdrop = $("snBackdrop"), navMenuBtn = $("navMenuBtn"), snTip = $("snTip");
  const snRoot = document.documentElement;
  // Sections of each step: the id of the card or sub-heading it jumps to. The label is read from that heading.
  const SN_SECTIONS = {
    1:["sec-actions","sec-kpis","sec-brief","sec-adoption","sec-levers","sec-friction"],
    2:["sec-forecast","sec-cases","sec-accuracy"],
    3:["sec-pipeline","sec-anchors"],
    4:["sec-arch","sec-mkt-1","sec-mkt-2","sec-mkt-3","sec-mkt-4","products-ref"]
  };
  const snStore = {
    get() { try { return localStorage.getItem("scf-nav"); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem("scf-nav", v); } catch (e) {} }
  };
  const snDrawerMode = () => innerWidth < 1100;
  const snVisible = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
  let snCollapsed = snStore.get() === "collapsed", snHold = null, snHoldT = 0, snSpyPending = false;

  // ---------- Sections: built once, labels follow the headings on the page in each language ----------
  function snHeading(el) { return el.matches("h2,h3") ? el : el.querySelector("h3, .ref-title, h2"); }
  function snBuild() {
    Object.keys(SN_SECTIONS).forEach(n => {
      const ul = document.querySelector(`[data-sn-secs="${n}"]`); if (!ul) return;
      ul.innerHTML = SN_SECTIONS[n].filter(id => $(id)).map(id =>
        `<li><a class="sn-sec" href="#${id}" data-sn-sec="${id}" data-sn-step="${n}"><span class="sn-lbl"></span></a></li>`).join("");
    });
  }
  function snLabels() {
    document.querySelectorAll(".sn-sec").forEach(a => {
      const el = $(a.dataset.snSec), h = el && snHeading(el);
      const t = h ? h.textContent.replace(/\s+/g, " ").trim() : "";
      a.querySelector(".sn-lbl").textContent = t; a.title = t;
    });
    const c = $("snCollapseLbl"); if (c) c.textContent = L(I18N[snCollapsed ? "sn.expand" : "sn.collapse"]);
  }

  // ---------- Current step: accordion in the menu + name in the header ----------
  function syncSideNav() {
    document.querySelectorAll("[data-sn-secs]").forEach(ul => { ul.hidden = +ul.dataset.snSecs !== activeStep; });
    const n = activeStep, sn = $("tbStepName"), so = $("tbStepOf"), sb = $("tbStepN");
    if (sn) sn.textContent = L(I18N["st." + n + ".short"]);
    if (so) so.textContent = viewMode === "all" ? L(I18N["vm.all"]) + " · " + L(I18N["sp." + n]) : L(I18N["sp." + n]);
    if (sb) sb.textContent = n;
    snSpy();
  }
  stepViewHook = syncSideNav;

  // ---------- Scroll spy over the sections that are showing ----------
  function snSpy() {
    snSpyPending = false;
    const links = [...document.querySelectorAll(".sn-sec")];
    let cur = null;
    if (snHold && $(snHold) && snVisible($(snHold))) cur = snHold;
    else {
      const line = stickyHeaderH() + Math.min(140, innerHeight * 0.22);
      const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
      const shown = links.map(a => $(a.dataset.snSec)).filter(el => el && snVisible(el) && !el.closest("[data-step-panel][hidden]"));
      // Cards side by side share a top: the first of them (reading order) keeps the highlight.
      let best = -Infinity;
      shown.forEach(el => { const top = el.getBoundingClientRect().top; if ((top <= line || (atEnd && top < innerHeight - 40)) && top > best + 2) { cur = el.id; best = top; } });
    }
    links.forEach(a => { if (a.dataset.snSec === cur) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current"); });
  }
  // A section chosen in the menu stays highlighted until the reader scrolls by hand.
  const snRelease = () => { if (snHold) { snHold = null; snSpy(); } };
  ["wheel", "touchmove"].forEach(t => addEventListener(t, snRelease, {passive:true}));
  addEventListener("keydown", e => { if (/^(Page|Arrow(Up|Down)|Home|End| )/.test(e.key) && !e.target.closest("input,textarea,select,[role=dialog]")) snRelease(); });
  addEventListener("scroll", () => {
    if (snHold && performance.now() > snHoldT) snRelease();
    if (!snSpyPending) { snSpyPending = true; requestAnimationFrame(snSpy); }
    snHideTip();
  }, {passive:true});

  // Jump to a section: open its step first (step-by-step view), then bring it under the sticky header.
  function snGo(id) {
    const el = $(id); if (!el) return;
    const step = +(el.closest("[data-step-panel]") || {dataset:{}}).dataset.stepPanel || activeStep;
    if (viewMode === "step" && step !== activeStep) goStep(step, false);
    // A market module hidden by the module filter of step 4: show it through that filter.
    if (el.hidden && el.dataset.mktPanel) { const b = document.querySelector(`#mktSubnav [data-mmod="${el.dataset.mktPanel}"]`); if (b) b.click(); }
    activeStep = step; syncSideNav();
    snHold = id; snHoldT = performance.now() + 1500; snSpy();
    requestAnimationFrame(() => {
      let y = 0; for (let e = el; e; e = e.offsetParent) y += e.offsetTop;   // layout position: entrance animations do not skew it
      scrollToY(y - stickyHeaderH() - 12);
      if (!el.hasAttribute("tabindex")) { el.setAttribute("tabindex", "-1"); el.classList.add("sn-target"); }
      el.focus({preventScroll:true});
    });
  }

  // ---------- Collapse (wide screens) ----------
  function snApplyCollapse() {
    const on = snCollapsed && !snDrawerMode();
    snRoot.classList.toggle("sn-collapsed", on);
    const b = $("snCollapse"); if (b) b.setAttribute("aria-expanded", String(!snCollapsed));
    const c = $("snCollapseLbl"); if (c) c.textContent = L(I18N[snCollapsed ? "sn.expand" : "sn.collapse"]);
  }

  // ---------- Drawer (narrow screens) ----------
  const navDrawerOpen = () => snRoot.classList.contains("sn-open");
  const snFocusables = () => [...sideNav.querySelectorAll("a[href],button:not([disabled]),input:not([disabled])")].filter(snVisible);
  // opts.focus: move focus into the drawer (default true); opts.back: return focus to the menu button on close (default true).
  function setNavDrawer(open, opts = {}) {
    if (!sideNav) return;
    open = !!open && snDrawerMode();
    if (open === navDrawerOpen()) return;
    const ae = document.activeElement, inside = !ae || ae === document.body || sideNav.contains(ae);
    snRoot.classList.toggle("sn-open", open);
    if (snBackdrop) snBackdrop.hidden = !open;
    if (navMenuBtn) navMenuBtn.setAttribute("aria-expanded", String(open));
    snHideTip();
    if (open) {
      if (opts.focus !== false) { const f = sideNav.querySelector('.sn-step[aria-current="step"]') || snFocusables()[0]; if (f) f.focus({preventScroll:true}); }
    } else if (opts.back !== false && inside && navMenuBtn && snVisible(navMenuBtn)) navMenuBtn.focus({preventScroll:true});
  }

  // ---------- Tooltip for the icons-only state ----------
  function snShowTip(item) {
    if (!snTip || !snRoot.classList.contains("sn-collapsed")) return;
    const lbl = item.querySelector(".sn-lbl"), t = lbl ? lbl.textContent.trim() : "";
    if (!t) return snHideTip();
    snTip.textContent = t; snTip.hidden = false;
    const r = item.getBoundingClientRect();
    snTip.style.left = (r.right + 10) + "px";
    snTip.style.top = Math.max(6, Math.min(innerHeight - snTip.offsetHeight - 6, r.top + r.height / 2 - snTip.offsetHeight / 2)) + "px";
  }
  function snHideTip() { if (snTip) snTip.hidden = true; }

  if (sideNav) {
    snBuild(); snLabels(); snApplyCollapse();
    const sc = $("snCollapse");
    if (sc) sc.addEventListener("click", () => {
      snCollapsed = !snCollapsed; snStore.set(snCollapsed ? "collapsed" : "expanded");
      snApplyCollapse(); snHideTip();
      if (snCollapsed) snShowTip(sc);
      syncHeaderMetrics();
    });
    if (navMenuBtn) navMenuBtn.addEventListener("click", () => setNavDrawer(!navDrawerOpen()));
    if ($("snClose")) $("snClose").addEventListener("click", () => setNavDrawer(false));
    if (snBackdrop) snBackdrop.addEventListener("click", () => setNavDrawer(false));
    // Capture phase, before the tool's own handler: a tool opening its window closes the drawer, and focus moves to the
    // menu button first, so the window returns focus to a control that is still on screen when it closes.
    sideNav.addEventListener("click", e => {
      if (!navDrawerOpen()) return;
      const t = e.target.closest(".sn-item");
      if (!t || t.classList.contains("sn-step")) return;
      if (navMenuBtn) navMenuBtn.focus({preventScroll:true});
      setNavDrawer(false, {back:false});
    }, true);
    sideNav.addEventListener("click", e => {
      const sec = e.target.closest(".sn-sec");
      if (sec) { e.preventDefault(); setNavDrawer(false, {back:false}); snGo(sec.dataset.snSec); return; }
      const st = e.target.closest(".sn-step");
      // Steps are handled by 03-step-nav.js ([data-step]); in the drawer the menu then closes on the chosen step.
      if (st && navDrawerOpen()) setNavDrawer(false);
    });
    // Drawer keys: Escape closes, Tab stays inside. The guided tour handles its own keys first (capture phase).
    document.addEventListener("keydown", e => {
      if (!navDrawerOpen() || tourOpen()) return;
      if (e.key === "Escape") { e.preventDefault(); setNavDrawer(false); return; }
      if (e.key !== "Tab") return;
      const f = snFocusables(); if (!f.length) return;
      const at = f.indexOf(document.activeElement);
      if (at < 0) { e.preventDefault(); f[0].focus(); }
      else if (e.shiftKey && at === 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && at === f.length - 1) { e.preventDefault(); f[0].focus(); }
    });
    // Tooltip on hover and keyboard focus while collapsed.
    sideNav.addEventListener("pointerover", e => { const it = e.target.closest(".sn-item,#snCollapse,.brand-lockup"); if (it) snShowTip(it); });
    sideNav.addEventListener("pointerleave", snHideTip);
    sideNav.addEventListener("focusin", e => { const it = e.target.closest(".sn-item,#snCollapse,.brand-lockup"); if (it && e.target.matches(":focus-visible")) snShowTip(it); else snHideTip(); });
    sideNav.addEventListener("focusout", e => { if (!e.relatedTarget || !sideNav.contains(e.relatedTarget)) snHideTip(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") snHideTip(); });
    if (snBody) snBody.addEventListener("scroll", snHideTip, {passive:true});
    addEventListener("resize", () => { if (navDrawerOpen() && !snDrawerMode()) setNavDrawer(false, {back:false}); snApplyCollapse(); snSpy(); }, {passive:true});
  }
  // "Skip to content": focus the main column (the link is the first stop in the tab order).
  if ($("skipLink")) $("skipLink").addEventListener("click", e => {
    const m = $("top"); if (!m) return;
    e.preventDefault(); m.setAttribute("tabindex", "-1"); m.focus({preventScroll:true}); scrollToY(0);
  });
  onRefresh(() => { snLabels(); syncSideNav(); });
