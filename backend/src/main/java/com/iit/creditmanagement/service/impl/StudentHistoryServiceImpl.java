package com.iit.creditmanagement.service.impl;

import com.iit.creditmanagement.constants.AppConstants;
import com.iit.creditmanagement.exception.ResourceNotFoundException;
import com.iit.creditmanagement.model.dto.response.CourseGradeRecordDTO;
import com.iit.creditmanagement.model.dto.response.SemesterHistoryDTO;
import com.iit.creditmanagement.model.dto.response.StudentHistoryResponse;
import com.iit.creditmanagement.model.dto.response.UserResponse;
import com.iit.creditmanagement.model.entity.*;
import com.iit.creditmanagement.model.enums.FeeType;
import com.iit.creditmanagement.model.enums.GradeLetter;
import com.iit.creditmanagement.model.enums.Role;
import com.iit.creditmanagement.repository.*;
import com.iit.creditmanagement.service.GradeService;
import com.iit.creditmanagement.service.StudentHistoryService;
import com.iit.creditmanagement.util.StudentRollHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentHistoryServiceImpl implements StudentHistoryService {

    private final UserRepository       userRepository;
    private final SemesterRepository   semesterRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final GradeRepository      gradeRepository;
    private final FeeRepository        feeRepository;
    private final GradeService         gradeService;

    @Override
    @Transactional(readOnly = true)
    public StudentHistoryResponse getStudentHistoryByQuery(String query) {
        if (query == null || query.isBlank()) {
            throw new ResourceNotFoundException("Student query cannot be empty");
        }

        String clean = query.trim();
        User student = resolveStudent(clean);
        return buildHistoryResponse(student);
    }

    @Override
    @Transactional(readOnly = true)
    public StudentHistoryResponse getStudentHistoryById(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
        return buildHistoryResponse(student);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> searchStudents(String query) {
        if (query == null || query.isBlank()) {
            return userRepository.findAllByRoleAndIsActive(Role.STUDENT, true)
                    .stream().limit(20).map(UserResponse::from).toList();
        }

        return userRepository.searchStudents(query.trim())
                .stream().map(UserResponse::from).toList();
    }

    private User resolveStudent(String query) {
        // 1. Direct ID match if numeric
        try {
            Long id = Long.parseLong(query);
            Optional<User> byId = userRepository.findById(id);
            if (byId.isPresent() && byId.get().getRole() == Role.STUDENT) {
                return byId.get();
            }
        } catch (NumberFormatException ignored) {}

        // 2. Direct roll number match
        Optional<User> byRoll = userRepository.findByRollNumber(query);
        if (byRoll.isPresent()) {
            return byRoll.get();
        }

        // 3. Direct registration number match
        Optional<User> byReg = userRepository.findByRegistrationNumber(query);
        if (byReg.isPresent()) {
            return byReg.get();
        }

        // 4. Direct email match
        Optional<User> byEmail = userRepository.findByEmail(query);
        if (byEmail.isPresent() && byEmail.get().getRole() == Role.STUDENT) {
            return byEmail.get();
        }

        // 5. Parse dynamic / legacy roll components (e.g. 26S0204 -> Batch 2, Class Roll 4)
        StudentRollHelper.ParsedRoll parsed = StudentRollHelper.parseRoll(query);
        if (parsed != null && parsed.batch() != null && parsed.classRoll() != null) {
            List<User> students = userRepository.findAllByRole(Role.STUDENT);
            for (User s : students) {
                int cRoll = StudentRollHelper.extractClassRoll(s);
                int b = StudentRollHelper.extractBatch(s);
                if (b == parsed.batch() && cRoll == parsed.classRoll()) {
                    return s;
                }
            }
        }

        // 6. Fuzzy student search
        List<User> searchResults = userRepository.searchStudents(query);
        if (!searchResults.isEmpty()) {
            return searchResults.get(0);
        }

        throw new ResourceNotFoundException("Student not found for identifier: " + query);
    }

    private StudentHistoryResponse buildHistoryResponse(User student) {
        int classRoll = StudentRollHelper.extractClassRoll(student);
        Semester activeSemester = semesterRepository.findActiveSemester().orElse(null);
        String currentSemesterRoll = StudentRollHelper.deriveSemesterRoll(student, activeSemester);

        // Fetch all semesters sorted chronologically
        List<Semester> allSemesters = semesterRepository.findAll(Sort.by(Sort.Direction.ASC, "startDate", "id"));
        List<Enrollment> allEnrollments = enrollmentRepository.findAllByStudentId(student.getId());

        // Group enrollments by semesterId
        Map<Long, List<Enrollment>> enrollmentsBySemester = new HashMap<>();
        for (Enrollment e : allEnrollments) {
            enrollmentsBySemester.computeIfAbsent(e.getSemester().getId(), k -> new ArrayList<>()).add(e);
        }

        // Find index of first enrolled semester
        int firstEnrolledIndex = -1;
        for (int i = 0; i < allSemesters.size(); i++) {
            if (enrollmentsBySemester.containsKey(allSemesters.get(i).getId())) {
                firstEnrolledIndex = i;
                break;
            }
        }

        List<SemesterHistoryDTO> semesterHistoryList = new ArrayList<>();
        int totalCompletedCredits = 0;
        int totalAttemptedCredits = 0;
        int totalGapCount = 0;
        BigDecimal gapFeeRate = BigDecimal.valueOf(AppConstants.DEFAULT_SEMESTER_GAP_FEE);

        for (int i = 0; i < allSemesters.size(); i++) {
            Semester sem = allSemesters.get(i);
            List<Enrollment> semEnrollments = enrollmentsBySemester.getOrDefault(sem.getId(), List.of());
            String semRollId = StudentRollHelper.deriveSemesterRoll(student, sem);

            if (semEnrollments.isEmpty()) {
                // If this semester is after the student started their program, it's a gap semester!
                boolean isGap = (firstEnrolledIndex != -1 && i > firstEnrolledIndex);
                if (isGap) {
                    totalGapCount++;
                }

                semesterHistoryList.add(new SemesterHistoryDTO(
                        sem.getId(),
                        sem.getName() != null ? sem.getName().name() : "N/A",
                        sem.getYear(),
                        sem.getLabel(),
                        semRollId,
                        sem.isActive(),
                        isGap,
                        0,
                        BigDecimal.ZERO,
                        isGap ? gapFeeRate : BigDecimal.ZERO,
                        List.of()
                ));
            } else {
                // Enrolled semester
                List<CourseGradeRecordDTO> courseRecords = new ArrayList<>();
                BigDecimal semesterTotalPoints = BigDecimal.ZERO;
                int semesterCredits = 0;

                for (Enrollment e : semEnrollments) {
                    Course c = e.getCourse();
                    Grade grade = gradeRepository.findByEnrollmentId(e.getId()).orElse(null);

                    BigDecimal midterm = grade != null ? grade.getMidtermMarks() : null;
                    BigDecimal finalMarks = grade != null ? grade.getFinalMarks() : null;
                    BigDecimal totalMarks = grade != null ? grade.getTotalMarks() : null;
                    GradeLetter letter = grade != null ? grade.getGradeLetter() : null;
                    BigDecimal gp = grade != null ? grade.getGradePoint() : null;

                    String letterStr = letter != null ? letter.name().replace("_PLUS", "+").replace("_MINUS", "-") : "IN_PROGRESS";
                    String teacherName = (c.getTeacher() != null) ? c.getTeacher().getName() : "Unassigned";

                    courseRecords.add(new CourseGradeRecordDTO(
                            c.getId(),
                            c.getCode(),
                            c.getName(),
                            c.getCreditHours(),
                            teacherName,
                            midterm,
                            finalMarks,
                            totalMarks,
                            letterStr,
                            gp,
                            e.isRetake(),
                            e.getStatus().name()
                    ));

                    totalAttemptedCredits += c.getCreditHours();
                    if (gp != null && gp.compareTo(BigDecimal.ZERO) > 0) {
                        totalCompletedCredits += c.getCreditHours();
                        semesterTotalPoints = semesterTotalPoints.add(gp.multiply(BigDecimal.valueOf(c.getCreditHours())));
                        semesterCredits += c.getCreditHours();
                    }
                }

                BigDecimal sgpa = (semesterCredits > 0)
                        ? semesterTotalPoints.divide(BigDecimal.valueOf(semesterCredits), 2, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO;

                semesterHistoryList.add(new SemesterHistoryDTO(
                        sem.getId(),
                        sem.getName() != null ? sem.getName().name() : "N/A",
                        sem.getYear(),
                        sem.getLabel(),
                        semRollId,
                        sem.isActive(),
                        false,
                        semesterCredits,
                        sgpa,
                        BigDecimal.ZERO,
                        courseRecords
                ));
            }
        }

        // Cumulative stats
        BigDecimal cgpa = gradeService.getStudentCgpa(student.getId());
        BigDecimal totalDues = feeRepository.totalUnpaidByStudent(student.getId());
        BigDecimal totalPaid = feeRepository.totalPaidByStudent(student.getId());
        BigDecimal totalGapFines = feeRepository.totalGapFinesByStudent(student.getId());

        String status = (totalGapCount > 0 && (activeSemester == null || !enrollmentsBySemester.containsKey(activeSemester.getId())))
                ? "ON_GAP"
                : (totalCompletedCredits >= AppConstants.TOTAL_CREDITS_TO_COMPLETE ? "GRADUATED" : "ACTIVE");

        return new StudentHistoryResponse(
                student.getId(),
                student.getName(),
                student.getEmail(),
                student.getRollNumber(),
                currentSemesterRoll,
                student.getRegistrationNumber(),
                StudentRollHelper.extractBatch(student),
                classRoll,
                student.getPhone(),
                status,
                totalCompletedCredits,
                totalAttemptedCredits,
                cgpa != null ? cgpa : BigDecimal.ZERO,
                totalDues != null ? totalDues : BigDecimal.ZERO,
                totalPaid != null ? totalPaid : BigDecimal.ZERO,
                totalGapCount,
                totalGapFines != null ? totalGapFines : BigDecimal.ZERO,
                semesterHistoryList
        );
    }
}
