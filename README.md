# Bug Avcısı: İstanbul

Bilgisayar mühendisi bir kahramanla İstanbul'da geçen, tarayıcıda çalışan özgün bir platform oyunu.
İstanbul'un bütün sistemlerine bug'lar sızmış; Maslak'taki plazalardan Haliç'e, Ataşehir'in finans merkezine, Çamlıca'ya ve Ümraniye'ye
kadar her bölümün sonundaki **DEPLOY** terminaline ulaş, her dünyanın sonunda patronu yen.

**Oyna:** https://hamikumbasae.github.io/bug-avcisi/

Kurulum gerekmez: düz HTML, CSS ve JavaScript. Bütün çizimler, müzikler ve bölümler bu proje için yapıldı.

Çizimler çizgi film tarzında ve vektördür: oyun ekranın gerçek çözünürlüğünde çizildiği için telefonda da
4K ekranda da pürüzsüz görünür. Her dünyanın arka planında dünyaca tanınan bir İstanbul simgesi var:
Kız Kulesi, Galata Kulesi, Boğaz Köprüsü, Haydarpaşa Garı, Çamlıca Kulesi; aralarda kırmızı nostaljik tramvay,
Şehir Hatları vapuru, simitçi ve martılar.

## Hikâye

Oyun yazısız bir hikâye anlatır: Ümraniye'de, kendi atölyesinde demir döven ve gece kod yazan bir mühendis
büyük şehirde kendine bir yer arar. Kapılar hemen açılmaz. Yolun sonuna doğru plazanın kapısı da açılır,
ama o artık kendi yerinin neresi olduğunu bilir: gece otobüsünde laptopunu kapatır ve kendi durağında iner.
Ataşehir'de fidye yazılımının kilitlediği kuleleri yeniden yakar; gece bekçisi iki ince belli çayla gelip yanına oturur.

- **Sahneler:** oyunun başında, her dünyanın sonunda ve en sonda kısa, sessiz sahneler var. Tek kelime yok;
  hikâyeyi ışık, kompozisyon, hareket ve şehir sesleri anlatır. Işık dili Edward Hopper'ın resimlerinden
  esinlidir (tablolar kopyalanmaz): sert güneş ve gölge, düz renk alanları, cam ardında tek başına insanlar.
  Herhangi bir tuşla ya da dokunarak atlanabilirler.
