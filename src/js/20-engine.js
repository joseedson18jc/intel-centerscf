  // ========== LOCAL ANSWER ENGINE (rule-based, no network; ported from V13 and rebuilt on this codebase) ==========
  // Contract shared with the assistant module:
  //   askLocal(question)      -> { title, html, step: 1|2|3|4|null, chips: string[] }   (html is escaped; never throws)
  //   engineSuggestions()     -> 4 to 6 starter questions for the selected week, in the current language
  //   engineContext()         -> compact JSON-serialisable snapshot of what the dashboard shows now
  // Every figure is read from the functions and containers the screen uses (projection, backtest, growthAt, totals,
  // flowOf, balOf, revOf, shareRows, sigOf, worstStep, firstLever, ACTS, KPIS series). What-if answers never write
  // to state: they work on local copies. It is a set of rules over the panel's numbers, nothing more.
  const engNorm = s => String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
  const engPlain = h => String(h).replace(/<[^>]+>/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  const engWk = n => WL() + n;
  const engLc1 = t => { t = String(t); return /^[A-ZÀ-Ý][a-zà-ÿ]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t; };
  const engQuote = t => "\u201C" + String(t).replace(/[.]$/, "") + "\u201D";
  const engDsName = () => L(DS().name);
  const engStepName = n => T("Step ", "Etapa ") + n + " · " + L(I18N["st." + n + ".short"]);
  const engSmall = s => `<small>${s}</small>`;
  const engPct = (v, d = 0) => nf(v, d) + "%";
  const engSigned = (v, fmt) => (v >= 0 ? "+" : "−") + fmt(Math.abs(v));
  const engGrowthPct = () => { const g = growthAt(week) * 100; return (g < 0 ? "−" : "") + nf(Math.abs(g), 2) + "%"; };

  // Where the numbers of an answer come from, in words that never upgrade example data to real data.
  function engSource(kind) {
    if (kind === "pilot") return SRCINFO
      ? T(`weekly data loaded in the panel (${esc(SRCINFO.name)})`, `dados semanais carregados no painel (${esc(SRCINFO.name)})`)
      : T("pilot example data", "dados de exemplo do piloto");
    if (kind === "funnel") return T("funnel example data (fixed invitation wave)", "dados de exemplo do funil (onda de convites fixa)");
    if (kind === "pipeline") return T(`public revenues of the "${esc(engDsName())}" dataset times editable hypotheses, not bank data`, `receitas públicas do conjunto "${esc(engDsName())}" vezes hipóteses editáveis, não são dados do banco`);
    if (kind === "market") return T(`figures fabricated for the prototype, "${esc(engDsName())}" dataset`, `números fabricados para o protótipo, conjunto "${esc(engDsName())}"`);
    if (kind === "product") return T("summary of Citi Brasil public pages, not internal data", "resumo de páginas públicas do Citi Brasil, não é dado interno");
    return "";
  }
  const engFab = () => engSmall(T(`Market figures are fabricated for the prototype, as labelled on screen (dataset in use: "${esc(engDsName())}"). They do not describe real funding relationships.`, `Os números de mercado são fabricados para o protótipo, como indicado na tela (conjunto em uso: "${esc(engDsName())}"). Não representam relações reais de financiamento.`));
  function engOut(title, html, step, kinds, chips) {
    const src = (Array.isArray(kinds) ? kinds : kinds ? [kinds] : []).map(engSource).filter(Boolean).join("; ");
    const foot = (step ? T(`Evidence on screen: ${engStepName(step)}.`, `Evidência na tela: ${engStepName(step)}.`) : "") + (src ? " " + T(`Source: ${src}.`, `Fonte: ${src}.`) : "");
    return { title, html: html + (foot.trim() ? `<small class="eng-foot">${foot.trim()}</small>` : ""), step: step || null, chips: (chips || []).filter(Boolean).slice(0, 4) };
  }

  // ---------- forecast: the same pure model as Step 2 (fcModel in 08), so screen, insights and answers never differ ----------
  // o: {w, h, sc, lim, scale, ceilScale}. scale multiplies the whole balance path (used by what-if questions).
  function engFc(o = {}) { return fcModel(o); }
  const engFcTone = f => f.kBase >= 0 ? "bad" : f.kHigh >= 0 ? "warn" : "good";
  function engLimitLine(f) {
    if (f.kBase === 0) return T(`The balance (${money(f.now)}) is already above the ${money(f.lim)} limit; request +${money(f.need)}.`, `O saldo (${money(f.now)}) já está acima do limite de ${money(f.lim)}; pedir +${money(f.need)}.`);
    if (f.kBase > 0) return T(`In the ${scName(f.sc)} case the balance crosses the ${money(f.lim)} limit in <b>${engWk(f.w + f.kBase)}</b>; request +${money(f.need)} before then.`, `No cenário ${scName(f.sc).toLowerCase()}, o saldo passa do limite de ${money(f.lim)} na <b>${engWk(f.w + f.kBase)}</b>; pedir +${money(f.need)} antes disso.`);
    if (f.kHigh >= 0) return T(`The ${scName(f.sc)} path stays under the ${money(f.lim)} limit, but the top of the range crosses it in <b>${engWk(f.w + f.kHigh)}</b>; pre-approve +${money(f.need)}.`, `A trajetória do cenário ${scName(f.sc).toLowerCase()} fica abaixo do limite de ${money(f.lim)}, mas o topo da faixa passa dele na <b>${engWk(f.w + f.kHigh)}</b>; pré-aprovar +${money(f.need)}.`);
    return T(`It fits the ${money(f.lim)} limit through ${engWk(f.w + f.h)}: the top of the range peaks at ${money(f.peakHigh)}, ${engPct(100 * f.peakHigh / f.lim)} of the limit.`, `Cabe no limite de ${money(f.lim)} até a ${engWk(f.w + f.h)}: o topo da faixa chega a ${money(f.peakHigh)}, ${engPct(100 * f.peakHigh / f.lim)} do limite.`);
  }

  // ---------- question parsing ----------
  const engScenIn = q => /otimista|upside|optimis/.test(q) ? "Upside" : /pessimista|downside|pessimis/.test(q) ? "Downside" : curScenario;
  const ENG_WEEK_REL = /(?:\bem|\bin|daqui a|next|nas proximas|proximas?|ate)\s+(\d{1,2})\s+(?:semanas?|weeks?)/;
  const ENG_WEEK_ABS = /(?:\bs|\bw|semana |week |\bsem\.? ?|\bwk\.? ?)(\d{1,2})\b/;
  function engWeekIn(q) {
    let m = q.match(ENG_WEEK_REL); if (m) return week + (+m[1]);
    m = q.match(/(\d{1,2})\s+(?:semanas?|weeks?)\s+(?:a frente|ahead|from now)/); if (m) return week + (+m[1]);
    m = q.match(ENG_WEEK_ABS); if (m) return +m[1];
    return null;
  }
  // First number of the question that is not a week reference: {v, scale} where scale is 1000 for "bi/bn/billion".
  function engNumIn(q) {
    const q2 = q.replace(ENG_WEEK_REL, " ").replace(/(\d{1,2})\s+(?:semanas?|weeks?)\s+(?:a frente|ahead|from now)/, " ").replace(ENG_WEEK_ABS, " ").replace(/\b[1-4]o?\s*(?:tri|t)\d{0,2}\b|\b[1-4]q\d{2}\b|\bd[1-3]\b/g, " ");
    const m = q2.match(/(\d+(?:[.,]\d+)*)\s*(bilh\w*|billions?|bi\b|bn\b|milh\w*|millions?|mi\b|mm\b|m\b)?/);
    if (!m) return null;
    let s = m[1];
    s = /^\d{1,3}([.,]\d{3})+$/.test(s) ? s.replace(/[.,]/g, "") : s.replace(",", ".");
    const v = parseFloat(s); if (!isFinite(v)) return null;
    return { v, scale: /^(bi|bn)/.test(m[2] || "") ? 1000 : 1 };
  }
  const ENG_DOWN = /cair|caia|caisse|\bcai\b|reduz|diminu|baix|fall|fell|drop|decreas|lower|menos|less|recu|encurt|shorten|cut\b/;
  const ENG_UP = /subir|subisse|\bsobe\b|aument|cresc|elev|rise|rose|rais|increas|higher|grow|\bmais\b|more|alonga|along|extend|lengthen|gain|ganh/;
  // Turns "rises 5", "falls 2" or "is 90 / goes to 90" into a target value from the current one.
  function engTarget(cur, q, n) {
    const dir = ENG_DOWN.test(q) ? -1 : ENG_UP.test(q) ? 1 : 0;
    const explicit = /\b(para|to|ate|at)\s+(?:r\$ ?|us\$ ?|\$ ?|cdi ?\+ ?)?\d/.test(q);
    return dir && !explicit ? { to: cur + dir * n, delta: dir * n, abs: false } : { to: n, delta: n - cur, abs: true };
  }

  // ---------- KPI answers ----------
  const ENG_KPI = {
    active: { re: /fornecedor|supplier|ativos|\bactive\b|adesao|adoption/, d: 0, step: 1 },
    util:   { re: /utiliza/, d: 0, pct: 1, step: 1 },
    spend:  { re: /gasto|spend/, d: 0, pct: 1, step: 1 },
    sow:    { re: /share of wallet|wallet|participa|\bshare\b/, d: 0, pct: 1, step: 1 },
    days:   { re: /\bdias\b|\bdays\b|prazo ate|time to first|primeiro desconto|first discount/, d: 0, step: 1 },
    rev:    { re: /receita|revenue|rentab|profit/, d: 1, money: 1, step: 1 },
    flags:  { re: /alerta|flag|risco|risk/, d: 0, step: 1 },
    err:    { re: /\berro\b|error/, d: 1, pct: 1, step: 2 }
  };
  const engKpiDef = k => KPIS.find(m => m.k === k);
  const engKpiVal = (k, v) => ENG_KPI[k].money ? moneyD(v, revDec()) : nf(v, ENG_KPI[k].d) + (ENG_KPI[k].pct ? "%" : k === "days" ? T(" days", " dias") : "");
  // Straight-line trend of the last (up to) four weeks: a simple extrapolation, labelled as such in the answer.
  function engTrend(k, ahead) {
    const s = engKpiDef(k).series, n = Math.min(4, week - 1), last = s[week - 1];
    const slope = n ? (last - s[week - 1 - n]) / n : 0;
    const hi = k === "active" ? BASE_SUP : ENG_KPI[k].pct ? 100 : Infinity;
    return { last, slope, n, proj: Math.min(hi, Math.max(0, last + slope * ahead)) };
  }
  function engAnsKpi(k, q) {
    const m = engKpiDef(k), tgt = engWeekIn(q), ahead = tgt && tgt > week ? Math.min(52, tgt - week) : 4, t = engTrend(k, ahead), s = m.series, lbl = esc(L(m.lbl));
    const chips = [T("Summarise this week", "Resuma esta semana"), T("What should I do this week?", "O que devo fazer nesta semana?")];
    if (tgt && tgt <= week && tgt >= 1) return engOut(lbl, T(`${lbl} in ${engWk(tgt)}: <b>${engKpiVal(k, s[tgt - 1])}</b>. In ${engWk(week)}, the selected week, it is ${engKpiVal(k, t.last)}.`, `${lbl} na ${engWk(tgt)}: <b>${engKpiVal(k, s[tgt - 1])}</b>. Na ${engWk(week)}, a semana selecionada, está em ${engKpiVal(k, t.last)}.`), ENG_KPI[k].step, "pilot", chips);
    const d = t.slope, dtxt = ENG_KPI[k].money ? moneyD(Math.abs(d), 2) : nf(Math.abs(d), 1) + (ENG_KPI[k].pct ? " pp" : "");
    let out = T(`${lbl}: <b>${engKpiVal(k, t.last)}</b> in ${engWk(week)}. `, `${lbl}: <b>${engKpiVal(k, t.last)}</b> na ${engWk(week)}. `);
    if (t.n) {
      out += d === 0 ? T("It has been flat over the last weeks. ", "Está estável nas últimas semanas. ")
        : T(`It has been ${d > 0 ? "rising" : "falling"} about ${dtxt} per week. `, `Vem ${d > 0 ? "subindo" : "caindo"} cerca de ${dtxt} por semana. `);
      out += T(`At that pace it reaches <b>${engKpiVal(k, t.proj)}</b> in ${engWk(week + ahead)}.`, `Nesse ritmo chega a <b>${engKpiVal(k, t.proj)}</b> na ${engWk(week + ahead)}.`);
    } else out += T("There is no earlier week to draw a trend from.", "Não há semana anterior para traçar uma tendência.");
    if (k === "active") {
      const left = BASE_SUP - t.last;
      out += T(` That is ${engPct(100 * t.last / BASE_SUP)} of the supplier base of ${nf(BASE_SUP)}.`, ` Isso equivale a ${engPct(100 * t.last / BASE_SUP)} da base de ${nf(BASE_SUP)} fornecedores.`);
      if (d > 0 && left > 0) out += T(` Covering the whole base would take about ${nf(Math.ceil(left / d))} more weeks at this pace.`, ` Para cobrir a base inteira faltariam cerca de ${nf(Math.ceil(left / d))} semanas nesse ritmo.`);
    }
    if (k === "days") out += T(` The action plan asks for 10 days or less: today it is ${t.last > 10 ? "above" : "within"} that mark.`, ` O plano de ação pede 10 dias ou menos: hoje está ${t.last > 10 ? "acima" : "dentro"} dessa marca.`);
    if (k === "rev") out += T(` Revenue is the balance (${money(D.bal[week - 1])}) times the pilot spread of ${nf(PILOT.spread, 2)}% a year.`, ` A receita é o saldo (${money(D.bal[week - 1])}) vezes o spread do piloto de ${nf(PILOT.spread, 2)}% ao ano.`);
    out += engSmall(T(`Method: straight-line trend of the last ${t.n || 1} week${t.n > 1 ? "s" : ""}. It is a simple extrapolation, not a statistical forecast.`, `Método: tendência linear ${t.n > 1 ? "das últimas " + t.n + " semanas" : "da última semana"}. É uma extrapolação simples, não uma previsão estatística.`));
    return engOut(lbl, out, ENG_KPI[k].step, "pilot", chips);
  }
  function engAnsFlags() {
    const n = D.flags[week - 1], hold = n >= 3;
    let out = T(`<b>${n} open risk flag${n === 1 ? "" : "s"}</b> in ${engWk(week)}. The action plan uses a growth gate of 3: at 3 or more it holds the campaign, below 3 it lets it scale. Today the gate is <b>${hold ? "closed" : "open"}</b>.`,
      `<b>${n} ${n === 1 ? "alerta de risco aberto" : "alertas de risco abertos"}</b> na ${engWk(week)}. O plano de ação usa uma trava de crescimento de 3: com 3 ou mais ele segura a campanha, abaixo de 3 libera a expansão. Hoje a trava está <b>${hold ? "fechada" : "aberta"}</b>.`);
    const shown = ALERTS.filter(a => a[0] <= week).sort((a, b) => b[0] - a[0]).slice(0, 2);
    if (shown.length) out += " " + T("Latest alerts listed on screen (example alerts): ", "Últimos alertas listados na tela (alertas de exemplo): ") + shown.map(a => `${engWk(a[0])} · ${L(a[2])}`).join("; ") + ".";
    return engOut(T("Risk flags and growth gate", "Alertas de risco e trava de crescimento"), out, 1, "pilot", [T("What should I do this week?", "O que devo fazer nesta semana?"), T("Where is the funnel bottleneck?", "Onde está o gargalo do funil?")]);
  }

  // ---------- forecast, limit, accuracy ----------
  function engAnsForecast(q) {
    const sc = engScenIn(q), tgt = engWeekIn(q) || week + curHorizon, now = D.bal[week - 1];
    const chips = [T("Does the balance fit the approved limit?", "O saldo cabe no limite aprovado?"), T("What if utilization rises 5 points?", "E se a utilização subir 5 pontos?"), T("How accurate was the one-week forecast?", "Qual foi a precisão da projeção de uma semana?")];
    if (tgt <= week && tgt >= 1) return engOut(T("Balance", "Saldo"), T(`In ${engWk(tgt)} the balance was <b>${money(D.bal[tgt - 1])}</b>${tgt === week ? " (the selected week)" : `; in ${engWk(week)}, the selected week, it is ${money(now)}`}.`, `Na ${engWk(tgt)} o saldo foi de <b>${money(D.bal[tgt - 1])}</b>${tgt === week ? " (a semana selecionada)" : `; na ${engWk(week)}, a semana selecionada, está em ${money(now)}`}.`), 2, "pilot", chips);
    const f = engFc({ h: tgt - week, sc }), n = f.n;
    const out = T(`${scName(sc)} case: the balance should close ${engWk(week + f.h)} at <b>${money(f.end)}</b>, with a modeled range of ${money(f.low)} to ${money(f.high)}. In ${engWk(week)} it is ${money(now)}${now > 0 ? `, so that is ${engSigned((f.end / now - 1) * 100, v => nf(v, 1))}%` : ""}. `,
      `Cenário ${scName(sc).toLowerCase()}: o saldo deve fechar a ${engWk(week + f.h)} em <b>${money(f.end)}</b>, com faixa modelada de ${money(f.low)} a ${money(f.high)}. Na ${engWk(week)} ele está em ${money(now)}${now > 0 ? `, ou seja, ${engSigned((f.end / now - 1) * 100, v => nf(v, 1))}%` : ""}. `)
      + engLimitLine(f)
      + engSmall(week === 1
        ? T("Method: week 1 uses a 2.6% starting growth assumption, decaying 7% per week; the range comes from the forecast error of the week.", "Método: a semana 1 usa uma premissa inicial de crescimento de 2,6%, com decaimento de 7% por semana; a faixa vem do erro de projeção da semana.")
        : T(`Method: geometric mean of the last ${n} weekly change${n === 1 ? "" : "s"} (${engGrowthPct()}), decaying 7% per week; downside and upside take off or add half of that growth (0.5× and 1.5× when it is positive); the range comes from the forecast error of the week (${nf(D.err[week - 1], 1)}%); every point is capped at ${money(f.cap)}, 100% of in-scope spend at 100% utilization.`, `Método: média geométrica ${n === 1 ? "da última variação semanal" : "das últimas " + n + " variações semanais"} (${engGrowthPct()}), com decaimento de 7% por semana; pessimista e otimista tiram ou somam metade desse crescimento (0,5× e 1,5× quando ele é positivo); a faixa vem do erro de projeção da semana (${nf(D.err[week - 1], 1)}%); todo ponto fica limitado a ${money(f.cap)}, 100% das compras no escopo com 100% de utilização.`));
    return engOut(T(`Balance forecast · ${engWk(week + f.h)}`, `Projeção de saldo · ${engWk(week + f.h)}`), out, 2, "pilot", chips);
  }
  function engAnsLimit(q) {
    const sc = engScenIn(q), tgt = engWeekIn(q), h = tgt && tgt > week ? tgt - week : curHorizon;
    const f = engFc({ h, sc }), far = engFc({ h: Math.max(26, h), sc }), now = D.bal[week - 1];
    let out = T(`${scName(sc)} case, ${f.h}-week horizon${h === curHorizon ? " (the one on screen)" : ""}: `, `Cenário ${scName(sc).toLowerCase()}, horizonte de ${f.h} semanas${h === curHorizon ? " (o da tela)" : ""}: `) + engLimitLine(f)
      + " " + T(`Balance in ${engWk(week)}: ${money(now)}, ${engPct(100 * now / f.lim)} of the limit.`, `Saldo na ${engWk(week)}: ${money(now)}, ${engPct(100 * now / f.lim)} do limite.`);
    if (far.h > f.h && engFcTone(f) !== "bad") out += " " + T(`Looking ${far.h} weeks ahead with the same model: `, `Olhando ${far.h} semanas à frente com o mesmo modelo: `) + engLimitLine(far);
    out += engSmall(T("The limit is the value typed in the Step 2 field. The verdict compares it with the path of the scenario named above and with the top of the error range.", "O limite é o valor digitado no campo da Etapa 2. O veredito compara esse valor com a trajetória do cenário indicado acima e com o topo da faixa de erro."));
    return engOut(T("Approved limit check", "Checagem do limite aprovado"), out, 2, "pilot", [T(`And with a limit of ${nf(Math.round(limitBRL / fx() * 1.2 / 10) * 10)} million?`, `E com um limite de ${nf(Math.round(limitBRL / fx() * 1.2 / 10) * 10)} milhões?`), T("What is the balance forecast in the upside case?", "Qual a projeção de saldo no cenário otimista?"), T("What if the tenor is 90 days?", "E se o prazo for 90 dias?")]);
  }
  function engBacktestAvg() {
    const bt = backtest(week), n = bt.length, avg = k => n ? bt.reduce((s, r) => s + r[k], 0) / n : 0;
    return { n, model: avg("model"), flat: avg("flat") };
  }
  function engAnsAccuracy() {
    const e = D.err[week - 1], ok = e <= 8, b = engBacktestAvg();
    let out = T(`Forecast error in ${engWk(week)}: <b>${nf(e, 1)}%</b>, ${ok ? "inside" : "above"} the 8% tolerance${ok ? ` (${nf(8 - e, 1)} pp of room)` : ` by ${nf(e - 8, 1)} pp, so the action plan asks to recalibrate the forecast`}. `,
      `Erro de projeção na ${engWk(week)}: <b>${nf(e, 1)}%</b>, ${ok ? "dentro" : "acima"} da tolerância de 8%${ok ? ` (${nf(8 - e, 1)} pp de folga)` : ` em ${nf(e - 8, 1)} pp, por isso o plano de ação pede recalibrar a projeção`}. `);
    out += b.n
      ? T(`One-week backtest over ${b.n} completed forecast${b.n === 1 ? "" : "s"}: the base model misses by ${nf(b.model, 2)}% on average, against ${nf(b.flat, 2)}% for simply repeating the prior balance.`, `Backtest de uma semana em ${b.n} ${b.n === 1 ? "projeção apurada" : "projeções apuradas"}: o modelo base erra ${nf(b.model, 2)}% em média, contra ${nf(b.flat, 2)}% ao simplesmente repetir o saldo anterior.`)
      : week > 1 ? T("No forecast can be scored yet: the balances so far round to zero.", "Nenhuma projeção pode ser avaliada ainda: os saldos até aqui arredondam para zero.") : T("The first one-week forecast can be scored when week 2 closes.", "A primeira projeção de uma semana pode ser avaliada quando a semana 2 fechar.");
    out += engSmall(T("The forecast error is a weekly series of the data; the backtest is recomputed here from the balances up to the selected week.", "O erro de projeção é uma série semanal dos dados; o backtest é recalculado aqui com os saldos até a semana selecionada."));
    return engOut(T("Forecast error and backtest", "Erro de projeção e backtest"), out, 2, "pilot", [T("Does the balance fit the approved limit?", "O saldo cabe no limite aprovado?"), T(`What is the balance forecast for ${engWk(week + curHorizon)}?`, `Qual o saldo previsto para a ${engWk(week + curHorizon)}?`)]);
  }
  function engAnsMethod() {
    const i = week - 1;
    const out = T(`<b>Pilot balance.</b> In-scope annual spend (${bn(SPEND / 1000, 1)}) × spend under programme (${D.spend[i]}%) × utilization (${D.util[i]}%) × average days discounted (${nf(PILOT.tenor)}) ÷ 365 = <b>${money(D.bal[i])}</b> in ${engWk(week)}. Spread revenue = balance × ${nf(PILOT.spread, 2)}% = ${moneyD(rev[i], revDec())} a year.`,
      `<b>Saldo do piloto.</b> Compras anuais no escopo (${bn(SPEND / 1000, 1)}) × gasto sob o programa (${D.spend[i]}%) × utilização (${D.util[i]}%) × prazo médio antecipado (${nf(PILOT.tenor)} dias) ÷ 365 = <b>${money(D.bal[i])}</b> na ${engWk(week)}. Receita de spread = saldo × ${nf(PILOT.spread, 2)}% = ${moneyD(rev[i], revDec())} por ano.`)
      + "<br>" + T(`<b>Forecast.</b> Geometric mean of the last weekly changes (${engGrowthPct()} now), decaying 7% per week; downside and upside take off or add half of that growth (0.5× and 1.5× when it is positive); the range widens with the forecast error and the square root of the weeks ahead; no point goes above ${money(fcCeil())}, 100% of in-scope spend at 100% utilization.`, `<b>Projeção.</b> Média geométrica das últimas variações semanais (${engGrowthPct()} agora), com decaimento de 7% por semana; pessimista e otimista tiram ou somam metade desse crescimento (0,5× e 1,5× quando ele é positivo); a faixa abre com o erro de projeção e a raiz quadrada das semanas à frente; nenhum ponto passa de ${money(fcCeil())}, 100% das compras no escopo com 100% de utilização.`)
      + "<br>" + T(`<b>Pipeline.</b> Public revenue × addressable share × coverage × adoption × utilization = potential annual flow; implied balance = flow × ${nf(G.tenor)} days ÷ 365; revenue = balance × ${nf(G.spread, 2)}%.`, `<b>Pipeline.</b> Receita pública × parcela endereçável × cobertura × adesão × utilização = fluxo anual potencial; saldo implícito = fluxo × ${nf(G.tenor)} dias ÷ 365; receita = saldo × ${nf(G.spread, 2)}%.`)
      + engSmall(T("Every KPI card opens its own audit trail with the same arithmetic.", "Cada card de KPI abre a própria memória de cálculo com a mesma conta."));
    return engOut(T("How the numbers are computed", "Como os números são calculados"), out, null, ["pilot", "pipeline"], [T("What if the tenor is 90 days?", "E se o prazo for 90 dias?"), T("Are these real data?", "Esses dados são reais?")]);
  }

  // ---------- what-if (computed on local copies; state is never written) ----------
  const engBands = sp => { const nameOf = id => (ANCHORS.find(a => a.id === id) || {}).name || id, above = [], below = [];
    PRICE_TIERS.forEach(t => { if (sp > t.max) t.anchors.forEach(id => above.push(nameOf(id))); else if (sp < t.min) t.anchors.forEach(id => below.push(nameOf(id))); });
    return { above, below }; };
  // Verb phrase ("is above the market band for ..."), to follow the spread it talks about.
  function engBandText(sp) {
    const b = engBands(sp);
    return b.above.length ? T(`is above the market band for ${esc(b.above.join(", "))}`, `fica acima da faixa de mercado em ${esc(b.above.join(", "))}`)
      : b.below.length ? T(`is below the market band for ${esc(b.below.join(", "))} (margin left on the table)`, `fica abaixo da faixa de mercado em ${esc(b.below.join(", "))} (margem deixada na mesa)`)
      : T(`is inside the market band for all ${ANCHORS.length} anchors`, `fica dentro da faixa de mercado nas ${ANCHORS.length} âncoras`);
  }
  function engPilotShift(r, why, title, ceilScale) {
    const ob = D.bal[week - 1], nb = ob * r, f = engFc({ scale: r, ceilScale }), revAt = b => rev[week - 1] * (ob > 0 ? b / ob : 0);   // same rounded revenue as the KPI tile
    const out = why + " " + T(`the pilot balance in ${engWk(week)} would go from ${money(ob)} to <b>${money(nb)}</b> (${engSigned(nb - ob, money)}), and yearly spread revenue from ${moneyD(revAt(ob), revDec())} to <b>${moneyD(revAt(nb), revDec())}</b>. That is ${engPct(100 * nb / limitBRL)} of the ${money(limitBRL)} limit. `,
      `o saldo do piloto na ${engWk(week)} iria de ${money(ob)} para <b>${money(nb)}</b> (${engSigned(nb - ob, money)}), e a receita anual de spread de ${moneyD(revAt(ob), revDec())} para <b>${moneyD(revAt(nb), revDec())}</b>. Isso equivale a ${engPct(100 * nb / limitBRL)} do limite de ${money(limitBRL)}. `)
      + T(`Keeping today's growth path (${scName(curScenario)} case, ${f.h} weeks): `, `Mantendo a trajetória de crescimento de hoje (cenário ${scName(curScenario).toLowerCase()}, ${f.h} semanas): `) + engLimitLine(f)
      + engSmall(T("Simulation only: nothing on the panel was changed. Method: the balance is proportional to in-scope spend, spend under programme, utilization and days discounted, so the whole path is scaled by the same ratio.", "Apenas simulação: nada foi alterado no painel. Método: o saldo é proporcional a compras no escopo, gasto sob o programa, utilização e prazo antecipado, então toda a trajetória é escalada pela mesma razão."));
    return engOut(title, out, 2, "pilot", [T("Does the balance fit the approved limit?", "O saldo cabe no limite aprovado?"), T("How is the balance calculated?", "Como o saldo é calculado?")]);
  }
  function engPipeShift(k, q, n) {
    const lbl = { adh: ["supplier adoption", "a adesão dos fornecedores"], cov: ["programme coverage", "a cobertura do programa"], util: ["discount utilization", "a utilização da antecipação"], addr: ["the addressable share", "a parcela endereçável"] }[k];
    const tg = engTarget(P[0][k], q, n.v), cl = v => clampNum(v, 0, 100);
    const flows = ANCHORS.map((_, i) => flowOf(i, { [k]: cl(tg.abs ? tg.to : P[i][k] + tg.delta) }));
    const t = totals(), flow = flows.reduce((s, x) => s + x, 0), bal = balOf(flow), rv = revOf(bal);
    const order = flows.map((x, i) => [x, i]).sort((a, b) => b[0] - a[0]), top = ANCHORS[order[0][1]];
    const move = tg.abs ? T(`were ${nf(cl(tg.to), 1)}% for every anchor`, `fosse ${nf(cl(tg.to), 1)}% em todas as âncoras`) : T(`moved ${engSigned(tg.delta, v => nf(v, 1))} points for every anchor`, `variasse ${engSigned(tg.delta, v => nf(v, 1))} pontos em todas as âncoras`);
    const out = T(`If ${lbl[0]} ${move}, the pipeline's potential annual flow would go from ${bn(t.flow)} to <b>${bn(flow)}</b> (${engSigned(flow - t.flow, v => bn(v))}), the implied balance from ${money(t.bal)} to <b>${money(bal)}</b> and yearly spread revenue from ${moneyD(t.rev)} to <b>${moneyD(rv)}</b>. ${esc(top.name)} would rank #1 with ${bn(order[0][0])}.`,
      `Se ${lbl[1]} ${move}, o fluxo anual potencial do pipeline iria de ${bn(t.flow)} para <b>${bn(flow)}</b> (${engSigned(flow - t.flow, v => bn(v))}), o saldo implícito de ${money(t.bal)} para <b>${money(bal)}</b> e a receita anual de spread de ${moneyD(t.rev)} para <b>${moneyD(rv)}</b>. ${esc(top.name)} ficaria em 1º lugar com ${bn(order[0][0])}.`)
      + engSmall(T("Simulation only: the pipeline table was not changed. Each anchor keeps its other hypotheses; percentages are capped at 0 to 100.", "Apenas simulação: a tabela do pipeline não foi alterada. Cada âncora mantém as demais hipóteses; os percentuais ficam limitados entre 0 e 100."));
    return engOut(T("What if · pipeline hypothesis", "E se · hipótese do pipeline"), out, 3, "pipeline", [T("Which anchor should we prioritise?", "Qual âncora priorizar?"), T("What if coverage rises 10 points?", "E se a cobertura subir 10 pontos?")]);
  }
  function engAnsWhatIf(q) {
    const n = engNumIn(q); if (!n) return null;
    const trig = /\be se\b|what if|\bse\b|\bif\b|\bcaso\b|supo|suppose|imagin|simul|fosse|\bfor\b|were|subir|subisse|cair|caisse|rises?|falls?|drops?|aument|reduz|increase|decrease|goes? to|went to|passar para|chegar a|reach/.test(q);
    const pipeCtx = /pipeline|ancora|anchor/.test(q), i = week - 1;
    const isLimit = /limite|\blimit/.test(q);
    if (trig && /utiliza/.test(q) && pipeCtx) return engPipeShift("util", q, n);
    if (trig && /utiliza/.test(q)) {
      const tg = engTarget(D.util[i], q, n.v), to = clampNum(tg.to, 0, 100); if (!(D.util[i] > 0)) return null;
      return engPilotShift(to / D.util[i], T(`If utilization went from ${engPct(D.util[i])} to ${engPct(to, 1)},`, `Se a utilização fosse de ${engPct(D.util[i])} para ${engPct(to, 1)},`), T("What if · utilization", "E se · utilização"));
    }
    if (trig && /gasto|spend under|\bspend\b/.test(q) && !/annual|anuais|escopo|scope/.test(q)) {
      const tg = engTarget(D.spend[i], q, n.v), to = clampNum(tg.to, 0, 100); if (!(D.spend[i] > 0)) return null;
      return engPilotShift(to / D.spend[i], T(`If spend under programme went from ${engPct(D.spend[i])} to ${engPct(to, 1)},`, `Se o gasto sob o programa fosse de ${engPct(D.spend[i])} para ${engPct(to, 1)},`), T("What if · spend under programme", "E se · gasto sob o programa"));
    }
    if (trig && /adesao|adoption/.test(q)) return engPipeShift("adh", q, n);
    if (trig && /cobertura|coverage/.test(q)) return engPipeShift("cov", q, n);
    if (trig && /enderecavel|addressable/.test(q)) return engPipeShift("addr", q, n);
    if (trig && /prazo(?! ate)|tenor|days discounted|dias antecipad|\bdias\b|\bdays\b/.test(q) && !/primeiro desconto|first discount/.test(q)) {
      const tg = engTarget(PILOT.tenor, q, n.v), to = clampNum(tg.to, PARAM_RANGE.tenor[0], PARAM_RANGE.tenor[1]);
      const res = engPilotShift(to / PILOT.tenor, T(`If the pilot's average days discounted went from ${nf(PILOT.tenor)} to ${nf(to)} days,`, `Se o prazo médio antecipado do piloto fosse de ${nf(PILOT.tenor)} para ${nf(to)} dias,`), T("What if · tenor", "E se · prazo"), to / PILOT.tenor);
      const t = totals(), pb = balOf(t.flow, to);
      res.html = res.html.replace("<small>", " " + T(`In the Step 3 pipeline (its own assumption, ${nf(G.tenor)} days today), ${nf(to)} days would put the implied balance at ${money(pb)} instead of ${money(t.bal)}.`, `No pipeline da Etapa 3 (premissa própria, hoje ${nf(G.tenor)} dias), ${nf(to)} dias levariam o saldo implícito a ${money(pb)} em vez de ${money(t.bal)}.`) + "<small>");
      return res;
    }
    if (trig && /spread|taxa|\brate\b|preco|pricing|cdi/.test(q)) {
      // A relative move ("rises 0.2") shifts each book from its own spread; an absolute level ("is 1.5%") applies to both.
      const tg = engTarget(PILOT.spread, q, n.v), cl = v => clampNum(v, PARAM_RANGE.spread[0], PARAM_RANGE.spread[1]), ob = D.bal[i], t = totals();
      const to = cl(tg.abs ? tg.to : PILOT.spread + tg.delta), toG = cl(tg.abs ? tg.to : G.spread + tg.delta);
      const lead = tg.abs ? T(`With a spread of ${nf(to, 2)}% a year:`, `Com spread de ${nf(to, 2)}% ao ano:`)
        : T(`With the spread ${tg.delta > 0 ? "up" : "down"} ${nf(Math.abs(tg.delta), 2)} pp on each book:`, `Com o spread ${tg.delta > 0 ? "subindo" : "caindo"} ${nf(Math.abs(tg.delta), 2)} pp em cada carteira:`);
      const out = T(`${lead} the pilot's yearly spread revenue in ${engWk(week)} would go from ${moneyD(rev[i], revDec())} (at ${nf(PILOT.spread, 2)}%) to <b>${moneyD(ob * to / 100, revDec())}</b> (at ${nf(to, 2)}%) on the same ${money(ob)} balance; the pipeline's from ${moneyD(t.rev, revDec())} (at ${nf(G.spread, 2)}%) to <b>${moneyD(t.bal * toG / 100, revDec())}</b> (at ${nf(toG, 2)}%). Against the Step 4 price bands, CDI + ${nf(toG, 2)}% ${engBandText(toG)}.`,
        `${lead} a receita anual de spread do piloto na ${engWk(week)} iria de ${moneyD(rev[i], revDec())} (a ${nf(PILOT.spread, 2)}%) para <b>${moneyD(ob * to / 100, revDec())}</b> (a ${nf(to, 2)}%) sobre o mesmo saldo de ${money(ob)}; a do pipeline, de ${moneyD(t.rev, revDec())} (a ${nf(G.spread, 2)}%) para <b>${moneyD(t.bal * toG / 100, revDec())}</b> (a ${nf(toG, 2)}%). Frente às faixas de preço da Etapa 4, CDI + ${nf(toG, 2)}% ${engBandText(toG)}.`)
        + engSmall(T("Simulation only: nothing on the panel was changed. The balance is held constant; a different price would also change how much suppliers use the programme, which this arithmetic does not model.", "Apenas simulação: nada foi alterado no painel. O saldo é mantido constante; um preço diferente também mudaria o quanto os fornecedores usam o programa, o que esta conta não modela.")) + engFab();
      return engOut(T("What if · spread", "E se · spread"), out, 4, ["pilot", "market"], [T("Is our spread competitive against the market band?", "Nosso spread é competitivo frente à faixa de mercado?"), T("What is the pipeline total and ranking?", "Qual o total e o ranking do pipeline?")]);
    }
    if (trig && /cambio|dolar|dollar|\bfx\b|exchange|ptax/.test(q) && !isLimit) {
      const r = clampNum(n.v, FX_MIN, FX_MAX), ob = D.bal[i], rt = Number(r).toLocaleString(loc(), { minimumFractionDigits: 2, maximumFractionDigits: 4 }), us = v => T("US$", "US$ ") + nf(v, 1) + T("m", " mi");
      const out = T(`At R$${rt} per US$, the ${engWk(week)} balance of R$${nf(ob, 1)}m would read <b>${us(ob / r)}</b>, against ${us(ob / FX_RATE)} at the rate entered in the panel (${fxLabel(true)}). Values are stored in reais, so only the dollar view moves.`,
        `Com R$ ${rt} por US$, o saldo da ${engWk(week)}, de R$ ${nf(ob, 1)} mi, apareceria como <b>${us(ob / r)}</b>, contra ${us(ob / FX_RATE)} na taxa informada no painel (${fxLabel(true)}). Os valores ficam guardados em reais, então só a visão em dólar se move.`)
        + engSmall(T("Simulation only: the rate in the panel was not changed. The panel does not fetch or check the rate against any source.", "Apenas simulação: a taxa do painel não foi alterada. O painel não busca nem confere a taxa em nenhuma fonte."));
      return engOut(T("What if · exchange rate", "E se · câmbio"), out, null, "pilot", [T("Are these real data?", "Esses dados são reais?"), T("Does the balance fit the approved limit?", "O saldo cabe no limite aprovado?")]);
    }
    if (isLimit) {
      const lim = n.v * n.scale * fx(); if (!(lim > 0)) return null;
      const sc = engScenIn(q), f = engFc({ lim, sc }), far = engFc({ lim, sc, h: 26 }), now = D.bal[i];
      let out = T(`With an approved limit of ${money(lim)} instead of ${money(limitBRL)} (${scName(sc)} case, ${f.h}-week horizon): `, `Com um limite aprovado de ${money(lim)} em vez de ${money(limitBRL)} (cenário ${scName(sc).toLowerCase()}, horizonte de ${f.h} semanas): `) + engLimitLine(f)
        + " " + T(`The balance in ${engWk(week)} (${money(now)}) would use ${engPct(100 * now / lim)} of it.`, `O saldo na ${engWk(week)} (${money(now)}) usaria ${engPct(100 * now / lim)} dele.`);
      if (far.h > f.h && engFcTone(f) !== "bad") out += " " + T("Looking 26 weeks ahead: ", "Olhando 26 semanas à frente: ") + engLimitLine(far);
      out += engSmall(T(`Simulation only: the limit field in Step 2 was not changed. The amount was read in the display currency (${ccyCode()} million).`, `Apenas simulação: o campo de limite da Etapa 2 não foi alterado. O valor foi lido na moeda de exibição (${ccyCode()} milhões).`));
      return engOut(T("What if · approved limit", "E se · limite aprovado"), out, 2, "pilot", [T("Does the balance fit the approved limit?", "O saldo cabe no limite aprovado?"), T("What is the balance forecast in the upside case?", "Qual a projeção de saldo no cenário otimista?")]);
    }
    return null;
  }

  // ---------- funnel, propensity, actions ----------
  function engAnsFunnel() {
    const v = F[mode], w = worstStep(v), g = LEV[w - 1], cv = Math.round(100 * v[w] / v[w - 1]), first = firstLever(w);
    let out = T(`In the funnel on screen (${mode === "after" ? "with document AI" : "before document AI"}), the weakest step is <b>${esc(L(STEPS[w - 1]))} → ${esc(L(STEPS[w]))}</b>: ${cv}% conversion, ${nf(v[w - 1] - v[w])} suppliers lost. Likely cause: ${esc(L(g.cause))} Levers: ${g.lv.map((x, k) => `(${k + 1}) ${esc(L(x))}`).join("; ")}. Of ${nf(v[0])} invited, ${nf(v[5])} reach the first discount (${engPct(100 * v[5] / v[0])}).`,
      `No funil da tela (${mode === "after" ? "com IA de documentos" : "antes da IA de documentos"}), a etapa mais fraca é <b>${esc(L(STEPS[w - 1]))} → ${esc(L(STEPS[w]))}</b>: ${cv}% de conversão, ${nf(v[w - 1] - v[w])} fornecedores perdidos. Causa provável: ${esc(L(g.cause))} Alavancas: ${g.lv.map((x, k) => `(${k + 1}) ${esc(L(x))}`).join("; ")}. De ${nf(v[0])} convidados, ${nf(v[5])} chegam ao primeiro desconto (${engPct(100 * v[5] / v[0])}).`);
    if (first) out += " " + T(`First lever still to test: (${g.lv.findIndex(x => L(x) === first) + 1}).`, `Primeira alavanca ainda a testar: (${g.lv.findIndex(x => L(x) === first) + 1}).`);
    out += " " + T(`Document AI moves the documents step: first discounts go from ${F.before[5]} to ${F.after[5]} in the example wave${!SRCINFO ? ", live since W5 in the pilot example" : ""}.`, `A IA de documentos mexe na etapa de documentos: os primeiros descontos vão de ${F.before[5]} para ${F.after[5]} na onda de exemplo${!SRCINFO ? ", em produção desde a S5 no exemplo do piloto" : ""}.`);
    out += engSmall(T("Causes and levers are working hypotheses to validate with the anchor; document AI is the only lever whose effect the example data illustrates, and nothing here is a measured result. The funnel is a fixed example wave and does not follow the weekly data.", "Causas e alavancas são hipóteses de trabalho a validar com a âncora; a IA de documentos é a única alavanca com efeito ilustrado nos dados de exemplo, e nada aqui é um resultado medido. O funil é uma onda de exemplo fixa e não acompanha os dados semanais."));
    return engOut(T("Funnel bottleneck and levers", "Gargalo do funil e alavancas"), out, 1, "funnel", [T("How are the days to first discount evolving?", "Como estão os dias até o primeiro desconto?"), T("Who should the campaign target next?", "Quem a campanha deve abordar em seguida?"), T("What should I do this week?", "O que devo fazer nesta semana?")]);
  }
  function engAnsPropensity() {
    const top3 = DEC[0] + DEC[1] + DEC[2], all = DEC.reduce((s, x) => s + x, 0), act = ACTS.find(a => a.id === "scale" || a.id === "gate");
    let out = T(`Activation by propensity score decile (D1 = most likely to discount): D1 ${DEC[0]}%, D2 ${DEC[1]}%, D3 ${DEC[2]}%, down to ${DEC[DEC.length - 1]}% in D10. The top three deciles hold ${engPct(100 * top3 / all)} of the activations, so the campaign goes to them first.`,
      `Ativação por decil do score de propensão (D1 = maior chance de antecipar): D1 ${DEC[0]}%, D2 ${DEC[1]}%, D3 ${DEC[2]}%, até ${DEC[DEC.length - 1]}% no D10. Os três primeiros decis concentram ${engPct(100 * top3 / all)} das ativações, por isso a campanha começa por eles.`);
    if (act) out += " " + T("In this week's plan: ", "No plano desta semana: ") + `<b>${act.title}</b>. ${act.why}`;
    out += engSmall(T("Deciles are fixed example data of the pilot.", "Os decis são dados de exemplo fixos do piloto."));
    return engOut(T("Propensity and campaign", "Propensão e campanha"), out, 1, null, [T("How many risk flags are open?", "Quantos alertas de risco estão abertos?"), T("Where is the funnel bottleneck?", "Onde está o gargalo do funil?")]);
  }
  function engAnsActions() {
    const a = ACTS.filter(x => x.pri < 3).slice(0, 4), rest = ACTS.length - a.length, mkt = a.some(x => /^(grow|price|sig-)/.test(x.id));
    const out = (a.length ? T(`Priority actions for ${engWk(week)}: `, `Ações prioritárias da ${engWk(week)}: `) + "<br>" + a.map((x, k) => `${k + 1}. <b>${x.title}</b> (${x.own.map(o => esc(L(OWN[o]))).join(" + ")}, ${esc(L(x.due))}). ${x.why}`).join("<br>")
      : T(`No priority action in ${engWk(week)}.`, `Nenhuma ação prioritária na ${engWk(week)}.`))
      + (rest > 0 ? "<br>" + T(`The plan lists ${ACTS.length} items in total.`, `O plano lista ${ACTS.length} itens no total.`) : "")
      + engSmall(T("The plan is generated by rules: approved limit, 8% error tolerance, gate of 3 risk flags, weakest funnel step, 10 days to first discount, pipeline ranking, price bands and external signals.", "O plano é gerado por regras: limite aprovado, tolerância de erro de 8%, trava de 3 alertas de risco, pior etapa do funil, 10 dias até o primeiro desconto, ranking do pipeline, faixas de preço e sinais externos."))
      + (mkt ? engFab() : "");
    return engOut(T("This week's action plan", "Plano de ação da semana"), out, 1, mkt ? ["pilot", "pipeline"] : "pilot", [T("Does the balance fit the approved limit?", "O saldo cabe no limite aprovado?"), T("Where is the funnel bottleneck?", "Onde está o gargalo do funil?"), T("Which anchor should we prioritise?", "Qual âncora priorizar?")]);
  }

  // ---------- pipeline, anchors, market ----------
  const engOrder = t => t.flows.map((f, i) => [f, i]).sort((a, b) => b[0] - a[0]);
  function engAnsPipeline() {
    const t = totals(), ord = engOrder(t), top = ANCHORS[ord[0][1]];
    const out = T(`Ranked by potential annual discounting flow: ${ord.map(([f, i], k) => `${k + 1}. ${esc(ANCHORS[i].name)} (${bn(f)})`).join(", ")}. Together: <b>${bn(t.flow)}</b> of flow, ${money(t.bal)} of implied balance and ${moneyD(t.rev)} of yearly spread revenue, on ${bn(t.elig, 1)} of eligible purchases. ${esc(top.name)} is ${engPct(100 * ord[0][0] / (t.flow || 1))} of the total and is the first to take to credit committee.`,
      `Ordem por fluxo anual potencial de antecipação: ${ord.map(([f, i], k) => `${k + 1}. ${esc(ANCHORS[i].name)} (${bn(f)})`).join(", ")}. Juntas: <b>${bn(t.flow)}</b> de fluxo, ${money(t.bal)} de saldo implícito e ${moneyD(t.rev)} de receita anual de spread, sobre ${bn(t.elig, 1)} de compras elegíveis. ${esc(top.name)} responde por ${engPct(100 * ord[0][0] / (t.flow || 1))} do total e é a primeira a levar ao comitê de crédito.`)
      + engSmall(T(`Method: public revenue × addressable share × coverage × adoption × utilization, with the hypotheses of the pipeline table; balance at ${nf(G.tenor)} days and revenue at ${nf(G.spread, 2)}% spread. Being named as a client confirms a relationship, not an active programme.`, `Método: receita pública × parcela endereçável × cobertura × adesão × utilização, com as hipóteses da tabela do pipeline; saldo a ${nf(G.tenor)} dias e receita com spread de ${nf(G.spread, 2)}%. Ser citada como cliente confirma relacionamento, não programa ativo.`));
    return engOut(T("Anchor pipeline", "Pipeline de âncoras"), out, 3, "pipeline", [T(`Tell me about ${top.name}`, `Fale sobre a ${top.name}`), T("What if adoption rises 5 points?", "E se a adesão subir 5 pontos?"), T("Where is the largest white space?", "Onde está o maior espaço livre?")]);
  }
  function engAnsAnchor(i) {
    const a = ANCHORS[i], t = totals(), fl = t.flows[i], b = balOf(fl), rank = engOrder(t).findIndex(x => x[1] === i) + 1;
    const row = COMP_DATA.find(r => r.id === a.id) || {}, sr = shareRows().find(r => r.id === a.id), h = EXT_HEALTH.find(x => x.id === a.id), sg = sigOf(a.id);
    const fund = FUNDERS.filter(f => f.type !== "citi").map(f => [row[f.k] || 0, f]).sort((x, y) => y[0] - x[0])[0];
    let out = T(`<b>${esc(a.name)}</b>, ${esc(L(a.sector).toLowerCase())}, #${rank} in the pipeline: revenue base of ${bn(a.rev, 1)}, eligible purchases of ${bn(eligOf(i), 1)} (${nf(P[i].addr, 1)}% addressable), potential discounting flow of <b>${bn(fl)}</b> a year, which implies a balance of ${money(b)} and ${moneyD(revOf(b))} of yearly spread revenue.`,
      `<b>${esc(a.name)}</b>, ${esc(L(a.sector).toLowerCase())}, nº ${rank} do pipeline: base de receita de ${bn(a.rev, 1)}, compras elegíveis de ${bn(eligOf(i), 1)} (${nf(P[i].addr, 1)}% endereçável), fluxo potencial de antecipação de <b>${bn(fl)}</b> por ano, o que implica saldo de ${money(b)} e ${moneyD(revOf(b))} de receita anual de spread.`);
    out += " " + T(`Decisive check: ${esc(L(a.check))}`, `Validação decisiva: ${esc(L(a.check))}`);
    let mk = "";
    if (fund && fund[0] > 0) mk += T(`largest funder ${esc(fName(fund[1]))} (${mxFmt(fund[0])} of ${isFlowSet() ? "annual flow" : "balance"}); `, `maior financiador ${esc(fName(fund[1]))} (${mxFmt(fund[0])} de ${isFlowSet() ? "fluxo anual" : "saldo"}); `);
    if (sr) mk += T(`Citi covers ${engPct(sr.pc)} of eligible purchases and ${engPct(sr.pw)} is unfinanced (${bn(sr.free, 1)}); `, `o Citi cobre ${engPct(sr.pc)} das compras elegíveis e ${engPct(sr.pw)} não é financiado (${bn(sr.free, 1)}); `);
    if (h) { const o = L(h.outlook).toLowerCase(), has = /outlook|perspectiva/.test(o); mk += T(`rating ${esc(String(h.rating))}, ${has ? esc(o) : "outlook " + esc(o)}; `, `rating ${esc(String(h.rating))}, ${has ? esc(o) : "perspectiva " + esc(o)}; `); }
    mk += T(`external signal ${esc(L(DS_SEV[sg.sev] || DS_SEV.green).toLowerCase())}${sg.note ? " (" + esc(engQuote(L(sg.note))) + ")" : ""}.`, `sinal externo ${esc(L(DS_SEV[sg.sev] || DS_SEV.green).toLowerCase())}${sg.note ? " (" + esc(engQuote(L(sg.note))) + ")" : ""}.`);
    out += "<br>" + T("<b>Market view (fabricated figures):</b> ", "<b>Visão de mercado (números fabricados):</b> ") + mk + engFab();
    return engOut(esc(a.name), out, 3, ["pipeline", "market"], [T("Which anchor should we prioritise?", "Qual âncora priorizar?"), T("Is our spread competitive against the market band?", "Nosso spread é competitivo frente à faixa de mercado?"), T("What do the external signals say?", "O que dizem os sinais externos?")]);
  }
  const ENG_MKT_CHIPS = () => [T("Is our spread competitive against the market band?", "Nosso spread é competitivo frente à faixa de mercado?"), T("Where is the largest white space?", "Onde está o maior espaço livre?"), T("What do the external signals say?", "O que dizem os sinais externos?"), T("Who leads among competitors?", "Quem lidera entre os concorrentes?")];
  function engAnsCompetitors() {
    const unit = isFlowSet() ? T("annual flow", "fluxo anual") : T("balance", "saldo");
    const tot = FUNDERS.map(f => [COMP_DATA.reduce((s, r) => s + (r[f.k] || 0), 0), f]).sort((a, b) => b[0] - a[0]);
    const all = tot.reduce((s, x) => s + x[0], 0) || 1, citi = tot.find(x => x[1].type === "citi"), lead = tot[0];
    let out = T(`Across the ${ANCHORS.length} pipeline anchors, by funded ${unit}: ${tot.filter(x => x[0] > 0).map(([v, f], k) => `${k + 1}. ${esc(fName(f))} (${mxFmt(v)}, ${engPct(100 * v / all)})`).join(", ")}. <b>${esc(fName(lead[1]))}</b> leads.`,
      `Nas ${ANCHORS.length} âncoras do pipeline, por ${unit} financiado: ${tot.filter(x => x[0] > 0).map(([v, f], k) => `${k + 1}. ${esc(fName(f))} (${mxFmt(v)}, ${engPct(100 * v / all)})`).join(", ")}. <b>${esc(fName(lead[1]))}</b> lidera.`);
    if (citi) out += " " + (citi[0] > 0
      ? T(`Citi appears with ${mxFmt(citi[0])} (${engPct(100 * citi[0] / all)}), an invented position for the prototype.`, `O Citi aparece com ${mxFmt(citi[0])} (${engPct(100 * citi[0] / all)}), uma posição inventada para o protótipo.`)
      : T("Citi is at zero in this dataset: relationship with the anchors, no programme assumed.", "O Citi está em zero neste conjunto: relacionamento com as âncoras, sem programa assumido."));
    return engOut(T("Competitors by anchor", "Concorrentes por âncora"), out + engFab(), 4, "market", ENG_MKT_CHIPS().filter(c => !/lead|lidera/.test(c)));
  }
  function engAnsPricing() {
    const tiers = PRICE_TIERS.map(t => `${esc(rtLbl(t.code))}: CDI + ${nf(t.min, 2)}% ${T("to", "a")} ${nf(t.max, 2)}%${t.med != null ? T(`, median ${nf(t.med, 2)}%`, `, mediana ${nf(t.med, 2)}%`) : ""}`).join("; ");
    const out = T(`The proposal tested in Step 4, CDI + ${nf(mktSpread, 2)}%, ${engBandText(mktSpread)}. Bands by rating: ${tiers}. The pipeline assumes a ${nf(G.spread, 2)}% spread and the pilot ${nf(PILOT.spread, 2)}%.`,
      `A proposta testada na Etapa 4, CDI + ${nf(mktSpread, 2)}%, ${engBandText(mktSpread)}. Faixas por rating: ${tiers}. O pipeline assume spread de ${nf(G.spread, 2)}% e o piloto, ${nf(PILOT.spread, 2)}%.`)
      + (RM_LOSS.length ? " " + T(`Lost-deal sample (illustrative): ${RM_LOSS.map(r => `${esc(L(r.lbl))} ${r.pct}%`).join("; ")}.`, `Amostra de negócios perdidos (ilustrativa): ${RM_LOSS.map(r => `${esc(L(r.lbl))} ${r.pct}%`).join("; ")}.`) : "");
    return engOut(T("Pricing against the market band", "Preço frente à faixa de mercado"), out + engFab(), 4, "market", [T("What if the spread is 1.5%?", "E se o spread for 1,5%?"), T("Who leads among competitors?", "Quem lidera entre os concorrentes?"), T("Where is the largest white space?", "Onde está o maior espaço livre?")]);
  }
  function engShareTotals() {
    const rows = shareRows(), s = k => rows.reduce((x, r) => x + r[k], 0), elig = s("elig") || 1;
    const best = rows.slice().sort((a, b) => b.free - a.free)[0];
    return { rows, elig, pc: 100 * s("citi") / elig, pp: 100 * s("peers") / elig, pf: 100 * s("fidc") / elig, pw: 100 * s("free") / elig, free: s("free"), best };
  }
  function engAnsShare() {
    const t = engShareTotals();
    const out = T(`Across the ${t.rows.length} anchors (${bn(t.elig, 1)} of eligible purchases from Step 3): Citi ${engPct(t.pc)}, peer banks ${engPct(t.pp)}, FIDCs ${engPct(t.pf)}, unfinanced ${engPct(t.pw)} (${bn(t.free, 1)}). Largest white space: <b>${esc(t.best.name)}</b>, ${bn(t.best.free, 1)} (${engPct(t.best.pw)} of its eligible purchases). By anchor: ${t.rows.map(r => `${esc(r.name)} ${bn(r.free, 1)}`).join(", ")}.`,
      `Nas ${t.rows.length} âncoras (${bn(t.elig, 1)} de compras elegíveis da Etapa 3): Citi ${engPct(t.pc)}, bancos pares ${engPct(t.pp)}, FIDCs ${engPct(t.pf)}, não financiado ${engPct(t.pw)} (${bn(t.free, 1)}). Maior espaço livre: <b>${esc(t.best.name)}</b>, ${bn(t.best.free, 1)} (${engPct(t.best.pw)} das compras elegíveis dela). Por âncora: ${t.rows.map(r => `${esc(r.name)} ${bn(r.free, 1)}`).join(", ")}.`);
    return engOut(T("Share of eligible purchases and white space", "Share das compras elegíveis e espaço livre"), out + engFab(), 4, ["pipeline", "market"], [T(`Tell me about ${t.best.name}`, `Fale sobre a ${t.best.name}`), T("Who leads among competitors?", "Quem lidera entre os concorrentes?"), T("Is our spread competitive against the market band?", "Nosso spread é competitivo frente à faixa de mercado?")]);
  }
  const engSigGroups = () => { const g = { red: [], amber: [], green: [] }; ANCHORS.forEach(a => { const s = sigOf(a.id).sev; (g[s] || g.green).push(a.name); }); return g; };
  function engAnsSignals() {
    const g = engSigGroups();
    const line = ANCHORS.map(a => { const s = sigOf(a.id), h = EXT_HEALTH.find(x => x.id === a.id);
      return `${esc(a.name)}: ${esc(L(DS_SEV[s.sev] || DS_SEV.green).toLowerCase())}${h ? T(`, rating ${esc(String(h.rating))}, electronic duplicata ${h.dupPct}%`, `, rating ${esc(String(h.rating))}, duplicata escritural ${h.dupPct}%`) : ""}${s.note ? " (" + esc(engQuote(L(s.note))) + ")" : ""}`; }).join("; ");
    const out = T(`External signals by anchor: ${line}. ${g.red.length ? `Red for ${esc(g.red.join(", "))}: the action plan holds the credit request.` : "No red signal, so no credit request is held by this rule."}`,
      `Sinais externos por âncora: ${line}. ${g.red.length ? `Vermelho em ${esc(g.red.join(", "))}: o plano de ação segura o pedido de crédito.` : "Nenhum sinal vermelho, então nenhum pedido de crédito é segurado por essa regra."}`);
    return engOut(T("External signals", "Sinais externos"), out + engFab(), 4, "market", [T("Which anchor should we prioritise?", "Qual âncora priorizar?"), T("Is our spread competitive against the market band?", "Nosso spread é competitivo frente à faixa de mercado?")]);
  }
  function engAnsConcentration() {
    const t = totals(), ord = engOrder(t), top = ANCHORS[ord[0][1]], al = ALERTS.find(a => /concentra/i.test(a[2][1]) && a[0] <= week);
    let out = T(`<b>Pipeline.</b> ${esc(top.name)} alone is ${engPct(100 * ord[0][0] / (t.flow || 1))} of the potential annual flow (${bn(ord[0][0])} of ${bn(t.flow)})${ord[1] ? `; the top two anchors are ${engPct(100 * (ord[0][0] + ord[1][0]) / (t.flow || 1))}` : ""}.`,
      `<b>Pipeline.</b> A ${esc(top.name)} sozinha responde por ${engPct(100 * ord[0][0] / (t.flow || 1))} do fluxo anual potencial (${bn(ord[0][0])} de ${bn(t.flow)})${ord[1] ? `; as duas maiores âncoras somam ${engPct(100 * (ord[0][0] + ord[1][0]) / (t.flow || 1))}` : ""}.`);
    if (al) out += "<br>" + T("<b>Pilot (example alert, Step 1).</b> ", "<b>Piloto (alerta de exemplo, Etapa 1).</b> ") + `${engWk(al[0])} · ${L(al[2])}.`;
    out += engSmall(T("The panel sets no concentration ceiling; these are the shares as computed.", "O painel não define um teto de concentração; estes são os percentuais como calculados."));
    return engOut(T("Concentration", "Concentração"), out, 3, ["pipeline", "pilot"], [T("Which anchor should we prioritise?", "Qual âncora priorizar?"), T("How many risk flags are open?", "Quantos alertas de risco estão abertos?")]);
  }

  // ---------- data sources, products, summary, fallback ----------
  function engAnsData() {
    const out = T("No. Nothing on this panel is real bank data. ", "Não. Nada neste painel é dado real do banco. ")
      + (SRCINFO
        ? T(`<b>Weekly programme data (Steps 1 and 2):</b> loaded in this browser by the user (${esc(SRCINFO.name)}, ${W} weeks); the panel cannot verify it. `, `<b>Dados semanais do programa (Etapas 1 e 2):</b> carregados neste navegador pelo usuário (${esc(SRCINFO.name)}, ${W} semanas); o painel não tem como verificá-los. `)
        : T(`<b>Weekly programme data (Steps 1 and 2):</b> example data of a pilot programme (${W} weeks). `, `<b>Dados semanais do programa (Etapas 1 e 2):</b> dados de exemplo de um programa piloto (${W} semanas). `))
      + T("The funnel, deciles and alerts are fixed example data. ", "O funil, os decis e os alertas são dados de exemplo fixos. ")
      + T(`<b>Pipeline (Step 3):</b> public company revenues of the "${esc(engDsName())}" dataset, quoted from the linked sources and not checked live, times editable hypotheses. `, `<b>Pipeline (Etapa 3):</b> receitas públicas das empresas no conjunto "${esc(engDsName())}", citadas das fontes indicadas e sem checagem ao vivo, vezes hipóteses editáveis. `)
      + T("<b>Market (Step 4):</b> every amount, share, price band, rating and signal is fabricated for the prototype, in both datasets. ", "<b>Mercado (Etapa 4):</b> todo valor, share, faixa de preço, rating e sinal é fabricado para o protótipo, nos dois conjuntos. ")
      + T(`<b>Exchange rate:</b> ${fxLabel(true)}, a number typed in the panel, not fetched from any source.`, `<b>Câmbio:</b> ${fxLabel(true)}, um número digitado no painel, não buscado em nenhuma fonte.`)
      + engSmall(T("These answers are computed in the browser by fixed rules over the numbers on screen. Nothing is sent anywhere.", "Estas respostas são calculadas no navegador por regras fixas sobre os números da tela. Nada é enviado para lugar nenhum."));
    return engOut(T("What is example, public or fabricated", "O que é exemplo, público ou fabricado"), out, null, null, [T("How is the balance calculated?", "Como o saldo é calculado?"), T("Summarise this week", "Resuma esta semana")]);
  }
  function engAnsProducts(q) {
    return engOut(T("Citi product reference", "Referência de produtos do Citi"), productAnswer(q), 4, "product", [T("Difference between risco sacado and discount of trade bills?", "Diferença entre risco sacado e desconto de duplicatas?"), T("What is Risco Sacado ESG?", "O que é o Risco Sacado ESG?"), T("What is a bank guarantee (fiança)?", "O que é a fiança?")]);
  }
  function engAnsSummary() {
    const i = week - 1, f = engFc(), v = F[mode], w = worstStep(v), t = totals(), top = ANCHORS[engOrder(t)[0][1]], ta = engTrend("active", 4), e = D.err[i];
    const out = T(`<b>${engWk(week)} reading.</b> Balance ${money(D.bal[i])}, ${nf(D.active[i])} active suppliers of ${nf(BASE_SUP)}, utilization ${D.util[i]}%, forecast error ${nf(e, 1)}% (${e <= 8 ? "inside" : "above"} the 8% tolerance), ${D.flags[i]} open risk flag${D.flags[i] === 1 ? "" : "s"} (gate at 3).`,
      `<b>Leitura da ${engWk(week)}.</b> Saldo de ${money(D.bal[i])}, ${nf(D.active[i])} fornecedores ativos de ${nf(BASE_SUP)}, utilização de ${D.util[i]}%, erro de projeção de ${nf(e, 1)}% (${e <= 8 ? "dentro" : "acima"} da tolerância de 8%), ${D.flags[i]} ${D.flags[i] === 1 ? "alerta de risco aberto" : "alertas de risco abertos"} (trava em 3).`)
      + "<br>" + T(`<b>Forecast.</b> ${scName(f.sc)} case: ${money(f.end)} in ${engWk(week + f.h)} (${money(f.low)} to ${money(f.high)}). `, `<b>Projeção.</b> Cenário ${scName(f.sc).toLowerCase()}: ${money(f.end)} na ${engWk(week + f.h)} (${money(f.low)} a ${money(f.high)}). `) + engLimitLine(f)
      + (ta.n ? T(` Active suppliers at the recent pace: about ${nf(ta.proj)} in ${engWk(week + 4)}.`, ` Fornecedores ativos no ritmo recente: cerca de ${nf(ta.proj)} na ${engWk(week + 4)}.`) : "")
      + "<br>" + T(`<b>Where to act.</b> Weakest funnel step (example funnel): ${esc(L(STEPS[w - 1]))} → ${esc(L(STEPS[w]))}. First action of the plan: ${ACTS[0] ? ACTS[0].title : "–"}.`, `<b>Onde agir.</b> Etapa mais fraca do funil (funil de exemplo): ${esc(L(STEPS[w - 1]))} → ${esc(L(STEPS[w]))}. Primeira ação do plano: ${ACTS[0] ? ACTS[0].title : "–"}.`)
      + "<br>" + T(`<b>Pipeline.</b> ${bn(t.flow)} of potential annual flow, led by ${esc(top.name)}.`, `<b>Pipeline.</b> ${bn(t.flow)} de fluxo anual potencial, liderado pela ${esc(top.name)}.`);
    return engOut(T(`Summary · ${engWk(week)}`, `Resumo · ${engWk(week)}`), out, 1, ["pilot", "pipeline"], [T("What should I do this week?", "O que devo fazer nesta semana?"), T("Does the balance fit the approved limit?", "O saldo cabe no limite aprovado?"), T("Which anchor should we prioritise?", "Qual âncora priorizar?")]);
  }
  function engFallback(raw, failed) {
    const asked = String(raw == null ? "" : raw).trim().slice(0, 140);
    const topics = [
      T("the week in one reading and the action plan", "a leitura da semana e o plano de ação"),
      T("each KPI and its recent trend (active suppliers, utilization, spend, days to first discount, revenue, share of wallet, risk flags)", "cada KPI e a tendência recente (fornecedores ativos, utilização, gasto, dias até o primeiro desconto, receita, share of wallet, alertas de risco)"),
      T("the balance forecast, the approved limit, the forecast error and the backtest", "a projeção de saldo, o limite aprovado, o erro de projeção e o backtest"),
      T("what-if questions on utilization, spend, tenor, spread, limit, exchange rate and pipeline hypotheses", "perguntas do tipo \"e se\" sobre utilização, gasto, prazo, spread, limite, câmbio e hipóteses do pipeline"),
      T("the funnel bottleneck, its levers and the propensity deciles", "o gargalo do funil, as alavancas e os decis de propensão"),
      T("the anchor pipeline and each anchor by name", "o pipeline de âncoras e cada âncora pelo nome"),
      T("competitors, price bands, white space and external signals (fabricated figures)", "concorrentes, faixas de preço, espaço livre e sinais externos (números fabricados)"),
      T("Citi's public product descriptions and what is example, public or fabricated data", "as descrições públicas dos produtos do Citi e o que é dado de exemplo, público ou fabricado")
    ];
    const lead = failed ? T("I could not compute that one from the numbers on screen.", "Não consegui calcular essa a partir dos números da tela.")
      : asked ? T(`I do not have a rule for "${esc(asked)}".`, `Não tenho uma regra para "${esc(asked)}".`)
      : T("Ask a question about the numbers on screen.", "Faça uma pergunta sobre os números da tela.");
    const html = lead + " " + T("I answer from the panel's own numbers, with fixed rules, about:", "Respondo com os próprios números do painel, por regras fixas, sobre:") + "<br>" + topics.map(x => "• " + x).join("<br>")
      + engSmall(T("Try one of the suggestions below, or rephrase with one of these subjects.", "Experimente uma das sugestões abaixo, ou reformule com um desses assuntos."));
    let chips = []; try { chips = engineSuggestions().slice(0, 4); } catch (e) { chips = []; }
    return { title: T("What I can answer", "O que eu sei responder"), html, step: null, chips };
  }

  // ---------- router ----------
  function engRoute(raw) {
    const q = engNorm(raw); if (!q) return engFallback(raw);
    // Subjects the panel has no numbers for: an honest "no rule" beats a confident answer on another topic.
    if (/\bias ?7\b|\bifrs\b|\bselic\b|previsao do tempo|\bweather\b|\bclima\b|\bchuva\b|\brain\b/.test(q) || /(o que e|o que sao|what is|what's|what are|defin|explain|expliq)\b.*duplicata escritural/.test(q)) return engFallback(raw);
    const wi = engAnsWhatIf(q); if (wi) return wi;
    if (/de onde (vem|veem|sai)|where (does|do) .*(data|numbers|figures)|come from|origem dos (dados|numeros)/.test(q)) return engAnsData();
    if (/(share|participacao).*(contas a pagar|payables|compras elegiveis|eligible purchases)/.test(q)) return engAnsShare();
    if (/prazo medio|average (tenor|days discounted)|\btenor\b/.test(q)) return engAnsMethod();
    if (/dados? (sao |e |eh )?reais|real data|(data|numbers|figures) (are |is )?real|sao reais|is (this|it) real|de exemplo|example data|fabricad|fabricated|ilustrativ|illustrative|\bfonte|data source|sources?\b.*(data|numbers)|conjunto de dados|dataset|cambio|\bfx\b|exchange rate|ptax|dolar/.test(q)) return engAnsData();
    if (/funil|funnel|gargalo|bottleneck|friccao|friction|alavanca|lever|desist|drop.?out|cadastro|onboarding|\bkyc\b|\bperda\b|\bloss\b|conversao|conversion/.test(q)) return engAnsFunnel();
    if (/fianca|guarantee|cessao de credito|credit assignment|\besg\b|desconto de titulos|descontos? de duplicatas?|discount of trade|regresso|recourse|\bdso\b|\bdpo\b|cartao virtual|\bvca\b|cedente|o que e (o )?risco sacado|what is (scf|supply chain finance|reverse factoring|risco sacado)|produtos? do citi|citi products?|\bprodutos?\b.*\bciti\b|\bciti\b.*\b(produtos?|oferece|offers?)\b|\bproducts?\b.*\bciti\b|diferenca entre|difference between/.test(q)) return engAnsProducts(q);
    if (/calcul|comput|formula|metodolog|\bmetodo\b|\bmethod/.test(q)) return engAnsMethod();
    if (/concentra/.test(q)) return engAnsConcentration();
    const anc = ANCHORS.findIndex(a => q.includes(engNorm(a.name).split(" ")[0]) || new RegExp("\\b" + a.id + "\\b").test(q));
    if (anc >= 0) return engAnsAnchor(anc);
    if (/espaco livre|white ?space|nao financiad|unfinanced|unfunded|registradora|registrar|share real|real share|measured share|headroom to grow/.test(q)) return engAnsShare();
    if (/sinal|sinais|signal|rating|outlook|perspectiva|duplicata escritural|electronic duplicata/.test(q)) return engAnsSignals();
    if (/preco|pric|\bcdi\b|competitiv|faixa de mercado|market band|\bband\b/.test(q) || (/spread|\btaxa\b|\brate\b/.test(q) && !/receita|revenue/.test(q))) return engAnsPricing();
    if (/concorr|compet|mercado|market|itau|bradesco|santander|banco do brasil|\bbtg\b|fidc|fintech|lidera|\bleads?\b|financiador|funder/.test(q)) return engAnsCompetitors();
    if (/pipeline|ancora|anchor|prioriz|crescer|\bgrow|comite|committee|cross.?sell/.test(q)) return engAnsPipeline();
    if (/backtest|acuracia|accura|precisao|acert|tolerancia|tolerance|\berro\b|\berror\b|previsivel|predictab/.test(q)) return engAnsAccuracy();
    if (/limite|\blimit|estour|breach|\bcabe\b|\bfits?\b|pre.?aprov|headroom|folga/.test(q)) return engAnsLimit(q);
    if (/saldo|balance|carteira|\bbook\b/.test(q)) return engAnsForecast(q);
    if (/o que fazer|o que devo|o que faco|should i do|what to do|what should|acoes|\bacao\b|action|prioridade|priorit|next step|proximo passo|plano/.test(q)) return engAnsActions();
    if (/alerta|flags?\b|risco|risk|trava|\bgate\b/.test(q)) return engAnsFlags();
    if (/propens|decil|decile|\bscore\b|campanha|campaign|uplift|abordar|target/.test(q)) return engAnsPropensity();
    const kHit = Object.keys(ENG_KPI).find(k => ENG_KPI[k].re.test(q));
    if (kHit) return engAnsKpi(kHit, q);
    if (/previs|projec|forecast|predict|vai fechar|will close|cenario|scenario/.test(q)) return engAnsForecast(q);
    if (/resum|summar|como esta|how is|how are|visao geral|overview|status|leitura|reading|semana|week|panorama|destaque|highlight/.test(q)) return engAnsSummary();
    return engFallback(raw);
  }
  function askLocal(question) {
    try { const r = engRoute(question); if (r && typeof r.html === "string") { const q0 = engNorm(question); r.chips = r.chips.filter(c => engNorm(c) !== q0); return r; } } catch (e) { try { console.error("[engine]", e); } catch (e2) {} }
    try { return engFallback(question, true); } catch (e) { return { title: T("What I can answer", "O que eu sei responder"), html: T("I could not compute that one from the numbers on screen.", "Não consegui calcular essa a partir dos números da tela."), step: null, chips: [] }; }
  }

  // Starter questions for the selected week (4 to 6, most pressing first).
  function engineSuggestions() {
    const out = [], add = s => { if (s && !out.includes(s)) out.push(s); };
    try {
      const i = week - 1, f = engFc(), v = F[mode], w = worstStep(v), t = totals(), top = ANCHORS[engOrder(t)[0][1]].name, b = engBands(mktSpread), g = engSigGroups();
      if (f.kBase >= 0 || f.kHigh >= 0) add(T("When does the balance cross the approved limit?", "Quando o saldo passa do limite aprovado?"));
      if (D.err[i] > 8) add(T("Is the forecast error inside the tolerance?", "O erro de projeção está dentro da tolerância?"));
      if (D.flags[i] >= 3) add(T("How many risk flags are open and what does the gate say?", "Quantos alertas de risco estão abertos e o que diz a trava?"));
      add(T("What should I do this week?", "O que devo fazer nesta semana?"));
      add(T(`What is the balance forecast for ${engWk(week + curHorizon)}?`, `Qual o saldo previsto para a ${engWk(week + curHorizon)}?`));
      if (f.kBase < 0 && f.kHigh < 0) add(T("Does the balance fit the approved limit?", "O saldo cabe no limite aprovado?"));
      add(T(`How do we reduce the loss at "${L(STEPS[w])}"?`, `Como reduzir a perda na etapa "${L(STEPS[w])}"?`));
      if (b.above.length) add(T("Is our spread competitive against the market band?", "Nosso spread é competitivo frente à faixa de mercado?"));
      if (g.red.length) add(T("What do the external signals say?", "O que dizem os sinais externos?"));
      add(T(`Tell me about ${top}`, `Fale sobre a ${top}`));
      add(T("What if utilization rises 5 points?", "E se a utilização subir 5 pontos?"));
      add(T("Which anchor should we prioritise?", "Qual âncora priorizar?"));
    } catch (e) {}
    [T("Summarise this week", "Resuma esta semana"), T("Does the balance fit the approved limit?", "O saldo cabe no limite aprovado?"), T("Which anchor should we prioritise?", "Qual âncora priorizar?"), T("Are these real data?", "Esses dados são reais?")].forEach(s => { if (out.length < 4) add(s); });
    return out.slice(0, 6);
  }

  // Compact snapshot of what the dashboard shows now. Amounts in BRL million unless the key says otherwise.
  function engineContext() {
    const en = a => Array.isArray(a) ? a[0] : a, r1 = v => +(+v).toFixed(1), r2 = v => +(+v).toFixed(2), i = week - 1;
    const safe = (fn, dflt) => { try { return fn(); } catch (e) { return dflt; } };
    const f = safe(() => engFc(), null), t = safe(() => totals(), null), bt = safe(() => engBacktestAvg(), { n: 0, model: 0, flat: 0 }), v = F[mode], ws = worstStep(v);
    const sh = safe(() => engShareTotals(), null), b = engBands(mktSpread);
    return {
      meta: { title: "SCF Brazil · specialist weekly cockpit (concept)", language: lang, display_currency: ccy, units: "BRL million unless stated; percentages in %",
        fx_brl_per_usd: FX_RATE, fx_note: "rate typed in the panel, not fetched or verified",
        data_source: SRCINFO ? { kind: "user-loaded weekly data", name: SRCINFO.name, loaded_at: SRCINFO.at || null } : { kind: "pilot example data" },
        dataset: { id: datasetId, name: en(DS().name) },
        disclaimers: ["Nothing here is real bank data.", SRCINFO ? "Weekly programme data was loaded by the user and cannot be verified by the panel." : "Weekly programme data is example data of a pilot programme.", "Funnel, deciles and alerts are fixed example data.", "Anchor revenues are public figures quoted from linked sources, not checked live; everything derived from them is a working estimate.", "Every market figure (funders, shares, price bands, ratings, signals) is fabricated for the prototype."] },
      week: { selected: week, available: W },
      pilot_assumptions: { in_scope_annual_spend: SPEND, supplier_base: BASE_SUP, avg_days_discounted: PILOT.tenor, spread_pct: PILOT.spread, approved_limit: r1(limitBRL), forecast_error_tolerance_pct: 8, risk_flag_gate: 3, days_to_first_discount_mark: 10,
        balance_identity: "balance = in_scope_annual_spend x spend_under_programme% x utilization% x avg_days_discounted / 365; spread revenue = balance x spread%" },
      kpis: Object.fromEntries(KPIS.map(m => [m.k, { label: en(m.lbl), value: m.series[i], prior_week: i > 0 ? m.series[i - 1] : null }]).concat([["balance", { label: "Programme balance", value: D.bal[i], prior_week: i > 0 ? D.bal[i - 1] : null }]])),
      weekly_series: { spend_under_programme_pct: D.spend, active_suppliers: D.active, utilization_pct: D.util, days_to_first_discount: D.days, forecast_error_pct: D.err, share_of_wallet_pct: D.sow, open_risk_flags: D.flags, balance: D.bal, spread_revenue_per_year: rev },
      forecast: f ? { scenario: f.sc, horizon_weeks: f.h, base_weekly_growth_pct: r2(growthAt(week) * 100), end_week: week + f.h, end_balance: r1(f.end), range_low: r1(f.low), range_high: r1(f.high),
        end_by_scenario: Object.fromEntries(Object.keys(multipliers).map(s => [s, r1(projection(week, f.h, s)[f.h])])),
        limit: { approved_limit: r1(f.lim), status: engFcTone(f) === "good" ? "fits" : engFcTone(f) === "warn" ? "top of range crosses" : "selected scenario crosses", peak_top_of_range: r1(f.peakHigh), peak_pct_of_limit: r1(100 * f.peakHigh / f.lim), selected_scenario_crosses_in_week: f.kBase >= 0 ? week + f.kBase : null, top_of_range_crosses_in_week: f.kHigh >= 0 ? week + f.kHigh : null, extra_limit_needed: f.need },
        backtest_one_week: { forecasts_scored: bt.n, model_avg_abs_error_pct: r2(bt.model), carry_forward_avg_abs_error_pct: r2(bt.flat) },
        ceiling_balance: r1(f.cap), ceiling_binds: f.capped,
        method: "geometric mean of the last (up to 4) weekly changes, each future change = 93% of the previous; downside/upside = base growth minus/plus half of its size (0.5x/1.5x when positive); band = balance x forecast error x sqrt(weeks ahead) / 2.2; every point capped at in_scope_annual_spend x avg_days_discounted / 365 (100% spend at 100% utilization)" } : null,
      funnel_example: { view_on_screen: mode === "after" ? "with document AI" : "before document AI", steps: STEPS.map(en), before_document_ai: F.before, with_document_ai: F.after,
        weakest_step: en(STEPS[ws - 1]) + " -> " + en(STEPS[ws]), weakest_conversion_pct: Math.round(100 * v[ws] / v[ws - 1]), first_lever_to_test: safe(() => en((LEV[ws - 1].lv.find(x => !x[2]) || [""])), ""), note: "fixed example invitation wave; causes and levers are hypotheses" },
      pipeline: t ? { assumptions: { avg_days_discounted: G.tenor, spread_pct: G.spread }, totals: { eligible_purchases_brl_bn: r1(t.elig), potential_annual_flow_brl_bn: r2(t.flow), implied_balance: Math.round(t.bal), spread_revenue_per_year: r1(t.rev) },
        anchors: ANCHORS.map((a, k) => ({ name: a.name, sector: en(a.sector), revenue_base_brl_bn: a.rev, addressable_pct: P[k].addr, coverage_pct: P[k].cov, adoption_pct: P[k].adh, utilization_pct: P[k].util, potential_annual_flow_brl_bn: r2(t.flows[k]), implied_balance: Math.round(balOf(t.flows[k])) })) } : null,
      market_FABRICATED: { note: "fabricated for the prototype; does not describe real funding relationships", dataset: en(DS().name), matrix_unit: DS().matrixUnit,
        funders: FUNDERS.map(x => en(x.name)), funded_by_anchor: Object.fromEntries(COMP_DATA.map(r => [(ANCHORS.find(a => a.id === r.id) || {}).name || r.id, Object.fromEntries(FUNDERS.map(x => [en(x.name), r[x.k] || 0]))])),
        proposal_spread_cdi_plus_pct: mktSpread, price_bands: PRICE_TIERS.map(x => ({ rating: x.code, anchors: x.anchors, min: x.min, median: x.med != null ? x.med : null, max: x.max })), above_band: b.above, below_band: b.below,
        share_of_eligible_purchases: sh ? { citi_pct: r1(sh.pc), peer_banks_pct: r1(sh.pp), fidc_pct: r1(sh.pf), unfinanced_pct: r1(sh.pw), largest_white_space: { anchor: sh.best.name, brl_bn: r1(sh.best.free) } } : null,
        signals: ANCHORS.map(a => { const s = sigOf(a.id); return { anchor: a.name, severity: s.sev, note: s.note ? en(s.note) : null }; }) },
      action_plan: ACTS.map(a => ({ action: engPlain(a.title), why: engPlain(a.why), priority: a.pri, decision: a.dec, owners: a.own.map(o => en(OWN[o])) }))
    };
  }
