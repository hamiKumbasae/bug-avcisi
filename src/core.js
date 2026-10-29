// Bug Avcısı: İstanbul — oyun çekirdeği (fizik, bloklar, düşmanlar, patronlar, akış).
// Çizimden bağımsızdır; Node'da da çalışır (testler bunu kullanır). Birimler karo (1 karo = 16 piksel).
(function (root) {
  'use strict';

  // H: ekranın (ve tek bantlı bölümün) satır sayısı; uzun bölümlerde haritanın boyu G.H'tır.
  const H = 14, VW = 16, VHT = 14;
  // Klasik platform hissi: yavaş yavaş hız kazanılır, bırakınca bir süre kayılır, ters yöne basınca savrulunur;
  // koşarken zıplama hızla orantılı olarak daha yüksek ve uzun olur.
  const PH = {
    walk: 6, run: 9.6, accG: 18, accRun: 9, accA: 16, fric: 15, skid: 34,
    jumpV: 15.3, jumpRun: 1.7, gHold: 27, gRel: 85, gFall: 60, maxFall: 17,
    coyote: 0.08, buffer: 0.12,
  };
  // durağandan başlayan bir koşunun len karo sonunda ulaşabileceği hız (testler de kullanır)
  function runUpSpeed(len, cap) {
    const d1 = (PH.walk * PH.walk) / (2 * PH.accG);
    if (len <= d1) return Math.min(cap, Math.sqrt(2 * PH.accG * Math.max(0, len)));
    if (cap <= PH.walk) return cap;
    return Math.min(cap, Math.sqrt(PH.walk * PH.walk + 2 * PH.accRun * (len - d1)));
  }
  const jumpSpeed = (vx) => PH.jumpV + PH.jumpRun * Math.min(1, Math.abs(vx) / PH.run);
  const PW = 0.75, SMALL_H = 0.875, BIG_H = 1.75;
  // HIDDEN: görünmez blok, yalnız oyuncu alttan vurunca katılaşır. MULTI: çatlak görünümlü, kısa süre çok simit verir.
  // El yapımı bölümlerin karoları (v2.1, Maslak): kartlı cam kapı (kapalı/açık), asma tavan ya da yükseltilmiş taban
  // kapağı, yerdeki soğutma fanı, sıcak (dokununca yakar) ve soğumuş kabin, cam cephe, saksı, turnike, simitçi tezgâhı.
  const T = { EMPTY: 0, GROUND: 1, SOLID: 2, ONEWAY: 3, BLOCK: 4, USED: 5, CRACK: 6, SPIKE: 7, WALL: 8, HIDDEN: 9, MULTI: 10,
    DOOR: 11, DOOROPEN: 12, PANEL: 13, FAN: 14, HOT: 15, COOL: 16, GLASS: 17, PLANTER: 18, TURN: 19, CART: 20,
    CRUMBLE: 21, SHUTTER: 22 };
  const SOLID = [false, true, true, false, true, true, true, false, true, false, true,
    true, false, true, true, true, true, true, true, true, true, true, true];
  // fan: üstündeki hava sütununda yukarı iter (sütun en çok 10 karo, katı karoda biter; tepesine yakın zayıflar)
  // f fanları 4 saniyede bir 2,4 saniye çalışır; patronun ikinci evresinde bütün fanlar kısa kısa çalışır
  const FAN = { lift: 90, grav: 30, cap: 6.5, reach: 10, period: 4, on: 2.4, pPeriod: 1.7, pOn: 0.95 };
  const CART_V = 19.5;   // simitçi tezgâhının tentesinden sekme hızı
  const READ_DUR = 3;    // kart okutunca kapının en az açık kaldığı süre
  const ROOM_W = 16;
  // metro treni: 10 karo; oyuncu tavanına binince kalkar, hızlanır, öbür perona yavaşlayarak yanaşır
  const TRAIN_W = 10, TRAIN_V = 4.5, TRAIN_ACC = 2.6, LEAP_G = 24;
  // DEPLOY anteni: zeminden 10 karo boy; ayakların değdiği yüksekliğe göre bonus eşikleri
  const GOAL_MAST = 10, GOAL_STEPS = [2, 4, 6, 8, 9.5];
  const CONTENT = { K: 'simit', U: 'guc', S: 'kahve', L: 'disket' };
  const COMBO = [100, 200, 400, 800, 1000, 2000, 4000, 8000];
  const STAR_TIME = 10;

  // Patronlar: can (ezme sayısı), boyut.
  const BOSS = {
    kralbug:   { hp: 4, w: 2, h: 1.75 },   // v2.1: canı yarıya inince tacından bug'lar çıkar, fanlar kesik kesik çalışır
    spam:      { hp: 3, w: 2, h: 1.5 },
    marti:     { hp: 3, w: 2, h: 1.25 },
    truva:     { hp: 4, w: 2.25, h: 2 },
    sizinti:   { hp: 4, w: 2, h: 1.5 },
    dongu:     { hp: 4, w: 1.5, h: 1.5 },
    ddos:      { hp: 5, w: 2.5, h: 1.5 },
    glitch:    { hp: 5, w: 1.25, h: 1.75 },
    maviekran: { hp: 6, w: 2.75, h: 2.5 },
    spagetti: { hp: 5, w: 2.25, h: 1.75 },
    teknikborc: { hp: 7, w: 2.5, h: 2.5 },
    fidye:     { hp: 5, w: 2.25, h: 2.25 },
  };

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const approach = (v, t, d) => (v < t ? Math.min(t, v + d) : Math.max(t, v - d));
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  // ---------------- oturum ----------------
  function newRun() {
    return { lives: 3, score: 0, simit: 0, power: 0, stage: 0, checkpoint: null };
  }

  function levels() { return root.BA_LEVELS; }

  // ---------------- bölüm yükleme ----------------
  function loadStage(S, idx) {
    const L = levels()[idx];
    const rows = L.map;
    const W = rows[0].length, MH = rows.length;
    const G = {
      S, idx, L, W, H: MH, world: L.world - 1, section: L.section - 1, place: (L.world - 1) * 3 + (L.section - 1),
      grid: new Uint8Array(W * MH), content: new Map(), coins: new Uint8Array(W * MH),
      camY: 0, camLo: new Float32Array(W), camHi: new Float32Array(W), camOff: new Float32Array(W),
      spawns: [], ents: [], items: [], shots: [], bshots: [], plats: [], bars: [], fx: [], bumps: [],
      goal: null, checkpoint: null, arena: null, boss: null, bossKind: L.boss || null,
      time: L.time, t: 0, phase: 'play', result: null, ev: [], cam: 0, shake: 0,
      clearT: 0, dieT: 0, bossDownT: 0, combo: 0, hurry: false, rand: rng(idx * 7919 + 13),
      prev: { jump: false, run: false },
      multi: new Map(), area: 'main', mainW: L.room || W, room: null, metroIn: null, metroOut: null, warp: null,
      quiet: !!L.quiet, bench: null,   // sessiz bölüm (Eyüp'ün tepesi): süre işlemez, bankta biter
      // el yapımı bölümler: altın simitler, kayıt noktaları, kart okuyucular ve kapılar, fanlar, süsler
      hand: !!L.hand, golds: [], checkpoints: [], readers: [], doors: [], fans: [], decor: [], look: new Map(), dark: null,
      marks: new Map(), carts: new Set(), cartT: new Map(), fanT: 0, fanPulse: false, hasHot: false,
      scales: [], npcs: [], crumb: new Map(), shutters: [],
      lanes: [], cars: [], lifts: [], doors2: [], lamps: [],
    };
    if (L.room) G.room = { x0: L.room, x1: L.room + (L.roomW || ROOM_W), y0: MH - VHT, exit: null, used: false,
      // yer altı (metro, füniküler): merdivenle inilir; sokak araçlarında durağa yürünür
      under: !L.ride || L.ride.type === 'metro' || L.ride.type === 'funicular' };
    // dikey kamera aralıkları: her sütunda kameranın üst satırı [lo, hi] arasında kalır (düz bölümlerde 0)
    const vc = L.vcam || [[0, MH - VHT, MH - VHT]];
    for (let k = 0; k < vc.length; k++) {
      // dördüncü değer (el yapımı bölümler): ayakların ekranda durduğu satır (yukarı açılan yerlerde daha aşağıda değil)
      const [x0, lo, hi, off] = vc[k], x1 = k + 1 < vc.length ? vc[k + 1][0] : W;
      for (let x = x0; x < x1; x++) { G.camLo[x] = lo; G.camHi[x] = hi; G.camOff[x] = off || 12; }
    }
    let start = { x: 2, y: 11 };
    for (let y = 0; y < MH; y++) {
      for (let x = 0; x < W; x++) {
        const ch = rows[y][x], i = y * W + x;
        switch (ch) {
          case '#': G.grid[i] = T.GROUND; break;
          case '=': G.grid[i] = T.SOLID; break;
          case '-': G.grid[i] = T.ONEWAY; break;
          case 'C': G.grid[i] = T.CRACK; break;
          case '^': G.grid[i] = T.SPIKE; break;
          case 'K': case 'U': case 'S': case 'L': G.grid[i] = T.BLOCK; G.content.set(i, CONTENT[ch]); break;
          case 'X': G.grid[i] = T.HIDDEN; G.content.set(i, 'disket'); break;
          case 'Z': G.grid[i] = T.MULTI; break;
          case 'E': G.metroIn = { x, y }; break;
          case 'R': G.metroOut = { x, y }; break;
          case 'O': if (G.room) G.room.exit = { x, y }; break;
          case 'b': G.coins[i] = 1; break;
          case 'e': case 's': case 'v': case 'm': case 'j':
            G.spawns.push({ kind: { e: 'bug', s: 'spam', v: 'virus', m: 'marti', j: 'leap' }[ch], x, y, done: false }); break;
          case 'o': G.bars.push({ cx: x + 0.5, cy: y + 0.5, a: (x * 1.7) % 6.28, sp: (x % 2 ? 1 : -1) * (1.9 + 0.1 * G.world), n: 5 }); break;
          case 'M': G.plats.push({ kind: 'h', x, y: y + 1, w: 3, h: 0.5, tx: x, ty: y + 1, dx: 0, dy: 0 }); break;
          case 'T': G.plats.push({ kind: 'h', train: true, x, y: y + 1, w: (L.ride && L.ride.w) || TRAIN_W, h: 0.5, tx: x, ty: y + 1, dx: 0, dy: 0, v: 0, state: 'wait', wt: 0 }); break;
          case 'Y': G.rideEnd = { x, y: y + 1 }; break;
          case 'N': G.plats.push({ kind: 'v', x, y, w: 2, h: 0.5, tx: x, ty: y, dx: 0, dy: 0 }); break;
          case 'P': start = { x, y }; break;
          case 'G': G.goal = { x, y: y - 1, w: 1, h: 2, active: !L.boss, t: 0 }; break;
          case 'Q': G.checkpoints.push({ x, y, on: false }); break;
          // ---- el yapımı bölümlerin işaretleri ----
          case 'g': G.golds.push({ x: x + 0.1, y: y + 0.08, w: 0.8, h: 0.84, taken: false }); break;
          case 'V': G.plats.push({ kind: 'v', gondola: true, x, y: y + 1, w: 3, h: 0.5, tx: x, ty: y + 1, dx: 0, dy: 0 }); break;
          case ':': G.marks.set(x, (G.marks.get(x) || []).concat([y])); break;
          case 'z': G.spawns.push({ kind: 'bug', x, y, done: false, sleep: true }); G.decor.push({ k: 'bank', x, y, cup: true }); break;
          case 'w': G.spawns.push({ kind: 'bug', x, y, done: false, meet: true }); break;
          case 'n': G.spawns.push({ kind: 'bug', x, y, done: false, slide: true }); break;
          case 'q': G.spawns.push({ kind: 'hirsiz', x, y, done: false }); break;
          case 'u': G.decor.push({ k: 'masa', x, y }); break;
          case 'k': G.grid[i] = T.CART; break;
          case 'x': G.grid[i] = T.HIDDEN; G.content.set(i, 'simit'); break;
          case 'r': G.readers.push({ x, y, t: 0, dur: 0 }); break;
          case 'D': G.grid[i] = T.DOOR; G.doors.push({ x, y, inv: false }); break;
          case 'd': G.grid[i] = T.DOOROPEN; G.doors.push({ x, y, inv: true }); break;
          case 'c': G.grid[i] = T.BLOCK; G.content.set(i, 'kahve'); G.look.set(i, 'kahve'); break;
          case 't': G.grid[i] = T.TURN; break;
          case 'p': G.grid[i] = T.PANEL; break;
          case 'F': case 'f': G.grid[i] = T.FAN; G.fans.push({ x, y, cyc: ch === 'f', on: true, reach: 0, spin: 1 }); break;
          case 'H': G.grid[i] = T.HOT; G.hasHot = true; break;
          case 'J': G.grid[i] = T.COOL; break;
          case 'I': G.grid[i] = T.GLASS; break;
          case 'y': G.grid[i] = T.PLANTER; break;
          case '~': G.grid[i] = T.CRUMBLE; break;   // çürük tahta: basınca çöker, sonra yerine gelir
          case 'W': G.bench = { x, y }; break;
          case 'A': G.arena = { ax: x, locked: false, cam: x + 3 }; break;
          case 'B': G.bossSpawn = { x, y }; break;
          case 'h': G.piece = { x: x + 0.125, y: y + 0.1, w: 0.75, h: 0.8, taken: false }; break;
        }
      }
    }
    // hareketli platformların menzili
    for (const p of G.plats) {
      if (p.gondola) {
        // cam silme sepeti: aynı sütundaki ':' işaretine kadar iner/çıkar, uçlarda bir an bekler
        let my = null;
        for (const yy of G.marks.get(p.x) || []) if (my === null || Math.abs(yy + 1 - p.y) < Math.abs(my + 1 - p.y)) my = yy;
        const ey = my === null ? p.y + 4 : my + 1;
        p.a = Math.min(p.y, ey); p.b = Math.max(p.y, ey); p.dir = ey < p.y ? -1 : 1;
        p.sp = L.gsp || 2.4; p.pause = 0.5; p.hold = 0;
        continue;
      }
      if (p.kind === 'h') {
        let k = 0;
        while (p.x + k < W && !SOLID[G.grid[p.y * W + p.x + k]] && G.grid[p.y * W + p.x + k] !== T.ONEWAY) k++;
        p.a = p.x; p.b = p.x + Math.max(0, k - p.w); p.sp = p.train ? (L.ride && L.ride.v) || TRAIN_V : 2.2; p.dir = 1;
        // füniküler: eğik rayda varış noktasına (sol üst köşe) kadar
        p.ya = p.yb = p.y;
        if (p.train && G.rideEnd) { p.b = G.rideEnd.x; p.yb = G.rideEnd.y; }
      } else {
        p.a = p.y; p.b = p.y + 4; p.sp = 1.6; p.dir = 1;
      }
    }
    // haritanın dışında tanımlanan nesneler: teraziler, çaycı, kepenkler
    for (const o of L.objs || []) addObj(G, o);
    // karanlık arka planlı bölgeler (tavan arası, taban altı): yalnız çizim içindir
    if (L.dark) {
      G.dark = new Uint8Array(W * MH);
      for (const [x0, y0, x1, y1] of L.dark) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) G.dark[y * W + x] = 1;
    }
    // kayıt noktaları soldan sağa; ilki eski bölümlerin tek kayıt noktası
    G.checkpoints.sort((a, b) => a.x - b.x);
    G.checkpoint = G.checkpoints[0] || null;
    // altın simitler soldan sağa 0, 1, 2; bu koşuda daha önce alınanlar yeniden çıkmaz
    G.golds.sort((a, b) => a.x - b.x);
    { const gm = (S.golds && S.golds[idx]) || 0; G.golds.forEach((g, k) => { g.k = k; if ((gm >> k) & 1) g.taken = true; }); }
    setupDoors(G, L);
    // kayıt noktasından başla
    if (S.checkpoint && S.checkpoint.stage === idx && G.checkpoints.length) {
      const k = Math.min(G.checkpoints.length - 1, S.checkpoint.k || 0), cp = G.checkpoints[k];
      start = { x: cp.x, y: cp.y };
      for (let j = 0; j <= k; j++) G.checkpoints[j].on = true;
    }
    const h = S.power ? BIG_H : SMALL_H;
    G.player = {
      x: start.x + (1 - PW) / 2, y: start.y + 1 - h, w: PW, h, vx: 0, vy: 0, face: 1,
      onGround: true, coyote: 0, buf: 0, jumping: false, inv: 0, star: 0, plat: null,
      dropT: 0, shootCD: 0, walkT: 0, growT: 0, skid: false, dead: false, prevBottom: start.y + 1,
      sq: 0, sqv: 0, dustT: 0, isPlayer: true,
    };
    G.cam = clamp(G.player.x - 6, 0, G.mainW - VW);
    G.player.gFeet = G.player.y + G.player.h;
    { const cx = colAt(G, G.player.x + G.player.w / 2); G.camY = clamp(G.player.y + G.player.h - G.camOff[cx], G.camLo[cx], G.camHi[cx]); }
    G.base0 = G.camY;
    return G;
  }
  const colAt = (G, x) => clamp(Math.floor(x), 0, G.W - 1);
  // ekranın altından düşünce ölüm: o sütunda kameranın inebileceği en alt yerin de altı
  const deathY = (G, x) => G.camHi[colAt(G, x)] + VHT + 0.5;

  // ---------------- karo yardımcıları ----------------
  function tile(G, tx, ty) {
    if (tx < 0 || tx >= G.W) return T.WALL;
    if (ty < 0 || ty >= G.H) return T.EMPTY;
    return G.grid[ty * G.W + tx];
  }
  function setTile(G, tx, ty, v) { if (tx >= 0 && tx < G.W && ty >= 0 && ty < G.H) G.grid[ty * G.W + tx] = v; }
  const solid = (G, tx, ty) => SOLID[tile(G, tx, ty)];

  function moveX(G, b, dx) {
    if (!dx) return 0;
    b.x += dx;
    const y0 = Math.floor(b.y + 0.001), y1 = Math.floor(b.y + b.h - 0.001);
    if (dx > 0) {
      const tx = Math.floor(b.x + b.w - 1e-9);
      for (let ty = y0; ty <= y1; ty++) if (solid(G, tx, ty)) { b.x = tx - b.w; return 1; }
    } else {
      const tx = Math.floor(b.x);
      for (let ty = y0; ty <= y1; ty++) if (solid(G, tx, ty)) { b.x = tx + 1; return -1; }
    }
    return 0;
  }

  // dy>0: aşağı. oneway: ince platformlara basılabilir mi. Dönüş: {down, up, tiles, ty}
  function moveY(G, b, dy, oneway) {
    const res = { down: false, up: false, tiles: null, ty: 0, plat: null };
    if (!dy) return res;
    const prevBottom = b.y + b.h;
    b.y += dy;
    const x0 = Math.floor(b.x + 0.001), x1 = Math.floor(b.x + b.w - 0.001);
    if (dy > 0) {
      const ty = Math.floor(b.y + b.h - 1e-9);
      for (let tx = x0; tx <= x1; tx++) {
        const t = tile(G, tx, ty);
        if (SOLID[t] || (oneway && t === T.ONEWAY && prevBottom <= ty + 0.002)) {
          b.y = ty - b.h; res.down = true; return res;
        }
      }
      if (oneway) {
        for (const p of G.plats) {
          if (b.x < p.x + p.w && b.x + b.w > p.x && prevBottom <= p.y + 0.002 + Math.max(0, p.dy) && b.y + b.h >= p.y) {
            b.y = p.y - b.h; res.down = true; res.plat = p; return res;
          }
        }
      }
    } else {
      const ty = Math.floor(b.y);
      const hits = [];
      // gizli blok yalnız oyuncunun başı alttan girerken katıdır
      const fromBelow = b.isPlayer && b.y - dy >= ty + 1 - 0.01;
      for (let tx = x0; tx <= x1; tx++) { const t = tile(G, tx, ty); if (SOLID[t] || (fromBelow && t === T.HIDDEN)) hits.push(tx); }
      if (hits.length) { b.y = ty + 1; res.up = true; res.tiles = hits; res.ty = ty; }
    }
    return res;
  }

  // ---------------- kartlı kapılar ----------------
  // Alt alta duran kapı karoları tek kapıdır. Kapıyı açan okuyucular bölümün links listesinden gelir
  // ({r: [x, y], dur, doors: [[x, y], ...]}); listede olmayan kapı solundaki en yakın okuyucuya bağlanır.
  // Kart okutulunca bağlı D kapıları açılır, d kapıları kapanır. Kapının sağında (çıkış tarafında) duran
  // oyuncuya kapı her zaman açılır: geri dönmek hiçbir zaman kilitlenmez.
  function setupDoors(G, L) {
    const cells = G.doors;
    G.doors = [];
    cells.sort((a, b) => a.x - b.x || a.y - b.y);
    for (const c of cells) {
      const d = G.doors[G.doors.length - 1];
      if (d && d.x === c.x && d.y1 === c.y - 1 && d.inv === c.inv) d.y1 = c.y;
      else G.doors.push({ x: c.x, y0: c.y, y1: c.y, inv: c.inv, readers: [], open: c.inv, t: -9 });
    }
    const doorAt = (x, y) => G.doors.find((d) => d.x === x && y >= d.y0 && y <= d.y1);
    const readerAt = (x, y) => G.readers.find((r) => r.x === x && r.y === y);
    for (const lk of L.links || []) {
      const r = readerAt(lk.r[0], lk.r[1]);
      if (!r) continue;
      if (lk.dur) r.dur = lk.dur;
      for (const [x, y] of lk.doors) { const d = doorAt(x, y); if (d && !d.readers.includes(r)) d.readers.push(r); }
    }
    for (const d of G.doors) {
      if (d.readers.length || !G.readers.length) continue;
      let best = null;
      for (const r of G.readers) if (r.x < d.x && (!best || r.x > best.x)) best = r;
      if (!best) for (const r of G.readers) if (!best || Math.abs(r.x - d.x) < Math.abs(best.x - d.x)) best = r;
      d.readers.push(best);
    }
    // süre verilmemişse: en uzaktaki kapıya koşarak yetişilecek kadar
    for (const r of G.readers) {
      if (r.dur) continue;
      let far = 0;
      for (const d of G.doors) if (d.readers.includes(r)) far = Math.max(far, Math.abs(d.x - r.x));
      r.dur = Math.max(READ_DUR, 1 + far / 8);
    }
  }
  function bodyInDoor(G, d) {
    const box = { x: d.x, y: d.y0, w: 1, h: d.y1 - d.y0 + 1 };
    if (!G.player.dead && overlap(G.player, box)) return true;
    for (const e of G.ents) if (!e.dead && e.kind !== 'hirsiz' && overlap(e, box)) return true;
    return false;
  }
  function setDoor(G, d, open) {
    d.open = open; d.t = G.t;
    for (let y = d.y0; y <= d.y1; y++) setTile(G, d.x, y, open ? T.DOOROPEN : T.DOOR);
    if (d.x > G.cam - 2 && d.x < G.cam + VW + 2) ev(G, open ? 'door' : 'doorshut');
  }
  function updateDoors(G, dt) {
    const p = G.player;
    for (const r of G.readers) {
      const was = r.t;
      r.t = Math.max(0, r.t - dt);
      // okuyucuya değmek yeter (göğüs hizasında duvara takılı); her değişte süre baştan başlar
      if (!p.dead && p.x < r.x + 1 && p.x + p.w > r.x && p.y < r.y + 1 && p.y + p.h > r.y - 0.6 && r.t < r.dur - 0.25) {
        if (r.t <= 0) ev(G, 'card');
        r.t = r.dur;
      }
      if (r.t > 0 && Math.ceil(r.t) !== Math.ceil(was) && r.t < r.dur - 0.5) ev(G, 'tick');
    }
    for (const d of G.doors) {
      const active = d.readers.some((r) => r.t > 0);
      const exit = !p.dead && p.x >= d.x + 1 - 0.05 && p.x < d.x + 1.9 && p.y < d.y1 + 1 && p.y + p.h > d.y0;
      const want = (active !== d.inv) || exit;
      if (want !== d.open && (want || !bodyInDoor(G, d))) setDoor(G, d, want);
    }
  }

  // ---------------- nesneler (v2.1 Kapalıçarşı ve sonrası) ----------------
  function addObj(G, o) {
    if (o.k === 'terazi') {
      // kuyumcu terazisi: iki kefe birbirine bağlı; ağır gelen kefe iner, öbürü kalkar, boşken dengeye döner.
      // inv: ters makara (basılan kefe kalkar). loadA/loadB: kefedeki sabit ağırlık (pirinç tartı)
      const sc = { d: 0, r: o.r || 3, inv: !!o.inv, loadA: o.loadA || 0, loadB: o.loadB || 0, snap: 0, y: o.y };
      const pan = (x, side) => ({ kind: 'pan', x, y: o.y, w: 3, h: 0.5, tx: x, ty: o.y, dx: 0, dy: 0, base: o.y, side, sc, a: 0, b: 0 });
      sc.A = pan(o.xa, 1); sc.B = pan(o.xb, -1);
      sc.d = scaleTarget(G, sc);
      sc.A.y = o.y + sc.d; sc.B.y = o.y - sc.d;
      G.plats.push(sc.A, sc.B); G.scales.push(sc);
    } else if (o.k === 'cayci') {
      // çaycı: avluda iki uç arasında gidip gelir, başının üstündeki askılı tepsiye binilir; ilk binene çay ikram eder
      const n = { k: 'cayci', x: o.x0, x0: o.x0, x1: o.x1, y: o.y, dir: 1, wait: 0.6, t: 0, served: false, v: o.v || 1.6 };
      n.tray = { kind: 'tray', x: n.x - 0.6, y: o.y - 2.1, w: 2, h: 0.5, tx: 0, ty: 0, dx: 0, dy: 0, npc: n, a: 0, b: 0 };
      G.plats.push(n.tray); G.npcs.push(n);
    } else if (o.k === 'yol') {
      // trafik şeridi: araçlar x0'dan x1'e akar; yaya ışığı yeşilken çizginin önünde durur
      G.lanes.push({ x0: o.x0, x1: o.x1, y: o.y, dir: o.dir || 1, every: o.every || 2.8, t: o.t0 || 0, light: o.light || null,
        kinds: o.kinds || ['taksi', 'dolmus'], v: o.v || 5, n: 0 });
    } else if (o.k === 'kibar') {
      G.spawns.push({ kind: 'bug', x: o.x, y: o.y, done: false, polite: true });   // kırmızıda bekleyen kibar bug
    } else if (o.k === 'asansor') {
      // asansör: kabine binen yarım saniye durunca bir sonraki kata gider; katlardaki düğme kabini çağırır
      const fl = o.floors, L = { x: o.x, floors: fl, cur: o.start !== undefined ? o.start : fl.length - 1, dir: -1, state: 'idle', wt: 0, target: 0, call: -1 };
      L.car = { kind: 'lift', x: o.x, y: fl[L.cur], w: 3, h: 0.5, tx: 0, ty: 0, dx: 0, dy: 0, lift: L, a: 0, b: 0 };
      G.lifts.push(L); G.plats.push(L.car);
    } else if (o.k === 'doner') {
      G.doors2.push({ x: o.x, y: o.y, w: o.w || 2, a: 0 });   // döner kapı: girenin başını döndürüp öbür yana çıkarır
    } else if (o.k === 'lamba') {
      G.lamps.push({ x: o.x, y: o.y, t: 0 });                 // hareket sensörlü tavan lambası
    } else if (o.k === 'kiris') {
      G.decor.push({ k: 'kiris', x: o.x0, x1: o.x1, y: o.y });   // galerinin korkuluk kirişi: yalnız süs, üstünde durulmaz
    } else if (o.k === 'kepenk') {
      // dükkân kepengi: belli aralıkla iner (katı), bir süre kapalı kalır, kalkar
      G.shutters.push({ x: o.x, y0: o.y0, y1: o.y1, ph: o.ph || 0, per: o.per || 4, open: o.open || 2, k: 1, solid: false });
    }
  }
  function panWeight(G, pan) {
    let w = 0;
    const p = G.player;
    if (p && !p.dead && p.plat === pan && p.onGround) w += 1;
    for (const e of G.ents) if (!e.dead && e.plat === pan && e.onGround) w += 0.6;
    return w;
  }
  function scaleTarget(G, sc) {
    const t = clamp((panWeight(G, sc.A) + sc.loadA - panWeight(G, sc.B) - sc.loadB) * sc.r, -sc.r, sc.r);
    return sc.inv ? -t : t;
  }
  function updateScale(G, sc, dt) {
    const prev = sc.d;
    sc.d = approach(sc.d, scaleTarget(G, sc), (sc.snap > 0 ? 11 : 3.2) * dt);
    // sapan: kefeye yüksekten düşülünce öbür kefe birden kalkar, üstündekini fırlatır
    if (sc.snap > 0) {
      sc.snap = Math.max(0, sc.snap - dt);
      const up = sc.d > prev ? sc.B : sc.d < prev ? sc.A : null;
      if (up) for (const e of G.ents) if (!e.dead && e.plat === up) { killEnemy(G, e, true, 400); e.vy = -17; e.vx = (G.rand() - 0.5) * 3; ev(G, 'fling'); }
    }
  }
  // ---------------- Şişli: trafik, asansör, döner kapı, sensörlü lambalar ----------------
  const CAR = { taksi: [3, 1.3], dolmus: [4, 1.8], otobus: [7, 2.3] };
  const greenNow = (G, l) => (((G.t + (l.ph || 0) * l.per) % l.per) + l.per) % l.per < l.green;
  function updateLanes(G, dt) {
    for (const ln of G.lanes) {
      ln.t += dt;
      if (ln.t >= ln.every) {
        const kind = ln.kinds[ln.n % ln.kinds.length], [w, h] = CAR[kind];
        const x = ln.dir > 0 ? ln.x0 : ln.x1 - w;
        if (!G.cars.some((c) => c.lane === ln && Math.abs(c.x - x) < w + 1.5)) {
          ln.t = 0; ln.n++;
          const c = { lane: ln, kind, x, w, h, v: ln.v, hue: (ln.n * 67) % 360 };
          c.plat = { kind: 'car', x, y: ln.y - h, w, h: 0.5, tx: 0, ty: 0, dx: 0, dy: 0, car: c, a: 0, b: 0 };
          G.cars.push(c); G.plats.push(c.plat);
        }
      }
    }
    const p = G.player;
    for (const c of G.cars) {
      const ln = c.lane, d = ln.dir, front = d > 0 ? c.x + c.w : c.x;
      let want = ln.v;
      const l = ln.light;
      if (l && greenNow(G, l)) {
        const line = d > 0 ? l.x - 0.3 : l.x + l.w + 0.3, dist = (line - front) * d;
        if (dist > -0.2) want = Math.min(want, Math.max(0, dist * 3));
      }
      for (const o of G.cars) {
        if (o === c || o.lane !== ln) continue;
        const gap = d > 0 ? o.x - (c.x + c.w) : c.x - (o.x + o.w);
        if (gap > -0.5 && gap < 6) want = Math.min(want, Math.max(0, (gap - 0.7) * 3));
      }
      c.v = approach(c.v, want, (want < c.v ? 14 : 6) * dt);
      const ox = c.x;
      c.x += d * c.v * dt;
      c.plat.x = c.x; c.plat.dx = c.x - ox; c.plat.dy = 0;
      // gövde: hızla gelen araç çarpar; duran araçtan yana itilir; çatısına basılır
      const body = { x: c.x + 0.1, y: ln.y - c.h + 0.3, w: c.w - 0.2, h: c.h - 0.3 };
      if (!p.dead && p.plat !== c.plat && overlap(p, body)) {
        if (c.v > 1.2 && p.inv <= 0 && p.star <= 0) { hurt(G); if (!p.dead) { p.vx = d * 8; p.vy = -9; p.onGround = false; } ev(G, 'honk'); }
        else p.x = p.x + p.w / 2 < c.x + c.w / 2 ? c.x - p.w - 0.02 : c.x + c.w + 0.02;
      }
      for (const e of G.ents) if (!e.dead && !e.harmless && c.v > 1.2 && overlap(e, body)) { killEnemy(G, e, true, 200); ev(G, 'honk'); }
    }
    G.cars = G.cars.filter((c) => {
      const gone = c.lane.dir > 0 ? c.x > c.lane.x1 : c.x + c.w < c.lane.x0;
      if (gone) { G.plats.splice(G.plats.indexOf(c.plat), 1); if (G.player.plat === c.plat) G.player.plat = null; }
      return !gone;
    });
  }
  // yaya ışığı kırmızıyken (araçlar geçerken) kibar bug geçidin önünde bekler
  function politeWait(G, e) {
    for (const ln of G.lanes) {
      const l = ln.light;
      if (!l || Math.abs(ln.y - (e.y + e.h)) > 0.6) continue;
      const ahead = e.vx > 0 ? e.x + e.w + 0.4 : e.x - 0.4;
      if (ahead > l.x - 0.6 && ahead < l.x + l.w + 0.6 && !(e.x > l.x - 0.2 && e.x < l.x + l.w) && !greenNow(G, l)) return true;
    }
    return false;
  }
  function updateLift(G, L, dt) {
    const car = L.car, p = G.player;
    const riders = (!p.dead && p.plat === car && p.onGround ? 1 : 0) + G.ents.filter((e) => !e.dead && e.plat === car).length;
    if (L.state === 'idle') {
      if (riders) {
        L.wt += dt;
        if (L.wt > 0.5) {
          if (L.cur === 0) L.dir = 1; else if (L.cur === L.floors.length - 1) L.dir = -1;
          L.target = L.cur + L.dir; L.state = 'move'; ev(G, 'lift');
        }
      } else {
        L.wt = 0;
        if (L.call >= 0 && L.call !== L.cur) { L.target = L.call; L.state = 'move'; ev(G, 'lift'); }
        L.call = -1;
      }
    } else {
      const ty = L.floors[L.target];
      car.y = approach(car.y, ty, 3.2 * dt);
      if (car.y === ty) { L.cur = L.target; L.state = 'idle'; L.wt = -0.6; ev(G, 'ding'); }
    }
    // kattaki düğme: kabinin sol yanında
    if (!p.dead) for (let k = 0; k < L.floors.length; k++) {
      const box = { x: L.x - 1, y: L.floors[k] - 1.6, w: 1, h: 1.6 };
      if (overlap(p, box) && L.cur !== k && L.state === 'idle') { if (L.call !== k) ev(G, 'card'); L.call = k; }
    }
  }
  function updateRevolving(G, dt) {
    const p = G.player;
    for (const d of G.doors2) {
      d.a += dt * (d.spin ? 9 : 0.6);
      const box = { x: d.x, y: d.y - 3, w: d.w, h: 3 };
      if (!p.dead && !p.spin && overlap(p, box) && p.onGround) {
        const dir = p.x + p.w / 2 < d.x + d.w / 2 ? 1 : -1;
        p.spin = { t: 0, dir, d }; d.spin = true; ev(G, 'whoosh');
      }
      for (const e of G.ents) if (!e.dead && !e.harmless && overlap(e, box)) { e.vx = -e.vx; e.x += e.vx > 0 ? 0.3 : -0.3; d.spin = true; }
      if (d.spin && !(p.spin && p.spin.d === d)) d.spin = false;
    }
  }
  function updateLamps(G, dt) {
    const p = G.player;
    for (const l of G.lamps) {
      const near = !p.dead && Math.abs(p.x + p.w / 2 - (l.x + 0.5)) < 4.5 && p.y > l.y - 2 && p.y < l.y + 12;
      if (near && l.t <= 0) ev(G, 'lampon');
      l.t = near ? 3 : Math.max(0, l.t - dt);
    }
  }
  function updateCayci(G, n, dt) {
    n.t += dt;
    if (n.wait > 0) { n.wait -= dt; return; }
    n.x += n.dir * n.v * dt;
    if (n.x >= n.x1) { n.x = n.x1; n.dir = -1; n.wait = 1.2; }
    if (n.x <= n.x0) { n.x = n.x0; n.dir = 1; n.wait = 1.2; }
  }
  function updateShutters(G) {
    for (const s of G.shutters) {
      const ph = (((G.t + s.ph * s.per) / s.per) % 1 + 1) % 1, tOpen = s.open / s.per, tMove = 0.3 / s.per;
      let k;
      if (ph < tOpen) k = 1;
      else if (ph < tOpen + tMove) k = 1 - (ph - tOpen) / tMove;
      else if (ph < 1 - tMove) k = 0;
      else k = (ph - (1 - tMove)) / tMove;
      s.k = k;
      const want = k < 0.5;
      if (want === s.solid) continue;
      s.solid = want;
      if (want) {
        // inen kepenk altında kalan bug ezilir; oyuncuyu en yakın yana iter
        const box = { x: s.x, y: s.y0, w: 1, h: s.y1 - s.y0 + 1 };
        const p = G.player;
        if (!p.dead && overlap(p, box)) p.x = p.x + p.w / 2 < s.x + 0.5 ? s.x - p.w - 0.01 : s.x + 1.01;
        for (const e of G.ents) if (!e.dead && !e.harmless && overlap(e, box)) { killEnemy(G, e, true, 200); ev(G, 'crush'); }
      }
      for (let y = s.y0; y <= s.y1; y++) setTile(G, s.x, y, want ? T.SHUTTER : T.EMPTY);
      if (s.x > G.cam - 2 && s.x < G.cam + VW + 2) ev(G, want ? 'shutter' : 'shutterup');
    }
  }
  // çürük tahtalar: oyuncu basınca yarım saniye sonra çöker, beş saniye sonra yerine gelir
  function updateCrumbles(G, dt) {
    for (const [i, c] of G.crumb) {
      c.t += dt;
      if (!c.gone && c.t > 0.5) {
        c.gone = true; c.t = 0; setTile(G, c.x, c.y, T.EMPTY);
        for (let k = 0; k < 3; k++) G.fx.push({ k: 'plank', x: c.x + 0.2 + k * 0.3, y: c.y + 0.3, vx: (k - 1) * 1.5, vy: -2 - k, t: 0, r: k });
        ev(G, 'crack');
      } else if (c.gone && c.t > 5) {
        const box = { x: c.x, y: c.y, w: 1, h: 1 };
        if (!overlap(G.player, box) && !G.ents.some((e) => !e.dead && overlap(e, box))) { setTile(G, c.x, c.y, T.CRUMBLE); G.crumb.delete(i); }
      }
    }
  }

  // ---------------- fanlar ----------------
  function updateFans(G, dt) {
    G.fanT += dt;
    const P = G.fanPulse ? FAN.pPeriod : FAN.period, ON = G.fanPulse ? FAN.pOn : FAN.on;
    for (const f of G.fans) {
      f.on = !(f.cyc || G.fanPulse) || (G.fanT % P) < ON;
      // hava sütunu ilk katı karoda biter (açılan kapak sütunu uzatır)
      let k = 0;
      while (k < FAN.reach && !SOLID[tile(G, f.x, f.y - 1 - k)] && f.y - 1 - k >= 0) k++;
      f.reach = k;
      f.spin = approach(f.spin, f.on ? 1 : 0, dt * 2.5);
    }
  }
  // b gövdesinin fan sütunundaki itiş gücü (0..1)
  function fanAt(G, b) {
    let best = 0;
    for (const f of G.fans) {
      if (!f.on || b.x + b.w <= f.x + 0.05 || b.x >= f.x + 0.95) continue;
      // sütunun tepesinde baş için pay kalır: süzülen oyuncu tavana sürtünmez
      const d = f.y - (b.y + b.h), R = f.reach - 1.8;
      if (d < -0.05 || d > R) continue;
      const s = d < R - 2 ? 1 : Math.max(0, (R - d) / 2);
      if (s > best) best = s;
    }
    return best;
  }
  // fan sütununda yerçekimi azalır, hız yukarı doğru (en çok cap) artar
  function fanVy(vy, s, dt) {
    let nv = vy + FAN.grav * dt;
    if (nv > -FAN.cap) nv = Math.max(-FAN.cap, nv - FAN.lift * s * dt);
    return Math.min(PH.maxFall, nv);
  }

  // ---------------- kapaklar, tezgâh, sıcak kabinler ----------------
  // asma tavan / yükseltilmiş taban kapağı: bitişik kapak karolarının hepsi birden açılır
  function openPanel(G, tx, ty) {
    const q = [[tx, ty]];
    let n = 0;
    while (q.length) {
      const [x, y] = q.pop();
      if (tile(G, x, y) !== T.PANEL) continue;
      setTile(G, x, y, T.EMPTY); n++;
      G.fx.push({ k: 'panel', x: x + 0.5, y: y + 0.5, vx: (G.rand() - 0.5) * 3, vy: -3 - G.rand() * 2, t: 0, r: G.rand() * 6 });
      q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    if (n) ev(G, 'panel');
    return n;
  }
  // ayakların altındaki tezgâhın en sol karosu (yoksa -1)
  function cartUnder(G, b) {
    const ty = Math.floor(b.y + b.h + 0.02);
    for (let tx = Math.floor(b.x + 0.001); tx <= Math.floor(b.x + b.w - 0.001); tx++) {
      if (tile(G, tx, ty) === T.CART) { let x = tx; while (tile(G, x - 1, ty) === T.CART) x--; return ty * G.W + x; }
    }
    return -1;
  }
  // ezilen bug'ın yakınındaki sıcak kabin soğur (bağlı kabinlerin hepsi)
  function coolNear(G, cx, cy) {
    if (!G.hasHot) return;
    let n = 0;
    for (let ty = Math.floor(cy - 10); ty <= Math.floor(cy + 1); ty++) {
      for (let tx = Math.floor(cx - 3.5); tx <= Math.floor(cx + 3.5); tx++) {
        if (tile(G, tx, ty) !== T.HOT) continue;
        const q = [[tx, ty]];
        while (q.length) {
          const [x, y] = q.pop();
          if (tile(G, x, y) !== T.HOT) continue;
          setTile(G, x, y, T.COOL); n++;
          G.fx.push({ k: 'steam', x: x + 0.5, y: y + 0.2, t: -0.05 * n });
          q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
      }
    }
    if (n) { addScore(G, 500, cx, cy - 1.5); ev(G, 'cool'); }
  }

  // ---------------- olaylar / efektler ----------------
  function ev(G, name, extra) { G.ev.push(extra ? Object.assign({ e: name }, extra) : { e: name }); }
  function addScore(G, n, x, y, label) {
    G.S.score += n;
    if (x !== undefined) G.fx.push({ k: 'score', x, y, t: 0, text: label || String(n) });
  }
  function addSimit(G, n) {
    G.S.simit += n; G.S.score += 100 * n;
    ev(G, 'simit');
    while (G.S.simit >= 100) { G.S.simit -= 100; oneUp(G); }
  }
  function oneUp(G, x, y) {
    G.S.lives = Math.min(99, G.S.lives + 1);
    ev(G, 'oneup');
    if (x !== undefined) G.fx.push({ k: 'score', x, y, t: 0, text: '1UP' });
  }

  // ---------------- bloklar ----------------
  function bumpTile(G, tx, ty) {
    const t = tile(G, tx, ty), p = G.player, i = ty * G.W + tx;
    if (t === T.MULTI) {
      // ilk vuruştan sonra 4 saniye boyunca (en çok 10) her vuruşta simit; sonra boşalır
      let m = G.multi.get(i);
      if (!m) { m = { n: 0, t0: G.t }; G.multi.set(i, m); }
      m.n++;
      G.fx.push({ k: 'simitpop', x: tx, y: ty - 1, t: 0 });
      addSimit(G, 1);
      if (m.n >= 10 || G.t - m.t0 > 4) setTile(G, tx, ty, T.USED);
      G.bumps.push({ tx, ty, t: 0 });
      bumpAbove(G, tx, ty);
      ev(G, 'bump');
      return;
    }
    if (t === T.PANEL) { openPanel(G, tx, ty); bumpAbove(G, tx, ty); return; }   // asma tavan / taban kapağı
    if (t === T.HIDDEN) {
      setTile(G, tx, ty, T.BLOCK);
      ev(G, 'secret');
      bumpTile(G, tx, ty);
      return;
    }
    if (t === T.BLOCK) {
      const c = G.content.get(i);
      setTile(G, tx, ty, T.USED);
      G.content.delete(i);
      G.bumps.push({ tx, ty, t: 0 });
      if (c === 'simit') {
        G.fx.push({ k: 'simitpop', x: tx, y: ty - 1, t: 0 });
        addSimit(G, 1);
      } else {
        const kind = c === 'guc' ? (G.S.power ? 'laptop' : 'cay') : c;
        G.items.push({ kind, x: tx + 0.0625, y: ty, w: 0.875, h: 0.875, vx: 0, vy: 0, rise: ty - 0.875, state: 'rise', t: 0 });
        ev(G, 'item');
      }
      bumpAbove(G, tx, ty);
      ev(G, 'bump');
    } else if (t === T.CRACK) {
      if (G.S.power) {
        setTile(G, tx, ty, T.EMPTY);
        for (let k = 0; k < 4; k++) {
          G.fx.push({ k: 'debris', x: tx + 0.25 + (k % 2) * 0.5, y: ty + 0.25 + (k >> 1) * 0.5, vx: (k % 2 ? 1 : -1) * (2.5 + G.rand()), vy: -9 - (k >> 1 ? 0 : 3), t: 0 });
        }
        addScore(G, 50);
        bumpAbove(G, tx, ty);
        ev(G, 'break');
      } else {
        G.bumps.push({ tx, ty, t: 0 });
        bumpAbove(G, tx, ty);
        ev(G, 'bump');
      }
    } else {
      ev(G, 'thunk');
    }
    void p;
  }
  // Bloğa alttan vurulunca üstündeki düşmanlar uçar, simit toplanır.
  function bumpAbove(G, tx, ty) {
    for (const e of G.ents) {
      if (!e.dead && Math.abs(e.y + e.h - ty) < 0.15 && e.x < tx + 1 && e.x + e.w > tx) killEnemy(G, e, true);
    }
    const ci = (ty - 1) * G.W + tx;
    if (ty > 0 && G.coins[ci]) { G.coins[ci] = 0; G.fx.push({ k: 'simitpop', x: tx, y: ty - 1, t: 0 }); addSimit(G, 1); }
    for (const it of G.items) {
      if (it.state === 'move' && Math.abs(it.y + it.h - ty) < 0.15 && it.x < tx + 1 && it.x + it.w > tx) { it.vy = -9; it.vx = it.x + it.w / 2 < tx + 0.5 ? -Math.abs(it.vx || 3) : Math.abs(it.vx || 3); }
    }
  }

  // ---------------- düşmanlar ----------------
  function makeEnemy(G, kind, x, y, s) {
    const e = { kind, x: x + 0.0625, y: y + 0.125, w: 0.875, h: 0.875, vx: 0, vy: 0, t: G.rand() * 3, dead: false, deadT: 0, flip: false, onGround: false, minion: false, st: 0 };
    if (kind === 'bug') e.vx = -2;
    if (s && s.sleep) { e.state = 'sleep'; e.vx = 0; }            // bankta çay bardağıyla uyuyan bug
    if (s && s.meet) { e.state = 'meet'; e.vx = 0; }             // toplantı masasındaki bug'lar
    if (s && s.slide) { e.slide = true; e.vx = 4.2; }            // kablo kanalında sağa kayan bug (oyuncunun önüne düşer)
    if (s && s.polite) e.polite = true;
    if (kind === 'hirsiz') {
      // simit hırsızı martı: zararsız; altındaki simiti oyuncu yaklaşınca kapıp kaçar
      e.w = 1; e.h = 0.75; e.homeX = x; e.homeY = y; e.state = 'perch'; e.harmless = true; e.face = -1;
      for (let ty = y + 1; ty < Math.min(G.H, y + 12); ty++) if (G.coins[ty * G.W + x]) { e.target = { i: ty * G.W + x, x, y: ty }; break; }
    }
    else if (kind === 'virus') e.vx = -1.5;
    else if (kind === 'spam') { e.vx = -2.4; e.baseY = y + 0.125; e.h = 0.75; }
    else if (kind === 'leap') { e.vy = -(17.5 + (x % 3) * 1.2); e.vx = -(1.8 + (x % 2) * 1.2); e.h = 0.75; }
    else if (kind === 'marti') { e.w = 1; e.h = 0.75; e.homeX = x; e.homeY = y; e.state = 'hover'; e.cd = 0.5; e.vx = -1.2; }
    return e;
  }
  function killEnemy(G, e, flip, scoreAt) {
    if (e.dead) return;
    e.dead = true; e.flip = flip; e.deadT = 0;
    if (flip) { e.vy = -8; e.vx = (G.player.x < e.x ? 2 : -2); }
    const pts = scoreAt || 100;
    addScore(G, pts, e.x + e.w / 2, e.y);
    ev(G, flip ? 'kick' : 'stomp');
    coolNear(G, e.x + e.w / 2, e.y + e.h);
  }
  // iki nokta arasında aynı satırda katı karo yok mu (kapalı cam kapının ardındakiler oyuncuyu görmez)
  function clearRow(G, xa, xb, ty) {
    for (let tx = Math.floor(Math.min(xa, xb)); tx <= Math.floor(Math.max(xa, xb)); tx++) if (solid(G, tx, ty)) return false;
    return true;
  }
  // uyuyan bug uyanır: irkilip zıplar, çay bardağı düşer, sonra oyuncudan kaçar
  function wakeBug(G, e) {
    if (e.state !== 'sleep') return;
    e.state = 'jolt'; e.st = 0; e.vy = -7.5; e.vx = 0; e.onGround = false;
    for (const d of G.decor) if (d.k === 'bank' && Math.abs(d.x - e.x) < 2) d.cup = false;   // bardak bankta değil artık
    G.fx.push({ k: 'bardak', x: e.x + e.w / 2 + 0.3, y: e.y + 0.1, vx: 1.6, vy: -5, t: 0, y0: e.y + e.h });
    ev(G, 'wake');
  }

  function updateEnemy(G, e, dt) {
    e.t += dt;
    if (e.dead) {
      e.deadT += dt;
      if (e.flip) { e.vy = Math.min(PH.maxFall, e.vy + 40 * dt); e.x += e.vx * dt; e.y += e.vy * dt; }
      return e.deadT < (e.flip ? 2 : 0.5);
    }
    const p = G.player;
    const toward = p.x + p.w / 2 < e.x + e.w / 2 ? -1 : 1;
    switch (e.kind) {
      case 'bug': case 'virus':
        e.st += dt;
        if (e.state === 'sleep') {
          walker(G, e, dt, true);
          if (!p.dead && Math.abs(p.x - e.x) < 4.2 && Math.abs(p.y - e.y) < 3) wakeBug(G, e);
        } else if (e.state === 'jolt') {
          walker(G, e, dt, true);
          if (e.onGround && e.st > 0.2) { e.state = 'flee'; e.st = 0; e.vx = -toward * 5.5; }
        } else if (e.state === 'flee') {
          const v0 = e.vx;
          walker(G, e, dt, true);
          // kaçarken duvara ya da kenara gelince ya da bir süre sonra kendine gelir, oyuncuya döner
          if (e.vx !== v0 || e.st > 1.3) { e.state = null; e.vx = toward * 2.2; }
        } else if (e.state === 'meet') {
          walker(G, e, dt, true);
          if (!p.dead && Math.abs(p.x - e.x) < 6.5 && Math.abs(p.y - e.y) < 4 && clearRow(G, e.x + e.w / 2, p.x + p.w / 2, Math.floor(e.y + e.h - 0.5))) {
            // masadakilerin hepsi aynı anda başını çevirir
            for (const o of G.ents) if (o.state === 'meet' && !o.dead && Math.abs(o.x - e.x) < 9) { o.state = 'look'; o.st = 0; }
            ev(G, 'look');
          }
        } else if (e.state === 'look') {
          walker(G, e, dt, true);
          if (e.st > 0.75) { e.state = null; e.vx = toward * 3.1; ev(G, 'charge'); }
        } else if (e.slide) {
          // kablo kanalında hızla kayar, kanal bitince düşer; yere inince sıradan bug olur
          const air = !e.onGround;
          walker(G, e, dt, false);
          if (!e.onGround) e.slid = true;
          if (e.slid && e.onGround && air) { e.slide = false; e.vx = toward * 2; }
        } else if (e.polite && politeWait(G, e)) {
          const v = e.vx; e.vx = 0; walker(G, e, dt, true); e.vx = v; e.waiting = true;
        } else { e.waiting = false; walker(G, e, dt, true); }
        break;
      case 'hirsiz': {
        e.st += dt;
        const c = e.target;
        if (e.state === 'perch') {
          e.x = e.homeX + Math.sin(e.t * 1.3) * 0.3; e.y = e.homeY + Math.sin(e.t * 3) * 0.12;
          if (c && !G.coins[c.i]) { e.state = 'flee'; e.st = 0; e.vx = 2.6; e.vy = -1.8; }          // oyuncu daha hızlıydı
          else if (!p.dead && (!c ? Math.abs(p.x - e.x) < 3 : p.x + p.w / 2 > c.x - 3.2)) { e.state = 'dive'; e.st = 0; ev(G, 'cawk'); }
        } else if (e.state === 'dive') {
          if (!c) { e.state = 'flee'; e.st = 0; e.vx = 2.6; e.vy = -1.8; break; }
          const tx = c.x + 0.5 - e.w / 2, ty = c.y + 0.5 - e.h / 2, dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
          e.face = dx < 0 ? -1 : 1;
          if (d < 10 * dt + 0.05 || !G.coins[c.i]) {
            if (G.coins[c.i]) { G.coins[c.i] = 0; e.carry = true; ev(G, 'cawk'); }
            e.state = 'flee'; e.st = 0; e.vx = 2.4; e.vy = -1.3;
          } else { e.x += dx / d * 10 * dt; e.y += dy / d * 10 * dt; }
        } else if (e.state === 'flee') {
          // simitle ağır ağır sağa ve yukarı: ezilecek kadar alçakta bir süre oyalanır
          e.face = 1; e.x += e.vx * dt; e.y += e.vy * dt;
          if (e.st > 1.1) e.vy = Math.max(-3.4, e.vy - 2.5 * dt);
          if (e.st > 7 || e.y < G.camY - 3) return false;
        } else if (e.state === 'bonk') {
          // ezildi: simitleri bırakır, takla atıp utanarak uçar gider
          e.vy = Math.min(4, e.vy + 14 * dt); e.x += e.vx * dt; e.y += e.vy * dt;
          if (e.st > 0.6) e.vy = Math.max(-5, e.vy - 30 * dt);
          if (e.st > 3.5) return false;
        }
        break;
      }
      case 'spam':
        e.x += e.vx * dt;
        e.y = e.baseY + Math.sin(e.t * 3) * 0.6;
        break;
      case 'leap':
        // raylardan sıçrayan bug: karolara takılmadan yay çizer, raylara geri düşer
        e.vy += LEAP_G * dt; e.x += e.vx * dt; e.y += e.vy * dt;
        if (e.vy > 0 && G.room && e.y > G.room.y0 + 13) return false;
        break;
      case 'marti': {
        e.cd -= dt;
        const pcx = p.x + p.w / 2, ecx = e.x + e.w / 2;
        if (e.state === 'hover') {
          e.x += e.vx * dt;
          if (Math.abs(e.x - e.homeX) > 1.5) e.vx = -Math.sign(e.x - e.homeX) * 1.2;
          e.y = e.homeY + Math.sin(e.t * 4) * 0.15;
          if (e.cd <= 0 && Math.abs(pcx - ecx) < 4.5 && p.y > e.y + 1 && !p.dead) {
            const dx = pcx - ecx, dy = (p.y + p.h / 2) - (e.y + e.h / 2), d = Math.hypot(dx, dy) || 1;
            e.state = 'dive'; e.vx = dx / d * 8; e.vy = dy / d * 8; ev(G, 'cawk');
          }
        } else if (e.state === 'dive') {
          e.x += e.vx * dt; e.y += e.vy * dt;
          if (e.y + e.h >= p.y + p.h - 0.1 || solid(G, Math.floor(e.x + e.w / 2), Math.floor(e.y + e.h + 0.1))) { e.state = 'rise'; e.vy = -3.5; }
        } else {
          e.x += e.vx * 0.6 * dt; e.y += e.vy * dt;
          if (e.y <= e.homeY) { e.y = e.homeY; e.state = 'hover'; e.homeX = e.x; e.vx = e.vx > 0 ? 1.2 : -1.2; e.cd = 1.4; }
        }
        break;
      }
    }
    if (e.y > G.H + 2 || e.y > deathY(G, e.x) + 2) return false;
    if (e.x < G.cam - 6 || e.x > G.W + 2) return false;
    return true;
  }

  // Yürüyen düşman: duvarda ve kenarda döner.
  function walker(G, e, dt, edgeTurn) {
    // hareketli platformun (terazi kefesi, sepet) üstündeki bug onunla taşınır
    if (e.plat && e.onGround && G.plats.includes(e.plat)) { e.x += e.plat.dx; e.y = e.plat.y - e.h; }
    e.vy = Math.min(PH.maxFall, e.vy + PH.gFall * dt);
    // fanın üstüne gelen bug havalanır (yerçekimine karşı biraz zayıf: süzülüp geri düşer)
    if (G.fans.length) { const s = fanAt(G, e); if (s) e.vy = Math.max(-5, e.vy - 95 * s * dt); }
    const hx = moveX(G, e, e.vx * dt);
    if (hx) e.vx = -e.vx;
    else {
      const fx = e.vx > 0 ? e.x + e.w + 0.02 : e.x - 0.02;
      if (tile(G, Math.floor(fx), Math.floor(e.y + e.h - 0.1)) === T.SPIKE) e.vx = -e.vx;
    }
    const r = moveY(G, e, e.vy * dt, true);
    e.onGround = r.down;
    e.plat = r.down ? r.plat : null;
    if (r.down || r.up) e.vy = 0;
    if (edgeTurn && e.onGround) {
      const fx = e.vx > 0 ? e.x + e.w + 0.05 : e.x - 0.05;
      const fy = Math.floor(e.y + e.h + 0.1);
      const tb = tile(G, Math.floor(fx), fy);
      const onPlat = r.plat;
      if (!SOLID[tb] && tb !== T.ONEWAY && !onPlat) e.vx = -e.vx;
    }
  }

  // Dikey kamera: düz bantlarda sabit; tırmanış ve iniş boşluklarında oyuncunun ayakları ekranın
  // 10. satırı civarında kalacak şekilde yukarı-aşağı yumuşakça kayar.
  function updateCamY(G, dt) {
    const p = G.player, cx = colAt(G, p.x + p.w / 2);
    const lo = G.camLo[cx], hi = G.camHi[cx];
    // el yapımı bölümlerde kamera son basılan zemine göre ayarlanır (zıplarken oynamaz): ayaklar 12. satırda
    let target = lo === hi ? lo : G.hand ? (p.gFeet !== undefined ? p.gFeet : p.y + p.h) - G.camOff[cx] : p.y + p.h - 10;
    target = clamp(target, lo, hi);
    const d = target - G.camY;
    G.camY += clamp(d * Math.min(1, 6 * dt), -14 * dt, 14 * dt);
    // oyuncu ekrandan çıkmasın: boşlukta tamamen görünür kalır, düz bantta yalnız yukarı zıplayınca izlenir
    if (lo !== hi) G.camY = clamp(G.camY, p.y + p.h - VHT + 1, p.y - 0.5);
    else G.camY = Math.min(G.camY, p.y - 0.5);
    G.camY = clamp(G.camY, 0, G.H - VHT);
  }

  // ---------------- metro geçişi ----------------
  function updateWarp(G, dt) {
    const w = G.warp, p = G.player;
    w.t += dt;
    p.vx = 0; p.vy = 0; p.walkT += dt * 3;
    if (w.kind === 'in') {
      if (w.t < 0.6 && G.room.under) p.y += 2.3 * dt; // merdivenden aşağı (sokakta durakta bekler)
      if (!w.moved && w.t >= 0.85) {
        w.moved = true; G.area = 'room'; w.clip = null;
        p.x = G.room.x0 + 2.1; p.y = G.room.y0 + 2.05; p.onGround = false; p.plat = null; p.carry = 0; p.carryT = null;
        for (const pl of G.plats) if (pl.train) {
          pl.x = pl.a; pl.y = pl.ya; pl.v = 0; pl.state = 'wait'; pl.wt = 0;
          if (!G.room.under) { p.y = pl.ya - p.h; p.onGround = true; } // sokakta durağın üstünde başla
        }
        G.cam = G.room.x0; G.camY = G.room.y0; G.room.used = true;
      }
      if (w.t >= 1.1) G.warp = null;
    } else {
      if (!w.moved && w.t < 0.55) {
        if (w.fall) p.y += 7 * dt;                 // raylara düştü: karanlığa kaybolur
        else { p.x += 2.2 * dt; p.y -= 0.9 * dt; } // yürüyen merdivene bin
      }
      if (!w.moved && w.t >= 0.85) {
        w.moved = true; G.area = 'main';
        const R = G.metroOut || G.metroIn;
        p.x = R.x + 1 - p.w / 2; p.y = R.y + 1; p.plat = null; p.carry = 0; p.carryT = null;
        w.rise = R.y + 1 - p.h; w.clip = { y1: R.y + 1 };
        if (!G.room.under) { p.y = w.rise; w.clip = null; } // sokakta duraktan yürüyerek çıkar
        p.gFeet = w.rise + p.h;
        G.cam = clamp(p.x - 6.5, 0, G.mainW - VW);
        { const cx = colAt(G, p.x + p.w / 2); G.camY = clamp(w.rise + p.h - G.camOff[cx], G.camLo[cx], G.camHi[cx]); }
        for (const s of G.spawns) if (!s.done && s.x <= G.cam - 2) s.done = true;
      }
      if (w.moved) {
        p.y = Math.max(w.rise, p.y - 2.8 * dt);
        if (p.y <= w.rise && w.t > 1.5) { p.onGround = true; G.warp = null; }
      }
    }
  }

  // ---------------- oyuncu ----------------
  function hurt(G) {
    const p = G.player;
    if (p.inv > 0 || p.star > 0 || p.dead || G.phase !== 'play') return;
    if (G.S.power > 0) {
      G.S.power = G.S.power === 2 ? 1 : 0;
      if (!G.S.power) { const bottom = p.y + p.h; p.h = SMALL_H; p.y = bottom - p.h; }
      p.inv = 2; p.growT = 0.6;
      ev(G, 'shrink');
    } else die(G);
  }
  function die(G, fell) {
    const p = G.player;
    if (p.dead) return;
    p.dead = true; p.vx = 0; p.vy = fell ? 0 : -13; p.inv = 0; p.star = 0;
    G.phase = 'dying'; G.dieT = 0; G.S.power = 0;
    ev(G, 'die');
  }
  function powerUp(G, kind, it) {
    const p = G.player;
    const cx = it.x + it.w / 2, cy = it.y;
    if (kind === 'cay' || kind === 'laptop') {
      const before = G.S.power;
      if (kind === 'cay') G.S.power = Math.max(1, G.S.power);
      else G.S.power = 2;
      if (G.S.power !== before) {
        if (p.h < BIG_H) { const bottom = p.y + p.h; p.h = BIG_H; p.y = bottom - p.h; if (headBlocked(G, p)) { p.h = SMALL_H; p.y = bottom - p.h; G.pendingGrow = true; } }
        p.growT = 0.6;
      }
      addScore(G, 1000, cx, cy);
      ev(G, 'power');
    } else if (kind === 'kahve') {
      p.star = STAR_TIME; addScore(G, 1000, cx, cy); ev(G, 'star');
    } else if (kind === 'disket') {
      oneUp(G, cx, cy);
    }
  }
  function headBlocked(G, b) {
    const x0 = Math.floor(b.x + 0.001), x1 = Math.floor(b.x + b.w - 0.001);
    const y0 = Math.floor(b.y + 0.001), y1 = Math.floor(b.y + b.h - 0.001);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (solid(G, x, y)) return true;
    return false;
  }

  function dust(G, x, y, vx) {
    if (G.fx.length > 80) return;
    G.fx.push({ k: 'dust', x, y: y - 0.15, vx, t: 0, r: 0.8 + G.rand() * 0.5 });
  }
  // ezilme/esneme yayı: sq>0 basık, sq<0 uzun
  function springSquash(p, dt) {
    const steps = Math.max(1, Math.ceil(dt / 0.005)), h = dt / steps;
    for (let i = 0; i < steps; i++) { p.sqv += (-520 * p.sq - 24 * p.sqv) * h; p.sq += p.sqv * h; }
    if (Math.abs(p.sq) < 0.002 && Math.abs(p.sqv) < 0.02) { p.sq = 0; p.sqv = 0; }
  }

  function updatePlayer(G, inp, dt) {
    const p = G.player, S = G.S;
    if (p.spin) {
      // döner kapıda: girdi yok, kapıyla dönüp öbür yandan çıkar
      const sp = p.spin, d = sp.d;
      sp.t += dt; p.vx = 0; p.vy = 0;
      const k = Math.min(1, sp.t / 0.9), a = sp.dir > 0 ? d.x - p.w : d.x + d.w, b = sp.dir > 0 ? d.x + d.w + 0.05 : d.x - p.w - 0.05;
      p.x = a + (b - a) * k;
      if (k >= 1) { p.spin = null; p.vx = sp.dir * 4; }
      return;
    }
    const onTrain = p.plat && p.plat.train ? p.plat : null;
    const jumpPressed = inp.jump && !G.prev.jump;
    const runPressed = inp.run && !G.prev.run;
    if (jumpPressed) p.buf = PH.buffer; else p.buf = Math.max(0, p.buf - dt);
    p.inv = Math.max(0, p.inv - dt);
    if (p.star > 0) { p.star -= dt; if (p.star <= 0) { p.star = 0; ev(G, 'starend'); } }
    p.growT = Math.max(0, p.growT - dt);
    p.shootCD = Math.max(0, p.shootCD - dt);
    p.dropT = Math.max(0, p.dropT - dt);
    if (G.pendingGrow && S.power) {
      const bottom = p.y + p.h; p.h = BIG_H; p.y = bottom - p.h;
      if (headBlocked(G, p)) { p.h = SMALL_H; p.y = bottom - p.h; } else G.pendingGrow = false;
    }

    // yatay
    const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    const max = inp.run ? PH.run : PH.walk;
    p.skid = false;
    p.dustT = Math.max(0, p.dustT - dt);
    if (dir && p.onGround && Math.abs(p.vx) < 0.3 && inp.run) { dust(G, p.x + p.w / 2 - dir * 0.3, p.y + p.h, -dir * 1.6); dust(G, p.x + p.w / 2 - dir * 0.6, p.y + p.h, -dir * 2.6); }
    if (dir) {
      if (p.onGround && p.vx * dir < -0.5) {
        p.vx += dir * PH.skid * dt; p.skid = true;
        if (p.dustT <= 0) { p.dustT = 0.07; dust(G, p.x + p.w / 2 + dir * 0.35, p.y + p.h, dir * 1.2); }
      }
      else if (p.vx * dir < max) {
        const sp = p.vx * dir, acc = !p.onGround ? PH.accA : sp < PH.walk ? PH.accG : PH.accRun;
        p.vx = dir * Math.min(max, sp + acc * dt);
      }
      else p.vx = approach(p.vx, dir * max, (p.onGround ? PH.fric : 6) * dt);
      if (p.onGround || Math.sign(p.vx) === dir) p.face = dir;
    } else if (p.onGround) {
      p.vx = approach(p.vx, 0, PH.fric * dt);
    } else {
      p.vx = approach(p.vx, 0, 3 * dt);
    }

    // aşağı + ince platform: aşağı in
    if (inp.down && p.onGround && !dir) {
      const ty = Math.floor(p.y + p.h + 0.05);
      const x0 = Math.floor(p.x + 0.001), x1 = Math.floor(p.x + p.w - 0.001);
      let thin = true;
      for (let tx = x0; tx <= x1; tx++) if (tile(G, tx, ty) !== T.ONEWAY && tile(G, tx, ty) !== T.EMPTY) thin = false;
      if (thin && (tile(G, x0, ty) === T.ONEWAY || tile(G, x1, ty) === T.ONEWAY || p.plat)) { p.dropT = 0.25; p.onGround = false; p.plat = null; p.y += 0.05; }
      // yükseltilmiş taban / asma tavan kapağının üstünde aşağı: kapak açılır, aşağı düşülür
      for (let tx = x0; tx <= x1; tx++) if (tile(G, tx, ty) === T.PANEL && openPanel(G, tx, ty)) { p.onGround = false; p.plat = null; }
    }

    // zıplama
    if (p.onGround) p.coyote = PH.coyote; else p.coyote = Math.max(0, p.coyote - dt);
    if (p.buf > 0 && p.coyote > 0) {
      p.vy = -jumpSpeed(p.vx);
      p.jumping = true; p.onGround = false; p.coyote = 0; p.buf = 0; p.plat = null;
      p.sq = -0.32; p.sqv = 0;
      ev(G, p.h > 1 ? 'jumpbig' : 'jump');
    }
    if (!inp.jump) p.jumping = false;
    let g;
    // tezgâhtan sekişte tuş bırakılsa da yükseliş kısalmaz
    if (p.vy < 0) g = p.jumping || p.bounce ? PH.gHold : PH.gRel;
    else { g = PH.gFall; p.bounce = false; }
    const fs = G.fans.length ? fanAt(G, p) : 0;
    p.inFan = fs > 0;
    if (fs) p.vy = fanVy(p.vy, fs, dt);
    else p.vy = Math.min(PH.maxFall, p.vy + g * dt);

    // kod fırlatma
    if (runPressed && S.power === 2 && p.shootCD <= 0 && G.shots.length < 2) {
      G.shots.push({ x: p.face > 0 ? p.x + p.w - 0.1 : p.x - 0.4, y: p.y + 0.35, w: 0.5, h: 0.5, vx: p.face * 11, vy: 3, t: 0 });
      p.shootCD = 0.18; ev(G, 'shoot');
    }

    // platformla taşın
    if (p.plat) {
      const pl = p.plat;
      if (p.x < pl.x + pl.w && p.x + p.w > pl.x && Math.abs(p.y + p.h - (pl.y - pl.dy)) < 0.05) {
        moveX(G, p, pl.dx);
        p.y = pl.y - p.h;
        if (headBlocked(G, p)) { p.y += 0.02; }
      } else p.plat = null;
    }

    // hareket (araçtan zıplayınca aracın hızı havada da sürer: p.carry). Havadayken aracın hızını izler,
    // böylece hızlanan ya da yavaşlayan araca geri inilir; bloğa yandan çarpmak bunu bozmaz (kolay bonus).
    if (p.carryT && !p.onGround) p.carry = p.carryT.v;
    const hx = moveX(G, p, (p.vx + (p.carry || 0)) * dt);
    if (hx) p.vx = 0;
    // kamera sol sınırı ve bölüm sonu
    const left = G.area === 'room' ? G.room.x0 : G.cam, right = (G.area === 'room' ? G.room.x1 : G.mainW) - p.w;
    if (p.x < left) { p.x = left; if (p.vx < 0) p.vx = 0; }
    if (p.x > right) p.x = right;

    p.prevBottom = p.y + p.h;
    const wasGround = p.onGround, fallV = p.vy;
    const r = moveY(G, p, p.vy * dt, p.dropT <= 0);
    if (r.up) {
      // köşe düzeltmesi: başın kenarı bloğa hafifçe değdiyse kenara kaydır
      let fixed = false;
      if (r.tiles.length === 1) {
        const tx = r.tiles[0];
        const ovL = p.x + p.w - tx, ovR = tx + 1 - p.x;
        if (ovL > 0 && ovL < 0.3 && !solid(G, tx - 1, r.ty)) { p.x = tx - p.w; fixed = true; }
        else if (ovR > 0 && ovR < 0.3 && !solid(G, tx + 1, r.ty)) { p.x = tx + 1; fixed = true; }
        if (fixed) p.y -= 0; // devam et
      }
      if (!fixed) {
        // ortadaki karoya vur
        const cx = p.x + p.w / 2;
        let best = r.tiles[0], bd = 9;
        for (const tx of r.tiles) { const d = Math.abs(tx + 0.5 - cx); if (d < bd) { bd = d; best = tx; } }
        bumpTile(G, best, r.ty);
        p.vy = 1; p.jumping = false;
      }
    }
    p.onGround = r.down;
    if (r.down) {
      // trene geri inince hız trenin olur; perona inince ivme kayarak söner
      if (p.carry) { if (!(r.plat && r.plat.train)) p.vx += p.carry; p.carry = 0; }
      p.carryT = null;
      p.vy = 0; p.plat = r.plat;
      if (!wasGround) {
        G.combo = 0;
        // iniş: ezilip toparlanma ve iki yana toz
        if (fallV > 4) {
          p.sq = Math.min(0.55, 0.12 + fallV / 30); p.sqv = 0;
          if (fallV > 9) { dust(G, p.x + 0.05, p.y + p.h, -1.8); dust(G, p.x + p.w - 0.05, p.y + p.h, 1.8); }
        }
      }
    }
    else if (!r.down && wasGround && p.vy >= 0) p.plat = null;
    // simitçi tezgâhının tentesi: üstüne inen yükseğe seker; ilk inişte tezgâhtan üç simit fırlar
    if (r.down && !p.dead) {
      const ct = cartUnder(G, p);
      if (ct >= 0) {
        p.vy = -CART_V; p.onGround = false; p.bounce = true; p.jumping = inp.jump; p.plat = null;
        p.sq = 0.45; p.sqv = -14;
        G.cartT.set(ct, G.t);
        if (!G.carts.has(ct)) {
          G.carts.add(ct);
          const cx = ct % G.W, cy = Math.floor(ct / G.W);
          for (let k = 0; k < 3; k++) G.fx.push({ k: 'simitpop', x: cx + k * 0.5, y: cy - 1, t: 0 });
          addSimit(G, 3);
        }
        ev(G, 'boing');
      }
    }
    if (p.onGround) p.gFeet = p.y + p.h;
    if (r.down && !p.dead) {
      // çürük tahtaya basıldı
      const ty = Math.floor(p.y + p.h + 0.02);
      for (let tx = Math.floor(p.x + 0.001); tx <= Math.floor(p.x + p.w - 0.001); tx++) {
        const i = ty * G.W + tx;
        if (tile(G, tx, ty) === T.CRUMBLE && !G.crumb.has(i)) { G.crumb.set(i, { x: tx, y: ty, t: 0, gone: false }); ev(G, 'creak'); }
      }
      // yüksekten terazi kefesine düşmek: sapan; çaycının tepsisine ilk binişte çay ikramı
      if (r.plat && r.plat.kind === 'pan' && fallV > 10) r.plat.sc.snap = 0.4;
      if (r.plat && r.plat.kind === 'tray' && !r.plat.npc.served) { r.plat.npc.served = true; powerUp(G, 'cay', { x: p.x, y: p.y - 0.5, w: 1, h: 1 }); ev(G, 'serve'); }
    }
    if (p.onGround && p.plat === null) G.combo = 0;
    if (onTrain && p.plat !== onTrain && !p.onGround) { p.carry = onTrain.v; p.carryT = onTrain; }

    // yürüme animasyonu
    if (p.onGround) p.walkT += Math.abs(p.vx) * dt; else p.walkT = 0;
    springSquash(p, dt);

    // diken
    if (!p.dead) {
      const x0 = Math.floor(p.x + 0.1), x1 = Math.floor(p.x + p.w - 0.1);
      const y0 = Math.floor(p.y), y1 = Math.floor(p.y + p.h - 0.01);
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
        if (tile(G, tx, ty) === T.SPIKE && p.y + p.h > ty + 0.45) { if (p.star <= 0 && p.inv <= 0) { hurt(G); if (!p.dead) p.vy = -9; } }
      }
    }
    // simitler
    {
      const x0 = Math.floor(p.x + 0.05), x1 = Math.floor(p.x + p.w - 0.05);
      const y0 = Math.floor(p.y + 0.05), y1 = Math.floor(p.y + p.h - 0.05);
      for (let ty = Math.max(0, y0); ty <= Math.min(G.H - 1, y1); ty++) for (let tx = x0; tx <= x1; tx++) {
        const i = ty * G.W + tx;
        if (G.coins[i]) { G.coins[i] = 0; addSimit(G, 1); G.fx.push({ k: 'spark', x: tx + 0.5, y: ty + 0.5, t: 0 }); }
      }
    }
    // sıcak kabin: hangi yandan değilirse değilsin yakar ve geri iter
    if (G.hasHot && !p.dead && p.star <= 0 && p.inv <= 0) {
      const m = 0.06, x0 = Math.floor(p.x - m), x1 = Math.floor(p.x + p.w + m - 1e-9), y0 = Math.floor(p.y - m), y1 = Math.floor(p.y + p.h + m - 1e-9);
      hot: for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
        if (tile(G, tx, ty) !== T.HOT) continue;
        hurt(G);
        if (!p.dead) { p.vx = (p.x + p.w / 2 < tx + 0.5 ? -1 : 1) * 5; p.vy = Math.min(p.vy, -8); p.onGround = false; }
        G.fx.push({ k: 'steam', x: p.x + p.w / 2, y: p.y + p.h / 2, t: 0 });
        ev(G, 'sizzle');
        break hot;
      }
    }
    // altın simitler: bölüm başına üç tane; koşu kaydına işlenir (ölünce geri gelmez)
    for (const gd of G.golds) {
      if (gd.taken || !overlap(p, gd)) continue;
      gd.taken = true;
      S.golds = S.golds || {};
      S.golds[G.idx] = (S.golds[G.idx] || 0) | (1 << gd.k);
      addScore(G, 1000, gd.x + 0.4, gd.y);
      G.fx.push({ k: 'goldpop', x: gd.x + 0.4, y: gd.y + 0.4, t: 0 });
      ev(G, 'gold', { idx: G.idx, k: gd.k });
    }
    // hatıra parçası: her dünyada bir tane
    if (G.piece && !G.piece.taken && overlap(p, G.piece)) {
      G.piece.taken = true;
      S.pieces = S.pieces || [];
      S.pieces[G.world] = true;
      addScore(G, 2000, G.piece.x + 0.4, G.piece.y);
      G.fx.push({ k: 'spark', x: G.piece.x + 0.4, y: G.piece.y + 0.4, t: 0 });
      ev(G, 'piece', { world: G.world });
    }
    // çukura düştü
    if (p.y > deathY(G, p.x + p.w / 2)) die(G, true);
  }

  // ---------------- eşyalar / atışlar ----------------
  function updateItems(G, dt) {
    const p = G.player;
    G.items = G.items.filter((it) => {
      it.t += dt;
      if (it.state === 'rise') {
        it.y -= 1.6 * dt;
        if (it.y <= it.rise) {
          it.y = it.rise; it.state = 'move';
          if (it.kind === 'cay' || it.kind === 'disket') it.vx = 3;
          if (it.kind === 'kahve') { it.vx = 3.5; it.vy = -8; }
        }
      } else {
        if (it.kind !== 'laptop' || it.vy !== 0 || !solid(G, Math.floor(it.x + 0.4), Math.floor(it.y + it.h + 0.05))) {
          it.vy = Math.min(PH.maxFall, it.vy + (it.kind === 'kahve' ? 35 : PH.gFall) * dt);
          if (moveX(G, it, it.vx * dt)) it.vx = -it.vx;
          const r = moveY(G, it, it.vy * dt, true);
          if (r.down) it.vy = it.kind === 'kahve' ? -10 : 0;
          if (r.up) it.vy = 0;
        }
      }
      if (!p.dead && it.state === 'move' && overlap(p, it)) { powerUp(G, it.kind, it); return false; }
      if (it.y > G.H + 1 || it.y > deathY(G, it.x) + 1 || it.x < G.cam - 4) return false;
      return true;
    });
  }

  function updateShots(G, dt) {
    G.shots = G.shots.filter((s) => {
      s.t += dt;
      s.vy = Math.min(14, s.vy + 45 * dt);
      if (moveX(G, s, s.vx * dt)) { G.fx.push({ k: 'puff', x: s.x + 0.25, y: s.y + 0.25, t: 0 }); ev(G, 'thunk'); return false; }
      const r = moveY(G, s, s.vy * dt, true);
      if (r.down) s.vy = -7.5;
      if (r.up) s.vy = 2;
      for (const e of G.ents) {
        if (!e.dead && !e.harmless && overlap(s, e)) { killEnemy(G, e, true, 200); G.fx.push({ k: 'puff', x: s.x + 0.25, y: s.y + 0.25, t: 0 }); return false; }
      }
      const b = G.boss;
      if (b && !b.dead && b.state !== 'intro' && overlap(s, b)) {
        G.fx.push({ k: 'puff', x: s.x + 0.25, y: s.y + 0.25, t: 0 });
        if (b.hurtT <= 0) damageBoss(G, 1 / 3, false);
        return false;
      }
      if (s.t > 2.5 || s.x < G.cam - 1 || s.x > G.cam + VW + 1 || s.y > G.H + 1) return false;
      return true;
    });
    G.bshots = G.bshots.filter((s) => {
      s.t += dt;
      if (s.g) s.vy = Math.min(PH.maxFall, s.vy + s.g * dt);
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.kind === 'drop' && s.y + s.h >= 12) { s.y = 12 - s.h; s.vy = 0; s.g = 0; }
      // kurulan kilit önce yalnız uyarıdır (arm saniye), sonra yakar
      if (!G.player.dead && !(s.arm && s.t < s.arm) && overlap(G.player, shrink(s, 0.1))) hurt(G);
      if (s.solidKill && solid(G, Math.floor(s.x + s.w / 2), Math.floor(s.y + s.h / 2))) return false;
      return s.t < (s.life || 5) && s.y < G.H + 1 && s.x > G.cam - 2 && s.x < G.cam + VW + 2;
    });
  }
  const shrink = (b, m) => ({ x: b.x + m, y: b.y + m, w: b.w - 2 * m, h: b.h - 2 * m });

  // ---------------- patronlar ----------------
  function spawnBoss(G) {
    const kind = G.bossKind, D = BOSS[kind], sp = G.bossSpawn;
    const a = G.arena;
    const b = {
      kind, x: sp.x + 0.5 - D.w / 2, y: 12 - D.h, w: D.w, h: D.h, vx: 0, vy: 0, hp: D.hp, maxHp: D.hp,
      hurtT: 0, flash: 0, state: 'intro', st: 0, t: 0, face: -1, onGround: true, dead: false,
      L: a.ax + 3, R: a.ax + 18, cyc: 0, phase: 0,
    };
    if (kind === 'spam' || kind === 'ddos' || kind === 'fidye') b.y = 3;
    if (kind === 'marti') { b.y = 3; b.x = b.R - b.w - 1; }
    if (kind === 'dongu') { b.y = 5.5; b.cx = (b.L + b.R) / 2 - b.w / 2; b.orb = 0; b.wv = 0.55; }
    if (kind === 'glitch') { b.state = 'intro'; }
    // Kral Bug'ın peşinden ayrılmayan küçük taklitçi: tacı da var, zıplayışı da; dövüşe karışmaz
    if (kind === 'kralbug') b.prince = { x: b.x + b.w + 0.6, y: 12 - 0.55, vy: 0, face: -1, t: 0, ground: true };
    G.boss = b;
    ev(G, 'bossintro');
  }

  function damageBoss(G, amount, stomp) {
    const b = G.boss;
    b.hp -= amount;
    b.flash = stomp ? 1 : 0.2;
    if (stomp) b.hurtT = 1.0;
    ev(G, 'bosshit');
    if (b.hp <= 0.001) {
      b.dead = true; b.state = 'dead'; b.vy = -10; b.vx = 0; b.hp = 0;
      G.bossDownT = 0; G.bshots = [];
      for (const e of G.ents) if (!e.dead) killEnemy(G, e, true);
      addScore(G, 5000, b.x + b.w / 2, b.y);
      G.shake = 0.6;
      ev(G, 'bossdown');
    }
  }

  function bossGravity(G, b, dt, g) {
    b.vy = Math.min(PH.maxFall, b.vy + (g || PH.gFall) * dt);
    const hx = moveX(G, b, b.vx * dt);
    const r = moveY(G, b, b.vy * dt, false);
    const landed = r.down && !b.onGround;
    b.onGround = r.down;
    if (r.down || r.up) b.vy = 0;
    return { hx, landed };
  }
  function minionCount(G) { let n = 0; for (const e of G.ents) if (!e.dead && e.minion) n++; return n; }
  function addMinion(G, kind, x, y, vx) {
    const e = makeEnemy(G, kind, Math.floor(x), Math.floor(y));
    e.x = x; e.y = y; e.minion = true;
    if (vx !== undefined) e.vx = vx;
    if (kind === 'spam') e.baseY = y;
    G.ents.push(e);
  }
  function bshot(G, o) { G.bshots.push(Object.assign({ w: 0.5, h: 0.5, vx: 0, vy: 0, g: 0, t: 0 }, o)); }
  // Kral Bug'ın tacı açılır, içinden n küçük bug iki yana fırlar
  function crownMinions(G, b, n) {
    const bcx = b.x + b.w / 2;
    for (let k = 0; k < n; k++) {
      const s = n === 1 ? (G.player.x < bcx ? -1 : 1) : (k ? 1 : -1);
      addMinion(G, 'bug', bcx - 0.44, b.y - 0.7, s * 2.4);
      G.ents[G.ents.length - 1].vy = -9;
    }
    b.crownT = b.t;
    ev(G, 'spawn');
  }
  function updatePrince(G, b, pr, dt) {
    pr.t += dt;
    pr.vy = Math.min(PH.maxFall, pr.vy + PH.gFall * dt); pr.y += pr.vy * dt;
    if (pr.y >= 12 - 0.55) { pr.y = 12 - 0.55; pr.vy = 0; pr.ground = true; } else pr.ground = false;
    const L = b.L - 0.8, R = b.R - 0.6;
    if (b.dead) {
      // kral düşünce prens telaşla en uzak köşeye kaçıp titrer
      if (!pr.flee) { pr.flee = true; pr.face = G.player.x < pr.x ? 1 : -1; pr.vy = -6; }
      pr.x = clamp(pr.x + pr.face * 6 * dt, L, R);
      return;
    }
    const tx = b.face > 0 ? b.x - 1.1 : b.x + b.w + 0.4;
    pr.x = clamp(pr.x + clamp((tx - pr.x) * 4, -5.5, 5.5) * dt, L, R);
    pr.face = b.face;
    if (b.state === 'hop' && pr.ground && b.st > 0.14 && !pr.hopped) { pr.vy = -8; pr.hopped = true; }
    if (b.state !== 'hop') pr.hopped = false;
  }

  function updateBoss(G, dt) {
    const b = G.boss, p = G.player;
    b.t += dt; b.st += dt;
    b.hurtT = Math.max(0, b.hurtT - dt);
    b.flash = Math.max(0, b.flash - dt);
    if (b.prince) updatePrince(G, b, b.prince, dt);
    if (b.dead) {
      b.vy = Math.min(PH.maxFall, b.vy + 30 * dt); b.y += b.vy * dt;
      return;
    }
    const pcx = p.x + p.w / 2, bcx = b.x + b.w / 2;
    const toward = pcx < bcx ? -1 : 1;
    const anger = 1 - b.hp / b.maxHp; // 0 → 1
    const set = (s) => { b.state = s; b.st = 0; };
    if (b.state === 'intro') {
      if (b.kind === 'kralbug' || b.kind === 'truva' || b.kind === 'sizinti' || b.kind === 'maviekran' || b.kind === 'spagetti' || b.kind === 'teknikborc') bossGravity(G, b, dt);
      if (b.st > 1.4) set(b.kind === 'glitch' ? 'hide' : 'go');
      return;
    }
    switch (b.kind) {
      case 'kralbug': {
        // ikinci evre: tacından iki bug fırlar, fanlar kesik kesik çalışmaya başlar
        if (!b.p2 && b.hp <= b.maxHp / 2 + 0.01) { b.p2 = true; set('roar'); b.vx = 0; G.fanPulse = true; ev(G, 'roar'); }
        if (b.state === 'roar') {
          b.vx = 0;
          if (b.st > 0.45 && !b.spawned) { b.spawned = true; crownMinions(G, b, 2); }
          bossGravity(G, b, dt);
          if (b.st > 1.2) { b.spawned = false; set('go'); b.cyc = 0; }
          break;
        }
        if (b.p2 && b.state === 'go' && b.onGround) { b.cyc += dt; if (b.cyc > 5.5 && minionCount(G) < 2) { b.cyc = 0; crownMinions(G, b, 1); } }
        if (b.onGround && b.state === 'go') {
          if (b.st > 1.0) b.face = toward;
          b.vx = b.face * (2.2 + anger * 2.4);
          if (b.st > 1.9 - anger * 0.6) { b.vy = -11.5; b.vx = toward * (3 + anger * 2); set('hop'); ev(G, 'bossjump'); }
        }
        const r = bossGravity(G, b, dt);
        if (r.hx) b.face = -b.face;
        if (b.state === 'hop' && r.landed) { G.shake = 0.25; ev(G, 'thud'); set('go'); }
        break;
      }
      case 'spam': {
        if (b.state === 'go') {
          const cx = (b.L + b.R) / 2 - b.w / 2;
          b.x = approach(b.x, cx + Math.sin(b.t * (0.8 + anger * 0.5)) * 5.5, 6 * dt);
          b.y = approach(b.y, 3.2 + Math.sin(b.t * 1.7) * 0.6, 4 * dt);
          b.cyc += dt;
          if (b.cyc > 2.4 - anger * 0.8 && minionCount(G) < 2) { b.cyc = 0; addMinion(G, 'spam', bcx - 0.4, b.y + b.h, toward * 2.6); ev(G, 'spawn'); }
          if (b.st > 5.5 - anger * 1.5) { set('dive'); b.tx = clamp(pcx - b.w / 2, b.L, b.R - b.w); }
        } else if (b.state === 'dive') {
          b.x = approach(b.x, b.tx, 8 * dt); b.y = approach(b.y, 12 - b.h, 11 * dt);
          if (b.y >= 12 - b.h - 0.01) set('low');
        } else if (b.state === 'low') {
          b.x = clamp(b.x + toward * 1.5 * dt, b.L, b.R - b.w);
          if (b.st > 1.5) set('rise');
        } else if (b.state === 'rise') {
          b.y = approach(b.y, 3.2, 7 * dt);
          if (b.y <= 3.21) set('go');
        }
        break;
      }
      case 'marti': {
        const perchL = b.L + 0.5, perchR = b.R - b.w - 0.5;
        if (b.state === 'go') { // tünekte bekle
          b.y = approach(b.y, 2.5, 6 * dt);
          if (b.st > 1.1 - anger * 0.5) { set('dive'); b.tx = clamp(pcx - b.w / 2, b.L, b.R - b.w); b.face = b.tx > b.x ? 1 : -1; ev(G, 'cawk'); }
        } else if (b.state === 'dive') {
          const sp = 9 + anger * 3;
          const dx = b.tx - b.x, dy = (12 - b.h) - b.y, d = Math.hypot(dx, dy) || 1;
          b.x += dx / d * sp * dt; b.y += dy / d * sp * dt;
          if (d < 0.3) { b.y = 12 - b.h; set('skim'); }
        } else if (b.state === 'skim') {
          b.x += b.face * (6 + anger * 2) * dt;
          if (b.x <= b.L || b.x + b.w >= b.R || b.st > 1.6) { b.x = clamp(b.x, b.L, b.R - b.w); set('climb'); b.face = b.x < (b.L + b.R) / 2 ? -1 : 1; }
        } else if (b.state === 'climb') {
          const tx = b.face < 0 ? perchL : perchR;
          b.x = approach(b.x, tx, 7 * dt); b.y = approach(b.y, 2.5, 6 * dt);
          if (Math.abs(b.x - tx) < 0.05 && b.y <= 2.51) { set('go'); b.face = -b.face; }
        }
        break;
      }
      case 'truva': {
        if (b.state === 'go') {
          b.face = toward; b.vx = toward * (1.4 + anger);
          b.cyc += dt;
          if (b.cyc > 3 - anger && minionCount(G) < 3) { b.cyc = 0; set('open'); }
          else if (b.st > 6.5 - anger * 2) set('shake');
        } else if (b.state === 'open') {
          b.vx = 0;
          if (b.st > 0.4 && !b.spawned) { addMinion(G, 'bug', bcx - 0.45, b.y + b.h - 0.9, toward * 2.2); b.spawned = true; ev(G, 'spawn'); }
          if (b.st > 0.9) { b.spawned = false; set('go'); }
        } else if (b.state === 'shake') {
          b.vx = 0; b.face = toward;
          if (b.st > 0.7) { set('charge'); ev(G, 'charge'); }
        } else if (b.state === 'charge') {
          b.vx = b.face * (9 + anger * 2);
        } else if (b.state === 'stun') {
          b.vx = approach(b.vx, 0, 10 * dt);
          if (b.st > 1.1) set('go');
        }
        const r = bossGravity(G, b, dt);
        if (r.hx && b.state === 'charge') { G.shake = 0.3; ev(G, 'thud'); b.vx = -b.face * 2; b.vy = -5; set('stun'); }
        break;
      }
      case 'sizinti': {
        if (b.state === 'go' && b.onGround) {
          b.vx = 0;
          if (b.st > 0.75 - anger * 0.35) {
            b.vy = -13; b.vx = clamp((pcx - bcx) / 1.15, -7, 7); set('air'); ev(G, 'bossjump');
          }
        }
        const r = bossGravity(G, b, dt);
        if (r.hx) b.vx = -b.vx * 0.5;
        if (b.state === 'air' && r.landed) {
          G.shake = 0.2; ev(G, 'splat'); set('go');
          const sp = 4.5 + anger * 2;
          bshot(G, { kind: 'drop', x: b.x - 0.4, y: 12 - 0.5, vx: -sp, life: 3.5 });
          bshot(G, { kind: 'drop', x: b.x + b.w - 0.1, y: 12 - 0.5, vx: sp, life: 3.5 });
        }
        break;
      }
      case 'dongu': {
        b.wv = 0.55 + anger * 0.45;
        b.ang = (b.ang || 0) + b.wv * dt;
        b.x = b.cx + Math.sin(b.ang) * 5.5;
        b.y = 6.2 + Math.sin(b.ang * 2) * 2.4;
        b.orb += (2.4 + anger * 1.2) * dt;
        // dönen kıvılcımlar
        const n = 3;
        for (let k = 0; k < n; k++) {
          const a = b.orb + k * Math.PI * 2 / n;
          const sx = b.x + b.w / 2 + Math.cos(a) * 1.8, sy = b.y + b.h / 2 + Math.sin(a) * 1.8;
          if (!p.dead && sx > p.x - 0.2 && sx < p.x + p.w + 0.2 && sy > p.y - 0.2 && sy < p.y + p.h + 0.2) hurt(G);
        }
        break;
      }
      case 'ddos': {
        if (b.state === 'go') {
          b.x = approach(b.x, clamp(pcx - b.w / 2, b.L, b.R - b.w), (3 + anger * 2) * dt);
          b.y = approach(b.y, 2.2, 5 * dt);
          b.cyc += dt;
          const burst = (b.st % 3.2) < 2.2;
          if (burst && b.cyc > 0.36 - anger * 0.1) { b.cyc = 0; bshot(G, { kind: 'packet', x: b.x + 0.3 + G.rand() * (b.w - 0.8), y: b.y + b.h - 0.2, vy: 2, g: 18, w: 0.45, h: 0.45, solidKill: true }); ev(G, 'drip'); }
          if (b.st > 6.2) set('tired');
        } else if (b.state === 'tired') {
          b.y = approach(b.y, 12 - b.h - 0.4, 6 * dt);
          if (b.st > 2.3) set('up');
        } else if (b.state === 'up') {
          b.y = approach(b.y, 2.2, 6 * dt);
          if (b.y <= 2.21) set('go');
        }
        break;
      }
      case 'glitch': {
        if (b.state === 'hide') {
          if (b.st > 0.45) {
            // yeni yer: zemin ya da platformlar
            const spots = [[b.L + 1, 12], [b.L + 4, 12], [b.R - 3, 12], [b.R - 6, 12], [G.arena.ax + 6.4, 8], [G.arena.ax + 13.4, 8], [(b.L + b.R) / 2 - 0.6, 12]];
            let s, tries = 0;
            do { s = spots[Math.floor(G.rand() * spots.length)]; tries++; } while (tries < 8 && Math.abs(s[0] - pcx) < 2.5);
            b.x = s[0]; b.y = s[1] - b.h; set('appear'); ev(G, 'glitch');
          }
        } else if (b.state === 'appear') {
          if (b.st > 0.45) { set('go'); b.shotN = 0; }
        } else if (b.state === 'go') {
          b.face = toward;
          if (b.st > 0.35 + b.shotN * (0.42 - anger * 0.12) && b.shotN < 3) {
            b.shotN++;
            const dx = pcx - bcx, dy = (p.y + p.h / 2) - (b.y + b.h / 2), d = Math.hypot(dx, dy) || 1, sp = 6 + anger * 2;
            bshot(G, { kind: 'pixel', x: bcx - 0.2, y: b.y + b.h / 2 - 0.2, w: 0.4, h: 0.4, vx: dx / d * sp, vy: dy / d * sp, life: 3 });
            ev(G, 'zap');
          }
          if (b.st > 1.9 - anger * 0.4) set('vanish');
        } else if (b.state === 'vanish') {
          if (b.st > 0.3) set('hide');
        }
        break;
      }
      case 'spagetti': {
        // birbirine dolanmış kod: yürür, durup kemer çizerek erişte topları fırlatır, öfkelenince zıplar
        if (b.state === 'go' && b.onGround) {
          if (b.st > 0.8) b.face = toward;
          b.vx = b.face * (1.6 + anger * 1.6);
          b.cyc += dt;
          if (b.cyc > 2.2 - anger * 0.7) { b.cyc = 0; set('throw'); b.shotN = 0; }
        } else if (b.state === 'throw') {
          b.vx = 0; b.face = toward;
          const n = anger > 0.5 ? 3 : 2;
          if (b.shotN < n && b.st > 0.35 + b.shotN * 0.3) {
            const dist = clamp(Math.abs(pcx - bcx), 1.5, 9) * (0.75 + 0.25 * b.shotN);
            bshot(G, { kind: 'noodle', x: bcx - 0.27, y: b.y, vx: toward * dist / 0.82, vy: -9, g: 22, w: 0.55, h: 0.55, life: 3, solidKill: true });
            b.shotN++; ev(G, 'spawn');
          }
          if (b.st > 1.4) {
            set('go');
            if (anger > 0.35 && G.rand() < 0.6) { b.vy = -10.5; b.vx = toward * 3; set('hop'); ev(G, 'bossjump'); }
          }
        }
        const r = bossGravity(G, b, dt);
        if (r.hx) b.face = -b.face;
        if (b.state === 'hop' && r.landed) { G.shake = 0.2; ev(G, 'thud'); set('go'); }
        break;
      }
      case 'teknikborc': {
        // yığılmış eski kod kutuları: ağır zıplar, inince tavandan kutular düşer; öfkelenince yerde cıvata kayar
        if (b.state === 'go' && b.onGround) {
          if (b.st > 0.9) b.face = toward;
          b.vx = b.face * (1.2 + anger * 1.4);
          if (b.st > 2.6 - anger * 0.8) { b.vy = -12; b.vx = toward * (2.5 + anger * 2); set('jump'); ev(G, 'bossjump'); }
        }
        const r = bossGravity(G, b, dt);
        if (r.hx) b.face = -b.face;
        if (b.state === 'jump' && r.landed) {
          G.shake = 0.4; ev(G, 'thud'); set('go');
          const n = 2 + Math.round(anger * 2);
          for (let k = 0; k < n; k++) {
            const x = b.L + 1 + G.rand() * (b.R - b.L - 3);
            bshot(G, { kind: 'box', x, y: -0.6 - k * 1.3, vy: 0, g: 14, w: 0.8, h: 0.8, solidKill: true, life: 4 });
          }
          if (anger > 0.45) {
            bshot(G, { kind: 'bolt', x: b.x - 0.6, y: 11.35, vx: -6, w: 0.6, h: 0.5, life: 3 });
            bshot(G, { kind: 'bolt', x: b.x + b.w, y: 11.35, vx: 6, w: 0.6, h: 0.5, life: 3 });
          }
        }
        break;
      }
      case 'fidye': {
        // fidye yazılımı: dev asma kilit. Havada oyuncunun üstüne süzülür, zemine kilit atar (önce yanıp söner,
        // sonra basana can yakar). Üç kilitten sonra fidyeyi saymak için yere iner: işte o an ezilir.
        // Öfkelenince yere inince iki yana şifreli dosya fırlatır.
        if (b.state === 'go') {
          b.x = approach(b.x, clamp(pcx - b.w / 2, b.L, b.R - b.w), (2.2 + anger * 1.6) * dt);
          b.y = approach(b.y, 3, 5 * dt);
          b.cyc += dt;
          if (b.cyc > 1.3 - anger * 0.35) {
            b.cyc = 0; b.locks = (b.locks || 0) + 1;
            const xs = [clamp(pcx - 0.9, b.L, b.R - 1.8)];
            if (anger > 0.3) { let x = b.L + G.rand() * (b.R - b.L - 1.8); if (Math.abs(x - xs[0]) < 2.2) x = clamp(xs[0] + (xs[0] < (b.L + b.R) / 2 ? 4 : -4), b.L, b.R - 1.8); xs.push(x); }
            for (const x of xs) bshot(G, { kind: 'lock', x, y: 12 - 0.7, w: 1.8, h: 0.7, arm: 0.9, life: 2.5 });
            ev(G, 'lockon');
          }
          if (b.locks >= (anger >= 0.6 ? 2 : 3) && b.cyc > 0.8) { b.locks = 0; set('down'); }
        } else if (b.state === 'down') {
          b.y = approach(b.y, 12 - b.h, 8 * dt);
          if (b.y >= 12 - b.h - 0.01 && !b.fired) {
            b.fired = true; G.shake = 0.2; ev(G, 'thud');
            if (anger > 0.4) {
              bshot(G, { kind: 'file', x: b.x - 0.7, y: 11.4, vx: -5.5, w: 0.7, h: 0.6, life: 3 });
              bshot(G, { kind: 'file', x: b.x + b.w, y: 11.4, vx: 5.5, w: 0.7, h: 0.6, life: 3 });
            }
          }
          if (b.st > 2.6 - anger * 0.6) { set('up'); b.fired = false; }
        } else if (b.state === 'up') {
          b.y = approach(b.y, 3, 6 * dt);
          if (b.y <= 3.01) set('go');
        }
        break;
      }
      case 'maviekran': {
        if (b.hp > 3) {
          if (b.state === 'go' && b.onGround) {
            if (b.st > 0.9) b.face = toward;
            b.vx = b.face * (1.8 + anger * 1.5);
            if (b.st > 2.4) { b.vy = -11; b.vx = toward * 3.5; set('hop'); ev(G, 'bossjump'); }
          }
          const r = bossGravity(G, b, dt);
          if (r.hx) b.face = -b.face;
          if (b.state === 'hop' && r.landed) { G.shake = 0.3; ev(G, 'thud'); set('go'); }
        } else {
          if (!b.phase) { b.phase = 1; set('jump'); b.vy = -12; b.vx = 0; b.target = pcx < (b.L + b.R) / 2 ? b.R - b.w - 0.5 : b.L + 0.5; addMinion(G, 'bug', (b.L + b.R) / 2, 11.1, toward * 2); ev(G, 'bossjump'); }
          if (b.state === 'jump') {
            b.vx = clamp((b.target - b.x) * 1.6, -7, 7);
            const r = bossGravity(G, b, dt);
            if (r.landed) { G.shake = 0.35; ev(G, 'thud'); set('fire'); b.shotN = 0; b.vx = 0; }
          } else if (b.state === 'fire') {
            b.face = toward; b.vx = 0;
            bossGravity(G, b, dt);
            if (b.st > 0.7 + b.shotN * 0.85 && b.shotN < 4) {
              const high = b.shotN % 2 === 1;
              bshot(G, { kind: 'sad', x: b.face > 0 ? b.x + b.w : b.x - 1, y: high ? 9.25 : 11.15, w: 1, h: 0.6, vx: b.face * 6.5, life: 4 });
              b.shotN++; ev(G, 'zap');
            }
            if (b.st > 4.4) { set('jump'); b.vy = -12.5; b.target = b.x < (b.L + b.R) / 2 ? b.R - b.w - 0.5 : b.L + 0.5; ev(G, 'bossjump'); }
          }
        }
        break;
      }
    }
    b.x = clamp(b.x, b.L, b.R - b.w);

    // oyuncuyla temas
    if (!p.dead && b.hurtT <= 0 && b.state !== 'intro' && b.state !== 'hide' && b.state !== 'appear' && overlap(p, shrink(b, 0.08))) {
      const stomp = p.vy > 0 && p.prevBottom <= b.y + 0.45;
      if (stomp || p.star > 0) {
        damageBoss(G, 1, true);
        if (stomp) { p.vy = -13; p.jumping = true; p.y = Math.min(p.y, b.y - p.h); }
        if (b.kind === 'glitch' && !b.dead) set('vanish');
        if (b.kind === 'spam' && !b.dead && b.state === 'low') set('rise');
        if (b.kind === 'fidye' && !b.dead && b.state === 'down') { set('up'); b.fired = false; }
      } else hurt(G);
    }
  }

  // ---------------- ana adım ----------------
  function step(G, inp, dt) {
    G.ev.length = 0;
    G.t += dt;
    G.shake = Math.max(0, G.shake - dt);
    const p = G.player;

    // efektler
    const born = [];
    G.fx = G.fx.filter((f) => {
      f.t += dt;
      if (f.k === 'debris') { f.vy += 40 * dt; f.x += f.vx * dt; f.y += f.vy * dt; return f.y < G.H + 1; }
      if (f.k === 'score') { f.y -= (f.t < 0.5 ? 1.6 : 0.4) * dt; return f.t < 0.95; }
      if (f.k === 'simitpop') { if (f.t >= 0.55) { born.push({ k: 'spark', x: f.x + 0.5, y: f.y + 0.5 - (19 * f.t - 29 * f.t * f.t), t: 0 }); return false; } return true; }
      if (f.k === 'dust') { f.x += f.vx * dt; f.vx *= Math.exp(-6 * dt); f.y -= 0.6 * dt; return f.t < 0.4; }
      if (f.k === 'stomp') return f.t < 0.3;
      if (f.k === 'firework') return f.t < 1.1;
      if (f.k === 'plank') { f.vy += 30 * dt; f.x += f.vx * dt; f.y += f.vy * dt; return f.t < 1.2; }
      if (f.k === 'panel') { f.vy += 30 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.r += f.vx * dt * 2; return f.t < 1.2; }
      if (f.k === 'bardak') {
        // uyuyan bug'ın çay bardağı: düşer, yere değince şıngırdar
        if (!f.hit) { f.vy += 30 * dt; f.x += f.vx * dt; f.y += f.vy * dt; if (f.vy > 0 && f.y >= f.y0 - 0.3) { f.hit = f.t; f.y = f.y0 - 0.3; ev(G, 'glass'); } }
        return !f.hit || f.t - f.hit < 0.5;
      }
      if (f.k === 'steam') { f.y -= 1.2 * dt; return f.t < 0.9; }
      if (f.k === 'goldpop') return f.t < 0.8;
      return f.t < 0.35;
    });
    if (born.length) G.fx.push(...born);
    G.bumps = G.bumps.filter((b) => (b.t += dt) < 0.2);
    if (G.warp) { updateWarp(G, dt); G.prev.jump = inp.jump; G.prev.run = inp.run; return; }

    if (G.phase === 'dying') {
      G.dieT += dt;
      if (G.dieT > 0.45) { p.vy = Math.min(PH.maxFall, p.vy + 40 * dt); p.y += p.vy * dt; }
      if (G.dieT > 2.0) G.result = 'dead';   // v2.1: daha çabuk yeniden başlanır
      G.prev.jump = inp.jump; G.prev.run = inp.run;
      return;
    }
    if (G.phase === 'clear' && G.quiet) {
      // tepedeki bankta: alkış, sayım ve havai fişek yok; kahraman durur, bir an sonra sahne başlar
      G.clearT += dt; p.vx = 0;
      p.vy = Math.min(PH.maxFall, p.vy + PH.gFall * dt);
      const r = moveY(G, p, p.vy * dt, true);
      if (r.down) { p.vy = 0; p.onGround = true; }
      if (G.clearT > 1.4) G.result = 'clear';
      G.prev.jump = inp.jump; G.prev.run = inp.run;
      return;
    }
    if (G.phase === 'clear') {
      G.clearT += dt;
      p.vx = 0;
      // sevinç zıplaması
      if (!G.hopped && p.onGround && G.clearT > 0.35) { G.hopped = true; p.vy = -10; p.onGround = false; p.sq = -0.3; ev(G, 'jump'); }
      p.vy = Math.min(PH.maxFall, p.vy + PH.gFall * dt);
      const r = moveY(G, p, p.vy * dt, true);
      if (r.down) { if (!p.onGround && p.vy > 4) { p.sq = 0.4; p.sqv = 0; dust(G, p.x + 0.05, p.y + p.h, -1.6); dust(G, p.x + p.w - 0.05, p.y + p.h, 1.6); } p.vy = 0; p.onGround = true; }
      p.cheer = G.hopped;
      springSquash(p, dt);
      if (G.clearT > 1.6 && G.time > 0) {
        const n = Math.min(G.time, Math.max(1, Math.ceil(dt * 150)));
        G.time -= n; G.S.score += 50 * n; if (Math.floor(G.t * 30) % 2) ev(G, 'tick');
        if (G.time <= 0) { G.time = 0; G.tallyDone = G.clearT; }
      }
      // havai fişekler: sayım bitince şehrin üstünde patlar
      if (G.tallyDone && G.fireworks < (G.fireworkN || 0) && G.clearT - G.tallyDone > 0.3 + G.fireworks * 0.5) {
        const k = G.fireworks++;
        const fx = G.cam + 3 + ((k * 5 + G.idx * 3) % 10) + G.rand() * 1.5, fy = G.camY + 2.2 + G.rand() * 2.5;
        G.fx.push({ k: 'firework', x: fx, y: fy, t: 0, hue: (k * 97 + G.idx * 40) % 360 });
        G.S.score += 500; G.fx.push({ k: 'score', x: fx, y: fy + 1, t: 0, text: '500' });
        ev(G, 'firework');
      }
      const wait = 1.2 + (G.fireworkN || 0) * 0.5;
      if (G.time <= 0 && G.clearT > 1.6 && G.clearT - (G.tallyDone || G.clearT) > wait) G.result = 'clear';
      G.prev.jump = inp.jump; G.prev.run = inp.run;
      return;
    }

    // süre (sessiz bölümde işlemez)
    if (!G.quiet) G.time = Math.max(0, G.time - dt);
    if (!G.hurry && G.time < 100) { G.hurry = true; ev(G, 'hurry'); }
    if (G.time <= 0) die(G);

    // platformlar
    for (const pl of G.plats) {
      const ox = pl.x, oy = pl.y;
      if (pl.kind === 'pan') {
        if (pl.side > 0) updateScale(G, pl.sc, dt);
        pl.y = pl.base + pl.sc.d * pl.side;
      } else if (pl.kind === 'lift') {
        updateLift(G, pl.lift, dt);
      } else if (pl.kind === 'tray') {
        updateCayci(G, pl.npc, dt);
        pl.x = pl.npc.x - 0.6; pl.y = pl.npc.y - 2.1;
      } else if (pl.train) {
        if (pl.state === 'wait') {
          // oyuncu tavanda yarım saniye durunca kapılar kapanır, tren kalkar
          pl.wt = p.plat === pl && !p.dead ? pl.wt + dt : 0;
          if (pl.wt > 0.5) { pl.state = 'go'; ev(G, 'train'); }
        } else if (pl.state === 'go') {
          const left = pl.b - pl.x;
          pl.v = Math.min(pl.sp, pl.v + TRAIN_ACC * dt, Math.sqrt(2 * TRAIN_ACC * Math.max(0, left)) + 0.15);
          pl.x = Math.min(pl.b, pl.x + pl.v * dt);
          if (pl.yb !== pl.ya) pl.y = pl.ya + (pl.yb - pl.ya) * (pl.x - pl.a) / Math.max(1e-6, pl.b - pl.a);
          if (pl.x >= pl.b) { pl.x = pl.b; pl.y = pl.yb; pl.v = 0; pl.state = 'stop'; ev(G, 'trainstop'); }
        }
      } else if (pl.b > pl.a) {
        if (pl.hold > 0) pl.hold = Math.max(0, pl.hold - dt);   // sepet uçta bir an bekler
        else if (pl.kind === 'h') { pl.x += pl.dir * pl.sp * dt; if (pl.x >= pl.b) { pl.x = pl.b; pl.dir = -1; } if (pl.x <= pl.a) { pl.x = pl.a; pl.dir = 1; } }
        else {
          pl.y += pl.dir * pl.sp * dt;
          if (pl.y >= pl.b) { pl.y = pl.b; pl.dir = -1; pl.hold = pl.pause || 0; }
          if (pl.y <= pl.a) { pl.y = pl.a; pl.dir = 1; pl.hold = pl.pause || 0; }
        }
      }
      pl.dx = pl.x - ox; pl.dy = pl.y - oy;
    }
    for (const bar of G.bars) bar.a += bar.sp * dt;
    if (G.fans.length) updateFans(G, dt);
    if (G.shutters.length) updateShutters(G);
    if (G.crumb.size) updateCrumbles(G, dt);
    if (G.lanes.length) updateLanes(G, dt);
    if (G.doors2.length) updateRevolving(G, dt);
    if (G.lamps.length) updateLamps(G, dt);

    updatePlayer(G, inp, dt);
    G.prev.jump = inp.jump; G.prev.run = inp.run;
    if (G.phase !== 'play') return;
    if (G.doors.length || G.readers.length) updateDoors(G, dt);

    // metro hattında raylara düşen oyuncu ölmez: metrodan çıkar (bulut odasından düşmek gibi)
    if (!p.dead && G.area === 'room' && p.y + p.h > G.room.y0 + 12.6) {
      G.warp = { kind: 'out', fall: true, t: 0.3, moved: false, clip: { y1: G.room.y0 + 12.6 } };
      p.vx = 0; p.vy = 0; p.carry = 0; p.carryT = null; p.plat = null; ev(G, 'fall');
      return;
    }
    // metro: girişte aşağı basınca bonus odasına in; odadaki yürüyen merdivenden yukarı çık
    if (!p.dead && G.room && p.onGround) {
      const cx = p.x + p.w / 2, mi = G.metroIn, ex = G.room.exit;
      if (G.area === 'main' && mi && inp.down && cx > mi.x + 0.2 && cx < mi.x + 1.8 && Math.abs(p.y + p.h - (mi.y + 1)) < 0.05) {
        G.warp = { kind: 'in', t: 0, moved: false, clip: { y1: mi.y + 1 } };
        p.vx = 0; p.vy = 0; p.star = 0; ev(G, 'warp');
        return;
      }
      if (G.area === 'room' && ex && inp.right && p.x + p.w > ex.x + 0.3) {
        G.warp = { kind: 'out', t: 0, moved: false, clip: { x1: G.room.x1 - 1 } };
        p.vx = 0; p.vy = 0; p.face = 1; ev(G, 'warp');
        return;
      }
    }

    // kamera
    if (G.area === 'room') {
      // metro hattında kamera yatayda oyuncuyu izler
      G.cam = clamp(approach(G.cam, p.x - 6.5, 30 * dt), G.room.x0, G.room.x1 - VW); G.camY = G.room.y0;
    } else if (G.arena && G.arena.locked) {
      G.cam = approach(G.cam, G.arena.cam, 10 * dt);
    } else {
      const target = p.x - 6.5;
      if (target > G.cam) G.cam = target;
      else if (p.x - G.cam < 4.5) G.cam = Math.max(0, p.x - 4.5);
      G.cam = clamp(G.cam, 0, G.mainW - VW);
    }
    if (G.area !== 'room') updateCamY(G, dt);

    // düşman doğurma: her alan kendi düşmanlarını doğurur (metrodayken yukarıdakiler bekler)
    for (const s of G.spawns) {
      if (G.room && (G.area === 'room') !== (s.x >= G.room.x0)) continue;
      const lead = s.kind === 'leap' ? -2 : 1.5; // sıçrayan bug ekranın içinde, rayların arasından çıkar
      if (!s.done && s.x < G.cam + VW + lead && s.x > G.cam - 2) {
        s.done = true; G.ents.push(makeEnemy(G, s.kind, s.x, s.y, s));
        if (s.kind === 'leap') { ev(G, 'leap'); G.fx.push({ k: 'spark', x: s.x + 0.5, y: s.y + 0.7, t: 0 }, { k: 'spark', x: s.x + 0.1, y: s.y + 0.9, t: -0.08 }); }
      }
      else if (!s.done && s.x <= G.cam - 2) s.done = true;
    }
    G.ents = G.ents.filter((e) => updateEnemy(G, e, dt));
    // düşman-düşman: yürüyenler birbirine çarpınca döner
    for (let i = 0; i < G.ents.length; i++) {
      const a = G.ents[i]; if (a.dead || (a.kind !== 'bug' && a.kind !== 'virus')) continue;
      for (let j = i + 1; j < G.ents.length; j++) {
        const b = G.ents[j]; if (b.dead || (b.kind !== 'bug' && b.kind !== 'virus')) continue;
        if (overlap(a, b)) {
          if ((a.x < b.x && a.vx > 0) || (a.x > b.x && a.vx < 0)) a.vx = -a.vx;
          if ((b.x < a.x && b.vx > 0) || (b.x > a.x && b.vx < 0)) b.vx = -b.vx;
        }
      }
    }
    // oyuncu-düşman
    if (!p.dead) {
      for (const e of G.ents) {
        if (e.dead || !overlap(p, shrink(e, 0.06))) continue;
        if (e.kind === 'hirsiz') {
          // martıya basılınca gagasındaki simit (ve yuttukları) saçılır; değmek zarar vermez
          if (e.state !== 'bonk' && p.vy > 0 && p.prevBottom <= e.y + 0.5) {
            const n = e.carry ? 5 : 1;
            for (let k = 0; k < n; k++) G.fx.push({ k: 'simitpop', x: e.x + (k - (n - 1) / 2) * 0.7, y: e.y - 0.6, t: 0 });
            addSimit(G, n); addScore(G, 200, e.x + e.w / 2, e.y);
            e.state = 'bonk'; e.st = 0; e.carry = false; e.vx = 3.2; e.vy = -3;
            p.vy = inp.jump ? -14 : -9; p.jumping = inp.jump; p.y = e.y - p.h; p.sq = -0.3; p.sqv = 0;
            G.fx.push({ k: 'stomp', x: e.x + e.w / 2, y: e.y + 0.2, t: 0 });
            ev(G, 'stomp'); ev(G, 'cawk');
          }
          continue;
        }
        // uyuyan bug'a yandan değmek onu uyandırır; irkilip kaçarken de kimseye zarar vermez (ezilebilir)
        if ((e.state === 'sleep' || e.state === 'jolt' || e.state === 'flee') && !(p.vy > 0 && p.prevBottom <= e.y + 0.4)) { wakeBug(G, e); continue; }
        if (p.star > 0) { killEnemy(G, e, true, 200); continue; }
        const stomp = p.vy > 0 && p.prevBottom <= e.y + 0.4 && e.kind !== 'virus';
        if (stomp) {
          coolNear(G, e.x + e.w / 2, e.y + e.h);
          const pts = COMBO[Math.min(G.combo, COMBO.length - 1)];
          if (G.combo >= COMBO.length) oneUp(G, e.x, e.y); else addScore(G, pts, e.x + e.w / 2, e.y);
          G.combo++;
          e.dead = true; e.flip = e.kind !== 'bug'; e.deadT = 0;
          if (e.flip) { e.vy = 2; e.vx = 0; }
          p.vy = inp.jump ? -14 : -9; p.jumping = inp.jump; p.y = e.y - p.h;
          p.sq = -0.3; p.sqv = 0;
          G.fx.push({ k: 'stomp', x: e.x + e.w / 2, y: e.y + 0.2, t: 0 });
          ev(G, 'stomp');
        } else hurt(G);
        if (p.dead) break;
      }
    }
    // dönen kıvılcımlar
    if (!p.dead) {
      for (const bar of G.bars) {
        for (let k = 1; k <= bar.n; k++) {
          const sx = bar.cx + Math.cos(bar.a) * k * 0.45, sy = bar.cy + Math.sin(bar.a) * k * 0.45;
          if (sx > p.x - 0.15 && sx < p.x + p.w + 0.15 && sy > p.y - 0.15 && sy < p.y + p.h + 0.15) { hurt(G); break; }
        }
      }
    }
    updateItems(G, dt);
    updateShots(G, dt);

    // kayıt noktaları: geçilen en sağdaki oturuma yazılır
    for (let k = G.checkpoints.length - 1; k >= 0; k--) {
      const cp = G.checkpoints[k];
      if (cp.on || G.area !== 'main' || p.x + p.w / 2 <= cp.x) continue;
      for (let j = 0; j <= k; j++) G.checkpoints[j].on = true;
      G.S.checkpoint = { stage: G.idx, k }; ev(G, 'checkpoint');
      break;
    }

    // patron arenası
    const a = G.arena;
    if (a && !a.locked && p.x > a.ax + 3.5 && G.bossKind) {
      a.locked = true;
      for (let y = 0; y < G.H; y++) setTile(G, a.ax + 2, y, T.WALL);
      spawnBoss(G);
    }
    if (G.boss) {
      updateBoss(G, dt);
      if (G.boss.dead) {
        G.bossDownT += dt;
        if (G.bossDownT > 1.5 && !G.goal.active) { G.goal.active = true; ev(G, 'goalon'); }
      }
    }

    // sessiz bölümün sonu: tepedeki banka varınca
    const bn = G.bench;
    if (bn && !p.dead && p.onGround && p.x + p.w / 2 > bn.x + 0.3) {
      G.phase = 'clear'; G.clearT = 0; p.vx = 0; G.S.checkpoint = null;
      ev(G, 'bench');
    }
    // DEPLOY
    const g = G.goal;
    if (g && g.active && !p.dead && G.area === 'main' && p.x + p.w > g.x + 0.15) {
      G.phase = 'clear'; G.clearT = 0; p.vx = 0; G.time = Math.ceil(G.time);
      // anten bonusu: DEPLOY direğine ne kadar yüksekten değildiyse o kadar puan
      const hgt = g.y + g.h - (p.y + p.h);
      const bonus = hgt >= GOAL_STEPS[4] ? 5000 : hgt >= GOAL_STEPS[3] ? 2000 : hgt >= GOAL_STEPS[2] ? 800 : hgt >= GOAL_STEPS[1] ? 400 : hgt >= GOAL_STEPS[0] ? 200 : 100;
      if (!G.bossKind) { addScore(G, bonus, g.x + 0.5, Math.max(1.5, p.y)); G.goalBonus = bonus; G.goalHit = Math.max(0, Math.min(GOAL_MAST, hgt)); }
      p.x = Math.min(p.x, g.x - p.w - 0.05);
      // havai fişek sayısı: kalan sürenin son hanesi tekse o kadar (en çok 5), çiftse yok
      { const d = G.time % 10; G.fireworkN = d % 2 ? Math.min(5, d) : 0; G.fireworks = 0; }
      if (G.bossKind) G.fireworkN = 5;
      p.star = 0;
      G.S.checkpoint = null;
      ev(G, 'clear');
    }
  }

  // Sonraki bölüme geçiş için oturumu güncelle
  function afterClear(S) { S.stage += 1; S.checkpoint = null; }
  function afterDeath(S) { S.lives -= 1; S.power = 0; return S.lives > 0; }

  root.BA = {
    H, VW, VHT, PH, T, SOLID, BOSS, PW, SMALL_H, BIG_H, STAR_TIME, ROOM_W, TRAIN_W, TRAIN_V, GOAL_MAST, GOAL_STEPS, deathY,
    rng, newRun, loadStage, step, tile, solid, afterClear, afterDeath, overlap,
    levels, moveX, moveY, runUpSpeed, jumpSpeed,
    FAN, CART_V, fanAt, fanVy, cartUnder, updateFans, updateShutters, CAR, greenNow,
  };
})(typeof window !== 'undefined' ? window : globalThis);
