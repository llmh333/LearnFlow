CREATE TABLE ai_message
(
    id              BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT      NOT NULL REFERENCES ai_conversation (id) ON DELETE CASCADE,
    role            VARCHAR(10) NOT NULL CHECK (role IN ('USER', 'ASSISTANT')),
    content         TEXT        NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_ai_message_conversation ON ai_message (conversation_id, created_at);
