package com.learnflow.backend.curriculum;

import com.learnflow.backend.curriculum.domain.ContentSource;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContentSourceRepository extends JpaRepository<ContentSource, Long> {

    List<ContentSource> findAllByOrderByNameAsc();
}
