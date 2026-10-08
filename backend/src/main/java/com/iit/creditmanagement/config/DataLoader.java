package com.iit.creditmanagement.config;

import com.iit.creditmanagement.model.entity.Course;
import com.iit.creditmanagement.model.entity.Enrollment;
import com.iit.creditmanagement.model.entity.Semester;
import com.iit.creditmanagement.model.entity.User;
import com.iit.creditmanagement.model.enums.CourseType;
import com.iit.creditmanagement.model.enums.Role;
import com.iit.creditmanagement.model.enums.SemesterName;
import com.iit.creditmanagement.repository.CourseRepository;
import com.iit.creditmanagement.repository.EnrollmentRepository;
import com.iit.creditmanagement.repository.FeeRepository;
import com.iit.creditmanagement.repository.SemesterRepository;
import com.iit.creditmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
@Profile({"local", "dev"})
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final SemesterRepository semesterRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final FeeRepository feeRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() == 0) {
            String encodedPassword = passwordEncoder.encode("Admin@123");
            
            User admin = User.builder()
                    .name("Admin")
                    .email("admin@iit.du.ac.bd")
                    .passwordHash(encodedPassword)
                    .role(Role.ADMIN)
                    .isActive(true)
                    .build();
            userRepository.save(admin);

            User teacher = User.builder()
                    .name("Dr. Md. Nurul Ahad Tawhid")
                    .email("tawhid@iit.du.ac.bd")
                    .passwordHash(passwordEncoder.encode("Teacher@123"))
                    .role(Role.TEACHER)
                    .designation("Professor")
                    .isActive(true)
                    .build();
            userRepository.save(teacher);

            User student = User.builder()
                    .name("Md. Jihad Hossain")
                    .email("jihad@iit.du.ac.bd")
                    .passwordHash(passwordEncoder.encode("Student@123"))
                    .role(Role.STUDENT)
                    .rollNumber("1413")
                    .registrationNumber("REG-2021-1413")
                    .batch(2021)
                    .isActive(true)
                    .build();
            userRepository.save(student);

            System.out.println("✅ Initial users checked/created.");
        }

        userRepository.findByEmail("jihad@iit.du.ac.bd").ifPresent(u -> {
            u.setPasswordHash(passwordEncoder.encode("Student@123"));
            userRepository.save(u);
        });

        User shariful = getOrCreateTeacher("Dr. Md. Shariful Islam", "shariful@iit.du.ac.bd", "Professor", "Shariful@303");
        User shoyaib = getOrCreateTeacher("Mohammed Shoyaib", "shoyaib@iit.du.ac.bd", "Professor", "Shoyaib@304");
        User ahmedul = getOrCreateTeacher("Dr. Ahmedul Kabir", "ahmedul.kabir@iit.du.ac.bd", "Associate Professor", "Ahmedul@310");
        User mainul = getOrCreateTeacher("Dr. B. M. Mainul Hossain", "mainul@iit.du.ac.bd", "Professor", "Mainul@311");
        User zerina = getOrCreateTeacher("Dr. Zerina Begum", "zerina@iit.du.ac.bd", "Professor", "Zerina@123");
        User tawhid = getOrCreateTeacher("Dr. Md. Nurul Ahad Tawhid", "tawhid@iit.du.ac.bd", "Associate Professor", "Teacher@123");
        User saeed = getOrCreateTeacher("Md. Saeed Siddik", "saeed@iit.du.ac.bd", "Assistant Professor", "Saeed@123");
        User sakib = getOrCreateTeacher("Dr. Kazi Muheymin-Us-Sakib", "sakib@iit.du.ac.bd", "Professor", "Sakib@123");
        User toukir = getOrCreateTeacher("Toukir Ahammed", "toukir@iit.du.ac.bd", "Lecturer", "Toukir@123");
        // Ensure active semester is First Semester (FIRST_SEMESTER)
        List<Semester> allSemesters = semesterRepository.findAll();
        if (allSemesters.isEmpty()) {
            Semester semester = Semester.builder()
                    .name(SemesterName.FIRST_SEMESTER)
                    .year(2026)
                    .startDate(LocalDate.of(2026, 1, 1))
                    .endDate(LocalDate.of(2026, 6, 30))
                    .isActive(true)
                    .build();
            semesterRepository.save(semester);
            System.out.println("✅ Active semester initialized as First Semester (2026).");
        } else {
            for (Semester sem : allSemesters) {
                if (sem.getName() == SemesterName.SECOND_SEMESTER) {
                    sem.setActive(false);
                    semesterRepository.save(sem);
                } else if (sem.getName() == SemesterName.FIRST_SEMESTER) {
                    sem.setActive(true);
                    semesterRepository.save(sem);
                    System.out.println("✅ Active semester confirmed as First Semester (2026).");
                }
            }
        }

        seedEmitCourses(shariful, shoyaib, ahmedul, mainul, zerina, tawhid, saeed, sakib, toukir);
    }

    private User getOrCreateTeacher(String name, String email, String designation, String rawPassword) {
        return userRepository.findByEmail(email).map(t -> {
            t.setName(name);
            t.setDesignation(designation);
            t.setPasswordHash(passwordEncoder.encode(rawPassword));
            t.setRole(Role.TEACHER);
            t.setActive(true);
            return userRepository.save(t);
        }).orElseGet(() -> {
            User t = User.builder()
                    .name(name)
                    .email(email)
                    .passwordHash(passwordEncoder.encode(rawPassword))
                    .role(Role.TEACHER)
                    .designation(designation)
                    .isActive(true)
                    .build();
            return userRepository.save(t);
        });
    }

    private void seedEmitCourses(User shariful, User shoyaib, User ahmedul, User mainul, User zerina, User tawhid, User saeed, User sakib, User toukir) {
        Set<String> validCodes = new HashSet<>(Arrays.asList(
            "MITM 303", "MITM 304", "MITM 310", "MITM 311",
            "MITM 301", "MITM 305", "MITM 421",
            "MITE 436", "MITE 430", "MITE 437", "MITE 431",
            "MITE 432", "MITE 442", "MITE 438", "MITE 455",
            "MITE 434", "MITE 439", "MITE 435", "MITE 441"
        ));

        // Deactivate legacy dummy courses from database so only official PDF courses remain active
        for (Course c : courseRepository.findAll()) {
            if (!validCodes.contains(c.getCode())) {
                c.setActive(false);
                courseRepository.save(c);
            }
        }

        // Seed official EMIT curriculum courses from notice_27-Nov-2025.pdf
        // 1st Semester Major Courses (4 Mandatory with official faculty)
        createCourseIfAbsent("MITM 303", "Advanced Computer Networks & Internetworking", 3, CourseType.CORE, 1, "Core Major", null, shariful);
        createCourseIfAbsent("MITM 304", "Database Architecture and Administration", 3, CourseType.CORE, 1, "Core Major", null, shoyaib);
        createCourseIfAbsent("MITM 310", "Advanced Data Structures and Algorithms", 3, CourseType.CORE, 1, "Core Major", null, ahmedul);
        createCourseIfAbsent("MITM 311", "Advanced Object-Oriented Programming", 3, CourseType.CORE, 1, "Core Major", null, mainul);

        // 2nd Semester Major Courses (2 Mandatory)
        createCourseIfAbsent("MITM 301", "IT Project Management", 3, CourseType.CORE, 2, "Core Major", null, saeed);
        createCourseIfAbsent("MITM 305", "Web Technology and Internet Computing", 3, CourseType.CORE, 2, "Core Major", null, tawhid);

        // 3rd Semester Major Project / Internship (1 Mandatory, 6 Cr)
        createCourseIfAbsent("MITM 421", "Project for MIT / Internship", 6, CourseType.CORE, 3, "Core Major", null, ahmedul);

        // Data Science Track Electives (Available in 2nd & 3rd Semester)
        createCourseIfAbsent("MITE 436", "Artificial Intelligence", 3, CourseType.OPTIONAL, null, "Data Science Track", null, ahmedul);
        createCourseIfAbsent("MITE 430", "Machine Learning", 3, CourseType.OPTIONAL, null, "Data Science Track", null, mainul);
        createCourseIfAbsent("MITE 437", "Data Mining", 3, CourseType.OPTIONAL, null, "Data Science Track", null, shoyaib);
        createCourseIfAbsent("MITE 431", "Big Data Analytics", 3, CourseType.OPTIONAL, null, "Data Science Track", null, mainul);

        // Information Security Track Electives (Available in 2nd & 3rd Semester)
        createCourseIfAbsent("MITE 432", "Cryptography and Security Mechanisms", 3, CourseType.OPTIONAL, null, "Information Security Track", null, shariful);
        createCourseIfAbsent("MITE 442", "Network Security", 3, CourseType.OPTIONAL, null, "Information Security Track", null, shariful);
        createCourseIfAbsent("MITE 438", "Secured Software System", 3, CourseType.OPTIONAL, null, "Information Security Track", null, shariful);
        createCourseIfAbsent("MITE 433", "Cyber Security", 3, CourseType.OPTIONAL, null, "Information Security Track", null, shariful);

        // Software Engineering Track Electives (Available in 2nd & 3rd Semester)
        createCourseIfAbsent("MITE 434", "Software Quality Assurance and Testing", 3, CourseType.OPTIONAL, null, "Software Engineering Track", null, saeed);
        createCourseIfAbsent("MITE 439", "Software Requirements Engineering and Design", 3, CourseType.OPTIONAL, null, "Software Engineering Track", null, sakib);
        createCourseIfAbsent("MITE 435", "Software Design Pattern", 3, CourseType.OPTIONAL, null, "Software Engineering Track", null, toukir);
        createCourseIfAbsent("MITE 441", "Software Maintenance and Analytics", 3, CourseType.OPTIONAL, null, "Software Engineering Track", null, toukir);

        System.out.println("✅ Official EMIT 3-Semester Courses verified/seeded with assigned faculty.");
    }

    private void createCourseIfAbsent(String code, String name, int credits, CourseType type, Integer semesterLevel, String track, String desc, User teacher) {
        courseRepository.findByCode(code).ifPresentOrElse(
            c -> {
                c.setName(name);
                c.setSemesterLevel(semesterLevel);
                c.setTrack(track);
                c.setCourseType(type);
                c.setCreditHours(credits);
                c.setTeacher(teacher);
                c.setDescription(desc);
                c.setActive(true);
                courseRepository.save(c);
            },
            () -> {
                Course course = Course.builder()
                        .code(code)
                        .name(name)
                        .creditHours(credits)
                        .courseType(type)
                        .semesterLevel(semesterLevel)
                        .track(track)
                        .description(desc)
                        .maxSeats(200)
                        .currentEnrollment(0)
                        .isActive(true)
                        .teacher(teacher)
                        .build();
                courseRepository.save(course);
            }
        );
    }
}

