  // ========== DATA MODAL: LIVE PROGRAMME PARAMETERS + ON-SCREEN WEEKLY DATA EDITOR ==========
  // Validation is not duplicated here: cells go through checkCell() and the dataset through checkDataset(),
  // the same functions the CSV parser uses (12-csv-data.js).

  // ---------- Programme parameters (apply while typing) ----------
  const PARAM_FIELDS = [
    {id:"cfg-spend",   d:2, lim:() => PARAM_RANGE.spend,  get:() => +(SPEND / 1000).toFixed(2), set:v => { SPEND = v * 1000; }},
    {id:"cfg-base",    d:0, lim:() => [minBase(), PARAM_RANGE.base[1]], get:() => BASE_SUP, set:v => { BASE_SUP = v; },
      why:() => minBase() > PARAM_RANGE.base[0] ? T(` The base cannot be below the ${nf(minBase())} active suppliers in the weekly data.`,` A base não pode ficar abaixo dos ${nf(minBase())} fornecedores ativos dos dados semanais.`) : ""},
    {id:"cfg-tenor",   d:1, lim:() => PARAM_RANGE.tenor,  get:() => PILOT.tenor,  set:v => { PILOT.tenor = v; }},
    {id:"cfg-pspread", d:2, lim:() => PARAM_RANGE.spread, get:() => PILOT.spread, set:v => { PILOT.spread = v; }},
    {id:"cfg-fx",      d:4, lim:() => PARAM_RANGE.fx,     get:() => FX_RATE,      set:v => { setFxRate(v); }, self:true} // setFxRate re-renders by itself
  ];
  const pmsg = (t, ok) => { const m = $("par-msg"); if (!m) return; m.textContent = t; m.className = ok === true ? "ok" : ok === false ? "err" : "info"; };
  // Writes the current state into the inputs (the one being typed in is left alone unless force is set).
  function syncParamInputs(force) {
    const db = $("d-defaults"); if (db) db.title = L(I18N["md.defaults.t"]);
    PARAM_FIELDS.forEach(f => {
      const inp = $(f.id); if (!inp) return;
      const [lo, hi] = f.lim(); inp.min = lo; inp.max = hi;
      if (force || document.activeElement !== inp) { inp.value = f.get(); inp.removeAttribute("aria-invalid"); }
    });
  }
  // typing: apply the (clamped) value at once, leave the text alone. commit (blur / Enter): also rewrite the field.
  function paramEdit(f, commit) {
    const inp = $(f.id), raw = inp.value.trim(), n = parseFloat(raw.replace(",", ".")), [lo, hi] = f.lim();
    if (raw === "" || !isFinite(n)) {
      if (commit) { inp.value = f.get(); inp.removeAttribute("aria-invalid"); pmsg("", "info"); }
      else { inp.setAttribute("aria-invalid", "true"); pmsg(T("Type a number. The last valid value stays in use.","Digite um número. O último valor válido continua em uso."), false); }
      return;
    }
    const v = +clampNum(n, lo, hi).toFixed(f.d), adjusted = v !== n;
    let saved = typeof lsBlocked === "undefined" || !lsBlocked;
    if (v !== f.get()) { f.set(v); if (!f.self) refreshAll(); if (typeof saveParams === "function") saved = saveParams() !== false; }
    if (commit) inp.value = v;
    if (adjusted && !commit) inp.setAttribute("aria-invalid", "true"); else inp.removeAttribute("aria-invalid");
    if (adjusted) {
      const outOfRange = n < lo || n > hi;
      pmsg(outOfRange
        ? T(`Allowed range: ${nf(lo, lo % 1 ? 1 : 0)} to ${nf(hi)}. Using ${nf(v, f.d)}.`,`Faixa permitida: ${nf(lo, lo % 1 ? 1 : 0)} a ${nf(hi)}. Usando ${nf(v, f.d)}.`) + (f.why ? f.why() : "")
        : T(`Rounded to ${nf(v, f.d)}.`,`Arredondado para ${nf(v, f.d)}.`), outOfRange ? false : "info");
    } else pmsg(saved ? T("Applied to the dashboard and saved in this browser.","Aplicado ao painel e salvo neste navegador.")
      : T("Applied to the dashboard. This browser blocked storage, so the change lasts only until the page is closed.","Aplicado ao painel. Este navegador bloqueou o armazenamento, então a mudança vale só até fechar a página."), true);
  }
  PARAM_FIELDS.forEach(f => {
    const inp = $(f.id); if (!inp) return;
    inp.addEventListener("input", () => paramEdit(f, false));
    inp.addEventListener("change", () => paramEdit(f, true));
    inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); paramEdit(f, true); } });
  });
  if ($("d-defaults")) $("d-defaults").onclick = () => {
    if (typeof restoreDefaults !== "function") return;
    restoreDefaults();
    dmsg("", "info");
    pmsg(T("Defaults restored: saved parameters and weekly data were cleared and the example state is back.","Padrões restaurados: os parâmetros e os dados semanais salvos foram apagados e o estado de exemplo voltou."), true);
  };

  // ---------- Weekly data grid ----------
  const ED_HEAD = {
    spend:["Spend %","Gasto %"], active:["Active suppliers","Fornec. ativos"], util:["Utilization %","Utilização %"], days:["Days to 1st discount","Dias até 1º desc."],
    err:["Forecast error %","Erro proj. %"], sow:["Share of wallet %","Share of wallet %"], flags:["Risk flags","Alertas"], supShare:["Receivables share %","Share receb. %"]
  };
  const ED = { rows:[], dirty:false, errs:[], sep:";" };   // rows: one array of 8 raw strings per week, typed with separator rules ED.sep
  const edSep = () => lang === "pt" ? ";" : ",";   // decimal comma in Portuguese, decimal point in English
  const edFmt = v => lang === "pt" ? String(v).replace(".", ",") : String(v);
  const edColFull = k => { const c = COLS.find(x => x[1] === k); return L([c[2], c[3]]); };
  const edCell = (r, c) => { const g = $("de-grid"); return g ? g.querySelector(`input[data-r="${r}"][data-c="${c}"]`) : null; };
  // Reads the grid through the shared rules. Returns {obj, errs}; obj is complete only when errs is empty.
  function edRead() {
    const obj = {}, errs = []; DATA_COLS.forEach(([, k]) => obj[k] = []);
    ED.rows.forEach((row, r) => DATA_COLS.forEach(([, k], c) => {
      const res = checkCell(k, row[c], edSep());
      if (res.e) errs.push({r, k, e:res.e}); else obj[k].push(res.v);
    }));
    if (!errs.length) errs.push(...checkDataset(obj, BASE_SUP));
    else if (ED.rows.length < MIN_WEEKS || ED.rows.length > MAX_WEEKS) errs.push(...checkDataset({spend:ED.rows, active:[]}, BASE_SUP));
    return {obj, errs};
  }
  // For the "download CSV" button: null = nothing pending, {obj} = valid unapplied edits, {} = edits with errors.
  function edPending() { if (!ED.dirty) return null; const {obj, errs} = edRead(); return errs.length ? {} : {obj}; }
  // Loads the applied data into the grid, dropping unapplied edits.
  function edLoad() {
    ED.rows = Array.from({length:W}, (_, r) => DATA_COLS.map(([, k]) => edFmt(D[k][r])));
    ED.dirty = false; ED.sep = edSep();
    edRender();
  }
  function edRender() {
    const g = $("de-grid"); if (!g) return;
    // Language changed with unapplied edits: re-write every readable cell in the new decimal format, so "9,875"
    // typed in Portuguese stays nine point eight seven five in English. Unreadable cells keep their text.
    if (ED.sep !== edSep()) {
      ED.rows = ED.rows.map(row => row.map(raw => { const v = parseLocaleNumber(raw, ED.sep); return isFinite(v) ? edFmt(v) : raw; }));
      ED.sep = edSep();
    }
    const act = document.activeElement, keep = act && g.contains(act) && act.dataset.r ? [act.dataset.r, act.dataset.c] : null;
    g.innerHTML = `<thead><tr><th scope="col">${esc(L(I18N["wk"]))}</th>${DATA_COLS.map(([pt, k]) => `<th scope="col" title="${esc(edColFull(k))} · ${esc(pt)}">${esc(L(ED_HEAD[k]))}</th>`).join("")}</tr></thead>`
      + `<tbody>${ED.rows.map((row, r) => `<tr><th scope="row">${WL()}${r + 1}</th>${DATA_COLS.map(([, k], c) =>
        `<td><input type="text" inputmode="decimal" autocomplete="off" spellcheck="false" data-r="${r}" data-c="${c}" value="${esc(row[c])}" aria-label="${esc(T("Week","Semana") + " " + (r + 1) + ", " + edColFull(k))}"></td>`).join("")}</tr>`).join("")}</tbody>`;
    if (keep) { const inp = edCell(keep[0], keep[1]); if (inp) inp.focus(); }
    edValidate();
  }
  // Marks invalid cells, writes the status line and enables or disables the buttons.
  function edValidate() {
    const g = $("de-grid"); if (!g) return;
    const {errs} = edRead(); ED.errs = errs;
    g.querySelectorAll("input[aria-invalid]").forEach(i => { i.removeAttribute("aria-invalid"); i.removeAttribute("title"); });
    errs.forEach(er => {
      if (er.r < 0) return;
      const inp = edCell(er.r, DATA_COLS.findIndex(c => c[1] === er.k));
      if (inp && !inp.hasAttribute("aria-invalid")) { inp.setAttribute("aria-invalid", "true"); inp.title = L(er.e); }
    });
    const n = ED.rows.length, st = $("de-status");
    if (st) {
      if (errs.length) {
        const er = errs[0], more = errs.length - 1;
        st.className = "de-status err";
        st.textContent = dataErrText(er, er.r >= 0 ? T(`Week ${er.r + 1}`,`Semana ${er.r + 1}`) : "", er.k ? edColFull(er.k) : "") + (er.r >= 0 ? "." : "")
          + (more ? T(` (+${more} more to fix)`,` (+${more} a corrigir)`) : "");
      } else if (ED.dirty) {
        st.className = "de-status pend";
        st.textContent = T(`${n} weeks ready, not applied yet. Press "Apply to dashboard".`,`${n} semanas prontas, ainda não aplicadas. Clique em "Aplicar ao painel".`);
      } else {
        st.className = "de-status";
        st.textContent = SRCINFO
          ? T(`${n} weeks on the dashboard (your data).`,`${n} semanas no painel (seus dados).`)
          : T(`${n} weeks on the dashboard (example data).`,`${n} semanas no painel (dados de exemplo).`);
      }
    }
    const dis = (id, off) => { const b = $(id); if (b) b.disabled = off; };
    dis("de-apply", !ED.dirty || errs.length > 0); dis("de-discard", !ED.dirty);
    dis("de-add", n >= MAX_WEEKS); dis("de-del", n <= MIN_WEEKS);
  }
  // Refresh hook: language, base or data may have changed. Unapplied edits are never thrown away here.
  function edRefresh(force) {
    const m = $("m-data"); if (!m || (m.hidden && !force)) return;
    if (ED.dirty) edRender(); else edLoad();
  }
  // While the modal is open every refresh keeps it in line with the state; once closed, stale messages are cleared.
  onRefresh(() => { const m = $("m-data"); if (!m) return; if (m.hidden) pmsg("", "info"); else fillFields(); });

  function edFocus(r, c) { const inp = edCell(r, c); if (inp) { inp.focus(); inp.select(); inp.scrollIntoView({block:"nearest", inline:"nearest"}); } }
  if ($("de-grid")) {
    const g = $("de-grid");
    g.addEventListener("input", e => {
      const t = e.target; if (!t.dataset || t.dataset.r === undefined) return;
      ED.rows[+t.dataset.r][+t.dataset.c] = t.value; ED.dirty = true; edValidate();
    });
    g.addEventListener("keydown", e => {
      const t = e.target; if (!t.dataset || t.dataset.r === undefined) return;
      const r = +t.dataset.r, c = +t.dataset.c;
      if (e.key === "Enter" || e.key === "ArrowDown") { e.preventDefault(); edFocus(Math.min(ED.rows.length - 1, r + 1), c); }
      else if (e.key === "ArrowUp") { e.preventDefault(); edFocus(Math.max(0, r - 1), c); }
    });
    // Paste a block copied from a spreadsheet (tabs between cells, one line per week), starting at the focused cell.
    g.addEventListener("paste", e => {
      const t = e.target, txt = (e.clipboardData || window.clipboardData).getData("text");
      if (!t.dataset || t.dataset.r === undefined || !/[\t\n]/.test(txt.trim())) return;
      e.preventDefault();
      const r0 = +t.dataset.r, c0 = +t.dataset.c; let skipped = 0;
      txt.replace(/\r/g, "").split("\n").filter(l => l.trim() !== "").forEach((line, i) => {
        const r = r0 + i; if (r >= MAX_WEEKS) { skipped++; return; }
        while (ED.rows.length <= r) ED.rows.push(DATA_COLS.map(() => ""));
        line.split("\t").forEach((cell, j) => { if (c0 + j < DATA_COLS.length) ED.rows[r][c0 + j] = cell.trim(); });
      });
      ED.dirty = true; edRender(); edFocus(r0, c0);
      if (skipped) dmsg(T(`${skipped} pasted row${skipped === 1 ? " was" : "s were"} left out: the grid holds at most ${MAX_WEEKS} weeks.`,`${skipped} ${skipped === 1 ? "linha colada ficou" : "linhas coladas ficaram"} de fora: a tabela comporta no máximo ${MAX_WEEKS} semanas.`), false);
    });
    $("de-add").onclick = () => {
      if (ED.rows.length >= MAX_WEEKS) return;
      ED.rows.push(ED.rows[ED.rows.length - 1].slice()); ED.dirty = true; edRender();
      const n = ED.rows.length;
      dmsg(T(`Week ${n} added as a copy of week ${n - 1}. Type its values, then apply.`,`Semana ${n} adicionada como cópia da semana ${n - 1}. Digite os valores e depois aplique.`), "info");
      edFocus(n - 1, 0);
    };
    $("de-del").onclick = () => {
      if (ED.rows.length <= MIN_WEEKS) return;
      ED.rows.pop(); ED.dirty = true; edRender();
      dmsg(T(`Last week removed from the grid: ${ED.rows.length} weeks left. Apply to update the dashboard.`,`Última semana removida da tabela: restam ${ED.rows.length} semanas. Aplique para atualizar o painel.`), "info");
    };
    $("de-discard").onclick = () => { edLoad(); dmsg(T("Edits discarded. The grid shows the data on the dashboard again.","Edições descartadas. A tabela voltou a mostrar os dados do painel."), "info"); };
    $("de-apply").onclick = () => {
      const {obj, errs} = edRead();
      if (errs.length || !ED.dirty) { edValidate(); return; }
      applyData(obj, makeSrcInfo("manual", "", Date.now()));
      const saved = typeof saveDataset === "function" ? saveDataset() !== false : false;
      dmsg(saved ? T(`Applied: the dashboard now runs on your ${obj.spend.length} weeks, saved in this browser.`,`Aplicado: o painel agora usa as suas ${obj.spend.length} semanas, salvas neste navegador.`)
        : T(`Applied: the dashboard now runs on your ${obj.spend.length} weeks. This browser blocked storage, so they last only until the page is closed.`,`Aplicado: o painel agora usa as suas ${obj.spend.length} semanas. Este navegador bloqueou o armazenamento, então elas valem só até fechar a página.`), true);
    };
  }
