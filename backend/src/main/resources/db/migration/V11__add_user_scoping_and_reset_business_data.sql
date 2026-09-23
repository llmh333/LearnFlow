-- Multi-tenancy retrofit: every domain table gets a user_id, so accounts stop sharing data.
-- `language` and `mistake_category` stay global (shared reference tables, not user data).
--
-- Existing business data has no recorded owner (it predates this fix) and cannot be attributed
-- retroactively, so per product decision it is wiped rather than backfilled to a guessed owner.
-- app_user and language are untouched.
TRUNCATE TABLE
    ai_message,
    ai_conversation,
    daily_plan_item,
    daily_plan,
    mistake,
    review_history,
    review_schedule,
    study_session,
    vocabulary_tag_link,
    vocabulary_tag,
    vocabulary
    RESTART IDENTITY CASCADE;

ALTER TABLE vocabulary ADD COLUMN user_id BIGINT NOT NULL REFERENCES app_user (id);
ALTER TABLE vocabulary_tag ADD COLUMN user_id BIGINT NOT NULL REFERENCES app_user (id);
ALTER TABLE review_schedule ADD COLUMN user_id BIGINT NOT NULL REFERENCES app_user (id);
ALTER TABLE review_history ADD COLUMN user_id BIGINT NOT NULL REFERENCES app_user (id);
ALTER TABLE study_session ADD COLUMN user_id BIGINT NOT NULL REFERENCES app_user (id);
ALTER TABLE ai_conversation ADD COLUMN user_id BIGINT NOT NULL REFERENCES app_user (id);
ALTER TABLE mistake ADD COLUMN user_id BIGINT NOT NULL REFERENCES app_user (id);
ALTER TABLE daily_plan ADD COLUMN user_id BIGINT NOT NULL REFERENCES app_user (id);

-- Replace the old global-uniqueness constraints with per-user ones.
ALTER TABLE vocabulary_tag DROP CONSTRAINT vocabulary_tag_name_key;
ALTER TABLE vocabulary_tag
    ADD CONSTRAINT uq_vocabulary_tag_user_name UNIQUE (user_id, name);

ALTER TABLE daily_plan DROP CONSTRAINT daily_plan_plan_date_key;
ALTER TABLE daily_plan
    ADD CONSTRAINT uq_daily_plan_user_date UNIQUE (user_id, plan_date);

-- User-scoped indexes for the hot paths. Drop the old global next_review index — the new
-- composite one below covers the same lookups, now correctly scoped per user.
DROP INDEX idx_review_schedule_next_review;

CREATE INDEX idx_vocabulary_user ON vocabulary (user_id);
CREATE INDEX idx_review_schedule_user_next_review ON review_schedule (user_id, next_review);
CREATE INDEX idx_review_history_user ON review_history (user_id);
CREATE INDEX idx_study_session_user ON study_session (user_id);
CREATE INDEX idx_ai_conversation_user ON ai_conversation (user_id);

DROP INDEX idx_mistake_topic_category;
CREATE INDEX idx_mistake_user_topic_category ON mistake (user_id, language_id, category_id, topic);

CREATE INDEX idx_daily_plan_user ON daily_plan (user_id);
