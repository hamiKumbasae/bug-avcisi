"""skor-api: HTTP layer.

Run (one worker is enough and keeps the in-memory rate limiter consistent):

    uvicorn --factory app.main:create_app --host 127.0.0.1 --port 8077 --workers 1
"""

from __future__ import annotations

import hashlib
import hmac
import ipaddress
import json
import time
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Literal

import pymysql
from fastapi import FastAPI, HTTPException, Path, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from . import __version__, names, tokens
from .config import Settings
from .db import DUPLICATE, Database
from .games import GAMES, Game, Implausible
from .ratelimit import RateLimiter

TR_OFFSET = timedelta(hours=3)   # Türkiye: UTC+3 all year, no DST
GAME_ID = r"^[a-z0-9-]{1,32}$"
MetaValue = int | bool | str | float


def utc_dt(ts: float) -> datetime:
    return datetime.fromtimestamp(ts, timezone.utc).replace(tzinfo=None)


def week_start_utc(ts: float) -> datetime:
    """Monday 00:00 Istanbul time of the current week, as naive UTC."""
    local = utc_dt(ts) + TR_OFFSET
    monday = (local - timedelta(days=local.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    return monday - TR_OFFSET


def err(status: int, code: str, message: str, headers: dict | None = None) -> HTTPException:
    return HTTPException(status_code=status, detail={"code": code, "message": message}, headers=headers)


class RunIn(BaseModel):
    mode: str | None = Field(default=None, max_length=16)


class ScoreIn(BaseModel):
    token: str = Field(min_length=10, max_length=400)
    name: str = Field(max_length=40)
    score: int = Field(ge=0, le=100_000_000)
    meta: dict[str, MetaValue] = Field(default_factory=dict, max_length=12)


def create_app(settings: Settings | None = None, clock=time.time, db: Database | None = None,
               limiter: RateLimiter | None = None) -> FastAPI:
    s = settings or Settings.from_env()
    database = db or Database(s)
    rl = limiter or RateLimiter()

    @asynccontextmanager
    async def lifespan(_app):
        yield
        database.close()

    app = FastAPI(title="skor-api", version=__version__, docs_url="/docs", redoc_url=None, lifespan=lifespan,
                  summary="Small multi-game leaderboard for browser games")
    app.state.settings, app.state.db, app.state.limiter, app.state.clock = s, database, rl, clock

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(s.allowed_origins),
        allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$" if s.allow_localhost else None,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type"],
        max_age=3600,
    )

    # ------------------------------------------------------------ helpers
    def client_ip(req: Request) -> str:
        peer = req.client.host if req.client else "0.0.0.0"
        if s.trust_proxy:
            try:
                loopback = ipaddress.ip_address(peer).is_loopback
            except ValueError:
                loopback = False
            if loopback:
                fwd = req.headers.get("cf-connecting-ip") or req.headers.get("x-forwarded-for", "").split(",")[0].strip()
                if fwd:
                    return fwd
        return peer

    def limit(req: Request, *rules: str) -> str:
        ip = client_ip(req)
        wait = rl.hit(ip, *rules)
        if wait:
            raise err(429, "rate_limited", "too many requests, slow down", {"Retry-After": str(int(wait) + 1)})
        return ip

    def game_of(game_id: str, mode: str | None) -> tuple[Game, str]:
        g = GAMES.get(game_id)
        if not g:
            raise err(404, "unknown_game", f"unknown game '{game_id}'")
        m = mode or g.modes[0]
        if m not in g.modes:
            raise err(400, "unknown_mode", f"mode must be one of {list(g.modes)}")
        return g, m

    def db_call(fn, *a):
        try:
            return fn(*a)
        except pymysql.MySQLError:
            raise err(503, "db_unavailable", "database unavailable, try again later") from None

    def ip_hash(ip: str) -> str:
        return hmac.new(s.secret.encode(), ip.encode(), hashlib.sha256).hexdigest()[:16]

    def entry(i: int, r: dict) -> dict:
        return {"rank": i, "name": r["name"], "score": r["score"], "at": r["created_at"].isoformat() + "Z"}

    # ------------------------------------------------------------ routes
    @app.get("/health", tags=["meta"])
    def health():
        try:
            ok = database.ping()
        except pymysql.MySQLError:
            ok = False
        body = {"status": "ok" if ok else "degraded", "db": ok, "version": __version__}
        return JSONResponse(body, status_code=200 if ok else 503)

    @app.get("/v1/games", tags=["meta"])
    def list_games(req: Request):
        limit(req, "read")
        return {"games": [{"id": g.id, "title": g.title, "modes": list(g.modes)} for g in GAMES.values()]}

    @app.post("/v1/games/{game}/runs", tags=["scores"], status_code=201)
    def start_run(req: Request, body: RunIn | None = None, game: str = Path(pattern=GAME_ID)):
        """Call when a run starts. Returns the token the score submit must carry."""
        g, mode = game_of(game, body.mode if body else None)
        limit(req, "run")
        token, run = tokens.issue(s.secret, g.id, mode, clock())
        return {"token": token, "mode": mode, "expires_in": s.run_max_age}

    @app.post("/v1/games/{game}/scores", tags=["scores"], status_code=201)
    def submit(req: Request, body: ScoreIn, game: str = Path(pattern=GAME_ID)):
        g, _ = game_of(game, None)
        ip = limit(req, "score", "score_day")
        now = clock()
        try:
            run = tokens.verify(s.secret, body.token, g.id, now, s.run_max_age)
        except tokens.TokenError as e:
            raise err(403 if e.code == "token_invalid" else 410, e.code, str(e)) from None
        _, mode = game_of(game, run.mode)
        try:
            name = names.validate(body.name)
        except names.NameError_ as e:
            raise err(422, e.code, str(e)) from None
        elapsed = max(0.0, now - run.issued_at)
        try:
            g.check(mode, body.score, elapsed, body.meta)
        except Implausible as e:
            raise err(422, e.code, str(e)) from None
        meta = json.dumps(body.meta, ensure_ascii=False, separators=(",", ":"))
        if len(meta) > 400:
            raise err(422, "meta_invalid", "meta too large")
        key = names.key(name)
        before = db_call(database.player, g.id, mode, key, None)
        row = {"game": g.id, "mode": mode, "name": name, "name_key": key, "score": body.score, "run_id": run.run_id,
               "duration_s": int(elapsed), "meta": meta, "ip_hash": ip_hash(ip), "created_at": utc_dt(now)}
        try:
            new_id = database.insert_score(row)
        except pymysql.err.IntegrityError as e:
            if e.args and e.args[0] == DUPLICATE:
                raise err(409, "token_used", "this run was already submitted") from None
            raise err(503, "db_unavailable", "database unavailable, try again later") from None
        except pymysql.MySQLError:
            raise err(503, "db_unavailable", "database unavailable, try again later") from None
        best = max(body.score, before["score"] if before else 0)
        since = week_start_utc(now)
        week = db_call(database.player, g.id, mode, key, since)
        return {
            "id": new_id, "name": name, "mode": mode, "score": body.score, "best": best,
            "personal_best": before is None or body.score > before["score"],
            "rank": db_call(database.rank_of, g.id, mode, best, None),
            "week_rank": db_call(database.rank_of, g.id, mode, week["score"], since) if week else None,
        }

    @app.get("/v1/games/{game}/scores", tags=["scores"])
    def top(req: Request, game: str = Path(pattern=GAME_ID), mode: str | None = Query(default=None, max_length=16),
            period: Literal["all", "week"] = "all", limit_: int = Query(default=10, ge=1, le=50, alias="limit")):
        """Best score per player, highest first."""
        g, m = game_of(game, mode)
        limit(req, "read")
        since = week_start_utc(clock()) if period == "week" else None
        rows = db_call(database.top, g.id, m, since, limit_)
        return {"game": g.id, "mode": m, "period": period, "entries": [entry(i + 1, r) for i, r in enumerate(rows)]}

    @app.get("/v1/games/{game}/players/{name}", tags=["scores"])
    def player(req: Request, name: str = Path(max_length=40), game: str = Path(pattern=GAME_ID),
               mode: str | None = Query(default=None, max_length=16)):
        """A player's best score and all-time rank (plus this week's best)."""
        g, m = game_of(game, mode)
        limit(req, "read")
        key = names.key(names.clean(name))
        best = db_call(database.player, g.id, m, key, None)
        if not best:
            raise err(404, "unknown_player", "no scores for this name yet")
        since = week_start_utc(clock())
        week = db_call(database.player, g.id, m, key, since)
        return {
            "game": g.id, "mode": m, "name": best["name"], "best": best["score"], "runs": best["runs"],
            "rank": db_call(database.rank_of, g.id, m, best["score"], None),
            "best_at": best["created_at"].isoformat() + "Z",
            "week_best": week["score"] if week else None,
        }

    return app
