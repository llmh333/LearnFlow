package com.learnflow.backend.curriculum;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.learnflow.backend.auth.dto.request.RegisterRequest;
import com.learnflow.backend.auth.dto.response.AuthResponse;
import com.learnflow.backend.common.AbstractIntegrationTest;
import com.learnflow.backend.curriculum.domain.JlptLevel;
import com.learnflow.backend.curriculum.dto.response.LevelCountResponse;
import com.learnflow.backend.curriculum.dto.response.WordDetailResponse;
import com.learnflow.backend.curriculum.dto.response.WordSummaryResponse;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.client.RestTestClient;

/** Dictionary search and level browsing over the shipped N5 draft content (test profile). */
class DictionaryIntegrationTest extends AbstractIntegrationTest {

    @JsonIgnoreProperties(ignoreUnknown = true)
    record WordPage(List<WordSummaryResponse> content, long totalElements) {}

    @LocalServerPort private int port;

    private RestTestClient client;
    private String token;

    @BeforeEach
    void setUp() {
        client = RestTestClient.bindToServer().baseUrl("http://localhost:" + port).build();
        token =
                client.post()
                        .uri("/api/v1/auth/register")
                        .body(
                                new RegisterRequest(
                                        "dict-" + System.nanoTime() + "@example.com",
                                        "password123",
                                        "password123",
                                        "Tester",
                                        "Asia/Ho_Chi_Minh"))
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(AuthResponse.class)
                        .returnResult()
                        .getResponseBody()
                        .token();
    }

    @Test
    void withoutToken_returns401() {
        client.get().uri("/api/v1/dictionary/words").exchange().expectStatus().isUnauthorized();
    }

    @Test
    void search_byReading_putsTheExactMatchFirst() {
        WordPage page = search("q=がくせい");
        assertThat(page.content().getFirst().reading()).isEqualTo("がくせい");
    }

    @Test
    void search_byWrittenForm_andByVietnameseMeaning() {
        assertThat(search("q=学").content()).extracting(WordSummaryResponse::written).contains("学生");
        assertThat(search("q=sinh viên").content())
                .extracting(WordSummaryResponse::reading)
                .contains("がくせい");
    }

    @Test
    void search_treatsLikeWildcardsLiterally() {
        assertThat(search("q=%").totalElements()).isZero();
        assertThat(search("q=_").totalElements()).isZero();
    }

    @Test
    void levelFilter_matchesTheLevelCounts() {
        List<LevelCountResponse> levels =
                get("/api/v1/dictionary/levels")
                        .expectBody(new ParameterizedTypeReference<List<LevelCountResponse>>() {})
                        .returnResult()
                        .getResponseBody();

        assertThat(levels)
                .extracting(LevelCountResponse::level)
                .startsWith(JlptLevel.N5, JlptLevel.N4, JlptLevel.N3, JlptLevel.N2, JlptLevel.N1);
        long n5 = levels.getFirst().wordCount();
        // The JLPT lists of V22/V23 (drafts, visible under the test profile).
        assertThat(n5).isGreaterThan(700);
        assertThat(levels.get(1).wordCount()).isGreaterThan(600);

        WordPage page = search("level=n5&size=50");
        assertThat(page.content()).hasSize(50);
        assertThat(page.totalElements()).isEqualTo(n5);
        assertThat(page.content()).allMatch(w -> w.jlptLevel() == JlptLevel.N5);
        assertThat(search("level=N1").totalElements()).isEqualTo(levels.get(4).wordCount());
    }

    @Test
    void unknownLevel_isAFieldError() {
        get("/api/v1/dictionary/words?level=N6")
                .expectStatus()
                .isBadRequest()
                .expectBody()
                .jsonPath("$.errors.level")
                .exists();
    }

    @Test
    void wordDetail_includesMeaningsAndSource_and404ForUnknownId() {
        Long id = search("q=がくせい").content().getFirst().id();

        WordDetailResponse word =
                get("/api/v1/dictionary/words/" + id)
                        .expectStatus()
                        .isOk()
                        .expectBody(WordDetailResponse.class)
                        .returnResult()
                        .getResponseBody();
        assertThat(word.written()).isEqualTo("学生");
        assertThat(word.meaningsVi()).contains("sinh viên");
        assertThat(word.source().key()).isEqualTo("ai");

        get("/api/v1/dictionary/words/999999999").expectStatus().isNotFound();
    }

    private WordPage search(String query) {
        return get("/api/v1/dictionary/words?" + query)
                .expectStatus()
                .isOk()
                .expectBody(WordPage.class)
                .returnResult()
                .getResponseBody();
    }

    private RestTestClient.ResponseSpec get(String uri) {
        return client.get()
                .uri(uri)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .exchange();
    }
}
