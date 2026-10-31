"""A tiny PyMySQL connection pool and the leaderboard queries.

No ORM on purpose: one table, a handful of queries, and a Raspberry Pi 3 with 1 GB RAM.
"""

from __future__ import annotations

import queue
import threading
from contextlib import contextmanager
from datetime import datetime

import pymysql
import pymysql.cursors

from .config import Settings

# MariaDB error code for a duplicate key (run token used twice)
DUPLICATE = 1062


class Database:
    def __init__(self, s: Settings):
        self.s = s
        self._idle: queue.LifoQueue = queue.LifoQueue(maxsize=max(1, s.db_pool))
        self._lock = threading.Lock()

    def _connect(self):
        return pymysql.connect(
            host=self.s.db_host, port=self.s.db_port, user=self.s.db_user, password=self.s.db_password,
            database=self.s.db_name, charset="utf8mb4", autocommit=True, connect_timeout=5,
            read_timeout=10, write_timeout=10, cursorclass=pymysql.cursors.DictCursor,
        )

    @contextmanager
    def cursor(self):
        try:
            conn = self._idle.get_nowait()
            try:
                conn.ping()
            except pymysql.MySQLError:
                try:
                    conn.close()
                except Exception:
                    pass
                conn = self._connect()
        except queue.Empty:
            conn = self._connect()
        ok = False
        try:
            with conn.cursor() as cur:
                yield cur
            ok = True
        finally:
            if ok:
                try:
                    self._idle.put_nowait(conn)
                except queue.Full:
                    conn.close()
            else:
                try:
                    conn.close()
                except Exception:
                    pass

    def close(self):
        while True:
            try:
                self._idle.get_nowait().close()
            except queue.Empty:
                break
            except Exception:
                pass

    # ---------------- queries ----------------

    def ping(self) -> bool:
        with self.cursor() as c:
            c.execute("SELECT 1 AS ok")
            return c.fetchone()["ok"] == 1

    def insert_score(self, row: dict) -> int:
        with self.cursor() as c:
            c.execute(
                "INSERT INTO scores (game, mode, name, name_key, score, run_id, duration_s, meta, ip_hash, created_at)"
                " VALUES (%(game)s, %(mode)s, %(name)s, %(name_key)s, %(score)s, %(run_id)s, %(duration_s)s,"
                " %(meta)s, %(ip_hash)s, %(created_at)s)",
                row,
            )
            return c.lastrowid

    def top(self, game: str, mode: str, since: datetime | None, limit: int) -> list[dict]:
        """Best score per player (ties: whoever got there first)."""
        where, args = "game = %s AND mode = %s", [game, mode]
        if since is not None:
            where += " AND created_at >= %s"
            args.append(since)
        args.append(limit)
        with self.cursor() as c:
            c.execute(
                "SELECT name, score, created_at FROM ("
                "  SELECT name, score, created_at,"
                "         ROW_NUMBER() OVER (PARTITION BY name_key ORDER BY score DESC, created_at ASC, id ASC) AS rn"
                f"  FROM scores WHERE {where}"
                ") AS t WHERE rn = 1 ORDER BY score DESC, created_at ASC LIMIT %s",
                args,
            )
            return list(c.fetchall())

    def player(self, game: str, mode: str, name_key: str, since: datetime | None) -> dict | None:
        where, args = "game = %s AND mode = %s AND name_key = %s", [game, mode, name_key]
        if since is not None:
            where += " AND created_at >= %s"
            args.append(since)
        with self.cursor() as c:
            c.execute(
                f"SELECT name, score, created_at FROM scores WHERE {where} ORDER BY score DESC, created_at ASC, id ASC LIMIT 1",
                args,
            )
            best = c.fetchone()
            if not best:
                return None
            c.execute(f"SELECT COUNT(*) AS n FROM scores WHERE {where}", args)
            best["runs"] = c.fetchone()["n"]
            return best

    def rank_of(self, game: str, mode: str, score: int, since: datetime | None) -> int:
        """1 + number of *other players* whose best is strictly higher."""
        where, args = "game = %s AND mode = %s", [game, mode]
        if since is not None:
            where += " AND created_at >= %s"
            args.append(since)
        args.append(score)
        with self.cursor() as c:
            c.execute(
                f"SELECT COUNT(*) AS n FROM (SELECT MAX(score) AS m FROM scores WHERE {where} GROUP BY name_key) AS b WHERE b.m > %s",
                args,
            )
            return c.fetchone()["n"] + 1
