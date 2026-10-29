// Çekirdek oyun kuralları: fizik, bloklar, düşmanlar, eşyalar, akış ve patronlar.
// node tests/core.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['levels.js', 'core.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8'), ctx, { filename: f });
const BA = ctx.BA;
const LV = ctx.BA_LEVELS;
const NL = LV.length, NW = NL / 3; // gerçek bölümler (denemeler sona eklenir)
const dt = 1 / 120;

let fails = 0, passes = 0;
function ok(c, m) { if (c) passes++; else { fails++; console.log('FAIL ' + m); } }

// Deneme haritası ekle (14 satır)
function custom(rows, extra) {
  const pad = rows.map((r) => r);
  while (pad.length < 14) pad.unshift('.'.repeat(pad[0].length));
  LV.push(Object.assign({ world: 1, section: 1, name: 'deneme', boss: null, time: 300, map: pad }, extra || {}));
  return LV.length - 1;
}
const NONE = { left: false, right: false, down: false, jump: false, run: false };
function run(G, inp, secs, until) {
  const n = Math.round(secs / dt);
  for (let i = 0; i < n; i++) {
    const k = typeof inp === 'function' ? inp(G, i * dt) : inp;
    BA.step(G, Object.assign({}, NONE, k), dt);
    if (until && until(G)) return true;
  }
  return false;
}
const flat = (w, extraRows) => {
  const rows = extraRows || [];
  return [...rows, '.'.repeat(w), '#'.repeat(w), '#'.repeat(w)];
};

// ---------- zıplama yüksekliği ----------
{
  const i = custom(['..P' + '.'.repeat(37), '#'.repeat(40), '#'.repeat(40)]);
  const S = BA.newRun();
  let G = BA.loadStage(S, i);
  const y0 = G.player.y;
  let minY = y0;
  run(G, { jump: true }, 1.2, (g) => { minY = Math.min(minY, g.player.y); return false; });
  const hFull = y0 - minY;
  ok(hFull > 4.1 && hFull < 4.6, `tam zıplama ~4.3 karo (${hFull.toFixed(2)})`);
  // koşarak zıplama daha yüksek
  G = BA.loadStage(S, i);
  run(G, { right: true, run: true }, 1.0);
  const y1 = G.player.y; minY = y1;
  run(G, { right: true, run: true, jump: true }, 1.2, (g) => { minY = Math.min(minY, g.player.y); return false; });
  const hRun = y1 - minY;
  ok(hRun > hFull + 0.6 && hRun < 5.8, `koşarak zıplama daha yüksek (${hRun.toFixed(2)})`);
  // momentum: bırakınca hemen durmaz
  G = BA.loadStage(S, i);
  run(G, { right: true, run: true }, 1.0);
  const xs = G.player.x;
  run(G, {}, 1.0);
  ok(G.player.x - xs > 1.5 && Math.abs(G.player.vx) < 0.01, `bırakınca kayarak durur (${(G.player.x - xs).toFixed(2)})`);
  G = BA.loadStage(S, i);
  minY = G.player.y;
  run(G, (g, t) => ({ jump: t < 0.05 }), 1.2, (g) => { minY = Math.min(minY, g.player.y); return false; });
  const hShort = y0 - minY;
  ok(hShort < 2.2 && hShort > 0.8, `kısa basış alçak zıplar (${hShort.toFixed(2)})`);
  // hız
  G = BA.loadStage(S, i);
  run(G, { right: true }, 1.0);
  ok(Math.abs(G.player.vx - BA.PH.walk) < 0.05, `yürüme hızı ${G.player.vx.toFixed(2)}`);
  G = BA.loadStage(S, i);
  run(G, { right: true, run: true }, 1.0);
  ok(Math.abs(G.player.vx - BA.PH.run) < 0.05, `koşma hızı ${G.player.vx.toFixed(2)}`);
  // tampon: yere inmeden hemen önce basılan zıplama sayılır
  G = BA.loadStage(S, i);
  run(G, (g, t) => ({ jump: t < 0.3 }), 0.3);
  let jumped = 0;
  run(G, (g, t) => { if (g.ev.some((e) => e.e === 'jump')) jumped++; return { jump: g.player.vy > 0 && g.player.y + g.player.h > 11.5 }; }, 1.5);
  ok(jumped >= 1, 'zıplama tamponu iniş öncesi basışı yakalar');
  // engelsiz yürüyüş — kamera geri dönmez ama sola yürüyebilir
  G = BA.loadStage(S, i);
  run(G, { right: true }, 2);
  const cx = G.cam;
  run(G, { left: true }, 0.5);
  ok(G.player.x >= G.cam - 1e-6, 'oyuncu ekranın solundan çıkamaz');
  void cx;
}

// ---------- bloklar ----------
{
  const i = custom([
    '..............',
    '..K..U...C....',
    '..............',
    '..............',
    '..P...........',
    '##############',
    '##############',
  ]);
  const S = BA.newRun();
  let G = BA.loadStage(S, i);
  // simit bloğu: tam altında zıpla
  G.player.x = 2.125;
  run(G, { jump: true }, 0.8);
  const ki = 8 * G.W + 2;
  ok(G.grid[ki] === BA.T.USED, 'simit bloğu kullanıldı');
  ok(S.simit === 1, 'simit +1');
  // güç bloğu: küçükken çay çıkar
  G.player.x = 5.125; G.player.vy = 0;
  run(G, NONE, 0.5);
  run(G, { jump: true }, 0.6);
  ok(G.items.length === 1 && G.items[0].kind === 'cay', 'küçükken güç bloğundan çay çıkar ' + (G.items[0] && G.items[0].kind));
  // çay sağa kayar; peşinden git
  const got = run(G, { right: true }, 4, () => S.power === 1);
  ok(got && G.player.h === BA.BIG_H, 'çay içince büyüdü');
  // büyükken çatlak blok kırılır
  G.player.x = 9.125; G.player.vx = 0;
  run(G, NONE, 0.6);
  run(G, { jump: true }, 0.6);
  ok(G.grid[8 * G.W + 9] === BA.T.EMPTY, 'büyükken çatlak blok kırıldı');
  // küçükken kırılmaz
  S.power = 0;
  G = BA.loadStage(S, i);
  G.player.x = 9.125;
  run(G, { jump: true }, 0.6);
  ok(G.grid[8 * G.W + 9] === BA.T.CRACK, 'küçükken çatlak blok kırılmadı');
  // büyükken güç bloğu laptop verir
  S.power = 1;
  G = BA.loadStage(S, i);
  G.player.x = 5.125;
  run(G, { jump: true }, 0.8);
  ok(G.items.length === 1 && G.items[0].kind === 'laptop', 'büyükken laptop çıkar');
}

// ---------- düşmanlar ----------
{
  const rows = [
    '..........................',
    '..P........e..............',
    '##########################',
    '##########################',
  ];
  const i = custom(rows);
  const S = BA.newRun();
  let G = BA.loadStage(S, i);
  // üstüne zıpla: ez
  run(G, NONE, 0.1);
  const e = G.ents.find((x) => x.kind === 'bug');
  ok(!!e, 'bug doğdu');
  G.player.x = e.x; G.player.y = e.y - 3; G.player.vy = 2; G.player.onGround = false;
  run(G, NONE, 0.4);
  ok(e.dead && !e.flip, 'bug ezildi');
  ok(S.score >= 100, 'ezme puanı');
  // yandan değince küçük oyuncu ölür
  G = BA.loadStage(S, i);
  run(G, { right: true }, 3, (g) => g.phase !== 'play');
  ok(G.phase === 'dying', 'küçük oyuncu bug ile çarpışınca öldü');
  run(G, NONE, 3);
  ok(G.result === 'dead', 'ölüm sonucu: dead');
  // büyükken küçülür
  S.power = 1;
  G = BA.loadStage(S, i);
  run(G, { right: true }, 3, (g) => S.power === 0);
  ok(S.power === 0 && G.phase === 'play' && G.player.inv > 0, 'büyük oyuncu çarpınca küçüldü, dokunulmaz');
  // virüs ezilmez
  S.power = 0;
  const j = custom(['..P........v...............', '###########################', '###########################']);
  G = BA.loadStage(S, j);
  run(G, NONE, 0.1);
  const v = G.ents.find((x) => x.kind === 'virus');
  G.player.x = v.x; G.player.y = v.y - 2; G.player.vy = 2; G.player.onGround = false;
  run(G, NONE, 0.4);
  ok(!v.dead && G.phase === 'dying', 'virüsün üstüne basınca canın gider');
  // laptop kodu virüsü yener
  S.power = 2;
  G = BA.loadStage(S, j);
  run(G, (g, t) => ({ run: t > 0.1 && t < 0.15 }), 1.5);
  ok(G.ents.some((x) => x.kind === 'virus' && x.dead), 'kod fırlatma virüsü yendi');
  // kahve: dokunulmazlık, değdiğini yener
  S.power = 0;
  G = BA.loadStage(S, j);
  G.player.star = 5;
  run(G, { right: true }, 2);
  ok(G.phase === 'play' && G.ents.some((x) => x.kind === 'virus' && x.dead), 'kahveyle virüse değince virüs yenildi');
}

// ---------- düşme, simit, can ----------
{
  const i = custom(['..P.......bbb.......', '########......######', '########......######']);
  const S = BA.newRun();
  const G = BA.loadStage(S, i);
  run(G, { right: true }, 3, (g) => g.phase === 'dying');
  ok(G.phase === 'dying', 'çukura düşünce ölüm');
  const S2 = BA.newRun();
  S2.simit = 99;
  const G2 = BA.loadStage(S2, i);
  G2.player.x = 10; G2.player.y = 10.5;
  run(G2, NONE, 0.05);
  ok(S2.lives === 4 && S2.simit === 0, `100 simit = +1 can (can ${S2.lives}, simit ${S2.simit})`);
  ok(BA.afterDeath(S2) && S2.lives === 3, 'afterDeath canı düşürür');
}

// ---------- hareketli platform ----------
{
  const i = custom([
    '..P.................',
    '#####M........######',
    '#####.........######',
  ]);
  const S = BA.newRun();
  const G = BA.loadStage(S, i);
  const pl = G.plats[0];
  ok(pl && pl.a === 5 && pl.b === 11, `platform menzili ${pl && pl.a}-${pl && pl.b}`);
  // platform soldayken üstüne yürü, sonra dur ve taşın
  run(G, NONE, 0.01);
  G.player.x = 5.6; G.player.y = pl.y - G.player.h; G.player.onGround = true;
  const x0 = G.player.x;
  run(G, NONE, 1.5);
  ok(G.phase === 'play' && G.player.x > x0 + 2, `platform oyuncuyu taşıdı (${x0.toFixed(1)} → ${G.player.x.toFixed(1)})`);
}

// ---------- DEPLOY ve kayıt noktası ----------
{
  const i = custom(['..P.....Q.......G...=', '#####################', '#####################']);
  const S = BA.newRun();
  let G = BA.loadStage(S, i);
  run(G, { right: true }, 5, (g) => g.phase === 'clear');
  ok(G.phase === 'clear', 'DEPLOY terminaline varınca bölüm biter');
  ok(G.checkpoint.on, 'kayıt noktası geçildi');
  const before = S.score;
  run(G, NONE, 9, (g) => g.result === 'clear');
  ok(G.result === 'clear' && S.score > before + 1000, `kalan süre puana döndü (+${S.score - before})`);
  // kayıt noktasından yeniden başla
  G = BA.loadStage(S, i);
  run(G, { right: true }, 1.2);
  ok(S.checkpoint && S.checkpoint.stage === i, 'kayıt noktası oturuma yazıldı');
  G = BA.loadStage(S, i);
  ok(Math.abs(G.player.x - 8.125) < 0.01, 'kayıt noktasından başladı');
}

// ---------- gizli blok, çok simitli blok ----------
{
  const i = custom(['.....X......Z.....', '..................', '..................', '..................', '..P...............', '##################', '##################'].slice(0));
  const S = BA.newRun();
  let G = BA.loadStage(S, i);
  const hx = 5, hy = 14 - 7;
  ok(BA.tile(G, hx, hy) === BA.T.HIDDEN, 'gizli blok yüklendi');
  // üstten düşen oyuncu gizli bloğun içinden geçer
  G.player.x = hx + 0.1; G.player.y = hy - 2; G.player.vy = 0;
  run(G, NONE, 0.8);
  ok(G.player.onGround && G.player.y + G.player.h > hy + 3, 'gizli blok yukarıdan geçirgen');
  // alttan zıplayınca açığa çıkar ve disket verir
  run(G, (g, t) => ({ jump: t < 0.4 }), 0.6);
  ok(BA.tile(G, hx, hy) === BA.T.USED && G.items.some((it) => it.kind === 'disket'), 'alttan vurulan gizli blok açıldı, disket çıktı');
  // çok simitli blok: art arda vuruşlarda birden çok simit
  G = BA.loadStage(S, i);
  G.player.x = 12.1;
  const s0 = S.simit;
  for (let k = 0; k < 4; k++) { run(G, (g, t) => ({ jump: t < 0.3 }), 0.9); }
  ok(S.simit - s0 >= 3 && BA.tile(G, 12, hy) === BA.T.MULTI, `çok simitli blok birden çok simit verdi (${S.simit - s0})`);
  run(G, NONE, 4.2);
  run(G, (g, t) => ({ jump: t < 0.3 }), 0.9);
  ok(BA.tile(G, 12, hy) === BA.T.USED, 'süre dolunca çok simitli blok boşaldı');
}

