// Numbers audit: recomputes the pilot book, every KPI, the forecast (3 scenarios x 3 horizons), the modelled range,
// the limit verdict and the one-week backtest for each of the 12 example weeks, independently of the page code,
// and compares the result with what the built page prints. Run: node tools/audit-numbers.mjs (needs Playwright).
// It checks the example data with the default parameters (BRL, Portuguese, limit R$ 650 mi).
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = createRequire("/opt/node-tools/")("playwright")); }
const D = {
  spend:[52,53,54,55,56,57,57,58,59,59,60,60], active:[40,44,51,60,72,85,97,110,121,133,142,150],
  util:[58,59,60,61,62,64,65,66,67,68,69,70], days:[21,21,20,19,16,14,13,12,11,10,9,9],
  err:[9.8,9.1,8.4,7.9,7.0,6.1,5.5,4.9,4.2,3.8,3.4,3.1], sow:[34,35,36,37,39,40,42,43,45,46,47,48], flags:[5,4,6,3,3,2,2,3,1,2,1,1]};
const SPEND=6000, TENOR=75, SPREAD=1.2;
// independent: exact (unrounded) book, then the panel's 1-decimal rounding
const balExact = D.spend.map((s,i)=>SPEND*s/100*D.util[i]/100*TENOR/365);
const bal = balExact.map(v=>Math.round(v*10)/10);
const rev = bal.map(b=>Math.round(b*SPREAD/100*10)/10);
const ceil = SPEND*TENOR/365;
function growth(w, win=4){ if(w===1) return 0.026; const j=Math.max(1,w-win); return Math.pow(bal[w-1]/bal[j-1],1/(w-j))-1; }
function proj(w,h,mult=1,decay=0.93,win=4){ const g0=growth(w,win), g=g0+(mult-1)*Math.abs(g0); const v=[bal[w-1]]; for(let k=0;k<h;k++) v.push(Math.min(Math.max(ceil,bal[w-1]),Math.max(0,v[k]*(1+g*Math.pow(decay,k))))); return v; }
function band(w,h,mult=1){ const v=proj(w,h,mult); return v.map((x,k)=>x*D.err[w-1]/100*Math.sqrt(k)/2.2); }

