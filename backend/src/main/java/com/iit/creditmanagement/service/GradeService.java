package com.iit.creditmanagement.service;

import com.iit.creditmanagement.model.dto.request.GradeEntryRequest;
import com.iit.creditmanagement.model.dto.response.GradeResponse;
import com.iit.creditmanagement.model.entity.User;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

public interface GradeService {
    GradeResponse enterOrUpdateGrade(Long teacherId, GradeEntryRequest request);
    List<GradeResponse> bulkEnterGrades(Long teacherId, List<GradeEntryRequest> requests);
    List<GradeResponse> uploadGradesCsv(Long teacherId, Long courseId, MultipartFile file);
    GradeResponse getGradeByEnrollment(Long enrollmentId, User currentUser);
    List<GradeResponse> getMyGrades(Long studentId);
    List<GradeResponse> getGradesForCourse(Long courseId, Long semesterId, User currentUser);
    BigDecimal getStudentCgpa(Long studentId);
}
