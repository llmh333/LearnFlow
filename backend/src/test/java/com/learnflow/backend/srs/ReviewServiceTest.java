package com.learnflow.backend.srs;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.learnflow.backend.srs.domain.ReviewHistory;
import com.learnflow.backend.srs.domain.ReviewSchedule;
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
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    private static final Instant NOW = Instant.parse("2026-01-01T00:00:00Z");
    private static final Clock FIXED_CLOCK = Clock.fixed(NOW, ZoneOffset.UTC);

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
        Vocabulary vocabulary = new Vocabulary(null, "achieve", "đạt được", null, (short) 0, java.util.Map.of(), NOW, NOW);
        ReviewSchedule schedule = new ReviewSchedule(vocabulary, NOW.minus(Duration.ofDays(5)));
        schedule.setIntervalDays(BigDecimal.valueOf(6.0).setScale(2));
        schedule.setEaseFactor(BigDecimal.valueOf(2.5).setScale(2));
        schedule.setReviewCount(2);
        schedule.setSuccessCount(2);
        schedule.setFailureCount(0);
        schedule.setMemoryStrength(BigDecimal.valueOf(100.0).setScale(2));
        when(scheduleRepository.findById(1L)).thenReturn(Optional.of(schedule));

        SrsState newState = new SrsState(15.0, 2.5, 3, 3, 0, 100.0);
        when(algorithm.apply(any(SrsState.class), org.mockito.ArgumentMatchers.eq(SrsRating.GOOD)))
                .thenReturn(newState);

        ReviewSubmitResponse response = reviewService.submit(1L, SrsRating.GOOD, 1200, null);

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
        Vocabulary reference = new Vocabulary(null, "word", "nghĩa", null, (short) 0, java.util.Map.of(), NOW, NOW);
        when(entityManager.getReference(Vocabulary.class, 42L)).thenReturn(reference);

        reviewService.createScheduleFor(42L);

        ArgumentCaptor<ReviewSchedule> captor = ArgumentCaptor.forClass(ReviewSchedule.class);
        verify(scheduleRepository).save(captor.capture());
        assertThat(captor.getValue().getNextReview()).isEqualTo(NOW);
        assertThat(captor.getValue().getIntervalDays()).isEqualByComparingTo("0.00");
    }

    @Test
    void createScheduleFor_existingSchedule_isIdempotent() {
        when(scheduleRepository.existsById(42L)).thenReturn(true);

        reviewService.createScheduleFor(42L);

        verify(scheduleRepository, never()).save(any());
        verify(entityManager, never()).getReference(Vocabulary.class, 42L);
    }
}
