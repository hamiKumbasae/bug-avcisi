#!/usr/bin/env python3
"""Bug Avcısı: İstanbul — 12 dünya × 3 bölüm haritalarını üretir (v2.0 sırası) ve src/levels.js'e yazar.

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
  e  bug   s  spam   v  virüs   m  martı   j  raylardan sıçrayan bug
  T  bonus binişinin aracı (metro, metrobüs, tramvay, minibüs, taksi, füniküler; tavanına binilir)
  Y  füniküler varış noktası (aracın eğik rayda vardığı sol üst köşe)
  P  başlangıç   G  DEPLOY noktası   A  arena girişi   B  patron   W  tepedeki bank (sessiz bölümün sonu)
  h  hatıra parçası (her dünyanın 2. bölümünde bir tane, iki ince platformla çıkılan köşede)
  X  gizli blok (görünmez; alttan vurulunca disket = can çıkar)
  Z  çok simitli blok (çatlak görünür; kısa süre içinde her vuruşta bir simit verir)
  E  metro girişi (üstünde aşağı basılınca bonus odasına iner)
  O  bonus odasının çıkışı (yürüyen merdiven; içine yürüyünce yukarı çıkılır)
  R  metrodan çıkış noktası (bölümde daha ileride)
Metro hattı, bölümün bitiş duvarından sonra 88 sütunluk ayrı bir alandır (levels.js'te room: başlangıç sütunu, roomW: genişlik).
Tırmanış (climb) ve iniş (descent) parçaları bandı yukarı/aşağı kaydırır; harita o kadar uzar ve levels.js'te
vcam: [[sütun, kameranın en üst satırı, en alt satırı], ...] kameranın dikey hareket aralığını verir.
"""
import json
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import maslak   # noqa: E402  Maslak'ın elle tasarlanmış üç bölümü

H = 14
# v2.0: iki katmanlı İstanbul. Yukarısı bugünün şehri (Maslak, Şişli, Ataşehir, Köprü, Çamlıca), aşağısı eski İstanbul
# (Kapalıçarşı, Üsküdar, Yerebatan, Eyüp, Şile). Bütün oyun tek bir gün ve gecede geçer: saat her bölümün sahne saati.
# seed: bölüm üretiminin tohumu (eski dünyalardan gelenler eski tohumunu korur), dpos: zorluk sırası (Eyüp sakin).
# yer: bölümün çizimi (scenes.js / places.js'teki DRAW anahtarı)
WORLDS = [
    {'name': 'Maslak', 'sub': 'Plazalar', 'enemies': 'e', 'boss': 'kralbug', 'boss_name': 'Kral Bug', 'seed': 0, 'dpos': 0,
     'saat': ['sabah', 'sabah', 'sabah'], 'yer': ['maslak', 'toplanti', 'sunucu'],
     'sections': ['Büyükdere Caddesi', 'Toplantı Katı', 'Sunucu Katı']},
    {'name': 'Kapalıçarşı', 'sub': 'Kubbeler', 'enemies': 'esv', 'boss': 'truva', 'boss_name': 'Truva Atı', 'seed': 3, 'dpos': 1,
     'saat': ['ogle', 'ogle', 'ogle'], 'yer': ['carsi', 'han', 'bedesten'],
     'sections': ['Kuyumcular', 'Han', 'Bedesten']},
    {'name': 'Şişli', 'sub': 'Mecidiyeköy', 'enemies': 'es', 'boss': 'spam', 'boss_name': 'Spam Kraliçesi', 'seed': 12, 'dpos': 2,
     'saat': ['ogledenSonra', 'ogledenSonra', 'aksamustu'], 'yer': ['mecidiyekoy', 'plazaLobi', 'mesaiSonu'],
     'sections': ['Mecidiyeköy Meydanı', 'Plaza Lobisi', 'Mesai Sonu']},
    {'name': 'Üsküdar', 'sub': 'Sahil', 'enemies': 'ems', 'boss': 'marti', 'boss_name': 'Dev Martı', 'seed': 13, 'dpos': 3,
     'saat': ['gunbatimi', 'gunbatimi', 'gunbatimi'], 'yer': ['iskeleAksam', 'carsiAksam', 'sahil'],
     'sections': ['İskele', 'Çarşı', 'Sahil']},
    {'name': 'Ataşehir', 'sub': 'Finans Merkezi', 'enemies': 'esvo', 'boss': 'fidye', 'boss_name': 'Fidye Yazılımı', 'seed': 11, 'dpos': 4,
     'saat': ['gece', 'gece', 'gece'], 'yer': ['finans', 'veri', 'kontrol'],
     'sections': ['Finans Merkezi', 'Veri Merkezi', 'Kontrol Odası']},
    {'name': 'Yerebatan', 'sub': 'Sarnıç', 'enemies': 'evo', 'boss': 'sizinti', 'boss_name': 'Bellek Sızıntısı', 'seed': 4, 'dpos': 5,
     'saat': ['gece', 'gece', 'gece'], 'yer': ['sarnic', 'medusa', 'karanlikSu'],
     'sections': ['Sütunlar', 'Medusa', 'Karanlık Su']},
    {'name': 'Köprü', 'sub': 'Boğaz Köprüsü', 'enemies': 'msv', 'boss': 'ddos', 'boss_name': 'DDoS Bulutu', 'seed': 7, 'dpos': 6,
     'saat': ['gece', 'gece', 'gece'], 'yer': ['kopruGece', 'halatlarGece', 'kopruTepe'],
     'sections': ['Ayak', 'Halatlar', 'Tepe']},
    {'name': 'Eyüp', 'sub': 'Gece yarısı', 'enemies': 'e', 'boss': None, 'boss_name': None, 'seed': 14, 'dpos': 3.5,
     'saat': ['geceyarisi', 'geceyarisi', 'geceyarisi'], 'yer': ['balatGece', 'teleferik', 'tepe'],
     'sections': ['Balat Yokuşu', 'Teleferik', 'Tepe']},
    {'name': 'Şile', 'sub': 'Gece yolu', 'enemies': 'emv', 'boss': 'dongu', 'boss_name': 'Sonsuz Döngü', 'seed': 15, 'dpos': 7.5,
     'saat': ['geceyarisindanSonra', 'geceyarisindanSonra', 'geceyarisindanSonra'], 'yer': ['sileYol', 'benzin', 'fener'],
     'sections': ['Gece Yolu', 'Benzin İstasyonu', 'Fener']},
    {'name': 'Sanayi', 'sub': 'Dudullu', 'enemies': 'esvo', 'boss': 'spagetti', 'boss_name': 'Spagetti Kod', 'seed': 16, 'dpos': 8.5,
     'saat': ['geceyarisindanSonra', 'geceyarisindanSonra', 'safakOncesi'], 'yer': ['imes', 'des', 'kadosan'],
     'sections': ['İMES', 'DES', 'Kadosan']},
    {'name': 'Çamlıca', 'sub': 'Kule', 'enemies': 'esvmo', 'boss': 'maviekran', 'boss_name': 'Mavi Ekran', 'seed': 9, 'dpos': 9.5,
     'saat': ['safakOncesi', 'safakOncesi', 'safakOncesi'], 'yer': ['camlica', 'asansor', 'yayin'],
     'sections': ['Tepe Yolu', 'Asansör', 'Yayın Odası']},
    {'name': 'Ümraniye', 'sub': 'Ev', 'enemies': 'esvmo', 'boss': 'teknikborc', 'boss_name': 'Teknik Borç', 'seed': 10, 'dpos': 10, 'gun': 1,
     'saat': ['safak', 'sabah', 'sabah'], 'yer': ['umraniyeCarsi', 'yeniPlazalar', 'atolye'],
     'sections': ['Çarşı', 'Yeni Plazalar', 'Atölye']},
]
DSPAN = 32   # zorluk ölçeği: ilk 11 dünyanın 33 bölümü (0 → 1)


