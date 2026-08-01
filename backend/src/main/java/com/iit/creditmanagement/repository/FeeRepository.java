package com.iit.creditmanagement.repository;

import com.iit.creditmanagement.model.entity.Fee;
import com.iit.creditmanagement.model.enums.FeeStatus;
import com.iit.creditmanagement.model.enums.FeeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface FeeRepository extends JpaRepository<Fee, Long> {

    List<Fee> findAllByStudentId(Long studentId);
    List<Fee> findAllByStudentIdAndStatus(Long studentId, FeeStatus status);
    List<Fee> findAllByStudentIdAndFeeType(Long studentId, FeeType feeType);

    @Query("""
        SELECT COALESCE(SUM(f.amount), 0)
        FROM Fee f
        WHERE f.student.id = :studentId AND f.status = 'UNPAID'
    """)
    BigDecimal totalUnpaidByStudent(@Param("studentId") Long studentId);

    /**
     * Idempotency guard: checks if a fee already exists for a specific enrollment.
     * Used by the BillingEnrollmentEventListener to prevent duplicate invoice creation.
     */
    boolean existsByStudentIdAndEnrollmentId(Long studentId, Long enrollmentId);

    /**
     * Checks if a fee of a specific type already exists for an enrollment.
     */
    boolean existsByEnrollmentIdAndFeeType(Long enrollmentId, FeeType feeType);
}
