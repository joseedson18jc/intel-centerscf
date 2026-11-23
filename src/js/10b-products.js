  // ========== CITI PRODUCT REFERENCE (ported from V13) ==========
  // Faithful summaries of Citi Brasil public product pages and of a 2021 global Citi Commercial Bank article.
  // Not internal data. Do not add conditions the public pages do not state.
  Object.assign(I18N, {
    "pd.lbl":["Product reference · Citi public sources","Referência de produto · fontes públicas do Citi"],
    "pd.h":["Risco sacado and the neighbouring products, as Citi Brasil describes them","O risco sacado e os produtos vizinhos, como o Citi Brasil descreve"],
    "pd.hint":["5 products and 4 published practices · summary of public pages, not internal data","5 produtos e 4 práticas publicadas · resumo de páginas públicas, não é dado interno"],
    "pd.open":["Open","Abrir"],
    "pd.shut":["Collapse","Recolher"]
  });
  const PROD_URL = "https://corporateportal.brazil.citibank.com/produtos-servicos/credito-financiamento/";
  const PROD = [
    {id:"rs", url:PROD_URL + "antecipacao-fornecedor-risco-sacado/", re:/risco sacado(?! esg)|antecipacao a fornecedor|reverse factoring|supplier finance|supply chain finance|\bscf\b/,
      n:["Supplier early payment (Risco Sacado)","Antecipação a Fornecedor de Risco Sacado"], tag:["This cockpit's product","Produto deste painel"], hot:1,
      who:["Contracted by the buyer (the drawee, Citi's client)","Contratado pelo comprador (sacado, cliente do Citi)"],
      d:["Citi pays suppliers (assignors) early on receivables owed by Citi's client (the drawee), through a credit assignment without recourse. Offered in local and foreign currency, subject to prior credit analysis of the client.","O Citi antecipa aos fornecedores (cedentes) os recebíveis devidos pelo cliente do Citi (sacado), por meio de cessão de crédito sem regresso. Disponível em moeda local e estrangeira, sujeito à análise prévia de crédito do cliente."]},
    {id:"esg", url:PROD_URL + "risco-sacado-esg/", re:/\besg\b/,
      n:["Risco Sacado ESG","Risco Sacado ESG"], tag:["Variant of the programme","Variação do programa"], hot:1,
      who:["Clients and suppliers with ESG credentials and targets","Clientes e fornecedores com qualificações e metas ESG"],
      d:["A supply chain financing solution that supports clients and suppliers holding environmental, social and governance (ESG) qualifications and targets.","Solução de financiamento à cadeia produtiva que apoia clientes e fornecedores que possuem qualificações e metas ambientais, sociais e de governança (ESG)."]},
    {id:"dd", url:PROD_URL + "descontos-titulos-duplicatas/", re:/desconto de titulos|descontos? de duplicatas|desconto de duplicata|discounting|discount of receivables/,
      n:["Discount of trade bills (Desconto de Títulos e Duplicatas)","Descontos de Títulos e Duplicatas"], tag:["Neighbouring product","Produto vizinho"],
      who:["Contracted by the selling company, on its own receivables","Contratado pela empresa vendedora, sobre os próprios recebíveis"],
      d:["An advance on receivables from the company's own sales or services. It covers bills already in collection with Citi or sent by electronic file after quotation. Subject to credit analysis and line availability.","Adiantamento dos recebíveis das vendas ou serviços da própria empresa. Vale para títulos já em cobrança no Citi ou enviados por arquivo eletrônico após cotação. Sujeito a análise de crédito e disponibilidade de linha."]},
    {id:"cc", url:PROD_URL + "cessao-credito/", re:/cessao de credito|credit assignment|assignment of receivables/,
      n:["Credit assignment (Cessão de Crédito)","Cessão de Crédito"], tag:["Neighbouring product","Produto vizinho"],
      who:["Contracted by the selling company (assignor)","Contratado pela empresa vendedora (cedente)"],
      d:["Sale of receivables from term sales to the company's partners. It can be done with recourse, without recourse or with partial recourse, as agreed with Citi.","Venda dos recebíveis de vendas a prazo feitas aos parceiros da empresa. Pode ser feita com regresso, sem regresso ou com regresso parcial, conforme acordado com o Citi."]},
    {id:"fi", url:PROD_URL + "fianca/", re:/fianca|guarantee/,
      n:["Bank guarantee (Fiança)","Fiança"], tag:["Neighbouring product","Produto vizinho"],
      who:["Contracted by the company whose obligation is guaranteed","Contratado pela empresa que tem a obrigação garantida"],
      d:["Guarantee letters issued by Citi to cover obligations such as financial obligations, tenders, lawsuits, tax disputes, temporary admission of goods and performance.","Cartas de fiança emitidas pelo Citi para garantir obrigações como as financeiras, licitações, processos judiciais, contestações tributárias, admissão temporária de bens e performance."]}
  ];
  const PRAC = [
    [["Citi reviews the buyer's accounts payable file and segments suppliers by spend, geography, terms and payment instrument.","O Citi analisa o arquivo de contas a pagar do comprador e segmenta os fornecedores por gasto, geografia, prazo e meio de pagamento."],["In the cockpit: the campaign invites suppliers by score, wave by wave.","No painel: a campanha convida fornecedores por score, onda a onda."]],
    [["Suppliers already in SCF programmes of other Citi clients are flagged as likely candidates.","Fornecedores que já participam de programas de SCF de outros clientes do Citi são sinalizados como candidatos prováveis."],["In the cockpit: a candidate lever for the invitation and registration stages, not yet modelled.","No painel: alavanca candidata para as etapas de convite e cadastro, ainda não modelada."]],
    [["The supplier sells receivables at a cost comparable to the buyer's, and chooses when to sell.","O fornecedor vende os recebíveis a um custo comparável ao do comprador, e escolhe quando vender."],["In the cockpit: this is why utilization is tracked separately from the number of active suppliers.","No painel: é por isso que a utilização é acompanhada separada do número de fornecedores ativos."]],
    [["The buyer can extend payment terms (better DPO) while the supplier is paid earlier (better DSO); setting up the programme costs the buyer nothing.","O comprador pode alongar prazos (melhora o DPO) enquanto o fornecedor recebe antes (melhora o DSO); implantar o programa não tem custo para o comprador."],["In the cockpit: the argument behind the anchor pipeline.","No painel: o argumento por trás do pipeline de âncoras."]]
  ];
  let prodLang = null;
  function renderProducts() {
    const box = $("products"); if (!box || prodLang === lang) return;
    prodLang = lang;
    box.innerHTML = `
      <div class="lbl">${T("How Citi Brasil describes it","Como o Citi Brasil descreve")}</div>
      <h4 class="ref-h">${T("Risco sacado and the neighbouring products","O risco sacado e os produtos vizinhos")}</h4>
      <div class="prods">${PROD.map(p => `<div class="prod${p.hot ? " hot" : ""}"><em>${esc(L(p.tag))}</em><b>${esc(L(p.n))}</b><span>${esc(L(p.d))}</span><i>${esc(L(p.who))}</i><a href="${p.url}" target="_blank" rel="noopener noreferrer">${T("Citi page","Página do Citi")} ↗</a></div>`).join("")}</div>
      <div class="fnote">${T("Summaries of Citi Brasil's public product pages, read on 22 Nov 2026. The English text is a free translation. Conditions, pricing and eligibility are defined by Citi case by case.","Resumos das páginas públicas de produto do Citi Brasil, lidas em 22/11/2026. Condições, preço e elegibilidade são definidos pelo Citi caso a caso.")}</div>
      <div class="lbl ref-sep">${T("How Citi describes running an SCF programme","Como o Citi descreve a operação de um programa de SCF")}</div>
      <h4 class="ref-h">${T("Four published practices, and where each shows up here","Quatro práticas publicadas, e onde cada uma aparece aqui")}</h4>
      <div class="pracs">${PRAC.map((x, i) => `<div class="prac"><span class="n">${i + 1}</span><div><b>${esc(L(x[0]))}</b><span>${esc(L(x[1]))}</span></div></div>`).join("")}</div>
      <div class="fnote">${T("Source: “Taking a Holistic View of Supplier Payments”, Citi Commercial Bank, March 2021. It is a global article, not specific to Brazil. The links to the cockpit are this prototype's reading.","Fonte: “Taking a Holistic View of Supplier Payments”, Citi Commercial Bank, março de 2021. É um artigo global, não específico do Brasil. As ligações com o painel são leitura deste protótipo.")}</div>`;
  }
  onRefresh(renderProducts);
  // Answer to a product question, for the assistant. q must already be lower-cased and accent-stripped.
  // Returns an HTML string (<b>, <br>, <small>) in the current language; same routing as V13's ansProducts(q).
  function productAnswer(q) {
    const hit = PROD.filter(p => p.re.test(q));
    const one = p => `<b>${L(p.n)}</b>: ${L(p.d)} ${L(p.who)}.`;
    const src = `<small>${T("Source: Citi Brasil public product pages (summary).","Fonte: páginas públicas de produto do Citi Brasil (resumo).")}</small>`;
    if (/\bdso\b|\bdpo\b|cartao virtual|\bvca\b|contas a pagar|accounts payable/.test(q)) return PRAC.map(x => L(x[0])).join(" ") + `<small>${T("Source: Citi Commercial Bank article, March 2021 (global, not Brazil-specific).","Fonte: artigo do Citi Commercial Bank, março de 2021 (global, não específico do Brasil).")}</small>`;
    if (/diferenca|difference|\bvs\b|versus|compar/.test(q) || hit.length > 1) {
      const set = hit.length > 1 ? hit : PROD.filter(p => ["rs","dd","cc"].includes(p.id));
      return T("The difference lies in who contracts the product and which receivables it covers. ","A diferença está em quem contrata o produto e em quais recebíveis ele cobre. ") + set.map(one).join("<br>") + src;
    }
    if (hit.length === 1) return one(hit[0]) + src;
    return T("Citi Brasil's public pages list these products: ","As páginas públicas do Citi Brasil listam estes produtos: ") + PROD.map(p => `<b>${L(p.n)}</b> (${L(p.tag).toLowerCase()})`).join("; ") + "." + src;
  }

