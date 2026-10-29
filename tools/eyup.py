"""Bug Avcısı: İstanbul — Eyüp'ün elle tasarlanmış üç bölümü (gece yarısı, oyunun sakin dünyası).

  8-1 Balat Yokuşu: evlerin arasına gerili çamaşır ipleri; üstüne düşeni sektirir (ne kadar yüksekten, o kadar yükseğe)
  8-2 Teleferik:    istasyondan istasyona giden teleferik kabinleri; direklerin kolundan zıplayarak kurtul
  8-3 Tepe:         sessiz tepe: düşman, süre, DEPLOY yok; yavaş bir yürüyüş, birkaç sürpriz, tepede bank
"""
from elle import Canvas


def stairs(c, x, n, base, ch='='):
    for i in range(n):
        c.rect(x + i, base - 1 - i, x + i, base - 1, ch)


def stairs_down(c, x, n, top, base, ch='='):
    for i in range(n):
        c.rect(x + i, top + 1 + i, x + i, base - 1, ch)


def house(c, x0, x1, top, base=12):
    c.rect(x0, top, x1, base - 1, '=')


# ---------------------------------------------------------------- 8-1
def bolum_8_1():
    W, Hm, FL = 192, 14, 12
    c = Canvas(W, Hm)
    c.rect(0, FL, W - 1, Hm - 1, '#')
    ip = lambda x0, x1, y: c.obj('ip', x0=x0, x1=x1, y=y)

    c.put(2, FL - 1, 'P')
    c.put(8, 8, 'K')

    # ---- TANIT: evin önünde çamaşır ipi; zıplayıp ipe düş, yükseğe sek, damın üstüne çık
    ip(19, 25, 9)
    house(c, 28, 36, 5)
    c.row(4, range(29, 36, 2), 'b')
    c.put(18, FL - 1, 'e')

    # ---- GELİŞTİR: dar sokağın iki yanındaki evler arasında ipler; ipten ipe sekerek yüksel
    stairs_down(c, 37, 3, 5, FL)
    ip(43, 48, 10)
    ip(51, 56, 8)
    ip(59, 64, 6)
    house(c, 67, 75, 4)
    c.put(61, 1, 'g')                            # altın 1: en yüksek ipin üstünde
    c.row(3, range(68, 75, 2), 'b')
    stairs_down(c, 76, 7, 4, FL)

    # ---- TERS KÖŞE: balkonların altında ipler; sekip balkon altındaki kutulara alttan vur
    c.put(86, FL - 1, 'Q')
    for k, x in enumerate((92, 99, 106)):
        ip(x, x + 4, 10)
        c.text(x, 5, 'UKU' if k == 1 else 'UUU')
    c.row(4, range(91, 112), '=')
    c.put(97, FL - 1, 'e')

    # ---- kayıt noktası; gizli basamaklarla bacaların arasına (altın 2)
    c.put(116, FL - 1, 'Q')
    c.put(120, 6, 'b')
    c.put(120, 8, 'x'); c.put(121, 5, 'x')
    c.row(3, range(122, 128), '-')
    c.put(125, 2, 'g')                           # altın 2

    # ---- SINA: yokuşun tepesine çıkan ip merdiveni; arada bug'lar; ipten ipe, damdan dama
    c.put(132, FL - 1, 'Q')
    ip(136, 140, 10)
    house(c, 143, 147, 7)
    c.put(145, 6, 'e')
    ip(150, 154, 9)
    ip(157, 161, 7)
    house(c, 164, 170, 4)
    c.put(159, 1, 'g')                           # altın 3
    c.row(5, range(151, 160, 2), 'b')
    stairs_down(c, 171, 7, 4, FL)
    c.put(184, FL - 1, 'G')
    c.rect(W - 1, 0, W - 1, Hm - 1, '=')
    return {'map': c.rows(), 'objs': c.objs, 'blok': 'ev'}


# ---------------------------------------------------------------- 8-2
def pylon(c, x, arm):
    """teleferik direği: kolu kabin tavanının iki üstünde (ayakta duranı düşürür)"""
    c.rect(x, arm, x + 1, arm, '=')
    c.obj('direk', x=x, y=arm)


