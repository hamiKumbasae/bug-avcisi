// Bütün bölümlerin baştan sona geçilebildiğini gerçek zıplama fiziğiyle denetler.
// node tests/levels.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['levels.js', 'core.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8'), ctx, { filename: f });
const BA = ctx.BA;
const LEVELS = ctx.BA_LEVELS;
const { H, PH, PW, BIG_H, T, SOLID } = BA;

let fails = 0;
function ok(c, m) { if (!c) { fails++; console.log('FAIL ' + m); } }

const STAND = (t) => SOLID[t] || t === T.ONEWAY;

function analyse(idx, revealHidden) {
  const L = LEVELS[idx];
  const S = BA.newRun();
  S.power = 1; // büyük: başı en çok takılan hâl
  const G = BA.loadStage(S, idx);
  const W = G.W;
  // gizli bloklar açığa çıkmış (katı) hâlde de bölüm geçilebilmeli
  if (revealHidden) for (let i = 0; i < G.grid.length; i++) if (G.grid[i] === T.HIDDEN) G.grid[i] = T.USED;
  // patron arenası için duvarı da ekle (gerçekte kilitlendiğinde gelir; geçiş denetimi için önemsiz)
  // hareketli platformları menzilleri boyunca sabit say
  const statics = [];
  for (const p of G.plats) {
    if (p.kind === 'h') statics.push({ x: p.a, y: p.y, w: p.b - p.a + p.w, h: 0.5, dy: 0 });
    else { statics.push({ x: p.x, y: p.a, w: p.w, h: 0.5, dy: 0 }); statics.push({ x: p.x, y: p.b, w: p.w, h: 0.5, dy: 0 }); }
  }
  G.plats = statics;
  const spikeCol = new Set();
  for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) if (G.grid[y * W + x] === T.SPIKE) spikeCol.add(x * 100 + y);

  // Durulabilen hücreler: (x,y) boş, altı basılabilir, başın üstü (2 karo) boş
  const standable = (x, y) => {
    if (x < 0 || x >= W || y < 1 || y >= H) return false;
    const t = BA.tile(G, x, y), below = BA.tile(G, x, y + 1);
    if (SOLID[t] || t === T.SPIKE) return false;
    if (SOLID[BA.tile(G, x, y - 1)]) return false;
    return STAND(below);
  };
  // Parçalar: aynı sırada bitişik durulabilen hücreler
  const segs = [];
  const segAt = new Map();
  for (let y = 0; y < H; y++) {
    let x = 0;
    while (x < W) {
      if (standable(x, y)) {
        const s = { id: segs.length, y, x0: x, x1: x };
        while (x + 1 < W && standable(x + 1, y)) x++;
        s.x1 = x;
        segs.push(s);
        for (let k = s.x0; k <= s.x1; k++) segAt.set(k * 100 + y, s);
      }
      x++;
    }
  }
  // platform yüzeyleri de parça
  for (const p of statics) {
    const y = Math.round(p.y) - 1;
    const s = { id: segs.length, y, x0: Math.floor(p.x), x1: Math.ceil(p.x + p.w) - 1, plat: true, py: p.y };
    segs.push(s);
    for (let k = s.x0; k <= s.x1; k++) if (!segAt.has(k * 100 + y)) segAt.set(k * 100 + y, s);
  }
  const findSeg = (b) => {
    const y = Math.round(b.y + b.h) - 1;
    const cx = Math.floor(b.x + b.w / 2);
    for (const k of [cx, Math.floor(b.x + 0.01), Math.floor(b.x + b.w - 0.01)]) {
      const s = segAt.get(k * 100 + y);
      if (s) return s;
    }
    return null;
  };
  const dt = 1 / 120;
  // Tek bir zıplama/düşme denemesi
  function sim(x, y, dir, speed, hold, startV, delayDir) {
    const b = { x, y, w: PW, h: BIG_H };
    let vx = startV * dir, vy = 0, t = 0, jumping = hold > 0, left = false;
    if (hold > 0) vy = -BA.jumpSpeed(vx);
    let hitSpike = false;
    while (t < 3) {
      t += dt;
      const d = t < delayDir ? 0 : dir;
      if (d) vx = Math.max(-speed, Math.min(speed, vx + d * PH.accA * dt));
      if (jumping && t > hold) jumping = false;
      const g = vy < 0 ? (jumping ? PH.gHold : PH.gRel) : PH.gFall;
      vy = Math.min(PH.maxFall, vy + g * dt);
      if (BA.moveX(G, b, vx * dt)) vx = 0;
      const r = BA.moveY(G, b, vy * dt, true);
      if (r.up) { vy = 0; jumping = false; }
      // dikene değdi mi
      const tx0 = Math.floor(b.x + 0.1), tx1 = Math.floor(b.x + b.w - 0.1), ty0 = Math.floor(b.y), ty1 = Math.floor(b.y + b.h - 0.01);
      for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) if (spikeCol.has(tx * 100 + ty) && b.y + b.h > ty + 0.45) hitSpike = true;
      if (r.down) {
        if (left) return hitSpike ? null : findSeg(b);
        if (hitSpike) return null;
      } else left = true;
      if (b.y > H) return null;
    }
    return null;
  }
  const edges = segs.map(() => new Set());
  for (const s of segs) {
    const y = s.y + 1 - BIG_H - 0.0001;
    const py = s.plat ? s.py - BIG_H : y + 0.0001;
    // kenardan, kenarın biraz gerisinden (dikene değmeden erken zıplama) ve ortadan
    const xs = [s.x0, s.x1 + 1 - PW, (s.x0 + s.x1 + 1 - PW) / 2];
    if (s.x1 - s.x0 >= 2) xs.push(s.x0 + 0.6, s.x1 + 0.4 - PW);
    const len = s.x1 - s.x0 + 1;
    for (const x of xs) {
      for (const dir of [-1, 1]) {
        for (const speed of [PH.walk, PH.run]) {
          const startV = BA.runUpSpeed(len - 1, speed);
          for (const hold of [0, 0.12, 0.25, 1]) {
            for (const delay of [0, 0.3]) {
              if (hold === 0 && delay) continue;
              const r = sim(x, py, dir, speed, hold, delay ? 0 : startV, delay);
              if (r && r !== s) edges[s.id].add(r.id);
            }
          }
        }
      }
    }
    // aynı sıradaki komşu parçaya yürüyerek (tek karo engelsiz) — zaten bitişikse aynı parça
  }
  // metro: giriş → odaya düşüş, odanın çıkışı → yukarıdaki çıkış noktası
  let metro = null;
  if (G.room) {
    const segOf = (x, y) => segAt.get(x * 100 + y) || null;
    const inSeg = G.metroIn && (segOf(G.metroIn.x, G.metroIn.y) || segOf(G.metroIn.x + 1, G.metroIn.y));
    const ex = G.room.exit;
    const exSeg = ex && (segOf(ex.x, ex.y) || segOf(ex.x - 1, ex.y));
    const outSeg = G.metroOut && (segOf(G.metroOut.x, G.metroOut.y) || segOf(G.metroOut.x + 1, G.metroOut.y));
    // odaya giriş noktasından aşağı düş
    const b = { x: G.room.x0 + 2.1, y: 2.05, w: PW, h: BIG_H };
    let vy = 0, land = null;
    for (let k = 0; k < 400 && !land; k++) { vy = Math.min(PH.maxFall, vy + PH.gFall * dt); if (BA.moveY(G, b, vy * dt, true).down) land = findSeg(b); }
    metro = { inSeg, exSeg, outSeg, land };
    if (inSeg && land) edges[inSeg.id].add(land.id);
    if (exSeg && outSeg) edges[exSeg.id].add(outSeg.id);
  }
  // başlangıç
  const P = G.player;
  const start = findSeg(Object.assign({}, P, { h: BIG_H, y: P.y + P.h - BIG_H }));
  const gx = G.goal.x;
  const goalSegs = segs.filter((s) => s.y === G.goal.y + 1 && s.x0 <= gx && s.x1 >= gx);
  const target = L.boss ? segs.filter((s) => s.x0 <= G.arena.ax + 4 && s.x1 >= G.arena.ax + 4 && s.y === 11) : goalSegs;
  const seen = new Set();
  const q = start ? [start.id] : [];
  if (start) seen.add(start.id);
  while (q.length) {
    const i = q.shift();
    for (const j of edges[i]) if (!seen.has(j)) { seen.add(j); q.push(j); }
  }
  const reached = target.some((s) => seen.has(s.id));
  // sıkışma: ulaşılan her parçadan hedefe dönülebiliyor mu
  const rev = segs.map(() => []);
  segs.forEach((s, i) => edges[i].forEach((j) => rev[j].push(i)));
  const canFinish = new Set(target.map((s) => s.id));
  const q2 = [...canFinish];
  while (q2.length) { const i = q2.shift(); for (const j of rev[i]) if (!canFinish.has(j)) { canFinish.add(j); q2.push(j); } }
  const traps = [...seen].filter((i) => !canFinish.has(i)).map((i) => segs[i]);
  // en uzak ulaşılan nokta (hata ayıklama için)
  let far = 0;
  for (const i of seen) far = Math.max(far, segs[i].x1);
  // hatıra parçası, ulaşılan bir parçanın üstünde mi
  let piece = null;
  if (G.piece) { const ps = segAt.get(Math.floor(G.piece.x) * 100 + Math.floor(G.piece.y)); piece = !!ps && seen.has(ps.id); }
  const roomOk = metro ? !!(metro.inSeg && metro.land && metro.exSeg && metro.outSeg && seen.has(metro.inSeg.id) && seen.has(metro.land.id) && seen.has(metro.exSeg.id)) : null;
  return { L, start, reached, traps, far, W, segs: segs.length, piece, metro, roomOk };
}