// ---------- metro bonus odası ----------
{
  const room = ['================', '================', '=..............=', '=..............=', '=..............=', '=..............=', '=..............=', '=..............=', '=..............=', '=..............=', '=.bbbbbbbbbbbb.=', '=.............O=', '################', '################'];
  const main = ['..P...E.........R.......G...='].map((r) => r);
  const w = main[0].length;
  const rows = [];
  for (let y = 0; y < 14; y++) {
    const m = y === 11 ? main[0] : y >= 12 ? '#'.repeat(w - 1) + '=' : '.'.repeat(w - 1) + '=';
    rows.push(m + room[y]);
  }
  const i = custom(rows, { room: w });
  const S = BA.newRun();
  const G = BA.loadStage(S, i);
  ok(G.room && G.room.exit && G.metroIn && G.metroOut && G.mainW === w, 'metro girişi, odası ve çıkışı yüklendi');
  run(G, { right: true }, 3, (g) => g.player.x + g.player.w / 2 > 5.6);
  run(G, NONE, 1.2);
  const cxIn = G.player.x + G.player.w / 2;
  run(G, { down: true }, 0.2);
  ok(G.warp && G.warp.kind === 'in', `girişte aşağı basınca iniş başladı (x=${cxIn.toFixed(2)})`);
  run(G, NONE, 2);
  ok(G.area === 'room' && !G.warp && G.cam === w && G.player.onGround, 'bonus odasına inildi');
  const s0 = S.simit;
  run(G, (g, t) => ({ right: true, jump: (t % 0.5) < 0.2 }), 4, (g) => !!g.warp);
  ok(S.simit > s0 + 5, `odada simit toplandı (${S.simit - s0})`);
  ok(G.warp && G.warp.kind === 'out', 'yürüyen merdivene girince çıkış başladı');
  run(G, NONE, 2.5);
  ok(G.area === 'main' && !G.warp && Math.abs(G.player.x + G.player.w / 2 - 17) < 0.1 && G.player.onGround, 'metro çıkışından yukarı çıkıldı');
  ok(G.cam <= G.mainW - BA.VW, 'kamera ana alanda kaldı');
  run(G, { right: true }, 3, (g) => g.phase === 'clear');
  ok(G.phase === 'clear', 'metrodan sonra bölüm bitirilebildi');
}

// ---------- dikey bölümler: tırmanış ve iniş boşluklarında kamera izler, düşüş doğru yerde öldürür ----------
{
  let tall = 0, climbs = 0, falls = 0;
  for (let idx = 0; idx < NL; idx++) {
    if (!LV[idx].vcam || LV[idx].hand) continue;   // el yapımı bölümlerin kendi denetimleri var
    tall++;
    const G = BA.loadStage(BA.newRun(), idx);
    // boşluk sütunları: kameranın oynayabildiği yerler
    for (let x = 1; x < G.W - 1; x++) {
      if (G.camLo[x] === G.camHi[x] || G.camLo[x - 1] !== G.camHi[x - 1]) continue;
      const lo = G.camLo[x], hi = G.camHi[x];
      // boşluğun tepesinden bırak: ölmeden dibe iner, kamera aşağı iner
      const G2 = BA.loadStage(BA.newRun(), idx);
      G2.player.inv = 99; G2.player.x = x + 2.1; G2.player.y = lo + 3; G2.player.vy = 0; G2.cam = Math.max(0, x - 6); G2.camY = lo;
      run(G2, (g) => { g.player.inv = 99; return {}; }, 2.5);
      if (!G2.player.dead && G2.player.onGround && G2.camY > lo + 0.5) falls++;
      climbs++;
    }
  }
  // üretilen uzun bölümler el yapımı dünyalara geçtikçe azalır
  ok(falls === climbs, `dikey boşluklarda düşen oyuncu ölmeden iner, kamera izler (${falls}/${climbs}, ${tall} uzun bölüm)`);
  // düz bantta çukura düşünce bandın altında ölür
  const idx = LV.findIndex((L, i) => i < NL && L.vcam && L.map.length > 14);
  if (idx >= 0) {
    const G = BA.loadStage(BA.newRun(), idx);
    const p = G.player, cx = Math.floor(p.x);
    p.y = Math.max(G.camHi[cx] + 15, G.H + 1); BA.step(G, {}, dt);
    ok(p.dead, 'bandın altına düşen oyuncu ölür');
  }
}

// ---------- gerçek bölümlerde metro: uzun bölümlerde oda en alt bantta ----------
{
  let n = 0, good = 0;
  LV.forEach((L, idx) => {
    if (idx >= NL || !L.room) return;
    n++;
    const G = BA.loadStage(BA.newRun(), idx), p = G.player, mi = G.metroIn;
    p.x = mi.x + 1 - p.w / 2; p.y = mi.y + 1 - p.h; p.vy = 0; p.onGround = true; G.cam = Math.max(0, mi.x - 7);
    run(G, { down: true }, 0.05); run(G, NONE, 2);
    const inRoom = G.area === 'room' && p.onGround && !p.dead && Math.abs(G.camY - G.room.y0) < 0.01;
    const e = G.room.exit; p.x = e.x - 1.2; p.y = e.y + 1 - p.h;
    run(G, { right: true }, 1); run(G, NONE, 2.5);
    const cx = Math.floor(p.x + p.w / 2);
    const back = G.area === 'main' && !p.dead && p.onGround && G.camY >= G.camLo[cx] - 0.01 && G.camY <= G.camHi[cx] + 0.01;
    if (inRoom && back) good++;
  });
  ok(n === 11 && good === n, `bütün metro girişleri odaya iner, çıkıştan yukarı çıkılır (${good}/${n})`);
}

// ---------- bonus binişleri: duraktan araca bin, yolculuk, öbür duraktan çık ----------
{
  const enter = (idx) => {
    const G = BA.loadStage(BA.newRun(), idx), p = G.player, mi = G.metroIn;
    p.x = mi.x + 1 - p.w / 2; p.y = mi.y + 1 - p.h; p.vy = 0; p.onGround = true; G.cam = Math.max(0, mi.x - 7);
    run(G, { down: true }, 0.05); run(G, NONE, 2);
    return G;
  };
  const rides = LV.map((L, i) => [L, i]).filter(([L, i]) => i < NL && L.room);
  ok(rides.length === 11 && rides.every(([L]) => L.ride && L.ride.w && L.ride.v), `11 bonus binişinin hepsinde araç bilgisi var (${rides.length})`);
  const kinds = new Set(rides.map(([L]) => L.ride.type));
  ok(['metro', 'metrobus', 'minibus', 'tram', 'taxi'].every((k) => kinds.has(k)) && kinds.size === 5, `beş araç türü de var (${[...kinds].join(', ')})`);
  // kolay: binişlerde düşman yok
  let foes = 0;
  for (const [, i] of rides) { const G = BA.loadStage(BA.newRun(), i); foes += G.spawns.filter((s) => s.x >= G.room.x0).length; }
  ok(foes === 0, `bonus binişlerinde düşman yok (${foes})`);
  {
    // ilk biniş baştan sona: bekler, binince kalkar, giderken zıplanır, öbür durakta durur, çıkılır
    const [L, idx] = rides[0];
    const G = enter(idx), p = G.player, tr = G.plats.find((q) => q.train);
    ok(tr && tr.w === L.ride.w && tr.state === 'wait' && tr.x === tr.a, `${L.ride.type}: araç durakta bekliyor`);
    ok(tr.b - tr.a > 50, `araç yol boyunca gider (${(tr.b - tr.a).toFixed(0)} karo)`);
    run(G, NONE, 3);
    ok(tr.state === 'wait' && tr.x === tr.a, 'oyuncu binmeden araç kalkmaz');
    run(G, { right: true }, 3, (g) => g.player.plat === tr && g.player.x > tr.x + 3);
    run(G, NONE, 1);
    ok(tr.state === 'go' && tr.x > tr.a, 'binince araç kalktı');
    run(G, (g) => { g.player.inv = 9; return {}; }, 3);
    const rel0 = p.x - tr.x, v0 = tr.v;
    run(G, (g, t) => { g.player.inv = 9; return { jump: t < 0.06 }; }, 0.2);
    const air = !p.onGround;
    run(G, (g) => { g.player.inv = 9; return {}; }, 1.6, (g) => g.player.onGround);
    ok(air && p.plat === tr && Math.abs(p.x - tr.x - rel0) < 0.6 && v0 > 4, `giden araçta zıplayınca yine araca inildi (kayma ${(p.x - tr.x - rel0).toFixed(2)})`);
    let maxV = 0;
    run(G, (g) => { maxV = Math.max(maxV, tr.v); g.player.inv = 9; return {}; }, 25, () => tr.state === 'stop');
    ok(tr.state === 'stop' && tr.x === tr.b && maxV <= L.ride.v + 1e-6, 'araç öbür durağa yanaşıp durdu');
    ok(p.plat === tr && !p.dead && G.area === 'room', 'oyuncu tüm yol boyunca aracın üstünde kaldı');
    run(G, { right: true }, 4, (g) => !!g.warp);
    ok(G.warp && G.warp.kind === 'out' && !G.warp.fall, 'öbür duraktan çıkışa girildi');
    run(G, NONE, 2.5);
    ok(G.area === 'main' && !p.dead && p.onGround, 'binişten bölüme dönüldü');
  }
  {
    // bütün binişler: araca bin, varınca çık (füniküler eğik rayda yükselir)
    let good = 0;
    for (const [L, idx] of rides) {
      const G = enter(idx), p = G.player, tr = G.plats.find((q) => q.train), y0 = tr.y;
      run(G, (g) => { g.player.inv = 9; return { right: g.player.x < tr.x + tr.w / 2 }; }, 3, (g) => g.player.plat === tr && Math.abs(g.player.x - (tr.x + tr.w / 2)) < 1.2);
      run(G, (g) => { g.player.inv = 9; return {}; }, 40, () => tr.state === 'stop');
      const climbed = L.ride.type === 'funicular' ? tr.y < y0 - 3.5 : tr.y === y0;
      run(G, (g) => { g.player.inv = 9; return { right: true }; }, 5, (g) => !!g.warp);
      const exited = G.warp && G.warp.kind === 'out' && !G.warp.fall;
      run(G, NONE, 2.5);
      if (tr.state === 'stop' && climbed && exited && G.area === 'main' && !p.dead) good++;
      else console.log('  biniş sorunu', L.world + '-' + L.section, L.ride.type, tr.state, climbed, exited, G.area, p.dead);
    }
    ok(good === rides.length, `bütün binişlerde araca binilip öbür duraktan çıkıldı (${good}/${rides.length})`);
  }
  {
    // kolay biniş: giderken (hızlanırken de) uzun zıplayıp bloklara çarpsan bile araca geri inersin
    let tries = 0, back = 0;
    for (const [L, idx] of rides) {
      for (const when of [0.1, 0.8, 2, 3.5, 5, 6.5]) {
        const G = enter(idx), p = G.player, tr = G.plats.find((q) => q.train);
        run(G, (g) => { g.player.inv = 9; return { right: g.player.x < tr.x + 1.2 }; }, 3, (g) => g.player.plat === tr && g.player.x >= tr.x + 1.2);
        run(G, (g) => { g.player.inv = 9; return {}; }, 3, () => tr.state === 'go');
        run(G, (g) => { g.player.inv = 9; return {}; }, when);
        if (tr.state !== 'go') continue;
        tries++;
        run(G, (g, t) => { g.player.inv = 9; return { jump: t < 0.33 }; }, 0.4);
        run(G, (g) => { g.player.inv = 9; return {}; }, 2, (g) => g.player.onGround || g.area !== 'room');
        if (G.area === 'room' && p.plat === tr) back++;
        else console.log('  zıplayınca araçtan düştü', L.ride.type, when, G.area);
      }
    }
    ok(tries > 40 && back === tries, `giden araçtan uzun zıplayınca hep araca geri inildi (${back}/${tries})`);
    // sokak binişlerinde oyuncu durağın üstünde başlar (merdivenden inmez)
    const street = rides.find(([L]) => L.ride.type === 'minibus');
    const G = enter(street[1]), tr = G.plats.find((q) => q.train);
    ok(!G.room.under && G.player.onGround && Math.abs(G.player.y + G.player.h - tr.ya) < 0.05, 'sokak binişinde durakta başlanır');
  }
  {
    // yola/raylara düşen oyuncu ölmez, binişten çıkar
    const G = enter(rides[0][1]), p = G.player, lives = G.S.lives, tr = G.plats.find((q) => q.train);
    p.x = tr.x + tr.w + 1.5; p.y = G.room.y0 + 9.5; p.vy = 0; p.onGround = false; p.plat = null;
    run(G, NONE, 1.2, (g) => !!g.warp);
    ok(G.warp && G.warp.kind === 'out' && G.warp.fall && !p.dead, 'yola düşünce binişten çıkış başladı');
    run(G, NONE, 2.5);
    ok(G.area === 'main' && !p.dead && G.S.lives === lives && G.phase === 'play', 'yola düşen oyuncu canını yitirmeden bölüme döndü');
  }
}

