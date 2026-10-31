# Bug Avcısı: İstanbul

Bilgisayar mühendisi bir kahramanla İstanbul'da geçen, tarayıcıda çalışan özgün bir platform oyunu.
Bütün oyun tek bir gün ve gecede geçer: sabah Maslak'ın plazalarında başlar, öğlen Kapalıçarşı'ya iner,
gün batımında Üsküdar sahilindedir, gece yarısı Eyüp'ün tepesine varır, şafakta Ümraniye'ye, evine döner.
Her bölümün sonundaki **DEPLOY** terminaline ulaş, her dünyanın sonunda patronu yen.

**Oyna:** https://hamikumbasae.github.io/bug-avcisi/

Kurulum gerekmez: düz HTML, CSS ve JavaScript. Bütün çizimler, müzikler ve bölümler bu proje için yapıldı.

Çizimler çizgi film tarzında ve vektördür: oyun ekranın gerçek çözünürlüğünde çizildiği için telefonda da
4K ekranda da pürüzsüz görünür. İstanbul bugün yaşanan bir şehir olarak gösterilir: cam kuleler, ofis katları,
kuyumcular, hanlar, iskeleler, sanayi siteleri, mahalle çatıları; Kız Kulesi, Boğaz Köprüsü, Şile Feneri,
Çamlıca Kulesi, metrobüs, Marmaray, tramvay, dolmuş, simitçi ve martılar. Ağaçlar İstanbul'un ağaçlarıdır:
caddelerde ve sahilde alacalı gövdeli çınarlar ve pembe-mor erguvanlar, mahallelerde beyaz çiçekli erikler,
Çamlıca'nın sırtlarında fıstık çamları, Eyüp'te serviler. Gökyüzündeki ay, oynadığın gün İstanbul'dan nasıl
görünüyorsa öyle çizilir.

## Hikâye

Oyun yazısız bir hikâye anlatır. Kahraman Ümraniye'de bir binada yaşar: altta demir dövdüğü atölye, üstte gece
kod yazdığı oda. İki iş, iki dünya; ikisinin arasında kalmıştır. Büyük şehirde kendine bir yer arar.
İçinde bir yas taşır; kimin için olduğu hiçbir yerde söylenmez.

İstanbul iki katmanlıdır. **Yukarıda** bugünün şehri var: Maslak, Şişli, Ataşehir'in kuleleri, Boğaz Köprüsü,
Çamlıca. **Aşağıda** eski İstanbul: Kapalıçarşı, Üsküdar, Yerebatan, Eyüp, Şile, sanayi. Kahraman iki katman
arasında metrobüs, metro, Marmaray, tramvay, dolmuş ve taksiyle gidip gelir. Yukarıda çalışarak kaçar,
aşağı indikçe yüzleşir. Oyun bu ikiliği çözmez: sonunda kahraman aynı binaya döner ve atölyeyle odasının
arasında, kapının önündeki taburelerden birine oturur. Öbür tabure boş kalır.

Demircilik oyunda az ve yerinde görünür: girişte atölyenin ocağı, Kapalıçarşı'dan sonra ustanın uzattığı keski,
Yerebatan'ın suyunda örsün başındaki kendi yansıması, Kadosan'daki tek dövmeci ve sondaki atölye.

- **Sahneler:** oyunun başında, her dünyanın sonunda ve en sonda kısa, sessiz sahneler var. Tek kelime yok;
  hikâyeyi ışık, kompozisyon, hareket ve şehir sesleri anlatır. Işık dili Edward Hopper'ın resimlerinden
  esinlidir (tablolar kopyalanmaz): sert ışık, düz renk alanları, cam ardında ya da tek lambanın altında tek
  başına insanlar. Herhangi bir tuşla ya da dokunarak atlanabilirler.
- **Eyüp:** oyunun en sessiz dünyası. Az düşman, sade müzik; 3. bölümde düşman, patron, süre ve müzik yok:
  tepeye yürürsün ve bölüm iki kişilik bir bankta biter.
