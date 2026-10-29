"""Bug Avcısı: İstanbul — Dudullu sanayisinin elle tasarlanmış üç bölümü (gece vardiyası, şafaktan önce).

  10-1 İMES:    yürüyen bantlar (üstündekini taşır: oyuncu, bug, koli); bandın ucundan düşen koliler yığılır, basamak olur
  10-2 DES:     hidrolik presler: birden iner, altındakini ezer, yavaşça kalkar; kalkan kafasına binip yükseğe çık
  10-3 Kadosan: ocaktan çıkan kızgın demir çubuklar (kızgınken yakar, soğuyunca basılır); şahmerdan yerdekileri sıçratır,
                vurduğu an zıplayan çok yükseğe uçar; Spagetti Kod
"""
from elle import Canvas


def stairs(c, x, n, base, ch='='):
    for i in range(n):
        c.rect(x + i, base - 1 - i, x + i, base - 1, ch)


def stairs_down(c, x, n, top, base, ch='='):
    for i in range(n):
        c.rect(x + i, top + 1 + i, x + i, base - 1, ch)


# ---------------------------------------------------------------- 10-1
def bolum_10_1(room):
    W, Hm, FL = 200, 14, 12
    c = Canvas(W, Hm)
    c.rect(0, FL, W - 1, Hm - 1, '#')
    gap = lambda x0, x1: c.rect(x0, FL, x1, Hm - 1, '.')
    bant = lambda x0, x1, y, v: c.obj('bant', x0=x0, x1=x1, y=y, v=v)

    c.put(2, FL - 1, 'P')
    c.put(8, 8, 'K')
    c.put(14, FL - 1, 'e')

    # ---- TANIT: ileri akan bant hızlandırır; geri akan bant yavaşlatır, üstündeki bug'ı sana getirir
    bant(18, 34, FL, 3)
    bant(40, 58, FL, -3.5)
    c.put(54, FL - 1, 'e')
    c.row(9, range(20, 34, 3), 'b')
    c.row(9, range(42, 58, 3), 'b')

    # ---- GELİŞTİR: çukurun üstünde bantlar; koliler bantta yürüyen basamak
    gap(62, 90)
    bant(63, 68, 10, 2.5)
    bant(72, 77, 10, -2)
    bant(81, 87, 10, 3)
    c.obj('koli', x=63, y=9, every=2.4)
    c.put(75, 5, 'g')                            # altın 1: geri akan bandın üstünde
    c.row(7, range(64, 87, 3), 'b')

    # ---- TERS KÖŞE: yüksekteki bandın ucundan düşen koliler duvarın dibinde yığılır; yığından duvara çık
    c.put(93, FL - 1, 'Q')
    bant(96, 104, 6, 2)
    c.rect(96, 7, 104, 7, '=')
    c.obj('koli', x=96, y=5, every=2.2, max=3)
    c.rect(108, 5, 111, FL - 1, '=')
    c.row(4, range(108, 112), 'b')
    stairs_down(c, 112, 4, 5, FL)

    # ---- kayıt noktası, minibüs durağı; gizli basamaklar (altın 2)
    c.put(120, FL - 1, 'Q')
    c.put(123, FL - 1, 'E')
    c.put(128, 6, 'b')
    c.put(128, 8, 'x'); c.put(129, 5, 'x')
    c.row(3, range(130, 136), '-')
    c.put(133, 2, 'g')                           # altın 2

    # ---- SINA: farklı yükseklikte bantlar, bantta bug'lar, koliler
    c.put(140, FL - 1, 'Q')
    gap(144, 180)
    bant(145, 151, 10, 3)
    bant(155, 161, 8, -2.5)
    c.put(158, 7, 'e')
    bant(165, 171, 10, 3.5)
    c.obj('koli', x=165, y=9, every=2)
    bant(175, 179, 8, 2)
    c.put(168, 4, 'g')                           # altın 3
    c.row(5, range(146, 179, 4), 'b')
    c.put(184, FL - 1, 'R')
    c.put(194, FL - 1, 'G')
    c.rect(W - 1, 0, W - 1, Hm - 1, '=')

    rows = [r + room[y] for y, r in enumerate(c.rows())]
    return {'map': rows, 'room': W, 'objs': c.objs, 'blok': 'beton'}