// ---------- Fidye Yazılımı: zemine kurulan kilit önce uyarır, sonra yakar ----------
{
  const idx = LV.findIndex((L) => L.boss === 'fidye');
  const G = BA.loadStage(BA.newRun(), idx), p = G.player;
  run(G, NONE, 0.3);
  p.inv = 0; G.S.power = 0;
  G.bshots.push({ kind: 'lock', x: p.x - 0.5, y: p.y + p.h - 0.7, w: 1.8, h: 0.7, vx: 0, vy: 0, g: 0, t: 0, arm: 0.9, life: 2.5 });
  run(G, NONE, 0.5);
  ok(!p.dead && G.phase === 'play', 'kurulmakta olan kilit can yakmaz');
  run(G, NONE, 0.6);
  ok(p.dead || G.phase === 'dying', 'kurulan kilidin üstünde duran yanar');
}

// ---------- bitiş merdiveni ve DEPLOY anteni ----------
{
  // merdivenin tepesinden kenara gelen oyuncu verilen hızla zıplar; anten bonusunu döndürür
  const leap = (idx, vx, jump) => {
    const G = BA.loadStage(BA.newRun(), idx), g = G.goal, p = G.player;
    const top = g.y + 2 - 5; // merdivenin tepesi: DEPLOY zemininden 5 karo yukarı
    let sx = g.x - 1;
    while (sx > 0 && !BA.solid(G, sx, top)) sx--;
    p.x = sx + 1 - p.w - 0.02; p.y = top - p.h; p.vx = vx; G.cam = Math.max(0, g.x - 12); G.camY = G.camLo[g.x]; G.time = 200.5;
    run(G, (gg, t) => ({ right: true, run: vx > BA.PH.walk, jump: jump && t < 0.8 }), 3, (gg) => gg.phase === 'clear');
    return G.phase === 'clear' ? G.goalBonus : -1;
  };
  const res = [];
  for (let idx = 0; idx < NL; idx++) {
    if (LV[idx].boss || LV[idx].quiet || LV[idx].hand) continue;
    const runJ = leap(idx, BA.PH.run, true), walkJ = leap(idx, BA.PH.walk, true), off = leap(idx, BA.PH.walk, false);
    const G2 = BA.loadStage(BA.newRun(), idx), g = G2.goal;
    G2.player.x = g.x - 3; G2.player.y = g.y + 2 - G2.player.h; G2.cam = Math.max(0, g.x - 10);
    run(G2, { right: true }, 2, (gg) => gg.phase === 'clear');
    res.push([runJ, walkJ, off, G2.goalBonus]);
  }
  if (process.argv.includes('-v')) console.log('anten (koşarak, yürüyerek, zıplamadan, yerden):', JSON.stringify(res.slice(0, 4)));
  ok(res.every((r) => r[0] === 5000), 'merdivenden koşarak atlayınca anten tepesi: 5000');
  ok(res.every((r) => r[1] >= 400 && r[1] <= 2000), 'yürüyerek atlayınca orta bonus');
  ok(res.every((r) => r[2] >= 100 && r[2] <= 400), 'zıplamadan inince düşük bonus');
  ok(res.every((r) => r[3] === 100), 'yerden değince en düşük bonus: 100');
}

// ---------- gerçek bölümler yüklenir ----------
{
  for (let k = 0; k < NL; k++) {
    const S = BA.newRun();
    const G = BA.loadStage(S, k);
    run(G, NONE, 0.5);
    ok(G.phase === 'play', `${LV[k].world}-${LV[k].section} yüklendi`);
    if (LV[k].boss) ok(G.arena && G.bossSpawn && G.goal && !G.goal.active, `${LV[k].world}-${LV[k].section} patron arenası hazır`);
  }
}

// ---------- patronlar: basit bir bot her birini yenebiliyor mu ----------
// Bot dokunulmaz (vuruş almaz) ama yalnızca üstüne basarak hasar verir.
function bossBot(G) {
  const p = G.player, b = G.boss;
  if (!b || b.dead || b.state === 'intro') return { right: !b };
  const pcx = p.x + p.w / 2, bcx = b.x + b.w / 2;
  const dx = bcx - pcx;
  const inp = {};
  // patronun tepesi erişilebilir yükseklikte mi
  const reach = b.y > p.y + p.h - 5.5 && b.y + b.h > p.y - 1;
  if (p.onGround) {
    if (reach && Math.abs(dx) < 3.2 + Math.abs(b.vx || 0) * 0.25) inp.jump = true;
    else if (!reach && b.y < 7 && p.y > 9) {
      // yüksekteki patron için platforma çık
      const ax = G.arena.ax;
      const plat = Math.abs(ax + 7.5 - bcx) < Math.abs(ax + 14.5 - bcx) ? ax + 7.5 : ax + 14.5;
      const d = plat - pcx;
      if (Math.abs(d) > 0.6) { inp.right = d > 0; inp.left = d < 0; }
      if (Math.abs(d) < 2.2) inp.jump = true;
      return inp;
    }
  } else inp.jump = p.vy < 0;
  if (Math.abs(dx) > 0.3) { inp.right = dx > 0; inp.left = dx < 0; }
  inp.run = Math.abs(dx) > 4;
  return inp;
}
{
  for (let k = 2; k < NL; k += 3) {
    const L = LV[k];
    if (!L.boss) continue;
    const S = BA.newRun();
    S.power = 1;
    const G = BA.loadStage(S, k);
    // arenaya ışınla
    G.player.x = G.arena.ax - 1; G.player.y = 12 - G.player.h;
    G.cam = G.player.x - 6;
    let t = 0;
    const won = run(G, (g) => { g.player.inv = 99; t += dt; return bossBot(g); }, 180, (g) => g.boss && g.boss.dead);
    if (process.argv.includes('-v')) console.log(`  ${L.bossName}: ${won ? t.toFixed(1) + ' sn' : '-'}`);
    ok(won, `${L.world}-3 ${L.bossName} yenilebiliyor (${won ? t.toFixed(1) + ' sn' : 'yenilemedi, can ' + (G.boss && G.boss.hp.toFixed(2))})`);
    if (won) {
      const done = run(G, (g) => { g.player.inv = 99; return { right: true }; }, 12, (g) => g.result === 'clear');
      if (!done) console.log('  ', G.phase, G.goal, G.player.x.toFixed(2), G.player.y.toFixed(2), G.bossDownT.toFixed(2));
      ok(done, `${L.world}-3 patrondan sonra DEPLOY açıldı ve bölüm bitti`);
    }
  }
}

// ---------- sessiz bölüm (8-3): süre yok, düşman yok, patron yok; bankta biter ----------
{
  const qs = LV.map((L, i) => [L, i]).filter(([L, i]) => i < NL && L.quiet);
  ok(qs.length === 1 && qs[0][1] === 7 * 3 + 2, `tek sessiz bölüm 8-3 (${qs.map(([L]) => L.world + '-' + L.section).join(', ')})`);
  const bosses = new Set(LV.slice(0, NL).filter((L) => L.boss).map((L) => L.boss));
  ok(bosses.size === 11 && !bosses.has('glitch'), `11 patron, Glitch kullanılmıyor (${bosses.size})`);
  const idx = qs[0][1];
  const G = BA.loadStage(BA.newRun(), idx), p = G.player;
  ok(G.quiet && G.bench && !G.goal && !G.boss && !G.arena, 'sessiz bölümde DEPLOY ve patron yok, bank var');
  ok(G.spawns.length === 0, `sessiz bölümde düşman yok (${G.spawns.length})`);
  const t0 = G.time;
  let hopped = false;
  const done = run(G, (g) => { if (g.phase === 'clear' && !p.onGround) hopped = true; return { right: true, jump: g.phase === 'play' && Math.abs(p.vx) < 1 }; }, 60, (g) => g.result === 'clear');
  ok(done && G.time === t0, `sessiz bölüm sağa yürüyüp basamaklardan çıkınca bankta biter, süre akmaz (${G.time} / ${t0})`);
  ok(!hopped && !G.goalBonus, 'bankta zıplama ve bonus yok');
}

// hatıra parçası: her dünyanın 2. bölümünde bir tane; alınınca koşu kaydına işlenir
{
  for (let w = 0; w < NW; w++) {
    const S = BA.newRun();
    const G = BA.loadStage(S, w * 3 + 1);
    ok(G.piece && !G.piece.taken, `${w + 1}-2: hatıra parçası yüklendi`);
    const G0 = BA.loadStage(BA.newRun(), w * 3);
    ok(!G0.piece, `${w + 1}-1: hatıra parçası yok`);
    G.player.x = G.piece.x; G.player.y = G.piece.y + G.piece.h - G.player.h;
    const before = S.score;
    const got = run(G, () => ({}), 0.5, (g) => g.piece.taken);
    ok(got && S.pieces && S.pieces[w] === true && S.score >= before + 2000, `${w + 1}-2: hatıra parçası alındı ve kaydedildi`);
  }
}

