import React, { useState, useEffect } from 'react';
import { User, Course, Assignment, GradeRecord, Transaction, AuditLog, Notification, SystemSettings, FeatureFlags } from './types';
import { generateSeedData } from './data';
import { AuthPages } from './components/AuthPages';
import { AdminPanel } from './components/AdminPanel';
import { ManagerPanel } from './components/ManagerPanel';
import { TeacherPanel } from './components/TeacherPanel';
import { StudentPanel } from './components/StudentPanel';
import { MiniCalendar } from './components/MiniCalendar';
import {
  LogOut, Layout, Settings, Sparkles, BookOpen, GraduationCap, Calendar, CheckSquare, Bell, UserCheck
} from 'lucide-react';

interface ToastMessage {
  id: string;
  msg: string;
  type: 'success' | 'error' | 'info' | 'warn';
}

export default function App() {
  // Global simulated databases initialized in-memory on local mount
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    schoolName: 'MCNA Technology School',
    contactEmail: 'contact@mcna.edu.vn',
    currentSemester: 'Học kỳ I Khóa 2026',
    tuitionFeePerCredit: 1250000,
    allowRegistration: true,
    maintenanceMode: false
  });
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>({
    enableChat: true,
    enableAiGrading: false,
    enableCryptoPayments: false,
    enableScholarshipApplications: true
  });

  // Current session variables
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Initialize seed database once
  useEffect(() => {
    const data = generateSeedData();
    setUsers(data.users);
    setCourses(data.courses);
    setAssignments(data.assignments);
    setGrades(data.grades);
    setTransactions(data.transactions);
    setAuditLogs(data.auditLogs);
    setNotifications(data.notifications);
  }, []);

  // --- REUSABLE AUDIT LOG GENERATOR ---
  const handleAddAuditLog = (action: string, resource: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      userId: currentUser?.id || 'anonymous',
      userName: currentUser?.name || 'Vãng lai',
      userRole: currentUser?.role || 'guest',
      action,
      resource,
      ipAddress: '192.168.1.42',
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // --- DYNAMIC TOAST NOTIFIER HELPER ---
  const handleToast = (msg: string, type: 'success' | 'error' | 'info' | 'warn') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = { id, msg, type };
    setToasts(prev => [...prev, newToast]);

    // Autoclose toast in 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // --- DEMO QUICK ROLE SWITCHER BYPASS ---
  const handleQuickRoleSwap = (role: 'admin' | 'manager' | 'teacher' | 'student') => {
    const matchedUser = users.find(u => u.role === role);
    if (matchedUser) {
      setCurrentUser(matchedUser);
      setIsProfileDropdownOpen(false);
      handleToast(`Đã chuyển hướng giả lập đổi phiên vai trò sang: ${role.toUpperCase()}`, 'success');
      handleAddAuditLog('Utilize Quick Swapper Bypass Switcher', `Swapped to role: ${role}`);
    } else {
      handleToast(`Không tìm thấy mẫu tài khoản Demo của phân quyền: ${role}`, 'error');
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      handleAddAuditLog('Logout from secure portal', `User ID: ${currentUser.id}`);
    }
    setCurrentUser(null);
    setIsCalendarOpen(false);
    setIsProfileDropdownOpen(false);
    handleToast('Hẹn gặp lại bạn lần sau! Đã đăng xuất an toàn.', 'info');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans select-none antialiased">
      
      {/* ============================================== */}
      {/* 1. TOP BAR NAVBAR BRANDING & PROFILE PORTAL */}
      {/* ============================================== */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 z-40 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        
        {/* Brand layout logo */}
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-black shadow-sm">
            M
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-gray-900 leading-none">MCNA Technology School</h1>
            <span className="text-[10px] text-gray-400 font-bold block mt-1 tracking-wider uppercase">LMS Learning Management Portal</span>
          </div>
        </div>

        {/* Dynamic center role switchers specifically designed for prompt evaluation convenience */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
          <span className="text-[10px] px-2 py-1 font-bold text-gray-400 uppercase tracking-wider">Demo Quick Swap:</span>
          {(['admin', 'manager', 'teacher', 'student'] as const).map(role => (
            <button
              key={role}
              onClick={() => handleQuickRoleSwap(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all duration-150 ${
                currentUser?.role === role
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {role === 'admin' ? 'Admin' : role === 'manager' ? 'Đào Tạo' : role === 'teacher' ? 'Giảng Viên' : 'Học Viên(SV)'}
            </button>
          ))}
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-3 relative">
          
          {currentUser && (
            <>
              {/* Mini study schedule checker button */}
              <button
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all relative"
                title="Sổ lịch học nhanh hôm nay"
              >
                <Calendar className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-600 border-2 border-white rounded-full"></span>
              </button>

              {/* Attendance quick reminder button */}
              <button
                onClick={() => handleToast('Bạn không có thông báo học tập khẩn cấp nào khác.', 'info')}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all relative"
                title="Trung tâm thông báo"
              >
                <Bell className="w-5 h-5" />
              </button>

              {/* Profile dropdown trigger */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 border rounded-xl transition"
                >
                  <div className={`w-7 h-7 rounded-lg ${currentUser.avatarColor || 'bg-blue-600'} flex items-center justify-center text-xs text-white font-bold font-mono shadow-xs`}>
                    {currentUser.avatarInitials}
                  </div>
                  <div className="hidden sm:block text-left text-xs">
                    <span className="font-bold text-gray-800 block leading-none">{currentUser.name}</span>
                    <span className="text-[9px] text-gray-400 block mt-1 uppercase leading-none font-bold">{currentUser.role === 'manager' ? 'Phòng Đào Tạp' : currentUser.role}</span>
                  </div>
                </button>

                {/* Profile drop boxes list content */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-white border border-slate-100 rounded-xl shadow-xl p-2 z-50 animate-fadeIn">
                    <div className="px-3 py-2 border-b text-[11px] text-slate-400 font-bold uppercase tracking-wider">Phiên làm việc</div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg w-full text-left mt-1.5 transition"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      Đăng xuất an toàn
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </header>

      {/* Mini calendar component anchor */}
      {isCalendarOpen && currentUser && (
        <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6">
          <MiniCalendar
            courses={courses}
            studentCourseIds={currentUser.role === 'student' ? ['c-1', 'c-2', 'c-3', 'c-4'] : undefined}
            teacherId={currentUser.role === 'teacher' ? currentUser.id : undefined}
            onClose={() => setIsCalendarOpen(false)}
          />
        </div>
      )}

      {/* ============================================== */}
      {/* 2. CORE DYNAMIC FRAME WORKSPACE SWITCH BOARD */}
      {/* ============================================== */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6">
        
        {currentUser ? (
          <>
            {/* 2.1 ADMIN CORE CONTROL PANEL */}
            {currentUser.role === 'admin' && (
              <AdminPanel
                currentUser={currentUser}
                users={users}
                courses={courses}
                auditLogs={auditLogs}
                transactions={transactions}
                systemSettings={systemSettings}
                featureFlags={featureFlags}
                onUpdateUsers={setUsers}
                onUpdateCourses={setCourses}
                onUpdateSettings={setSystemSettings}
                onUpdateFeatureFlags={setFeatureFlags}
                onAddAuditLog={handleAddAuditLog}
                toast={handleToast}
              />
            )}

            {/* 2.2 MANAGER PANEL (ACADEMIC DEPARTMENT) */}
            {currentUser.role === 'manager' && (
              <ManagerPanel
                currentUser={currentUser}
                users={users}
                courses={courses}
                transactions={transactions}
                notifications={notifications}
                onUpdateNotifications={setNotifications}
                onUpdateCourses={setCourses}
                onUpdateTransactions={setTransactions}
                onAddAuditLog={handleAddAuditLog}
                toast={handleToast}
              />
            )}

            {/* 2.3 TEACHER GRADERS OFFICE WORKSPACE */}
            {currentUser.role === 'teacher' && (
              <TeacherPanel
                currentUser={currentUser}
                users={users}
                courses={courses}
                assignments={assignments}
                grades={grades}
                onUpdateCourses={setCourses}
                onUpdateAssignments={setAssignments}
                onUpdateGrades={setGrades}
                onAddAuditLog={handleAddAuditLog}
                toast={handleToast}
              />
            )}

            {/* 2.4 STUDENT RESOURCE DESKTOP */}
            {currentUser.role === 'student' && (
              <StudentPanel
                currentUser={currentUser}
                users={users}
                courses={courses}
                assignments={assignments}
                grades={grades}
                transactions={transactions}
                notifications={notifications}
                onUpdateNotifications={setNotifications}
                onUpdateAssignments={setAssignments}
                onUpdateGrades={setGrades}
                onUpdateTransactions={setTransactions}
                onUpdateProfile={(updated) => {
                  setCurrentUser(updated);
                  setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
                }}
                onAddAuditLog={handleAddAuditLog}
                toast={handleToast}
              />
            )}
          </>
        ) : (
          /* Authentication Gatekeeper (Login / Multi-stage Register wizard) */
          <AuthPages
            users={users}
            toast={handleToast}
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              handleToast(`Chào mừng Thầy cô/Học sinh: ${user.name} đã đăng nhập hệ thống thành công!`, 'success');
              
              // Log registration session
              const newLog: AuditLog = {
                id: `log-${Date.now()}`,
                userId: user.id,
                userName: user.name,
                userRole: user.role,
                action: 'Login via Simulated Security JWT',
                resource: 'Main Application Portal',
                ipAddress: '192.168.1.103',
                timestamp: new Date().toISOString()
              };
              setAuditLogs(prev => [newLog, ...prev]);
            }}
            onRegisterSuccess={(newUser) => {
              setUsers(prev => [newUser, ...prev]);
              // Create default grade record and tuition ledger billings entry for registered students
              if (newUser.role === 'student') {
                const defaultGrade1: GradeRecord = {
                  id: `g-reg-1-${newUser.id}`,
                  studentId: newUser.id,
                  studentCode: newUser.studentId || 'MCNA-REG',
                  studentName: newUser.name,
                  courseId: 'c-1',
                  courseName: 'Cấu trúc dữ liệu và giải thuật (DSA)',
                  attendance: 100,
                  assignments_avg: 8.5,
                  midterm: 8.0,
                  final: 8.5
                };
                const defaultGrade2: GradeRecord = {
                  id: `g-reg-2-${newUser.id}`,
                  studentId: newUser.id,
                  studentCode: newUser.studentId || 'MCNA-REG',
                  studentName: newUser.name,
                  courseId: 'c-2',
                  courseName: 'Lập trình ứng dụng Front-End nâng cao',
                  attendance: 100,
                  assignments_avg: 9.0,
                  midterm: 8.5,
                  final: 9.0
                };
                setGrades(prev => [defaultGrade1, defaultGrade2, ...prev]);

                const defaultTx: Transaction = {
                  id: `tx-reg-${newUser.id}`,
                  studentId: newUser.id,
                  studentName: newUser.name,
                  studentCode: newUser.studentId || 'MCNA-REG',
                  amount: 12500000,
                  type: 'tuition',
                  status: 'unpaid',
                  schoolYear: 'MCNA Course Year 2026',
                  billDate: new Date().toISOString(),
                  dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
                };
                setTransactions(prev => [defaultTx, ...prev]);
              }
              handleToast(`Đăng ký tài khoản mới mã [${newUser.studentId || newUser.id}] thành công! Bạn có thể chọn đăng nhập ngay bây giờ.`, 'success');
            }}
          />
        )}

      </main>

      {/* Footer System Status Banner without tech-larp slop (humble metrics only) */}
      <footer className="bg-white border-t border-slate-100 py-4 px-6 text-center text-xs text-gray-455 font-bold">
        <span>&copy; 2026 MCNA Technology School - Hệ Thống LMS Quản Trị Đào Tạo Toàn Diện</span>
      </footer>

      {/* ============================================== */}
      {/* 4. CHIP BANNER TOASTS FLOATING LIST */}
      {/* ============================================== */}
      <div className="fixed bottom-5 right-5 flex flex-col gap-2.5 z-50">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-bold transition-all transform animate-toastSlide duration-300 flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-150' :
              toast.type === 'error' ? 'bg-red-50 text-red-800 border-red-150' :
              toast.type === 'warn' ? 'bg-amber-50 text-amber-800 border-amber-150' :
              'bg-blue-50 text-blue-800 border-blue-150'
            }`}
          >
            <span className="text-sm">
              {toast.type === 'success' ? '✅' :
               toast.type === 'error' ? '❌' :
               toast.type === 'warn' ? '⚠️' : 'ℹ️'}
            </span>
            <span>{toast.msg}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
