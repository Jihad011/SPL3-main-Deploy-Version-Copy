import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CourseResponse, CourseRequest,
  EnrollmentResponse, EnrollRequest,
  GradeResponse, GradeEntryRequest,
  FeeResponse, FeeCreateRequest, PaymentRequest,
  StudentDashboardResponse, UserResponse,
  SemesterResponse, ApiResponse, Page,
  StudentHistoryResponse
} from '../models/models';

/**
 * Single API service — all HTTP calls go through here.
 * Components inject specific sub-services; this is the transport layer.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Student ───────────────────────────────────────────────
  getStudentDashboard(): Observable<StudentDashboardResponse> {
    return this.http.get<StudentDashboardResponse>(`${this.api}/student/dashboard`);
  }
  downloadTranscript(): Observable<Blob> {
    return this.http.get(`${this.api}/student/transcript/download`, { responseType: 'blob' });
  }

  // ── Notifications ─────────────────────────────────────────
  getUnreadNotificationsCount(): Observable<number> {
    return this.http.get<number>(`${this.api}/notifications/unread-count`);
  }
  getNotifications(limit: number = 20): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/notifications?limit=${limit}`);
  }
  markNotificationsAsRead(): Observable<void> {
    return this.http.put<void>(`${this.api}/notifications/mark-all-read`, {});
  }

  // ── Semesters ─────────────────────────────────────────────
  getActiveSemesters(): Observable<SemesterResponse[]> {
    return this.http.get<SemesterResponse[]>(`${this.api}/semesters/active`);
  }
  getAllSemesters(): Observable<SemesterResponse[]> {
    return this.http.get<SemesterResponse[]>(`${this.api}/semesters`);
  }
  createSemester(req: any): Observable<SemesterResponse> {
    return this.http.post<SemesterResponse>(`${this.api}/semesters`, req);
  }
  activateSemester(id: number): Observable<SemesterResponse> {
    return this.http.patch<SemesterResponse>(`${this.api}/semesters/${id}/activate`, {});
  }

  // ── Courses ───────────────────────────────────────────────
  getAllCourses(): Observable<CourseResponse[]> {
    return this.http.get<CourseResponse[]>(`${this.api}/courses`);
  }
  getAvailableCourses(): Observable<CourseResponse[]> {
    return this.http.get<CourseResponse[]>(`${this.api}/courses/available`);
  }
  getMyCourses(): Observable<CourseResponse[]> {
    return this.http.get<CourseResponse[]>(`${this.api}/courses/my-courses`);
  }
  createCourse(req: CourseRequest): Observable<CourseResponse> {
    return this.http.post<CourseResponse>(`${this.api}/courses`, req);
  }
  updateCourse(id: number, req: CourseRequest): Observable<CourseResponse> {
    return this.http.put<CourseResponse>(`${this.api}/courses/${id}`, req);
  }
  deactivateCourse(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.api}/courses/${id}`);
  }

  // ── Enrollments ───────────────────────────────────────────
  enroll(req: EnrollRequest): Observable<EnrollmentResponse> {
    return this.http.post<EnrollmentResponse>(`${this.api}/enrollments`, req);
  }
  getMyEnrollments(): Observable<EnrollmentResponse[]> {
    return this.http.get<EnrollmentResponse[]>(`${this.api}/enrollments/my`);
  }
  dropCourse(enrollmentId: number): Observable<EnrollmentResponse> {
    return this.http.patch<EnrollmentResponse>(`${this.api}/enrollments/${enrollmentId}/drop`, {});
  }
  getEnrolledStudents(courseId: number, semesterId: number): Observable<EnrollmentResponse[]> {
    return this.http.get<EnrollmentResponse[]>(
      `${this.api}/enrollments/course/${courseId}/semester/${semesterId}`);
  }

  // ── Grades ────────────────────────────────────────────────
  enterGrade(req: GradeEntryRequest): Observable<GradeResponse> {
    return this.http.post<GradeResponse>(`${this.api}/grades/enter`, req);
  }
  bulkEnterGrades(courseId: number, requests: GradeEntryRequest[]): Observable<GradeResponse[]> {
    return this.http.post<GradeResponse[]>(`${this.api}/teacher/courses/${courseId}/grades/bulk`, requests);
  }
  uploadGradesCsv(courseId: number, file: File): Observable<GradeResponse[]> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<GradeResponse[]>(`${this.api}/teacher/courses/${courseId}/grades/upload`, formData);
  }
  getMyGrades(): Observable<GradeResponse[]> {
    return this.http.get<GradeResponse[]>(`${this.api}/grades/my`);
  }
  getMyCgpa(): Observable<{ cgpa: number }> {
    return this.http.get<{ cgpa: number }>(`${this.api}/grades/my/cgpa`);
  }
  getCourseGrades(courseId: number, semesterId: number): Observable<GradeResponse[]> {
    return this.http.get<GradeResponse[]>(
      `${this.api}/grades/course/${courseId}/semester/${semesterId}`);
  }

  // ── Fees ──────────────────────────────────────────────────
  getMyFees(): Observable<FeeResponse[]> {
    return this.http.get<FeeResponse[]>(`${this.api}/fees/my`);
  }
  getMyUnpaidFees(): Observable<FeeResponse[]> {
    return this.http.get<FeeResponse[]>(`${this.api}/fees/my/unpaid`);
  }
  getMyTotalDues(): Observable<{ totalDues: number }> {
    return this.http.get<{ totalDues: number }>(`${this.api}/fees/my/total-dues`);
  }
  payMyFee(feeId: number, method: string = 'CASH'): Observable<FeeResponse> {
    const req: PaymentRequest = { paymentMethod: method as any };
    return this.http.patch<FeeResponse>(`${this.api}/fees/my/${feeId}/pay`, req);
  }
  initiateSSLCommerzPayment(feeId: number): Observable<{ gatewayUrl: string }> {
    return this.http.post<{ gatewayUrl: string }>(`${this.api}/payment/sslcommerz/initiate`, { feeId });
  }
  getAllFees(): Observable<FeeResponse[]> {
    return this.http.get<FeeResponse[]>(`${this.api}/fees`);
  }
  auditGapFines(): Observable<FeeResponse[]> {
    return this.http.post<FeeResponse[]>(`${this.api}/fees/audit-gap-fines`, {});
  }

  // ── Admin ─────────────────────────────────────────────────
  createStudent(req: any): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.api}/admin/students`, { ...req, role: req.role || 'STUDENT' });
  }
  getAllStudents(page: number = 0, size: number = 20): Observable<Page<UserResponse>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<Page<UserResponse>>(`${this.api}/admin/students`, { params });
  }
  searchStudents(q: string): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.api}/admin/students/search`, {
      params: new HttpParams().set('q', q)
    });
  }
  getStudentById(id: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.api}/admin/students/${id}`);
  }
  updateStudent(id: number, req: any): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.api}/admin/students/${id}`, req);
  }
  patchStudent(id: number, req: any): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.api}/admin/students/${id}`, req);
  }
  createTeacher(req: any): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.api}/admin/teachers`, { ...req, role: req.role || 'TEACHER' });
  }
  updateTeacher(id: number, req: any): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.api}/admin/teachers/${id}`, req);
  }
  patchTeacher(id: number, req: any): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.api}/admin/teachers/${id}`, req);
  }
  getAllTeachers(page: number = 0, size: number = 20): Observable<Page<UserResponse>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<Page<UserResponse>>(`${this.api}/admin/teachers`, { params });
  }
  getSystemStats(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${this.api}/admin/stats`);
  }
  createFee(req: FeeCreateRequest): Observable<FeeResponse> {
    return this.http.post<FeeResponse>(`${this.api}/admin/fees`, req);
  }
  markFeeAsPaid(feeId: number, method: string = 'CASH'): Observable<FeeResponse> {
    const req: PaymentRequest = { paymentMethod: method as any };
    return this.http.patch<FeeResponse>(`${this.api}/fees/${feeId}/pay`, req);
  }
  getStudentFees(studentId: number): Observable<FeeResponse[]> {
    return this.http.get<FeeResponse[]>(`${this.api}/fees/student/${studentId}`);
  }

  // ── Student Academic History ───────────────────────────────
  getMyAcademicHistory(): Observable<StudentHistoryResponse> {
    return this.http.get<StudentHistoryResponse>(`${this.api}/student/history`);
  }

  // ── Teacher ───────────────────────────────────────────────
  getTeacherDashboard(): Observable<CourseResponse[]> {
    return this.http.get<CourseResponse[]>(`${this.api}/teacher/dashboard`);
  }
  getStudentHistory(query: string): Observable<StudentHistoryResponse> {
    return this.http.get<StudentHistoryResponse>(`${this.api}/teacher/students/${encodeURIComponent(query)}/history`);
  }
  searchStudentsTeacher(query: string = ''): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.api}/teacher/students/search?q=${encodeURIComponent(query)}`);
  }
  downloadStudentTranscript(studentId: number): Observable<Blob> {
    return this.http.get(`${this.api}/teacher/students/${studentId}/transcript`, { responseType: 'blob' });
  }
}

