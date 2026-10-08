package com.iit.creditmanagement.model.enums;

import lombok.Getter;

@Getter
public enum SemesterName {
    FIRST_SEMESTER("First Semester"),
    SECOND_SEMESTER("Second Semester"),
    THIRD_SEMESTER("Third Semester");

    private final String displayName;

    SemesterName(String displayName) {
        this.displayName = displayName;
    }
}
