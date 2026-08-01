package com.iit.creditmanagement.service;

import com.iit.creditmanagement.exception.ResourceNotFoundException;
import com.iit.creditmanagement.model.entity.Grade;
import com.iit.creditmanagement.model.entity.User;
import com.iit.creditmanagement.repository.GradeRepository;
import com.iit.creditmanagement.repository.UserRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class TranscriptService {

    private final UserRepository userRepository;
    private final GradeRepository gradeRepository;

    @Transactional(readOnly = true)
    public byte[] generateTranscriptPdf(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));

        List<Grade> grades = gradeRepository.findAllByEnrollmentStudentId(studentId);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, out);
            document.open();

            // Header
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20);
            Paragraph title = new Paragraph("Institute of Information Technology\nUniversity of Dhaka", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            
            document.add(new Paragraph("\n"));

            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Paragraph subtitle = new Paragraph("Academic Transcript", subtitleFont);
            subtitle.setAlignment(Element.ALIGN_CENTER);
            document.add(subtitle);

            document.add(new Paragraph("\n\n"));

            // Student Info
            Font infoFont = FontFactory.getFont(FontFactory.HELVETICA, 12);
            document.add(new Paragraph("Name: " + student.getName(), infoFont));
            document.add(new Paragraph("Roll Number: " + student.getRollNumber(), infoFont));
            document.add(new Paragraph("Registration Number: " + (student.getRegistrationNumber() != null ? student.getRegistrationNumber() : "N/A"), infoFont));
            document.add(new Paragraph("Batch: " + student.getBatch(), infoFont));
            
            document.add(new Paragraph("\n\n"));

            // Table
            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{2.5f, 2f, 4f, 1.5f, 1.5f, 1.5f});

            // Table Headers
            Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD);
            String[] headers = {"Semester", "Course Code", "Course Name", "Credits", "Grade", "GP"};
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, headFont));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(5);
                table.addCell(cell);
            }

            // Table Data
            BigDecimal totalPoints = BigDecimal.ZERO;
            int totalCredits = 0;

            for (Grade grade : grades) {
                if (grade.getGradeLetter() == null) continue; // Skip incomplete courses

                String semesterLabel = grade.getEnrollment().getSemester().getLabel();
                String courseCode = grade.getEnrollment().getCourse().getCode();
                String courseName = grade.getEnrollment().getCourse().getName();
                int credits = grade.getEnrollment().getCourse().getCreditHours();
                String letter = grade.getGradeLetter().name().replace("_PLUS", "+").replace("_MINUS", "-");
                BigDecimal gp = grade.getGradePoint();

                table.addCell(createCell(semesterLabel, Element.ALIGN_CENTER));
                table.addCell(createCell(courseCode, Element.ALIGN_CENTER));
                table.addCell(createCell(courseName, Element.ALIGN_LEFT));
                table.addCell(createCell(String.valueOf(credits), Element.ALIGN_CENTER));
                table.addCell(createCell(letter, Element.ALIGN_CENTER));
                table.addCell(createCell(gp.toString(), Element.ALIGN_CENTER));

                totalPoints = totalPoints.add(gp.multiply(BigDecimal.valueOf(credits)));
                totalCredits += credits;
            }

            document.add(table);

            document.add(new Paragraph("\n\n"));

            // CGPA Summary
            BigDecimal cgpa = totalCredits > 0 ? totalPoints.divide(BigDecimal.valueOf(totalCredits), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
            Font cgpaFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Paragraph cgpaText = new Paragraph("Cumulative Grade Point Average (CGPA): " + cgpa, cgpaFont);
            cgpaText.setAlignment(Element.ALIGN_RIGHT);
            document.add(cgpaText);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate PDF transcript", e);
            throw new RuntimeException("Error generating transcript", e);
        }
    }

    private PdfPCell createCell(String text, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text));
        cell.setPadding(5);
        cell.setHorizontalAlignment(alignment);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        return cell;
    }
}
