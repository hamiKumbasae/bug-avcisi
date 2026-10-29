"""Bug Avcısı: İstanbul — Yerebatan Sarnıcı'nın elle tasarlanmış üç bölümü (gece, yer altı).

  6-1 Sütunlar:    sandallar; içine her zıplayıp inişte baktığın yana itilir, su yavaşlatır. sütun diplerinde durur;
                   akıntı sürükler, çağlayana varan sandal batar
  6-2 Medusa:      Medusa başlarının bakışı (gözler açılıp kapanır): bakışa giren bug taşa döner, blok olur;
                   oyuncu bir an taş kesilir. taşa dönen bug bakışı da keser
  6-3 Karanlık Su: yaklaşınca yükselen su (bug'ları alır götürür), pompalar suyu indirir; suyla kalkan sal;
                   Bellek Sızıntısı
"""
from elle import Canvas


def stairs(c, x, n, base, ch='='):
    for i in range(n):
        c.rect(x + i, base - 1 - i, x + i, base - 1, ch)


def base_col(c, x, top, w=2):
    """sudan yükselen sütun dibi (katı) ve tavana uzanan gövdesi (arka plan)"""
    c.rect(x, top, x + w - 1, 13, '=')
    c.obj('sutun', x=x, y0=2, y1=top, w=w)


# ---------------------------------------------------------------- 6-1
def bolum_6_1(room):
    W, Hm, FL = 200, 14, 12
    c = Canvas(W, Hm)
    c.rect(0, 0, W - 1, 1, '=')
    c.rect(0, FL, W - 1, Hm - 1, '#')

    def pool(x0, x1):
        c.rect(x0, FL, x1, Hm - 1, '.')
        c.obj('su', x0=x0, x1=x1 + 1, y=12.25)

    def boat(x, x0, x1, **kw):
        c.obj('sandal', x=x, y=12, x0=x0, x1=x1, **kw)

    c.put(2, FL - 1, 'P')
    c.put(8, 8, 'K')
    c.put(16, FL - 1, 'e')
    for x in (12, 44):
        c.obj('sutun', x=x, y0=2, y1=12, w=2)

    # ---- TANIT: sandala atla; her inişte baktığın yana itilir
    pool(22, 39)
    boat(22, 22, 37)
    c.row(9, range(26, 37, 2), 'b')

    # ---- GELİŞTİR: sütun dipleri sandalı durdurur; dipten öbür sandala
    pool(46, 89)
    boat(46, 46, 56)
    base_col(c, 59, 10)
    boat(61, 61, 71)
    base_col(c, 74, 10)
    c.put(74, 9, 'e')
    boat(76, 76, 87)
    c.put(67, 5, 'g')                            # altın 1: suyun ortasında, sandaldan zıplayınca
    c.row(7, (52, 54, 64, 66, 80, 82), 'b')

    # ---- TERS KÖŞE: akıntı sandalı çağlayana sürükler; geriye bakıp zıplayarak fren yap, iskeleye çık
    pool(94, 124)
    c.obj('akinti', x0=94, x1=125, v=2.0)
    boat(94, 94, 121, sink=True)
    c.row(9, range(113, 118), '-')
    c.row(7, range(113, 118), 'b')
    c.obj('sutun', x=106, y0=2, y1=12, w=2)

    # ---- kayıt noktası; gizli basamaklarla tonozun altı (altın 2)
    c.put(128, FL - 1, 'Q')
    c.put(131, FL - 1, 'E')
    c.put(133, FL - 1, 'e')
    c.put(134, 6, 'b')
    c.put(134, 8, 'x'); c.put(135, 5, 'x')
    c.row(3, range(136, 142), '-')
    c.put(139, 2, 'g')                           # altın 2
    c.row(2, (137, 141), 'b')

    # ---- SINA: ters akıntı; sandallar geri kayar, durmadan zıpla. sütun diplerinde bug'lar
    c.put(144, FL - 1, 'Q')
    pool(147, 186)
    c.obj('akinti', x0=147, x1=187, v=-1.2)
    boat(147, 147, 157)
    base_col(c, 160, 10)
    c.put(160, 9, 'e')
    boat(162, 162, 170)
    base_col(c, 173, 9)
    c.put(173, 8, 'e')
    boat(175, 175, 184)
    c.put(176, 4, 'g')                           # altın 3: yüksek sütun dibinden zıplayınca
    c.row(7, range(149, 157, 2), 'b')
    c.row(7, range(164, 170, 2), 'b')
    c.put(188, FL - 1, 'R')
    stairs(c, 190, 3, FL)
    c.put(195, FL - 1, 'G')
    c.rect(W - 1, 0, W - 1, Hm - 1, '=')

    rows = [r + room[y] for y, r in enumerate(c.rows())]
    return {'map': rows, 'room': W, 'objs': c.objs, 'blok': 'sutun'}


