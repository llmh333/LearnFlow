-- Daily exercises (sentence-scramble, multiple-choice), generated 2 ways:
-- DETERMINISTIC (built from the user's own vocabulary at request time, no AI) and
-- AI (pre-generated ahead of time by a nightly cron job, see ExerciseGenerationScheduler).
-- payload holds the type-specific content; the answer key (correctTokens/correctOptionIndex) is
-- read only server-side — never sent to the client until after they submit an answer.
CREATE TABLE exercise (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app_user (id),
    language_id SMALLINT NOT NULL REFERENCES language (id),
    vocabulary_id BIGINT REFERENCES vocabulary (id),
    exercise_date DATE NOT NULL,
    type VARCHAR(30) NOT NULL,
    source VARCHAR(20) NOT NULL,
    payload JSONB NOT NULL,
    display_order INT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    correct BOOLEAN,
    answered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exercise_user_date ON exercise (user_id, exercise_date);
CREATE INDEX idx_exercise_user_lang_date_source ON exercise (user_id, language_id, exercise_date, source);