- **Ufuktaki ev:** Çamlıca Kulesi birçok dünyanın ufkunda görünür; ilerledikçe yaklaşır.
- **Hatıra parçaları:** her dünyanın 2. bölümünde, yoldan ayrılan yüksek bir köşede bir parça var:
  eski bir kartvizit, keski, eski bir ulaşım kartı, ince belli çay bardağı, anahtar, gözlük, eski bir fotoğraf,
  kurumuş karanfil, deniz kabuğu, demirci çekici, lale, eski bir radyo. Topladıkların kalıcı olarak kaydedilir;
  oyunun sonunda ve Bölüm seç ekranında yan yana görünür.
- **Ses:** her bölümün kendi şehir sesi var (kepenkler ve pazarlık, metrobüs, vapur düdüğü ve martılar,
  damlayan su, teleferiğin halatı, gece yolunda tek tük araba, torna ve kaynak).

## Dünyalar

12 dünya, her biri 3 bölüm (toplam 36). Her bölüm ayrı bir mekânda ve günün bir saatinde geçer: kendi arka planı,
ışığı, zemini, şehir sesi ve bölüm tipi vardır (dış mekânda koşu ve bloklar; iç mekânda tavanlı dar koridorlar;
patron bölümlerinde kale gibi tuzaklar). Eyüp dışındaki her dünyanın 3. bölümünün sonunda bir patron var (11 patron).

Bölümlerin hepsi elle tasarlandı. Her dünyanın kendine özgü düzenekleri var; her bölüm aynı sırayla kurulur:
düzeneği **tanıt** (güvenli bir yerde göster), **geliştir** (zorlaştır), **ters köşe** (düzeneği beklenmedik bir
şekilde kullan), **sına** (hepsini bir arada iste). Her bölümde üç **altın simit**, bir gizli yol, en az iki kayıt
noktası ve gülümseten küçük anlar var. Süre 300'den 430 saniyeye çıkar.

| Dünya | Düzenekler |
|---|---|
| 1 Maslak | kartlı cam kapılar, soğutma fanları, sıcak kabinler, simitçi tezgâhının tentesi, uyuyan ve kaçan bug'lar |
| 2 Kapalıçarşı | kuyumcu terazileri (yüksekten düşünce sapan olur), çürük tahtalar, tepsisine binilen çaycı, kepenkler |
| 3 Şişli | yaya ışığında sıkışan trafik (tavanlar köprü olur), kata giden asansörler, döner kapı, sensörlü lambalar |
| 4 Üsküdar | vapurlar, binince giden kayıklar, simit kapan martılar, tenteler ve yuvarlanan karpuzlar, dalgalar ve sallar |
| 5 Ataşehir | yanıp sönen borsa panoları, canlı grafik, lazer alarmı (kapılar iner, yangın kapakları köprü olur), şalterler, elektrikli ızgaralar |
| 6 Yerebatan | zıpladıkça itilen sandallar ve akıntılar, Medusa'nın bakışı (bug taşa döner, basamak olur), yükselen su ve pompalar |
| 7 Köprü | yan rüzgâr ve kirişlerin korunağı, halat makaraları ve fırlatan tampon, rüzgârla sallanan bakım sepetleri |
| 8 Eyüp | yükseğe sektiren çamaşır ipleri, teleferik ve direk kolları, sessiz tepe |
| 9 Şile | farların aydınlattığı yol (araç tavanında yolculuk; dolmuş durakta binilene dek bekler), oto yıkama fırçaları ve köpük baloncukları, fener ışığında beliren basamaklar |
| 10 Sanayi | yürüyen bantlar ve yığılan koliler, hidrolik presler, kızgın demir, sıçratan şahmerdan |
| 11 Çamlıca | sisle beliren cam teraslar, dolap asansörler, fırlatan yayın dalgaları |
| 12 Ümraniye | şafakla açılan kepenkler ve tezgâhlar, vinç kancaları, önceki dünyaların düzenekleriyle eve giden yol |

**Amaç:** Maslak'tan başlayıp şehri bir gün ve gecede geçerek Ümraniye'ye, eve varmak; yol boyunca 12 hatıra
parçasını toplamak. Her bölümün başındaki İstanbul haritası rotayı, bulunduğun semti ve topladığın parçaları gösterir.

