package com.iit.creditmanagement.model.entity;

import com.iit.creditmanagement.model.enums.CourseType;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "courses")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "credit_hours", nullable = false)
    private Integer creditHours;

    @Enumerated(EnumType.STRING)
    @Column(name = "course_type", nullable = false)
    @Builder.Default
    private CourseType courseType = CourseType.OPTIONAL;

    @Column(name = "max_seats", nullable = false)
    @Builder.Default
    private Integer maxSeats = 40;

    @Column(name = "current_enrollment", nullable = false)
    @Builder.Default
    private Integer currentEnrollment = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private User teacher;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Version
    @Column(name = "version")
    private Long version;

    /** Returns true if this course still has available seats. */
    public boolean hasAvailableSeats() {
        return currentEnrollment < maxSeats;
    }
}
