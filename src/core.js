// Bug Avcısı: İstanbul — oyun çekirdeği (fizik, bloklar, düşmanlar, patronlar, akış).
// Çizimden bağımsızdır; Node'da da çalışır (testler bunu kullanır). Birimler karo (1 karo = 16 piksel).
(function (root) {
  'use strict';

  const H = 14, VW = 16;
  const PH = {
    walk: 6.5, run: 9.5, accG: 30, accA: 22, fric: 24, skid: 48,
    jumpV: 15.5, jumpRun: 1.0, gHold: 27, gRel: 85, gFall: 60, maxFall: 18,
    coyote: 0.08, buffer: 0.12,
  };
  const PW = 0.75, SMALL_H = 0.875, BIG_H = 1.75;
  const T = { EMPTY: 0, GROUND: 1, SOLID: 2, ONEWAY: 3, BLOCK: 4, USED: 5, CRACK: 6, SPIKE: 7, WALL: 8 };
  const SOLID = [false, true, true, false, true, true, true, false, true];
  const CONTENT = { K: 'simit', U: 'guc', S: 'kahve', L: 'disket' };
  const COMBO = [100, 200, 400, 800, 1000, 2000, 4000, 8000];
  const STAR_TIME = 10;

  // Patronlar: can (ezme sayısı), boyut.
  const BOSS = {
    kralbug:   { hp: 3, w: 2, h: 1.75 },
    spam:      { hp: 3, w: 2, h: 1.5 },
    marti:     { hp: 3, w: 2, h: 1.25 },
    truva:     { hp: 4, w: 2.25, h: 2 },
    sizinti:   { hp: 4, w: 2, h: 1.5 },
    dongu:     { hp: 4, w: 1.5, h: 1.5 },
    ddos:      { hp: 5, w: 2.5, h: 1.5 },
    glitch:    { hp: 5, w: 1.25, h: 1.75 },
    maviekran: { hp: 6, w: 2.75, h: 2.5 },
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
    const W = rows[0].length;
    const G = {
      S, idx, L, W, H, world: L.world - 1, section: L.section - 1,
      grid: new Uint8Array(W * H), content: new Map(), coins: new Uint8Array(W * H),
      spawns: [], ents: [], items: [], shots: [], bshots: [], plats: [], bars: [], fx: [], bumps: [],
      goal: null, checkpoint: null, arena: null, boss: null, bossKind: L.boss || null,
      time: L.time, t: 0, phase: 'play', result: null, ev: [], cam: 0, shake: 0,
      clearT: 0, dieT: 0, bossDownT: 0, combo: 0, hurry: false, rand: rng(idx * 7919 + 13),
      prev: { jump: false, run: false },
    };
    let start = { x: 2, y: 11 };
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const ch = rows[y][x], i = y * W + x;
        switch (ch) {
          case '#': G.grid[i] = T.GROUND; break;
          case '=': G.grid[i] = T.SOLID; break;
          case '-': G.grid[i] = T.ONEWAY; break;
          case 'C': G.grid[i] = T.CRACK; break;
          case '^': G.grid[i] = T.SPIKE; break;
          case 'K': case 'U': case 'S': case 'L': G.grid[i] = T.BLOCK; G.content.set(i, CONTENT[ch]); break;
          case 'b': G.coins[i] = 1; break;
          case 'e': case 's': case 'v': case 'm':
            G.spawns.push({ kind: { e: 'bug', s: 'spam', v: 'virus', m: 'marti' }[ch], x, y, done: false }); break;
          case 'o': G.bars.push({ cx: x + 0.5, cy: y + 0.5, a: (x * 1.7) % 6.28, sp: (x % 2 ? 1 : -1) * (1.9 + 0.1 * G.world), n: 5 }); break;
          case 'M': G.plats.push({ kind: 'h', x, y: y + 1, w: 3, h: 0.5, tx: x, ty: y + 1, dx: 0, dy: 0 }); break;
          case 'N': G.plats.push({ kind: 'v', x, y, w: 2, h: 0.5, tx: x, ty: y, dx: 0, dy: 0 }); break;
          case 'P': start = { x, y }; break;
          case 'G': G.goal = { x, y: y - 1, w: 1, h: 2, active: !L.boss, t: 0 }; break;
          case 'Q': G.checkpoint = { x, y, on: false }; break;
          case 'A': G.arena = { ax: x, locked: false, cam: x + 3 }; break;
          case 'B': G.bossSpawn = { x, y }; break;
        }
      }
    }
    // hareketli platformların menzili
    for (const p of G.plats) {
      if (p.kind === 'h') {
        let k = 0;
        while (p.x + k < W && !SOLID[G.grid[p.y * W + p.x + k]] && G.grid[p.y * W + p.x + k] !== T.ONEWAY) k++;
        p.a = p.x; p.b = p.x + Math.max(0, k - p.w); p.sp = 2.2; p.dir = 1;
      } else {
        p.a = p.y; p.b = p.y + 4; p.sp = 1.6; p.dir = 1;
      }
    }
    // kayıt noktasından başla
    if (S.checkpoint && S.checkpoint.stage === idx && G.checkpoint) {
      start = { x: G.checkpoint.x, y: G.checkpoint.y };
      G.checkpoint.on = true;
    }
    const h = S.power ? BIG_H : SMALL_H;
    G.player = {
      x: start.x + (1 - PW) / 2, y: start.y + 1 - h, w: PW, h, vx: 0, vy: 0, face: 1,
      onGround: true, coyote: 0, buf: 0, jumping: false, inv: 0, star: 0, plat: null,
      dropT: 0, shootCD: 0, walkT: 0, growT: 0, skid: false, dead: false, prevBottom: start.y + 1,
    };
    G.cam = clamp(G.player.x - 6, 0, W - VW);
    return G;
  }

  // ---------------- karo yardımcıları ----------------
  function tile(G, tx, ty) {
    if (tx < 0 || tx >= G.W) return T.WALL;
    if (ty < 0 || ty >= H) return T.EMPTY;
    return G.grid[ty * G.W + tx];
  }
  function setTile(G, tx, ty, v) { if (tx >= 0 && tx < G.W && ty >= 0 && ty < H) G.grid[ty * G.W + tx] = v; }
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
      for (let tx = x0; tx <= x1; tx++) if (solid(G, tx, ty)) hits.push(tx);
      if (hits.length) { b.y = ty + 1; res.up = true; res.tiles = hits; res.ty = ty; }
    }
    return res;
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
  function makeEnemy(G, kind, x, y) {
    const e = { kind, x: x + 0.0625, y: y + 0.125, w: 0.875, h: 0.875, vx: 0, vy: 0, t: G.rand() * 3, dead: false, deadT: 0, flip: false, onGround: false, minion: false };
    if (kind === 'bug') e.vx = -2;
    else if (kind === 'virus') e.vx = -1.5;
    else if (kind === 'spam') { e.vx = -2.4; e.baseY = y + 0.125; e.h = 0.75; }
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
  }

  function updateEnemy(G, e, dt) {
    e.t += dt;
    if (e.dead) {
      e.deadT += dt;
      if (e.flip) { e.vy = Math.min(PH.maxFall, e.vy + 40 * dt); e.x += e.vx * dt; e.y += e.vy * dt; }
      return e.deadT < (e.flip ? 2 : 0.5);
    }
    const p = G.player;
    switch (e.kind) {
      case 'bug': case 'virus': walker(G, e, dt, true); break;
      case 'spam':
        e.x += e.vx * dt;
        e.y = e.baseY + Math.sin(e.t * 3) * 0.6;
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
    if (e.y > H + 2) return false;
    if (e.x < G.cam - 6 || e.x > G.W + 2) return false;
    return true;
  }

  // Yürüyen düşman: duvarda ve kenarda döner.
  function walker(G, e, dt, edgeTurn) {
    e.vy = Math.min(PH.maxFall, e.vy + PH.gFall * dt);
    const hx = moveX(G, e, e.vx * dt);
    if (hx) e.vx = -e.vx;
    else {
      const fx = e.vx > 0 ? e.x + e.w + 0.02 : e.x - 0.02;
      if (tile(G, Math.floor(fx), Math.floor(e.y + e.h - 0.1)) === T.SPIKE) e.vx = -e.vx;
    }
    const r = moveY(G, e, e.vy * dt, true);
    e.onGround = r.down;
    if (r.down || r.up) e.vy = 0;
    if (edgeTurn && e.onGround) {
      const fx = e.vx > 0 ? e.x + e.w + 0.05 : e.x - 0.05;
      const fy = Math.floor(e.y + e.h + 0.1);
      const tb = tile(G, Math.floor(fx), fy);
      const onPlat = r.plat;
      if (!SOLID[tb] && tb !== T.ONEWAY && !onPlat) e.vx = -e.vx;
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

  function updatePlayer(G, inp, dt) {
    const p = G.player, S = G.S;
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
    if (dir) {
      if (p.onGround && p.vx * dir < -0.5) { p.vx += dir * PH.skid * dt; p.skid = true; }
      else if (p.vx * dir < max) p.vx = dir * Math.min(max, p.vx * dir + (p.onGround ? PH.accG : PH.accA) * dt);
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
    }

    // zıplama
    if (p.onGround) p.coyote = PH.coyote; else p.coyote = Math.max(0, p.coyote - dt);
    if (p.buf > 0 && p.coyote > 0) {
      p.vy = -(PH.jumpV + (Math.abs(p.vx) > 7 ? PH.jumpRun : 0));
      p.jumping = true; p.onGround = false; p.coyote = 0; p.buf = 0; p.plat = null;
      ev(G, p.h > 1 ? 'jumpbig' : 'jump');
    }
    if (!inp.jump) p.jumping = false;
    let g;
    if (p.vy < 0) g = p.jumping ? PH.gHold : PH.gRel;
    else g = PH.gFall;
    p.vy = Math.min(PH.maxFall, p.vy + g * dt);

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

    // hareket
    const hx = moveX(G, p, p.vx * dt);
    if (hx) p.vx = 0;
    // kamera sol sınırı ve bölüm sonu
    const left = G.cam, right = G.W - p.w;
    if (p.x < left) { p.x = left; if (p.vx < 0) p.vx = 0; }
    if (p.x > right) p.x = right;

    p.prevBottom = p.y + p.h;
    const wasGround = p.onGround;
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
    if (r.down) { p.vy = 0; p.plat = r.plat; if (!wasGround) G.combo = 0; }
    else if (!r.down && wasGround && p.vy >= 0) p.plat = null;
    if (p.onGround && p.plat === null) G.combo = 0;

    // yürüme animasyonu
    if (p.onGround) p.walkT += Math.abs(p.vx) * dt; else p.walkT = 0;

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
      for (let ty = Math.max(0, y0); ty <= Math.min(H - 1, y1); ty++) for (let tx = x0; tx <= x1; tx++) {
        const i = ty * G.W + tx;
        if (G.coins[i]) { G.coins[i] = 0; addSimit(G, 1); G.fx.push({ k: 'spark', x: tx + 0.5, y: ty + 0.5, t: 0 }); }
      }
    }
    // çukura düştü
    if (p.y > H + 0.5) die(G, true);
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
      if (it.y > H + 1 || it.x < G.cam - 4) return false;
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
        if (!e.dead && overlap(s, e)) { killEnemy(G, e, true, 200); G.fx.push({ k: 'puff', x: s.x + 0.25, y: s.y + 0.25, t: 0 }); return false; }
      }
      const b = G.boss;
      if (b && !b.dead && b.state !== 'intro' && overlap(s, b)) {
        G.fx.push({ k: 'puff', x: s.x + 0.25, y: s.y + 0.25, t: 0 });
        if (b.hurtT <= 0) damageBoss(G, 1 / 3, false);
        return false;
      }
      if (s.t > 2.5 || s.x < G.cam - 1 || s.x > G.cam + VW + 1 || s.y > H + 1) return false;
      return true;
    });
    G.bshots = G.bshots.filter((s) => {
      s.t += dt;
      if (s.g) s.vy = Math.min(PH.maxFall, s.vy + s.g * dt);
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.kind === 'drop' && s.y + s.h >= 12) { s.y = 12 - s.h; s.vy = 0; s.g = 0; }
      if (!G.player.dead && overlap(G.player, shrink(s, 0.1))) hurt(G);
      if (s.solidKill && solid(G, Math.floor(s.x + s.w / 2), Math.floor(s.y + s.h / 2))) return false;
      return s.t < (s.life || 5) && s.y < H + 1 && s.x > G.cam - 2 && s.x < G.cam + VW + 2;
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
    if (kind === 'spam' || kind === 'ddos') b.y = 3;
    if (kind === 'marti') { b.y = 3; b.x = b.R - b.w - 1; }
    if (kind === 'dongu') { b.y = 5.5; b.cx = (b.L + b.R) / 2 - b.w / 2; b.orb = 0; b.wv = 0.55; }
    if (kind === 'glitch') { b.state = 'intro'; }
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

  function updateBoss(G, dt) {
    const b = G.boss, p = G.player;
    b.t += dt; b.st += dt;
    b.hurtT = Math.max(0, b.hurtT - dt);
    b.flash = Math.max(0, b.flash - dt);
    if (b.dead) {
      b.vy = Math.min(PH.maxFall, b.vy + 30 * dt); b.y += b.vy * dt;
      return;
    }
    const pcx = p.x + p.w / 2, bcx = b.x + b.w / 2;
    const toward = pcx < bcx ? -1 : 1;
    const anger = 1 - b.hp / b.maxHp; // 0 → 1
    const set = (s) => { b.state = s; b.st = 0; };
    if (b.state === 'intro') {
      if (b.kind === 'kralbug' || b.kind === 'truva' || b.kind === 'sizinti' || b.kind === 'maviekran') bossGravity(G, b, dt);
      if (b.st > 1.4) set(b.kind === 'glitch' ? 'hide' : 'go');
      return;
    }
    switch (b.kind) {
      case 'kralbug': {
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
    G.fx = G.fx.filter((f) => {
      f.t += dt;
      if (f.k === 'debris') { f.vy += 40 * dt; f.x += f.vx * dt; f.y += f.vy * dt; return f.y < H + 1; }
      if (f.k === 'score') { f.y -= 1.5 * dt; return f.t < 0.8; }
      if (f.k === 'simitpop') return f.t < 0.5;
      return f.t < 0.35;
    });
    G.bumps = G.bumps.filter((b) => (b.t += dt) < 0.2);

    if (G.phase === 'dying') {
      G.dieT += dt;
      if (G.dieT > 0.45) { p.vy = Math.min(PH.maxFall, p.vy + 40 * dt); p.y += p.vy * dt; }
      if (G.dieT > 2.6) G.result = 'dead';
      G.prev.jump = inp.jump; G.prev.run = inp.run;
      return;
    }
    if (G.phase === 'clear') {
      G.clearT += dt;
      p.vx = 0;
      p.vy = Math.min(PH.maxFall, p.vy + PH.gFall * dt);
      const r = moveY(G, p, p.vy * dt, true); if (r.down) { p.vy = 0; p.onGround = true; }
      if (G.clearT > 1.6 && G.time > 0) {
        const n = Math.min(G.time, Math.max(1, Math.ceil(dt * 150)));
        G.time -= n; G.S.score += 50 * n; if (Math.floor(G.t * 30) % 2) ev(G, 'tick');
        if (G.time <= 0) { G.time = 0; G.tallyDone = G.clearT; }
      }
      if (G.time <= 0 && G.clearT > 1.6 && G.clearT - (G.tallyDone || G.clearT) > 1.2) G.result = 'clear';
      G.prev.jump = inp.jump; G.prev.run = inp.run;
      return;
    }

    // süre
    G.time = Math.max(0, G.time - dt);
    if (!G.hurry && G.time < 100) { G.hurry = true; ev(G, 'hurry'); }
    if (G.time <= 0) die(G);

    // platformlar
    for (const pl of G.plats) {
      const ox = pl.x, oy = pl.y;
      if (pl.b > pl.a) {
        if (pl.kind === 'h') { pl.x += pl.dir * pl.sp * dt; if (pl.x >= pl.b) { pl.x = pl.b; pl.dir = -1; } if (pl.x <= pl.a) { pl.x = pl.a; pl.dir = 1; } }
        else { pl.y += pl.dir * pl.sp * dt; if (pl.y >= pl.b) { pl.y = pl.b; pl.dir = -1; } if (pl.y <= pl.a) { pl.y = pl.a; pl.dir = 1; } }
      }
      pl.dx = pl.x - ox; pl.dy = pl.y - oy;
    }
    for (const bar of G.bars) bar.a += bar.sp * dt;

    updatePlayer(G, inp, dt);
    G.prev.jump = inp.jump; G.prev.run = inp.run;
    if (G.phase !== 'play') return;

    // kamera
    if (G.arena && G.arena.locked) {
      G.cam = approach(G.cam, G.arena.cam, 10 * dt);
    } else {
      const target = p.x - 6.5;
      if (target > G.cam) G.cam = target;
      else if (p.x - G.cam < 4.5) G.cam = Math.max(0, p.x - 4.5);
      G.cam = clamp(G.cam, 0, G.W - VW);
    }

    // düşman doğurma
    for (const s of G.spawns) {
      if (!s.done && s.x < G.cam + VW + 1.5 && s.x > G.cam - 2) { s.done = true; G.ents.push(makeEnemy(G, s.kind, s.x, s.y)); }
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
        if (p.star > 0) { killEnemy(G, e, true, 200); continue; }
        const stomp = p.vy > 0 && p.prevBottom <= e.y + 0.4 && e.kind !== 'virus';
        if (stomp) {
          const pts = COMBO[Math.min(G.combo, COMBO.length - 1)];
          if (G.combo >= COMBO.length) oneUp(G, e.x, e.y); else addScore(G, pts, e.x + e.w / 2, e.y);
          G.combo++;
          e.dead = true; e.flip = e.kind !== 'bug'; e.deadT = 0;
          if (e.flip) { e.vy = 2; e.vx = 0; }
          p.vy = inp.jump ? -14 : -9; p.jumping = inp.jump; p.y = e.y - p.h;
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

    // kayıt noktası
    const cp = G.checkpoint;
    if (cp && !cp.on && p.x + p.w / 2 > cp.x) { cp.on = true; G.S.checkpoint = { stage: G.idx }; ev(G, 'checkpoint'); }

    // patron arenası
    const a = G.arena;
    if (a && !a.locked && p.x > a.ax + 3.5 && G.bossKind) {
      a.locked = true;
      for (let y = 0; y < H; y++) setTile(G, a.ax + 2, y, T.WALL);
      spawnBoss(G);
    }
    if (G.boss) {
      updateBoss(G, dt);
      if (G.boss.dead) {
        G.bossDownT += dt;
        if (G.bossDownT > 1.5 && !G.goal.active) { G.goal.active = true; ev(G, 'goalon'); }
      }
    }

    // DEPLOY
    const g = G.goal;
    if (g && g.active && !p.dead && p.x + p.w > g.x + 0.15) {
      G.phase = 'clear'; G.clearT = 0; p.vx = 0; G.time = Math.ceil(G.time);
      p.star = 0;
      G.S.checkpoint = null;
      ev(G, 'clear');
    }
  }

  // Sonraki bölüme geçiş için oturumu güncelle
  function afterClear(S) { S.stage += 1; S.checkpoint = null; }
  function afterDeath(S) { S.lives -= 1; S.power = 0; return S.lives > 0; }

  root.BA = {
    H, VW, PH, T, SOLID, BOSS, PW, SMALL_H, BIG_H, STAR_TIME,
    rng, newRun, loadStage, step, tile, solid, afterClear, afterDeath, overlap,
    levels, moveX, moveY,
  };
})(typeof window !== 'undefined' ? window : globalThis);
