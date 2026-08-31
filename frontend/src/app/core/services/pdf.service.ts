import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FeeResponse } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor() { }

  /**
   * Generates a professional payment receipt PDF for a paid fee.
   */
  generateReceipt(fee: FeeResponse, studentName: string = 'Student', studentRoll: string = ''): void {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text('Institute of Information Technology', 105, 20, { align: 'center' });
    
    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('University of Dhaka', 105, 27, { align: 'center' });
    
    // Line separator
    doc.setDrawColor(79, 70, 229); // Royal Indigo
    doc.setLineWidth(0.8);
    doc.line(20, 33, 190, 33);
    
    // Receipt Title Badge
    doc.setFillColor(79, 70, 229);
    doc.roundedRect(65, 38, 80, 10, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('OFFICIAL PAYMENT RECEIPT', 105, 44.5, { align: 'center' });
    
    // Receipt Details Card
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(20, 55, 170, 68, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(20, 55, 170, 68, 3, 3, 'S');

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);

    const startY = 66;
    const lineHeight = 8.5;
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Receipt Reference:`, 26, startY);
    doc.setFont('helvetica', 'normal');
    doc.text(`#REC-${fee.id.toString().padStart(6, '0')}`, 65, startY);

    doc.setFont('helvetica', 'bold');
    doc.text(`Issued On:`, 120, startY);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleDateString('en-GB'), 145, startY);
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Student Name:`, 26, startY + lineHeight);
    doc.setFont('helvetica', 'normal');
    doc.text(studentName, 65, startY + lineHeight);

    if (studentRoll) {
      doc.setFont('helvetica', 'bold');
      doc.text(`Student Roll:`, 120, startY + lineHeight);
      doc.setFont('helvetica', 'normal');
      doc.text(studentRoll, 145, startY + lineHeight);
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Fee Category:`, 26, startY + lineHeight * 2);
    doc.setFont('helvetica', 'normal');
    doc.text(fee.feeTypeDisplay || fee.feeType.replace('_', ' '), 65, startY + lineHeight * 2);

    doc.setFont('helvetica', 'bold');
    doc.text(`Semester:`, 120, startY + lineHeight * 2);
    doc.setFont('helvetica', 'normal');
    doc.text(fee.semesterLabel || 'N/A', 145, startY + lineHeight * 2);

    doc.setFont('helvetica', 'bold');
    doc.text(`Description:`, 26, startY + lineHeight * 3);
    doc.setFont('helvetica', 'normal');
    doc.text(fee.description || 'Standard Academic Assessment', 65, startY + lineHeight * 3);

    doc.setFont('helvetica', 'bold');
    doc.text(`Payment Method:`, 26, startY + lineHeight * 4);
    doc.setFont('helvetica', 'normal');
    doc.text(fee.paymentMethod ? fee.paymentMethod.replace('_', ' ') : 'Online Gateway', 65, startY + lineHeight * 4);

    doc.setFont('helvetica', 'bold');
    doc.text(`Paid Date:`, 26, startY + lineHeight * 5);
    doc.setFont('helvetica', 'normal');
    doc.text(fee.paidAt ? new Date(fee.paidAt).toLocaleString('en-GB') : 'Verified', 65, startY + lineHeight * 5);
    
    // Amount Box
    doc.setFillColor(16, 185, 129); // Emerald
    doc.roundedRect(20, 132, 170, 18, 3, 3, 'F');
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`TOTAL AMOUNT PAID:  BDT ${fee.amount} (CLEARED)`, 105, 143.5, { align: 'center' });
    
    // Footer / Verification Notice
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('This is an electronically generated official receipt issued by MIT Open Credit Management System.', 105, 270, { align: 'center' });
    doc.text('Institute of Information Technology · University of Dhaka · All rights reserved.', 105, 275, { align: 'center' });
    
    doc.save(`Receipt_${fee.feeType}_${fee.id}.pdf`);
  }

  /**
   * Generates a Masterclass Official Academic Transcript PDF with separate boxed semester cards.
   */
  generateTranscriptPdf(history: import('../models/models').StudentHistoryResponse): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const roll = history.currentSemesterRollId || history.baseRollNumber || 'Student';
    const pageWidth = 210;
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2); // 182mm

    // ── Official Header ──
    doc.setFontSize(17);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text('Institute of Information Technology', 105, 16, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('University of Dhaka', 105, 22.5, { align: 'center' });

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(8, 106, 216); // Royal Blue Accent
    doc.text('OFFICIAL ACADEMIC TRANSCRIPT & DOSSIER', 105, 28.5, { align: 'center' });

    // Decorative Accent Line
    doc.setDrawColor(8, 106, 216);
    doc.setLineWidth(0.8);
    doc.line(margin, 32, pageWidth - margin, 32);

    // ── Student Dossier Summary Card ──
    const cardY = 35;
    const cardHeight = 35;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, cardY, contentWidth, cardHeight, 2.5, 2.5, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, cardY, contentWidth, cardHeight, 2.5, 2.5, 'S');

    // Subtle Vertical Divider in the Middle
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(105, cardY + 2, 105, cardY + cardHeight - 2);

    const leftColLabelX = margin + 5;     // 19mm
    const leftColValueX = margin + 35;    // 49mm
    const rightColLabelX = 109;           // 109mm
    const rightColValueX = 142;           // 142mm

    // Row 1 (y = 42)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Student Name:`, leftColLabelX, 42);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(history.studentName || 'N/A', leftColValueX, 42);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Active Term Roll:`, rightColLabelX, 42);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(8, 106, 216);
    doc.text(history.currentSemesterRollId || 'N/A', rightColValueX, 42);

    // Row 2 (y = 49)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Base Roll No:`, leftColLabelX, 49);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(history.baseRollNumber || 'N/A', leftColValueX, 49);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Registration No:`, rightColLabelX, 49);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(history.registrationNumber || 'N/A', rightColValueX, 49);

    // Row 3 (y = 56)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Batch / Program:`, leftColLabelX, 56);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(history.batch ? `Batch ${history.batch}` : 'N/A', leftColValueX, 56);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Academic Status:`, rightColLabelX, 56);
    doc.setFont('helvetica', 'bold');
    const isAct = history.status === 'ACTIVE';
    const isGrad = history.status === 'GRADUATED';
    doc.setTextColor(isAct ? 5 : (isGrad ? 2 : 217), isAct ? 150 : (isGrad ? 132 : 119), isAct ? 105 : (isGrad ? 199 : 6));
    doc.text(history.status || 'ACTIVE', rightColValueX, 56);

    // Row 4 (y = 63)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Cumulative GPA:`, leftColLabelX, 63);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text(`${Number(history.cgpa || 0).toFixed(2)} / 4.00`, leftColValueX, 63);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Earned Credits:`, rightColLabelX, 63);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const creditsInfo = `${history.totalCreditsCompleted || 0} / 36 Cr` + (history.totalGapSemesters > 0 ? ` (${history.totalGapSemesters} Gaps)` : '');
    doc.text(creditsInfo, rightColValueX, 63);

    let currentY = 76;

    // ── Semester-by-Semester Boxed Cards ──
    if (history.semesters && history.semesters.length > 0) {
      for (const sem of history.semesters) {
        const hasCourses = sem.courses && sem.courses.length > 0;
        const estimatedBoxHeight = sem.isGap ? 18 : (hasCourses ? (16 + (sem.courses.length * 7.5)) : 22);

        // Page break check
        if (currentY + estimatedBoxHeight > 265) {
          doc.addPage();
          currentY = 16;
        }

        if (sem.isGap) {
          // ── Gap Semester Boxed Card ──
          doc.setFillColor(254, 243, 199);
          doc.roundedRect(margin, currentY, contentWidth, 14, 2, 2, 'F');
          doc.setDrawColor(245, 158, 11);
          doc.setLineWidth(0.4);
          doc.roundedRect(margin, currentY, contentWidth, 14, 2, 2, 'S');

          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(180, 83, 9);
          doc.text(`GAP SEMESTER · ${sem.semesterName || 'Term'} (${sem.year})`, margin + 5, currentY + 6);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(146, 64, 14);
          const gapMsg = `Term Roll: ${sem.semesterRollId || 'N/A'}  |  Student was not enrolled during this term.  Gap Penalty: BDT 10,000`;
          doc.text(gapMsg, margin + 5, currentY + 11);

          currentY += 18;
        } else {
          // ── Enrolled Semester Boxed Card ──
          const boxStartY = currentY;
          
          if (!hasCourses) {
            // Empty Semester Box Card
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(margin, boxStartY, contentWidth, 20, 2.5, 2.5, 'F');
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.4);
            doc.roundedRect(margin, boxStartY, contentWidth, 20, 2.5, 2.5, 'S');

            // Header Banner inside Box
            doc.setFillColor(241, 245, 249);
            doc.roundedRect(margin, boxStartY, contentWidth, 9, 2.5, 2.5, 'F');
            // Square off bottom corners of banner
            doc.rect(margin, boxStartY + 4, contentWidth, 5, 'F');
            doc.setDrawColor(226, 232, 240);
            doc.line(margin, boxStartY + 9, margin + contentWidth, boxStartY + 9);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text(`${sem.semesterLabel || sem.semesterName} (${sem.year})`, margin + 4, boxStartY + 6.2);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(71, 85, 105);
            doc.text(`Term Roll: ${sem.semesterRollId || 'N/A'}   |   Credits: 0   |   SGPA: 0.00`, margin + contentWidth - 4, boxStartY + 6.2, { align: 'right' });

            // Body text for empty course
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(148, 163, 184);
            doc.text('No course enrollments or evaluated grades recorded for this semester session.', 105, boxStartY + 15.5, { align: 'center' });

            currentY += 24;
          } else {
            // Semester with Courses (Header Banner + Full Data Table inside Box)
            const tableRows = sem.courses.map(c => [
              c.courseCode,
              c.courseName + (c.isRetake ? ' (Retake)' : ''),
              String(c.creditHours),
              c.teacherName || 'Faculty',
              c.midtermMarks != null ? String(c.midtermMarks) : '—',
              c.finalMarks != null ? String(c.finalMarks) : '—',
              c.totalMarks != null ? String(c.totalMarks) : '—',
              c.gradeLetter || 'IP',
              c.gradePoint != null ? Number(c.gradePoint).toFixed(2) : '—'
            ]);

            // Semester Header Banner
            doc.setFillColor(15, 23, 42); // Deep Slate Navy
            doc.roundedRect(margin, boxStartY, contentWidth, 8, 2, 2, 'F');

            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text(`${sem.semesterLabel || sem.semesterName} (${sem.year})`, margin + 4, boxStartY + 5.5);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(203, 213, 225);
            const semMeta = `Term Roll: ${sem.semesterRollId || 'N/A'}   |   Credits: ${sem.totalCredits || 0}   |   Term SGPA: ${sem.sgpa ? Number(sem.sgpa).toFixed(2) : '0.00'}`;
            doc.text(semMeta, margin + contentWidth - 4, boxStartY + 5.5, { align: 'right' });

            this.runAutoTable(doc, {
              startY: boxStartY + 8.5,
              margin: { left: margin, right: margin },
              head: [['Course Code', 'Course Title', 'Cr', 'Instructor', 'Mid (40)', 'Fin (60)', 'Tot (100)', 'Grade', 'GP']],
              body: tableRows,
              theme: 'grid',
              headStyles: {
                fillColor: [241, 245, 249],
                textColor: [15, 23, 42],
                fontStyle: 'bold',
                fontSize: 7.5,
                halign: 'center'
              },
              bodyStyles: {
                fontSize: 7.5,
                textColor: [51, 65, 85]
              },
              columnStyles: {
                0: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
                1: { halign: 'left', cellWidth: 50 },
                2: { halign: 'center', cellWidth: 10 },
                3: { halign: 'left', cellWidth: 36 },
                4: { halign: 'center', cellWidth: 14 },
                5: { halign: 'center', cellWidth: 14 },
                6: { halign: 'center', cellWidth: 14, fontStyle: 'bold' },
                7: { halign: 'center', cellWidth: 12, fontStyle: 'bold' },
                8: { halign: 'center', cellWidth: 12 }
              }
            });

            const autoTableDoc = doc as unknown as { lastAutoTable?: { finalY: number } };
            currentY = (autoTableDoc.lastAutoTable ? autoTableDoc.lastAutoTable.finalY : currentY + 30) + 5;
          }
        }
      }
    }

    // ── Signatures & Authentication Block ──
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    const signY = Math.max(currentY + 12, 260);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);

    // Left Signature line
    doc.line(margin + 10, signY, margin + 60, signY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Prepared & Verified By', margin + 35, signY + 4.5, { align: 'center' });

    // Right Signature line
    doc.line(pageWidth - margin - 60, signY, pageWidth - margin - 10, signY);
    doc.text('Director / Controller of Examinations', pageWidth - margin - 35, signY + 4.5, { align: 'center' });

    // ── Footer ──
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 280, pageWidth - margin, 280);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Official Academic Record · IIT, University of Dhaka · Generated: ${new Date().toLocaleString('en-GB')}`, 105, 285, { align: 'center' });

    // Native reliable download via jsPDF
    try {
      doc.save(`Official_Transcript_${roll}.pdf`);
    } catch {
      const blob = doc.output('blob');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Official_Transcript_${roll}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 1000);
    }
  }

  private runAutoTable(doc: any, options: any): void {
    if (typeof autoTable === 'function') {
      (autoTable as any)(doc, options);
    } else if (typeof (autoTable as any)?.default === 'function') {
      (autoTable as any).default(doc, options);
    } else if (typeof doc.autoTable === 'function') {
      doc.autoTable(options);
    }
  }
}
