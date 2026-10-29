"""Bug Avcısı: İstanbul — Çamlıca'nın elle tasarlanmış üç bölümü (şafaktan önce, kule).

  11-1 Tepe Yolu:   sisli tepe; cam teraslar neredeyse görünmez, üstünden sis geçerken çiy tutup belirir
  11-2 Asansör:     kulenin dolap asansörleri: kabinler durmadan döner (bir sütunda çıkar, öbüründe iner, tepede yana geçer)
  11-3 Yayın Odası: vericilerden yayılan dalga halkaları değeni dışarı doğru fırlatır (bug'ları devirir); Mavi Ekran
"""
from elle import Canvas


def stairs(c, x, n, base, ch='='):
    for i in range(n):
        c.rect(x + i, base - 1 - i, x + i, base - 1, ch)


def stairs_down(c, x, n, top, base, ch='='):
    for i in range(n):
        c.rect(x + i, top + 1 + i, x + i, base - 1, ch)


# ---------------------------------------------------------------- 11-1
def bolum_11_1(room):
    W, Hm, FL = 200, 14, 12
    c = Canvas(W, Hm)
    c.rect(0, FL, W - 1, Hm - 1, '#')
    gap = lambda x0, x1: c.rect(x0, FL, x1, Hm - 1, '.')
    cam = lambda x0, x1, y: c.obj('cam', x0=x0, x1=x1, y=y)
    sis = lambda x0, x1, **kw: c.obj('sis', x0=x0, x1=x1, **kw)

    c.put(2, FL - 1, 'P')
    c.put(8, 8, 'K')
    c.put(14, FL - 1, 'e')

    # ---- TANIT: uçurumun üstünde cam köprü; görünmez ama sağlam. sis geçince belirir
    gap(22, 35)
    cam(22, 35, FL)
    sis(14, 34, w=10, per=7)
    c.row(9, range(24, 35, 3), 'b')

    # ---- GELİŞTİR: havada cam basamaklar; simitler yolu gösterir, sis gelince basamaklar da görünür
    gap(40, 66)
    cam(42, 43, 10); cam(46, 47, 8); cam(50, 51, 6); cam(54, 56, 6); cam(59, 60, 8); cam(63, 64, 10)
    sis(36, 62, w=12, per=8, ph=0.3)
    for x, y in ((42, 8), (46, 6), (50, 4), (59, 6), (63, 8)):
        c.put(x, y, 'b')
    c.put(55, 2, 'g')                            # altın 1: en yüksek camın üstünde

    # ---- TERS KÖŞE: uzun cam labirent; sis yavaşça ilerler, peşinden yürü
    c.put(70, FL - 1, 'Q')
    gap(74, 104)
    cam(74, 78, 11); cam(79, 79, 10); cam(80, 84, 9); cam(85, 85, 10); cam(86, 90, 11); cam(91, 91, 10); cam(92, 96, 9)
    cam(97, 97, 10); cam(98, 104, 11)
    sis(70, 100, w=9, per=16)
    c.put(88, FL - 2, 'e')
    c.row(7, range(76, 104, 4), 'b')

    # ---- kayıt noktası, taksi durağı; gizli basamaklar (altın 2)
    c.put(108, FL - 1, 'Q')
    c.put(111, FL - 1, 'E')
    c.put(116, 6, 'b')
    c.put(116, 8, 'x'); c.put(117, 5, 'x')
    c.row(3, range(118, 124), '-')
    c.put(121, 2, 'g')                           # altın 2

    # ---- SINA: cam basamaklar, sis, bug'lar
    c.put(128, FL - 1, 'Q')
    gap(132, 172)
    cam(133, 135, 11); cam(138, 139, 9); cam(142, 144, 7); cam(147, 148, 9)
    c.rect(151, 9, 152, Hm - 1, '=')
    c.put(151, 8, 'e')
    cam(155, 156, 10); cam(159, 160, 8); cam(163, 165, 8); cam(168, 170, 10)
    sis(126, 150, w=10, per=6)
    sis(146, 172, w=10, per=6.6, ph=0.5)
    c.put(143, 3, 'g')                           # altın 3
    c.row(5, (134, 138, 156, 160, 164), 'b')
    c.put(178, FL - 1, 'R')
    stairs(c, 184, 3, FL)
    c.put(194, FL - 1, 'G')
    c.rect(W - 1, 0, W - 1, Hm - 1, '=')

    rows = [r + room[y] for y, r in enumerate(c.rows())]
    return {'map': rows, 'room': W, 'objs': c.objs, 'blok': 'kaya'}


