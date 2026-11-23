  // ========== DATASET LAYER (STEPS 3 + 4): TWO LABELLED, SWITCHABLE DATASETS ==========
  // q3  = default. Public 3Q26 revenues annualised; market tables are fabricated for the prototype.
  // v13 = earlier set. Public 2025 revenues; market tables are fabricated for the prototype
  //       (annual flow by funder, Citi = 0 at the five pipeline anchors).
  // The pipeline (09) and market (10) modules keep their own containers (ANCHORS, COMP_DATA, ...);
  // applyDataset() refills those containers in place, so every other module reads the active set.
  const DS_NA = ["not in this dataset","fora deste conjunto"];
  const DS_SEV = {green:["Green","Verde"], amber:["Amber","Amarelo"], red:["Red","Vermelho"]};
  const DS_OUT = {"1":["Positive outlook","Perspectiva positiva"], "0":["Stable outlook","Perspectiva estável"], "-1":["Negative outlook","Perspectiva negativa"]};
  // V13 external signals, one per anchor (fabricated): rating, outlook (-1/0/1), e-duplicata adoption %, severity, note.
  const V13_SIG = {
    jbs:{rt:"AAA", out:0, dup:64, sev:"amber", n:["Cattle cycle: margins under pressure in H2","Ciclo do gado: margens pressionadas no 2º semestre"]},
    mbrf:{rt:"AA+", out:-1, dup:48, sev:"red", n:["Post-merger integration: supplier payment terms being renegotiated","Integração pós-fusão: renegociação de prazos com fornecedores"]},
    vot:{rt:"AAA", out:0, dup:71, sev:"green", n:["No relevant events","Sem eventos relevantes"]},
    emb:{rt:"AA", out:1, dup:39, sev:"green", n:["Record order backlog: domestic purchases rising","Carteira de pedidos recorde: compras domésticas em alta"]},
    nat:{rt:"AA-", out:0, dup:55, sev:"amber", n:["Restructuring: supplier base under review","Reestruturação: revisão da base de fornecedores"]},
  };
  const V13_IDS = ["jbs","mbrf","vot","emb","nat"];
  const v13Cls = sev => sev === "red" ? "risk" : sev === "amber" ? "warn" : "pos";

  const DATASETS = {
    q3: {
      id:"q3",
      name:["3Q26 annualized","3T26 anualizado"],
      tag:["Default","Padrão"],
      desc:["Revenue base: 3Q26 releases (Nov 2026), quarter × 4, with Embraer on its 2026 guidance. Market tables: balance by funder (Citi assumed zero, as there is no public information on a Citi program at these anchors), share by registrar, price bands with median and FIDC marks.",
            "Base de receita: balanços do 3T26 (nov/2026), trimestre × 4, com a Embraer pelo guidance de 2026. Tabelas de mercado: saldo por financiador (Citi assumido como zero, pois não há informação pública sobre programa do Citi nessas âncoras), share por registradora, faixas de preço com mediana e marca de FIDC."],
      revTag:["3Q26","3T26"],
      revCardLbl:["3Q26 net revenue & 2026 base (public)","Receita líquida 3T26 & base 2026 (pública)"],
      matrixUnit:"balance",
      ratingPrefix:"br",
      dupLbl:["Duplicata 2027","Duplicata 2027"],
      i18n:{},
      anchors:[
        {id:"jbs", name:"JBS", color:"#C8102E", src:"jbs", q3:116.8, rev:467.2, usd:{q3:22.7, rev:90.8},   // reports in US$: rev = quarter × 4
          q3Note:["3Q26: R$116.8bn (US$22.7bn, +0.6% YoY USD · −5.1% BRL); leverage 3.54× (USD)","3T26: R$ 116,8 bi (US$ 22,7 bi, +0,6% a/a USD · −5,1% BRL); alavancagem 3,54× (USD)"],
          revNote:["3Q26 R$116.8bn (US$22.7bn) → R$467.2bn annualized","3T26 R$ 116,8 bi (US$ 22,7 bi) → R$ 467,2 bi anualizado"],
          addr:2.0, sector:["Protein & food","Proteína e alimentos"],
          look:["Packaging, ingredients, maintenance and industrial services in Brazil.","Embalagens, ingredientes, manutenção e serviços industriais no Brasil."],
          check:["Which group buying entities would join, eligible payables and accepted categories. Monitor 3Q26 leverage (3.54× USD).","Quais compradoras do grupo participariam, contas a pagar elegível e categorias aceitas. Monitorar alavancagem do 3T26 (3,54× USD)."]},
        {id:"mbrf", name:"Marfrig (MBRF)", color:"#006B3F", src:"mbrf", q3:41.424, rev:165.7,
          q3Note:["3Q26: R$41.424bn (−0.8% YoY, +1.7% QoQ); net income R$210m (+123.5%); leverage 3.45×","3T26: R$ 41,424 bi (−0,8% a/a, +1,7% t/t); lucro R$ 210 mi (+123,5%); alavancagem 3,45×"],
          revNote:["3Q26 R$41.424bn → R$165.7bn annualized (post-merger)","3T26 R$ 41,424 bi → R$ 165,7 bi anualizado (pós-fusão)"],
          addr:3.5, sector:["Multi-protein food","Alimentos multiproteína"],
          look:["Recurring suppliers of industrial inputs, packaging and services across combined MBRF entities.","Fornecedores recorrentes de insumos industriais, embalagens e serviços na base combinada MBRF."],
          check:["Post-merger Marfrig + BRF perimeter (net debt R$45.7bn, 3.45× in 3Q26): unify payables and avoid double counting.","Perímetro pós-fusão Marfrig + BRF (dívida líq. R$ 45,7 bi, 3,45× no 3T26): unificar contas a pagar e evitar contagem dupla."]},
        {id:"vot", name:"Votorantim", color:"#0033A0", src:"vot", q3:16.3, rev:65.2,
          q3Note:["3Q26: net revenue R$16.3bn in the holding's economic view (proportional stakes, per the release; +3% YoY; net cash R$8.4bn), a wider perimeter than consolidated revenue · V. Cimentos R$8.5bn (Brazil R$4.2bn, 1.71×)","3T26: receita líquida de R$ 16,3 bi na visão econômica da holding (participações proporcionais, conforme o release; +3% a/a; caixa líq. R$ 8,4 bi), perímetro mais amplo que a receita consolidada · V. Cimentos R$ 8,5 bi (Brasil R$ 4,2 bi, 1,71×)"],
          revNote:["3Q26 net revenue R$16.3bn, holding's economic view (V. Cimentos R$8.5bn) → R$65.2bn annualized","3T26 receita líquida de R$ 16,3 bi, visão econômica da holding (V. Cimentos R$ 8,5 bi) → R$ 65,2 bi anualizado"],
          addr:9.0, sector:["Industrial holding","Holding industrial"],
          look:["Map opportunity by operating company (V. Cimentos, metals, energy), not as one group-level anchor.","Mapear oportunidade por empresa operacional (V. Cimentos, metais, energia), não como âncora única."],
          check:["Which CNPJ buys, which entity holds the Citi relationship and limit, and which units can join.","Qual CNPJ compra, qual entidade tem relacionamento e limite com o Citi e quais unidades podem aderir."]},
        {id:"emb", name:"Embraer", color:"#056DAE", src:"emb", q3:12.067, rev:43.7, usd:{q3:2.347, rev:8.5},   // reports in US$: rev = midpoint of 2026 guidance
          q3Note:["3Q26 record: R$12.067bn (US$2.347bn, +17% YoY USD, 10 Nov 2026); 2026 guidance raised to US$8.4–8.6bn","Recorde 3T26: R$ 12,067 bi (US$ 2,347 bi, +17% a/a USD, 10/nov/2026); guidance 2026 elevado p/ US$ 8,4–8,6 bi"],
          revNote:["3Q26 record R$12.067bn (US$2.347bn) · 2026 guidance US$8.4–8.6bn (≈ R$43.7bn)","Recorde 3T26 R$ 12,067 bi (US$ 2,347 bi) · guidance 2026 US$ 8,4–8,6 bi (≈ R$ 43,7 bi)"],
          addr:8.0, sector:["Aerospace","Aeroespacial"],
          look:["Industrial suppliers, components, engineering and services — domestic receivables separated from exports.","Fornecedores industriais, componentes, engenharia e serviços — separando recebíveis domésticos dos internacionais."],
          check:["Which invoices are already approved and free of acceptance conditions; Q4 delivery ramp drives seasonal peak.","Quais títulos já estão aprovados e livres de condições de aceite; pico de entregas no 4T eleva sazonalidade."]},
        {id:"nat", name:"Natura", color:"#F47920", src:"nat", q3:5.038, rev:20.2,
          q3Note:["3Q26: R$5.038bn (−3.0% YoY; Brazil R$2.920bn, −9%); net income R$49m; leverage 1.83× w/ FIDC inflow","3T26: R$ 5,038 bi (−3,0% a/a; Brasil R$ 2,920 bi, −9%); lucro R$ 49 mi; alavancagem 1,83× com entrada de FIDC"],
          revNote:["3Q26 R$5.038bn (Brazil R$2.920bn) → R$20.2bn annualized","3T26 R$ 5,038 bi (Brasil R$ 2,920 bi) → R$ 20,2 bi anualizado"],
          addr:12.0, sector:["Beauty & personal care","Beleza e cuidados pessoais"],
          look:["Packaging, ingredients, contract manufacturing and recurring B2B services.","Embalagens, ingredientes, fabricação terceirizada e serviços B2B recorrentes."],
          check:["Eligible B2B purchase volume (not consultants or retail); watch Brazil supply availability & active FIDC usage.","Volume de compras B2B elegível (sem confundir com consultoras ou varejo); acompanhar abastecimento Brasil e uso de FIDC."]},
      ],
      funders:[
        {k:"itau", name:"Itaú BBA",        abbr:"IB",  col:"#EC7000", type:"bank"},
        {k:"brad", name:"Bradesco BBI",    abbr:"BR",  col:"#CC092F", type:"bank"},
        {k:"sant", name:"Santander",       abbr:"ST",  col:"#DC0000", type:"bank"},
        {k:"btg",  name:"BTG Pactual",     abbr:"BTG", col:"#001E62", type:"bank"},
        {k:"bb",   name:"Banco do Brasil", abbr:"BB",  col:"#003882", type:"bank"},
        {k:"fidc", name:"FIDCs (CVM)",     abbr:"FD",  col:"#097650", type:"fidc"},
        {k:"citi", name:"Citi",            abbr:"CT",  col:"#056DAE", type:"citi"}
      ],
      // Citi = 0: assumed, there is no public information on a Citi program at these anchors (Step 3 shows a relationship only).
      comp:[
        {id:"jbs", itau:420, brad:310, sant:260, btg:180, bb:290, fidc:240, citi:0, gap:360,
          iasTerms:["90–120d financed vs. 45–60d standard payables (IAS 7 Note · illustrative).","90–120d no risco sacado vs. 45–60d padrão (Nota IAS 7 · ilustrativo)."],
          cvmNote:["3 multi-originator FIDCs active in CVM filings; senior quotas priced around CDI + 1.45%.","3 FIDCs multicedentes ativos na CVM; cotas sênior perto de CDI + 1,45%."],
          play:["Target Brazil packaging & MRO entities where FIDC pricing is wider than bank balance sheet.","Atacar compradoras Brasil de embalagens e MRO onde o FIDC está mais caro que balanço bancário."]},
        {id:"mbrf", itau:280, brad:220, sant:190, btg:140, bb:210, fidc:195, citi:0, gap:250,
          iasTerms:["85–110d financed vs. 45–55d standard; post-merger Marfrig + BRF perimeter under unification.","85–110d no programa vs. 45–55d padrão; perímetro Marfrig + BRF em unificação."],
          cvmNote:["Legacy BRF & Marfrig FIDC pools overlap on packaging suppliers — consolidation window.","FIDCs legados de BRF e Marfrig se sobrepõem em embalagens — janela de consolidação."],
          play:["Propose unified post-merger onboarding with Document AI to win consolidated CNPJs.","Propor onboarding unificado pós-fusão com IA de documentos para capturar CNPJs consolidados."]},
        {id:"vot", itau:240, brad:195, sant:150, btg:110, bb:130, fidc:120, citi:0, gap:280,
          iasTerms:["75–105d across cement, metals & energy operating companies (decentralized notes).","75–105d nas operacionais de cimento, metais e energia (notas descentralizadas)."],
          cvmNote:["Selective FIDC usage in mid-tier subsidiaries; flagship V. Cimentos relies on core banks.","Uso seletivo de FIDCs em subsidiárias médias; V. Cimentos opera com bancos principais."],
          play:["Map buying CNPJs unit by unit and pitch expansion to 2 under-served operating companies.","Mapear CNPJs compradores por unidade e propor expansão em 2 operacionais subatendidas."]},
        {id:"emb", itau:145, brad:95, sant:110, btg:60, bb:120, fidc:55, citi:0, gap:165,
          iasTerms:["60–90d domestic industrial payables; export flows separated. Record 3Q26 R$12.067bn.","60–90d em compras industriais domésticas; exportação separada. Recorde 3T26 R$ 12,067 bi."],
          cvmNote:["Low FIDC reliance — preference for Tier-1 relationship banks with global trade capabilities.","Baixa dependência de FIDC — preferência por bancos Tier-1 com atuação global em trade."],
          play:["Differentiate with fast invoice-approval integration ahead of Q4 seasonal delivery peak.","Diferenciar com integração rápida de aceite antes do pico sazonal de entregas no 4T."]},
        {id:"nat", itau:125, brad:110, sant:90, btg:85, bb:50, fidc:140, citi:0, gap:145,
          iasTerms:["75–105d on B2B packaging, fragrances & contract manufacturing suppliers.","75–105d para fornecedores B2B de embalagens, fragrâncias e manufatura terceirizada."],
          cvmNote:["Active FIDC usage helped cut 3Q26 leverage to 1.83×; fast onboarding attracts mid-sized suppliers.","Uso ativo de FIDC ajudou a reduzir alavancagem 3T26 p/ 1,83×; cadastro ágil atrai médios."],
          play:["Win back FIDC-funded B2B suppliers via competitive CDI spread + frictionless Document AI.","Reconquistar fornecedores B2B financiados em FIDC combinando spread competitivo + IA de docs."]}
      ],
      tiers:[
        {code:"AAA", anchors:["vot","emb"], min:0.75, med:1.05, max:1.35, fidc:1.30},
        {code:"AA+", anchors:["jbs"],       min:0.95, med:1.25, max:1.60, fidc:1.45},
        {code:"AA",  anchors:["mbrf"],      min:1.15, med:1.50, max:1.95, fidc:1.75},
        {code:"AA-", anchors:["nat"],       min:1.35, med:1.75, max:2.25, fidc:2.05}
      ],
      rmLoss:[
        {lbl:["Spread / rate vs. peers & FIDCs","Spread / taxa vs. pares e FIDCs"], pct:42, col:() => C.navy},
        {lbl:["Onboarding & KYC friction","Atrito no cadastro e KYC"],            pct:26, col:() => C.red},
        {lbl:["Credit limit or tenor cap","Limite de crédito ou teto de prazo"],  pct:19, col:() => C.blue},
        {lbl:["ERP / registry integration lead time","Prazo de integração ERP / registradora"], pct:13, col:() => C.amber}
      ],
      share:[
        {id:"jbs",  citi:0,  peers:44, fidc:14, free:42, reg:"b3",     regPct:78},
        {id:"mbrf", citi:0,  peers:42, fidc:17, free:41, reg:"cerc",   regPct:71},
        {id:"vot",  citi:0,  peers:39, fidc:11, free:50, reg:"b3",     regPct:66},
        {id:"emb",  citi:0,  peers:40, fidc:8,  free:52, reg:"nuclea", regPct:82},
        {id:"nat",  citi:0,  peers:35, fidc:22, free:43, reg:"cerc",   regPct:69}
      ],
      pilotOthers:null,
      health:[
        {id:"jbs",  rating:"brAA+", outlook:["Stable","Estável"],   outCls:"pos", reg:"b3",     dupPct:78, stress:["Moderate","Moderado"],stCls:"neu", net:["Balanced","Equilibrado"],netCls:"neu"},
        {id:"mbrf", rating:"brAA",  outlook:["Positive","Positiva"],outCls:"pos", reg:"cerc",   dupPct:71, stress:["Moderate","Moderado"],stCls:"neu", net:["Tailwind","A favor"],   netCls:"pos"},
        {id:"vot",  rating:"brAAA", outlook:["Stable","Estável"],   outCls:"pos", reg:"b3",     dupPct:66, stress:["Low","Baixo"],        stCls:"pos", net:["Strong","Forte"],       netCls:"pos"},
        {id:"emb",  rating:"brAAA", outlook:["Positive","Positiva"],outCls:"pos", reg:"nuclea", dupPct:82, stress:["Low","Baixo"],        stCls:"pos", net:["Strong","Forte"],       netCls:"pos"},
        {id:"nat",  rating:"brAA−", outlook:["Watch","Observação"], outCls:"warn",reg:"cerc",   dupPct:69, stress:["Elevated","Atenção"], stCls:"warn",net:["Selective","Cautela"],  netCls:"warn"}
      ],
      // Each q3 signal keeps public facts and invented content apart: pub:true marks a title quoted from the 3Q26 releases
      // (as entered by the author); bodyFab:true marks a body that is an invented scenario; other bodies are the prototype's reading.
      signals:[
        {id:"emb", route:"step3", sev:"green", sources:["nuclea","bcb"], pub:true, bodyFab:true,
          title:["Record 3Q26 revenue (R$12.067bn); 2026 guidance raised to US$8.4–8.6bn of revenue and at least US$700m of adjusted free cash flow","Receita recorde no 3T26 (R$ 12,067 bi); guidance 2026 elevado para US$ 8,4–8,6 bi de receita e fluxo de caixa livre ajustado de pelo menos US$ 700 mi"],
          body:["If 82% of the anchor's payables were ready for electronic duplicata at Núclea, as in this invented scenario, the credit case for a larger limit would be strong.","Se 82% do contas a pagar da âncora estivesse pronto para a duplicata escritural na Núclea, como neste cenário inventado, o caso de crédito para ampliar o limite seria forte."]},
        {id:"nat", route:"step1", sev:"amber", sources:["cerc","cvm"], pub:true,
          title:["3Q26 Brazil sales −9% (R$2.920bn); net income R$49m; leverage down to 1.83× with FIDC inflow","Vendas Brasil −9% no 3T26 (R$ 2,920 bi); lucro de R$ 49 mi; alavancagem em 1,83× com entrada de FIDC"],
          body:["Prototype reading: with Brazil supply under watch, check supplier cadence before scaling a second supplier wave.","Leitura do protótipo: com o abastecimento no Brasil em observação, conferir a cadência dos fornecedores antes de ampliar para uma segunda onda."]},
        {id:"mbrf", route:"step3", sev:"blue", sources:["cerc","cvm"], pub:true,
          title:["3Q26 net income +123.5% (R$210m) on R$41.424bn revenue; leverage 3.45×; net debt R$45.7bn","Lucro +123,5% no 3T26 (R$ 210 mi) com receita de R$ 41,424 bi; alavancagem de 3,45×; dívida líquida de R$ 45,7 bi"],
          body:["Prototype reading: unifying Marfrig + BRF payables after the merger may open room against legacy FIDCs; size the credit request against the net debt.","Leitura do protótipo: unificar o contas a pagar de Marfrig + BRF após a fusão pode abrir espaço frente a FIDCs legados; calibrar o pedido de crédito pela dívida líquida."]},
        {id:"jbs", route:"step3", sev:"amber", sources:["b3","cvm"], pub:true, bodyFab:true,
          title:["3Q26 revenue R$116.8bn (US$22.7bn); leverage 3.54× (USD); adjusted EBITDA margin 5.2% under cattle-cost pressure; Beef North America back to positive EBITDA","Receita 3T26 de R$ 116,8 bi (US$ 22,7 bi); alavancagem de 3,54× (USD); margem EBITDA ajustada de 5,2%, pressionada pelo custo do gado; Beef América do Norte voltou ao EBITDA positivo"],
          body:["If 78% of its invoices were registered at B3, as in this invented scenario, collateral checks for a credit request would be simpler.","Se 78% das duplicatas estivessem registradas na B3, como neste cenário inventado, a verificação de lastro para o pedido de crédito ficaria mais simples."]},
        {id:"vot", route:"step1", sev:"green", sources:["b3","bcb"], pub:true,
          title:["3Q26: holding net cash R$8.4bn; V. Cimentos revenue R$8.5bn and leverage 1.71×","3T26: caixa líquido da holding de R$ 8,4 bi; V. Cimentos com receita de R$ 8,5 bi e alavancagem de 1,71×"],
          body:["Prototype reading: stage supplier campaigns by CNPJ/unit, starting where ERP integration with a registrar is done (integration status unknown, to be checked).","Leitura do protótipo: fatiar campanhas com fornecedores por CNPJ/unidade, começando onde a integração do ERP com a registradora estiver pronta (status desconhecido, a conferir)."]},
        {id:"jbs", route:"step1", sev:"red", sources:["b3","cerc"],
          title:["Invented scenario: cross-registrar double-pledge check across B3 and CERC","Cenário inventado: checagem de duplicidade entre B3 e CERC"],
          body:["If interoperability between registrars flagged invoices already assigned to FIDCs, the alert would feed the Step 1 duplicate-invoice alerts. Nothing here describes JBS's actual invoices.","Se a interoperabilidade entre registradoras sinalizasse duplicatas já cedidas a FIDCs, o alerta alimentaria os alertas de duplicidade da Etapa 1. Nada aqui descreve duplicatas reais da JBS."]}
      ],
      // Per-anchor credit signal read by the action plan (derived from the health table above: no red signal in this set).
      sig:{jbs:{sev:"green"}, mbrf:{sev:"green"}, vot:{sev:"green"}, emb:{sev:"green"}, nat:{sev:"amber"}}
    },

    v13: {
      id:"v13",
      name:["2025 full year","Ano de 2025"],
      tag:["Earlier set","Conjunto anterior"],
      desc:["Revenue base: reported 2025 net revenue. Market tables: annual flow by funder; Citi has a public relationship with the five anchors but there is no public information on a program, so its cells are assumed zero and the gap shows as white space.",
            "Base de receita: receita líquida divulgada de 2025. Tabelas de mercado: fluxo anual por financiador; o Citi tem relacionamento público com as cinco âncoras, mas não há informação pública sobre programa, por isso suas células são assumidas como zero e a diferença aparece como espaço livre."],
      revTag:["2025","2025"],
      revCardLbl:["2025 net revenue (public)","Receita líquida 2025 (pública)"],
      matrixUnit:"flow",
      ratingPrefix:"",
      dupLbl:["E-duplicata adoption","Duplicata escritural"],
      i18n:{
        "sec.pipe.n":["Public 2025 revenues + editable working hypotheses","Receitas públicas de 2025 + hipóteses editáveis"],
        "pp.intro":["All five were named as Brazilian clients by Citi's Corporate Banking heads (Bloomberg Línea, Jul 2025). That shows a relationship, not an active supplier-finance program, an approved limit or eligible volume. Eligible purchases are approximated as public 2025 net revenue × an addressable share; that share and every percentage after it are editable working hypotheses, to be replaced with each account's payables data.",
                    "As cinco foram citadas como clientes brasileiras pelos responsáveis do Corporate Banking do Citi (Bloomberg Línea, jul/2025). Isso mostra relacionamento, não programa de risco sacado ativo, limite aprovado nem volume elegível. As compras elegíveis são aproximadas pela receita líquida pública de 2025 × uma parcela endereçável; essa parcela e todos os percentuais seguintes são hipóteses de trabalho editáveis, a substituir pelo contas a pagar de cada conta."],
        "pp.th.revenue":["2025 net revenue","Receita líquida 2025"],
        "pp.cards.h":["Anchor qualification snapshots (2025)","Fichas rápidas por âncora (2025)"],
        "st.3.desc":["Prioritize 5 anchors (2025 public revenues), edit hypotheses and size credit & revenue.","Priorizar 5 âncoras (receitas públicas de 2025), editar hipóteses e estimar crédito e receita."],
        "st.4.desc":["Funder matrix, CDI+x benchmark, share of eligible payables and external signals (fabricated figures).","Matriz de financiadores, benchmark CDI+x, share do contas a pagar elegível e sinais externos (números fabricados)."],
        "mk.m2":["~15% public 2025 revenues × working hypotheses","~15% receitas públicas de 2025 × hipóteses de trabalho"],
        "mk.1o":["Anchor × funder matrix with estimated annual flow.","Matriz âncora × financiador com fluxo anual estimado."],
        "mk.2.lg.band":["Market band (middle half of quotes)","Faixa de mercado (metade central das cotações)"],
        "mk.4s":["Electronic duplicata adoption by anchor, agency ratings and outlook changes for each obligor, supply-chain stress news.","Adesão à duplicata escritural por âncora, rating e perspectiva de cada sacado, notícias de estresse na cadeia."],
        "mk.note":["In this prototype, about 80% of the figures are pilot program data (example data unless you load your own file under Data), about 15% are public 2025 revenues multiplied by working hypotheses and about 5% is a fabricated market. The split is a rough indication, not a measurement. In a real deployment, the 4 modules below would draw on the anchors' financial statement notes on supplier finance (IAS 7 / IFRS 7), FIDC reports filed with the CVM, BCB statistics and the receivables registrars.",
                   "Neste protótipo, cerca de 80% dos números são dados do programa piloto (dados de exemplo, a menos que você carregue seu próprio arquivo em Dados), cerca de 15% são receitas públicas de 2025 multiplicadas por hipóteses de trabalho e cerca de 5% é mercado fabricado. A divisão é uma indicação aproximada, não uma medição. Em uma implantação real, os 4 módulos abaixo seriam alimentados pelas notas explicativas das âncoras sobre risco sacado (IAS 7 / IFRS 7), pelos informes de FIDC na CVM, pelas estatísticas do BCB e pelas registradoras de recebíveis."]
      },
      anchors:[
        {id:"jbs", name:"JBS", color:"#C8102E", src:"jbs25", q3:null, rev:450, usd:{rev:86.2},   // reports in US$
          revNote:["US$86.2bn ≈ R$450bn","US$ 86,2 bi ≈ R$ 450 bi"],
          addr:2.0, sector:["Protein & food","Proteína e alimentos"],
          look:["Packaging, ingredients, maintenance and industrial services.","Embalagens, ingredientes, manutenção e serviços industriais."],
          check:["Which group buying entities would join, the eligible payables and the supplier categories accepted. Most revenue is generated abroad.","Quais compradoras do grupo participariam, o contas a pagar elegível e as categorias aceitas. A maior parte da receita é gerada fora do Brasil."]},
        {id:"mbrf", name:"Marfrig (MBRF)", color:"#006B3F", src:"mbrf25", q3:null, rev:164.0,
          revNote:["R$164.0bn, post-merger","R$ 164,0 bi, pós-fusão"],
          addr:3.5, sector:["Multi-protein food","Alimentos multiproteína"],
          look:["Recurring suppliers of industrial inputs, packaging and services.","Fornecedores recorrentes de insumos industriais, embalagens e serviços."],
          check:["Marfrig and BRF completed their merger into MBRF in Sep 2025: confirm the account perimeter and avoid counting the same volume twice.","Marfrig e BRF concluíram a fusão na MBRF em set/2025: confirmar o perímetro da conta e evitar contar o mesmo volume duas vezes."]},
        {id:"vot", name:"Votorantim", color:"#0033A0", src:"vot25", q3:null, rev:47.6,
          revNote:["R$47.6bn consolidated net revenue (a narrower perimeter than the holding's economic view used in the 3Q26 set)","R$ 47,6 bi de receita líquida consolidada (perímetro menor que a visão econômica da holding usada no conjunto 3T26)"],
          addr:12, sector:["Industrial holding","Holding industrial"],
          look:["Map the opportunity by operating company, not as one group-level anchor.","Mapear a oportunidade por empresa operacional, não como uma única âncora do grupo."],
          check:["Which CNPJ buys, which entity holds the Citi relationship and limit, and which units can join.","Qual CNPJ compra, qual entidade tem relacionamento e limite com o Citi e quais unidades podem aderir."]},
        {id:"emb", name:"Embraer", color:"#056DAE", src:"emb25", q3:null, rev:41.9,
          revNote:["R$41.9bn, record","R$ 41,9 bi, recorde"],
          addr:8, sector:["Aerospace","Aeroespacial"],
          look:["Industrial suppliers, components, engineering and services, with domestic receivables separated from international ones.","Fornecedores industriais, componentes, engenharia e serviços, separando recebíveis domésticos dos internacionais."],
          check:["Which invoices are already approved and free of acceptance conditions that would block discounting.","Quais títulos já estão aprovados e livres de condições de aceite que impeçam a antecipação."]},
        {id:"nat", name:"Natura", color:"#F47920", src:"nat25", q3:null, rev:22.2,
          revNote:["R$22.2bn (Brazil R$13.4bn)","R$ 22,2 bi (Brasil R$ 13,4 bi)"],
          addr:12, sector:["Beauty & personal care","Beleza e cuidados pessoais"],
          look:["Packaging, ingredients, contract manufacturing and recurring services.","Embalagens, ingredientes, fabricação e serviços recorrentes."],
          check:["The eligible B2B purchase volume, not to be confused with consultants, resellers or consumer receivables.","O volume de compras B2B elegível, sem confundir com consultoras, revendedoras ou recebíveis de consumidores."]}
      ].map(a => Object.assign(a, {q3Note:a.revNote})),   // other modules read q3Note; in this set it is the 2025 note
      funders:[
        {k:"itau", name:"Itaú BBA",        abbr:"IB", col:"#EC7000", type:"bank"},
        {k:"bb",   name:"Banco do Brasil", abbr:"BB", col:"#003882", type:"bank"},
        {k:"brad", name:"Bradesco",        abbr:"BR", col:"#CC092F", type:"bank"},
        {k:"sant", name:"Santander",       abbr:"ST", col:"#DC0000", type:"bank"},
        {k:"fidc", name:["FIDCs & fintechs","FIDCs e fintechs"], abbr:"FD", col:"#097650", type:"fidc"},
        {k:"citi", name:"Citi",            abbr:"CT", col:"#056DAE", type:"citi"}
      ],
      // Annual flow funded, BRL million (V13 matrix MX × 1000). Citi = 0: assumed, no public information on a program.
      // btg is not part of this set; it stays 0 only so sums written for the default set do not break. gap = white space, recomputed on render.
      comp:[
        {id:"jbs",  citi:0, itau:2100, bb:1400, brad:700, sant:600, fidc:1100, btg:0, gap:0},
        {id:"mbrf", citi:0, itau:1200, bb:1500, brad:500, sant:0,   fidc:1000, btg:0, gap:0},
        {id:"vot",  citi:0, itau:1000, bb:400,  brad:300, sant:900, fidc:300,  btg:0, gap:0},
        {id:"emb",  citi:0, itau:300,  bb:200,  brad:200, sant:800, fidc:100,  btg:0, gap:0},
        {id:"nat",  citi:0, itau:900,  bb:300,  brad:400, sant:0,   fidc:600,  btg:0, gap:0}
      ],
      // Price bands by rating (V13 BAND). No median or FIDC mark in this set.
      tiers:[
        {code:"AAA", anchors:["jbs","vot"], min:0.55, med:null, max:0.95, fidc:null},
        {code:"AA+", anchors:["mbrf"],      min:0.75, med:null, max:1.15, fidc:null},
        {code:"AA",  anchors:["emb"],       min:0.90, med:null, max:1.35, fidc:null},
        {code:"AA-", anchors:["nat"],       min:1.05, med:null, max:1.55, fidc:null}
      ],
      rmLoss:[],
      share:null,                                        // computed from comp vs. Step 3 eligible purchases
      pilotOthers:{itau:1000, fidc:400},                 // V13 PILOT_OTHERS, BRL million of annual flow
      health:V13_IDS.map(id => { const s = V13_SIG[id]; return {id, rating:s.rt, outlook:DS_OUT[String(s.out)], outCls:s.out > 0 ? "pos" : s.out < 0 ? "risk" : "neu",
        reg:null, dupPct:s.dup, stress:DS_NA, stCls:"na", net:DS_SEV[s.sev], netCls:v13Cls(s.sev), note:s.n}; }),
      signals:V13_IDS.map(id => { const s = V13_SIG[id], o = DS_OUT[String(s.out)]; return {id, route:"step3", sev:s.sev, sources:[], title:s.n,
        body:[`Rating ${s.rt.replace("-", "−")}, ${o[0].toLowerCase()}. Electronic duplicata adoption: ${s.dup}%.` + (s.sev === "red" ? " Red signal: feeds the action plan (hold the credit request)." : ""),
              `Rating ${s.rt.replace("-", "−")}, ${o[1].toLowerCase()}. Adesão à duplicata escritural: ${s.dup}%.` + (s.sev === "red" ? " Sinal vermelho: alimenta o plano de ação (segurar o pedido de crédito)." : "")]}; }),
      sig:Object.fromEntries(V13_IDS.map(id => [id, {sev:V13_SIG[id].sev, note:V13_SIG[id].n, out:DS_OUT[String(V13_SIG[id].out)]}]))
    }
  };

  const dsHas = id => typeof id === "string" && Object.prototype.hasOwnProperty.call(DATASETS, id);   // not fooled by "constructor", "__proto__"
  let datasetId = (() => { try { const v = localStorage.getItem("scf-dataset"); return dsHas(v) ? v : "q3"; } catch (e) { return "q3"; } })();
  const DS = () => DATASETS[datasetId];
  const dsRefill = (arr, from) => { arr.length = 0; (from || []).forEach(x => arr.push(x)); return arr; };
  // Per-anchor credit signal of the active dataset: {sev:"green"|"amber"|"red", note?, out?}
  const sigOf = id => DS().sig[id] || {sev:"green"};
  // Company revenue in the USD view: a company that reports in US dollars (a.usd) shows the dollar figure it published,
  // as entered by the author, instead of reais converted at the panel rate. k = "rev" (annual base) or "q3" (quarter).
  const revRep = (a, k = "rev") => ccy === "USD" && a.usd && a.usd[k] != null ? a.usd[k] : null;
  function revFmt(a, k = "rev", d = 1) { const r = revRep(a, k); return r != null ? sym() + nf(r, d) + (lang === "pt" ? " bi" : "bn") : bn(a[k], d); }
  // Sum of the revenue bases as shown, in BRL-equivalent units so it can go through bn().
  const revTotal = () => ANCHORS.reduce((s, a) => { const r = revRep(a); return s + (r != null ? r * fx() : a.rev); }, 0);
  // English labels for the source links (09-pipeline.js SRC keeps the Portuguese ones).
  const SRC_EN = {linea:"Bloomberg Línea, 8 Jul 2025", jbs:"JBS IR · 3Q26 (9 Nov 2026)", mbrf:"MBRF IR · 3Q26 (12 Nov 2026)", vot:"Votorantim / V. Cimentos · 3Q26 (Nov 2026)",
    emb:"Embraer · 3Q26 (10 Nov 2026)", nat:"Natura IR · 3Q26 (Nov 2026)", merger:"InfoMoney · MBRF merger", copom:"BCB · Copom minutes 282 (Nov 2026)",
    selic:"Copom holds the Selic at 13.75%", b3:"B3 · Duplicatas e-book", dup:"Electronic duplicata timeline", fidc:"NeoFeed · risco sacado in FIDCs", ref:"BCB · Financial Stability Report, May 2023"};
  const srcLbl = (k, pt) => lang === "en" && SRC_EN[k] ? SRC_EN[k] : pt;

  Object.assign(I18N, {
    "ds.lbl":["Dataset for Steps 3 and 4","Conjunto de dados das Etapas 3 e 4"],
    "ds.fab.badge":["Fabricated figures","Números fabricados"],
    "ds.fab.banner":["Real institution names, fabricated figures: amounts, ratings and signals do not describe actual funding relationships.","Nomes reais, números fabricados: valores, ratings e sinais não representam relações reais de financiamento."],
    "ds.fab.tag":["Fabricated","Fabricado"],
    "ds.aria.mix":["About 80% pilot program data, 15% public revenues × hypotheses, 5% fabricated market","Cerca de 80% dados do programa piloto, 15% receitas públicas × hipóteses, 5% mercado fabricado"],
    "ds.aria.mods":["Market modules","Módulos de mercado"],
    "ds.aria.ring":["Consolidated share of eligible payables","Share consolidado do contas a pagar elegível"]
  });

  // Dataset-specific wording for existing data-i18n keys: the default set keeps the base dictionary text.
  const DS_I18N_KEYS = Object.keys(DATASETS.v13.i18n);
  DS_I18N_KEYS.forEach(k => { if (I18N[k]) DATASETS.q3.i18n[k] = I18N[k]; });
  function dsApplyI18n() {
    Object.assign(I18N, DS().i18n);
    document.querySelectorAll("[data-i18n]").forEach(e => { const k = e.dataset.i18n; if (DS_I18N_KEYS.includes(k) && I18N[k]) e.textContent = L(I18N[k]); });
  }
  Object.assign(I18N, DS().i18n);

  function renderDatasetBars() {
    const d = DS();
    const btn = k => { const x = DATASETS[k]; return `<button type="button" data-ds="${k}" aria-pressed="${k === datasetId}">${esc(L(x.name))}<small>${esc(L(x.tag))}</small></button>`; };
    const html = `<div class="ds-row">
        <div class="ds-pick"><span class="ds-lbl">${esc(L(I18N["ds.lbl"]))}</span>
          <div class="ds-switch" role="group" aria-label="${esc(L(I18N["ds.lbl"]))}">${Object.keys(DATASETS).map(btn).join("")}</div></div>
        <p class="ds-desc"><b>${T("Active","Ativo")}: ${esc(L(d.name))}.</b> ${esc(L(d.desc))} <span class="ds-hint">${T("Switching keeps the percentages you edited; untouched addressable shares follow the selected set.","A troca mantém os percentuais que você editou; parcelas endereçáveis não alteradas seguem o conjunto escolhido.")}</span></p>
      </div>
      <ul class="ds-status">
        <li><span class="ds-chip pub">${T("Public · not checked live","Público · sem checagem ao vivo")}</span>${T("Company revenues are public figures quoted from the linked sources; this page does not verify them live.","As receitas das empresas são números públicos citados das fontes indicadas; esta página não os verifica ao vivo.")}</li>
        <li><span class="ds-chip fab">${esc(L(I18N["ds.fab.tag"]))}</span>${T("Everything in the market module (funder amounts, shares, price bands, ratings and signals) is fabricated for the prototype, in both datasets.","Tudo no módulo de mercado (valores por financiador, shares, faixas de preço, ratings e sinais) é fabricado para o protótipo, nos dois conjuntos.")}</li>
      </ul>`;
    document.querySelectorAll("[data-ds-bar]").forEach(e => { e.innerHTML = html; });
  }
  document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-ds]"); if (b && b.closest("[data-ds-bar]")) setDataset(b.dataset.ds); });
  onRefresh(renderDatasetBars);

  // Swap the data used by the pipeline and the four market modules, then re-render everything that reads it.
  function setDataset(id, persist = true) {
    if (!dsHas(id) || id === datasetId) { renderDatasetBars(); return; }
    const prevAddr = DS().anchors.map(a => a.addr);
    datasetId = id;
    if (persist) { try { localStorage.setItem("scf-dataset", id); } catch (e) {} }
    dsApplyI18n();
    dsRefill(ANCHORS, DS().anchors);
    // Inputs the user has not edited follow the new defaults (only the addressable share differs between sets).
    ANCHORS.forEach((a, i) => { if (P[i].addr === prevAddr[i]) P[i].addr = a.addr; });
    loadMarketDataset();
    renderDatasetBars();
    renderPipeline(); renderMarket(); render(week);
    if (typeof deck !== "undefined" && deck && !deck.hidden && typeof renderSlide === "function") renderSlide();
    if ($("m-brief") && !$("m-brief").hidden && $("brief-body") && typeof briefHTML === "function") $("brief-body").innerHTML = briefHTML();
    touch();
  }
