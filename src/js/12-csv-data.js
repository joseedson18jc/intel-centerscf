  // ========== WEEKLY DATA LAYER: columns, validation rules, CSV parser, apply / export ==========
  // The validation functions here (checkCell, checkDataset) are the single set of rules; the on-screen
  // editor (12b-data-editor.js) and the saved-state restore (19-persistence.js) reuse them.
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
  const DATA_COLS = COLS.slice(1);
  // Rules per series: pct = 0 to 100, int = whole number (a count), pos = must be greater than zero,
  // max = sanity ceiling for columns that are not percentages (a year of days, a four-digit count of flags).
  const COL_RULES = { spend:{pct:1, pos:1}, active:{int:1}, util:{pct:1, pos:1}, days:{max:365}, err:{pct:1}, sow:{pct:1}, flags:{int:1, max:9999}, supShare:{pct:1} };
  const MIN_WEEKS = 2, MAX_WEEKS = 52;
  let SRCINFO = null;

  // Locale-aware number reader. sep is the field separator of the source: ";" means decimal comma is expected
  // (Brazilian export), "," means decimal point. Returns NaN for anything that is not a plain number.
  function parseLocaleNumber(raw, sep) {
    let s = String(raw).trim().replace(/^["']|["']$/g, "").trim();
    if (!s) return NaN;
    if (sep === ";") {
      // Only strip dots when clearly a thousands separator (1.234 or 1.234,56), never corrupting 9.8 into 98.
      if (s.includes(",") && s.lastIndexOf(".") > s.lastIndexOf(",")) s = s.replace(/,/g, "");
      else if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
      else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    } else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) {
      s = s.replace(/,/g, "");
    } else if (/^[+-]?\d+,\d+$/.test(s)) {
      s = s.replace(",", "."); // quoted decimal comma inside a comma-separated file, e.g. "9,8"
    }
    return /^[+-]?\d+(\.\d+)?$/.test(s) ? parseFloat(s) : NaN;
  }

  // One cell of series k. Returns {v} when valid, or {e:[en, pt]} with the reason (without the location).
  function checkCell(k, raw, sep) {
    const txt = String(raw == null ? "" : raw).trim().replace(/^"|"$/g, "").trim(), shown = txt.slice(0, 24);
    if (!txt) return {e:["is empty; a number is required","está vazio; informe um número"]};
    const v = parseLocaleNumber(txt, sep), rule = COL_RULES[k] || {};
    if (!isFinite(v)) return {e:[`"${shown}" is not a number`,`"${shown}" não é um número`]};
    if (v < 0) return {e:[`${shown} is negative; use zero or more`,`${shown} é negativo; use zero ou mais`]};
    if (rule.pct && v > 100) return {e:[`${shown} is above 100; a percentage must be between 0 and 100`,`${shown} passa de 100; o percentual deve ficar entre 0 e 100`]};
    if (rule.max != null && v > rule.max) return {e:[`${shown} is above ${nf(rule.max)}, the most this column accepts`,`${shown} passa de ${nf(rule.max)}, o máximo desta coluna`]};
    if (rule.int && !Number.isInteger(v)) return {e:[`${shown} is not a whole number; this column is a count`,`${shown} não é um número inteiro; esta coluna é uma contagem`]};
    if (rule.pos && v <= 0) return {e:["must be greater than zero","precisa ser maior que zero"]};
    return {v};
  }
  // Whole dataset, values already numeric. Returns a list of {r, k, e}: r is the 0-based week index, or -1 for
  // a problem with the dataset as a whole.
  function checkDataset(obj, baseSup) {
    const errs = [], n = obj.spend.length;
    if (n < MIN_WEEKS) errs.push({r:-1, e:[`Only ${n} week${n === 1 ? "" : "s"} found; at least ${MIN_WEEKS} are needed.`,`Só ${n} semana${n === 1 ? "" : "s"}; são necessárias pelo menos ${MIN_WEEKS}.`]});
    if (n > MAX_WEEKS) errs.push({r:-1, e:[`${n} weeks found; the limit is ${MAX_WEEKS}.`,`${n} semanas; o limite é ${MAX_WEEKS}.`]});
    obj.active.forEach((a, r) => {
      if (a > baseSup) errs.push({r, k:"active", e:[
        `${a} active suppliers is more than the supplier base of ${baseSup}; raise the base in Program parameters or correct the value`,
        `${a} fornecedores ativos é mais que a base de ${baseSup} fornecedores; aumente a base em Parâmetros do programa ou corrija o valor`]});
    });
    return errs;
  }
  const colName = k => { const c = COLS.find(x => x[1] === k); return c ? c[0] : k; };
  // "Row 9, column ativos: ..." for the CSV, "Week 8, Active suppliers: ..." for the editor.
  function dataErrText(err, where, label) {
    return [where, err.k ? (label || T("column ","coluna ") + colName(err.k)) : ""].filter(Boolean).join(", ") + (where || err.k ? ": " : "") + L(err.e);
  }

  // Splits one CSV line, honouring double-quoted fields ("a;b" stays one field, "" is an escaped quote).
  // Returns null when a quote is left open.
  function splitCSVLine(line, sep) {
    const out = []; let cur = "", q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) {
        if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; }
        else cur += ch;
      } else if (ch === '"' && !cur.trim()) { q = true; cur = ""; }
      else if (ch === sep) { out.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    if (q) return null;
    out.push(cur.trim());
    return out;
  }
  // Parses a weekly CSV into {spend:[], active:[], ...}. Throws a bilingual message naming the row and column.
  function parseCSV(text, baseSup = BASE_SUP) {
    const lines = String(text).replace(/^﻿/, "").split(/\r\n|\n|\r/).map((t, i) => ({t, n:i + 1})).filter(l => l.t.trim());
    const rowAt = n => T(`Row ${n}`,`Linha ${n}`);
    if (lines.length < MIN_WEEKS + 1) throw T(`The file needs a header row and at least ${MIN_WEEKS} weeks.`,`O arquivo precisa de uma linha de cabeçalho e de pelo menos ${MIN_WEEKS} semanas.`);
    // ";" (Brazilian export), tab (spreadsheet "Unicode text") or ",". A tab-separated file reads numbers like a "," file.
    const headTxt = lines[0].t.replace(/"[^"]*"/g, ""), sep = headTxt.includes(";") ? ";" : headTxt.includes("\t") ? "\t" : ",";
    const sepName = sep === "\t" ? T("tab", "tabulação") : sep;
    // Decimal mark of a tab-separated file: comma when any data cell has one (Portuguese export), point otherwise.
    const numSep = sep !== "\t" ? sep : lines.slice(1).some(l => l.t.includes(",")) ? ";" : ",";
    const headCells = splitCSVLine(lines[0].t, sep);
    if (!headCells) throw T(`${rowAt(lines[0].n)} (header): a quoted field is not closed.`,`${rowAt(lines[0].n)} (cabeçalho): há um campo entre aspas que não foi fechado.`);
    const head = headCells.map(s => s.toLowerCase());
    const find = ([pt, en]) => head.findIndex(x => x === pt || x === en.toLowerCase());
    const idx = DATA_COLS.map(c => {
      const j = find(c);
      if (j < 0) throw T(`Missing column "${c[0]}" (or "${c[1]}") in the header. Separator detected: "${sepName}".`,`Coluna "${c[0]}" (ou "${c[1]}") ausente no cabeçalho. Separador detectado: "${sepName}".`);
      return j;
    });
    const wi = find(COLS[0]);
    const out = {}; DATA_COLS.forEach(([, k]) => out[k] = []);
    lines.slice(1).forEach((ln, r) => {
      const cells = splitCSVLine(ln.t, sep);
      if (!cells) throw T(`${rowAt(ln.n)}: a quoted field is not closed.`,`${rowAt(ln.n)}: há um campo entre aspas que não foi fechado.`);
      const extra = cells.slice(head.length).some(c => c !== "");
      if (cells.length < head.length || extra) throw T(
        `${rowAt(ln.n)}: ${cells.length} fields found, the header has ${head.length}. If a value contains "${sepName}", put it in double quotes.`,
        `${rowAt(ln.n)}: ${cells.length} campos encontrados, o cabeçalho tem ${head.length}. Se um valor contém "${sepName}", coloque-o entre aspas duplas.`);
      if (wi >= 0) {
        const wk = parseLocaleNumber(cells[wi], numSep);
        if (wk !== r + 1) throw T(
          `${rowAt(ln.n)}, column ${COLS[0][0]}: found "${cells[wi].slice(0, 24)}", expected week ${r + 1}. Week numbers must be whole, consecutive and start at 1.`,
          `${rowAt(ln.n)}, coluna ${COLS[0][0]}: encontrado "${cells[wi].slice(0, 24)}", esperada a semana ${r + 1}. As semanas devem ser números inteiros, consecutivos e começar em 1.`);
      }
      DATA_COLS.forEach(([, k], c) => {
        const res = checkCell(k, cells[idx[c]], numSep);
        if (res.e) throw dataErrText({k, e:res.e}, rowAt(ln.n)) + ".";
        out[k].push(res.v);
      });
    });
    const first = checkDataset(out, baseSup)[0];
    if (first) throw dataErrText(first, first.r >= 0 ? rowAt(lines[first.r + 1].n) : "") + (first.r >= 0 ? "." : "");
    return out;
  }

  // Describes where the data on screen came from. kind: "csv" (file) or "manual" (edited on screen).
  // name and at are getters so the label follows the current language; JSON.stringify stores them as text.
  function makeSrcInfo(kind, name, ts, at) {
    const k = kind === "manual" ? "manual" : "csv", fileName = String(name || "CSV").slice(0, 120), t = +ts || 0, atTxt = String(at || "").slice(0, 40);
    return {
      kind:k, ts:t,
      get name() { return k === "manual" ? T("on-screen edit","edição na tela") : fileName; },
      get at() { return t ? new Date(t).toLocaleString(loc(), {dateStyle:"short", timeStyle:"short"}) : atTxt; }
    };
  }
  // Replaces the weekly series (and optionally the programme size) and re-renders everything.
  // info = null means "example data"; any other value marks the data as the user's own (SRCINFO guards).
  function applyData(obj, info, spendBn = SPEND / 1000, baseSup = BASE_SUP) {
    DATA_COLS.forEach(([, k]) => { D[k] = obj[k].slice(); });
    W = D.spend.length; SPEND = spendBn * 1000; BASE_SUP = Math.max(baseSup, Math.ceil(Math.max(0, ...D.active)));
    recomputeBook();
    $("slider").max = W; $("tk-end").textContent = WL() + W;
    SRCINFO = info; srcChip(); updateCcyTexts(); buildKpis(); render(W);
    if (typeof syncParamInputs === "function") syncParamInputs();
    if (typeof edLoad === "function") edLoad();
  }
  function srcChip() {
    const c = $("src-chip"); if (!c) return;
    c.classList.toggle("live", !!SRCINFO);
    $("src-txt").textContent = !SRCINFO
      ? T("Source: example data · click to edit or load a CSV","Fonte: dados de exemplo · clique para editar ou carregar um CSV")
      : SRCINFO.kind === "manual"
        ? T(`Source: ${SRCINFO.name} · ${W} weeks · applied ${SRCINFO.at}`,`Fonte: ${SRCINFO.name} · ${W} semanas · aplicado em ${SRCINFO.at}`)
        : T(`Source: ${SRCINFO.name} · ${W} weeks · loaded ${SRCINFO.at}`,`Fonte: ${SRCINFO.name} · ${W} semanas · carregado em ${SRCINFO.at}`);
  }
  function toCSV(obj = D) {
    const rows = [COLS.map(c => c[0]).join(";")];
    for (let i = 0; i < obj.spend.length; i++) rows.push([i + 1, ...DATA_COLS.map(([, k]) => String(obj[k][i]).replace(".", ","))].join(";"));
    return rows.join("\n");
  }
  // Status line of the "Weekly data" block. ok: true = success, false = error, "info" = neutral.
  const dmsg = (t, ok) => { const m = $("data-msg"); if (!m) return; m.textContent = t; m.className = ok === true ? "ok" : ok === false ? "err" : "info"; };
  function downloadCSV(obj) {
    const url = URL.createObjectURL(new Blob(["﻿" + toCSV(obj)], {type:"text/csv;charset=utf-8"}));
    const a = document.createElement("a"); a.href = url; a.download = "scf_cockpit_semanal.csv"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  if ($("d-tpl")) $("d-tpl").onclick = () => {
    // Unapplied but valid edits in the grid are exported as typed; otherwise the data applied to the dashboard.
    const pending = typeof edPending === "function" ? edPending() : null;
    if (pending && pending.obj) { downloadCSV(pending.obj); dmsg(T("CSV downloaded with the grid as edited (not applied to the dashboard yet).","CSV baixado com a tabela como editada (ainda não aplicada ao painel)."), "info"); }
    else if (pending) { downloadCSV(D); dmsg(T("The grid has errors, so the CSV holds the data currently applied to the dashboard.","A tabela tem erros; o CSV traz os dados aplicados ao painel no momento."), "info"); }
    else { downloadCSV(D); dmsg(T(`CSV downloaded: ${W} weeks, ";" separator, decimal comma.`,`CSV baixado: ${W} semanas, separador ";", vírgula decimal.`), "info"); }
  };
  if ($("d-load") && $("d-file")) $("d-load").onclick = () => $("d-file").click();
  if ($("d-file")) $("d-file").onchange = e => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 2e6) { dmsg(T("The file is larger than 2 MB; a weekly CSV has at most 52 rows.","O arquivo tem mais de 2 MB; um CSV semanal tem no máximo 52 linhas."), false); e.target.value = ""; return; }
    const rd = new FileReader();
    rd.onerror = () => { dmsg(T("The file could not be read.","Não foi possível ler o arquivo."), false); e.target.value = ""; };
    rd.onload = () => {
      try {
        const obj = parseCSV(rd.result, BASE_SUP);
        applyData(obj, makeSrcInfo("csv", file.name, Date.now()));
        if (typeof saveDataset === "function") saveDataset();
        dmsg(T(`Loaded ${obj.spend.length} weeks from ${file.name}.`,`${obj.spend.length} semanas carregadas de ${file.name}.`), true);
      } catch (err) { dmsg(typeof err === "string" ? err : T("The file could not be read as a CSV.","Não foi possível ler o arquivo como CSV."), false); if (typeof err !== "string") console.error("[csv]", err); }
      e.target.value = "";
    };
    rd.readAsText(file);
  };
  // Back to the example weekly series. Programme parameters are kept; the supplier base only moves if it
  // would end up below the example's active suppliers.
  function resetToExample() {
    const obj = {}; DATA_COLS.forEach(([, k]) => { obj[k] = DEMO[k].slice(); });
    const need = Math.max(...obj.active), raised = BASE_SUP < need;
    applyData(obj, null, SPEND / 1000, raised ? 300 : BASE_SUP);
    if (typeof saveDataset === "function") saveDataset();
    dmsg(T("Example data restored.","Dados de exemplo restaurados.") + (raised ? T(` Supplier base set back to 300 because the example has up to ${need} active suppliers.`,` Base de fornecedores voltou para 300 porque o exemplo tem até ${need} fornecedores ativos.`) : ""), true);
  }
  if ($("d-reset")) $("d-reset").onclick = resetToExample;
  function ruleText(k) {
    if (k === "week") return T("Optional. Whole numbers, consecutive, starting at 1","Opcional. Números inteiros, consecutivos, começando em 1");
    const r = COL_RULES[k] || {}, parts = [];
    parts.push(r.pct ? (r.pos ? T("above 0, up to 100","acima de 0, até 100") : T("0 to 100","0 a 100")) : r.max != null ? T(`0 to ${nf(r.max)}`,`0 a ${nf(r.max)}`) : T("0 or more","0 ou mais"));
    if (r.int) parts.push(T("whole number","número inteiro"));
    if (k === "active") parts.push(T(`at most the supplier base (${nf(BASE_SUP)})`,`no máximo a base de fornecedores (${nf(BASE_SUP)})`));
    return parts.join(", ");
  }
  // Called when the data modal opens (13-briefing-modals) and on every refresh while it is open.
  function fillFields() {
    const tb = $("d-fields");
    if (tb) tb.innerHTML = COLS.map(c => `<tr><td><code>${esc(c[0])}</code></td><td>${esc(L([c[2], c[3]]))}<small class="de-rule">${esc(ruleText(c[1]))}</small></td></tr>`).join("");
    if (typeof syncParamInputs === "function") syncParamInputs();
    if (typeof edRefresh === "function") edRefresh(true);
  }
