-- Times used = number of users pointing at the code; no counter to drift.
ALTER TABLE app_user
    ADD COLUMN invite_code_id BIGINT REFERENCES invite_code (id);

CREATE INDEX idx_app_user_invite_code ON app_user (invite_code_id);
