import React, { useState, useMemo } from 'react';
import { useData } from '../../hooks/useData';
import { Plus, Edit, Trash2, Calendar, MapPin, Users, Building, ChevronDown, ChevronUp, Briefcase } from 'lucide-react';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import { generateId, formatDate } from '../../utils/helpers';

const ManageDrives = () => {
  const { drives, companies, addDrive, updateDrive, deleteDrive } = useData();
  const [filterStatus, setFilterStatus] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [formData, setFormData] = useState({});
  const [expandedDriveId, setExpandedDriveId] = useState(null);

  const branchesList = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'];

  const filteredDrives = useMemo(() => {
    if (!filterStatus) return drives;
    return drives.filter(d => d.status === filterStatus);
  }, [drives, filterStatus]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectChange = (e, field) => {
    const value = e.target.value;
    setFormData(prev => {
      const current = prev[field] || [];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(item => item !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({
      name: '', description: '', type: 'On-Campus', status: 'Upcoming',
      startDate: '', endDate: '', minCgpa: 0, maxBacklogs: 0,
      eligibleBranches: [], companyIds: [], coordinatorName: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (drive, e) => {
    e.stopPropagation();
    setModalMode('edit');
    setFormData({ ...drive });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const driveData = {
      ...formData,
      minCgpa: parseFloat(formData.minCgpa),
      maxBacklogs: parseInt(formData.maxBacklogs)
    };
    
    if (modalMode === 'add') {
      if (addDrive) addDrive({ ...driveData, id: generateId('drv') });
    } else {
      if (updateDrive) updateDrive(formData.id, driveData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this drive?')) {
      if (deleteDrive) deleteDrive(id);
    }
  };

  const toggleExpand = (id) => {
    setExpandedDriveId(expandedDriveId === id ? null : id);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Ongoing': return <Badge type="success">Ongoing</Badge>;
      case 'Upcoming': return <Badge type="info">Upcoming</Badge>;
      case 'Completed': return <Badge type="default">Completed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Placement Drives</h1>
          <p className="text-gray-500 text-sm">Organize and track recruitment events.</p>
        </div>
        <button onClick={openAddModal} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm text-sm font-medium">
          <Plus size={16} />
          <span>Create Drive</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex mb-6">
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
            {['', 'Upcoming', 'Ongoing', 'Completed'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filterStatus === status ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {status || 'All'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredDrives.map(drive => {
            const isExpanded = expandedDriveId === drive.id;
            const driveCompanies = companies.filter(c => drive.companyIds?.includes(c.id));
            
            return (
              <div key={drive.id} className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-200 hover:border-indigo-300">
                <div 
                  className={`p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${isExpanded ? 'bg-gray-50' : 'bg-white'}`}
                  onClick={() => toggleExpand(drive.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="text-lg font-bold text-gray-900">{drive.name}</h3>
                      {getStatusBadge(drive.status)}
                      <Badge type={drive.type === 'On-Campus' ? 'info' : 'warning'}>{drive.type}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center text-sm text-gray-500 gap-4 mt-2">
                      <div className="flex items-center"><Calendar size={14} className="mr-1"/> {formatDate(drive.startDate)} - {formatDate(drive.endDate)}</div>
                      <div className="flex items-center"><Building size={14} className="mr-1"/> {drive.companyIds?.length || 0} Companies</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex space-x-2">
                      <button onClick={(e) => openEditModal(drive, e)} className="p-2 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors">
                        <Edit size={18} />
                      </button>
                      <button onClick={(e) => handleDelete(drive.id, e)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-5 border-t border-gray-200 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wider">Details</h4>
                        <p className="text-sm text-gray-600 mb-3">{drive.description}</p>
                        <div className="text-sm">
                          <span className="text-gray-500">Coordinator:</span> <span className="font-medium text-gray-900">{drive.coordinatorName || 'Not assigned'}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wider">Eligibility Criteria</h4>
                        <ul className="space-y-1 text-sm">
                          <li><span className="text-gray-500">Min CGPA:</span> <span className="font-medium">{drive.minCgpa}</span></li>
                          <li><span className="text-gray-500">Max Backlogs:</span> <span className="font-medium">{drive.maxBacklogs}</span></li>
                          <li><span className="text-gray-500">Branches:</span> <span className="font-medium">{drive.eligibleBranches?.join(', ') || 'Any'}</span></li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wider">Participating Companies</h4>
                        {driveCompanies.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {driveCompanies.map(c => (
                              <span key={c.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                {c.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 italic">No companies assigned yet.</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filteredDrives.length === 0 && (
            <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              No placement drives found.
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'add' ? 'Create New Drive' : 'Edit Drive'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Drive Name *</label>
              <input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea name="description" value={formData.description || ''} onChange={handleInputChange} rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Type *</label>
              <select name="type" value={formData.type || 'On-Campus'} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white">
                <option value="On-Campus">On-Campus</option>
                <option value="Off-Campus">Off-Campus</option>
                <option value="Pool">Pool Drive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status *</label>
              <select name="status" value={formData.status || 'Upcoming'} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white">
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date *</label>
              <input type="date" name="startDate" value={formData.startDate?.substring(0, 10) || ''} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">End Date *</label>
              <input type="date" name="endDate" value={formData.endDate?.substring(0, 10) || ''} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Min CGPA</label>
              <input type="number" step="0.1" name="minCgpa" value={formData.minCgpa || 0} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Max Backlogs</label>
              <input type="number" name="maxBacklogs" value={formData.maxBacklogs || 0} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Eligible Branches</label>
              <div className="flex flex-wrap gap-3">
                {branchesList.map(branch => (
                  <label key={branch} className="inline-flex items-center">
                    <input 
                      type="checkbox" 
                      value={branch} 
                      checked={(formData.eligibleBranches || []).includes(branch)}
                      onChange={(e) => handleMultiSelectChange(e, 'eligibleBranches')}
                      className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">{branch}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Participating Companies</label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2 bg-gray-50">
                {companies.map(company => (
                  <label key={company.id} className="flex items-center p-2 hover:bg-gray-100 rounded">
                    <input 
                      type="checkbox" 
                      value={company.id} 
                      checked={(formData.companyIds || []).includes(company.id)}
                      onChange={(e) => handleMultiSelectChange(e, 'companyIds')}
                      className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-900 font-medium">{company.name}</span>
                    <span className="ml-2 text-xs text-gray-500">({company.industry})</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Coordinator Name</label>
              <input type="text" name="coordinatorName" value={formData.coordinatorName || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
              {modalMode === 'add' ? 'Create Drive' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageDrives;
