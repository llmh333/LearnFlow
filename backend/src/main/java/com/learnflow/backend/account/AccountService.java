package com.learnflow.backend.account;

import com.learnflow.backend.account.domain.UserProfile;
import com.learnflow.backend.account.dto.request.UpdateProfileRequest;
import com.learnflow.backend.account.dto.response.ProfileResponse;
import com.learnflow.backend.common.error.BadRequestException;
import com.learnflow.backend.common.error.NotFoundException;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Learner profile, and the one place that turns "now" into the learner's local day (D7). */
@Service
@Transactional
public class AccountService {

    private static final Set<Integer> DAILY_MINUTES = Set.of(5, 10, 15, 20);
    private static final short DEFAULT_DAILY_MINUTES = 10;
    private static final short DEFAULT_DAILY_NEW_ITEMS = 10;

    private final UserProfileRepository profileRepository;
    private final Clock clock;

    public AccountService(UserProfileRepository profileRepository, Clock clock) {
        this.profileRepository = profileRepository;
        this.clock = clock;
    }

    /** Called once by registration, in the same transaction that creates the user. */
    public void createProfile(Long userId, String timezone) {
        profileRepository.save(
                new UserProfile(
                        userId,
                        validTimezone(timezone),
                        DEFAULT_DAILY_MINUTES,
                        DEFAULT_DAILY_NEW_ITEMS,
                        Instant.now(clock)));
    }

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(Long userId) {
        return ProfileResponse.from(find(userId));
    }

    public ProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        UserProfile profile = find(userId);
        if (request.timezone() != null) {
            profile.setTimezone(validTimezone(request.timezone()));
        }
        if (request.goal() != null) {
            profile.setGoal(request.goal());
            if (profile.getOnboardedAt() == null) {
                profile.setOnboardedAt(Instant.now(clock));
            }
        }
        if (request.dailyMinutes() != null) {
            if (!DAILY_MINUTES.contains(request.dailyMinutes())) {
                throw new BadRequestException("dailyMinutes", "must be one of 5, 10, 15, 20");
            }
            profile.setDailyMinutes(request.dailyMinutes().shortValue());
        }
        if (request.dailyNewItems() != null) {
            profile.setDailyNewItems(request.dailyNewItems().shortValue());
        }
        profile.setUpdatedAt(Instant.now(clock));
        return ProfileResponse.from(profile);
    }

    /** Today in the learner's timezone — use this, never a UTC date, for any per-day rule. */
    @Transactional(readOnly = true)
    public LocalDate today(Long userId) {
        return LocalDate.now(clock.withZone(ZoneId.of(find(userId).getTimezone())));
    }

    private UserProfile find(Long userId) {
        return profileRepository
                .findById(userId)
                .orElseThrow(() -> new NotFoundException("Profile not found for user " + userId));
    }

    /**
     * Only IANA region ids ("Asia/Ho_Chi_Minh"), not offsets like "+07:00" that ignore DST rules.
     */
    private static String validTimezone(String timezone) {
        if (timezone == null || !ZoneId.getAvailableZoneIds().contains(timezone)) {
            throw new BadRequestException(
                    "timezone", "must be an IANA time zone such as Asia/Ho_Chi_Minh");
        }
        return timezone;
    }
}
