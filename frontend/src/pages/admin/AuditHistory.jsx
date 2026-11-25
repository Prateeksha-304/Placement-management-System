import React, { useMemo, useState } from 'react';
import { useData } from '../../hooks/useData';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';

const AuditHistory = () => {
  const { data: { applications = [], interviews = [], users = [], students = [], jobs = [], companies = [] } = {} } = useData();
  
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [filterAction, setFilterAction] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const auditData = useMemo(() => {
    let logs = [];
    
    applications.forEach(app => {
      const student = students.find(s => s.id === app.studentId);
      const job = jobs.find(j => j.id === app.jobId);
      if (student && job) {
        logs.push({
          id: `app-apply-${app.id}`,
          date: app.appliedDate || new Date(Date.now() - Math.random() * 10000000000).toISOString(),
          user: student.name,
          action: 'Student applied for job',
          module: 'Applications',
          details: `${student.name} applied for ${job.title}`
        });

        if (app.status === 'Selected') {
          const company = companies.find(c => c.id === job.companyId);
          logs.push({
            id: `app-sel-${app.id}`,
            date: app.lastUpdated || new Date(Date.now() - Math.random() * 5000000000).toISOString(),
            user: 'System',
            action: 'Result published',
            module: 'Applications',
            details: `${student.name} selected at ${company?.name || 'Company'}`
          });
        }
      }
    });

    interviews.forEach(intv => {
      const student = students.find(s => s.id === intv.studentId);
      const company = companies.find(c => c.id === intv.companyId);
      if (student && company) {
        logs.push({
          id: `int-${intv.id}`,
          date: intv.date || new Date().toISOString(),
          user: 'TPO Admin',
          action: 'Interview scheduled',
          module: 'Interviews',
          details: `${student.name} - ${company.name} ${intv.roundType}`
        });
      }
    });

    users.forEach(user => {
      logs.push({
        id: `user-${user.id}`,
        date: new Date(Date.now() - Math.random() * 20000000000).toISOString(),
        user: 'Admin',
        action: 'New user created',
        module: 'Settings',
        details: `Created account for ${user.name} (${user.role})`
      });
    });

    // Add some random system logs
    logs.push({
      id: 'sys-1',
      date: new Date().toISOString(),
      user: 'Admin',
      action: 'Admin updated system settings',
      module: 'Settings',
      details: 'Updated global placement eligibility criteria'
    });

    return logs.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [applications, interviews, users, students, jobs, companies]);

  const filteredData = auditData.filter(log => {
    let match = true;
    if (filterAction !== 'All' && !log.module.toLowerCase().includes(filterAction.toLowerCase()) && !log.action.toLowerCase().includes(filterAction.toLowerCase())) {
      match = false;
    }
    if (searchQuery && !log.details.toLowerCase().includes(searchQuery.toLowerCase()) && !log.user.toLowerCase().includes(searchQuery.toLowerCase())) {
      match = false;
    }
    if (filterDateStart && new Date(log.date) < new Date(filterDateStart)) match = false;
    if (filterDateEnd && new Date(log.date) > new Date(filterDateEnd)) match = false;
    return match;
  });

  const columns = [
    {
      header: 'Date/Time',
      accessor: 'date',
      sortable: true,
      render: (val) => new Date(val).toLocaleString()
    },
    { header: 'User', accessor: 'user', sortable: true },
    { header: 'Action', accessor: 'action', sortable: true },
    {
      header: 'Module',
      accessor: 'module',
      sortable: true,
      render: (val) => {
        let type = 'info';
        if (val === 'Applications') type = 'success';
        if (val === 'Interviews') type = 'warning';
        if (val === 'Settings') type = 'error';
        return <Badge type={type}>{val}</Badge>;
      }
    },
    { header: 'Details', accessor: 'details', sortable: false }
  ];

  const today = new Date().toDateString();
  const todayCount = auditData.filter(l => new Date(l.date).toDateString() === today).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-crimson-800">System Audit History</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Actions Today</p>
            <p className="text-2xl font-bold text-gray-800">{todayCount}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-full"><span className="text-blue-500 text-xl">📅</span></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Total Audit Logs</p>
            <p className="text-2xl font-bold text-gray-800">{auditData.length}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-full"><span className="text-green-500 text-xl">📝</span></div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <input
            type="text"
            placeholder="Search details or user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 flex-1 focus:outline-none focus:ring-1 focus:ring-crimson-500"
          />
          <select 
            value={filterAction} 
            onChange={(e) => setFilterAction(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-crimson-500"
          >
            <option value="All">All Modules</option>
            <option value="Applications">Applications</option>
            <option value="Interviews">Interviews</option>
            <option value="Settings">Settings</option>
          </select>
          <input
            type="date"
            value={filterDateStart}
            onChange={(e) => setFilterDateStart(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <input
            type="date"
            value={filterDateEnd}
            onChange={(e) => setFilterDateEnd(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <DataTable
          columns={columns}
          data={filteredData}
          keyField="id"
          itemsPerPage={15}
        />
      </div>
    </div>
  );
};

export default AuditHistory;
