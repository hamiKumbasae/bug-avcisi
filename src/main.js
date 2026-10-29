// Bug Avcısı: İstanbul — oyun kabuğu: çizim, kamera, HUD, menüler, giriş, ses.
(function () {
  'use strict';
  const BA = window.BA, ART = window.BA_ART, SC = window.BA_SCENE, AU = window.BA_AUDIO, ST = window.BA_STORY, RD = window.BA_RIDE, HD = window.BA_HAND;
  const LEVELS = window.BA_LEVELS, WORLDS = window.BA_WORLDS;
  const canvas = document.getElementById('oyun');
  const ctx = canvas.getContext('2d');
  const VW = 256, VH = 240, TS = 16, TOP = 16;
  const params = new URLSearchParams(location.search);
  if (params.has('tv')) document.body.classList.add('tv');

  // ---------- çözünürlük ----------
  // Oyun mantığı 256×240 birimlik bir dünyada çalışır; kanvas ise ekranın gerçek piksel sayısında çizilir.
  // S: bir mantıksal birimin kaç cihaz pikseli olduğu. Böylece her şey her ekranda keskin ve pürüzsüz görünür.
  let S = 3;
  function fit() {
    const r = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    // S, 1/16'lık adımlara yuvarlanır: böylece bir karo tam sayı piksel olur, karolar ve
    // önbellekli katmanlar yeniden örneklenmeden 1:1 kopyalanır (hem keskin hem hızlı).
    const ideal = Math.max(1, Math.min(4, ((r.width || VW * 3) * dpr) / VW));
    const s = Math.max(1, Math.floor(ideal * 16) / 16);
    const w = Math.round(VW * s), h = Math.round(VH * s);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    S = s;
    ART.setScale(S);
  }
  fit();
  addEventListener('resize', fit);
  if (window.ResizeObserver) new ResizeObserver(fit).observe(canvas);

  // ---------- kayıt ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* yok */ } },
  };

  // ---------- yazı ----------
  // Fredoka: yuvarlak hatlı, Türkçe harflerin hepsi düzgün (OFL lisanslı).
  const FONT = 'Fredoka, "Trebuchet MS", system-ui, sans-serif';
  if (window.FontFace && document.fonts) {
    const loads = [];
    for (const wt of [500, 600]) for (const [file, range] of [
      ['latin', 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215'],
      ['latin-ext', 'U+0100-0130, U+0132-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF'],
    ]) {
      loads.push(new FontFace('Fredoka', `url(src/fonts/fredoka-${file}-${wt}-normal.woff2)`, { weight: String(wt), unicodeRange: range })
        .load().then((f) => document.fonts.add(f)).catch(() => { /* sistem yazı tipine düşer */ }));
    }
    // yazı tipi gelince yazı içeren önbellekli çizimleri yenile
    Promise.all(loads).then(() => ART.clearAll());
  }
  // y: yazının üst kenarı; size: göz yüksekliği (eski 8'lik ölçüyle uyumlu)
  function text(s, x, y, col = '#fff8ec', size = 8, align = 'left', shadow = '#1a1430', weight = 600) {
    s = String(s);
    const px = size * 1.32;
    ctx.font = `${weight} ${px}px ${FONT}`;
    ctx.textAlign = align; ctx.textBaseline = 'middle';
    const yy = y + size * 0.5;
    if (shadow) { ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(1.6, px * 0.24); ctx.strokeStyle = shadow; ctx.strokeText(s, x, yy); }
    ctx.fillStyle = col; ctx.fillText(s, x, yy);
  }
  function textW(s, size = 8, weight = 600) { ctx.font = `${weight} ${size * 1.32}px ${FONT}`; return ctx.measureText(String(s)).width; }
  const up = (s) => s.toLocaleUpperCase('tr-TR');

  // ---------- giriş ----------
  const keys = new Set();
  const touch = { left: false, right: false, down: false, jump: false, run: false };
  const remote = { left: false, right: false, down: false, jump: false, run: false };
  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowDown: 'down', KeyS: 'down',
    KeyZ: 'jump', Space: 'jump', ArrowUp: 'jump', KeyW: 'jump', KeyK_: null,
    KeyX: 'run', ShiftLeft: 'run', ShiftRight: 'run', KeyC: 'run',
  };
  let pad = { left: false, right: false, down: false, jump: false, run: false, start: false, up: false };
  let padPrev = {};
  function readPad() {
    const gps = navigator.getGamepads ? navigator.getGamepads() : [];
    const n = { left: false, right: false, down: false, jump: false, run: false, start: false, up: false };
    for (const gp of gps) {
      if (!gp) continue;
      const b = (i) => gp.buttons[i] && gp.buttons[i].pressed;
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      n.left = n.left || ax < -0.4 || b(14); n.right = n.right || ax > 0.4 || b(15);
      n.down = n.down || ay > 0.5 || b(13); n.up = n.up || ay < -0.5 || b(12);
      n.jump = n.jump || b(0) || b(1); n.run = n.run || b(2) || b(3) || b(7) || b(5);
      n.start = n.start || b(9);
    }
    padPrev = pad; pad = n;
    // menü için kenar tetikleri
    if (n.up && !padPrev.up) menuKey('up');
    if (n.down && !padPrev.down) menuKey('down');
    if (n.left && !padPrev.left) menuKey('left');
    if (n.right && !padPrev.right) menuKey('right');
    if (n.jump && !padPrev.jump) menuKey('ok');
    if (n.start && !padPrev.start) menuKey('start');
    if (n.run && !padPrev.run && app.screen !== 'play') menuKey('back');
  }
  function inputState() {
    const k = (name) => Object.keys(KEYMAP).some((c) => KEYMAP[c] === name && keys.has(c));
    const o = {};
    for (const n of ['left', 'right', 'down', 'jump', 'run']) o[n] = k(n) || touch[n] || pad[n] || remote[n];
    if (o.left && o.right) { o.left = false; o.right = false; }
    return o;
  }
  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    AU.unlock();
    const c = e.code;
    if (KEYMAP[c] || c === 'Enter' || c === 'Escape' || c === 'KeyP') e.preventDefault();
    if (!e.repeat) {
      if (c === 'ArrowUp' || c === 'KeyW') menuKey('up');
      if (c === 'ArrowDown' || c === 'KeyS') menuKey('down');
      if (c === 'ArrowLeft' || c === 'KeyA') menuKey('left');
      if (c === 'ArrowRight' || c === 'KeyD') menuKey('right');
      if (c === 'Enter' || c === 'Space' || c === 'KeyZ') menuKey('ok');
      if (c === 'Escape') menuKey('back');
      if (c === 'KeyP') menuKey('start');
      if (c === 'KeyM') toggleSound();
      if (c === 'KeyK' && window.__ba.bridge && window.__ba.bridge.open) window.__ba.bridge.open();
      if (c === 'KeyF') fullscreen();
    }
    keys.add(c);
  });
  addEventListener('keyup', (e) => keys.delete(e.code));
  addEventListener('blur', () => { keys.clear(); if (app.screen === 'play') pauseGame(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && app.screen === 'play') pauseGame(); });

  // dokunmatik tuşlar
  for (const [id, name] of [['tusSol', 'left'], ['tusSag', 'right'], ['tusAsagi', 'down'], ['tusZipla', 'jump'], ['tusKos', 'run']]) {
    const el = document.getElementById(id);
    if (!el) continue;
    const on = (e) => {
      e.preventDefault(); AU.unlock();
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* yok */ }
      touch[name] = true; el.classList.add('basili');
      if (name === 'jump') menuKey('ok');
      if (name === 'down') menuKey('down');
      if (name === 'left') menuKey('left');
      if (name === 'right') menuKey('right');
      if (name === 'run' && app.screen === 'select') menuKey('back');
      if (navigator.vibrate) navigator.vibrate(8);
    };
    const off = (e) => { e.preventDefault(); touch[name] = false; el.classList.remove('basili'); };
    el.addEventListener('pointerdown', on);
    el.addEventListener('pointerup', off);
    el.addEventListener('pointercancel', off);
    el.addEventListener('lostpointercapture', off);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  // kanvasa dokunarak menü seçimi
  canvas.addEventListener('pointerdown', (e) => {
    AU.unlock();
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * VW, y = (e.clientY - r.top) / r.height * VH;
    if (app.menuItems && app.menuItems.length) {
      for (let i = 0; i < app.menuItems.length; i++) {
        const it = app.menuItems[i];
        if (y >= it.y - 4 && y < it.y + 12) { app.menu = i; menuKey('ok'); return; }
      }
    }
    if (app.screen === 'select') { selectTap(x, y); return; }
    if (app.screen === 'story') { menuKey('ok'); return; }
    if (app.screen === 'play' && y < TOP + 8) pauseGame();
    else if (app.screen === 'help' || app.screen === 'end') menuKey('ok');
  });
  document.getElementById('duraklat').addEventListener('click', () => { if (app.screen === 'play') pauseGame(); else if (app.screen === 'pause') resume(); });
  document.getElementById('ses').addEventListener('click', toggleSound);
  document.getElementById('tamEkran').addEventListener('click', fullscreen);
  function toggleSound() { AU.setMuted(!AU.muted); document.getElementById('ses').textContent = AU.muted ? 'Ses: kapalı' : 'Ses: açık'; }
  document.getElementById('ses').textContent = AU.muted ? 'Ses: kapalı' : 'Ses: açık';
  function fullscreen() {
    const el = document.documentElement;
    if (document.fullscreenElement) document.exitFullscreen && document.exitFullscreen();
    else if (el.requestFullscreen) el.requestFullscreen().then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* yok */ } }).catch(() => {});
  }

  // ---------- uygulama durumu ----------
  const NW = WORLDS.length, NL = LEVELS.length;
  // her dünyadan sonra gösterilecek ara sahne (v2.0 sırası); son dünyadan sonra 'son'
  const STORY_AFTER = ['ara1', 'ara4', 'ara8', 'ara2', 'atasehir', 'ara5', 'ara7', 'eyup', 'sile', 'sanayi', 'eve'];
  // v2.0 (kayıt sürümü 4): dünya sırası ve hatıra parçaları değişti; ilerleme ve parçalar sıfırlanır, rekor kalır
  if (store.get('ba-kayit-surum', 1) < 4) {
    store.set('ba-ilerleme', 1); store.set('ba-parcalar', new Array(NW).fill(false)); store.set('ba-kayit-surum', 4);
  }
  const app = {
    screen: 'title', menu: 0, menuItems: [], t: 0, S: null, G: null, introT: 0, overT: 0, endT: 0,
    progress: store.get('ba-ilerleme', 1), best: store.get('ba-rekor', 0), titleT: 0, selW: 0, selS: 0,
    pieces: store.get('ba-parcalar', new Array(NW).fill(false)),
    golds: store.get('ba-altin', {}),   // el yapımı bölümlerin altın simitleri: {bölüm: üç bitlik maske}
  };
  window.__ba = { app, BA, start: (stage) => startRun(stage || 0), render: () => render(), story: (id, then) => playStory(id, then || toTitle) };

  function startRun(stage, prologue) {
    acc = 0;   // yeni koşu: birikmiş adım süresi sıfırlanır (kayıtların tekrarı belirlenimci kalsın)
    app.S = BA.newRun();
    app.S.stage = stage;
    if (prologue && ST.has('giris')) playStory('giris', toIntro); else toIntro();
  }
  // yazısız hikâye sahnesi; bitince ya da atlanınca then() çağrılır
  function playStory(id, then) {
    app.screen = 'story'; app.story = { id, t: 0, then };
    const sc = ST.SCENES[id];
    AU.stopMusic();
    if (sc.music) AU.playMusic(sc.music);
    if (sc.amb) AU.ambient(sc.amb, 1);
  }
  function finishStory() {
    if (!app.story) return;
    const f = app.story.then;
    app.story = null;
    AU.stopAmbient(0.6); AU.stopMusic();
    f();
  }
  function toIntro(quick) {
    app.screen = 'intro'; app.introT = 0; app.G = null; app.introQuick = !!quick;   // ölünce kısa ara
    AU.stopMusic();
  }
  function beginStage() {
    app.G = BA.loadStage(app.S, app.S.stage);
    // gökyüzündeki ay: bugünün tarihinde, bölümün sahne saatinde İstanbul'dan görünen ay (iç mekânda yok)
    const L = app.G.L;
    app.G.moon = L.ic || !window.BA_MOON ? null : window.BA_MOON.forScene(L.saat || 'gece', new Date(), L.gun);
    app.screen = 'play';
    AU.setRate(1);
    if (L.quiet) AU.stopMusic(); else AU.playMusic(AU.WORLD_SONG[app.G.world]);   // Eyüp'ün tepesinde müzik yok
    AU.ambient(AU.placeAmb(app.G.L), 0.45);
  }
  function pauseGame() { if (app.screen !== 'play') return; app.screen = 'pause'; app.menu = 0; AU.sfx('pause'); AU.stopMusic(); AU.stopAmbient(0.3); }
  function resume() {
    app.screen = 'play';
    const G = app.G;
    if (G.quiet) AU.stopMusic(); else AU.playMusic(G.boss && !G.boss.dead ? 'boss' : AU.WORLD_SONG[G.world]);
    AU.ambient(AU.placeAmb(G.L), 0.45);
    AU.setRate(G.hurry ? 1.25 : 1);
  }
  function saveScore() {
    if (app.S && app.S.score > app.best) { app.best = app.S.score; store.set('ba-rekor', app.best); }
  }
  function toTitle() { saveScore(); app.screen = 'title'; app.menu = 0; app.G = null; AU.stopAmbient(); AU.playMusic('title'); }

  function titleItems() {
    const items = [{ label: 'OYNA', act: () => startRun(0, true) }];
    if (app.progress > 1) items.push({ label: `DEVAM: DÜNYA ${app.progress}`, act: () => startRun((app.progress - 1) * 3) });
    items.push({ label: 'BÖLÜM SEÇ', act: () => { app.screen = 'select'; app.selW = Math.min(NW - 1, app.progress - 1); app.selS = 0; } });
    items.push({ label: 'NASIL OYNANIR', act: () => { app.screen = 'help'; } });
    if (window.__ba.bridge && window.__ba.bridge.open) items.push({ label: 'TELEFONLA OYNA', act: () => window.__ba.bridge.open() });
    return items;
  }
  function menuKey(k) {
    const s = app.screen;
    if (s === 'title') {
      const items = titleItems();
      if (k === 'up') { app.menu = (app.menu + items.length - 1) % items.length; AU.sfx('move'); }
      if (k === 'down') { app.menu = (app.menu + 1) % items.length; AU.sfx('move'); }
      if (k === 'ok' || k === 'start') { AU.unlock(); AU.sfx('select'); items[Math.min(app.menu, items.length - 1)].act(); }
    } else if (s === 'help') {
      if (k === 'ok' || k === 'back' || k === 'start') { app.screen = 'title'; AU.sfx('select'); }
    } else if (s === 'select') {
      if (k === 'up') { app.selW = (app.selW + NW - 1) % NW; AU.sfx('move'); }
      if (k === 'down') { app.selW = (app.selW + 1) % NW; AU.sfx('move'); }
      if (k === 'left') { app.selS = (app.selS + 2) % 3; AU.sfx('move'); }
      if (k === 'right') { app.selS = (app.selS + 1) % 3; AU.sfx('move'); }
      if (k === 'ok' || k === 'start') { AU.sfx('select'); startRun(app.selW * 3 + app.selS); }
      if (k === 'back') { app.screen = 'title'; AU.sfx('select'); }
    } else if (s === 'play') {
      if (k === 'start' || k === 'back') pauseGame();
    } else if (s === 'pause') {
      const items = ['DEVAM', 'BÖLÜMÜ BAŞTAN AL', 'ANA MENÜ'];
      if (k === 'up') { app.menu = (app.menu + items.length - 1) % items.length; AU.sfx('move'); }
      if (k === 'down') { app.menu = (app.menu + 1) % items.length; AU.sfx('move'); }
      if (k === 'start' || k === 'back') resume();
      if (k === 'ok') {
        AU.sfx('select');
        if (app.menu === 0) resume();
        else if (app.menu === 1) { app.S.checkpoint = null; app.S.power = 0; toIntro(); }
        else toTitle();
      }
    } else if (s === 'over') {
      if (app.overT < 1.2) return;
      const items = ['DEVAM ET', 'ANA MENÜ'];
      if (k === 'up' || k === 'down') { app.menu = 1 - app.menu; AU.sfx('move'); }
      if (k === 'ok' || k === 'start') {
        AU.sfx('select');
        if (app.menu === 0) { const st = Math.floor(app.S.stage / 3) * 3; saveScore(); startRun(st); }
        else toTitle();
        void items;
      }
    } else if (s === 'end') {
      if (app.endT > 3 && (k === 'ok' || k === 'start' || k === 'back')) toTitle();
    } else if (s === 'intro') {
      if ((k === 'ok' || k === 'start') && app.introT > 0.4) beginStage();
    } else if (s === 'story') {
      if ((k === 'ok' || k === 'start' || k === 'back') && app.story && app.story.t > 0.6) finishStory();
    }
  }

  // ---------- olaylar → ses ----------
  const BUZZ = { die: 220, shrink: 90, power: 40, bosshit: 35, oneup: 60, clear: 80, piece: 140 };
  function handleEvents(G) {
    for (const e of G.ev) {
      if (BUZZ[e.e] && window.__baRemote && window.__baRemote.count()) window.__baRemote.vibrate(BUZZ[e.e]);
      switch (e.e) {
        case 'bossintro': AU.sfx('bossintro'); AU.playMusic('boss'); break;
        case 'bossdown': AU.sfx('bossdown'); AU.stopMusic(); break;
        case 'hurry': AU.sfx('hurry'); AU.setRate(1.25); break;
        case 'starend': break;
        case 'train': case 'trainstop': AU.sfx(e.e, G.L.ride && G.L.ride.type); break;
        case 'piece': AU.sfx('piece'); app.pieces[e.world] = true; store.set('ba-parcalar', app.pieces); break;
        case 'gold': AU.sfx('gold'); app.golds[e.idx] = (app.golds[e.idx] || 0) | (1 << e.k); store.set('ba-altin', app.golds); break;
        default: AU.sfx(e.e);
      }
    }
  }

  // ---------- döngü ----------
  const DT = 1 / 120;
  let acc = 0, lastT = performance.now();
  function frame(now) {
    let dt = Math.max(0, (now - lastT) / 1000); lastT = now;
    if (dt > 0.1) dt = 0.1;
    app.t += dt;
    readPad();
    if (!app.freeze) update(dt);
    render();
    requestAnimationFrame(frame);
  }
  function update(dt) {
    if (app.screen === 'intro') {
      app.introT += dt;
      if (app.introT > (app.introQuick ? 1.2 : 2.6)) beginStage();
    } else if (app.screen === 'play') {
      acc += dt;
      let n = 0;
      const inp = inputState();
      while (acc >= DT && n < 12) {
        BA.step(app.G, inp, DT);
        handleEvents(app.G);
        acc -= DT; n++;
        if (app.G.result) break;
      }
      if (n >= 12) acc = 0;
      const G = app.G;
      if (G.result === 'dead') {
        AU.stopAmbient(0.4);
        if (BA.afterDeath(app.S)) toIntro(true);
        else { app.screen = 'over'; app.overT = 0; app.menu = 0; AU.sfx('over'); saveScore(); }
      } else if (G.result === 'clear') {
        BA.afterClear(app.S);
        const w = Math.min(NW, Math.floor(app.S.stage / 3) + 1);
        if (w > app.progress && app.S.stage < NL) { app.progress = w; store.set('ba-ilerleme', w); }
        AU.stopAmbient(0.6);
        const after = STORY_AFTER[app.S.stage / 3 - 1];
        if (app.S.stage >= NL) {
          saveScore();
          const toEnd = () => { app.screen = 'end'; app.endT = 0; AU.sfx('win'); setTimeout(() => { if (app.screen === 'end') AU.playMusic('son'); }, 1600); };
          if (ST.has('son')) playStory('son', toEnd); else toEnd();
        } else if (app.S.stage % 3 === 0 && after && ST.has(after)) playStory(after, toIntro);
        else toIntro();
      }
    } else if (app.screen === 'story') {
      const sc = ST.SCENES[app.story.id], t0 = app.story.t;
      app.story.t += dt;
      for (const [ct, kind] of sc.cues || []) if (t0 < ct && app.story.t >= ct) AU.ambEvent(kind);
      if (app.story.t >= sc.dur) finishStory();
    } else if (app.screen === 'over') app.overT += dt;
    else if (app.screen === 'end') app.endT += dt;
    else if (app.screen === 'title') app.titleT += dt;
  }

  // ---------- çizim ----------
  const shade = ART.shade;
  function img(c, x, y) { ctx.drawImage(c, x, y, c.lw, c.lh); }
  // tam ekran önbellekli görüntü: cihaz pikseline 1:1
  function full(c) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(c, 0, 0); ctx.setTransform(S, 0, 0, S, 0, 0); }
  function panel(x, y, w, h, r = 6, fill = 'rgba(22,18,48,0.72)', stroke = 'rgba(255,255,255,0.16)') {
    ART.rr(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 0.8; ctx.stroke(); }
  }
  // tekrarlanan arka plan katmanı: kopyalar cihaz pikseline oturur, ek yeri görünmez
  function layerDraw(c, off, dy) {
    const Wd = Math.round(c.lw * S), Hd = Math.round(c.lh * S), Y = Math.round((dy || 0) * S);
    let X = -Math.round((((off % c.lw) + c.lw) % c.lw) * S);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (; X < canvas.width; X += Wd) ctx.drawImage(c, X, Y, Wd, Hd);
    ctx.setTransform(S, 0, 0, S, 0, 0);
  }
  // katmanla birlikte kayan, her karede çizilen parçalar (512'lik şerit tekrarlanır)
  function liveLayer(fn, off, dy) {
    const X0 = -(((off % SC.W) + SC.W) % SC.W);
    for (let X = X0; X < VW; X += SC.W) { ctx.save(); ctx.translate(X, dy || 0); fn(ctx); ctx.restore(); }
  }
  // tekrarlanan şeridi oda içindeki [X0, X1) aralığına diz (X: odanın solundan mantıksal piksel, rc: kamera)
  function strip(c, X0, X1, rc) {
    const a = Math.max(X0 - rc, 0), b = Math.min(X1 - rc, VW);
    if (b <= a) return;
    const Wd = Math.round(c.lw * S), Hd = Math.round(c.lh * S), A0 = Math.round(a * S), B0 = Math.round(b * S);
    let X = Math.round((X0 - rc) * S);
    if (X < A0 - Wd) X += Math.floor((A0 - X) / Wd) * Wd;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.save(); ctx.beginPath(); ctx.rect(A0, 0, B0 - A0, canvas.height); ctx.clip();
    for (; X < B0; X += Wd) ctx.drawImage(c, X, 0, Wd, Hd);
    ctx.restore(); ctx.setTransform(S, 0, 0, S, 0, 0);
  }
  function spr(c, X, y, rc) {
    const x = X - rc;
    if (x > VW || x + c.lw < 0) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(c, Math.round(x * S), Math.round(y * S), Math.round(c.lw * S), Math.round(c.lh * S));
    ctx.setTransform(S, 0, 0, S, 0, 0);
  }
  // bonus binişinin arka planı: yer altında istasyonlar ve tünel, sokakta şehir, yol ve duraklar; hepsi odayla kayar
  function rideBack(G, cam) {
    const rd = G.L.ride || { type: 'metro', line: 'M2', col: '#2fa84f', a: 'METRO', b: 'METRO' };
    const r = G.room, rc = cam - r.x0 * TS, rw = (r.x1 - r.x0) * TS;
    const tr = G.plats.find((q) => q.train);
    const ha = ((tr ? tr.a + tr.w : 20) - r.x0 + 2) * TS, hb = ((tr ? tr.b : 69) - r.x0 - 2) * TS;
    if (rd.type === 'metro') {
      const P = SC.metroLine(rd, VH);
      strip(P.tunnel, ha, hb, rc); strip(P.hall, 0, ha, rc); strip(P.hall, hb, rw, rc);
      spr(P.portalL, ha - 2, 0, rc); spr(P.portalR, hb - 38, 0, rc);
      spr(P.signA, 30, 57, rc); spr(P.mapA, 134, 114, rc); spr(P.signA, ha - 116, 57, rc);
      spr(P.signB, hb + 44, 57, rc); spr(P.mapB, hb + 150, 114, rc); spr(P.signB, rw - 30 - P.signB.lw, 57, rc);
    } else if (rd.type === 'funicular') {
      const P = RD.funiLine(rd, VH);
      strip(P.tunnel, ha, hb, rc); strip(P.hall, 0, ha, rc); strip(P.hall, hb, rw, rc);
      spr(P.portalL, ha - 2, 0, rc); spr(P.portalR, hb - 38, 0, rc);
      spr(P.signA, 30, 66, rc); spr(P.plaque, 112, 68, rc);
      spr(P.signB, hb + 50, 66, rc); spr(P.plaque, hb + 6, 68, rc);
    } else {
      if (rd.scene) {
        // bölümün kendi arka planı sokağa uymuyorsa (çarşının içi gibi) binişin kendi sahnesi
        const Ls = RD.scene(rd.scene, VW, VH, rd.night, G.moon);
        full(Ls.sky); layerDraw(Ls.far, cam * 0.15); layerDraw(Ls.near, cam * 0.4);
      } else backdrop(G.place, cam, 0, 0, 99, 99);
      const P = RD.streetLine(rd, VH);
      strip(P.road, 0, rw, rc);
      for (const d of P.decor) spr(d.c, d.x, d.y, rc);
    }
    // aracın farı önündeki duvarı/yolu aydınlatır (yer altında)
    if (tr && tr.state === 'go' && r.under) {
      const hx = (tr.x + tr.w) * TS - cam, hy = TOP + (tr.y - G.camY) * TS + (rd.type === 'metro' ? 37 : 28);
      if (hx < VW + 4) {
        const gr = ctx.createLinearGradient(hx, 0, hx + 96, 0);
        gr.addColorStop(0, 'rgba(255,246,206,0.34)'); gr.addColorStop(1, 'rgba(255,246,206,0)');
        ctx.fillStyle = gr; ctx.beginPath();
        ctx.moveTo(hx, hy - 2.5); ctx.lineTo(hx + 96, hy - 26); ctx.lineTo(hx + 96, hy + 18); ctx.lineTo(hx, hy + 2.5); ctx.closePath(); ctx.fill();
      }
    }
  }
  // önde kalan parçalar: sokakta bordür/bariyer, Tünel'de rampa (düşen oyuncu arkasında kaybolur)
  function rideFront(G, cam) {
    const rd = G.L.ride;
    if (!rd || rd.type === 'metro') return;
    const r = G.room, rc = cam - r.x0 * TS, tr = G.plats.find((q) => q.train);
    if (rd.type === 'funicular') {
      if (!tr) return;
      const H = RD.HT.funicular, s = (tr.yb - tr.ya) / Math.max(1e-6, tr.b - tr.a);
      const ya = TOP + (tr.ya - r.y0) * TS + H, xa = (tr.a - r.x0) * TS;
      const X0 = 10 * TS, X1 = (r.x1 - r.x0 - 9) * TS;
      RD.funiBed(ctx, X0 - rc, ya + s * (X0 - xa), X1 - rc, ya + s * (X1 - xa), VH, app.t);
      return;
    }
    strip(RD.streetLine(rd, VH).front, 10 * TS, (r.x1 - r.x0 - 9) * TS, rc);
  }
  // pl: mekân (dünya*3 + bölüm)
  // up: kamera başlangıç bandının kaç karo üstünde (tırmanınca arka plan aşağı kayar, gökyüzü açılır);
  // pitY / waterY: çukur kararması ve su çizgisinin ekrandaki yeri (karo satırı, ekranın üstünden)
  function backdrop(pl, cam, t, up, pitY, waterY) {
    const G = app.G, mo = G && (app.screen === 'play' || app.screen === 'pause') && G.place === pl ? G.moon : null;
    const sky = SC.sky(pl, VW, VH, mo), L = SC.layers(pl);
    let fo, fy, no, ny;
    if (app.mapShift !== undefined) {
      // harita çıkarma kipi: arka plan dünyaya yapışık, üst bantlarda gökyüzü kesintisiz sürer
      const m = Math.round(app.mapShift * S);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(sky, 0, m, canvas.width, canvas.height);
      if (m > 0) ctx.drawImage(sky, 0, 0, sky.width, 1, 0, 0, canvas.width, m);
      ctx.setTransform(S, 0, 0, S, 0, 0);
      fo = cam * 0.15; fy = app.mapShift; no = cam * 0.4; ny = app.mapShift;
    } else {
      full(sky);
      const u = Math.max(0, up || 0) * TS;
      fo = cam * 0.15 + (t || 0) * 0.3; fy = u * 0.15; no = cam * 0.4 + (t || 0); ny = u * 0.4;
    }
    layerDraw(L.far, fo, fy); layerDraw(L.near, no, ny);
    // mekânın canlı parçaları (sönen ışıklar, fenerin dönen ışığı): katmanlarla aynı kaymayla, her karede
    const D = SC.placeDef(pl);
    if (D.anim) D.anim({ far: (fn) => liveLayer(fn, fo, fy), near: (fn) => liveLayer(fn, no, ny), screen: ctx, vw: VW, vh: VH, t: app.t, G: G && G.place === pl ? G : null });
    const py = TOP + (pitY === undefined ? 12.2 : pitY) * TS;
    if (!ART.placeWater(pl) && py < VH) {
      // zemin hizasının altı kararır: çukurlar çukur gibi görünsün
      const gr = ctx.createLinearGradient(0, py, 0, py + 2 * TS);
      gr.addColorStop(0, 'rgba(12,10,30,0)'); gr.addColorStop(1, 'rgba(12,10,30,0.7)');
      ctx.fillStyle = gr; ctx.fillRect(0, py, VW, VH - py);
    }
    water(pl, cam + (t || 0) * 2.5, waterY);
  }
  function water(pl, cam, wy) {
    const col = ART.placeWater(pl);
    if (!col) return;
    const y0 = TOP + (wy === undefined ? 12.4 : wy) * TS;
    if (y0 >= VH) return;
    const gr = ctx.createLinearGradient(0, y0, 0, VH);
    gr.addColorStop(0, shade(col, 0.18)); gr.addColorStop(1, shade(col, -0.4));
    ctx.fillStyle = gr; ctx.fillRect(0, y0, VW, VH - y0);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(0, y0, VW, 0.8);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 0.8; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let r = 0; r < 3; r++) {
      const yy = y0 + 3 + r * 7, sp = 28 + r * 10, off = ((cam * (0.6 + r * 0.25)) % sp + sp) % sp;
      for (let x = -sp - off + r * 11; x < VW + sp; x += sp) {
        const yb = yy + Math.sin(app.t * 2 + x * 0.07 + r) * 0.8;
        ctx.moveTo(x, yb); ctx.quadraticCurveTo(x + 4, yb - 1.6, x + 8, yb);
      }
    }
    ctx.stroke();
  }

  // dönen simit kareleri (önbellekli)
  const coinCache = ART.cache();
  function coinImg(f) {
    f = ((f % 8) + 8) % 8;
    let c = coinCache.get(f);
    if (!c) { c = ART.mk(16, 16, (g) => ART.drawSimit(g, 8, 8, f / 8 * Math.PI, 6)); coinCache.set(f, c); }
    return c;
  }
  function clockIcon(x, y, r) {
    ART.circle(ctx, x, y, r, '#f6f0e2', ART.K, 0.7);
    ART.lin(ctx, x, y, x, y - r * 0.6, ART.K, 0.7); ART.lin(ctx, x, y, x + r * 0.45, y, ART.K, 0.7);
  }

  function hud(G) {
    const St = app.S, L = G ? G.L : LEVELS[St.stage];
    const y = 3, h = 13, ty = y + 2.6, sz = 7;
    panel(3, y, 58, h, 6.5); text(String(St.score).padStart(6, '0'), 32, ty, '#fff8ec', sz, 'center');
    panel(65, y, 44, h, 6.5); img(coinImg(0), 66.5, y - 1.5); text('×' + String(St.simit).padStart(2, '0'), 93, ty, '#ffe08a', sz, 'center');
    panel(113, y, 30, h, 6.5); text(`${L.world}-${L.section}`, 128, ty, '#9af4e4', sz, 'center');
    if (L.hand && !(G && G.boss && !G.boss.dead)) {
      // altın simitler: bu koşuda alınanlar dolu, daha önce alınmışlar soluk
      const idx = G ? G.idx : St.stage, run = (St.golds && St.golds[idx]) || 0, sv = app.golds[idx] || 0;
      for (let k = 0; k < 3; k++) {
        ctx.globalAlpha = (run >> k) & 1 ? 1 : (sv >> k) & 1 ? 0.5 : 1;
        HD.goldSlot(ctx, 120 + k * 8, y + h + 4.5, !!(((run | sv) >> k) & 1));
        ctx.globalAlpha = 1;
      }
    }
    if (!L.quiet) {   // Eyüp'ün tepesinde süre yok
      panel(147, y, 52, h, 6.5); clockIcon(157, y + 6.5, 4.2);
      const tm = G ? Math.ceil(G.time) : L.time;
      const warn = G && G.time < 100 && G.phase === 'play' && Math.floor(app.t * 4) % 2;
      text(String(tm).padStart(3, '0'), 180, ty, warn ? '#ff7a6a' : '#fff8ec', sz, 'center');
    }
    panel(203, y, 50, h, 6.5); ART.drawHead(ctx, 213, y + 7.4, 4.4, { skin: St.power === 2 ? 'hacker' : 'normal' });
    text('×' + St.lives, 234, ty, '#fff8ec', sz, 'center');
  }

  function heroOpts(G) {
    const p = G.player, St = G.S;
    let big = St.power > 0;
    if (p.growT > 0 && Math.floor(p.growT * 16) % 2) big = !big;
    let mode = 'stand';
    if (p.dead) mode = 'dead';
    else if (!p.onGround) mode = 'jump';
    else if (p.skid) mode = 'skid';
    else if (Math.abs(p.vx) > 0.3) mode = 'walk';
    if (!p.dead && big && St.power === 2 && p.shootCD > 0.08 && p.onGround) mode = 'shoot';
    if (p.cheer && !p.dead) mode = 'cheer';
    const star = p.star > 0 && !(p.star < 2 && Math.floor(app.t * 10) % 2);
    return { big, face: p.face, mode, phase: (p.walkT / 2.2) % 1, skin: St.power === 2 ? 'hacker' : 'normal', star, t: app.t, sq: p.sq };
  }

  const TILEK = { 2: 'solid', 8: 'solid', 3: 'oneway', 5: 'used', 6: 'crack', 7: 'spike', 10: 'crack' };
  const SOLID_T = BA.SOLID;
  function drawPlay() {
    const G = app.G, w = G.world, pl = G.place, theme = ART.placeTiles(pl);
    let sx = 0, sy = 0;
    if (G.shake > 0) { sx = (Math.random() - 0.5) * 4; sy = (Math.random() - 0.5) * 4; }
    const cam = Math.round(G.cam * TS * S) / S, camY = Math.round(G.camY * TS * S) / S / TS;
    const pcx = Math.max(0, Math.min(G.W - 1, Math.floor(G.player.x + G.player.w / 2)));
    if (G.area === 'room') {
      if (app.mapShift > 0) {
        // harita çıkarma kipi: binişin üstündeki bant boş gökyüzü (ya da yer altında toprak)
        const rd = G.L.ride;
        if (G.room.under) { ctx.fillStyle = '#151820'; ctx.fillRect(0, 0, VW, VH); }
        else {
          const sky = rd && rd.scene ? RD.scene(rd.scene, VW, VH, rd.night, G.moon).sky : SC.sky(G.place, VW, VH, G.moon);
          ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(sky, 0, 0, sky.width, 1, 0, 0, canvas.width, canvas.height); ctx.setTransform(S, 0, 0, S, 0, 0);
        }
      } else rideBack(G, cam);
    } else backdrop(pl, cam, 0, G.base0 - camY, G.camHi[pcx] + 12.2 - camY, G.H - 1.6 - camY);
    const ox = -cam + sx, oy = TOP + sy - camY * TS;
    // karolar: cihaz pikseline oturtulur, aralarında çizgi kalmaz
    const x0 = Math.max(0, Math.floor(G.cam) - 1), x1 = Math.min(G.W - 1, Math.floor(G.cam) + 17);
    const bumpOff = new Map();
    for (const b of G.bumps) bumpOff.set(b.ty * G.W + b.tx, -Math.sin(b.t / 0.2 * Math.PI) * 5);
    // yükselen eşyalar blokların arkasında
    ctx.save(); ctx.translate(ox, oy);
    for (const it of G.items) if (it.state === 'rise') ART.drawItem(ctx, it.kind, it.x * TS - 1, it.y * TS - 2, app.t);
    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const put = (c, lx, ly) => {
      const X0 = Math.round((lx + ox) * S), Y0 = Math.round((ly + oy) * S);
      ctx.drawImage(c, X0, Y0, Math.round((lx + 16 + ox) * S) - X0, Math.round((ly + 16 + oy) * S) - Y0);
    };
    const blink = Math.floor(app.t * 2.5) % 2 ? 'off' : '';
    const y0 = Math.max(0, Math.floor(camY) - 1), y1 = Math.min(G.H - 1, Math.floor(camY) + BA.VHT + 1);
    const T = BA.T, rackF = Math.floor(app.t * 3) % 2;
    const isRack = (t) => t === T.HOT || t === T.COOL;
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const i = ty * G.W + tx, t = G.grid[i];
        // tavan arası, taban altı: karanlık arka plan
        if (G.dark && G.dark[i] && !SOLID_T[t]) put(HD.darkTile(theme, (tx * 7 + ty * 3) % 8), tx * TS, ty * TS);
        if (!t || (G.room && tx >= G.room.x0 && ty < G.room.y0)) continue; // binişin üstündeki görünmez tavan
        const px = tx * TS, py = ty * TS + (bumpOff.get(i) || 0);
        const tw = G.room && tx >= G.room.x0 ? RD.tiles(G.L.ride) : theme; // bonus odası: peron ya da kaldırım
        const up = ty > 0 ? G.grid[i - G.W] : 0;
        if (t === 1) put(ART.tile(tw, ty > 0 && up === 1 ? 'fill' : 'surf'), px, py);
        else if ((t === 4 || t === 5) && G.look.get(i) === 'kahve') put(HD.coffee(t === 5), px, py);
        else if (t === 4) put(ART.tile(tw, 'block', blink), px, py);
        else if (TILEK[t]) put(ART.tile(tw, TILEK[t]), px, py);
        else if (t === T.GLASS) put(HD.glass(theme, up !== T.GLASS, G.grid[i - 1] !== T.GLASS, G.grid[i + 1] !== T.GLASS), px, py);
        else if (t === T.PLANTER) put(HD.planter(), px, py);
        else if (t === T.TURN) put(HD.turnstile(), px, py);
        else if (t === T.PANEL) put(HD.panel(theme), px, py);
        else if (t === T.FAN) put(HD.fanBase(theme), px, py);
        else if (isRack(t)) put(HD.rack(t === T.HOT, !isRack(up), rackF), px, py);
      }
    }
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.save();
    ctx.translate(ox, oy);
    if (G.hand) drawHandBack(G, theme);
    // simitler
    const coin = coinImg(Math.floor(app.t * 10));
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (G.coins[ty * G.W + tx]) img(coin, tx * TS, ty * TS);
    // kayıt noktaları ve DEPLOY
    for (const cp of G.checkpoints) ART.drawCheckpoint(ctx, cp.x * TS, (cp.y - 1) * TS, cp.on, app.t);
    if (G.hand) drawHandFront(G, theme);
    if (G.bench) ART.drawBench(ctx, (G.bench.x + 0.5) * TS, (G.bench.y + 1) * TS);
    const gl = G.goal;
    if (gl && (gl.active || !G.bossKind)) {
      const gx = gl.x * TS, gy = gl.y * TS, mast = !G.bossKind;
      // anten: değilen yükseklik kadar çentik yanar
      if (mast) ART.drawAntenna(ctx, gx, gy, app.t, G.phase === 'clear' ? (G.goalHit || 0) * Math.min(1, G.clearT / 0.6) : undefined, BA.GOAL_STEPS);
      ART.drawDeploy(ctx, gx, gy, app.t, G.phase === 'clear' ? Math.min(1, G.clearT / 1.4) : undefined);
      if (G.phase !== 'clear') {
        const bob = Math.sin(app.t * 4) * 1.2, ly = mast ? gy - 150 : gy - 16;
        panel(gx - 12, ly + bob, 40, 11, 5.5, 'rgba(15,36,26,0.85)', '#7cff6a');
        text('DEPLOY', gx + 8, ly + 2.4 + bob, '#7cff6a', 6, 'center', null);
      }
    }
    // biniş girişi (durak/istasyon), varış noktası ve odadaki çıkış merdiveni
    if (G.room) {
      const rd = G.L.ride;
      for (const m of [G.metroIn, G.metroOut]) if (m && m.x > G.cam - 3 && m.x < G.cam + 18) RD.drawGate(ctx, rd, m.x * TS, m.y * TS, app.t);
      const ex = G.room.exit;
      if (ex && G.area === 'room') RD.drawExit(ctx, rd, ex.x * TS, ex.y * TS, app.t);
      // girişin üstünde dururken aşağı ok
      const p = G.player, mi = G.metroIn;
      if (mi && !G.warp && G.area === 'main' && p.onGround && Math.abs(p.x + p.w / 2 - mi.x - 1) < 0.8 && Math.abs(p.y + p.h - mi.y - 1) < 0.05) {
        const ay = (mi.y - 3.4) * TS + Math.abs(Math.sin(app.t * 5)) * 3, ax = (mi.x + 1) * TS;
        ART.poly(ctx, [ax - 4, ay, ax + 4, ay, ax + 4, ay + 4, ax + 7, ay + 4, ax, ay + 10, ax - 7, ay + 4, ax - 4, ay + 4], '#ffffff', '#1a1430', 0.9);
      }
    }
    // hareketli platformlar (metro treni dahil) ve dönen kıvılcımlar
    for (const pl of G.plats) {
      if (pl.train) { if (G.area === 'room') RD.drawVehicle(ctx, G.L.ride, pl, app.t, TS); }
      else if (pl.kind === 'v' && theme === 18) ART.drawCabin(ctx, pl.x * TS, pl.y * TS, pl.w * TS, app.t, pl.a * TS, pl.b * TS); // Ataşehir: cephe asansörü
      else if (theme === 18 || pl.gondola) ART.drawGondola(ctx, pl.x * TS, pl.y * TS, pl.w * TS); // Ataşehir ve Maslak: cam silme sepeti
      else if (G.L.yer === 'teleferik') ART.drawTeleferik(ctx, pl.x * TS, pl.y * TS, pl.w * TS); // Eyüp: teleferik kabini
      else ART.drawLift(ctx, pl.x * TS, pl.y * TS, pl.w * TS);
    }
    for (const b of G.bars) {
      img(ART.tile(theme, 'anchor'), (b.cx - 0.5) * TS, (b.cy - 0.5) * TS);
      for (let k = 1; k <= b.n; k++) ART.drawSpark(ctx, (b.cx + Math.cos(b.a) * k * 0.45) * TS, (b.cy + Math.sin(b.a) * k * 0.45) * TS, app.t + k);
    }
    // eşyalar
    for (const it of G.items) if (it.state !== 'rise') ART.drawItem(ctx, it.kind, it.x * TS - 1, it.y * TS - 2, app.t);
    // hatıra parçası: süzülür ve parlar; daha önce alındıysa soluk görünür
    if (G.piece && !G.piece.taken) {
      const pc = G.piece, cx = (pc.x + pc.w / 2) * TS, cy = (pc.y + pc.h / 2) * TS + Math.sin(app.t * 2.4) * 1.6;
      const gl = ctx.createRadialGradient(cx, cy, 1, cx, cy, 16);
      gl.addColorStop(0, `rgba(255,236,170,${0.55 + Math.sin(app.t * 4) * 0.15})`); gl.addColorStop(1, 'rgba(255,236,170,0)');
      ctx.fillStyle = gl; ctx.fillRect(cx - 16, cy - 16, 32, 32);
      ctx.globalAlpha = app.pieces[G.world] ? 0.55 : 1;
      ART.drawPiece(ctx, G.world, cx, cy, 1, app.t);
      ctx.globalAlpha = 1;
      for (let k = 0; k < 3; k++) { const a = app.t * 2 + k * 2.1; ART.circle(ctx, cx + Math.cos(a) * 9, cy + Math.sin(a) * 6, 0.7, 'rgba(255,250,220,0.9)', null); }
    }
    // düşmanlar, patron
    for (const e of G.ents) drawEnemy(e);
    if (G.boss && G.boss.prince) HD.drawPrince(ctx, G.boss.prince, app.t);
    if (G.boss) drawBoss(G);
    // oyuncu
    const p = G.player;
    if (!(p.inv > 0 && Math.floor(app.t * 20) % 2) || p.dead) {
      const cl = G.warp && G.warp.clip;
      if (cl) { ctx.save(); ctx.beginPath(); ctx.rect(-1e4, -1e4, cl.x1 !== undefined ? cl.x1 * TS + 1e4 : 3e4, cl.y1 !== undefined ? cl.y1 * TS + 1e4 : 3e4); ctx.clip(); }
      ART.drawHero(ctx, (p.x + p.w / 2) * TS, (p.y + p.h) * TS, heroOpts(G));
      if (cl) ctx.restore();
    }
    // atışlar ve efektler
    for (const s of G.shots) ART.drawShot(ctx, s.x * TS, s.y * TS, app.t);
    for (const s of G.bshots) drawBossShot(s);
    for (const f of G.fx) drawFx(f, theme);
    ctx.restore();
    if (G.area === 'room') rideFront(G, cam);
    // patron canı
    if (G.boss && !G.boss.dead) {
      const b = G.boss, name = up(G.L.bossName || '');
      panel(3, TOP + 3, VW - 6, 14, 7);
      text(name, 11, TOP + 6, '#ffa288', 6.4, 'left');
      for (let i = 0; i < b.maxHp; i++) {
        const x = VW - 12 - (b.maxHp - 1 - i) * 10, full = b.hp > i + 0.01, part = !full && b.hp > i;
        heart(x, TOP + 10, full ? '#ff4a5a' : part ? '#9a3a40' : '#3a3e52');
      }
      if (b.state === 'intro') {
        panel(28, 92, VW - 56, 52, 10);
        text('PATRON', VW / 2, 100, '#f4c531', 7, 'center');
        text(name, VW / 2, 116, '#ffffff', 14, 'center');
      }
    }
    if (G.goal && G.goal.active && G.bossKind && G.phase === 'play' && G.bossDownT < 4) {
      text('DEPLOY ET!', VW / 2, 60, Math.floor(app.t * 4) % 2 ? '#7cff6a' : '#ffffff', 14, 'center');
    }
    if (G.phase === 'clear' && G.clearT > 1.4 && !(G.tallyDone && G.clearT - G.tallyDone > 0.35)) {
      panel(40, 72, VW - 80, 40, 10);
      text('DEPLOY BAŞARILI!', VW / 2, 79, '#7cff6a', 9, 'center');
      text('süre bonusu', VW / 2, 96, '#fff8ec', 6.6, 'center', null, 500);
    }
    if (!G.quiet && G.time < 100 && G.time > 97 && G.phase === 'play') text('ACELE ET!', VW / 2, 60, '#ff7a6a', 14, 'center');
    // metro geçişinde ekran kararıp açılır
    if (G.warp) {
      const t = G.warp.t, a = t < 0.5 ? 0 : t < 0.85 ? (t - 0.5) / 0.35 : Math.max(0, 1 - (t - 0.85) / 0.3);
      if (a > 0) { ctx.fillStyle = `rgba(8,8,16,${a})`; ctx.fillRect(0, 0, VW, VH); }
    }
    hud(G);
  }
  // ---------- el yapımı bölümlerin (Maslak) parçaları ----------
  const onScreen = (G, x, w) => x + (w || 1) > G.cam - 1 && x < G.cam + 17;
  // arkada: bank ve bardak, toplantı masası, fan hava sütunları, sıcak kabinlerin üstündeki sıcak hava
  function drawHandBack(G) {
    for (const d of G.decor) {
      if (!onScreen(G, d.x - 1, 3)) continue;
      if (d.k === 'bank') { ART.drawBench(ctx, (d.x + 0.5) * TS, (d.y + 1) * TS); if (d.cup) HD.drawCup(ctx, (d.x + 1.15) * TS, (d.y + 1) * TS - 10); }
      else if (d.k === 'masa') HD.drawTable(ctx, (d.x + 0.5) * TS, (d.y + 1) * TS);
    }
    for (const f of G.fans) if (onScreen(G, f.x)) HD.drawAir(ctx, f.x * TS, f.y * TS, f.reach, app.t + f.x * 0.13, f.spin);
    if (G.hasHot) {
      const T = BA.T, x0 = Math.max(0, Math.floor(G.cam) - 1), x1 = Math.min(G.W - 1, Math.floor(G.cam) + 17);
      for (let ty = 1; ty < G.H; ty++) for (let tx = x0; tx <= x1; tx++) {
        if (G.grid[ty * G.W + tx] === T.HOT && G.grid[(ty - 1) * G.W + tx] !== T.HOT && !SOLID_T[G.grid[(ty - 1) * G.W + tx]]) HD.drawHeat(ctx, tx * TS, ty * TS, app.t + tx * 0.37);
      }
    }
  }
  // önde: kapılar, okuyucular, fan kanatları, simitçi tezgâhları, altın simitler
  function drawHandFront(G) {
    for (const d of G.doors) if (onScreen(G, d.x)) HD.drawDoor(ctx, d, G.t, G.L.ic);
    for (const r of G.readers) if (onScreen(G, r.x)) HD.drawReader(ctx, r, app.t);
    const P = G.fanPulse ? BA.FAN.pPeriod : BA.FAN.period, ON = G.fanPulse ? BA.FAN.pOn : BA.FAN.on, ph = G.fanT % P;
    for (const f of G.fans) if (onScreen(G, f.x)) HD.drawFan(ctx, f.x * TS, f.y * TS, app.t, f, (f.cyc || G.fanPulse) && f.on && ph > ON - 0.6);
    const T = BA.T, x0 = Math.max(0, Math.floor(G.cam) - 2), x1 = Math.min(G.W - 1, Math.floor(G.cam) + 17);
    for (let ty = 0; ty < G.H; ty++) for (let tx = x0; tx <= x1; tx++) {
      const i = ty * G.W + tx;
      if (G.grid[i] !== T.CART || G.grid[i - 1] === T.CART) continue;
      const t0 = G.cartT.get(i), k = t0 === undefined ? 1 : (G.t - t0) / 0.35;
      HD.drawCart(ctx, tx * TS, ty * TS, k < 1 ? Math.sin(k * Math.PI) * (1 - k) : 0);
    }
    const saved = app.golds[G.idx] || 0;
    for (const gd of G.golds) if (!gd.taken && onScreen(G, gd.x)) HD.drawGold(ctx, (gd.x + 0.4) * TS, (gd.y + 0.42) * TS, app.t + gd.k * 0.7, !!((saved >> gd.k) & 1));
  }
  function heart(x, y, col) {
    ctx.beginPath();
    ctx.moveTo(x, y + 3.2);
    ctx.bezierCurveTo(x - 5, y - 0.4, x - 3, y - 4.4, x, y - 2);
    ctx.bezierCurveTo(x + 3, y - 4.4, x + 5, y - 0.4, x, y + 3.2);
    ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = '#1a1430'; ctx.lineWidth = 0.6; ctx.stroke();
  }

  function drawEnemy(e) {
    const cx = (e.x + e.w / 2) * TS, by = (e.y + e.h) * TS;
    ctx.save();
    if (e.dead && e.flip) { const my = by - e.h * TS / 2; ctx.translate(0, my); ctx.scale(1, -1); ctx.translate(0, -my); }
    switch (e.kind) {
      case 'bug':
        if (!e.dead && (e.state || e.slide)) { const p = app.G.player; HD.drawMoodBug(ctx, e, app.t, p.x + p.w / 2 < e.x + e.w / 2 ? -1 : 1); }
        else ART.drawBug(ctx, cx, by, e.t, e.vx > 0 ? 1 : -1, e.dead && !e.flip);
        break;
      case 'hirsiz': HD.drawThief(ctx, e, app.t); break;
      case 'virus': ART.drawVirus(ctx, cx, by + 1, e.t); break;
      case 'spam': ART.drawSpam(ctx, cx, by + 1, e.t, e.vx > 0 ? 1 : -1); break;
      case 'leap': {
        // raylardan sıçrayan bug: yükselirken burnu yukarı, düşerken aşağı; bacaklar açık
        const a = Math.max(-0.75, Math.min(0.75, -e.vy * 0.045));
        ctx.translate(cx, by - 6); ctx.rotate(a);
        ART.drawBug(ctx, 0, 6, 0.11, -1, false);
        break;
      }
      case 'marti': ART.drawMarti(ctx, cx, by + 1, e.t, e.vx < 0 ? -1 : 1, e.state === 'dive'); break;
    }
    ctx.restore();
  }

  // yara alan patron: ayrı bir tuvalde çizilip beyaza boyanır
  let flashCv = null;
  function flashed(draw, cx, by) {
    const w = 96, h = 80;
    if (!flashCv || flashCv.S !== S) { flashCv = document.createElement('canvas'); flashCv.width = Math.ceil(w * S); flashCv.height = Math.ceil(h * S); flashCv.S = S; }
    const g = flashCv.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, flashCv.width, flashCv.height);
    g.setTransform(S, 0, 0, S, 0, 0); g.lineJoin = 'round'; g.lineCap = 'round';
    draw(g, w / 2, h - 6);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop';
    g.fillStyle = 'rgba(255,255,255,0.82)'; g.fillRect(0, 0, flashCv.width, flashCv.height);
    g.globalCompositeOperation = 'source-over';
    ctx.drawImage(flashCv, cx - w / 2, by - h + 6, w, h);
  }
  function drawBoss(G) {
    const b = G.boss;
    if (b.kind === 'glitch' && (b.state === 'hide' || (b.state === 'appear' && Math.floor(app.t * 20) % 2) || (b.state === 'vanish' && Math.floor(app.t * 25) % 2))) return;
    const hurt = (b.flash > 0 && Math.floor(app.t * 24) % 2) || (b.hurtT > 0 && Math.floor(app.t * 12) % 2);
    const cx = (b.x + b.w / 2) * TS, by = (b.y + b.h) * TS + (b.kind === 'spam' ? 3 : 0);
    let shakeX = 0;
    if ((b.kind === 'truva' && b.state === 'shake') || (b.kind === 'kralbug' && b.state === 'go' && b.st > 1.5)) shakeX = Math.floor(app.t * 30) % 2 ? 1 : -1;
    const o = { face: b.face || -1, hurt: false, open: b.kind === 'truva' && b.state === 'open', tired: b.kind === 'ddos' && b.state === 'tired', dive: b.kind === 'marti' && b.state === 'dive' };
    if (b.crownT !== undefined) { const k = (b.t - b.crownT) / 0.5; if (k >= 0 && k < 1) o.crownUp = Math.sin(k * Math.PI); }
    ctx.save();
    if (b.dead) { const my = by - b.h * TS / 2; ctx.translate(0, my); ctx.scale(1, -1); ctx.translate(0, -my); }
    if (hurt && b.kind !== 'glitch') flashed((g, x, y) => ART.drawBoss(g, b.kind, x, y, b.t, o), cx + shakeX, by);
    else ART.drawBoss(ctx, b.kind, cx + shakeX, by, b.t, { ...o, hurt: hurt && b.kind === 'maviekran' });
    ctx.restore();
    if (b.kind === 'dongu' && !b.dead) {
      for (let k = 0; k < 3; k++) {
        const a = b.orb + k * Math.PI * 2 / 3;
        ART.drawSpark(ctx, (b.x + b.w / 2 + Math.cos(a) * 1.8) * TS, (b.y + b.h / 2 + Math.sin(a) * 1.8) * TS, app.t + k, 3.2);
      }
    }
  }
  function lockIcon(cx, cy, k) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
    ctx.strokeStyle = ART.K; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(0, -2, 2.6, Math.PI, 0); ctx.stroke();
    ctx.strokeStyle = '#c9ced8'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, -2, 2.6, Math.PI, 0); ctx.stroke();
    ART.box(ctx, -4, -2, 8, 6, 1.2, '#e8443a', ART.K, 0.6);
    ART.circle(ctx, 0, 0.4, 0.9, '#2a0a0a', null);
    ctx.restore();
  }
  function drawBossShot(s) {
    const x = s.x * TS, y = s.y * TS, w = s.w * TS, h = s.h * TS, cx = x + w / 2, cy = y + h / 2;
    switch (s.kind) {
      case 'drop': {
        ctx.beginPath(); ctx.moveTo(cx, y - 1); ctx.quadraticCurveTo(x + w + 1, cy + 1, cx, y + h); ctx.quadraticCurveTo(x - 1, cy + 1, cx, y - 1);
        ctx.fillStyle = '#c88aec'; ctx.fill(); ctx.strokeStyle = ART.K; ctx.lineWidth = 0.7; ctx.stroke();
        ART.circle(ctx, cx - 1, cy + 0.6, 0.9, 'rgba(255,255,255,0.8)', null);
        break;
      }
      case 'packet': {
        ART.box(ctx, x, y, w, h, 1.4, '#3ae0ff');
        ctx.fillStyle = '#0a3a4a'; ctx.font = `600 ${h * 0.62}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('01', cx, cy + 0.3);
        break;
      }
      case 'pixel': {
        ctx.save(); ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 3 * S;
        ctx.fillStyle = ['#ff3a6a', '#3ae0ff', '#7cff6a'][Math.floor(app.t * 20) % 3]; ctx.fillRect(x, y, w, h);
        ctx.restore();
        break;
      }
      case 'noodle': {
        // dolanmış erişte topu
        ART.circle(ctx, cx, cy, w * 0.5, '#f2d06a', ART.K, 0.7);
        ctx.strokeStyle = '#c89a3a'; ctx.lineWidth = 0.7;
        for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(cx, cy, w * (0.18 + k * 0.1), app.t * 8 + k * 2, app.t * 8 + k * 2 + 3.4); ctx.stroke(); }
        ART.circle(ctx, cx + 1, cy - 1.4, 1.1, '#d8302a', null);
        break;
      }
      case 'box': {
        // tavandan düşen eski kod kutusu; yerde gölgesi önceden belli olur
        const a = Math.min(0.5, 0.15 + s.t * 0.3);
        ART.ellipse(ctx, cx, 12 * TS - 1, w * 0.55, 1.6, `rgba(20,10,0,${a})`, null);
        ART.box(ctx, x, y, w, h, 1.2, '#b8743a', ART.K, 0.7);
        ctx.strokeStyle = '#7a3a14'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 1.5, y + 1.5); ctx.lineTo(x + w - 1.5, y + h - 1.5); ctx.stroke();
        break;
      }
      case 'lock': {
        // zemine kurulan kilit: önce yanıp sönen uyarı halkası, sonra kırmızı yanan kilitli alan
        const armed = !(s.arm && s.t < s.arm), fy = y + h;
        if (!armed) {
          if (Math.floor(s.t * 10) % 2 === 0) {
            ctx.strokeStyle = 'rgba(255,74,74,0.9)'; ctx.lineWidth = 0.9; ctx.setLineDash([2, 1.6]);
            ART.rr(ctx, x, fy - 3, w, 3, 1.4); ctx.stroke(); ctx.setLineDash([]);
          }
          const k = s.t / s.arm;
          ctx.globalAlpha = 0.4 + k * 0.6;
          lockIcon(cx, fy - 6 - (1 - k) * 8, 0.8);
          ctx.globalAlpha = 1;
        } else {
          const gl = ctx.createLinearGradient(0, fy - 10, 0, fy);
          gl.addColorStop(0, 'rgba(255,60,60,0)'); gl.addColorStop(1, `rgba(255,60,60,${0.55 + 0.2 * Math.sin(app.t * 20)})`);
          ctx.fillStyle = gl; ctx.fillRect(x, fy - 10, w, 10);
          ART.box(ctx, x, fy - 2.4, w, 2.4, 1, '#c42a24', ART.K, 0.6);
          for (let k = 0; k < 3; k++) { const lx = x + 2 + k * (w - 4) / 2; ctx.strokeStyle = '#a8b0bc'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(lx, fy - 2.4, 1.6, Math.PI, 0); ctx.stroke(); }
          lockIcon(cx, fy - 6.2, 1);
        }
        break;
      }
      case 'file': {
        // şifreli dosya: kilitli zarf, yerde kayar
        ART.box(ctx, x, y + 1, w, h - 1, 0.8, '#f4f2ea', ART.K, 0.6);
        ART.lin(ctx, x, y + 1, cx, cy + 1, '#8a8f9a', 0.5); ART.lin(ctx, x + w, y + 1, cx, cy + 1, '#8a8f9a', 0.5);
        lockIcon(cx, cy + 1.6, 0.55);
        break;
      }
      case 'bolt': {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(app.t * 14 * Math.sign(s.vx || 1));
        ART.poly(ctx, [-4, -2.4, 0, -4.6, 4, -2.4, 4, 2.4, 0, 4.6, -4, 2.4], '#9aa0aa', ART.K, 0.7);
        ART.circle(ctx, 0, 0, 1.6, '#4a4e58', null);
        ctx.restore();
        break;
      }
      case 'sad': {
        ART.box(ctx, x, y, w, h, 1.6, '#2a5ad8');
        ctx.fillStyle = '#ffffff'; ctx.font = `600 ${h * 0.6}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(':(', cx, cy + 0.4);
        break;
      }
    }
  }
  function drawFx(f, w) {
    switch (f.k) {
      case 'score': {
        // önce büyüyüp yerine oturan puan yazısı
        const t = f.t, k = t < 0.08 ? 0.5 + t / 0.08 * 0.8 : t < 0.2 ? 1.3 - (t - 0.08) / 0.12 * 0.3 : 1;
        const col = f.text === '1UP' ? '#7cff6a' : +f.text >= 1000 ? '#ffd84a' : '#ffffff';
        ctx.globalAlpha = Math.max(0, Math.min(1, (0.95 - t) / 0.25));
        text(f.text, f.x * TS, f.y * TS - 8 - 3 * (k - 1), col, 6 * k, 'center');
        ctx.globalAlpha = 1;
        break;
      }
      case 'simitpop': {
        // bloktan fırlayan simit: yükselir, döner, tepede parlar
        const t = f.t, h = 19 * t - 29 * t * t;
        const cx = f.x * TS + 8, cy = (f.y + 0.5 - h) * TS;
        ART.drawSimit(ctx, cx, cy, t * 34, 6.4);
        break;
      }
      case 'dust': {
        const a = Math.max(0, 1 - f.t / 0.4), r = (f.r || 1) * (2.4 + f.t * 9);
        ART.circle(ctx, f.x * TS, f.y * TS - r * 0.5, r, `rgba(252,248,238,${a * 0.95})`, `rgba(110,96,84,${a * 0.6})`, 0.6);
        ART.circle(ctx, f.x * TS - r * 0.25, f.y * TS - r * 0.7, r * 0.45, `rgba(255,255,255,${a * 0.8})`, null);
        break;
      }
      case 'stomp': {
        // ezme yıldızı: kısa ışınlar ve halka
        const a = Math.max(0, 1 - f.t / 0.3), r = 5 + f.t * 34, x = f.x * TS, y = f.y * TS;
        ctx.save(); ctx.translate(x, y); ctx.globalAlpha = a;
        ctx.lineCap = 'round';
        for (let k = 0; k < 8; k++) {
          const an = k / 8 * Math.PI * 2 + 0.2, x0 = Math.cos(an) * r * 0.5, y0 = Math.sin(an) * r * 0.4, x1 = Math.cos(an) * r, y1 = Math.sin(an) * r * 0.8;
          ctx.strokeStyle = '#1a1430'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
          ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        }
        const st = 6 * (1 - f.t / 0.3 * 0.4);
        ART.poly(ctx, [0, -st, st * 0.3, -st * 0.3, st, 0, st * 0.3, st * 0.3, 0, st, -st * 0.3, st * 0.3, -st, 0, -st * 0.3, -st * 0.3], '#ffffff', '#1a1430', 0.6);
        ctx.restore();
        break;
      }
      case 'firework': {
        // gökyüzünde açılan çiçek; kıvılcımlar düşerek söner
        const t = f.t, x = f.x * TS, y0 = f.y * TS;
        if (t < 0.3) {
          const yy = y0 + (1 - t / 0.3) * 70;
          ART.circle(ctx, x, yy, 1.4, '#fff2c0', null);
          ctx.fillStyle = 'rgba(255,220,150,0.5)'; ctx.fillRect(x - 0.5, yy, 1, 8);
          break;
        }
        const u = t - 0.3, a = Math.max(0, 1 - Math.max(0, u - 0.25) / 0.55), e = 1 - Math.pow(1 - Math.min(1, u / 0.4), 3), R = 4 + e * 24;
        if (u < 0.14) ART.circle(ctx, x, y0, 14 * (1 - u / 0.14) + 3, `rgba(255,255,240,${0.95 - u * 6})`, null);
        ctx.lineCap = 'round';
        for (let ring = 0; ring < 2; ring++) {
          const n = ring ? 9 : 14, rr = R * (ring ? 0.55 : 1), hue = (f.hue + ring * 50) % 360, drop = u * u * 16;
          for (let k = 0; k < n; k++) {
            const an = k / n * Math.PI * 2 + ring * 0.35, c = Math.cos(an), sn = Math.sin(an);
            const px = x + c * rr, py = y0 + sn * rr + drop, tail = Math.min(rr * 0.5, 8);
            ctx.strokeStyle = `hsla(${hue},100%,${ring ? 78 : 64}%,${a * 0.85})`; ctx.lineWidth = ring ? 1.2 : 1.7;
            ctx.beginPath(); ctx.moveTo(px - c * tail, py - sn * tail - drop * 0.3); ctx.lineTo(px, py); ctx.stroke();
            const tw = (Math.floor(u * 24 + k) % 3) ? 1 : 0.5;
            ART.circle(ctx, px, py, (ring ? 1.1 : 1.6) * tw, `rgba(255,255,235,${a})`, null);
          }
        }
        break;
      }
      case 'debris': {
        const c = ART.tile(w, 'crack'), k = c.width / 16;
        ctx.save(); ctx.translate(f.x * TS, f.y * TS); ctx.rotate(f.t * 14);
        ctx.drawImage(c, 4 * k, 4 * k, 8 * k, 8 * k, -4, -4, 8, 8);
        ctx.restore();
        break;
      }
      case 'bardak': {
        // uyuyan bug'ın çay bardağı: dönerek düşer, yere değince kırılır
        if (!f.hit) { ctx.save(); ctx.translate(f.x * TS, f.y * TS); ctx.rotate(f.t * 9); HD.drawCup(ctx, 0, 2.5); ctx.restore(); break; }
        const u = f.t - f.hit, a = Math.max(0, 1 - u / 0.5);
        for (let k = 0; k < 5; k++) {
          const an = -0.3 - k * 0.6, d = 2 + u * 22;
          ART.poly(ctx, [0, -1, 1.2, 0.6, -1, 0.8].map((v, j) => (j % 2 ? f.y * TS + v + Math.sin(an) * d + u * u * 40 : f.x * TS + v + Math.cos(an) * d)), `rgba(220,240,255,${a})`, null);
        }
        ART.ellipse(ctx, f.x * TS, f.y * TS + 4, 3 + u * 10, 1, `rgba(200,60,30,${a * 0.7})`, null);
        break;
      }
      case 'panel': {
        ctx.save(); ctx.translate(f.x * TS, f.y * TS); ctx.rotate(f.r); ctx.globalAlpha = Math.max(0, 1 - f.t / 1.2);
        ART.box(ctx, -7, -1.5, 14, 3, 0.6, '#e8eaee', ART.K, 0.6); ctx.restore();
        break;
      }
      case 'steam': {
        if (f.t < 0) break;
        const a = Math.max(0, 1 - f.t / 0.9);
        for (let k = 0; k < 3; k++) ART.circle(ctx, f.x * TS + (k - 1) * 4 + Math.sin(f.t * 6 + k) * 2, f.y * TS - f.t * 10 - k * 2, 2.5 + f.t * 6, `rgba(240,250,255,${a * 0.55})`, null);
        break;
      }
      case 'goldpop': {
        const a = Math.max(0, 1 - f.t / 0.8), r = 4 + f.t * 30;
        ctx.strokeStyle = `rgba(255,216,74,${a})`; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(f.x * TS, f.y * TS, r, 0, Math.PI * 2); ctx.stroke();
        for (let k = 0; k < 8; k++) { const an = k / 8 * Math.PI * 2 + f.t * 3; ART.circle(ctx, f.x * TS + Math.cos(an) * r * 0.8, f.y * TS + Math.sin(an) * r * 0.8, 1.2, `rgba(255,250,210,${a})`, null); }
        break;
      }
      case 'puff': { const r = 2 + f.t * 20; ART.circle(ctx, f.x * TS, f.y * TS, r, `rgba(255,255,255,${Math.max(0, 0.9 - f.t / 0.35)})`, null); break; }
      case 'spark': {
        const a = Math.max(0, 1 - f.t / 0.35), r = 3 + f.t * 16;
        ctx.fillStyle = `rgba(255,240,160,${a})`;
        for (let k = 0; k < 6; k++) { const an = k / 6 * Math.PI * 2; ctx.beginPath(); ctx.arc(f.x * TS + Math.cos(an) * r, f.y * TS + Math.sin(an) * r, 1.3, 0, Math.PI * 2); ctx.fill(); }
        break;
      }
    }
  }

  // ---------- ekranlar ----------
  function menu(items, y0, sel, gap = 15, w = 150) {
    app.menuItems = [];
    const x0 = VW / 2 - w / 2;
    panel(x0, y0 - 7, w, items.length * gap + 5, 9);
    items.forEach((label, i) => {
      const y = y0 + i * gap, on = i === sel;
      if (on) {
        ART.rr(ctx, x0 + 4, y - 4.5, w - 8, gap - 1.5, 6.5); ctx.fillStyle = '#f4c531'; ctx.fill();
        ART.poly(ctx, [x0 + 10, y - 0.4, x0 + 15, y + 2.8, x0 + 10, y + 6], '#2a1a10', null);
      }
      text(label, VW / 2, y - 0.4, on ? '#2a1a10' : '#fff8ec', 7.2, 'center', on ? null : '#1a1430');
      app.menuItems.push({ y });
    });
  }
  function logo(cx, y) {
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = `600 34px ${FONT}`;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#2a1430'; ctx.lineWidth = 8; ctx.strokeText('BUG AVCISI', cx, y + 2);
    ctx.lineWidth = 7; ctx.strokeText('BUG AVCISI', cx, y);
    const gr = ctx.createLinearGradient(0, y - 26, 0, y);
    gr.addColorStop(0, '#fff2a0'); gr.addColorStop(0.5, '#ffc93a'); gr.addColorStop(1, '#ff8a2a');
    ctx.fillStyle = gr; ctx.fillText('BUG AVCISI', cx, y);
    ctx.globalAlpha = 0.5; ctx.fillStyle = '#ffffff'; ctx.font = `600 34px ${FONT}`;
    ctx.save(); ctx.beginPath(); ctx.rect(0, y - 27, VW, 7); ctx.clip(); ctx.fillText('BUG AVCISI', cx, y); ctx.restore();
    ctx.restore();
    // kırmızı kurdele: İSTANBUL
    const ry = y + 6, rw = 104;
    ART.poly(ctx, [cx - rw / 2 - 10, ry + 2, cx - rw / 2 + 2, ry + 2, cx - rw / 2 + 2, ry + 14, cx - rw / 2 - 10, ry + 14, cx - rw / 2 - 6, ry + 8], '#a8141c', '#2a1430', 0.9);
    ART.poly(ctx, [cx + rw / 2 + 10, ry + 2, cx + rw / 2 - 2, ry + 2, cx + rw / 2 - 2, ry + 14, cx + rw / 2 + 10, ry + 14, cx + rw / 2 + 6, ry + 8], '#a8141c', '#2a1430', 0.9);
    ART.box(ctx, cx - rw / 2, ry, rw, 13, 2, '#e3242b', '#2a1430', 0.9);
    text('İSTANBUL', cx, ry + 2.6, '#ffffff', 8, 'center', null);
  }
  function drawTitle() {
    const t = app.titleT;
    full(SC.title(VW, VH));
    // martılar ve karşıya geçen vapur
    for (let k = 0; k < 4; k++) {
      const x = ((t * (10 + k * 3) + k * 83) % 300) - 22, y = 84 + k * 11 + Math.sin(t * 1.5 + k) * 3;
      SC.seagull(ctx, x, y, 0.8 - k * 0.08, '#fff6ea', 0.6 + Math.sin(t * 8 + k * 2) * 0.5);
    }
    SC.pen('rgba(30,20,50,0.5)', 0.4);
    SC.ferry(ctx, ((t * 7) % 340) - 50, 202, 0.42, { hull: '#2a2448', white: '#fbe6d8', win: '#6a4a7a', funnel: '#f2c87a' });
    SC.pen(null);
    // rıhtım
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const scroll = (t * 40) % 16;
    for (let x = -1; x < 17; x++) for (const [k, y] of [['surf', 208], ['fill', 224]]) {
      const X0 = Math.round((x * 16 - scroll) * S), Y0 = Math.round(y * S);
      ctx.drawImage(ART.tile(1, k), X0, Y0, Math.round((x * 16 + 16 - scroll) * S) - X0, Math.round((y + 16) * S) - Y0);
    }
    ctx.setTransform(S, 0, 0, S, 0, 0);
    // kahraman koşuyor, bug peşinde
    const hx = 62 + Math.sin(t * 1.3) * 6;
    ART.drawHero(ctx, hx, 208, { big: true, face: 1, mode: 'walk', phase: (t * 1.9) % 1, skin: 'normal', t });
    ART.drawBug(ctx, 24 + Math.sin(t * 1.3 + 0.6) * 6, 208, t, 1);
    img(coinImg(Math.floor(t * 10)), 214, 172 + Math.sin(t * 3) * 3);
    logo(VW / 2, 46);
    const items = titleItems().map((i) => i.label);
    app.menu = Math.min(app.menu, items.length - 1);
    menu(items, 98, app.menu);
    if (app.best) { panel(VW / 2 - 40, 226, 80, 11, 5.5); text('REKOR ' + String(app.best).padStart(6, '0'), VW / 2, 228.2, '#ffe08a', 6, 'center', null); }
  }
  function screenBg(pl, dim, t) {
    backdrop(pl, 0, t || 0);
    ctx.fillStyle = dim; ctx.fillRect(0, 0, VW, VH);
  }
  function drawHelp() {
    screenBg(7, 'rgba(14,12,34,0.78)', app.t * 6);
    text('NASIL OYNANIR', VW / 2, 10, '#f4c531', 10, 'center');
    const story = ["Maslak'tan Ümraniye'ye, şehrin öbür ucuna git.", "Bug'ları temizle, her bölümü DEPLOY et,", `patronları yen, ${NW} hatıra parçasını topla.`];
    story.forEach((s, i) => text(s, VW / 2, 28 + i * 10, '#fff8ec', 6.4, 'center', null, 500));
    panel(10, 62, VW - 20, 58, 8);
    const keys = [['← →', 'yürü'], ['Z / BOŞLUK', 'zıpla (uzun basınca yüksek)'], ['X / SHIFT', 'koş, laptop varken kod at'], ['↓', 'ince platformdan in, araca bin']];
    keys.forEach(([k, s], i) => { text(k, 72, 68 + i * 12.5, '#9af4e4', 6.6, 'right', null); text(s, 80, 68 + i * 12.5, '#fff8ec', 6.4, 'left', null, 500); });
    panel(10, 126, VW - 20, 96, 8);
    const items = [['simit', 'SİMİT', '100 tane = +1 can'], ['cay', 'ÇAY', 'büyü, çatlak blok kır'], ['laptop', 'LAPTOP', '{ } kod fırlat'], ['kahve', 'KAHVE', 'kısa süre dokunulmazlık'], ['disket', 'DİSKET', '+1 can'], ['virus', 'VİRÜS', 'üstüne basılmaz!']];
    items.forEach(([k, name, s], i) => {
      const y = 130 + i * 15;
      if (k === 'simit') img(coinImg(0), 18, y);
      else if (k === 'virus') { ctx.save(); ctx.translate(26, y + 15); ctx.scale(0.85, 0.85); ART.drawVirus(ctx, 0, 0, app.t); ctx.restore(); }
      else ART.drawItem(ctx, k, 18, y, app.t);
      text(name, 40, y + 4, k === 'virus' ? '#ff9a80' : '#f4c531', 6.6, 'left', null);
      text(s, 92, y + 4, '#fff8ec', 6.4, 'left', null, 500);
    });
    if (Math.floor(app.t * 2) % 2) text('DEVAM İÇİN Z', VW / 2, 228, '#f4c531', 6.6, 'center');
  }
  // Bölüm seç: 11 dünya × 3 bölüm
  const SEL = { y0: 27, row: 13.4, x0: 144, col: 36 };
  function selectTap(x, y) {
    if (y < 22 && x < 70) { menuKey('back'); return; }
    const w = Math.floor((y - SEL.y0 + 3) / SEL.row), c = Math.floor((x - SEL.x0 + 2) / SEL.col);
    if (w < 0 || w > NW - 1) return;
    const sec = c >= 0 && c <= 2 ? c : app.selS;
    if (w === app.selW && sec === app.selS) { menuKey('ok'); return; }
    app.selW = w; app.selS = sec; AU.sfx('move');
  }
  function drawSelect() {
    const w = app.selW;
    screenBg(w * 3 + app.selS, 'rgba(14,12,34,0.62)', app.t * 8);
    panel(4, 4, 52, 14, 7); ART.poly(ctx, [12, 11, 17, 7.6, 17, 14.4], '#c8ccdc', null); text('GERİ', 21, 6.8, '#c8ccdc', 6.4, 'left', null);
    text('BÖLÜM SEÇ', VW / 2, 6, '#f4c531', 9, 'center');
    panel(4, SEL.y0 - 5, VW - 8, NW * SEL.row + 2, 8, 'rgba(18,16,44,0.78)');
    for (let i = 0; i < NW; i++) {
      const y = SEL.y0 + i * SEL.row, on = i === w;
      if (on) { ART.rr(ctx, 7, y - 3.2, VW - 14, SEL.row - 1.6, 6); ctx.fillStyle = 'rgba(244,197,49,0.16)'; ctx.fill(); }
      ART.circle(ctx, 17, y + 3.9, 5.2, on ? '#f4c531' : '#2e3460', null);
      text(`${i + 1}`, 17, y + 0.8, on ? '#2a1a10' : '#9af4e4', 6, 'center', null);
      text(WORLDS[i].name, 28, y + 0.6, on ? '#ffffff' : '#d4d8e8', 6.6, 'left', null);
      ctx.globalAlpha = app.pieces[i] ? 1 : 0.22;
      ART.drawPiece(ctx, i, 130, y + 3.9, 0.56, app.t);
      ctx.globalAlpha = 1;
      for (let k = 0; k < 3; k++) {
        const x = SEL.x0 + k * SEL.col, sel = on && k === app.selS;
        ART.rr(ctx, x, y - 2.2, 32, 11.2, 5.6);
        ctx.fillStyle = sel ? '#f4c531' : k === 2 ? '#7a2e3a' : '#2e3460'; ctx.fill();
        if (sel) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.9; ctx.stroke(); }
        text(`${i + 1}-${k + 1}`, x + 16, y + 0.4, sel ? '#2a1a10' : '#fff8ec', 6, 'center', null);
        // el yapımı bölümler: alınan altın simitler düğmenin sağında üç küçük nokta
        if (LEVELS[i * 3 + k].hand) {
          const m = app.golds[i * 3 + k] || 0;
          for (let j = 0; j < 3; j++) ART.circle(ctx, x + 28.6, y + 0.4 + j * 2.9, 1.05, (m >> j) & 1 ? '#f4c531' : 'rgba(255,255,255,0.25)', (m >> j) & 1 ? '#6a4a0a' : null, 0.4);
        }
      }
    }
    const L = LEVELS[w * 3 + app.selS];
    panel(4, 192, VW - 8, 44, 9, 'rgba(18,16,44,0.88)');
    text(WORLDS[w].name + ' · ' + L.name, VW / 2, 196, '#ffffff', 7.4, 'center', null);
    let info = L.boss ? 'Patron: ' + L.bossName : `${L.map[0].length} karo uzunluğunda`;
    if (L.hand) { const m = app.golds[w * 3 + app.selS] || 0; info += ` · altın simit ${(m & 1) + ((m >> 1) & 1) + ((m >> 2) & 1)}/3`; }
    text(info, VW / 2, 209, L.boss ? '#ffa288' : '#aab0c8', 6.4, 'center', null, 500);
    if (Math.floor(app.t * 2) % 2) text('BAŞLAMAK İÇİN Z', VW / 2, 223, '#f4c531', 6.6, 'center', null);
  }
  // ---------- İstanbul yol haritası: Maslak'tan Ümraniye'ye ----------
  // Dünyaların harita üzerindeki yerleri (kutuya göre 0..1)
  // Maslak, Kapalıçarşı, Şişli, Üsküdar, Ataşehir, Yerebatan, Köprü, Eyüp, Şile, Sanayi, Çamlıca, Ümraniye
  // dünyaların haritadaki yerleri (v2.0 sırası): Maslak, Kapalıçarşı, Şişli, Üsküdar, Ataşehir, Yerebatan, Köprü, Eyüp,
  // Şile, Sanayi (Dudullu), Çamlıca, Ümraniye. Şile haritanın çok doğusunda kalır: Karadeniz kıyısında kenarda, yön okuyla.
  const ROUTE = [[0.46, 0.22], [0.44, 0.745], [0.49, 0.40], [0.655, 0.71], [0.87, 0.76], [0.515, 0.775], [0.635, 0.46], [0.36, 0.58], [0.955, 0.17], [0.92, 0.5], [0.76, 0.655], [0.85, 0.6]];
  const W_SILE = 8, W_CAMLICA = 10, W_HOME = 11;
  const STRAIT = [[0.67, -0.02], [0.69, 0.12], [0.63, 0.28], [0.645, 0.4], [0.625, 0.5], [0.605, 0.62], [0.585, 0.72], [0.575, 0.84]];
  const mapCache = ART.cache();
  function mapBase(w, h) {
    let c = mapCache.get(w + ':' + h);
    if (c) return c;
    c = ART.mk(w, h, (g) => {
      const M = (u, v) => [u * w, v * h];
      g.fillStyle = '#efe2c2'; g.fillRect(0, 0, w, h);
      // Asya yakası biraz daha yeşil
      g.fillStyle = 'rgba(150,190,120,0.18)'; g.beginPath(); g.moveTo(w, 0); STRAIT.forEach(([u, v]) => g.lineTo(...M(u, v))); g.lineTo(w, h); g.closePath(); g.fill();
      const sea = '#6ab4e0';
      // Karadeniz ve Marmara
      g.fillStyle = sea; g.beginPath(); g.moveTo(0, 0); for (let u = 0; u <= 1.001; u += 0.05) g.lineTo(u * w, (0.05 + 0.02 * Math.sin(u * 17)) * h); g.lineTo(w, 0); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(0, h);
      for (const [u, v] of [[0, 0.8], [0.12, 0.82], [0.28, 0.83], [0.42, 0.85], [0.52, 0.84], [0.57, 0.82], [0.6, 0.83], [0.63, 0.88], [0.7, 0.9], [0.78, 0.89], [0.86, 0.92], [1, 0.95]]) g.lineTo(...M(u, v));
      g.lineTo(w, h); g.closePath(); g.fill();
      // Boğaz ve Haliç
      g.strokeStyle = sea; g.lineJoin = 'round'; g.lineCap = 'round';
      g.lineWidth = w * 0.034; g.beginPath(); STRAIT.forEach(([u, v], i) => (i ? g.lineTo : g.moveTo).call(g, ...M(u, v))); g.stroke();
      for (const [lw, pts] of [[w * 0.022, [[0.59, 0.71], [0.52, 0.68]]], [w * 0.016, [[0.52, 0.68], [0.44, 0.645]]], [w * 0.01, [[0.44, 0.645], [0.36, 0.6]]]]) { g.lineWidth = lw; g.beginPath(); g.moveTo(...M(...pts[0])); g.lineTo(...M(...pts[1])); g.stroke(); }
      // kıyı çizgisi gölgesi, köprüler
      g.fillStyle = 'rgba(255,255,255,0.35)'; for (let k = 0; k < 18; k++) { const u = (k * 0.137) % 1, v = 0.88 + (k % 4) * 0.025; if (v > 0.9) g.fillRect(u * w, v * h, 4, 0.6); }
      for (const [v, u] of [[0.46, 0.635], [0.3, 0.64]]) {
        g.strokeStyle = '#6a5a4a'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(...M(u - 0.045, v)); g.lineTo(...M(u + 0.045, v)); g.stroke();
        for (const du of [-0.025, 0.025]) { g.lineWidth = 1; g.beginPath(); g.moveTo(...M(u + du, v)); g.lineTo(M(u + du, v)[0], M(u + du, v)[1] - 5); g.stroke(); }
        g.lineWidth = 0.5; g.beginPath(); g.moveTo(...M(u - 0.045, v)); g.quadraticCurveTo(M(u - 0.025, v)[0], M(u, v)[1] - 7, M(u - 0.025, v)[0], M(u, v)[1] - 5); g.moveTo(M(u - 0.025, v)[0], M(u, v)[1] - 5); g.quadraticCurveTo(M(u, v)[0], M(u, v)[1] - 1, M(u + 0.025, v)[0], M(u, v)[1] - 5); g.stroke();
      }
      // mahalle dokusu
      const r = ART.rng(77);
      for (let i = 0; i < 140; i++) { const u = r(), v = 0.1 + r() * 0.75; g.fillStyle = 'rgba(160,130,100,0.18)'; g.fillRect(u * w, v * h, 2, 1.4); }
      // küçük simgeler: Maslak plazaları, Galata Kulesi, tarihi yarımadanın kubbeleri, Kız Kulesi, Çamlıca çamları
      const K = '#5a4a3a';
      for (const [du, hh] of [[-0.06, 9], [-0.045, 13], [-0.03, 7]]) { const [px, py] = M(0.46 + du, 0.2); g.fillStyle = '#7ab0d8'; g.fillRect(px, py - hh, 3.4, hh); g.strokeStyle = K; g.lineWidth = 0.4; g.strokeRect(px, py - hh, 3.4, hh); }
      { const [px, py] = M(0.465, 0.6); g.fillStyle = '#d8c8a8'; g.fillRect(px - 1.6, py - 7, 3.2, 7); g.fillStyle = '#4e5a70'; g.beginPath(); g.moveTo(px - 2.2, py - 7); g.lineTo(px + 2.2, py - 7); g.lineTo(px, py - 11); g.closePath(); g.fill(); }
      for (const [u, v] of [[0.43, 0.715], [0.53, 0.73]]) {
        const [px, py] = M(u, v); g.fillStyle = '#b8b0c8'; g.beginPath(); g.arc(px, py, 3, Math.PI, 0); g.fill(); g.fillRect(px - 3.4, py, 6.8, 1.6);
        g.fillRect(px - 5, py - 6, 0.9, 7.6); g.fillRect(px + 4.2, py - 6, 0.9, 7.6);
      }
      { const [px, py] = M(0.598, 0.735); g.fillStyle = '#f4efe4'; g.fillRect(px - 1, py - 4, 2, 4); g.fillStyle = '#7e8c9e'; g.beginPath(); g.moveTo(px - 1.4, py - 4); g.lineTo(px + 1.4, py - 4); g.lineTo(px, py - 6.4); g.closePath(); g.fill(); }
      for (let i = 0; i < 9; i++) { const [px, py] = M(0.73 + (i % 3) * 0.035, 0.7 + Math.floor(i / 3) * 0.045); g.fillStyle = '#5a8a4a'; g.beginPath(); g.moveTo(px - 2, py); g.lineTo(px + 2, py); g.lineTo(px, py - 4.4); g.closePath(); g.fill(); }
    });
    mapCache.set(w + ':' + h, c);
    return c;
  }
  function routeMap(x, y, w, h, cur) {
    ART.rr(ctx, x - 2, y - 2, w + 4, h + 4, 6); ctx.fillStyle = '#2a1e14'; ctx.fill();
    ctx.save(); ART.rr(ctx, x, y, w, h, 5); ctx.clip();
    img(mapBase(w, h), x, y);
    const P = ROUTE.map(([u, v]) => [x + u * w, y + v * h]);
    // gidilecek yol kesik, geçilen yol altın; her yolculuk hafif bir kavis (yukarı ve aşağı katman arasında gidip gelen yol)
    const legs = (n) => {
      ctx.beginPath(); ctx.moveTo(...P[0]);
      for (let i = 1; i <= n; i++) {
        const [ax, ay] = P[i - 1], [bx, by] = P[i], dx = bx - ax, dy = by - ay, k = (i % 2 ? 0.16 : -0.16);
        ctx.quadraticCurveTo((ax + bx) / 2 - dy * k, (ay + by) / 2 + dx * k, bx, by);
      }
    };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.setLineDash([2.2, 2.4]); ctx.strokeStyle = 'rgba(90,60,40,0.7)'; ctx.lineWidth = 1.2;
    legs(P.length - 1); ctx.stroke(); ctx.setLineDash([]);
    if (cur > 0) { ctx.strokeStyle = '#1a1430'; ctx.lineWidth = 3.2; legs(cur); ctx.stroke(); ctx.strokeStyle = '#f4c531'; ctx.lineWidth = 1.8; ctx.stroke(); }
    // yol üstünde Çamlıca Kulesi, hedef: Ümraniye'deki ev ve atölye; Şile kenarda, doğuyu gösteren okla
    const [gx, gy] = P[W_CAMLICA], [ux, uy] = P[W_HOME], [sx, sy] = P[W_SILE];
    ART.poly(ctx, [sx + 5, sy - 2.2, sx + 9, sy - 2.2, sx + 9, sy - 4.4, sx + 13, sy, sx + 9, sy + 4.4, sx + 9, sy + 2.2, sx + 5, sy + 2.2], '#5a3a24', null);
    ART.box(ctx, ux - 4, uy - 9, 8, 6, 0.6, '#e8d8b8', '#1a1430', 0.6); ART.poly(ctx, [ux - 5, uy - 9, ux + 5, uy - 9, ux, uy - 13], '#c8503a', '#1a1430', 0.6);
    ART.box(ctx, ux + 2, uy - 14, 2, 4, 0.3, '#6a5a5a', null);
    for (let k = 0; k < 3; k++) ART.circle(ctx, ux + 3 + k * 1.4, uy - 16 - k * 2.4 - (app.t * 3 % 2), 0.9 + k * 0.4, `rgba(220,220,220,${0.6 - k * 0.15})`, null);
    ART.lin(ctx, gx + 6, gy + 2, gx + 6, gy - 16, '#5a6488', 1.6);
    ART.ellipse(ctx, gx + 6, gy - 18, 3.2, 4, '#7ac0f0', '#1a1430', 0.6);
    ART.lin(ctx, gx + 6, gy - 22, gx + 6, gy - 27, '#5a6488', 0.8); ART.circle(ctx, gx + 6, gy - 27.5, 0.9, '#ff4a4a', null);
    // duraklar
    P.forEach(([px, py], i) => {
      const done = i < cur, now = i === cur;
      if (now) { const k = 3 + (Math.sin(app.t * 6) + 1) * 1.6; ART.circle(ctx, px, py, k + 2, null, 'rgba(255,255,255,0.8)', 1); }
      ART.circle(ctx, px, py, now ? 3.6 : 2.8, done ? '#f4c531' : now ? '#ffffff' : '#c8bca8', '#1a1430', 0.8);
      if (app.pieces[i]) ART.circle(ctx, px, py, 1.2, '#2a8a5a', null);
    });
    // bulunulan yerin üstünde kahramanın başı
    const [hx, hy] = P[cur];
    ART.drawHead(ctx, hx, hy - 9 - Math.abs(Math.sin(app.t * 4)) * 1.5, 4.2, { skin: app.S.power === 2 ? 'hacker' : 'normal' });
    ctx.restore();
    text('MASLAK', P[0][0], P[0][1] + 4, '#5a3a24', 5, 'center', null);
    text('ÜMRANİYE', Math.min(ux, x + w - 18), uy + 4.5, '#5a3a24', 5, 'center', null);
    text('ŞİLE', sx - 4, sy + 4.5, '#5a3a24', 5, 'center', null);
  }
  function drawIntro() {
    const L = LEVELS[app.S.stage], Wd = WORLDS[L.world - 1], wi = L.world - 1;
    screenBg(wi * 3 + L.section - 1, 'rgba(10,8,28,0.7)', app.introT * 10);
    hud(null);
    panel(10, 20, VW - 20, 216, 10);
    text(`DÜNYA ${L.world}-${L.section}`, VW / 2, 24, '#fff8ec', 9.4, 'center');
    text(Wd.name + ' · ' + L.name, VW / 2, 38, '#9af4e4', 7, 'center', null, 500);
    routeMap(20, 50, VW - 40, 132, wi);
    // hatıra parçaları: toplananlar parlak, kalanlar soluk
    for (let i = 0; i < NW; i++) {
      const px = 28 + i * (VW - 56) / (NW - 1), py = 196;
      ART.circle(ctx, px, py, 7.6, i === wi ? 'rgba(244,197,49,0.25)' : 'rgba(255,255,255,0.06)', null);
      ctx.globalAlpha = app.pieces[i] ? 1 : 0.2; ART.drawPiece(ctx, i, px, py, 0.46, app.t); ctx.globalAlpha = 1;
    }
    const big = app.S.power > 0, hy = 228;
    if (L.boss) text('Patron: ' + L.bossName, 20, 214, '#ffa288', 6.6, 'left', null);
    ART.drawHero(ctx, VW - 66, hy, { big: false, face: 1, mode: 'stand', skin: app.S.power === 2 ? 'hacker' : 'normal', t: app.t });
    text('× ' + app.S.lives, VW - 56, hy - 10, '#fff8ec', 8, 'left');
    void big;
  }
  function drawPause() {
    drawPlay();
    app.menuItems = [];
    ctx.fillStyle = 'rgba(10,8,28,0.6)'; ctx.fillRect(0, 0, VW, VH);
    text('DURAKLATILDI', VW / 2, 66, '#f4c531', 11, 'center');
    menu(['DEVAM', 'BÖLÜMÜ BAŞTAN AL', 'ANA MENÜ'], 100, app.menu);
  }
  function drawOver() {
    const w = app.S ? Math.min(NW - 1, Math.floor(app.S.stage / 3)) : 0;
    screenBg(w * 3, 'rgba(10,8,28,0.82)', 0);
    text('OYUN BİTTİ', VW / 2, 64, '#ff7a6a', 16, 'center');
    text('SKOR ' + String(app.S.score).padStart(6, '0'), VW / 2, 96, '#fff8ec', 8, 'center', null);
    const wn = Math.floor(app.S.stage / 3) + 1;
    if (app.overT > 1.2) menu([`DEVAM ET (DÜNYA ${wn} BAŞI)`, 'ANA MENÜ'], 140, app.menu, 15, 170);
    else app.menuItems = [];
  }
  function drawEnd() {
    // hikâyenin son karesi (atölye) sürer; üstte yalnız skor ve toplanan parçalar
    const dur = ST.SCENES.son.dur;
    ST.draw(ctx, 'son', dur - 3 + (app.endT % 2), { pieces: app.pieces });
    panel(VW / 2 - 78, 6, 156, 34, 10, 'rgba(22,18,48,0.78)');
    text(String(app.S.score).padStart(6, '0'), VW / 2, 9.5, '#ffe08a', 8, 'center', null);
    for (let i = 0; i < NW; i++) {
      ctx.globalAlpha = app.pieces[i] ? 1 : 0.22;
      ART.drawPiece(ctx, i, VW / 2 - (NW - 1) * 6.5 + i * 13, 30, 0.6, app.t);
    }
    ctx.globalAlpha = 1;
    app.menuItems = [];
    if (app.endT > 3 && Math.floor(app.t * 2) % 2) { panel(VW / 2 - 50, 222, 100, 13, 6.5); text('ANA MENÜ İÇİN Z', VW / 2, 224.6, '#f4c531', 6, 'center', null); }
  }

  function render() {
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'low';
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (app.screen !== 'title' && app.screen !== 'pause' && app.screen !== 'over') app.menuItems = [];
    switch (app.screen) {
      case 'title': drawTitle(); break;
      case 'help': drawHelp(); break;
      case 'select': drawSelect(); break;
      case 'intro': drawIntro(); break;
      case 'play': drawPlay(); break;
      case 'pause': drawPause(); break;
      case 'over': drawOver(); break;
      case 'end': drawEnd(); break;
      case 'story': ST.draw(ctx, app.story.id, app.story.t, { pieces: app.pieces }); break;
    }
  }

  // ---------- kumanda köprüsü (remote.js) ----------
  window.__ba.bridge = {
    input(state) { for (const k of ['left', 'right', 'down', 'jump', 'run']) remote[k] = !!state[k]; },
    button(b) { AU.unlock(); if (b === 'pause') menuKey('start'); else if (b === 'ok') menuKey('ok'); else if (b === 'up') menuKey('up'); else if (b === 'down') menuKey('down'); else if (b === 'left') menuKey('left'); else if (b === 'right') menuKey('right'); else if (b === 'back') menuKey('back'); },
    release() { for (const k of Object.keys(remote)) remote[k] = false; },
    info() {
      const G = app.G;
      return { screen: app.screen, paused: app.screen === 'pause', lives: app.S ? app.S.lives : 0, stage: app.S ? `${LEVELS[Math.min(26, app.S.stage)].world}-${LEVELS[Math.min(26, app.S.stage)].section}` : '', power: G ? G.S.power : 0 };
    },
    open: null,
  };

  AU.playMusic && document.addEventListener('pointerdown', () => { if (app.screen === 'title' && !AU.current()) AU.playMusic('title'); }, { once: false });
  addEventListener('keydown', () => { if (app.screen === 'title' && !AU.current()) AU.playMusic('title'); });
  requestAnimationFrame(frame);
})();
