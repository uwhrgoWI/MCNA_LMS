import { User, Course, Assignment, Submission, GradeRecord, Notification, AuditLog, Transaction, SystemSettings, FeatureFlags } from './types';

// Seed names for Vietnamese profile generation
const LAST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const MIDDLE_NAMES = ['Ahn', 'Công', 'Đức', 'Gia', 'Hai', 'Hoàng', 'Hồng', 'Khánh', 'Minh', 'Ngọc', 'Nhật', 'Quốc', 'Thanh', 'Thị', 'Văn', 'Xuân'];
const MALE_FIRST_NAMES = ['Anh', 'Bảo', 'Cường', 'Dương', 'Đạt', 'Đức', 'Hải', 'Hiếu', 'Hoàng', 'Hùng', 'Huy', 'Khánh', 'Lâm', 'Long', 'Minh', 'Nam', 'Phong', 'Quân', 'Sơn', 'Tài', 'Thái', 'Toàn', 'Trung', 'Tuấn', 'Việt', 'Vy'];
const FEMALE_FIRST_NAMES = ['An', 'Anh', 'Chi', 'Diệp', 'Dung', 'Đông', 'Giang', 'Hà', 'Hân', 'Hằng', 'Hiền', 'Hoa', 'Hồng', 'Hương', 'Khanh', 'Lan', 'Linh', 'Mai', 'My', 'Ngọc', 'Nhi', 'Nhung', 'Oanh', 'Phương', 'Quỳnh', 'Thảo', 'Thư', 'Trang', 'Tuyết', 'Vân', 'Yến'];

const MAJORS = [
  'Kỹ thuật Phần mềm (Software Engineering)',
  'Khoa học Máy tính & AI (Computer Science & AI)',
  'An toàn Thông tin (Cyber Security)',
  'Thiết kế Đồ họa & UI/UX (Graphic & UI/UX Design)',
  'Hệ thống Thông tin Quản lý (MIS)'
];

const COLORS = [
  'bg-blue-500 text-white',
  'bg-purple-500 text-white',
  'bg-emerald-500 text-white',
  'bg-amber-500 text-white',
  'bg-indigo-500 text-white',
  'bg-pink-500 text-white',
  'bg-teal-500 text-white',
  'bg-cyan-500 text-white',
  'bg-violet-500 text-white'
];

// Helper to pick random item
const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Helper to pick non-overlapping or multiple items
function generateVietnameseName(): { name: string; gender: string } {
  const gender = Math.random() > 0.4 ? 'Nam' : 'Nữ';
  const last = pickRandom(LAST_NAMES);
  const mid = pickRandom(MIDDLE_NAMES);
  const first = gender === 'Nam' ? pickRandom(MALE_FIRST_NAMES) : pickRandom(FEMALE_FIRST_NAMES);
  return {
    name: `${last} ${mid} ${first}`,
    gender
  };
}

function generatePhone(): string {
  const starts = ['090', '091', '098', '097', '034', '035', '038', '077', '086'];
  const p1 = pickRandom(starts);
  const p2 = Math.floor(1000000 + Math.random() * 9000000).toString().substring(0, 7);
  return `${p1}${p2}`;
}

