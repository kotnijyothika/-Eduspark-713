import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Layers,
  BookOpen,
  FolderTree,
  FileText,
  HelpCircle,
  FileCheck,
  BarChart2,
  Settings,
  Sparkles,
  Mic,
  Award,
  Calendar,
  MessageSquare,
  LogOut,
  X,
} from 'lucide-react';
import type { UserRole } from '../types/auth';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ElementType;
}

interface SidebarProps {
  role: UserRole;
  userName?: string;
  userEmail?: string;
  onLogout: (reason?: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  userName = 'User',
  userEmail = '',
  onLogout,
  isOpen = false,
  onClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Role-specific navigation items exactly matching user specification
  const navItemsByRole: Record<UserRole, NavItem[]> = {
    admin: [
      { id: 'dashboard', label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      { id: 'users', label: 'Users', path: '/admin/users', icon: Users },
      { id: 'classes', label: 'Classes', path: '/admin/classes', icon: Layers },
      { id: 'subjects', label: 'Subjects', path: '/admin/subjects', icon: BookOpen },
      { id: 'chapters', label: 'Chapters', path: '/admin/chapters', icon: FolderTree },
      { id: 'topics', label: 'Topics', path: '/admin/topics', icon: FileText },
      { id: 'quizzes', label: 'Quizzes', path: '/admin/quizzes', icon: HelpCircle },
      { id: 'homework', label: 'Homework', path: '/admin/homework', icon: FileCheck },
      { id: 'reports', label: 'Reports', path: '/admin/reports', icon: BarChart2 },
      { id: 'settings', label: 'Settings', path: '/admin/settings', icon: Settings },
    ],
    teacher: [
      { id: 'dashboard', label: 'Dashboard', path: '/teacher', icon: LayoutDashboard },
      { id: 'lessons', label: 'Lessons', path: '/teacher/lessons', icon: BookOpen },
      { id: 'homework', label: 'Homework', path: '/teacher/homework', icon: FileCheck },
      { id: 'quizzes', label: 'AI Quiz Generator', path: '/teacher/quizzes', icon: Sparkles },
      { id: 'analytics', label: 'Student Analytics', path: '/teacher/analytics', icon: BarChart2 },
      { id: 'parents', label: 'Parent Chat', path: '/teacher/parents', icon: MessageSquare },
      { id: 'settings', label: 'Settings', path: '/teacher/settings', icon: Settings },
    ],
    student: [
      { id: 'home', label: 'Home', path: '/student', icon: LayoutDashboard },
      { id: 'lessons', label: "Today's Lessons", path: '/student/lessons', icon: BookOpen },
      { id: 'homework', label: 'Homework', path: '/student/homework', icon: FileCheck },
      { id: 'tutor', label: 'AI Homework Helper', path: '/student/tutor', icon: Sparkles },
      { id: 'voice-tutor', label: 'AI Voice Tutor', path: '/student/voice-tutor', icon: Mic },
      { id: 'quizzes', label: 'Quizzes', path: '/student/quizzes', icon: HelpCircle },
      { id: 'achievements', label: 'Achievements', path: '/student/achievements', icon: Award },
      { id: 'settings', label: 'Settings', path: '/student/settings', icon: Settings },
    ],
    parent: [
      { id: 'dashboard', label: 'Dashboard', path: '/parent', icon: LayoutDashboard },
      { id: 'progress', label: 'Child Progress', path: '/parent/progress', icon: BarChart2 },
      { id: 'attendance', label: 'Attendance', path: '/parent/attendance', icon: Calendar },
      { id: 'homework', label: 'Homework', path: '/parent/homework', icon: FileCheck },
      { id: 'teachers', label: 'Teachers', path: '/parent/teachers', icon: Users },
      { id: 'appointments', label: 'Appointments', path: '/parent/appointments', icon: MessageSquare },
      { id: 'settings', label: 'Settings', path: '/parent/settings', icon: Settings },
    ],
  };

  const navItems = navItemsByRole[role] || navItemsByRole.student;

  const handleNavClick = (path: string) => {
    navigate(path);
    if (onClose) {
      onClose();
    }
  };

  const isItemActive = (itemPath: string) => {
    // Exact match for base dashboard
    if (itemPath === '/admin' || itemPath === '/teacher' || itemPath === '/student' || itemPath === '/parent') {
      return location.pathname === itemPath || location.pathname === `${itemPath}/`;
    }
    // Sub-route match
    return location.pathname === itemPath || location.pathname.startsWith(`${itemPath}/`);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4 fill-white text-white" />
              </div>
              <div>
                <span className="font-black text-slate-900 text-base tracking-tight">EduSpark AI</span>
              </div>
            </div>

            {/* Mobile Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-3.5 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.path);

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                    active
                      ? 'bg-blue-50 text-blue-600 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Footer Profile */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden" title={userEmail || undefined}>
                <p className="text-xs font-bold text-slate-800 truncate leading-tight">{userName}</p>
                <p className="text-[10px] text-slate-500 capitalize">{role}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                console.log('[Sidebar] User clicked sidebar sign out button');
                onLogout();
              }}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
