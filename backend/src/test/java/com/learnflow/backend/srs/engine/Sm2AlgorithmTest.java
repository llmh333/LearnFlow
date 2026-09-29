package com.learnflow.backend.srs.engine;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;

class Sm2AlgorithmTest {

    private final Sm2Algorithm algorithm = new Sm2Algorithm();

    @ParameterizedTest
    @EnumSource(SrsRating.class)
    void apply_brandNewWord_firstReviewIsOneDay_exceptAgain(SrsRating rating) {
        SrsState result = algorithm.apply(SrsState.initial(), rating);

        if (rating == SrsRating.AGAIN) {
            assertThat(result.intervalDays()).isLessThan(1.0).isGreaterThan(0.0);
        } else {
            assertThat(result.intervalDays()).isEqualTo(1.0);
        }
        assertThat(result.reviewCount()).isEqualTo(1);
    }

    @ParameterizedTest
    @EnumSource(
            value = SrsRating.class,
            names = {"HARD", "GOOD", "EASY"})
    void apply_secondReview_sixDays(SrsRating rating) {
        SrsState afterFirst = new SrsState(1.0, 2.5, 1, 1, 0, 100.0);

        SrsState result = algorithm.apply(afterFirst, rating);

        assertThat(result.intervalDays()).isEqualTo(6.0);
        assertThat(result.reviewCount()).isEqualTo(2);
    }

    @ParameterizedTest
    @MethodSource("laterReviewCases")
    void apply_laterReviews_multiplyByEaseFactorOrFixedMultiplier(
            SrsRating rating, double currentInterval, double currentEase, double expectedInterval) {
        SrsState current = new SrsState(currentInterval, currentEase, 3, 3, 0, 100.0);

        SrsState result = algorithm.apply(current, rating);

        assertThat(result.intervalDays()).isCloseTo(expectedInterval, within(0.01));
    }

    static Stream<Arguments> laterReviewCases() {
        return Stream.of(
                // GOOD: interval * newEaseFactor (ease unchanged by GOOD)
                Arguments.of(SrsRating.GOOD, 10.0, 2.5, 25.0),
                // HARD: interval * 1.2 (ease factor drops but doesn't affect the HARD multiplier)
                Arguments.of(SrsRating.HARD, 10.0, 2.5, 12.0),
                // EASY: interval * newEaseFactor * 1.3
                Arguments.of(SrsRating.EASY, 10.0, 2.5, 10.0 * 2.65 * 1.3));
    }

    @Test
    void apply_again_resetsIntervalToShortRelearningStep() {
        SrsState matureWord = new SrsState(30.0, 2.6, 5, 5, 0, 100.0);

        SrsState result = algorithm.apply(matureWord, SrsRating.AGAIN);

        assertThat(result.intervalDays()).isLessThanOrEqualTo(0.01).isGreaterThan(0.0);
        assertThat(result.failureCount()).isEqualTo(1);
        assertThat(result.successCount()).isEqualTo(5);
    }

    @ParameterizedTest
    @EnumSource(
            value = SrsRating.class,
            names = {"HARD", "GOOD", "EASY"})
    void apply_recoveringFromLapse_graduatesToOneDayInsteadOfMultiplyingTheRelearningStep(
            SrsRating rating) {
        // A mature word (interval 30 days) that lapses (AGAIN) drops to the ~10-minute relearning
        // step. The very next successful rating must jump back to a full day, not multiply that
        // ~10-minute value up (0.007 * 2.5 ≈ 0.02 days — which used to leave the word nagging the
        // learner every few minutes/hours despite having just recalled it correctly).
        SrsState afterLapse = algorithm.apply(new SrsState(30.0, 2.5, 5, 5, 0, 100.0), SrsRating.AGAIN);

        SrsState recovered = algorithm.apply(afterLapse, rating);

        assertThat(recovered.intervalDays()).isEqualTo(1.0);
    }

    @Test
    void apply_againOnBrandNewWordThenGood_graduatesToOneDayNotSixDays() {
        // Regression case the old reviewCount==1 shortcut got wrong: a word failed on its very
        // first-ever attempt (reviewCount 0 -> 1 via AGAIN) has never actually been recalled yet,
        // so its first successful review should behave like any word's first success (1 day), not
        // jump straight to the "second review" 6-day interval just because reviewCount is now 1.
        SrsState afterFirstAttemptFailed = algorithm.apply(SrsState.initial(), SrsRating.AGAIN);

        SrsState recovered = algorithm.apply(afterFirstAttemptFailed, SrsRating.GOOD);

        assertThat(recovered.intervalDays()).isEqualTo(1.0);
    }

    @Test
    void apply_easeFactorNeverDropsBelowFloor() {
        SrsState state = SrsState.initial();
        for (int i = 0; i < 50; i++) {
            state = algorithm.apply(state, SrsRating.AGAIN);
        }

        assertThat(state.easeFactor()).isGreaterThanOrEqualTo(1.3);
    }

    @Test
    void apply_isPure_sameInputAlwaysProducesSameOutput() {
        SrsState input = new SrsState(12.5, 2.4, 4, 3, 1, 75.0);

        SrsState first = algorithm.apply(input, SrsRating.GOOD);
        SrsState second = algorithm.apply(input, SrsRating.GOOD);

        assertThat(first).isEqualTo(second);
    }

    @Test
    void apply_again_increasesFailureCountOnly() {
        SrsState current = new SrsState(5.0, 2.5, 2, 2, 0, 100.0);

        SrsState result = algorithm.apply(current, SrsRating.AGAIN);

        assertThat(result.successCount()).isEqualTo(2);
        assertThat(result.failureCount()).isEqualTo(1);
        assertThat(result.reviewCount()).isEqualTo(3);
    }

    @Test
    void apply_nonAgainRatings_increaseSuccessCountOnly() {
        SrsState current = new SrsState(5.0, 2.5, 2, 2, 1, 66.67);

        SrsState result = algorithm.apply(current, SrsRating.GOOD);

        assertThat(result.successCount()).isEqualTo(3);
        assertThat(result.failureCount()).isEqualTo(1);
    }

    @Test
    void apply_memoryStrength_isSuccessRatePercentage() {
        SrsState current = new SrsState(5.0, 2.5, 3, 2, 1, 66.67);

        SrsState result = algorithm.apply(current, SrsRating.GOOD);

        // 3 successes out of 4 total reviews
        assertThat(result.memoryStrength()).isEqualTo(75.0);
    }
}