- **Ufuktaki ev:** Çamlıca Kulesi dünyaların ufkunda görünür; ilerledikçe yaklaşır.
- **Hatıra parçaları:** her dünyanın 2. bölümünde, yoldan ayrılan yüksek bir köşede bir parça var
  (Maslak camı, martı tüyü, vapur çanı, nazar, sarnıç damlası, Galata Kulesi, Balat'ın sepeti, köprü, anten,
  Ataşehir'de fidye yazılımından geri alınan anahtar, lale, demirci çekici).
  Topladıkların kalıcı olarak kaydedilir; son sahnede atölyenin rafında durur, Bölüm seç ekranında da görünür.
- **Ses:** her dünyanın kendi şehir sesi var (martılar, vapur düdüğü, çarşı uğultusu, damlayan su, gece rüzgârı).

## Dünyalar

12 dünya, her biri 3 bölüm (toplam 36). Her bölüm ayrı bir mekânda geçer: kendi arka planı, zemini,
şehir sesi ve bölüm tipi vardır (dış mekânda koşu ve bloklar; iç mekânda tavanlı dar koridorlar;
patron bölümlerinde kale gibi tuzaklar). Her dünyanın 3. bölümünün sonunda bir patron var.

Bölümler Super Mario Bros. ölçüsünde: 1. dünyada ~210 blok ve 14 düşman (Mario 1-1: ~200 blok, 17 düşman),
ilerledikçe uzayıp kalabalıklaşır; son dünyada ~330 blok ve 20 düşman. Patron bölümlerinde arenadan önce
150-230 blokluk bir kale yolu var. Süre 300'den 400 saniyeye çıkar.

**Amaç:** Maslak'tan başlayıp şehri geçerek Ümraniye'ye, eve varmak; yol boyunca 12 hatıra parçasını toplamak.
Her bölümün başındaki İstanbul haritası rotayı, bulunduğun semti ve topladığın parçaları gösterir.

| Dünya | Yer | Bölümler | Patron |
|---|---|---|---|
| 1 | Maslak | Büyükdere Caddesi · Toplantı Katı (gökdelenin içi) · Sunucu Katı | Kral Bug |
| 2 | Kadıköy | Rıhtım Caddesi · Balık Pazarı (tenteler) · Moda Yokuşu (gün batımı) | Spam Kraliçesi |
| 3 | Vapur | İskele (sabah) · Güverte · Kaptan Köşkü (fırtına) | Dev Martı |
| 4 | Kapalıçarşı | Kuyumcular · Halıcılar · Bedesten (kubbeli taş salon) | Truva Atı |
| 5 | Yerebatan Sarnıcı | Sütunlar · Medusa (yeşil ışık) · Karanlık Su | Bellek Sızıntısı |
| 6 | Galata | Kamondo Merdivenleri · Kuledibi · Çatı Arası (Hezarfen'in kanatları) | Sonsuz Döngü |
| 7 | Haliç | Karaköy (Galata Köprüsü'nde balıkçılar) · Haliç Kıyısı (metro köprüsü, eski tersane) · Eyüp-Balat (renkli evler, Fener Rum Lisesi, teleferik) | Spagetti Kod |
| 8 | Boğaz Köprüsü | Ayak · Halatlar (bulut hizasında) · Tepe (gece) | DDoS Bulutu |
| 9 | Gece çatıları | Bacalar · Antenler · Saat Kulesi (dev çarklar) | Glitch |
| 10 | Ataşehir | Finans Merkezi (gece, cam kuleler, cephe asansörleri, dev LED cephe) · Veri Merkezi (sunucu koridorları, kablo tavaları, soğutma) · Kontrol Odası (akıllı şehrin ekran duvarı, canlı trafik haritası) | Fidye Yazılımı |
| 11 | Çamlıca | Tepe Yolu · Asansör (cam boşluk) · Yayın Odası | Mavi Ekran |
| 12 | Ümraniye | Çarşı (bakkal, fırın, çay ocağı) · Yeni Plazalar (M5) · Sanayi (torna, kaynak, dövme atölyesi) | Teknik Borç |

Ana menüdeki **Bölüm seç** ile 36 bölümden istediğine doğrudan başlayabilirsin.

Her bölümün ortasında bir **commit noktası** var: ölürsen oradan devam edersin. Oyun bitince
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

- **Simit:** 100 simit = +1 can.
- **Komut bloğu (`>_`):** alttan vur; içinden simit, çay, laptop, kahve ya da disket çıkar.
- **Çay:** büyürsün; büyükken çatlak blokları kırarsın, bir darbe alınca küçülürsün.
- **Laptop:** siyah kapüşonlu "hacker" moduna geçersin ve `{ }` kod fırlatırsın.
- **Kahve:** kısa süre dokunulmazlık; değdiğin düşman yenilir.
- **Disket:** +1 can.
- **Bug** üstüne basılınca ezilir. **Spam** zarfı uçar. **Martı** üstüne dalış yapar.
  **Virüs** dikenlidir, üstüne basılmaz: kodla ya da kahveyle yen. **Döngü** dönen kıvılcımlardır, yenilmez.
- **Kısa devre** (dikenli kablolar) can yakar.

## Bölümlerde gizli şeyler

- **Hız ve zıplama:** yavaş yavaş hızlanırsın, bırakınca biraz kayarsın, ters yöne basınca savrulursun.
  Koşarken zıplarsan daha yükseğe ve uzağa gidersin.
- **Tırmanış ve iniş:** normal bölümlerin çoğunda kamera yukarı-aşağı da kayar. Zikzak platformlarla
  bir kat yukarı tırmanırsın (Galata'nın merdivenleri, köprü kulesi, Çamlıca'nın asansör boşluğu) ya da
  simitlerin aşağı aktığı bir boşluktan inersin (Yerebatan'ın derinlikleri, iskelenin altı, çarşının mahzeni).
- **Gizli blok:** her normal bölümde bir tane görünmez blok var; alttan vurunca disket (+1 can) çıkar.
- **Çok simitli blok:** bazı çatlak bloklar kırılmaz; birkaç saniye boyunca her vuruşta simit verir.
- **Bonus binişleri:** on bölümde bir durak ya da istasyon girişi var. Üstünde ↓'ye bas: bekleyen aracın
  tavanına çıkınca araç kalkar ve seni bölümün epey ilerisine götürür. Biniş kolaydır: düşman yok, yol boyunca
  simit yayları, bir güç bloğu ve öbür durakta gizli bir disket var. Giderken zıplarsan araca geri inersin;
  yola ya da raylara düşersen ölmezsin, binişten çıkarsın. Araç bölüme göre değişir:

  | Bölüm | Araç | Güzergâh |
  |---|---|---|
  | 1-1 Büyükdere Caddesi | körüklü metrobüs (34) | Zincirlikuyu → Mecidiyeköy |
  | 2-1 Rıhtım Caddesi | metro (M4) | Kadıköy → Ayrılık Çeşmesi |
  | 2-2 Balık Pazarı | turkuaz minibüs | Kadıköy → Bostancı |
  | 4-1 Kuyumcular | tramvay (T1), Divanyolu'nda Çemberlitaş sütununun önünden | Beyazıt → Çemberlitaş |
  | 6-1 Kamondo Merdivenleri | 1875'ten beri çalışan Tünel füniküleri (F2), eğik tünelde yokuş yukarı | Karaköy → Beyoğlu |
  | 6-2 Kuledibi | metro (M2) | Şişhane → Taksim |
  | 7-2 Haliç Kıyısı | metro (M2), Haliç Metro Köprüsü | Haliç → Vezneciler |
  | 11-1 Tepe Yolu | sarı taksi, gece | Çamlıca → Kısıklı |
  | 12-1 Çarşı | turkuaz minibüs | Ümraniye → Kadıköy |
  | 12-2 Yeni Plazalar | metro (M5) | Ümraniye → Çarşı |

  Her aracın kendi sesi var: metronun kapı "ding-dong"u, metrobüsün hava fren tıslaması, minibüsün kornası,
  taksinin iki kısa kornası, tramvayın ve Tünel'in zili.
- **DEPLOY anteni:** bölüm sonundaki merdivenden atla; antene ne kadar yüksekten değersen o kadar puan
  (100'den 5000'e). Kalan sürenin son hanesi tekse havai fişekler patlar.

## Geliştirme

```
python3 -m http.server      # sonra http://localhost:8000
node tests/core.test.js     # fizik, bloklar, düşmanlar, eşyalar, binişler, akış, 12 patron
node tests/levels.test.js   # 36 bölümün hepsi gerçek zıplama fiziğiyle baştan sona geçilebiliyor mu
python3 tools/bolumler.py   # bölümleri yeniden üret (src/levels.js)
```

- `src/core.js`: oyun kuralları; çizimden bağımsızdır, testler Node'da çalıştırır.
- `src/levels.js`: `tools/bolumler.py` ile parçalardan üretilen 36 bölüm (tohumlu, her seferinde aynı çıkar).
- `src/art.js`: vektör çizimler: kahraman, düşmanlar, eşyalar, 12 patron, her dünyanın karoları.
- `src/scenes.js`: İstanbul arka planları (iki katmanlı, kaydırmalı) ve başlık ekranının İstanbul silueti.
- `src/places.js`: bölüm mekânları (gökdelenin içi, sunucu odası, balık pazarı, fırtına, saat kulesi...).
- `src/rides.js`: bonus binişleri: metrobüs, tramvay, minibüs, taksi ve füniküler çizimleri, duraklar, sokak ve Tünel arka planları.
- `src/story.js`: yazısız hikâye sahneleri (giriş, 8 ara sahne, son).
- `tools/onizle.html`: bütün çizimleri ve arka planları tek sayfada görmek için geliştirme önizlemesi.
- `src/audio.js`: sentezlenmiş efektler, şehir sesleri ve her dünyanın özgün çiptün müziği
  (Kapalıçarşı ve Yerebatan'da Hicaz, gece çatılarında Kürdi dizisi).
- `src/main.js`: ekranlar, kamera, HUD, giriş (klavye, dokunmatik, oyun kolu).
- `src/remote.js`, `kumanda.html`: telefon kumandası.

Her `main` gönderiminde GitHub Actions testleri çalıştırır ve siteyi GitHub Pages'e yayınlar.

## Sürümler

Oyun büyük değişikliklerden önce saklanır: her sürüm bir commit'e bağlıdır. Site her zaman son hâli gösterir; eski bir sürümü
oynamak için zip'ini indirip yerelde aç (`python3 -m http.server`).

| Sürüm | Tarih | İçerik | Kaynak |
|---|---|---|---|
| v1.0 | 29 Ekim 2026 | 12 dünya, 36 bölüm, 12 patron; 10 bonus binişi (metro, metrobüs, tramvay, minibüs, taksi, Tünel füniküleri); Ataşehir dünyası; yazısız hikâye ve 12 hatıra parçası | [`2a82261`](https://github.com/hamiKumbasae/bug-avcisi/tree/2a822611a7d55d2daf7f049f5052164add01e3b4) · [zip](https://github.com/hamiKumbasae/bug-avcisi/archive/2a822611a7d55d2daf7f049f5052164add01e3b4.zip) |

Git ile bu sürüme dönmek için: `git checkout 2a82261`.

## v2.0 planı: yeni hikâye ve yapı (yapılacaklar)

> Bu bölüm bir sonraki büyük sürümün planıdır, henüz uygulanmadı. Şu anki oyun v1.0 olarak saklı (bkz. Sürümler).
> Uygulanırken maddeler işaretlenir. Her adım ayrı bir commit olur ve her commit'te testler geçer.
> Plan bitince README'nin yukarıdaki bölümleri (giriş, Hikâye, Dünyalar, binişler tablosu, Bölümlerde gizli şeyler,
> Geliştirme) yeni hâle göre yeniden yazılır, Sürümler tablosuna v2.0 eklenir ve bu bölüm kaldırılır.

### Ana fikir

- **İki katmanlı İstanbul.** Zıtlık bilinçlidir ve sadece mekânın kendisiyle ve günün saatiyle kurulur.
  - **Yukarı:** bugünün İstanbul'u. Oyundaki mevcut Maslak ve Ataşehir dili aynen korunur: cam kuleler, ofis katları,
    sunucu odaları, cephe asansörleri, LED cepheler, gece ışıkları. Yeni görsel dil, filtre ya da efekt yok.
  - **Aşağı:** eski İstanbul: Kapalıçarşı, Üsküdar, Yerebatan, Eyüp, Şile. Müze ya da kartpostal değil;
    bugün insanların çalıştığı ve yaşadığı yerler.
  - Kahraman iki katman arasında metro, Marmaray, tramvay ve minibüsle gidip gelir.
- **Gizli metafor:** yukarısı yeni sistem; aşağısı herkesin dokunmaktan kaçındığı ama bütün şehrin hâlâ üstünde
  çalıştığı eski kod (legacy code). Bu fikir sadece tasarıma yön verir; ekranda gösterilmez, yazılmaz, anlatılmaz.
- **Kahraman:** yalnız bir bilgisayar mühendisi. Ümraniye'deki atölyesinde demir döver, gece kod yazar.
- **Ton:** Edward Hopper'dan esinli ışık ve kompozisyon (tablolar kopyalanmaz): sert ışık, düz renk alanları,
  cam ardında ya da tek lambanın altında tek başına insanlar. Hikâye yazısız kalır.
- **Yas:** kahraman içinde bir yas taşır. Kimin için olduğu hiçbir yerde söylenmez; oyuncu sezer (atölyeyi birlikte
  paylaştığı biri olabilir). Yas aşağıda yaşar: hatıra parçaları o kişiye aittir; sahnelerde boş sandalye ve ikinci
  çay bardağı gibi işaretler var. Yukarıda kahraman çalışarak kaçar, aşağı indikçe yüzleşir. Eyüp oyunun en sessiz dünyasıdır.
- **Oyunun sorusu:** biri gittikten sonra şehirde kendi yerini nasıl bulursun? **Cevap:** iki dünyadan birini seçmek
  değil, ikisini birleştirmek: gündüz demir dövülen, gece kod yazılan atölye.
- **Zaman:** bütün oyun tek bir gün ve gecede geçer. Sabah Maslak'ta başlar, gece yarısı Eyüp'e varır, şafakta eve dönülür.

### Kesin kurallar (oyunun her yerinde)

- [ ] **Matrix göndermesi yok.** Yeşil kod yağmuru, glitch titremesi, yeşil filtre, firewall kapıları, binişlerde renk
  değiştiren geçiş efektleri ve "kırmızı hap" yapılmayacak. Bilgisayar göndermeleri bugünkü seviyede kalır
  (bug düşmanlar, DEPLOY terminali, sunucu odaları, patron adları); yenisi eklenmez.
- [x] **Kedi yok.** `scenes.js`'teki `cat()` ve bütün çağrıları kalkar (`places.js`, `scenes.js`, `story.js`): giriş
  sahnesinde dolmuşun üstünde uyuyan kedi, çatı sahnesinde kahramanın yanına gelen kedi, son sahnedeki kedi,
  arka planlardaki kediler, hatıra parçası `kedi` ve README'deki anışlar. Yerine başka hayvan konmaz, yerleri boş kalır.
  Martılar kalabilir.
- [x] **Minare sadece Eyüp'te ve Üsküdar sahilinde.** Oralarda gerçekten görüntünün parçasıdırlar (Üsküdar'dan karşı
  kıyının uzak silüeti dahil). Başka hiçbir dünyada, arka planda, binişte, sahnede ya da başlık ekranında minare
  ve cami silüeti yok. Çıkacaklar arasında: Maslak arka planındaki uzak Sultanahmet ve Ayasofya, Köprü'deki Ortaköy
  Camii, Çamlıca'daki cami ve Yayın Odası ekranındaki cami, Ümraniye çarşısındaki ve giriş sahnesindeki cami,
  tramvay binişinin arka planındaki Ayasofya, Sultanahmet ve Firuz Ağa Camii, başlık ekranındaki Sultanahmet ve
  Ayasofya. Hepsi `grep -n "minaret\|Mosque\|hagiaSophia\|ortakoy" src/*.js` ile bulunur. Başlık ekranı minaresiz
  yeniden kurulur: modern kuleler, köprü, Kız Kulesi, Çamlıca Kulesi.
- [x] **Bayrak yok.** `flag()` hiçbir yerde çizilmez: vapurlar (`ferry` şu an varsayılan olarak bayrak çiziyor) ve
  Kız Kulesi dahil. Ay da bayraktaki hilal gibi çizilmez (aşağıda).
- [ ] **Oryantalist bakış yok.** İstanbul bugün yaşanan bir şehir olarak gösterilir. Bakış turistin değil, bu şehirde
  yaşayan birinin bakışıdır. Arka planlardaki ve sahnelerdeki insanlar bugünün insanlarıdır: mont, sırt çantası, telefon.
  Oyunda olmayacaklar: mozaik lamba yığınları, nazar boncuğu dizileri, halı ve baharat yığınları, nargile, fes, sarık,
  derviş, uçan halı, "gizemli Doğu" havası veren sis ya da sepya tonları, kartpostal kareler. Kapalıçarşı'nın
  ayrıntısı Bölümler tablosunda, müzik Müzik ve ses bölümünde.
- [x] **Ay, o gün İstanbul'dan nasıl görünüyorsa öyle çizilir** (Ay bölümünde).

### Yeni dünya sırası (12 dünya × 3 bölüm = 36, yapı aynı kalır)

| # | Dünya | Katman | Saat | Bölümler | Patron | Kaynak |
|---|---|---|---|---|---|---|
| 1 | Maslak | Yukarı | sabah | Büyükdere Caddesi · Toplantı Katı · Sunucu Katı | Kral Bug | aynen |
| 2 | Kapalıçarşı | Aşağı | öğle | Kuyumcular · Han · Bedesten | Truva Atı | 4. dünyadan; oryantalist öğeler çıkar, 2. bölüm Han olur |
| 3 | Şişli | Yukarı | öğleden sonra → akşamüstü | Mecidiyeköy Meydanı · Plaza Lobisi · Mesai Sonu | Spam Kraliçesi | yeni; Maslak çizimlerinden |
| 4 | Üsküdar | Aşağı | gün batımı | İskele · Çarşı · Sahil | Dev Martı | yeni; Kadıköy ve Vapur çizimlerinden |
| 5 | Ataşehir | Yukarı | gece | Finans Merkezi · Veri Merkezi · Kontrol Odası | Fidye Yazılımı | 10. dünyadan, aynen |
| 6 | Yerebatan | Aşağı | yer altı | Sütunlar · Medusa · Karanlık Su | Bellek Sızıntısı | 5. dünyadan, aynen |
| 7 | Köprü | Yukarı | gece | Ayak · Halatlar · Tepe | DDoS Bulutu | 8. dünyadan; 1. ve 2. bölüm gece ışığına çevrilir |
| 8 | Eyüp | Aşağı | gece yarısı | Balat Yokuşu · Teleferik · Tepe | **yok** | yeni; Haliç çizimlerinden |
| 9 | Şile | Aşağı | gece yarısından sonra | Gece Yolu · Benzin İstasyonu · Fener | Sonsuz Döngü | yeni; patron Galata'dan (bitmeyen yol) |
| 10 | Sanayi | Yukarı + Aşağı | gece yarısından sonra → şafak öncesi | İMES · DES · Kadosan | Spagetti Kod | yeni; Ümraniye'nin Sanayi çiziminden |
| 11 | Çamlıca | Yukarı | şafak öncesi | Tepe Yolu · Asansör · Yayın Odası | Mavi Ekran | aynen (cami çıkar) |
| 12 | Ümraniye | Ev | şafak → sabah | Çarşı · Yeni Plazalar · Atölye | Teknik Borç | 3. bölüm Sanayi yerine Atölye |

- **Silinen dünyalar:** Kadıköy, Vapur, Galata, Haliç, Gece Çatıları. Çizimlerinin bir kısmı yeni dünyalarda yeniden kullanılır.
- **Kullanılmayan patron:** Glitch. Kodda kalabilir ama hiçbir bölümde kullanılmaz; testlerden çıkar.
- **Bölüm saatleri:** 1-x sabah · 2-x öğle · 3-1, 3-2 öğleden sonra, 3-3 akşamüstü · 4-x gün batımı · 5-x gece ·
  6-x yer altı · 7-x gece · 8-x gece yarısı · 9-x gece yarısından sonra · 10-1, 10-2 gece yarısından sonra,
  10-3 şafak öncesi · 11-x şafak öncesi · 12-1 şafak, 12-2, 12-3 sabah.
- **Yeniden kullanım ilkesi:** yeni dünyalar sıfırdan çizilmez; silinen dünyaların çizimleri farklı ışıkta yeniden
  kullanılır. Yeni çizim ihtiyacı: benzin istasyonu, Han, DES'in depo rafları, Eyüp, Şile ve Sanayi sahneleri,
  yeni hatıra parçaları.

### Bölümler: hangi mevcut çizim kullanılacak

Tabloda olmayan bölümler (Maslak, Ataşehir, Yerebatan, Köprü 7-3, Çamlıca, Ümraniye 12-1) mevcut hâliyle kalır;
sadece kesin kurallar uygulanır (kedi, minare, bayrak).

| Bölüm | Mevcut çizim | Değişiklik |
|---|---|---|
| 2-1 Kuyumcular | Kapalıçarşı dünya çizimi (`scenes.js`) | Çizgili kemerler kalır. Mozaik lambalar, halılar, baharat, nazar ve BAHARAT, LAMBA, NAZAR tabelaları çıkar. Kuyumcu vitrinleri, floresan ışık, altın fiyatı panoları, güvenlik kameraları ve sıradan kalabalık eklenir. |
| 2-2 Han | Halıcılar (`places.js`) | Halılar, alçak tabure ve çay tepsisi çıkar. Eski bir hanın avlusu ve üst katı: gümüş ve altın atölyeleri, ocakta eriyen maden, çalışan ustalar, kargo kolileri, hamallar, çay ocağı. Kahramanın demirciliğiyle bağ burada kurulur. |
| 2-3 Bedesten | Bedesten | Taş kubbeler kalır. Bakır kaplar, eski saatler ve gramofon çıkar. Öğle sıcağında yarı boş salon, inik kepenkler, bir bekçi. Truva Atı arenası. |
| 3-1 Mecidiyeköy Meydanı | Büyükdere Caddesi (1-1) | Öğleden sonra ışığı; Yeni Plazalar'daki (12-2) büyük ekran. |
| 3-2 Plaza Lobisi | Toplantı Katı (1-2) ve Yeni Plazalar'daki plaza girişi | Öğleden sonra ışığı. |
| 3-3 Mesai Sonu | Toplantı Katı | Akşamüstü: ofis boşalıyor, ışıklar teker teker kapanıyor, tek masa lambası yanık kalıyor. Spam Kraliçesi arenası. |
| 4-1 İskele | İskele (Vapur 3-1) | Gün batımı ışığı; vapur bayraksız. |
| 4-2 Çarşı | Balık Pazarı (Kadıköy 2-2) | Gün batımı ışığı. |
| 4-3 Sahil | Moda Yokuşu (Kadıköy 2-3) | Gün batımı; karşı kıyının uzak silüeti, Kız Kulesi (bayraksız), vapur. Dev Martı arenası. |
| 7-1 Ayak, 7-2 Halatlar | mevcut | Gece ışığına çevrilir. |
| 8-1 Balat Yokuşu | Eyüp-Balat (Haliç 7-3) | Gece ışığı. |
| 8-2 Teleferik | Eyüp-Balat'taki teleferik | Gece. |
| 8-3 Tepe | Haliç Kıyısı (7-2) | Gece hâli, sade; tepede iki kişilik bank. |
| 9-1 Gece Yolu | mevcut parçalar: çam (`pine`), tepeler (`hills`), sokak lambası | Şehir dışı, orman kenarında gece yolu; şehir ışıkları yok. |
| 9-2 Benzin İstasyonu | **yeni çizim** | Yol kenarında ıssız bir istasyon, floresan saçak, tek görevli. |
| 9-3 Fener | Kaptan Köşkü (Vapur 3-3) | Fırtına kalır; uzaktaki deniz feneri ön plana alınır (Şile Feneri). Sonsuz Döngü arenası. |
| 10-1 İMES | Sanayi (Ümraniye 12-3) | Gece vardiyası: yanan floresanlar, yarı açık kepenkler. |
| 10-2 DES | Sanayi | Depo rafları ve forkliftler eklenir. |
| 10-3 Kadosan | Sanayi | Şafak öncesi; dövme atölyeleri, ocak ve örsler. Spagetti Kod arenası (dolaşık kablolar ve hortumlar). |
| 12-2 Yeni Plazalar | mevcut | Akşamüstü yerine sabah ışığı. |
| 12-3 Atölye | Sanayi'deki dövme atölyesi ve son sahnedeki atölye | Sabah ışığı. Teknik Borç arenası. |

### Eyüp: oyunun sessiz dünyası

- [x] 8-1 ve 8-2 normal bölümler ama az düşmanlı (sadece bug); müzik sadeleşir.
- [x] 8-3 Tepe kısa bir bölüm (~100 karo): düşman yok, patron ve kale yolu yok, süre sayacı durur (HUD'da süre
  görünmez), müzik yok; sadece rüzgâr ve uzak şehir sesi. Simit ve blok çok az.
- [x] 8-3'ün sonunda DEPLOY anteni yok: tepedeki banka varınca bölüm biter ve doğrudan Eyüp sahnesi başlar.
- Oyuncu ilk kez hiçbir şeyle savaşmadan yürür. Etkisi zıtlıktan gelir; o yüzden önceki dünyalar hızlı ve kalabalık kalır.

### Binişler (bonus binişleri)

Biniş sistemi aynen kalır, ek efekt yok. Her biniş o dünyaya nasıl gelindiğini anlatan küçük bir parçadır.

| Bölüm | Araç | Güzergâh | Kaynak |
|---|---|---|---|
| 1-1 Büyükdere Caddesi | metrobüs (34) | Zincirlikuyu → Mecidiyeköy | aynen |
| 2-1 Kuyumcular | tramvay (T1) | Beyazıt → Çemberlitaş | aynen (dünyasıyla taşınır); arka plandaki camiler çıkar |
| 3-1 Mecidiyeköy Meydanı | metro (M2) | Taksim → Şişli-Mecidiyeköy | Galata 6-2 binişi (Şişhane → Taksim), yeniden adlandırılır |
| 4-1 İskele | Marmaray | Sirkeci → Üsküdar (deniz altından) | Kadıköy 2-1 metro binişi; mevcut metro çizimi, hat adı ve rengi Marmaray |
| 5-1 Finans Merkezi | minibüs | Üsküdar → Ataşehir | Kadıköy 2-2 minibüs binişi |
| 6-1 Sütunlar | tramvay (T1) | Sirkeci → Sultanahmet | tramvay çizimi, yeni güzergâh, arka planda cami yok |
| 9-1 Gece Yolu | dolmuş | Üsküdar → Şile | minibüs çiziminin gece hâli |
| 10-1 İMES | minibüs | Şile → Dudullu | minibüs çizimi, gece |
| 11-1 Tepe Yolu | taksi | Çamlıca → Kısıklı | aynen |
| 12-1 Çarşı | minibüs | Ümraniye → Kadıköy | aynen |
| 12-2 Yeni Plazalar | metro (M5) | Ümraniye → Çarşı | aynen |

Çıkanlar: Tünel füniküleri (Galata 6-1) ve M2 Haliç → Vezneciler (Haliç 7-2).

### Hikâye sahneleri (yazısız)

`main.js`'teki `STORY_AFTER` yeni sırayla:
`['ara1', 'ara4', 'ara8', 'ara2', 'atasehir', 'ara5', 'ara7', 'eyup', 'sile', 'sanayi', 'eve']`;
son dünyadan sonra `son`.

| Ne zaman | Sahne | Ne olur | İşlem |
|---|---|---|---|
| Başta | `giris` | Ümraniye'de şafak, atölye, laptop ışığı söner, kahraman şehre iner | dolmuşun üstündeki kedi ve silüetteki cami çıkar |
| Maslak'tan sonra | `ara1` | Cam cephe, boş masa, turnike açılmaz | aynen |
| Kapalıçarşı'dan sonra | `ara4` | Han'daki bir atölyede tek lambanın altında çalışan yaşlı usta, kahramana keski uzatır | mekân Han'a uyarlanır |
| Şişli'den sonra | `ara8` | Akşam; kahraman boşalmış ofiste, karşı plazanın pencerelerinde hâlâ çalışanlar, biri el sallar | çatıdan Şişli'ye taşınır, kedi çıkar |
| Üsküdar'dan sonra | `ara2` | Sahilde bank, laptop ve simit; yandaki kafenin camının ardında herkes tek başına; zarflar martılarla karşı kıyıya uçar; uzakta Kız Kulesi | Kadıköy'den Üsküdar'a taşınır; `ara3`'teki Kız Kulesi bakışı buraya katılır; vapur ve Kız Kulesi bayraksız |
| Ataşehir'den sonra | `atasehir` | Fidye yazılımı yenilir, kuleler yanar; gece bekçisi iki ince belli çayla gelir | aynen |
| Yerebatan'dan sonra | `ara5` | Karanlık suda yansıma; su durulunca atölyenin ateşi | aynen |
| Köprü'den sonra | `ara7` | Gece otobüsü; Üsküdar'da yollanan zarflardan biri geri döner (plazanın giriş kartı); kahraman laptopu kapatır | aynen |
| Eyüp'ten sonra | `eyup` | Tepede iki kişilik bank. Kahraman bir ucuna oturur, yanında ikinci bir ince belli çay bardağı. Aşağıda Haliç ve şehrin ışıkları. Rüzgâr, bir yaprak. Bir süre oturur, sonra kalkar ve yürür. Müzik yok. | **yeni, oyunun kalbi** |
| Şile'den sonra | `sile` | Gece fener; dönen ışık denizi tarar, kahraman kayalıkta oturmuş denize bakar | **yeni** |
| Sanayi'den sonra | `sanayi` | Şafak öncesi açık kalan tek çay ocağı, floresan ışık, camın ardında iki kişi; kepenkler iner, biri yarı açık kalır | **yeni** |
| Çamlıca'dan sonra | `eve` | Tepede, Ümraniye'nin ışıkları; aralarında atölyenin ateşi | aynen |
| En sonda | `son` | Şafakta iniş, atölye sabah ışığında: örs ile laptop yan yana, kendi tabelası, rafta 12 hatıra parçası, yanında boş bir sandalye | kedi çıkar, boş sandalye eklenir |

Silinen sahneler: `ara3` (Üsküdar'a katılır), `ara6` (Galata balkonu), `halic` (Balat'taki teyze).

### Hatıra parçaları

Her dünyanın 2. bölümünde, yoldan ayrılan yüksek bir köşede bir parça (sistem aynı). Hepsi kaybedilen kişiye aittir;
bu sadece son sahnede, rafta yan yana durunca hissedilir, hiçbir yerde açıklanmaz. `art.js`'teki `PIECES` yeni sırayla:

| Dünya | Parça | Anahtar | Çizim |
|---|---|---|---|
| 1 Maslak | eski bir kartvizit | `kartvizit` | yeni |
| 2 Kapalıçarşı | keski (ustanın sahnesiyle bağ) | `keski` | yeni |
| 3 Şişli | eski bir İstanbulkart | `istanbulkart` | yeni |
| 4 Üsküdar | ince belli çay bardağı | `cay` | yeni |
| 5 Ataşehir | anahtar | `anahtar` | mevcut |
| 6 Yerebatan | gözlük | `gozluk` | yeni |
| 7 Köprü | eski bir fotoğraf | `fotograf` | yeni |
| 8 Eyüp | kurumuş karanfil | `karanfil` | yeni |
| 9 Şile | deniz kabuğu | `kabuk` | yeni |
| 10 Sanayi | demirci çekici | `cekic` | mevcut |
| 11 Çamlıca | lale | `lale` | mevcut |
| 12 Ümraniye | eski bir radyo | `radyo` | yeni |

Çıkan parçalar: `cam`, `tuy`, `can`, `nazar`, `damla`, `kule`, `sepet`, `kopru`, `kedi`.

### Ay: o günün gerçek ayı

Şu an ay `scenes.js`'te (`drawSky`, `d.moon`) bir dairenin içinden kaydırılmış bir daire çıkarılarak çiziliyor ve
bayraktaki hilale benziyor; yeri de sabit (`SKY` ve `places.js`'teki `moon: [x, y, r]`). Bu yöntem tamamen bırakılır.

- [x] SunCalc (BSD 2 maddeli lisans, ~9 KB, `suncalc@1.9.0`) `src/vendor/suncalc.js` olarak eklenir; lisansı Lisans bölümüne yazılır.
- [x] Hesap çizimden ayrı bir modülde (`src/moon.js`) durur ve Node'da test edilir. İstanbul: 41.01° K, 28.98° D.
- [x] **Tarih:** oyuncunun cihazındaki bugünün tarihi, İstanbul saatiyle (Türkiye 2016'dan beri bütün yıl UTC+3).
- [x] **Sahne saati** her bölüm için tanımlanır (`tools/bolumler.py`'de bölüme bir saat alanı) ve o günün güneş
  saatlerinden hesaplanır (`SunCalc.getTimes(tarih, 41.01, 28.98)`):

  | Saat | Hesap |
  |---|---|
  | sabah | `sunrise` + 1,5 saat |
  | öğle | `solarNoon` |
  | öğleden sonra | `sunset` − 2,5 saat |
  | akşamüstü | `sunset` − 1 saat |
  | gün batımı | `sunset` |
  | gece | `sunset` + 3 saat |
  | gece yarısı | `nadir` |
  | gece yarısından sonra | `nadir` + 2 saat |
  | şafak öncesi | `nauticalDawn` |
  | şafak | `sunrise` |

- [x] **Evre:** `getMoonIllumination(an)` → `fraction`. Yeni ay günlerinde (`fraction` < 0,02) ay çizilmez.
- [x] **Eğiklik:** `angle − parallacticAngle` (`parallacticAngle` `getMoonPosition(an, 41.01, 28.98)`'den gelir).
  Aydınlık kenarın tepeden saat yönünün tersine açısıdır; çizim bu açıyla döndürülür. Akşamları ufka yakın
  yatık hilal böylece kendiliğinden oluşur.
- [x] **Görünürlük ve yükseklik:** `altitude` < 0 ise ay çizilmez. Yükseklik gökyüzündeki dikey yerini belirler
  (ufka yakınsa alçakta). Gündüz ve gün batımı gökyüzünde soluk çizilir. İç mekân ve yer altı bölümlerinde
  gökyüzü görünmüyorsa çizilmez.
- [x] **Çizim:** aydınlık kısım yarım daire ve elipsle (terminatör) çizilir; karanlık kısım arka plandan çok hafif
  seçilir (ince hilalde dünya ışığı), kesilip atılmış gibi durmaz. Ayın çevresinde (yarıçapının ~4 katı) yıldız olmaz.
- [x] **Test:** `tests/moon.test.js` yazılır ve `.github/workflows/pages.yml`'deki test adımına eklenir.
  Kontrol değerleri (aydınlık oran ±0,5 puan, açılar ±1°):

  | An (İstanbul saati) | Beklenen |
  |---|---|
  | 29 Ekim 2026 07:00 | küçülen şişkin ay, %88,8; yükseklik 44,3° (görünür) |
  | 29 Ekim 2026 18:00 | yükseklik −14,8° → çizilmez |
  | 29 Ekim 2026 22:00 | %83,8; yükseklik 17,2°; eğiklik 135,0° |
  | 9 Kasım 2026 07:00 | yeni ay, %0,2 → çizilmez |
  | 11 Kasım 2026 18:31 | ince hilal, %5,8; yükseklik 3,4°; eğiklik −114,2° (ufka çok yakın, yatık) |
  | 24 Kasım 2026 19:00 | dolunay, %99,8 |

  29 Ekim 2026'da ay sabah 11:25'te batar, akşam 20:08'de doğar.

### Müzik ve ses

- [x] `audio.js`'te `WORLD_SONG` yeni sırayla:
  `['maslak', 'carsi', 'sisli', 'uskudar', 'atasehir', 'sarnic', 'kopru', 'eyup', 'sile', 'sanayi', 'camlica', 'umraniye']`.
  `WORLD_AMB` ve bölüm bazlı ses listesi de yeni dünyalara ve bölümlere göre düzenlenir.
- [x] Kapalıçarşı (`carsi`, akorları şu an D–E♭, yani Hicaz) ve Yerebatan (`sarnic`) şarkılarındaki Hicaz değişir.
  Makamların kendisi sorun değil; "burası Doğu" işareti olarak kullanılmaları klişe. Bu dünyalar diğerleriyle
  aynı müzik dilinde kalır, farkı mekânın gerçek sesleri verir.
- [x] Şehir sesleri:
  - Kapalıçarşı: kepenkler, esnaf konuşmaları, pazarlık, çaycının bardakları, uzaktan tramvay.
  - Şişli: metrobüs, kalabalık, trafik.
  - Üsküdar: vapur düdüğü, martılar, sahil kalabalığı, çay bardakları.
  - Eyüp: 8-1 ve 8-2'de sadeleşmiş müzik; 8-3'te müzik yok, sadece rüzgâr ve uzak şehir sesi.
  - Şile: rüzgâr, dalga, uzaktan geçen tek tük araba; fenerde fırtına.
  - Sanayi: torna, kaynak, kepenk, uzak otoyol uğultusu.

### Kod: dünya sırasına bağlı yerler

- [x] `tools/bolumler.py`: `WORLDS` yeni sırayla; `name`, `sub`, `sections`, `boss`, `boss_name`, `enemies`, `seed`,
  `dpos` (zorluk sıraya göre artar, Eyüp sakin), binişler, bölüm saatleri, Eyüp 8-3 kuralları. Düşman harfleri:
  Şişli `es`, Üsküdar `ems`, Eyüp 8-1 ve 8-2 sadece `e` ve az, Şile `emv`, Sanayi `esvo`; diğer dünyalar kendi
  harflerini korur. `python3 tools/bolumler.py` ile `src/levels.js` yeniden üretilir.
- [x] `src/core.js`: Eyüp 8-3 için patronsuz, düşmansız, süresiz ve DEPLOY antenisiz bölüm sonu (tepedeki banka varınca biter).
- [x] `src/scenes.js`: dünyaların ilk bölüm çizimleri ve `SKY` yeni sıraya; başlık ekranı; ay çizimi; `cat`,
  `flag` ve gereksiz cami çağrıları.
- [x] `src/places.js`: `PLACES` (yer = dünya × 3 + bölüm) yeni sıraya; yeni bölümler mevcut çizimlerin farklı ışıklı hâlleriyle.
- [ ] `src/art.js`: her mekânın zemin ve karo teması yeni sıraya; `PIECES` ve yeni parça çizimleri; Glitch hiçbir bölümde yok.
- [x] `src/rides.js`: Marmaray (metro çizimi, yeni hat adı ve rengi), gece dolmuşu, T1 Sirkeci → Sultanahmet;
  tramvay arka planındaki camiler çıkar; füniküler kullanılmaz.
- [ ] `src/story.js`: Hikâye sahneleri tablosundaki değişiklikler.
- [x] `src/audio.js`: Müzik ve ses bölümündeki maddeler.
- [ ] `src/main.js`: `STORY_AFTER`; `ROUTE` (İstanbul haritasında yeni dünyaların yerleri; Şile haritanın doğu
  kenarının dışında kalıyor: harita doğuya genişletilir ya da Şile kenarda yön okuyla gösterilir);
  Eyüp 8-3'te HUD'da süre gizlenir.
- [x] Kayıt: `ba-kayit-surum` 4'e çıkar. Dünya sırası ve parçalar değiştiği için `ba-ilerleme` ve `ba-parcalar`
  sıfırlanır, `ba-rekor` kalır.
- [ ] `tools/onizle.html`: yeni çizimler eklenir, silinenler çıkar.
- [x] Testler: `core.test.js` 11 patron (Glitch yok) ve Eyüp 8-3 kuralları; `levels.test.js` 36 bölümün hepsi
  geçilebilir (8-3 dahil); yeni `moon.test.js`. Üçü de GitHub Actions'ta çalışır.
- [ ] README: giriş paragrafları (kediler, cami listesi), Hikâye, Dünyalar tablosu, binişler tablosu, Bölümlerde gizli
  şeyler (Galata'nın merdivenleri gibi silinen yerler), Geliştirme (Hicaz satırı, dosya açıklamaları), Sürümler'e v2.0;
  bu plan bölümü kaldırılır.
- [ ] Repo dışı: oyun salonu sayfasındaki Bug Avcısı kartı (şu an "9 dünya · 27 bölüm · 9 patron" yazıyor) ve
  haritalar sayfası yeni dünyalara göre güncellenir.

### Uygulama sırası

1. Kesin kurallar: kedi, bayrak, gereksiz camiler (küçük ve bağımsız).
2. Ay modülü ve testi.
3. Dünya sırası, bölüm üretimi, patronlar ve Eyüp kuralları; testler geçer.
4. Yeni dünyaların mevcut çizimlerden kurulması (Şişli, Üsküdar, Eyüp, Şile, Sanayi) ve ışık değişiklikleri (Köprü, Yeni Plazalar).
5. Kapalıçarşı'nın yeniden ele alınması ve müzik.
6. Binişler.
7. Hikâye sahneleri.
8. Hatıra parçaları.
9. Harita, kayıt, önizleme, README ve oyun salonu kartı.

Her adım ayrı bir commit'tir. Her commit'te `node tests/core.test.js` ve `node tests/levels.test.js` (ay modülünden
sonra `node tests/moon.test.js` de) geçer; oyun tarayıcıda açılıp bakılır.

## Lisans

Kod MIT lisanslıdır (`LICENSE`). Fredoka yazı tipi SIL Open Font License ile gelir
(`src/fonts/OFL-fredoka.txt`). PeerJS ve qrcode-generator MIT lisanslıdır. Ay hesabını yapan SunCalc 1.9.0
(Vladimir Agafonkin) BSD 2 maddeli lisansla gelir (`src/vendor/LICENSE-suncalc.txt`).