export function generateSeedData() {
  const users: User[] = [];
  const courses: Course[] = [];
  const assignments: Assignment[] = [];
  const grades: GradeRecord[] = [];
  const notifications: Notification[] = [];
  const auditLogs: AuditLog[] = [];
  const transactions: Transaction[] = [];

  // 1. ADD MANDATORY 4 PRIMARY DEMO ACCOUNTS
  const demoAdmin: User = {
    id: 'u-admin',
    email: 'admin@lms.vn',
    password: 'Admin@123',
    name: 'Nguyễn Minh Cường',
    role: 'admin',
    avatarInitials: 'MC',
    avatarColor: 'bg-red-600 text-white',
    status: 'active',
    joinedAt: '2025-01-10T08:00:00Z',
    lastLogin: '2026-05-25T06:45:00Z',
    phone: '0901234567',
    gender: 'Nam',
    dob: '1984-05-12'
  };

  const demoManager: User = {
    id: 'u-manager',
    email: 'manager@lms.vn',
    password: 'Manager@123',
    name: 'Lê Hoàng Nam',
    role: 'manager',
    avatarInitials: 'HN',
    avatarColor: 'bg-indigo-600 text-white',
    status: 'active',
    joinedAt: '2025-02-15T09:30:00Z',
    lastLogin: '2026-05-25T06:12:00Z',
    phone: '0912345678',
    gender: 'Nam',
    dob: '1989-11-20'
  };

  const demoTeacher: User = {
    id: 'u-teacher',
    email: 'teacher@lms.vn',
    password: 'Teacher@123',
    name: 'Trần Thị Hồng',
    role: 'teacher',
    avatarInitials: 'TH',
    avatarColor: 'bg-purple-600 text-white',
    status: 'active',
    joinedAt: '2025-03-01T10:00:00Z',
    lastLogin: '2026-05-25T05:54:00Z',
    phone: '0987654321',
    gender: 'Nữ',
    dob: '1991-08-14'
  };

  const demoStudent: User = {
    id: 'u-student',
    email: 'student@lms.vn',
    password: 'Student@123',
    name: 'Phạm Hải Đăng',
    role: 'student',
    avatarInitials: 'HĐ',
    avatarColor: 'bg-emerald-600 text-white',
    status: 'active',
    joinedAt: '2025-09-01T07:15:00Z',
    lastLogin: '2026-05-25T06:30:00Z',
    phone: '0971239845',
    major: 'Kỹ thuật Phần mềm (Software Engineering)',
    gpa: 3.65,
    studentId: 'MCNA-2026-001',
    gender: 'Nam',
    dob: '2005-10-05',
    relationContact: 'Bố: Phạm Hải Sơn (0971239840)'
  };

  users.push(demoAdmin, demoManager, demoTeacher, demoStudent);

  // 2. GENERATE OTHER USERS (Up to 500 total)
  // Let's make:
  // - 5 Directors/Admins
  // - 15 Managers
  // - 30 Teachers
  // - 450 Students
  
  // Custom seed indexes for names
  let userCounter = 2; // student ids
  const totalStudentsCount = 450;
  const totalTeachersCount = 30;
  const totalManagersCount = 15;
  const totalAdminsCount = 5;

  // Add extra Admins
  for (let i = 1; i <= totalAdminsCount; i++) {
    const info = generateVietnameseName();
    const initials = info.name.split(' ').map(n => n[0]).join('').slice(-2);
    users.push({
      id: `u-admin-${i}`,
      email: `admin.${i}@lms.vn`,
      password: `Admin@123-${i}`,
      name: `${info.name} (Admin)`,
      role: 'admin',
      avatarInitials: initials,
      avatarColor: pickRandom(COLORS),
      status: Math.random() > 0.1 ? 'active' : 'inactive',
      joinedAt: `2025-01-${Math.floor(11 + i)}T09:00:00Z`,
      phone: generatePhone(),
      gender: info.gender,
      dob: `198${Math.floor(Math.random() * 10)}-${Math.floor(1 + Math.random() * 11)}-${Math.floor(1 + Math.random() * 28)}`
    });
  }

  // Add extra Managers
  for (let i = 1; i <= totalManagersCount; i++) {
    const info = generateVietnameseName();
    const initials = info.name.split(' ').map(n => n[0]).join('').slice(-2);
    users.push({
      id: `u-manager-${i}`,
      email: `manager.${i}@lms.vn`,
      password: `Manager@123-${i}`,
      name: `${info.name} (Manager)`,
      role: 'manager',
      avatarInitials: initials,
      avatarColor: pickRandom(COLORS),
      status: Math.random() > 0.15 ? 'active' : 'inactive',
      joinedAt: `2025-02-${Math.floor(16 + i)}T09:00:00Z`,
      phone: generatePhone(),
      gender: info.gender,
      dob: `198${Math.floor(5 + Math.random() * 5)}-${Math.floor(1 + Math.random() * 11)}-${Math.floor(1 + Math.random() * 28)}`
    });
  }

  // Add extra Teachers
  const teacherRefs: { id: string; name: string }[] = [{ id: demoTeacher.id, name: demoTeacher.name }];
  for (let i = 1; i <= totalTeachersCount; i++) {
    const info = generateVietnameseName();
    const initials = info.name.split(' ').map(n => n[0]).join('').slice(-2);
    const id = `u-teacher-${i}`;
    users.push({
      id,
      email: `teacher.${i}@lms.vn`,
      password: `Teacher@123-${i}`,
      name: info.name,
      role: 'teacher',
      avatarInitials: initials,
      avatarColor: pickRandom(COLORS),
      status: 'active',
      joinedAt: `2025-03-${Math.floor(2 + i)}T09:00:00Z`,
      phone: generatePhone(),
      gender: info.gender,
      dob: `197${Math.floor(5 + Math.random() * 9)}-${Math.floor(1 + Math.random() * 11)}-${Math.floor(1 + Math.random() * 28)}`
    });
    teacherRefs.push({ id, name: info.name });
  }

  // Add extra Students
  const studentRefs: { id: string; name: string; code: string }[] = [{ id: demoStudent.id, name: demoStudent.name, code: demoStudent.studentId! }];
  for (let i = 1; i < totalStudentsCount; i++) {
    const info = generateVietnameseName();
    const initials = info.name.split(' ').map(n => n[0]).join('').slice(-2);
    const studentCode = `MCNA-2026-${String(userCounter++).padStart(3, '0')}`;
    const id = `u-student-${i}`;
    const major = pickRandom(MAJORS);
    const gpa = parseFloat((2.0 + Math.random() * 2.0).toFixed(2));
    
    users.push({
      id,
      email: `student.${i}@lms.vn`,
      password: `Student@123-${i}`,
      name: info.name,
      role: 'student',
      avatarInitials: initials,
      avatarColor: pickRandom(COLORS),
      status: Math.random() > 0.05 ? 'active' : 'inactive',
      joinedAt: `2025-09-0${Math.floor(2 + (i % 8))}T07:15:00Z`,
      phone: generatePhone(),
      major,
      gpa,
      studentId: studentCode,
      gender: info.gender,
      dob: `200${Math.floor(4 + Math.random() * 3)}-${Math.floor(1 + Math.random() * 11)}-${Math.floor(1 + Math.random() * 28)}`,
      relationContact: `Bố/Mẹ: Phùng ${info.name.split(' ').pop()} (${generatePhone()})`
    });
    studentRefs.push({ id, name: info.name, code: studentCode });
  }

  // 3. GENERATE 8 STUNNING UNIVERSITY COURSES
  const courseSpecs = [
    { code: 'IT-REACT', name: 'Lập trình React Native nâng cao', credits: 4, emoji: '📱', color: 'bg-blue-600' },
    { code: 'IT-AI', name: 'Trí tuệ Nhân tạo & Học máy', credits: 4, emoji: '🤖', color: 'bg-purple-600' },
    { code: 'IT-UIUX', name: 'Thiết kế UI/UX Chuyên nghiệp', credits: 3, emoji: '🎨', color: 'bg-pink-600' },
    { code: 'IT-CYBER', name: 'An toàn dữ liệu & Bảo mật Hệ thống', credits: 3, emoji: '🔒', color: 'bg-red-600' },
    { code: 'IT-FSJS', name: 'Lập trình Web full-stack với Node.js', credits: 4, emoji: '⚡', color: 'bg-emerald-600' },
    { code: 'IT-CLOUD', name: 'Phát triển ứng dụng đám mây (Cloud Computing)', credits: 3, emoji: '☁️', color: 'bg-sky-600' },
    { code: 'IT-NOSQL', name: 'Cơ sở dữ liệu lớn NoSQL & Big Data', credits: 3, emoji: '💾', color: 'bg-amber-600' },
    { code: 'IT-DSA', name: 'Cấu trúc dữ liệu và Giải thuật', credits: 4, emoji: '📐', color: 'bg-teal-600' }
  ];

  courseSpecs.forEach((spec, index) => {
    // assign random or specific teacher
    const tRef = teacherRefs[index % teacherRefs.length];
    
    // schedule: let's assign 1 or 2 slots during weekdays (day 2 to 6, slots 1 to 4)
    const primaryDay = 2 + (index % 5);
    const slot = 1 + (index % 4);
    const room = `Lab-${100 + (index * 4)}`;
    const schedule = [{ day: primaryDay, slot, room }];
    if (spec.credits > 3) {
      schedule.push({ day: (primaryDay + 2) > 6 ? 2 : (primaryDay + 2), slot: (slot % 4) + 1, room });
    }

    courses.push({
      id: `c-${index + 1}`,
      code: spec.code,
      name: spec.name,
      credits: spec.credits,
      teacherId: tRef.id,
      teacherName: tRef.name,
      status: 'active',
      enrolled: 40 + Math.floor(Math.random() * 20), // enrolled number
      maxEnroll: 60,
      progress: Math.floor(40 + Math.random() * 40),
      thumbnailColor: spec.color,
      thumbnailEmoji: spec.emoji,
      schedule,
      description: `Khóa học này cung cấp kiến thức toàn diện về ${spec.name}. Sinh viên sẽ tham gia làm bài tập lớn, thực hành lab liên tục và cập nhật các xu hướng công nghệ mới nhất của thế giới.`
    });
  });

  // Let's enroll our main student (demoStudent) in courses: c-1, c-2, c-3, c-4
  const studentEnrolledInCodes = ['c-1', 'c-2', 'c-3', 'c-4'];

  // 4. GENERATE 12 ASSIGNMENTS ACROSS COURSES
  let assignmentIdCounter = 1;
  courses.forEach(c => {
    // Generate 2 assignments per course
    const dueDates = ['2026-06-10T23:59:59Z', '2026-06-25T23:59:59Z'];
    const maxScores = [10, 100];
    
    for (let i = 1; i <= 2; i++) {
      const aId = `a-${assignmentIdCounter++}`;
      
      // Let's seed submissions. If it is assignment 1, most students submitted. If 2, some did.
      const submissionsList: Submission[] = [];
      
      // Let's add submissions for a portion of the students in class
      const submittedStudents = studentRefs.slice(0, 35); // 35 sample submitted
      
      submittedStudents.forEach((studentSub) => {
        // Is graded? Let's say yes for assignment 1, no or yes for some
        const isGraded = Math.random() > 0.2;
        const gradeVal = isGraded ? (70 + Math.floor(Math.random() * 31)) / (i === 1 ? 10 : 1) : undefined;
        
        submissionsList.push({
          studentId: studentSub.id,
          studentName: studentSub.name,
          submittedAt: `2026-05-${Math.floor(1 + Math.random() * 20)}T15:30:00Z`,
          notes: 'Thầy ơi, mong thầy xem qua bài tập lớn của nhóm em. Cám ơn thầy đã tận tình hỗ trợ!',
          fileName: `MCNA_Baitap_${c.code}_v1.pdf`,
          grade: gradeVal,
          feedback: isGraded ? pickRandom([
            'Giải quyết trọn vẹn yêu cầu đề bài. Bố cục rõ ràng, lập luận tốt.',
            'Bài làm khá tốt, chú ý thêm cách format code chuẩn mực nhé.',
            'Xuất sắc! Có sự đầu tư sâu rộng và mở rộng kiến thức tốt.',
            'Cần chú ý thêm phần phân tích cơ sở dữ liệu.'
          ]) : undefined
        });
      });

      // Special check: did demoStudent submit?
      // Yes, make it look nice!
      if (studentEnrolledInCodes.includes(c.id)) {
        // Let's ensure a submission exists or is pending
        const alreadySubmitted = submissionsList.find(s => s.studentId === demoStudent.id);
        if (!alreadySubmitted) {
          submissionsList.push({
            studentId: demoStudent.id,
            studentName: demoStudent.name,
            submittedAt: '2026-05-18T20:15:00Z',
            notes: 'Em nộp bài đúng hạn ạ. Mong nhận được đánh giá từ Thầy!',
            fileName: `${c.code}_Assignment_${i}.zip`,
            grade: i === 1 ? 9.2 : undefined, // Graded if first
            feedback: i === 1 ? 'Làm bài tỉ mỉ, sáng tạo, đạt điểm số cao của lớp.' : undefined
          });
        }
      }

      assignments.push({
        id: aId,
        courseId: c.id,
        courseName: c.name,
        title: `Bài tập số ${i}: Thực hành ứng dụng ${c.name}`,
        instructions: `Yêu cầu: Sinh viên tự nghiên cứu tài liệu chương ${i}. Triển khai giải pháp theo mô hình chuẩn của MCNA Technology School. Thuyết minh từ 3-5 trang và đóng gói mã nguồn đầy đủ.`,
        dueDate: dueDates[i - 1],
        maxScore: i === 1 ? 10 : 100,
        status: 'open',
        submissions: submissionsList
      });
    }
  });

  // 5. GRADE RECORD (studentId -> courseId -> grades)
  // Let's populate grades database for students.
  // We'll create grades for our top 100 students across the courses to make gradebook look filled
  let gradeCounter = 1;
  const popularCourses = ['c-1', 'c-2', 'c-3', 'c-4', 'c-5', 'c-6', 'c-7', 'c-8'];
  
  studentRefs.forEach((st, sIndex) => {
    // Assign 3-4 random courses to each student
    const enrolledIds = sIndex === 0 
      ? ['c-1', 'c-2', 'c-3', 'c-4'] 
      : [
          popularCourses[sIndex % popularCourses.length], 
          popularCourses[(sIndex + 2) % popularCourses.length], 
          popularCourses[(sIndex + 4) % popularCourses.length]
        ];

    enrolledIds.forEach(cId => {
      const parentCourse = courses.find(cc => cc.id === cId);
      const att = 85 + Math.floor(Math.random() * 16);
      const mid = 6.5 + (Math.random() * 3.5);
      const fin = 6.0 + (Math.random() * 4.0);
      const assign = 7.0 + (Math.random() * 3.0);
      
      grades.push({
        id: `g-${gradeCounter++}`,
        studentId: st.id,
        studentName: st.name,
        studentCode: st.code,
        courseId: cId,
        courseName: parentCourse?.name || '',
        attendance: Math.min(100, att),
        midterm: parseFloat(mid.toFixed(1)),
        final: parseFloat(fin.toFixed(1)),
        assignments_avg: parseFloat(assign.toFixed(1))
      });
    });
  });

  // 6. NOTIFICATION SEEDS
  const notifTemplates = [
    { type: 'announcement', title: 'Thông báo học phí học kỳ Hè 2026', body: 'LMS mở đăng ký nộp học phí học kỳ hè 2026 với ưu đãi học bổng 10%. Sinh viên vui lòng hoàn thành trước 15/06.' },
    { type: 'info', title: 'Cập nhật thời khóa biểu phòng Lab', body: 'Phòng Lab-104 đã hoàn thành nâng cấp thêm 20 máy trạm GPU Nvidia RTX 4070 để nghiên cứu AI.' },
    { type: 'success', title: 'Tuyển dụng Fresher AI & React Native', body: 'Đối tác chiến lược MCNA thông báo đợt tuyển dụng lớn 30 sinh viên thực tập từ năm thứ 3.' },
    { type: 'warning', title: 'Bảo trì hệ thống LMS MCNA định kỳ', body: 'Hệ thống LMS và SV-Gate sẽ bảo trì vào lúc 01:00 AM - 04:00 AM Chủ Nhật để tối ưu hóa hiệu năng cơ sở dữ liệu.' },
    { type: 'danger', title: 'Hạn chót cập nhật hồ sơ cá nhân', body: 'Yêu cầu các sinh viên và học viên hoàn tất hình ảnh cá nhân và căn cước công dân để cấp phôi bằng chính thức.' }
  ] as const;

  let notifIdCounter = 1;

  // Let's seed for demoStudent
  notifTemplates.forEach((tmp, index) => {
    notifications.push({
      id: `n-${notifIdCounter++}`,
      userId: demoStudent.id,
      type: tmp.type,
      title: tmp.title,
      body: tmp.body,
      read: index > 1, // first few are unread
      createdAt: `2026-05-${25 - index}T08:00:00Z`
    });
  });

  // Also general notifications
  notifications.push({
    id: `n-${notifIdCounter++}`,
    userId: 'all',
    type: 'announcement',
    title: 'Chào mừng kỷ niệm 10 năm thành lập MCNA School',
    body: 'Chuỗi sự kiện Hackathon MCNA 2026 chính thức khởi tranh. Tổng giải thưởng lên tới 500.000.000 VND.',
    read: false,
    createdAt: '2026-05-24T00:00:00Z'
  });

  // Add some notifications for and other roles
  notifications.push({
    id: `n-${notifIdCounter++}`,
    userId: demoTeacher.id,
    type: 'info',
    title: 'Hệ thống đã phê duyệt Danh sách lớp IT-REACT',
    body: 'Lớp Lập trình React Native nâng cao của Thầy ghi nhận 54 sinh viên đăng ký hoàn tất. Hãy chuẩn bị học liệu.',
    read: false,
    createdAt: '2026-05-24T12:00:00Z'
  });

  notifications.push({
    id: `n-${notifIdCounter++}`,
    userId: demoTeacher.id,
    type: 'warning',
    title: 'Yêu cầu nhập điểm giữa kỳ lớp IT-AI',
    body: 'Vui lòng hoàn thiện cột điểm quá trình và kiểm tra giữa kỳ trước ngày 30/05 để đồng bộ với Phòng đào tạo.',
    read: false,
    createdAt: '2026-05-23T10:00:00Z'
  });

  notifications.push({
    id: `n-${notifIdCounter++}`,
    userId: demoManager.id,
    type: 'info',
    title: 'Hồ sơ tài chính tháng 5 đã sẵn sàng',
    body: 'Báo cáo tổng kết biên lai học phí và học bổng học viên đã hoàn tất gửi lên hội đồng trường.',
    read: false,
    createdAt: '2026-05-24T16:00:00Z'
  });

  // 7. AUDIT LOG SEEDS (20+ for security audit view)
  const auditActions = [
    { action: 'User Login', resource: 'Auth Service', ip: '113.161.41.115', status: 'Success' },
    { action: 'Update Permissions', resource: 'RBAC Policy Matrix', ip: '113.161.41.115', status: 'Success' },
    { action: 'Course Creation', resource: 'Course Catalog', ip: '14.161.32.12', status: 'Success' },
    { action: 'Export Grades', resource: 'Gradebook IT-REACT', ip: '171.244.11.89', status: 'Success' },
    { action: 'User Registration', resource: 'Self Enroll Portal', ip: '27.72.61.120', status: 'Success' },
    { action: 'Grade Update', resource: 'Midterm Mark IT-AI', ip: '171.244.11.89', status: 'Success' },
    { action: 'Backup System DB', resource: 'Hyper Backup Vault', ip: '127.0.0.1', status: 'Success' },
    { action: 'Toggle Feature Flag', resource: 'Config Online Exams', ip: '113.161.41.115', status: 'Success' },
    { action: 'Approve Scholarship', resource: 'Finance Portal', ip: '14.161.32.12', status: 'Success' }
  ];

  for (let i = 1; i <= 25; i++) {
    const act = pickRandom(auditActions);
    const mockUser = pickRandom(users.filter(u => u.role !== 'student'));
    auditLogs.push({
      id: `audit-${i}`,
      timestamp: `2026-05-${Math.floor(10 + (i % 15))}T${String(Math.floor(8 + (i % 15))).padStart(2, '0')}:30:00Z`,
      userName: mockUser.name,
      userEmail: mockUser.email,
      action: act.action,
      resource: act.resource,
      ip: act.ip,
      status: act.status
    });
  }

  // 8. TRANSACTIONS (Tuition logs for finance management)
  // Let's create transactions for the first 30 students
  studentRefs.slice(0, 40).forEach((st, i) => {
    const isPaid = i % 3 !== 0; // 2/3 paid
    const isPending = i % 5 === 0 && !isPaid;
    const amount = 12500000; // 12.5M VND
    const type = i % 8 === 0 ? 'scholarship' : 'tuition';
    const amountVal = type === 'scholarship' ? 5000000 : amount;
    
    transactions.push({
      id: `tx-${1000 + i}`,
      studentId: st.id,
      studentName: st.name,
      studentCode: st.code,
      amount: amountVal,
      type,
      status: isPaid ? 'paid' : (isPending ? 'pending_approval' : 'unpaid'),
      schoolYear: '2025-2026 Học kỳ II',
      billDate: '2026-03-01T08:00:00Z',
      dueDate: '2026-04-15T17:00:00Z',
      paidDate: isPaid ? `2026-03-${Math.floor(5 + i)}T10:30:00Z` : undefined
    });
  });

  return {
    users,
    courses,
    assignments,
    grades,
    notifications,
    auditLogs,
    transactions
  };
}

export const defaultSettings: SystemSettings = {
  schoolName: 'MCNA Technology School',
  logoUrl: '/favicon.ico',
  timezone: 'Asia/Ho_Chi_Minh (UTC+07)',
  language: 'Tiếng Việt',
  contactInfo: 'Hotline: 1900-8198 | Email: portal@mcna.vn | CS1: Toà nhà MCNA High-Tech, Khu CNC Hoà Lạc, Hà Nội',
  currentYear: '2025-2026',
  semesterName: 'Học kỳ II',
  gradingScale: '10'
};

export const defaultFeatureFlags: FeatureFlags = {
  enableRegistration: true,
  enableGpaCalculator: true,
  enableTuitionFeePayment: true,
  enableOnlineExams: false,
  enableThemeToggle: true,
  enableAuditLogs: true,
  enableNotifications: true,
  enableBulkEnroll: true
};
