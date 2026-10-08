package com.iit.creditmanagement.model.dto.request;

import com.iit.creditmanagement.model.enums.CourseType;
import jakarta.validation.constraints.*;

public record CourseRequest(

        @NotBlank(message = "Course code is required")
        @Size(max = 20, message = "Code must not exceed 20 characters")
        @Pattern(regexp = "^[A-Z]{2,6}-\\d{3,4}$",
                 message = "Code format must be like MIT-501")
        String code,

        @NotBlank(message = "Course name is required")
        @Size(max = 200, message = "Name must not exceed 200 characters")
        String name,

        String description,

        String syllabusUrl,
        String syllabusFileName,

        @NotNull(message = "Credit hours are required")
        @Min(value = 1, message = "Credit hours must be at least 1")
        @Max(value = 6, message = "Credit hours must not exceed 6")
        Integer creditHours,

        @NotNull(message = "Course type is required")
        CourseType courseType,

        @Min(value = 1, message = "Max seats must be at least 1")
        @Max(value = 200, message = "Max seats must not exceed 200")
        Integer maxSeats,       // defaults to 40 in entity if null

        Long teacherId          // optional — can assign later
) {}
