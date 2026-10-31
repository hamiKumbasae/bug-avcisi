from __future__ import annotations

from app.ratelimit import RateLimiter, Rule

BA = "/v1/games/bug-avcisi"
BY = "/v1/games/bogaz-yolu"
ORIGIN = "https://hamikumbasae.github.io"


def start(client, base=BA, mode=None):
    r = client.post(f"{base}/runs", json={"mode": mode} if mode else {})
    assert r.status_code == 201, r.text
    return r.json()["token"]


def play(client, clock, name, score, seconds=600, base=BA, mode=None, meta=None):
    tok = start(client, base, mode)
    clock.advance(seconds)
    return client.post(f"{base}/scores", json={"token": tok, "name": name, "score": score,
                                               "meta": meta if meta is not None else {"start": 0, "cleared": 3}})


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["db"] is True


def test_games_listed(client):
    ids = {g["id"]: g["modes"] for g in client.get("/v1/games").json()["games"]}
    assert ids == {"bug-avcisi": ["normal"], "bogaz-yolu": ["bogaz", "tur"]}


def test_submit_and_top(client, clock):
    r = play(client, clock, "Hami", 42_000)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["rank"] == 1 and body["personal_best"] is True and body["best"] == 42_000
    assert play(client, clock, "Ayşe", 50_000).status_code == 201
    top = client.get(f"{BA}/scores").json()
    assert [(e["rank"], e["name"], e["score"]) for e in top["entries"]] == [(1, "Ayşe", 50_000), (2, "Hami", 42_000)]
    assert top["entries"][0]["at"].endswith("Z")


def test_one_entry_per_player_case_insensitive_turkish(client, clock):
    play(client, clock, "HAMİ", 10_000)
    r = play(client, clock, "hami", 20_000)
    assert r.json()["personal_best"] is True
    r = play(client, clock, "Hami", 15_000)
    assert r.json()["personal_best"] is False and r.json()["best"] == 20_000
    entries = client.get(f"{BA}/scores").json()["entries"]
    assert len(entries) == 1 and entries[0]["score"] == 20_000 and entries[0]["name"] == "hami"
    # "IŞIK" and "ışık" are the same player, "İŞİK" is not (Turkish dotted/dotless i)
    play(client, clock, "IŞIK", 5_000)
    play(client, clock, "ışık", 6_000)
    assert len(client.get(f"{BA}/scores").json()["entries"]) == 2


def test_week_period(client, clock):
    play(client, clock, "Eski", 90_000)
    clock.advance(8 * 86400)       # next week
    play(client, clock, "Yeni", 30_000)
    week = client.get(f"{BA}/scores", params={"period": "week"}).json()["entries"]
    assert [e["name"] for e in week] == ["Yeni"]
    alltime = client.get(f"{BA}/scores").json()["entries"]
    assert [e["name"] for e in alltime] == ["Eski", "Yeni"]


def test_limit_param(client, clock):
    for i in range(12):
        play(client, clock, f"Oyuncu{i:02d}", 1000 * (i + 1))
    assert len(client.get(f"{BA}/scores").json()["entries"]) == 10
    assert len(client.get(f"{BA}/scores", params={"limit": 3}).json()["entries"]) == 3
    assert client.get(f"{BA}/scores", params={"limit": 500}).status_code == 422


def test_player_best(client, clock):
    play(client, clock, "Hami", 10_000)
    play(client, clock, "Hami", 30_000)
    play(client, clock, "Zeynep", 40_000)
    r = client.get(f"{BA}/players/hAmi")
    assert r.status_code == 200
    j = r.json()
    assert j["best"] == 30_000 and j["runs"] == 2 and j["rank"] == 2 and j["week_best"] == 30_000
    assert client.get(f"{BA}/players/Yok").status_code == 404


def test_token_single_use(client, clock):
    tok = start(client)
    clock.advance(300)
    payload = {"token": tok, "name": "Hami", "score": 5000, "meta": {"start": 0, "cleared": 1}}
    assert client.post(f"{BA}/scores", json=payload).status_code == 201
    r = client.post(f"{BA}/scores", json=payload)
    assert r.status_code == 409 and r.json()["detail"]["code"] == "token_used"


