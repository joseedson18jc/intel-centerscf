  // ========== ASSISTANT PANEL (one place to ask about the panel) ==========
  // Default: answers come from the panel engine (20-engine.js: askLocal / engineSuggestions), which is rules
  // computed in this page. It is labelled as such, never as AI, and nothing leaves the page.
  // Optional: with an API key saved in settings (14-ai-copilot.js) the user can switch to "Ask Claude"; the
  // question plus engineContext() go through callAnthropic(). Those answers are labelled as model output; on
  // any failure the specific error is shown and the engine answers instead, labelled as a fallback.
  // The conversation lives in memory only (never in localStorage) and "/" opens the panel.
  Object.assign(I18N, {
    "as.btn":["Assistant","Assistente"], "as.btn.aria":["Open the assistant (shortcut: slash key)","Abrir o assistente (atalho: tecla barra)"],
    "as.h":["Panel assistant","Assistente do painel"],
    "as.clear":["Clear the conversation","Limpar a conversa"], "as.close":["Close the assistant","Fechar o assistente"],
    "as.mode":["Who answers","Quem responde"], "as.mode.engine":["Panel engine","Motor do painel"], "as.mode.model":["Ask Claude","Perguntar ao Claude"],
    "as.q.lbl":["Your question","Sua pergunta"], "as.send":["Send question","Enviar pergunta"],
    "as.review":["Parameter suggestions","Sugestões de parâmetros"], "as.settings":["Key and model","Chave e modelo"]
  });
  const ASST = { mode:"engine", msgs:[], busy:false, abort:null, seq:0 };
  const asstEngineLabel = () => T("Panel engine (rules, offline, no data leaves the page)","Motor do painel (regras, offline, nenhum dado sai da página)");
  const asstHasEngine = () => typeof askLocal === "function";
  const asstKeyOn = () => typeof aiHasKey === "function" && aiHasKey() && typeof callAnthropic === "function";

  // Engine answer, normalised to the shared contract {title, html, step, chips}. Never throws.
  function asstEngineAnswer(q) {
    let r = null;
    if (asstHasEngine()) { try { r = askLocal(q); } catch (e) { console.error("[assistant] engine", e); r = null; } }
    if (!r || typeof r !== "object" || typeof r.html !== "string") {
      return {
        title: T("The panel engine is not available","O motor do painel não está disponível"),
        html: esc(asstHasEngine()
          ? T("The panel engine could not answer this question. Try one of the suggested questions.","O motor do painel não conseguiu responder a esta pergunta. Tente uma das perguntas sugeridas.")
          : T("This build of the page does not include the panel engine, so there is no offline answer. The numbers in the four steps of the panel are still complete.","Esta versão da página não inclui o motor do painel; por isso não há resposta offline. Os números nas quatro etapas do painel continuam completos.")),
        step: null, chips: []
      };
    }
    const step = [1, 2, 3, 4].includes(r.step) ? r.step : null;
    const chips = Array.isArray(r.chips) ? r.chips.filter(c => typeof c === "string" && c.trim()).slice(0, 6) : [];
    return { title: typeof r.title === "string" ? r.title : "", html: r.html, step, chips };
  }
  function asstStarters() {
    let s = [];
    if (typeof engineSuggestions === "function") { try { s = engineSuggestions(); } catch (e) { console.error("[assistant] suggestions", e); } }
    return Array.isArray(s) ? s.filter(c => typeof c === "string" && c.trim()).slice(0, 6) : [];
  }
  // Context sent with a model question: the engine's snapshot (or the copilot's), minus anything key-like.
  function asstContext() {
    let ctx = null;
    try { ctx = typeof engineContext === "function" ? engineContext() : typeof buildDashboardSnapshot === "function" ? buildDashboardSnapshot() : null; } catch (e) { console.error("[assistant] context", e); }
    const clean = (v, depth) => {
      if (depth > 12) return null;
      if (typeof v === "string") return /sk-ant-/i.test(v) ? "[removed]" : v;
      if (typeof v === "number") return isFinite(v) ? v : null;
      if (v === null || typeof v === "boolean") return v;
      if (Array.isArray(v)) return v.map(x => clean(x, depth + 1));
      if (typeof v === "object") { const o = {}; for (const k of Object.keys(v)) { if (/^(api_?key|key|token|secret|authorization|password)$/i.test(k)) continue; const c = clean(v[k], depth + 1); if (c !== undefined) o[k] = c; } return o; }
      return undefined;
    };
    return ctx && typeof ctx === "object" ? clean(ctx, 0) : {};
  }
  // Plain model text -> safe HTML: everything is escaped first, then paragraphs, bullet lists and **bold**.
  function asstFormat(text) {
    const lines = esc(String(text).slice(0, 8000)).replace(/\r/g, "").split("\n");
    const inline = s => s.replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>");
    let out = "", list = [], para = [];
    const flush = () => {
      if (para.length) { out += `<p>${para.map(inline).join("<br>")}</p>`; para = []; }
      if (list.length) { out += `<ul>${list.map(x => `<li>${inline(x)}</li>`).join("")}</ul>`; list = []; }
    };
    for (const raw of lines) {
      const ln = raw.trim(), m = ln.match(/^(?:[-*•]|\d{1,2}[.)])\s+(.*)$/);
      if (!ln) { flush(); continue; }
      if (m) { if (para.length) flush(); list.push(m[1]); continue; }
      if (list.length) flush();
      para.push(ln.replace(/^#{1,4}\s+/, ""));
    }
    flush();
    return out;
  }
  const asstPlain = html => String(html).replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();

  function asstRender() {
    const log = $("asst-log"); if (!log) return;
    const chipRow = (chips, cls) => chips.length ? `<div class="asst-chips ${cls || ""}">${chips.map(c => `<button type="button" class="asst-chip" data-asst-q="${esc(c)}">${esc(c)}</button>`).join("")}</div>` : "";
    let html = "";
    if (!ASST.msgs.length) {
      const st = asstStarters();
      html += `<div class="asst-msg bot intro"><div class="asst-who">${esc(asstEngineLabel())}</div>
        <div class="asst-body"><p>${T("Ask about what the panel shows: this week's indicators, the forecast and the limit, the pipeline or the market tables. The answer is computed in this page from the same numbers you see, with the calculation shown.","Pergunte sobre o que o painel mostra: os indicadores da semana, a projeção e o limite, o pipeline ou as tabelas de mercado. A resposta é calculada nesta página com os mesmos números que você vê, com a conta à mostra.")}</p>
        ${st.length ? `<p class="asst-hint">${T("Suggestions for the selected week:","Sugestões para a semana selecionada:")}</p>` : ""}</div>${chipRow(st, "starters")}</div>`;
    }
    const lastBot = ASST.msgs.map(m => m.role).lastIndexOf("bot");
    ASST.msgs.forEach((m, i) => {
      if (m.role === "user") { html += `<div class="asst-msg user"><div class="asst-body">${esc(m.text)}</div></div>`; return; }
      if (m.role === "note") { html += `<div class="asst-note ${m.tone === "err" ? "err" : ""}" role="${m.tone === "err" ? "alert" : "note"}">${esc(m.text)}</div>`; return; }
      const who = m.source === "model"
        ? `<div class="asst-who model">${esc(`Claude (${m.model})`)}<span>${T("Model output. It may be wrong: check it against the panel's numbers.","Resposta de modelo. Pode estar errada: confira com os números do painel.")}</span></div>`
        : m.source === "fallback"
          ? `<div class="asst-who">${esc(asstEngineLabel())}<span>${T("Fallback answer: Claude did not answer this question.","Resposta de reserva: o Claude não respondeu a esta pergunta.")}</span></div>`
          : `<div class="asst-who">${esc(asstEngineLabel())}</div>`;
      const meta = `<div class="asst-meta">${T("Panel state when answered","Estado do painel na resposta")}: ${T("week","semana")} ${m.week} · ${esc(m.ccy)}</div>`;
      const go = m.step ? `<button type="button" class="asst-go" data-asst-step="${m.step}">${T(`Go to step ${m.step}`,`Ir para a etapa ${m.step}`)} →</button>` : "";
      html += `<div class="asst-msg bot">${who}${m.title ? `<h4>${esc(m.title)}</h4>` : ""}<div class="asst-body">${m.html}</div>${meta}${go}${i === lastBot && !ASST.busy ? chipRow(m.chips || []) : ""}</div>`;
    });
    if (ASST.busy) html += `<div class="asst-msg bot pending"><div class="asst-body"><span class="asst-dots" aria-hidden="true"><i></i><i></i><i></i></span> ${T("Waiting for Claude...","Aguardando o Claude...")} <button type="button" class="asst-link" id="asst-cancel">${T("Cancel","Cancelar")}</button></div></div>`;
    log.innerHTML = html;
    // Show the last question at the top with its answer below it (the pending row stays in view while waiting).
    const lastQ = [...log.querySelectorAll(".asst-msg.user")].pop();
    log.scrollTop = ASST.busy || !lastQ ? log.scrollHeight : log.scrollTop + lastQ.getBoundingClientRect().top - log.getBoundingClientRect().top - 8;
  }

  function syncAssistantUi() {
    const m = $("m-assistant"), btn = $("openAssistant");
    if (btn) btn.title = T("Assistant (press /)","Assistente (tecle /)");
    if (!m) return;
    const keyOn = asstKeyOn();
    if (ASST.mode === "model" && !keyOn) ASST.mode = "engine";
    m.querySelectorAll("[data-asst-mode]").forEach(b => {
      b.setAttribute("aria-pressed", String(b.dataset.asstMode === ASST.mode));
      if (b.dataset.asstMode === "model") { b.disabled = !keyOn; b.title = keyOn ? "" : T("Needs an API key saved in \"Key and model\"","Precisa de uma chave de API salva em \"Chave e modelo\""); }
    });
    const model = typeof activeAiModel === "function" ? activeAiModel() : "";
    $("asst-src").textContent = ASST.mode === "model" ? `Claude (${model})` : asstEngineLabel();
    $("asst-mode-note").textContent = ASST.mode === "model"
      ? T(`Each question is sent with a snapshot of the panel to ${typeof aiDest === "function" ? aiDest() : "the Anthropic API"} (${model}) using your key. The answer is model output and may be wrong. If the call fails, the panel engine answers.`,`Cada pergunta é enviada com um retrato do painel para ${typeof aiDest === "function" ? aiDest() : "a API da Anthropic"} (${model}) usando a sua chave. A resposta é de modelo e pode estar errada. Se a chamada falhar, o motor do painel responde.`)
      : keyOn
        ? T("Rules computed in this page from the panel's numbers. Not AI; nothing is sent anywhere.","Regras calculadas nesta página com os números do painel. Não é IA; nada é enviado para fora.")
        : T("Rules computed in this page from the panel's numbers. Not AI; nothing is sent anywhere. \"Ask Claude\" is optional and needs an API key.","Regras calculadas nesta página com os números do painel. Não é IA; nada é enviado para fora. \"Perguntar ao Claude\" é opcional e precisa de uma chave de API.");
    $("asst-q").placeholder = ASST.mode === "model" ? T("Ask Claude about the panel...","Pergunte ao Claude sobre o painel...") : T("Ask about the panel...","Pergunte sobre o painel...");
    $("asst-foot-note").textContent = T("Conversation kept in memory only: it is gone when the page reloads.","Conversa só na memória: some ao recarregar a página.");
    $("asst-clear").title = L(I18N["as.clear"]); $("asst-send").title = L(I18N["as.send"]);
    $("asst-clear").disabled = !ASST.msgs.length && !ASST.busy;
    $("asst-send").disabled = ASST.busy;
    if (!m.hidden) asstRender();
  }

  async function askAssistant(question) {
    const q = String(question || "").replace(/\s+/g, " ").trim().slice(0, 600);
    if (!q || ASST.busy || !$("m-assistant")) return;
    const stamp = () => ({ week, ccy });
    ASST.msgs.push({ role:"user", text:q });
    const local = asstEngineAnswer(q);
    if (ASST.mode !== "model" || !asstKeyOn()) {
      ASST.msgs.push({ role:"bot", source:"engine", ...local, ...stamp() });
      syncAssistantUi();
      return;
    }
    const seq = ++ASST.seq;
    ASST.busy = true; ASST.abort = new AbortController();
    syncAssistantUi();
    try {
      const history = ASST.msgs.slice(0, -1).filter(m => m.role === "user" || m.role === "bot").slice(-6)
        .map(m => m.role === "user" ? `USER: ${m.text}` : `ASSISTANT (${m.source === "model" ? "model" : "panel engine"}): ${(m.text || asstPlain(m.html)).slice(0, 1200)}`).join("\n");
      const system = `You are the assistant inside a supply chain finance (risco sacado, Brazil) weekly dashboard prototype. Answer the user's question using only the PANEL CONTEXT JSON that comes with it.
Facts about the data: the weekly pilot series is example data unless the context says the user loaded their own; the market tables (funders, shares, price bands, ratings, signals) are fabricated for the prototype; company revenues are quoted public figures the page does not verify; the FX rate is a number typed by the user.
Rules: quote numbers exactly as they are in the context and say which part of the panel they come from. If the context does not contain what is needed, say so plainly instead of guessing. Do not invent bank terms, deadlines, prices or product conditions. Do not present example or fabricated figures as real.
Format: plain text, at most about 150 words, short paragraphs or "- " bullets, no tables, no headings. Write in ${lang === "pt" ? "Brazilian Portuguese" : "English"}.`;
      const userPrompt = `${history ? `EARLIER IN THIS CONVERSATION:\n${history}\n\n` : ""}QUESTION: ${q}\n\nPANEL CONTEXT (JSON):\n${JSON.stringify(asstContext())}`;
      const resp = await callAnthropic({ system, userPrompt, maxTokens: 8192, outputConfig: { effort: "low" }, signal: ASST.abort.signal });
      if (seq !== ASST.seq) return;
      ASST.msgs.push({ role:"bot", source:"model", model:resp.model, title:"", text:resp.text, html:asstFormat(resp.text), step:local.step, chips:local.chips, ...stamp() });
    } catch (err) {
      if (seq !== ASST.seq) return;
      const why = typeof aiErrorText === "function" ? aiErrorText(err) : T("The request failed.","O pedido falhou.");
      ASST.msgs.push({ role:"note", tone:"err", text: (err && err.name === "AbortError" ? "" : T("Claude did not answer. ","O Claude não respondeu. ")) + why + " " + T("The panel engine answered instead.","O motor do painel respondeu no lugar.") });
      ASST.msgs.push({ role:"bot", source:"fallback", ...local, ...stamp() });
    } finally {
      if (seq === ASST.seq) { ASST.busy = false; ASST.abort = null; syncAssistantUi(); }
    }
  }
  function asstClear() {
    ASST.seq++; if (ASST.abort) ASST.abort.abort();
    ASST.busy = false; ASST.abort = null; ASST.msgs = [];
    syncAssistantUi();
  }
  // Opens the assistant; with a question, asks it right away. Other simple modals are closed first.
  function openAssistant(question) {
    const m = $("m-assistant"); if (!m) return;
    if (m.hidden) {
      SIMPLE_MODALS.forEach(id => { const x = $(id); if (x && x !== m && !x.hidden) closeSimpleModal(x); });
      openSimpleModal("m-assistant");
    }
    syncAssistantUi();
    const hasQ = typeof question === "string" && question.trim();
    if (hasQ) askAssistant(question);
    // On touch screens the input is not focused automatically, so the keyboard does not cover the suggestions.
    if (!hasQ && matchMedia("(hover: hover) and (pointer: fine)").matches) $("asst-q").focus();
  }

  if ($("m-assistant")) {
    const m = $("m-assistant"), qEl = $("asst-q");
    if (!SIMPLE_MODALS.includes("m-assistant")) SIMPLE_MODALS.push("m-assistant");   // Escape, focus trap, scroll lock
    m.addEventListener("click", e => {
      const t = e.target;
      if (t === m || t.closest("[data-close]")) { closeSimpleModal(m); return; }
      const chip = t.closest("[data-asst-q]"); if (chip) { askAssistant(chip.dataset.asstQ); return; }
      const go = t.closest("[data-asst-step]");
      if (go) {
        const n = +go.dataset.asstStep;
        closeSimpleModal(m);
        if (typeof goStep === "function") goStep(n, false);
        const p = $("panel-" + n); if (p && !p.hidden) p.scrollIntoView({ behavior:"smooth", block:"start" });
        return;
      }
      const mode = t.closest("[data-asst-mode]"); if (mode && !mode.disabled) { ASST.mode = mode.dataset.asstMode; syncAssistantUi(); qEl.focus(); return; }
      if (t.closest("#asst-cancel")) { if (ASST.abort) ASST.abort.abort(); return; }
      if (t.closest("#asst-clear")) { asstClear(); qEl.focus(); return; }
      if (t.closest("#asst-open-settings")) { if (typeof openAiSettings === "function") openAiSettings(); return; }
      if (t.closest("#asst-open-review")) { if (typeof openParamReview === "function") openParamReview(); return; }
    });
    const grow = () => { qEl.style.height = "auto"; qEl.style.height = Math.min(120, qEl.scrollHeight) + "px"; };
    const submit = () => { const v = qEl.value; if (!v.trim() || ASST.busy) return; qEl.value = ""; grow(); askAssistant(v); };
    $("asst-form").addEventListener("submit", e => { e.preventDefault(); submit(); });
    qEl.addEventListener("input", grow);
    qEl.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(); } });
    if (!$("asst-open-review") || !$("m-ai")) { const b = $("asst-open-review"); if (b) b.hidden = true; }
  }
  if ($("openAssistant")) $("openAssistant").addEventListener("click", () => openAssistant());
  // "/" opens the assistant (or focuses its input) when no field is being typed in and no other layer is open.
  document.addEventListener("keydown", e => {
    if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
    const m = $("m-assistant"), t = e.target;
    if (!m || (t && t.closest && t.closest("input,textarea,select,[contenteditable]"))) return;
    if (!m.hidden) { e.preventDefault(); $("asst-q").focus(); return; }
    if (!deck.hidden || !proofModal.hidden || SIMPLE_MODALS.some(id => $(id) && !$(id).hidden)) return;
    e.preventDefault(); openAssistant(); $("asst-q").focus();
  });
  onRefresh(syncAssistantUi);
