// Bug Avcısı: İstanbul — bonus binişleri. Her bölümün kendi aracı var: metro, metrobüs, tramvay,
// minibüs, taksi ve tarihi Tünel füniküleri. Burada araçların yan görünüşleri, ana bölümdeki
// durak/istasyon girişleri, odanın çıkış merdiveni ve oda arka planları (sokak ya da yer altı) çizilir.
(function (root) {
  'use strict';
  const A = root.BA_ART, SC = root.BA_SCENE;
  const { K, box, rr, circle, poly, lin, grad, shade, mk } = A;
  const TAU = Math.PI * 2;
  const ROAD = 218;                     // tekerleklerin bastığı çizgi (ekran pikseli, 240'lık tuvalde)
  const TOPY = 16;                      // oda satırı 0'ın ekrandaki yeri
  // tavandan tekerleğin bastığı yere yükseklik (generator'daki tavan satırından: 218 - (16 + 16*satır))
  const HT = { metro: 58, metrobus: 58, tram: 58, minibus: 42, taxi: 26, funicular: 42 };
  const under = (rd) => !rd || rd.type === 'metro' || rd.type === 'funicular';
  const bg = () => A.S;
  function rect(g, x, y, w, h, f) { g.fillStyle = f; g.fillRect(x, y, w, h); }
  function txt(g, s, x, y, size, col, weight) {
    g.fillStyle = col; g.font = `${weight || 600} ${size}px Fredoka, sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y);
  }
  function rngOf(seed) { return A.rng(seed); }

  // ---------------- ortak parçalar ----------------
  function wheel(g, x, y, r, rot) {
    circle(g, x, y, r, '#25272e', K, 0.7);
    circle(g, x, y, r * 0.6, '#b4bac4', '#5a606c', 0.5);
    g.strokeStyle = '#6a707c'; g.lineWidth = 0.5; g.beginPath();
    for (let k = 0; k < 5; k++) { const a = rot + k * TAU / 5; g.moveTo(x, y); g.lineTo(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55); }
    g.stroke();
    circle(g, x, y, r * 0.18, '#eef1f5', null);
  }
  // cam: koyu mavi, çapraz parıltı, içinde yolcu siluetleri
  function glass(g, x, y, w, h, r, seed, warm) {
    box(g, x, y, w, h, r, grad(g, 0, y, 0, y + h, warm ? [[0, '#fff3c4'], [1, '#f2d27e']] : [[0, '#6f8fb4'], [1, '#2c3e58']]), null);
    const R = rngOf(seed);
    g.fillStyle = warm ? 'rgba(70,58,48,0.42)' : 'rgba(20,26,40,0.55)';
    const n = R() < 0.3 ? 0 : R() < 0.75 ? 1 : 2;
    for (let j = 0; j < n; j++) {
      const px = x + w * (0.3 + j * 0.4) + (R() - 0.5) * 2, hy = y + h * 0.42;
      if (px > x + w - 2) continue;
      g.beginPath(); g.arc(px, hy, Math.min(2.3, h * 0.17), 0, TAU); g.fill();
      g.beginPath(); g.ellipse(px, y + h, Math.min(3.8, w * 0.3), Math.min(3.6, h * 0.3), 0, Math.PI, 0); g.fill();
    }
    poly(g, [x + 1.5, y + h - 1, x + w * 0.45, y + 1, x + w * 0.62, y + 1, x + w * 0.17 + 1.5, y + h - 1], 'rgba(255,255,255,0.22)', null);
  }
  // egzoz dumanı: zamana bağlı, durumsuz (araç giderken)
  function puffs(g, x, y, t) {
    for (let k = 0; k < 3; k++) {
      const ph = (t * 1.8 + k / 3) % 1;
      g.fillStyle = `rgba(200,204,212,${(1 - ph) * 0.4})`;
      g.beginPath(); g.arc(x - 3 - ph * 16, y - ph * 7, 1.4 + ph * 3.2, 0, TAU); g.fill();
    }
  }
  function lights(g, hx, hy, tx, ty, t) {
    const hg = g.createRadialGradient(hx, hy, 0.5, hx, hy, 7);
    hg.addColorStop(0, 'rgba(255,250,220,0.95)'); hg.addColorStop(1, 'rgba(255,250,220,0)');
    g.fillStyle = hg; g.fillRect(hx - 7, hy - 7, 14, 14);
    const tg = g.createRadialGradient(tx, ty, 0.3, tx, ty, 4.5);
    tg.addColorStop(0, `rgba(255,70,50,${0.75 + 0.2 * Math.sin(t * 3)})`); tg.addColorStop(1, 'rgba(255,70,50,0)');
    g.fillStyle = tg; g.fillRect(tx - 4.5, ty - 4.5, 9, 9);
  }

  // ---------------- araç gövdeleri (önbellekli; tavanın sol üstü 0,0) ----------------
  const bodyCache = A.cache();
  function body(rd, w, slope) {
    const k = rd.type + ':' + w + ':' + rd.col + ':' + (slope || 0).toFixed(4);
    let c = bodyCache.get(k);
    if (c) return c;
    const H = HT[rd.type], pad = rd.type === 'taxi' ? 8 : 0;
    c = mk(w + 4, H + pad, (g) => {
      g.translate(2, pad);
      if (rd.type === 'metrobus') metrobusBody(g, w, H, rd.col);
      else if (rd.type === 'tram') tramBody(g, w, H, rd.col);
      else if (rd.type === 'minibus') minibusBody(g, w, H, rd.col);
      else if (rd.type === 'taxi') taxiBody(g, w, H, rd.col);
      else if (rd.type === 'funicular') funiBody(g, w, H, rd.col, slope || 0);
    }, bg());
    c.pad = pad;
    bodyCache.set(k, c);
    return c;
  }
  // körüklü metrobüs: arka bölüm, körük, ön bölüm; üç dingil
  function metrobusAxles(w) { const bx = Math.round(w * 0.46); return { bx, bw: 7, ax: [24, bx + 7 + 26, w - 24] }; }
  function metrobusBody(g, w, H, col) {
    const { bx, bw, ax } = metrobusAxles(w), by = H - 6;
    const secs = [[0, bx], [bx + bw, w]];
    // körük
    box(g, bx - 1, 5, bw + 2, by - 9, 1, '#3a3e48', K, 0.6);
    g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 0.5;
    for (let x = bx + 0.6; x < bx + bw; x += 1.6) { g.beginPath(); g.moveTo(x, 7); g.lineTo(x, by - 6); g.stroke(); }
    secs.forEach(([x0, x1], n) => {
      const front = n === 1, cw = x1 - x0;
      g.save();
      rr(g, x0, 0.6, cw, by, 5); g.clip();
      g.fillStyle = grad(g, 0, 0, 0, by, [[0, '#fbfbf8'], [0.6, '#eceeef'], [1, '#cfd3d9']]); g.fillRect(x0, 0, cw, by + 1);
      // tavan
      rect(g, x0, 0, cw, 3.6, '#c3c8d0'); rect(g, x0, 0.6, cw, 0.8, 'rgba(255,255,255,0.8)'); rect(g, x0, 3.6, cw, 0.7, 'rgba(0,0,0,0.16)');
      // pencere bandı
      rect(g, x0, 7.5, cw, 20, '#273142');
      let i = 0;
      for (let x = x0 + 4; x + 12 <= x1 - (front ? 12 : 3); x += 15) {
        const door = (!front && x >= x0 + 30 && x < x0 + 45) || (front && x >= x0 + 30 && x < x0 + 45);
        if (!door) glass(g, x, 9.3, 12, 16.4, 1.4, n * 31 + i++);
      }
      // kapılar: cam, çift kanat
      for (const dx of front ? [x0 + 31] : [x0 + 31]) {
        box(g, dx, 7.5, 13, by - 9, 1, '#d7dbe1', '#7d8490', 0.6);
        glass(g, dx + 1.4, 9, 4.6, by - 13, 0.8, dx); glass(g, dx + 7, 9, 4.6, by - 13, 0.8, dx + 3);
        lin(g, dx + 6.5, 8, dx + 6.5, by - 2, '#7d8490', 0.6);
      }
      // hat şeridi ve etek
      rect(g, x0, 30.5, cw, 4.6, col); rect(g, x0, 35.1, cw, 1, shade(col, -0.35));
      rect(g, x0, by - 7, cw, 7, '#a2a9b4'); rect(g, x0, by - 7, cw, 0.6, 'rgba(255,255,255,0.4)');
      // tekerlek yuvaları
      for (const a of ax) if (a > x0 && a < x1) circle(g, a, by + 1, 8.6, '#1b1d24', null);
      if (front) {
        // ön cam ve hat göstergesi
        poly(g, [x1 - 11, 7.5, x1 - 3, 3.2, x1, 6, x1, 30, x1 - 11, 30], grad(g, 0, 4, 0, 30, [[0, '#5a7aa0'], [1, '#1c2a3e']]), null);
        lin(g, x1 - 8, 10, x1 - 3, 15, 'rgba(255,255,255,0.4)', 0.8);
        box(g, x1 - 27, 1.2, 15, 5, 1, '#16130e', null);
        txt(g, '34', x1 - 19.5, 3.9, 4.4, '#ffb02e', 600);
        box(g, x1 - 6, by - 11, 5.5, 3.6, 1.2, '#f6f2e0', '#5c616c', 0.5);
      } else {
        rect(g, x0, 7.5, 3, 20, '#3a4456');
        box(g, x0 + 0.6, by - 11, 3.6, 4, 1, '#7a1e1a', '#3a1010', 0.5);
      }
      g.restore();
      rr(g, x0, 0.6, cw, by, 5); A.fs(g, null, K, 0.8);
    });
  }
  // modern alçak tabanlı tramvay: üç modül, yuvarlak burunlar, alt bant hat renginde
  function tramBody(g, w, H, col) {
    const by = H - 5, j = 3, m = (w - 2 * j) / 3;
    const mods = [[0, m], [m + j, 2 * m + j], [2 * m + 2 * j, w]];
    // bojiler (tekerlekler ayrıca çizilir), modül araları
    for (const x of [m, 2 * m + j]) box(g, x - 0.5, 6, j + 1, by - 10, 0.6, '#3a3e48', K, 0.5);
    mods.forEach(([x0, x1], n) => {
      const cw = x1 - x0, nose = n === 0 ? 'l' : n === 2 ? 'r' : '';
      g.save();
      g.beginPath();
      const rl = nose === 'l' ? 12 : 3, rrr = nose === 'r' ? 12 : 3;
      g.moveTo(x0 + rl, 0.6); g.lineTo(x1 - rrr, 0.6); g.quadraticCurveTo(x1, 0.6, x1, rrr + 0.6);
      g.lineTo(x1, by - 2); g.quadraticCurveTo(x1, by, x1 - 2, by); g.lineTo(x0 + 2, by); g.quadraticCurveTo(x0, by, x0, by - 2);
      g.lineTo(x0, rl + 0.6); g.quadraticCurveTo(x0, 0.6, x0 + rl, 0.6); g.closePath();
      g.clip();
      g.fillStyle = grad(g, 0, 0, 0, by, [[0, '#fbfbfa'], [1, '#e2e5ea']]); g.fillRect(x0, 0, cw, by + 1);
      rect(g, x0, 0, cw, 3, '#c9ced6'); rect(g, x0, 3, cw, 0.6, 'rgba(0,0,0,0.15)');
      // pencereler
      rect(g, x0, 8, cw, 21, '#253044');
      let i = 0;
      const s0 = x0 + (nose === 'l' ? 12 : 4), s1 = x1 - (nose === 'r' ? 13 : 4);
      for (let x = s0; x + 11 <= s1; x += 14) {
        if (n === 1 && x > x0 + 18 && x < x0 + 32) continue;
        glass(g, x, 10, 11, 17, 1.4, n * 17 + i++);
      }
      if (n === 1) {
        const dx = x0 + cw / 2 - 7;
        box(g, dx, 8, 14, by - 9, 1, '#d7dbe1', '#7d8490', 0.6);
        glass(g, dx + 1.4, 9.5, 5, by - 14, 0.8, 5); glass(g, dx + 7.6, 9.5, 5, by - 14, 0.8, 6);
      }
      // burun camı
      if (nose === 'r') poly(g, [x1 - 12, 8, x1 - 4, 2, x1, 8, x1, 31, x1 - 12, 31], grad(g, 0, 2, 0, 31, [[0, '#5a7aa0'], [1, '#1c2a3e']]), null);
      if (nose === 'l') poly(g, [x0 + 12, 8, x0 + 4, 2, x0, 8, x0, 31, x0 + 12, 31], grad(g, 0, 2, 0, 31, [[0, '#4a6a8e'], [1, '#1c2a3e']]), null);
      // alt bant
      rect(g, x0, 33, cw, by - 33, col); rect(g, x0, 33, cw, 0.8, 'rgba(255,255,255,0.35)');
      rect(g, x0, by - 4, cw, 4, shade(col, -0.35));
      if (nose === 'r') { box(g, x1 - 6, 36, 5, 3.2, 1.2, '#f6f2e0', '#5c616c', 0.5); box(g, x1 - 22, 2.4, 13, 4.4, 1, '#16130e', null); txt(g, 'T1', x1 - 15.5, 4.7, 4, '#ffb02e'); }
      if (nose === 'l') box(g, x0 + 1, 36, 4, 3.2, 1.2, '#7a1e1a', '#3a1010', 0.5);
      g.restore();
      g.beginPath();
      g.moveTo(x0 + rl, 0.6); g.lineTo(x1 - rrr, 0.6); g.quadraticCurveTo(x1, 0.6, x1, rrr + 0.6);
      g.lineTo(x1, by - 2); g.quadraticCurveTo(x1, by, x1 - 2, by); g.lineTo(x0 + 2, by); g.quadraticCurveTo(x0, by, x0, by - 2);
      g.lineTo(x0, rl + 0.6); g.quadraticCurveTo(x0, 0.6, x0 + rl, 0.6); g.closePath();
      A.fs(g, null, K, 0.8);
    });
    // tavanda pantograf tabanı
    box(g, w / 2 - 8, -0.2, 16, 2.2, 0.8, '#5a606c', K, 0.5);
  }
  const TRAM_AX = (w) => [10, w / 3 - 6, w / 3 + 9, 2 * w / 3 - 6, 2 * w / 3 + 9, w - 10];
  // turkuaz minibüs: yüksek tavan, kısa burun, sürgülü kapı
  function minibusBody(g, w, H, col) {
    const by = H - 8, fx = w - 13;
    const shape = () => {
      g.beginPath();
      g.moveTo(4, 0.6); g.lineTo(fx, 0.6); g.quadraticCurveTo(fx + 3, 0.8, fx + 5, 3);
      g.lineTo(w - 3, 17); g.quadraticCurveTo(w, 18.5, w, 22); g.lineTo(w, by - 2); g.quadraticCurveTo(w, by, w - 2, by);
      g.lineTo(2, by); g.quadraticCurveTo(0, by, 0, by - 2); g.lineTo(0, 4.6); g.quadraticCurveTo(0, 0.6, 4, 0.6); g.closePath();
    };
    g.save(); shape(); g.clip();
    g.fillStyle = grad(g, 0, 0, 0, by, [[0, shade(col, 0.22)], [0.5, col], [1, shade(col, -0.2)]]); g.fillRect(0, 0, w, by + 1);
    rect(g, 0, 0, w, 2.6, '#f2f6f6'); rect(g, 0, 2.6, w, 0.6, 'rgba(0,0,0,0.15)');
    // yan camlar
    rect(g, 3, 5.5, fx - 3, 12.6, '#22303a');
    let i = 0;
    for (let x = 5; x + 11 <= fx - 1; x += 13) glass(g, x, 6.6, 11, 10.4, 1.3, 40 + i++);
    // ön cam ve içinde güzergâh levhası
    poly(g, [fx - 1, 5.5, fx + 3.5, 5.5, w - 3, 17.5, fx - 1, 17.5], grad(g, 0, 5, 0, 18, [[0, '#6a8aac'], [1, '#22303a']]), null);
    box(g, fx + 0.5, 12.4, 6, 3.6, 0.6, '#f8f6ee', '#5c616c', 0.4);
    // beyaz kuşak, sürgülü kapı, çamurluk
    rect(g, 0, 20, w, 2.4, '#f6f8f8');
    rect(g, 53, 5, 0.8, by - 6, 'rgba(0,0,0,0.35)'); rect(g, 67, 5, 0.8, by - 6, 'rgba(0,0,0,0.35)');
    rect(g, 64, 24, 2.4, 1, 'rgba(0,0,0,0.5)');
    rect(g, 0, by - 5, w, 5, shade(col, -0.32));
    for (const a of [17, w - 18]) circle(g, a, by + 1, 7.8, '#1b1d24', null);
    g.restore();
    shape(); A.fs(g, null, K, 0.8);
    box(g, w - 5, 24, 4.4, 3.2, 1.2, '#f6f2e0', '#5c616c', 0.5);
    box(g, 0.5, 23, 2.6, 4, 1, '#7a1e1a', '#3a1010', 0.5);
    box(g, w - 7, by - 4.4, 7.4, 3.6, 1, '#b8bec8', K, 0.5);
  }
  // sarı taksi: kutu gövdeli, tavanında TAKSİ lambası
  function taxiBody(g, w, H, col) {
    const by = H - 6, fx = w - 18;
    const shape = () => {
      g.beginPath();
      g.moveTo(4, 0.6); g.lineTo(fx, 0.6); g.quadraticCurveTo(fx + 2, 0.7, fx + 3.4, 2);
      g.lineTo(w - 8, 8.6); g.lineTo(w - 3, 9.6); g.quadraticCurveTo(w, 10.2, w, 13); g.lineTo(w, by - 1.6); g.quadraticCurveTo(w, by, w - 2, by);
      g.lineTo(2, by); g.quadraticCurveTo(0, by, 0, by - 2); g.lineTo(0, 4); g.quadraticCurveTo(0, 0.6, 4, 0.6); g.closePath();
    };
    // tavan lambası
    box(g, w / 2 - 12, -6.5, 20, 6.4, 1.6, grad(g, 0, -6, 0, 0, [[0, '#fff7c8'], [1, '#f2d44a']]), K, 0.6);
    txt(g, 'TAKSİ', w / 2 - 2, -3.1, 3.7, '#231d33', 600);
    g.save(); shape(); g.clip();
    g.fillStyle = grad(g, 0, 0, 0, by, [[0, shade(col, 0.25)], [0.55, col], [1, shade(col, -0.18)]]); g.fillRect(0, 0, w, by + 1);
    rect(g, 3, 3, fx - 2, 7.4, '#26303c');
    glass(g, 5, 3.8, 14, 5.8, 1, 71); glass(g, 21, 3.8, 15, 5.8, 1, 72); glass(g, 38, 3.8, fx - 39, 5.8, 1, 73);
    poly(g, [fx + 0.5, 3, fx + 2.6, 3, w - 9, 9.4, fx + 0.5, 9.4], grad(g, 0, 3, 0, 10, [[0, '#6a8aac'], [1, '#22303a']]), null);
    // dama şeridi
    for (let x = 0, k = 0; x < w; x += 2.2, k++) { rect(g, x, 12, 2.2, 1.2, k % 2 ? '#231d33' : '#ffffff'); rect(g, x, 13.2, 2.2, 1.2, k % 2 ? '#ffffff' : '#231d33'); }
    rect(g, 36.5, 3, 0.8, by - 4, 'rgba(0,0,0,0.3)'); rect(g, 19.6, 3, 0.8, by - 4, 'rgba(0,0,0,0.3)');
    for (const a of [15, w - 17]) circle(g, a, by + 1, 6.6, '#1b1d24', null);
    rect(g, 0, by - 3, w, 3, shade(col, -0.35));
    g.restore();
    shape(); A.fs(g, null, K, 0.8);
    box(g, w - 4, 11, 3.6, 2.6, 1, '#f6f2e0', '#5c616c', 0.4);
    box(g, 0.4, 10.5, 2.4, 3, 0.8, '#7a1e1a', '#3a1010', 0.4);
  }
  // Tünel'in kırmızı vagonu: tavan düz (üstünde durulur), tabanı rampaya paralel
  function funiBody(g, w, H, col, s) {
    const b0 = H - 6, b1 = H - 6 + s * w;     // arka ve ön taban
    const shape = () => {
      g.beginPath();
      g.moveTo(4, 0.6); g.lineTo(w - 4, 0.6); g.quadraticCurveTo(w, 0.6, w, 4.6);
      g.lineTo(w, b1 - 2); g.lineTo(w - 2, b1); g.lineTo(2, b0); g.lineTo(0, b0 - 2); g.lineTo(0, 4.6); g.quadraticCurveTo(0, 0.6, 4, 0.6); g.closePath();
    };
    g.save(); shape(); g.clip();
    g.fillStyle = grad(g, 0, 0, 0, b0, [[0, shade(col, 0.15)], [1, shade(col, -0.2)]]); g.fillRect(0, 0, w, b0 + 1);
    rect(g, 0, 0, w, 3.4, '#e9e2d0'); rect(g, 0, 3.4, w, 0.6, 'rgba(0,0,0,0.2)');
    // krem pencere bandı, sıcak ışıklı camlar
    rect(g, 0, 6, w, 16, '#efe6d0');
    let i = 0;
    for (let x = 6; x + 13 <= w - 5; x += 17) {
      if (i === 3) { i++; continue; }
      glass(g, x, 7.4, 13, 13, 1.6, 90 + i++, true);
    }
    const dx = 6 + 3 * 17;
    box(g, dx - 1, 6, 15, b0 - 8 + s * (dx + 7), 1, shade(col, -0.1), shade(col, -0.45), 0.6);
    glass(g, dx + 1.5, 8, 4.6, 11, 0.8, 3, true); glass(g, dx + 7.6, 8, 4.6, 11, 0.8, 4, true);
    rect(g, 0, 23.5, w, 1.4, '#d8b25a');
    g.restore();
    shape(); A.fs(g, null, K, 0.8);
    box(g, w - 5, 26 + s * w * 0.9, 4.2, 3, 1, '#f6f2e0', '#5c616c', 0.4);
  }

  // ---------------- araç (her kare) ----------------
  // pl: tren platformu (x, y, w, a, ya, yb, b karo); room: oda; dist (px) tekerlek dönüşü için
  function drawVehicle(g, rd, pl, t, TS) {
    const x = pl.x * TS, y = pl.y * TS, w = pl.w * TS, dist = (pl.x - pl.a) * TS, moving = pl.state === 'go';
    if (!rd || rd.type === 'metro') { A.drawTrain(g, x, y, w, t, rd ? rd.col : '#2fa84f', dist, moving); return; }
    const H = HT[rd.type];
    const slope = rd.type === 'funicular' && pl.b !== pl.a ? (pl.yb - pl.ya) / (pl.b - pl.a) : 0;
    if (rd.type === 'metrobus') {
      const { ax } = metrobusAxles(w);
      for (const a of ax) wheel(g, x + a, y + H - 6.4, 6.4, dist / 6.4);
    } else if (rd.type === 'tram') {
      for (const a of TRAM_AX(w)) wheel(g, x + a, y + H - 3.6, 3.6, dist / 3.6);
    } else if (rd.type === 'minibus') {
      for (const a of [17, w - 18]) wheel(g, x + a, y + H - 6, 6, dist / 6);
    } else if (rd.type === 'taxi') {
      for (const a of [15, w - 17]) wheel(g, x + a, y + H - 5, 5, dist / 5);
    } else if (rd.type === 'funicular') {
      for (const a of [12, 30, w - 30, w - 12]) wheel(g, x + a, y + H - 3.4 + slope * a, 3.4, dist / 3.4);
    }
    const c = body(rd, w, slope);
    g.drawImage(c, x - 2, y - c.pad, c.lw, c.lh);
    // pantograf: tavandan katenere (ekranda 128)
    if (rd.type === 'tram') {
      const cx = x + w / 2, top = y - 31;
      g.strokeStyle = K; g.lineWidth = 1.8;
      g.beginPath(); g.moveTo(cx - 5, y); g.lineTo(cx + 4, y - 15); g.lineTo(cx - 3, top); g.stroke();
      g.strokeStyle = '#8a909c'; g.lineWidth = 0.9;
      g.beginPath(); g.moveTo(cx - 5, y); g.lineTo(cx + 4, y - 15); g.lineTo(cx - 3, top); g.stroke();
      box(g, cx - 10, top - 1.2, 14, 1.8, 0.6, '#3a3e48', K, 0.4);
      if (moving && Math.floor(t * 9) % 7 === 0) circle(g, cx - 3, top - 1.5, 1.2, '#bfe8ff', null);
    }
    const ly = { metrobus: 34, tram: 37.6, minibus: 25.6, taxi: 12.3, funicular: 27.5 + slope * w * 0.9 }[rd.type];
    lights(g, x + w - 3, y + ly, x + 2, y + ly + (rd.type === 'minibus' ? -0.6 : 0), t);
    if (moving && (rd.type === 'metrobus' || rd.type === 'minibus' || rd.type === 'taxi')) puffs(g, x - 1, y + H - 5, t);
  }

  // ---------------- ana bölümdeki giriş/varış noktaları ----------------
  // (x, y): girişin karosu (2 karo genişlik), zemin y + 16
  function drawGate(g, rd, x, y, t) {
    const type = rd ? rd.type : 'metro', col = rd ? rd.col : '#2fa84f', by = y + 16;
    if (type === 'metro') { A.drawMetroGate(g, x, y, t, col, rd ? rd.line : 'M'); return; }
    if (type === 'funicular') {
      // taş kemerli eski giriş, içinde aşağı inen merdiven
      g.save();
      g.beginPath(); g.moveTo(x + 3, by); g.lineTo(x + 3, by - 18); g.arc(x + 16, by - 18, 13, Math.PI, 0); g.lineTo(x + 29, by); g.closePath();
      g.fillStyle = grad(g, 0, by - 31, 0, by, [[0, '#4a3a30'], [1, '#100c0a']]); g.fill(); g.clip();
      g.strokeStyle = 'rgba(230,200,160,0.4)'; g.lineWidth = 0.7;
      for (let k = 0; k < 5; k++) { const yy = by - 3 - k * 4, ins = 5 + k * 1.3; g.beginPath(); g.moveTo(x + ins, yy); g.lineTo(x + 32 - ins, yy); g.stroke(); }
      g.restore();
      g.strokeStyle = K; g.lineWidth = 4.6;
      g.beginPath(); g.moveTo(x + 2.5, by); g.lineTo(x + 2.5, by - 18); g.arc(x + 16, by - 18, 13.5, Math.PI, 0); g.lineTo(x + 29.5, by); g.stroke();
      g.strokeStyle = '#d8c8a8'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(x + 2.5, by); g.lineTo(x + 2.5, by - 18); g.arc(x + 16, by - 18, 13.5, Math.PI, 0); g.lineTo(x + 29.5, by); g.stroke();
      for (let k = 0; k < 7; k++) { const a = Math.PI + (k + 0.5) * Math.PI / 7; lin(g, x + 16 + Math.cos(a) * 12, by - 18 + Math.sin(a) * 12, x + 16 + Math.cos(a) * 15, by - 18 + Math.sin(a) * 15, 'rgba(90,70,50,0.6)', 0.5); }
      box(g, x + 7, by - 44, 18, 11, 2.6, col, K, 0.8);
      txt(g, rd.line, x + 16, by - 38.2, 7.4, '#ffffff');
      return;
    }
    if (type === 'metrobus' || type === 'tram') {
      // sundurmalı durak: cam arka pano, iki direk, saçakta hat rozeti
      g.fillStyle = 'rgba(170,215,240,0.32)'; g.fillRect(x + 3, by - 28, 26, 22);
      lin(g, x + 3, by - 6, x + 29, by - 6, 'rgba(255,255,255,0.5)', 0.6);
      for (const px of [x + 2.5, x + 29.5]) { lin(g, px, by, px, by - 33, K, 2.4); lin(g, px, by, px, by - 33, '#9aa3b2', 1.1); }
      box(g, x - 3, by - 36, 38, 4.4, 1.4, '#e8ecf2');
      g.fillStyle = col; g.fillRect(x - 2, by - 33.4, 36, 1.2);
      // oturak
      box(g, x + 7, by - 11, 18, 2.4, 0.8, '#7a8496', K, 0.5);
      box(g, x + 9, by - 47, 14, 11, type === 'tram' ? 5.5 : 2.6, col, K, 0.8);
      txt(g, rd.line, x + 16, by - 41.2, rd.line.length > 2 ? 6.2 : 7.6, '#ffffff');
      return;
    }
    if (type === 'minibus' || type === 'taxi') {
      if (type === 'taxi') {
        // taksi durağı kulübesi
        box(g, x + 2, by - 24, 28, 24, 2, grad(g, 0, by - 24, 0, by, [[0, '#f4efe2'], [1, '#d8d0bc']]));
        box(g, x + 6, by - 19, 11, 9, 1.2, grad(g, 0, by - 19, 0, by - 10, [[0, '#8ab0d0'], [1, '#3a5068']]), K, 0.6);
        box(g, x + 20, by - 19, 7, 19, 1, '#b08a5a', K, 0.6);
        circle(g, x + 21.6, by - 9, 0.7, '#3a2a1a', null);
        box(g, x, by - 27, 32, 4, 1.2, '#4a4f5a');
        box(g, x + 5, by - 36, 22, 9, 2, grad(g, 0, by - 36, 0, by - 27, [[0, '#fff7c8'], [1, '#f2c21b']]), K, 0.7);
        txt(g, 'TAKSİ', x + 16, by - 31.4, 5, '#231d33');
        void t;
        return;
      }
      // minibüs durağı: direk ve üstünde minibüs simgeli tabela, yanında oturak
      lin(g, x + 22, by, x + 22, by - 40, K, 2.4); lin(g, x + 22, by, x + 22, by - 40, '#9aa3b2', 1.1);
      box(g, x + 11, by - 50, 22, 15, 2.4, col, K, 0.8);
      vanIcon(g, x + 22, by - 42.5, '#ffffff');
      box(g, x + 1, by - 8, 14, 2.2, 0.8, '#8a6a4a', K, 0.5);
      lin(g, x + 3, by - 6, x + 3, by, K, 1); lin(g, x + 13, by - 6, x + 13, by, K, 1);
    }
  }
  function vanIcon(g, cx, cy, col) {
    g.fillStyle = col;
    g.beginPath(); g.moveTo(cx - 7, cy + 2.4); g.lineTo(cx - 7, cy - 3.2); g.quadraticCurveTo(cx - 7, cy - 4.4, cx - 5.6, cy - 4.4);
    g.lineTo(cx + 3, cy - 4.4); g.lineTo(cx + 7, cy - 0.6); g.lineTo(cx + 7, cy + 2.4); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(cx - 5.6, cy - 3.2, 3, 2.4); g.fillRect(cx - 1.8, cy - 3.2, 3, 2.4);
    g.beginPath(); g.moveTo(cx + 2, cy - 3.2); g.lineTo(cx + 3, cy - 3.2); g.lineTo(cx + 5.4, cy - 0.8); g.lineTo(cx + 2, cy - 0.8); g.closePath(); g.fill();
    g.fillStyle = col; g.beginPath(); g.arc(cx - 4, cy + 3, 1.7, 0, TAU); g.arc(cx + 4, cy + 3, 1.7, 0, TAU); g.fill();
  }

  // ---------------- odanın çıkışı: sağa yükselen merdiven ----------------
  function drawExit(g, rd, x, y, t) {
    const type = rd ? rd.type : 'metro', col = rd ? rd.col : '#2fa84f', by = y + 16;
    if (type === 'metro') { A.drawEscalator(g, x, y, t, col); return; }
    const stone = type === 'funicular';
    poly(g, [x - 4, by, x + 6, by, x + 36, by - 34, x + 36, by - 22, x + 10, by + 0], stone ? '#8a6a52' : '#a8adb6', K, 0.8);
    g.save();
    g.beginPath(); g.moveTo(x - 2, by - 1); g.lineTo(x + 6, by - 1); g.lineTo(x + 34, by - 33); g.lineTo(x + 26, by - 33); g.closePath(); g.clip();
    g.fillStyle = stone ? '#c8b494' : '#d4d8de'; g.fillRect(x - 4, by - 36, 42, 38);
    g.strokeStyle = stone ? '#6a5040' : '#7a808c'; g.lineWidth = 0.9;
    for (let k = 0; k < 9; k++) { const d = k * 5, xx = x + d * 0.66, yy = by - 1 - d * 0.75; g.beginPath(); g.moveTo(xx - 2, yy); g.lineTo(xx + 6, yy); g.stroke(); }
    g.restore();
    lin(g, x - 3, by - 9, x + 30, by - 44, K, 2.4); lin(g, x - 3, by - 9, x + 30, by - 44, stone ? '#d8b25a' : '#c9ced8', 1.1);
    for (let k = 0; k < 4; k++) { const xx = x - 1 + k * 9.5; lin(g, xx, by - 2 - k * 10.4, xx, by - 11 - k * 10.6, stone ? '#d8b25a' : '#9aa3b2', 0.8); }
    box(g, x - 6, by - 52, 14, 11, 2.4, col, K, 0.8);
    g.strokeStyle = '#ffffff'; g.lineWidth = 1.6; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(x - 2, by - 43.6); g.lineTo(x + 4, by - 49.4); g.moveTo(x - 0.4, by - 49.4); g.lineTo(x + 4, by - 49.4); g.lineTo(x + 4, by - 45); g.stroke();
  }

  // ---------------- sokak hattı: yol, duraklar ve öndeki bant ----------------
  const lineCache = A.cache();
  // istasyon tabelası: hat rozeti ve ad
  function sign(name, ln, col, round) {
    const fs = name.length > 11 ? 6.2 : 7.6, mw = Math.max(48, name.length * fs * 0.62 + 30);
    return mk(mw, 18, (g) => {
      box(g, 0.5, 0.5, mw - 1, 17, 2.5, '#1d2c55', '#0c1430', 0.8);
      if (ln) { box(g, 4, 3, 14, 12, round ? 6 : 2.6, col, null); txt(g, ln, 11, 9.4, ln.length > 2 ? 5.6 : 7.2, '#ffffff'); }
      else { box(g, 4, 3, 14, 12, 2.6, col, null); vanIcon(g, 11, 8.8, '#ffffff'); }
      txt(g, name, 18 + (mw - 22) / 2, 9.6, fs, '#ffffff');
    }, bg());
  }
  // yolun arka kısmı (128 px, tekrar eder): araç bu bandın önünde gider
  // gece sahnelerinde sokak parçaları laciverte boyanır (lambalar yanar)
  function tint(g, w, h, night) {
    if (!night) return;
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop';
    g.fillStyle = 'rgba(14,20,58,0.55)'; g.fillRect(0, 0, g.canvas.width, g.canvas.height); g.restore();
    void w; void h;
  }
  function glow(g, x, y, r) {
    const gl = g.createRadialGradient(x, y, 0.5, x, y, r); gl.addColorStop(0, 'rgba(255,226,150,0.5)'); gl.addColorStop(1, 'rgba(255,226,150,0)');
    g.fillStyle = gl; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function roadStrip(type, vh, night) {
    return mk(128, vh, (g) => {
      const R = rngOf(type.length * 7);
      if (type === 'metrobus') {
        // karşı şerit bariyeri ve yol lambası
        lin(g, 64, 196, 64, 74, K, 2.6); lin(g, 64, 196, 64, 74, '#8d96a4', 1.4);
        for (const d of [-1, 1]) {
          g.strokeStyle = K; g.lineWidth = 2; g.beginPath(); g.moveTo(64, 78); g.quadraticCurveTo(64 + d * 4, 70, 64 + d * 16, 71); g.stroke();
          g.strokeStyle = '#8d96a4'; g.lineWidth = 1; g.beginPath(); g.moveTo(64, 78); g.quadraticCurveTo(64 + d * 4, 70, 64 + d * 16, 71); g.stroke();
          box(g, 64 + d * 16 - 4, 70, 8, 2.6, 1, '#fff4c8', K, 0.5);
        }
        rect(g, 0, 192, 128, 14, '#b9bcc2'); rect(g, 0, 192, 128, 2.4, '#dcdfe4'); rect(g, 0, 204, 128, 2, 'rgba(0,0,0,0.25)');
        for (let x = 0; x < 128; x += 32) { rect(g, x, 192, 0.8, 14, 'rgba(0,0,0,0.18)'); rect(g, x + 14, 197, 4, 2, '#f4c531'); }
        rect(g, 0, 206, 128, 12, '#575b66');
        rect(g, 0, 207.4, 128, 1, '#e8ecf2');
      } else if (type === 'tram') {
        // kaldırım, katener direği ve teli
        rect(g, 0, 198, 128, 8, '#d4ccba');
        for (let x = 0; x < 128; x += 8) rect(g, x, 198, 0.6, 8, 'rgba(0,0,0,0.12)');
        rect(g, 0, 204.6, 128, 1.4, '#a69c88');
        lin(g, 22, 206, 22, 110, K, 2.8); lin(g, 22, 206, 22, 110, '#4d5c58', 1.5);
        lin(g, 22, 122, 70, 122, K, 1.6); lin(g, 22, 122, 70, 122, '#4d5c58', 0.8);
        lin(g, 22, 114, 60, 122, '#4d5c58', 0.6);
        for (let x = 6; x < 128; x += 24) lin(g, x, 122.4, x, 127.4, 'rgba(40,40,48,0.6)', 0.4);
        rect(g, 0, 127.4, 128, 0.9, '#2a2a30');
        // taş döşeli hat yatağı ve arka ray
        rect(g, 0, 206, 128, 12, '#8e877c');
        for (let y = 206.5, r = 0; y < 217; y += 3.6, r++) for (let x = (r % 2) * 3; x < 128; x += 6) { g.fillStyle = R() < 0.5 ? '#9e978b' : '#857e73'; A.rr(g, x + 0.3, y, 5.3, 3, 1); g.fill(); }
        rect(g, 0, 209, 128, 1.6, '#c9ced8'); rect(g, 0, 210.6, 128, 0.8, '#5f6570');
      } else {
        // kaldırım, ağaçlar, sokak lambası (minibüs: çınar, taksi: çam)
        rect(g, 0, 196, 128, 10, type === 'taxi' ? '#b8ae9c' : '#cfc9bd');
        for (let x = 0; x < 128; x += 10) rect(g, x, 196, 0.6, 10, 'rgba(0,0,0,0.12)');
        rect(g, 0, 204.4, 128, 1.6, '#9a9488');
        if (type === 'taxi') {
          // taş istinat duvarı ve çamlar
          for (let y = 178, r = 0; y < 196; y += 6, r++) for (let x = (r % 2) * 7 - 7; x < 128; x += 14) box(g, x + 0.4, y + 0.4, 13.2, 5.2, 1.4, R() < 0.5 ? '#a89a84' : '#988a74', 'rgba(60,50,40,0.5)', 0.4);
          for (const px of [34, 76]) {
            rect(g, px - 1.4, 140, 2.8, 40, '#6a4a32');
            for (let k = 0; k < 3; k++) poly(g, [px - 15 + k * 3, 160 - k * 13, px + 15 - k * 3, 160 - k * 13, px, 134 - k * 13], k % 2 ? '#3f7a4a' : '#356a40', K, 0.6);
          }
          lin(g, 96, 196, 96, 108, K, 2.4); lin(g, 96, 196, 96, 108, '#5a6070', 1.2);
          g.strokeStyle = K; g.lineWidth = 1.8; g.beginPath(); g.moveTo(96, 110); g.quadraticCurveTo(97, 102, 106, 103); g.stroke();
          g.strokeStyle = '#5a6070'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(96, 110); g.quadraticCurveTo(97, 102, 106, 103); g.stroke();
          box(g, 103, 102, 8, 3, 1.2, '#fff4c8', K, 0.5);
        } else {
          for (const px of [30]) {
            rect(g, px - 2, 150, 4, 46, '#8a6a4e'); rect(g, px - 2, 150, 1.4, 46, 'rgba(255,255,255,0.18)');
            for (const [dx, dy, r] of [[-12, 148, 13], [11, 146, 14], [0, 134, 16], [-6, 140, 12]]) circle(g, px + dx, dy, r, '#5aa04a', K, 0.6);
            for (const [dx, dy, r] of [[-8, 134, 6], [6, 128, 5]]) circle(g, px + dx, dy, r, 'rgba(255,255,255,0.14)', null);
          }
          lin(g, 96, 196, 96, 108, K, 2.4); lin(g, 96, 196, 96, 108, '#5a6070', 1.2);
          g.strokeStyle = K; g.lineWidth = 1.8; g.beginPath(); g.moveTo(96, 110); g.quadraticCurveTo(97, 102, 106, 103); g.stroke();
          g.strokeStyle = '#5a6070'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(96, 110); g.quadraticCurveTo(97, 102, 106, 103); g.stroke();
          box(g, 103, 102, 8, 3, 1.2, '#fff4c8', K, 0.5);
        }
        rect(g, 0, 206, 128, 12, '#5a5d66');
        for (let x = 6; x < 128; x += 32) rect(g, x, 210.6, 16, 1.4, type === 'taxi' ? '#e8ecf2' : '#f4c531');
      }
      const sh = g.createLinearGradient(0, 206, 0, 218); sh.addColorStop(0, 'rgba(0,0,0,0.12)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = sh; g.fillRect(0, 206, 128, 12);
      // asfalt dokusu
      for (let i = 0; i < 70; i++) { g.fillStyle = R() < 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)'; g.fillRect(R() * 128, 206.5 + R() * 11, 1, 0.7); }
      tint(g, 128, vh, night);
      if (night) {
        if (type === 'metrobus') { glow(g, 48, 74, 22); glow(g, 80, 74, 22); }
        else if (type === 'taxi' || type === 'minibus') { glow(g, 107, 105, 26); box(g, 103, 102, 8, 3, 1.2, '#fff4c8', K, 0.5); }
      }
    }, bg());
  }
  // önde kalan bant: düşen oyuncu bunun arkasında kaybolur
  function frontStrip(type, vh, night) {
    return mk(128, vh, (g) => {
      const R = rngOf(type.length * 13);
      if (type === 'metrobus') {
        // beton bariyer (New Jersey profili)
        rect(g, 0, 218, 128, 22, '#aeb3bb');
        g.fillStyle = grad(g, 0, 218, 0, 240, [[0, '#e4e6ea'], [0.2, '#c9cdd3'], [0.35, '#b7bcc4'], [1, '#8e949e']]); g.fillRect(0, 218, 128, 22);
        rect(g, 0, 218, 128, 1, '#f4f5f7');
        rect(g, 0, 222.5, 128, 0.7, 'rgba(0,0,0,0.12)');
        for (let x = 0; x < 128; x += 32) rect(g, x, 218, 0.8, 22, 'rgba(0,0,0,0.22)');
        for (const x of [12, 76]) { box(g, x, 228, 9, 4.4, 0.6, '#f4c531', K, 0.4); for (let k = 0; k < 3; k++) poly(g, [x + 1 + k * 3, 228.2, x + 2.4 + k * 3, 228.2, x + 1.4 + k * 3, 232.2, x + k * 3, 232.2], '#231d33', null); }
        lin(g, 0, 218.2, 128, 218.2, K, 0.8);
      } else if (type === 'tram') {
        rect(g, 0, 218, 128, 2.6, '#c9ced8'); rect(g, 0, 218, 128, 0.8, '#f2f4f8'); rect(g, 0, 220.6, 128, 1.2, '#5f6570');
        rect(g, 0, 221.8, 128, 18.2, '#8a8378');
        for (let y = 222.2, r = 0; y < 240; y += 4.2, r++) for (let x = (r % 2) * 3.5; x < 128; x += 7) { g.fillStyle = R() < 0.5 ? '#9d968a' : '#827b70'; A.rr(g, x + 0.3, y, 6.4, 3.6, 1.2); g.fill(); }
      } else {
        // bordür ve kaldırım
        rect(g, 0, 218, 128, 4.4, '#dcd8d0'); rect(g, 0, 218, 128, 0.8, '#f4f2ee'); rect(g, 0, 222.4, 128, 0.8, 'rgba(0,0,0,0.3)');
        for (let x = 0; x < 128; x += 16) rect(g, x, 218, 0.7, 4.4, 'rgba(0,0,0,0.25)');
        rect(g, 0, 223.2, 128, 16.8, type === 'taxi' ? '#b8b0a0' : '#c4bfb6');
        for (let y = 223.6, r = 0; y < 240; y += 5.4, r++) for (let x = (r % 2) * 5; x < 128; x += 10) { g.fillStyle = R() < 0.5 ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)'; A.rr(g, x + 0.4, y, 9.2, 4.8, 1); g.fill(); }
        lin(g, 0, 218.2, 128, 218.2, K, 0.8);
      }
      tint(g, 128, vh, night);
    }, bg());
  }
  // durak yapıları: (x, y) sol üst köşe; platformun üstüne konur
  function canopy(name, ln, col, type, w, night) {
    const tram = type === 'tram';
    const s = sign(name, ln, col, tram);
    const H = tram ? 96 : 104;   // saçaktan perona
    return mk(w, H, (g) => {
      // arka cam pano ve direkler
      g.fillStyle = 'rgba(170,215,240,0.22)'; g.fillRect(10, 40, w - 20, H - 52);
      lin(g, 10, H - 12, w - 10, H - 12, 'rgba(255,255,255,0.45)', 0.6);
      for (const px of [9, w - 9]) { lin(g, px, H, px, 6, K, 3); lin(g, px, H, px, 6, '#9aa3b2', 1.5); rect(g, px - 0.4, 6, 0.8, H - 6, 'rgba(255,255,255,0.35)'); }
      if (tram) {
        // eğri saçak
        g.beginPath(); g.moveTo(0, 8); g.quadraticCurveTo(w / 2, -2, w, 8); g.lineTo(w, 12); g.quadraticCurveTo(w / 2, 2, 0, 12); g.closePath(); A.fs(g, '#e8ecf2', K, 0.8);
        g.strokeStyle = col; g.lineWidth = 1.2; g.beginPath(); g.moveTo(1, 10.6); g.quadraticCurveTo(w / 2, 0.6, w - 1, 10.6); g.stroke();
        // bilet makinesi
        box(g, w - 26, H - 26, 9, 26, 1.4, '#3a4a6a', K, 0.6); box(g, w - 24.5, H - 23, 6, 5, 0.8, '#9ad0f0', null);
      } else {
        box(g, -1, 2, w + 2, 9, 1.6, '#eef0f3', K, 0.8);
        rect(g, 0, 8, w, 1.6, col);
        for (let x = 20; x < w - 16; x += 24) { box(g, x, 11, 12, 2.4, 0.8, '#ffffff', '#8a8f9a', 0.4); }
        // turnike
        for (const px of [w - 36]) { box(g, px, H - 15, 5, 15, 1, '#6a7282', K, 0.6); box(g, px - 1, H - 17, 7, 2.4, 0.8, '#3fae2c', K, 0.5); }
      }
      tint(g, w, H, night);
      g.drawImage(s, w / 2 - s.lw / 2, 16, s.lw, s.lh);
    }, bg());
  }
  function polePlate(name, col, type, night) {
    const s = sign(name, '', col);
    const W2 = Math.max(s.lw, 30);
    return mk(W2, 84, (g) => {
      const px = W2 / 2;
      lin(g, px, 84, px, 18, K, 2.4); lin(g, px, 84, px, 18, '#9aa3b2', 1.1);
      g.drawImage(s, px - s.lw / 2, 0, s.lw, s.lh);
      box(g, px - 11, 20, 22, 15, 2.4, col, K, 0.8);
      if (type === 'taxi') { txt(g, 'TAKSİ', px, 27.6, 5.6, '#231d33'); }
      else vanIcon(g, px, 27.6, '#ffffff');
      // oturak
      if (type !== 'taxi') { box(g, px - 30, 74, 18, 2.6, 0.8, '#8a6a4a', K, 0.5); lin(g, px - 28, 76, px - 28, 84, K, 1); lin(g, px - 14, 76, px - 14, 84, K, 1); }
      if (night) { g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(14,20,58,0.4)'; g.fillRect(0, 18, W2, 66); g.restore(); }
    }, bg());
  }
  function kiosk(col, night) {
    return mk(34, 44, (g) => {
      box(g, 2, 16, 30, 28, 2, grad(g, 0, 16, 0, 44, [[0, '#f4efe2'], [1, '#d8d0bc']]));
      box(g, 6, 22, 12, 10, 1.2, grad(g, 0, 22, 0, 32, [[0, '#8ab0d0'], [1, '#3a5068']]), K, 0.6);
      box(g, 21, 22, 8, 22, 1, '#b08a5a', K, 0.6);
      box(g, 0, 13, 34, 4, 1.2, '#4a4f5a');
      box(g, 5, 2, 24, 11, 2, grad(g, 0, 2, 0, 13, [[0, '#fff7c8'], [1, col]]), K, 0.7);
      txt(g, 'TAKSİ', 17, 7.6, 5.6, '#231d33');
      if (night) { g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(14,20,58,0.4)'; g.fillRect(0, 13, 34, 31); g.restore(); rect(g, 6.5, 22.5, 11, 9, 'rgba(255,220,140,0.75)'); }
    }, bg());
  }
  // sokak hattı parçaları ve odadaki yerleri (x: odanın solundan px, y: ekran)
  function streetLine(rd, vh) {
    const k = 'st:' + rd.type + rd.a + rd.b + vh;
    let P = lineCache.get(k);
    if (P) return P;
    const R = { metrobus: 9, tram: 9, minibus: 10, taxi: 11 }[rd.type], top = TOPY + R * 16;
    const decor = [], nt = !!rd.night;
    if (rd.type === 'metrobus' || rd.type === 'tram') {
      const ca = canopy(rd.a, rd.line, rd.col, rd.type, 152, nt), cb = canopy(rd.b, rd.line, rd.col, rd.type, 92, nt);
      decor.push({ c: ca, x: 4, y: top - ca.lh }, { c: cb, x: 1266, y: top - cb.lh });
    } else {
      const pa = polePlate(rd.a, rd.col, rd.type, nt), pb = polePlate(rd.b, rd.col, rd.type, nt);
      decor.push({ c: pa, x: 150 - pa.lw / 2, y: top - pa.lh }, { c: pb, x: 1272 - pb.lw / 2 + 4, y: top - pb.lh });
      if (rd.type === 'taxi') { const kk = kiosk(rd.col, nt); decor.push({ c: kk, x: 0, y: top - kk.lh }); }
    }
    P = { road: roadStrip(rd.type, vh, nt), front: frontStrip(rd.type, vh, nt), decor };
    lineCache.set(k, P);
    return P;
  }

  // ---------------- özel sokak sahnesi: Divanyolu (Beyazıt → Çemberlitaş) ----------------
  // tramvayın geçtiği tarihi cadde: arkada Ayasofya, Beyazıt Kulesi ve Sultanahmet; önde taş binalar,
  // Çemberlitaş sütunu, kubbeli türbe ve küçük bir cami
  const sceneCache = A.cache();
  function scene(name, vw, vh) {
    const k = name + ':' + vw;
    let L = sceneCache.get(k);
    if (L) return L;
    const kit = SC.kit;
    L = {
      sky: mk(vw, vh, (g) => kit.drawSky(g, { stops: [[0, '#58a8e6'], [0.62, '#b6ddf6'], [1, '#f6ead0']], sun: [200, 56, 12, '#fffbe6'] }, vw, vh, 9), bg()),
      far: mk(512, 240, (g) => { SC.pen(null); divanFar(g, kit); }, bg()),
      near: mk(512, 240, (g) => { SC.pen(null); divanNear(g, kit); }, bg()),
    };
    sceneCache.set(k, L);
    return L;
  }
  function divanFar(g, kit) {
    const pal = { wall: '#c6cedc', wallD: '#b6c0d0', roof: '#a9b4c8', trim: '#ccd3df', win: '#9ea9bf', alem: '#a9b4c8' };
    kit.cloud(g, 60, 52, 1, '#ffffff'); kit.cloud(g, 330, 40, 0.8, '#ffffff');
    // pus içinde damlar
    const R = rngOf(5);
    for (let x = -4; x < 512; x += 10 + R() * 8) { const h = 10 + R() * 14; rect(g, x, 186 - h, 10 + R() * 8, h + 20, R() < 0.5 ? '#cdd4e0' : '#c2cad8'); }
    SC.hagiaSophia(g, 110, 178, 0.95, { ...pal, brick: '#c9c2cf' });
    // Beyazıt Kulesi
    const tx = 262;
    kit.B(g, tx - 5, 92, 10, 90, 0, pal.wall); kit.B(g, tx - 7, 86, 14, 8, 1, pal.trim);
    kit.B(g, tx - 4, 72, 8, 14, 0, pal.wall); for (let k = 0; k < 3; k++) rect(g, tx - 3 + k * 2.4, 75, 1.2, 6, pal.win);
    kit.P(g, [tx - 5, 72, tx + 5, 72, tx, 62], pal.roof);
    SC.blueMosque(g, 400, 182, 0.78, pal);
    rect(g, 0, 182, 512, 58, '#c9d0dc');
  }
  function divanNear(g, kit) {
    const by = 200, R = rngOf(11);
    const stone = { wall: '#ecdcb8', wallD: '#dcc8a0', roof: '#8e9aa8', trim: '#f4e8cc', win: '#4a5a6e', alem: '#c8a040' };
    // taş han: kemerli pencereler, saçak
    const han = (x, w, h, col) => {
      kit.B(g, x, by - h, w, h, 0, col);
      rect(g, x - 2, by - h - 4, w + 4, 4, shade(col, -0.25));
      for (let fy = by - h + 8; fy < by - 18; fy += 22) kit.windowsRow(g, x + 5, x + w - 5, fy, 7, 12, 5, '#5a4a3e');
      for (let ax = x + 4; ax + 12 <= x + w - 4; ax += 16) kit.archWin(g, ax, by - 16, 12, 16, '#3a2e26');
      rect(g, x, by - h + 2, w, 0.8, 'rgba(255,255,255,0.3)');
    };
    han(0, 84, 70, '#e2c690');
    // küçük cami (Firuz Ağa): tek kubbe, tek minare
    kit.minaret(g, 160, by, 96, 4.4, stone, 1);
    kit.B(g, 100, by - 34, 56, 34, 0, stone.wall);
    kit.windowsRow(g, 106, 150, by - 26, 6, 12, 5, stone.win);
    kit.dome(g, 128, by - 34, 20, { ...stone, roof: '#7e8a98', roofL: '#9aa6b4' }, 0.9);
    kit.B(g, 96, by - 8, 64, 8, 0, stone.wallD);
    // Çemberlitaş sütunu: porfir tamburlar, bronz çemberler
    const cx = 214;
    kit.B(g, cx - 13, by - 22, 26, 22, 1, '#b8ae9c'); rect(g, cx - 15, by - 24, 30, 3, '#a8a08e');
    kit.B(g, cx - 7, by - 150, 14, 128, 0, '#8a4a3c');
    const cg = g.createLinearGradient(cx - 7, 0, cx + 7, 0); cg.addColorStop(0, 'rgba(255,220,200,0.35)'); cg.addColorStop(0.5, 'rgba(0,0,0,0)'); cg.addColorStop(1, 'rgba(0,0,0,0.3)');
    g.fillStyle = cg; g.fillRect(cx - 7, by - 150, 14, 128);
    for (let y = by - 140; y < by - 24; y += 15) { rect(g, cx - 8, y, 16, 2.4, '#5a3a24'); rect(g, cx - 8, y, 16, 0.7, '#c8a050'); }
    kit.B(g, cx - 9, by - 156, 18, 7, 1, '#9a8a74'); rect(g, cx - 6, by - 160, 12, 4, '#b8ae9c');
    // türbe: sekizgen beyaz mermer, demir parmaklıklı pencereler
    const tx = 290;
    kit.B(g, tx - 26, by - 36, 52, 36, 0, '#f2eee4');
    for (let k = 0; k < 3; k++) { const wx = tx - 21 + k * 15; kit.archWin(g, wx, by - 30, 12, 22, '#3a4656'); for (let j = 1; j < 4; j++) rect(g, wx + j * 3, by - 26, 0.7, 18, '#c8a040'); }
    rect(g, tx - 28, by - 40, 56, 5, '#e4ded0');
    kit.dome(g, tx, by - 40, 22, { wall: '#f2eee4', roof: '#7e8a98', roofL: '#9aa6b4', alem: '#c8a040' }, 0.8);
    // ahşap ve taş evler, çınarlar
    let x = 330;
    for (const [w, h, col] of [[34, 58, '#d88a6a'], [30, 50, '#f0d080'], [38, 62, '#a8c4d8']]) {
      kit.house(g, x, by, w, h, col, '#8a4a3a', R, { door: true, win: '#4a5a6e' }); x += w + 2;
    }
    han(440, 72, 62, '#e8d2a6');
    kit.tree(g, 92, by, 2.4); kit.tree(g, 248, by, 2.2); kit.tree(g, 506, by, 2.4);
    rect(g, 0, by, 512, 40, '#d4ccba');
  }

  // ---------------- Tünel (füniküler): tarihi istasyon, tuğla tünel, rampa ----------------
  function funiHall(g, w, vh, col) {
    rect(g, 0, 0, w, vh, '#2a1e18');
    rect(g, 0, 48, w, vh - 48, '#e6d8bc');
    const sh = g.createLinearGradient(0, 48, 0, 70); sh.addColorStop(0, 'rgba(40,24,16,0.5)'); sh.addColorStop(1, 'rgba(40,24,16,0)');
    g.fillStyle = sh; g.fillRect(0, 48, w, 22);
    rect(g, 0, 58, w, 4.4, col); rect(g, 0, 62.4, w, 1, shade(col, -0.4));
    for (let x = 0; x < w; x += 64) {
      // kemerli niş: içi tuğla
      g.save();
      g.beginPath(); g.moveTo(x + 14, 200); g.lineTo(x + 14, 96); g.arc(x + 32, 96, 18, Math.PI, 0); g.lineTo(x + 50, 200); g.closePath();
      g.fillStyle = '#7a4a34'; g.fill(); g.clip();
      for (let y = 76, r = 0; y < 200; y += 5, r++) for (let bx = x + 12 + (r % 2) * 4; bx < x + 52; bx += 8) { g.fillStyle = (bx + y) % 3 ? '#8a5640' : '#6e402c'; g.fillRect(bx + 0.4, y + 0.4, 7.2, 4.2); }
      g.restore();
      g.strokeStyle = '#c8b48e'; g.lineWidth = 2.4;
      g.beginPath(); g.moveTo(x + 13, 200); g.lineTo(x + 13, 96); g.arc(x + 32, 96, 19, Math.PI, 0); g.lineTo(x + 51, 200); g.stroke();
      // pirinç aplik
      lin(g, x + 2, 84, x + 2, 92, '#8a6a2a', 1);
      const lg = g.createRadialGradient(x + 2, 82, 1, x + 2, 84, 20); lg.addColorStop(0, 'rgba(255,220,150,0.5)'); lg.addColorStop(1, 'rgba(255,220,150,0)');
      g.fillStyle = lg; g.fillRect(x - 18, 62, 40, 44);
      circle(g, x + 2, 80, 3.4, '#fff0c0', '#8a6a2a', 0.7);
    }
    // ahşap lambri
    rect(g, 0, 200, w, vh - 200, '#6a4630');
    rect(g, 0, 200, w, 1.4, '#9a6a44');
    for (let x = 0; x < w; x += 16) rect(g, x, 202, 0.8, vh - 202, 'rgba(0,0,0,0.25)');
  }
  function funiTunnel(g, w, vh) {
    rect(g, 0, 0, w, vh, '#24160f');
    const R = rngOf(77);
    for (let y = 48, r = 0; y < vh; y += 6, r++) for (let x = (r % 2) * 6 - 6; x < w; x += 12) {
      const d = Math.min(1, (y - 48) / 60);
      g.fillStyle = mixc(R() < 0.5 ? [112, 62, 44] : [96, 52, 36], d);
      g.fillRect(x + 0.5, y + 0.5, 11, 5);
    }
    const top = g.createLinearGradient(0, 48, 0, 90); top.addColorStop(0, 'rgba(10,6,4,0.75)'); top.addColorStop(1, 'rgba(10,6,4,0)');
    g.fillStyle = top; g.fillRect(0, 48, w, 42);
    // kemer kaburgaları ve lamba
    for (let x = 0; x < w; x += 64) { rect(g, x, 48, 5, vh - 48, 'rgba(30,18,12,0.45)'); rect(g, x + 5, 48, 1, vh - 48, 'rgba(200,140,100,0.15)'); }
    const lx = 96, ly = 70;
    const lg = g.createRadialGradient(lx, ly + 6, 1, lx, ly + 10, 38); lg.addColorStop(0, 'rgba(255,214,140,0.45)'); lg.addColorStop(1, 'rgba(255,214,140,0)');
    g.fillStyle = lg; g.fillRect(lx - 40, ly - 24, 80, 80);
    lin(g, lx, 48, lx, ly - 3, '#2a2420', 0.8);
    circle(g, lx, ly, 3.2, '#ffe7a0', '#2a2420', 0.6);
    g.lineCap = 'round';
    for (const [y, c, lw] of [[96, '#140c08', 1.6], [101, '#1a100a', 1.2]]) {
      g.strokeStyle = c; g.lineWidth = lw; g.beginPath();
      for (let x = -32; x < w; x += 64) { g.moveTo(x + 32, y); g.quadraticCurveTo(x + 64, y + 5, x + 96, y); }
      g.stroke();
    }
  }
  function mixc(rgb, d) { const f = 1 - d * 0.35; return `rgb(${Math.round(rgb[0] * f)},${Math.round(rgb[1] * f)},${Math.round(rgb[2] * f)})`; }
  function portal(g, w, vh, flip) {
    if (flip) { g.translate(w, 0); g.scale(-1, 1); }
    const gr = g.createLinearGradient(14, 0, w, 0); gr.addColorStop(0, 'rgba(10,6,4,0.75)'); gr.addColorStop(1, 'rgba(10,6,4,0)');
    g.fillStyle = gr; g.fillRect(14, 48, w - 14, vh - 48);
    box(g, 0, 44, 15, vh - 42, 1.5, grad(g, 0, 0, 15, 0, [[0, '#d8c8a8'], [0.6, '#bca888'], [1, '#9a8668']]), '#3a2a1a', 0.8);
    for (let y = 60; y < vh; y += 16) rect(g, 1.5, y, 12, 1, 'rgba(60,40,20,0.35)');
  }
  function plaque() {
    return mk(40, 16, (g) => {
      box(g, 0.5, 0.5, 39, 15, 3, grad(g, 0, 0, 0, 16, [[0, '#f0d080'], [1, '#b08a3a']]), '#5a4418', 0.8);
      box(g, 2.5, 2.5, 35, 11, 2, null, 'rgba(90,68,24,0.6)', 0.5);
      txt(g, '1875', 20, 8.4, 7.4, '#4a3410');
    }, bg());
  }
  function funiLine(rd, vh) {
    const k = 'fn:' + rd.a + vh;
    let P = lineCache.get(k);
    if (P) return P;
    P = {
      hall: mk(128, vh, (g) => funiHall(g, 128, vh, rd.col), bg()),
      tunnel: mk(128, vh, (g) => funiTunnel(g, 128, vh), bg()),
      portalL: mk(40, vh, (g) => portal(g, 40, vh, false), bg()),
      portalR: mk(40, vh, (g) => portal(g, 40, vh, true), bg()),
      signA: sign(rd.a, rd.line, rd.col), signB: sign(rd.b, rd.line, rd.col), plaque: plaque(),
    };
    lineCache.set(k, P);
    return P;
  }
  // rampa: rayın altı taş dolgu; (xa, ya) → (xb, yb) ray üstü (ekran), önde çizilir
  function funiBed(g, xa, ya, xb, yb, vh, t) {
    const s = (yb - ya) / (xb - xa);
    g.save();
    g.beginPath(); g.moveTo(xa, ya); g.lineTo(xb, yb); g.lineTo(xb, vh); g.lineTo(xa, vh); g.closePath();
    g.fillStyle = grad(g, 0, Math.min(ya, yb), 0, vh, [[0, '#4a3226'], [0.5, '#2c1c14'], [1, '#160e0a']]); g.fill();
    g.clip();
    // taş örgü
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.6;
    const x0 = Math.floor(xa / 14) * 14;
    for (let x = x0; x < xb; x += 14) { const y = ya + s * (x - xa); g.beginPath(); g.moveTo(x, y + 6); g.lineTo(x, vh); g.stroke(); }
    for (let d = 10; d < 120; d += 9) { g.beginPath(); g.moveTo(xa, ya + d); g.lineTo(xb, yb + d); g.stroke(); }
    g.restore();
    // traversler, makaralar ve ray
    for (let x = Math.floor(xa / 10) * 10 + 4; x < xb; x += 10) { const y = ya + s * (x - xa); box(g, x - 3, y + 1.5, 6, 3.4, 0.8, '#5a4a3a', '#20160e', 0.5); }
    for (let x = Math.floor(xa / 48) * 48 + 20; x < xb; x += 48) { const y = ya + s * (x - xa); circle(g, x, y - 0.6, 1.8, '#8a909c', K, 0.5); lin(g, x, y - 0.6, x + Math.cos(t * 6) * 1.4, y - 0.6 + Math.sin(t * 6) * 1.4, '#3a3e48', 0.5); }
    g.strokeStyle = '#c9ced8'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(xa, ya + 0.6); g.lineTo(xb, yb + 0.6); g.stroke();
    g.strokeStyle = '#f2f4f8'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(xa, ya); g.lineTo(xb, yb); g.stroke();
    g.strokeStyle = '#3a3e48'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(xa, ya + 2.2); g.lineTo(xb, yb + 2.2); g.stroke();
    // kablo
    g.strokeStyle = 'rgba(30,30,36,0.9)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(xa, ya - 1.2); g.lineTo(xb, yb - 1.2); g.stroke();
  }

  // odanın karoları: sokakta kaldırım, yer altında peron
  const tiles = (rd) => (rd && (rd.type === 'minibus' || rd.type === 'taxi') ? 16 : A.METRO);

  root.BA_RIDE = { HT, ROAD, under, drawVehicle, drawGate, drawExit, streetLine, funiLine, funiBed, tiles, sign, scene };
  void SC;
})(window);
