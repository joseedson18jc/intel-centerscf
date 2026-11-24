  // ========== RINGS, SECTORS, FUNNEL, DECILES, FRICTION ==========
  const ringPrev = {r1:0, r2:0};
  function ring(id, val, col) {
    const s = $(id), r = 46, circ = 2 * Math.PI * r;
    if (!s.children.length) {
      const bg = el("circle", {cx:60, cy:60, r, fill:"none", stroke:C.ringTrack, "stroke-width":10}, s); bg.id = id + "-bg";
      const c = el("circle", {cx:60, cy:60, r, fill:"none", stroke:col, "stroke-width":10, "stroke-linecap":"round", transform:"rotate(-90 60 60)", "stroke-dasharray":circ, "stroke-dashoffset":circ}, s); c.id = id + "-arc";
      const t = el("text", {x:60, y:68, "text-anchor":"middle", class:"rval"}, s); t.id = id + "-txt";
    }
    const bg = $(id + "-bg"), arc = $(id + "-arc"), txt = $(id + "-txt");
    bg.setAttribute("stroke", C.ringTrack); arc.setAttribute("stroke", col);
    arc.style.transition = reduce ? "none" : "stroke-dashoffset .7s cubic-bezier(.2,.8,.2,1)";
    arc.setAttribute("stroke-dashoffset", circ * (1 - val / 100));
    const from = ringPrev[id] || 0; ringPrev[id] = val;
    tween("ring-" + id, from, val, 520, v => txt.textContent = Math.round(v) + "%");
  }

  const SECT = [[["Agribusiness","Agronegócio"],31,52],[["Retail","Varejo"],22,38],[["Automotive","Automotivo"],27,41],[["Pharma","Farmacêutico"],18,30],[["Construction","Construção"],12,21]];
  function sectors(w) {
    const box = $("sectors");
    if (!box.children.length) SECT.forEach(() => { const r = document.createElement("div"); r.className = "bar"; r.innerHTML = `<span></span><div class="track"><div class="fill"></div></div><span class="n">0%</span>`; box.appendChild(r); });
    [...box.children].forEach((r, j) => {
      const v = Math.round(SECT[j][1] + (SECT[j][2] - SECT[j][1]) * (w - 1) / Math.max(1, W - 1));
      r.firstChild.textContent = L(SECT[j][0]); r.querySelector(".fill").style.width = (v / 60 * 100) + "%"; r.querySelector(".n").textContent = v + "%";
    });
  }

  const STEPS = [["Invited","Convidados"],["Opened e-mail","Abriram o e-mail"],["Started KYC","Iniciaram o KYC"],["Uploaded documents","Enviaram documentos"],["Approved","Aprovados"],["First discount","Primeiro desconto"]];
  // Example invitation wave: fixed example data (300 suppliers invited). It is NOT derived from the supplier
  // base parameter, so it does not scale when BASE_SUP changes; funnelNote() says so on screen.
  const F = {before:[300,210,150,85,62,40], after:[300,210,150,124,102,66]};
  const WAVE = F.before[0];
  let mode = "after", modeManual = false;
  function setMode(m) {
    mode = m;
    funnel();
  }
  function syncFunnel(w) { if (!modeManual) { const target = w >= 5 ? "after" : "before"; if (target !== mode) setMode(target); } }
  function funnel() {
    const box = $("funnel"), v = F[mode];
    // The selected tab is written on every draw, so it can never disagree with the numbers shown
    // (on load the page opens in week 12 with the "after" funnel while the markup marked "before").
    $("before").setAttribute("aria-pressed", String(mode === "before"));
    $("after").setAttribute("aria-pressed", String(mode === "after"));
    if (!box.children.length) STEPS.forEach(() => { const r = document.createElement("div"); r.className = "fstep"; r.innerHTML = `<span></span><div class="track"><div class="fill"></div></div><span class="n">0</span>`; box.appendChild(r); });
    [...box.children].forEach((r, i) => {
      r.firstChild.textContent = L(STEPS[i]);
      r.classList.toggle("leak", mode === "before" && i === 3);
      r.classList.toggle("win", mode === "after" && i >= 3);
      r.querySelector(".fill").style.width = (v[i] / WAVE * 100) + "%";
      const n = r.querySelector(".n");
      tween("fn-" + i, +n.textContent || 0, v[i], 450, x => n.textContent = Math.round(x));
    });
    const lost = Math.round((1 - v[3] / v[2]) * 100);
    $("fcall").innerHTML = mode === "before"
      ? T(`Biggest leak: <b>−${lost}%</b> of suppliers lost at the documents step.`,`Maior perda: <b>−${lost}%</b> dos fornecedores na etapa de documentos.`)
      : T(`Document AI cuts the loss at the documents step from ${Math.round((1 - F.before[3] / F.before[2]) * 100)}% to <b style="color:var(--blue)">${lost}%</b> and lifts first discounts from ${F.before[5]} to <b style="color:var(--blue)">${F.after[5]}</b>.`,`A IA de documentos reduz a perda na etapa de documentos de ${Math.round((1 - F.before[3] / F.before[2]) * 100)}% para <b style="color:var(--blue)">${lost}%</b> e eleva os primeiros descontos de ${F.before[5]} para <b style="color:var(--blue)">${F.after[5]}</b>.`);
    funnelNote();
  }
  // Labels the funnel as the example invitation wave and, when the supplier base differs from the wave,
  // states that the two numbers are unrelated (the note element belongs to the Step 1 panel, key "fn.note").
  function funnelNote() {
    const n = document.querySelector('[data-i18n="fn.note"]'); if (!n) return;
    n.textContent = T(`Example invitation wave: ${nf(WAVE)} suppliers invited. `,`Onda de convites de exemplo: ${nf(WAVE)} fornecedores convidados. `)
      + (BASE_SUP !== WAVE ? T(`It is fixed example data and does not scale with the supplier base of ${nf(BASE_SUP)} set in the parameters. `,`É um dado de exemplo fixo e não acompanha a base de ${nf(BASE_SUP)} fornecedores definida nos parâmetros. `) : "")
      + L(I18N["fn.note"]);
  }
  onRefresh(funnelNote);
  $("before").onclick = () => { modeManual = true; setMode("before"); };
  $("after").onclick  = () => { modeManual = true; setMode("after"); };

  const DEC = [38,29,22,16,12,9,7,5,3,2];
  function deciles() {
    const s = $("dec"); s.innerHTML = "";
    const bw = 30, gap = 10, x0 = 14, base = 148, h = 104;
    DEC.forEach((v, i) => {
      const x = x0 + i * (bw + gap), top = i < 3, bh = v / 40 * h;
      el("rect", {x, y:base - bh, width:bw, height:bh, rx:5, fill: top ? C.blue : C.barMuted}, s);
      el("text", {x:x + bw / 2, y:base - bh - 6, "text-anchor":"middle", "font-size":11, fill: top ? C.navy : C.subtle, "font-weight":700}, s).textContent = v + "%";
      el("text", {x:x + bw / 2, y:base + 17, "text-anchor":"middle", "font-size":11, fill:C.subtle, "font-weight":600}, s).textContent = "D" + (i + 1);
    });
    el("text", {x:x0, y:14, "font-size":11.5, fill:C.blue, "font-weight":700}, s).textContent = T("Top 30% of suppliers ≈ 62% of activations","30% melhores no score ≈ 62% das ativações");
  }
  let prevCamp = 0;
  function uplift(w) {
    const camp = Math.round(12 + 19 * Math.min(1, Math.max(0, (w - 2) / 4))), ctrl = 12;
    tween("uplift", prevCamp, camp, 460, v => $("ucamp").textContent = Math.round(v) + "%");
    prevCamp = camp; $("uctrl").textContent = ctrl + "%";
    $("ucampb").style.width = (camp / 40 * 100) + "%"; $("uctrlb").style.width = (ctrl / 40 * 100) + "%";
    $("upp").textContent = "+" + (camp - ctrl) + " pp";
  }

  function renderFriction() {
    const stages = [[["KYC start → upload","Início do KYC → envio"],2,3],[["Upload → approval","Envio → aprovação"],3,4],[["Approval → first discount","Aprovação → primeiro desconto"],4,5],[["Invite → first discount","Convite → primeiro desconto"],0,5]];
    const rate = (s, a, b) => 100 * s[b] / s[a];
    const beforeLoss = 100 - rate(F.before, 2, 3), afterLoss = 100 - rate(F.after, 2, 3);
    $("friction-gain").textContent = nf(beforeLoss - afterLoss, 1) + T(" pp lower"," pp a menos");
    $("friction-detail").textContent = T(`Among suppliers starting KYC, ${nf(beforeLoss, 1)}% dropped out before uploading documents in the baseline scenario, vs. ${nf(afterLoss, 1)}% with document AI.`,`Entre os fornecedores que iniciaram o KYC, ${nf(beforeLoss, 1)}% desistiram antes de enviar os documentos no cenário-base, contra ${nf(afterLoss, 1)}% com IA de documentos.`);
    $("conversion-rows").innerHTML = stages.map(([label, a, b]) => {
      const base = rate(F.before, a, b), ai = rate(F.after, a, b), g = ai - base;
      return `<tr><th scope="row">${L(label)}</th><td>${nf(base, 1)}%</td><td>${nf(ai, 1)}%</td><td>${g >= 0 ? "+" : "−"}${nf(Math.abs(g), 1)} pp</td></tr>`;
    }).join("");
  }

