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
  generateReceipt(fee: FeeResponse, studentName: string = 'Student'): void {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 60, 114); // IIT Dark Blue theme
    doc.text('Institute of Information Technology', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text('University of Dhaka', 105, 28, { align: 'center' });
    
    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 35, 190, 35);
    
    // Receipt Title
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text('PAYMENT RECEIPT', 105, 50, { align: 'center' });
    
    // Receipt Details
    doc.setFontSize(12);
    const startY = 70;
    const lineHeight = 10;
    
    doc.text(`Receipt No: #${fee.id.toString().padStart(6, '0')}`, 20, startY);
    doc.text(`Date of Issue: ${new Date().toLocaleDateString()}`, 140, startY);
    
    doc.text(`Student Name: ${studentName}`, 20, startY + lineHeight);
    
    doc.text(`Fee Type: ${fee.feeType.replace('_', ' ')}`, 20, startY + lineHeight * 3);
    doc.text(`Description: ${fee.description || 'N/A'}`, 20, startY + lineHeight * 4);
    doc.text(`Payment Method: ${fee.paymentMethod ? fee.paymentMethod.replace('_', ' ') : 'N/A'}`, 20, startY + lineHeight * 5);
    doc.text(`Payment Date: ${fee.paidAt ? new Date(fee.paidAt).toLocaleString() : 'N/A'}`, 20, startY + lineHeight * 6);
    
    // Amount Box
    doc.setFillColor(240, 248, 255);
    doc.rect(20, startY + lineHeight * 8, 170, 20, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Paid: ${fee.amount} BDT`, 25, startY + lineHeight * 8 + 13);
    
    // Footer / Signatures
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('This is a computer-generated receipt and does not require a physical signature.', 105, 270, { align: 'center' });
    
    doc.save(`Receipt_${fee.feeType}_${fee.id}.pdf`);
  }
}
