  // ========== CSV DATA LAYER (FIXED SMART DECIMAL PARSER + ZERO XSS) ==========
  const COLS = [
    ["semana","week","Week number","Número da semana"],
    ["gasto_pct","spend","Spend under program, % of in-scope spend","Gasto sob o programa, % das compras no escopo"],
    ["ativos","active","Active suppliers","Fornecedores ativos"],
    ["utilizacao_pct","util","Utilization, %","Utilização, %"],
    ["dias_1o_desconto","days","Days to first discount","Dias até o 1º desconto"],
    ["erro_proj_pct","err","One-week forecast error, %","Erro da projeção de 1 semana, %"],
    ["share_wallet_pct","sow","Anchor share of wallet, %","Share of wallet da âncora, %"],
    ["alertas","flags","Open risk flags","Alertas de risco abertos"],
    ["share_recebiveis_pct","supShare","Supplier share of receivables, %","Share de recebíveis do fornecedor, %"]
  ];
  let SRCINFO = null;
  function parseLocaleNumber(raw, sep) {
    let s = raw.trim().replace(/^["']|["']$/g, "");
    if (!s) return NaN;
    if (sep === ";") {
      // Only strip dots when clearly a thousands separator (e.g. 1.234 or 1.234,56), never corrupting 9.8 -> 98!
      if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
      else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    } else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) {
      s = s.replace(/,/g, "");
    }
    return parseFloat(s);
  }
  function parseCSV(text) {
    const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 3) throw T("The file needs a header and at least 2 weeks.","O arquivo precisa de cabeçalho e pelo menos 2 semanas.");
    const sep = lines[0].includes(";") ? ";" : ",";
    const splitRow = ln => ln.split(sep).map(s => s.trim().replace(/^"|"$/g, ""));
    const head = splitRow(lines[0]).map(s => s.toLowerCase());
    const idx = COLS.slice(1).map(([pt, en]) => { const j = head.findIndex(x => x === pt || x === en.toLowerCase()); if (j < 0) throw T(`Missing column: ${pt}`,`Coluna ausente: ${pt}`); return j; });
    const out = {}; COLS.slice(1).forEach(([, k]) => out[k] = []);
    lines.slice(1).forEach((ln, r) => {
      const cells = splitRow(ln);
      COLS.slice(1).forEach(([pt, k], c) => {
        const raw = cells[idx[c]] || "";
        const v = parseLocaleNumber(raw, sep);
        if (!isFinite(v) || v < 0) throw T(`Row ${r + 2}, column ${pt}: "${raw}" is not valid.`,`Linha ${r + 2}, coluna ${pt}: "${raw}" não é um número válido.`);
        if (/_pct$/.test(pt) && v > 100) throw T(`Row ${r + 2}, column ${pt}: must be 0–100.`,`Linha ${r + 2}, coluna ${pt}: percentual deve ficar entre 0 e 100.`);
        out[k].push(v);
      });
    });
    if (out.spend.length > 52) throw T("Up to 52 weeks per file.","No máximo 52 semanas por arquivo.");
    if (out.spend.some((s, i) => s <= 0 || out.util[i] <= 0)) throw T("Spend and utilization must be > 0 in every week.","Gasto e utilização precisam ser > 0 em todas as semanas.");
    return out;
  }
  function applyData(obj, info, spendBn = 6.0, baseSup = 300) {
    COLS.slice(1).forEach(([, k]) => { D[k] = obj[k].slice(); });
    W = D.spend.length; SPEND = spendBn * 1000; BASE_SUP = baseSup;
    recomputeBook();
    $("slider").max = W; $("tk-end").textContent = WL() + W;
    $("cfg-spend").value = (SPEND / 1000).toFixed(1); $("cfg-base").value = BASE_SUP;
    SRCINFO = info; srcChip(); updateCcyTexts(); buildKpis(); render(W);
  }
  function srcChip() {
    const c = $("src-chip"); c.classList.toggle("live", !!SRCINFO);
    $("src-txt").textContent = SRCINFO
      ? T(`Source: ${SRCINFO.name} · ${W} weeks · loaded ${SRCINFO.at}`,`Fonte: ${SRCINFO.name} · ${W} semanas · carregado em ${SRCINFO.at}`)
      : T("Source: demo data · click to load your CSV","Fonte: dados de demonstração · clique p/ carregar CSV");
  }
  function toCSV() {
    const rows = [COLS.map(c => c[0]).join(";")];
    for (let i = 0; i < W; i++) rows.push([i + 1, ...COLS.slice(1).map(([, k]) => String(D[k][i]).replace(".", ","))].join(";"));
    return rows.join("\n");
  }
  const dmsg = (t, ok) => { const m = $("data-msg"); m.textContent = t; m.className = ok ? "ok" : "err"; };
  $("d-tpl").onclick = () => {
    const url = URL.createObjectURL(new Blob(["\uFEFF" + toCSV()], {type:"text/csv;charset=utf-8"}));
    const a = document.createElement("a"); a.href = url; a.download = "scf_cockpit_semanal.csv"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  $("d-file").onchange = e => {
    const file = e.target.files[0]; if (!file) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const obj = parseCSV(rd.result);
        const sp = Math.max(0.1, parseFloat($("cfg-spend").value) || 6.0);
        const bs = Math.max(10, parseInt($("cfg-base").value, 10) || 300);
        const info = {name:file.name, at:new Date().toLocaleString(loc(), {dateStyle:"short", timeStyle:"short"})};
        applyData(obj, info, sp, bs);
        try { localStorage.setItem("scf-data", JSON.stringify({obj, info, sp, bs})); } catch (er) {}
        dmsg(T(`Loaded ${obj.spend.length} weeks from ${file.name}.`,`${obj.spend.length} semanas carregadas de ${file.name}.`), true);
      } catch (err) { dmsg(String(err), false); }
      e.target.value = "";
    };
    rd.readAsText(file);
  };
  $("d-reset").onclick = () => { applyData(DEMO, null, 6.0, 300); try { localStorage.removeItem("scf-data"); } catch (e) {} dmsg(T("Restored demo data.","Dados de demonstração restaurados."), true); };
  function fillFields() { $("d-fields").innerHTML = COLS.map(c => `<tr><td><code>${c[0]}</code></td><td>${L([c[2], c[3]])}</td></tr>`).join(""); }

