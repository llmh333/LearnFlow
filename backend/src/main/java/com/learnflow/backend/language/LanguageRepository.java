package com.learnflow.backend.language;

import com.learnflow.backend.language.domain.Language;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LanguageRepository extends JpaRepository<Language, Short> {

    Optional<Language> findByCode(String code);

    List<Language> findAllByOrderByIdAsc();
}
