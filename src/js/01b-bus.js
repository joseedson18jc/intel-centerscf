  // ========== REFRESH BUS (lets feature modules react to any state change) ==========
  // Core render paths call touch(); every module registered with onRefresh() is re-rendered once per frame.
  const REFRESHERS = [];
  let refreshPending = false;
  function onRefresh(fn) { REFRESHERS.push(fn); }
  function runRefreshers() { refreshPending = false; REFRESHERS.forEach(f => { try { f(); } catch (e) { console.error("[refresh]", e); } }); }
  function touch() { if (refreshPending) return; refreshPending = true; (window.requestAnimationFrame || setTimeout)(runRefreshers); }

