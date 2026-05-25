import React, { useState, useMemo } from 'react';
import { User, Course, Assignment, Submission, GradeRecord, Transaction, Notification } from '../types';
import {
  BookOpen, Clock, AlertCircle, FileText, CheckCircle2, Award, Download,
  Sliders, ArrowUpRight, Check, Send, Sparkles, UserCheck, Shield, Settings, Bell,
  Star, Flame, Compass, HelpCircle, Landmark, CheckSquare, PlusSquare
} from 'lucide-react';

interface StudentPanelProps {
  currentUser: User;
  users: User[];
  courses: Course[];
  assignments: Assignment[];
  grades: GradeRecord[];
  transactions: Transaction[];
  notifications?: Notification[];
  onUpdateNotifications?: (newNotifs: Notification[]) => void;
  onUpdateAssignments: (newAssignments: Assignment[]) => void;
  onUpdateGrades: (newGrades: GradeRecord[]) => void;
  onUpdateTransactions: (newTransactions: Transaction[]) => void;
  onUpdateProfile: (updatedUser: User) => void;
  onAddAuditLog: (action: string, resource: string) => void;
  toast: (msg: string, type: 'success' | 'error' | 'info' | 'warn') => void;
}

export const StudentPanel: React.FC<StudentPanelProps> = ({
  currentUser,
  users,
  courses,
  assignments,
  grades,
  transactions,
  notifications = [],
  onUpdateNotifications,
  onUpdateAssignments,
  onUpdateGrades,
  onUpdateTransactions,
  onUpdateProfile,
  onAddAuditLog,
  toast
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'courses' | 'grades' | 'finance' | 'profile'>('dashboard');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseSubTab, setCourseSubTab] = useState<'overview' | 'materials' | 'assignments' | 'grades'>('overview');

  // Interactive tuition & payment states
  const [selectedTxForPayment, setSelectedTxForPayment] = useState<Transaction | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'vnpay' | 'banking' | 'momo'>('banking');
  const [isScholarshipSubmitting, setIsScholarshipSubmitting] = useState(false);
  const [scholReason, setScholReason] = useState('Em mong muốn nộp đơn học bổng MCNA Tinh Hoa Học Tập xuất sắc để phần nào san sẻ gánh nặng học phí gia đình.');

  // Interactive Homework submit state
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submitNotes, setSubmitNotes] = useState('');
  const [submitFileName, setSubmitFileName] = useState('baitap_thuchanh.zip');
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);

  // Hypothetical grades projection variables for standard courses
  const [hypotheticalFinalGrades, setHypotheticalFinalGrades] = useState<Record<string, number>>({});

  // Profile editable states
  const [profileTab, setProfileTab] = useState<'personal' | 'academic' | 'security' | 'notifications'>('personal');
  const [editPhone, setEditPhone] = useState(currentUser.phone || '');
  const [editGender, setEditGender] = useState(currentUser.gender || 'Nam');
  const [editDob, setEditDob] = useState(currentUser.dob || '');
  const [editBio, setEditBio] = useState('Chuyên ngành Kỹ thuật Phần mềm. Đam mê thiết kế hệ thống SaaS hiệu năng cao.');
  
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Toggles state
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [notifTelegram, setNotifTelegram] = useState(true);

  // High-fidelity Interactive Student Features
  const [scheduleDayFilter, setScheduleDayFilter] = useState<number>(0); // 0 = Tất cả ngày học
  const [advisorInterest, setAdvisorInterest] = useState<'SE' | 'AI' | 'CS' | 'SEC'>('AI');
  const [advisorResult, setAdvisorResult] = useState<{ name: string; credits: number; reason: string }[]>([]);
  const [isAdvising, setIsAdvising] = useState(false);

  // ==========================
  // --- CALCULATE ANALYTICS ---
  // ==========================
  const myCourseIds = ['c-1', 'c-2', 'c-3', 'c-4']; // Hardcoded courses for student demo
  const myCourses = useMemo(() => {
    return courses.filter(c => myCourseIds.includes(c.id));
  }, [courses]);

  const studentGrades = useMemo(() => {
    return grades.filter(g => g.studentId === currentUser.id && myCourseIds.includes(g.courseId));
  }, [grades, currentUser]);

  const pendingAssignments = useMemo(() => {
    return assignments.filter(
      a => myCourseIds.includes(a.courseId) && !a.submissions.some(s => s.studentId === currentUser.id)
    );
  }, [assignments, currentUser]);

  // Total credits accrual
  const accumulatedCredits = useMemo(() => {
    return myCourses.reduce((sum, c) => sum + c.credits, 0);
  }, [myCourses]);

  // Overall student GPA weighted calculator
  const studentOverallGPA = currentUser.gpa || 3.65;

  // GPA letters mapping
  const resolveLetterAndGpa4 = (g: GradeRecord, testValue?: number) => {
    const finalExam = testValue !== undefined ? testValue : g.final;
    const score10 = (g.attendance * 0.1) + (g.assignments_avg * 0.2) + (g.midterm * 0.3) + (finalExam * 0.4);
    
    let gpa4 = 0;
    let letter = 'F';

    if (score10 >= 8.5) { gpa4 = 4.0; letter = 'A'; }
    else if (score10 >= 8.0) { gpa4 = 3.5; letter = 'B+'; }
    else if (score10 >= 7.0) { gpa4 = 3.0; letter = 'B'; }
    else if (score10 >= 6.5) { gpa4 = 2.5; letter = 'C+'; }
    else if (score10 >= 5.5) { gpa4 = 2.0; letter = 'C'; }
    else if (score10 >= 5.0) { gpa4 = 1.5; letter = 'D+'; }
    else if (score10 >= 4.0) { gpa4 = 1.0; letter = 'D'; }

    return { score10: parseFloat(score10.toFixed(1)), gpa4, letter };
  };

  // --- HOMEWORK UPLOAD SUBMISSIONS ---
  const handleTriggerSubmitModal = (a: Assignment) => {
    setSelectedAssignment(a);
    setIsSubmitConfirmOpen(true);
  };

  const handleConfirmHomeWorkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    const newSub: Submission = {
      studentId: currentUser.id,
      studentName: currentUser.name,
      submittedAt: new Date().toISOString(),
      notes: submitNotes,
      fileName: submitFileName
    };

    // Update assignment in parent array state
    const updatedAssignments = assignments.map(a => {
      if (a.id === selectedAssignment.id) {
        return {
          ...a,
          submissions: [newSub, ...a.submissions]
        };
      }
      return a;
    });

    onUpdateAssignments(updatedAssignments);
    setIsSubmitConfirmOpen(false);
    setSubmitNotes('');
    toast(`Nộp bài tập thành công cho: ${selectedAssignment.title}!`, 'success');
    onAddAuditLog('Submit assignment solution code', `Assignment: ${selectedAssignment.title}`);
  };

  // --- SAVE STUDENT USER PROFILE CHANGES ---
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: User = {
      ...currentUser,
      phone: editPhone,
      gender: editGender,
      dob: editDob
    };
    onUpdateProfile(updatedUser);
    toast('Đã lưu các cập nhật hồ sơ cá nhân lên máy chủ!', 'success');
    onAddAuditLog('Update profile contact specifications', `User: ${currentUser.email}`);
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      toast('Mật khẩu nhập lại không trùng khớp.', 'error');
      return;
    }
    if (newPass.length < 8) {
      toast('Mật khẩu yếu. Yêu cầu tối thiểu 8 ký tự.', 'warn');
      return;
    }

    const updatedUser: User = {
      ...currentUser,
      password: newPass
    };

    onUpdateProfile(updatedUser);
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    toast('Đổi mật khẩu bảo mật học viện thành công!', 'success');
    onAddAuditLog('Perform manual password change rotation', `User ${currentUser.email}`);
  };

  const handleExportTranscript = () => {
    toast('Bản ghi điểm điện tử đang được chuyển mã số hóa...', 'info');
    setTimeout(() => {
      toast('Đã tải xuống Học bạ điện tử PDF thành công!', 'success');
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Mini sub navigator */}
      <div className="flex flex-wrap items-center justify-between border-b pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-gray-900">Bàn Học Tập Sinh Viên (Student Desktop)</h2>
            <p className="text-xs text-gray-500">Mã sinh viên: <b>{currentUser.studentId}</b> | Ngành: {currentUser.major}</p>
          </div>
        </div>

        {selectedCourse ? (
          <button
            onClick={() => setSelectedCourse(null)}
            className="btn-secondary py-2 px-3.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
          >
            Trở lại Khóa học của tôi
          </button>
        ) : (
          <div className="flex flex-wrap gap-1.5 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'dashboard' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'courses' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Lớp học của tôi ({myCourses.length})
            </button>
            <button
              onClick={() => setActiveTab('grades')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'grades' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-600 hover:text-gray-950'
              }`}
            >
              Học bạ & GPA Projector
            </button>
            <button
              onClick={() => setActiveTab('finance')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'finance' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-600 hover:text-gray-955'
              }`}
            >
              Học phí & Học bổng
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'profile' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-600 hover:text-gray-950'
              }`}
            >
              Profile của tôi
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 1. STUDENT OVERVIEW DASHBOARD */}
      {/* ========================================================= */}
      {!selectedCourse && activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Header Dashboard Banner */}
          <div className="bg-gradient-to-r from-emerald-900 via-emerald-850 to-teal-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden border border-emerald-800">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.04] rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-teal-500/[0.05] rounded-full blur-xl"></div>
            
            <div className="relative z-10 max-w-xl space-y-2 text-center md:text-left">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300 bg-emerald-800/60 px-2.5 py-1 rounded-full border border-emerald-700/50">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                CỔNG HỌC VIÊN CHUẨN QUỐC TẾMCNA
              </span>
              <h3 className="text-2xl font-extrabold tracking-tight mt-1">Xin chào, {currentUser.name}!</h3>
              <p className="text-xs text-emerald-100/90 leading-relaxed max-w-md">
                Hệ thống ghi nhận hồ sơ học bạ điện tử của bạn đang giữ trạng thái vô cùng xuất sắc. Bạn hiện còn <b className="text-amber-300 underline font-mono">{pendingAssignments.length} bài tập môn học</b> đang chờ nộp đúng hạn trong học kỳ này.
              </p>
              
              <div className="flex flex-wrap gap-2 pt-2 justify-center md:justify-start">
                <span className="text-[10px] font-bold bg-white/10 px-3 py-1 rounded-md border border-white/5 flex items-center gap-1 text-teal-200">
                  <UserCheck className="w-3 h-3" /> Tài khoản: {currentUser.status === 'active' ? 'Đang Hoạt Động (Verified)' : 'Khoá'}
                </span>
                <span className="text-[10px] font-bold bg-white/10 px-3 py-1 rounded-md border border-white/5 flex items-center gap-1 text-amber-200">
                  <Shield className="w-3 h-3" /> Phân quyền: Học viên tinh hoa (LMS)
                </span>
              </div>
            </div>
            
            {/* SVG Speedometer/Circular Gauge for GPA */}
            <div className="shrink-0 flex items-center gap-5 bg-white/[0.04] p-5 border border-white/10 rounded-2xl backdrop-blur-md relative z-10 w-full md:w-auto justify-around">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Gauge Background track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  {/* Gauge Active track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="url(#gpaGradient)"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (studentOverallGPA / 4.0) * 251.2}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="gpaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d97706" /> {/* amber */}
                      <stop offset="100%" stopColor="#10b981" /> {/* emerald */}
                    </linearGradient>
                  </defs>
                </svg>
                <div className="text-center">
                  <span className="text-2xl font-mono font-black text-amber-300 block leading-none">{(studentOverallGPA).toFixed(2)}</span>
                  <span className="text-[8px] font-bold text-emerald-200 block mt-1 uppercase tracking-wider">Hệ 4.0</span>
                </div>
              </div>
              
              <div className="text-left space-y-2">
                <div>
                  <span className="text-[10px] text-emerald-200 block font-bold uppercase tracking-wider">GPA Đạt Được</span>
                  <p className="text-lg font-mono font-black text-white leading-none">Xuất Sắc (A)</p>
                </div>
                <div className="border-t border-white/10 pt-1.5">
                  <span className="text-[10px] text-emerald-200 block font-bold uppercase tracking-wider">Tín chỉ Tích lũy</span>
                  <p className="text-sm font-mono font-bold text-white">{accumulatedCredits} / 120 T.C</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Interactive Timeline Schedule with Day selection */}
            <div className="bg-white p-5 rounded-2xl border shadow-sm lg:col-span-8 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Thời khóa biểu phòng LAB thực nghiệm</h4>
                    <p className="text-[10px] text-gray-400">Xem ca học học viên trong tuần được sắp xếp cố định</p>
                  </div>
                </div>

                {/* Day selector tabs */}
                <div className="flex flex-wrap gap-1 bg-slate-100 p-0.5 rounded-lg">
                  {[{ v: 0, l: 'Tất cả' }, { v: 2, l: 'T2' }, { v: 3, l: 'T3' }, { v: 4, l: 'T4' }, { v: 5, l: 'T5' }, { v: 6, l: 'T6' }].map(tab => (
                    <button
                      key={tab.v}
                      onClick={() => setScheduleDayFilter(tab.v)}
                      className={`text-[10px] font-bold px-2 py-1 rounded transition-all duration-150 ${
                        scheduleDayFilter === tab.v
                          ? 'bg-white text-emerald-700 shadow-xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {tab.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic list rendering */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {myCourses
                  .filter(c => {
                    if (scheduleDayFilter === 0) return true;
                    return c.schedule?.some(sched => sched.day === scheduleDayFilter);
                  })
                  .map(c => {
                    const matchedSched = c.schedule?.find(s => scheduleDayFilter === 0 || s.day === scheduleDayFilter) || c.schedule?.[0];
                    const dayLabels: Record<number, string> = { 2: 'Thứ Hai', 3: 'Thứ Ba', 4: 'Thứ Tư', 5: 'Thứ Năm', 6: 'Thứ Sáu' };
                    
                    return (
                      <div key={c.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100/80 hover:border-emerald-250 transition-all duration-200 hover:bg-emerald-50/20 group relative overflow-hidden flex flex-col justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono text-[9px] font-bold text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-full">{c.code}</span>
                            <span className="text-[10px] text-slate-400 font-bold">{dayLabels[matchedSched?.day || 2]}</span>
                          </div>
                          <span className="font-bold text-xs text-slate-800 block line-clamp-1 group-hover:text-emerald-700 transition duration-150 mt-1">{c.name}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium mt-3 pt-2.5 border-t border-slate-100">
                          <span className="flex items-center gap-1">📍 Phòng Bạ: <b>{matchedSched?.room || 'Lab-104'}</b></span>
                          <span className="text-amber-600 font-bold">⏱️ Ca {matchedSched?.slot || '1'} (07:30)</span>
                        </div>
                      </div>
                    );
                  })}
                {myCourses.filter(c => {
                  if (scheduleDayFilter === 0) return true;
                  return c.schedule?.some(sched => sched.day === scheduleDayFilter);
                }).length === 0 && (
                  <div className="sm:col-span-2 text-center py-8 bg-slate-50 rounded-xl text-xs text-gray-400 font-medium italic border border-dashed border-slate-200">
                    📭 Không có sự kiện lên lớp cố định phòng Lab vào ngày đã chọn.
                  </div>
                )}
              </div>
            </div>

            {/* Impending deadlines panel */}
            <div className="bg-white p-5 rounded-2xl border shadow-sm lg:col-span-4 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse shrink-0" />
                  Hạn nộp môn học khẩn cấp
                </h4>

                <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                  {pendingAssignments.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-400 font-medium italic space-y-1 block">
                      <p>✨ Hoàn thành tuyệt vời!</p>
                      <p className="text-[10px] text-gray-300">Không có bài tập thi đua quá hạn.</p>
                    </div>
                  ) : (
                    pendingAssignments.slice(0, 3).map(a => (
                      <div
                        key={a.id}
                        onClick={() => { setSelectedCourse(courses.find(cc => cc.id === a.courseId) || null); setCourseSubTab('assignments'); }}
                        className="p-3 rounded-xl bg-rose-50/50 hover:bg-rose-50 border border-rose-100 hover:border-rose-200 cursor-pointer transition-all text-xs space-y-1.5 block"
                      >
                        <span className="font-bold text-rose-900 block line-clamp-1">{a.title}</span>
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-rose-500">Mức: {a.maxScore} điểm tối đa</span>
                          <span className="text-gray-400 font-mono">Hạn: {new Date(a.dueDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Dynamic Honor Wall */}
              <div className="p-3 bg-gradient-to-tr from-amber-50 to-orange-50 border border-amber-200/60 rounded-xl space-y-2 mt-4 text-xs">
                <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                  <Award className="w-4 h-4 text-amber-500 animate-bounce" />
                  Bảng Vinh Danh Học Viện MCNA
                </div>
                <div className="space-y-1.5 text-[11px] text-amber-900/80">
                  <div className="flex items-center gap-1 font-bold">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    Danh hiệu: {studentOverallGPA >= 3.6 ? 'Thủ Khoa Đào Tạo' : studentOverallGPA >= 3.2 ? 'Sinh Viên Ưu Tú' : 'Học Viên Nghiêm Túc'}
                  </div>
                  <p className="text-[10px] text-amber-800 font-medium">Bảo trì thành công chuỗi GPA bền vững qua hệ tuyển chọn học phần tinh hoa.</p>
                </div>
              </div>
            </div>

          </div>

          {/* Interactive AI Course Elective advisor block */}
          <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3 gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Compass className="w-4 h-4 text-blue-700" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Cố vấn học thuật thông minh (AI Elective Advisor Simulator)</h4>
                  <p className="text-[10px] text-gray-400">Gợi ý lộ trình đăng ký lớp tự chọn dựa trên chuyên ngành định hướng mong muốn</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">Simulate AI Engine</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start text-xs">
              <div className="md:col-span-4 bg-slate-50 p-4 rounded-xl border space-y-3">
                <span className="font-bold text-gray-700 block text-[11px] uppercase">Chọn hướng nghiên cứu bạn quan tâm:</span>
                
                <div className="space-y-1.5">
                  {[
                    { v: 'AI', l: 'Trí Tuệ Nhân Tạo & Học Máy (AI/ML)' },
                    { v: 'SE', l: 'Kỹ Thuật Phần Mềm & Phân Tán (SE/SaaS)' },
                    { v: 'CS', l: 'Khoa Học Máy Tính Thuần Túy (Algorithms)' },
                    { v: 'SEC', l: 'Bảo mật Hệ Thống & CyberSecurity' }
                  ].map(option => (
                    <label key={option.v} className="flex items-center gap-2 p-2 hover:bg-white rounded border cursor-pointer transition">
                      <input
                        type="radio"
                        name="advisor_interest"
                        checked={advisorInterest === option.v}
                        onChange={() => setAdvisorInterest(option.v as any)}
                        className="accent-emerald-600 scale-105"
                      />
                      <span className="font-bold text-gray-700">{option.l}</span>
                    </label>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsAdvising(true);
                    setTimeout(() => {
                      setIsAdvising(false);
                      if (advisorInterest === 'AI') {
                        setAdvisorResult([
                          { name: 'Xử lý ngôn ngữ tự nhiên (NLP) & LLM Đại học', credits: 4, reason: 'Phù hợp với đam mê phát triển hệ thống AI hiện đại và mô hình ngôn ngữ lớn.' },
                          { name: 'Thị giác máy tính ứng dụng nâng cao', credits: 3, reason: 'Cung cấp kiến thức xử lý luồng camera giám sát và AI nhận diện khuôn mặt.' },
                          { name: 'Học máy & Phân tích hệ cơ sở dữ liệu lớn', credits: 4, reason: 'Nền tảng toán học thuật toán tối ưu hóa mô hình mạng nơ-ron sâu.' }
                        ]);
                      } else if (advisorInterest === 'SE') {
                        setAdvisorResult([
                          { name: 'Kiến trúc phần mềm & Mẫu thiết kế phân tán', credits: 4, reason: 'Phát triển kiến thức thiết kế hệ thống SaaS vi dịch vụ (Microservices).' },
                          { name: 'Kiểm thử phần mềm & Vận hành DevOps tích hợp', credits: 3, reason: 'Tự động hóa luồng CI/CD và viết kiểm thử tích hợp chất lượng cao.' },
                          { name: 'Thiết kế Trải nghiệm UI/UX tinh tế', credits: 3, reason: 'Tối ưu hóa hành vi người dùng và nâng tầm giao diện giao tác.' }
                        ]);
                      } else if (advisorInterest === 'CS') {
                        setAdvisorResult([
                          { name: 'Lý thuyết đồ thị & Thiết kế giải thuật tối ưu', credits: 4, reason: 'Phát triển tư duy phân tích độ phức tạp thuật toán và giải quyết bài toán khó.' },
                          { name: 'Trình biên dịch & Ngôn ngữ hình thức', credits: 3, reason: 'Đi sâu vào bản chất kiến trúc lõi của các ngôn ngữ lập trình.' }
                        ]);
                      } else {
                        setAdvisorResult([
                          { name: 'Mật mã học ứng dụng & An toàn thông tin mạng', credits: 3, reason: 'Học cách bẻ khóa bảo mật, mã hóa đối xứng và cơ sở hạ tầng khoá công khai PKI.' },
                          { name: 'Điều tra số phòng chống tội phạm mạng', credits: 4, reason: 'Pháp y kỹ thuật số và khôi phục vết dữ liệu bị tấn công.' }
                        ]);
                      }
                      toast('AI cố vấn đã lập bản đồ lộ trình học phần tự chọn cho bạn!', 'success');
                    }, 800);
                  }}
                  disabled={isAdvising}
                  className="w-full btn-primary py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  {isAdvising ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang xử lý phân tích môn...
                    </>
                  ) : (
                    <>
                      <Compass className="w-4 h-4" />
                      Yêu cầu Lên Lộ Trình Lớp Tự Chọn
                    </>
                  )}
                </button>
              </div>

              <div className="md:col-span-8 space-y-3">
                <span className="font-bold text-gray-500 block text-[10px] uppercase tracking-wider">Đề xuất lộ trình tích lũy học kỳ lý tưởng:</span>
                
                {advisorResult.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-dashed rounded-xl italic text-gray-400 font-medium">
                    🔍 Hãy nhấn nút &ldquo;Yêu cầu Lên Lộ Trình Lớp Tự Chọn&rdquo; để chạy máy học giả lập phân tích.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {advisorResult.map((res, index) => (
                      <div key={index} className="p-3 bg-blue-50/30 border border-blue-100 rounded-xl space-y-1 relative animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-900 border-b border-blue-200 text-xs">{res.name}</span>
                          <span className="text-[10px] font-bold text-blue-600 bg-white border border-blue-200 px-2 py-0.5 rounded-full">{res.credits} Tín Chỉ</span>
                        </div>
                        <p className="text-[11px] text-gray-650 leading-relaxed pt-1">{res.reason}</p>
                      </div>
                    ))}
                    <span className="text-[10px] italic text-gray-400 block pt-1">💡 Mách nhỏ: Bạn có thể liên hệ Phòng Đào Tạo để hoàn thành nộp đơn ghi danh lớp tự chọn trực tuyến ngay khi có thời gian thích hợp.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* 2. ENROLLED COURSES CARDS VIEW */}
      {/* ========================================================= */}
      {!selectedCourse && activeTab === 'courses' && (
        <div className="space-y-4 animate-fadeIn">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Lớp học phần đang đăng bạ</span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {myCourses.map(c => (
              <div
                key={c.id}
                onClick={() => { setSelectedCourse(c); setCourseSubTab('overview'); }}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition duration-150 cursor-pointer flex flex-col justify-between"
              >
                <div className={`p-4 ${c.thumbnailColor || 'bg-emerald-600'} text-white`}>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono text-white/75">{c.code}</span>
                    <span className="text-2xl">{c.thumbnailEmoji}</span>
                  </div>
                  <h4 className="font-black text-sm line-clamp-2 mt-2 leading-snug">{c.name}</h4>
                </div>

                <div className="p-4 space-y-2 text-xs text-gray-500">
                  <div className="flex justify-between border-b pb-1">
                    <span>Số tín chỉ:</span>
                    <span className="font-bold text-gray-800">{c.credits}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span>Giảng viên:</span>
                    <span className="font-bold text-gray-850 truncate max-w-[120px]">{c.teacherName || 'ThS. Trần Thị Hồng'}</span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>Học liệu đã xem:</span>
                      <span>85%</span>
                    </div>
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border-t flex justify-between items-center text-xs font-bold text-emerald-600">
                  <span>Mở thư viện lớp</span>
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2.1 COURSE DETAIL DISPLAY WITH SUBTAB FOR STUDENTS */}
      {/* ========================================================= */}
      {selectedCourse && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="bg-white rounded-xl p-5 border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 bg-slate-50 rounded-xl">{selectedCourse.thumbnailEmoji}</span>
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">{selectedCourse.code}</span>
                <h3 className="text-lg font-black text-gray-950 mt-1">{selectedCourse.name}</h3>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg">
              {(['overview', 'materials', 'assignments', 'grades'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setCourseSubTab(tab)}
                  className={`px-3 py-1.5 rounded text-xs font-bold capitalize transition ${
                    courseSubTab === tab ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab === 'overview' ? 'Tổng quan' :
                   tab === 'materials' ? 'Slide học liệu' :
                   tab === 'assignments' ? 'Nộp bài tập' : 'Bản điểm thi'}
                </button>
              ))}
            </div>
          </div>

          {courseSubTab === 'overview' && (
            <div className="bg-white rounded-xl border p-5 shadow-sm space-y-4 animate-fadeIn">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Nội dung học phần</h4>
              <p className="text-xs text-gray-600 leading-relaxed leading-relaxed">{selectedCourse.description}</p>
              
              <div className="p-3 bg-slate-50 border rounded-lg text-xs space-y-1">
                <span className="font-bold text-gray-800 block">Giảng viên giảng dạy: ThS. {selectedCourse.teacherName || 'Trần Thị Hồng'}</span>
                <span className="text-[10px] text-gray-400 block font-normal">Mọi bài tập nộp sẽ được giảng viên xem duyệt và đánh giá trực tiếp.</span>
              </div>
            </div>
          )}

          {courseSubTab === 'materials' && (
            <div className="bg-white rounded-xl border p-5 shadow-sm space-y-3 animate-fadeIn">
              <h4 className="text-xs font-bold text-gray-450 uppercase border-b pb-2 tracking-wider inline-block">Thư viện slide & file sách giáo trình chuyên đề</h4>
              
              <div className="space-y-2.5">
                {[1, 2, 3].map(item => (
                  <div key={item} className="p-3 rounded-lg border bg-slate-50 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-gray-800">Slide lý thuyết & thiết kế thực nghiệm Chương {item}</span>
                    </div>
                    <button
                      onClick={() => toast('Đang chuẩn bị tải tài nguyên giáo học...', 'success')}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Tải slide (.pdf)
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {courseSubTab === 'assignments' && (
            <div className="space-y-4 animate-fadeIn">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Yêu cầu nộp bài học phần</span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignments
                  .filter(a => a.courseId === selectedCourse.id)
                  .map(a => {
                    const mySub = a.submissions.find(s => s.studentId === currentUser.id);
                    return (
                      <div key={a.id} className="bg-white rounded-xl p-4 border shadow-xs space-y-3.5 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 py-0.5 px-2 rounded font-bold uppercase">Mức {a.maxScore} điểm</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              mySub ? 'bg-green-150 text-green bg-green-50' : 'bg-red-50 text-red'
                            }`}>
                              {mySub ? 'Đã nộp bài' : 'Chưa nộp bài'}
                            </span>
                          </div>
                          
                          <h4 className="font-bold text-xs text-slate-800 mt-2">{a.title}</h4>
                          <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">{a.instructions}</p>
                        </div>

                        {mySub && (
                          <div className="p-3 bg-slate-50 rounded-lg border space-y-2 text-[11px] tracking-wide text-gray-500">
                            <span className="font-bold text-emerald-800 block text-[10px] uppercase">Lịch sử bài làm đã gửi:</span>
                            <span className="font-mono block">📂 File: {mySub.fileName}</span>
                            <span className="italic block">&ldquo;{mySub.notes}&rdquo;</span>
                            
                            {mySub.grade !== undefined ? (
                              <div className="border-t pt-2 mt-2 space-y-1">
                                <span className="font-black text-emerald-600 block text-xs">Điểm đạt: {mySub.grade} / {a.maxScore}</span>
                                <span className="text-gray-600 italic block">Phản hồi Thầy cô: &ldquo;{mySub.feedback}&rdquo;</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-bold block bg-gray-100/70 p-1 rounded-sm text-center">⏳ Đang đợi hội đồng Thầy cô chấm chéo...</span>
                            )}
                          </div>
                        )}

                        {!mySub && (
                          <div className="border-t pt-3 flex justify-end">
                            <button
                              onClick={() => handleTriggerSubmitModal(a)}
                              className="btn-primary py-1.5 px-4 rounded-lg text-xs font-bold"
                            >
                              Giao bài nộp ngay
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {courseSubTab === 'grades' && (
            <div className="bg-white rounded-xl border p-5 shadow-sm space-y-4 animate-fadeIn">
              <h4 className="text-xs font-bold tracking-wider uppercase text-gray-800">Bảng điều phối điểm chi tiết</h4>

              <div className="table-wrapper">
                <table className="lms-table text-left">
                  <thead>
                    <tr>
                      <th>Điểm thành phần</th>
                      <th>Hệ số (%)</th>
                      <th className="text-right">Điểm số đạt được</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentGrades
                      .filter(g => g.courseId === selectedCourse.id)
                      .map(g => (
                        <g key={g.id}>
                          <tr>
                            <td>Chuyên cần đi tắt</td>
                            <td>10%</td>
                            <td className="text-right font-mono font-bold">{g.attendance}%</td>
                          </tr>
                          <tr>
                            <td>Nộp bài tập trung bình</td>
                            <td>20%</td>
                            <td className="text-right font-mono font-bold">{g.assignments_avg}</td>
                          </tr>
                          <tr>
                            <td>Thi Giữa kỳ</td>
                            <td>30%</td>
                            <td className="text-right font-mono font-bold">{g.midterm}</td>
                          </tr>
                          <tr>
                            <td>Thi Cuối kỳ (CK)</td>
                            <td>40%</td>
                            <td className="text-right font-mono font-bold text-purple-600">{g.final}</td>
                          </tr>
                          <tr className="bg-indigo-50/20">
                            <td className="font-black text-gray-900">Điểm tổng kết</td>
                            <td className="font-bold">Hệ 10</td>
                            <td className="text-right font-mono font-black text-indigo-700">
                              {resolveLetterAndGpa4(g).score10}
                            </td>
                          </tr>
                        </g>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================= */}
      {/* 3. GRADES CALCULATION & HYPOTHETICAL GPA PROJECTOR */}
      {/* ========================================================= */}
      {!selectedCourse && activeTab === 'grades' && (
        <div className="bg-white p-5 sm:p-6 rounded-xl border shadow-sm space-y-6 animate-fadeIn">
          
          <div className="flex flex-col sm:flex-row items-center justify-between border-b pb-4 gap-4">
            <div>
              <h4 className="text-sm font-black text-gray-900">Tính năng Dự phóng học tập GPAs (Hypothetical Projector Tool)</h4>
              <p className="text-xs text-gray-400 mt-1">Sử dụng thanh kéo kéo giả lập điểm thi cuối kỳ (CK) dưới đây để thấy sự biến động dự phóng của điểm chữ và GPA toàn khóa.</p>
            </div>

            <button
              onClick={handleExportTranscript}
              className="btn-secondary px-4 py-2 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-1 shrink-0"
            >
              <Download className="w-4 h-4" />
              Tải Học bạ điện tử (PDF)
            </button>
          </div>

          <div className="space-y-6">
            {studentGrades.map(g => {
              const currentHypotheticalFinal = hypotheticalFinalGrades[g.courseId] !== undefined ? hypotheticalFinalGrades[g.courseId] : g.final;
              const computed = resolveLetterAndGpa4(g, currentHypotheticalFinal);

              return (
                <div key={g.id} className="p-4 rounded-xl border bg-slate-50/50 space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-1 border-b pb-2">
                    <span className="font-black text-gray-800 tracking-tight leading-snug uppercase">{g.courseName}</span>
                    <span className="font-mono text-[10px] text-gray-400 bg-white border px-2 py-0.5 rounded-full">{g.courseId}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                    <div className="bg-white p-2.5 rounded border">
                      <span className="text-[10px] text-gray-400 block uppercase">Chuyên cần</span>
                      <span className="font-bold text-gray-700 block mt-1">{g.attendance}%</span>
                    </div>
                    <div className="bg-white p-2.5 rounded border">
                      <span className="text-[10px] text-gray-400 block uppercase">B.Tập TB</span>
                      <span className="font-bold text-gray-700 block mt-1">{g.assignments_avg}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded border">
                      <span className="text-[10px] text-gray-400 block uppercase">Giữa Kỳ</span>
                      <span className="font-bold text-gray-700 block mt-1">{g.midterm}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded border bg-purple-50/30 border-purple-100">
                      <span className="text-[10px] text-purple-600 block uppercase font-bold">Cuối kỳ (Giả lập)</span>
                      <span className="font-black text-purple-700 block mt-1">{currentHypotheticalFinal.toFixed(1)} / 10.0</span>
                    </div>
                  </div>

                  {/* PROJECTION SLIDER BLOCK */}
                  <div className="flex items-center gap-4 py-1">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Giả lập Cuối Kỳ:</span>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      value={currentHypotheticalFinal}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setHypotheticalFinalGrades(prev => ({ ...prev, [g.courseId]: val }));
                      }}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer outline-none accent-emerald-600"
                    />
                  </div>

                  {/* RESULT BOX */}
                  <div className="p-3 bg-white rounded-lg border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Tổng kết dự phóng:</span>
                      <span className="font-mono font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-xs">{computed.score10}đ</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Điểm Chữ:</span>
                      <span className="font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded text-xs uppercase">Điểm {computed.letter}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Hệ 4:</span>
                      <span className="font-mono font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs">{computed.gpa4.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* 4. FINANCIAL LEDGER & SCHOLARSHIP PORTAL */}
      {/* ========================================================= */}
      {!selectedCourse && activeTab === 'finance' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Detailed Financial Stats for Student */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/30 p-4 rounded-2xl border border-indigo-100 shadow-xs relative">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dư Nợ Học Phí / Công Nợ Hiện Tại</span>
              <span className="text-xl font-mono font-black text-rose-600 block mt-1">
                {transactions
                  .filter(tx => (tx.studentId === currentUser.id || tx.studentCode === currentUser.studentId) && tx.status === 'unpaid')
                  .reduce((sum, current) => sum + current.amount, 0)
                  .toLocaleString('vi-VN')} đ
              </span>
              <span className="text-[9px] text-slate-450 block mt-1">
                {transactions.filter(tx => (tx.studentId === currentUser.id || tx.studentCode === currentUser.studentId) && tx.status === 'unpaid').length} hoá đơn chưa quyết toán
              </span>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/30 p-4 rounded-2xl border border-emerald-100 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Học Phí Đã Hoàn Tất (Thực Thu)</span>
              <span className="text-xl font-mono font-black text-emerald-700 block mt-1">
                {transactions
                  .filter(tx => (tx.studentId === currentUser.id || tx.studentCode === currentUser.studentId) && tx.status === 'paid' && tx.type === 'tuition')
                  .reduce((sum, current) => sum + current.amount, 0)
                  .toLocaleString('vi-VN')} đ
              </span>
              <span className="text-[9px] text-slate-450 block mt-1">
                {transactions.filter(tx => (tx.studentId === currentUser.id || tx.studentCode === currentUser.studentId) && tx.status === 'paid' && tx.type === 'tuition').length} biên lai đóng học thành công
              </span>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100/30 p-4 rounded-2xl border border-purple-100 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Học Bổng Vinh Danh Đã Nhận</span>
              <span className="text-xl font-mono font-black text-purple-700 block mt-1">
                {transactions
                  .filter(tx => (tx.studentId === currentUser.id || tx.studentCode === currentUser.studentId) && tx.status === 'paid' && tx.type === 'scholarship')
                  .reduce((sum, current) => sum + current.amount, 0)
                  .toLocaleString('vi-VN')} đ
              </span>
              <span className="text-[9px] text-slate-455 block mt-0.5">
                Vinh danh sinh viên tinh anh MCNA nâng bạ tài năng
              </span>
            </div>

          </div>

          {/* Overdue Debt Notice Alert Callout */}
          {transactions.some(tx => (tx.studentId === currentUser.id || tx.studentCode === currentUser.studentId) && tx.status === 'unpaid') && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 p-4 rounded-2xl flex items-start gap-3 shadow-xs">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5 animate-pulse" />
              <div className="text-xs text-rose-950 space-y-1">
                <span className="font-extrabold uppercase tracking-wider block text-[10px] text-red-750">⚠️ THỜI HẠN HOÀN THÀNH NGHĨA VỤ ĐÓNG HỌC PHÍ & CÔNG NỢ QUÁ HẠN</span>
                <p className="leading-relaxed">
                  Hệ thống kiểm toán tự động ghi nhận bạ của học phần của bạn hiện có dư nợ chưa giải tỏa. Bạn vui lòng thanh toán hoặc gửi đính kèm file ảnh chuyển khoản ngân hàng bên phải để Cán bộ Khảo thí đối soát và duyệt trực tuyến bạ thi cử kịp thời.
                </p>
                <div className="pt-1 flex gap-2">
                  <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-mono text-[9px] font-bold">
                    Tình Trạng: Chờ giải tỏa công nợ nộp tín chỉ
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Account Summary */}
            <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                <Compass className="w-4 h-4 text-emerald-600" />
                Thông tin Tài khoản Thu Học Phí MCNA
              </h4>
              
              <div className="space-y-3.5 text-xs text-gray-700">
                <div className="p-3 bg-slate-50 rounded-xl border space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold block">NGÂN HÀNG THỤ HƯỞNG:</span>
                  <span className="font-extrabold text-slate-800 block text-xs">Văn phòng Tài chính Đào tạo MCNA (BIDV Chi nhánh Hà Nội)</span>
                </div>
                
                <div className="p-3 bg-slate-50 rounded-xl border space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold block">SỐ TÀI KHOẢN:</span>
                  <span className="font-mono font-black text-emerald-700 block text-sm select-all">1201000678999</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold block">CÚ PHÁP CHUYỂN KHOẢN HỌC PHÍ MẪU:</span>
                  <span className="font-mono font-bold text-slate-800 block text-xs select-all">HP {currentUser.studentId} [Mã_Học_Phần]</span>
                </div>
              </div>

              {/* Visual simulated QR code box */}
              <div className="p-4 bg-emerald-50/30 rounded-2xl border border-dashed border-emerald-200 text-center space-y-2">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest block font-sans">MÃ QR QUÉT NHANH</span>
                <div className="w-28 h-28 mx-auto bg-white border p-2 rounded-lg shadow-xs flex items-center justify-center relative overflow-hidden group">
                  {/* CSS Simulated QR Code Grid */}
                  <div className="grid grid-cols-5 gap-1.5 w-full h-full opacity-70">
                    {[1,2,3,4,0,3,1,2,4,4,0,2,3,1,0,3,2,0,1,1,2,2,4,0,3].map((v, i) => (
                      <div key={i} className={`rounded-xs ${v % 2 === 0 ? 'bg-slate-800' : 'bg-transparent'}`} />
                    ))}
                  </div>
                  <div className="absolute inset-0 bg-emerald-600/10 flex items-center justify-center p-2 text-center">
                    <span className="bg-emerald-950 text-white font-mono font-bold py-0.5 px-2 rounded -rotate-12 text-[10px] shadow-md">MCNA QR</span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400">Quét qua bất kỳ ứng dụng ngân hàng di động nào được ngân hàng nhà nước bảo lãnh.</p>
              </div>

              {/* Installment Assistance Counsel Card */}
              <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100 flex gap-2.5 text-xs">
                <HelpCircle className="w-5 h-5 text-indigo-505 shrink-0 mt-0.5" />
                <div className="space-y-1 text-indigo-950">
                  <span className="font-extrabold uppercase text-[9px] text-indigo-800 block">Bạn cần gia hạn học phí?</span>
                  <p className="text-[11px] text-gray-500 leading-relaxed font-normal">
                    Học viên khó khăn kinh tế có thể nộp đề xuất xin chia nhỏ mức đóng thành nhiều đợt. Hãy đến trực tiếp ban quản lý đào tạo sớm.
                  </p>
                </div>
              </div>

            </div>

            {/* Right Bills list & Scholarship applications block */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Financial Bills Ledger */}
              <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <div>
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Hóa đơn học phí cá nhân của bạn</h4>
                    <p className="text-[11px] text-gray-400">Danh học các khoản phí học phần gán tương ứng</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Kỳ mới nhất</span>
                </div>

                <div className="space-y-3">
                  {transactions
                    .filter(tx => tx.studentId === currentUser.id || tx.studentCode === currentUser.studentId)
                    .map((tx) => (
                      <div key={tx.id} className="p-4 border rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-emerald-205 transition">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[13px] text-gray-800">{tx.type === 'tuition' ? 'Học phí chuyên ngành chuyên sâu' : 'Học bổng vinh danh MCNA'}</span>
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              tx.status === 'paid' ? 'bg-emerald-100 text-emerald-850' :
                              tx.status === 'pending_approval' ? 'bg-amber-100 text-amber-850' :
                              'bg-rose-100 text-rose-850'
                            }`}>
                              {tx.status === 'paid' ? 'Đã thanh toán' : tx.status === 'pending_approval' ? 'Chờ kiểm duyệt' : 'Chưa thu phí'}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-[10px] text-gray-450 font-bold">
                            <span>Mã hoá đơn: <b className="font-mono text-slate-800">{tx.id}</b></span>
                            <span>Kỳ học: <b className="text-slate-800">{tx.schoolYear}</b></span>
                            {tx.paidDate && <span>Ngày trả: <b className="text-slate-800">{new Date(tx.paidDate).toLocaleDateString('vi-VN')}</b></span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                          <span className="font-mono font-black text-slate-800">{tx.amount.toLocaleString('vi-VN')} đ</span>
                          
                          {tx.status === 'unpaid' && (
                            <button
                              onClick={() => {
                                setSelectedTxForPayment(tx);
                              }}
                              className="btn-primary py-1.5 px-3.5 rounded-lg text-xs font-bold shrink-0"
                            >
                              Thanh toán ngay
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  
                  {transactions.filter(tx => tx.studentId === currentUser.id || tx.studentCode === currentUser.studentId).length === 0 && (
                    <div className="text-center py-8 text-xs text-gray-400 italic">
                      📭 Hồ sơ hiện không ghi nhận hóa đơn học bạ phát sinh nào đối chiếu.
                    </div>
                  )}
                </div>
              </div>

              {/* Scholarship Application Center */}
              <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                <div className="border-b pb-3">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="text-amber-500 w-4 h-4" />
                    Đăng Ký Đệ Đơn Học Bổng Khuyến Học (Scholarship Application Desk)
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-1">Nộp hồ sơ ứng tuyển học bổng tinh hoa MCNA dựa trên điểm GPA tích lũy hiện có</p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (studentOverallGPA < 3.2) {
                      toast('Yêu cầu tối thiểu GPA ứng tuyển học bổng là 3.20!', 'warn');
                      return;
                    }
                    setIsScholarshipSubmitting(true);
                    setTimeout(() => {
                      setIsScholarshipSubmitting(false);
                      const applySchol: Transaction = {
                        id: `tx-${Date.now()}`,
                        studentId: currentUser.id,
                        studentCode: currentUser.studentId,
                        studentName: currentUser.name,
                        amount: 3000000,
                        type: 'scholarship',
                        status: 'pending_approval',
                        schoolYear: 'Học kỳ tự đề xuất học bổng tinh hoa',
                        billDate: new Date().toISOString(),
                        dueDate: ''
                      };
                      onUpdateTransactions([...transactions, applySchol]);
                      onAddAuditLog('Submitted a scholarship request application', `GPA: ${studentOverallGPA.toFixed(2)}`);
                      toast('Đệ đơn học bổng thành công! Hãy chờ Cán bộ văn phòng Đào tạo (Manager) xét duyệt.', 'success');
                    }, 1000);
                  }}
                  className="space-y-4 text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 font-bold uppercase text-[9px]">Điểm GPA Đối Chiếu:</label>
                      <input
                        type="text"
                        disabled
                        value={`${studentOverallGPA.toFixed(2)} (Hệ 4.0)`}
                        className="mt-1 w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-mono font-bold text-emerald-700 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 font-bold uppercase text-[9px]">Mức học bổng đề xuất kỳ học:</label>
                      <input
                        type="text"
                        disabled
                        value="3,000,000 đ (Kỳ này)"
                        className="mt-1 w-full bg-slate-100 border border-slate-100 rounded-lg px-3 py-2 text-xs font-mono font-bold text-indigo-700 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-500 font-bold text-[10px] mb-1">TRÌNH BÀY LÝ DO, HOÀN CẢNH HOẶC THÀNH TỰU NGHIÊN CỨU:</label>
                    <textarea
                      value={scholReason}
                      onChange={(e) => setScholReason(e.target.value)}
                      rows={3}
                      className="w-full bg-gray-50 border rounded-lg p-2.5 outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isScholarshipSubmitting || studentOverallGPA < 3.2}
                    className="btn-primary py-2 px-6 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isScholarshipSubmitting ? 'Đang gửi hồ sơ ứng tuyển...' : 'Đệ trình Đơn học bổng khuyến học'}
                  </button>
                  {studentOverallGPA < 3.2 && (
                    <span className="text-[10px] text-rose-500 block font-bold mt-1">⚠️ Điểm GPA tích lũy của bạn chưa đạt yêu cầu ứng tuyển học bổng tinh hoa (Tối thiểu 3.20).</span>
                  )}
                </form>
              </div>

            </div>

          </div>

          {/* SIMULATED PAYMENT DIALOG / SLIDE-OVER MODAL */}
          {selectedTxForPayment && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-2xl border max-w-md w-full p-6 animate-fadeIn space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="text-sm font-black text-gray-900">Thanh toán hóa đơn học phí trực tuyến</h4>
                  <button
                    onClick={() => setSelectedTxForPayment(null)}
                    className="text-gray-400 hover:text-gray-650 font-bold text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3.5 text-xs text-slate-700">
                  <div className="flex items-center justify-between">
                    <span>Mã hóa đơn:</span>
                    <span className="font-mono font-bold">{selectedTxForPayment.id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Học phần / Kỳ hạn:</span>
                    <span className="font-bold">{selectedTxForPayment.schoolYear}</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-2.5">
                    <span>Tổng tiền học phí:</span>
                    <span className="font-mono font-black text-sm text-emerald-600">{selectedTxForPayment.amount.toLocaleString('vi-VN')} đ</span>
                  </div>

                  {/* Payment portals choice */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1.5">Chọn Cổng Thanh Toán bảo mật:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { v: 'banking', l: 'BIDV Banking QR' },
                        { v: 'vnpay', l: 'Cổng VNPAY Smart' },
                        { v: 'momo', l: 'Ví điện tử Momo' }
                      ].map((method) => (
                        <label
                          key={method.v}
                          className={`p-2 rounded-xl border text-center cursor-pointer block transition ${
                            paymentMethod === method.v
                              ? 'border-emerald-500 bg-emerald-50/50 text-emerald-850 font-bold'
                              : 'bg-white text-gray-500 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment_method_choice"
                            checked={paymentMethod === method.v}
                            onChange={() => setPaymentMethod(method.v as any)}
                            className="sr-only"
                          />
                          <span className="text-[10px] block">{method.l}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Drag-and-drop or Manual Choose file simulator */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-gray-300 text-center space-y-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">Minh chứng / Ảnh chụp biên lai giao dịch</span>
                    <div className="flex flex-col items-center justify-center p-1 cursor-pointer hover:bg-slate-100 rounded transition border border-transparent">
                      <Download className="w-5 h-5 text-gray-400 stroke-1 rotate-180" />
                      <span className="text-[10px] font-bold text-gray-600 mt-1 block">Kéo thả ảnh biên lai vào đây hoặc nhấp chọn file</span>
                      <span className="text-[9px] text-gray-400 block mt-0.5">Hỗ trợ JPG, PNG, PDF tối đa 4MB</span>
                    </div>
                    {/* Simulated uploaded file indicators */}
                    <div className="py-1 px-3 bg-white border border-slate-150 rounded text-[10px] text-emerald-700 font-bold inline-flex items-center gap-1">
                      📄 MCNA_Receipt_Bill_HP_Success.pdf (1.2 MB)
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setSelectedTxForPayment(null)}
                    className="btn-secondary py-1.5 px-4 rounded-lg text-xs font-bold"
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPaying(true);
                      setTimeout(() => {
                        setIsPaying(false);
                        const updatedTxs = transactions.map(item => {
                          if (item.id === selectedTxForPayment.id) {
                            return {
                              ...item,
                              status: 'pending_approval' as const
                            };
                          }
                          return item;
                        });
                        onUpdateTransactions(updatedTxs);
                        setSelectedTxForPayment(null);
                        onAddAuditLog('Submitted a tuition mock payment receipt', `Bill: ${selectedTxForPayment.id}`);
                        toast('Đã nộp thành công ảnh chụp biên lai học phí! Đang chờ phòng đào tạo kiểm duyệt đối chiếu.', 'success');
                      }, 1000);
                    }}
                    disabled={isPaying}
                    className="btn-primary py-1.5 px-5 rounded-lg text-xs font-bold"
                  >
                    {isPaying ? 'Đang gửi giao thức...' : 'Xác thực Đã Chuyển Khoản'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================= */}
      {/* 5. STUDENT DETAILED PROFILE & ACADEMIC CONFIG */}
      {/* ========================================================= */}
      {!selectedCourse && activeTab === 'profile' && (
        <div className="bg-white rounded-xl border shadow-sm p-5 sm:p-6 animate-fadeIn">
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Profile Avatar Left Side */}
            <div className="flex flex-col items-center justify-start text-center border-r pr-4">
              <div className={`w-20 h-20 rounded-full ${currentUser.avatarColor || 'bg-emerald-600'} text-white flex items-center justify-center text-2xl font-black shadow-md relative group cursor-pointer`}>
                {currentUser.avatarInitials}
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] font-bold text-white transition">Đổi ảnh</div>
              </div>
              <h4 className="font-black text-sm text-gray-900 mt-3">{currentUser.name}</h4>
              <span className="inline-block px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold uppercase text-[9px] tracking-wider mt-1.5">{currentUser.role}</span>
              <p className="text-[10px] text-gray-400 mt-2 font-mono">{currentUser.email}</p>

              {/* Subtabs of details */}
              <div className="flex flex-col gap-1 w-full mt-6 text-left">
                <button
                  onClick={() => setProfileTab('personal')}
                  className={`text-xs font-bold p-2.5 rounded-lg transition ${
                    profileTab === 'personal' ? 'bg-emerald-50 text-emerald-800' : 'text-gray-500 hover:bg-slate-50'
                  }`}
                >
                  Thông tin cơ bản
                </button>
                <button
                  onClick={() => setProfileTab('academic')}
                  className={`text-xs font-bold p-2.5 rounded-lg transition ${
                    profileTab === 'academic' ? 'bg-emerald-50 text-emerald-800' : 'text-gray-500 hover:bg-slate-50'
                  }`}
                >
                  Khung Học vụ
                </button>
                <button
                  onClick={() => setProfileTab('security')}
                  className={`text-xs font-bold p-2.5 rounded-lg transition ${
                    profileTab === 'security' ? 'bg-emerald-50 text-emerald-800' : 'text-gray-500 hover:bg-slate-50'
                  }`}
                >
                  Thay Đổi mật khẩu
                </button>
                <button
                  onClick={() => setProfileTab('notifications')}
                  className={`text-xs font-bold p-2.5 rounded-lg transition ${
                    profileTab === 'notifications' ? 'bg-emerald-50 text-emerald-800' : 'text-gray-500 hover:bg-slate-50'
                  }`}
                >
                  Nhận Thông Báo
                </button>
              </div>
            </div>

            {/* Profile Forms Right Panel */}
            <div className="lg:col-span-3 min-h-[300px]">
              
              {profileTab === 'personal' && (
                <form onSubmit={handleSaveProfile} className="space-y-4 animate-fadeIn text-xs">
                  <h5 className="text-sm font-bold text-gray-800 border-b pb-2 mb-4">Thông tin lý lịch học viên</h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Số điện thoại liên lạc</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="mt-1 w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider font-bold">Giới Tính</label>
                      <select
                        value={editGender}
                        onChange={(e) => setEditGender(e.target.value)}
                        className="mt-1 w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs cursor-pointer outline-none"
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider font-bold">Ngày tháng năm sinh</label>
                      <input
                        type="date"
                        value={editDob}
                        onChange={(e) => setEditDob(e.target.value)}
                        className="mt-1 w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs cursor-pointer outline-none"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-divider font-bold">Mô tả trích yếu bản thân (Bio)</label>
                      <textarea
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        rows={3}
                        className="mt-1 w-full bg-gray-50 border rounded-lg p-3 text-xs outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary py-2 px-4 rounded-lg text-xs font-bold"
                  >
                    Lưu cập nhật
                  </button>
                </form>
              )}

              {profileTab === 'academic' && (
                <div className="space-y-4 animate-fadeIn text-xs">
                  <h5 className="text-sm font-bold text-gray-800 border-b pb-2 mb-4">Thông tin khung đào tạo niên khoá</h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-slate-50 border rounded-lg">
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Chuyên ngành chính quy</span>
                      <span className="font-bold text-slate-800 block mt-1">{currentUser.major || 'Kỹ thuật Phần mềm'}</span>
                    </div>
                    <div className="p-3 bg-slate-50 border rounded-lg">
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Mã số sinh viên (MSSV)</span>
                      <span className="font-mono font-bold text-slate-800 block mt-1">{currentUser.studentId}</span>
                    </div>
                    <div className="p-3 bg-slate-50 border rounded-lg">
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Tình trạng ghi danh</span>
                      <span className="font-bold text-emerald-600 block mt-1 flex items-center gap-1.5 leading-none">
                        <UserCheck className="w-4 h-4" />
                        Đang học cố định chính thức
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 border rounded-lg">
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Phương thức tuyển sinh</span>
                      <span className="font-bold text-slate-800 block mt-1">Thi tuyển quốc gia kết hợp phỏng vấn năng khiếu</span>
                    </div>
                  </div>
                </div>
              )}

              {profileTab === 'security' && (
                <form onSubmit={handleChangePasswordSubmit} className="space-y-4 animate-fadeIn text-xs">
                  <h5 className="text-sm font-bold text-gray-800 border-b pb-2 mb-4 font-bold">Đổi mật khẩu bảo mật</h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-divider font-bold">Nhập Mật khẩu hiện tại</label>
                      <input
                        type="password"
                        value={currentPass}
                        onChange={(e) => setCurrentPass(e.target.value)}
                        className="mt-1 w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-divider font-bold">Mật khẩu mới bảo vệ</label>
                      <input
                        type="password"
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        className="mt-1 w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest font-bold">Xác nhận mật khẩu mới</label>
                      <input
                        type="password"
                        value={confirmPass}
                        onChange={(e) => setConfirmPass(e.target.value)}
                        className="mt-1 w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs outline-none"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary py-2 px-5 rounded-lg text-xs font-bold"
                  >
                    Xác nhận đổi mật mật
                  </button>
                </form>
              )}

              {profileTab === 'notifications' && (
                <div className="space-y-4 animate-fadeIn text-xs">
                  <h5 className="text-sm font-bold text-gray-800 border-b pb-2 mb-4 font-bold">Cấu hình kênh nhận thông báo học viện</h5>
                  
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg flex items-center justify-between bg-slate-50/50">
                      <div>
                        <span className="font-bold block text-gray-800">Thông báo bằng email trường</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">Thời khoá biểu, điểm thi học kỳ và các biên lai học phí liên quan.</span>
                      </div>
                      <label className="toggle-switch">
                        <input type="checkbox" checked={notifEmail} onChange={(e) => setNotifEmail(e.target.checked)} />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="p-3 border rounded-lg flex items-center justify-between bg-slate-50/50">
                      <div>
                        <span className="font-bold block text-gray-800">Gửi Tin nhắn SMS khẩn cấp</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">Sự cố phòng lab, hoãn ca học khẩn từ phòng đào tạo.</span>
                      </div>
                      <label className="toggle-switch">
                        <input type="checkbox" checked={notifSms} onChange={(e) => setNotifSms(e.target.checked)} />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="p-3 border rounded-lg flex items-center justify-between bg-slate-50/50">
                      <div>
                        <span className="font-bold block text-gray-800">Liên kết nhận tin Bot Telegram</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">Thông tin nhắc nộp bài tập hàng tuần tự động.</span>
                      </div>
                      <label className="toggle-switch">
                        <input type="checkbox" checked={notifTelegram} onChange={(e) => setNotifTelegram(e.target.checked)} />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* 5. OVERLAY MODAL TO CONFIRM HOMEWORK SUBMISSION */}
      {/* ========================================================= */}
      {isSubmitConfirmOpen && selectedAssignment && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-sm w-full p-5 sm:p-6">
            <h4 className="text-sm font-black text-gray-900 border-b pb-2 mb-4">Xác nhận nộp bài học phần</h4>
            
            <form onSubmit={handleConfirmHomeWorkSubmit} className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] text-gray-400 font-bold block">Bài tập gán chỉ định:</span>
                <span className="font-bold text-gray-800 text-xs mt-1 block">{selectedAssignment.title}</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Tên tập tin lưu mã nguồn / Tài liệu</label>
                <input
                  type="text"
                  value={submitFileName}
                  onChange={(e) => setSubmitFileName(e.target.value)}
                  placeholder="baitap.zip"
                  className="mt-1 w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs font-mono outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Ghi chú, lời nhắn gửi Giảng viên</label>
                <textarea
                  value={submitNotes}
                  onChange={(e) => setSubmitNotes(e.target.value)}
                  placeholder="Thưa Thầy Cô, nhóm em hoàn thiện và đóng gói mã nguồn đầy đủ..."
                  rows={3}
                  className="mt-1 w-full bg-gray-50 border rounded-lg p-2 text-xs outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setIsSubmitConfirmOpen(false)}
                  className="btn-secondary py-1.5 px-3.5 rounded-lg text-xs font-bold"
                >
                  Đóng quay lại
                </button>
                <button
                  type="submit"
                  className="btn-primary py-1.5 px-4 rounded-lg text-xs font-bold"
                >
                  Xác nhận Nộp Bài
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
