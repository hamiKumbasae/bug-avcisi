"""Bug Avcısı: İstanbul — Boğaz Köprüsü'nün elle tasarlanmış üç bölümü (gece).

  7-1 Ayak:     belli aralıkla esen yan rüzgâr (havadakini tam, yerdekini az iter); arkadan esince uzun atlayış,
                önden esince kısalır; sert rüzgârda kirişlerin altına sığın
  7-2 Halatlar: halat makaraları: binince yokuş aşağı kayar, uçtaki tampon üstündekini fırlatır; kayarken zıplayınca
                hız sürer
  7-3 Tepe:     sarkaç gibi sallanan bakım sepetleri; rüzgârsız durgun duranlar rüzgârla sallanır; DDoS Bulutu
"""
from elle import Canvas


def stairs(c, x, n, base, ch='='):
    for i in range(n):
        c.rect(x + i, base - 1 - i, x + i, base - 1, ch)


def stairs_down(c, x, n, top, base, ch='='):
    for i in range(n):
        c.rect(x + i, top + 1 + i, x + i, base - 1, ch)


# ---------------------------------------------------------------- 7-1
def bolum_7_1():
    W, Hm, FL = 196, 14, 12
    c = Canvas(W, Hm)
    c.rect(0, FL, W - 1, Hm - 1, '#')
    gap = lambda x0, x1: c.rect(x0, FL, x1, Hm - 1, '.')

    c.put(2, FL - 1, 'P')
    c.put(8, 8, 'K')
    c.put(14, FL - 1, 'e')

    # ---- TANIT: boşluk tek atlayışa uzun; arkadan rüzgâr esince atla
    gap(24, 32)
    c.obj('ruzgar', x0=17, x1=40, v=5, per=4, on=2.2)
    c.row(7, range(26, 32, 2), 'b')

    # ---- GELİŞTİR: kiriş uçları arasında; önden esen rüzgâr atlayışı kısaltır, dinmesini bekle
    gap(46, 77)
    for x in (48, 54, 60, 66, 72):
        c.rect(x, 10, x + 1, Hm - 1, '=')
    c.obj('ruzgar', x0=42, x1=80, v=-4.5, per=3.4, on=1.5)
    c.row(7, (49, 55, 61, 67, 73), 'b')
    c.put(63, 4, 'g')                            # altın 1: kirişlerin üstünde, rüzgâr yokken yüksek atlayışla
    c.put(82, FL - 1, 'e')

    # ---- TERS KÖŞE: sert rüzgâr seni geri savurur; kirişlerin altına sığın, dinince koş. ince yürüme yolunda boşluklar
    c.put(86, FL - 1, 'Q')
    gap(90, 125)
    c.row(10, [x for x in range(90, 126) if x not in (97, 98, 106, 107, 115, 116)], '-')
    for x in (95, 104, 113, 122):
        c.rect(x, 5, x + 1, 7, '=')
    c.obj('ruzgar', x0=88, x1=127, v=-9, per=3.4, on=1.3)
    c.row(8, (97, 98, 106, 107, 115, 116), 'b')

    # ---- kayıt noktası; gizli basamaklar köprü ayağının kirişine (altın 2)
    c.put(130, FL - 1, 'Q')
    c.put(134, FL - 1, 'e')
    c.put(136, 6, 'b')
    c.put(136, 8, 'x'); c.put(137, 5, 'x')
    c.row(3, range(138, 144), '-')
    c.put(141, 2, 'g')                           # altın 2

    # ---- SINA: iki uzun boşluk; arkadan rüzgâr, sonra önden; arada kirişli yürüme yolu
    c.put(148, FL - 1, 'Q')
    gap(152, 160)
    c.obj('ruzgar', x0=146, x1=164, v=5, per=3.6, on=1.8)
    c.put(157, 5, 'g')                           # altın 3: rüzgârla uzun atlayışın tepesinde
    gap(168, 181)
    c.row(10, [x for x in range(168, 182) if x not in (172, 173, 177, 178)], '-')
    for x in (170, 175, 180):
        c.rect(x, 5, x + 1, 7, '=')
    c.obj('ruzgar', x0=165, x1=184, v=-8, per=3, on=1.2, ph=0.5)
    c.put(166, FL - 1, 'e')
    stairs(c, 185, 3, FL)
    c.put(191, FL - 1, 'G')
    c.rect(W - 1, 0, W - 1, Hm - 1, '=')
    return {'map': c.rows(), 'objs': c.objs, 'blok': 'celik'}


