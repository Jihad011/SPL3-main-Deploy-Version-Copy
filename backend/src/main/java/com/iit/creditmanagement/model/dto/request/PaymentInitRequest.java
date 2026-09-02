package com.iit.creditmanagement.model.dto.request;

import jakarta.validation.constraints.NotNull;

public record PaymentInitRequest(
    @NotNull(message = "Fee ID is required")
    Long feeId
) {}
