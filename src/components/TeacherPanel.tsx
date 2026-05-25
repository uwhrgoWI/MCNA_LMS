import React, { useState, useMemo } from 'react';
import { User, Course, Assignment, Submission, GradeRecord } from '../types';
import {
  BookOpen, Clock, AlertCircle, Plus, Edit2, Check, Download, ClipboardList,
  Calendar, Award, Users, FileText, ChevronRight, CornerDownRight, CheckCircle2
} from 'lucide-react';

interface TeacherPanelProps {
  currentUser: User;
  users: User[];
  courses: Course[];
  assignments: Assignment[];
  grades: GradeRecord[];
  onUpdateCourses: (newCourses: Course[]) => void;
  onUpdateAssignments: (newAssignments: Assignment[]) => void;
  onUpdateGrades: (newGrades: GradeRecord[]) => void;
  onAddAuditLog: (action: string, resource: string) => void;
  toast: (msg: string, type: 'success' | 'error' | 'info' | 'warn') => void;
}

export const TeacherPanel: React.FC<TeacherPanelProps> = ({
  currentUser,
  users,
  courses,
  assignments,
  grades,
  onUpdateCourses,
  onUpdateAssignments,
  onUpdateGrades,
  onAddAuditLog,
  toast
}) => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseSubTab, setCourseSubTab] = useState<'overview' | 'students' | 'materials' | 'assignments' | 'grades' | 'attendance'>('overview');

  // Interactive Gradebook state variables
  const [selectedCourseId, setSelectedCourseId] = useState<string>('c-1');
  const [editingGradeCell, setEditingGradeCell] = useState<{ recordId: string; field: 'attendance' | 'midterm' | 'final' | 'assignments_avg' } | null>(null);
  const [editGradeValue, setEditGradeValue] = useState<string>('');

  // Course Assignments states
  const [isAddAssignmentOpen, setIsAddAssignmentOpen] = useState(false);
  const [newAssignmentTitle, setNewAssignmentTitle] = useState('');
  const [newAssignmentDue, setNewAssignmentDue] = useState('2026-06-25T23:59');
  const [newAssignmentInstructions, setNewAssignmentInstructions] = useState('');
  const [newAssignmentMaxScore, setNewAssignmentMaxScore] = useState(10);

  // Grade Paper submissions
  const [selectedAssignmentForGrading, setSelectedAssignmentForGrading] = useState<Assignment | null>(null);
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [scoreInput, setScoreInput] = useState<number>(10);
  const [feedbackInput, setFeedbackInput] = useState('');

  // Attendance Sheet state
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'present' | 'absent' | 'late'>>({});

  // ==========================
  // --- CHOOSE CURRENT TEACHER COURSES ---
  // ==========================
  const myCourses = useMemo(() => {
    return courses.filter(c => c.teacherId === currentUser.id);
  }, [courses, currentUser]);

  const assignmentsPendingGrading = useMemo(() => {
    let count = 0;
    assignments.forEach(a => {
      const course = courses.find(cc => cc.id === a.courseId);
      if (course?.teacherId === currentUser.id) {
        a.submissions.forEach(sub => {
          if (sub.grade === undefined) count++;
        });
      }
    });
    return count;
  }, [assignments, courses, currentUser]);

  // GPA computing engine matching Vietnamese credit guidelines
  const calculateGPAAndGrade = (attendance: number, assignments: number, midterm: number, final: number) => {
    // Standard Vietnamese formula: Attendance (10%), Assignments/Labs (20%), Midterm (30%), Final (40%)
    const score10 = (attendance * 0.1) + (assignments * 0.2) + (midterm * 0.3) + (final * 0.4);
    const score = parseFloat((score10 / 10).toFixed(2)); // convert index

    let gpa4 = 0;
    let letter = 'F';

    if (score10 >= 8.5) {
      gpa4 = 4.0;
      letter = 'A';
    } else if (score10 >= 8.0) {
      gpa4 = 3.5;
      letter = 'B+';
    } else if (score10 >= 7.0) {
      gpa4 = 3.0;
      letter = 'B';
    } else if (score10 >= 6.5) {
      gpa4 = 2.5;
      letter = 'C+';
    } else if (score10 >= 5.5) {
      gpa4 = 2.0;
      letter = 'C';
    } else if (score10 >= 5.0) {
      gpa4 = 1.5;
      letter = 'D+';
    } else if (score10 >= 4.0) {
      gpa4 = 1.0;
      letter = 'D';
    } else {
      gpa4 = 0.0;
      letter = 'F';
    }

    return {
      finalWeighted: parseFloat(score10.toFixed(1)),
      gpa4,
      letter
    };
  };

  // --- INTERACTIVE INLINE CELLS SAVE ---
  const handleGradeCellEditStart = (recordId: string, field: 'attendance' | 'midterm' | 'final' | 'assignments_avg', currentVal: number) => {
    setEditingGradeCell({ recordId, field });
    setEditGradeValue(String(currentVal));
  };

  const handleGradeCellEditSave = (recordId: string) => {
    if (!editingGradeCell) return;
    
    const parsed = parseFloat(editGradeValue);
    if (isNaN(parsed) || parsed < 0 || parsed > (editingGradeCell.field === 'attendance' ? 100 : 10)) {
      toast('Điểm số điền vào không hợp lệ (Điểm từ 0-10, Chuyên cần từ 0-100).', 'error');
      setEditingGradeCell(null);
      return;
    }

    const updated = grades.map(g => {
      if (g.id === recordId) {
        return {
          ...g,
          [editingGradeCell.field]: parsed
        };
      }
      return g;
    });

    onUpdateGrades(updated);
    setEditingGradeCell(null);
    toast('Đã lưu điểm số trực tiếp thành công!', 'success');
  };

  // --- SAVE ASSIGNMENT BUILD ---
  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignmentTitle || !selectedCourse) {
      toast('Tên bài kiểm tra trống!', 'warn');
      return;
    }

    const newAssignment: Assignment = {
      id: `a-${Date.now()}`,
      courseId: selectedCourse.id,
      courseName: selectedCourse.name,
      title: newAssignmentTitle,
      instructions: newAssignmentInstructions,
      dueDate: new Date(newAssignmentDue).toISOString(),
      maxScore: newAssignmentMaxScore,
      status: 'open',
      submissions: []
    };

    onUpdateAssignments([newAssignment, ...assignments]);
    setIsAddAssignmentOpen(false);
    toast(`Đã gán thành công bài tập mới: ${newAssignmentTitle}`, 'success');
    onAddAuditLog('Create assignment homework task', `Course ${selectedCourse.code}`);

    // reset forms
    setNewAssignmentTitle('');
    setNewAssignmentInstructions('');
  };

  // --- SUBMISSIONS GRADING PROCESSES ---
  const handleOpenGradingWindow = (submission: Submission, assignment: Assignment) => {
    setGradingSubmission(submission);
    setSelectedAssignmentForGrading(assignment);
    setScoreInput(submission.grade !== undefined ? submission.grade : assignment.maxScore);
    setFeedbackInput(submission.feedback || '');
    setIsGradingModalOpen(true);
  };

  const handleSaveSubmissionGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission || !selectedAssignmentForGrading) return;

    if (scoreInput < 0 || scoreInput > selectedAssignmentForGrading.maxScore) {
      toast(`Điểm số phải nằm trong khoảng 0 - ${selectedAssignmentForGrading.maxScore}`, 'error');
      return;
    }

    const updatedAssignments = assignments.map(a => {
      if (a.id === selectedAssignmentForGrading.id) {
        const updatedSubs = a.submissions.map(sub => {
          if (sub.studentId === gradingSubmission.studentId) {
            return {
              ...sub,
              grade: scoreInput,
              feedback: feedbackInput
            };
          }
          return sub;
        });
        return { ...a, submissions: updatedSubs };
      }
      return a;
    });

    onUpdateAssignments(updatedAssignments);
    setIsGradingModalOpen(false);
    toast('Đã cập nhật điểm thi đua & phản hồi học viên!', 'success');
    
    // Also update average in grades table for calculations
    const parentCourseG = grades.find(g => g.studentId === gradingSubmission.studentId && g.courseId === selectedAssignmentForGrading.courseId);
    if (parentCourseG) {
      const updatedGrades = grades.map(g => {
        if (g.id === parentCourseG.id) {
          // just simulate update average
          return {
            ...g,
            assignments_avg: parseFloat(((g.assignments_avg + (scoreInput / (selectedAssignmentForGrading.maxScore === 100 ? 10 : 1))) / 2).toFixed(1))
          };
        }
        return g;
      });
      onUpdateGrades(updatedGrades);
    }
  };

  // --- ATTENDANCE SYSTEM ---
  const handleMarkAllAttendance = (status: 'present' | 'absent' | 'late', studentIds: string[]) => {
    const updated: Record<string, 'present' | 'absent' | 'late'> = {};
    studentIds.forEach(id => {
      updated[id] = status;
    });
    setAttendanceRecords(updated);
    toast(`Đã cài tất cả học viên lớp thành: ${status.toUpperCase()}`, 'info');
  };

  const handleSaveAttendance = () => {
    toast(`Đã điểm danh hoàn thành lớp Ngày ${attendanceDate}. Biên bản học tập đã sao lưu!`, 'success');
    onAddAuditLog('Submit daily class attendance record', `Course ${selectedCourse?.code || 'All'}`);
  };

  const handleExportCSV = (type: string) => {
    toast(`Tải xuất ${type} dạng file bảng tính Microsoft Excel (.csv)...`, 'info');
    setTimeout(() => {
      toast(`Xuất dữ liệu ${type} thành công.`, 'success');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      
      {/* Upper header */}
      <div className="flex flex-wrap items-center justify-between border-b pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-gray-900">Bàn Làm Việc Giảng Viên (Instructor Portal)</h2>
            <p className="text-xs text-gray-500">Giảng dạy lớp chuyên đề: ThS. {currentUser.name}</p>
          </div>
        </div>

        {selectedCourse && (
          <button
            onClick={() => setSelectedCourse(null)}
            className="btn-secondary py-2 px-3.5 rounded-lg text-xs font-bold flex items-center gap-1"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Trở lại danh sách lớp
          </button>
        )}
      </div>

      {/* ========================================================= */}
      {/* 1. TEACHER WELCOME BANNER & COURSE GRID */}
      {/* ========================================================= */}
      {!selectedCourse ? (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="bg-gradient-to-r from-purple-800 to-indigo-800 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
            <div className="relative z-10 max-w-lg">
              <h3 className="text-xl font-black">Chào ngày mới tốt lành, ThS. {currentUser.name}!</h3>
              <p className="text-xs text-purple-100/80 leading-relaxed mt-2">
                Hôm nay bạn có ca dạy học phần tại Phòng Lab. Hãy kiểm tra sổ bài tập thi đua và hoàn thiện sổ điểm cuối kỳ theo hướng dẫn Đào tạo.
              </p>
            </div>
            
            <div className="flex gap-4 shrink-0 text-center text-white relative z-10 bg-white/10 p-3.5 rounded-xl backdrop-blur-xs border border-white/10">
              <div>
                <span className="text-2xl font-mono font-bold">{myCourses.length}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider block text-purple-200 mt-1">Lớp giảng dạy</span>
              </div>
              <div className="border-r border-white/15"></div>
              <div>
                <span className="text-2xl font-mono font-bold text-amber-300">{assignmentsPendingGrading}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider block text-purple-200 mt-1">Bài cần chấm</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lớp học phần của tôi đảm nhận</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {myCourses.map(c => (
                <div
                  key={c.id}
                  onClick={() => { setSelectedCourse(c); setCourseSubTab('overview'); }}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div className={`p-4 ${c.thumbnailColor || 'bg-purple-600'} text-white flex items-center justify-between`}>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-white/70 block">{c.code}</span>
                      <h5 className="text-sm font-black leading-snug line-clamp-1 mt-1">{c.name}</h5>
                    </div>
                    <span className="text-2xl bg-white/15 p-2 rounded-lg">{c.thumbnailEmoji}</span>
                  </div>

                  <div className="p-4 space-y-3 text-xs text-gray-400">
                    <div className="flex justify-between border-b pb-2 text-gray-500 font-bold">
                      <span>Số tín chỉ học phần:</span>
                      <span className="text-gray-900">{c.credits} tín chỉ</span>
                    </div>
                    <div className="flex justify-between border-b pb-2 text-gray-550 font-medium">
                      <span>Sĩ số sinh viên lớp:</span>
                      <span className="text-gray-900 font-bold">{c.enrolled}/{c.maxEnroll} sinh viên</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phòng học cố định:</span>
                      <span className="text-indigo-600 font-bold">Phòng {c.schedule[0]?.room || 'TBA'}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border-t flex items-center justify-between text-xs font-bold text-indigo-600">
                    <span>Mở bảng quản lý lớp</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        // =========================================================
        // 2. COURSE DETAILS VIEWS (tabs navigation block)
        // =========================================================
        <div className="space-y-6 animate-fadeIn">
          
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 bg-slate-50 rounded-xl">{selectedCourse.thumbnailEmoji}</span>
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{selectedCourse.code}</span>
                <h3 className="text-lg font-black text-gray-900 mt-1">{selectedCourse.name}</h3>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 bg-gray-100 p-1 rounded-lg">
              {(['overview', 'students', 'materials', 'assignments', 'grades', 'attendance'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setCourseSubTab(tab)}
                  className={`px-3 py-1.5 rounded text-xs font-bold capitalize transition ${
                    courseSubTab === tab ? 'bg-white text-purple-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab === 'overview' ? 'Tổng quan' :
                   tab === 'students' ? 'Thành viên' :
                   tab === 'materials' ? 'Slide học liệu' :
                   tab === 'assignments' ? 'Tạo bài tập' :
                   tab === 'grades' ? 'Chấm bảng điểm' : 'Điểm danh lớp'}
                </button>
              ))}
            </div>
          </div>

          {/* Core sub tabs routing switches */}
          {courseSubTab === 'overview' && (
            <div className="bg-white rounded-xl border p-5 shadow-sm space-y-4 animate-fadeIn">
              <h4 className="text-sm font-bold text-gray-900 border-b pb-2">mục tiêu khái quát môn học</h4>
              <p className="text-xs text-gray-600 leading-relaxed">{selectedCourse.description}</p>
              
              <div className="grid grid-cols-2 gap-4 pt-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-block">Khung đào tạo</span>
                  <span className="font-bold text-gray-800 mt-1 block">Tín chỉ Đại học chuyên sâu</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-block">Mã hóa bảo mật</span>
                  <span className="font-bold text-gray-800 mt-1 block">SHA-256 Block-Chain</span>
                </div>
              </div>
            </div>
          )}

          {courseSubTab === 'students' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
                <span className="text-xs font-bold text-gray-800">Danh học sinh đã vào sổ cái ghi danh ({selectedCourse.enrolled})</span>
                <button
                  onClick={() => handleExportCSV(`Diem_danh_${selectedCourse.code}`)}
                  className="btn-secondary px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Xuất danh sách
                </button>
              </div>

              <div className="table-wrapper">
                <table className="lms-table" style={{ contentVisibility: 'auto' }}>
                  <thead>
                    <tr>
                      <th>Mã số Sinh viên</th>
                      <th>Thành viên</th>
                      <th>Giới tính</th>
                      <th>Ngày cập nhật</th>
                      <th className="text-right">Điểm trung bình hệ 4</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter(u => u.role === 'student' && grades.some(g => g.studentId === u.id && g.courseId === selectedCourse.id))
                      .map(stu => (
                        <tr key={stu.id}>
                          <td className="font-mono text-xs font-bold text-gray-600">{stu.studentId}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-full ${stu.avatarColor || 'bg-slate-500'} flex items-center justify-center text-[10px] font-bold text-white`}>
                                {stu.avatarInitials}
                              </div>
                              <span className="font-bold text-xs text-gray-800">{stu.name}</span>
                            </div>
                          </td>
                          <td className="text-xs">{stu.gender}</td>
                          <td className="text-xs text-gray-400">{new Date(stu.joinedAt).toLocaleDateString('vi-VN')}</td>
                          <td className="text-right font-mono font-bold text-indigo-600 text-xs">{(stu.gpa || 4.0).toFixed(2)} / 4.00</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {courseSubTab === 'materials' && (
            <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center border-b pb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800">Bộ Slide bài giảng slide & video học liệu</h4>
                <button
                  onClick={() => toast('Mở cửa sổ đẩy tài liệu giáo trình cục bộ...', 'info')}
                  className="btn-primary py-1.5 px-3 rounded text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Đẩy lên slide mới
                </button>
              </div>

              <div className="space-y-2.5">
                {[1, 2, 3].map(item => (
                  <div key={item} className="p-3 border rounded-lg bg-slate-50 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-5 h-5 text-purple-600 shrink-0" />
                      <div>
                        <span className="font-bold text-gray-850 block">Bài giảng slide {item}: Tổng quan vận hành và thực hành</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">MCNA_Slide_Theory_Ch{item}.pdf | 5.2 MB | Admin lưu</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toast('Đang bắt đầu tải xuống slide giáo báu...', 'success')}
                      className="text-xs text-blue-600 font-bold hover:underline"
                    >
                      Tải slide
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {courseSubTab === 'assignments' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800">Các bài tập lớn / Giao ban thi đua</h4>
                <button
                  onClick={() => setIsAddAssignmentOpen(true)}
                  className="btn-primary py-1.5 px-4 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Giao bài tập mới
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignments
                  .filter(a => a.courseId === selectedCourse.id)
                  .map(a => {
                    const gradedCount = a.submissions.filter(s => s.grade !== undefined).length;
                    return (
                      <div key={a.id} className="bg-white rounded-xl border p-4 shadow-xs space-y-3.5 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] bg-purple-50 text-purple-700 py-0.5 px-2 rounded font-bold uppercase tracking-wider">Tối đa {a.maxScore}đ</span>
                            <span className="text-[10px] text-gray-400 font-bold">Hạn chót: {new Date(a.dueDate).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <h5 className="font-bold text-xs text-gray-800 mt-2">{a.title}</h5>
                          <p className="text-[11px] text-gray-500 line-clamp-2 mt-1">{a.instructions}</p>
                        </div>

                        <div className="border-t pt-3 flex items-center justify-between text-xs">
                          <span className="text-gray-500">Đã chấm: <b>{gradedCount} / {a.submissions.length} bài</b> nộp</span>
                          <button
                            onClick={() => {
                              setSelectedAssignmentForGrading(a);
                              // open grid listing submissions
                              toast(`Đang hiển thị danh sách bài nộp của ${a.title}`, 'info');
                            }}
                            className="text-purple-600 font-bold flex items-center gap-1 hover:underline"
                          >
                            Xem bài nộp học viên
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* SUBMISSIONS LIST EXPANSION IF SELECTED */}
                        {selectedAssignmentForGrading?.id === a.id && (
                          <div className="bg-slate-50 p-2.5 rounded-lg border space-y-2 mt-3 text-xs animate-fadeIn">
                            <span className="font-bold text-[10px] text-gray-500 uppercase tracking-wider block">Chi tiết bài học sinh gửi lên:</span>
                            {a.submissions.length === 0 ? (
                              <span className="text-[10px] text-gray-400 italic block">Lớp học sinh chưa nộp bài tập nào.</span>
                            ) : (
                              a.submissions.map((sub, sIdx) => (
                                <div key={sIdx} className="p-2 bg-white rounded border flex items-center justify-between">
                                  <div>
                                    <span className="font-bold block text-slate-800 text-[11px]">{sub.studentName}</span>
                                    <span className="text-[9px] text-gray-400 block mt-0.5">Nộp: {new Date(sub.submittedAt).toLocaleDateString('vi-VN')}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {sub.grade !== undefined ? (
                                      <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                        Điểm: {sub.grade}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                                        Đang chờ chấm
                                      </span>
                                    )}
                                    <button
                                      onClick={() => handleOpenGradingWindow(sub, a)}
                                      className="btn-primary py-1 px-2 rounded text-[10px] font-bold"
                                    >
                                      Chấm điểm
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
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
              <div className="flex flex-col sm:flex-row items-center justify-between border-b pb-3 gap-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800">Sổ Điểm học phần trực tuyến (Inline Editable Register Gradebook)</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">Click trực tiếp vào bất cứ ô điểm nào để nhập nhanh điểm số trực tiếp. Bấm ra ngoài (Blur) để tự động lưu.</p>
                </div>
                
                <button
                  onClick={() => handleExportCSV(`Bang_diem_${selectedCourse.code}`)}
                  className="btn-secondary px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 text-gray-700"
                >
                  <Download className="w-4 h-4" />
                  Xuất file Excel môn học
                </button>
              </div>

              <div className="table-wrapper">
                <table className="lms-table" style={{ contentVisibility: 'auto' }}>
                  <thead>
                    <tr>
                      <th>Học viên đã gán</th>
                      <th className="text-center">Chuyên cần (10%)</th>
                      <th className="text-center">Trung bình bài tập (20%)</th>
                      <th className="text-center">Thi Giữa kỳ (30%)</th>
                      <th className="text-center">Thi Cuối kỳ (40%)</th>
                      <th className="text-center bg-purple-50 text-purple-800">Điểm tổng kết hệ 10</th>
                      <th className="text-center bg-indigo-50 text-indigo-800">Điểm quy đổi hệ 4</th>
                      <th className="text-right">Điểm chữ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades
                      .filter(g => g.courseId === selectedCourse.id)
                      .map((g) => {
                        const computed = calculateGPAAndGrade(g.attendance, g.assignments_avg, g.midterm, g.final);
                        return (
                          <tr key={g.id}>
                            <td className="font-bold text-xs text-slate-800">
                              <span className="block">{g.studentName}</span>
                              <span className="text-[10px] font-mono text-gray-400 block font-normal">{g.studentCode}</span>
                            </td>

                            {/* CHUYÊN CẦN ELEMENT */}
                            <td className="text-center font-mono cursor-pointer hover:bg-yellow-50/50" onClick={() => handleGradeCellEditStart(g.id, 'attendance', g.attendance)}>
                              {editingGradeCell?.recordId === g.id && editingGradeCell.field === 'attendance' ? (
                                <input
                                  type="text"
                                  value={editGradeValue}
                                  onChange={(e) => setEditGradeValue(e.target.value)}
                                  onBlur={() => handleGradeCellEditSave(g.id)}
                                  className="w-14 text-center border bg-yellow-50 py-0.5 font-bold outline-none rounded text-xs"
                                  autoFocus
                                />
                              ) : (
                                <span className="font-bold text-gray-700">{g.attendance}%</span>
                              )}
                            </td>

                            {/* ASSIGNMENTS ELEMENT */}
                            <td className="text-center font-mono cursor-pointer hover:bg-yellow-50/50" onClick={() => handleGradeCellEditStart(g.id, 'assignments_avg', g.assignments_avg)}>
                              {editingGradeCell?.recordId === g.id && editingGradeCell.field === 'assignments_avg' ? (
                                <input
                                  type="text"
                                  value={editGradeValue}
                                  onChange={(e) => setEditGradeValue(e.target.value)}
                                  onBlur={() => handleGradeCellEditSave(g.id)}
                                  className="w-14 text-center border bg-yellow-50 py-0.5 font-bold outline-none rounded text-xs"
                                  autoFocus
                                />
                              ) : (
                                <span className="font-bold text-gray-700">{g.assignments_avg}</span>
                              )}
                            </td>

                            {/* GIỮA KỲ ELEMENT */}
                            <td className="text-center font-mono cursor-pointer hover:bg-yellow-50/50" onClick={() => handleGradeCellEditStart(g.id, 'midterm', g.midterm)}>
                              {editingGradeCell?.recordId === g.id && editingGradeCell.field === 'midterm' ? (
                                <input
                                  type="text"
                                  value={editGradeValue}
                                  onChange={(e) => setEditGradeValue(e.target.value)}
                                  onBlur={() => handleGradeCellEditSave(g.id)}
                                  className="w-14 text-center border bg-yellow-50 py-0.5 font-bold outline-none rounded text-xs"
                                  autoFocus
                                />
                              ) : (
                                <span className="font-bold text-gray-700">{g.midterm}</span>
                              )}
                            </td>

                            {/* CUỐI KỲ ELEMENT */}
                            <td className="text-center font-mono cursor-pointer hover:bg-yellow-50/50" onClick={() => handleGradeCellEditStart(g.id, 'final', g.final)}>
                              {editingGradeCell?.recordId === g.id && editingGradeCell.field === 'final' ? (
                                <input
                                  type="text"
                                  value={editGradeValue}
                                  onChange={(e) => setEditGradeValue(e.target.value)}
                                  onBlur={() => handleGradeCellEditSave(g.id)}
                                  className="w-14 text-center border bg-yellow-50 py-0.5 font-bold outline-none rounded text-xs"
                                  autoFocus
                                />
                              ) : (
                                <span className="font-bold text-gray-750">{g.final}</span>
                              )}
                            </td>

                            {/* WT SUMMARY */}
                            <td className="text-center font-mono font-black text-purple-700 bg-purple-50/40 text-xs">
                              {computed.finalWeighted}
                            </td>

                            <td className="text-center font-mono font-black text-indigo-700 bg-indigo-50/40 text-xs">
                              {computed.gpa4.toFixed(2)}
                            </td>

                            <td className="text-right">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black tracking-wider ${
                                computed.letter === 'A' ? 'bg-green-100 text-green' :
                                ['B+', 'B'].includes(computed.letter) ? 'bg-blue-100 text-blue-700' :
                                computed.letter === 'F' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                Điểm {computed.letter}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {courseSubTab === 'attendance' && (
            <div className="bg-white rounded-xl border p-5 shadow-sm space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row items-center justify-between border-b pb-3 gap-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800">Điểm danh điểm bám lớp học hàng ngày</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">Tích chọn chuyên cần cho học sinh tham dự bài lab thực hành.</p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto shrink-0 items-center justify-end">
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="bg-gray-50 border rounded-lg px-2.5 py-1.5 text-xs font-bold shrink-0 outline-none cursor-pointer"
                  />
                  <button
                    onClick={() => handleMarkAllAttendance('present', users.filter(u => u.role === 'student').map(s => s.id))}
                    className="btn-secondary py-1.5 px-3 rounded text-[10px] font-bold"
                  >
                    Tất cả Có mặt
                  </button>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="lms-table" style={{ contentVisibility: 'auto' }}>
                  <thead>
                    <tr>
                      <th>MSSV</th>
                      <th>Thành viên học sinh</th>
                      <th className="text-right">Tình trạng Có mặt / Trễ học / Nghỉ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter(u => u.role === 'student' && grades.some(g => g.studentId === u.id && g.courseId === selectedCourse.id))
                      .map((stu) => {
                        const status = attendanceRecords[stu.id] || 'present';
                        return (
                          <tr key={stu.id}>
                            <td className="font-mono text-xs font-bold text-gray-600">{stu.studentId}</td>
                            <td className="font-bold text-xs">{stu.name}</td>
                            <td className="text-right">
                              <div className="flex items-center justify-end gap-3 text-xs">
                                <label className="flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`att-${stu.id}`}
                                    checked={status === 'present'}
                                    onChange={() => setAttendanceRecords(prev => ({ ...prev, [stu.id]: 'present' }))}
                                    className="w-3.5 h-3.5 text-purple-600"
                                  />
                                  <span>Có mặt</span>
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`att-${stu.id}`}
                                    checked={status === 'late'}
                                    onChange={() => setAttendanceRecords(prev => ({ ...prev, [stu.id]: 'late' }))}
                                    className="w-3.5 h-3.5 text-amber-500"
                                  />
                                  <span>Trễ</span>
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`att-${stu.id}`}
                                    checked={status === 'absent'}
                                    onChange={() => setAttendanceRecords(prev => ({ ...prev, [stu.id]: 'absent' }))}
                                    className="w-3.5 h-3.5 text-red-500"
                                  />
                                  <span>Vắng</span>
                                </label>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  className="btn-primary py-2 px-5 rounded-lg text-xs font-bold"
                >
                  Sao lưu điểm danh hôm nay
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================= */}
      {/* 4. MODAL FOR GIVING GRADES TO HOMEWORK SUBMISSION */}
      {/* ========================================================= */}
      {isGradingModalOpen && gradingSubmission && selectedAssignmentForGrading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-sm w-full p-5 sm:p-6 animate-fadeIn">
            <h4 className="text-sm font-black text-gray-900 border-b pb-2 mb-4">Màn hình chấm điểm sinh viên</h4>
            
            <form onSubmit={handleSaveSubmissionGrade} className="space-y-4">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Học sinh nộp bài:</span>
                <span className="font-bold text-gray-800 text-xs mt-1 block">{gradingSubmission.studentName}</span>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block font-mono">Tập tin bài giải:</span>
                <span className="text-xs bg-slate-50 border px-2 py-1 rounded mt-1 select-all block break-all font-mono">
                  📂 {gradingSubmission.fileName}
                </span>
              </div>

              <div className="p-2.5 bg-blue-50/50 rounded-lg border text-[10px] text-gray-500 leading-relaxed italic">
                &ldquo;{gradingSubmission.notes}&rdquo;
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-divider">Nhập Điểm số thi đua (0 - {selectedAssignmentForGrading.maxScore})</label>
                <input
                  type="number"
                  min="0"
                  max={selectedAssignmentForGrading.maxScore}
                  step="0.1"
                  value={scoreInput}
                  onChange={(e) => setScoreInput(Number(e.target.value))}
                  className="mt-1 w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Viết Phản hồi, nhận xét cho SV</span>
                  <span className="text-amber-600 font-extrabold text-[9px]">Gợi ý từ Cố vấn AI</span>
                </label>
                
                {/* Quick AI Comment Suggestions */}
                <div className="flex flex-wrap gap-1 mt-1 mb-2">
                  <button
                    type="button"
                    onClick={() => setFeedbackInput("Bài làm rất xuất sắc, cấu trúc giải thuật tối ưu và trình bày cực kỳ mạch lạc. Rất đáng biểu dương tinh thần tự học!")}
                    className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 rounded font-bold text-[9px] transition border border-emerald-150"
                  >
                    🌟 Xuất Sắc
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackInput("Thuật toán chạy tương đối tốt, tuy nhiên cần chú ý căn lề định dạng mã nguồn và tối ưu hóa thêm chuỗi truy vấn dữ liệu.")}
                    className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100/80 rounded font-bold text-[9px] transition border border-amber-150"
                  >
                    🔧 Cần Tối Ưu
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackInput("Bài gửi chưa hoàn thành đầy đủ tất cả yêu cầu đặt ra của đề cương bài thực hành. Cần rà soát slide Chương 2 và chỉnh sửa gấp.")}
                    className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100/80 rounded font-bold text-[9px] transition border border-rose-150"
                  >
                    ⚠️ Sơ Sài
                  </button>
                </div>

                <textarea
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Gõ lời phê bình hoặc bấm chọn gợi ý nhanh bên trên..."
                  rows={3}
                  className="w-full bg-gray-50 border rounded-lg p-2.5 text-xs outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setIsGradingModalOpen(false)}
                  className="btn-secondary py-1.5 px-3.5 rounded-lg text-xs font-bold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn-primary py-1.5 px-4 rounded-lg text-xs font-bold"
                >
                  Cập nhật điểm số
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. CREATE ASSIGNMENT MODAL TYPE */}
      {/* ========================================================= */}
      {isAddAssignmentOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-sm w-full p-5 sm:p-6 animate-fadeIn">
            <h4 className="text-sm font-black text-gray-900 border-b pb-2 mb-4">Giao bài kiểm tra / Bài tập lớn mới</h4>
            
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tiêu đề nhiệm vụ bài tập</label>
                <input
                  type="text"
                  value={newAssignmentTitle}
                  onChange={(e) => setNewAssignmentTitle(e.target.value)}
                  placeholder="vd: Bài thực hành Lab số 3: REST API"
                  className="mt-1 w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Thang điểm tối đa</label>
                  <select
                    value={newAssignmentMaxScore}
                    onChange={(e) => setNewAssignmentMaxScore(Number(e.target.value))}
                    className="mt-1 w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs outline-none cursor-pointer"
                  >
                    <option value="10">Thang điểm 10</option>
                    <option value="100">Thang điểm 100</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ngày hết hạn nộp</label>
                  <input
                    type="datetime-local"
                    value={newAssignmentDue}
                    onChange={(e) => setNewAssignmentDue(e.target.value)}
                    className="mt-1 w-full bg-gray-50 border rounded-lg px-3 py-2 text-xs outline-none cursor-pointer"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Thuyết minh hướng dẫn học liệu</label>
                <textarea
                  value={newAssignmentInstructions}
                  onChange={(e) => setNewAssignmentInstructions(e.target.value)}
                  placeholder="Nêu yêu cầu, link giáo trình tham khảo học phần..."
                  rows={4}
                  className="mt-1 w-full bg-gray-50 border rounded-lg p-2.5 text-xs outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddAssignmentOpen(false)}
                  className="btn-secondary py-1.5 px-3.5 rounded-lg text-xs font-bold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn-primary py-1.5 px-4 rounded-lg text-xs font-bold"
                >
                  Giao bài tập
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
