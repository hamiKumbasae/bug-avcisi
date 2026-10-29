"""Bug Avcısı: İstanbul — Ümraniye'nin elle tasarlanmış üç bölümü (şafak ve sabah; eve dönüş).

  12-1 Çarşı:          şafak ışığı soldan ilerler: değdiği kepenkler kalkar, bankta uyuyan bug'lar uyanır, simitçiler
                       tezgâhını açar (tezgâhın tentesi sektirir); ışığın peşinden tenteden tenteye
  12-2 Yeni Plazalar:  inşaattaki vinç kancaları: kiriş kalkar, taşınır, iner; havada kirişten kirişe
  12-3 Çatı:           eve giden yol: önceki dünyalardan tanıdık düzenekler art arda; kendi apartmanının çatısında Teknik Borç
"""
from elle import Canvas


def stairs(c, x, n, base, ch='='):
    for i in range(n):
        c.rect(x + i, base - 1 - i, x + i, base - 1, ch)


def stairs_down(c, x, n, top, base, ch='='):
    for i in range(n):
        c.rect(x + i, top + 1 + i, x + i, base - 1, ch)


# ---------------------------------------------------------------- 12-1
def bolum_12_1(room):
    W, Hm, FL = 200, 14, 12
    c = Canvas(W, Hm)
    c.rect(0, FL, W - 1, Hm - 1, '#')
    gap = lambda x0, x1: c.rect(x0, FL, x1, Hm - 1, '.')

    def gate(x, top=3):
        """çarşı kapısı: kemer (katı) ve altında şafakta kalkan kepenk"""
        c.rect(x, top, x, 6, '=')
        c.obj('kepenk', x=x, y0=7, y1=FL - 1, dawn=True)

    c.obj('safak', x0=14, v=4.2)
    c.put(2, FL - 1, 'P')
    c.put(8, 8, 'K')

    # ---- TANIT: çarşının kapısı şafakta açılır; bankta uyuyan bug'lar ışık değince irkilir
    gate(26)
    c.put(31, FL - 1, 'z'); c.put(36, FL - 1, 'z')
    c.row(9, range(28, 40, 3), 'b')

    # ---- GELİŞTİR: yüksek han duvarı; simitçi şafakta tezgâhını açar, tentesinden sekip duvarı aş
    c.obj('sabahtente', x0=50, x1=52, y=FL - 1)
    c.rect(55, 5, 68, FL - 1, '=')
    c.row(4, range(57, 68, 2), 'b')
    c.put(62, 1, 'g')                            # altın 1: duvarın tepesinde, yüksek sekişle
    stairs_down(c, 69, 6, 5, FL)
    gate(80)
    c.put(84, FL - 1, 'e')

    # ---- TERS KÖŞE: çukurun üstündeki tezgâhlar ışık geldikçe sırayla açılır; ışığın peşinden tenteden tenteye
    c.put(92, FL - 1, 'Q')
    gap(97, 121)
    for x in (99, 105, 111, 117):
        c.obj('sabahtente', x0=x, x1=x + 2, y=10)
    c.row(5, range(100, 120, 3), 'b')

    # ---- kayıt noktası, minibüs durağı; gizli basamaklar (altın 2)
    c.put(126, FL - 1, 'Q')
    c.put(129, FL - 1, 'E')
    c.put(134, 6, 'b')
    c.put(134, 8, 'x'); c.put(135, 5, 'x')
    c.row(3, range(136, 142), '-')
    c.put(139, 2, 'g')                           # altın 2

    # ---- SINA: kapılar, tenteler, bug'lar
    c.put(146, FL - 1, 'Q')
    gate(150)
    c.put(154, FL - 1, 'e')
    c.obj('sabahtente', x0=158, x1=160, y=FL - 1)
    c.rect(163, 5, 170, FL - 1, '=')
    c.put(166, 1, 'g')                           # altın 3
    stairs_down(c, 171, 6, 5, FL)
    gate(180)
    c.put(184, FL - 1, 'R')
    c.put(194, FL - 1, 'G')
    c.rect(W - 1, 0, W - 1, Hm - 1, '=')

    rows = [r + room[y] for y, r in enumerate(c.rows())]
    return {'map': rows, 'room': W, 'objs': c.objs, 'blok': 'tas'}


