"""Bug Avcısı: İstanbul — Ataşehir'in elle tasarlanmış üç bölümü (gece).

  5-1 Finans Merkezi: belli aralıkla yanıp sönen borsa panoları (yanıkken basılır, sönmeden önce kırmızı titrer);
                      inip kalkan canlı borsa grafiğinin çubukları
  5-2 Veri Merkezi:   güvenlik lazerleri (değince alarm: kapılar iner, menfezden bug düşer); inen kapı altındakini
                      ezer; yangın kapakları yalnız alarmda kapanır (bilerek alarm çaldırmak)
  5-3 Kontrol Odası:  şalterler (üstüne basınca kolu iner): elektrik gelince ızgaralar çarpar, raylı platformlar gider;
                      Fidye Yazılımı
"""
from elle import Canvas


def stairs(c, x, n, base, ch='='):
    for i in range(n):
        c.rect(x + i, base - 1 - i, x + i, base - 1, ch)


def stairs_down(c, x, n, top, base, ch='='):
    for i in range(n):
        c.rect(x + i, top + 1 + i, x + i, base - 1, ch)


# ---------------------------------------------------------------- 5-1
def bolum_5_1(room):
    W, Hm, FL = 202, 14, 12
    c = Canvas(W, Hm)
    c.rect(0, FL, W - 1, Hm - 1, '#')
    pit = lambda x0, x1: c.rect(x0, FL, x1, Hm - 1, '.')
    pano = lambda x0, y, **kw: c.obj('pano', x0=x0, x1=x0 + kw.pop('w', 3) - 1, y=y, **kw)

    c.put(2, FL - 1, 'P')
    c.put(8, 8, 'K')
    c.put(16, FL - 1, 'e')

    # ---- TANIT: pano yanınca basamak olur; kulenin önündeki duvarın üstüne yalnız onunla çıkılır.
    # üstündeki bug pano sönünce düşer
    pano(26, 9, per=3.4, on=2.2, sym=1)
    c.put(27, 8, 'e')
    c.rect(33, 6, 36, FL - 1, '=')
    c.row(7, range(26, 29), 'b')
    c.row(5, range(33, 37), 'b')

    # ---- GELİŞTİR: çukurun üstünde iki ritimle yanan panolar; biri sönerken öbürü yanar
    pit(43, 71)
    for k, x in enumerate(range(44, 69, 5)):
        pano(x, 10 if k % 2 == 0 else 9, per=3.0, on=1.8, ph=0 if k % 2 == 0 else 0.5, sym=k % 3)
    c.row(6, range(49, 66, 5), 'b')
    c.put(76, FL - 1, 's')

    # ---- TERS KÖŞE: canlı grafik; çubuklar dalga gibi inip kalkar. tepeden altın
    pit(80, 99)
    c.obj('grafik', x=81, y=11, amp=5, n=8, per=4, lag=0.09)
    c.put(90, 2, 'g')                            # altın 1: grafiğin tepesinde zıplayınca
    c.row(4, range(83, 97, 3), 'b')

    # ---- plaza: kayıt noktası, minibüs durağı, gizli basamaklarla kulenin saçağı (altın 2)
    c.put(104, FL - 1, 'Q')
    c.put(108, FL - 1, 'E')
    c.text(113, 8, 'CKC')
    c.put(118, FL - 1, 'v')
    c.put(122, 6, 'b')
    c.put(122, 8, 'x'); c.put(123, 5, 'x')
    c.row(3, range(124, 130), '-')
    c.put(127, 2, 'g')                           # altın 2
    c.row(2, (125, 129), 'b')
    c.put(132, FL - 1, 'e')

    # ---- SINA: yükseliş rallisi; panolar soldan sağa sırayla yanar, dalgayla birlikte koş. ortada sütun
    c.put(137, FL - 1, 'Q')
    pit(141, 177)
    xs = [142, 145, 148, 151, 154, 160, 163, 166, 169, 172]
    for k, x in enumerate(xs):
        pano(x, 10 if k % 2 == 0 else 9, w=2, per=3.2, on=1.5, ph=-k * 0.16, sym=k % 3)
    c.rect(157, 9, 158, Hm - 1, '=')             # dinlenme sütunu
    c.put(158, 8, 'e')
    c.put(165, 4, 'g')                           # altın 3: rallinin ortasında yüksekte
    c.row(6, (143, 149, 155, 167, 173), 'b')
    c.put(181, FL - 1, 'R')
    stairs(c, 186, 4, FL)
    c.put(196, FL - 1, 'G')
    c.rect(W - 1, 0, W - 1, Hm - 1, '=')

    rows = [r + room[y] for y, r in enumerate(c.rows())]
    return {'map': rows, 'room': W, 'objs': c.objs}


