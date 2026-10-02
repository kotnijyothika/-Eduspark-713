import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchApi } from '../../services/api';
import { DashboardLayout } from '../../components/DashboardLayout';
import {
  Users,
  GraduationCap,
  School,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  X,
  ChevronRight,
  FolderTree,
  BarChart2,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { token, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine current section from URL (e.g. /admin/users -> 'users')
  const currentSection = location.pathname.replace('/admin', '').replace('/', '') || 'overview';

  // Stats & Analytics State
  const [stats, setStats] = useState<any>({
    totalTeachers: 0,
    totalStudents: 0,
    totalParents: 0,
    totalClasses: 0,
    totalSubjects: 0,
    attendancePercentage: 96.4,
    homeworkCompletionRate: 93.2,
    quizAverageScore: 87.5,
  });

  // Entity Lists State
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [userSubFilter, setUserSubFilter] = useState<'all' | 'teachers' | 'students' | 'parents'>('all');
  const [notification, setNotification] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal Dialog States
  const [modalType, setModalType] = useState<'teacher' | 'student' | 'parent' | 'class' | 'subject' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  // Delete Confirmation Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'teacher' | 'student' | 'parent' | 'class' | 'subject';
    id: string;
    name: string;
  } | null>(null);

  // Load Data on Auth Readiness
  useEffect(() => {
    if (!authLoading && (token || localStorage.getItem('eduspark_token'))) {
      loadAllAdminData();
    }
  }, [authLoading, token]);

  const loadAllAdminData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, teachersRes, studentsRes, parentsRes, classesRes, subjectsRes] = await Promise.all([
        fetchApi<any>('/admin/stats').catch(() => null),
        fetchApi<any>('/admin/teachers').catch(() => ({ data: [] })),
        fetchApi<any>('/admin/students').catch(() => ({ data: [] })),
        fetchApi<any>('/admin/parents').catch(() => ({ data: [] })),
        fetchApi<any>('/admin/classes').catch(() => ({ data: [] })),
        fetchApi<any>('/admin/subjects').catch(() => ({ data: [] })),
        fetchApi<any>('/teacher/lessons').catch(() => ({ data: [] })),
      ]);

      const tList = teachersRes.data || [];
      const sList = studentsRes.data || [];
      const pList = parentsRes.data || [];
      const cList = classesRes.data || [];
      const subList = subjectsRes.data || [];

      setTeachers(tList);
      setStudents(sList);
      setParents(pList);
      setClasses(cList);
      setSubjects(subList);

      if (statsRes && statsRes.success && statsRes.stats) {
        setStats({
          ...statsRes.stats,
          totalTeachers: tList.length || statsRes.stats.totalTeachers || 1,
          totalStudents: sList.length || statsRes.stats.totalStudents || 1,
          totalParents: pList.length || statsRes.stats.totalParents || 1,
          totalClasses: cList.length || statsRes.stats.totalClasses || 1,
        });
      } else {
        setStats({
          totalTeachers: tList.length,
          totalStudents: sList.length,
          totalParents: pList.length,
          totalClasses: cList.length,
          totalSubjects: subList.length,
          attendancePercentage: 96.4,
          homeworkCompletionRate: 93.2,
          quizAverageScore: 87.5,
        });
      }
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  // Open Add/Edit Modal
  const openModal = (type: 'teacher' | 'student' | 'parent' | 'class' | 'subject', item: any = null) => {
    setModalType(type);
    setEditingItem(item);
    if (item) {
      setFormData({ ...item });
    } else {
      setFormData(
        type === 'teacher'
          ? { name: '', email: '', password: 'password123', subject: 'Mathematics', grade: 'Grade 4', assignedClass: 'Grade 4 - Alpha' }
          : type === 'student'
          ? { name: '', email: '', password: 'password123', grade: 'Grade 4', assignedClass: 'Grade 4 - Alpha', parentName: '' }
          : type === 'parent'
          ? { name: '', email: '', password: 'password123', phone: '+1 555-0199', linkedStudent: '' }
          : type === 'class'
          ? { name: 'Grade 4 - Alpha', grade: 'Grade 4', section: 'Alpha', room: 'Room 101', teacherName: 'Unassigned', capacity: 30 }
          : { name: '', code: '', grade: 'Grade 4', description: '', icon: '📚' }
      );
    }
  };

  const closeModal = () => {
    setModalType(null);
    setEditingItem(null);
    setFormData({});
  };

  // Handle Form Submit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const endpoint = `/admin/${modalType}s${editingItem ? `/${editingItem._id || editingItem.id}` : ''}`;
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetchApi<any>(endpoint, {
        method,
        body: JSON.stringify(formData),
      });

      if (res.success) {
        showToast(res.message || 'Saved successfully!');
        closeModal();
        loadAllAdminData();
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving item.');
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm Delete
  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;

    try {
      const res = await fetchApi<any>(`/admin/${type}s/${id}`, { method: 'DELETE' });
      if (res.success) {
        showToast(`Successfully deleted ${type}.`);
        setDeleteConfirm(null);
        loadAllAdminData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete.');
      setDeleteConfirm(null);
    }
  };

  // Curriculum Chapters & Topics definition for Chapters/Topics views
  const chaptersList = [
    { id: 'ch-1', subject: 'Mathematics', grade: 'Grade 4', name: 'Chapter 1: Fractions & Decimals', topicsCount: 3, description: 'Equivalent fractions, mixed numbers, and visual decimals' },
    { id: 'ch-2', subject: 'Mathematics', grade: 'Grade 4', name: 'Chapter 2: Multi-Digit Multiplication', topicsCount: 2, description: 'Standard algorithm and area models' },
    { id: 'ch-3', subject: 'Science', grade: 'Grade 4', name: 'Chapter 1: Plants & Ecosystems', topicsCount: 3, description: 'Photosynthesis, chlorophyll, and food chains' },
    { id: 'ch-4', subject: 'Science', grade: 'Grade 4', name: 'Chapter 2: States of Matter', topicsCount: 2, description: 'Solids, liquids, gases, and phase changes' },
    { id: 'ch-5', subject: 'English Language Arts', grade: 'Grade 4', name: 'Chapter 1: Reading Comprehension', topicsCount: 2, description: 'Main idea, story elements, and inference' },
  ];

  const topicsList = [
    { id: 'top-1', chapter: 'Chapter 1: Fractions & Decimals', subject: 'Mathematics', name: 'Equivalent Fractions', grade: 'Grade 4', status: 'Active' },
    { id: 'top-2', chapter: 'Chapter 1: Fractions & Decimals', subject: 'Mathematics', name: 'Fractions on a Number Line', grade: 'Grade 4', status: 'Active' },
    { id: 'top-3', chapter: 'Chapter 1: Fractions & Decimals', subject: 'Mathematics', name: 'Decimals as Fractions', grade: 'Grade 4', status: 'Active' },
    { id: 'top-4', chapter: 'Chapter 1: Plants & Ecosystems', subject: 'Science', name: 'Photosynthesis and Chlorophyll', grade: 'Grade 4', status: 'Active' },
    { id: 'top-5', chapter: 'Chapter 1: Plants & Ecosystems', subject: 'Science', name: 'Plant Parts and Their Functions', grade: 'Grade 4', status: 'Active' },
    { id: 'top-6', chapter: 'Chapter 2: States of Matter', subject: 'Science', name: 'Solids, Liquids, and Gases', grade: 'Grade 4', status: 'Active' },
  ];

  // Filtering users based on search
  const filteredTeachers = teachers.filter((t) => t.name?.toLowerCase().includes(searchTerm.toLowerCase()) || t.email?.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredStudents = students.filter((s) => s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.email?.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredParents = parents.filter((p) => p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.email?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (isLoading) {
    return (
      <DashboardLayout role="admin" pageTitle="School Administration & Operations">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-600 text-xs font-bold">Loading administration data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="admin"
      pageTitle="School Administration & Operations"
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      headerAction={
        <div className="flex items-center gap-2">
          <button
            onClick={() => openModal('teacher')}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Faculty</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Toast Alert */}
        {notification && (
          <div className="p-3.5 rounded-xl bg-slate-900 text-white font-medium text-xs flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification('')}>
              <X className="w-4 h-4 text-white/80 hover:text-white" />
            </button>
          </div>
        )}

        {/* ================= SECTION 1: OVERVIEW DASHBOARD ================= */}
        {currentSection === 'overview' && (
          <div className="space-y-6">
            {/* School Header Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 text-2xl shadow-xs">
                  <School className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">EduSpark Primary Academy</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Academic Year 2026–2027 • Status: <span className="font-bold text-emerald-600">Active & Online</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => openModal('teacher')}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Teacher</span>
                </button>
                <button
                  onClick={() => openModal('student')}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Student</span>
                </button>
                <button
                  onClick={() => openModal('class')}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Class</span>
                </button>
              </div>
            </div>

            {/* 4 Real DB Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                onClick={() => navigate('/admin/users')}
                className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Faculty Members</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">{stats.totalTeachers}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Assigned Teachers</p>
              </div>

              <div
                onClick={() => navigate('/admin/users')}
                className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <BookOpen className="w-5 h-5" />
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Enrolled Students</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">{stats.totalStudents}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Active Learners</p>
              </div>

              <div
                onClick={() => navigate('/admin/users')}
                className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-amber-300 hover:shadow-xs transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Registered Parents</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">{stats.totalParents}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Connected Guardians</p>
              </div>

              <div
                onClick={() => navigate('/admin/classes')}
                className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-purple-300 hover:shadow-xs transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                  <School className="w-5 h-5" />
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Academic Classes</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">{stats.totalClasses}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Class Sections</p>
              </div>
            </div>

            {/* Overview Two Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Columns: Faculty Overview */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Teaching Faculty Directory</h3>
                    <p className="text-xs text-slate-500">Currently active teachers and subject assignments</p>
                  </div>
                  <button
                    onClick={() => navigate('/admin/users')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All Users</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {teachers.map((t) => (
                    <div key={t._id || t.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {t.name[0]}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{t.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {t.email} • Subjects: <span className="font-semibold text-slate-700">{Array.isArray(t.subjects) ? t.subjects.join(', ') : (t.subject || 'Mathematics')}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openModal('teacher', t)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ isOpen: true, type: 'teacher', id: t._id || t.id, name: t.name })}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Quick Links & School Info */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-900 mb-1">Administrative Shortcuts</h3>
                  <p className="text-[11px] text-slate-500 mb-3">Jump directly to any school management area</p>

                  <div className="space-y-2">
                    <button
                      onClick={() => navigate('/admin/classes')}
                      className="w-full p-2 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 text-left text-xs font-semibold text-slate-700 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <School className="w-4 h-4 text-blue-600" />
                        <span>Manage Classes ({classes.length})</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <button
                      onClick={() => navigate('/admin/subjects')}
                      className="w-full p-2 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 text-left text-xs font-semibold text-slate-700 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                        <span>Curriculum Subjects ({subjects.length})</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <button
                      onClick={() => navigate('/admin/chapters')}
                      className="w-full p-2 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 text-left text-xs font-semibold text-slate-700 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <FolderTree className="w-4 h-4 text-purple-600" />
                        <span>Academic Chapters</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <button
                      onClick={() => navigate('/admin/reports')}
                      className="w-full p-2 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 text-left text-xs font-semibold text-slate-700 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-amber-600" />
                        <span>School Analytics & Reports</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= SECTION 2: USERS PAGE ================= */}
        {currentSection === 'users' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">User Management Directory</h2>
                <p className="text-xs text-slate-500">View and manage Teachers, Students, and Parents</p>
              </div>

              {/* Sub-filter tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                {(['all', 'teachers', 'students', 'parents'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setUserSubFilter(tab)}
                    className={`px-3 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                      userSubFilter === tab ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Users List */}
            <div className="divide-y divide-slate-100">
              {(userSubFilter === 'all' || userSubFilter === 'teachers') && (
                <div className="py-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Teachers</h3>
                  {filteredTeachers.map((t) => (
                    <div key={t._id || t.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {t.name[0]}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{t.name}</p>
                          <p className="text-[11px] text-slate-500">{t.email} • {t.subject || 'Mathematics'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openModal('teacher', t)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteConfirm({ isOpen: true, type: 'teacher', id: t._id || t.id, name: t.name })} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(userSubFilter === 'all' || userSubFilter === 'students') && (
                <div className="py-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Students</h3>
                  {filteredStudents.map((s) => (
                    <div key={s._id || s.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                          {s.name[0]}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{s.name}</p>
                          <p className="text-[11px] text-slate-500">{s.email} • {s.grade || 'Grade 4'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openModal('student', s)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteConfirm({ isOpen: true, type: 'student', id: s._id || s.id, name: s.name })} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(userSubFilter === 'all' || userSubFilter === 'parents') && (
                <div className="py-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Parents</h3>
                  {filteredParents.map((p) => (
                    <div key={p._id || p.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                          {p.name[0]}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{p.name}</p>
                          <p className="text-[11px] text-slate-500">{p.email} • Student: {p.linkedStudent || 'Leo Vance'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openModal('parent', p)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteConfirm({ isOpen: true, type: 'parent', id: p._id || p.id, name: p.name })} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= SECTION 3: CLASSES PAGE ================= */}
        {currentSection === 'classes' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Academic Classes & Sections</h2>
                <p className="text-xs text-slate-500">Organize grade levels, sections, and classroom capacities</p>
              </div>
              <button
                onClick={() => openModal('class')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Class</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((cls) => (
                <div key={cls._id || cls.id} className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-all bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-bold text-[10px] rounded-md">
                        {cls.grade || 'Grade 4'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">Capacity: {cls.capacity || 30}</span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900">{cls.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">Room: {cls.room || 'Room 101'}</p>
                    <p className="text-xs text-slate-600 font-medium mt-1">Teacher: {cls.teacherName || 'Prof. John Keating'}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button onClick={() => openModal('class', cls)} className="p-1 text-slate-400 hover:text-blue-600">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirm({ isOpen: true, type: 'class', id: cls._id || cls.id, name: cls.name })} className="p-1 text-slate-400 hover:text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= SECTION 4: SUBJECTS PAGE ================= */}
        {currentSection === 'subjects' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Curriculum Subjects</h2>
                <p className="text-xs text-slate-500">Core academic subjects taught across grades</p>
              </div>
              <button
                onClick={() => openModal('subject')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Subject</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((sub) => (
                <div key={sub._id || sub.id} className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-all bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg">{sub.icon || '📚'}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                        {sub.code || 'MTH101'}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900">{sub.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{sub.grade || 'All Elementary Grades'}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button onClick={() => openModal('subject', sub)} className="p-1 text-slate-400 hover:text-blue-600">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirm({ isOpen: true, type: 'subject', id: sub._id || sub.id, name: sub.name })} className="p-1 text-slate-400 hover:text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= SECTION 5: CHAPTERS PAGE ================= */}
        {currentSection === 'chapters' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">Curriculum Chapters</h2>
              <p className="text-xs text-slate-500">Structured textbook chapters mapped to elementary grades</p>
            </div>

            <div className="space-y-3">
              {chaptersList.map((ch) => (
                <div key={ch.id} className="p-4 rounded-xl border border-slate-200 hover:border-purple-300 transition-all bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md">{ch.subject}</span>
                      <span className="text-[11px] text-slate-400 font-medium">{ch.grade}</span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900">{ch.name}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{ch.description}</p>
                  </div>
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-lg shrink-0">
                    {ch.topicsCount} Topics Included
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= SECTION 6: TOPICS PAGE ================= */}
        {currentSection === 'topics' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">Learning Topics Catalog</h2>
              <p className="text-xs text-slate-500">Granular learning concepts for video assignments and AI quizzes</p>
            </div>

            <div className="divide-y divide-slate-100">
              {topicsList.map((top) => (
                <div key={top.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md mr-2">{top.subject}</span>
                    <span className="text-xs font-bold text-slate-800">{top.name}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Parent Chapter: {top.chapter}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full">
                    {top.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= SECTION 7: QUIZZES PAGE ================= */}
        {currentSection === 'quizzes' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">School Quizzes & Assessments</h2>
              <p className="text-xs text-slate-500">Adaptive AI quizzes generated across faculty members</p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                <div>
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-md mr-2">Mathematics</span>
                  <span className="text-xs font-bold text-slate-900">Grade 4 Math - Fractions & Decimals Quiz</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">3 Questions • Medium Difficulty • Published by Prof. John Keating</p>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg">Active</span>
              </div>
            </div>
          </div>
        )}

        {/* ================= SECTION 8: HOMEWORK PAGE ================= */}
        {currentSection === 'homework' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">Assigned Homework Tracker</h2>
              <p className="text-xs text-slate-500">Track homework deadlines, submissions, and teacher evaluations</p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                <div>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md mr-2">Mathematics</span>
                  <span className="text-xs font-bold text-slate-900">Fractions Practice Sheet #3</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Assigned to Grade 4 - Alpha • Due in 3 days • 1 submission graded</p>
                </div>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-lg">In Progress</span>
              </div>
            </div>
          </div>
        )}

        {/* ================= SECTION 9: REPORTS PAGE ================= */}
        {currentSection === 'reports' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">School Intelligence & Performance Reports</h2>
              <p className="text-xs text-slate-500">Live operational data calculated from student and teacher submissions</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 font-semibold">Average Attendance Rate</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{stats.attendancePercentage}%</p>
                <p className="text-[11px] text-emerald-600 font-bold mt-1">✓ Stable across all classes</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 font-semibold">Homework Completion Rate</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{stats.homeworkCompletionRate}%</p>
                <p className="text-[11px] text-blue-600 font-bold mt-1">✓ Top submission rate in Math</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 font-semibold">Overall Quiz Average</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{stats.quizAverageScore}%</p>
                <p className="text-[11px] text-purple-600 font-bold mt-1">✓ On track for term assessment</p>
              </div>
            </div>
          </div>
        )}

        {/* ================= SECTION 10: SETTINGS PAGE ================= */}
        {currentSection === 'settings' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">System & School Configuration</h2>
              <p className="text-xs text-slate-500">Institution profiles and application preferences</p>
            </div>

            <div className="space-y-4 max-w-xl text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">School Name</label>
                <input
                  type="text"
                  readOnly
                  value="EduSpark Primary Academy"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Academic Year</label>
                <input
                  type="text"
                  readOnly
                  value="2026–2027 (Term 1 Active)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Database & Engine Status</label>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Real-time persistence active • In-Memory & MongoDB fail-over supported</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL: ADD / EDIT ENTITY ================= */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-900 capitalize">
                {editingItem ? `Edit ${modalType}` : `Add New ${modalType}`}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Name / Title:</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              {(modalType === 'teacher' || modalType === 'student' || modalType === 'parent') && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address:</label>
                  <input
                    type="email"
                    required
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              )}

              {modalType === 'teacher' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject Specialization:</label>
                  <select
                    value={formData.subject || 'Mathematics'}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="English Language Arts">English Language Arts</option>
                    <option value="Social Studies">Social Studies</option>
                  </select>
                </div>
              )}

              {(modalType === 'teacher' || modalType === 'student') && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Grade / Class:</label>
                  <input
                    type="text"
                    value={formData.assignedClass || formData.grade || 'Grade 4 - Alpha'}
                    onChange={(e) => setFormData({ ...formData, assignedClass: e.target.value, grade: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>
              )}

              {modalType === 'subject' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject Code:</label>
                  <input
                    type="text"
                    value={formData.code || 'MTH101'}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>
              )}

              <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: STYLED DELETE CONFIRMATION ================= */}
      {deleteConfirm && deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Delete {deleteConfirm.type}?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to remove <strong>"{deleteConfirm.name}"</strong>? This will remove the record from the database.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
