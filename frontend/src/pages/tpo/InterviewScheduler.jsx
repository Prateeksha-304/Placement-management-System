import React, { useState, useMemo } from 'react';
import { useData } from '../../hooks/useData';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import { AlertTriangle, Plus, Edit, Trash2 } from 'lucide-react';

const ROUND_TYPES = ['Aptitude Test', 'Technical Interview', 'HR Interview', 'Group Discussion', 'Managerial Round'];

const InterviewScheduler = () => {
  const { data: { interviews = [], students = [], companies = [] } = {}, addInterview, updateInterview, deleteInterview } = useData();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    studentId: '',
    companyId: '',
    roundType: ROUND_TYPES[0],
    date: '',
    time: '',
    venue: '',
    mode: 'In-Person',
    status: 'Scheduled'
  });

  const [filterCompany, setFilterCompany] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const checkConflict = () => {
    if (!formData.studentId || !formData.date || !formData.time) return null;
    
    const newDateTime = new Date(`${formData.date}T${formData.time}`);
    
    for (let intv of interviews) {
      if (intv.id === editingId) continue;
      if (intv.studentId === formData.studentId && intv.date === formData.date) {
        const existingTime = new Date(`${intv.date}T${intv.time}`);
        const diffHours = Math.abs(newDateTime - existingTime) / 36e5;
        if (diffHours < 1) {
          const s = students.find(st => st.id === intv.studentId);
          const c = companies.find(cp => cp.id === intv.companyId);
          return `Conflict: ${s?.name || 'Student'} already has ${intv.roundType} at ${c?.name || 'Company'} at ${intv.time} on this date`;
        }
      }
    }
    return null;
  };

  const conflictWarning = checkConflict();

  const handleOpenModal = (intv = null) => {
    if (intv) {
      setEditingId(intv.id);
      setFormData({
        studentId: intv.studentId,
        companyId: intv.companyId,
        roundType: intv.roundType,
        date: intv.date,
        time: intv.time,
        venue: intv.venue || '',
        mode: intv.mode || 'In-Person',
        status: intv.status || 'Scheduled'
      });
    } else {
      setEditingId(null);
      setFormData({
        studentId: '',
        companyId: '',
        roundType: ROUND_TYPES[0],
        date: '',
        time: '',
        venue: '',
        mode: 'In-Person',
        status: 'Scheduled'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.studentId || !formData.companyId || !formData.date || !formData.time) {
      alert('Please fill all required fields');
      return;
    }
    
    if (editingId) {
      updateInterview(editingId, formData);
    } else {
      addInterview({ ...formData, id: `int-${Date.now()}` });
    }
    setIsModalOpen(false);
  };

  const tableData = useMemo(() => {
    return interviews.map(intv => {
      const s = students.find(st => st.id === intv.studentId);
      const c = companies.find(cp => cp.id === intv.companyId);
      return {
        ...intv,
        studentName: s ? s.name : 'Unknown',
        companyName: c ? c.name : 'Unknown'
      };
    }).filter(intv => {
      if (filterCompany !== 'All' && intv.companyId !== filterCompany) return false;
      if (filterStatus !== 'All' && intv.status !== filterStatus) return false;
      return true;
    }).sort((a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`));
  }, [interviews, students, companies, filterCompany, filterStatus]);

  const columns = [
    { header: 'Student', accessor: 'studentName', sortable: true },
    { header: 'Company', accessor: 'companyName', sortable: true },
    { header: 'Round Type', accessor: 'roundType', sortable: true },
    { 
      header: 'Date & Time', 
      accessor: 'date', 
      sortable: true,
      render: (val, row) => `${val} at ${row.time}`
    },
    { 
      header: 'Venue/Mode', 
      accessor: 'venue', 
      render: (val, row) => `${val || 'N/A'} (${row.mode})`
    },
    { 
      header: 'Status', 
      accessor: 'status', 
      sortable: true,
      render: (val) => {
        let type = 'info';
        if (val === 'Scheduled') type = 'warning';
        if (val === 'Completed') type = 'success';
        if (val === 'Cancelled') type = 'error';
        return <Badge type={type}>{val}</Badge>;
      }
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (val, row) => (
        <div className="flex gap-2">
          <button onClick={() => handleOpenModal(row)} className="text-blue-600 hover:text-blue-800 p-1"><Edit className="w-4 h-4"/></button>
          <button onClick={() => { if(window.confirm('Delete this interview?')) deleteInterview(val); }} className="text-red-600 hover:text-red-800 p-1"><Trash2 className="w-4 h-4"/></button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-crimson-800">Interview Scheduler</h1>
        <button 
          onClick={() => handleOpenModal()} 
          className="bg-crimson-600 hover:bg-crimson-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" /> Schedule New
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-4 mb-4">
        <select 
          value={filterCompany} 
          onChange={(e) => setFilterCompany(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-crimson-500"
        >
          <option value="All">All Companies</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-crimson-500"
        >
          <option value="All">All Statuses</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <DataTable columns={columns} data={tableData} keyField="id" />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{editingId ? 'Edit Interview' : 'Schedule Interview'}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                <select 
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={formData.studentId}
                  onChange={e => setFormData({...formData, studentId: e.target.value})}
                >
                  <option value="">Select Student...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.usn || s.id})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <select 
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={formData.companyId}
                  onChange={e => setFormData({...formData, companyId: e.target.value})}
                >
                  <option value="">Select Company...</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Round Type</label>
                <select 
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={formData.roundType}
                  onChange={e => setFormData({...formData, roundType: e.target.value})}
                >
                  {ROUND_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input 
                    type="date" 
                    className="w-full border border-gray-300 rounded-md p-2"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input 
                    type="time" 
                    className="w-full border border-gray-300 rounded-md p-2"
                    value={formData.time}
                    onChange={e => setFormData({...formData, time: e.target.value})}
                  />
                </div>
              </div>

              {conflictWarning && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-start gap-2 border border-red-200 text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p><b>⚠ Warning:</b> {conflictWarning}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="mode" value="In-Person" checked={formData.mode === 'In-Person'} onChange={e => setFormData({...formData, mode: e.target.value})} /> In-Person
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="mode" value="Online" checked={formData.mode === 'Online'} onChange={e => setFormData({...formData, mode: e.target.value})} /> Online
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue / Link</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={formData.venue}
                  onChange={e => setFormData({...formData, venue: e.target.value})}
                  placeholder={formData.mode === 'Online' ? 'Meeting Link' : 'Room Number/Location'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-crimson-600 text-white rounded-md hover:bg-crimson-700">Save Interview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewScheduler;
