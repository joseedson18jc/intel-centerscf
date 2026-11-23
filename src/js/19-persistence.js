  // ========== PERSISTENCE (localStorage, this browser only) ==========
  // "scf-params-v1": every editable parameter, in one versioned object:
  //   { v:1, spend (BRL bn), base, pilot:{tenor, spread}, fx, limitBRL, scenario, horizon,
  //     G:{tenor, spread}, P:{anchorId:{addr, cov, adh, util}}, mktSpread }
  // "scf-data": the user's weekly dataset { obj:{series...}, info:{kind, name, ts, at} }.
  //   The older shapes {obj, info} and {obj, info, sp, bs} are still accepted.
  // Every value is checked on the way in; anything missing or corrupt falls back to the default.
  const PARAMS_KEY = "scf-params-v1", DATA_KEY = "scf-data";
  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  // lsBlocked: the last write failed (storage blocked or full), so messages must not claim anything was saved.
  let lsBlocked = false;
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); lsBlocked = false; return true; } catch (e) { lsBlocked = true; return false; } };
  const lsDel = k => { try { localStorage.removeItem(k); } catch (e) {} };
  const lsJSON = k => { try { return JSON.parse(lsGet(k) || "null"); } catch (e) { return null; } };
  const own = (o, k) => !!o && typeof o === "object" && Object.prototype.hasOwnProperty.call(o, k);
  const ownObj = (o, k) => own(o, k) && !!o[k] && typeof o[k] === "object";
  const P_KEYS = ["addr", "cov", "adh", "util"];

  function snapshotParams() {
    const p = {};
    ANCHORS.forEach((a, i) => { p[a.id] = {}; P_KEYS.forEach(k => { p[a.id][k] = P[i][k]; }); });
    return {
      v:1, spend:+(SPEND / 1000).toFixed(4), base:BASE_SUP, pilot:{tenor:PILOT.tenor, spread:PILOT.spread}, fx:FX_RATE,
      limitBRL:+(+limitBRL).toFixed(4), scenario:curScenario, horizon:curHorizon,
      G:{tenor:G.tenor, spread:G.spread}, P:p, mktSpread:mktSpread
    };
  }
  // Captured while every variable still holds its initial value (this module loads before 99-boot restores anything).
  const PARAM_DEFAULTS = snapshotParams();
  let lastSavedParams = null, saveTimer = null;

  // Writes the values of o into the state, one field at a time. Numbers are clamped to their accepted range;
  // a field that is missing or of the wrong type is skipped, so the current value stays.
  function applyParamValues(o) {
    if (!o || typeof o !== "object") return;
    const num = (v, lo, hi) => (typeof v === "number" && isFinite(v)) ? clampNum(v, lo, hi) : null;
    let x;
    if ((x = num(o.spend, ...PARAM_RANGE.spend)) !== null) SPEND = x * 1000;
    if ((x = num(o.base, ...PARAM_RANGE.base)) !== null) BASE_SUP = Math.round(x);
    if (ownObj(o, "pilot")) {
      if ((x = num(o.pilot.tenor, ...PARAM_RANGE.tenor)) !== null) PILOT.tenor = x;
      if ((x = num(o.pilot.spread, ...PARAM_RANGE.spread)) !== null) PILOT.spread = x;
    }
    if ((x = num(o.fx, FX_MIN, FX_MAX)) !== null) FX_RATE = x;
    if ((x = num(o.limitBRL, ...LIMIT_RANGE)) !== null) limitBRL = x;
    if (typeof o.scenario === "string" && own(multipliers, o.scenario)) curScenario = o.scenario;
    const hz = $("horizonGroup") ? [...$("horizonGroup").querySelectorAll("[data-hz]")].map(b => +b.dataset.hz) : [4, 8, 13];
    if (hz.includes(o.horizon)) curHorizon = o.horizon;
    if (ownObj(o, "G")) {
      if ((x = num(o.G.tenor, 1, 360)) !== null) G.tenor = x;
      if ((x = num(o.G.spread, 0, 10)) !== null) G.spread = x;
    }
    if (ownObj(o, "P")) ANCHORS.forEach((a, i) => {
      if (!ownObj(o.P, a.id)) return;
      P_KEYS.forEach(k => { if ((x = num(o.P[a.id][k], 0, 100)) !== null) P[i][k] = x; });
    });
    if ((x = num(o.mktSpread, 0.6, 2.6)) !== null) mktSpread = x;
  }
  // Puts the controls owned by other modules in line with the state (the pipeline inputs and the market
  // slider are rebuilt from the state by renderPipeline / renderMarket, the limit box by updateCcyTexts).
  function syncParamControls() {
    const sg = $("scenarioGroup"), hg = $("horizonGroup"), lim = $("limit");
    if (sg) sg.querySelectorAll("[data-sc]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.sc === curScenario)));
    if (hg) hg.querySelectorAll("[data-hz]").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.hz === curHorizon)));
    if (lim) lim.value = Math.round(limitBRL / fx());
    const matches = pr => G.tenor === pr.tenor && G.spread === pr.spread && ANCHORS.every((a, i) => P[i].addr === a.addr && P[i].cov === pr.cov && P[i].adh === pr.adh && P[i].util === pr.util);
    document.querySelectorAll("[data-preset]").forEach(b => b.classList.toggle("active", own(PRESETS, b.dataset.preset) && matches(PRESETS[b.dataset.preset])));
  }
  // Returns a clean copy of a stored dataset, or null when any series is missing, uneven or breaks a rule.
  function cleanDataset(src) {
    if (!src || typeof src !== "object") return null;
    const obj = {};
    for (const [, k] of DATA_COLS) {
      if (!own(src, k) || !Array.isArray(src[k])) return null;
      obj[k] = [];
      for (const v of src[k]) {
        if (typeof v !== "number") return null;
        const res = checkCell(k, String(v), ",");
        if (res.e) return null;
        obj[k].push(res.v);
      }
    }
    const n = obj.spend.length;
    if (DATA_COLS.some(([, k]) => obj[k].length !== n)) return null;
    return checkDataset(obj, Infinity).length ? null : obj;
  }
  // Called once by 99-boot, before the first render.
  function restoreSavedState() {
    const params = lsJSON(PARAMS_KEY), saved = lsJSON(DATA_KEY);
    const hasParams = !!params && typeof params === "object" && params.v === 1;
    if (hasParams) applyParamValues(params);
    const obj = saved && typeof saved === "object" ? cleanDataset(saved.obj) : null;
    if (obj) {
      DATA_COLS.forEach(([, k]) => { D[k] = obj[k]; });
      W = D.spend.length;
      const inf = saved.info && typeof saved.info === "object" ? saved.info : {};
      SRCINFO = makeSrcInfo(inf.kind, typeof inf.name === "string" ? inf.name : "CSV", typeof inf.ts === "number" ? inf.ts : 0, typeof inf.at === "string" ? inf.at : "");
      // Older saves kept spend and supplier base next to the data; use them only when no parameter object exists.
      if (!hasParams) applyParamValues({spend:typeof saved.sp === "number" ? saved.sp : undefined, base:typeof saved.bs === "number" ? saved.bs : undefined});
    } else if (saved !== null || lsGet(DATA_KEY) !== null) lsDel(DATA_KEY); // unreadable: drop it and stay on the example data
    BASE_SUP = Math.max(BASE_SUP, minBase());
    recomputeBook();
    if ($("slider")) $("slider").max = W;
    week = W;
    syncParamControls();
  }
  // Returns true when the parameters are stored (or already were), false when the browser refused to store them.
  function saveParams() {
    if (!appReady) return false;
    const s = JSON.stringify(snapshotParams());
    if (s === lastSavedParams) return !lsBlocked;
    if (lsSet(PARAMS_KEY, s)) { lastSavedParams = s; return true; }
    return false;
  }
  function queueSaveParams() { clearTimeout(saveTimer); saveTimer = setTimeout(saveParams, 200); }
  // Saves the weekly dataset when it is the user's own; the example data is never stored.
  function saveDataset() {
    if (!SRCINFO) { lsDel(DATA_KEY); return true; }
    const obj = {}; DATA_COLS.forEach(([, k]) => { obj[k] = D[k]; });
    return lsSet(DATA_KEY, JSON.stringify({obj, info:SRCINFO}));
  }
  // Called once by 99-boot after the first render.
  function initPersistence() {
    const cur = JSON.stringify(snapshotParams());
    lastSavedParams = lsGet(PARAMS_KEY);
    // Nothing is written for an untouched example state; a migrated or repaired state is stored right away.
    if (lastSavedParams !== null || cur !== JSON.stringify(PARAM_DEFAULTS)) saveParams();
    else lastSavedParams = cur;
    // Several controls owned by other modules change state without calling touch(), so any user input also
    // schedules a (cheap) snapshot comparison.
    onRefresh(saveParams);
    ["input", "change", "click"].forEach(ev => document.addEventListener(ev, queueSaveParams, true));
    window.addEventListener("pagehide", saveParams);
  }
  // "Restore defaults": forgets the saved parameters and dataset and brings back the example state.
  function restoreDefaults() {
    lsDel(PARAMS_KEY); lsDel(DATA_KEY);
    applyParamValues(PARAM_DEFAULTS);
    ANCHORS.forEach((a, i) => { P[i].addr = a.addr; });   // addressable shares belong to the active dataset, not to q3
    DATA_COLS.forEach(([, k]) => { D[k] = DEMO[k].slice(); });
    W = D.spend.length; SRCINFO = null;
    recomputeBook();
    if ($("slider")) $("slider").max = W;
    if ($("tk-end")) $("tk-end").textContent = WL() + W;
    week = W;
    syncParamControls();
    lastSavedParams = JSON.stringify(snapshotParams());
    refreshAll();
    if (typeof syncParamInputs === "function") syncParamInputs(true);
    if (typeof edLoad === "function") edLoad();
  }
