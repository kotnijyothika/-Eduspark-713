import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Menu, Bell, LogOut, Search } from 'lucide-react';
import type { UserRole } from '../types/auth';

interface DashboardLayoutProps {
  role: UserRole;
  children: React.ReactNode;
  pageTitle?: string;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  headerAction?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  role,
  children,
  pageTitle,
  searchTerm,
  onSearchChange,
  headerAction,
}) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Role labels and fallbacks
  const roleDisplayNames: Record<UserRole, { title: string; subtitle: string }> = {
    admin: { title: user?.name || 'Dr. Sarah Connor', subtitle: 'Super Admin' },
    teacher: { title: user?.name || 'Prof. John Keating', subtitle: 'Teacher' },
    student: { title: user?.name || 'Leo Vance', subtitle: 'Student' },
    parent: { title: user?.name || 'Eleanor Vance', subtitle: 'Parent' },
  };

  const currentProfile = roleDisplayNames[role] || { title: user?.name || 'User', subtitle: role };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans antialiased text-slate-800">
      {/* Role-Specific Navigation Sidebar */}
      <Sidebar
        role={role}
        userName={currentProfile.title}
        userEmail={user?.email || ''}
        onLogout={logout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Wrapper - Offset by exactly 256px (w-64) on desktop so content NEVER overlaps */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-slate-500 hover:text-slate-800 lg:hidden rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              title="Open Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {pageTitle && (
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                {pageTitle}
              </h1>
            )}

            {onSearchChange && (
              <div className="relative w-60 sm:w-72 hidden md:block">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search records, subjects, items..."
                  value={searchTerm || ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-100 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden text-slate-700 transition-all"
                />
              </div>
            )}
          </div>

          {/* Right Header Actions & Profile Pill */}
          <div className="flex items-center gap-3">
            {headerAction && <div className="hidden sm:block">{headerAction}</div>}

            <button
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 bg-blue-600 rounded-full absolute top-1.5 right-1.5 ring-2 ring-white"></span>
            </button>

            {/* Logged In User Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {currentProfile.title.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[140px]">
                  {currentProfile.title}
                </p>
                <p className="text-[10px] text-slate-500">{currentProfile.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  console.log('[DashboardLayout] User clicked header sign out button');
                  logout('User clicked Sign Out button in Dashboard header');
                }}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Body Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
