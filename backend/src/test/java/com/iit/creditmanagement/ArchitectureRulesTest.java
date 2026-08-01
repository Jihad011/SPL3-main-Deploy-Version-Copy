package com.iit.creditmanagement;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;

/**
 * ArchUnit Architecture Enforcement Tests.
 *
 * These rules mirror the standards at Google (Guava/internal enforcement),
 * Amazon (package-private module APIs), and Palantir (strict layer checks).
 *
 * Running: mvn test -Dtest=ArchitectureRulesTest
 */
@AnalyzeClasses(
    packages = "com.iit.creditmanagement",
    importOptions = ImportOption.DoNotIncludeTests.class
)
public class ArchitectureRulesTest {

    // ─── Rule 1: Strict Layered Architecture ─────────────────────────────────
    // Controllers → Services → Repositories. No skipping layers.
    @ArchTest
    static final ArchRule layered_architecture_is_respected =
        layeredArchitecture()
            .consideringAllDependencies()
            .layer("Controller").definedBy("..controller..")
            .layer("Service").definedBy("..service..")
            .layer("Repository").definedBy("..repository..")
            .layer("Model").definedBy("..model..")
            .layer("Security").definedBy("..security..")
            .layer("Config").definedBy("..config..")
            .layer("Exception").definedBy("..exception..")
            .layer("Util").definedBy("..util..")
            .layer("Constants").definedBy("..constants..")
            .whereLayer("Controller").mayOnlyBeAccessedByLayers("Config")
            .whereLayer("Repository").mayOnlyBeAccessedByLayers("Service", "Util", "Security");

    // ─── Rule 2: Controllers must NOT access Repositories directly ────────────
    // All data access MUST flow through the Service layer (Big Tech standard).
    @ArchTest
    static final ArchRule controllers_must_not_access_repositories_directly =
        noClasses().that().resideInAPackage("..controller..")
            .should().dependOnClassesThat().resideInAPackage("..repository..")
            .because("Controllers must use the Service layer to access data, never repositories directly.");

    // ─── Rule 3: Service interfaces must not depend on HTTP layer ─────────────
    // Services must be framework-agnostic — testable without a running HTTP server.
    @ArchTest
    static final ArchRule services_must_not_depend_on_web_layer =
        noClasses().that().resideInAPackage("..service..")
            .should().dependOnClassesThat()
                .resideInAPackage("jakarta.servlet..")
            .because("Service layer must be decoupled from HTTP/Servlet API. " +
                     "Use DTOs to pass data, never HttpServletRequest.");

    // ─── Rule 4: Entities must NOT be returned directly from Controllers ──────
    // All outbound data must be wrapped in a DTO/Response object (RFC best practice).
    @ArchTest
    static final ArchRule controllers_should_not_return_entities =
        noClasses().that().resideInAPackage("..controller..")
            .should().dependOnClassesThat().resideInAPackage("..model.entity..")
            .because("Controllers must use DTO/Response objects, never JPA Entity classes directly. " +
                     "Exposing entities leads to N+1 issues and security leaks.");

    // ─── Rule 5: Repositories must only contain Spring Data interfaces ─────────
    @ArchTest
    static final ArchRule repositories_must_be_interfaces =
        classes().that().resideInAPackage("..repository..")
            .should().beInterfaces()
            .because("Spring Data repositories must be interfaces, not concrete classes.");

    // ─── Rule 6: Security config must not access business services directly ───
    @ArchTest
    static final ArchRule security_filter_must_not_call_business_services =
        noClasses().that().resideInAPackage("..security..")
                .and().haveSimpleNameEndingWith("Filter")
            .should().dependOnClassesThat()
                .resideInAPackage("..service.impl..")
            .because("Security filters must use UserDetailsService, not concrete business service implementations.");

    // ─── Rule 7: All service implementation classes must end with 'Impl' ──────
    @ArchTest
    static final ArchRule service_impls_should_be_in_impl_package =
        classes().that().resideInAPackage("..service.impl..")
            .should().haveSimpleNameEndingWith("Impl")
            .because("Service implementations must follow the naming convention *ServiceImpl " +
                     "to distinguish them from their interface counterparts.");
}
