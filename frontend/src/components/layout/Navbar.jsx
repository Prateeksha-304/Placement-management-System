import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { NAV_ITEMS } from '../../utils/constants';
import NotificationPanel from '../common/NotificationPanel';
import { useData } from '../../hooks/useData';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { notifications } = useData();
  const unreadCount = notifications.filter(n => (n.userId === currentUser?.id || n.userId === 'all') && (n.userId === 'all' ? !(n.readBy || []).includes(currentUser?.id) : !n.read)).length;
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return <>
    <div className="sticky top-0 z-30 shadow-sm">
      <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-3 sm:h-16 sm:px-6">
        <div className="flex items-center gap-2">
          <img src="/icons/kle-tech-logo.png" alt="KLE Tech" className="h-9 w-9 object-contain" />
          <div className="leading-tight">
            <span className="text-base font-bold text-gray-900">KLE Tech</span>
            <span className="block text-[10px] font-medium text-gray-500">Placement Portal</span>
          </div>
          <span className="ml-3 hidden border-l border-gray-200 pl-3 text-sm font-medium text-gray-700 sm:inline">
            Welcome, {currentUser?.name?.split(' ')[0] || 'User'}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} className="rounded-full p-2 text-gray-600 hover:bg-gray-100">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button onClick={() => currentUser?.role === 'student' ? navigate('/student/notifications') : setNotifOpen(true)} aria-label="Notifications" className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white ring-2 ring-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>
          <button onClick={handleLogout} aria-label="Log out" className="flex items-center rounded-lg p-2 text-gray-600 hover:bg-red-50 hover:text-red-700">
            <LogOut className="h-5 w-5 sm:mr-2" /><span className="hidden text-sm font-medium sm:inline">Logout</span>
          </button>
          <div className="header-avatar flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white" aria-label={`${currentUser?.name || 'User'} profile`}>
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </header>
      <nav aria-label="Main navigation" className="overflow-x-auto overscroll-x-contain bg-[#111111] text-white">
        <div className="flex min-w-max items-stretch px-2 sm:px-4">
          {(NAV_ITEMS[currentUser?.role] || []).map(item => <NavLink
            key={item.path}
            to={item.path}
            end
            className={({ isActive }) => `flex min-h-12 items-center whitespace-nowrap border-b-[3px] px-3 text-sm font-semibold transition-colors sm:px-4 ${isActive ? 'border-red-600 bg-white/10 text-white' : 'border-transparent text-white/85 hover:bg-white/10 hover:text-white'}`}
          >{item.label}</NavLink>)}
        </div>
      </nav>
    </div>
    <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
  </>;
};

export default Navbar;
