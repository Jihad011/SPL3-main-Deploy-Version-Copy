package com.iit.creditmanagement.service;

import com.iit.creditmanagement.model.dto.request.EnrollRequest;
import com.iit.creditmanagement.model.dto.response.EnrollmentResponse;

import java.util.List;

public interface EnrollmentService {
    EnrollmentResponse enroll(Long studentId, EnrollRequest request);
    EnrollmentResponse dropCourse(Long enrollmentId, Long studentId);
    List<EnrollmentResponse> getMyEnrollments(Long studentId);
    List<EnrollmentResponse> getEnrollmentsForSemester(Long studentId, Long semesterId);
    List<EnrollmentResponse> getEnrollmentsByCourse(Long courseId, Long semesterId);
}