# ---------------------------------------------------------------- 11-2
def bolum_11_2():
    W, Hm, FL = 200, 14, 12
    c = Canvas(W, Hm)
    c.rect(0, 0, W - 1, 1, '=')
    c.rect(0, FL, W - 1, Hm - 1, '#')
    dolap = lambda x, **kw: c.obj('dolap', x=x, top=kw.pop('top', 4), bot=kw.pop('bot', 11), **kw)

    c.put(2, FL - 1, 'P')
    c.put(8, 8, 'K')
    c.put(14, FL - 1, 'e')

    # ---- TANIT: dolap asansör; sol sütunda yukarı çıkan kabine bin, tepede duvarın üstüne in
    dolap(20, gap=4, n=4, v=1.8)
    c.rect(26, 4, 34, FL - 1, '=')
    c.row(3, range(27, 34, 2), 'b')
    stairs_down(c, 35, 7, 4, FL)

    # ---- GELİŞTİR: iki duvar, iki asansör; birinin inen sütunundan öbürünün çıkan sütununa
    dolap(46, gap=4, n=4, v=1.8)
    c.rect(52, 4, 56, FL - 1, '=')
    dolap(58, gap=4, n=4, v=2)
    c.rect(64, 4, 70, FL - 1, '=')
    c.put(54, 2, 'g')                            # altın 1: ilk duvarın üstünde
    c.row(3, range(65, 70, 2), 'b')
    stairs_down(c, 71, 7, 4, FL)

    # ---- hatıra parçası
    c.put(82, FL - 1, 'Q')
    c.row(9, (85, 86), '-')
    c.row(6, range(88, 92), '-')
    c.put(90, 5, 'h')

    # ---- TERS KÖŞE: dikenli kuyu; asansörün tepede yana geçen kabini seni karşıya taşır
    c.row(FL - 1, range(98, 110), '^')
    dolap(97, gap=12, n=6, v=2.2, top=6, bot=10)
    c.row(4, range(99, 109, 3), 'b')

    # ---- kayıt noktası; gizli basamaklar (altın 2)
    c.put(114, FL - 1, 'Q')
    c.put(118, 6, 'b')
    c.put(118, 8, 'x'); c.put(119, 5, 'x')
    c.row(3, range(120, 126), '-')
    c.put(123, 2, 'g')                           # altın 2

    # ---- SINA: asansörler, dikenler, bug'lar
    c.put(130, FL - 1, 'Q')
    dolap(134, gap=5, n=5, v=2.2)
    c.rect(141, 4, 144, FL - 1, '=')
    c.put(143, 3, 'e')
    c.row(FL - 1, range(146, 158), '^')
    dolap(145, gap=13, n=7, v=2.4, top=5, bot=10)
    c.put(152, 2, 'g')                           # altın 3: dikenlerin üstünde, kabinden zıplayınca
    c.rect(160, 5, 166, FL - 1, '=')
    stairs_down(c, 167, 7, 5, FL)
    c.put(180, FL - 1, 'e')
    c.put(192, FL - 1, 'G')
    c.rect(W - 1, 0, W - 1, Hm - 1, '=')
    return {'map': c.rows(), 'objs': c.objs, 'blok': 'beton'}


# ---------------------------------------------------------------- 11-3
def bolum_11_3():
    W, Hm, FL = 200, 14, 12
    c = Canvas(W, Hm)
    c.rect(0, 0, W - 1, 1, '=')
    c.rect(0, FL, W - 1, Hm - 1, '#')
    gap = lambda x0, x1: c.rect(x0, FL, x1, Hm - 1, '.')
    verici = lambda x, y=12.0, **kw: c.obj('verici', x=x, y=y, **kw)

    c.put(2, FL - 1, 'P')
    c.put(8, 8, 'K')
    c.put(14, FL - 1, 'e')

    # ---- TANIT: vericinin dalgası yanındakini yukarı fırlatır; yüksek rafa onunla çık
    verici(24.5, per=2.6)
    c.rect(28, 5, 34, FL - 1, '=')
    c.row(4, range(29, 34, 2), 'b')
    stairs_down(c, 35, 6, 5, FL)

    # ---- GELİŞTİR: çukurun kıyısındaki vericiler seni karşıya savurur
    gap(46, 62)
    verici(44.5, per=2.4, force=16)
    c.rect(53, 8, 54, Hm - 1, '=')
    verici(53.5, y=8.0, per=2.4, ph=0.5, force=15)
    c.put(57, 3, 'g')                            # altın 1
    c.row(6, range(47, 62, 3), 'b')

    # ---- TERS KÖŞE: raftaki bug sürüsü; alttaki vericinin dalgası hepsini devirir
    c.put(64, FL - 1, 'Q')
    stairs(c, 68, 4, FL)
    c.rect(72, 8, 86, 8, '=')
    c.row(FL - 1, range(72, 87), '^')
    for x in (74, 77, 80, 83):
        c.put(x, 7, 'e')
    verici(79.5, y=10.5, per=3, max=6)

    # ---- kayıt noktası; gizli basamaklar (altın 2)
    c.put(100, FL - 1, 'Q')
    c.put(104, 6, 'b')
    c.put(104, 8, 'x'); c.put(105, 5, 'x')
    c.row(3, range(106, 112), '-')
    c.put(109, 2, 'g')                           # altın 2

    # ---- SINA: vericiler, çukurlar, bug'lar
    c.put(116, FL - 1, 'Q')
    gap(121, 129)
    verici(118.5, per=2.4, force=16)
    verici(133.5, per=2.6, ph=0.3)
    c.rect(137, 6, 140, FL - 1, '=')
    gap(146, 154)
    verici(143.5, per=2.4, force=16, ph=0.6)
    c.put(150, 3, 'g')                           # altın 3
    c.put(165, FL - 1, 'e')
    c.put(173, FL - 1, 'Q')

    # ---- Mavi Ekran arenası
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
    return [lambda: bolum_11_1(room), bolum_11_2, bolum_11_3][sec]()
