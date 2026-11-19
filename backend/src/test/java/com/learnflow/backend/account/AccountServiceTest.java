package com.learnflow.backend.account;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.learnflow.backend.account.domain.UserProfile;
import com.learnflow.backend.account.dto.request.UpdateProfileRequest;
import com.learnflow.backend.common.error.BadRequestException;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    /** 17:30 UTC on 1 Jan is already 00:30 on 2 Jan in Vietnam (UTC+7). */
    private static final Instant NOW = Instant.parse("2026-01-01T17:30:00Z");

    private static final Clock CLOCK = Clock.fixed(NOW, ZoneOffset.UTC);

    @Mock private UserProfileRepository profileRepository;

    private AccountService service() {
        return new AccountService(profileRepository, CLOCK);
    }

    private void givenProfile(String timezone) {
        when(profileRepository.findById(1L))
                .thenReturn(
                        Optional.of(new UserProfile(1L, timezone, (short) 10, (short) 10, NOW)));
    }

    @Test
    void today_followsTheUsersTimezoneNotUtc() {
        givenProfile("Asia/Ho_Chi_Minh");

        assertThat(service().today(1L)).isEqualTo(LocalDate.of(2026, 1, 2));
    }

    @Test
    void today_inUtcZoneIsStillTheFirst() {
        givenProfile("UTC");

        assertThat(service().today(1L)).isEqualTo(LocalDate.of(2026, 1, 1));
    }

    @Test
    void createProfile_rejectsAnOffsetInsteadOfARegion() {
        assertThatThrownBy(() -> service().createProfile(1L, "+07:00"))
                .isInstanceOfSatisfying(
                        BadRequestException.class,
                        e -> assertThat(e.getErrors()).containsKey("timezone"));
    }

    @Test
    void updateProfile_rejectsDailyMinutesOutsideTheAllowedSet() {
        givenProfile("Asia/Ho_Chi_Minh");

        assertThatThrownBy(() ->
                        service().updateProfile(1L, new UpdateProfileRequest(null, null, 7, null)))
                .isInstanceOfSatisfying(
                        BadRequestException.class,
                        e -> assertThat(e.getErrors()).containsKey("dailyMinutes"));
    }

    @Test
    void updateProfile_changesOnlyGivenFields() {
        givenProfile("Asia/Ho_Chi_Minh");

        var response = service().updateProfile(1L, new UpdateProfileRequest(null, null, 15, null));

        assertThat(response.dailyMinutes()).isEqualTo(15);
        assertThat(response.dailyNewItems()).isEqualTo(10);
        assertThat(response.timezone()).isEqualTo("Asia/Ho_Chi_Minh");
    }
}
