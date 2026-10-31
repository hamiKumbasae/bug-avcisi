"""Per-game plausibility rules.

Every limit here comes from reading the game's source (see README, "Anti-cheat design"). The checks use the
*server-measured* duration (token issue -> submit), never a duration the client claims.

Adding a game = adding one entry to GAMES with its modes and a check function.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable


class Implausible(ValueError):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


def _int(meta: dict, k: str, lo: int, hi: int, default: int | None = None) -> int:
    v = meta.get(k, default)
    if isinstance(v, bool) or not isinstance(v, int) or not lo <= v <= hi:
        raise Implausible("meta_invalid", f"meta.{k} must be an integer in [{lo}, {hi}]")
    return v


def _bool(meta: dict, k: str) -> bool:
    v = meta.get(k, False)
    if not isinstance(v, bool):
        raise Implausible("meta_invalid", f"meta.{k} must be true/false")
    return v


# ---------------------------------------------------------------- Bug Avcısı
# Facts from src/core.js and src/levels.js:
# * 36 stages; every score increment is a multiple of 50 (simit 100, enemies 50..8000, blocks, antenna
#   100..5000, time bonus 50/s, 500 per hourglass tick, 5000 per extra "life").
# * Lives are infinite and dying reloads the stage (coins come back), so score is NOT bounded per stage:
#   a patient player can farm. The cap therefore grows with play time.
# * A generous static upper bound per stage (all coins, blocks, enemies in a perfect combo, gold simits,
#   memory piece, top antenna, full time bonus, boss) is 28k-76k; we allow 80k per cleared stage + 80k for the
#   stage in progress, plus 600 points per second of play (farming rate; coin-dense stages give ~9k in ~20 s).
# * Running the length of a stage at top speed (9.6 tiles/s) takes 12-23 s; we require >= 10 s per cleared stage.
BA_STAGES = 36
BA_PER_STAGE = 80_000
BA_RATE = 600
BA_MIN_STAGE_S = 10
BA_ABS_MAX = 3_000_000


def check_bug_avcisi(mode: str, score: int, elapsed: float, meta: dict) -> None:
    start = _int(meta, "start", 0, BA_STAGES - 1, 0)
    cleared = _int(meta, "cleared", 0, BA_STAGES, 0)
    finished = _bool(meta, "finished")
    if start + cleared > BA_STAGES:
        raise Implausible("meta_invalid", "more stages cleared than there are")
    if finished and start + cleared != BA_STAGES:
        raise Implausible("meta_invalid", "finished runs end after the last stage")
    if score % 50:
        raise Implausible("score_implausible", "Bug Avcısı scores are multiples of 50")
    if elapsed < cleared * BA_MIN_STAGE_S:
        raise Implausible("too_fast", f"{cleared} stages need at least {cleared * BA_MIN_STAGE_S} s")
    cap = min(BA_ABS_MAX, BA_PER_STAGE * (cleared + 1) + BA_RATE * elapsed)
    if score > cap:
        raise Implausible("score_implausible", "score too high for this run")


# ---------------------------------------------------------------- Boğaz Yolu
# Facts from src/core.js and src/track.js:
# * distance points: score += round(speed/MAX * dt * 1500) while racing, i.e. at most 1500 points per second
#   (exactly 1500 * distance / MAX, independent of speed);
# * finish bonus: floor(time left) * 2000;
# * exact upper bound over all routes (top speed all the way, no crash, rain extensions):
#   bogaz (8 routes): 566,758, fastest possible finish 252.6 s; tur: 690,683, fastest finish 330.6 s.
#   The demo bot used in the game's tests scores 450k-515k (bogaz) and 563k-597k (tur).
BY_RATE = 1500
BY_MODES = {
    #        abs cap   max time left at finish   min seconds for a finished run
    "bogaz": (600_000, 100, 240),
    "tur":   (730_000, 110, 315),
}


def check_bogaz_yolu(mode: str, score: int, elapsed: float, meta: dict) -> None:
    cap, max_left, min_finish = BY_MODES[mode]
    finished = _bool(meta, "finished")
    _int(meta, "stage", 0, 16, 0)
    if finished and elapsed < min_finish:
        raise Implausible("too_fast", f"a finished {mode} run takes at least {min_finish} s")
    limit = BY_RATE * elapsed * 1.02 + (2000 * max_left if finished else 0)
    if score > min(cap, limit):
        raise Implausible("score_implausible", "score too high for this run")


@dataclass(frozen=True)
class Game:
    id: str
    title: str
    modes: tuple[str, ...]
    check: Callable[[str, int, float, dict], None]


GAMES: dict[str, Game] = {
    "bug-avcisi": Game("bug-avcisi", "Bug Avcısı: İstanbul", ("normal",), check_bug_avcisi),
    "bogaz-yolu": Game("bogaz-yolu", "Boğaz Yolu", ("bogaz", "tur"), check_bogaz_yolu),
}
