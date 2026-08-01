package com.iit.creditmanagement.repository;

import com.iit.creditmanagement.model.entity.User;
import com.iit.creditmanagement.model.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    Optional<User> findByRollNumber(String rollNumber);
    Optional<User> findByRegistrationNumber(String registrationNumber);
    boolean existsByEmail(String email);
    boolean existsByRollNumber(String rollNumber);
    boolean existsByRegistrationNumber(String registrationNumber);
    List<User> findAllByRole(Role role);
    Page<User> findAllByRole(Role role, Pageable pageable);
    long countByRole(Role role);
    List<User> findAllByRoleAndIsActive(Role role, boolean isActive);

    @Query("SELECT u FROM User u WHERE u.role = 'STUDENT' AND " +
           "(LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " u.rollNumber LIKE CONCAT('%', :query, '%') OR " +
           " u.registrationNumber LIKE CONCAT('%', :query, '%'))")
    List<User> searchStudents(@Param("query") String query);
}
