package com.learnflow.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.learnflow.backend.auth.dto.request.ForgotPasswordRequest;
import com.learnflow.backend.auth.dto.request.LoginRequest;
import com.learnflow.backend.auth.dto.request.RegisterRequest;
import com.learnflow.backend.auth.dto.request.ResetPasswordRequest;
import com.learnflow.backend.auth.dto.request.VerifyResetCodeRequest;
import com.learnflow.backend.common.AbstractIntegrationTest;
import java.time.Duration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.client.RestTestClient;

/** Forgot password over real HTTP and Postgres; the mailer is mocked to read the emailed code. */
class PasswordResetIntegrationTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "password123";
    private static final String NEW_PASSWORD = "newpassword1";

    @LocalServerPort private int port;

    @MockitoBean private PasswordResetMailer mailer;

    private RestTestClient client;

    @BeforeEach
    void setUp() {
        client = RestTestClient.bindToServer().baseUrl("http://localhost:" + port).build();
    }

    @Test
    void fullFlow_resetsThePassword_andSignsOutOldSessions() {
        String email = newEmail();
        String oldRefresh = register(email);

        String code = requestCode(email);
        post("/api/v1/auth/password-reset/verify", new VerifyResetCodeRequest(email, code))
                .expectStatus()
                .isNoContent();
        post(
                        "/api/v1/auth/password-reset/confirm",
                        new ResetPasswordRequest(email, code, NEW_PASSWORD, NEW_PASSWORD))
                .expectStatus()
                .isNoContent();

        post("/api/v1/auth/login", new LoginRequest(email, PASSWORD))
                .expectStatus()
                .isUnauthorized();
        post("/api/v1/auth/login", new LoginRequest(email, NEW_PASSWORD)).expectStatus().isOk();
        client.post()
                .uri("/api/v1/auth/refresh")
                .cookie("refresh_token", oldRefresh)
                .exchange()
                .expectStatus()
                .isUnauthorized();
        // The code is used up.
        post("/api/v1/auth/password-reset/verify", new VerifyResetCodeRequest(email, code))
                .expectStatus()
                .isBadRequest();
    }

    @Test
    void unknownEmail_looksTheSame_butSendsNothing() {
        post(
                        "/api/v1/auth/password-reset/request",
                        new ForgotPasswordRequest("nobody-" + System.nanoTime() + "@example.com"))
                .expectStatus()
                .isAccepted();
        verify(mailer, never()).sendAfterCommit(anyString(), anyString(), anyString(), any());
    }

    @Test
    void secondRequestWithinCooldown_sendsNoNewCode() {
        String email = newEmail();
        register(email);

        requestCode(email);
        post("/api/v1/auth/password-reset/request", new ForgotPasswordRequest(email))
                .expectStatus()
                .isAccepted();

        verify(mailer, times(1)).sendAfterCommit(eq(email), anyString(), anyString(), any());
    }

    @Test
    void tooManyWrongCodes_locksTheCode() {
        String email = newEmail();
        register(email);
        String code = requestCode(email);
        String wrong = code.equals("000000") ? "111111" : "000000";

        for (int i = 0; i < PasswordResetService.MAX_ATTEMPTS; i++) {
            post("/api/v1/auth/password-reset/verify", new VerifyResetCodeRequest(email, wrong))
                    .expectStatus()
                    .isBadRequest()
                    .expectBody()
                    .jsonPath("$.errors.code")
                    .exists();
        }
        post("/api/v1/auth/password-reset/verify", new VerifyResetCodeRequest(email, code))
                .expectStatus()
                .isBadRequest();
    }

    @Test
    void weakNewPassword_isAFieldError_andDoesNotUseAnAttempt() {
        String email = newEmail();
        register(email);
        String code = requestCode(email);

        post(
                        "/api/v1/auth/password-reset/confirm",
                        new ResetPasswordRequest(email, code, "short", "short"))
                .expectStatus()
                .isBadRequest()
                .expectBody()
                .jsonPath("$.errors.newPassword")
                .exists();
        post("/api/v1/auth/password-reset/verify", new VerifyResetCodeRequest(email, code))
                .expectStatus()
                .isNoContent();
    }

    private String requestCode(String email) {
        post("/api/v1/auth/password-reset/request", new ForgotPasswordRequest(email))
                .expectStatus()
                .isAccepted();
        ArgumentCaptor<String> code = ArgumentCaptor.forClass(String.class);
        verify(mailer).sendAfterCommit(eq(email), anyString(), code.capture(), any(Duration.class));
        assertThat(code.getValue()).matches("\\d{6}");
        return code.getValue();
    }

    private String register(String email) {
        String header =
                post(
                                "/api/v1/auth/register",
                                new RegisterRequest(
                                        email, PASSWORD, PASSWORD, "Tester", "Asia/Ho_Chi_Minh"))
                        .expectStatus()
                        .isOk()
                        .expectBody()
                        .returnResult()
                        .getResponseHeaders()
                        .getFirst(HttpHeaders.SET_COOKIE);
        return header.substring("refresh_token=".length(), header.indexOf(';'));
    }

    private RestTestClient.ResponseSpec post(String uri, Object body) {
        return client.post().uri(uri).body(body).exchange();
    }

    private static String newEmail() {
        return "reset-" + System.nanoTime() + "@example.com";
    }
}
