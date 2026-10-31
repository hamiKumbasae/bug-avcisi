"""In-memory token-bucket rate limiter.

Fine for a single uvicorn worker (which is what runs on the Pi). State is lost on restart, which is
acceptable for a hobby service. Old buckets are swept so memory stays bounded.
"""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass


@dataclass(frozen=True)
class Rule:
    capacity: float      # burst size
    per_second: float    # refill rate


# name -> rule. A request can be charged against several rules (e.g. per-minute and per-day).
DEFAULT_RULES: dict[str, Rule] = {
    "read": Rule(60, 1.0),                    # ~60/min burst, 1/s sustained
    "run": Rule(20, 20 / 60),                 # 20 run tokens per minute
    "score": Rule(6, 6 / 60),                 # 6 submits per minute
    "score_day": Rule(150, 150 / 86400),      # 150 submits per day
}


class RateLimiter:
    def __init__(self, rules: dict[str, Rule] | None = None, clock=time.monotonic):
        self.rules = dict(DEFAULT_RULES if rules is None else rules)
        self.clock = clock
        self._b: dict[tuple[str, str], list[float]] = {}   # (rule, ip) -> [tokens, last]
        self._lock = threading.Lock()
        self._sweep_at = clock() + 600

    def hit(self, ip: str, *names: str) -> float:
        """Charge one request against every named rule. Returns 0 if allowed, else seconds to wait."""
        now = self.clock()
        with self._lock:
            if now > self._sweep_at:
                self._sweep(now)
            states = []
            wait = 0.0
            for n in names:
                r = self.rules[n]
                st = self._b.get((n, ip))
                if st is None:
                    st = [r.capacity, now]
                tokens = min(r.capacity, st[0] + (now - st[1]) * r.per_second)
                if tokens < 1:
                    wait = max(wait, (1 - tokens) / r.per_second)
                states.append((n, tokens))
            if wait > 0:
                return wait
            for n, tokens in states:
                self._b[(n, ip)] = [tokens - 1, now]
            return 0.0

    def _sweep(self, now: float):
        dead = [k for k, (tok, last) in self._b.items()
                if tok + (now - last) * self.rules[k[0]].per_second >= self.rules[k[0]].capacity]
        for k in dead:
            del self._b[k]
        self._sweep_at = now + 600
