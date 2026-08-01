package com.iit.creditmanagement.repository;

import com.iit.creditmanagement.model.entity.Grade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface GradeRepository extends JpaRepository<Grade, Long> {

    Optional<Grade> findByEnrollmentId(Long enrollmentId);

    List<Grade> findAllByEnrollmentStudentId(Long studentId);

    /** CGPA query: weighted average across all graded enrollments */
    @Query("""
        SELECT ROUND(
            SUM(g.gradePoint * c.creditHours) / NULLIF(SUM(c.creditHours), 0),
        2)
        FROM Grade g
        JOIN g.enrollment e
        JOIN e.course c
        WHERE e.student.id = :studentId
          AND g.gradePoint IS NOT NULL
    """)
    Optional<BigDecimal> calculateCgpa(@Param("studentId") Long studentId);

    /** All grades for a specific course + semester (teacher view) */
    @Query("""
        SELECT g FROM Grade g
        JOIN FETCH g.enrollment e
        JOIN FETCH e.student
        WHERE e.course.id = :courseId
          AND e.semester.id = :semesterId
    """)
    List<Grade> findGradesByCourseAndSemester(
            @Param("courseId") Long courseId,
            @Param("semesterId") Long semesterId);
}
