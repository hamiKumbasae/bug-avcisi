// Bug Avcısı: İstanbul — bölüm mekânları. Her bölüm ayrı bir yerde geçer (levels.js'teki 'yer' anahtarı);
// beş dünyanın ilk çizimi scenes.js'te, yeni dünyaların ışık değişiklikleri ve yeni çizimler places2.js'te.
// Katmanlar 512 mantıksal piksel genişliğinde, kenarlardan kesintisiz tekrarlanır; zemin çizgisi y=214.
(function (root) {
  'use strict';
  const A = root.BA_ART, SC = root.BA_SCENE;
  const { lin, rng } = A;
  const { pen, mix, ferry, seagull, galataTower, maidensTower, blueMosque, hagiaSophia, simitCart } = SC;
  const { B, C, E, P, rect, archWin, dome, minaret, hillMosque, bridge, camlicaTower, house, hillsY, hills, hillHouses,
    cloud, glassTower, tree, pine, cinar, erguvan, erik, fistikCami, column, medusaHead, homeTower, lonelyWindow, person } = SC.kit;
  const TAU = Math.PI * 2, W = 512, H = 240;
  const DR = SC.DRAW;   // çizim anahtarı → { sky, far, near }; bölümler levels.js'teki 'yer' ile seçer

  // ---------- ortak küçük parçalar ----------
  function grad(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }
  function glowRaw(g, x, y, r, col, a) {
    const gl = g.createRadialGradient(x, y, 0, x, y, r);
    gl.addColorStop(0, col.replace(')', `,${a})`).replace('rgb', 'rgba')); gl.addColorStop(1, col.replace(')', ',0)').replace('rgb', 'rgba'));
    g.fillStyle = gl; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // ışık halesi; başka saatte (SC.relit) karartmadan sonra yeniden yakılsın diye kaydedilir
  function glow(g, x, y, r, col, a) { glowRaw(g, x, y, r, col, a); SC.emit(g, (q) => glowRaw(q, x, y, r, col, a)); }
  function skyGrad(g, vw, vh, stops) { g.fillStyle = grad(g, 0, 0, 0, vh, stops); g.fillRect(0, 0, vw, vh); }
  function stars(g, vw, vh, n, seed, maxY) {
    const r = rng(seed);
    for (let i = 0; i < n; i++) { g.fillStyle = `rgba(255,255,240,${0.3 + r() * 0.7})`; g.beginPath(); g.arc(r() * vw, r() * vh * (maxY || 0.6), 0.35 + r() * 0.5, 0, TAU); g.fill(); }
  }
  function bulbs(g, x0, x1, y, sag, col) {
    // iki nokta arasında sarkan ampul dizisi
    g.strokeStyle = 'rgba(40,30,30,0.7)'; g.lineWidth = 0.5;
    g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo((x0 + x1) / 2, y + sag * 2, x1, y); g.stroke();
    for (let t = 0.08; t < 1; t += 0.12) {
      const x = x0 + (x1 - x0) * t, yy = y + sag * 4 * t * (1 - t);
      glow(g, x, yy + 1.5, 5, 'rgb(255,220,140)', 0.35);
      g.fillStyle = col || '#ffe39a'; g.beginPath(); g.arc(x, yy + 1.5, 1.1, 0, TAU); g.fill();
    }
  }
  function lamp(g, x, by, h, col) {
    lin(g, x, by, x, by - h, '#2a2636', 1.2);
    B(g, x - 2.6, by - h - 5, 5.2, 5, 1, '#2a2636');
    glow(g, x, by - h - 2, 14, 'rgb(255,214,140)', 0.45);
    C(g, x, by - h - 2.4, 1.8, col || '#ffe6a0');
  }
  function rain(g, w, h, n, seed, a) {
    const r = rng(seed);
    g.strokeStyle = `rgba(200,220,255,${a})`; g.lineWidth = 0.6;
    g.beginPath();
    for (let i = 0; i < n; i++) { const x = r() * (w + 40), y = r() * h, l = 6 + r() * 8; g.moveTo(x, y); g.lineTo(x - l * 0.35, y + l); }
    g.stroke();
  }

  // ================= 1 MASLAK =================
  // 1-2 Toplantı Katı: gökdelenin içi; boydan boya cam duvarın ardında Maslak, önde toplantı odası, beyaz tahta, masalar
  DR.toplanti = {
    sky: {
      draw(g, vw, vh) {
        skyGrad(g, vw, vh, [[0, '#9fd2f2'], [0.7, '#d8eefa'], [1, '#eef8ff']]);
        const r = rng(101);
        for (let x = -10; x < vw; x += 14 + r() * 16) {
          const w = 10 + r() * 16, h = 40 + r() * 80;
          g.fillStyle = r() < 0.5 ? '#bcd8ea' : '#b0d0e6'; g.fillRect(x, 196 - h, w, h + 20);
          g.fillStyle = 'rgba(255,255,255,0.35)'; for (let y = 200 - h; y < 196; y += 5) g.fillRect(x + 1, y, w - 2, 0.6);
        }
        g.fillStyle = '#a8c8de'; g.fillRect(0, 186, vw, 20);
      },
    },
    far(g) {
      // cam cephe: tavan, döşeme seviyesindeki duvar, dikmeler ve yansımalar
      g.fillStyle = 'rgba(160,205,235,0.14)'; g.fillRect(0, 50, W, 150);
      g.fillStyle = 'rgba(255,255,255,0.18)';
      for (let x = 0; x < W; x += 128) { P(g, [x + 10, 196, x + 40, 196, x + 96, 52, x + 66, 52], 'rgba(255,255,255,0.16)'); }
      rect(g, 0, 0, W, 50, '#e8ebf0'); rect(g, 0, 46, W, 4, '#c6cbd4');
      for (let x = 14; x < W; x += 64) { B(g, x, 38, 36, 4, 1.5, '#ffffff'); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x - 4, 42, 44, 10); }
      for (let x = 0; x < W; x += 64) rect(g, x - 2, 50, 4, 150, '#5a6474');
      rect(g, 0, 120, W, 3, '#5a6474');
      rect(g, 0, 196, W, 44, '#d6dae1'); rect(g, 0, 196, W, 2, '#9aa2ae');
    },
    near(g) {
      pen('rgba(40,50,70,0.65)', 0.5);
      // cam toplantı odası
      B(g, 16, 112, 140, 102, 1, 'rgba(210,235,250,0.35)');
      rect(g, 16, 112, 140, 3, '#7a8494'); rect(g, 16, 112, 3, 102, '#7a8494'); rect(g, 153, 112, 3, 102, '#7a8494'); rect(g, 84, 112, 2, 102, '#7a8494');
      g.fillStyle = 'rgba(255,255,255,0.4)'; P(g, [30, 210, 40, 210, 70, 116, 60, 116], 'rgba(255,255,255,0.3)');
      E(g, 86, 186, 34, 5, '#f2f2ee'); rect(g, 84, 186, 4, 28, '#8a909c');
      for (const cx of [54, 72, 100, 118]) { B(g, cx - 5, 182, 10, 12, 3, '#3d7be0'); rect(g, cx - 1, 194, 2, 18, '#5a6070'); }
      // beyaz tahta: yapışkan notlar ve kutulu şema, köşede bir bug karalaması
      B(g, 176, 120, 92, 60, 2, '#fbfbf8'); rect(g, 176, 178, 92, 3, '#9aa2ae');
      lin(g, 196, 181, 192, 214, '#7a8494', 1.4); lin(g, 248, 181, 252, 214, '#7a8494', 1.4);
      const notes = ['#ffe36a', '#ff9ac0', '#9ae0ff', '#b6f08a'];
      for (let i = 0; i < 9; i++) B(g, 182 + (i % 3) * 11, 126 + Math.floor(i / 3) * 12, 9, 9, 0.6, notes[(i * 7) % 4]);
      g.strokeStyle = '#3a5ad8'; g.lineWidth = 0.8;
      g.strokeRect(222, 130, 16, 9); g.strokeRect(246, 130, 16, 9); g.strokeRect(234, 152, 16, 9);
      g.beginPath(); g.moveTo(238, 134.5); g.lineTo(246, 134.5); g.moveTo(230, 139); g.lineTo(240, 152); g.stroke();
      g.strokeStyle = '#d2302a'; g.beginPath(); g.ellipse(256, 168, 5, 3.4, 0, 0, TAU); g.moveTo(251, 166); g.lineTo(248, 163); g.moveTo(261, 166); g.lineTo(264, 163); g.stroke();
      // masalar, ekranlarda kod
      for (let k = 0; k < 3; k++) {
        const x = 292 + k * 44;
        rect(g, x, 186, 40, 4, '#e4e6ea'); rect(g, x + 2, 190, 3, 24, '#9aa2ae'); rect(g, x + 35, 190, 3, 24, '#9aa2ae');
        B(g, x + 10, 164, 22, 15, 1, '#1e2430'); rect(g, x + 19, 179, 4, 7, '#5a6070');
        g.fillStyle = '#7cff6a'; for (let l = 0; l < 4; l++) g.fillRect(x + 13 + (l % 2) * 3, 167 + l * 2.8, 6 + ((l * 5 + k) % 7), 1);
        B(g, x + 6, 182, 16, 3, 0.8, '#c8ccd4');
        B(g, x + 30, 179, 5, 6, 1, ['#d2302a', '#ffffff', '#f4c531'][k]);
        B(g, -18 + x + 30, 190, 14, 18, 4, '#3a4252'); rect(g, x + 17, 208, 2, 6, '#2a2e38');
      }
      // ficus ve su sebili
      B(g, 448, 196, 18, 18, 2, '#c87a4a');
      for (const [dx, dy, r] of [[0, -26, 12], [-9, -14, 9], [9, -16, 9], [0, -40, 8]]) C(g, 457 + dx, 196 + dy, r, '#3f9a4a');
      lin(g, 457, 196, 457, 170, '#6a4a2a', 1.4);
      B(g, 484, 168, 16, 46, 2, '#e8ebf0'); B(g, 486, 140, 12, 28, 5, 'rgba(140,200,255,0.75)');
    },
  };

  // 1-3 Sunucu Katı: karanlık sunucu odası; sıra sıra kabinler, yanıp sönen ışıklar, kablo kanalları
  DR.sunucu = {
    sky: { draw(g, vw, vh) { skyGrad(g, vw, vh, [[0, '#04070d'], [0.6, '#0b1220'], [1, '#121c30']]); } },
    far(g) {
      const r = rng(202);
      for (let x = 4; x < W; x += 40) {
        B(g, x, 64, 32, 152, 1, '#111827'); rect(g, x + 1, 64, 30, 2, '#2a3448');
        for (let y = 70; y < 210; y += 5) {
          rect(g, x + 3, y, 26, 3.6, '#0b111c');
          if (r() < 0.7) { g.fillStyle = ['#3aff7a', '#3ab0ff', '#ffb43a', '#3aff7a'][Math.floor(r() * 4)]; g.globalAlpha = 0.4 + r() * 0.6; g.fillRect(x + 24 + r() * 3, y + 1.2, 1, 1); g.globalAlpha = 1; }
        }
      }
      // tavan: kablo kanalı ve soğuk ışık
      rect(g, 0, 40, W, 7, '#252e40'); rect(g, 0, 40, W, 1.4, '#3a465e');
      for (let x = 0; x < W; x += 32) { g.strokeStyle = ['#d8a828', '#3a6ad8', '#d84a3a'][(x / 32) % 3]; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, 47); g.quadraticCurveTo(x + 16, 60, x + 32, 47); g.stroke(); }
      for (let x = 64; x < W; x += 128) { glow(g, x, 50, 70, 'rgb(90,150,255)', 0.18); B(g, x - 20, 47, 40, 3, 1, '#cfe4ff'); }
    },
    near(g) {
      pen('rgba(0,0,0,0.7)', 0.6);
      const r = rng(203);
      for (const x of [20, 196, 372]) {
        B(g, x, 36, 64, 180, 2, '#161d2c'); rect(g, x + 2, 36, 60, 3, '#2e3a52');
        for (let y = 46; y < 206; y += 12) {
          B(g, x + 5, y, 54, 9, 1, '#0c121c');
          for (let k = 0; k < 8; k++) rect(g, x + 8 + k * 4.4, y + 3, 2.6, 2.6, '#202a3c');
          const c = ['#3aff7a', '#3ab0ff', '#ffb43a'][Math.floor(r() * 3)];
          glow(g, x + 54, y + 4.5, 4, c === '#3aff7a' ? 'rgb(58,255,122)' : c === '#3ab0ff' ? 'rgb(58,176,255)' : 'rgb(255,180,58)', 0.6);
          C(g, x + 54, y + 4.5, 1, c);
        }
        // kablo demetleri
        for (let k = 0; k < 4; k++) { g.strokeStyle = ['#d8a828', '#3a6ad8', '#e2e2e2', '#d84a3a'][k]; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x + 62, 60 + k * 3); g.bezierCurveTo(x + 90, 90 + k * 10, x + 70, 150, x + 96, 214); g.stroke(); }
      }
      // uyarı: kırmızı alarm lambası ve ekranda bug
      glow(g, 120, 40, 30, 'rgb(255,60,60)', 0.45); C(g, 120, 40, 3.4, '#ff4a4a');
      B(g, 280, 150, 46, 32, 2, '#1e2430'); B(g, 283, 153, 40, 24, 1, '#3a0e14');
      g.strokeStyle = '#ff6a6a'; g.lineWidth = 1; g.beginPath(); g.ellipse(303, 166, 7, 5, 0, 0, TAU); g.moveTo(297, 162); g.lineTo(293, 158); g.moveTo(309, 162); g.lineTo(313, 158); g.moveTo(296, 168); g.lineTo(292, 170); g.moveTo(310, 168); g.lineTo(314, 170); g.stroke();
      rect(g, 301, 182, 4, 22, '#4a5262'); B(g, 288, 204, 30, 4, 1, '#4a5262');
      for (const wx of [292, 314]) C(g, wx, 210, 3, '#2a2e38');
      for (let x = 0; x < W; x += 12) { g.fillStyle = (x / 12) % 2 ? '#f4c531' : '#1a1a1a'; P(g, [x, 214, x + 6, 214, x + 12, 209, x + 6, 209], g.fillStyle); }
    },
  };

  // ================= 4 ÜSKÜDAR (kaynak çizimler; places2.js'te gün batımı hâlleri) =================
  // Balık Pazarı (4-2 Çarşı'nın kaynağı): çarşı sokağı; tentelerin altında balık, turşu ve zeytin tezgâhları, sokağın üstünde ampuller
  DR.balikPazari = {
    sky: { stops: [[0, '#7cc0ec'], [0.6, '#cfe8f6'], [1, '#fde8c8']] },
    far(g) {
      const r = rng(211);
      const cols = ['#e8c8a0', '#d89a84', '#c8d8c0', '#f0e0b0', '#c4b4d8', '#e8a890'];
      let x = -6;
      while (x < W) {
        const w = 58 + r() * 34, h = 120 + r() * 50, col = cols[Math.floor(r() * cols.length)];
        B(g, x, 214 - h, w, h, 0, col);
        rect(g, x - 2, 214 - h - 4, w + 4, 5, mix(col, '#4a2a1a', 0.35));
        for (let fy = 214 - h + 14; fy < 160; fy += 24) {
          for (let wx = x + 7; wx < x + w - 10; wx += 15) { B(g, wx, fy, 8, 12, 1, '#4a5a72'); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(wx + 1, fy + 1, 2, 10); }
          if (r() < 0.6) { rect(g, x + 4, fy + 13, w - 8, 1.4, '#3a3440'); for (let bx = x + 6; bx < x + w - 6; bx += 3) rect(g, bx, fy + 14, 0.5, 5, '#3a3440'); }
          if (r() < 0.35) { lin(g, x + 6, fy + 2, x + w - 6, fy + 2, '#5a5060', 0.4); for (let k = 0; k < 4; k++) B(g, x + 10 + k * 10, fy + 2, 6, 7, 0.5, ['#ff7a7a', '#ffffff', '#7ab0ff', '#f4d04a'][k]); }
        }
        x += w + 2;
      }
      for (let x0 = 0; x0 < W; x0 += 128) bulbs(g, x0, x0 + 128, 74, 8);
    },
    near(g) {
      pen('rgba(50,30,30,0.6)', 0.5);
      const kinds = ['balik', 'tursu', 'balik', 'zeytin'];
      const awn = [['#d2302a', '#ffffff'], ['#2f6fb0', '#ffffff'], ['#2a8a5a', '#ffffff'], ['#f4a020', '#ffffff']];
      for (let i = 0; i < 4; i++) {
        const x = 8 + i * 128, k = kinds[i], [a1, a2] = awn[i];
        lin(g, x + 4, 214, x + 4, 130, '#5a4a3a', 1.4); lin(g, x + 100, 214, x + 100, 130, '#5a4a3a', 1.4);
        // çizgili, dalgalı kenarlı tente
        for (let s = 0; s < 8; s++) P(g, [x - 2 + s * 13.5, 120, x + 11.5 + s * 13.5, 120, x + 11.5 + s * 13.5, 136, x - 2 + s * 13.5, 136], s % 2 ? a2 : a1);
        for (let s = 0; s < 8; s++) { g.fillStyle = s % 2 ? a2 : a1; g.beginPath(); g.arc(x + 4.75 + s * 13.5, 136, 6.75, 0, Math.PI); g.fill(); }
        lin(g, x + 30, 142, x + 30, 150, '#3a3440', 0.4); C(g, x + 30, 152, 2.4, '#fff2b0'); glow(g, x + 30, 152, 12, 'rgb(255,230,150)', 0.4);
        lin(g, x + 74, 142, x + 74, 150, '#3a3440', 0.4); C(g, x + 74, 152, 2.4, '#fff2b0'); glow(g, x + 74, 152, 12, 'rgb(255,230,150)', 0.4);
        B(g, x + 2, 178, 100, 36, 1, '#8a5a32'); rect(g, x + 2, 178, 100, 3, '#6a4020');
        if (k === 'balik') {
          B(g, x + 4, 168, 96, 11, 3, '#e8f4ff');
          const r = rng(220 + i);
          for (let f = 0; f < 9; f++) {
            const fx = x + 12 + f * 10, fy = 171 + (f % 2) * 3, col = f % 3 === 0 ? '#ff8a8a' : '#c8d4e2';
            E(g, fx, fy, 5, 2, col, (r() - 0.5) * 0.4); P(g, [fx + 4.4, fy, fx + 7.4, fy - 2, fx + 7.4, fy + 2], col);
            g.fillStyle = '#1a1a2a'; g.fillRect(fx - 3.4, fy - 0.6, 0.8, 0.8);
          }
          for (let l = 0; l < 3; l++) { C(g, x + 20 + l * 30, 166, 2.4, '#f4e04a'); }
          B(g, x + 40, 158, 14, 8, 1, '#ffffff'); g.fillStyle = '#2a2a2a'; g.font = '600 5px Fredoka, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('₺', x + 47, 162);
        } else if (k === 'tursu') {
          const jc = ['#e8c040', '#c8302a', '#7ab040', '#f08a3a', '#a83a7a'];
          for (let j = 0; j < 5; j++) { const jx = x + 10 + j * 18; B(g, jx, 152, 14, 26, 3, jc[j]); B(g, jx + 1, 148, 12, 5, 1, '#c8ccd4'); g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(jx + 2.4, 156, 2, 18); }
        } else {
          for (let j = 0; j < 4; j++) { const jx = x + 16 + j * 22; E(g, jx, 176, 10, 3, '#a87a4a'); E(g, jx, 172, 9, 5, ['#2a2a22', '#5a7a2a', '#3a3a2a', '#7a8a3a'][j]); for (let o = 0; o < 6; o++) C(g, jx - 6 + o * 2.4, 170 + (o % 2), 1, 'rgba(255,255,255,0.3)'); }
        }
      }
      for (let c = 0; c < 3; c++) B(g, 240 + c * 2, 196 - c * 12, 18, 12, 1, '#b88a52');
    },
  };

  // Moda Yokuşu (4-3 Sahil'in kaynağı): gün batımında Moda; karşıda tarihi yarımada, iskele, ahşap evler, çınarlar
  DR.moda = {
    sky: { stops: [[0, '#2c2a6a'], [0.4, '#7a4a8a'], [0.72, '#e8806a'], [1, '#ffc48a']], sun: [196, 170, 14, '#ffd8a0'], stars: 18 },
    far(g) {
      g.fillStyle = grad(g, 0, 172, 0, 240, [[0, '#6a4a8a'], [1, '#3a3070']]); g.fillRect(0, 172, W, 68);
      g.fillStyle = 'rgba(255,190,130,0.55)';
      for (let k = 0; k < 9; k++) { const y = 176 + k * 5, w = 30 - k * 2.4; g.fillRect(180 - w / 2 + (k % 2) * 6, y, w, 1); }
      const hz = { wall: '#5a3e7a', wallD: '#523872', roof: '#4e3470', trim: '#634684' };
      const base = hillsY(174, 6, 251); hills(g, (x) => Math.min(176, base(x)), '#4a3470');
      hagiaSophia(g, 96, 174, 0.62, hz); blueMosque(g, 160, 174, 0.62, hz); hillMosque(g, 300, 172, 0.5, hz);
      for (let x = 40; x < 72; x += 5) { g.fillStyle = '#4a3470'; g.beginPath(); g.ellipse(x, 168, 1.8, 6, 0, 0, TAU); g.fill(); }
      // Moda iskelesi ve ışıklı vapur
      rect(g, 380, 196, 70, 3, '#2a2040'); for (let x = 382; x < 450; x += 9) rect(g, x, 199, 1.4, 10, '#2a2040');
      B(g, 396, 184, 30, 12, 1, '#3a2c52'); P(g, [394, 184, 428, 184, 411, 176], '#2e2446');
      for (let x = 398; x < 426; x += 6) { glow(g, x + 1, 190, 5, 'rgb(255,214,140)', 0.4); rect(g, x, 188, 2, 3, '#ffd88a'); }
      ferry(g, 280, 204, 0.55, { hull: '#2a2244', white: '#cfc4e0', win: '#ffd88a', funnel: '#e8c070' });
      seagull(g, 230, 120, 0.9, '#f6e4ff'); seagull(g, 250, 130, 0.6, '#f6e4ff');
    },
    near(g) {
      pen('rgba(30,20,40,0.6)', 0.5);
      const r = rng(252);
      const cols = ['#c88a7a', '#e8b080', '#9aa8c8', '#c8a0b8', '#d8c09a', '#a8b890'];
      // yokuş: soldan sağa yükselen sokak, evler basamak basamak dizilir
      const hy = (x) => 214 - Math.max(0, Math.min(1, (x - 250) / 230)) * 70;
      g.beginPath(); g.moveTo(240, 240); for (let x = 240; x <= W; x += 4) g.lineTo(x, hy(x)); g.lineTo(W, 240); g.closePath(); g.fillStyle = '#4a3a5a'; g.fill();
      g.strokeStyle = '#6a5a7a'; g.lineWidth = 1; g.beginPath(); for (let x = 250; x <= W; x += 4) g.lineTo(x, hy(x)); g.stroke();
      let x = 262;
      while (x < 490) {
        const w = 20 + r() * 8, h = 40 + r() * 22;
        house(g, x, hy(x + w) + 2, w, h, cols[Math.floor(r() * cols.length)], '#6a3a3a', r, { door: true, lit: '#ffd88a', litP: 0.55, win: '#3a3456' });
        x += w + 2;
      }
      // sahilin çınarları (gün batımında koyulaşmış yapraklar, alacalı gövde) ve aralarında bir erguvan
      for (const tx of [30, 236]) cinar(g, tx, 214, 1.85, { leaf: ['#34403e', '#42524a', '#566a58'], bark: '#8a7e6a', spots: ['#c8bca4', '#6e6a52', '#a8a08a'], glow: 'rgba(255,170,120,0.28)' });
      erguvan(g, 132, 214, 0.95, { flower: ['#8a2a64', '#a8407e', '#c45e98', '#e08ab8'] });
      // sahil: korkuluk, çay bahçesi ampulleri, fenerler
      for (let x = 60; x < 214; x += 10) rect(g, x, 200, 1.4, 14, '#2a2440');
      rect(g, 60, 199, 154, 2, '#2a2440');
      bulbs(g, 64, 210, 160, 6, '#ffe6a0');
      for (const lx of [62, 212]) lamp(g, lx, 214, 34);
      B(g, 120, 202, 30, 3, 1, '#7a5a3a'); rect(g, 122, 205, 2, 9, '#4a3a2a'); rect(g, 146, 205, 2, 9, '#4a3a2a'); B(g, 120, 192, 30, 3, 1, '#7a5a3a');
    },
  };

  // İskele (4-1'in kaynağı): sabah; saat kuleli iskele binası, yanaşmış vapur, karşıda puslu tarihi yarımada
  DR.iskele = {
    sky: { stops: [[0, '#9ab8e8'], [0.45, '#f4b8a8'], [0.8, '#fcd8b0'], [1, '#fff0d8']], sun: [80, 148, 14, '#fff6d8'] },
    far(g) {
      const hz = { wall: '#c8a2b4', wallD: '#be98aa', roof: '#b490a4', trim: '#d0aabc' };
      const base = hillsY(200, 16, 261);
      hills(g, base, '#d0aec0');
      hillHouses(g, base, ['#dcbccc', '#d4b2c2', '#e2c4d2'], null, 262);
      hillMosque(g, 120, base(120) + 4, 1, hz); blueMosque(g, 250, 204, 0.8, hz);
      galataTower(g, 420, base(420) + 3, 0.8, { wall: '#d4b0c0', wallD: '#c8a4b4', roof: '#b490a4', trim: '#c8a4b4' });
      g.fillStyle = 'rgba(255,240,230,0.35)'; g.fillRect(0, 170, W, 40);
      seagull(g, 300, 80, 1, '#ffffff'); seagull(g, 324, 92, 0.7, '#ffffff'); seagull(g, 160, 60, 0.8, '#ffffff');
    },
    near(g) {
      pen('rgba(50,40,40,0.6)', 0.5);
      // iskele binası: uzun salon, kurşun çatılar, ortada saat kulesi
      const x = 30, wB = 220;
      B(g, x, 150, wB, 64, 0, '#efe4cc'); rect(g, x, 150, wB, 4, '#d8c8a8');
      for (let k = 0; k < 4; k++) P(g, [x + k * 55, 150, x + 55 + k * 55, 150, x + 27.5 + k * 55, 132], '#8a96a8');
      for (let k = 0; k < 4; k++) P(g, [x + 17 + k * 55, 150, x + 38 + k * 55, 150, x + 27.5 + k * 55, 140], '#f4ead6');
      for (let k = 0; k < 10; k++) archWin(g, x + 8 + k * 21.4, 164, 10, 24, '#5a7a9a');
      B(g, x + 98, 92, 24, 58, 0, '#f4ead6'); P(g, [x + 96, 92, x + 124, 92, x + 110, 70], '#8a96a8');
      C(g, x + 110, 106, 7, '#ffffff'); lin(g, x + 110, 106, x + 110, 101, '#2a2a2a', 0.8); lin(g, x + 110, 106, x + 114, 107, '#2a2a2a', 0.8);
      B(g, x + 60, 196, 100, 18, 0, '#d8c8a8');
      for (let k = 0; k < 5; k++) B(g, x + 66 + k * 19, 198, 10, 16, 4, '#3a4a5a');
      B(g, x + 80, 140, 60, 9, 2, '#2a5a8a'); g.fillStyle = '#ffffff'; g.font = '600 6px Fredoka, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('İSKELE', x + 110, 144.6);
      // yanaşmış vapur, babalar ve halatlar
      ferry(g, 370, 216, 1.7, {});
      for (const bx of [270, 300, 460]) { B(g, bx - 3, 206, 6, 8, 2, '#3a3a44'); }
      g.strokeStyle = '#c8b08a'; g.lineWidth = 1; g.beginPath(); g.moveTo(300, 207); g.quadraticCurveTo(310, 214, 322, 200); g.stroke();
      simitCart(g, 470, 214, 0.9);
      for (const px of [262, 494]) { rect(g, px - 1.5, 186, 3, 28, '#5a4a3a'); seagull(g, px, 184, 0.7, '#ffffff', 0.4); }
    },
  };

  // Kaptan Köşkü (9-3 Fener'in fırtınalı gökyüzü): fırtınalı gece; köpüklü dalgalar, uzakta deniz feneri, yağmur, sallanan fener
  DR.kaptan = {
    sky: {
      draw(g, vw, vh) {
        skyGrad(g, vw, vh, [[0, '#070b16'], [0.6, '#16203a'], [1, '#26344c']]);
        const r = rng(281);
        for (let i = 0; i < 22; i++) { const x = r() * vw, y = 20 + r() * 110; g.fillStyle = r() < 0.5 ? '#1a2236' : '#222c44'; g.beginPath(); g.ellipse(x, y, 30 + r() * 40, 12 + r() * 10, 0, 0, TAU); g.fill(); }
        // şimşek
        const lx = vw * 0.72;
        g.save(); g.shadowColor = '#bcd8ff'; g.shadowBlur = 10 * A.S; g.strokeStyle = '#eaf4ff'; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(lx, 30); g.lineTo(lx - 8, 62); g.lineTo(lx + 2, 66); g.lineTo(lx - 10, 110); g.stroke(); g.restore();
        rain(g, vw, vh, 160, 282, 0.18);
      },
    },
    far(g) {
      // uzakta tanker ve deniz feneri
      B(g, 90, 170, 80, 10, 2, '#0e1424'); B(g, 148, 158, 20, 12, 1, '#0e1424');
      for (const lx of [98, 110, 122, 134]) rect(g, lx, 174, 2, 1, '#ffd88a');
      for (const lx of [151, 156, 161]) rect(g, lx, 161, 2.4, 1.2, '#ffd88a');
      P(g, [380, 186, 392, 186, 389, 140, 383, 140], '#d8dce4'); rect(g, 383, 152, 6, 6, '#c8302a');
      B(g, 380, 134, 12, 7, 1, '#2a2e3a');
      g.fillStyle = 'rgba(255,240,170,0.18)'; P(g, [386, 137, 250, 110, 250, 150], 'rgba(255,240,170,0.16)');
      glow(g, 386, 137, 16, 'rgb(255,240,170)', 0.7);
      E(g, 386, 188, 22, 6, '#10182a');
      // dalga sıraları
      for (let row = 0; row < 3; row++) {
        const y0 = 176 + row * 16, col = ['#16263e', '#1a2e4a', '#1e3656'][row], amp = 5 + row * 3;
        g.beginPath(); g.moveTo(0, H);
        for (let x = 0; x <= W; x += 4) g.lineTo(x, y0 - amp * Math.abs(Math.sin((x + row * 37) / (22 + row * 6))));
        g.lineTo(W, H); g.closePath(); g.fillStyle = col; g.fill();
        g.strokeStyle = 'rgba(220,235,255,0.55)'; g.lineWidth = 1; g.beginPath();
        for (let x = 0; x <= W; x += 4) { const y = y0 - amp * Math.abs(Math.sin((x + row * 37) / (22 + row * 6))); if (Math.abs(Math.sin((x + row * 37) / (22 + row * 6))) > 0.92) { g.moveTo(x - 3, y + 1); g.lineTo(x + 3, y); } }
        g.stroke();
      }
    },
    near(g) {
      pen('rgba(0,0,10,0.7)', 0.6);
      // direk ve sallanan fener
      rect(g, 60, 30, 5, 184, '#2a2e3a'); rect(g, 40, 54, 46, 3, '#2a2e3a');
      lin(g, 85, 57, 98, 80, '#1a1e28', 0.6); B(g, 94, 80, 9, 12, 2, '#3a3a40');
      glow(g, 98, 86, 28, 'rgb(255,200,120)', 0.5); C(g, 98, 86, 2.4, '#ffe0a0');
      // can simitleri ve korkuluk
      for (let x = 0; x < W; x += 24) rect(g, x, 176, 2.4, 38, '#c8ccd4');
      rect(g, 0, 176, W, 3, '#c8ccd4'); rect(g, 0, 194, W, 1.6, '#a8acb4');
      for (const lx of [180, 340, 470]) {
        g.lineWidth = 5; g.strokeStyle = '#ffffff'; g.beginPath(); g.arc(lx, 186, 8, 0, TAU); g.stroke();
        g.strokeStyle = '#d2302a'; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(lx, 186, 8, k * Math.PI / 2, k * Math.PI / 2 + 0.6); g.stroke(); }
      }
      // köpük sıçramaları ve önde yağmur
      g.fillStyle = 'rgba(230,240,255,0.7)';
      for (const [sx, sy] of [[130, 206], [260, 204], [420, 208]]) for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(sx + (k - 3) * 4, sy - Math.abs(k - 2.5) * 3, 2.6, 0, TAU); g.fill(); }
      rain(g, W, H, 140, 283, 0.32);
    },
  };

  // ================= 2 KAPALIÇARŞI =================
  // 2-2 Han: eski bir hanın avlusu; iki katlı revaklar (taş ve tuğla sıraları), üst katta demir korkuluk.
  // Kemerlerin altında gümüş ve altın atölyeleri, ocakta eriyen maden, çalışan ustalar; koliler, hamal, çay ocağı.
  const almasik = (g, x, y, w, h) => { rect(g, x, y, w, h, '#b8a48a'); for (let yy = y + 6; yy < y + h; yy += 12) rect(g, x, yy, w, 4, '#a8583a'); };
  DR.han = {
    sky: { stops: [[0, '#6aaee6'], [1, '#cfe8f8']], noMoon: true },
    far(g) {
      // arka cephe: alt ve üst kat revakları
      almasik(g, 0, 36, W, 180);
      for (let x = 0; x < W; x += 64) {
        // üst kat: kemerli pencereler, demir korkuluk
        g.fillStyle = '#3a2a24'; g.beginPath(); g.moveTo(x + 14, 112); g.lineTo(x + 14, 62); g.arc(x + 32, 62, 18, Math.PI, 0); g.lineTo(x + 50, 112); g.closePath(); g.fill();
        g.strokeStyle = '#e8dcc4'; g.lineWidth = 2; g.beginPath(); g.arc(x + 32, 62, 19, Math.PI, 0); g.stroke();
        if ((x / 64) % 3 === 1) { rect(g, x + 18, 74, 28, 38, 'rgba(255,200,120,0.35)'); glow(g, x + 32, 92, 18, 'rgb(255,190,110)', 0.35); }
        // alt kat: geniş kemer (atölye kapıları önde)
        g.fillStyle = '#2a1e1a'; g.beginPath(); g.moveTo(x + 6, 216); g.lineTo(x + 6, 150); g.arc(x + 32, 150, 26, Math.PI, 0); g.lineTo(x + 58, 216); g.closePath(); g.fill();
        g.strokeStyle = '#e8dcc4'; g.lineWidth = 2.4; g.beginPath(); g.arc(x + 32, 150, 27, Math.PI, 0); g.stroke();
      }
      rect(g, 0, 112, W, 5, '#6a5a4a');
      for (let x = 0; x < W; x += 6) rect(g, x, 100, 1, 12, '#3a3436');
      rect(g, 0, 99, W, 1.6, '#3a3436');
      rect(g, 0, 30, W, 8, '#7a6a58');
      g.fillStyle = 'rgba(255,240,210,0.12)'; g.fillRect(0, 36, W, 180);
    },
    near(g) {
      pen('rgba(30,14,6,0.6)', 0.5);
      // atölye: tezgâhta çalışan usta, potada eriyen maden, duvarda aletler
      const atelier = (x, k) => {
        B(g, x, 132, 96, 82, 1, '#4a3a30'); rect(g, x + 6, 140, 84, 74, '#2a1e1a');
        const gl = g.createLinearGradient(0, 140, 0, 214); gl.addColorStop(0, 'rgba(255,170,90,0.08)'); gl.addColorStop(1, 'rgba(255,150,70,0.3)');
        g.fillStyle = gl; g.fillRect(x + 6, 140, 84, 74);
        // pota ocağı
        B(g, x + 12, 180, 22, 34, 2, '#5a4a44'); glow(g, x + 23, 182, 22, 'rgb(255,150,50)', 0.85); E(g, x + 23, 182, 6, 2.6, '#ffd060');
        // tezgâh ve usta (deri önlük)
        B(g, x + 42, 186, 44, 4, 1, '#8a5a34'); lin(g, x + 46, 190, x + 46, 214, '#5a3a24', 1.6); lin(g, x + 82, 190, x + 82, 214, '#5a3a24', 1.6);
        person(g, x + 62, 210, 30, k ? '#6a4a3a' : '#4a5a6a', { skin: '#c89a7a', hair: '#3a2a20' });
        B(g, x + 57, 186, 10, 18, 2, '#7a5030');
        C(g, x + 72, 184, 1.4, '#ffffff'); glow(g, x + 72, 184, 8, 'rgb(150,200,255)', 0.7);   // ince alev (lehim)
        for (let t = 0; t < 4; t++) { lin(g, x + 50 + t * 9, 146, x + 50 + t * 9, 164, '#6a6a72', 0.8); C(g, x + 50 + t * 9, 166, 1.4, '#8a8a92'); }
      };
      atelier(8, 0); atelier(264, 1);
      // kargo kolileri ve hamal
      for (const [x, y, w, h] of [[120, 196, 22, 18], [140, 200, 18, 14], [126, 180, 18, 16], [380, 194, 24, 20]]) { B(g, x, y, w, h, 1, '#c8a070'); rect(g, x, y + h / 2 - 0.6, w, 1.2, '#e8d0a0'); }
      person(g, 176, 214, 32, '#5a5a4a', { skin: '#a87a5a', hair: '#2a2a2a', load: '#c8a070', step: 1 });
      // çay ocağı: küçük tezgâh, ocakta çaydanlık, tepside ince belli bardaklar
      B(g, 416, 176, 64, 38, 1, '#6a4a30'); rect(g, 416, 176, 64, 3, '#8a6a48');
      B(g, 428, 166, 12, 10, 3, '#c8ccd4'); B(g, 431, 158, 7, 8, 2.4, '#d8dce4'); glow(g, 434, 176, 10, 'rgb(120,170,255)', 0.4);
      E(g, 462, 175, 12, 1.6, '#c8ccd4');
      for (const tx of [454, 462, 470]) P(g, [tx - 1.8, 167, tx + 1.8, 167, tx + 1, 173.6, tx - 1, 173.6], 'rgba(200,70,30,0.9)');
      for (const lx of [100, 360]) { lin(g, lx, 0, lx, 112, '#3a2a20', 0.5); glow(g, lx, 120, 20, 'rgb(255,214,150)', 0.45); B(g, lx - 4, 112, 8, 10, 3, '#e8dcc4'); }
    },
  };

  // 2-3 Bedesten: kubbeli taş salon öğle sıcağında; kubbelerden süzülen ışık, yarı boş, kepenklerin çoğu inik, bir bekçi
  DR.bedesten = {
    sky: { draw(g, vw, vh) { skyGrad(g, vw, vh, [[0, '#140e08'], [0.6, '#2c2016'], [1, '#3a2c1e']]); } },
    far(g) {
      rect(g, 0, 0, W, 216, '#3a2e22');
      for (let x = 0; x < W; x += 128) {
        // kemerler ve aralarında küçük kubbeler
        g.fillStyle = '#2a2018'; g.beginPath(); g.moveTo(x + 13, 216); g.lineTo(x + 13, 96); g.arc(x + 64, 96, 51, Math.PI, 0); g.lineTo(x + 115, 216); g.closePath(); g.fill();
        g.strokeStyle = '#5a4a38'; g.lineWidth = 3; g.beginPath(); g.arc(x + 64, 96, 52, Math.PI, 0); g.stroke();
        B(g, x - 13, 40, 26, 176, 1, '#5a4a38');
        for (let y = 50; y < 216; y += 12) rect(g, x - 13, y, 26, 0.8, '#4a3c2c');
        g.fillStyle = '#4a3c2c'; g.beginPath(); g.ellipse(x + 64, 30, 40, 22, 0, Math.PI, 0); g.fill();
        C(g, x + 64, 12, 4, '#ffe2a8');
        g.fillStyle = 'rgba(255,220,160,0.13)'; P(g, [x + 60, 14, x + 68, 14, x + 96, 216, x + 40, 216], 'rgba(255,220,160,0.12)');
      }
      const r = rng(311);
      g.fillStyle = 'rgba(255,230,180,0.5)'; for (let i = 0; i < 60; i++) { const x = r() * W, y = 30 + r() * 180; g.fillRect(x, y, 0.7, 0.7); }
    },
    near(g) {
      pen('rgba(20,10,4,0.65)', 0.5);
      // duvar boyu dükkânlar: çoğunun kepengi inik; açık olan ikisinde seyrek vitrin
      const shut = (x, w, h) => {
        B(g, x - 2, 120, w + 4, 94, 1, '#5a4a38');
        rect(g, x, 130, w, 84, '#8a8478');
        for (let y = 132; y < 130 + h; y += 3) rect(g, x, y, w, 0.8, 'rgba(40,36,30,0.35)');
        if (h < 84) { rect(g, x, 130 + h, w, 84 - h, '#2a2018'); rect(g, x, 130 + h - 2, w, 2, 'rgba(20,16,10,0.6)'); }
      };
      for (const x of [8, 92, 260, 344]) shut(x, 76, 84);
      for (const x of [176, 428]) {
        shut(x, 76, 22);
        B(g, x + 8, 170, 60, 44, 1, '#3a2a1e'); B(g, x + 10, 156, 56, 16, 1, 'rgba(220,235,240,0.35)');
        for (let k = 0; k < 4; k++) { E(g, x + 18 + k * 13, 166, 3.6, 2.4, '#c8ccd4'); }
        glow(g, x + 38, 150, 26, 'rgb(255,226,170)', 0.3);
      }
      // bekçi: kasketli, taburede
      const gx = 300;
      B(g, gx - 7, 202, 14, 3, 1, '#6a4a30'); lin(g, gx - 5, 205, gx - 6, 214, '#4a3020', 1); lin(g, gx + 5, 205, gx + 6, 214, '#4a3020', 1);
      person(g, gx, 206, 30, '#3a4a5a', { skin: '#b88a6a' });
      B(g, gx - 4.6, 176.6, 9.2, 2.6, 1, '#2a3440'); rect(g, gx - 1, 178.6, 6, 1, '#2a3440');
      for (const lx of [150, 410]) { lin(g, lx, 0, lx, 64, '#2a1a10', 0.6); glow(g, lx, 72, 26, 'rgb(255,190,110)', 0.35); B(g, lx - 6, 64, 12, 14, 3, '#a86a2a'); }
    },
  };

  // ================= 6 YEREBATAN =================
  // 6-2 Medusa: yeşil ışıkla aydınlanan sütunlar; tabanlarda dev Medusa başları, ziyaretçi yolu
  DR.medusa = {
    sky: { draw(g, vw, vh) { skyGrad(g, vw, vh, [[0, '#010c0e'], [0.6, '#042024'], [1, '#08302e']]); } },
    far(g) {
      for (let row = 0; row < 2; row++) {
        const sc = row ? 0.75 : 0.55, col = row ? '#1e3c3a' : '#142c2c', step = row ? 44 : 30;
        for (let x = (row ? 10 : 0); x < W; x += step) column(g, x, 214, sc, col, mix(col, '#5ae0c0', 0.25), false);
        for (let x = (row ? 10 : 0); x < W; x += step) { g.strokeStyle = col; g.lineWidth = 3 * sc; g.beginPath(); g.arc(x + step / 2, 214 - 150 * sc, step / 2, Math.PI, 0); g.stroke(); }
      }
      for (let x = 40; x < W; x += 96) glow(g, x, 196, 50, 'rgb(80,230,190)', 0.18);
    },
    near(g) {
      pen('rgba(0,0,0,0.6)', 0.6);
      for (let i = 0; i < 4; i++) {
        const x = 50 + i * 128;
        column(g, x, 214, 1.15, '#3a5450', '#6ac8b0', false);
        g.strokeStyle = '#2a403c'; g.lineWidth = 6; g.beginPath(); g.arc(x + 64, 214 - 172, 64, Math.PI, 0); g.stroke();
      }
      // biri baş aşağı, biri yan yatmış iki dev Medusa başı, yeşil spotla
      glow(g, 50, 190, 44, 'rgb(90,255,190)', 0.45); medusaHead(g, 50, 194, 2.1);
      glow(g, 306, 192, 44, 'rgb(90,255,190)', 0.45);
      g.save(); g.translate(306, 194); g.rotate(Math.PI / 2); medusaHead(g, 0, 0, 2.1); g.restore();
      // ahşap ziyaretçi yolu
      for (let x = 0; x < W; x += 20) { rect(g, x, 196, 2, 18, '#5a4030'); C(g, x + 1, 195, 1.6, '#ffe2a0'); glow(g, x + 1, 195, 7, 'rgb(255,220,150)', 0.35); }
      rect(g, 0, 196, W, 2.4, '#6a4a34');
    },
  };

  // 6-3 Karanlık Su: neredeyse zifiri; sis, birkaç fener, karanlıkta parlayan gözler
  DR.karanlikSu = {
    sky: { draw(g, vw, vh) { skyGrad(g, vw, vh, [[0, '#000203'], [0.7, '#03080a'], [1, '#061014']]); } },
    far(g) {
      for (let x = 0; x < W; x += 36) column(g, x, 214, 0.65, '#0a1416', '#16282a', false);
      for (let k = 0; k < 4; k++) { const y = 120 + k * 24; g.fillStyle = grad(g, 0, y - 8, 0, y + 8, [[0, 'rgba(150,180,190,0)'], [0.5, 'rgba(150,180,190,0.07)'], [1, 'rgba(150,180,190,0)']]); g.fillRect(0, y - 8, W, 16); }
      const r = rng(331);
      for (let i = 0; i < 7; i++) { const x = r() * W, y = 90 + r() * 90; for (const dx of [-2.2, 2.2]) { glow(g, x + dx, y, 3, 'rgb(255,220,80)', 0.6); C(g, x + dx, y, 0.7, '#ffe060'); } }
    },
    near(g) {
      pen('rgba(0,0,0,0.6)', 0.6);
      for (let i = 0; i < 3; i++) {
        const x = 70 + i * 170;
        column(g, x, 214, 1.2, '#141e20', '#283a3c', false);
        // duvar feneri
        rect(g, x + 22, 120, 8, 2, '#3a3020'); B(g, x + 24, 108, 6, 12, 2, '#5a4020');
        glow(g, x + 27, 112, 40, 'rgb(255,160,70)', 0.4); C(g, x + 27, 112, 2, '#ffd080');
        for (let d = 0; d < 3; d++) { lin(g, x - 6 + d * 5, 0, x - 6 + d * 5, 30 + d * 14, 'rgba(120,170,190,0.25)', 0.4); C(g, x - 6 + d * 5, 32 + d * 14, 0.9, 'rgba(160,210,230,0.6)'); }
      }
    },
  };







  // ================= 8 EYÜP (kaynak çizimler; places2.js'te gece yarısı hâlleri) =================
  // Haliç Kıyısı (8-3 Tepe'nin uzak planı): ikindi ışığında Haliç Metro Köprüsü, tepede Süleymaniye; önde eski tersane, vinçler, sandallar
  DR.halicKiyisi = {
    sky: { stops: [[0, '#7ab4e4'], [0.6, '#f0d8b0'], [1, '#ffe8c8']], sun: [380, 140, 13, '#fff0c8'] },
    far(g) {
      const hz = { wall: '#c8aa98', wallD: '#bea090', roof: '#b49888', roofL: '#c4a898', trim: '#d0b4a2', win: '#a08878' };
      const base = hillsY(186, 22, 711);
      hills(g, base, '#c8aca0'); hillHouses(g, base, ['#d8c0b0', '#e2ccbc', '#ccb4a4'], '#b48070', 712);
      hillMosque(g, 110, base(110) + 4, 1.3, hz);
      // eğik askılı metro köprüsü
      rect(g, 150, 176, 330, 5, '#e8e0d8'); rect(g, 150, 181, 330, 2, '#b8b0a8');
      for (const px of [240, 390]) {
        P(g, [px - 4, 196, px + 4, 196, px + 2, 96, px - 2, 96], '#f4f0ea');
        g.strokeStyle = 'rgba(240,236,230,0.85)'; g.lineWidth = 0.5;
        for (let k = 1; k <= 7; k++) { g.beginPath(); g.moveTo(px, 100 + k * 3); g.lineTo(px - k * 11, 176); g.moveTo(px, 100 + k * 3); g.lineTo(px + k * 11, 176); g.stroke(); }
      }
      for (let k = 0; k < 6; k++) rect(g, 170 + k * 52, 182, 3, 14, '#a8a098');
      seagull(g, 300, 70, 1, '#ffffff'); seagull(g, 326, 82, 0.7, '#ffffff');
    },
    near(g) {
      pen('rgba(50,30,20,0.6)', 0.5);
      // eski tersane binaları: tuğla, üçgen çatı, kemerli pencereler
      for (const [x, w] of [[0, 120], [300, 130]]) {
        B(g, x, 150, w, 64, 0, '#a8583a'); P(g, [x - 4, 150, x + w + 4, 150, x + w / 2, 124], '#6a4a3a');
        for (let k = 0; k < Math.floor(w / 22); k++) archWin(g, x + 8 + k * 22, 164, 12, 22, '#3a3440');
        B(g, x + w / 2 - 14, 186, 28, 28, 14, '#2a2430');
        for (let y = 156; y < 214; y += 8) rect(g, x, y, w, 0.6, 'rgba(60,20,10,0.25)');
      }
      // paslı vinçler
      for (const cx of [170, 470]) {
        rect(g, cx - 3, 70, 6, 144, '#c8602a'); for (let y = 80; y < 214; y += 12) lin(g, cx - 3, y, cx + 3, y + 10, '#8a3a1a', 0.8);
        P(g, [cx - 40, 70, cx + 60, 70, cx + 60, 76, cx - 40, 76], '#c8602a'); B(g, cx - 10, 64, 18, 12, 1, '#a84a1a');
        lin(g, cx + 50, 76, cx + 50, 120, '#3a3a40', 0.6); B(g, cx + 46, 120, 8, 5, 1, '#3a3a40');
      }
      // kıyı: sandallar, banklar, fener
      for (const [x, c] of [[214, '#2a8a6a'], [256, '#e8e0d0']]) P(g, [x - 18, 206, x + 18, 206, x + 13, 214, x - 13, 214], c);
      for (const lx of [200, 286]) lamp(g, lx, 214, 36);
    },
  };

  // Eyüp-Balat (8-1 ve 8-2'nin kaynağı): gün batımı; Pierre Loti tepesine teleferik, Fener Rum Lisesi'nin kırmızı tuğlası, renk renk Balat evleri
  DR.eyupBalat = {
    sky: { stops: [[0, '#4a3a8a'], [0.45, '#d8708a'], [0.8, '#f8a870'], [1, '#ffd09a']], sun: [90, 160, 16, '#ffe0a8'] },
    far(g) {
      const base = hillsY(150, 44, 721);
      hills(g, base, '#8a5a7a');
      // servi ağaçları ve teleferik
      for (let x = 300; x < 480; x += 9) { g.fillStyle = '#4a3a5a'; g.beginPath(); g.ellipse(x, base(x) - 6, 2.4, 9, 0, 0, TAU); g.fill(); }
      g.strokeStyle = '#3a2a40'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(200, 200); g.lineTo(470, base(470) - 10); g.stroke();
      for (const t of [0.3, 0.62]) { const x = 200 + 270 * t, y = 200 + (base(470) - 10 - 200) * t; lin(g, x, y, x, y + 4, '#3a2a40', 0.6); B(g, x - 4, y + 4, 8, 6, 1.4, '#e84a4a'); }
      // Fener Rum Lisesi: kırmızı tuğla, kubbeli kule
      const fx = 250, fy = base(250) + 6;
      B(g, fx - 40, fy - 30, 80, 30, 0, '#b8442a'); B(g, fx - 12, fy - 46, 24, 18, 0, '#b8442a');
      g.fillStyle = '#9a3a24'; g.beginPath(); g.ellipse(fx, fy - 46, 12, 9, 0, Math.PI, 0); g.fill();
      for (let k = 0; k < 8; k++) archWin(g, fx - 34 + k * 9, fy - 24, 4, 9, '#5a2a1a');
      for (const tx of [fx - 40, fx + 34]) { B(g, tx, fy - 38, 6, 38, 0, '#a83a22'); P(g, [tx - 1, fy - 38, tx + 7, fy - 38, tx + 3, fy - 44], '#7a2a1a'); }
      // Eyüp Sultan
      const hz = { wall: '#9a6a8a', roof: '#8a5a7a', trim: '#a87898' };
      hillMosque(g, 420, base(420) + 4, 0.9, hz);
    },
    near(g) {
      pen('rgba(40,20,30,0.6)', 0.5);
      const r = rng(722);
      const cols = ['#e2483a', '#f4c531', '#3aa86a', '#3a7ad8', '#a85ad8', '#f08a3a', '#e85a8a', '#2ab0b0'];
      // yokuşa dizilmiş renkli evler
      const hy = (x) => 214 - Math.max(0, Math.min(1, x / 420)) * 22;
      g.beginPath(); g.moveTo(0, 240); for (let x = 0; x <= W; x += 4) g.lineTo(x, Math.min(214, hy(x))); g.lineTo(W, 240); g.closePath(); g.fillStyle = '#7a6460'; g.fill();
      g.strokeStyle = 'rgba(40,20,20,0.35)'; g.lineWidth = 0.5; for (let x = 6; x < W; x += 12) { g.beginPath(); g.moveTo(x, hy(x) + 3); g.lineTo(x, 214); g.stroke(); }
      let x = 0, garden = false;
      const xs = [];
      while (x < W - 10) {
        // altıncı evden sonra alçak duvarlı küçük bir bahçe ve içinde çiçek açmış bir erik
        if (xs.length === 6 && !garden) {
          garden = true;
          const gw = 34, gy = hy(x + gw / 2) + 1;
          erik(g, x + gw / 2, gy, 1.05);
          B(g, x, gy - 9, gw, 9 + 214 - gy, 1, '#b8a48a'); for (let k = 0; k < 4; k++) rect(g, x + 2 + k * 8.6, gy - 9, 0.6, 9, 'rgba(60,40,30,0.35)');
          x += gw + 1;
          continue;
        }
        const w = 22 + r() * 10, h = 36 + r() * 24, by = hy(x + w) + 2;
        house(g, x, by, w, h, cols[Math.floor(r() * cols.length)], '#6a2a2a', r, { door: true, lit: '#ffe39a', litP: 0.35, win: '#2a3456', cumba: '#f4ecdc' });
        xs.push([x, w, by - h]);
        x += w + 1;
      }
      // evler arasında çamaşır ipleri ve pencereden sarkıtılan sepet
      for (let k = 0; k < xs.length - 1; k += 2) {
        const [x0, w0, t0] = xs[k], [x1, , t1] = xs[k + 1], y = Math.max(t0, t1) + 14;
        g.strokeStyle = 'rgba(40,30,30,0.7)'; g.lineWidth = 0.4; g.beginPath(); g.moveTo(x0 + w0 - 2, y); g.quadraticCurveTo(x0 + w0 + 6, y + 6, x1 + 10, y); g.stroke();
        for (let c = 0; c < 3; c++) B(g, x0 + w0 - 2 + c * 5, y + 1.6, 4, 6, 0.5, ['#ffffff', '#ff8a8a', '#8ab8ff'][c]);
      }
      const [sx, sw, st] = xs[3];
      lin(g, sx + sw / 2, st + 14, sx + sw / 2, st + 40, '#c8a878', 0.5);
      g.beginPath(); g.moveTo(sx + sw / 2 - 5, st + 40); g.lineTo(sx + sw / 2 + 5, st + 40); g.lineTo(sx + sw / 2 + 4, st + 47); g.lineTo(sx + sw / 2 - 4, st + 47); g.closePath(); g.fillStyle = '#c8904a'; g.fill();
    },
  };

  // ================= 7 KÖPRÜ =================
  // Halatlar (7-2'nin kaynağı): köprünün taşıyıcı halatlarında, bulut hizasında; aşağıda uzak Boğaz, karşıda öbür kule
  DR.halatlar = {
    sky: { stops: [[0, '#5aa6e2'], [0.55, '#b8dcf4'], [0.85, '#f4dcb8'], [1, '#f8e4c4']], sun: [420, 60, 12, '#fff6dc'] },
    far(g) {
      // çok aşağıda Boğaz ve iki yaka
      g.fillStyle = grad(g, 0, 168, 0, 240, [[0, '#4a86b8'], [1, '#2a5a8a']]); g.fillRect(0, 168, W, 72);
      const L0 = hillsY(176, 14, 361), R0 = hillsY(178, 12, 362);
      const L = (x) => x < 170 ? L0(x) : Math.min(260, L0(x) + (x - 170) * 1.6), R = (x) => x > 340 ? R0(x) : Math.min(260, R0(x) + (340 - x) * 1.6);
      hills(g, L, '#8aa88a'); hills(g, R, '#94ae90');
      hillHouses(g, (x) => x < 168 ? L(x) : 300, ['#e8dccc', '#d8c8b8', '#f0e4d4'], '#c48a6a', 363);
      hillHouses(g, (x) => x > 342 ? R(x) : 300, ['#e8dccc', '#d8c8b8', '#f0e4d4'], '#c48a6a', 364);
      for (const [fx, fy] of [[230, 196], [290, 214]]) { ferry(g, fx, fy, 0.22, {}); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(fx - 8, fy + 1); g.lineTo(fx - 26, fy + 4); g.moveTo(fx - 8, fy + 1); g.lineTo(fx - 22, fy - 2); g.stroke(); }
      // karşıdaki kule ve ona inen halat
      P(g, [440, 240, 452, 240, 449, 40, 443, 40], '#e8e0d8'); P(g, [458, 240, 470, 240, 467, 40, 461, 40], '#e8e0d8');
      rect(g, 440, 60, 30, 4, '#d8d0c8'); rect(g, 440, 120, 30, 4, '#d8d0c8');
      g.strokeStyle = '#f2ece4'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(446, 42); g.quadraticCurveTo(300, 200, 120, 160); g.stroke();
      cloud(g, 40, 150, 2, 'rgba(255,255,255,0.85)'); cloud(g, 300, 130, 1.6, 'rgba(255,255,255,0.8)'); cloud(g, 180, 60, 1.2, 'rgba(255,255,255,0.9)');
    },
    near(g) {
      pen('rgba(40,50,70,0.5)', 0.5);
      // kalın ana halat ve dikey askılar
      const y = (x) => 96 - Math.pow((x - 256) / 256, 2) * 66;
      for (let x = 0; x <= W; x += 16) { lin(g, x, y(x) + 3, x, 240, 'rgba(240,236,230,0.85)', 1); }
      g.strokeStyle = '#4a5464'; g.lineWidth = 9; g.beginPath(); for (let x = 0; x <= W; x += 4) g.lineTo(x, y(x)); g.stroke();
      g.strokeStyle = '#eef0f4'; g.lineWidth = 6.4; g.beginPath(); for (let x = 0; x <= W; x += 4) g.lineTo(x, y(x)); g.stroke();
      g.strokeStyle = 'rgba(160,170,190,0.8)'; g.lineWidth = 1; g.beginPath(); for (let x = 0; x <= W; x += 4) g.lineTo(x, y(x) + 2); g.stroke();
      for (let x = 8; x < W; x += 16) B(g, x - 3, y(x) - 4, 6, 8, 1.4, '#c8ccd4');
      // rüzgâr çizgileri ve martılar
      g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 0.8; g.lineCap = 'round';
      for (const [wx, wy, l] of [[60, 110, 30], [200, 150, 24], [330, 100, 34], [430, 170, 22]]) { g.beginPath(); g.moveTo(wx, wy); g.quadraticCurveTo(wx + l / 2, wy - 3, wx + l, wy); g.stroke(); }
      seagull(g, 140, 120, 1.4, '#ffffff'); seagull(g, 380, 140, 1.1, '#ffffff', 0.5);
    },
  };

  // 7-3 Tepe: gece köprü kulesinin tepesi; aşağıda iki yakanın ışıkları, kırmızı ikaz lambaları, renkli LED'ler
  DR.kopruTepe = {
    sky: { stops: [[0, '#04081c'], [0.6, '#121848'], [1, '#26245a']], moon: [60, 50, 11], stars: 90 },
    far(g) {
      g.fillStyle = '#0a0e2c'; g.fillRect(0, 176, W, 64);
      const r = rng(371);
      const shore = (x0, x1, y0) => { for (let i = 0; i < 300; i++) { const x = x0 + r() * (x1 - x0), y = y0 + r() * 34; g.fillStyle = ['#ffd27a', '#fff0c0', '#8ad8ff', '#ffb070'][Math.floor(r() * 4)]; g.globalAlpha = 0.4 + r() * 0.6; g.fillRect(x, y, 0.8, 0.8); } g.globalAlpha = 1; };
      shore(0, 200, 178); shore(300, W, 182);
      g.fillStyle = 'rgba(255,214,122,0.18)'; for (let i = 0; i < 20; i++) g.fillRect(200 + r() * 100, 200 + r() * 30, 6, 0.6);
      bridge(g, 120, 470, 186, 150, { cable: '#6a72b8', hang: 'rgba(150,140,255,0.4)', deck: '#4a4e98', tower: '#6a72b8', light: true, leds: ['#ff7ad8', '#6ad0ff', '#b48aff'] });
    },
    near(g) {
      pen('rgba(0,0,20,0.7)', 0.5);
      for (const x of [40, 296]) {
        // kule tepesi: iki ayak, kirişler, ikaz lambaları, merdiven
        P(g, [x, 240, x + 22, 240, x + 20, 30, x + 4, 30], '#c8c4dc'); P(g, [x + 150, 240, x + 172, 240, x + 168, 30, x + 152, 30], '#c8c4dc');
        rect(g, x + 14, 30, 6, 210, 'rgba(120,110,170,0.6)'); rect(g, x + 164, 30, 6, 210, 'rgba(120,110,170,0.6)');
        for (const y of [30, 96, 162]) { B(g, x, y, 172, 10, 1, '#b8b4d0'); rect(g, x, y + 8, 172, 2, '#8a86a8'); }
        for (const lx of [x + 12, x + 160]) { glow(g, lx, 24, 16, 'rgb(255,60,60)', 0.6); C(g, lx, 24, 2.4, '#ff4a4a'); }
        for (let y = 110; y < 214; y += 6) rect(g, x + 26, y, 10, 1, '#8a86a8');
        rect(g, x + 26, 110, 1, 104, '#8a86a8'); rect(g, x + 35, 110, 1, 104, '#8a86a8');
      }
      // halata dizilmiş renkli LED'ler
      const leds = ['#ff7ad8', '#6ad0ff', '#b48aff', '#ffe28a'];
      for (let k = 0; k < 30; k++) { const x = 212 + k * 3, y = 44 + k * 5.6; glow(g, x, y, 5, 'rgb(180,140,255)', 0.35); C(g, x, y, 1, leds[k % 4]); }
    },
  };

  // ================= 5 ATAŞEHİR =================
  // 5-1 Finans Merkezi: gece; gökyüzüne uzanan cam kuleler, cephede yukarı aşağı giden cam asansörler,
  // dev LED cephede yükselen grafik, ışık direkli meydan
  DR.finans = {
    sky: { draw(g, vw, vh) {
      skyGrad(g, vw, vh, [[0, '#060a24'], [0.55, '#1a1e52'], [0.85, '#4a3a7a'], [1, '#8a5a8a']]);
      stars(g, vw, vh, 26, 905, 0.45);
    } },
    far(g) {
      const r = rng(901);
      // uzak kuleler: ışıklı pencereler, tepede ikaz lambaları, bir iki vinç
      for (let x = -8; x < W; x += 22 + r() * 24) {
        const w = 16 + r() * 16, h = 60 + r() * 110, top = 200 - h;
        const kind = r();
        g.fillStyle = r() < 0.5 ? '#232a5a' : '#1c2350';
        g.beginPath();
        if (kind < 0.25) { g.moveTo(x, 214); g.lineTo(x, top + 10); g.lineTo(x + w / 2, top - 8); g.lineTo(x + w, top + 10); g.lineTo(x + w, 214); }
        else if (kind < 0.45) { g.moveTo(x, 214); g.lineTo(x, top); g.lineTo(x + w, top + 14); g.lineTo(x + w, 214); }
        else { g.rect(x, top, w, 214 - top); }
        g.closePath(); g.fill();
        for (let y = top + 6; y < 200; y += 4.4) for (let wx = x + 2; wx < x + w - 2; wx += 3.4) if (r() < 0.3) rect(g, wx, y, 1.8, 2, r() < 0.8 ? '#ffd98a' : '#9ad8ff');
        C(g, x + w / 2, top - (kind < 0.25 ? 8 : 0) - 1, 1, '#ff4a4a');
      }
      for (const cx of [140, 420]) {
        lin(g, cx, 214, cx, 60, '#3a3a5a', 1.6); lin(g, cx - 30, 62, cx + 50, 62, '#3a3a5a', 1.4);
        for (let k = 0; k < 8; k++) lin(g, cx - 30 + k * 10, 62, cx - 25 + k * 10, 66, '#3a3a5a', 0.5);
        lin(g, cx + 40, 62, cx + 40, 90, '#3a3a5a', 0.4); C(g, cx, 58, 1, '#ff4a4a');
      }
      glow(g, 256, 230, 260, 'rgb(255,170,120)', 0.18);
    },
    near(g) {
      pen('rgba(6,8,24,0.65)', 0.5);
      // kule tabanları: cam lobi ve dışarıdan görünen asansör boşluğu
      const tower = (x, w, h, lifts) => {
        const top = 214 - h;
        const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, '#3a6aa8'); gr.addColorStop(0.5, '#24467a'); gr.addColorStop(1, '#16284a');
        B(g, x, top, w, h, 0, gr);
        g.fillStyle = 'rgba(255,255,255,0.12)'; for (let y = top + 4; y < 214; y += 7) g.fillRect(x, y, w, 0.6);
        const r = rng(x * 7 + 3);
        for (let y = top + 6; y < 176; y += 7) for (let wx = x + 3; wx < x + w - 4; wx += 6) if (r() < 0.45) rect(g, wx, y + 1, 4, 4, 'rgba(255,224,150,0.55)');
        // lobi
        B(g, x + 6, 178, w - 12, 36, 1, 'rgba(255,230,180,0.75)');
        for (let lx = x + 12; lx < x + w - 8; lx += 10) rect(g, lx, 178, 1, 36, 'rgba(60,70,110,0.6)');
        // cephe asansörleri: cam boşluk, ışıklı kabin
        for (const [ax, ay] of lifts) {
          B(g, ax, top + 8, 12, 214 - top - 8, 1, 'rgba(160,220,255,0.18)');
          rect(g, ax + 5.4, top + 8, 1.2, 214 - top - 8, 'rgba(120,140,180,0.6)');
          glow(g, ax + 6, ay + 6, 14, 'rgb(255,226,160)', 0.4);
          B(g, ax + 1, ay, 10, 12, 1.4, '#ffe9a8'); rect(g, ax + 1, ay + 5.6, 10, 0.8, 'rgba(120,90,40,0.5)');
        }
      };
      tower(0, 92, 200, [[78, 60]]);
      tower(330, 110, 214, [[300, 110], [440, 30]]);
      // dev LED cephe: yükselen yeşil grafik
      B(g, 150, 60, 132, 84, 3, '#0c1224');
      B(g, 154, 64, 124, 76, 2, '#0a2a2a');
      g.strokeStyle = 'rgba(58,224,255,0.25)'; g.lineWidth = 0.5;
      for (let y = 72; y < 140; y += 10) { g.beginPath(); g.moveTo(156, y); g.lineTo(276, y); g.stroke(); }
      const pts = [[158, 128], [174, 122], [186, 126], [200, 112], [214, 116], [228, 100], [242, 104], [256, 86], [272, 74]];
      g.fillStyle = 'rgba(124,255,106,0.18)'; g.beginPath(); g.moveTo(158, 138); for (const [x, y] of pts) g.lineTo(x, y); g.lineTo(272, 138); g.closePath(); g.fill();
      g.strokeStyle = '#7cff6a'; g.lineWidth = 1.4; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
      C(g, 272, 74, 2, '#ffffff');
      rect(g, 154, 132, 124, 8, '#04121a');
      for (let x = 158; x < 274; x += 14) { rect(g, x, 134.6, 6, 2.4, (x / 14) % 3 ? '#7cff6a' : '#ff6a6a'); rect(g, x + 7, 135.2, 3, 1.4, 'rgba(255,255,255,0.5)'); }
      rect(g, 210, 144, 12, 70, '#1a2038');
      // meydan: ince LED direkler, saksılar, halka heykel
      for (const lx of [118, 296, 470]) { lin(g, lx, 214, lx, 150, '#4a5272', 1.4); glow(g, lx, 150, 16, 'rgb(150,230,255)', 0.5); B(g, lx - 1.6, 148, 3.2, 8, 1.2, '#cfeeff'); }
      for (const px of [128, 286, 488]) { B(g, px - 9, 204, 18, 10, 1, '#5a6070'); C(g, px - 3, 202, 5, '#3f8a4a'); C(g, px + 4, 201, 5.6, '#3a7a42'); }
      g.strokeStyle = '#c8d2e0'; g.lineWidth = 3; g.beginPath(); g.ellipse(250, 186, 13, 17, 0.35, 0, TAU); g.stroke();
      g.strokeStyle = '#7a8496'; g.lineWidth = 1; g.beginPath(); g.ellipse(250, 186, 13, 17, 0.35, 0.3, 1.6); g.stroke();
      B(g, 240, 204, 20, 10, 1, '#4a5068');
    },
  };

  // 5-2 Veri Merkezi: soğuk koridor; iki yanda sunucu kabinleri, tavanda sarı fiber tavaları,
  // camla kapatılmış koridorun sonunda mavi ışık, soğutma üniteleri ve yangın söndürme tüpleri
  DR.veri = {
    sky: { draw(g, vw, vh) { skyGrad(g, vw, vh, [[0, '#060a14'], [0.6, '#0e1828'], [1, '#16243a']]); } },
    far(g) {
      // derinliğe uzanan koridor: kaçış noktasında mavi ışık
      const vx = 256, vy = 120;
      glow(g, vx, vy, 120, 'rgb(90,170,255)', 0.35);
      B(g, vx - 26, vy - 34, 52, 72, 1, '#9ad0ff');
      rect(g, vx - 1, vy - 34, 2, 72, 'rgba(40,60,90,0.6)');
      for (const side of [-1, 1]) {
        for (let k = 0; k < 7; k++) {
          const t0 = k / 7, t1 = (k + 1) / 7;
          const xa = vx + side * (30 + t0 * t0 * 230), xb = vx + side * (30 + t1 * t1 * 230);
          const ha = 36 + t0 * t0 * 150, hb = 36 + t1 * t1 * 150;
          g.fillStyle = k % 2 ? '#141c2c' : '#18223a';
          g.beginPath(); g.moveTo(xa, vy - ha * 0.5); g.lineTo(xb, vy - hb * 0.5); g.lineTo(xb, vy + hb * 0.62); g.lineTo(xa, vy + ha * 0.62); g.closePath(); g.fill();
          const r = rng(920 + k + side * 11);
          for (let j = 0; j < 6 + k * 2; j++) {
            const u = r(), x = xa + (xb - xa) * u, hh = ha + (hb - ha) * u, y = vy - hh * 0.4 + r() * hh * 0.9;
            g.fillStyle = ['#3ae0ff', '#7cff6a', '#3a8aff'][j % 3]; g.globalAlpha = 0.5 + r() * 0.5; g.fillRect(x, y, 1.2, 1.2); g.globalAlpha = 1;
          }
        }
      }
      // tavanda fiber tavası ve lambalar (perspektif)
      for (let k = 0; k < 6; k++) { const t = k / 6, y = vy - 34 - t * t * 90, w = 50 + t * t * 460; rect(g, vx - w / 2, y, w, 1.2 + t * 2, 'rgba(210,220,240,0.35)'); }
      g.strokeStyle = '#e2b42a'; g.lineWidth = 2; g.beginPath(); g.moveTo(vx - 40, vy - 30); g.lineTo(-20, 18); g.moveTo(vx + 40, vy - 30); g.lineTo(W + 20, 18); g.stroke();
      rect(g, 0, 214, W, 26, '#1a2232');
    },
    near(g) {
      pen('rgba(0,0,0,0.7)', 0.6);
      const r = rng(931);
      // kabin sıraları: soğuk koridor (mavi) ve sıcak koridor (turuncu) dönüşümlü
      for (const [x, hot] of [[0, false], [150, true], [330, false], [440, true]]) {
        const w = hot ? 70 : 96;
        B(g, x, 70, w, 144, 1, '#161c28'); rect(g, x, 70, w, 3, '#2e3a52');
        for (let cx = x + 3; cx + 21 <= x + w; cx += 23) {
          B(g, cx, 76, 21, 136, 1, '#1e2636');
          for (let y = 80; y < 206; y += 6) {
            rect(g, cx + 2, y, 17, 4.4, '#0c121c');
            if (r() < 0.75) { const c = hot ? (r() < 0.5 ? '#ffb43a' : '#ff6a3a') : (r() < 0.6 ? '#3ae0ff' : '#7cff6a'); rect(g, cx + 15 + r() * 3, y + 1.6, 1.2, 1.2, c); }
          }
          rect(g, cx + 1, 76, 1, 136, 'rgba(255,255,255,0.1)');
        }
        glow(g, x + w / 2, 140, 80, hot ? 'rgb(255,140,60)' : 'rgb(70,160,255)', 0.12);
      }
      // soğutma ünitesi: büyük fanlar
      B(g, 98, 120, 48, 94, 2, '#c8ced8'); rect(g, 98, 120, 48, 4, '#e8ecf2');
      for (const fy of [140, 176]) { C(g, 122, fy, 14, '#4a5262'); C(g, 122, fy, 3, '#9aa0aa'); for (let k = 0; k < 5; k++) { const a = k * TAU / 5; g.fillStyle = '#7a828e'; g.beginPath(); g.ellipse(122 + Math.cos(a) * 7, fy + Math.sin(a) * 7, 5, 2.4, a, 0, TAU); g.fill(); } }
      // durum ekranı: sıcaklık çizgisi
      B(g, 270, 92, 50, 34, 2, '#0c1220'); B(g, 273, 95, 44, 28, 1, '#0a2032');
      g.strokeStyle = '#3ae0ff'; g.lineWidth = 1; g.beginPath(); g.moveTo(276, 112); for (let k = 1; k < 9; k++) g.lineTo(276 + k * 5, 110 + Math.sin(k * 1.3) * 3); g.stroke();
      rect(g, 276, 117, 26, 2.4, '#7cff6a');
      rect(g, 293, 126, 4, 88, '#2a3040');
      // yangın söndürme tüpleri
      for (let k = 0; k < 3; k++) { B(g, 412 + k * 8, 180, 7, 34, 3, '#c8302a'); rect(g, 413.5 + k * 8, 176, 4, 5, '#8a8f9a'); }
      // tavanda kablo tavaları
      rect(g, 0, 50, W, 6, '#3a3420'); rect(g, 0, 50, W, 1.4, '#e2b42a');
      for (let x = 0; x < W; x += 24) lin(g, x + 12, 44, x + 12, 50, '#5a5440', 1);
      for (let k = 0; k < 4; k++) { g.strokeStyle = ['#3a6ad8', '#d84a3a', '#e2e2e2', '#3fae2c'][k]; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, 57 + k * 2); for (let x = 0; x <= W; x += 64) g.quadraticCurveTo(x + 32, 63 + k * 2, x + 64, 57 + k * 2); g.stroke(); }
    },
  };

  // 5-3 Kontrol Odası: akıllı şehrin kontrol odası; kavisli ekran duvarında canlı trafik haritası,
  // kamera görüntüleri ve grafikler (bazı ekranlar fidye yazılımının kilidiyle kızıl); önde basamaklı operatör masaları
  DR.kontrol = {
    sky: { draw(g, vw, vh) { skyGrad(g, vw, vh, [[0, '#04060e'], [0.6, '#0a1020'], [1, '#121a30']]); } },
    far(g) {
      rect(g, 0, 30, W, 8, '#1a2238');
      // ekran duvarı: 6 sütun × 3 satır, ortada büyük harita
      const sx = 16, sy = 44, cw = 80, ch = 44;
      for (let row = 0; row < 3; row++) for (let col = 0; col < 6; col++) {
        const x = sx + col * cw, y = sy + row * ch;
        B(g, x, y, cw - 3, ch - 3, 1, '#05080e');
        const big = col >= 2 && col <= 3;
        if (big) continue;
        const k = (row * 6 + col) % 5, locked = (row === 1 && col === 0) || (row === 2 && col === 5) || (row === 0 && col === 4);
        g.save(); g.beginPath(); g.rect(x + 2, y + 2, cw - 7, ch - 7); g.clip();
        if (locked) {
          g.fillStyle = '#3a0a10'; g.fillRect(x, y, cw, ch);
          g.strokeStyle = '#ff4a4a'; g.lineWidth = 2.6; g.beginPath(); g.arc(x + cw / 2 - 1.5, y + 17, 6, Math.PI, 0); g.stroke();
          B(g, x + cw / 2 - 10, y + 17, 17, 13, 2, '#e8443a'); C(g, x + cw / 2 - 1.5, y + 22.5, 1.8, '#3a0a10');
        } else if (k === 0) {
          // kamera: kavşak
          g.fillStyle = '#1a2a3a'; g.fillRect(x, y, cw, ch);
          g.fillStyle = '#2a3a4a'; g.fillRect(x, y + 22, cw, 10); g.fillRect(x + 34, y, 10, ch);
          for (let c = 0; c < 4; c++) rect(g, x + 8 + c * 16, y + 25, 6, 3, ['#ffb43a', '#ffffff', '#3ae0ff', '#ff6a6a'][c]);
          rect(g, x + 4, y + 4, 5, 2, '#ff3a3a');
        } else if (k === 1) {
          // çubuk grafik
          g.fillStyle = '#081420'; g.fillRect(x, y, cw, ch);
          for (let c = 0; c < 8; c++) { const h = 8 + ((c * 37 + row * 11) % 24); rect(g, x + 6 + c * 8.5, y + ch - 8 - h, 5, h, c % 3 ? '#3ae0ff' : '#7cff6a'); }
        } else if (k === 2) {
          // hava ve deniz: dalga çizgileri
          g.fillStyle = '#0a1a2e'; g.fillRect(x, y, cw, ch);
          g.strokeStyle = '#3a8aff'; g.lineWidth = 1; for (let w2 = 0; w2 < 3; w2++) { g.beginPath(); for (let xx = 0; xx <= cw; xx += 4) g.lineTo(x + xx, y + 14 + w2 * 8 + Math.sin(xx * 0.2 + w2) * 2); g.stroke(); }
        } else if (k === 3) {
          // vapur hatları
          g.fillStyle = '#0a1420'; g.fillRect(x, y, cw, ch);
          g.strokeStyle = '#ffb43a'; g.lineWidth = 0.8; g.setLineDash([2, 2]); g.beginPath(); g.moveTo(x + 6, y + 30); g.quadraticCurveTo(x + 40, y + 6, x + 72, y + 26); g.stroke(); g.setLineDash([]);
          C(g, x + 40, y + 13, 2, '#ffffff');
        } else {
          // metro hatları
          g.fillStyle = '#0c1220'; g.fillRect(x, y, cw, ch);
          for (const [c, y2] of [['#2fa84f', 12], ['#e5427f', 22], ['#8a4fae', 30]]) { rect(g, x + 4, y + y2, cw - 12, 2, c); for (let d = 0; d < 5; d++) C(g, x + 8 + d * 14, y + y2 + 1, 1.6, '#ffffff'); }
        }
        g.restore();
      }
      // ortadaki büyük ekran: canlı trafik haritası (Boğaz, iki yaka, yollar)
      const mx = sx + 2 * cw, my = sy, mw = 2 * cw - 3, mh = 3 * ch - 3;
      B(g, mx, my, mw, mh, 2, '#06101c');
      g.save(); g.beginPath(); g.rect(mx + 2, my + 2, mw - 4, mh - 4); g.clip();
      g.fillStyle = '#0e1e30'; g.fillRect(mx, my, mw, mh);
      g.fillStyle = '#0a3a5a';
      g.beginPath(); g.moveTo(mx + 70, my); g.bezierCurveTo(mx + 90, my + 30, mx + 60, my + 60, mx + 80, my + 90); g.bezierCurveTo(mx + 96, my + 110, mx + 70, my + 125, mx + 60, my + mh);
      g.lineTo(mx + 90, my + mh); g.bezierCurveTo(mx + 100, my + 120, mx + 110, my + 100, mx + 96, my + 80); g.bezierCurveTo(mx + 84, my + 56, mx + 108, my + 30, mx + 92, my); g.closePath(); g.fill();
      for (const [col, pts] of [['#7cff6a', [[10, 30], [40, 40], [74, 52], [100, 48], [150, 40]]], ['#ffb43a', [[20, 100], [60, 92], [84, 96], [120, 104], [150, 110]]], ['#ff4a4a', [[110, 10], [116, 50], [124, 90], [130, 128]]], ['#7cff6a', [[30, 60], [34, 100], [40, 130]]]]) {
        g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(mx + x, my + y) : g.moveTo(mx + x, my + y))); g.stroke();
      }
      for (const [x, y] of [[40, 40], [100, 48], [60, 92], [124, 90]]) { C(g, mx + x, my + y, 2.4, '#ffffff'); }
      g.restore();
      glow(g, 256, 110, 200, 'rgb(60,140,255)', 0.12);
      rect(g, 0, 178, W, 36, '#0c1222');
    },
    near(g) {
      pen('rgba(0,0,0,0.7)', 0.6);
      // basamaklı operatör masaları: monitörler, klavyeler, sandalyeler
      for (const [x0, x1, y] of [[10, 230, 176], [282, 502, 176]]) {
        B(g, x0, y + 14, x1 - x0, 24, 2, '#1e2638'); rect(g, x0, y + 14, x1 - x0, 2, '#3a4a6a');
        for (let mx = x0 + 10; mx < x1 - 30; mx += 44) {
          B(g, mx, y - 8, 26, 18, 1.4, '#0a0e18'); B(g, mx + 2, y - 6, 22, 13, 1, ['#0a3a5a', '#0a2a1a', '#3a0a10'][(mx / 44 | 0) % 3]);
          rect(g, mx + 4, y - 3, 14, 1.4, 'rgba(124,255,106,0.8)'); rect(g, mx + 4, y, 10, 1.4, 'rgba(58,224,255,0.7)');
          rect(g, mx + 11, y + 10, 4, 4, '#2a3040'); B(g, mx + 2, y + 12, 22, 2.4, 0.6, '#3a4458');
          // sandalye arkalığı
          B(g, mx + 30, y + 4, 10, 16, 3, '#2a2e3e'); rect(g, mx + 34, y + 20, 2, 18, '#1a1e2a');
        }
      }
      // ortada vardiya şefinin masası ve kırmızı alarm lambası
      B(g, 236, 196, 40, 18, 2, '#2a3248'); rect(g, 236, 196, 40, 2, '#4a5a7a');
      glow(g, 256, 186, 22, 'rgb(255,60,60)', 0.5); C(g, 256, 188, 3, '#ff4a4a'); rect(g, 254.6, 190, 2.8, 6, '#3a3e48');
      // tavandaki ışık şeridi
      rect(g, 0, 22, W, 3, '#2a3a5a'); for (let x = 16; x < W; x += 64) { glow(g, x, 24, 28, 'rgb(150,200,255)', 0.25); rect(g, x - 12, 23, 24, 1.4, '#cfe4ff'); }
    },
  };

  // ================= 11 ÇAMLICA =================
  // 11-2 Asansör: kulenin cam asansör boşluğu; çelik kafes, aşağıda gece şehri ve ışıklı köprüler
  DR.asansor = {
    sky: { stops: [[0, '#04061a'], [0.6, '#10164a'], [1, '#22205a']], stars: 70 },
    far(g) {
      g.fillStyle = '#0c1036'; g.fillRect(0, 150, W, 90);
      const r = rng(391);
      for (let i = 0; i < 600; i++) { const x = r() * W, y = 152 + Math.pow(r(), 0.7) * 86; g.fillStyle = ['#ffd27a', '#fff0c0', '#8ad8ff', '#ffb070'][Math.floor(r() * 4)]; g.globalAlpha = 0.35 + r() * 0.65; g.fillRect(x, y, 0.8, 0.8); }
      g.globalAlpha = 1;
      g.fillStyle = '#060a24'; P(g, [0, 176, 80, 166, 200, 172, 330, 160, 512, 170, 512, 182, 0, 190], '#060a24');
      bridge(g, 60, 260, 168, 140, { cable: '#7a82c8', hang: 'rgba(160,140,255,0.4)', deck: '#5a5ea8', tower: '#7a82c8', light: true, leds: ['#b48aff', '#6ad0ff', '#ff7ad8'] });
      bridge(g, 330, 490, 166, 144, { cable: '#7a82c8', hang: 'rgba(160,140,255,0.4)', deck: '#5a5ea8', tower: '#7a82c8', light: true, leds: ['#6ad0ff', '#ffe28a', '#b48aff'] });
    },
    near(g) {
      pen('rgba(0,0,20,0.7)', 0.5);
      for (let x = 0; x < W; x += 128) {
        rect(g, x, 0, 10, 240, '#5a6488'); rect(g, x + 2, 0, 2, 240, '#8a96bc');
        for (let y = 0; y < 240; y += 60) { rect(g, x, y, 128, 5, '#4a5478'); g.strokeStyle = 'rgba(110,124,170,0.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 10, y + 5); g.lineTo(x + 128, y + 60); g.moveTo(x + 128, y + 5); g.lineTo(x + 10, y + 60); g.stroke(); }
        g.fillStyle = 'rgba(160,210,255,0.06)'; g.fillRect(x + 10, 0, 118, 240);
        P(g, [x + 20, 240, x + 40, 240, x + 100, 0, x + 80, 0], 'rgba(255,255,255,0.05)');
      }
      // asansör kabini ve halatları
      for (const cx of [232, 248]) lin(g, cx, 0, cx, 90, '#2a2e40', 0.8);
      B(g, 216, 90, 48, 56, 3, '#3a4262'); B(g, 220, 94, 40, 48, 2, '#ffe2a0');
      glow(g, 240, 118, 40, 'rgb(255,226,160)', 0.25);
      g.fillStyle = 'rgba(120,80,40,0.4)'; g.beginPath(); g.arc(236, 124, 4, 0, TAU); g.fill(); g.fillRect(232, 128, 8, 14);
      rect(g, 216, 146, 48, 4, '#2a2e40');
    },
  };

  // 11-3 Yayın Odası: kulenin yayın odası; ekran duvarı (biri mavi ekran), kumanda masaları, YAYINDA lambası
  DR.yayin = {
    sky: { draw(g, vw, vh) { skyGrad(g, vw, vh, [[0, '#03060f'], [0.6, '#081428'], [1, '#0e1c36']]); } },
    far(g) {
      rect(g, 0, 0, W, 216, '#0c1426');
      const r = rng(401);
      for (let row = 0; row < 4; row++) for (let col = 0; col < 12; col++) {
        const x = 6 + col * 42, y = 40 + row * 34, k = Math.floor(r() * 5);
        B(g, x, y, 38, 30, 1.5, '#1a2236'); 
        const sx = x + 2, sy = y + 2, sw = 34, sh = 24;
        if (k === 0) { rect(g, sx, sy, sw, sh, '#1e5ae0'); g.fillStyle = '#ffffff'; g.fillRect(sx + 4, sy + 6, 14, 1.4); g.fillRect(sx + 4, sy + 10, 20, 1); g.fillRect(sx + 4, sy + 13, 16, 1); }
        else if (k === 1) { const cs = ['#e8e8e8', '#f4e04a', '#3ae0ff', '#3aff7a', '#ff4aff', '#ff4a4a', '#3a4aff']; cs.forEach((c, i) => rect(g, sx + i * sw / 7, sy, sw / 7 + 0.3, sh, c)); }
        else if (k === 2) { rect(g, sx, sy, sw, sh, '#06120c'); g.strokeStyle = '#3aff7a'; g.lineWidth = 0.7; g.beginPath(); for (let t = 0; t <= sw; t += 2) g.lineTo(sx + t, sy + sh / 2 + Math.sin(t * 0.6 + col) * 7); g.stroke(); }
        else if (k === 3) { rect(g, sx, sy, sw, sh, '#2a3a5a'); C(g, sx + sw / 2, sy + sh / 2, 7, '#8ab0e0'); P(g, [sx, sy + sh, sx + sw * 0.3, sy + sh - 8, sx + sw * 0.55, sy + sh - 4, sx + sw * 0.8, sy + sh - 10, sx + sw, sy + sh], '#4a5a80'); }
        else { rect(g, sx, sy, sw, sh, '#0a0a0a'); g.fillStyle = 'rgba(255,255,255,0.2)'; for (let i = 0; i < 40; i++) g.fillRect(sx + r() * sw, sy + r() * sh, 1, 1); }
      }
      glow(g, 256, 100, 200, 'rgb(60,120,255)', 0.12);
    },
    near(g) {
      pen('rgba(0,0,10,0.7)', 0.5);
      // kumanda masaları
      for (const x of [20, 280]) {
        P(g, [x, 214, x + 200, 214, x + 200, 176, x + 180, 160, x + 20, 160, x, 176], '#2a3248');
        P(g, [x + 20, 160, x + 180, 160, x + 190, 170, x + 10, 170], '#3a4462');
        const r = rng(x);
        for (let k = 0; k < 24; k++) { const bx = x + 16 + (k % 12) * 14, by = 162 + Math.floor(k / 12) * 4; rect(g, bx, by, 6, 1.6, ['#3aff7a', '#ffb43a', '#ff4a4a', '#3ab0ff'][Math.floor(r() * 4)]); }
        for (let k = 0; k < 10; k++) { const fx = x + 30 + k * 14; rect(g, fx, 176, 1.4, 22, '#12161e'); B(g, fx - 2.5, 180 + r() * 14, 6.4, 4, 1, '#d8dce4'); }
        B(g, x + 80, 128, 40, 30, 2, '#1a2236'); B(g, x + 83, 131, 34, 22, 1, '#1e5ae0');
      }
      // YAYINDA lambası, mikrofon
      B(g, 222, 20, 68, 16, 3, '#3a0a0e'); glow(g, 256, 28, 40, 'rgb(255,60,60)', 0.4);
      g.fillStyle = '#ff5a5a'; g.font = '600 9px Fredoka, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('YAYINDA', 256, 28.4);
      lin(g, 250, 214, 250, 150, '#4a4e5a', 1.2); lin(g, 250, 150, 264, 136, '#4a4e5a', 1.2); B(g, 262, 128, 8, 12, 4, '#2a2e3a');
    },
  };

  // ================= 12 ÜMRANİYE =================
  // 12-1 Çarşı: mahalle sokağı; balkonlu apartmanlar, bakkal, fırın, çay ocağı; uzakta Çamlıca Kulesi
  function apartment(g, x, by, w, floors, col, r, opt) {
    const fh = 16, h = floors * fh + 18;
    B(g, x, by - h, w, h, 0, col);
    rect(g, x - 2, by - h, w + 4, 4, mix(col, '#3a2a2a', 0.3));
    for (let f = 0; f < floors; f++) {
      const y = by - h + 8 + f * fh;
      for (let wx = x + 5; wx < x + w - 8; wx += 13) {
        B(g, wx, y, 8, 9, 0.6, r() < (opt.litP || 0) ? '#ffe39a' : '#4a5a72');
        if (r() < 0.3) B(g, wx - 1, y + 9, 10, 2, 0.4, '#d8c8a8');
      }
      if (f % 2 === 0) { rect(g, x + 3, y + 10, w - 6, 1.4, '#5a5050'); for (let bx = x + 4; bx < x + w - 4; bx += 3) rect(g, bx, y + 11.4, 0.5, 4, '#5a5050'); }
      if (r() < 0.4) { B(g, x + w - 9, y + 2, 7, 5, 1, '#e8e8ec'); rect(g, x + w - 8, y + 3, 5, 0.6, '#9aa0aa'); }
    }
    if (r() < 0.7) { const dx = x + 6 + r() * (w - 16); g.fillStyle = '#d8dce4'; g.beginPath(); g.ellipse(dx, by - h - 4, 4, 4.6, -0.5, 0, TAU); g.fill(); }
    return by - h;
  }
  DR.umraniyeCarsi = {
    sky: { stops: [[0, '#6ab4ea'], [0.7, '#cfe6f6'], [1, '#f6ead4']] },
    far(g) {
      cloud(g, 60, 50, 1, 'rgba(255,255,255,0.9)'); cloud(g, 360, 36, 0.9, 'rgba(255,255,255,0.85)');
      const base = hillsY(188, 30, 1001);
      camlicaTower(g, 120, base(120) + 6, 0.9, { wall: '#b8c4d4', wallD: '#a4b0c2', glass: '#8ab0d8', band: '#c8dcf0' });
      hills(g, base, '#a8c0b0');
      hillHouses(g, base, ['#e8dccc', '#d8ccbc', '#f0e2d0', '#d4c4b4'], '#c48a6a', 1002);
    },
    near(g) {
      pen('rgba(40,30,30,0.6)', 0.5);
      const r = rng(1003);
      const cols = ['#e8d4b4', '#f0c8b0', '#d8d0c0', '#e4c8c8', '#d4dcc8'];
      const shops = [['BAKKAL', '#2a6ab0'], ['FIRIN', '#c8602a'], ['ÇAY OCAĞI', '#2a8a5a'], ['BERBER', '#a83a5a']];
      for (let i = 0; i < 4; i++) {
        const x = 4 + i * 128, w = 112;
        apartment(g, x, 214, w, 5 + (i % 2), cols[i % cols.length], r, { litP: 0.12 });
        // zemin katta dükkân
        B(g, x + 4, 180, w - 8, 34, 0, '#4a4040'); B(g, x + 8, 184, w - 16, 26, 1, '#c8dce8');
        const [label, c] = shops[i];
        B(g, x + 10, 170, w - 20, 11, 2, c); g.fillStyle = '#ffffff'; g.font = '600 7px Fredoka, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, x + w / 2, 175.6);
        if (i === 0) { for (let k = 0; k < 6; k++) B(g, x + 14 + k * 14, 196, 9, 12, 1, ['#e2483a', '#f4c531', '#3aa86a'][k % 3]); }
        if (i === 1) { for (let k = 0; k < 5; k++) E(g, x + 22 + k * 16, 200, 7, 3.4, '#d8a050'); for (let k = 0; k < 5; k++) lin(g, x + 18 + k * 16, 199, x + 26 + k * 16, 199, '#a86a2a', 0.5); }
        if (i === 2) { E(g, x + 56, 206, 26, 3, '#c8c8cc'); for (let k = 0; k < 6; k++) P(g, [x + 38 + k * 7, 198, x + 42 + k * 7, 198, x + 41.2 + k * 7, 204, x + 38.8 + k * 7, 204], 'rgba(200,40,20,0.85)'); }
        if (i === 3) { lin(g, x + w - 14, 186, x + w - 14, 206, '#ffffff', 3); for (let y = 186; y < 206; y += 4) lin(g, x + w - 15.5, y, x + w - 12.5, y + 2, '#d2302a', 1); }
      }
      for (const lx of [124, 380]) lamp(g, lx, 214, 40);
      simitCart(g, 250, 214, 0.9);
      // iki apartmanın arasında mahallenin erik ağacı (kenardan kesintisiz)
      for (const ex of [508, -4]) erik(g, ex, 214, 1.15);
    },
  };

  // 12-2 Yeni Plazalar: sabah yeni iş kuleleri, işe giden trafik; önde plaza girişi, büyük ekran, genç ağaçlar
  DR.yeniPlazalar = {
    sky: { stops: [[0, '#5aaae8'], [0.65, '#bfe2f8'], [1, '#fff0d4']], sun: [80, 70, 11, '#fffbe6'] },
    far(g) {
      const r = rng(1011);
      for (let x = -10; x < W; x += 26 + r() * 30) {
        const w = 22 + r() * 18, h = 70 + r() * 90;
        B(g, x, 196 - h, w, h + 20, 0, r() < 0.5 ? '#9ab8d4' : '#8aaac8');
        for (let y = 200 - h; y < 196; y += 5) for (let wx = x + 2; wx < x + w - 2; wx += 4) if (r() < 0.35) rect(g, wx, y, 2, 2.4, 'rgba(255,255,255,0.45)');
        if (r() < 0.5) { lin(g, x + w / 2, 196 - h, x + w / 2, 186 - h, '#7a8aa8', 0.8); C(g, x + w / 2, 186 - h, 1, '#ff6a5a'); }
      }
      // otoyol: sabah trafiği
      rect(g, 0, 182, W, 6, '#7a8090'); rect(g, 0, 181, W, 1.4, '#a8aeba');
      const cars = ['#d2302a', '#f2f2ee', '#3a6ad8', '#2a2e38', '#f4c531', '#9aa0aa'];
      for (let x = 0; x < W; x += 9) { rect(g, x, 182.6, 6, 2, cars[(x / 9) % cars.length | 0]); rect(g, x + 3, 185.2, 5, 2, cars[(x / 9 + 3) % cars.length | 0]); }
      for (let x = 20; x < W; x += 60) rect(g, x, 188, 4, 26, '#8a90a0');
    },
    near(g) {
      pen('rgba(10,10,30,0.6)', 0.5);
      // camdan kule tabanları
      glassTower(g, 10, 214, 70, 200, 'a'); glassTower(g, 300, 214, 80, 210, 'e');
      for (const x of [10, 300]) { B(g, x + 20, 184, 30, 30, 1, 'rgba(210,235,250,0.75)'); rect(g, x + 34, 184, 2, 30, '#5a6488'); }
      // büyük ekran
      B(g, 120, 96, 120, 64, 3, '#1a1e2c'); B(g, 124, 100, 112, 56, 2, '#2a5ad8');
      g.fillStyle = '#ffffff'; g.font = '600 12px Fredoka, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('</> deploy', 180, 120);
      rect(g, 132, 136, 96, 4, 'rgba(255,255,255,0.3)'); rect(g, 132, 136, 64, 4, '#7cff6a');
      rect(g, 176, 160, 8, 54, '#2a2e3a');
      // genç erguvanlar ve erikler, banklar, bisiklet park yeri
      for (const [tx, k] of [[100, 0], [262, 1], [420, 0], [490, 1]]) { if (k) erik(g, tx, 214, 0.78); else erguvan(g, tx, 214, 0.82); }
      B(g, 200, 204, 34, 3, 1, '#8a6a4a'); rect(g, 203, 207, 2, 7, '#3a3e48'); rect(g, 229, 207, 2, 7, '#3a3e48');
      for (let k = 0; k < 4; k++) { g.strokeStyle = '#9aa0aa'; g.lineWidth = 1; g.beginPath(); g.arc(440 + k * 10, 210, 4, Math.PI, 0); g.stroke(); }
    },
  };

  // Sanayi (10-1 İMES'in ve Kadosan'ın arka planının kaynağı): Dudullu sanayisi, akşam; testere dişi çatılar, bacalar;
  // önde kepenkli atölyeler: torna, kaynak, CNC, boya
  DR.sanayi = {
    sky: { stops: [[0, '#1a1220'], [0.6, '#3a2430'], [1, '#8a4024']], stars: 20 },
    far(g) {
      const r = rng(1021);
      for (let x = 0; x < W; x += 64) {
        B(g, x, 150, 62, 64, 0, '#2a2028');
        for (let k = 0; k < 4; k++) P(g, [x + k * 16, 150, x + k * 16 + 16, 150, x + k * 16 + 16, 138], '#342830');
      }
      for (const [cx, h] of [[60, 70], [250, 90], [430, 60]]) {
        B(g, cx - 5, 150 - h, 10, h, 1, '#3a2c30'); rect(g, cx - 5, 150 - h + 8, 10, 3, '#a83a2a');
        for (let k = 0; k < 4; k++) { g.fillStyle = `rgba(160,150,150,${0.35 - k * 0.07})`; g.beginPath(); g.arc(cx + k * 8, 150 - h - 8 - k * 9, 6 + k * 3, 0, TAU); g.fill(); }
      }
      // su kulesi, elektrik direkleri, uzakta Çamlıca'nın ışığı
      B(g, 340, 96, 26, 18, 3, '#4a3a40'); for (const lx of [342, 352, 362]) rect(g, lx, 114, 2, 36, '#4a3a40');
      for (let x = 0; x < W; x += 128) { lin(g, x + 20, 150, x + 20, 100, '#2a2028', 1.2); lin(g, x + 12, 104, x + 28, 104, '#2a2028', 1); }
      g.strokeStyle = 'rgba(30,20,30,0.8)'; g.lineWidth = 0.4; g.beginPath(); for (let x = 0; x < W; x += 128) { g.moveTo(x + 12, 104); g.quadraticCurveTo(x + 76, 114, x + 140, 104); } g.stroke();
      homeTower(g, 160, 152, 0.32, '#3a2c40', '#ff6a5a');
      for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,200,120,0.6)'; g.fillRect(r() * W, 152 + r() * 50, 1, 1); }
    },
    near(g) {
      pen('rgba(10,5,0,0.65)', 0.5);
      const shops = [['TORNA', '#2a6ab0'], ['KAYNAK', '#c8a02a'], ['CNC', '#5a4a9a'], ['BOYA', '#3a8a5a']];
      for (let i = 0; i < 4; i++) {
        const x = 2 + i * 128, w = 120, k = shops[i][0];
        B(g, x, 120, w, 94, 0, '#5a5658'); rect(g, x - 2, 116, w + 4, 6, '#3a3638');
        B(g, x + 14, 104, w - 28, 14, 2, shops[i][1]); g.fillStyle = '#ffffff'; g.font = '600 9px Fredoka, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(k, x + w / 2, 111.4);
        // yarı açık kepenk, içeride sıcak ışık
        B(g, x + 12, 132, w - 24, 82, 1, '#ffb05a');
        g.fillStyle = grad(g, 0, 132, 0, 214, [[0, '#ffd08a'], [1, '#c8602a']]); g.fillRect(x + 12, 160, w - 24, 54);
        rect(g, x + 12, 132, w - 24, 30, '#7a7a80'); for (let y = 134; y < 162; y += 3) rect(g, x + 12, y, w - 24, 0.8, '#5a5a62');
        if (k === 'TORNA') { B(g, x + 30, 184, 60, 18, 2, '#4a5a6a'); C(g, x + 40, 186, 6, '#3a4a5a'); rect(g, x + 46, 184, 30, 4, '#c8ccd4'); }
        if (k === 'KAYNAK') { lin(g, x + 60, 214, x + 60, 186, '#2a2a30', 2); C(g, x + 64, 190, 3, '#ffffff'); glow(g, x + 64, 190, 22, 'rgb(170,220,255)', 0.8); for (let s2 = 0; s2 < 8; s2++) { const a = s2 * 0.8; lin(g, x + 64, 190, x + 64 + Math.cos(a) * 8, 190 + Math.sin(a) * 6 + 4, '#ffd060', 0.6); } }
        if (k === 'CNC') {
          // CNC tezgâhı: kapalı gövde, camın ardında soğutma sıvısıyla ışıyan iş mili, yanda kumanda ekranı; önde işlenmiş parçalar
          B(g, x + 18, 166, 66, 48, 3, '#c8ccd4'); rect(g, x + 18, 166, 66, 6, '#5a4a9a');
          B(g, x + 24, 176, 38, 26, 2, '#1e2a3a'); glow(g, x + 43, 192, 20, 'rgb(150,220,255)', 0.7);
          rect(g, x + 42, 178, 2, 10, '#c8ccd4'); E(g, x + 43, 194, 7, 2, '#8ad8ff');
          B(g, x + 68, 176, 12, 16, 1, '#2a2e3a'); for (let l = 0; l < 4; l++) rect(g, x + 70, 179 + l * 3, 6 + (l % 2) * 2, 1, '#7cff9a');
          for (let p2 = 0; p2 < 4; p2++) B(g, x + 88 + (p2 % 2) * 7, 206 - Math.floor(p2 / 2) * 6, 6, 6, 1, '#9aa0aa');
        }
        if (k === 'BOYA') { for (let b2 = 0; b2 < 3; b2++) B(g, x + 26 + b2 * 22, 192, 16, 22, 2, ['#3a6ad8', '#d2302a', '#3aa86a'][b2]); }
      }
      // varil ve demir çubuk yığını
      for (const bx of [120, 248]) { B(g, bx, 196, 12, 18, 2, '#4a6a8a'); rect(g, bx, 202, 12, 1, '#2a4a6a'); }
      for (let k = 0; k < 5; k++) rect(g, 370, 208 - k * 2, 40, 1.6, '#7a7a82');
    },
  };

  // v2.0 mekânları (places2.js) aynı küçük parçaları kullanır
  SC.pk = { grad, glow, glowRaw, skyGrad, stars, bulbs, lamp, rain, apartment };
})(window);