for (let i = 0; i < LEVELS.length; i++) {
  const L = LEVELS[i];
  const rows = L.map;
  ok(rows.length === H, `${L.world}-${L.section}: ${H} satır`);
  ok(rows.every((r) => r.length === rows[0].length), `${L.world}-${L.section}: satırlar eşit uzunlukta`);
  const count = (ch) => rows.reduce((n, r) => n + r.split(ch).length - 1, 0);
  ok(count('P') === 1, `${L.world}-${L.section}: tek başlangıç`);
  ok(count('G') === 1, `${L.world}-${L.section}: tek DEPLOY`);
  if (L.boss) { ok(count('A') === 1 && count('B') === 1, `${L.world}-${L.section}: patron arenası`); }
  else ok(count('Q') === 1, `${L.world}-${L.section}: kayıt noktası`);
  ok(count('h') === (L.section === 2 ? 1 : 0), `${L.world}-${L.section}: hatıra parçası yalnız 2. bölümde, bir tane`);
  const r = analyse(i);
  ok(r.start, `${L.world}-${L.section}: başlangıç zeminde`);
  ok(r.reached, `${L.world}-${L.section} ${L.name}: sona ulaşılabiliyor (en uzak x=${r.far}/${r.W})`);
  if (L.section === 2) ok(r.piece === true, `${L.world}-${L.section}: hatıra parçasına ulaşılabiliyor`);
  ok(r.traps.length === 0, `${L.world}-${L.section}: sıkışma yok ${r.traps.slice(0, 3).map((s) => `(${s.x0}-${s.x1},${s.y})`).join(' ')}`);
  // metro bonus odası: varsa giriş, oda ve çıkış eksiksiz ve dolaşılabilir
  const hasRoom = typeof L.room === 'number';
  ok(hasRoom === (count('E') === 1) && count('E') === count('R') && count('E') === count('O'), `${L.world}-${L.section}: metro işaretleri tutarlı`);
  if (hasRoom) {
    ok(!L.boss, `${L.world}-${L.section}: patron bölümünde metro yok`);
    ok(r.roomOk === true, `${L.world}-${L.section}: metro girişine varılır, odadan çıkılır (${JSON.stringify(r.metro && { in: !!r.metro.inSeg, land: !!r.metro.land, ex: !!r.metro.exSeg, out: !!r.metro.outSeg })})`);
    const mi = rows.findIndex((row) => row.includes('E')), mo = rows.findIndex((row) => row.includes('R'));
    ok(rows[mi].indexOf('E') < rows[mo].indexOf('R'), `${L.world}-${L.section}: metro çıkışı girişten ileride`);
  }
  if (count('X')) {
    const r2 = analyse(i, true);
    ok(r2.reached && r2.traps.length === 0, `${L.world}-${L.section}: gizli bloklar açılınca da geçilebilir`);
  }
  if (process.argv.includes('-v')) console.log(`${L.world}-${L.section} ${L.name.padEnd(20)} genişlik ${r.W} parça ${r.segs} ${r.reached ? 'tamam' : 'ULAŞILAMIYOR'}`);
}
console.log(fails ? `${fails} hata` : `levels: ${LEVELS.length} bölüm geçilebilir`);
process.exit(fails ? 1 : 0);
