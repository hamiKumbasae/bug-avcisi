// Bug Avcısı: İstanbul — v2.0 mekânları. Yeni dünyalar eski çizimlerin başka ışıktaki hâlleriyle kurulur
// (SC.at: aynı çizim başka bir saatte); yalnız gerekenler yeni çizilir: plaza lobisi, Eyüp'ün teleferiği ve tepesi,
// Şile yolu, benzin istasyonu, Şile Feneri, DES'in depo rafları, Kadosan'ın atölye sırası ve Ümraniye'de çatılar.
// Katmanlar 512 mantıksal piksel genişliğinde, kenarlardan kesintisiz tekrarlanır; zemin çizgisi y=214.
(function (root) {
  'use strict';
  const A = root.BA_ART, SC = root.BA_SCENE;
  const { lin, rng } = A;
  const { pen, mix, ferry, seagull, maidensTower } = SC;
  const { B, C, E, P, rect, archWin, hillMosque, bridge, house, hillsY, hills, hillHouses, cloud, glassTower, homeTower, camlicaTower, fistikCami } = SC.kit;
  const { grad, glow, skyGrad, stars, lamp, rain } = SC.pk;
  const TAU = Math.PI * 2, W = 512;
  const DR = SC.DRAW;
  const NONE = 'rgba(0,0,0,0)';

  // ---------- ortak parçalar ----------
  // sahnenin saati (o günün güneşine göre), İstanbul saatiyle "16:40"
  function sceneClock(slot) {
    const M = root.BA_MOON;
    if (!M || !root.SunCalc) return '';
    const t = new Date(M.sceneTime(slot, new Date()).getTime() + M.TZ * 3600e3);
    return String(t.getUTCHours()).padStart(2, '0') + ':' + String(t.getUTCMinutes()).padStart(2, '0');
  }
  // şehir ekranı: direğe asılı büyük ekran; saat ve kayan bir dalga
  function cityScreen(g, x, y, w, h, clock) {
    rect(g, x + w / 2 - 3, y + h, 6, 214 - y - h, '#2a2e3a');
    B(g, x - 3, y - 3, w + 6, h + 6, 2, '#1a1e2c');
    g.fillStyle = grad(g, 0, y, 0, y + h, [[0, '#2a64d8'], [1, '#1a3a9a']]); g.fillRect(x, y, w, h);
    g.strokeStyle = 'rgba(140,220,255,0.7)'; g.lineWidth = 1.2; g.beginPath();
    for (let k = 0; k <= w; k += 2) g.lineTo(x + k, y + h * 0.78 + Math.sin(k / 6) * 2.2);
    g.stroke();
    glow(g, x + w / 2, y + h / 2, w * 0.8, 'rgb(90,150,255)', 0.18);
    g.fillStyle = '#ffffff'; g.font = `600 ${Math.round(h * 0.42)}px Fredoka, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(clock, x + w / 2, y + h * 0.4);
  }
  // servi ağacı
  function cypress(g, x, by, h, col) { g.fillStyle = col; g.beginPath(); g.ellipse(x, by - h / 2, h * 0.14, h / 2, 0, 0, TAU); g.fill(); }
  // basit bir insan silüeti (yüzsüz): ayakta, kollar yanda
  function person(g, x, by, h, body, head) {
    B(g, x - h * 0.17, by - h * 0.78, h * 0.34, h * 0.5, h * 0.1, body);
    rect(g, x - h * 0.12, by - h * 0.3, h * 0.09, h * 0.3, mix(body, '#000000', 0.35)); rect(g, x + h * 0.03, by - h * 0.3, h * 0.09, h * 0.3, mix(body, '#000000', 0.35));
    C(g, x, by - h * 0.88, h * 0.12, head || '#c89a7a');
  }
  // kepenk (yükseklik: ne kadar iniktir)
  function shutter(g, x, y, w, h, col) {
    rect(g, x, y, w, h, col || '#8a8e98');
    for (let yy = y + 2; yy < y + h; yy += 3) rect(g, x, yy, w, 0.8, 'rgba(40,40,50,0.35)');
    rect(g, x, y + h - 2, w, 2, 'rgba(30,30,40,0.5)');
  }
  // floresan: çubuk ve soğuk ışık
  function tube(g, x, y, w) {
    glow(g, x + w / 2, y + 2, w * 0.9, 'rgb(220,240,255)', 0.35);
    B(g, x, y, w, 2.4, 1, '#f4fbff');
  }
  // dövme ocağı: tuğla gövde, ağzında kor
  function forge(g, x, by, w) {
    B(g, x, by - 40, w, 40, 3, '#4a3a34'); rect(g, x + 2, by - 44, w - 4, 5, '#3a2e2a');
    rect(g, x + w / 2 - 4, by - 90, 8, 46, '#3a2e2a');
    glow(g, x + w / 2, by - 22, w * 0.9, 'rgb(255,130,40)', 0.85);
    E(g, x + w / 2, by - 22, w * 0.3, 6, '#ffcc4a');
    for (let k = 0; k < 4; k++) rect(g, x + 2, by - 36 + k * 9, w - 4, 0.6, 'rgba(20,10,10,0.35)');
  }
  // örs
  function anvil(g, cx, by, s) {
    P(g, [cx - 14 * s, by - 18 * s, cx + 10 * s, by - 18 * s, cx + 16 * s, by - 21 * s, cx + 14 * s, by - 15 * s, cx + 6 * s, by - 14 * s, cx + 5 * s, by - 9 * s,
      cx - 5 * s, by - 9 * s, cx - 6 * s, by - 14 * s, cx - 14 * s, by - 15 * s], '#3a3a44');
    rect(g, cx - 4 * s, by - 9 * s, 8 * s, 9 * s, '#2a2a32');
    rect(g, cx - 13 * s, by - 18 * s, 22 * s, 1 * s, 'rgba(255,255,255,0.25)');
  }
  // duvarda asılı çekiçler ve maşalar
  function tools(g, x, y, n) {
    for (let k = 0; k < n; k++) {
      const tx = x + k * 10;
      lin(g, tx, y, tx, y + 24, '#6a4a2a', 1.4);
      if (k % 2) B(g, tx - 3.4, y - 2, 6.8, 4, 1, '#5a5e68'); else { lin(g, tx - 2, y + 24, tx - 3, y + 30, '#5a5e68', 1); lin(g, tx + 2, y + 24, tx + 3, y + 30, '#5a5e68', 1); }
    }
  }

  // ================= 3 ŞİŞLİ (öğleden sonra → akşamüstü) =================
  // 3-1 Mecidiyeköy Meydanı: Büyükdere Caddesi öğleden sonra ışığında; kuleler arasında şehir ekranı, ekranda sahnenin saati
  DR.mecidiyekoy = SC.at(DR.maslak, 'ogledenSonra', {
    sky: SC.skyOf('ogledenSonra', { clouds: [[60, 46, 1, 'rgba(255,248,236,0.85)'], [330, 30, 0.8, 'rgba(255,244,230,0.75)']] }),
    nearPost(g) { pen('rgba(30,50,80,0.55)', 0.5); cityScreen(g, 258, 112, 40, 26, sceneClock('ogledenSonra')); },
  });

  // ofis gökyüzü (cam ardında şehir) başka bir saatte
  const officeSky = (slot) => {
    const L = SC.LIGHT[slot];
    return {
      draw(g, vw, vh) {
        DR.toplanti.sky.draw(g, vw, vh);
        g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = L.mul; g.fillRect(0, 0, vw, vh); g.restore();
        if (slot === 'aksamustu') { g.fillStyle = grad(g, 0, 60, 0, vh, [[0, 'rgba(255,170,90,0)'], [1, 'rgba(255,150,80,0.35)']]); g.fillRect(0, 60, vw, vh - 60); }
      },
      noMoon: true,
    };
  };
  // 3-2 Plaza Lobisi: cam cephenin ardında şehir; resepsiyon, turnike, asansörler, döner kapı
  DR.plazaLobi = {
    sky: officeSky('ogledenSonra'),
    far: SC.tinted(DR.toplanti.far, SC.LIGHT.ogledenSonra.mul),
    near: SC.tinted((g) => {
      pen('rgba(40,50,70,0.6)', 0.5);
      // döner kapı ve cam giriş
      B(g, 8, 120, 92, 94, 1, 'rgba(210,235,250,0.3)'); rect(g, 8, 118, 92, 4, '#5a6474');
      for (const x of [8, 52, 98]) rect(g, x, 120, 2.4, 94, '#5a6474');
      E(g, 54, 172, 22, 42, 'rgba(200,225,245,0.35)'); lin(g, 54, 130, 54, 214, '#7a8494', 1.4); lin(g, 34, 172, 74, 172, 'rgba(122,132,148,0.7)', 1);
      B(g, 32, 122, 44, 6, 1, '#7a8494');
      g.fillStyle = 'rgba(255,255,255,0.35)'; P(g, [16, 210, 24, 210, 44, 124, 36, 124], 'rgba(255,255,255,0.25)');
      // resepsiyon: ahşap kaplı uzun tezgâh, arkasında görevli
      person(g, 160, 196, 30, '#2a3a5a', '#b88a6a');
      B(g, 120, 186, 92, 28, 4, '#c8a274'); rect(g, 120, 186, 92, 4, '#f2f0ea'); for (let x = 126; x < 210; x += 8) rect(g, x, 192, 0.8, 22, 'rgba(90,60,30,0.3)');
      B(g, 176, 176, 14, 10, 1, '#1e2430'); rect(g, 182, 183, 2, 3, '#5a6070');
      // turnikeler
      for (let k = 0; k < 4; k++) {
        const x = 232 + k * 20;
        B(g, x, 192, 6, 22, 1.5, '#c8ccd4'); rect(g, x + 1.4, 192, 3, 1.2, k === 1 ? '#ff4a4a' : '#5aff8a');
        P(g, [x + 6, 196, x + 15, 196, x + 15, 208, x + 6, 206], 'rgba(200,230,255,0.45)');
      }
      // asansörler: çelik kapılar ve kat göstergesi
      for (let k = 0; k < 3; k++) {
        const x = 330 + k * 44;
        B(g, x, 140, 36, 74, 1, '#9aa2ae'); rect(g, x + 3, 146, 30, 68, '#c8ced8'); rect(g, x + 17.6, 146, 0.8, 68, '#7a8494');
        B(g, x + 10, 132, 16, 6, 1, '#1e2430'); rect(g, x + 13, 134, 4, 2, '#ff9a4a'); rect(g, x + 19, 134, 4, 2, '#ff9a4a');
        g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(x + 4, 147, 5, 66);
      }
      // saksılar ve bekleme koltuğu
      for (const px of [110, 476]) { B(g, px - 9, 196, 18, 18, 2, '#e8e8ec'); for (const [dx, dy, r] of [[0, -22, 10], [-7, -12, 8], [7, -14, 8]]) C(g, px + dx, 196 + dy, r, '#3f9a4a'); }
      B(g, 486, 196, 26, 12, 4, '#3a5a8a'); B(g, 488, 186, 24, 12, 4, '#4a6a9a');
    }, SC.LIGHT.ogledenSonra.mul),
  };

  // 3-3 Mesai Sonu: Toplantı Katı akşamüstü; ofis boşalır, tavan ışıkları teker teker söner, bir masa lambası yanık kalır
  const DESK_LAMP = [384 + 30, 186];   // üçüncü masanın köşesi
  DR.mesaiSonu = SC.at(DR.toplanti, 'aksamustu', {
    sky: officeSky('aksamustu'),
    lights: 0,
    nearPost(g) {
      pen('rgba(40,50,70,0.65)', 0.5);
      // kapanmış ekranlar, geri itilmiş sandalyeler
      for (let k = 0; k < 2; k++) { const x = 292 + k * 44; B(g, x + 10, 164, 22, 15, 1, '#141822'); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(x + 12, 166, 6, 11); }
      // masa lambası
      const [lx, ly] = DESK_LAMP;
      lin(g, lx, ly, lx - 4, ly - 14, '#2a2e38', 1.2); lin(g, lx - 4, ly - 14, lx + 4, ly - 20, '#2a2e38', 1.2);
      P(g, [lx + 1, ly - 22, lx + 9, ly - 19, lx + 7, ly - 15, lx - 1, ly - 18], '#2a3a5a');
      B(g, lx - 4, ly - 1.4, 8, 1.6, 0.6, '#2a2e38');
    },
    anim: (L) => {
      // tavan ışıkları zamanla teker teker söner (bölümün saatine göre); oda kararır, masa lambası yanık kalır
      const G = L.G, t = G ? G.t : 0;
      const ORDER = [6, 1, 3, 7, 0, 4, 2, 5], off = (i) => t > 10 + ORDER.indexOf(i) * 13;
      let n = 0;
      L.far((g) => {
        for (let i = 0; i < 8; i++) {
          if (!off(i)) continue;
          const x = 14 + i * 64;
          g.fillStyle = 'rgba(60,70,90,0.55)'; g.fillRect(x - 4, 38, 44, 14);
          B(g, x, 38, 36, 4, 1.5, '#9aa0ac');
        }
      });
      for (let i = 0; i < 8; i++) if (off(i)) n++;
      const k = n / 8;
      if (k > 0) {
        // ışıklar söndükçe oda akşamın rengine kararır (renkler korunur)
        L.screen.save(); L.screen.globalCompositeOperation = 'multiply';
        L.screen.fillStyle = mix('#ffffff', '#4a4470', k * 0.85); L.screen.fillRect(0, 0, L.vw, L.vh); L.screen.restore();
      }
      L.near((g) => {
        const [lx, ly] = DESK_LAMP;
        const gl = g.createRadialGradient(lx + 5, ly - 14, 0, lx + 5, ly - 14, 34);
        gl.addColorStop(0, `rgba(255,214,140,${0.45 + 0.3 * k})`); gl.addColorStop(1, 'rgba(255,214,140,0)');
        g.fillStyle = gl; g.fillRect(lx - 30, ly - 50, 70, 70);
        g.fillStyle = `rgba(255,226,160,${0.25 + 0.25 * k})`; P(g, [lx + 1, ly - 17, lx + 7, ly - 15, lx + 18, ly, lx - 8, ly], g.fillStyle);
      });
    },
  });

  // ================= 4 ÜSKÜDAR (gün batımı) =================
  DR.iskeleAksam = SC.at(DR.iskele, 'gunbatimi', { sky: SC.skyOf('gunbatimi', { sun: [96, 178, 18, '#ffd890'] }), farMul: '#f8cdb4' });
  DR.carsiAksam = SC.at(DR.balikPazari, 'gunbatimi', { sky: SC.skyOf('gunbatimi', { sun: [430, 196, 20, '#ffd890'] }) });
  // 4-3 Sahil: karşı kıyının silüeti, Kız Kulesi (bayraksız) ve geçen vapur; önde çınarlar ve çay bahçesi
  DR.sahil = SC.at(DR.moda, 'gunbatimi', {
    sky: SC.skyOf('gunbatimi', { sun: [150, 172, 18, '#ffd890'] }),
    farMul: '#fbe0d0',
    farPre(g) {
      maidensTower(g, 120, 199, 0.9, { rock: '#3a3060', rockL: '#463a6a', wall: '#6a5a8a', wallD: '#5a4a7a', roof: '#4a3c6c', trim: '#7a6a9a', win: '#ffd88a', lit: '#ffe6a0' });
      ferry(g, 186, 207, 0.42, { hull: '#2a2244', white: '#cfc4e0', win: '#ffd88a', funnel: '#e8c070' });
    },
  });

  // ================= 7 KÖPRÜ (gece) =================
  // 7-1 Ayak: köprü gece; tabliyede ve halatta renkli ışıklar, kıyıda yanan pencereler
  DR.kopruGece = SC.at(DR.kopru, 'gece', {
    farPost(g) {
      g.fillStyle = 'rgba(255,220,170,0.12)'; g.fillRect(16, 146, 480, 9);
      bridge(g, 16, 496, 150, 70, { cable: NONE, hang: NONE, deck: NONE, tower: NONE, towerD: NONE, light: true, leds: ['#ffe28a', '#8af0ff', '#ff9ad8'] });
    },
    nearPost(g) { for (const lx of [40, 250, 480]) { glow(g, lx, 185, 16, 'rgb(255,226,150)', 0.6); C(g, lx, 185, 2, '#fff2c0'); } },
  });
  // 7-2 Halatlar: gece ana halatın üstü; aşağıda Boğaz'ın ışıkları
  DR.halatlarGece = SC.at(DR.halatlar, 'gece', {
    sky: SC.skyOf('gece', { moon: [130, 40, 10] }),
    farPost(g) {
      for (const [fx, fy] of [[230, 196], [290, 214]]) for (let k = -2; k <= 2; k++) { rect(g, fx + k * 2.4, fy - 2.2, 1, 0.8, '#ffe39a'); }
      glow(g, 449, 40, 10, 'rgb(255,60,60)', 0.7); C(g, 449, 40, 1.4, '#ff4a4a'); glow(g, 464, 40, 10, 'rgb(255,60,60)', 0.7); C(g, 464, 40, 1.4, '#ff4a4a');
    },
    nearPost(g) {
      const y = (x) => 96 - Math.pow((x - 256) / 256, 2) * 66;
      const cols = ['#ffe28a', '#8af0ff', '#ff9ad8'];
      for (let x = 8, k = 0; x < W; x += 16, k++) { glow(g, x, y(x), 8, 'rgb(255,240,200)', 0.35); C(g, x, y(x), 1.3, cols[k % 3]); }
    },
  });

  // ================= 8 EYÜP (gece yarısı) =================
  // 8-1 Balat Yokuşu: renkli evler gece yarısı; birkaç pencere yanık, sokak lambaları, aydınlatılmış Eyüp Sultan
  DR.balatGece = SC.at(DR.eyupBalat, 'geceyarisi', {
    farPost(g) { const base = hillsY(150, 44, 721); glow(g, 420, base(420) - 18, 46, 'rgb(255,226,170)', 0.22); },
    nearPost(g) {
      const hy = (x) => 214 - Math.max(0, Math.min(1, x / 420)) * 22;
      for (const lx of [44, 196, 352, 486]) lamp(g, lx, Math.min(214, hy(lx)) + 1, 34);
    },
  });

  // gece yarısı uzak tepe: Haliç'e inen yamaç, servi ağaçları, aşağıda yanan pencereler
  const halicNight = SC.tinted(DR.halicKiyisi.far, SC.LIGHT.geceyarisi.mul, {
    night: { p: 0.3, lit: '#ffd88a' },
    post(g) {
      // metro köprüsünün ışıkları ve suya düşen yansımaları
      for (let x = 152; x < 478; x += 6) { rect(g, x, 176.6, 2, 1, '#fff0c0'); }
      for (const px of [240, 390]) { glow(g, px, 98, 8, 'rgb(255,255,255)', 0.5); C(g, px, 97, 1, '#ffffff'); }
      g.fillStyle = 'rgba(255,220,150,0.18)'; for (let x = 156; x < 476; x += 14) g.fillRect(x, 186, 1.4, 10 + (x % 5));
    },
  });

  // 8-2 Teleferik: Eyüp'ten tepeye çıkan teleferik; yamaçta serviler ve eski mezar taşları, tepede istasyon
  DR.teleferik = {
    sky: SC.skyOf('geceyarisi', { moon: [90, 40, 10] }),
    far: SC.tinted(DR.eyupBalat.far, SC.LIGHT.geceyarisi.mul, {
      night: SC.LIGHT.geceyarisi.night,
      post(g) { const base = hillsY(150, 44, 721); glow(g, 420, base(420) - 18, 46, 'rgb(255,226,170)', 0.22); },
    }),
    near(g) {
      pen('rgba(10,10,30,0.6)', 0.5);
      // yamaç: ortada tepe, iki yana iner (kenarlardan kesintisiz)
      const hy = (x) => 214 - 70 * Math.pow(Math.sin(Math.PI * x / W), 1.6);
      g.beginPath(); g.moveTo(0, 240); for (let x = 0; x <= W; x += 4) g.lineTo(x, hy(x)); g.lineTo(W, 240); g.closePath(); g.fillStyle = '#1e2240'; g.fill();
      g.strokeStyle = '#2c3256'; g.lineWidth = 1; g.beginPath(); for (let x = 0; x <= W; x += 4) g.lineTo(x, hy(x)); g.stroke();
      // eski mezar taşları ve serviler
      const r = rng(821);
      for (let x = 10; x < W; x += 10 + r() * 14) {
        const y = hy(x) + 3 + r() * 14;
        if (y > 214) continue;
        if (r() < 0.45) cypress(g, x, y + 2, 30 + r() * 26, '#121530');
        else { const h = 6 + r() * 5; B(g, x - 1.6, y - h, 3.2, h, 1.4, '#3a3e5a'); }
      }
      // halatlar ve kabinler (tepedeki istasyondan iki yana)
      const ST = [256, hy(256) - 46];
      const cab = (x0, y0, x1, y1, t, col) => {
        const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
        lin(g, x, y, x, y + 6, '#2a2e40', 0.8);
        B(g, x - 6, y + 6, 12, 10, 2.4, col); rect(g, x - 4.6, y + 8, 9.2, 4, '#ffe6a8');
        glow(g, x, y + 10, 12, 'rgb(255,226,160)', 0.35);
      };
      for (const dy of [0, 5]) {
        g.strokeStyle = '#3a3e58'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(0, 150 + dy); g.lineTo(ST[0], ST[1] + dy); g.lineTo(W, 150 + dy); g.stroke();
      }
      cab(0, 150, ST[0], ST[1], 0.35, '#c83a3a'); cab(0, 155, ST[0], ST[1] + 5, 0.72, '#c83a3a');
      cab(W, 150, ST[0], ST[1], 0.55, '#c83a3a');
      // istasyon: cam çatılı küçük yapı
      B(g, ST[0] - 22, ST[1] - 4, 44, 26, 1, '#3a3e58'); P(g, [ST[0] - 26, ST[1] - 4, ST[0] + 26, ST[1] - 4, ST[0], ST[1] - 16], '#2a2e48');
      rect(g, ST[0] - 18, ST[1] + 2, 36, 10, '#ffe0a0'); glow(g, ST[0], ST[1] + 6, 30, 'rgb(255,220,150)', 0.4);
      // yokuştaki merdivenli yol ve fenerler
      for (const lx of [70, 160, 352, 442]) lamp(g, lx, hy(lx) + 4, 22);
    },
  };

  // 8-3 Tepe: gece yarısı, sade; aşağıda Haliç ve köprünün ışıkları. Tepede (oyunda) iki kişilik bank
  DR.tepe = {
    sky: SC.skyOf('geceyarisi', { stars: 150, moon: [380, 40, 12] }),
    far: halicNight,
    near(g) {
      pen('rgba(10,10,30,0.6)', 0.5);
      // yalnız birkaç servi ve bir fener; geri kalanı gökyüzü ve aşağıdaki şehir
      for (const [x, h] of [[24, 70], [40, 52], [300, 64], [470, 84], [488, 60]]) cypress(g, x, 216, h, '#0e1028');
      lamp(g, 140, 214, 40);
    },
  };

  // ================= 9 ŞİLE (gece yarısından sonra) =================
  const sileSky = SC.skyOf('geceyarisindanSonra', { stars: 220, moon: [400, 40, 10] });
  // tepeler ve çam ormanı (şehir ışığı yok)
  function forest(g, seed) {
    const b1 = hillsY(176, 30, seed), b2 = hillsY(196, 18, seed + 1);
    hills(g, b1, '#141a3a');
    const r = rng(seed + 2);
    for (let x = 0; x < W; x += 5 + r() * 5) { const y = b1(x) + 2, s = 0.5 + r() * 0.4; P(g, [x - 6 * s, y + 2, x + 6 * s, y + 2, x, y - 20 * s], '#10142e'); }
    hills(g, b2, '#0c1028');
    for (let x = 0; x < W; x += 4 + r() * 4) { const y = b2(x) + 3, s = 0.7 + r() * 0.5; P(g, [x - 6 * s, y + 2, x + 6 * s, y + 2, x, y - 22 * s], '#090c22'); }
  }
  // yol kenarı: bariyer ve reflektörlü dikmeler
  function guardrail(g, y) {
    for (let x = 6; x < W; x += 32) rect(g, x, y, 2.4, 214 - y, '#5a6070');
    B(g, 0, y, W, 5, 1, '#8a909c'); rect(g, 0, y + 2, W, 0.8, '#5a6070');
    for (let x = 22; x < W; x += 64) { rect(g, x, y - 14, 3, 14 + 214 - y - 5, '#e8e8ec'); rect(g, x, y - 12, 3, 3, '#ff5a3a'); glow(g, x + 1.5, y - 10.5, 4, 'rgb(255,120,80)', 0.4); }
  }
  // 9-1 Gece Yolu: orman kenarında ıssız yol, tek bir sokak lambası, yol tabelası
  DR.sileYol = {
    sky: sileSky,
    far(g) { forest(g, 911); },
    near(g) {
      pen('rgba(0,0,10,0.6)', 0.5);
      const r = rng(912);
      for (let x = 0; x < W; x += 18 + r() * 30) { const s = 1 + r() * 0.8; P(g, [x - 8 * s, 214, x + 8 * s, 214, x, 214 - 40 * s], '#070a1c'); P(g, [x - 6 * s, 214 - 18 * s, x + 6 * s, 214 - 18 * s, x, 214 - 52 * s], '#070a1c'); }
      guardrail(g, 196);
      // yol tabelası: yön oku ve mesafe
      rect(g, 300, 150, 3, 64, '#5a6070'); rect(g, 326, 150, 3, 64, '#5a6070');
      B(g, 290, 132, 50, 26, 2, '#1e6a3a');
      g.strokeStyle = '#ffffff'; g.lineWidth = 0.8; g.strokeRect(292.5, 134.5, 45, 21);
      g.fillStyle = '#ffffff'; g.font = '600 7px Fredoka, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('ŞİLE', 297, 141); g.fillText('24', 297, 150);
      P(g, [324, 141, 332, 141, 332, 138, 336, 143, 332, 148, 332, 145, 324, 145], '#ffffff');
      // tek sokak lambası
      lin(g, 160, 214, 160, 120, '#3a3e4a', 2); lin(g, 160, 120, 176, 116, '#3a3e4a', 1.6); B(g, 172, 114, 10, 4, 1.5, '#4a4e5a');
      glow(g, 177, 119, 50, 'rgb(255,214,140)', 0.35); g.fillStyle = 'rgba(255,214,140,0.12)'; P(g, [173, 119, 181, 119, 214, 214, 140, 214], 'rgba(255,214,140,0.12)');
    },
  };
  // 9-2 Benzin İstasyonu: yol kenarında ıssız istasyon, floresan saçak, tek görevli
  DR.benzin = {
    sky: sileSky,
    far(g) { forest(g, 921); },
    near(g) {
      pen('rgba(0,0,10,0.65)', 0.5);
      // saçak
      for (const px of [130, 300]) rect(g, px - 3, 112, 6, 102, '#c8ccd4');
      B(g, 100, 98, 236, 16, 2, '#e8ecf0'); rect(g, 100, 108, 236, 3, '#2a8a5a');
      g.fillStyle = 'rgba(230,245,255,0.16)'; P(g, [104, 114, 332, 114, 360, 214, 76, 214], 'rgba(230,245,255,0.14)');
      for (let x = 112; x < 330; x += 36) tube(g, x, 114, 22);
      // pompalar
      for (const px of [170, 260]) {
        B(g, px - 20, 206, 40, 8, 1, '#9aa0aa');
        B(g, px - 7, 166, 14, 40, 2, '#f2f2ee'); rect(g, px - 7, 166, 14, 5, '#2a8a5a'); B(g, px - 5, 174, 10, 7, 1, '#1e2430');
        rect(g, px - 4, 176, 3, 2, '#7cff9a'); rect(g, px + 1, 176, 3, 2, '#7cff9a');
        lin(g, px + 7, 186, px + 12, 196, '#2a2e38', 1); B(g, px + 10, 190, 3, 8, 1, '#3a3e48');
      }
      // görevli
      person(g, 214, 214, 30, '#2a6a4a', '#c89a7a');
      // market: aydınlık cam, kapı
      B(g, 360, 140, 120, 74, 1, '#d8dce4'); rect(g, 356, 136, 128, 6, '#2a8a5a');
      B(g, 368, 152, 66, 40, 1, '#fff2c8'); for (let x = 372; x < 430; x += 8) rect(g, x, 160 + (x % 3) * 2, 5, 26, ['#d2302a', '#3a7ad8', '#f4c531'][x % 3]);
      glow(g, 400, 172, 50, 'rgb(255,240,190)', 0.3);
      B(g, 444, 160, 24, 54, 1, '#bfe4f6'); rect(g, 455.4, 160, 1.2, 54, '#7a8494');
      // fiyat direği: tabelasız, yalnız ışıklı rakam panoları
      rect(g, 40, 90, 6, 124, '#5a6070'); B(g, 22, 70, 42, 52, 2, '#1e2430');
      for (let k = 0; k < 3; k++) { B(g, 26, 76 + k * 15, 34, 11, 1, '#0a0e14'); for (let d = 0; d < 4; d++) rect(g, 29 + d * 8, 79 + k * 15, 5, 5, k === 2 ? '#ff9a4a' : '#ff5a3a'); }
      glow(g, 43, 96, 30, 'rgb(255,110,60)', 0.2);
    },
  };
  // 9-3 Fener: fırtınada Şile Feneri; kayalık burun, beyaz sekizgen kule, dönen ışık
  DR.fener = {
    sky: Object.assign({}, DR.kaptan.sky, { noMoon: true }),
    far(g) {
      // uzakta tanker ışıkları ve adacıktaki kale
      B(g, 70, 170, 80, 10, 2, '#0e1424'); B(g, 128, 158, 20, 12, 1, '#0e1424');
      for (const lx of [78, 90, 102, 114]) rect(g, lx, 174, 2, 1, '#ffd88a');
      for (const lx of [131, 136, 141]) rect(g, lx, 161, 2.4, 1.2, '#ffd88a');
      E(g, 250, 186, 40, 8, '#10182a');
      B(g, 228, 162, 44, 22, 1, '#1a2236'); for (let x = 228; x < 272; x += 6) rect(g, x, 158, 4, 5, '#1a2236'); B(g, 260, 150, 12, 14, 1, '#1a2236');
      for (let row = 0; row < 3; row++) {
        const y0 = 176 + row * 16, col = ['#16263e', '#1a2e4a', '#1e3656'][row], amp = 5 + row * 3;
        g.beginPath(); g.moveTo(0, 240); for (let x = 0; x <= W; x += 4) g.lineTo(x, y0 - amp * Math.abs(Math.sin((x + row * 37) / (22 + row * 6)))); g.lineTo(W, 240); g.closePath(); g.fillStyle = col; g.fill();
        g.strokeStyle = 'rgba(220,235,255,0.55)'; g.lineWidth = 1; g.beginPath();
        for (let x = 0; x <= W; x += 4) { const s = Math.abs(Math.sin((x + row * 37) / (22 + row * 6))); if (s > 0.92) { const y = y0 - amp * s; g.moveTo(x - 3, y + 1); g.lineTo(x + 3, y); } }
        g.stroke();
      }
    },
    near(g) {
      pen('rgba(0,0,10,0.7)', 0.6);
      // kayalık burun
      g.beginPath(); g.moveTo(300, 240); g.lineTo(310, 200); g.lineTo(330, 176); g.lineTo(372, 160); g.lineTo(450, 156); g.lineTo(490, 168); g.lineTo(512, 190); g.lineTo(512, 240); g.closePath(); g.fillStyle = '#1a1e2c'; g.fill();
      g.fillStyle = '#242a3c'; P(g, [330, 176, 372, 160, 400, 172, 360, 196], '#242a3c'); P(g, [450, 156, 490, 168, 470, 190, 440, 176], '#242a3c');
      // bekçi evi
      B(g, 432, 134, 40, 24, 1, '#d8d4c8'); P(g, [428, 134, 476, 134, 452, 122], '#8a3a2a'); rect(g, 440, 142, 8, 8, '#ffd88a'); glow(g, 444, 146, 12, 'rgb(255,214,140)', 0.4);
      // fener kulesi: beyaz sekizgen gövde, siyah fener odası
      const fx = 400, fb = 166, top = 70;
      P(g, [fx - 13, fb, fx + 13, fb, fx + 9, top, fx - 9, top], '#eeeae0');
      g.fillStyle = 'rgba(160,160,170,0.35)'; P(g, [fx + 3, fb, fx + 13, fb, fx + 9, top, fx + 2, top], 'rgba(150,150,165,0.3)');
      for (const y of [100, 132]) archWin(g, fx - 2, y, 4, 7, '#3a3a48');
      B(g, fx - 14, top - 4, 28, 4, 1, '#2a2a32');
      rect(g, fx - 8, top - 18, 16, 14, '#ffeeb0'); for (const dx of [-8, -2.6, 2.6, 8]) rect(g, fx + dx - 0.6, top - 18, 1.2, 14, '#2a2a32');
      P(g, [fx - 10, top - 18, fx + 10, top - 18, fx, top - 28], '#2a2a32'); lin(g, fx, top - 28, fx, top - 33, '#2a2a32', 0.8);
      glow(g, fx, top - 11, 26, 'rgb(255,240,170)', 0.8);
      // can simidi ve önde yağmur
      g.lineWidth = 4; g.strokeStyle = '#ffffff'; g.beginPath(); g.arc(80, 198, 7, 0, TAU); g.stroke();
      g.strokeStyle = '#d2302a'; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(80, 198, 7, k * Math.PI / 2, k * Math.PI / 2 + 0.6); g.stroke(); }
      rect(g, 78.6, 191, 2.8, 23, '#5a6070');
      rain(g, W, 240, 140, 931, 0.3);
    },
    // fenerin dönen ışığı
    anim: (L) => {
      L.near((g) => {
        const fx = 400, fy = 59, a = (L.t * 0.9) % TAU, len = 320, side = Math.cos(a), sp = 0.12;
        if (Math.abs(side) < 0.08) return;
        const dir = side > 0 ? 1 : -1, k = Math.abs(side);
        const gr = g.createLinearGradient(fx, fy, fx + dir * len * k, fy);
        gr.addColorStop(0, `rgba(255,244,190,${0.42 * k})`); gr.addColorStop(1, 'rgba(255,244,190,0)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(fx, fy - 3); g.lineTo(fx + dir * len * k, fy - len * sp * k); g.lineTo(fx + dir * len * k, fy + len * sp * k); g.lineTo(fx, fy + 3); g.closePath(); g.fill();
      });
    },
  };

  // ================= 10 SANAYİ (gece yarısından sonra → şafak öncesi) =================
  // 10-1 İMES: gece vardiyası; yanan floresanlar, yarı açık kepenkler
  DR.imes = SC.at(DR.sanayi, 'geceyarisindanSonra', {
    nearMul: '#8a92c4',
    nearPost(g) {
      for (let i = 0; i < 4; i++) { const x = 2 + i * 128; tube(g, x + 30, 124, 26); tube(g, x + 66, 124, 26); }
      // iki dükkânın kepengi bütünüyle inik
      shutter(g, 2 + 3 * 128 + 12, 132, 96, 82, '#6a6e78');
    },
  });
  // 10-2 DES: gece depo; yüksek raflar, paletler, forklift, tavan lambaları
  function rack(g, x, w, levels, r) {
    const top = 214 - levels * 34;
    for (const ux of [x, x + w - 4]) { rect(g, ux, top, 4, 214 - top, '#2a5ab0'); for (let y = top + 4; y < 214; y += 6) rect(g, ux + 1.4, y, 1.2, 1.2, '#1a3a7a'); }
    for (let l = 0; l <= levels; l++) {
      const y = 214 - l * 34;
      if (l > 0) rect(g, x, y, w, 4, '#e8702a');
      if (l === levels) continue;
      // palet ve koliler
      for (let bx = x + 6; bx < x + w - 24; bx += 28) {
        if (r() < 0.15) continue;
        rect(g, bx, y - 4, 24, 3, '#a8784a');
        const h = 12 + Math.floor(r() * 3) * 6;
        B(g, bx + 1, y - 4 - h, 22, h, 1, r() < 0.6 ? '#c8a070' : '#d8d8dc');
        if (h > 18) rect(g, bx + 1, y - 4 - h / 2, 22, 0.8, 'rgba(90,60,30,0.4)');
        if (r() < 0.3) rect(g, bx + 8, y - 4 - h + 4, 8, 5, '#f4f4f0');
      }
    }
  }
  function forklift(g, x, by, s, dir) {
    const d = dir || 1;
    for (const wx of [x + 6 * s, x + 26 * s]) C(g, wx, by - 5 * s, 5 * s, '#1a1a20');
    B(g, x, by - 20 * s, 32 * s, 14 * s, 3 * s, '#f4c531'); B(g, x + 4 * s, by - 32 * s, 16 * s, 12 * s, 2 * s, 'rgba(200,230,255,0.25)');
    lin(g, x + 4 * s, by - 34 * s, x + 4 * s, by - 20 * s, '#2a2a30', 1.4 * s); lin(g, x + 20 * s, by - 34 * s, x + 20 * s, by - 20 * s, '#2a2a30', 1.4 * s);
    rect(g, x + 2 * s, by - 35 * s, 20 * s, 2 * s, '#2a2a30');
    const mx = d > 0 ? x + 34 * s : x - 4 * s;
    rect(g, mx, by - 44 * s, 3 * s, 44 * s, '#3a3a44'); rect(g, d > 0 ? mx : mx - 13 * s, by - 3 * s, 16 * s, 2 * s, '#3a3a44');
    C(g, x + 12 * s, by - 37 * s, 1.4 * s, '#ff9a3a');
  }
  DR.des = {
    sky: { stops: [[0, '#0a0c16'], [1, '#141824']], noMoon: true },
    far: SC.tinted((g) => {
      // oluklu sac duvar, yüksek pencereler (dışarısı gece), çatı makasları ve sarkan lambalar
      rect(g, 0, 0, W, 240, '#3a3e4a');
      for (let x = 0; x < W; x += 4) rect(g, x, 0, 1.4, 240, 'rgba(0,0,0,0.12)');
      for (let x = 20; x < W; x += 64) { B(g, x, 52, 40, 16, 1, '#141a30'); rect(g, x + 19, 52, 1.2, 16, '#3a3e4a'); }
      rect(g, 0, 0, W, 34, '#2a2e38');
      g.strokeStyle = '#4a4e5a'; g.lineWidth = 1.2; g.beginPath();
      for (let x = 0; x < W; x += 32) { g.moveTo(x, 34); g.lineTo(x + 16, 20); g.lineTo(x + 32, 34); }
      g.stroke(); rect(g, 0, 33, W, 2, '#4a4e5a');
      for (let x = 32; x < W; x += 128) { lin(g, x, 35, x, 70, '#2a2e38', 0.6); P(g, [x - 8, 76, x + 8, 76, x + 4, 70, x - 4, 70], '#5a5e68'); glow(g, x, 80, 60, 'rgb(255,236,190)', 0.3); }
    }, '#9aa0c0'),
    near: SC.tinted((g) => {
      pen('rgba(0,0,10,0.6)', 0.5);
      const r = rng(1022);
      rack(g, 0, 176, 4, r); rack(g, 250, 176, 4, r);
      forklift(g, 196, 214, 1.1, 1);
      // streçli palet yığını ve konilerle ayrılmış koridor
      for (const [x, h] of [[440, 30], [470, 22]]) { rect(g, x, 210, 26, 4, '#a8784a'); B(g, x + 1, 210 - h, 24, h, 2, 'rgba(220,230,240,0.85)'); rect(g, x + 1, 206 - h / 2, 24, 0.8, 'rgba(160,170,190,0.6)'); }
      for (const cx of [430, 500]) P(g, [cx - 4, 214, cx + 4, 214, cx + 1, 202, cx - 1, 202], '#ff7a2a');
    }, '#9aa0c0'),
  };
  // dolaşık kablolar ve hortumlar (Spagetti Kod arenası): direkler arasında sarkan, birbirine sarılan
  function tangle(g, seed) {
    const r = rng(seed);
    const cols = ['#141418', '#1e1e24', '#2a2a32', '#18181e', '#3a3a44', '#8a2a24', '#2a3a5a'];
    for (let x = 0; x < W; x += 128) { rect(g, x + 58, 30, 4, 90, '#2a2028'); rect(g, x + 50, 34, 20, 3, '#2a2028'); }
    for (let i = 0; i < 26; i++) {
      const x0 = 60 + Math.floor(r() * 4) * 128, x1 = x0 + 128, y0 = 36 + r() * 30, sag = 10 + r() * 50;
      g.strokeStyle = cols[Math.floor(r() * cols.length)]; g.lineWidth = 0.6 + r() * 1.4;
      g.beginPath(); g.moveTo(x0, y0);
      g.bezierCurveTo(x0 + 30 + r() * 30, y0 + sag + r() * 20, x1 - 60 - r() * 30, y0 + sag - r() * 30, x1, 36 + r() * 30); g.stroke();
      if (x1 > W) { g.beginPath(); g.moveTo(x0 - W, y0); g.bezierCurveTo(x0 - W + 30, y0 + sag, x1 - W - 60, y0 + sag, x1 - W, 40); g.stroke(); }
    }
    // düğümler
    for (let k = 0; k < 6; k++) { const x = 30 + r() * 450, y = 60 + r() * 40; C(g, x, y, 3 + r() * 3, '#1a1a20'); }
  }
  // 10-3 Kadosan: şafak öncesi; sanayi sitesinin bir sırası: tornacı, kalıpçı, tek bir dövmeci ve motor sarımcısı.
  // Üstte dolaşık kablolar. Dövmecinin kepengi yarıya kadar inik, içeride ocağın közü.
  DR.kadosan = {
    sky: SC.skyOf('safakOncesi', { moon: [120, 40, 9] }),
    far: SC.tinted(DR.sanayi.far, SC.LIGHT.safakOncesi.mul, { night: SC.LIGHT.safakOncesi.night }),
    near(g) {
      pen('rgba(10,5,0,0.65)', 0.5);
      const shops = [['TORNA', '#2a6ab0'], ['KALIP', '#2a8a8a'], [null, null], ['MOTOR', '#c8902a']];
      for (let i = 0; i < 4; i++) {
        const x = 2 + i * 128, w = 120, [label, col] = shops[i];
        B(g, x, 120, w, 94, 0, '#4a4650'); rect(g, x - 2, 116, w + 4, 6, '#2e2a32');
        if (!label) {
          // tek dövmeci: tabela yerine örs işareti; içeride ocak, örs, asılı aletler
          B(g, x + 44, 102, 32, 14, 2, '#2a2430'); anvil(g, x + 60, 114, 0.4);
          rect(g, x + 12, 132, w - 24, 82, '#2a1e1a');
          g.fillStyle = grad(g, 0, 150, 0, 214, [[0, 'rgba(255,140,60,0.05)'], [1, 'rgba(255,120,40,0.3)']]); g.fillRect(x + 12, 150, w - 24, 64);
          forge(g, x + 20, 214, 30);
          anvil(g, x + 82, 214, 1);
          tools(g, x + 56, 140, 3);
          shutter(g, x + 12, 132, w - 24, 50);
          continue;
        }
        B(g, x + 30, 102, 60, 14, 2, col);
        g.fillStyle = '#ffffff'; g.font = '600 9px Fredoka, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, x + 60, 109.4);
        // içerisi: soğuk floresan, tezgâh ve makineler
        rect(g, x + 12, 132, w - 24, 82, '#1c2028');
        tube(g, x + 42, 138, 32);
        if (label === 'TORNA') {
          B(g, x + 22, 186, 70, 9, 2, '#4a5a6a'); B(g, x + 22, 170, 18, 25, 2, '#3a4a5a');
          C(g, x + 44, 180, 5.4, '#9aa0aa'); rect(g, x + 49, 178.8, 28, 2.6, '#c8ccd4'); B(g, x + 78, 173, 11, 14, 2, '#3a4a5a');
          for (const lx of [x + 26, x + 84]) rect(g, lx, 195, 4, 19, '#2a3440');
        } else if (label === 'KALIP') {
          for (let row = 0; row < 3; row++) for (let c = 0; c < 3 - (row === 2 ? 1 : 0); c++) {
            const bx = x + 22 + c * 22 + row * 5, byy = 214 - (row + 1) * 13;
            B(g, bx, byy, 20, 13, 1, row % 2 ? '#7a8088' : '#8a9098'); for (const [dx, dy] of [[3, 3], [17, 3], [3, 10], [17, 10]]) C(g, bx + dx, byy + dy, 0.9, '#3a3e44');
          }
          lin(g, x + 90, 132, x + 90, 170, '#2a2a30', 0.8); g.strokeStyle = '#2a2a30'; g.lineWidth = 1.4; g.beginPath(); g.arc(x + 90, 172, 3, 0, Math.PI); g.stroke();
        } else {
          for (let k = 0; k < 3; k++) {
            const mx = x + 22 + k * 24;
            B(g, mx, 194, 20, 14, 5, '#3a6a9a'); for (let f = 0; f < 4; f++) rect(g, mx + 4 + f * 4, 195, 1, 12, 'rgba(10,20,40,0.35)');
            rect(g, mx + 20, 199.6, 4, 2.4, '#c8ccd4'); rect(g, mx + 2, 208, 16, 6, '#2a3440');
          }
          C(g, x + 96, 204, 6, '#c87a3a'); C(g, x + 96, 204, 3.2, '#1c2028');
        }
        shutter(g, x + 12, 132, w - 24, i === 0 ? 18 : 26);
      }
      tangle(g, 1031);
    },
  };

  // ================= 12 ÜMRANİYE (şafak → sabah) =================
  // 12-1 Çarşı şafakta: mahalle sokağı, bütün gece süren yolculuğun sonunda ilk ışıkla
  DR.umraniyeSafak = SC.at(DR.umraniyeCarsi, 'safak');

  // 12-3 Çatı: kahramanın apartmanının ve komşu binaların çatıları, sabah güneşi. Su depoları, güneş enerjisi
  // panelleri, çanak antenler, çamaşır ipleri, güvercinlik; yakında Çamlıca Kulesi, aşağıda Ümraniye'nin apartmanları.
  DR.cati = {
    sky: SC.skyOf('sabah', { clouds: [[300, 40, 1, 'rgba(255,255,255,0.85)'], [60, 58, 0.8, 'rgba(255,255,255,0.75)']] }),
    far(g) {
      pen(null);
      const r = rng(1201);
      // uzakta yeni iş kuleleri, pus içinde
      for (const [x, w, h] of [[30, 22, 70], [58, 16, 52], [196, 20, 84], [222, 14, 60], [470, 18, 66]]) {
        B(g, x, 178 - h, w, h, 1, '#bcd0e2'); for (let y = 178 - h + 4; y < 178; y += 6) rect(g, x + 2, y, w - 4, 1, 'rgba(255,255,255,0.4)');
      }
      // Çamlıca tepesi: yamaçta fıstık çamları, tepede kule (Ümraniye'nin hemen yanı)
      const hy = (x) => 190 - 56 * Math.pow(Math.sin(Math.PI * Math.max(0, Math.min(1, (x - 290) / 222))), 1.2);
      g.fillStyle = '#a4bcb6'; g.beginPath(); g.moveTo(290, 240); for (let x = 290; x <= W; x += 4) g.lineTo(x, hy(x)); g.lineTo(W, 240); g.closePath(); g.fill();
      camlicaTower(g, 401, hy(401) + 4, 0.56, { wall: '#c8d0dc', wallD: '#b2bac8', glass: '#8ab4dc', band: '#d4e6f4' });
      for (let x = 300; x < W - 6; x += 9 + r() * 10) { if (Math.abs(x - 401) < 12) continue; fistikCami(g, x, hy(x) + 3, 0.42 + r() * 0.2, { crown: '#86a29c', crownL: '#96b2aa', bark: '#86a29c' }); }
      // apartman denizi: arkada puslu, önde sıcak sabah renkleri; çatılarda çanak anten ve su deposu
      const cols = ['#e6d8c6', '#dccbb8', '#eadfd0', '#d6cab8', '#e8d4c4'];
      for (const row of [0, 1]) {
        const base = row ? 214 : 200, sc = row ? 1 : 0.78, haze = row ? 0.12 : 0.42;
        for (let x = -8 + row * 9; x < W; x += (20 + r() * 12) * sc) {
          const w = (16 + r() * 12) * sc, h = (24 + r() * 30) * sc, col = mix(cols[Math.floor(r() * cols.length)], '#c8d8e8', haze);
          B(g, x, base - h, w, h, 0, col); rect(g, x - 1, base - h, w + 2, 2, mix(col, '#7a6a5a', 0.3));
          for (let y = base - h + 5 * sc; y < base - 4; y += 7 * sc) for (let wx = x + 3 * sc; wx < x + w - 4 * sc; wx += 5 * sc) rect(g, wx, y, 2.4 * sc, 3 * sc, mix('#6a7a92', col, row ? 0.3 : 0.55));
          if (r() < 0.5) { g.fillStyle = mix('#eef0f2', col, 0.3); g.beginPath(); g.ellipse(x + w * 0.7, base - h - 2.6 * sc, 2.4 * sc, 2.8 * sc, -0.5, 0, TAU); g.fill(); }
          if (r() < 0.35) B(g, x + w * 0.2, base - h - 5 * sc, 6 * sc, 5 * sc, 1, mix('#f2f4f6', col, 0.3));
        }
      }
    },
    near(g) {
      pen('rgba(40,40,50,0.6)', 0.5);
      // arkadaki alçak çatı duvarı
      B(g, 0, 203, W, 11, 0, '#c8bfb0'); rect(g, 0, 203, W, 2, '#e2dacc');
      for (let x = 8; x < W; x += 16) rect(g, x, 205, 0.6, 9, 'rgba(80,70,60,0.3)');
      // su deposu: ayaklı beyaz silindir
      for (const tx of [40, 300]) {
        for (const lx of [tx - 9, tx + 7]) rect(g, lx, 186, 2, 18, '#7a808a');
        rect(g, tx - 10, 192, 20, 1.2, '#7a808a');
        B(g, tx - 13, 168, 26, 18, 6, '#f2f4f6'); rect(g, tx - 13, 174, 26, 1, 'rgba(120,130,140,0.4)'); rect(g, tx - 13, 180, 26, 1, 'rgba(120,130,140,0.4)');
        g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(tx - 9, 170, 3, 14);
      }
      // güneş enerjisi paneli ve deposu
      const sx = 104;
      P(g, [sx - 22, 203, sx + 18, 203, sx + 26, 180, sx - 14, 180], '#2a4a7a');
      g.strokeStyle = 'rgba(160,200,240,0.5)'; g.lineWidth = 0.5; g.beginPath();
      for (let k = 1; k < 4; k++) { const f = k / 4; g.moveTo(sx - 22 + 40 * f, 203); g.lineTo(sx - 14 + 40 * f, 180); }
      g.moveTo(sx - 18, 191.5); g.lineTo(sx + 22, 191.5); g.stroke();
      B(g, sx - 16, 170, 44, 9, 4.5, '#e8ecf0'); rect(g, sx - 14, 179, 2, 3, '#7a808a'); rect(g, sx + 24, 179, 2, 3, '#7a808a');
      // çanak antenler
      for (const [dx, h] of [[178, 26], [356, 20]]) {
        rect(g, dx, 203 - h, 1.6, h, '#7a808a');
        E(g, dx + 2, 203 - h - 4, 6, 7, '#e8ecf0', -0.5); lin(g, dx + 2, 203 - h - 4, dx + 8, 203 - h - 6, '#7a808a', 0.8); C(g, dx + 8.6, 203 - h - 6.2, 1, '#5a6070');
      }
      // eski TV anteni
      lin(g, 236, 203, 236, 150, '#5a6070', 1.2);
      for (const [y, w2] of [[156, 18], [162, 14], [168, 11], [174, 8]]) lin(g, 236 - w2 / 2, y, 236 + w2 / 2, y, '#5a6070', 0.8);
      // baca ve kombinin sabah buharı
      B(g, 262, 178, 12, 25, 1, '#b8664a'); rect(g, 260, 176, 16, 3, '#8a4a34');
      SC.pen(null); for (let k = 0; k < 4; k++) C(g, 268 + k * 4, 170 - k * 7, 3 + k * 1.4, `rgba(240,240,244,${0.55 - k * 0.11})`); pen('rgba(40,40,50,0.6)', 0.5);
      // çamaşır ipi ve çamaşırlar
      for (const px of [392, 458]) rect(g, px, 168, 1.6, 35, '#7a808a');
      g.strokeStyle = '#5a6070'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(393, 170); g.quadraticCurveTo(425, 176, 459, 170); g.stroke();
      for (const [cx2, w2, h2, col] of [[398, 9, 12, '#3a7ad8'], [409, 12, 16, '#f2f2ee'], [423, 8, 10, '#e2483a'], [433, 10, 13, '#f4c531'], [445, 9, 11, '#3aa86a']]) {
        const cy2 = 170 + Math.sin((cx2 - 393) / 66 * Math.PI) * 5; B(g, cx2, cy2, w2, h2, 1, col);
      }
      // güvercinlik: ahşap kutu, kemerli delikler; üstünde güvercinler
      B(g, 474, 180, 34, 23, 1, '#9a6a44'); P(g, [471, 180, 511, 180, 491, 171], '#7a4e30');
      for (const hx of [480, 491, 502]) archWin(g, hx - 3, 186, 6, 8, '#2a1e16');
      for (const [px, py, d] of [[482, 172, 1], [497, 170, -1], [505, 176, 1]]) {
        E(g, px, py, 3.4, 2.2, '#8a92a0'); C(g, px + d * 3, py - 2, 1.5, '#7a8290'); P(g, [px + d * 4.4, py - 2.2, px + d * 5.8, py - 1.8, px + d * 4.4, py - 1.4], '#d89a3a');
      }
    },
  };
})(window);
