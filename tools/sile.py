"""Bug Avcısı: İstanbul — Şile'nin elle tasarlanmış üç bölümü (gece yarısından sonra).

  9-1 Gece Yolu:         karanlık yol; araçların farları önünü aydınlatır. hızla gelen araç çarpar, üstünden atla ya da
                         tavanına bin; dolmuş durakta durur, çivili çukurların üstünden tavanında geç
  9-2 Benzin İstasyonu:  oto yıkama fırçaları (değeni itip sektirir, bug'ları yıkar, tepesine binilir); yükselen köpük
                         baloncukları (üstünde biraz durunca patlar)
  9-3 Fener:             işaret fenerlerinin dönen ışığı; ışık düşen basamak belirir, gölge basamağı ışıkta kaybolur;
                         Sonsuz Döngü
"""
from elle import Canvas


def stairs(c, x, n, base, ch='='):
    for i in range(n):
        c.rect(x + i, base - 1 - i, x + i, base - 1, ch)


# ---------------------------------------------------------------- 9-1
def bolum_9_1(room):
    W, Hm, FL = 200, 14, 12
    c = Canvas(W, Hm)
    c.rect(0, FL, W - 1, Hm - 1, '#')
    lamp = lambda x: c.obj('lamba', x=x, y=2, always=True)
    yol = lambda x0, x1, d, **kw: c.obj('yol', x0=x0, x1=x1, y=FL, dir=d, **kw)

    c.put(2, FL - 1, 'P')
    c.put(8, 8, 'K')
    for x in (4, 14):
        lamp(x)

    # ---- TANIT: karşıdan gelen araçlar; farları yaklaştığını gösterir. üstünden atla ya da durakta bekle
    yol(19, 63, -1, every=3.4, v=6, kinds=['taksi', 'dolmus', 'taksi'])
    c.row(9, range(30, 34), '-')
    c.row(9, range(46, 50), '-')
    c.row(7, range(30, 34), 'b')
    c.row(7, range(46, 50), 'b')
    for x in (26, 40, 56):
        lamp(x)

    # ---- GELİŞTİR: arkadan gelen araçlar; çivili çukurların üstünden bir aracın tavanında geç
    yol(62, 116, 1, every=3.2, v=8, kinds=['dolmus', 'taksi', 'otobus'])
    c.row(FL - 1, range(80, 94), '^')
    c.put(87, 6, 'g')                            # altın 1: çukurların üstünde, tavandan zıplayınca
    c.row(7, range(81, 94, 3), 'b')
    for x in (70, 100, 112):
        lamp(x)

    # ---- TERS KÖŞE: dolmuş durakta bekler; tavanına bin, çukurların üstünden götürsün, sonraki durakta in
    c.put(118, FL - 1, 'Q')
    yol(116, 158, 1, every=5, v=6, kinds=['dolmus'], light={'x': 124, 'w': 1, 'per': 7, 'green': 3})
    c.row(FL - 1, range(128, 150), '^')
    c.row(8, range(130, 149, 3), 'b')
    for x in (122, 138, 154):
        lamp(x)

    # ---- kayıt noktası, minibüs durağı; gizli basamaklar (altın 2)
    c.put(160, FL - 1, 'Q')
    c.put(163, FL - 1, 'E')
    c.put(167, 6, 'b')
    c.put(167, 8, 'x'); c.put(168, 5, 'x')
    c.row(3, range(169, 175), '-')
    c.put(172, 2, 'g')                           # altın 2
    for x in (164, 176):
        lamp(x)

    # ---- SINA: karşıdan hızlı araçlar, çivili çukurlar, bug'lar
    yol(178, 199, -1, every=2.4, v=8, kinds=['taksi', 'otobus', 'dolmus'])
    c.row(FL - 1, (183, 184, 190, 191), '^')
    c.put(181, FL - 1, 'e')
    c.put(187, 5, 'g')                           # altın 3
    c.put(186, FL - 1, 'R')
    c.put(195, FL - 1, 'G')
    for x in (184, 194):
        lamp(x)
    c.rect(W - 1, 0, W - 1, Hm - 1, '=')

    rows = [r + room[y] for y, r in enumerate(c.rows())]
    return {'map': rows, 'room': W, 'objs': c.objs, 'dim': True}


