package com.learnflow.backend.ai;

import com.learnflow.backend.ai.dto.ScenarioResponse;
import java.util.List;
import java.util.Map;

/**
 * Fixed role-play scenario presets per language (PROJECT.md §4.4). Plain constants, not domain
 * data — no table needed for 5 fixed strings per language.
 */
final class ScenarioCatalog {

    private static final List<ScenarioResponse> EN =
            List.of(
                    new ScenarioResponse("MEETING", "Business meeting"),
                    new ScenarioResponse("INTERVIEW", "Job interview"),
                    new ScenarioResponse("RESTAURANT", "At a restaurant"),
                    new ScenarioResponse("TRAVEL", "Traveling"),
                    new ScenarioResponse("DAILY", "Daily conversation"));

    private static final List<ScenarioResponse> ZH =
            List.of(
                    new ScenarioResponse("RESTAURANT", "At a restaurant"),
                    new ScenarioResponse("SHOPPING", "Shopping"),
                    new ScenarioResponse("WORK", "At work"),
                    new ScenarioResponse("TRAVEL", "Traveling"),
                    new ScenarioResponse("DAILY", "Daily conversation"));

    // Not explicitly listed in PROJECT.md (only EN/ZH given as examples) but the app supports
    // Japanese too (D9) — reusing the same shape keeps JLPT learners from missing this feature.
    private static final List<ScenarioResponse> JA = ZH;

    private static final Map<String, List<ScenarioResponse>> BY_LANGUAGE = Map.of("en", EN, "zh", ZH, "ja", JA);

    private ScenarioCatalog() {}

    static List<ScenarioResponse> forLanguage(String languageCode) {
        return BY_LANGUAGE.getOrDefault(languageCode, List.of());
    }
}
