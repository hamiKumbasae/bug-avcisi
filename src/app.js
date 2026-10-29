// Bug Avcısı: İstanbul — Android uygulaması (APK) içinde çalışırken gereken küçük uyarlamalar.
// Tarayıcıda hiçbir şey yapmaz; yalnızca Capacitor kabuğunun içinde devreye girer.
(function () {
  'use strict';
  const C = window.Capacitor;
  if (!C || !(C.isNativePlatform ? C.isNativePlatform() : C.platform && C.platform !== 'web')) return;

  document.body.classList.add('uygulama');

  function plugin(name) {
    try { return (C.Plugins && C.Plugins[name]) || (C.registerPlugin ? C.registerPlugin(name) : null); } catch (e) { return null; }
  }
  const App = plugin('App');

  function screen() {
    try { return window.__ba && window.__ba.bridge ? window.__ba.bridge.info().screen : ''; } catch (e) { return ''; }
  }
  function press(code) {
    dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true }));
    dispatchEvent(new KeyboardEvent('keyup', { code, key: code, bubbles: true }));
  }

  if (App && App.addListener) {
    // Geri tuşu: ana menüdeyken uygulamadan çıkar; oyundayken duraklatır, menülerde bir geri gider.
    App.addListener('backButton', () => {
      const s = screen();
      if (s === 'title' && App.exitApp) App.exitApp();
      else press('Escape');
    });
    // Uygulama arka plana atılınca oyun main.js'teki visibilitychange ile zaten duraklıyor.
  }
})();
