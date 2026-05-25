import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Eye, EyeOff, Check, X, Shield, Users, Award, BookOpen, AlertCircle, Sparkles } from 'lucide-react';

interface AuthPagesProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
  onRegisterSuccess: (newUser: User) => void;
  toast: (msg: string, type: 'success' | 'error' | 'info' | 'warn') => void;
}

const COMMON_PASSWORDS = [
  '12345678', 'password', '123456789', 'password111', 'Admin@123', 'Student@123',
  '12345678a', 'admin123', 'qwertyui', 'iloveyou'
];

const MAJORS = [
  'Kỹ thuật Phần mềm (Software Engineering)',
  'Khoa học Máy tính (Computer Science & AI)',
  'An toàn Thông tin (Cyber Security)',
  'Hệ thống Thông tin quản lý (MIS)'
];

export const AuthPages: React.FC<AuthPagesProps> = ({
  users,
  onLoginSuccess,
  onRegisterSuccess,
  toast
}) => {
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Registration Multi-step states (Step 1, 2, 3)
  const [step, setStep] = useState(1);
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regGender, setRegGender] = useState('Nam');
  const [regDob, setRegDob] = useState('');
  
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirmPass, setRegConfirmPass] = useState('');
  const [isPassFocused, setIsPassFocused] = useState(false);

  const [regMajor, setRegMajor] = useState('Kỹ thuật Phần mềm (Software Engineering)');
  const [regGradYear, setRegGradYear] = useState('2028');
  const [regReferral, setRegReferral] = useState('');
  const [regTermsAccepted, setRegTermsAccepted] = useState(false);

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Password validation engine (Checks rules based on guidelines)
  const checkPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'Trống', color: 'bg-gray-200', checklist: { len: false, upper: false, lower: false, num: false, spec: false, uncommon: true } };
    
    const checklist = {
      len: pwd.length >= 8,
      upper: /[A-Z]/.test(pwd),
      lower: /[a-z]/.test(pwd),
      num: /[0-9]/.test(pwd),
      spec: /[^A-Za-z0-9]/.test(pwd),
      uncommon: !COMMON_PASSWORDS.includes(pwd.toLowerCase())
    };

    let score = 0;
    if (checklist.len) score++;
    if (checklist.upper && checklist.lower) score++;
    if (checklist.num) score++;
    if (checklist.spec) score++;
    if (pwd.length > 11) score++;

    let label = 'Yếu';
    let color = 'bg-red-500';

    if (score >= 4) {
      label = 'Rất mạnh';
      color = 'bg-emerald-500';
    } else if (score === 3) {
      label = 'Mạnh';
      color = 'bg-green-500';
    } else if (score === 2) {
      label = 'Trung bình';
      color = 'bg-amber-500';
    }

    return { score, label, color, checklist };
  };

  const strength = checkPasswordStrength(regPass);

  // Trigger login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast('Vui lòng điền đầy đủ email và mật khẩu.', 'warn');
      return;
    }

    setIsLoggingIn(true);
    
    // Simulate API network latency response
    setTimeout(() => {
      const matched = users.find(
        u => u.email.toLowerCase() === loginEmail.toLowerCase() && u.password === loginPassword
      );

      setIsLoggingIn(false);

      if (matched) {
        if (matched.status === 'inactive') {
          toast('Tài khoản này đã bị khoá bởi Quản trị viên!', 'error');
          return;
        }
        toast(`Chào mừng quay trở lại, ${matched.name}!`, 'success');
        onLoginSuccess(matched);
      } else {
        toast('Thông tin đăng nhập không hợp lệ. Vui lòng kiểm tra lại!', 'error');
      }
    }, 800);
  };

  // Demo accounts prefill
  const handleQuickSelectDemo = (role: UserRole) => {
    let email = '';
    let pass = '';
    
    switch(role) {
      case 'admin':
        email = 'admin@lms.vn';
        pass = 'Admin@123';
        break;
      case 'manager':
        email = 'manager@lms.vn';
        pass = 'Manager@123';
        break;
      case 'teacher':
        email = 'teacher@lms.vn';
        pass = 'Teacher@123';
        break;
      case 'student':
        email = 'student@lms.vn';
        pass = 'Student@123';
        break;
    }

    setLoginEmail(email);
    setLoginPassword(pass);
    toast(`Đã điền tự động tài khoản demo: ${role.toUpperCase()}`, 'info');
  };

  // Registration workflows
  const handleRegisterNext = () => {
    if (step === 1) {
      if (!regName.trim() || !regPhone.trim() || !regDob) {
        toast('Vui lòng hoàn thành mọi trường thông tin cá nhân bắt buộc.', 'warn');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(regEmail)) {
        toast('Định dạng email không hợp lệ.', 'error');
        return;
      }
      // check uniqueness
      const alreadyExists = users.some(u => u.email.toLowerCase() === regEmail.toLowerCase());
      if (alreadyExists) {
        toast('Email này đã được đăng ký trên hệ thống!', 'error');
        return;
      }
      if (strength.score < 2) {
        toast('Mật khẩu quá yếu! Hãy tạo mật khẩu mạnh hơn.', 'error');
        return;
      }
      if (regPass !== regConfirmPass) {
        toast('Xác nhận mật khẩu không trùng khớp.', 'error');
        return;
      }
      setStep(3);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regTermsAccepted) {
      toast('Bạn cần đồng ý với các Điều khoản & Quy định học tập để tiếp tục.', 'warn');
      return;
    }

    const initials = regName.split(' ').map(n => n[0]).join('').slice(-2);
    const mockStudentId = `MCNA-2026-${String(users.filter(u => u.role === 'student').length + 1).padStart(3, '0')}`;
    
    const newStudent: User = {
      id: `u-student-${Date.now()}`,
      email: regEmail,
      password: regPass,
      name: regName,
      role: 'student',
      avatarInitials: initials,
      avatarColor: 'bg-emerald-600 text-white',
      status: 'active',
      joinedAt: new Date().toISOString(),
      phone: regPhone,
      major: regMajor,
      studentId: mockStudentId,
      gender: regGender,
      dob: regDob,
      gpa: 4.0 // fresh student
    };

    onRegisterSuccess(newStudent);
    toast('Đăng ký tài khoản thành công! Tự động khởi tạo phiên học viên.', 'success');
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(forgotEmail)) {
      toast('Vui lòng nhập định dạng email hợp lệ.', 'error');
      return;
    }
    
    setForgotSubmitted(true);
    toast(`Hướng dẫn khôi phục mật khẩu đã được gửi về: ${forgotEmail}`, 'success');
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-gray-50 text-gray-800">
      
      {/* 1. Left side branding panel */}
      <div className="lg:col-span-5 bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800 p-8 lg:p-12 flex flex-col justify-between text-white relative overflow-hidden">
        {/* Abstract circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-xl"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-indigo-500/20 blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg">
              <span className="text-xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">M</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">MCNA</h1>
              <p className="text-[10px] uppercase font-bold tracking-wider text-blue-200">Technology School</p>
            </div>
          </div>
        </div>

        <div className="my-12 relative z-10 max-w-sm">
          <span className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold text-blue-100 mb-4 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            LMS Pro v2.5 Enterprise
          </span>
          <h2 className="text-3xl font-black leading-tight tracking-tight">Cổng Học Tập Số Hoá Hàng Đầu</h2>
          <p className="mt-4 text-sm text-blue-100/90 leading-relaxed">
            Hệ thống quản lý giảng dạy thông minh kết nối Giám Đốc, Đào Tạo viên, Giảng viên hàng đầu và Hàng ngàn học viên công nghệ chuyên sâu.
          </p>
        </div>

        <div className="border-t border-white/15 pt-6 relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-4 text-xs text-blue-100/80">
            <div className="flex -space-x-2">
              <span className="w-7 h-7 rounded-full bg-amber-400 border border-white flex items-center justify-center text-[10px] font-bold text-gray-900">MC</span>
              <span className="w-7 h-7 rounded-full bg-blue-400 border border-white flex items-center justify-center text-[10px] font-bold text-gray-900">HN</span>
              <span className="w-7 h-7 rounded-full bg-purple-400 border border-white flex items-center justify-center text-[10px] font-bold text-white">TH</span>
            </div>
            <span>+500 thành viên MCNA đang kích hoạt học tập hôm nay</span>
          </div>
          <p className="text-[10px] text-blue-200/60">
            © 2026 MCNA Tech School. Developed with maximum security standards.
          </p>
        </div>
      </div>

      {/* 2. Authentication forms (Right Panels) */}
      <div className="lg:col-span-7 flex items-center justify-center p-6 sm:p-12 md:p-16 lg:p-24 bg-white">
        
        {authView === 'login' && (
          <div className="w-full max-w-md animate-fadeIn">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Đăng Nhập</h3>
            <p className="text-xs text-gray-500 mt-1">Truy cập vào không gian lưu trữ và lớp học MCNA của bạn</p>

            <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Email học viện</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@lms.vn"
                  className="mt-1.5 w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 rounded-lg px-3.5 py-2.5 text-sm transition-all duration-200 outline-none"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Mật khẩu</label>
                  <button
                    type="button"
                    onClick={() => setAuthView('forgot')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 transition"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative mt-1.5">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 rounded-lg px-3.5 py-2.5 pr-10 text-sm transition-all duration-200 outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 text-xs font-medium text-gray-600 cursor-pointer select-none">
                  Lưu đăng nhập của tôi (Remember Session)
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full btn-primary py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
              >
                {isLoggingIn ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Đăng Nhập Ngay'
                )}
              </button>
            </form>

            <div className="mt-6 border-t pt-4">
              <span className="block text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">🎭 Phiên Demo - Bấm tự điền để thử nghiệm nhanh</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickSelectDemo('admin')}
                  className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-100 hover:bg-red-100/50 text-red-700 transition duration-150 justify-center text-xs font-bold shadow-sm"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Giám đốc (Admin)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelectDemo('manager')}
                  className="flex items-center gap-2 p-2 rounded-lg bg-indigo-50 border border-indigo-100 hover:bg-indigo-100/50 text-indigo-700 transition duration-150 justify-center text-xs font-bold shadow-sm"
                >
                  <Users className="w-3.5 h-3.5" />
                  Đào tạo (Manager)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelectDemo('teacher')}
                  className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 border border-purple-100 hover:bg-purple-100/50 text-purple-700 transition duration-150 justify-center text-xs font-bold shadow-sm"
                >
                  <Award className="w-3.5 h-3.5" />
                  Giảng viên (Teacher)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelectDemo('student')}
                  className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-100 hover:bg-emerald-100/50 text-emerald-700 transition duration-150 justify-center text-xs font-bold shadow-sm"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Học viên (Student)
                </button>
              </div>
            </div>

            <div className="mt-8 text-center bg-gray-50 border border-gray-100 p-3 rounded-lg">
              <span className="text-xs text-gray-500">Chưa có tài khoản học tập học viên? </span>
              <button
                onClick={() => { setAuthView('register'); setStep(1); }}
                className="text-xs font-black text-blue-600 hover:underline inline-block focus:outline-none"
              >
                Tự đăng ký ngay (Học Viên)
              </button>
            </div>
          </div>
        )}

        {authView === 'register' && (
          <div className="w-full max-w-md animate-fadeIn">
            {/* Step indicators of Prompt Multi-Step Form */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Đăng Ký Học Viên</h3>
              <span className="text-xs font-mono font-bold text-gray-400">Bước {step}/3</span>
            </div>

            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                    s <= step ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gray-100'
                  }`}
                />
              ))}
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              
              {/* STEP 1: Personal Info */}
              {step === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Họ và Tên (Tiếng Việt đầy đủ)</label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="vd: Nguyễn Văn A"
                      className="mt-1.5 w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 rounded-lg px-3.5 py-2.5 text-sm transition-all duration-200 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Số điện thoại liên hệ</label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="091 xxx xxxx"
                      className="mt-1.5 w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 rounded-lg px-3.5 py-2.5 text-sm transition-all duration-200 outline-none"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-bold">Giới Tính</label>
                      <select
                        value={regGender}
                        onChange={(e) => setRegGender(e.target.value)}
                        className="mt-1.5 w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 rounded-lg px-3.5 py-2.5 text-sm transition duration-200 outline-none cursor-pointer"
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Ngày sinh</label>
                      <input
                        type="date"
                        value={regDob}
                        onChange={(e) => setRegDob(e.target.value)}
                        className="mt-1.5 w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 rounded-lg px-3.5 py-2.5 text-sm transition duration-200 outline-none cursor-pointer"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Account setup */}
              {step === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Địa chỉ Email</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="example@lms.vn"
                      className="mt-1.5 w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 rounded-lg px-3.5 py-2.5 text-sm transition duration-200 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Mật khẩu mới</label>
                    <input
                      type="password"
                      value={regPass}
                      onChange={(e) => setRegPass(e.target.value)}
                      onFocus={() => setIsPassFocused(true)}
                      onBlur={() => setIsPassFocused(false)}
                      placeholder="••••••••"
                      className="mt-1.5 w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 rounded-lg px-3.5 py-2.5 text-sm transition duration-200 outline-none"
                      required
                    />

                    {/* Password Strength Indicator Visual Panel */}
                    <div className="mt-2.5 space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-gray-500 uppercase tracking-wider">Độ mạnh mật khẩu:</span>
                        <span className="text-gray-800">{strength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden flex gap-0.5">
                        <div className={`h-full flex-1 transition ${strength.score >= 1 ? strength.color : 'bg-gray-200'}`} />
                        <div className={`h-full flex-1 transition ${strength.score >= 2 ? strength.color : 'bg-gray-200'}`} />
                        <div className={`h-full flex-1 transition ${strength.score >= 3 ? strength.color : 'bg-gray-200'}`} />
                        <div className={`h-full flex-1 transition ${strength.score >= 4 ? strength.color : 'bg-gray-200'}`} />
                      </div>

                      {/* Checklist Rules showing on real time */}
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1.5 text-[10px] text-gray-500 border-t border-slate-200/50">
                        <span className="flex items-center gap-1">
                          {strength.checklist.len ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-red-500" />}
                          Tối thiểu 8 ký tự
                        </span>
                        <span className="flex items-center gap-1">
                          {strength.checklist.upper ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-red-500" />}
                          Ký tự hoa [A-Z]
                        </span>
                        <span className="flex items-center gap-1">
                          {strength.checklist.lower ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-red-500" />}
                          Ký tự thường [a-z]
                        </span>
                        <span className="flex items-center gap-1">
                          {strength.checklist.num ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-red-500" />}
                          Có chữ số [0-9]
                        </span>
                        <span className="flex items-center gap-1">
                          {strength.checklist.spec ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-red-500" />}
                          Ký tự đặc biệt (!@#)
                        </span>
                        <span className="flex items-center gap-1">
                          {strength.checklist.uncommon ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-red-500" />}
                          Tránh mật khẩu mẫu
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Xác nhận mật khẩu</label>
                    <input
                      type="password"
                      value={regConfirmPass}
                      onChange={(e) => setRegConfirmPass(e.target.value)}
                      placeholder="••••••••"
                      className="mt-1.5 w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 rounded-lg px-3.5 py-2.5 text-sm transition duration-200 outline-none"
                      required
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Academic & Submit */}
              {step === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Chuyên ngành định hướng</label>
                    <select
                      value={regMajor}
                      onChange={(e) => setRegMajor(e.target.value)}
                      className="mt-1.5 w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 rounded-lg px-3.5 py-2.5 text-sm transition duration-200 outline-none cursor-pointer"
                    >
                      {MAJORS.map((m, idx) => (
                        <option key={idx} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Năm tốt nghiệp mong đợi</label>
                      <input
                        type="number"
                        min="2026"
                        max="2035"
                        value={regGradYear}
                        onChange={(e) => setRegGradYear(e.target.value)}
                        className="mt-1.5 w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 rounded-lg px-3.5 py-2.5 text-sm transition duration-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Mã giới thiệu (Nếu có)</label>
                      <input
                        type="text"
                        value={regReferral}
                        onChange={(e) => setRegReferral(e.target.value)}
                        placeholder="vd: MCNA-PRO"
                        className="mt-1.5 w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 rounded-lg px-3.5 py-2.5 text-sm transition duration-200 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-start bg-slate-50 p-3 rounded-lg border border-slate-100 mt-4">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={regTermsAccepted}
                      onChange={(e) => setRegTermsAccepted(e.target.checked)}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="terms" className="ml-2 text-xs text-gray-500 cursor-pointer select-none leading-relaxed">
                      Tôi xác nhận các thông tin cá nhân và cam kết tuân thủ Quy chế Bản quyền phần mềm & Điều lệ Liêm chính học thuật của MCNA.
                    </label>
                  </div>
                </div>
              )}

              {/* Multi Step Buttons */}
              <div className="flex gap-3 pt-6">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="flex-1 btn-secondary py-3 rounded-lg text-sm font-bold text-center"
                  >
                    Quay lại
                  </button>
                )}
                
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleRegisterNext}
                    className="flex-1 btn-primary py-3 rounded-lg text-sm font-bold text-center"
                  >
                    Tiếp tục
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRegisterSubmit}
                    className="flex-1 btn-primary py-3 rounded-lg text-sm font-bold text-center"
                  >
                    Đăng Ký Hoàn Tất
                  </button>
                )}
              </div>
            </form>

            <div className="mt-8 text-center pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-500">Đã kích hoạt tài khoản MCNA trước đó? </span>
              <button
                onClick={() => setAuthView('login')}
                className="text-xs font-bold text-blue-600 hover:underline inline-block focus:outline-none"
              >
                Quay vế đăng nhập
              </button>
            </div>
          </div>
        )}

        {authView === 'forgot' && (
          <div className="w-full max-w-md animate-fadeIn">
            {!forgotSubmitted ? (
              <div className="animate-fadeIn">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Quên Mật Khẩu?</h3>
                <p className="text-xs text-gray-500 mt-1">Nhập email cung cấp cho Học viện để nhận đường dẫn thay đổi mật khẩu tức thời.</p>

                <form onSubmit={handleForgotSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Địa chỉ email</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="account@lms.vn"
                      className="mt-1.5 w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 rounded-lg px-3.5 py-2.5 text-sm transition duration-200 outline-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full btn-primary py-3 rounded-lg text-sm font-bold flex items-center justify-center"
                  >
                    Gửi Liên Kết Đặt Lại
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-center py-6 animate-fadeIn">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600 mb-4">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Kiểm tra Hộp Thư!</h3>
                <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
                  Chúng tôi đã gửi email phục hồi mật khẩu đến địa chỉ <b className="text-gray-800">{forgotEmail}</b>. Vui lòng làm theo hướng dẫn trong email để truy cập lại hệ thống.
                </p>
                
                <button
                  type="button"
                  onClick={() => { setForgotSubmitted(false); setAuthView('login'); }}
                  className="mt-6 btn-secondary px-6 py-2.5 rounded-lg text-xs font-bold"
                >
                  Trở lại màn hình chính
                </button>
              </div>
            )}

            {!forgotSubmitted && (
              <div className="mt-8 text-center pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setAuthView('login')}
                  className="text-xs font-bold text-blue-600 hover:underline outline-none"
                >
                  Về trang đăng nhập
                </button>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
