// Bug Avcısı: İstanbul — bölüm mekânları. Her dünyanın 3 bölümü ayrı bir yerde geçer;
// dünyanın ilk çizimi (scenes.js) bir bölümde kullanılır, diğer iki bölüm burada çizilir.
// Katmanlar 512 mantıksal piksel genişliğinde, kenarlardan kesintisiz tekrarlanır; zemin çizgisi y=214.
(function (root) {
  'use strict';
  const A = root.BA_ART, SC = root.BA_SCENE;
  const { lin, rng } = A;
  const { pen, mix, ferry, seagull, cat, galataTower, maidensTower, blueMosque, hagiaSophia, flag, simitCart, tram } = SC;
  const { B, C, E, P, rect, archWin, dome, minaret, hillMosque, bridge, camlicaTower, house, hillsY, hills, hillHouses,
    cloud, glassTower, tree, pine, carpet, mosaicLamp, nazar, column, medusaHead, roofTiles, homeTower, lonelyWindow } = SC.kit;
  const TAU = Math.PI * 2, W = 512, H = 240;
  const PL = SC.PLACES;
  const at = (w, s) => w * 3 + s;

  // ---------- ortak küçük parçalar ----------
  function grad(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }
  function glow(g, x, y, r, col, a) {
    const gl = g.createRadialGradient(x, y, 0, x, y, r);
    gl.addColorStop(0, col.replace(')', `,${a})`).replace('rgb', 'rgba')); gl.addColorStop(1, col.replace(')', ',0)').replace('rgb', 'rgba'));
    g.fillStyle = gl; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
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
  PL[at(0, 1)] = {
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
  PL[at(0, 2)] = {
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

  // ================= 2 KADIKÖY =================
  // 2-2 Balık Pazarı: çarşı sokağı; tentelerin altında balık, turşu ve zeytin tezgâhları, sokağın üstünde ampuller
  PL[at(1, 1)] = {
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
      cat(g, 118, 214, 0.85, '#f0a050', null, 1); E(g, 110, 213, 4, 1.4, '#c8d4e2');
      for (let c = 0; c < 3; c++) B(g, 240 + c * 2, 196 - c * 12, 18, 12, 1, '#b88a52');
    },
  };

  // 2-3 Moda Yokuşu: gün batımında Moda; karşıda tarihi yarımada, iskele, ahşap evler, çınarlar
  PL[at(1, 2)] = {
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
      // çınarlar
      for (const tx of [30, 236]) {
        rect(g, tx - 3, 150, 6, 64, '#5a4a3a');
        for (const [dx, dy, rr] of [[0, -22, 22], [-16, -10, 16], [16, -8, 17], [-6, -38, 15], [10, -34, 14]]) C(g, tx + dx, 150 + dy, rr, '#3a3a5a');
        for (const [dx, dy, rr] of [[-8, -30, 6], [10, -18, 5]]) C(g, tx + dx, 150 + dy, rr, 'rgba(255,170,120,0.25)');
      }
      // sahil: korkuluk, çay bahçesi ampulleri, fenerler, bankta kedi
      for (let x = 60; x < 214; x += 10) rect(g, x, 200, 1.4, 14, '#2a2440');
      rect(g, 60, 199, 154, 2, '#2a2440');
      bulbs(g, 64, 210, 160, 6, '#ffe6a0');
      for (const lx of [62, 212]) lamp(g, lx, 214, 34);
      B(g, 120, 202, 30, 3, 1, '#7a5a3a'); rect(g, 122, 205, 2, 9, '#4a3a2a'); rect(g, 146, 205, 2, 9, '#4a3a2a'); B(g, 120, 192, 30, 3, 1, '#7a5a3a');
      cat(g, 132, 202, 0.7, '#e8e8ec', '#c8f04a', -1);
    },
  };

  // ================= 3 VAPUR =================
  // 3-1 İskele: sabah; saat kuleli iskele binası, yanaşmış vapur, karşıda puslu tarihi yarımada
  PL[at(2, 0)] = {
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

  // 3-3 Kaptan Köşkü: fırtınalı gece; köpüklü dalgalar, uzakta deniz feneri, yağmur, sallanan fener
  PL[at(2, 2)] = {
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
      B(g, 90, 170, 80, 10, 2, '#0e1424'); B(g, 150, 160, 16, 10, 1, '#0e1424');
      for (const lx of [100, 120, 154, 162]) C(g, lx, 166, 1, '#ffd88a');
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

  // ================= 4 KAPALIÇARŞI =================
  // 4-2 Halıcılar: ahşap kirişli loş salon; duvarlarda asılı halılar, yığın yığın katlanmış halılar, çay tepsisi
  const PATS = [['#a8201e', '#f2d48a', '#1e3a6a'], ['#1e3a6a', '#e8c070', '#a8201e'], ['#7a2a4a', '#f4e4c0', '#2a6a5a'], ['#c86a1e', '#2a1a3a', '#f2e0b0'], ['#2a5a4a', '#e8c070', '#7a1e2a']];
  PL[at(3, 1)] = {
    sky: { draw(g, vw, vh) { skyGrad(g, vw, vh, [[0, '#1e0e06'], [0.5, '#3a1e0e'], [1, '#4e2a14']]); } },
    far(g) {
      rect(g, 0, 46, W, 170, '#5a3018');
      for (let i = 0; i < 11; i++) { const x = 4 + i * 47; carpet(g, x, 58, 38, 84 + (i % 3) * 8, PATS[i % PATS.length]); }
      for (let i = 0; i < 16; i++) { const x = 6 + i * 32; carpet(g, x, 160, 26, 40, PATS[(i + 2) % PATS.length]); }
      g.fillStyle = 'rgba(20,8,0,0.35)'; g.fillRect(0, 46, W, 170);
      rect(g, 0, 0, W, 46, '#2e1808');
      for (let x = 0; x < W; x += 32) { rect(g, x, 0, 6, 46, '#3e2210'); rect(g, x, 40, 32, 3, '#4a2a14'); }
      for (let x = 48; x < W; x += 96) { lin(g, x, 43, x, 64, '#c8a060', 0.5); glow(g, x, 72, 30, 'rgb(255,190,110)', 0.4); mosaicLamp(g, x, 72, ['#e2483a', '#3aa0e0', '#f4c531', '#2ab07a'][(x / 96 | 0) % 4]); }
    },
    near(g) {
      pen('rgba(30,12,4,0.6)', 0.5);
      const pile = (x, n, seed) => {
        const r = rng(seed);
        for (let k = 0; k < n; k++) {
          const w = 58 + r() * 14, ox = (r() - 0.5) * 6, y = 214 - (k + 1) * 7, c = PATS[Math.floor(r() * PATS.length)];
          B(g, x + ox, y, w, 7, 2, c[0]); rect(g, x + ox + 2, y + 2.4, w - 4, 1, c[1]); rect(g, x + ox + 4, y + 4.2, w - 8, 0.8, c[2]);
        }
      };
      pile(20, 8, 301); pile(214, 11, 302); pile(420, 6, 303);
      cat(g, 248, 214 - 77, 0.8, '#e8e8ec', null, 1);
      // dik duran rulo halılar
      for (const [x, h, c] of [[110, 70, 0], [124, 82, 2], [138, 64, 4], [330, 76, 1], [344, 88, 3]]) {
        B(g, x, 214 - h, 12, h, 5, PATS[c][0]); for (let y = 214 - h + 6; y < 212; y += 9) rect(g, x + 1, y, 10, 1.4, PATS[c][1]);
        E(g, x + 6, 214 - h + 2, 5.4, 2, mix(PATS[c][0], '#000000', 0.3));
      }
      // alçak tabure ve çay tepsisi
      B(g, 170, 200, 30, 4, 1, '#7a4a28'); rect(g, 173, 204, 3, 10, '#5a341a'); rect(g, 194, 204, 3, 10, '#5a341a');
      E(g, 185, 199, 14, 2.4, '#d8b060');
      for (const tx of [176, 185, 194]) { P(g, [tx - 2, 192, tx + 2, 192, tx + 1.2, 198, tx - 1.2, 198], 'rgba(200,40,20,0.85)'); }
      for (const lx of [80, 290, 470]) { lin(g, lx, 0, lx, 118, '#c8a060', 0.5); glow(g, lx, 126, 20, 'rgb(255,200,120)', 0.5); B(g, lx - 5, 118, 10, 14, 3, '#c89040'); }
    },
  };

  // 4-3 Bedesten: kubbeli taş salon; kubbelerden süzülen ışık, bakır kaplar, eski saatler, gramofon
  PL[at(3, 2)] = {
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
      for (const x of [16, 272]) {
        // raf: bakır kaplar ve eski saat
        B(g, x, 120, 120, 94, 1, '#4a2e18'); rect(g, x + 4, 150, 112, 3, '#6a4426'); rect(g, x + 4, 182, 112, 3, '#6a4426');
        for (let k = 0; k < 5; k++) { const cx = x + 16 + k * 22; E(g, cx, 143, 8, 7, '#c8743a'); E(g, cx - 2, 140, 3, 4, 'rgba(255,220,170,0.4)'); lin(g, cx + 7, 138, cx + 11, 134, '#a85a28', 1); }
        for (let k = 0; k < 4; k++) { const cx = x + 20 + k * 28; B(g, cx - 8, 162, 16, 20, 2, '#3a2a1a'); C(g, cx, 170, 6, '#f4ead0'); lin(g, cx, 170, cx, 166, '#2a2a2a', 0.6); lin(g, cx, 170, cx + 3, 171, '#2a2a2a', 0.6); }
        for (let k = 0; k < 5; k++) { const cx = x + 14 + k * 23; E(g, cx, 206, 9, 6, '#b8a080'); E(g, cx, 202, 7, 2, '#d8c8a8'); }
        for (let k = 0; k < 4; k++) { lin(g, x + 20 + k * 26, 110, x + 20 + k * 26, 100, '#2a1a10', 0.6); C(g, x + 20 + k * 26, 116, 6, '#c8743a'); rect(g, x + 19 + k * 26, 100, 2, 10, '#5a3a20'); }
      }
      // gramofon ve büyük bakır kazan
      B(g, 168, 190, 30, 24, 2, '#5a341a'); C(g, 183, 190, 10, '#2a2020');
      g.fillStyle = '#d8a040'; g.beginPath(); g.moveTo(186, 186); g.quadraticCurveTo(196, 160, 222, 150); g.lineTo(226, 170); g.quadraticCurveTo(204, 172, 190, 190); g.closePath(); g.fill();
      E(g, 236, 196, 22, 18, '#b8642a'); E(g, 236, 180, 22, 5, '#8a4a20'); E(g, 228, 192, 6, 10, 'rgba(255,210,150,0.3)');
      for (const lx of [150, 410]) { lin(g, lx, 0, lx, 64, '#2a1a10', 0.6); glow(g, lx, 72, 26, 'rgb(255,190,110)', 0.45); B(g, lx - 6, 64, 12, 14, 3, '#a86a2a'); }
    },
  };

  // ================= 5 YEREBATAN =================
  // 5-2 Medusa: yeşil ışıkla aydınlanan sütunlar; tabanlarda dev Medusa başları, ziyaretçi yolu
  PL[at(4, 1)] = {
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

  // 5-3 Karanlık Su: neredeyse zifiri; sis, birkaç fener, karanlıkta parlayan gözler
  PL[at(4, 2)] = {
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

  // ================= 6 GALATA =================
  // 6-1 Kamondo Merdivenleri: Bankalar Caddesi'nin taş cepheleri, kıvrılan ünlü merdiven, tepede Galata Kulesi
  PL[at(5, 0)] = {
    sky: { stops: [[0, '#62b2ec'], [0.7, '#cbe7fa'], [1, '#eef8ff']] },
    far(g) {
      cloud(g, 60, 40, 1, 'rgba(255,255,255,0.9)'); cloud(g, 330, 56, 0.8, 'rgba(255,255,255,0.85)');
      galataTower(g, 256, 120, 1.5, { wall: '#d8c8ae', wallD: '#bcac92', roof: '#4e5a70', roofL: '#6a7890', trim: '#a89478', win: '#4a4036' });
      const r = rng(351);
      let x = -10;
      while (x < W) {
        const w = 70 + r() * 30, h = 100 + r() * 30, col = ['#e8dcc4', '#d8c8a8', '#e2d2b8', '#cfc2aa'][Math.floor(r() * 4)];
        if (x > 210 && x < 290) { x = 300; continue; }
        B(g, x, 214 - h, w, h, 0, col);
        rect(g, x - 3, 214 - h, w + 6, 6, mix(col, '#5a4a3a', 0.25));
        P(g, [x + w * 0.3, 214 - h, x + w * 0.7, 214 - h, x + w * 0.5, 214 - h - 12], mix(col, '#5a4a3a', 0.15));
        for (let px = x + 6; px < x + w - 4; px += 12) rect(g, px, 214 - h + 8, 3, h - 8, mix(col, '#ffffff', 0.25));
        for (let fy = 214 - h + 16; fy < 200; fy += 26) for (let wx = x + 10; wx < x + w - 10; wx += 12) archWin(g, wx, fy, 6, 14, '#5a6a80');
        x += w + 3;
      }
    },
    near(g) {
      pen('rgba(40,30,20,0.6)', 0.5);
      // S biçiminde kıvrılan çift kollu merdiven (taş gövde, sanat nouveau korkuluk)
      const cx = 256;
      const flight = (x0, y0, x1, y1) => {
        const n = 10, pts = [];
        for (let k = 0; k <= n; k++) { const t = k / n; pts.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]); }
        g.beginPath(); g.moveTo(x0, 214);
        for (let k = 0; k < n; k++) { g.lineTo(pts[k][0], pts[k][1]); g.lineTo(pts[k + 1][0], pts[k][1]); }
        g.lineTo(x1, y1); g.lineTo(x1, 214); g.closePath(); g.fillStyle = '#e4d8c2'; g.fill(); g.strokeStyle = '#8a7a62'; g.lineWidth = 0.6; g.stroke();
        g.strokeStyle = '#2a2a30'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(x0, y0 - 12); g.lineTo(x1, y1 - 12); g.stroke();
        for (let k = 0; k <= n; k++) { const [px, py] = pts[k]; g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - 12); g.stroke(); g.beginPath(); g.arc(px + (x1 - x0) / n / 2, py - 6 + (y1 - y0) / n / 2, 2.2, 0, TAU); g.stroke(); }
      };
      flight(cx - 120, 214, cx - 10, 168);
      flight(cx + 120, 168, cx + 10, 122);
      B(g, cx - 14, 166, 28, 48, 1, '#d8ccb4'); B(g, cx - 14, 120, 28, 4, 1, '#d8ccb4');
      flight(cx - 10, 168, cx - 10, 168);
      rect(g, cx - 14, 120, 4, 48, '#d8ccb4'); rect(g, cx + 10, 120, 4, 94, '#cfc2a8');
      // fenerler, saksılar, basamakta kedi, kafe masası
      for (const lx of [cx - 128, cx + 130]) lamp(g, lx, 214, 40);
      cat(g, cx - 60, 190, 0.7, '#2a2630', '#f4e04a', 1);
      for (const px of [40, 470]) { B(g, px - 8, 200, 16, 14, 2, '#c87a4a'); for (const [dx, dy] of [[-5, -4], [4, -6], [0, -10]]) C(g, px + dx, 200 + dy, 6, '#4a9a4a'); }
      E(g, 90, 196, 12, 2.4, '#f2f2ee'); rect(g, 89, 196, 2, 18, '#4a4a54'); B(g, 72, 196, 8, 10, 2, '#4a4a54'); B(g, 102, 196, 8, 10, 2, '#4a4a54');
      B(g, 86, 191, 3, 5, 0.6, '#ffffff'); P(g, [93, 191, 96, 191, 95.4, 196, 93.6, 196], 'rgba(200,40,20,0.85)');
    },
  };

  // 6-3 Çatı Arası: kulenin tepesindeki tavan arası; taş duvar, kemerli pencerelerden gece Haliç, kirişler, Hezarfen'in kanatları
  PL[at(5, 2)] = {
    sky: { draw(g, vw, vh) { skyGrad(g, vw, vh, [[0, '#0c0a18'], [1, '#1e1a30']]); } },
    far(g) {
      rect(g, 0, 0, W, 216, '#4a4250');
      for (let y = 0; y < 216; y += 14) for (let x = (y / 14) % 2 ? -16 : 0; x < W; x += 32) { B(g, x + 1, y + 1, 30, 12, 1.5, (x + y) % 3 ? '#544a5a' : '#4e4456'); }
      for (const wx of [60, 230, 400]) {
        g.save(); g.beginPath(); g.moveTo(wx, 170); g.lineTo(wx, 90); g.arc(wx + 30, 90, 30, Math.PI, 0); g.lineTo(wx + 60, 170); g.closePath(); g.clip();
        g.fillStyle = grad(g, 0, 60, 0, 170, [[0, '#0a1036'], [1, '#2a2a6a']]); g.fillRect(wx, 60, 60, 110);
        const r = rng(wx);
        for (let i = 0; i < 20; i++) { g.fillStyle = `rgba(255,255,230,${0.3 + r() * 0.6})`; g.fillRect(wx + r() * 60, 64 + r() * 50, 0.7, 0.7); }
        rect(g, wx, 150, 60, 20, '#141842');
        hillMosque(g, wx + 30, 152, 0.7, { wall: '#2a2e5a', roof: '#2a2e5a', trim: '#ffd27a' });
        for (let i = 0; i < 30; i++) { g.fillStyle = ['#ffd27a', '#fff0c0'][i % 2]; g.fillRect(wx + r() * 60, 152 + r() * 16, 0.8, 0.8); }
        g.fillStyle = 'rgba(255,214,122,0.25)'; for (let i = 0; i < 6; i++) g.fillRect(wx + r() * 60, 160 + r() * 10, 3, 0.5);
        g.restore();
        g.strokeStyle = '#5a3a24'; g.lineWidth = 4; g.beginPath(); g.moveTo(wx, 170); g.lineTo(wx, 90); g.arc(wx + 30, 90, 30, Math.PI, 0); g.lineTo(wx + 60, 170); g.stroke();
        rect(g, wx + 28.5, 62, 3, 108, '#5a3a24'); rect(g, wx, 118, 60, 3, '#5a3a24'); rect(g, wx - 6, 168, 72, 6, '#6a5a60');
      }
    },
    near(g) {
      pen('rgba(20,10,4,0.65)', 0.5);
      // makas kirişler
      for (let x = 0; x < W; x += 128) {
        P(g, [x, 0, x + 8, 0, x + 72, 64, x + 64, 64], '#6a4428'); P(g, [x + 128, 0, x + 120, 0, x + 56, 64, x + 64, 64], '#6a4428');
        rect(g, x + 60, 0, 8, 214, '#5a3a22'); rect(g, x, 60, 128, 7, '#6a4428');
      }
      // Hezarfen'in kanatları
      const wing = (cx, dir) => {
        g.save(); g.translate(cx, 104); g.scale(dir, 1);
        g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(40, -18, 70, -4); g.quadraticCurveTo(46, 6, 0, 14); g.closePath(); g.fillStyle = '#e8dcc0'; g.fill(); g.strokeStyle = '#6a4a2a'; g.lineWidth = 0.8; g.stroke();
        g.strokeStyle = '#8a6a44'; g.lineWidth = 0.6; for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(0, 6); g.lineTo(k * 12, -6 + k * 0.6); g.stroke(); }
        g.restore();
      };
      wing(300, 1); wing(300, -1); B(g, 294, 98, 12, 20, 3, '#6a4a2a');
      // dürbün, sandıklar, fener
      lin(g, 182, 214, 190, 176, '#4a3a2a', 1.2); lin(g, 198, 214, 190, 176, '#4a3a2a', 1.2); lin(g, 190, 214, 190, 176, '#4a3a2a', 1.2);
      g.save(); g.translate(190, 174); g.rotate(-0.5); B(g, -4, -3, 26, 6, 2, '#c89040'); B(g, 20, -4, 5, 8, 1.4, '#a87020'); g.restore();
      for (const [x, w] of [[400, 40], [446, 30]]) { B(g, x, 214 - w * 0.6, w, w * 0.6, 3, '#7a4a28'); rect(g, x, 214 - w * 0.6 + 5, w, 2, '#c89040'); B(g, x + w / 2 - 3, 214 - w * 0.6 + 8, 6, 5, 1, '#c89040'); }
      lin(g, 110, 67, 110, 92, '#2a1a10', 0.6); glow(g, 110, 100, 30, 'rgb(255,190,110)', 0.5); B(g, 104, 92, 12, 15, 3, '#a86a2a');
    },
  };

  // ================= 7 KÖPRÜ =================
  // 7-2 Halatlar: köprünün taşıyıcı halatlarında, bulut hizasında; aşağıda uzak Boğaz, karşıda öbür kule
  PL[at(6, 1)] = {
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
  PL[at(6, 2)] = {
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

  // ================= 8 ÇATILAR =================
  // 8-2 Antenler: şafak öncesi mavi saat; anten ormanı, çanak antenler, su depoları, çamaşır ipleri
  PL[at(7, 1)] = {
    sky: { stops: [[0, '#0a1440'], [0.55, '#2a4a8a'], [0.85, '#6a7ab0'], [1, '#e8a07a']], stars: 40 },
    far(g) {
      const base = hillsY(200, 16, 381);
      hills(g, base, '#1c2a5a');
      hillHouses(g, base, ['#22306a', '#1e2c62'], null, 382, '#ffd27a', 0.4);
      const lit = { wall: '#2a3466', wallD: '#26305e', roof: '#2e3a72', trim: '#f4d48a', win: '#ffd27a', lit: '#ffd27a', alem: '#f4d48a' };
      hillMosque(g, 120, base(120) + 4, 1, lit); galataTower(g, 400, base(400) + 3, 0.9, { wall: '#2a3466', wallD: '#26305e', roof: '#2e3a72', trim: '#f4d48a', lit: '#ffd27a' });
    },
    near(g) {
      pen('rgba(0,0,20,0.7)', 0.5);
      const r = rng(383);
      let x = -4;
      while (x < W - 8) {
        const w = 60 + r() * 30, h = 18 + r() * 26;
        B(g, x, 214 - h, w, h + 30, 0, '#2a3058'); rect(g, x - 2, 214 - h - 3, w + 4, 4, '#3a4070');
        for (let wy = 214 - h + 8; wy < 210; wy += 10) for (let wx = x + 5; wx < x + w - 6; wx += 10) B(g, wx, wy, 4, 5.4, 0.4, r() < 0.4 ? '#ffd27a' : '#1a1e40');
        // balık kılçığı antenler
        for (let k = 0; k < 2 + Math.floor(r() * 3); k++) {
          const ax = x + 6 + r() * (w - 12), ah = 18 + r() * 24, top = 214 - h - ah;
          lin(g, ax, 214 - h, ax, top, '#8a90b0', 0.7);
          for (let j = 0; j < 4; j++) { const ww = 9 - j * 1.6; lin(g, ax - ww / 2, top + 3 + j * 4, ax + ww / 2, top + 3 + j * 4, '#8a90b0', 0.6); }
        }
        if (r() < 0.6) { const dx = x + w * 0.7; g.fillStyle = '#c8cce0'; g.beginPath(); g.ellipse(dx, 214 - h - 8, 6, 7, -0.5, 0, TAU); g.fill(); lin(g, dx, 214 - h - 8, dx + 5, 214 - h - 12, '#5a6080', 0.6); rect(g, dx - 1, 214 - h - 3, 2, 3, '#5a6080'); }
        if (r() < 0.5) { const tx = x + w * 0.3; B(g, tx - 7, 214 - h - 16, 14, 11, 3, '#8a96b8'); lin(g, tx - 5, 214 - h - 5, tx - 5, 214 - h, '#5a6080', 0.8); lin(g, tx + 5, 214 - h - 5, tx + 5, 214 - h, '#5a6080', 0.8); }
        if (r() < 0.45) {
          const lx0 = x + 6, lx1 = x + w - 6, ly = 214 - h - 14;
          lin(g, lx0, 214 - h, lx0, ly, '#5a6080', 0.6); lin(g, lx1, 214 - h, lx1, ly, '#5a6080', 0.6);
          g.strokeStyle = '#8a90b0'; g.lineWidth = 0.4; g.beginPath(); g.moveTo(lx0, ly); g.quadraticCurveTo((lx0 + lx1) / 2, ly + 5, lx1, ly); g.stroke();
          for (let k = 0; k < 4; k++) { const cx = lx0 + 8 + k * (lx1 - lx0 - 16) / 3; B(g, cx - 3, ly + 2.4 + Math.sin(k) * 1.4, 6, 7, 0.6, ['#ff8a8a', '#ffffff', '#8ab8ff', '#f4d04a'][k]); }
        }
        if (r() < 0.3) cat(g, x + w * 0.5, 214 - h, 0.7, '#141022', '#c8f04a', r() < 0.5 ? 1 : -1);
        x += w + 6;
      }
    },
  };

  // 8-3 Saat Kulesi: kulenin içi; arkadan ışıyan saat kadranı, dev pirinç çarklar, çan ve halatlar
  function gear(g, cx, cy, r, teeth, col, ang) {
    g.beginPath();
    for (let i = 0; i < teeth * 2; i++) { const a = (ang || 0) + i * Math.PI / teeth, d = i % 2 ? r : r * 0.84; g.lineTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d); }
    g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = 'rgba(40,20,0,0.6)'; g.lineWidth = 0.6; g.stroke();
    C(g, cx, cy, r * 0.62, mix(col, '#000000', 0.25)); C(g, cx, cy, r * 0.5, col);
    for (let k = 0; k < 4; k++) { const a = (ang || 0) + k * Math.PI / 2; lin(g, cx, cy, cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5, mix(col, '#000000', 0.25), r * 0.12); }
    C(g, cx, cy, r * 0.12, '#3a2a1a');
  }
  PL[at(7, 2)] = {
    sky: { draw(g, vw, vh) { skyGrad(g, vw, vh, [[0, '#120a04'], [0.6, '#24160a'], [1, '#2e1e0e']]); } },
    far(g) {
      rect(g, 0, 0, W, 216, '#3a2818');
      for (let x = 0; x < W; x += 24) rect(g, x, 0, 1, 216, '#2e1f12');
      for (const cx of [128, 384]) {
        // arkadan ışıyan kadran (içeriden bakıldığı için sayılar yerine çentikler)
        glow(g, cx, 110, 90, 'rgb(255,230,170)', 0.35);
        C(g, cx, 110, 62, '#f4e6c0'); C(g, cx, 110, 56, '#fff4d8');
        for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; lin(g, cx + Math.cos(a) * 46, 110 + Math.sin(a) * 46, cx + Math.cos(a) * 54, 110 + Math.sin(a) * 54, '#3a2a1a', k % 3 ? 1.4 : 3); }
        lin(g, cx, 110, cx - 24, 96, '#2a1a0a', 3); lin(g, cx, 110, cx + 6, 66, '#2a1a0a', 2); C(g, cx, 110, 4, '#2a1a0a');
        rect(g, cx - 1.5, 48, 3, 124, 'rgba(60,40,20,0.35)'); rect(g, cx - 62, 108.5, 124, 3, 'rgba(60,40,20,0.35)');
      }
      gear(g, 256, 60, 34, 16, '#8a6a34', 0.1); gear(g, 300, 98, 20, 10, '#7a5a2a', 0.3); gear(g, 30, 180, 40, 18, '#7a5a2a', 0); gear(g, 500, 170, 30, 14, '#8a6a34', 0.2);
    },
    near(g) {
      pen('rgba(20,10,0,0.65)', 0.5);
      gear(g, 90, 150, 46, 20, '#c89848', 0.15); gear(g, 156, 118, 26, 12, '#b8883a', 0.4); gear(g, 410, 160, 54, 22, '#c89848', 0.05);
      // çan, halat ve sarkaç
      g.fillStyle = '#b8883a'; g.beginPath(); g.moveTo(258, 18); g.quadraticCurveTo(240, 22, 238, 54); g.lineTo(234, 60); g.lineTo(282, 60); g.lineTo(278, 54); g.quadraticCurveTo(276, 22, 258, 18); g.closePath(); g.fill(); g.strokeStyle = '#5a3a14'; g.lineWidth = 0.7; g.stroke();
      C(g, 258, 62, 4, '#7a5a2a'); rect(g, 254, 0, 8, 18, '#5a3a20');
      g.strokeStyle = '#c8a878'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(262, 60); g.quadraticCurveTo(270, 140, 266, 214); g.stroke();
      lin(g, 330, 0, 340, 150, '#8a6a34', 1.4); C(g, 340, 156, 9, '#c89848'); C(g, 337, 153, 3, 'rgba(255,240,200,0.5)');
      for (const x of [0, 200, 470]) rect(g, x, 0, 12, 214, '#4a3018');
      rect(g, 0, 40, W, 8, '#4a3018');
    },
  };

  // ================= 9 ÇAMLICA =================
  // 9-2 Asansör: kulenin cam asansör boşluğu; çelik kafes, aşağıda gece şehri ve ışıklı köprüler
  PL[at(8, 1)] = {
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

  // 9-3 Yayın Odası: kulenin yayın odası; ekran duvarı (biri mavi ekran), kumanda masaları, YAYINDA lambası
  PL[at(8, 2)] = {
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
        else if (k === 3) { rect(g, sx, sy, sw, sh, '#2a3a5a'); C(g, sx + sw / 2, sy + sh / 2, 7, '#8ab0e0'); hillMosque(g, sx + sw / 2, sy + sh - 2, 0.35, { wall: '#4a5a80', roof: '#4a5a80', trim: '#ffe28a' }); }
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
})(window);
