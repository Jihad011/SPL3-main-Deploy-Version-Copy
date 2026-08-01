package com.iit.creditmanagement.model.entity;

import com.iit.creditmanagement.model.enums.GradeLetter;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "grades")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Grade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "enrollment_id", nullable = false, unique = true)
    private Enrollment enrollment;

    @Column(name = "midterm_marks", precision = 5, scale = 2)
    private BigDecimal midtermMarks;   // max 40

    @Column(name = "final_marks", precision = 5, scale = 2)
    private BigDecimal finalMarks;     // max 60

    // Computed by DB trigger; read-only from application perspective
    @Enumerated(EnumType.STRING)
    @Column(name = "grade_letter")
    private GradeLetter gradeLetter;

    @Column(name = "grade_point", precision = 3, scale = 2)
    private BigDecimal gradePoint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entered_by")
    private User enteredBy;

    @CreatedDate
    @Column(name = "entered_at", nullable = false, updatable = false)
    private OffsetDateTime enteredAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    /** Total marks out of 100 */
    public BigDecimal getTotalMarks() {
        if (midtermMarks == null && finalMarks == null) return BigDecimal.ZERO;
        if (midtermMarks == null) return finalMarks;
        if (finalMarks == null) return midtermMarks;
        return midtermMarks.add(finalMarks);
    }
}
