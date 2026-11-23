// Smoke test: opens dist/index.html in headless Chromium and exercises the app through its own controls.
// Usage: node tools/smoke.mjs   (requires Playwright; exits 1 on any failure)
//
// What it does, at 1440 and 390 wide:
//   1. language, currency, theme, step navigation, week slider, full view (the original checks);
//   2. sets the FX rate in the Data modal and checks the labels follow it (and that no "PTAX" claim is left);
//   3. for every language x currency x dataset: opens every modal and every Step 1 proof, opens the deck and walks every slide;
//   4. one extra deck walk in dark theme;
//   5. side menu: labels match the headings, accordion, jump to a section (switching step first), scroll spy, every
//      tool opens its window from the menu and gives focus back; wide: expanded/collapsed, tooltip, remembered state,
//      no overflow at 1100/1280/1440/1920; phone: drawer (focus trap, Escape, backdrop, scroll lock, focus return);
//   6. the guided tour on clean storage, every stop framing a real visible element.
// It fails on: page errors, console errors, a control that is missing or does nothing, "NaN" / "undefined" / "null" /
// "[object Object]" / "Infinity" in visible text, zero placeholders such as "R$0.000bn" in the deck, horizontal page
// overflow (checked after every state at both widths) and a deck slide or dialog wider than a 390 px screen.
// The app is one closure with no globals, so everything is driven through the DOM. Controls that another module may or
// may not ship (dataset switch, FX field, Open Finance, assistant) are looked up first and skipped with a note if absent.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const url = "file://" + join(dirname(fileURLToPath(import.meta.url)), "..", "dist", "index.html");
const errs = [], notes = [];
const BAD = String.raw`\bNaN\b|undefined|\bnull\b|\[object Object\]|Infinity`;
const ZERO = String.raw`(?:R\$|US\$|\$)\s?0[.,]0{2,}\s?(?:bn|bi|m|mi|k|mil)?(?![0-9])`;   // "R$0.000bn", "US$ 0,00 bi"
const b = await chromium.launch();
for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 800 }]) {
  const ctx = await b.newContext({ viewport: vp, locale: "pt-BR" });
  const p = await ctx.newPage(); p.setDefaultTimeout(5000);
  const tag = vp.width + ": ";
  const fail = m => { if (errs.length < 60) errs.push(tag + m); };
  p.on("pageerror", e => fail("PAGEERROR " + e.message));
  p.on("console", m => { if (m.type() === "error" && !/net::ERR|Failed to load resource/.test(m.text())) fail(m.text()); });
  await p.goto(url + "?notour"); await p.waitForTimeout(700);
  await p.evaluate(() => { try { localStorage.setItem("scf-tour-done", "1"); } catch (e) {} });
  await p.reload(); await p.waitForTimeout(700);
  const step = async (name, fn) => { try { await fn(); } catch (e) { fail("STEP " + name + ": " + String(e.message).split("\n")[0]); } };
  const wait = ms => p.waitForTimeout(ms);
  // Clicks through the DOM (not blocked by overlays). Returns false when the element does not exist.
  const click = (sel) => p.evaluate(s => { const e = document.querySelector(s); if (!e) return false; e.click(); return true; }, sel);
  const has = sel => p.evaluate(s => !!document.querySelector(s), sel);
  // Visible-text and overflow checks for the current state. scope = selector whose text is checked (default: body).
  const check = async (label, scope = "body", opts = {}) => {
    const r = await p.evaluate(({ scope, BAD, ZERO, zero, box }) => {
      const el = document.querySelector(scope); if (!el) return { missing: true };
      const txt = el.innerText || "";
      const grab = re => (txt.match(new RegExp(".{0,30}(?:" + re + ").{0,30}", "g")) || []).slice(0, 3).map(s => s.replace(/\s+/g, " "));
      const out = { bad: grab(BAD), zero: zero ? grab(ZERO) : [], sw: document.documentElement.scrollWidth, len: txt.trim().length };
      if (box) { const bx = document.querySelector(box); if (bx) { out.boxSw = bx.scrollWidth; out.boxCw = bx.clientWidth; out.boxW = Math.round(bx.getBoundingClientRect().width); } }
      return out;
    }, { scope, BAD, ZERO, zero: !!opts.zero, box: opts.box || null });
    if (r.missing) { fail(label + ": missing " + scope); return r; }
    if (r.bad.length) fail(label + ": bad text " + JSON.stringify(r.bad));
    if (r.zero.length) fail(label + ": zero placeholder " + JSON.stringify(r.zero));
    if (r.sw > vp.width + 1) fail(label + ": horizontal overflow, scrollWidth " + r.sw);
    if (opts.box && r.boxW !== undefined && r.boxW > vp.width + 1) fail(label + ": " + opts.box + " wider than the screen (" + r.boxW + ")");
    if (opts.box && opts.noScrollX && r.boxSw > r.boxCw + 1) fail(label + ": " + opts.box + " scrolls sideways (" + r.boxSw + " > " + r.boxCw + ")");
    if (opts.minLen && r.len < opts.minLen) fail(label + ": almost empty (" + r.len + " chars)");
    return r;
  };
  const setLang = async l => { if (!await click(`.lang [data-lang="${l}"]`)) fail("no language switch"); await wait(150); };
  const setCcy = async c => { if (!await click(`.ccy-switch [data-ccy="${c}"]`)) fail("no currency switch"); await wait(150); };
  const setTheme = async t => { if (!await click(`.theme-switch [data-theme="${t}"]`)) fail("no theme switch"); await wait(150); };
  const hasDs = await has("[data-ds-bar] [data-ds]");
  const setDs = async id => { if (!hasDs) return false; await click(`[data-ds-bar] [data-ds="${id}"]`); await wait(200); return true; };
  const escape = async () => { await p.keyboard.press("Escape"); await wait(60); };
  const openDialogs = () => p.evaluate(() => [...document.querySelectorAll('[role="dialog"]')].filter(d => !d.hidden && d.getClientRects().length).map(d => d.id));

  // ---- 1. Original checks: switches, steps, week, full view ----
  for (const l of ["en", "pt"]) await step("lang " + l, () => setLang(l));
  for (const c of ["USD", "BRL"]) await step("ccy " + c, () => setCcy(c));
  for (const t of ["dark", "light"]) await step("theme " + t, () => setTheme(t));
  for (const s of [2, 3, 4, 1]) await step("step " + s, async () => { await click(`#topStepNav [data-step="${s}"]`); await wait(250); await check("step " + s); });
  await step("week", async () => { await p.evaluate(() => { const s = document.getElementById("slider"); s.value = 3; s.dispatchEvent(new Event("input", { bubbles: true })); }); await wait(250); await check("week 3"); });
  await step("week back", async () => { await p.evaluate(() => { const s = document.getElementById("slider"); s.value = s.max; s.dispatchEvent(new Event("input", { bubbles: true })); }); await wait(200); });
  await step("all view", async () => { await click("#modeAll"); await wait(300); await check("full view"); });

  // ---- 2. FX rate: typed in the Data modal, every label must follow it ----
  await step("fx rate", async () => {
    if (!await has("#cfg-fx")) { notes.push(tag + "no #cfg-fx field: FX check skipped"); return; }
    await setLang("en"); await setCcy("USD");
    const before = await p.evaluate(() => document.getElementById("v_rev").textContent);
    await click("#openData"); await wait(150);
    await p.evaluate(() => { const i = document.getElementById("cfg-fx"); i.value = "5.25"; i.dispatchEvent(new Event("input", { bubbles: true })); i.dispatchEvent(new Event("change", { bubbles: true })); });
    await wait(300); await check("data modal after FX", "#m-data"); await escape();
    const r = await p.evaluate(() => ({ badge: document.getElementById("fxBadge").textContent, hidden: document.getElementById("fxBadge").hidden, rev: document.getElementById("v_rev").textContent,
      title: (document.querySelector(".ccy-switch") || {}).title || "", ptax: /PTAX|5[.,]89\b/.test(document.body.innerText) }));
    if (r.hidden || !/5\.25/.test(r.badge)) fail("FX badge does not show the typed rate: " + JSON.stringify(r.badge));
    if (!/5\.25/.test(r.title)) fail("currency switch tooltip does not show the typed rate: " + JSON.stringify(r.title));
    if (r.rev === before) fail("USD revenue did not change with the FX rate (" + before + ")");
    if (r.ptax) fail("a hard-coded PTAX / 5.89 claim is still visible after changing the rate");
    await click("#openDeck"); await wait(250);
    const cover = await p.evaluate(() => document.getElementById("slide").innerText);
    if (!/5\.25/.test(cover)) fail("deck cover does not show the typed FX rate");
    if (/PTAX|5[.,]89\b/.test(cover)) fail("deck cover still shows a hard-coded PTAX figure");
    await escape();
    await click("[data-go-step='2'], #topStepNav [data-step='2']"); await wait(150);
    const as = await p.evaluate(() => document.getElementById("assumption").textContent + " " + document.getElementById("csNote").textContent);
    if (!/5\.25/.test(as) || /PTAX|5[.,]89\b/.test(as)) fail("Step 2 notes do not follow the typed FX rate: " + as.slice(-160));
    // back to the default rate so the rest of the run uses the shipped value
    await click("#openData"); await wait(100);
    await p.evaluate(() => { const i = document.getElementById("cfg-fx"); i.value = "5.8889"; i.dispatchEvent(new Event("input", { bubbles: true })); i.dispatchEvent(new Event("change", { bubbles: true })); });
    await wait(200); await escape();
  });

  // ---- 3. Every language x currency x dataset: modals, proofs, deck ----
  if (!hasDs) notes.push(tag + "no dataset switch ([data-ds-bar] [data-ds]): dataset checks skipped");
  // Openers of dialogs: every topbar/action button whose id starts with "open" (covers modules added later, such as an
  // assistant), except the deck (walked separately) and anything that looks like a guided tour.
  const openers = await p.evaluate(() => [...document.querySelectorAll('button[id^="open"], [data-open-assistant], #asstFab, #assistant-fab')]
    .filter(e => !/deck|guide|tour|help/i.test(e.id + " " + e.className)).map(e => e.id ? "#" + e.id : "[data-open-assistant]"));
  for (const need of ["#openData", "#openBrief", "#openSettings", "#openAssistant"]) if (!openers.includes(need)) fail("modal opener missing: " + need);
  if (!openers.some(o => /assist|chat|ask/i.test(o))) notes.push(tag + "no assistant opener found: assistant check skipped");
  const slidesSeen = new Set();
  const walkDeck = async label => {
    if (!await click("#openDeck")) { fail(label + ": no #openDeck"); return; }
    await wait(250);
    const n = await p.evaluate(() => { const m = (document.getElementById("deck-count").textContent || "").match(/\/\s*(\d+)/); return m ? +m[1] : 0; });
    const dots = await p.evaluate(() => document.getElementById("deck-dots").children.length);
    if (!n || n !== dots) fail(label + ": slide count " + n + " does not match " + dots + " dots");
    slidesSeen.add(n);
    for (let i = 1; i <= n; i++) {
      await wait(90);
      await check(`${label} slide ${i}`, "#slide", { zero: true, box: "#slide", noScrollX: vp.width < 500, minLen: 40 });
      const cnt = await p.evaluate(() => document.getElementById("deck-count").textContent);
      if (!new RegExp("^" + i + "\\s*/").test(cnt)) fail(`${label}: expected slide ${i}, counter says "${cnt}"`);
      if (i < n) await click("#deck-next");
    }
    await escape();
    if ((await openDialogs()).includes("deck")) fail(label + ": deck did not close on Escape");
  };
  const datasets = hasDs ? ["v13", "q3"] : [null];
  for (const l of ["en", "pt"]) for (const c of ["USD", "BRL"]) for (const ds of datasets) {
    const label = `${l}/${c}/${ds || "default"}`;
    await step(label + " setup", async () => { await setLang(l); await setCcy(c); if (ds) await setDs(ds); await check(label + " page"); });
    if (ds) await step(label + " dataset", async () => {
      const act = await p.evaluate(() => { const x = document.querySelector('[data-ds-bar] [data-ds][aria-pressed="true"]'); return x ? x.dataset.ds : null; });
      if (act !== ds) fail(label + ": dataset switch did not select " + ds + " (active: " + act + ")");
    });
    for (const o of openers) await step(label + " modal " + o, async () => {
      await click(o); await wait(140);
      const open = await openDialogs();
      if (!open.length) { fail(`${label}: ${o} opened no dialog`); await escape(); return; }
      await check(`${label} ${o}`, "#" + open[0], { box: "#" + open[0] + " .modal-dialog", minLen: 40 });
      await escape();
      const still = await openDialogs();
      if (still.length) { fail(`${label}: ${o} did not close on Escape (${still.join(",")})`); await p.evaluate(() => document.querySelectorAll('[role="dialog"]').forEach(d => { d.hidden = true; })); await p.evaluate(() => { document.body.style.overflow = ""; }); }
    });
    await step(label + " proofs", async () => {
      const keys = await p.evaluate(() => [...document.querySelectorAll("#panel-1 [data-proof]")].map(e => e.dataset.proof));
      if (keys.length < 14) fail(label + ": only " + keys.length + " proof cards");
      for (const k of keys) {
        await p.evaluate(k => { const e = document.querySelector(`#panel-1 [data-proof="${k}"]`); const t = e.querySelector(".lbl, h3, .val") || e; t.click(); }, k);
        await wait(50);
        if (!(await openDialogs()).includes("proofModal")) { fail(`${label}: proof ${k} did not open`); continue; }
        await check(`${label} proof ${k}`, "#proofModal", { zero: true, box: "#proofModal .modal-dialog", minLen: 150 });
        await escape();
      }
    });
    await step(label + " deck", () => walkDeck(label + " deck"));
  }
  if (slidesSeen.size > 1) fail("slide count changed between runs: " + [...slidesSeen].join(", "));
  // Deck, briefing and panels must show the same numbers after each dataset switch (ends on the default set).
  for (const ds of datasets) await step("cross-check " + (ds || "default"), async () => {
    const label = "cross-check " + (ds || "default");
    await setLang("en"); await setCcy("BRL"); if (ds) await setDs(ds);
    const panel = await p.evaluate(() => ({ flow: document.getElementById("pt-flow").textContent.trim(), bal: document.getElementById("pt-bal").textContent.trim(),
      acts: [...document.querySelectorAll("#act-list li b")].map(e => e.textContent.trim()) }));
    await click("#openDeck"); await wait(1300);                       // cover numbers count up for ~0.9 s
    const cover = await p.evaluate(() => [...document.querySelectorAll("#slide .cover-stats b")].map(e => e.textContent.trim()));
    if (cover[2] !== panel.flow) fail(`${label}: deck cover flow "${cover[2]}" differs from the Step 3 total "${panel.flow}"`);
    await p.keyboard.press("End"); await wait(200);
    const last = await p.evaluate(() => (document.querySelector("#slide .key") || {}).innerText || "");
    if (!last.includes(panel.flow) || !last.includes(panel.bal)) fail(`${label}: last slide does not quote the Step 3 totals ${panel.flow} / ${panel.bal}`);
    await escape();
    await click("#openBrief"); await wait(150);
    const brief = await p.evaluate(() => document.getElementById("brief-body").innerText);
    for (const t of panel.acts) if (!brief.includes(t)) fail(`${label}: briefing misses the action "${t.slice(0, 60)}"`);
    if (/demo data/i.test(brief)) fail(label + ": briefing still says \"demo data\"");
    await escape();
  });

  // ---- 4. Dark theme deck walk ----
  await step("dark deck", async () => { await setTheme("dark"); await walkDeck("dark deck"); await check("dark page"); await setTheme("light"); });
  // ---- 5. Side menu: steps and sections, tools, preferences, collapse (wide) / drawer (narrow), scroll spy ----
  const wide = vp.width >= 1100;
  const navState = () => p.evaluate(() => ({ collapsed: document.documentElement.classList.contains("sn-collapsed"), open: document.documentElement.classList.contains("sn-open"),
    w: Math.round(document.getElementById("sideNav").getBoundingClientRect().width), pad: parseFloat(getComputedStyle(document.body).paddingLeft), store: localStorage.getItem("scf-nav"),
    focus: document.activeElement && document.activeElement.id, lock: getComputedStyle(document.documentElement).overflow }));
  const visibleDialogs = () => p.evaluate(() => [...document.querySelectorAll('[role="dialog"]:not([hidden]), #guideMenu:not([hidden])')].filter(d => d.id !== "guideCard" && d.getClientRects().length).map(d => d.id));
  await step("menu ids", async () => {
    const r = await p.evaluate(() => { const ids = [...document.querySelectorAll("[id]")].map(e => e.id); return { dup: [...new Set(ids.filter((x, i) => ids.indexOf(x) !== i))], gone: ["topbarMenu", "topbarMoreBtn"].filter(i => document.getElementById(i)) }; });
    if (r.dup.length) fail("duplicate ids: " + r.dup.join(", "));
    if (r.gone.length) fail("old header menu still present: " + r.gone.join(", "));
  });
  await step("skip link", async () => {
    await p.reload(); await wait(800); await p.keyboard.press("Tab");
    const id = await p.evaluate(() => document.activeElement.id);
    if (id !== "skipLink") fail("first Tab stop is #" + id + ", expected the skip link");
    await p.keyboard.press("Enter"); await wait(150);
    if (await p.evaluate(() => document.activeElement.id) !== "top") fail("skip link does not move focus to the content");
  });
  await step("menu sections", async () => {
    await click("#modeStep"); await wait(200);
    // Every section label matches the heading it jumps to, in both languages.
    for (const l of ["en", "pt"]) {
      await setLang(l);
      const bad = await p.evaluate(() => [...document.querySelectorAll(".sn-sec")].filter(a => { const el = document.getElementById(a.dataset.snSec); const h = el && (el.matches("h2,h3") ? el : el.querySelector("h3, .ref-title, h2")); return !h || a.textContent.trim() !== h.textContent.replace(/\s+/g, " ").trim(); }).map(a => a.dataset.snSec));
      if (bad.length) fail(l + ": menu labels differ from the page headings: " + bad.join(", "));
    }
    const n = await p.evaluate(() => document.querySelectorAll(".sn-sec").length);
    if (n < 12) fail("only " + n + " sections in the side menu");
  });
  await step("menu jump", async () => {
    if (!wide) { await click("#navMenuBtn"); await wait(300); }
    await click("#topStepNav [data-step='1']"); await wait(300);
    const folded = await p.evaluate(() => [...document.querySelectorAll("[data-sn-secs]")].filter(u => !u.hidden).map(u => u.dataset.snSecs));
    if (folded.join() !== "1") fail("accordion: open section lists " + folded.join());
    if (!wide) { await click("#navMenuBtn"); await wait(300); }
    for (const [id, stp] of [["sec-friction", 1], ["sec-mkt-3", 4]]) {
      if (!wide && !(await navState()).open) { await click("#navMenuBtn"); await wait(300); }
      if (stp === 4) { await click("#topStepNav [data-step='4']"); await wait(300); if (!wide) { await click("#navMenuBtn"); await wait(300); } await click('#mktSubnav [data-mmod="1"]'); }
      await p.click(`.sn-sec[data-sn-sec="${id}"]`); await wait(1100);
      const r = await p.evaluate(id => { const e = document.getElementById(id); const t = e.getBoundingClientRect().top; const hb = document.querySelector(".topbar").getBoundingClientRect().bottom;
        return { t, hb, hidden: !e.getClientRects().length, cur: (document.querySelector('.sn-sec[aria-current="location"]') || {}).dataset?.snSec, open: document.documentElement.classList.contains("sn-open") }; }, id);
      if (r.hidden) fail(id + ": section still hidden after choosing it in the menu");
      else if (r.t < r.hb - 2 || r.t > vp.height - 40) fail(`${id}: not brought under the sticky header (top ${Math.round(r.t)}, header ${Math.round(r.hb)})`);
      if (r.cur !== id) fail(id + ": menu highlights " + r.cur);
      if (r.open) fail(id + ": drawer still open after choosing a section");
    }
    await click('#mktSubnav [data-mmod="all"]');
  });
  await step("scroll spy", async () => {
    await click("#modeAll"); await wait(1000);          // let the view switch finish its own smooth scroll
    for (const [id, stp] of [["sec-kpis", 1], ["sec-accuracy", 2], ["sec-anchors", 3], ["sec-mkt-2", 4]]) {
      await p.evaluate(id => { const e = document.getElementById(id); let y = 0; for (let x = e; x; x = x.offsetParent) y += x.offsetTop; window.scrollTo({ top: y - 130, behavior: "instant" }); window.dispatchEvent(new WheelEvent("wheel")); }, id);
      await wait(400);
      const r = await p.evaluate(() => ({ sec: (document.querySelector('.sn-sec[aria-current="location"]') || {}).dataset?.snSec, step: (document.querySelector('.sn-step[aria-current="step"]') || {}).dataset?.step, name: document.getElementById("tbStepName").textContent }));
      if (r.step !== String(stp)) fail(`spy at ${id}: step ${r.step}, expected ${stp}`);
      if (r.sec !== id && !(id === "sec-accuracy" && r.sec === "sec-cases")) fail(`spy at ${id}: highlights ${r.sec}`);
      if (!r.name) fail("header step name empty");
    }
    await click("#modeStep"); await wait(200); await check("menu after spy");
  });
  // Every tool opens its window from the menu (real clicks), and focus comes back to something on screen.
  const tools = ["#openAssistant", "#openData", "#openBrief", "#openDeck", "#openOF", "#openGuide"];
  const toolRound = async label => {
    for (const t of tools) await step(label + " " + t, async () => {
      if (!await has(t)) { notes.push(tag + "no " + t + " in the menu"); return; }
      if (!wide) { await p.click("#navMenuBtn"); await wait(320); if (!(await navState()).open) fail(label + ": drawer did not open"); }
      await p.click(t); await wait(300);
      const open = await visibleDialogs();
      if (!open.length) fail(`${label}: ${t} opened nothing`);
      if (!wide && (await navState()).open) fail(`${label}: drawer still open over ${t}`);
      await escape(); await wait(250);
      if ((await visibleDialogs()).length) { fail(`${label}: ${t} did not close on Escape`); await escape(); }
      const f = await p.evaluate(() => { const a = document.activeElement; return { id: a && a.id, vis: !!a && a !== document.body && a.getClientRects().length > 0 && getComputedStyle(a).visibility !== "hidden" }; });
      if (!f.vis) fail(`${label}: focus lost after closing ${t} (on ${f.id || "body"})`);
    });
  };
  if (wide) {
    await step("menu expanded", async () => { const s = await navState(); if (s.collapsed || Math.abs(s.w - 232) > 2 || Math.abs(s.pad - 232) > 2) fail("expanded menu: " + JSON.stringify(s)); });
    await toolRound("menu tool");
    await step("menu collapse", async () => {
      await p.click("#snCollapse"); await wait(350);
      const s = await navState();
      if (!s.collapsed || Math.abs(s.w - 64) > 2 || Math.abs(s.pad - 64) > 2 || s.store !== "collapsed") fail("collapsed menu: " + JSON.stringify(s));
      const names = await p.evaluate(() => [...document.querySelectorAll("#sideNav .sn-item")].filter(b => b.getClientRects().length && !(b.getAttribute("aria-label") || b.textContent.trim())).map(b => b.id || b.dataset.step));
      if (names.length) fail("collapsed items without an accessible name: " + names.join(","));
      await p.mouse.move(vp.width - 5, vp.height - 5); await p.hover("#openBrief"); await wait(200);
      const tip = await p.evaluate(() => { const t = document.getElementById("snTip"); return t.hidden ? "" : t.textContent; });
      if (!tip) fail("no tooltip on a collapsed menu item");
      await check("collapsed menu");
    });
    await toolRound("collapsed tool");
    await step("menu remembered", async () => {
      await p.reload(); await wait(800);
      if (!(await navState()).collapsed) fail("collapsed state not restored after reload");
      for (const w of [1100, 1280, 1440, 1920]) for (const st of ["collapsed", "expanded"]) {
        await p.setViewportSize({ width: w, height: 900 });
        if ((await navState()).collapsed !== (st === "collapsed")) await p.click("#snCollapse");
        await wait(300);
        for (const sp of [1, 3, 4]) { await click(`#topStepNav [data-step="${sp}"]`); await wait(200);
          const sw = await p.evaluate(() => document.documentElement.scrollWidth);
          if (sw > w + 1) fail(`${w} ${st} step ${sp}: horizontal overflow ${sw}`); }
      }
      await p.setViewportSize(vp); await wait(200);
      if ((await navState()).collapsed) await p.click("#snCollapse");
      await wait(200);
    });
  } else {
    await step("drawer", async () => {
      let s = await navState();
      if (s.open || s.pad > 0) fail("drawer open or content offset at load: " + JSON.stringify(s));
      await p.focus("#navMenuBtn"); await p.keyboard.press("Enter"); await wait(320);
      s = await navState();
      if (!s.open || s.lock !== "hidden") fail("drawer did not open with the page locked: " + JSON.stringify(s));
      const inside = await p.evaluate(() => !!document.activeElement.closest("#sideNav"));
      if (!inside) fail("focus did not move into the drawer");
      let out = 0; for (let i = 0; i < 30; i++) { await p.keyboard.press(i % 7 === 6 ? "Shift+Tab" : "Tab"); if (!(await p.evaluate(() => !!document.activeElement.closest("#sideNav")))) out++; }
      if (out) fail("focus left the open drawer " + out + " times");
      await p.keyboard.press("Escape"); await wait(320);
      s = await navState();
      if (s.open || s.focus !== "navMenuBtn" || s.lock === "hidden") fail("Escape: " + JSON.stringify(s));
      await p.click("#navMenuBtn"); await wait(320);
      await p.mouse.click(vp.width - 12, vp.height / 2); await wait(320);
      s = await navState();
      if (s.open || s.focus !== "navMenuBtn") fail("backdrop click: " + JSON.stringify(s));
      await p.click("#navMenuBtn"); await wait(320); await p.click("#snClose"); await wait(320);
      if ((await navState()).open) fail("close button did not close the drawer");
      await check("drawer closed");
    });
    await toolRound("drawer tool");
  }
  await ctx.close();

  // ---- 6. Guided tour on clean storage: every stop frames a real, visible element ----
  await step("tour", async () => {
    const tctx = await b.newContext({ viewport: vp, locale: "pt-BR" });
    const tp = await tctx.newPage(); tp.on("pageerror", e => fail("tour PAGEERROR " + e.message));
    await tp.goto(url); await tp.waitForTimeout(1500);
    for (let i = 0; i < 8; i++) {
      const r = await tp.evaluate(() => {
        const L = document.getElementById("guideLayer"); if (L.hidden) return null;
        const sp = document.getElementById("guideSpot"), s = sp.getBoundingClientRect(), c = document.getElementById("guideCard").getBoundingClientRect();
        return { n: document.getElementById("guideCount").textContent, none: sp.classList.contains("none"), h: s.height, w: s.width,
          over: s.height > 0 && !(s.bottom <= c.top + 1 || s.top >= c.bottom - 1 || s.right <= c.left + 1 || s.left >= c.right - 1), text: document.getElementById("guideText").textContent };
      });
      if (!r) { fail("tour closed early at stop " + (i + 1)); break; }
      if (r.none || r.h < 12 || r.w < 12) fail(`tour stop ${i + 1}: no visible target (${JSON.stringify(r)})`);
      if (r.over) fail(`tour stop ${i + 1}: the card covers its target`);
      if (/undefined|NaN/.test(r.text)) fail(`tour stop ${i + 1}: bad text`);
      await tp.evaluate(() => document.getElementById("guideNext").click()); await tp.waitForTimeout(800);
    }
    const end = await tp.evaluate(() => ({ open: !document.getElementById("guideLayer").hidden, done: localStorage.getItem("scf-tour-done"), drawer: document.documentElement.classList.contains("sn-open"),
      focusVis: !!document.activeElement && document.activeElement !== document.body && document.activeElement.getClientRects().length > 0 }));
    if (end.open || end.done !== "1" || end.drawer || !end.focusVis) fail("tour end state: " + JSON.stringify(end));
    // The tutorial opens on every load, also for a returning user.
    await tp.reload(); await tp.waitForTimeout(1500);
    if (await tp.evaluate(() => document.getElementById("guideLayer").hidden)) fail("tour did not open again on reload");
    await tctx.close();
  });
}
await b.close();
if (notes.length) console.log([...new Set(notes)].join("\n"));
console.log(errs.length ? errs.join("\n") : "smoke test passed");
process.exit(errs.length ? 1 : 0);
