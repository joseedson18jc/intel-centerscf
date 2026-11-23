  // ========== LANGUAGE, CURRENCY & LOCALE HELPERS ==========
  // FX rate (BRL per USD). It is a number typed into the panel: the default is only a starting value,
  // the app cannot verify it against any source, so labels call it "rate entered in the panel".
  const FX_DEFAULT = 5.8889, FX_MIN = 1, FX_MAX = 20;
  let FX_RATE = FX_DEFAULT;
  let lang = "pt", ccy = "BRL";
  try {
    const qp = new URLSearchParams(location.search);
    const ql = qp.get("lang"), sl = localStorage.getItem("scf-lang");
    lang = (ql === "en" || ql === "pt") ? ql : (sl === "en" || sl === "pt") ? sl : "pt";
    const qc = (qp.get("ccy") || "").toUpperCase(), sc = (localStorage.getItem("scf-ccy") || "").toUpperCase();
    ccy = (qc === "USD" || qc === "BRL") ? qc : (sc === "USD" || sc === "BRL") ? sc : "BRL";
  } catch (e) {}

  const T = (en, pt) => lang === "pt" ? pt : en;
  const L = a => a[lang === "pt" ? 1 : 0];
  const loc = () => lang === "pt" ? "pt-BR" : "en-US";
  const fx = () => ccy === "USD" ? FX_RATE : 1;
  const sym = () => ccy === "USD" ? (lang === "pt" ? "US$ " : "$") : (lang === "pt" ? "R$ " : "R$");
  const ccyCode = () => ccy === "USD" ? "US$" : "R$";
  const nf = (v, d = 0) => Number(v).toLocaleString(loc(), {minimumFractionDigits: d, maximumFractionDigits: d});
  const money = v => { const x = v / fx(); return lang === "pt" ? sym() + nf(Math.round(x)) + " mi" : sym() + nf(Math.round(x)) + "m"; };
  const moneyD = (v, d = 1) => { const x = v / fx(); return lang === "pt" ? sym() + nf(x, d) + " mi" : sym() + nf(x, d) + "m"; };
  const bn = (v, d = 2) => { const x = v / fx(); return lang === "pt" ? sym() + nf(x, d) + " bi" : sym() + nf(x, d) + "bn"; };
  const WL = () => T("W", "S");
  // Rate as text: at least 2 and at most 4 decimals, in the current locale.
  const fxNum = () => Number(FX_RATE).toLocaleString(loc(), {minimumFractionDigits: 2, maximumFractionDigits: 4});
  // fxLabel()     -> "FX entered in the panel: R$5.8889 / US$ (editable)"
  // fxLabel(true) -> "R$5.8889 / US$"  (short form for tight places)
  function fxLabel(short) {
    const pair = T(`R$${fxNum()} / US$`, `R$ ${fxNum()} / US$`);
    return short ? pair : T(`FX entered in the panel: ${pair} (editable)`, `Câmbio informado no painel: ${pair} (editável)`);
  }
  // Sets the BRL per USD rate. Returns the value actually applied (clamped to FX_MIN..FX_MAX), or null when
  // v is not a number. Re-renders once the app has booted; persist=true also saves the parameters right away.
  function setFxRate(v, persist) {
    const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
    if (!isFinite(n)) return null;
    const r = +Math.min(FX_MAX, Math.max(FX_MIN, n)).toFixed(4);
    const changed = r !== FX_RATE;
    FX_RATE = r;
    if (changed && typeof refreshAll === "function") refreshAll();
    if (persist && typeof saveParams === "function") saveParams();
    return r;
  }

  const I18N = {
    "nav.brand":["Early Money","Early Money"],"nav.sub":["Corporate Banking · Brazil","Corporate Banking · Brasil"],
    "nav.ai":["AI Analysis ON","AI Analysis ON"],"nav.ai.aria":["Open AI Analysis ON","Abrir AI Analysis ON"],
    "nav.settings":["Dashboard settings & Anthropic API key","Configurações do painel e chave Anthropic"],
    "nav.data":["Data","Dados"],"nav.brief":["Briefing","Briefing"],
    "nav.present":["Present (17)","Apresentar (17)"],"nav.present.end":["Open executive presentation (17 slides)","Abrir apresentação executiva (17 slides)"],
    "nav.next2":["Next · Step 2: Balance forecast","Próximo · Etapa 2: Projeção de saldo"],
    "nav.prev1":["Step 1: Diagnose & onboarding","Etapa 1: Diagnóstico e adesão"],
    "nav.next3":["Next · Step 3: Anchor pipeline","Próximo · Etapa 3: Pipeline de âncoras"],
    "nav.prev2":["Step 2: Balance forecast","Etapa 2: Projeção de saldo"],
    "nav.next4":["Next · Step 4: Market","Próximo · Etapa 4: Mercado"],
    "nav.prev3":["Step 3: Anchor pipeline","Etapa 3: Pipeline de âncoras"],
    "hero.sup":["Suppliers","Fornecedores"],"hero.anc":["Anchor","Âncora"],"hero.bank":["Bank","Banco"],
    "hero.inv":["invoices","duplicatas"],"hero.conf":["confirmed","confirmadas"],"hero.pay":["credit advance","antecipação de crédito"],
    "st.who":["Used by:","Quem usa:"],
    "st.1.short":["Diagnose","Diagnóstico"],"st.1.tag":["Decision 1","Decisão 1"],"st.1.title":["Diagnose program & onboarding","Diagnosticar programa e adesão"],
    "st.1.desc":["Action plan, auditable KPIs, briefing, risk alerts, document-AI funnel and propensity.","Plano de ação, KPIs auditáveis, briefing, alertas, funil com IA de documentos e propensão."],
    "st.1.who":["SCF Specialist & RM","Especialista SCF & RM"],
    "st.2.short":["Forecast","Projeção"],"st.2.tag":["Decision 2","Decisão 2"],"st.2.title":["Forecast balance & test limits","Projetar saldo e testar limites"],
    "st.2.desc":["Does projected balance fit the approved limit? Is error inside the 8% tolerance?","O saldo projetado cabe no limite aprovado? Erro de projeção dentro de 8%?"],
    "st.2.who":["SCF Specialist & Risk","Especialista SCF & Risco"],
    "st.2.meta":["Balance predictability, approved limit headroom and backtest accuracy (target ≤ 8%)","Previsibilidade de saldo, limite aprovado e backtest (meta ≤ 8%)"],
    "st.3.short":["Pipeline","Pipeline"],"st.3.tag":["Decision 3","Decisão 3"],"st.3.title":["Size & prioritize anchor pipeline","Dimensionar pipeline de âncoras"],
    "st.3.desc":["Prioritize 5 anchors (3Q26 financials), edit hypotheses and size credit & revenue.","Priorizar 5 âncoras (receitas 3T26), editar hipóteses e estimar crédito e receita."],
    "st.3.who":["Corporate / SCF Leadership","Liderança Corporate / SCF"],
    "st.4.short":["Market","Mercado"],"st.4.tag":["Market","Mercado"],"st.4.cad":["External intelligence","Inteligência externa"],"st.4.title":["Market, pricing & external signals","Mercado, preços e sinais externos"],
    "st.4.desc":["Competitor matrix (IAS 7), CDI+x benchmark, real share (B3/CERC/Núclea) and 3Q26 signals.","Matriz de concorrentes (IAS 7), benchmark CDI+x, share real (B3/CERC/Núclea) e sinais 3T26."],
    "st.4.who":["Leadership & Product","Liderança & Produto"],
    "sp.1":["Step 1 of 4","Etapa 1 de 4"],"sp.2":["Step 2 of 4","Etapa 2 de 4"],"sp.3":["Step 3 of 4","Etapa 3 de 4"],"sp.4":["Step 4 of 4","Etapa 4 de 4"],
    "vm.step":["Step-by-step","Passo a passo"],"vm.all":["Full cockpit","Visão completa"],
    "ms.d1c":["Weekly · operational","Semanal · operacional"],"ms.d2c":["Weekly · predictability","Semanal · previsibilidade"],"ms.d3c":["Monthly / quarterly","Mensal / trimestral"],
    "kick":["Brazil portfolio · Weekly review, daily inputs","Carteira Brasil · Revisão semanal, inputs diários"],
    "h1":["SCF specialist weekly Intel Center","Intel Center semanal especialista de SCF"],"badge":["Illustrative data","Dados ilustrativos"],
    "aria.weekctl":["Week controls","Controles de semana"],"aria.prev":["Previous week","Semana anterior"],"aria.next":["Next week","Próxima semana"],
    "aria.play":["Play weekly history","Reproduzir histórico semanal"],"aria.quarter":["Quarter countdown","Contagem para o fim do trimestre"],"aria.clock":["Time remaining in quarter","Tempo restante no trimestre"],
    "wk":["Week","Semana"],"wk.short":["Wk","Sem"],"wk.docai":["W5 · Doc AI","S5 · IA Docs"],
    "sec.act":["This week's action plan","Plano de ação da semana"],"act.foot":["Auto-prioritized from approved limit, forecast error, risk flags, funnel and external signals.","Priorizado automaticamente por limite, erro, alertas de risco, funil e sinais externos."],
    "sec.perf":["Program performance","Desempenho do programa"],"sec.perf.n":["Click any card to open its audit trail & mathematical proof","Clique em qualquer card para abrir a memória de cálculo e a prova"],
    "sec.perf.delta":["Change vs prior week · click any card to audit","Variação sobre a semana anterior · clique no card para auditar"],
    "ai.badge":["Weekly briefing","Resumo semanal"],"ai.h":["What changed this week","O que mudou nesta semana"],"ai.sub":["Deterministic synthesis and risk guardrails before scaling outreach","Síntese determinística e alertas antes de escalar a campanha"],"ai.alerts":["Recent alert highlights","Alertas recentes"],
    "fc.lbl":["Predictability","Previsibilidade"],"fc.h":["Program balance forecast","Projeção do saldo do programa"],"fc.scenario":["Scenario","Cenário"],"fc.horizon":["Horizon","Horizonte"],"fc.limit":["Approved limit","Limite aprovado"],
    "sc.Downside":["Downside","Pessimista"],"sc.Base":["Base","Base"],"sc.Upside":["Upside","Otimista"],
    "hz.4":["4 weeks","4 semanas"],"hz.8":["8 weeks","8 semanas"],"hz.13":["13 weeks","13 semanas"],
    "lg.actual":["Actual","Realizado"],"lg.fc":["Forecast","Projeção"],"lg.band":["Error band","Faixa de erro"],
    "fc.details":["Forecast assumptions and weekly values","Premissas da projeção e valores semanais"],"th.low":["Low","Mínimo"],"th.high":["High","Máximo"],
    "cs.lbl":["Closing sensitivity","Sensibilidade de fechamento"],"cs.h":["Closing balance by scenario","Saldo final por cenário"],
    "acc.lbl":["Weekly backtest","Backtest semanal"],"acc.h":["One-week forecast accuracy","Precisão da projeção de uma semana"],"acc.n":["Absolute percentage error by outcome week. Lower is better.","Erro percentual absoluto por semana apurada. Quanto menor, melhor."],
    "lg.model":["Base model","Modelo base"],"lg.prior":["Prior balance","Saldo anterior"],
    "sec.adoption":["Supplier adoption & levers","Adesão de fornecedores e alavancas"],"sec.adoption.n":["Where to intervene: documents, propensity targeting or wallet share","Onde intervir: documentos, propensão ou participação"],
    "ws.lbl":["Market share · three levels","Participação · três níveis"],"ws.h":["Wallet share by segment","Share of wallet por segmento"],"ws.r1":["Anchor: share of wallet","Âncora: share of wallet"],"ws.r2":["Supplier: share of receivables*","Fornecedor: share de recebíveis*"],
    "ws.sect":["Market: share of wallet by sector","Mercado: share of wallet por setor"],"ws.note":["*From consented registered-receivables data as the duplicata escritural rolls out.","*Com dados consentidos de recebíveis registrados, à medida que a duplicata escritural avança."],
    "fn.lbl":["Onboarding friction map","Mapa de fricção no cadastro"],"fn.h":["Onboarding funnel","Funil de adesão"],"fn.before":["Before","Antes"],"fn.after":["With document AI","Com IA de documentos"],
    "fn.note":["Stages before upload are identical in both scenarios: document AI acts only from upload onward.","As etapas anteriores ao upload são iguais nos dois cenários: a IA de documentos só atua a partir do envio."],
    "pr.lbl":["Propensity score","Score de propensão"],"pr.h":["Activation by propensity","Ativação por propensão"],"pr.n":["Activation rate by score decile (D1 = most likely to discount).","Taxa de ativação por decil do score (D1 = maior chance de antecipar)."],
    "up.camp":["Campaign group","Grupo campanha"],"up.ctrl":["Control group","Grupo controle"],"up.lift":["Uplift","Ganho"],
    "sec.friction":["Friction reduction impact","Impacto da redução de fricção"],"fr.sub":["Stage-by-stage conversion comparison with and without document AI","Comparativo de conversão por etapa com e sem IA de documentos"],
    "fr.lbl":["Document upload drop-off","Perda no envio de documentos"],"fr.cap":["Supplier conversion by stage","Conversão de fornecedores por etapa"],"fr.stage":["Stage","Etapa"],"fr.change":["Change","Variação"],
    "sec.pipe":["Anchor pipeline · SCF cross-sell","Pipeline de âncoras · cross-sell de risco sacado"],"sec.pipe.n":["Public 3Q26 financials (Nov 2026) + editable working hypotheses","Receitas públicas 3T26 (nov/2026) + hipóteses editáveis"],
    "pp.lbl":["Sizing model","Modelo de dimensionamento"],"pp.h":["Potential annual discounting flow by anchor","Fluxo anual potencial de antecipação por âncora"],
    "pp.intro":["All five were named as Brazilian clients by Citi's Corporate Banking heads (Bloomberg Línea, Jul 2025). That confirms a relationship — not an active supplier-finance program, approved limit or eligible volume. Public revenues are updated to 3Q26 releases (Nov 2026): annual eligible purchases use the 2026 annualized base (or Embraer's raised 2026 guidance of US$8.4–8.6bn) × an editable addressable share.","As cinco foram citadas como clientes brasileiras pelos responsáveis do Corporate Banking do Citi (Bloomberg Línea, jul/2025). Isso confirma relacionamento — não programa de risco sacado ativo, limite aprovado nem volume elegível. As receitas públicas foram atualizadas pelos balanços do 3T26 (nov/2026): as compras elegíveis anuais usam a base anualizada 2026 (ou o guidance 2026 revisto da Embraer de US$ 8,4–8,6 bi) × uma parcela endereçável editável."],
    "pp.present":["Present cross-sell case","Apresentar caso de cross-sell"],"pp.presets":["Quick preset:","Cenário rápido:"],"pp.p.cons":["Conservative","Conservador"],"pp.p.base":["Base (default)","Base (padrão)"],"pp.p.stretch":["Stretch","Expansão"],
    "pp.th.anchor":["Anchor","Âncora"],"pp.th.revenue":["2026 annual / 3Q26","Anual 2026 / 3T26"],"pp.th.addr":["Addressable %","% endereçável"],"pp.th.elig":["Eligible purchases","Compras elegíveis"],
    "pp.th.cov":["Coverage %","Cobertura %"],"pp.th.adh":["Adoption %","Adesão %"],"pp.th.util":["Utilization %","Utilização %"],"pp.th.flow":["Annual flow","Fluxo anual"],"pp.th.bal":["Implied balance","Saldo implícito"],"pp.th.rev":["Spread rev / yr","Receita spread / ano"],
    "pp.total":["Pipeline total","Total do pipeline"],"pp.tenor":["Average days discounted","Prazo médio antecipado (dias)"],"pp.spread":["Annual spread %","Spread anual %"],"pp.reset":["Reset hypotheses","Restaurar hipóteses"],
    "pp.caveat":["Flow is not balance: implied balance = annual flow × average days discounted ÷ 365, and moves with seasonality. Adoption is weighted by supplier volume. Ranking reflects the hypotheses above, not Citi data or company disclosures.","Fluxo não é saldo: saldo implícito = fluxo anual × prazo médio antecipado ÷ 365, e varia com a sazonalidade. A adesão é ponderada pelo volume dos fornecedores. O ranking reflete as hipóteses acima, não dados do Citi nem informações divulgadas pelas empresas."],
    "pp.cards.h":["Anchor qualification snapshots (3Q26)","Fichas rápidas por âncora (3T26)"],"pp.cards.n":["Where to investigate and what decisive check unlocks each account","Onde investigar e qual validação destrava cada conta"],
    "sec.mkt":["Market and competition","Mercado e concorrência"],"sec.mkt.n":["External intelligence · interactive illustrative prototype ready for live feeds","Inteligência externa · protótipo funcional ilustrativo pronto para integração"],
    "mk.mat.lbl":["Current cockpit data mix","Composição atual de dados no cockpit"],"mk.mat.h":["Architecture of the 4 external intelligence modules (Phase 2)","Arquitetura dos 4 módulos externos (Fase 2)"],"mk.proto":["Illustrative feeds · API-ready","Feeds ilustrativos · pronto p/ APIs"],
    "mk.m1":["80% internal program data","80% dados internos do programa"],"mk.m2":["15% internal & public 3Q26 pipeline","15% pipeline interno & 3T26 público"],"mk.m3":["5% market (modeled below to connect)","5% mercado (modelado abaixo p/ conectar)"],
    "mk.tab.all":["All 4 modules","Todos os 4 módulos"],"mk.src":["Data source","Fonte de dado"],"mk.out":["Output","Entrega"],
    "mk.1tag":["4.1 · Competitive matrix","4.1 · Matriz competitiva"],"mk.1h":["Competitors by anchor","Concorrentes por âncora"],"mk.1q":["Which banks and FIDCs already run reverse factoring for each anchor?","Quais bancos e FIDCs já operam o risco sacado de cada âncora?"],
    "mk.1s":["Anchors' financial-statement notes on supplier finance (IAS 7 / IFRS 7, since 2024) and CVM FIDC filings.","Notas explicativas das âncoras sobre risco sacado (IAS 7 / IFRS 7 desde 2024) e informes de FIDC na CVM."],"mk.1o":["Anchor × funder matrix with estimated program size.","Matriz âncora × financiador com tamanho estimado."],
    "mk.cf.all":["All","Todos"],"mk.cf.banks":["Banks","Bancos"],"mk.cf.fidc":["FIDCs (CVM)","FIDCs (CVM)"],
    "mk.2tag":["4.2 · Pricing benchmark (CDI + x)","4.2 · Benchmark de taxa (CDI + x)"],"mk.2h":["Price benchmark","Preço comparado"],"mk.2q":["Is Citi's rate competitive against the market (CDI + x)?","A taxa do Citi é competitiva contra o mercado (CDI + x)?"],
    "mk.2s":["Central Bank rate statistics for receivables discounting, FIDC senior-quota spreads and RM lost-deal feedback.","Estatísticas do Banco Central para desconto de duplicatas, spreads de FIDC sênior e motivo de perda dos RMs."],"mk.2o":["Citi spread vs. market band by anchor rating.","Spread do Citi contra faixa de mercado por rating."],
    "mk.rt.all":["All ratings","Todos os ratings"],"mk.2.sim":["Test proposed spread (CDI +):","Testar taxa proposta (CDI +):"],"mk.2.lg.band":["Market band (BCB + banks)","Faixa mercado (BCB + bancos)"],"mk.2.lg.fidc":["FIDC senior (CVM)","FIDC sênior (CVM)"],"mk.2.lg.citi":["Citi proposal","Proposta Citi"],
    "mk.2.rm.lbl":["RM feedback · lost deals","Feedback dos RMs · negócios perdidos"],"mk.2.rm.h":["Why recent bids were lost","Por que perdemos disputas recentes"],"mk.2.rm.sub":["Illustrative sample of loss reasons reported by relationship managers.","Amostra ilustrativa de motivos reportados pelos gerentes de relacionamento."],
    "mk.3tag":["4.3 · Registrar reconciliation","4.3 · Reconciliação por registradora"],"mk.3h":["Real share","Share real"],"mk.3q":["What part of each anchor's eligible payables does Citi already cover, vs. peers?","Que parte do contas a pagar elegível de cada âncora o Citi já cobre frente aos pares?"],
    "mk.3s":["Electronic duplicata registrars (B3, CERC, Núclea), anchor payables and internal program volume.","Registradoras de duplicata escritural (B3, CERC, Núclea), contas a pagar e volume interno."],"mk.3o":["Replaces illustrative share-of-wallet rings with measured share.","Substitui os anéis ilustrativos por share medido."],
    "mk.3.sync":["Synced with Step 3 eligible purchases","Sincronizado com compras elegíveis da Etapa 3"],"mk.3.ring.lbl":["Consolidated share (5 anchors)","Share consolidado (5 âncoras)"],"mk.3.ring.note":["Replaces Step 1 illustrative rings once connected to B3, CERC & Núclea registries and internal volume.","Substitui os anéis ilustrativos da Etapa 1 quando conectado a B3, CERC, Núclea e volume interno."],
    "mk.3.lg.citi":["Citi (covered)","Citi (coberto)"],"mk.3.lg.peers":["Peer banks","Bancos pares"],"mk.3.lg.fidc":["FIDCs","FIDCs"],"mk.3.lg.free":["Unfinanced (open headroom)","Não financiado (espaço livre)"],
    "mk.4tag":["4.4 · Credit & infrastructure monitor","4.4 · Monitor de crédito e infraestrutura"],"mk.4h":["External signals","Sinais externos"],"mk.4q":["Are anchor credit and market infrastructure moving for or against us?","O crédito da âncora e a infraestrutura de mercado estão a favor ou contra?"],
    "mk.4s":["Electronic duplicata adoption by anchor, 3Q26 rating/leverage signals and supply-chain stress indicators.","Adesão à duplicata escritural por âncora, rating/alavancagem do 3T26 e sinais de estresse na cadeia."],"mk.4o":["Alerts feeding Step 1 (risk & actions) and Step 3 (credit requests).","Alertas que alimentam a Etapa 1 (risco e ações) e a Etapa 3 (pedido de crédito)."],
    "mk.sf.all":["All signals","Todos os sinais"],"mk.sf.s1":["Feeds Step 1 · Risk","Alimenta Etapa 1 · Risco"],"mk.sf.s3":["Feeds Step 3 · Credit","Alimenta Etapa 3 · Crédito"],"mk.4.feed.lbl":["Actionable alerts routed to cockpit steps","Alertas acionáveis roteados para o cockpit"],
    "mk.note":["Today about 80% of this cockpit is internal program data, 15% internal/3Q26 pipeline and 5% market. The 4 modules below demonstrate the Phase 2 intelligence layer with illustrative feeds ready for live IAS 7/IFRS 7, CVM, BCB and registrar APIs.","Hoje cerca de 80% deste cockpit é dado interno do programa, 15% pipeline interno/3T26 e 5% mercado. Os 4 módulos abaixo entregam a camada de inteligência da Fase 2 com dados ilustrativos prontos para integrações reais de IAS 7/IFRS 7, CVM, BCB e registradoras."],
    "md.lbl":["Local data layer · 100% in-browser","Camada de dados local · 100% no navegador"],"md.h":["Program data and parameters","Dados e parâmetros do programa"],
    "md.p":["Everything on screen is recalculated from the parameters and the weekly table below. Edits are saved only in this browser and are never uploaded anywhere.","Tudo na tela é recalculado a partir dos parâmetros e da tabela semanal abaixo. As alterações ficam salvas só neste navegador e não são enviadas para lugar nenhum."],
    "md.par.h":["Program parameters","Parâmetros do programa"],
    "md.par.p":["Size and pricing of the pilot program, plus the exchange rate of the USD view. Changes apply as you type.","Tamanho e preço do programa piloto, mais o câmbio da visão em dólar. As alterações valem enquanto você digita."],
    "md.spend":["Annual spend in scope (R$ bn)","Compras anuais no escopo (R$ bi)"],"md.base":["Supplier base","Base de fornecedores"],
    "md.tenor":["Pilot average days discounted","Prazo médio antecipado do piloto (dias)"],"md.pspread":["Pilot spread (% p.a.)","Spread do piloto (% a.a.)"],
    "md.fx":["Exchange rate (R$ per US$)","Câmbio (R$ por US$)"],
    "md.par.note":["Pilot tenor and spread drive the pilot balance and revenue in Steps 1 and 2; the Step 3 pipeline keeps its own assumptions. The exchange rate is whatever is typed here: the cockpit does not fetch or check it against any source.","Prazo e spread do piloto movem o saldo e a receita do piloto nas Etapas 1 e 2; o pipeline da Etapa 3 tem premissas próprias. O câmbio é o valor digitado aqui: o cockpit não busca nem confere essa taxa em nenhuma fonte."],
    "md.defaults":["Restore defaults","Restaurar padrões"],
    "md.defaults.t":["Clears the parameters and the weekly data saved in this browser and reloads the example state","Apaga os parâmetros e os dados semanais salvos neste navegador e recarrega o estado de exemplo"],
    "md.wk.h":["Weekly data","Dados semanais"],
    "md.wk.p":["One row per week. Edit the cells and press Apply, or load a CSV with the same columns.","Uma linha por semana. Edite as células e clique em Aplicar, ou carregue um CSV com as mesmas colunas."],
    "md.tpl":["Download CSV","Baixar CSV"],"md.load":["Load CSV","Carregar CSV"],"md.reset":["Reset to example data","Voltar aos dados de exemplo"],
    "md.add":["+ Add week","+ Adicionar semana"],"md.del":["Remove last week","Remover última semana"],"md.apply":["Apply to dashboard","Aplicar ao painel"],"md.discard":["Discard edits","Descartar edições"],
    "md.cols":["CSV columns and validation rules","Colunas do CSV e regras de validação"],"md.col":["Column","Coluna"],"md.mean":["Meaning","Significado"],"md.rule":["Meaning and rule","Significado e regra"],
    "md.grid":["Weekly data editor","Editor dos dados semanais"],
    "mb.lbl":["Monday executive summary","Resumo executivo de segunda-feira"],"mb.h":["Weekly briefing","Briefing semanal"],
    "mb.p":["One page for Monday's meeting: action plan, balance & limit outlook, KPIs and open alerts. Print to PDF or copy plain text for e-mail or Teams.","Uma página para a reunião de segunda: plano de ação, projeção de saldo e limite, indicadores e alertas abertos. Imprima em PDF ou copie o texto para e-mail ou Teams."],
    "mb.print":["Print / save as PDF","Imprimir / salvar em PDF"],"mb.copy":["Copy as text","Copiar como texto"],
    "ft.guard":["<b>Guardrails:</b> built with Legal, Compliance and Risk · bank secrecy (LC 105/2001), LGPD, model validation · client data only aggregated, anonymised or with consent.","<b>Salvaguardas:</b> construído com Jurídico, Compliance e Risco · sigilo bancário (LC 105/2001), LGPD, validação de modelos · dados de clientes apenas agregados, anonimizados ou com consentimento."],
    "ft.by":["Concept by <b>José Edson Matos da Costa</b> · all data illustrative, not Citi data","Conceito de <b>José Edson Matos da Costa</b> · todos os dados são ilustrativos, não são dados do Citi"],
    "dk.title":["SCF cross-sell · Brazil","Cross-sell de risco sacado · Brasil"],"dk.prev":["← Prev","← Anterior"],"dk.next":["Next →","Próximo →"],"dk.close":["Close ✕","Fechar ✕"],
    "pf.cue":["View proof & audit trail ↗","Ver prova e memória de cálculo ↗"],
    "st.set.lbl":["Cockpit settings · Artificial Intelligence","Configurações do cockpit · Inteligência Artificial"],
    "st.set.h":["Anthropic API Key & AI Analysis ON","Chave Anthropic & AI Analysis ON"],
    "st.set.key":["Anthropic API Key (persisted in this browser)","Chave de API Anthropic (persistente neste navegador)"],
    "st.set.show":["Show","Mostrar"],"st.set.model":["AI profile (Anthropic)","Perfil de IA (Anthropic)"],
    "st.set.customOpt":["Custom model ID...","Outro ID personalizado..."],
    "st.set.customLbl":["Custom model ID (optional)","ID de modelo personalizado (opcional)"],
    "st.set.ep":["API endpoint (official Anthropic or custom CORS proxy)","Endpoint da API (padrão oficial Anthropic ou proxy CORS)"],
    "st.set.autoH":["Auto-apply updates (Cockpit + Presentation)","Aplicar atualizações automaticamente (Cockpit + Apresentação)"],
    "st.set.autoP":["When unchecked (recommended), review the Before → After diff and update the cockpit and 17-slide presentation in one click.","Quando desmarcado (recomendado), você revisa o diff Antes → Depois e atualiza cockpit e apresentação com um clique."],
    "st.set.save":["Save settings","Salvar configurações"],"st.set.test":["Test connection","Testar conexão"],
    "st.set.openAi":["Open AI Analysis ON ✦","Abrir AI Analysis ON ✦"],"st.set.clear":["Clear key","Remover chave"],
    "st.set.note":["Stored only in this browser's localStorage and sent directly to Anthropic (/v1/messages) with anthropic-dangerous-direct-browser-access. Compliance guardrail: only aggregated cockpit metrics and public 3Q26 anchor figures are sent — never upload confidential client or supplier PII (LC 105/2001 & LGPD).","Armazenada apenas no localStorage deste navegador e enviada diretamente à Anthropic (/v1/messages) com anthropic-dangerous-direct-browser-access. Salvaguarda: apenas métricas agregadas do cockpit e dados públicos 3T26 são enviados — nunca envie dados sigilosos ou pessoais de clientes/fornecedores (LC 105/2001 e LGPD)."],
    "ai.mod.lbl":["Cross-data intelligence · Steps 1–4 + Presentation (17)","Inteligência cruzada · Etapas 1–4 + Apresentação (17)"],
    "ai.mod.h":["AI Analysis ON · Predictions, Insights & Parameter Optimizer","AI Analysis ON · Predições, Insights & Otimizador de Parâmetros"],
    "ai.mod.undo":["↩ Undo last AI update","↩ Desfazer última atualização IA"],"ai.mod.cfg":["⚙ API key settings","⚙ Configurar chave"],
    "ai.m1.h":["Cross-data & insights","Cruzar dados & insights"],"ai.m1.p":["Crosses Steps 1–4, 3Q26 financials, IAS 7 gaps & external signals.","Cruza Etapas 1–4, balanços 3T26, IAS 7 e sinais externos."],
    "ai.m2.h":["Predictions & stress","Predições & estresse"],"ai.m2.p":["Reviews forecast error, seasonality & approved limit headroom.","Revisa erro de projeção, sazonalidade e limite aprovado."],
    "ai.m3.h":["Optimize parameters","Otimizar parâmetros"],"ai.m3.p":["Proposes updates to tenor, spread, limit, all 5 anchors & presentation.","Propõe ajustes em prazo, spread, limite, 5 âncoras e apresentação."],
    "ai.m4.h":["Executive feedback","Feedback executivo"],"ai.m4.p":["Critical synthesis & Monday action plan for leadership.","Síntese crítica e plano de ação para segunda-feira."],
    "ai.mod.promptLbl":["Additional guidance for AI Analysis ON (optional)","Direcionamento adicional para AI Analysis ON (opcional)"],
    "ai.mod.run":["✦ Run AI Analysis ON","✦ Executar AI Analysis ON"],"ai.mod.abort":["Cancel","Cancelar"]
  };

