"""Player name validation and a deliberately *light* profanity filter.

A hobby leaderboard does not need a 5000-word blocklist; it needs to stop the obvious stuff without
rejecting real Turkish names. Turkish makes naive substring matching dangerous: "Işık" folds to "isik",
which contains "sik". So short roots are matched only as whole words, and only long, unambiguous roots
are matched as substrings.
"""

from __future__ import annotations

import re
import unicodedata

NAME_MIN = 2
NAME_MAX = 16

# letters (ASCII + Turkish), digits, space and a few separators
_ALLOWED = re.compile(r"^[0-9A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛû _.\-]+$")
_HAS_LETTER = re.compile(r"[A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛû]")

_FOLD = str.maketrans({"ç": "c", "ğ": "g", "ı": "i", "ö": "o", "ş": "s", "ü": "u", "â": "a", "î": "i", "û": "u",
                       "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "9": "g"})

# matched anywhere in the joined name (all words glued together, repeated letters collapsed)
_SUBSTR = (
    "orospu", "yarak", "amcik", "aminakoy", "aminikoy", "aminako", "pezevenk", "kahpe", "yavsak", "kaltak", "fahise",
    "gotveren", "gavat", "ibne", "serefsiz", "fuck", "shit", "bitch", "cunt", "whore", "ashole", "motherf", "fagot",
)
# matched only as a whole word (after folding / collapsing)
_WORDS = frozenset((
    "sik", "sikik", "sikim", "siktir", "siktirgit", "sikerim", "sikeyim", "sikiyim", "sktr", "skrm", "amk", "amq", "aq",
    "oc", "pic", "got", "gotlek", "yaram", "pust", "niga", "niger", "fck", "fuk", "dick", "pusy", "porn", "porno",
    "sex", "seks", "nazi", "hitler",
))
_RESERVED = frozenset(("admin", "yonetici", "moderator", "mod", "sistem", "system", "root", "sunucu", "server", "anonim"))


# the lists go through the same folding as the input ("root" -> "rot", "yarrak" -> "yarak")
_SUBSTR = tuple(re.sub(r"(.)\1+", r"\1", w) for w in _SUBSTR)
_WORDS = frozenset(re.sub(r"(.)\1+", r"\1", w) for w in _WORDS)
_RESERVED = frozenset(re.sub(r"(.)\1+", r"\1", w) for w in _RESERVED)


class NameError_(ValueError):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


def tr_lower(s: str) -> str:
    """Turkish-aware lowercase: I -> ı, İ -> i."""
    return s.replace("I", "ı").replace("İ", "i").lower()


def clean(raw: str) -> str:
    s = unicodedata.normalize("NFC", raw or "")
    s = re.sub(r"\s+", " ", s).strip()
    return s


def key(name: str) -> str:
    """Grouping key: 'Hami', 'HAMİ' and 'hami' are the same player."""
    return tr_lower(name)


def _collapse(s: str) -> str:
    return re.sub(r"(.)\1+", r"\1", s)


def _fold(word: str) -> str:
    w = tr_lower(word).translate(_FOLD)
    w = unicodedata.normalize("NFKD", w)
    w = "".join(ch for ch in w if "a" <= ch <= "z")
    return _collapse(w)


def is_offensive(name: str) -> bool:
    words = [w for w in (_fold(p) for p in re.split(r"[\s_.\-]+", name)) if w]
    joined = _collapse("".join(words))
    if any(w in _WORDS or w in _RESERVED for w in words):
        return True
    if joined in _WORDS or joined in _RESERVED:
        return True
    return any(root in joined for root in _SUBSTR)


def validate(raw: str) -> str:
    """Return the cleaned name or raise NameError_ with a machine-readable code."""
    name = clean(raw)
    if len(name) < NAME_MIN:
        raise NameError_("name_short", f"name must be at least {NAME_MIN} characters")
    if len(name) > NAME_MAX:
        raise NameError_("name_long", f"name must be at most {NAME_MAX} characters")
    if not _ALLOWED.match(name) or not _HAS_LETTER.search(name):
        raise NameError_("name_chars", "name may contain letters, digits, space, '.', '_' and '-' and needs a letter")
    if is_offensive(name):
        raise NameError_("name_blocked", "please choose another name")
    return name
