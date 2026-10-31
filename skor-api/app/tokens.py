"""Signed run tokens.

The server issues a token when a run starts; the score submit must carry it. The token is stateless
(nothing is stored when it is issued) and looks like ``<payload>.<signature>``:

    payload   = base64url(JSON {"g": game, "m": mode, "r": run_id, "t": issued_at_unix})
    signature = base64url(HMAC-SHA256(secret, payload))

What it buys:
* curl spam needs a fresh token per score (and token issuing is rate limited per IP);
* the server knows how long the run really took (issued_at is signed), which drives the plausibility checks;
* each token is single-use: ``run_id`` is UNIQUE in the scores table.

What it does not buy: a determined player can still read the JS, request a token, wait, and submit a
made-up score that stays within the plausibility limits. That is inherent to client-side games.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
from dataclasses import dataclass


class TokenError(ValueError):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


@dataclass(frozen=True)
class Run:
    game: str
    mode: str
    run_id: str
    issued_at: int


def _b64(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode("ascii")


def _unb64(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def _sign(secret: str, payload: str) -> str:
    return _b64(hmac.new(secret.encode(), payload.encode("ascii"), hashlib.sha256).digest())


def issue(secret: str, game: str, mode: str, now: float) -> tuple[str, Run]:
    run = Run(game=game, mode=mode, run_id=secrets.token_urlsafe(16), issued_at=int(now))
    payload = _b64(json.dumps({"g": run.game, "m": run.mode, "r": run.run_id, "t": run.issued_at}, separators=(",", ":")).encode())
    return f"{payload}.{_sign(secret, payload)}", run


def verify(secret: str, token: str, game: str, now: float, max_age: int) -> Run:
    try:
        payload, sig = token.split(".", 1)
    except ValueError:
        raise TokenError("token_invalid", "malformed run token") from None
    if not hmac.compare_digest(_sign(secret, payload), sig):
        raise TokenError("token_invalid", "bad run token signature")
    try:
        d = json.loads(_unb64(payload))
        run = Run(game=str(d["g"]), mode=str(d["m"]), run_id=str(d["r"]), issued_at=int(d["t"]))
    except Exception:
        raise TokenError("token_invalid", "unreadable run token") from None
    if run.game != game:
        raise TokenError("token_invalid", "run token belongs to another game")
    if len(run.run_id) != 22:
        raise TokenError("token_invalid", "bad run id")
    age = now - run.issued_at
    if age < -5:
        raise TokenError("token_invalid", "run token from the future")
    if age > max_age:
        raise TokenError("token_expired", "run token expired; start a new run")
    return run
