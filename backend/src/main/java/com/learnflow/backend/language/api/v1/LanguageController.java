package com.learnflow.backend.language.api.v1;

import com.learnflow.backend.common.web.ApiPaths;
import com.learnflow.backend.language.LanguageService;
import com.learnflow.backend.language.dto.LanguageResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiPaths.V1.Languages.BASE)
public class LanguageController {

    private final LanguageService languageService;

    public LanguageController(LanguageService languageService) {
        this.languageService = languageService;
    }

    @GetMapping
    public List<LanguageResponse> list() {
        return languageService.listAll();
    }
}
