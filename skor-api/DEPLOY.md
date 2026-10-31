# skor-api kurulumu: Raspberry Pi (evnas) + Cloudflare Tunnel

Bu belge skor sunucusunu evdeki Raspberry Pi 3'e (Raspberry Pi OS Lite 64-bit, Debian 13, ad `evnas`, yerel IP
`192.168.1.2`, MariaDB 11.8 kurulu) kurmayı ve oyunlara bağlamayı adım adım anlatır.

**Sıra:** 1) kodu Pi'ye al → 2) kurulum betiği → 3) yerelde dene → 4) Cloudflare Tunnel → 5) oyunlara adresi yaz
→ 6) bakım.

---

## 0. Neden doğrudan `http://192.168.1.2` olmuyor?

- Oyunlar GitHub Pages'te **HTTPS** ile açılıyor. Tarayıcı, HTTPS bir sayfadan **HTTP** bir adrese istek
  atmayı engeller (*mixed content*). Kullanıcı hiçbir uyarı görmez, istek hiç gitmez.
- `192.168.1.2` yalnız ev ağında geçerli. Başka bir evden oynayan biri bu adrese hiç ulaşamaz.
- Çözüm: **Cloudflare Tunnel** (ücretsiz). Pi, Cloudflare'e kendisi dışarıya doğru bağlanır. Cloudflare de
  `https://skor.…` gibi bir adresi bu bağlantıdan Pi'ye iletir.
  - Modemde **port yönlendirme yapma.** Gerek yok, bu kurulumda yanlış da olur.
  - Ev IP'n görünmez. Sertifikayı (HTTPS) Cloudflare verir.

---

## 1. Kodu Pi'ye al

Pi'ye SSH ile bağlan (`ssh kullanici@192.168.1.2`) ve:

```bash
sudo apt-get update && sudo apt-get install -y git curl openssl
git clone https://github.com/hamiKumbasae/bug-avcisi.git
cd bug-avcisi
# PR henüz birleşmediyse dalı al:
git switch feature/leaderboard
```

## 2. Kurulum betiği

```bash
sudo bash skor-api/deploy/kurulum.sh
```

Betik şunları yapar. Yeniden çalıştırmak güvenlidir: şifreler korunur, yalnız kod ve bağımlılıklar güncellenir.

| Adım | Ne olur |
|---|---|
| 1 | `python3-venv` kurulur. `skor` adlı, giriş yapamayan bir sistem kullanıcısı açılır. |
| 2 | Kod `/opt/skor-api`'ye kopyalanır. `/opt/skor-api/.venv` sanal ortamına FastAPI, uvicorn ve PyMySQL kurulur. Pi 3'te birkaç dakika sürebilir. |
| 3 | MariaDB'de `oyun` veritabanı ve **yalnız ona** yetkili (SELECT, INSERT, DELETE) `oyun` kullanıcısı açılır, `schema.sql` uygulanır. `secim` veritabanına dokunulmaz. |
| 4 | `/etc/skor-api.env` yazılır: rastgele veritabanı şifresi ve HMAC gizli anahtarı. Dosya izni `640`, sahibi `root:skor`. |
| 5 | `skor-api` systemd servisi kurulur, açılışta başlar. Yalnız `127.0.0.1:8077` dinler, bellek sınırı 200 MB'tır. Betik sonunda `/health` denetlenir. |

Elle yapmak istersen betiğin içi yorumlarıyla okunabilir: `skor-api/deploy/kurulum.sh`.

## 3. Pi'de dene

```bash
curl http://127.0.0.1:8077/health
# {"status":"ok","db":true,"version":"1.0.0"}

curl http://127.0.0.1:8077/v1/games
systemctl status skor-api --no-pager
```

Bellek kullanımı yaklaşık 50–60 MB'tır (`systemctl status` "Memory" satırında görünür).

---

## 4. Cloudflare Tunnel

### 4.1 cloudflared'i kur (iki yol için de gerekli)

```bash
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main" \
  | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt-get update && sudo apt-get install -y cloudflared
cloudflared --version
```

