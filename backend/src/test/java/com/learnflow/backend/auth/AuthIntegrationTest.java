package com.learnflow.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;

import com.learnflow.backend.auth.dto.request.LoginRequest;
import com.learnflow.backend.auth.dto.request.RegisterRequest;
import com.learnflow.backend.auth.dto.response.AuthResponse;
import com.learnflow.backend.auth.dto.response.UserResponse;
import com.learnflow.backend.common.AbstractIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.client.RestTestClient;

class AuthIntegrationTest extends AbstractIntegrationTest {

    @LocalServerPort private int port;

    private RestTestClient client;

    @BeforeEach
    void setUp() {
        client = RestTestClient.bindToServer().baseUrl("http://localhost:" + port).build();
    }

    @Test
    void registerThenLoginThenMe_succeeds() {
        RegisterRequest register =
                new RegisterRequest(
                        "flow@example.com",
                        "password123",
                        "password123",
                        "Flow User",
                        "Asia/Ho_Chi_Minh");
        client.post()
                .uri("/api/v1/auth/register")
                .body(register)
                .exchange()
                .expectStatus()
                .is2xxSuccessful();

        LoginRequest login = new LoginRequest("flow@example.com", "password123");
        AuthResponse loginBody =
                client.post()
                        .uri("/api/v1/auth/login")
                        .body(login)
                        .exchange()
                        .expectStatus()
                        .is2xxSuccessful()
                        .expectBody(AuthResponse.class)
                        .returnResult()
                        .getResponseBody();
        assertThat(loginBody).isNotNull();
        assertThat(loginBody.token()).isNotBlank();

        UserResponse me =
                client.get()
                        .uri("/api/v1/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + loginBody.token())
                        .exchange()
                        .expectStatus()
                        .is2xxSuccessful()
                        .expectBody(UserResponse.class)
                        .returnResult()
                        .getResponseBody();
        assertThat(me).isNotNull();
        assertThat(me.email()).isEqualTo("flow@example.com");
    }

    @Test
    void protectedEndpoint_withoutToken_returns401() {
        client.get().uri("/api/v1/auth/me").exchange().expectStatus().isUnauthorized();
    }

    @Test
    void protectedEndpoint_withInvalidToken_returns401() {
        client.get()
                .uri("/api/v1/auth/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer not-a-real-token")
                .exchange()
                .expectStatus()
                .isUnauthorized();
    }
}
