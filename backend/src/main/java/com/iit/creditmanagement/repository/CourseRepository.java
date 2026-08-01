package com.iit.creditmanagement.repository;

import com.iit.creditmanagement.model.entity.Course;
import com.iit.creditmanagement.model.enums.CourseType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    Optional<Course> findByCode(String code);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Course c WHERE c.id = :id")
    Optional<Course> findByIdForUpdate(@Param("id") Long id);
    List<Course> findAllByIsActive(boolean isActive);
    long countByIsActive(boolean isActive);
    List<Course> findAllByCourseTypeAndIsActive(CourseType type, boolean isActive);

    @Query("SELECT c FROM Course c WHERE c.teacher.id = :teacherId AND c.isActive = true")
    List<Course> findByTeacherId(@Param("teacherId") Long teacherId);

    /** Courses not yet enrolled by the student in the given semester */
    @Query("""
        SELECT c FROM Course c
        WHERE c.isActive = true
          AND c.id NOT IN (
              SELECT e.course.id FROM Enrollment e
              WHERE e.student.id = :studentId
                AND e.semester.id = :semesterId
                AND e.status = 'ACTIVE'
          )
    """)
    List<Course> findAvailableForStudent(
            @Param("studentId") Long studentId,
            @Param("semesterId") Long semesterId);
}
