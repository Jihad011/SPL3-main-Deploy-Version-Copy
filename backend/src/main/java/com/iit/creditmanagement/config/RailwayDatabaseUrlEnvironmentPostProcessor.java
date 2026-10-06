package com.iit.creditmanagement.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.HashMap;
import java.util.Map;

/**
 * Automatically converts raw Railway/Heroku/Render postgresql:// or postgres:// URLs
 * into standard JDBC format (jdbc:postgresql://...) before Datasource and Flyway initialize.
 * 
 * Only activates when cloud environment variables (SPRING_DATASOURCE_URL, DATABASE_URL, POSTGRES_URL)
 * are explicitly present in the environment.
 */
public class RailwayDatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String dbUrl = System.getenv("SPRING_DATASOURCE_URL");
        if (dbUrl == null || dbUrl.isBlank()) {
            dbUrl = System.getenv("DATABASE_URL");
        }
        if (dbUrl == null || dbUrl.isBlank()) {
            dbUrl = System.getenv("POSTGRES_URL");
        }

        if (dbUrl != null && !dbUrl.isBlank()) {
            String fixedUrl = dbUrl.trim();
            if (fixedUrl.startsWith("postgres://")) {
                fixedUrl = "jdbc:postgresql://" + fixedUrl.substring("postgres://".length());
            } else if (fixedUrl.startsWith("postgresql://")) {
                fixedUrl = "jdbc:postgresql://" + fixedUrl.substring("postgresql://".length());
            }

            if (!fixedUrl.contains("stringtype=")) {
                if (fixedUrl.contains("?")) {
                    fixedUrl += "&stringtype=unspecified";
                } else {
                    fixedUrl += "?stringtype=unspecified";
                }
            }

            Map<String, Object> map = new HashMap<>();
            map.put("spring.datasource.url", fixedUrl);
            environment.getPropertySources().addFirst(new MapPropertySource("railwayDbUrlFix", map));
        }
    }
}
