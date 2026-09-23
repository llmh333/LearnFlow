-- V9's starter vocabulary seed inserted directly into `vocabulary` via raw SQL, bypassing
-- VocabularyService.create() -> ReviewService.createScheduleFor(), which is the only other place
-- a review_schedule row gets created. Those 300 words therefore had no SRS schedule and never
-- showed up as due/new in Review or Dashboard. Same backfill pattern as V4's own trailing INSERT,
-- generalized to any vocabulary row missing a schedule (not just V9's), so this also covers any
-- other future case of vocabulary being inserted outside the normal API path.
INSERT INTO review_schedule (vocabulary_id)
SELECT v.id
FROM vocabulary v
LEFT JOIN review_schedule rs ON rs.vocabulary_id = v.id
WHERE rs.vocabulary_id IS NULL;
