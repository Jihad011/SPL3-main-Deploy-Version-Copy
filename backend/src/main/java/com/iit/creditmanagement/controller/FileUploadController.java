package com.iit.creditmanagement.controller;

import com.iit.creditmanagement.exception.BusinessRuleException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/files", "/v1/files"})
@RequiredArgsConstructor
@Slf4j
@Tag(name = "File Storage", description = "Endpoints for course syllabus upload and static file delivery")
public class FileUploadController {

    private static final Path UPLOAD_DIR = Paths.get("uploads", "syllabi").toAbsolutePath().normalize();

    @PostMapping(value = "/upload-syllabus", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    @Operation(summary = "Upload course syllabus file (PDF, DOCX, TXT)")
    public ResponseEntity<Map<String, String>> uploadSyllabusFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new BusinessRuleException("Uploaded file cannot be empty.");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "syllabus.pdf");
        String extension = getFileExtension(originalFilename).toLowerCase();

        if (!extension.matches("pdf|docx|doc|txt")) {
            throw new BusinessRuleException("Invalid file type. Only PDF, DOCX, DOC, and TXT files are supported.");
        }

        try {
            Files.createDirectories(UPLOAD_DIR);
            String storedFileName = UUID.randomUUID().toString() + "_" + originalFilename.replaceAll("[^a-zA-Z0-9.-]", "_");
            Path targetLocation = UPLOAD_DIR.resolve(storedFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/api/files/syllabi/" + storedFileName;
            log.info("Syllabus file saved: {} -> {}", originalFilename, fileUrl);

            return ResponseEntity.ok(Map.of(
                    "url", fileUrl,
                    "fileName", originalFilename
            ));
        } catch (IOException ex) {
            log.error("Failed to save syllabus file", ex);
            throw new BusinessRuleException("Failed to store file: " + ex.getMessage());
        }
    }

    @GetMapping("/syllabi/{fileName:.+}")
    @Operation(summary = "Download or view uploaded syllabus file")
    public ResponseEntity<Resource> getSyllabusFile(@PathVariable String fileName) {
        try {
            Path filePath = UPLOAD_DIR.resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = "application/octet-stream";
            String lower = fileName.toLowerCase();
            if (lower.endsWith(".pdf")) contentType = "application/pdf";
            else if (lower.endsWith(".docx")) contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            else if (lower.endsWith(".doc")) contentType = "application/msword";
            else if (lower.endsWith(".txt")) contentType = "text/plain";

            String disposition = (lower.endsWith(".docx") || lower.endsWith(".doc"))
                    ? "attachment; filename=\"" + resource.getFilename() + "\""
                    : "inline; filename=\"" + resource.getFilename() + "\"";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                    .body(resource);

        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    private String getFileExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        return (dotIndex == -1) ? "" : fileName.substring(dotIndex + 1);
    }
}