# ---------------------------------------------------------------- 6-2
def bolum_6_2():
    W, Hm, FL = 200, 14, 12
    c = Canvas(W, Hm)
    c.rect(0, 0, W - 1, 1, '=')
    c.rect(0, FL, W - 1, Hm - 1, '#')

    c.put(2, FL - 1, 'P')
    c.put(8, 8, 'K')
    c.put(15, FL - 1, 'e')

    # ---- TANIT: yan yatmış Medusa başı; gözleri açıkken bakışı geçeni taş keser. bakışa giren bug taş olur
    c.obj('yuva', x=26, y=11, every=3.5, max=2, dir=1)
    base_col(c, 44, 9)
    c.obj('medusa', x=44, y=10, dir='l', len=12, w=2, per=4, open=2)
    c.row(6, range(34, 42, 2), 'b')

    # ---- GELİŞTİR: duvar boyunca kısa bakış; raftan düşen bug bakışta taşa döner, basamak olur, duvarı onunla aş
    c.row(8, range(66, 74), '-')
    c.obj('yuva', x=67, y=7, every=3, max=2, dir=1)
    c.rect(76, 7, 77, 11, '=')
    c.obj('sutun', x=76, y0=2, y1=7, w=2)
    c.obj('medusa', x=76, y=10, dir='l', len=3, w=2, per=3.6, open=2.2)
    c.put(77, 3, 'g')                            # altın 1: duvarın tepesinde
    c.row(5, (70, 72), 'b')

    # ---- TERS KÖŞE: uzun koridoru Medusa hep süzüyor; üstteki raftan düşen bug yüzünün önünde taş olunca
    # bakış kesilir
    c.put(92, FL - 1, 'Q')
    base_col(c, 125, 9)
    c.obj('medusa', x=125, y=10, dir='l', len=30, w=2, per=5, open=3.8)
    c.row(8, range(123, 128), '-')
    c.obj('yuva', x=126, y=7, every=3, max=1, dir=-1)
    c.row(5, range(100, 118, 3), 'b')

    # ---- hatıra parçası; kayıt noktası
    c.put(131, FL - 1, 'Q')
    c.row(9, (134, 135), '-')
    c.row(6, range(137, 141), '-')
    c.put(139, 5, 'h')

    # ---- SINA: baş aşağı Medusa çukurun üstünde (platformda taş kesilirsen taşınırsın, havada kesilirsen düşersin);
    # sonra kısa bakışlı duvar
    c.put(146, FL - 1, 'Q')
    c.rect(151, FL, 166, Hm - 1, '.')
    c.put(151, FL - 1, 'M')
    c.obj('medusa', x=158, y=1, dir='d', len=12, w=2, per=3.4, open=1.6)
    c.put(158, 6, 'g')                           # altın 3: bakışın tam yolunda
    c.row(4, (153, 155, 162, 164), 'b')
    c.row(8, range(176, 182), '-')
    c.obj('yuva', x=177, y=7, every=3, max=2, dir=1)
    c.rect(184, 7, 185, 11, '=')
    c.obj('sutun', x=184, y0=2, y1=7, w=2)
    c.obj('medusa', x=184, y=10, dir='l', len=3, w=2, per=3.6, open=2.2)
    c.put(194, FL - 1, 'G')
    c.rect(W - 1, 0, W - 1, Hm - 1, '=')

    # gizli: üstteki tonozda simit yolu (gizli basamaklar), altın 2
    c.put(108, 8, 'x'); c.put(109, 5, 'x')
    c.row(3, range(110, 116), '-')
    c.put(113, 2, 'g')                           # altın 2
    return {'map': c.rows(), 'objs': c.objs, 'blok': 'sutun'}