// ================= v2.1 Maslak: el yapımı bölümlerin mekanikleri =================
const place = (G, x, y) => { const p = G.player; p.x = x + (1 - p.w) / 2; p.y = y - p.h; p.vx = 0; p.vy = 0; p.onGround = false; p.gFeet = y; G.cam = Math.max(0, x - 6); };
// ---------- cam silme sepeti: ':' işaretine kadar gider, uçta bekler, üstündekini taşır ----------
{
  const i = custom(['..P.....V.........', '..................', '..................', '..................', '........:.........', '###.........######', '##################'], { hand: true });
  const G = BA.loadStage(BA.newRun(), i), g = G.plats.find((q) => q.gondola);
  ok(g && g.w === 3 && g.a === g.y && g.b === g.y + 4 && g.dir === 1, `sepetin menzili ':' işaretine kadar (${g && [g.a, g.b, g.dir]})`);
  run(G, NONE, 4 / g.sp + 0.05);
  ok(Math.abs(g.y - g.b) < 0.01 && g.hold > 0, 'sepet uçta bir an bekliyor');
  place(G, 8.6, g.y); G.player.onGround = true; G.player.plat = g;
  const y0 = G.player.y;
  run(G, NONE, 1.2);
  ok(G.player.y < y0 - 1 && G.player.plat === g, `sepet üstündekini yukarı taşıdı (${y0.toFixed(1)} → ${G.player.y.toFixed(1)})`);
}
// ---------- simitçi tezgâhı: yükseğe sektirir, ilk inişte 3 simit ----------
{
  const i = custom(['..P..........', '.............', '......kk.....', '#############', '#############']);
  const S = BA.newRun(), G = BA.loadStage(S, i), p = G.player;
  place(G, 6.2, 9); p.y = 9; p.vy = 4;
  let minY = 99, bounced = false;
  run(G, NONE, 1.6, (g) => { minY = Math.min(minY, g.player.y + g.player.h); if (g.ev.some((e) => e.e === 'boing')) bounced = true; return false; });
  ok(bounced && 13 - minY > 6, `tezgâhın tentesi 6 karodan yükseğe sektirdi (${(13 - minY).toFixed(1)} karo)`);
  ok(S.simit === 3, `ilk inişte tezgâhtan 3 simit (${S.simit})`);
  run(G, NONE, 2.5);
  ok(S.simit === 3, `sonraki sekişlerde yeni simit yok (${S.simit})`);
}
// ---------- gizli basamak: alttan vurulunca simit verir, üstüne basılır ----------
{
  const i = custom(['..P..........', '.....x.......', '.............', '.............', '.............', '#############', '#############']);
  const S = BA.newRun(), G = BA.loadStage(S, i);
  place(G, 5, 12); G.player.onGround = true;
  run(G, { jump: true }, 0.5);
  ok(BA.tile(G, 5, 8) === BA.T.USED && S.simit === 1, 'gizli basamak açıldı, simit verdi');
}
// ---------- uyuyan bug: yandan değmek zarar vermez, yaklaşınca irkilir ve kaçar ----------
{
  const i = custom(['..P.........z...........', '#'.repeat(24), '#'.repeat(24)], { hand: true });
  const S = BA.newRun(), G = BA.loadStage(S, i);
  G.cam = 0; run(G, NONE, 0.05);
  const e = G.ents.find((q) => q.state === 'sleep');
  ok(!!e && G.decor[0].k === 'bank' && G.decor[0].cup, 'bankta çay bardağıyla uyuyan bug');
  run(G, { right: true }, 2, (g) => e.state !== 'sleep');
  ok(e.state === 'jolt' && !G.decor[0].cup && G.fx.some((f) => f.k === 'bardak'), 'yaklaşınca irkildi, bardak düştü');
  run(G, NONE, 0.8, () => e.state === 'flee');
  ok(e.state === 'flee' && e.vx > 4, `oyuncudan kaçıyor (vx ${e.vx.toFixed(1)})`);
  // uyurken yandan değen oyuncu yanmaz
  const G2 = BA.loadStage(BA.newRun(), i); G2.cam = 0; run(G2, NONE, 0.05);
  const e2 = G2.ents[0]; place(G2, 11.3, 12); G2.player.onGround = true; G2.player.x = e2.x - G2.player.w + 0.1;
  BA.step(G2, NONE, dt);
  ok(!G2.player.dead && G2.phase === 'play' && e2.state !== 'sleep', 'uyuyana değmek zarar vermedi, uyandırdı');
}
// ---------- simit hırsızı martı: son simiti kapar; ezilince beş simit bırakır; değmek zararsız ----------
{
  const i = custom(['..P.......q....', '...............', '...............', '...............', '...............', '......bbbbb....', '...............', '...............', '#'.repeat(15), '#'.repeat(15)]);
  const S = BA.newRun(), G = BA.loadStage(S, i);
  run(G, NONE, 0.05);
  const m = G.ents.find((q) => q.kind === 'hirsiz');
  ok(m && m.target && m.target.x === 10, 'martı altındaki simiti gözlüyor');
  place(G, 7, 13); G.player.onGround = true;
  run(G, NONE, 1.5, () => m.carry);
  ok(m.carry && !G.coins[m.target.i], 'oyuncu yaklaşınca son simiti kaptı');
  // havada üstüne basılınca
  const p = G.player; p.x = m.x; p.y = m.y + 0.1 - p.h; p.vy = 6; p.inv = 0;
  const s0 = S.simit;
  BA.step(G, NONE, dt); BA.step(G, NONE, dt);
  ok(m.state === 'bonk' && S.simit === s0 + 5 && !p.dead, `ezilen martı beş simit bıraktı (+${S.simit - s0})`);
}
// ---------- kartlı cam kapı ----------
{
  const i = custom([
    '..P.r....D.....d....',
    '#'.repeat(20), '#'.repeat(20)], { hand: true, links: [{ r: [4, 11], doors: [[9, 11], [15, 11]], dur: 3 }] });
  const S = BA.newRun(), G = BA.loadStage(S, i), T = BA.T;
  ok(G.doors.length === 2 && G.readers[0].dur === 3 && G.doors.every((d) => d.readers.length === 1), 'kapılar okuyucuya bağlandı');
  ok(BA.tile(G, 9, 11) === T.DOOR && BA.tile(G, 15, 11) === T.DOOROPEN, 'D kapalı, d açık başlar');
  run(G, { right: true }, 1, (g) => g.readers[0].t > 0);
  run(G, NONE, 0.02);
  ok(BA.tile(G, 9, 11) === T.DOOROPEN && BA.tile(G, 15, 11) === T.DOOR, 'kart okutunca D açıldı, d kapandı');
  // kapının içinde durana kapanmaz
  place(G, 9, 12); G.player.onGround = true;
  run(G, NONE, 3.5);
  ok(BA.tile(G, 9, 11) === T.DOOROPEN, 'kapı içinde duranın üstüne kapanmadı');
  place(G, 7, 12); G.player.onGround = true;
  run(G, NONE, 0.3);
  ok(BA.tile(G, 9, 11) === T.DOOR && BA.tile(G, 15, 11) === T.DOOROPEN, 'süre bitince D kapandı, d açıldı');
  // çıkış tarafı: kapının sağında durana açılır
  place(G, 10, 12); G.player.onGround = true;
  run(G, NONE, 0.05);
  ok(BA.tile(G, 9, 11) === T.DOOROPEN, 'kapının sağından (çıkış) gelen için kapı açılır');
}
// ---------- toplantı masası: kapalı kapının ardındakiler görmez; görünce hepsi aynı anda döner ve saldırır ----------
{
  const i = custom(['..P.r...D...w.u.w...', '#'.repeat(20), '#'.repeat(20)], { hand: true });
  const S = BA.newRun(), G = BA.loadStage(S, i);
  run(G, NONE, 0.05);
  const ws = G.ents.filter((e) => e.state === 'meet');
  ok(ws.length === 2 && G.decor.some((d) => d.k === 'masa'), 'masada iki bug');
  place(G, 7, 12); G.player.onGround = true; G.player.x = 7.2;
  run(G, NONE, 0.3);
  ok(ws.every((e) => e.state === 'meet'), 'kapalı cam kapının ardındakiler fark etmedi');
  G.readers[0].t = 3; run(G, NONE, 0.1);
  ok(ws.every((e) => e.state === 'look'), 'kapı açılınca hepsi aynı anda döndü');
  G.player.inv = 99; run(G, NONE, 1);
  ok(ws.every((e) => !e.state && e.vx < -2.5), 'sonra oyuncunun üstüne koştular');
}
// ---------- turnike: küçükken kolun altından geçilir, büyükken geçilmez ----------
{
  const i = custom(['.....I......', '.....I......', '.....t......', '..P.........', '#'.repeat(12), '#'.repeat(12)]);
  const S = BA.newRun(); let G = BA.loadStage(S, i);
  run(G, { right: true }, 1.5);
  ok(G.player.x > 7, `küçük oyuncu turnikenin altından geçti (x ${G.player.x.toFixed(1)})`);
  S.power = 1; G = BA.loadStage(S, i);
  run(G, { right: true }, 1.5);
  ok(G.player.x < 5, `büyük oyuncu turnikede kaldı (x ${G.player.x.toFixed(1)})`);
}
// ---------- kapaklar: asma tavana alttan vurulunca, taban kapağında aşağı basınca bitişikleriyle açılır ----------
{
  const i = custom(['====pp====', '..........', '..........', '..P.......', '###pp#####', '###..#####', '..........', '##########']);
  const S = BA.newRun(), G = BA.loadStage(S, i), T = BA.T;
  place(G, 4, 10); G.player.onGround = true; G.player.x = 4.1;
  run(G, { jump: true }, 0.35);
  ok(BA.tile(G, 4, 6) === T.EMPTY && BA.tile(G, 5, 6) === T.EMPTY && BA.tile(G, 3, 6) === T.SOLID, 'tavan kapağı alttan vurulunca açıldı (iki karo)');
  run(G, NONE, 1);
  place(G, 3.4, 10); G.player.onGround = true; G.player.x = 3.2;
  run(G, { down: true }, 0.05);
  ok(BA.tile(G, 3, 10) === T.EMPTY && BA.tile(G, 4, 10) === T.EMPTY, 'taban kapağında aşağı basınca açıldı');
  run(G, NONE, 0.6);
  ok(G.player.y + G.player.h > 12.9, `kapaktan aşağı düştü (${(G.player.y + G.player.h).toFixed(1)})`);
}
// ---------- fanlar: süzdürür ama tavana sürtmez; aralıklı fan durunca düşülür ----------
{
  const i = custom(['==========', '..........', '..........', '..........', '..........', '..........', '..........', '..........', '..........', '..........', '..P.......', '###FF##f##', '##########'], { hand: true });
  const S = BA.newRun(), G = BA.loadStage(S, i);
  place(G, 3.5, 11); G.player.onGround = true;
  let minY = 99, thunk = false;
  run(G, NONE, 3, (g) => { minY = Math.min(minY, g.player.y); if (g.ev.some((e) => e.e === 'thunk')) thunk = true; return false; });
  const feet = G.player.y + G.player.h;
  ok(feet < 6.5 && feet > 2.5 && !thunk && minY > 1, `fan oyuncuyu tavana değdirmeden süzdürüyor (ayak ${feet.toFixed(1)})`);
  // aralıklı fan: 4 sn'de 2,4 sn çalışır
  const G2 = BA.loadStage(BA.newRun(), i), f = G2.fans.find((q) => q.cyc);
  run(G2, NONE, 1); const on1 = f.on; run(G2, NONE, 2); const on2 = f.on; run(G2, NONE, 1.5);
  ok(on1 && !on2 && f.on, 'aralıklı fan çalışıp duruyor');
  place(G2, 7.5, 11); G2.player.onGround = true; G2.fanT = 0;
  run(G2, NONE, 2.3);
  const hi = G2.player.y;
  run(G2, NONE, 1);
  ok(G2.player.onGround && G2.player.y > hi + 3, 'fan durunca oyuncu yere indi');
}
// ---------- sıcak kabin yakar; yanında ezilen bug onu soğutur ----------
{
  const i = custom(['..P..........', '.......e.....', '.....HH......', '.....HH......', '#############', '#############'], { hand: true });
  const S = BA.newRun(); S.power = 1;
  const G = BA.loadStage(S, i), T = BA.T;
  place(G, 4, 12); G.player.onGround = true;
  run(G, { right: true }, 0.6, (g) => g.S.power === 0);
  ok(S.power === 0 && !G.player.dead, 'sıcak kabine değen büyük oyuncu küçüldü');
  const G2 = BA.loadStage(BA.newRun(), i); G2.cam = 0; run(G2, NONE, 0.02);
  const e = G2.ents[0]; G2.player.x = e.x; G2.player.y = e.y - G2.player.h - 0.3; G2.player.vy = 5; G2.player.inv = 0;
  run(G2, NONE, 0.1);
  ok(e.dead && BA.tile(G2, 5, 10) === T.COOL && BA.tile(G2, 6, 11) === T.COOL, 'bug ezilince yanındaki kabin soğudu');
}
// ---------- birden çok kayıt noktası ve altın simit ----------
{
  const i = custom(['..P....Q.....g...Q......G...=', '#'.repeat(29), '#'.repeat(29)], { hand: true });
  const S = BA.newRun();
  let G = BA.loadStage(S, i);
  ok(G.checkpoints.length === 2 && G.golds.length === 1 && G.golds[0].k === 0, 'iki kayıt noktası, bir altın simit');
  run(G, { right: true }, 3, (g) => g.checkpoints[1].on);
  ok(S.checkpoint && S.checkpoint.k === 1 && G.checkpoints[0].on, `ikinci kayıt noktası yazıldı (${JSON.stringify(S.checkpoint)})`);
  ok(S.golds && S.golds[i] === 1, 'altın simit koşuya işlendi');
  G = BA.loadStage(S, i);
  ok(Math.abs(G.player.x - 17.125) < 0.01 && G.golds[0].taken, 'ikinci kayıt noktasından başladı, alınan altın yok');
}
// ---------- Kral Bug: canı yarıya inince tacından bug'lar, fanlar kesik kesik; prens kral düşünce kaçar ----------
{
  const k = LV.findIndex((L) => L.boss === 'kralbug');
  const S = BA.newRun(); S.power = 1;
  const G = BA.loadStage(S, k);
  G.player.x = G.arena.ax + 4; G.player.y = 12 - G.player.h; G.cam = G.arena.ax;
  run(G, (g) => { g.player.inv = 99; return {}; }, 2);
  const b = G.boss;
  ok(b && b.prince && b.maxHp === 4, 'Kral Bug ve prensi arenada');
  b.hp = 2.5; b.hurtT = 0;
  const n0 = G.ents.length;
  b.hp = 2; run(G, (g) => { g.player.inv = 99; return {}; }, 1.5);
  ok(b.p2 && G.fanPulse && G.ents.filter((e) => e.minion).length >= 2 && G.ents.length > n0, 'ikinci evre: tacından iki bug, fanlar kesik kesik');
  b.hp = 0.0001; G.boss.hp = 0.0001;
  run(G, (g) => { g.player.inv = 99; return {}; }, 0.01);
  b.hp = 0; b.dead = true; b.state = 'dead';
  run(G, (g) => { g.player.inv = 99; return {}; }, 1);
  ok(b.prince.flee, 'kral düşünce prens kaçtı');
}
// ================= Kapalıçarşı: terazi, çürük tahta, çaycı, kepenk =================
// ---------- terazi: basılan kefe iner, öbürü kalkar; boşken dengeye döner; ters makara tersine ----------
{
  const i = custom(['..P.................', '#'.repeat(20), '#'.repeat(20)], { hand: true, objs: [{ k: 'terazi', xa: 4, xb: 10, y: 9, r: 2 }, { k: 'terazi', xa: 14, xb: 17, y: 9, r: 2, inv: true }] });
  const G = BA.loadStage(BA.newRun(), i), [sc, inv] = G.scales;
  ok(sc && sc.A.y === 9 && sc.B.y === 9, 'terazi dengede başlar');
  place(G, 4.6, 9); G.player.onGround = true; G.player.plat = sc.A;
  run(G, NONE, 1.2);
  ok(Math.abs(sc.A.y - 11) < 0.05 && Math.abs(sc.B.y - 7) < 0.05 && G.player.plat === sc.A, `basılan kefe indi, öbürü kalktı (${sc.A.y.toFixed(2)} / ${sc.B.y.toFixed(2)})`);
  place(G, 1, 12); G.player.onGround = true; run(G, NONE, 1.5);
  ok(Math.abs(sc.A.y - 9) < 0.05, 'boşken dengeye döndü');
  place(G, 14.6, 9); G.player.onGround = true; G.player.plat = inv.A;
  run(G, NONE, 1.2);
  ok(inv.A.y < 7.1 && inv.B.y > 10.9, `ters makarada basılan kefe kalktı (${inv.A.y.toFixed(2)})`);
  // sapan: yüksekten düşülünce öbür kefedeki bug fırlar
  const j = custom(['..P.........', '............', '............', '............', '............', '#'.repeat(12), '#'.repeat(12)], { hand: true, objs: [{ k: 'terazi', xa: 2, xb: 7, y: 10, r: 2 }] });
  const G2 = BA.loadStage(BA.newRun(), j), s2 = G2.scales[0];
  G2.ents.push(Object.assign({ kind: 'bug', x: 7.6, y: 10 - 0.875, w: 0.875, h: 0.875, vx: 0, vy: 0, t: 0, dead: false, deadT: 0, flip: false, onGround: true, minion: false, st: 0, plat: s2.B }));
  run(G2, NONE, 0.3);
  place(G2, 2.6, 4); G2.player.vy = 0;
  run(G2, NONE, 1, (g) => g.ents[0].dead);
  ok(G2.ents[0].dead && G2.ents[0].vy < -5, 'yüksekten kefeye düşen, öbür kefedeki bug\'ı fırlattı');
}
// ---------- çürük tahta: basınca çöker, sonra yerine gelir ----------
{
  const i = custom(['..P.......', '..........', '###~~#####', '...##.....', '##########']);
  const G = BA.loadStage(BA.newRun(), i), T = BA.T;
  place(G, 3.5, 11); G.player.onGround = true;
  run(G, NONE, 0.3);
  ok(BA.tile(G, 3, 11) === T.CRUMBLE && G.crumb.size > 0, 'basılan tahta gıcırdıyor');
  run(G, NONE, 0.5);
  ok(BA.tile(G, 3, 11) === T.EMPTY && G.player.y + G.player.h > 11.9, 'tahta çöktü, oyuncu düştü');
  place(G, 7, 13); G.player.onGround = true;
  run(G, NONE, 5.5);
  ok(BA.tile(G, 3, 11) === T.CRUMBLE, 'beş saniye sonra yerine geldi');
}
// ---------- çaycı: tepsisine binilir, ilk binene çay ikram eder ----------
{
  const i = custom(['..P.........', '#'.repeat(12), '#'.repeat(12)], { hand: true, objs: [{ k: 'cayci', x0: 3, x1: 9, y: 12 }] });
  const S = BA.newRun(), G = BA.loadStage(S, i), n = G.npcs[0], tr = n.tray;
  run(G, NONE, 0.7);
  place(G, tr.x + 0.6, tr.y); G.player.y = tr.y - G.player.h - 0.3; G.player.vy = 1;
  run(G, NONE, 0.2);
  ok(G.player.plat === tr && S.power === 1, 'tepsiye binen oyuncuya çay ikram edildi (güç)');
  const x0 = G.player.x;
  run(G, NONE, 1);
  ok(G.player.x > x0 + 1 && G.player.plat === tr, 'çaycı yürüdükçe tepsi taşıdı');
}
// ---------- kepenk: belli aralıkla iner; altındaki bug ezilir, oyuncu yana itilir ----------
{
  const i = custom(['..P.......', '#'.repeat(10), '#'.repeat(10)], { hand: true, objs: [{ k: 'kepenk', x: 5, y0: 9, y1: 11, per: 4, open: 2 }] });
  const G = BA.loadStage(BA.newRun(), i), T = BA.T, s = G.shutters[0];
  run(G, NONE, 1);
  ok(BA.tile(G, 5, 11) === T.EMPTY, 'kepenk açık');
  place(G, 5, 12); G.player.onGround = true; G.player.inv = 99;
  G.ents.push({ kind: 'bug', x: 5.06, y: 11.125, w: 0.875, h: 0.875, vx: 0, vy: 0, t: 0, dead: false, deadT: 0, flip: false, onGround: true, minion: false, st: 0 });
  run(G, NONE, 1.3);
  ok(BA.tile(G, 5, 11) === T.SHUTTER && s.solid, 'kepenk indi');
  ok(G.ents[0].dead && !G.player.dead && (G.player.x + G.player.w <= 5.01 || G.player.x >= 5.99), 'altındaki bug ezildi, oyuncu yana itildi');
  run(G, NONE, 2);
  ok(BA.tile(G, 5, 11) === T.EMPTY, 'kepenk yeniden kalktı');
}

