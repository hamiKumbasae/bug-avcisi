"""Bug Avcısı: İstanbul — Maslak'ın elle tasarlanmış üç bölümü (v2.1 prototipi).

    bolumler.py bunları 1. dünyanın bölümleri olarak kullanır; öteki dünyalar hâlâ üretilir.

Her bölüm tek bir fikri dört adımda işler: tanıt (tehlikesiz), geliştir, ters köşe, sına.
  1-1 Büyükdere Caddesi: cam silme sepetleri (aşağı yukarı giden platformlar)
  1-2 Toplantı Katı:     kart okuyucu birkaç saniyeliğine cam kapıları açar
  1-3 Sunucu Katı:       yerdeki soğutma fanları yukarı iter; sıcak kabinler yakar (Kral Bug)

Yeni harita işaretleri (bolumler.py'deki listeye ek):
  g  altın simit (bölüm başına üç)      V  cam silme sepeti (3 karo)   :  sepetin öbür ucu (aynı sütun)
  z  bankta uyuyan bug                  q  simit hırsızı martı (altındaki simiti kapar)
  k  simitçi tezgâhı (üstüne inen seker) x  gizli basamak (alttan vurulunca simit, sonra basılır)
  y  saksı    I  cam cephe / cam duvar  t  turnike kolu (küçükken altından geçilir)
  r  kart okuyucu   D  kartla açılan kapı   d  kartla kapanan kapı   u  toplantı masası   w  toplantıdaki bug
  c  kahve makinesi (kahve çıkar)       p  kapak (asma tavan ya da yükseltilmiş taban; vurunca / aşağı basınca açılır)
  F  sürekli çalışan fan   f  aralıklı fan   H  sıcak kabin   J  soğuk kabin   n  kablo kanalında kayan bug
Kapı bağlantıları ve süreleri bölümün links, karanlık arka planlı bölgeler dark listesindedir.
"""


class Canvas:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.g = [['.'] * w for _ in range(h)]
        self.darks = []    # karanlık arka planlı bölgeler (tavan arası, taban altı): [x0, y0, x1, y1]

    def put(self, x, y, ch):
        assert 0 <= x < self.w and 0 <= y < self.h, (x, y, ch)
        self.g[y][x] = ch

    def rect(self, x0, y0, x1, y1, ch):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.put(x, y, ch)

    def dark(self, x0, y0, x1, y1):
        self.rect(x0, y0, x1, y1, '.')
        self.darks.append([x0, y0, x1, y1])

    def row(self, y, xs, ch):
        for x in xs:
            self.put(x, y, ch)

    def text(self, x, y, s):
        for i, ch in enumerate(s):
            if ch != ' ':
                self.put(x + i, y, ch)

    def rows(self):
        return [''.join(r) for r in self.g]


def door(c, x, y0, y1, top, ch='D'):
    """cam duvar (tavandan kapının üstüne) ve kapı"""
    if top <= y0 - 1:
        c.rect(x, top, x, y0 - 1, 'I')
    c.rect(x, y0, x, y1, ch)


