package com.iit.creditmanagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.cache.annotation.EnableCaching;

/**
 * MIT Open Credit Management System — Application Entry Point.
 *
 * Key enterprise capabilities enabled:
 * - @EnableAsync : Dispatches audit logs and notifications on a dedicated thread
 *                 pool (configured in application.properties), freeing request
 *                 threads from blocking on cross-cutting concerns.
 */
@SpringBootApplication
@EnableAsync
@EnableCaching
public class CreditManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(CreditManagementApplication.class, args);
    }
}
