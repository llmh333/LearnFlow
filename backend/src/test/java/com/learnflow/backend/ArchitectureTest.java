package com.learnflow.backend;

import static com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAPackage;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.simpleNameEndingWith;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.domain.Dependency;
import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchCondition;
import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.lang.ConditionEvents;
import com.tngtech.archunit.lang.SimpleConditionEvent;
import org.springframework.web.bind.annotation.RestController;

/**
 * Enforces the module-boundary rules in {@code plan/phases/00-overview.md} §1.1 and §3 rule 1 in
 * code, not just in docs: {@code ai} must never be able to touch a review schedule directly, and no
 * controller may bypass its service layer.
 */
@AnalyzeClasses(
        packagesOf = BackendApplication.class,
        importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

    @ArchTest
    static final ArchRule ai_must_not_depend_on_srs_domain_entities =
            noClasses()
                    .that()
                    .resideInAPackage("..ai..")
                    .should()
                    .dependOnClassesThat()
                    .resideInAPackage("..srs.domain..")
                    .because(
                            "AI must never touch SRS entities directly (00-overview.md §3 rule 1)");

    @ArchTest
    static final ArchRule ai_must_not_depend_on_srs_repositories =
            noClasses()
                    .that()
                    .resideInAPackage("..ai..")
                    .should()
                    .dependOnClassesThat(
                            resideInAPackage("..srs..").and(simpleNameEndingWith("Repository")))
                    .because("AI must go through srs.ReviewService, never a repository directly");

    /** Rule 2: a module reaches another module's data only through that module's Service. */
    @ArchTest
    static final ArchRule repositories_are_used_only_inside_their_own_module =
            classes()
                    .that()
                    .resideInAPackage("com.learnflow.backend..")
                    .should(onlyUseRepositoriesOfTheirOwnModule())
                    .because(
                            "Services call other modules' Services, never their Repositories (rule"
                                    + " 2)");

    private static ArchCondition<JavaClass> onlyUseRepositoriesOfTheirOwnModule() {
        return new ArchCondition<>("only use repositories of their own module") {
            @Override
            public void check(JavaClass item, ConditionEvents events) {
                for (Dependency dependency : item.getDirectDependenciesFromSelf()) {
                    JavaClass target = dependency.getTargetClass();
                    if (target.getSimpleName().endsWith("Repository")
                            && target.getPackageName().startsWith(ROOT)
                            && !moduleOf(target).equals(moduleOf(item))) {
                        events.add(
                                SimpleConditionEvent.violated(
                                        dependency, dependency.getDescription()));
                    }
                }
            }
        };
    }

    private static final String ROOT = "com.learnflow.backend.";

    /** First package segment under the root, e.g. "auth" for com.learnflow.backend.auth.dto. */
    private static String moduleOf(JavaClass javaClass) {
        String rest = javaClass.getPackageName().substring(ROOT.length());
        int dot = rest.indexOf('.');
        return dot < 0 ? rest : rest.substring(0, dot);
    }

    @ArchTest
    static final ArchRule controllers_must_not_depend_on_repositories =
            noClasses()
                    .that()
                    .haveSimpleNameEndingWith("Controller")
                    .should()
                    .dependOnClassesThat(simpleNameEndingWith("Repository"))
                    .because("Controllers must go through a Service (00-overview.md §1.1 rule 1)");

    /** The folder shows the version: a controller serving ApiPaths.V1 lives in <module>.api.v1. */
    @ArchTest
    static final ArchRule controllers_live_in_a_versioned_api_package =
            classes()
                    .that()
                    .areAnnotatedWith(RestController.class)
                    .should()
                    .haveNameMatching(".*\\.api\\.v\\d+\\.[^.]+")
                    .because("controllers live in <module>.api.vN, matching ApiPaths.VN");
}
