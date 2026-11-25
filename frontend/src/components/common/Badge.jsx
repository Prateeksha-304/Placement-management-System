import React from 'react';

const statusColors = {
  'Applied': 'bg-blue-100 text-blue-800',
  'Interview': 'bg-purple-100 text-purple-800',
  'Selected': 'bg-green-100 text-green-800',
  'Rejected': 'bg-red-100 text-red-800',
  'Withdrawn': 'bg-gray-100 text-gray-800',
  'Pending': 'bg-yellow-100 text-yellow-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  'Completed': 'bg-green-100 text-green-800',
  'Pass': 'bg-green-100 text-green-800',
  'Fail': 'bg-red-100 text-red-800',
  'Upcoming': 'bg-blue-100 text-blue-800',
  'Ongoing': 'bg-yellow-100 text-yellow-800',
  'Active': 'bg-green-100 text-green-800',
  'Inactive': 'bg-red-100 text-red-800',
  'Placed': 'bg-green-100 text-green-800',
  'Unplaced': 'bg-orange-100 text-orange-800',
  'Opted Out': 'bg-gray-100 text-gray-800',
  'Scheduled': 'bg-blue-100 text-blue-800',
  'Cancelled': 'bg-red-100 text-red-800',
  'Eligible': 'bg-green-100 text-green-800',
  'MOU Active': 'bg-green-100 text-green-800',
  'None': 'bg-gray-100 text-gray-800',
};

// Type/variant semantic colors (for <Badge type="success"> or <Badge variant="success"> patterns)
const typeColors = {
  'success': 'bg-green-100 text-green-800',
  'danger': 'bg-red-100 text-red-800',
  'warning': 'bg-yellow-100 text-yellow-800',
  'info': 'bg-blue-100 text-blue-800',
  'primary': 'bg-indigo-100 text-indigo-800',
  'outline': 'bg-gray-100 text-gray-700 border border-gray-300',
  'default': 'bg-gray-100 text-gray-800',
};

const Badge = ({ status, type, variant, size = 'md', children }) => {
  // Determine display text: prefer children, then status
  const displayText = children || status || '';

  // Determine color: check type/variant first, then status, then try matching children text
  let colorClass;
  const semantic = type || variant;
  if (semantic && typeColors[semantic]) {
    colorClass = typeColors[semantic];
  } else if (status && statusColors[status]) {
    colorClass = statusColors[status];
  } else if (typeof displayText === 'string' && statusColors[displayText]) {
    colorClass = statusColors[displayText];
  } else {
    colorClass = 'bg-gray-100 text-gray-800';
  }

  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span className={`inline-flex items-center justify-center font-medium rounded-full ${colorClass} ${sizeClass}`}>
      {displayText}
    </span>
  );
};

export default Badge;
