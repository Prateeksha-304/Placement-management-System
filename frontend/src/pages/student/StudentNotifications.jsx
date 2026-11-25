import React, { useMemo, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';

export default function StudentNotifications() {
  const { currentUser } = useAuth();
  const { notifications = [], markNotificationRead, refreshData } = useData();
  const [filter, setFilter] = useState('All');
  const mine = useMemo(() => notifications.filter(item => item.userId === currentUser?.id || item.userId === currentUser?.usn || item.userId === 'all')
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)), [notifications, currentUser?.id, currentUser?.usn]);
  const isRead = item => item.userId === 'all' ? (item.readBy || []).includes(currentUser?.id) : item.read;
  const shown = mine.filter(item => filter === 'All' || !isRead(item));
  const markAllRead = async () => {
    try {
      const { notificationApi } = await import('../../api/notificationApi');
      await notificationApi.markAllRead();
      if (refreshData) refreshData();
    } catch (e) {
      console.warn('Failed to mark all as read:', e);
    }
  };

  return <div className="mx-auto max-w-4xl space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-bold text-gray-900">Notifications</h1><p className="mt-1 text-sm text-gray-500">Placement deadlines and updates for you.</p></div><button type="button" onClick={markAllRead} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:border-red-700"><Check size={16} />Mark all read</button></header>
    <div className="flex gap-2"><button type="button" onClick={() => setFilter('All')} aria-pressed={filter === 'All'} className={`rounded-full px-4 py-2 text-sm font-medium ${filter === 'All' ? 'bg-red-800 text-white' : 'bg-white text-gray-700'}`}>All ({mine.length})</button><button type="button" onClick={() => setFilter('Unread')} aria-pressed={filter === 'Unread'} className={`rounded-full px-4 py-2 text-sm font-medium ${filter === 'Unread' ? 'bg-red-800 text-white' : 'bg-white text-gray-700'}`}>Unread ({mine.filter(item => !isRead(item)).length})</button></div>
    <section className="space-y-3" aria-label="Placement notifications">{shown.length ? shown.map(item => <article key={item.id} onClick={() => !isRead(item) && markNotificationRead(item.id, currentUser?.id)} className={`cursor-pointer rounded-xl border bg-white p-4 ${isRead(item) ? 'border-gray-200' : 'border-red-300'}`}><div className="flex items-start gap-3"><span className="rounded-lg bg-red-50 p-2 text-red-700"><Bell size={18} /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h2 className="font-semibold text-gray-900">{item.title}</h2>{!isRead(item) && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-red-700" aria-label="Unread" />}</div><p className="mt-1 text-sm text-gray-600">{item.message}</p><time className="mt-2 block text-xs text-gray-500">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</time></div></div></article>) : <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-600">No {filter === 'Unread' ? 'unread ' : ''}placement notifications.</div>}</section>
  </div>;
}
