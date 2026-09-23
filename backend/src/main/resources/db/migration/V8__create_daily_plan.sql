CREATE TABLE daily_plan
(
    id                BIGSERIAL PRIMARY KEY,
    plan_date         DATE        NOT NULL UNIQUE,
    available_minutes INT         NOT NULL,
    intro             TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE daily_plan_item
(
    id             BIGSERIAL PRIMARY KEY,
    daily_plan_id  BIGINT       NOT NULL REFERENCES daily_plan (id) ON DELETE CASCADE,
    language_id    SMALLINT REFERENCES language (id),
    minutes        INT          NOT NULL,
    kind           VARCHAR(30)  NOT NULL,
    description    TEXT         NOT NULL,
    target_ref     BIGINT,
    completed      BOOLEAN      NOT NULL DEFAULT false,
    display_order  INT          NOT NULL DEFAULT 0
);

CREATE INDEX idx_daily_plan_item_plan ON daily_plan_item (daily_plan_id);
