import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { formatDate } from '../../utils/helpers';
import Badge from '../../components/common/Badge';
import { Building2, ChevronDown, ChevronUp, Briefcase } from 'lucide-react';

export default function StudentDashboard() {
  const { currentUser } = useAuth();
  const { companies = [], jobs = [], students = [], applications = [] } = useData();
  const [expandedCompanyId, setExpandedCompanyId] = useState(null);

  const student = students.find(
    item => item.id === currentUser?.id || item.usn === currentUser?.usn || item.email === currentUser?.email
  ) || {};
  const myApplications = applications.filter(
    item => item.studentId === currentUser?.id || item.usn === currentUser?.usn
  );

  const visibleCompanies = companies.map(company => ({
    ...company,
    opportunities: jobs.filter(job => job.companyId === company.id)
  }));

  const toggleCompany = companyId => {
    setExpandedCompanyId(prev => (prev === companyId ? null : companyId));
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-2xl border border-gray-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {student.name || currentUser?.name || 'Student'}
        </h1>
        <p className="mt-1 text-gray-600">
          Participating placement companies. Click any company to view its placement drives.
        </p>
      </header>

      {visibleCompanies.length ? (
        <section aria-label="Participating companies" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleCompanies.map(company => {
            const isExpanded = expandedCompanyId === company.id;
            return (
              <article
                key={company.id}
                onClick={() => toggleCompany(company.id)}
                className={`flex flex-col cursor-pointer rounded-xl border bg-white p-5 shadow-sm transition-all hover:border-red-600 hover:shadow-md ${
                  isExpanded ? 'border-red-600 ring-1 ring-red-600' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-red-50 p-2.5 text-red-800">
                      <Building2 size={20} />
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{company.name}</h2>
                      <p className="text-xs text-gray-500">{company.industry || company.type || 'Company'}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800">
                    {company.opportunities.length} Drive{company.opportunities.length === 1 ? '' : 's'}
                  </span>
                </div>

                {company.contactEmail && (
                  <p className="mt-2 text-xs text-gray-500">{company.contactEmail}</p>
                )}
                {company.rolesOffered && (
                  <p className="mt-2 text-xs text-gray-600 line-clamp-1">
                    <span className="font-medium text-gray-700">Roles: </span>
                    {company.rolesOffered}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-semibold text-red-800">
                  <span>{isExpanded ? 'Hide placement drives' : 'Show placement drives'}</span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                {/* Drives revealed on click */}
                {isExpanded && (
                  <div
                    className="mt-3 space-y-3 border-t border-gray-100 pt-3"
                    onClick={e => e.stopPropagation()}
                  >
                    {company.opportunities.length ? (
                      company.opportunities.map(job => {
                        const application = applications.find(
                          item =>
                            (item.studentId === currentUser?.id || item.usn === currentUser?.usn) &&
                            (item.jobId === job.id || item.driveId === job.id)
                        );
                        return (
                          <div key={job.id} className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 text-left">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {job.title || job.role || 'Placement opportunity'}
                                </h3>
                                <p className="mt-0.5 text-sm font-bold text-emerald-700">
                                  ₹{(Number(job.package || 0) / 100000).toFixed(1)} LPA
                                </p>
                              </div>
                              {application && <Badge status={application.status} size="sm" />}
                            </div>
                            <p className="mt-2 text-xs text-gray-600">
                              Min CGPA: <b>{job.minCGPA ?? 0}</b> · Branches:{' '}
                              <b>{(job.branches || job.eligibleBranches || []).join(', ') || 'All'}</b> · Max backlogs:{' '}
                              <b>{job.maxBacklogs ?? 0}</b>
                            </p>
                            {job.description && (
                              <p className="mt-1 text-xs text-gray-600 line-clamp-2">{job.description}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                              Visit: {job.arrivalDate ? formatDate(job.arrivalDate) : 'To be announced'}
                              {job.deadline ? ` · Deadline: ${formatDate(job.deadline)}` : ''}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-gray-500">No placement drives published yet for this company.</p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-600">
          No companies have been added by the placement officer yet.
        </div>
      )}

      <section className="space-y-3" aria-label="My applications and results">
        <h2 className="text-lg font-bold text-gray-900">My applications and results</h2>
        {myApplications.length ? (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Status / result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {myApplications.map(application => {
                  const job = jobs.find(item => item.id === (application.jobId || application.driveId)) || {};
                  return (
                    <tr key={application.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {job.companyName || job.company || application.companyName || 'Company'}
                      </td>
                      <td className="px-4 py-3">{job.title || application.jobTitle || '—'}</td>
                      <td className="px-4 py-3">
                        {application.appliedDate ? formatDate(application.appliedDate) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge status={application.status} size="sm" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white p-5 text-sm text-gray-600">
            You have not submitted any placement applications.
          </p>
        )}
      </section>
    </div>
  );
}
