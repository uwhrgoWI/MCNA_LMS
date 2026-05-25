export type UserRole = 'admin' | 'manager' | 'teacher' | 'student';

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  avatarInitials: string;
  avatarColor: string;
  status: 'active' | 'inactive';
  joinedAt: string;
  lastLogin?: string;
  phone?: string;
  major?: string;
  gpa?: number;
  studentId?: string;
  gender?: string;
  dob?: string;
  relationContact?: string;
}

export interface ClassSlot {
  day: number; // 2 = Thứ 2, ..., 6 = Thứ 6
  slot: number; // 1, 2, 3, 4
  room: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  teacherId: string;
  teacherName?: string;
  status: 'active' | 'pending';
  enrolled: number;
  maxEnroll: number;
  progress: number;
  thumbnailColor: string;
  thumbnailEmoji: string;
  schedule: ClassSlot[];
  description: string;
}

export interface Submission {
  studentId: string;
  studentName: string;
  submittedAt: string;
  notes: string;
  fileName: string;
  grade?: number;
  feedback?: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  courseName?: string;
  title: string;
  instructions: string;
  dueDate: string;
  maxScore: number;
  status: 'open' | 'closed';
  submissions: Submission[];
}

export interface GradeRecord {
  id: string;
  studentId: string;
  studentName?: string;
  studentCode?: string;
  courseId: string;
  courseName?: string;
  attendance: number; // attendance percentage or score
  midterm: number;
  final: number;
  assignments_avg: number;
}

export interface Notification {
  id: string;
  userId: string; // 'all' or specific user id
  type: 'info' | 'warning' | 'success' | 'danger' | 'announcement';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userEmail?: string;
  userId?: string;
  userRole?: string;
  action: string;
  resource: string;
  ip?: string;
  ipAddress?: string;
  status?: string;
}

export interface Transaction {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  amount: number;
  type: 'tuition' | 'scholarship';
  status: 'paid' | 'unpaid' | 'pending_approval';
  schoolYear: string;
  billDate: string;
  dueDate: string;
  paidDate?: string;
}

export interface SystemSettings {
  schoolName: string;
  logoUrl: string;
  timezone: string;
  language: string;
  contactInfo: string;
  currentYear: string;
  semesterName: string;
  gradingScale: '10' | '4' | 'A-F';
}

export interface FeatureFlags {
  enableRegistration: boolean;
  enableGpaCalculator: boolean;
  enableTuitionFeePayment: boolean;
  enableOnlineExams: boolean;
  enableThemeToggle: boolean;
  enableAuditLogs: boolean;
  enableNotifications: boolean;
  enableBulkEnroll: boolean;
}
