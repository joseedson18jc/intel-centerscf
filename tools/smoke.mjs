// Smoke test: opens dist/index.html in headless Chromium and exercises the app through its own controls.
// Usage: node tools/smoke.mjs   (requires Playwright; exits 1 on any failure)
//
// What it does, at 1440 and 390 wide:
//   1. language, currency, theme, step navigation, week slider, full view (the original checks);
//   2. sets the FX rate in the Data modal and checks the labels follow it (and that no "PTAX" claim is left);
//   3. for every language x currency x dataset: opens every modal and every Step 1 proof, opens the deck and walks every slide;
//   4. one extra deck walk in dark theme.
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
  await p.goto(url); await p.waitForTimeout(700);
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
  await step("final", async () => { await setLang("pt"); await setCcy("BRL"); await check("final page"); });
  await ctx.close();
}
await b.close();
if (notes.length) console.log([...new Set(notes)].join("\n"));
console.log(errs.length ? errs.join("\n") : "smoke test passed");
process.exit(errs.length ? 1 : 0);
