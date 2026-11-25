import React, { useState } from 'react';
import { useData } from '../../hooks/useData';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { generateId } from '../../utils/helpers';

const UserManagement = () => {
  const { data, setUsers } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const initialForm = { name: '', email: '', role: 'student', companyId: '', isActive: true };
  const [formData, setFormData] = useState(initialForm);

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData(user);
    } else {
      setEditingUser(null);
      setFormData(initialForm);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingUser) {
      setUsers(data.users.map(u => u.id === editingUser.id ? { ...u, ...formData } : u));
    } else {
      setUsers([...data.users, { ...formData, id: generateId('usr'), password: 'password123' }]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this user?')) {
      setUsers(data.users.filter(u => u.id !== id));
    }
  };

  const toggleStatus = (user) => {
    setUsers(data.users.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Role', accessor: row => <Badge variant="outline">{row.role}</Badge> },
    { header: 'Status', accessor: row => <Badge variant={row.isActive ? 'success' : 'danger'}>{row.isActive ? 'Active' : 'Inactive'}</Badge> },
    {
      header: 'Actions',
      accessor: row => (
        <div className="flex gap-2">
          <button onClick={() => toggleStatus(row)} className="text-sm text-gray-500 hover:text-gray-700">Toggle</button>
          <button onClick={() => handleOpenModal(row)} className="text-blue-600 hover:text-blue-800"><Edit size={16}/></button>
          <button onClick={() => handleDelete(row.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16}/></button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500">Manage system users and access</p>
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={18} /> Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <DataTable data={data.users} columns={columns} />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full rounded-md border border-gray-300 p-2 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full rounded-md border border-gray-300 p-2 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full rounded-md border border-gray-300 p-2 outline-none focus:border-blue-500">
              <option value="student">Student</option>
              <option value="tpo">TPO</option>
              <option value="recruiter">Recruiter</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          {formData.role === 'recruiter' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <select value={formData.companyId || ''} onChange={e => setFormData({...formData, companyId: e.target.value})} className="w-full rounded-md border border-gray-300 p-2 outline-none focus:border-blue-500">
                <option value="">-- Select Company --</option>
                {data.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 mt-4">
            <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="rounded text-blue-600" />
            <label className="text-sm font-medium text-gray-700">Active User</label>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;
