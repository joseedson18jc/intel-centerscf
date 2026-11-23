  // ========== SHARED LABELS (one vocabulary for KPI, commentary, forecast, briefing, proofs and deck) ==========
  // dataLabel(): names the weekly data on screen. "example data" unless the user loaded or edited their own (SRCINFO).
  // Plain text: pass it through esc() before innerHTML.
  function dataLabel() { return SRCINFO ? T(`your data: ${SRCINFO.name}`,`seus dados: ${SRCINFO.name}`) : T("example data","dados de exemplo"); }
  // Revenue base of the active Step 3/4 dataset, in the dataset's own words ("3Q26 annualised", "2025 full year").
  // inline = true lower-cases a leading word so the label can sit inside a sentence ("ano de 2025").
  function dsBaseLabel(inline) { const s = L(DS().name); return inline && /^[A-ZÀ-Ý][a-zà-ÿ]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s; }
  // Label for public-company figures typed in by the author: quoted from releases, not checked by this page.
  function pubNote() { return T("Company figures entered by the author from public releases; verify before use.","Números das empresas informados pelo autor a partir de divulgações públicas; conferir antes de usar."); }

  // ========== KPI TILES (each tile opens the calculation behind its number) ==========
  function buildKpis() {
    const kpiWrap = $("kpis");
    kpiWrap.innerHTML = "";
    KPIS.forEach(m => {
      const c = document.createElement("div");
      c.className = "card kpi clickable-card" + (m.hl ? " hl" : "");
      c.dataset.proof = "kpi-" + m.k;
      c.tabIndex = 0;
      c.setAttribute("role", "button");
      c.setAttribute("aria-label", `${L(m.lbl)}: ${T("view calculation","ver memória de cálculo")}`);
      c.innerHTML = `<div class="top"><span class="lbl">${L(m.lbl)}</span><span class="delta flat" id="d_${m.k}">–</span></div>
        <div class="val"><span id="v_${m.k}"></span><span class="u">${unitOf(m)}</span></div>
        <div class="q">${L(m.q)}</div>
        <svg class="spark" id="s_${m.k}" viewBox="0 0 200 32" preserveAspectRatio="none" aria-hidden="true"></svg>
        <span class="proof-cue">${T("View calculation ↗","Ver cálculo ↗")}</span>`;
      kpiWrap.appendChild(c);
    });
  }
  function spark(m, w) {
    const s = $("s_" + m.k); if (!s) return;
    s.innerHTML = "";
    const vals = m.series, mn = Math.min(...vals), mx = Math.max(...vals);
    const X = i => 4 + i * (192 / Math.max(1, W - 1));
    const Y = v => 28 - (v - mn) / ((mx - mn) || 1) * 22;
    const col = m.hl ? "#7FD8F7" : C.blue;
    el("path", {d: vals.map((v, i) => `${i ? "L" : "M"}${X(i)},${Y(v)}`).join(" "), fill:"none", stroke: m.hl ? "rgba(255,255,255,.18)" : C.grid, "stroke-width":2}, s);
    el("path", {d: vals.slice(0, w).map((v, i) => `${i ? "L" : "M"}${X(i)},${Y(v)}`).join(" "), fill:"none", stroke:col, "stroke-width":2.4, "stroke-linecap":"round", "stroke-linejoin":"round"}, s);
    el("circle", {cx:X(w - 1), cy:Y(vals[w - 1]), r:3.8, fill:col}, s);
  }
  function updateKpis(w) {
    KPIS.forEach(m => {
      const div = m.k === "rev" ? fx() : 1;
      const to = m.series[w - 1] / div, prev = (w > 1 ? m.series[w - 2] : m.series[w - 1]) / div;
      $("v_" + m.k).textContent = (m.k === "rev" ? sym() : "") + nf(to, kpiDec(m));
      const d = +(to - prev).toFixed(m.k === "rev" && ccy === "USD" ? 2 : 1);
      const dEl = $("d_" + m.k);
      const better = d === 0 ? 0 : Math.sign(d) === m.good ? 1 : -1;
      dEl.className = "delta " + (better > 0 ? "up" : better < 0 ? "down" : "flat");
      const unit = Array.isArray(m.u) && m.u[0] === "%" ? " pp" : m.k === "days" ? " d" : m.k === "rev" ? T("m"," mi") : "";
      dEl.textContent = w === 1 ? T("Baseline","Base") : d === 0 ? T("Flat","Estável") : (d > 0 ? "+" : "−") + nf(Math.abs(d), Math.abs(d) % 1 ? (m.k === "rev" && ccy === "USD" ? 2 : 1) : 0) + unit;
      spark(m, w);
    });
  }

