// Bug Avcısı: İstanbul — oyun kabuğu: çizim, kamera, HUD, menüler, giriş, ses.
(function () {
  'use strict';
  const BA = window.BA, ART = window.BA_ART, AU = window.BA_AUDIO;
  const LEVELS = window.BA_LEVELS, WORLDS = window.BA_WORLDS;
  const canvas = document.getElementById('oyun');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const VW = 256, VH = 240, TS = 16, TOP = 16;
  const params = new URLSearchParams(location.search);
  if (params.has('tv')) document.body.classList.add('tv');

  // ---------- kayıt ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* yok */ } },
  };

  // ---------- yazı ----------
  if (window.FontFace && document.fonts) {
    for (const [file, range] of [
      ['latin', 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215'],
      ['latin-ext', 'U+0100-0130, U+0132-024F, U+1E00-1EFF, U+20A0-20AB, U+20AD-20CF'],
    ]) {
      new FontFace('Press Start 2P', `url(src/fonts/press-start-2p-${file}-400-normal.woff2)`, { unicodeRange: range })
        .load().then((f) => document.fonts.add(f)).catch(() => { /* monospace'e düşer */ });
    }
  }
  // Yazı tipinin büyük İ, Ö, Ü harfleri küçük harf gibi durduğu için I, O, U yazılıp noktalar elle konur.
  const DOTS = { 'İ': ['I', [3]], 'Ö': ['O', [1, 5]], 'Ü': ['U', [1, 5]] };
  function text(s, x, y, col = '#f4f0e4', size = 8, align = 'left', shadow = '#10121c') {
    s = String(s);
    ctx.font = `${size}px "Press Start 2P", monospace`;
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    const chars = [...s];
    const plain = chars.map((c) => (DOTS[c] ? DOTS[c][0] : c)).join('');
    const u = size / 8, sh = size >= 16 ? 2 : 1;
    const x0 = Math.round(x - (align === 'center' ? (chars.length * size) / 2 : align === 'right' ? chars.length * size : 0));
    const y0 = Math.round(y);
    const draw = (ox, oy, c) => {
      ctx.fillStyle = c; ctx.fillText(plain, x0 + ox, y0 + oy);
      chars.forEach((ch, i) => { if (DOTS[ch]) for (const dx of DOTS[ch][1]) ctx.fillRect(x0 + i * size + dx * u + ox, y0 - 2 * u + oy, 2 * u, u); });
    };
    if (shadow) draw(sh, sh, shadow);
    draw(0, 0, col);
  }
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
  };
  window.__ba = { app, BA, start: (stage) => startRun(stage || 0) };

  function startRun(stage) {
    app.S = BA.newRun();
    app.S.stage = stage;
    toIntro();
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
  }
  function pauseGame() { if (app.screen !== 'play') return; app.screen = 'pause'; app.menu = 0; AU.sfx('pause'); AU.stopMusic(); }
  function resume() {
    app.screen = 'play';
    const G = app.G;
    AU.playMusic(G.boss && !G.boss.dead ? 'boss' : AU.WORLD_SONG[G.world]);
    AU.setRate(G.hurry ? 1.25 : 1);
  }
  function saveScore() {
    if (app.S && app.S.score > app.best) { app.best = app.S.score; store.set('ba-rekor', app.best); }
  }
  function toTitle() { saveScore(); app.screen = 'title'; app.menu = 0; app.G = null; AU.playMusic('title'); }

  function titleItems() {
    const items = [{ label: 'OYNA', act: () => startRun(0) }];
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
    }
  }

  // ---------- olaylar → ses ----------
  const BUZZ = { die: 220, shrink: 90, power: 40, bosshit: 35, oneup: 60, clear: 80 };
  function handleEvents(G) {
    for (const e of G.ev) {
      if (BUZZ[e.e] && window.__baRemote && window.__baRemote.count()) window.__baRemote.vibrate(BUZZ[e.e]);
      switch (e.e) {
        case 'bossintro': AU.sfx('bossintro'); AU.playMusic('boss'); break;
        case 'bossdown': AU.sfx('bossdown'); AU.stopMusic(); break;
        case 'hurry': AU.sfx('hurry'); AU.setRate(1.25); break;
        case 'starend': break;
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
    update(dt);
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
        if (BA.afterDeath(app.S)) toIntro();
        else { app.screen = 'over'; app.overT = 0; app.menu = 0; AU.sfx('over'); saveScore(); }
      } else if (G.result === 'clear') {
        BA.afterClear(app.S);
        const w = Math.min(9, Math.floor(app.S.stage / 3) + 1);
        if (w > app.progress && app.S.stage < 27) { app.progress = w; store.set('ba-ilerleme', w); }
        if (app.S.stage >= 27) { app.screen = 'end'; app.endT = 0; saveScore(); AU.sfx('win'); setTimeout(() => { if (app.screen === 'end') AU.playMusic('son'); }, 1600); }
        else toIntro();
      }
    } else if (app.screen === 'over') app.overT += dt;
    else if (app.screen === 'end') app.endT += dt;
    else if (app.screen === 'title') app.titleT += dt;
  }

  // ---------- çizim ----------
  const skyCache = [];
  function sky(w) {
    if (!skyCache[w]) {
      const [a, b] = ART.WORLD[w].sky;
      skyCache[w] = ART.mk(VW, VH, (g) => {
        const gr = g.createLinearGradient(0, 0, 0, VH);
        gr.addColorStop(0, a); gr.addColorStop(1, b);
        g.fillStyle = gr; g.fillRect(0, 0, VW, VH);
      });
    }
    return skyCache[w];
  }
  function layer(img, off, y) {
    const w = img.width;
    let x = -((off % w) + w) % w;
    for (; x < VW; x += w) ctx.drawImage(img, Math.round(x), y || 0);
  }
  const ICON = {
    simit: ART.mk(8, 8, (g) => { ART.disc(g, 4, 4, 3, '#18141e'); ART.disc(g, 4, 4, 3, '#e0902e'); ART.R(g, 3, 3, 2, 2, '#18141e'); ART.R(g, 2, 1, 1, 1, '#ffe08a'); ART.R(g, 5, 5, 1, 1, '#ffe08a'); }),
    clock: ART.mk(8, 8, (g) => { ART.disc(g, 4, 4, 3, '#ece6d6'); ART.R(g, 4, 2, 1, 3, '#18141e'); ART.R(g, 4, 4, 2, 1, '#18141e'); }),
    life: ART.mk(8, 8, (g) => { ART.R(g, 1, 0, 6, 3, '#4a2c1c'); ART.R(g, 1, 3, 6, 3, '#f1b98f'); ART.R(g, 2, 3, 2, 1, '#18141e'); ART.R(g, 5, 3, 2, 1, '#18141e'); ART.R(g, 1, 6, 6, 2, '#22a391'); }),
  };

  function hud(G) {
    const S = app.S;
    ctx.fillStyle = '#10121c'; ctx.fillRect(0, 0, VW, TOP);
    text(String(S.score).padStart(6, '0'), 4, 4);
    ctx.drawImage(ICON.simit, 62, 4); text('×' + String(S.simit).padStart(2, '0'), 72, 4, '#ffe08a');
    const L = G ? G.L : LEVELS[S.stage];
    text(`${L.world}-${L.section}`, 112, 4, '#9af4e4');
    ctx.drawImage(ICON.clock, 150, 4);
    const tm = G ? Math.ceil(G.time) : L.time;
    text(String(tm).padStart(3, '0'), 160, 4, G && G.time < 100 && G.phase === 'play' && Math.floor(app.t * 4) % 2 ? '#ff6a5a' : '#f4f0e4');
    ctx.drawImage(ICON.life, 200, 4); text('×' + S.lives, 210, 4);
  }

  function heroSprite(G) {
    const p = G.player, S = G.S;
    let big = S.power > 0;
    if (p.growT > 0 && Math.floor(p.growT * 16) % 2) big = !big;
    let name;
    if (p.dead) name = 'small_dead';
    else {
      const pre = big ? 'big_' : 'small_';
      if (!p.onGround) name = pre + 'jump';
      else if (p.skid) name = pre + 'skid';
      else if (Math.abs(p.vx) > 0.3) name = pre + ['walk1', 'walk2', 'walk3', 'walk2'][Math.floor(p.walkT * 1.5) % 4];
      else name = pre + 'stand';
      if (big && S.power === 2 && p.shootCD > 0.08 && p.onGround) name = 'big_shoot';
    }
    let skin = S.power === 2 ? 'hacker' : 'normal';
    if (p.star > 0) skin = ['star0', 'star1', 'star2', S.power === 2 ? 'hacker' : 'normal'][Math.floor(app.t * (p.star < 2 ? 8 : 16)) % 4];
    return ART.sprite(name, skin, p.face < 0 && !p.dead);
  }

  function drawPlay() {
    const G = app.G, w = G.world, T = ART.tiles(w), W = ART.WORLD[w];
    let sx = 0, sy = 0;
    if (G.shake > 0) { sx = Math.round((Math.random() - 0.5) * 4); sy = Math.round((Math.random() - 0.5) * 4); }
    const cam = Math.round(G.cam * TS);
    ctx.drawImage(sky(w), 0, 0);
    const bg = ART.background(w);
    layer(bg.far, cam * 0.15);
    layer(bg.near, cam * 0.4);
    if (W.water) {
      const y0 = TOP + Math.round(12.4 * TS);
      ctx.fillStyle = W.water; ctx.fillRect(0, y0, VW, VH - y0);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let x = -16; x < VW + 16; x += 16) { const o = Math.round(Math.sin(app.t * 2 + x * 0.05) * 2); ctx.fillRect(x - (cam % 16), y0 + 1 + o, 8, 1); }
    }
    ctx.save();
    ctx.translate(-cam + sx, TOP + sy);
    const x0 = Math.max(0, Math.floor(G.cam) - 1), x1 = Math.min(G.W - 1, Math.floor(G.cam) + 17);
    // yükselen eşyalar blokların arkasında
    for (const it of G.items) if (it.state === 'rise') ctx.drawImage(ART.sprite(it.kind), Math.round(it.x * TS - 1), Math.round(it.y * TS - 2));
    // karolar
    const bumpOff = new Map();
    for (const b of G.bumps) bumpOff.set(b.ty * G.W + b.tx, Math.round(-Math.sin(b.t / 0.2 * Math.PI) * 5));
    const blink = Math.floor(app.t * 2.5) % 2;
    for (let ty = 0; ty < BA.H; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const i = ty * G.W + tx, t = G.grid[i];
        if (!t) continue;
        const px = tx * TS, py = ty * TS + (bumpOff.get(i) || 0);
        switch (t) {
          case 1: ctx.drawImage(ty > 0 && G.grid[i - G.W] === 1 ? T.fill : T.surf, px, py); break;
          case 2: case 8: ctx.drawImage(T.solid, px, py); break;
          case 3: ctx.drawImage(T.oneway, px, py); break;
          case 4: ctx.drawImage(T.block[blink], px, py); break;
          case 5: ctx.drawImage(T.used, px, py); break;
          case 6: ctx.drawImage(T.crack, px, py); break;
          case 7: ctx.drawImage(T.spike, px, py); break;
        }
      }
    }
    // simitler
    const sf = ['simit0', 'simit1', 'simit2', 'simit1'][Math.floor(app.t * 6) % 4];
    const simg = ART.sprite(sf, null, Math.floor(app.t * 6) % 4 === 3);
    for (let ty = 0; ty < BA.H; ty++) for (let tx = x0; tx <= x1; tx++) if (G.coins[ty * G.W + tx]) ctx.drawImage(simg, tx * TS, ty * TS);
    // kayıt noktası ve DEPLOY
    if (G.checkpoint) ctx.drawImage(T.check[G.checkpoint.on ? 1 : 0], G.checkpoint.x * TS, (G.checkpoint.y - 1) * TS);
    const gl = G.goal;
    if (gl && (gl.active || !G.bossKind)) {
      const gx = gl.x * TS, gy = gl.y * TS;
      ctx.drawImage(ART.sprite('deploy'), gx, gy);
      if (Math.floor(app.t * 3) % 2) { ctx.fillStyle = '#7cff6a'; ctx.fillRect(gx + 4, gy + 12, 1, 1); ctx.fillRect(gx + 4, gy + 16, 1, 1); }
      if (G.phase === 'clear') {
        const k = Math.min(1, G.clearT / 1.4);
        ctx.fillStyle = '#10121c'; ctx.fillRect(gx - 12, gy - 14, 40, 8);
        ctx.fillStyle = '#7cff6a'; ctx.fillRect(gx - 11, gy - 13, Math.round(38 * k), 6);
      } else {
        ctx.save(); ctx.translate(gx + 8, gy - 12); text('DEPLOY', 0, 0, '#7cff6a', 8, 'center'); ctx.restore();
      }
    }
    // hareketli platformlar ve dönen kıvılcımlar
    for (const pl of G.plats) ctx.drawImage(T.lift, 0, 0, pl.w * TS, 8, Math.round(pl.x * TS), Math.round(pl.y * TS), pl.w * TS, 8);
    const spark = ART.sprite('spark');
    for (const b of G.bars) {
      ctx.drawImage(T.anchor, (b.cx - 0.5) * TS, (b.cy - 0.5) * TS);
      for (let k = 1; k <= b.n; k++) ctx.drawImage(spark, Math.round((b.cx + Math.cos(b.a) * k * 0.45) * TS - 4), Math.round((b.cy + Math.sin(b.a) * k * 0.45) * TS - 4));
    }
    // eşyalar
    for (const it of G.items) if (it.state !== 'rise') ctx.drawImage(ART.sprite(it.kind), Math.round(it.x * TS - 1), Math.round(it.y * TS - 2));
    // düşmanlar
    for (const e of G.ents) drawEnemy(e);
    // patron
    if (G.boss) drawBoss(G);
    // oyuncu
    const p = G.player;
    if (!(p.inv > 0 && Math.floor(app.t * 20) % 2) || p.dead) {
      const img = heroSprite(G);
      ctx.drawImage(img, Math.round(p.x * TS - (TS - p.w * TS) / 2), Math.round((p.y + p.h) * TS - img.height));
    }
    // atışlar
    const shot = ART.sprite('shot');
    for (const s of G.shots) ctx.drawImage(shot, Math.round(s.x * TS), Math.round(s.y * TS));
    for (const s of G.bshots) drawBossShot(s);
    // efektler
    for (const f of G.fx) drawFx(f, T);
    ctx.restore();
    // patron canı
    if (G.boss && !G.boss.dead) {
      const b = G.boss, name = up(G.L.bossName || '');
      ctx.fillStyle = 'rgba(16,18,28,0.75)'; ctx.fillRect(0, TOP, VW, 14);
      text(name, 6, TOP + 3, '#ff8a70');
      for (let i = 0; i < b.maxHp; i++) {
        const x = VW - 8 - (b.maxHp - i) * 10, full = b.hp > i + 0.01, part = !full && b.hp > i;
        ctx.fillStyle = '#18141e'; ctx.fillRect(x, TOP + 3, 8, 8);
        ctx.fillStyle = full ? '#e2483a' : part ? '#8a3a2a' : '#3a3e48'; ctx.fillRect(x + 1, TOP + 4, 6, 6);
      }
      if (b.state === 'intro') {
        ctx.fillStyle = 'rgba(16,18,28,0.7)'; ctx.fillRect(0, 96, VW, 44);
        text('PATRON', VW / 2, 102, '#f4c531', 8, 'center');
        text(name, VW / 2, 118, '#ffffff', 16, 'center');
      }
    }
    if (G.goal && G.goal.active && G.bossKind && G.phase === 'play' && G.bossDownT < 4) {
      text('DEPLOY ET!', VW / 2, 64, Math.floor(app.t * 4) % 2 ? '#7cff6a' : '#ffffff', 16, 'center');
    }
    if (G.phase === 'clear' && G.clearT > 1.4) {
      ctx.fillStyle = 'rgba(16,18,28,0.6)'; ctx.fillRect(0, 70, VW, 44);
      text('DEPLOY BAŞARILI!', VW / 2, 78, '#7cff6a', 8, 'center');
      text('SÜRE BONUSU', VW / 2, 96, '#f4f0e4', 8, 'center');
    }
    if (G.time < 100 && G.time > 97 && G.phase === 'play') text('ACELE ET!', VW / 2, 60, '#ff6a5a', 16, 'center');
    hud(G);
  }

  function drawEnemy(e) {
    const t = app.t;
    let img;
    const fr = Math.floor(e.t * 6) % 2;
    switch (e.kind) {
      case 'bug': img = e.dead && !e.flip ? ART.sprite('bug_flat') : ART.sprite(fr ? 'bug1' : 'bug0', null, e.vx > 0); break;
      case 'virus': img = ART.sprite(fr ? 'virus1' : 'virus0'); break;
      case 'spam': img = ART.sprite(Math.floor(e.t * 8) % 2 ? 'spam1' : 'spam0', null, e.vx > 0); break;
      case 'marti': img = ART.sprite(e.state === 'dive' ? 'marti1' : (Math.floor(e.t * 7) % 2 ? 'marti1' : 'marti0'), null, e.vx < 0); break;
    }
    const x = Math.round(e.x * TS + e.w * TS / 2 - img.width / 2), y = Math.round((e.y + e.h) * TS - img.height + (e.kind === 'spam' || e.kind === 'marti' ? 2 : 0));
    if (e.dead && e.flip) {
      ctx.save(); ctx.translate(x, y + img.height); ctx.scale(1, -1); ctx.drawImage(img, 0, 0); ctx.restore();
    } else ctx.drawImage(img, x, y);
    void t;
  }

  function drawBoss(G) {
    const b = G.boss;
    if (b.kind === 'glitch' && (b.state === 'hide' || (b.state === 'appear' && Math.floor(app.t * 20) % 2) || (b.state === 'vanish' && Math.floor(app.t * 25) % 2))) return;
    let frame = Math.floor(b.t * 6) % 2;
    if (b.kind === 'sizinti') frame = Math.floor(b.t * 8) % 4;
    if (b.kind === 'truva' && b.state === 'open') frame = 2;
    if (b.kind === 'glitch') frame = Math.floor(b.t * 12) % 4;
    const hurt = (b.flash > 0 && Math.floor(app.t * 24) % 2) || (b.hurtT > 0 && Math.floor(app.t * 12) % 2);
    const img = ART.boss(b.kind, frame, hurt);
    let flip = false;
    if (b.kind === 'truva') flip = b.face < 0;
    if (b.kind === 'marti') flip = b.face < 0;
    const x = Math.round((b.x + b.w / 2) * TS - img.width / 2);
    const y = Math.round((b.y + b.h) * TS - img.height + (b.kind === 'kralbug' ? 4 : b.kind === 'spam' ? 6 : b.kind === 'marti' ? 6 : 0));
    let shakeX = 0;
    if ((b.kind === 'truva' && b.state === 'shake') || (b.kind === 'kralbug' && b.state === 'go' && b.st > 1.5)) shakeX = Math.floor(app.t * 30) % 2 ? 1 : -1;
    ctx.save();
    if (b.dead) { ctx.translate(x, y + img.height); ctx.scale(1, -1); ctx.drawImage(img, 0, 0); }
    else if (flip) { ctx.translate(x + img.width + shakeX, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0); }
    else ctx.drawImage(img, x + shakeX, y);
    ctx.restore();
    if (b.kind === 'dongu' && !b.dead) {
      const spark = ART.sprite('spark');
      for (let k = 0; k < 3; k++) {
        const a = b.orb + k * Math.PI * 2 / 3;
        ctx.drawImage(spark, Math.round((b.x + b.w / 2 + Math.cos(a) * 1.8) * TS - 4), Math.round((b.y + b.h / 2 + Math.sin(a) * 1.8) * TS - 4));
      }
    }
    if (b.kind === 'ddos' && b.state === 'tired') text('Z', (b.x + b.w) * TS, (b.y - 0.6) * TS - Math.sin(b.st * 3) * 4, '#ffffff');
  }
  function drawBossShot(s) {
    const x = Math.round(s.x * TS), y = Math.round(s.y * TS), w = Math.round(s.w * TS), h = Math.round(s.h * TS);
    switch (s.kind) {
      case 'drop': ctx.fillStyle = '#18141e'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#c88aec'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2); ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 2, y + 2, 2, 1); break;
      case 'packet': ctx.fillStyle = '#18141e'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#3ae0ff'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2); ctx.fillStyle = '#18141e'; ctx.fillRect(x + 2, y + 3, w - 4, 1); break;
      case 'pixel': ctx.fillStyle = ['#ff3a6a', '#3ae0ff', '#7cff6a'][Math.floor(app.t * 20) % 3]; ctx.fillRect(x, y, w, h); break;
      case 'sad': ctx.fillStyle = '#18141e'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#2a5ad8'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2); ctx.save(); ctx.translate(0, 0); text(':(', x + 1, y + 1, '#ffffff', 8, 'left', null); ctx.restore(); break;
    }
  }
  function drawFx(f, T) {
    switch (f.k) {
      case 'score': text(f.text, f.x * TS, f.y * TS - 8, '#ffffff', 8, 'center'); break;
      case 'simitpop': { const y = (f.y - Math.sin(Math.min(1, f.t / 0.5) * Math.PI) * 1.5) * TS; ctx.drawImage(ART.sprite(['simit0', 'simit1', 'simit2', 'simit1'][Math.floor(f.t * 16) % 4]), f.x * TS, Math.round(y)); break; }
      case 'debris': ctx.drawImage(T.crack, 4, 4, 8, 8, Math.round(f.x * TS - 4), Math.round(f.y * TS - 4), 8, 8); break;
      case 'puff': { const r = 2 + f.t * 20; ctx.fillStyle = `rgba(255,255,255,${1 - f.t / 0.35})`; ctx.fillRect(Math.round(f.x * TS - r), Math.round(f.y * TS - r), Math.round(r * 2), Math.round(r * 2)); break; }
      case 'spark': { const a = 1 - f.t / 0.35; ctx.fillStyle = `rgba(255,240,160,${a})`; const r = 3 + f.t * 16; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) ctx.fillRect(Math.round(f.x * TS + dx * r), Math.round(f.y * TS + dy * r), 2, 2); break; }
    }
  }

  // ---------- ekranlar ----------
  function menu(items, y0, sel, gap = 16) {
    app.menuItems = [];
    items.forEach((label, i) => {
      const y = y0 + i * gap;
      const on = i === sel;
      if (on) { ctx.fillStyle = 'rgba(16,18,28,0.65)'; ctx.fillRect(40, y - 4, VW - 80, 15); text('▶', 50, y, '#f4c531'); }
      text(label, VW / 2 + 6, y, on ? '#f4c531' : '#f4f0e4', 8, 'center');
      app.menuItems.push({ y });
    });
  }
  function drawTitle() {
    const w = 0;
    ctx.drawImage(sky(w), 0, 0);
    const bg = ART.background(w);
    layer(bg.far, app.titleT * 8);
    layer(bg.near, app.titleT * 20);
    const T = ART.tiles(w);
    for (let x = 0; x < 17; x++) { ctx.drawImage(T.surf, x * 16 - Math.floor(app.titleT * 40) % 16, 208); ctx.drawImage(T.fill, x * 16 - Math.floor(app.titleT * 40) % 16, 224); }
    // logo
    ctx.fillStyle = 'rgba(16,18,28,0.82)'; ctx.fillRect(0, 22, VW, 66);
    ctx.fillStyle = '#22a391'; ctx.fillRect(0, 86, VW, 2);
    text('BUG', VW / 2, 30, '#f4c531', 24, 'center', '#7a3a10');
    text('AVCISI', VW / 2 + 1, 56, '#f4c531', 16, 'center', '#7a3a10');
    text('· İSTANBUL ·', VW / 2, 76, '#9af4e4', 8, 'center');
    // kahraman koşuyor, arkasında bug
    const hx = 54 + Math.sin(app.titleT * 1.3) * 6;
    ctx.drawImage(ART.sprite(['big_walk1', 'big_walk2', 'big_walk3', 'big_walk2'][Math.floor(app.titleT * 8) % 4]), Math.round(hx), 176);
    ctx.drawImage(ART.sprite(Math.floor(app.titleT * 6) % 2 ? 'bug1' : 'bug0', null, true), 16 + Math.round(Math.sin(app.titleT * 1.3) * 6), 192);
    ctx.drawImage(ART.sprite(['simit0', 'simit1', 'simit2', 'simit1'][Math.floor(app.titleT * 6) % 4]), 200, 150 + Math.round(Math.sin(app.titleT * 3) * 3));
    const items = titleItems().map((i) => i.label);
    app.menu = Math.min(app.menu, items.length - 1);
    menu(items, 104, app.menu);
    if (app.best) text('REKOR ' + String(app.best).padStart(6, '0'), VW / 2, 228, '#ffffff', 8, 'center');
  }
  function drawHelp() {
    ctx.fillStyle = '#10121c'; ctx.fillRect(0, 0, VW, VH);
    text('NASIL OYNANIR', VW / 2, 10, '#f4c531', 8, 'center');
    const lines = [
      ['İstanbul\'un sistemlerine', '#f4f0e4'],
      ['bug\'lar sızdı! Her bölümün', '#f4f0e4'],
      ['sonundaki DEPLOY terminaline', '#f4f0e4'],
      ['ulaş, patronları yen.', '#f4f0e4'],
      ['', ''],
      ['SOL / SAĞ   yürü', '#9af4e4'],
      ['Z / BOŞLUK  zıpla', '#9af4e4'],
      ['  (uzun basınca yüksek)', '#6a8a9a'],
      ['X / SHIFT   koş, kod at', '#9af4e4'],
      ['AŞAĞI   ince platformdan in', '#9af4e4'],
    ];
    lines.forEach(([s, c], i) => text(s, 8, 26 + i * 11, c));
    const items = [['simit0', 'SİMİT: 100 tane = +1 can'], ['cay', 'ÇAY: büyü, blok kır'], ['laptop', 'LAPTOP: { } kod at'], ['kahve', 'KAHVE: dokunulmazlık'], ['disket', 'DİSKET: +1 can'], ['virus0', 'VİRÜS: üstüne basılmaz!']];
    items.forEach(([sp, s], i) => { ctx.drawImage(ART.sprite(sp), 8, 134 + i * 16); text(s, 30, 138 + i * 16, '#f4f0e4'); });
    if (Math.floor(app.t * 2) % 2) text('DEVAM İÇİN Z', VW / 2, 232 - 4, '#f4c531', 8, 'center');
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
    ctx.drawImage(sky(w), 0, 0);
    const bg = ART.background(w);
    layer(bg.far, app.t * 6); layer(bg.near, app.t * 14);
    ctx.fillStyle = 'rgba(12,14,24,0.82)'; ctx.fillRect(0, 0, VW, VH);
    text('◀ GERİ', 6, 6, '#9aa0b4');
    text('BÖLÜM SEÇ', VW / 2, 8, '#f4c531', 8, 'center');
    for (let i = 0; i < 9; i++) {
      const y = SEL.y0 + i * SEL.row, on = i === w;
      if (on) { ctx.fillStyle = 'rgba(244,197,49,0.12)'; ctx.fillRect(4, y - 4, VW - 8, SEL.row - 1); }
      text(`${i + 1}`, 10, y, on ? '#f4c531' : '#9af4e4');
      text(up(WORLDS[i].name), 24, y, on ? '#ffffff' : '#c8ccd8');
      for (let k = 0; k < 3; k++) {
        const x = SEL.x0 + k * SEL.col, sel = on && k === app.selS;
        ctx.fillStyle = sel ? '#f4c531' : k === 2 ? '#5a2a2a' : '#2a3048'; ctx.fillRect(x, y - 3, 32, 13);
        text(`${i + 1}-${k + 1}`, x + 4, y, sel ? '#10121c' : '#f4f0e4', 8, 'left', null);
      }
    }
    const L = LEVELS[w * 3 + app.selS];
    ctx.fillStyle = 'rgba(16,18,28,0.9)'; ctx.fillRect(0, 186, VW, 54);
    text(up(WORLDS[w].name) + ' · ' + up(L.name), VW / 2, 192, '#ffffff', 8, 'center');
    text(L.boss ? 'PATRON: ' + up(L.bossName) : `${L.map[0].length} KARO UZUNLUĞUNDA`, VW / 2, 206, L.boss ? '#ff8a70' : '#9aa0b4', 8, 'center');
    if (Math.floor(app.t * 2) % 2) text('BAŞLAMAK İÇİN Z', VW / 2, 222, '#f4c531', 8, 'center');
  }
  function drawIntro() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
    hud(null);
    const L = LEVELS[app.S.stage], Wd = WORLDS[L.world - 1];
    text(`DÜNYA ${L.world}-${L.section}`, VW / 2, 70, '#f4f0e4', 16, 'center');
    text(up(Wd.name), VW / 2, 100, '#f4c531', 8, 'center');
    text(up(L.name), VW / 2, 114, '#9af4e4', 8, 'center');
    if (L.boss) text('PATRON: ' + up(L.bossName), VW / 2, 132, '#ff8a70', 8, 'center');
    const img = ART.sprite(app.S.power ? (app.S.power === 2 ? 'big_stand' : 'big_stand') : 'small_stand', app.S.power === 2 ? 'hacker' : 'normal');
    ctx.drawImage(img, 100, 176 - img.height + 16);
    text('× ' + app.S.lives, 124, 180, '#f4f0e4');
  }
  function drawPause() {
    drawPlay();
    app.menuItems = [];
    ctx.fillStyle = 'rgba(10,12,20,0.7)'; ctx.fillRect(0, 0, VW, VH);
    text('DURAKLATILDI', VW / 2, 70, '#f4c531', 8, 'center');
    menu(['DEVAM', 'BÖLÜMÜ BAŞTAN AL', 'ANA MENÜ'], 100, app.menu);
  }
  function drawOver() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
    text('OYUN BİTTİ', VW / 2, 70, '#ff6a5a', 16, 'center');
    text('SKOR ' + String(app.S.score).padStart(6, '0'), VW / 2, 100, '#f4f0e4', 8, 'center');
    const w = Math.floor(app.S.stage / 3) + 1;
    if (app.overT > 1.2) menu([`DEVAM ET (DÜNYA ${w} BAŞI)`, 'ANA MENÜ'], 140, app.menu);
    else app.menuItems = [];
  }
  function drawEnd() {
    const w = 8;
    ctx.drawImage(sky(w), 0, 0);
    const bg = ART.background(w);
    layer(bg.far, app.endT * 6); layer(bg.near, app.endT * 14);
    ctx.fillStyle = 'rgba(10,12,20,0.75)'; ctx.fillRect(12, 20, VW - 24, 190);
    text('TEBRİKLER!', VW / 2, 32, '#f4c531', 16, 'center');
    const lines = ['Mavi Ekran yenildi.', 'İstanbul\'un bütün sistemleri', 'yeniden ayakta. Vapurlar', 'işliyor, simitler sıcak.', '', 'Mühendisimiz son kez', 'git push dedi ve', 'çayını yudumladı.'];
    lines.forEach((s, i) => text(s, VW / 2, 64 + i * 12, '#f4f0e4', 8, 'center'));
    text('SKOR ' + String(app.S.score).padStart(6, '0'), VW / 2, 172, '#9af4e4', 8, 'center');
    ctx.drawImage(ART.sprite('big_stand', 'hacker'), 120, 214 - 32 + 0);
    app.menuItems = [];
    if (app.endT > 3 && Math.floor(app.t * 2) % 2) text('ANA MENÜ İÇİN Z', VW / 2, 228, '#f4c531', 8, 'center');
  }

  function render() {
    ctx.imageSmoothingEnabled = false;
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
