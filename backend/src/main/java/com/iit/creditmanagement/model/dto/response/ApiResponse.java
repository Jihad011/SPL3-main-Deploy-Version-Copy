package com.iit.creditmanagement.model.dto.response;

/**
 * Generic wrapper for simple success/error messages.
 * Use for DELETE, PATCH status operations that don't return entity data.
 */
public record ApiResponse(
        boolean success,
        String  message
) {
    public static ApiResponse ok(String message) {
        return new ApiResponse(true, message);
    }

    public static ApiResponse error(String message) {
        return new ApiResponse(false, message);
    }
}
