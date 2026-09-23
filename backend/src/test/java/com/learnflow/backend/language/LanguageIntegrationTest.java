package com.learnflow.backend.language;

import static org.assertj.core.api.Assertions.assertThat;

import com.learnflow.backend.auth.dto.AuthResponse;
import com.learnflow.backend.auth.dto.RegisterRequest;
import com.learnflow.backend.common.AbstractIntegrationTest;
import com.learnflow.backend.language.dto.LanguageResponse;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.client.RestTestClient;

class LanguageIntegrationTest extends AbstractIntegrationTest {

    @LocalServerPort private int port;

    @Test
    void list_withoutToken_returns401() {
        RestTestClient client = RestTestClient.bindToServer().baseUrl("http://localhost:" + port).build();

        client.get().uri("/api/languages").exchange().expectStatus().isUnauthorized();
    }

    @Test
    void list_returnsSeededLanguages() {
        RestTestClient client = RestTestClient.bindToServer().baseUrl("http://localhost:" + port).build();

        RegisterRequest register =
                new RegisterRequest("lang-" + System.nanoTime() + "@example.com", "password123", "Tester");
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

        List<LanguageResponse> languages =
                client.get()
                        .uri("/api/languages")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + auth.token())
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(new ParameterizedTypeReference<List<LanguageResponse>>() {})
                        .returnResult()
                        .getResponseBody();

        assertThat(languages).extracting(LanguageResponse::code).containsExactly("en", "zh", "ja");
    }
}
