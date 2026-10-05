package com.iit.creditmanagement.model.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private Long id;
    private String title;
    private String message;
    private String type;

    @JsonProperty("isRead")
    private boolean isRead;

    private LocalDateTime createdAt;

    @JsonProperty("read")
    public boolean getReadProperty() {
        return isRead;
    }
}

