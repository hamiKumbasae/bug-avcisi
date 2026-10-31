"""Settings, read once from environment variables (see deploy/skor-api.env.example)."""

from __future__ import annotations

import os
from dataclasses import dataclass, field


def _bool(v: str | None, default: bool) -> bool:
    if v is None or v == "":
        return default
    return v.strip().lower() in ("1", "true", "yes", "on", "evet")


@dataclass(frozen=True)
class Settings:
    secret: str
    db_host: str = "127.0.0.1"
    db_port: int = 3306
    db_user: str = "oyun"
    db_password: str = ""
    db_name: str = "oyun"
    db_pool: int = 4
    allowed_origins: tuple[str, ...] = ("https://hamikumbasae.github.io",)
    allow_localhost: bool = True
    # Behind cloudflared the TCP peer is 127.0.0.1; only then are CF-Connecting-IP / X-Forwarded-For trusted.
    trust_proxy: bool = True
    run_max_age: int = 12 * 3600
    rate_limits: dict = field(default_factory=dict)

    @staticmethod
    def from_env(env: dict | None = None) -> "Settings":
        e = os.environ if env is None else env
        secret = e.get("SKOR_SECRET", "")
        if len(secret) < 32:
            raise RuntimeError("SKOR_SECRET must be set to at least 32 random characters (openssl rand -hex 32)")
        origins = tuple(o.strip().rstrip("/") for o in e.get("SKOR_ALLOWED_ORIGINS", "https://hamikumbasae.github.io").split(",") if o.strip())
        return Settings(
            secret=secret,
            db_host=e.get("SKOR_DB_HOST", "127.0.0.1"),
            db_port=int(e.get("SKOR_DB_PORT", "3306")),
            db_user=e.get("SKOR_DB_USER", "oyun"),
            db_password=e.get("SKOR_DB_PASSWORD", ""),
            db_name=e.get("SKOR_DB_NAME", "oyun"),
            db_pool=int(e.get("SKOR_DB_POOL", "4")),
            allowed_origins=origins,
            allow_localhost=_bool(e.get("SKOR_ALLOW_LOCALHOST"), True),
            trust_proxy=_bool(e.get("SKOR_TRUST_PROXY"), True),
            run_max_age=int(e.get("SKOR_RUN_MAX_AGE", str(12 * 3600))),
        )
