#!/usr/bin/env python3
"""Bug Avcısı: İstanbul — 9 dünya × 3 bölüm haritalarını üretir ve src/levels.js'e yazar.

    python3 tools/bolumler.py

Bölümler el yapımı parçalardan (düzlük, blok sırası, merdiven, boşluk,
köprü, hareketli platform, sütunlar, diken, tünel...) dünyaya ve zorluğa
göre seçilerek dizilir; tohumlu olduğu için her seferinde aynı harita çıkar.
Her dünyanın 3. bölümünün sonunda patron arenası vardır.

Harita işaretleri (14 satır):
  .  boş            #  zemin            =  sağlam blok      -  üstüne çıkılabilen ince platform
  K  komut bloğu (simit)   U  komut bloğu (güç)   S  komut bloğu (kahve)   L  komut bloğu (disket = can)
  C  çatlak blok (kırılır)   ^  kısa devre (diken)   b  simit
  M  yatay hareketli platform   N  dikey hareketli platform   o  döngü (dönen kıvılcım)
  e  bug   s  spam   v  virüs   m  martı
  P  başlangıç   G  DEPLOY noktası   A  arena girişi   B  patron
  h  hatıra parçası (her dünyanın 2. bölümünde bir tane, iki ince platformla çıkılan köşede)
"""
import json
import random
from pathlib import Path

H = 14
WORLDS = [
    {'name': 'Maslak', 'sub': 'Plazalar', 'enemies': 'e', 'boss': 'kralbug', 'boss_name': 'Kral Bug',
     'parts': ['flat', 'blocks', 'blocks', 'gap', 'step', 'pillars', 'stairs', 'group'], 'sections': ['Açık Ofis', 'Toplantı Katı', 'Sunucu Katı']},
    {'name': 'Kadıköy', 'sub': 'Çarşı', 'enemies': 'es', 'boss': 'spam', 'boss_name': 'Spam Kraliçesi',
     'parts': ['flat', 'blocks', 'blocks', 'gap', 'step', 'stairs', 'pillars', 'bridge', 'group', 'blockgap'], 'sections': ['Rıhtım Caddesi', 'Balık Pazarı', 'Moda Yokuşu']},
    {'name': 'Vapur', 'sub': 'Boğaz', 'enemies': 'ems', 'boss': 'marti', 'boss_name': 'Dev Martı',
     'parts': ['flat', 'blocks', 'gap', 'gap', 'moving', 'bridge', 'step', 'blockgap'], 'sections': ['İskele', 'Güverte', 'Kaptan Köşkü']},
    {'name': 'Kapalıçarşı', 'sub': 'Kubbeler', 'enemies': 'esv', 'boss': 'truva', 'boss_name': 'Truva Atı',
     'parts': ['flat', 'blocks', 'blocks', 'tunnel', 'stairs', 'pillars', 'gap', 'spikes', 'group', 'blockgap'], 'sections': ['Kuyumcular', 'Halıcılar', 'Bedesten']},
    {'name': 'Yerebatan', 'sub': 'Sarnıç', 'enemies': 'evo', 'boss': 'sizinti', 'boss_name': 'Bellek Sızıntısı',
     'parts': ['tunnel', 'tunnel', 'gap', 'pillars', 'moving', 'spikes', 'loop', 'blocks', 'group'], 'sections': ['Sütunlar', 'Medusa', 'Karanlık Su']},
    {'name': 'Galata', 'sub': 'Yokuşlar', 'enemies': 'emv', 'boss': 'dongu', 'boss_name': 'Sonsuz Döngü',
     'parts': ['step', 'step', 'stairs', 'blocks', 'gap', 'pillars', 'spikes', 'loop', 'group', 'blockgap'], 'sections': ['Kamondo Merdivenleri', 'Kuledibi', 'Çatı Arası']},
    {'name': 'Köprü', 'sub': 'Boğaz Köprüsü', 'enemies': 'msv', 'boss': 'ddos', 'boss_name': 'DDoS Bulutu',
     'parts': ['bridge', 'bridge', 'moving', 'moving', 'gap', 'pillars', 'vertical', 'blockgap'], 'sections': ['Ayak', 'Halatlar', 'Tepe']},
    {'name': 'Çatılar', 'sub': 'Gece', 'enemies': 'evom', 'boss': 'glitch', 'boss_name': 'Glitch',
     'parts': ['pillars', 'pillars', 'gap', 'bridge', 'spikes', 'loop', 'step', 'vertical', 'blocks', 'group', 'blockgap'], 'sections': ['Bacalar', 'Antenler', 'Saat Kulesi']},
    {'name': 'Çamlıca', 'sub': 'Kule', 'enemies': 'esvmo', 'boss': 'maviekran', 'boss_name': 'Mavi Ekran',
     'parts': ['pillars', 'moving', 'vertical', 'spikes', 'loop', 'gap', 'bridge', 'tunnel', 'blocks', 'stairs', 'group'], 'sections': ['Tepe Yolu', 'Asansör', 'Yayın Odası']},
]


