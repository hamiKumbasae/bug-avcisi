// Bug Avcısı: İstanbul — oyun kabuğu: çizim, kamera, HUD, menüler, giriş, ses.
(function () {
  'use strict';
  const BA = window.BA, ART = window.BA_ART, SC = window.BA_SCENE, AU = window.BA_AUDIO, ST = window.BA_STORY;
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
  const app = {
    screen: 'title', menu: 0, menuItems: [], t: 0, S: null, G: null, introT: 0, overT: 0, endT: 0,
    progress: store.get('ba-ilerleme', 1), best: store.get('ba-rekor', 0), titleT: 0, selW: 0, selS: 0,
    pieces: store.get('ba-parcalar', [false, false, false, false, false, false, false, false, false]),
  };
  window.__ba = { app, BA, start: (stage) => startRun(stage || 0), render: () => render(), story: (id, then) => playStory(id, then || toTitle) };

  function startRun(stage, prologue) {
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
  function toIntro() {
    app.screen = 'intro'; app.introT = 0; app.G = null;
    AU.stopMusic();
  }
  function beginStage() {
    app.G = BA.loadStage(app.S, app.S.stage);
    app.screen = 'play';
    AU.setRate(1);
    AU.playMusic(AU.WORLD_SONG[app.G.world]);
    AU.ambient(AU.WORLD_AMB[app.G.world], 0.45);
  }
  function pauseGame() { if (app.screen !== 'play') return; app.screen = 'pause'; app.menu = 0; AU.sfx('pause'); AU.stopMusic(); AU.stopAmbient(0.3); }
  function resume() {
    app.screen = 'play';
    const G = app.G;
    AU.playMusic(G.boss && !G.boss.dead ? 'boss' : AU.WORLD_SONG[G.world]);
    AU.ambient(AU.WORLD_AMB[G.world], 0.45);
    AU.setRate(G.hurry ? 1.25 : 1);
  }
  function saveScore() {
    if (app.S && app.S.score > app.best) { app.best = app.S.score; store.set('ba-rekor', app.best); }
  }
  function toTitle() { saveScore(); app.screen = 'title'; app.menu = 0; app.G = null; AU.stopAmbient(); AU.playMusic('title'); }

  function titleItems() {
    const items = [{ label: 'OYNA', act: () => startRun(0, true) }];
    if (app.progress > 1) items.push({ label: `DEVAM: DÜNYA ${app.progress}`, act: () => startRun((app.progress - 1) * 3) });
    items.push({ label: 'BÖLÜM SEÇ', act: () => { app.screen = 'select'; app.selW = Math.min(8, app.progress - 1); app.selS = 0; } });
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
      if (k === 'up') { app.selW = (app.selW + 8) % 9; AU.sfx('move'); }
      if (k === 'down') { app.selW = (app.selW + 1) % 9; AU.sfx('move'); }
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
        case 'piece': AU.sfx('piece'); app.pieces[e.world] = true; store.set('ba-parcalar', app.pieces); break;
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
      if (app.introT > 2.6) beginStage();
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
        if (BA.afterDeath(app.S)) toIntro();
        else { app.screen = 'over'; app.overT = 0; app.menu = 0; AU.sfx('over'); saveScore(); }
      } else if (G.result === 'clear') {
        BA.afterClear(app.S);
        const w = Math.min(9, Math.floor(app.S.stage / 3) + 1);
        if (w > app.progress && app.S.stage < 27) { app.progress = w; store.set('ba-ilerleme', w); }
        AU.stopAmbient(0.6);
        if (app.S.stage >= 27) {
          saveScore();
          const toEnd = () => { app.screen = 'end'; app.endT = 0; AU.sfx('win'); setTimeout(() => { if (app.screen === 'end') AU.playMusic('son'); }, 1600); };
          if (ST.has('son')) playStory('son', toEnd); else toEnd();
        } else if (app.S.stage % 3 === 0 && ST.has('ara' + app.S.stage / 3)) playStory('ara' + app.S.stage / 3, toIntro);
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
  function layerDraw(c, off) {
    const Wd = Math.round(c.lw * S), Hd = Math.round(c.lh * S);
    let X = -Math.round((((off % c.lw) + c.lw) % c.lw) * S);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (; X < canvas.width; X += Wd) ctx.drawImage(c, X, 0, Wd, Hd);
    ctx.setTransform(S, 0, 0, S, 0, 0);
  }
  function backdrop(w, cam, t) {
    full(SC.sky(w, VW, VH));
    const L = SC.layers(w);
    layerDraw(L.far, cam * 0.15 + (t || 0) * 0.3);
    layerDraw(L.near, cam * 0.4 + (t || 0));
    if (!ART.WORLD[w].water) {
      // zemin hizasının altı kararır: çukurlar çukur gibi görünsün
      const gr = ctx.createLinearGradient(0, TOP + 12.2 * TS, 0, VH);
      gr.addColorStop(0, 'rgba(12,10,30,0)'); gr.addColorStop(1, 'rgba(12,10,30,0.7)');
      ctx.fillStyle = gr; ctx.fillRect(0, TOP + 12.2 * TS, VW, VH);
    }
    water(w, cam + (t || 0) * 2.5);
  }
  function water(w, cam) {
    const col = ART.WORLD[w].water;
    if (!col) return;
    const y0 = TOP + 12.4 * TS;
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
    panel(147, y, 52, h, 6.5); clockIcon(157, y + 6.5, 4.2);
    const tm = G ? Math.ceil(G.time) : L.time;
    const warn = G && G.time < 100 && G.phase === 'play' && Math.floor(app.t * 4) % 2;
    text(String(tm).padStart(3, '0'), 180, ty, warn ? '#ff7a6a' : '#fff8ec', sz, 'center');
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
  function drawPlay() {
    const G = app.G, w = G.world;
    let sx = 0, sy = 0;
    if (G.shake > 0) { sx = (Math.random() - 0.5) * 4; sy = (Math.random() - 0.5) * 4; }
    const cam = Math.round(G.cam * TS * S) / S;
    if (G.area === 'room') full(SC.metro(w, VW, VH)); else backdrop(w, cam);
    const ox = -cam + sx, oy = TOP + sy;
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
    for (let ty = 0; ty < BA.H; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const i = ty * G.W + tx, t = G.grid[i];
        if (!t) continue;
        const px = tx * TS, py = ty * TS + (bumpOff.get(i) || 0);
        const tw = G.room && tx >= G.room.x0 ? ART.METRO : w; // bonus odası metro karolarıyla
        if (t === 1) put(ART.tile(tw, ty > 0 && G.grid[i - G.W] === 1 ? 'fill' : 'surf'), px, py);
        else if (t === 4) put(ART.tile(tw, 'block', blink), px, py);
        else if (TILEK[t]) put(ART.tile(tw, TILEK[t]), px, py);
      }
    }
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.save();
    ctx.translate(ox, oy);
    // simitler
    const coin = coinImg(Math.floor(app.t * 10));
    for (let ty = 0; ty < BA.H; ty++) for (let tx = x0; tx <= x1; tx++) if (G.coins[ty * G.W + tx]) img(coin, tx * TS, ty * TS);
    // kayıt noktası ve DEPLOY
    if (G.checkpoint) ART.drawCheckpoint(ctx, G.checkpoint.x * TS, (G.checkpoint.y - 1) * TS, G.checkpoint.on, app.t);
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
    // metro girişi, çıkışı ve odadaki yürüyen merdiven
    if (G.room) {
      const [, ln, lc] = SC.station(w);
      for (const m of [G.metroIn, G.metroOut]) if (m && m.x > G.cam - 3 && m.x < G.cam + 18) ART.drawMetroGate(ctx, m.x * TS, m.y * TS, app.t, lc, ln);
      const ex = G.room.exit;
      if (ex && G.area === 'room') ART.drawEscalator(ctx, ex.x * TS, ex.y * TS, app.t, lc);
      // girişin üstünde dururken aşağı ok
      const p = G.player, mi = G.metroIn;
      if (mi && !G.warp && G.area === 'main' && p.onGround && Math.abs(p.x + p.w / 2 - mi.x - 1) < 0.8 && Math.abs(p.y + p.h - mi.y - 1) < 0.05) {
        const ay = (mi.y - 3.4) * TS + Math.abs(Math.sin(app.t * 5)) * 3, ax = (mi.x + 1) * TS;
        ART.poly(ctx, [ax - 4, ay, ax + 4, ay, ax + 4, ay + 4, ax + 7, ay + 4, ax, ay + 10, ax - 7, ay + 4, ax - 4, ay + 4], '#ffffff', '#1a1430', 0.9);
      }
    }
    // hareketli platformlar ve dönen kıvılcımlar
    for (const pl of G.plats) ART.drawLift(ctx, pl.x * TS, pl.y * TS, pl.w * TS);
    for (const b of G.bars) {
      img(ART.tile(w, 'anchor'), (b.cx - 0.5) * TS, (b.cy - 0.5) * TS);
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
    for (const f of G.fx) drawFx(f, w);
    ctx.restore();
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
    if (G.time < 100 && G.time > 97 && G.phase === 'play') text('ACELE ET!', VW / 2, 60, '#ff7a6a', 14, 'center');
    // metro geçişinde ekran kararıp açılır
    if (G.warp) {
      const t = G.warp.t, a = t < 0.5 ? 0 : t < 0.85 ? (t - 0.5) / 0.35 : Math.max(0, 1 - (t - 0.85) / 0.3);
      if (a > 0) { ctx.fillStyle = `rgba(8,8,16,${a})`; ctx.fillRect(0, 0, VW, VH); }
    }
    hud(G);
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
      case 'bug': ART.drawBug(ctx, cx, by, e.t, e.vx > 0 ? 1 : -1, e.dead && !e.flip); break;
      case 'virus': ART.drawVirus(ctx, cx, by + 1, e.t); break;
      case 'spam': ART.drawSpam(ctx, cx, by + 1, e.t, e.vx > 0 ? 1 : -1); break;
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
  function screenBg(w, dim, t) {
    backdrop(w, 0, t || 0);
    ctx.fillStyle = dim; ctx.fillRect(0, 0, VW, VH);
  }
  function drawHelp() {
    screenBg(2, 'rgba(14,12,34,0.78)', app.t * 6);
    text('NASIL OYNANIR', VW / 2, 10, '#f4c531', 10, 'center');
    const story = ["İstanbul'un sistemlerine bug'lar sızdı!", 'Her bölümün sonundaki DEPLOY', 'terminaline ulaş, patronları yen.'];
    story.forEach((s, i) => text(s, VW / 2, 28 + i * 10, '#fff8ec', 6.4, 'center', null, 500));
    panel(10, 62, VW - 20, 58, 8);
    const keys = [['← →', 'yürü'], ['Z / BOŞLUK', 'zıpla (uzun basınca yüksek)'], ['X / SHIFT', 'koş, laptop varken kod at'], ['↓', 'ince platformdan in, metroya gir']];
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
  // Bölüm seç: 9 dünya × 3 bölüm
  const SEL = { y0: 30, row: 17, x0: 144, col: 36 };
  function selectTap(x, y) {
    if (y < 22 && x < 70) { menuKey('back'); return; }
    const w = Math.floor((y - SEL.y0 + 3) / SEL.row), c = Math.floor((x - SEL.x0 + 2) / SEL.col);
    if (w < 0 || w > 8) return;
    const sec = c >= 0 && c <= 2 ? c : app.selS;
    if (w === app.selW && sec === app.selS) { menuKey('ok'); return; }
    app.selW = w; app.selS = sec; AU.sfx('move');
  }
  function drawSelect() {
    const w = app.selW;
    screenBg(w, 'rgba(14,12,34,0.62)', app.t * 8);
    panel(4, 4, 52, 14, 7); ART.poly(ctx, [12, 11, 17, 7.6, 17, 14.4], '#c8ccdc', null); text('GERİ', 21, 6.8, '#c8ccdc', 6.4, 'left', null);
    text('BÖLÜM SEÇ', VW / 2, 6, '#f4c531', 9, 'center');
    panel(4, SEL.y0 - 6, VW - 8, 9 * SEL.row + 2, 8, 'rgba(18,16,44,0.78)');
    for (let i = 0; i < 9; i++) {
      const y = SEL.y0 + i * SEL.row, on = i === w;
      if (on) { ART.rr(ctx, 7, y - 4, VW - 14, SEL.row - 2, 6); ctx.fillStyle = 'rgba(244,197,49,0.16)'; ctx.fill(); }
      ART.circle(ctx, 17, y + 4.5, 5.6, on ? '#f4c531' : '#2e3460', null);
      text(`${i + 1}`, 17, y + 1.2, on ? '#2a1a10' : '#9af4e4', 6.4, 'center', null);
      text(WORLDS[i].name, 28, y + 0.8, on ? '#ffffff' : '#d4d8e8', 6.8, 'left', null);
      ctx.globalAlpha = app.pieces[i] ? 1 : 0.22;
      ART.drawPiece(ctx, i, 130, y + 4.5, 0.62, app.t);
      ctx.globalAlpha = 1;
      for (let k = 0; k < 3; k++) {
        const x = SEL.x0 + k * SEL.col, sel = on && k === app.selS;
        ART.rr(ctx, x, y - 3, 32, 13, 6.5);
        ctx.fillStyle = sel ? '#f4c531' : k === 2 ? '#7a2e3a' : '#2e3460'; ctx.fill();
        if (sel) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.9; ctx.stroke(); }
        text(`${i + 1}-${k + 1}`, x + 16, y + 0.4, sel ? '#2a1a10' : '#fff8ec', 6.4, 'center', null);
      }
    }
    const L = LEVELS[w * 3 + app.selS];
    panel(4, 186, VW - 8, 50, 9, 'rgba(18,16,44,0.88)');
    text(WORLDS[w].name + ' · ' + L.name, VW / 2, 192, '#ffffff', 7.4, 'center', null);
    text(L.boss ? 'Patron: ' + L.bossName : `${L.map[0].length} karo uzunluğunda`, VW / 2, 206, L.boss ? '#ffa288' : '#aab0c8', 6.4, 'center', null, 500);
    if (Math.floor(app.t * 2) % 2) text('BAŞLAMAK İÇİN Z', VW / 2, 222, '#f4c531', 6.6, 'center', null);
  }
  function drawIntro() {
    const L = LEVELS[app.S.stage], Wd = WORLDS[L.world - 1];
    screenBg(L.world - 1, 'rgba(10,8,28,0.66)', app.introT * 10);
    hud(null);
    const ph = (L.boss ? 128 : 114) - (app.S.power > 0 ? 0 : 14);
    panel(36, 50, VW - 72, ph, 12);
    text(`DÜNYA ${L.world}-${L.section}`, VW / 2, 60, '#fff8ec', 13, 'center');
    text(Wd.name, VW / 2, 86, '#f4c531', 8.4, 'center', null);
    text(L.name, VW / 2, 101, '#9af4e4', 7, 'center', null, 500);
    if (L.boss) text('Patron: ' + L.bossName, VW / 2, 115, '#ffa288', 7, 'center', null);
    const big = app.S.power > 0, hy = 50 + ph - 10;
    ART.rr(ctx, 92, hy - 1, 72, 4, 2); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill();
    ART.drawHero(ctx, 114, hy, { big, face: 1, mode: 'stand', skin: app.S.power === 2 ? 'hacker' : 'normal', t: app.t });
    text('× ' + app.S.lives, 126, hy - 13, '#fff8ec', 9, 'left');
  }
  function drawPause() {
    drawPlay();
    app.menuItems = [];
    ctx.fillStyle = 'rgba(10,8,28,0.6)'; ctx.fillRect(0, 0, VW, VH);
    text('DURAKLATILDI', VW / 2, 66, '#f4c531', 11, 'center');
    menu(['DEVAM', 'BÖLÜMÜ BAŞTAN AL', 'ANA MENÜ'], 100, app.menu);
  }
  function drawOver() {
    const w = app.S ? Math.min(8, Math.floor(app.S.stage / 3)) : 0;
    screenBg(w, 'rgba(10,8,28,0.82)', 0);
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
    panel(VW / 2 - 66, 6, 132, 34, 10, 'rgba(22,18,48,0.78)');
    text(String(app.S.score).padStart(6, '0'), VW / 2, 9.5, '#ffe08a', 8, 'center', null);
    for (let i = 0; i < 9; i++) {
      ctx.globalAlpha = app.pieces[i] ? 1 : 0.22;
      ART.drawPiece(ctx, i, VW / 2 - 52 + i * 13, 30, 0.62, app.t);
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
