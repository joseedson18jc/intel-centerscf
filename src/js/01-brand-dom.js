  // ========== BRAND LOGOS (ZERO OFFICIAL CITI LOGO, ID-FREE VECTOR SVGs) ==========
  const scfMark = (size = 34) => `<svg width="${size}" height="${size}" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="SCF Cockpit">
    <rect width="36" height="36" rx="9" fill="rgba(255,255,255,.12)" stroke="rgba(255,255,255,.24)" stroke-width="1.2"/>
    <path d="M9 22.5L15 16.5L19.5 20.5L27 12.5" stroke="#00BDF2" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M22.5 12.5H27V17" stroke="#00BDF2" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="9" cy="22.5" r="2.2" fill="#FFFFFF"/><circle cx="15" cy="16.5" r="2.2" fill="#FFFFFF"/><circle cx="19.5" cy="20.5" r="2.2" fill="#FFFFFF"/>
  </svg>`;

  const BRAND_SVGS = {
    jbs:`<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-label="JBS">
      <rect width="64" height="64" rx="14" fill="#C8102E"/>
      <path d="M0 0H64V28C44 20 18 22 0 32Z" fill="#DF1B38" opacity=".55"/>
      <path d="M8 47C22 53 44 51 57 40" stroke="rgba(255,255,255,.4)" stroke-width="2.6" stroke-linecap="round" fill="none"/>
      <ellipse cx="32" cy="31" rx="26" ry="17" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="1.5"/>
      <text x="32" y="38" text-anchor="middle" font-family="Plus Jakarta Sans,Inter,sans-serif" font-weight="800" font-size="22" letter-spacing="0.5" fill="#FFFFFF">JBS</text>
    </svg>`,
    mbrf:`<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-label="Marfrig MBRF">
      <rect width="64" height="64" rx="14" fill="#FFFFFF"/>
      <path d="M0 0H64V26C48 33 20 33 0 24Z" fill="#006B3F"/>
      <path d="M40 22C49 17 57 18 64 21V28C54 31 44 30 34 27C36 25 38 23.5 40 22Z" fill="#F37021"/>
      <circle cx="17" cy="14" r="5" fill="#A5E2C3" opacity=".9"/><circle cx="23" cy="14" r="5" fill="#F37021" opacity=".95"/>
      <text x="32" y="50" text-anchor="middle" font-family="Plus Jakarta Sans,Inter,sans-serif" font-weight="800" font-size="16" letter-spacing="-0.4" fill="#004C2D">MBRF</text>
    </svg>`,
    vot:`<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-label="Votorantim">
      <rect width="64" height="64" rx="14" fill="#002F87"/>
      <path d="M13 15H24.5L32.8 39.5L26.5 49L13 15Z" fill="#FFFFFF"/>
      <path d="M51 15H39.5L26.5 49H36.5L51 15Z" fill="#00A9E0"/>
      <path d="M32.8 39.5L26.5 49H36.5L38.4 44.5L32.8 39.5Z" fill="#67D4F7"/>
    </svg>`,
    emb:`<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-label="Embraer">
      <rect width="64" height="64" rx="14" fill="#002A78"/>
      <path d="M0 0H64V34C46 24 22 24 0 36Z" fill="#003E9C" opacity=".6"/>
      <path d="M10 38C22 32 36 21 54 14C44 25 34 34 21 40L10 38Z" fill="#FFFFFF"/>
      <path d="M16 45C27 41 40 33 54 24C44 35 33 43 22 48L16 45Z" fill="#00BDF2"/>
      <path d="M10 31L26 26L18 33L10 31Z" fill="#7FD8F7"/>
    </svg>`,
    nat:`<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-label="Natura">
      <rect width="64" height="64" rx="14" fill="#F26F1D"/>
      <path d="M0 0H64V30C44 20 20 22 0 34Z" fill="#FF8C3B" opacity=".55"/>
      <g transform="translate(32 27)" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round">
        <path d="M0 10C-1 2 -1 -6 0 -13"/><path d="M0 10C-6 4 -11 -2 -14 -8"/><path d="M0 10C6 4 11 -2 14 -8"/>
        <path d="M0 10C-9 8 -16 4 -19 -1"/><path d="M0 10C9 8 16 4 19 -1"/>
        <circle cx="0" cy="-14" r="2.2" fill="#FFFFFF" stroke="none"/><circle cx="-14.5" cy="-8.5" r="2" fill="#FFFFFF" stroke="none"/><circle cx="14.5" cy="-8.5" r="2" fill="#FFFFFF" stroke="none"/>
      </g>
      <text x="32" y="54" text-anchor="middle" font-family="Plus Jakarta Sans,Inter,sans-serif" font-weight="700" font-size="12" letter-spacing="0.4" fill="#FFFFFF">natura</text>
    </svg>`
  };

  const INFRA_SVGS = {
    b3:`<span class="infra-chip"><svg width="16" height="16" viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#001E62"/><text x="12" y="16.5" text-anchor="middle" font-family="Plus Jakarta Sans,sans-serif" font-weight="800" font-size="12" fill="#fff">B³</text></svg>B3</span>`,
    cerc:`<span class="infra-chip"><svg width="16" height="16" viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#0A6E7D"/><circle cx="12" cy="12" r="5.5" fill="none" stroke="#67E8F9" stroke-width="2.5"/></svg>CERC</span>`,
    nuclea:`<span class="infra-chip"><svg width="16" height="16" viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#2E1A6B"/><path d="M7 17V7L17 17V7" fill="none" stroke="#A78BFA" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>Núclea</span>`,
    bcb:`<span class="infra-chip"><svg width="16" height="16" viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#003B71"/><path d="M5 10L12 5L19 10M7 12V17M12 12V17M17 12V17M5 18.5H19" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg>BCB</span>`,
    cvm:`<span class="infra-chip"><svg width="16" height="16" viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#1E3A5F"/><text x="12" y="15.5" text-anchor="middle" font-family="Inter,sans-serif" font-weight="800" font-size="8.5" fill="#7FD8F7">CVM</text></svg>CVM · FIDCs</span>`
  };

  const brandBadge = (id, size = "") => `<span class="brand-badge ${size}" aria-hidden="true">${BRAND_SVGS[id] || ""}</span>`;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));

  $("brandMark").innerHTML = scfMark(32);
  $("deckBrandMark").innerHTML = scfMark(28);
  $("infra-1").innerHTML = INFRA_SVGS.cvm;
  $("infra-2").innerHTML = INFRA_SVGS.bcb + INFRA_SVGS.cvm;
  $("infra-3").innerHTML = INFRA_SVGS.b3 + INFRA_SVGS.cerc + INFRA_SVGS.nuclea;
  $("infra-4").innerHTML = INFRA_SVGS.b3 + INFRA_SVGS.cerc + INFRA_SVGS.nuclea + INFRA_SVGS.bcb;