// ================= Şişli: trafik, asansör, döner kapı, sensörlü lamba =================
// ---------- trafik: yaya ışığı yeşilken araçlar çizgide durur; hızlı araç çarpar; tavanına basılır ----------
{
  const lane = { x0: 4, x1: 40, y: 12, dir: -1, every: 1.2, v: 5, kinds: ['taksi'], light: { x: 10, w: 2, per: 12, green: 9 } };
  const i = custom(['..P.....................................', '#'.repeat(40), '#'.repeat(40)], { hand: true, objs: [Object.assign({ k: 'yol' }, lane)] });
  const G = BA.loadStage(BA.newRun(), i);
  G.player.x = 1; run(G, () => { G.player.x = 1; return {}; }, 8.5);
  const front = Math.min(...G.cars.map((c) => c.x));
  ok(G.cars.filter((c) => c.v < 0.2).length >= 3 && front >= 12.2 && G.cars.find((c) => c.x === front).v < 0.2, `ışıkta araçlar durdu, sıkıştı (${G.cars.length} araç, öndeki x=${front.toFixed(1)})`);
  run(G, () => { G.player.x = 1; return {}; }, 2);
  ok(G.cars.some((c) => c.x < 11 || c.v > 3), 'ışık dönünce trafik aktı');
  // tavanına basılan araç oyuncuyu taşır
  const G2 = BA.loadStage(BA.newRun(), i);
  run(G2, () => { G2.player.x = 1; return {}; }, 1.3);
  const c = G2.cars[0], p = G2.player;
  p.x = c.x + 1; p.y = c.plat.y - p.h; p.vy = 0; p.onGround = true; p.plat = c.plat; p.inv = 0;
  const x0 = p.x;
  run(G2, NONE, 0.4);
  ok(p.plat === c.plat && p.x < x0 - 0.5 && !p.dead, 'araç tavanındaki oyuncuyu taşıdı');
  // hızla gelen araç çarpar
  const G3 = BA.loadStage(BA.newRun(), i), p3 = G3.player;
  G3.S.power = 1; p3.h = BA.BIG_H; p3.x = 30; p3.y = 12 - p3.h;
  run(G3, NONE, 3, () => G3.S.power === 0);
  ok(G3.S.power === 0, 'yolda duran oyuncuya araç çarptı');
}
// ---------- asansör: binen yarım saniye durunca sonraki kata gider; düğme kabini çağırır ----------
{
  const i = custom(['..P.........', '#####...####', '############'], { hand: true, objs: [{ k: 'asansor', x: 5, floors: [6, 9, 12] }] });
  const G = BA.loadStage(BA.newRun(), i), L = G.lifts[0], p = G.player;
  ok(L.car.y === 12 && L.cur === 2, 'kabin en alt katta başlar');
  place(G, 5.6, 12); p.onGround = true; p.plat = L.car;
  run(G, NONE, 2.2);
  ok(L.cur === 1 && Math.abs(p.y + p.h - 9) < 0.05, `binen bir üst kata çıktı (kat ${L.cur})`);
  run(G, NONE, 3);
  ok(L.cur === 0, 'binmeye devam eden en üst kata vardı');
  place(G, 3.5, 12); p.onGround = true; p.x = 3.9;
  run(G, NONE, 3.5);
  ok(L.cur === 2 && L.car.y === 12, 'boşluğun önünde bekleyen kabini çağırdı');
}
// ---------- döner kapı: giren döndürülüp öbür yandan çıkarılır ----------
{
  const i = custom(['..P.........', '#'.repeat(12), '#'.repeat(12)], { hand: true, objs: [{ k: 'doner', x: 5, y: 12, w: 2 }] });
  const G = BA.loadStage(BA.newRun(), i), p = G.player;
  let spun = false;
  run(G, { right: true }, 2, () => { if (p.spin) spun = true; return p.x > 7.2 && !p.spin; });
  ok(spun && p.x > 7, 'döner kapıdan dönerek geçti');
}
// ---------- sensörlü lamba: yanına gelince yanar, uzaklaşınca bir süre sonra söner; fotokopi çakar ----------
{
  const i = custom(['..P....................', '#'.repeat(23), '#'.repeat(23)], { hand: true, dim: true, objs: [{ k: 'lamba', x: 6, y: 2 }, { k: 'lamba', x: 18, y: 2 }, { k: 'fotokopi', x: 12, y: 12, per: 2.4 }] });
  const G = BA.loadStage(BA.newRun(), i), [a, b, f] = G.lamps;
  run(G, NONE, 0.1);
  ok(a.t > 0 && b.t === 0, 'yakındaki lamba yandı, uzaktaki sönük');
  place(G, 21, 12); G.player.onGround = true;
  run(G, NONE, 3.5);
  ok(a.t === 0 && b.t > 0, 'uzaklaşınca söndü, yeni yerde yandı');
  let flashes = 0, prev = 0;
  run(G, NONE, 5, () => { if (f.t > 0 && !prev) flashes++; prev = f.t; return false; });
  ok(flashes === 2, `fotokopi 5 sn'de iki kez çaktı (${flashes})`);
}

// ================= Üsküdar: vapur, kayık, martılar, tente, karpuz, dalga, sal =================
// ---------- vapur iskelede bekler, karşıya geçer, üstündekini taşır; kayık yalnız binilince gider ----------
{
  const map = ['..P.......................', '#####..............#######', '#####..............#######'];
  const i = custom(map, { hand: true, objs: [{ k: 'vapur', x0: 5, x1: 9, y: 12, w: 10, wait: 1, v: 3 }] });
  const ik = custom(map, { hand: true, objs: [{ k: 'vapur', x0: 5, x1: 15, y: 12, w: 4, kayik: true, v: 3 }] });
  const G = BA.loadStage(BA.newRun(), i), f = G.boats[0], k = BA.loadStage(BA.newRun(), ik).boats[0], p = G.player;
  ok(f.deck && f.roof && !k.roof, 'vapurun alt ve üst güvertesi, kayığın tek güvertesi var');
  place(G, 6, 12); p.onGround = true; p.plat = f.deck; p.inv = 99;
  run(G, NONE, 3.5);
  ok(f.x === 9 && p.plat === f.deck && p.x > 9, `vapur karşı iskeleye taşıdı (${f.x.toFixed(1)})`);
  const G2 = BA.loadStage(BA.newRun(), ik), k2 = G2.boats[0];
  run(G2, NONE, 2);
  ok(k2.x === 5, 'boş kayık iskelede bekliyor');
  place(G2, 5.6, 12); G2.player.onGround = true; G2.player.plat = k2.deck; G2.player.inv = 99;
  run(G2, NONE, 5);
  ok(k2.x === 15, `binilince karşıya gitti (${k2.x.toFixed(1)})`);
  place(G2, 21, 12); G2.player.onGround = true;
  run(G2, NONE, 9);
  ok(k2.x === 5, 'boş kalınca kendi iskelesine döndü');
}
// ---------- vapur martısı dalınca simit kapar; kaçarken ezilince geri verir ----------
{
  const i = custom(['..P.................', '#'.repeat(20), '#'.repeat(20)], { hand: true, objs: [{ k: 'martilar', x0: 4, x1: 18, n: 1, y: 5 }] });
  const S = BA.newRun(); S.simit = 20;
  const G = BA.loadStage(S, i), p = G.player;
  run(G, NONE, 0.1);
  const m = G.ents.find((e) => e.kind === 'hirsiz');
  ok(m && m.chase, 'martı oyuncunun peşinde');
  run(G, () => ({}), 5, () => m.state === 'flee');
  ok(m.state === 'flee' && m.carry === 5 && S.simit === 15, `dalıp beş simit kaptı (${S.simit})`);
  p.x = m.x; p.y = m.y + 0.1 - p.h; p.vy = 6;
  run(G, NONE, 0.05);
  ok(m.state === 'bonk' && S.simit >= 21, `ezilen martı simitleri geri verdi (${S.simit})`);
}
// ---------- tente sektirir ama simit vermez; karpuz yuvarlanır, duvarda patlar, önündeki bug'ı devirir ----------
{
  const i = custom(['..P.........', '............', '............', '......kkk...', '############', '############'], { hand: true, tente: true });
  const S = BA.newRun(), G = BA.loadStage(S, i), p = G.player;
  place(G, 6.6, 6); p.y = 6; p.vy = 4;
  let minY = 99;
  run(G, NONE, 1.2, (g) => { minY = Math.min(minY, g.player.y); return false; });
  ok(minY < 5 && S.simit === 0, `tente sektirdi, simit yok (${minY.toFixed(1)})`);
  const j = custom(['..P..................=', '#'.repeat(22), '#'.repeat(22)], { hand: true, objs: [{ k: 'kasa', x: 17, y: 11, every: 0.5, dir: 1 }] });
  const G2 = BA.loadStage(BA.newRun(), j);
  run(G2, () => { G2.player.x = 1; return {}; }, 0.6);
  const kp = G2.ents.find((e) => e.kind === 'karpuz');
  ok(kp && kp.vx > 0, 'kasadan karpuz yuvarlandı');
  run(G2, () => { G2.player.x = 1; return {}; }, 1.5, () => kp.dead);
  ok(kp.dead && G2.fx.some((f) => f.k === 'splat'), 'karpuz duvara çarpıp patladı');
  const G3 = BA.loadStage(BA.newRun(), custom(['..P.................', '#'.repeat(20), '#'.repeat(20)], { hand: true, objs: [{ k: 'kasa', x: 4, y: 11, every: 0.3, dir: 1 }] }));
  G3.ents.push({ kind: 'bug', x: 9, y: 11.125, w: 0.875, h: 0.875, vx: -2, vy: 0, t: 0, dead: false, deadT: 0, flip: false, onGround: true, minion: false, st: 0 });
  run(G3, () => { G3.player.x = 1; G3.player.inv = 99; return {}; }, 2, () => G3.ents[0].dead);
  ok(G3.ents[0].dead, 'karpuz önündeki bug\'ı devirdi');
}
// ---------- dalga: su yükselince kumsaldakini yakar ve fırlatır; sal suyla kalkar ----------
{
  const i = custom(['..P.................', '#'.repeat(20), '#'.repeat(20)], { hand: true, objs: [{ k: 'dalga', x0: 6, x1: 16, lo: 12.8, hi: 9.5, per: 6, high: 2 }, { k: 'sal', x: 12, y: 12.6, w: 3 }] });
  const S = BA.newRun(); S.power = 1;
  const G = BA.loadStage(S, i), p = G.player, sal = G.plats.find((q) => q.kind === 'float');
  p.h = BA.BIG_H; place(G, 8, 12); p.onGround = true; p.h = BA.BIG_H; p.y = 12 - p.h;
  run(G, NONE, 1);
  ok(S.power === 1 && Math.abs(sal.y - 12.6) < 0.01, 'alçak suda kumsal güvenli, sal yerde');
  run(G, NONE, 3.5);
  ok(S.power === 0 && Math.abs(sal.y - 9.3) < 0.05, `yükselen su yaktı, sal kalktı (${sal.y.toFixed(2)})`);
}

