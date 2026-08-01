package com.iit.creditmanagement.config;

import com.iit.creditmanagement.model.entity.Course;
import com.iit.creditmanagement.model.entity.Semester;
import com.iit.creditmanagement.model.entity.User;
import com.iit.creditmanagement.model.enums.CourseType;
import com.iit.creditmanagement.model.enums.Role;
import com.iit.creditmanagement.model.enums.SemesterName;
import com.iit.creditmanagement.repository.CourseRepository;
import com.iit.creditmanagement.repository.SemesterRepository;
import com.iit.creditmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Component
@Profile({"local", "dev"})
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final SemesterRepository semesterRepository;
    private final CourseRepository courseRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() == 0) {
            String encodedPassword = passwordEncoder.encode("Admin@123");
            
            User admin = User.builder()
                    .name("System Admin")
                    .email("admin@iit.du.ac.bd")
                    .passwordHash(encodedPassword)
                    .role(Role.ADMIN)
                    .isActive(true)
                    .build();
            userRepository.save(admin);

            User teacher = User.builder()
                    .name("Dr. Tawhid")
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


            Course c1 = Course.builder()
                    .code("MIT-601")
                    .name("Cloud Computing")
                    .creditHours(3)
                    .courseType(CourseType.CORE)
                    .maxSeats(40)
                    .currentEnrollment(0)
                    .isActive(true)
                    .teacher(teacher)
                    .build();
            courseRepository.save(c1);

            Course c2 = Course.builder()
                    .code("MIT-602")
                    .name("Advanced Machine Learning")
                    .creditHours(3)
                    .courseType(CourseType.OPTIONAL)
                    .maxSeats(40)
                    .currentEnrollment(0)
                    .isActive(true)
                    .teacher(teacher)
                    .build();
            courseRepository.save(c2);
            
            System.out.println("✅ Data initialized successfully for local profile.");
        }

        if (semesterRepository.count() == 0) {
            Semester semester = Semester.builder()
                    .name(SemesterName.SPRING)
                    .year(2026)
                    .startDate(LocalDate.of(2026, 1, 1))
                    .endDate(LocalDate.of(2026, 6, 30))
                    .isActive(true)
                    .build();
            semesterRepository.save(semester);
            System.out.println("✅ Semester initialized successfully for local profile.");
        }
    }
}
// trigger restart
