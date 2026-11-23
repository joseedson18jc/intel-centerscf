  // ========== CONSISTENCY GLUE (wording that must match the data model, applied before the first render) ==========
  // The base dictionary (02-i18n-currency.js) is not edited. This module replaces the few entries whose wording
  // no longer matches what the page can show, and derives every "N slides" text from SLIDES.length.
  // Loads after 19-persistence.js and before 99-boot.js, so setLang() at boot already paints the final text.

  // Sets a dictionary entry. Keys that the dataset layer swaps per dataset (DS_I18N_KEYS) keep their dataset text:
  // the new wording becomes the default-dataset text and reaches I18N only while that dataset is active.
  function cxSetText(key, pair) {
    const perDataset = typeof DS_I18N_KEYS !== "undefined" && DS_I18N_KEYS.includes(key);
    if (perDataset) { DATASETS.q3.i18n[key] = pair; if (datasetId === "q3") I18N[key] = pair; }
    else I18N[key] = pair;
  }
  const CX_SLIDES = typeof SLIDES !== "undefined" ? SLIDES.length : 0;

  [
    // Vocabulary: the app says "example data" everywhere (source chip, data editor, briefing, proofs, deck).
    ["badge", ["Example data","Dados de exemplo"]],
    ["ft.by", ["Concept by <b>José Edson Matos da Costa</b> · example data and working hypotheses, not Citi data","Conceito de <b>José Edson Matos da Costa</b> · dados de exemplo e hipóteses de trabalho, não são dados do Citi"]],
    // The page cannot show that anything was built with these teams: it lists what a real rollout needs.
    ["ft.guard", ["<b>Guardrails for a real rollout:</b> design with Legal, Compliance and Risk · bank secrecy (LC 105/2001), LGPD, model validation · client data only aggregated, anonymised or with consent.","<b>Salvaguardas para uma implantação real:</b> desenho com Jurídico, Compliance e Risco · sigilo bancário (LC 105/2001), LGPD, validação de modelos · dados de clientes apenas agregados, anonimizados ou com consentimento."]],
    // The cards open a calculation, recomputed on the page; there is no audit against a system of record.
    ["pf.cue", ["View calculation ↗","Ver memória de cálculo ↗"]],
    ["sec.perf.n", ["Click any card to open the calculation behind its number","Clique em qualquer card para abrir a memória de cálculo do número"]],
    ["sec.perf.delta", ["Change vs prior week · click a card to see the calculation","Variação sobre a semana anterior · clique no card para ver o cálculo"]],
    // Sector shares are example figures, and the supplier ring is not a measured value.
    ["ws.sect", ["Market: share of wallet by sector (example figures)","Mercado: share of wallet por setor (números de exemplo)"]],
    ["ws.note", ["*Example figure. A measured value would need consented registered-receivables data as the duplicata escritural rolls out.","*Número de exemplo. Um valor medido exigiria dados consentidos de recebíveis registrados, à medida que a duplicata escritural avança."]],
    // Funnel vs "Active suppliers" KPI: two different populations, said where the funnel is shown.
    ["fn.note", ["Stages before upload are identical in both scenarios: document AI acts only from upload onward. The funnel follows this one wave; the \"Active suppliers\" indicator counts every supplier discounting in the program in the week, so it is larger than the last funnel step.","As etapas anteriores ao upload são iguais nos dois cenários: a IA de documentos só atua a partir do envio. O funil acompanha só esta onda; o indicador \"Fornecedores ativos\" conta todo fornecedor que antecipou no programa na semana e por isso é maior que a última etapa do funil."]],
    ["hero.art", ["Flow between supplier, anchor and bank","Fluxo entre fornecedor, âncora e banco"]],
    ["st.1.desc", ["Action plan, KPIs with their calculation, briefing, risk alerts, document-AI funnel and propensity.","Plano de ação, KPIs com memória de cálculo, briefing, alertas, funil com IA de documentos e propensão."]],
    // Step 4 holds fabricated market figures: nothing there is a measured or registrar-sourced share.
    ["st.4.desc", ["Funder matrix, CDI+x benchmark, share of eligible payables and external signals (fabricated figures).","Matriz de financiadores, benchmark CDI+x, share do contas a pagar elegível e sinais externos (números fabricados)."]],
    ["mk.3h", ["Share of payables","Share do contas a pagar"]],
    // Slide counts come from the deck itself.
    ["nav.present", [`Present (${CX_SLIDES})`,`Apresentar (${CX_SLIDES})`]],
    ["nav.present.end", [`Open executive presentation (${CX_SLIDES} slides)`,`Abrir apresentação executiva (${CX_SLIDES} slides)`]],
    ["st.set.autoP", [`When unchecked (recommended), review the Before → After diff and update the cockpit and the ${CX_SLIDES}-slide presentation in one click.`,`Quando desmarcado (recomendado), você revisa o diff Antes → Depois e atualiza o cockpit e a apresentação de ${CX_SLIDES} slides com um clique.`]],
    ["ai.mod.lbl", [`Cross-data intelligence · Steps 1–4 + Presentation (${CX_SLIDES})`,`Inteligência cruzada · Etapas 1–4 + Apresentação (${CX_SLIDES})`]]
  ].forEach(([k, pair]) => cxSetText(k, pair));

  // Refresh-time glue for things no core render path owns.
  let cxSig = "";
  function cxSync() {
    // Example-only marker on the week slider ("W5 · Doc AI") is hidden once the user works on their own data.
    const tick = $("docAiTick"); if (tick) tick.style.visibility = SRCINFO ? "hidden" : "";
    // An open proof follows every state change (dataset, FX rate, pilot parameters, data source), not only currency and language.
    const sig = [datasetId, FX_RATE, PILOT.tenor, PILOT.spread, BASE_SUP, SPEND, W, week, lang, ccy, SRCINFO ? SRCINFO.kind + SRCINFO.ts : ""].join("|");
    if (sig !== cxSig) {
      cxSig = sig;
      if (proofModal && !proofModal.hidden && activeProofKey) renderProof(activeProofKey);
      if (typeof updateCcyTexts === "function" && appReady) updateCcyTexts();
    }
  }
  onRefresh(cxSync);

