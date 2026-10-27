// Bug Avcısı: İstanbul — çizimler: sprite önbelleği, dünya karoları, arka planlar, patronlar.
(function (root) {
  'use strict';
  const PIX = root.BA_PIX;
  const TS = 16;

  function mk(w, h, fn) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    fn(g, w, h);
    return c;
  }
  const R = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x | 0, y | 0, w | 0, h | 0); };
  function disc(g, cx, cy, r, col) {
    g.fillStyle = col;
    for (let y = -r; y <= r; y++) {
      const w = Math.floor(Math.sqrt(r * r - y * y) + 0.35);
      g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
    }
  }
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  // ---------------- sprite önbelleği ----------------
  const cache = new Map();
  function fromRows(rows, pal, scale) {
    scale = scale || 1;
    const w = rows[0].length, h = rows.length;
    return mk(w * scale, h * scale, (g) => {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const ch = rows[y][x];
        if (ch === '.' || !pal[ch]) continue;
        R(g, x * scale, y * scale, scale, scale, pal[ch]);
      }
    });
  }
  function flipped(c) {
    return mk(c.width, c.height, (g) => { g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); });
  }
  // Kostüm renkleri: 0 küçük/normal, 1 çaylı (aynı), 2 laptoplu (siyah kapüşonlu + yeşil)
  const SKINS = {
    normal: {},
    hacker: { c: '#2a2a36', C: '#16161e', y: '#7cff6a', Y: '#3fae2c', W: '#7cff6a' },
    star0: { c: '#f4c531', C: '#b88a12', j: '#e2483a', J: '#9c2a20', h: '#ffffff', H: '#d8d8d8' },
    star1: { c: '#e2483a', C: '#9c2a20', j: '#f4c531', J: '#b88a12', h: '#f08a24' },
    star2: { c: '#9a4fd0', C: '#5e2c88', j: '#3ae0ff', J: '#1a8ab0' },
  };
  function sprite(name, skin, flip, scale, extraPal) {
    const key = name + '|' + (skin || '') + '|' + (flip ? 1 : 0) + '|' + (scale || 1) + '|' + (extraPal ? JSON.stringify(extraPal) : '');
    let c = cache.get(key);
    if (!c) {
      const pal = Object.assign({}, PIX.PAL, SKINS[skin] || {}, extraPal || {});
      c = fromRows(PIX.S[name], pal, scale);
      if (flip) c = flipped(c);
      cache.set(key, c);
    }
    return c;
  }

  // ---------------- dünyalar ----------------
  // her dünya: gökyüzü, zemin, blok, ince platform renkleri ve su olup olmadığı
  const WORLD = [
    { key: 'maslak', sky: ['#7cc4f2', '#d4effc'], water: false,
      g: ['#d4d7de', '#a7adb8', '#868c99', '#5d6575'], s: 'glass', plat: ['#9aa6b8', '#5d6575'] },
    { key: 'kadikoy', sky: ['#f2a970', '#fde2b8'], water: '#2a6a8a',
      g: ['#cfc4ae', '#97897a', '#7a6e60', '#4e463e'], s: 'crate', plat: ['#b98a52', '#6e4a24'] },
    { key: 'vapur', sky: ['#69bff0', '#c9ecff'], water: '#1f6fa0',
      g: ['#f1f1ea', '#b9824e', '#8e5e32', '#5a3a1e'], s: 'hull', plat: ['#f1f1ea', '#8a96a8'] },
    { key: 'carsi', sky: ['#3a2216', '#6a3e24'], water: false,
      g: ['#e6caa0', '#c8a878', '#a8885a', '#6e5434'], s: 'iznik', plat: ['#c8a878', '#6e5434'] },
    { key: 'sarnic', sky: ['#081014', '#16242a'], water: '#0f3a40',
      g: ['#6a737e', '#454c56', '#353b44', '#20252c'], s: 'brick', plat: ['#6a5a50', '#3a302a'] },
    { key: 'galata', sky: ['#e86a58', '#ffc98a'], water: false,
      g: ['#b8a890', '#8a7c68', '#6e6252', '#463e34'], s: 'stone', plat: ['#8a6a4a', '#4e3a26'] },
    { key: 'kopru', sky: ['#4a3274', '#f08a6a'], water: '#1a3060',
      g: ['#8a909c', '#4a4e58', '#3a3e48', '#22252c'], s: 'girder', plat: ['#d0603a', '#7a2e18'] },
    { key: 'catilar', sky: ['#0b1030', '#2a2c60'], water: false,
      g: ['#e07a50', '#b5583a', '#8a3e28', '#5a2414'], s: 'chimney', plat: ['#7a5a3a', '#3e2a18'] },
    { key: 'camlica', sky: ['#05060f', '#1a1440'], water: false,
      g: ['#3ae0ff', '#5a6270', '#3e4450', '#22262e'], s: 'tech', plat: ['#5a6270', '#3ae0ff'] },
  ];

  function solidTile(w, cracked) {
    const W = WORLD[w];
    return mk(16, 16, (g) => {
      const r = rng(w * 31 + (cracked ? 7 : 1));
      switch (W.s) {
        case 'glass':
          R(g, 0, 0, 16, 16, '#2f4f6e'); R(g, 1, 1, 14, 14, '#5fa8d8'); R(g, 1, 1, 14, 1, '#bfe6ff'); R(g, 1, 1, 1, 14, '#9ad4f4');
          R(g, 3, 3, 2, 6, '#d8f2ff'); R(g, 5, 3, 1, 3, '#d8f2ff'); R(g, 8, 1, 1, 14, '#4a88b8'); R(g, 1, 8, 14, 1, '#4a88b8');
          R(g, 1, 15, 15, 1, '#1e3650'); R(g, 15, 1, 1, 15, '#1e3650');
          break;
        case 'crate':
          R(g, 0, 0, 16, 16, '#5a3814'); R(g, 1, 1, 14, 14, '#c08a4a');
          for (const y of [1, 6, 11]) { R(g, 1, y, 14, 4, '#cf9a58'); R(g, 1, y + 4, 14, 1, '#8a5a2a'); }
          R(g, 2, 2, 1, 12, '#8a5a2a'); R(g, 13, 2, 1, 12, '#8a5a2a');
          R(g, 3, 3, 1, 1, '#5a3814'); R(g, 12, 3, 1, 1, '#5a3814'); R(g, 3, 12, 1, 1, '#5a3814'); R(g, 12, 12, 1, 1, '#5a3814');
          break;
        case 'hull':
          R(g, 0, 0, 16, 16, '#5a6270'); R(g, 1, 1, 14, 14, '#e8eef2'); R(g, 1, 1, 14, 1, '#ffffff');
          R(g, 1, 12, 14, 3, '#c83a2e'); R(g, 1, 11, 14, 1, '#f1f1ea');
          disc(g, 8, 6, 3, '#5a6270'); disc(g, 8, 6, 2, '#2a4a6a'); R(g, 7, 5, 1, 1, '#9ad4f4');
          for (const x of [2, 13]) R(g, x, 2, 1, 1, '#9aa3b2');
          break;
        case 'iznik':
          R(g, 0, 0, 16, 16, '#1a3a6a'); R(g, 1, 1, 14, 14, '#f4f0e6');
          R(g, 1, 1, 14, 1, '#2f6fb0'); R(g, 1, 14, 14, 1, '#2f6fb0'); R(g, 1, 1, 1, 14, '#2f6fb0'); R(g, 14, 1, 1, 14, '#2f6fb0');
          // lale/çiçek deseni
          R(g, 7, 3, 2, 10, '#2a8a6a'); disc(g, 7.5, 6, 2, '#c8302a'); R(g, 6, 4, 1, 2, '#c8302a'); R(g, 9, 4, 1, 2, '#c8302a');
          R(g, 4, 9, 3, 2, '#2f6fb0'); R(g, 9, 9, 3, 2, '#2f6fb0'); R(g, 3, 3, 1, 1, '#3aa0c8'); R(g, 12, 3, 1, 1, '#3aa0c8'); R(g, 3, 12, 1, 1, '#3aa0c8'); R(g, 12, 12, 1, 1, '#3aa0c8');
          break;
        case 'brick':
          R(g, 0, 0, 16, 16, '#2a2220');
          for (let y = 0; y < 16; y += 4) for (let x = (y % 8 ? -4 : 0); x < 16; x += 8) { R(g, x + 1, y + 1, 7, 2, r() < 0.5 ? '#6a5a50' : '#7a6658'); R(g, x + 1, y + 1, 7, 1, '#8a7464'); }
          break;
        case 'stone':
          R(g, 0, 0, 16, 16, '#5a4e40');
          R(g, 1, 1, 8, 6, '#b8a88e'); R(g, 10, 1, 5, 6, '#a8987e'); R(g, 1, 8, 5, 7, '#a8987e'); R(g, 7, 8, 8, 7, '#b8a88e');
          R(g, 1, 1, 8, 1, '#d4c4a8'); R(g, 7, 8, 8, 1, '#d4c4a8'); R(g, 10, 1, 5, 1, '#c8b89c'); R(g, 1, 8, 5, 1, '#c8b89c');
          break;
        case 'girder':
          R(g, 0, 0, 16, 16, '#5a1e10'); R(g, 1, 1, 14, 14, '#c8502e'); R(g, 1, 1, 14, 2, '#e8784e'); R(g, 1, 13, 14, 2, '#8a3218');
          for (let i = 0; i < 12; i++) { R(g, 2 + i, 3 + i * 0.83, 2, 2, '#9a3a1e'); R(g, 13 - i, 3 + i * 0.83, 1, 1, '#a8442a'); }
          for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) R(g, x, y, 1, 1, '#ffb090');
          break;
        case 'chimney':
          R(g, 0, 0, 16, 16, '#3a1e16');
          for (let y = 0; y < 16; y += 4) for (let x = (y % 8 ? -4 : 0); x < 16; x += 8) { R(g, x + 1, y + 1, 7, 3, r() < 0.5 ? '#8a4a3a' : '#9a5442'); R(g, x + 1, y + 1, 7, 1, '#b06a54'); }
          break;
        case 'tech':
          R(g, 0, 0, 16, 16, '#11141c'); R(g, 1, 1, 14, 14, '#2a3040'); R(g, 1, 1, 14, 1, '#4a5468');
          R(g, 3, 4, 7, 1, '#3ae0ff'); R(g, 9, 4, 1, 5, '#3ae0ff'); R(g, 9, 8, 4, 1, '#3ae0ff'); R(g, 3, 11, 4, 1, '#1a8ab0'); R(g, 3, 9, 1, 3, '#1a8ab0');
          R(g, 12, 7, 2, 2, '#7cff6a'); R(g, 3, 3, 2, 2, '#1a8ab0');
          break;
      }
      if (cracked) {
        const c = 'rgba(10,6,4,0.85)';
        const pts = [[8, 0], [7, 3], [9, 5], [6, 8], [8, 10], [5, 13], [6, 16]];
        for (let i = 0; i < pts.length - 1; i++) {
          const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
          const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
          for (let k = 0; k <= n; k++) R(g, Math.round(x0 + (x1 - x0) * k / n), Math.round(y0 + (y1 - y0) * k / n), 1, 1, c);
        }
        R(g, 9, 5, 3, 1, c); R(g, 11, 6, 2, 1, c); R(g, 6, 8, -3, 1, c); R(g, 3, 9, 2, 1, c);
      }
    });
  }

  function groundTiles(w) {
    const W = WORLD[w], [top, mid, dark, line] = W.g;
    const r = rng(100 + w);
    const fill = mk(16, 16, (g) => {
      R(g, 0, 0, 16, 16, mid);
      switch (W.key) {
        case 'kadikoy': case 'galata':
          for (let y = 0; y < 16; y += 5) for (let x = (y % 10 ? -3 : 0); x < 16; x += 6) {
            R(g, x + 1, y + 1, 5, 4, r() < 0.5 ? mid : dark); R(g, x + 2, y + 1, 3, 1, top);
          }
          break;
        case 'vapur':
          R(g, 0, 0, 16, 16, mid); for (let y = 0; y < 16; y += 4) { R(g, 0, y + 3, 16, 1, dark); R(g, (y * 3) % 16, y, 1, 3, dark); }
          break;
        case 'catilar':
          R(g, 0, 0, 16, 16, mid); for (let y = 0; y < 16; y += 4) for (let x = (y % 8 ? 4 : 0); x < 16; x += 8) { disc(g, x + 4, y + 2, 3, dark); disc(g, x + 4, y + 1, 3, mid); R(g, x + 2, y, 4, 1, top); }
          break;
        case 'camlica':
          R(g, 0, 0, 16, 16, dark); for (let i = 0; i < 16; i += 4) { R(g, i, 0, 1, 16, line); R(g, 0, i, 16, 1, line); }
          break;
        case 'sarnic':
          R(g, 0, 0, 16, 16, mid); R(g, 0, 7, 16, 1, line); R(g, 7, 0, 1, 7, line); R(g, 13, 8, 1, 8, line); R(g, 2, 2, 2, 1, top); R(g, 9, 10, 3, 1, top);
          break;
        default:
          R(g, 0, 0, 16, 16, mid); R(g, 0, 15, 16, 1, line); R(g, 15, 0, 1, 16, line); R(g, 0, 0, 16, 1, top); R(g, 0, 0, 1, 16, top);
          R(g, 4, 5, 1, 1, dark); R(g, 10, 9, 1, 1, dark); R(g, 6, 12, 1, 1, dark);
      }
    });
    const surf = mk(16, 16, (g) => {
      g.drawImage(fill, 0, 0);
      switch (W.key) {
        case 'maslak': R(g, 0, 0, 16, 3, top); R(g, 0, 3, 16, 1, line); R(g, 0, 0, 16, 1, '#f2f4f8'); break;
        case 'kadikoy': case 'galata': R(g, 0, 0, 16, 3, top); R(g, 0, 3, 16, 1, line); R(g, 0, 0, 16, 1, '#e8e0d0'); break;
        case 'vapur': R(g, 0, 0, 16, 2, '#ffffff'); R(g, 0, 2, 16, 1, '#5a3a1e'); R(g, 0, 3, 16, 2, '#c83a2e'); R(g, 0, 5, 16, 1, '#7a1e16'); break;
        case 'carsi': R(g, 0, 0, 16, 2, top); R(g, 0, 2, 16, 1, line); for (let x = 0; x < 16; x += 4) R(g, x + 1, 4, 2, 2, '#2f6fb0'); break;
        case 'sarnic': R(g, 0, 0, 16, 2, top); R(g, 0, 2, 16, 1, line); R(g, 3, 0, 4, 1, '#9ab8c8'); R(g, 11, 0, 3, 1, '#9ab8c8'); break;
        case 'kopru': R(g, 0, 0, 16, 2, '#9aa0ac'); R(g, 0, 2, 16, 1, '#22252c'); R(g, 2, 6, 6, 2, '#f2d24a'); break;
        case 'catilar': R(g, 0, 0, 16, 2, '#6a3a26'); R(g, 0, 0, 16, 1, '#8a5a3e'); break;
        case 'camlica': R(g, 0, 0, 16, 2, '#3ae0ff'); R(g, 0, 2, 16, 1, '#1a8ab0'); R(g, 0, 3, 16, 1, '#5a6270'); break;
      }
    });
    return { fill, surf };
  }

  const BLOCK = [0, 1].map((f) => mk(16, 16, (g) => {
    R(g, 0, 0, 16, 16, '#3a3e48'); R(g, 1, 1, 14, 14, '#c9ccd4'); R(g, 1, 1, 14, 1, '#f2f4f8'); R(g, 1, 14, 14, 1, '#8a909c');
    R(g, 2, 2, 12, 10, '#0e1e16'); R(g, 2, 2, 12, 1, '#1e3a2a');
    // ">" ve imleç
    const c = '#7cff6a';
    R(g, 4, 4, 1, 1, c); R(g, 5, 5, 1, 1, c); R(g, 6, 6, 1, 1, c); R(g, 5, 7, 1, 1, c); R(g, 4, 8, 1, 1, c);
    if (f === 0) R(g, 8, 9, 4, 1, c);
    R(g, 6, 13, 4, 1, '#5d6575');
  }));
  const USED = mk(16, 16, (g) => {
    R(g, 0, 0, 16, 16, '#2a2e36'); R(g, 1, 1, 14, 14, '#7a7f8a'); R(g, 1, 1, 14, 1, '#9aa0ab');
    R(g, 2, 2, 12, 10, '#22262e'); R(g, 3, 3, 3, 1, '#3a3e48');
    R(g, 6, 13, 4, 1, '#4a4e58');
  });
  const SPIKE = mk(16, 16, (g) => {
    R(g, 0, 13, 16, 3, '#3a3e48'); R(g, 0, 13, 16, 1, '#6a707c');
    for (let i = 0; i < 4; i++) {
      const cx = i * 4 + 2;
      for (let k = 0; k < 6; k++) { const hw = k >> 1; R(g, cx - hw, 7 + k, hw * 2 + 1, 1, k < 2 ? '#e8ecf2' : '#a7adb8'); }
      R(g, cx, 5, 1, 2, '#f4c531'); R(g, cx - 1, 4, 1, 1, '#fff27a'); R(g, cx + 1, 3, 1, 1, '#fff27a');
    }
  });
  const ANCHOR = mk(16, 16, (g) => {
    R(g, 0, 0, 16, 16, '#22262e'); R(g, 1, 1, 14, 14, '#4a5468'); R(g, 1, 1, 14, 1, '#6a7488');
    disc(g, 8, 8, 4, '#3ae0ff'); disc(g, 8, 8, 2, '#11141c'); R(g, 11, 4, 2, 2, '#3ae0ff');
  });
  const CHECK = [0, 1].map((on) => mk(16, 32, (g) => {
    R(g, 7, 6, 2, 25, '#5d6575'); R(g, 7, 6, 1, 25, '#9aa3b2'); R(g, 4, 30, 8, 2, '#3a3e48');
    disc(g, 8, 6, 5, '#18141e'); disc(g, 8, 6, 4, on ? '#7cff6a' : '#9aa3b2'); disc(g, 8, 6, 2, on ? '#3fae2c' : '#5d6575');
    if (on) { R(g, 6, 6, 1, 1, '#fff'); R(g, 7, 7, 1, 1, '#fff'); R(g, 8, 6, 1, 1, '#fff'); R(g, 9, 5, 1, 1, '#fff'); R(g, 10, 4, 1, 1, '#fff'); }
  }));

  function onewayTile(w) {
    const [a, b] = WORLD[w].plat;
    return mk(16, 16, (g) => {
      R(g, 0, 0, 16, 5, b); R(g, 0, 0, 16, 4, a); R(g, 0, 0, 16, 1, '#ffffff33');
      R(g, 2, 5, 2, 3, b); R(g, 12, 5, 2, 3, b);
    });
  }
  const LIFT = mk(48, 8, (g) => {
    R(g, 0, 0, 48, 8, '#22262e'); R(g, 1, 1, 46, 5, '#8a96a8'); R(g, 1, 1, 46, 1, '#c9ccd4');
    for (let x = 0; x < 46; x += 6) { R(g, x + 1, 6, 3, 1, '#f4c531'); R(g, x + 4, 6, 3, 1, '#18141e'); }
  });

  const tilesets = [];
  function tiles(w) {
    if (!tilesets[w]) {
      const gr = groundTiles(w);
      tilesets[w] = { surf: gr.surf, fill: gr.fill, solid: solidTile(w, false), crack: solidTile(w, true), oneway: onewayTile(w), block: BLOCK, used: USED, spike: SPIKE, anchor: ANCHOR, check: CHECK, lift: LIFT };
    }
    return tilesets[w];
  }

  // ---------------- arka planlar ----------------
  // her dünya için iki katman: uzak (yavaş) ve yakın (orta hız). 512 piksel genişliğinde, yatayda tekrarlar.
  const BGW = 512;
  function dome(g, cx, base, r, col) { // kubbe
    for (let y = 0; y <= r; y++) { const w = Math.round(Math.sqrt(r * r - y * y)); R(g, cx - w, base - y, w * 2, 1, col); }
  }
  function minaret(g, x, base, h, col, tip) {
    R(g, x, base - h, 3, h, col); R(g, x - 1, base - h * 0.7, 5, 2, col); R(g, x + 1, base - h - 6, 1, 6, tip || col);
  }
  function mosque(g, cx, base, s, col) {
    R(g, cx - 18 * s, base - 10 * s, 36 * s, 10 * s, col);
    dome(g, cx, base - 10 * s, 11 * s, col);
    dome(g, cx - 13 * s, base - 8 * s, 5 * s, col); dome(g, cx + 13 * s, base - 8 * s, 5 * s, col);
    R(g, cx, base - 21 * s - 4, 1, 4, col);
    minaret(g, cx - 24 * s, base, 34 * s, col); minaret(g, cx + 22 * s, base, 34 * s, col);
  }
  function skyline(g, r, base, col, hmin, hmax, wmin, wmax, windows) {
    let x = -8;
    while (x < BGW + 8) {
      const w = wmin + Math.floor(r() * (wmax - wmin)), h = hmin + Math.floor(r() * (hmax - hmin));
      R(g, x, base - h, w, h + 40, col);
      if (windows) for (let y = base - h + 4; y < base - 4; y += 6) for (let xx = x + 3; xx < x + w - 3; xx += 5) if (r() < windows[2]) R(g, xx, y, 2, 3, r() < 0.5 ? windows[0] : windows[1]);
      x += w + Math.floor(r() * 4);
    }
  }
  const bgs = [];
  function background(w) {
    if (bgs[w]) return bgs[w];
    const W = WORLD[w], r = rng(500 + w);
    let far, near;
    switch (W.key) {
      case 'maslak':
        far = mk(BGW, 240, (g) => {
          skyline(g, r, 190, '#a9c8de', 40, 110, 18, 40, null);
          for (let i = 0; i < 6; i++) { const x = r() * BGW; R(g, x, 90 + r() * 30, 2, 100, '#b8d4e6'); }
        });
        near = mk(BGW, 240, (g) => {
          let x = 0;
          while (x < BGW) {
            const wd = 34 + Math.floor(r() * 30), h = 90 + Math.floor(r() * 90);
            const base = 210;
            R(g, x, base - h, wd, h + 30, '#4f86b0'); R(g, x, base - h, 2, h + 30, '#7cb0d6'); R(g, x + wd - 2, base - h, 2, h + 30, '#3a6a90');
            for (let y = base - h + 5; y < base; y += 7) for (let xx = x + 4; xx < x + wd - 4; xx += 6) R(g, xx, y, 4, 4, r() < 0.15 ? '#e8f6ff' : '#6aa0c8');
            if (r() < 0.4) { R(g, x + wd / 2 - 1, base - h - 14, 2, 14, '#3a6a90'); R(g, x + wd / 2 - 1, base - h - 15, 2, 1, '#f04a3a'); }
            x += wd + 6 + Math.floor(r() * 18);
          }
          R(g, 0, 206, BGW, 34, '#7a8a9a');
          for (let x2 = 0; x2 < BGW; x2 += 40) { R(g, x2 + 10, 186, 2, 20, '#5d6575'); R(g, x2 + 6, 184, 10, 3, '#5d6575'); R(g, x2 + 7, 187, 8, 1, '#f4f0b0'); }
        });
        break;
      case 'kadikoy':
        far = mk(BGW, 240, (g) => {
          R(g, 0, 170, BGW, 70, '#c9906a');
          for (let x = 0; x < BGW; x += 128) mosque(g, x + 60, 172, 0.8, '#b97e5c');
          skyline(g, r, 175, '#c48a64', 10, 40, 14, 30, null);
        });
        near = mk(BGW, 240, (g) => {
          const facades = ['#e8b4a0', '#f2d78a', '#a8d0b8', '#f0c8c8', '#c8d4ea', '#e8c098'];
          let x = 0;
          while (x < BGW) {
            const wd = 44 + Math.floor(r() * 20), h = 100 + Math.floor(r() * 50), col = facades[Math.floor(r() * facades.length)];
            const base = 212;
            R(g, x, base - h, wd, h + 30, col); R(g, x - 2, base - h - 4, wd + 4, 4, '#8a5a4a');
            for (let y = base - h + 8; y < base - 18; y += 22) {
              for (let xx = x + 6; xx < x + wd - 10; xx += 14) { R(g, xx, y, 8, 12, '#4a5a6e'); R(g, xx, y, 8, 1, '#ffffff'); R(g, xx + 3, y, 1, 12, col); }
            }
            // cumba (çıkma)
            R(g, x + wd / 2 - 9, base - h + 30, 18, 40, col); R(g, x + wd / 2 - 9, base - h + 30, 18, 2, '#8a5a4a');
            R(g, x + wd / 2 - 6, base - h + 36, 12, 10, '#4a5a6e');
            // tente
            R(g, x + 4, base - 22, wd - 8, 5, r() < 0.5 ? '#c8302a' : '#2f8a6a'); for (let k = x + 4; k < x + wd - 4; k += 4) R(g, k, base - 17, 2, 2, '#ffffff');
            x += wd + 2;
          }
          R(g, 0, 210, BGW, 30, '#8d8170');
          for (let k = 0; k < BGW; k += 64) { R(g, k, 120, 1, 92, '#3a3a3a'); }
          R(g, 0, 122, BGW, 1, '#3a3a3a');
        });
        break;
      case 'vapur':
        far = mk(BGW, 240, (g) => {
          const col = '#7aa6c4';
          for (let x = 0; x < BGW; x += 256) { mosque(g, x + 70, 152, 1, col); mosque(g, x + 190, 152, 0.7, col); }
          skyline(g, r, 152, col, 6, 26, 10, 26, null);
          R(g, 0, 152, BGW, 88, '#3a8ac0');
          R(g, 0, 152, BGW, 2, '#a8d4ee');
          for (let i = 0; i < 40; i++) R(g, r() * BGW, 160 + r() * 70, 6 + r() * 10, 1, '#5aa6d8');
        });
        near = mk(BGW, 240, (g) => {
          // uzaktan geçen başka bir vapur (küçük ve soluk)
          R(g, 130, 140, 44, 5, '#c8dcea'); R(g, 136, 135, 30, 5, '#c8dcea'); R(g, 130, 144, 44, 2, '#b07a7a');
          R(g, 148, 129, 4, 6, '#6a7a8a');
          for (let k = 138; k < 164; k += 5) R(g, k, 137, 2, 2, '#8aa6c0');
          for (let i = 0; i < 14; i++) { const x = r() * BGW, y = 40 + r() * 70; R(g, x, y, 3, 1, '#ffffff'); R(g, x - 2, y - 1, 2, 1, '#ffffff'); R(g, x + 3, y - 1, 2, 1, '#ffffff'); }
        });
        break;
      case 'carsi':
        far = mk(BGW, 240, (g) => {
          R(g, 0, 0, BGW, 240, '#4a2c1c');
          for (let x = 0; x < BGW; x += 64) {
            // kemer
            for (let y = 0; y < 60; y++) { const w = Math.round(Math.sqrt(Math.max(0, 28 * 28 - (y - 30) * (y - 30)))); if (y < 30) R(g, x + 32 - w, 60 + y, w * 2, 1, (Math.floor(y / 4) % 2) ? '#e8d8b8' : '#a8402a'); }
            R(g, x + 4, 90, 56, 150, '#2a180e'); R(g, x + 0, 60, 6, 180, '#8a5a3a'); R(g, x + 58, 60, 6, 180, '#8a5a3a');
          }
        });
        near = mk(BGW, 240, (g) => {
          const cols = ['#e2483a', '#3a7be0', '#f4c531', '#7ccf3a', '#9a4fd0', '#f08a24'];
          for (let i = 0; i < 12; i++) {
            const x = 20 + i * 42 + r() * 10, y = 40 + r() * 50;
            R(g, x + 3, 0, 1, y, '#2a180e');
            disc(g, x + 3, y + 6, 6, '#18141e');
            for (let k = 0; k < 18; k++) { const a = r() * 6.28, d = r() * 5; R(g, x + 3 + Math.cos(a) * d, y + 6 + Math.sin(a) * d, 2, 2, cols[Math.floor(r() * cols.length)]); }
            R(g, x + 1, y + 12, 5, 2, '#c8a020');
          }
          R(g, 0, 196, BGW, 44, '#6e4a2a');
          for (let x = 0; x < BGW; x += 32) { R(g, x + 2, 170, 28, 26, '#8a5a3a'); R(g, x + 4, 172, 24, 4, cols[(x / 32) % cols.length]); R(g, x + 6, 180, 6, 10, '#c8a020'); R(g, x + 16, 180, 8, 10, '#e8d8b8'); }
        });
        break;
      case 'sarnic':
        far = mk(BGW, 240, (g) => {
          for (let x = 0; x < BGW; x += 48) {
            R(g, x + 18, 20, 12, 200, '#1e2a30'); R(g, x + 16, 20, 16, 6, '#26343a');
            for (let y = 0; y < 30; y++) { const w = Math.round(Math.sqrt(Math.max(0, 24 * 24 - (y - 24) * (y - 24)))); if (y < 24) { R(g, x + 24 - 24, 20 - y, 24 - w, 1, '#1a2428'); R(g, x + 24 + w, 20 - y, 24 - w, 1, '#1a2428'); } }
          }
        });
        near = mk(BGW, 240, (g) => {
          for (let x = 0; x < BGW; x += 96) {
            R(g, x + 40, 0, 18, 240, '#3a3226'); R(g, x + 40, 0, 4, 240, '#5a4a36'); R(g, x + 54, 0, 4, 240, '#2a2218');
            for (let y = 10; y < 240; y += 20) R(g, x + 40, y, 18, 2, '#2a2218');
            // turuncu ışık
            const gr = g.createRadialGradient(x + 49, 200, 2, x + 49, 200, 40);
            gr.addColorStop(0, 'rgba(255,150,60,0.55)'); gr.addColorStop(1, 'rgba(255,150,60,0)');
            g.fillStyle = gr; g.fillRect(x + 9, 160, 80, 80);
          }
        });
        break;
      case 'galata':
        far = mk(BGW, 240, (g) => {
          R(g, 0, 175, BGW, 65, '#b05a5a');
          skyline(g, r, 180, '#9a4a5a', 20, 60, 12, 26, ['#ffd27a', '#f4a060', 0.12]);
          for (let x = 0; x < BGW; x += 256) mosque(g, x + 200, 176, 0.9, '#8a3e52');
        });
        near = mk(BGW, 240, (g) => {
          // tepe ve kule
          for (let x = 0; x < BGW; x++) { const h = 60 + Math.sin(x / BGW * Math.PI * 2) * 22; R(g, x, 240 - h, 1, h, '#5a2e44'); }
          const tx = 260, tb = 240 - 60 - Math.sin(tx / BGW * Math.PI * 2) * 22;
          R(g, tx - 11, tb - 96, 22, 96, '#5a2e44'); R(g, tx - 13, tb - 98, 26, 4, '#5a2e44');
          for (let y = 0; y < 26; y++) R(g, tx - 13 + y / 2, tb - 98 - y, 26 - y, 1, '#4a2238');
          R(g, tx, tb - 128, 1, 6, '#4a2238');
          for (let y = tb - 90; y < tb - 10; y += 14) R(g, tx - 3, y, 3, 6, '#ffd27a');
          R(g, tx - 13, tb - 70, 26, 2, '#4a2238');
          skyline(g, r, 230, '#6a3450', 30, 80, 16, 30, ['#ffd27a', '#ffb060', 0.25]);
        });
        break;
      case 'kopru':
        far = mk(BGW, 240, (g) => {
          R(g, 0, 190, BGW, 50, '#2a3a70');
          skyline(g, r, 192, '#3a2a5a', 6, 30, 8, 22, ['#ffd27a', '#f4f0b0', 0.3]);
          for (let i = 0; i < 30; i++) R(g, r() * BGW, 196 + r() * 40, 8, 1, '#f0b07a');
        });
        near = mk(BGW, 240, (g) => {
          const col = '#2a1e3e';
          for (const tx of [100, 400]) { R(g, tx - 8, 30, 6, 210, col); R(g, tx + 2, 30, 6, 210, col); R(g, tx - 8, 60, 16, 4, col); R(g, tx - 8, 120, 16, 4, col); R(g, tx - 9, 26, 18, 6, col); R(g, tx - 1, 20, 2, 6, '#f04a3a'); }
          // ana halat (sarkan eğri) ve askılar
          for (let x = 0; x < BGW; x++) {
            const u = ((x - 100 + BGW) % 300) / 300;
            const y = 34 + Math.pow(Math.abs(u - 0.5) * 2, 2) * 0 + (1 - Math.pow((u - 0.5) * 2, 2)) * 120;
            R(g, x, y, 1, 2, col);
            if (x % 10 === 0) R(g, x, y, 1, 200 - y, col);
          }
          R(g, 0, 196, BGW, 6, col);
        });
        break;
      case 'catilar':
        far = mk(BGW, 240, (g) => {
          for (let i = 0; i < 90; i++) R(g, r() * BGW, r() * 140, 1, 1, r() < 0.3 ? '#ffffff' : '#a8b0e0');
          disc(g, 380, 50, 14, '#f4f0d0'); disc(g, 386, 46, 12, '#2a2c60');
          for (let x = 0; x < BGW; x += 170) mosque(g, x + 80, 196, 1.1, '#1a1a40');
          skyline(g, r, 200, '#1a1a40', 10, 40, 14, 30, ['#ffd27a', '#f4a060', 0.15]);
        });
        near = mk(BGW, 240, (g) => {
          let x = 0;
          while (x < BGW) {
            const wd = 50 + Math.floor(r() * 30), h = 60 + Math.floor(r() * 40);
            R(g, x, 230 - h, wd, h + 20, '#2a2448');
            for (let k = 0; k < wd / 2; k++) R(g, x + k, 230 - h - k * 0.5, wd - 2 * k, 1, '#5a2a30');
            for (let y = 230 - h + 10; y < 230; y += 16) for (let xx = x + 6; xx < x + wd - 8; xx += 14) if (r() < 0.35) R(g, xx, y, 6, 8, '#f4d27a');
            if (r() < 0.6) { R(g, x + wd - 14, 230 - h - 22, 8, 18, '#3a2a40'); }
            if (r() < 0.5) { R(g, x + 10, 230 - h - 20, 1, 14, '#6a6a7a'); R(g, x + 6, 230 - h - 18, 9, 1, '#6a6a7a'); R(g, x + 7, 230 - h - 14, 7, 1, '#6a6a7a'); }
            x += wd + Math.floor(r() * 10);
          }
        });
        break;
      case 'camlica':
        far = mk(BGW, 240, (g) => {
          for (let i = 0; i < 70; i++) R(g, r() * BGW, r() * 120, 1, 1, '#8a8ad0');
          for (let y = 150; y < 240; y += 10) R(g, 0, y, BGW, 1, 'rgba(58,224,255,0.12)');
          for (let x = 0; x < BGW; x += 16) R(g, x, 150, 1, 90, 'rgba(58,224,255,0.08)');
          for (let i = 0; i < 160; i++) R(g, r() * BGW, 190 + r() * 50, 1, 1, r() < 0.5 ? '#ffd27a' : '#f4f0b0');
        });
        near = mk(BGW, 240, (g) => {
          // Çamlıca kulesi
          const tx = 300;
          for (let y = 0; y < 200; y++) { const w = 4 + (200 - y) * 0.05; R(g, tx - w, 40 + y, w * 2, 1, '#1e2238'); }
          R(g, tx - 14, 70, 28, 22, '#1e2238'); R(g, tx - 12, 74, 24, 3, '#3ae0ff'); R(g, tx - 10, 84, 20, 2, '#3ae0ff');
          R(g, tx - 2, 0, 4, 44, '#1e2238'); R(g, tx - 1, 0, 2, 4, '#f04a3a');
          R(g, tx - 8, 104, 16, 4, '#1e2238');
          for (let x = 0; x < BGW; x++) { const h = 40 + Math.sin(x / 70) * 8 + Math.sin(x / 23) * 4; R(g, x, 240 - h, 1, h, '#141830'); }
          for (let i = 0; i < 80; i++) R(g, r() * BGW, 205 + r() * 30, 2, 2, r() < 0.5 ? '#ffd27a' : '#3ae0ff');
        });
        break;
    }
    bgs[w] = { far, near };
    return bgs[w];
  }

  // ---------------- patronlar ----------------
  function crown(g, x, y, s) {
    R(g, x, y + 4 * s, 12 * s, 4 * s, '#18141e'); R(g, x + s, y + 5 * s, 10 * s, 2 * s, '#f4c531');
    for (const k of [0, 5, 10]) { R(g, x + k * s, y, 2 * s, 5 * s, '#18141e'); R(g, x + k * s + (s > 1 ? 1 : 0), y + 1, Math.max(1, 2 * s - 2), 5 * s - 1, '#f4c531'); }
    R(g, x + 5 * s, y + 5 * s, 2 * s, s, '#e2483a');
  }
  const bossCache = new Map();
  function boss(kind, frame, hurt) {
    const key = kind + frame + (hurt ? 'h' : '');
    if (bossCache.has(key)) return bossCache.get(key);
    let c;
    const white = hurt ? { e: '#ffffff', E: '#ffffff', W: '#ffffff', g: '#ffffff', p: '#ffffff', P: '#ffffff', r: '#ffffff' } : null;
    switch (kind) {
      case 'kralbug': {
        const body = sprite(frame % 2 ? 'bug1' : 'bug0', null, false, 2, hurt ? white : { e: '#d4a62a', E: '#8a6410' });
        c = mk(32, 40, (g) => { g.drawImage(body, 0, 8); crown(g, 10, 2, 1); });
        break;
      }
      case 'spam': {
        const body = sprite(frame % 2 ? 'spam1' : 'spam0', null, false, 2, hurt ? white : { W: '#ffd6e6', g: '#c86a9a' });
        c = mk(32, 40, (g) => { g.drawImage(body, 0, 4); crown(g, 10, 2, 1); });
        break;
      }
      case 'marti': {
        c = sprite(frame % 2 ? 'marti1' : 'marti0', null, false, 2, hurt ? white : { W: '#e8ecf2', g: '#8a96a8' });
        break;
      }
      case 'truva':
        c = mk(40, 36, (g) => {
          const wood = hurt ? '#ffffff' : '#b07a3a', dark = hurt ? '#e0e0e0' : '#6e4418', light = hurt ? '#ffffff' : '#d8a060';
          // tekerlekli taban
          R(g, 2, 26, 36, 4, '#18141e'); R(g, 3, 27, 34, 2, dark);
          for (const x of [7, 19, 31]) { disc(g, x, 32, 3, '#18141e'); disc(g, x, 32, 1, '#9aa3b2'); }
          // bacaklar
          for (const x of [8, 14, 24, 30]) { R(g, x - 1, 18, 5, 9, '#18141e'); R(g, x, 18, 3, 9, wood); }
          // gövde
          R(g, 4, 9, 30, 11, '#18141e'); R(g, 5, 10, 28, 9, wood);
          for (let y = 11; y < 19; y += 3) R(g, 5, y, 28, 1, dark);
          R(g, 5, 10, 28, 1, light);
          // karın kapağı
          const open = frame >= 2;
          R(g, 14, 15, 10, 5, '#18141e'); R(g, 15, 16, 8, open ? 4 : 3, open ? '#7cff6a' : dark);
          if (!open) { R(g, 16, 17, 1, 1, '#7cff6a'); R(g, 18, 17, 2, 1, '#7cff6a'); R(g, 21, 17, 1, 1, '#7cff6a'); }
          // boyun ve baş
          R(g, 26, 1, 10, 14, '#18141e'); R(g, 27, 2, 8, 12, wood); R(g, 34, 5, 6, 6, '#18141e'); R(g, 34, 6, 5, 4, wood);
          R(g, 27, 2, 8, 1, light); R(g, 28, 0, 2, 3, '#18141e'); R(g, 32, 0, 2, 3, '#18141e');
          R(g, 31, 5, 2, 2, hurt ? '#ffffff' : '#e2483a'); R(g, 31, 5, 1, 1, '#ffffff');
          // yele
          for (let y = 2; y < 14; y += 2) R(g, 25, y, 2, 1, dark);
          // kuyruk
          R(g, 1, 10, 4, 2, dark); R(g, 0, 12, 2, 5, dark);
        });
        break;
      case 'sizinti':
        c = mk(32, 26, (g) => {
          const wob = [0, 1, 0, -1][frame % 4];
          const body = hurt ? '#ffffff' : '#a64fd0', light = hurt ? '#ffffff' : '#c88aec', dark = hurt ? '#e0e0e0' : '#6a2a94';
          for (let y = 0; y < 24; y++) {
            const t = y / 23, w = Math.round((Math.sin(Math.min(1, t * 1.3) * Math.PI / 2) * 15 + (t > 0.85 ? 1 : 0)) + (y > 16 ? wob : 0));
            R(g, 16 - w - 1, 2 + y, w * 2 + 2, 1, '#18141e');
            R(g, 16 - w, 2 + y, w * 2, 1, y < 6 ? light : y > 19 ? dark : body);
          }
          // içindeki bellek çipleri
          for (const [x, y] of [[8, 14], [18, 17], [12, 20]]) { R(g, x, y, 7, 3, '#2a6a2a'); for (let k = 0; k < 7; k += 2) R(g, x + k, y + 3, 1, 1, '#f4c531'); }
          // gözler
          R(g, 10, 8, 4, 4, '#ffffff'); R(g, 19, 8, 4, 4, '#ffffff'); R(g, 12, 9, 2, 3, '#18141e'); R(g, 21, 9, 2, 3, '#18141e');
          R(g, 13, 14, 7, 1, '#18141e');
          // damlalar
          R(g, 4, 24 + wob, 2, 2, body); R(g, 27, 25 - wob, 2, 2, body);
        });
        break;
      case 'dongu':
        c = mk(24, 24, (g) => {
          disc(g, 12, 12, 11, '#18141e'); disc(g, 12, 12, 10, hurt ? '#ffffff' : '#1a2a5a'); disc(g, 10, 9, 5, hurt ? '#ffffff' : '#2a4a8a');
          // sonsuzluk işareti
          const col = frame % 2 ? '#3ae0ff' : '#9af4ff';
          for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2; const d = 1 + Math.sin(a) * Math.sin(a); const x = 12 + 7 * Math.cos(a) / d, y = 12 + 7 * Math.sin(a) * Math.cos(a) / d; R(g, Math.round(x), Math.round(y), 2, 2, col); }
        });
        break;
      case 'ddos':
        c = mk(44, 28, (g) => {
          const body = hurt ? '#ffffff' : '#4a4e64', light = hurt ? '#ffffff' : '#6a7088', dark = hurt ? '#e0e0e0' : '#2a2c3c';
          for (const [x, y, r] of [[10, 16, 9], [22, 11, 11], [34, 16, 9], [16, 19, 8], [28, 19, 8]]) disc(g, x, y, r + 1, '#18141e');
          for (const [x, y, r] of [[10, 16, 9], [22, 11, 11], [34, 16, 9], [16, 19, 8], [28, 19, 8]]) disc(g, x, y, r, body);
          disc(g, 20, 7, 5, light); disc(g, 9, 13, 3, light);
          R(g, 4, 24, 36, 2, dark);
          // kızgın gözler
          R(g, 14, 12, 6, 4, '#ffffff'); R(g, 25, 12, 6, 4, '#ffffff'); R(g, 16, 13, 3, 3, '#e2483a'); R(g, 26, 13, 3, 3, '#e2483a');
          R(g, 13, 10, 7, 2, '#18141e'); R(g, 25, 10, 7, 2, '#18141e'); R(g, 13, 10, 2, 1, body); R(g, 30, 10, 2, 1, body);
          R(g, 18, 19, 9, 2, '#18141e');
          if (frame % 2) { R(g, 8, 25, 2, 3, '#f4c531'); R(g, 34, 25, 2, 3, '#f4c531'); }
        });
        break;
      case 'glitch':
        c = mk(24, 30, (g) => {
          const r = rng(frame * 977 + 3);
          const shape = ['....xxxx....', '...xxxxxx...', '...xxxxxx...', '...xx..xx...', '....xxxx....', '..xxxxxxxx..', '.xxxxxxxxxx.', '.xx.xxxx.xx.', '.xx.xxxx.xx.', '....xxxx....', '...xx..xx...', '...xx..xx...', '..xxx..xxx..'];
          for (let y = 0; y < shape.length; y++) for (let x = 0; x < 12; x++) {
            if (shape[y][x] !== 'x') continue;
            const off = r() < 0.15 ? (r() < 0.5 ? -2 : 2) : 0;
            const cols = hurt ? ['#ffffff'] : ['#ff3a6a', '#3ae0ff', '#7cff6a', '#ffffff', '#9a4fd0'];
            R(g, x * 2 + off, y * 2 + 2, 2, 2, cols[Math.floor(r() * cols.length)]);
          }
          for (let k = 0; k < 4; k++) R(g, 0, Math.floor(r() * 28), 24, 1, 'rgba(255,255,255,0.25)');
        });
        break;
      case 'maviekran':
        c = mk(46, 42, (g) => {
          const casing = hurt ? '#ffffff' : '#c9ccd4', dark = hurt ? '#e0e0e0' : '#8a909c';
          // ayaklar
          const step = frame % 2 ? 2 : 0;
          R(g, 10, 34, 6, 6 - step, '#18141e'); R(g, 11, 34, 4, 5 - step, '#5d6575');
          R(g, 30, 34, 6, 4 + step, '#18141e'); R(g, 31, 34, 4, 3 + step, '#5d6575');
          R(g, 8, 39 - step, 9, 3, '#18141e'); R(g, 29, 37 + step, 9, 3, '#18141e');
          // kasa
          R(g, 1, 1, 44, 34, '#18141e'); R(g, 2, 2, 42, 32, casing); R(g, 2, 2, 42, 2, '#f2f4f8'); R(g, 2, 30, 42, 4, dark);
          R(g, 5, 5, 36, 24, '#18141e'); R(g, 6, 6, 34, 22, hurt ? '#ffffff' : '#2a5ad8');
          if (!hurt) {
            // :( ve satırlar
            R(g, 10, 9, 2, 2, '#ffffff'); R(g, 10, 13, 2, 2, '#ffffff');
            R(g, 16, 8, 2, 1, '#ffffff'); R(g, 15, 9, 1, 6, '#ffffff'); R(g, 16, 15, 2, 1, '#ffffff');
            for (const [y, w] of [[19, 26], [22, 18], [25, 22]]) R(g, 9, y, w, 1, '#a8c0ff');
            R(g, 30, 9, 7, 7, '#ffffff'); R(g, 31, 10, 2, 2, '#2a5ad8'); R(g, 34, 13, 2, 2, '#2a5ad8'); R(g, 31, 14, 1, 1, '#2a5ad8');
          }
          R(g, 38, 31, 3, 2, '#7cff6a');
        });
        break;
    }
    bossCache.set(key, c);
    return c;
  }

  // ---------------- başlık için logo ----------------
  root.BA_ART = { TS, WORLD, sprite, tiles, background, boss, mk, R, disc, BGW };
})(window);
