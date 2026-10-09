package com.iit.creditmanagement.repository;

import com.iit.creditmanagement.model.entity.Semester;
import com.iit.creditmanagement.model.enums.SemesterName;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SemesterRepository extends JpaRepository<Semester, Long> {

    Optional<Semester> findByName(SemesterName name);

    @Query("SELECT s FROM Semester s WHERE s.isActive = true ORDER BY s.id DESC")
    List<Semester> findAllByIsActiveTrue();

    default Optional<Semester> findActiveSemester() {
        List<Semester> activeList = findAllByIsActiveTrue();
        return activeList.isEmpty() ? Optional.empty() : Optional.of(activeList.get(0));
    }
}
