package com.iit.creditmanagement.service;

import com.iit.creditmanagement.model.dto.request.FeeCreateRequest;
import com.iit.creditmanagement.model.dto.response.FeeResponse;

import com.iit.creditmanagement.model.enums.PaymentMethod;

import java.math.BigDecimal;
import java.util.List;

public interface FeeService {
    List<FeeResponse> getMyFees(Long studentId);
    List<FeeResponse> getUnpaidFees(Long studentId);
    BigDecimal getTotalDues(Long studentId);
    FeeResponse createFee(Long adminId, FeeCreateRequest request);
    FeeResponse markAsPaid(Long feeId, Long adminId, PaymentMethod paymentMethod);
    FeeResponse payFeeStudent(Long feeId, Long studentId, PaymentMethod paymentMethod);
    List<FeeResponse> getFeesByStudent(Long studentId);   // admin
    List<FeeResponse> getAllFees();                        // admin
}
