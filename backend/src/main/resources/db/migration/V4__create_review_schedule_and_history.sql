CREATE TABLE review_schedule
(
    vocabulary_id   BIGINT PRIMARY KEY REFERENCES vocabulary (id) ON DELETE CASCADE,
    last_review     TIMESTAMPTZ,
    next_review     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    interval_days   NUMERIC(10, 2) NOT NULL DEFAULT 0,
    ease_factor     NUMERIC(4, 2)  NOT NULL DEFAULT 2.5,
    review_count    INT          NOT NULL DEFAULT 0,
    success_count   INT          NOT NULL DEFAULT 0,
    failure_count   INT          NOT NULL DEFAULT 0,
    memory_strength NUMERIC(5, 2)  NOT NULL DEFAULT 0
);

CREATE INDEX idx_review_schedule_next_review ON review_schedule (next_review);

CREATE TABLE review_history
(
    id                BIGSERIAL PRIMARY KEY,
    vocabulary_id     BIGINT       NOT NULL REFERENCES vocabulary (id) ON DELETE CASCADE,
    -- study_session_id has no FK yet: the study_session table is created in Phase 4. A follow-up
    -- migration in that phase adds the foreign key constraint (never editing this applied file).
    study_session_id  BIGINT,
    reviewed_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    rating            VARCHAR(10)  NOT NULL,
    previous_interval NUMERIC(10, 2),
    new_interval      NUMERIC(10, 2),
    response_time_ms  INT
);

CREATE INDEX idx_review_history_vocabulary ON review_history (vocabulary_id);
CREATE INDEX idx_review_history_reviewed_at ON review_history (reviewed_at);

-- Backfill: every vocabulary word created in Phase 2 (before SRS existed) becomes due immediately.
INSERT INTO review_schedule (vocabulary_id)
SELECT id
FROM vocabulary;