# ---------------------------------------------------------------- 1-1
def bolum_1_1(room):
    """Büyükdere Caddesi. 23 satır: 0-5 çatı üstü gökyüzü, 6-19 cadde bandı, 20-22 çukurların dibi.
    Cadde 18. satırda; kamera çoğu yerde 6. satırdan bakar."""
    W, Hm, ST = 240, 23, 18
    c = Canvas(W, Hm)
    c.rect(0, ST, W - 1, Hm - 1, '#')

    # ---- açılış: tek blok, blok sırası, karşıdan gelen bug; çay sağa gider, saksıdan sekip geri gelir
    c.put(3, ST - 1, 'P')
    c.put(11, 14, 'K')
    c.text(16, 14, 'CUCKC')
    c.put(18, 10, 'K')
    c.put(23, ST - 1, 'e')
    c.put(25, ST - 1, 'y')
    c.row(15, range(28, 32), 'b')

    # ---- bankta çay bardağıyla uyuyan bug: yaklaşınca irkilir, kaçar, saksıya çarpıp geri döner
    c.put(37, ST - 1, 'z')
    c.row(14, (40, 41), 'b')
    c.put(46, ST - 1, 'y')

    # ---- TANIT: temel çukuru ve ilk sepet. Kule A'nın tepesine yalnız sepetle çıkılır; çukura düşen
    # dipte bekleyip sepete biner (çukurun dibi 22. satır)
    c.rect(50, ST, 56, 21, '.')
    c.rect(57, 11, 62, 17, 'I')
    c.put(53, 10, 'V'); c.put(53, 20, ':')
    c.row(9, range(58, 62), 'b')
    c.row(21, (51, 52), 'b')

    # ---- simit hırsızı: sıranın son simitini kapar; havada ezilirse beş simit bırakır
    c.row(15, range(66, 72), 'b')
    c.put(71, 9, 'q')
    c.put(76, ST - 1, 'Q')
    # simitçi tezgâhı: tentesine inen kule 1'in tepesine kadar seker
    c.put(83, ST - 1, 'k'); c.put(84, ST - 1, 'k')
    c.put(85, 13, 'b'); c.put(86, 11, 'b'); c.put(87, 9, 'b')
    c.rect(87, 11, 92, 17, 'I')

    # ---- GELİŞTİR: iki kule arasında aynı hızda inip çıkan iki sepet; aşağısı boşluk
    c.rect(93, ST, 103, Hm - 1, '.')
    c.put(94, 10, 'V'); c.put(94, 15, ':')
    c.put(99, 10, 'V'); c.put(99, 15, ':')
    c.row(8, (97, 98), 'b')
    c.rect(104, 11, 109, 17, 'I')
    # altın 3: kule 2'nin tepesinden koşarak uzun atlayış, reklam panosunun üstü
    c.row(12, range(119, 122), '-')
    c.put(120, 11, 'g')

    # ---- cadde: metrobüs durağı, bloklar, iki saksı arasında gidip gelen bug'lar
    c.put(114, ST - 1, 'E')
    c.text(123, 14, 'CUC')
    c.put(124, 10, 'K')
    c.put(128, ST - 1, 'y')
    c.put(131, ST - 1, 'e'); c.put(134, ST - 1, 'e')
    c.put(137, ST - 1, 'y')
    # gizli basamaklar: ilkinin üstünde tek bir simit; basamaklar vinç koluna çıkar (sepetleri atlayan kestirme)
    c.put(140, 12, 'b')
    for k, (x, y) in enumerate([(140, 14), (141, 11), (142, 8), (143, 5)]):
        c.put(x, y, 'x')
    c.row(3, range(144, 175), '-')
    c.row(2, range(147, 158, 2), 'b')
    c.put(160, 2, 'g')                       # altın 2: vinç kolunda
    c.row(2, range(164, 173, 2), 'b')

    # ---- TERS KÖŞE: kule 3 ile 4 arasında ters yönde giden iki sepet
    c.put(146, ST - 1, '='); c.rect(147, 16, 147, 17, '='); c.rect(148, 15, 148, 17, '=')
    c.rect(149, 14, 154, 17, 'I')
    c.rect(155, ST, 169, Hm - 1, '.')
    c.put(157, 10, 'V'); c.put(157, 16, ':')     # A: tepeden başlar
    c.put(164, 16, 'V'); c.put(164, 10, ':')     # B: dipten başlar
    c.put(161, 7, 'g')                           # altın 1: A tepedeyken zıplayıp B'ye düşerken
    c.rect(170, 11, 175, 17, 'I')

    # ---- cadde: metrobüsten çıkış, ikinci kayıt noktası, çok simitli blok, saksılar arasında bug'lar
    c.put(181, ST - 1, 'R')
    c.put(187, ST - 1, 'Q')
    c.text(190, 14, 'CZC')
    c.put(194, ST - 1, 'y')
    c.put(197, ST - 1, 'e'); c.put(200, ST - 1, 'e')
    c.put(203, ST - 1, 'y')
    c.put(199, 11, 'K')

    # ---- SINA: bitiş merdiveni ve antenin yanından yükselen sepet: tepesinden atlayan antenin ucuna değer
    c.put(209, ST - 1, '='); c.rect(210, 16, 210, 17, '='); c.rect(211, 15, 211, 17, '='); c.rect(212, 14, 212, 17, '=')
    c.put(214, 16, 'V'); c.put(214, 7, ':')
    c.row(6, range(216, 220), 'b')
    c.put(222, ST - 1, 'G')
    c.rect(W - 1, 0, W - 1, Hm - 1, '=')

    rows = c.rows()
    # metrobüs binişi: haritanın altındaki 14 satıra eklenir, üstü kapalı
    rows = [r + ('=' * len(room[0]) if y < Hm - 14 else room[y - (Hm - 14)]) for y, r in enumerate(rows)]
    # çatı yolunda kamera ancak oyuncu kulelerin üstüne çıkınca kalkar (ayaklar ekranın 8. satırında)
    vcam = [[0, 6, 6], [49, 6, 9], [57, 6, 6], [139, 0, 6, 8], [176, 6, 6], [W, Hm - 14, Hm - 14]]
    return {'map': rows, 'room': W, 'vcam': vcam}


