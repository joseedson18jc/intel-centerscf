  // ========== OPEN FINANCE (ported from V13: SIMULATED connection, no data is sent or received) ==========
  // Topbar button + explanatory modal. The toggle only flips a flag persisted in localStorage "scf-of".
  Object.assign(I18N, {
    "of.h":["Open Finance integration","Integração Open Finance"],
    "of.badge":["Demonstration · simulated connection","Demonstração · conexão simulada"],
    "of.close":["Close","Fechar"],
    "of.p":["With the supplier's consent, Open Finance lets the bank see data it cannot see today. In this version the connection is simulated: no data is sent or received.","Com o consentimento do fornecedor, o Open Finance permite ao banco enxergar dados que hoje ele não vê. Nesta versão a conexão é simulada: nenhum dado é enviado ou recebido."],
    "of.k1":["What the integration would feed in this cockpit","O que a integração alimentaria neste cockpit"],
    "of.k2":["How the connection works","Como a conexão funciona"],
    "of.note":["Concept for discussion. A real integration depends on the bank's Open Finance infrastructure, on each supplier's consent and on the scope of data authorised.","Conceito para discussão. A integração real depende da infraestrutura de Open Finance do banco, do consentimento de cada fornecedor e do escopo de dados autorizado."]
  });
  const OF_ITEMS = [
    [["Supplier share of receivables","Share de recebíveis do fornecedor"],["Credit operations and discounted receivables the supplier holds at other institutions.","Operações de crédito e direitos creditórios descontados que o fornecedor tem em outras instituições."],["Today: estimate","Hoje: estimativa"]],
    [["Who funds each supplier","Quem financia cada fornecedor"],["Consented data replaces the fabricated figures in the competitor view, supplier by supplier.","Dados consentidos substituem os números fabricados da visão de concorrentes, fornecedor a fornecedor."],["Today: fabricated data","Hoje: dados fabricados"]],
    [["Registration and KYC","Cadastro e KYC"],["Registration and account data shared by the supplier's bank, so fewer documents are requested at onboarding.","Dados cadastrais e de conta compartilhados pelo banco do fornecedor, com menos documentos pedidos no cadastro."],["Today: manual upload","Hoje: envio manual"]]
  ];
  const OF_STEPS = [["The supplier receives the consent request with the invitation.","O fornecedor recebe o pedido de consentimento junto com o convite."],["The supplier authorises it in their own bank's app.","Ele autoriza no aplicativo do próprio banco."],["Data arrives through the API, within the authorised scope and period.","Os dados chegam pela API, dentro do escopo e do prazo autorizados."]];
  let ofOn = false; try { ofOn = localStorage.getItem("scf-of") === "1"; } catch (e) {}
  let ofWired = false;
  function renderOF() {
    const btn = $("openOF"), grid = $("of-grid");
    if (btn) {
      const lb = T("Open Finance integration","Integração Open Finance") + (ofOn ? T(" (simulated connection active)"," (conexão simulada ativa)") : T(" (demonstration)"," (demonstração)"));
      btn.setAttribute("aria-label", lb); btn.title = lb; btn.classList.toggle("on", ofOn);
      if ($("of-dot")) $("of-dot").hidden = !ofOn;
    }
    if (!grid) return;
    grid.innerHTML = OF_ITEMS.map(x => `<div class="of-item"><b>${esc(L(x[0]))}</b><span>${esc(L(x[1]))}</span><em>${esc(L(x[2]))}</em></div>`).join("");
    $("of-steps").innerHTML = OF_STEPS.map(x => `<li>${esc(L(x))}</li>`).join("");
    $("of-status").className = "of-status" + (ofOn ? " on" : "");
    $("of-status").textContent = ofOn
      ? T("Simulated connection active. The cockpit keeps running on the demo data.","Conexão simulada ativa. O cockpit continua usando os dados de demonstração.")
      : T("Not connected.","Não conectado.");
    $("of-toggle").textContent = ofOn ? T("Disconnect","Desconectar") : T("Simulate connection","Simular conexão");
  }
  // Registers "m-of" with the shared modal manager of 13-briefing-modals.js (Escape, focus trap, body scroll lock).
  // That module loads after this one, so the registration happens lazily, at the first refresh or first open.
  function ofWire() {
    const m = $("m-of"); if (ofWired || !m) return;
    ofWired = true;
    if (!SIMPLE_MODALS.includes("m-of")) {
      SIMPLE_MODALS.push("m-of");
      m.addEventListener("click", e => { if (e.target === m || e.target.hasAttribute("data-close")) closeSimpleModal(m); });
    }
    const logo = $("of-logo"), img = $("openOF") && $("openOF").querySelector("img");
    if (logo && img && !logo.firstChild) { const c = img.cloneNode(); c.removeAttribute("width"); c.removeAttribute("height"); logo.appendChild(c); }
  }
  if ($("openOF") && $("m-of")) {
    $("openOF").addEventListener("click", () => { ofWire(); renderOF(); openSimpleModal("m-of"); });
    $("of-toggle").addEventListener("click", () => { ofOn = !ofOn; try { localStorage.setItem("scf-of", ofOn ? "1" : "0"); } catch (e) {} renderOF(); });
  }
  onRefresh(() => { ofWire(); renderOF(); });

