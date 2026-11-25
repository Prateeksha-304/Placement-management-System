import React, { useMemo, useState } from 'react';
import { Building2, Edit2, Plus, Search, Trash2, X } from 'lucide-react';
import { useData } from '../../hooks/useData';

const emptyCompany = { name: '', contactEmail: '', rolesOffered: '', type: '' };

export default function ManageCompanies() {
  const { companies = [], addCompany, updateCompany, deleteCompany } = useData();
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyCompany);
  const [message, setMessage] = useState('');

  const rows = useMemo(() => companies.filter(company => {
    const text = `${company.name || ''} ${company.contactEmail || ''} ${company.rolesOffered || ''} ${company.industry || ''}`;
    return text.toLowerCase().includes(query.toLowerCase());
  }), [companies, query]);

  const closeModal = () => { setModalOpen(false); setEditingId(null); setForm(emptyCompany); };
  const openAdd = () => { setEditingId(null); setForm(emptyCompany); setModalOpen(true); };
  const openEdit = company => {
    setEditingId(company.id);
    setForm({ name: company.name || '', contactEmail: company.contactEmail || '', rolesOffered: company.rolesOffered || '', type: company.industry || company.type || '' });
    setModalOpen(true);
  };
  const submit = async event => {
    event.preventDefault();
    const company = {
      id: editingId,
      name: form.name.trim(),
      contactEmail: form.contactEmail.trim(),
      rolesOffered: form.rolesOffered.trim(),
      industry: form.type.trim(),
      type: form.type.trim()
    };
    try {
      if (editingId) await updateCompany(editingId, company);
      else await addCompany(company);
      setMessage(editingId ? 'Company details updated.' : 'Company added with separate placement drives and eligibility criteria generated for each offered role.');
      closeModal();
      window.setTimeout(() => setMessage(''), 4500);
    } catch {
      // error displayed by context alert
    }
  };
  const remove = async company => {
    if (window.confirm(`Remove ${company.name} from the company list?`)) {
      try {
        await deleteCompany(company.id);
      } catch {
        // error displayed by context alert
      }
    }
  };

  return <div className="mx-auto max-w-6xl space-y-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="text-2xl font-bold text-gray-900">Companies</h1><p className="mt-1 text-sm text-gray-500">Add and maintain company name, email, roles offered and type.</p></div>
      <button type="button" onClick={openAdd} className="btn btn-primary gap-2"><Plus size={16} />Add company</button>
    </header>
    {message && <p role="status" className="rounded-lg border border-red-900 bg-black px-4 py-3 text-sm text-white">{message}</p>}
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600">{rows.length} companies</p>
        <div className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" /><input aria-label="Search companies" value={query} onChange={event => setQuery(event.target.value)} className="input-field pl-9" placeholder="Search name, email or role" /></div>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map(company => <article key={company.id} className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 gap-3"><span className="rounded-lg bg-red-50 p-2 text-red-700"><Building2 size={18} /></span><div className="min-w-0"><h2 className="truncate font-semibold text-gray-900">{company.name}</h2><p className="truncate text-sm text-gray-500">{company.contactEmail || 'No email provided'}</p></div></div><span className="rounded-full border border-gray-700 px-2 py-1 text-xs text-white-300">{company.industry || company.type || 'Type not provided'}</span></div>
          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-gray-500">Roles offered</p><p className="mt-1 text-sm text-gray-800">{company.rolesOffered || 'Not provided'}</p>
          <div className="mt-4 flex justify-end gap-2 border-t border-gray-200 pt-3"><button type="button" onClick={() => openEdit(company)} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:border-red-700 hover:text-red-800"><Edit2 size={14} />Edit</button><button type="button" onClick={() => remove(company)} className="btn btn-danger gap-1 px-3 py-1.5"><Trash2 size={14} />Remove</button></div>
        </article>)}
        {!rows.length && <p className="col-span-full py-10 text-center text-sm text-gray-500">No companies match your search.</p>}
      </div>
    </section>
    {modalOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/20 p-4" onClick={closeModal}><form onSubmit={submit} onClick={event => event.stopPropagation()} className="w-full max-w-lg space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
      <div className="flex items-start justify-between"><div><h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit company' : 'Add company'}</h2><p className="mt-1 text-sm text-gray-600">{editingId ? 'Update company details.' : 'Adding a company auto-generates placement drives and eligibility criteria for all offered roles.'}</p></div><button type="button" onClick={closeModal} aria-label="Close" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><X size={18} /></button></div>
      <label className="block text-sm font-medium text-gray-700">Company name<input required maxLength={120} value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} className="input-field mt-1" /></label>
      <label className="block text-sm font-medium text-gray-700">Contact email<input required type="email" value={form.contactEmail} onChange={event => setForm(current => ({ ...current, contactEmail: event.target.value }))} className="input-field mt-1" /></label>
      <label className="block text-sm font-medium text-gray-700">Roles offered<input required value={form.rolesOffered} onChange={event => setForm(current => ({ ...current, rolesOffered: event.target.value }))} className="input-field mt-1" placeholder="Software Engineer, Embedded Engineer" /><span className="mt-1 block text-xs text-gray-500">Separate multiple roles with commas. A distinct drive and eligibility criteria will be created for each role.</span></label>
      <label className="block text-sm font-medium text-gray-700">Company type<input required value={form.type} onChange={event => setForm(current => ({ ...current, type: event.target.value }))} className="input-field mt-1" placeholder="Core, Product, Service" /></label>
      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4"><button type="button" onClick={closeModal} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button><button type="submit" className="btn btn-primary">{editingId ? 'Save company' : 'Add company'}</button></div>
    </form></div>}
  </div>;
}
