"""Bug Avcısı: İstanbul — elle tasarlanan bölümlerin ortak tuvali.

Her dünyanın bölümleri kendi dosyasında (maslak.py, carsi.py, ...) bu tuvalle çizilir.
Tuval harita karakterlerini tutar; karanlık bölgeler (dark) ve harita dışı nesneler (objs:
terazi, çaycı, kepenk...) ayrıca listelenir ve levels.js'e bölümün alanları olarak yazılır.
"""


class Canvas:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.g = [['.'] * w for _ in range(h)]
        self.darks = []    # karanlık arka planlı bölgeler (tavan arası, taban altı): [x0, y0, x1, y1]
        self.objs = []     # harita dışı nesneler: {'k': 'terazi', ...}

    def put(self, x, y, ch):
        assert 0 <= x < self.w and 0 <= y < self.h, (x, y, ch)
        self.g[y][x] = ch

    def rect(self, x0, y0, x1, y1, ch):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.put(x, y, ch)

    def dark(self, x0, y0, x1, y1):
        self.rect(x0, y0, x1, y1, '.')
        self.darks.append([x0, y0, x1, y1])

    def row(self, y, xs, ch):
        for x in xs:
            self.put(x, y, ch)

    def text(self, x, y, s):
        for i, ch in enumerate(s):
            if ch != ' ':
                self.put(x + i, y, ch)

    def obj(self, k, **kw):
        self.objs.append(dict(k=k, **kw))

    def rows(self):
        return [''.join(r) for r in self.g]


def door(c, x, y0, y1, top, ch='D'):
    """cam duvar (tavandan kapının üstüne) ve kapı"""
    if top <= y0 - 1:
        c.rect(x, top, x, y0 - 1, 'I')
    c.rect(x, y0, x, y1, ch)
