package com.iit.creditmanagement.repository;

import com.iit.creditmanagement.model.entity.Enrollment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    List<Enrollment> findAllByStudentIdAndSemesterId(Long studentId, Long semesterId);
    List<Enrollment> findAllByStudentId(Long studentId);
    Page<Enrollment> findAllByStudentId(Long studentId, Pageable pageable);
    
    Optional<Enrollment> findByStudentRollNumberAndCourseId(String rollNumber, Long courseId);

    List<Enrollment> findAllByCourseIdAndSemesterId(Long courseId, Long semesterId);

    Optional<Enrollment> findByStudentIdAndCourseIdAndSemesterId(
            Long studentId, Long courseId, Long semesterId);

    boolean existsByStudentIdAndCourseIdAndSemesterId(
            Long studentId, Long courseId, Long semesterId);

    /** Sum of credit hours for ACTIVE enrollments in a semester */
    @Query("""
        SELECT COALESCE(SUM(c.creditHours), 0)
        FROM Enrollment e
        JOIN e.course c
        WHERE e.student.id = :studentId
          AND e.semester.id = :semesterId
          AND e.status = 'ACTIVE'
    """)
    Integer sumCreditsByStudentAndSemester(
            @Param("studentId") Long studentId,
            @Param("semesterId") Long semesterId);

    /** All enrollments for a course in the active semester (for teacher grade entry) */
    @Query("""
        SELECT e FROM Enrollment e
        JOIN FETCH e.student
        JOIN FETCH e.course
        WHERE e.course.id = :courseId
          AND (:semesterId IS NULL OR e.semester.id = :semesterId)
          AND e.status IN ('ACTIVE', 'COMPLETED', 'FAILED')
        ORDER BY e.student.rollNumber
    """)
    List<Enrollment> findEnrollmentsForGradeEntry(
            @Param("courseId") Long courseId,
            @Param("semesterId") Long semesterId);
}
