package com.learnflow.backend.curriculum;

import static org.assertj.core.api.Assertions.assertThat;

import com.learnflow.backend.auth.dto.AuthResponse;
import com.learnflow.backend.auth.dto.RegisterRequest;
import com.learnflow.backend.common.AbstractIntegrationTest;
import com.learnflow.backend.curriculum.dto.CourseResponse;
import com.learnflow.backend.curriculum.dto.SourceResponse;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.client.RestTestClient;

class CurriculumIntegrationTest extends AbstractIntegrationTest {

    @LocalServerPort private int port;

    @Autowired private ContentImporter importer;
    @Autowired private JpWordRepository wordRepository;
    @Autowired private KanaRepository kanaRepository;
    @Autowired private LessonRepository lessonRepository;

    private RestTestClient client() {
        return RestTestClient.bindToServer().baseUrl("http://localhost:" + port).build();
    }

    @Test
    void importIsIdempotent() {
        long words = wordRepository.count();
        long kana = kanaRepository.count();
        long lessons = lessonRepository.count();
        assertThat(words).isPositive();
        assertThat(kana).isEqualTo(92);

        importer.importAll();

        assertThat(wordRepository.count()).isEqualTo(words);
        assertThat(kanaRepository.count()).isEqualTo(kana);
        assertThat(lessonRepository.count()).isEqualTo(lessons);
    }

    @Test
    void courses_withoutToken_returns401() {
        client().get().uri("/api/curriculum/courses").exchange().expectStatus().isUnauthorized();
    }

    @Test
    void courses_returnsImportedTreeInOrder() {
        RegisterRequest register =
                new RegisterRequest(
                        "cur-" + System.nanoTime() + "@example.com",
                        "password123",
                        "Tester",
                        "Asia/Ho_Chi_Minh",
                        null);
        AuthResponse auth =
                client().post()
                        .uri("/api/auth/register")
                        .body(register)
                        .exchange()
                        .expectStatus()
                        .is2xxSuccessful()
                        .expectBody(AuthResponse.class)
                        .returnResult()
                        .getResponseBody();

        List<CourseResponse> courses =
                client().get()
                        .uri("/api/curriculum/courses")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + auth.token())
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(new ParameterizedTypeReference<List<CourseResponse>>() {})
                        .returnResult()
                        .getResponseBody();

        assertThat(courses)
                .extracting(CourseResponse::key)
                .startsWith("ja.course.kana", "ja.course.n5");
        CourseResponse n5 = courses.get(1);
        assertThat(n5.units().getFirst().key()).isEqualTo("ja.n5.u01");
        assertThat(n5.units().getFirst().lessons())
                .extracting(CourseResponse.LessonSummaryResponse::position)
                .containsExactly(1, 2);
        assertThat(n5.units().getFirst().lessons().getFirst().itemCount()).isEqualTo(6);
    }

    @Test
    void sources_arePublic() {
        List<SourceResponse> sources =
                client().get()
                        .uri("/api/curriculum/sources")
                        .exchange()
                        .expectStatus()
                        .isOk()
                        .expectBody(new ParameterizedTypeReference<List<SourceResponse>>() {})
                        .returnResult()
                        .getResponseBody();

        assertThat(sources).extracting(SourceResponse::key).contains("jmdict", "tatoeba");
    }
}
