"""Bug Avcısı: İstanbul — Kapalıçarşı'nın elle tasarlanmış üç bölümü.

  2-1 Kuyumcular: kuyumcu terazileri (bir kefeye basınca öbürü kalkar; yüksekten düşülünce sapan olur)
  2-2 Han:        basınca çöken çürük tahtalar; avluda askılı tepsiyle dolaşan çaycı (tepsisine binilir)
  2-3 Bedesten:   belli aralıkla inip kalkan dükkân kepenkleri (altında kalan bug ezilir); Truva Atı
"""
from elle import Canvas


def stairs(c, x, n, base, ch='='):
    """sağa doğru yükselen n basamak (base: zeminin satırı)"""
    for i in range(n):
        c.rect(x + i, base - 1 - i, x + i, base - 1, ch)


# ---------------------------------------------------------------- 2-1
def bolum_2_1(room):
    W, Hm, FL = 196, 14, 12
    c = Canvas(W, Hm)
    c.rect(0, FL, W - 1, Hm - 1, '#')

    # ---- açılış
    c.put(2, FL - 1, 'P')
    c.put(8, 8, 'K')
    c.text(13, 8, 'CUC')
    c.row(5, range(13, 16), 'b')
    c.put(19, FL - 1, 'e')

    # ---- TANIT: büyük terazi; sol kefeye basınca sağdaki kalkar, kalkan kefeden vitrinin üstüne
    c.obj('terazi', xa=26, xb=32, y=9, r=2.5)
    c.rect(37, 6, 44, 11, '=')
    c.row(5, range(38, 44), 'b')

    # ---- GELİŞTİR: çukurun üstünde iki terazi, kefeden kefeye
    c.rect(48, FL, 71, Hm - 1, '.')
    c.obj('terazi', xa=50, xb=55, y=9, r=2)
    c.obj('terazi', xa=61, xb=66, y=9, r=2)
    c.row(6, (51, 52, 56, 57, 62, 63, 67, 68), 'b')

    # ---- şaka: raftan kefeye yüksekten düşen, öbür kefedeki bug'ı fırlatır (sapan)
    stairs(c, 76, 4, FL)
    c.row(7, range(80, 83), '-')
    c.obj('terazi', xa=83, xb=89, y=10, r=2)
    c.put(90, 9, 'e')
    # altın 1: tezgâhın üstündeki kapalı nişte; çatlak taşı büyükken alttan kır
    c.rect(95, 4, 100, 4, '=')
    c.rect(95, 5, 95, 6, '='); c.rect(100, 5, 100, 6, '=')
    c.text(95, 7, '=CC==')
    c.put(100, 7, '=')
    c.put(97, 5, 'g'); c.put(98, 6, 'b')

    # ---- cadde: kayıt noktası, tramvay durağı, dükkân blokları
    c.put(106, FL - 1, 'Q')
    c.put(110, FL - 1, 'E')
    c.text(114, 8, 'CKC')
    c.put(117, FL - 1, 'e')
    # gizli basamaklar: ilkinin üstünde tek simit; dükkân saçaklarının üstündeki yola çıkar (kestirme)
    c.put(119, 6, 'b')
    c.put(119, 8, 'x'); c.put(120, 5, 'x')
    c.row(2, range(121, 152), '-')
    c.row(1, range(124, 150, 3), 'b')
    c.put(141, 1, 'g')                           # altın 2: saçak yolunda

    # ---- TERS KÖŞE: ters makara; basılan kefe kalkar. öbür kefedeki bug ağırlık yapar, önce onu ez
    c.obj('terazi', xa=131, xb=125, y=9, r=3, inv=True)
    c.put(126, 8, 'e')
    c.rect(136, 4, 139, 11, '=')
    c.row(3, (137, 138), 'b')
    c.put(148, FL - 1, 'R')
    c.put(153, FL - 1, 'e')

    # ---- SINA: çukurun üstünde son terazi; altın 3 iki kefenin arasında yüksekte
    c.put(158, FL - 1, 'Q')
    c.rect(162, FL, 172, Hm - 1, '.')
    c.obj('terazi', xa=164, xb=169, y=9, r=2)
    c.put(167, 4, 'g')
    stairs(c, 176, 5, FL)
    c.rect(181, 7, 181, 11, '=')
    c.put(188, FL - 1, 'G')
    c.rect(W - 1, 0, W - 1, Hm - 1, '=')

    rows = c.rows()
    rows = [r + room[y] for y, r in enumerate(rows)]
    return {'map': rows, 'room': W, 'vcam': [[0, 0, 0]], 'objs': c.objs, 'blok': 'tas'}


