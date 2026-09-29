-- Lets each account choose how many brand-new (never-reviewed) words get introduced per day in
-- the Review queue, instead of every due word (including all 300 starter-pack words on day one)
-- being suggested at once. Existing accounts backfill to the same default as new registrations.
ALTER TABLE app_user ADD COLUMN daily_new_words_limit INTEGER NOT NULL DEFAULT 20;
ALTER TABLE app_user ADD CONSTRAINT chk_app_user_daily_new_words_limit
    CHECK (daily_new_words_limit IN (20, 25, 30, 35));
