-- 1–1 with app_user. timezone is an IANA id, validated with java.time.ZoneId (the DB cannot).
CREATE TABLE user_profile
(
    user_id         BIGINT PRIMARY KEY REFERENCES app_user (id) ON DELETE CASCADE,
    timezone        VARCHAR(64) NOT NULL CHECK (timezone <> ''),
    goal            VARCHAR(20) CHECK (goal IN ('JLPT', 'CONVERSATION', 'TRAVEL')),
    daily_minutes   SMALLINT    NOT NULL CHECK (daily_minutes IN (5, 10, 15, 20)),
    daily_new_items SMALLINT    NOT NULL CHECK (daily_new_items BETWEEN 0 AND 50),
    onboarded_at    TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ NOT NULL
);