class Lv:
    def __init__(self, r, d, w):
        self.r, self.d, self.w = r, d, w
        self.cols = []
        self.gh = 2          # zemin kalınlığı (satır)
        self.ceil = 0        # tavan kalınlığı (tünel)

    @property
    def x(self):
        return len(self.cols)

    def top(self, gh=None):
        return H - (gh if gh is not None else self.gh)

    def col(self, ground=True):
        c = ['.'] * H
        if ground:
            for y in range(self.top(), H):
                c[y] = '#'
        for y in range(self.ceil):
            c[y] = '='
        self.cols.append(c)
        return self.x - 1

    def set(self, x, y, ch):
        if 0 <= y < H and 0 <= x < self.x:
            self.cols[x][y] = ch

    def get(self, x, y):
        return self.cols[x][y]

    def enemy(self, x, kinds=None, air=False):
        kinds = kinds or WORLDS[self.w]['enemies']
        k = self.r.choice(kinds)
        if k == 'o':
            k = 'e'
        if k in 'sm':  # uçanlar havada
            self.set(x, self.top() - 3 - self.r.randint(0, 2), k)
        else:
            self.set(x, self.top() - 1, k)

    # ---------- parçalar ----------
    def flat(self, n, enemies=None):
        xs = [self.col() for _ in range(n)]
        if enemies is None:
            enemies = n >= 6 and self.r.random() < 0.35 + 0.45 * self.d
        if enemies:
            for _ in range(1 + (self.r.random() < self.d)):
                self.enemy(self.r.choice(xs[2:]))
        return xs

    def hatira(self):
        # hikâyenin hatıra parçası: yoldan ayrılan, iki ince platformla çıkılan yüksek bir köşe
        x0 = self.x
        self.flat(10, enemies=False)
        t = self.top()
        for i in (2, 3, 4):
            self.set(x0 + i, t - 3, '-')
        for i in (5, 6, 7):
            self.set(x0 + i, t - 6, '-')
        self.set(x0 + 6, t - 7, 'h')

    def blocks(self):
        n = self.r.randint(7, 11)
        xs = self.flat(n, enemies=False)
        y = self.top() - 4
        pats = ['CKCUC', 'KKK', 'CKC', 'CCKCC', 'K.K.K', 'CUC', 'KCK', 'CCCC']
        pat = self.r.choice(pats)
        if self.r.random() < 0.08:
            pat = pat.replace('K', 'S', 1)
        x0 = xs[0] + self.r.randint(1, max(1, n - len(pat) - 1))
        for i, ch in enumerate(pat):
            if ch != '.':
                self.set(x0 + i, y, ch)
        if self.r.random() < 0.5:  # üstünde simitler ya da ikinci kat
            if self.r.random() < 0.5:
                for i in range(len(pat)):
                    self.set(x0 + i, y - 2, 'b')
            else:
                for i in range(1, len(pat) - 1):
                    self.set(x0 + i, y - 4, 'C' if self.r.random() < 0.7 else 'K')
        if self.r.random() < 0.4 + 0.4 * self.d:
            self.enemy(xs[-2])

    def gap(self):
        n = self.r.choice([2, 2, 3] if self.d < 0.4 else [2, 3, 3, 4])
        self.flat(2, enemies=False)
        for _ in range(n):
            self.col(ground=False)
        if n >= 4:  # ortada küçük bir taş
            self.set(self.x - 2, self.top() - 1, '-')
        self.flat(3, enemies=False)
        if self.r.random() < 0.5:
            for i in range(n):
                self.set(self.x - 3 - n + i, self.top() - 3, 'b')

    def step(self):
        delta = self.r.choice([-2, -1, 1, 2] if self.d < 0.5 else [-3, -2, 2, 3])
        self.gh = max(1, min(6, self.gh + delta))
        self.flat(self.r.randint(4, 7))

    def stairs(self):
        n = self.r.randint(3, 5 if self.d > 0.3 else 4)
        base = self.top()
        for i in range(1, n + 1):
            x = self.col()
            for k in range(i):
                self.set(x, base - 1 - k, '=')
        down = self.r.random() < 0.5
        if down:
            for i in range(n, 0, -1):
                x = self.col()
                for k in range(i):
                    self.set(x, base - 1 - k, '=')
        else:  # merdivenden sonra boşluk
            gw = 2 if n >= 4 else 3
            for _ in range(gw):
                self.col(ground=False)
            # karşı kıyı aynı yükseklikte
            for _ in range(3):
                x = self.col()
                for k in range(n):
                    self.set(x, base - 1 - k, '=')
            for i in range(n - 1, 0, -1):
                x = self.col()
                for k in range(i):
                    self.set(x, base - 1 - k, '=')
        self.flat(3, enemies=False)

    def pillars(self):
        k = self.r.randint(2, 4)
        self.flat(2, enemies=False)
        prev = 0
        for i in range(k):
            h = max(1, min(4, prev + self.r.choice([-1, 1, 2]) if prev else self.r.randint(1, 3)))
            w = self.r.choice([2, 3])
            for _ in range(w):
                x = self.col(ground=self.d < 0.45)
                if self.d >= 0.45:  # yüksek dünyalarda sütunlar boşluğun içinden yükselir
                    for y in range(self.top() - h, H):
                        self.set(x, y, '=')
                else:
                    for y in range(self.top() - h, self.top()):
                        self.set(x, y, '=')
            if i == 1 and self.r.random() < 0.5:
                self.set(self.x - 1, self.top() - h - 1, 'b')
            gw = self.r.choice([2, 3]) if self.d >= 0.45 else 2
            for _ in range(gw):
                x = self.col(ground=self.d < 0.45)
            if self.d < 0.45 and self.r.random() < 0.6:
                self.enemy(self.x - 1, kinds='e')
            prev = h
        self.flat(3, enemies=False)

    def bridge(self):
        self.flat(2, enemies=False)
        n = self.r.randint(2, 4)
        y = self.top() - 1
        for i in range(n):
            for _ in range(self.r.choice([2, 2, 3])):
                self.col(ground=False)
            y = max(self.top() - 4, min(self.top(), y + self.r.choice([-1, 0, 1])))
            for j in range(3):
                x = self.col(ground=False)
                self.set(x, y, '-')
            if self.r.random() < 0.4:
                self.set(self.x - 2, y - 2, 'b')
        for _ in range(2):
            self.col(ground=False)
        self.flat(3, enemies=False)

    def moving(self):
        self.flat(2, enemies=False)
        n = self.r.randint(6, 8)
        x0 = self.x
        for _ in range(n):
            self.col(ground=False)
        self.set(x0, self.top() - 1, 'M')
        self.flat(3, enemies=False)

    def vertical(self):
        # yüksek bir çıkıntıya dikey asansörle çık
        self.flat(2, enemies=False)
        x = self.col(ground=False)
        self.col(ground=False)
        self.gh = min(7, self.gh + 4)
        self.set(x, self.top(), 'N')
        self.flat(4, enemies=False)
        self.gh = max(2, self.gh - 4)
        for _ in range(2):
            self.col(ground=False)
        self.flat(3, enemies=False)

    def spikes(self):
        xs = self.flat(self.r.randint(6, 9), enemies=False)
        w = self.r.choice([1, 2, 2, 3])
        x0 = xs[2]
        for i in range(w):
            self.set(x0 + i, self.top() - 1, '^')
        if self.r.random() < 0.5:
            self.set(x0 + w // 2, self.top() - 4, 'b')

    def loop(self):
        xs = self.flat(self.r.randint(6, 8), enemies=False)
        cx = xs[len(xs) // 2]
        self.set(cx, self.top() - 3, '=')
        self.set(cx + 1, self.top() - 3, 'o')

    def group(self):
        # 2-3 düşmanlık küçük bir sürü
        xs = self.flat(self.r.randint(9, 12), enemies=False)
        k = 2 + (self.r.random() < self.d)
        x0 = xs[4]
        for i in range(k):
            self.set(x0 + 2 * i, self.top() - 1, 'e' if i or 'v' not in WORLDS[self.w]['enemies'] or self.r.random() < 0.6 else 'v')
        if self.r.random() < 0.5:
            for i in range(3):
                self.set(x0 + i, self.top() - 4, 'C')

    def blockgap(self):
        # boşluğun üstünde blok köprü
        self.flat(2, enemies=False)
        n = self.r.randint(3, 5)
        y = self.top() - 3
        for i in range(n):
            x = self.col(ground=False)
            self.set(x, y, '=' if i in (0, n - 1) else self.r.choice('C=C'))
            if self.r.random() < 0.6:
                self.set(x, y - 2, 'b')
        self.flat(3, enemies=False)

    def tunnel(self):
        n = self.r.randint(10, 14)
        old = self.ceil
        self.ceil = max(old, H - self.gh - 6)  # 5 karo yükseklik
        xs = self.flat(n, enemies=False)
        y = self.top() - 4
        for x in xs[3:-3:3]:
            self.set(x, y, self.r.choice('CCK'))
        if self.r.random() < 0.6:
            self.enemy(xs[-3], kinds='ev' if 'v' in WORLDS[self.w]['enemies'] else 'e')
        self.ceil = old


def make(world, sec, r):
    d = (world * 3 + sec) / 26
    W = WORLDS[world]
    lv = Lv(r, d, world)
    # Sarnıç ve kulede tavan baştan sona; diğerlerinde açık hava
    if W['name'] == 'Yerebatan':
        lv.ceil = 2
    xs = lv.flat(8, enemies=False)
    lv.set(xs[2], lv.top() - 1, 'P')
    boss = sec == 2
    target = (95 if boss else 150) + int(40 * d)
    parts = W['parts']
    last = None
    first_power = True
    checkpoint = False
    while lv.x < target:
        if not checkpoint and lv.x > target * (0.6 if boss else 0.5):
            xs = lv.flat(5, enemies=False)
            lv.set(xs[2], lv.top() - 1, 'Q')
            checkpoint = True
        p = r.choice(parts)
        if p == last and p not in ('flat', 'blocks'):
            continue
        last = p
        if p == 'flat':
            lv.flat(r.randint(6, 12))
        else:
            getattr(lv, p)()
        if first_power and lv.x > 20:  # ilk güçlendirme erken gelsin
            x = lv.x
            lv.flat(6, enemies=False)
            lv.set(x + 2, lv.top() - 4, 'C'); lv.set(x + 3, lv.top() - 4, 'U'); lv.set(x + 4, lv.top() - 4, 'C')
            first_power = False
    if sec == 1:
        lv.hatira()
    # disket (can): her bölümde bir tane, gizli olmayan ama yüksekte
    x = lv.x
    lv.flat(6, enemies=False)
    lv.set(x + 3, lv.top() - 4, 'L' if sec == 1 else 'K')
    lv.ceil = 0
    if boss:
        lv.gh = 2
        lv.flat(4, enemies=False)
        a = lv.x
        lv.flat(1, enemies=False)
        lv.set(a, lv.top() - 1, 'A')
        lv.flat(17, enemies=False)
        for i in (6, 7, 8, 13, 14, 15):  # arenada iki ince platform
            lv.set(a + i, lv.top() - 4, '-')
        lv.set(a + 11, lv.top() - 2, 'B')
        lv.set(a + 15, lv.top() - 1, 'G')
        x = lv.col()
        for y in range(H):
            lv.set(x, y, '=')
    else:
        # bitiş: DEPLOY terminali ve bitiş duvarı
        lv.gh = 2
        xs = lv.flat(14, enemies=False)
        lv.set(xs[6], lv.top() - 1, 'G')
        x = lv.col()
        for y in range(H):
            lv.set(x, y, '=')
    rows = [''.join(c[y] for c in lv.cols) for y in range(H)]
    return rows


def main():
    levels = []
    for w in range(9):
        W = WORLDS[w]
        for s in range(3):
            r = random.Random(w * 1000 + s * 37 + 11)
            rows = make(w, s, r)
            levels.append({'world': w + 1, 'section': s + 1, 'name': W['sections'][s],
                           'boss': W['boss'] if s == 2 else None, 'bossName': W['boss_name'] if s == 2 else None,
                           'time': 300 if s < 2 else 360, 'map': rows})
    worlds = [{'name': W['name'], 'sub': W['sub']} for W in WORLDS]
    out = Path(__file__).resolve().parent.parent / 'src' / 'levels.js'
    body = ',\n'.join('  ' + json.dumps(lv, ensure_ascii=False) for lv in levels)
    out.write_text('// Bug Avcısı: İstanbul — 27 bölüm. Otomatik üretildi: python3 tools/bolumler.py\n'
                   f'window.BA_WORLDS = {json.dumps(worlds, ensure_ascii=False)};\n'
                   f'window.BA_LEVELS = [\n{body}\n];\n', encoding='utf-8')
    print(len(levels), 'bölüm →', out, '| genişlikler:', [len(l['map'][0]) for l in levels])


if __name__ == '__main__':
    main()
