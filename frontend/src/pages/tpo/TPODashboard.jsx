import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { Building2, ClipboardCheck, ListFilter, Megaphone, Target } from 'lucide-react';

const tasks = [
  { label: 'Maintain companies', detail: 'Add or update participating companies.', path: '/officer/companies', icon: Building2 },
  { label: 'Manage placement drives', detail: 'Publish opportunities and registration details.', path: '/officer/drives', icon: Target },
  { label: 'Set eligibility criteria', detail: 'Define company criteria and review automatically eligible students.', path: '/officer/eligibility', icon: ListFilter },
  { label: 'Review applications and publish results', detail: 'Review submitted applications and update outcomes.', path: '/officer/results', icon: ClipboardCheck },
  { label: 'Publish placement notices', detail: 'Share deadlines and placement updates.', path: '/officer/notices', icon: Megaphone }
];

export default function TPODashboard() {
  const { currentUser } = useAuth();
  return <div className="mx-auto max-w-6xl space-y-6">
    <header className="rounded-2xl border border-gray-200 bg-white p-6">
      <h1 className="text-2xl font-bold text-gray-900">Welcome, {currentUser?.name || 'Placement Officer'}</h1>
      <p className="mt-1 text-gray-500">Manage placement operations, student registrations, results and notices.</p>
      <Link to="/officer/results" className="mt-4 inline-flex rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800">Review applications</Link>
    </header>
    <section aria-label="Placement officer tasks" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {tasks.map(({ label, detail, path, icon: Icon }) => <Link key={path} to={path} className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-red-700 hover:shadow-sm">
        <span className="inline-flex rounded-lg bg-red-50 p-2 text-red-700"><Icon size={20} /></span>
        <h2 className="mt-4 font-semibold text-gray-900">{label}</h2>
        <p className="mt-1 text-sm text-gray-500">{detail}</p>
      </Link>)}
    </section>
  </div>;
}
