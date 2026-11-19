package com.learnflow.backend.account;

import static org.assertj.core.api.Assertions.assertThat;

import com.learnflow.backend.account.dto.ProfileResponse;
import com.learnflow.backend.auth.dto.AuthResponse;
import com.learnflow.backend.auth.dto.RegisterRequest;
import com.learnflow.backend.common.AbstractIntegrationTest;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.client.RestTestClient;

class AccountIntegrationTest extends AbstractIntegrationTest {

    @LocalServerPort private int port;

    private RestTestClient client() {
        return RestTestClient.bindToServer().baseUrl("http://localhost:" + port).build();
    }

    private String register(String timezone) {
        return client().post()
                .uri("/api/v1/auth/register")
                .body(
                        new RegisterRequest(
                                "acc-" + System.nanoTime() + "@example.com",
                                "password123",
                                "Tester",
                                timezone,
                                null))
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody(AuthResponse.class)
                .returnResult()
                .getResponseBody()
                .token();
    }

    @Test
    void profile_withoutToken_returns401() {
        client().get().uri("/api/v1/account/profile").exchange().expectStatus().isUnauthorized();
    }

    @Test
    void register_createsProfileWithBrowserTimezoneAndDefaults() {
        String token = register("Asia/Ho_Chi_Minh");

        ProfileResponse profile =
                client().get()
                        .uri("/api/v1/account/profile")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(ProfileResponse.class)
                        .returnResult()
                        .getResponseBody();

        assertThat(profile.timezone()).isEqualTo("Asia/Ho_Chi_Minh");
        assertThat(profile.dailyMinutes()).isEqualTo(10);
        assertThat(profile.dailyNewItems()).isEqualTo(10);
    }

    @Test
    void register_withUnknownTimezone_returns400WithFieldError() {
        client().post()
                .uri("/api/v1/auth/register")
                .body(
                        new RegisterRequest(
                                "tz-" + System.nanoTime() + "@example.com",
                                "password123",
                                "Tester",
                                "Mars/Olympus",
                                null))
                .exchange()
                .expectStatus()
                .isBadRequest()
                .expectBody()
                .jsonPath("$.errors.timezone")
                .exists();
    }

    @Test
    void updateProfile_appliesValidChangesAndRejectsInvalidOnes() {
        String token = register("Asia/Ho_Chi_Minh");

        ProfileResponse updated =
                client().patch()
                        .uri("/api/v1/account/profile")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .body(Map.of("dailyMinutes", 15, "goal", "JLPT"))
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(ProfileResponse.class)
                        .returnResult()
                        .getResponseBody();
        assertThat(updated.dailyMinutes()).isEqualTo(15);
        assertThat(updated.goal()).hasToString("JLPT");

        client().patch()
                .uri("/api/v1/account/profile")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .body(Map.of("dailyNewItems", 99))
                .exchange()
                .expectStatus()
                .isBadRequest()
                .expectBody()
                .jsonPath("$.errors.dailyNewItems")
                .exists();
    }
}
