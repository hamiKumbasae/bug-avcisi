// Bug Avcısı: İstanbul — gökyüzündeki ay, o gün İstanbul'dan nasıl görünüyorsa öyle.
// Hesap SunCalc ile yapılır (evre, eğiklik, yükseklik); çizimden bağımsızdır ve Node'da test edilir.
// Bütün oyun tek bir gün ve gecede geçer: her bölümün bir sahne saati var (sabah, öğle, ... şafak).
(function (root) {
  'use strict';
  const SunCalc = root.SunCalc || (typeof require === 'function' ? require('./vendor/suncalc.js') : null);
  const LAT = 41.01, LNG = 28.98;        // İstanbul
  const TZ = 3;                          // Türkiye 2016'dan beri bütün yıl UTC+3
  const H = 3600e3, DEG = 180 / Math.PI;
  // sahne saati → [SunCalc anı, saat farkı]
  const SLOTS = {
    sabah: ['sunrise', 1.5],
    ogle: ['solarNoon', 0],
    ogledenSonra: ['sunset', -2.5],
    aksamustu: ['sunset', -1],
    gunbatimi: ['sunset', 0],
    gece: ['sunset', 3],
    geceyarisi: ['nadir', 0],
    geceyarisindanSonra: ['nadir', 2],
    safakOncesi: ['nauticalDawn', 0],
    safak: ['sunrise', 0],
  };
  // gece yarısından sonraki saatler oyunun ertesi gününe düşer
  const NEXT_DAY = { geceyarisi: 1, geceyarisindanSonra: 1, safakOncesi: 1, safak: 1 };
  // gökyüzünde ne kadar seçilir: gündüz soluk, gün batımında yarı, gece tam
  const BRIGHT = { sabah: 0.4, ogle: 0.32, ogledenSonra: 0.38, aksamustu: 0.5, gunbatimi: 0.7, gece: 1, geceyarisi: 1, geceyarisindanSonra: 1, safakOncesi: 0.85, safak: 0.6 };

  // oyuncunun cihazındaki bugünün İstanbul'daki tarihi (yıl, ay, gün)
  function istanbulDate(now) {
    const t = new Date((now || new Date()).getTime() + TZ * H);
    return { y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate() };
  }
  // sahnenin anı: o günün (ya da gece yarısından sonraysa ertesi günün) güneş saatlerinden
  function sceneTime(slot, now, dayOffset) {
    const S = SLOTS[slot] || SLOTS.gece;
    const { y, m, d } = istanbulDate(now);
    const day = d + (dayOffset !== undefined ? dayOffset : NEXT_DAY[slot] || 0);
    const noon = new Date(Date.UTC(y, m, day, 12 - TZ));   // o günün İstanbul öğlesi
    const T = SunCalc.getTimes(noon, LAT, LNG);
    return new Date(T[S[0]].getTime() + S[1] * H);
  }
  // bir anda ay: aydınlık oran, aydınlık kenarın tepeden saat yönünün tersine açısı (eğiklik), yükseklik
  function at(date) {
    const il = SunCalc.getMoonIllumination(date), pos = SunCalc.getMoonPosition(date, LAT, LNG);
    const tilt = il.angle - pos.parallacticAngle;
    return {
      date, fraction: il.fraction, phase: il.phase, tilt, tiltDeg: tilt * DEG,
      altitude: pos.altitude, altitudeDeg: pos.altitude * DEG, azimuth: pos.azimuth,
      visible: pos.altitude > 0 && il.fraction >= 0.02,
    };
  }
  // bir sahne için: görünürse { fraction, tilt, altitudeDeg, bright }, görünmezse null
  function forScene(slot, now, dayOffset) {
    const m = at(sceneTime(slot, now, dayOffset));
    if (!m.visible) return null;
    return { fraction: m.fraction, tilt: m.tilt, altitudeDeg: m.altitudeDeg, bright: BRIGHT[slot] || 1, slot };
  }
  // gökyüzünde yer: yükseklik → dikey konum (ufka yakınsa alçakta)
  function skyY(altDeg, horizonY, topY) {
    const k = Math.max(0, Math.min(1, altDeg / 60));
    return horizonY - k * (horizonY - topY);
  }

  const api = { LAT, LNG, TZ, SLOTS, NEXT_DAY, BRIGHT, istanbulDate, sceneTime, at, forScene, skyY };
  root.BA_MOON = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