# ---------------------------------------------------------------- 7-2
def bolum_7_2():
    W, Hm, FL = 205, 14, 12
    c = Canvas(W, Hm)
    c.rect(0, FL, W - 1, Hm - 1, '#')
    gap = lambda x0, x1: c.rect(x0, FL, x1, Hm - 1, '.')
    makara = lambda x0, y0, x1, y1, **kw: c.obj('makara', x0=x0, y0=y0, x1=x1, y1=y1, **kw)

    c.put(2, FL - 1, 'P')
    c.put(8, 8, 'K')
    c.put(13, FL - 1, 'e')

    # ---- TANIT: kule kirişinden makaraya bin; halat boyunca kayar, uçta fırlatır
    stairs(c, 16, 4, FL)
    c.rect(20, 8, 23, FL - 1, '=')
    gap(24, 44)
    makara(25, 8, 43, 9)
    c.row(6, range(28, 42, 3), 'b')

    # ---- GELİŞTİR: makaradan makaraya; uçtaki tampon seni öbür makaraya atar. kayarken zıplarsan hızın sürer
    c.rect(45, 9, 51, FL - 1, '=')
    gap(52, 86)
    makara(53, 9, 66, 10)
    makara(69, 10, 84, 11)
    c.put(69, 9, 'e')
    c.put(77, 6, 'g')                            # altın 1: ikinci halatın üstünde, kayarken zıplayınca
    c.row(6, range(56, 66, 3), 'b')

    # ---- hatıra parçası: kule ayağında
    c.put(90, FL - 1, 'Q')
    c.row(9, (94, 95), '-')
    c.row(6, range(97, 101), '-')
    c.put(99, 5, 'h')

    # ---- TERS KÖŞE: dik kısa halat; uçtaki tampon seni yukarı fırlatır, yüksek kirişe çık
    c.rect(104, 9, 106, FL - 1, '=')
    gap(107, 126)
    makara(108, 9, 116, 11, fling=22)
    c.rect(121, 3, 128, 4, '=')
    c.row(2, range(122, 128, 2), 'b')
    stairs_down(c, 129, 4, 4, FL)

    # ---- kayıt noktası; gizli basamaklar (altın 2)
    c.put(135, FL - 1, 'Q')
    c.put(139, 6, 'b')
    c.put(139, 8, 'x'); c.put(140, 5, 'x')
    c.row(3, range(141, 147), '-')
    c.put(144, 2, 'g')                           # altın 2

    # ---- SINA: uzun halat zinciri, bug'lar; rüzgâr
    c.put(149, FL - 1, 'Q')
    c.rect(151, 8, 154, FL - 1, '=')
    gap(155, 192)
    makara(156, 8, 170, 10)
    c.rect(172, 10, 174, 10, '=')
    c.put(173, 9, 'e')
    makara(177, 9, 190, 11)
    c.obj('ruzgar', x0=150, x1=195, v=3, per=4, on=1.6)
    c.put(183, 6, 'g')                           # altın 3
    c.row(4, range(159, 170, 3), 'b')
    c.put(199, FL - 1, 'G')
    c.rect(W - 1, 0, W - 1, Hm - 1, '=')
    return {'map': c.rows(), 'objs': c.objs, 'blok': 'celik'}


# ---------------------------------------------------------------- 7-3
def bolum_7_3():
    W, Hm, FL = 197, 14, 12
    c = Canvas(W, Hm)
    c.rect(0, FL, W - 1, Hm - 1, '#')
    gap = lambda x0, x1: c.rect(x0, FL, x1, Hm - 1, '.')
    sepet = lambda x, **kw: c.obj('sepet', x=x, y=kw.pop('y', 2), **kw)

    c.put(2, FL - 1, 'P')
    c.put(8, 8, 'K')
    c.put(14, FL - 1, 'e')

    # ---- TANIT: sallanan bakım sepeti; boşluğun ortasına gelince bin, öbür uca gelince in
    gap(22, 36)
    sepet(29, len=8, amp=0.55, per=3.2)
    c.row(6, range(26, 33, 2), 'b')

    # ---- GELİŞTİR: iki sepet, ters zamanlı
    gap(42, 70)
    sepet(49, len=8, amp=0.6, per=3.4)
    sepet(62, len=8, amp=0.6, per=3.4, ph=0.5)
    c.rect(55, 10, 56, Hm - 1, '=')
    c.put(55, 4, 'g')                            # altın 1: iki sepetin arasında yüksekte
    c.row(7, (47, 51, 60, 64), 'b')

    # ---- TERS KÖŞE: rüzgârsız sepet sallanmaz; rüzgâr esince sallanır, ancak o zaman karşıya ulaşır
    c.put(74, FL - 1, 'Q')
    gap(78, 95)
    sepet(86, len=8, amp=0.75, per=3, wind=True)
    c.obj('ruzgar', x0=76, x1=97, v=3, per=5, on=3)
    c.row(5, range(82, 92, 3), 'b')

    # ---- kayıt noktası; gizli basamaklar (altın 2)
    c.put(100, FL - 1, 'Q')
    c.put(104, FL - 1, 'e')
    c.put(106, 6, 'b')
    c.put(106, 8, 'x'); c.put(107, 5, 'x')
    c.row(3, range(108, 114), '-')
    c.put(111, 2, 'g')                           # altın 2

    # ---- SINA: sepet zinciri, rüzgâr, bug'lar
    c.put(118, FL - 1, 'Q')
    gap(122, 166)
    sepet(129, len=8.5, amp=0.74, per=3.4)
    c.rect(136, 9, 137, Hm - 1, '=')
    c.put(136, 8, 'e')
    sepet(144, len=7, amp=0.7, per=3, wind=True)
    c.obj('ruzgar', x0=138, x1=168, v=-3, per=4.4, on=2.6)
    sepet(158, len=8, amp=0.6, per=3.2, ph=0.3)
    c.put(151, 4, 'g')                           # altın 3
    c.put(171, FL - 1, 'Q')

    # ---- DDoS Bulutu arenası: köprünün tepesinde
    a = 178
    c.put(a, FL - 1, 'A')
    c.row(8, range(a + 6, a + 9), '-')
    c.row(8, range(a + 13, a + 16), '-')
    c.put(a + 11, FL - 2, 'B')
    c.put(a + 15, FL - 1, 'G')
    c.rect(a + 18, 0, a + 18, Hm - 1, '=')
    assert a + 18 == W - 1
    return {'map': c.rows(), 'objs': c.objs, 'blok': 'celik'}


def build(sec, room=None):
    return [bolum_7_1, bolum_7_2, bolum_7_3][sec]()
