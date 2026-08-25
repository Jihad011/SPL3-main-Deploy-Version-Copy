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
   * Generates a Masterclass Official Academic Transcript PDF with dynamic roll and semester progression.
   */
  generateTranscriptPdf(history: import('../models/models').StudentHistoryResponse): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const roll = history.currentSemesterRollId || history.baseRollNumber || 'Student';

    // ── Header ──
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.text('Institute of Information Technology', 105, 18, { align: 'center' });

    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('University of Dhaka', 105, 25, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(234, 88, 12); // Orange Accent
    doc.text('OFFICIAL ACADEMIC TRANSCRIPT & DOSSIER', 105, 32, { align: 'center' });

    // Separator line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, 36, 195, 36);

    // ── Student Dossier Card ──
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, 40, 180, 28, 3, 3, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(15, 40, 180, 28, 3, 3, 'S');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Student Name: ${history.studentName}`, 20, 47);
    doc.text(`Current Semester Roll: ${history.currentSemesterRollId || 'N/A'}`, 110, 47);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Base Roll: ${history.baseRollNumber || 'N/A'}`, 20, 55);
    doc.text(`Registration No: ${history.registrationNumber || 'N/A'}`, 75, 55);
    doc.text(`Batch: ${history.batch || 'N/A'}`, 145, 55);

    doc.text(`Cumulative GPA: ${Number(history.cgpa || 0).toFixed(2)} / 4.00`, 20, 63);
    doc.text(`Completed Credits: ${history.totalCreditsCompleted} / 36`, 75, 63);
    doc.text(`Semester Gaps: ${history.totalGapSemesters || 0}`, 145, 63);

    let currentY = 74;

    // ── Semesters Breakdown ──
    if (history.semesters && history.semesters.length > 0) {
      for (const sem of history.semesters) {
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }

        if (sem.isGap) {
          // Gap Warning Banner
          doc.setFillColor(254, 243, 199);
          doc.roundedRect(15, currentY, 180, 12, 2, 2, 'F');
          doc.setDrawColor(245, 158, 11);
          doc.roundedRect(15, currentY, 180, 12, 2, 2, 'S');

          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(180, 83, 9);
          doc.text(`[GAP] ${sem.semesterName} (${sem.year}) · Term Roll: ${sem.semesterRollId || 'N/A'} — Student was not enrolled. Gap Penalty: BDT 10,000`, 20, currentY + 7.5);
          currentY += 16;
        } else {
          // Semester Header
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text(`${sem.semesterName} (${sem.year})`, 15, currentY);

          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          const semMeta = `Term Roll: ${sem.semesterRollId || 'N/A'}   |   Credits: ${sem.totalCredits || 0}   |   SGPA: ${sem.sgpa ? Number(sem.sgpa).toFixed(2) : 'N/A'}`;
          doc.text(semMeta, 195, currentY, { align: 'right' });
          currentY += 3;

          // Course Table
          const tableRows = (sem.courses || []).map(c => [
            c.courseCode,
            c.courseName,
            String(c.creditHours),
            c.teacherName || 'Faculty',
            c.midtermMarks != null ? String(c.midtermMarks) : '-',
            c.finalMarks != null ? String(c.finalMarks) : '-',
            c.totalMarks != null ? String(c.totalMarks) : '-',
            c.gradeLetter || '-',
            c.gradePoint != null ? Number(c.gradePoint).toFixed(2) : '-'
          ]);

          this.runAutoTable(doc, {
            startY: currentY,
            margin: { left: 15, right: 15 },
            head: [['Code', 'Course Title', 'Cr', 'Instructor', 'Mid', 'Fin', 'Tot', 'Grd', 'GP']],
            body: tableRows,
            theme: 'grid',
            headStyles: {
              fillColor: [241, 245, 249],
              textColor: [15, 23, 42],
              fontStyle: 'bold',
              fontSize: 8,
              halign: 'center'
            },
            bodyStyles: {
              fontSize: 8,
              textColor: [51, 65, 85]
            },
            columnStyles: {
              0: { halign: 'center', fontStyle: 'bold', cellWidth: 18 },
              1: { halign: 'left', cellWidth: 48 },
              2: { halign: 'center', cellWidth: 10 },
              3: { halign: 'left', cellWidth: 34 },
              4: { halign: 'center', cellWidth: 12 },
              5: { halign: 'center', cellWidth: 12 },
              6: { halign: 'center', cellWidth: 12, fontStyle: 'bold' },
              7: { halign: 'center', cellWidth: 12, fontStyle: 'bold' },
              8: { halign: 'center', cellWidth: 12 }
            }
          });

          const autoTableDoc = doc as unknown as { lastAutoTable?: { finalY: number } };
          currentY = (autoTableDoc.lastAutoTable ? autoTableDoc.lastAutoTable.finalY : currentY + 25) + 8;
        }
      }
    }

    // ── Footer ──
    if (currentY > 265) {
      doc.addPage();
      currentY = 20;
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 275, 195, 275);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated on: ${new Date().toLocaleString()} · Official Academic Record System · IIT, University of Dhaka`, 105, 282, { align: 'center' });

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