def wseed(w):
    return WORLDS[w].get('seed', w)


def wdpos(w):
    return WORLDS[w].get('dpos', w)

# Bonus binişleri: bölümün semtine göre araç. tür → (genişlik karo, hız karo/sn, tavan satırı)
RIDE_KIND = {'metro': (10, 4.5, 9), 'metrobus': (11, 5.0, 9), 'tram': (10, 3.9, 9), 'minibus': (6, 4.4, 10),
             'taxi': (5, 5.4, 11), 'funicular': (8, 3.0, 10)}


def ride(kind, line, col, a, b, scene=None, night=False):
    w, v, roof = RIDE_KIND[kind]
    d = {'type': kind, 'line': line, 'col': col, 'a': a, 'b': b, 'w': w, 'v': v}
    if scene:
        d['scene'] = scene      # bölümün arka planı sokağa uymuyorsa binişin kendi sahnesi
    if night:
        d['night'] = True       # gece: sokak parçaları karartılır
    return d


# Her bölüm ayrı bir mekân: parça karışımı (bölümün tipi), tavan (iç mekân) ve bonus binişi.
# Dış mekân bölümleri koşu ve bloklar; iç mekânlar tavanlı ve dar; patron bölümleri kale gibi tuzaklı.
PLACES = [
    [  # Maslak
        {'parts': ['flat', 'blocks', 'blocks', 'gap', 'step', 'pillars', 'stairs', 'group'], 'ride': ride('metrobus', '34', '#c8102e', 'ZİNCİRLİKUYU', 'MECİDİYEKÖY'), 'vert': ['climb', 'descent']},
        {'parts': ['flat', 'blocks', 'blocks', 'pillars', 'stairs', 'vertical', 'group', 'gap'], 'ceil': 2, 'vert': ['climb', 'climb']},
        {'parts': ['flat', 'spikes', 'loop', 'pillars', 'blocks', 'gap', 'tunnel', 'group'], 'ceil': 2},
    ],
    [  # Kapalıçarşı: kuyumcular, eski bir han, bedesten
        {'parts': ['flat', 'blocks', 'blocks', 'tunnel', 'stairs', 'pillars', 'gap', 'spikes', 'group', 'blockgap'], 'ride': ride('tram', 'T1', '#2a6fc4', 'BEYAZIT', 'ÇEMBERLİTAŞ', scene='divanyolu'), 'vert': ['climb', 'descent']},
        {'parts': ['flat', 'blocks', 'blocks', 'tunnel', 'pillars', 'group', 'stairs', 'blockgap'], 'ceil': 2, 'vert': ['descent', 'climb']},
        {'parts': ['spikes', 'loop', 'pillars', 'gap', 'blocks', 'tunnel', 'group', 'flat'], 'ceil': 2},
    ],
    [  # Şişli: Mecidiyeköy meydanı, plaza lobisi, mesai sonu
        {'parts': ['flat', 'blocks', 'blocks', 'gap', 'step', 'pillars', 'stairs', 'group', 'blockgap'], 'ride': ride('metro', 'M2', '#2fa84f', 'TAKSİM', 'ŞİŞLİ-MECİDİYEKÖY'), 'vert': ['climb', 'descent']},
        {'parts': ['flat', 'blocks', 'pillars', 'stairs', 'vertical', 'group', 'gap', 'moving'], 'ceil': 2, 'vert': ['climb', 'climb']},
        {'parts': ['flat', 'spikes', 'loop', 'pillars', 'blocks', 'gap', 'tunnel', 'group'], 'ceil': 2},
    ],
    [  # Üsküdar: iskele, çarşı, sahil
        {'parts': ['flat', 'gap', 'gap', 'bridge', 'blocks', 'moving', 'blockgap'], 'ride': ride('metro', 'B1', '#2a9fd6', 'SİRKECİ', 'ÜSKÜDAR'), 'vert': ['descent', 'climb']},
        {'parts': ['flat', 'awnings', 'awnings', 'blocks', 'group', 'stairs', 'blockgap', 'gap'], 'vert': ['climb', 'descent']},
        {'parts': ['slope', 'slope', 'step', 'stairs', 'gap', 'bridge', 'flat', 'pillars']},
    ],
    [  # Ataşehir: finans merkezinin cam kuleleri (cephe asansörleri), veri merkezi, akıllı şehir kontrol odası
        {'parts': ['flat', 'blocks', 'moving', 'pillars', 'vertical', 'gap', 'blocks', 'group', 'stairs', 'blockgap'], 'ride': ride('minibus', '', '#1fb5ad', 'ÜSKÜDAR', 'ATAŞEHİR', night=True), 'vert': ['climb', 'climb']},
        {'parts': ['flat', 'tunnel', 'pillars', 'spikes', 'blocks', 'loop', 'group', 'blockgap', 'stairs'], 'ceil': 2, 'vert': ['descent', 'climb']},
        {'parts': ['flat', 'spikes', 'loop', 'moving', 'pillars', 'blocks', 'gap', 'group'], 'ceil': 2},
    ],
    [  # Yerebatan
        {'parts': ['tunnel', 'tunnel', 'gap', 'pillars', 'moving', 'spikes', 'loop', 'blocks', 'group'], 'ceil': 2, 'ride': ride('tram', 'T1', '#2a6fc4', 'SİRKECİ', 'SULTANAHMET', scene='divanyolu', night=True), 'vert': ['descent', 'descent']},
        {'parts': ['pillars', 'pillars', 'gap', 'moving', 'loop', 'bridge', 'blocks', 'flat'], 'ceil': 2, 'vert': ['descent', 'climb']},
        {'parts': ['tunnel', 'spikes', 'loop', 'loop', 'gap', 'pillars', 'moving', 'group'], 'ceil': 2},
    ],
    [  # Köprü
        {'parts': ['flat', 'blocks', 'gap', 'pillars', 'stairs', 'bridge', 'group', 'moving'], 'vert': ['climb', 'climb']},
        {'parts': ['bridge', 'bridge', 'moving', 'moving', 'vertical', 'blockgap', 'pillars'], 'vert': ['climb', 'descent']},
        {'parts': ['pillars', 'pillars', 'moving', 'vertical', 'loop', 'bridge', 'gap']},
    ],
    [  # Eyüp: oyunun sessiz dünyası; az düşman (yalnız bug), 3. bölüm düşmansız ve süresiz kısa bir tepe yolu
        {'parts': ['slope', 'slope', 'stairs', 'step', 'blocks', 'gap', 'flat'], 'foes': 6},
        {'parts': ['flat', 'moving', 'moving', 'gap', 'bridge', 'moving', 'step', 'blocks'], 'foes': 6, 'vert': ['climb', 'climb']},
        {'quiet': True},
    ],
    [  # Şile: şehir dışında gece yolu, ıssız benzin istasyonu, fırtınada fener
        {'parts': ['flat', 'blocks', 'gap', 'slope', 'step', 'pillars', 'group', 'blockgap'], 'ride': ride('minibus', '', '#1fb5ad', 'ÜSKÜDAR', 'ŞİLE', night=True), 'vert': ['descent', 'climb']},
        {'parts': ['flat', 'blocks', 'blocks', 'pillars', 'gap', 'stairs', 'group', 'spikes'], 'vert': ['climb', 'descent']},
        {'parts': ['moving', 'moving', 'gap', 'blockgap', 'bridge', 'pillars', 'loop', 'flat']},
    ],
    [  # Sanayi: İMES gece vardiyası, DES depoları, Kadosan dövme atölyeleri
        {'parts': ['flat', 'spikes', 'loop', 'pillars', 'moving', 'blocks', 'gap', 'group'], 'ride': ride('minibus', '', '#1fb5ad', 'ŞİLE', 'DUDULLU', night=True), 'vert': ['climb', 'descent']},
        {'parts': ['pillars', 'pillars', 'vertical', 'blocks', 'gap', 'stairs', 'group', 'blockgap'], 'ceil': 2, 'vert': ['climb', 'descent']},
        {'parts': ['flat', 'spikes', 'loop', 'pillars', 'moving', 'blocks', 'gap', 'group']},
    ],
    [  # Çamlıca
        {'parts': ['flat', 'step', 'slope', 'gap', 'spikes', 'pillars', 'blocks', 'group', 'stairs'], 'ride': ride('taxi', '', '#f2c21b', 'ÇAMLICA', 'KISIKLI', night=True), 'vert': ['climb', 'climb']},
        {'parts': ['vertical', 'vertical', 'moving', 'pillars', 'loop', 'blockgap', 'bridge'], 'vert': ['climb', 'climb']},
        {'parts': ['spikes', 'loop', 'tunnel', 'moving', 'pillars', 'blocks', 'gap', 'flat'], 'ceil': 2},
    ],
    [  # Ümraniye: şafakta çarşı, sabah yeni plazalar ve metro, kendi atölyesi
        {'parts': ['flat', 'awnings', 'blocks', 'blocks', 'group', 'stairs', 'gap', 'step'], 'ride': ride('minibus', '', '#1fb5ad', 'ÜMRANİYE', 'KADIKÖY'), 'vert': ['descent', 'climb']},
        {'parts': ['flat', 'blocks', 'pillars', 'vertical', 'gap', 'stairs', 'group', 'blockgap'], 'ride': ride('metro', 'M5', '#8a4fae', 'ÜMRANİYE', 'ÇARŞI'), 'vert': ['climb', 'descent']},
        {'parts': ['flat', 'spikes', 'loop', 'pillars', 'moving', 'blocks', 'gap', 'group']},
    ],
]



