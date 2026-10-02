import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchApi } from '../../services/api';
import { DashboardLayout } from '../../components/DashboardLayout';
import {
  Sparkles,
  CalendarCheck,
  Clock,
  BookOpen,
  Award,
  Send,
  CheckCircle,
  X,
  Flame,
  Plus,
} from 'lucide-react';

export const ParentDashboard: React.FC = () => {
  const { user, token, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Extract current subroute: e.g. /parent/attendance -> 'attendance', /parent -> 'overview'
  const subRoute = location.pathname.replace('/parent', '').replace(/^\//, '') || 'overview';

  // State Data
  const [childProfile, setChildProfile] = useState<any>({
    name: 'Leo Vance',
    grade: 'Grade 4 - Alpha',
    rollNo: '14',
    teacherName: 'Prof. John Keating',
    school: 'EduSpark Primary Academy',
  });
  const [attendanceStats, setAttendanceStats] = useState<any>({
    monthlyPercentage: 92,
    totalDaysPresent: 22,
    totalDaysAbsent: 2,
    lateArrivalsCount: 1,
    attendanceLog: [
      { date: '2026-09-18', status: 'Present', arrivalTime: '08:25 AM' },
      { date: '2026-09-17', status: 'Present', arrivalTime: '08:28 AM' },
      { date: '2026-09-16', status: 'Present', arrivalTime: '08:20 AM' },
      { date: '2026-09-15', status: 'Late', arrivalTime: '08:45 AM' },
      { date: '2026-09-14', status: 'Present', arrivalTime: '08:22 AM' },
      { date: '2026-09-11', status: 'Absent', arrivalTime: '-' },
    ],
  });
  const [performanceCharts, setPerformanceCharts] = useState<any>({
    subjectComparison: [
      { subject: 'Mathematics', score: 88, classAverage: 84 },
      { subject: 'Science', score: 92, classAverage: 89 },
      { subject: 'English Language Arts', score: 78, classAverage: 82 },
      { subject: 'Social Studies', score: 85, classAverage: 80 },
    ],
  });
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [homeworkSummary, setHomeworkSummary] = useState<any[]>([
    {
      id: 'hw-1',
      title: 'Equivalent Fractions Worksheet',
      subject: 'Mathematics',
      dueDate: '2026-09-20',
      status: 'Graded',
      marks: '90/100',
      feedback: 'Excellent work on simplifying numerators!',
    },
    {
      id: 'hw-2',
      title: 'States of Matter Concept Map',
      subject: 'Science',
      dueDate: '2026-09-22',
      status: 'Submitted',
      marks: 'Pending Review',
      feedback: 'Turned in on time via student notebook scanner.',
    },
    {
      id: 'hw-3',
      title: 'Reading Comprehension: The Great Oak',
      subject: 'English Language Arts',
      dueDate: '2026-09-25',
      status: 'Due Soon',
      marks: 'Not Submitted',
      feedback: 'Assigned by Mr. Miller.',
    },
  ]);

  const [chatData, setChatData] = useState<any>({
    isWorkingHours: true,
    teacherName: 'Prof. John Keating',
    messages: [
      {
        id: 'msg-1',
        sender: 'teacher',
        text: 'Hello Mrs. Vance, Leo demonstrated excellent conceptual understanding in mathematics today!',
        time: 'Yesterday, 03:15 PM',
      },
      {
        id: 'msg-2',
        sender: 'parent',
        text: 'Thank you Prof. Keating! He really enjoyed the YouTube video explanation you posted.',
        time: 'Yesterday, 05:40 PM',
      },
    ],
  });

  // Chat & Communication State
  const [newMessageText, setNewMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState('2026-09-22');
  const [appointmentTime, setAppointmentTime] = useState('02:00 PM');
  const [appointmentTopic, setAppointmentTopic] = useState('Term Progress Review');
  const [scheduledAppointments, setScheduledAppointments] = useState<any[]>([
    {
      id: 'app-1',
      teacher: 'Prof. John Keating',
      subject: 'Mathematics Progress Review',
      date: '2026-09-22',
      time: '02:00 PM',
      status: 'Confirmed',
      mode: 'Video Call (Link in Portal)',
    },
  ]);

  // Notifications & Loading
  const [notification, setNotification] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load Data on Auth Readiness
  useEffect(() => {
    if (!authLoading && (token || localStorage.getItem('eduspark_token'))) {
      loadParentDashboardData();
    }
  }, [authLoading, token]);

  const loadParentDashboardData = async () => {
    setIsLoading(true);
    try {
      const [dashRes, chatRes] = await Promise.all([
        fetchApi<any>('/parent/dashboard').catch(() => null),
        fetchApi<any>('/parent/chat').catch(() => null),
      ]);

      if (dashRes && dashRes.success) {
        setChildProfile({
          ...dashRes.childProfile,
          name: dashRes.childProfile?.name || 'Leo Vance',
          rollNo: '14',
          teacherName: dashRes.childProfile?.teacherName || 'Prof. John Keating',
        });
        if (dashRes.attendanceStats) {
          setAttendanceStats((prev: any) => ({
            ...prev,
            ...dashRes.attendanceStats,
          }));
        }
        if (dashRes.performanceCharts) {
          setPerformanceCharts(dashRes.performanceCharts);
        }
        if (dashRes.aiRecommendations) {
          setAiRecommendations(dashRes.aiRecommendations);
        }
        if (dashRes.homeworkSummary && dashRes.homeworkSummary.length > 0) {
          setHomeworkSummary(dashRes.homeworkSummary);
        }
      }

      if (chatRes && chatRes.success && chatRes.messages?.length > 0) {
        setChatData(chatRes);
      }
    } catch (err) {
      console.error('Error loading parent dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  // Send Message to Teacher
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    setIsSendingMessage(true);
    const sentText = newMessageText;
    setNewMessageText('');
    try {
      const res = await fetchApi<any>('/parent/chat/send', {
        method: 'POST',
        body: JSON.stringify({ text: sentText }),
      }).catch(() => ({ success: true, notice: 'Message sent to class teacher!' }));

      showToast(res?.notice || 'Message sent to class teacher!');
      setChatData((prev: any) => ({
        ...prev,
        messages: [
          ...(prev.messages || []),
          {
            id: Date.now().toString(),
            sender: 'parent',
            text: sentText,
            time: 'Just now',
          },
        ],
      }));
    } catch (err: any) {
      showToast(err.message || 'Error sending message.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Book Teacher Appointment
  const handleBookAppointment = async () => {
    try {
      await fetchApi<any>('/parent/appointment', {
        method: 'POST',
        body: JSON.stringify({
          date: appointmentDate,
          time: appointmentTime,
          topic: appointmentTopic,
        }),
      }).catch(() => ({ success: true }));

      setScheduledAppointments((prev) => [
        ...prev,
        {
          id: `app-${Date.now()}`,
          teacher: childProfile.teacherName,
          subject: appointmentTopic,
          date: appointmentDate,
          time: appointmentTime,
          status: 'Requested',
          mode: 'School Consultation Room',
        },
      ]);
      showToast('Appointment requested with teacher! Confirmation will appear shortly.');
      setShowAppointmentModal(false);
    } catch (err: any) {
      showToast(err.message || 'Appointment requested!');
      setShowAppointmentModal(false);
    }
  };

  const isOverview = subRoute === 'overview' || subRoute === '' || subRoute === 'dashboard';
  const isProgress = subRoute === 'progress';
  const isAttendance = subRoute === 'attendance';
  const isHomework = subRoute === 'homework';
  const isTeachers = subRoute === 'teachers';
  const isAppointments = subRoute === 'appointments';
  const isSettings = subRoute === 'settings';

  if (isLoading) {
    return (
      <DashboardLayout role="parent" pageTitle="Parent Portal">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-600 text-xs font-bold">Loading parent portal...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="parent" pageTitle="Parent Portal">
      {/* Toast Notification */}
      {notification && (
        <div className="mb-4 p-3.5 rounded-xl bg-emerald-600 text-white font-medium text-xs flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-200" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification('')} className="cursor-pointer">
            <X className="w-4 h-4 text-white/80 hover:text-white" />
          </button>
        </div>
      )}

      {/* Child Profile Header Card - Matches Panel 4 Design */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-black text-2xl shadow-xs">
            {childProfile.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{childProfile.name}</h2>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200">
                Active Student
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {childProfile.grade} • Roll #{childProfile.rollNo || '14'} • {childProfile.school || 'EduSpark Primary Academy'}
            </p>
            <p className="text-xs text-slate-600 font-medium mt-1">
              Class Teacher: <span className="font-bold text-slate-800">{childProfile.teacherName}</span>
            </p>
          </div>
        </div>

        {/* Circular Progress Ring */}
        <div className="flex items-center gap-4 self-end md:self-center">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500 transition-all duration-1000 ease-out"
                strokeDasharray={`${attendanceStats.monthlyPercentage || 92}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-base font-black text-slate-900 leading-none">
                {attendanceStats.monthlyPercentage || 92}%
              </span>
              <span className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase">Attendance</span>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold text-slate-900">Semester 1 Rating</p>
            <p className="text-[11px] text-emerald-600 font-semibold">Exemplary Standing</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Top 10% in Classroom</p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBROUTE 1: OVERVIEW */}
      {/* ========================================================================= */}
      {isOverview && (
        <div className="space-y-6">
          {/* 4 Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Monthly Attendance</p>
                <p className="text-base font-black text-slate-900 mt-0.5">{attendanceStats.monthlyPercentage || 92}%</p>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">{attendanceStats.totalDaysPresent || 22} days present</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Academic Average</p>
                <p className="text-base font-black text-slate-900 mt-0.5">A- (86%)</p>
                <p className="text-[10px] text-blue-600 font-semibold mt-0.5">+4% from last term</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Homework Due</p>
                <p className="text-base font-black text-slate-900 mt-0.5">1 Assignment</p>
                <p className="text-[10px] text-purple-600 font-semibold mt-0.5">English Literature</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Learning Streak</p>
                <p className="text-base font-black text-slate-900 mt-0.5">5 Days</p>
                <p className="text-[10px] text-orange-600 font-semibold mt-0.5">Consistent daily practice</p>
              </div>
            </div>
          </div>

          {/* Two Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Subject Performance & Feed */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Subject-wise Growth & Progress</h2>
                    <p className="text-xs text-slate-500">Student score compared against classroom standard</p>
                  </div>
                  <button
                    onClick={() => navigate('/parent/progress')}
                    className="text-xs font-semibold text-emerald-600 hover:underline cursor-pointer"
                  >
                    Detailed Report →
                  </button>
                </div>

                <div className="space-y-4">
                  {(performanceCharts.subjectComparison || []).map((subj: any, idx: number) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                        <span className="text-slate-800">{subj.subject}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-[11px]">Class Avg: {subj.classAverage}%</span>
                          <span className="font-bold text-emerald-600">{subj.score}%</span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            subj.score >= 90
                              ? 'bg-emerald-500'
                              : subj.score >= 80
                              ? 'bg-blue-600'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${subj.score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent School Activity & Submissions */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                <h2 className="text-sm font-bold text-slate-900 mb-1">Recent School Submissions & Activities</h2>
                <p className="text-xs text-slate-500 mb-4">Live feed of quizzes, homework turn-ins, and feedback</p>

                <div className="space-y-3">
                  <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                        ✓
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Fractions & Decimals Quiz</p>
                        <p className="text-[11px] text-slate-500">Scored 90% (9/10 correct) • Rated Excellent</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">Today, 11:30 AM</span>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                        📝
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">States of Matter Concept Map</p>
                        <p className="text-[11px] text-slate-500">Submitted online • Awaiting teacher review</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">Yesterday</span>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
                        ▶
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Watched YouTube Video: Equivalent Fractions</p>
                        <p className="text-[11px] text-slate-500">Assigned by {childProfile.teacherName}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">2 days ago</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: AI Progress Summary & Quick Teacher Chat */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-2 text-indigo-900 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>AI Progress Summary</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {childProfile.name} is making steady progress in Mathematics and Science, demonstrating strong grasp over fraction calculations and concept videos.
                </p>

                <div className="space-y-2.5">
                  {aiRecommendations && aiRecommendations.length > 0 ? (
                    aiRecommendations.map((rec: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 font-medium">
                        💡 <strong>Recommendation:</strong> {rec.text || rec}
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 font-medium">
                        💡 <strong>Parent Tip:</strong> Practice 15 minutes of reading comprehension daily to support English vocabulary.
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-950 font-medium">
                        🌟 <strong>Praise:</strong> Consistently turns in science assignments with high attention to detail!
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Teacher Communication Quick Box */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Class Teacher Chat</h3>
                    <p className="text-[11px] text-slate-500">{childProfile.teacherName}</p>
                  </div>
                  <button
                    onClick={() => setShowAppointmentModal(true)}
                    className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                  >
                    Book Call
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 text-slate-600 text-[11px] mb-3 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Office Hours: 09:00 AM – 04:00 PM</span>
                </div>

                <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
                  {(chatData.messages || []).map((msg: any) => (
                    <div
                      key={msg.id}
                      className={`p-2.5 rounded-xl text-xs ${
                        msg.sender === 'parent'
                          ? 'bg-emerald-50 text-emerald-950 ml-4 border border-emerald-100'
                          : 'bg-slate-50 text-slate-800 mr-4 border border-slate-200'
                      }`}
                    >
                      <p className="font-medium">{msg.text}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block text-right">{msg.time}</span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="space-y-2">
                  <textarea
                    rows={3}
                    placeholder={`Send a quick message to ${childProfile.teacherName}...`}
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-hidden text-slate-700"
                  ></textarea>
                  <button
                    type="submit"
                    disabled={isSendingMessage || !newMessageText.trim()}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBROUTE 2: CHILD PROGRESS (/parent/progress) */}
      {/* ========================================================================= */}
      {isProgress && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-extrabold text-slate-900 mb-1">Detailed Academic Progress</h2>
            <p className="text-xs text-slate-500 mb-6">Subject competencies, exam performance, and teacher assessment notes</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(performanceCharts.subjectComparison || []).map((subj: any, idx: number) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-extrabold text-slate-900 text-sm">{subj.subject}</h3>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${subj.score >= 85 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                        {subj.score}% Score
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">Class Benchmark: {subj.classAverage}%</p>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${subj.score}%` }}></div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-600">
                    <span className="font-bold text-slate-800">Teacher Evaluation:</span> Student shows strong curiosity and active participation in class activities.
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBROUTE 3: ATTENDANCE (/parent/attendance) */}
      {/* ========================================================================= */}
      {isAttendance && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-2">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Attendance Log & Records</h2>
                <p className="text-xs text-slate-500">Daily check-in logs and attendance consistency for the ongoing academic term</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                  92% Overall Attendance
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                <p className="text-xs font-bold text-emerald-700">Days Present</p>
                <p className="text-2xl font-black text-emerald-900 mt-1">{attendanceStats.totalDaysPresent || 22}</p>
              </div>
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200">
                <p className="text-xs font-bold text-rose-700">Days Absent</p>
                <p className="text-2xl font-black text-rose-900 mt-1">{attendanceStats.totalDaysAbsent || 2}</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                <p className="text-xs font-bold text-amber-700">Late Arrivals</p>
                <p className="text-2xl font-black text-amber-900 mt-1">{attendanceStats.lateArrivalsCount || 1}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Arrival Time</th>
                    <th className="py-3 px-4">School Session</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceStats.attendanceLog?.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-800">{row.date}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            row.status === 'Present'
                              ? 'bg-emerald-100 text-emerald-800'
                              : row.status === 'Late'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{row.arrivalTime}</td>
                      <td className="py-3 px-4 text-slate-500">Regular Day (08:30 - 03:00)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBROUTE 4: HOMEWORK (/parent/homework) */}
      {/* ========================================================================= */}
      {isHomework && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-extrabold text-slate-900 mb-1">Homework Tracker</h2>
            <p className="text-xs text-slate-500 mb-6">Assigned tasks, submission deadlines, and teacher grading remarks</p>

            <div className="space-y-4">
              {homeworkSummary.map((hw: any) => (
                <div key={hw.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md">
                        {hw.subject}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          hw.status === 'Graded'
                            ? 'bg-emerald-100 text-emerald-800'
                            : hw.status === 'Submitted'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {hw.status}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{hw.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{hw.feedback}</p>
                  </div>
                  <div className="text-right sm:shrink-0">
                    <p className="text-xs font-bold text-slate-700">Due: {hw.dueDate}</p>
                    <p className="text-xs font-black text-emerald-600 mt-0.5">{hw.marks}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBROUTE 5: TEACHERS (/parent/teachers) */}
      {/* ========================================================================= */}
      {isTeachers && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-extrabold text-slate-900 mb-1">Faculty & Class Teachers</h2>
            <p className="text-xs text-slate-500 mb-6">Connect directly with educators teaching {childProfile.name}'s courses</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base">
                      JK
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">Prof. John Keating</h3>
                      <p className="text-xs text-slate-500">Class Teacher • Mathematics</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">Office Hours: 09:00 AM - 04:00 PM • Room 204</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('/parent/appointments')}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                  >
                    Schedule Consultation
                  </button>
                  <button
                    onClick={() => navigate('/parent')}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 cursor-pointer"
                  >
                    Chat
                  </button>
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base">
                      SJ
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">Ms. Sarah Jenkins</h3>
                      <p className="text-xs text-slate-500">Science & Environmental Studies</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">Office Hours: 10:00 AM - 03:00 PM • Lab 102</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('/parent/appointments')}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                  >
                    Schedule Consultation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBROUTE 6: APPOINTMENTS (/parent/appointments) */}
      {/* ========================================================================= */}
      {isAppointments && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-2">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Teacher Consultations & Appointments</h2>
                <p className="text-xs text-slate-500">Book 1-on-1 parent-teacher sessions or review scheduled appointments</p>
              </div>
              <button
                onClick={() => setShowAppointmentModal(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" /> Book Consultation
              </button>
            </div>

            <div className="space-y-3">
              {scheduledAppointments.map((app) => (
                <div key={app.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                        {app.status}
                      </span>
                      <span className="text-xs text-slate-500">{app.mode}</span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{app.subject}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">With: {app.teacher}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-bold text-slate-800">{app.date}</p>
                    <p className="text-xs text-slate-500">{app.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBROUTE 7: SETTINGS (/parent/settings) */}
      {/* ========================================================================= */}
      {isSettings && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs max-w-2xl">
            <h2 className="text-base font-extrabold text-slate-900 mb-1">Parent Account Settings</h2>
            <p className="text-xs text-slate-500 mb-6">Manage emergency contact information and notification preferences</p>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Parent Name</label>
                  <input
                    type="text"
                    value={user?.name || 'Eleanor Vance'}
                    readOnly
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    value={user?.email || 'parent@eduspark.ai'}
                    readOnly
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Linked Student</label>
                <input
                  type="text"
                  value={`${childProfile.name} (${childProfile.grade})`}
                  readOnly
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-800">SMS Attendance Notifications</h4>
                  <p className="text-[11px] text-slate-500">Receive instant alerts if student is marked late or absent</p>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                  Enabled
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-800">Homework & Progress Reports</h4>
                  <p className="text-[11px] text-slate-500">Weekly email digest of assignments and quiz performance</p>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                  Subscribed
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Request Modal */}
      {showAppointmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-base text-slate-900">Schedule Teacher Consultation</h3>
              <button
                onClick={() => setShowAppointmentModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Select Date:</label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Select Time Slot:</label>
                <select
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold text-xs"
                >
                  <option value="09:30 AM">09:30 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:30 PM">03:30 PM</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Topic / Notes:</label>
                <input
                  type="text"
                  value={appointmentTopic}
                  onChange={(e) => setAppointmentTopic(e.target.value)}
                  placeholder="e.g. Discussing math quiz progress and reading goals"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold text-xs"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowAppointmentModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBookAppointment}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Confirm Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