# ---------------------------------------------------------------- 1-2
def bolum_1_2():
    """Toplantı Katı. 18 satır: 0-3 asma tavanın üstü (tavan arası), 4-5 tavan, 6-15 ofis, 16-17 taban."""
    W, Hm, FL = 214, 18, 16
    c = Canvas(W, Hm)
    c.rect(0, 0, W - 1, 5, '=')
    c.rect(0, FL, W - 1, Hm - 1, '#')
    links = []

    # ---- TANIT: lobi; okuyucu kapının hemen yanında
    c.put(2, FL - 1, 'P')
    c.put(6, FL - 1, 'y')
    c.row(12, range(8, 11), 'b')
    c.put(12, FL - 1, 'r')
    door(c, 15, 13, 15, 6)
    links.append({'r': [12, 15], 'doors': [[15, 13]], 'dur': 3})

    # ---- personel turnikesi: küçükken kolun altından salona girilir; büyükken merdivenle asma kata
    c.put(18, 15, '='); c.rect(19, 14, 19, 15, '='); c.rect(20, 13, 20, 15, '=')
    c.put(23, 13, 'I'); c.put(23, 14, 't')
    c.row(12, range(23, 38), '-')
    c.rect(37, 13, 37, 15, 'I')
    c.row(15, range(24, 37), 'b')
    c.row(10, range(26, 31), 'b')
    c.put(33, 11, 'e')

    # ---- GELİŞTİR: okuyucu yüksek rafta, kapı uzakta (koşmak gerekir); yoldaki camlı kabinde altın 1
    c.rect(42, 14, 42, 15, '=')
    c.row(11, range(44, 48), '-')
    c.put(46, 10, 'r')
    c.row(13, range(48, 52), 'b')
    c.row(12, range(54, 58), '=')
    door(c, 54, 13, 15, 13)
    c.rect(57, 13, 57, 15, 'I')
    c.put(55, 15, 'g')
    c.put(61, FL - 1, 'e')
    door(c, 66, 13, 15, 6)
    links.append({'r': [46, 10], 'doors': [[54, 13], [66, 13]]})

    # ---- TERS KÖŞE: okuyucu toplantı odasının kapısını açar ama çıkış kapısını kilitler; süre bitene dek
    # odada masadaki bug'larla kalınır
    c.put(70, FL - 1, 'r')
    door(c, 73, 13, 15, 6)
    c.put(80, FL - 1, 'u')
    for x in (77, 78, 82):
        c.put(x, FL - 1, 'w')
    c.row(12, range(75, 87), 'b')
    door(c, 88, 13, 15, 6, 'd')
    links.append({'r': [70, 15], 'doors': [[73, 13], [88, 13]], 'dur': 5})
    c.put(92, FL - 1, 'Q')

    # ---- açık ofis: masalar, hatıra parçasının köşesi
    c.row(13, range(95, 98), '-')
    c.put(99, FL - 1, 'e')
    c.row(13, (102, 103), '-')
    c.row(10, range(105, 109), '-')
    c.put(107, 9, 'h')

    # ---- gizli: dolabın tepesinden asma tavan kapağına vurulur; tavan arasından kestirme
    c.put(113, 14, '='); c.put(113, 15, '=')
    c.rect(114, 12, 114, 15, '=')
    c.rect(115, 10, 116, 15, '=')
    c.dark(113, 2, 146, 4)
    c.row(5, (116, 117), 'p')
    c.row(4, (113, 114), 'b')
    c.row(4, range(120, 142, 2), 'b')
    c.put(132, 4, 'g')                           # altın 2: tavan arasında
    c.put(138, 4, 'e')
    c.row(5, (144, 145), '.')                    # tavan arasının çıkışı: ofise iner
    c.row(13, range(121, 124), '-')
    c.row(13, range(127, 130), '-')
    c.put(125, FL - 1, 'e'); c.put(134, FL - 1, 'e')
    c.put(139, 12, 'c')                          # kahve makinesi

    # ---- SINA: tek okuyucu, art arda üç kapı; dördüncüsü çıkmaz dolabın kapısı (altın 3)
    c.put(147, FL - 1, 'Q')
    c.put(150, FL - 1, 'r')
    for x in (154, 161, 168):
        door(c, x, 13, 15, 6)
    c.put(158, FL - 1, 'e')
    c.put(164, 15, '=')
    c.row(14, (171, 172), '-')
    c.row(12, range(173, 177), '-')
    c.row(12, range(177, 181), '=')
    c.row(12, range(181, 191), '-')
    door(c, 177, 13, 15, 13)
    c.rect(180, 13, 180, 15, 'I')
    c.put(178, 15, 'g')
    c.row(10, range(183, 189, 2), 'b')
    links.append({'r': [150, 15], 'doors': [[154, 13], [161, 13], [168, 13], [177, 13]], 'dur': 3.6})

    # ---- bitiş: tavanı açık teras, merdiven ve DEPLOY
    c.rect(192, 4, W - 2, 5, '.')
    c.put(196, 15, '='); c.rect(197, 14, 197, 15, '='); c.rect(198, 13, 198, 15, '='); c.rect(199, 12, 199, 15, '=')
    c.put(206, FL - 1, 'G')
    c.rect(W - 1, 0, W - 1, Hm - 1, '=')

    vcam = [[0, 4, 4], [113, 0, 4], [147, 4, 4]]
    return {'map': c.rows(), 'vcam': vcam, 'links': links, 'dark': c.darks}