# ---------------------------------------------------------------- 5-2
def bolum_5_2():
    """Veri merkezi. 19 satır: 0-1 tavan, 2-11 salon, 12 yükseltilmiş döşeme, 13-17 kablo boşluğu (gizli), 18 beton."""
    W, Hm, FL = 200, 19, 12
    c = Canvas(W, Hm)
    c.rect(0, 0, W - 1, 1, '=')
    c.rect(0, FL, W - 1, Hm - 1, '#')
    rack = lambda x, top, w=1, ch='J': c.rect(x, top, x + w - 1, FL - 1, ch)

    c.put(2, FL - 1, 'P')
    c.put(8, 8, 'K')
    rack(12, 10)
    c.put(17, FL - 1, 'e')

    # ---- TANIT: yanıp sönen lazer; değersen alarm: ileride kapı iner, menfezden bug düşer
    c.obj('lazer', x=26, y0=2, y1=11, per=3, on=1.7)
    c.obj('menfez', x=31, y=1)
    c.obj('alarmkapi', x=37, y0=2, y1=11)
    c.row(9, range(28, 35), 'b')

    # ---- GELİŞTİR: yerde sürekli lazer (üstünden atla), aşağı yukarı tarayan ışın (altından ya da üstünden geç)
    rack(42, 9, 2)
    c.obj('lazer', x0=46, x1=50, y=11)
    c.row(8, range(46, 51), 'b')
    rack(53, 9)
    c.obj('lazer', x0=55, x1=64, y=3, ya=3, yb=11, per=3.2)
    c.obj('menfez', x=60, y=1)
    rack(66, 9)
    c.put(66, 4, 'g')                            # altın 1: tarayıcının ucundaki kabinin üstünde
    # şaka: bug yerdeki lazere takılır, inen kapı onu ezer
    c.obj('lazer', x0=74, x1=74, y=11)
    c.obj('alarmkapi', x=74, y0=2, y1=11)
    c.put(79, FL - 1, 'e')
    rack(71, 10)

    # ---- TERS KÖŞE: kablo kuyusunun kapağı yok; yangın kapakları yalnız alarm çalınca kapanır.
    # lazere bilerek değ, kapaklar kapanınca koş. kapak kapanınca menfezden bug iner
    c.obj('lazer', x=86, y0=2, y1=11)
    c.rect(90, FL, 101, Hm - 1, '.')
    c.obj('alarmkapi', x0=90, x1=101, y0=FL, y1=FL)
    c.obj('menfez', x=98, y=1)
    c.row(9, range(91, 101, 2), 'b')
    c.rect(102, FL, 103, FL, '#')

    # ---- hatıra parçası, kayıt noktası
    c.put(108, FL - 1, 'Q')
    rack(112, 9)
    c.row(6, range(114, 118), '-')
    c.put(116, 5, 'h')

    # ---- gizli: gevşek bir döşeme karosu kablo boşluğuna açılır; boşluktan merdivenle yukarı
    c.put(122, FL, '~')
    c.dark(120, 13, 150, 17)
    c.row(17, range(126, 146, 2), 'b')
    c.put(137, 17, 'g')                          # altın 2: kablo boşluğunda
    c.put(140, 17, 'e')
    stairs(c, 146, 4, 18)
    c.rect(150, FL, 151, 13, '.')
    c.put(128, FL - 1, 'e')

    # ---- SINA: sırayla yanan lazerler, tarayıcı, sıcak kabinler; alarm kapısı ve menfezler
    c.put(154, FL - 1, 'Q')
    for k, x in enumerate((158, 162, 166)):
        c.obj('lazer', x=x, y0=2, y1=11, per=2.4, on=1.3, ph=k * 0.22)
    c.obj('menfez', x=164, y=1)
    rack(170, 9, 1, 'H')
    c.obj('lazer', x0=172, x1=179, y=3, ya=3, yb=11, per=2.8)
    c.row(8, range(175, 178), '-')
    c.put(176, 4, 'g')                           # altın 3: tarayıcının yolunda, rafın üstünden
    rack(180, 9, 1, 'H')
    c.obj('alarmkapi', x=183, y0=2, y1=11)
    c.obj('menfez', x=178, y=1)
    stairs(c, 185, 3, FL, 'J')
    c.put(194, FL - 1, 'G')
    c.rect(W - 1, 0, W - 1, Hm - 1, '=')

    vcam = [[0, 0, 0], [118, 0, 5], [153, 0, 0]]
    return {'map': c.rows(), 'vcam': vcam, 'objs': c.objs, 'dark': c.darks, 'blok': 'veri'}


