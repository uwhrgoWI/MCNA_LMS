import React from 'react';
import { Course } from '../types';
import { Calendar, Clock, MapPin } from 'lucide-react';

interface MiniCalendarProps {
  courses: Course[];
  studentCourseIds?: string[]; // for students to filter
  teacherId?: string; // for teachers to filter
  onClose: () => void;
}

export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  courses,
  studentCourseIds,
  teacherId,
  onClose
}) => {
  const daysOfWeek = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const today = new Date();
  const dayIndex = today.getDay(); // 0 is Sunday, 1 is Monday...
  const dayNameInVietnamese = daysOfWeek[dayIndex];

  // Map slots to times
  const slotTimes = [
    { slot: 1, time: '07:30 - 09:30' },
    { slot: 2, time: '09:45 - 11:45' },
    { slot: 3, time: '13:30 - 15:30' },
    { slot: 4, time: '15:45 - 17:45' }
  ];

  // filter courses scheduled for today and filtered by user
  // (schedule has day: 2 for Th2, up to 6 for Th6)
  const queryDay = dayIndex === 0 || dayIndex === 6 ? 2 : dayIndex; // default to Th2 on weekends for demo display
  
  const todaysScheduleList: { courseName: string; code: string; slot: number; room: string; time: string; teacherName?: string }[] = [];
  
  courses.forEach(c => {
    // filtering
    if (studentCourseIds && !studentCourseIds.includes(c.id)) return;
    if (teacherId && c.teacherId !== teacherId) return;

    c.schedule.forEach(sched => {
      if (sched.day === queryDay) {
        const timeObj = slotTimes.find(s => s.slot === sched.slot);
        todaysScheduleList.push({
          courseName: c.name,
          code: c.code,
          slot: sched.slot,
          room: sched.room,
          time: timeObj ? timeObj.time : 'Chưa định nghĩa',
          teacherName: c.teacherName
        });
      }
    });
  });

  // Sort by slot
  todaysScheduleList.sort((a,b) => a.slot - b.slot);

  return (
    <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50 animate-fadeIn">
      <div className="flex items-center justify-between border-b pb-2 mb-3">
        <div className="flex items-center gap-1.5 text-blue-600">
          <Calendar className="w-4 h-4" />
          <h4 className="text-sm font-bold text-gray-800">Lịch trình hôm nay</h4>
        </div>
        <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 py-0.5 px-2 rounded-full">
          {dayNameInVietnamese} (Hôm nay)
        </span>
      </div>

      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {todaysScheduleList.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-xs">
            Trống lịch. Không có hoạt động hoặc buổi học nào hôm nay!
          </div>
        ) : (
          todaysScheduleList.map((sch, i) => (
            <div key={i} className="group flex flex-col gap-1 p-2.5 rounded-lg bg-slate-50 border-l-4 border-blue-600 hover:bg-blue-50/50 transition-colors">
              <span className="text-xs font-bold text-gray-800 line-clamp-1">{sch.courseName}</span>
              <span className="text-[10px] font-mono font-bold text-gray-400">{sch.code}</span>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                  Ca {sch.slot} • {sch.time}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                  {sch.room}
                </span>
              </div>
              {sch.teacherName && (
                <span className="text-[10px] text-gray-400 lowercase mt-1 block">
                  Giảng viên: <b className="text-gray-600 uppercase">{sch.teacherName}</b>
                </span>
              )}
            </div>
          ))
        )}
      </div>

      <div className="border-t pt-2.5 mt-3 flex justify-end">
        <button
          onClick={onClose}
          className="text-[10px] font-bold text-gray-600 hover:text-blue-600 transition-colors"
        >
          Đóng cửa sổ
        </button>
      </div>
    </div>
  );
};