def test_token_required_and_signed(client, clock):
    r = client.post(f"{BA}/scores", json={"token": "x" * 30, "name": "Hami", "score": 100})
    assert r.status_code == 403
    tok = start(client)
    payload, sig = tok.split(".")
    forged = payload + "." + ("A" if sig[0] != "A" else "B") + sig[1:]
    r = client.post(f"{BA}/scores", json={"token": forged, "name": "Hami", "score": 100})
    assert r.status_code == 403 and r.json()["detail"]["code"] == "token_invalid"
    r = client.post(f"{BA}/scores", json={"name": "Hami", "score": 100})
    assert r.status_code == 422


def test_token_bound_to_game(client, clock):
    tok = start(client, BY, "bogaz")
    clock.advance(100)
    r = client.post(f"{BA}/scores", json={"token": tok, "name": "Hami", "score": 100})
    assert r.status_code == 403


def test_token_expires(client, clock):
    tok = start(client)
    clock.advance(13 * 3600)
    r = client.post(f"{BA}/scores", json={"token": tok, "name": "Hami", "score": 100})
    assert r.status_code == 410 and r.json()["detail"]["code"] == "token_expired"


def test_bad_names_rejected(client, clock):
    for name, code in [("A", "name_short"), ("x" * 17, "name_long"), ("<script>", "name_chars"), ("1234", "name_chars"),
                       ("orospu", "name_blocked"), ("Admin", "name_blocked")]:
        r = play(client, clock, name, 100)
        assert r.status_code == 422, name
        assert r.json()["detail"]["code"] == code, name


def test_bug_avcisi_plausibility(client, clock):
    # not a multiple of 50
    r = play(client, clock, "Hami", 1234)
    assert r.json()["detail"]["code"] == "score_implausible"
    # 36 stages in 60 seconds
    r = play(client, clock, "Hami", 1000, seconds=60, meta={"start": 0, "cleared": 36, "finished": True})
    assert r.json()["detail"]["code"] == "too_fast"
    # absurd score for a 30 s run with nothing cleared (cap: 80k + 600*30 = 98k)
    r = play(client, clock, "Hami", 500_000, seconds=30, meta={"start": 0, "cleared": 0})
    assert r.json()["detail"]["code"] == "score_implausible"
    assert play(client, clock, "Hami", 98_000, seconds=30, meta={"start": 0, "cleared": 0}).status_code == 201
    # finished must mean the last stage was cleared
    r = play(client, clock, "Hami", 1000, meta={"start": 3, "cleared": 2, "finished": True})
    assert r.json()["detail"]["code"] == "meta_invalid"
    r = play(client, clock, "Hami", 1000, meta={"start": 30, "cleared": 10})
    assert r.json()["detail"]["code"] == "meta_invalid"
    r = play(client, clock, "Hami", 1000, meta={"start": "0", "cleared": 1})
    assert r.json()["detail"]["code"] == "meta_invalid"
    # a full, realistic run: 36 stages in 2 hours, 1.2M points
    r = play(client, clock, "Hami", 1_200_000, seconds=7200, meta={"start": 0, "cleared": 36, "finished": True})
    assert r.status_code == 201, r.text


