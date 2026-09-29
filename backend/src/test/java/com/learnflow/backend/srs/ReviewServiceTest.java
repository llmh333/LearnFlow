package com.learnflow.backend.srs;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.learnflow.backend.language.domain.Language;
import com.learnflow.backend.srs.domain.ReviewHistory;
import com.learnflow.backend.srs.domain.ReviewSchedule;
import com.learnflow.backend.srs.dto.DueVocabularyResponse;
import com.learnflow.backend.srs.dto.ReviewSubmitResponse;
import com.learnflow.backend.srs.engine.SrsAlgorithm;
import com.learnflow.backend.srs.engine.SrsRating;
import com.learnflow.backend.srs.engine.SrsState;
import com.learnflow.backend.vocabulary.domain.Vocabulary;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    private static final Instant NOW = Instant.parse("2026-01-01T00:00:00Z");
    private static final Clock FIXED_CLOCK = Clock.fixed(NOW, ZoneOffset.UTC);
    private static final Long USER_ID = 1L;

    @Mock private ReviewScheduleRepository scheduleRepository;
    @Mock private ReviewHistoryRepository historyRepository;
    @Mock private SrsAlgorithm algorithm;
    @Mock private EntityManager entityManager;

    @Captor private ArgumentCaptor<ReviewHistory> historyCaptor;

    private ReviewService reviewService;

    @BeforeEach
    void setUp() {
        reviewService =
                new ReviewService(scheduleRepository, historyRepository, algorithm, entityManager, FIXED_CLOCK);
    }

    @Test
    void submit_computesNextReviewFromFixedClockPlusAlgorithmInterval() {
        Vocabulary vocabulary =
                new Vocabulary(null, null, "achieve", "đạt được", null, (short) 0, java.util.Map.of(), NOW, NOW);
        ReviewSchedule schedule = new ReviewSchedule(vocabulary, null, NOW.minus(Duration.ofDays(5)));
        schedule.setIntervalDays(BigDecimal.valueOf(6.0).setScale(2));
        schedule.setEaseFactor(BigDecimal.valueOf(2.5).setScale(2));
        schedule.setReviewCount(2);
        schedule.setSuccessCount(2);
        schedule.setFailureCount(0);
        schedule.setMemoryStrength(BigDecimal.valueOf(100.0).setScale(2));
        when(scheduleRepository.findByVocabularyIdAndUser_Id(1L, USER_ID)).thenReturn(Optional.of(schedule));

        SrsState newState = new SrsState(15.0, 2.5, 3, 3, 0, 100.0);
        when(algorithm.apply(any(SrsState.class), org.mockito.ArgumentMatchers.eq(SrsRating.GOOD)))
                .thenReturn(newState);

        ReviewSubmitResponse response = reviewService.submit(USER_ID, 1L, SrsRating.GOOD, 1200, null);

        assertThat(response.nextReview()).isEqualTo(NOW.plus(Duration.ofDays(15)));
        assertThat(response.intervalDays()).isEqualByComparingTo("15.00");
        assertThat(response.reviewCount()).isEqualTo(3);

        verify(historyRepository).save(historyCaptor.capture());
        ReviewHistory savedHistory = historyCaptor.getValue();
        assertThat(savedHistory.getPreviousInterval()).isEqualByComparingTo("6.00");
        assertThat(savedHistory.getNewInterval()).isEqualByComparingTo("15.00");
        assertThat(savedHistory.getRating()).isEqualTo(SrsRating.GOOD);
        assertThat(savedHistory.getResponseTimeMs()).isEqualTo(1200);
        assertThat(savedHistory.getReviewedAt()).isEqualTo(NOW);
    }

    @Test
    void createScheduleFor_newVocabulary_createsScheduleDueNow() {
        when(scheduleRepository.existsById(42L)).thenReturn(false);
        Vocabulary vocabularyRef =
                new Vocabulary(null, null, "word", "nghĩa", null, (short) 0, java.util.Map.of(), NOW, NOW);
        when(entityManager.getReference(Vocabulary.class, 42L)).thenReturn(vocabularyRef);

        reviewService.createScheduleFor(USER_ID, 42L);

        ArgumentCaptor<ReviewSchedule> captor = ArgumentCaptor.forClass(ReviewSchedule.class);
        verify(scheduleRepository).save(captor.capture());
        assertThat(captor.getValue().getNextReview()).isEqualTo(NOW);
        assertThat(captor.getValue().getIntervalDays()).isEqualByComparingTo("0.00");
    }

    @Test
    void createScheduleFor_existingSchedule_isIdempotent() {
        when(scheduleRepository.existsById(42L)).thenReturn(true);

        reviewService.createScheduleFor(USER_ID, 42L);

        verify(scheduleRepository, never()).save(any());
        verify(entityManager, never()).getReference(Vocabulary.class, 42L);
    }

    @Test
    void findDue_reviewedWordsAreNeverCappedByTheDailyNewWordsLimit() {
        ReviewSchedule reviewed1 = buildSchedule(1L, 3);
        ReviewSchedule reviewed2 = buildSchedule(2L, 5);
        when(scheduleRepository.findDueReviewedByUserId(eq(USER_ID), eq(NOW), any()))
                .thenReturn(List.of(reviewed1, reviewed2));
        // Allowance already exhausted for today (20 new words already introduced).
        when(historyRepository.findVocabularyIdsFirstReviewedSince(eq(USER_ID), isNull(), any()))
                .thenReturn(placeholderIds(20));

        List<DueVocabularyResponse> result = reviewService.findDue(USER_ID, null, 50, 20);

        assertThat(result).extracting(DueVocabularyResponse::vocabularyId).containsExactly(1L, 2L);
        verify(scheduleRepository, never()).findDueNewByUserId(any(), any(), any());
    }

    @Test
    void findDue_newWordAllowance_reducedByWordsAlreadyIntroducedToday() {
        when(scheduleRepository.findDueReviewedByUserId(eq(USER_ID), eq(NOW), any())).thenReturn(List.of());
        when(historyRepository.findVocabularyIdsFirstReviewedSince(eq(USER_ID), isNull(), any()))
                .thenReturn(placeholderIds(3));
        when(scheduleRepository.findDueNewByUserId(eq(USER_ID), eq(NOW), any())).thenReturn(List.of());

        reviewService.findDue(USER_ID, null, 50, 20);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(scheduleRepository).findDueNewByUserId(eq(USER_ID), eq(NOW), pageableCaptor.capture());
        assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(17); // 20 - 3 already introduced
    }

    @Test
    void findDue_newWordsWithinAllowance_areAppendedAfterReviewedWords() {
        ReviewSchedule reviewed = buildSchedule(1L, 3);
        ReviewSchedule brandNew = buildSchedule(2L, 0);
        when(scheduleRepository.findDueReviewedByUserId(eq(USER_ID), eq(NOW), any()))
                .thenReturn(List.of(reviewed));
        when(historyRepository.findVocabularyIdsFirstReviewedSince(eq(USER_ID), isNull(), any()))
                .thenReturn(List.of());
        when(scheduleRepository.findDueNewByUserId(eq(USER_ID), eq(NOW), any()))
                .thenReturn(List.of(brandNew));

        List<DueVocabularyResponse> result = reviewService.findDue(USER_ID, null, 50, 20);

        assertThat(result).extracting(DueVocabularyResponse::vocabularyId).containsExactly(1L, 2L);
    }

    private ReviewSchedule buildSchedule(Long vocabularyId, int reviewCount) {
        Language language = new Language("en", "English");
        Vocabulary vocabulary =
                new Vocabulary(
                        null, language, "word" + vocabularyId, "nghĩa", null, (short) 0, java.util.Map.of(), NOW, NOW);
        setField(vocabulary, "id", vocabularyId);
        ReviewSchedule schedule = new ReviewSchedule(vocabulary, null, NOW);
        schedule.setReviewCount(reviewCount);
        return schedule;
    }

    private List<Long> placeholderIds(int count) {
        return java.util.stream.LongStream.range(0, count).boxed().toList();
    }

    private static void setField(Object target, String fieldName, Object value) {
        try {
            var field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException(e);
        }
    }
}
