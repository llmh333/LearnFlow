package com.learnflow.backend.ai;

import com.learnflow.backend.account.AccountService;
import com.learnflow.backend.ai.domain.AiFeature;
import com.learnflow.backend.common.error.TooManyRequestsException;
import java.time.LocalDate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Daily AI quota per user, counted on the user's local day (D7, D8). */
@Service
public class AiUsageService {

    private final AiUsageRepository usageRepository;
    private final AccountService accountService;
    private final AIProperties properties;

    public AiUsageService(
            AiUsageRepository usageRepository,
            AccountService accountService,
            AIProperties properties) {
        this.usageRepository = usageRepository;
        this.accountService = accountService;
        this.properties = properties;
    }

    /**
     * Records one AI call, or throws 429 when today's quota is used up. Joins the caller's
     * transaction if there is one, so a rejected call also rolls back whatever the caller wrote.
     */
    // shortcut: a call that then fails at the provider still counts; refund it if 502s get common.
    @Transactional
    public void consume(Long userId, AiFeature feature) {
        LocalDate today = accountService.today(userId);
        usageRepository.lockUser(userId);
        if (usageRepository.totalCalls(userId, today) >= properties.dailyQuota()) {
            throw new TooManyRequestsException(
                    "Daily AI limit of "
                            + properties.dailyQuota()
                            + " requests reached. It resets at midnight in your time zone.");
        }
        usageRepository.increment(userId, today, feature.name());
    }
}
