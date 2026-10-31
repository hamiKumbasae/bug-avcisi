"""Tests run against a real MariaDB (default: 127.0.0.1:3306, database oyun_test).

Override with SKOR_TEST_DB_HOST / _PORT / _USER / _PASSWORD / _NAME. The test database is emptied
before every test, so never point it at the production database.
"""

from __future__ import annotations

import os
import pathlib

import pymysql
import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.db import Database
from app.main import create_app
from app.ratelimit import RateLimiter, Rule

ROOT = pathlib.Path(__file__).resolve().parent.parent
SECRET = "t" * 40


def _settings() -> Settings:
    e = os.environ
    name = e.get("SKOR_TEST_DB_NAME", "oyun_test")
    assert name != "oyun", "tests wipe the database; use a separate test database"
    return Settings(
        secret=SECRET,
        db_host=e.get("SKOR_TEST_DB_HOST", "127.0.0.1"),
        db_port=int(e.get("SKOR_TEST_DB_PORT", "3306")),
        db_user=e.get("SKOR_TEST_DB_USER", "oyun"),
        db_password=e.get("SKOR_TEST_DB_PASSWORD", "yerel-test-sifresi"),
        db_name=name,
    )


@pytest.fixture(scope="session")
def settings() -> Settings:
    s = _settings()
    conn = pymysql.connect(host=s.db_host, port=s.db_port, user=s.db_user, password=s.db_password, database=s.db_name)
    with conn.cursor() as c:
        c.execute((ROOT / "schema.sql").read_text())
    conn.close()
    return s


class Clock:
    def __init__(self, t: float = 1_798_000_000.0):   # a Wednesday (2026-12-23 UTC)
        self.t = t

    def __call__(self) -> float:
        return self.t

    def advance(self, s: float):
        self.t += s


@pytest.fixture
def clock() -> Clock:
    return Clock()


@pytest.fixture
def db(settings):
    d = Database(settings)
    with d.cursor() as c:
        c.execute("DELETE FROM scores")
    yield d
    d.close()


def _lenient() -> RateLimiter:
    return RateLimiter({k: Rule(10_000, 10_000) for k in ("read", "run", "score", "score_day")})


@pytest.fixture
def client(settings, db, clock):
    app = create_app(settings, clock=clock, db=db, limiter=_lenient())
    with TestClient(app, base_url="http://testserver") as c:
        yield c


@pytest.fixture
def make_client(settings, db, clock):
    """Build a client with custom limiter rules."""
    def make(limiter=None):
        return TestClient(create_app(settings, clock=clock, db=db, limiter=limiter or _lenient()))
    return make
