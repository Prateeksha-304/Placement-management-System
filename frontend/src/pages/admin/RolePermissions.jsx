import React, { useState } from 'react';
import { Check, X, Save } from 'lucide-react';

const RolePermissions = () => {
  const modules = ['Students', 'Companies', 'Drives', 'Jobs', 'Applications', 'Users', 'Settings'];
  const roles = ['student', 'tpo', 'recruiter', 'admin'];

  // Mock initial state
  const initialState = modules.reduce((acc, mod) => {
    roles.forEach(role => {
      if (!acc[mod]) acc[mod] = {};
      // default permissions (mock)
      acc[mod][role] = {
        view: role === 'admin' || role === 'tpo' || (role === 'student' && ['Jobs', 'Applications', 'Companies', 'Drives'].includes(mod)) || (role === 'recruiter' && ['Students', 'Jobs', 'Applications'].includes(mod)),
        create: role === 'admin' || role === 'tpo' || (role === 'recruiter' && ['Jobs'].includes(mod)),
        edit: role === 'admin' || role === 'tpo' || (role === 'recruiter' && ['Jobs'].includes(mod)),
        delete: role === 'admin' || (role === 'tpo' && mod !== 'Settings' && mod !== 'Users')
      };
    });
    return acc;
  }, {});

  const [permissions, setPermissions] = useState(initialState);
  const [saved, setSaved] = useState(false);

  const togglePerm = (mod, role, permType) => {
    setPermissions(prev => ({
      ...prev,
      [mod]: {
        ...prev[mod],
        [role]: {
          ...prev[mod][role],
          [permType]: !prev[mod][role][permType]
        }
      }
    }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('pms_permissions', JSON.stringify(permissions));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Permissions</h1>
          <p className="text-gray-500">Configure access control matrix (Display Only)</p>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Save size={18} /> {saved ? 'Saved!' : 'Save Permissions'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
              {roles.map(role => (
                <th key={role} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{role}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {modules.map(mod => (
              <tr key={mod}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{mod}</td>
                {roles.map(role => (
                  <td key={role} className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center gap-2">
                      {['view', 'create', 'edit', 'delete'].map(perm => (
                        <button
                          key={perm}
                          onClick={() => togglePerm(mod, role, perm)}
                          title={`${perm} ${mod}`}
                          className={`w-6 h-6 rounded flex items-center justify-center text-xs ${
                            permissions[mod][role][perm] ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-300'
                          }`}
                        >
                          {permissions[mod][role][perm] ? <Check size={12} /> : <X size={12} />}
                        </button>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-gray-500 text-center">Icons represent: View, Create, Edit, Delete (Left to Right)</p>
    </div>
  );
};

export default RolePermissions;
