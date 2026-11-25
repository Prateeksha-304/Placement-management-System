import React from 'react';
import { FolderOpen } from 'lucide-react';

const EmptyState = ({ icon = 'FolderOpen', title = 'No Data Available', description, message, actionLabel, onAction }) => {
  // Support both 'description' and 'message' props
  const displayText = description || message || 'There is currently nothing to show here.';

  // Render icon — support string name, component reference, or JSX element
  const renderIcon = () => {
    if (typeof icon === 'string') {
      const IconComp = FolderOpen;
      return <IconComp size={40} />;
    }
    if (typeof icon === 'function') {
      const IconComp = icon;
      return <IconComp size={40} />;
    }
    return icon;
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 my-4">
      <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-6">
        {renderIcon()}
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-md mb-6">{displayText}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
