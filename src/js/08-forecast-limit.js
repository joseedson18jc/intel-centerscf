  // ========== FORECAST & APPROVED LIMIT CHECK (STEP 2) ==========
  let curScenario = "Base", curHorizon = 13, limitBRL = 650;
  const multipliers = {Downside:0.5, Base:1, Upside:1.5};
  const scName = n => L(I18N["sc." + n]);
  const FS = {};
  function growthAt(w) { const first = Math.max(1, w - 4); return w === 1 ? 0.026 : Math.pow(D.bal[w - 1] / D.bal[first - 1], 1 / (w - first)) - 1; }
  function projection(w, horizon, scenario) {
    const values = [D.bal[w - 1]], growth = growthAt(w) * multipliers[scenario];
    for (let k = 0; k < horizon; k++) values.push(values[k] * (1 + growth * Math.pow(0.93, k)));
    return values;
  }
  function backtest(w) {
    const rows = [];
    for (let origin = 1; origin < w; origin++) {
      const actual = D.bal[origin], err = est => 100 * Math.abs(est - actual) / actual;
      rows.push({week:origin + 1, model:err(projection(origin, 1, "Base")[1]), flat:err(D.bal[origin - 1])});
    }
    return rows;
  }
  function limitCheck(w, values, band) {
    const lim = limitBRL, hz = values.length - 1;
    const high = values.map((v, k) => v + band[k]);
    const peakHigh = Math.max(...high), end = values[hz];
    const kBase = values.findIndex(v => v > lim), kHigh = high.findIndex(v => v > lim);
    Object.assign(FS, {w, lim, end, peakHigh, kBase, kHigh, hz, need:Math.max(0, Math.ceil(peakHigh - lim))});
    const box = $("limit-status");
    if (kHigh < 0) {
      box.className = "limitst";
      box.textContent = T(`Fits: top of range peaks at ${money(peakHigh)}, ${nf(100 * peakHigh / lim, 0)}% of the ${money(lim)} approved limit.`,`Cabe: o topo da faixa chega a ${money(peakHigh)}, ${nf(100 * peakHigh / lim, 0)}% do limite aprovado de ${money(lim)}.`);
    } else if (kBase < 0) {
      box.className = "limitst warn";
      box.textContent = T(`Watch: base case fits, but top of range crosses ${money(lim)} in W${w + kHigh}. Pre-approve +${money(FS.need)}.`,`Atenção: o cenário cabe, mas o topo da faixa cruza ${money(lim)} na S${w + kHigh}. Pré-aprovar +${money(FS.need)}.`);
    } else if (kBase === 0) {
      box.className = "limitst bad";
      box.textContent = T(`Breach: current balance (${money(values[0])}) is already above the ${money(lim)} limit. Request +${money(FS.need)}.`,`Estouro: o saldo atual (${money(values[0])}) já ultrapassa o limite de ${money(lim)}. Pedir +${money(FS.need)}.`);
    } else {
      box.className = "limitst bad";
      box.textContent = T(`Breach: projected balance crosses ${money(lim)} in W${w + kBase}. Request +${money(FS.need)} beforehand.`,`Estouro: o saldo projetado cruza ${money(lim)} na S${w + kBase}. Pedir +${money(FS.need)} antes disso.`);
    }
  }
  function forecast(w) {
    const fc = $("fc"), tip = $("fcTip");
    const horizon = curHorizon, scenario = curScenario;
    const values = projection(w, horizon, scenario), end = values[horizon], last = values[0];
    const band = values.map((v, k) => v * D.err[w - 1] / 100 * Math.sqrt(k) / 2.2);
    const low = end - band[horizon], high = end + band[horizon], pctGain = nf((end / last - 1) * 100, 1);
    limitCheck(w, values, band);

    $("outlook").textContent = T(
      `${scName(scenario)} case · W${w + horizon} closes at ${money(end)} (+${pctGain}% vs W${w}). Modeled range: ${money(low)} to ${money(high)}.`,
      `Cenário ${scName(scenario).toLowerCase()} · S${w + horizon} fecha em ${money(end)} (+${pctGain}% acima da S${w}). Faixa modelada: ${money(low)} a ${money(high)}.`
    );
    const n = Math.min(w - 1, 4), g = nf(growthAt(w) * 100, 2);
    $("assumption").textContent = (w === 1
      ? T("Week 1 uses a 2.6% starting growth assumption.","A semana 1 usa uma premissa inicial de crescimento de 2,6%.")
      : T(`Base growth uses the last ${n} observed weekly change${n === 1 ? "" : "s"} (geometric mean ${g}%).`, n === 1 ? `O crescimento base usa a última variação semanal observada (${g}%).` : `O crescimento base usa as últimas ${n} variações semanais observadas (média geométrica de ${g}%).`))
      + T(` Downside/upside use 0.5× and 1.5× base growth with 93% weekly decay. Balances follow (${bn(SPEND / 1000, 1)} × spend % × utilization %) × ${PILOT.tenor}d ÷ 365, the pilot tenor set in Data. The range is a modeled band scaled by this week's forecast error, not a statistical confidence interval.${ccy === "USD" ? ` Displayed in USD. ${fxLabel()}.` : ""}`,
          ` Os cenários pessimista/otimista usam 0,5× e 1,5× o crescimento base com decaimento semanal de 93%. O saldo segue (${bn(SPEND / 1000, 1)} × gasto % × utilização %) × ${PILOT.tenor}d ÷ 365, o prazo do piloto definido em Dados. A faixa é uma banda modelada, proporcional ao erro de projeção da semana, e não um intervalo de confiança estatístico.${ccy === "USD" ? ` Valores em USD. ${fxLabel()}.` : ""}`);

    fc.replaceChildren();
    const count = w + horizon, history = D.bal.slice(0, w);
    const lo = Math.min(...history, ...values.map((v, k) => v - band[k]));
    const hi = Math.max(...history, ...values.map((v, k) => v + band[k]), limitBRL * 1.03);
    const step = [25,50,100,200,250,500,1000].find(st => Math.ceil(hi / st) * st - Math.floor(lo / st) * st <= 4 * st) || 2000;
    const bottom = Math.floor(lo / step) * step, top = bottom + 4 * step;
    const X = idx => 86 + (idx - 1) * 782 / (count - 1);
    const Y = v => 250 - (v - bottom) * 218 / (top - bottom);
    const line = (pts, attrs) => el("polyline", {points:pts.map(p => p.join(",")).join(" "), fill:"none", ...attrs}, fc);

    for (let i = 0; i <= 4; i++) {
      const v = bottom + (top - bottom) * i / 4;
      line([[86, Y(v)], [868, Y(v)]], {stroke:C.grid});
      el("text", {x:78, y:Y(v) + 4, "text-anchor":"end", fill:C.muted, "font-size":11.5}, fc).textContent = money(v);
    }
    const ticks = [1, count];
    for (let n2 = 1; n2 < count - 1; n2 += Math.ceil(count / 7)) ticks.push(n2);
    for (const n2 of new Set(ticks)) el("text", {x:X(n2), y:276, "text-anchor":"middle", fill:C.muted, "font-size":11.5, "font-weight": n2 === w ? 700 : 500}, fc).textContent = WL() + n2;

    if (!SRCINFO && w >= 5) {
      line([[X(5), 34], [X(5), 250]], {stroke:"#8ECAE6", "stroke-dasharray":"3 4"});
      el("text", {x:X(5), y:24, "text-anchor":"middle", fill:C.blue, "font-size":10.5, "font-weight":700}, fc).textContent = T("W5 · Doc AI live","S5 · IA Docs");
    }
    const edge = sign => values.map((v, k) => [X(w + k), Y(v + sign * band[k])]);
    el("polygon", {points:[...edge(1), ...edge(-1).reverse()].map(p => p.join(",")).join(" "), fill:"rgba(0,189,242,.20)"}, fc);
    line(history.map((v, i) => [X(i + 1), Y(v)]), {stroke:C.navy, "stroke-width":3, "stroke-linecap":"round", "stroke-linejoin":"round"});
    line(edge(0), {stroke:C.blue, "stroke-dasharray":"6 4", "stroke-width":3, "stroke-linecap":"round"});
    // Approved limit line
    if (limitBRL >= bottom && limitBRL <= top) {
      line([[86, Y(limitBRL)], [868, Y(limitBRL)]], {stroke:C.red, "stroke-dasharray":"8 5", "stroke-width":1.8});
      el("text", {x:864, y:Math.max(18, Y(limitBRL) - 6), "text-anchor":"end", fill:C.red, "font-size":11.5, "font-weight":700}, fc).textContent = T("Approved limit ","Limite aprovado ") + money(limitBRL);
    }
    line([[X(w), 32], [X(w), 250]], {stroke:C.subtle, "stroke-dasharray":"3 4"});
    el("circle", {cx:X(w), cy:Y(last), r:5, fill:C.navy, stroke:"#fff", "stroke-width":2}, fc);

    const allPts = [
      ...history.map((v, i) => ({wk:i + 1, v, isFc:false})),
      ...values.slice(1).map((v, i) => ({wk:w + i + 1, v, isFc:true, lo:v - band[i + 1], hi:v + band[i + 1]}))
    ];
    allPts.forEach(pt => {
      const cx = X(pt.wk), cy = Y(pt.v);
      const hit = el("circle", {cx, cy, r:11, fill:"transparent", style:"cursor:pointer"}, fc);
      const showTip = () => {
        const rect = fc.getBoundingClientRect(), wrapRect = fc.parentElement.getBoundingClientRect();
        const px = (cx / 900) * rect.width + (rect.left - wrapRect.left), py = (cy / 300) * rect.height + (rect.top - wrapRect.top);
        tip.style.left = Math.max(95, Math.min(wrapRect.width - 95, px)) + "px";
        tip.style.top = Math.max(44, py - 6) + "px";
        tip.innerHTML = `<strong>${WL()}${pt.wk} · ${pt.isFc ? L(I18N["lg.fc"]) : L(I18N["lg.actual"])}</strong><br>${money(pt.v)}`
          + (pt.isFc ? `<br><span style="color:#9FD8F5">${money(pt.lo)} – ${money(pt.hi)}</span>` : "");
        tip.classList.add("show");
      };
      hit.addEventListener("mouseenter", showTip); hit.addEventListener("click", showTip);
      hit.addEventListener("mouseleave", () => tip.classList.remove("show"));
    });
    fc.setAttribute("aria-label", $("outlook").textContent);

    const ends = Object.keys(multipliers).map(name => [name, projection(w, horizon, name)[horizon]]);
    const maxEnd = Math.max(...ends.map(([, val]) => val));
    $("case-bars").innerHTML = ends.map(([name, val]) => `<div class="case-row"><span>${scName(name)}</span><div class="track"><div class="case-fill ${name === scenario ? "selected" : ""}" style="width:${100 * val / maxEnd}%"></div></div><b>${money(val)}</b></div>`).join("");
    $("forecast-rows").innerHTML = values.slice(1).map((v, i) => `<tr><th>${WL()}${w + i + 1}</th><td>${money(v)}</td><td>${money(v - band[i + 1])}</td><td>${money(v + band[i + 1])}</td></tr>`).join("");

    const scores = backtest(w), chart = $("accuracy");
    chart.replaceChildren();
    const avg = k => nf(scores.reduce((s, r) => s + r[k], 0) / scores.length, 2), sN = scores.length;
    $("accuracy-note").textContent = sN
      ? T(`Average absolute percentage error over ${sN} completed forecast${sN === 1 ? "" : "s"}: ${avg("model")}% for the base model vs. ${avg("flat")}% for carrying prior balance forward.`,`Erro percentual absoluto médio em ${sN} projeç${sN === 1 ? "ão apurada" : "ões apuradas"}: ${avg("model")}% no modelo base contra ${avg("flat")}% ao repetir o saldo anterior.`)
      : T("The first forecast can be scored when week 2 closes.","A primeira projeção pode ser avaliada quando a semana 2 fechar.");
    chart.style.display = sN ? "block" : "none";
    if (!sN) return;
    const limit = Math.max(1, ...scores.map(r => Math.ceil(Math.max(r.model, r.flat))));
    [0, limit / 2, limit].forEach(t => {
      const y = 108 - 84 * t / limit;
      el("line", {x1:38, x2:478, y1:y, y2:y, stroke:C.grid}, chart);
      el("text", {x:33, y:y + 4, "text-anchor":"end", "font-size":10.5, fill:C.muted}, chart).textContent = nf(t, t % 1 ? 1 : 0) + "%";
    });
    scores.forEach((r, i) => {
      const group = 432 / sN, cx = 42 + (i + 0.5) * group, width = Math.min(13, group / 3);
      for (const [key, x, color] of [["model", cx - width - 1, C.blue], ["flat", cx + 1, C.slate]]) {
        const h = r[key] / limit * 84;
        const bar = el("rect", {x, y:108 - h, width, height:h, rx:2, fill:color}, chart);
        el("title", {}, bar).textContent = WL() + r.week + " · " + (key === "model" ? L(I18N["lg.model"]) : L(I18N["lg.prior"])) + " · " + nf(r[key], 2) + "%";
      }
      el("text", {x:cx, y:125, "text-anchor":"middle", "font-size":10.5, fill:C.muted}, chart).textContent = WL() + r.week;
    });
  }
  $("scenarioGroup").addEventListener("click", e => {
    const b = e.target.closest("[data-sc]"); if (!b) return;
    curScenario = b.dataset.sc;
    $("scenarioGroup").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    setPlaying(false); forecast(week); plan(week);
  });
  $("horizonGroup").addEventListener("click", e => {
    const b = e.target.closest("[data-hz]"); if (!b) return;
    curHorizon = +b.dataset.hz;
    $("horizonGroup").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    setPlaying(false); forecast(week); plan(week);
  });
  $("limit").oninput = () => {
    const v = parseFloat($("limit").value);
    if (v > 0) { limitBRL = v * fx(); setPlaying(false); forecast(week); plan(week); }
  };

