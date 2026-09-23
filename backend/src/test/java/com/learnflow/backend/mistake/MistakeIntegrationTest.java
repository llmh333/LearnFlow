package com.learnflow.backend.mistake;

import static org.assertj.core.api.Assertions.assertThat;

import com.learnflow.backend.auth.dto.AuthResponse;
import com.learnflow.backend.auth.dto.RegisterRequest;
import com.learnflow.backend.common.AbstractIntegrationTest;
import com.learnflow.backend.mistake.dto.CreateMistakeRequest;
import com.learnflow.backend.mistake.dto.MistakeResponse;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.client.RestTestClient;

class MistakeIntegrationTest extends AbstractIntegrationTest {

    @LocalServerPort private int port;

    private RestTestClient client;
    private String authHeader;

    @BeforeEach
    void setUp() {
        client = RestTestClient.bindToServer().baseUrl("http://localhost:" + port).build();

        String email = "mistake-" + System.nanoTime() + "@example.com";
        RegisterRequest register = new RegisterRequest(email, "password123", "Mistake Tester");
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
    void create_sameTopicTwice_mergesIntoOneWithIncrementedTimesRepeated() {
        String topic = "Past tense" + System.nanoTime();

        MistakeResponse first = createMistake(topic, "I go yesterday.", "I went yesterday.");
        assertThat(first.timesRepeated()).isEqualTo(1);

        MistakeResponse second = createMistake(topic, "I go home yesterday.", "I went home yesterday.");
        assertThat(second.id()).isEqualTo(first.id());
        assertThat(second.timesRepeated()).isEqualTo(2);
        assertThat(second.corrected()).isEqualTo("I went home yesterday.");
    }

    @Test
    void sameTopicAcrossTwoUsers_doesNotMergeAndIsNotVisibleToTheOther() {
        String topic = "Shared topic name" + System.nanoTime();
        MistakeResponse mine = createMistake(topic, "I go yesterday.", "I went yesterday.");
        assertThat(mine.timesRepeated()).isEqualTo(1);

        String otherEmail = "mistake-other-" + System.nanoTime() + "@example.com";
        AuthResponse otherAuth =
                client.post()
                        .uri("/api/auth/register")
                        .body(new RegisterRequest(otherEmail, "password123", "Other Mistake Tester"))
                        .exchange()
                        .expectStatus()
                        .is2xxSuccessful()
                        .expectBody(AuthResponse.class)
                        .returnResult()
                        .getResponseBody();
        String otherHeader = "Bearer " + otherAuth.token();

        CreateMistakeRequest request =
                new CreateMistakeRequest(
                        "en", null, "Grammar", topic, "She go yesterday.", "She went yesterday.", "explanation");
        MistakeResponse theirs =
                client.post()
                        .uri("/api/mistakes")
                        .header(HttpHeaders.AUTHORIZATION, otherHeader)
                        .body(request)
                        .exchange()
                        .expectStatus()
                        .isCreated()
                        .expectBody(MistakeResponse.class)
                        .returnResult()
                        .getResponseBody();

        // A different row, not a merge — same topic name, two different accounts.
        assertThat(theirs.id()).isNotEqualTo(mine.id());
        assertThat(theirs.timesRepeated()).isEqualTo(1);

        // Neither account sees the other's mistake in its own list.
        List<MistakeResponse> mineList = fetchList("en", "Grammar");
        assertThat(indexOfTopic(mineList, topic)).isGreaterThanOrEqualTo(0);
        assertThat(mineList).extracting(MistakeResponse::id).doesNotContain(theirs.id());
    }

    @Test
    void recurring_ordersByTimesRepeatedDescending() {
        String frequentTopic = "Frequent" + System.nanoTime();
        String rareTopic = "Rare" + System.nanoTime();

        createMistake(rareTopic, "a", "b");
        createMistake(frequentTopic, "c", "d");
        createMistake(frequentTopic, "c2", "d2");
        createMistake(frequentTopic, "c3", "d3");

        List<MistakeResponse> recurring = fetchRecurring("en", 50);

        int frequentIndex = indexOfTopic(recurring, frequentTopic);
        int rareIndex = indexOfTopic(recurring, rareTopic);
        assertThat(frequentIndex).isGreaterThanOrEqualTo(0);
        assertThat(rareIndex).isGreaterThanOrEqualTo(0);
        assertThat(frequentIndex).isLessThan(rareIndex);
        assertThat(recurring.get(frequentIndex).timesRepeated()).isEqualTo(3);
    }

    @Test
    void categories_returnsSeededEightCategories() {
        List<String> categories =
                client.get()
                        .uri("/api/mistakes/categories")
                        .header(HttpHeaders.AUTHORIZATION, authHeader)
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(new ParameterizedTypeReference<List<String>>() {})
                        .returnResult()
                        .getResponseBody();

        assertThat(categories)
                .containsExactlyInAnyOrder(
                        "Vocabulary",
                        "Grammar",
                        "Word order",
                        "Pronunciation",
                        "Usage",
                        "Spelling",
                        "Tone",
                        "Other");
    }

    @Test
    void list_filtersByLanguageAndCategory() {
        String topic = "FilterTest" + System.nanoTime();
        createMistake(topic, "orig", "fixed");

        List<MistakeResponse> filtered = fetchList("en", "Grammar");
        assertThat(indexOfTopic(filtered, topic)).isGreaterThanOrEqualTo(0);

        List<MistakeResponse> wrongCategory = fetchList("en", "Spelling");
        assertThat(indexOfTopic(wrongCategory, topic)).isEqualTo(-1);
    }

    private MistakeResponse createMistake(String topic, String original, String corrected) {
        CreateMistakeRequest request =
                new CreateMistakeRequest("en", null, "Grammar", topic, original, corrected, "explanation");
        return client.post()
                .uri("/api/mistakes")
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .body(request)
                .exchange()
                .expectStatus()
                .isCreated()
                .expectBody(MistakeResponse.class)
                .returnResult()
                .getResponseBody();
    }

    private List<MistakeResponse> fetchRecurring(String language, int limit) {
        return client.get()
                .uri("/api/mistakes/recurring?language=" + language + "&limit=" + limit)
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody(new ParameterizedTypeReference<List<MistakeResponse>>() {})
                .returnResult()
                .getResponseBody();
    }

    private List<MistakeResponse> fetchList(String language, String category) {
        return client.get()
                .uri("/api/mistakes?language=" + language + "&category=" + category)
                .header(HttpHeaders.AUTHORIZATION, authHeader)
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody(new ParameterizedTypeReference<List<MistakeResponse>>() {})
                .returnResult()
                .getResponseBody();
    }

    private int indexOfTopic(List<MistakeResponse> mistakes, String topic) {
        for (int i = 0; i < mistakes.size(); i++) {
            if (topic.equals(mistakes.get(i).topic())) {
                return i;
            }
        }
        return -1;
    }
}
