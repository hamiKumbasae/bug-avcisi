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
    CRUMBLE: 21, SHUTTER: 22, PANO: 23, GATE: 24, ZAP: 25, LEVER: 26, STONE: 27, PUMP: 28, BELT: 29, CRATE: 30, FROST: 31 };
  const SOLID = [false, true, true, false, true, true, true, false, true, false, true,
    true, false, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
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
      boats: [], spawners: [], tides: [],
      boards: [], lasers: [], agates: [], vents: [], alarm: 0, alarmCD: 0, levers: [], zaps: [], zapAt: new Map(), power: {},
      sandals: [], currents: [], pools: [], medusas: [], stones: [], nests: [], floods: [], pumps: [],
      winds: [], trolleys: [], swings: [], ropes: [], lines: [],
      brushes: [], foams: [], bubbles: [], beams: [],
      belts: [], beltAt: new Map(), crateSp: [], crates: [], presses: [], irons: [], ironSp: [], shake: 0,
      fogs: [], paters: [], waves: [], dawn: null, hooks: [],
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
    if (G.boards.length) updateBoards(G);
    for (const g of G.agates) if (g.inv) { g.k = 1; g.solid = true; for (let y = g.y0; y <= g.y1; y++) for (let x = g.x0; x <= g.x1; x++) G.grid[y * W + x] = T.GATE; }
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
      // durak: dolmuş orada durur, tavanına biri binene dek bekler (dolmadan kalkmaz)
      G.lanes.push({ x0: o.x0, x1: o.x1, y: o.y, dir: o.dir || 1, every: o.every || 2.8, t: o.t0 || 0, light: o.light || null,
        kinds: o.kinds || ['taksi', 'dolmus'], v: o.v || 5, n: 0, durak: o.durak === undefined ? null : o.durak });
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
      G.lamps.push({ x: o.x, y: o.y, t: 0, always: !!o.always });   // hareket sensörlü tavan lambası
    } else if (o.k === 'fotokopi') {
      G.lamps.push({ x: o.x, y: o.y, t: 0, flash: o.per || 2.4 });   // çaktıkça odayı bir an aydınlatan fotokopi makinesi
    } else if (o.k === 'vapur') {
      // vapur: iki iskele arasında gidip gelir, iskelede bekler; alt güverte ve üst güverte basılır
      const b = { x: o.x0, a: o.x0, b: o.x1, y: o.y, w: o.w || 12, v: 0, vmax: o.v || 3, dir: o.x1 > o.x0 ? 1 : -1, wait: o.wait || 2.5, wt: o.ph || 0, state: 'wait', kind: o.kayik ? 'kayik' : 'vapur' };
      b.deck = { kind: 'boat', x: b.x, y: b.y, w: b.w, h: 0.5, tx: 0, ty: 0, dx: 0, dy: 0, boat: b, a: 0, b: 0 };
      G.plats.push(b.deck);
      if (b.kind === 'vapur') { b.roof = { kind: 'boat', x: b.x + 3, y: b.y - 2.6, w: b.w - 6, h: 0.5, tx: 0, ty: 0, dx: 0, dy: 0, boat: b, upper: true, a: 0, b: 0 }; G.plats.push(b.roof); }
      G.boats.push(b);
    } else if (o.k === 'martilar') {
      // vapurun peşindeki martılar: oyuncunun tepesinde uçar, dalıp simitini kapar
      for (let k = 0; k < (o.n || 2); k++) G.spawns.push({ kind: 'hirsiz', x: o.x0 + k * 3, y: o.y || 3, done: false, chase: true, x1: o.x1 });
    } else if (o.k === 'sal') {
      // dalgayla yükselip alçalan sal (en yakın dalga bölgesine bağlı)
      G.plats.push({ kind: 'float', x: o.x, y: o.y, w: o.w || 3, h: 0.5, tx: 0, ty: 0, dx: 0, dy: 0, a: 0, b: 0, off: o.off || 0.2 });
    } else if (o.k === 'kasa') {
      // meyve kasası: arada bir yuvarlanan karpuz bırakır
      G.spawners.push({ x: o.x, y: o.y, every: o.every || 3, t: o.t0 || 0, dir: o.dir || -1, v: o.v || 3.4 });
    } else if (o.k === 'dalga') {
      // dalga: deniz belli aralıkla kıyıya vurur; su yükselince kumsal yolu kapanır
      G.tides.push({ x0: o.x0, x1: o.x1, lo: o.lo, hi: o.hi, per: o.per || 6, high: o.high || 1.6, ph: o.ph || 0, y: o.lo });
    } else if (o.k === 'kiris') {
      G.decor.push({ k: 'kiris', x: o.x0, x1: o.x1, y: o.y });   // galerinin korkuluk kirişi: yalnız süs, üstünde durulmaz
    } else if (o.k === 'pano') {
      // borsa panosu: belli aralıkla yanar (üstüne basılır), söner (boşluk); sönmeden önce kırmızı yanıp söner
      G.boards.push({ x0: o.x0, x1: o.x1 === undefined ? o.x0 + 1 : o.x1, y: o.y, per: o.per || 3, on: o.on || 1.8, ph: o.ph || 0, lit: false, warn: false, sym: o.sym || 0 });
    } else if (o.k === 'grafik') {
      // canlı borsa grafiği: yan yana çubuklar dalga gibi inip kalkar; dalga sağa akar
      const w = o.w || 2;
      for (let k = 0; k < o.n; k++) G.plats.push({ kind: 'chart', x: o.x + k * w, y: o.y, w, h: 0.5, tx: 0, ty: 0, dx: 0, dy: 0,
        a: o.y - o.amp, b: o.y, per: o.per || 4, ph: (o.ph || 0) - k * (o.lag === undefined ? 0.1 : o.lag), bot: o.bot || 12, k });
    } else if (o.k === 'lazer') {
      // güvenlik lazeri: dikey (x, y0..y1) ya da yatay (x0..x1, y); per verilirse yanıp söner (on sn yanık).
      // ya/yb verilirse tarayıcı: yatay ışın ikisi arasında inip kalkar. Değen alarmı çaldırır
      const vert = o.x !== undefined;
      G.lasers.push({ vert, x0: vert ? o.x : o.x0, x1: vert ? o.x : o.x1, y0: vert ? o.y0 : o.y, y1: vert ? o.y1 : o.y, y: vert ? 0 : o.y + 0.5,
        per: o.per || 0, on: o.on || 0, ph: o.ph || 0, ya: o.ya, yb: o.yb, active: true });
    } else if (o.k === 'alarmkapi') {
      // alarm kapısı: alarm çalınca iner (katı), susunca kalkar. inv: tersine, alarmda açılan yangın çıkışı
      G.agates.push({ x0: o.x0 === undefined ? o.x : o.x0, x1: o.x1 === undefined ? o.x : o.x1, y0: o.y0, y1: o.y1, inv: !!o.inv, solid: false, k: 0 });
    } else if (o.k === 'menfez') {
      G.vents.push({ x: o.x, y: o.y, kids: [], open: 0 });   // havalandırma menfezi: alarmda içinden bug düşer
    } else if (o.k === 'salter') {
      // şalter: üstüne basınca (ya da alttan vurunca) kolu iner, gruptaki elektrik kesilir/gelir
      const grp = o.grp || 'a';
      G.levers.push({ x: o.x, y: o.y, grp, t: -9, pulse: o.pulse || 0, back: 0 }); G.grid[o.y * G.W + o.x] = T.LEVER;
      if (o.on !== undefined || !(grp in G.power)) G.power[grp] = o.on !== false;
    } else if (o.k === 'izgara') {
      // elektrikli ızgara: gruba elektrik varken üstüne basanı çarpar (bug'ları da)
      const grp = o.grp || 'a';
      for (let x = o.x0; x <= o.x1; x++) { G.grid[o.y * G.W + x] = T.ZAP; G.zapAt.set(o.y * G.W + x, grp); }
      G.zaps.push({ x0: o.x0, x1: o.x1, y: o.y, grp });
      if (!(grp in G.power)) G.power[grp] = true;
    } else if (o.k === 'ray') {
      // elektrikli raylı platform: yalnız grubunda elektrik varken gider (yatay: x0..x1, dikey: y0..y1)
      const grp = o.grp || 'a', h = o.y0 === undefined;
      G.plats.push({ kind: h ? 'h' : 'v', rail: true, grp, x: h ? o.x0 : o.x, y: h ? o.y : o.y1, w: o.w || 3, h: 0.5, tx: 0, ty: 0, dx: 0, dy: 0,
        a: h ? o.x0 : o.y0, b: h ? o.x1 : o.y1, sp: o.v || 2.2, dir: h ? 1 : -1, pause: 0.4, hold: 0 });
      if (!(grp in G.power)) G.power[grp] = true;
    } else if (o.k === 'sandal') {
      // sandal: suda yüzer; içine her inişte (zıplayıp düşünce) oyuncunun baktığı yana itilir, su yavaşlatır.
      // sütun dibine ya da iskeleye çarpınca durur
      const b = { x: o.x, y: o.y, w: o.w || 3, vx: 0, x0: o.x0, x1: o.x1, bump: 0, sink: !!o.sink, sinkT: 0 };
      b.deck = { kind: 'sandal', x: b.x, y: b.y, w: b.w, h: 0.5, tx: 0, ty: 0, dx: 0, dy: 0, boat: b, a: 0, b: 0 };
      G.plats.push(b.deck); G.sandals.push(b);
    } else if (o.k === 'sutun') {
      G.decor.push({ k: 'sutun', x: o.x, y0: o.y0 || 2, y1: o.y1, w: o.w || 2, cry: !!o.cry });   // sarnıç sütunu (arka plan)
    } else if (o.k === 'akinti') {
      G.currents.push({ x0: o.x0, x1: o.x1, v: o.v });   // su akıntısı: içindeki sandalları sürükler
    } else if (o.k === 'su') {
      G.pools.push({ x0: o.x0, x1: o.x1, y: o.y });       // sarnıç suyu (çizim): içinde sazanlar yüzer
    } else if (o.k === 'medusa') {
      // Medusa başı: gözleri belli aralıkla açılır; bakışının yolundaki bug taşa döner (blok olur), oyuncu bir an taş kesilir.
      // dir: bakış yönü (l, r, d); w: bakışın eni (karo)
      G.medusas.push({ x: o.x, y: o.y, dir: o.dir || 'l', len: o.len || 8, w: o.w || 2, per: o.per || 4, open: o.open || 2, ph: o.ph || 0, on: false, warn: false });
    } else if (o.k === 'yuva') {
      G.nests.push({ x: o.x, y: o.y, every: o.every || 4, t: o.t0 || 0, kids: [], max: o.max || 2, dir: o.dir || 0 });   // duvar çatlağı: arada bir bug çıkar
    } else if (o.k === 'taskin') {
      // taşkın: oyuncu yaklaşınca su yavaş yavaş yükselir (y azalır); pompaya basınca iner
      G.floods.push({ x0: o.x0, x1: o.x1, y: o.y, lo: o.y, hi: o.hi, rate: o.rate || 0.2, target: null, near: o.near || 4 });
    } else if (o.k === 'pompa') {
      G.pumps.push({ x: o.x, y: o.y, drop: o.drop || 4, t: -9, uses: o.uses || 1 }); G.grid[o.y * G.W + o.x] = T.PUMP;
    } else if (o.k === 'ruzgar') {
      // yan rüzgâr: bölgede belli aralıkla (per/on; per yoksa hep) esen rüzgâr; havadakini tam, yerdekini az iter.
      // rüzgârın geldiği yanda yakın bir duvar varsa onun arkası korunaklıdır
      G.winds.push({ x0: o.x0, x1: o.x1, y0: o.y0 === undefined ? 0 : o.y0, y1: o.y1 === undefined ? G.H : o.y1, v: o.v, per: o.per || 0, on: o.on || 0, ph: o.ph || 0, k: 0, warn: false });
    } else if (o.k === 'makara') {
      // halat makarası: üstüne binilince halat boyunca yokuş aşağı kayar, hızlanır; uçta durup üstündekini fırlatır.
      // boş kalınca yavaşça başa döner
      const L = Math.hypot(o.x1 - o.x0, o.y1 - o.y0), tr = { x0: o.x0, y0: o.y0, x1: o.x1, y1: o.y1, L, s: 0, v: 0, w: o.w || 2, empty: 0, fling: o.fling || 0 };
      tr.plat = { kind: 'trolley', x: o.x0 - tr.w / 2, y: o.y0, w: tr.w, h: 0.5, tx: 0, ty: 0, dx: 0, dy: 0, tr, vx: 0, carrier: true, a: 0, b: 0 };
      G.plats.push(tr.plat); G.trolleys.push(tr);
    } else if (o.k === 'sepet') {
      // bakım sepeti: halatla asılı, sarkaç gibi sallanır. wind: yalnız rüzgâr eserken sallanır (yoksa hafifçe)
      const sw = { px: o.x, py: o.y, len: o.len || 5, amp: o.amp === undefined ? 0.5 : o.amp, per: o.per || 3, ph: o.ph || 0, w: o.w || 3, windy: !!o.wind, a: 0, k: 0 };
      sw.plat = { kind: 'swing', x: o.x - sw.w / 2, y: o.y + sw.len, w: sw.w, h: 0.5, tx: 0, ty: 0, dx: 0, dy: 0, sw, a: 0, b: 0 };
      G.plats.push(sw.plat); G.swings.push(sw);
    } else if (o.k === 'ip') {
      // çamaşır ipi: üstüne düşeni esneyip sektirir; ne kadar yüksekten düşülürse o kadar yükseğe (zıplama tuşu da ekler)
      const rp = { x0: o.x0, x1: o.x1, y: o.y, sag: 0, hx: 0, seed: o.x0 };
      rp.plat = { kind: 'rope', x: o.x0, y: o.y, w: o.x1 - o.x0, h: 0.5, tx: 0, ty: 0, dx: 0, dy: 0, rope: rp, a: 0, b: 0 };
      G.plats.push(rp.plat); G.ropes.push(rp);
    } else if (o.k === 'direk') {
      G.decor.push({ k: 'direk', x: o.x, y: o.y });   // teleferik direği (kolu haritada katı karo)
    } else if (o.k === 'teleferik') {
      // teleferik hattı: kabinler aralıklarla bir istasyondan öbürüne gider; varış istasyonunda kaybolup baştan çıkar
      const L = Math.hypot(o.x1 - o.x0, o.y1 - o.y0), ln = { x0: o.x0, y0: o.y0, x1: o.x1, y1: o.y1, L, v: o.v || 2, n: o.n || 3, w: o.w || 3, cabins: [] };
      for (let k = 0; k < ln.n; k++) {
        const cb = { kind: 'cabin', s: (L * k) / ln.n + (o.s0 || 0), x: 0, y: 0, w: ln.w, h: 0.5, tx: 0, ty: 0, dx: 0, dy: 0, line: ln, a: 0, b: 0 };
        ln.cabins.push(cb); G.plats.push(cb);
        placeCabin(cb);
      }
      G.lines.push(ln);
    } else if (o.k === 'firca') {
      // oto yıkama fırçası: tavandaki rayda gidip gelir; değeni itip sektirir (can almaz), bug'ları yıkayıp götürür.
      // tepesindeki taşıyıcıya binilir
      const br = { x0: o.x0, x1: o.x1, x: o.x0, y0: o.y0, y1: o.y1, v: o.v || 2.4, dir: 1, w: o.w || 1.4, spin: 0 };
      br.plat = { kind: 'brush', x: br.x - 0.3, y: br.y0 - 0.5, w: br.w + 0.6, h: 0.5, tx: 0, ty: 0, dx: 0, dy: 0, br, a: 0, b: 0 };
      G.plats.push(br.plat); G.brushes.push(br);
    } else if (o.k === 'kopuk') {
      // köpük topu: arada bir köpük baloncuğu çıkarır; baloncuk yükselir, üstünde bir süre durulunca patlar
      G.foams.push({ x: o.x, y: o.y, every: o.every || 1.4, t: o.t0 || 0, v: o.v || 1.2, top: o.top === undefined ? 2 : o.top, life: o.life || 1.1 });
    } else if (o.k === 'fener') {
      // deniz feneri: ışığı a0 ile a1 açıları arasında gidip gelir (radyan, 0 = sağ, pi/2 = aşağı)
      G.beams.push({ x: o.x, y: o.y, a0: o.a0, a1: o.a1, per: o.per || 6, half: o.half || 0.16, range: o.range || 34, a: o.a0, ph: o.ph || 0 });
    } else if (o.k === 'isik') {
      // ışık basamağı: yalnız fenerin ışığı üstüne düşerken katıdır
      G.boards.push({ x0: o.x0, x1: o.x1 === undefined ? o.x0 + 1 : o.x1, y: o.y, beam: true, inv: !!o.inv, lit: false, warn: false, per: 1, on: 1, ph: 0, sym: 0 });
    } else if (o.k === 'bant') {
      // yürüyen bant: üstündekini (oyuncu, bug, koli) v hızıyla taşır
      const bt = { x0: o.x0, x1: o.x1, y: o.y, v: o.v };
      for (let x = o.x0; x <= o.x1; x++) { G.grid[o.y * G.W + x] = T.BELT; G.beltAt.set(o.y * G.W + x, bt); }
      G.belts.push(bt);
    } else if (o.k === 'koli') {
      // koli makinesi: bandın başına arada bir koli bırakır; bant taşır, uçtan düşen koli yere oturur (yığılır)
      G.crateSp.push({ x: o.x, y: o.y, every: o.every || 2.5, t: o.t0 || 0, max: o.max || 99, made: 0 });
    } else if (o.k === 'pres') {
      // hidrolik pres / şahmerdan: kafa birden iner, bir an bekler, yavaşça kalkar. altında kalanı ezer; tepesine binilir.
      // shock: şahmerdan; vurunca yerdekileri sıçratır (o an zıplayan çok yükseğe uçar), bug'ları devirir
      const pr = { x: o.x, w: o.w || 2, top: o.top, bot: o.bot, per: o.per || 3.4, ph: o.ph || 0, y: o.top, shock: o.shock || 0, hit: false, warn: false };
      pr.plat = { kind: 'press', x: pr.x, y: pr.y, w: pr.w, h: 0.5, tx: 0, ty: 0, dx: 0, dy: 0, pr, a: 0, b: 0 };
      G.plats.push(pr.plat); G.presses.push(pr);
    } else if (o.k === 'demir') {
      // ocak: arada bir kızgın demir çubuk çıkarır; çubuk makaralarda ilerler, zamanla soğur (kızgınken yakar)
      G.ironSp.push({ x0: o.x0, x1: o.x1, y: o.y, every: o.every || 3, t: o.t0 || 0, v: o.v || 2, cool: o.cool || 3, w: o.w || 3 });
    } else if (o.k === 'cam') {
      // cam teras: katı ama neredeyse görünmez; üstünden sis geçerken çiy tutup belirir
      for (let x = o.x0; x <= o.x1; x++) G.grid[o.y * G.W + x] = T.FROST;
    } else if (o.k === 'sis') {
      // sis bulutu: x0 ile x1 arasında yavaşça gidip gelir (genişlik w); içinden geçtiği cam basamakları gösterir
      G.fogs.push({ x0: o.x0, x1: o.x1, w: o.w || 8, per: o.per || 10, ph: o.ph || 0, y0: o.y0 === undefined ? 0 : o.y0, y1: o.y1 === undefined ? 14 : o.y1, x: o.x0 });
    } else if (o.k === 'dolap') {
      // dolap asansör (paternoster): kabinler kesintisiz döner; x sütununda yukarı çıkar, x + gap sütununda aşağı iner
      const pt = { x: o.x, gap: o.gap || 4, top: o.top, bot: o.bot, v: o.v || 1.6, n: o.n || 4, w: o.w || 2, cars: [] };
      pt.L = 2 * (pt.bot - pt.top) + 2 * pt.gap;
      for (let k = 0; k < pt.n; k++) { const c = { kind: 'pater', s: (pt.L * k) / pt.n, x: 0, y: 0, w: pt.w, h: 0.5, tx: 0, ty: 0, dx: 0, dy: 0, pt, a: 0, b: 0 }; placePater(c); pt.cars.push(c); G.plats.push(c); }
      G.paters.push(pt);
    } else if (o.k === 'verici') {
      // yayın vericisi: belli aralıkla genişleyen dalga halkası; halka değeni dışarı doğru iter (bug'ları devirir)
      G.waves.push({ x: o.x, y: o.y, per: o.per || 2.5, v: o.v || 7, max: o.max || 9, force: o.force || 14, ph: o.ph || 0, r: -1, hit: false });
    } else if (o.k === 'kepenk') {
      // dükkân kepengi: belli aralıkla iner (katı), bir süre kapalı kalır, kalkar
      // dawn: şafak ışığı değince kalkar ve açık kalır (o zamana dek kapalı)
      G.shutters.push({ x: o.x, y0: o.y0, y1: o.y1, ph: o.ph || 0, per: o.per || 4, open: o.open || 2, k: o.dawn ? 0 : 1, solid: false, dawn: !!o.dawn });
    } else if (o.k === 'safak') {
      // şafak: ışık x0'dan başlayıp v hızıyla sağa ilerler; değdiği kepenkleri açar, uyuyan bug'ları uyandırır
      G.dawn = { x0: o.x0, x: o.x0, v: o.v || 3, wait: o.wait || 0, tiles: [] };
    } else if (o.k === 'sabahtente') {
      // esnaf şafakta tentesini açar: ışık değince tente (sektiren) belirir
      (G.dawnTiles = G.dawnTiles || []).push({ x0: o.x0, x1: o.x1, y: o.y, on: false });
    } else if (o.k === 'vinc') {
      // vinç kancası: yükü (kiriş) a noktasından kaldırır, b noktasına taşır, indirir; bekler, geri döner
      const hk = { ax: o.ax, ay: o.ay, bx: o.bx, by: o.by, top: o.top, v: o.v || 2.6, wait: o.wait || 1.2, w: o.w || 4, t: o.t0 || 0 };
      const L1 = hk.ay - hk.top, L2 = Math.abs(hk.bx - hk.ax), L3 = hk.by - hk.top;
      hk.legs = [L1, L2, L3]; hk.L = L1 + L2 + L3; hk.cycle = 2 * (hk.L / hk.v + hk.wait);
      hk.plat = { kind: 'hook', x: hk.ax, y: hk.ay, w: hk.w, h: 0.5, tx: 0, ty: 0, dx: 0, dy: 0, hk, a: 0, b: 0 };
      placeHook(G, hk, 0);
      G.plats.push(hk.plat); G.hooks.push(hk);
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
        // oyuncunun dibinde araç belirmez (şeridin ucunda bekleyen ezilmesin)
        const pp = G.player, near = pp && !pp.dead && pp.x + pp.w > x - 2 && pp.x < x + w + 2 && pp.y + pp.h > ln.y - h - 1;
        if (!near && !G.cars.some((c) => c.lane === ln && Math.abs(c.x - x) < w + 1.5)) {
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
      if (ln.durak !== null && c.kind === 'dolmus' && !c.left) {
        const dist = (ln.durak - front) * d;
        if (dist > -0.2) want = Math.min(want, Math.max(0, dist * 3));
        if (p.plat === c.plat && p.onGround) { c.board = (c.board || 0) + dt; if (c.board > 0.5) { c.left = true; ev(G, 'honk'); } }
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
        if (L.call === L.cur || L.state === 'move') L.call = -1;
      }
    } else {
      const ty = L.floors[L.target];
      car.y = approach(car.y, ty, 3.2 * dt);
      if (car.y === ty) { L.cur = L.target; L.state = 'idle'; L.wt = -0.6; ev(G, 'ding'); }
    }
    // kattaki sensör: boşluğun önünde (iki yanda bir karo içinde) bekleyen oyuncu kabini o kata çağırır
    if (!p.dead && p.plat !== car) for (let k = 0; k < L.floors.length; k++) {
      const box = { x: L.x - 1.5, y: L.floors[k] - 1.6, w: 6, h: 1.6 };
      if (overlap(p, box) && p.onGround && (L.cur !== k || L.state !== 'idle')) { if (L.call !== k) ev(G, 'card'); L.call = k; }
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
      if (l.always) { l.t = 3; continue; }
      if (l.flash) {
        // fotokopi: her turda 0,35 sn çakar
        const ph = G.t % l.flash;
        if (ph < 0.35 && l.t <= 0 && Math.abs(l.x - p.x) < 20) ev(G, 'copy');
        l.t = ph < 0.35 ? 1 : 0;
        continue;
      }
      const near = !p.dead && Math.abs(p.x + p.w / 2 - (l.x + 0.5)) < 4.5 && p.y > l.y - 2 && p.y < l.y + 12;
      if (near && l.t <= 0) ev(G, 'lampon');
      l.t = near ? 3 : Math.max(0, l.t - dt);
    }
  }
  // ---------------- Üsküdar: vapur, karpuz, dalga ----------------
  function updateBoat(G, b, dt) {
    if (b.kind === 'kayik') {
      // kayık: yalnız üstünde biri dururken karşıya gider; boş kalınca bir süre sonra kendi iskelesine döner
      const p = G.player, on = !p.dead && p.plat === b.deck && p.onGround;
      b.empty = on ? 0 : (b.empty || 0) + dt;
      const to = on ? b.b : b.empty > 3 ? b.a : null;
      if (to === null || b.x === to) { b.v = Math.max(0, b.v - 6 * dt); return; }
      const d = Math.sign(to - b.x), left = Math.abs(to - b.x);
      b.v = Math.min(b.vmax, b.v + 3 * dt, Math.sqrt(2 * 3 * left) + 0.1);
      b.x = left <= b.v * dt ? to : b.x + d * b.v * dt;
      return;
    }
    if (b.state === 'wait') {
      b.wt += dt;
      if (b.wt >= b.wait) { b.state = 'go'; b.wt = 0; if (Math.abs(b.x - G.player.x) < 20) ev(G, b.kind === 'vapur' ? 'horn' : 'motor'); }
    } else {
      const to = b.dir > 0 ? b.b : b.a, left = Math.abs(to - b.x);
      b.v = Math.min(b.vmax, b.v + 2.5 * dt, Math.sqrt(2 * 2.5 * left) + 0.1);
      b.x = left <= b.v * dt ? to : b.x + b.dir * b.v * dt;
      if (b.x === to) { b.state = 'wait'; b.v = 0; b.dir = -b.dir; }
    }
  }
  function updateSpawners(G, dt) {
    for (const s of G.spawners) {
      if (s.x < G.cam - 4 || s.x > G.cam + VW + 6) continue;
      s.t += dt;
      if (s.t >= s.every) {
        s.t = 0;
        const e = makeEnemy(G, 'karpuz', s.x, s.y);
        e.vx = s.dir * s.v; e.w = 0.9; e.h = 0.9; e.y = s.y + 1 - e.h - 0.001; G.ents.push(e); ev(G, 'roll');
      }
    }
  }
  function tideY(t, d) {
    const ph = (((t / d.per + d.ph) % 1) + 1) % 1 * d.per, rise = 0.9, lowT = d.per - d.high - 2 * rise;
    if (ph < lowT) return d.lo;
    if (ph < lowT + rise) return d.lo + (d.hi - d.lo) * (ph - lowT) / rise;
    if (ph < lowT + rise + d.high) return d.hi;
    return d.hi + (d.lo - d.hi) * (ph - lowT - rise - d.high) / rise;
  }
  function updateTides(G) {
    const p = G.player;
    for (const d of G.tides) {
      const prev = d.y;
      d.y = tideY(G.t, d);
      if (d.y < prev - 0.01 && prev >= d.lo - 0.02 && Math.abs((d.x0 + d.x1) / 2 - p.x) < 24 && d.y < d.lo - 0.05 && prev === d.lo) ev(G, 'wave');
      const inX = (b) => b.x + b.w > d.x0 && b.x < d.x1;
      // suya giren oyuncuyu dalga yakar ve kıyıya doğru fırlatır; bug'ları alıp götürür
      if (!p.dead && inX(p) && p.y + p.h > d.y + 0.35 && p.inv <= 0 && p.star <= 0) {
        hurt(G); if (!p.dead) { p.vy = -13; p.vx = -5; p.onGround = false; } ev(G, 'splash');
      }
      for (const e of G.ents) if (!e.dead && !e.harmless && inX(e) && e.y + e.h > d.y + 0.3) { killEnemy(G, e, true, 100); ev(G, 'splash'); }
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
      if (s.dawn) {
        const want = !G.dawn || G.dawn.x < s.x + 0.5;
        s.k = approach(s.k, want ? 0 : 1, 1 / 120 / 0.8);
        if (want === s.solid) continue;
        s.solid = want;
        for (let y = s.y0; y <= s.y1; y++) setTile(G, s.x, y, want ? T.SHUTTER : T.EMPTY);
        if (!want && s.x > G.cam - 2 && s.x < G.cam + VW + 2) ev(G, 'shutterup');
        continue;
      }
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
  // ---------------- Ataşehir: borsa panoları, lazer alarmı, şalterler ----------------
  const ALARM = 4.5;
  function boardPhase(G, b) { return (((G.t / b.per + b.ph) % 1) + 1) % 1 * b.per; }
  function beamAngle(G, bm, t) { return bm.a0 + (bm.a1 - bm.a0) * (0.5 - 0.5 * Math.cos(2 * Math.PI * (t / bm.per + bm.ph))); }
  // fenerin ışığı o noktaya düşüyor mu (t anında)
  function beamLit(G, x, y, t) {
    for (const bm of G.beams) {
      const dx = x - bm.x, dy = y - bm.y, d = Math.hypot(dx, dy);
      if (d > bm.range) continue;
      let da = Math.atan2(dy, dx) - beamAngle(G, bm, t);
      da = Math.atan2(Math.sin(da), Math.cos(da));
      if (Math.abs(da) < bm.half + 0.6 / Math.max(1, d)) return true;
    }
    return false;
  }
  function updateBoards(G) {
    for (const bm of G.beams) bm.a = beamAngle(G, bm, G.t);
    for (const b of G.boards) {
      let want;
      if (b.beam) {
        const cx = (b.x0 + b.x1 + 1) / 2, cy = b.y + 0.5;
        // inv: gölge basamağı, yalnız ışık üstünde değilken katı
        const litNow = beamLit(G, cx, cy, G.t) || beamLit(G, b.x0 + 0.2, cy, G.t) || beamLit(G, b.x1 + 0.8, cy, G.t);
        const litSoon = beamLit(G, cx, cy, G.t + 0.45);
        want = b.inv ? !litNow : litNow;
        b.warn = want && (b.inv ? litSoon : !litSoon);
      } else {
        const ph = boardPhase(G, b);
        want = ph < b.on;
        b.warn = want && ph > b.on - 0.7;
      }
      if (want === b.lit) continue;
      const box = { x: b.x0, y: b.y, w: b.x1 - b.x0 + 1, h: 1 };
      if (want) {
        // yanarken içinde oyuncu varsa onu kapatmaz (geçince yanar); bug'ı üstüne çıkarır
        if (G.player && !G.player.dead && overlap(G.player, box)) continue;
        for (const e of G.ents) if (!e.dead && overlap(e, box)) e.y = b.y - e.h;
      }
      b.lit = want;
      for (let x = b.x0; x <= b.x1; x++) setTile(G, x, b.y, want ? T.PANO : T.EMPTY);
    }
  }
  function chartY(G, pl) { return pl.b - (pl.b - pl.a) * (0.5 - 0.5 * Math.cos(2 * Math.PI * (G.t / pl.per + pl.ph))); }
  function laserOn(G, l) { if (!l.per) return true; return (((G.t / l.per + l.ph) % 1) + 1) % 1 * l.per < l.on; }
  function laserBox(l) {
    return l.vert ? { x: l.x0 + 0.4, y: l.y0, w: 0.2, h: l.y1 - l.y0 + 1 } : { x: l.x0, y: l.y - 0.08, w: l.x1 - l.x0 + 1, h: 0.16 };
  }
  function updateLasers(G, dt) {
    if (G.alarm > 0) { G.alarm = Math.max(0, G.alarm - dt); if (!G.alarm) G.alarmCD = 0.8; }
    else G.alarmCD = Math.max(0, G.alarmCD - dt);
    const p = G.player;
    for (const l of G.lasers) {
      if (l.ya !== undefined) {   // tarayıcı: üçgen dalgayla ya ↔ yb
        const u = (((G.t / l.per + l.ph) % 1) + 1) % 1, f = u < 0.5 ? u * 2 : 2 - u * 2;
        l.y = l.ya + (l.yb - l.ya) * f + 0.5; l.active = true;
      } else l.active = laserOn(G, l);
      if (!l.active || G.alarm > 0 || G.alarmCD > 0) continue;
      const box = laserBox(l);
      let who = null;
      if (!p.dead && overlap(p, box)) who = p;
      else for (const e of G.ents) if (!e.dead && !e.harmless && !e.tripped && e.kind !== 'boss' && overlap(e, box)) { who = e; e.tripped = true; break; }
      if (who) soundAlarm(G, l);
    }
    updateGates(G, dt);
    for (const v of G.vents) v.open = Math.max(0, v.open - dt);
  }
  function soundAlarm(G, l) {
    G.alarm = ALARM; G.alarmX = l.x0; ev(G, 'alarm');
    // ekrandaki menfezlerden birer bug düşer (her menfezden aynı anda en çok iki)
    for (const v of G.vents) {
      if (v.x < G.cam - 1 || v.x > G.cam + VW + 1) continue;
      v.kids = v.kids.filter((e) => !e.dead && G.ents.includes(e));
      if (v.kids.length >= 2) continue;
      const e = makeEnemy(G, 'bug', v.x, v.y + 1);
      e.vx = G.player.x < v.x ? -2 : 2; e.vy = 2; G.ents.push(e); v.kids.push(e); v.open = 0.6;
    }
  }
  function updateGates(G, dt) {
    const p = G.player;
    for (const g of G.agates) {
      const want = (G.alarm > 0) !== g.inv;
      g.k = approach(g.k, want ? 1 : 0, dt / 0.22);
      if (want === g.solid) continue;
      g.solid = want;
      if (want) {
        const box = { x: g.x0, y: g.y0, w: g.x1 - g.x0 + 1, h: g.y1 - g.y0 + 1 };
        if (!p.dead && overlap(p, box)) {
          if (box.w > box.h) { p.y = g.y0 - p.h; p.vy = Math.min(p.vy, 0); }   // yatay kapak: üstüne çıkar
          else p.x = p.x + p.w / 2 < g.x0 + box.w / 2 ? g.x0 - p.w - 0.01 : g.x1 + 1.01;
        }
        for (const e of G.ents) if (!e.dead && !e.harmless && e.kind !== 'boss' && overlap(e, box)) { killEnemy(G, e, true, 200); ev(G, 'crush'); }
      }
      for (let y = g.y0; y <= g.y1; y++) for (let x = g.x0; x <= g.x1; x++) setTile(G, x, y, want ? T.GATE : T.EMPTY);
    }
  }
  function zapUnder(G, b) {
    const ty = Math.floor(b.y + b.h + 0.02);
    for (let tx = Math.floor(b.x + 0.001); tx <= Math.floor(b.x + b.w - 0.001); tx++) {
      const grp = G.zapAt.get(ty * G.W + tx);
      if (grp !== undefined && G.power[grp]) return tx;
    }
    return -1;
  }
  function flipLever(G, tx, ty) {
    const lv = G.levers.find((l) => l.x === tx && l.y === ty);
    if (!lv || G.t - lv.t < 0.3) return;
    lv.t = G.t; G.power[lv.grp] = !G.power[lv.grp];
    if (lv.pulse) lv.back = lv.pulse;   // yaylı şalter: bir süre sonra kendiliğinden geri döner
    ev(G, G.power[lv.grp] ? 'powerup' : 'powerdown');
  }
  function updateLevers(G, dt) {
    for (const lv of G.levers) {
      if (!lv.back) continue;
      lv.back = Math.max(0, lv.back - dt);
      if (!lv.back) { lv.t = G.t; G.power[lv.grp] = !G.power[lv.grp]; ev(G, G.power[lv.grp] ? 'powerup' : 'powerdown'); }
    }
  }
  // ---------------- Yerebatan: sandal, Medusa, taşkın ----------------
  function updateSandal(G, b, dt) {
    // çağlayana varan sandal batar; biraz sonra baştan yeniden çıkar
    if (b.sinkT > 0) {
      b.sinkT -= dt; b.deck.y = b.y + Math.min(3, (2.4 - b.sinkT) * 2);
      if (b.sinkT <= 0) { b.x = b.x0; b.vx = 0; b.deck.y = b.y; b.sinkT = 0; }
      return;
    }
    if (b.sink && b.x >= b.x1 - 0.01) { b.sinkT = 2.4; ev(G, 'splash'); if (G.player.plat === b.deck) G.player.plat = null; return; }
    let cur = 0;
    for (const c of G.currents) if (b.x + b.w / 2 > c.x0 && b.x + b.w / 2 < c.x1) cur += c.v;
    b.vx += (cur - b.vx) * (1 - Math.exp(-0.9 * dt));
    let nx = b.x + b.vx * dt;
    if (nx < b.x0) { nx = b.x0; b.vx = Math.abs(b.vx) * 0.15; }
    if (nx > b.x1) { nx = b.x1; b.vx = -Math.abs(b.vx) * 0.15; }
    // önündeki sütun dibi (su hizasındaki katı karo)
    const ty = Math.floor(b.y - 0.3);
    if (b.vx > 0) { const tx = Math.floor(nx + b.w - 0.001); if (solid(G, tx, ty)) { nx = tx - b.w; if (b.vx > 1) { ev(G, 'thunk'); b.bump = 0.25; } b.vx = -b.vx * 0.15; } }
    else if (b.vx < 0) { const tx = Math.floor(nx + 0.001); if (solid(G, tx, ty)) { nx = tx + 1; if (b.vx < -1) { ev(G, 'thunk'); b.bump = 0.25; } b.vx = -b.vx * 0.15; } }
    b.x = nx; b.bump = Math.max(0, b.bump - dt);
  }
  function gazeBox(G, m) {
    // bakış katı karoya kadar uzanır
    const band = (k) => { for (let j = 0; j < m.w; j++) if (m.dir === 'd' ? solid(G, m.x + j, m.y + k) : solid(G, m.dir === 'l' ? m.x - k : m.x + k, m.y + j)) return true; return false; };
    let n = 1;
    while (n <= m.len && !band(n)) n++;
    n -= 1;
    if (m.dir === 'l') return { x: m.x - n, y: m.y, w: n, h: m.w };
    if (m.dir === 'r') return { x: m.x + 1, y: m.y, w: n, h: m.w };
    return { x: m.x, y: m.y + 1, w: m.w, h: n };
  }
  function updateMedusas(G, dt) {
    const p = G.player;
    for (const m of G.medusas) {
      const ph = (((G.t / m.per + m.ph) % 1) + 1) % 1 * m.per;
      const was = m.on;
      m.on = ph < m.open; m.warn = !m.on && ph > m.per - 0.7;
      if (m.on && !was && Math.abs(m.x - p.x) < 14) ev(G, 'gaze');
      if (!m.on) continue;
      const box = gazeBox(G, m);
      m.box = box;
      if (!box.w || !box.h) continue;
      for (const e of G.ents) if (!e.dead && !e.harmless && e.kind !== 'boss' && !e.minion && overlap(e, box)) petrify(G, e);
      if (!p.dead && !(p.stone > 0) && !(p.stoneCD > 0) && p.star <= 0 && overlap(p, box)) { p.stone = 1.1; p.vx = 0; ev(G, 'stone'); }
    }
  }
  // taşa dönen bug: düşer, inince karoya oturur (basılan, katı blok)
  function petrify(G, e) {
    e.dead = true; e.deadT = 9; e.flip = false;
    addScore(G, 100, e.x + e.w / 2, e.y);
    G.stones.push({ x: e.x, y: e.y, vy: Math.max(0, e.vy), kind: e.kind, face: e.vx > 0 ? 1 : -1 });
    G.fx.push({ k: 'stonepuff', x: e.x + e.w / 2, y: e.y + e.h / 2, t: 0 });
    ev(G, 'stone');
  }
  function updateStones(G, dt) {
    G.stones = G.stones.filter((s) => {
      s.vy = Math.min(PH.maxFall, s.vy + PH.gFall * dt);
      const ny = s.y + s.vy * dt, cx = Math.floor(s.x + 0.44), by = Math.floor(ny + 0.875);
      if (by >= G.H) return false;   // suya düştü
      if (solid(G, cx, by) || tile(G, cx, by) === T.ONEWAY) {
        // oturduğu karonun üstü: taş blok
        const ty = by - 1;
        if (ty < 0) return false;
        const p = G.player, box = { x: cx, y: ty, w: 1, h: 1 };
        if (!p.dead && overlap(p, box)) p.y = ty - p.h;
        for (const e of G.ents) if (!e.dead && overlap(e, box)) e.y = ty - e.h;
        if (tile(G, cx, ty) === T.EMPTY) { setTile(G, cx, ty, T.STONE); G.stoneLook = G.stoneLook || new Map(); G.stoneLook.set(ty * G.W + cx, s.kind); }
        ev(G, 'thud');
        return false;
      }
      s.y = ny;
      return true;
    });
  }
  function updateNests(G, dt) {
    for (const n of G.nests) {
      if (n.x < G.cam - 2 || n.x > G.cam + VW + 2) continue;
      n.kids = n.kids.filter((e) => !e.dead && G.ents.includes(e));
      n.t += dt;
      if (n.t < n.every || n.kids.length >= n.max) continue;
      n.t = 0;
      const e = makeEnemy(G, 'bug', n.x, n.y);
      e.vx = n.dir ? n.dir * 2 : G.player.x < n.x ? -2 : 2; G.ents.push(e); n.kids.push(e);
      G.fx.push({ k: 'dust', x: n.x + 0.5, y: n.y + 1, vx: e.vx * 0.5, t: 0 });
    }
  }
  function updateFloods(G, dt) {
    const p = G.player;
    for (const d of G.floods) {
      if (d.target !== null) {
        // pompa: su iner
        d.y = Math.min(d.target, d.y + 3 * dt);
        if (d.y >= d.target) d.target = null;
      } else if (p.x + p.w > d.x0 - d.near && p.x < d.x1 + d.near) d.y = Math.max(d.hi, d.y - d.rate * dt);
      const inX = (b) => b.x + b.w > d.x0 && b.x < d.x1;
      if (!p.dead && inX(p) && p.y + p.h > d.y + 0.35 && p.inv <= 0 && p.star <= 0) {
        hurt(G); if (!p.dead) { p.vy = -14; p.onGround = false; p.plat = null; } ev(G, 'splash');
      }
      for (const e of G.ents) if (!e.dead && !e.harmless && e.kind !== 'boss' && inX(e) && e.y + e.h > d.y + 0.3) { killEnemy(G, e, true, 100); ev(G, 'splash'); }
    }
  }
  function pressPump(G, tx, ty) {
    const pm = G.pumps.find((q) => q.x === tx && q.y === ty);
    if (!pm || pm.uses <= 0 || G.t - pm.t < 0.4) return;
    pm.t = G.t; pm.uses--;
    let best = null;
    for (const d of G.floods) if (!best || Math.abs((d.x0 + d.x1) / 2 - tx) < Math.abs((best.x0 + best.x1) / 2 - tx)) best = d;
    if (best) best.target = Math.min(best.lo, best.y + pm.drop);
    ev(G, 'pump');
  }
  // ---------------- Köprü: yan rüzgâr, halat makarası, bakım sepeti ----------------
  function windActive(G, w) { if (!w.per) return true; return (((G.t / w.per + w.ph) % 1) + 1) % 1 * w.per < w.on; }
  function updateWinds(G, dt) {
    for (const w of G.winds) {
      const on = windActive(G, w);
      w.k = approach(w.k, on ? 1 : 0, dt / 0.4);
      w.warn = !on && w.per && ((((G.t / w.per + w.ph) % 1) + 1) % 1) * w.per > w.per - 0.8;
    }
  }
  // bir kutuya esen rüzgâr (karo/sn); rüzgârın geldiği yanda 3 karo içinde duvar varsa korunaklı
  function windAt(G, b) {
    let v = 0;
    const cx = b.x + b.w / 2;
    for (const w of G.winds) {
      if (!w.k || cx < w.x0 || cx > w.x1 || b.y + b.h < w.y0 || b.y > w.y1) continue;
      // korunak: rüzgârın geldiği yanda, gövdenin ya da başın iki karo üstüne kadar bir duvar/kiriş
      const up = w.v > 0 ? -1 : 1, y0 = Math.floor(b.y - 2), y1 = Math.floor(b.y + b.h - 0.05);
      let lee = false;
      for (let k = 1; k <= 3 && !lee; k++) {
        const xx = up > 0 ? Math.floor(b.x + b.w - 0.001) + k : Math.floor(b.x + 0.001) - k;
        if (xx < 0 || xx >= G.W) continue;
        for (let ty = y0; ty <= y1; ty++) if (solid(G, xx, ty)) { lee = true; break; }
      }
      if (!lee) v += w.v * w.k;
    }
    return v;
  }
  function updateTrolley(G, tr, dt) {
    const p = G.player, pl = tr.plat, on = !p.dead && p.plat === pl && p.onGround;
    const dirDown = Math.sign(tr.y1 - tr.y0) || 1;   // s artınca iniyorsa +1
    if (on) {
      tr.empty = 0;
      tr.v = Math.min(11, tr.v + 9 * Math.abs(tr.y1 - tr.y0) / tr.L * dirDown * dt + 1.2 * dt);
    } else {
      tr.empty += dt;
      if (tr.empty > 1.5 && tr.s > 0) tr.v = -2; else if (tr.s <= 0) tr.v = 0; else tr.v *= Math.exp(-3 * dt);
    }
    const prevS = tr.s;
    tr.s = Math.max(0, Math.min(tr.L, tr.s + tr.v * dt));
    if (tr.s >= tr.L && prevS < tr.L) {
      // uçtaki tampon: durur, üstündekini ileri ve yukarı fırlatır
      if (on) { const vx = tr.v * (tr.x1 - tr.x0) / tr.L; p.onGround = false; p.plat = null; p.vy = -(tr.fling || 7); p.bounce = true; p.carry = vx * 0.9; p.carryT = null; ev(G, 'fling'); }
      else ev(G, 'thunk');
      tr.v = 0;
    }
    if (tr.s <= 0 && tr.v < 0) tr.v = 0;
    const u = tr.s / tr.L;
    pl.x = tr.x0 + (tr.x1 - tr.x0) * u - tr.w / 2; pl.y = tr.y0 + (tr.y1 - tr.y0) * u;
    pl.vx = tr.v * (tr.x1 - tr.x0) / tr.L;
  }
  function updateSwing(G, sw, dt) {
    let amp = sw.amp;
    if (sw.windy) {
      let k = 0;
      for (const w of G.winds) if (sw.px > w.x0 && sw.px < w.x1) k = Math.max(k, w.k);
      sw.k = approach(sw.k, k, dt / 1.2);
      amp = 0.08 + (sw.amp - 0.08) * sw.k;
    }
    sw.a = amp * Math.sin(2 * Math.PI * (G.t / sw.per + sw.ph));
    sw.plat.x = sw.px + Math.sin(sw.a) * sw.len - sw.w / 2;
    sw.plat.y = sw.py + Math.cos(sw.a) * sw.len;
  }
  // ---------------- Eyüp: çamaşır ipleri, teleferik ----------------
  function placeCabin(cb) {
    const ln = cb.line, u = (((cb.s % ln.L) + ln.L) % ln.L) / ln.L;
    cb.x = ln.x0 + (ln.x1 - ln.x0) * u - ln.w / 2; cb.y = ln.y0 + (ln.y1 - ln.y0) * u;
  }
  function updateCabin(G, cb, dt) {
    const ln = cb.line, before = cb.s % ln.L;
    cb.s += ln.v * dt;
    if (cb.s % ln.L < before) {
      // varış istasyonu: kabin girer, baştan çıkar; üstündeki istasyona iner
      if (G.player.plat === cb) G.player.plat = null;
    }
    placeCabin(cb);
  }
  // ---------------- Şile: oto yıkama fırçası, köpük baloncukları ----------------
  function updateBrush(G, br, dt) {
    br.x += br.dir * br.v * dt;
    if (br.x >= br.x1) { br.x = br.x1; br.dir = -1; }
    if (br.x <= br.x0) { br.x = br.x0; br.dir = 1; }
    br.spin += dt * 14;
    br.plat.x = br.x - 0.3;
    const box = { x: br.x, y: br.y0, w: br.w, h: br.y1 - br.y0 + 1 }, p = G.player;
    if (!p.dead && p.plat !== br.plat && overlap(p, box)) {
      // fırça iter ve sektirir
      const side = p.x + p.w / 2 < br.x + br.w / 2 ? -1 : 1;
      p.x = side < 0 ? br.x - p.w - 0.02 : br.x + br.w + 0.02;
      p.vx = side * 7; if (p.onGround) { p.vy = -7; p.onGround = false; p.plat = null; }
      G.fx.push({ k: 'foam', x: p.x + p.w / 2, y: p.y + p.h / 2, t: 0 }); ev(G, 'whoosh');
    }
    // alçaktaki kıllar yerdeki bug'ları da yıkar (küçük oyuncu altından geçer)
    const low = { x: br.x, y: br.y0, w: br.w, h: br.y1 - br.y0 + 2 };
    for (const e of G.ents) if (!e.dead && !e.harmless && e.kind !== 'boss' && overlap(e, low)) { killEnemy(G, e, true, 200); G.fx.push({ k: 'foam', x: e.x + 0.5, y: e.y + 0.5, t: 0 }); }
  }
  function updateFoams(G, dt) {
    for (const f of G.foams) {
      if (f.x < G.cam - 3 || f.x > G.cam + VW + 3) continue;
      f.t += dt;
      if (f.t < f.every) continue;
      f.t = 0;
      const b = { kind: 'bubble', x: f.x - 0.3, y: f.y, w: 1.6, h: 0.5, tx: 0, ty: 0, dx: 0, dy: 0, a: 0, b: 0, vy: -f.v, top: f.top, life: f.life, stood: 0, x0: f.x - 0.3, age: 0 };
      G.plats.push(b); G.bubbles.push(b);
    }
    const p = G.player;
    G.bubbles = G.bubbles.filter((b) => {
      b.age += dt;
      b.y += b.vy * dt; b.x = b.x0 + Math.sin(b.age * 2.2) * 0.35;
      if (p.plat === b && p.onGround) b.stood += dt;
      const pop = b.stood > b.life || b.y < b.top;
      if (pop) {
        G.plats.splice(G.plats.indexOf(b), 1); if (p.plat === b) p.plat = null;
        G.fx.push({ k: 'pop', x: b.x + b.w / 2, y: b.y, t: 0 }); if (b.x > G.cam - 1 && b.x < G.cam + VW + 1) ev(G, 'pop');
      }
      return !pop;
    });
  }
  // ---------------- Sanayi: yürüyen bant, koliler, pres ve şahmerdan, kızgın demir ----------------
  function beltUnder(G, b) {
    const ty = Math.floor(b.y + b.h + 0.02);
    for (let tx = Math.floor(b.x + 0.001); tx <= Math.floor(b.x + b.w - 0.001); tx++) { const bt = G.beltAt.get(ty * G.W + tx); if (bt) return bt; }
    return null;
  }
  function updateCrates(G, dt) {
    for (const sp of G.crateSp) {
      if (sp.made >= sp.max || sp.x < G.cam - 4 || sp.x > G.cam + VW + 4) continue;
      sp.t += dt;
      if (sp.t < sp.every) continue;
      sp.t = 0; sp.made++;
      const c = { kind: 'crate', x: sp.x + 0.05, y: sp.y + 0.1, w: 0.9, h: 0.5, tx: 0, ty: 0, dx: 0, dy: 0, a: 0, b: 0, vx: 0, vy: 0 };
      G.plats.push(c); G.crates.push(c);
    }
    const p = G.player;
    G.crates = G.crates.filter((c) => {
      const ox = c.x, oy = c.y, box = { x: c.x, y: c.y, w: c.w, h: 0.9 };
      const bt = beltUnder(G, box);
      if (bt) { c.vx = bt.v; c.vy = 0; } else c.vy = Math.min(PH.maxFall, c.vy + PH.gFall * dt);
      c.x += c.vx * dt;
      const tx = Math.floor(c.x + c.w / 2);
      if (c.vx && solid(G, c.vx > 0 ? Math.floor(c.x + c.w) : Math.floor(c.x), Math.floor(c.y + 0.5))) { c.x = ox; c.vx = 0; }
      if (!bt) {
        const ny = c.y + c.vy * dt, by = Math.floor(ny + 0.9);
        if (by >= G.H) { G.plats.splice(G.plats.indexOf(c), 1); return false; }
        if (solid(G, tx, by)) {
          // yere oturdu: koli karosu (yığılır)
          const ty = by - 1, cell = { x: tx, y: ty, w: 1, h: 1 };
          if (ty >= 0 && tile(G, tx, ty) === T.EMPTY) {
            if (!p.dead && overlap(p, cell)) p.y = ty - p.h;
            setTile(G, tx, ty, T.CRATE);
          }
          G.plats.splice(G.plats.indexOf(c), 1); if (p.plat === c) p.plat = null;
          ev(G, 'thud');
          return false;
        }
        c.y = ny;
      }
      c.dx = c.x - ox; c.dy = c.y - oy;
      return true;
    });
  }
  function pressY(G, pr) {
    const t = (((G.t / pr.per + pr.ph) % 1) + 1) % 1 * pr.per, fall = 0.22, stay = 0.6, wait = 0.6, rise = pr.per - fall - stay - wait;
    if (t < fall) return pr.top + (pr.bot - pr.top) * (t / fall) * (t / fall);
    if (t < fall + stay) return pr.bot;
    if (t < fall + stay + rise) return pr.bot - (pr.bot - pr.top) * ((t - fall - stay) / rise);
    return pr.top;
  }
  function updatePress(G, pr, dt) {
    const prev = pr.y;
    pr.y = pressY(G, pr);
    const t = (((G.t / pr.per + pr.ph) % 1) + 1) % 1 * pr.per;
    pr.warn = t > pr.per - 0.6;
    pr.plat.y = pr.y; pr.plat.x = pr.x;
    const p = G.player, head = { x: pr.x, y: pr.y, w: pr.w, h: 1 }, under = { x: pr.x + 0.05, y: pr.y + 0.5, w: pr.w - 0.1, h: Math.max(0, pr.bot + 1 - pr.y - 0.5) };
    // iniyor: altındakini ezer (oyuncuyu yana iter)
    if (pr.y > prev + 0.01) {
      if (!p.dead && p.plat !== pr.plat && overlap(p, head)) {
        if (p.inv <= 0 && p.star <= 0) hurt(G);
        if (!p.dead) p.x = p.x + p.w / 2 < pr.x + pr.w / 2 ? pr.x - p.w - 0.02 : pr.x + pr.w + 0.02;
        ev(G, 'crush');
      }
      for (const e of G.ents) if (!e.dead && !e.harmless && e.kind !== 'boss' && overlap(e, head)) { killEnemy(G, e, false, 200); ev(G, 'crush'); }
    }
    void under;
    const hit = pr.y >= pr.bot - 0.001;
    if (hit && !pr.hit) {
      // vuruş: toz, sarsıntı; şahmerdan yerdekileri sıçratır
      G.fx.push({ k: 'dust', x: pr.x - 0.2, y: pr.bot + 1, vx: -2.4, t: 0 }, { k: 'dust', x: pr.x + pr.w + 0.2, y: pr.bot + 1, vx: 2.4, t: 0 });
      if (Math.abs(pr.x - p.x) < 16) { ev(G, pr.shock ? 'slam' : 'thud'); G.shake = Math.max(G.shake, pr.shock ? 0.35 : 0.15); }
      if (pr.shock) {
        const cx = pr.x + pr.w / 2;
        if (!p.dead && Math.abs(p.x + p.w / 2 - cx) < pr.shock && p.y + p.h > pr.bot + 1 - 4.5 && p.y + p.h < pr.bot + 1.2) {
          if (p.onGround) { p.vy = -9; p.onGround = false; p.plat = null; }
          else if (p.vy < 0 && p.jumping) { p.vy = Math.min(p.vy, -21); p.bounce = true; G.fx.push({ k: 'goldpop', x: p.x + p.w / 2, y: p.y + p.h, t: 0 }); }
        }
        for (const e of G.ents) if (!e.dead && !e.harmless && e.kind !== 'boss' && e.onGround && Math.abs(e.x + e.w / 2 - cx) < pr.shock) { killEnemy(G, e, true, 100); }
      }
    }
    pr.hit = hit;
  }
  function updateIrons(G, dt) {
    for (const sp of G.ironSp) {
      if (sp.x0 > G.cam + VW + 6 || sp.x1 < G.cam - 6) continue;
      sp.t += dt;
      if (sp.t < sp.every) continue;
      sp.t = 0;
      const ir = { kind: 'iron', x: sp.x0, y: sp.y, w: sp.w, h: 0.5, tx: 0, ty: 0, dx: 0, dy: 0, a: 0, b: 0, sp, heat: 1, vy: 0, drop: false };
      G.plats.push(ir); G.irons.push(ir);
    }
    const p = G.player;
    G.irons = G.irons.filter((ir) => {
      const ox = ir.x, oy = ir.y;
      ir.heat = Math.max(0, ir.heat - dt / ir.sp.cool);
      if (!ir.drop) { ir.x += ir.sp.v * dt; if (ir.x >= ir.sp.x1) ir.drop = true; }
      else { ir.vy = Math.min(PH.maxFall, ir.vy + PH.gFall * dt); ir.y += ir.vy * dt; }
      ir.dx = ir.x - ox; ir.dy = ir.y - oy;
      // kızgın demir yakar (üstünde durmak da)
      if (ir.heat > 0.25 && !p.dead && p.inv <= 0 && p.star <= 0) {
        const box = { x: ir.x, y: ir.y - 0.05, w: ir.w, h: 0.6 };
        if (overlap(p, box) || (p.plat === ir && p.onGround)) {
          hurt(G); if (!p.dead) { p.vy = -9; p.onGround = false; p.plat = null; }
          G.fx.push({ k: 'steam', x: p.x + p.w / 2, y: p.y + p.h, t: 0 }); ev(G, 'sizzle');
        }
      }
      if (ir.y > G.H + 1) { G.plats.splice(G.plats.indexOf(ir), 1); if (p.plat === ir) p.plat = null; return false; }
      return true;
    });
  }
  // ---------------- Çamlıca: sis ve cam teras, dolap asansör, yayın dalgaları ----------------
  function fogX(G, f) { return f.x0 + (f.x1 - f.x0) * (0.5 - 0.5 * Math.cos(2 * Math.PI * (G.t / f.per + f.ph))); }
  // bir noktadaki sis yoğunluğu (0..1)
  function fogAt(G, x, y) {
    let d = 0;
    for (const f of G.fogs) {
      if (y < f.y0 || y > f.y1) continue;
      const u = Math.abs(x - (f.x + f.w / 2)) / (f.w / 2);
      if (u < 1) d = Math.max(d, 1 - u * u);
    }
    return d;
  }
  function placePater(c) {
    const pt = c.pt, H2 = pt.bot - pt.top, s2 = ((c.s % pt.L) + pt.L) % pt.L;
    // yol: sol sütunda aşağıdan yukarı, tepede sağa, sağ sütunda yukarıdan aşağı, dipte sola
    if (s2 < H2) { c.x = pt.x; c.y = pt.bot - s2; }
    else if (s2 < H2 + pt.gap) { c.x = pt.x + (s2 - H2); c.y = pt.top; }
    else if (s2 < 2 * H2 + pt.gap) { c.x = pt.x + pt.gap; c.y = pt.top + (s2 - H2 - pt.gap); }
    else { c.x = pt.x + pt.gap - (s2 - 2 * H2 - pt.gap); c.y = pt.bot; }
  }
  function updateWaves(G, dt) {
    const p = G.player;
    for (const w of G.waves) {
      const t = (((G.t / w.per + w.ph) % 1) + 1) % 1 * w.per, r = t * w.v;
      if (r < w.r) { w.hit = false; w.hitE = new Set(); if (Math.abs(w.x - p.x) < 16) ev(G, 'wave2'); }
      w.r = r;
      if (r > w.max) continue;
      const hitAt = (b) => { const dx = b.x + b.w / 2 - w.x, dy = b.y + b.h / 2 - w.y, d = Math.hypot(dx, dy); return Math.abs(d - r) < 0.6 ? [dx / (d || 1), dy / (d || 1)] : null; };
      if (!p.dead && !w.hit) {
        const n = hitAt(p);
        if (n) {
          w.hit = true;
          const k = w.force * (1 - 0.4 * r / w.max);
          p.vx = n[0] * k * 0.8; p.vy = Math.min(p.vy, n[1] * k - 6); p.onGround = false; p.plat = null; p.bounce = true;
          G.fx.push({ k: 'spark', x: p.x + p.w / 2, y: p.y + p.h / 2, t: 0 }); ev(G, 'boing');
        }
      }
      if (!w.hitE) w.hitE = new Set();
      for (const e of G.ents) if (!e.dead && !e.harmless && e.kind !== 'boss' && !w.hitE.has(e) && hitAt(e)) { w.hitE.add(e); killEnemy(G, e, true, 100); }
    }
  }
  // ---------------- Ümraniye: şafak, vinç kancası ----------------
  function placeHook(G, hk, t) {
    // yol: a'dan kalk (yukarı), b'ye git, in; bekle; geri: kalk, a'ya git, in; bekle
    let u = ((t % hk.cycle) + hk.cycle) % hk.cycle, s;
    const half = hk.L / hk.v + hk.wait;
    let back = false;
    if (u >= half) { back = true; u -= half; }
    s = Math.min(hk.L, u * hk.v);
    if (back) s = hk.L - s;
    const [L1, L2] = hk.legs, d = Math.sign(hk.bx - hk.ax) || 1;
    let x, y;
    if (!back) {
      if (s < L1) { x = hk.ax; y = hk.ay - s; }
      else if (s < L1 + L2) { x = hk.ax + d * (s - L1); y = hk.top; }
      else { x = hk.bx; y = hk.top + (s - L1 - L2); }
    } else {
      // dönüşte yol tersinden
      if (s < L1) { x = hk.ax; y = hk.ay - s; }
      else if (s < L1 + L2) { x = hk.ax + d * (s - L1); y = hk.top; }
      else { x = hk.bx; y = hk.top + (s - L1 - L2); }
    }
    hk.plat.x = x; hk.plat.y = y;
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
    if (t === T.PANEL) { openPanel(G, tx, ty); bumpAbove(G, tx, ty); return; }
    if (t === T.LEVER) { flipLever(G, tx, ty); G.bumps.push({ tx, ty, t: 0 }); return; }
    if (t === T.PUMP) { pressPump(G, tx, ty); G.bumps.push({ tx, ty, t: 0 }); return; }   // asma tavan / taban kapağı
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
      if (s && s.chase) { e.state = 'follow'; e.chase = true; e.x1 = s.x1; e.cd = 2 + (x % 3); }
      else for (let ty = y + 1; ty < Math.min(G.H, y + 12); ty++) if (G.coins[ty * G.W + x]) { e.target = { i: ty * G.W + x, x, y: ty }; break; }
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
      case 'karpuz': {
        // yuvarlanan karpuz: kenardan düşer, duvara çarpınca patlar
        const v0 = e.vx;
        walker(G, e, dt, false);
        e.rot = (e.rot || 0) + v0 * dt / 0.45;
        if (e.vx !== v0) { killEnemy(G, e, false, 50); G.fx.push({ k: 'splat', x: e.x + e.w / 2, y: e.y + e.h * 0.6, t: 0 }); ev(G, 'splat'); }
        if (e.st > 14) return false;
        e.st += dt;
        break;
      }
      case 'hirsiz': {
        e.st += dt;
        const c = e.target;
        if (e.state === 'follow') {
          // oyuncunun tepesinde süzülür; sırası gelince dalar
          const tx = p.x + Math.sin(e.t * 0.9 + e.homeX) * 2.6, ty = p.y - 4.2 + Math.sin(e.t * 2.3) * 0.4;
          e.face = tx > e.x ? 1 : -1;
          e.x = approach(e.x, tx, 5.5 * dt); e.y = approach(e.y, ty, 4 * dt);
          e.cd -= dt;
          if (e.cd <= 0 && Math.abs(p.x - e.x) < 2.5 && !p.dead) { e.state = 'pdive'; e.st = 0; const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1; e.vx = dx / d * 9; e.vy = dy / d * 9; ev(G, 'cawk'); }
          if (p.x > e.x1 + 4 || p.x < e.homeX - 12) { e.state = 'flee'; e.st = 0; e.vx = 2.6; e.vy = -2; }
          break;
        }
        if (e.state === 'pdive') {
          e.x += e.vx * dt; e.y += e.vy * dt;
          if (e.st > 0.7) { e.state = 'follow'; e.cd = 2.6; }
          break;
        }
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
    if (G.belts.length && e.onGround) { const bt = beltUnder(G, e); if (bt && moveX(G, e, bt.v * dt)) e.vx = -e.vx; }
    if (G.zaps.length && e.onGround && zapUnder(G, e) >= 0) { G.fx.push({ k: 'zap', x: e.x + e.w / 2, y: e.y + e.h, t: 0 }); killEnemy(G, e, true, 200); ev(G, 'zap'); return; }
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
    // Medusa'nın bakışı: taş kesilen oyuncu bir an kıpırdayamaz; sonra kısa süre bakıştan etkilenmez
    p.stoneCD = Math.max(0, (p.stoneCD || 0) - dt);
    if (p.stone > 0) {
      p.stone = Math.max(0, p.stone - dt);
      if (!p.stone) p.stoneCD = 1.2;
      inp = { left: false, right: false, down: false, jump: false, run: false };
      if (p.onGround) p.vx = 0;
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
      if (p.plat && p.plat.carrier) { p.carry = p.plat.vx * 0.9; p.carryT = null; }   // kayan makaradan zıplayınca hızı sürer
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
    // yürüyen bant: üstündekini taşır
    if (G.belts.length && p.onGround && !p.dead) { const bt = beltUnder(G, p); if (bt) moveX(G, p, bt.v * dt); }
    // yan rüzgâr: havadakini tam, yerdekini az iter
    if (G.winds.length && !p.dead) { const wv = windAt(G, p); p.wind = wv; if (wv) moveX(G, p, wv * (p.onGround ? 0.4 : 1) * dt); }
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
        if (!G.carts.has(ct) && !G.L.tente) {
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
      // çamaşır ipi: esner, sektirir; çamaşırlardan biri havalanır
      if (!wasGround && r.plat && r.plat.kind === 'rope') {
        const rp = r.plat.rope, hgt = Math.max(0, p.y - (p.airTop === undefined ? p.y : p.airTop));
        const up = clamp(Math.sqrt(2 * PH.gHold * (0.85 * hgt + (inp.jump ? 1.6 : 0.6))), 9, 19.5);
        p.vy = -up; p.onGround = false; p.plat = null; p.bounce = true; p.jumping = inp.jump;
        rp.sag = 1; rp.hx = p.x + p.w / 2 - rp.x0; p.airTop = p.y;
        p.sq = 0.4; p.sqv = -12;
        G.fx.push({ k: 'clothes', x: p.x + p.w / 2, y: rp.y, vx: (G.rand() - 0.5) * 3, vy: -4 - up * 0.3, t: 0, r: Math.floor(G.rand() * 4) });
        ev(G, 'boing');
      }
      // sandala inmek: baktığın yana itilir
      if (!wasGround && r.plat && r.plat.kind === 'sandal') {
        const b = r.plat.boat; b.vx = clamp(b.vx + p.face * 2.6, -4.6, 4.6);
        G.fx.push({ k: 'ripple', x: b.x + b.w / 2, y: b.y + 0.4, t: 0 }); ev(G, 'splash');
      }
      // pompanın düğmesine inmek: su iner
      if (!wasGround && G.pumps.length) for (let tx = Math.floor(p.x + 0.001); tx <= Math.floor(p.x + p.w - 0.001); tx++) if (tile(G, tx, ty) === T.PUMP) { pressPump(G, tx, ty); break; }
      // şalterin koluna inmek: elektriği keser ya da verir
      if (!wasGround && G.levers.length) for (let tx = Math.floor(p.x + 0.001); tx <= Math.floor(p.x + p.w - 0.001); tx++) if (tile(G, tx, ty) === T.LEVER) { flipLever(G, tx, ty); break; }
      // yüksekten terazi kefesine düşmek: sapan; çaycının tepsisine ilk binişte çay ikramı
      if (r.plat && r.plat.kind === 'pan' && fallV > 10) r.plat.sc.snap = 0.4;
      if (r.plat && r.plat.kind === 'tray' && !r.plat.npc.served) { r.plat.npc.served = true; powerUp(G, 'cay', { x: p.x, y: p.y - 0.5, w: 1, h: 1 }); ev(G, 'serve'); }
    }
    if (p.onGround && p.plat === null) G.combo = 0;
    p.airTop = p.onGround || p.airTop === undefined ? p.y : Math.min(p.airTop, p.y);   // havadayken en yüksek nokta (ip sekmesi için)
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
    // elektrikli ızgara: elektrik varken üstüne basanı çarpar, havaya sıçratır
    if (G.zaps.length && !p.dead && p.onGround && p.star <= 0 && p.inv <= 0) {
      const zx = zapUnder(G, p);
      if (zx >= 0) {
        hurt(G);
        if (!p.dead) { p.vy = -11; p.onGround = false; p.plat = null; }
        G.fx.push({ k: 'zap', x: p.x + p.w / 2, y: p.y + p.h, t: 0 });
        ev(G, 'zap');
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
      if (f.k === 'ripple') return f.t < 0.8;
      if (f.k === 'foam') { f.y -= 1.5 * dt; return f.t < 0.7; }
      if (f.k === 'pop') return f.t < 0.3;
      if (f.k === 'clothes') { f.vy += 14 * dt; f.x += f.vx * dt; f.y += f.vy * dt; return f.t < 1.4; }
      if (f.k === 'stonepuff') return f.t < 0.6;
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
      } else if (pl.kind === 'float') {
        let td = null;
        for (const d of G.tides) if (!td || Math.abs((d.x0 + d.x1) / 2 - pl.x) < Math.abs((td.x0 + td.x1) / 2 - pl.x)) td = d;
        if (td) pl.y = tideY(G.t, td) - pl.off;
        else {
          // taşkın suyuyla kalkan sal
          let fd = null;
          for (const d of G.floods) if (!fd || Math.abs((d.x0 + d.x1) / 2 - pl.x) < Math.abs((fd.x0 + fd.x1) / 2 - pl.x)) fd = d;
          if (fd) pl.y = fd.y - pl.off;
        }
      } else if (pl.kind === 'boat') {
        const b = pl.boat;
        if (!pl.upper) updateBoat(G, b, dt);
        pl.x = b.x + (pl.upper ? 3 : 0);
      } else if (pl.kind === 'chart') {
        pl.y = chartY(G, pl);
      } else if (pl.kind === 'sandal') {
        updateSandal(G, pl.boat, dt); pl.x = pl.boat.x;
      } else if (pl.kind === 'hook') {
        pl.hk.t += dt; placeHook(G, pl.hk, pl.hk.t);
      } else if (pl.kind === 'pater') {
        pl.s += pl.pt.v * dt; placePater(pl);
      } else if (pl.kind === 'press') {
        updatePress(G, pl.pr, dt);
      } else if (pl.kind === 'crate' || pl.kind === 'iron') {
        // updateCrates / updateIrons taşır
      } else if (pl.kind === 'brush') {
        updateBrush(G, pl.br, dt);
      } else if (pl.kind === 'bubble') {
        // köpük: updateFoams taşır
      } else if (pl.kind === 'cabin') {
        updateCabin(G, pl, dt);
      } else if (pl.kind === 'rope') {
        pl.rope.sag = Math.max(0, pl.rope.sag - dt * 2.2);
      } else if (pl.kind === 'trolley') {
        updateTrolley(G, pl.tr, dt);
      } else if (pl.kind === 'swing') {
        updateSwing(G, pl.sw, dt);
      } else if (pl.rail && !G.power[pl.grp]) {
        // elektrik yok: raylı platform yerinde durur
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
    if (G.spawners.length) updateSpawners(G, dt);
    if (G.tides.length) updateTides(G);
    if (G.boards.length) updateBoards(G);
    if (G.lasers.length || G.agates.length) updateLasers(G, dt);
    if (G.winds.length) updateWinds(G, dt);
    if (G.levers.length) updateLevers(G, dt);
    if (G.foams.length || G.bubbles.length) updateFoams(G, dt);
    for (const f of G.fogs) f.x = fogX(G, f);
    if (G.dawn) {
      // şafak ışığı ilerler; oyuncu çok geride kalırsa onu bekler
      const d = G.dawn;
      d.x = Math.min(Math.max(d.x, G.cam - 2) + d.v * dt, Math.max(d.x, G.player.x + 22));
      for (const e of G.ents) if (e.state === 'sleep' && e.x < d.x - 1) wakeBug(G, e);
      for (const dt2 of G.dawnTiles || []) if (!dt2.on && d.x > dt2.x0 + 0.5) { dt2.on = true; for (let x = dt2.x0; x <= dt2.x1; x++) setTile(G, x, dt2.y, T.CART); ev(G, 'boing'); }
    }
    if (G.waves.length) updateWaves(G, dt);
    if (G.crateSp.length || G.crates.length) updateCrates(G, dt);
    if (G.ironSp.length || G.irons.length) updateIrons(G, dt);
    if (G.medusas.length) updateMedusas(G, dt);
    if (G.stones.length) updateStones(G, dt);
    if (G.nests.length) updateNests(G, dt);
    if (G.floods.length) updateFloods(G, dt);

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
    // yuvarlanan karpuz önüne çıkan bug'ı devirir
    for (const k of G.ents) {
      if (k.kind !== 'karpuz' || k.dead) continue;
      for (const b of G.ents) if (b !== k && !b.dead && (b.kind === 'bug' || b.kind === 'virus') && overlap(k, b)) killEnemy(G, b, true, 100);
    }
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
          // vapur martısı dalışta değerse simitlerini kapar (en çok beş); kaçarken ezilirse geri verir
          if (e.chase && e.state === 'pdive' && !(p.vy > 0 && p.prevBottom <= e.y + 0.5)) {
            const n = Math.min(5, G.S.simit);
            if (n) { G.S.simit -= n; e.carry = n; G.fx.push({ k: 'score', x: p.x + 0.4, y: p.y, t: 0, text: '-' + n }); }
            e.state = 'flee'; e.st = 0; e.vx = 2.8; e.vy = -1.2; ev(G, 'cawk'); ev(G, 'steal');
            continue;
          }
          // martıya basılınca gagasındaki simit (ve yuttukları) saçılır; değmek zarar vermez
          if (e.state !== 'bonk' && p.vy > 0 && p.prevBottom <= e.y + 0.5) {
            const n = e.carry === true ? 5 : e.carry ? e.carry + 1 : 1;
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
          if (e.kind === 'karpuz') { G.fx.push({ k: 'splat', x: e.x + e.w / 2, y: e.y + e.h * 0.6, t: 0 }); ev(G, 'splat'); }
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
    updateBoards, chartY, laserBox, zapUnder, gazeBox, windAt, beamLit, beamAngle, pressY, fogAt,
  };
})(typeof window !== 'undefined' ? window : globalThis);
