
  document.querySelectorAll(".lang button").forEach(b => b.onclick = () => setLang(b.dataset.lang));
  document.querySelectorAll(".theme-switch button").forEach(b => b.onclick = () => setTheme(b.dataset.theme, true));
  document.querySelectorAll(".ccy-switch button").forEach(b => b.onclick = () => setCcy(b.dataset.ccy, true));

  // Restore saved parameters and weekly data (19-persistence) BEFORE the first render, then render once.
  recomputeBook();
  if (typeof restoreSavedState === "function") { try { restoreSavedState(); } catch (e) { console.error("[restore]", e); } }

  setTheme(theme, false);
  setCcy(ccy, false);
  setLang(lang);
  appReady = true;
  if (typeof initPersistence === "function") initPersistence();
  setInterval(updateClock, 1000);
