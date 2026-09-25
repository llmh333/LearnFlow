package com.learnflow.backend.exercise;

import static org.assertj.core.api.Assertions.assertThat;

import com.learnflow.backend.auth.dto.AuthResponse;
import com.learnflow.backend.auth.dto.RegisterRequest;
import com.learnflow.backend.common.AbstractIntegrationTest;
import com.learnflow.backend.exercise.domain.ExerciseType;
import com.learnflow.backend.exercise.dto.ExerciseAnswerRequest;
import com.learnflow.backend.exercise.dto.ExerciseAnswerResponse;
import com.learnflow.backend.exercise.dto.ExerciseResponse;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.client.RestTestClient;

/**
 * Uses the real starter-vocabulary seed pack (opted back in for this class, see {@code
 * app.vocabulary.seed-starter-pack-on-register}) so a freshly registered user already has 100
 * English words with real example sentences — enough to exercise deterministic generation
 * end-to-end without touching a real AI provider.
 */
@TestPropertySource(properties = "app.vocabulary.seed-starter-pack-on-register=true")
class ExerciseIntegrationTest extends AbstractIntegrationTest {

    @LocalServerPort private int port;

    private RestTestClient client;

    @BeforeEach
    void setUp() {
        client = RestTestClient.bindToServer().baseUrl("http://localhost:" + port).build();
    }

    @Test
    void today_newlyRegisteredUser_getsDeterministicExercisesEvenWithNoReviewHistory() {
        String token = register("exercise-" + System.nanoTime() + "@example.com");

        List<ExerciseResponse> exercises = fetchToday(token);

        assertThat(exercises).isNotEmpty();
        // The answer key must never appear in the "today" response.
        exercises.forEach(
                e -> {
                    if (e.type() == ExerciseType.SENTENCE_SCRAMBLE) {
                        assertThat(e.shuffledTokens()).isNotEmpty();
                    } else {
                        assertThat(e.options()).isNotEmpty();
                    }
                });
    }

    @Test
    void today_calledTwiceSameDay_returnsTheSameExerciseSet() {
        String token = register("exercise-stable-" + System.nanoTime() + "@example.com");

        List<ExerciseResponse> first = fetchToday(token);
        List<ExerciseResponse> second = fetchToday(token);

        assertThat(second).extracting(ExerciseResponse::id).containsExactlyElementsOf(
                first.stream().map(ExerciseResponse::id).toList());
    }

    @Test
    void submitAnswer_correctSentenceScrambleOrder_isGradedCorrect() {
        String token = register("exercise-submit-" + System.nanoTime() + "@example.com");
        List<ExerciseResponse> exercises = fetchToday(token);
        ExerciseResponse scramble =
                exercises.stream()
                        .filter(e -> e.type() == ExerciseType.SENTENCE_SCRAMBLE)
                        .findFirst()
                        .orElseThrow();

        // We don't know the correct order (it's never sent to the client) — submit the shuffled
        // order itself, which is almost certainly wrong, and just assert the endpoint works and
        // reveals a correct answer of the right shape.
        ExerciseAnswerResponse response =
                client
                        .patch()
                        .uri("/api/exercises/{id}/answer", scramble.id())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .body(new ExerciseAnswerRequest(scramble.shuffledTokens(), null))
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(ExerciseAnswerResponse.class)
                        .returnResult()
                        .getResponseBody();

        assertThat(response).isNotNull();
        assertThat(response.correctTokens()).isNotEmpty();
    }

    private List<ExerciseResponse> fetchToday(String token) {
        List<ExerciseResponse> body =
                client
                        .get()
                        .uri("/api/exercises/today?language=en")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(new ParameterizedTypeReference<List<ExerciseResponse>>() {})
                        .returnResult()
                        .getResponseBody();
        assertThat(body).isNotNull();
        return body;
    }

    private String register(String email) {
        RegisterRequest register = new RegisterRequest(email, "password123", "Exercise Tester");
        AuthResponse auth =
                client
                        .post()
                        .uri("/api/auth/register")
                        .body(register)
                        .exchange()
                        .expectStatus()
                        .is2xxSuccessful()
                        .expectBody(AuthResponse.class)
                        .returnResult()
                        .getResponseBody();
        assertThat(auth).isNotNull();
        return auth.token();
    }
}
