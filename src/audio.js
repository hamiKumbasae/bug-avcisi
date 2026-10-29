// Bug Avcısı: İstanbul — sentezlenmiş ses efektleri ve özgün çiptün müzikleri (Web Audio).
(function (root) {
  'use strict';
  let ac = null, master = null, musicBus = null, sfxBus = null;
  let muted = false;
  try { muted = localStorage.getItem('ba-ses') === '0'; } catch (e) { /* yok */ }

  function ctx() {
    if (!ac) {
      try {
        ac = new (root.AudioContext || root.webkitAudioContext)();
        master = ac.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(ac.destination);
        musicBus = ac.createGain(); musicBus.gain.value = 0.55; musicBus.connect(master);
        sfxBus = ac.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
      } catch (e) { ac = null; }
    }
    if (ac && ac.state === 'suspended') ac.resume();
    return ac;
  }
  let pulse25 = null;
  function pulseWave() {
    if (pulse25) return pulse25;
    const n = 32, re = new Float32Array(n), im = new Float32Array(n);
    for (let k = 1; k < n; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * 0.25);
    pulse25 = ac.createPeriodicWave(re, im);
    return pulse25;
  }
  function osc(type, freq, t0, dur, vol, bus, slide, attack) {
    const o = ac.createOscillator(), g = ac.createGain();
    if (type === 'pulse') o.setPeriodicWave(pulseWave()); else o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + (attack || 0.004));
    g.gain.setValueAtTime(vol, t0 + Math.max(0.005, dur * 0.6));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(bus); o.start(t0); o.stop(t0 + dur + 0.03);
  }
  let noiseBuf = null;
  function noise(t0, dur, vol, cutoff, bus, hp) {
    if (!noiseBuf) {
      const n = ac.sampleRate; noiseBuf = ac.createBuffer(1, n, n);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; f.type = hp ? 'highpass' : 'lowpass'; f.frequency.value = cutoff;
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f).connect(g).connect(bus); s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.02);
  }
  const mid = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function parseNote(tok) {
    const m = /^([A-G])(#|b)?(-?\d)$/.exec(tok);
    if (!m) return null;
    return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  }

  // ---------------- efektler ----------------
  const last = {};
  // metro treninin uğultusu: tren durunca ya da metrodan çıkınca kısılır
  let trainSnd = null;
  function stopTrain() {
    if (!trainSnd) return;
    const t = ac.currentTime, g = trainSnd.g.gain;
    g.cancelScheduledValues(t); g.setValueAtTime(Math.max(0.0001, g.value), t); g.linearRampToValueAtTime(0.0001, t + 0.6);
    trainSnd.s.stop(t + 0.7); trainSnd = null;
  }
  function sfx(name, kind) {
    if (!ctx() || muted) return;
    const t = ac.currentTime, B = sfxBus;
    const now = performance.now();
    if (last[name] && now - last[name] < 40) return;
    last[name] = now;
    const seq = (notes, step, type, vol, dur) => notes.forEach((n, i) => osc(type || 'pulse', mid(n), t + i * step, dur || step * 1.1, vol || 0.12, B));
    switch (name) {
      case 'jump': osc('pulse', 330, t, 0.16, 0.11, B, 2.2); break;
      case 'jumpbig': osc('pulse', 220, t, 0.2, 0.12, B, 2.1); break;
      case 'stomp': osc('square', 520, t, 0.1, 0.12, B, 0.45); noise(t, 0.05, 0.15, 3000, B); break;
      case 'kick': osc('square', 900, t, 0.08, 0.1, B, 0.5); noise(t, 0.06, 0.15, 5000, B, true); break;
      case 'simit': seq([84, 88, 91], 0.035, 'pulse', 0.08, 0.09); break;
      case 'bump': osc('triangle', 140, t, 0.1, 0.25, B, 0.6); break;
      case 'thunk': osc('triangle', 110, t, 0.06, 0.18, B, 0.7); break;
      case 'break': noise(t, 0.25, 0.3, 1800, B); osc('square', 180, t, 0.12, 0.08, B, 0.4); break;
      case 'item': seq([60, 64, 67, 72, 76], 0.045, 'pulse', 0.08); break;
      case 'power': seq([67, 72, 76, 79, 84, 88], 0.05, 'pulse', 0.1); break;
      case 'shrink': seq([79, 74, 70, 67, 62], 0.06, 'pulse', 0.1); break;
      case 'shoot': osc('square', 1200, t, 0.09, 0.07, B, 0.35); break;
      case 'oneup': seq([79, 83, 86, 91, 88, 91], 0.075, 'triangle', 0.25); break;
      case 'star': seq([72, 76, 79, 84, 79, 84, 88], 0.05, 'square', 0.07); break;
      case 'checkpoint': seq([72, 79, 84], 0.08, 'triangle', 0.25); break;
      case 'goalon': seq([79, 84, 88, 91], 0.09, 'triangle', 0.25); break;
      case 'tick': osc('pulse', 1500, t, 0.03, 0.04, B); break;
      case 'warp': stopTrain(); noise(t, 0.5, 0.18, 900, B); osc('triangle', mid(81), t + 0.05, 0.28, 0.16, B); osc('triangle', mid(76), t + 0.32, 0.4, 0.16, B); break;
      case 'secret': seq([79, 86, 91, 95], 0.05, 'triangle', 0.18, 0.12); break;
      case 'firework': osc('sine', 500, t, 0.32, 0.04, B, 3.2); noise(t + 0.32, 0.5, 0.35, 1400, B); for (let i = 0; i < 7; i++) noise(t + 0.45 + i * 0.06 + Math.random() * 0.04, 0.05, 0.12, 6000, B, true); break;
      case 'bosshit': osc('sawtooth', 200, t, 0.25, 0.12, B, 0.4); noise(t, 0.2, 0.2, 2500, B); break;
      case 'bossdown': noise(t, 1.4, 0.35, 900, B); [62, 58, 55, 50].forEach((n, i) => osc('sawtooth', mid(n), t + i * 0.22, 0.3, 0.09, B, 0.7)); break;
      case 'thud': osc('triangle', 70, t, 0.3, 0.35, B, 0.5); noise(t, 0.2, 0.2, 400, B); break;
      case 'bossjump': osc('triangle', 120, t, 0.25, 0.2, B, 2); break;
      case 'charge': osc('sawtooth', 90, t, 0.6, 0.08, B, 3); break;
      case 'spawn': osc('square', 300, t, 0.15, 0.07, B, 1.8); break;
      case 'splat': noise(t, 0.25, 0.25, 700, B); osc('triangle', 160, t, 0.2, 0.2, B, 0.5); break;
      case 'zap': osc('square', 1600, t, 0.14, 0.06, B, 0.25); break;
      case 'glitch': for (let i = 0; i < 5; i++) osc('square', 200 + Math.random() * 1800, t + i * 0.03, 0.03, 0.05, B); break;
      case 'drip': osc('pulse', 900, t, 0.05, 0.05, B, 0.6); break;
      case 'cawk': osc('sawtooth', 1100, t, 0.18, 0.06, B, 0.7); noise(t, 0.12, 0.08, 3000, B, true); break;
      case 'select': seq([72, 79], 0.05, 'pulse', 0.08); break;
      case 'move': osc('pulse', 880, t, 0.04, 0.05, B); break;
      case 'pause': seq([72, 79], 0.07, 'triangle', 0.2); break;
      case 'hurry': seq([84, 79, 84, 79, 84, 79], 0.06, 'pulse', 0.08); break;
      case 'bossintro': osc('sawtooth', 55, t, 1.2, 0.12, B, 1.5); break;
      case 'die': stopMusic(); seq([76, 75, 74, 73, 72], 0.07, 'pulse', 0.1, 0.07); [60, 55, 48].forEach((n, i) => osc('triangle', mid(n), t + 0.45 + i * 0.2, 0.25, 0.28, B)); break;
      case 'clear': stopMusic(); [[72, 0], [76, 0.12], [79, 0.24], [84, 0.36], [79, 0.6], [84, 0.72], [88, 0.84]].forEach(([n, d]) => { osc('pulse', mid(n), t + d, 0.2, 0.1, B); osc('triangle', mid(n - 24), t + d, 0.2, 0.25, B); }); break;
      case 'over': stopMusic(); [67, 64, 60, 55, 52, 48].forEach((n, i) => osc('triangle', mid(n), t + i * 0.25, 0.3, 0.3, B)); break;
      case 'piece': seq([72, 76, 79, 84, 88, 91, 96], 0.07, 'triangle', 0.22, 0.4); for (const [f, v] of [[1047, 0.05], [2093, 0.02]]) osc('sine', f, t + 0.5, 1.4, v, B, 1, 0.003); break;
      case 'train': {
        // kalkış: metro kapı "ding-dong"u, otobüs/minibüs kornası, taksinin iki kısa kornası, tramvay ve Tünel zili;
        // ardından motor hızlanır, yol/tünel uğultusu araç durana dek sürer
        const k = kind || 'metro';
        let lp = [140, 320, 0.16], start = 0.6;
        if (k === 'metro') {
          osc('sine', 784, t, 0.5, 0.07, B); osc('sine', 622, t + 0.3, 0.75, 0.07, B);
          osc('sawtooth', 60, t + 0.8, 3.2, 0.025, B, 3.4, 0.4);
        } else if (k === 'metrobus') {
          noise(t, 0.45, 0.1, 2600, B, true);                                   // kapı kapanır (hava)
          osc('sine', 988, t + 0.45, 0.5, 0.06, B);
          osc('sawtooth', 46, t + 0.7, 3.6, 0.04, B, 2.4, 0.5); osc('square', 92, t + 0.7, 2.6, 0.012, B, 2.2, 0.5);
          lp = [180, 380, 0.13];
        } else if (k === 'minibus' || k === 'taxi') {
          const f = k === 'taxi' ? 520 : 415;
          osc('square', f, t, 0.12, 0.035, B); osc('square', f * 1.26, t, 0.12, 0.025, B);
          if (k === 'taxi') { osc('square', f, t + 0.17, 0.12, 0.035, B); osc('square', f * 1.26, t + 0.17, 0.12, 0.025, B); }
          osc('sawtooth', k === 'taxi' ? 70 : 55, t + 0.35, 2.4, 0.035, B, 3.2, 0.25);
          lp = [200, 460, 0.11]; start = 0.4;
        } else if (k === 'tram') {
          for (const d of [0, 0.32]) { osc('sine', 1568, t + d, 0.6, 0.06, B); osc('sine', 2093, t + d, 0.35, 0.025, B); osc('sine', 3136, t + d, 0.2, 0.012, B); }
          osc('sine', 180, t + 0.7, 3, 0.03, B, 3.4, 0.6);                      // elektrik motoru vınlaması
          lp = [120, 260, 0.1];
        } else if (k === 'funicular') {
          osc('sine', 880, t, 1.6, 0.07, B); osc('sine', 1760, t, 0.8, 0.02, B); osc('sine', 1318, t, 1.2, 0.025, B);
          osc('sawtooth', 75, t + 0.8, 4, 0.016, B, 1.3, 0.8);                    // kablo makarası
          lp = [110, 220, 0.12]; start = 0.9;
        }
        stopTrain();
        const s = loopNoise(), f = ac.createBiquadFilter(), g = ac.createGain();
        f.type = 'lowpass'; f.frequency.setValueAtTime(lp[0], t); f.frequency.linearRampToValueAtTime(lp[1], t + 3.5);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(lp[2], t + 3); g.gain.setValueAtTime(lp[2], t + 16); g.gain.linearRampToValueAtTime(0.0001, t + 18);
        s.connect(f).connect(g).connect(B); s.start(t + start, Math.random()); s.stop(t + 18.2);
        trainSnd = { s, g };
        break;
      }
      case 'trainstop': {
        stopTrain();
        const k = kind || 'metro';
        if (k === 'metro') { noise(t, 1, 0.09, 3200, B, true); osc('sawtooth', 210, t, 1.3, 0.022, B, 0.35); }
        else if (k === 'metrobus' || k === 'minibus') { noise(t, 0.7, 0.13, 2400, B, true); osc('sine', 988, t + 0.7, 0.4, 0.05, B); }
        else if (k === 'taxi') { osc('sine', 1900, t, 0.35, 0.03, B, 0.85); noise(t, 0.3, 0.06, 1800, B, true); }
        else if (k === 'tram') { noise(t, 0.6, 0.06, 3000, B, true); osc('sine', 1568, t + 0.5, 0.5, 0.05, B); osc('sine', 2093, t + 0.5, 0.3, 0.02, B); }
        else if (k === 'funicular') { osc('sine', 880, t + 0.2, 1.4, 0.06, B); osc('sine', 1318, t + 0.2, 1, 0.02, B); noise(t, 0.5, 0.05, 2600, B, true); }
        break;
      }
      case 'fall': stopTrain(); osc('triangle', 900, t, 0.55, 0.1, B, 0.22); break;
      case 'leap': osc('square', 210, t, 0.17, 0.05, B, 2.8); noise(t, 0.08, 0.08, 4200, B, true); break;
      case 'lockon': osc('square', 1400, t, 0.04, 0.05, B); osc('square', 900, t + 0.07, 0.06, 0.05, B); noise(t + 0.07, 0.05, 0.12, 3800, B, true); break;
      case 'win': [72, 72, 76, 79, 84, 79, 84, 88, 91].forEach((n, i) => { osc('pulse', mid(n), t + i * 0.14, 0.16, 0.1, B); osc('triangle', mid(n - 12), t + i * 0.14, 0.16, 0.22, B); }); break;
    }
  }

  // ---------------- müzik ----------------
  // Her ezgi 8 ölçü × 8 sekizlik. Kurşun ses elle yazıldı; bas ve arpej akorlardan üretilir.
  const SONGS = {
    title: { bpm: 120, chords: 'C G Am F C G F G', drums: 'k.h.s.h.k.h.s.hh',
      lead: 'G4 . C5 . E5 . G5 . | G5 - F5 E5 D5 . B4 . | C5 . E5 . A5 . G5 E5 | F5 - E5 D5 C5 . . . | G4 . C5 . E5 . G5 . | B5 - A5 G5 D5 . G5 . | A5 . G5 . F5 . E5 D5 | C5 - - . G4 . . .' },
    maslak: { bpm: 150, chords: 'C Am F G C Am Dm G', drums: 'k.h.s.h.k.k.s.h.',
      lead: 'E5 . G5 . C6 - B5 A5 | G5 - E5 . A4 C5 E5 . | F5 . A5 . C6 . A5 F5 | G5 - - . D5 - . . | E5 . G5 . C6 - B5 A5 | G5 - E5 . C5 . E5 . | D5 F5 A5 . G5 F5 E5 D5 | C5 - - . . . G4 .' },
    kadikoy: { bpm: 138, chords: 'F C Dm Bb F C Bb C', drums: 'k.hhs.h.k.hhs.hh',
      lead: 'A4 C5 F5 . E5 . C5 . | G5 . E5 C5 D5 E5 C5 . | D5 . F5 A5 G5 F5 E5 D5 | Bb4 - D5 F5 E5 . D5 . | A4 C5 F5 . E5 . C5 . | G5 . A5 Bb5 A5 G5 E5 C5 | D5 . Bb4 . D5 F5 E5 D5 | C5 - E5 . F5 - . .' },
    vapur: { bpm: 128, chords: 'G Em C D G Em C D', drums: 'k..hs.h.k..hs.h.',
      lead: 'D5 - B4 . G4 . B4 D5 | E5 - G5 . E5 . D5 B4 | C5 - E5 . G5 . E5 C5 | D5 - - . A4 B4 C5 . | D5 - B4 . G4 . B4 D5 | G5 - F#5 . E5 . D5 B4 | C5 . E5 . D5 . F#5 . | G5 - - . D5 . G4 .' },
    carsi: { bpm: 126, chords: 'D Gm D Eb D Cm Eb D', drums: 'k.hks.h.k.hks.hh',
      lead: 'D5 . Eb5 F#5 . G5 A5 . | G5 F#5 Eb5 . D5 - . . | A5 . Bb5 A5 G5 F#5 G5 . | F#5 Eb5 D5 . Eb5 - . . | D5 . Eb5 F#5 . G5 A5 . | C6 - Bb5 A5 Bb5 A5 G5 . | A5 G5 F#5 G5 F#5 Eb5 F#5 . | D5 - - . A4 . D5 .' },
    sarnic: { bpm: 96, chords: 'A Dm A Bb A Gm Dm A', drums: 'k.......s.......',
      lead: 'A4 - - . E5 - . . | F5 - E5 . C#5 - . . | D5 - . F5 E5 - D5 . | C#5 - Bb4 . A4 - - . | A4 - - . E5 - . . | G5 - F5 . E5 - . . | F5 E5 D5 . C#5 . D5 . | A4 - - - . . . .' },
    galata: { bpm: 144, chords: 'Am F G E Am F Dm E', drums: 'k.h.s.hkk.h.s.hh',
      lead: 'A4 . C5 . E5 . A5 G5 | F5 . E5 . C5 . A4 . | B4 . D5 . G5 . F5 E5 | G#4 - B4 . E5 - . . | A4 . C5 . E5 . A5 B5 | C6 . B5 . A5 . F5 . | D5 E5 F5 . A5 G5 F5 E5 | E5 - G#5 . A5 - . .' },
    kopru: { bpm: 158, chords: 'Em C D B Em C Am B', drums: 'k.hks.hkk.hks.hh',
      lead: 'E5 . E5 G5 . B5 . G5 | E5 . C5 . E5 . G5 . | F#5 . D5 . A5 . F#5 . | D#5 - F#5 . B5 - . . | E5 . E5 G5 . B5 . E6 | D6 . C6 . B5 . G5 . | A5 . C6 . B5 . A5 G5 | F#5 - D#5 . E5 - . .' },
    catilar: { bpm: 132, chords: 'Em F Em Dm Em F Am Em', drums: 'k..h..s.k..h..s.',
      lead: 'E5 . . G5 . F5 E5 . | F5 . . A5 . G5 F5 . | E5 . G5 . B5 . A5 G5 | F5 . E5 . D5 . . . | E5 . . G5 . F5 E5 . | A5 . . C6 . B5 A5 . | G5 . F5 . E5 . D5 F5 | E5 - - . B4 . E5 .' },
    camlica: { bpm: 164, chords: 'Dm Bb C A Dm Bb Gm A', drums: 'k.hkk.hkk.hkk.hh',
      lead: 'D5 F5 A5 D6 A5 F5 D5 F5 | Bb4 D5 F5 Bb5 F5 D5 Bb4 D5 | C5 E5 G5 C6 G5 E5 C5 E5 | A4 C#5 E5 A5 E5 C#5 A4 C#5 | D6 - C6 . A5 - F5 . | Bb5 - A5 . F5 - D5 . | G5 . A5 . Bb5 . C6 . | C#6 - - . E5 . A5 .' },
    halic: { bpm: 120, chords: 'Dm Gm A Dm Bb Gm A Dm', drums: 'k..hs.h.k..hs.h.',
      lead: 'D5 . F5 . A5 - G5 F5 | G5 . Bb5 . A5 G5 F5 . | E5 . C#5 . E5 . A5 . | F5 - E5 D5 D5 - . . | D5 . F5 . Bb5 - A5 G5 | G5 . F5 . E5 . D5 . | C#5 . E5 . G5 F5 E5 C#5 | D5 - - . A4 . D5 .' },
    atasehir: { bpm: 150, chords: 'Bm G D A Bm G Em F#', drums: 'k.hsk.hsk.hsk.hh',
      lead: 'B4 . D5 F#5 B5 . F#5 D5 | G5 . F#5 . D5 . B4 . | A4 . D5 F#5 A5 . F#5 D5 | C#5 - E5 . A5 - . . | B5 . A5 . F#5 . D5 F#5 | G5 - B5 . D6 - B5 . | E5 . G5 . B5 . A5 G5 | F#5 - A#5 . C#6 - . .' },
    umraniye: { bpm: 140, chords: 'G D Em C G D C D', drums: 'k.h.s.h.k.h.s.hh',
      lead: 'G4 . B4 . D5 . G5 . | F#5 - E5 D5 A4 . D5 . | E5 . G5 . B5 . A5 G5 | E5 - D5 C5 G4 - . . | B4 . D5 . G5 . B5 . | A5 - F#5 . D5 . A5 . | G5 . E5 . C5 . E5 G5 | F#5 - A5 . D6 - . .' },
    boss: { bpm: 172, chords: 'Dm Dm Bb A Dm Dm Bb A', drums: 'kkhskkhskkhskkss',
      lead: 'D5 . D5 . F5 . D5 . | G#5 . A5 . F5 . D5 . | Bb5 . A5 . G5 . F5 . | E5 . C#5 . A4 . . . | D6 . . C6 . . A5 . | G#5 . A5 . F5 . D5 . | Bb5 . C6 . D6 . Bb5 . | A5 - C#6 . E6 - . .' },
    hikaye: { bpm: 84, chords: 'Am F C G Am F G E', drums: '................',
      lead: 'E5 - - . C5 - D5 . | A4 - - - . . . . | G4 - C5 . E5 - D5 C5 | D5 - - - . . . . | E5 - - . G5 - F5 E5 | C5 - - - . . A4 . | B4 - C5 . D5 - E5 . | E5 - - - . . . .' },
    son: { bpm: 112, chords: 'F C Dm Bb F C Bb C', drums: 'k...s...k...s.h.',
      lead: 'C5 - F5 . A5 - G5 F5 | E5 - G5 . C6 - . . | D5 - F5 . A5 - G5 F5 | F5 - D5 . Bb4 - . . | C5 - F5 . A5 - C6 . | Bb5 - A5 . G5 - E5 . | D5 . E5 . F5 . G5 . | F5 - - - . . . .' },
  };
  // v2.0 dünya sırası: yeni dünyaların şarkıları gelene dek en yakın eski şarkı çalar
  const WORLD_SONG = ['maslak', 'carsi', 'maslak', 'kadikoy', 'atasehir', 'sarnic', 'kopru', 'halic', 'vapur', 'umraniye', 'camlica', 'umraniye'];
  function chordNotes(ch) {
    const m = /^([A-G])(#|b)?(m?)/.exec(ch);
    const root = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return [root, root + (m[3] ? 3 : 4), root + 7];
  }
  const compiled = {};
  function compile(name) {
    if (compiled[name]) return compiled[name];
    const S = SONGS[name];
    const lead = S.lead.replace(/\|/g, ' ').split(/\s+/).filter(Boolean);
    const chords = S.chords.split(' ').map(chordNotes);
    const steps = [];
    for (let i = 0; i < 64; i++) {
      const tok = lead[i] || '.';
      const ch = chords[Math.floor(i / 8)];
      // kurşun: notanın uzunluğu, ardından gelen '-' sayısı
      let len = 0;
      if (tok !== '.' && tok !== '-') { len = 1; while (lead[i + len] === '-') len++; }
      const pos = i % 8;
      const bassPat = [0, null, 0, null, 2, null, 0, 2];
      const b = bassPat[pos];
      const arp = [1, 2, 0, 2, 1, 2, 0, 1][pos];
      steps.push({ lead: len ? parseNote(tok) : null, len, bass: b === null ? null : 36 + ch[b] + (pos === 7 ? 12 : 0), arp: 60 + ch[arp] + (ch[arp] < 5 ? 12 : 0), drum: S.drums[i % 16] });
    }
    compiled[name] = { bpm: S.bpm, steps };
    return compiled[name];
  }
  let cur = null, step = 0, nextT = 0, timer = null, rate = 1;
  function playMusic(name, speed) {
    if (!ctx()) return;
    rate = speed || 1;
    if (cur && cur.name === name) return;
    stopMusic();
    cur = { name, song: compile(name) };
    step = 0; nextT = ac.currentTime + 0.06;
    timer = setInterval(schedule, 25);
    schedule();
  }
  function setRate(r) { rate = r; }
  function stopMusic() { if (timer) clearInterval(timer); timer = null; cur = null; }
  function schedule() {
    if (!cur || !ac) return;
    const sp = 60 / cur.song.bpm / 2 / rate; // sekizlik süresi
    while (nextT < ac.currentTime + 0.15) {
      const s = cur.song.steps[step % 64];
      if (!muted) {
        if (s.lead !== null) osc('pulse', mid(s.lead), nextT, sp * s.len * 0.92, 0.075, musicBus);
        if (s.bass !== null) osc('triangle', mid(s.bass), nextT, sp * 0.9, 0.22, musicBus);
        osc('square', mid(s.arp), nextT, sp * 0.45, 0.018, musicBus);
        if (s.drum === 'k') { osc('triangle', 120, nextT, 0.09, 0.3, musicBus, 0.4); }
        else if (s.drum === 's') noise(nextT, 0.09, 0.12, 2400, musicBus);
        else if (s.drum === 'h') noise(nextT, 0.03, 0.05, 7000, musicBus, true);
      }
      nextT += sp; step++;
    }
  }
  // ---------------- ortam sesleri ----------------
  // Sürekli katmanlar (süzülmüş gürültü: deniz, rüzgâr, şehir uğultusu, motor) ve rastgele olaylar
  // (martı, vapur düdüğü, damla, örs, kuş, klavye...). Hikâye sahnelerinde ve bölümlerin arka planında çalar.
  let ambBus = null, amb = null, ambTimer = null;
  function loopNoise() {
    if (!noiseBuf) noise(ac.currentTime, 0.01, 0.0001, 100, sfxBus);
    const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true; return s;
  }
  function bed(kind, vol) {
    const t = ac.currentTime, out = ac.createGain(); out.gain.value = 0; out.connect(ambBus);
    out.gain.linearRampToValueAtTime(vol, t + 1.2);
    const nodes = [out];
    const lfo = (rate, depth, target) => { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = rate; g.gain.value = depth; o.connect(g).connect(target); o.start(); nodes.push(o); };
    const nz = (type, f, q, gain) => { const s = loopNoise(), fl = ac.createBiquadFilter(), g = ac.createGain(); fl.type = type; fl.frequency.value = f; fl.Q.value = q || 0.7; g.gain.value = gain; s.connect(fl).connect(g).connect(out); s.start(t, Math.random()); nodes.push(s); return { fl, g }; };
    switch (kind) {
      case 'sea': { const a = nz('lowpass', 520, 0.6, 0.9); lfo(0.13, 0.45, a.g.gain); break; }
      case 'wind': { const a = nz('bandpass', 420, 0.9, 1.2); lfo(0.07, 0.6, a.g.gain); lfo(0.11, 160, a.fl.frequency); break; }
      case 'city': nz('lowpass', 240, 0.5, 1.1); break;
      case 'cave': { nz('lowpass', 140, 0.6, 1.4); break; }
      case 'murmur': { const a = nz('bandpass', 700, 1.6, 0.7); lfo(3.1, 0.35, a.g.gain); lfo(0.4, 220, a.fl.frequency); break; }
      case 'engine': {
        nz('lowpass', 160, 0.8, 1);
        const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
        o.type = 'sawtooth'; o.frequency.value = 46; f.type = 'lowpass'; f.frequency.value = 180; g.gain.value = 0.18;
        o.connect(f).connect(g).connect(out); o.start(); nodes.push(o); lfo(0.5, 0.06, g.gain);
        break;
      }
      case 'fire': { const a = nz('bandpass', 1800, 0.5, 0.35); lfo(7, 0.2, a.g.gain); nz('lowpass', 200, 0.5, 0.5); break; }
      case 'hum': {
        // sunucu/klima uğultusu: 100 Hz ve harmonikleri, hafif fan hışırtısı
        for (const [f, v] of [[100, 0.12], [200, 0.05], [300, 0.025]]) { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; g.gain.value = v; o.connect(g).connect(out); o.start(); nodes.push(o); }
        nz('bandpass', 1400, 0.5, 0.25);
        break;
      }
      case 'rain': nz('highpass', 2600, 0.4, 0.9); nz('bandpass', 900, 0.8, 0.4); break;
    }
    return { out, nodes };
  }
  function ev(kind) {
    if (!ac || muted || !ambBus) return;
    const t = ac.currentTime + 0.02, B = ambBus;
    switch (kind) {
      case 'bird': for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) { const f = 2600 + Math.random() * 1500; osc('sine', f, t + i * 0.11, 0.07, 0.05, B, 1.35); } break;
      case 'gull': for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) { osc('sawtooth', 1350 + Math.random() * 200, t + i * 0.32, 0.26, 0.022, B, 0.62, 0.03); osc('sine', 1400, t + i * 0.32, 0.22, 0.035, B, 0.65, 0.03); } break;
      case 'horn': for (const f of [98, 147]) osc('sawtooth', f, t, 1.8, 0.035, B, 1, 0.25); osc('sine', 98, t, 1.9, 0.12, B, 1, 0.25); break;
      case 'drip': { osc('sine', 1300 + Math.random() * 500, t, 0.09, 0.08, B, 0.45); osc('sine', 1100, t + 0.21, 0.08, 0.025, B, 0.5); osc('sine', 950, t + 0.43, 0.08, 0.01, B, 0.5); break; }
      case 'forge': { for (const [f, v, d] of [[820, 0.07, 0.9], [1270, 0.05, 0.7], [2030, 0.035, 0.5], [2810, 0.025, 0.35], [3640, 0.015, 0.25]]) osc('sine', f, t, d, v, B, 1, 0.002); noise(t, 0.06, 0.25, 4000, B, true); break; }
      case 'step': for (let i = 0; i < 4; i++) noise(t + i * 0.42, 0.06, 0.12, 500, B); break;
      case 'ding': osc('sine', 1318, t, 0.6, 0.06, B); osc('sine', 988, t + 0.18, 0.8, 0.06, B); break;
      case 'keys': for (let i = 0; i < 6 + Math.floor(Math.random() * 8); i++) noise(t + i * (0.06 + Math.random() * 0.1), 0.02, 0.07, 3500, B, true); break;
      case 'carve': for (let i = 0; i < 3; i++) noise(t + i * 0.5, 0.35, 0.06, 2600, B, true); break;
      case 'car': { const s = loopNoise(), f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'lowpass'; f.frequency.setValueAtTime(300, t); f.frequency.linearRampToValueAtTime(900, t + 1.2); f.frequency.linearRampToValueAtTime(250, t + 2.6); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.18, t + 1.2); g.gain.linearRampToValueAtTime(0.0001, t + 2.6); s.connect(f).connect(g).connect(B); s.start(t); s.stop(t + 2.7); break; }
      case 'meow': osc('triangle', 700, t, 0.45, 0.04, B, 1.4, 0.08); break;
      case 'kapak': noise(t, 0.05, 0.12, 1400, B); osc('triangle', 170, t, 0.08, 0.06, B, 0.7); break;           // laptop kapanır
      case 'durak': osc('sine', 1175, t, 0.11, 0.06, B); osc('sine', 1175, t + 0.17, 0.16, 0.06, B); break;     // otobüste durak düğmesi
      case 'bell': for (const [f, v] of [[660, 0.05], [1320, 0.025], [1980, 0.012]]) osc('sine', f, t, 1.6, v, B, 1, 0.003); break;
      case 'beep': for (let i = 0; i < 1 + Math.floor(Math.random() * 3); i++) osc('square', [1760, 2093, 1568][i % 3], t + i * 0.12, 0.05, 0.012, B); break;
      case 'thunder': { noise(t, 2.4, 0.5, 220, B); noise(t + 0.05, 0.4, 0.3, 900, B); break; }
      case 'tick': for (let i = 0; i < 8; i++) noise(t + i * 0.5, 0.02, i % 2 ? 0.08 : 0.12, i % 2 ? 2600 : 3400, B, true); break;
      case 'creak': osc('sawtooth', 90 + Math.random() * 40, t, 0.6, 0.02, B, 1.5, 0.2); break;
    }
  }
  // ad: { katmanlar: [[tür, ses]], olaylar: [[tür, ortalama aralık sn]] }
  const AMB = {
    sabah: { beds: [['city', 0.06], ['fire', 0.08]], events: [['bird', 2.2], ['forge', 1.35], ['car', 9]] },
    plaza: { beds: [['city', 0.12], ['wind', 0.05]], events: [['step', 4], ['ding', 7], ['car', 6]] },
    iskele: { beds: [['sea', 0.16], ['city', 0.04]], events: [['gull', 3.5], ['horn', 14], ['keys', 5]] },
    vapur: { beds: [['sea', 0.2], ['engine', 0.12], ['wind', 0.05]], events: [['gull', 4], ['horn', 16]] },
    carsi: { beds: [['murmur', 0.07]], events: [['carve', 3], ['bell', 11], ['step', 7]] },
    sarnic: { beds: [['cave', 0.14]], events: [['drip', 1.6]] },
    galata: { beds: [['wind', 0.12], ['city', 0.05]], events: [['gull', 6], ['horn', 15], ['bird', 9]] },
    kopru: { beds: [['engine', 0.16], ['wind', 0.06]], events: [['car', 3]] },
    catilar: { beds: [['wind', 0.1], ['city', 0.04]], events: [['keys', 3.5], ['meow', 12], ['car', 10]] },
    camlica: { beds: [['wind', 0.1]], events: [['bird', 5], ['car', 12]] },
    safak: { beds: [['wind', 0.06], ['sea', 0.05]], events: [['bird', 1.8], ['gull', 7], ['horn', 18]] },
    // bölüm mekânları
    ofis: { beds: [['city', 0.04], ['hum', 0.05]], events: [['keys', 3], ['ding', 9], ['step', 7]] },
    sunucu: { beds: [['hum', 0.16]], events: [['beep', 2.5], ['keys', 9]] },
    pazar: { beds: [['murmur', 0.1], ['city', 0.04]], events: [['gull', 5], ['bell', 13], ['step', 4]] },
    moda: { beds: [['sea', 0.1], ['wind', 0.07]], events: [['gull', 5], ['bird', 6], ['horn', 20]] },
    firtina: { beds: [['sea', 0.28], ['wind', 0.2], ['rain', 0.1]], events: [['thunder', 9], ['horn', 22]] },
    bedesten: { beds: [['cave', 0.08], ['murmur', 0.03]], events: [['step', 6], ['bell', 15], ['carve', 9]] },
    karanlik: { beds: [['cave', 0.18]], events: [['drip', 3.5]] },
    kamondo: { beds: [['city', 0.08], ['wind', 0.04]], events: [['step', 3], ['bird', 6], ['gull', 9]] },
    cati: { beds: [['wind', 0.08], ['cave', 0.05]], events: [['creak', 4], ['bell', 18]] },
    halat: { beds: [['wind', 0.24]], events: [['horn', 18], ['gull', 11]] },
    tepe: { beds: [['wind', 0.18], ['engine', 0.04]], events: [['car', 7]] },
    saat: { beds: [['cave', 0.06], ['wind', 0.04]], events: [['tick', 4.1], ['creak', 6], ['bell', 20]] },
    asansor: { beds: [['engine', 0.08], ['wind', 0.06]], events: [['ding', 8]] },
    yayin: { beds: [['hum', 0.12]], events: [['beep', 2], ['keys', 6]] },
    karakoy: { beds: [['sea', 0.14], ['city', 0.08]], events: [['gull', 3], ['horn', 12], ['step', 6]] },
    halic: { beds: [['sea', 0.08], ['wind', 0.06]], events: [['gull', 6], ['bird', 7], ['bell', 16]] },
    balat: { beds: [['city', 0.05], ['wind', 0.05]], events: [['bird', 3], ['meow', 9], ['bell', 14], ['step', 6]] },
    mahalle: { beds: [['city', 0.1], ['murmur', 0.05]], events: [['bird', 5], ['car', 6], ['step', 5], ['ding', 14]] },
    plazadis: { beds: [['city', 0.12], ['engine', 0.05], ['wind', 0.04]], events: [['car', 3], ['ding', 12]] },
    sanayi: { beds: [['fire', 0.08], ['hum', 0.06], ['city', 0.04]], events: [['forge', 2.6], ['carve', 5], ['creak', 7]] },
    // Ataşehir: gece finans meydanı, veri merkezinin soğutma uğultusu, kontrol odasının bip'leri
    finans: { beds: [['city', 0.09], ['wind', 0.05], ['hum', 0.03]], events: [['car', 5], ['ding', 11], ['step', 7]] },
    veri: { beds: [['hum', 0.2], ['wind', 0.03]], events: [['beep', 1.8], ['keys', 11]] },
    kontrol: { beds: [['hum', 0.1], ['murmur', 0.03]], events: [['beep', 2.2], ['keys', 5], ['ding', 12]] },
  };
  const WORLD_AMB = ['plaza', 'carsi', 'plazadis', 'iskele', 'finans', 'sarnic', 'kopru', 'balat', 'tepe', 'sanayi', 'camlica', 'mahalle'];
  // bölümün çizimi ('yer') → şehir sesi; bölüm 'ses' ile değiştirebilir
  const AMB_OF = {
    maslak: 'plaza', toplanti: 'ofis', sunucu: 'sunucu', kadikoy: 'iskele', balikPazari: 'pazar', moda: 'moda', iskele: 'iskele',
    vapur: 'vapur', kaptan: 'firtina', carsi: 'carsi', halicilar: 'carsi', bedesten: 'bedesten', sarnic: 'sarnic', medusa: 'sarnic',
    karanlikSu: 'karanlik', kamondo: 'kamondo', galata: 'galata', catiArasi: 'cati', karakoy: 'karakoy', halicKiyisi: 'halic',
    eyupBalat: 'balat', kopru: 'kopru', halatlar: 'halat', kopruTepe: 'tepe', catilar: 'catilar', antenler: 'catilar',
    saatKulesi: 'saat', finans: 'finans', veri: 'veri', kontrol: 'kontrol', camlica: 'camlica', asansor: 'asansor', yayin: 'yayin',
    umraniyeCarsi: 'mahalle', yeniPlazalar: 'plazadis', sanayi: 'sanayi',
  };
  const placeAmb = (L) => (L && (L.ses || AMB_OF[L.yer])) || 'plaza';
  function stopAmbient(fade) {
    if (!amb || !ac) { amb = null; return; }
    const t = ac.currentTime, f = fade === undefined ? 0.8 : fade, a = amb;
    for (const b of a.beds) { b.out.gain.cancelScheduledValues(t); b.out.gain.setValueAtTime(b.out.gain.value, t); b.out.gain.linearRampToValueAtTime(0, t + f); }
    setTimeout(() => { for (const b of a.beds) for (const n of b.nodes) { try { if (n.stop) n.stop(); n.disconnect(); } catch (e) { /* yok */ } } }, (f + 0.1) * 1000);
    amb = null;
    if (ambTimer) { clearInterval(ambTimer); ambTimer = null; }
  }
  function ambient(name, level) {
    if (!ctx()) return;
    if (amb && amb.name === name) { if (level !== undefined) ambBus.gain.setTargetAtTime(level, ac.currentTime, 0.4); return; }
    stopAmbient();
    const D = AMB[name];
    if (!D) return;
    if (!ambBus) { ambBus = ac.createGain(); ambBus.connect(master); }
    ambBus.gain.setTargetAtTime(level === undefined ? 1 : level, ac.currentTime, 0.3);
    amb = { name, beds: D.beds.map(([k, v]) => bed(k, v)), next: D.events.map(([, m]) => ac.currentTime + Math.random() * m) };
    ambTimer = setInterval(() => {
      if (!amb || !ac) return;
      const now = ac.currentTime;
      D.events.forEach(([k, m], i) => { if (now >= amb.next[i]) { ev(k); amb.next[i] = now + m * (0.5 + Math.random()); } });
    }, 100);
  }

  function setMuted(m) {
    muted = m;
    try { localStorage.setItem('ba-ses', m ? '0' : '1'); } catch (e) { /* yok */ }
    if (master) master.gain.value = m ? 0 : 0.9;
  }

  root.BA_AUDIO = {
    unlock: ctx, sfx, playMusic, stopMusic, setRate, WORLD_SONG, ambient, stopAmbient, WORLD_AMB, placeAmb, ambEvent: ev,
    get ambName() { return amb ? amb.name : null; },
    get muted() { return muted; }, setMuted, SONGS,
    current: () => (cur ? cur.name : null),
  };
})(window);
