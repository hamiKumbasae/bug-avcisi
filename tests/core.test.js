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
  ok(hFull > 4.2 && hFull < 4.7, `tam zıplama ~4.45 karo (${hFull.toFixed(2)})`);
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
  run(G, NONE, 6, (g) => g.result === 'clear');
  ok(G.result === 'clear' && S.score > before + 1000, `kalan süre puana döndü (+${S.score - before})`);
  // kayıt noktasından yeniden başla
  G = BA.loadStage(S, i);
  run(G, { right: true }, 1.2);
  ok(S.checkpoint && S.checkpoint.stage === i, 'kayıt noktası oturuma yazıldı');
  G = BA.loadStage(S, i);
  ok(Math.abs(G.player.x - 8.125) < 0.01, 'kayıt noktasından başladı');
}

// ---------- gerçek bölümler yüklenir ----------
{
  for (let k = 0; k < 27; k++) {
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
  for (let k = 2; k < 27; k += 3) {
    const L = LV[k];
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

// hatıra parçası: her dünyanın 2. bölümünde bir tane; alınınca koşu kaydına işlenir
{
  for (let w = 0; w < 9; w++) {
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

console.log(fails ? `${fails} hata, ${passes} geçti` : `core: ${passes} denetim geçti`);
process.exit(fails ? 1 : 0);
