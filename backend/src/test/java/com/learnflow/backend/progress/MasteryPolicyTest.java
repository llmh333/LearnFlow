package com.learnflow.backend.progress;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class MasteryPolicyTest {

    @Test
    void isMastered_bothThresholdsMet_true() {
        assertThat(MasteryPolicy.isMastered(BigDecimal.valueOf(21), BigDecimal.valueOf(2.5))).isTrue();
        assertThat(MasteryPolicy.isMastered(BigDecimal.valueOf(45), BigDecimal.valueOf(2.8))).isTrue();
    }

    @Test
    void isMastered_intervalBelowThreshold_false() {
        assertThat(MasteryPolicy.isMastered(BigDecimal.valueOf(20.99), BigDecimal.valueOf(2.5)))
                .isFalse();
    }

    @Test
    void isMastered_easeFactorBelowThreshold_false() {
        assertThat(MasteryPolicy.isMastered(BigDecimal.valueOf(30), BigDecimal.valueOf(2.49)))
                .isFalse();
    }

    @Test
    void isMastered_bothBelowThreshold_false() {
        assertThat(MasteryPolicy.isMastered(BigDecimal.valueOf(1), BigDecimal.valueOf(1.3))).isFalse();
    }
}
