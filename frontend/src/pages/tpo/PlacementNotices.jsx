import React, { useEffect, useMemo, useState } from 'react';
import { BellRing, Send } from 'lucide-react';
import { useData } from '../../hooks/useData';
import { checkEligibility, formatDate, generateId } from '../../utils/helpers';

const noticeTypes = [
  { id: 'registration_open', label: 'Company and registration announcement', audience: 'eligible', tone: 'info' },
  { id: 'deadline_reminder', label: 'Registration deadline reminder', audience: 'eligible', tone: 'warning' },
  { id: 'registration_check', label: 'Registration list / details update', audience: 'applied', tone: 'info' },
  { id: 'schedule', label: 'Placement schedule and visit details', audience: 'applied', tone: 'info' },
  { id: 'assessment', label: 'Test / assessment details', audience: 'applied', tone: 'warning' },
  { id: 'round_update', label: 'Recruitment round / interview update', audience: 'applied', tone: 'info' },
  { id: 'selection_result', label: 'Selection results announcement', audience: 'applied', tone: 'success' },
  { id: 'general', label: 'General placement notice', audience: 'all', tone: 'info' }
];

const audienceOptions = [
  { id: 'applied', label: 'Students who applied for this opportunity' },
  { id: 'eligible', label: 'Students eligible for this opportunity' },
  { id: 'selected', label: 'Selected students for this opportunity' },
  { id: 'all', label: 'All students' }
];

function makeTemplate(type, audience, company, job) {
  const companyName = company?.name || '[Company name]';
  const role = job?.title || '[Role / opportunity]';
  const deadline = job?.deadline ? formatDate(job.deadline) : '[registration deadline]';
  const visit = job?.arrivalDate ? formatDate(job.arrivalDate) : '[company visit date]';
  const packageLpa = job?.package ? `${(Number(job.package) / 100000).toFixed(1)} LPA` : '[package]';
  const greetings = audience === 'all' ? 'Dear students,' : 'Dear students,';
  switch (type) {
    case 'registration_open':
      return { title: `Registration open: ${companyName}`, message: `${greetings}\n\n${companyName} has opened registration for ${role}. Package: ${packageLpa}. Company visit: ${visit}. Apply by ${deadline}. Please sign in to the Placement Portal and submit your application if you meet the eligibility criteria.` };
    case 'deadline_reminder':
      return { title: `Reminder: ${companyName} registration deadline`, message: `${greetings}\n\nRegistration for ${companyName} — ${role} closes on ${deadline}. Please complete your application before the deadline.` };
    case 'registration_check':
      return { title: `${companyName}: registration details update`, message: `${greetings}\n\nThe placement office has an update about registrations for ${companyName} — ${role}. Please review your application and student details in the Placement Portal.` };
    case 'schedule':
      return { title: `${companyName}: placement schedule`, message: `${greetings}\n\nPlacement schedule update for ${companyName} — ${role}. Company visit: ${visit}.\n\n[Add timing, venue, and instructions here.]` };
    case 'assessment':
      return { title: `${companyName}: test / assessment details`, message: `${greetings}\n\nAssessment update for ${companyName} — ${role}.\n\n[Add test date, time, mode, venue, and instructions here.]` };
    case 'round_update':
      return { title: `${companyName}: recruitment round update`, message: `${greetings}\n\nThere is a recruitment-process update for ${companyName} — ${role}.\n\n[Add the next-round details and instructions here.]` };
    case 'selection_result':
      return { title: `${companyName}: selection results published`, message: `${greetings}\n\nThe placement office has published the selection results for ${companyName} — ${role}. Sign in to the Placement Portal to view your current application result.` };
    default:
      return { title: 'Placement notice', message: `${greetings}\n\n[Write the placement update here.]` };
  }
}

