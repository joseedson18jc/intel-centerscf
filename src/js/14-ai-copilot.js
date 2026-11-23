  // ========== PERSISTENT ANTHROPIC SETTINGS & CLAUDE OPUS 5.5 COPILOT ==========
  const AI_KEY_STORAGE = "scf-ai-cfg";
  const DEFAULT_AI_CFG = { apiKey:"", model:"claude-opus-5-5", customModel:"", endpoint:"https://api.anthropic.com/v1/messages", autoApply:false };
  let aiCfg = { ...DEFAULT_AI_CFG };
  try {
    const raw = JSON.parse(localStorage.getItem(AI_KEY_STORAGE) || "null");
    if (raw && typeof raw === "object") aiCfg = { ...DEFAULT_AI_CFG, ...raw };
  } catch (e) {}
  let aiMode = "cross", aiAbort = null, lastAiResult = null, aiUndoSnap = null, aiDeckNote = "";
  const activeAiModel = () => (aiCfg.model === "custom" ? (aiCfg.customModel || "claude-opus-5-5").trim() : aiCfg.model) || "claude-opus-5-5";
  const AI_BRAND = "AI Analysis ON";
  const saveAiCfg = () => { try { localStorage.setItem(AI_KEY_STORAGE, JSON.stringify(aiCfg)); } catch (e) {} };
  const setStatusEl = (id, msg, cls = "info") => { const e = $(id); e.textContent = msg; e.className = "ai-status " + cls; };

  function syncAiStatusUi() {
    const hasKey = Boolean(aiCfg.apiKey && aiCfg.apiKey.trim());
    $("aiDot").classList.toggle("ready", hasKey);
    $("openSettings").classList.toggle("has-key", hasKey);
    $("aiModelTag").textContent = AI_BRAND;
    $("aiKeyState").textContent = hasKey
      ? T("Anthropic key saved in browser ✓","Chave Anthropic salva no navegador ✓")
      : T("No API key saved — configure in Settings","Sem chave salva — configure em Configurações");
    $("aiKeyState").style.color = hasKey ? "var(--green)" : "var(--amber)";
    $("aiUndoBtn").hidden = !aiUndoSnap;
    $("ai-prompt").placeholder = T(
      "e.g., Rebalance Embraer & Natura coverage after 3Q26 leverage, stress-test approved limit, and suggest optimal CDI+x spread...",
      "ex.: Rebalancear cobertura de Embraer e Natura após o 3T26, estressar limite aprovado e sugerir spread CDI+x ideal..."
    );
    $("ai-key-toggle").textContent = $("ai-key").type === "password" ? T("Show","Mostrar") : T("Hide","Ocultar");
    renderAiBriefingBanner();
    if (lastAiResult && !$("m-ai").hidden) renderAiResults();
  }
  const cleanApiKey = raw => String(raw || "").replace(/["'`]/g, "").trim().replace(/^Bearer\s+/i, "").replace(/\s+/g, "");
  function loadSettingsForm() {
    $("ai-key").value = aiCfg.apiKey || "";
    const opts = [...$("ai-model").options].map(o => o.value);
    $("ai-model").value = opts.includes(aiCfg.model) ? aiCfg.model : "custom";
    $("ai-model-custom").value = aiCfg.customModel || (opts.includes(aiCfg.model) && aiCfg.model !== "custom" ? "" : aiCfg.model);
    $("ai-model-custom").disabled = $("ai-model").value !== "custom";
    $("ai-endpoint").value = aiCfg.endpoint || DEFAULT_AI_CFG.endpoint;
    $("ai-autoapply").checked = !!aiCfg.autoApply;
    setStatusEl("set-status", "");
  }
  $("ai-key-toggle").onclick = () => {
    const inp = $("ai-key");
    inp.type = inp.type === "password" ? "text" : "password";
    $("ai-key-toggle").textContent = inp.type === "password" ? T("Show","Mostrar") : T("Hide","Ocultar");
  };
  function persistSettingsFromForm() {
    const cleanedKey = cleanApiKey($("ai-key").value);
    $("ai-key").value = cleanedKey;
    aiCfg = {
      apiKey: cleanedKey,
      model: $("ai-model").value,
      customModel: $("ai-model-custom").value.trim(),
      endpoint: ($("ai-endpoint").value.trim() || DEFAULT_AI_CFG.endpoint),
      autoApply: $("ai-autoapply").checked
    };
    saveAiCfg();
    syncAiStatusUi();
  }
  $("ai-model").onchange = () => { $("ai-model-custom").disabled = $("ai-model").value !== "custom"; persistSettingsFromForm(); };
  ["ai-key","ai-model-custom","ai-endpoint"].forEach(id => $(id).addEventListener("change", persistSettingsFromForm));
  $("ai-autoapply").onchange = persistSettingsFromForm;
  $("ai-save").onclick = () => {
    persistSettingsFromForm();
    if (aiCfg.apiKey && !/^sk-ant-/i.test(aiCfg.apiKey)) {
      setStatusEl("set-status", T(`Saved (${AI_BRAND}), note: Anthropic keys normally start with "sk-ant-".`,`Salvo (${AI_BRAND}), atenção: chaves Anthropic normalmente começam com "sk-ant-".`), "info");
    } else {
      setStatusEl("set-status", T(`Settings saved (${AI_BRAND}).`,`Configurações salvas (${AI_BRAND}).`), "ok");
    }
  };
  $("ai-clear").onclick = () => {
    aiCfg.apiKey = ""; $("ai-key").value = ""; saveAiCfg(); syncAiStatusUi();
    setStatusEl("set-status", T("API key removed from this browser.","Chave removida deste navegador."), "info");
  };
  $("ai-open-copilot").onclick = () => { persistSettingsFromForm(); closeSimpleModal($("m-settings")); openSimpleModal("m-ai"); syncAiStatusUi(); };
  $("openSettings").onclick = () => { loadSettingsForm(); openSimpleModal("m-settings"); };
  $("openAI").onclick = () => { syncAiStatusUi(); openSimpleModal("m-ai"); };
  $("aiGoSettings").onclick = () => { closeSimpleModal($("m-ai")); loadSettingsForm(); openSimpleModal("m-settings"); };
  $("aiModes").addEventListener("click", e => {
    const b = e.target.closest("[data-aimode]"); if (!b) return;
    aiMode = b.dataset.aimode;
    $("aiModes").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
  });

  async function discoverAccountModels() {
    const key = cleanApiKey(aiCfg.apiKey);
    if (!key) return [];
    const base = (aiCfg.endpoint || DEFAULT_AI_CFG.endpoint).replace(/\/v1\/messages\/?$/, "/v1/models");
    const res = await fetch(base, {
      method: "GET",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      }
    });
    if (!res.ok) return [];
    const d = await res.json().catch(() => ({}));
    const list = Array.isArray(d.data) ? d.data.map(m => ({ id: m.id, name: m.display_name || m.id })) : [];
    if (list.length) {
      const sel = $("ai-model"), customOpt = sel.querySelector('option[value="custom"]');
      const existing = new Set([...sel.options].map(o => o.value));
      list.forEach(m => {
        if (!existing.has(m.id)) {
          const opt = document.createElement("option");
          opt.value = m.id; opt.textContent = `${m.name} (${m.id})`;
          sel.insertBefore(opt, customOpt);
          existing.add(m.id);
        }
      });
    }
    return list;
  }

  const AI_PARAM_ENUM = [
    "spendBn","baseSup","limitBRL","scenario","horizon","tenor","spread","mktSpread",
    "jbs.addr","jbs.cov","jbs.adh","jbs.util",
    "mbrf.addr","mbrf.cov","mbrf.adh","mbrf.util",
    "vot.addr","vot.cov","vot.adh","vot.util",
    "emb.addr","emb.cov","emb.adh","emb.util",
    "nat.addr","nat.cov","nat.adh","nat.util"
  ];
  const AI_RESPONSE_SCHEMA = {
    type: "object",
    additionalProperties: false,
    required: ["executive_summary","predictions_feedback","deck_note","key_insights","recommended_actions","parameter_updates"],
    properties: {
      executive_summary: { type: "string" },
      predictions_feedback: { type: "string" },
      deck_note: { type: "string" },
      key_insights: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["step","impact","title","detail"],
          properties: {
            step: { type: "string" },
            impact: { type: "string" },
            title: { type: "string" },
            detail: { type: "string" }
          }
        }
      },
      recommended_actions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["action","owner","rationale"],
          properties: {
            action: { type: "string" },
            owner: { type: "string" },
            rationale: { type: "string" }
          }
        }
      },
      parameter_updates: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["param","value","reason"],
          properties: {
            param: { type: "string", enum: AI_PARAM_ENUM },
            value: { type: "string" },
            reason: { type: "string" }
          }
        }
      }
    }
  };

  async function callAnthropic({ system, userPrompt, maxTokens = 16384, outputConfig = null, signal }) {
    const key = cleanApiKey(aiCfg.apiKey);
    if (!key) {
      throw new Error(T("Please add your Anthropic API key in Settings first.","Adicione sua chave de API Anthropic em Configurações primeiro."));
    }
    const endpoint = aiCfg.endpoint || DEFAULT_AI_CFG.endpoint;
    const send = async (cfg) => {
      const payload = {
        model: activeAiModel(),
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: userPrompt }]
      };
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
      const data = await res.json().catch(() => ({}));
      return { res, data };
    };
    let { res, data } = await send(outputConfig);
    // Graceful fallback: if any model/proxy rejects output_config with HTTP 400, retry cleanly without it
    if (!res.ok && res.status === 400 && outputConfig) {
      ({ res, data } = await send(null));
    }
    if (!res.ok) {
      const errMsg = data?.error?.message || `HTTP ${res.status}`;
      const err = new Error(`${errMsg} (${activeAiModel()})`);
      err.status = res.status;
      throw err;
    }
    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").trim();
    return { text, model: data.model || activeAiModel(), stopReason: data.stop_reason || "", usage: data.usage || null };
  }

  $("ai-test").onclick = async () => {
    persistSettingsFromForm();
    setStatusEl("set-status", T(`Testing connection (${AI_BRAND})...`,`Testando conexão (${AI_BRAND})...`), "info");
    const t0 = performance.now();
    try {
      const r = await callAnthropic({ system: "Respond with OK only.", userPrompt: "Ping", maxTokens: 512, outputConfig: { effort: "low" } });
      const ms = Math.round(performance.now() - t0);
      setStatusEl("set-status", T(`Connected ✓ · Key verified · ${AI_BRAND} · ${ms} ms`,`Conectado ✓ · Chave validada · ${AI_BRAND} · ${ms} ms`), "ok");
    } catch (err) {
      if (err.status === 404) {
        const models = await discoverAccountModels().catch(() => []);
        if (models.length) {
          const opus = models.find(m => /opus/i.test(m.id)) || models[0];
          $("ai-model").value = opus.id;
          persistSettingsFromForm();
          setStatusEl("set-status", T(`Key valid ✓. Auto-aligned account model (${opus.id}) — click Test again.`,`Chave válida ✓. Modelo da conta alinhado automaticamente (${opus.id}) — clique em Testar novamente.`), "info");
          return;
        }
      }
      setStatusEl("set-status", T(`Connection failed: ${err.message}`,`Falha na conexão: ${err.message}`), "err");
    }
  };

  function buildDashboardSnapshot() {
    const i = week - 1, bt = backtest(week), t = totals();
    const btModel = bt.length ? +(bt.reduce((s, r) => s + r.model, 0) / bt.length).toFixed(2) : null;
    const btFlat  = bt.length ? +(bt.reduce((s, r) => s + r.flat, 0) / bt.length).toFixed(2) : null;
    return {
      meta: { week, totalWeeks: W, language: lang, displayCurrency: ccy, fxPTAX_BRL_USD: FX_RATE, selicPct: SELIC },
      step1_program: {
        inScopeSpendBnBRL: +(SPEND / 1000).toFixed(2), supplierBase: BASE_SUP,
        currentWeekKPIs: { spendPct: D.spend[i], activeSuppliers: D.active[i], utilizationPct: D.util[i], daysToFirstDiscount: D.days[i], balanceMiBRL: D.bal[i], annualizedSpreadRevMiBRL: rev[i], forecastErrorPct: D.err[i], shareOfWalletPct: D.sow[i], openRiskFlags: D.flags[i] },
        funnelBeforeVsDocAI: { before: F.before, after: F.after, docDropoffPP: -26.0 },
        propensityTop3DecilesSharePct: 62.2,
        recentAlerts: ALERTS.filter(a => a[0] <= week).map(a => ({ week: a[0], text: a[2][0] }))
      },
      step2_forecast_and_limit: {
        approvedLimitMiBRL: Math.round(limitBRL), scenario: curScenario, horizonWeeks: curHorizon,
        projectedEndMiBRL: Math.round(FS.end), projectedPeakHighMiBRL: Math.round(FS.peakHigh),
        headroomMiBRL: Math.round(FS.lim - FS.peakHigh), backtestAvgModelAPE: btModel, backtestAvgNaiveAPE: btFlat
      },
      step3_anchor_pipeline_3Q26: {
        globalTenorDays: G.tenor, globalSpreadPct: G.spread,
        totals: { eligibleBnBRL: +t.elig.toFixed(2), annualFlowBnBRL: +t.flow.toFixed(2), avgBalanceMiBRL: Math.round(t.bal), annualSpreadRevMiBRL: +t.rev.toFixed(2) },
        anchors: ANCHORS.map((a, idx) => ({
          id: a.id, name: a.name, q3_2026_bnBRL: a.q3, annualizedBaseBnBRL: a.rev, q3Note: a.q3Note[0],
          params: { ...P[idx] },
          sized: { eligBnBRL: +eligOf(idx).toFixed(2), flowBnBRL: +flowOf(idx).toFixed(2), balMiBRL: Math.round(balOf(flowOf(idx))) }
        }))
      },
      step4_market_and_signals: {
        citiSimulatedSpreadPct: mktSpread,
        competitorGapsMiBRL: COMP_DATA.map(c => ({ id: c.id, citi: c.citi, fidc: c.fidc, openGap: c.gap, peersTotal: c.itau + c.brad + c.sant + c.btg + c.bb })),
        pricingTiers: PRICE_TIERS,
        rmLossReasonsPct: RM_LOSS.map(r => ({ reason: r.lbl[0], pct: r.pct })),
        registrarRealShare: SHARE_DATA,
        externalCreditHealth: EXT_HEALTH.map(h => ({ id: h.id, rating: h.rating, outlook: h.outlook[0], dupReadinessPct: h.dupPct, stress: h.stress[0], netSignal: h.net[0] }))
      }
    };
  }

  function extractJsonPayload(raw, stopReason = "") {
    const cleaned = (raw || "").trim();
    if (!cleaned) {
      throw new Error(stopReason === "max_tokens"
        ? T("Thinking used the full token budget before returning text. Please retry.","O raciocínio consumiu todo o limite de tokens antes de responder. Tente novamente.")
        : T("Model returned an empty text block.","O modelo retornou uma resposta vazia."));
    }
    try { return JSON.parse(cleaned); } catch (_) {}
    const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) { try { return JSON.parse(fenced[1].trim()); } catch (_) {} }
    const start = cleaned.indexOf("{"), end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const slice = cleaned.slice(start, end + 1);
      try { return JSON.parse(slice); } catch (_) {}
      try { return JSON.parse(slice.replace(/,\s*([}\]])/g, "$1")); } catch (_) {}
    }
    // Graceful fallback: never discard a readable text answer from a custom model/proxy
    return {
      executive_summary: cleaned,
      predictions_feedback: "",
      key_insights: [],
      recommended_actions: [],
      parameter_updates: []
    };
  }

  function normalizeParamUpdates(updates) {
    if (!updates) return {};
    if (!Array.isArray(updates)) return updates;
    const out = { anchors: {} };
    updates.forEach(item => {
      if (!item || !item.param) return;
      const p = String(item.param).trim(), val = item.value, reason = item.reason || "";
      if (p.includes(".")) {
        const [aid, field] = p.split(".");
        if (!out.anchors[aid]) out.anchors[aid] = {};
        out.anchors[aid][field] = { value: val, reason };
      } else {
        out[p] = { value: val, reason };
      }
    });
    return out;
  }

  function collectParamDiffs(rawUpdates) {
    const updates = normalizeParamUpdates(rawUpdates);
    if (!updates || typeof updates !== "object") return [];
    const diffs = [];
    const add = (key, step, label, cur, next, fmt, reason, applyFn) => {
      if (next === undefined || next === null || Number.isNaN(next)) return;
      if (String(cur) === String(next) || (typeof cur === "number" && typeof next === "number" && Math.abs(cur - next) < 1e-6)) return;
      diffs.push({ key, step, label, curDisp: fmt(cur), nextDisp: fmt(next), reason: reason || "", applyFn });
    };
    const num = (v, lo, hi) => {
      const raw = typeof v === "object" && v !== null ? v.value : v;
      const cleaned = typeof raw === "string" ? raw.replace(/[^\d.,-]/g, "").replace(",", ".") : raw;
      const n = Number(cleaned);
      return isFinite(n) ? Math.min(hi, Math.max(lo, n)) : null;
    };
    const rsn = v => (typeof v === "object" && v !== null && v.reason) ? String(v.reason) : "";

    if (updates.spendBn !== undefined) {
      const nv = num(updates.spendBn, 0.5, 500);
      if (nv !== null) add("spendBn", "S1", T("In-scope spend","Compras no escopo"), +(SPEND / 1000).toFixed(2), +nv.toFixed(2), v => bn(v, 1), rsn(updates.spendBn), () => { SPEND = nv * 1000; $("cfg-spend").value = nv.toFixed(1); });
    }
    if (updates.baseSup !== undefined) {
      const nv = num(updates.baseSup, 20, 50000);
      if (nv !== null) add("baseSup", "S1", T("Supplier base","Base de fornecedores"), BASE_SUP, Math.round(nv), v => nf(v), rsn(updates.baseSup), () => { BASE_SUP = Math.round(nv); $("cfg-base").value = BASE_SUP; });
    }
    if (updates.limitBRL !== undefined) {
      const nv = num(updates.limitBRL, 50, 50000);
      if (nv !== null) add("limitBRL", "S2", T("Approved credit limit","Limite aprovado"), Math.round(limitBRL), Math.round(nv), v => money(v), rsn(updates.limitBRL), () => { limitBRL = Math.round(nv); });
    }
    if (updates.scenario !== undefined) {
      const rawSc = typeof updates.scenario === "object" && updates.scenario !== null ? updates.scenario.value : updates.scenario;
      if (["Downside","Base","Upside"].includes(rawSc)) {
        add("scenario", "S2", T("Forecast scenario","Cenário de projeção"), curScenario, rawSc, v => scName(v), rsn(updates.scenario), () => {
          curScenario = rawSc;
          $("scenarioGroup").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.sc === curScenario)));
        });
      }
    }
    if (updates.horizon !== undefined) {
      const nv = num(updates.horizon, 4, 13);
      if ([4,8,13].includes(nv)) {
        add("horizon", "S2", T("Forecast horizon","Horizonte de projeção"), curHorizon, nv, v => v + T(" wk"," sem"), rsn(updates.horizon), () => {
          curHorizon = nv;
          $("horizonGroup").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.hz === curHorizon)));
        });
      }
    }
    if (updates.tenor !== undefined) {
      const nv = num(updates.tenor, 15, 360);
      if (nv !== null) add("tenor", "S3", T("Avg. days discounted","Prazo médio (dias)"), G.tenor, Math.round(nv), v => v + "d", rsn(updates.tenor), () => { G.tenor = Math.round(nv); });
    }
    if (updates.spread !== undefined) {
      const nv = num(updates.spread, 0.4, 5.0);
      if (nv !== null) add("spread", "S3", T("Pipeline annual spread","Spread anual pipeline"), G.spread, +nv.toFixed(2), v => nf(v, 2) + "%", rsn(updates.spread), () => { G.spread = +nv.toFixed(2); });
    }
    if (updates.mktSpread !== undefined) {
      const nv = num(updates.mktSpread, 0.6, 2.6);
      if (nv !== null) add("mktSpread", "S4.2", T("Market CDI+x spread","Spread mercado CDI+x"), mktSpread, +nv.toFixed(2), v => "CDI + " + nf(v, 2) + "%", rsn(updates.mktSpread), () => { mktSpread = +nv.toFixed(2); });
    }
    if (updates.anchors && typeof updates.anchors === "object") {
      const fieldLbl = { addr:T("Addressable %","Endereçável %"), cov:T("Coverage %","Cobertura %"), adh:T("Adoption %","Adesão %"), util:T("Utilization %","Utilização %") };
      ANCHORS.forEach((a, idx) => {
        const au = updates.anchors[a.id];
        if (!au || typeof au !== "object") return;
        for (const k of ["addr","cov","adh","util"]) {
          if (au[k] === undefined) continue;
          const nv = num(au[k], k === "addr" ? 0.5 : 5, 100);
          if (nv === null) continue;
          const rounded = k === "addr" ? +nv.toFixed(1) : Math.round(nv);
          add(`anchor.${a.id}.${k}`, "S3", `${a.name} · ${fieldLbl[k]}`, P[idx][k], rounded, v => nf(v, k === "addr" ? 1 : 0) + "%", rsn(au[k]) || au.reason || "", () => { P[idx][k] = rounded; });
        }
      });
    }
    return diffs;
  }

  function captureUndoSnapshot() {
    return {
      SPEND, BASE_SUP, limitBRL, curScenario, curHorizon, mktSpread, scen, aiDeckNote,
      G: { ...G }, P: P.map(p => ({ ...p }))
    };
  }
  function applyDiffList(diffs, syncDeckNote = true) {
    if (!diffs.length && !syncDeckNote) return;
    aiUndoSnap = captureUndoSnapshot();
    diffs.forEach(d => d.applyFn());
    if (diffs.length) document.querySelectorAll("[data-preset]").forEach(b => b.classList.remove("active"));
    // Sync 17-slide executive presentation state (Slide 1, 4, 5, 7, 8, 9, 10, 17)
    scen = curScenario;
    if (syncDeckNote && lastAiResult) {
      aiDeckNote = (lastAiResult.deck_note || lastAiResult.executive_summary || "").trim();
    }
    recomputeBook();
    updateCcyTexts();
    syncPipelineInputs();
    // Preserve explicit mktSpread if proposed separately from G.spread
    const ms = diffs.find(d => d.key === "mktSpread");
    if (ms) { ms.applyFn(); renderMarket(); }
    buildKpis();
    render(week);
    if (!deck.hidden) renderSlide();
    if (!proofModal.hidden && activeProofKey) renderProof(activeProofKey);
    if (!$("m-brief").hidden) $("brief-body").innerHTML = briefHTML();
    syncAiStatusUi();
  }
  $("aiUndoBtn").onclick = () => {
    if (!aiUndoSnap) return;
    const s = aiUndoSnap; aiUndoSnap = null;
    SPEND = s.SPEND; BASE_SUP = s.BASE_SUP; limitBRL = s.limitBRL;
    curScenario = s.curScenario; curHorizon = s.curHorizon; mktSpread = s.mktSpread;
    scen = s.scen; aiDeckNote = s.aiDeckNote || "";
    Object.assign(G, s.G);
    s.P.forEach((p, idx) => Object.assign(P[idx], p));
    $("cfg-spend").value = (SPEND / 1000).toFixed(1); $("cfg-base").value = BASE_SUP;
    $("scenarioGroup").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.sc === curScenario)));
    $("horizonGroup").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.hz === curHorizon)));
    recomputeBook(); updateCcyTexts(); syncPipelineInputs();
    mktSpread = s.mktSpread; renderMarket(); buildKpis(); render(week);
    if (!deck.hidden) renderSlide();
    syncAiStatusUi();
    setStatusEl("aiRunStatus", T("Previous cockpit & presentation parameters restored.","Parâmetros anteriores do cockpit e da apresentação restaurados."), "info");
  };

  function renderAiBriefingBanner() {
    const box = $("aiLiveBriefing");
    if (!lastAiResult || !lastAiResult.executive_summary) { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = `<div class="ai-live-head">
      <span class="ai-live-pill">✦ ${AI_BRAND} · ${T("Cross-Data Briefing","Briefing Cruzado")}</span>
      <button type="button" class="sig-route-btn" id="openAiFromBrief">${T("Inspect insights & parameters ↗","Abrir insights e parâmetros ↗")}</button>
    </div><div>${esc(lastAiResult.executive_summary)}</div>`;
    $("openAiFromBrief").onclick = () => { syncAiStatusUi(); openSimpleModal("m-ai"); };
  }

  function renderAiResults() {
    const box = $("aiResults");
    if (!lastAiResult) { box.innerHTML = ""; return; }
    const r = lastAiResult;
    const diffs = collectParamDiffs(r.parameter_updates);
    let html = "";
    if (r.executive_summary) {
      html += `<div class="ai-sec"><h4><span>${T("Executive Summary","Resumo Executivo")}</span><span class="ai-tag">${AI_BRAND}</span></h4><p>${esc(r.executive_summary)}</p></div>`;
    }
    if (r.predictions_feedback) {
      html += `<div class="ai-sec"><h4><span>${T("Predictions, Forecast & Limit Feedback","Feedback sobre Predições, Projeção e Limite")}</span><span class="ai-tag med">${T("Step 2 + 3Q26","Etapa 2 + 3T26")}</span></h4><p>${esc(r.predictions_feedback)}</p></div>`;
    }
    if (Array.isArray(r.key_insights) && r.key_insights.length) {
      html += `<div class="ai-sec"><h4><span>${T("Cross-Data Key Insights","Principais Insights Cruzados")}</span><span class="ai-tag pos">${r.key_insights.length}</span></h4>
        <div class="ai-insight-grid">${r.key_insights.map(ins => {
          const imp = String(ins.impact || "medium").toLowerCase();
          const cls = imp.includes("high") || imp.includes("alt") ? "high" : imp.includes("pos") || imp.includes("opp") ? "pos" : "med";
          return `<div class="ai-insight-card"><div class="ai-meta-tags"><span class="ai-tag">${esc(ins.step || "Cross-step")}</span><span class="ai-tag ${cls}">${esc(ins.impact || "Key")}</span></div><strong>${esc(ins.title || "")}</strong><p>${esc(ins.detail || "")}</p></div>`;
        }).join("")}</div></div>`;
    }
    if (Array.isArray(r.recommended_actions) && r.recommended_actions.length) {
      html += `<div class="ai-sec"><h4><span>${T("Recommended Actions & RM Feedback","Ações Recomendadas e Feedback Comercial")}</span></h4>
        <ol style="padding-left:18px;font-size:12.5px;line-height:1.5;color:var(--ink)">${r.recommended_actions.map(a => {
          if (typeof a === "string") return `<li style="margin:4px 0">${esc(a)}</li>`;
          return `<li style="margin:4px 0"><b>${esc(a.action || a.title || "")}</b>${a.owner ? ` <i>(${esc(a.owner)})</i>` : ""}${a.rationale ? ` — ${esc(a.rationale)}` : ""}</li>`;
        }).join("")}</ol></div>`;
    }
    if (diffs.length) {
      html += `<div class="ai-sec"><h4><span>${T("Proposed Parameter Updates (Cockpit + 17-Slide Presentation)","Atualizações de Parâmetros Propostas (Cockpit + Apresentação 17 slides)")}</span><span class="ai-tag pos">${diffs.length} ${T("changes","ajustes")}</span></h4>
        <div class="proof-table-wrap"><table class="ai-diff-table"><thead><tr><th style="width:28px">✓</th><th>${T("Step","Etapa")}</th><th>${T("Parameter","Parâmetro")}</th><th>${T("Current → Proposed","Atual → Proposto")}</th><th>${T("Rationale","Justificativa")}</th></tr></thead><tbody>
        ${diffs.map((d, idx) => `<tr><td><input type="checkbox" class="ai-diff-chk" data-idx="${idx}" checked aria-label="${esc(d.label)}"></td><td><span class="ai-tag">${esc(d.step)}</span></td><td><b>${esc(d.label)}</b></td><td><span class="val-old">${esc(d.curDisp)}</span>→ <span class="val-new">${esc(d.nextDisp)}</span></td><td style="color:var(--muted)">${esc(d.reason)}</td></tr>`).join("")}
        </tbody></table></div>
        <div class="mbtns" style="margin-top:10px">
          <button type="button" class="mbtn pri" id="aiApplySelected">${T("Update cockpit & presentation (17 slides)","Atualizar cockpit e apresentação (17 slides)")}</button>
          <button type="button" class="mbtn" id="aiOpenDeckBtn">${T("Open Presentation (17) →","Abrir Apresentação (17) →")}</button>
        </div></div>`;
    } else if (r.parameter_updates) {
      html += `<div class="ai-sec"><h4>${T("Cockpit & Presentation Sync","Sincronização Cockpit & Apresentação")}</h4><p>${T("All numeric parameters match the current state. You can still sync the executive takeaway into the 17-slide presentation.","Todos os parâmetros numéricos já estão sincronizados. Você ainda pode atualizar a nota executiva na apresentação (17 slides).")}</p>
        <div class="mbtns" style="margin-top:8px">
          <button type="button" class="mbtn pri" id="aiSyncDeckOnly">${T("Update presentation (17 slides)","Atualizar apresentação (17 slides)")}</button>
          <button type="button" class="mbtn" id="aiOpenDeckBtn">${T("Open Presentation (17) →","Abrir Apresentação (17) →")}</button>
        </div></div>`;
    }
    box.innerHTML = html;
    const applyBtn = $("aiApplySelected");
    if (applyBtn) {
      applyBtn.onclick = () => {
        const picked = [...box.querySelectorAll(".ai-diff-chk:checked")].map(c => diffs[+c.dataset.idx]).filter(Boolean);
        applyDiffList(picked, true);
        setStatusEl("aiRunStatus", T(`Updated ${picked.length} parameter(s) across Cockpit & Presentation (17 slides) ✓`,`${picked.length} parâmetro(s) atualizado(s) no Cockpit e na Apresentação (17 slides) ✓`), "ok");
        renderAiResults();
      };
    }
    const syncOnly = $("aiSyncDeckOnly");
    if (syncOnly) {
      syncOnly.onclick = () => {
        applyDiffList([], true);
        setStatusEl("aiRunStatus", T("Presentation (17 slides) synced with AI Analysis ON ✓","Apresentação (17 slides) atualizada com AI Analysis ON ✓"), "ok");
        renderAiResults();
      };
    }
    const openDeckBtn = $("aiOpenDeckBtn");
    if (openDeckBtn) {
      openDeckBtn.onclick = () => { closeSimpleModal($("m-ai")); openDeck(0); };
    }
  }

  $("aiAbortBtn").onclick = () => { if (aiAbort) { aiAbort.abort(); aiAbort = null; } };
  $("aiRunBtn").onclick = async () => {
    if (!aiCfg.apiKey || !aiCfg.apiKey.trim()) {
      setStatusEl("aiRunStatus", T("Configure your Anthropic API key in Settings first.","Configure sua chave Anthropic em Configurações primeiro."), "err");
      return;
    }
    const snap = buildDashboardSnapshot();
    const modeDirectives = {
      cross: "Cross-correlate Step 1 program KPIs/onboarding funnel, Step 2 balance forecast/limit, Step 3 3Q26 anchor financials, and Step 4 competitor IAS 7 gaps, CDI+x pricing, registrar real share, and external credit signals. Surface non-obvious cross-step insights and propose calibrated parameter updates across the cockpit and presentation.",
      predict: "Focus deeply on improving balance predictions, diagnosing backtest error vs naive baseline, checking seasonality/approved limit breach risk, and recommending optimal scenario, horizon, limitBRL, and tenor/spread parameters.",
      optimize: "Actively optimize every editable parameter across Steps 1–4 and the 17-slide presentation (spendBn, baseSup, limitBRL, scenario, horizon, tenor, spread, mktSpread, and per-anchor addr/cov/adh/util for jbs, mbrf, vot, emb, nat) grounded in 3Q26 leverage, IAS 7 gaps, FIDC competition, and registrar readiness.",
      exec: "Deliver sharp Monday executive feedback for Corporate Banking / SCF leadership: highlight what is working, blind spots, commercial RM priorities, presentation narrative update, and targeted parameter adjustments."
    };
    const systemPrompt = `You are a senior Corporate Banking Supply Chain Finance (Risco Sacado Brasil) quantitative strategist & credit risk advisor.
Analyze the live cockpit JSON snapshot across Steps 1-4 and return ONLY a single valid JSON object matching the required schema:
- executive_summary: 2-4 sentence executive synthesis in ${lang === "pt" ? "Brazilian Portuguese (PT-BR)" : "English"}.
- predictions_feedback: Specific feedback on balance forecast, backtest APE, seasonality & approved limit headroom in ${lang === "pt" ? "Brazilian Portuguese (PT-BR)" : "English"}.
- deck_note: Concise 1-2 sentence executive takeaway to update Slides 1 & 17 of the attached 17-slide presentation in ${lang === "pt" ? "Brazilian Portuguese (PT-BR)" : "English"}.
- key_insights: 4 to 6 sharp cross-data objects { step, impact ("High"|"Opportunity"|"Risk"), title, detail } referencing concrete numbers across Steps 1-4.
- recommended_actions: 3 to 5 prioritized objects { action, owner, rationale }.
- parameter_updates: array of objects { param, value, reason } ONLY for parameters that genuinely merit changing based on cross-data evidence.
  Allowed param names & value formats (keep all monetary values in BRL millions/billions as in snapshot, value as string):
  - "spendBn" (0.5-500, R$ bn), "baseSup" (20-50000), "limitBRL" (50-50000, R$ m)
  - "scenario" ("Downside"|"Base"|"Upside"), "horizon" ("4"|"8"|"13")
  - "tenor" (15-360 days), "spread" (0.4-5.0, %), "mktSpread" (0.6-2.6, CDI+x %)
  - Per-anchor params for jbs, mbrf, vot, emb, nat: "<id>.addr" (0.5-100), "<id>.cov" (5-100), "<id>.adh" (5-100), "<id>.util" (5-100).
Write ALL prose fields strictly in ${lang === "pt" ? "Brazilian Portuguese (PT-BR)" : "English"}.`;

    const extra = $("ai-prompt").value.trim();
    const userPrompt = `MODE: ${aiMode.toUpperCase()} — ${modeDirectives[aiMode]}\n${extra ? `SPECIALIST INSTRUCTION: ${extra}\n` : ""}LIVE COCKPIT SNAPSHOT:\n${JSON.stringify(snap)}`;

    aiAbort = new AbortController();
    $("aiRunBtn").disabled = true; $("aiAbortBtn").hidden = false;
    setStatusEl("aiRunStatus", T(`Running ${AI_BRAND} across Steps 1–4 & Presentation...`,`Executando ${AI_BRAND} nas Etapas 1–4 e Apresentação...`), "info");
    try {
      const resp = await callAnthropic({
        system: systemPrompt,
        userPrompt,
        maxTokens: 16384,
        outputConfig: { effort: "medium", format: { type: "json_schema", schema: AI_RESPONSE_SCHEMA } },
        signal: aiAbort.signal
      });
      const parsed = extractJsonPayload(resp.text, resp.stopReason);
      parsed._model = AI_BRAND;
      lastAiResult = parsed;
      const diffs = collectParamDiffs(parsed.parameter_updates);
      if (aiCfg.autoApply) {
        applyDiffList(diffs, true);
        setStatusEl("aiRunStatus", T(`Done ✓ (${AI_BRAND}) · Auto-updated ${diffs.length} parameter(s) + Presentation (17).`,`Concluído ✓ (${AI_BRAND}) · ${diffs.length} ajuste(s) + Apresentação (17) atualizados automaticamente.`), "ok");
      } else {
        setStatusEl("aiRunStatus", T(`Done ✓ (${AI_BRAND}) · ${diffs.length} parameter update(s) ready for Cockpit + Presentation.`,`Concluído ✓ (${AI_BRAND}) · ${diffs.length} ajuste(s) pronto(s) para Cockpit + Apresentação.`), "ok");
      }
      renderAiBriefingBanner();
      renderAiResults();
    } catch (err) {
      if (err.name === "AbortError") setStatusEl("aiRunStatus", T("Analysis cancelled.","Análise cancelada."), "info");
      else setStatusEl("aiRunStatus", T(`Error: ${err.message}`,`Erro: ${err.message}`), "err");
    } finally {
      aiAbort = null; $("aiRunBtn").disabled = false; $("aiAbortBtn").hidden = true;
    }
  };

