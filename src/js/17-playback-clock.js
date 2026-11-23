  // ========== WEEK PLAYBACK, KEYBOARD & QUARTER CLOCK ==========
  let week = W, timer = null;
  function render(w) {
    week = w; $("wk").textContent = w; $("slider").value = w;
    syncFunnel(w);
    updateKpis(w); forecast(w); commentary(w); alerts(w);
    ring("r1", D.sow[w - 1], C.blue); ring("r2", D.supShare[w - 1], C.sky);
    sectors(w); uplift(w); plan(w);
  }
  const playIcon = $("playIcon");
  function setPlaying(on) {
    clearInterval(timer); timer = null;
    $("play").setAttribute("aria-label", on ? T("Pause weekly playback","Pausar reprodução") : L(I18N["aria.play"]));
    playIcon.innerHTML = on ? '<rect x="4" y="3" width="3" height="10" rx="1" fill="currentColor"/><rect x="9" y="3" width="3" height="10" rx="1" fill="currentColor"/>' : '<path d="M5 3l8 5-8 5z" fill="currentColor"/>';
    if (on) { if (week >= W) render(1); timer = setInterval(() => { if (week >= W) { setPlaying(false); return; } render(week + 1); }, 2400); }
  }
  $("play").onclick = () => setPlaying(!timer);
  $("prev").onclick = () => { setPlaying(false); render(Math.max(1, week - 1)); };
  $("next").onclick = () => { setPlaying(false); render(Math.min(W, week + 1)); };
  $("slider").oninput = e => { setPlaying(false); render(+e.target.value); };

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      if (!proofModal.hidden) { closeProof(); return; }
      for (const id of SIMPLE_MODALS) { const m = $(id); if (!m.hidden) { closeSimpleModal(m); return; } }
      if (!deck.hidden) { closeDeck(); return; }
    }
    if (!proofModal.hidden) { trapFocus(proofModal, e); return; }
    for (const id of SIMPLE_MODALS) { const m = $(id); if (!m.hidden) { trapFocus(m, e); return; } }
    if (!deck.hidden) {
      if (e.key === "Tab") { trapFocus(deck, e); return; }
      if (e.target.closest("input,select,a")) return;
      if (["ArrowRight","PageDown"," "].includes(e.key)) { e.preventDefault(); $("deck-next").click(); }
      if (["ArrowLeft","PageUp"].includes(e.key)) { e.preventDefault(); $("deck-prev").click(); }
      if (e.key === "Home") { slideIdx = 0; renderSlide(); }
      if (e.key === "End") { slideIdx = SLIDES.length - 1; renderSlide(); }
      return;
    }
    if (e.target.closest("input,button,a,select,summary,[data-proof]")) return;
    if (e.key === "ArrowRight") $("next").click();
    if (e.key === "ArrowLeft") $("prev").click();
    if (e.key === " ") { e.preventDefault(); $("play").click(); }
  });

  const zone = "America/Sao_Paulo";
  const localMonth = new Intl.DateTimeFormat("en-US", {timeZone:zone, year:"numeric", month:"numeric"});
  const zoneOffset = new Intl.DateTimeFormat("en-US", {timeZone:zone, timeZoneName:"longOffset"});
  function updateClock(now = new Date()) {
    const parts = Object.fromEntries(localMonth.formatToParts(now).map(p => [p.type, p.value]));
    const quarter = Math.ceil(Number(parts.month) / 3);
    const midnight = Date.UTC(Number(parts.year), quarter * 3, 1);
    const offset = zoneOffset.formatToParts(midnight).find(p => p.type === "timeZoneName").value;
    const m = offset.match(/GMT([+-])(\d{2}):(\d{2})/) || [null,"-","03","00"];
    const close = midnight - (m[1] === "+" ? 1 : -1) * (Number(m[2]) * 60 + Number(m[3])) * 60000;
    const seconds = Math.max(0, Math.ceil((close - now.getTime()) / 1000)), pad = n => String(n).padStart(2, "0");
    $("quarter-heading").textContent = T("Q" + quarter + " " + parts.year + " close", "Fechamento " + quarter + "º tri " + parts.year);
    $("quarter-date").textContent = new Intl.DateTimeFormat(loc(), {timeZone:zone, day:"numeric", month:"short", year:"numeric"}).format(close - 1) + " · São Paulo";
    $("quarter-clock").textContent = Math.floor(seconds / 86400) + "d " + pad(Math.floor(seconds / 3600) % 24) + "h " + pad(Math.floor(seconds / 60) % 60) + "m " + pad(seconds % 60) + "s";
  }

