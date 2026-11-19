package com.learnflow.backend.ai;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.learnflow.backend.ai.provider.AIProvider;
import com.learnflow.backend.auth.dto.AuthResponse;
import com.learnflow.backend.auth.dto.RegisterRequest;
import com.learnflow.backend.common.AbstractIntegrationTest;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.client.RestTestClient;

@TestPropertySource(properties = "app.ai.daily-quota=2")
class AiQuotaIntegrationTest extends AbstractIntegrationTest {

    @LocalServerPort private int port;

    @MockitoBean private AIProvider aiProvider;

    @Test
    void callBeyondTheDailyQuota_returns429() {
        when(aiProvider.explainGrammar(any())).thenReturn("explanation");
        RestTestClient client =
                RestTestClient.bindToServer().baseUrl("http://localhost:" + port).build();
        String token =
                client.post()
                        .uri("/api/v1/auth/register")
                        .body(
                                new RegisterRequest(
                                        "quota-" + System.nanoTime() + "@example.com",
                                        "password123",
                                        "Tester",
                                        "Asia/Ho_Chi_Minh",
                                        null))
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(AuthResponse.class)
                        .returnResult()
                        .getResponseBody()
                        .token();
        Map<String, String> body =
                Map.of("languageCode", "ja", "question", "は và が khác nhau thế nào?");

        for (int i = 0; i < 2; i++) {
            client.post()
                    .uri("/api/v1/ai/grammar/explain")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .body(body)
                    .exchange()
                    .expectStatus()
                    .isOk();
        }
        client.post()
                .uri("/api/v1/ai/grammar/explain")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .body(body)
                .exchange()
                .expectStatus()
                .isEqualTo(429)
                .expectBody()
                .jsonPath("$.detail")
                .value(d ->
                        org.assertj.core.api.Assertions.assertThat((String) d)
                                .contains("Daily AI limit of 2"));
    }
}
