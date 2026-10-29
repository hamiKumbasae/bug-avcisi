"""Bug Avcısı: İstanbul — Üsküdar'ın elle tasarlanmış üç bölümü (gün batımı).

  4-1 İskele: iki iskele arasında gidip gelen vapurlar (alt ve üst güverte); peşindeki martılar simit kapar;
              sonda yalnız üstünde durulunca ilerleyen kayıklar
  4-2 Çarşı:  tezgâhların tenteleri sektirir; meyve kasalarından yuvarlanan karpuzlar (önündeki bug'ı da devirir)
  4-3 Sahil:  belli aralıkla kıyıyı basan dalgalar; yüksek suyla kalkan sallar; Dev Martı
"""
from elle import Canvas


def stairs(c, x, n, base, ch='='):
    for i in range(n):
        c.rect(x + i, base - 1 - i, x + i, base - 1, ch)


# ---------------------------------------------------------------- 4-1
def bolum_4_1(room):
    W, Hm, FL = 210, 14, 12
    c = Canvas(W, Hm)
    c.rect(0, FL, W - 1, Hm - 1, '#')
    sea = lambda x0, x1: c.rect(x0, FL, x1, Hm - 1, '.')

    # ---- iskele: simitçi, bloklar
    c.put(2, FL - 1, 'P')
    c.put(8, 8, 'K')
    c.put(14, FL - 1, 'k'); c.put(15, FL - 1, 'k')
    c.row(4, range(13, 18), 'b')
    c.put(21, FL - 1, 'e')

    # ---- TANIT: vapur iskeleye yanaşır, bekler, karşıya geçer
    sea(26, 43)
    c.obj('vapur', x0=26, x1=34, y=FL, w=10, wait=2.5, v=3)
    c.row(6, range(30, 38, 2), 'b')

    # ---- GELİŞTİR: iki vapur; ortada birinden öbürüne aktarma
    sea(52, 83)
    c.obj('vapur', x0=52, x1=58, y=FL, w=10, wait=2.2, v=3)
    c.obj('vapur', x0=68, x1=74, y=FL, w=10, wait=3.6, v=3)
    c.row(7, range(60, 72, 2), 'b')
    c.put(87, FL - 1, 'e')

    # ---- TERS KÖŞE: uzun yolculuk; peşindeki martılar dalıp simitini kapar (kaçarken ez, geri al)
    sea(92, 121)
    c.obj('vapur', x0=92, x1=110, y=FL, w=12, wait=2.5, v=3.2)
    c.obj('martilar', x0=94, x1=120, n=3, y=3)
    c.put(106, 4, 'g')                           # altın 1: üst güverteden zıplayınca
    c.row(6, range(96, 118, 3), 'b')

    # ---- iskele binası: kayıt noktası, Marmaray girişi, gizli basamaklarla iskele binasının damı
    c.put(124, FL - 1, 'Q')
    c.put(128, FL - 1, 'E')
    c.text(132, 8, 'CKC')
    c.put(136, 6, 'b')
    c.put(136, 8, 'x'); c.put(137, 5, 'x')
    c.row(3, range(138, 144), '-')
    c.put(141, 2, 'g')                           # altın 2: iskele binasının damında
    c.row(2, (139, 143), 'b')
    c.put(140, FL - 1, 'e')

    # ---- SINA: yalnız üstünde durunca ilerleyen kayıklar, aradaki dubada bug'lar
    c.put(144, FL - 1, 'Q')
    sea(147, 164)
    c.obj('vapur', x0=147, x1=160, y=FL, w=4, v=3.4, kayik=True)
    c.put(156, 5, 'g')                           # altın 3: kayıktan zıplayınca, suyun üstünde
    sea(168, 182)
    c.obj('vapur', x0=168, x1=179, y=FL, w=4, v=3.4, kayik=True)
    c.put(166, FL - 1, 'e')
    c.put(187, FL - 1, 'R')
    stairs(c, 192, 4, FL)
    c.put(201, FL - 1, 'G')
    c.rect(W - 1, 0, W - 1, Hm - 1, '=')

    rows = [r + room[y] for y, r in enumerate(c.rows())]
    return {'map': rows, 'room': W, 'objs': c.objs}


