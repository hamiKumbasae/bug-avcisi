#!/usr/bin/env bash
# skor-api kurulumu (Raspberry Pi OS Lite 64-bit / Debian 13, MariaDB kurulu).
# Kullanım (depo kökünden):   sudo bash skor-api/deploy/kurulum.sh
#
# Yaptıkları (yeniden çalıştırmak güvenlidir; şifreler ve gizli anahtar korunur, yalnız kod ve bağımlılıklar güncellenir):
#   1. python3-venv paketini kurar, 'skor' adlı bir sistem kullanıcısı açar
#   2. kodu /opt/skor-api'ye kopyalar, sanal ortam (.venv) kurar, bağımlılıkları yükler
#   3. MariaDB'de 'oyun' veritabanını ve yalnız ona yetkili 'oyun' kullanıcısını açar, tabloyu kurar
#      (başka veritabanlarına, ör. 'secim', dokunmaz)
#   4. /etc/skor-api.env dosyasını yazar (rastgele şifre ve gizli anahtar)
#   5. systemd servisini (skor-api) kurar, başlatır ve sağlık denetimi yapar
set -euo pipefail

HEDEF=/opt/skor-api
ENVF=/etc/skor-api.env
SERVIS=/etc/systemd/system/skor-api.service
KAYNAK="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${SKOR_PORT:-8077}"

renk() { printf '\033[1;36m==> %s\033[0m\n' "$*"; }
hata() { printf '\033[1;31mHATA: %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || hata "root olarak çalıştır: sudo bash $0"
command -v mariadb >/dev/null || hata "mariadb komutu yok; önce MariaDB'yi kur (sudo apt install mariadb-server)"
systemctl is-active --quiet mariadb || systemctl start mariadb

renk "1/5 Paketler ve 'skor' kullanıcısı"
if ! python3 -c 'import venv, ensurepip' 2>/dev/null; then
  apt-get update -qq && apt-get install -y -qq python3-venv
fi
id skor >/dev/null 2>&1 || useradd --system --home-dir "$HEDEF" --shell /usr/sbin/nologin skor

renk "2/5 Kod $HEDEF dizinine kopyalanıyor, sanal ortam kuruluyor (Pi 3'te birkaç dakika sürebilir)"
install -d -o skor -g skor -m 755 "$HEDEF"
rm -rf "$HEDEF/app"
cp -r "$KAYNAK/app" "$KAYNAK/schema.sql" "$KAYNAK/requirements.txt" "$HEDEF/"
find "$HEDEF/app" -name '__pycache__' -prune -exec rm -rf {} +
[ -x "$HEDEF/.venv/bin/python" ] || python3 -m venv "$HEDEF/.venv"
"$HEDEF/.venv/bin/pip" install --quiet --disable-pip-version-check --upgrade pip
"$HEDEF/.venv/bin/pip" install --quiet --disable-pip-version-check -r "$HEDEF/requirements.txt"
chown -R skor:skor "$HEDEF"

renk "3/5 Veritabanı 'oyun' ve kullanıcı 'oyun'"
if [ -f "$ENVF" ]; then
  # shellcheck disable=SC1090
  DB_SIFRE="$(. "$ENVF"; printf '%s' "$SKOR_DB_PASSWORD")"
  GIZLI="$(. "$ENVF"; printf '%s' "$SKOR_SECRET")"
fi
DB_SIFRE="${DB_SIFRE:-$(openssl rand -hex 24)}"
GIZLI="${GIZLI:-$(openssl rand -hex 32)}"
mariadb <<SQL
CREATE DATABASE IF NOT EXISTS oyun CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'oyun'@'localhost' IDENTIFIED BY '${DB_SIFRE}';
CREATE USER IF NOT EXISTS 'oyun'@'127.0.0.1' IDENTIFIED BY '${DB_SIFRE}';
ALTER USER 'oyun'@'localhost' IDENTIFIED BY '${DB_SIFRE}';
ALTER USER 'oyun'@'127.0.0.1' IDENTIFIED BY '${DB_SIFRE}';
GRANT SELECT, INSERT, DELETE ON oyun.* TO 'oyun'@'localhost';
GRANT SELECT, INSERT, DELETE ON oyun.* TO 'oyun'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL
mariadb oyun < "$HEDEF/schema.sql"

renk "4/5 Ayar dosyası $ENVF"
umask 027
cat > "$ENVF" <<ENV
# skor-api ayarları. Değiştirince: sudo systemctl restart skor-api
SKOR_SECRET=${GIZLI}
SKOR_DB_HOST=127.0.0.1
SKOR_DB_PORT=3306
SKOR_DB_USER=oyun
SKOR_DB_PASSWORD=${DB_SIFRE}
SKOR_DB_NAME=oyun
SKOR_DB_POOL=4
# İzin verilen kaynaklar (virgülle). localhost her portta ayrıca açıktır (SKOR_ALLOW_LOCALHOST=0 ile kapanır).
SKOR_ALLOWED_ORIGINS=${SKOR_ALLOWED_ORIGINS:-https://hamikumbasae.github.io}
SKOR_ALLOW_LOCALHOST=1
# cloudflared aynı makinede: istemcinin gerçek IP'si CF-Connecting-IP başlığından okunur
SKOR_TRUST_PROXY=1
SKOR_RUN_MAX_AGE=43200
ENV
chown root:skor "$ENVF"; chmod 640 "$ENVF"

renk "5/5 systemd servisi"
cat > "$SERVIS" <<UNIT
[Unit]
Description=skor-api (oyun skor tablosu)
After=network-online.target mariadb.service
Wants=network-online.target mariadb.service

[Service]
User=skor
Group=skor
WorkingDirectory=${HEDEF}
EnvironmentFile=${ENVF}
# Tek işçi: Pi 3 için yeterli ve hız sınırlayıcı bellekte tutarlı kalır. Yalnız 127.0.0.1: dışarıya cloudflared açar.
ExecStart=${HEDEF}/.venv/bin/uvicorn --factory app.main:create_app --host 127.0.0.1 --port ${PORT} --workers 1 --no-access-log --no-server-header
Restart=on-failure
RestartSec=3
MemoryMax=200M
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
PrivateDevices=true
ProtectKernelTunables=true
ProtectControlGroups=true
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --quiet skor-api
systemctl restart skor-api

for _ in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${PORT}/health" >/dev/null 2>&1; then break; fi
  sleep 1
done
if curl -fsS "http://127.0.0.1:${PORT}/health"; then
  echo
  renk "Tamam: skor-api http://127.0.0.1:${PORT} adresinde çalışıyor. Sıradaki adım: Cloudflare Tunnel (DEPLOY.md)"
else
  journalctl -u skor-api -n 30 --no-pager
  hata "servis yanıt vermiyor (yukarıdaki günlüğe bak)"
fi