export default function PlacementNotices() {
  const { notifications = [], companies = [], jobs = [], students = [], applications = [], addNotifications } = useData();
  const [noticeType, setNoticeType] = useState('registration_open');
  const [audience, setAudience] = useState('eligible');
  const [companyId, setCompanyId] = useState('');
  const [jobId, setJobId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');

  const companyJobs = useMemo(() => jobs.filter(job => !companyId || job.companyId === companyId), [jobs, companyId]);
  const selectedJob = jobs.find(job => job.id === jobId);
  const selectedCompany = companies.find(company => company.id === (selectedJob?.companyId || companyId));

  useEffect(() => {
    if (jobId && !companyJobs.some(job => job.id === jobId)) setJobId('');
  }, [companyJobs, jobId]);

  useEffect(() => {
    const template = makeTemplate(noticeType, audience, selectedCompany, selectedJob);
    setTitle(template.title);
    setMessage(template.message);
    setError('');
  }, [noticeType, audience, companyId, jobId]);

  const recipientIds = useMemo(() => {
    if (audience === 'all') return [];
    if (!selectedJob) return [];
    if (audience === 'eligible') return students.filter(student => checkEligibility(student, selectedJob)).map(student => student.id);
    const matchingApplications = applications.filter(application => application.jobId === selectedJob.id);
    if (audience === 'selected') return [...new Set(matchingApplications.filter(application => application.status === 'Selected').map(application => application.studentId))];
    return [...new Set(matchingApplications.map(application => application.studentId))];
  }, [audience, selectedJob, students, applications]);

  const recipientCount = audience === 'all' ? students.length : recipientIds.length;
  const recentNotices = useMemo(() => {
    const batches = new Map();
    notifications.filter(item => item.noticeType).forEach(item => {
      const key = item.noticeBatchId || item.id;
      const existing = batches.get(key);
      if (existing) existing.recipientCount += item.userId === 'all' ? students.length : 1;
      else batches.set(key, { ...item, recipientCount: item.userId === 'all' ? students.length : 1 });
    });
    return [...batches.values()].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 20);
  }, [notifications, students.length]);

  const publish = event => {
    event.preventDefault();
    setError('');
    if (audience !== 'all' && !selectedJob) {
      setError('Choose the company opportunity for this recipient group.');
      return;
    }
    if (audience !== 'all' && recipientIds.length === 0) {
      setError('There are no students in this recipient group for the selected opportunity.');
      return;
    }
    const batchId = `NOTICE${generateId()}`;
    const createdAt = new Date().toISOString();
    const typeConfig = noticeTypes.find(type => type.id === noticeType);
    const targets = audience === 'all' ? ['all'] : recipientIds;
    const noticeRows = targets.map(userId => ({
      id: `${batchId}-${userId}`,
      noticeBatchId: batchId,
      noticeType,
      audience,
      companyId: selectedCompany?.id || '',
      jobId: selectedJob?.id || '',
      userId,
      title: title.trim(),
      message: message.trim(),
      type: typeConfig?.tone || 'info',
      read: false,
      createdAt,
      link: '/student'
    }));
    addNotifications(noticeRows);
    setSaved(`Notice sent to ${audience === 'all' ? students.length + ' students' : recipientIds.length + ' students'}.`);
    window.setTimeout(() => setSaved(''), 4000);
  };

  return <div className="mx-auto max-w-5xl space-y-6">
    <header><h1 className="text-2xl font-bold text-gray-900">Placement notices</h1><p className="mt-1 text-sm text-gray-500">Choose a notice type and its student audience. The message template fills from the selected company drive and remains editable.</p></header>
    <form onSubmit={publish} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-gray-700">Notice type<select value={noticeType} onChange={event => { const type = noticeTypes.find(item => item.id === event.target.value); setNoticeType(event.target.value); setAudience(type?.audience || 'applied'); }} className="input-field mt-1">{noticeTypes.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}</select></label>
        <label className="block text-sm font-medium text-gray-700">To whom<select value={audience} onChange={event => setAudience(event.target.value)} className="input-field mt-1">{audienceOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
        <label className="block text-sm font-medium text-gray-700">Company<select value={companyId} onChange={event => { setCompanyId(event.target.value); setJobId(''); }} className="input-field mt-1"><option value="">Choose a company</option>{companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
        <label className="block text-sm font-medium text-gray-700">Placement opportunity<select value={jobId} onChange={event => setJobId(event.target.value)} className="input-field mt-1" disabled={!companyId}><option value="">Choose an opportunity</option>{companyJobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}</select></label>
      </div>
      <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-900">Recipients: <strong>{recipientCount}</strong>{audience === 'all' ? ' students (all students)' : selectedJob ? ` students · ${audienceOptions.find(option => option.id === audience)?.label}` : ' students · choose a company opportunity to calculate recipients'}</div>
      <label className="block text-sm font-medium text-gray-700">Message title<input required maxLength={180} value={title} onChange={event => setTitle(event.target.value)} className="input-field mt-1" /></label>
      <label className="block text-sm font-medium text-gray-700">Message<textarea required maxLength={4000} rows={9} value={message} onChange={event => setMessage(event.target.value)} className="input-field mt-1" /></label>
      <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between"><p role="status" className="text-sm font-medium text-green-700">{saved}</p><button className="btn btn-primary gap-2"><Send size={16} /> Send notice</button></div>
      {error && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}
    </form>
    <section className="space-y-3"><h2 className="text-lg font-semibold text-gray-900">Recent notices</h2>{recentNotices.map(item => <article key={item.noticeBatchId || item.id} className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4"><BellRing className="mt-1 h-5 w-5 shrink-0 text-red-600" /><div className="min-w-0 flex-1"><h3 className="font-semibold text-gray-900">{item.title}</h3><p className="mt-1 whitespace-pre-line text-sm text-gray-600">{item.message}</p><p className="mt-2 text-xs text-gray-500">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''} · Sent to {item.recipientCount} students</p></div></article>)}{!recentNotices.length && <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">No placement notices sent yet.</p>}</section>
  </div>;
}
