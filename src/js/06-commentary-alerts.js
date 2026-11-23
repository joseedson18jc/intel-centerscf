  // ========== COMMENTARY + ALERTS ==========
  function commentary(w) {
    const i = w - 1, p = Math.max(0, i - 1), dA = D.active[i] - D.active[p], share = Math.round(D.active[i] / BASE_SUP * 100), err = nf(D.err[i], 1), ok = D.err[i] <= 8;
    $("briefingWeekTag").textContent = WL() + w + " · " + (SRCINFO ? SRCINFO.name : T("Pilot anchor · example data","Âncora piloto · dados de exemplo"));
    let t = T(
      `Week ${w}: active suppliers ${dA > 0 ? "rose by " + dA + " to" : "held at"} ${D.active[i]} (${share}% of the ${BASE_SUP}-supplier base). Utilization is ${D.util[i]}% and share of wallet ${D.sow[i]}%. Forecast error is ${err}%, ${ok ? "inside" : "above"} the 8% tolerance. `,
      `Semana ${w}: fornecedores ativos ${dA > 0 ? "subiram " + dA + " para" : "permaneceram em"} ${D.active[i]} (${share}% da base de ${BASE_SUP}). Utilização em ${D.util[i]}% e share of wallet em ${D.sow[i]}%. Erro de projeção de ${err}%, ${ok ? "dentro" : "acima"} da tolerância de 8%. `
    );
    t += (!SRCINFO && w >= 5)
      ? T(`Days to first discount fell to ${D.days[i]} since document AI went live in week 5. `,`O prazo até o primeiro desconto caiu para ${D.days[i]} dias desde que a IA de documentos entrou em produção na semana 5. `)
      : T(`Current median time to first discount is ${D.days[i]} days${!SRCINFO ? "; document AI goes live in week 5" : ""}. `,`O prazo mediano até o primeiro desconto está em ${D.days[i]} dias${!SRCINFO ? "; a IA de documentos entra em produção na semana 5" : ""}. `);
    t += D.flags[i] >= 3
      ? T(`Review ${D.flags[i]} open risk flags before scaling the campaign.`,`Revise os ${D.flags[i]} alertas de risco abertos antes de ampliar a campanha.`)
      : T(`Risk flags are low (${D.flags[i]}): next 30 suppliers by propensity score are ready for outreach.`,`Alertas de risco baixos (${D.flags[i]}): os próximos 30 fornecedores pelo score de propensão estão prontos para abordagem.`);
    $("comment").textContent = t;
  }
  const ALERTS = [
    [3, () => C.red,   ["<b>Duplicate invoice</b> submitted twice by a supplier: blocked for review","<b>Duplicata repetida</b> enviada duas vezes por um fornecedor: bloqueada para análise"]],
    [1, () => C.red,   ["<b>Concentration:</b> top 10 suppliers hold 46% of the balance","<b>Concentração:</b> os 10 maiores fornecedores detêm 46% do saldo"]],
    [5, () => C.amber, ["<b>KYC gap:</b> 4 suppliers with expired documents","<b>Pendência de KYC:</b> 4 fornecedores com documentos vencidos"]],
    [8, () => C.amber, ["<b>Utilization drop</b> at one supplier (−30% vs 4-week average)","<b>Queda de utilização</b> em um fornecedor (−30% vs média de 4 semanas)"]],
    [10,() => C.green, ["<b>Seasonality ahead:</b> harvest peak expected in 5 weeks; pre-approve limits","<b>Sazonalidade à frente:</b> pico da safra previsto em 5 semanas; pré-aprovar limites"]],
  ];
  function alerts(w) {
    const box = $("alerts"); box.innerHTML = "";
    ALERTS.filter(a => a[0] <= w).sort((a, b) => b[0] - a[0]).slice(0, 2).forEach(a => {
      const d = document.createElement("div"); d.className = "alert-item";
      d.innerHTML = `<span class="sev" style="background:${a[1]()}"></span><span><b>${WL()}${a[0]}</b> · ${L(a[2])}</span>`;
      box.appendChild(d);
    });
  }

