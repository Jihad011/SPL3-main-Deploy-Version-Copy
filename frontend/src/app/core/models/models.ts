// ============================================================
// Core TypeScript interfaces — mirror backend Java records exactly
// ============================================================

export interface Page<T> {
  content: T[];
  pageable: any;
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN';
export type CourseType = 'CORE' | 'OPTIONAL';
export type EnrollmentStatus = 'ACTIVE' | 'DROPPED' | 'COMPLETED' | 'FAILED';
export type GradeLetter = 'A_PLUS' | 'A' | 'A_MINUS' | 'B_PLUS' | 'B' | 'B_MINUS' | 'C_PLUS' | 'C' | 'D' | 'F';
export type FeeType = 'RETAKE' | 'SEMESTER_GAP' | 'REGISTRATION' | 'OTHER';
export type FeeStatus = 'UNPAID' | 'PAID' | 'WAIVED';
export type SemesterName = 'SPRING' | 'SUMMER' | 'FALL';

// ── Auth ────────────────────────────────────────────────────
export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: number;
  name: string;
  email: string;
  role: Role;
  rollNumber: string | null;
  registrationNumber: string | null;
  designation?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface PublicRegisterRequest {
  name: string;
  email: string;
  password: string;
  rollNumber: string;
  batch: number;
  registrationNumber?: string;
  phone?: string;
}

// ── Semester ─────────────────────────────────────────────────
export interface SemesterResponse {
  id: number;
  name: SemesterName;
  year: number;
  label: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

// ── Course ───────────────────────────────────────────────────
export interface CourseResponse {
  id: number;
  code: string;
  name: string;
  description: string | null;
  creditHours: number;
  courseType: CourseType;
  maxSeats: number;
  currentEnrollment: number;
  availableSeats: number;
  isFull: boolean;
  teacherId: number | null;
  teacherName: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CourseRequest {
  code: string;
  name: string;
  description?: string;
  creditHours: number;
  courseType: CourseType;
  maxSeats?: number;
  teacherId?: number;
}

// ── Enrollment ────────────────────────────────────────────────
export interface EnrollmentResponse {
  id: number;
  studentId: number;
  studentName: string;
  rollNumber: string;
  courseId: number;
  courseCode: string;
  courseName: string;
  creditHours: number;
  semesterId: number;
  semesterLabel: string;
  status: EnrollmentStatus;
  isRetake: boolean;
  enrolledAt: string;
  courseType?: string;
}

export interface EnrollRequest {
  courseId: number;
  semesterId: number;
  retake: boolean;
}

// ── Grade ─────────────────────────────────────────────────────
export interface GradeResponse {
  id: number;
  enrollmentId: number;
  studentId: number;
  studentName: string;
  rollNumber: string;
  registrationNumber: string;
  courseId: number;
  courseCode: string;
  courseName: string;
  creditHours: number;
  semesterLabel: string;
  midtermMarks: number | null;
  finalMarks: number | null;
  totalMarks: number | null;
  gradeLetter: GradeLetter | null;
  gradeDisplay: string | null;
  gradePoint: number | null;
  enteredAt: string;
}

export interface GradeEntryRequest {
  enrollmentId: number;
  midtermMarks?: number;
  finalMarks?: number;
}

// ── Fee ───────────────────────────────────────────────────────
export interface FeeResponse {
  id: number;
  studentId: number;
  studentName: string;
  rollNumber: string;
  feeType: FeeType;
  feeTypeDisplay: string;
  amount: number;
  description: string | null;
  semesterLabel: string | null;
  status: FeeStatus;
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface FeeCreateRequest {
  studentId: number;
  feeType: FeeType;
  amount: number;
  description?: string;
  semesterId?: number;
  dueDate?: string;
}

// ── Student Dashboard ──────────────────────────────────────────
export interface StudentDashboardResponse {
  studentId: number;
  studentName: string;
  rollNumber: string;
  registrationNumber: string;
  currentSemester: string;
  currentSemesterCredits: number;
  maxCreditsPerSemester: number;
  remainingCredits: number;
  cgpa: number;
  totalCreditsEarned: number;
  totalCoursesCompleted: number;
  totalDues: number;
  unpaidFeeCount: number;
  currentEnrollments: EnrollmentResponse[];
}

// ── User ──────────────────────────────────────────────────────
export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: Role;
  rollNumber: string | null;
  registrationNumber: string | null;
  phone: string | null;
  batch: number | null;
  designation: string | null;
  department: string | null;
  isActive: boolean;
}

// ── Generic ───────────────────────────────────────────────────
export interface ApiResponse {
  success: boolean;
  message: string;
}

export interface ApiError {
  status: number;
  message: string;
  timestamp: string;
  fieldErrors?: Record<string, string>;
}
