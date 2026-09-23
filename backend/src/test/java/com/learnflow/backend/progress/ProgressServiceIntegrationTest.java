package com.learnflow.backend.progress;

import static org.assertj.core.api.Assertions.assertThat;

import com.learnflow.backend.auth.dto.AuthResponse;
import com.learnflow.backend.auth.dto.RegisterRequest;
import com.learnflow.backend.common.AbstractIntegrationTest;
import com.learnflow.backend.progress.dto.ProgressSummaryResponse;
import com.learnflow.backend.progress.dto.RetentionResponse;
import com.learnflow.backend.progress.dto.WeakAreaResponse;
import com.learnflow.backend.srs.dto.ReviewSubmitRequest;
import com.learnflow.backend.srs.engine.SrsRating;
import com.learnflow.backend.vocabulary.dto.VocabularyRequest;
import com.learnflow.backend.vocabulary.dto.VocabularyResponse;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.client.RestTestClient;

/**
 * Runs against the same shared Testcontainers Postgres as every other integration test in the
 * suite, but every domain table is scoped per account (decision D18, reversing D7), and this
 * class's {@code @BeforeEach} registers a brand-new account per test method — so absolute counts
 * are safe: this account has never touched any other test's data.
 */
class ProgressServiceIntegrationTest extends AbstractIntegrationTest {

    @LocalServerPort private int port;

    private RestTestClient client;
    private String authHeader;

    @BeforeEach
    void setUp() {
        client = RestTestClient.bindToServer().baseUrl("http://localhost:" + port).build();

        String email = "progress-" + System.nanoTime() + "@example.com";
        RegisterRequest register = new RegisterRequest(email, "password123", "Progress Tester");
        AuthResponse auth =
                client.post()
                        .uri("/api/auth/register")
                        .body(register)
                        .exchange()
                        .expectStatus()
                        .is2xxSuccessful()
                        .expectBody(AuthResponse.class)
                        .returnResult()
                        .getResponseBody();
        authHeader = "Bearer " + auth.token();
    }

    @Test
    void summaryRetentionAndWeakAreas_matchHandComputedSeedData() {
        String suffix = "-" + System.nanoTime();
        Long word1 = createVocab("achieve" + suffix); // GOOD then AGAIN -> learning, weak
        Long word2 = createVocab("banana" + suffix); // 4x GOOD -> mastered (interval>=21, ease=2.5)
        Long word3 = createVocab("cactus" + suffix); // untouched -> stays "new"

        submit(word1, SrsRating.GOOD); // rc0->1: interval 1, ease 2.5
        submit(word1, SrsRating.AGAIN); // ease -> 2.30, relearning interval

        submit(word2, SrsRating.GOOD); // interval 1
        submit(word2, SrsRating.GOOD); // interval 6
        submit(word2, SrsRating.GOOD); // interval 15
        submit(word2, SrsRating.GOOD); // interval 37.5, ease 2.5 -> mastered

        ProgressSummaryResponse summary = fetchSummary();
        assertThat(summary.total()).isEqualTo(3);
        assertThat(summary.newCount()).isEqualTo(1); // word3
        assertThat(summary.masteredCount()).isEqualTo(1); // word2
        assertThat(summary.learningCount()).isEqualTo(1); // word1
        assertThat(summary.dueCount()).isEqualTo(1); // word3 (never reviewed yet)

        RetentionResponse retention = fetchRetention();
        assertThat(retention.successCount()).isEqualTo(5);
        assertThat(retention.totalCount()).isEqualTo(6);

        List<WeakAreaResponse> weakAreas = fetchWeakAreas(500);
        int word1Index = indexOfVocabularyId(weakAreas, word1);
        int word2Index = indexOfVocabularyId(weakAreas, word2);
        assertThat(word1Index).isGreaterThanOrEqualTo(0);
        assertThat(word2Index).isGreaterThanOrEqualTo(0);
        assertThat(word1Index).isLessThan(word2Index); // word1 (ease 2.30) is weaker than word2 (2.50)
        assertThat(weakAreas.get(word1Index).easeFactor()).isEqualByComparingTo("2.30");
        assertThat(weakAreas.get(word1Index).failureCount()).isEqualTo(1);
    }

    @Test
    void anotherUsersActivity_neverAppearsInMyProgress() {
        createVocab("isolated-" + System.nanoTime());
        submit(createVocab("isolated2-" + System.nanoTime()), SrsRating.GOOD);

        String otherEmail = "progress-other-" + System.nanoTime() + "@example.com";
        AuthResponse otherAuth =
                client.post()
                        .uri("/api/auth/register")
                        .body(new RegisterRequest(otherEmail, "password123", "Other Progress Tester"))
                        .exchange()
                        .expectStatus()
                        .is2xxSuccessful()
                        .expectBody(AuthResponse.class)
                        .returnResult()
                        .getResponseBody();
        String otherHeader = "Bearer " + otherAuth.token();

        ProgressSummaryResponse othersSummary =
                client.get()
                        .uri("/api/progress/summary?language=en")
                        .header(HttpHeaders.AUTHORIZATION, otherHeader)
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(ProgressSummaryResponse.class)
                        .returnResult()
                        .getResponseBody();

        assertThat(othersSummary.total()).isZero();
        assertThat(othersSummary.dueCount()).isZero();
    }

    private Long createVocab(String word) {
        VocabularyRequest request =
                new VocabularyRequest("en", word, "nghĩa", null, null, List.of(), Map.of());
        VocabularyResponse response =
                client.post()
                        .uri("/api/vocabulary")
                        .header(HttpHeaders.AUTHORIZATION, authHeader)
                        .body(request)
                        .exchange()
                        .expectStatus()
                        .isCreated()
                        .expectBody(VocabularyResponse.class)
                        .returnResult()
                        .getResponseBody();
        return response.id();
    }

    private void submit(Long vocabularyId, SrsRating rating) {
        ReviewSubmitRequest request = new ReviewSubmitRequest(rating, null, null);
        client.post()
                .uri("/api/reviews/" + vocabularyId + "/submit")
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .body(request)
                .exchange()
                .expectStatus()
                .isOk();
    }

    private ProgressSummaryResponse fetchSummary() {
        return client.get()
                .uri("/api/progress/summary?language=en")
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody(ProgressSummaryResponse.class)
                .returnResult()
                .getResponseBody();
    }

    private RetentionResponse fetchRetention() {
        return client.get()
                .uri("/api/progress/retention?language=en&days=30")
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody(RetentionResponse.class)
                .returnResult()
                .getResponseBody();
    }

    private List<WeakAreaResponse> fetchWeakAreas(int limit) {
        return client.get()
                .uri("/api/progress/weak-areas?language=en&limit=" + limit)
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody(new ParameterizedTypeReference<List<WeakAreaResponse>>() {})
                .returnResult()
                .getResponseBody();
    }

    private int indexOfVocabularyId(List<WeakAreaResponse> areas, Long vocabularyId) {
        for (int i = 0; i < areas.size(); i++) {
            if (areas.get(i).vocabularyId().equals(vocabularyId)) {
                return i;
            }
        }
        return -1;
    }
}