// ================= Ataşehir: borsa panosu, grafik, lazer alarmı, alarm kapısı, şalter, ızgara, raylı platform =================
// ---------- pano yanıkken basılır, sönünce düşülür; içindeyken yanmaz ----------
{
  const i = custom(['..P..................', '#####.........#######', '#####.........#######'], { hand: true, objs: [{ k: 'pano', x0: 6, x1: 9, y: 12, per: 3, on: 1.5 }] });
  const G = BA.loadStage(BA.newRun(), i), b = G.boards[0];
  ok(b.lit && BA.tile(G, 7, 12) === BA.T.PANO, 'pano başta yanık, katı');
  place(G, 7, 12); G.player.onGround = true;
  run(G, NONE, 0.9);
  ok(b.warn && G.player.onGround, 'sönmeden önce uyarıyor, üstünde durulur');
  run(G, NONE, 0.6, () => !b.lit);
  run(G, NONE, 0.5);
  ok(!b.lit && G.player.y > 11.5, 'sönünce oyuncu düştü');
  const G2 = BA.loadStage(BA.newRun(), i), b2 = G2.boards[0];
  run(G2, NONE, 1.6);
  G2.player.x = 7; G2.player.y = 11.6; G2.player.vy = 0; G2.player.inv = 99;
  run(G2, () => { G2.player.y = 11.6; G2.player.vy = 0; return {}; }, 1.6);
  ok(!b2.lit, 'içinde oyuncu varken pano yanmadı');
}
// ---------- grafik çubukları dalga gibi inip kalkar; üstündekini taşır ----------
{
  const i = custom(['..P..................', '###.............#####', '###.............#####'], { hand: true, objs: [{ k: 'grafik', x: 4, y: 11, amp: 5, n: 4, per: 4, lag: 0.1 }] });
  const G = BA.loadStage(BA.newRun(), i), bars = G.plats.filter((q) => q.kind === 'chart');
  ok(bars.length === 4 && Math.abs(bars[0].y - 11) < 0.01, 'dört çubuk, ilki dipte');
  place(G, 4.2, 11); G.player.onGround = true; G.player.plat = bars[0];
  let top = 99;
  run(G, NONE, 2, () => { top = Math.min(top, G.player.y + G.player.h); return false; });
  ok(top < 6.2 && G.player.plat === bars[0], `çubuk oyuncuyu tepeye taşıdı (${top.toFixed(2)})`);
  ok(bars[1].y > bars[0].y + 0.01 || bars[1].y < bars[0].y - 0.01, 'komşu çubuk ötekinden geride (dalga)');
}
// ---------- lazer alarmı: değince kapı iner, menfezden bug düşer; alarm susunca kapı kalkar ----------
{
  const i = custom(['..P..................', '#'.repeat(21), '#'.repeat(21)], { hand: true, objs: [{ k: 'lazer', x: 6, y0: 8, y1: 11 }, { k: 'alarmkapi', x: 14, y0: 8, y1: 11 }, { k: 'menfez', x: 10, y: 5 }] });
  const G = BA.loadStage(BA.newRun(), i), p = G.player;
  ok(G.alarm === 0 && BA.tile(G, 14, 10) === BA.T.EMPTY, 'başta alarm yok, kapı açık');
  run(G, { right: true }, 1.5, () => G.alarm > 0);
  ok(G.alarm > 0 && BA.tile(G, 14, 10) === BA.T.GATE, 'lazere değince alarm çaldı, kapı indi');
  ok(G.ents.some((e) => e.kind === 'bug'), 'menfezden bug düştü');
  run(G, () => { p.inv = 99; return {}; }, 5);
  ok(G.alarm === 0 && BA.tile(G, 14, 10) === BA.T.EMPTY, 'alarm sustu, kapı kalktı');
}
// ---------- yanıp sönen lazer: sönükken geçilir ----------
{
  const i = custom(['..P..................', '#'.repeat(21), '#'.repeat(21)], { hand: true, objs: [{ k: 'lazer', x: 6, y0: 8, y1: 11, per: 3, on: 1 }] });
  const G = BA.loadStage(BA.newRun(), i);
  run(G, NONE, 1.2);
  run(G, { right: true, run: true }, 1.2);
  ok(G.alarm === 0 && G.player.x > 8, 'sönük lazerin içinden alarmsız geçildi');
}
// ---------- inen alarm kapısı altındaki bug'ı ezer; yerdeki lazere takılan bug kendi alarmını çaldırır ----------
{
  const i = custom(['..P..................', '#'.repeat(21), '#'.repeat(21)], { hand: true, objs: [{ k: 'lazer', x0: 10, x1: 10, y: 11 }, { k: 'alarmkapi', x: 10, y0: 6, y1: 11 }] });
  const G = BA.loadStage(BA.newRun(), i);
  G.ents.push({ kind: 'bug', x: 13, y: 11.125, w: 0.875, h: 0.875, vx: -2, vy: 0, t: 0, dead: false, deadT: 0, flip: false, onGround: true, minion: false, st: 0 });
  run(G, NONE, 2.5, () => G.ents[0].dead);
  ok(G.alarm > 0 && G.ents[0].dead, 'bug lazere takıldı, inen kapı onu ezdi');
}
// ---------- yangın kapağı: yalnız alarmda kapanır (köprü olur); alarm biterken üstündeki düşer ----------
{
  const i = custom(['..P..................', '#######......########', '#######......########'], { hand: true, objs: [{ k: 'lazer', x: 5, y0: 9, y1: 11 }, { k: 'alarmkapi', x0: 7, x1: 12, y0: 12, y1: 12 }] });
  const G = BA.loadStage(BA.newRun(), i), p = G.player;
  ok(BA.tile(G, 9, 12) === BA.T.EMPTY, 'kapak açık: kuyu boş');
  run(G, { right: true }, 3, () => p.x > 14);
  ok(p.x > 14 && !p.dead, 'lazere değince kapak kapandı, kuyunun üstünden geçildi');
}
// ---------- şalter: üstüne basınca elektrik kesilir; ızgara elektrikliyken çarpar, bug'ları da ----------
{
  const i = custom(['..P..................', '#'.repeat(21), '#'.repeat(21)], { hand: true, objs: [{ k: 'salter', x: 5, y: 11, grp: 'a', on: true }, { k: 'izgara', x0: 8, x1: 14, y: 12, grp: 'a' }] });
  const S = BA.newRun(); S.power = 1;
  let G = BA.loadStage(S, i);
  ok(G.power.a === true && BA.tile(G, 5, 11) === BA.T.LEVER, 'şalter yerinde, elektrik var');
  G.ents.push({ kind: 'bug', x: 12, y: 11.125, w: 0.875, h: 0.875, vx: -2, vy: 0, t: 0, dead: false, deadT: 0, flip: false, onGround: true, minion: false, st: 0 });
  run(G, NONE, 0.3);
  ok(G.ents[0].dead, 'elektrikli ızgaradaki bug çarpıldı');
  place(G, 9, 12); G.player.onGround = true;
  run(G, NONE, 0.2);
  ok(S.power === 0, 'ızgaraya basan oyuncu çarpıldı (küçüldü)');
  S.power = 1; G = BA.loadStage(S, i);
  place(G, 5, 9); G.player.onGround = false;
  run(G, NONE, 0.6);
  ok(G.power.a === false, 'şaltere inince elektrik kesildi');
  run(G, { right: true }, 2);
  ok(S.power === 1 && G.player.x > 12, 'elektriksiz ızgarada yüründü');
}
// ---------- yaylı şalter: bir süre sonra kendiliğinden geri döner ----------
{
  const i = custom(['..P..................', '#'.repeat(21), '#'.repeat(21)], { hand: true, objs: [{ k: 'salter', x: 5, y: 11, grp: 'c', on: false, pulse: 1.5 }, { k: 'izgara', x0: 8, x1: 14, y: 12, grp: 'c' }] });
  const G = BA.loadStage(BA.newRun(), i);
  place(G, 5, 9); G.player.onGround = false;
  run(G, NONE, 0.6);
  ok(G.power.c === true, 'yaylı şaltere basınca elektrik geldi');
  run(G, NONE, 1.2);
  ok(G.power.c === false, 'yaylı şalter kendiliğinden geri döndü');
}
// ---------- raylı platform yalnız elektrik varken gider; şalter alttan vurulunca da döner ----------
{
  const i = custom(['.....=...............', '.....................', '..P..................', '#'.repeat(21), '#'.repeat(21)], { hand: true, objs: [{ k: 'salter', x: 5, y: 9, grp: 'b', on: false }, { k: 'ray', x0: 10, x1: 16, y: 10, w: 3, grp: 'b' }] });
  const G = BA.loadStage(BA.newRun(), i), rail = G.plats.find((q) => q.rail);
  run(G, NONE, 1);
  ok(rail.x === 10, 'elektriksiz raylı platform durdu');
  place(G, 5, 12); G.player.onGround = true;
  run(G, { jump: true }, 0.4);
  ok(G.power.b === true, 'şaltere alttan vurunca elektrik geldi');
  run(G, NONE, 1);
  ok(rail.x > 10.5, 'elektrikle platform yürüdü');
}