def test_bogaz_yolu_modes_and_plausibility(client, clock):
    # realistic finished Boğaz Yolu run (bot in the game's tests: ~470k in ~290 s)
    r = play(client, clock, "Hami", 471_184, seconds=295, base=BY, mode="bogaz", meta={"finished": True, "stage": 6})
    assert r.status_code == 201, r.text
    assert r.json()["mode"] == "bogaz"
    # İstanbul Turu is a separate board
    r = play(client, clock, "Hami", 580_000, seconds=360, base=BY, mode="tur", meta={"finished": True, "stage": 16})
    assert r.status_code == 201, r.text
    assert client.get(f"{BY}/scores", params={"mode": "bogaz"}).json()["entries"][0]["score"] == 471_184
    assert client.get(f"{BY}/scores", params={"mode": "tur"}).json()["entries"][0]["score"] == 580_000
    # finishing faster than the track allows
    r = play(client, clock, "Hami", 300_000, seconds=120, base=BY, mode="bogaz", meta={"finished": True})
    assert r.json()["detail"]["code"] == "too_fast"
    # time-up run: no finish bonus, at most 1500 points per second
    r = play(client, clock, "Hami", 200_000, seconds=100, base=BY, mode="bogaz", meta={"finished": False, "stage": 1})
    assert r.json()["detail"]["code"] == "score_implausible"
    assert play(client, clock, "Hami", 140_000, seconds=100, base=BY, mode="bogaz",
                meta={"finished": False, "stage": 1}).status_code == 201
    # above the absolute cap of the course
    r = play(client, clock, "Hami", 650_000, seconds=3000, base=BY, mode="bogaz", meta={"finished": True})
    assert r.json()["detail"]["code"] == "score_implausible"
    # unknown mode / game
    assert client.post(f"{BY}/runs", json={"mode": "drift"}).status_code == 400
    assert client.post("/v1/games/tetris/runs", json={}).status_code == 404
    assert client.get("/v1/games/Bad Id!/scores").status_code == 422


def test_cors(client):
    r = client.options(f"{BA}/scores", headers={"Origin": ORIGIN, "Access-Control-Request-Method": "POST",
                                                  "Access-Control-Request-Headers": "content-type"})
    assert r.status_code == 200 and r.headers["access-control-allow-origin"] == ORIGIN
    r = client.get(f"{BA}/scores", headers={"Origin": "http://localhost:8000"})
    assert r.headers["access-control-allow-origin"] == "http://localhost:8000"
    r = client.get(f"{BA}/scores", headers={"Origin": "https://evil.example"})
    assert "access-control-allow-origin" not in r.headers
    r = client.get(f"{BA}/scores", headers={"Origin": "https://hamikumbasae.github.io.evil.example"})
    assert "access-control-allow-origin" not in r.headers


def test_rate_limit_per_ip(make_client, clock):
    lim = RateLimiter({"read": Rule(1000, 1000), "run": Rule(3, 0.001), "score": Rule(1000, 1000),
                       "score_day": Rule(1000, 1000)}, clock=clock)
    c = make_client(lim)
    for _ in range(3):
        assert c.post(f"{BA}/runs", json={}).status_code == 201
    r = c.post(f"{BA}/runs", json={})
    assert r.status_code == 429 and int(r.headers["retry-after"]) > 0
    # a different client IP behind the tunnel is not affected
    # (TestClient's peer is "testclient", which is not loopback, so forwarded headers are ignored: same bucket)
    r = c.post(f"{BA}/runs", json={}, headers={"CF-Connecting-IP": "203.0.113.9"})
    assert r.status_code == 429


def test_db_down_is_503(settings, clock):
    from dataclasses import replace

    from fastapi.testclient import TestClient

    from app.db import Database
    from app.main import create_app

    bad = replace(settings, db_port=1)       # nothing listens there
    c = TestClient(create_app(bad, clock=clock, db=Database(bad)))
    assert c.get("/health").status_code == 503
    r = c.get(f"{BA}/scores")
    assert r.status_code == 503 and r.json()["detail"]["code"] == "db_unavailable"


def test_tunnel_client_ip_from_loopback_peer(settings, db, clock):
    """Behind cloudflared the peer is 127.0.0.1: CF-Connecting-IP then decides the rate-limit bucket."""
    from fastapi.testclient import TestClient

    from app.main import create_app

    lim = RateLimiter({"read": Rule(1000, 1000), "run": Rule(1, 0.001), "score": Rule(1000, 1000),
                       "score_day": Rule(1000, 1000)}, clock=clock)
    c = TestClient(create_app(settings, clock=clock, db=db, limiter=lim), client=("127.0.0.1", 50000))
    assert c.post(f"{BA}/runs", json={}, headers={"CF-Connecting-IP": "198.51.100.1"}).status_code == 201
    assert c.post(f"{BA}/runs", json={}, headers={"CF-Connecting-IP": "198.51.100.1"}).status_code == 429
    assert c.post(f"{BA}/runs", json={}, headers={"CF-Connecting-IP": "198.51.100.2"}).status_code == 201
