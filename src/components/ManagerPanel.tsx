import React, { useState, useMemo } from 'react';
import { User, Course, Transaction, ClassSlot, Notification } from '../types';
import { SvgBarChart } from './SvgCharts';
import {
  Users, BookOpen, Clock, Activity, AlertTriangle, Check, X,
  Plus, Search, Download, Calendar, Mail, FileText, CheckCircle2, RefreshCcw,
  TrendingUp, CreditCard, DollarSign, ArrowUpRight, Scale, BellRing, Sparkles, HelpCircle
} from 'lucide-react';

interface ManagerPanelProps {
  currentUser: User;
  users: User[];
  courses: Course[];
  transactions: Transaction[];
  notifications?: Notification[];
  onUpdateNotifications?: (newNotifs: Notification[]) => void;
  onUpdateCourses: (newCourses: Course[]) => void;
  onUpdateTransactions: (newTransactions: Transaction[]) => void;
  onAddAuditLog: (action: string, resource: string) => void;
  toast: (msg: string, type: 'success' | 'error' | 'info' | 'warn') => void;
}

export const ManagerPanel: React.FC<ManagerPanelProps> = ({
  currentUser,
  users,
  courses,
  transactions,
  notifications = [],
  onUpdateNotifications,
  onUpdateCourses,
  onUpdateTransactions,
  onAddAuditLog,
  toast
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'enrollment' | 'schedule' | 'finance'>('dashboard');

  // --- ENROLLMENT LOGIC STATES ---
  const [enrollmentSearch, setEnrollmentSearch] = useState('');
  const [enrollmentCourseFilter, setEnrollmentCourseFilter] = useState('all');
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState('all');
  
  // Bulk enrollment state tool
  const [bulkMssvText, setBulkMssvText] = useState('');
  const [bulkCourseId, setBulkCourseId] = useState('c-1');
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  // --- FINANCE VIEW STATES ---
  const [feeSearch, setFeeSearch] = useState('');
  const [feeStatusFilter, setFeeStatusFilter] = useState('all');
  const [financeSubTab, setFinanceSubTab] = useState<'all_bills' | 'debtors' | 'analytics'>('all_bills');
  const [debtMinAmount, setDebtMinAmount] = useState<number>(0);
  const [isSendingReminder, setIsSendingReminder] = useState<string | null>(null);

  // --- SCHEDULE VIEW STATES ---
  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(2); // Thứ 2
  const [selectedSlot, setSelectedSlot] = useState(1); // Ca 1
  const [selectedRoom, setSelectedRoom] = useState('Lab-104');
  const [scheduleCourseId, setScheduleCourseId] = useState('c-1');

  // Days mapping
  const DAYS_LIST = [
    { value: 2, label: 'Thứ Hai' },
    { value: 3, label: 'Thứ Ba' },
    { value: 4, label: 'Thứ Tư' },
    { value: 5, label: 'Thứ Năm' },
    { value: 6, label: 'Thứ Sáu' }
  ];

  // Slot mapping
  const SLOTS_LIST = [
    { value: 1, label: 'Ca 1 (07:30 - 09:30)' },
    { value: 2, label: 'Ca 2 (09:45 - 11:45)' },
    { value: 3, label: 'Ca 3 (13:30 - 15:30)' },
    { value: 4, label: 'Ca 4 (15:45 - 17:45)' }
  ];

  // ==========================
  // --- CALCULATE ANALYTICS ---
  // ==========================
  const totalStudents = users.filter(u => u.role === 'student').length;
  const totalTeachers = users.filter(u => u.role === 'teacher').length;

  const totalBilled = useMemo(() => transactions.reduce((sum, tx) => sum + (tx.type === 'tuition' ? tx.amount : 0), 0), [transactions]);
  const totalCollected = useMemo(() => transactions.filter(tx => tx.status === 'paid').reduce((sum, tx) => sum + (tx.type === 'tuition' ? tx.amount : 0), 0), [transactions]);
  const totalOutstanding = totalBilled - totalCollected;

  const pendingScholarshipsCount = useMemo(() => transactions.filter(tx => tx.type === 'scholarship' && tx.status === 'pending_approval').length, [transactions]);
  const pendingEnrollmentsCount = useMemo(() => transactions.filter(tx => tx.type === 'tuition' && tx.status === 'pending_approval').length, [transactions]);

  // SVG chart data
  const enrollmentTrendData = [
    { label: 'Th 12', value: 120 },
    { label: 'Th 01', value: 185 },
    { label: 'Th 02', value: 250 },
    { label: 'Th 03', value: 320 },
    { label: 'Th 04', value: 395 },
    { label: 'Th 05', value: totalStudents }
  ];

  // ==========================
  // --- ENROLLMENT WORKFLOWS ---
  // ==========================
  const handleApproveEnrollment = (txId: string) => {
    const updated = transactions.map(tx => {
      if (tx.id === txId) {
        toast(`Đã phê duyệt hoàn thành đóng học phí cho: ${tx.studentName}`, 'success');
        onAddAuditLog('Approve fee billing transaction', `Student: ${tx.studentCode}`);
        return { ...tx, status: 'paid' as const, paidDate: new Date().toISOString() };
      }
      return tx;
    });
    onUpdateTransactions(updated);
  };

  const handleRejectEnrollment = (txId: string) => {
    const matched = transactions.find(t => t.id === txId);
    if (window.confirm(`Bạn có chắc chắn muốn huỷ phê duyệt biên lai này của: ${matched?.studentName}?`)) {
      const updated = transactions.map(tx => {
        if (tx.id === txId) {
          toast(`Đã huỷ kích hoạt hoá đơn thu tiền của sinh viên: ${tx.studentName}`, 'warn');
          return { ...tx, status: 'unpaid' as const };
        }
        return tx;
      });
      onUpdateTransactions(updated);
    }
  };

  // Bulk enrollment via parsing MSSV codes
  const handleBulkEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkMssvText.trim()) {
      toast('Nội dung danh sách MSSV trống!', 'warn');
      return;
    }

    // Split rows on commas or newlines
    const rawCodes = bulkMssvText.split(/[\n,]+/).map(c => c.trim()).filter(Boolean);
    const targetCourse = courses.find(c => c.id === bulkCourseId);

    if (!targetCourse) {
      toast('Mã lớp học không hợp lệ.', 'error');
      return;
    }

    let successCount = 0;
    const newTransactions: Transaction[] = [];

    rawCodes.forEach(code => {
      // Find matching student
      const studentMatch = users.find(u => u.studentId && u.studentId.toLowerCase() === code.toLowerCase());
      if (studentMatch) {
        // Double check already enrolled
        const exists = transactions.some(
          tx => tx.studentId === studentMatch.id && tx.status === 'paid' && tx.schoolYear.includes(targetCourse.name)
        );

        if (!exists) {
          newTransactions.push({
            id: `tx-${Date.now()}-${successCount}`,
            studentId: studentMatch.id,
            studentName: studentMatch.name,
            studentCode: studentMatch.studentId!,
            amount: 12500000,
            type: 'tuition',
            status: 'paid', // directly approved for bulk operations
            schoolYear: `MCNA Course: ${targetCourse.name}`,
            billDate: new Date().toISOString(),
            dueDate: new Date().toISOString(),
            paidDate: new Date().toISOString()
          });
          successCount++;
        }
      }
    });

    if (successCount > 0) {
      // update course enrollment count
      const updatedCourses = courses.map(c => {
        if (c.id === bulkCourseId) {
          return { ...c, enrolled: Math.min(c.maxEnroll, c.enrolled + successCount) };
        }
        return c;
      });

      onUpdateCourses(updatedCourses);
      onUpdateTransactions([...newTransactions, ...transactions]);
      toast(`Ghi danh hàng loạt thành công! Đã phê duyệt ghi danh cho ${successCount}/${rawCodes.length} mã MSSV hợp lệ vào môn ${targetCourse.name}.`, 'success');
      onAddAuditLog(`Bulk enroll ${successCount} MSSV student codes`, `Course ${targetCourse.code}`);
      setIsBulkOpen(false);
      setBulkMssvText('');
    } else {
      toast('Không tìm thấy sinh viên nào tương ứng với các mã MSSV đã điền, hoặc sinh viên đã được ghi danh trước đó.', 'error');
    }
  };

  // ==========================
  // --- SCHEDULE WORKFLOWS ---
  // ==========================
  // Schedule Matrix: we have 5 days, 4 slots. Let's lay them out.
  const scheduleGrid = useMemo(() => {
    // Structure: day (2..6) -> slot (1..4) -> List of courses
    const matrixGrid: Record<number, Record<number, { course: Course; room: string }[]>> = {};
    for (let d = 2; d <= 6; d++) {
      matrixGrid[d] = {};
      for (let s = 1; s <= 4; s++) {
        matrixGrid[d][s] = [];
      }
    }

    courses.forEach(c => {
      c.schedule.forEach(sched => {
        if (matrixGrid[sched.day]?.[sched.slot]) {
          matrixGrid[sched.day][sched.slot].push({ course: c, room: sched.room });
        }
      });
    });

    return matrixGrid;
  }, [courses]);

  const handleCreateScheduleSlot = (e: React.FormEvent) => {
    e.preventDefault();

    const targetCourse = courses.find(c => c.id === scheduleCourseId);
    if (!targetCourse) {
      toast('Lớp học không đúng.', 'error');
      return;
    }

    // ROOM CONFLICT DETECTOR
    // Check if any other course is using same room at same (day, slot)
    let hasConflict = false;
    let conflictCourseName = '';

    courses.forEach(c => {
      c.schedule.forEach(sched => {
        if (sched.day === selectedDay && sched.slot === selectedSlot && sched.room.trim().toLowerCase() === selectedRoom.trim().toLowerCase()) {
          hasConflict = true;
          conflictCourseName = c.name;
        }
      });
    });

    if (hasConflict) {
      toast(`TRÙNG PHÒNG LAB! Phòng ${selectedRoom} vào Ca ${selectedSlot} (${DAYS_LIST.find(d => d.value === selectedDay)?.label}) đã được phân bổ cho lớp: ${conflictCourseName}.`, 'error');
      onAddAuditLog('Conflict detected on scheduling', `Room: ${selectedRoom}`);
      return;
    }

    // Success, update Course Schedule slots arrays
    const newSlot: ClassSlot = { day: selectedDay, slot: selectedSlot, room: selectedRoom };
    const updatedCourses = courses.map(c => {
      if (c.id === scheduleCourseId) {
        return {
          ...c,
          schedule: [...c.schedule, newSlot]
        };
      }
      return c;
    });

    onUpdateCourses(updatedCourses);
    setIsAddSlotOpen(false);
    toast(`Đã xếp lịch học thành công cho lớp ${targetCourse.name} tại phòng ${selectedRoom}!`, 'success');
    onAddAuditLog('Add customized class schedule slot', `Course ${targetCourse.code}`);
  };

  const handleExportCSV = (type: string) => {
    toast(`Xuất báo cáo dữ liệu quản lý: ${type}...`, 'info');
    setTimeout(() => {
      toast(`Đã lưu file báo cáo ${type} thành công!`, 'success');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      
      {/* Upper branding layout */}
      <div className="flex flex-wrap items-center justify-between border-b pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-gray-900">Không Gian Làm Việc Phòng Đào Tạo (Academic Manager)</h2>
            <p className="text-xs text-gray-500">Khai giảng lớp, xếp thời khoá biểu, phê duyệt thu học phí và học bổng học viên</p>
          </div>
        </div>

        {/* Categories panel chooser */}
        <div className="flex flex-wrap gap-1.5 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tổng quan Đào tạo
          </button>
          <button
            onClick={() => setActiveTab('enrollment')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'enrollment' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Đăng ký & Ghi Danh ({pendingEnrollmentsCount} pending)
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'schedule' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Phân thời khoá biểu phòng Lab
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'finance' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Học phí & Học bổng
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. ACADEMIC OVERVIEW DASHBOARD */}
      {/* ========================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-xl border-t-4 border-indigo-600 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Học viên chính quy</span>
                <span className="text-2xl font-black font-mono mt-1 block">{totalStudents}</span>
                <span className="text-[10px] text-indigo-600 font-bold block mt-1">Ghi danh hoạt động</span>
              </div>
              <div className="h-10 w-10 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-lg">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border-t-4 border-purple-600 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Giảng viên phân bổ</span>
                <span className="text-2xl font-black font-mono mt-1 block">{totalTeachers}</span>
                <span className="text-[10px] text-gray-400 font-bold block mt-1">30 cán bộ cơ hữu</span>
              </div>
              <div className="h-10 w-10 bg-purple-50 text-purple-600 flex items-center justify-center rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border-t-4 border-teal-500 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Chờ phê duyệt</span>
                <span className="text-2xl font-black font-mono mt-1 block text-amber-600">{pendingEnrollmentsCount}</span>
                <span className="text-[10px] text-amber-600 font-bold block mt-1">Học bổng / Học phí</span>
              </div>
              <div className="h-10 w-10 bg-amber-50 text-amber-500 flex items-center justify-center rounded-lg">
                <Activity className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border-t-4 border-rose-500 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Chưa hoàn thành phí</span>
                <span className="text-lg font-black font-mono mt-1 block text-rose-600">{(totalOutstanding / 1000000).toFixed(1)}M đ</span>
                <span className="text-[10px] text-gray-400 font-bold block mt-1">Đang đôn đốc</span>
              </div>
              <div className="h-10 w-10 bg-rose-50 text-rose-600 flex items-center justify-center rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border-t-4 border-emerald-500 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Đã thu thành công</span>
                <span className="text-lg font-black font-mono mt-1 block text-emerald-600">{(totalCollected / 1000000).toFixed(1)}M đ</span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-1">Hoàn thành chỉ tiêu</span>
              </div>
              <div className="h-10 w-10 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-lg">
                <Check className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* SVG Ghi danh line graph */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm lg:col-span-8">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 block">Xu hướng ghi danh thành viên mới (6 tháng gần đây)</h4>
              <SvgBarChart data={enrollmentTrendData} color="var(--p600)" />
            </div>

            {/* Quick Alerts Panels */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm lg:col-span-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 mb-4 flex items-center gap-1.5 border-b pb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Cảnh báo Vận hành & Vấn đề Đào tạo
              </h4>
              
              <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                {pendingEnrollmentsCount > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800">
                    Có <b>{pendingEnrollmentsCount} học sinh</b> nộp yêu cầu đóng học phí chờ duyệt. Vui lòng kiểm tra kiểm toán.
                  </div>
                )}
                {pendingScholarshipsCount > 0 && (
                  <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg text-xs text-purple-800">
                    Phát hiện <b>{pendingScholarshipsCount} đề xuất học bổng</b> chưa hoàn tất phê chọn mức miễn giảm học phí.
                  </div>
                )}
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-800">
                  Lớp <b>IT-DSA (Cấu trúc dữ liệu)</b> ghi nhận số học sinh đăng ký quá tải giới hạn thông thường (58/60 sinh viên).
                </div>
              </div>
            </div>

          </div>

          {/* Courses control tables for Manager review on catalog */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 mb-4 block">Danh sách các lớp học phần đang mở (Course Catalog Capacity)</h4>
            <div className="table-wrapper">
              <table className="lms-table" style={{ contentVisibility: 'auto' }}>
                <thead>
                  <tr>
                    <th>Mã Lớp</th>
                    <th>Tên lớp học phần</th>
                    <th className="text-center">Số tín chỉ</th>
                    <th>Giảng viên chủ nhiệm</th>
                    <th>Sĩ số tối đa</th>
                    <th>Trạng thái lớp</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c.id}>
                      <td className="font-mono text-xs font-bold text-gray-800">{c.code}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{c.thumbnailEmoji}</span>
                          <span className="font-bold text-gray-800 text-xs">{c.name}</span>
                        </div>
                      </td>
                      <td className="text-center font-mono font-bold">{c.credits}</td>
                      <td className="text-xs font-medium">{c.teacherName || 'Chưa điều phối'}</td>
                      <td>
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="flex justify-between font-mono text-[10px] text-gray-400">
                            <span>Sĩ số: {c.enrolled}/{c.maxEnroll}</span>
                            <span>{Math.round((c.enrolled / c.maxEnroll) * 100)}%</span>
                          </div>
                          <div className="prog-w w-24 bg-gray-100 h-1 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full" style={{ width: `${(c.enrolled / c.maxEnroll) * 100}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold bg-green-50 text-green rounded-full uppercase">
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* 2. ENROLLMENT MANAGEMENT & MASS REGISTER CODES */}
      {/* ========================================================= */}
      {activeTab === 'enrollment' && (
        <div className="space-y-4 animate-fadeIn">
          
          <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Tìm tên, email sinh viên..."
                value={enrollmentSearch}
                onChange={(e) => setEnrollmentSearch(e.target.value)}
                className="bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-lg px-3 py-2 text-xs outline-none w-52"
              />
              
              <select
                value={enrollmentCourseFilter}
                onChange={(e) => setEnrollmentCourseFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-lg px-3 py-2 text-xs cursor-pointer outline-none"
              >
                <option value="all">Mọi lớp học</option>
                {courses.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>

              <select
                value={enrollmentStatusFilter}
                onChange={(e) => setEnrollmentStatusFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-lg px-3 py-2 text-xs cursor-pointer outline-none"
              >
                <option value="all">Mọi trạng thái thu phí</option>
                <option value="pending_approval">Chờ phê duyệt biên lai</option>
                <option value="paid">Đã thanh toán học phí</option>
                <option value="unpaid">Chưa đóng học phí</option>
              </select>
            </div>

            <button
              onClick={() => setIsBulkOpen(true)}
              className="btn-primary px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Ghi danh hàng loạt (Bulk MSSV)
            </button>
          </div>

          <div className="table-wrapper">
            <table className="lms-table" style={{ contentVisibility: 'auto' }}>
              <thead>
                <tr>
                  <th>Mã số MSSV</th>
                  <th>Học viên</th>
                  <th>Khóa đào tạo đối sánh</th>
                  <th>Học phí thanh toán</th>
                  <th>Hóa đơn (Status)</th>
                  <th className="text-right">Duyệt nhanh</th>
                </tr>
              </thead>
              <tbody>
                {transactions
                  .filter(tx => {
                    const matchQ =
                      tx.studentName.toLowerCase().includes(enrollmentSearch.toLowerCase()) ||
                      tx.studentCode.toLowerCase().includes(enrollmentSearch.toLowerCase());
                    const matchCourse = enrollmentCourseFilter === 'all' ? true : tx.schoolYear.includes(enrollmentCourseFilter);
                    const matchStatus = enrollmentStatusFilter === 'all' ? true : tx.status === enrollmentStatusFilter;

                    return matchQ && matchCourse && matchStatus;
                  })
                  .map((tx) => (
                    <tr key={tx.id}>
                      <td className="font-mono text-xs font-bold text-gray-800">{tx.studentCode}</td>
                      <td className="font-bold text-xs">{tx.studentName}</td>
                      <td className="text-xs text-gray-500 max-w-sm truncate">{tx.schoolYear}</td>
                      <td className="font-mono text-xs">{tx.amount.toLocaleString('vi-VN')} đ</td>
                      <td>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          tx.status === 'paid' ? 'bg-green-100 text-green' :
                          tx.status === 'pending_approval' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {tx.status === 'paid' ? 'Đã thu' : tx.status === 'pending_approval' ? 'Chờ kiểm duyệt' : 'Chưa đóng'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {tx.status === 'pending_approval' ? (
                            <>
                              <button
                                onClick={() => handleApproveEnrollment(tx.id)}
                                title="Approve Đóng tiền"
                                className="p-1 px-1.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRejectEnrollment(tx.id)}
                                title="Từ chối bác bỏ"
                                className="p-1 px-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600 transition"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              Kiểm toán xong
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* 3. TIME-TABLE & LAB CONFLICT ALLOCATION */}
      {/* ========================================================= */}
      {activeTab === 'schedule' && (
        <div className="space-y-4 animate-fadeIn">
          
          <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm gap-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900">Thời Khóa Biểu & Xếp Phòng Lập Trình (MCNA Schedule Tool)</h4>
              <p className="text-xs text-gray-400 mt-1">Quản lý ca dạy, tự động chống xung đột phòng thí nghiệm Lab khi phân lớp học phần.</p>
            </div>
            
            <button
              onClick={() => setIsAddSlotOpen(true)}
              className="btn-primary py-2 px-4 rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Xếp ca học phần
            </button>
          </div>

          {/* Detailed Schedule grid for 5 weekdays and 4 ca slots */}
          <div className="table-wrapper select-none">
            <table className="lms-table border-collapse">
              <thead>
                <tr>
                  <th className="w-32 bg-slate-50 border-r border-gray-200">Khung thời gian / Các Ca học</th>
                  {DAYS_LIST.map(d => (
                    <th key={d.value} className="text-center font-bold text-gray-700 border-r border-gray-100">{d.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SLOTS_LIST.map((slotObj) => (
                  <tr key={slotObj.value} className="h-28">
                    <td className="bg-slate-50 font-medium text-xs border-r border-gray-200 p-3 flex flex-col justify-center h-full">
                      <b className="text-gray-900 font-bold block">Ca {slotObj.value}</b>
                      <span className="text-[10px] text-gray-400 font-mono block mt-1">{slotObj.label.split(' ')[1]}</span>
                    </td>
                    
                    {DAYS_LIST.map(d => {
                      const lectures = scheduleGrid[d.value]?.[slotObj.value] || [];
                      return (
                        <td key={d.value} className="border border-gray-100 p-2 text-center h-full align-top" style={{ contentVisibility: 'auto' }}>
                          <div className="flex flex-col gap-1.5 h-full justify-start">
                            {lectures.map((lec, lIdx) => (
                              <div
                                key={lIdx}
                                className="p-2.5 rounded-lg text-left bg-gradient-to-r from-indigo-50 to-blue-50/50 border-l-4 border-indigo-500 shadow-xs flex flex-col gap-1.5 hover:shadow-xs hover:bg-indigo-50 transition"
                              >
                                <span className="text-xs font-black text-indigo-900 leading-tight line-clamp-2 uppercase">{lec.course.name}</span>
                                <span className="text-[10px] font-mono font-bold text-indigo-400 bg-white/80 py-0.5 px-1.5 rounded-full inline-block self-start">
                                  {lec.course.code}
                                </span>
                                <div className="flex items-center gap-2 mt-1 text-[9px] text-gray-500 font-bold">
                                  <span className="flex items-center gap-1 bg-white border px-1 rounded-sm text-gray-600">
                                    🏛️ {lec.room}
                                  </span>
                                  <span className="text-gray-400">
                                    👨‍🏫 {lec.course.teacherName || 'TBA'}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {lectures.length === 0 && (
                              <span className="text-[10px] text-gray-300 italic block my-auto">Lịch trống</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* 4. FINANCIAL LEDGER & TUITION CONTROL */}
      {/* ========================================================= */}
      {activeTab === 'finance' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Detailed Financial Overview Stats Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50/40 p-5 rounded-2xl border border-indigo-100 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-15">
                <DollarSign className="w-10 h-10 text-indigo-700" />
              </div>
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Doanh Thu Mục Tiêu</span>
              <span className="text-2xl font-black font-mono text-indigo-950 mt-1 block">{(totalBilled / 1000000).toFixed(2)}M đ</span>
              <div className="flex items-center gap-1 text-[10px] text-indigo-700 font-bold mt-2">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Tổng hoá đơn gán bạ</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-green-50/40 p-5 rounded-2xl border border-emerald-100 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-15">
                <CreditCard className="w-10 h-10 text-emerald-700" />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Doanh Thu Thực Thu</span>
              <span className="text-2xl font-black font-mono text-emerald-700 mt-1 block">{(totalCollected / 1000000).toFixed(2)}M đ</span>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-650 font-bold mt-2">
                <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[8px]">
                  {Math.round((totalCollected / (totalBilled || 1)) * 100)}% Thu Hồi
                </span>
                <span>Tiền thực chảy vào quỹ</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-red-50/40 p-5 rounded-2xl border border-rose-100 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-15">
                <Scale className="w-10 h-10 text-rose-700" />
              </div>
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Tổng Dư Nợ / Công Nợ</span>
              <span className="text-2xl font-black font-mono text-rose-600 mt-1 block">{(totalOutstanding / 1000000).toFixed(2)}M đ</span>
              <div className="flex items-center gap-1 text-[10px] text-rose-800 font-bold mt-2">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span>Cần các ca nhắc nợ gấp</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 p-5 rounded-2xl border border-amber-100 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-15">
                <BellRing className="w-10 h-10 text-amber-600" />
              </div>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Tỷ Lệ Thất Thoát / Dự Báo</span>
              <span className="text-2xl font-black font-mono text-amber-700 mt-1 block">
                {(transactions.filter(t => t.status === 'unpaid').length)} ca nợ
              </span>
              <div className="text-[10px] text-gray-500 font-bold mt-2">
                Nợ khó đòi chiếm ~{Math.round((totalOutstanding / (totalBilled || 1)) * 100)}%
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50/40 p-5 rounded-2xl border border-purple-100 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-15">
                <Sparkles className="w-10 h-10 text-purple-700" />
              </div>
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">Ngân sách Học bổng đã cấp</span>
              <span className="text-2xl font-black font-mono text-purple-700 mt-1 block">
                {(transactions.filter(t => t.type === 'scholarship' && t.status === 'paid').reduce((sum, current) => sum + current.amount, 0) / 1000000).toFixed(2)}M đ
              </span>
              <div className="text-[10px] text-purple-650 font-bold mt-2">
                {transactions.filter(t => t.type === 'scholarship' && t.status === 'paid').length} suất học viên xuất sắc
              </div>
            </div>

          </div>

          {/* Sub Navigation Desk */}
          <div className="flex bg-slate-100 p-1 rounded-2xl w-full sm:w-max gap-1">
            <button
              onClick={() => setFinanceSubTab('all_bills')}
              className={`flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                financeSubTab === 'all_bills'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              📊 Sổ Cái Toàn Bộ Hoá Đơn
            </button>
            <button
              onClick={() => setFinanceSubTab('debtors')}
              className={`flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
                financeSubTab === 'debtors'
                  ? 'bg-white text-rose-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              ⚠️ Gian Đôn Đốc Công Nợ ({transactions.filter(t => t.status === 'unpaid').length})
              {transactions.filter(t => t.status === 'unpaid').length > 0 && (
                <span className="absolute -top-1 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></span>
              )}
            </button>
            <button
              onClick={() => setFinanceSubTab('analytics')}
              className={`flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                financeSubTab === 'analytics'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              📈 Dự Báo & Giả Lập Doanh Thu
            </button>
          </div>

          {/* TAB 1: ALL BILLS COMPREHENSIVE LEDGER */}
          {financeSubTab === 'all_bills' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm gap-4">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Tìm sinh viên, MSSV..."
                    value={feeSearch}
                    onChange={(e) => setFeeSearch(e.target.value)}
                    className="bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-lg px-3 py-2 text-xs outline-none w-52"
                  />
                  
                  <select
                    value={feeStatusFilter}
                    onChange={(e) => setFeeStatusFilter(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none cursor-pointer"
                  >
                    <option value="all">Mọi loại hoá đơn</option>
                    <option value="paid">Đã thanh toán biên lai</option>
                    <option value="unpaid">Chưa đóng học phí</option>
                    <option value="pending_approval">Chờ duyệt biên trực tuyến</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // Simulate creating a new tuition bill
                      const names = ['Nguyễn Kim Oanh', 'Tống Khánh Linh', 'Vũ Trí dũng', 'Chu Thảo Nguyên'];
                      const randomName = names[Math.floor(Math.random() * names.length)];
                      const targetId = `st-custom-${Date.now()}`;
                      const generatedId = `tx-${Date.now()}`;
                      const codeNum = Math.floor(100 + Math.random() * 900);
                      const possibleAmounts = [12500000, 15000000, 18500005];
                      const chosenAmount = possibleAmounts[Math.floor(Math.random() * possibleAmounts.length)];
                      
                      const newBill: Transaction = {
                        id: generatedId,
                        studentId: targetId,
                        studentName: randomName,
                        studentCode: `MCNA-2026-${codeNum}`,
                        amount: chosenAmount,
                        type: 'tuition',
                        status: 'unpaid',
                        schoolYear: '2025-2026 Học kỳ II bổ sung',
                        billDate: new Date().toISOString(),
                        dueDate: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString()
                      };
                      onUpdateTransactions([newBill, ...transactions]);
                      onAddAuditLog('Created a personalized tuition fee bill', `Student: ${randomName}`);
                      toast(`Đã phát hành lập mới hoá đơn học phí thành công cho sinh viên: ${randomName}!`, 'success');
                    }}
                    className="btn-primary py-2 px-3.5 rounded-lg text-xs font-bold"
                  >
                    ➕ Lập Hoá Đơn Mới
                  </button>
                  <button
                    onClick={() => handleExportCSV('So_sach_thu_tien_va_hoc_bong')}
                    className="btn-secondary px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    Tải Sổ Cái Tài Chính
                  </button>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="lms-table" style={{ contentVisibility: 'auto' }}>
                  <thead>
                    <tr>
                      <th>Mã số MSSV</th>
                      <th>Học viên</th>
                      <th>Loại giao dịch</th>
                      <th>Nội dung thanh toán</th>
                      <th>Số tiền lập</th>
                      <th>Hạn nộp học phí</th>
                      <th className="text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions
                      .filter(tx => {
                        const matchQ =
                          tx.studentName.toLowerCase().includes(feeSearch.toLowerCase()) ||
                          tx.studentCode.toLowerCase().includes(feeSearch.toLowerCase());
                        const matchStatus = feeStatusFilter === 'all' ? true : tx.status === feeStatusFilter;

                        return matchQ && matchStatus;
                      })
                      .map((tx) => (
                        <tr key={tx.id}>
                          <td className="font-mono text-xs font-bold text-gray-850">{tx.studentCode}</td>
                          <td>
                            <div className="font-bold text-xs text-gray-800">{tx.studentName}</div>
                            <span className="text-[10px] text-gray-400 font-mono block">Bill ID: {tx.id}</span>
                          </td>
                          <td>
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                              tx.type === 'scholarship' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {tx.type === 'scholarship' ? 'Học bổng' : 'Học phí'}
                            </span>
                          </td>
                          <td className="text-xs text-gray-500 max-w-xs truncate">{tx.schoolYear}</td>
                          <td className="font-mono text-xs font-black">{tx.amount.toLocaleString('vi-VN')} đ</td>
                          <td className="text-xs text-gray-500">
                            {tx.status === 'paid' && tx.paidDate ? (
                              <span className="text-emerald-600 font-bold">Ngày đóng: {new Date(tx.paidDate).toLocaleDateString('vi-VN')}</span>
                            ) : (
                              <span>Hạn: {new Date(tx.dueDate).toLocaleDateString('vi-VN')}</span>
                            )}
                          </td>
                          <td className="text-right">
                            <div className="flex justify-end gap-1">
                              {tx.status === 'pending_approval' ? (
                                <>
                                  <button
                                    onClick={() => handleApproveEnrollment(tx.id)}
                                    className="p-1 px-2.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                  >
                                    Duyệt ngay
                                  </button>
                                  <button
                                    onClick={() => handleRejectEnrollment(tx.id)}
                                    className="p-1 px-1.5 rounded text-[10px] text-gray-500 hover:text-red-500"
                                  >
                                    Huỷ
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => {
                                    const updated = transactions.map(item => {
                                      if (item.id === tx.id) {
                                        const nextSt = item.status === 'paid' ? 'unpaid' : 'paid';
                                        toast(`Đã gán hoá đơn ${tx.studentName} sang dạng: ${nextSt.toUpperCase()}`, 'info');
                                        return { ...item, status: nextSt as any, paidDate: nextSt === 'paid' ? new Date().toISOString() : undefined };
                                      }
                                      return item;
                                    });
                                    onUpdateTransactions(updated);
                                  }}
                                  className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition ${
                                    tx.status === 'paid' ? 'bg-emerald-100 text-emerald-850 hover:bg-emerald-200' : 'bg-red-50 text-red-650 hover:bg-red-100'
                                  }`}
                                >
                                  {tx.status === 'paid' ? 'Đã thu ✓' : 'Thu tiền nháp'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: OVERDUE DEBTOR MANAGEMENT & REMINDERS */}
          {financeSubTab === 'debtors' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-50 p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h5 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                    Không Gian Quản Lý Số Cân Đối Công Nợ & Đôn Đốc Thu Học Phí
                  </h5>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Hệ thống lọc danh sách sinh viên hiện mang số nợ hoặc chưa đóng học phí. Bạn có thể gửi hàng loạt cảnh báo nhắc nợ bạ thông qua in-app thông báo.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const debtors = transactions.filter(t => t.status === 'unpaid');
                      if (debtors.length === 0) {
                        toast('Tuyệt vời! Không có học viên nào nợ học phí trong kỳ này.', 'info');
                        return;
                      }
                      
                      // Bulk trigger reminds
                      if (onUpdateNotifications && notifications) {
                        let updatedNotifs = [...notifications];
                        debtors.forEach(d => {
                          const customNotif: Notification = {
                            id: `bulk-remind-${Date.now()}-${d.id}`,
                            userId: d.studentId,
                            type: 'warning',
                            title: '⚠️ THÔNG BÁO khẩn: ĐÔN ĐỐC nợ học phí học kỳ',
                            body: `Chào ${d.studentName}, Phòng đào tạo yêu cầu bạn đăng nhập mục Tài chính để kiểm tra số nợ học phí ${d.amount.toLocaleString('vi-VN')} đ chưa thanh toán đầy đủ. Tránh việc khóa quyền lợi học phần.`,
                            read: false,
                            createdAt: new Date().toISOString()
                          };
                          updatedNotifs.unshift(customNotif);
                        });
                        onUpdateNotifications(updatedNotifs);
                      }
                      
                      onAddAuditLog('Bulk tuition push warning executed', `${debtors.length} debtors reminded`);
                      toast(`Đã gửi đồng loạt nhắc nợ học phí thành công tới tất cả ${debtors.length} học viên có dư nợ!`, 'success');
                    }}
                    className="btn-primary bg-rose-600 hover:bg-rose-700 py-2 px-4 rounded-lg text-xs font-bold font-sans flex items-center gap-2"
                  >
                    <BellRing className="w-4 h-4 animate-bounce" />
                    Phát Thông Báo Nhắc Nợ Đồng Loạt
                  </button>
                </div>
              </div>

              {/* Debt Filters */}
              <div className="bg-white p-3 rounded-lg border flex gap-3 items-center text-xs">
                <span>Ngưỡng dư nợ lọc tối thiểu:</span>
                <div className="flex gap-2">
                  {[0, 5000000, 10000000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setDebtMinAmount(amt)}
                      className={`px-3 py-1 rounded text-[10px] font-bold border transition ${
                        debtMinAmount === amt 
                          ? 'bg-rose-50 border-rose-200 text-rose-700' 
                          : 'bg-white text-gray-400 hover:bg-slate-50'
                      }`}
                    >
                      {amt === 0 ? 'Tất cả nợ' : `Trên ${ (amt / 1000000) } Triệu`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Debtors List Table */}
              <div className="table-wrapper">
                <table className="lms-table" style={{ contentVisibility: 'auto' }}>
                  <thead>
                    <tr>
                      <th>Học viên nợ bạ</th>
                      <th>Mã số MSSV</th>
                      <th>Hoá đơn tham chiếu</th>
                      <th>Mức nợ học phần (Công nợ)</th>
                      <th>Thời gian phát sinh nợ</th>
                      <th className="text-right">Đôn đốc khẩn cấp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions
                      .filter(tx => tx.status === 'unpaid' && tx.amount >= debtMinAmount)
                      .map((tx) => {
                        const targetUser = users.find(u => u.id === tx.studentId || u.studentId === tx.studentCode);
                        return (
                          <tr key={tx.id} className="hover:bg-rose-50/10">
                            <td>
                              <div className="font-bold text-xs text-rose-950 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                                {tx.studentName}
                              </div>
                              <span className="text-[10px] text-gray-450 block font-sans">Sđt: {targetUser?.phone || '090123xxx'} | Hướng: {targetUser?.major || 'Tech-SaaS'}</span>
                            </td>
                            <td className="font-mono text-xs font-bold">{tx.studentCode}</td>
                            <td className="text-xs text-gray-500 italic max-w-2xs truncate">{tx.schoolYear}</td>
                            <td className="font-mono text-xs font-black text-rose-600">{tx.amount.toLocaleString('vi-VN')} đ</td>
                            <td className="text-xs text-gray-500">{new Date(tx.billDate).toLocaleDateString('vi-VN')}</td>
                            <td className="text-right">
                              <button
                                type="button"
                                disabled={isSendingReminder === tx.studentId}
                                onClick={() => {
                                  setIsSendingReminder(tx.studentId);
                                  setTimeout(() => {
                                    setIsSendingReminder(null);
                                    if (onUpdateNotifications && notifications) {
                                      const newNotif: Notification = {
                                        id: `n-debt-${Date.now()}-${tx.id}`,
                                        userId: tx.studentId,
                                        type: 'warning',
                                        title: '🚨 THÔNG BÁO CÔNG NỢ QUÁ HẠN TỪ TRƯỜNG MCNA',
                                        body: `Học viên ${tx.studentName} ơi! Phòng đào tạo kiểm toán ghi nhận bạn hiện chưa thanh toán khoản nợ học phí ${tx.amount.toLocaleString('vi-VN')} đ môn [${tx.schoolYear}]. Nhấp chọn mục Học phí & Học bổng để tiến hành thanh toán hoặc đính kèm ảnh chuyển khoản trước khi cổng thi đóng lại nhé!`,
                                        read: false,
                                        createdAt: new Date().toISOString()
                                      };
                                      onUpdateNotifications([newNotif, ...notifications]);
                                    }
                                    onAddAuditLog('Sent automated tuition reminder alert', `Student ID: ${tx.studentCode}`);
                                    toast(`Đã gửi thông báo nhắc học phí thành công cho học viên ${tx.studentName}!`, 'success');
                                  }, 800);
                                }}
                                className="btn-secondary hover:bg-rose-50 text-rose-700 hover:border-rose-300 py-1 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ml-auto"
                              >
                                {isSendingReminder === tx.studentId ? (
                                  <>
                                    <div className="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                                    Mạng đang phát...
                                  </>
                                ) : (
                                  <>
                                    <BellRing className="w-3.5 h-3.5" />
                                    Bắn cảnh báo nợ
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    {transactions.filter(tx => tx.status === 'unpaid' && tx.amount >= debtMinAmount).length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-xs text-gray-400 font-medium italic">
                          🥳 Không có dư nợ hoặc công nợ nào thỏa mãn ngưỡng lọc tối thiểu đã gán.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: REVENUE FORECAST & CREDITS ADJUSTMENT SIMULATOR */}
          {financeSubTab === 'analytics' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
                <h5 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest flex items-center gap-1 text-emerald-700 border-b pb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  GIẢ LẬP VÀ PHÂN TÍCH DOANH THU ĐÀO TẠO THEO CHỈ TIÊU TÍN CHỈ (REVENUE PREDICTOR SIMULATOR)
                </h5>
                <p className="text-[11px] text-gray-400">
                  Phân hiệu đào tạo chuẩn quốc tế MCNA lập biểu dự đoán doanh thu phát sinh dựa trên số tín chỉ học viên. Thay đổi đơn giá từng tín chỉ bên dưới để máy học chạy dự phóng biến thiên dòng tiền ước lượng.
                </p>

                {/* Simulated Pricing Engine Variables */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border space-y-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block text-indigo-750">Đơn giá học phí gốc / Tín chỉ:</span>
                    <p className="font-mono font-black text-lg text-slate-800">1,250,000 đ</p>
                    <span className="text-[9px] text-gray-400 block leading-tight">Mức đơn giá sàn đào tạo chất lượng cao do Hội đồng bệ phóng thông qua.</span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border space-y-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block text-emerald-750">Số tín chỉ ước tính / Học viên / Kỳ:</span>
                    <p className="font-mono font-black text-lg text-slate-800">10 Tín chỉ</p>
                    <span className="text-[9px] text-gray-400 block leading-tight">Trung bình mỗi học kỳ sinh viên đăng ký học phần lý thuyết & lab thực tập.</span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border space-y-2 col-span-2">
                    <span className="text-[10px] text-emerald-600 font-bold uppercase block">Kịch bản Doanh thu Giả lập Kỳ học:</span>
                    <div className="flex items-center gap-2 pt-1">
                      <div className="p-2.5 bg-emerald-100/50 rounded-lg text-emerald-800 text-sm font-bold font-mono">
                        ≈ {(users.filter(u => u.role === 'student').length * 10 * 1250000).toLocaleString('vi-VN')} đ
                      </div>
                      <span className="text-[9px] text-gray-400 leading-tight">Tổng quy mô doanh số ước tính đối với toàn bộ {users.filter(u => u.role === 'student').length} học viên đăng ký hoạt động.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Segmented Revenue Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-xs">
                
                <div className="md:col-span-4 bg-white p-5 rounded-2xl border shadow-sm space-y-3">
                  <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-700 block border-b pb-1.5">Phân Khúc Doanh Thu</span>
                  
                  <div className="space-y-3 pt-2">
                    <div>
                      <div className="flex justify-between items-center text-[11px] mb-1 text-slate-650">
                        <span>Học phí lý thuyết phần mềm (SE)</span>
                        <span className="font-bold">55% Doanh số</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: '55%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-[11px] mb-1 text-slate-650">
                        <span>Lớp Trí tuệ nhân tạo chuyên biệt (AI)</span>
                        <span className="font-bold">30% Doanh số</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="bg-purple-600 h-full rounded-full" style={{ width: '30%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-[11px] mb-1 text-slate-650">
                        <span>Lớp bảo mật cyber nâng cao (SEC)</span>
                        <span className="font-bold">15% Doanh số</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: '15%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-8 bg-white p-5 rounded-2xl border shadow-sm space-y-3">
                  <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-700 block border-b pb-1.5">Sách lược Quản trị Dòng Tiền khuyên dùng</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-1">
                      <span className="font-bold text-indigo-900 text-xs block">Thu hội tối đa nợ học phần (Công nợ)</span>
                      <p className="text-[11px] text-gray-600 leading-relaxed">
                        Tích cực gửi thông báo nhắc nhở nợ vào 10 ngày cuối cùng của kỳ học để đảm bảo tỷ lệ thu hồi đạt trên 95%, giảm tỷ lệ nợ xấu xuống dưới 3%.
                      </p>
                    </div>

                    <div className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl space-y-1">
                      <span className="font-bold text-emerald-900 text-xs block">Khuyến khích voucher nộp qua Smart Banking</span>
                      <p className="text-[11px] text-gray-600 leading-relaxed">
                        Chuyển định hướng thanh toán không dùng tiền mặt qua mã tĩnh BIDV QR để giảm tải nhân công xác thực hóa đơn thủ công tại phòng Kế toán học viện.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
              
            </div>
          )}

        </div>
      )}

      {/* ========================================================= */}
      {/* 5. ADD SLOT MODAL (ROOM CONFLICT) */}
      {/* ========================================================= */}
      {isAddSlotOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-sm w-full p-5 sm:p-6 animate-fadeIn">
            <h4 className="text-sm font-black text-gray-900 border-b pb-2 mb-4">Xếp thời khóa biểu & kiểm phòng Lab</h4>
            
            <form onSubmit={handleCreateScheduleSlot} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Lựa chọn Lớp học phần</label>
                <select
                  value={scheduleCourseId}
                  onChange={(e) => setScheduleCourseId(e.target.value)}
                  className="mt-1 w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs cursor-pointer outline-none"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>[{c.code}] - {c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Chọn ngày học</label>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(Number(e.target.value))}
                    className="mt-1 w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs cursor-pointer outline-none"
                  >
                    {DAYS_LIST.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Chọn ca giảng dạy</label>
                  <select
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(Number(e.target.value))}
                    className="mt-1 w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs cursor-pointer outline-none"
                  >
                    {SLOTS_LIST.map(s => (
                      <option key={s.value} value={s.value}>Ca {s.value}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Lớp phòng Lab chỉ định</label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="mt-1 w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs cursor-pointer outline-none"
                >
                  <option value="Lab-104">Lab-104 (RTX 4070 Máy trạm)</option>
                  <option value="Lab-106">Lab-106 (Apple Mac Lab)</option>
                  <option value="Lab-202">Lab-202 (Mạng Cisco Lab)</option>
                  <option value="Phòng Hội Thảo">Phòng Thảo Luận tầng 3</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddSlotOpen(false)}
                  className="btn-secondary py-2 px-4 rounded-lg text-xs font-bold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2 px-4 rounded-lg text-xs font-bold"
                >
                  Kiểm tra & Xếp lịch
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. BULK ENROLL CODES INPUT DIALOG */}
      {/* ========================================================= */}
      {isBulkOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-md w-full p-5 sm:p-6 animate-fadeIn">
            <h4 className="text-sm font-black text-gray-900 border-b pb-2 mb-4">Ghi danh hàng loạt học viên qua MSSV</h4>
            
            <form onSubmit={handleBulkEnrollSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Chỉ định Lớp học phần tiếp nhận</label>
                <select
                  value={bulkCourseId}
                  onChange={(e) => setBulkCourseId(e.target.value)}
                  className="mt-1 w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs cursor-pointer outline-none"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>[{c.code}] - {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Danh sách MSSV (Xuống dòng hoặc cách nhau bằng dấu phẩy)</label>
                <textarea
                  value={bulkMssvText}
                  onChange={(e) => setBulkMssvText(e.target.value)}
                  placeholder="Ví dụ:&#10;MCNA-2026-001&#10;MCNA-2026-002&#10;MCNA-2026-003"
                  rows={6}
                  className="mt-1 w-full bg-gray-50 border rounded-lg p-3 text-xs outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>

              <div className="text-[10px] text-gray-400 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                💡 <b>Mẹo quản lý:</b> Chương trình sẽ quét tìm sinh viên tồn tại trong cơ sở dữ liệu học viện, nếu trùng khớp, sinh viên sẽ được chuyển thẳng trạng thái <b>Đã thanh toán học phí</b> và ghi vào Sổ cái lớp.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setIsBulkOpen(false)}
                  className="btn-secondary py-2 px-4 rounded-lg text-xs font-bold"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2 px-4 rounded-lg text-xs font-bold"
                >
                  Quét &amp; Ghi danh lớp học
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
