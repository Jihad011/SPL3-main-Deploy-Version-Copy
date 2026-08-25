package com.iit.creditmanagement.service;

import com.iit.creditmanagement.model.dto.response.StudentHistoryResponse;
import com.iit.creditmanagement.model.dto.response.UserResponse;

import java.util.List;

public interface StudentHistoryService {

    /**
     * Retrieves full historical academic dossier for a student given their ID,
     * base roll number, dynamic semester roll (e.g. 26S0204), or registration number.
     */
    StudentHistoryResponse getStudentHistoryByQuery(String query);

    /**
     * Retrieves full historical academic dossier for a student by their database ID.
     */
    StudentHistoryResponse getStudentHistoryById(Long studentId);

    /**
     * Search students for autocomplete in teacher search bar.
     */
    List<UserResponse> searchStudents(String query);
}
