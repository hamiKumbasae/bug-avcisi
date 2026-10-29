"""Bug Avcısı: İstanbul — Şişli'nin elle tasarlanmış üç bölümü.

  3-1 Mecidiyeköy Meydanı: üst geçidin kopuk yerlerini trafikteki araçların tavanından geçmek
                           (yaya ışığı yanınca araçlar durur, sıkışan trafik köprü olur; ışık dönünce akar)
  3-2 Plaza Lobisi:        kabine binince sonraki kata giden asansörler, çağırma düğmeleri, döner kapı
  3-3 Mesai Sonu:          yalnız yanına gelince yanan sensörlü lambalar, fotokopi makinesinin çakan ışığı;
                           Spam Kraliçesi
"""
from elle import Canvas


def stairs(c, x, n, base, ch='='):
    for i in range(n):
        c.rect(x + i, base - 1 - i, x + i, base - 1, ch)


def stairs_down(c, x, n, top, base, ch='='):
    """sağa doğru inen basamaklar: ilk sütunun tepesi top+1"""
    for i in range(n):
        c.rect(x + i, top + 1 + i, x + i, base - 1, ch)


# ---------------------------------------------------------------- 3-1
def bolum_3_1(room):
    W, Hm, FL, DK = 212, 14, 12, 8      # DK: üst geçidin güvertesi
    c = Canvas(W, Hm)
    c.rect(0, FL, W - 1, Hm - 1, '#')

    c.put(2, FL - 1, 'P')
    c.put(7, 8, 'K')
    c.put(12, FL - 1, 'e')
    stairs(c, 15, 4, FL)

    # ---- TANIT: üst geçidin kopuk yeri; yaya ışığı yanınca araçlar durur, sıkışan otobüsün tavanından geç
    c.row(DK, range(19, 31), '-')
    c.row(DK, range(38, 50), '-')
    c.obj('yol', x0=21, x1=50, y=FL, dir=-1, every=2.0, v=5, kinds=['otobus', 'taksi', 'dolmus'],
          light={'x': 28, 'w': 2, 'per': 8, 'green': 4.5})
    c.row(6, range(32, 37), 'b')
    c.rect(50, DK + 1, 51, FL - 1, '=')

    # ---- GELİŞTİR: araçlar ileri akıyor; geçen aracın tavanına atla, karşıya taşın
    c.row(DK, range(52, 59), '-')
    c.row(DK, range(65, 71), '-')
    c.row(DK, range(79, 96), '-')
    c.obj('yol', x0=52, x1=96, y=FL, dir=1, every=2.6, v=4, kinds=['taksi', 'dolmus', 'otobus'])
    c.row(5, range(60, 64), 'b'); c.row(5, range(72, 78), 'b')
    c.put(86, 4, 'K')
    c.put(90, DK - 1, 'e')
    c.rect(96, DK + 1, 97, FL - 1, '=')

    # ---- TERS KÖŞE: üst geçit bitti; tek yol sıkışan trafiğin tavanları. ışık dönünce trafik geri akar
    c.obj('yol', x0=98, x1=128, y=FL, dir=-1, every=1.6, v=5, kinds=['otobus', 'dolmus', 'taksi', 'dolmus'],
          light={'x': 97, 'w': 1, 'per': 10, 'green': 6.5})
    c.put(110, 3, 'g')                           # altın 1: sıkışık trafiğin üstünde
    c.row(6, range(101, 121, 3), 'b')
    c.row(DK, range(123, 131), '-')
    stairs_down(c, 131, 4, DK, FL)

    # ---- meydan: kayıt noktası, M2 girişi, saat ekranının üstüne gizli basamaklar
    c.put(137, FL - 1, 'Q')
    c.put(142, FL - 1, 'E')
    c.text(146, 8, 'CKC')
    c.put(148, FL - 1, 'e')
    c.put(152, 6, 'b')
    c.put(152, 8, 'x'); c.put(153, 5, 'x')
    c.row(3, range(154, 159), '-')
    c.put(157, 2, 'g')                           # altın 2: saat ekranının üstünde
    c.row(2, (154, 155), 'b')
    c.put(160, FL - 1, 'Q')

    # ---- SINA: yine üst geçit; ışıkta biriken araçlar köprü, sonra akan araçlarla devam
    stairs(c, 162, 4, FL)
    c.row(DK, range(166, 170), '-')
    c.row(DK, range(180, 185), '-')
    c.row(DK, range(193, 197), '-')
    c.obj('yol', x0=167, x1=198, y=FL, dir=1, every=2.2, v=5, kinds=['dolmus', 'taksi', 'otobus'],
          light={'x': 180, 'w': 2, 'per': 7, 'green': 3})
    c.put(189, 4, 'g')                           # altın 3: ışıktan sonraki boşluğun üstünde
    c.rect(165, DK + 1, 166, FL - 1, '=')
    c.rect(198, DK + 1, 199, FL - 1, '=')
    stairs_down(c, 197, 3, DK, FL)
    c.put(203, FL - 1, 'R')
    c.put(207, FL - 1, 'G')
    c.rect(W - 1, 0, W - 1, Hm - 1, '=')

    rows = [r + room[y] for y, r in enumerate(c.rows())]
    return {'map': rows, 'room': W, 'objs': c.objs}


