package com.iit.creditmanagement;

import org.junit.jupiter.api.TestInstance;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Base class for all Spring Boot integration tests.
 *
 * Starts a REAL PostgreSQL 16 container (same version as production)
 * so tests exercise actual DB triggers, Flyway migrations, and constraints.
 *
 * This is the industry standard at Amazon (AWS internal services),
 * Netflix (chaos testing), and Stripe (payment reconciliation tests).
 *
 * Usage: Extend this class in any integration test that needs the database.
 *
 * <pre>{@code
 * class EnrollmentIntegrationTest extends BaseIntegrationTest {
 *     @Autowired EnrollmentService enrollmentService;
 *
 *     @Test
 *     void shouldPreventOverEnrollmentBeyondCreditLimit() { ... }
 * }
 * }</pre>
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public abstract class BaseIntegrationTest {

    /**
     * Singleton container — started once and shared across all test classes
     * to avoid the ~3s startup overhead per test class (Testcontainers best practice).
     */
    @Container
    static final PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("credit_management_test")
            .withUsername("test_user")
            .withPassword("test_password")
            .withReuse(true); // Reuse container across Maven surefire forks

    /**
     * Dynamically injects the container's JDBC URL, username, and password
     * into Spring's application context BEFORE beans are initialized.
     * This ensures Flyway, JPA, and all repositories point to the test container.
     */
    @DynamicPropertySource
    static void registerPostgresProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        // Disable Flyway baseline check; test DB starts empty
        registry.add("spring.flyway.baseline-on-migrate", () -> "true");
    }
}
