package com.iit.creditmanagement.model.enums;

import lombok.Getter;

@Getter
public enum SemesterName {
    Y1S1("1st Year 1st Semester"),
    Y1S2("1st Year 2nd Semester"),
    Y2S1("2nd Year 1st Semester"),
    Y2S2("2nd Year 2nd Semester"),
    Y3S1("3rd Year 1st Semester"),
    Y3S2("3rd Year 2nd Semester"),
    Y4S1("4th Year 1st Semester"),
    Y4S2("4th Year 2nd Semester"),
    SPRING("Spring"),
    SUMMER("Summer"),
    FALL("Fall");

    private final String displayName;

    SemesterName(String displayName) {
        this.displayName = displayName;
    }
}
