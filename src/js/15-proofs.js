  // ========== STEP 1 CALCULATION PROOFS (every Step 1 card opens the arithmetic behind its number) ==========
  // What a proof shows: the formula, its inputs and the result, recomputed from the data on screen.
  // What it cannot show: reconciliation with a system of record. Breakdown tables that are not derived from
  // the weekly series are labelled as illustrative splits, and the footer names the data on screen (dataLabel()).
  // The pilot book uses PILOT.tenor / PILOT.spread (04-data-state.js); the pipeline assumptions G are not used here.
  const proofModal = $("proofModal");
  let activeProofKey = null, proofFocus = null;
  // flex-shrink:0: the modal body is a scrolling flex column, and a wrapper with overflow-x would otherwise collapse to
  // zero height when the proof is taller than the dialog (seen at 390 px).
  function pTable(headers, rows, footRow = null) {
    return `<div class="proof-table-wrap" style="flex-shrink:0"><table class="proof-table"><thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>${footRow ? `<tfoot><tr>${footRow.map(c => `<td>${c}</td>`).join("")}</tr></tfoot>` : ""}</table></div>`;
  }
  const pfIllus = () => T("illustrative split","divisão ilustrativa");
  const pfSeries = () => T(`Source: weekly series on this page (${dataLabel()}).`,`Fonte: série semanal desta página (${dataLabel()}).`);
  const pfGreen = s => `<b style="color:var(--green)">${s}</b>`;
  const pfSigned = (v, d = 1) => (v > 0 ? "+" : v < 0 ? "−" : "") + nf(Math.abs(v), d);
  // Stage split of the days-to-first-discount cycle: a fixed rule of thumb, not a measured breakdown.
  function pfStageSplit(d) {
    const invite = d >= 18 ? 3 : d >= 13 ? 2 : 1, docs = d >= 18 ? 11 : d >= 15 ? 8 : d >= 12 ? 5 : d >= 10 ? 4 : 3, kyc = d >= 15 ? 4 : d >= 11 ? 3 : 2;
    return [invite, docs, kyc, Math.max(1, d - invite - docs - kyc)];
  }
  const PROOFS = {
    "actions": () => ({
      title: T("Weekly action plan: the rule behind each item","Plano de ação: a regra por trás de cada item"),
      value: `${ACTS.filter(a => a.pri < 3).length} ${T("active priorities","prioridades ativas")}`,
      claim: T("Every item in the Monday action plan is produced by an explicit numeric rule over Decisions 1 to 3. Nothing in the list is typed by hand.","Cada item do plano de ação é produzido por uma regra numérica explícita sobre as Decisões 1 a 3. Nada na lista é digitado à mão."),
      badge: T("Rule-driven plan","Plano por regras"),
      formula: `<code>${T("Limit","Limite")}: ${money(FS.lim)}</code> · <code>${T("Peak","Pico")}: ${money(FS.peakHigh)}</code> · <code>${T("Error","Erro")}: ${nf(D.err[week - 1], 1)}%</code> · <code>${T("Flags","Alertas")}: ${D.flags[week - 1]}</code>`,
      table: pTable(["#", T("Action","Ação"), T("Priority","Prioridade"), T("Owner","Responsável")],
        ACTS.map((a, idx) => [idx + 1, a.title, `P${a.pri} (D${a.dec})`, a.own.map(o => L(OWN[o])).join(" + ")])),
      source: T(`Source: rules of this page over the Step 1 series (${dataLabel()}), the Step 2 limit check, the Step 3 pipeline hypotheses and the Step 4 price bands and signals (fabricated market figures).`,`Fonte: regras desta página sobre a série da Etapa 1 (${dataLabel()}), a checagem de limite da Etapa 2, as hipóteses do pipeline da Etapa 3 e as faixas de preço e sinais da Etapa 4 (números de mercado fabricados).`)
    }),
    "kpi-spend": () => {
      const i = week - 1, sp = D.spend[i], spBn = SPEND / 1000, capBn = spBn * sp / 100, dSp = sp - D.spend[0];
      const cats = [[T("Packaging & containers","Embalagens e insumos"),.34],[T("MRO & industrial services","MRO e serviços industriais"),.27],[T("Logistics & freight","Logística e frete"),.21],[T("Raw materials & components","Matérias-primas e componentes"),.18]];
      return {
        title: T("Spend under program: calculation","Gasto sob o programa: memória de cálculo"), value: sp + "%",
        claim: T(`${bn(capBn, 2)} of the ${bn(spBn, 1)} annual in-scope spend is enrolled in ${WL()}${week}.`,`${bn(capBn, 2)} dos ${bn(spBn, 1)} de compras anuais no escopo estão sob o programa na ${WL()}${week}.`),
        badge: T("Arithmetic reproduced","Conta reproduzida"),
        formula: `<code>${bn(spBn, 1)} × ${sp}% = ${bn(capBn, 2)}</code> · ${pfSigned(dSp, 0)} pp vs ${WL()}1`,
        table: pTable([T(`Spend category (${pfIllus()})`,`Categoria (${pfIllus()})`), T("Share","%"), T("Annual spend","Volume anual"), T("Suppliers","Fornecedores")],
          cats.map(([n, w]) => [n, Math.round(w * 100) + "%", bn(capBn * w, 2), Math.round(D.active[i] * w)]),
          [T("Total under program","Total sob o programa"), "100%", bn(capBn, 2), D.active[i]]),
        source: pfSeries() + T(" The category split uses fixed illustrative weights; in a live program it would come from the anchor's payables file."," A divisão por categoria usa pesos ilustrativos fixos; em um programa real viria do arquivo de contas a pagar da âncora.")
      };
    },
    "kpi-active": () => {
      const i = week - 1, act = D.active[i], pctBase = nf(act / BASE_SUP * 100, 1), base = D.active[0], added = Math.max(0, act - base), demo = !SRCINFO;
      const aiLift = demo && week >= 5 ? Math.round(added * .44) : 0, propLift = demo && week >= 3 ? Math.round(added * .34) : 0, organic = Math.max(0, added - aiLift - propLift);
      const share = v => nf(act ? v / act * 100 : 0, 1) + "%", wgt = T("Illustrative weight","Peso ilustrativo");
      const rows = [[T("Already active in week 1","Já ativos na semana 1"), base, share(base), T("From the series","Da série")]];
      if (demo) rows.push(
        [T("Organic onboarding","Adesão orgânica"), organic, share(organic), wgt],
        [T("Propensity campaign (D1 to D3)","Campanha por score (D1 a D3)"), propLift, share(propLift), week >= 3 ? wgt + " · 34%" : T("Starts W3","Começa na S3")],
        [T("Document AI (from W5)","IA de documentos (a partir da S5)"), aiLift, share(aiLift), week >= 5 ? wgt + " · 44%" : T("Starts W5","Começa na S5")]);
      else rows.push([T(`Net additions since ${WL()}1`,`Adições líquidas desde a ${WL()}1`), act - base, share(act - base), T("From the series","Da série")]);
      return {
        title: T("Active suppliers: what the number counts","Fornecedores ativos: o que o número conta"), value: `${act} / ${BASE_SUP}`,
        claim: T(`${pctBase}% of the ${BASE_SUP}-supplier base discounted in the program in ${WL()}${week}.`,`${pctBase}% da base de ${BASE_SUP} fornecedores antecipou no programa na ${WL()}${week}.`),
        badge: demo ? T("Sum checks · split illustrative","Soma confere · divisão ilustrativa") : T("Arithmetic reproduced","Conta reproduzida"), badgeWarn: demo,
        formula: demo
          ? `<code>${base} (${WL()}1) + ${organic} (${T("organic","orgânico")}) + ${propLift} (${T("propensity","propensão")}) + ${aiLift} (${T("doc AI","IA docs")}) = ${act}</code>`
          : `<code>${base} (${WL()}1) ${act - base < 0 ? "−" : "+"} ${Math.abs(act - base)} = ${act}</code> · <code>${act} ÷ ${BASE_SUP} = ${pctBase}%</code>`,
        table: pTable([T("Where the active suppliers come from","De onde vêm os ativos"), T("Suppliers","Fornecedores"), T("% of active","% dos ativos"), T("Basis","Base do número")], rows,
          [T("Total active","Total de ativos"), act, "100%", `${Math.max(0, BASE_SUP - act)} ${T("not yet active","ainda não ativos")}`]),
        note: T(`Not the same population as the onboarding funnel. This KPI counts every supplier discounting in the program in the week, including the ${base} that were already active in week 1. The funnel card follows one example invitation wave (${nf(WAVE)} invited, ${F.before[5]} first discounts before and ${F.after[5]} with document AI), so the two numbers are not meant to add up.`,`Não é a mesma população do funil de adesão. Este indicador conta todo fornecedor que antecipou no programa na semana, incluindo os ${base} que já estavam ativos na semana 1. O card do funil acompanha uma única onda de convites de exemplo (${nf(WAVE)} convidados, ${F.before[5]} primeiros descontos antes e ${F.after[5]} com IA de documentos); por isso os dois números não precisam somar.`),
        source: pfSeries() + (demo ? T(" The split by origin uses fixed illustrative weights (44% and 34% of net additions); the series does not record the origin of each supplier."," A divisão por origem usa pesos ilustrativos fixos (44% e 34% das adições líquidas); a série não registra a origem de cada fornecedor.") : "")
      };
    },
    "kpi-util": () => {
      const i = week - 1, ut = D.util[i], sp = D.spend[i], flowBn = (SPEND / 1000) * (sp / 100) * (ut / 100), balMi = D.bal[i];
      const t1 = Math.min(10, D.active[i]), t2 = Math.round((D.active[i] - t1) * .45), t3 = Math.max(0, D.active[i] - t1 - t2);
      return {
        title: T("Utilization: from flow to balance","Utilização: do fluxo ao saldo"), value: ut + "%",
        claim: T(`${ut}% of approved payables are discounted, which gives ${bn(flowBn, 2)}/yr of flow and a ${money(balMi)} balance.`,`${ut}% dos títulos aprovados são antecipados, o que dá ${bn(flowBn, 2)}/ano de fluxo e ${money(balMi)} de saldo.`),
        badge: T("Matches Step 2 balance","Bate com o saldo da Etapa 2"),
        formula: `<code>${bn(SPEND / 1000, 1)} × ${sp}% × ${ut}% = ${bn(flowBn, 2)}/${T("yr","ano")}</code> → <code>× ${PILOT.tenor}d ÷ 365 = ${money(balMi)}</code>`,
        table: pTable([T(`Supplier tier (${pfIllus()})`,`Faixa (${pfIllus()})`), T("Active","Ativos"), T("% balance","% saldo"), T("Avg util.","Util. média")], [
          [T("Top 10 high-frequency","Top 10 recorrentes"), t1, "46%", Math.min(92, ut + 18) + "%"],
          [T("Mid-tier recurring","Médios recorrentes"), t2, "36%", (ut + 2) + "%"],
          [T("Long-tail / seasonal","Cauda longa / sazonal"), t3, "18%", Math.max(35, ut - 16) + "%"]
        ], [T("Program total","Total do programa"), D.active[i], "100%", ut + "%"]),
        source: pfSeries() + T(` Balance uses the pilot tenor of ${PILOT.tenor} days set in Data. The tier split is illustrative.`,` O saldo usa o prazo do piloto de ${PILOT.tenor} dias definido em Dados. A divisão por faixa é ilustrativa.`),
        routeStep:2, routeLabel:T("→ Inspect forecast in Step 2","→ Ver projeção na Etapa 2")
      };
    },
    "kpi-days": () => {
      const i = week - 1, d = D.days[i], d0 = D.days[0], diff = d0 - d, demo = !SRCINFO;
      const now = pfStageSplit(d), was = pfStageSplit(d0), tot = a => a.reduce((s, v) => s + v, 0);
      const stages = [T("1. Invite → open","1. Convite → abertura"), T("2. Document upload & verification","2. Envio e validação de documentos"), T("3. KYC & compliance approval","3. Aprovação de KYC e compliance"), T("4. Portal → first discount","4. Portal → primeiro desconto")];
      const dl = v => v < 0 ? pfGreen(`${pfSigned(v, 0)} d`) : `${pfSigned(v, 0)} d`;
      return {
        title: T("Days to first discount: stage breakdown","Dias até o 1º desconto: decomposição por etapa"), value: `${d} ${T("days","dias")}`,
        claim: (diff > 0 ? T(`The median cycle is ${diff} days shorter than in ${WL()}1 (${d0}d → ${d}d).`,`O ciclo mediano está ${diff} dias mais curto que na ${WL()}1 (${d0}d → ${d}d).`)
          : diff < 0 ? T(`The median cycle is ${-diff} days longer than in ${WL()}1 (${d0}d → ${d}d).`,`O ciclo mediano está ${-diff} dias mais longo que na ${WL()}1 (${d0}d → ${d}d).`)
          : T(`The median cycle is ${d} days, the same as in ${WL()}1.`,`O ciclo mediano é de ${d} dias, igual ao da ${WL()}1.`))
          + (demo ? T(` In the example data, document AI goes live in ${WL()}5.`,` Nos dados de exemplo, a IA de documentos entra em produção na ${WL()}5.`) : ""),
        badge: T("Total from series · stages illustrative","Total da série · etapas ilustrativas"), badgeWarn:true,
        formula: `<code>${now.join("d + ")}d = ${tot(now)} ${T("days","dias")}</code>`,
        table: pTable([T(`Stage (${pfIllus()})`,`Etapa (${pfIllus()})`), `${WL()}1`, `${WL()}${week}`, T("Change","Variação")],
          stages.map((s, k) => [s, `${was[k]} d`, `${now[k]} d`, dl(now[k] - was[k])]),
          [T("Total cycle","Ciclo total"), `${tot(was)} d`, `${tot(now)} d`, dl(tot(now) - tot(was))]),
        source: pfSeries() + T(" Only the total comes from the series; the split by stage follows a fixed rule of thumb, not measured timestamps."," Só o total vem da série; a divisão por etapa segue uma regra fixa de aproximação, não tempos medidos.")
      };
    },
    "kpi-rev": () => {
      const i = week - 1, bal = D.bal[i], spRev = rev[i], flowBn = (SPEND / 1000) * D.spend[i] / 100 * D.util[i] / 100;
      const hist = []; for (let k = Math.max(0, i - 4); k <= i; k++) hist.push([`${WL()}${k + 1}`, D.spend[k] + "%", D.util[k] + "%", money(D.bal[k]), `<b>${moneyD(rev[k], 1)}</b>`]);
      return {
        title: T("Spread revenue: full calculation","Receita de spread: cálculo completo"), value: `${moneyD(spRev, 1)} / ${T("yr","ano")}`,
        claim: T(`Annualized spread revenue = program balance (${money(bal)}) × ${nf(PILOT.spread, 2)}% pilot spread = ${moneyD(spRev, 1)}/yr.`,`Receita anualizada = saldo do programa (${money(bal)}) × spread do piloto de ${nf(PILOT.spread, 2)}% = ${moneyD(spRev, 1)}/ano.`),
        badge: T("Formula shown = formula used","Fórmula exibida = fórmula usada"),
        formula: `<code>${bn(SPEND / 1000, 1)} × ${D.spend[i]}% × ${D.util[i]}% = ${bn(flowBn, 2)}</code> → <code>× ${PILOT.tenor} ÷ 365 = ${money(bal)}</code> → <code>× ${nf(PILOT.spread, 2)}% = ${moneyD(spRev, 1)}</code>`,
        table: pTable([T("Week","Sem."), T("Spend %","Gasto %"), T("Util %","Util. %"), T("Balance","Saldo"), T("Spread / yr","Spread / ano")], hist),
        source: pfSeries() + T(` Tenor (${PILOT.tenor} days) and spread (${nf(PILOT.spread, 2)}% p.a.) are the pilot parameters set in Data; the Step 3 pipeline keeps its own assumptions.`,` Prazo (${PILOT.tenor} dias) e spread (${nf(PILOT.spread, 2)}% a.a.) são os parâmetros do piloto definidos em Dados; o pipeline da Etapa 3 tem premissas próprias.`)
      };
    },
    "kpi-err": () => {
      const i = week - 1, err = D.err[i], ok = err <= 8, bt = backtest(week);
      const gain = r => { const g = r.flat - r.model; return g >= 0.005 ? `<span style="color:var(--green)">−${nf(g, 2)} pp</span>` : g <= -0.005 ? `<span style="color:var(--red)">+${nf(-g, 2)} pp</span>` : `${nf(0, 2)} pp`; };
      const rows = bt.length ? bt.slice(-6).map(r => [`${WL()}${r.week}`, nf(r.model, 2) + "%", nf(r.flat, 2) + "%", gain(r)]) : [[`${WL()}1`, "–", "–", T("Scored from W2","Apurado a partir da S2")]];
      return {
        title: T("Forecast error: tolerance check and backtest","Erro de projeção: checagem da tolerância e backtest"), value: nf(err, 1) + "%",
        claim: T(`Forecast error is ${nf(err, 1)}% in ${WL()}${week}, ${ok ? "inside" : "above"} the ${nf(8, 1)}% tolerance used in this cockpit.`,`O erro de projeção é de ${nf(err, 1)}% na ${WL()}${week}, ${ok ? "dentro" : "acima"} da tolerância de ${nf(8, 1)}% usada neste cockpit.`),
        badge: ok ? T(`PASS · ≤ ${nf(8, 1)}%`,`DENTRO · ≤ ${nf(8, 1)}%`) : T(`ALERT · > ${nf(8, 1)}%`,`ALERTA · > ${nf(8, 1)}%`), badgeWarn:!ok,
        formula: `<code>APE = |${T("Forecast","Projeção")} − ${T("Actual","Realizado")}| ÷ ${T("Actual","Realizado")} × 100</code>`,
        table: pTable([T("Week","Sem."), T("Base model APE","Erro do modelo"), T("Prior balance APE","Erro do saldo anterior"), T("Model vs prior","Modelo vs anterior")], rows),
        note: T("Two different things are shown. The headline value is the forecast-error column of the weekly series. The table is a separate check run on this page: the one-week backtest of the Step 2 base model on the balance series, against simply repeating the prior balance.","São duas coisas diferentes. O valor em destaque é a coluna de erro de projeção da série semanal. A tabela é uma checagem separada feita nesta página: o backtest de uma semana do modelo base da Etapa 2 sobre a série de saldo, comparado a simplesmente repetir o saldo anterior."),
        source: pfSeries() + T(" Backtest: recomputed in the browser from the balance series (Step 2)."," Backtest: recalculado no navegador a partir da série de saldo (Etapa 2)."),
        routeStep:2, routeLabel:T("→ Open backtest in Step 2","→ Ver backtest na Etapa 2")
      };
    },
    "kpi-sow": () => {
      const i = week - 1, sow = D.sow[i], peers = Math.round((100 - sow) * .68), fidc = 100 - sow - peers, wgt = T("Illustrative weight","Peso ilustrativo");
      return {
        title: T("Share of wallet: what is in the number","Share of wallet: o que há no número"), value: sow + "%",
        claim: T(`Estimated ${sow}% share of the financed wallet in ${WL()}${week} (${pfSigned(sow - D.sow[0], 0)} pp vs ${WL()}1).`,`Participação estimada de ${sow}% no volume financiado na ${WL()}${week} (${pfSigned(sow - D.sow[0], 0)} pp vs ${WL()}1).`),
        badge: T("Estimate · not measured","Estimativa · não medido"), badgeWarn:true,
        formula: `<code>${sow}% (Citi) + ${peers}% (${T("Peers","Pares")}) + ${fidc}% (FIDCs) = 100%</code>`,
        table: pTable([T("Wallet slice","Fatia"), T("Share","%"), T("Basis","Base do número")], [
          ["Citi", sow + "%", T("From the series","Da série")],
          [T("Peer banks","Bancos pares"), peers + "%", wgt],
          ["FIDCs", fidc + "%", wgt]
        ], [T("Total financed","Total financiado"), "100%", T("Not measured","Não medido")]),
        source: pfSeries() + T(" The split between peer banks and FIDCs is illustrative. Measuring this share would need consented registrar data (B3, CERC, Núclea), which this prototype does not have."," A divisão entre bancos pares e FIDCs é ilustrativa. Medir essa participação exigiria dados consentidos das registradoras (B3, CERC, Núclea), que este protótipo não tem."),
        routeStep:4, routeLabel:T("→ Open the share module in Step 4","→ Abrir o módulo de share na Etapa 4")
      };
    },
    "kpi-flags": () => {
      const i = week - 1, open = D.flags[i], activeAlerts = ALERTS.filter(a => a[0] <= week).sort((a, b) => b[0] - a[0]);
      const owners = [T("Operations / Anti-fraud","Operações / Antifraude"), T("Credit Risk","Risco de Crédito"), T("KYC / Compliance","KYC / Compliance"), T("Anchor RM","Gerente da Âncora"), T("Credit Committee","Comitê de Crédito")];
      return {
        title: T("Risk flags: open count and example alert list","Alertas de risco: contagem em aberto e lista de exemplo"), value: `${open} ${T("open","em aberto")}`,
        claim: T(`${open} open flag${open === 1 ? "" : "s"} in ${WL()}${week}. Rule of this cockpit to scale outreach: fewer than 3 open flags.`,`${open} alerta${open === 1 ? "" : "s"} em aberto na ${WL()}${week}. Regra deste cockpit para ampliar a campanha: menos de 3 alertas em aberto.`),
        badge: open < 3 ? T("Rule met · can scale","Regra atendida · pode ampliar") : T("Review before scaling","Revisar antes de ampliar"), badgeWarn: open >= 3,
        formula: `<code>${T("Listed","Listados")}: ${activeAlerts.length}</code> · <code>${T("Open","Em aberto")}: ${open}</code> · <code>${T("Rule","Regra")}: &lt; 3</code>`,
        table: pTable([T("Week","Sem."), T("Example alert","Alerta de exemplo"), T("Owner (illustrative)","Responsável (ilustrativo)"), T("Status (illustrative)","Situação (ilustrativa)")],
          activeAlerts.map((a, idx) => [`${WL()}${a[0]}`, L(a[2]), owners[ALERTS.indexOf(a) % owners.length], idx < open ? `<span class="sig-badge warn">${T("Open","Em aberto")}</span>` : `<span class="sig-badge pos">${T("Mitigated","Mitigado")}</span>`])),
        source: T(`Open count: weekly series (${dataLabel()}). The alert list, owners and status are example entries of this prototype, not the output of a risk system.`,`Contagem em aberto: série semanal (${dataLabel()}). A lista de alertas, os responsáveis e a situação são entradas de exemplo deste protótipo, não a saída de um sistema de risco.`)
      };
    },
    "briefing": () => {
      const i = week - 1, p = Math.max(0, i - 1), dA = D.active[i] - D.active[p], errOk = D.err[i] <= 8, flagOk = D.flags[i] < 3, aiLive = week >= 5, demo = !SRCINFO;
      const calc = `<span class="sig-badge pos">${T("Computed","Calculado")}</span>`;
      return {
        title: T("Weekly briefing: rule by rule","Resumo semanal: regra a regra"), value: `${WL()}${week} · 4/4 ${T("rule-based","por regra")}`,
        claim: T("Every sentence of the briefing is produced by a fixed rule from the weekly series on this page. No text model writes it.","Cada frase do resumo é produzida por uma regra fixa a partir da série semanal desta página. Nenhum modelo de texto a escreve."),
        badge: T("Deterministic text","Texto determinístico"),
        formula: `<code>Δ ${T("Active","Ativos")}: ${pfSigned(dA, 0) || "0"}</code> · <code>${T("Error","Erro")}: ${nf(D.err[i], 1)}% ${errOk ? "≤" : "&gt;"} 8%</code> · <code>${T("Flags","Alertas")}: ${D.flags[i]}</code>`,
        table: pTable([T("Sentence","Frase"), T("Input","Dado"), T("Rule","Regra"), T("Result","Resultado")], [
          [T("Base momentum","Ritmo da base"), `${D.active[i]} / ${BASE_SUP} (${pfSigned(dA, 0) || "0"})`, T("Δ vs prior week","Δ vs semana anterior"), calc],
          [T("Predictability","Previsibilidade"), nf(D.err[i], 1) + "%", `≤ ${nf(8, 1)}%`, `<span class="sig-badge ${errOk ? "pos" : "warn"}">${errOk ? T("Inside","Dentro") : T("Above","Acima")}</span>`],
          [T("Onboarding speed","Velocidade do cadastro"), `${D.days[i]} d`, demo ? T("Doc AI from W5 (example)","IA de docs a partir da S5 (exemplo)") : T("Median of the week","Mediana da semana"), demo ? `<span class="sig-badge ${aiLive ? "pos" : "neu"}">${aiLive ? T("After doc AI","Depois da IA") : T("Before doc AI","Antes da IA")}</span>` : calc],
          [T("Outreach rule","Regra da campanha"), `${D.flags[i]} ${D.flags[i] === 1 ? T("flag","alerta") : T("flags","alertas")}`, "< 3", `<span class="sig-badge ${flagOk ? "pos" : "warn"}">${flagOk ? T("Can scale","Pode ampliar") : T("Hold","Segurar")}</span>`]
        ]),
        source: pfSeries()
      };
    },
    "wallet": () => {
      const i = week - 1;
      const rows = [
        [T("Anchor: share of wallet","Âncora: share of wallet"), D.sow[0] + "%", `<b>${D.sow[i]}%</b>`, D.sow[W - 1] + "%", `${pfSigned(D.sow[i] - D.sow[0], 0) || "0"} pp`],
        [T("Supplier: share of receivables*","Fornecedor: share de recebíveis*"), D.supShare[0] + "%", `<b>${D.supShare[i]}%</b>`, D.supShare[W - 1] + "%", `${pfSigned(D.supShare[i] - D.supShare[0], 0) || "0"} pp`],
        ...SECT.map(([lbl, s1, s12]) => { const cur = Math.round(s1 + (s12 - s1) * (week - 1) / Math.max(1, W - 1)); return [`${T("Sector (example)","Setor (exemplo)")}: ${L(lbl)}`, s1 + "%", `<b>${cur}%</b>`, s12 + "%", `${pfSigned(cur - s1, 0) || "0"} pp`]; })
      ];
      return {
        title: T("Wallet share by segment: trajectory","Share of wallet por segmento: trajetória"), value: `${D.sow[i]}% / ${D.supShare[i]}%`,
        claim: T(`Tracks share at three levels from ${WL()}1 through ${WL()}${week}. Anchor and supplier lines come from the weekly series; the sector lines are example figures interpolated between two fixed points.`,`Acompanha a participação em três níveis da ${WL()}1 até a ${WL()}${week}. As linhas de âncora e fornecedor vêm da série semanal; as linhas por setor são números de exemplo interpolados entre dois pontos fixos.`),
        badge: T("Estimate · not measured","Estimativa · não medido"), badgeWarn:true,
        formula: `<code>${T("Sector(w)","Setor(w)")} = ${T("Start","Início")} + (${T("End","Final")} − ${T("Start","Início")}) × (${week} − 1) ÷ ${Math.max(1, W - 1)}</code>`,
        table: pTable([T("Segment","Segmento"), `${WL()}1`, `${WL()}${week}`, `${WL()}${W}`, T("Change","Variação")], rows),
        source: pfSeries() + T(" *Measuring a supplier's share of receivables would depend on the supplier's consent (LGPD and bank secrecy, LC 105/2001) and on registrar data."," *Medir a participação nos recebíveis de um fornecedor dependeria do consentimento dele (LGPD e sigilo bancário, LC 105/2001) e de dados das registradoras."),
        routeStep:4, routeLabel:T("→ Open the share module in Step 4","→ Abrir o módulo de share na Etapa 4")
      };
    },
    "funnel": () => {
      const b = F.before, a = F.after, last = b.length - 1, p1 = v => nf(v, 1);
      const same = b.findIndex((v, k) => v !== a[k]), sameN = same < 0 ? b.length : same;       // stages equal in both scenarios
      const rows = STEPS.map((st, idx) => {
        const bP = idx ? b[idx - 1] : b[idx], aP = idx ? a[idx - 1] : a[idx], diff = a[idx] - b[idx];
        return [`${idx + 1}. ${L(st)}`, `${b[idx]} (${p1(b[idx] / bP * 100)}%)`, `<b>${a[idx]}</b> (${p1(a[idx] / aP * 100)}%)`, diff === 0 ? T("Same (=)","Igual (=)") : pfGreen(pfSigned(diff, 0))];
      });
      const lossB = (1 - b[3] / b[2]) * 100, lossA = (1 - a[3] / a[2]) * 100;
      return {
        title: T("Onboarding funnel: before vs. with document AI","Funil de adesão: antes vs. com IA de documentos"), value: `${b[last]} → ${a[last]} (${pfSigned((a[last] / b[last] - 1) * 100, 0)}%)`,
        claim: T(`In this example wave the first ${sameN} stages (${b.slice(0, sameN).join(" → ")}) are identical in both scenarios by construction, so the whole difference from upload onward is attributed to document AI (${pfSigned(a[3] - b[3], 0)} uploads → ${pfSigned(a[last] - b[last], 0)} first discounts).`,`Nesta onda de exemplo as ${sameN} primeiras etapas (${b.slice(0, sameN).join(" → ")}) são idênticas nos dois cenários por construção; por isso toda a diferença a partir do envio é atribuída à IA de documentos (${pfSigned(a[3] - b[3], 0)} envios → ${pfSigned(a[last] - b[last], 0)} primeiros descontos).`),
        badge: T("Example wave · equal by construction","Onda de exemplo · igual por construção"), badgeWarn:true,
        formula: `<code>1 − ${b[3]}/${b[2]} = ${p1(lossB)}%</code> → <code>1 − ${a[3]}/${a[2]} = ${p1(lossA)}%</code> (<b>${pfSigned(lossA - lossB, 1)} pp</b>) · <code>${b[last]} → ${a[last]} (${pfSigned((a[last] / b[last] - 1) * 100, 0)}%)</code>`,
        table: pTable([T("Stage","Etapa"), T("Before (step %)","Antes (% da etapa)"), T("With AI (step %)","Com IA (% da etapa)"), T("Difference","Diferença")], rows,
          [T("End to end","Ponta a ponta"), `${p1(b[last] / b[0] * 100)}% (${b[last]}/${b[0]})`, `${p1(a[last] / a[0] * 100)}% (${a[last]}/${a[0]})`, `<span style="color:var(--green)">${pfSigned(a[last] - b[last], 0)} (${pfSigned((a[last] / a[0] - b[last] / b[0]) * 100, 1)} pp)</span>`]),
        note: T(`This is one invitation wave (${nf(b[0])} invited), not the whole program: the "Active suppliers" KPI counts every supplier discounting in the week and is therefore larger than the last funnel step.`,`Esta é uma única onda de convites (${nf(b[0])} convidados), não o programa inteiro: o indicador "Fornecedores ativos" conta todo fornecedor que antecipou na semana e por isso é maior que a última etapa do funil.`),
        source: T(`Source: example invitation wave of this prototype (${nf(b[0])} invited). It is fixed example data, not a measured experiment${SRCINFO ? ", and it does not change with the weekly data you loaded" : ""}.`,`Fonte: onda de convites de exemplo deste protótipo (${nf(b[0])} convidados). É um dado de exemplo fixo, não um experimento medido${SRCINFO ? ", e não muda com os dados semanais que você carregou" : ""}.`)
      };
    },
    "propensity": () => {
      const sumAll = DEC.reduce((s, v) => s + v, 0), sumTop3 = DEC.slice(0, 3).reduce((s, v) => s + v, 0), top3Share = nf(sumTop3 / sumAll * 100, 1), n = WAVE / DEC.length;
      const camp = Math.round(12 + 19 * Math.min(1, Math.max(0, (week - 2) / 4))), ctrl = 12;
      return {
        title: T("Propensity score: decile and uplift arithmetic","Score de propensão: conta dos decis e do ganho"), value: `${top3Share}% · ${pfSigned(camp - ctrl, 0) || "0"} pp`,
        claim: T(`In the example data, the top 3 deciles (D1 to D3 = ${nf(3 * n)} of ${nf(WAVE)} suppliers) account for ${top3Share}% of expected activations; in ${WL()}${week} the campaign group activates ${camp - ctrl} pp above the control group.`,`Nos dados de exemplo, os 3 primeiros decis (D1 a D3 = ${nf(3 * n)} de ${nf(WAVE)} fornecedores) respondem por ${top3Share}% das ativações esperadas; na ${WL()}${week} o grupo campanha ativa ${camp - ctrl} pp acima do grupo controle.`),
        badge: T("Arithmetic reproduced","Conta reproduzida"),
        formula: `<code>(${DEC.slice(0, 3).join(" + ")}) ÷ ${sumAll} = ${sumTop3} ÷ ${sumAll} = ${top3Share}%</code> · <code>${camp}% − ${ctrl}% = ${pfSigned(camp - ctrl, 0) || "0"} pp</code>`,
        table: pTable([T("Decile","Decil"), T("Suppliers","Fornec."), T("Rate","Taxa"), T("Expected","Ativos esp."), T("Share","% total")],
          DEC.map((v, idx) => [`<b>D${idx + 1}</b> ${idx < 3 ? `<span class="sig-badge pos">Top 30%</span>` : ""}`, nf(n), v + "%", nf(n * v / 100, 1), nf(v / sumAll * 100, 1) + "%"]),
          [T("Top 3 deciles","Top 3 decis"), `${nf(3 * n)} (30%)`, nf(sumTop3 / 3, 1) + "%", nf(n * sumTop3 / 100, 1), `<span style="color:var(--green)">${top3Share}%</span>`]),
        source: T(`Source: example activation rates by score decile (10 equal deciles of the ${nf(WAVE)}-supplier example wave). Campaign and control rates are example values, not a measured experiment.`,`Fonte: taxas de ativação de exemplo por decil do score (10 decis iguais da onda de exemplo de ${nf(WAVE)} fornecedores). As taxas de campanha e controle são valores de exemplo, não um experimento medido.`)
      };
    },
    "friction": () => {
      const b = F.before, a = F.after, last = b.length - 1, p1 = v => nf(v, 1);
      const stages = [[T("KYC start → upload","Início do KYC → envio"),2,3],[T("Upload → approval","Envio → aprovação"),3,4],[T("Approval → first discount","Aprovação → primeiro desconto"),4,5],[T("Invite → first discount","Convite → primeiro desconto"),0,5]];
      const avgFlow = ((SPEND / 1000) * D.spend[week - 1] / 100 * D.util[week - 1] / 100) / Math.max(1, D.active[week - 1]);
      const extra = a[last] - b[last], extraFlow = avgFlow * extra, lossB = (1 - b[3] / b[2]) * 100, lossA = (1 - a[3] / a[2]) * 100;
      return {
        title: T("Friction reduction: stage ratios and rough value","Redução de fricção: frações por etapa e valor aproximado"), value: `${pfSigned(lossA - lossB, 1)} pp ${T("drop-off","de perda")}`,
        claim: T(`In the example wave, drop-off at document upload goes from ${p1(lossB)}% (${b[2] - b[3]}/${b[2]}) to ${p1(lossA)}% (${a[2] - a[3]}/${a[2]}), which adds ${extra} suppliers at first discount. At this week's average flow per active supplier that is roughly ${bn(extraFlow, 2)}/yr.`,`Na onda de exemplo, a desistência no envio de documentos vai de ${p1(lossB)}% (${b[2] - b[3]}/${b[2]}) para ${p1(lossA)}% (${a[2] - a[3]}/${a[2]}), o que soma ${extra} fornecedores no primeiro desconto. Pelo fluxo médio por fornecedor ativo desta semana, isso equivale a cerca de ${bn(extraFlow, 2)}/ano.`),
        badge: T("Ratios reproduced · value is an estimate","Frações reproduzidas · valor é estimativa"), badgeWarn:true,
        formula: `<code>(1 − ${b[3]}/${b[2]}) − (1 − ${a[3]}/${a[2]}) = ${p1(lossB - lossA)} pp</code> · <code>${pfSigned(extra, 0)} × ${money(avgFlow * 1000)}/${T("yr","ano")} ≈ ${bn(extraFlow, 2)}/${T("yr","ano")}</code>`,
        table: pTable([T("Stage","Etapa"), T("Before","Antes"), T("With doc AI","Com IA de docs"), T("Difference","Diferença")],
          stages.map(([lbl, s, e]) => { const rb = 100 * b[e] / b[s], ra = 100 * a[e] / a[s]; return [lbl, `${b[e]}/${b[s]} = ${p1(rb)}%`, `<b>${a[e]}/${a[s]} = ${p1(ra)}%</b>`, pfGreen(`${pfSigned(ra - rb, 1)} pp`)]; })),
        source: T(`Source: stage ratios of the example invitation wave (${nf(b[0])} invited). The value in flow multiplies the extra suppliers by the average annual flow per active supplier of week ${week} (${dataLabel()}): an order of magnitude, not a forecast.`,`Fonte: frações por etapa da onda de convites de exemplo (${nf(b[0])} convidados). O valor em fluxo multiplica os fornecedores adicionais pelo fluxo anual médio por fornecedor ativo da semana ${week} (${dataLabel()}): é uma ordem de grandeza, não uma projeção.`)
      };
    }
  };
  function renderProof(key) {
    const fn = PROOFS[key]; if (!fn) return;
    const p = fn();
    $("proofEyebrow").textContent = T(`Calculation proof · Step 1 · Week ${week} · ${dataLabel()}`,`Memória de cálculo · Etapa 1 · Semana ${week} · ${dataLabel()}`);
    $("proofTitle").textContent = p.title;
    $("proofBody").innerHTML = `<div class="proof-claim"><div><strong>${p.value}</strong><p>${p.claim}</p></div><span class="proof-verified ${p.badgeWarn ? "warn" : ""}">${p.badgeWarn ? "" : "✓ "}${p.badge}</span></div>
      <div class="proof-formula"><span class="lbl">${T("Formula and calculation","Fórmula e memória de cálculo")}</span>${p.formula}</div>${p.table}${p.note ? `<div class="proof-formula"><span class="lbl">${T("How to read it","Como ler")}</span>${esc(p.note)}</div>` : ""}`;
    $("proofSource").textContent = p.source;
    $("proofAction").innerHTML = p.routeStep ? `<button class="sig-route-btn" id="proofRouteBtn">${p.routeLabel}</button>` : "";
    const rb = $("proofRouteBtn"); if (rb) rb.onclick = () => { closeProof(); goStep(p.routeStep, true); };
  }
  function openProof(key, triggerEl) {
    if (!PROOFS[key]) return;
    activeProofKey = key; proofFocus = triggerEl || document.activeElement;
    renderProof(key); proofModal.hidden = false; syncBodyLock(); proofModal.focus();
  }
  function closeProof() {
    proofModal.hidden = true; activeProofKey = null; syncBodyLock();
    if (proofFocus) proofFocus.focus();
  }
  $("panel-1").addEventListener("click", e => {
    if (e.target.closest("button,a,input,select,label")) return;
    const card = e.target.closest("[data-proof]"); if (card) openProof(card.dataset.proof, card);
  });
  $("panel-1").addEventListener("keydown", e => {
    if (e.key !== "Enter" && e.key !== " ") return;
    if (e.target.closest("button,a,input,select,label")) return;
    const card = e.target.closest("[data-proof]"); if (card) { e.preventDefault(); openProof(card.dataset.proof, card); }
  });
  $("proofClose").onclick = closeProof;
  proofModal.addEventListener("click", e => { if (e.target === proofModal) closeProof(); });

