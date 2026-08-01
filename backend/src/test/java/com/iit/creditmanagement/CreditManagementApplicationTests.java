package com.iit.creditmanagement;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Verifies the entire Spring application context loads without errors.
 * If any bean wiring, configuration, or dependency is broken this test catches it.
 */
@SpringBootTest
@ActiveProfiles("test")
class CreditManagementApplicationTests {

    @Test
    void contextLoads() {
        // If we reach here, the full ApplicationContext started successfully
    }
}
