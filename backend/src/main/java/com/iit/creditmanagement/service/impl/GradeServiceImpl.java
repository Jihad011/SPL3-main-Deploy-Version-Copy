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
import java.util.Optional;

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
        
        grade = gradeRepository.save(grade);
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
        Course targetCourse = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));

        List<GradeEntryRequest> requests = new ArrayList<>();
        List<String> skippedRolls = new ArrayList<>();

        CSVFormat csvFormat = CSVFormat.Builder.create(CSVFormat.DEFAULT)
                .setHeader()
                .setSkipHeaderRecord(true)
                .setIgnoreHeaderCase(true)
                .setTrim(true)
                .build();

        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             CSVParser csvParser = new CSVParser(reader, csvFormat)) {
            
            for (CSVRecord record : csvParser) {
                // Course Code validation if header is present
                String csvCourseCode = null;
                if (record.isSet("Course Code")) csvCourseCode = record.get("Course Code");
                else if (record.isSet("CourseCode")) csvCourseCode = record.get("CourseCode");
                else if (record.isSet("Course")) csvCourseCode = record.get("Course");
                else if (record.isSet("Course_Code")) csvCourseCode = record.get("Course_Code");
                else if (record.isSet("Subject")) csvCourseCode = record.get("Subject");

                if (csvCourseCode == null || csvCourseCode.isBlank()) {
                    throw new BusinessRuleException(String.format(
                        "Missing Course Code: The uploaded CSV file does not contain a 'Course Code' header column. Every grade sheet must specify the Course Code (e.g. '%s').",
                        targetCourse.getCode()
                    ));
                }

                String trimmedCode = csvCourseCode.trim();
                if (!trimmedCode.equalsIgnoreCase(targetCourse.getCode()) && !trimmedCode.equalsIgnoreCase(targetCourse.getName())) {
                    throw new BusinessRuleException(String.format(
                        "Course Mismatch: The uploaded CSV is for course '%s', but you are uploading into '%s (%s)'. Import cancelled to prevent accidental mark overwrite.",
                        trimmedCode, targetCourse.getCode(), targetCourse.getName()
                    ));
                }
                // Flexible Roll Number resolution
                String rollNumber = null;
                if (record.isSet("Roll Number")) rollNumber = record.get("Roll Number");
                else if (record.isSet("Roll No.")) rollNumber = record.get("Roll No.");
                else if (record.isSet("Roll No")) rollNumber = record.get("Roll No");
                else if (record.isSet("Roll")) rollNumber = record.get("Roll");
                else if (record.isSet("RollNumber")) rollNumber = record.get("RollNumber");
                else if (record.isSet("Student Roll")) rollNumber = record.get("Student Roll");
                else if (record.isSet("roll_number")) rollNumber = record.get("roll_number");
                else if (record.size() >= 1) rollNumber = record.get(0);
                
                if (rollNumber == null || rollNumber.isBlank()) {
                    continue;
                }
                rollNumber = rollNumber.trim();
                
                // Flexible Midterm resolution
                String midtermStr = null;
                if (record.isSet("Midterm")) midtermStr = record.get("Midterm");
                else if (record.isSet("Midterm (0-40)")) midtermStr = record.get("Midterm (0-40)");
                else if (record.isSet("Midterm Marks")) midtermStr = record.get("Midterm Marks");
                else if (record.isSet("Mid")) midtermStr = record.get("Mid");
                else if (record.isSet("midterm")) midtermStr = record.get("midterm");
                
                // Flexible Final resolution
                String finalStr = null;
                if (record.isSet("Final")) finalStr = record.get("Final");
                else if (record.isSet("Final (0-60)")) finalStr = record.get("Final (0-60)");
                else if (record.isSet("Final Marks")) finalStr = record.get("Final Marks");
                else if (record.isSet("Finals")) finalStr = record.get("Finals");
                else if (record.isSet("final")) finalStr = record.get("final");
                
                // Find enrollment by roll number and course id
                Optional<com.iit.creditmanagement.model.entity.Enrollment> enrollmentOpt =
                        enrollmentRepository.findByStudentRollNumberAndCourseId(rollNumber, courseId);
                
                if (enrollmentOpt.isEmpty()) {
                    skippedRolls.add(rollNumber);
                    continue;
                }
                
                Long enrollmentId = enrollmentOpt.get().getId();
                
                BigDecimal midtermMarks = null;
                if (midtermStr != null && !midtermStr.isBlank() && !midtermStr.equals("—") && !midtermStr.equals("-")) {
                    try {
                        midtermMarks = new BigDecimal(midtermStr.trim());
                    } catch (NumberFormatException ignored) {}
                }
                
                BigDecimal finalMarks = null;
                if (finalStr != null && !finalStr.isBlank() && !finalStr.equals("—") && !finalStr.equals("-")) {
                    try {
                        finalMarks = new BigDecimal(finalStr.trim());
                    } catch (NumberFormatException ignored) {}
                }
                
                requests.add(new GradeEntryRequest(enrollmentId, midtermMarks, finalMarks));
            }
        } catch (Exception e) {
            throw new BusinessRuleException("Failed to parse CSV file: " + e.getMessage());
        }
        
        if (requests.isEmpty()) {
            if (!skippedRolls.isEmpty()) {
                throw new BusinessRuleException(
                    "None of the " + skippedRolls.size() + " student(s) in the CSV (e.g. " +
                    String.join(", ", skippedRolls.stream().limit(5).toList()) + ") are enrolled in this course."
                );
            } else {
                throw new BusinessRuleException("CSV file contains no valid student records.");
            }
        }

        // Check if any mark in the CSV actually differs from existing DB grade records
        boolean anyChange = false;
        for (GradeEntryRequest req : requests) {
            Optional<Grade> existingOpt = gradeRepository.findByEnrollmentId(req.enrollmentId());
            if (existingOpt.isEmpty()) {
                anyChange = true;
                break;
            }
            Grade existing = existingOpt.get();
            boolean midSame = (req.midtermMarks() == null && existing.getMidtermMarks() == null) ||
                              (req.midtermMarks() != null && existing.getMidtermMarks() != null && req.midtermMarks().compareTo(existing.getMidtermMarks()) == 0);
            boolean finSame = (req.finalMarks() == null && existing.getFinalMarks() == null) ||
                              (req.finalMarks() != null && existing.getFinalMarks() != null && req.finalMarks().compareTo(existing.getFinalMarks()) == 0);
            if (!midSame || !finSame) {
                anyChange = true;
                break;
            }
        }

        if (!anyChange) {
            throw new BusinessRuleException("No Change Detected.");
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
                .filter(g -> g.getEnrollment() != null && g.getEnrollment().getCourse() != null && g.getEnrollment().getCourse().isActive())
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

        List<Grade> grades = gradeRepository.findGradesByCourseAndSemester(courseId, semesterId);
        if (grades.isEmpty()) {
            grades = gradeRepository.findGradesByCourseAndSemester(courseId, null);
        }
        return grades.stream()
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
