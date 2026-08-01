package com.iit.creditmanagement.exception;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.bind.MissingServletRequestParameterException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();
    private MockHttpServletRequest request;

    @BeforeEach
    void setUp() {
        request = new MockHttpServletRequest("GET", "/api/test");
        MDC.put("correlationId", "test-correlation-id");
    }

    @AfterEach
    void tearDown() {
        MDC.clear();
    }

    @Test
    void genericException_MasksInternalMessageAndReturnsTraceableProblem() {
        ProblemDetail problem = handler.handleGeneric(
                new RuntimeException("SQL password and internal stack details"),
                request);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR.value(), problem.getStatus());
        assertEquals("Internal Server Error", problem.getTitle());
        assertEquals("An unexpected internal error occurred.", problem.getDetail());
        assertFalse(problem.getDetail().contains("SQL password"));
        assertCommonProperties(problem, "INTERNAL_ERROR");
    }

    @Test
    void illegalArgument_DoesNotExposeRawLibraryMessage() {
        ProblemDetail problem = handler.handleIllegalArgument(
                new IllegalArgumentException("sensitive parser implementation detail"),
                request);

        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY.value(), problem.getStatus());
        assertEquals("The request contains an invalid value.", problem.getDetail());
        assertFalse(problem.getDetail().contains("parser implementation"));
        assertCommonProperties(problem, "INVALID_ARGUMENT");
    }

    @Test
    void missingParameter_IsClassifiedAsBadRequestInsteadOfInternalError() {
        ProblemDetail problem = handler.handleInvalidRequest(
                new MissingServletRequestParameterException("semesterId", "long"),
                request);

        assertEquals(HttpStatus.BAD_REQUEST.value(), problem.getStatus());
        assertEquals("A request parameter or path value is invalid.", problem.getDetail());
        assertCommonProperties(problem, "INVALID_REQUEST");
    }

    @Test
    void dataIntegrityViolation_ReturnsSafeConflictResponse() {
        ProblemDetail problem = handler.handleDataIntegrity(
                new DataIntegrityViolationException("constraint users_email_key SQL statement"),
                request);

        assertEquals(HttpStatus.CONFLICT.value(), problem.getStatus());
        assertEquals("The request conflicts with an existing record.", problem.getDetail());
        assertFalse(problem.getDetail().contains("users_email_key"));
        assertCommonProperties(problem, "DATA_CONFLICT");
    }

    private void assertCommonProperties(ProblemDetail problem, String expectedErrorCode) {
        assertNotNull(problem.getProperties());
        assertEquals(expectedErrorCode, problem.getProperties().get("errorCode"));
        assertEquals("/api/test", problem.getProperties().get("path"));
        assertEquals("test-correlation-id", problem.getProperties().get("correlationId"));
        assertNotNull(problem.getProperties().get("timestamp"));
    }
}
