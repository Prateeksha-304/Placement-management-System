import React, { useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { formatDate, getStatusColor } from '../../utils/helpers';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { FileText, Filter, Clock, ChevronDown, CheckCircle, XCircle } from 'lucide-react';

const MyApplications = () => {
  const { currentUser } = useAuth();
  const { applications, jobs } = useData();
  const [statusFilter, setStatusFilter] = useState('All');

  const myApplications = useMemo(() => {
    return applications
      .filter((app) => app.studentId === currentUser?.id || app.usn === currentUser?.usn || app.studentId === currentUser?.usn)
      .map(app => {
        const job = jobs.find(j => j.id === (app.jobId || app.driveId));
        return { ...app, job };
      })
      .filter(app => statusFilter === 'All' || app.status === statusFilter)
      .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
  }, [applications, jobs, currentUser, statusFilter]);

  const allMyApps = applications.filter((app) => app.studentId === currentUser?.id || app.usn === currentUser?.usn || app.studentId === currentUser?.usn);
  const stats = {
    total: allMyApps.length,
    applied: allMyApps.filter(a => a.status === 'Applied').length,
    selected: allMyApps.filter(a => a.status === 'Selected').length,
    rejected: allMyApps.filter(a => a.status === 'Rejected').length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
        <p className="text-gray-500 mt-1">Track the status of your job applications.</p>
      </div>

      {/* Stats Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100 text-center">
        <div className="px-4 py-2">
          <p className="text-sm text-gray-500 font-medium">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="px-4 py-2">
          <p className="text-sm text-gray-500 font-medium">Applied</p>
          <p className="text-2xl font-bold text-indigo-600">{stats.applied}</p>
        </div>
        <div className="px-4 py-2">
          <p className="text-sm text-gray-500 font-medium">Selected</p>
          <p className="text-2xl font-bold text-green-600">{stats.selected}</p>
        </div>
        <div className="px-4 py-2">
          <p className="text-sm text-gray-500 font-medium">Rejected</p>
          <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex justify-end">
        <div className="relative inline-block text-left">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border bg-white"
          >
            <option value="All">All Statuses</option>
            <option value="Applied">Applied</option>
            <option value="Selected">Selected</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* DataTable */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {myApplications.length === 0 ? (
          <div className="p-12">
            <EmptyState icon={<FileText />} message="No applications found matching the filter." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company & Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {myApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{app.job?.companyName || app.job?.company || app.companyName || 'Unknown Company'}</div>
                          <div className="text-sm text-gray-500">{app.job?.title || app.jobTitle || 'Unknown Role'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Clock className="w-4 h-4 mr-1 text-gray-400" />
                        {formatDate(app.appliedDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge text={app.status} color={getStatusColor(app.status)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplications;
