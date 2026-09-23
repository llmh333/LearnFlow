CREATE TABLE ai_conversation
(
    id          BIGSERIAL PRIMARY KEY,
    language_id SMALLINT REFERENCES language (id),
    mode        VARCHAR(30) NOT NULL,
    scenario    VARCHAR(100),
    started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at    TIMESTAMPTZ,
    summary     TEXT
);

CREATE TABLE ai_message
(
    id              BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT      NOT NULL REFERENCES ai_conversation (id) ON DELETE CASCADE,
    role            VARCHAR(10) NOT NULL,
    content         TEXT        NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_message_conversation ON ai_message (conversation_id);
