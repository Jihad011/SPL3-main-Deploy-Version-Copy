package com.iit.creditmanagement.exception;

import lombok.extern.slf4j.Slf4j;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.MDC;
import org.springframework.dao.CannotAcquireLockException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    private ProblemDetail problem(
            HttpStatus status,
            String detail,
            String errorCode,
            HttpServletRequest request) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(status, detail);
        pd.setTitle(status.getReasonPhrase());
        pd.setProperty("errorCode", errorCode);
        pd.setProperty("timestamp", OffsetDateTime.now().toString());
        pd.setProperty("path", request.getRequestURI());

        String correlationId = MDC.get("correlationId");
        if (correlationId != null) {
            pd.setProperty("correlationId", correlationId);
        }
        return pd;
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        return problem(HttpStatus.NOT_FOUND, ex.getMessage(), "RESOURCE_NOT_FOUND", request);
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ProblemDetail handleBusinessRule(BusinessRuleException ex, HttpServletRequest request) {
        return problem(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage(), "BUSINESS_RULE_VIOLATION", request);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ProblemDetail handleBadCredentials(BadCredentialsException ex, HttpServletRequest request) {
        return problem(HttpStatus.UNAUTHORIZED, "Invalid email or password", "INVALID_CREDENTIALS", request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        return problem(
                HttpStatus.FORBIDDEN,
                "Access denied: insufficient permissions",
                "ACCESS_DENIED",
                request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        fe -> fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid value",
                        (a, b) -> a
                ));
        ProblemDetail pd = problem(HttpStatus.BAD_REQUEST, "Validation failed", "VALIDATION_FAILED", request);
        pd.setProperty("fieldErrors", fieldErrors);
        return pd;
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail handleMalformedJson(HttpMessageNotReadableException ex, HttpServletRequest request) {
        log.warn("Malformed JSON request: {}", ex.getMessage());
        return problem(
                HttpStatus.BAD_REQUEST,
                "Malformed JSON request or invalid field format.",
                "MALFORMED_REQUEST",
                request);
    }

    @ExceptionHandler({
        MissingServletRequestParameterException.class,
        MethodArgumentTypeMismatchException.class,
        ConstraintViolationException.class
    })
    public ProblemDetail handleInvalidRequest(Exception ex, HttpServletRequest request) {
        log.warn("Invalid request: {}", ex.getMessage());
        return problem(
                HttpStatus.BAD_REQUEST,
                "A request parameter or path value is invalid.",
                "INVALID_REQUEST",
                request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest request) {
        log.warn("Illegal argument: {}", ex.getMessage());
        return problem(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "The request contains an invalid value.",
                "INVALID_ARGUMENT",
                request);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ProblemDetail handleIllegalState(IllegalStateException ex, HttpServletRequest request) {
        log.warn("Illegal state: {}", ex.getMessage());
        return problem(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "The request cannot be completed in the current state.",
                "INVALID_STATE",
                request);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleDataIntegrity(DataIntegrityViolationException ex, HttpServletRequest request) {
        log.error("Database constraint violation", ex);
        return problem(
                HttpStatus.CONFLICT,
                "The request conflicts with an existing record.",
                "DATA_CONFLICT",
                request);
    }

    @ExceptionHandler({
        CannotAcquireLockException.class,
        ObjectOptimisticLockingFailureException.class
    })
    public ProblemDetail handleConcurrencyFailures(Exception ex, HttpServletRequest request) {
        log.warn("Database concurrency collision: {}", ex.getMessage());
        return problem(
                HttpStatus.CONFLICT,
                "The record was modified by another request. Please try again.",
                "CONCURRENT_MODIFICATION",
                request);
    }

    @ExceptionHandler({
        MaxUploadSizeExceededException.class,
        MultipartException.class
    })
    public ProblemDetail handleMaxUploadSize(Exception ex, HttpServletRequest request) {
        log.warn("File upload error: {}", ex.getMessage());
        return problem(
                HttpStatus.PAYLOAD_TOO_LARGE,
                "Uploaded file processing error: " + ex.getMessage(),
                "FILE_UPLOAD_ERROR",
                request);
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGeneric(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception", ex);
        return problem(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected internal error occurred.",
                "INTERNAL_ERROR",
                request);
    }
}
