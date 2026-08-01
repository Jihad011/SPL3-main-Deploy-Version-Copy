package com.iit.creditmanagement.service.impl;

import com.iit.creditmanagement.exception.BusinessRuleException;
import com.iit.creditmanagement.exception.ResourceNotFoundException;
import com.iit.creditmanagement.model.dto.request.GradeEntryRequest;
import com.iit.creditmanagement.model.dto.response.GradeResponse;
import com.iit.creditmanagement.model.entity.Course;
import com.iit.creditmanagement.model.entity.Enrollment;
import com.iit.creditmanagement.model.entity.Grade;
import com.iit.creditmanagement.model.entity.User;
import com.iit.creditmanagement.model.enums.EnrollmentStatus;
import com.iit.creditmanagement.model.enums.Role;
import com.iit.creditmanagement.constants.AppConstants;
import com.iit.creditmanagement.repository.CourseRepository;
import com.iit.creditmanagement.repository.EnrollmentRepository;
import com.iit.creditmanagement.repository.GradeRepository;
import com.iit.creditmanagement.repository.UserRepository;
import com.iit.creditmanagement.service.GradeService;
import com.iit.creditmanagement.service.AuditService;
import com.iit.creditmanagement.service.NotificationService;
import com.iit.creditmanagement.util.GradeCalculator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