# ---------------------------------------------------------------- 5-3
def salter(c, x, y, grp, on=None):
    """şalter: kaidesi zeminde, kolu x,y'de (üstüne basılır)"""
    kw = {} if on is None else {'on': on}
    c.obj('salter', x=x, y=y, grp=grp, **kw)
    if y + 1 < 12:
        c.rect(x, y + 1, x, 11, '=')


def bolum_5_3():
    W, Hm, FL = 195, 14, 12
    c = Canvas(W, Hm)
    c.rect(0, 0, W - 1, 1, '=')
    c.rect(0, FL, W - 1, Hm - 1, '#')

    c.put(2, FL - 1, 'P')
    c.put(8, 8, 'K')
    c.put(14, FL - 1, 'e')

    # ---- TANIT: elektrikli ızgara çarpar; şaltere bas, elektrik kesilsin, geç. alçak tavan üstünden atlatmaz
    salter(c, 20, 10, 'a', on=True)
    c.obj('izgara', x0=24, x1=36, y=FL, grp='a')
    c.rect(22, 2, 38, 6, '=')
    c.row(9, range(25, 36, 2), 'b')

    # ---- GELİŞTİR: raylı platform elektriksiz durur; şalteri aç, platform gider ama ötedeki ızgara da çarpar.
    # karşıdaki şalterle kapat
    salter(c, 43, 11, 'b', on=False)
    c.rect(46, FL, 64, Hm - 1, '.')
    c.obj('ray', x0=46, x1=61, y=10, w=3, grp='b', v=2.4)
    salter(c, 66, 10, 'b')
    c.obj('izgara', x0=67, x1=79, y=FL, grp='b')
    c.rect(60, 2, 82, 5, '=')
    c.row(7, range(48, 62, 3), 'b')
    c.put(55, 4, 'g')                            # altın 1: platformun yolunun üstünde

    # ---- TERS KÖŞE: bug sürüsü elektriksiz ızgarada; yukarıdaki şaltere bas, hepsi çarpılsın. sonra kapat, geç
    stairs(c, 86, 3, FL)
    c.rect(89, 9, 92, FL - 1, '=')
    salter(c, 91, 8, 'c', on=False)
    c.obj('izgara', x0=95, x1=110, y=FL, grp='c')
    c.rect(93, 9, 94, FL - 1, '=')
    for x in (97, 100, 103, 106, 109):
        c.put(x, FL - 1, 'e')
    c.rect(111, 9, 112, FL - 1, '=')
    c.row(6, range(97, 110, 3), 'b')

    # ---- kayıt noktası; gizli basamaklarla kablo kanalı (altın 2)
    c.put(116, FL - 1, 'Q')
    c.put(120, 6, 'b')
    c.put(120, 8, 'x'); c.put(121, 5, 'x')
    c.row(3, range(122, 128), '-')
    c.put(126, 2, 'g')                           # altın 2

    # ---- SINA: ızgaralı zemin elektrikliyken raylı platformla geç; duvarı raylı asansörle tırman.
    # elektriği kesersen ızgara söner ama platform da asansör de durur
    c.put(130, FL - 1, 'Q')
    salter(c, 133, 11, 'd', on=True)
    c.obj('izgara', x0=136, x1=153, y=FL, grp='d')
    c.obj('ray', x0=136, x1=150, y=9, w=3, grp='d', v=2.6)
    c.put(146, 4, 'g')                           # altın 3: platformun üstünde yüksekte
    c.rect(157, 6, 162, FL - 1, '=')
    c.obj('ray', x=154, y0=6, y1=11, w=3, grp='d', v=2)
    c.rect(154, FL, 156, FL, '=')
    c.row(4, range(158, 162), 'b')
    stairs_down(c, 163, 4, 6, FL)
    c.put(171, FL - 1, 'Q')

    # ---- Fidye Yazılımı arenası
    a = 176
    c.put(a, FL - 1, 'A')
    c.row(8, range(a + 6, a + 9), '-')
    c.row(8, range(a + 13, a + 16), '-')
    c.put(a + 11, FL - 2, 'B')
    c.put(a + 15, FL - 1, 'G')
    c.rect(a + 18, 0, a + 18, Hm - 1, '=')
    assert a + 18 == W - 1
    return {'map': c.rows(), 'objs': c.objs}


def build(sec, room=None):
    return [lambda: bolum_5_1(room), bolum_5_2, bolum_5_3][sec]()
