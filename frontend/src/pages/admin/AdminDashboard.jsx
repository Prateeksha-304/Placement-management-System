import React from 'react';
import { useData } from '../../hooks/useData';
import { Users, Briefcase, Building, Activity } from 'lucide-react';
import StatsCard from '../../components/common/StatsCard';

const AdminDashboard = () => {
  const { data } = useData();

  const stats = [
    { title: 'Total Users', value: data.users.length, icon: Users, color: 'blue' },
    { title: 'Active Students', value: data.students.length, icon: Activity, color: 'green' },
    { title: 'Companies Registered', value: data.companies.length, icon: Building, color: 'indigo' },
    { title: 'Active Drives', value: data.drives.filter(d => d.status === 'Active').length, icon: Briefcase, color: 'yellow' },
  ];

  const roleCount = data.users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Administration</h1>
          <p className="text-gray-500">Overview and system health</p>
        </div>
        <div className="px-4 py-2 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 border border-green-200">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          All systems operational
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => <StatsCard key={i} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Users by Role</h2>
          <div className="space-y-4">
            {Object.entries(roleCount).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <span className="capitalize font-medium text-gray-700">{role}</span>
                <div className="flex items-center gap-4 w-2/3">
                  <div className="h-2 flex-grow bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(count / data.users.length) * 100}%` }}></div>
                  </div>
                  <span className="text-sm text-gray-500 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity (Simulated)</h2>
          <div className="space-y-4">
            <div className="flex gap-3 text-sm border-b pb-3 border-gray-50">
              <span className="text-gray-400 w-16">10:42 AM</span>
              <span className="font-medium text-blue-600">Admin</span>
              <span className="text-gray-600">updated system settings</span>
            </div>
            <div className="flex gap-3 text-sm border-b pb-3 border-gray-50">
              <span className="text-gray-400 w-16">09:15 AM</span>
              <span className="font-medium text-purple-600">TPO</span>
              <span className="text-gray-600">approved 50 student profiles</span>
            </div>
            <div className="flex gap-3 text-sm">
              <span className="text-gray-400 w-16">Yesterday</span>
              <span className="font-medium text-green-600">System</span>
              <span className="text-gray-600">automated database backup completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
