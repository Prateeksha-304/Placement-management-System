import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { NAV_ITEMS } from '../../utils/constants';
import * as Icons from 'lucide-react';

const Sidebar = () => {
  const { currentUser } = useAuth();
  const navItems = currentUser?.role ? NAV_ITEMS[currentUser.role] || [] : [];

  return (
    <div className="hidden md:flex flex-col w-64 bg-white text-gray-900 fixed h-full shadow-lg border-r border-gray-200 z-20">
      <div className="flex items-center px-6 py-6 h-16 border-b border-gray-100">
        <img src="/icons/kle-tech-logo.png" alt="KLE Tech logo" className="h-10 w-10 object-contain mr-3" />
        <div className="leading-tight"><span className="text-lg font-bold tracking-tight">KLE Tech</span><span className="block text-[10px] uppercase tracking-wider text-gray-500">Placement Portal</span></div>
      </div>
      
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = Icons[item.icon] || Icons.Circle;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className={({ isActive }) =>
                  `flex items-center px-3 py-3 rounded-lg transition-colors group ${
                    isActive
                      ? 'bg-red-50 text-primary-700 border-l-4 border-primary-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-primary-700 border-l-4 border-transparent'
                  }`
                }
              >
                <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-primary-700 flex items-center justify-center text-white font-bold shadow-sm">
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{currentUser?.name || 'User'}</p>
            <p className="text-xs text-gray-500 capitalize">{currentUser?.role || 'Guest'}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider text-center">
            KLE Technological University<br/>Hubballi
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
