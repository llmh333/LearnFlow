package com.learnflow.backend.vocabulary;

import static org.assertj.core.api.Assertions.assertThat;

import com.learnflow.backend.auth.dto.AuthResponse;
import com.learnflow.backend.auth.dto.RegisterRequest;
import com.learnflow.backend.common.AbstractIntegrationTest;
import com.learnflow.backend.common.web.PageResponse;
import com.learnflow.backend.vocabulary.dto.VocabularyRequest;
import com.learnflow.backend.vocabulary.dto.VocabularyResponse;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.client.RestTestClient;

class VocabularyIntegrationTest extends AbstractIntegrationTest {

    @LocalServerPort private int port;

    private RestTestClient client;
    private String authHeader;

    @BeforeEach
    void setUp() {
        client = RestTestClient.bindToServer().baseUrl("http://localhost:" + port).build();

        String email = "vocab-" + System.nanoTime() + "@example.com";
        RegisterRequest register = new RegisterRequest(email, "password123", "Vocab Tester");
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
    void protectedEndpoint_withoutToken_returns401() {
        client.get().uri("/api/vocabulary").exchange().expectStatus().isUnauthorized();
    }

    @Test
    void createGetUpdateDelete_roundTrip() {
        VocabularyRequest createRequest =
                new VocabularyRequest(
                        "en",
                        "achieve",
                        "đạt được",
                        "I want to achieve my goals.",
                        (short) 2,
                        List.of("work", "common"),
                        Map.of("ipa", "/əˈtʃiːv/", "cefrLevel", "B1"));

        VocabularyResponse created =
                client.post()
                        .uri("/api/vocabulary")
                        .header(HttpHeaders.AUTHORIZATION, authHeader)
                        .body(createRequest)
                        .exchange()
                        .expectStatus()
                        .isCreated()
                        .expectBody(VocabularyResponse.class)
                        .returnResult()
                        .getResponseBody();
        assertThat(created).isNotNull();
        assertThat(created.id()).isNotNull();
        assertThat(created.language().code()).isEqualTo("en");
        assertThat(created.tags()).containsExactlyInAnyOrder("work", "common");

        VocabularyResponse fetched =
                client.get()
                        .uri("/api/vocabulary/" + created.id())
                        .header(HttpHeaders.AUTHORIZATION, authHeader)
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(VocabularyResponse.class)
                        .returnResult()
                        .getResponseBody();
        assertThat(fetched.word()).isEqualTo("achieve");

        VocabularyRequest updateRequest =
                new VocabularyRequest(
                        "en", "achieve", "đạt được (updated)", null, (short) 3, List.of("work"), Map.of());
        VocabularyResponse updated =
                client.put()
                        .uri("/api/vocabulary/" + created.id())
                        .header(HttpHeaders.AUTHORIZATION, authHeader)
                        .body(updateRequest)
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(VocabularyResponse.class)
                        .returnResult()
                        .getResponseBody();
        assertThat(updated.meaning()).isEqualTo("đạt được (updated)");
        assertThat(updated.tags()).containsExactly("work");

        client.delete()
                .uri("/api/vocabulary/" + created.id())
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .exchange()
                .expectStatus()
                .isNoContent();

        client.get()
                .uri("/api/vocabulary/" + created.id())
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .exchange()
                .expectStatus()
                .isNotFound();
    }

    @Test
    void create_unknownAttributeKey_returns400() {
        VocabularyRequest invalid =
                new VocabularyRequest(
                        "en", "test", "kiểm tra", null, null, List.of(), Map.of("notARealKey", "x"));

        client.post()
                .uri("/api/vocabulary")
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .body(invalid)
                .exchange()
                .expectStatus()
                .isBadRequest();
    }

    @Test
    void list_filtersBySearchLanguageAndTag() {
        // Unique suffix per run: the shared Testcontainers Postgres instance persists data across
        // test methods in this class, so word/tag values must not collide with other tests.
        String suffix = "-" + System.nanoTime();
        String englishWord = "achieve" + suffix;
        String englishWord2 = "banana" + suffix;
        String chineseWord = "学习" + suffix;
        String uniqueTag = "daily" + suffix;

        create("en", englishWord, "đạt được", List.of("work" + suffix));
        create("en", englishWord2, "quả chuối", List.of("food" + suffix));
        create("zh", chineseWord, "học tập", List.of(uniqueTag));

        PageResponse<VocabularyResponse> englishOnly = list("language=en&search=" + suffix);
        assertThat(englishOnly.content())
                .extracting(VocabularyResponse::word)
                .containsExactlyInAnyOrder(englishWord, englishWord2);

        PageResponse<VocabularyResponse> searchResult = list("search=" + englishWord);
        assertThat(searchResult.content()).extracting(VocabularyResponse::word).containsExactly(englishWord);

        PageResponse<VocabularyResponse> tagResult = list("tag=" + uniqueTag);
        assertThat(tagResult.content()).extracting(VocabularyResponse::word).containsExactly(chineseWord);
    }

    @Test
    void anotherUsersVocabulary_isInvisibleAndInaccessible() {
        String suffix = "-" + System.nanoTime();
        VocabularyResponse mine =
                client.post()
                        .uri("/api/vocabulary")
                        .header(HttpHeaders.AUTHORIZATION, authHeader)
                        .body(
                                new VocabularyRequest(
                                        "en", "private" + suffix, "riêng tư", null, null, List.of(), Map.of()))
                        .exchange()
                        .expectStatus()
                        .isCreated()
                        .expectBody(VocabularyResponse.class)
                        .returnResult()
                        .getResponseBody();

        String otherHeader = registerAnotherUser();

        PageResponse<VocabularyResponse> othersList = listAs(otherHeader, "");
        assertThat(othersList.content()).extracting(VocabularyResponse::id).doesNotContain(mine.id());

        client.get()
                .uri("/api/vocabulary/" + mine.id())
                .header(HttpHeaders.AUTHORIZATION, otherHeader)
                .exchange()
                .expectStatus()
                .isNotFound();

        client.delete()
                .uri("/api/vocabulary/" + mine.id())
                .header(HttpHeaders.AUTHORIZATION, otherHeader)
                .exchange()
                .expectStatus()
                .isNotFound();

        // still there for its real owner — the other user's failed delete had no effect
        client.get()
                .uri("/api/vocabulary/" + mine.id())
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .exchange()
                .expectStatus()
                .isOk();
    }

    @Test
    void tags_returnsAllKnownTagNames() {
        String suffix = "-" + System.nanoTime();
        create("en", "achieve" + suffix, "đạt được", List.of("work" + suffix, "common" + suffix));

        List<String> tags =
                client.get()
                        .uri("/api/vocabulary/tags")
                        .header(HttpHeaders.AUTHORIZATION, authHeader)
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(List.class)
                        .returnResult()
                        .getResponseBody();
        assertThat(tags).contains("work" + suffix, "common" + suffix);
    }

    private void create(String languageCode, String word, String meaning, List<String> tags) {
        VocabularyRequest request =
                new VocabularyRequest(languageCode, word, meaning, null, null, tags, Map.of());
        client.post()
                .uri("/api/vocabulary")
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .body(request)
                .exchange()
                .expectStatus()
                .isCreated();
    }

    private PageResponse<VocabularyResponse> list(String query) {
        return listAs(authHeader, query);
    }

    private PageResponse<VocabularyResponse> listAs(String header, String query) {
        return client.get()
                .uri("/api/vocabulary?" + query)
                .header(HttpHeaders.AUTHORIZATION, header)
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody(new ParameterizedTypeReference<PageResponse<VocabularyResponse>>() {})
                .returnResult()
                .getResponseBody();
    }

    /** Registers a second, independent account and returns its {@code Authorization} header. */
    private String registerAnotherUser() {
        String email = "vocab-other-" + System.nanoTime() + "@example.com";
        RegisterRequest register = new RegisterRequest(email, "password123", "Other Vocab Tester");
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
        return "Bearer " + auth.token();
    }
}
