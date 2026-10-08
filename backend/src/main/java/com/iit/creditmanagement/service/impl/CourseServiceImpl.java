package com.iit.creditmanagement.service.impl;

import com.iit.creditmanagement.constants.AppConstants;
import com.iit.creditmanagement.exception.BusinessRuleException;
import com.iit.creditmanagement.exception.ResourceNotFoundException;
import com.iit.creditmanagement.model.dto.request.CourseRequest;
import com.iit.creditmanagement.model.dto.response.CourseResponse;
import com.iit.creditmanagement.model.entity.Course;
import com.iit.creditmanagement.model.entity.User;
import com.iit.creditmanagement.model.enums.CourseType;
import com.iit.creditmanagement.repository.CourseRepository;
import com.iit.creditmanagement.repository.SemesterRepository;
import com.iit.creditmanagement.repository.UserRepository;
import com.iit.creditmanagement.service.CourseService;
import com.iit.creditmanagement.service.AuditService;
import com.iit.creditmanagement.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CourseServiceImpl implements CourseService {

    private final CourseRepository   courseRepository;
    private final UserRepository     userRepository;
    private final SemesterRepository semesterRepository;
    private final AuditService       auditService;
    private final NotificationService notificationService;

    @Override
    @Transactional
    @CacheEvict(value = "courses", allEntries = true)
    public CourseResponse createCourse(CourseRequest request) {
        if (courseRepository.findByCode(request.code()).isPresent()) {
            throw new BusinessRuleException("Course code already exists: " + request.code());
        }

        int maxSeats = (request.maxSeats() != null) ? request.maxSeats()
                : (request.courseType() == CourseType.OPTIONAL
                        ? AppConstants.MAX_SEATS_OPTIONAL_COURSE : 200);

        Course course = Course.builder()
                .code(request.code())
                .name(request.name())
                .description(request.description())
                .syllabusUrl(request.syllabusUrl())
                .syllabusFileName(request.syllabusFileName())
                .creditHours(request.creditHours())
                .courseType(request.courseType())
                .maxSeats(maxSeats)
                .build();

        if (request.teacherId() != null) {
            User teacher = userRepository.findById(request.teacherId())
                    .orElseThrow(() -> new ResourceNotFoundException("Teacher", request.teacherId()));
            course.setTeacher(teacher);
            notificationService.sendNotification(
                    teacher,
                    "Course Assigned",
                    String.format("You have been assigned to teach %s (%s).", course.getName(), course.getCode()),
                    "COURSE_ASSIGNED"
            );
        }

        return CourseResponse.from(courseRepository.save(course));
    }

    @Override
    @Transactional
    @CacheEvict(value = "courses", allEntries = true)
    public CourseResponse updateCourse(Long courseId, CourseRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));

        course.setName(request.name());
        course.setDescription(request.description());
        course.setSyllabusUrl(request.syllabusUrl());
        course.setSyllabusFileName(request.syllabusFileName());
        course.setCreditHours(request.creditHours());
        course.setCourseType(request.courseType());

        if (request.maxSeats() != null) {
            if (request.maxSeats() < course.getCurrentEnrollment()) {
                throw new BusinessRuleException(
                    "Cannot set max seats below current enrollment count (" +
                    course.getCurrentEnrollment() + ")");
            }
            course.setMaxSeats(request.maxSeats());
        }

        if (request.teacherId() != null && (course.getTeacher() == null || !course.getTeacher().getId().equals(request.teacherId()))) {
            User teacher = userRepository.findById(request.teacherId())
                    .orElseThrow(() -> new ResourceNotFoundException("Teacher", request.teacherId()));
            course.setTeacher(teacher);
            notificationService.sendNotification(
                    teacher,
                    "Course Assigned",
                    String.format("You have been assigned to teach %s (%s).", course.getName(), course.getCode()),
                    "COURSE_ASSIGNED"
            );
        }

        return CourseResponse.from(courseRepository.save(course));
    }

    @Override
    @Transactional(readOnly = true)
    public CourseResponse getCourseById(Long courseId) {
        return courseRepository.findById(courseId)
                .map(CourseResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable("courses")
    public List<CourseResponse> getAllActiveCourses() {
        return courseRepository.findAllByIsActive(true)
                .stream().map(CourseResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseResponse> getAvailableCoursesForStudent(Long studentId) {
        Long semesterId = semesterRepository.findActiveSemester()
                .orElseThrow(() -> new BusinessRuleException("No active semester"))
                .getId();
        return courseRepository.findAvailableForStudent(studentId, semesterId)
                .stream().map(CourseResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseResponse> getCoursesByTeacher(Long teacherId) {
        return courseRepository.findByTeacherId(teacherId)
                .stream().map(CourseResponse::from).toList();
    }

    @Override
    @Transactional
    @CacheEvict(value = "courses", allEntries = true)
    public CourseResponse deactivateCourse(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));
        course.setActive(false);
        courseRepository.save(course);
        auditService.logAction(null, "COURSE_DEACTIVATED", "Course", "Deactivated course: " + course.getCode());

        return CourseResponse.from(course);
    }
}
