CREATE TABLE study_session
(
    id             BIGSERIAL PRIMARY KEY,
    language_id    SMALLINT REFERENCES language (id),
    started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at       TIMESTAMPTZ,
    words_reviewed INT         NOT NULL DEFAULT 0,
    words_learned  INT         NOT NULL DEFAULT 0,
    mistakes_count INT         NOT NULL DEFAULT 0
);

-- review_history.study_session_id already exists (added nullable, no FK, in V4) because
-- study_session didn't exist yet at that point. Add the constraint now instead of editing V4.
ALTER TABLE review_history
    ADD CONSTRAINT fk_review_history_study_session
        FOREIGN KEY (study_session_id) REFERENCES study_session (id);
