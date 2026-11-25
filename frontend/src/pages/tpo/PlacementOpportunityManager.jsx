import React, { useState } from 'react';
import { Plus, Search, Building2, CalendarDays, Pencil, Trash2 } from 'lucide-react';
import { useData } from '../../hooks/useData';
import { BRANCHES } from '../../utils/constants';
import { checkEligibility, generateId, isDeadlinePassed } from '../../utils/helpers';

const blank = { companyId: '', title: '', packageLpa: '', branches: [], minCGPA: '', maxBacklogs: 0, minSslc: 60, minPuc: 60, arrivalDate: '', deadline: '', description: '', status: 'Active' };
export default function PlacementOpportunityManager() {
  const { jobs, companies, students, addJob, updateJob, deleteJob, addNotifications } = useData();
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const company = companies.find(c => c.id === form.companyId);
  const listed = jobs.filter(j => `${j.companyName || j.company || ''} ${j.title || ''}`.toLowerCase().includes(query.toLowerCase()));
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const toggleBranch = branch => set('branches', form.branches.includes(branch) ? form.branches.filter(x => x !== branch) : [...form.branches, branch]);
  const reset = () => { setForm(blank); setEditingId(null); };
  const submit = async event => {
    event.preventDefault();
    if (form.arrivalDate && form.deadline) {
      if (new Date(form.arrivalDate) <= new Date(form.deadline)) {
        alert('Validation Error: Company visit date must be after the registration deadline.');
        return;
      }
    }
    const companyRecord = companies.find(c => c.id === form.companyId || c.name === form.companyId)
      || { id: form.companyId, name: form.companyId };
    if (!companyRecord.id && !form.companyId) {
      alert('Please select a company.');
      return;
    }

    const item = {
      id: editingId,
      companyId: companyRecord.id || form.companyId,
      companyName: companyRecord.name || form.companyId,
      company: companyRecord.name || form.companyId,
      title: form.title.trim(),
      package: Math.round(Number(form.packageLpa) * 100000),
      packageLpa: Number(form.packageLpa),
      branches: form.branches,
      eligibleBranches: form.branches,
      minCGPA: Number(form.minCGPA || 0),
      maxBacklogs: Number(form.maxBacklogs || 0),
      min_sslc: Number(form.minSslc || 0),
      min_puc: Number(form.minPuc || 0),
      minSslc: Number(form.minSslc || 0),
      minPuc: Number(form.minPuc || 0),
      arrivalDate: form.arrivalDate || '',
      postedDate: editingId ? jobs.find(j => j.id === editingId)?.postedDate : new Date().toISOString(),
      deadline: form.deadline || '',
      description: form.description ? form.description.trim() : '',
      status: form.status || 'Active',
      type: 'Full Time'
    };
    try {
      if (editingId) {
        await updateJob(editingId, item);
      } else {
        await addJob(item);
      }

      try {
        const recipients = form.status === 'Active' ? students.filter(student => checkEligibility(student, item)) : [];
        if (recipients.length && addNotifications) {
          const title = editingId ? `${companyRecord.name} opportunity updated` : `${companyRecord.name} placement registration is open`;
          const message = `${item.title} · ${form.packageLpa} LPA. Company visit: ${form.arrivalDate || 'TBD'}. Register by ${form.deadline || 'TBD'}.`;
          await addNotifications([{ title, message, audience: 'eligible', driveId: editingId || item.id }]);
        }
      } catch (notifErr) {
        console.warn('Notification broadcast skipped:', notifErr.message);
      }

      setNotice(editingId ? 'Placement opportunity updated successfully.' : 'Opportunity published successfully.');
      reset();
      window.setTimeout(() => setNotice(''), 3500);
    } catch (err) {
      console.error('Submit opportunity failed:', err);
    }
  };
  const edit = job => {
    setEditingId(job.id);
    setForm({
      companyId: job.companyId || companies.find(c => c.name === (job.companyName || job.company))?.id || '',
      title: job.title || '',
      packageLpa: String((Number(job.package) / 100000).toFixed(1)),
      branches: job.branches || [],
      minCGPA: String(job.minCGPA ?? ''),
      maxBacklogs: job.maxBacklogs ?? 0,
      minSslc: job.minSslc ?? job.min_sslc ?? 60,
      minPuc: job.minPuc ?? job.min_puc ?? 60,
      arrivalDate: job.arrivalDate || '',
      deadline: job.deadline || '',
      description: job.description || '',
      status: job.status || 'Active'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const remove = async id => { if (window.confirm('Remove this placement opportunity?')) { try { await deleteJob(id); } catch {} } };
  return <div className="mx-auto max-w-6xl space-y-6">
    <header><h1 className="text-2xl font-bold text-gray-900">Placement opportunities</h1><p className="mt-1 text-sm text-gray-500">Publish company visits, eligibility criteria and registration deadlines for students.</p></header>
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Edit opportunity' : 'Create opportunity'}</h2>{editingId && <button type="button" onClick={reset} className="text-sm text-gray-500">Cancel edit</button>}</div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm font-medium text-gray-700">Company<select required value={form.companyId} onChange={e => set('companyId', e.target.value)} className="input-field mt-1"><option value="">Choose a company</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="text-sm font-medium text-gray-700">Role / opportunity title<input required value={form.title} onChange={e => set('title', e.target.value)} className="input-field mt-1" placeholder="Graduate Software Engineer" /></label>
        <label className="text-sm font-medium text-gray-700">Package (LPA)<input required type="number" min="0.1" step="0.1" value={form.packageLpa} onChange={e => set('packageLpa', e.target.value)} className="input-field mt-1" placeholder="8.0" /></label>
        <label className="text-sm font-medium text-gray-700">Company visit date<input required type="date" value={form.arrivalDate} onChange={e => set('arrivalDate', e.target.value)} className="input-field mt-1" /></label>
        <label className="text-sm font-medium text-gray-700">Registration deadline<input required type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} className="input-field mt-1" /></label>
        <label className="text-sm font-medium text-gray-700">Minimum CGPA<input required type="number" min="0" max="10" step="0.1" value={form.minCGPA} onChange={e => set('minCGPA', e.target.value)} className="input-field mt-1" /></label>
        <label className="text-sm font-medium text-gray-700">Maximum active backlogs<input required type="number" min="0" step="1" value={form.maxBacklogs} onChange={e => set('maxBacklogs', e.target.value)} className="input-field mt-1" /></label>
        <label className="text-sm font-medium text-gray-700">Minimum 10th (SSLC) %<input type="number" min="0" max="100" step="0.1" value={form.minSslc} onChange={e => set('minSslc', e.target.value)} className="input-field mt-1" placeholder="60" /></label>
        <label className="text-sm font-medium text-gray-700">Minimum 12th (PUC) %<input type="number" min="0" max="100" step="0.1" value={form.minPuc} onChange={e => set('minPuc', e.target.value)} className="input-field mt-1" placeholder="60" /></label>
        <label className="text-sm font-medium text-gray-700">Registration status<select value={form.status} onChange={e => set('status', e.target.value)} className="input-field mt-1"><option>Active</option><option>Closed</option></select></label>
        <label className="text-sm font-medium text-gray-700 sm:col-span-2 lg:col-span-1">Description<textarea required rows={2} value={form.description} onChange={e => set('description', e.target.value)} className="input-field mt-1" placeholder="Role overview and other conditions" /></label>
      </div>
      <fieldset><legend className="mb-2 text-sm font-medium text-gray-700">Eligible branches</legend><div className="flex flex-wrap gap-2">{BRANCHES.map(branch => <label key={branch} className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs ${form.branches.includes(branch) ? 'border-indigo-600 bg-indigo-50 text-indigo-800' : 'border-gray-200 text-gray-600'}`}><input type="checkbox" className="sr-only" checked={form.branches.includes(branch)} onChange={() => toggleBranch(branch)} />{branch}</label>)}</div></fieldset>
      <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4">{notice && <p role="status" className="text-sm font-medium text-green-700">{notice}</p>}<button className="btn btn-primary ml-auto gap-2"><Plus size={16} />{editingId ? 'Save changes' : 'Publish opportunity'}</button></div>
    </form>
    <section className="space-y-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-lg font-semibold text-gray-900">Published opportunities <span className="text-sm font-normal text-gray-500">({jobs.length})</span></h2><div className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" /><input value={query} onChange={e => setQuery(e.target.value)} className="input-field pl-9" placeholder="Search company or title" /></div></div>
      <div className="grid gap-4 md:grid-cols-2">{listed.map(job => <article key={job.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="flex items-center gap-2 text-sm font-semibold text-indigo-700"><Building2 size={16} />{job.companyName || job.company}</p><h3 className="mt-1 text-lg font-bold text-gray-900">{job.title}</h3></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${job.status === 'Closed' || isDeadlinePassed(job.deadline) ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700'}`}>{job.status === 'Closed' || isDeadlinePassed(job.deadline) ? 'Registration Closed' : 'Active'}</span></div><p className="mt-3 text-sm text-gray-600">{job.description}</p><div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-600"><p>Package <b className="text-gray-900">₹{(Number(job.package || 0) / 100000).toFixed(1)} LPA</b></p><p>Minimum CGPA <b className="text-gray-900">{job.minCGPA ?? '—'}</b></p><p>Backlogs allowed <b className="text-gray-900">{job.maxBacklogs ?? '—'}</b></p><p>Min 10th / 12th <b className="text-gray-900">{(job.minSslc ?? job.min_sslc) ? `${job.minSslc ?? job.min_sslc}% / ${job.minPuc ?? job.min_puc}%` : '60% / 60%'}</b></p><p className="flex items-center gap-1 col-span-2"><CalendarDays size={14} />{job.arrivalDate && !isNaN(new Date(job.arrivalDate).getTime()) ? new Date(job.arrivalDate).toLocaleDateString() : 'Visit date not set'}</p></div><p className="mt-3 text-xs text-gray-500">Branches: {(job.branches || []).join(', ') || 'All branches'} · Apply by {job.deadline || '—'}</p><div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-3"><button onClick={() => edit(job)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50"><Pencil size={14} />Edit</button><button onClick={() => remove(job.id)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 size={14} />Remove</button></div></article>)}</div>
      {!listed.length && <p className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">No placement opportunities match this search.</p>}
    </section>
  </div>;
}