# ---------------------------------------------------------------- 3-2
def lift(c, x, floors, start=None):
    """asansör boşluğu: kabin x..x+2; floors: katların zemin satırları (yukarıdan aşağı).
    en alt katta kabinin altı bir karo çukur: kabin zemine gömülmez (üstündeki kabine binmiş sayılır)"""
    c.obj('asansor', x=x, floors=floors, start=len(floors) - 1 if start is None else start)
    c.rect(x, floors[-1], x + 2, floors[-1], '.')


def bolum_3_2():
    """Plaza lobisi. 18 satır: 0-3 çatı katı (gizli asansör), 4-5 tavan, 6-15 lobi ve asma katlar, 16-17 zemin."""
    W, Hm, FL = 206, 18, 16
    c = Canvas(W, Hm)
    c.rect(0, 0, W - 1, 5, '=')
    c.rect(0, FL, W - 1, Hm - 1, '#')

    # ---- giriş: döner kapı (girenin başı döner, öbür yandan çıkar)
    c.put(2, FL - 1, 'P')
    c.put(6, FL - 1, 'y')
    c.rect(10, 6, 11, 12, 'I')
    c.obj('doner', x=10, y=FL, w=2)
    c.row(13, range(14, 18), 'b')

    # ---- TANIT: güvenlik camı lobiyi keser; asansörle asma kata, oradan camın üstünden
    lift(c, 24, [12, 16])
    c.row(12, range(27, 45), '=')
    c.rect(34, 13, 34, 15, 'I')
    c.row(10, range(29, 33), 'b')
    c.put(40, 11, 'e')

    # ---- GELİŞTİR: üç kat, iki asansör: birinciyle yukarı, ikinciyle aşağı
    lift(c, 52, [8, 12, 16])
    lift(c, 74, [8, 12, 16])
    c.row(12, range(55, 72), '=')
    c.row(8, range(55, 74), '=')
    c.row(8, range(77, 91), '=')
    c.rect(62, 13, 62, 15, 'I')
    c.rect(66, 9, 66, 11, 'I')
    c.put(58, 11, 'e'); c.put(69, 7, 'e')
    c.put(90, 7, 'g')                            # altın 1: üst katın ucunda
    c.row(6, range(80, 88, 2), 'b')

    # ---- TERS KÖŞE: kabine binen bug asansörü alıp gider; düğmeyle çağır, bug'ı ez, bin
    lift(c, 104, [8, 16])
    c.put(105, FL - 1, 'e')
    c.row(8, range(107, 123), '=')
    c.rect(112, 9, 112, 15, 'I')
    c.row(6, range(114, 122, 2), 'b')

    # ---- hatıra parçası; gizli: çatıya çıkan asansör (tavandaki boşluktan çatı katına)
    c.put(127, FL - 1, 'Q')
    c.row(13, (131, 132), '-')
    c.row(10, range(134, 138), '-')
    c.put(136, 9, 'h')
    lift(c, 142, [4, 8, 16])
    c.row(8, range(145, 150), '=')
    c.rect(142, 4, 144, 5, '.')
    c.rect(139, 1, 160, 3, '.')
    c.row(3, range(146, 158, 2), 'b')
    c.put(152, 3, 'g')                           # altın 2: çatı katında
    c.rect(158, 4, 159, 5, '.')                  # çatıdan aşağı inen boşluk

    # ---- SINA: iki asansör, aradaki katta bug'lar; altın 3 alttaki asansörün ara katında, camla kapalı cepte
    c.put(152, FL - 1, 'Q')
    lift(c, 160, [8, 16])
    c.row(8, range(163, 172), '=')
    c.rect(166, 9, 166, 15, 'I')
    c.put(168, 7, 'e')
    lift(c, 172, [8, 12, 16])
    c.row(12, range(175, 181), '=')
    c.rect(180, 9, 180, 11, 'I')
    c.put(178, 11, 'g')
    c.put(184, FL - 1, 'e')

    c.put(196, FL - 1, 'G')
    c.rect(W - 1, 0, W - 1, Hm - 1, '=')
    vcam = [[0, 4, 4], [138, 0, 4], [161, 4, 4]]
    return {'map': c.rows(), 'vcam': vcam, 'objs': c.objs}


