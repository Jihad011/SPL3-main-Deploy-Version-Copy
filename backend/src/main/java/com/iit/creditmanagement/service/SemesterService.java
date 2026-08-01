package com.iit.creditmanagement.service;

import com.iit.creditmanagement.model.dto.request.SemesterRequest;
import com.iit.creditmanagement.model.dto.response.SemesterResponse;
import java.util.List;

public interface SemesterService {
    SemesterResponse createSemester(SemesterRequest request);
    SemesterResponse activateSemester(Long semesterId);
    SemesterResponse deactivateSemester(Long semesterId);
    SemesterResponse getActiveSemester();
    List<SemesterResponse> getActiveSemesters();
    SemesterResponse getSemesterById(Long semesterId);
    List<SemesterResponse> getAllSemesters();
}
