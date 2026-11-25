import React, { useEffect, useMemo, useState } from 'react';
import { Search, Filter, Eye, CheckCircle, XCircle, FileText, Download, Building2, User, X, Briefcase, Calendar } from 'lucide-react';
import { useData } from '../../hooks/useData';
import { BRANCHES } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';
import Badge from '../../components/common/Badge';

const statuses = ['Applied', 'Selected', 'Rejected'];
const PAGE_SIZE = 20;

export default function ApplicationReview() {
  const { applications = [], students = [], jobs = [], companies = [], updateApplication } = useData();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [driveFilter, setDriveFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [activeModalApp, setActiveModalApp] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setPage(0);
  }, [query, statusFilter, companyFilter, driveFilter, branchFilter]);

  // Merge live applications with student, job, and company metadata
  const rows = useMemo(() => {
    return applications.map(app => {
      const student = students.find(s => s.id === app.studentId || s.usn === app.usn) || {};
      const job = jobs.find(j => j.id === app.jobId || j.id === app.driveId) || {};
      const company = companies.find(c => c.id === (job.companyId || app.companyId)) || {};

      // Prefer joined backend fields if present, else fall back to mapped records
      const fullStudent = {
        name: app.studentName || student.name || app.usn,
        usn: app.usn || student.usn,
        rollNo: app.rollNo || student.rollNo || '—',
        branch: app.branch || student.branch || '—',
        semester: app.semester ?? student.semester ?? '—',
        cgpa: app.cgpa ?? student.cgpa ?? '—',
        backlogs: app.activeBacklogs ?? student.backlogs ?? 0,
        email: app.email || student.email || '—',
        phone: app.phone || student.phone || '—',
        dob: app.dob || student.dob || null,
        sslcPercentage: app.sslcPercentage ?? student.sslcPercentage ?? null,
        pucPercentage: app.pucPercentage ?? student.pucPercentage ?? null,
        resume: app.resume || student.resume || null
      };

      const fullDrive = {
        id: app.driveId || job.id,
        name: app.driveName || job.name || job.title || 'Placement Opportunity',
        companyName: app.companyName || company.name || job.companyName || job.company || 'Company',
        role: app.role || job.role || job.title || '—',
        packageLpa: app.salLpa ?? (Number(job.package || 0) / 100000).toFixed(1),
        isInternship: app.isInternship ?? Boolean(job.isInternship)
      };

      return {
        ...app,
        resume: app.resume || app.applicationResume || student.resume || null,
        applicationResume: app.resume || app.applicationResume || null,
        student: fullStudent,
        drive: fullDrive
      };
    }).filter(row => {
      const searchText = [
        row.student.name,
        row.student.usn,
        row.student.rollNo,
        row.drive.companyName,
        row.drive.name,
        row.drive.role,
        row.app_id || row.id
      ].filter(Boolean).join(' ').toLowerCase();

      const matchesQuery = searchText.includes(query.trim().toLowerCase());
      const matchesStatus = statusFilter === 'All' || row.status === statusFilter;
      const matchesCompany = companyFilter === 'All' || row.drive.companyName === companyFilter;
      const matchesDrive = driveFilter === 'All' || row.drive.id === driveFilter || row.drive.name === driveFilter;
      const matchesBranch = branchFilter === 'All' || row.student.branch === branchFilter;

      return matchesQuery && matchesStatus && matchesCompany && matchesDrive && matchesBranch;
    }).sort((a, b) => new Date(b.appliedDate || 0) - new Date(a.appliedDate || 0));
  }, [applications, students, jobs, companies, query, statusFilter, companyFilter, driveFilter, branchFilter]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visibleRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Distinct company and drive lists for dropdown filters
  const distinctCompanies = useMemo(() => {
    return [...new Set(companies.map(c => c.name).filter(Boolean))].sort();
  }, [companies]);

  const distinctDrives = useMemo(() => {
    return jobs.map(j => ({ id: j.id, label: `${j.companyName || j.company || 'Company'} - ${j.title || j.role}` }));
  }, [jobs]);

  const handleStatusChange = async (appId, newStatus) => {
    try {
      setIsUpdating(true);
      await updateApplication(appId, { status: newStatus });
      setFeedbackMessage(`Application ${appId} successfully marked as ${newStatus}.`);

      // If modal is open for this application, update its state
      if (activeModalApp && (activeModalApp.id === appId || activeModalApp.app_id === appId)) {
        setActiveModalApp(prev => ({ ...prev, status: newStatus }));
      }

      window.setTimeout(() => setFeedbackMessage(''), 4500);
    } catch (err) {
      setFeedbackMessage(err.message || 'Failed to update application status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadgeType = status => {
    switch (status) {
      case 'Selected': return 'success';
      case 'Rejected': return 'danger';
      case 'Applied': return 'primary';
      default: return 'default';
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Placement Applications</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review student applications, inspect complete profiles including DOB, and manage hiring outcomes.
          </p>
        </div>
      </header>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div role="status" className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-900 shadow-sm">
          {feedbackMessage}
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => setStatusFilter('All')}
          className={`rounded-xl border p-4 text-left transition-all ${
            statusFilter === 'All' ? 'border-primary-700 bg-primary-50 ring-1 ring-primary-700' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Applications</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{applications.length}</p>
        </button>

        {statuses.map(item => {
          const count = applications.filter(a => a.status === item).length;
          const isActive = statusFilter === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setStatusFilter(statusFilter === item ? 'All' : item)}
              className={`rounded-xl border p-4 text-left transition-all ${
                isActive
                  ? item === 'Selected'
                    ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600'
                    : item === 'Rejected'
                    ? 'application-stat-rejected border-red-600 bg-red-50 ring-1 ring-red-600'
                    : 'border-primary-700 bg-primary-50 ring-1 ring-primary-700'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{item}</p>
              <p className={`mt-1 text-2xl font-bold ${
                item === 'Selected' ? 'text-emerald-700' : item === 'Rejected' ? 'text-red-700' : 'text-primary-700'
              }`}>
                {count}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-gray-100 p-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Text Search */}
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="input-field pl-9"
              placeholder="Search student, USN, roll no, or company"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input-field"
            aria-label="Filter by Status"
          >
            <option value="All">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Company Filter */}
          <select
            value={companyFilter}
            onChange={e => setCompanyFilter(e.target.value)}
            className="input-field"
            aria-label="Filter by Company"
          >
            <option value="All">All Companies</option>
            {distinctCompanies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Branch Filter */}
          <select
            value={branchFilter}
            onChange={e => setBranchFilter(e.target.value)}
            className="input-field"
            aria-label="Filter by Branch"
          >
            <option value="All">All Branches</option>
            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Applications Data Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Student Details</th>
                <th className="px-4 py-3">Placement Drive</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Resume</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleRows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50/70 transition-colors">
                  {/* Student Column */}
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 rounded-full bg-primary-100 p-1.5 text-primary-800">
                        <User size={15} />
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900">{row.student.name}</p>
                        <p className="text-xs text-gray-600 font-mono">{row.student.usn} · Roll: {row.student.rollNo}</p>
                        <p className="text-xs text-gray-500">
                          {row.student.branch} · Sem {row.student.semester} · CGPA {row.student.cgpa} · Backlogs {row.student.backlogs}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Placement Drive Column */}
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 rounded-md bg-gray-100 p-1.5 text-gray-700">
                        <Building2 size={15} />
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900">{row.drive.companyName}</p>
                        <p className="text-xs text-gray-600">{row.drive.role}</p>
                        <p className="text-xs font-semibold text-emerald-700">
                          ₹{row.drive.packageLpa} LPA · {row.drive.isInternship ? 'Internship' : 'Full Time'}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Applied Date Column */}
                  <td className="px-4 py-3 text-xs text-gray-600">
                    <p className="font-medium">{row.appliedDate ? formatDate(row.appliedDate) : '—'}</p>
                    <p className="text-gray-400 font-mono text-[11px]">{row.app_id || row.id}</p>
                  </td>

                  {/* Resume Column */}
                  <td className="px-4 py-3">
                    {row.applicationResume || row.resume || row.student?.resume ? (
                      <a
                        href={(row.applicationResume || row.resume || row.student?.resume).startsWith('http')
                          ? (row.applicationResume || row.resume || row.student?.resume)
                          : `/${row.applicationResume || row.resume || row.student?.resume}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-primary-200 bg-primary-50 px-2 py-1 text-xs font-semibold text-primary-800 hover:bg-primary-100 transition-colors"
                        title={row.applicationResume || row.resume || row.student?.resume}
                      >
                        <FileText size={12} />
                        <span>Open</span>
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>

                  {/* Status Column */}
                  <td className="px-4 py-3">
                    <select
                      value={row.status}
                      disabled={isUpdating}
                      onChange={e => handleStatusChange(row.id, e.target.value)}
                      aria-label={`Change status for ${row.student.name}`}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-600 ${
                        row.status === 'Selected'
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : row.status === 'Rejected'
                          ? 'border-red-300 bg-red-50 text-red-800'
                          : 'border-blue-300 bg-blue-50 text-blue-800'
                      }`}
                    >
                      <option value="Applied">Applied</option>
                      <option value="Selected">Selected</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>

                  {/* Actions Column */}
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setActiveModalApp(row)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:border-primary-600 hover:text-primary-700"
                    >
                      <Eye size={13} />
                      Full Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!rows.length && (
            <p className="p-12 text-center text-sm text-gray-500">
              No applications match your selected filters.
            </p>
          )}
        </div>

        {/* Pagination Bar */}
        {rows.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
            <span>
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, rows.length)} of {rows.length} applications
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page + 1 >= pageCount}
                onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Comprehensive Application Details Modal */}
      {activeModalApp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4"
          onClick={() => setActiveModalApp(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Application Details</h2>
                <p className="text-xs text-gray-500">ID: {activeModalApp.app_id || activeModalApp.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalApp(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 space-y-6">
              {/* Section 1: Application Summary */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Application Info</h3>
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div>
                    <span className="text-xs text-gray-500">Status</span>
                    <p className="font-semibold text-gray-900">{activeModalApp.status}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Eligibility</span>
                    <p className="font-semibold text-emerald-700">{activeModalApp.eligibilityStatus || 'Eligible'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Submitted Date</span>
                    <p className="font-semibold text-gray-900">{activeModalApp.appliedDate ? formatDate(activeModalApp.appliedDate) : '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Status Changed By</span>
                    <p className="font-semibold text-gray-900">{activeModalApp.statusChangedBy || 'Placement Officer'}</p>
                  </div>
                </div>
              </div>

              {/* Section 2: Student Details (Including DOB, SSLC, PUC, Resume) */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-800">
                  <User size={15} /> Student Academic & Personal Details
                </h3>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm sm:grid-cols-3">
                  <div>
                    <span className="text-xs text-gray-500">Full Name</span>
                    <p className="font-semibold text-gray-900">{activeModalApp.student.name}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">USN</span>
                    <p className="font-semibold font-mono text-gray-900">{activeModalApp.student.usn}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Roll Number</span>
                    <p className="font-medium text-gray-800">{activeModalApp.student.rollNo || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Branch</span>
                    <p className="font-medium text-gray-800">{activeModalApp.student.branch}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Semester</span>
                    <p className="font-medium text-gray-800">{activeModalApp.student.semester}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">CGPA</span>
                    <p className="font-bold text-gray-900">{activeModalApp.student.cgpa}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Active Backlogs</span>
                    <p className="font-medium text-gray-800">{activeModalApp.student.backlogs}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Date of Birth (DOB)</span>
                    <p className="font-medium text-gray-900">{activeModalApp.student.dob ? formatDate(activeModalApp.student.dob) : '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">SSLC (10th) %</span>
                    <p className="font-medium text-gray-900">{activeModalApp.student.sslcPercentage ? `${activeModalApp.student.sslcPercentage}%` : '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">PUC (12th) %</span>
                    <p className="font-medium text-gray-900">{activeModalApp.student.pucPercentage ? `${activeModalApp.student.pucPercentage}%` : '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Email</span>
                    <p className="font-medium text-gray-800 truncate" title={activeModalApp.student.email}>{activeModalApp.student.email}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Phone</span>
                    <p className="font-medium text-gray-800">{activeModalApp.student.phone}</p>
                  </div>
                </div>

                {/* Application Specific Resume Link */}
                <div className="mt-4 border-t border-gray-100 pt-3">
                  <span className="text-xs font-semibold text-gray-700">Submitted Resume for this Drive Application</span>
                  {activeModalApp.applicationResume || activeModalApp.resume ? (
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <a
                        href={(activeModalApp.applicationResume || activeModalApp.resume).startsWith('http')
                          ? (activeModalApp.applicationResume || activeModalApp.resume)
                          : `/${activeModalApp.applicationResume || activeModalApp.resume}`}
                        target="_blank"
                        rel="noreferrer"
                        className="red-action inline-flex items-center gap-1.5 rounded-lg border border-primary-700 bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
                      >
                        <FileText size={15} /> Open Application Resume
                      </a>
                      <span className="text-xs text-gray-500 font-mono break-all">
                        {activeModalApp.applicationResume || activeModalApp.resume}
                      </span>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-gray-400">No application resume link submitted.</p>
                  )}
                </div>

                {/* Profile Resume (if distinct) */}
                {activeModalApp.student.resume && activeModalApp.student.resume !== (activeModalApp.applicationResume || activeModalApp.resume) && (
                  <div className="mt-3 border-t border-gray-100 pt-2">
                    <span className="text-xs text-gray-500">Student Profile Default Resume</span>
                    <div className="mt-1 flex items-center gap-2">
                      <a
                        href={activeModalApp.student.resume.startsWith('http') ? activeModalApp.student.resume : `/${activeModalApp.student.resume}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
                      >
                        <FileText size={13} /> {activeModalApp.student.resume}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Placement Drive Details */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-800">
                  <Building2 size={15} /> Placement Drive Details
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <span className="text-xs text-gray-500">Drive ID</span>
                    <p className="font-mono font-medium text-gray-800">{activeModalApp.drive.id}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Drive Name</span>
                    <p className="font-semibold text-gray-900">{activeModalApp.drive.name}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Company</span>
                    <p className="font-semibold text-gray-900">{activeModalApp.drive.companyName}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Role Offered</span>
                    <p className="font-medium text-gray-800">{activeModalApp.drive.role}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Package</span>
                    <p className="font-bold text-emerald-700">₹{activeModalApp.drive.packageLpa} LPA</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Opportunity Type</span>
                    <p className="font-medium text-gray-800">{activeModalApp.drive.isInternship ? 'Internship' : 'Full Time'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
              <span className="text-xs text-gray-500">
                Updating will automatically synchronize student placement status and placement history.
              </span>
              <div className="flex gap-2">
                {activeModalApp.status !== 'Selected' && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleStatusChange(activeModalApp.id, 'Selected')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle size={15} /> Mark as Selected
                  </button>
                )}
                {activeModalApp.status !== 'Rejected' && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => handleStatusChange(activeModalApp.id, 'Rejected')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle size={15} /> Mark as Rejected
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveModalApp(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
