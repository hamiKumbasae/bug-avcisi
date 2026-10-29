// Bug Avcısı — Android uygulamasını hazırlayan yardımcı betik.
//   node hazirla.js www              oyun dosyalarını mobil/www içine kopyalar
//   node hazirla.js android <sürüm>  "npx cap add android" sonrası Android projesini ayarlar
'use strict';
const fs = require('fs');
const path = require('path');

const KOK = path.join(__dirname, '..');
const WWW = path.join(__dirname, 'www');
const AND = path.join(__dirname, 'android');

function kopyala(kaynak, hedef) {
  const st = fs.statSync(kaynak);
  if (st.isDirectory()) {
    fs.mkdirSync(hedef, { recursive: true });
    for (const ad of fs.readdirSync(kaynak)) {
      if (ad === '.DS_Store' || ad === '__pycache__') continue;
      kopyala(path.join(kaynak, ad), path.join(hedef, ad));
    }
  } else fs.copyFileSync(kaynak, hedef);
}

function www() {
  fs.rmSync(WWW, { recursive: true, force: true });
  fs.mkdirSync(WWW, { recursive: true });
  for (const ad of ['index.html', 'kumanda.html', 'src']) kopyala(path.join(KOK, ad), path.join(WWW, ad));
  console.log('www hazır');
}

function degistir(dosya, eski, yeni) {
  const s = fs.readFileSync(dosya, 'utf8');
  if (s.includes(yeni)) return;
  if (!s.includes(eski)) throw new Error(`${dosya}: "${eski}" bulunamadı`);
  fs.writeFileSync(dosya, s.replace(eski, yeni));
}

function android(surum) {
  // 1) Ekran hep yatay (iki yön), uygulama ekran boyutu değişince yeniden başlamasın.
  const manifest = path.join(AND, 'app/src/main/AndroidManifest.xml');
  degistir(manifest, '<activity', '<activity\n            android:screenOrientation="sensorLandscape"');

  // 2) Sürüm numarası: her derleme bir öncekinin üzerine kurulabilsin.
  const gradle = path.join(AND, 'app/build.gradle');
  let g = fs.readFileSync(gradle, 'utf8');
  const kod = Math.max(1, parseInt(surum, 10) || 1);
  g = g.replace(/versionCode \d+/, `versionCode ${kod}`).replace(/versionName "[^"]*"/, `versionName "2.${kod}"`);
  // 3) İmza: anahtar ortam değişkenleriyle verildiyse sürüm (release) APK'sı onunla imzalanır.
  if (!g.includes('signingConfigs {')) {
    g = g.replace(/android \{/, `android {
    signingConfigs {
        oyun {
            def ks = System.getenv("BA_KEYSTORE")
            if (ks) {
                storeFile file(ks)
                storePassword System.getenv("BA_KEYSTORE_PASS")
                keyAlias System.getenv("BA_KEY_ALIAS")
                keyPassword System.getenv("BA_KEY_PASS")
            }
        }
    }`);
    g = g.replace(/buildTypes \{\s*release \{/, (m) => `${m}\n            if (System.getenv("BA_KEYSTORE")) signingConfig signingConfigs.oyun`);
  }
  fs.writeFileSync(gradle, g);

  // 4) Tam ekran: durum çubuğu ve gezinme tuşları gizli, kenardan kaydırınca bir an görünür.
  const java = bul(path.join(AND, 'app/src/main/java'), 'MainActivity.java');
  const paket = fs.readFileSync(java, 'utf8').match(/package\s+([\w.]+);/)[1];
  fs.writeFileSync(java, `package ${paket};

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        tamEkran();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) tamEkran();
    }

    private void tamEkran() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.hide(WindowInsetsCompat.Type.systemBars());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
}
`);
  console.log('android hazır, sürüm', kod);
}

function bul(dizin, ad) {
  for (const e of fs.readdirSync(dizin, { withFileTypes: true })) {
    const p = path.join(dizin, e.name);
    if (e.isDirectory()) { const r = bul(p, ad); if (r) return r; } else if (e.name === ad) return p;
  }
  return null;
}

const [adim, arg] = process.argv.slice(2);
if (adim === 'www') www();
else if (adim === 'android') android(arg);
else { console.error('kullanım: node hazirla.js www | android <sürüm>'); process.exit(1); }
