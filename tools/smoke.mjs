// Smoke test: opens dist/index.html in headless Chromium and exercises the main controls.
// Usage: node tools/smoke.mjs   (requires Playwright; exits 1 on any page/console error or horizontal overflow)
import { chromium } from "playwright";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const url = "file://" + join(dirname(fileURLToPath(import.meta.url)), "..", "dist", "index.html");
const errs = [];
const b = await chromium.launch();
for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 800 }]) {
  const ctx = await b.newContext({ viewport: vp, locale: "pt-BR" });
  const p = await ctx.newPage(); p.setDefaultTimeout(5000);
  const tag = vp.width + ": ";
  p.on("pageerror", e => errs.push(tag + "PAGEERROR " + e.message));
  p.on("console", m => { if (m.type() === "error" && !/net::ERR|Failed to load resource/.test(m.text())) errs.push(tag + m.text()); });
  await p.goto(url); await p.waitForTimeout(700);
  await p.evaluate(() => { try { localStorage.setItem("scf-tour-done", "1"); } catch (e) {} });
  await p.reload(); await p.waitForTimeout(700);
  const step = async (name, fn) => { try { await fn(); } catch (e) { errs.push(tag + "STEP " + name + ": " + String(e.message).split("\n")[0]); } };
  for (const l of ["en", "pt"]) await step("lang " + l, async () => { await p.evaluate(l => document.querySelector(`.lang [data-lang="${l}"]`).click(), l); await p.waitForTimeout(250); });
  for (const c of ["USD", "BRL"]) await step("ccy " + c, async () => { await p.evaluate(c => document.querySelector(`.ccy-switch [data-ccy="${c}"]`).click(), c); await p.waitForTimeout(250); });
  for (const t of ["dark", "light"]) await step("theme " + t, async () => { await p.evaluate(t => document.querySelector(`.theme-switch [data-theme="${t}"]`).click(), t); await p.waitForTimeout(250); });
  for (const s of [2, 3, 4, 1]) await step("step " + s, async () => { await p.evaluate(s => document.querySelector(`#topStepNav [data-step="${s}"]`).click(), s); await p.waitForTimeout(300); });
  await step("week", async () => { await p.evaluate(() => { const s = document.getElementById("slider"); s.value = 3; s.dispatchEvent(new Event("input", { bubbles: true })); }); await p.waitForTimeout(300); });
  await step("all view", async () => { await p.evaluate(() => { const m = document.getElementById("modeAll"); if (m) m.click(); }); await p.waitForTimeout(300); });
  const sw = await p.evaluate(() => document.documentElement.scrollWidth);
  if (sw > vp.width + 1) errs.push(tag + "horizontal overflow: scrollWidth " + sw);
  const bad = await p.evaluate(() => (document.body.innerText.match(/.{0,25}(NaN|undefined|\[object Object\]).{0,25}/g) || []).slice(0, 5));
  if (bad.length) errs.push(tag + "bad text: " + JSON.stringify(bad));
  await ctx.close();
}
await b.close();
console.log(errs.length ? errs.join("\n") : "smoke test passed");
process.exit(errs.length ? 1 : 0);