# ---------------------------------------------------------------- 2-2
def bolum_2_2():
    """Han. 19 satır: 0-13 avlu ve galeri, 14-17 gizli mahzen, 18 mahzen tabanı."""
    W, Hm, FL = 205, 19, 12
    c = Canvas(W, Hm)
    c.rect(0, FL, W - 1, Hm - 1, '#')

    # ---- açılış: avluda çaycı dolaşıyor; tepsisine ilk binene çay ikram eder (güç)
    c.put(2, FL - 1, 'P')
    c.obj('cayci', x0=6, x1=17, y=FL)
    c.put(21, 8, 'K')
    c.put(18, FL - 1, 'e')

    # ---- TANIT: avludaki çürük tahtalar; altı sığ, düşen çıkar
    c.rect(24, FL, 30, FL, '~')
    c.row(10, range(25, 30), 'b')

    # ---- GELİŞTİR: kuyunun üstünde çürük tahta köprü; durmadan geç, aradaki bug'ları ez
    stairs(c, 38, 3, FL)
    c.rect(41, 9, 43, 11, '=')
    c.rect(44, FL, 68, Hm - 1, '.')
    for x in range(44, 68):
        if x not in (52, 60):
            c.put(x, 9, '~')
    c.put(50, 8, 'e'); c.put(63, 8, 'e')
    c.row(6, range(46, 66, 3), 'b')

    # ---- TERS KÖŞE: galerinin tahtaları çürüyüp düşmüş; çaycı kirişin üstünden boşluğa aldırmadan yürür,
    # karşıya ancak onun tepsisinde geçilir
    stairs(c, 72, 4, FL)
    c.rect(76, 6, 79, 11, '=')
    c.rect(80, 6, 101, Hm - 1, '.')
    c.obj('kiris', x0=80, x1=101, y=6)
    c.obj('cayci', x0=80, x1=99, y=6, v=2.6)
    c.put(96, 0, 'g')                            # altın 1: tepsiden zıplayınca, boşluğun üstünde
    c.rect(102, 6, 105, 11, '=')
    for k in range(4):                           # karşı yandan inen basamaklar
        c.rect(106 + k, 7 + k, 106 + k, FL - 1, '=')

    # ---- hatıra parçasının köşesi, kayıt noktası
    c.put(120, FL - 1, 'Q')
    c.row(9, (123, 124), '-')
    c.row(6, range(126, 130), '-')
    c.put(128, 5, 'h')

    # ---- gizli: tek bir çürük tahta mahzene açılır; mahzenden merdivenle yukarı
    c.put(133, FL, '~')
    c.dark(131, 13, 159, 17)
    c.row(17, range(136, 156, 2), 'b')
    c.put(146, 17, 'g')                          # altın 2: mahzende
    c.put(150, 17, 'e')
    stairs(c, 156, 4, 18)
    c.rect(160, FL, 161, 13, '.')
    c.put(140, FL - 1, 'e')
    c.put(143, 8, 'K')

    # ---- SINA: çürük tahtalı uzun köprü; delikler, bug'lar; altın 3 boşluğun üstünde yüksekte
    c.put(164, FL - 1, 'Q')
    c.rect(168, FL, 188, Hm - 1, '.')
    for x in range(168, 189):
        if x not in (173, 179, 184):
            c.put(x, 10, '~')
    stairs(c, 165, 2, FL)
    c.put(176, 9, 'e'); c.put(182, 9, 'e')
    c.put(178, 4, 'g')
    stairs(c, 191, 5, FL)
    c.put(199, FL - 1, 'G')
    c.rect(W - 1, 0, W - 1, Hm - 1, '=')

    vcam = [[0, 0, 0], [129, 0, 5], [163, 0, 0]]
    return {'map': c.rows(), 'vcam': vcam, 'objs': c.objs, 'dark': c.darks, 'blok': 'ahsap'}


