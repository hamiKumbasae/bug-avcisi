// Bug Avcısı: İstanbul — yazısız hikâye sahneleri.
// Kahraman Ümraniye'deki atölyesinden çıkar, büyük şehirde kendine bir yer arar, sonunda kendi yerini kurar.
// Sahnelerde tek kelime yoktur: hikâyeyi ışık, kompozisyon, hareket ve ses anlatır.
// Işık dili Edward Hopper'dan esinlidir (tablolar kopyalanmaz): sert güneş ve gölge, düz renk alanları,
// cam arkasında tek başına insanlar, boş sokaklar.
(function (root) {
  'use strict';
  const A = root.BA_ART, SC = root.BA_SCENE, K = SC.kit;
  const VW = 256, VH = 240, TAU = Math.PI * 2;
  const cache = A.cache();
  function layer(key, w, h, fn) { let c = cache.get(key); if (!c) { c = A.mk(w, h, fn); cache.set(key, c); } return c; }
  function img(g, c, x, y) { g.drawImage(c, x, y, c.lw, c.lh); }
  // sahnenin ayı: bugünün tarihinde, sahnenin saatinde İstanbul'dan görünen ay (görünmüyorsa çizilmez)
  const dayKey = () => { const M = root.BA_MOON; if (!M) return ''; const d = M.istanbulDate(); return `:${d.y}-${d.m}-${d.d}`; };
  function moonIn(b, slot, x, horizonY, topY, r, dayOffset) {
    const M = root.BA_MOON, mo = M && M.forScene(slot, new Date(), dayOffset);
    if (mo) SC.drawMoon(b, x, M.skyY(mo.altitudeDeg, horizonY, topY), r, mo, true);
  }
  const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const ease = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
  const seg = (t, a, b) => ease((t - a) / (b - a));
  const lerp = (a, b, k) => a + (b - a) * k;
  function rect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
  function grad(g, x0, y0, x1, y1, stops) { return A.grad(g, x0, y0, x1, y1, stops); }
  function glow(g, x, y, r, col, a) {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, col.replace('A', String(a))); gr.addColorStop(1, col.replace('A', '0'));
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // ---------------- insanlar ----------------
  // Yan görünüş, sağa bakar (dir -1 sola). h: ayaktaki boy. Kahraman: turkuaz kapüşonlu, gözlüklü.
  const HERO = { shirt: '#1fae9a', shirtD: '#14806f', pants: '#3d5a92', hair: '#4a2a1a', skin: '#f6c39c', glasses: true };
  function figure(g, x, by, h, o) {
    o = Object.assign({ pose: 'stand', dir: 1, skin: '#e8b896', shirt: '#5a6a8a', pants: '#2e3446', hair: '#3a2a20', phase: 0 }, o);
    const u = h / 100, shirtD = o.shirtD || A.shade(o.shirt, -0.25);
    g.save(); g.translate(x, by); g.scale(o.dir, 1);
    let hip = [0, -47 * u], sh = [0, -80 * u], head = [2 * u, -90 * u];
    let legs, arms;
    const L = (a, len) => [Math.sin(a) * len, Math.cos(a) * len];
    switch (o.pose) {
      case 'walk': {
        const a = Math.sin(o.phase * TAU) * 0.42;
        const f1 = L(a, 46 * u), f2 = L(-a, 46 * u);
        legs = [[hip, [f2[0], hip[1] + f2[1]], 'back'], [hip, [f1[0], hip[1] + f1[1]], 'front']];
        const b1 = L(-a * 0.9, 30 * u), b2 = L(a * 0.9, 30 * u);
        arms = [[[0, sh[1] + 3 * u], [b2[0], sh[1] + 3 * u + b2[1]], 'back'], [[0, sh[1] + 3 * u], [b1[0], sh[1] + 3 * u + b1[1]], 'front']];
        const bob = Math.abs(Math.sin(o.phase * TAU)) * -1.5 * u;
        hip = [hip[0], hip[1] + bob]; sh = [sh[0], sh[1] + bob]; head = [head[0], head[1] + bob];
        break;
      }
      case 'sit': case 'desk': {
        hip = [0, -27 * u]; sh = [3 * u, -60 * u]; head = [6 * u, -70 * u];
        legs = [[hip, [17 * u, -27 * u], 'back', [18 * u, 0]], [hip, [19 * u, -26 * u], 'front', [20 * u, 0]]];
        const hx = o.pose === 'desk' ? 24 * u : 16 * u, hy = o.pose === 'desk' ? -42 * u : -32 * u;
        arms = [[[3 * u, sh[1] + 3 * u], [hx - 2 * u, hy], 'back'], [[3 * u, sh[1] + 3 * u], [hx, hy + u], 'front']];
        if (o.typing) { const k = Math.sin(o.phase * TAU * 3) * u; arms[1][1] = [hx, hy + k]; }
        break;
      }
      case 'lean': {
        sh = [12 * u, -76 * u]; head = [18 * u, -84 * u];
        legs = [[hip, [-3 * u, 0], 'back'], [hip, [4 * u, 0], 'front']];
        arms = [[[12 * u, -73 * u], [24 * u, -50 * u], 'back'], [[12 * u, -73 * u], [26 * u, -51 * u], 'front']];
        break;
      }
      case 'kneel': {
        hip = [0, -24 * u]; sh = [9 * u, -55 * u]; head = [14 * u, -64 * u];
        legs = [[hip, [-4 * u, -2 * u], 'back', [-20 * u, 0]], [hip, [14 * u, -22 * u], 'front', [15 * u, 0]]];
        arms = [[[9 * u, -52 * u], [20 * u, -36 * u], 'back'], [[9 * u, -52 * u], [26 * u, -8 * u], 'front']];
        break;
      }
      case 'back': {
        legs = [[[-3 * u, hip[1]], [-4 * u, 0], 'back'], [[3 * u, hip[1]], [4 * u, 0], 'front']];
        arms = [[[-7 * u, sh[1] + 3 * u], [-9 * u, sh[1] + 32 * u], 'back'], [[7 * u, sh[1] + 3 * u], [9 * u, sh[1] + 32 * u], 'front']];
        head = [0, -90 * u];
        break;
      }
      default: {
        legs = [[hip, [-3 * u, 0], 'back'], [hip, [4 * u, 0], 'front']];
        arms = [[[0, sh[1] + 3 * u], [-2 * u, sh[1] + 32 * u], 'back'], [[0, sh[1] + 3 * u], [3 * u, sh[1] + 32 * u], 'front']];
        if (o.hold) arms[1][1] = [11 * u, sh[1] + 22 * u];
      }
    }
    if (o.reach) arms[1][1] = [o.reach[0] * u, o.reach[1] * u];
    if (o.wave) arms[1][1] = [sh[0] + 8 * u + Math.sin(o.phase * TAU * 2) * 2 * u, sh[1] - 26 * u];
    const lw = Math.max(1.2, 7 * u), aw = Math.max(1, 5 * u);
    const leg = (l, col) => {
      if (l[3]) { A.limb(g, l[0][0], l[0][1], l[1][0], l[1][1], lw, col); A.limb(g, l[1][0], l[1][1], l[3][0], l[3][1], lw, col); A.box(g, l[3][0] - 2 * u, l[3][1] - 3 * u, 9 * u, 3.5 * u, 1.4 * u, '#2a2630', null); }
      else { A.limb(g, l[0][0], l[0][1], l[1][0], l[1][1], lw, col); A.box(g, l[1][0] - 2.5 * u, l[1][1] - 3.4 * u, 9 * u, 3.6 * u, 1.4 * u, '#2a2630', null); }
    };
    const arm = (a, col) => { A.limb(g, a[0][0], a[0][1], a[1][0], a[1][1], aw, col); A.circle(g, a[1][0], a[1][1], aw * 0.55, o.skin, null); };
    leg(legs[0], A.shade(o.pants, -0.2));
    arm(arms[0], shirtD);
    if (o.bag) A.box(g, (o.pose === 'back' ? -8 : -12) * u, sh[1] + 2 * u, 9 * u, 22 * u, 3 * u, '#3a3440');
    // gövde
    g.save(); g.translate(sh[0], sh[1]); g.rotate(Math.atan2(hip[0] - sh[0], hip[1] - sh[1]) * -1);
    const tl = Math.hypot(hip[0] - sh[0], hip[1] - sh[1]);
    A.box(g, -7.5 * u, -2 * u, 15 * u, tl + 5 * u, 4.5 * u, o.shirt);
    g.restore();
    leg(legs[1], o.pants);
    // baş
    const hr = 8 * u;
    A.circle(g, head[0], head[1], hr, o.skin);
    g.save(); g.beginPath(); g.arc(head[0], head[1], hr, 0, TAU); g.clip();
    g.fillStyle = o.hair;
    if (o.pose === 'back' || o.away) g.fillRect(head[0] - hr, head[1] - hr, hr * 2, hr * 1.5);
    else { g.beginPath(); g.ellipse(head[0] - hr * 0.35, head[1] - hr * 0.45, hr * 1.05, hr * 0.8, -0.2, 0, TAU); g.fill(); }
    g.restore();
    A.circle(g, head[0], head[1], hr, null);
    if (o.glasses && o.pose !== 'back' && !o.away) {
      const gy = o.look === 'up' ? head[1] - hr * 0.35 : head[1] + hr * 0.05;
      A.circle(g, head[0] + hr * 0.62, gy, hr * 0.32, 'rgba(210,236,255,0.5)', A.K, Math.max(0.5, 0.9 * u));
    }
    arm(arms[1], o.shirt);
    if (o.hold === 'folder') A.box(g, 9 * u, sh[1] + 14 * u, 4 * u, 14 * u, 0.8 * u, '#f2ead6');
    g.restore();
  }
  function hero(g, x, by, h, o) { figure(g, x, by, h, Object.assign({}, HERO, o)); }

  // ---------------- ortak parçalar ----------------
  // Ümraniye apartmanı: balkonlu, çanak antenli, ışığa dönük yüzü ılık
  function apartment(g, x, by, w, h, col, seed) {
    const r = A.rng(seed);
    rect(g, x, by - h, w, h, col);
    g.fillStyle = grad(g, 0, by - h, 0, by, [[0, 'rgba(255,190,130,0.35)'], [0.6, 'rgba(60,40,90,0)'], [1, 'rgba(40,30,70,0.35)']]);
    g.fillRect(x, by - h, w, h);
    rect(g, x - 2, by - h - 3, w + 4, 3, A.shade(col, -0.3));
    const fl = Math.floor((h - 8) / 22);
    for (let f = 0; f < fl; f++) {
      const y = by - h + 8 + f * 22;
      for (let k = 0; k < Math.floor(w / 18); k++) {
        const wx = x + 5 + k * 18;
        rect(g, wx, y, 9, 11, r() < 0.12 ? '#e8c890' : '#3e4258');
        rect(g, wx, y, 9, 1.2, 'rgba(255,255,255,0.25)');
      }
      if (r() < 0.6) { rect(g, x + 3, y + 12, w - 6, 1.6, A.shade(col, -0.35)); for (let k = x + 4; k < x + w - 4; k += 3) rect(g, k, y + 12, 0.7, -4, A.shade(col, -0.35)); }
      if (r() < 0.35) { A.ellipse(g, x + w - 8, y + 5, 3, 3.4, '#d8dce4', A.K, 0.4, -0.5); }
    }
  }
  function wires(g, w, y0, col) {
    g.strokeStyle = col; g.lineWidth = 0.5;
    for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(-10, y0 + k * 4); g.quadraticCurveTo(w / 2, y0 + 16 + k * 5, w + 10, y0 + 2 + k * 4); g.stroke(); }
  }
  // atölye tabelası: örs ve çekiç (yazısız)
  function anvilSign(g, x, y, w, h) {
    A.box(g, x, y, w, h, 1.5, '#2a2430');
    const cx = x + w / 2, cy = y + h / 2 + 1;
    A.poly(g, [cx - 8, cy - 2, cx + 7, cy - 2, cx + 9, cy - 4, cx + 9, cy, cx + 4, cy + 1, cx + 3, cy + 4, cx - 3, cy + 4, cx - 4, cy + 1, cx - 8, cy], '#c8ccd4', null);
    A.lin(g, cx - 2, cy - 5, cx + 5, cy - 11, '#a87a4a', 1.2);
    A.box(g, cx + 2.6, cy - 13.2, 6, 3, 0.6, '#c8ccd4', null);
  }
  function sparks(g, x, y, t, period, n, seed) {
    const r = A.rng(seed);
    for (let i = 0; i < n; i++) {
      const born = Math.floor(t / period) * period, age = t - born;
      if (age > 0.7) continue;
      const a = -Math.PI / 2 + (r() - 0.5) * 2.4, v = 18 + r() * 34;
      const px = x + Math.cos(a) * v * age, py = y + Math.sin(a) * v * age + 40 * age * age;
      A.circle(g, px, py, 0.7, `rgba(255,${180 + Math.floor(r() * 60)},90,${1 - age / 0.7})`, null);
    }
  }
  function birds(g, t, y, n, col, speed) {
    for (let i = 0; i < n; i++) {
      const x = ((t * (speed || 14) + i * 37) % 340) - 40, yy = y + i * 7 + Math.sin(t * 2 + i) * 2;
      SC.seagull(g, x, yy, 0.5, col, 0.6 + Math.sin(t * 9 + i * 2) * 0.5);
    }
  }

  // ---------------- sahneler ----------------
  const SCENES = {};

  // 0 — Giriş: Ümraniye, şafak. Atölyenin yarı açık kepenginden ateş ışığı; üst katta laptop ışığı.
  // Işık söner, kahraman çantasını alıp şehre iner.
  SCENES.giris = {
    dur: 10.5, amb: 'sabah', music: 'hikaye',
    draw(g, t) {
      const camX = lerp(64, 0, seg(t, 3.8, 10));
      const base = layer('giris', 320, 240, (b) => {
        b.fillStyle = grad(b, 0, 0, 0, 175, [[0, '#2c3468'], [0.5, '#a07a96'], [0.8, '#eaa88a'], [1, '#f6cc9c']]);
        b.fillRect(0, 0, 320, 240);
        glow(b, 300, 150, 120, 'rgba(255,214,160,A)', 0.55);
        // Çamlıca tepesi ve kulesi (Ümraniye'nin hemen yanı)
        SC.pen(null);
        b.fillStyle = '#6a5a86'; b.beginPath(); b.moveTo(120, 175); b.quadraticCurveTo(230, 112, 320, 128); b.lineTo(320, 175); b.closePath(); b.fill();
        K.camlicaTower(b, 248, 128, 0.62, { wall: '#7a6a96', wallD: '#6a5a86', glass: '#8a7aa6', band: '#a898c0' });
        // apartmanlar
        apartment(b, -6, 205, 60, 104, '#cdb8a6', 3);
        apartment(b, 56, 205, 52, 86, '#d8c4a0', 5);
        apartment(b, 110, 205, 40, 120, '#bfa8a8', 7);
        apartment(b, 262, 205, 64, 96, '#d4c0a4', 11);
        // kahramanın binası: altta atölye, üstte oda
        rect(b, 152, 82, 108, 123, '#cbb49e');
        b.fillStyle = grad(b, 152, 0, 260, 0, [[0, 'rgba(60,40,80,0.25)'], [0.7, 'rgba(255,200,140,0.0)'], [1, 'rgba(255,200,140,0.25)']]); b.fillRect(152, 82, 108, 123);
        rect(b, 150, 79, 112, 4, '#8a7464');
        for (const [wx, wy] of [[164, 92], [186, 92], [230, 92], [164, 118], [230, 118]]) { rect(b, wx, wy, 12, 15, '#3e4258'); rect(b, wx, wy, 12, 1.4, 'rgba(255,255,255,0.25)'); }
        rect(b, 158, 136, 98, 2, '#8a7464');
        // atölye kepengi (yarı açık) ve tabela
        anvilSign(b, 166, 147, 54, 12);
        rect(b, 162, 160, 64, 45, '#2a2026');
        rect(b, 162, 160, 64, 20, '#8a8e98');
        for (let y = 161; y < 180; y += 2.2) rect(b, 162, y, 64, 0.6, '#6a6e78');
        // kapı
        rect(b, 236, 171, 18, 34, '#5a4436'); rect(b, 236, 171, 18, 2, '#3a2a22');
        // kaldırım, yol
        rect(b, 0, 205, 320, 10, '#9a948e'); rect(b, 0, 205, 320, 1.4, '#c8c2ba');
        rect(b, 0, 215, 320, 25, '#4a4652');
        for (let x = 6; x < 320; x += 28) rect(b, x, 227, 14, 1.4, '#c8c2b0');
        // sokak lambası
        A.lin(b, 102, 205, 102, 150, '#2a2a34', 1.4); A.lin(b, 102, 151, 112, 151, '#2a2a34', 1.2);
        // park etmiş dolmuş
        A.box(b, 14, 182, 58, 23, 4, '#e8c23a'); rect(b, 18, 186, 50, 8, '#4a5a74');
        A.circle(b, 26, 205, 5, '#2a2630'); A.circle(b, 60, 205, 5, '#2a2630');
        wires(b, 320, 54, 'rgba(30,24,40,0.6)');
        // alçak sabah güneşi sağdan: binaların gölgeleri sola, yola uzanır
        b.fillStyle = 'rgba(40,30,70,0.22)';
        for (const [x0, x1] of [[-6, 54], [56, 108], [110, 150], [152, 160], [226, 236], [254, 262]]) { b.beginPath(); b.moveTo(x0, 205); b.lineTo(x1, 205); b.lineTo(x1 - 46, 240); b.lineTo(x0 - 46, 240); b.closePath(); b.fill(); }
      });
      g.save(); g.translate(-camX, 0);
      img(g, base, 0, 0);
      // atölyenin ateşi, kaldırıma düşen ışık
      const fl = 0.75 + Math.sin(t * 11) * 0.08 + Math.sin(t * 23) * 0.05;
      g.fillStyle = grad(g, 0, 180, 0, 205, [[0, `rgba(255,150,60,${0.85 * fl})`], [1, `rgba(255,110,40,${0.6 * fl})`]]); g.fillRect(163, 180, 62, 25);
      A.poly(g, [175, 192, 196, 192, 198, 189, 198, 195, 194, 196, 193, 200, 178, 200, 177, 196, 173, 195], '#1a1418', null);
      g.fillStyle = `rgba(255,170,90,${0.35 * fl})`; g.beginPath(); g.moveTo(162, 205); g.lineTo(226, 205); g.lineTo(244, 215); g.lineTo(150, 215); g.closePath(); g.fill();
      const clang = (t % 1.35) < 0.08;
      if (clang) glow(g, 194, 190, 26, 'rgba(255,220,150,A)', 0.8);
      sparks(g, 194, 190, t, 1.35, 14, 7);
      // lamba hâlâ yanık
      glow(g, 112, 153, 12, 'rgba(255,230,160,A)', 0.7 - seg(t, 0, 10) * 0.4);
      // Çamlıca'nın kırmızı ışığı
      if (Math.floor(t * 1.5) % 2) A.circle(g, 248, 128 - 0.62 * 172, 1.1, '#ff4a3a', null);
      // üst kattaki oda: masada laptop ışığı, sonra söner
      const lit = t < 3.6;
      rect(g, 208, 118, 12, 15, lit ? '#ffd890' : '#2e3044');
      if (lit) { glow(g, 214, 126, 18, 'rgba(255,220,150,A)', 0.55); figure(g, 211, 133, 13, Object.assign({}, HERO, { pose: 'desk', typing: true, phase: t })); rect(g, 216, 127, 3, 2.4, '#bfe8ff'); }
      // kuşlar
      birds(g, t, 30, 3, '#3a3040', 16);
      // kahraman kapıdan çıkar, sola yürür
      if (t > 4.2 && t < 4.9) rect(g, 237, 172, 16, 33, '#1a1418');
      if (t > 4.5) {
        const k = clamp01((t - 4.5) / 6), x = lerp(244, 40, k);
        hero(g, x, 206, 30, { pose: 'walk', dir: -1, phase: t * 1.4, bag: true });
      }
      g.restore();
      // sabah ışığı artar
      g.fillStyle = `rgba(255,200,140,${seg(t, 2, 10) * 0.12})`; g.fillRect(0, 0, VW, VH);
    },
  };

  // 1 — Maslak'tan sonra: dev bir cam cephe. Her camın ardında masasında biri; bir masa boş.
  // Aşağıda turnike kırmızı yanar, kapılar hemen açılmaz. Kahraman bakar, sonra yoluna devam eder.
  const PLAZA_H = 440;
  SCENES.ara1 = {
    dur: 10, amb: 'plaza',
    draw(g, t) {
      const camY = lerp(0, PLAZA_H - VH, seg(t, 0.4, 5.2));
      const cols = 6, cw = 42.6, rows = 12, rh = 30, top = 8;
      const EMPTY = [8, 4];
      const base = layer('ara1', VW, PLAZA_H, (b) => {
        rect(b, 0, 0, VW, PLAZA_H, '#bcd2e2');
        rect(b, 0, top, VW, rows * rh + 4, '#34424f');
        const r = A.rng(17);
        for (let ry = 0; ry < rows; ry++) for (let cx = 0; cx < cols; cx++) {
          const x = 2 + cx * cw, y = top + 2 + ry * rh, w = cw - 3, h = rh - 4;
          const inside = r() < 0.32 || (ry === EMPTY[0] && cx === EMPTY[1]);
          if (inside) {
            rect(b, x, y, w, h, '#efe4c8');
            rect(b, x, y + h * 0.66, w, h * 0.34, '#d8c8a2');
            rect(b, x + 2, y + h * 0.55, w * 0.6, 1.6, '#8a7a62');
            if (!(ry === EMPTY[0] && cx === EMPTY[1])) {
              rect(b, x + 7, y + h * 0.32, 7, 5.4, '#2a2e38'); rect(b, x + 8, y + h * 0.36, 5, 3.4, '#9ad0f0');
              figure(b, x + 22, y + h * 0.98, 17, { pose: 'desk', dir: -1, shirt: ['#5a6a8a', '#8a4a3a', '#6a7a5a', '#d8c8a0', '#3a3a48'][Math.floor(r() * 5)], hair: ['#2a2020', '#6a4a2a', '#1a1a1a'][Math.floor(r() * 3)] });
            }
          } else {
            b.fillStyle = grad(b, x, y, x + w, y + h, [[0, '#8eaec6'], [0.5, '#6e90ac'], [1, '#56748e']]); b.fillRect(x, y, w, h);
            b.fillStyle = 'rgba(255,255,255,0.18)'; b.beginPath(); b.moveTo(x + w * 0.2, y + h); b.lineTo(x + w * 0.45, y + h); b.lineTo(x + w * 0.85, y); b.lineTo(x + w * 0.6, y); b.closePath(); b.fill();
          }
        }
        // boş masa: sandalye ve yanık lamba
        const ex = 2 + EMPTY[1] * cw, ey = top + 2 + EMPTY[0] * rh;
        A.box(b, ex + 21, ey + 9, 5, 12, 1.2, '#4a4a58', null); rect(b, ex + 19, ey + 16, 10, 2, '#4a4a58'); A.lin(b, ex + 24, ey + 18, ex + 24, ey + 26, '#4a4a58', 1);
        A.lin(b, ex + 8, ey + 15, ex + 10, ey + 7, '#3a3a44', 0.8); A.poly(b, [ex + 7, ey + 7, ex + 14, ey + 7, ex + 11, ey + 4], '#3a3a44', null);
        // çapraz güneş şeridi (Hopper ışığı)
        b.fillStyle = 'rgba(255,236,190,0.16)'; b.beginPath(); b.moveTo(0, 60); b.lineTo(120, 0); b.lineTo(256, 0); b.lineTo(256, 30); b.lineTo(0, 260); b.closePath(); b.fill();
        // giriş katı: cam lobi, turnikeler, güvenlik
        const gy = top + rows * rh + 4;
        rect(b, 0, gy, VW, PLAZA_H - gy, '#2a3440');
        rect(b, 20, gy + 4, 216, 34, '#e8eef2');
        b.fillStyle = grad(b, 20, gy + 4, 20, gy + 38, [[0, 'rgba(160,190,210,0.2)'], [1, 'rgba(120,150,170,0.45)']]); b.fillRect(20, gy + 4, 216, 34);
        for (let x = 20; x < 236; x += 36) rect(b, x, gy + 4, 1.6, 34, '#5a6a78');
        figure(b, 196, gy + 38, 24, { shirt: '#2a2e3a', pants: '#22262e', hair: '#1a1a1a' });
        rect(b, 0, gy + 38, VW, PLAZA_H - gy - 38, '#a8a6a2'); rect(b, 0, gy + 38, VW, 1.4, '#d0ccc4');
        b.fillStyle = 'rgba(40,50,70,0.25)'; b.beginPath(); b.moveTo(0, gy + 39); b.lineTo(VW, gy + 39); b.lineTo(VW - 60, PLAZA_H); b.lineTo(0, PLAZA_H); b.closePath(); b.fill();
      });
      g.save(); g.translate(0, -camY);
      img(g, base, 0, 0);
      // boş masanın lambası titrer
      const ex = 2 + EMPTY[1] * cw, ey = top + 2 + EMPTY[0] * rh;
      glow(g, ex + 10, ey + 9, 14, 'rgba(255,230,160,A)', 0.55 + Math.sin(t * 17) * 0.08);
      // turnikeler
      const gy = top + rows * rh + 4;
      const alarm = t > 5.6 && t < 7 && Math.floor(t * 6) % 2;
      for (const x of [92, 116, 140]) {
        A.box(g, x, gy + 20, 6, 18, 1.5, '#5a5e68', A.K, 0.5);
        A.circle(g, x + 3, gy + 23, 1.4, alarm ? '#ff3a2a' : '#8a2a2a', null);
        if (alarm) glow(g, x + 3, gy + 23, 6, 'rgba(255,60,40,A)', 0.6);
      }
      // kahraman dışarıda, yukarı bakıyor; sonra döner ve gider
      const hy = PLAZA_H - 8;
      if (t < 6.8) hero(g, 70, hy, 30, { pose: 'stand', dir: 1, look: t < 5.6 ? 'up' : null, hold: 'folder', bag: true });
      else { const k = clamp01((t - 6.8) / 3.2); hero(g, lerp(70, -30, k), hy, 30, { pose: 'walk', dir: -1, phase: t * 1.4, bag: true }); }
      g.restore();
    },
  };

  // ortak: deniz bandı, güneş parıltısı
  function seaBand(g, y0, y1, top, bottom, t, sunX) {
    g.fillStyle = grad(g, 0, y0, 0, y1, [[0, top], [1, bottom]]); g.fillRect(0, y0, VW + 80, y1 - y0);
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 0.6; g.beginPath();
    for (let r = 0; r < 5; r++) {
      const yy = y0 + 4 + r * (y1 - y0) / 5, sp = 22 + r * 6, off = (t * (6 + r * 3)) % sp;
      for (let x = -sp + off; x < VW + 80; x += sp) { g.moveTo(x, yy); g.quadraticCurveTo(x + 3, yy - 1.2, x + 6, yy); }
    }
    g.stroke();
    if (sunX !== undefined) { g.fillStyle = 'rgba(255,226,170,0.55)'; for (let k = 0; k < 8; k++) { const w = 26 - k * 3; g.fillRect(sunX - w / 2 + Math.sin(t * 2 + k) * 2, y0 + 2 + k * 2.6, w, 0.8); } }
  }
  function envelope(g, x, y, s, flap) {
    g.save(); g.translate(x, y); g.scale(s, s);
    for (const d of [-1, 1]) { g.save(); g.rotate(d * (0.4 + flap * 0.5)); A.ellipse(g, d * 5, -2, 3.4, 1.4, '#ffffff', A.K, 0.5); g.restore(); }
    A.box(g, -4, -3, 8, 6, 0.8, '#fffbe8', A.K, 0.6);
    A.lin(g, -3.6, -2.6, 0, 0.4, '#c8b890', 0.5); A.lin(g, 3.6, -2.6, 0, 0.4, '#c8b890', 0.5);
    g.restore();
  }

  // Üsküdar'dan sonra: sahilde bankta laptop ve simit. Yan taraftaki kafenin camının ardında herkes tek başına.
  // Laptoptan çıkan zarflar martılarla birlikte karşı kıyıya uçar; denizde Kız Kulesi, önünden vapur geçer.
  SCENES.ara2 = {
    dur: 10.5, amb: 'uskudar',
    draw(g, t) {
      const z = lerp(1, 1.08, seg(t, 0, 10)), fx = 186, fy = 196;
      const back = layer('ara2b', VW, 152, (b) => {
        b.fillStyle = grad(b, 0, 0, 0, 150, [[0, '#7c8ec4'], [0.6, '#e8b08a'], [1, '#f8d4a2']]); b.fillRect(0, 0, VW, 152);
        glow(b, 214, 128, 70, 'rgba(255,220,160,A)', 0.6);
        A.circle(b, 214, 128, 12, '#fff0c4', null);
        SC.pen(null);
        const sil = { wall: '#9a8098', wallD: '#8e7490', roof: '#8a7090', trim: '#9a8098' };
        b.fillStyle = '#a088a0'; b.fillRect(0, 140, VW, 12);
        SC.hagiaSophia(b, 70, 146, 0.42, sil); SC.blueMosque(b, 150, 146, 0.42, sil); K.hillMosque(b, 232, 144, 0.32, sil);
      });
      const base = layer('ara2', VW, VH, (b) => {
        // kafe: büyük cam, içeride sıcak ışık, her masada bir kişi
        rect(b, 0, 82, 104, 114, '#2e4a3a');
        rect(b, 0, 76, 108, 9, '#1e3a2c');
        rect(b, 4, 92, 96, 100, '#f2d698');
        b.fillStyle = grad(b, 4, 92, 4, 192, [[0, 'rgba(255,250,220,0.5)'], [1, 'rgba(200,140,60,0.25)']]); b.fillRect(4, 92, 96, 100);
        rect(b, 4, 160, 96, 32, '#c8a670');
        for (const [x, c, hcol] of [[20, '#8a3a3a', '#2a2020'], [52, '#3a5a7a', '#6a4a2a'], [84, '#6a7a4a', '#1a1a1a']]) {
          rect(b, x - 9, 160, 16, 2, '#6a4a2a'); A.lin(b, x - 1, 162, x - 1, 176, '#6a4a2a', 1);
          rect(b, x - 4, 157, 3, 3, '#ffffff');
          figure(b, x + 6, 178, 26, { pose: 'sit', dir: -1, shirt: c, hair: hcol });
        }
        for (const x of [4, 36, 68, 100]) rect(b, x - 1, 92, 2, 100, '#1e3a2c');
        rect(b, 4, 140, 96, 1.5, 'rgba(30,58,44,0.8)');
        // rıhtım
        rect(b, 0, 196, VW, 44, '#b4a690'); rect(b, 0, 196, VW, 2, '#d8ccb6');
        for (let x = 0; x < VW; x += 16) rect(b, x, 198, 0.6, 42, '#9a8c76');
        for (const x of [120, 244]) { A.box(b, x - 3, 188, 6, 9, 2, '#3a3a44'); }
        // bank
        A.box(b, 160, 180, 52, 3, 1, '#7a5432'); A.box(b, 160, 172, 52, 3, 1, '#7a5432');
        for (const x of [164, 206]) A.lin(b, x, 183, x, 196, '#2a2630', 1.6);
      });
      g.save();
      g.translate(fx, fy); g.scale(z, z); g.translate(-fx, -fy);
      img(g, back, 0, 0);
      seaBand(g, 152, 196, '#7a8ab8', '#3e5a8a', t, 214);
      // Kız Kulesi (bayraksız), gün batımında
      SC.pen('rgba(30,20,50,0.4)', 0.4);
      SC.maidensTower(g, 138, 172, 0.62, { wall: '#e8d4cc', wallD: '#c8b0b0', roof: '#6a6a8a', trim: '#d8c4bc', win: '#6a5a7a', lit: '#ffe0a0', rock: '#5a4a64' });
      SC.pen(null);
      // karşıdan geçen vapur
      SC.pen('rgba(30,20,50,0.4)', 0.4); SC.ferry(g, 300 - t * 9, 156, 0.32, { hull: '#3a3058', white: '#f6e6da', win: '#7a6a8a', funnel: '#f2c87a' }); SC.pen(null);
      img(g, base, 0, 0);
      // kahraman bankta, dizinde laptop; yanında simit
      hero(g, 186, 196, 34, { pose: 'sit', dir: 1, typing: t < 7, phase: t });
      A.box(g, 192, 168, 11, 2, 0.6, '#c9ccd4', A.K, 0.5); A.poly(g, [194, 168, 203, 168, 205, 160, 196, 160], '#2a2e38', A.K, 0.5);
      glow(g, 199, 165, 10, 'rgba(160,220,255,A)', 0.4);
      const stolen = t > 7.6;
      if (!stolen) A.drawSimit(g, 172, 168, 0, 4.2);
      // zarflar ekrandan kalkıp martılarla karşı kıyıya uçar
      for (let i = 0; i < 6; i++) {
        const t0 = 2.2 + i * 0.75, k = (t - t0) / 4.5;
        if (k <= 0 || k >= 1) continue;
        const x = lerp(198, 60 + i * 26, k), y = lerp(160, 70 + (i % 3) * 14, ease(k)) - Math.sin(k * Math.PI) * 18;
        envelope(g, x, y, lerp(1, 0.45, k), Math.sin(t * 14 + i));
      }
      birds(g, t, 40, 4, '#ffffff', 11);
      // bir martı simidi kapar
      if (t > 6.6) {
        const k = clamp01((t - 6.6) / 3);
        const gx = k < 0.33 ? lerp(260, 174, k / 0.33) : lerp(174, 120, (k - 0.33) / 0.67), gy = k < 0.33 ? lerp(120, 162, k / 0.33) : lerp(162, 60, (k - 0.33) / 0.67);
        A.drawMarti(g, gx, gy + 6, t, k < 0.33 ? -1 : -1, false);
        if (stolen) A.drawSimit(g, gx - 2, gy + 6, 0, 3.4);
      }
      g.restore();
    },
  };

  // Kapalıçarşı'dan sonra: Han'da, tek lambanın altında gümüşe kalemle desen işleyen yaşlı bir usta. Duvarda kalemler
  // ve çekiçler. Usta başını kaldırır ve kahramana bir keski uzatır.
  SCENES.ara4 = {
    dur: 11.5, amb: 'han',
    cues: [[7.4, 'glass']],
    draw(g, t) {
      const base = layer('ara4', VW, VH, (b) => {
        rect(b, 0, 0, VW, VH, '#1a1220');
        // hanın karanlık revakları: taş ve tuğla sıraları
        for (const x of [-40, 216]) {
          b.save(); b.beginPath(); b.moveTo(x, 240); b.lineTo(x, 70); b.arc(x + 40, 70, 40, Math.PI, 0); b.lineTo(x + 80, 240); b.closePath(); b.clip();
          rect(b, x, 20, 80, 220, '#2a2026'); for (let y = 26; y < 240; y += 12) rect(b, x, y, 80, 4, '#3a2226');
          b.restore();
        }
        // tezgâh ve dükkân
        rect(b, 40, 52, 176, 150, '#3a2618');
        rect(b, 46, 58, 164, 98, '#4a3020');
        // duvarda kalemler (keski) ve küçük çekiçler
        for (let k = 0; k < 11; k++) {
          const x = 62 + k * 13, l = 22 + (k % 3) * 4;
          if (k % 4 === 3) { A.lin(b, x, 70, x, 70 + l, '#8a5a34', 1.6); A.box(b, x - 4, 68, 8, 4, 1, '#8a8e98', A.K, 0.4); continue; }
          A.box(b, x - 1.6, 70, 3.2, l * 0.55, 1.2, '#8a5a34', A.K, 0.5);
          A.box(b, x - 0.9, 70 + l * 0.55, 1.8, l * 0.45, 0.4, '#c8ccd4', A.K, 0.4);
          if (k % 2) A.poly(b, [x - 1.2, 70 + l, x + 1.2, 70 + l, x, 72 + l], '#c8ccd4', null);
        }
        A.lin(b, 56, 68, 202, 68, '#2a1c12', 1.4);
        // desen işlenmiş gümüş tabaklar
        for (const [x, y] of [[74, 112], [110, 116], [180, 112]]) { A.ellipse(b, x, y, 8, 5, '#c8ccd4', A.K, 0.5); A.ellipse(b, x, y, 4.6, 2.6, null, '#8a8e98', 0.5); }
        // tezgâh
        rect(b, 40, 156, 176, 12, '#6a4428'); rect(b, 40, 156, 176, 2, '#8a5a34');
        rect(b, 44, 168, 168, 72, '#2e1e14');
        // zemin
        rect(b, 0, 214, VW, 26, '#2a2026');
      });
      img(g, base, 0, 0);
      // lambadan inen ışık konisi (Hopper ışığı)
      const fl = 1 + Math.sin(t * 9) * 0.03;
      A.lin(g, 128, 0, 128, 30, '#1a1210', 1);
      A.poly(g, [120, 30, 136, 30, 132, 38, 124, 38], '#c8a060', A.K, 0.5);
      g.fillStyle = `rgba(255,220,150,${0.32 * fl})`; g.beginPath(); g.moveTo(124, 38); g.lineTo(132, 38); g.lineTo(206, 214); g.lineTo(50, 214); g.closePath(); g.fill();
      glow(g, 128, 40, 30, 'rgba(255,230,170,A)', 0.9);
      // usta: oturmuş, oyuyor; sonra keski uzatıyor
      const give = seg(t, 6.2, 7.2);
      const master = { pose: 'sit', dir: 1, shirt: '#6a4a3a', pants: '#3a3030', hair: '#e8e4dc', skin: '#e0b090', glasses: true, phase: t };
      if (give > 0) master.reach = [lerp(16, 34, give), lerp(-40, -52, give)];
      else master.reach = [16 + Math.sin(t * 6) * 3, -40];
      figure(g, 96, 214, 54, master);
      // elindeki gümüş tabak, kalemin altından parlayan kırıntılar
      if (give <= 0) {
        A.ellipse(g, 116, 192, 9, 4, '#d8dce4', A.K, 0.5);
        for (let i = 0; i < 6; i++) { const k = ((t * 0.9 + i / 6) % 1); A.circle(g, 112 + i * 1.6, 192 + k * 22, 0.7, `rgba(235,240,255,${1 - k})`, null); }
      } else {
        const hx = 96 + lerp(16, 34, give) * 0.54, hy = 214 + lerp(-40, -52, give) * 0.54;
        A.box(g, hx, hy - 1, 9, 2, 0.8, '#b07a42', A.K, 0.4); A.box(g, hx + 9, hy - 0.6, 6, 1.2, 0.3, '#d8dce4', null);
        if (t > 7.2 && Math.floor(t * 6) % 2) glow(g, hx + 14, hy, 5, 'rgba(255,255,255,A)', 0.9);
      }
      // kahraman sağdan girer, durur, eli uzanır
      if (t < 4.4) { const k = clamp01((t - 1) / 3.4); hero(g, lerp(280, 168, k), 214, 54, { pose: 'walk', dir: -1, phase: t * 1.3, bag: true }); }
      else hero(g, 168, 214, 54, { pose: 'stand', dir: -1, bag: true, reach: t > 7.6 ? [26, -54] : undefined });
    },
  };

  // 5 — Yerebatan'dan sonra: karanlık suda kendi yansıması. Su durulunca yansımada atölyenin ateşi belirir.
  SCENES.ara5 = {
    dur: 11, amb: 'sarnic',
    cues: [[6.2, 'forge'], [7.6, 'forge']],
    draw(g, t) {
      const base = layer('ara5', VW, VH, (b) => {
        rect(b, 0, 0, VW, VH, '#0c1418');
        for (let row = 0; row < 3; row++) {
          const sc = [0.45, 0.65, 0.9][row], col = ['#16242a', '#1e2e30', '#2a3a36'][row], step = [34, 52, 84][row];
          for (let x = (row * 13) % step; x < VW + step; x += step) K.column(b, x, 150, sc, col, A.shade(col, 0.25), row === 1 && x > 150 && x < 200);
          b.strokeStyle = col; b.lineWidth = 3 * sc; for (let x = (row * 13) % step; x < VW + step; x += step) { b.beginPath(); b.arc(x + step / 2, 150 - 150 * sc, step / 2, Math.PI, 0); b.stroke(); }
        }
        for (const x of [40, 120, 200]) glow(b, x, 146, 40, 'rgba(255,140,60,A)', 0.3);
        // taş geçit
        rect(b, 0, 146, 110, 10, '#3a3430'); rect(b, 0, 146, 110, 1.6, '#5a524a');
      });
      img(g, base, 0, 0);
      // su
      g.fillStyle = grad(g, 0, 156, 0, VH, [[0, '#0e3a40'], [1, '#061a1e']]); g.fillRect(0, 156, VW, VH - 156);
      g.fillStyle = 'rgba(255,150,70,0.15)'; for (const x of [40, 120, 200]) g.fillRect(x - 4, 158, 8, 60);
      // ateşin yansıması belirir
      const fire = seg(t, 4.6, 7);
      const ripple = t > 2 && t < 5 ? (5 - t) / 3 : 0;
      // yansıma: kahramanın ters görüntüsü, dalgayla bozulur
      const rx = 86, ry = 156;
      g.save(); g.beginPath(); g.rect(0, 156, VW, 84); g.clip();
      if (fire > 0) {
        glow(g, rx + 22, ry + 30, 64, 'rgba(255,140,50,A)', 0.6 * fire);
        // suda, ters: atölyede örsün başındaki kendisi
        g.save(); g.globalAlpha = fire; g.translate(0, ry * 2); g.scale(1, -1);
        A.poly(g, [rx + 4, ry - 18, rx + 30, ry - 18, rx + 34, ry - 21, rx + 34, ry - 15, rx + 27, ry - 14, rx + 26, ry - 8, rx + 10, ry - 8, rx + 9, ry - 14, rx + 4, ry - 15], '#2a1810', null);
        rect(g, rx + 12, ry - 8, 12, 8, '#2a1810');
        figure(g, rx + 46, ry, 46, Object.assign({}, HERO, { pose: 'stand', dir: -1, reach: [16, -66 + Math.abs(Math.sin(t * 4.5)) * 22] }));
        sparks(g, rx + 26, ry - 20, t, 0.7, 10, 3);
        g.restore();
      }
      g.save(); g.globalAlpha = 0.55 * (1 - fire * 0.7);
      for (let y = 0; y < 60; y += 2) {
        const dx = Math.sin(y * 0.5 + t * 6) * ripple * 4;
        g.save(); g.beginPath(); g.rect(0, ry + y, VW, 2); g.clip(); g.translate(dx, ry * 2); g.scale(1, -1);
        hero(g, rx, ry, 44, { pose: 'kneel', dir: 1 });
        g.restore();
      }
      g.restore();
      // halkalar
      for (let i = 0; i < 3; i++) { const k = ((t - 2 + i * 0.6) % 3) / 3; if (t < 2 || t > 6) continue; g.strokeStyle = `rgba(200,240,240,${0.5 * (1 - k)})`; g.lineWidth = 0.6; g.beginPath(); g.ellipse(rx + 23, 158, 4 + k * 40, 1 + k * 6, 0, 0, TAU); g.stroke(); }
      g.restore();
      // tavandan damlalar
      for (let i = 0; i < 3; i++) { const k = ((t * 0.7 + i * 0.37) % 1); A.circle(g, 60 + i * 70, 20 + k * 136, 0.8, 'rgba(180,230,230,0.7)', null); }
      // kahraman kenarda diz çökmüş, eli suda
      hero(g, rx, 156, 44, { pose: 'kneel', dir: 1 });
      if (fire > 0) glow(g, rx + 12, 130, 30, 'rgba(255,160,80,A)', 0.35 * fire);
    },
  };

  // plazanın giriş kartı: mavi başlıkta cam kule, fotoğrafta kahramanın kendisi, altta yeşil şerit (kapı artık açık)
  function badge(g, x, y) {
    const L = x - 10, T = y - 12;
    // boyun askısı
    g.strokeStyle = '#2c5f94'; g.lineWidth = 1.6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - 2.4, T + 1.6); g.lineTo(x - 9, T - 16); g.moveTo(x + 2.4, T + 1.6); g.lineTo(x + 9, T - 16); g.stroke();
    A.box(g, x - 2.6, T - 1.6, 5.2, 3.6, 0.8, '#b8bec8', A.K, 0.4);
    A.box(g, L, T, 20, 24, 2, '#ffffff', A.K, 0.6);
    g.save(); A.rr(g, L, T, 20, 24, 2); g.clip();
    rect(g, L, T + 3.6, 20, 5.4, '#3a7ab8');
    rect(g, L + 2.6, T + 4.4, 4.4, 3.8, '#9ad8ff');
    g.strokeStyle = '#3a7ab8'; g.lineWidth = 0.35; g.beginPath();
    for (const k of [1.1, 2.2, 3.3]) { g.moveTo(L + 2.6 + k, T + 4.4); g.lineTo(L + 2.6 + k, T + 8.2); }
    g.moveTo(L + 2.6, T + 6.3); g.lineTo(L + 7, T + 6.3); g.stroke();
    rect(g, L + 9, T + 5.6, 8, 1, 'rgba(255,255,255,0.75)');
    // fotoğraf: kendisi (kahverengi saç, gözlük, turkuaz kapüşon)
    rect(g, L + 2.4, T + 10.4, 7.4, 8.4, '#cfe3f5');
    A.ellipse(g, L + 6.1, T + 18.8, 3.6, 2.4, HERO.shirt, null);
    A.circle(g, L + 6.1, T + 14.4, 2.4, HERO.skin, null);
    A.ellipse(g, L + 5.6, T + 13.1, 2.6, 1.5, HERO.hair, null);
    A.circle(g, L + 7.2, T + 14.6, 0.75, 'rgba(210,236,255,0.6)', A.K, 0.3);
    // ad çizgileri (yazısız)
    rect(g, L + 11.4, T + 11.4, 6.4, 1.2, '#7d8490'); rect(g, L + 11.4, T + 14.2, 5, 1, '#c8ccd4'); rect(g, L + 11.4, T + 16.6, 6, 1, '#c8ccd4');
    rect(g, L, T + 20.4, 20, 3.6, '#3fbf6a');
    g.restore();
    A.box(g, x - 3, T + 1.1, 6, 1.6, 0.8, '#c8ccd4', null);
    A.rr(g, L, T, 20, 24, 2); A.fs(g, null, A.K, 0.6);
  }
  // laptop ekranının büyütülmüş hâli: zarf açılır, içinden giriş kartı yükselir. k: balonun açıklığı (kapanırken laptopa döner)
  function mailBubble(g, t, k, kOpen, kCard) {
    const cx = lerp(125, 102, k), cy = lerp(168, 112, k);
    if (k > 0.96) for (let i = 0; i < 3; i++) { const q = (i + 1) / 4; A.circle(g, lerp(cx + 8, 124, q), lerp(cy + 27, 164, q), 1.9 - i * 0.35, '#e9f1fa', A.K, 0.5); }
    g.save(); g.translate(cx, cy); g.scale(k, k);
    glow(g, 0, 0, 44, 'rgba(160,220,255,A)', 0.22);
    A.box(g, -33, -25, 66, 50, 5, '#2a2e38', A.K, 0.8);
    A.box(g, -29, -21, 58, 42, 2.4, '#e9f1fa', null);
    A.box(g, -29, -21, 58, 4.6, 2.4, '#3a7ab8', null); rect(g, -29, -18.8, 58, 2.4, '#3a7ab8');
    for (const x of [-26, -23, -20]) A.circle(g, x, -18.7, 0.8, 'rgba(255,255,255,0.7)', null);
    g.save(); A.rr(g, -29, -21, 58, 42, 2.4); g.clip();
    const ey = 6, open = kOpen > 0.5;
    // açılmış kapak kartın arkasında kalır
    if (open) A.poly(g, [-14, ey, 14, ey, 0, ey - lerp(0, 10, (kOpen - 0.5) * 2)], '#f2ead2', A.K, 0.6);
    if (kCard > 0) {
      glow(g, 0, lerp(ey + 10, -5, kCard), 22, 'rgba(120,230,150,A)', 0.35 * kCard * (0.75 + 0.25 * Math.sin(t * 5)));
      badge(g, 0, lerp(ey + 10, -5, ease(kCard)));
    }
    // zarfın gövdesi (kartın alt ucu içinde kalır)
    A.box(g, -14, ey, 28, 15, 1.4, '#fffbe8', A.K, 0.6);
    A.lin(g, -13.4, ey + 14.4, -2, ey + 6, '#d8ccb0', 0.5); A.lin(g, 13.4, ey + 14.4, 2, ey + 6, '#d8ccb0', 0.5);
    if (!open) A.poly(g, [-14, ey, 14, ey, 0, ey + lerp(10, 0, kOpen * 2)], '#f2ead2', A.K, 0.6);
    g.restore();
    g.restore();
  }

  // Köprüden sonra: gece otobüsü Anadolu yakasına geçiyor. Kahraman geriye dönük oturmuş, laptopta yazıyor.
  // Üsküdar'da yolladığı zarflardan biri geri döner: plazanın giriş kartı, üstünde kendi fotoğrafı (Maslak'taki kapı artık açık).
  // Karta bakar; sonra camdan Anadolu yakasının ışıklarına, tepede yanıp sönen Çamlıca'ya bakar. Laptopu kapatır,
  // çantasını alıp ayağa kalkar, yüzünü gidilen yöne çevirir ve durak düğmesine basar: kendi yakasında inecek.
  SCENES.ara7 = {
    dur: 14, amb: 'kopru',
    cues: [[0.5, 'keys'], [1.8, 'keys'], [3.35, 'ding'], [9.1, 'kapak'], [10.2, 'durak']],
    draw(g, t) {
      // otobüs sonda durağa yaklaşıp yavaşlar: manzara alınan yol (s) ile kayar
      const slow = Math.max(0, t - 11.5), s = t - 0.16 * slow * slow, sp = 1 - 0.32 * slow;
      const shake = (Math.sin(t * 31) * 0.3 + Math.sin(t * 7) * 0.4) * sp;
      // kamera yavaşça kahramana yaklaşır
      const z = lerp(1, 1.08, seg(t, 2.5, 13.5)), fx = 140, fy = 150;
      g.save(); g.translate(fx, fy); g.scale(z, z); g.translate(-fx, -fy);
      // dışarısı: gece, köprü halatları akıp gider, karşı kıyının ışıkları
      g.fillStyle = grad(g, 0, 0, 0, 130, [[0, '#0c1236'], [1, '#2a2a5e']]); g.fillRect(0, 0, VW, 130);
      const r = A.rng(5);
      for (let i = 0; i < 90; i++) { const x = (r() * 400 - s * 6) % 400, y = 88 + r() * 30; rect(g, (x + 400) % 400 - 40, y, 1, 1, r() < 0.5 ? '#ffd27a' : '#bfe0ff'); }
      g.fillStyle = '#121638'; g.beginPath(); g.moveTo(0, 100); g.quadraticCurveTo(128, 80, 256, 96); g.lineTo(256, 130); g.lineTo(0, 130); g.closePath(); g.fill();
      // köprü biter: halatlar silinir, yakındaki mahallenin ışıkları ve tepede Çamlıca Kulesi belirir
      const br = 1 - seg(t, 6, 7.6), near = seg(t, 6.4, 8.4);
      const tx = 214 - (s - 6) * 5;
      if (near > 0) {
        g.globalAlpha = near; SC.pen(null);
        K.camlicaTower(g, tx, 98, 0.2, { wall: '#2e3062', wallD: '#262856', glass: '#3c3e7a', band: '#5a5c98' });
        if (Math.floor(t * 1.6) % 2) { glow(g, tx, 98 - 0.2 * 172, 6, 'rgba(255,90,70,A)', 0.8); A.circle(g, tx, 98 - 0.2 * 172, 1.1, '#ff4a3a', null); }
        g.globalAlpha = 1;
      }
      if (br > 0) {
        g.globalAlpha = br;
        g.strokeStyle = 'rgba(200,210,255,0.5)'; g.lineWidth = 1;
        for (let i = 0; i < 8; i++) { const x = ((i * 40 - s * 160) % 320 + 320) % 320 - 30; g.beginPath(); g.moveTo(x, 20); g.lineTo(x + 30, 130); g.stroke(); }
        g.strokeStyle = 'rgba(220,230,255,0.8)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, 30); g.quadraticCurveTo(128, 54, 256, 24); g.stroke();
        g.globalAlpha = 1;
      }
      if (near > 0) {
        g.globalAlpha = near;
        const sc = s * 30, j0 = Math.floor((sc - 20) / 16), hof = (j) => 103 + (((j * 7919) % 5) + 5) % 5 * 3;
        g.fillStyle = '#0e1230'; g.beginPath(); g.moveTo(-20, 130);
        for (let j = j0; j < j0 + 20; j++) { const x = j * 16 - sc; g.lineTo(x, hof(j)); g.lineTo(x + 15, hof(j)); }
        g.lineTo(VW + 20, 130); g.closePath(); g.fill();
        for (let j = j0; j < j0 + 20; j++) {
          const x = j * 16 - sc;
          for (let w = 0; w < 3; w++) if ((((j * 31 + w * 17) % 7) + 7) % 7 < 3) rect(g, x + 2 + w * 4.6, hof(j) + 4 + (w % 2) * 5, 2, 2, '#ffd27a');
        }
        g.globalAlpha = 1;
      }
      for (let i = 0; i < 12; i++) { const x = ((i * 26 - s * 160) % 312 + 312) % 312 - 28; rect(g, x, 118, 6, 1.6, '#ffe9a0'); }
      g.save(); g.translate(0, shake);
      // otobüsün içi: soğuk floresan ışığı
      rect(g, 0, 0, VW, 14, '#c8d4d0'); rect(g, 0, 12, VW, 3, '#e8f4f0');
      glow(g, 128, 8, 120, 'rgba(230,255,245,A)', 0.25);
      for (const x of [0, 82, 168]) rect(g, x, 14, 6, 120, '#7a8a88');
      rect(g, 0, 130, VW, 110, '#6a7c7a');
      g.fillStyle = grad(g, 0, 130, 0, 240, [[0, 'rgba(230,255,240,0.25)'], [1, 'rgba(0,0,0,0.25)']]); g.fillRect(0, 130, VW, 110);
      A.lin(g, 0, 40, VW, 40, '#9aa8a6', 1.6);
      // tutunma direği ve durak düğmesi (basılınca yanar)
      A.box(g, 158.6, 14, 2.8, 176, 1.2, '#d8c24a', A.K, 0.5);
      const pressed = t >= 10.2;
      A.box(g, 156.4, 142.6, 7.2, 7.4, 1.8, '#ece6d4', A.K, 0.5);
      if (pressed) glow(g, 160, 146.3, 9, 'rgba(255,80,60,A)', 0.55 + 0.25 * Math.sin(t * 9));
      A.circle(g, 160, 146.3, 2.1, pressed ? '#ff5a46' : '#a82a2a', A.K, 0.4);
      // koltuklar ve yolcular
      for (const [x, sh, hc] of [[40, '#5a4a3a', '#3a2a20'], [214, '#2a3a5a', '#1a1a1a']]) {
        A.box(g, x - 22, 136, 8, 42, 3, '#2a5a8a'); A.box(g, x - 22, 172, 30, 7, 3, '#2a5a8a');
        figure(g, x - 14, 188, 46, { pose: 'sit', dir: 1, shirt: sh, hair: hc });
      }
      A.box(g, 134, 136, 8, 42, 3, '#2a5a8a'); A.box(g, 112, 172, 30, 7, 3, '#2a5a8a');
      if (t < 9.5) {
        // oturuyor, geriye (geldiği yakaya) dönük; dizinde laptop
        A.box(g, 100, 164, 10, 14, 3, '#3a3440');
        // ekrandan başını kaldırıp cama, Çamlıca'nın ışığına döner
        hero(g, 134, 188, 46, { pose: 'sit', dir: -1, bag: false, typing: t < 3.2, phase: t, away: t > 7 && t < 8.7 });
        const lid = seg(t, 8.6, 9.3);
        A.box(g, 121, 174, 11, 2, 0.6, '#c9ccd4', A.K, 0.5);
        const ly = lerp(166, 172.6, lid), lx = lerp(-2, 0, lid);
        A.poly(g, [130, 174, 121, 174, 121 + lx, ly, 130 + lx, ly], lid < 1 ? '#2a2e38' : '#9aa0aa', A.K, 0.5);
        if (lid < 1) glow(g, 126, 167, 13, 'rgba(160,220,255,A)', 0.45 * (1 - lid));
      } else {
        // ayakta, çantası sırtında, yüzü gidilen yöne: direğe uzanıp düğmeye basar, sonra direğe tutunur
        const press = seg(t, 9.8, 10.2) * (1 - seg(t, 10.5, 10.9));
        hero(g, 148, 189, 46, { pose: 'stand', dir: 1, bag: true, reach: [26, lerp(-72, -91, press)] });
      }
      g.restore();
      // Üsküdar'da yolladığı zarflardan biri geri döner, kanat çırparak laptopa iner
      const ke = (t - 1.9) / 1.4;
      if (ke > 0 && ke < 1) {
        const es = ke < 0.75 ? lerp(0.6, 1.5, ke / 0.75) : lerp(1.5, 0.5, (ke - 0.75) / 0.25);
        envelope(g, lerp(-12, 124, ease(ke)), lerp(58, 166, ke * ke) - Math.sin(ke * Math.PI) * 18, es, Math.sin(t * 16));
      }
      // ekranda: zarf açılır, giriş kartı çıkar; laptop kapanınca balon ekrana geri döner
      const pop = seg(t, 3.3, 3.6) * (1 - seg(t, 8.6, 9.05));
      if (pop > 0.01) mailBubble(g, t, pop, seg(t, 3.7, 4.3), seg(t, 4.3, 5.2));
      g.restore();
    },
  };

  // Şişli'den sonra — akşam: kahraman boşalmış ofiste tek başına. Cam cephenin ardında karşı plaza; pencerelerinde
  // hâlâ çalışanlar var, ışıklar yanıp söner. Biri başını kaldırıp kahramana el sallar; kahraman da sallar.
  SCENES.ara8 = {
    dur: 11.5, amb: 'mesai',
    draw(g, t) {
      const base = layer('ara8' + dayKey(), VW, VH, (b) => {
        b.fillStyle = grad(b, 0, 0, 0, 120, [[0, '#1a2050'], [0.6, '#6a5a8a'], [1, '#e8907a']]); b.fillRect(0, 0, VW, 120);
        moonIn(b, 'aksamustu', 222, 110, 14, 9);
        // karşı plaza: cam cephe, akşamın son ışığı
        rect(b, 18, 22, 222, 218, '#2a3456');
        b.fillStyle = grad(b, 18, 22, 240, 22, [[0, 'rgba(255,170,120,0.25)'], [0.5, 'rgba(255,170,120,0)'], [1, 'rgba(90,120,200,0.15)']]); b.fillRect(18, 22, 222, 218);
        rect(b, 14, 18, 230, 6, '#1e2644');
      });
      img(g, base, 0, 0);
      // karşı plazanın pencereleri: çoğunda masasında biri; ışıklar yanıp söner
      const r = A.rng(31);
      for (let row = 0; row < 4; row++) for (let col = 0; col < 5; col++) {
        const x = 30 + col * 42, y = 34 + row * 40, on = (r() < 0.7) && !(Math.floor(t / 2.7 + row * 3 + col) % 7 === 0);
        const w = 32, h = 28;
        rect(g, x - 2, y - 2, w + 4, h + 4, '#1e2644');
        rect(g, x, y, w, h, on ? '#f2e2b0' : '#18203c');
        if (on) {
          glow(g, x + 15, y + 14, 22, 'rgba(255,236,190,A)', 0.2);
          const special = row === 1 && col === 3;
          rect(g, x + 2, y + 19, 18, 1.6, '#6a6a72');
          figure(g, x + 22, y + h, 20, { pose: special && t > 5.4 && t < 8.6 ? 'stand' : 'desk', dir: -1, shirt: ['#5a6a8a', '#8a4a3a', '#6a7a5a', '#d8c8a0'][(row + col) % 4], hair: ['#2a2020', '#6a4a2a', '#1a1a1a'][(row * 2 + col) % 3], wave: special && t > 5.4 && t < 8.6, phase: t, typing: true });
          rect(g, x + 5, y + 14, 6, 5, '#2a2e38'); rect(g, x + 6, y + 15, 4, 3, '#9ad0f0');
        }
      }
      // bu taraf: boşalmış ofis; cam cephenin dikmeleri, masa, kapanmış ekranlar, tek masa lambası
      const fl = layer('ara8on', VW, VH, (b) => {
        for (const x of [0, 128, 252]) rect(b, x, 0, 6, 196, '#3a4050');
        rect(b, 0, 0, VW, 10, '#4a5060'); rect(b, 0, 194, VW, 4, '#4a5060');
        rect(b, 0, 198, VW, 42, '#5a5a66'); rect(b, 0, 198, VW, 1.4, '#7a7a86');
        // masa
        rect(b, 20, 186, 150, 5, '#c8ccd4'); for (const x of [24, 164]) A.lin(b, x, 191, x, 230, '#8a909c', 2);
        for (const x of [120, 146]) { A.box(b, x, 166, 18, 14, 1, '#141822', A.K, 0.5); rect(b, x + 7, 180, 3, 6, '#5a6070'); }
        // boş sandalyeler, geri itilmiş
        for (const x of [190, 226]) { A.box(b, x, 196, 16, 4, 1.4, '#2a2e38', A.K, 0.5); A.box(b, x + 12, 178, 4, 18, 1.4, '#2a2e38', A.K, 0.5); A.lin(b, x + 8, 200, x + 8, 222, '#2a2e38', 1.4); }
      });
      // camda odanın soluk yansıması
      g.fillStyle = 'rgba(200,220,255,0.06)'; g.fillRect(0, 0, VW, 196);
      img(g, fl, 0, 0);
      // masa lambası
      A.lin(g, 40, 186, 36, 172, '#2a2e38', 1.2); A.lin(g, 36, 172, 44, 166, '#2a2e38', 1.2); A.poly(g, [42, 162, 52, 165, 50, 170, 40, 167], '#2a3a5a', A.K, 0.4);
      glow(g, 50, 178, 34, 'rgba(255,214,140,A)', 0.55);
      // kahraman laptopunun başında; el sallanınca o da sallar
      const waving = t > 7.4 && t < 9.6;
      A.box(g, 52, 206, 22, 4, 1.4, '#2a2e38', A.K, 0.5); A.lin(g, 63, 210, 63, 230, '#2a2e38', 1.6);
      hero(g, 62, 208, 46, { pose: 'desk', dir: 1, wave: waving, typing: !waving, phase: t });
      A.box(g, 80, 184, 12, 2, 0.6, '#c9ccd4', A.K, 0.5); A.poly(g, [82, 184, 92, 184, 94, 175, 84, 175], '#2a2e38', A.K, 0.5);
      glow(g, 86, 180, 14, 'rgba(160,220,255,A)', 0.5);
    },
  };

  // Ataşehir'den sonra — gece, finans merkezinin meydanı: fidye yazılımı kuleleri karartmış, dev LED cephede kırmızı kilit.
  // Kahraman alçak duvarda laptopuyla son satırları yazar; kilit açılır, kuleler kat kat yeniden yanar. Cephede bir an
  // kendi atölyesinin işareti (örs ve çekiç) parlar, sonra şehrin ekranı geri gelir. Gece bekçisi iki ince belli çayla gelir,
  // birini ona uzatır, yan yana otururlar. Uzakta tepede Çamlıca Kulesi'nin ışığı yanıp söner: sıradaki yer.
  SCENES.atasehir = {
    dur: 13.5, amb: 'finans', cues: [[0.6, 'keys'], [1.7, 'keys'], [2.9, 'ding'], [5.8, 'ding'], [9.6, 'kapak']],
    draw(g, t) {
      const TW = [[6, 60, 34], [86, 166, 16], [174, 214, 64]];   // kuleler: sol, orta (LED cepheli), sağ
      const base = layer('atasehir' + dayKey(), VW, VH, (b) => {
        b.fillStyle = grad(b, 0, 0, 0, 200, [[0, '#04081e'], [0.7, '#141a48'], [1, '#3a2a5a']]); b.fillRect(0, 0, VW, 200);
        const r = A.rng(14); for (let i = 0; i < 40; i++) A.circle(b, r() * VW, r() * 70, 0.3 + r() * 0.5, `rgba(255,255,240,${0.3 + r() * 0.6})`, null);
        moonIn(b, 'gece', 244, 160, 14, 8);
        // uzakta tepede Çamlıca Kulesi
        b.fillStyle = '#0e1238'; b.beginPath(); b.moveTo(190, 200); b.quadraticCurveTo(236, 158, 262, 170); b.lineTo(262, 200); b.closePath(); b.fill();
        K.camlicaTower(b, 238, 170, 0.36, { wall: '#5a6088', wallD: '#4a5078', glass: '#2a3a78', band: '#6a8ac8', lit: '#9ad8ff' });
        // kuleler: karanlık cam
        for (const [x0, x1, top] of TW) {
          b.fillStyle = grad(b, x0, 0, x1, 0, [[0, '#1c2a4a'], [0.5, '#141e38'], [1, '#0c1428']]); b.fillRect(x0, top, x1 - x0, 200 - top);
          b.fillStyle = 'rgba(255,255,255,0.05)'; for (let y = top + 4; y < 200; y += 7) b.fillRect(x0, y, x1 - x0, 0.6);
          A.box(b, (x0 + x1) / 2 - 3, top - 5, 6, 5, 0.8, '#1c2a4a', null);
        }
        // LED cephenin çerçevesi
        A.box(b, 96, 38, 60, 46, 2, '#06080e', '#2a3448', 0.8);
        // meydan ve alçak duvar
        b.fillStyle = grad(b, 0, 196, 0, 240, [[0, '#2a3048'], [1, '#141828']]); b.fillRect(0, 196, VW, 44);
        for (let x = 0; x < VW; x += 22) A.lin(b, x, 196, x - 30, 240, 'rgba(255,255,255,0.05)', 0.6);
        A.box(b, 20, 206, 120, 12, 2, '#5a6278', '#2a3048', 0.8); A.lin(b, 22, 207, 138, 207, 'rgba(255,255,255,0.3)', 0.8);
      });
      img(g, base, 0, 0);
      // kuleler kat kat yeniden yanar (aşağıdan yukarı, kule kule)
      for (let k = 0; k < TW.length; k++) {
        const [x0, x1, top] = TW[k], r = A.rng(70 + k);
        for (let y = 196 - 7, f = 0; y > top + 2; y -= 7, f++) {
          const on = t > 3.1 + k * 0.45 + f * 0.07;
          for (let x = x0 + 3; x < x1 - 4; x += 6) {
            const lit = r() < 0.62;
            if (on && lit) g.fillStyle = r() < 0.85 ? '#ffd98a' : '#9ad8ff'; else { r(); g.fillStyle = 'rgba(40,52,90,0.6)'; }
            if (k === 1 && y > 36 && y < 86 && x > 94 && x < 158) continue;
            g.fillRect(x, y + 1, 3.4, 3.6);
          }
        }
        // ikaz lambası hep yanar
        A.circle(g, (x0 + x1) / 2, top - 6, 1.1, Math.floor(t * 1.6 + k) % 2 ? '#ff4a4a' : '#7a1a1a', null);
      }
      // LED cephe: kırmızı kilit → açılır → atölyenin işareti → şehrin ekranı
      g.save(); g.beginPath(); g.rect(98, 40, 56, 42); g.clip();
      const cx = 126, cy = 64;
      if (t < 4.6) {
        g.fillStyle = '#2a060a'; g.fillRect(98, 40, 56, 42);
        const open = seg(t, 2.6, 3.4), fade = 1 - seg(t, 3.8, 4.6);
        g.globalAlpha = fade;
        g.strokeStyle = open > 0.5 ? '#7cff6a' : '#ff4a4a'; g.lineWidth = 3.4;
        g.beginPath(); g.arc(cx + open * 6, cy - 6 - open * 6, 8, Math.PI, 0); g.stroke();
        A.box(g, cx - 12, cy - 6, 24, 18, 3, open > 0.5 ? '#3fae2c' : '#e8443a', null);
        A.circle(g, cx, cy + 1, 2.4, '#1a0a0a', null);
        g.globalAlpha = 1;
      } else if (t < 8.4) {
        // kendi işareti: örs ve çekiç, kıvılcımlar
        const a = seg(t, 4.6, 5.2) * (1 - seg(t, 7.8, 8.4));
        g.fillStyle = '#0a1420'; g.fillRect(98, 40, 56, 42);
        g.globalAlpha = a;
        glow(g, cx, cy, 30, 'rgba(255,170,80,A)', 0.5);
        A.poly(g, [cx - 16, cy + 1, cx + 14, cy + 1, cx + 18, cy - 3, cx + 18, cy + 5, cx + 8, cy + 7, cx + 6, cy + 13, cx - 6, cy + 13, cx - 8, cy + 7, cx - 16, cy + 5], '#c8ccd4', null);
        A.lin(g, cx - 4, cy - 6, cx + 10, cy - 18, '#a87a4a', 2.4);
        A.box(g, cx + 5, cy - 22, 12, 6, 1.2, '#c8ccd4', null);
        sparks(g, cx + 4, cy - 2, t, 1.1, 8, 3);
        g.globalAlpha = 1;
      } else {
        // şehrin ekranı: dalgalanan ışık şeritleri
        const a = seg(t, 8.4, 9.2);
        g.fillStyle = '#081a2a'; g.fillRect(98, 40, 56, 42);
        g.globalAlpha = a;
        for (let k = 0; k < 4; k++) { g.strokeStyle = ['#3ae0ff', '#7cff6a', '#ffd98a', '#c88aec'][k]; g.lineWidth = 1.6; g.beginPath(); for (let x = 98; x <= 154; x += 3) g.lineTo(x, 50 + k * 8 + Math.sin(x * 0.12 + t * 2 + k) * 3); g.stroke(); }
        g.globalAlpha = 1;
      }
      g.restore();
      // Çamlıca'nın ışığı: sonda yanıp söner
      const cl = 0.4 + 0.6 * seg(t, 10.6, 11.4) * (0.6 + 0.4 * Math.sin(t * 5));
      glow(g, 238, 117, 12, 'rgba(160,230,255,A)', cl * 0.8);
      A.circle(g, 238, 117, 1.4, '#e8f8ff', null);
      // kahraman: duvarda laptopla; çay gelince kapağı kapatır
      const tea = t > 10.2;
      hero(g, 64, 214, 44, { pose: 'sit', dir: 1, typing: t < 9.4, phase: t });
      if (t < 9.6) {
        A.box(g, 72, 196, 12, 2, 0.6, '#c9ccd4', A.K, 0.5); A.poly(g, [74, 196, 84, 196, 86, 187, 76, 187], '#2a2e38', A.K, 0.5);
        glow(g, 78, 192, 14, 'rgba(160,220,255,A)', 0.5);
      } else A.box(g, 72, 195, 12, 3, 0.8, '#c9ccd4', A.K, 0.5);
      // gece bekçisi: lacivert üniforma, kasket; tepside iki çay
      const wk = seg(t, 7.4, 10.0), gx = lerp(290, 108, wk), sit = t > 10.2;
      const guard = { shirt: '#3a5088', shirtD: '#2a3c6a', pants: '#262e4a', hair: '#a8a8ae', skin: '#d8a888' };
      if (!sit) figure(g, gx, 214, 46, { ...guard, pose: wk > 0 && wk < 1 ? 'walk' : 'stand', dir: -1, phase: t * 1.5 });
      else figure(g, 108, 214, 46, { ...guard, pose: 'sit', dir: -1, phase: t });
      const hx = sit ? 108 - 2.8 : gx - 0.9, hy = sit ? 214 - 32.2 : 214 - 41.4;   // başın merkezi (figure: u = 0.46)
      A.box(g, hx - 4.2, hy - 5.6, 8.4, 3, 1, '#24305a', A.K, 0.4);   // kasket ve arması
      A.box(g, hx - 6.6, hy - 3.4, 4.4, 1.2, 0.5, '#1a2244', null); A.circle(g, hx, hy - 4.2, 0.7, '#f4c531', null);
      // çay bardakları
      const glass = (x, y) => {
        A.poly(g, [x - 1.8, y - 5, x + 1.8, y - 5, x + 1, y - 2.6, x + 1.8, y, x - 1.8, y, x - 1, y - 2.6], 'rgba(200,90,40,0.85)', A.K, 0.4);
        A.box(g, x - 2.6, y, 5.2, 1, 0.4, '#e8e4dc', null);
        for (let k = 0; k < 2; k++) { const ph = (t * 0.7 + k * 0.5) % 1; g.strokeStyle = `rgba(255,255,255,${0.4 * (1 - ph)})`; g.lineWidth = 0.5; g.beginPath(); g.moveTo(x, y - 6 - ph * 6); g.quadraticCurveTo(x + 1.6, y - 8 - ph * 6, x, y - 10 - ph * 6); g.stroke(); }
      };
      if (!tea) { if (wk > 0) { A.box(g, gx - 16, 214 - 29, 12, 1.4, 0.6, '#c8ccd4', null); glass(gx - 13, 214 - 29); glass(gx - 7, 214 - 29); } }
      else { glass(84, 206); glass(95, 206); }   // duvarın üstünde, ikisinin arasında
      birds(g, t, 50, 2, '#1a1a3a', 8);
    },
  };

  // ince belli çay bardağı (by: dibi), buharıyla
  function teaGlass(g, x, by, s, t, steam) {
    A.poly(g, [x - 2 * s, by, x + 2 * s, by, x + 1.2 * s, by - 5 * s, x + 2.2 * s, by - 9 * s, x - 2.2 * s, by - 9 * s, x - 1.2 * s, by - 5 * s], 'rgba(190,60,24,0.92)', A.K, 0.4);
    rect(g, x - 2.2 * s, by - 9 * s, 4.4 * s, 1 * s, 'rgba(255,255,255,0.5)');
    if (steam) {
      g.strokeStyle = `rgba(255,255,255,${0.35 * steam})`; g.lineWidth = 0.6;
      for (let k = 0; k < 2; k++) { g.beginPath(); g.moveTo(x - 0.6 + k * 1.2, by - 10 * s); g.quadraticCurveTo(x - 2 + k * 2 + Math.sin(t * 2.2 + k) * 1.6, by - 14 * s, x + Math.sin(t * 1.7 + k * 2) * 1.4, by - 18 * s); g.stroke(); }
    }
  }

  // Eyüp'ten sonra — oyunun kalbi. Gece yarısı tepede iki kişilik bir bank; aşağıda Haliç ve şehrin ışıkları.
  // Kahraman elinde iki ince belli çayla gelir, birini bankın öbür ucuna koyar, bir ucuna oturur. Rüzgâr, bir yaprak.
  // Bir süre oturur; sonra kalkar ve yürür. İkinci bardak bankta, buharı tüterek kalır. Müzik yok.
  SCENES.eyup = {
    dur: 15, amb: 'eyupTepe', cues: [[3.3, 'glass']],
    draw(g, t) {
      const base = layer('eyup' + dayKey(), VW, VH, (b) => {
        b.fillStyle = grad(b, 0, 0, 0, 150, [[0, '#04061a'], [0.7, '#10183e'], [1, '#22285a']]); b.fillRect(0, 0, VW, 150);
        const r = A.rng(81); for (let i = 0; i < 110; i++) A.circle(b, r() * VW, r() * 110, 0.3 + r() * 0.5, `rgba(255,255,240,${0.3 + r() * 0.7})`, null);
        moonIn(b, 'geceyarisi', 196, 130, 16, 9);
        // karşı kıyı: tepeler ve yanan pencereler, tepede bir kubbe ve iki ince minare (Eyüp'ün kendisi)
        b.fillStyle = '#0c1032'; b.beginPath(); b.moveTo(0, 150); b.quadraticCurveTo(70, 118, 150, 132); b.quadraticCurveTo(210, 140, 256, 122); b.lineTo(256, 160); b.lineTo(0, 160); b.closePath(); b.fill();
        for (let i = 0; i < 260; i++) { const x = r() * VW, y = 128 + Math.pow(r(), 0.7) * 30; if (y < 120 + Math.abs(x - 150) * 0.05) continue; b.fillStyle = ['#ffd27a', '#fff0c0', '#ffb070'][Math.floor(r() * 3)]; b.globalAlpha = 0.3 + r() * 0.6; b.fillRect(x, y, 0.9, 0.9); }
        b.globalAlpha = 1;
        SC.pen(null);
        K.dome(b, 60, 128, 6, { roof: '#141842', alem: '#141842' }, 0.9);
        for (const mx of [50, 70]) K.minaret(b, mx, 128, 22, 1.4, { wall: '#141842', roof: '#141842', trim: '#141842' }, 1);
        // Haliç: karanlık su, köprünün ışık çizgisi ve yansımalar
        b.fillStyle = grad(b, 0, 158, 0, 196, [[0, '#14183e'], [1, '#080a20']]); b.fillRect(0, 158, VW, 40);
        for (let x = 90; x < 230; x += 3) rect(b, x, 158, 1.6, 0.8, '#fff0c0');
        for (let i = 0; i < 70; i++) { const x = r() * VW, y = 162 + r() * 30; b.fillStyle = `rgba(255,214,140,${0.12 + r() * 0.2})`; b.fillRect(x, y, 2 + r() * 5, 0.7); }
        // tepe: çimen, iki servi
        b.fillStyle = '#060818'; b.beginPath(); b.moveTo(0, 240); b.lineTo(0, 196); b.quadraticCurveTo(128, 186, 256, 198); b.lineTo(256, 240); b.closePath(); b.fill();
        for (const [x, h] of [[18, 92], [232, 70], [246, 54]]) { b.fillStyle = '#04050f'; b.beginPath(); b.ellipse(x, 200 - h / 2, h * 0.13, h / 2, 0, 0, TAU); b.fill(); }
        // iki kişilik bank
        for (const x of [100, 166]) { A.lin(b, x, 214, x, 202, '#1a1c28', 2.2); A.lin(b, x, 202, x - 2, 182, '#1a1c28', 1.8); }
        A.box(b, 90, 199, 86, 4, 1, '#5a4030', A.K, 0.6);
        for (const y of [184, 190]) A.box(b, 92, y, 82, 3.4, 1, '#644634', A.K, 0.5);
      });
      img(g, base, 0, 0);
      // gece rüzgârı: servilerin ucu hafifçe sallanır
      const sit = t >= 3 && t < 10.6;
      // ikinci bardak: bankın öbür ucunda
      if (t >= 3.2) teaGlass(g, 160, 199, 1.1, t, 1 - seg(t, 13, 15) * 0.4);
      if (t < 3) {
        const k = clamp01(t / 2.9);
        hero(g, lerp(-24, 112, k), 214, 46, { pose: 'walk', dir: 1, phase: t * 1.2, reach: [14, -50] });
        const hx = lerp(-24, 112, k) + 5;
        teaGlass(g, hx + 2, 194, 1, t, 0.8); teaGlass(g, hx + 6, 195, 1, t, 0.8);
      } else if (sit) {
        hero(g, 108, 214, 46, { pose: 'sit', dir: 1, reach: [20, -36] });
        teaGlass(g, 117, 197, 1, t, 0.9);
      } else {
        const k = clamp01((t - 10.6) / 3.6);
        hero(g, lerp(118, 290, k), 214, 46, k <= 0.02 ? { pose: 'stand', dir: 1 } : { pose: 'walk', dir: 1, phase: t * 1.2 });
      }
      // rüzgârda bir yaprak
      if (t > 5 && t < 10) {
        const k = (t - 5) / 5, lx = lerp(-10, 270, k), ly = 150 + k * 40 + Math.sin(t * 3) * 8;
        A.ellipse(g, lx, ly, 2.2, 1, '#8a6a3a', null, 0, t * 4);
      }
    },
  };

  // Şile'den sonra — gece fener: dönen ışık denizi tarar. Kahraman kayalıkta oturmuş, denize bakar; ışık her
  // dönüşte üstünden geçer.
  SCENES.sile = {
    dur: 11, amb: 'sile',
    draw(g, t) {
      const base = layer('sile' + dayKey(), VW, VH, (b) => {
        b.fillStyle = grad(b, 0, 0, 0, 140, [[0, '#03061a'], [0.7, '#0c1236'], [1, '#1a2450']]); b.fillRect(0, 0, VW, 140);
        const r = A.rng(91); for (let i = 0; i < 160; i++) A.circle(b, r() * VW, r() * 120, 0.3 + r() * 0.5, `rgba(255,255,240,${0.3 + r() * 0.7})`, null);
        moonIn(b, 'geceyarisindanSonra', 70, 136, 16, 8);
        b.fillStyle = grad(b, 0, 140, 0, 240, [[0, '#121a40'], [1, '#04071a']]); b.fillRect(0, 140, VW, 100);
        for (let i = 0; i < 40; i++) { const y = 146 + i * 2.2, w = 4 + r() * 16; b.fillStyle = 'rgba(160,180,230,0.12)'; b.fillRect(r() * VW, y, w, 0.6); }
        // kayalık burun ve fener
        b.fillStyle = '#05060f'; b.beginPath(); b.moveTo(256, 240); b.lineTo(256, 120); b.lineTo(214, 128); b.lineTo(180, 156); b.lineTo(120, 196); b.lineTo(70, 214); b.lineTo(40, 240); b.closePath(); b.fill();
        A.poly(b, [212, 128, 230, 128, 227, 64, 215, 64], '#d8d4ca', null);
        rect(b, 214, 50, 14, 14, '#ffeeb0'); A.poly(b, [212, 50, 230, 50, 221, 40], '#1a1a22', null); rect(b, 211, 62, 20, 3, '#1a1a22');
      });
      img(g, base, 0, 0);
      // dönen ışık
      const fx = 221, fy = 57, a = t * 0.85, side = Math.cos(a), k = Math.abs(side);
      if (k > 0.06) {
        const dir = side > 0 ? 1 : -1, len = 320 * k;
        const gr = g.createLinearGradient(fx, fy, fx + dir * len, fy + 20);
        gr.addColorStop(0, `rgba(255,244,190,${0.45 * k})`); gr.addColorStop(1, 'rgba(255,244,190,0)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(fx, fy - 3); g.lineTo(fx + dir * len, fy + 4 - 30 * k); g.lineTo(fx + dir * len, fy + 40 + 30 * k); g.lineTo(fx, fy + 3); g.closePath(); g.fill();
        // ışığın denizde bıraktığı iz
        if (dir < 0) { g.fillStyle = `rgba(255,240,190,${0.18 * k})`; g.fillRect(fx - len, 150, len * 0.9, 1.4); }
      }
      glow(g, fx, fy, 26, 'rgba(255,240,170,A)', 0.8);
      // kahraman kayada oturmuş, denize (sola) bakıyor
      hero(g, 132, 196, 36, { pose: 'sit', dir: -1, bag: true });
      // ışık üstünden geçince bir an aydınlanır
      const lit = side < -0.6 ? (Math.abs(side) - 0.6) * 1.4 : 0;
      if (lit > 0) glow(g, 128, 178, 24, 'rgba(255,240,190,A)', lit * 0.5);
    },
  };

  // Sanayi'den sonra — şafak öncesi: sanayide açık kalan tek çay ocağı. Floresan ışık, camın ardında iki kişi:
  // çaycı ve kahraman. Komşu dükkânların kepenkleri teker teker iner; çay ocağınınki yarıda kalır, ışık kaldırıma düşer.
  SCENES.sanayi = {
    dur: 11, amb: 'kadosan', cues: [[3, 'shutter'], [4.6, 'shutter'], [6.2, 'shutter'], [8.4, 'shutter']],
    draw(g, t) {
      const dawn = seg(t, 0, 11);
      g.fillStyle = grad(g, 0, 0, 0, 90, [[0, A.shade('#0c1236', dawn * 0.3)], [1, A.shade('#3a3a6a', dawn * 0.4)]]); g.fillRect(0, 0, VW, 90);
      const base = layer('sanayiS', VW, VH, (b) => {
        // testere dişi çatılar
        for (let x = 0; x < VW; x += 32) A.poly(b, [x, 90, x + 32, 90, x + 32, 74], '#1a1830', null);
        rect(b, 0, 90, VW, 124, '#2a2838'); rect(b, 0, 88, VW, 3, '#1a1828');
        // kaldırım
        rect(b, 0, 214, VW, 26, '#3a3a46'); rect(b, 0, 214, VW, 1.4, '#5a5a66');
      });
      img(g, base, 0, 0);
      // komşu dükkânlar: kepenk teker teker iner
      const shopsX = [6, 70, 196];
      shopsX.forEach((x, i) => {
        const down = seg(t, 2.6 + i * 1.6, 3.6 + i * 1.6);
        rect(g, x, 120, 54, 94, '#1a1622');
        g.fillStyle = `rgba(255,170,90,${0.35 * (1 - down)})`; g.fillRect(x, 120, 54, 94);
        const h = lerp(40, 94, down);
        rect(g, x, 120, 54, h, '#5a5e6a'); for (let y = 122; y < 120 + h; y += 3) rect(g, x, y, 54, 0.8, '#454852');
      });
      // çay ocağı: floresan, cam, içeride iki kişi
      const cx = 132;
      rect(g, cx, 116, 58, 98, '#141a1e');
      glow(g, cx + 29, 150, 60, 'rgba(225,245,255,A)', 0.35);
      rect(g, cx + 3, 124, 52, 60, '#d8ecee');
      rect(g, cx + 3, 124, 52, 60, 'rgba(160,210,200,0.25)');
      rect(g, cx + 10, 126, 38, 2, '#ffffff');
      // tezgâh, çaydanlık
      rect(g, cx + 3, 164, 52, 20, '#5a4a3a'); A.box(g, cx + 8, 154, 9, 10, 2.4, '#c8ccd4', A.K, 0.4);
      figure(g, cx + 14, 168, 30, { pose: 'stand', dir: 1, shirt: '#e8e4dc', pants: '#3a3a44', hair: '#8a8a8a', skin: '#d8a880' });
      hero(g, cx + 42, 176, 30, { pose: 'sit', dir: -1, reach: [16, -40] });
      teaGlass(g, cx + 33, 165, 0.8, t, 0.8); teaGlass(g, cx + 24, 165, 0.8, t, 0.8);
      rect(g, cx + 28, 124, 1.4, 60, '#3a4048');
      // en son çay ocağının kepengi yarıya kadar iner ve orada kalır; ışık altından kaldırıma düşer
      const half = seg(t, 8.2, 9.6), sh = lerp(0, 50, half);
      if (sh > 0) { rect(g, cx, 116, 58, sh, '#6a6e7a'); for (let y = 118; y < 116 + sh; y += 3) rect(g, cx, y, 58, 0.8, '#50545e'); }
      g.fillStyle = 'rgba(225,245,255,0.18)'; g.beginPath(); g.moveTo(cx, 214); g.lineTo(cx + 58, 214); g.lineTo(cx + 80, 240); g.lineTo(cx - 22, 240); g.closePath(); g.fill();
      // dolaşık kablolar
      g.strokeStyle = 'rgba(10,10,20,0.8)'; g.lineWidth = 0.6;
      for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(-10, 60 + k * 5); g.quadraticCurveTo(128, 90 + k * 7, 266, 58 + k * 6); g.stroke(); }
    },
  };

  // Çamlıca'dan sonra — gece tepede: kahraman doğuya, Ümraniye'nin ışıklarına bakar. Işıkların arasında bir atölyenin
  // ocağı turuncu yanıp söner; kahraman sırt çantasını düzeltir ve o ışığa doğru yürür.
  SCENES.eve = {
    dur: 10, amb: 'camlica', cues: [[4.2, 'forge'], [6.4, 'forge']],
    draw(g, t) {
      const base = layer('eve' + dayKey(), VW, VH, (b) => {
        b.fillStyle = grad(b, 0, 0, 0, 150, [[0, '#04061a'], [0.7, '#141a4a'], [1, '#2a2a6a']]); b.fillRect(0, 0, VW, 150);
        const r = A.rng(12); for (let i = 0; i < 70; i++) A.circle(b, r() * VW, r() * 110, 0.3 + r() * 0.5, `rgba(255,255,240,${0.3 + r() * 0.7})`, null);
        moonIn(b, 'safakOncesi', 200, 130, 14, 9);
        // vadide Ümraniye: apartman ışıkları
        b.fillStyle = '#0c1036'; b.fillRect(0, 130, VW, 110);
        for (let i = 0; i < 500; i++) { const x = r() * VW, y = 134 + Math.pow(r(), 0.8) * 70; b.fillStyle = ['#ffd27a', '#fff0c0', '#ffb070'][Math.floor(r() * 3)]; b.globalAlpha = 0.35 + r() * 0.6; b.fillRect(x, y, 0.9, 0.9); }
        b.globalAlpha = 1;
        // tepe, çamlar, kule
        b.fillStyle = '#080a24'; b.beginPath(); b.moveTo(0, 240); b.lineTo(0, 168); b.quadraticCurveTo(70, 150, 140, 182); b.quadraticCurveTo(200, 210, 256, 214); b.lineTo(256, 240); b.closePath(); b.fill();
        for (let x = 4; x < 120; x += 9) { b.fillStyle = '#060818'; b.beginPath(); b.moveTo(x - 5, 170 + x * 0.06); b.lineTo(x + 5, 170 + x * 0.06); b.lineTo(x, 150 + x * 0.06); b.closePath(); b.fill(); }
        K.camlicaTower(b, 40, 162, 0.62, { wall: '#c8ccdc', wallD: '#9aa0b8', glass: '#3a6ab8', band: '#9ad8ff', lit: '#bff0ff' });
      });
      img(g, base, 0, 0);
      // atölyenin ocağı: vadide turuncu nabız
      const fx = 196, fy = 168, pulse = 0.55 + Math.sin(t * 3.2) * 0.25;
      glow(g, fx, fy, 16 + Math.sin(t * 3.2) * 3, 'rgba(255,140,50,A)', pulse);
      A.circle(g, fx, fy, 1.6, '#ffcc6a', null);
      // kahraman: arkadan bakar, sonra o ışığa doğru iner
      const go = seg(t, 6.2, 9.6);
      if (go <= 0) hero(g, 120, 178, 40, { pose: 'back', bag: true });
      else hero(g, lerp(120, 270, go), lerp(178, 214, go), 40, { pose: 'walk', dir: 1, phase: t * 1.3, bag: true });
      birds(g, t, 60, 2, '#1a1a3a', 7);
    },
  };

  // Son: şafakta Çamlıca'dan iniş, sonra atölye sabah ışığında. Örs ile laptop yan yana, kapının üstünde kendi
  // tabelası, rafta yolda toplanan parçalar, yanında boş bir sandalye.
  SCENES.son = {
    dur: 17, amb: 'safak', music: 'son',
    cues: [[12.2, 'forge'], [12.9, 'forge']],
    draw(g, t, opt) {
      if (t < 7.2) {
        // A: Çamlıca tepesinde bank, gün doğumu, Boğaz
        const dawn = seg(t, 0, 7);
        g.fillStyle = grad(g, 0, 0, 0, 150, [[0, A.shade('#2a3270', dawn * 0.5)], [0.6, '#d88a8a'], [1, '#ffd6a0']]); g.fillRect(0, 0, VW, 150);
        const sy = lerp(150, 112, dawn);
        glow(g, 200, sy, 80, 'rgba(255,214,150,A)', 0.8);
        A.circle(g, 200, sy, 14, '#fff2c4', null);
        SC.pen(null);
        const far = layer('sonA', VW, 70, (b) => {
          SC.pen(null);
          b.fillStyle = '#8a6a8e'; b.beginPath(); b.moveTo(0, 70); b.lineTo(0, 30); b.quadraticCurveTo(70, 18, 130, 30); b.lineTo(130, 70); b.closePath(); b.fill();
          K.bridge(b, 100, 256, 46, 18, { cable: '#9a7a9e', hang: 'rgba(154,122,158,0.6)', deck: '#9a7a9e', tower: '#9a7a9e' });
        });
        img(g, far, 0, 96);
        seaBand(g, 150, 176, '#a07a9e', '#5a5a8e', t, 200);
        // tepe, lale, bank, ağaç
        g.fillStyle = grad(g, 0, 170, 0, 240, [[0, '#4a6a3a'], [1, '#2a4024']]); g.beginPath(); g.moveTo(0, 240); g.lineTo(0, 178); g.quadraticCurveTo(128, 164, 256, 182); g.lineTo(256, 240); g.closePath(); g.fill();
        for (let x = 6; x < VW; x += 7) K.tulip(g, x, 214 + Math.sin(x) * 6, ['#e2483a', '#f4c531', '#ff7aa8', '#ffffff'][Math.floor(x / 7) % 4]);
        K.tree(g, 40, 200, 2.2);
        A.box(g, 110, 190, 44, 3, 1, '#6a4a2a'); A.box(g, 110, 182, 44, 3, 1, '#6a4a2a');
        for (const x of [114, 150]) A.lin(g, x, 193, x, 204, '#2a2630', 1.6);
        hero(g, 128, 204, 44, { pose: 'sit', dir: 1, bag: true });
        birds(g, t, 50, 4, '#3a3050', 12);
        // gece ışıkları sabahla söner
        g.fillStyle = `rgba(255,220,160,${(1 - dawn) * 0.5})`; const r = A.rng(2); for (let i = 0; i < 40; i++) g.fillRect(r() * VW, 140 + r() * 10, 1, 1);
        if (t > 6.2) { g.fillStyle = `rgba(255,248,230,${seg(t, 6.2, 7.2)})`; g.fillRect(0, 0, VW, VH); }
        return;
      }
      // B: Ümraniye, atölye sabah güneşinde
      const tb = t - 7.2;
      const pieces = (opt && opt.pieces) || [];
      g.fillStyle = grad(g, 0, 0, 0, 170, [[0, '#7ab0e0'], [1, '#e8f0f4']]); g.fillRect(0, 0, VW, 170);
      SC.pen(null);
      K.camlicaTower(g, 214, 120, 0.5, { wall: '#c8ccdc', wallD: '#a0a6b8', glass: '#7aa8d8', band: '#c8e8ff' });
      // dükkânın içi (kepenk kalkınca görünür)
      rect(g, 0, 40, VW, 160, '#d8c4a8');
      rect(g, 0, 40, VW, 160, 'rgba(120,80,40,0.08)');
      rect(g, 20, 54, 216, 146, '#4a3628');
      // güneş ışığı odaya çapraz düşer (Hopper)
      g.fillStyle = 'rgba(255,230,170,0.35)'; g.beginPath(); g.moveTo(236, 54); g.lineTo(150, 54); g.lineTo(40, 200); g.lineTo(200, 200); g.closePath(); g.fill();
      // raf ve parçalar
      rect(g, 30, 84, 132, 3, '#8a5a34');
      for (let i = 0; i < A.PIECES.length; i++) {
        const x = 36 + i * (122 / (A.PIECES.length - 1)), y = 77;
        if (pieces[i]) { glow(g, x, y, 8, 'rgba(255,240,190,A)', 0.4); A.drawPiece(g, i, x, y, 0.66, t); }
        else { g.strokeStyle = 'rgba(255,240,220,0.4)'; g.setLineDash([1.4, 1.4]); g.lineWidth = 0.6; g.strokeRect(x - 4.5, y - 5.4, 9, 10); g.setLineDash([]); }
      }
      // duvarda çekiç ve maşalar
      for (let k = 0; k < 4; k++) { const x = 172 + k * 12; A.lin(g, x, 64, x, 92, '#6a4a2a', 1.4); A.box(g, x - 3.4, 62, 6.8, 4, 1, '#5a5e68', A.K, 0.4); }
      // ocak, örs, tezgâh, laptop
      A.box(g, 168, 120, 46, 50, 3, '#5a4a44'); glow(g, 191, 142, 24, 'rgba(255,140,50,A)', 0.8 + Math.sin(t * 9) * 0.1);
      A.box(g, 176, 132, 30, 14, 3, '#ff8a3a', null);
      A.poly(g, [116, 170, 146, 170, 150, 166, 150, 172, 142, 173, 140, 182, 122, 182, 120, 173, 112, 172], '#3a3a44', null);
      rect(g, 124, 182, 14, 18, '#3a3a44');
      A.box(g, 34, 150, 66, 5, 1, '#8a5a34'); for (const x of [38, 94]) A.lin(g, x, 155, x, 200, '#5a3a24', 2);
      A.box(g, 56, 138, 22, 3, 0.8, '#c9ccd4', A.K, 0.5); A.poly(g, [58, 138, 78, 138, 80, 122, 60, 122], '#2a2e38', A.K, 0.5);
      // ekranda kendi oyunu
      rect(g, 62, 124, 15, 12, '#5fb4ec'); rect(g, 62, 132, 15, 4, '#4caf3a'); A.circle(g, 66, 131, 1.6, '#1fae9a', null); A.drawSimit(g, 73, 127, 0, 1.4);
      // kepenk kalkar
      const up = seg(tb, 0.4, 2.2);
      rect(g, 20, 54, 216, 146 * (1 - up), '#8a8e98');
      for (let y = 54; y < 54 + 146 * (1 - up); y += 3) rect(g, 20, y, 216, 0.8, '#6a6e78');
      // dış cephe ve tabela: örs ve </>
      rect(g, 0, 0, VW, 54, '#cbb49e'); rect(g, 0, 0, VW, 54, 'rgba(255,220,170,0.25)');
      for (const x of [30, 90, 150, 210]) { rect(g, x, 8, 16, 20, '#3e4258'); rect(g, x, 8, 16, 2, 'rgba(255,255,255,0.4)'); }
      A.box(g, 64, 34, 128, 16, 2, '#2a2430');
      anvilSign(g, 72, 36, 40, 12);
      g.fillStyle = '#7cff6a'; g.font = '600 11px Fredoka, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('</>', 152, 42.6);
      rect(g, 0, 200, VW, 40, '#9a948e'); rect(g, 0, 200, VW, 1.4, '#c8c2ba');
      g.fillStyle = 'rgba(255,230,170,0.25)'; g.beginPath(); g.moveTo(20, 200); g.lineTo(236, 200); g.lineTo(256, 240); g.lineTo(0, 240); g.closePath(); g.fill();
      // rafın altında, tezgâhın yanında boş bir sandalye
      A.box(g, 100, 186, 15, 3, 1, '#8a5a34', A.K, 0.5); A.lin(g, 102, 189, 101, 214, '#5a3a24', 1.6); A.lin(g, 113, 189, 114, 214, '#5a3a24', 1.6);
      A.lin(g, 113.6, 187, 115, 166, '#5a3a24', 1.8); A.box(g, 111.4, 164, 5, 12, 1.2, '#8a5a34', A.K, 0.5);
      // kahraman gelir: örse bir vurur, sonra laptopun başına geçer
      if (tb < 3.8) { const k = clamp01((tb - 1.2) / 2.6); hero(g, lerp(-20, 116, k), 214, 46, { pose: 'walk', dir: 1, phase: tb * 1.3, bag: true }); }
      else if (tb < 6.2) {
        const hit = tb > 4.8 && tb < 5.9;
        hero(g, 116, 214, 46, { pose: 'stand', dir: 1, reach: hit ? [16, -66 + Math.abs(Math.sin((tb - 4.8) * 5.7)) * 22] : [14, -50] });
        if (tb > 5 && (tb % 0.7) < 0.1) glow(g, 136, 168, 14, 'rgba(255,230,160,A)', 0.9);
        sparks(g, 136, 168, tb, 0.7, 10, 9);
      } else { A.box(g, 80, 188, 16, 3, 1, '#8a5a34'); A.lin(g, 84, 191, 82, 214, '#5a3a24', 1.6); A.lin(g, 92, 191, 94, 214, '#5a3a24', 1.6); hero(g, 86, 214, 46, { pose: 'desk', dir: -1, typing: true, phase: t }); }
      g.fillStyle = `rgba(255,248,230,${1 - seg(t, 7.2, 8)})`; g.fillRect(0, 0, VW, VH);
    },
  };

  // ---------------- oynatıcı ----------------
  function draw(g, id, t, opt) {
    const S = SCENES[id];
    g.save();
    g.beginPath(); g.rect(0, 0, VW, VH); g.clip();
    g.fillStyle = '#08060e'; g.fillRect(0, 0, VW, VH);
    SC.pen(null);
    S.draw(g, Math.min(t, S.dur), opt);
    g.restore();
    // açılış ve kapanış kararması
    const a = Math.max(1 - t / 0.7, (t - (S.dur - 0.9)) / 0.9);
    if (a > 0) { g.fillStyle = `rgba(8,6,14,${clamp01(a)})`; g.fillRect(0, 0, VW, VH); }
  }
  root.BA_STORY = { SCENES, draw, figure, hero, HERO, has: (id) => !!SCENES[id] };
})(window);
