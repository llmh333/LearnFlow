package com.learnflow.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;

import com.learnflow.backend.auth.dto.request.ChangePasswordRequest;
import com.learnflow.backend.auth.dto.request.LoginRequest;
import com.learnflow.backend.auth.dto.request.RegisterRequest;
import com.learnflow.backend.auth.dto.response.AuthResponse;
import com.learnflow.backend.common.AbstractIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.client.EntityExchangeResult;
import org.springframework.test.web.servlet.client.RestTestClient;

/** Refresh-token rotation, logout and password change, over real HTTP and Postgres. */
class AuthSessionIntegrationTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "password123";

    @LocalServerPort private int port;

    private RestTestClient client;

    @BeforeEach
    void setUp() {
        client = RestTestClient.bindToServer().baseUrl("http://localhost:" + port).build();
    }

    @Test
    void login_setsAHardenedRefreshCookie() {
        String email = registerNewUser();

        String setCookie =
                client.post()
                        .uri("/api/v1/auth/login")
                        .body(new LoginRequest(email, PASSWORD))
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(AuthResponse.class)
                        .returnResult()
                        .getResponseHeaders()
                        .getFirst(HttpHeaders.SET_COOKIE);

        assertThat(setCookie)
                .startsWith("refresh_token=")
                .contains("HttpOnly", "Secure", "SameSite=Strict", "Path=/api/v1/auth");
    }

    @Test
    void refresh_rotatesTheToken_andReplayingTheOldOneRevokesTheWholeChain() {
        String first = refreshCookieOf(registerResult(registerNewUserRequest()));

        EntityExchangeResult<AuthResponse> refreshed = refresh(first);
        assertThat(refreshed.getStatus().value()).isEqualTo(200);
        assertThat(refreshed.getResponseBody().token()).isNotBlank();
        String second = refreshCookieOf(refreshed);
        assertThat(second).isNotEqualTo(first);

        // Replaying a rotated token means it leaked: it fails, and so does its successor.
        assertThat(refresh(first).getStatus().value()).isEqualTo(401);
        assertThat(refresh(second).getStatus().value()).isEqualTo(401);
    }

    @Test
    void refresh_withoutCookie_returns401() {
        client.post().uri("/api/v1/auth/refresh").exchange().expectStatus().isUnauthorized();
    }

    @Test
    void logout_revokesTheRefreshToken_andClearsTheCookie() {
        String token = refreshCookieOf(registerResult(registerNewUserRequest()));

        String cleared =
                client.post()
                        .uri("/api/v1/auth/logout")
                        .cookie("refresh_token", token)
                        .exchange()
                        .expectStatus()
                        .isNoContent()
                        .expectBody()
                        .returnResult()
                        .getResponseHeaders()
                        .getFirst(HttpHeaders.SET_COOKIE);

        assertThat(cleared).startsWith("refresh_token=;").contains("Max-Age=0");
        assertThat(refresh(token).getStatus().value()).isEqualTo(401);
    }

    @Test
    void changePassword_signsOutOldSessions_andOnlyTheNewPasswordWorks() {
        RegisterRequest request = registerNewUserRequest();
        EntityExchangeResult<AuthResponse> registered = registerResult(request);
        String oldRefresh = refreshCookieOf(registered);

        String newRefresh =
                refreshCookieOf(
                        client.post()
                                .uri("/api/v1/auth/change-password")
                                .header(
                                        HttpHeaders.AUTHORIZATION,
                                        "Bearer " + registered.getResponseBody().token())
                                .body(
                                        new ChangePasswordRequest(
                                                PASSWORD, "newpassword1", "newpassword1"))
                                .exchange()
                                .expectStatus()
                                .isOk()
                                .expectBody(AuthResponse.class)
                                .returnResult());

        assertThat(refresh(oldRefresh).getStatus().value()).isEqualTo(401);
        assertThat(refresh(newRefresh).getStatus().value()).isEqualTo(200);
        client.post()
                .uri("/api/v1/auth/login")
                .body(new LoginRequest(request.email(), PASSWORD))
                .exchange()
                .expectStatus()
                .isUnauthorized();
        client.post()
                .uri("/api/v1/auth/login")
                .body(new LoginRequest(request.email(), "newpassword1"))
                .exchange()
                .expectStatus()
                .isOk();
    }

    @Test
    void changePassword_withoutToken_returns401() {
        client.post()
                .uri("/api/v1/auth/change-password")
                .body(new ChangePasswordRequest(PASSWORD, "newpassword1", "newpassword1"))
                .exchange()
                .expectStatus()
                .isUnauthorized();
    }

    @Test
    void register_confirmMismatch_returns400WithFieldError() {
        client.post()
                .uri("/api/v1/auth/register")
                .body(
                        new RegisterRequest(
                                "mismatch-" + System.nanoTime() + "@example.com",
                                PASSWORD,
                                "password124",
                                "Tester",
                                "Asia/Ho_Chi_Minh"))
                .exchange()
                .expectStatus()
                .isBadRequest()
                .expectBody()
                .jsonPath("$.errors.confirmPassword")
                .exists();
    }

    private RegisterRequest registerNewUserRequest() {
        return new RegisterRequest(
                "session-" + System.nanoTime() + "@example.com",
                PASSWORD,
                PASSWORD,
                "Tester",
                "Asia/Ho_Chi_Minh");
    }

    private String registerNewUser() {
        RegisterRequest request = registerNewUserRequest();
        registerResult(request);
        return request.email();
    }

    private EntityExchangeResult<AuthResponse> registerResult(RegisterRequest request) {
        return client.post()
                .uri("/api/v1/auth/register")
                .body(request)
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody(AuthResponse.class)
                .returnResult();
    }

    private EntityExchangeResult<AuthResponse> refresh(String refreshToken) {
        return client.post()
                .uri("/api/v1/auth/refresh")
                .cookie("refresh_token", refreshToken)
                .exchange()
                .expectBody(AuthResponse.class)
                .returnResult();
    }

    private static String refreshCookieOf(EntityExchangeResult<?> result) {
        String header = result.getResponseHeaders().getFirst(HttpHeaders.SET_COOKIE);
        assertThat(header).startsWith("refresh_token=");
        return header.substring("refresh_token=".length(), header.indexOf(';'));
    }
}
