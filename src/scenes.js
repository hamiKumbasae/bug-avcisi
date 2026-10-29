// Bug Avcısı: İstanbul — arka planlar. Her dünyada ilk bakışta tanınan bir İstanbul simgesi var.
// Katmanlar 512 mantıksal piksel genişliğinde, kenarlardan kesintisiz tekrarlanır.
(function (root) {
  'use strict';
  const A = root.BA_ART;
  const { lin, rng } = A;
  const TAU = Math.PI * 2;
  const W = 512, H = 240;

  // ---------- renk ----------
  function hex(c) { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function mix(a, b, t) {
    const x = hex(a), y = hex(b);
    return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }

  // ---------- çizim kalemi: katmana göre dış çizgi ----------
  let OL = null, OW = 0.5;
  function pen(line, w) { OL = line; OW = w || 0.5; }
  function fsx(g, fill) { if (fill) { g.fillStyle = fill; g.fill(); } if (OL) { g.strokeStyle = OL; g.lineWidth = OW; g.stroke(); } }
  function B(g, x, y, w, h, r, f) { A.rr(g, x, y, w, h, r); fsx(g, f); }
  function C(g, x, y, r, f) { g.beginPath(); g.arc(x, y, Math.max(0.01, r), 0, TAU); fsx(g, f); }
  function E(g, x, y, rx, ry, f, rot) { g.beginPath(); g.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot || 0, 0, TAU); fsx(g, f); }
  function P(g, pts, f) { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); fsx(g, f); }
  function rect(g, x, y, w, h, f) { g.fillStyle = f; g.fillRect(x, y, w, h); }
  function archWin(g, x, y, w, h, col) {
    g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath();
    g.fillStyle = col; g.fill();
  }

  // ---------- İstanbul parçaları ----------
  // pal: { wall, wallD, roof, trim, win, lit }
  function dome(g, cx, by, r, pal, flat, noAlem) {
    flat = flat || 1;
    g.beginPath(); g.ellipse(cx, by, r, r * flat, 0, Math.PI, 0); g.closePath(); fsx(g, pal.roof);
    if (pal.roofL) {
      g.save(); g.beginPath(); g.ellipse(cx, by, r, r * flat, 0, Math.PI, 0); g.closePath(); g.clip();
      g.fillStyle = pal.roofL; g.beginPath(); g.ellipse(cx - r * 0.45, by - r * flat * 0.5, r * 0.4, r * flat * 0.75, -0.5, 0, TAU); g.fill();
      g.restore();
    }
    if (!noAlem) {
      const t = by - r * flat;
      lin(g, cx, t, cx, t - Math.max(1.4, r * 0.32), pal.alem || pal.roof, Math.max(0.35, r * 0.07));
      if (r > 6) { g.strokeStyle = pal.alem || pal.roof; g.lineWidth = Math.max(0.3, r * 0.05); g.beginPath(); g.arc(cx, t - r * 0.36, r * 0.08, -0.3, Math.PI + 0.3, true); g.stroke(); }
    }
  }
  function minaret(g, x, by, h, w, pal, n) {
    n = n === undefined ? 2 : n;
    const capH = w * 3.6, top = by - h, st = top + capH;
    P(g, [x - w / 2, by, x + w / 2, by, x + w * 0.4, st, x - w * 0.4, st], pal.wall);
    if (pal.wallD) { g.fillStyle = pal.wallD; g.beginPath(); g.moveTo(x + w * 0.1, by); g.lineTo(x + w / 2, by); g.lineTo(x + w * 0.4, st); g.lineTo(x + w * 0.08, st); g.closePath(); g.fill(); }
    for (let i = 0; i < n; i++) {
      const y = st + (h - capH) * (0.08 + i * 0.16);
      B(g, x - w * 0.85, y, w * 1.7, Math.max(0.7, w * 0.5), w * 0.2, pal.trim || pal.wall);
      if (pal.lit) rect(g, x - w * 0.7, y + w * 0.5, w * 1.4, Math.max(0.4, w * 0.25), pal.lit);
    }
    P(g, [x - w * 0.5, st, x + w * 0.5, st, x, top], pal.roof);
    lin(g, x, top, x, top - w * 1.2, pal.alem || pal.roof, Math.max(0.3, w * 0.22));
  }
  function windowsRow(g, x0, x1, y, w, h, gap, col) { for (let x = x0; x + w <= x1 + 0.01; x += w + gap) archWin(g, x, y, w, h, col); }
  // Sultanahmet (Mavi Cami): basamaklanan kubbeler, altı minare
  function blueMosque(g, cx, by, s, pal) {
    const m = (dx, h, n) => minaret(g, cx + dx * s, by, h * s, 2.5 * s, pal, n);
    m(-70, 60, 2); m(70, 60, 2); m(-52, 74, 3); m(52, 74, 3); m(-36, 74, 3); m(36, 74, 3);
    B(g, cx - 66 * s, by - 9 * s, 132 * s, 9 * s, 0, pal.wall);
    for (let k = -6; k <= 6; k++) if (Math.abs(k) > 3) dome(g, cx + k * 9.6 * s, by - 9 * s, 3.4 * s, pal, 1, true);
    B(g, cx - 31 * s, by - 22 * s, 62 * s, 22 * s, 0, pal.wall);
    if (pal.win) windowsRow(g, cx - 27 * s, cx + 27 * s, by - 18 * s, 3 * s, 6 * s, 3.4 * s, pal.win);
    dome(g, cx - 27 * s, by - 22 * s, 4.4 * s, pal, 1, true); dome(g, cx + 27 * s, by - 22 * s, 4.4 * s, pal, 1, true);
    dome(g, cx - 18 * s, by - 24 * s, 9.5 * s, pal, 0.95); dome(g, cx + 18 * s, by - 24 * s, 9.5 * s, pal, 0.95);
    B(g, cx - 15 * s, by - 32 * s, 30 * s, 8 * s, 0, pal.wall);
    if (pal.win) windowsRow(g, cx - 13 * s, cx + 13 * s, by - 30.5 * s, 1.8 * s, 4 * s, 1.6 * s, pal.win);
    dome(g, cx, by - 32 * s, 16.5 * s, pal, 0.9);
  }
  // Ayasofya: yayvan büyük kubbe, payandalar, iki kalın iki ince minare, pembe duvar
  function hagiaSophia(g, cx, by, s, pal) {
    const brick = pal.brick || pal.wall;
    minaret(g, cx - 48 * s, by, 62 * s, 2.4 * s, pal, 2); minaret(g, cx + 48 * s, by, 62 * s, 2.4 * s, pal, 2);
    minaret(g, cx - 40 * s, by, 50 * s, 3.6 * s, { ...pal, wall: brick }, 1); minaret(g, cx + 40 * s, by, 54 * s, 3.2 * s, pal, 2);
    B(g, cx - 36 * s, by - 24 * s, 72 * s, 24 * s, 0, pal.wall);
    B(g, cx - 42 * s, by - 16 * s, 8 * s, 16 * s, 0, pal.wallD || pal.wall); B(g, cx + 34 * s, by - 16 * s, 8 * s, 16 * s, 0, pal.wallD || pal.wall);
    P(g, [cx - 42 * s, by - 16 * s, cx - 34 * s, by - 16 * s, cx - 34 * s, by - 24 * s], pal.wallD || pal.wall);
    P(g, [cx + 34 * s, by - 16 * s, cx + 42 * s, by - 16 * s, cx + 34 * s, by - 24 * s], pal.wallD || pal.wall);
    if (pal.win) windowsRow(g, cx - 30 * s, cx + 30 * s, by - 18 * s, 3.4 * s, 7 * s, 4 * s, pal.win);
    B(g, cx - 25 * s, by - 31 * s, 50 * s, 7 * s, 0, pal.wall);
    dome(g, cx - 21 * s, by - 31 * s, 11 * s, pal, 0.55, true); dome(g, cx + 21 * s, by - 31 * s, 11 * s, pal, 0.55, true);
    B(g, cx - 18 * s, by - 36 * s, 36 * s, 5 * s, 0, pal.wall);
    if (pal.win) windowsRow(g, cx - 16 * s, cx + 16 * s, by - 35.2 * s, 1.6 * s, 3.2 * s, 1.4 * s, pal.win);
    dome(g, cx, by - 36 * s, 20 * s, pal, 0.52);
  }
  // Süleymaniye / Yeni Cami tipi: tek büyük kubbe, dört minare
  function hillMosque(g, cx, by, s, pal) {
    minaret(g, cx - 34 * s, by, 64 * s, 2.4 * s, pal, 3); minaret(g, cx + 34 * s, by, 64 * s, 2.4 * s, pal, 3);
    minaret(g, cx - 46 * s, by, 50 * s, 2.2 * s, pal, 2); minaret(g, cx + 46 * s, by, 50 * s, 2.2 * s, pal, 2);
    B(g, cx - 40 * s, by - 10 * s, 80 * s, 10 * s, 0, pal.wall);
    B(g, cx - 26 * s, by - 22 * s, 52 * s, 13 * s, 0, pal.wall);
    if (pal.win) windowsRow(g, cx - 23 * s, cx + 23 * s, by - 19 * s, 2.6 * s, 5 * s, 2.6 * s, pal.win);
    dome(g, cx - 18 * s, by - 22 * s, 8 * s, pal, 0.9); dome(g, cx + 18 * s, by - 22 * s, 8 * s, pal, 0.9);
    B(g, cx - 13 * s, by - 28 * s, 26 * s, 6 * s, 0, pal.wall);
    dome(g, cx, by - 28 * s, 14 * s, pal, 0.92);
  }
  function flag(g, x, y, s) {
    lin(g, x, y, x, y + 14 * s, '#d8dde6', 0.6 * s);
    const w = 9 * s, h = 6 * s;
    g.fillStyle = '#e30a17'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 1 * s, x + w, y + 0.6 * s); g.lineTo(x + w, y + h + 0.6 * s); g.quadraticCurveTo(x + w / 2, y + h - 1 * s, x, y + h); g.closePath(); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x + w * 0.38, y + h / 2, h * 0.3, 0, TAU); g.fill();
    g.fillStyle = '#e30a17'; g.beginPath(); g.arc(x + w * 0.44, y + h / 2, h * 0.24, 0, TAU); g.fill();
    star(g, x + w * 0.66, y + h / 2, h * 0.13, '#ffffff');
  }
  function star(g, x, y, r, col) {
    g.fillStyle = col; g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r * 0.42 : r; g.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); }
    g.closePath(); g.fill();
  }
  // Galata Kulesi: taş gövde, sivri külah, kemerli pencereli seyir katı
  function galataTower(g, cx, by, s, pal) {
    const bw = 17 * s, tw = 15 * s, bodyH = 50 * s, top = by - bodyH;
    P(g, [cx - bw / 2, by, cx + bw / 2, by, cx + tw / 2, top, cx - tw / 2, top], pal.wall);
    g.save(); g.beginPath(); g.moveTo(cx + 1 * s, by); g.lineTo(cx + bw / 2, by); g.lineTo(cx + tw / 2, top); g.lineTo(cx + 1 * s, top); g.closePath(); g.fillStyle = pal.wallD; g.fill(); g.restore();
    if (pal.win) for (let y = top + 6 * s; y < by - 6 * s; y += 9 * s) { archWin(g, cx - 4.5 * s, y, 2.2 * s, 4 * s, pal.win); archWin(g, cx + 2.4 * s, y + 3 * s, 2.2 * s, 4 * s, pal.win); }
    B(g, cx - tw / 2 - 2.2 * s, top - 2 * s, tw + 4.4 * s, 2.4 * s, 0.6 * s, pal.trim);
    if (pal.trimD) for (let k = 0; k < 7; k++) rect(g, cx - tw / 2 - 1.6 * s + k * (tw + 3.2 * s) / 6.6, top - 1.6 * s, 0.6 * s, 1.6 * s, pal.trimD);
    B(g, cx - tw / 2 + 0.4 * s, top - 11 * s, tw - 0.8 * s, 9 * s, 0, pal.wall);
    for (let k = 0; k < 4; k++) archWin(g, cx - tw / 2 + 1.8 * s + k * 3.2 * s, top - 9.6 * s, 2 * s, 6.4 * s, pal.lit || pal.win || pal.wallD);
    B(g, cx - tw / 2 - 0.6 * s, top - 12.4 * s, tw + 1.2 * s, 1.6 * s, 0, pal.trim);
    P(g, [cx - tw / 2 - 0.8 * s, top - 12.2 * s, cx + tw / 2 + 0.8 * s, top - 12.2 * s, cx, top - 34 * s], pal.roof);
    if (pal.roofL) { g.fillStyle = pal.roofL; g.beginPath(); g.moveTo(cx - tw / 2 + 1 * s, top - 12.4 * s); g.lineTo(cx - 1.4 * s, top - 12.4 * s); g.lineTo(cx, top - 33 * s); g.closePath(); g.fill(); }
    lin(g, cx, top - 34 * s, cx, top - 38 * s, pal.roof, 0.5 * s);
  }
  // Kız Kulesi: kayalık adacık, beyaz yapı, kurşun külahlı fener kulesi
  function maidensTower(g, cx, by, s, pal) {
    E(g, cx, by + 1 * s, 26 * s, 5 * s, pal.rock);
    E(g, cx - 12 * s, by - 0.5 * s, 9 * s, 3.4 * s, pal.rockL || pal.rock);
    B(g, cx - 18 * s, by - 10 * s, 36 * s, 10 * s, 0.6 * s, pal.wall);
    rect(g, cx - 18 * s, by - 10 * s, 36 * s, 1.2 * s, pal.trim);
    if (pal.win) windowsRow(g, cx - 15 * s, cx + 15 * s, by - 7.6 * s, 2 * s, 4.4 * s, 2.4 * s, pal.win);
    dome(g, cx - 11 * s, by - 10 * s, 4.6 * s, pal, 1, true);
    B(g, cx - 1 * s, by - 26 * s, 11 * s, 16 * s, 0, pal.wall);
    if (pal.win) { archWin(g, cx + 1 * s, by - 23 * s, 2.4 * s, 5 * s, pal.win); archWin(g, cx + 5.6 * s, by - 23 * s, 2.4 * s, 5 * s, pal.win); }
    B(g, cx - 2.2 * s, by - 27.4 * s, 13.4 * s, 1.8 * s, 0, pal.trim);
    B(g, cx + 0.6 * s, by - 33 * s, 7.8 * s, 5.8 * s, 0, pal.wall);
    for (let k = 0; k < 3; k++) archWin(g, cx + 1.4 * s + k * 2.4 * s, by - 32.2 * s, 1.5 * s, 3.6 * s, pal.lit || pal.win || pal.wallD);
    P(g, [cx - 0.2 * s, by - 33 * s, cx + 9.2 * s, by - 33 * s, cx + 4.5 * s, by - 42 * s], pal.roof);
    lin(g, cx + 4.5 * s, by - 42 * s, cx + 4.5 * s, by - 45 * s, pal.roof, 0.5 * s);
    if (pal.flag) flag(g, cx - 16 * s, by - 24 * s, s * 0.8);
  }
  // Boğaz Köprüsü: iki ince kule, sarkan ana halat, zikzak askılar
  function bridge(g, x0, x1, deckY, topY, pal) {
    const t1 = x0 + (x1 - x0) * 0.15, t2 = x1 - (x1 - x0) * 0.15;
    const low = deckY - 4, cy = 2 * low - topY;
    const cab = (x) => { const t = (x - t1) / (t2 - t1); return (1 - t) * (1 - t) * topY + 2 * t * (1 - t) * cy + t * t * topY; };
    g.lineCap = 'round';
    // askılar
    g.strokeStyle = pal.hang || pal.cable; g.lineWidth = 0.35;
    g.beginPath();
    const n = 18;
    for (let i = 0; i < n; i++) {
      const xa = t1 + (t2 - t1) * (i + 0.5) / n, xb = t1 + (t2 - t1) * (i + 1.5) / n;
      g.moveTo(xa, cab(xa)); g.lineTo(i % 2 ? xb : xa + (xb - xa) * 0.0, deckY);
      if (i < n - 1) { g.moveTo(xa, cab(xa)); g.lineTo(xb, deckY); }
    }
    for (const [a, b] of [[x0, t1], [t2, x1]]) for (let k = 1; k < 5; k++) {
      const x = a + (b - a) * k / 5, yc = a === x0 ? deckY + (topY - deckY) * Math.pow(k / 5, 1.6) : deckY + (topY - deckY) * Math.pow(1 - k / 5, 1.6);
      g.moveTo(x, yc); g.lineTo(x + 2, deckY);
    }
    g.stroke();
    // ana halat
    g.strokeStyle = pal.cable; g.lineWidth = 0.9;
    g.beginPath(); g.moveTo(x0, deckY + 2); g.quadraticCurveTo((x0 + t1) / 2, deckY - 4, t1, topY); g.quadraticCurveTo((t1 + t2) / 2, cy, t2, topY); g.quadraticCurveTo((t2 + x1) / 2, deckY - 4, x1, deckY + 2); g.stroke();
    // tabliye
    rect(g, x0 - 4, deckY, x1 - x0 + 8, 2.4, pal.deck);
    // kuleler
    for (const tx of [t1, t2]) {
      rect(g, tx - 2.2, topY - 2, 4.4, H - topY, pal.tower);
      for (const y of [topY + 3, topY + (deckY - topY) * 0.45, deckY + 6]) rect(g, tx - 3, y, 6, 1.6, pal.towerD || pal.tower);
      if (pal.light) { g.fillStyle = '#ff4a4a'; g.beginPath(); g.arc(tx, topY - 2.6, 0.9, 0, TAU); g.fill(); }
    }
    if (pal.leds) {
      for (let x = x0; x <= x1; x += 4) { const c = pal.leds[Math.floor(x / 4) % pal.leds.length]; g.fillStyle = c; g.fillRect(x, deckY + 0.6, 1.4, 1.2); }
      for (let x = t1 + 3; x < t2; x += 5) { g.fillStyle = pal.leds[0]; g.beginPath(); g.arc(x, cab(x), 0.55, 0, TAU); g.fill(); }
    }
  }
  // Ortaköy Camii: beyaz barok, büyük kemerli pencereler, iki ince minare
  function ortakoy(g, cx, by, s, pal) {
    minaret(g, cx - 21 * s, by, 50 * s, 2.3 * s, pal, 1); minaret(g, cx + 21 * s, by, 50 * s, 2.3 * s, pal, 1);
    B(g, cx - 32 * s, by - 9 * s, 18 * s, 9 * s, 0, pal.wallD);
    B(g, cx - 15 * s, by - 25 * s, 30 * s, 25 * s, 0, pal.wall);
    for (const dx of [-15, 12]) rect(g, cx + dx * s, by - 25 * s, 3 * s, 25 * s, pal.wallD);
    archWin(g, cx - 9 * s, by - 21 * s, 7 * s, 15 * s, pal.win); archWin(g, cx + 2 * s, by - 21 * s, 7 * s, 15 * s, pal.win);
    B(g, cx - 16 * s, by - 26.6 * s, 32 * s, 2 * s, 0, pal.trim);
    B(g, cx - 11 * s, by - 32 * s, 22 * s, 6 * s, 0, pal.wall);
    windowsRow(g, cx - 9.4 * s, cx + 9.4 * s, by - 31 * s, 2 * s, 4.2 * s, 1.6 * s, pal.win);
    dome(g, cx, by - 32 * s, 11.5 * s, pal, 0.85);
  }
  // Haydarpaşa Garı: uzun taş bina, iki ucunda sivri külahlı kuleler
  function haydarpasa(g, x, by, s, pal) {
    const w = 104 * s;
    B(g, x, by - 26 * s, w, 26 * s, 0, pal.wall);
    P(g, [x + 2 * s, by - 26 * s, x + w - 2 * s, by - 26 * s, x + w - 8 * s, by - 33 * s, x + 8 * s, by - 33 * s], pal.roof);
    P(g, [x + w / 2 - 12 * s, by - 26 * s, x + w / 2 + 12 * s, by - 26 * s, x + w / 2, by - 36 * s], pal.wallD);
    for (let r = 0; r < 2; r++) for (let k = 0; k < 13; k++) archWin(g, x + 14 * s + k * 6 * s, by - 22 * s + r * 10 * s, 2.6 * s, 6 * s, pal.win);
    for (const tx of [x - 5 * s, x + w - 11 * s]) {
      B(g, tx, by - 40 * s, 16 * s, 40 * s, 0, pal.wall);
      rect(g, tx + 10 * s, by - 40 * s, 6 * s, 40 * s, pal.wallD);
      for (let k = 0; k < 3; k++) archWin(g, tx + 5 * s, by - 34 * s + k * 10 * s, 4 * s, 7 * s, pal.win);
      B(g, tx - 1 * s, by - 41.6 * s, 18 * s, 2 * s, 0, pal.trim);
      P(g, [tx - 0.6 * s, by - 41.4 * s, tx + 16.6 * s, by - 41.4 * s, tx + 8 * s, by - 60 * s], pal.roof);
      lin(g, tx + 8 * s, by - 60 * s, tx + 8 * s, by - 63 * s, pal.roof, 0.5 * s);
    }
  }
  // Çamlıca Kulesi: ince gövde, lale biçimli tepe, anten
  function camlicaTower(g, cx, by, s, pal) {
    P(g, [cx - 7 * s, by, cx + 7 * s, by, cx + 3.2 * s, by - 100 * s, cx - 3.2 * s, by - 100 * s], pal.wall);
    rect(g, cx + 0.6 * s, by - 100 * s, 2.6 * s, 100 * s, pal.wallD);
    const y0 = by - 100 * s;
    g.beginPath();
    g.moveTo(cx - 3.2 * s, y0);
    g.bezierCurveTo(cx - 14 * s, y0 - 8 * s, cx - 13 * s, y0 - 26 * s, cx - 4 * s, y0 - 36 * s);
    g.lineTo(cx + 4 * s, y0 - 36 * s);
    g.bezierCurveTo(cx + 13 * s, y0 - 26 * s, cx + 14 * s, y0 - 8 * s, cx + 3.2 * s, y0);
    g.closePath(); fsx(g, pal.glass);
    g.save(); g.clip();
    for (let k = 0; k < 7; k++) rect(g, cx - 14 * s, y0 - 5 * s - k * 4.6 * s, 28 * s, 1.1 * s, pal.band);
    if (pal.lit) { g.fillStyle = pal.lit; g.globalAlpha = 0.35; g.fillRect(cx - 14 * s, y0 - 36 * s, 9 * s, 36 * s); g.globalAlpha = 1; }
    g.restore();
    P(g, [cx - 2.4 * s, y0 - 36 * s, cx + 2.4 * s, y0 - 36 * s, cx + 1.6 * s, y0 - 52 * s, cx - 1.6 * s, y0 - 52 * s], pal.wall);
    lin(g, cx, y0 - 52 * s, cx, y0 - 72 * s, pal.wallD, 0.9 * s);
    g.fillStyle = '#ff4a4a'; g.beginPath(); g.arc(cx, y0 - 72 * s, 1.1 * s, 0, TAU); g.fill();
  }
  // nostaljik kırmızı tramvay (İstiklal / Moda)
  function tram(g, x, by, s, pal) {
    pal = pal || {};
    const red = pal.red || '#c8202a', cream = pal.cream || '#f6ead0';
    lin(g, x - 60, by - 29 * s, x + 100, by - 29 * s, pal.wire || '#3a3440', 0.4);
    for (const wx of [x + 7 * s, x + 31 * s]) { C(g, wx, by - 2 * s, 2.2 * s, '#2a2630'); }
    B(g, x, by - 19 * s, 38 * s, 15 * s, 3 * s, red);
    B(g, x + 1 * s, by - 8.6 * s, 36 * s, 2.8 * s, 0.6 * s, cream);
    for (let k = 0; k < 6; k++) B(g, x + 3 * s + k * 5.5 * s, by - 17 * s, 4.2 * s, 6 * s, 0.6 * s, pal.win || '#2c3e58');
    if (pal.lit) for (let k = 0; k < 6; k++) rect(g, x + 3.4 * s + k * 5.5 * s, by - 16.6 * s, 3.4 * s, 5.2 * s, pal.lit);
    B(g, x + 3 * s, by - 21.4 * s, 32 * s, 2.8 * s, 1.2 * s, pal.roof || '#8a1418');
    g.strokeStyle = '#2a2630'; g.lineWidth = 0.6 * s; g.beginPath(); g.moveTo(x + 14 * s, by - 21.4 * s); g.lineTo(x + 19 * s, by - 26 * s); g.lineTo(x + 24 * s, by - 21.4 * s); g.moveTo(x + 15 * s, by - 28.6 * s); g.lineTo(x + 23 * s, by - 28.6 * s); g.moveTo(x + 19 * s, by - 26 * s); g.lineTo(x + 19 * s, by - 28.6 * s); g.stroke();
    C(g, x + 37 * s, by - 6 * s, 1 * s, '#ffe9a0');
    g.fillStyle = cream; g.font = `600 ${3.4 * s}px Fredoka, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TÜNEL', x + 19 * s, by - 5.6 * s);
  }
  // Şehir Hatları vapuru
  function ferry(g, cx, by, s, pal) {
    pal = pal || {};
    P(g, [cx - 32 * s, by - 9 * s, cx + 34 * s, by - 9 * s, cx + 28 * s, by, cx - 28 * s, by], pal.hull || '#24324e');
    rect(g, cx - 31 * s, by - 9 * s, 64 * s, 2.6 * s, pal.white || '#f7f7f2');
    B(g, cx - 22 * s, by - 16.5 * s, 46 * s, 8 * s, 1 * s, pal.white || '#f7f7f2');
    for (let k = 0; k < 9; k++) B(g, cx - 20 * s + k * 5 * s, by - 15 * s, 3.4 * s, 3.4 * s, 0.6 * s, pal.win || '#3a5a7a');
    B(g, cx - 12 * s, by - 22.5 * s, 26 * s, 6.4 * s, 1 * s, pal.white || '#f7f7f2');
    for (let k = 0; k < 5; k++) B(g, cx - 10 * s + k * 5 * s, by - 21 * s, 3.4 * s, 3 * s, 0.6 * s, pal.win || '#3a5a7a');
    B(g, cx + 0.5 * s, by - 32 * s, 6.5 * s, 10 * s, 0.8 * s, pal.funnel || '#f2dc8a');
    rect(g, cx + 0.5 * s, by - 32 * s, 6.5 * s, 2.6 * s, '#22222a');
    lin(g, cx - 18 * s, by - 22.5 * s, cx - 18 * s, by - 31 * s, '#4a4a54', 0.5 * s);
    if (pal.flag !== false) flag(g, cx - 18 * s, by - 31 * s, s * 0.55);
  }
  function seagull(g, x, y, s, col, flap) {
    const f = flap === undefined ? 1 : flap;
    g.strokeStyle = col; g.lineWidth = 0.9 * s; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - 4.6 * s, y - 0.6 * s * f); g.quadraticCurveTo(x - 2.2 * s, y - 2.8 * s * f, x, y); g.quadraticCurveTo(x + 2.2 * s, y - 2.8 * s * f, x + 4.6 * s, y - 0.6 * s * f); g.stroke();
  }
  // İstanbul kedisi
  function cat(g, x, by, s, col, eyes, dir) {
    dir = dir || 1;
    g.save(); g.translate(x, by); g.scale(dir * s, s);
    g.strokeStyle = col; g.lineWidth = 1.6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-3, -1.4); g.quadraticCurveTo(-8, -2, -7, -8); g.stroke();
    E(g, 0, -4, 3.8, 4, col);
    C(g, 1.6, -9.4, 2.8, col);
    P(g, [-0.6, -10.6, -0.2, -14, 1.8, -11.6], col); P(g, [1.6, -11.8, 3.6, -14, 4, -10.4], col);
    if (eyes) { g.fillStyle = eyes; g.beginPath(); g.arc(1, -9.6, 0.55, 0, TAU); g.arc(3, -9.6, 0.55, 0, TAU); g.fill(); }
    g.restore();
  }
  // simitçi arabası
  function simitCart(g, x, by, s) {
    for (const wx of [x + 5 * s, x + 19 * s]) C(g, wx, by - 2.6 * s, 2.6 * s, '#2a2630');
    B(g, x, by - 13 * s, 24 * s, 9 * s, 1 * s, '#d2302a');
    g.fillStyle = '#ffffff'; g.font = `600 ${4 * s}px Fredoka, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SİMİT', x + 12 * s, by - 8.4 * s);
    B(g, x + 1 * s, by - 23 * s, 22 * s, 10 * s, 1 * s, 'rgba(220,240,255,0.55)');
    for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) {
      const cx = x + 4.6 * s + k * 5 * s, cy = by - 16.4 * s - r * 4.4 * s;
      g.fillStyle = '#c47a2c'; g.beginPath(); g.arc(cx, cy, 2.2 * s, 0, TAU); g.arc(cx, cy, 0.9 * s, 0, TAU, true); g.fill('evenodd');
    }
    B(g, x - 1 * s, by - 25 * s, 26 * s, 2.4 * s, 1 * s, '#a81e1a');
    lin(g, x + 24 * s, by - 10 * s, x + 29 * s, by - 13 * s, '#2a2630', 0.9 * s);
  }
  // cumbalı İstanbul evi
  function house(g, x, by, w, h, col, roof, r, opt) {
    opt = opt || {};
    B(g, x, by - h, w, h, 0, col);
    P(g, [x - 1.2, by - h, x + w + 1.2, by - h, x + w - 2, by - h - 4, x + 2, by - h - 4], roof);
    const cw = w * 0.62, cxp = x + (w - cw) / 2;
    if (h > 26 && w > 12) {
      B(g, cxp - 1, by - h + 5, cw + 2, h * 0.42, 0, opt.cumba || mix(col, '#ffffff', 0.18));
      for (let k = 0; k < 2; k++) B(g, cxp + 0.6 + k * (cw / 2), by - h + 7, cw / 2 - 1.4, h * 0.42 - 5, 0.4, winCol(opt, r));
    }
    const rows = Math.floor((h * 0.5) / 9);
    for (let rr = 0; rr < rows; rr++) for (let k = 0; k < 2; k++) {
      const wx = x + 2.2 + k * (w - 6.6), wy = by - h * 0.45 + rr * 9;
      B(g, wx, wy, 2.2 + (w > 14 ? 0.6 : 0), 5, 0.4, winCol(opt, r));
    }
    if (opt.door) B(g, x + w / 2 - 2.2, by - 8, 4.4, 8, 1.6, mix(col, '#2a1a10', 0.6));
  }
  function winCol(opt, r) { return opt.lit && r() < opt.litP ? opt.lit : (opt.win || '#3a4e6a'); }
  function hillsY(base, amp, seed) {
    const r = rng(seed);
    const k = [1 + Math.floor(r() * 2), 3 + Math.floor(r() * 2), 6 + Math.floor(r() * 3)], ph = [r() * TAU, r() * TAU, r() * TAU];
    return (x) => base - amp * (0.55 + 0.28 * Math.sin(TAU * k[0] * x / W + ph[0]) + 0.13 * Math.sin(TAU * k[1] * x / W + ph[1]) + 0.04 * Math.sin(TAU * k[2] * x / W + ph[2]));
  }
  function hills(g, yf, col) {
    g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 3) g.lineTo(x, yf(x)); g.lineTo(W, H); g.closePath();
    g.fillStyle = col; g.fill();
  }
  function hillHouses(g, yf, cols, roof, seed, lit, litP) {
    const r = rng(seed);
    for (let x = 1; x < W - 6; x += 4 + r() * 3) {
      const y = yf(x + 2) + 1.5, w = 3 + r() * 2.6, h = 2.6 + r() * 3.4;
      g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(x, y - h, w, h + 8);
      if (roof) { g.fillStyle = roof; g.fillRect(x - 0.3, y - h - 0.8, w + 0.6, 1); }
      if (lit && r() < litP) { g.fillStyle = lit; g.fillRect(x + w * 0.3, y - h * 0.6, 0.9, 0.9); }
    }
  }
  function cloud(g, x, y, s, col) {
    g.fillStyle = col;
    g.beginPath();
    g.arc(x, y, 6 * s, Math.PI * 0.5, Math.PI * 1.5); g.arc(x + 7 * s, y - 5 * s, 7 * s, Math.PI, Math.PI * 1.85);
    g.arc(x + 16 * s, y - 3 * s, 6 * s, Math.PI * 1.2, Math.PI * 1.95); g.arc(x + 22 * s, y, 6 * s, Math.PI * 1.5, Math.PI * 0.5);
    g.closePath(); g.fill();
  }
  // Hikâyenin sembolleri: ufuktaki ev (Çamlıca Kulesi, dünyalar ilerledikçe yaklaşır) ve cam ardında tek bir insan
  function homeTower(g, x, by, s, col, light) {
    camlicaTower(g, x, by, s, { wall: col, wallD: mix(col, '#000000', 0.08), glass: mix(col, '#ffffff', 0.08), band: mix(col, '#ffffff', 0.18) });
    if (light) { g.fillStyle = light; g.beginPath(); g.arc(x, by - 172 * s, Math.max(0.6, 1.4 * s * 2), 0, TAU); g.fill(); }
  }
  function lonelyWindow(g, x, y, w, h, frame, warm) {
    rect(g, x - 1.2, y - 1.2, w + 2.4, h + 2.4, frame);
    rect(g, x, y, w, h, warm || '#ffd98a');
    rect(g, x, y + h * 0.62, w, h * 0.38, 'rgba(160,90,30,0.25)');
    const cx = x + w * 0.62, by = y + h;
    g.fillStyle = 'rgba(40,24,30,0.85)';
    g.beginPath(); g.ellipse(cx, by - h * 0.18, w * 0.2, h * 0.24, 0, Math.PI, 0); g.fill();
    g.beginPath(); g.arc(cx + w * 0.02, by - h * 0.52, w * 0.12, 0, TAU); g.fill();
    rect(g, x + w * 0.1, y + h * 0.66, w * 0.3, 1, 'rgba(60,40,30,0.7)');
  }
  function wrapX(fn, x, span) { fn(x); if (x - span < 0) fn(x + W); if (x + span > W) fn(x - W); }

  // ---------- gökyüzü (kaymaz) ----------
  const SKY = [
    { stops: [[0, '#5fb4ec'], [0.7, '#bfe6fb'], [1, '#e8f7ff']] },
    { stops: [[0, '#6c86c8'], [0.45, '#f4a07a'], [0.8, '#ffd4a0'], [1, '#ffe6c4']], sun: [380, 150, 16, '#fff2c2'] },
    { stops: [[0, '#4aa8ea'], [0.7, '#b8e2fb'], [1, '#e2f5ff']], sun: [70, 40, 12, '#fffbe6'] },
    { stops: [[0, '#1c0f0a'], [0.6, '#3e2416'], [1, '#5a3420']] },
    { stops: [[0, '#05090c'], [0.6, '#0e1a1e'], [1, '#14262a']] },
    { stops: [[0, '#5a4a9a'], [0.4, '#e2706a'], [0.75, '#f9a86a'], [1, '#ffd08f']], sun: [190, 176, 22, '#ffe4a0'] },
    null, // 7 Haliç: üç bölümü de places.js'te
    { stops: [[0, '#26245e'], [0.45, '#6a4a9a'], [0.8, '#e2807a'], [1, '#f6a07a']], stars: 30 },
    { stops: [[0, '#070b26'], [0.6, '#18205a'], [1, '#2c3474']], moon: [196, 46, 14], stars: 90 },
    null, // 10 Ataşehir: üç bölümü de places.js'te
    { stops: [[0, '#04061a'], [0.6, '#141a4a'], [1, '#2a2462']], moon: [60, 40, 10], stars: 110 },
    null, // 11 Ümraniye: üç bölümü de places.js'te
  ];
  function drawSky(g, d, vw, vh, seed) {
    if (d.draw) { d.draw(g, vw, vh); return; }
    const gr = g.createLinearGradient(0, 0, 0, vh);
    d.stops.forEach(([o, c]) => gr.addColorStop(o, c));
    g.fillStyle = gr; g.fillRect(0, 0, vw, vh);
    if (d.stars) { const r = rng(seed * 31 + 7); for (let i = 0; i < d.stars; i++) { const x = r() * vw, y = r() * vh * 0.6, a = 0.3 + r() * 0.7; g.fillStyle = `rgba(255,255,240,${a})`; g.beginPath(); g.arc(x, y, 0.35 + r() * 0.5, 0, TAU); g.fill(); } }
    if (d.sun) {
      const [x, y, r, c] = d.sun;
      const gl = g.createRadialGradient(x, y, r * 0.5, x, y, r * 4); gl.addColorStop(0, 'rgba(255,240,200,0.65)'); gl.addColorStop(1, 'rgba(255,240,200,0)');
      g.fillStyle = gl; g.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
      g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    }
    if (d.moon) {
      const [x, y, r] = d.moon;
      const gl = g.createRadialGradient(x, y, r * 0.8, x, y, r * 3.4); gl.addColorStop(0, 'rgba(255,248,210,0.3)'); gl.addColorStop(1, 'rgba(255,248,210,0)');
      g.fillStyle = gl; g.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
      g.fillStyle = '#fff4c8'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.arc(x + r * 0.42, y - r * 0.18, r * 0.86, 0, TAU, true); g.fill('evenodd');
    }
  }

  // ---------- dünyalar ----------
  const WORLDS = [
    // 1 Maslak: cam plazalar; uzakta Boğaz'ın üstünde asma köprü ve tarihi yarımada silueti
    {
      far(g) {
        pen(null);
        cloud(g, 40, 50, 1.1, 'rgba(255,255,255,0.85)'); cloud(g, 300, 34, 0.8, 'rgba(255,255,255,0.75)'); cloud(g, 430, 70, 1, 'rgba(255,255,255,0.8)');
        const back = hillsY(178, 22, 3);
        hills(g, back, '#b4d2e8');
        homeTower(g, 340, back(340) + 3, 0.13, '#a2c0d8');
        const hz = { wall: '#9ec0da', roof: '#93b6d2', trim: '#a8c8e0' };
        blueMosque(g, 116, back(116) + 4, 0.5, hz); hagiaSophia(g, 52, back(52) + 4, 0.42, hz);
        bridge(g, 230, 500, 166, 124, { cable: '#8fb0ca', deck: '#8fb0ca', tower: '#8fb0ca' });
        const front = hillsY(202, 16, 8);
        hills(g, front, '#9cc2a8');
        hillHouses(g, front, ['#c9d8e2', '#e0d2c0', '#d8c4b4', '#c4d0d8'], '#b58a74', 4);
      },
      near(g) {
        pen('rgba(30,50,80,0.55)', 0.5);
        const towers = [[6, 40, 150, 'a'], [52, 32, 96, 'b'], [100, 50, 182, 'c'], [196, 60, 78, 'e'], [300, 38, 164, 'f'], [350, 48, 118, 'g'], [446, 46, 140, 'a']];
        for (const [x, w, h, k] of towers) glassTower(g, x, 214, w, h, k);
        lonelyWindow(g, 118, 96, 10, 7, '#2a5a88', '#f6e6b8');
        const r = rng(11);
        for (let x = 4; x < W - 8; x += 22 + r() * 18) tree(g, x, 214, 0.8 + r() * 0.4);
        for (let x = 0; x < W; x += 5) { const c = ['#e2483a', '#f4c531', '#ff7aa8', '#ffffff'][Math.floor(x / 5) % 4]; tulip(g, x + 2, 214, c); }
      },
    },
    // 2 Kadıköy: karşıda tarihi yarımada, önde Haydarpaşa Garı, cumbalı evler, Moda tramvayı
    {
      far(g) {
        pen(null);
        const hz = { wall: '#b4808e', roof: '#a87484', trim: '#bc8a96' };
        const base = hillsY(206, 10, 21);
        hills(g, base, '#c08c94');
        hillHouses(g, base, ['#c89aa0', '#bc8c96', '#d0a4a8'], null, 22);
        hagiaSophia(g, 150, 208, 1, hz); blueMosque(g, 300, 208, 1, hz); hillMosque(g, 440, 204, 0.7, hz);
        // Topkapı surları ve servi ağaçları
        for (let x = 30; x < 92; x += 7) { g.fillStyle = '#a87484'; g.beginPath(); g.ellipse(x, 199, 2.4, 7, 0, 0, TAU); g.fill(); }
        rect(g, 24, 202, 74, 8, '#b4808e');
      },
      near(g) {
        pen('rgba(50,30,30,0.55)', 0.5);
        const pal = { wall: '#d8c29a', wallD: '#b8a07a', roof: '#4e5464', trim: '#e8d6b0', win: '#4a5468' };
        haydarpasa(g, 30, 214, 1.15, pal);
        const r = rng(5);
        const cols = ['#e8a87c', '#d97a6a', '#f2d48a', '#9ec8b0', '#c4a6d8', '#f0c0a0'];
        let x = 178;
        pen(null); homeTower(g, 430, 196, 0.26, '#d4a08e'); pen('rgba(50,30,30,0.55)', 0.5);
        while (x < 500) { const w = 16 + r() * 8, h = 28 + r() * 18; house(g, x, 214, w, h, cols[Math.floor(r() * cols.length)], '#a8503a', r, { door: true }); x += w + 1; }
        lonelyWindow(g, 262, 160, 7, 9, '#5a3a30');
        tram(g, 300, 214, 1, {});
        cat(g, 190, 214, 0.8, '#f0a050', null, 1); cat(g, 470, 214, 0.7, '#e8e8ec', null, -1);
        seagull(g, 220, 60, 1, '#ffffff'); seagull(g, 250, 74, 0.8, '#ffffff'); seagull(g, 90, 92, 0.9, '#ffffff');
      },
    },
    // 3 Vapur: Sultanahmet ve Ayasofya silueti, Kız Kulesi, karşıdan geçen vapur
    {
      far(g) {
        pen(null);
        cloud(g, 160, 40, 1, 'rgba(255,255,255,0.9)'); cloud(g, 380, 56, 0.8, 'rgba(255,255,255,0.8)');
        const base = hillsY(206, 14, 31);
        homeTower(g, 404, 196, 0.24, '#9ab2c8');
        hills(g, base, '#9ab6cc');
        hillHouses(g, base, ['#c8d2da', '#e2d4c4', '#d4c2b8', '#bccad6'], '#c49a86', 32);
        const hz = { wall: '#d6c2b2', wallD: '#c4ae9e', roof: '#8c9cae', roofL: '#a8b6c6', trim: '#e2d2c4', win: '#a89488', brick: '#c88e7a' };
        hagiaSophia(g, 140, 210, 1.15, { ...hz, wall: '#e0a898', wallD: '#cc9282', trim: '#ebb8a8' });
        blueMosque(g, 300, 210, 1.15, hz);
        galataTower(g, 462, base(462) + 3, 0.9, { wall: '#cfc0aa', wallD: '#b8a892', roof: '#6a7a8e', trim: '#bcae98', win: '#8a7c6a' });
      },
      near(g) {
        pen('rgba(30,40,60,0.6)', 0.5);
        maidensTower(g, 150, 214, 1.5, { wall: '#f4efe4', wallD: '#d6d0c4', roof: '#7e8c9e', roofL: '#9eacbc', trim: '#d8d0c0', win: '#4a6280', rock: '#5e6a72', rockL: '#76828a', flag: true });
        ferry(g, 390, 216, 1.1, {});
        seagull(g, 250, 70, 1.1, '#ffffff'); seagull(g, 276, 84, 0.8, '#ffffff'); seagull(g, 60, 110, 0.9, '#ffffff'); seagull(g, 470, 60, 1, '#ffffff');
      },
    },
    // 4 Kapalıçarşı: çizgili kemerler, renkli mozaik lambalar, halılar, baharat, nazar boncuğu
    {
      far(g) {
        pen(null);
        for (let i = 0; i < 8; i++) bazaarArch(g, i * 64, 0.62);
        const gl = g.createRadialGradient(256, 150, 10, 256, 150, 220); gl.addColorStop(0, 'rgba(255,200,120,0.25)'); gl.addColorStop(1, 'rgba(255,200,120,0)');
        g.fillStyle = gl; g.fillRect(0, 0, W, H);
      },
      near(g) {
        pen('rgba(40,20,10,0.6)', 0.5);
        for (let i = 0; i < 4; i++) shop(g, i * 128, i);
      },
    },
    // 5 Yerebatan: sıra sıra sütunlar, Medusa başı, turuncu ışık, karanlık su
    {
      far(g) {
        pen(null);
        for (let row = 0; row < 2; row++) {
          const sc = row ? 0.75 : 0.55, col = row ? '#2c3a3c' : '#1e2a2c', step = row ? 44 : 30;
          for (let x = (row ? 10 : 0); x < W; x += step) column(g, x, 214, sc, col, mix(col, '#ff9a4a', 0.18), false);
          for (let x = (row ? 10 : 0); x < W; x += step) { g.strokeStyle = col; g.lineWidth = 3 * sc; g.beginPath(); g.arc(x + step / 2, 214 - 150 * sc, step / 2, Math.PI, 0); g.stroke(); }
        }
        for (let x = 20; x < W; x += 64) { const gl = g.createRadialGradient(x, 200, 2, x, 200, 40); gl.addColorStop(0, 'rgba(255,150,60,0.35)'); gl.addColorStop(1, 'rgba(255,150,60,0)'); g.fillStyle = gl; g.fillRect(x - 40, 160, 80, 80); }
      },
      near(g) {
        pen('rgba(0,0,0,0.6)', 0.6);
        for (let i = 0; i < 6; i++) {
          const x = 30 + i * 85;
          column(g, x, 214, 1.15, '#5a4a40', '#a8724a', i === 2);
          g.strokeStyle = '#4a3a30'; g.lineWidth = 6; g.beginPath(); g.arc(x + 42.5, 214 - 172, 42.5, Math.PI, 0); g.stroke();
          const gl = g.createRadialGradient(x, 214, 2, x, 214, 46); gl.addColorStop(0, 'rgba(255,140,50,0.45)'); gl.addColorStop(1, 'rgba(255,140,50,0)');
          g.fillStyle = gl; g.fillRect(x - 46, 168, 92, 72);
        }
      },
    },
    // 6 Galata: Haliç'in karşısında Süleymaniye, önde Galata Kulesi, cumbalı evler, kırmızı tramvay
    {
      far(g) {
        pen(null);
        const base = hillsY(200, 24, 61);
        homeTower(g, 470, 186, 0.34, '#9a6482', '#ff6a5a');
        hills(g, base, '#a26a86');
        hillHouses(g, base, ['#b47a92', '#a87088', '#c08aa0'], null, 62, '#ffd890', 0.25);
        const hz = { wall: '#8e5a78', roof: '#80506e', trim: '#9a6684' };
        hillMosque(g, 130, base(130) + 4, 1.05, hz); hillMosque(g, 330, 210, 0.75, hz);
        rect(g, 0, 208, W, 4, '#8e5a78');
      },
      near(g) {
        pen('rgba(50,20,30,0.6)', 0.5);
        const r = rng(66);
        const cols = ['#e8a87c', '#d9786a', '#f2d48a', '#a8c8b0', '#c4a6d8', '#f6c8a8', '#e09a8a'];
        let x = 0;
        while (x < W - 10) {
          const w = 16 + r() * 9, h = 36 + r() * 30;
          if (x > 150 && x < 232) { x = 232; continue; }
          house(g, x, 214, w, h, cols[Math.floor(r() * cols.length)], '#a8503a', r, { door: true, lit: '#ffe39a', litP: 0.3 });
          x += w + 1;
        }
        galataTower(g, 191, 214, 2.4, { wall: '#d8c8ae', wallD: '#bcac92', roof: '#4e5a70', roofL: '#6a7890', trim: '#a89478', trimD: '#5a4a3a', win: '#4a4036', lit: '#ffe39a' });
        tram(g, 330, 214, 1.05, { lit: 'rgba(255,230,150,0.55)' });
        simitCart(g, 120, 214, 1);
        cat(g, 252, 214 - 52, 0.7, '#2a2630', '#f4e04a', -1);
        lonelyWindow(g, 362, 186, 8, 10, '#5a3a30');
        cat(g, 440, 214, 0.8, '#d0d0d4', null, 1);
      },
    },
    null, // Haliç
    // 7 Köprü: alacakaranlıkta Boğaz Köprüsü, önde Ortaköy Camii
    {
      far(g) {
        pen(null);
        const base = hillsY(198, 26, 71);
        homeTower(g, 404, base(404) + 6, 0.42, '#463670', '#ff5a4a');
        hills(g, base, '#4a3a78');
        hillHouses(g, base, ['#5a4a88', '#54447e'], null, 72, '#ffd890', 0.45);
        bridge(g, 16, 496, 150, 70, { cable: '#e8e0f0', hang: 'rgba(232,224,240,0.7)', deck: '#d8d0e8', tower: '#e8e0f0', towerD: '#c0b8d0', light: true, leds: ['#ffe28a', '#8af0ff', '#ff9ad8'] });
      },
      near(g) {
        pen('rgba(20,10,40,0.6)', 0.5);
        ortakoy(g, 150, 214, 1.7, { wall: '#f4ece0', wallD: '#d8ccbc', roof: '#8a94a8', roofL: '#a6b0c2', trim: '#e0d4c2', win: '#ffd88a' });
        const r = rng(77);
        let x = 238;
        while (x < 470) { const w = 15 + r() * 8, h = 28 + r() * 22; house(g, x, 214, w, h, ['#d89a8a', '#e8c08a', '#a8b8d8', '#c8a0c0'][Math.floor(r() * 4)], '#7a3a3a', r, { lit: '#ffe39a', litP: 0.6 }); x += w + 1; }
        for (const lx of [40, 250, 480]) { lin(g, lx, 214, lx, 186, '#2a2440', 1); C(g, lx, 185, 2, '#ffe9a0'); }
        seagull(g, 330, 80, 1, '#f4ecff'); seagull(g, 356, 92, 0.7, '#f4ecff');
      },
    },
    // 8 Gece çatıları: ay ışığında Sultanahmet ve Ayasofya, kiremit çatılar, bacalar, kediler
    {
      far(g) {
        pen(null);
        const base = hillsY(206, 14, 81);
        homeTower(g, 250, base(250) + 4, 0.52, '#1a2050', '#ff5a4a');
        hills(g, base, '#1c2250');
        hillHouses(g, base, ['#222a5a', '#1e2654'], null, 82, '#ffd27a', 0.5);
        const lit = { wall: '#3a3a6a', wallD: '#30305e', roof: '#4a4e82', roofL: '#7a78a8', trim: '#f4d48a', win: '#ffd27a', lit: '#ffd27a', alem: '#f4d48a' };
        blueMosque(g, 140, 206, 1.25, lit); hagiaSophia(g, 340, 206, 1.15, { ...lit, wall: '#4a3a64', wallD: '#3e3058' });
        galataTower(g, 470, base(470) + 3, 0.8, { wall: '#3a3a6a', wallD: '#30305e', roof: '#4a4e82', trim: '#f4d48a', lit: '#ffd27a' });
      },
      near(g) {
        pen('rgba(0,0,10,0.7)', 0.5);
        const r = rng(88);
        let x = -4;
        while (x < W - 10) {
          const w = 34 + r() * 30, h = 14 + r() * 22, by = 214;
          B(g, x, by - h, w, h + 30, 0, '#2a2448');
          for (let wy = by - h + 8; wy < by - 4; wy += 10) for (let wx = x + 4; wx < x + w - 6; wx += 9) B(g, wx, wy, 4, 5.4, 0.4, r() < 0.45 ? '#ffd27a' : '#1a1636');
          roofTiles(g, x - 3, by - h, w + 6, 12, '#a84e34');
          if (r() < 0.8) { const cx = x + 6 + r() * (w - 14); B(g, cx, by - h - 16, 6, 12, 0.6, '#6a3a2e'); B(g, cx - 1, by - h - 17, 8, 2.4, 0.6, '#4a2a22'); }
          if (r() < 0.6) { const ax = x + w * 0.7; lin(g, ax, by - h - 6, ax, by - h - 22, '#5a5a70', 0.6); lin(g, ax - 5, by - h - 18, ax + 5, by - h - 18, '#5a5a70', 0.6); lin(g, ax - 3.6, by - h - 14, ax + 3.6, by - h - 14, '#5a5a70', 0.6); }
          if (r() < 0.35) { E(g, x + w * 0.3, by - h - 8, 4, 4.4, '#c8ccd8', -0.5); }
          if (r() < 0.45) cat(g, x + w * (0.35 + r() * 0.3), by - h - 6, 0.75, '#141022', '#c8f04a', r() < 0.5 ? 1 : -1);
          x += w + 4;
        }
      },
    },
    null, // Ataşehir
    // 9 Çamlıca: gece ışıkları, LED'li köprü, Kız Kulesi; önde Çamlıca Kulesi ve Camii
    {
      far(g) {
        pen(null);
        rect(g, 0, 176, W, 64, '#141a46');
        const r = rng(91);
        for (let i = 0; i < 260; i++) { const x = r() * W, y = 168 + r() * 50; g.fillStyle = ['#ffd27a', '#fff0c0', '#8ad8ff'][Math.floor(r() * 3)]; g.globalAlpha = 0.4 + r() * 0.6; g.fillRect(x, y, 0.8, 0.8); }
        g.globalAlpha = 1;
        bridge(g, 40, 330, 164, 116, { cable: '#7a82c8', hang: 'rgba(160,140,255,0.5)', deck: '#5a5ea8', tower: '#7a82c8', light: true, leds: ['#b48aff', '#6ad0ff', '#ff7ad8'] });
        maidensTower(g, 420, 196, 0.8, { wall: '#5a5e98', wallD: '#4a4e88', roof: '#6a6ea8', trim: '#ffd27a', rock: '#20244e', lit: '#ffe9a0', win: '#ffd27a' });
        const gl = g.createRadialGradient(424, 162, 1, 424, 162, 24); gl.addColorStop(0, 'rgba(255,240,180,0.6)'); gl.addColorStop(1, 'rgba(255,240,180,0)'); g.fillStyle = gl; g.fillRect(400, 138, 48, 48);
        const base = hillsY(212, 10, 92); hills(g, base, '#0e1236');
      },
      near(g) {
        pen('rgba(0,0,20,0.7)', 0.5);
        const base = hillsY(206, 14, 95);
        hills(g, base, '#141842');
        camlicaTower(g, 150, 214, 1.12, { wall: '#c8ccdc', wallD: '#9aa0b8', glass: '#3a6ab8', band: '#9ad8ff', lit: '#bff0ff' });
        blueMosque(g, 372, 212, 1, { wall: '#d8dce8', wallD: '#b8bccc', roof: '#6a7898', roofL: '#8a98b8', trim: '#ffe39a', win: '#ffd27a', lit: '#ffe39a', alem: '#ffe39a' });
        const r = rng(96);
        for (let x = 0; x < W; x += 12 + r() * 14) { if (Math.abs(x - 150) < 20 || Math.abs(x - 372) < 74) continue; pine(g, x, 216, 0.8 + r() * 0.5); }
      },
    },
    null, // Ümraniye
  ];
  // ---- dünya parçaları ----
  function glassTower(g, x, by, w, h, k) {
    const top = by - h;
    const body = g.createLinearGradient(x, 0, x + w, 0);
    body.addColorStop(0, '#78c0ea'); body.addColorStop(0.55, '#4a92c8'); body.addColorStop(1, '#2f6aa0');
    g.save();
    g.beginPath();
    if (k === 'b') { g.moveTo(x, by); g.lineTo(x, top + w / 2); g.arc(x + w / 2, top + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, by); }
    else if (k === 'd' || k === 'f') { g.moveTo(x, by); g.lineTo(x, top + (k === 'd' ? 14 : 0)); g.lineTo(x + w, top + (k === 'd' ? 0 : 18)); g.lineTo(x + w, by); }
    else { g.rect(x, top, w, h); }
    g.closePath(); fsx(g, body); g.clip();
    g.fillStyle = 'rgba(255,255,255,0.25)'; for (let yy = top + 3; yy < by; yy += 6) g.fillRect(x, yy, w, 0.6);
    g.fillStyle = 'rgba(20,50,90,0.25)'; for (let xx = x + 6; xx < x + w; xx += 7) g.fillRect(xx, top, 0.6, h);
    g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.moveTo(x + w * 0.1, by); g.lineTo(x + w * 0.35, by); g.lineTo(x + w * 0.9, top); g.lineTo(x + w * 0.65, top); g.closePath(); g.fill();
    g.restore();
    if (k === 'c') { B(g, x + w / 2 - 6, top - 8, 12, 8, 0, '#5aa0d0'); lin(g, x + w / 2, top - 8, x + w / 2, top - 34, '#6a7a8e', 1.2); C(g, x + w / 2, top - 34, 1, '#ff4a4a'); }
    if (k === 'a') B(g, x + 6, top - 5, w - 12, 5, 0, '#3a7ab0');
    if (k === 'e') { for (let yy = top + 6; yy < by; yy += 8) rect(g, x + 2, yy, w - 4, 3, 'rgba(255,255,255,0.18)'); }
    if (k === 'g') { E(g, x + w / 2, top - 1, w * 0.3, 1.6, '#3a7ab0'); }
  }
  function tree(g, x, by, s) {
    rect(g, x - 1.2 * s, by - 10 * s, 2.4 * s, 10 * s, '#7a5232');
    C(g, x, by - 14 * s, 7 * s, '#4caf50'); C(g, x - 4 * s, by - 11 * s, 5 * s, '#43a047'); C(g, x + 4.5 * s, by - 11.5 * s, 5 * s, '#3d9a42');
    C(g, x - 2 * s, by - 17 * s, 2.4 * s, 'rgba(255,255,255,0.18)');
  }
  function pine(g, x, by, s) { P(g, [x - 6 * s, by, x + 6 * s, by, x, by - 22 * s], '#0a1030'); }
  function tulip(g, x, by, col) {
    lin(g, x, by, x, by - 5, '#3a8a3a', 0.6);
    g.fillStyle = col; g.beginPath(); g.moveTo(x - 1.4, by - 7.4); g.quadraticCurveTo(x - 1.4, by - 4.6, x, by - 4.6); g.quadraticCurveTo(x + 1.4, by - 4.6, x + 1.4, by - 7.4); g.lineTo(x + 0.7, by - 6.6); g.lineTo(x, by - 7.8); g.lineTo(x - 0.7, by - 6.6); g.closePath(); g.fill();
  }
  function bazaarArch(g, x, k) {
    const d = (c) => mix(c, '#2a160c', 1 - k);
    rect(g, x, 0, 64, H, d('#6a4028'));
    // tavan süslemesi
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { g.fillStyle = d(j % 2 ? '#2f6fb0' : '#e8d4a8'); g.beginPath(); g.arc(x + 8 + i * 16, 10 + j * 12, 3, 0, TAU); g.fill(); }
    // çizgili kemer
    const cx = x + 32, cy = 70, r = 30;
    for (let i = 0; i < 12; i++) {
      const a0 = Math.PI + i * Math.PI / 12, a1 = a0 + Math.PI / 12;
      g.fillStyle = d(i % 2 ? '#e8d8b8' : '#b03a2a');
      g.beginPath(); g.arc(cx, cy, r, a0, a1); g.arc(cx, cy, r - 7, a1, a0, true); g.closePath(); g.fill();
    }
    rect(g, x + 2, cy, 5, H - cy, d('#d8c49a')); rect(g, x + 57, cy, 5, H - cy, d('#d8c49a'));
    g.fillStyle = d('#f2c66a'); g.globalAlpha = 0.55; g.beginPath(); g.arc(cx, cy, r - 7, Math.PI, 0); g.lineTo(cx + r - 7, H); g.lineTo(cx - r + 7, H); g.closePath(); g.fill(); g.globalAlpha = 1;
    // uzak lamba
    lin(g, cx, cy - 23, cx, cy - 4, d('#3a2416'), 0.5);
    g.fillStyle = d(['#e2483a', '#3aa0e0', '#f4c531'][Math.floor(x / 64) % 3]); g.beginPath(); g.arc(cx, cy - 1, 3.4, 0, TAU); g.fill();
  }
  function shop(g, x, i) {
    // ahşap dükkân çerçevesi
    B(g, x + 4, 66, 120, 150, 2, '#6a3a1e');
    B(g, x + 10, 86, 108, 128, 1, '#3a2012');
    const signs = ['BAHARAT', 'KUYUMCU', 'LAMBA', 'NAZAR'];
    B(g, x + 22, 70, 84, 13, 3, '#f2d48a');
    g.fillStyle = '#6a2a14'; g.font = '600 9px Fredoka, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(signs[i % 4], x + 64, 77);
    const k = i % 4;
    if (k === 0) {
      // baharat tepecikleri
      B(g, x + 12, 176, 104, 38, 1, '#8a5a32');
      const cols = ['#d2302a', '#f4b81e', '#e07a24', '#7a9a3a', '#a8381e', '#e8c860'];
      for (let j = 0; j < 6; j++) { const cx = x + 22 + j * 17; E(g, cx, 178, 8, 2.4, '#5a3418'); P(g, [cx - 7.4, 178, cx + 7.4, 178, cx, 162 - (j % 2) * 4], cols[j]); }
      for (let j = 0; j < 5; j++) { lin(g, x + 24 + j * 20, 88, x + 24 + j * 20, 104, '#c8a060', 0.6); E(g, x + 24 + j * 20, 110, 4, 6, ['#a83a1e', '#5a7a2a', '#c8601e'][j % 3]); }
    } else if (k === 1) {
      // kuyumcu vitrini: kadife zeminde altın bilezikler, kolyeler, ışıltı
      B(g, x + 14, 92, 100, 80, 2, '#f4f0e0'); B(g, x + 18, 96, 92, 72, 1, '#5a1a2a');
      for (let r2 = 0; r2 < 3; r2++) for (let j = 0; j < 5; j++) { g.strokeStyle = '#f4c531'; g.lineWidth = 1.6; g.beginPath(); g.ellipse(x + 30 + j * 17, 108 + r2 * 20, 5, 3.4, 0, 0, TAU); g.stroke(); }
      for (let j = 0; j < 4; j++) { g.strokeStyle = '#ffe07a'; g.lineWidth = 0.8; g.beginPath(); g.arc(x + 34 + j * 20, 152, 6, 0.2, Math.PI - 0.2); g.stroke(); C(g, x + 34 + j * 20, 158, 1.6, '#e2483a'); }
      g.fillStyle = 'rgba(255,255,255,0.35)'; P(g, [x + 22, 168, x + 32, 168, x + 56, 96, x + 46, 96], 'rgba(255,255,255,0.25)');
      for (let j = 0; j < 6; j++) star(g, x + 26 + j * 15, 100 + (j % 3) * 22, 1.6, '#ffffff');
      B(g, x + 14, 176, 100, 38, 1, '#7a4a28');
    } else if (k === 2) {
      for (let j = 0; j < 7; j++) {
        const lx = x + 20 + j * 14.6, ly = 108 + (j % 3) * 18;
        lin(g, lx, 86, lx, ly - 7, '#c8a060', 0.5);
        const col = ['#e2483a', '#3aa0e0', '#f4c531', '#7a3ab0', '#2ab07a', '#ff7a3a', '#3a5ad8'][j];
        const gl = g.createRadialGradient(lx, ly, 1, lx, ly, 16); gl.addColorStop(0, col + 'aa'); gl.addColorStop(1, col + '00');
        g.fillStyle = gl; g.fillRect(lx - 16, ly - 16, 32, 32);
        mosaicLamp(g, lx, ly, col);
      }
      B(g, x + 14, 188, 100, 26, 1, '#7a4a28');
    } else {
      for (let j = 0; j < 5; j++) {
        const sx = x + 20 + j * 22;
        lin(g, sx, 88, sx, 168, '#c8a060', 0.5);
        for (let k2 = 0; k2 < 6; k2++) nazar(g, sx, 96 + k2 * 13, 4.4 - k2 * 0.25);
      }
      B(g, x + 14, 180, 100, 34, 1, '#7a4a28');
      for (let j = 0; j < 4; j++) { const cx = x + 30 + j * 22; E(g, cx, 182, 7, 2, '#c8a060'); nazar(g, cx, 176, 5); }
    }
    cat(g, x + 116, 214, 0.75, ['#f0a050', '#2a2630', '#e8e8ec', '#a8a8b0'][i % 4], null, -1);
  }
  function carpet(g, x, y, w, h, c) {
    B(g, x, y, w, h, 0.6, c[0]);
    g.strokeStyle = c[1]; g.lineWidth = 1.4; g.strokeRect(x + 2.6, y + 2.6, w - 5.2, h - 5.2);
    for (let k = 0; k < 3; k++) { const cy = y + h * (0.25 + k * 0.25); g.fillStyle = c[2]; g.beginPath(); g.moveTo(x + w / 2, cy - 7); g.lineTo(x + w / 2 + 7, cy); g.lineTo(x + w / 2, cy + 7); g.lineTo(x + w / 2 - 7, cy); g.closePath(); g.fill(); g.fillStyle = c[1]; g.beginPath(); g.arc(x + w / 2, cy, 2, 0, TAU); g.fill(); }
    for (let k = 0; k < w; k += 2.4) lin(g, x + k + 1, y + h, x + k + 1, y + h + 3, c[1], 0.5);
  }
  function mosaicLamp(g, x, y, col) {
    E(g, x, y, 6, 7, col);
    g.save(); g.beginPath(); g.ellipse(x, y, 6, 7, 0, 0, TAU); g.clip();
    for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) { g.fillStyle = (r + k) % 2 ? 'rgba(255,255,255,0.45)' : 'rgba(255,230,120,0.5)'; g.fillRect(x - 6 + k * 3.2, y - 7 + r * 3.6, 1.6, 1.6); }
    g.restore();
    B(g, x - 2.4, y - 9.6, 4.8, 2.6, 1, '#c8a060'); P(g, [x - 2, y + 6.6, x + 2, y + 6.6, x, y + 10], '#c8a060');
  }
  function nazar(g, x, y, r) {
    C(g, x, y, r, '#1e5ad8'); C(g, x, y, r * 0.66, '#ffffff'); C(g, x, y, r * 0.42, '#7ac8ff'); C(g, x, y, r * 0.2, '#10122a');
  }
  function column(g, x, by, s, col, light, medusa) {
    const w = 10 * s, h = 150 * s;
    rect(g, x - w / 2, by - h, w, h, col);
    const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0); gr.addColorStop(0, light); gr.addColorStop(0.5, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.35)');
    g.fillStyle = gr; g.fillRect(x - w / 2, by - h, w, h);
    if (s > 0.9) {
      for (let k = 0; k < 4; k++) rect(g, x - w / 2 + 1.4 + k * 2.4, by - h + 10, 0.7, h - 22, 'rgba(0,0,0,0.25)');
      B(g, x - w * 0.9, by - h - 6, w * 1.8, 7, 1, mix(col, '#c8905a', 0.35));
      for (let k = 0; k < 3; k++) { E(g, x - w * 0.6 + k * w * 0.6, by - h - 3, 2.6, 3, mix(col, '#d8a06a', 0.4)); }
      B(g, x - w * 0.75, by - 8, w * 1.5, 8, 1, mix(col, '#8a6a50', 0.3));
      if (medusa) medusaHead(g, x, by - 20, s * 1.7);
    }
  }
  // Yerebatan'ın baş aşağı Medusa başı (sütun kaidesi)
  function medusaHead(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, -s);
    B(g, -11, -9, 22, 17, 2, '#8a7a62');
    for (let k = 0; k < 9; k++) { const a = Math.PI + k * Math.PI / 8; g.strokeStyle = '#6a5a44'; g.lineWidth = 2; g.beginPath(); g.moveTo(Math.cos(a) * 5, Math.sin(a) * 5 - 1); g.quadraticCurveTo(Math.cos(a) * 9 + 2, Math.sin(a) * 9 - 2, Math.cos(a) * 10.5, Math.sin(a) * 8 - 1); g.stroke(); }
    E(g, 0, 0, 6, 7, '#a8977c');
    E(g, -2.2, -1.2, 1.3, 0.8, '#3a3024'); E(g, 2.2, -1.2, 1.3, 0.8, '#3a3024');
    lin(g, 0, -0.5, 0, 2, '#6a5a44', 0.7);
    g.strokeStyle = '#4a3a2c'; g.lineWidth = 0.7; g.beginPath(); g.arc(0, 3.4, 1.6, 0.2, Math.PI - 0.2); g.stroke();
    g.restore();
  }
  function roofTiles(g, x, y, w, h, col) {
    P(g, [x, y, x + w, y, x + w - 6, y - h, x + 6, y - h], col);
    g.save(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y); g.lineTo(x + w - 6, y - h); g.lineTo(x + 6, y - h); g.closePath(); g.clip();
    g.strokeStyle = mix(col, '#2a0a00', 0.4); g.lineWidth = 0.6;
    for (let yy = y - h + 3; yy < y; yy += 3) { g.beginPath(); for (let xx = x; xx < x + w; xx += 3) { g.moveTo(xx, yy); g.arc(xx + 1.5, yy, 1.5, Math.PI, 0, true); } g.stroke(); }
    g.restore();
  }

  // ---------- mekânlar: her dünyanın 3 bölümü ayrı bir yer (yer = dünya*3 + bölüm) ----------
  // Dünyanın ilk çizimi hangi bölümde kullanılıyor; diğer iki bölüm PLACES'ta
  const BASE_AT = [0, 0, 1, 0, 0, 1, -1, 0, 0, -1, 0, -1];
  const PLACES = {};
  function placeDef(p) {
    const w = Math.floor(p / 3), s = p % 3;
    if (s === BASE_AT[w] || !PLACES[p]) return { sky: SKY[w], far: WORLDS[w].far, near: WORLDS[w].near };
    return PLACES[p];
  }

  // ---------- önbellek ----------
  const layerCache = A.cache();
  function bgScale() { return A.S; }
  function layers(p) {
    let L = layerCache.get(p);
    if (!L) {
      const sc = bgScale();
      const D = placeDef(p);
      L = { far: A.mk(W, H, (g) => { pen(null); D.far(g); }, sc), near: A.mk(W, H, (g) => { pen(null); D.near(g); }, sc) };
      layerCache.set(p, L);
      if (layerCache.size > 2) layerCache.delete(layerCache.keys().next().value);
    }
    return L;
  }
  const skyCache = A.cache();
  function sky(p, vw, vh) {
    const k = p + ':' + vw;
    let c = skyCache.get(k);
    if (!c) { c = A.mk(vw, vh, (g) => drawSky(g, placeDef(p).sky, vw, vh, p), bgScale()); skyCache.set(k, c); if (skyCache.size > 4) skyCache.delete(skyCache.keys().next().value); }
    return c;
  }

  // ---------- metro hattı: iki istasyon ve aradaki tünel (88 karo, kamerayla kayar) ----------
  // ekran pikseli (240'lık tuvalde): duvarın altı, rayın üstü (tekerlerin bastığı yer)
  const WALL_BOT = 206, RAIL_TOP = 218;
  // raylar ve hendek: her şeridin altına
  function trench(g, w, dark) {
    rect(g, 0, WALL_BOT, w, 240 - WALL_BOT, dark ? '#14161d' : '#191c25');
    rect(g, 0, WALL_BOT, w, 2.6, dark ? '#4c525e' : '#8d939e');
    rect(g, 0, WALL_BOT + 2.6, w, 0.8, 'rgba(0,0,0,0.45)');
    // enerji rayı: sarı koruma kapağı (dokunma!)
    rect(g, 0, 211, w, 2.6, '#d8b22c');
    for (let x = 0; x < w; x += 8) rect(g, x, 211, 4, 2.6, '#3a3420');
    rect(g, 0, 213.6, w, 0.7, 'rgba(0,0,0,0.5)');
    for (let x = 6; x < w; x += 32) rect(g, x, 213.6, 2, 3, '#3a3e48'); // taşıyıcılar
    // traversler ve balast
    for (let x = 1; x < w; x += 10) { A.box(g, x, RAIL_TOP + 3.6, 7, 4.2, 0.8, '#5a5248', '#2a2620', 0.5); }
    const r = rng(dark ? 7 : 3);
    for (let i = 0; i < w * 0.6; i++) { g.fillStyle = r() < 0.5 ? 'rgba(150,140,125,0.35)' : 'rgba(40,36,32,0.5)'; g.fillRect(r() * w, RAIL_TOP + 8 + r() * 12, 1.2, 0.9); }
    // ray: mantar başlı çelik
    rect(g, 0, RAIL_TOP, w, 2.4, '#c9ced8'); rect(g, 0, RAIL_TOP, w, 0.7, '#f2f4f8');
    rect(g, 0, RAIL_TOP + 2.4, w, 1.4, '#5f6570'); rect(g, 0, RAIL_TOP + 3.8, w, 1, '#3a3e48');
    const sh = g.createLinearGradient(0, RAIL_TOP + 9, 0, 240); sh.addColorStop(0, 'rgba(8,8,14,0)'); sh.addColorStop(1, 'rgba(8,8,14,0.7)');
    g.fillStyle = sh; g.fillRect(0, RAIL_TOP + 9, w, 240 - RAIL_TOP - 9);
  }
  // istasyon duvarı: sırlı karo, hat renginde şeritler, tavan lambaları (128 piksellik şerit)
  function hallStrip(g, w, vh, col) {
    rect(g, 0, 0, w, vh, '#1d2230');
    for (let y = 48; y < WALL_BOT; y += 6) for (let x = (y % 12 ? -6 : 0); x < w; x += 12) {
      g.fillStyle = y >= 150 ? '#cdc5b2' : '#f1ece0'; A.rr(g, x + 0.5, y + 0.5, 11, 5, 1.2); g.fill();
    }
    rect(g, 0, 48, w, 0.8, 'rgba(0,0,0,0.35)');
    rect(g, 0, 98, w, 7, col); rect(g, 0, 107, w, 2, col);
    rect(g, 0, 98, w, 1, 'rgba(255,255,255,0.35)');
    rect(g, 0, 147, w, 3, mix(col, '#000000', 0.25));
    for (let x = 8; x < w; x += 64) {
      const gl = g.createLinearGradient(0, 50, 0, 92); gl.addColorStop(0, 'rgba(255,252,236,0.6)'); gl.addColorStop(1, 'rgba(255,252,236,0)');
      g.fillStyle = gl; g.fillRect(x - 6, 50, 58, 42);
      A.box(g, x, 48, 46, 4, 1.5, '#ffffff', '#8a8f9a', 0.6);
    }
    const sh = g.createLinearGradient(0, 150, 0, WALL_BOT); sh.addColorStop(0, 'rgba(20,24,40,0)'); sh.addColorStop(1, 'rgba(20,24,40,0.3)');
    g.fillStyle = sh; g.fillRect(0, 150, w, WALL_BOT - 150);
    trench(g, w, false);
  }
  // tünel: beton bölmeler, kablolar, seyrek lambalar
  function tunnelStrip(g, w, vh) {
    rect(g, 0, 0, w, vh, '#151820');
    const gr = g.createLinearGradient(0, 48, 0, WALL_BOT);
    gr.addColorStop(0, '#222733'); gr.addColorStop(0.45, '#333a49'); gr.addColorStop(1, '#232834');
    g.fillStyle = gr; g.fillRect(0, 48, w, WALL_BOT - 48);
    // tavana doğru kemer gölgesi
    const top = g.createLinearGradient(0, 48, 0, 76); top.addColorStop(0, 'rgba(6,8,14,0.65)'); top.addColorStop(1, 'rgba(6,8,14,0)');
    g.fillStyle = top; g.fillRect(0, 48, w, 28);
    for (let x = 0; x < w; x += 64) {
      // bölme derzleri ve cıvatalar
      rect(g, x, 48, 1.4, WALL_BOT - 48, '#191d26'); rect(g, x + 1.4, 48, 0.7, WALL_BOT - 48, 'rgba(120,135,160,0.18)');
      for (const y of [64, 120, 176]) A.circle(g, x + 5, y, 0.8, '#4a5264', null);
      // kablo taşıyıcıları
      A.box(g, x + 30, 76, 4, 18, 0.8, '#3d4454', '#151820', 0.5);
    }
    // sarkık kablolar
    g.lineCap = 'round';
    for (const [y, c, lw] of [[80, '#101218', 1.6], [85, '#0e1016', 1.4], [90, '#5a3a2a', 1.1]]) {
      g.strokeStyle = c; g.lineWidth = lw; g.beginPath();
      for (let x = -32; x < w; x += 64) { g.moveTo(x + 32, y); g.quadraticCurveTo(x + 64, y + 5, x + 96, y); }
      g.stroke();
    }
    // lamba ve duvara düşen ışığı
    const lx = 96, ly = 60;
    const lg = g.createRadialGradient(lx, ly + 6, 1, lx, ly + 10, 34);
    lg.addColorStop(0, 'rgba(255,226,150,0.42)'); lg.addColorStop(1, 'rgba(255,226,150,0)');
    g.fillStyle = lg; g.fillRect(lx - 36, ly - 20, 72, 72);
    A.box(g, lx - 5, ly - 2, 10, 5, 1.6, '#ffe7a0', '#151820', 0.6);
    lin(g, lx - 4, ly + 0.5, lx + 4, ly + 0.5, 'rgba(60,50,30,0.6)', 0.5);
    // reflektörlü mesafe levhası
    A.box(g, 30, 160, 7, 9, 1.2, '#e8ecf2', '#151820', 0.6);
    A.poly(g, [31.5, 166.5, 33.5, 162, 35.5, 166.5], '#e2483a', null);
    trench(g, w, true);
  }
  // istasyon duvarının bittiği beton sütun ve tünel ağzının gölgesi (soldan sağa: istasyon → tünel)
  function portalStrip(g, w, vh) {
    const gr = g.createLinearGradient(14, 0, w, 0); gr.addColorStop(0, 'rgba(6,8,14,0.75)'); gr.addColorStop(1, 'rgba(6,8,14,0)');
    g.fillStyle = gr; g.fillRect(14, 48, w - 14, WALL_BOT - 48);
    A.box(g, 0, 44, 15, WALL_BOT - 42, 1.5, A.grad(g, 0, 0, 15, 0, [[0, '#a3a9b4'], [0.6, '#868d99'], [1, '#666c78']]), '#232a3a', 0.8);
    rect(g, 2, 46, 1, WALL_BOT - 48, 'rgba(255,255,255,0.3)');
    for (const y of [70, 130, 186]) rect(g, 1.5, y, 12, 1, 'rgba(0,0,0,0.25)');
    void vh;
  }
  // istasyon tabelası: hat rozeti ve ad
  function stationSign(name, ln, col) {
    const fs = name.length > 11 ? 6.2 : 7.6, mw = Math.max(48, name.length * fs * 0.62 + 30);
    return A.mk(mw, 18, (g) => {
      A.box(g, 0.5, 0.5, mw - 1, 17, 2.5, '#1d2c55', '#0c1430', 0.8);
      A.box(g, 4, 3, 14, 12, 2.6, col, null);
      g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = '600 7.4px Fredoka, sans-serif'; g.fillText(ln, 11, 9.4);
      g.font = `600 ${fs}px Fredoka, sans-serif`; g.fillText(name, 18 + (mw - 22) / 2, 9.6);
    }, bgScale());
  }
  // hat şeması: duraklar nokta, bulunulan durak büyük ve parlak (yazısız)
  function lineMap(col, at) {
    return A.mk(84, 14, (g) => {
      A.box(g, 0.5, 0.5, 83, 13, 2, '#f8f6f0', '#8a8f9a', 0.6);
      rect(g, 8, 6.2, 68, 1.8, col);
      for (let k = 0; k < 7; k++) {
        const x = 8 + k * (68 / 6), on = k === at;
        A.circle(g, x, 7.1, on ? 2.6 : 1.6, on ? '#ffffff' : col, on ? col : null, on ? 1.2 : 0);
      }
    }, bgScale());
  }
  const lineCache = A.cache();
  // rd: bölümün biniş bilgisi (hat, renk, a → b istasyonları)
  function metroLine(rd, vh) {
    const k = rd.line + rd.a + ':' + vh;
    let P = lineCache.get(k);
    if (P) return P;
    const name = rd.a, ln = rd.line, col = rd.col, next = rd.b;
    P = {
      hall: A.mk(128, vh, (g) => hallStrip(g, 128, vh, col), bgScale()),
      tunnel: A.mk(128, vh, (g) => tunnelStrip(g, 128, vh), bgScale()),
      portalL: A.mk(40, vh, (g) => portalStrip(g, 40, vh), bgScale()),
      portalR: A.mk(40, vh, (g) => { g.translate(40, 0); g.scale(-1, 1); portalStrip(g, 40, vh); }, bgScale()),
      signA: stationSign(name, ln, col), signB: stationSign(next, ln, col),
      mapA: lineMap(col, 2), mapB: lineMap(col, 3),
      col, ln, WALL_BOT, RAIL_TOP,
    };
    lineCache.set(k, P);
    return P;
  }

  // ---------- başlık ekranı: tek karede İstanbul ----------
  const titleCache = A.cache();
  function title(vw, vh) {
    let c = titleCache.get(vw);
    if (c) return c;
    c = A.mk(vw, vh, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 176);
      gr.addColorStop(0, '#3c4a9c'); gr.addColorStop(0.45, '#c86a8a'); gr.addColorStop(0.78, '#f8a070'); gr.addColorStop(1, '#ffd49a');
      g.fillStyle = gr; g.fillRect(0, 0, vw, vh);
      const sx = 168, sy = 150;
      const gl = g.createRadialGradient(sx, sy, 6, sx, sy, 80); gl.addColorStop(0, 'rgba(255,236,190,0.8)'); gl.addColorStop(1, 'rgba(255,236,190,0)');
      g.fillStyle = gl; g.fillRect(0, 60, vw, 140);
      g.fillStyle = '#fff1c4'; g.beginPath(); g.arc(sx, sy, 15, 0, TAU); g.fill();
      pen(null);
      // Asya yakası tepeleri ve köprü
      g.fillStyle = '#9a6a94';
      g.beginPath(); g.moveTo(0, 168); g.quadraticCurveTo(30, 150, 70, 156); g.quadraticCurveTo(110, 146, 150, 160); g.lineTo(150, 176); g.lineTo(0, 176); g.closePath(); g.fill();
      bridge(g, -6, 140, 150, 118, { cable: '#c494b8', hang: 'rgba(196,148,184,0.7)', deck: '#b688ac', tower: '#c494b8' });
      // tarihi yarımada silueti (güneşe karşı)
      const sil = { wall: '#6a3c6a', wallD: '#5e3460', roof: '#5a3260', trim: '#744474', win: null };
      g.fillStyle = '#6a3c6a'; g.beginPath(); g.moveTo(120, 176); g.quadraticCurveTo(160, 162, 256, 164); g.lineTo(256, 176); g.closePath(); g.fill();
      hagiaSophia(g, 150, 170, 0.62, sil);
      blueMosque(g, 222, 168, 0.68, sil);
      // Galata Kulesi (sol tepe)
      g.fillStyle = '#5a3458'; g.beginPath(); g.moveTo(0, 150); g.quadraticCurveTo(18, 138, 52, 150); g.quadraticCurveTo(80, 160, 100, 176); g.lineTo(0, 176); g.closePath(); g.fill();
      hillHousesT(g, '#6a3e66', '#ffd890');
      galataTower(g, 30, 146, 0.92, { wall: '#4e2c4e', wallD: '#44264a', roof: '#3e2244', trim: '#5e3a5e', lit: '#ffd890' });
      // deniz
      const sea = g.createLinearGradient(0, 174, 0, 240); sea.addColorStop(0, '#e8907a'); sea.addColorStop(0.35, '#8a5a8a'); sea.addColorStop(1, '#3a3a78');
      g.fillStyle = sea; g.fillRect(0, 174, vw, vh - 174);
      g.fillStyle = 'rgba(255,236,180,0.55)';
      for (let k = 0; k < 12; k++) { const y = 177 + k * 2.6, w = 30 - k * 1.6; g.fillRect(sx - w / 2 + Math.sin(k * 2.1) * 3, y, w, 0.9); }
      // Kız Kulesi
      maidensTower(g, 48, 194, 0.8, { wall: '#4a2a50', wallD: '#40244a', roof: '#3e2244', trim: '#5e3a5e', rock: '#2e1c3a', lit: '#ffd890' });
    }, bgScale());
    titleCache.set(vw, c);
    return c;
  }
  function hillHousesT(g, col, lit) {
    const r = rng(5);
    for (let x = 2; x < 98; x += 4 + r() * 3) {
      const y = x < 52 ? 150 - Math.sin((x / 52) * Math.PI) * 9 + 4 : 150 + (x - 52) * 0.5 + 3;
      const w = 3 + r() * 2.4, h = 2.6 + r() * 3;
      g.fillStyle = col; g.fillRect(x, y - h, w, h + 30);
      if (r() < 0.4) { g.fillStyle = lit; g.fillRect(x + 1, y - h * 0.6, 0.8, 0.8); }
    }
  }

  root.BA_SCENE = {
    W, H, layers, sky, title, metroLine, SKY, pen, BASE_AT, PLACES, ferry, seagull, cat, mix, galataTower, maidensTower, blueMosque, hagiaSophia, flag, simitCart, tram,
    // hikâye sahneleri de aynı parçaları kullanır
    kit: { B, C, E, P, rect, archWin, dome, minaret, hillMosque, star, bridge, ortakoy, haydarpasa, camlicaTower, house, hillsY, hills, hillHouses,
      cloud, glassTower, tree, pine, tulip, carpet, mosaicLamp, nazar, column, medusaHead, roofTiles, drawSky,
      homeTower, lonelyWindow, windowsRow, hex },
  };
})(window);
