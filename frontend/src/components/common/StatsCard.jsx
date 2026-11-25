import React from 'react';
import { BarChart2, Users, CheckCircle, PieChart, DollarSign } from 'lucide-react';

const ICONS = { users: Users, 'check-circle': CheckCircle, 'pie-chart': PieChart, 'dollar-sign': DollarSign, BarChart2 };

const colorStyles = {
  red: 'bg-red-50 text-red-700',
  crimson: 'bg-red-50 text-red-800',
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  purple: 'bg-purple-50 text-purple-600',
  orange: 'bg-orange-50 text-orange-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  pink: 'bg-pink-50 text-pink-600',
};

const StatsCard = ({ title, value, change, changeType, icon, color = 'crimson', bgColor }) => {
  // Handle different types of icon props (string name, React component, or JSX element)
  let IconComponent = BarChart2;
  let isJSX = false;

  if (typeof icon === 'string' && ICONS[icon]) {
    IconComponent = ICONS[icon];
  } else if (typeof icon === 'function' || typeof icon === 'object') {
    if (React.isValidElement(icon)) {
      isJSX = true;
    } else {
      IconComponent = icon;
    }
  }

  const colorClass = colorStyles[color] || colorStyles.crimson;
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 truncate pr-4">{title}</h3>
        <div className={`p-2.5 rounded-lg ${bgColor || colorClass} shrink-0`}>
          {isJSX ? (
            icon
          ) : (
            <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />
          )}
        </div>
      </div>
      
      <div className="flex items-baseline flex-wrap gap-2">
        <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
        {change && (
          <span
            className={`text-xs sm:text-sm font-medium px-2 py-0.5 rounded-full ${
              changeType === 'increase'
                ? 'text-emerald-700 bg-emerald-50'
                : changeType === 'decrease'
                ? 'text-red-700 bg-red-50'
                : 'text-gray-700 bg-gray-50'
            }`}
          >
            {changeType === 'increase' ? '↑' : changeType === 'decrease' ? '↓' : ''} {change}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