# ---------------------------------------------------------------- 6-3
def bolum_6_3():
    W, Hm, FL = 195, 14, 12
    c = Canvas(W, Hm)
    c.rect(0, 0, W - 1, 1, '=')
    c.rect(0, FL, W - 1, Hm - 1, '#')

    def basin(x0, x1, **kw):
        c.rect(x0, FL, x1, Hm - 1, '.')
        c.obj('taskin', x0=x0, x1=x1 + 1, y=12.6, **kw)

    def stone(x, top=11, w=2):
        c.rect(x, top, x + w - 1, Hm - 1, '=')

    c.put(2, FL - 1, 'P')
    c.put(8, 8, 'K')
    c.put(15, FL - 1, 'e')

    # ---- TANIT: havuza yaklaşınca su yükselir; taşlar batmadan geç. pompaya basınca su iner
    basin(22, 41, hi=8.4, rate=0.3, near=2)
    for x in (25, 30, 35):
        stone(x)
    c.row(8, range(25, 37, 2), 'b')
    c.obj('pompa', x=44, y=11, drop=4)

    # ---- GELİŞTİR: uzun havuz, su daha hızlı; ortadaki adacıktaki pompa suyu indirir. taşlardaki bug'ları su alır
    basin(52, 91, hi=8.0, rate=0.45, near=2)
    for x in (55, 61, 67, 77, 83, 88):
        stone(x)
    stone(71, 11, 3)
    c.obj('pompa', x=72, y=10, drop=4, uses=3)
    for x in (61, 83):
        c.put(x, 10, 'e')
    c.put(80, 6, 'g')                            # altın 1: havuzun üstünde
    c.row(8, (56, 62, 68, 78, 84), 'b')

    # ---- TERS KÖŞE: yüksek duvar; salda bekle, yükselen su seni duvarın tepesine taşır
    basin(98, 118, hi=4.6, rate=0.8, near=1)
    stone(100); stone(105); stone(110)
    c.obj('sal', x=115, y=12.4, w=3, off=0.2)
    c.rect(119, 4, 121, 11, '=')
    for y in range(5, 11):
        c.put(116, y, 'b')

    # ---- kayıt noktası; gizli basamaklar (altın 2)
    c.put(127, FL - 1, 'Q')
    c.put(131, 6, 'b')
    c.put(131, 8, 'x'); c.put(132, 5, 'x')
    c.row(3, range(133, 139), '-')
    c.put(136, 2, 'g')                           # altın 2

    # ---- SINA: hızlı yükselen su, seyrek taşlar, iki pompa; altın 3 suyun üstünde
    c.put(141, FL - 1, 'Q')
    basin(144, 167, hi=8.0, rate=0.6, near=2)
    for x in (147, 153, 163):
        stone(x)
    stone(157, 10, 2)
    c.obj('pompa', x=158, y=9, drop=5, uses=3)
    c.put(147, 10, 'e')
    c.put(161, 5, 'g')
    c.row(7, (148, 154, 164), 'b')
    c.put(171, FL - 1, 'Q')

    # ---- Bellek Sızıntısı arenası
    a = 176
    c.put(a, FL - 1, 'A')
    c.row(8, range(a + 6, a + 9), '-')
    c.row(8, range(a + 13, a + 16), '-')
    c.put(a + 11, FL - 2, 'B')
    c.put(a + 15, FL - 1, 'G')
    c.rect(a + 18, 0, a + 18, Hm - 1, '=')
    assert a + 18 == W - 1
    return {'map': c.rows(), 'objs': c.objs, 'blok': 'sutun'}


def build(sec, room=None):
    return [lambda: bolum_6_1(room), bolum_6_2, bolum_6_3][sec]()