const b = await chromium.launch();
const p = await (await b.newContext({ viewport:{width:1440,height:900}, locale:"pt-BR", reducedMotion:"reduce" })).newPage();
p.on("pageerror", e => console.log("PAGEERROR", e.message));
await p.goto(pathToFileURL(resolve(here, "../dist/index.html")).href + "?notour"); await p.waitForTimeout(900);
const brl = n => "R$ " + Math.round(n).toLocaleString("pt-BR") + " mi";
const f = (n,d) => n.toLocaleString("pt-BR",{minimumFractionDigits:d,maximumFractionDigits:d});
let bad = 0, checks = 0; const fail = (...a) => { bad++; if (bad < 40) console.log("MISMATCH", ...a); };
const eq = (label, got, want) => { checks++; if (String(got).replace(/\s+/g," ").trim() !== String(want).replace(/\s+/g," ").trim()) fail(label, "| got:", got, "| want:", want); };
const has = (label, text, want) => { checks++; if (!text.replace(/\s+/g," ").includes(want.replace(/\s+/g," "))) fail(label, "| text:", text.slice(0,160), "| want:", want); };
const mult = {Downside:.5, Base:1, Upside:1.5};
for (let w = 1; w <= 12; w++) {
  await p.evaluate(w => { const s=document.querySelector('input[type=range]'); s.value=w; s.dispatchEvent(new Event("input",{bubbles:true})); }, w);
  await p.waitForTimeout(120);
  const k = await p.evaluate(() => Object.fromEntries(["spend","active","util","days","rev","err","sow","flags"].flatMap(k => [["v_"+k, document.getElementById("v_"+k).textContent], ["d_"+k, document.getElementById("d_"+k).textContent]])));
  const i = w-1;
  eq(`W${w} spend`, k.v_spend, f(D.spend[i],0)); eq(`W${w} active`, k.v_active, f(D.active[i],0)); eq(`W${w} util`, k.v_util, f(D.util[i],0));
  eq(`W${w} days`, k.v_days, f(D.days[i],0)); eq(`W${w} rev`, k.v_rev, "R$ "+f(rev[i],1)); eq(`W${w} err`, k.v_err, f(D.err[i],1));
  eq(`W${w} sow`, k.v_sow, f(D.sow[i],0)); eq(`W${w} flags`, k.v_flags, f(D.flags[i],0));
  if (w > 1) {
    const dl = (cur, prev, unit) => { const d = +(cur-prev).toFixed(1); return d===0 ? "Estável" : (d>0?"+":"−") + f(Math.abs(d), Math.abs(d)%1?1:0) + unit; };
    eq(`W${w} d_spend`, k.d_spend, dl(D.spend[i],D.spend[i-1]," pp")); eq(`W${w} d_active`, k.d_active, dl(D.active[i],D.active[i-1],""));
    eq(`W${w} d_util`, k.d_util, dl(D.util[i],D.util[i-1]," pp")); eq(`W${w} d_days`, k.d_days, dl(D.days[i],D.days[i-1]," d"));
    eq(`W${w} d_rev`, k.d_rev, dl(rev[i],rev[i-1]," mi")); eq(`W${w} d_err`, k.d_err, dl(D.err[i],D.err[i-1]," pp"));
    eq(`W${w} d_sow`, k.d_sow, dl(D.sow[i],D.sow[i-1]," pp")); eq(`W${w} d_flags`, k.d_flags, dl(D.flags[i],D.flags[i-1],""));
  }
  for (const sc of ["Downside","Base","Upside"]) for (const h of [4,8,13]) {
    await p.evaluate(([sc,h]) => { document.querySelector(`#scenarioGroup [data-sc="${sc}"]`).click(); document.querySelector(`#horizonGroup [data-hz="${h}"]`).click(); }, [sc,h]);
    const t = await p.evaluate(() => ({ out:document.getElementById("outlook").textContent, lim:document.getElementById("limit-status").textContent, cls:document.getElementById("limit-status").className,
      rows:[...document.querySelectorAll("#forecast-rows tr")].map(r=>[...r.children].map(c=>c.textContent)), cases:[...document.querySelectorAll("#case-bars .case-row")].map(r=>[r.querySelector("b").textContent, r.querySelector("small").textContent]), acc:document.getElementById("accuracy-note").textContent, asm:document.getElementById("assumption").textContent }));
    const v = proj(w,h,mult[sc]), bd = band(w,h,mult[sc]), cap=Math.max(ceil,bal[i]);
    const lo = v.map((x,k)=>Math.max(0,x-bd[k])), hi = v.map((x,k)=>Math.min(cap,x+bd[k]));
    const chg = (v[h]/v[0]-1)*100;
    has(`W${w} ${sc} h${h} outlook end`, t.out, `S${w+h} fecha em ${brl(v[h])}`);
    has(`W${w} ${sc} h${h} outlook chg`, t.out, `${chg<0? f(Math.abs(chg),1)+"% abaixo" : "+"+f(chg,1)+"% acima"} da S${w}`);
    has(`W${w} ${sc} h${h} outlook range`, t.out, `${brl(lo[h])} a ${brl(hi[h])}`);
    t.rows.forEach((r,kk) => { eq(`W${w} ${sc} h${h} row${kk}`, r.join("|"), [`S${w+kk+1}`, brl(v[kk+1]), brl(lo[kk+1]), brl(hi[kk+1])].join("|")); });
    checks++; if (t.rows.length !== h) fail(`W${w} ${sc} h${h} rows`, t.rows.length);
    ["Downside","Base","Upside"].forEach((n,ix) => { const e = proj(w,h,mult[n])[h]; eq(`W${w} ${sc} h${h} case ${n}`, t.cases[ix][0], brl(e)); eq(`W${w} ${sc} h${h} case% ${n}`, t.cases[ix][1], Math.round(100*e/650)+"% do limite"); });
    const peak = Math.max(...hi), kHigh = hi.findIndex(x=>x>650), kBase = v.findIndex(x=>x>650), need = Math.max(0, Math.ceil(peak-650));
    const cls = kHigh<0 ? "limitst" : kBase<0 ? "limitst warn" : "limitst bad"; eq(`W${w} ${sc} h${h} verdict class`, t.cls, cls);
    if (kHigh<0) has(`W${w} ${sc} h${h} fits`, t.lim, `chega a ${brl(peak)}, ${Math.round(100*peak/650)}% do limite`);
    else if (kBase<0) has(`W${w} ${sc} h${h} warn`, t.lim, `na S${w+kHigh}. Pré-aprovar +${brl(need)}`);
    else has(`W${w} ${sc} h${h} breach`, t.lim, `na S${w+kBase}. Pedir +${brl(need)}`);
    if (w>1) { let s=0,fl=0; for(let o=1;o<w;o++){ s+=Math.abs(proj(o,1)[1]-bal[o])/bal[o]*100; fl+=Math.abs(bal[o-1]-bal[o])/bal[o]*100; }
      has(`W${w} backtest`, t.acc, `${f(s/(w-1),2)}% no modelo base contra ${f(fl/(w-1),2)}%`);
      const n=Math.min(4,w-1); has(`W${w} growth text`, t.asm, f(Math.abs(growth(w)*100),2)+"%"); }
  }
}
console.log("numbers audit: " + checks + " checks, " + bad + " mismatches");
await b.close();
process.exit(bad ? 1 : 0);