# ---------------------------------------------------------------- 10-2
def bolum_10_2():
    W, Hm, FL = 200, 14, 12
    c = Canvas(W, Hm)
    c.rect(0, 0, W - 1, 1, '=')
    c.rect(0, FL, W - 1, Hm - 1, '#')
    pres = lambda x, **kw: c.obj('pres', x=x, top=kw.pop('top', 4), bot=FL - 1, **kw)

    c.put(2, FL - 1, 'P')
    c.put(8, 8, 'K')
    c.put(14, FL - 1, 'e')

    # ---- TANIT: tek pres; kalkınca altından geç. önüne gelen bug'ı ezer
    pres(26, per=3)
    c.put(30, FL - 1, 'e')
    c.row(9, range(20, 25, 2), 'b')

    # ---- GELİŞTİR: sıra sıra presler, sırayla iner
    for k, x in enumerate((40, 45, 50, 55)):
        pres(x, per=3, ph=k * 0.22)
    c.row(9, (43, 48, 53), 'b')
    c.put(48, 2, 'g')                            # altın 1: preslerin arasında yüksekte (kafanın üstünden)

    # ---- TERS KÖŞE: kalkan presin kafasına bin; seni yüksek rafa taşısın
    c.put(62, FL - 1, 'Q')
    pres(68, per=5.2, top=4)
    c.rect(70, 4, 84, FL - 1, '=')
    c.row(3, range(71, 84, 2), 'b')
    stairs_down(c, 85, 7, 4, FL)

    # ---- hatıra parçası
    c.put(96, FL - 1, 'Q')
    c.row(9, (99, 100), '-')
    c.row(6, range(102, 106), '-')
    c.put(104, 5, 'h')

    # ---- gizli: raflar arasında gizli basamaklar (altın 2)
    c.put(110, 6, 'b')
    c.put(110, 8, 'x'); c.put(111, 5, 'x')
    c.row(3, range(112, 118), '-')
    c.put(115, 2, 'g')                           # altın 2

    # ---- SINA: presler, ara rafları, bug'lar; son presle yükseğe
    c.put(122, FL - 1, 'Q')
    for k, x in enumerate((127, 133, 139)):
        pres(x, per=2.6, ph=k * 0.3)
    c.put(136, FL - 1, 'e')
    c.rect(145, 8, 150, FL - 1, '=')
    pres(152, per=4.6, top=4)
    c.rect(154, 4, 166, 5, '=')
    c.put(160, 3, 'g')                           # altın 3: yüksek rafta
    c.put(158, FL - 1, 'e')
    c.row(7, range(155, 166, 2), 'b')
    c.put(180, FL - 1, 'e')
    c.put(192, FL - 1, 'G')
    c.rect(W - 1, 0, W - 1, Hm - 1, '=')
    return {'map': c.rows(), 'objs': c.objs, 'blok': 'beton'}


# ---------------------------------------------------------------- 10-3
def bolum_10_3():
    W, Hm, FL = 200, 14, 12
    c = Canvas(W, Hm)
    c.rect(0, FL, W - 1, Hm - 1, '#')
    gap = lambda x0, x1: c.rect(x0, FL, x1, Hm - 1, '.')

    c.put(2, FL - 1, 'P')
    c.put(8, 8, 'K')
    c.put(14, FL - 1, 'e')

    # ---- TANIT: ocaktan çıkan çubuklar kızgın; soğuyup kararınca üstüne bas, çukurun üstünden geç
    gap(22, 39)
    c.obj('demir', x0=21, x1=39, y=11, every=2.6, v=2, cool=1.4)
    c.row(8, range(26, 38, 3), 'b')

    # ---- GELİŞTİR: şahmerdan; yanında dururken sıçratır, vurduğu an zıplarsan yüksek duvarın tepesine uçarsın
    c.obj('pres', x=50, w=2, top=4, bot=FL - 1, per=3.2, shock=5)
    c.rect(54, 4, 60, FL - 1, '=')
    c.row(3, range(55, 60, 2), 'b')
    c.put(57, 0, 'g')                            # altın 1: duvarın tepesinde, yüksek sıçrayışla
    stairs_down(c, 61, 7, 4, FL)

    # ---- TERS KÖŞE: bug sürüsü örsün çevresinde; şahmerdan vurunca hepsi devrilir
    c.put(70, FL - 1, 'Q')
    c.obj('pres', x=82, w=2, top=4, bot=FL - 1, per=2.8, shock=8)
    for x in (76, 79, 86, 89):
        c.put(x, FL - 1, 'e')
    c.row(8, range(76, 90, 3), 'b')

    # ---- kayıt noktası; gizli basamaklar (altın 2)
    c.put(96, FL - 1, 'Q')
    c.put(100, 6, 'b')
    c.put(100, 8, 'x'); c.put(101, 5, 'x')
    c.row(3, range(102, 108), '-')
    c.put(105, 2, 'g')                           # altın 2

    # ---- SINA: kızgın demir çukuru, şahmerdan ve yüksek duvar, pres
    c.put(112, FL - 1, 'Q')
    gap(116, 136)
    c.obj('demir', x0=115, x1=136, y=11, every=2.2, v=2.4, cool=1.3)
    c.put(126, 6, 'g')                           # altın 3: demirlerin üstünde
    c.obj('pres', x=142, w=2, top=4, bot=FL - 1, per=3, shock=5)
    c.rect(146, 5, 152, FL - 1, '=')
    stairs_down(c, 153, 6, 5, FL)
    c.obj('pres', x=166, w=2, top=3, bot=FL - 1, per=2.6)
    c.put(176, FL - 1, 'Q')

    # ---- Spagetti Kod arenası: atölyede
    a = 181
    c.put(a, FL - 1, 'A')
    c.row(8, range(a + 6, a + 9), '-')
    c.row(8, range(a + 13, a + 16), '-')
    c.put(a + 11, FL - 2, 'B')
    c.put(a + 15, FL - 1, 'G')
    c.rect(a + 18, 0, a + 18, Hm - 1, '=')
    assert a + 18 == W - 1
    return {'map': c.rows(), 'objs': c.objs, 'blok': 'beton'}


def build(sec, room=None):
    return [lambda: bolum_10_1(room), bolum_10_2, bolum_10_3][sec]()
