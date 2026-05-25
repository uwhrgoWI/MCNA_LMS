import React, { useState, useMemo } from 'react';
import { User, Course, AuditLog, SystemSettings, FeatureFlags } from '../types';
import { SvgBarChart, SvgLineChart, SvgDonutChart } from './SvgCharts';
import {
  Shield, Users, BookOpen, Clock, Activity, Settings, Eye, Edit2, RotateCcw,
  UserX, UserCheck, Trash2, Plus, ArrowLeft, ArrowRight, Download, Save, Grid
} from 'lucide-react';

interface AdminPanelProps {
  currentUser: User;
  users: User[];
  courses: Course[];
  auditLogs: AuditLog[];
  transactions: any[];
  systemSettings: SystemSettings;
  setSystemSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  featureFlags: FeatureFlags;
  setFeatureFlags: React.Dispatch<React.SetStateAction<FeatureFlags>>;
  onUpdateUsers: (newUsers: User[]) => void;
  onAddAuditLog: (action: string, resource: string) => void;
  toast: (msg: string, type: 'success' | 'error' | 'info' | 'warn') => void;
}

// Module keys for RBAC matrix
const MATRIX_MODULES = [
  { id: 'dashboard', name: 'Trang Tổng Quan System (Dashboard)' },
  { id: 'users', name: 'Quản Lý Người Dùng & Hồ Sơ' },
  { id: 'courses', name: 'Quản Lý Lớp Học & Đăng Ký' },
  { id: 'schedule', name: 'Sắp Lịch & Thời Khoá Biểu' },
  { id: 'grades', name: 'Chấm Điểm & Quản Lý Sổ Điểm' },
  { id: 'finance', name: 'Học Phí, Thu Học Phí & Học Bổng' },
  { id: 'settings', name: 'Thiết Lập System & Cấu Hình' },
  { id: 'audit', name: 'Nhật Ký Bảo Mật & Audit Log' }
];

