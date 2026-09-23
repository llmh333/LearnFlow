package com.learnflow.backend.ai.context;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.learnflow.backend.srs.ReviewService;
import com.learnflow.backend.srs.dto.ScheduleSnapshot;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AIContextBuilderTest {

    private static final Long USER_ID = 1L;

    @Mock private ReviewService reviewService;

    private AIContextBuilder builder;

    @BeforeEach
    void setUp() {
        builder = new AIContextBuilder(reviewService);
    }

    @Test
    void build_noWordsEngagedYet_returnsBeginnerLevelAndNoWeakWords() {
        when(reviewService.allSchedules(USER_ID, "en")).thenReturn(List.of());

        LearnerContext context = builder.build(USER_ID, "en");

        assertThat(context.currentLevel()).isEqualTo("A1");
        assertThat(context.weakWords()).isEmpty();
    }

    @Test
    void build_english_picksHighestCefrLevelAmongEngagedWords() {
        when(reviewService.allSchedules(USER_ID, "en"))
                .thenReturn(
                        List.of(
                                snapshot(1L, "achieve", Map.of("cefrLevel", "B1"), "2.50", 3),
                                snapshot(2L, "elaborate", Map.of("cefrLevel", "C1"), "2.30", 2),
                                snapshot(3L, "untouched", Map.of("cefrLevel", "C2"), "2.50", 0)));

        LearnerContext context = builder.build(USER_ID, "en");

        // "untouched" has reviewCount 0 so it's excluded from level estimation and weak words.
        assertThat(context.currentLevel()).isEqualTo("C1");
    }

    @Test
    void build_chinese_picksHighestHskLevelAmongEngagedWords() {
        when(reviewService.allSchedules(USER_ID, "zh"))
                .thenReturn(
                        List.of(
                                snapshot(1L, "学习", Map.of("hskLevel", 2), "2.50", 3),
                                snapshot(2L, "提高", Map.of("hskLevel", 4), "2.50", 1)));

        LearnerContext context = builder.build(USER_ID, "zh");

        assertThat(context.currentLevel()).isEqualTo("HSK 4");
    }

    @Test
    void build_japanese_picksHighestJlptLevelAmongEngagedWords() {
        when(reviewService.allSchedules(USER_ID, "ja"))
                .thenReturn(
                        List.of(
                                snapshot(1L, "勉強", Map.of("jlptLevel", "N5"), "2.50", 5),
                                snapshot(2L, "経済", Map.of("jlptLevel", "N2"), "2.50", 1)));

        LearnerContext context = builder.build(USER_ID, "ja");

        assertThat(context.currentLevel()).isEqualTo("N2");
    }

    @Test
    void build_limitsWeakWordsToTenAndSortsByLowestEaseFactorFirst() {
        List<ScheduleSnapshot> many =
                java.util.stream.IntStream.range(0, 15)
                        .mapToObj(
                                i ->
                                        snapshot(
                                                (long) i,
                                                "word" + i,
                                                Map.of(),
                                                String.valueOf(1.30 + i * 0.05),
                                                i + 1))
                        .toList();
        when(reviewService.allSchedules(USER_ID, "en")).thenReturn(many);

        LearnerContext context = builder.build(USER_ID, "en");

        assertThat(context.weakWords()).hasSize(10);
        assertThat(context.weakWords().get(0)).isEqualTo("word0"); // lowest ease factor (1.30) first
    }

    private ScheduleSnapshot snapshot(
            Long id, String word, Map<String, Object> attributes, String easeFactor, int reviewCount) {
        return new ScheduleSnapshot(
                id,
                word,
                "nghĩa",
                attributes,
                BigDecimal.valueOf(6),
                new BigDecimal(easeFactor),
                reviewCount,
                reviewCount,
                0);
    }
}
