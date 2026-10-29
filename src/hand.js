// Bug Avcısı: İstanbul — el yapımı Maslak bölümlerinin çizimleri (v2.1 prototipi).
// Cam cephe, saksı, turnike, simitçi tezgâhı, kartlı cam kapı ve okuyucu, asma tavan / taban kapağı, fan,
// sunucu kabinleri, kahve makinesi, toplantı masası, altın simit; uyuyan, kaçan, bakan bug'lar, simit hırsızı martı,
// Kral Bug'ın taklitçi prensi. Hepsi mantıksal pikselle (1 karo = 16).
(function (root) {
  'use strict';
  const A = root.BA_ART;
  const { K, box, circle, ellipse, poly, lin, grad, rr, mk } = A;
  const cache = A.cache();
  const cached = (key, fn) => { let c = cache.get(key); if (!c) { c = mk(16, 16, fn); cache.set(key, c); } return c; };

  // ---------------- karolar ----------------
  // cam cephe (dış mekân): koyu turkuaz camlar, alüminyum kayıtlar, kat döşemesi çizgisi; tepe karosunda korkuluk,
  // kulenin kenarlarında koyu çizgi (arka plandaki plazalardan ayrılsın)
  function glassOut(g, top, l, r) {
    g.fillStyle = grad(g, 0, 0, 16, 16, [[0, '#4fa6c8'], [0.55, '#2a76a0'], [1, '#1d5a82']]); g.fillRect(0, 0, 16, 16);
    poly(g, [1, 0, 6, 0, 1, 7], 'rgba(255,255,255,0.3)', null); poly(g, [9, 6, 15, 0, 15, 4, 11, 8], 'rgba(255,255,255,0.14)', null);
    g.fillStyle = '#163a56'; g.fillRect(0, 11.5, 16, 2.2);            // kat döşemesi
    g.fillStyle = 'rgba(160,220,245,0.55)'; g.fillRect(0, 11.5, 16, 0.5);
    g.fillStyle = '#d8e2ea'; g.fillRect(7.6, 0, 0.8, 16);                // dikey kayıt
    if (l) { g.fillStyle = '#d8e2ea'; g.fillRect(0, 0, 1.6, 16); g.fillStyle = K; g.fillRect(0, 0, 0.8, 16); }
    if (r) { g.fillStyle = '#d8e2ea'; g.fillRect(14.4, 0, 1.6, 16); g.fillStyle = K; g.fillRect(15.2, 0, 0.8, 16); }
    if (top) {
      box(g, l ? 0 : -1, 0, 16 + (l ? 0 : 1) + (r ? 0 : 1), 3.2, 0.8, '#e8edf2', K, 0.7);
      g.fillStyle = '#9aa4b2'; g.fillRect(0, 2.6, 16, 0.6);
    }
  }
  // iç mekân cam bölme: mavimsi cam, ortasında buzlu şerit, alüminyum çerçeve (kapıyla aynı dil)
  function glassIn(g, top) {
    g.fillStyle = 'rgba(150,210,236,0.5)'; g.fillRect(1.6, 0, 12.8, 16);
    g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(1.6, 6.5, 12.8, 3);
    for (let x = 3; x < 14; x += 2.2) { g.fillStyle = 'rgba(150,200,225,0.6)'; g.fillRect(x, 7.4, 1, 1); }
    poly(g, [3, 0, 6.5, 0, 2.2, 7, 2.2, 3.5], 'rgba(255,255,255,0.4)', null);
    for (const x of [0, 14.4]) { g.fillStyle = '#9aa6b8'; g.fillRect(x, 0, 1.6, 16); g.fillStyle = '#5a6478'; g.fillRect(x + (x ? 1.2 : 0), 0, 0.4, 16); }
    if (top) { g.fillStyle = '#9aa6b8'; g.fillRect(0, 0, 16, 1.6); g.fillStyle = '#5a6478'; g.fillRect(0, 0, 16, 0.4); }
  }
  function glass(theme, top, l, r) {
    if (theme !== 0) return cached(`glass:i:${top ? 1 : 0}`, (g) => glassIn(g, top));
    return cached(`glass:o:${top ? 1 : 0}${l ? 1 : 0}${r ? 1 : 0}`, (g) => glassOut(g, top, l, r));
  }

  // saksı: beton saksı, içinde yuvarlak çalı ve birkaç çiçek
  function planter() {
    return cached('saksi', (g) => {
      ellipse(g, 8, 6.4, 7.4, 5.2, '#4e9e3a', K, 0.7);
      ellipse(g, 5, 5.2, 3.6, 3, '#62b84a', null); ellipse(g, 10.6, 4.6, 3.2, 2.6, '#6cc452', null);
      for (const [x, y, c] of [[4, 4, '#ff7a9a'], [9, 3, '#ffe27a'], [12, 6, '#ff7a9a'], [7, 7, '#ffffff']]) circle(g, x, y, 0.9, c, null);
      box(g, 1, 8.6, 14, 7.2, 1.2, grad(g, 0, 9, 0, 16, [[0, '#d4d0c8'], [1, '#a8a49c']]), K, 0.7);
      g.fillStyle = '#eeeae2'; g.fillRect(1.6, 9.2, 12.8, 1);
    });
  }
  // turnike kolu: üstteki cama bağlı paslanmaz kol, kırmızı-beyaz uç
  function turnstile() {
    return cached('turnike', (g) => {
      box(g, 6.6, 0, 2.8, 7, 0.6, '#b8c0cc', K, 0.6);
      box(g, -1, 6, 18, 3.4, 1.6, grad(g, 0, 6, 0, 9.4, [[0, '#f2f4f8'], [1, '#9aa4b2']]), K, 0.7);
      for (let x = 10; x < 16; x += 3) { g.fillStyle = '#e2483a'; g.fillRect(x, 6.4, 1.5, 2.6); }
      circle(g, 8, 7.7, 1.4, '#3ae0ff', K, 0.5);
    });
  }
  // kapak: ofiste asma tavan karosu, sunucu katında yükseltilmiş taban karosu; ikisinde de belli belirsiz tutamak
  function panel(theme) {
    return cached(`kapak:${theme}`, (g) => {
      if (theme === 11) {
        g.fillStyle = '#a4acba'; g.fillRect(0, 0, 16, 16);
        g.fillStyle = '#8e96a6'; for (let y = 2; y < 16; y += 3) for (let x = 2; x < 16; x += 3) g.fillRect(x, y, 1.2, 1.2);
        g.strokeStyle = '#5a6272'; g.lineWidth = 0.8; g.strokeRect(0.4, 0.4, 15.2, 15.2);
        box(g, 5, 6.6, 6, 2.6, 1.2, '#6e7686', K, 0.5);
      } else {
        g.fillStyle = '#eef0f2'; g.fillRect(0, 0, 16, 16);
        g.fillStyle = '#d8dce2'; for (let k = 0; k < 6; k++) g.fillRect(1 + k * 2.6, 2 + (k % 3) * 4, 1.4, 0.7);
        g.strokeStyle = '#a8aeb8'; g.lineWidth = 0.8; g.strokeRect(0.4, 0.4, 15.2, 15.2);
        lin(g, 6, 13.6, 10, 13.6, '#8a909c', 0.8);
      }
    });
  }
  // sunucu kabini: koyu gövde, ızgara, LED'ler. sıcak: kırmızı LED'ler (iki kare), soğuk: yeşil-mavi
  function rack(hot, top, f) {
    return cached(`kabin:${hot ? 1 : 0}:${top ? 1 : 0}:${f}`, (g) => {
      // öndeki kabinler arka plandakilerden açık renkli ve kalın çerçeveli
      g.fillStyle = hot ? '#7a3a3a' : '#5a6880'; g.fillRect(0.5, 0, 15, 16);
      g.fillStyle = hot ? '#4a2228' : '#2a3242'; g.fillRect(2, 1.5, 12, 13);
      g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 0.5;
      for (let y = 3; y < 14; y += 2.2) { g.beginPath(); g.moveTo(3, y); g.lineTo(11, y); g.stroke(); }
      const on = hot ? ['#ff3a2a', '#ff9a3a'] : ['#3aff8a', '#3ae0ff'];
      for (let k = 0; k < 4; k++) {
        const lit = hot ? (k + f) % 2 === 0 : (k * 3 + f) % 4 !== 0;
        circle(g, 12.6, 3 + k * 3.2, 0.8, lit ? on[k % 2] : '#1a1e26', null);
      }
      g.strokeStyle = K; g.lineWidth = 0.8; g.strokeRect(0.5, 0, 15, 16);
      if (top) { box(g, 0, 0, 16, 2.4, 0.6, hot ? '#5a3038' : '#3e4658', K, 0.7); }
    });
  }
  // fan ızgarası (alt katman; kanatlar her karede döner)
  function fanBase(theme) {
    return cached(`fan:${theme}`, (g) => {
      g.fillStyle = theme === 11 ? '#a4acba' : '#8a909c'; g.fillRect(0, 0, 16, 16);
      circle(g, 8, 8, 6.6, '#1c2028', K, 0.7);
      g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 0.4; g.strokeRect(0.3, 0.3, 15.4, 15.4);
    });
  }
  // fan: kanatlar (spin 0..1) ve üstünde yükselen hava çizgileri; aralıklı fan duracakken kırmızı uyarı
  function drawFan(g, x, y, t, f, warn) {
    g.save(); g.translate(x + 8, y + 8);
    const a = t * 18 * f.spin;
    g.save(); g.beginPath(); g.arc(0, 0, 6, 0, Math.PI * 2); g.clip();
    for (let k = 0; k < 5; k++) { g.save(); g.rotate(a + k * 1.2566); ellipse(g, 3, 0, 3.2, 1.3, '#c8d0dc', null, 0, 0.4); g.restore(); }
    circle(g, 0, 0, 1.4, '#5a6272', null);
    g.restore();
    // ızgara çubukları
    g.strokeStyle = 'rgba(30,34,44,0.85)'; g.lineWidth = 0.6;
    for (const d of [-3, 0, 3]) { g.beginPath(); g.moveTo(d, -6); g.lineTo(d, 6); g.stroke(); }
    if (f.cyc) circle(g, 6.2, -6.2, 1.1, warn ? (Math.floor(t * 8) % 2 ? '#ff3a2a' : '#5a1a1a') : f.on ? '#7cff6a' : '#ff3a2a', K, 0.4);
    g.restore();
  }
  function drawAir(g, x, y, reach, t, s) {
    if (s < 0.05 || reach < 1) return;
    const R = reach - 1.8;
    if (R <= 0) return;
    for (let k = 0; k < 4; k++) {
      const ph = ((t * 1.3 + k * 0.25) % 1), yy = y - ph * R * 16, a = s * 0.7 * Math.sin(ph * Math.PI);
      const xx = x + 3 + k * 3.2 + Math.sin(t * 6 + k) * 0.8;
      g.strokeStyle = `rgba(230,250,255,${a})`; g.lineWidth = 1;
      g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx, yy - 6); g.stroke();
    }
    // sütunun hafif parıltısı
    const gr = g.createLinearGradient(0, y, 0, y - R * 16);
    gr.addColorStop(0, `rgba(170,230,255,${0.16 * s})`); gr.addColorStop(1, 'rgba(170,230,255,0)');
    g.fillStyle = gr; g.fillRect(x + 1, y - R * 16, 14, R * 16);
  }
  // sıcak kabinin tepesinde titreyen sıcak hava
  function drawHeat(g, x, y, t) {
    for (let k = 0; k < 3; k++) {
      const ph = (t * 0.9 + k * 0.33) % 1, yy = y - ph * 10, a = 0.35 * Math.sin(ph * Math.PI);
      g.strokeStyle = `rgba(255,150,90,${a})`; g.lineWidth = 0.8;
      g.beginPath();
      for (let i = 0; i <= 6; i++) { const px = x + 3 + k * 4 + Math.sin(t * 9 + i + k) * 1, py = yy - i; if (i) g.lineTo(px, py); else g.moveTo(px, py); }
      g.stroke();
    }
  }

  // simitçi tezgâhı (2 karo): kırmızı tekerlekli araba, camlı vitrinde simitler, çizgili tente (basılınca ezilir)
  function drawCart(g, x, y, sq) {
    const w = 32, ty = y + sq * 2.5;
    lin(g, x + 3, y + 16, x + 1, y + 6, K, 1.6); lin(g, x + 3, y + 16, x + 1, y + 6, '#c8ccd4', 0.7);   // sap
    box(g, x + 4, y + 9, w - 7, 5.4, 1, '#c8302a', K, 0.7);
    for (const wx of [x + 8, x + w - 7]) { circle(g, wx, y + 14.6, 2, '#2a2a30', K, 0.5); circle(g, wx, y + 14.6, 0.7, '#9aa0aa', null); }
    box(g, x + 5, ty + 3.4, w - 9, 6, 0.8, 'rgba(220,240,250,0.75)', K, 0.6);
    for (let k = 0; k < 4; k++) A.drawSimit(g, x + 9 + k * 5, ty + 6.6, 0, 2.2);
    // tente
    g.save(); rr(g, x + 2, ty, w - 4, 3.6, 1.6); g.clip();
    for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? '#ffffff' : '#e2302a'; g.fillRect(x + 2 + k * 3.6, ty, 3.6, 3.6); }
    g.restore();
    rr(g, x + 2, ty, w - 4, 3.6, 1.6); g.strokeStyle = K; g.lineWidth = 0.7; g.stroke();
  }

  // kartlı cam kapı: iki kanat yana kayar; üstünde durum ışığı (kırmızı kilitli, yeşil açık)
  function drawDoor(g, d, t, inside) {
    const x = d.x * 16, y0 = d.y0 * 16, h = (d.y1 - d.y0 + 1) * 16;
    const since = t - d.t, e = Math.min(1, Math.max(0, since / 0.22));
    const open = d.open ? e : 1 - e;
    g.fillStyle = '#7a8496'; g.fillRect(x, y0 - 1.6, 16, 1.6);
    const pw = 8 * (1 - open);
    for (const s of [-1, 1]) {
      const px = s < 0 ? x : x + 16 - pw;
      if (pw < 0.3) continue;
      g.fillStyle = inside ? 'rgba(170,226,246,0.55)' : 'rgba(120,200,236,0.7)'; g.fillRect(px, y0, pw, h);
      g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(px + pw * 0.25, y0 + 3, 0.8, h - 6);
      g.strokeStyle = '#5a6478'; g.lineWidth = 0.8; g.strokeRect(px, y0, pw, h);
    }
    circle(g, x + 8, y0 - 3.2, 1.4, d.open ? '#7cff6a' : '#ff3a2a', K, 0.5);
  }
  // kart okuyucu: duvardaki küçük kutu; süre işlerken yeşil halka geri sayar
  function drawReader(g, r, t) {
    const x = r.x * 16 + 4, y = r.y * 16 - 3;
    const act = r.t > 0;
    box(g, x, y, 8, 11, 1.4, '#2a3040', K, 0.7);
    box(g, x + 1.4, y + 1.4, 5.2, 3.4, 0.6, act ? '#0f3a1a' : '#3a1414', null);
    circle(g, x + 4, y + 3.1, 1, act ? '#7cff6a' : '#ff5a4a', null);
    for (let k = 0; k < 3; k++) { g.strokeStyle = 'rgba(200,210,230,0.5)'; g.lineWidth = 0.5; g.beginPath(); g.arc(x + 4, y + 8, 1 + k * 0.9, -2.4, -0.7); g.stroke(); }
    if (act) {
      const k = r.t / r.dur;
      g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 2; g.beginPath(); g.arc(x + 4, y - 4, 3.2, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = k < 0.3 && Math.floor(t * 8) % 2 ? '#ffd84a' : '#7cff6a'; g.lineWidth = 1.4;
      g.beginPath(); g.arc(x + 4, y - 4, 3.2, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); g.stroke();
    }
  }
  // kahve makinesi (alttan vurulunca kahve çıkar)
  function coffee(used) {
    return cached(`kahve:${used ? 1 : 0}`, (g) => {
      box(g, 1, 0.8, 14, 14.6, 2, used ? '#5a5e68' : '#3a3e48', K, 0.8);
      box(g, 2.6, 2, 10.8, 3.4, 1, used ? '#6e727c' : '#c8ccd4', null);
      circle(g, 11.4, 3.7, 0.9, used ? '#2a2e36' : '#7cff6a', null);
      g.fillStyle = used ? '#2a2e36' : '#1a1c22'; g.fillRect(4, 6.4, 8, 6.4);
      box(g, 6.6, 6.2, 2.8, 1.6, 0.4, '#9aa0aa', null);
      if (!used) {
        box(g, 5.6, 9.4, 4.8, 3.4, 0.8, '#ffffff', K, 0.5);
        g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(7.4, 8.8); g.quadraticCurveTo(6.6, 7.6, 7.8, 7); g.stroke();
      }
      g.fillStyle = '#7a7e88'; g.fillRect(3, 13, 10, 1);
    });
  }

  // ---------------- süsler ----------------
  // toplantı masası (3 karo): beyaz masa, laptoplar, kâğıtlar, su bardakları; (cx, by): orta ve zemin
  function drawTable(g, cx, by) {
    for (const dx of [-18, 18]) { lin(g, cx + dx, by, cx + dx, by - 9, K, 2); lin(g, cx + dx, by, cx + dx, by - 9, '#9aa4b2', 0.9); }
    box(g, cx - 22, by - 11, 44, 2.6, 1, '#f2f4f6', K, 0.7);
    box(g, cx - 14, by - 17, 9, 6, 0.6, '#c9ccd4', K, 0.5); g.fillStyle = '#14202a'; g.fillRect(cx - 13, by - 16, 7, 4.2);
    box(g, cx + 6, by - 17, 9, 6, 0.6, '#c9ccd4', K, 0.5); g.fillStyle = '#14202a'; g.fillRect(cx + 7, by - 16, 7, 4.2);
    g.fillStyle = '#7cff6a'; g.fillRect(cx - 12, by - 14.6, 3, 0.7); g.fillRect(cx + 8, by - 15.4, 4, 0.7);
    g.save(); g.translate(cx - 2, by - 11.4); g.rotate(-0.1); box(g, -3, -0.8, 6, 1, 0.2, '#ffffff', K, 0.3); g.restore();
    for (const dx of [-3, 3]) { box(g, cx + dx - 1, by - 14, 2, 3, 0.4, 'rgba(190,230,255,0.7)', K, 0.4); }
  }
  // bankta uyuyan bug'ın çay bardağı (bankın üstünde)
  function drawCup(g, x, by) {
    ellipse(g, x, by - 0.4, 2.4, 0.6, '#f4f0e6', K, 0.4);
    poly(g, [x - 1.4, by - 5, x + 1.4, by - 5, x + 0.9, by - 0.6, x - 0.9, by - 0.6], '#c83a1e', K, 0.4);
    g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(x - 1.1, by - 4.8, 2.2, 0.7);
  }

  // altın simit: ağır ağır döner, ışıltılı; alınmış olanı soluk
  function drawGold(g, cx, cy, t, faded) {
    g.save();
    if (!faded) {
      const gl = g.createRadialGradient(cx, cy, 1, cx, cy, 13);
      gl.addColorStop(0, `rgba(255,230,120,${0.5 + Math.sin(t * 4) * 0.15})`); gl.addColorStop(1, 'rgba(255,230,120,0)');
      g.fillStyle = gl; g.fillRect(cx - 13, cy - 13, 26, 26);
    }
    g.globalAlpha = faded ? 0.45 : 1;
    const sx = Math.cos(t * 1.6), r = 6.6;
    g.translate(cx, cy); g.scale(Math.max(0.14, Math.abs(sx)), 1);
    const gr = g.createRadialGradient(-1.8, -2.4, 0.5, 0, 0, r);
    gr.addColorStop(0, '#fff6c0'); gr.addColorStop(0.5, '#f4c531'); gr.addColorStop(1, '#b8860b');
    g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.arc(0, 0, r * 0.42, 0, Math.PI * 2, true); g.fillStyle = gr; g.fill('evenodd');
    g.strokeStyle = '#6a4a0a'; g.lineWidth = 0.8; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(0, 0, r * 0.42, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 0.7; g.beginPath(); g.arc(0, 0, r * 0.72, -2.6, -1.6); g.stroke();
    g.restore();
    if (!faded) {
      const k = (t * 0.7) % 1;
      if (k < 0.3) { const a = Math.sin(k / 0.3 * Math.PI); const sx2 = cx + 4, sy2 = cy - 5; g.fillStyle = `rgba(255,255,255,${a})`; poly(g, [sx2, sy2 - 3, sx2 + 0.7, sy2 - 0.7, sx2 + 3, sy2, sx2 + 0.7, sy2 + 0.7, sx2, sy2 + 3, sx2 - 0.7, sy2 + 0.7, sx2 - 3, sy2, sx2 - 0.7, sy2 - 0.7], `rgba(255,255,255,${a})`, null); }
    }
  }
  // HUD için küçük altın simit yuvası
  function goldSlot(g, cx, cy, got) {
    circle(g, cx, cy, 3.3, got ? '#f4c531' : 'rgba(255,255,255,0.12)', got ? '#6a4a0a' : 'rgba(255,255,255,0.35)', 0.6);
    circle(g, cx, cy, 1.3, got ? '#7a5a1a' : 'rgba(10,8,28,0.6)', null);
    if (got) { g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 0.5; g.beginPath(); g.arc(cx, cy, 2.4, -2.6, -1.5); g.stroke(); }
  }

  // ---------------- canlılar ----------------
  // bug, duygularıyla: uyku (göz kapalı, Z'ler), irkilme (!), kaçış (ter damlaları), toplantı (masaya dönük), bakış (!)
  function drawMoodBug(g, e, t, toward) {
    const cx = (e.x + e.w / 2) * 16, by = (e.y + e.h) * 16;
    const st = e.state;
    let dir = e.vx > 0 ? 1 : e.vx < 0 ? -1 : (e.face || -1);
    if (st === 'sleep') {
      const sy = by - 9;   // bankın oturağında
      A.drawBug(g, cx, sy, 0, -1, false);
      // kapalı gözler
      for (const [ex, ey, r] of [[-6.2, -5.6, 1.6], [-3.6, -5.8, 1.5]]) { circle(g, cx + ex, sy + ey, r, '#3d8f2e', null); lin(g, cx + ex - r * 0.8, sy + ey + 0.2, cx + ex + r * 0.8, sy + ey + 0.2, K, 0.6); }
      // Z'ler
      for (let k = 0; k < 3; k++) {
        const ph = (t * 0.5 + k / 3) % 1, a = Math.sin(ph * Math.PI);
        g.save(); g.globalAlpha = a; g.fillStyle = '#ffffff'; g.strokeStyle = K; g.lineWidth = 1.4;
        g.font = `600 ${4 + ph * 3}px Fredoka, sans-serif`; g.textAlign = 'center';
        const zx = cx - 4 + ph * 8 + Math.sin(ph * 6) * 1.5, zy = sy - 14 - ph * 12;
        g.strokeText('z', zx, zy); g.fillText('z', zx, zy); g.restore();
      }
      return;
    }
    if (st === 'meet') dir = e.face || -1;
    if (st === 'look' || st === 'jolt') dir = toward;
    const hop = st === 'jolt' ? 0 : 0;
    A.drawBug(g, cx, by + hop, st === 'meet' ? 0 : e.t, dir, false);
    if (st === 'jolt' || st === 'look') {
      // ünlem balonu
      const bx = cx + (st === 'look' ? 0 : -dir * 2), byy = by - 22 - Math.min(1, e.st * 6) * 2;
      box(g, bx - 3.4, byy - 7, 6.8, 9, 3, '#ffffff', K, 0.7);
      g.fillStyle = '#e2302a'; g.fillRect(bx - 0.8, byy - 5.4, 1.6, 4); g.fillRect(bx - 0.8, byy - 0.6, 1.6, 1.4);
    }
    if (st === 'flee') {
      for (let k = 0; k < 2; k++) {
        const ph = (t * 4 + k * 0.5) % 1;
        ellipse(g, cx - dir * (4 + ph * 6), by - 12 - k * 3 + ph * 2, 1, 1.5, `rgba(140,210,255,${1 - ph})`, null);
      }
    }
    if (e.slide) {
      // kanalda kayarken ayakların altında kıvılcım
      for (let k = 0; k < 3; k++) circle(g, cx - 4 + k * 3 + Math.sin(t * 30 + k) * 1, by - 0.6, 0.7, k % 2 ? '#ffe14a' : '#ffffff', null);
    }
  }
  // simit hırsızı martı: gagasında simit; ezilince takla atarak, başı dönerek uçar
  function drawThief(g, e, t) {
    const cx = (e.x + e.w / 2) * 16, by = (e.y + e.h) * 16;
    const dir = e.face || -1;
    g.save();
    if (e.state === 'bonk') { g.translate(cx, by - 5); g.rotate(e.st * 9); g.translate(-cx, -(by - 5)); }
    A.drawMarti(g, cx, by + 1, t * (e.state === 'perch' ? 0.6 : 1.4), dir, e.state === 'dive');
    if (e.carry) A.drawSimit(g, cx + dir * 11, by - 4, 0, 3.2);
    g.restore();
    if (e.state === 'bonk') for (let k = 0; k < 3; k++) { const a = t * 6 + k * 2.1; A.circle(g, cx + Math.cos(a) * 6, by - 14 + Math.sin(a) * 2, 0.9, '#ffe27a', null); }
  }
  // Kral Bug'ın prensi: küçük bug, minik taç; kaçarken titrer
  function drawPrince(g, pr, t) {
    const cx = pr.x * 16 + 6, by = (pr.y + 0.55) * 16;
    const sh = pr.flee ? (Math.floor(t * 30) % 2 ? 0.6 : -0.6) : 0;
    g.save(); g.translate(cx + sh, by); g.scale(0.7, 0.7);
    A.drawBug(g, 0, 0, pr.ground && !pr.flee ? t : 0, pr.face > 0 ? 1 : -1, false);
    g.save(); g.scale(pr.face > 0 ? -1 : 1, 1); A.crown(g, -7.5, -14.5, 5); g.restore();
    g.restore();
    if (pr.flee) for (let k = 0; k < 2; k++) { const ph = (t * 3 + k * 0.5) % 1; ellipse(g, cx + (k ? 5 : -5), by - 12 + ph * 4, 0.8, 1.2, `rgba(140,210,255,${1 - ph})`, null); }
  }

  // ---------------- arka planlar ----------------
  // karanlık bölge (tavan arası, taban altı): koyu zemin, borular ve kablolar
  function darkTile(theme, k) {
    return cached(`karanlik:${theme}:${k}`, (g) => {
      g.fillStyle = theme === 11 ? '#10141c' : '#1a1a22'; g.fillRect(0, 0, 16, 16);
      if (theme === 11) {
        // kablo demetleri
        // taban altı boşluğu: çok koyu, tek tük sarkan kablo ve taşıyıcı ayaklar (dolgudan ayrılsın)
        g.fillStyle = '#07090e'; g.fillRect(0, 0, 16, 16);
        if (k % 3 === 0) { g.strokeStyle = 'rgba(60,110,170,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 2); g.quadraticCurveTo(8, 7 + k % 2, 16, 2); g.stroke(); }
        if (k % 4 === 1) { g.fillStyle = '#1c2230'; g.fillRect(7, 0, 2, 16); g.fillStyle = '#2a3244'; g.fillRect(5.5, 14.5, 5, 1.5); }
      } else {
        // havalandırma kanalı ve kirişler
        g.fillStyle = '#2a2a34'; g.fillRect(0, 5, 16, 5);
        g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(0, 5, 16, 1);
        if (k % 4 === 0) { g.fillStyle = '#3a3a46'; g.fillRect(6, 0, 2, 16); }
      }
    });
  }

  // ---------------- Kapalıçarşı ----------------
  // blok biçimleri (bölümün 'blok' ayarı): taş (çarşının kesme taşı), ahşap (hanın kirişleri)
  function block(style, kind) {
    return cached(`blok:${style}:${kind}`, (g) => {
      if (kind === 'oneway' && style === 'ev') {
        // cumba saçağı: ahşap kiriş
        box(g, 0.2, 0.4, 15.6, 4, 0.8, '#8a5a32', K, 0.8);
        g.fillStyle = 'rgba(255,220,170,0.25)'; g.fillRect(1, 1, 14, 0.7);
        poly(g, [3, 4.4, 5, 4.4, 3, 8], '#6a4422', null); poly(g, [13, 4.4, 11, 4.4, 13, 8], '#6a4422', null);
        return;
      }
      if (kind === 'oneway' && style === 'celik') {
        // bakım yolu: çelik ızgara, alt kiriş
        box(g, 0.2, 0.4, 15.6, 4.6, 0.6, '#b4bcc8', K, 0.9);
        g.strokeStyle = 'rgba(40,46,56,0.65)'; g.lineWidth = 0.7;
        for (let x = 1.5; x < 15; x += 2.5) { g.beginPath(); g.moveTo(x, 1); g.lineTo(x + 1.5, 4.6); g.stroke(); }
        g.fillStyle = '#f0b030'; g.fillRect(0.4, 0.5, 15.2, 0.9);
        lin(g, 0, 6.5, 16, 6.5, '#5a626e', 1.6);
        lin(g, 8, 5, 8, 9, '#5a626e', 1.2);
        return;
      }
      if (kind === 'oneway' && style === 'sutun') {
        // turist yolu: ahşap iskele kalası, demir dikmeler
        box(g, 0.2, 0.4, 15.6, 3.8, 0.8, '#8a6a48', K, 0.8);
        g.fillStyle = 'rgba(255,220,170,0.25)'; g.fillRect(1, 1, 14, 0.7);
        lin(g, 4, 4.2, 4, 9, '#3a3e44', 1.2); lin(g, 12, 4.2, 12, 9, '#3a3e44', 1.2);
        return;
      }
      if (kind === 'oneway' && style === 'veri') {
        // kablo tavası: delikli metal raf
        box(g, 0.2, 0.4, 15.6, 3.6, 0.8, '#8a929e', K, 0.8);
        g.fillStyle = '#4a525e'; for (let x = 2; x < 15; x += 3) g.fillRect(x, 1.6, 1.4, 1.2);
        lin(g, 3, 4, 3, 8, '#5a6270', 1.2); lin(g, 13, 4, 13, 8, '#5a6270', 1.2);
        return;
      }
      if (kind === 'oneway') {
        // ahşap raf: üstü düz, altında iki dirsek
        box(g, 0.2, 0.4, 15.6, 4, 1, '#b07a44', K, 0.8);
        g.fillStyle = 'rgba(255,230,190,0.35)'; g.fillRect(1.2, 1.1, 13.6, 0.7);
        g.fillStyle = '#6a4422'; poly(g, [2.4, 4.4, 4.6, 4.4, 2.4, 8], '#6a4422', null); poly(g, [13.6, 4.4, 11.4, 4.4, 13.6, 8], '#6a4422', null);
        return;
      }
      if (style === 'kaya') {
        // kıyı kayası: yuvarlak hatlı gri-kahve taşlar, yosun
        g.fillStyle = '#8a7e70'; g.fillRect(0, 0, 16, 16);
        ellipse(g, 5, 5, 5, 4, '#9a8e80', null); ellipse(g, 12, 11, 5, 4.4, '#7e7266', null); ellipse(g, 4, 13, 3.4, 2.6, '#a09486', null);
        g.fillStyle = 'rgba(60,110,60,0.5)'; g.fillRect(0, 14.4, 16, 1.6);
        g.strokeStyle = 'rgba(40,30,20,0.6)'; g.lineWidth = 0.6; g.strokeRect(0.3, 0.3, 15.4, 15.4);
      } else if (style === 'ev') {
        // Balat evi: renkli sıva, kesme taş köşe, gece sarı ışıklı küçük pencere
        g.fillStyle = '#c86a4a'; g.fillRect(0, 0, 16, 16);
        g.fillStyle = 'rgba(255,220,180,0.12)'; g.fillRect(0, 0, 16, 2);
        box(g, 4, 4, 8, 8, 0.8, '#ffd27a', '#5a2a1a', 0.8);
        lin(g, 8, 4, 8, 12, '#5a2a1a', 0.7); lin(g, 4, 8, 12, 8, '#5a2a1a', 0.7);
        g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, 14.6, 16, 1.4);
        g.strokeStyle = 'rgba(60,24,14,0.6)'; g.lineWidth = 0.6; g.strokeRect(0.3, 0.3, 15.4, 15.4);
      } else if (style === 'celik') {
        // köprü çeliği: gri kutu kiriş, perçinler, köşegen takviye
        box(g, 0.3, 0.3, 15.4, 15.4, 0.6, '#6e7682', K, 0.8);
        g.fillStyle = '#7e8692'; g.fillRect(1.2, 1.2, 13.6, 4);
        lin(g, 2, 14, 14, 6, 'rgba(40,46,56,0.5)', 1.2);
        for (const [cx, cy] of [[2.6, 2.6], [13.4, 2.6], [2.6, 13.4], [13.4, 13.4]]) circle(g, cx, cy, 0.8, '#4a525e', null);
        g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(1.2, 1.2, 13.6, 0.7);
      } else if (style === 'sutun') {
        // sarnıç sütun dibi: yeşilimsi gri mermer, su lekesi, yosun
        g.fillStyle = '#7e8a84'; g.fillRect(0, 0, 16, 16);
        g.fillStyle = '#8e9a94'; g.fillRect(0.8, 0.8, 14.4, 6.6); g.fillRect(0.8, 8.6, 6.6, 6.6); g.fillRect(8.6, 8.6, 6.6, 6.6);
        g.strokeStyle = 'rgba(60,70,66,0.5)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(3, 2); g.quadraticCurveTo(6, 5, 11, 3); g.moveTo(10, 10); g.lineTo(13, 13); g.stroke();
        g.fillStyle = 'rgba(70,110,80,0.45)'; g.fillRect(0, 13.8, 16, 2.2);
        g.strokeStyle = 'rgba(30,36,34,0.7)'; g.lineWidth = 0.7; g.strokeRect(0.35, 0.35, 15.3, 15.3);
      } else if (style === 'veri') {
        // veri merkezi: koyu antrasit panel, kenarda havalandırma delikleri ve küçük durum ışığı
        box(g, 0.4, 0.4, 15.2, 15.2, 0.8, '#3a404c', K, 0.8);
        g.fillStyle = '#454c5a'; g.fillRect(1.4, 1.4, 13.2, 5.6);
        g.fillStyle = 'rgba(0,0,0,0.35)'; for (let x = 2.4; x < 14; x += 2.2) g.fillRect(x, 9.6, 1.2, 3.6);
        circle(g, 13.2, 4.2, 0.7, '#3ad0ff', null);
      } else if (style === 'beton') {
        // üst geçit ayağı: düz beton, kalıp izleri
        box(g, 0.4, 0.4, 15.2, 15.2, 0.8, '#a8aab0', K, 0.8);
        g.fillStyle = '#b8bac0'; g.fillRect(1.2, 1.2, 13.6, 6.4); g.fillStyle = '#9a9ca4'; g.fillRect(1.2, 8.4, 13.6, 6.4);
        for (const [cx, cy] of [[4, 4.4], [12, 4.4], [4, 11.6], [12, 11.6]]) circle(g, cx, cy, 0.6, '#7a7c84', null);
      } else if (style === 'ahsap') {
        box(g, 0.4, 0.4, 15.2, 15.2, 1, '#8a5a32', K, 0.8);
        for (let y = 1.5; y < 15; y += 4.6) { g.fillStyle = '#9e6a3e'; g.fillRect(1.2, y, 13.6, 3.6); g.fillStyle = 'rgba(60,30,10,0.4)'; g.fillRect(1.2, y + 3.6, 13.6, 0.6); }
        g.strokeStyle = 'rgba(60,30,10,0.35)'; g.lineWidth = 0.5;
        for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(3 + k * 4, 2 + k); g.quadraticCurveTo(6 + k * 4, 3 + k, 9 + k * 4, 2 + k); g.stroke(); }
        circle(g, 3, 3.4, 0.7, '#3a2210', null); circle(g, 13, 12.6, 0.7, '#3a2210', null);
      } else {
        // kesme taş: sıcak kireç taşı, derz çizgileri
        g.fillStyle = '#cdb994'; g.fillRect(0, 0, 16, 16);
        g.fillStyle = '#dccaa6'; g.fillRect(0.8, 0.8, 14.4, 6.4); g.fillRect(0.8, 8.8, 6.4, 6.4); g.fillRect(8.8, 8.8, 6.4, 6.4);
        g.fillStyle = 'rgba(255,248,230,0.45)'; g.fillRect(0.8, 0.8, 14.4, 0.8); g.fillRect(0.8, 8.8, 6.4, 0.7); g.fillRect(8.8, 8.8, 6.4, 0.7);
        g.strokeStyle = K; g.lineWidth = 0.8; g.strokeRect(0.4, 0.4, 15.2, 15.2);
      }
      if (kind === 'crack') { g.strokeStyle = 'rgba(40,24,10,0.75)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(3, 2); g.lineTo(7, 7); g.lineTo(5, 10); g.lineTo(9, 14); g.moveTo(7, 7); g.lineTo(12, 6); g.stroke(); }
    });
  }
  // çürük tahta: eski, çatlak, çivileri paslı. veri merkezinde: yerinden oynamış delikli döşeme karosu
  function plank(style) {
    if (style === 'veri') return cached('curuk:veri', (g) => {
      box(g, 0.3, 0.6, 15.4, 5.4, 0.6, '#9aa2ae', K, 0.8);
      g.fillStyle = '#5a6270'; for (let x = 2.2; x < 14.5; x += 2.4) for (let y = 2.2; y < 5; y += 1.8) g.fillRect(x, y, 0.9, 0.9);
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(1.2, 6.2, 13.6, 1.4);
    });
    return cached('curuk', (g) => {
      box(g, 0.2, 0.5, 15.6, 6, 0.8, '#9a7048', K, 0.8);
      g.fillStyle = '#7a5434'; g.fillRect(1, 3.2, 14, 0.6);
      g.strokeStyle = 'rgba(40,20,8,0.7)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(5, 0.8); g.lineTo(6.5, 3.6); g.lineTo(5.6, 6.2); g.moveTo(11, 6.2); g.lineTo(10.2, 3.4); g.stroke();
      circle(g, 2, 2, 0.6, '#8a4a2a', null); circle(g, 14, 2, 0.6, '#8a4a2a', null);
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(2, 6.6, 12, 1.4);
    });
  }
  // terazi: tavana asılı direk, eğilen kol ve zincirler (kefeler ayrı çizilir)
  function drawScale(g, sc) {
    const ax = (sc.A.x + 1.5) * 16, bx = (sc.B.x + 1.5) * 16, cx = (ax + bx) / 2, py = (sc.y - 4.2) * 16;
    lin(g, cx, py - 300, cx, py, K, 2.6); lin(g, cx, py - 300, cx, py, '#c89a3a', 1.4);
    const ay = sc.A.y * 16, by = sc.B.y * 16;
    const ka = py + (ay - by) / (bx - ax) * (ax - cx) * 0.25, kb = py + (by - ay) / (bx - ax) * (bx - cx) * 0.25;
    // kol
    lin(g, ax, ka, bx, kb, K, 3.4); lin(g, ax, ka, bx, kb, '#e0b44a', 2);
    circle(g, cx, py, 2.6, '#e0b44a', K, 0.7); circle(g, cx, py, 0.9, '#7a5a1a', null);
    poly(g, [cx - 1.6, py - 2, cx + 1.6, py - 2, cx, py - 8], '#e0b44a', K, 0.6);   // ibre
    for (const [x, ky, y] of [[ax, ka, ay], [bx, kb, by]]) {
      for (const dx of [-20, 0, 20]) { g.strokeStyle = 'rgba(80,60,20,0.9)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(x, ky); g.lineTo(x + dx, y - 1); g.stroke(); }
      circle(g, x, ky, 1.4, '#e0b44a', K, 0.5);
    }
    if (sc.inv) { circle(g, cx, py - 6, 4, '#8a6a3a', K, 0.6); circle(g, cx, py - 6, 1.2, K, null); }
  }
  // kefe: geniş pirinç tabak; yükü varsa tartı ağırlığı
  function drawPan(g, pl) {
    const x = pl.x * 16, y = pl.y * 16, w = pl.w * 16;
    g.beginPath(); g.moveTo(x - 1, y); g.lineTo(x + w + 1, y); g.quadraticCurveTo(x + w - 4, y + 9, x + w / 2, y + 9); g.quadraticCurveTo(x + 4, y + 9, x - 1, y); g.closePath();
    g.fillStyle = grad(g, 0, y, 0, y + 9, [[0, '#f6d27a'], [1, '#a8781e']]); g.fill(); g.strokeStyle = K; g.lineWidth = 0.8; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(x + 3, y + 1, w - 6, 0.8);
    const load = pl.side > 0 ? pl.sc.loadA : pl.sc.loadB;
    if (load) {
      // pirinç tartı ağırlığı
      const cx = x + w / 2;
      box(g, cx - 7, y - 10, 14, 10, 2, grad(g, cx - 7, 0, cx + 7, 0, [[0, '#a8781e'], [0.5, '#f0c860'], [1, '#8a6214']]), K, 0.8);
      box(g, cx - 2.5, y - 14, 5, 4, 1.4, '#c8962e', K, 0.6);
      g.fillStyle = '#5a3a0a'; g.font = '700 5px Fredoka, sans-serif'; g.textAlign = 'center'; g.fillText('1kg', cx, y - 3);
    }
  }
  // çaycı: yelekli, elinde askılı tepsi; tepside ince belli bardaklar
  function drawCayci(g, n, t, walking) {
    const cx = n.x * 16 + 8, by = (n.y) * 16, f = n.dir;
    const st = walking ? Math.sin(t * 9) : 0;
    // bacaklar
    lin(g, cx - 2, by - 10, cx - 2 + st * 2, by, K, 2.6); lin(g, cx + 2, by - 10, cx + 2 - st * 2, by, K, 2.6);
    lin(g, cx - 2, by - 10, cx - 2 + st * 2, by, '#3a3a48', 1.6); lin(g, cx + 2, by - 10, cx + 2 - st * 2, by, '#3a3a48', 1.6);
    // gövde: beyaz gömlek, koyu yelek
    box(g, cx - 4.6, by - 21, 9.2, 12, 3, '#f4f2ea', K, 0.8);
    poly(g, [cx - 4.4, by - 20, cx - 1, by - 20, cx - 0.4, by - 10, cx - 4.4, by - 10], '#5a2a2a', null);
    poly(g, [cx + 4.4, by - 20, cx + 1, by - 20, cx + 0.4, by - 10, cx + 4.4, by - 10], '#5a2a2a', null);
    // baş ve bıyık
    circle(g, cx + f * 0.6, by - 25, 3.8, '#e8b48c', K, 0.8);
    g.fillStyle = '#3a2a1a'; g.beginPath(); g.arc(cx + f * 0.6, by - 26, 3.9, Math.PI, 0); g.fill();
    lin(g, cx + f * 1.4 - 1.6, by - 23.4, cx + f * 1.4 + 1.6, by - 23.4, '#3a2a1a', 1);
    circle(g, cx + f * 2, by - 25.6, 0.5, K, null);
    // kalkık kol ve askılı tepsinin sapı
    lin(g, cx + f * 3, by - 19, cx + f * 1, by - 32, K, 2.4); lin(g, cx + f * 3, by - 19, cx + f * 1, by - 32, '#f4f2ea', 1.4);
  }
  function drawTray(g, pl, t) {
    const x = pl.x * 16, y = pl.y * 16, w = pl.w * 16, cx = x + w / 2;
    // askı: üç kol, tepede halka
    for (const dx of [-12, 0, 12]) lin(g, cx, y - 9, cx + dx, y, '#9aa0aa', 0.8);
    circle(g, cx, y - 10, 1.8, null, '#9aa0aa', 0.9);
    ellipse(g, cx, y + 1, w / 2 + 1, 2.2, '#c8ccd4', K, 0.8);
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(cx - w / 2 + 2, y - 0.2, w - 4, 0.6);
    if (!pl.npc.served) for (let k = 0; k < 3; k++) {
      const gx = cx - 8 + k * 8, j = Math.sin(t * 9 + k) * 0.3;
      poly(g, [gx - 1.6, y - 6 + j, gx + 1.6, y - 6 + j, gx + 1, y, gx - 1, y], '#c83a1e', K, 0.4);
      g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(gx - 1.2, y - 5.6 + j, 2.4, 0.7);
    }
  }
  // galerinin korkuluk kirişi: ince ahşap kiriş ve parmaklıklar (üstünde durulmaz)
  function drawBeam(g, x0, x1, y) {
    lin(g, x0, y - 9, x1, y - 9, K, 2.2); lin(g, x0, y - 9, x1, y - 9, '#8a5a32', 1.2);
    lin(g, x0, y + 0.6, x1, y + 0.6, K, 1.8); lin(g, x0, y + 0.6, x1, y + 0.6, '#7a4e2a', 0.9);
    for (let x = x0 + 6; x < x1; x += 10) lin(g, x, y - 9, x, y, 'rgba(110,70,40,0.8)', 0.9);
  }
  // kepenk: üstte sarma kutusu, inen oluklu sac
  function drawShutter(g, s) {
    const x = s.x * 16, y0 = s.y0 * 16, h = (s.y1 - s.y0 + 1) * 16, down = (1 - s.k) * h;
    box(g, x - 2, y0 - 6, 20, 6, 1.4, '#7a7e86', K, 0.7);
    g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(x - 1, y0 - 5.2, 18, 0.8);
    if (down < 0.5) return;
    g.save(); g.beginPath(); g.rect(x - 0.5, y0, 17, down); g.clip();
    g.fillStyle = '#9aa0a8'; g.fillRect(x, y0, 16, down);
    for (let yy = y0 + down - 3; yy > y0 - 3; yy -= 3) { g.fillStyle = '#7a8088'; g.fillRect(x, yy, 16, 1); g.fillStyle = '#c0c6ce'; g.fillRect(x, yy + 1, 16, 0.6); }
    g.restore();
    box(g, x - 0.5, y0 + down - 2.6, 17, 2.6, 0.8, '#5a5e66', K, 0.6);
    g.strokeStyle = K; g.lineWidth = 0.7; g.strokeRect(x, y0, 16, down);
  }

  // ---------------- Şişli ----------------
  // yol: şeridin üstü asfalt, kaldırım çizgisi; ışıklı şeritte yaya geçidi
  function drawRoad(g, ln) {
    const x0 = ln.x0 * 16, x1 = ln.x1 * 16, y = ln.y * 16;
    g.fillStyle = '#4a4e58'; g.fillRect(x0, y, x1 - x0, 9);
    g.fillStyle = '#5a5e68'; g.fillRect(x0, y, x1 - x0, 1.2);
    g.fillStyle = 'rgba(255,255,255,0.55)';
    for (let x = x0 + 4; x < x1 - 6; x += 20) g.fillRect(x, y + 4, 9, 1);
    if (ln.light) { const l = ln.light; g.fillStyle = '#f2f2ee'; for (let x = l.x * 16 + 1; x < (l.x + l.w) * 16 - 1; x += 5) g.fillRect(x, y + 0.5, 3, 8); }
  }
  // yaya ışığı: direk, araçlar için kırmızı/yeşil, yayalar için yürüyen adam
  function drawLight(g, ln, green, t) {
    const l = ln.light, x = (ln.dir < 0 ? l.x + l.w : l.x) * 16 - 2, gy = ln.y * 16;
    lin(g, x, gy, x, gy - 70, K, 2.6); lin(g, x, gy, x, gy - 70, '#5a5e68', 1.4);
    box(g, x - 5, gy - 84, 10, 18, 2, '#2a2e36', K, 0.7);
    circle(g, x, gy - 79, 3, green ? '#5a1414' : '#ff3a2a', null);
    circle(g, x, gy - 71, 3, green ? '#2a5a1a' : '#143a14', null);
    if (!green) { g.save(); g.globalAlpha = 0.35; circle(g, x, gy - 79, 6, '#ff3a2a', null); g.restore(); }
    // yaya kutusu
    box(g, x + 3, gy - 60, 9, 11, 1.6, '#2a2e36', K, 0.6);
    const c = green ? '#7cff6a' : '#ff5a4a';
    circle(g, x + 7.5, gy - 57, 1.1, c, null);
    lin(g, x + 7.5, gy - 56, x + 7.5, gy - 52.5, c, 1.2);
    if (green) { const k = Math.sin(t * 8) * 1.2; lin(g, x + 7.5, gy - 52.5, x + 6 - k, gy - 50.4, c, 1); lin(g, x + 7.5, gy - 52.5, x + 9 + k, gy - 50.4, c, 1); }
    else { lin(g, x + 7.5, gy - 52.5, x + 6.6, gy - 50.4, c, 1); lin(g, x + 7.5, gy - 52.5, x + 8.4, gy - 50.4, c, 1); }
  }
  // araç: taksi (sarı, tepesinde levha), dolmuş (turkuaz minibüs), otobüs (uzun, kırmızı-beyaz)
  function drawCar(g, c, t) {
    const x = c.x * 16, gy = c.lane.y * 16, w = c.w * 16, h = c.h * 16, y = gy - h, f = c.lane.dir;
    const col = c.kind === 'taksi' ? '#f2c21b' : c.kind === 'dolmus' ? '#1fb5ad' : '#e8eef4';
    g.save();
    if (f < 0) { g.translate(x * 2 + w, 0); g.scale(-1, 1); }
    // gövde
    box(g, x + 0.5, y + (c.kind === 'taksi' ? 5 : 1), w - 1, h - (c.kind === 'taksi' ? 9 : 5), 3, col, K, 0.9);
    if (c.kind === 'taksi') { box(g, x + 7, y, w - 18, 7, 3, col, K, 0.8); box(g, x + w / 2 - 6, y - 4, 10, 4, 1.2, '#2a2a30', K, 0.5); g.fillStyle = '#ffe14a'; g.fillRect(x + w / 2 - 5, y - 3.2, 8, 2.4); }
    if (c.kind === 'otobus') { g.fillStyle = '#d23a2a'; g.fillRect(x + 1, y + h - 13, w - 2, 3.5); }
    // camlar
    const wy = c.kind === 'taksi' ? y + 1.5 : y + 3.5, wh = c.kind === 'taksi' ? 5 : c.kind === 'dolmus' ? 9 : 12;
    for (let k = 0, n = Math.max(2, Math.floor(c.w * 1.3)); k < n; k++) {
      const ww = (w - 10) / n;
      box(g, x + 5 + k * ww + 0.8, wy, ww - 1.6, wh, 1.2, 'rgba(150,200,230,0.9)', K, 0.5);
    }
    // farlar ve tekerlekler
    box(g, x + w - 3, gy - 10, 2.5, 3, 0.8, '#fff6c0', K, 0.4);
    box(g, x + 0.5, gy - 10, 2, 3, 0.8, '#e2302a', K, 0.4);
    const rot = c.x * 2;
    for (const wx of [x + 7, x + w - 8]) {
      circle(g, wx, gy - 3, 3.6, '#22242a', K, 0.6); circle(g, wx, gy - 3, 1.4, '#9aa0aa', null);
      lin(g, wx, gy - 3, wx + Math.cos(rot) * 1.3, gy - 3 + Math.sin(rot) * 1.3, '#5a5e68', 0.6);
    }
    g.restore();
  }
  // asansör boşluğu: raylar, katlarda kapı çerçevesi ve çağırma düğmesi
  function drawShaft(g, L, t) {
    const x = L.x * 16, top = (L.floors[0] - 3) * 16, bot = L.floors[L.floors.length - 1] * 16;
    g.fillStyle = 'rgba(40,46,60,0.35)'; g.fillRect(x, top, 48, bot - top);
    for (const rx of [x + 1, x + 47]) lin(g, rx, top, rx, bot, '#7a8496', 1.2);
    for (let k = 0; k < L.floors.length; k++) {
      const fy = L.floors[k] * 16, here = L.cur === k && L.state === 'idle', call = L.call === k;
      box(g, x - 13, fy - 22, 9, 12, 1.6, '#c8ccd4', K, 0.6);
      circle(g, x - 8.5, fy - 16, 2.4, call || (here && L.wt > -0.6 && L.wt < 0) ? '#7cff6a' : '#f4c531', K, 0.5);
      // kat göstergesi
      box(g, x + 14, fy - 40, 20, 6, 1.2, '#1a1e26', null);
      g.fillStyle = here ? '#7cff6a' : '#ff8a3a'; g.font = '700 4.6px Fredoka, sans-serif'; g.textAlign = 'center'; g.fillText(String(L.floors.length - k - 1), x + 24, fy - 35.4);
    }
  }
  // kabin: arka duvar, aynalı yan duvarlar, tavan lambası; zemin platformdur
  function drawCabin2(g, car) {
    const x = car.x * 16, y = car.y * 16, w = 48, h = 36;
    box(g, x + 1, y - h, w - 2, h, 2, 'rgba(210,214,222,0.55)', K, 0.8);
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x + 4, y - h + 3, 3, h - 6);
    box(g, x + w / 2 - 6, y - h + 1, 12, 2.5, 1, '#fff6c0', null);
    box(g, x - 0.5, y, w + 1, 5, 1.4, '#8a909c', K, 0.8);
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(x + 1, y + 0.8, w - 2, 0.8);
  }
  // döner kapı: cam silindir, dönen kanatlar
  function drawRevolving(g, d) {
    const x = d.x * 16, y = d.y * 16, w = d.w * 16, h = 46, cx = x + w / 2;
    box(g, x - 2, y - h - 5, w + 4, 6, 2, '#9aa4b2', K, 0.7);
    g.fillStyle = 'rgba(170,220,240,0.22)'; g.fillRect(x, y - h, w, h);
    for (let k = 0; k < 4; k++) {
      const a = d.a + k * Math.PI / 2, s = Math.cos(a), dep = Math.sin(a);
      g.strokeStyle = `rgba(120,180,210,${0.45 + 0.4 * (dep > 0 ? 1 : 0)})`; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(cx, y - h); g.lineTo(cx + s * w / 2, y - h); g.lineTo(cx + s * w / 2, y); g.lineTo(cx, y); g.stroke();
    }
    lin(g, cx, y - h, cx, y, '#7a8496', 1.6);
    for (const ex of [x, x + w]) lin(g, ex, y - h, ex, y, '#7a8496', 1);
  }
  // tavan lambası: yanıkken altına ışık konisi düşer (karanlık örtüsü ayrıca açılır)
  function drawLamp(g, l) {
    const x = l.x * 16 + 8, y = l.y * 16;
    lin(g, x, y - 4, x, y + 2, '#5a5e68', 0.8);
    box(g, x - 8, y + 2, 16, 3.5, 1.2, l.t > 0 ? '#fff6d0' : '#6a6e78', K, 0.6);
    if (l.t > 0) { const gr = g.createLinearGradient(0, y + 5, 0, y + 70); gr.addColorStop(0, `rgba(255,240,190,${0.22 * Math.min(1, l.t)})`); gr.addColorStop(1, 'rgba(255,240,190,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(x - 7, y + 5); g.lineTo(x + 7, y + 5); g.lineTo(x + 40, y + 70); g.lineTo(x - 40, y + 70); g.fill(); }
  }
  // fotokopi makinesi: kapağın altından çakan ışık
  function drawCopier(g, l) {
    const x = l.x * 16 - 4, by = l.y * 16;
    box(g, x, by - 18, 24, 18, 2, '#d8dce2', K, 0.8);
    box(g, x - 1, by - 22, 26, 5, 1.6, '#bcc2ca', K, 0.7);
    box(g, x + 3, by - 13, 18, 3, 0.8, '#5a6070', null);
    circle(g, x + 20, by - 6, 1.2, l.t > 0 ? '#7cff6a' : '#3a8a2a', null);
    if (l.t > 0) { g.fillStyle = 'rgba(200,240,255,0.95)'; g.fillRect(x + 1, by - 17.5, 22, 1.6); }
  }

  // ---------------- Üsküdar ----------------
  // vapur: beyaz gövde, iki güverte, bacası; alt güverte ve üst güverte platformdur
  function drawFerry(g, b, t) {
    const x = b.x * 16, y = b.y * 16, w = b.w * 16, bob = Math.sin(t * 1.6 + b.a) * 0.6;
    g.save(); g.translate(0, bob);
    // gövde (suyun içine iner)
    g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x + w + 6, y); g.lineTo(x + w - 4, y + 22); g.lineTo(x + 4, y + 22); g.closePath();
    g.fillStyle = '#f4f2ec'; g.fill(); g.strokeStyle = K; g.lineWidth = 0.9; g.stroke();
    g.fillStyle = '#2a3242'; g.fillRect(x - 2, y + 12, w + 4, 4);
    g.fillStyle = '#c8302a'; g.fillRect(x, y + 17, w, 2);
    // kamara: güverteler arası pencereler
    const ty = y - 2.6 * 16;
    box(g, x + 3 * 16 - 4, ty, w - 6 * 16 + 8, y - ty, 1.5, '#e8e4da', K, 0.8);
    for (let wx = x + 3 * 16; wx < x + w - 3 * 16 - 4; wx += 9) box(g, wx, ty + 9, 6, 9, 1.5, '#7ab0d0', K, 0.4);
    // üst güverte korkuluğu ve baca
    lin(g, x + 3 * 16 - 4, ty - 6, x + w - 3 * 16 + 4, ty - 6, '#9aa0aa', 0.8);
    for (let rx = x + 3 * 16; rx < x + w - 3 * 16 + 4; rx += 6) lin(g, rx, ty - 6, rx, ty, '#9aa0aa', 0.6);
    box(g, x + w / 2 - 5, ty - 20, 10, 20, 1.5, '#f4f2ec', K, 0.8);
    g.fillStyle = '#1a1a20'; g.fillRect(x + w / 2 - 5, ty - 20, 10, 5);
    g.fillStyle = '#f4c531'; g.fillRect(x + w / 2 - 5, ty - 15, 10, 2);
    // güverte kenarı
    box(g, x - 6, y - 1.5, w + 12, 3, 1, '#c8b48a', K, 0.7);
    g.restore();
    // pervanenin köpüğü
    if (b.v > 0.3) for (let k = 0; k < 4; k++) circle(g, x + (b.dir > 0 ? -8 - k * 6 : w + 8 + k * 6), y + 14 + Math.sin(t * 9 + k) * 1.5, 2 + k * 0.6, `rgba(255,255,255,${0.7 - k * 0.15})`, null);
  }
  function drawRowboat(g, b, t) {
    const x = b.x * 16, y = b.y * 16, w = b.w * 16, bob = Math.sin(t * 2.2 + b.a) * 0.8;
    g.save(); g.translate(0, bob);
    g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x + w + 5, y - 2); g.quadraticCurveTo(x + w, y + 10, x + w - 6, y + 10); g.lineTo(x + 4, y + 10); g.quadraticCurveTo(x - 2, y + 6, x - 3, y); g.closePath();
    g.fillStyle = '#a8703a'; g.fill(); g.strokeStyle = K; g.lineWidth = 0.8; g.stroke();
    g.fillStyle = '#f4f2ec'; g.fillRect(x, y + 3, w, 1.6);
    g.fillStyle = '#2a8acc'; g.fillRect(x + 1, y + 6, w - 3, 1.2);
    box(g, x - 7, y - 6, 5, 7, 1, '#3a3e48', K, 0.6);                      // takma motor
    g.restore();
    if (b.v > 0.3) for (let k = 0; k < 3; k++) circle(g, x - 8 - k * 5, y + 6 + Math.sin(t * 12 + k), 1.6 + k * 0.5, `rgba(255,255,255,${0.7 - k * 0.2})`, null);
  }
  // tente: çizgili kumaş, iki direk; basılınca esner
  function drawAwning(g, x, y, n, sq, hue) {
    const w = n * 16, ty = y + sq * 3;
    for (const px of [x + 2, x + w - 2]) { lin(g, px, ty + 4, px, y + 64, K, 1.6); lin(g, px, ty + 4, px, y + 64, '#8a6a4a', 0.8); }
    g.save(); g.beginPath(); g.moveTo(x - 2, ty + 1); g.lineTo(x + w + 2, ty + 1); g.lineTo(x + w + 3, ty + 7); g.lineTo(x - 3, ty + 7); g.closePath(); g.clip();
    const cols = [['#e2483a', '#fff4e4'], ['#2a8a6a', '#fff4e4'], ['#2a6fc4', '#fff4e4'], ['#f08a24', '#fff4e4']][hue % 4];
    for (let k = 0; k < n * 4 + 2; k++) { g.fillStyle = cols[k % 2]; g.fillRect(x - 3 + k * 4, ty, 4, 8); }
    g.restore();
    g.beginPath(); g.moveTo(x - 2, ty + 1); g.lineTo(x + w + 2, ty + 1); g.lineTo(x + w + 3, ty + 7); g.lineTo(x - 3, ty + 7); g.closePath(); g.strokeStyle = K; g.lineWidth = 0.8; g.stroke();
    for (let k = 0; k < n * 2; k++) { g.beginPath(); g.arc(x - 1 + k * 8 + 4, ty + 7, 4, 0, Math.PI); g.fillStyle = cols[0]; g.fill(); g.stroke(); }
  }
  // karpuz: yeşil çizgili, dönerek yuvarlanır
  function drawKarpuz(g, e) {
    const cx = (e.x + e.w / 2) * 16, cy = (e.y + e.h / 2) * 16 + 0.5, r = 7.4;
    g.save(); g.translate(cx, cy); g.rotate(e.rot || 0);
    circle(g, 0, 0, r, '#3aa04a', K, 0.9);
    g.strokeStyle = '#1e6a2a'; g.lineWidth = 1.4;
    for (const a of [-0.9, -0.3, 0.3, 0.9]) { g.beginPath(); g.ellipse(0, 0, Math.abs(Math.sin(a)) * r * 0.9 + 0.5, r * 0.95, 0, 0, Math.PI * 2); g.stroke(); }
    circle(g, -2.4, -2.8, 1.6, 'rgba(255,255,255,0.35)', null);
    g.restore();
  }
  // meyve kasası: üst üste kasalar, içlerinde karpuzlar
  function drawCrate(g, sp) {
    const x = sp.x * 16 + 16, by = (sp.y + 1) * 16;
    for (const [dx, dy] of [[0, 0], [16, 0], [8, -16]]) {
      box(g, x + dx, by + dy - 14, 16, 14, 1, '#b8844a', K, 0.7);
      g.fillStyle = '#8a5a2a'; g.fillRect(x + dx + 1, by + dy - 8, 14, 1.2);
      circle(g, x + dx + 5, by + dy - 14, 3.4, '#3aa04a', K, 0.5); circle(g, x + dx + 11, by + dy - 13.5, 3.2, '#3aa04a', K, 0.5);
    }
  }
  // dalga: yükselen deniz suyu, köpüklü üst çizgi (oyuncunun önünde, yarı saydam)
  function drawTide(g, d, t, vh) {
    const x0 = d.x0 * 16 - 6, x1 = d.x1 * 16 + 6, y = d.y * 16;
    g.save();
    g.beginPath(); g.moveTo(x0, vh);
    for (let x = x0; x <= x1; x += 4) g.lineTo(x, y + Math.sin(t * 3 + x * 0.12) * 1.6);
    g.lineTo(x1, vh); g.closePath();
    g.fillStyle = grad(g, 0, y, 0, y + 48, [[0, 'rgba(90,150,200,0.72)'], [1, 'rgba(40,80,140,0.85)']]); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 1.4;
    g.beginPath(); for (let x = x0; x <= x1; x += 4) { const yy = y + Math.sin(t * 3 + x * 0.12) * 1.6; if (x === x0) g.moveTo(x, yy); else g.lineTo(x, yy); } g.stroke();
    for (let x = x0 + ((t * 20) % 14); x < x1; x += 14) circle(g, x, y + 1 + Math.sin(t * 4 + x) * 1, 1.4, 'rgba(255,255,255,0.7)', null);
    g.restore();
  }
  // sal: kalaslar ve iki fıçı
  function drawRaft(g, pl) {
    const x = pl.x * 16, y = pl.y * 16, w = pl.w * 16;
    for (const dx of [4, w - 10]) box(g, x + dx, y + 3, 7, 6, 2.5, '#6a4a2a', K, 0.5);
    box(g, x, y - 1, w, 4.5, 1, '#b8844a', K, 0.8);
    for (let k = 1; k < pl.w * 2; k++) lin(g, x + k * 8, y - 0.6, x + k * 8, y + 3.2, 'rgba(60,30,10,0.6)', 0.6);
  }

  // ---------------- Ataşehir ----------------
  // şalter grupları: şalter, ızgara ve raylı platform aynı renkte şeritle birbirine bağlanır
  const GRP = { a: '#f4c531', b: '#2fd4e0', c: '#e85ab4', d: '#f08a24' };
  const grpCol = (k) => GRP[k] || '#f4c531';
  // borsa panosu: LED ekran. yanıkken yeşil ok ve kayan sembol; sönmeden önce kırmızı titrer; sönükken boş çerçeve
  const SYM = ['SİMİT', 'ÇAY', 'KOD'];
  function drawBoard(g, b, t) {
    const x = b.x0 * 16, y = b.y * 16, w = (b.x1 - b.x0 + 1) * 16;
    if (b.beam) {
      // Şile: ışık basamağı (ışık düşünce belirir) ya da gölge basamağı (ışıkta kaybolur)
      const fl = b.warn && Math.floor(t * 12) % 2 === 0;
      if (b.lit) {
        const col = b.inv ? '#4a3a7a' : '#fff0b8', edge = b.inv ? '#8a7ad0' : '#ffd060';
        if (!b.inv) { g.fillStyle = 'rgba(255,230,140,0.25)'; g.fillRect(x - 3, y - 4, w + 6, 14); }
        g.globalAlpha = fl ? 0.45 : 0.95;
        box(g, x, y, w, 10, 2, col, edge, 1.2);
        g.fillStyle = b.inv ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.6)'; g.fillRect(x + 2, y + 1.5, w - 4, 1.2);
        g.globalAlpha = 1;
      } else {
        g.save(); g.setLineDash([2, 3]); g.strokeStyle = b.inv ? 'rgba(160,140,230,0.5)' : 'rgba(255,220,140,0.45)'; g.lineWidth = 1; g.strokeRect(x + 1, y + 1, w - 2, 8); g.restore();
      }
      return;
    }
    if (!b.lit) {
      // sönük: koyu cam, kesik çizgili çerçeve, ortada küçük bekleme noktaları
      g.fillStyle = 'rgba(14,20,34,0.55)'; g.fillRect(x + 1, y + 1, w - 2, 12);
      g.save(); g.setLineDash([2, 2]); g.strokeStyle = 'rgba(170,190,230,0.8)'; g.lineWidth = 1; g.strokeRect(x + 1.5, y + 1.5, w - 3, 11); g.restore();
      for (let k = 0; k < 3; k++) circle(g, x + w / 2 - 4 + k * 4, y + 7, 0.8, Math.floor(t * 3) % 3 === k ? 'rgba(140,255,170,0.8)' : 'rgba(140,160,200,0.45)', null);
      return;
    }
    const warn = b.warn && Math.floor(t * 10) % 2 === 0, col = warn ? '#ff5a48' : '#62ff86';
    g.fillStyle = warn ? 'rgba(255,74,58,0.16)' : 'rgba(98,255,134,0.13)'; g.fillRect(x - 3, y - 3, w + 6, 18);
    box(g, x, y, w, 14, 1.6, '#151c28', K, 0.9);
    g.save(); g.beginPath(); g.rect(x + 1.6, y + 1.6, w - 3.2, 10.8); g.clip();
    g.fillStyle = warn ? '#2e0a0c' : '#06200e'; g.fillRect(x, y, w, 14);
    g.font = 'bold 7px monospace'; g.textBaseline = 'middle'; g.fillStyle = col;
    const txt = SYM[b.sym % 3] + '   ', tw = g.measureText(txt).width, off = (t * 16) % tw;
    for (let xx = x + 2 - off; xx < x + w; xx += tw) g.fillText(txt, xx, y + 7.4);
    g.fillStyle = 'rgba(0,0,0,0.4)'; for (let yy = y + 2.4; yy < y + 13; yy += 1.6) g.fillRect(x, yy, w, 0.5);
    g.restore();
    // ok: yükselişte yukarı, düşüşte aşağı
    const ax = x + w - 6, ay = y + 7;
    box(g, ax - 4.5, y + 2, 9, 10, 1, warn ? '#2e0a0c' : '#06200e', null);
    poly(g, warn ? [ax - 3, ay - 2, ax + 3, ay - 2, ax, ay + 3] : [ax - 3, ay + 2, ax + 3, ay + 2, ax, ay - 3], col, null);
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x + 2, y + 2, w - 4, 0.8);
  }
  // canlı grafik: arkada ızgaralı ekran; çubukların tepeleri bir fiyat çizgisiyle bağlı
  function drawChartBack(g, bars, t) {
    const L = bars[bars.length - 1], x0 = bars[0].x * 16 - 10, x1 = (L.x + L.w) * 16 + 10, top = (bars[0].a - 3) * 16, bot = (bars[0].bot + 2) * 16;
    box(g, x0, top, x1 - x0, bot - top, 3, 'rgba(8,14,28,0.78)', '#2c3850', 1.2);
    g.strokeStyle = 'rgba(80,120,170,0.25)'; g.lineWidth = 0.6;
    for (let y = top + 8; y < bot; y += 16) { g.beginPath(); g.moveTo(x0 + 3, y); g.lineTo(x1 - 3, y); g.stroke(); }
    for (let x = x0 + 10; x < x1; x += 32) { g.beginPath(); g.moveTo(x, top + 3); g.lineTo(x, bot); g.stroke(); }
    g.strokeStyle = 'rgba(255,224,120,0.35)'; g.lineWidth = 3; g.beginPath();
    bars.forEach((b, k) => { const px = (b.x + b.w / 2) * 16, py = b.y * 16 - 5; if (k) g.lineTo(px, py); else g.moveTo(px, py); }); g.stroke();
    g.strokeStyle = '#ffe07a'; g.lineWidth = 1; g.stroke();
    bars.forEach((b) => circle(g, (b.x + b.w / 2) * 16, b.y * 16 - 5, 1.3, '#fff4c8', null));
  }
  // grafik çubuğu: mum; yükselirken yeşil, inerken kırmızı. üstü basılan parlak kapak
  function drawChartBar(g, pl) {
    const x = pl.x * 16, y = pl.y * 16, w = pl.w * 16, bot = (pl.bot + 2) * 16, up = pl.dy <= 0;
    const body = up ? '#2fb85a' : '#d8423a', hi = up ? '#7af09a' : '#ff8a7a';
    lin(g, x + w / 2, y - 3, x + w / 2, bot, body, 1);
    box(g, x + 3, y + 2, w - 6, bot - y - 2, 1, body, K, 0.7);
    g.fillStyle = hi; g.fillRect(x + 4.2, y + 3, 1.2, bot - y - 4);
    box(g, x, y - 1, w, 4, 1.4, '#e6eef8', K, 0.8);
  }
  // güvenlik lazeri: iki uçta verici; yanıkken kırmızı parlak ışın, sönükken soluk noktalar.
  // tarayıcının iki yanında dikey ray
  function drawLaser(g, l, t, quiet) {
    const on = l.active && !quiet, beam = (ax, ay, bx, by) => {
      if (on) { lin(g, ax, ay, bx, by, 'rgba(255,40,50,0.28)', 4); lin(g, ax, ay, bx, by, '#ff3a44', 1.3); lin(g, ax, ay, bx, by, '#ffd8d8', 0.4); }
      else { g.save(); g.setLineDash([1, 3]); lin(g, ax, ay, bx, by, 'rgba(255,90,90,0.3)', 0.8); g.restore(); }
    };
    if (l.vert) {
      const x = l.x0 * 16 + 8, y0 = l.y0 * 16, y1 = (l.y1 + 1) * 16;
      beam(x, y0 + 2, x, y1 - 1);
      box(g, x - 3.5, y0 - 1, 7, 4, 1, '#3a404c', K, 0.6);
      circle(g, x, y0 + 2.6, 1, on ? '#ff3a44' : '#6a2a2e', null);
      return;
    }
    const y = l.y * 16, x0 = l.x0 * 16, x1 = (l.x1 + 1) * 16;
    if (l.ya !== undefined) for (const rx of [x0 - 3, x1 + 3]) { lin(g, rx, (l.ya + 0.2) * 16, rx, (l.yb + 0.9) * 16, '#2a2e38', 2.4); lin(g, rx, (l.ya + 0.2) * 16, rx, (l.yb + 0.9) * 16, '#5a6070', 0.8); }
    beam(x0, y, x1, y);
    for (const ex of [x0 - 3, x1 + 3]) { box(g, ex - 2.5, y - 3, 5, 6, 1, '#3a404c', K, 0.6); circle(g, ex, y, 0.9, on ? '#ff3a44' : '#6a2a2e', null); }
  }
  // alarm kapısı: dikey olan tavandan inen güvenlik kepengi (altı sarı-siyah şerit, üstünde döner ışık);
  // yatay olan duvardan kayan yangın kapağı (açıkken kenarları kesik çizgiyle belli)
  function hazard(g, x, y, w, h) {
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.fillStyle = '#f4c531'; g.fillRect(x, y, w, h); g.fillStyle = '#1a1a1a';
    for (let k = -h; k < w; k += 5) { g.beginPath(); g.moveTo(x + k, y + h); g.lineTo(x + k + 2.5, y + h); g.lineTo(x + k + 2.5 + h, y); g.lineTo(x + k + h, y); g.closePath(); g.fill(); }
    g.restore();
  }
  function drawGate(g, gt, t, alarm) {
    const x = gt.x0 * 16, y = gt.y0 * 16, w = (gt.x1 - gt.x0 + 1) * 16, h = (gt.y1 - gt.y0 + 1) * 16;
    if (w > h) {
      if (gt.k < 0.03) {
        g.save(); g.setLineDash([3, 3]); g.strokeStyle = 'rgba(244,197,49,0.6)'; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, w - 1, 6); g.restore();
        hazard(g, x - 3, y, 3, 7); hazard(g, x + w, y, 3, 7);
        return;
      }
      const cw = w * gt.k;
      box(g, x, y, cw, 7, 0.8, '#8a909a', K, 0.8);
      for (let xx = x + 6; xx < x + cw - 2; xx += 8) lin(g, xx, y + 1.5, xx, y + 6, 'rgba(0,0,0,0.25)', 0.8);
      hazard(g, x, y, cw, 1.6);
      return;
    }
    box(g, x - 2, y - 6, 20, 6, 1.4, '#4a505c', K, 0.7);
    const lit = alarm && Math.floor(t * 8) % 2 === 0;
    circle(g, x + 8, y - 7, 2.2, lit ? '#ff3a3a' : '#7a2a2a', K, 0.5);
    if (lit) circle(g, x + 8, y - 7, 6, 'rgba(255,60,60,0.25)', null);
    const dh = h * gt.k;
    if (dh < 0.5) return;
    g.save(); g.beginPath(); g.rect(x - 0.5, y, 17, dh); g.clip();
    g.fillStyle = '#6e747e'; g.fillRect(x, y, 16, dh);
    for (let yy = y + dh - 5; yy > y - 4; yy -= 4) { g.fillStyle = '#5a606a'; g.fillRect(x, yy, 16, 1); g.fillStyle = '#8a909a'; g.fillRect(x, yy + 1, 16, 0.6); }
    g.restore();
    hazard(g, x, y + dh - 3, 16, 3);
    g.strokeStyle = K; g.lineWidth = 0.7; g.strokeRect(x, y, 16, dh);
  }
  // havalandırma menfezi: tavandaki ızgara; içinden bug düşerken kapağı açılır
  function drawVent(g, v) {
    const x = v.x * 16, y = v.y * 16 + 10;
    box(g, x - 2, y, 20, 6, 1, v.open > 0 ? '#14161c' : '#6a707c', K, 0.7);
    if (v.open > 0) { box(g, x - 2, y + 5, 3, 9, 0.6, '#6a707c', K, 0.5); return; }
    for (let k = 0; k < 5; k++) lin(g, x + 1 + k * 3.6, y + 1.2, x + 1 + k * 3.6, y + 4.8, 'rgba(0,0,0,0.5)', 1);
  }
  // şalter: kutu, grup renginde şerit, durum ışığı ve kol (elektrik varken yukarıda)
  function drawLever(g, lv, on, gt) {
    const x = lv.x * 16, y = lv.y * 16, col = grpCol(lv.grp);
    const k = Math.min(1, Math.max(0, (gt - lv.t) / 0.18)), a0 = on ? 0.9 : -1.1, a1 = on ? -1.1 : 0.9, an = a0 + (a1 - a0) * k;
    box(g, x + 1, y + 3, 14, 13, 1.6, '#4a505c', K, 0.8);
    g.fillStyle = col; g.fillRect(x + 2, y + 12.6, 12, 2);
    box(g, x + 3, y + 5, 5, 5, 0.8, '#2a2e38', null);
    for (let k2 = 0; k2 < 3; k2++) lin(g, x + 3.8, y + 6 + k2 * 1.5, x + 7.2, y + 6 + k2 * 1.5, on ? 'rgba(255,220,80,0.8)' : 'rgba(120,120,120,0.6)', 0.6);
    circle(g, x + 12, y + 6.4, 1.6, on ? '#5dff7a' : '#ff4a3a', K, 0.4);
    const px = x + 10.5, py = y + 9, ex = px + Math.cos(an) * 8, ey = py + Math.sin(an) * 8;
    lin(g, px, py, ex, ey, K, 2.6); lin(g, px, py, ex, ey, '#c8ccd4', 1.4);
    circle(g, ex, ey, 2.2, '#d8343a', K, 0.6);
    circle(g, px, py, 1.4, '#8a909a', K, 0.5);
  }
  // elektrikli ızgara: metal ızgara, uçlarında grup rengi; elektrik varken mavi kıvılcımlar
  function drawZap(g, z, on, t) {
    const x0 = z.x0 * 16, x1 = (z.x1 + 1) * 16, y = z.y * 16, col = grpCol(z.grp);
    box(g, x0, y, x1 - x0, 16, 0, '#2a2e38', K, 0.8);
    g.save(); g.beginPath(); g.rect(x0, y, x1 - x0, 16); g.clip();
    g.strokeStyle = on ? '#6a8ab0' : '#4a505c'; g.lineWidth = 0.9;
    for (let k = x0 - 16; k < x1; k += 4) { g.beginPath(); g.moveTo(k, y + 16); g.lineTo(k + 16, y); g.stroke(); g.beginPath(); g.moveTo(k, y); g.lineTo(k + 16, y + 16); g.stroke(); }
    g.restore();
    box(g, x0, y, x1 - x0, 2.2, 0, on ? '#8ab8e8' : '#5a606c', null);
    g.fillStyle = col; g.fillRect(x0, y, 2.4, 16); g.fillRect(x1 - 2.4, y, 2.4, 16);
    if (!on) return;
    g.fillStyle = 'rgba(120,200,255,0.16)'; g.fillRect(x0, y - 5, x1 - x0, 5);
    const f = Math.floor(t * 14);
    for (let xx = x0 + 6; xx < x1 - 4; xx += 11) {
      if ((f + xx) % 4) continue;
      g.strokeStyle = '#dff4ff'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(xx, y);
      for (let k = 1; k <= 3; k++) g.lineTo(xx + ((f * 7 + k * 13 + xx) % 5) - 2, y - k * 2.2);
      g.stroke();
    }
  }
  // raylı platform ve rayı: elektrik varken uçlarındaki ışıklar yanar
  function drawTrack(g, pl) {
    if (pl.kind === 'h') { const y = pl.y * 16 + 3; lin(g, pl.a * 16, y, (pl.b + pl.w) * 16, y, '#1e222a', 2.4); lin(g, pl.a * 16, y, (pl.b + pl.w) * 16, y, '#4a505c', 0.8); }
    else { const x = (pl.x + pl.w / 2) * 16; lin(g, x, pl.a * 16, x, pl.b * 16 + 16, '#1e222a', 2.6); lin(g, x, pl.a * 16, x, pl.b * 16 + 16, '#4a505c', 0.9); }
  }
  function drawRailCar(g, pl, on) {
    const x = pl.x * 16, y = pl.y * 16, w = pl.w * 16;
    box(g, x, y, w, 7, 1.6, '#5a6272', K, 0.8);
    g.fillStyle = grpCol(pl.grp); g.fillRect(x + 3, y + 3.6, w - 6, 1.6);
    for (const cx of [x + 3, x + w - 3]) circle(g, cx, y + 1.8, 1.1, on ? '#ffe07a' : '#3a3e48', null);
    box(g, x + w / 2 - 3, y + 6.4, 6, 3, 0.8, '#3a404c', K, 0.5);
  }

  // ---------------- Yerebatan ----------------
  // sarnıç sütunu (arka plan): gövde, başlık ve kaide; turuncu ışıkla aydınlanır. cry: ağlayan sütun (göz deseni)
  function drawColumn(g, d) {
    const x = d.x * 16, w = d.w * 16, y0 = d.y0 * 16, y1 = d.y1 * 16;
    g.fillStyle = grad(g, x, 0, x + w, 0, [[0, '#4a524e'], [0.35, '#8a948c'], [0.6, '#6e7872'], [1, '#3a403c']]);
    g.fillRect(x + 3, y0 + 8, w - 6, y1 - y0 - 8);
    if (d.cry) { g.fillStyle = 'rgba(40,46,44,0.55)'; for (let y = y0 + 14; y < y1 - 4; y += 9) for (let k = 0; k < 2; k++) ellipse(g, x + 8 + k * (w - 16), y, 2.6, 4, 'rgba(40,46,44,0.55)', null); }
    g.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = y0 + 14; y < y1; y += 22) g.fillRect(x + 3, y, w - 6, 0.8);
    // başlık: üstte genişleyen sepet ve yapraklar
    poly(g, [x - 1, y0, x + w + 1, y0, x + w - 3, y0 + 9, x + 3, y0 + 9], '#7a847e', K, 0.7);
    for (let k = 0; k < 3; k++) ellipse(g, x + 5 + k * (w - 10) / 2, y0 + 5, 3, 3.6, '#94a098', K, 0.4);
    box(g, x - 2, y0 - 3, w + 4, 3.4, 0.6, '#6a746e', K, 0.6);
    g.fillStyle = 'rgba(255,150,60,0.12)'; g.fillRect(x + 3, y0 + 9, (w - 6) * 0.4, y1 - y0 - 9);
  }
  // sarnıç suyu: koyu yeşil-mavi, turuncu yansımalar, dipte yüzen sazanlar
  function drawPool(g, d, t, deep) {
    const x0 = d.x0 * 16, x1 = d.x1 * 16, y = d.y * 16, yb = deep * 16;
    g.fillStyle = grad(g, 0, y, 0, y + 40, [[0, 'rgba(30,70,74,0.92)'], [1, 'rgba(10,26,30,0.98)']]);
    g.fillRect(x0, y, x1 - x0, yb - y);
    for (let k = 0; k < (x1 - x0) / 40; k++) {
      const fx = x0 + ((k * 97 + t * (8 + (k % 3) * 3) * (k % 2 ? 1 : -1)) % (x1 - x0) + (x1 - x0)) % (x1 - x0), fy = y + 14 + (k % 3) * 6 + Math.sin(t + k) * 1.5, dir = k % 2 ? 1 : -1;
      g.save(); g.translate(fx, fy); g.scale(dir, 1);
      ellipse(g, 0, 0, 5, 2, 'rgba(230,120,50,0.55)', null); poly(g, [-4.5, 0, -8, -2.4, -8, 2.4], 'rgba(230,120,50,0.5)', null);
      g.restore();
    }
    for (let x = x0 + ((t * 6) % 12); x < x1 - 4; x += 12) lin(g, x, y + 2 + Math.sin(t * 2 + x) * 0.6, x + 5, y + 2 + Math.sin(t * 2 + x) * 0.6, 'rgba(255,180,90,0.35)', 0.8);
    lin(g, x0, y, x1, y, 'rgba(200,230,220,0.35)', 0.8);
  }
  // akıntı: suyun üstünde akan çizgiler
  function drawCurrent(g, c, y, t) {
    const x0 = c.x0 * 16, x1 = c.x1 * 16, sp = c.v * 16;
    for (let k = 0; k < (x1 - x0) / 26; k++) {
      const x = x0 + (((k * 26 + t * sp) % (x1 - x0)) + (x1 - x0)) % (x1 - x0), yy = y * 16 + 6 + (k % 3) * 4;
      lin(g, x, yy, x - Math.sign(c.v) * 7, yy, 'rgba(190,230,220,0.35)', 0.8);
    }
  }
  // sandal: ahşap gövde, kürek, direkte fener
  function drawSandal(g, b, t) {
    const x = b.x * 16, y = b.deck.y * 16, w = b.w * 16, bob = Math.sin(t * 2.2 + b.x) * 0.6 + b.bump * 4 * Math.sin(t * 40);
    g.save(); g.translate(0, bob);
    g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x + w + 3, y); g.quadraticCurveTo(x + w, y + 9, x + w - 6, y + 9); g.lineTo(x + 6, y + 9); g.quadraticCurveTo(x, y + 9, x - 3, y); g.closePath();
    g.fillStyle = '#7a4e2c'; g.fill(); g.strokeStyle = K; g.lineWidth = 0.8; g.stroke();
    g.fillStyle = '#9a6a3e'; g.fillRect(x - 1, y + 0.5, w + 2, 2);
    lin(g, x + w - 8, y - 1, x + w + 6, y + 10, '#5a3a20', 1.4);
    lin(g, x + 5, y, x + 5, y - 14, K, 1.4); lin(g, x + 5, y - 14, x + 9, y - 14, K, 1);
    box(g, x + 7, y - 14, 4, 5, 1, '#3a3020', K, 0.5);
    circle(g, x + 9, y - 11.5, 1.4, '#ffc860', null);
    circle(g, x + 9, y - 11.5, 6, 'rgba(255,190,90,0.18)', null);
    g.restore();
  }
  // Medusa başı: taş yüz, yılan saçlar; yan yatmış ya da baş aşağı. gözler uyarıda yanıp söner, açıkken bakış yeşil koni
  function drawMedusa(g, m, t) {
    const cx = (m.dir === 'd' ? m.x + m.w / 2 : m.x + 0.5) * 16, cy = (m.dir === 'd' ? m.y + 0.5 : m.y + m.w / 2) * 16;
    const rot = m.dir === 'l' ? Math.PI / 2 : m.dir === 'r' ? -Math.PI / 2 : Math.PI;   // yüzün baktığı yön
    if (m.on && m.box && m.box.w > 0 && m.box.h > 0) {
      const b = m.box, X = b.x * 16, Y = b.y * 16, W2 = b.w * 16, H2 = b.h * 16;
      g.save();
      g.fillStyle = m.dir === 'd' ? grad(g, 0, Y, 0, Y + H2, [[0, 'rgba(140,255,170,0.42)'], [1, 'rgba(140,255,170,0.08)']])
        : grad(g, m.dir === 'l' ? X + W2 : X, 0, m.dir === 'l' ? X : X + W2, 0, [[0, 'rgba(140,255,170,0.42)'], [1, 'rgba(140,255,170,0.08)']]);
      g.fillRect(X, Y, W2, H2);
      g.strokeStyle = 'rgba(200,255,210,0.5)'; g.lineWidth = 0.6;
      for (let k = 0; k < 4; k++) {
        const u = ((t * 1.6 + k / 4) % 1);
        if (m.dir === 'd') { const yy = Y + u * H2; g.beginPath(); g.moveTo(X + 1, yy); g.lineTo(X + W2 - 1, yy); g.stroke(); }
        else { const xx = m.dir === 'l' ? X + W2 - u * W2 : X + u * W2; g.beginPath(); g.moveTo(xx, Y + 1); g.lineTo(xx, Y + H2 - 1); g.stroke(); }
      }
      g.restore();
    }
    g.save(); g.translate(cx, cy); g.rotate(rot); g.scale(1.25, 1.25);
    // yılan saçlar: kıvrılan yeşilimsi taş yılanlar
    for (let k = 0; k < 9; k++) {
      const a = Math.PI * 0.92 + (k / 8) * Math.PI * 1.16, r = 8.5, wig = Math.sin(t * 3 + k * 1.3) * 1.4;
      g.strokeStyle = K; g.lineWidth = 3.2; g.beginPath(); g.moveTo(Math.cos(a) * 5, Math.sin(a) * 5 - 1);
      g.quadraticCurveTo(Math.cos(a) * r + wig, Math.sin(a) * r, Math.cos(a) * (r + 3.5), Math.sin(a) * (r + 2.5) + wig); g.stroke();
      g.strokeStyle = '#6e8a62'; g.lineWidth = 2; g.stroke();
      circle(g, Math.cos(a) * (r + 3.5), Math.sin(a) * (r + 2.5) + wig, 1.6, '#7e9a70', K, 0.5);
    }
    ellipse(g, 0, 1, 7.6, 8.6, '#b8b49c', K, 1);
    ellipse(g, -2.6, 4, 2.2, 3, 'rgba(255,255,255,0.12)', null);
    lin(g, -4.6, -1.6, -1.2, -0.8, '#5a5848', 0.9); lin(g, 4.6, -1.6, 1.2, -0.8, '#5a5848', 0.9);
    const lit = m.on || (m.warn && Math.floor(t * 10) % 2 === 0);
    for (const ex of [-2.8, 2.8]) { ellipse(g, ex, 1.2, 1.9, 1.3, lit ? '#b8ffc8' : '#4a483c', K, 0.5); if (lit) circle(g, ex, 1.2, 3.8, 'rgba(160,255,180,0.35)', null); }
    lin(g, 0, 2.6, -0.6, 5, 'rgba(60,58,48,0.7)', 0.8);
    g.strokeStyle = '#5a5848'; g.lineWidth = 0.9; g.beginPath(); g.arc(0, 6.4, 2, 0.2, Math.PI - 0.2); g.stroke();
    g.restore();
  }
  // taşa dönmüş bug: gri taş heykel, karo boyunda
  function stoneBug() {
    return cached('tasbug', (g) => {
      box(g, 0.5, 11.5, 15, 4.5, 1, '#7a7e7c', K, 0.7);
      ellipse(g, 8, 8.4, 6.4, 4.6, '#9a9e9a', K, 0.8);
      circle(g, 3.4, 6.4, 3, '#a6aaa6', K, 0.7);
      for (const dx of [-1.2, 1.2]) circle(g, 3 + dx, 5.8, 0.7, '#5a5e5a', null);
      lin(g, 5, 4, 3.6, 1.6, '#6a6e6a', 0.8); lin(g, 2.6, 4, 1, 1.6, '#6a6e6a', 0.8);
      g.strokeStyle = 'rgba(60,64,60,0.6)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(9, 4.4); g.lineTo(9, 12.6); g.moveTo(11, 6); g.lineTo(13, 10); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(6, 5, 4, 0.8);
    });
  }
  // duvar çatlağı (bug yuvası): karanlık yarık, içinde parlayan gözler
  function drawNest(g, n, t) {
    const x = n.x * 16, y = n.y * 16;
    poly(g, [x + 3, y + 16, x + 6, y + 4, x + 9, y - 2, x + 11, y + 6, x + 13, y + 16], '#141816', 'rgba(60,70,64,0.8)', 0.8);
    if (Math.floor(t * 0.7 + n.x) % 4) for (const dx of [-1.4, 1.4]) circle(g, x + 8.4 + dx, y + 8, 0.8, '#ff4a3a', null);
  }
  // taşkın suyu: koyu, köpüklü üst çizgi (oyuncunun önünde)
  function drawFlood(g, d, t, vh) {
    const x0 = d.x0 * 16 - 2, x1 = d.x1 * 16 + 2, y = d.y * 16;
    g.save();
    g.beginPath(); g.moveTo(x0, vh);
    for (let x = x0; x <= x1; x += 4) g.lineTo(x, y + Math.sin(t * 2.4 + x * 0.1) * 1.2);
    g.lineTo(x1, vh); g.closePath();
    g.fillStyle = grad(g, 0, y, 0, y + 64, [[0, 'rgba(40,96,100,0.7)'], [1, 'rgba(10,30,36,0.92)']]); g.fill();
    g.strokeStyle = 'rgba(200,240,230,0.7)'; g.lineWidth = 1;
    g.beginPath(); for (let x = x0; x <= x1; x += 4) { const yy = y + Math.sin(t * 2.4 + x * 0.1) * 1.2; if (x === x0) g.moveTo(x, yy); else g.lineTo(x, yy); } g.stroke();
    g.restore();
  }
  // pompa: dökme demir gövde, üstte vana çarkı (basılınca döner); kalan kullanım kadar yeşil ışık
  function drawPump(g, pm, gt) {
    const x = pm.x * 16, y = pm.y * 16, sp = Math.max(0, 1 - (gt - pm.t) / 1.2);
    box(g, x + 1, y + 6, 14, 10, 1.6, '#3a5a6a', K, 0.8);
    lin(g, x + 8, y + 6, x + 8, y + 2, K, 2);
    g.save(); g.translate(x + 8, y + 2); g.rotate((gt - pm.t) * 8 * sp + pm.x);
    g.strokeStyle = '#c83a2a'; g.lineWidth = 1.6; g.beginPath(); g.arc(0, 0, 5, 0, Math.PI * 2); g.stroke();
    for (let k = 0; k < 4; k++) lin(g, 0, 0, Math.cos(k * Math.PI / 2) * 5, Math.sin(k * Math.PI / 2) * 5, '#c83a2a', 1);
    g.restore();
    for (let k = 0; k < 3; k++) circle(g, x + 4 + k * 4, y + 11, 1, k < pm.uses ? '#5dff7a' : '#2a3a32', null);
  }

  // ---------------- Köprü ----------------
  // rüzgâr: bölgede yatay akan çizgiler ve savrulan küçük kâğıt parçaları; dinmeden önce birkaç çizgi uyarır
  function drawWind(g, w, t, cam) {
    const a = Math.max(w.k, w.warn ? 0.25 : 0);
    if (a <= 0.01) return;
    const x0 = Math.max(w.x0, cam - 1) * 16, x1 = Math.min(w.x1, cam + 17) * 16, y0 = Math.max(w.y0, 0) * 16 + 8, y1 = Math.min(w.y1, 14 + 40) * 16;
    if (x1 <= x0) return;
    const dir = Math.sign(w.v), sp = Math.abs(w.v) * 16 * 2.2, n = Math.round((x1 - x0) / 22);
    for (let k = 0; k < n; k++) {
      const yy = y0 + ((k * 53) % Math.max(16, Math.min(y1 - y0, 13 * 16))), len = 10 + (k % 4) * 6;
      const x = x0 + ((((k * 71 + t * sp) % (x1 - x0)) + (x1 - x0)) % (x1 - x0)) * 1;
      const xx = dir > 0 ? x : x1 - (x - x0);
      lin(g, xx, yy, xx - dir * len, yy, `rgba(220,235,255,${0.45 * a})`, 0.9);
      if (k % 5 === 0) {
        g.save(); g.translate(xx + dir * 6, yy + Math.sin(t * 6 + k) * 3); g.rotate(t * 8 * dir + k);
        g.fillStyle = `rgba(240,240,230,${0.8 * a})`; g.fillRect(-1.6, -1, 3.2, 2); g.restore();
      }
    }
  }
  // halat makarası: halat (eğik çelik tel), uç direkleri ve tamponu; makara tekerleği, askı ve küçük bakım platformu
  function drawCable(g, tr) {
    const ax = tr.x0 * 16, ay = (tr.y0 - 1.8) * 16, bx = tr.x1 * 16, by = (tr.y1 - 1.8) * 16;
    lin(g, ax - 6, ay, bx + 6, by, K, 2.4); lin(g, ax - 6, ay, bx + 6, by, '#9aa2ae', 1.2);
    box(g, bx + 4, by - 4, 6, 10, 1.4, '#d8343a', K, 0.6);
    g.fillStyle = '#fff'; g.fillRect(bx + 5, by - 1, 4, 1.5); g.fillRect(bx + 5, by + 2.5, 4, 1.5);
  }
  function drawTrolley(g, tr, t) {
    const pl = tr.plat, x = pl.x * 16, y = pl.y * 16, w = pl.w * 16, cx = x + w / 2, cy = y - 1.8 * 16;
    lin(g, cx, cy + 3, cx, y, K, 1.6); lin(g, cx, cy + 3, cx, y, '#5a626e', 0.8);
    g.save(); g.translate(cx, cy); g.rotate(tr.s * 2.2);
    circle(g, 0, 0, 3.6, '#c8ccd4', K, 0.8); lin(g, -3, 0, 3, 0, '#6a727e', 0.8); lin(g, 0, -3, 0, 3, '#6a727e', 0.8);
    g.restore();
    box(g, x, y, w, 5, 1.4, '#f0b030', K, 0.8);
    g.fillStyle = '#1a1a1a'; for (let k = 2; k < w - 2; k += 5) g.fillRect(x + k, y + 1.6, 2.4, 1.8);
    if (Math.abs(tr.v) > 3) for (let k = 0; k < 3; k++) circle(g, cx - Math.sign(tr.v) * (5 + k * 4), cy + Math.sin(t * 30 + k) * 1.5, 0.8, 'rgba(255,220,140,0.8)', null);
  }
  // bakım sepeti: tepe makarası, iki halat, korkuluklu sepet
  function drawSwing(g, sw) {
    const px = sw.px * 16, py = sw.py * 16, pl = sw.plat, x = pl.x * 16, y = pl.y * 16, w = pl.w * 16;
    box(g, px - 6, py - 3, 12, 5, 1.4, '#4a525e', K, 0.7);
    circle(g, px, py, 2.4, '#9aa2ae', K, 0.6);
    for (const dx of [3, w - 3]) { lin(g, px, py, x + dx, y - 12, K, 1.4); lin(g, px, py, x + dx, y - 12, '#b0b6c0', 0.6); }
    box(g, x, y - 12, w, 2, 0.6, '#c8ccd4', K, 0.6);
    for (const dx of [1, w / 2, w - 1]) lin(g, x + dx, y - 11, x + dx, y, '#c8ccd4', 1);
    box(g, x - 1, y, w + 2, 6, 1.4, '#3a8ad0', K, 0.8);
    g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(x, y + 1, w, 1);
  }

  // ---------------- Eyüp ----------------
  // çamaşır ipi: iki direk, sarkan ip, mandallı çamaşırlar; basılınca esner
  const CLOTH = ['#e8483a', '#3a8ad0', '#f4c531', '#f4f0e8', '#5ab06a', '#e07ab0'];
  function drawRope(g, rp, t) {
    const x0 = rp.x0 * 16, x1 = rp.x1 * 16, y = rp.y * 16, w = x1 - x0;
    for (const px of [x0 - 1, x1 + 1]) { lin(g, px, y - 2, px, y + 22, K, 2); lin(g, px, y - 2, px, y + 22, '#8a6a4a', 1); }
    const sagAt = (x) => { const u = (x - x0) / w, base = Math.sin(u * Math.PI) * 2.5, d = rp.sag * 7 * Math.exp(-Math.pow((x - x0 - rp.hx * 16) / (w * 0.4), 2)) * Math.cos(rp.sag * 9); return y + base + d; };
    g.strokeStyle = '#e8e2d4'; g.lineWidth = 0.9; g.beginPath();
    for (let x = x0; x <= x1; x += 2) { if (x === x0) g.moveTo(x, sagAt(x)); else g.lineTo(x, sagAt(x)); } g.stroke();
    for (let k = 0, x = x0 + 4; x < x1 - 6; x += 9, k++) {
      const yy = sagAt(x + 3), col = CLOTH[(k + rp.seed) % CLOTH.length], sw = Math.sin(t * 2 + k) * 0.08;
      g.save(); g.translate(x + 3, yy); g.rotate(sw);
      if (k % 3 === 0) { box(g, -3.5, 0, 7, 8, 0.6, col, K, 0.5); lin(g, -3.5, 2, -5.5, 5, col, 2); lin(g, 3.5, 2, 5.5, 5, col, 2); }   // gömlek
      else if (k % 3 === 1) { box(g, -2, 0, 4, 6, 0.6, col, K, 0.5); box(g, -2, 4, 3.5, 2.4, 0.8, col, K, 0.5); }                             // çorap
      else box(g, -4, 0, 8, 10, 0.4, col, K, 0.5);                                                                                           // havlu
      lin(g, -1, -0.5, -1, 1.5, '#8a6a4a', 0.8);
      g.restore();
    }
  }
  // teleferik hattı: halat ve iki istasyon; kabin: renkli, camlı, tavanı basılır
  function drawLine(g, ln) {
    const ax = ln.x0 * 16, ay = (ln.y0 - 2.6) * 16, bx = ln.x1 * 16, by = (ln.y1 - 2.6) * 16;
    lin(g, ax, ay, bx, by, K, 2); lin(g, ax, ay, bx, by, '#8a929e', 1);
    for (const [x, y] of [[ax, ay], [bx, by]]) { box(g, x - 10, y - 8, 20, 12, 2, '#3a4a5a', K, 0.8); circle(g, x, y - 2, 3, '#9aa2ae', K, 0.6); }
  }
  function drawCabin3(g, cb) {
    const ln = cb.line, x = cb.x * 16, y = cb.y * 16, w = cb.w * 16, cx = x + w / 2, u = (((cb.s % ln.L) + ln.L) % ln.L) / ln.L;
    if (u < 0.03 || u > 0.97) return;   // istasyonun içinde
    lin(g, cx, y - 2.6 * 16 + 4, cx, y, K, 1.6); lin(g, cx, y - 2.6 * 16 + 4, cx, y, '#6a727e', 0.8);
    circle(g, cx, y - 2.6 * 16 + 4, 2.4, '#c8ccd4', K, 0.6);
    box(g, x, y, w, 14, 3, '#d8343a', K, 0.9);
    box(g, x + 3, y + 3, w - 6, 6, 1.4, '#ffe0a0', K, 0.6);
    lin(g, x + w / 2, y + 3, x + w / 2, y + 9, K, 0.6);
    g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(x + 2, y + 1, w - 4, 1);
  }
  // teleferik direği: kafes gövde, üstte kol (kolu haritada karo)
  function drawPylon(g, d) {
    const x = d.x * 16 + 16, y = d.y * 16;
    lin(g, x - 5, y + 16, x - 8, y + 200, '#5a626e', 2.4); lin(g, x + 5, y + 16, x + 8, y + 200, '#5a626e', 2.4);
    for (let k = 0; k < 9; k++) lin(g, x - 5 - k * 0.3, y + 20 + k * 20, x + 5 + k * 0.3, y + 30 + k * 20, 'rgba(90,98,110,0.8)', 1);
    circle(g, x, y - 3, 2, '#ff4a3a', null);
  }

  // ---------------- Şile ----------------
  // oto yıkama fırçası: üst rayda taşıyıcı, dönen renkli kıllar
  function drawBrush(g, br, t) {
    const x = br.x * 16, y0 = br.y0 * 16, y1 = (br.y1 + 1) * 16, w = br.w * 16, pl = br.plat;
    box(g, pl.x * 16, pl.y * 16, pl.w * 16, 6, 1.4, '#5a6270', K, 0.8);
    g.fillStyle = '#f0b030'; g.fillRect(pl.x * 16 + 2, pl.y * 16 + 2, pl.w * 16 - 4, 1.4);
    lin(g, x + w / 2, pl.y * 16 + 6, x + w / 2, y1 - 2, '#3a404c', 2);
    for (let yy = y0 + 2; yy < y1 - 1; yy += 3) {
      const ph = br.spin + yy * 0.4, sw = Math.sin(ph) * 4;
      lin(g, x - 3 + sw * 0.3, yy, x + w + 3 - sw * 0.3, yy + 1, ['#3a8ad0', '#e8483a', '#f4c531'][Math.floor(yy / 3) % 3], 2.4);
    }
  }
  // köpük topu (yerde) ve köpük baloncukları
  function drawFoamGun(g, f) {
    const x = f.x * 16, y = (f.y + 1) * 16;
    box(g, x - 6, y - 8, 14, 8, 2, '#3a7ac0', K, 0.8);
    box(g, x - 1, y - 14, 4, 7, 1, '#9aa2ae', K, 0.6);
  }
  function drawBubble(g, b, t) {
    const cx = (b.x + b.w / 2) * 16, cy = b.y * 16 + 4, r = 12 + Math.sin(b.age * 6) * 0.8, k = b.stood / b.life;
    g.fillStyle = `rgba(230,245,255,${0.35 + k * 0.2})`; g.beginPath(); g.ellipse(cx, cy, r * (1 + k * 0.15), r * 0.55, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 1; g.stroke();
    circle(g, cx - r * 0.4, cy - 2, 2, 'rgba(255,255,255,0.9)', null);
    g.strokeStyle = 'rgba(190,120,255,0.35)'; g.beginPath(); g.ellipse(cx, cy, r * 0.8, r * 0.38, 0, 0.3, 2); g.stroke();
  }
  // işaret feneri: kırmızı-beyaz küçük kule, tepede dönen ışık konisi
  function drawBeacon(g, bm, t) {
    const x = bm.x * 16, y = bm.y * 16, base = 12 * 16;
    g.save(); g.beginPath(); g.moveTo(x - 6, base); g.lineTo(x - 4, y + 6); g.lineTo(x + 4, y + 6); g.lineTo(x + 6, base); g.closePath(); g.clip();
    for (let yy = y + 6, k = 0; yy < base; yy += 10, k++) { g.fillStyle = k % 2 ? '#e8483a' : '#f4f0e8'; g.fillRect(x - 7, yy, 14, 10); }
    g.restore();
    box(g, x - 6, y - 2, 12, 8, 1.4, '#3a404c', K, 0.8);
    circle(g, x, y + 2, 3.4, '#fff4c0', null);
    const a = bm.a, L = bm.range * 16, h = bm.half;
    const gr = g.createRadialGradient(x, y + 2, 2, x, y + 2, L);
    gr.addColorStop(0, 'rgba(255,240,170,0.55)'); gr.addColorStop(1, 'rgba(255,240,170,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(x, y + 2);
    g.lineTo(x + Math.cos(a - h) * L, y + 2 + Math.sin(a - h) * L); g.lineTo(x + Math.cos(a + h) * L, y + 2 + Math.sin(a + h) * L); g.closePath(); g.fill();
  }

  // ---------------- Sanayi ----------------
  // yürüyen bant: kauçuk şerit, akış yönünde kayan oklar, uçlarda makara
  function drawBelt(g, bt, t) {
    const x0 = bt.x0 * 16, x1 = (bt.x1 + 1) * 16, y = bt.y * 16;
    box(g, x0, y, x1 - x0, 16, 4, '#2a2e36', K, 0.9);
    g.save(); g.beginPath(); g.rect(x0 + 2, y + 2, x1 - x0 - 4, 5); g.clip();
    g.fillStyle = '#3a3e48'; g.fillRect(x0, y + 2, x1 - x0, 5);
    const d = Math.sign(bt.v) || 1, off = ((t * bt.v * 16) % 10 + 10) % 10;
    for (let x = x0 - 10 + off; x < x1 + 10; x += 10) poly(g, [x, y + 2.5, x + 3 * d, y + 4.5, x, y + 6.5, x + 1.5 * d, y + 4.5], '#f0b030', null);
    g.restore();
    for (let x = x0 + 8; x < x1; x += 16) { const a = t * bt.v * 4; circle(g, x, y + 11, 3.4, '#5a606c', K, 0.6); lin(g, x, y + 11, x + Math.cos(a) * 3, y + 11 + Math.sin(a) * 3, '#9aa2ae', 0.8); }
  }
  // koli: karton kutu, bant ve etiket
  function crate() {
    return cached('koli', (g) => {
      box(g, 0.6, 1.4, 14.8, 14, 1, '#c89a5a', K, 0.8);
      g.fillStyle = '#b0844a'; g.fillRect(7, 1.4, 2, 14);
      g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(2.4, 9, 4.2, 3);
      g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(3, 10, 3, 0.6);
    });
  }
  // pres: tavandan inen piston, ağır kafa, sarı-siyah kenar; inmeden önce titrer
  function drawPress(g, pr, t) {
    const x = pr.x * 16, w = pr.w * 16, y = pr.y * 16 + (pr.warn ? Math.sin(t * 60) * 0.8 : 0), top = (pr.top - 6) * 16;
    lin(g, x + w / 2, top, x + w / 2, y, K, 5); lin(g, x + w / 2, top, x + w / 2, y, '#b8bec8', 3);
    box(g, x - 2, y, w + 4, pr.shock ? 18 : 16, 2, pr.shock ? '#4a4e58' : '#6a707c', K, 1);
    hazard(g, x - 1, y + (pr.shock ? 14 : 12), w + 2, 3);
    g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(x, y + 2, w, 1.2);
    if (pr.shock) {
      // şahmerdanın örsü
      const by = (pr.bot + 1) * 16;
      poly(g, [x - 6, by, x + w + 6, by, x + w + 2, by - 3, x - 2, by - 3], '#3a3e48', K, 0.7);
    }
  }
  // kızgın demir çubuk: soğudukça turuncudan griye; ocak ve makaralar
  function drawIron(g, ir, t) {
    const x = ir.x * 16, y = ir.y * 16, w = ir.w * 16, h = ir.heat;
    const r = Math.round(110 + 145 * h), gg = Math.round(110 + 40 * h * h), b = Math.round(118 - 90 * h);
    if (h > 0.25) { g.fillStyle = `rgba(255,140,40,${0.25 * h})`; g.fillRect(x - 4, y - 6, w + 8, 14); }
    box(g, x, y, w, 7, 1.6, `rgb(${r},${gg},${b})`, K, 0.8);
    if (h > 0.25) { g.fillStyle = `rgba(255,240,180,${h})`; g.fillRect(x + 2, y + 1.5, w - 4, 1.2); if (Math.floor(t * 8 + ir.x) % 3 === 0) circle(g, x + (t * 37 % w), y - 2, 0.8, '#ffd27a', null); }
  }
  function drawForge(g, sp, t) {
    const x = sp.x0 * 16, y = sp.y * 16, x1 = (sp.x1 + sp.w) * 16;
    for (let xx = x + 8; xx < x1; xx += 12) { circle(g, xx, y + 10, 3, '#4a4e58', K, 0.5); circle(g, xx, y + 10, 1, '#9aa2ae', null); }
    lin(g, x, y + 10, x1, y + 10, 'rgba(60,64,72,0.6)', 1);
    box(g, x - 28, y - 30, 26, 46, 3, '#5a3a2a', K, 1);
    box(g, x - 22, y - 8, 16, 14, 6, '#1a0a06', K, 0.6);
    const f = 0.6 + 0.4 * Math.sin(t * 9);
    ellipse(g, x - 14, y + 1, 6, 4 * f, '#ff8a2a', null); ellipse(g, x - 14, y + 2, 3, 2 * f, '#ffe08a', null);
  }

  // ---------------- Çamlıca ----------------
  // cam teras karosu: neredeyse görünmez; sis değince çiy tutar (beyaz buğu, kenar çizgisi)
  function drawFrost(g, x, y, d, t, edgeL, edgeR) {
    const a = 0.1 + 0.85 * d;
    g.fillStyle = `rgba(200,230,245,${a * 0.35})`; g.fillRect(x, y, 16, 5);
    g.strokeStyle = `rgba(235,248,255,${a})`; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x, y + 0.5); g.lineTo(x + 16, y + 0.5); g.stroke();
    if (edgeL) { g.beginPath(); g.moveTo(x + 0.5, y); g.lineTo(x + 0.5, y + 5); g.stroke(); }
    if (edgeR) { g.beginPath(); g.moveTo(x + 15.5, y); g.lineTo(x + 15.5, y + 5); g.stroke(); }
    if (d > 0.3) for (let k = 0; k < 3; k++) circle(g, x + 3 + k * 5 + Math.sin(t + x) * 0.5, y + 2.5, 0.9, `rgba(255,255,255,${d * 0.8})`, null);
  }
  // sis bulutu: yumuşak beyaz kümeler
  function drawFog(g, f, t) {
    const cx = (f.x + f.w / 2) * 16, w = f.w * 16, y0 = Math.max(0, f.y0) * 16, y1 = Math.min(14, f.y1) * 16;
    for (let k = 0; k < 9; k++) {
      const px = cx + Math.sin(k * 2.1 + t * 0.4) * w * 0.38, py = y0 + (y1 - y0) * ((k * 0.37) % 1), r = 26 + (k % 3) * 10;
      const gr = g.createRadialGradient(px, py, 2, px, py, r);
      gr.addColorStop(0, 'rgba(225,232,240,0.34)'); gr.addColorStop(1, 'rgba(225,232,240,0)');
      g.fillStyle = gr; g.fillRect(px - r, py - r, 2 * r, 2 * r);
    }
  }
  // dolap asansör: iki sütunlu kuyu ve zincir; kabinler açık önlü küçük odalar
  function drawPaterShaft(g, pt) {
    const x0 = pt.x * 16 - 3, x1 = (pt.x + pt.gap + pt.w) * 16 + 3, y0 = (pt.top - 2.4) * 16, y1 = (pt.bot + 1) * 16;
    box(g, x0, y0, x1 - x0, y1 - y0, 3, 'rgba(30,36,48,0.55)', '#4a5266', 1);
    for (const cx of [(pt.x + pt.w / 2) * 16, (pt.x + pt.gap + pt.w / 2) * 16]) { lin(g, cx, y0 + 4, cx, y1 - 2, '#6a7286', 1.2); }
    circle(g, (pt.x + pt.w / 2) * 16, y0 + 8, 4, '#8a92a6', K, 0.6); circle(g, (pt.x + pt.gap + pt.w / 2) * 16, y0 + 8, 4, '#8a92a6', K, 0.6);
    poly(g, [(pt.x + pt.w / 2) * 16 - 3, y1 - 10, (pt.x + pt.w / 2) * 16 + 3, y1 - 10, (pt.x + pt.w / 2) * 16, y1 - 16], '#5dff7a', null);
    poly(g, [(pt.x + pt.gap + pt.w / 2) * 16 - 3, y0 + 18, (pt.x + pt.gap + pt.w / 2) * 16 + 3, y0 + 18, (pt.x + pt.gap + pt.w / 2) * 16, y0 + 24], '#ff6a5a', null);
  }
  function drawPater(g, c) {
    const x = c.x * 16, y = c.y * 16, w = c.w * 16;
    box(g, x - 1, y - 26, w + 2, 3, 0.8, '#8a6a4a', K, 0.6);
    lin(g, x + 1, y - 24, x + 1, y, '#6a5a4a', 1.4); lin(g, x + w - 1, y - 24, x + w - 1, y, '#6a5a4a', 1.4);
    box(g, x - 1, y, w + 2, 5, 1.2, '#b8844a', K, 0.8);
    g.fillStyle = 'rgba(255,230,180,0.18)'; g.fillRect(x + 1, y - 23, w - 2, 23);
  }
  // yayın vericisi: yerde çanak; genişleyen dalga halkası
  function drawEmitter(g, w, t) {
    const x = w.x * 16, y = w.y * 16;
    poly(g, [x - 9, y, x + 9, y, x + 5, y - 5, x - 5, y - 5], '#5a6272', K, 0.8);
    lin(g, x, y - 5, x, y - 12, K, 1.6); circle(g, x, y - 13, 2.2, (w.r >= 0 && w.r < 0.6) ? '#ffffff' : '#3ad0ff', K, 0.6);
    if (w.r >= 0 && w.r <= w.max) {
      const a = 1 - w.r / w.max;
      g.strokeStyle = `rgba(90,220,255,${0.8 * a})`; g.lineWidth = 2.2; g.beginPath(); g.arc(x, y, Math.max(0.1, w.r * 16), 0, Math.PI * 2); g.stroke();
      g.strokeStyle = `rgba(255,255,255,${0.6 * a})`; g.lineWidth = 0.8; g.beginPath(); g.arc(x, y, Math.max(0.1, w.r * 16 - 2), 0, Math.PI * 2); g.stroke();
    }
  }

  // ---------------- Ümraniye ----------------
  // vinç: kule, kol ve araba; kancanın halatı ve taşıdığı kiriş
  function drawCrane(g, hk) {
    const x0 = Math.min(hk.ax, hk.bx) * 16 - 24, x1 = (Math.max(hk.ax, hk.bx) + hk.w) * 16 + 24, jy = (hk.top - 3) * 16;
    const mx = x0 - 8;
    lin(g, mx, jy - 6, mx, 12 * 16, '#c8a020', 5); lin(g, mx, jy - 6, mx, 12 * 16, '#f0c030', 2.4);
    for (let y = jy; y < 12 * 16; y += 12) lin(g, mx - 2.5, y, mx + 2.5, y + 12, 'rgba(120,90,10,0.8)', 0.8);
    lin(g, mx - 20, jy, x1, jy, '#c8a020', 4); lin(g, mx - 20, jy, x1, jy, '#f0c030', 1.8);
    for (let x = mx; x < x1; x += 10) lin(g, x, jy - 2, x + 5, jy + 2, 'rgba(120,90,10,0.8)', 0.7);
    box(g, mx - 26, jy - 2, 8, 8, 1, '#5a6070', K, 0.6);
  }
  function drawHook(g, hk) {
    const pl = hk.plat, x = pl.x * 16, y = pl.y * 16, w = pl.w * 16, jy = (hk.top - 3) * 16, cx = x + w / 2;
    box(g, cx - 5, jy - 1, 10, 5, 1, '#3a404c', K, 0.6);
    lin(g, cx, jy + 4, cx, y - 10, K, 1.4); lin(g, cx, jy + 4, cx, y - 10, '#9aa2ae', 0.6);
    lin(g, cx, y - 10, x + 3, y, '#9aa2ae', 0.8); lin(g, cx, y - 10, x + w - 3, y, '#9aa2ae', 0.8);
    circle(g, cx, y - 10, 2, '#f0c030', K, 0.6);
    box(g, x, y, w, 6, 0.6, '#d8504a', K, 0.9);
    g.fillStyle = '#a83830'; g.fillRect(x + 1, y + 2.2, w - 2, 1.4);
    for (let k = 4; k < w - 2; k += 8) circle(g, x + k, y + 4.4, 0.7, '#5a2a2a', null);
  }

  root.BA_HAND = {
    glass, planter, turnstile, panel, rack, fanBase, drawFan, drawAir, drawHeat, drawCart, drawDoor, drawReader, coffee,
    drawTable, drawCup, drawGold, goldSlot, drawMoodBug, drawThief, drawPrince, darkTile,
    block, plank, drawScale, drawPan, drawCayci, drawTray, drawShutter, drawBeam,
    drawRoad, drawLight, drawCar, drawShaft, drawCabin2, drawRevolving, drawLamp, drawCopier,
    drawFerry, drawRowboat, drawAwning, drawKarpuz, drawCrate, drawTide, drawRaft,
    drawBoard, drawChartBack, drawChartBar, drawLaser, drawGate, drawVent, drawLever, drawZap, drawTrack, drawRailCar,
    drawColumn, drawPool, drawCurrent, drawSandal, drawMedusa, stoneBug, drawNest, drawFlood, drawPump,
    drawWind, drawCable, drawTrolley, drawSwing, drawRope, drawLine, drawCabin3, drawPylon,
    drawBrush, drawFoamGun, drawBubble, drawBeacon, drawBelt, crate, drawPress, drawIron, drawForge,
    drawFrost, drawFog, drawPaterShaft, drawPater, drawEmitter, drawCrane, drawHook,
  };
})(typeof window !== 'undefined' ? window : globalThis);
