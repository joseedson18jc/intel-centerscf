  // ========== UNIFIED DESIGN TOKENS (LIGHT + DARK) ==========
  // v15 palette: neutral ink + one blue accent. Mirrors the CSS tokens in css/94-system.css (same key names as before).
  const THEME_LIGHT = {
    navy:"#0B0D12", navyMid:"#1B1E26", blue:"#0B57D0", sky:"#7FA9EE", red:"#C4222B",
    green:"#0A7A4B", amber:"#B66A00", slate:"#B8BCC6", muted:"#4A4E57", subtle:"#6A6F78",
    grid:"#ECECEF", ringTrack:"#ECECEF", barMuted:"#D6D6DB", freeSeg:"#ECECEF",
    nodeBg:"#F5F5F6", nodeStroke:"#D6D6DB", series:["#0A2F73","#0B57D0","#3E82EE","#7FA9EE","#BBD2F7"]
  };
  const THEME_DARK = {
    navy:"#EDEDF0", navyMid:"#D5D6DB", blue:"#6BA6FF", sky:"#9CC3FF", red:"#FF7272",
    green:"#3DD68C", amber:"#F0B34A", slate:"#4A4B55", muted:"#A6A8B1", subtle:"#8B8D97",
    grid:"#222227", ringTrack:"#222227", barMuted:"#32323A", freeSeg:"#222227",
    nodeBg:"#18181C", nodeStroke:"#32323A", series:["#2F6FE0","#4C8DF6","#6BA6FF","#9CC3FF","#C9DEFF"]
  };
  let theme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  const isDark = () => theme === "dark";
  const C = {...(isDark() ? THEME_DARK : THEME_LIGHT)};

