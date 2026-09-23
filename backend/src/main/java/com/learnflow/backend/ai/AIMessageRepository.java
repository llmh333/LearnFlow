package com.learnflow.backend.ai;

import com.learnflow.backend.ai.domain.AIMessage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AIMessageRepository extends JpaRepository<AIMessage, Long> {

    List<AIMessage> findByConversation_IdOrderByCreatedAtAsc(Long conversationId);
}