| Dünya | Yer | Katman | Saat | Bölümler | Patron |
|---|---|---|---|---|---|
| 1 | Maslak | yukarı | sabah | Büyükdere Caddesi · Toplantı Katı (gökdelenin içi) · Sunucu Katı | Kral Bug |
| 2 | Kapalıçarşı | aşağı | öğle | Kuyumcular (floresan, altın panoları) · Han (gümüş ve altın atölyeleri, hamallar, çay ocağı) · Bedesten (yarı boş taş salon) | Truva Atı |
| 3 | Şişli | yukarı | öğleden sonra → akşamüstü | Mecidiyeköy Meydanı · Plaza Lobisi · Mesai Sonu (ışıklar teker teker söner) | Spam Kraliçesi |
| 4 | Üsküdar | aşağı | gün batımı | İskele · Çarşı · Sahil (Kız Kulesi) | Dev Martı |
| 5 | Ataşehir | yukarı | gece | Finans Merkezi (cam kuleler, cephe asansörleri, dev LED cephe) · Veri Merkezi · Kontrol Odası | Fidye Yazılımı |
| 6 | Yerebatan Sarnıcı | aşağı | yer altı | Sütunlar · Medusa (yeşil ışık) · Karanlık Su | Bellek Sızıntısı |
| 7 | Boğaz Köprüsü | yukarı | gece | Ayak · Halatlar · Tepe | DDoS Bulutu |
| 8 | Eyüp | aşağı | gece yarısı | Balat Yokuşu · Teleferik (kabinlerin üstünde) · Tepe (sessiz) | yok |
| 9 | Şile | aşağı | gece yarısından sonra | Gece Yolu (orman kenarı) · Benzin İstasyonu · Fener (fırtına) | Sonsuz Döngü |
| 10 | Sanayi (Dudullu) | yukarı + aşağı | gece yarısından sonra → şafak öncesi | İMES (gece vardiyası: torna, kaynak, CNC) · DES (depo rafları, forkliftler) · Kadosan (tornacı, kalıpçı, tek bir dövmeci, motorcu; dolaşık kablolar) | Spagetti Kod |
| 11 | Çamlıca | yukarı | şafak öncesi | Tepe Yolu (fıstık çamları) · Asansör (cam boşluk) · Yayın Odası | Mavi Ekran |
| 12 | Ümraniye | ev | şafak → sabah | Çarşı (şafakta; bakkal, fırın, çay ocağı, erik ağacı) · Yeni Plazalar (M5) · Çatı (apartmanın çatısı: su depoları, güneş panelleri, güvercinlik) | Teknik Borç |

Ana menüdeki **Bölüm seç** ile 36 bölümden istediğine doğrudan başlayabilirsin.

Her bölümde birkaç **commit noktası** var: ölürsen en son geçtiğinden devam edersin. Oyun bitince
"Devam et" ile o dünyanın başından yeniden başlarsın; ulaştığın en ileri dünya menüde kayıtlı kalır.

## Kontroller

| Tuş | İş |
|---|---|
| ← → (ya da A D) | yürü |
| Z, Boşluk ya da ↑ | zıpla (uzun basınca daha yükseğe) |
| X ya da Shift | koş; laptop varken `{ }` kod fırlat |
| ↓ | ince platformdan aşağı in; durak ya da istasyon girişinde araca bin |
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

- **Can:** sonsuz. Düşersen küçülürsün ve son kayıt noktasından devam edersin; oyun bitmez.
- **Simit:** 100 simit = 5000 puan.
- **Komut bloğu (`>_`):** alttan vur; içinden simit, çay, laptop, kahve ya da disket çıkar.
- **Çay:** büyürsün; büyükken çatlak blokları kırarsın, bir darbe alınca küçülürsün.
- **Laptop:** siyah kapüşonlu "hacker" moduna geçersin ve `{ }` kod fırlatırsın.
- **Kahve:** kısa süre dokunulmazlık; değdiğin düşman yenilir.
- **Disket:** 5000 puan.
- **Bug** üstüne basılınca ezilir. **Spam** zarfı uçar. **Martı** üstüne dalış yapar.
  **Virüs** dikenlidir, üstüne basılmaz: kodla ya da kahveyle yen. **Döngü** dönen kıvılcımlardır, yenilmez.
- **Kısa devre** (dikenli kablolar) can yakar.

## Bölümlerde gizli şeyler

