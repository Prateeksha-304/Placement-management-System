import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';

const Row = ({ label, value }) => <div className="grid grid-cols-[minmax(8rem,0.7fr)_1fr] gap-3 border-b border-gray-100 py-3 last:border-0"><dt className="text-sm text-gray-500">{label}</dt><dd className="break-words text-sm font-medium text-gray-900">{value || '—'}</dd></div>;

export default function StudentProfile() {
  const { currentUser } = useAuth();
  const { students = [] } = useData();
  const student = students.find(item => item.id === currentUser?.id || item.usn === currentUser?.usn || item.email === currentUser?.email) || {};
  return <div className="mx-auto max-w-3xl space-y-5">
    <header><h1 className="text-2xl font-bold text-gray-900">Profile</h1><p className="mt-1 text-sm text-gray-500">Your student and academic details from the placement records.</p></header>
    <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-7"><div className="mb-5 border-b border-gray-100 pb-4"><h2 className="text-lg font-semibold text-gray-900">{student.name || currentUser?.name || 'Student'}</h2><p className="mt-1 text-sm text-gray-500">{student.usn || '—'}</p></div><dl>
      <Row label="Roll number" value={student.rollNo} /><Row label="Email" value={student.email} /><Row label="Phone" value={student.phone} /><Row label="Branch" value={student.branch} /><Row label="Semester" value={student.semester} /><Row label="CGPA" value={student.cgpa} /><Row label="Active backlogs" value={student.backlogs} /><Row label="SSLC (10th)" value={student.sslcPercentage || student.sslc_percentage ? `${student.sslcPercentage || student.sslc_percentage}%` : '—'} /><Row label="PUC (12th)" value={student.pucPercentage || student.puc_percentage ? `${student.pucPercentage || student.puc_percentage}%` : '—'} /><Row label="Eligibility record" value={student.isEligible ? 'Eligible' : 'Not marked eligible'} /><Row label="Placement status" value={student.placementStatus} /><Row label="Resume" value={student.resume || (student.resumeUploaded ? 'Uploaded' : '—')} />
    </dl></section>
  </div>;
}
