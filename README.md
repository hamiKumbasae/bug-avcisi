# Bug Avcısı: İstanbul

Bilgisayar mühendisi bir kahramanla İstanbul'da geçen, tarayıcıda çalışan özgün bir platform oyunu.
İstanbul'un bütün sistemlerine bug'lar sızmış; Maslak'taki plazalardan Çamlıca Kulesi'ne kadar her bölümün
sonundaki **DEPLOY** terminaline ulaş, her dünyanın sonunda patronu yen.

**Oyna:** https://hamikumbasae.github.io/bug-avcisi/

Kurulum gerekmez: düz HTML, CSS ve JavaScript. Bütün çizimler, müzikler ve bölümler bu proje için yapıldı.

Çizimler çizgi film tarzında ve vektördür: oyun ekranın gerçek çözünürlüğünde çizildiği için telefonda da
4K ekranda da pürüzsüz görünür. Her dünyanın arka planında dünyaca tanınan bir İstanbul simgesi var:
Ayasofya, Sultanahmet Camii, Kız Kulesi, Galata Kulesi, Boğaz Köprüsü, Ortaköy Camii, Haydarpaşa Garı,
Çamlıca Kulesi; aralarda kırmızı nostaljik tramvay, Şehir Hatları vapuru, simitçi, martılar ve kediler.

## Dünyalar

9 dünya, her biri 3 bölüm (toplam 27). Her dünyanın 3. bölümünün sonunda bir patron var.

| Dünya | Yer | Bölümler | Patron |
|---|---|---|---|
| 1 | Maslak plazaları | Açık Ofis · Toplantı Katı · Sunucu Katı | Kral Bug |
| 2 | Kadıköy çarşısı | Rıhtım Caddesi · Balık Pazarı · Moda Yokuşu | Spam Kraliçesi |
| 3 | Boğaz vapuru | İskele · Güverte · Kaptan Köşkü | Dev Martı |
| 4 | Kapalıçarşı | Kuyumcular · Halıcılar · Bedesten | Truva Atı |
| 5 | Yerebatan Sarnıcı | Sütunlar · Medusa · Karanlık Su | Bellek Sızıntısı |
| 6 | Galata yokuşları | Kamondo Merdivenleri · Kuledibi · Çatı Arası | Sonsuz Döngü |
| 7 | Boğaz Köprüsü | Ayak · Halatlar · Tepe | DDoS Bulutu |
| 8 | Gece çatıları | Bacalar · Antenler · Saat Kulesi | Glitch |
| 9 | Çamlıca Kulesi | Tepe Yolu · Asansör · Yayın Odası | Mavi Ekran |

Ana menüdeki **Bölüm seç** ile 27 bölümden istediğine doğrudan başlayabilirsin.

Her bölümün ortasında bir **commit noktası** var: ölürsen oradan devam edersin. Oyun bitince
"Devam et" ile o dünyanın başından yeniden başlarsın; ulaştığın en ileri dünya menüde kayıtlı kalır.

## Kontroller

| Tuş | İş |
|---|---|
| ← → (ya da A D) | yürü |
| Z, Boşluk ya da ↑ | zıpla (uzun basınca daha yükseğe) |
| X ya da Shift | koş; laptop varken `{ }` kod fırlat |
| ↓ | ince platformdan aşağı in |
| P / Esc | duraklat |
| M | ses aç / kapat |
| K | telefonu kumanda yap |
| F | tam ekran |

- **Oyun kolu:** bilgisayara bağlı kollar (Xbox, PlayStation vb.) doğrudan çalışır.
- **Dokunmatik:** telefonda ve tablette ekranın altında (yatay tutunca iki yanda) tuşlar çıkar.
- **Telefonu kumanda yapmak:** menüden *Telefonla oyna*'ya bas, telefonla QR kodu okut. Telefon yön haçı,
  ZIPLA ve KOŞ tuşlarıyla oyun kolu gibi çalışır. Eşleştirmeyi PeerJS'in ücretsiz sunucusu yapar;
  oyun verisi telefonla bilgisayar arasında doğrudan (WebRTC) akar.
- TV ya da projeksiyon için adresin sonuna `?tv` ekle: oyun ekranı kaplar.

## Toplananlar ve düşmanlar

- **Simit:** 100 simit = +1 can.
- **Komut bloğu (`>_`):** alttan vur; içinden simit, çay, laptop, kahve ya da disket çıkar.
- **Çay:** büyürsün; büyükken çatlak blokları kırarsın, bir darbe alınca küçülürsün.
- **Laptop:** siyah kapüşonlu "hacker" moduna geçersin ve `{ }` kod fırlatırsın.
- **Kahve:** kısa süre dokunulmazlık; değdiğin düşman yenilir.
- **Disket:** +1 can.
- **Bug** üstüne basılınca ezilir. **Spam** zarfı uçar. **Martı** üstüne dalış yapar.
  **Virüs** dikenlidir, üstüne basılmaz: kodla ya da kahveyle yen. **Döngü** dönen kıvılcımlardır, yenilmez.
- **Kısa devre** (dikenli kablolar) can yakar.

## Geliştirme

```
python3 -m http.server      # sonra http://localhost:8000
node tests/core.test.js     # fizik, bloklar, düşmanlar, eşyalar, akış, 9 patron
node tests/levels.test.js   # 27 bölümün hepsi gerçek zıplama fiziğiyle baştan sona geçilebiliyor mu
python3 tools/bolumler.py   # bölümleri yeniden üret (src/levels.js)
```

- `src/core.js`: oyun kuralları; çizimden bağımsızdır, testler Node'da çalıştırır.
- `src/levels.js`: `tools/bolumler.py` ile parçalardan üretilen 27 bölüm (tohumlu, her seferinde aynı çıkar).
- `src/art.js`: vektör çizimler: kahraman, düşmanlar, eşyalar, 9 patron, her dünyanın karoları.
- `src/scenes.js`: İstanbul arka planları (iki katmanlı, kaydırmalı) ve başlık ekranının İstanbul silueti.
- `tools/onizle.html`: bütün çizimleri ve arka planları tek sayfada görmek için geliştirme önizlemesi.
- `src/audio.js`: sentezlenmiş efektler ve her dünyanın özgün çiptün müziği
  (Kapalıçarşı ve Yerebatan'da Hicaz, gece çatılarında Kürdi dizisi).
- `src/main.js`: ekranlar, kamera, HUD, giriş (klavye, dokunmatik, oyun kolu).
- `src/remote.js`, `kumanda.html`: telefon kumandası.

Her `main` gönderiminde GitHub Actions testleri çalıştırır ve siteyi GitHub Pages'e yayınlar.

## Lisans

Kod MIT lisanslıdır (`LICENSE`). Fredoka yazı tipi SIL Open Font License ile gelir
(`src/fonts/OFL-fredoka.txt`). PeerJS ve qrcode-generator MIT lisanslıdır.
