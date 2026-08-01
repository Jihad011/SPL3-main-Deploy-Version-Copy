package com.iit.creditmanagement.service.impl;

import com.iit.creditmanagement.exception.BusinessRuleException;
import com.iit.creditmanagement.exception.ResourceNotFoundException;
import com.iit.creditmanagement.model.dto.request.SemesterRequest;
import com.iit.creditmanagement.model.dto.response.SemesterResponse;
import com.iit.creditmanagement.model.entity.Semester;
import com.iit.creditmanagement.repository.SemesterRepository;
import com.iit.creditmanagement.service.SemesterService;
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
public class SemesterServiceImpl implements SemesterService {

    private final SemesterRepository semesterRepository;

    @Override
    @Transactional
    @CacheEvict(value = "activeSemesters", allEntries = true)
    public SemesterResponse createSemester(SemesterRequest request) {
        if (!request.endDate().isAfter(request.startDate())) {
            throw new BusinessRuleException("End date must be after start date.");
        }
        boolean exists = semesterRepository.findAll().stream()
                .anyMatch(s -> s.getName() == request.name() && s.getYear().equals(request.year()));
        if (exists) {
            throw new BusinessRuleException(
                "Semester " + request.name() + " " + request.year() + " already exists.");
        }

        Semester semester = Semester.builder()
                .name(request.name()).year(request.year())
                .startDate(request.startDate()).endDate(request.endDate())
                .isActive(false).build();
        semester = semesterRepository.save(semester);

        if (request.makeActive()) {
            semester = activateInternal(semester.getId());
        }
        log.info("Semester created: {} {}", request.name(), request.year());
        return SemesterResponse.from(semester);
    }

    @Override
    @Transactional
    @CacheEvict(value = "activeSemesters", allEntries = true)
    public SemesterResponse activateSemester(Long semesterId) {
        return SemesterResponse.from(activateInternal(semesterId));
    }

    @Override
    @Transactional
    @CacheEvict(value = "activeSemesters", allEntries = true)
    public SemesterResponse deactivateSemester(Long semesterId) {
        Semester target = semesterRepository.findById(semesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Semester", semesterId));
        target.setActive(false);
        Semester saved = semesterRepository.save(target);
        log.info("Deactivated semester: {}", saved.getLabel());
        return SemesterResponse.from(saved);
    }

    private Semester activateInternal(Long semesterId) {
        Semester target = semesterRepository.findById(semesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Semester", semesterId));
        target.setActive(true);
        Semester saved = semesterRepository.save(target);
        log.info("Activated semester: {}", saved.getLabel());
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable("activeSemesters")
    public SemesterResponse getActiveSemester() {
        return semesterRepository.findActiveSemester()
                .map(SemesterResponse::from)
                .orElseThrow(() -> new BusinessRuleException(
                    "No active semester. Please ask admin to activate one."));
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable("activeSemesters")
    public List<SemesterResponse> getActiveSemesters() {
        List<Semester> activeSemesters = semesterRepository.findAllByIsActiveTrue();
        if (activeSemesters.isEmpty()) {
            throw new BusinessRuleException("No active semesters found. Please ask admin to activate one.");
        }
        return activeSemesters.stream().map(SemesterResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SemesterResponse getSemesterById(Long semesterId) {
        return semesterRepository.findById(semesterId)
                .map(SemesterResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Semester", semesterId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<SemesterResponse> getAllSemesters() {
        return semesterRepository.findAll().stream().map(SemesterResponse::from).toList();
    }
}