# ---------------------------------------------------------------- 12-2
def bolum_12_2(room):
    W, Hm, FL = 200, 14, 12
    c = Canvas(W, Hm)
    c.rect(0, FL, W - 1, Hm - 1, '#')
    gap = lambda x0, x1: c.rect(x0, FL, x1, Hm - 1, '.')
    vinc = lambda ax, ay, bx, by, top, **kw: c.obj('vinc', ax=ax, ay=ay, bx=bx, by=by, top=top, **kw)

    c.put(2, FL - 1, 'P')
    c.put(8, 8, 'K')
    c.put(13, FL - 1, 'e')

    # ---- TANIT: şantiye çiti; vincin kirişine bin, çitin üstünden öbür yana taşısın
    vinc(18, 9, 33, 9, 4, v=4.6, wait=1.2)
    c.rect(26, 5, 29, FL - 1, '=')
    c.row(4, range(26, 30), 'b')

    # ---- GELİŞTİR: temel çukuru; birinci vinç ortadaki direğe, ikincisi karşıya
    gap(42, 76)
    vinc(38, 10, 52, 9, 7, v=4.4, wait=1)
    c.rect(57, 9, 58, Hm - 1, '=')
    vinc(59, 9, 72, 10, 5, v=4.4, wait=1, t0=2.5)
    c.put(65, 2, 'g')                            # altın 1: ikinci vincin yolunun üstünde
    c.row(6, range(44, 75, 4), 'b')

    # ---- hatıra parçası
    c.put(80, FL - 1, 'Q')
    c.row(9, (83, 84), '-')
    c.row(6, range(86, 90), '-')
    c.put(88, 5, 'h')

    # ---- TERS KÖŞE: iki vinç havada buluşur; kirişler yan yana gelince öbürüne geç
    c.put(94, FL - 1, 'Q')
    gap(97, 126)
    # ikinci vinç yarım tur geriden gelir: biri karşı uçta beklerken öbürü başta bekler, kirişler yan yana durur
    vinc(96, 9, 108, 5, 4, v=4.6, wait=1.6)
    vinc(112, 5, 124, 9, 4, v=4.6, wait=1.6, t0=18 / 4.6 + 1.6)
    c.row(3, range(100, 124, 3), 'b')

    # ---- kayıt noktası, metro girişi; gizli basamaklar (altın 2)
    c.put(130, FL - 1, 'Q')
    c.put(133, FL - 1, 'E')
    c.put(138, 6, 'b')
    c.put(138, 8, 'x'); c.put(139, 5, 'x')
    c.row(3, range(140, 146), '-')
    c.put(143, 2, 'g')                           # altın 2

    # ---- SINA: çukur, üç vinç, bug'lar
    c.put(149, FL - 1, 'Q')
    gap(153, 183)
    vinc(151, 10, 160, 7, 3, v=4.4, wait=1)
    c.rect(165, 7, 166, Hm - 1, '=')
    c.put(165, 6, 'e')
    vinc(168, 7, 180, 10, 3, v=4.4, wait=1, t0=1.5)
    c.put(174, 1, 'g')                           # altın 3
    c.put(187, FL - 1, 'R')
    c.put(195, FL - 1, 'G')
    c.rect(W - 1, 0, W - 1, Hm - 1, '=')

    rows = [r + room[y] for y, r in enumerate(c.rows())]
    return {'map': rows, 'room': W, 'objs': c.objs, 'blok': 'beton'}


# ---------------------------------------------------------------- 12-3
def bolum_12_3():
    """Eve giden yol: her dünyadan bir düzenek, kısa kısa."""
    W, Hm, FL = 197, 14, 12
    c = Canvas(W, Hm)
    c.rect(0, FL, W - 1, Hm - 1, '#')
    gap = lambda x0, x1: c.rect(x0, FL, x1, Hm - 1, '.')

    c.put(2, FL - 1, 'P')
    c.put(8, 8, 'K')

    # kuyumcu terazisi
    gap(14, 26)
    c.obj('terazi', xa=15, xb=22, y=9, r=2)
    # borsa panoları
    gap(30, 42)
    for k, x in enumerate((31, 35, 39)):
        c.obj('pano', x0=x, x1=x + 1, y=10 - k % 2, per=3, on=1.7, ph=k * 0.33)
    c.put(37, 5, 'g')                            # altın 1
    # çamaşır ipi
    c.obj('ip', x0=46, x1=51, y=10)
    c.rect(53, 6, 57, FL - 1, '=')
    c.row(5, range(53, 58), 'b')
    stairs_down(c, 58, 5, 6, FL)
    # yürüyen bant ve pres
    c.obj('bant', x0=68, x1=84, y=FL, v=-2.5)
    c.obj('pres', x=74, w=2, top=4, bot=FL - 1, per=2.8)
    c.obj('pres', x=80, w=2, top=4, bot=FL - 1, per=2.8, ph=0.5)
    c.put(88, FL - 1, 'Q')
    # gizli: tavan arası (altın 2)
    c.put(92, 6, 'b')
    c.put(92, 8, 'x'); c.put(93, 5, 'x')
    c.row(3, range(94, 100), '-')
    c.put(97, 2, 'g')                            # altın 2
    # şalter, elektrikli ızgara ve raylı platform
    c.obj('salter', x=103, y=11, grp='a', on=False)
    c.rect(106, FL, 112, Hm - 1, '.')
    c.obj('ray', x0=106, x1=110, y=10, w=3, grp='a', v=2.4)
    c.obj('izgara', x0=113, x1=116, y=FL, grp='a')
    # rüzgâr ve kirişler
    gap(118, 131)
    c.row(10, [x for x in range(118, 132) if x not in (122, 123, 127, 128)], '-')
    for x in (120, 125, 130):
        c.rect(x, 5, x + 1, 7, '=')
    c.obj('ruzgar', x0=116, x1=134, v=-8, per=3.2, on=1.2)
    # sis ve cam köprü
    gap(136, 160)
    c.obj('cam', x0=136, x1=160, y=FL)
    c.obj('sis', x0=130, x1=158, w=10, per=7)
    c.put(148, 6, 'g')                           # altın 3: cam köprünün üstünde
    c.put(150, FL - 1, 'e')
    c.put(171, FL - 1, 'Q')

    # ---- Teknik Borç arenası: apartmanın çatısında
    a = 178
    c.put(a, FL - 1, 'A')
    c.row(8, range(a + 6, a + 9), '-')
    c.row(8, range(a + 13, a + 16), '-')
    c.put(a + 11, FL - 2, 'B')
    c.put(a + 15, FL - 1, 'G')
    c.rect(a + 18, 0, a + 18, Hm - 1, '=')
    assert a + 18 == W - 1
    return {'map': c.rows(), 'objs': c.objs, 'blok': 'beton'}


def build(sec, room=None):
    return [lambda: bolum_12_1(room), lambda: bolum_12_2(room), bolum_12_3][sec]()