# bonus binişi (88 × 14): iki durak arasında kolay, düşmansız, simit dolu bir yolculuk.
# Durakta bekleyen aracın tavanına binilir; araç öbür durakta durur. Metro ve füniküler yer altında (tavanlı),
# metrobüs, tramvay, minibüs ve taksi caddede (açık hava). Füniküler eğik rayda 4 satır yukarı tırmanır.
# Raylara/yola düşen oyuncu ölmez, binişten çıkar (Mario'daki bulut odası gibi).
ROOM_W = 88


def make_room(r, rd):
    kind = rd['type']
    w, v, R = RIDE_KIND[kind]
    W = ROOM_W
    g = [['.'] * W for _ in range(H)]
    under = kind in ('metro', 'funicular')
    if under:
        for x in range(W):
            g[0][x] = g[1][x] = '='
        for y in range(H):
            g[y][0] = g[y][W - 1] = '='
    A1, B0 = 9, 79
    RA, RB = R, (R - 4 if kind == 'funicular' else R)   # A ve B duraklarının üst satırı
    for x in range(0 if not under else 1, W if not under else W - 1):
        if x <= A1:
            for y in range(RA, H):
                g[y][x] = '#'
        elif x >= B0:
            for y in range(RB, H):
                g[y][x] = '#'
    g[RA - 1][A1 + 1] = 'T'
    if kind == 'funicular':
        g[RB - 1][B0 - w] = 'Y'           # varışta aracın sol üst köşesi
    top = 3 if under else 1               # tavanın altı
    def roof(cx):                         # aracın o sütundan geçerken tavan satırı
        k = min(1, max(0, (cx - (A1 + 1) - w / 2) / max(1, B0 - w - (A1 + 1))))
        return round(RA + (RB - RA) * k)
    def put(x, y, ch):
        if 0 < x < W - 1 and top <= y < H and g[y][x] == '.':
            g[y][x] = ch
    # A durağı: simitler ve bloklar
    for x in range(2, 9):
        put(x, RA - 2, 'b')
    for x, ch in zip(range(3, 8), 'CKZKC'):
        put(x, RA - 4, ch)
    # yol boyunca: önce güç bloğu, sonra simit yayları ve simitli bloklar
    x, first = 21, True
    while x < B0 - 12:
        base = roof(x + 3)
        if first or r.random() < 0.35:
            # bloklar tavandan 4 satır yukarıda: alttan vurulur, üstüne de çıkılır (laptop orada durur)
            for i in range(3):
                put(x + 1 + i, base - 4, ('U' if first else 'K') if i == 1 else 'C')
            put(x + 2, base - 6, 'b')
            for i in range(5):
                put(x + i, base - 2, 'b')
            first = False
        else:
            for i, dy in enumerate([3, 4, 5, 5, 4, 3]):
                put(x + i, base - dy, 'b')
            if r.random() < 0.5:
                put(x + 2, base - 7, 'b'); put(x + 3, base - 7, 'b')
        x += 8
    # B durağı: simitler, gizli disket ve çıkış
    for x in range(80, 85):
        put(x, RB - 2, 'b')
    put(82, RB - 4, 'X')
    g[RB - 1][W - 3] = 'O'
    return [''.join(row) for row in g]