# ---------------------------------------------------------------- 4-2
def bolum_4_2():
    W, Hm, FL = 200, 14, 12
    c = Canvas(W, Hm)
    c.rect(0, FL, W - 1, Hm - 1, '#')
    tente = lambda x, y, n=3: c.row(y, range(x, x + n), 'k')

    c.put(2, FL - 1, 'P')
    c.put(8, 8, 'K')
    c.put(15, FL - 1, 'e')

    # ---- TANIT: tezgâhın tentesi sektirir; yalnız böyle balkona çıkılır, duvarın üstünden geçilir
    tente(26, 9)
    c.row(4, range(31, 36), '=')
    c.rect(36, 4, 37, 11, '=')
    c.row(3, range(32, 36), 'b')

    # ---- GELİŞTİR: çeşmenin havuzu; tenteden tenteye
    c.rect(46, FL, 70, Hm - 1, '.')
    tente(47, 10); tente(55, 8); tente(63, 9)
    c.row(4, (51, 52, 59, 60, 67, 68), 'b')
    c.put(59, 1, 'g')                            # altın 1: ikinci tentenin üstünde, en yüksek sekişte

    # ---- TERS KÖŞE: kasadan karpuzlar yuvarlanır; tentelerle üstünden atla. önüne çıkan bug'ı da devirir
    c.obj('kasa', x=112, y=FL - 1, every=2.4, dir=-1)
    c.rect(113, 9, 114, 11, '=')
    tente(84, 9); tente(95, 9); tente(104, 9)
    c.put(90, FL - 1, 'e'); c.put(100, FL - 1, 'e')
    c.row(4, range(86, 108, 4), 'b')

    # ---- hatıra parçası; gizli: çamaşır ipinin üstündeki balkon
    c.put(118, FL - 1, 'Q')
    c.row(9, (121, 122), '-')
    c.row(6, range(124, 128), '-')
    c.put(126, 5, 'h')
    c.put(131, 6, 'b')
    c.put(131, 8, 'x'); c.put(132, 5, 'x')
    c.row(3, range(133, 139), '-')
    c.put(137, 2, 'g')                           # altın 2: balkonda

    # ---- SINA: iki kasa, tenteler, havuz
    c.put(142, FL - 1, 'Q')
    c.obj('kasa', x=176, y=FL - 1, every=2.0, dir=-1)
    c.rect(177, 9, 178, 11, '=')
    c.rect(150, FL, 162, Hm - 1, '.')
    tente(146, 9); tente(153, 9); tente(160, 9)
    c.put(156, 3, 'g')                           # altın 3: havuzun üstünde, tentelerin arasında
    tente(168, 9)
    c.put(165, FL - 1, 'e')
    stairs(c, 181, 4, FL)
    c.put(192, FL - 1, 'G')
    c.rect(W - 1, 0, W - 1, Hm - 1, '=')
    return {'map': c.rows(), 'objs': c.objs, 'tente': True}


# ---------------------------------------------------------------- 4-3
def bolum_4_3():
    W, Hm, FL = 195, 14, 12
    c = Canvas(W, Hm)
    c.rect(0, FL, W - 1, Hm - 1, '#')
    kaya = lambda x, top=9, w=2: c.rect(x, top, x + w - 1, FL - 1, '=')

    c.put(2, FL - 1, 'P')
    c.put(8, 8, 'K')
    c.put(14, FL - 1, 'e')

    # ---- TANIT: dalga kumsalı basar; kayada bekle, su çekilince koş
    kaya(20); kaya(31); kaya(41)
    c.obj('dalga', x0=22, x1=41, lo=12.8, hi=10.2, per=7, high=2)
    c.row(10, range(23, 30, 2), 'b')

    # ---- GELİŞTİR: uzun kumsal, aralıklı kayalar; dalga bug'ları da alıp götürür
    kaya(48); kaya(57); kaya(66, 10); kaya(75); kaya(84)
    c.obj('dalga', x0=50, x1=84, lo=12.8, hi=10.0, per=6.4, high=1.8, ph=0.3)
    c.put(54, FL - 1, 'e'); c.put(71, FL - 1, 'e')
    c.put(62, 4, 'g')                            # altın 1: iki kaya arasında yüksekte
    c.row(7, (58, 59, 76, 77), 'b')

    # ---- TERS KÖŞE: yüksek su salı kaldırır; sal yükselince falezin tepesine
    c.obj('dalga', x0=90, x1=110, lo=12.8, hi=7.6, per=9, high=3)
    kaya(88)
    c.obj('sal', x=96, y=12.6, w=3)
    c.obj('sal', x=103, y=12.6, w=3)
    c.rect(110, 6, 115, 11, '=')
    c.row(5, range(111, 115), 'b')

    # ---- falezin üstü: kayıt noktası; gizli basamaklarla deniz fenerinin kayalığı (altın 2)
    c.put(118, FL - 1, 'Q')
    c.rect(116, 8, 117, 11, '=')
    c.put(124, 6, 'b')
    c.put(124, 8, 'x'); c.put(125, 5, 'x')
    c.row(3, range(126, 131), '-')
    c.put(129, 2, 'g')                           # altın 2

    # ---- SINA: dalgalar, sallar, bug'lar
    c.put(134, FL - 1, 'Q')
    kaya(137)
    c.obj('dalga', x0=139, x1=168, lo=12.8, hi=9.4, per=5.6, high=1.6)
    kaya(147); kaya(157, 10)
    c.obj('sal', x=151, y=12.6, w=2)
    c.obj('sal', x=161, y=12.6, w=2)
    c.put(153, FL - 1, 'e'); c.put(163, FL - 1, 'e')
    kaya(168)
    c.put(171, FL - 1, 'Q')

    # ---- Dev Martı arenası: sahil yolunda
    a = 176
    c.put(a, FL - 1, 'A')
    c.row(8, range(a + 6, a + 9), '-')
    c.row(8, range(a + 13, a + 16), '-')
    c.put(a + 11, FL - 2, 'B')
    c.put(a + 15, FL - 1, 'G')
    c.rect(a + 18, 0, a + 18, Hm - 1, '=')
    assert a + 18 == W - 1
    return {'map': c.rows(), 'objs': c.objs, 'blok': 'kaya'}


def build(sec, room=None):
    return [lambda: bolum_4_1(room), bolum_4_2, bolum_4_3][sec]()
