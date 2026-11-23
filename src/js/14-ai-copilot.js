  // ========== OPTIONAL MODEL ACCESS (ANTHROPIC API) + PARAMETER SUGGESTIONS YOU REVIEW ==========
  // Everything here is optional: the cockpit and the assistant's panel engine work without a key.
  // - Settings ("m-settings"): the ONE place where the API key, the model and the endpoint are entered.
  // - callAnthropic(): the single request path, shared with the assistant panel (21-assistant.js).
  // - Parameter review ("m-ai"): sends a snapshot of the panel to the model and lists the changes it proposes.
  //   A proposal is checked against an allowed list and a range, shows before and after, and changes nothing
  //   until the user accepts that one row. Every accepted change can be undone.
  // The key lives only in localStorage "scf-ai-cfg". It is never logged and never part of a snapshot.
  const AI_KEY_STORAGE = "scf-ai-cfg", AI_OLD_KEY_STORAGE = "scf-ai-key";
  const AI_DEFAULT_MODEL = "claude-opus-5-5";
  const AI_MODELS = [["claude-opus-5-5","Claude Opus 5.5"],["claude-sonnet-5-5","Claude Sonnet 5.5"],["claude-haiku-5-5","Claude Haiku 5.5"]];
  const DEFAULT_AI_CFG = { apiKey:"", model:AI_DEFAULT_MODEL, customModel:"", endpoint:"https://api.anthropic.com/v1/messages" };
  const cleanApiKey = raw => String(raw || "").replace(/["'`]/g, "").trim().replace(/^Bearer\s+/i, "").replace(/\s+/g, "");
  let aiCfg = { ...DEFAULT_AI_CFG };
  try {
    const raw = JSON.parse(localStorage.getItem(AI_KEY_STORAGE) || "null");
    if (raw && typeof raw === "object") {
      for (const k of Object.keys(DEFAULT_AI_CFG)) if (typeof raw[k] === "string") aiCfg[k] = raw[k];
    }
  } catch (e) {}
  const saveAiCfg = () => { try { localStorage.setItem(AI_KEY_STORAGE, JSON.stringify(aiCfg)); return true; } catch (e) { return false; } };
  // One-time migration of a key saved by the earlier version under "scf-ai-key": it is moved into
  // "scf-ai-cfg" (unless a key is already there) and the old item is removed.
  try {
    const old = localStorage.getItem(AI_OLD_KEY_STORAGE);
    if (old !== null) {
      const k = cleanApiKey(old);
      if (k && !aiCfg.apiKey) { aiCfg.apiKey = k; if (saveAiCfg()) localStorage.removeItem(AI_OLD_KEY_STORAGE); }
      else localStorage.removeItem(AI_OLD_KEY_STORAGE);
    }
  } catch (e) {}

  let aiMode = "overview", aiAbort = null, lastAiResult = null, aiDeckNote = "";
  const aiUndoStack = [];                      // one snapshot per accepted change (most recent last)
  const aiHasKey = () => Boolean(cleanApiKey(aiCfg.apiKey));
  const activeAiModel = () => ((aiCfg.model === "custom" ? aiCfg.customModel : aiCfg.model) || "").trim() || AI_DEFAULT_MODEL;
  const aiModelLabel = () => { const id = activeAiModel(), m = AI_MODELS.find(x => x[0] === id); return m ? m[1] : id; };
  const setStatusEl = (id, msg, cls = "info") => { const e = $(id); if (!e) return; e.textContent = msg; e.className = "ai-status " + cls; };
  const aiStr = v => typeof v === "string" ? v : (typeof v === "number" && isFinite(v)) ? String(v) : "";

  Object.assign(I18N, {
    "nav.ai":["Assistant","Assistente"], "nav.ai.aria":["Open the assistant","Abrir o assistente"],
    "nav.settings":["Assistant settings: API key and model (optional)","Configurações do assistente: chave de API e modelo (opcional)"],
    "st.set.lbl":["Optional · the dashboard works without it","Opcional · o painel funciona sem isso"],
    "st.set.h":["Claude access: API key and model","Acesso ao Claude: chave de API e modelo"],
    "st.set.intro":["The assistant answers offline with the panel engine (rules, no AI). An Anthropic API key is only needed for two optional features: \"Ask Claude\" in the assistant and the parameter suggestions you review.","O assistente responde offline com o motor do painel (regras, sem IA). Uma chave de API da Anthropic só é necessária para dois recursos opcionais: \"Perguntar ao Claude\" no assistente e as sugestões de parâmetros que você revisa."],
    "st.set.key":["Anthropic API key (saved in this browser)","Chave de API da Anthropic (salva neste navegador)"],
    "st.set.show":["Show","Mostrar"], "st.set.model":["Model","Modelo"],
    "st.set.customOpt":["Other model ID...","Outro ID de modelo..."],
    "st.set.customLbl":["Model ID (when \"Other\" is selected)","ID do modelo (quando \"Outro\" está selecionado)"],
    "st.set.adv":["Advanced: API address","Avançado: endereço da API"],
    "st.set.ep":["API address (the key is sent to this address)","Endereço da API (a chave é enviada para este endereço)"],
    "st.set.epNote":["Leave the official address unless you run your own proxy. Only https addresses are accepted (http is accepted for localhost).","Mantenha o endereço oficial, a menos que você use um proxy próprio. Só são aceitos endereços https (http é aceito para localhost)."],
    "st.set.save":["Save","Salvar"], "st.set.test":["Test connection","Testar conexão"],
    "st.set.clear":["Remove key","Remover chave"],
    "st.set.openAsst":["Open the assistant","Abrir o assistente"],
    "st.set.openRev":["Parameter suggestions","Sugestões de parâmetros"],
    "st.set.warnH":["Before you save a key","Antes de salvar uma chave"],
    "ai.mod.lbl":["Optional · uses Claude with your API key","Opcional · usa o Claude com a sua chave de API"],
    "ai.mod.h":["Parameter suggestions you review","Sugestões de parâmetros para você revisar"],
    "ai.mod.intro":["Sends a snapshot of what the panel shows now (week, indicators, forecast and limit, pipeline assumptions and the market tables of the active dataset) to the model and asks for comments and parameter changes. Nothing changes until you accept a change, one at a time. Model output can be wrong: check it against the panel.","Envia ao modelo um retrato do que o painel mostra agora (semana, indicadores, projeção e limite, hipóteses do pipeline e as tabelas de mercado do conjunto ativo) e pede comentários e mudanças de parâmetros. Nada muda até você aceitar uma mudança, uma de cada vez. A resposta do modelo pode estar errada: confira com o painel."],
    "ai.mod.undo":["↩ Undo last accepted change","↩ Desfazer a última mudança aceita"], "ai.mod.cfg":["Key and model","Chave e modelo"],
    "ai.mod.focus":["Focus of the request","Foco do pedido"],
    "ai.m1.h":["Overview","Visão geral"], "ai.m1.p":["Comments on the four steps of the snapshot.","Comentários sobre as quatro etapas do retrato."],
    "ai.m2.h":["Forecast and limit","Projeção e limite"], "ai.m2.p":["Forecast error, scenario, horizon and room under the limit.","Erro de projeção, cenário, horizonte e folga no limite."],
    "ai.m3.h":["Parameters","Parâmetros"], "ai.m3.p":["Asks mainly for parameter changes, each with a reason.","Pede principalmente mudanças de parâmetros, cada uma com o motivo."],
    "ai.m4.h":["Summary for leadership","Resumo para a liderança"], "ai.m4.p":["Short text: what works, what needs attention, next steps.","Texto curto: o que funciona, o que pede atenção, próximos passos."],
    "ai.mod.promptLbl":["Extra instruction for this request (optional)","Instrução adicional para este pedido (opcional)"],
    "ai.mod.run":["Ask for suggestions","Pedir sugestões"], "ai.mod.abort":["Cancel","Cancelar"]
  });
  I18N["st.set.note"] = [
    "<b>The key is stored as plain text in this browser's localStorage.</b> Anyone who uses this browser profile, and any extension or script that can read this page, can read it. Calling the API straight from a page is meant for a personal demonstration: in a bank deployment the key would stay on a server. Requests send your question and a snapshot of the panel (indicators, parameters and the weekly data you loaded or typed) to the address above. Do not load confidential client or supplier data while a key is saved. \"Remove key\" deletes it from this browser.",
    "<b>A chave fica guardada em texto simples no localStorage deste navegador.</b> Qualquer pessoa que use este perfil do navegador, e qualquer extensão ou script que consiga ler esta página, consegue lê-la. Chamar a API direto de uma página serve para demonstração pessoal: em uma implantação no banco, a chave ficaria em um servidor. As chamadas enviam a sua pergunta e um retrato do painel (indicadores, parâmetros e os dados semanais que você carregou ou digitou) para o endereço acima. Não carregue dados confidenciais de clientes ou fornecedores enquanto houver uma chave salva. \"Remover chave\" apaga a chave deste navegador."
  ];

  const aiEndpointOk = u => { try { const x = new URL(u); return x.protocol === "https:" || (x.protocol === "http:" && /^(localhost|127\.0\.0\.1)$/.test(x.hostname)); } catch (e) { return false; } };

  // Where a request actually goes: named as the Anthropic API only for api.anthropic.com, otherwise by its host.
  const aiHost = () => { try { return new URL(aiCfg.endpoint || DEFAULT_AI_CFG.endpoint).host; } catch (e) { return ""; } };
  const aiCustomHost = () => aiHost() !== "api.anthropic.com";
  const aiDest = () => aiCustomHost() ? T(`${aiHost()} (custom address)`,`${aiHost()} (endereço personalizado)`) : T("the Anthropic API","a API da Anthropic");
  const aiDestNote = () => aiCustomHost() ? T(` Requests go to ${aiHost()} (custom address).`,` As chamadas vão para ${aiHost()} (endereço personalizado).`) : "";
  function syncAiStatusUi() {
    const hasKey = aiHasKey();
    if ($("aiDot")) $("aiDot").classList.toggle("ready", hasKey);
    if ($("openSettings")) { $("openSettings").classList.toggle("has-key", hasKey); $("openSettings").title = L(I18N["nav.settings"]); }
    if ($("openAI")) $("openAI").title = L(I18N["nav.ai.aria"]);
    if ($("aiModelTag")) $("aiModelTag").textContent = aiModelLabel() + (aiCustomHost() ? " · " + aiHost() : "");
    const ks = $("aiKeyState");
    if (ks) {
      ks.textContent = hasKey ? T("API key saved in this browser.","Chave de API salva neste navegador.") + aiDestNote() : T("No API key saved: add one in \"Key and model\"","Sem chave de API: adicione em \"Chave e modelo\"");
      ks.className = "ai-keystate " + (hasKey ? "ok" : "warn");
    }
    if ($("aiRunBtn") && !aiAbort) $("aiRunBtn").disabled = !hasKey;
    const ub = $("aiUndoBtn");
    if (ub) { ub.hidden = !aiUndoStack.length; ub.textContent = L(I18N["ai.mod.undo"]) + (aiUndoStack.length > 1 ? ` (${aiUndoStack.length})` : ""); }
    if ($("ai-prompt")) $("ai-prompt").placeholder = T("e.g. Is the approved limit enough for the 13-week forecast?","ex.: O limite aprovado é suficiente para a projeção de 13 semanas?");
    if ($("ai-key-toggle") && $("ai-key")) $("ai-key-toggle").textContent = $("ai-key").type === "password" ? T("Show","Mostrar") : T("Hide","Ocultar");
    const cu = $("ai-model") && $("ai-model").querySelector('option[value="custom"]');
    if (cu) cu.textContent = L(I18N["st.set.customOpt"]);
    const sk = $("set-keystate");
    if (sk) { sk.textContent = hasKey ? T("A key is saved in this browser.","Há uma chave salva neste navegador.") + aiDestNote() : T("No key saved. The assistant uses the panel engine only.","Nenhuma chave salva. O assistente usa só o motor do painel."); sk.className = "ai-keystate " + (hasKey ? "ok" : "muted"); }
    renderAiBriefingBanner();
    if (lastAiResult && $("m-ai") && !$("m-ai").hidden) renderAiResults();
    if (typeof syncAssistantUi === "function") syncAssistantUi();
  }

  // ---------- Settings modal ----------
  function loadSettingsForm() {
    if (!$("ai-key")) return;
    $("ai-key").value = aiCfg.apiKey || ""; $("ai-key").type = "password";
    const sel = $("ai-model");
    if (!sel.dataset.filled) {
      sel.dataset.filled = "1";
      const cu = sel.querySelector('option[value="custom"]');
      AI_MODELS.forEach(([id, name]) => { const o = document.createElement("option"); o.value = id; o.textContent = `${name} (${id})`; sel.insertBefore(o, cu); });
    }
    const opts = [...sel.options].map(o => o.value), known = aiCfg.model !== "custom" && opts.includes(aiCfg.model);
    sel.value = known ? aiCfg.model : "custom";
    $("ai-model-custom").value = known ? (aiCfg.customModel || "") : (aiCfg.model === "custom" ? aiCfg.customModel : aiCfg.model) || "";
    $("ai-model-custom").disabled = sel.value !== "custom";
    $("ai-endpoint").value = aiCfg.endpoint || DEFAULT_AI_CFG.endpoint;
    setStatusEl("set-status", "");
    syncAiStatusUi();
  }
  // Reads the form into aiCfg and saves it. Returns false (and says why) when the endpoint is not acceptable.
  function persistSettingsFromForm() {
    if (!$("ai-key")) return true;
    const cleanedKey = cleanApiKey($("ai-key").value);
    $("ai-key").value = cleanedKey;
    const ep = $("ai-endpoint").value.trim() || DEFAULT_AI_CFG.endpoint;
    if (!aiEndpointOk(ep)) {
      setStatusEl("set-status", T("The API address must start with https:// (http is accepted only for localhost). Nothing was saved.","O endereço da API precisa começar com https:// (http só é aceito para localhost). Nada foi salvo."), "err");
      return false;
    }
    aiCfg = { apiKey: cleanedKey, model: $("ai-model").value, customModel: $("ai-model-custom").value.trim(), endpoint: ep };
    const ok = saveAiCfg();
    syncAiStatusUi();
    if (!ok) setStatusEl("set-status", T("This browser did not allow saving (storage blocked). The key is kept only until the page is closed.","Este navegador não permitiu salvar (armazenamento bloqueado). A chave vale só até fechar a página."), "err");
    return ok;
  }
  function openAiSettings() {
    if (!$("m-settings")) return;
    for (const id of ["m-ai", "m-assistant"]) { const m = $(id); if (m && !m.hidden) closeSimpleModal(m); }
    loadSettingsForm(); openSimpleModal("m-settings");
  }
  function openParamReview() {
    if (!$("m-ai")) return;
    for (const id of ["m-settings", "m-assistant"]) { const m = $(id); if (m && !m.hidden) closeSimpleModal(m); }
    syncAiStatusUi(); renderAiResults(); openSimpleModal("m-ai");
  }
  if ($("ai-key-toggle")) $("ai-key-toggle").onclick = () => { const inp = $("ai-key"); inp.type = inp.type === "password" ? "text" : "password"; syncAiStatusUi(); };
  if ($("ai-model")) $("ai-model").onchange = () => { $("ai-model-custom").disabled = $("ai-model").value !== "custom"; if ($("ai-model").value === "custom") $("ai-model-custom").focus(); };
  if ($("ai-save")) $("ai-save").onclick = () => {
    if (!persistSettingsFromForm()) return;
    if (aiCfg.apiKey && !/^sk-ant-/i.test(aiCfg.apiKey)) setStatusEl("set-status", T("Saved. Note: Anthropic keys normally start with \"sk-ant-\".","Salvo. Atenção: chaves da Anthropic normalmente começam com \"sk-ant-\"."), "info");
    else setStatusEl("set-status", aiCfg.apiKey ? T("Saved in this browser.","Salvo neste navegador.") : T("Saved. No key: the assistant uses the panel engine only.","Salvo. Sem chave: o assistente usa só o motor do painel."), "ok");
  };
  if ($("ai-clear")) $("ai-clear").onclick = () => {
    aiCfg.apiKey = ""; $("ai-key").value = ""; saveAiCfg();
    try { localStorage.removeItem(AI_OLD_KEY_STORAGE); } catch (e) {}
    syncAiStatusUi();
    setStatusEl("set-status", T("Key removed from this browser.","Chave removida deste navegador."), "info");
  };
  if ($("ai-open-asst")) $("ai-open-asst").onclick = () => { if (!persistSettingsFromForm()) return; closeSimpleModal($("m-settings")); if (typeof openAssistant === "function") openAssistant(); };
  if ($("ai-open-review")) $("ai-open-review").onclick = () => { if (!persistSettingsFromForm()) return; openParamReview(); };
  if ($("openSettings")) $("openSettings").onclick = openAiSettings;
  // The topbar "assistant" entry opens the assistant panel; without that module it opens the parameter review.
  if ($("openAI")) $("openAI").onclick = () => { if (typeof openAssistant === "function") openAssistant(); else openParamReview(); };
  if ($("aiGoSettings")) $("aiGoSettings").onclick = openAiSettings;
  if ($("aiModes")) $("aiModes").addEventListener("click", e => {
    const b = e.target.closest("[data-aimode]"); if (!b) return;
    aiMode = b.dataset.aimode;
    $("aiModes").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
  });

  // ---------- Request path ----------
  // Turns a failed call into one specific sentence. `detail` is the server's own message (plain text; callers
  // must put it on screen with textContent or esc()).
  function aiErrorText(err) {
    const st = err && err.status, detail = err && err.detail ? ` ${T("Server message","Mensagem do servidor")}: ${String(err.detail).slice(0, 300)}` : "";
    if (err && err.name === "AbortError") return T("Request cancelled.","Pedido cancelado.");
    if (err && err.code === "nokey") return T("No API key saved. Add one in \"Key and model\".","Sem chave de API salva. Adicione em \"Chave e modelo\".");
    if (err && err.code === "endpoint") return T("The saved API address is not valid. Check it in \"Key and model\".","O endereço da API salvo não é válido. Confira em \"Chave e modelo\".");
    if (err && err.code === "refusal") return T("The model declined to answer this request.","O modelo se recusou a responder a este pedido.");
    if (err && err.code === "empty") return err.message;
    if (st === 401) return T("The API rejected the key (401). Check the key in \"Key and model\".","A API recusou a chave (401). Confira a chave em \"Chave e modelo\".") + detail;
    if (st === 403) return T("The API refused access (403): this key has no permission for this request.","A API negou o acesso (403): esta chave não tem permissão para este pedido.") + detail;
    if (st === 404) return T(`The API did not find the model "${activeAiModel()}" (404). Choose another model in "Key and model".`,`A API não encontrou o modelo "${activeAiModel()}" (404). Escolha outro modelo em "Chave e modelo".`) + detail;
    if (st === 413) return T("The request was too large (413).","O pedido ficou grande demais (413).") + detail;
    if (st === 429) return T("Rate limit or credit limit reached (429). Wait a moment and try again.","Limite de uso ou de crédito atingido (429). Aguarde um pouco e tente de novo.") + detail;
    if (st === 400) return T("The API did not accept the request (400).","A API não aceitou o pedido (400).") + detail;
    if (st === 529 || st >= 500) return T(`The API is unavailable or overloaded (${st}). Try again later.`,`A API está indisponível ou sobrecarregada (${st}). Tente mais tarde.`) + detail;
    if (st) return T(`The API answered with an error (${st}).`,`A API respondeu com erro (${st}).`) + detail;
    return aiNetText();
  }
  // The request never left the page (fetch threw). Say the most likely reason for THIS page instead of a generic line.
  // A direct call from a file opened in Chrome/Edge reaches api.anthropic.com (checked: it answers 401 to a bad key),
  // so the usual culprit is where the page is running: an embedded preview that blocks outside connections.
  function aiEmbedded() {
    try { if (window.top !== window.self) return true; } catch (e) { return true; }
    return !/^(file|https?):$/.test(location.protocol);
  }
  function aiNetText() {
    if (navigator.onLine === false) return T("This computer is offline. Connect to the internet and try again.","Este computador está sem internet. Conecte e tente de novo.");
    if (aiEmbedded()) return T(
      "This panel is open inside a preview window that blocks connections to outside addresses, so the request never left the page. Download the file, open it directly in Chrome or Edge (double-click), and test again there. The panel engine keeps working here without a key.",
      "O painel está aberto dentro de uma janela de pré-visualização que bloqueia conexões externas, então o pedido nem saiu da página. Baixe o arquivo, abra direto no Chrome ou no Edge (dois cliques) e teste de novo por lá. O motor do painel continua funcionando aqui sem chave.");
    return T(
      `The request did not reach ${aiHost()}. Something between this browser and the API blocked it: usually an ad or privacy blocker extension, a company network or proxy, or an antivirus. Try a private window with extensions off, or another network. The panel engine keeps working without a key.`,
      `O pedido não chegou a ${aiHost()}. Algo entre este navegador e a API bloqueou: em geral uma extensão bloqueadora de anúncios ou de privacidade, a rede ou o proxy da empresa, ou o antivírus. Tente uma janela anônima sem extensões ou outra rede. O motor do painel continua funcionando sem chave.`);
  }
  const aiErr = (code, message) => Object.assign(new Error(message || code), { code });

  async function callAnthropic({ system, userPrompt, maxTokens = 16384, outputConfig = null, signal }) {
    const key = cleanApiKey(aiCfg.apiKey);
    if (!key) throw aiErr("nokey", T("No API key saved.","Sem chave de API salva."));
    const endpoint = aiCfg.endpoint || DEFAULT_AI_CFG.endpoint;
    if (!aiEndpointOk(endpoint)) throw aiErr("endpoint");
    const send = async (cfg) => {
      const payload = { model: activeAiModel(), max_tokens: maxTokens, system, messages: [{ role: "user", content: userPrompt }] };
      if (cfg) payload.output_config = cfg;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify(payload),
        signal
      });
      const data = await res.json().catch(() => null);
      return { res, data };
    };
    let { res, data } = await send(outputConfig);
    // A model or proxy that rejects output_config with HTTP 400 gets one retry without it.
    if (!res.ok && res.status === 400 && outputConfig) ({ res, data } = await send(null));
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      err.detail = data && data.error && typeof data.error.message === "string" ? data.error.message : "";
      throw err;
    }
    if (!data || typeof data !== "object" || !Array.isArray(data.content)) {
      throw aiErr("empty", T("The API answer could not be read (it was not the expected JSON).","Não foi possível ler a resposta da API (não veio no JSON esperado)."));
    }
    if (data.stop_reason === "refusal") throw aiErr("refusal");
    const text = data.content.filter(b => b && b.type === "text" && typeof b.text === "string").map(b => b.text).join("\n").trim();
    if (!text) {
      throw aiErr("empty", data.stop_reason === "max_tokens"
        ? T("The model used the whole token budget before writing an answer. Try again.","O modelo consumiu todo o limite de tokens antes de escrever a resposta. Tente de novo.")
        : T("The model returned an empty answer.","O modelo devolveu uma resposta vazia."));
    }
    return { text, model: typeof data.model === "string" ? data.model : activeAiModel(), stopReason: data.stop_reason || "", usage: data.usage || null };
  }

  // Lists the model IDs this key can use (GET /v1/models) and adds them to the model picker.
  async function discoverAccountModels() {
    const key = cleanApiKey(aiCfg.apiKey);
    if (!key || !aiEndpointOk(aiCfg.endpoint)) return [];
    const base = aiCfg.endpoint.replace(/\/v1\/messages\/?$/, "/v1/models");
    const res = await fetch(base, { method: "GET", headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" } });
    if (!res.ok) return [];
    const d = await res.json().catch(() => ({}));
    const list = Array.isArray(d && d.data) ? d.data.filter(m => m && typeof m.id === "string").map(m => ({ id: m.id, name: typeof m.display_name === "string" ? m.display_name : m.id })) : [];
    const sel = $("ai-model");
    if (list.length && sel) {
      const cu = sel.querySelector('option[value="custom"]'), existing = new Set([...sel.options].map(o => o.value));
      list.forEach(m => { if (existing.has(m.id)) return; const o = document.createElement("option"); o.value = m.id; o.textContent = `${m.name} (${m.id})`; sel.insertBefore(o, cu); existing.add(m.id); });
    }
    return list;
  }

  if ($("ai-test")) $("ai-test").onclick = async () => {
    // A blocked localStorage must not stop the test: the key is still held in memory for this page.
    if (!persistSettingsFromForm() && !aiEndpointOk($("ai-endpoint").value.trim() || DEFAULT_AI_CFG.endpoint)) return;
    if (!aiHasKey()) { setStatusEl("set-status", T("Type a key first.","Digite uma chave primeiro."), "err"); return; }
    setStatusEl("set-status", T(`Testing ${activeAiModel()} (sends one short request)...`,`Testando ${activeAiModel()} (envia um pedido curto)...`), "info");
    const t0 = performance.now();
    try {
      const r = await callAnthropic({ system: "Reply with the single word OK.", userPrompt: "Ping", maxTokens: 512, outputConfig: { effort: "low" } });
      setStatusEl("set-status", T(`Connection works: ${r.model} answered in ${Math.round(performance.now() - t0)} ms.`,`Conexão funcionando: ${r.model} respondeu em ${Math.round(performance.now() - t0)} ms.`), "ok");
    } catch (err) {
      let extra = "";
      if (err.status === 404) {
        const models = await discoverAccountModels().catch(() => []);
        if (models.length) extra = " " + T(`Models available to this key were added to the list (${models.length}).`,`Os modelos disponíveis para esta chave foram adicionados à lista (${models.length}).`);
      }
      setStatusEl("set-status", T("Test failed. ","O teste falhou. ") + aiErrorText(err) + extra, "err");
    }
  };

  // ---------- Snapshot sent with a parameter-review request ----------
  // Describes what the panel shows now. It never contains the API key or any other setting of this module.
  function buildDashboardSnapshot() {
    const i = week - 1, bt = backtest(week), t = totals(), d = DS();
    const avg = k => bt.length ? +(bt.reduce((s, r) => s + r[k], 0) / bt.length).toFixed(2) : null;
    const en = v => Array.isArray(v) ? v[0] : v;
    return {
      meta: {
        week, totalWeeks: W, language: lang, displayCurrency: ccy,
        fxRateBRLperUSD: FX_RATE, fxRateNote: "typed into the panel by the user, not checked against any source",
        selicPct: SELIC,
        weeklyDataSource: SRCINFO ? `user data (${SRCINFO.kind === "manual" ? "typed in the panel" : "file"}: ${SRCINFO.name})` : "example data shipped with the prototype",
        dataset: { id: datasetId, name: en(d.name), description: en(d.desc) }
      },
      step1_pilot_program: {
        inScopeSpendBnBRL: +(SPEND / 1000).toFixed(2), supplierBase: BASE_SUP,
        pilotAssumptions: { tenorDays: PILOT.tenor, spreadPctPerYear: PILOT.spread },
        currentWeekKPIs: { spendUnderProgramPct: D.spend[i], activeSuppliers: D.active[i], utilizationPct: D.util[i], daysToFirstDiscount: D.days[i], balanceMiBRL: D.bal[i], annualizedSpreadRevenueMiBRL: rev[i], forecastErrorPct: D.err[i], shareOfWalletPct: D.sow[i], openRiskFlags: D.flags[i] },
        onboardingFunnelExample: { steps: STEPS.map(s => s[0]), before: F.before, afterDocumentAI: F.after },
        recentAlerts: ALERTS.filter(a => a[0] <= week).map(a => ({ week: a[0], text: a[2][0] }))
      },
      step2_forecast_and_limit: {
        approvedLimitMiBRL: Math.round(limitBRL), scenario: curScenario, horizonWeeks: curHorizon,
        projectedEndMiBRL: Math.round(FS.end), projectedPeakTopOfRangeMiBRL: Math.round(FS.peakHigh),
        headroomMiBRL: Math.round(FS.lim - FS.peakHigh), backtestAvgModelErrorPct: avg("model"), backtestAvgNaiveErrorPct: avg("flat")
      },
      step3_anchor_pipeline: {
        dataset: { id: datasetId, name: en(d.name), revenueBasis: en(d.revTag) },
        pipelineAssumptions: { tenorDays: G.tenor, spreadPctPerYear: G.spread },
        totals: { eligibleBnBRL: +t.elig.toFixed(2), annualFlowBnBRL: +t.flow.toFixed(2), avgBalanceMiBRL: Math.round(t.bal), annualSpreadRevenueMiBRL: +t.rev.toFixed(2) },
        anchors: ANCHORS.map((a, idx) => {
          const o = { id: a.id, name: a.name, revenueBaseBnBRL: a.rev };
          if (a.q3 != null) o.latestQuarterRevenueBnBRL = a.q3;
          if (a.q3Note) o.revenueNote = en(a.q3Note);
          o.params = { addr: P[idx].addr, cov: P[idx].cov, adh: P[idx].adh, util: P[idx].util };
          o.sized = { eligBnBRL: +eligOf(idx).toFixed(2), flowBnBRL: +flowOf(idx).toFixed(2), balMiBRL: Math.round(balOf(flowOf(idx))) };
          return o;
        })
      },
      step4_market: {
        warning: "FABRICATED for the prototype: funder amounts, shares, price bands, ratings and signals do not describe real funding relationships",
        dataset: { id: datasetId, name: en(d.name), funderAmountUnit: d.matrixUnit === "flow" ? "annual flow, BRL m" : "balance, BRL m" },
        simulatedSpreadCDIplusPct: mktSpread,
        fundersByAnchor: COMP_DATA.map(c => { const o = { id: c.id }; FUNDERS.forEach(f => { o[f.k] = c[f.k] || 0; }); if (typeof c.gap === "number") o.openGap = c.gap; return o; }),
        priceBandsCDIplusPct: PRICE_TIERS.map(p => ({ rating: p.code, anchors: p.anchors, min: p.min, median: p.med, max: p.max, fidc: p.fidc })),
        lossReasonsPct: RM_LOSS.map(r => ({ reason: en(r.lbl), pct: r.pct })),
        health: EXT_HEALTH.map(h => ({ id: h.id, rating: h.rating, outlook: en(h.outlook), eDuplicataPct: h.dupPct }))
      }
    };
  }

  // ---------- Reading the model's answer ----------
  function extractJsonPayload(raw) {
    const cleaned = (raw || "").trim();
    const asObj = v => (v && typeof v === "object" && !Array.isArray(v)) ? v : null;
    const tryParse = s => { try { return asObj(JSON.parse(s)); } catch (_) { return null; } };
    let o = tryParse(cleaned);
    if (!o) { const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i); if (fenced) o = tryParse(fenced[1].trim()); }
    if (!o) {
      const start = cleaned.indexOf("{"), end = cleaned.lastIndexOf("}");
      if (start >= 0 && end > start) { const slice = cleaned.slice(start, end + 1); o = tryParse(slice) || tryParse(slice.replace(/,\s*([}\]])/g, "$1")); }
    }
    if (o) return o;
    // Not JSON: keep the readable text (shown escaped, with a notice) and no parameter proposals.
    return { executive_summary: cleaned.slice(0, 6000), predictions_feedback: "", key_insights: [], recommended_actions: [], parameter_updates: [], _unstructured: true };
  }

  // ---------- Allowed parameters, ranges and locale-aware numbers ----------
  // A proposal is accepted for review only when its name is in this list and its value passes the rule.
  // Out-of-range values are rejected (never silently clamped) and listed with the reason.
  const aiHorizons = () => { const g = $("horizonGroup"); const v = g ? [...g.querySelectorAll("[data-hz]")].map(b => +b.dataset.hz) : []; return v.length ? v : [4, 8, 13]; };
  const pctFmt = (v, d) => nf(v, d) + "%";
  function aiParamSpecs() {
    const specs = [
      { key:"dataset", step:"3-4", label:T("Dataset for Steps 3 and 4","Conjunto de dados das Etapas 3 e 4"), kind:"enum", values:Object.keys(DATASETS),
        get:() => datasetId, set:v => setDataset(v, true), fmt:v => DATASETS[v] ? L(DATASETS[v].name) : String(v) },
      { key:"spendBn", step:"1", label:T("In-scope spend (pilot)","Compras no escopo (piloto)"), kind:"num", range:PARAM_RANGE.spend, d:2, unit:"bn",
        get:() => +(SPEND / 1000).toFixed(2), set:v => { SPEND = v * 1000; }, fmt:v => bn(v, 2) },
      { key:"baseSup", step:"1", label:T("Supplier base (pilot)","Base de fornecedores (piloto)"), kind:"num", range:[minBase(), PARAM_RANGE.base[1]], d:0,
        get:() => BASE_SUP, set:v => { BASE_SUP = v; }, fmt:v => nf(v) },
      { key:"pilotTenor", step:"1-2", label:T("Pilot: average days discounted","Piloto: prazo médio descontado"), kind:"num", range:PARAM_RANGE.tenor, d:1,
        get:() => PILOT.tenor, set:v => { PILOT.tenor = v; }, fmt:v => nf(v, v % 1 ? 1 : 0) + T(" days"," dias") },
      { key:"pilotSpread", step:"1-2", label:T("Pilot: annual spread","Piloto: spread anual"), kind:"num", range:PARAM_RANGE.spread, d:2,
        get:() => PILOT.spread, set:v => { PILOT.spread = v; }, fmt:v => pctFmt(v, 2) },
      { key:"fxRate", step:"1-4", label:T("FX rate (R$ per US$)","Câmbio (R$ por US$)"), kind:"num", range:[FX_MIN, FX_MAX], d:4,
        get:() => FX_RATE, set:v => { setFxRate(v); }, fmt:v => Number(v).toLocaleString(loc(), {minimumFractionDigits:2, maximumFractionDigits:4}) },
      { key:"limitBRL", step:"2", label:T("Approved limit","Limite aprovado"), kind:"num", range:LIMIT_RANGE, d:0, unit:"mi",
        get:() => Math.round(limitBRL), set:v => { limitBRL = v; }, fmt:v => money(v) },
      { key:"scenario", step:"2", label:T("Forecast scenario","Cenário de projeção"), kind:"enum", values:Object.keys(multipliers),
        get:() => curScenario, set:v => { curScenario = v; if (typeof scen !== "undefined") scen = v; }, fmt:v => I18N["sc." + v] ? scName(v) : String(v) },
      { key:"horizon", step:"2", label:T("Forecast horizon","Horizonte de projeção"), kind:"enum", values:aiHorizons(), numeric:true,
        get:() => curHorizon, set:v => { curHorizon = v; }, fmt:v => v + T(" weeks"," semanas") },
      { key:"tenor", step:"3", label:T("Pipeline: average days discounted","Pipeline: prazo médio descontado"), kind:"num", range:[15, 360], d:0,
        get:() => G.tenor, set:v => { G.tenor = v; }, fmt:v => nf(v, v % 1 ? 1 : 0) + T(" days"," dias") },
      { key:"spread", step:"3", label:T("Pipeline: annual spread","Pipeline: spread anual"), kind:"num", range:[0.4, 5], d:2,
        get:() => G.spread, set:v => { G.spread = v; }, fmt:v => pctFmt(v, 2) },
      { key:"mktSpread", step:"4", label:T("Simulated proposal spread (CDI + x)","Spread simulado da proposta (CDI + x)"), kind:"num", range:[0.6, 2.6], d:2,
        get:() => mktSpread, set:v => { mktSpread = v; }, fmt:v => "CDI + " + pctFmt(v, 2) }
    ];
    const fl = { addr:T("addressable share","parcela endereçável"), cov:T("coverage","cobertura"), adh:T("adoption","adesão"), util:T("utilization","utilização") };
    ANCHORS.forEach((a, idx) => {
      for (const k of ["addr", "cov", "adh", "util"]) specs.push({
        key:`${a.id}.${k}`, step:"3", label:`${a.name}: ${fl[k]}`, kind:"num", range:[k === "addr" ? 0.5 : 5, 100], d:k === "addr" ? 1 : 0,
        get:() => P[idx][k], set:v => { P[idx][k] = v; }, fmt:v => pctFmt(v, v % 1 ? 1 : 0)
      });
    });
    return specs;
  }
  const AI_PARAM_ENUM = aiParamSpecs().map(s => s.key);

  // Reads a number the model may have written as text: "1,2", "1.234,56", "R$ 500 mi", "US$ 1.2bn", "75 dias", "40%".
  // Returns every plausible reading (the separator is ambiguous in "1,234"); the caller keeps the one in range.
  // `unit` is the unit the parameter is stored in ("mi" or "bn"): a value written in the other unit is converted.
  function aiNumberReadings(raw, unit) {
    if (typeof raw === "number") return isFinite(raw) ? [raw] : [];
    if (typeof raw !== "string") return [];
    let s = raw.trim().toLowerCase().replace(/−/g, "-");
    if (!s || s.length > 40) return [];
    let mult = 1;
    const um = s.match(/(?<![a-zà-ú])(bilh[õo]es|bilh[ãa]o|billions?|bn|bi|milh[õo]es|milh[ãa]o|millions?|mi|mm|m)\s*$/);
    if (um && unit) {
      const isBn = /^b/.test(um[1]);
      if (unit === "mi" && isBn) mult = 1000;
      if (unit === "bn" && !isBn) mult = 0.001;
    }
    s = s.replace(/r\$|us\$|\$|brl|usd|cdi\s*\+|%|a\.a\.|p\.a\./g, " ").replace(/[a-zà-ú.]*[a-zà-ú]+\s*$/, " ").trim().replace(/\s+/g, "");
    if (!/^[+-]?[\d.,]+$/.test(s)) return [];
    const out = [];
    for (const sep of [",", ";"]) { const n = parseLocaleNumber(s, sep); if (isFinite(n) && !out.includes(n * mult)) out.push(n * mult); }
    return out;
  }

  // Turns the model's parameter_updates into two lists: diffs that can be reviewed and rejected proposals.
  function collectParamDiffs(rawUpdates) {
    const diffs = [], rejected = [];
    let items = [];
    if (Array.isArray(rawUpdates)) items = rawUpdates;
    else if (rawUpdates && typeof rawUpdates === "object") {
      // Older object shape: {param: value | {value, reason}, anchors: {id: {field: value}}}
      for (const [k, v] of Object.entries(rawUpdates)) {
        if (k === "anchors" && v && typeof v === "object") { for (const [aid, fields] of Object.entries(v)) if (fields && typeof fields === "object") for (const [f, fv] of Object.entries(fields)) items.push({ param: `${aid}.${f}`, value: fv && typeof fv === "object" ? fv.value : fv, reason: fv && typeof fv === "object" ? fv.reason : "" }); }
        else items.push({ param: k, value: v && typeof v === "object" ? v.value : v, reason: v && typeof v === "object" ? v.reason : "" });
      }
    }
    const specs = aiParamSpecs(), seen = new Set();
    const rf = v => Number(v).toLocaleString(loc(), {maximumFractionDigits: 2});
    const shown = v => { const s = typeof v === "string" ? v : (typeof v === "number" || typeof v === "boolean") ? String(v) : v == null ? "" : JSON.stringify(v); return (s || "").slice(0, 60); };
    items.slice(0, 60).forEach(item => {
      if (!item || typeof item !== "object") return;
      const name = aiStr(item.param).trim().slice(0, 60), reason = aiStr(item.reason).slice(0, 400), val = item.value;
      if (!name) return;
      const spec = specs.find(s => s.key === name) || specs.find(s => s.key.toLowerCase() === name.toLowerCase().replace(/^anchors?\./, ""));
      const rej = why => rejected.push({ name: spec ? spec.label : name, value: shown(val), why, reason });
      if (!spec) return rej(T("not an editable parameter of this panel","não é um parâmetro editável deste painel"));
      if (seen.has(spec.key)) return rej(T("proposed more than once; only the first is kept","proposto mais de uma vez; só o primeiro vale"));
      seen.add(spec.key);
      let next = null;
      if (spec.kind === "enum") {
        const txt = aiStr(val).trim();
        const hit = spec.values.find(x => String(x).toLowerCase() === txt.toLowerCase())
          ?? (spec.numeric ? spec.values.find(x => aiNumberReadings(txt).includes(x)) : undefined)
          ?? (spec.key === "dataset" ? spec.values.find(x => DATASETS[x].name.some(n => n.toLowerCase() === txt.toLowerCase())) : undefined);
        if (hit === undefined) return rej(T(`not one of the accepted values (${spec.values.map(spec.fmt).join(", ")})`,`não é um dos valores aceitos (${spec.values.map(spec.fmt).join(", ")})`));
        next = hit;
      } else {
        const [lo, hi] = spec.range, reads = aiNumberReadings(val, spec.unit);
        if (!reads.length) return rej(T("the value is not a number","o valor não é um número"));
        const inRange = reads.find(n => n >= lo && n <= hi);
        if (inRange === undefined) return rej(T(`outside the accepted range (${rf(lo)} to ${rf(hi)})`,`fora da faixa aceita (${rf(lo)} a ${rf(hi)})`));
        next = +inRange.toFixed(spec.d);
        if (next < lo || next > hi) next = clampNum(next, lo, hi);
      }
      const cur = spec.get();
      const same = spec.kind === "enum" ? cur === next : Math.abs(cur - next) < 1e-9;
      diffs.push({ key: spec.key, step: spec.step, label: spec.label, cur, next, same, curDisp: spec.fmt(cur), nextDisp: spec.fmt(next), reason, apply: () => spec.set(next) });
    });
    return { diffs, rejected };
  }

  // ---------- Applying and undoing ----------
  // Everything a diff (or the presentation note) can change, so one undo restores it exactly.
  function captureUndoSnapshot() {
    return {
      SPEND, BASE_SUP, limitBRL, curScenario, curHorizon, mktSpread, aiDeckNote, datasetId, FX_RATE,
      scen: typeof scen !== "undefined" ? scen : null,
      PILOT: { ...PILOT }, G: { ...G }, P: P.map(p => ({ ...p }))
    };
  }
  // Redraws every module from the state and saves the parameters (persistence listens on the refresh bus).
  function aiAfterStateChange() {
    BASE_SUP = Math.max(BASE_SUP, minBase());
    if (typeof syncParamControls === "function") syncParamControls();
    if (typeof refreshAll === "function") refreshAll();
    if (typeof syncParamInputs === "function") syncParamInputs(true);
    if (typeof saveParams === "function") saveParams();
    touch();
    syncAiStatusUi();
  }
  // Applies the given diffs as ONE undoable step. The dataset goes first because switching it resets
  // untouched addressable shares to the defaults of the new set.
  function applyDiffList(diffs) {
    const list = (diffs || []).filter(d => d && !d.same);
    if (!list.length) return 0;
    aiUndoStack.push(captureUndoSnapshot());
    if (aiUndoStack.length > 30) aiUndoStack.shift();
    list.slice().sort((a, b) => (b.key === "dataset") - (a.key === "dataset")).forEach(d => d.apply());
    aiAfterStateChange();
    return list.length;
  }
  function restoreUndoSnapshot(s) {
    if (s.datasetId !== datasetId) setDataset(s.datasetId, true);
    SPEND = s.SPEND; BASE_SUP = s.BASE_SUP; limitBRL = s.limitBRL;
    curScenario = s.curScenario; curHorizon = s.curHorizon; mktSpread = s.mktSpread;
    if (s.scen !== null && typeof scen !== "undefined") scen = s.scen;
    aiDeckNote = s.aiDeckNote || "";
    Object.assign(PILOT, s.PILOT); Object.assign(G, s.G);
    s.P.forEach((p, idx) => Object.assign(P[idx], p));
    FX_RATE = s.FX_RATE;
    aiAfterStateChange();
  }
  if ($("aiUndoBtn")) $("aiUndoBtn").onclick = () => {
    const s = aiUndoStack.pop(); if (!s) return;
    restoreUndoSnapshot(s);
    renderAiResults();
    setStatusEl("aiRunStatus", T("Previous values restored.","Valores anteriores restaurados."), "info");
  };

  // ---------- Output ----------
  // Short note above the week summary of Step 1, only after a parameter-review answer. The user can dismiss it.
  function renderAiBriefingBanner() {
    const box = $("aiLiveBriefing"); if (!box) return;
    const sum = lastAiResult && !lastAiResult._dismissed ? aiStr(lastAiResult.executive_summary).trim() : "";
    if (!sum) { box.hidden = true; box.innerHTML = ""; return; }
    box.hidden = false;
    box.innerHTML = `<div class="ai-live-head">
      <span class="ai-live-pill">${esc(lastAiResult._model || aiModelLabel())} · ${T("model output, may be wrong","resposta de modelo, pode estar errada")}</span>
      <span class="mbtns"><button type="button" class="sig-route-btn" id="openAiFromBrief">${T("Open suggestions","Abrir sugestões")}</button>
      <button type="button" class="sig-route-btn" id="dismissAiBrief">${T("Hide","Ocultar")}</button></span>
    </div><div>${esc(sum.slice(0, 900))}</div>`;
    $("openAiFromBrief").onclick = openParamReview;
    $("dismissAiBrief").onclick = () => { lastAiResult._dismissed = true; renderAiBriefingBanner(); };
  }

  function renderAiResults() {
    const box = $("aiResults"); if (!box) return;
    if (!lastAiResult) { box.innerHTML = ""; return; }
    const r = lastAiResult, { diffs, rejected } = collectParamDiffs(r.parameter_updates);
    const applied = r._applied || (r._applied = []);
    const tag = `<span class="ai-tag">${esc(r._model || aiModelLabel())}</span>`;
    let html = `<p class="ai-caveat">${T("Model output. It can be wrong or cite numbers that are not in the panel: check each statement against the panel before using it.","Resposta de modelo. Pode estar errada ou citar números que não estão no painel: confira cada afirmação com o painel antes de usar.")}</p>`;
    if (r._unstructured) html += `<p class="ai-caveat warn">${T("The answer did not come in the requested format, so it is shown as plain text and there are no parameter proposals.","A resposta não veio no formato pedido; por isso aparece como texto simples e não há propostas de parâmetros.")}</p>`;
    const sum = aiStr(r.executive_summary).trim(), fb = aiStr(r.predictions_feedback).trim();
    if (sum) html += `<div class="ai-sec"><h4><span>${T("Summary","Resumo")}</span>${tag}</h4><p class="ai-pre">${esc(sum)}</p></div>`;
    if (fb) html += `<div class="ai-sec"><h4><span>${T("Forecast and limit","Projeção e limite")}</span></h4><p class="ai-pre">${esc(fb)}</p></div>`;
    const ins = Array.isArray(r.key_insights) ? r.key_insights.filter(x => x && typeof x === "object").slice(0, 12) : [];
    if (ins.length) {
      html += `<div class="ai-sec"><h4><span>${T("Comments","Comentários")}</span></h4>
        <div class="ai-insight-grid">${ins.map(x => {
          const imp = aiStr(x.impact).toLowerCase();
          const cls = /high|risk|alt|risco/.test(imp) ? "high" : /pos|opp|opor/.test(imp) ? "pos" : "med";
          return `<div class="ai-insight-card"><div class="ai-meta-tags">${aiStr(x.step) ? `<span class="ai-tag">${esc(aiStr(x.step).slice(0, 40))}</span>` : ""}${aiStr(x.impact) ? `<span class="ai-tag ${cls}">${esc(aiStr(x.impact).slice(0, 40))}</span>` : ""}</div><strong>${esc(aiStr(x.title))}</strong><p>${esc(aiStr(x.detail))}</p></div>`;
        }).join("")}</div></div>`;
    }
    const acts = Array.isArray(r.recommended_actions) ? r.recommended_actions.slice(0, 12) : [];
    if (acts.length) {
      html += `<div class="ai-sec"><h4><span>${T("Suggested actions","Ações sugeridas")}</span></h4>
        <ol class="ai-acts">${acts.map(a => {
          if (typeof a === "string") return `<li>${esc(a)}</li>`;
          if (!a || typeof a !== "object") return "";
          const own = aiStr(a.owner), why = aiStr(a.rationale);
          return `<li><b>${esc(aiStr(a.action) || aiStr(a.title))}</b>${own ? ` <i>(${esc(own)})</i>` : ""}${why ? `: ${esc(why)}` : ""}</li>`;
        }).join("")}</ol></div>`;
    }
    if (diffs.length) {
      const open = diffs.filter(d => !d.same).length;
      html += `<div class="ai-sec"><h4><span>${T("Proposed parameter changes","Mudanças de parâmetros propostas")}</span><span class="ai-tag ${open ? "med" : "pos"}">${open ? T(`${open} to review`,`${open} para revisar`) : T("nothing pending","nada pendente")}</span></h4>
        <p class="ai-sub">${T("Nothing is applied automatically. Accept one row at a time; each accepted change can be undone.","Nada é aplicado automaticamente. Aceite uma linha de cada vez; cada mudança aceita pode ser desfeita.")}</p>
        <div class="proof-table-wrap"><table class="ai-diff-table"><thead><tr><th>${T("Step","Etapa")}</th><th>${T("Parameter","Parâmetro")}</th><th>${T("Now","Agora")}</th><th>${T("Proposed","Proposto")}</th><th>${T("Reason given by the model","Motivo dado pelo modelo")}</th><th></th></tr></thead><tbody>
        ${diffs.map((d, idx) => {
          const done = d.same && applied.includes(d.key);
          const act = done ? `<span class="ai-done">${T("Accepted","Aceita")}</span>` : d.same ? `<span class="ai-same">${T("Already this value","Já está neste valor")}</span>` : `<button type="button" class="mbtn ai-acc" data-idx="${idx}" aria-label="${esc(T("Accept","Aceitar") + ": " + d.label)}">${T("Accept","Aceitar")}</button>`;
          return `<tr${d.same ? ' class="is-same"' : ""}><td><span class="ai-tag">${esc(d.step)}</span></td><td><b>${esc(d.label)}</b></td><td><span class="${d.same ? "" : "val-old"}">${esc(d.curDisp)}</span></td><td><span class="val-new">${esc(d.nextDisp)}</span></td><td class="ai-why">${esc(d.reason)}</td><td class="ai-act">${act}</td></tr>`;
        }).join("")}
        </tbody></table></div></div>`;
    }
    if (rejected.length) {
      html += `<div class="ai-sec"><h4><span>${T("Proposals not accepted for review","Propostas não aceitas para revisão")}</span><span class="ai-tag high">${rejected.length}</span></h4>
        <ul class="ai-rej">${rejected.map(x => `<li><b>${esc(x.name)}</b> = <code>${esc(x.value)}</code>: ${esc(x.why)}.</li>`).join("")}</ul></div>`;
    }
    const note = aiStr(r.deck_note).trim().slice(0, 400);
    if (note) {
      const on = aiDeckNote === note;
      html += `<div class="ai-sec"><h4><span>${T("Note for the presentation (optional)","Nota para a apresentação (opcional)")}</span></h4>
        <p class="ai-pre">${esc(note)}</p>
        <p class="ai-sub">${T("If you accept, this model-written sentence replaces the subtitle of the first slide and is marked as AI text there. Read it first.","Se você aceitar, esta frase escrita pelo modelo substitui o subtítulo do primeiro slide e fica marcada lá como texto de IA. Leia antes.")}</p>
        <div class="mbtns">${on ? `<span class="ai-done">${T("In use on the slides","Em uso nos slides")}</span>` : `<button type="button" class="mbtn" id="aiUseNote">${T("Use on the slides","Usar nos slides")}</button>`}
        ${aiDeckNote ? `<button type="button" class="mbtn" id="aiDropNote">${T("Remove note from the slides","Tirar a nota dos slides")}</button>` : ""}</div></div>`;
    }
    box.innerHTML = html;
    box.querySelectorAll(".ai-acc").forEach(b => b.onclick = () => {
      const d = diffs[+b.dataset.idx]; if (!d) return;
      if (applyDiffList([d])) { applied.push(d.key); setStatusEl("aiRunStatus", T(`Accepted: ${d.label} is now ${d.nextDisp}.`,`Aceita: ${d.label} agora é ${d.nextDisp}.`), "ok"); }
      renderAiResults();
    });
    const setNote = v => { aiUndoStack.push(captureUndoSnapshot()); aiDeckNote = v; aiAfterStateChange(); if (typeof deck !== "undefined" && deck && !deck.hidden && typeof renderSlide === "function") renderSlide(); renderAiResults(); };
    if ($("aiUseNote")) $("aiUseNote").onclick = () => setNote(note);
    if ($("aiDropNote")) $("aiDropNote").onclick = () => setNote("");
  }

  // ---------- Request ----------
  const AI_RESPONSE_SCHEMA = {
    type: "object", additionalProperties: false,
    required: ["executive_summary","predictions_feedback","deck_note","key_insights","recommended_actions","parameter_updates"],
    properties: {
      executive_summary: { type: "string" }, predictions_feedback: { type: "string" }, deck_note: { type: "string" },
      key_insights: { type: "array", items: { type: "object", additionalProperties: false, required: ["step","impact","title","detail"],
        properties: { step: { type: "string" }, impact: { type: "string" }, title: { type: "string" }, detail: { type: "string" } } } },
      recommended_actions: { type: "array", items: { type: "object", additionalProperties: false, required: ["action","owner","rationale"],
        properties: { action: { type: "string" }, owner: { type: "string" }, rationale: { type: "string" } } } },
      parameter_updates: { type: "array", items: { type: "object", additionalProperties: false, required: ["param","value","reason"],
        properties: { param: { type: "string", enum: AI_PARAM_ENUM }, value: { type: "string" }, reason: { type: "string" } } } }
    }
  };
  if ($("aiAbortBtn")) $("aiAbortBtn").onclick = () => { if (aiAbort) aiAbort.abort(); };
  if ($("aiRunBtn")) $("aiRunBtn").onclick = async () => {
    if (!aiHasKey()) { setStatusEl("aiRunStatus", aiErrorText({ code: "nokey" }), "err"); return; }
    const snap = buildDashboardSnapshot(), langName = lang === "pt" ? "Brazilian Portuguese" : "English";
    const focus = {
      overview: "Comment on what the snapshot shows across the four steps and propose parameter changes only where the snapshot itself supports them.",
      forecast: "Focus on the balance forecast: backtest error against the naive baseline, scenario, horizon and room under the approved limit.",
      params: "Focus on the editable parameters: say which ones you would change, to what value and why, grounded in numbers from the snapshot.",
      exec: "Write a short summary for Corporate Banking / SCF leadership: what is working, what needs attention, next steps."
    };
    const specs = aiParamSpecs();
    const allowed = specs.map(s => s.kind === "enum" ? `"${s.key}": one of ${s.values.map(v => `"${v}"`).join(" | ")}` : `"${s.key}": ${s.range[0]} to ${s.range[1]}${s.unit === "bn" ? " (BRL bn)" : s.unit === "mi" ? " (BRL m)" : ""}`).join("\n  - ");
    const systemPrompt = `You review a supply chain finance (risco sacado, Brazil) weekly dashboard prototype for the specialist who runs it.
You receive a JSON snapshot of what the dashboard shows now. Important facts about the data:
- The weekly pilot series is example data unless meta.weeklyDataSource says it is user data.
- Everything under step4_market is fabricated for the prototype; treat it as illustrative, never as market fact.
- Company revenue figures are quoted public figures that the dashboard does not verify.
Use only numbers that are in the snapshot. If something is not in the snapshot, say so instead of guessing. Do not invent bank terms, deadlines or product conditions.
Return ONLY one JSON object with these fields:
- executive_summary: 2 to 4 sentences.
- predictions_feedback: comment on the forecast, the backtest error and the room under the approved limit.
- deck_note: one sentence that could be the subtitle of a presentation cover, or "" if you have none.
- key_insights: 3 to 6 objects { step, impact ("High" | "Opportunity" | "Risk"), title, detail }, each citing a number from the snapshot.
- recommended_actions: 3 to 5 objects { action, owner, rationale }.
- parameter_updates: objects { param, value, reason } only for parameters you would really change. The user reviews and accepts each one; values outside the ranges are discarded. value is a string. Allowed names and ranges:
  - ${allowed}
Write all prose in ${langName}.`;
    const extra = $("ai-prompt") ? $("ai-prompt").value.trim().slice(0, 1500) : "";
    const userPrompt = `FOCUS: ${focus[aiMode] || focus.overview}\n${extra ? `INSTRUCTION FROM THE USER: ${extra}\n` : ""}DASHBOARD SNAPSHOT (JSON):\n${JSON.stringify(snap)}`;
    aiAbort = new AbortController();
    $("aiRunBtn").disabled = true; if ($("aiAbortBtn")) $("aiAbortBtn").hidden = false;
    setStatusEl("aiRunStatus", T(`Waiting for ${aiModelLabel()}...`,`Aguardando ${aiModelLabel()}...`), "info");
    try {
      const resp = await callAnthropic({ system: systemPrompt, userPrompt, maxTokens: 16384, outputConfig: { effort: "medium", format: { type: "json_schema", schema: AI_RESPONSE_SCHEMA } }, signal: aiAbort.signal });
      const parsed = extractJsonPayload(resp.text);
      parsed._model = resp.model; parsed._applied = [];
      lastAiResult = parsed;
      const { diffs, rejected } = collectParamDiffs(parsed.parameter_updates), open = diffs.filter(d => !d.same).length;
      setStatusEl("aiRunStatus", T(`Answer received: ${open} change(s) to review${rejected.length ? `, ${rejected.length} discarded` : ""}. Nothing was applied.`,`Resposta recebida: ${open} mudança(s) para revisar${rejected.length ? `, ${rejected.length} descartada(s)` : ""}. Nada foi aplicado.`), "ok");
      renderAiBriefingBanner(); renderAiResults();
    } catch (err) {
      setStatusEl("aiRunStatus", aiErrorText(err), err.name === "AbortError" ? "info" : "err");
    } finally {
      aiAbort = null; if ($("aiAbortBtn")) $("aiAbortBtn").hidden = true; syncAiStatusUi();
    }
  };