def bolum_8_2():
    W, Hm, FL = 200, 14, 12
    c = Canvas(W, Hm)
    c.rect(0, FL, W - 1, Hm - 1, '#')
    gap = lambda x0, x1: c.rect(x0, FL, x1, Hm - 1, '.')
    hat = lambda x0, y0, x1, y1, **kw: c.obj('teleferik', x0=x0, y0=y0, x1=x1, y1=y1, **kw)

    c.put(2, FL - 1, 'P')
    c.put(8, 8, 'K')
    c.put(13, FL - 1, 'e')

    # ---- TANIT: alt istasyondan kabinin tavanına bin, yukarı istasyona in
    gap(22, 43)
    hat(19, 12, 45, 5, n=3, v=2.2)
    c.rect(44, 5, 52, FL - 1, '=')
    c.row(3, range(30, 42, 3), 'b')

    # ---- GELİŞTİR: inen hat, sonra çıkan hat
    gap(53, 91)
    hat(51, 5, 72, 10, n=3, v=2.4)
    c.rect(72, 10, 75, FL - 1, '=')
    hat(74, 10, 93, 4, n=3, v=2.4, s0=1)
    c.rect(92, 4, 98, FL - 1, '=')
    c.put(83, 2, 'g')                            # altın 1: çıkan hattın üstünde
    c.row(6, range(57, 70, 3), 'b')

    # ---- hatıra parçası: yukarı istasyonda
    c.row(1, range(94, 97), 'b')
    c.put(97, 3, 'h')
    stairs_down(c, 99, 8, 4, FL)

    # ---- TERS KÖŞE: hattın ortasındaki direğin kolu tavandakini düşürür; koldan zıpla
    c.put(110, FL - 1, 'Q')
    gap(114, 141)
    hat(112, 12, 143, 6, n=3, v=2.2)
    pylon(c, 127, 7)
    c.rect(142, 6, 148, FL - 1, '=')
    c.row(4, range(118, 126, 2), 'b')
    stairs_down(c, 149, 6, 6, FL)

    # ---- kayıt noktası; gizli basamaklar (altın 2)
    c.put(158, FL - 1, 'Q')
    c.put(161, 6, 'b')
    c.put(161, 8, 'x'); c.put(162, 5, 'x')
    c.row(3, range(163, 168), '-')
    c.put(166, 2, 'g')                           # altın 2

    # ---- SINA: uzun hat, iki direk; tavanda bug
    gap(173, 192)
    hat(171, 12, 194, 7, n=2, v=2.4)
    pylon(c, 178, 8)
    pylon(c, 186, 6)
    c.put(182, 3, 'g')                           # altın 3
    c.rect(193, 7, 194, FL - 1, '=')
    c.put(196, FL - 1, 'G')
    c.rect(W - 1, 0, W - 1, Hm - 1, '=')
    return {'map': c.rows(), 'objs': c.objs, 'blok': 'celik'}


# ---------------------------------------------------------------- 8-3
def bolum_8_3():
    """Sessiz tepe: düşman, süre, kayıt noktası ve DEPLOY yok; tepedeki bankta biter.
    Yol yürüyerek ve küçük zıplamalarla çıkılır; altınlar yolun kenarındaki küçük sürprizlerde."""
    W, Hm, FL = 112, 14, 12
    c = Canvas(W, Hm)
    c.rect(0, FL, W - 1, Hm - 1, '#')

    c.put(2, FL - 1, 'P')
    c.row(9, (10, 12), 'b')
    stairs(c, 16, 2, FL)
    c.rect(18, 10, 30, FL - 1, '=')
    c.row(7, (22, 24, 26), 'b')
    # çukurun üstüne gerili çamaşır ipi: üstünden yürünür; zıplayıp düşersen seker, yukarıda altın
    c.rect(34, FL, 38, Hm - 1, '.')
    c.obj('ip', x0=34, x1=39, y=12)
    c.put(36, 4, 'g')                            # altın 1: ipin yukarısında
    stairs(c, 45, 2, FL)
    c.rect(47, 10, 58, FL - 1, '=')
    c.put(52, 6, 'K')
    c.put(52, 2, 'g')                            # altın 2: kutunun üstünde
    stairs(c, 59, 3, FL)
    c.rect(62, 9, 74, FL - 1, '=')
    c.put(68, 5, 'x')
    c.put(68, 2, 'g')                            # altın 3: gizli bloğun üstünde
    stairs(c, 75, 2, FL)
    c.rect(77, 8, 104, FL - 1, '=')
    c.row(5, (80, 82, 84), 'b')
    c.put(96, 7, 'W')
    c.rect(W - 1, 0, W - 1, Hm - 1, '=')
    return {'map': c.rows(), 'objs': c.objs, 'blok': 'tas'}


def build(sec, room=None):
    return [bolum_8_1, bolum_8_2, bolum_8_3][sec]()