import java.io.InputStreamReader;
import java.io.Reader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class GradeServiceImpl implements GradeService {

    private final GradeRepository      gradeRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository       userRepository;
    private final CourseRepository     courseRepository;
    private final GradeCalculator      gradeCalculator;
    private final NotificationService  notificationService;
    private final AuditService         auditService;

    @Override
    @Transactional
    @CacheEvict(value = "cgpa", allEntries = true)
    public GradeResponse enterOrUpdateGrade(Long teacherId, GradeEntryRequest request) {
        // Validate mark ranges
        if (request.midtermMarks() != null) {
            gradeCalculator.validateMidtermMarks(request.midtermMarks().doubleValue());
        }
        if (request.finalMarks() != null) {
            gradeCalculator.validateFinalMarks(request.finalMarks().doubleValue());
        }

        Enrollment enrollment = enrollmentRepository.findById(request.enrollmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", request.enrollmentId()));

        // Verify teacher owns this course (or is admin)
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher", teacherId));

        boolean isAdmin = teacher.getRole().name().equals("ADMIN");
        if (!isAdmin) {
            Long courseTeacherId = enrollment.getCourse().getTeacher() != null
                    ? enrollment.getCourse().getTeacher().getId() : null;
            if (!teacherId.equals(courseTeacherId)) {
                throw new AccessDeniedException(
                        "You are not assigned to teach this course.");
            }
        }

        if (enrollment.getStatus() == EnrollmentStatus.DROPPED) {
            throw new BusinessRuleException("Cannot enter grades for a DROPPED enrollment.");
        }

        // Upsert: update existing grade or create new one
        Grade grade = gradeRepository.findByEnrollmentId(enrollment.getId())
                .orElse(Grade.builder().enrollment(enrollment).enteredBy(teacher).build());

        // Only update the fields provided in this request
        if (request.midtermMarks() != null) grade.setMidtermMarks(request.midtermMarks());
        if (request.finalMarks()   != null) grade.setFinalMarks(request.finalMarks());

        // Validate total sum
        double totalMidterm = grade.getMidtermMarks() != null ? grade.getMidtermMarks().doubleValue() : 0.0;
        double totalFinal = grade.getFinalMarks() != null ? grade.getFinalMarks().doubleValue() : 0.0;
        if (totalMidterm + totalFinal > AppConstants.MAX_TOTAL_MARKS) {
            throw new BusinessRuleException("Total combined marks cannot exceed " + AppConstants.MAX_TOTAL_MARKS);
        }

        // Compute grade letter in Java too (mirrors the DB trigger)
        if (grade.getMidtermMarks() != null && grade.getFinalMarks() != null) {
            double total = grade.getMidtermMarks().doubleValue() + grade.getFinalMarks().doubleValue();
            grade.setGradeLetter(gradeCalculator.computeGradeLetter(total));
            grade.setGradePoint(BigDecimal.valueOf(grade.getGradeLetter().getPoint()));
        }

        grade.setEnteredBy(teacher);
        boolean isFullyGraded = (grade.getGradeLetter() != null);
        
        if (isFullyGraded) {
            double total = grade.getMidtermMarks().doubleValue() + grade.getFinalMarks().doubleValue();
            enrollment.setStatus(gradeCalculator.isPassing(total) ? EnrollmentStatus.COMPLETED : EnrollmentStatus.FAILED);
        } else {
            enrollment.setStatus(EnrollmentStatus.ACTIVE);
        }
        
        Grade savedGrade = gradeRepository.save(grade);
        auditService.logAction(teacherId, "GRADE_UPDATED", "Grade", "Updated grade for enrollment ID: " + enrollment.getId() + ", Letter: " + grade.getGradeLetter());
        
        if (isFullyGraded) {
            notificationService.sendNotification(
                    enrollment.getStudent(),
                    "Grade Published",
                    String.format("Your final grade for %s (%s) has been published: %s", 
                                  enrollment.getCourse().getName(), 
                                  enrollment.getCourse().getCode(), 
                                  grade.getGradeLetter().name()),
                    "GRADE_PUBLISHED"
            );
        }
        
        log.info("Grade saved for enrollment {} by teacher {}", enrollment.getId(), teacherId);
        return GradeResponse.from(grade);
    }

    @Override
    @Transactional
    @CacheEvict(value = "cgpa", allEntries = true)
    public List<GradeResponse> bulkEnterGrades(Long teacherId, List<GradeEntryRequest> requests) {
        return requests.stream()
                .map(req -> enterOrUpdateGrade(teacherId, req))
                .toList();
    }

    @Override
    @Transactional
    @CacheEvict(value = "cgpa", allEntries = true)
    public List<GradeResponse> uploadGradesCsv(Long teacherId, Long courseId, MultipartFile file) {
        List<GradeEntryRequest> requests = new ArrayList<>();
        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT.withFirstRecordAsHeader().withIgnoreHeaderCase().withTrim())) {
            
            for (CSVRecord record : csvParser) {
                String rollNumber = record.get("Roll Number");
                String midtermStr = record.isSet("Midterm") ? record.get("Midterm") : null;
                String finalStr = record.isSet("Final") ? record.get("Final") : null;
                
                // Find enrollment by roll number and course id
                Long enrollmentId = enrollmentRepository.findByStudentRollNumberAndCourseId(rollNumber, courseId)
                        .map(com.iit.creditmanagement.model.entity.Enrollment::getId)
                        .orElseThrow(() -> new ResourceNotFoundException("Enrollment for student " + rollNumber + " in course " + courseId + " not found"));
                
                BigDecimal midtermMarks = (midtermStr != null && !midtermStr.isBlank()) ? new BigDecimal(midtermStr) : null;
                BigDecimal finalMarks = (finalStr != null && !finalStr.isBlank()) ? new BigDecimal(finalStr) : null;
                
                requests.add(new GradeEntryRequest(enrollmentId, midtermMarks, finalMarks));
            }
        } catch (Exception e) {
            throw new BusinessRuleException("Failed to parse CSV file: " + e.getMessage());
        }
        
        return bulkEnterGrades(teacherId, requests);
    }

    @Override
    @Transactional(readOnly = true)
    public GradeResponse getGradeByEnrollment(Long enrollmentId, User currentUser) {
        Grade grade = gradeRepository.findByEnrollmentId(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No grade found for enrollment: " + enrollmentId));

        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        boolean isStudent = currentUser.getId().equals(grade.getEnrollment().getStudent().getId());
        boolean isTeacher = grade.getEnrollment().getCourse().getTeacher() != null &&
                            currentUser.getId().equals(grade.getEnrollment().getCourse().getTeacher().getId());

        if (!isAdmin && !isStudent && !isTeacher) {
            throw new AccessDeniedException("Access denied: You are not authorized to view this grade record.");
        }

        return GradeResponse.from(grade);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GradeResponse> getMyGrades(Long studentId) {
        return gradeRepository.findAllByEnrollmentStudentId(studentId)
                .stream()
                .map(GradeResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<GradeResponse> getGradesForCourse(Long courseId, Long semesterId, User currentUser) {
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        if (!isAdmin) {
            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));
            Long courseTeacherId = course.getTeacher() != null ? course.getTeacher().getId() : null;
            if (!currentUser.getId().equals(courseTeacherId)) {
                throw new AccessDeniedException("Access denied: You are not assigned to teach this course.");
            }
        }

        return gradeRepository.findGradesByCourseAndSemester(courseId, semesterId)
                .stream()
                .map(GradeResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "cgpa", key = "#studentId")
    public BigDecimal getStudentCgpa(Long studentId) {
        return gradeRepository.calculateCgpa(studentId)
                .orElse(BigDecimal.ZERO);
    }
}
