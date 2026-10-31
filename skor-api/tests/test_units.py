from __future__ import annotations

import calendar
from datetime import datetime

import pytest

from app import names, tokens
from app.main import week_start_utc
from app.ratelimit import RateLimiter, Rule


@pytest.mark.parametrize("name", ["Hami", "Işık", "IŞIK IŞIK", "Sıkıdost", "Ayşe_61", "Nigar", "Amina", "Musiki", "Şıkşık",
                                  "Ümraniye-34", "Gökçe", "Sikke", "Mk 1923", "Bug.Avcısı"])
def test_real_names_allowed(name):
    assert names.validate(name) == name


@pytest.mark.parametrize("name", ["orospu", "OROSPU çocuğu", "s1kt1r", "SİKTİR", "amk", "A.M.K", "fuuuck", "f u c k", "Yarrak",
                                  "piç", "aq", "admin", "Root", "sik", "Sh1t"])
def test_bad_names_blocked(name):
    with pytest.raises(names.NameError_):
        names.validate(name)


def test_name_cleaning():
    assert names.validate("  Hami   Kumbasar ") == "Hami Kumbasar"
    assert names.key("HAMİ") == names.key("hami")
    assert names.key("IŞIK") == "ışık"


def test_token_roundtrip_and_tamper():
    tok, run = tokens.issue("s" * 32, "bug-avcisi", "normal", 1000)
    back = tokens.verify("s" * 32, tok, "bug-avcisi", 1100, 3600)
    assert back == run
    with pytest.raises(tokens.TokenError):
        tokens.verify("x" * 32, tok, "bug-avcisi", 1100, 3600)       # other secret
    with pytest.raises(tokens.TokenError):
        tokens.verify("s" * 32, tok, "bogaz-yolu", 1100, 3600)       # other game
    with pytest.raises(tokens.TokenError) as e:
        tokens.verify("s" * 32, tok, "bug-avcisi", 1000 + 3601, 3600)
    assert e.value.code == "token_expired"
    with pytest.raises(tokens.TokenError):
        tokens.verify("s" * 32, "nodot", "bug-avcisi", 1000, 3600)


def test_week_start_is_monday_istanbul():
    # 2026-12-23 (Wed) 12:00 UTC -> Monday 2026-12-21 00:00 Istanbul = Sunday 2026-12-20 21:00 UTC
    ts = calendar.timegm((2026, 12, 23, 12, 0, 0))
    assert week_start_utc(ts) == datetime(2026, 12, 20, 21, 0)
    # Sunday 22:30 UTC is already Monday 01:30 in Istanbul -> new week
    ts2 = ts + 4 * 86400 + 10.5 * 3600
    assert week_start_utc(ts2) == datetime(2026, 12, 27, 21, 0)


def test_rate_limiter_refills():
    t = [0.0]
    rl = RateLimiter({"a": Rule(2, 1.0)}, clock=lambda: t[0])
    assert rl.hit("1.1.1.1", "a") == 0 and rl.hit("1.1.1.1", "a") == 0
    assert rl.hit("1.1.1.1", "a") > 0
    assert rl.hit("2.2.2.2", "a") == 0      # per IP
    t[0] += 1.0
    assert rl.hit("1.1.1.1", "a") == 0


def test_rate_limiter_multiple_rules_all_or_nothing():
    t = [0.0]
    rl = RateLimiter({"min": Rule(5, 1), "day": Rule(1, 0.0001)}, clock=lambda: t[0])
    assert rl.hit("ip", "min", "day") == 0
    assert rl.hit("ip", "min", "day") > 0       # day exhausted
    assert rl.hit("ip", "min") == 0             # the failed call did not consume "min"
