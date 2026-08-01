package com.iit.creditmanagement.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
    info = @Info(
        title       = "MIT Open Credit Management System API",
        version     = "1.0.0",
        description = "REST API for the IIT Dhaka student lifecycle management system. " +
                      "Handles course enrollment (12-credit rule, 40-seat cap), " +
                      "grade entry, CGPA calculation, and fee management.",
        contact     = @Contact(
            name  = "Md. Jihad Hossain",
            email = "jihad@iit.du.ac.bd"
        )
    ),
    servers = {
        @Server(url = "/api", description = "Default server (context path /api)")
    }
)
@SecurityScheme(
    name   = "Bearer Authentication",
    type   = SecuritySchemeType.HTTP,
    scheme = "bearer",
    bearerFormat = "JWT",
    in     = SecuritySchemeIn.HEADER
)
public class SwaggerConfig {
    // Configuration is driven entirely by annotations above.
    // Access Swagger UI at: http://localhost:8080/api/swagger-ui.html
}