// ================= Yerebatan: sandal, akıntı, Medusa, taş bug, yuva, taşkın, pompa =================
const mkBug = (x, y, vx) => ({ kind: 'bug', x, y: y + 0.125, w: 0.875, h: 0.875, vx, vy: 0, t: 0, dead: false, deadT: 0, flip: false, onGround: true, minion: false, st: 0 });
// ---------- sandal: içine zıplayıp inince baktığın yana gider, su yavaşlatır; sütun dibinde durur ----------
{
  const i = custom(['..P..............=..........', '####.............=.....#####', '####.............=.....#####'], { hand: true, objs: [{ k: 'sandal', x: 4, y: 12, x0: 4, x1: 20 }] });
  const G = BA.loadStage(BA.newRun(), i), b = G.sandals[0], p = G.player;
  run(G, NONE, 0.5);
  ok(b.x === 4 && b.vx === 0, 'boş sandal kıpırdamıyor');
  place(G, 5, 10); p.face = 1;
  run(G, NONE, 0.5);
  ok(b.vx > 1 && p.plat === b.deck, `inince sağa itildi (${b.vx.toFixed(2)})`);
  run(G, NONE, 4);
  ok(b.x > 6 && Math.abs(b.vx) < 0.2, `su yavaşlattı (${b.x.toFixed(2)})`);
  place(G, 25, 12); G.player.onGround = true;
  b.x = 12; b.vx = 4.5;
  let mx = 0;
  run(G, NONE, 2, () => { mx = Math.max(mx, b.x); return false; });
  ok(Math.abs(mx + b.w - 17) < 0.01 && b.x < mx && Math.abs(b.vx) < 0.5, `sütun dibine çarpıp sekti (${mx.toFixed(2)})`);
  const G2 = BA.loadStage(BA.newRun(), i), b2 = G2.sandals[0];
  place(G2, 5, 10); G2.player.face = -1; b2.x = 10; G2.player.x = 11;
  run(G2, NONE, 0.5);
  ok(b2.vx < -1, 'sola bakıp inince sola gitti');
}
// ---------- akıntı sandalı sürükler; çağlayana varan sandal batar ve baştan çıkar ----------
{
  const i = custom(['..P.........................', '####...................#####', '####...................#####'], { hand: true, objs: [{ k: 'sandal', x: 4, y: 12, x0: 4, x1: 18, sink: true }, { k: 'akinti', x0: 4, x1: 23, v: 3 }] });
  const G = BA.loadStage(BA.newRun(), i), b = G.sandals[0];
  run(G, NONE, 2);
  ok(b.x > 6, `akıntı sürükledi (${b.x.toFixed(2)})`);
  run(G, NONE, 5, () => b.sinkT > 0);
  ok(b.sinkT > 0, 'çağlayanda battı');
  run(G, NONE, 2.6);
  ok(b.sinkT === 0 && b.x < 7, 'baştan yeniden çıktı');
}
// ---------- Medusa: bakışa giren bug taşa döner (katı blok), taş bakışı keser; oyuncu bir an taş kesilir ----------
{
  const i = custom(['....................=', '..P.................=', '#'.repeat(21), '#'.repeat(21)], { hand: true, objs: [{ k: 'medusa', x: 19, y: 10, dir: 'l', len: 6, w: 2, per: 10, open: 9 }] });
  const G = BA.loadStage(BA.newRun(), i), m = G.medusas[0];
  const bug = mkBug(10, 11, 2); G.ents.push(bug);
  run(G, NONE, 0.2);
  ok(m.on && BA.gazeBox(G, m).w === 6, 'gözler açık, bakış 6 karo');
  run(G, NONE, 2, () => bug.dead);
  run(G, NONE, 1);
  ok(BA.tile(G, 13, 11) === BA.T.STONE || BA.tile(G, 12, 11) === BA.T.STONE, 'bug taşa döndü, karoya oturdu');
  G.grid[11 * G.W + 15] = BA.T.STONE;
  ok(BA.gazeBox(G, m).w === 3, 'bakışın yolundaki taş bakışı kesti');
  const G2 = BA.loadStage(BA.newRun(), i), p = G2.player;
  run(G2, { right: true }, 3, () => p.stone > 0);
  ok(p.stone > 0, 'bakışa giren oyuncu taş kesildi');
  const x0 = p.x;
  run(G2, { right: true }, 0.8);
  ok(Math.abs(p.x - x0) < 0.3, 'taş kesilen oyuncu kıpırdamadı');
  run(G2, NONE, 0.6);
  ok(p.stone === 0 && p.stoneCD > 0, 'çözüldü, kısa süre bakıştan etkilenmez');
}
// ---------- yuva arada bir bug çıkarır (aynı anda en çok iki) ----------
{
  const i = custom(['..P.................', '#'.repeat(20), '#'.repeat(20)], { hand: true, objs: [{ k: 'yuva', x: 15, y: 11, every: 0.5, max: 2, dir: 1 }] });
  const G = BA.loadStage(BA.newRun(), i);
  run(G, () => { G.player.inv = 99; return {}; }, 3);
  ok(G.ents.filter((e) => !e.dead && e.kind === 'bug').length === 2, 'yuvadan en çok iki bug');
}
// ---------- taşkın: yaklaşınca su yükselir, bug'ı alır; pompaya basınca iner; sal suyla kalkar ----------
{
  const i = custom(['..P.....................', '#####.............######', '#####.............######'], { hand: true, objs: [{ k: 'taskin', x0: 5, x1: 18, y: 12.6, hi: 8, rate: 1 }, { k: 'pompa', x: 3, y: 11, drop: 3 }, { k: 'sal', x: 8, y: 12.4, w: 3, off: 0.2 }] });
  const G = BA.loadStage(BA.newRun(), i), d = G.floods[0], sal = G.plats.find((q) => q.kind === 'float');
  ok(BA.tile(G, 3, 11) === BA.T.PUMP, 'pompa yerinde');
  run(G, NONE, 2);
  ok(d.y < 11 && Math.abs(sal.y - (d.y - 0.2)) < 0.01, `su yükseldi, sal kalktı (${d.y.toFixed(2)})`);
  const bug = mkBug(10, 9, 0); bug.y = d.y - 0.5; G.ents.push(bug);
  run(G, NONE, 0.2);
  ok(bug.dead, 'sudaki bug gitti');
  const y0 = d.y;
  place(G, 3, 9); G.player.onGround = false;
  let low = 0;
  run(G, NONE, 1.5, () => { low = Math.max(low, d.y); return false; });
  ok(low > Math.min(12.6, y0 + 3) - 0.01, `pompaya basınca su indi (${y0.toFixed(2)} → ${low.toFixed(2)})`);
}

// ================= Köprü: yan rüzgâr, korunak, halat makarası, bakım sepeti =================
// ---------- rüzgâr havadakini tam, yerdekini az iter; rüzgârın geldiği yandaki kiriş korur ----------
{
  const i = custom(['..P.........................', '#'.repeat(28), '#'.repeat(28)], { hand: true, objs: [{ k: 'ruzgar', x0: 0, x1: 28, v: 5 }] });
  const G = BA.loadStage(BA.newRun(), i), p = G.player;
  const x0 = p.x;
  run(G, NONE, 1);
  const dg = p.x - x0;
  ok(dg > 1.5 && dg < 2.5, `yerde az itti (${dg.toFixed(2)})`);
  const G2 = BA.loadStage(BA.newRun(), i), p2 = G2.player, x1 = p2.x;
  run(G2, (g, t) => ({ jump: t < 0.4 }), 0.9);
  ok(p2.x - x1 > 3, `havada çok itti (${(p2.x - x1).toFixed(2)})`);
  const j = custom(['......=....', '...........', '..P........', '#'.repeat(11), '#'.repeat(11)], { hand: true, objs: [{ k: 'ruzgar', x0: 0, x1: 11, v: -6 }] });
  const G3 = BA.loadStage(BA.newRun(), j), p3 = G3.player;
  run(G3, () => { p3.inv = 99; return {}; }, 0.6);
  place(G3, 4.5, 12); p3.onGround = true;
  ok(BA.windAt(G3, p3) === 0, 'rüzgârın geldiği yandaki kirişin altı korunaklı');
  place(G3, 8.5, 12);
  ok(BA.windAt(G3, p3) < -5, 'kirişin ötesi açık');
}
// ---------- yanıp sönen rüzgâr ----------
{
  const i = custom(['..P.........................', '#'.repeat(28), '#'.repeat(28)], { hand: true, objs: [{ k: 'ruzgar', x0: 0, x1: 28, v: 5, per: 4, on: 1 }] });
  const G = BA.loadStage(BA.newRun(), i);
  run(G, NONE, 0.6);
  ok(G.winds[0].k > 0.9, 'rüzgâr esiyor');
  run(G, NONE, 1.2);
  ok(G.winds[0].k === 0, 'rüzgâr dindi');
}
// ---------- makara: binince halat boyunca kayar, uçta fırlatır; zıplayınca hızı sürer ----------
{
  const i = custom(['...........................', '...........................', '...........................', '...........................', '..P........................', '#####...................###', '#####...................###'].slice(-5).concat([]), { hand: true, objs: [{ k: 'makara', x0: 6, y0: 12, x1: 20, y1: 12.01 }] });
  const k = custom(['..P......................', '####.....................', '####.....................'], { hand: true, objs: [{ k: 'makara', x0: 5, y0: 8, x1: 19, y1: 11 }] });
  const G = BA.loadStage(BA.newRun(), k), tr = G.trolleys[0], p = G.player;
  run(G, NONE, 1);
  ok(tr.s === 0, 'boş makara başta bekliyor');
  place(G, 5, 8); p.onGround = false;
  run(G, NONE, 0.5);
  ok(p.plat === tr.plat && tr.v > 0, 'binince kaymaya başladı');
  let flung = false;
  run(G, NONE, 4, () => { if (!p.onGround && p.vy < 0 && tr.s >= tr.L) flung = true; return flung; });
  ok(flung && (p.carry || 0) > 2, `uçtaki tampon fırlattı (${(p.carry || 0).toFixed(2)})`);
  const G2 = BA.loadStage(BA.newRun(), k), tr2 = G2.trolleys[0], p2 = G2.player;
  place(G2, 5, 8);
  run(G2, NONE, 1.6);
  const v = tr2.plat.vx;
  run(G2, { jump: true }, 0.1);
  ok(!p2.onGround && Math.abs(p2.carry - v * 0.9) < 0.5, `kayarken zıplayınca hız sürdü (${(p2.carry || 0).toFixed(2)})`);
  void i;
}
// ---------- bakım sepeti sarkaç gibi sallanır; rüzgârlı sepet rüzgârsız durur ----------
{
  const i = custom(['..P.........................', '#'.repeat(28), '#'.repeat(28)], { hand: true, objs: [{ k: 'sepet', x: 14, y: 2, len: 6, amp: 0.6, per: 3 }, { k: 'sepet', x: 22, y: 2, len: 6, amp: 0.6, per: 3, wind: true }] });
  const G = BA.loadStage(BA.newRun(), i), [a, b] = G.swings;
  let mn = 99, mx = -99, mb = 0;
  run(G, NONE, 3, () => { mn = Math.min(mn, a.plat.x); mx = Math.max(mx, a.plat.x); mb = Math.max(mb, Math.abs(b.a)); return false; });
  ok(mx - mn > 5, `sepet sallandı (${(mx - mn).toFixed(1)} karo)`);
  ok(mb < 0.12, 'rüzgârsız sepet durgun');
}

// ================= Eyüp: çamaşır ipi, teleferik =================
// ---------- çamaşır ipi: yüksekten düşeni daha yükseğe sektirir; üstünden yürünür ----------
{
  const i = custom(['..P.........................', '#####.......#################', '#####.......#################'].map((r) => r.slice(0, 28)), { hand: true, objs: [{ k: 'ip', x0: 5, x1: 12, y: 12 }] });
  const G = BA.loadStage(BA.newRun(), i), p = G.player;
  run(G, { right: true }, 1.2);
  ok(p.x > 8 && p.y + p.h <= 12.01 && G.ropes[0].sag === 0, 'ipin üstünden yüründü (sekmedi)');
  const peak = (h) => {
    const G2 = BA.loadStage(BA.newRun(), i), q = G2.player;
    place(G2, 8, 12 - h); q.onGround = false;
    let top = 99, bounced = false;
    run(G2, NONE, 2.2, () => { if (q.vy < 0) bounced = true; if (bounced) top = Math.min(top, q.y + q.h); return bounced && q.vy > 0; });
    return 12 - top;
  };
  const a = peak(2), b = peak(6);
  ok(a > 1.4 && b > a + 1.5, `yüksekten düşen daha yükseğe sekti (${a.toFixed(1)} / ${b.toFixed(1)})`);
}
// ---------- teleferik: kabinler hat boyunca gider, varışta baştan çıkar; tavandakini taşır ----------
{
  const i = custom(['..P.........................', '#####..................#####', '#####..................#####'], { hand: true, objs: [{ k: 'teleferik', x0: 5, y0: 11, x1: 23, y1: 5, n: 2, v: 3 }] });
  const G = BA.loadStage(BA.newRun(), i), ln = G.lines[0], cb = ln.cabins[0], p = G.player;
  ok(ln.cabins.length === 2 && Math.abs(cb.y - 11) < 0.01, 'iki kabin, ilki alt istasyonda');
  place(G, cb.x + 1.5, cb.y); p.onGround = true; p.plat = cb; p.inv = 99;
  run(G, NONE, 2);
  ok(p.plat === cb && cb.y < 10 && p.y + p.h < 10.05, `kabin tavanındakini yukarı taşıdı (${cb.y.toFixed(2)})`);
  run(G, () => { p.inv = 99; return {}; }, 6, () => cb.y > 10.9);
  ok(cb.y > 10.9, 'varışta baştan çıktı');
}
// ---------- teleferik direğinin kolu tavanda durana çarpar ----------
{
  const rows = ['..............................', '..............................', '..............................', '..............................', '..............................', '..............................', '..............==..............', '..P...........................', '#####.....................####', '#####.....................####'];
  const i = custom(rows, { hand: true, objs: [{ k: 'teleferik', x0: 5, y0: 12, x1: 25, y1: 12, n: 1, v: 3 }] });
  const G = BA.loadStage(BA.newRun(), i), cb = G.lines[0].cabins[0], p = G.player;
  G.S.power = 1; p.h = BA.BIG_H;
  place(G, cb.x + 1.5, cb.y); p.onGround = true; p.plat = cb; p.inv = 99;
  run(G, NONE, 4);
  ok(p.plat !== cb, 'direğin kolu tavandakini düşürdü');
}