# ---------------------------------------------------------------- 3-3
def bolum_3_3():
    W, Hm, FL = 190, 14, 12
    c = Canvas(W, Hm)
    c.rect(0, 0, W - 1, 1, '=')
    c.rect(0, FL, W - 1, Hm - 1, '#')
    lamp = lambda x, **kw: c.obj('lamba', x=x, y=2, **kw)

    c.put(2, FL - 1, 'P')
    for x in (4, 12, 19):
        lamp(x)
    c.row(9, range(9, 12), '-')
    c.put(10, 5, 'K')
    c.put(16, FL - 1, 'e')

    # ---- TANIT: her lamba yanına gelince yanar; karanlıkta kısa devre bekliyor
    for x in (26, 33, 40, 47):
        lamp(x)
    c.row(FL - 1, (31, 32), '^')
    c.row(9, range(36, 39), '-')
    c.put(44, FL - 1, 'e')
    c.row(7, range(36, 39), 'b')

    # ---- GELİŞTİR: lambalar seyrek; karanlık aralarda kablo çukurları ve masalar
    for x in (55, 64, 73, 82):
        lamp(x)
    c.rect(59, FL, 61, Hm - 1, '.')
    c.rect(69, FL, 71, Hm - 1, '.')
    c.row(9, range(76, 79), '-')
    c.put(77, 4, 'g')                            # altın 1: karanlıkta, masanın yukarısında
    c.put(66, FL - 1, 'e'); c.put(80, FL - 1, 'e')
    c.row(FL - 1, (85, 86), '^')

    # ---- TERS KÖŞE: fotokopi odası; lamba yok, makine çaktıkça her yer bir an aydınlanır
    c.obj('fotokopi', x=100, y=FL, per=2.4)
    c.rect(93, FL, 95, Hm - 1, '.')
    c.row(FL - 1, (99, 103), '^')
    c.rect(106, FL, 108, Hm - 1, '.')
    c.row(9, range(110, 113), '-')
    c.put(104, FL - 1, 'e'); c.put(111, 8, 'e')

    # ---- gizli: karanlık köşede gizli basamaklar, en üst rafta altın 2
    lamp(118)
    c.put(118, FL - 1, 'Q')
    c.put(124, 6, 'b')
    c.put(124, 8, 'x'); c.put(125, 5, 'x')
    c.row(3, range(126, 131), '-')
    c.put(129, 2, 'g')                           # altın 2
    for x in (123, 131):
        lamp(x)

    # ---- SINA: seyrek lambalar, hareketli platform, kısa devreler; altın 3 karanlık çukurun üstünde
    for x in (138, 147, 156, 165):
        lamp(x)
    c.rect(142, FL, 152, Hm - 1, '.')
    c.put(142, FL - 1, 'M')                    # çukurun üstünde gidip gelen platform
    c.put(148, 4, 'g')
    c.row(FL - 1, (158, 159), '^')
    c.put(161, FL - 1, 'e')
    c.put(168, FL - 1, 'Q')

    # ---- Spam Kraliçesi arenası: lambalar sürekli yanık
    a = 171
    c.put(a, FL - 1, 'A')
    for x in (a + 5, a + 11, a + 17):
        lamp(x, always=True)
    c.row(8, range(a + 6, a + 9), '-')
    c.row(8, range(a + 13, a + 16), '-')
    c.put(a + 11, FL - 2, 'B')
    c.put(a + 15, FL - 1, 'G')
    c.rect(a + 18, 0, a + 18, Hm - 1, '=')
    assert a + 18 == W - 1
    return {'map': c.rows(), 'objs': c.objs, 'dim': True}


def build(sec, room=None):
    return [lambda: bolum_3_1(room), bolum_3_2, bolum_3_3][sec]()
