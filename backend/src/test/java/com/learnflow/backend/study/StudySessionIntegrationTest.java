package com.learnflow.backend.study;

import static org.assertj.core.api.Assertions.assertThat;

import com.learnflow.backend.auth.dto.AuthResponse;
import com.learnflow.backend.auth.dto.RegisterRequest;
import com.learnflow.backend.common.AbstractIntegrationTest;
import com.learnflow.backend.srs.dto.ReviewSubmitRequest;
import com.learnflow.backend.srs.engine.SrsRating;
import com.learnflow.backend.study.dto.StartStudySessionRequest;
import com.learnflow.backend.study.dto.StudySessionResponse;
import com.learnflow.backend.vocabulary.dto.VocabularyRequest;
import com.learnflow.backend.vocabulary.dto.VocabularyResponse;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.client.RestTestClient;

class StudySessionIntegrationTest extends AbstractIntegrationTest {

    @LocalServerPort private int port;

    private RestTestClient client;
    private String authHeader;

    @BeforeEach
    void setUp() {
        client = RestTestClient.bindToServer().baseUrl("http://localhost:" + port).build();

        String email = "study-" + System.nanoTime() + "@example.com";
        RegisterRequest register = new RegisterRequest(email, "password123", "Study Tester");
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
    void startReviewEnd_summarizesWordsReviewedLearnedAndMistakes() {
        StudySessionResponse started =
                client.post()
                        .uri("/api/study-sessions/start")
                        .header(HttpHeaders.AUTHORIZATION, authHeader)
                        .body(new StartStudySessionRequest("en"))
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(StudySessionResponse.class)
                        .returnResult()
                        .getResponseBody();
        assertThat(started).isNotNull();
        assertThat(started.endedAt()).isNull();
        assertThat(started.language().code()).isEqualTo("en");

        Long word1 = createVocab("achieve" + System.nanoTime());
        Long word2 = createVocab("banana" + System.nanoTime());

        submit(word1, SrsRating.GOOD, started.id());
        submit(word2, SrsRating.AGAIN, started.id());

        StudySessionResponse ended =
                client.post()
                        .uri("/api/study-sessions/" + started.id() + "/end")
                        .header(HttpHeaders.AUTHORIZATION, authHeader)
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(StudySessionResponse.class)
                        .returnResult()
                        .getResponseBody();

        assertThat(ended.endedAt()).isNotNull();
        assertThat(ended.wordsReviewed()).isEqualTo(2);
        assertThat(ended.wordsLearned()).isEqualTo(2); // both were brand-new (previousInterval == 0)
        assertThat(ended.mistakesCount()).isEqualTo(1); // the AGAIN

        // Ending an already-ended session is idempotent, not double-counted.
        StudySessionResponse endedAgain =
                client.post()
                        .uri("/api/study-sessions/" + started.id() + "/end")
                        .header(HttpHeaders.AUTHORIZATION, authHeader)
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(StudySessionResponse.class)
                        .returnResult()
                        .getResponseBody();
        assertThat(endedAgain.wordsReviewed()).isEqualTo(2);
        // Postgres TIMESTAMPTZ only keeps microsecond precision, so the value re-read from the DB
        // on this second call can differ from the in-memory nanosecond value returned by the first
        // by a sub-microsecond rounding amount — compare at millisecond granularity instead.
        assertThat(endedAgain.endedAt().truncatedTo(ChronoUnit.MILLIS))
                .isEqualTo(ended.endedAt().truncatedTo(ChronoUnit.MILLIS));
    }

    @Test
    void start_withoutLanguageCode_createsUnscopedSession() {
        StudySessionResponse started =
                client.post()
                        .uri("/api/study-sessions/start")
                        .header(HttpHeaders.AUTHORIZATION, authHeader)
                        .body(new StartStudySessionRequest(null))
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(StudySessionResponse.class)
                        .returnResult()
                        .getResponseBody();

        assertThat(started.language()).isNull();
    }

    @Test
    void anotherUsersSession_cannotBeEnded() {
        StudySessionResponse started =
                client.post()
                        .uri("/api/study-sessions/start")
                        .header(HttpHeaders.AUTHORIZATION, authHeader)
                        .body(new StartStudySessionRequest("en"))
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(StudySessionResponse.class)
                        .returnResult()
                        .getResponseBody();

        String otherEmail = "study-other-" + System.nanoTime() + "@example.com";
        AuthResponse otherAuth =
                client.post()
                        .uri("/api/auth/register")
                        .body(new RegisterRequest(otherEmail, "password123", "Other Study Tester"))
                        .exchange()
                        .expectStatus()
                        .is2xxSuccessful()
                        .expectBody(AuthResponse.class)
                        .returnResult()
                        .getResponseBody();
        String otherHeader = "Bearer " + otherAuth.token();

        client.post()
                .uri("/api/study-sessions/" + started.id() + "/end")
                .header(HttpHeaders.AUTHORIZATION, otherHeader)
                .exchange()
                .expectStatus()
                .isNotFound();

        // still not ended for the real owner
        StudySessionResponse ended =
                client.post()
                        .uri("/api/study-sessions/" + started.id() + "/end")
                        .header(HttpHeaders.AUTHORIZATION, authHeader)
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(StudySessionResponse.class)
                        .returnResult()
                        .getResponseBody();
        assertThat(ended.endedAt()).isNotNull();
    }

    @Test
    void end_unknownSession_returns404() {
        client.post()
                .uri("/api/study-sessions/999999/end")
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .exchange()
                .expectStatus()
                .isNotFound();
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

    private void submit(Long vocabularyId, SrsRating rating, Long studySessionId) {
        ReviewSubmitRequest request = new ReviewSubmitRequest(rating, null, studySessionId);
        client.post()
                .uri("/api/reviews/" + vocabularyId + "/submit")
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .body(request)
                .exchange()
                .expectStatus()
                .isOk();
    }
}