# ---------------------------------------------------------------- 2-3
def kepenk_duvar(c, x, top, y0, y1, **kw):
    """tavandan inen taş duvar ve altındaki dükkân kepengi"""
    c.rect(x, top, x, y0 - 1, '=')
    c.obj('kepenk', x=x, y0=y0, y1=y1, **kw)


def bolum_2_3():
    W, Hm, FL = 195, 14, 12
    c = Canvas(W, Hm)
    c.rect(0, 0, W - 1, 1, '=')
    c.rect(0, FL, W - 1, Hm - 1, '#')

    c.put(2, FL - 1, 'P')
    c.put(8, 8, 'K')
    c.put(14, FL - 1, 'e')

    # ---- TANIT: tek kepenk; kalkınca geç
    kepenk_duvar(c, 28, 2, 9, 11, per=4, open=2)
    c.row(10, range(22, 27), 'b')

    # ---- GELİŞTİR: art arda dört kepenk, sırayla açılır (koşan yetişir); altın 1 aradaki rafın üstünde
    for k, x in enumerate((46, 52, 58, 64)):
        kepenk_duvar(c, x, 2, 9, 11, per=4, open=1.6, ph=1 - k * 0.12)
    c.row(7, range(54, 57), '-')
    c.put(55, 4, 'g')
    c.put(61, FL - 1, 'e')

    # ---- TERS KÖŞE: karşıdan gelen bug'ları kepenkler ezer; zamanla, sonra geç
    for k, x in enumerate((88, 96, 104)):
        kepenk_duvar(c, x, 2, 9, 11, per=3.2, open=1.4, ph=k * 0.3)
    for x in (98, 100, 106, 108, 110):
        c.put(x, FL - 1, 'e')
    c.row(10, range(90, 95), 'b')

    # ---- gizli: yoldaki asma katta kapalı bir dükkân; damına gizli basamaklarla çık, kapaktan içeri in,
    # dükkânın kendi kepenginden çık. yol dükkânın altından geçer
    c.put(117, FL - 1, 'Q')
    c.put(121, 6, 'b')
    c.put(121, 8, 'x'); c.put(122, 5, 'x')
    c.rect(126, 4, 133, 4, '=')
    c.rect(126, 9, 133, 9, '=')
    c.rect(126, 5, 126, 8, '=')
    c.obj('kepenk', x=133, y0=6, y1=8, per=5, open=2)
    c.rect(133, 5, 133, 5, '=')
    c.row(4, (129, 130), 'p')
    c.row(8, range(127, 132), 'b')
    c.put(131, 6, 'g')                           # altın 2: kapalı dükkânda
    c.row(9, (134, 135, 136), '-')
    c.put(124, FL - 1, 'e')

    # ---- SINA: hızlı kepenkler; altın 3 iki kepenk arasındaki dar boşlukta, yüksekte
    for k, x in enumerate((146, 150, 154)):
        kepenk_duvar(c, x, 2, 9, 11, per=2.4, open=1.0, ph=k * 0.33)
    c.put(152, FL - 1, 'e')
    kepenk_duvar(c, 160, 2, 9, 11, per=3, open=0.9)
    kepenk_duvar(c, 162, 2, 9, 11, per=3, open=0.9, ph=0.5)
    c.put(161, 9, '-')
    c.put(161, 5, 'g')
    c.put(170, FL - 1, 'Q')

    # ---- Truva Atı arenası
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
    return [lambda: bolum_2_1(room), bolum_2_2, bolum_2_3][sec]()
