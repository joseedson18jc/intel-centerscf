  // ========== FORECAST & APPROVED LIMIT CHECK (STEP 2) ==========
  let curScenario = "Base", curHorizon = 13, limitBRL = 650;
  const multipliers = {Downside:0.5, Base:1, Upside:1.5};
  const scName = n => L(I18N["sc." + n]);
  const FS = {};
  // Physical ceiling of the pilot balance: 100% of in-scope spend under the programme at 100% utilization,
  // financed for the pilot tenor. No projection (path or top of range) may go above it.
  const fcCeil = () => SPEND * PILOT.tenor / 365;
  // Base weekly growth: geometric mean of the last (up to 4) weekly changes, counted from the first positive balance
  // of that window, so a zero balance can never produce 0/0. n = number of weekly changes actually used.
  function growthInfo(w) {
    if (w === 1) return {g:0.026, n:0};
    let j = Math.max(1, w - 4);
    while (j < w && !(D.bal[j - 1] > 0)) j++;
    const n = w - j, g = n > 0 && D.bal[w - 1] > 0 ? Math.pow(D.bal[w - 1] / D.bal[j - 1], 1 / n) - 1 : 0;
    return {g:isFinite(g) ? g : 0, n};
  }
  function growthAt(w) { return growthInfo(w).g; }
  // Scenario growth: base growth moved down or up by half of its size (0.5x and 1.5x of a positive growth),
  // so Downside <= Base <= Upside whatever the sign of the recent trend.
  const scGrowth = (g, scenario) => g + (multipliers[scenario] - 1) * Math.abs(g);
  // o.scale multiplies the starting balance (what-if questions); o.cap overrides the ceiling.
  function projection(w, horizon, scenario, o = {}) {
    const k0 = o.scale != null ? o.scale : 1, start = D.bal[w - 1] * k0, cap = o.cap != null ? o.cap : Math.max(fcCeil(), start);
    const values = [start], growth = scGrowth(growthAt(w), scenario);
    for (let k = 0; k < horizon; k++) values.push(Math.min(cap, Math.max(0, values[k] * (1 + growth * Math.pow(0.93, k)))));
    return values;
  }
  // The one forecast every view shows (Step 2, live insights, assistant, action plan): path, modeled band and limit
  // verdict for the scenario actually tested. o: {w, h, sc, lim, scale, ceilScale}. Pure: no DOM, no state written.
  function fcModel(o = {}) {
    const w = o.w || week, h = Math.max(1, Math.min(52, Math.round(o.h || curHorizon))), sc = o.sc || curScenario;
    const lim = o.lim != null ? o.lim : limitBRL, k0 = o.scale != null ? o.scale : 1;
    const cap = Math.max(fcCeil() * (o.ceilScale || 1), D.bal[w - 1] * k0);
    const values = projection(w, h, sc, {scale:k0, cap});
    const e1 = fcErr(w), band = values.map((v, k) => v * e1 / 100 * Math.sqrt(k));
    const lo = values.map((v, k) => Math.max(0, v - band[k])), hi = values.map((v, k) => Math.min(cap, v + band[k]));
    const peakHigh = Math.max(...hi);
    return { w, h, sc, lim, cap, values, band, lo, hi, e1, now:values[0], end:values[h], low:lo[h], high:hi[h], peakHigh,
      capped:values.some((v, k) => k > 0 && v + band[k] >= cap), n:growthInfo(w).n,
      kBase:values.findIndex(v => v > lim), kHigh:hi.findIndex(v => v > lim), need:Math.max(0, Math.ceil(peakHigh - lim)) };
  }
  function backtest(w) {
    const rows = [];
    for (let origin = 1; origin < w; origin++) {
      const actual = D.bal[origin], err = est => 100 * Math.abs(est - actual) / actual;
      if (!(actual > 0)) continue;   // a zero balance has no percentage error to score
      rows.push({week:origin + 1, model:err(projection(origin, 1, "Base")[1]), flat:err(D.bal[origin - 1])});
    }
    return rows;
  }
  // One-week error the range is built on, in % of the balance: root mean square of the one-week-ahead errors this
  // model actually made up to week w (the backtest), with the reported forecast-error KPI of the week counted as one
  // more observation (KPI / 2.2, the previous convention) so weeks 1 and 2 still have a range. It grows with the
  // square root of the weeks ahead. Measured, so it tightens or widens as real misses arrive.
  function fcErr(w) {
    const bt = backtest(w), prior = (D.err[w - 1] || 0) / 2.2;
    const e = Math.sqrt((bt.reduce((s, r) => s + r.model * r.model, 0) + prior * prior) / (bt.length + 1));
    return isFinite(e) ? e : 0;
  }
  // How the range would have done so far: every projection made from weeks 1..w-1 (base case, all horizons already
  // observed), each with the range it had at the time. Returns {hit, n}.
  function bandCoverage(w) {
    let hit = 0, n = 0;
    for (let o = 1; o < w; o++) {
      if (!(D.bal[o - 1] > 0)) continue;
      const v = projection(o, w - o, "Base"), e = fcErr(o);
      for (let k = 1; o + k <= w; k++) { n++; if (Math.abs(D.bal[o + k - 1] - v[k]) <= v[k] * e / 100 * Math.sqrt(k) + 1e-9) hit++; }
    }
    return {hit, n};
  }
  function limitCheck(m) {
    const w = m.w, lim = m.lim, values = m.values, peakHigh = m.peakHigh, kBase = m.kBase, kHigh = m.kHigh;
    Object.assign(FS, {w, sc:m.sc, lim, end:m.end, peakHigh, kBase, kHigh, hz:m.h, need:m.need});
    const box = $("limit-status"), sc = scName(m.sc);
    if (kHigh < 0) {
      box.className = "limitst";
      box.textContent = T(`Fits: top of range peaks at ${money(peakHigh)}, ${nf(100 * peakHigh / lim, 0)}% of the ${money(lim)} approved limit.`,`Cabe: o topo da faixa chega a ${money(peakHigh)}, ${nf(100 * peakHigh / lim, 0)}% do limite aprovado de ${money(lim)}.`);
    } else if (kBase < 0) {
      box.className = "limitst warn";
      box.textContent = T(`Watch: ${sc} case fits, but top of range crosses ${money(lim)} in W${w + kHigh}. Pre-approve +${money(FS.need)}.`,`Atenção: o cenário ${sc.toLowerCase()} cabe, mas o topo da faixa cruza ${money(lim)} na S${w + kHigh}. Pré-aprovar +${money(FS.need)}.`);
    } else if (kBase === 0) {
      box.className = "limitst bad";
      box.textContent = T(`Breach: current balance (${money(values[0])}) is already above the ${money(lim)} limit. Request +${money(FS.need)}.`,`Estouro: o saldo atual (${money(values[0])}) já ultrapassa o limite de ${money(lim)}. Pedir +${money(FS.need)}.`);
    } else {
      box.className = "limitst bad";
      box.textContent = T(`Breach: ${sc} case crosses ${money(lim)} in W${w + kBase}. Request +${money(FS.need)} beforehand.`,`Estouro: o cenário ${sc.toLowerCase()} cruza ${money(lim)} na S${w + kBase}. Pedir +${money(FS.need)} antes disso.`);
    }
  }
  function forecast(w) {
    const fc = $("fc"), tip = $("fcTip");
    const horizon = curHorizon, scenario = curScenario;
    const m = fcModel({w, h:horizon, sc:scenario}), values = m.values, end = m.end, last = m.now;
    const low = m.low, high = m.high, chg = (end / last - 1) * 100, pctGain = nf(Math.abs(chg), 1);
    limitCheck(m);
    if ($("limit")) { $("limit").min = limitField.lo(); $("limit").max = limitField.hi(); }

    $("outlook").textContent = !(last > 0)
      ? T(`No projection for W${w}: the balance rounds to ${money(0)}, so there is no growth to extrapolate. Check spend, utilization and tenor in Data.`,
          `Sem projeção para a S${w}: o saldo arredonda para ${money(0)}, então não há crescimento a extrapolar. Confira gasto, utilização e prazo em Dados.`)
      : T(
      `${scName(scenario)} case · W${w + horizon} closes at ${money(end)} (${chg < 0 ? "−" : "+"}${pctGain}% vs W${w}). Modeled range: ${money(low)} to ${money(high)}.`,
      `Cenário ${scName(scenario).toLowerCase()} · S${w + horizon} fecha em ${money(end)} (${chg < 0 ? pctGain + "% abaixo" : "+" + pctGain + "% acima"} da S${w}). Faixa modelada: ${money(low)} a ${money(high)}.`
    );
    const cov = bandCoverage(w), nb = backtest(w).length;
    const bandNote = [
      `The range is ±${nf(m.e1, 2)}% of the balance for one week ahead, growing with the square root of the weeks: the root-mean-square error of the ${nb} one-week projection${nb === 1 ? "" : "s"} this model has made so far, with the reported error KPI counted as one more observation.${cov.n ? ` Applied to the past, it contained ${cov.hit} of ${cov.n} projections (${nf(100 * cov.hit / cov.n, 0)}%).` : ""} It is one typical error wide, not a statistical confidence interval.`,
      `A faixa é de ±${nf(m.e1, 2)}% do saldo para uma semana à frente e cresce com a raiz quadrada das semanas: é o erro quadrático médio das ${nb === 1 ? "1 projeção de uma semana que este modelo já fez" : nb + " projeções de uma semana que este modelo já fez"}, com o KPI de erro informado contando como mais uma observação.${cov.n ? ` Aplicada ao passado, ela conteve ${cov.hit} de ${cov.n} projeções (${nf(100 * cov.hit / cov.n, 0)}%).` : ""} Tem a largura de um erro típico; não é um intervalo de confiança estatístico.`];
    const n = m.n, gv = growthAt(w) * 100, g = (gv < 0 ? "−" : "") + nf(Math.abs(gv), 2);
    $("assumption").textContent = (w === 1
      ? T("Week 1 uses a 2.6% starting growth assumption.","A semana 1 usa uma premissa inicial de crescimento de 2,6%.")
      : !n ? T("No positive balance in the last weeks, so base growth is set to 0%.","Não há saldo positivo nas últimas semanas, então o crescimento base fica em 0%.")
      : T(`Base growth uses the last ${n} observed weekly change${n === 1 ? "" : "s"} (geometric mean ${g}%).`, n === 1 ? `O crescimento base usa a última variação semanal observada (${g}%).` : `O crescimento base usa as últimas ${n} variações semanais observadas (média geométrica de ${g}%).`))
      + (w > 1 && n > 0 && n < 3 ? T(` Only ${n} weekly change${n === 1 ? " is" : "s are"} available, so read the projection with care.`, ` Só ${n === 1 ? "há 1 variação semanal" : `há ${n} variações semanais`}, então leia a projeção com cautela.`) : "")
      + T(` Downside and upside take off or add half of the base growth (0.5× and 1.5× when it is positive), with 93% weekly decay, so the downside path never sits above the base and the upside never below it. Balances follow (${bn(SPEND / 1000, 1)} × spend % × utilization %) × ${PILOT.tenor}d ÷ 365, the pilot tenor set in Data. Projections are capped at ${money(fcCeil())}, the balance with 100% of in-scope spend under the programme at 100% utilization${m.capped ? "; this cap binds in the projection shown" : ""}. ${bandNote[0]}${ccy === "USD" ? ` Displayed in USD. ${fxLabel()}.` : ""}`,
          ` Os cenários pessimista e otimista tiram ou somam metade do crescimento base (0,5× e 1,5× quando ele é positivo), com decaimento semanal de 93%, de modo que o pessimista nunca fica acima do base nem o otimista abaixo dele. O saldo segue (${bn(SPEND / 1000, 1)} × gasto % × utilização %) × ${PILOT.tenor}d ÷ 365, o prazo do piloto definido em Dados. As projeções ficam limitadas a ${money(fcCeil())}, o saldo com 100% das compras no escopo sob o programa e 100% de utilização${m.capped ? "; esse teto atua na projeção exibida" : ""}. ${bandNote[1]}${ccy === "USD" ? ` Valores em USD. ${fxLabel()}.` : ""}`);

    fc.replaceChildren();
    tip.classList.remove("show");
    const count = w + horizon, history = D.bal.slice(0, w);
    const lo = Math.min(...history, ...m.lo);
    const hi = Math.max(...history, ...m.hi, limitBRL * 1.03);
    const step = [25,50,100,200,250,500,1000].find(st => Math.ceil(hi / st) * st - Math.floor(lo / st) * st <= 4 * st) || 2000;
    const bottom = Math.floor(lo / step) * step, top = bottom + 4 * step;
    // Plot area inside the 900 x 300 viewBox.
    const PX0 = 80, PX1 = 876, PY0 = 30, PY1 = 250;
    const X = idx => PX0 + (idx - 1) * (PX1 - PX0) / Math.max(1, count - 1);
    const Y = v => PY1 - (v - bottom) * (PY1 - PY0) / (top - bottom);
    const line = (pts, attrs) => el("polyline", {points:pts.map(p => p.join(",")).join(" "), fill:"none", ...attrs}, fc);
    const halo = isDark() ? "#0D1B30" : "#FFFFFF";   // card surface: keeps a label readable where it crosses a line

    // Soft fills: area under the realised balance, and the modeled band fading towards the horizon.
    const defs = el("defs", {}, fc);
    const grad = (id, stops, horiz) => { const g = el("linearGradient", {id, x1:0, y1:0, x2:horiz ? 1 : 0, y2:horiz ? 0 : 1}, defs); stops.forEach(([o, c, a]) => el("stop", {offset:o, "stop-color":c, "stop-opacity":a}, g)); };
    grad("fcAreaG", [[0, C.blue, isDark() ? .26 : .16], [1, C.blue, 0]]);
    grad("fcBandG", [[0, C.sky, isDark() ? .16 : .14], [1, C.sky, isDark() ? .34 : .30]], true);

    for (let i = 0; i <= 4; i++) {
      const v = bottom + (top - bottom) * i / 4;
      line([[PX0, Y(v)], [PX1, Y(v)]], {stroke:C.grid, "stroke-width":1, ...(i ? {"stroke-dasharray":"2 5"} : {})});
      el("text", {x:PX0 - 10, y:Y(v) + 4, "text-anchor":"end", fill:C.subtle, "font-size":11, "font-weight":500}, fc).textContent = money(v);
    }
    const ticks = [1, count];
    for (let n2 = 1; n2 < count - 1; n2 += Math.ceil(count / 7)) ticks.push(n2);
    for (const n2 of new Set(ticks)) el("text", {x:X(n2), y:PY1 + 22, "text-anchor":"middle", fill:n2 === w ? C.navy : C.subtle, "font-size":11, "font-weight": n2 === w ? 700 : 500}, fc).textContent = WL() + n2;

    if (!SRCINFO && w >= 5) {
      line([[X(5), PY0 + 6], [X(5), PY1]], {stroke:C.sky, "stroke-opacity":.7, "stroke-dasharray":"2 4"});
      el("text", {x:X(5), y:PY0 - 4, "text-anchor":"middle", fill:C.blue, "font-size":10.5, "font-weight":700}, fc).textContent = T("W5 · Doc AI live","S5 · IA Docs");
    }
    const edge = sign => values.map((v, k) => [X(w + k), Y(sign > 0 ? m.hi[k] : sign < 0 ? m.lo[k] : v)]);
    el("polygon", {points:[...edge(1), ...edge(-1).reverse()].map(p => p.join(",")).join(" "), fill:"url(#fcBandG)"}, fc);
    const histPts = history.map((v, i) => [X(i + 1), Y(v)]);
    if (histPts.length > 1) el("polygon", {points:[...histPts, [X(w), PY1], [X(1), PY1]].map(p => p.join(",")).join(" "), fill:"url(#fcAreaG)"}, fc);
    line(histPts, {stroke:C.navy, "stroke-width":2.6, "stroke-linecap":"round", "stroke-linejoin":"round"});
    line(edge(0), {stroke:C.blue, "stroke-dasharray":"5 5", "stroke-width":2.6, "stroke-linecap":"round", "stroke-linejoin":"round"});
    // Approved limit line (label on the left, where the history sits low, so it never collides with the end value)
    if (limitBRL >= bottom && limitBRL <= top) {
      line([[PX0, Y(limitBRL)], [PX1, Y(limitBRL)]], {stroke:C.red, "stroke-dasharray":"7 5", "stroke-width":1.6});
      el("text", {x:PX0 + 8, y:Math.max(PY0 - 6, Y(limitBRL) - 7), "text-anchor":"start", fill:C.red, "font-size":11, "font-weight":700, stroke:halo, "stroke-width":4, "paint-order":"stroke", "stroke-linejoin":"round"}, fc).textContent = T("Approved limit ","Limite aprovado ") + money(limitBRL);
    }
    line([[X(w), PY0 + 6], [X(w), PY1]], {stroke:C.subtle, "stroke-opacity":.6, "stroke-dasharray":"2 4"});
    el("circle", {cx:X(w), cy:Y(last), r:5, fill:C.navy, stroke:halo, "stroke-width":2.5}, fc);
    // Value at the end of the horizon, written next to the last point.
    const endX = X(count), endY = Y(end);
    // End label sits above the point unless the top edge or the limit line is in the way
    const limY = (limitBRL >= bottom && limitBRL <= top) ? Y(limitBRL) : -99;
    const endLabBelow = endY - PY0 < 26 || (limY > endY - 28 && limY < endY - 2);
    el("circle", {cx:endX, cy:endY, r:4, fill:halo, stroke:C.blue, "stroke-width":2.4}, fc);
    el("text", {x:endX - 8, y:endY + (endLabBelow ? 21 : -11), "text-anchor":"end", fill:C.navy, "font-size":12, "font-weight":700, stroke:halo, "stroke-width":4, "paint-order":"stroke", "stroke-linejoin":"round"}, fc).textContent = money(end);

    // Hover or tap anywhere on the plot: a guide snaps to the nearest week and the tooltip reads that week.
    const allPts = [
      ...history.map((v, i) => ({wk:i + 1, v, isFc:false})),
      ...values.slice(1).map((v, i) => ({wk:w + i + 1, v, isFc:true, lo:m.lo[i + 1], hi:m.hi[i + 1]}))
    ];
    const guide = el("line", {x1:0, x2:0, y1:PY0 + 6, y2:PY1, stroke:C.blue, "stroke-width":1, "stroke-opacity":.55, visibility:"hidden"}, fc);
    const mark = el("circle", {r:5.5, fill:C.blue, stroke:halo, "stroke-width":2.5, visibility:"hidden"}, fc);
    const hit = el("rect", {x:PX0 - 12, y:PY0 - 10, width:PX1 - PX0 + 24, height:PY1 - PY0 + 20, fill:"transparent", style:"cursor:crosshair"}, fc);
    const showTip = ev => {
      const rect = fc.getBoundingClientRect(), wrapRect = fc.parentElement.getBoundingClientRect();
      if (!rect.width) return;
      const sx = (ev.clientX - rect.left) / rect.width * 900;
      const pt = allPts[Math.max(0, Math.min(allPts.length - 1, Math.round((sx - PX0) / (PX1 - PX0) * (count - 1))))];
      const cx = X(pt.wk), cy = Y(pt.v);
      guide.setAttribute("x1", cx); guide.setAttribute("x2", cx); guide.setAttribute("visibility", "visible");
      mark.setAttribute("cx", cx); mark.setAttribute("cy", cy); mark.setAttribute("fill", pt.isFc ? C.blue : C.navy); mark.setAttribute("visibility", "visible");
      const px = (cx / 900) * rect.width + (rect.left - wrapRect.left) + fc.parentElement.scrollLeft, py = (cy / 300) * rect.height + (rect.top - wrapRect.top);
      tip.style.left = Math.max(95, Math.min(fc.parentElement.scrollWidth - 95, px)) + "px";
      tip.innerHTML = `<span class="ct-k">${WL()}${pt.wk} · ${pt.isFc ? L(I18N["lg.fc"]) : L(I18N["lg.actual"])}</span><strong>${money(pt.v)}</strong>`
        + (pt.isFc ? `<span class="ct-r">${money(pt.lo)} – ${money(pt.hi)}</span>` : "")
        + (limitBRL > 0 ? `<span class="ct-r">${nf(100 * pt.v / limitBRL, 0)}% ${T("of the limit","do limite")}</span>` : "");
      const th = tip.offsetHeight || 84;   // the tip hangs above its anchor (translate -100%); flip it below when the top edge is too close
      tip.style.top = (py - 12 >= th + 8 ? py - 12 : py + 16 + th) + "px";
      tip.classList.add("show");
    };
    const hideTip = () => { tip.classList.remove("show"); guide.setAttribute("visibility", "hidden"); mark.setAttribute("visibility", "hidden"); };
    hit.addEventListener("pointermove", showTip); hit.addEventListener("pointerdown", showTip);
    hit.addEventListener("pointerleave", hideTip);
    fc.setAttribute("aria-label", $("outlook").textContent);

    // Closing balance of each scenario on one scale that also holds the approved limit (the red mark), so the
    // distance of every bar to the limit can be read at a glance. Percentages are closing balance / limit.
    const ends = Object.keys(multipliers).map(name => [name, projection(w, horizon, name)[horizon]]);
    const maxEnd = Math.max(...ends.map(([, val]) => val), limitBRL) || 1;
    const limPos = Math.min(99.4, 100 * limitBRL / maxEnd);
    $("case-bars").innerHTML = ends.map(([name, val]) => {
      const pct = limitBRL > 0 ? 100 * val / limitBRL : 0;
      return `<div class="case-row${name === scenario ? " selected" : ""}"><span>${scName(name)}</span><div class="track case-track"><div class="case-fill ${name === scenario ? "selected" : ""}" style="width:${100 * val / maxEnd}%"></div><i class="case-lim" style="left:${limPos}%"></i></div><b>${money(val)}</b><small class="case-pct${pct > 100 ? " over" : ""}">${nf(pct, 0)}% ${T("of limit","do limite")}</small></div>`;
    }).join("")
      + `<p class="case-foot"><i class="case-lim-key"></i>${T(`Red mark: approved limit of ${money(limitBRL)}.`,`Marca vermelha: limite aprovado de ${money(limitBRL)}.`)} ${end <= limitBRL
        ? T(`The ${scName(scenario).toLowerCase()} case closes ${money(limitBRL - end)} below it.`,`O cenário ${scName(scenario).toLowerCase()} fecha ${money(limitBRL - end)} abaixo dele.`)
        : T(`The ${scName(scenario).toLowerCase()} case closes ${money(end - limitBRL)} above it.`,`O cenário ${scName(scenario).toLowerCase()} fecha ${money(end - limitBRL)} acima dele.`)}</p>`;
    $("forecast-rows").innerHTML = values.slice(1).map((v, i) => `<tr><th>${WL()}${w + i + 1}</th><td>${money(v)}</td><td>${money(m.lo[i + 1])}</td><td>${money(m.hi[i + 1])}</td></tr>`).join("");

    const scores = backtest(w), chart = $("accuracy");
    chart.replaceChildren();
    const avg = k => nf(scores.reduce((s, r) => s + r[k], 0) / scores.length, 2), sN = scores.length;
    $("accuracy-note").textContent = sN
      ? T(`Average absolute percentage error over ${sN} completed forecast${sN === 1 ? "" : "s"}: ${avg("model")}% for the base model vs. ${avg("flat")}% for carrying prior balance forward.`,`Erro percentual absoluto médio em ${sN} projeç${sN === 1 ? "ão apurada" : "ões apuradas"}: ${avg("model")}% no modelo base contra ${avg("flat")}% ao repetir o saldo anterior.`)
      : w > 1 ? T("No forecast can be scored yet: the balances so far round to zero.", "Nenhuma projeção pode ser avaliada ainda: os saldos até aqui arredondam para zero.") : T("The first forecast can be scored when week 2 closes.","A primeira projeção pode ser avaliada quando a semana 2 fechar.");
    chart.style.display = sN ? "block" : "none";
    $("accuracy-note").classList.toggle("empty-state", !sN);   // nothing to plot yet: the note stands in for the chart
    if (!sN) return;
    const limit = Math.max(1, ...scores.map(r => Math.ceil(Math.max(r.model, r.flat))));
    [0, limit / 2, limit].forEach(t => {
      const y = 108 - 84 * t / limit;
      el("line", {x1:38, x2:478, y1:y, y2:y, stroke:C.grid, ...(t ? {"stroke-dasharray":"2 5"} : {})}, chart);
      el("text", {x:33, y:y + 4, "text-anchor":"end", "font-size":10.5, fill:C.subtle}, chart).textContent = nf(t, t % 1 ? 1 : 0) + "%";
    });
    scores.forEach((r, i) => {
      const group = 432 / sN, cx = 42 + (i + 0.5) * group, width = Math.min(13, group / 3);
      for (const [key, x, color] of [["model", cx - width - 1, C.blue], ["flat", cx + 1, C.slate]]) {
        const h = r[key] / limit * 84;
        const bar = el("rect", {x, y:108 - h, width, height:Math.max(h, 0.8), rx:Math.min(3, width / 2), fill:color}, chart);
        el("title", {}, bar).textContent = WL() + r.week + " · " + (key === "model" ? L(I18N["lg.model"]) : L(I18N["lg.prior"])) + " · " + nf(r[key], 2) + "%";
      }
      el("text", {x:cx, y:125, "text-anchor":"middle", "font-size":10.5, fill:C.subtle}, chart).textContent = WL() + r.week;
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
  // Number fields outside the Data modal (limit here, pipeline inputs in 09): while typing, an unreadable or
  // out-of-range value is marked and explained and the clamped value is used; on leaving the field it shows the
  // value actually in use. o: {lo(), hi(), d, get(), set(v), show()}. The hint follows the language on refresh.
  // Creates (once) the hint line right after the given element.
  function fieldHint(id, after) {
    let h = $(id);
    if (!h && after && after.parentNode) { h = document.createElement("p"); h.id = id; h.className = "field-hint"; h.setAttribute("role", "status"); h.hidden = true; after.parentNode.insertBefore(h, after.nextSibling); }
    return h;
  }
  function fieldEdit(inp, hint, o, commit) {
    const raw = String(inp.value).trim(), n = parseFloat(raw.replace(",", ".")), lo = o.lo(), hi = o.hi();
    const say = fn => { if (!hint) return; hint._msg = fn; hint.textContent = fn ? fn() : ""; hint.hidden = !fn; };
    if (raw === "" || !isFinite(n)) {
      if (commit) { inp.value = o.show(); inp.removeAttribute("aria-invalid"); say(null); }
      else { inp.setAttribute("aria-invalid", "true"); say(() => T("Type a number. The last valid value stays in use.","Digite um número. O último valor válido continua em uso.")); }
      return;
    }
    const v = clampNum(n, lo, hi), out = v !== n;
    if (v !== o.get()) o.set(v);
    if (commit) inp.value = o.show();
    if (out && !commit) inp.setAttribute("aria-invalid", "true"); else inp.removeAttribute("aria-invalid");
    const f = x => nf(x, x % 1 ? o.d : 0);
    say(out ? () => T(`Allowed range: ${f(lo)} to ${f(hi)}. Using ${f(v)}.`,`Faixa permitida: ${f(lo)} a ${f(hi)}. Usando ${f(v)}.`) : null);
  }
  onRefresh(() => document.querySelectorAll(".field-hint").forEach(h => { if (h._msg) h.textContent = h._msg(); }));
  const limitField = {lo:() => Math.ceil(LIMIT_RANGE[0] / fx()), hi:() => Math.floor(LIMIT_RANGE[1] / fx()), d:0,
    get:() => limitBRL / fx(), show:() => Math.round(limitBRL / fx()),
    set:v => { limitBRL = v * fx(); setPlaying(false); forecast(week); plan(week); }};
  if ($("limit")) {
    const li = $("limit"), lh = fieldHint("limit-hint", li.closest(".fc-controls") || li.parentNode);
    li.oninput = () => fieldEdit(li, lh, limitField, false);
    li.onchange = () => fieldEdit(li, lh, limitField, true);
  }

