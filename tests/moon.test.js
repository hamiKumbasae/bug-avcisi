// Ay hesabı: o günün İstanbul'dan görünen ayı (evre, eğiklik, yükseklik) ve sahne saatleri.
// node tests/moon.test.js
'use strict';
const path = require('path');
global.SunCalc = require(path.join(__dirname, '..', 'src', 'vendor', 'suncalc.js'));
const M = require(path.join(__dirname, '..', 'src', 'moon.js'));

let fails = 0, passes = 0;
function ok(c, m) { if (c) passes++; else { fails++; console.log('FAIL ' + m); } }
const ist = (s) => new Date(s + '+03:00');
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const angDiff = (a, b) => { let d = ((a - b) % 360 + 540) % 360 - 180; return Math.abs(d); };

// kontrol değerleri (README, v2.0 planı): aydınlık oran ±0,5 puan, açılar ±1°
const CASES = [
  ['2026-10-29T07:00', { pct: 88.8, alt: 44.3, visible: true }],
  ['2026-10-29T18:00', { alt: -14.8, visible: false }],
  ['2026-10-29T22:00', { pct: 83.8, alt: 17.2, tilt: 135.0, visible: true }],
  ['2026-11-09T07:00', { pct: 0.2, visible: false }],
  ['2026-11-11T18:31', { pct: 5.8, alt: 3.4, tilt: -114.2, visible: true }],
  ['2026-11-24T19:00', { pct: 99.8, visible: true }],
];
for (const [t, e] of CASES) {
  const m = M.at(ist(t));
  if (e.pct !== undefined) ok(near(m.fraction * 100, e.pct, 0.5), `${t}: aydınlık %${(m.fraction * 100).toFixed(1)} (beklenen %${e.pct})`);
  if (e.alt !== undefined) ok(near(m.altitudeDeg, e.alt, 1), `${t}: yükseklik ${m.altitudeDeg.toFixed(1)}° (beklenen ${e.alt}°)`);
  if (e.tilt !== undefined) ok(angDiff(m.tiltDeg, e.tilt) <= 1, `${t}: eğiklik ${m.tiltDeg.toFixed(1)}° (beklenen ${e.tilt}°)`);
  ok(m.visible === e.visible, `${t}: ${e.visible ? 'görünür' : 'çizilmez'}`);
}
// 29 Ekim 2026: ay 11:25'te batar, 20:08'de doğar
{
  const mt = global.SunCalc.getMoonTimes(ist('2026-10-29T12:00'), M.LAT, M.LNG);
  const hm = (d) => { const t = new Date(d.getTime() + 3 * 3600e3); return t.getUTCHours() * 60 + t.getUTCMinutes(); };
  ok(near(hm(mt.set), 11 * 60 + 25, 2) && near(hm(mt.rise), 20 * 60 + 8, 2), `29 Ekim ay batışı/doğuşu ${hm(mt.set)} / ${hm(mt.rise)} dk`);
}
// İstanbul tarihi: UTC'de gece yarısından sonra ama İstanbul'da ertesi gün
{
  const d = M.istanbulDate(new Date('2026-10-28T22:30:00Z'));
  ok(d.y === 2026 && d.m === 9 && d.d === 29, 'UTC 28 Ekim 22:30 İstanbul\'da 29 Ekim');
}
// sahne saatleri bir günün akışında sırayla ilerler (sabahtan ertesi şafağa)
{
  const order = ['sabah', 'ogle', 'ogledenSonra', 'aksamustu', 'gunbatimi', 'gece', 'geceyarisi', 'geceyarisindanSonra', 'safakOncesi', 'safak'];
  for (const day of ['2026-01-15T10:00', '2026-06-21T10:00', '2026-10-29T10:00']) {
    const ts = order.map((s) => M.sceneTime(s, ist(day)).getTime());
    ok(ts.every((t, i) => i === 0 || t > ts[i - 1]), `${day.slice(0, 10)}: sahne saatleri sırayla`);
    const span = (ts[ts.length - 1] - ts[0]) / 3600e3;
    ok(span > 18 && span < 26, `${day.slice(0, 10)}: sabahtan ertesi şafağa ${span.toFixed(1)} saat`);
  }
  // 29 Ekim: sabah sahnesinde ay görünür (küçülen şişkin ay), gün batımında görünmez, gece yarısında görünür
  const now = ist('2026-10-29T10:00');
  const sab = M.forScene('sabah', now), gb = M.forScene('gunbatimi', now), gy = M.forScene('geceyarisi', now);
  ok(sab && sab.fraction > 0.8 && sab.bright < 0.6, '29 Ekim sabah: ay soluk ve şişkin');
  ok(gb === null, '29 Ekim gün batımı: ay ufkun altında');
  ok(gy && gy.altitudeDeg > 20 && gy.bright === 1, `29 Ekim gece yarısı: ay yüksekte (${gy && gy.altitudeDeg.toFixed(1)}°)`);
  // ertesi sabah (12-2): gün kaydırması
  const t0 = M.sceneTime('sabah', now).getTime(), t1 = M.sceneTime('sabah', now, 1).getTime();
  ok(near((t1 - t0) / 3600e3, 24, 0.2), 'ertesi sabah 24 saat sonra');
}
// gökyüzünde yer: ufukta alçak, yüksekte üstte
ok(M.skyY(0, 150, 20) === 150 && M.skyY(90, 150, 20) === 20 && M.skyY(30, 150, 20) === 85, 'yükseklik → dikey konum');

console.log(fails ? `ay: ${fails} hata, ${passes} geçti` : `ay: ${passes} denetim geçti`);
process.exit(fails ? 1 : 0);
