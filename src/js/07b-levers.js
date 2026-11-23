  // ========== LEVERS BY STAGE (ported from V13: working hypotheses for each funnel transition) ==========
  // Reads the funnel state of 07-adoption.js (F, STEPS, mode) and the current week; re-renders through onRefresh.
  // Each entry describes the transition STEPS[k] -> STEPS[k+1]. A lever with a third element "ai" is document AI,
  // the only lever whose effect the pilot example data illustrates (nothing here is a measured effect).
  Object.assign(I18N, {
    "lv.lbl":["Levers by stage","Alavancas por etapa"],
    "lv.tag":["Working hypotheses on the funnel example data","Hipóteses de trabalho sobre os dados de exemplo do funil"],
    "lv.k":["Adoption funnel · conversion stage by stage","Funil de adoção · conversão etapa a etapa"],
    "lv.h":["Where suppliers drop out, and what reduces the friction","Onde o fornecedor desiste, e o que reduz a fricção"],
    "lv.pill":["Hypotheses to validate","Hipóteses a validar"],
    "lv.note":["Causes and levers are working hypotheses to validate with the anchor. Document AI is the only lever whose effect the example data illustrates; nothing here is a measured result, and the funnel numbers are example data.","Causas e alavancas são hipóteses de trabalho a validar com a âncora. A IA de documentos é a única alavanca com efeito ilustrado nos dados de exemplo; nada aqui é um resultado medido, e os números do funil são dados de exemplo."]
  });
  const LEV = [
    {cause:["Generic invitation, sent by the bank to the wrong contact.","Convite genérico, enviado pelo banco ao contato errado."],
     own:["Relationship manager + anchor procurement","Gerente de relacionamento + compras da âncora"],
     lv:[["Invitation signed by the anchor's procurement team","Convite assinado pela área de compras da âncora"],["Message with the supplier's own gain in reais","Mensagem com o ganho em reais daquele fornecedor"],["WhatsApp and phone for small suppliers, sent to the finance contact","WhatsApp e telefone para os pequenos, no contato do financeiro"]]},
    {cause:["The supplier sees no clear advantage, or fears paperwork and a new bank account.","O fornecedor não vê vantagem clara, ou teme burocracia e abertura de conta."],
     own:["SCF specialist + relationship manager","Especialista SCF + gerente de relacionamento"],
     lv:[["Rate and net-amount simulator inside the invitation","Simulador de taxa e valor líquido já no convite"],["No new account: payment into the supplier's current bank","Sem abrir conta: crédito no banco que o fornecedor já usa"],["Plain explanation of accounting effects (no recourse)","Efeito contábil explicado de forma simples (sem coobrigação)"]]},
    {cause:["Too many documents, typed and uploaded by hand.","Documentos demais, digitados e enviados à mão."],
     own:["Onboarding operations","Operações de cadastro"],
     lv:[["Document AI: automatic reading and checking","IA de documentos: leitura e conferência automáticas","ai"],["Reuse the registration data the anchor already holds","Reaproveitar o cadastro que a âncora já tem do fornecedor"],["Risk-based KYC and e-signature","KYC proporcional ao risco e assinatura eletrônica"]]},
    {cause:["Credit and compliance queue; pending items go back and forth.","Fila de crédito e compliance; pendências em idas e vindas."],
     own:["Credit and risk + compliance","Crédito e risco + compliance"],
     lv:[["Agreed response time, with a tracked queue","Prazo de resposta combinado, com fila acompanhada"],["Batch pre-approval of low-risk suppliers","Pré-aprovação em lote dos fornecedores de baixo risco"],["Single point of contact for pending items","Ponto único de contato para pendências"]]},
    {cause:["The anchor is slow to confirm invoices, and the supplier must request each advance.","A âncora demora a confirmar duplicatas, e o fornecedor precisa pedir cada antecipação."],
     own:["Relationship manager + anchor accounts payable","Gerente de relacionamento + contas a pagar da âncora"],
     lv:[["Target time for the anchor to confirm invoices","Meta de prazo para a âncora confirmar duplicatas"],["Automatic early payment by rule","Antecipação automática por regra"],["Hands-on support for the first transaction","Acompanhamento da primeira operação"]]}
  ];
  // Index (1..5) of the weakest transition of a funnel vector v: the step s whose conversion v[s] / v[s-1] is lowest.
  function worstStep(v) { let worst = 1, wr = 1; for (let s = 1; s < v.length; s++) { const r = v[s] / v[s - 1]; if (r < wr) { wr = r; worst = s; } } return worst; }
  // First lever of a stage that is not the document-AI lever, as plain text in the current language ("" if none).
  // stepIndex uses the same numbering as worstStep(): 1..5, the transition STEPS[stepIndex - 1] -> STEPS[stepIndex].
  function firstLever(stepIndex) {
    const g = LEV[stepIndex - 1]; if (!g) return "";
    const x = g.lv.find(l => !l[2]);
    return x ? L(x) : "";
  }
  function renderLevers() {
    const box = $("levers"); if (!box) return;
    const v = F[mode], worst = worstStep(v), aiLive = week >= 5, sub = $("lv-sub");
    if (sub) sub.textContent = mode === "before"
      ? T("Conversion of each step in the baseline funnel. The step in red has the weakest conversion.","Conversão de cada etapa no funil-base. A etapa em vermelho tem a pior conversão.")
      : T("Conversion of each step with document AI live. The weakest conversion moves to the step in red.","Conversão de cada etapa com a IA de documentos em produção. A pior conversão passa para a etapa em vermelho.");
    box.innerHTML = LEV.map((g, k) => {
      const a = v[k], b = v[k + 1], cv = Math.round(100 * b / a), isWorst = k + 1 === worst;
      return `<div class="lev${isWorst ? " worst" : ""}">
        <div class="lev-st"><span>${esc(L(STEPS[k]))} → ${esc(L(STEPS[k + 1]))}</span>${isWorst ? `<em class="lev-flag">${T("Weakest","Pior conversão")}</em>` : ""}</div>
        <div class="lev-cv">${cv}%<small>${T(`${nf(a - b)} lost`,`${nf(a - b)} perdidos`)}</small></div>
        <div class="lev-k">${T("Likely cause","Causa provável")}</div><p>${esc(L(g.cause))}</p>
        <div class="lev-k">${T("Levers","Alavancas")}</div>
        <ul>${g.lv.map(x => `<li>${esc(L(x))} ${x[2]
          ? (aiLive ? `<span class="lev-chip live">${T("effect shown in the example data","efeito ilustrado nos dados de exemplo")}</span> <span class="lev-chip live">${T("live since W5 in the example","em produção desde a S5 no exemplo")}</span>` : `<span class="lev-chip">${T("goes live in W5","entra na S5")}</span>`)
          : `<span class="lev-chip">${T("to test","a testar")}</span>`}</li>`).join("")}</ul>
        <div class="lev-own"><b>${T("Owner","Responsável")}</b>: ${esc(L(g.own))}</div></div>`;
    }).join("");
  }
  onRefresh(renderLevers);
  // The before/after buttons change the funnel view outside the core render path: ask for a refresh.
  ["before", "after"].forEach(id => { const b = $(id); if (b) b.addEventListener("click", touch); });

