CREATE TABLE ai_conversation
(
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES app_user (id),
    -- Exception to "only course carries language": a conversation has no content to derive it from.
    language_id SMALLINT     NOT NULL REFERENCES language (id),
    mode        VARCHAR(30)  NOT NULL CHECK (mode IN ('CONVERSATION')),
    scenario    VARCHAR(100),
    started_at  TIMESTAMPTZ  NOT NULL,
    ended_at    TIMESTAMPTZ CHECK (ended_at >= started_at),
    summary     TEXT
);

CREATE INDEX idx_ai_conversation_user ON ai_conversation (user_id, started_at DESC);