SAFE_R = 9   # özel noktaların çevresinde düşmansız yarıçap (karo)


class Lv:
    # Bölüm, 14 satırlık 'bant'lardan oluşur. Her sütunun bandı (base) dikey konumunu verir; tırmanış ve
    # inişlerde bant yukarı/aşağı kayar, harita da o kadar uzar. Sütun hücreleri banda göre (0..13) tutulur;
    # bandın dışındaki hücreler (dikey boşluklardaki platformlar) extra'da mutlak satırla durur.
    def __init__(self, r, d, w):
        self.r, self.d, self.w = r, d, w
        self.cols = []
        self.base = 0          # şu anki bandın üst satırı (göreli; yukarısı eksi)
        self.cbase, self.ctop, self.cceil, self.cwall, self.extra = [], [], [], [], []
        self.gh = 2          # zemin kalınlığı (satır)
        self.ceil = 0        # tavan kalınlığı (tünel)
        self.hidden = 0      # yerleştirilen gizli blok sayısı
        self.multi = 0       # çok simitli blok sayısı
        self.ekinds = WORLDS[w]['enemies']   # bu bölümdeki düşman türleri

    @property
    def x(self):
        return len(self.cols)

    def top(self, gh=None):
        return H - (gh if gh is not None else self.gh)

    def col(self, ground=True, top=None):
        c = ['.'] * H
        if ground:
            for y in range(self.top(), H):
                c[y] = '#'
        for y in range(self.ceil):
            c[y] = '='
        self.cols.append(c)
        self.cbase.append(self.base)
        self.ctop.append(self.base if top is None else top)
        self.cceil.append(self.ceil)
        self.cwall.append(False)
        self.extra.append({})
        return self.x - 1

    def put(self, x, row, ch):
        # mutlak (göreli) satıra yaz: bant içindeyse banda, değilse extra'ya
        b = self.cbase[x]
        if b <= row < b + H:
            self.set(x, row - b, ch)
        else:
            self.extra[x][row] = ch

    def wall(self):
        x = self.col()
        self.cwall[x] = True
        for y in range(H):
            self.set(x, y, '=')
        return x

    # ---------- dikey parçalar ----------
    def climb(self):
        # tırmanış: zikzak ince platformlarla R satır yukarı; üstte yeni bant sağa devam eder
        R = self.r.choice([9, 12])
        self.gh = 2
        self.flat(3, enemies=False)
        base, up = self.base, self.base - R
        xs = []
        for _ in range(7):
            x = self.col(top=up)
            for y in range(self.ceil):
                self.set(x, y, '.')
            xs.append(x)
        g = base + self.top()
        n = R // 3 - 1
        for k in range(n):
            h = 3 * (k + 1)
            right = (n - 1 - k) % 2 == 0
            cs = xs[3:6] if right else xs[1:4]
            for c in cs:
                self.put(c, g - h, '-')
            if self.r.random() < 0.5:
                self.put(cs[1], g - h - 2, 'b')
        if self.r.random() < 0.35 + 0.3 * self.d:
            self.put(xs[3], g - 5, self.r.choice('sm') if any(k in self.ekinds for k in 'sm') else 'e')
        self.base = up
        self.flat(3, enemies=False)

    def descent(self):
        # iniş: bant D satır aşağı; boşlukta kenarlarda basamaklar, ortada aşağı akan simitler
        D = self.r.choice([9, 12])
        self.gh = 2
        self.flat(3, enemies=False)
        top, low = self.base, self.base + D
        self.base = low
        xs = []
        for _ in range(6):
            x = self.col(top=top)
            for y in range(self.ceil):
                self.set(x, y, '.')
            xs.append(x)
        g = low + self.top()
        k = 0
        for h in range(D - 3, 2, -3):
            cs = xs[0:2] if k % 2 == 0 else xs[4:6]
            for c in cs:
                self.put(c, g - h, '-')
            k += 1
        for row in range(top + self.ceil + 3, g - 1, 2):
            self.put(xs[2 + (row // 2) % 2], row, 'b')
        self.flat(3, enemies=False)

    # ---------- haritayı birleştir ----------
    def assemble(self, room=None):
        main_n = self.x
        if room is not None:
            rb = max(self.cbase)
            for cx in range(len(room[0])):
                self.cols.append([room[y][cx] for y in range(H)])
                self.cbase.append(rb); self.ctop.append(rb); self.cceil.append(2); self.cwall.append(False); self.extra.append({})
        lo = min(min(self.ctop), min(self.cbase))
        hi = max(self.cbase) + H - 1
        rows = []
        for R in range(lo, hi + 1):
            line = []
            for x in range(self.x):
                b, t, ce = self.cbase[x], self.ctop[x], self.cceil[x]
                inside = ce > 0
                if self.cwall[x]:
                    ch = '='
                elif R in self.extra[x]:
                    ch = self.extra[x][R]
                elif R < t:
                    ch = '=' if inside else '.'
                elif R < b:
                    ch = '=' if inside and R < t + ce else '.'
                elif R < b + H:
                    ch = self.cols[x][R - b]
                else:
                    ch = '#' if self.cols[x][H - 1] in '#=' else '.'
                line.append(ch)
            rows.append(''.join(line))
        # dikey kamera aralıkları: [x, üst, alt] (değiştiği yerlerde)
        vcam = []
        for x in range(self.x):
            v = [self.ctop[x] - lo, self.cbase[x] - lo]
            if not vcam or vcam[-1][1:] != v:
                vcam.append([x] + v)
        return rows, vcam

    def set(self, x, y, ch):
        if 0 <= y < H and 0 <= x < self.x:
            self.cols[x][y] = ch

    def get(self, x, y):
        return self.cols[x][y]

    def enemy(self, x, kinds=None, air=False):
        kinds = kinds or self.ekinds
        k = self.r.choice(kinds)
        if k == 'o':
            k = 'e'
        if k in 'sm':  # uçanlar havada
            self.set(x, self.top() - 3 - self.r.randint(0, 2), k)
        else:
            self.set(x, self.top() - 1, k)

    # ---------- parçalar ----------
    def flat(self, n, enemies=None, extras=False):
        xs = [self.col() for _ in range(n)]
        if enemies is None:
            enemies = n >= 6 and self.r.random() < 0.35 + 0.45 * self.d
        if enemies:
            for _ in range(1 + (self.r.random() < self.d)):
                self.enemy(self.r.choice(xs[2:]))
        if extras and n >= 8:
            t = self.top()
            roll = self.r.random()
            if roll < 0.3:  # yerden zıplayınca toplanan simit sırası
                k = min(n - 3, self.r.randint(4, 6))
                x0 = xs[0] + (n - k) // 2
                for i in range(k):
                    self.set(x0 + i, t - 3, 'b')
            elif roll < 0.5:  # yay biçiminde simitler
                x0 = xs[0] + 1
                for i, dy in enumerate([2, 3, 4, 4, 3, 2]):
                    if x0 + i < xs[-1]:
                        self.set(x0 + i, t - dy, 'b')
            elif roll < 0.85 and t - 4 > self.ceil + 1:  # kısa blok sırası: düzlük boş kalmasın
                pat = self.r.choice(['CKC', 'KCK', 'CCKC', 'CKKC', 'K', 'CC'])
                x0 = xs[0] + (n - len(pat)) // 2
                for i, ch in enumerate(pat):
                    self.set(x0 + i, t - 4, ch)
        return xs

    # ---------- düşman yoğunluğu ----------
    def ground_row(self, x):
        # sütunun yürünebilir zemini: alttan kesintisiz katı yığının üst satırı (bant içinde); boşluk/duvar/kuyu ise None
        if x < 0 or x >= self.x or self.cwall[x] or self.ctop[x] != self.cbase[x]:
            return None
        c = self.cols[x]
        if c[H - 1] not in '#=':
            return None
        g = H - 1
        while g > 0 and c[g - 1] in '#=':
            g -= 1
        return g

    def populate(self, want, x0, x1, start=16):
        # Düşmanları seyrek kalan yerlere, düz zemine (ya da havaya) en boş aralıktan başlayarak ekle.
        # Özel işaretlerin (başlangıç, kayıt, metro, arena, hatıra, asansör...) ve dikey kuyuların yanından uzak dur.
        kinds = self.ekinds.replace('o', '')
        walkers = ''.join(k for k in kinds if k in 'ev') or 'e'
        flyers = ''.join(k for k in kinds if k in 'sm')
        foes = [x for x in range(self.x) if any(ch in 'esvm' for ch in self.cols[x]) or any(ch in 'esvm' for ch in self.extra[x].values())]
        marks = [(x, SAFE_R if any(ch in 'PQER' for ch in self.cols[x]) else 3) for x in range(self.x) if any(ch in 'PQGERhABMNTOo' for ch in self.cols[x])]

        def ok(x):
            if x < max(start, x0) or x >= x1:
                return None
            if any(abs(x - m) <= rad for m, rad in marks):
                return None
            if any(0 <= x + k < self.x and self.ctop[x + k] != self.cbase[x + k] for k in range(-3, 4)):
                return None
            g = self.ground_row(x)
            if g is None or g - 1 <= self.cceil[x]:
                return None
            for k in (-1, 0, 1, 2):
                c = self.cols[x + k] if x + k < self.x else None
                if c is None or self.ground_row(x + k) != g or c[g - 1] != '.' or (g >= 2 and c[g - 2] not in '.b'):
                    return None
            if any(self.cols[x + k][g - 1] == '^' for k in (-2, 3) if 0 <= x + k < self.x):
                return None
            return g

        n = len(foes)
        while n < want:
            cands = [x for x in range(x0, x1) if ok(x) is not None]
            if not cands:
                break
            far = lambda x: min([abs(x - f) for f in foes] + [x - start + 6])
            best = max(far(x) for x in cands)
            if best < 5:
                break
            x = self.r.choice([x for x in cands if far(x) == best])
            g = ok(x)
            if flyers and self.r.random() < 0.3:
                y = g - 3 - self.r.randint(0, 2)
                c = self.cols[x]
                if y - 1 > self.cceil[x] and all(c[yy] == '.' for yy in (y - 1, y, y + 1)):
                    self.set(x, y, self.r.choice(flyers))
                else:
                    self.set(x, g - 1, self.r.choice(walkers))
            else:
                self.set(x, g - 1, self.r.choice(walkers))
            foes.append(x)
            n += 1
        return n

    def clear_near(self, chars='PQER', before=SAFE_R, after=SAFE_R):
        # başlangıç, kayıt noktası ve metro giriş/çıkışının çevresi düşmansız: oraya gelen oyuncu hemen vurulmasın
        for m in [x for x in range(self.x) if any(ch in chars for ch in self.cols[x])]:
            for x in range(max(0, m - before), min(self.x, m + after + 1)):
                for y in range(H):
                    if self.cols[x][y] in 'esvm':
                        self.cols[x][y] = '.'
                for row, ch in list(self.extra[x].items()):
                    if ch in 'esvm':
                        self.extra[x][row] = '.'

    def secret(self):
        # gizli blok: sade bir düzlüğün ortasında, yerden 4 karo yukarıda; alttan vurulunca can (disket) çıkar
        xs = self.flat(9, enemies=False)
        self.set(xs[4], self.top() - 4, 'X')
        self.hidden += 1

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
        elif self.multi < 1 and 'C' in pat and self.r.random() < 0.35:
            i = pat.index('C')
            pat = pat[:i] + 'Z' + pat[i + 1:]
            self.multi += 1
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
        if self.r.random() < 0.6:
            # boşluğun üstünde zıplama yayını izleyen simitler
            x0 = self.x - 3 - n - 1
            m = n + 2
            for i in range(m):
                u = (i + 0.5) / m
                dy = 2 + round(3 * 4 * u * (1 - u))
                self.set(x0 + i, self.top() - dy, 'b')

    def step(self):
        delta = self.r.choice([-2, -1, 1, 2] if self.d < 0.5 else [-3, -2, 2, 3])
        self.gh = max(1, min(6, self.gh + delta))
        self.flat(self.r.randint(4, 7))

    def stairs(self):
        n = self.r.randint(3, 5 if self.d > 0.3 else 4)
        base = self.top()
        if self.ceil:
            n = max(2, min(n, base - self.ceil - 4))
        coins = self.r.random() < 0.5
        for i in range(1, n + 1):
            x = self.col()
            for k in range(i):
                self.set(x, base - 1 - k, '=')
            if coins:
                self.set(x, base - i - 2, 'b')
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
            self.set(x0 + 2 * i, self.top() - 1, 'e' if i or 'v' not in self.ekinds or self.r.random() < 0.6 else 'v')
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
            self.enemy(xs[-3], kinds='ev' if 'v' in self.ekinds else 'e')
        self.ceil = old


    def awnings(self):
        # pazar tezgâhları: tentelerin üstü ince platform, altında düşman
        xs = self.flat(self.r.randint(10, 13), enemies=False)
        t = self.top()
        k = 0
        for x0 in range(xs[1], xs[-3], 4):
            h = 3 if k % 2 == 0 else 5
            for i in range(3):
                self.set(x0 + i, t - h, '-')
            if self.r.random() < 0.5:
                self.set(x0 + 1, t - h - 2, 'b')
            k += 1
        if self.r.random() < 0.5 + 0.4 * self.d:
            self.enemy(xs[len(xs) // 2], kinds='e')

    def slope(self):
        # yokuş: art arda birer karo yükselen kısa düzlükler
        up = self.gh < 5 or self.r.random() < 0.3
        for _ in range(self.r.randint(2, 3)):
            self.gh = max(1, min(6, self.gh + (1 if up else -1)))
            self.flat(self.r.randint(3, 4), enemies=False)
        self.flat(3)

    def metro_in(self):
        xs = self.flat(7, enemies=False)
        self.set(xs[2], self.top() - 1, 'E')
        return xs[2]

    def metro_out(self):
        xs = self.flat(7, enemies=False)
        self.set(xs[2], self.top() - 1, 'R')

    def finale(self):
        # bitiş merdiveni: tepeden atlayıp DEPLOY antenine ne kadar yüksekten değersen o kadar puan
        self.gh = 2
        self.flat(4, enemies=False)
        base = self.top()
        n = 5
        for i in range(1, n + 1):
            x = self.col()
            for k in range(i):
                self.set(x, base - 1 - k, '=')
        x = self.col()
        for k in range(n):
            self.set(x, base - 1 - k, '=')
        xs = self.flat(14, enemies=False)
        self.set(xs[5], self.top() - 1, 'G')


def make_quiet(lv, r):
    # Eyüp'ün tepesi: ~100 karo, düşman yok, patron ve kale yolu yok, süre işlemez, DEPLOY anteni yok.
    # Yumuşak bir yokuş; birkaç simit; tepedeki iki kişilik banka varınca bölüm biter (W).
    xs = lv.flat(8, enemies=False)
    lv.set(xs[2], lv.top() - 1, 'P')
    plan = ['flat', 'up', 'flat', 'up', 'flat', 'up', 'flat', 'down', 'flat', 'up', 'up', 'flat']
    simits = 0
    for k in plan:
        if k == 'up' or k == 'down':
            lv.gh = max(1, min(6, lv.gh + (1 if k == 'up' else -1)))
            lv.flat(r.randint(3, 4), enemies=False)
        else:
            xs = lv.flat(r.randint(6, 9), enemies=False)
            if simits < 7 and r.random() < 0.6:
                for i in range(2):
                    lv.set(xs[2 + i * 2], lv.top() - 3, 'b')
                simits += 2
    xs = lv.flat(12, enemies=False)
    lv.set(xs[6], lv.top() - 1, 'W')
    lv.flat(3, enemies=False)
    lv.wall()
    rows, vcam = lv.assemble(None)
    return rows, None, vcam, None


def make(world, sec, r):
    d = min(1.0, (wdpos(world) * 3 + sec) / DSPAN)
    W = WORLDS[world]
    PL = PLACES[world][sec]
    lv = Lv(r, d, world)
    # iç mekânlarda tavan baştan sona; dış mekânlarda açık hava
    lv.ceil = PL.get('ceil', 0)
    if PL.get('quiet'):
        return make_quiet(lv, r)
    xs = lv.flat(8, enemies=False)
    lv.set(xs[2], lv.top() - 1, 'P')
    boss = sec == 2 and bool(W['boss'])
    # bölüm boyu: 1. dünyada ~200 blok (Mario 1-1 gibi), 11. dünyada ~320; patron bölümünde arenadan önce kale yolu
    target = (115 + int(85 * d)) if boss else (175 + int(120 * d))
    parts = PL['parts']
    last = None
    first_power = True
    checkpoint = False
    rd = PL.get('ride') if not boss else None
    metro = bool(rd)
    metro_x = None
    secret_at = None if boss else int(target * r.uniform(0.25, 0.42))
    vert = [] if boss else list(PL.get('vert', []))
    vert_at = [int(target * 0.3), int(target * 0.68)]
    while lv.x < target:
        if vert and lv.x > vert_at[2 - len(vert)]:
            getattr(lv, vert.pop(0))()
            last = None
            continue
        if secret_at is not None and lv.x > secret_at and lv.hidden == 0:
            lv.secret()
        if metro and metro_x is None and lv.x > 34:
            metro_x = lv.metro_in()
        elif metro and metro_x is not None and metro_x > 0 and lv.x > metro_x + 30 + int(target * 0.15):
            lv.metro_out()
            metro_x = -1
        if not checkpoint and lv.x > target * (0.6 if boss else 0.5):
            xs = lv.flat(5, enemies=False)
            lv.set(xs[2], lv.top() - 1, 'Q')
            checkpoint = True
        p = r.choice(parts)
        if p == last and p not in ('flat', 'blocks'):
            continue
        last = p
        if p == 'flat':
            lv.flat(r.randint(6, 10), extras=True)
        else:
            getattr(lv, p)()
        if first_power and lv.x > 20:  # ilk güçlendirme erken gelsin
            x = lv.x
            lv.flat(6, enemies=False)
            lv.set(x + 2, lv.top() - 4, 'C'); lv.set(x + 3, lv.top() - 4, 'U'); lv.set(x + 4, lv.top() - 4, 'C')
            first_power = False
    if sec == 1:
        lv.hatira()
    # düşman yoğunluğu: Mario 1-1'de 17 düşman var; burada 14 → 20, patron yolunda 9 → 14
    lv.clear_near()
    lv.populate(PL['foes'] if 'foes' in PL else (9 + round(5 * d)) if boss else (14 + round(6 * d)), 0, lv.x)
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
        lv.wall()
    else:
        if metro and metro_x is not None and metro_x > 0:  # çıkış hâlâ konmadıysa
            lv.metro_out()
        # bitiş: merdiven, DEPLOY terminali ve bitiş duvarı
        lv.finale()
        lv.wall()
    room = lv.x if metro else None
    rows, vcam = lv.assemble(make_room(r, rd) if metro else None)
    return rows, room, vcam, rd


def main():
    levels = []
    for w in range(len(WORLDS)):
        W = WORLDS[w]
        for s in range(3):
            r = random.Random(wseed(w) * 1000 + s * 37 + 11)
            rows, room, vcam, rd = make(w, s, r)
            hand = None
            if w == 0:
                # Maslak elle tasarlandı (v2.1 prototipi); metrobüs binişi üretilenle aynı
                hand = maslak.build(s, make_room(r, rd) if rd else None)
                rows, vcam = hand['map'], hand['vcam']
                room = hand.get('room')
            lv = {'world': w + 1, 'section': s + 1, 'name': W['sections'][s], 'yer': W['yer'][s],
                  'boss': W['boss'] if s == 2 else None, 'bossName': W['boss_name'] if s == 2 else None,
                  'time': (300 if s < 2 else 330) + 50 * round(2 * min(1.0, (wdpos(w) * 3 + s) / DSPAN)), 'map': rows}
            # sahne saati (ay ve gökyüzü için): gece yarısından sonraki saatler ve son dünyanın sabahları ertesi güne düşer
            lv['saat'] = W['saat'][s]
            if W.get('gun') or lv['saat'] in ('geceyarisi', 'geceyarisindanSonra', 'safakOncesi', 'safak'):
                lv['gun'] = 1
            if PLACES[w][s].get('ceil'):
                lv['ic'] = True      # iç mekân ya da yer altı: gökyüzü görünmez
            if PLACES[w][s].get('quiet'):
                lv['quiet'] = True   # sessiz bölüm: düşman, patron, süre, müzik ve DEPLOY yok; bankta biter
            if room is not None:
                lv['room'] = room
                lv['roomW'] = ROOM_W
                lv['ride'] = rd
            if len(rows) > H:
                lv['vcam'] = vcam
            if hand:
                lv['hand'] = True    # el yapımı: çok kayıt noktası, altın simitler, zemine oturan kamera
                for k in ('links', 'dark'):
                    if hand.get(k):
                        lv[k] = hand[k]
            levels.append(lv)
    worlds = [{'name': W['name'], 'sub': W['sub']} for W in WORLDS]
    out = Path(__file__).resolve().parent.parent / 'src' / 'levels.js'
    body = ',\n'.join('  ' + json.dumps(lv, ensure_ascii=False) for lv in levels)
    out.write_text(f'// Bug Avcısı: İstanbul — {len(levels)} bölüm. Otomatik üretildi: python3 tools/bolumler.py\n'
                   f'window.BA_WORLDS = {json.dumps(worlds, ensure_ascii=False)};\n'
                   f'window.BA_LEVELS = [\n{body}\n];\n', encoding='utf-8')
    print(len(levels), 'bölüm →', out, '| genişlikler:', [len(l['map'][0]) for l in levels])


if __name__ == '__main__':
    main()