(Bu adres değişirse: https://developers.cloudflare.com/tunnel/ sayfasındaki "Install cloudflared" bölümü. İstersen
`cloudflared-linux-arm64.deb` dosyasını GitHub'daki cloudflare/cloudflared sürümlerinden indirip
`sudo dpkg -i` ile de kurabilirsin.)

### 4.2 Yol A: hızlı tünel (yalnız deneme için, alan adı gerekmez)

```bash
cloudflared tunnel --url http://127.0.0.1:8077
```

Ekranda `https://rastgele-kelimeler.trycloudflare.com` gibi bir adres çıkar. Telefondan (Wi-Fi kapalı, mobil
veriyle) `https://…trycloudflare.com/health` adresini açarak dene.

- Komut çalıştığı sürece açıktır. **Her başlatışta adres değişir**, Cloudflare çalışma garantisi de vermez.
  Yani yalnız deneme içindir, oyunlara kalıcı olarak yazılmaz.
- Oyunla denemek için oyunu kendi bilgisayarında aç. Oyunun `src/skor.js` dosyasında
  `const SKOR_API = 'https://…trycloudflare.com';` yaz (**commit'leme**), sonra:
  `python3 -m http.server` → http://localhost:8000. localhost'a sunucuda zaten izin verilmiş durumda.

### 4.3 Yol B: kalıcı (adlandırılmış) tünel, örn. `skor.celikdovme.net`

**Önkoşul:** alan adının DNS'i Cloudflare'de olmalı (nameserver'lar `…ns.cloudflare.com`). Bakmak için:

```bash
dig NS celikdovme.net +short        # ya da: dig NS volkankumbasar.com +short
```

- Çıktı `….ns.cloudflare.com` ise hazırsın.
- Değilse iki seçenek var:
  1. Alan adını Cloudflare'e ücretsiz ekle (dash.cloudflare.com → *Add a domain*). Kayıt firmasında
     nameserver'ları Cloudflare'in verdikleriyle değiştir.
     **Dikkat:** bu işlem alan adının bütün DNS'ini Cloudflare'e taşır. Cloudflare mevcut kayıtları tarar.
     Sitenin A/CNAME kayıtlarının ve e-posta (MX, SPF/TXT) kayıtlarının eksiksiz geldiğini kontrol etmeden
     nameserver'ı değiştirme. Mağaza sitesi (volkankumbasar.com) yerine `celikdovme.net` daha az risklidir.
  2. Taşımak istemezsen: Cloudflare'de olan başka bir (ucuz) alan adı kullan, ya da yalnız hızlı tünelle dene.

Önkoşul tamamsa iki kolay yöntemden birini seç.

#### B1. Panelden (en kolayı)

1. https://one.dash.cloudflare.com → **Networks → Tunnels → Create a tunnel** → *Cloudflared* → ad: `evnas-skor`.
2. "Install and run a connector" ekranında **Debian**, **arm64** seç. Gösterilen komutun yalnız son satırını
   Pi'de çalıştır (cloudflared zaten kurulu):
   ```bash
   sudo cloudflared service install <PANELIN-VERDİĞİ-UZUN-TOKEN>
   ```
   Panelde bağlayıcı "Connected" olur.
3. **Public Hostname** sekmesi → *Add a public hostname*:
   - Subdomain: `skor`, Domain: `celikdovme.net`
   - Service: Type `HTTP`, URL `127.0.0.1:8077`
4. Kaydet. Birkaç saniye sonra dene: `curl https://skor.celikdovme.net/health`

#### B2. Komut satırından

```bash
cloudflared tunnel login                      # bir bağlantı verir; tarayıcıda aç, celikdovme.net'i seç
cloudflared tunnel create skor                # bir TÜNEL-ID ve ~/.cloudflared/<TÜNEL-ID>.json yazar
cloudflared tunnel route dns skor skor.celikdovme.net

sudo mkdir -p /etc/cloudflared
sudo cp ~/.cloudflared/<TÜNEL-ID>.json /etc/cloudflared/
sudo cp skor-api/deploy/cloudflared-config.yml.example /etc/cloudflared/config.yml
sudo nano /etc/cloudflared/config.yml         # <TÜNEL-ID> yerlerine kendi kimliğini yaz
sudo cloudflared service install              # /etc/cloudflared/config.yml ile servis olarak kurar
sudo systemctl status cloudflared --no-pager
curl https://skor.celikdovme.net/health
```

Tünel yalnız `skor.celikdovme.net → 127.0.0.1:8077` yolunu açar. Pi'deki başka hiçbir şey (MariaDB, SSH,
seçim sitesi) dışarı açılmaz.

> İstemcinin gerçek IP'si Cloudflare'in eklediği `CF-Connecting-IP` başlığından okunur (hız sınırı için). Bu başlığa
> yalnız bağlantı `127.0.0.1`'den, yani cloudflared'den geldiğinde güvenilir.

---

## 5. Oyunlara adresi yaz

İki depoda da (`bug-avcisi`, `bogaz-yolu`) `src/skor.js` dosyasının en başındaki AYAR bölümünde:

```js
const SKOR_API = 'https://skor.celikdovme.net';
```

1. Önce yerelde dene: `python3 -m http.server` → http://localhost:8000 → bir oyun oyna.
   - **Bug Avcısı:** canlar sonsuz olduğu için oyun "bitmez". Skor tablosu, koşu bitince açılır: duraklat →
     *ANA MENÜ* ya da 36. bölümün sonu.
   - **Boğaz Yolu:** süre bitince ya da finişte, yerel REKORLAR ekranından sonra açılır.
   - Ekranın altında **Skor tablosu** düğmesi de çıkar.
2. Değişikliği commit'le ve PR'ı birleştir. GitHub Actions, Pages'i yeniden yayınlar.

Adres boş (`''`) kaldığı sürece oyunlar eskisi gibi çalışır, düğme görünmez, hiçbir ağ isteği yapılmaz.

---

## 6. Bakım

```bash
journalctl -u skor-api -f                    # canlı günlük
sudo systemctl restart skor-api              # yeniden başlat
sudo systemctl status cloudflared skor-api   # iki servisin durumu

# güncelleme: yeni kodu çek, betiği yeniden çalıştır (şifreler korunur)
cd ~/bug-avcisi && git pull && sudo bash skor-api/deploy/kurulum.sh

# yedek (örn. haftalık cron)
sudo mariadb-dump oyun | gzip > ~/oyun-$(date +%F).sql.gz

# skorlara bak, hileli bir skoru sil
sudo mariadb oyun -e "SELECT id, game, mode, name, score, duration_s, meta, created_at FROM scores ORDER BY score DESC LIMIT 20"
sudo mariadb oyun -e "DELETE FROM scores WHERE id = 123"
sudo mariadb oyun -e "DELETE FROM scores WHERE game = 'bug-avcisi' AND name_key = 'hileci'"
```

İzin verilen siteyi değiştirmek için `/etc/skor-api.env` → `SKOR_ALLOWED_ORIGINS`, sonra
`sudo systemctl restart skor-api`.

## 7. Sorun giderme

| Belirti | Neden / çözüm |
|---|---|
| Oyunda "Skor sunucusuna ulaşılamadı" | Tünel ya da servis kapalı: `systemctl status cloudflared skor-api`, `curl https://skor…/health`. |
| Tarayıcı konsolunda *CORS* hatası | Oyunu açtığın adres `SKOR_ALLOWED_ORIGINS` içinde değil. GitHub Pages için `https://hamikumbasae.github.io` (sonda `/` yok). |
| Tarayıcı konsolunda *Mixed Content* | `SKOR_API` `http://` ile başlıyor. `https://` tünel adresini yaz. |
| `/health` → `"db": false` (503) | MariaDB kapalı ya da şifre yanlış: `sudo systemctl status mariadb`, `sudo cat /etc/skor-api.env`. |
| 429 "Çok sık gönderdin" | IP başına sınır: dakikada 6 gönderim, günde 150. Normal oyuncu bu sınıra ulaşmaz. |
| Skor "doğrulanamadı" | Sunucu skoru olanaksız buldu (bkz. README, *Anti-cheat design*). Gerçek bir oyunsa `journalctl` günlüğüne ve `app/games.py` sınırlarına bak. |
| `kurulum.sh` pip adımında takılıyor | Pi 3'te ilk kurulum yavaştır. İnternet bağlantısını ve `df -h` ile boş alanı kontrol et. |
