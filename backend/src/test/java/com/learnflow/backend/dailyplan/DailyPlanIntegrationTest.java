package com.learnflow.backend.dailyplan;

import static org.assertj.core.api.Assertions.assertThat;

import com.learnflow.backend.auth.dto.AuthResponse;
import com.learnflow.backend.auth.dto.RegisterRequest;
import com.learnflow.backend.common.AbstractIntegrationTest;
import com.learnflow.backend.dailyplan.dto.DailyPlanItemResponse;
import com.learnflow.backend.dailyplan.dto.DailyPlanResponse;
import com.learnflow.backend.dailyplan.dto.GenerateDailyPlanRequest;
import com.learnflow.backend.dailyplan.dto.UpdateDailyPlanItemRequest;
import com.learnflow.backend.vocabulary.dto.VocabularyRequest;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.client.RestTestClient;

class DailyPlanIntegrationTest extends AbstractIntegrationTest {

    @LocalServerPort private int port;

    private RestTestClient client;
    private String authHeader;

    @BeforeEach
    void setUp() {
        client = RestTestClient.bindToServer().baseUrl("http://localhost:" + port).build();

        String email = "dailyplan-" + System.nanoTime() + "@example.com";
        RegisterRequest register = new RegisterRequest(email, "password123", "Daily Plan Tester");
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
    void generate_thenToday_returnsSamePlan() {
        // Seed one English word so there's at least a due-count signal for the engine.
        String suffix = "-" + System.nanoTime();
        VocabularyRequest vocab =
                new VocabularyRequest("en", "achieve" + suffix, "đạt được", null, null, List.of(), Map.of());
        client.post()
                .uri("/api/vocabulary")
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .body(vocab)
                .exchange()
                .expectStatus()
                .isCreated();

        DailyPlanResponse generated =
                client.post()
                        .uri("/api/daily-plan/generate")
                        .header(HttpHeaders.AUTHORIZATION, authHeader)
                        .body(new GenerateDailyPlanRequest(45))
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(DailyPlanResponse.class)
                        .returnResult()
                        .getResponseBody();

        assertThat(generated).isNotNull();
        assertThat(generated.availableMinutes()).isEqualTo(45);
        assertThat(generated.items()).isNotEmpty();
        // No real ANTHROPIC_API_KEY in this environment: the intro degrades to null gracefully
        // instead of breaking generation (AiProviderException caught in DailyPlanService).
        assertThat(generated.intro()).isNull();

        DailyPlanResponse fetched =
                client.get()
                        .uri("/api/daily-plan/today")
                        .header(HttpHeaders.AUTHORIZATION, authHeader)
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(DailyPlanResponse.class)
                        .returnResult()
                        .getResponseBody();

        assertThat(fetched.id()).isEqualTo(generated.id());
        assertThat(fetched.items()).hasSameSizeAs(generated.items());
    }

    @Test
    void generate_calledTwiceSameDay_replacesItemsInsteadOfDuplicating() {
        DailyPlanResponse first =
                client.post()
                        .uri("/api/daily-plan/generate")
                        .header(HttpHeaders.AUTHORIZATION, authHeader)
                        .body(new GenerateDailyPlanRequest(20))
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(DailyPlanResponse.class)
                        .returnResult()
                        .getResponseBody();

        DailyPlanResponse second =
                client.post()
                        .uri("/api/daily-plan/generate")
                        .header(HttpHeaders.AUTHORIZATION, authHeader)
                        .body(new GenerateDailyPlanRequest(60))
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(DailyPlanResponse.class)
                        .returnResult()
                        .getResponseBody();

        assertThat(second.id()).isEqualTo(first.id()); // same plan_date row, not a new one
        assertThat(second.availableMinutes()).isEqualTo(60);

        DailyPlanResponse today =
                client.get()
                        .uri("/api/daily-plan/today")
                        .header(HttpHeaders.AUTHORIZATION, authHeader)
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(DailyPlanResponse.class)
                        .returnResult()
                        .getResponseBody();
        assertThat(today.items()).hasSameSizeAs(second.items()); // not first + second combined
    }

    @Test
    void updateItem_marksCompleted() {
        DailyPlanResponse plan =
                client.post()
                        .uri("/api/daily-plan/generate")
                        .header(HttpHeaders.AUTHORIZATION, authHeader)
                        .body(new GenerateDailyPlanRequest(30))
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(DailyPlanResponse.class)
                        .returnResult()
                        .getResponseBody();
        assertThat(plan.items()).isNotEmpty();
        Long firstItemId = plan.items().get(0).id();

        DailyPlanItemResponse updated =
                client.patch()
                        .uri("/api/daily-plan/item/" + firstItemId)
                        .header(HttpHeaders.AUTHORIZATION, authHeader)
                        .body(new UpdateDailyPlanItemRequest(true))
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(DailyPlanItemResponse.class)
                        .returnResult()
                        .getResponseBody();

        assertThat(updated.completed()).isTrue();
    }

    @Test
    void today_noPlanGeneratedYetForThisAccount_returns404() {
        // Safe now that daily_plan is scoped per user (decision D18, reversing D7): this test's
        // @BeforeEach-registered account is brand new and has never called /generate, regardless
        // of what other test methods in this class did against their own accounts.
        client.get()
                .uri("/api/daily-plan/today")
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .exchange()
                .expectStatus()
                .isNotFound();
    }

    @Test
    void anotherUsersPlan_isInvisibleAndItsItemsInaccessible() {
        DailyPlanResponse plan =
                client.post()
                        .uri("/api/daily-plan/generate")
                        .header(HttpHeaders.AUTHORIZATION, authHeader)
                        .body(new GenerateDailyPlanRequest(30))
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(DailyPlanResponse.class)
                        .returnResult()
                        .getResponseBody();
        Long firstItemId = plan.items().get(0).id();

        String otherEmail = "dailyplan-other-" + System.nanoTime() + "@example.com";
        AuthResponse otherAuth =
                client.post()
                        .uri("/api/auth/register")
                        .body(new RegisterRequest(otherEmail, "password123", "Other Daily Plan Tester"))
                        .exchange()
                        .expectStatus()
                        .is2xxSuccessful()
                        .expectBody(AuthResponse.class)
                        .returnResult()
                        .getResponseBody();
        String otherHeader = "Bearer " + otherAuth.token();

        // Same calendar date, different account — not the 409/collision it would have been under
        // the old global UNIQUE(plan_date) constraint.
        client.get()
                .uri("/api/daily-plan/today")
                .header(HttpHeaders.AUTHORIZATION, otherHeader)
                .exchange()
                .expectStatus()
                .isNotFound();

        client.patch()
                .uri("/api/daily-plan/item/" + firstItemId)
                .header(HttpHeaders.AUTHORIZATION, otherHeader)
                .body(new UpdateDailyPlanItemRequest(true))
                .exchange()
                .expectStatus()
                .isNotFound();
    }
}
