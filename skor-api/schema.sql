-- skor-api: one table for every game. Run as the MariaDB root user (deploy/kurulum.sh does this).
-- created_at is always UTC (written by the API, not by the server clock).

CREATE TABLE IF NOT EXISTS scores (
  id          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  game        VARCHAR(32)      NOT NULL,              -- e.g. 'bug-avcisi', 'bogaz-yolu'
  mode        VARCHAR(16)      NOT NULL,              -- e.g. 'normal', 'bogaz', 'tur'
  name        VARCHAR(16)      NOT NULL,              -- as typed (cleaned)
  name_key    VARCHAR(16)      NOT NULL,              -- Turkish-aware lowercase, groups "Hami" and "HAMİ"
  score       INT UNSIGNED     NOT NULL,
  run_id      CHAR(22)         NOT NULL,              -- from the signed run token; UNIQUE makes tokens single-use
  duration_s  INT UNSIGNED     NOT NULL,              -- measured by the server (token issue -> submit)
  meta        VARCHAR(400)     NOT NULL DEFAULT '{}', -- small JSON blob the game sends (stage, ending, ...)
  ip_hash     CHAR(16)         NOT NULL,              -- keyed hash, never the raw IP
  created_at  DATETIME         NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_run (run_id),
  KEY idx_board (game, mode, score),
  KEY idx_week (game, mode, created_at),
  KEY idx_player (game, mode, name_key, score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