# ---------------------------------------------------------------- 1-3
def bolum_1_3():
    """Sunucu Katı. 20 satır: 0-1 tavan, 2-11 salon, 12-13 yükseltilmiş taban, 14-17 taban altı (gizli), 18-19 beton."""
    W, Hm, FL = 209, 20, 12
    c = Canvas(W, Hm)
    c.rect(0, 0, W - 1, 1, '=')
    c.rect(0, FL, W - 1, Hm - 1, '#')

    c.put(2, FL - 1, 'P')
    c.put(8, 8, 'K')
    c.put(14, FL - 1, 'e')
    c.rect(18, 10, 18, 11, 'J')
    c.row(8, (17, 19), 'b')

    # ---- TANIT: tek fan, yanında boyu aşılamayan kabin; fan tepesine taşır
    c.put(26, FL, 'F'); c.put(27, FL, 'F')
    c.rect(29, 6, 30, 11, 'J')
    c.row(5, (29, 30), 'b')
    c.put(26, 8, 'b'); c.put(27, 6, 'b')
    c.put(36, FL - 1, 'e')

    # ---- GELİŞTİR: açık taban üstünde fandan fana süzülme
    c.rect(46, FL, 62, Hm - 1, '.')
    for x in (50, 55, 60):
        c.put(x, FL, 'F'); c.put(x + 1, FL, 'F')
        c.put(x, FL + 1, '#'); c.put(x + 1, FL + 1, '#')
        c.row(7, (x, x + 1), 'b')
    c.put(58, 4, 'g')                            # altın 1: iki fanın arasında, yüksekte

    # ---- kablo kanalında sağa kayan bug'lar oyuncunun önüne düşer; ilk sıcak kabin (yanındaki bug ezilince soğur)
    c.row(6, range(78, 93), '-')
    c.put(78, 5, 'n'); c.put(80, 5, 'n')
    c.rect(100, 10, 101, 11, 'H')
    c.put(104, FL - 1, 'e')
    c.put(108, FL - 1, 'Q')

    # ---- TERS KÖŞE: aralıklı fanlar, tepelerinde sıcak kabinler; aradaki ada da sıcak, üstündeki bug ezilince soğur
    c.rect(113, FL, 126, Hm - 1, '.')
    c.put(115, FL, 'f'); c.put(116, FL, 'f'); c.put(115, FL + 1, '#'); c.put(116, FL + 1, '#')
    c.rect(119, 11, 120, 13, 'H')
    c.put(119, 10, 'e')
    c.put(123, FL, 'f'); c.put(124, FL, 'f'); c.put(123, FL + 1, '#'); c.put(124, FL + 1, '#')
    c.rect(114, 2, 117, 4, 'H')
    c.rect(122, 2, 125, 4, 'H')
    c.row(8, (115, 116, 123, 124), 'b')

    # ---- gizli: yükseltilmiş taban kapağı; taban altındaki kablo koridoru, çıkışta fanla kapağa vurulur
    c.rect(138, 12, 139, 13, 'p')
    c.dark(136, 14, 170, 17)
    c.row(17, range(141, 150, 2), 'b')
    c.put(152, 17, 'g')                          # altın 2: taban altında
    c.put(158, 17, 'e')
    c.put(167, 18, 'F'); c.put(168, 18, 'F')
    c.rect(167, 12, 168, 13, 'p')
    c.row(15, (167, 168), 'b')
    # üstteki yol: sıcak kabin, bug'lar, kabin yığını
    c.rect(148, 10, 148, 11, 'H')
    c.put(151, FL - 1, 'e')
    c.rect(156, 9, 157, 11, 'J')
    c.put(156, 5, 'K')
    c.put(162, FL - 1, 'e')

    # ---- arenadan önce: iki sıcak kabin arası, tavandaki sıcak kabinin hemen altında altın 3
    c.rect(175, 9, 175, 11, 'H')
    c.rect(182, 9, 182, 11, 'H')
    c.put(179, FL - 1, 'e')
    c.rect(178, 2, 179, 4, 'H')
    c.put(178, 6, 'g')

    # ---- SINA: Kral Bug arenası; platformların altında fanlar (ikinci evrede kesik kesik çalışır)
    a = 190
    c.put(186, FL - 1, 'Q')
    c.put(a, FL - 1, 'A')
    c.row(8, range(a + 6, a + 9), '-')
    c.row(8, range(a + 13, a + 16), '-')
    c.put(a + 7, FL, 'F'); c.put(a + 14, FL, 'F')
    c.put(a + 11, FL - 2, 'B')
    c.put(a + 15, FL - 1, 'G')
    c.rect(a + 18, 0, a + 18, Hm - 1, '=')
    assert a + 18 == W - 1

    vcam = [[0, 0, 0], [136, 0, 6], [171, 0, 0]]
    return {'map': c.rows(), 'vcam': vcam, 'dark': c.darks}


def build(sec, room=None):
    return [lambda: bolum_1_1(room), bolum_1_2, bolum_1_3][sec]()
