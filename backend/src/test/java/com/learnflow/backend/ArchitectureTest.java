package com.learnflow.backend;

import static com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAPackage;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.simpleNameEndingWith;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

/**
 * Enforces the module-boundary rules in {@code plan/phases/00-overview.md} §1.1 and §3 rule 1 in
 * code, not just in docs: {@code ai} must never be able to touch a review schedule directly, and
 * no controller may bypass its service layer.
 */
@AnalyzeClasses(packagesOf = BackendApplication.class, importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

    @ArchTest
    static final ArchRule ai_must_not_depend_on_srs_domain_entities =
            noClasses()
                    .that()
                    .resideInAPackage("..ai..")
                    .should()
                    .dependOnClassesThat()
                    .resideInAPackage("..srs.domain..")
                    .because("AI must never touch SRS entities directly (00-overview.md §3 rule 1)");

    @ArchTest
    static final ArchRule ai_must_not_depend_on_srs_repositories =
            noClasses()
                    .that()
                    .resideInAPackage("..ai..")
                    .should()
                    .dependOnClassesThat(resideInAPackage("..srs..").and(simpleNameEndingWith("Repository")))
                    .because("AI must go through srs.ReviewService, never a repository directly");

    @ArchTest
    static final ArchRule controllers_must_not_depend_on_repositories =
            noClasses()
                    .that()
                    .haveSimpleNameEndingWith("Controller")
                    .should()
                    .dependOnClassesThat(simpleNameEndingWith("Repository"))
                    .because("Controllers must go through a Service (00-overview.md §1.1 rule 1)");
}
