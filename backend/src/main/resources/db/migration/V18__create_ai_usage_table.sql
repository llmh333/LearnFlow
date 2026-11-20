-- local_date is the day in the user's timezone, so the quota resets at the user's midnight.
CREATE TABLE ai_usage
(
    user_id    BIGINT      NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    local_date DATE        NOT NULL,
    feature    VARCHAR(30) NOT NULL CHECK (feature IN ('GRAMMAR_EXPLAIN', 'EXAMPLES', 'SENTENCE_CORRECTION',
                                                       'CONVERSATION', 'CONVERSATION_SUMMARY')),
    call_count INT         NOT NULL CHECK (call_count > 0),
    PRIMARY KEY (user_id, local_date, feature)
);
