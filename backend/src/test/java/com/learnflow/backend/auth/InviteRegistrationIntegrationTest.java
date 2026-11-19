package com.learnflow.backend.auth;

import com.learnflow.backend.auth.domain.InviteCode;
import com.learnflow.backend.auth.dto.RegisterRequest;
import com.learnflow.backend.common.AbstractIntegrationTest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.client.RestTestClient;

@TestPropertySource(properties = "app.auth.invite-required=true")
class InviteRegistrationIntegrationTest extends AbstractIntegrationTest {

    @LocalServerPort private int port;

    @Autowired private InviteCodeRepository inviteCodeRepository;

    private RestTestClient.ResponseSpec register(String inviteCode) {
        return RestTestClient.bindToServer()
                .baseUrl("http://localhost:" + port)
                .build()
                .post()
                .uri("/api/v1/auth/register")
                .body(
                        new RegisterRequest(
                                "inv-" + System.nanoTime() + "@example.com",
                                "password123",
                                "Tester",
                                "Asia/Ho_Chi_Minh",
                                inviteCode))
                .exchange();
    }

    private String newCode(int maxUses, Instant expiresAt) {
        String code = "TEST-" + (System.nanoTime() % 1_000_000_000L);
        inviteCodeRepository.save(new InviteCode(code, maxUses, expiresAt, Instant.now()));
        return code;
    }

    @Test
    void withoutCode_returns400OnInviteCode() {
        register(null)
                .expectStatus()
                .isBadRequest()
                .expectBody()
                .jsonPath("$.errors.inviteCode")
                .exists();
    }

    @Test
    void unknownCode_returns400() {
        register("NOPE-NOPE").expectStatus().isBadRequest();
    }

    @Test
    void codeIsCaseInsensitiveAndStopsAtMaxUses() {
        String code = newCode(1, null);

        register(code.toLowerCase()).expectStatus().isOk();
        register(code)
                .expectStatus()
                .isBadRequest()
                .expectBody()
                .jsonPath("$.errors.inviteCode")
                .isEqualTo("This invite code has been used up");
    }

    @Test
    void expiredCode_returns400() {
        String code = newCode(5, Instant.now().minus(1, ChronoUnit.DAYS));

        register(code)
                .expectStatus()
                .isBadRequest()
                .expectBody()
                .jsonPath("$.errors.inviteCode")
                .isEqualTo("This invite code has expired");
    }
}
