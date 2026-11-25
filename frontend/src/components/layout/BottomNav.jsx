import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { NAV_ITEMS } from '../../utils/constants';
import * as Icons from 'lucide-react';

const BottomNav = () => {
  const { currentUser } = useAuth();
  
  if (!currentUser || !currentUser.role || !NAV_ITEMS[currentUser.role]) return null;
  
  const allItems = NAV_ITEMS[currentUser.role];
  const displayItems = allItems.slice(0, 5); // Show at most 5 items on bottom nav

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16 px-2">
        {displayItems.map((item) => {
          const Icon = Icons[item.icon] || Icons.Circle;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full space-y-1 relative group ${
                  isActive ? 'text-primary-700' : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary-700 rounded-b-md" />
                  )}
                  <Icon className={`h-6 w-6 ${isActive ? 'fill-primary-50' : ''}`} />
                  <span className="text-[10px] font-medium truncate w-full text-center px-1">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