- **Hız ve zıplama:** yavaş yavaş hızlanırsın, bırakınca biraz kayarsın, ters yöne basınca savrulursun.
  Koşarken zıplarsan daha yükseğe ve uzağa gidersin.
- **Tırmanış ve iniş:** normal bölümlerin çoğunda kamera yukarı-aşağı da kayar. Zikzak platformlarla
  bir kat yukarı tırmanırsın (plaza lobisi, köprü kulesi, Çamlıca'nın asansör boşluğu) ya da simitlerin aşağı
  aktığı bir boşluktan inersin (Yerebatan'ın derinlikleri, hanın mahzeni).
- **Gizli blok:** her normal bölümde bir tane görünmez blok var; alttan vurunca disket (5000 puan) çıkar.
- **Çok simitli blok:** bazı çatlak bloklar kırılmaz; birkaç saniye boyunca her vuruşta simit verir.
- **Bonus binişleri:** on bir bölümde bir durak ya da istasyon girişi var. Üstünde ↓'ye bas: bekleyen aracın
  tavanına çıkınca araç kalkar ve seni bölümün epey ilerisine götürür. Biniş kolaydır: düşman yok, yol boyunca
  simit yayları, bir güç bloğu ve öbür durakta gizli bir disket var. Giderken zıplarsan araca geri inersin;
  yola ya da raylara düşersen ölmezsin, binişten çıkarsın. Her biniş o dünyaya nasıl gelindiğini anlatır:

  | Bölüm | Araç | Güzergâh |
  |---|---|---|
  | 1-1 Büyükdere Caddesi | körüklü metrobüs (34) | Zincirlikuyu → Mecidiyeköy |
  | 2-1 Kuyumcular | tramvay (T1), Divanyolu'nda Çemberlitaş sütununun önünden | Beyazıt → Çemberlitaş |
  | 3-1 Mecidiyeköy Meydanı | metro (M2) | Taksim → Şişli-Mecidiyeköy |
  | 4-1 İskele | Marmaray (B1), deniz altından | Sirkeci → Üsküdar |
  | 5-1 Finans Merkezi | turkuaz minibüs, gece | Üsküdar → Ataşehir |
  | 6-1 Sütunlar | tramvay (T1), gece Divanyolu'nda | Sirkeci → Sultanahmet |
  | 9-1 Gece Yolu | dolmuş, gece | Üsküdar → Şile |
  | 10-1 İMES | minibüs, gece | Şile → Dudullu |
  | 11-1 Tepe Yolu | sarı taksi, gece | Çamlıca → Kısıklı |
  | 12-1 Çarşı | turkuaz minibüs, şafakta Çamlıca'dan iniş | Kısıklı → Ümraniye |
  | 12-2 Yeni Plazalar | metro (M5) | Ümraniye → Çarşı |

  Her aracın kendi sesi var: metronun kapı "ding-dong"u, metrobüsün hava fren tıslaması, minibüsün kornası,
  taksinin iki kısa kornası, tramvayın zili.
- **Eyüp'te teleferik:** 8-2'de hareketli platformlar teleferik kabinleridir.
- **DEPLOY anteni:** bölüm sonundaki merdivenden atla; antene ne kadar yüksekten değersen o kadar puan
  (100'den 5000'e). Kalan sürenin son hanesi tekse havai fişekler patlar. Eyüp'ün tepesinde anten yok.

## Geliştirme

```
python3 -m http.server      # sonra http://localhost:8000
node tests/core.test.js     # fizik, bloklar, düşmanlar, eşyalar, binişler, akış, 11 patron, Eyüp'ün sessiz tepesi
node tests/levels.test.js   # 36 bölümün hepsi gerçek zıplama fiziğiyle baştan sona geçilebiliyor mu
node tests/moon.test.js     # ay: evre, eğiklik, yükseklik ve sahne saatleri (bilinen değerlerle)
python3 tools/bolumler.py   # bölümleri yeniden üret (src/levels.js)
```

- `src/core.js`: oyun kuralları; çizimden bağımsızdır, testler Node'da çalıştırır.
- `src/levels.js`: `tools/bolumler.py` ile parçalardan üretilen 36 bölüm (tohumlu, her seferinde aynı çıkar).
  Her bölümün bir yeri (`yer`: hangi çizim) ve sahne saati (`saat`) var.
- `src/moon.js`: o günün ayı (SunCalc ile, İstanbul'dan görünen evre, eğiklik ve yükseklik) ve sahne saatleri.
- `src/art.js`: vektör çizimler: kahraman, düşmanlar, eşyalar, patronlar, hatıra parçaları, karolar.
- `src/scenes.js`: İstanbul arka planları (iki katmanlı, kaydırmalı), başlık ekranı, ay çizimi ve ışık sistemi:
  bir çizimin başka saatteki hâli (akşamüstü sarısı, gece laciverdi; lamba haleleri ve pencereler yeniden yanar).
  İstanbul ağaçları da burada: `cinar`, `erguvan`, `erik`, `fistikCami` (her biri kendi tohumuyla, renkleri değiştirilebilir).
- `src/places.js`: bölüm mekânları (gökdelenin içi, sunucu odası, han, bedesten, sarnıç, fırtına, Ataşehir...).
- `src/places2.js`: v2.0 mekânları: eski çizimlerin başka ışıktaki hâlleri ve yeni çizimler (plaza lobisi,
  Eyüp'ün teleferiği ve tepesi, Şile yolu, benzin istasyonu, Şile Feneri, DES, Kadosan'ın atölye sırası,
  Ümraniye'nin şafağı ve çatıları).
- `src/rides.js`: bonus binişleri: metrobüs, tramvay, minibüs, taksi ve metro çizimleri, duraklar, sokak arka planları.
- `src/story.js`: yazısız hikâye sahneleri (giriş, 11 ara sahne, son).
- `src/audio.js`: sentezlenmiş efektler, şehir sesleri ve her dünyanın özgün çiptün müziği.
- `src/main.js`: ekranlar, kamera, HUD, harita, giriş (klavye, dokunmatik, oyun kolu).
- `src/remote.js`, `kumanda.html`: telefon kumandası.
- `src/skor.js`: çevrimiçi skor tablosu (koşu bitince ad sorar, ilk 10'u gösterir). En üstteki `SKOR_API` boşsa
  kapalıdır ve oyun eskisi gibi çalışır.
- `skor-api/`: skor tablosunun sunucusu (FastAPI + MariaDB, Raspberry Pi'de Cloudflare Tunnel ile).
  Bug Avcısı ve Boğaz Yolu'na birlikte hizmet eder. Ayrıntılar `skor-api/README.md`, kurulum `skor-api/DEPLOY.md`.
- `tools/onizle.html`: çizimleri tek tek görmek için geliştirme önizlemesi (`?k=teleferik`, `?m=story&k=eyup&t=6`,
  `?m=pieces`, `?m=sprites`, `?m=tiles`, `?m=title`).

Her `main` gönderiminde GitHub Actions üç testi çalıştırır ve siteyi GitHub Pages'e yayınlar.

## Çevrimiçi skor tablosu

Canlar sonsuz olduğu için oyun "bitmez". Bir koşu, duraklat menüsünden *ANA MENÜ*'ye dönünce ya da oyunun sonunda biter.
O anda ad sorulur ve skor çevrimiçi tabloya gönderilir. **Skor tablosu** düğmesi tüm zamanların ve bu haftanın
ilk 10'unu gösterir. Sunucuya ulaşılamazsa oyun takılmaz, yerel rekor her zaman kaydedilir.

## Sürümler

Oyun büyük değişikliklerden önce saklanır: her sürüm bir commit'e bağlıdır. Site her zaman son hâli gösterir; eski bir sürümü
oynamak için zip'ini indirip yerelde aç (`python3 -m http.server`).

| Sürüm | Tarih | İçerik | Kaynak |
|---|---|---|---|
| v2.2 | 30 Ekim 2026 | Elle tasarlanmış 36 bölüm: her dünyanın kendi düzeneği (terazi, trafik, vapur, borsa panoları, sandal ve Medusa, rüzgâr, çamaşır ipi, dolmuş durağı, presler, sis, vinç), her bölümde gizli yer, 3 altın simit ve kayıt noktaları; canlar sonsuz (oyun bitmez) | [`ef9a3df`](https://github.com/hamiKumbasae/bug-avcisi/tree/ef9a3df7067d2a691ab086680b6b356098524a50) · [zip](https://github.com/hamiKumbasae/bug-avcisi/archive/ef9a3df7067d2a691ab086680b6b356098524a50.zip) |
| v2.1 | 29 Ekim 2026 | İki arada: demircilik az ve yerinde, yeni son (aynı binada, atölyeyle odasının arasında), 12-3 Çatı, Kadosan'da tek dövmeci, İMES'te CNC; İstanbul ağaçları (çınar, erguvan, erik, fıstık çamı); Eyüp'te ve Şile'de görünmeyen ay düzeldi, 12-1 şafakta | [`bad79db`](https://github.com/hamiKumbasae/bug-avcisi/tree/bad79dbe653d6926ca00d016f02082529b5a2061) · [zip](https://github.com/hamiKumbasae/bug-avcisi/archive/bad79dbe653d6926ca00d016f02082529b5a2061.zip) |
| v2.0 | 29 Ekim 2026 | Yeni hikâye ve yapı: iki katmanlı İstanbul, tek gün ve gece, 12 dünya yeni sırayla (Şişli, Üsküdar, Eyüp, Şile, Sanayi yeni), Eyüp'ün sessiz tepesi, 11 patron, 11 biniş (Marmaray, gece dolmuşları), o günün gerçek ayı, yeni sahneler ve 12 yeni hatıra parçası; kedi, bayrak ve gereksiz camiler çıktı | [`6509f80`](https://github.com/hamiKumbasae/bug-avcisi/tree/6509f80dbdbe385ec1f642c11827f887f3562bee) · [zip](https://github.com/hamiKumbasae/bug-avcisi/archive/6509f80dbdbe385ec1f642c11827f887f3562bee.zip) |
| v1.0 | 29 Ekim 2026 | 12 dünya, 36 bölüm, 12 patron; 10 bonus binişi (metro, metrobüs, tramvay, minibüs, taksi, Tünel füniküleri); Ataşehir dünyası; yazısız hikâye ve 12 hatıra parçası | [`2a82261`](https://github.com/hamiKumbasae/bug-avcisi/tree/2a822611a7d55d2daf7f049f5052164add01e3b4) · [zip](https://github.com/hamiKumbasae/bug-avcisi/archive/2a822611a7d55d2daf7f049f5052164add01e3b4.zip) |

Git ile bir sürüme dönmek için: `git checkout ef9a3df` (v2.2), `git checkout bad79db` (v2.1), `git checkout 6509f80` (v2.0) ya da `git checkout 2a82261` (v1.0).

## Lisans

Kod MIT lisanslıdır (`LICENSE`). Fredoka yazı tipi SIL Open Font License ile gelir
(`src/fonts/OFL-fredoka.txt`). PeerJS ve qrcode-generator MIT lisanslıdır. Ay hesabını yapan SunCalc 1.9.0
(Vladimir Agafonkin) BSD 2 maddeli lisansla gelir (`src/vendor/LICENSE-suncalc.txt`).

## Android uygulaması (APK)

Oyun, [Capacitor](https://capacitorjs.com/) kabuğuyla Android uygulaması olarak da derlenir. `main` dalına oyunla ilgili her gönderimde
`.github/workflows/apk.yml` APK'yı GitHub'ın sunucularında derler ve [Releases](https://github.com/hamiKumbasae/bug-avcisi/releases/latest)
sayfasına `BugAvcisi.apk` olarak koyar. Telefondan indirip açmak kurmaya yeter.

- `mobil/` — uygulama ayarları (`capacitor.config.json`), simge ve açılış görselleri (`mobil/assets`), hazırlama betiği (`hazirla.js`).
- `src/app.js` — yalnızca uygulamanın içinde çalışır: geri tuşu oyunu duraklatır, ana menüde uygulamadan çıkar.
- Uygulama yatay ekrana kilitli ve tam ekran açılır.
- İmza: depo ayarlarında `BA_KEYSTORE_B64`, `BA_KEYSTORE_PASS`, `BA_KEY_ALIAS`, `BA_KEY_PASS` sırları varsa sürüm APK'sı o anahtarla imzalanır
  (yeni sürümler eskisinin üzerine kurulur). Yoksa hata ayıklama (debug) APK'sı çıkar.