const ROLES_LIST = ['admin', 'manager', 'teacher', 'student'] as const;
type MatrixValue = 'Full' | 'Scoped' | 'Read-only' | 'None';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  users,
  courses,
  auditLogs,
  transactions,
  systemSettings,
  setSystemSettings,
  featureFlags,
  setFeatureFlags,
  onUpdateUsers,
  onAddAuditLog,
  toast
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'settings' | 'rbac' | 'audit'>('dashboard');

  // --- USER MAPPING STATES ---
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');
  const [userPage, setUserPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  
  // Modals & form fields
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // New User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'manager' | 'teacher' | 'student'>('student');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserMajor, setNewUserMajor] = useState(systemSettings.gradingScale);

  // --- SYSTEM CONFIG STATE ---
  const [settingsForm, setSettingsForm] = useState<SystemSettings>({ ...systemSettings });
  const [flagsForm, setFlagsForm] = useState<FeatureFlags>({ ...featureFlags });
  const [settingsTab, setSettingsTab] = useState<'general' | 'academic' | 'security' | 'flags'>('general');

  // Lockout form state examples (UI bind only)
  const [lockoutAttempts, setLockoutAttempts] = useState('5');
  const [lockoutTime, setLockoutTime] = useState('15');

  // --- RBAC MATRIX STATE ---
  // Seed state matrix
  const [matrix, setMatrix] = useState<Record<string, Record<string, MatrixValue>>>(() => {
    const initial: Record<string, Record<string, MatrixValue>> = {};
    MATRIX_MODULES.forEach(mod => {
      initial[mod.id] = {
        admin: 'Full',
        manager: mod.id === 'settings' ? 'None' : 'Full',
        teacher: ['courses', 'grades', 'schedule'].includes(mod.id) ? 'Full' : 'Read-only',
        student: ['dashboard', 'courses', 'grades', 'schedule'].includes(mod.id) ? 'Read-only' : 'None'
      };
    });
    return initial;
  });

  // --- AUDIT LOGGER FILTER STATE ---
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('all');

  // ==========================
  // --- CALCULATE ANALYTICS ---
  // ==========================
  const totalUsers = users.length;
  const activeCourses = courses.filter(c => c.status === 'active').length;
  const totalActiveSessions = 12 + Math.floor(Math.random() * 25);
  
  const totalRevenue = useMemo(() => {
    return transactions
      .filter(tx => tx.status === 'paid' && tx.type === 'tuition')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  // SVG Chart Mock Datasets
  const growthDataset = [
    { label: 'Th 12', value: 240 },
    { label: 'Th 01', value: 290 },
    { label: 'Th 02', value: 340 },
    { label: 'Th 03', value: 410 },
    { label: 'Th 04', value: 460 },
    { label: 'Th 05', value: totalUsers }
  ];

  const revenueDataset = [
    { label: 'Th 12', value: 125000000 },
    { label: 'Th 01', value: 180000000 },
    { label: 'Th 02', value: 240000000 },
    { label: 'Th 03', value: 380000000 },
    { label: 'Th 04', value: totalRevenue * 0.8 },
    { label: 'Th 05', value: totalRevenue }
  ];

  const roleDonutDataset = useMemo(() => {
    const counts = { admin: 0, manager: 0, teacher: 0, student: 0 };
    users.forEach(u => {
      counts[u.role] = (counts[u.role] || 0) + 1;
    });
    return [
      { label: 'Giám đốc', value: counts.admin, color: '#ef4444' },
      { label: 'Quản lý', value: counts.manager, color: '#6366f1' },
      { label: 'Giảng viên', value: counts.teacher, color: '#a855f7' },
      { label: 'Học viên', value: counts.student, color: '#10b981' }
    ];
  }, [users]);

  // ==========================
  // --- PORTAL USER METRICS & SEARCH ---
  // ==========================
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchQuery =
        user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        (user.studentId && user.studentId.toLowerCase().includes(userSearch.toLowerCase()));
      
      const matchRole = userRoleFilter === 'all' ? true : user.role === userRoleFilter;
      const matchStatus = userStatusFilter === 'all' ? true : user.status === userStatusFilter;
      
      return matchQuery && matchRole && matchStatus;
    });
  }, [users, userSearch, userRoleFilter, userStatusFilter]);

  // Pagination bounds
  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage) || 1;
  const currentUsersList = useMemo(() => {
    const start = (userPage - 1) * usersPerPage;
    return filteredUsers.slice(start, start + usersPerPage);
  }, [filteredUsers, userPage, usersPerPage]);

  const handleStatusToggle = (userId: string) => {
    if (userId === currentUser.id) {
      toast('Không thể vô hiệu hoá tài khoản của chính bạn!', 'warn');
      return;
    }
    const updated = users.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'active' ? 'inactive' : 'active';
        toast(`Đã thay đổi trạng thái của ${u.name} thành: ${nextStatus.toUpperCase()}`, 'success');
        onAddAuditLog(`Toggle user status (${nextStatus})`, `User ${u.email}`);
        return { ...u, status: nextStatus };
      }
      return u;
    });
    onUpdateUsers(updated);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword) {
      toast('Hãy bổ sung đầy đủ các trường bắt buộc.', 'warn');
      return;
    }
    // unique check
    if (users.some(u => u.email.toLowerCase() === newUserEmail.toLowerCase())) {
      toast('Email này đã tồn tại trên system!', 'error');
      return;
    }

    const initials = newUserName.split(' ').map(n => n[0]).join('').slice(-2);
    const mockStudentId = newUserRole === 'student' ? `MCNA-2026-${String(users.filter(u => u.role === 'student').length + 1).padStart(3, '0')}` : undefined;

    const newUser: User = {
      id: `u-${Date.now()}`,
      name: newUserName,
      email: newUserEmail,
      password: newUserPassword,
      role: newUserRole,
      avatarInitials: initials,
      avatarColor: 'bg-indigo-600 text-white',
      status: 'active',
      joinedAt: new Date().toISOString(),
      phone: newUserPhone,
      studentId: mockStudentId
    };

    onUpdateUsers([newUser, ...users]);
    setIsAddUserModalOpen(false);
    toast(`Đã khởi tạo thành công tài khoản: ${newUserName} (${newUserRole.toUpperCase()})`, 'success');
    onAddAuditLog('Create manual user', `User ${newUserEmail}`);

    // clear fields
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserPhone('');
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser.id) {
      toast('Bạn không thể xoá tài khoản đang đăng nhập!', 'error');
      return;
    }
    if (window.confirm('Bạn có chắc chắn muốn xoá vĩnh viễn thành viên này khỏi cơ sở dữ liệu?')) {
      const match = users.find(u => u.id === userId);
      const filtered = users.filter(u => u.id !== userId);
      onUpdateUsers(filtered);
      toast('Đã xoá tài khoản thành viên thành công.', 'success');
      onAddAuditLog('Delete user account', `User ${match?.email}`);
    }
  };

  const handleResetPassword = (user: User) => {
    const newPass = 'MCNA@2026';
    const updated = users.map(u => {
      if (u.id === user.id) {
        return { ...u, password: newPass };
      }
      return u;
    });
    onUpdateUsers(updated);
    toast(`Mật khẩu của ${user.name} đã được reset về mặc định: ${newPass}`, 'success');
    onAddAuditLog('Reset default password', `User ${user.email}`);
  };

  // --- SYSTEM SETTINGS CONFIG SAVE ---
  const handleSaveSettings = (section: string) => {
    setSystemSettings({ ...settingsForm });
    setFeatureFlags({ ...flagsForm });
    toast(`Đã lưu thiết lập ${section} & đồng bộ cấu hình system!`, 'success');
    onAddAuditLog(`Update Settings: ${section}`, 'Global Configuration');
  };

  // --- Matrix level cycler ---
  const permissionCycles: MatrixValue[] = ['Full', 'Scoped', 'Read-only', 'None'];
  const handlePermissionCellCycle = (modId: string, role: string) => {
    if (role === 'admin') {
      toast('Quyền quản trị viên (Admin) luôn mặc định Full và không thể điều chỉnh!', 'warn');
      return;
    }
    const currentVal = matrix[modId][role];
    const nextIdx = (permissionCycles.indexOf(currentVal) + 1) % permissionCycles.length;
    const nextVal = permissionCycles[nextIdx];

    setMatrix(prev => ({
      ...prev,
      [modId]: {
        ...prev[modId],
        [role]: nextVal
      }
    }));
  };

  const handleSaveMatrix = () => {
    toast('Đã ghi nhận thay đổi ma trận phân quyền (RBAC)!', 'success');
    onAddAuditLog('Update RBAC Matrix', 'Access Security Rules');
  };

  // CSV Export simulations
  const handleExportCSV = (type: string) => {
    toast(`Đổ dữ liệu ${type} và đóng gói mã hoá sang file Microsoft Excel (.csv)...`, 'info');
    setTimeout(() => {
      toast(`Xuất báo cáo ${type} thành công! Đã tải file xuống máy của bạn.`, 'success');
    }, 1200);
  };

  return (
    <div className="space-y-6">
      
      {/* Horizontal Nav Bar */}
      <div className="flex flex-wrap items-center justify-between border-b pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-gray-900">Bàn Thao Tác Giám Đốc (CEO Portal)</h2>
            <p className="text-xs text-gray-500">Giám sát tài chính, bảo mật, vận hành và phân quyền hệ thống</p>
          </div>
        </div>

        {/* Action subtabs buttons */}
        <div className="flex flex-wrap gap-1.5 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'users' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Quản lý thành viên ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'settings' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Cấu hình system
          </button>
          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'rbac' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Ma Trận RBAC
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'audit' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Security Audit Logs
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. ADMIN OVERVIEW DASHBOARD */}
      {/* ========================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-xl border-t-4 border-red-500 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tổng số user</span>
                <span className="text-2xl font-black font-mono mt-1 block">{totalUsers}</span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-1">▲ 5.2% tháng này</span>
              </div>
              <div className="h-10 w-10 bg-red-50 text-red-600 flex items-center justify-center rounded-lg">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border-t-4 border-purple-500 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Khóa học active</span>
                <span className="text-2xl font-black font-mono mt-1 block">{activeCourses}</span>
                <span className="text-[10px] text-gray-400 font-bold block mt-1">Công suất 100%</span>
              </div>
              <div className="h-10 w-10 bg-purple-50 text-purple-600 flex items-center justify-center rounded-lg">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border-t-4 border-emerald-500 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Học phí thu về</span>
                <span className="text-lg font-black font-mono mt-1 block">{(totalRevenue / 1000000).toFixed(1)}M VND</span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-1">82% hoàn thành</span>
              </div>
              <div className="h-10 w-10 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-lg">
                <Save className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border-t-4 border-amber-500 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Session đồng thời</span>
                <span className="text-2xl font-black font-mono mt-1 block">{totalActiveSessions}</span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-1">Hao tải tốt</span>
              </div>
              <div className="h-10 w-10 bg-amber-50 text-amber-600 flex items-center justify-center rounded-lg">
                <Activity className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border-t-4 border-blue-500 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Server Uptime</span>
                <span className="text-2xl font-black font-mono mt-1 block">99.98%</span>
                <span className="text-[10px] text-blue-600 font-bold block mt-1">Trạng thái: Hoạt động tốt</span>
              </div>
              <div className="h-10 w-10 bg-blue-50 text-blue-600 flex items-center justify-center rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* SVG Charts Rows */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* User Growth */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm lg:col-span-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 block">Gia tăng học viên (6 tháng)</h4>
              <SvgBarChart data={growthDataset} color="var(--b500)" />
            </div>

            {/* Revenue lines */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm lg:col-span-5">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 block">Doanh thu thu về luỹ kế</h4>
              <SvgLineChart data={revenueDataset} />
            </div>

            {/* Role distribution */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm lg:col-span-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 block">Cơ cấu thành phần MCNA</h4>
              <SvgDonutChart data={roleDonutDataset} />
            </div>

          </div>

          {/* Recent Audits Feed & Quick shortcuts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm lg:col-span-8">
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-red-500" />
                  Nhật Ký Bảo mật System (10 hoạt động gần nhất)
                </h4>
                <button
                  onClick={() => setActiveTab('audit')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Xem toàn bộ log
                </button>
              </div>

              <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
                {auditLogs.slice(0, 10).map((log, idx) => (
                  <div key={idx} className="flex items-start justify-between text-xs p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/50 transition duration-150">
                    <div>
                      <span className="font-bold text-gray-800 block">{log.action}</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">Tài nguyên: {log.resource} | IP: {log.ip}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full block self-start">
                        {log.status}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-1 block">{new Date(log.timestamp).toLocaleTimeString('vi-VN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm lg:col-span-4 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 block">Thao tác nhanh</h4>
                <div className="space-y-3">
                  <button
                    onClick={() => { setIsAddUserModalOpen(true); }}
                    className="w-full text-left text-xs p-3 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition font-bold text-gray-700 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between"
                  >
                    Tạo tài khoản Giảng viên / Đào tạo mới
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="w-full text-left text-xs p-3 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition font-bold text-gray-700 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between"
                  >
                    Bật tắt / Cấu hình Feature Flags
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleExportCSV('Hồ sơ học phí tổng hợp')}
                    className="w-full text-left text-xs p-3 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition font-bold text-gray-700 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between"
                  >
                    Xuất báo cáo tài chính sổ sách
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-6 bg-red-50 p-3 rounded-lg border border-red-100 text-[11px] text-red-800 leading-relaxed">
                🚨 <b>Giám đốc Lưu ý:</b> Mật khẩu tất cả tài khoản mẫu có sẵn dạng <i>Password@123</i>. Hãy nhắc nhở thành viên đổi mật khẩu ngay trong cấu hình profile cá nhân để bảo vệ dữ liệu.
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* 2. USER SECURITY & DIRECTORY CONTROL */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-fadeIn">
          
          {/* Top filtering controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Tìm tên, email, MCSVS..."
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                className="bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 rounded-lg px-3 py-2 text-xs outline-none w-52"
              />
              
              <select
                value={userRoleFilter}
                onChange={(e) => { setUserRoleFilter(e.target.value); setUserPage(1); }}
                className="bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-lg px-3 py-2 text-xs cursor-pointer outline-none"
              >
                <option value="all">Tất cả chức vụ</option>
                <option value="admin">Quản trị / Giám đốc</option>
                <option value="manager">Quản lý đào tạo</option>
                <option value="teacher">Giảng viên</option>
                <option value="student">Học viên / Sinh viên</option>
              </select>

              <select
                value={userStatusFilter}
                onChange={(e) => { setUserStatusFilter(e.target.value); setUserPage(1); }}
                className="bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-lg px-3 py-2 text-xs cursor-pointer outline-none"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Đã khoá / Nghỉ học</option>
              </select>
            </div>

            <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
              <button
                onClick={() => handleExportCSV('Danh_sach_thanh_vien')}
                className="btn-secondary px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Xuất file
              </button>
              <button
                onClick={() => setIsAddUserModalOpen(true)}
                className="btn-primary px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Tạo thành viên
              </button>
            </div>
          </div>

          {/* User Table grid */}
          <div className="table-wrapper">
            <table className="lms-table" style={{ contentVisibility: 'auto' }}>
              <thead>
                <tr>
                  <th>Họ và Tên</th>
                  <th>Email</th>
                  <th>Chức vụ</th>
                  <th className="text-center">Thao tác Slider (Status)</th>
                  <th>Ngày tham gia</th>
                  <th className="text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {currentUsersList.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full ${user.avatarColor || 'bg-blue-600 text-white'} flex items-center justify-center text-xs font-bold`}>
                          {user.avatarInitials}
                        </div>
                        <div>
                          <span className="font-bold text-gray-800 block">{user.name}</span>
                          {user.studentId && (
                            <span className="text-[10px] font-mono font-semibold text-gray-400 bg-gray-50 py-0.5 px-1.5 rounded-full">
                              MSSV: {user.studentId}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-xs">{user.email}</td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        user.role === 'admin' ? 'bg-red-100 text-red-700' :
                        user.role === 'manager' ? 'bg-indigo-100 text-indigo-700' :
                        user.role === 'teacher' ? 'bg-purple-100 text-purple-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`text-[10px] font-bold ${user.status === 'active' ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {user.status === 'active' ? 'Active' : 'Locked'}
                        </span>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={user.status === 'active'}
                            onChange={() => handleStatusToggle(user.id)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </td>
                    <td className="text-xs text-gray-500">
                      {new Date(user.joinedAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => handleResetPassword(user)}
                          title="Reset Password về MCNA@2026"
                          className="p-1 px-1.5 rounded bg-slate-100 hover:bg-amber-100 hover:text-amber-800 text-gray-500 transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          title="Xoá vĩnh viễn"
                          className="p-1 px-1.5 rounded bg-red-50 hover:bg-red-100 text-red-600 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {currentUsersList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400 text-xs">
                      Không tìm thấy thành viên nào trùng khớp bộ lọc hiện tại.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between pt-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-xs">
            <span className="text-gray-500 dark:text-gray-400">
              Hiển thị <b>{(userPage - 1) * usersPerPage + 1} – {Math.min(userPage * usersPerPage, filteredUsers.length)}</b> trong tổng số <b>{filteredUsers.length}</b> thành viên
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={userPage === 1}
                onClick={() => setUserPage(userPage - 1)}
                className="btn-secondary p-1 px-2 rounded disabled:opacity-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold py-1 px-3 bg-gray-100 rounded">Trang {userPage} / {totalUserPages}</span>
              <button
                disabled={userPage === totalUserPages}
                onClick={() => setUserPage(userPage + 1)}
                className="btn-secondary p-1 px-2 rounded disabled:opacity-50"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* 3. SYSTEM SETTINGS & PARAMETERS TAB */}
      {/* ========================================================= */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sm:p-6 animate-fadeIn">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Setting Categories Sidebar */}
            <div className="flex flex-col gap-1 border-r pr-4">
              <button
                onClick={() => setSettingsTab('general')}
                className={`text-left text-xs font-bold p-2.5 rounded-lg transition-all ${
                  settingsTab === 'general' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Thông tin & Ngôn ngữ
              </button>
              <button
                onClick={() => setSettingsTab('academic')}
                className={`text-left text-xs font-bold p-2.5 rounded-lg transition-all ${
                  settingsTab === 'academic' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Năm học & Thang điểm
              </button>
              <button
                onClick={() => setSettingsTab('security')}
                className={`text-left text-xs font-bold p-2.5 rounded-lg transition-all ${
                  settingsTab === 'security' ? 'bg-red-50 text-red-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Chính sách Security
              </button>
              <button
                onClick={() => setSettingsTab('flags')}
                className={`text-left text-xs font-bold p-2.5 rounded-lg transition-all ${
                  settingsTab === 'flags' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Công tắc Tính năng (Flags)
              </button>
            </div>

            {/* Set fields */}
            <div className="md:col-span-3 space-y-6">
              
              {settingsTab === 'general' && (
                <div className="space-y-4 animate-fadeIn">
                  <h5 className="text-sm font-bold text-gray-800 border-b pb-2 mb-4">Thông tin trường & ngôn ngữ tiêu chuẩn</h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tên trường thiết lập</label>
                      <input
                        type="text"
                        value={settingsForm.schoolName}
                        onChange={(e) => setSettingsForm({ ...settingsForm, schoolName: e.target.value })}
                        className="mt-1.5 w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white rounded-lg px-3 py-2 text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Timezone (Mũi giờ)</label>
                      <select
                        value={settingsForm.timezone}
                        onChange={(e) => setSettingsForm({ ...settingsForm, timezone: e.target.value })}
                        className="mt-1.5 w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs cursor-pointer outline-none"
                      >
                        <option value="Asia/Ho_Chi_Minh (UTC+07)">Asia/Ho_Chi_Minh (UTC+07)</option>
                        <option value="Asia/Tokyo (UTC+09)">Asia/Tokyo (UTC+09)</option>
                        <option value="Europe/London (UTC+00)">Europe/London (UTC+00)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ngôn ngữ giao tiếp gốc</label>
                      <select
                        value={settingsForm.language}
                        onChange={(e) => setSettingsForm({ ...settingsForm, language: e.target.value })}
                        className="mt-1.5 w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs cursor-pointer outline-none"
                      >
                        <option value="Tiếng Việt">Tiếng Việt (Vietnamese)</option>
                        <option value="English">English</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mẫu link Logo trường</label>
                      <input
                        type="text"
                        value={settingsForm.logoUrl}
                        onChange={(e) => setSettingsForm({ ...settingsForm, logoUrl: e.target.value })}
                        className="mt-1.5 w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white rounded-lg px-3 py-2 text-xs outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Thông tin liên hệ hotline chân trang</label>
                      <textarea
                        value={settingsForm.contactInfo}
                        onChange={(e) => setSettingsForm({ ...settingsForm, contactInfo: e.target.value })}
                        rows={3}
                        className="mt-1.5 w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white rounded-lg p-3 text-xs outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleSaveSettings('Thông tin General')}
                    className="btn-primary px-4 py-2 rounded-lg text-xs font-bold"
                  >
                    Lưu cấu hình General
                  </button>
                </div>
              )}

              {settingsTab === 'academic' && (
                <div className="space-y-4 animate-fadeIn">
                  <h5 className="text-sm font-bold text-gray-800 border-b pb-2 mb-4">Niên khóa đào tạo & thang điểm quy đổi</h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Năm học chính thức</label>
                      <input
                        type="text"
                        value={settingsForm.currentYear}
                        onChange={(e) => setSettingsForm({ ...settingsForm, currentYear: e.target.value })}
                        placeholder="vd: 2025-2026"
                        className="mt-1.5 w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Học kỳ active</label>
                      <input
                        type="text"
                        value={settingsForm.semesterName}
                        onChange={(e) => setSettingsForm({ ...settingsForm, semesterName: e.target.value })}
                        placeholder="vd: Học kỳ II"
                        className="mt-1.5 w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Hệ thang điểm quy định</label>
                      <select
                        value={settingsForm.gradingScale}
                        onChange={(e) => setSettingsForm({ ...settingsForm, gradingScale: e.target.value as any })}
                        className="mt-1.5 w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs cursor-pointer outline-none"
                      >
                        <option value="10">Hệ 10 (Chữ số Việt Nam truyền thống)</option>
                        <option value="4">Hệ 4 (Tín chỉ quy đổi GPA)</option>
                        <option value="A-F">Hệ chữ cái phổ quát quốc tế (A, B, C, D, E, F)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSaveSettings('Học thuật & Đào tạo')}
                    className="btn-primary px-4 py-2 rounded-lg text-xs font-bold"
                  >
                    Đồng bộ khung Đào Tạo
                  </button>
                </div>
              )}

              {settingsTab === 'security' && (
                <div className="space-y-4 animate-fadeIn">
                  <h5 className="text-sm font-bold text-gray-800 border-b pb-2 mb-4">Các tham số kiểm soát truy cập & khóa tài khoản</h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Số lần nhập lỗi tối đa cho phép</label>
                      <input
                        type="number"
                        value={lockoutAttempts}
                        onChange={(e) => setLockoutAttempts(e.target.value)}
                        className="mt-1.5 w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Thời gian phạt khoá tạm thời (Phút)</label>
                      <input
                        type="number"
                        value={lockoutTime}
                        onChange={(e) => setLockoutTime(e.target.value)}
                        className="mt-1.5 w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-red-50/50 border border-red-100">
                        <div>
                          <span className="text-xs font-bold text-red-900 block">Kích hoạt bảo mật 2 lớp chống rò rỉ (MFA)</span>
                          <span className="text-[10px] text-gray-500 block mt-0.5">Yêu cầu mã xác thực Google Authenticator khi phát hiện IP bất thường.</span>
                        </div>
                        <label className="toggle-switch">
                          <input type="checkbox" defaultChecked={true} />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSaveSettings('An Ninh & Bảo mật')}
                    className="btn-primary px-4 py-2 rounded-lg text-xs font-bold"
                  >
                    Lưu chính sách Security
                  </button>
                </div>
              )}

              {settingsTab === 'flags' && (
                <div className="space-y-4 animate-fadeIn">
                  <h5 className="text-sm font-bold text-gray-800 border-b pb-2 mb-4">Công tắc kích hoạt tính năng (Feature Flags Grid)</h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 border rounded-xl flex items-center justify-between bg-slate-50">
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">Học viên tự đăng ký</span>
                        <span className="text-[10px] text-gray-400">Cho phép tự tạo tài khoản Student ở cổng login</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={flagsForm.enableRegistration}
                          onChange={(e) => setFlagsForm({ ...flagsForm, enableRegistration: e.target.checked })}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="p-3 border rounded-xl flex items-center justify-between bg-slate-50">
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">Duyệt học phí online</span>
                        <span className="text-[10px] text-gray-400">Học sinh nộp học bổng và thanh toán trực tiếp</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={flagsForm.enableTuitionFeePayment}
                          onChange={(e) => setFlagsForm({ ...flagsForm, enableTuitionFeePayment: e.target.checked })}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="p-3 border rounded-xl flex items-center justify-between bg-slate-50">
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">Dự phóng GPA tự động</span>
                        <span className="text-[10px] text-gray-400">Tính năng giả lập điểm học kỳ cho sinh viên</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={flagsForm.enableGpaCalculator}
                          onChange={(e) => setFlagsForm({ ...flagsForm, enableGpaCalculator: e.target.checked })}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="p-3 border rounded-xl flex items-center justify-between bg-slate-50">
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">Bật Security Logs</span>
                        <span className="text-[10px] text-gray-400">Ghi vết và lịch sử hành động bảo mật của cán bộ</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={flagsForm.enableAuditLogs}
                          onChange={(e) => setFlagsForm({ ...flagsForm, enableAuditLogs: e.target.checked })}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="p-3 border rounded-xl flex items-center justify-between bg-slate-50">
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">Gửi thông báo rung chuông</span>
                        <span className="text-[10px] text-gray-400">Hệ thống thông báo đẩy tự động toàn học viện</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={flagsForm.enableNotifications}
                          onChange={(e) => setFlagsForm({ ...flagsForm, enableNotifications: e.target.checked })}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="p-3 border rounded-xl flex items-center justify-between bg-slate-50">
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">Khảo thí Trực tuyến (Exams)</span>
                        <span className="text-[10px] text-gray-400">Tổ chức thi phòng lab online chống gian lận</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={flagsForm.enableOnlineExams}
                          onChange={(e) => setFlagsForm({ ...flagsForm, enableOnlineExams: e.target.checked })}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSaveSettings('Feature Flags')}
                    className="btn-primary px-4 py-2 rounded-lg text-xs font-bold"
                  >
                    Áp dụng Feature Flags
                  </button>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* 4. RBAC PERMISSION MATRIX MODULATOR */}
      {/* ========================================================= */}
      {activeTab === 'rbac' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sm:p-6 animate-fadeIn space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900">Ma trận Phân Quyền Vai Trò (LMS State Roles Authorization)</h4>
              <p className="text-xs text-gray-400 mt-1">Bấm trực tiếp vào các ô tròn để chu kỳ gán quyền giữa các chức năng & nhóm thành viên.</p>
            </div>
            <button
              onClick={handleSaveMatrix}
              className="btn-primary py-2 px-4 rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              Lưu thay đổi ma trận
            </button>
          </div>

          <div className="table-wrapper">
            <table className="lms-table text-left">
              <thead>
                <tr>
                  <th>Yêu cầu tính năng / Module</th>
                  <th className="text-center font-bold text-red-600">Admin (Giám Đốc)</th>
                  <th className="text-center font-bold text-indigo-600">Manager (Phòng Đào Tạo)</th>
                  <th className="text-center font-bold text-purple-600">Teacher (Giảng viên)</th>
                  <th className="text-center font-bold text-emerald-600">Student (Học viên)</th>
                </tr>
              </thead>
              <tbody>
                {MATRIX_MODULES.map((mod) => (
                  <tr key={mod.id}>
                    <td className="font-bold text-xs text-gray-700">{mod.name}</td>
                    {ROLES_LIST.map((role) => {
                      const level = matrix[mod.id]?.[role] || 'None';
                      return (
                        <td key={role} className="text-center">
                          <button
                            type="button"
                            onClick={() => handlePermissionCellCycle(mod.id, role)}
                            className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider transition uppercase ${
                              level === 'Full' ? 'bg-red-100 text-red-800 border border-red-200' :
                              level === 'Scoped' ? 'bg-indigo-100 text-indigo-800' :
                              level === 'Read-only' ? 'bg-amber-150 text-amber-800 bg-amber-50' :
                              'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {level}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-4 items-center pt-2 text-[11px] text-gray-500">
            <span className="font-bold uppercase text-gray-700">Ghi chú phân quyền:</span>
            <span className="flex items-center gap-1">
              <b className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 uppercase text-[9px] font-black">Full</b> Đầy đủ thao tác Thêm, Sửa, Xoá, Nhập xuất
            </span>
            <span className="flex items-center gap-1">
              <b className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 uppercase text-[9px] font-black">Scoped</b> Thao tác giới hạn trong phạm vi quản lý
            </span>
            <span className="flex items-center gap-1">
              <b className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 uppercase text-[9px] font-black">Read-Only</b> Chỉ được quyền xem báo cáo & thông tin
            </span>
            <span className="flex items-center gap-1">
              <b className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 uppercase text-[9px] font-black">None</b> Hoàn toàn không được phép truy cập
            </span>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* 5. SECURITY AUDIT LOG VIEWER */}
      {/* ========================================================= */}
      {activeTab === 'audit' && (
        <div className="space-y-4 animate-fadeIn">
          
          <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Lọc sự kiện, email user..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-lg px-3 py-2 text-xs outline-none w-52"
              />
              
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-lg px-3 py-2 text-xs cursor-pointer outline-none"
              >
                <option value="all">Tất cả hành động</option>
                <option value="Login">Đăng nhập</option>
                <option value="Create">Tạo dữ liệu</option>
                <option value="Update">Thay đổi cấu hình</option>
                <option value="Export">Xuất báo cáo</option>
              </select>
            </div>

            <button
              onClick={() => handleExportCSV('Audit_logs_bao_mat')}
              className="btn-secondary px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0"
            >
              <Download className="w-4 h-4" />
              Tải xuất file kiểm toán (CSV)
            </button>
          </div>

          <div className="table-wrapper">
            <table className="lms-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Cán bộ chịu trách nhiệm</th>
                  <th>Hành động thực thi</th>
                  <th>Tài nguyên tác động</th>
                  <th>Địa chỉ IP</th>
                  <th className="text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs
                  .filter(log => {
                    const matchQ =
                      log.userName.toLowerCase().includes(auditSearch.toLowerCase()) ||
                      log.userEmail.toLowerCase().includes(auditSearch.toLowerCase()) ||
                      log.action.toLowerCase().includes(auditSearch.toLowerCase());
                    
                    const matchAct = auditActionFilter === 'all' ? true : log.action.toLowerCase().includes(auditActionFilter.toLowerCase());
                    return matchQ && matchAct;
                  })
                  .map((log) => (
                    <tr key={log.id}>
                      <td className="font-mono text-xs">{new Date(log.timestamp).toLocaleString('vi-VN')}</td>
                      <td>
                        <div className="flex flex-col text-xs">
                          <span className="font-bold text-gray-800">{log.userName}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{log.userEmail}</span>
                        </div>
                      </td>
                      <td className="font-semibold text-xs text-gray-800">{log.action}</td>
                      <td className="text-xs text-gray-650">{log.resource}</td>
                      <td className="font-mono text-xs text-gray-400">{log.ip}</td>
                      <td className="text-right">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] bg-green-50 text-green font-bold">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* 6. CREATE USER MODAL SYSTEM */}
      {/* ========================================================= */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-md w-full p-5 sm:p-6 animate-fadeIn">
            <h4 className="text-md font-black text-gray-900 border-b pb-2 mb-4">Tạo tài khoản thành viên mới</h4>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Họ và tên thành viên</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Họ tên đầy đủ"
                  className="mt-1 w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Email học viện cấp</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@lms.vn"
                  className="mt-1 w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mật khẩu ban đầu</label>
                  <input
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="vd: Password@123"
                    className="mt-1 w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Chức vụ vai trò</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="mt-1 w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs cursor-pointer outline-none"
                  >
                    <option value="admin">Quản trị cấp cao (Admin)</option>
                    <option value="manager">Nhân viên Đào Tạo (Manager)</option>
                    <option value="teacher">Giảng viên (Teacher)</option>
                    <option value="student">Học sinh / Sinh viên (Student)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Số điện thoại liên lạc</label>
                <input
                  type="text"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  placeholder="091 xxx xxxx"
                  className="mt-1 w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>

              {newUserRole === 'student' && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Chuyên ngành học</label>
                  <select
                    value={newUserMajor}
                    onChange={(e) => setNewUserMajor(e.target.value)}
                    className="mt-1 w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs cursor-pointer outline-none"
                  >
                    <option value="Kỹ thuật Phần mềm (Software Engineering)">Kỹ thuật Phần mềm (Software Engineering)</option>
                    <option value="Khoa học Máy tính & AI (Computer Science & AI)">Khoa học Máy tính & AI (Computer Science & AI)</option>
                    <option value="An toàn Thông tin (Cyber Security)">An toàn Thông tin (Cyber Security)</option>
                    <option value="Thiết kế Đồ họa & UI/UX (Graphic & UI/UX Design)">Thiết kế Đồ họa & UI/UX (Graphic & UI/UX Design)</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="btn-secondary py-2 px-4 rounded-lg text-xs font-bold"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2 px-4 rounded-lg text-xs font-bold"
                >
                  Tạo mới ngay
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
