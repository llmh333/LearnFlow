package com.learnflow.backend.ai;

import com.learnflow.backend.ai.domain.AIConversation;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AIConversationRepository extends JpaRepository<AIConversation, Long> {

    Optional<AIConversation> findByIdAndUser_Id(Long id, Long userId);

    List<AIConversation> findAllByUser_IdOrderByStartedAtDesc(Long userId);
}