// ================= Şile: oto yıkama fırçası, köpük baloncukları, fener ışığı basamakları =================
{
  const i = custom(['..P.........................', '#'.repeat(28), '#'.repeat(28)], { hand: true, objs: [{ k: 'firca', x0: 8, x1: 20, y0: 7, y1: 10, v: 3 }] });
  const S = BA.newRun(); S.power = 1;
  const G = BA.loadStage(S, i), br = G.brushes[0], p = G.player;
  p.h = BA.BIG_H; p.y = 12 - p.h;
  G.ents.push(mkBug(15, 11, 0));
  const bug = G.ents[0];
  run(G, NONE, 3, () => bug.dead);
  ok(bug.dead, 'fırça bug\'ı yıkadı');
  place(G, br.x + br.w + 1.2, 12); p.onGround = true; br.dir = 1;
  run(G, NONE, 1.5, () => p.vx > 3);
  ok(p.vx > 3 && S.power === 1, 'fırça oyuncuyu itti, can almadı');
  br.x = 12; br.dir = 1; br.plat.x = br.x - 0.3;
  place(G, br.plat.x + 0.6, br.plat.y); p.onGround = true; p.plat = br.plat;
  const x0 = p.x;
  run(G, NONE, 1);
  ok(p.plat === br.plat && p.x - x0 > 1.5, `fırçanın tepesindeki taşındı (${(p.x - x0).toFixed(2)})`);
}
{
  const i = custom(['..P.........................', '#'.repeat(28), '#'.repeat(28)], { hand: true, objs: [{ k: 'kopuk', x: 8, y: 11, every: 0.5, v: 1.5, top: 2, life: 0.8 }] });
  const G = BA.loadStage(BA.newRun(), i);
  run(G, NONE, 1.2);
  ok(G.bubbles.length >= 2 && G.bubbles[0].y < 10.5, `köpük baloncukları çıkıp yükseliyor (${G.bubbles.length})`);
  const b = G.bubbles[0];
  place(G, b.x + 0.4, b.y); G.player.onGround = true; G.player.plat = b;
  run(G, NONE, 1.2);
  ok(!G.bubbles.includes(b), 'üstünde durulan baloncuk patladı');
}
{
  const i = custom(['..P.........................', '#'.repeat(28), '#'.repeat(28)], { hand: true, objs: [{ k: 'fener', x: 24, y: 2, a0: 2.4, a1: 2.9, per: 4 }, { k: 'isik', x0: 10, x1: 11, y: 9 }, { k: 'isik', x0: 14, x1: 15, y: 9, inv: true }] });
  const G = BA.loadStage(BA.newRun(), i), [a, b] = G.boards;
  let litA = false, darkA = false, flip = false;
  run(G, NONE, 4, () => { if (a.lit) litA = true; else darkA = true; if (b.lit !== !BA.beamLit(G, 15, 9.5, G.t) && false) flip = true; return false; });
  ok(litA && darkA, 'ışık basamağı ışık düşünce belirdi, gidince kayboldu');
  ok(G.boards.some((q) => q.inv) && !flip, 'gölge basamağı var');
}

// ================= Sanayi: yürüyen bant, koli yığını, pres, şahmerdan, kızgın demir =================
{
  const i = custom(['..P.........................', '#'.repeat(28), '#'.repeat(28)], { hand: true, objs: [{ k: 'bant', x0: 0, x1: 27, y: 12, v: 3 }] });
  const G = BA.loadStage(BA.newRun(), i), p = G.player, x0 = p.x;
  G.ents.push(mkBug(15, 11, 0)); const bug = G.ents[0];
  run(G, () => { bug.vx = 0; return {}; }, 1);
  ok(p.x - x0 > 2.5 && bug.x > 17.5, `bant oyuncuyu ve bug'ı taşıdı (${(p.x - x0).toFixed(2)})`);
}
{
  const i = custom(['.........................=', '.........................=', '..P......................=', '###########..............#', '###########..............#'].map((r) => r.padEnd(26, '.')), { hand: true, objs: [{ k: 'bant', x0: 3, x1: 9, y: 9, v: 3 }, { k: 'koli', x: 3, y: 8, every: 0.6, max: 3 }] });
  void i;
  const k = custom(['..P.......................', '#'.repeat(26), '#'.repeat(26)], { hand: true, objs: [{ k: 'bant', x0: 3, x1: 9, y: 8, v: 3 }, { k: 'koli', x: 3, y: 7, every: 0.6, max: 3 }] });
  const G = BA.loadStage(BA.newRun(), k);
  run(G, () => { G.player.inv = 99; G.player.x = 1; return {}; }, 6);
  let n = 0; for (let y = 0; y < G.H; y++) for (let x = 0; x < G.W; x++) if (BA.tile(G, x, y) === BA.T.CRATE) n++;
  ok(n === 3, `bandın ucundan düşen üç koli yere yığıldı (${n})`);
}
{
  const i = custom(['..P.........................', '#'.repeat(28), '#'.repeat(28)], { hand: true, objs: [{ k: 'pres', x: 12, w: 2, top: 4, bot: 11, per: 3 }] });
  const S = BA.newRun(); S.power = 1;
  const G = BA.loadStage(S, i), pr = G.presses[0], p = G.player;
  G.ents.push(mkBug(12.5, 11, 0)); const bug = G.ents[0];
  run(G, () => { bug.vx = 0; return {}; }, 0.4);
  ok(bug.dead && Math.abs(pr.y - 11) < 0.01, 'pres indi, altındaki bug ezildi');
  run(G, NONE, 1);
  place(G, 12.6, pr.y); p.onGround = true; p.plat = pr.plat;
  let top = 99;
  run(G, NONE, 1.5, () => { top = Math.min(top, p.y + p.h); return false; });
  ok(top < 5 && p.plat === pr.plat, `kalkan pres kafasındakini yukarı taşıdı (${top.toFixed(2)})`);
  const G2 = BA.loadStage(S, i), p2 = G2.player; S.power = 1;
  run(G2, NONE, 2.9);
  place(G2, 12.5, 12); p2.onGround = true; p2.h = BA.BIG_H; p2.y = 12 - p2.h;
  run(G2, NONE, 0.4);
  ok(S.power === 0, 'inen pres altındaki oyuncuyu ezdi');
}
{
  const i = custom(['..P.........................', '#'.repeat(28), '#'.repeat(28)], { hand: true, objs: [{ k: 'pres', x: 14, w: 2, top: 4, bot: 11, per: 3, shock: 6 }] });
  const G = BA.loadStage(BA.newRun(), i), p = G.player;
  place(G, 10, 12); p.onGround = true;
  let hop = false;
  run(G, () => { p.inv = 99; return {}; }, 0.3, () => { if (p.vy < -5 && !p.jumping) hop = true; return hop; });
  ok(hop, 'şahmerdan vurunca yerdeki oyuncu sıçradı');
  const G2 = BA.loadStage(BA.newRun(), i), p2 = G2.player;
  run(G2, NONE, 2.9);
  place(G2, 10, 12); p2.onGround = true;
  let top = 99;
  run(G2, (g, t) => ({ jump: t > 0.02 && t < 0.6 }), 1.6, () => { top = Math.min(top, p2.y + p2.h); return false; });
  ok(12 - top > 7, `vurduğu an zıplayan çok yükseğe uçtu (${(12 - top).toFixed(1)})`);
}
{
  const i = custom(['..P.........................', '#####..................#####', '#####..................#####'], { hand: true, objs: [{ k: 'demir', x0: 5, x1: 22, y: 11, every: 9, t0: 8.9, v: 2, cool: 1.5 }] });
  const S = BA.newRun(); S.power = 1;
  const G = BA.loadStage(S, i), p = G.player;
  run(G, NONE, 0.2);
  const ir = G.irons[0];
  ok(ir && ir.heat > 0.8, 'ocaktan kızgın çubuk çıktı');
  run(G, NONE, 1.8);
  ok(ir.heat === 0, 'çubuk soğudu');
  place(G, ir.x + 1, ir.y); p.onGround = true; p.plat = ir;
  run(G, NONE, 1);
  ok(S.power === 1 && p.plat === ir, 'soğuyan çubuğa basıldı, taşıdı');
}

// ================= Çamlıca: sis ve cam teras, dolap asansör, yayın dalgaları =================
{
  const i = custom(['..P.........................', '#####.............##########', '#####.............##########'].map((r) => r.slice(0, 28)), { hand: true, objs: [{ k: 'cam', x0: 5, x1: 17, y: 12 }, { k: 'sis', x0: 0, x1: 20, w: 8, per: 6 }] });
  const G = BA.loadStage(BA.newRun(), i), p = G.player;
  ok(BA.tile(G, 10, 12) === BA.T.FROST && BA.SOLID[BA.T.FROST], 'cam teras katı');
  run(G, { right: true }, 3.5);
  ok(!p.dead && p.x > 17 && p.y + p.h <= 12.01, `görünmez cam köprüden yüründü (${p.x.toFixed(1)})`);
  run(G, NONE, 0.1);
  let lo = 1, hi = 0;
  run(G, NONE, 6, () => { const d = BA.fogAt(G, 10, 8); lo = Math.min(lo, d); hi = Math.max(hi, d); return false; });
  ok(hi > 0.8 && lo < 0.05, `sis gelip gidiyor (${lo.toFixed(2)}..${hi.toFixed(2)})`);
}
{
  const i = custom(['..P.........................', '#'.repeat(28), '#'.repeat(28)], { hand: true, objs: [{ k: 'dolap', x: 8, gap: 4, top: 4, bot: 11, n: 4, v: 2 }] });
  const G = BA.loadStage(BA.newRun(), i), pt = G.paters[0];
  const c0 = pt.cars[0];
  ok(c0.x === 8 && c0.y === 11, 'ilk kabin çıkan sütunun dibinde');
  let up = false, across = false, down = false;
  run(G, () => { G.player.inv = 99; G.player.x = 1; return {}; }, 9, () => { if (c0.x === 8 && c0.y < 6) up = true; if (c0.y === 4 && c0.x > 9) across = true; if (c0.x === 12 && c0.y > 9) down = true; return up && across && down; });
  ok(up && across && down, 'kabin çıktı, tepede yana geçti, öbür sütunda indi');
}
{
  const i = custom(['..P.........................', '#'.repeat(28), '#'.repeat(28)], { hand: true, objs: [{ k: 'verici', x: 10.5, y: 12, per: 3, v: 7, max: 8, force: 14 }] });
  const G = BA.loadStage(BA.newRun(), i), p = G.player;
  place(G, 10, 12); p.onGround = true;
  let top = 99;
  run(G, () => { p.inv = 99; return {}; }, 1.6, () => { top = Math.min(top, p.y + p.h); return false; });
  ok(12 - top > 6, `vericinin üstündeki dimdik fırladı (${(12 - top).toFixed(1)})`);
  const G2 = BA.loadStage(BA.newRun(), i), p2 = G2.player;
  place(G2, 13, 12); p2.onGround = true;
  G2.ents.push(mkBug(7, 11, 0)); const bug = G2.ents[0];
  let vx = 0;
  run(G2, () => { p2.inv = 99; bug.vx = 0; return {}; }, 1, () => { vx = Math.max(vx, p2.vx); return false; });
  ok(vx > 6 && bug.dead, `yanındaki yana savruldu, bug devrildi (${vx.toFixed(1)})`);
}

// ---------- el yapımı bölümler: üçer altın simit, en az iki kayıt noktası ----------
{
  for (let k = 0; k < NL; k++) {
    const L = LV[k];
    if (!L.hand) continue;
    const G = BA.loadStage(BA.newRun(), k);
    ok(G.golds.length === 3 && (L.quiet || G.checkpoints.length >= 2), `${L.world}-${L.section}: 3 altın simit, ${G.checkpoints.length} kayıt noktası`);
  }
  const hand = LV.slice(0, NL).filter((L) => L.hand);
  ok(hand.length >= 3 && hand.length % 3 === 0 && hand.every((L) => LV.slice(0, NL).filter((M) => M.world === L.world).every((M) => M.hand)), `elle tasarlanan dünyalar bütün bölümleriyle (${hand.length / 3} dünya)`);
}

console.log(fails ? `${fails} hata, ${passes} geçti` : `core: ${passes} denetim geçti`);
process.exit(fails ? 1 : 0);
