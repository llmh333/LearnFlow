package com.learnflow.backend.srs;

import static org.assertj.core.api.Assertions.assertThat;

import com.learnflow.backend.auth.dto.AuthResponse;
import com.learnflow.backend.auth.dto.RegisterRequest;
import com.learnflow.backend.common.AbstractIntegrationTest;
import com.learnflow.backend.srs.dto.DueVocabularyResponse;
import com.learnflow.backend.srs.dto.ReviewHistoryResponse;
import com.learnflow.backend.srs.dto.ReviewSubmitRequest;
import com.learnflow.backend.srs.dto.ReviewSubmitResponse;
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

class ReviewIntegrationTest extends AbstractIntegrationTest {

    @LocalServerPort private int port;

    private RestTestClient client;
    private String authHeader;

    @BeforeEach
    void setUp() {
        client = RestTestClient.bindToServer().baseUrl("http://localhost:" + port).build();

        String email = "review-" + System.nanoTime() + "@example.com";
        RegisterRequest register = new RegisterRequest(email, "password123", "Review Tester");
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
    void creatingVocabulary_automaticallyCreatesADueReviewSchedule() {
        VocabularyResponse vocabulary = createVocabulary();

        List<DueVocabularyResponse> due = fetchDue("en");

        assertThat(due).extracting(DueVocabularyResponse::vocabularyId).contains(vocabulary.id());
    }

    @Test
    void submit_updatesScheduleAndRecordsHistory() {
        VocabularyResponse vocabulary = createVocabulary();

        ReviewSubmitRequest request = new ReviewSubmitRequest(SrsRating.GOOD, 1500, null);
        ReviewSubmitResponse response =
                client.post()
                        .uri("/api/reviews/" + vocabulary.id() + "/submit")
                        .header(HttpHeaders.AUTHORIZATION, authHeader)
                        .body(request)
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(ReviewSubmitResponse.class)
                        .returnResult()
                        .getResponseBody();

        assertThat(response).isNotNull();
        assertThat(response.intervalDays()).isEqualByComparingTo("1.00"); // brand-new word, first GOOD -> 1 day
        assertThat(response.reviewCount()).isEqualTo(1);
        assertThat(response.successCount()).isEqualTo(1);
        assertThat(response.failureCount()).isEqualTo(0);

        List<ReviewHistoryResponse> history =
                client.get()
                        .uri("/api/reviews/history/" + vocabulary.id())
                        .header(HttpHeaders.AUTHORIZATION, authHeader)
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(new ParameterizedTypeReference<List<ReviewHistoryResponse>>() {})
                        .returnResult()
                        .getResponseBody();

        assertThat(history).hasSize(1);
        ReviewHistoryResponse entry = history.get(0);
        assertThat(entry.rating()).isEqualTo(SrsRating.GOOD);
        assertThat(entry.previousInterval()).isEqualByComparingTo("0.00");
        assertThat(entry.newInterval()).isEqualByComparingTo("1.00");
        assertThat(entry.responseTimeMs()).isEqualTo(1500);
    }

    @Test
    void submit_again_thenGood_intervalRecoversAboveZero() {
        VocabularyResponse vocabulary = createVocabulary();

        submitRating(vocabulary.id(), SrsRating.GOOD); // reviewCount 0 -> 1 day
        submitRating(vocabulary.id(), SrsRating.GOOD); // reviewCount 1 -> 6 days
        ReviewSubmitResponse afterAgain = submitRating(vocabulary.id(), SrsRating.AGAIN);
        assertThat(afterAgain.intervalDays().doubleValue()).isLessThan(1.0).isGreaterThan(0.0);

        ReviewSubmitResponse recovered = submitRating(vocabulary.id(), SrsRating.GOOD);
        assertThat(recovered.intervalDays().doubleValue()).isGreaterThan(0.0);
        assertThat(recovered.failureCount()).isEqualTo(1);
        assertThat(recovered.reviewCount()).isEqualTo(4);
    }

    @Test
    void submit_missingSchedule_returns404() {
        ReviewSubmitRequest request = new ReviewSubmitRequest(SrsRating.GOOD, null, null);

        client.post()
                .uri("/api/reviews/999999/submit")
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .body(request)
                .exchange()
                .expectStatus()
                .isNotFound();
    }

    private ReviewSubmitResponse submitRating(Long vocabularyId, SrsRating rating) {
        ReviewSubmitRequest request = new ReviewSubmitRequest(rating, null, null);
        return client.post()
                .uri("/api/reviews/" + vocabularyId + "/submit")
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .body(request)
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody(ReviewSubmitResponse.class)
                .returnResult()
                .getResponseBody();
    }

    private VocabularyResponse createVocabulary() {
        String suffix = "-" + System.nanoTime();
        VocabularyRequest request =
                new VocabularyRequest("en", "achieve" + suffix, "đạt được", null, null, List.of(), Map.of());
        return client.post()
                .uri("/api/vocabulary")
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .body(request)
                .exchange()
                .expectStatus()
                .isCreated()
                .expectBody(VocabularyResponse.class)
                .returnResult()
                .getResponseBody();
    }

    private List<DueVocabularyResponse> fetchDue(String language) {
        return client.get()
                .uri("/api/reviews/due?language=" + language + "&limit=100")
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody(new ParameterizedTypeReference<List<DueVocabularyResponse>>() {})
                .returnResult()
                .getResponseBody();
    }
}
