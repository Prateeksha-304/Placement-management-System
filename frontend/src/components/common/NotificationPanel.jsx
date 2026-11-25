import React, { useState } from 'react';
import { X, Bell, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';

const NotificationPanel = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const { data: { notifications = [] } = {}, markNotificationRead, setNotifications } = useData();
  const [filter, setFilter] = useState('All');

  if (!isOpen) return null;

  const myNotifications = notifications.filter(
    (n) => n.userId === currentUser?.id || n.userId === 'all'
  );

  const isRead = notification => notification.userId === 'all' ? (notification.readBy || []).includes(currentUser?.id) : notification.read;
  const filteredNotifications = myNotifications.filter((n) => {
    if (filter === 'All') return true;
    if (filter === 'Unread') return !isRead(n);
    return n.type === filter.toLowerCase();
  });
  const markAllRead = () => setNotifications(notifications.map(n => {
    if (n.userId === 'all') return { ...n, readBy: [...new Set([...(n.readBy || []), currentUser?.id].filter(Boolean))] };
    return n.userId === currentUser?.id ? { ...n, read: true } : n;
  }));

  const getBorderColor = (type) => {
    switch (type) {
      case 'info': return 'border-blue-500';
      case 'success': return 'border-green-500';
      case 'warning': return 'border-yellow-500';
      case 'error': return 'border-red-500';
      default: return 'border-gray-200';
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case 'info': return 'bg-blue-50';
      case 'success': return 'bg-green-50';
      case 'warning': return 'bg-yellow-50';
      case 'error': return 'bg-red-50';
      default: return 'bg-gray-50';
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-80 sm:w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col translate-x-0">
        
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-crimson-600" />
            <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={markAllRead} className="text-xs text-crimson-600 hover:text-crimson-700 font-medium px-2 py-1 rounded">
              Mark all read
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex overflow-x-auto px-4 py-2 border-b border-gray-200 gap-2 shrink-0 no-scrollbar">
          {['All', 'Unread', 'Info', 'Success', 'Warning'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors ${
                filter === tab 
                  ? 'bg-crimson-100 text-crimson-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-10 flex flex-col items-center justify-center">
              <Bell className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No notifications</p>
              <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div 
                key={notif.id} 
                onClick={() => !isRead(notif) && markNotificationRead(notif.id, currentUser?.id)}
                className={`relative p-4 rounded-lg border-l-4 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors bg-white border border-gray-100 ${getBorderColor(notif.type)}`}
              >
                {!isRead(notif) && (
                  <span className="absolute top-4 right-4 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crimson-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-crimson-500"></span>
                  </span>
                )}
                
                <div className="pr-4">
                  <h4 className="font-semibold text-gray-800 text-sm mb-1">{notif.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{notif.message}</p>
                  <div className="flex items-center text-xs text-gray-400">
                    <span>{notif.createdAt ? new Date(notif.createdAt).toLocaleString() : notif.time || ''}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;
