package com.learnflow.backend.ai;

import com.learnflow.backend.ai.domain.AIConversation;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AIConversationRepository extends JpaRepository<AIConversation, Long> {

    List<AIConversation> findAllByOrderByStartedAtDesc();
}
