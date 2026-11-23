  // ========== PRINTABLE / COPYABLE MONDAY BRIEFING ==========
  function briefHTML() {
    const w = week, i = w - 1;
    const kp = KPIS.map(m => {
      const div = m.k === "rev" ? fx() : 1;
      const cur = m.series[i] / div, prev = i ? m.series[i - 1] / div : cur, diff = cur - prev;
      const u = unitOf(m), tight = u === "%" || (m.k === "rev" && lang !== "pt"), flat = +Math.abs(diff).toFixed(kpiDec(m)) === 0;   // "60%", "R$6.2m / yr", "R$ 6,2 mi / ano"
      return `<tr><td>${L(m.lbl)}</td><td><b>${(m.k === "rev" ? sym() : "") + nf(cur, kpiDec(m))}${tight ? "" : " "}${u}</b></td><td>${!i ? "–" : flat ? T("flat","estável") : ((diff > 0 ? "+" : "−") + nf(Math.abs(diff), kpiDec(m)))}</td></tr>`;
    }).join("");
    const al = ALERTS.filter(a => a[0] <= w).sort((a, b) => b[0] - a[0]).slice(0, 3).map(a => `<li>${WL()}${a[0]} · ${L(a[2])}</li>`).join("");
    return `<div><b>${L(I18N.h1)}</b> · ${T("Week","Semana")} ${w} · ${ccy} · ${esc(dataLabel())}</div>
      <div style="font-size:.92em;opacity:.85">${T("Steps 3 and 4","Etapas 3 e 4")}: ${esc(dsBaseLabel(true))} · ${T("pipeline on working hypotheses, market figures fabricated","pipeline sobre hipóteses de trabalho, números de mercado fabricados")}${ccy === "USD" ? " · " + esc(fxLabel()) : ""}</div>
      <h4>${T("Action plan","Plano de ação")}</h4><ol>${ACTS.map(a => `<li><b>${esc(a.title)}</b> — ${esc(a.why)} <i>(${T("Decision","Decisão")} ${a.dec} · ${a.own.map(o => L(OWN[o])).join(" + ")} · ${L(a.due)})</i></li>`).join("")}</ol>
      <h4>${T("Balance & limit outlook","Projeção de saldo e limite")}</h4><p style="color:inherit">${esc($("outlook").textContent)}<br>${esc($("limit-status").textContent)}</p>
      <h4>${T("KPIs","Indicadores")}</h4><table>${kp}</table>
      <h4>${T("Recent alerts","Alertas recentes")}</h4><ul>${al}</ul>`;
  }
  const briefText = () => {
    const d = document.createElement("div"); d.innerHTML = briefHTML();
    d.querySelectorAll("h4").forEach(x => x.textContent = "\n" + x.textContent.toUpperCase());
    d.querySelectorAll("li").forEach(x => x.textContent = "• " + x.textContent);
    d.querySelectorAll("tr").forEach(x => x.textContent = [...x.children].map(c => c.textContent).join("  "));
    return d.textContent.replace(/\n{3,}/g, "\n\n").trim();
  };
  const fillPrint = () => { $("brief-print").innerHTML = `<h1>${T("Weekly briefing","Briefing semanal")} · ${ccy}</h1><div class="brief-prev">${briefHTML()}</div>`; };
  window.addEventListener("beforeprint", fillPrint);
  $("b-print").onclick = () => { fillPrint(); window.print(); };
  $("b-copy").onclick = async () => {
    const t = briefText();
    try { await navigator.clipboard.writeText(t); $("b-msg").textContent = T("Copied to clipboard.","Copiado."); }
    catch (e) { const ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); $("b-msg").textContent = T("Copied.","Copiado."); } catch (_) {} ta.remove(); }
  };

  // Shared accessible modal manager (focus trap + scroll lock + Escape)
  let modalFocus = null;
  const SIMPLE_MODALS = ["m-data","m-brief","m-settings","m-ai"];
  function syncBodyLock() {
    const anyOpen = !deck.hidden || !proofModal.hidden || SIMPLE_MODALS.some(id => !$(id).hidden);
    document.body.style.overflow = anyOpen ? "hidden" : "";
  }
  function trapFocus(container, e) {
    if (e.key !== "Tab") return;
    const focusables = [...container.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
      .filter(el => el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === container)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function openSimpleModal(id) {
    setPlaying(false); modalFocus = document.activeElement;
    const m = $(id); m.hidden = false; syncBodyLock(); m.focus();
  }
  function closeSimpleModal(m) {
    m.hidden = true; syncBodyLock();
    if (modalFocus) modalFocus.focus();
  }
  for (const id of SIMPLE_MODALS) {
    const m = $(id);
    m.addEventListener("click", e => { if (e.target === m || e.target.hasAttribute("data-close")) closeSimpleModal(m); });
  }
  $("openData").onclick = () => { fillFields(); $("data-msg").textContent = ""; openSimpleModal("m-data"); };
  $("src-chip").onclick = $("openData").onclick;
  $("openBrief").onclick = () => { $("brief-body").innerHTML = briefHTML(); $("b-msg").textContent = ""; openSimpleModal("m-brief"); };

