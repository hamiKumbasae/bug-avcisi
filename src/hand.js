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

  root.BA_HAND = {
    glass, planter, turnstile, panel, rack, fanBase, drawFan, drawAir, drawHeat, drawCart, drawDoor, drawReader, coffee,
    drawTable, drawCup, drawGold, goldSlot, drawMoodBug, drawThief, drawPrince, darkTile,
  };
})(typeof window !== 'undefined' ? window : globalThis);