# ---------------------------------------------------------------- 9-2
def bolum_9_2():
    W, Hm, FL = 200, 14, 12
    c = Canvas(W, Hm)
    c.rect(0, FL, W - 1, Hm - 1, '#')
    firca = lambda x0, x1, y0, **kw: c.obj('firca', x0=x0, x1=x1, y0=y0, y1=FL - 2, **kw)

    c.put(2, FL - 1, 'P')
    c.put(8, 8, 'K')
    c.put(15, FL - 1, 'e')

    # ---- TANIT: yıkama tüneli; fırça gidip gelir, değeni iter. yerdeki oluklara gir, fırça üstünden geçsin
    c.rect(21, 5, 39, 6, '=')
    firca(23, 36, 7, v=2.2)
    c.rect(27, FL, 28, FL, '.'); c.rect(33, FL, 34, FL, '.')
    c.row(9, range(26, 35, 2), 'b')

    # ---- GELİŞTİR: köpük topu baloncuk üfler; baloncuktan baloncuğa çık, market damına geç
    c.obj('kopuk', x=46, y=11, every=1.3, v=1.4, top=1)
    c.obj('kopuk', x=51, y=11, every=1.3, v=1.4, top=1, t0=0.65)
    c.rect(54, 4, 66, FL - 1, '=')
    c.row(3, range(55, 66, 2), 'b')
    c.put(48, 1, 'g')                            # altın 1: baloncukların tepesinde

    # ---- hatıra parçası
    c.put(70, FL - 1, 'Q')
    c.row(9, (73, 74), '-')
    c.row(6, range(76, 80), '-')
    c.put(78, 5, 'h')

    # ---- TERS KÖŞE: yağlama kanalının üstünde fırça; tepesine bin, karşıya taşısın. öbür yandaki bug'ları yıkar
    c.rect(86, FL, 99, Hm - 1, '.')
    firca(84, 98, 8, v=2.2)
    c.put(101, FL - 1, 'e'); c.put(103, FL - 1, 'e')
    c.row(5, range(87, 98, 2), 'b')

    # ---- kayıt noktası; gizli basamaklar (altın 2)
    c.put(108, FL - 1, 'Q')
    c.put(112, 6, 'b')
    c.put(112, 8, 'x'); c.put(113, 5, 'x')
    c.row(3, range(114, 120), '-')
    c.put(117, 2, 'g')                           # altın 2

    # ---- SINA: iki fırça, köpük, kanal; bug'lar
    c.put(124, FL - 1, 'Q')
    c.rect(127, 5, 142, 6, '=')
    firca(128, 140, 7, v=3)
    c.rect(133, FL, 134, FL, '.')
    c.put(138, FL - 1, 'e')
    c.rect(147, FL, 162, Hm - 1, '.')
    c.obj('kopuk', x=149, y=13, every=1.1, v=1.6, top=3)
    c.obj('kopuk', x=155, y=13, every=1.1, v=1.6, top=3, t0=0.55)
    firca(146, 161, 8, v=2.6)
    c.put(155, 3, 'g')                           # altın 3
    c.rect(164, 6, 170, FL - 1, '=')
    c.row(5, range(165, 170), 'b')
    stairs(c, 171, 1, FL)
    c.put(180, FL - 1, 'e')
    c.put(192, FL - 1, 'G')
    c.rect(W - 1, 0, W - 1, Hm - 1, '=')
    return {'map': c.rows(), 'objs': c.objs, 'blok': 'beton'}


# ---------------------------------------------------------------- 9-3
def bolum_9_3():
    W, Hm, FL = 200, 14, 12
    c = Canvas(W, Hm)
    c.rect(0, FL, W - 1, Hm - 1, '#')
    gap = lambda x0, x1: c.rect(x0, FL, x1, Hm - 1, '.')
    isik = lambda x, y, w=2, **kw: c.obj('isik', x0=x, x1=x + w - 1, y=y, **kw)

    def beacon(x, top, **kw):
        """kayalıkta işaret feneri: arkadaki kule ve tepesinde dönen ışık"""
        c.obj('fener', x=x + 1, y=top - 0.5, **kw)

    c.put(2, FL - 1, 'P')
    c.put(8, 8, 'K')
    c.put(14, FL - 1, 'e')

    # ---- TANIT: ışık düşen basamak belirir; ışık geçerken basamaktan basamağa
    gap(21, 37)
    isik(23, 10); isik(27, 9); isik(31, 10); isik(35, 9)
    beacon(40, 4, a0=2.35, a1=2.95, per=4.4)
    c.row(6, range(24, 36, 3), 'b')

    # ---- GELİŞTİR: uzun boşluk; ışık gidip gelirken basamaklar sırayla belirir
    gap(44, 71)
    for k, x in enumerate(range(46, 70, 4)):
        isik(x, 10 if k % 2 == 0 else 8)
    beacon(74, 3, a0=2.3, a1=2.98, per=5)
    c.put(58, 4, 'g')                            # altın 1: basamakların üstünde
    c.row(6, range(47, 70, 4), 'b')

    # ---- TERS KÖŞE: gölge basamakları ışık düşünce kaybolur, ışık basamakları belirir; ikisini sırayla kullan
    c.put(78, FL - 1, 'Q')
    gap(81, 104)
    for k, x in enumerate(range(83, 103, 4)):
        isik(x, 10 if k % 2 == 0 else 9, inv=(k % 2 == 1))
    beacon(107, 3, a0=2.3, a1=2.95, per=4.6)
    c.row(6, range(84, 103, 4), 'b')

    # ---- kayıt noktası; gizli basamaklar (altın 2)
    c.put(112, FL - 1, 'Q')
    c.put(116, 6, 'b')
    c.put(116, 8, 'x'); c.put(117, 5, 'x')
    c.row(3, range(118, 124), '-')
    c.put(121, 2, 'g')                           # altın 2

    # ---- SINA: iki fener, ışık ve gölge basamakları, bug
    gap(127, 166)
    for k, x in enumerate(range(129, 146, 4)):
        isik(x, 10 if k % 2 == 0 else 8, inv=(k == 2))
    c.rect(147, 8, 149, Hm - 1, '=')
    beacon(148, 3, a0=1.95, a1=2.9, per=4.8)
    c.put(148, 7, 'e')
    for k, x in enumerate(range(151, 166, 4)):
        isik(x, 9 if k % 2 == 0 else 10, inv=(k % 2 == 1))
    beacon(168, 3, a0=1.95, a1=2.85, per=4.2)
    c.put(140, 4, 'g')                           # altın 3
    c.put(173, FL - 1, 'Q')

    # ---- Sonsuz Döngü arenası: fenerin dibinde
    a = 181
    c.put(a, FL - 1, 'A')
    c.row(8, range(a + 6, a + 9), '-')
    c.row(8, range(a + 13, a + 16), '-')
    c.put(a + 11, FL - 2, 'B')
    c.put(a + 15, FL - 1, 'G')
    c.rect(a + 18, 0, a + 18, Hm - 1, '=')
    assert a + 18 == W - 1
    return {'map': c.rows(), 'objs': c.objs, 'blok': 'kaya'}


def build(sec, room=None):
    return [lambda: bolum_9_1(room), bolum_9_2, bolum_9_3][sec]()
