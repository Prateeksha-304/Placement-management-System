import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Briefcase, MapPin, CalendarDays, X, CheckCircle2, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { useData } from '../../hooks/useData';
import { useAuth } from '../../hooks/useAuth';
import { checkEligibility, formatDate, isDeadlinePassed } from '../../utils/helpers';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';

export default function EligibleJobs({ embedded = false }) {
  const { currentUser } = useAuth();
  const { companies = [], jobs = [], students = [], applications = [], addApplication } = useData();
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [branch, setBranch] = useState('');
  const [minimumPackage, setMinimumPackage] = useState('');
  const [maximumCgpa, setMaximumCgpa] = useState('');
  const [expandedCompanyId, setExpandedCompanyId] = useState(null);
  const [registrationJob, setRegistrationJob] = useState(null);
  const [registration, setRegistration] = useState({ phone: '', usn: '' });
  const [message, setMessage] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  const student = students.find(
    record => record.id === currentUser?.id || record.usn === currentUser?.usn || record.email === currentUser?.email
  ) || {};

  const myApplications = applications.filter(
    application => application.studentId === currentUser?.id || application.usn === currentUser?.usn
  );

  const selectedApplications = myApplications.filter(application => application.status === 'Selected');
  const selectedPackages = selectedApplications
    .map(application => Number(jobs.find(job => job.id === application.jobId || job.id === application.driveId)?.package || 0))
    .filter(Boolean);
  const isPlacedStudent = student.placementStatus === 'Placed' || student.status === 'Placed' || selectedApplications.length > 0;
  const minimumPackageAfterSelection = isPlacedStudent && selectedPackages.length ? Math.max(...selectedPackages) * 1.40 : 0;

  // 1. Filter drives where logged-in student satisfies core criteria + SSLC & PUC percentages
  // Once registration deadline is crossed, the placement drive should not be displayed
  const academicMatches = useMemo(() => {
    return jobs.filter(job => {
      if (job.deadline && isDeadlinePassed(job.deadline)) return false;
      if (job.status === 'Closed') return false;
      return checkEligibility(student, job);
    });
  }, [jobs, student]);

  const branches = [...new Set(academicMatches.flatMap(job => job.branches || job.eligibleBranches || []))].sort();

  // 2. Apply search and package/CGPA filters
  const filteredDrives = useMemo(() => {
    return academicMatches.filter(job => {
      const companyName = job.companyName || job.company || '';
      const matchesSearch = `${companyName} ${job.title || ''} ${job.description || ''}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const jobBranches = job.branches || job.eligibleBranches || [];
      const matchesBranch = !branch || jobBranches.includes(branch);
      const matchesPackage = !minimumPackage || Number(job.package || 0) >= Number(minimumPackage) * 100000;
      const requiredCgpa = Number(job.minCGPA ?? job.minCgpa ?? 0);
      const matchesCgpa = !maximumCgpa || requiredCgpa <= Number(maximumCgpa === 'mine' ? student.cgpa : maximumCgpa);
      return matchesSearch && matchesBranch && matchesPackage && matchesCgpa;
    });
  }, [academicMatches, search, branch, minimumPackage, maximumCgpa, student.cgpa]);

  // 3. Group strictly by companies having at least one eligible drive
  const eligibleDrivesByCompany = useMemo(() => {
    const map = {};
    for (const job of filteredDrives) {
      const cId = job.companyId || job.company_id || job.company;
      if (!map[cId]) map[cId] = [];
      map[cId].push(job);
    }
    return map;
  }, [filteredDrives]);

  const eligibleCompanies = useMemo(() => {
    return companies
      .map(company => ({
        ...company,
        eligibleDrives: eligibleDrivesByCompany[company.id] || []
      }))
      .filter(company => company.eligibleDrives.length > 0);
  }, [companies, eligibleDrivesByCompany]);

  const toggleCompany = companyId => {
    setExpandedCompanyId(prev => (prev === companyId ? null : companyId));
  };

  const getApplyBlock = job => {
    if (!checkEligibility(student, job)) {
      return 'You do not meet this opportunity’s branch, CGPA, backlog, or percentage criteria.';
    }
    const existing = myApplications.find(application => application.jobId === job.id || application.driveId === job.id);
    if (existing) return 'You have already applied to this opportunity.';
    if (job.status === 'Closed' || isDeadlinePassed(job.deadline)) {
      return 'Applications for this company are closed.';
    }
    if (minimumPackageAfterSelection && Number(job.package || 0) < minimumPackageAfterSelection) {
      return `As an already-placed student, any new opportunity must offer at least a 40% package increase (₹${(
        minimumPackageAfterSelection / 100000
      ).toFixed(2)} LPA).`;
    }
    return '';
  };

  const apply = job => {
    const blocked = getApplyBlock(job);
    if (blocked) {
      setMessage(blocked);
      return;
    }
    setMessage('');
    setRegistration({ phone: student.phone || '', usn: student.usn || '', resume: student.resume || '' });
    setRegistrationJob(job);
  };

  useEffect(() => {
    const requestedJobId = searchParams.get('apply');
    if (!requestedJobId) return;
    const requestedJob = jobs.find(job => job.id === requestedJobId);
    if (requestedJob) apply(requestedJob);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('apply');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, jobs, student, currentUser?.id]);

  const submitApplication = async event => {
    event.preventDefault();
    const blocked = registrationJob ? getApplyBlock(registrationJob) : 'Choose a placement opportunity before submitting.';
    if (blocked) {
      setMessage(blocked);
      setRegistrationJob(null);
      return;
    }
    const added = await addApplication({
      jobId: registrationJob.id,
      driveId: registrationJob.id,
      studentId: currentUser.id,
      resume: registration.resume || student.resume || '',
      status: 'Applied',
      appliedDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      currentRound: 'Application submitted',
      registrationDetails: registration
    });
    if (!added) {
      setMessage('You have already applied to this company.');
      setRegistrationJob(null);
      return;
    }
    setRegistrationJob(null);
    setMessage(`Application submitted to ${registrationJob.companyName || registrationJob.company}.`);
  };

  const resetFilters = () => {
    setBranch('');
    setMinimumPackage('');
    setMaximumCgpa('');
  };
  const activeFilterCount = [branch, minimumPackage, maximumCgpa].filter(Boolean).length;

  return (
    <section className={embedded ? 'space-y-5' : 'mx-auto max-w-7xl space-y-6 p-4 sm:p-6'}>
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Eligible Companies</h1>
        <p className="mt-1 text-sm text-gray-500">
          Showing companies with placement drives that match your branch, CGPA, backlogs, SSLC, and PUC percentages.
          Click any company to view your eligible drives.
        </p>
      </header>

      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search eligible companies or roles"
            className="input-field pl-9"
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen(open => !open)}
          aria-expanded={filtersOpen}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <SlidersHorizontal size={16} />
          Filters
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {filtersOpen && (
        <div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-4">
          <label className="text-xs font-medium text-gray-600">
            Branch
            <select value={branch} onChange={event => setBranch(event.target.value)} className="input-field mt-1">
              <option value="">All eligible branches</option>
              {branches.map(item => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-gray-600">
            Minimum package (LPA)
            <input
              type="number"
              min="0"
              step="0.1"
              value={minimumPackage}
              onChange={event => setMinimumPackage(event.target.value)}
              placeholder="Any package"
              className="input-field mt-1"
            />
          </label>
          <label className="text-xs font-medium text-gray-600">
            Maximum CGPA requirement
            <select
              value={maximumCgpa}
              onChange={event => setMaximumCgpa(event.target.value)}
              className="input-field mt-1"
            >
              <option value="">Any eligible requirement</option>
              <option value="mine">Up to my CGPA ({student.cgpa || '—'})</option>
              {[6, 7, 8, 9].map(value => (
                <option key={value} value={value}>
                  Up to {value}.0
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear filters
            </button>
          </div>
        </div>
      )}

      {message && (
        <p role="status" className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
          {message}
        </p>
      )}

      {eligibleCompanies.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-10">
          <EmptyState
            icon={<Briefcase />}
            message={
              academicMatches.length
                ? 'No eligible companies match your current search or filters.'
                : 'No companies currently have drives matching your academic eligibility criteria.'
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {eligibleCompanies.map(company => {
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
                    <span className="rounded-lg bg-red-50 p-2 text-red-800">
                      <Building2 size={20} />
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{company.name}</h2>
                      <p className="text-xs text-gray-500">{company.industry || company.type || 'Company'}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                    {company.eligibleDrives.length} Eligible Drive{company.eligibleDrives.length === 1 ? '' : 's'}
                  </span>
                </div>

                {company.contactEmail && (
                  <p className="mt-2 text-xs text-gray-500">{company.contactEmail}</p>
                )}

                <p className="mt-2 text-xs text-gray-600 line-clamp-1">
                  <span className="font-medium text-gray-700">Eligible for: </span>
                  {company.eligibleDrives.map(d => d.title || d.role).join(', ')}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-semibold text-red-800">
                  <span>{isExpanded ? 'Hide eligible drives' : 'Show eligible drives'}</span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                {/* Show ONLY eligible drives on company click */}
                {isExpanded && (
                  <div className="mt-4 space-y-3 border-t border-gray-100 pt-3" onClick={e => e.stopPropagation()}>
                    {company.eligibleDrives.map(job => {
                      const existing = myApplications.find(
                        application => application.jobId === job.id || application.driveId === job.id
                      );
                      return (
                        <div key={job.id} className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 text-left">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">{job.title || job.role}</h3>
                              <p className="mt-0.5 text-sm font-bold text-emerald-700">
                                ₹{(Number(job.package || 0) / 100000).toFixed(1)} LPA
                              </p>
                            </div>
                            <Badge status={job.type || 'Full Time'} size="sm" />
                          </div>

                          <dl className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs text-gray-600">
                            <div>
                              <dt className="text-gray-500">Min CGPA</dt>
                              <dd className="font-semibold text-gray-900">{job.minCGPA ?? 0}</dd>
                            </div>
                            <div>
                              <dt className="text-gray-500">Max Backlogs</dt>
                              <dd className="font-semibold text-gray-900">{job.maxBacklogs ?? 0}</dd>
                            </div>
                            <div>
                              <dt className="text-gray-500">Branches</dt>
                              <dd className="line-clamp-1 font-medium text-gray-800">
                                {(job.branches || job.eligibleBranches || []).join(', ') || 'All'}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-gray-500">Visit Date</dt>
                              <dd className="font-medium text-gray-800">
                                {job.arrivalDate ? formatDate(job.arrivalDate) : 'To be announced'}
                              </dd>
                            </div>
                          </dl>

                          {(job.otherCriteria || job.description) && (
                            <p className="mt-2 text-xs text-gray-600">
                              <span className="font-medium text-gray-700">Criteria: </span>
                              {job.otherCriteria || job.description}
                            </p>
                          )}

                          <div className="mt-3 border-t border-gray-200 pt-2.5">
                            {existing ? (
                              <div className="flex items-center justify-between text-xs font-medium text-gray-700">
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 size={14} className="text-emerald-600" /> Applied
                                </span>
                                <Badge status={existing.status} size="sm" />
                              </div>
                            ) : (
                              <button
                                onClick={() => apply(job)}
                                className="w-full rounded-lg bg-red-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-800"
                              >
                                <Briefcase className="mr-1.5 inline h-3.5 w-3.5" />
                                Apply for this drive
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {registrationJob && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/20 p-4"
          onClick={() => setRegistrationJob(null)}
        >
          <form
            onSubmit={submitApplication}
            onClick={event => event.stopPropagation()}
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Apply to {registrationJob.companyName || registrationJob.company}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{registrationJob.title || registrationJob.role}</p>
              </div>
              <button
                type="button"
                onClick={() => setRegistrationJob(null)}
                aria-label="Close form"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-600">Confirm your details to submit your application for this placement drive.</p>
            <label className="block text-sm font-medium text-gray-700">
              University Seat Number (USN)
              <input
                required
                value={registration.usn}
                onChange={event => setRegistration({ ...registration, usn: event.target.value })}
                className="input-field mt-1"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Mobile number
              <input
                required
                pattern="[0-9+ -]{10,15}"
                value={registration.phone}
                onChange={event => setRegistration({ ...registration, phone: event.target.value })}
                className="input-field mt-1"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Drive Resume Link / Path
              <input
                value={registration.resume || ''}
                onChange={event => setRegistration({ ...registration, resume: event.target.value })}
                placeholder="https://drive.google.com/... or resumes/my_resume.pdf"
                className="input-field mt-1"
              />
              <span className="mt-1 block text-xs text-gray-400">Defaults to your profile resume or enter a tailored link for this drive.</span>
            </label>
            <button className="btn btn-primary w-full">Confirm Application</button>
          </form>
        </div>
      )}
    </section>
  );
}
