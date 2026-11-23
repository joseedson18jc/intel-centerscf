
  document.querySelectorAll(".lang button").forEach(b => b.onclick = () => setLang(b.dataset.lang));
  document.querySelectorAll(".theme-switch button").forEach(b => b.onclick = () => setTheme(b.dataset.theme, true));
  document.querySelectorAll(".ccy-switch button").forEach(b => b.onclick = () => setCcy(b.dataset.ccy, true));

  // Restore saved CSV from localStorage if present
  recomputeBook();
  try {
    const saved = JSON.parse(localStorage.getItem("scf-data") || "null");
    if (saved && saved.obj) {
      COLS.slice(1).forEach(([, k]) => { if (!Array.isArray(saved.obj[k])) throw 0; });
      Object.assign(D, saved.obj); W = D.spend.length; SPEND = (saved.sp || 6.0) * 1000; BASE_SUP = saved.bs || 300;
      recomputeBook(); $("slider").max = W; week = W; SRCINFO = saved.info;
    }
  } catch (e) {}

  setTheme(theme, false);
  setCcy(ccy, false);
  setLang(lang);
  setInterval(updateClock, 1000);
