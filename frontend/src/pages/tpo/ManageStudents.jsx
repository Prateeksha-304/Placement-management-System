import React, { useState, useMemo } from 'react';
import { useData } from '../../hooks/useData';
import { Search, Filter, Eye, Edit, Download, User, BookOpen, Award, FileText } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import SearchBar from '../../components/common/SearchBar';
import { calculatePlacementStats } from '../../utils/helpers';

const ManageStudents = () => {
  const { students, applications, companies, drives, jobs, updateStudent } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    branch: '',
    degree: '',
    status: '',
    minCgpa: ''
  });
  
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  const stats = useMemo(() => calculatePlacementStats(students, applications, jobs), [students, applications, jobs]);

  const branches = [...new Set(students.map(s => s.branch))];
  const degrees = [...new Set(students.map(s => s.degree))];

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.rollNo?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchBranch = filters.branch ? student.branch === filters.branch : true;
      const matchDegree = filters.degree ? student.degree === filters.degree : true;
      
      let matchStatus = true;
      if (filters.status) {
        const isPlaced = applications.some(app => app.studentId === student.id && app.status === 'Selected');
        matchStatus = filters.status === 'Placed' ? isPlaced : !isPlaced;
      }
      
      const matchCgpa = filters.minCgpa ? student.cgpa >= parseFloat(filters.minCgpa) : true;
      
      return matchSearch && matchBranch && matchDegree && matchStatus && matchCgpa;
    });
  }, [students, searchTerm, filters, applications]);

  const columns = [
    { header: 'Name', accessor: 'name', sortable: true, render: (val, row) => (
      <div>
        <div className="font-medium text-gray-900">{val}</div>
        <div className="text-xs text-gray-500">{row.rollNo || row.email}</div>
      </div>
    )},
    { header: 'Branch', accessor: 'branch', sortable: true },
    { header: 'Degree', accessor: 'degree', sortable: true },
    { header: 'CGPA', accessor: 'cgpa', sortable: true },
    { header: 'Backlogs', accessor: 'backlogs', sortable: true },
    { header: 'Status', accessor: 'status', render: (_, row) => {
      const isPlaced = applications.some(app => app.studentId === row.id && app.status === 'Selected');
      return isPlaced ? <Badge type="success">Placed</Badge> : <Badge type="warning">Unplaced</Badge>;
    }},
    { header: 'Apps', accessor: 'apps', render: (_, row) => {
      const count = applications.filter(app => app.studentId === row.id).length;
      return <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{count}</span>;
    }},
    { header: 'Actions', accessor: 'actions', render: (_, row) => (
      <div className="flex space-x-2">
        <button onClick={() => handleView(row)} className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50">
          <Eye size={18} />
        </button>
        <button onClick={() => handleEdit(row)} className="text-gray-600 hover:text-gray-900 p-1 rounded-full hover:bg-gray-100">
          <Edit size={18} />
        </button>
      </div>
    )}
  ];

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleView = (student) => {
    setSelectedStudent(student);
    setIsViewModalOpen(true);
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setEditFormData(student);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (updateStudent) {
      updateStudent(editFormData.id, editFormData);
    }
    setIsEditModalOpen(false);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: name === 'cgpa' || name === 'backlogs' ? Number(value) : value }));
  };

  const studentApplications = selectedStudent ? applications.filter(app => app.studentId === selectedStudent.id) : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Students</h1>
          <p className="text-gray-500 text-sm">View and manage student profiles and placement status.</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 shadow-sm text-sm font-medium">
          <Download size={16} />
          <span>Export Data</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="text-sm font-medium text-gray-500">Total Students</div>
          <div className="text-2xl font-bold text-gray-900">{stats?.totalStudents || students.length || 0}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="text-sm font-medium text-gray-500">Placed Students</div>
          <div className="text-2xl font-bold text-green-600">{stats?.placedStudents || 0}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="text-sm font-medium text-gray-500">Unplaced Students</div>
          <div className="text-2xl font-bold text-yellow-600">{(stats?.totalStudents || students.length) - (stats?.placedStudents || 0)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="text-sm font-medium text-gray-500">Avg CGPA</div>
          <div className="text-2xl font-bold text-indigo-600">
            {students.length > 0 ? (students.reduce((acc, curr) => acc + (curr.cgpa || 0), 0) / students.length).toFixed(2) : '0.00'}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search by name, email or roll no..." />
          </div>
          <div className="flex flex-wrap gap-2">
            <select name="branch" value={filters.branch} onChange={handleFilterChange} className="block w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white">
              <option value="">All Branches</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select name="degree" value={filters.degree} onChange={handleFilterChange} className="block w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white">
              <option value="">All Degrees</option>
              {degrees.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select name="status" value={filters.status} onChange={handleFilterChange} className="block w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white">
              <option value="">All Status</option>
              <option value="Placed">Placed</option>
              <option value="Unplaced">Unplaced</option>
            </select>
            <select name="minCgpa" value={filters.minCgpa} onChange={handleFilterChange} className="block w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white">
              <option value="">Any CGPA</option>
              <option value="9.0">9.0 & Above</option>
              <option value="8.0">8.0 & Above</option>
              <option value="7.0">7.0 & Above</option>
              <option value="6.0">6.0 & Above</option>
            </select>
          </div>
        </div>

        <DataTable 
          columns={columns} 
          data={filteredStudents} 
          keyField="id"
          emptyMessage="No students found matching the criteria."
        />
      </div>

      {/* View Student Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Student Profile" size="lg">
        {selectedStudent && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4 pb-4 border-b">
              <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xl font-bold">
                {selectedStudent.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h2>
                <p className="text-gray-500">{selectedStudent.email} | {selectedStudent.rollNo || 'N/A'}</p>
                <div className="mt-1">
                  {applications.some(app => app.studentId === selectedStudent.id && app.status === 'Selected') ? 
                    <Badge type="success">Placed</Badge> : <Badge type="warning">Unplaced</Badge>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center"><BookOpen size={16} className="mr-2"/> Academic Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-500">Degree</div>
                  <div className="font-medium">{selectedStudent.degree}</div>
                  <div className="text-gray-500">Branch</div>
                  <div className="font-medium">{selectedStudent.branch}</div>
                  <div className="text-gray-500">Graduation Year</div>
                  <div className="font-medium">{selectedStudent.graduationYear}</div>
                  <div className="text-gray-500">CGPA</div>
                  <div className="font-medium">{selectedStudent.cgpa}</div>
                  <div className="text-gray-500">Active Backlogs</div>
                  <div className="font-medium">{selectedStudent.backlogs}</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center"><User size={16} className="mr-2"/> Personal Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-500">Phone</div>
                  <div className="font-medium">{selectedStudent.phone || 'N/A'}</div>
                  <div className="text-gray-500">Gender</div>
                  <div className="font-medium">{selectedStudent.gender || 'N/A'}</div>
                  <div className="text-gray-500">DOB</div>
                  <div className="font-medium">{selectedStudent.dob || 'N/A'}</div>
                </div>
              </div>
            </div>

            {selectedStudent.skills && selectedStudent.skills.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center"><Award size={16} className="mr-2"/> Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedStudent.skills.map(skill => (
                    <span key={skill} className="bg-gray-100 text-gray-800 text-xs px-2.5 py-1 rounded-full border border-gray-200">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center"><FileText size={16} className="mr-2"/> Application History</h3>
              {studentApplications.length > 0 ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {studentApplications.map(app => {
                        const comp = companies.find(c => c.id === app.companyId);
                        const roleName = drives.find(d => d.id === app.driveId)?.name || 'Unknown Role';
                        return (
                          <tr key={app.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">{comp?.name || 'Unknown'}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{roleName}</td>
                            <td className="px-4 py-2 text-sm">
                              <Badge type={app.status === 'Selected' ? 'success' : app.status === 'Rejected' ? 'danger' : 'info'}>{app.status}</Badge>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No applications found.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Student Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Student Data">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" name="name" value={editFormData.name || ''} onChange={handleEditFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" name="email" value={editFormData.email || ''} onChange={handleEditFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Roll No</label>
              <input type="text" name="rollNo" value={editFormData.rollNo || ''} onChange={handleEditFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Branch</label>
              <input type="text" name="branch" value={editFormData.branch || ''} onChange={handleEditFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Degree</label>
              <input type="text" name="degree" value={editFormData.degree || ''} onChange={handleEditFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Graduation Year</label>
              <input type="number" name="graduationYear" value={editFormData.graduationYear || ''} onChange={handleEditFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">CGPA</label>
              <input type="number" step="0.01" name="cgpa" value={editFormData.cgpa || ''} onChange={handleEditFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Active Backlogs</label>
              <input type="number" name="backlogs" value={editFormData.backlogs !== undefined ? editFormData.backlogs : 0} onChange={handleEditFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">Save Changes</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageStudents;
