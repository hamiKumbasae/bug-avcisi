// Bug Avcısı: İstanbul — çizgi film tarzı vektör çizimler.
// Her şey mantıksal piksellerle (1 karo = 16) çizilir; kanvas cihaz çözünürlüğünde olduğu için
// hiçbir ekran boyutunda piksellenmez. Sık kullanılan parçalar (karolar, arka planlar) önbelleğe alınır.
(function (root) {
  'use strict';
  const K = '#231d33';           // dış çizgi
  const LW = 0.9;                // dış çizgi kalınlığı
  let S = 3;                     // cihaz pikseli / mantıksal piksel
  const caches = [];
  function setScale(s) {
    if (Math.abs(s - S) < 0.01) return;
    S = s;
    for (const c of caches) c.clear();
  }
  function cache() { const m = new Map(); caches.push(m); return m; }
  function clearAll() { for (const c of caches) c.clear(); }
  // mantıksal boyutta, cihaz çözünürlüğünde bir tuval
  function mk(lw, lh, fn, scale) {
    const sc = scale || S;
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(lw * sc)); c.height = Math.max(1, Math.ceil(lh * sc));
    c.lw = lw; c.lh = lh;
    const g = c.getContext('2d');
    g.scale(c.width / lw, c.height / lh);
    g.lineJoin = 'round'; g.lineCap = 'round';
    fn(g, lw, lh);
    return c;
  }

  // ---------------- yardımcılar ----------------
  function rr(g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath();
    g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
    g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y);
    g.closePath();
  }
  function fs(g, fill, stroke, lw) {
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke !== null) { g.strokeStyle = stroke || K; g.lineWidth = lw || LW; g.stroke(); }
  }
  function circle(g, x, y, r, fill, stroke, lw) { g.beginPath(); g.arc(x, y, Math.max(0.01, r), 0, Math.PI * 2); fs(g, fill, stroke, lw); }
  function ellipse(g, x, y, rx, ry, fill, stroke, lw, rot) { g.beginPath(); g.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot || 0, 0, Math.PI * 2); fs(g, fill, stroke, lw); }
  function box(g, x, y, w, h, r, fill, stroke, lw) { rr(g, x, y, w, h, r); fs(g, fill, stroke, lw); }
  function poly(g, pts, fill, stroke, lw) { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); fs(g, fill, stroke, lw); }
  // kalın, uçları yuvarlak bir çizgi (kol, bacak) — önce koyu dış çizgi, sonra renk
  function limb(g, x1, y1, x2, y2, w, col) {
    g.lineCap = 'round';
    g.strokeStyle = K; g.lineWidth = w + LW * 2; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  }
  function lin(g, x1, y1, x2, y2, col, w) { g.strokeStyle = col; g.lineWidth = w || LW; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
  function grad(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
    if (f < 0) { r *= 1 + f; gg *= 1 + f; b *= 1 + f; } else { r += (255 - r) * f; gg += (255 - gg) * f; b += (255 - b) * f; }
    return '#' + [r, gg, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  }
  function eye(g, x, y, r, lookX, lookY, angry, dir) {
    ellipse(g, x, y, r, r * 1.15, '#ffffff', K, 0.7);
    circle(g, x + (lookX || 0) * r * 0.35, y + (lookY || 0) * r * 0.35 + r * 0.1, r * 0.55, K, null);
    circle(g, x + (lookX || 0) * r * 0.35 - r * 0.2, y - r * 0.15, r * 0.18, '#ffffff', null);
    if (angry) { lin(g, x - r * 1.1 * dir, y - r * 1.5, x + r * 0.9 * dir, y - r * 0.9, K, 1.1); }
  }

  // ---------------- kahraman: bilgisayar mühendisi ----------------
  const SKIN = '#f6c39c', SKIN_D = '#d9946b', HAIR = '#4a2a1a', HAIR_L = '#6e4128';
  const OUTFIT = {
    normal: { hood: '#1fae9a', hoodD: '#14806f', jeans: '#3d5a92', jeansD: '#2a4170' },
    hacker: { hood: '#2a2a36', hoodD: '#16161e', jeans: '#2e3346', jeansD: '#1d2030' },
  };
  // o: { big, face, mode: 'stand'|'walk'|'jump'|'skid'|'dead'|'shoot', phase, skin, star(0..1 renk döngüsü), t }
  function drawHero(g, cx, by, o) {
    const big = o.big;
    const legL = big ? 8.6 : 3, torsoH = big ? 10.5 : 4.6, headR = big ? 5.4 : 4.7, tw = big ? 9 : 8;
    let C = OUTFIT[o.skin === 'hacker' ? 'hacker' : 'normal'];
    if (o.star) {
      const h = (o.t * 720) % 360;
      C = { hood: `hsl(${h},85%,55%)`, hoodD: `hsl(${h},85%,38%)`, jeans: `hsl(${(h + 180) % 360},70%,45%)`, jeansD: `hsl(${(h + 180) % 360},70%,32%)` };
    }
    g.save();
    g.translate(cx, by);
    if (o.mode === 'dead') { drawHeroFront(g, big, C, o); g.restore(); return; }
    g.scale(o.face < 0 ? -1 : 1, 1);
    if (o.star) { g.shadowColor = C.hood; g.shadowBlur = 6 * S; }
    const hipY = -legL - 1.3, shY = hipY - torsoH;
    let la = 0, aa = 0, lean = 0, bend = 1;
    if (o.mode === 'walk') { la = Math.sin(o.phase * Math.PI * 2) * 0.62; aa = -la * 0.9; }
    if (o.mode === 'jump') { la = 0.55; aa = -2.3; bend = 0.8; }
    if (o.mode === 'skid') { la = 0.5; aa = 0.9; lean = -0.12; }
    if (o.mode === 'shoot') { aa = -1.45; }
    g.rotate(lean);
    const bob = o.mode === 'walk' ? Math.abs(Math.sin(o.phase * Math.PI * 2)) * -0.6 : 0;
    g.translate(0, bob);
    const legW = big ? 3.4 : 2.7;
    const foot = (ang, len) => [Math.sin(ang) * len, hipY + Math.cos(ang) * len];
    // arka bacak ve kol (koyu)
    const back = o.mode === 'jump' ? foot(-0.35, legL * 0.9) : foot(-la, legL);
    limb(g, -1, hipY, back[0] - 0.6, back[1], legW, C.jeansD);
    shoe(g, back[0] - 0.6, back[1], big);
    const armL = big ? 7.4 : 3.8;
    const sh = [-tw / 2 + 1.6, shY + 2];
    const backArm = o.mode === 'jump' ? [sh[0] - 1.5, sh[1] - armL * 0.9] : [sh[0] + Math.sin(-aa) * armL, sh[1] + Math.cos(-aa) * armL];
    limb(g, sh[0], sh[1], backArm[0], backArm[1], big ? 2.8 : 2.4, C.hoodD);
    circle(g, backArm[0], backArm[1], big ? 1.5 : 1.3, SKIN_D);
    // gövde (kapüşonlu)
    box(g, -tw / 2, shY, tw, torsoH + 1.6, big ? 3.2 : 2.6, C.hood);
    g.save(); rr(g, -tw / 2, shY, tw, torsoH + 1.6, big ? 3.2 : 2.6); g.clip();
    g.fillStyle = C.hoodD; g.fillRect(-tw / 2, shY, 2.2, torsoH + 2);
    g.fillRect(-tw / 2, shY + torsoH - 0.2, tw, 2);
    if (big) {
      if (o.skin === 'hacker' && !o.star) {
        // göğüste yeşil </> işareti (kolun arkasında kalmasın diye gövdenin arka yarısında)
        g.strokeStyle = '#7cff6a'; g.lineWidth = 0.7; g.beginPath();
        g.moveTo(-1.4, shY + 3.6); g.lineTo(-3, shY + 5); g.lineTo(-1.4, shY + 6.4);
        g.moveTo(-0.2, shY + 6.6); g.lineTo(0.8, shY + 3.4);
        g.moveTo(2, shY + 3.6); g.lineTo(3.4, shY + 5); g.lineTo(2, shY + 6.4); g.stroke();
      }
      else {
        // kart ipi ve yaka kartı
        lin(g, -1.6, shY + 0.6, 0.6, shY + 5.2, '#f4c531', 0.9); lin(g, 2.8, shY + 0.6, 0.6, shY + 5.2, '#f4c531', 0.9);
        box(g, -0.6, shY + 5, 2.6, 3.2, 0.5, '#ffffff', K, 0.5); g.fillStyle = '#3d7be0'; g.fillRect(-0.2, shY + 5.5, 1.8, 0.8);
      }
      lin(g, -2.4, shY + torsoH - 2.6, 3.6, shY + torsoH - 2.6, C.hoodD, 0.8); // cep
    } else {
      lin(g, -0.6, shY + 0.5, 0.8, shY + 3, '#f4c531', 0.8); lin(g, 2.4, shY + 0.5, 0.8, shY + 3, '#f4c531', 0.8);
    }
    g.restore();
    rr(g, -tw / 2, shY, tw, torsoH + 1.6, big ? 3.2 : 2.6); fs(g, null);
    // ön bacak
    const front = foot(la, legL * bend);
    limb(g, 1.2, hipY, front[0] + 0.6, front[1], legW, C.jeans);
    shoe(g, front[0] + 0.6, front[1], big);
    // baş
    const hy = shY - headR + 1.4;
    drawHead(g, 0.6, hy, headR, o, false);
    // ön kol
    const sh2 = [tw / 2 - 1.8, shY + 2.2];
    let fa;
    if (o.mode === 'jump') fa = [sh2[0] + 2.4, sh2[1] - armL * 0.85];
    else if (o.mode === 'shoot') fa = [sh2[0] + armL, sh2[1] - 0.6];
    else fa = [sh2[0] + Math.sin(aa) * armL, sh2[1] + Math.cos(aa) * armL];
    limb(g, sh2[0], sh2[1], fa[0], fa[1], big ? 2.8 : 2.4, C.hood);
    circle(g, fa[0], fa[1], big ? 1.6 : 1.35, SKIN);
    g.restore();
  }
  function shoe(g, x, y, big) {
    const w = big ? 3.4 : 2.9;
    box(g, x - w * 0.5, y - 1.2, w * 1.35, 2.4, 1.1, '#f6f6f2');
    g.fillStyle = '#e2483a'; g.fillRect(x - w * 0.5 + 0.4, y + 0.3, w * 1.35 - 0.8, 0.6);
  }
  function drawHead(g, x, y, r, o, front) {
    // kulaklıklar (laptop gücü)
    const hacker = o.skin === 'hacker';
    circle(g, x, y, r, SKIN);
    // saç
    g.save(); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.clip();
    g.fillStyle = HAIR;
    g.beginPath();
    g.moveTo(x - r - 1, y + 0.6);
    g.quadraticCurveTo(x - r * 0.6, y - r * 1.25, x + r * 0.5, y - r * 1.05);
    g.quadraticCurveTo(x + r * 1.2, y - r * 0.8, x + r * 0.95, y - r * 0.25);
    g.quadraticCurveTo(x + r * 0.3, y - r * 0.55, x - r * 0.15, y - r * 0.2);
    g.quadraticCurveTo(x - r * 0.35, y + r * 0.35, x - r * 0.55, y + r * 0.9);
    g.lineTo(x - r - 1, y + r);
    g.fill();
    g.fillStyle = HAIR_L; ellipse(g, x - r * 0.1, y - r * 0.78, r * 0.35, r * 0.13, HAIR_L, null, 0, -0.2);
    g.restore();
    circle(g, x, y, r, null);
    // perçem
    g.fillStyle = HAIR;
    g.beginPath(); g.moveTo(x - r * 0.1, y - r * 0.95); g.quadraticCurveTo(x + r * 0.9, y - r * 1.5, x + r * 1.05, y - r * 0.55); g.quadraticCurveTo(x + r * 0.5, y - r * 0.95, x - r * 0.1, y - r * 0.95); g.fill();
    g.strokeStyle = K; g.lineWidth = 0.6; g.stroke();
    // kulak
    circle(g, x - r * 0.38, y + r * 0.18, r * 0.24, SKIN, K, 0.6);
    // gözlük, göz, ağız
    const gx = x + r * 0.45, gy = y + r * 0.05, lr = r * 0.3;
    circle(g, gx + r * 0.12, gy, lr * 0.42, K, null);
    circle(g, gx, gy, lr, 'rgba(210,236,255,0.45)', K, 0.75);
    circle(g, gx + lr * 2.25, gy, lr * 0.8, 'rgba(210,236,255,0.45)', K, 0.75);
    lin(g, gx + lr, gy, gx + lr * 1.45, gy, K, 0.7);
    lin(g, gx - lr, gy - 0.1, x - r * 0.3, gy - 0.5, K, 0.6);
    circle(g, x + r * 0.55, y + r * 0.55, r * 0.17, 'rgba(240,120,110,0.45)', null);
    g.strokeStyle = K; g.lineWidth = 0.6; g.beginPath(); g.arc(x + r * 0.62, y + r * 0.42, r * 0.22, 0.2, 1.6); g.stroke();
    if (hacker) {
      g.strokeStyle = '#18181f'; g.lineWidth = 1.2; g.beginPath(); g.arc(x - r * 0.1, y - 0.2, r * 1.05, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
      box(g, x - r * 0.75, y - r * 0.15, r * 0.6, r * 0.9, 0.8, '#18181f', K, 0.5);
      circle(g, x - r * 0.45, y + r * 0.3, r * 0.12, '#7cff6a', null);
    }
    void front;
  }
  function drawHeroFront(g, big, C, o) {
    // ölüm pozu: öne bakar, kollar yukarıda
    const legL = big ? 8.6 : 3, torsoH = big ? 10.5 : 4.6, r = big ? 5.4 : 4.7, tw = big ? 9 : 8;
    const hipY = -legL - 1.3, shY = hipY - torsoH;
    limb(g, -1.8, hipY, -2.6, -1.2, 3, C.jeans); limb(g, 1.8, hipY, 2.6, -1.2, 3, C.jeans);
    shoe(g, -3.4, -1, big); shoe(g, 2.2, -1, big);
    limb(g, -tw / 2 + 1, shY + 2, -tw / 2 - 2.5, shY - 4, 2.6, C.hood); limb(g, tw / 2 - 1, shY + 2, tw / 2 + 2.5, shY - 4, 2.6, C.hood);
    circle(g, -tw / 2 - 2.5, shY - 4, 1.4, SKIN); circle(g, tw / 2 + 2.5, shY - 4, 1.4, SKIN);
    box(g, -tw / 2, shY, tw, torsoH + 1.6, 3, C.hood);
    const y = shY - r + 1.4;
    circle(g, 0, y, r, SKIN);
    g.save(); g.beginPath(); g.arc(0, y, r, 0, Math.PI * 2); g.clip(); g.fillStyle = HAIR; g.fillRect(-r, y - r, r * 2, r * 0.75); g.restore();
    circle(g, 0, y, r, null);
    circle(g, -r * 0.42, y + 0.3, r * 0.3, 'rgba(210,236,255,0.6)', K, 0.7); circle(g, r * 0.42, y + 0.3, r * 0.3, 'rgba(210,236,255,0.6)', K, 0.7);
    lin(g, -r * 0.55, y + 0.3, -r * 0.3, y + 0.3, K, 0.6); lin(g, r * 0.3, y + 0.3, r * 0.55, y + 0.3, K, 0.6);
    ellipse(g, 0, y + r * 0.6, r * 0.18, r * 0.24, K, null);
    void o;
  }

  // ---------------- eşyalar ----------------
  // (x, y) sol üst; 16×16 kutu
  function drawSimit(g, cx, cy, t, r) {
    r = r || 6.2;
    const sx = Math.cos(t || 0);
    g.save(); g.translate(cx, cy); g.scale(Math.max(0.12, Math.abs(sx)), 1);
    const gr = g.createRadialGradient(-1.5, -2, 1, 0, 0, r);
    gr.addColorStop(0, '#f2b45a'); gr.addColorStop(0.7, '#c97a28'); gr.addColorStop(1, '#9a5418');
    g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.arc(0, 0, r * 0.42, 0, Math.PI * 2, true); g.fillStyle = gr; g.fill('evenodd');
    g.strokeStyle = K; g.lineWidth = 0.8; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(0, 0, r * 0.42, 0, Math.PI * 2); g.stroke();
    // burgu ve susam
    g.strokeStyle = 'rgba(120,60,10,0.55)'; g.lineWidth = 0.55;
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; g.beginPath(); g.arc(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7, r * 0.26, a + 0.6, a + 2.2); g.stroke(); }
    for (let k = 0; k < 14; k++) { const a = k * 2.39, d = r * (0.55 + (k % 3) * 0.13); ellipse(g, Math.cos(a) * d, Math.sin(a) * d, 0.55, 0.3, '#fff3d6', null, 0, a); }
    g.restore();
  }
  function drawItem(g, kind, x, y, t) {
    const cx = x + 8, by = y + 15;
    switch (kind) {
      case 'cay': {
        // ince belli çay bardağı, tabakta
        ellipse(g, cx, by - 0.8, 6.5, 1.6, '#f4f0e6', K, 0.7);
        ellipse(g, cx, by - 1.2, 4.6, 0.9, '#d8302a', null);
        g.beginPath();
        g.moveTo(cx - 3.6, by - 13.5); g.bezierCurveTo(cx - 3.8, by - 9.5, cx - 1.6, by - 8.6, cx - 1.9, by - 6.2);
        g.bezierCurveTo(cx - 2.2, by - 4, cx - 3.4, by - 3.4, cx - 3, by - 1.6); g.lineTo(cx + 3, by - 1.6);
        g.bezierCurveTo(cx + 3.4, by - 3.4, cx + 2.2, by - 4, cx + 1.9, by - 6.2); g.bezierCurveTo(cx + 1.6, by - 8.6, cx + 3.8, by - 9.5, cx + 3.6, by - 13.5);
        g.closePath();
        g.fillStyle = grad(g, cx - 3, 0, cx + 3, 0, [[0, '#9a1e10'], [0.5, '#d2421e'], [1, '#8a1a0c']]); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(cx - 3.3, by - 13.4, 6.6, 1.6);
        g.strokeStyle = K; g.lineWidth = 0.75; g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(cx - 2.6, by - 12, 0.8, 3.4);
        g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 0.6;
        for (let k = 0; k < 2; k++) { g.beginPath(); const sx = cx - 1 + k * 2.2; g.moveTo(sx, by - 14.5); g.bezierCurveTo(sx - 1.2, by - 15.8, sx + 1.2, by - 16.6, sx, by - 18 + Math.sin((t || 0) * 5 + k) * 0.4); g.stroke(); }
        break;
      }
      case 'laptop': {
        box(g, x + 2.5, by - 13, 11, 8, 1, '#c9ccd4');
        box(g, x + 3.6, by - 12, 8.8, 6, 0.6, '#14202a', null);
        g.fillStyle = '#7cff6a'; g.font = '600 4px Fredoka, sans-serif'; g.textAlign = 'center'; g.fillText('</>', cx, by - 7.8);
        poly(g, [x + 1, by - 3.5, x + 15, by - 3.5, x + 16, by - 1.2, x, by - 1.2], '#9aa0aa');
        g.fillStyle = '#c9ccd4'; g.fillRect(x + 2, by - 4.6, 12, 1.2);
        break;
      }
      case 'kahve': {
        ellipse(g, cx, by - 1.2, 6.8, 1.7, '#f4f0e6', K, 0.7);
        g.beginPath(); g.moveTo(cx - 4.3, by - 9); g.lineTo(cx + 4.3, by - 9); g.quadraticCurveTo(cx + 4, by - 2.2, cx, by - 2.2); g.quadraticCurveTo(cx - 4, by - 2.2, cx - 4.3, by - 9); g.closePath();
        fs(g, '#ffffff');
        g.strokeStyle = K; g.lineWidth = 0.7; g.beginPath(); g.arc(cx + 4.8, by - 6.4, 1.6, -1.3, 1.6); g.stroke();
        ellipse(g, cx, by - 9, 4.3, 1.1, '#5a2e14', K, 0.6);
        // kırmızı motif
        for (let k = 0; k < 3; k++) circle(g, cx - 2.4 + k * 2.4, by - 5.6, 0.7, '#d2302a', null);
        g.strokeStyle = '#d2302a'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(cx - 3.6, by - 4); g.lineTo(cx + 3.6, by - 4); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 0.6;
        for (let k = 0; k < 2; k++) { g.beginPath(); const sx = cx - 1.2 + k * 2.4; g.moveTo(sx, by - 10); g.bezierCurveTo(sx - 1.3, by - 11.6, sx + 1.3, by - 12.6, sx, by - 14.2 + Math.sin((t || 0) * 6 + k) * 0.5); g.stroke(); }
        break;
      }
      case 'disket': {
        box(g, x + 1.8, y + 1.8, 12.4, 12.4, 1.2, '#3d6fd8');
        box(g, x + 4.4, y + 1.8, 7.2, 4.6, 0.4, '#c9ccd4', K, 0.5);
        g.fillStyle = '#3d6fd8'; g.fillRect(x + 8.6, y + 2.4, 1.6, 3.4);
        box(g, x + 3.6, y + 8, 8.8, 6, 0.5, '#f4f0e6', K, 0.5);
        g.fillStyle = '#e2483a'; g.font = '700 4.2px Fredoka, sans-serif'; g.textAlign = 'center'; g.fillText('+1', cx, y + 12.8);
        break;
      }
    }
  }
  function drawShot(g, x, y, t) {
    g.save(); g.translate(x + 4, y + 4); g.rotate((t || 0) * 12);
    g.shadowColor = '#7cff6a'; g.shadowBlur = 4 * S;
    g.fillStyle = '#7cff6a'; g.font = '700 9px Fredoka, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('{}', 0, 0.5);
    g.restore();
  }

  // ---------------- düşmanlar ----------------
  // (cx, by): alt orta nokta
  function drawBug(g, cx, by, t, dir, flat) {
    g.save(); g.translate(cx, by); g.scale(dir > 0 ? -1 : 1, 1);
    if (flat) {
      ellipse(g, 0, -1.6, 7, 1.8, '#4caf3a');
      lin(g, -2.6, -2.4, -1.4, -1.2, K, 0.7); lin(g, -2.6, -1.2, -1.4, -2.4, K, 0.7);
      lin(g, 1.4, -2.4, 2.6, -1.2, K, 0.7); lin(g, 1.4, -1.2, 2.6, -2.4, K, 0.7);
      g.restore(); return;
    }
    const step = Math.sin(t * 14);
    // bacaklar
    for (let k = 0; k < 3; k++) {
      const lx = -3 + k * 3, sw = (k % 2 ? step : -step) * 1.2;
      lin(g, lx, -3, lx - 1.8 + sw, -0.2, K, 1); lin(g, lx + 0.5, -3, lx + 2 + sw, -0.2, K, 1);
    }
    // gövde (kabuk)
    ellipse(g, 0.8, -5.4, 6.4, 4.6, '#4caf3a');
    g.save(); g.beginPath(); g.ellipse(0.8, -5.4, 6.4, 4.6, 0, 0, Math.PI * 2); g.clip();
    g.fillStyle = '#358a28'; g.fillRect(-6, -2.6, 14, 4);
    ellipse(g, -0.6, -7.8, 3, 1.3, 'rgba(255,255,255,0.35)', null);
    g.restore();
    lin(g, 2.4, -9.8, 2.4, -1.4, '#2a6a1e', 0.7);
    for (const [sx, sy] of [[4.5, -6.6], [-0.6, -5], [4.2, -3.6]]) circle(g, sx, sy, 0.8, '#2a6a1e', null);
    // baş
    circle(g, -5, -5, 3.4, '#3d8f2e');
    eye(g, -6.2, -5.6, 1.35, -1, 0, true, -1);
    eye(g, -3.6, -5.8, 1.2, -1, 0, true, -1);
    // antenler
    lin(g, -5.4, -8.2, -7.6, -11.6 + Math.sin(t * 6) * 0.4, K, 0.7); lin(g, -4, -8.2, -3.6, -11.8, K, 0.7);
    circle(g, -7.6, -11.8, 0.8, '#e2483a', null); circle(g, -3.6, -12, 0.8, '#e2483a', null);
    g.restore();
  }
  function drawVirus(g, cx, by, t) {
    const cy = by - 7, rot = t * 2;
    g.save(); g.translate(cx, cy);
    for (let k = 0; k < 9; k++) {
      const a = rot + k / 9 * Math.PI * 2;
      lin(g, Math.cos(a) * 4.5, Math.sin(a) * 4.5, Math.cos(a) * 7.4, Math.sin(a) * 7.4, '#7a2fae', 1.4);
      circle(g, Math.cos(a) * 7.6, Math.sin(a) * 7.6, 1.2, '#d860ff', K, 0.6);
    }
    const gr = g.createRadialGradient(-1.5, -1.8, 0.5, 0, 0, 5.6);
    gr.addColorStop(0, '#c070f0'); gr.addColorStop(1, '#7a2fae');
    circle(g, 0, 0, 5.4, gr);
    circle(g, 2.6, 2.2, 0.9, 'rgba(255,255,255,0.25)', null); circle(g, -2.8, 2.6, 0.6, 'rgba(255,255,255,0.25)', null);
    eye(g, -1.8, -0.8, 1.3, 0, 0.3, true, 1); eye(g, 1.8, -0.8, 1.3, 0, 0.3, true, -1);
    g.strokeStyle = K; g.lineWidth = 0.7; g.beginPath(); g.arc(0, 2.8, 1.4, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
    g.restore();
  }
  function drawSpam(g, cx, by, t, dir) {
    g.save(); g.translate(cx, by - 6); g.scale(dir > 0 ? -1 : 1, 1);
    const flap = Math.sin(t * 22);
    // kanatlar
    for (const s of [-1, 1]) {
      g.save(); g.translate(s * 5.6, -1.6); g.rotate(s * (0.5 + flap * 0.45));
      ellipse(g, s * 3, -1.4, 3.6, 1.8, '#f4f6ff', K, 0.7, s * -0.3);
      lin(g, s * 1.4, -1.4, s * 4.6, -1.8, '#c8cce0', 0.5);
      g.restore();
    }
    box(g, -6.5, -4.5, 13, 9, 1.3, '#fffbe8');
    g.strokeStyle = '#c8b890'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(-6.2, -4); g.lineTo(0, 1); g.lineTo(6.2, -4); g.stroke();
    circle(g, 0, 1.2, 2, '#e2483a', K, 0.6);
    g.fillStyle = '#ffffff'; g.font = '700 2.8px Fredoka, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('@', 0, 1.3);
    eye(g, -3.2, -1.6, 1.15, -1, 0, true, -1); eye(g, 3.2, -1.6, 1.15, -1, 0, true, 1);
    g.restore();
  }
  function drawMarti(g, cx, by, t, dir, diving) {
    g.save(); g.translate(cx, by - 5); g.scale(dir < 0 ? -1 : 1, 1);
    if (diving) g.rotate(0.6);
    const flap = diving ? -0.8 : Math.sin(t * 14);
    // arka kanat
    g.save(); g.translate(-1, -1); g.rotate(-0.4 - flap * 0.7);
    poly(g, [0, 0, -9, -2.5, -11, 0, -3, 2], '#b8c2cc'); g.restore();
    // gövde
    ellipse(g, 0, 0, 6.2, 3.4, '#ffffff');
    poly(g, [-5.5, -0.6, -9, -2.2, -9, 1.6, -5, 1.4], '#ffffff');
    lin(g, -8.6, -1.8, -8.6, 1.2, '#2a2a30', 1);
    circle(g, 4.6, -1.8, 2.8, '#ffffff');
    circle(g, 5.4, -2.3, 0.8, K, null);
    lin(g, 4.6, -3.6, 6.4, -3, K, 0.7);
    poly(g, [7, -1.8, 10.2, -1.2, 7, -0.2], '#f4b81e', K, 0.6); circle(g, 9.2, -1.1, 0.45, '#e2483a', null);
    // ön kanat
    g.save(); g.translate(0, -0.6); g.rotate(-0.2 - flap * 0.8);
    poly(g, [1, 0, -7, -3.5, -10.5, -1.2, -9, 0.4, -2, 1.8], '#d4dbe2'); lin(g, -8.6, -1.6, -10.2, -1.2, '#2a2a30', 1.2); g.restore();
    lin(g, -1, 3.2, -1.4, 4.6, '#f08a24', 0.8); lin(g, 1, 3.2, 0.8, 4.6, '#f08a24', 0.8);
    g.restore();
  }
  function drawSpark(g, x, y, t, r) {
    r = r || 2.6;
    const gr = g.createRadialGradient(x, y, 0, x, y, r * 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(120,240,255,0.95)'); gr.addColorStop(1, 'rgba(58,224,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 2, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#ffffff'; g.lineWidth = 0.5;
    const a = (t || 0) * 20;
    g.beginPath(); g.moveTo(x + Math.cos(a) * r * 1.6, y + Math.sin(a) * r * 1.6); g.lineTo(x - Math.cos(a) * r * 1.6, y - Math.sin(a) * r * 1.6); g.stroke();
  }

  // ---------------- patronlar ----------------
  function crown(g, x, y, w) {
    const h = w * 0.55;
    poly(g, [x, y + h, x, y + h * 0.25, x + w * 0.25, y + h * 0.55, x + w * 0.5, y, x + w * 0.75, y + h * 0.55, x + w, y + h * 0.25, x + w, y + h], '#f4c531', K, 0.8);
    circle(g, x + w * 0.5, y + h * 0.7, w * 0.08, '#e2483a', null);
    circle(g, x + w * 0.2, y + h * 0.78, w * 0.06, '#3d7be0', null); circle(g, x + w * 0.8, y + h * 0.78, w * 0.06, '#3d7be0', null);
  }
  // b: patron nesnesi; (cx, by) alt orta
  function drawBoss(g, kind, cx, by, t, o) {
    o = o || {};
    const flash = o.hurt;
    g.save();
    g.translate(cx, by);
    if (o.face < 0 && (kind === 'truva' || kind === 'marti')) g.scale(-1, 1);
    switch (kind) {
      case 'kralbug': {
        const d = o.face > 0 ? 1 : -1;
        g.save(); g.scale(2.2, 2.2); drawBug(g, 0, 0, t, d, false); g.restore();
        g.save(); g.scale(d > 0 ? -1 : 1, 1); crown(g, -16.5, -24.5, 10); g.restore();
        break;
      }
      case 'spam': {
        g.save(); g.scale(2.4, 2.4); drawSpam(g, 0, 0, t, -1); g.restore();
        crown(g, -5, -30, 10);
        break;
      }
      case 'marti': {
        g.save(); g.scale(2.3, 2.3); drawMarti(g, 0, 0, t, 1, o.dive); g.restore();
        break;
      }
      case 'truva': {
        // tekerlekli tahta at
        g.scale(0.84, 0.84);
        const wood = '#b77a3c', dark = '#7a4a1e';
        box(g, -17, -9, 34, 4, 1.5, dark);
        for (const x of [-12, 0, 12]) { circle(g, x, -3.2, 3.2, '#3a2e28'); circle(g, x, -3.2, 1.2, '#c9ccd4', null); }
        for (const x of [-11, -6, 5, 10]) box(g, x - 1.6, -19, 3.4, 11, 1, wood);
        box(g, -15, -28, 28, 11, 4, wood);
        for (let y = -25; y < -18; y += 2.6) lin(g, -13.5, y, 11.5, y, dark, 0.5);
        const open = o.open;
        box(g, -5, -22, 9, 5, 1, open ? '#7cff6a' : '#5a3a1a');
        if (!open) { g.fillStyle = '#7cff6a'; g.font = '600 3.4px Fredoka, sans-serif'; g.textAlign = 'center'; g.fillText('</>', -0.5, -18.6); }
        // boyun ve baş
        poly(g, [6, -27, 13, -38, 18, -34, 13, -24], wood, K, 0.9);
        box(g, 12, -42, 10, 8, 3, wood);
        poly(g, [13, -42, 14.5, -46, 16, -42], wood, K, 0.7); poly(g, [17, -42, 18.5, -46, 20, -42], wood, K, 0.7);
        eye(g, 17.5, -38.6, 1.5, 1, 0, true, 1);
        circle(g, 21, -36, 0.6, K, null);
        for (let k = 0; k < 5; k++) lin(g, 8 + k * 1.2, -29 - k * 2, 5.6 + k * 1.2, -27.5 - k * 2, '#5a3412', 1.1);
        lin(g, -15, -24, -19, -18, '#5a3412', 1.6);
        break;
      }
      case 'sizinti': {
        const wob = Math.sin(t * 8) * 1.2;
        const gr = g.createLinearGradient(0, -26, 0, 0);
        gr.addColorStop(0, '#d79cff'); gr.addColorStop(1, '#7a2fae');
        g.beginPath();
        g.moveTo(-17 - wob, 0);
        g.bezierCurveTo(-18, -14, -10, -26 - wob, 0, -26 - wob);
        g.bezierCurveTo(10, -26 - wob, 18, -14, 17 + wob, 0);
        g.closePath(); fs(g, gr);
        for (const [x, y] of [[-8, -8], [3, -6], [-2, -13]]) { box(g, x, y, 8, 3, 0.4, '#2a7a3a', K, 0.4); for (let k = 0; k < 4; k++) g.fillRect(x + 0.8 + k * 2, y + 3, 0.6, 0.8); }
        ellipse(g, -5, -20, 4, 1.6, 'rgba(255,255,255,0.35)', null, 0, -0.3);
        eye(g, -5, -15, 2.4, 0, 0.3, true, 1); eye(g, 5, -15, 2.4, 0, 0.3, true, -1);
        g.strokeStyle = K; g.lineWidth = 0.9; g.beginPath(); g.moveTo(-4, -9); g.quadraticCurveTo(0, -11, 4, -9); g.stroke();
        circle(g, -15, 1 + wob, 1.6, '#a64fd0', null); circle(g, 14, 1.5 - wob, 1.3, '#a64fd0', null);
        break;
      }
      case 'dongu': {
        const r = 11;
        const gr = g.createRadialGradient(-3, -r - 4, 1, 0, -r, r);
        gr.addColorStop(0, '#5a7ad8'); gr.addColorStop(1, '#141c48');
        circle(g, 0, -r, r, gr);
        g.save(); g.translate(0, -r); g.shadowColor = '#3ae0ff'; g.shadowBlur = 5 * S;
        g.strokeStyle = '#8af4ff'; g.lineWidth = 1.8; g.beginPath();
        for (let i = 0; i <= 60; i++) { const a = i / 60 * Math.PI * 2 + t; const d = 1 + Math.sin(a) * Math.sin(a); const x = 7 * Math.cos(a) / d, y = 7 * Math.sin(a) * Math.cos(a) / d; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
        g.stroke(); g.restore();
        break;
      }
      case 'ddos': {
        g.scale(0.88, 0.88);
        const col = '#5a5e78', light = '#7c82a0';
        for (const [x, y, r] of [[-14, -10, 9], [0, -15, 12], [14, -10, 9], [-7, -6, 8], [7, -6, 8]]) circle(g, x, y, r, col);
        g.fillStyle = col;
        for (const [x, y, r] of [[-14, -10, 9], [0, -15, 12], [14, -10, 9], [-7, -6, 8], [7, -6, 8]]) { g.beginPath(); g.arc(x, y, r - 0.6, 0, Math.PI * 2); g.fill(); }
        circle(g, -3, -20, 5, light, null); circle(g, -15, -14, 3, light, null);
        eye(g, -5, -11, 2.6, 0, 0.3, true, 1); eye(g, 5, -11, 2.6, 0, 0.3, true, -1);
        g.strokeStyle = K; g.lineWidth = 1; g.beginPath(); g.moveTo(-4, -4); g.lineTo(-2, -5.5); g.lineTo(0, -4); g.lineTo(2, -5.5); g.lineTo(4, -4); g.stroke();
        if (Math.floor(t * 6) % 3 === 0) { poly(g, [-10, 0, -7, 0, -9, 4, -6, 4, -11, 11, -9.5, 5, -12, 5], '#ffe14a', K, 0.5); }
        if (o.tired) { g.fillStyle = '#ffffff'; g.font = '700 7px Fredoka, sans-serif'; g.fillText('z', 18, -26 - Math.sin(t * 3) * 2); }
        break;
      }
      case 'glitch': {
        const r = rng(Math.floor(t * 12) * 977 + 3);
        const shape = ['....xxxx....', '...xxxxxx...', '...xxxxxx...', '...xx..xx...', '....xxxx....', '..xxxxxxxx..', '.xxxxxxxxxx.', '.xx.xxxx.xx.', '.xx.xxxx.xx.', '....xxxx....', '...xx..xx...', '...xx..xx...', '..xxx..xxx..'];
        const cols = ['#ff3a6a', '#3ae0ff', '#7cff6a', '#ffffff', '#9a4fd0'];
        for (let y = 0; y < shape.length; y++) for (let x = 0; x < 12; x++) {
          if (shape[y][x] !== 'x') continue;
          const off = r() < 0.18 ? (r() < 0.5 ? -2 : 2) : 0;
          g.fillStyle = cols[Math.floor(r() * cols.length)];
          g.fillRect(-12 + x * 2 + off, -28 + y * 2.1, 2.05, 2.15);
        }
        g.globalAlpha = 0.5; g.fillStyle = '#ff3a6a'; g.fillRect(-13, -28 + r() * 26, 26, 0.8); g.fillStyle = '#3ae0ff'; g.fillRect(-13, -28 + r() * 26, 26, 0.8); g.globalAlpha = 1;
        break;
      }
      case 'maviekran': {
        const step = Math.sin(t * 8) * 1.5;
        limb(g, -8, -9, -9, -1 + step * 0.3, 3, '#6a707c'); limb(g, 8, -9, 9, -1 - step * 0.3, 3, '#6a707c');
        box(g, -13, -1.6 + step * 0.3, 8, 2.6, 1, '#3a3e48'); box(g, 5, -1.6 - step * 0.3, 8, 2.6, 1, '#3a3e48');
        box(g, -22, -42, 44, 34, 4, '#d4d7de');
        g.fillStyle = '#b8bcc6'; g.fillRect(-21, -12, 42, 3);
        box(g, -18.5, -38.5, 37, 25, 2, flash ? '#ffffff' : '#2a5ad8', K, 0.8);
        if (!flash) {
          g.fillStyle = '#ffffff'; g.font = '600 13px Fredoka, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText(':(', -15, -24);
          g.fillStyle = 'rgba(255,255,255,0.65)'; for (const [y, w] of [[-20, 30], [-17, 22], [-14.5, 26]]) g.fillRect(-15, y, w, 1.1);
          box(g, 9, -36, 7, 7, 0.4, '#ffffff', null); g.fillStyle = '#2a5ad8'; g.fillRect(10, -35, 2, 2); g.fillRect(13, -32, 2, 2); g.fillRect(10, -31, 1, 1);
        }
        circle(g, 17, -10.5, 1, '#7cff6a', null);
        break;
      }
    }
    if (flash && kind !== 'maviekran' && kind !== 'glitch') {
      g.globalCompositeOperation = 'source-atop';
    }
    g.restore();
  }

  // ---------------- dünyalar: karolar ----------------
  const WORLD = [
    { key: 'maslak', sky: ['#7cc8f5', '#dff3ff'], water: false },
    { key: 'kadikoy', sky: ['#f6a96c', '#ffe7c2'], water: '#2f7fa8' },
    { key: 'vapur', sky: ['#5fbcf2', '#d4f0ff'], water: '#2a86c8' },
    { key: 'carsi', sky: ['#3a2216', '#6a3e24'], water: false },
    { key: 'sarnic', sky: ['#0a1216', '#1a2a30'], water: '#0f4a50' },
    { key: 'galata', sky: ['#e8735a', '#ffd08f'], water: false },
    { key: 'kopru', sky: ['#4a3a8a', '#f4937a'], water: '#24387a' },
    { key: 'catilar', sky: ['#0b1236', '#2c3170'], water: false },
    { key: 'camlica', sky: ['#070a1e', '#24205a'], water: false },
  ];
  const GROUND = [
    { top: '#7cc84e', topD: '#5aa63a', fill: '#c7ccd6', fillD: '#a8aeba', line: '#8e95a4' },   // Maslak: çim + granit
    { top: '#cfc3ad', topD: '#a99a82', fill: '#9a8b76', fillD: '#7c6e5c', line: '#5e5446' },   // Kadıköy: parke taşı
    { top: '#f4f2ea', topD: '#c8302a', fill: '#c48a52', fillD: '#a06c3a', line: '#7a4e26' },   // vapur güvertesi
    { top: '#f0dcb4', topD: '#c8a878', fill: '#e2c99c', fillD: '#c8ad80', line: '#a88c5e' },   // çarşı mermeri
    { top: '#7a8592', topD: '#5a636e', fill: '#4e5762', fillD: '#3c444e', line: '#2c323a' },   // sarnıç taşı
    { top: '#c4b496', topD: '#9a8a6e', fill: '#8e7e66', fillD: '#73654f', line: '#54493a' },   // Galata parke
    { top: '#8a909c', topD: '#f4c531', fill: '#555a66', fillD: '#454a55', line: '#33373f' },   // köprü asfaltı
    { top: '#d9774e', topD: '#b25a36', fill: '#a54e30', fillD: '#8a3e24', line: '#6a2c18' },   // kiremit
    { top: '#3ae0ff', topD: '#1a8ab0', fill: '#3c4352', fillD: '#2e3442', line: '#20252f' },   // metal ızgara
  ];
  const tileCache = cache();
  function tile(w, kind, extra) {
    const key = w + ':' + kind + ':' + (extra || '');
    let c = tileCache.get(key);
    if (!c) { c = mk(16, 16, (g) => drawTile(g, w, kind, extra)); tileCache.set(key, c); }
    return c;
  }
  function drawTile(g, w, kind, extra) {
    const C = GROUND[w];
    switch (kind) {
      case 'fill': groundFill(g, w, C); break;
      case 'surf': groundFill(g, w, C); groundTop(g, w, C); break;
      case 'solid': solidTile(g, w, false); break;
      case 'crack': solidTile(g, w, true); break;
      case 'oneway': {
        const cols = [['#9aa6b8', '#6a7488'], ['#b98a52', '#7a5428'], ['#f4f2ea', '#8a96a8'], ['#d8b884', '#8a6a3a'], ['#7a6a5a', '#4a3e34'], ['#a07a52', '#6a4a2a'], ['#d0603a', '#7a2e18'], ['#8a6a4a', '#4e3a26'], ['#5a6270', '#3ae0ff']][w];
        box(g, 0.2, 0.3, 15.6, 4.4, 1.6, cols[0], K, 0.8);
        g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(1.4, 1, 13, 0.8);
        g.fillStyle = cols[1]; g.fillRect(2.6, 4.7, 2, 3.4); g.fillRect(11.4, 4.7, 2, 3.4);
        break;
      }
      case 'block': {
        // komut bloğu: yuvarlak köşeli monitör, yeşil ">_"
        box(g, 0.5, 0.5, 15, 15, 2.6, '#d8dbe2');
        g.fillStyle = '#ffffff'; g.fillRect(2.4, 1.3, 11, 0.9);
        box(g, 2.3, 2.3, 11.4, 9.4, 1.4, '#0f241a', K, 0.6);
        g.strokeStyle = '#7cff6a'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(4.6, 4.6); g.lineTo(7, 7); g.lineTo(4.6, 9.4); g.stroke();
        if (extra !== 'off') { g.fillStyle = '#7cff6a'; g.fillRect(8.4, 8.6, 3.4, 1.3); }
        g.fillStyle = '#8a909c'; g.fillRect(5.5, 13, 5, 1.2);
        break;
      }
      case 'used': {
        box(g, 0.5, 0.5, 15, 15, 2.6, '#8a8f9a');
        box(g, 2.3, 2.3, 11.4, 9.4, 1.4, '#2a2e36', K, 0.6);
        g.fillStyle = '#5d6370'; g.fillRect(5.5, 13, 5, 1.2);
        break;
      }
      case 'spike': {
        // kısa devre: çıplak kablolar ve kıvılcım
        box(g, 0.3, 12, 15.4, 3.8, 1, '#4a4e58', K, 0.6);
        for (let k = 0; k < 4; k++) {
          const x = 2 + k * 4;
          poly(g, [x - 1.6, 12, x, 5.5, x + 1.6, 12], '#c9ccd4', K, 0.6);
          g.fillStyle = '#ffffff'; g.fillRect(x - 0.3, 7, 0.6, 2.4);
        }
        g.strokeStyle = '#ffe14a'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(2, 4.5); g.lineTo(4, 3); g.lineTo(5.6, 4.2); g.lineTo(8, 2.6); g.lineTo(10, 4); g.lineTo(12.6, 2.8); g.lineTo(14, 4.4); g.stroke();
        break;
      }
      case 'anchor': {
        box(g, 0.6, 0.6, 14.8, 14.8, 2.6, '#4a5468');
        circle(g, 8, 8, 4.4, null, '#3ae0ff', 1.6);
        poly(g, [11, 3.2, 13.8, 4, 12, 6.2], '#3ae0ff', null);
        circle(g, 8, 8, 1.6, '#3ae0ff', null);
        break;
      }
    }
  }
  function groundFill(g, w, C) {
    g.fillStyle = C.fill; g.fillRect(0, 0, 16, 16);
    const key = WORLD[w].key;
    if (key === 'kadikoy' || key === 'galata') {
      for (const [x, y, rx, ry] of [[4, 4, 3.4, 2.6], [11.5, 3.6, 3.6, 2.6], [8, 9.6, 3.4, 2.6], [1, 10, 2.4, 2.4], [15, 10, 2.4, 2.4], [4, 14.5, 3.4, 2], [12, 14.8, 3.4, 2]]) ellipse(g, x, y, rx, ry, C.fillD, C.line, 0.6);
    } else if (key === 'vapur') {
      for (let y = 0; y < 16; y += 4) { g.fillStyle = y % 8 ? C.fill : C.fillD; g.fillRect(0, y, 16, 4); g.fillStyle = C.line; g.fillRect(0, y + 3.6, 16, 0.4); g.fillRect((y * 5) % 16, y, 0.4, 3.6); }
    } else if (key === 'catilar') {
      for (let y = -1; y < 17; y += 4) for (let x = (y % 8 ? -4 : 0); x < 17; x += 8) { g.beginPath(); g.arc(x + 4, y + 1, 4, 0, Math.PI); g.fillStyle = C.fillD; g.fill(); g.strokeStyle = C.line; g.lineWidth = 0.5; g.stroke(); }
    } else if (key === 'camlica') {
      g.fillStyle = C.fillD; for (let i = 0; i < 16; i += 4) { g.fillRect(i, 0, 1, 16); g.fillRect(0, i, 16, 1); }
      g.fillStyle = 'rgba(58,224,255,0.15)'; g.fillRect(0, 0, 16, 16);
    } else if (key === 'carsi') {
      g.fillStyle = C.fillD; g.fillRect(0, 0, 8, 8); g.fillRect(8, 8, 8, 8);
      g.strokeStyle = C.line; g.lineWidth = 0.4; g.strokeRect(0, 0, 16, 16); g.strokeRect(0, 0, 8, 8); g.strokeRect(8, 8, 8, 8);
    } else {
      g.strokeStyle = C.line; g.lineWidth = 0.5; g.strokeRect(0.25, 0.25, 15.5, 15.5);
      g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0.5, 0.5, 15, 1);
      g.fillStyle = C.fillD; g.fillRect(3, 6, 2, 1); g.fillRect(10, 11, 3, 1);
    }
  }
  function groundTop(g, w, C) {
    const key = WORLD[w].key;
    switch (key) {
      case 'maslak':
        g.fillStyle = C.top; g.fillRect(0, 0, 16, 4.2);
        g.beginPath(); for (let x = 0; x <= 16; x += 2) { g.lineTo(x, 4.2 + (x % 4 ? 1.4 : 0.4)); } g.lineTo(16, 0); g.lineTo(0, 0); g.closePath(); g.fill();
        g.fillStyle = C.topD; g.fillRect(0, 3.2, 16, 0.8);
        g.fillStyle = '#a8e070'; g.fillRect(0, 0, 16, 1);
        break;
      case 'kadikoy': case 'galata':
        g.fillStyle = C.top; g.fillRect(0, 0, 16, 3); g.fillStyle = C.topD; g.fillRect(0, 2.4, 16, 1); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, 0, 16, 0.8);
        break;
      case 'vapur':
        g.fillStyle = '#ffffff'; g.fillRect(0, 0, 16, 2); g.fillStyle = C.topD; g.fillRect(0, 2, 16, 2.2); g.fillStyle = '#7a1e16'; g.fillRect(0, 4.2, 16, 0.6);
        break;
      case 'carsi':
        g.fillStyle = C.top; g.fillRect(0, 0, 16, 3); for (let x = 1; x < 16; x += 5) { g.fillStyle = '#2f6fb0'; g.fillRect(x, 0.8, 3, 1.4); }
        g.fillStyle = C.topD; g.fillRect(0, 3, 16, 0.6);
        break;
      case 'sarnic':
        g.fillStyle = C.top; g.fillRect(0, 0, 16, 2.6); g.fillStyle = 'rgba(160,200,220,0.5)'; g.fillRect(2, 0.4, 5, 0.6); g.fillRect(10, 0.4, 3, 0.6);
        break;
      case 'kopru':
        g.fillStyle = C.top; g.fillRect(0, 0, 16, 2); g.fillStyle = '#2a2d34'; g.fillRect(0, 2, 16, 0.6);
        g.fillStyle = C.topD; g.fillRect(2, 7, 7, 1.4);
        break;
      case 'catilar':
        g.fillStyle = '#6a3a26'; g.fillRect(0, 0, 16, 2.2); g.fillStyle = '#8a5a3e'; g.fillRect(0, 0, 16, 0.8);
        break;
      case 'camlica':
        g.shadowColor = '#3ae0ff'; g.shadowBlur = 2 * S; g.fillStyle = C.top; g.fillRect(0, 0, 16, 1.6); g.shadowBlur = 0;
        g.fillStyle = C.topD; g.fillRect(0, 1.6, 16, 0.8);
        break;
    }
  }
  function solidTile(g, w, cracked) {
    const key = WORLD[w].key;
    switch (key) {
      case 'maslak': {
        box(g, 0.4, 0.4, 15.2, 15.2, 1.6, grad(g, 0, 0, 16, 16, [[0, '#9ad8ff'], [0.5, '#4f9fd6'], [1, '#2f6fa6']]), '#24476a', 0.8);
        g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(8, 0.8); g.lineTo(8, 15.2); g.moveTo(0.8, 8); g.lineTo(15.2, 8); g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.55)'; poly(g, [2, 2, 5, 2, 2, 5], 'rgba(255,255,255,0.55)', null); poly(g, [9.5, 9.5, 12, 9.5, 9.5, 12], 'rgba(255,255,255,0.4)', null);
        break;
      }
      case 'kadikoy': {
        box(g, 0.5, 0.5, 15, 15, 1, '#c88e4e', '#5a3814', 0.8);
        for (const y of [1.4, 6.2, 11]) { g.fillStyle = '#d9a062'; g.fillRect(1.2, y, 13.6, 3.8); g.fillStyle = '#8a5a2a'; g.fillRect(1.2, y + 3.8, 13.6, 0.6); }
        g.fillStyle = '#8a5a2a'; g.fillRect(2.4, 1.2, 1, 13.6); g.fillRect(12.6, 1.2, 1, 13.6);
        break;
      }
      case 'vapur': {
        box(g, 0.4, 0.4, 15.2, 15.2, 1.6, '#f2f6f8', '#5a6270', 0.8);
        g.fillStyle = '#c8302a'; g.fillRect(0.8, 11.6, 14.4, 3.4);
        circle(g, 8, 6, 3.2, '#2a4a6a', '#5a6270', 0.9); circle(g, 7, 5, 0.9, 'rgba(255,255,255,0.7)', null);
        break;
      }
      case 'carsi': {
        box(g, 0.4, 0.4, 15.2, 15.2, 0.8, '#f6f2e8', '#1a3a6a', 0.8);
        g.strokeStyle = '#2f6fb0'; g.lineWidth = 1; g.strokeRect(1.6, 1.6, 12.8, 12.8);
        // lale
        lin(g, 8, 13, 8, 7.5, '#2a8a5a', 0.9);
        ellipse(g, 6.2, 10.6, 1.8, 0.8, '#2a8a5a', null, 0, -0.6); ellipse(g, 9.8, 10.6, 1.8, 0.8, '#2a8a5a', null, 0, 0.6);
        g.beginPath(); g.moveTo(5.8, 5); g.quadraticCurveTo(5.8, 8.4, 8, 8.4); g.quadraticCurveTo(10.2, 8.4, 10.2, 5); g.lineTo(9.1, 6.2); g.lineTo(8, 4.2); g.lineTo(6.9, 6.2); g.closePath(); fs(g, '#d2302a', K, 0.5);
        for (const [x, y] of [[3.4, 3.4], [12.6, 3.4], [3.4, 12.6], [12.6, 12.6]]) circle(g, x, y, 0.9, '#3aa0c8', null);
        break;
      }
      case 'sarnic': {
        g.fillStyle = '#3a2a22'; g.fillRect(0, 0, 16, 16);
        for (let y = 0; y < 16; y += 4) for (let x = (y % 8 ? -4 : 0); x < 16; x += 8) box(g, x + 0.6, y + 0.6, 6.8, 2.8, 0.6, y % 8 ? '#8a5e48' : '#7a5240', null);
        break;
      }
      case 'galata': {
        g.fillStyle = '#6e604c'; g.fillRect(0, 0, 16, 16);
        for (const [x, y, ww, h] of [[0.6, 0.6, 8.8, 6.4], [10, 0.6, 5.4, 6.4], [0.6, 7.6, 5.4, 7.8], [6.6, 7.6, 8.8, 7.8]]) box(g, x, y, ww, h, 1, '#c4b294', null);
        g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(1.2, 1.1, 7, 0.6); g.fillRect(7.2, 8.1, 7, 0.6);
        break;
      }
      case 'kopru': {
        // köprü kulesi çeliği: açık gri, çapraz kuşaklı, perçinli
        box(g, 0.4, 0.4, 15.2, 15.2, 1, '#cfd4de', '#4a505e', 0.8);
        g.fillStyle = '#e8ebf1'; g.fillRect(1, 1, 14, 2); g.fillStyle = '#9aa1b0'; g.fillRect(1, 13, 14, 2);
        g.strokeStyle = '#9aa1b0'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(2.4, 3.6); g.lineTo(13.6, 12.4); g.moveTo(13.6, 3.6); g.lineTo(2.4, 12.4); g.stroke();
        for (const [x, y] of [[2.4, 2], [13.6, 2], [2.4, 14], [13.6, 14]]) circle(g, x, y, 0.7, '#6a7180', null);
        break;
      }
      case 'catilar': {
        g.fillStyle = '#4a2418'; g.fillRect(0, 0, 16, 16);
        for (let y = 0; y < 16; y += 4) for (let x = (y % 8 ? -4 : 0); x < 16; x += 8) box(g, x + 0.5, y + 0.5, 7, 3, 0.5, y % 8 ? '#a6583e' : '#94503a', null);
        break;
      }
      case 'camlica': {
        box(g, 0.4, 0.4, 15.2, 15.2, 1.6, '#2a3040', '#11141c', 0.8);
        g.shadowColor = '#3ae0ff'; g.shadowBlur = 2 * S;
        g.strokeStyle = '#3ae0ff'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(3, 4); g.lineTo(9.5, 4); g.lineTo(9.5, 8.5); g.lineTo(13, 8.5); g.moveTo(3, 12); g.lineTo(6.5, 12); g.lineTo(6.5, 9.5); g.stroke();
        g.shadowBlur = 0;
        circle(g, 13, 8.5, 1, '#7cff6a', null); circle(g, 3, 4, 0.9, '#3ae0ff', null);
        break;
      }
    }
    if (cracked) {
      g.strokeStyle = 'rgba(20,12,8,0.85)'; g.lineWidth = 0.9;
      g.beginPath(); g.moveTo(8.5, 0); g.lineTo(7, 3.4); g.lineTo(9.4, 5.6); g.lineTo(6.2, 8.6); g.lineTo(8.4, 10.6); g.lineTo(5.4, 14); g.lineTo(6.2, 16);
      g.moveTo(9.4, 5.6); g.lineTo(12.6, 6.6); g.moveTo(6.2, 8.6); g.lineTo(2.8, 9.4); g.stroke();
    }
  }
  // kayıt noktası (16×32), DEPLOY terminali (16×32), asansör (48×6)
  function drawCheckpoint(g, x, y, on, t) {
    lin(g, x + 8, y + 31, x + 8, y + 8, K, 2.2); lin(g, x + 8, y + 31, x + 8, y + 8, '#9aa3b2', 1.2);
    box(g, x + 4, y + 29.6, 8, 2.4, 1, '#5d6575', K, 0.6);
    const glow = on ? 0.5 + Math.sin(t * 6) * 0.3 : 0;
    if (on) { g.save(); g.shadowColor = '#7cff6a'; g.shadowBlur = 6 * S * glow; }
    circle(g, x + 8, y + 7, 5, on ? '#3fae2c' : '#8a909c');
    if (on) g.restore();
    circle(g, x + 8, y + 7, 3, on ? '#7cff6a' : '#c9ccd4', null);
    if (on) { g.strokeStyle = '#ffffff'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x + 6.2, y + 7); g.lineTo(x + 7.6, y + 8.4); g.lineTo(x + 10, y + 5.6); g.stroke(); }
  }
  function drawDeploy(g, x, y, t, progress) {
    box(g, x + 0.5, y + 0.5, 15, 31, 2.2, '#3a3e48');
    box(g, x + 2, y + 2, 12, 9, 1, '#0f241a', K, 0.6);
    g.fillStyle = '#7cff6a';
    if (progress !== undefined) { g.fillRect(x + 3, y + 8, 10 * progress, 1.6); }
    else { g.fillRect(x + 3, y + 3.5, 6, 1); g.fillRect(x + 3, y + 5.5, 8, 1); if (Math.floor(t * 3) % 2) g.fillRect(x + 3, y + 7.5, 3, 1); }
    for (let k = 0; k < 2; k++) {
      box(g, x + 2, y + 13 + k * 4, 12, 3, 0.6, '#22262e', null);
      for (let j = 0; j < 4; j++) circle(g, x + 3.6 + j * 2.4, y + 14.5 + k * 4, 0.5, (Math.floor(t * 5 + j + k) % 3) ? '#3fae2c' : '#7cff6a', null);
    }
    circle(g, x + 8, y + 25, 3.4, '#2a8a2a'); circle(g, x + 8, y + 24.5, 2.6, '#7cff6a', null); circle(g, x + 7.2, y + 23.6, 0.8, 'rgba(255,255,255,0.8)', null);
  }
  function drawLift(g, x, y, w) {
    box(g, x, y, w, 5.4, 1.4, '#9aa6b8');
    g.save(); rr(g, x, y, w, 5.4, 1.4); g.clip();
    for (let k = 0; k < w; k += 4) poly(g, [x + k, y + 5.4, x + k + 2, y + 3.6, x + k + 4, y + 3.6, x + k + 2, y + 5.4], '#f4c531', null);
    g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(x, y + 0.6, w, 0.8);
    g.restore();
    rr(g, x, y, w, 5.4, 1.4); fs(g, null, K, 0.8);
  }

  // ---------------- hatıra parçaları (her dünyadan bir tane) ----------------
  // 0 Maslak camı, 1 Kadıköy'den martı tüyü, 2 vapur çanı, 3 çarşı nazarı, 4 sarnıç damlası, 5 Galata Kulesi, 6 köprü, 7 kedi, 8 lale
  const PIECES = ['cam', 'tuy', 'can', 'nazar', 'damla', 'kule', 'kopru', 'kedi', 'lale'];
  function drawPiece(g, i, cx, cy, s, t) {
    s = s || 1; t = t || 0;
    g.save(); g.translate(cx, cy); g.scale(s, s);
    switch (PIECES[i]) {
      case 'cam':
        poly(g, [-4, 6, -6, -2, 0, -7, 6, -3, 4, 6], grad(g, -6, -7, 6, 6, [[0, '#d8f2ff'], [0.5, '#7ac0e8'], [1, '#3a7ab0']]), K, 0.8);
        poly(g, [-3, 3, -4, -1, -1, -4], 'rgba(255,255,255,0.7)', null);
        break;
      case 'tuy':
        g.save(); g.rotate(-0.6);
        g.beginPath(); g.moveTo(0, -8); g.quadraticCurveTo(5, -3, 3, 6); g.lineTo(0, 7); g.lineTo(-3, 6); g.quadraticCurveTo(-5, -3, 0, -8); g.closePath();
        fs(g, grad(g, -4, -8, 4, 7, [[0, '#ffffff'], [0.7, '#e2e6ee'], [1, '#8a909c']]), K, 0.8);
        g.strokeStyle = 'rgba(120,128,140,0.7)'; g.lineWidth = 0.4;
        for (let k = -5; k < 5; k += 2) { g.beginPath(); g.moveTo(0, k); g.lineTo(3, k - 2); g.moveTo(0, k); g.lineTo(-3, k - 2); g.stroke(); }
        lin(g, 0, -7, 0, 10, '#6a707c', 0.7);
        g.restore();
        break;
      case 'can':
        g.beginPath(); g.moveTo(-6, 4); g.quadraticCurveTo(-5.4, -5.4, 0, -5.6); g.quadraticCurveTo(5.4, -5.4, 6, 4); g.closePath();
        fs(g, grad(g, -6, 0, 6, 0, [[0, '#b8862e'], [0.4, '#f4cc5a'], [1, '#9a6a1e']]), K, 0.8);
        box(g, -7, 3.4, 14, 2.4, 1, '#c8962e', K, 0.7); circle(g, 0, 6.6, 1.5, '#7a5418', K, 0.6);
        g.strokeStyle = K; g.lineWidth = 0.8; g.beginPath(); g.arc(0, -6.6, 1.6, Math.PI, 0); g.stroke();
        break;
      case 'nazar':
        circle(g, 0, 0, 6.6, '#1e5ad8', K, 0.8); circle(g, 0, 0, 4.4, '#ffffff', null); circle(g, 0, 0, 2.8, '#7ac8ff', null); circle(g, 0, 0, 1.4, '#10122a', null);
        circle(g, -2.6, -3, 1, 'rgba(255,255,255,0.8)', null);
        break;
      case 'damla':
        g.beginPath(); g.moveTo(0, -7); g.bezierCurveTo(4, -2, 5.6, 1, 5.6, 2.6); g.arc(0, 2.6, 5.6, 0, Math.PI); g.bezierCurveTo(-5.6, 1, -4, -2, 0, -7); g.closePath();
        fs(g, grad(g, 0, -7, 0, 8, [[0, '#8af0e8'], [1, '#1a8a96']]), K, 0.8);
        ellipse(g, -2, 1.6, 1.2, 2.2, 'rgba(255,255,255,0.7)', null, 0, 0.3);
        break;
      case 'kule':
        poly(g, [-4, 7, 4, 7, 3.4, -2, -3.4, -2], '#d8c8ae', K, 0.8);
        box(g, -4.4, -3.4, 8.8, 1.8, 0.4, '#a89478', K, 0.5);
        poly(g, [-3.8, -3.4, 3.8, -3.4, 0, -10], '#4e5a70', K, 0.8);
        for (const y of [0, 3.6]) box(g, -1, y, 2, 2.4, 1, '#4a4036', null);
        break;
      case 'kopru':
        g.strokeStyle = '#e8ecf2'; g.lineWidth = 1; g.beginPath(); g.moveTo(-7, 0); g.quadraticCurveTo(-4.6, -1, -4.4, -7); g.quadraticCurveTo(0, 1, 4.4, -7); g.quadraticCurveTo(4.6, -1, 7, 0); g.stroke();
        for (const x of [-4.4, 4.4]) box(g, x - 0.9, -8, 1.8, 13, 0.4, '#c8ccd6', K, 0.6);
        box(g, -8, 1, 16, 2, 0.6, '#9aa0ac', K, 0.6);
        break;
      case 'kedi':
        ellipse(g, 0, 3, 4.6, 4, '#f0a050', K, 0.8);
        circle(g, 1.2, -3.4, 3.6, '#f0a050', K, 0.8);
        poly(g, [-1.6, -5.6, -1.2, -9, 1, -6.4], '#f0a050', K, 0.6); poly(g, [2, -6.6, 4, -9, 4.4, -5.2], '#f0a050', K, 0.6);
        g.strokeStyle = K; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-4, 5); g.quadraticCurveTo(-8, 4, -6.6, -1); g.stroke();
        circle(g, 0.2, -3.6, 0.5, K, null); circle(g, 2.6, -3.6, 0.5, K, null);
        lin(g, -2.6, 1, -2.6, 6, '#d07a30', 0.8);
        break;
      case 'lale':
        lin(g, 0, 7.6, 0, -1, '#2a8a3a', 1.2);
        ellipse(g, -2.6, 4, 1.4, 3.6, '#3aa04a', K, 0.5, -0.6); ellipse(g, 2.6, 4.4, 1.4, 3.6, '#3aa04a', K, 0.5, 0.6);
        g.beginPath(); g.moveTo(-4, -7); g.quadraticCurveTo(-4.4, -0.4, 0, -0.4); g.quadraticCurveTo(4.4, -0.4, 4, -7); g.lineTo(2, -4.6); g.lineTo(0, -8); g.lineTo(-2, -4.6); g.closePath();
        fs(g, grad(g, -4, -8, 4, 0, [[0, '#ff5a5a'], [1, '#b81a2a']]), K, 0.8);
        break;
    }
    g.restore();
  }

  root.BA_ART = {
    PIECES, drawPiece,
    K, setScale, get S() { return S; }, mk, rr, box, circle, ellipse, poly, lin, limb, grad, rng, shade, eye, fs,
    WORLD, GROUND, tile, drawHero, drawHead, drawSimit, drawItem, drawShot, drawBug, drawVirus, drawSpam, drawMarti, drawSpark,
    drawBoss, crown, drawCheckpoint, drawDeploy, drawLift, cache, clearAll,
  };
})(window);
