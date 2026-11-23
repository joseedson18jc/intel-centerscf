  // ========== UNIFIED DESIGN TOKENS (LIGHT + DARK) ==========
  const THEME_LIGHT = {
    navy:"#00205B", navyMid:"#002D72", blue:"#056DAE", sky:"#00BDF2", red:"#E31B23",
    green:"#0E8A5F", amber:"#D97706", slate:"#9FB4CA", muted:"#4A5D73", subtle:"#6B7E94",
    grid:"#DCE5F0", ringTrack:"#E6EEF7", barMuted:"#C9D7E7", freeSeg:"#DCE7F3",
    nodeBg:"#EDF4FC", nodeStroke:"#D1E1F3", series:["#00205B","#056DAE","#1E88C7","#00BDF2","#7FD8F7"]
  };
  const THEME_DARK = {
    navy:"#E8F1FC", navyMid:"#C9DFF8", blue:"#38BDF8", sky:"#7DD3FC", red:"#F87171",
    green:"#34D399", amber:"#FBBF24", slate:"#537094", muted:"#9FB3C8", subtle:"#7B93AE",
    grid:"#1E3350", ringTrack:"#1B314E", barMuted:"#263F5E", freeSeg:"#243C5C",
    nodeBg:"#132946", nodeStroke:"#2A4B75", series:["#0284C7","#0EA5E9","#38BDF8","#7DD3FC","#BAE6FD"]
  };
  let theme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  const isDark = () => theme === "dark";
  const C = {...(isDark() ? THEME_DARK : THEME_LIGHT)};

