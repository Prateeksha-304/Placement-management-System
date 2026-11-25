import React, { useState, useMemo } from 'react';
import { useData } from '../../hooks/useData';
import { Download, Award, Briefcase, Building, TrendingUp, Edit3, X, Check, AlertCircle } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import SearchBar from '../../components/common/SearchBar';

const Results = () => {
  const { placementHistory = [], applications = [], updatePlacementPackage } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterYear, setFilterYear] = useState('');

  // Modal state for updating verified historical package
  const [verifyModalRecord, setVerifyModalRecord] = useState(null);
  const [newPackageInput, setNewPackageInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [modalFeedback, setModalFeedback] = useState(null);

  // Primary source: actual placement data from Supabase placement_history joined with students, company, drives
  const records = useMemo(() => {
    const list = [];
    const seen = new Set();

    // 1. Existing placement history from Supabase
    (placementHistory || []).forEach(p => {
      const usn = p.usn || p.studentId || '';
      const company = p.companyName || p.company_name || 'Company';
      const key = `${usn.toUpperCase()}-${company.toUpperCase()}`;
      seen.add(key);

      const rawPkg = p.packageLpa !== undefined && p.packageLpa !== null
        ? p.packageLpa
        : (p.package_lpa !== undefined ? p.package_lpa : null);

      const pkgLpa = rawPkg !== null && rawPkg !== undefined && rawPkg !== '' && !isNaN(Number(rawPkg))
        ? Number(Number(rawPkg).toFixed(2))
        : null;

      list.push({
        id: p.id || p.placementId || p.placId || `PLH-${list.length + 1}`,
        placId: p.placId || p.placementId || p.id,
        usn: usn,
        studentName: p.studentName || p.student_name || usn,
        branch: p.branch || 'N/A',
        companyName: company,
        companyId: p.companyId || p.company_id || '',
        role: p.role || 'Placed Role',
        packageLpa: pkgLpa,
        package: pkgLpa !== null ? Math.round(pkgLpa * 100000) : null,
        academicYear: p.academicYear || p.academic_year || '—',
        status: 'Selected',
        isHistorical: true
      });
    });

    // 2. Also incorporate any selected applications not yet in history
    (applications || [])
      .filter(a => a.status === 'Selected')
      .forEach(a => {
        const usn = a.usn || a.studentId || '';
        const company = a.companyName || 'Company';
        const key = `${usn.toUpperCase()}-${company.toUpperCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          const rawPkg = a.salLpa !== undefined && a.salLpa !== null
            ? a.salLpa
            : (a.sal_lpa !== undefined ? a.sal_lpa : null);

          const pkgLpa = rawPkg !== null && rawPkg !== undefined && rawPkg !== '' && !isNaN(Number(rawPkg))
            ? Number(Number(rawPkg).toFixed(2))
            : null;

          list.push({
            id: a.id || `APP-${a.app_id || list.length + 1}`,
            placId: null,
            usn: usn,
            studentName: a.studentName || usn,
            branch: a.branch || 'N/A',
            companyName: company,
            companyId: a.companyId || '',
            role: a.role || a.jobTitle || 'Selected Role',
            packageLpa: pkgLpa,
            package: pkgLpa !== null ? Math.round(pkgLpa * 100000) : null,
            academicYear: a.academicYear || '2026-27',
            status: 'Selected',
            isHistorical: false
          });
        }
      });

    return list.sort((a, b) => {
      if (a.packageLpa === null && b.packageLpa === null) return 0;
      if (a.packageLpa === null) return 1;
      if (b.packageLpa === null) return -1;
      return b.packageLpa - a.packageLpa;
    });
  }, [placementHistory, applications]);

  const stats = useMemo(() => {
    const totalOffers = records.length;
    const uniqueCompanies = new Set(records.map(a => a.companyName)).size;
    const packages = records.map(a => a.packageLpa).filter(p => p !== null && p > 0);
    const highestPackage = packages.length > 0 ? Math.max(...packages) : 0;
    const avgPackage = packages.length > 0 ? packages.reduce((a, b) => a + b, 0) / packages.length : 0;
    const unverifiedCount = records.filter(a => a.packageLpa === null).length;
    
    return { totalOffers, uniqueCompanies, highestPackage, avgPackage, unverifiedCount };
  }, [records]);

  const branches = useMemo(() => [...new Set(records.map(a => a.branch).filter(Boolean))].sort(), [records]);
  const companyList = useMemo(() => [...new Set(records.map(a => a.companyName).filter(Boolean))].sort(), [records]);
  const academicYears = useMemo(() => [...new Set(records.map(a => a.academicYear).filter(y => y && y !== '—'))].sort().reverse(), [records]);

  const filteredResults = useMemo(() => {
    const rawSearch = typeof searchTerm === 'string' ? searchTerm : (searchTerm?.target?.value || '');
    const cleanSearch = (rawSearch || '').trim().toLowerCase();

    return records.filter(app => {
      const matchSearch = cleanSearch
        ? `${app.usn || ''} ${app.studentName || ''} ${app.companyName || ''} ${app.branch || ''} ${app.role || ''} ${app.academicYear || ''}`
            .toLowerCase()
            .includes(cleanSearch)
        : true;
      const matchCompany = filterCompany ? app.companyName === filterCompany : true;
      const matchBranch = filterBranch ? app.branch === filterBranch : true;
      const matchYear = filterYear ? app.academicYear === filterYear : true;
      return matchSearch && matchCompany && matchBranch && matchYear;
    });
  }, [records, searchTerm, filterCompany, filterBranch, filterYear]);

  const handleOpenVerifyModal = (row) => {
    setVerifyModalRecord(row);
    setNewPackageInput(row.packageLpa !== null && row.packageLpa !== undefined ? String(row.packageLpa) : '');
    setModalFeedback(null);
  };

  const handleSaveVerifiedPackage = async () => {
    if (!verifyModalRecord) return;
    const targetId = verifyModalRecord.placId || verifyModalRecord.id;
    if (!targetId || !String(targetId).startsWith('PLH-')) {
      setModalFeedback({ type: 'error', text: 'Package updates are only applicable to stored placement history records.' });
      return;
    }

    const val = newPackageInput.trim();
    const parsed = val === '' ? null : Number(val);
    if (parsed !== null && (isNaN(parsed) || parsed < 0)) {
      setModalFeedback({ type: 'error', text: 'Please enter a valid non-negative number for package in LPA.' });
      return;
    }

    try {
      setIsUpdating(true);
      setModalFeedback(null);
      await updatePlacementPackage(targetId, parsed);
      setModalFeedback({ type: 'success', text: `Package for ${targetId} successfully updated to ${parsed !== null ? `${parsed} LPA` : 'Unverified'}.` });
      setTimeout(() => {
        setVerifyModalRecord(null);
      }, 1200);
    } catch (err) {
      setModalFeedback({ type: 'error', text: err.message || 'Failed to update package in placement history.' });
    } finally {
      setIsUpdating(false);
    }
  };

  // Columns: Student USN, Student full name, Company name, Placement role, Package (LPA), Academic year, Action
  const columns = [
    {
      header: 'Student USN',
      accessor: 'usn',
      sortable: true,
      render: (val) => <span className="font-mono font-bold text-gray-900">{val || '—'}</span>
    },
    {
      header: 'Student Full Name',
      accessor: 'studentName',
      sortable: true,
      render: (val, row) => (
        <div>
          <p className="font-semibold text-gray-900">{val}</p>
          <p className="text-xs text-gray-500">{row.branch}</p>
        </div>
      )
    },
    {
      header: 'Company Name',
      accessor: 'companyName',
      sortable: true,
      render: (val) => <span className="font-medium text-gray-800">{val}</span>
    },
    {
      header: 'Placement Role',
      accessor: 'role',
      sortable: true,
      render: (val) => <span className="text-gray-700">{val}</span>
    },
    {
      header: 'Package (LPA)',
      accessor: 'packageLpa',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-2">
          {val !== null && val !== undefined && Number(val) > 0 ? (
            <span className="font-bold text-emerald-700">₹{Number(val).toFixed(2)} LPA</span>
          ) : (
            <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
              Unverified
            </span>
          )}
          {row.placId && String(row.placId).startsWith('PLH-') && (
            <button
              onClick={() => handleOpenVerifyModal(row)}
              className="text-gray-400 hover:text-crimson-700 p-1 rounded hover:bg-gray-100 transition-colors"
              title="Verify or update package"
            >
              <Edit3 size={14} />
            </button>
          )}
        </div>
      )
    },
    {
      header: 'Academic Year',
      accessor: 'academicYear',
      sortable: true,
      render: (val) => (
        <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
          {val}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: () => <Badge type="success">Placed</Badge>
    }
  ];

  const handleExport = () => {
    const header = ['Student USN', 'Student Full Name', 'Branch', 'Company Name', 'Placement Role', 'Package (LPA)', 'Academic Year'];
    const csv = [header, ...filteredResults.map(row => [
      row.usn,
      row.studentName,
      row.branch,
      row.companyName,
      row.role,
      row.packageLpa !== null && row.packageLpa > 0 ? `${row.packageLpa} LPA` : 'Unverified',
      row.academicYear
    ])]
      .map(line => line.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = `placement-records-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-col sm:flex-row gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Placement Records</h1>
          <p className="text-gray-500 text-sm">Official university records of verified student placements and campus offers.</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm text-sm font-medium transition-colors"
        >
          <Download size={16} />
          <span>Export Placement Records</span>
        </button>
      </div>

      {/* Top summary metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4"><Award size={24}/></div>
          <div>
            <div className="text-sm font-medium text-gray-500">Total Placements</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalOffers}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4"><Building size={24}/></div>
          <div>
            <div className="text-sm font-medium text-gray-500">Companies Hiring</div>
            <div className="text-2xl font-bold text-gray-900">{stats.uniqueCompanies}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4"><TrendingUp size={24}/></div>
          <div>
            <div className="text-sm font-medium text-gray-500">Highest Package</div>
            <div className="text-2xl font-bold text-purple-700">₹{stats.highestPackage.toFixed(2)} LPA</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4"><Briefcase size={24}/></div>
          <div>
            <div className="text-sm font-medium text-gray-500">Average Package</div>
            <div className="text-2xl font-bold text-indigo-700">₹{stats.avgPackage.toFixed(2)} LPA</div>
          </div>
        </div>
      </div>

      {stats.unverifiedCount > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold">Historical Data Integrity Note:</span>
            <span>{stats.unverifiedCount} historical placement records have unverified package values (marked as Unverified) to prevent fabricated analytics.</span>
          </div>
          <span className="text-[11px] text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded">
            Click ✏️ in any row to record verified LPA
          </span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchBar 
              value={typeof searchTerm === 'string' ? searchTerm : (searchTerm?.target?.value || '')} 
              onChange={(e) => setSearchTerm(typeof e === 'string' ? e : (e?.target?.value ?? ''))} 
              placeholder="Search USN, student name, company, role, or academic year..." 
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="block w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="">All Companies</option>
              {companyList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="block w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="">All Branches</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="block w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="">All Academic Years</option>
              {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <DataTable 
          columns={columns} 
          data={filteredResults} 
          keyField="id"
          emptyMessage="No placement records found matching the specified criteria."
        />
      </div>

      {/* Verify / Update Historical Package Modal */}
      {verifyModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                Update Verified Placement Package
              </h3>
              <button 
                onClick={() => setVerifyModalRecord(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-lg bg-gray-50 p-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Record ID:</span>
                  <span className="font-mono font-bold text-gray-800">{verifyModalRecord.placId || verifyModalRecord.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Student:</span>
                  <span className="font-medium text-gray-800">{verifyModalRecord.studentName} ({verifyModalRecord.usn})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Company & Role:</span>
                  <span className="font-medium text-gray-800">{verifyModalRecord.companyName} - {verifyModalRecord.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Academic Year:</span>
                  <span className="font-medium text-gray-800">{verifyModalRecord.academicYear}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Verified Offer Package (LPA)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400 font-semibold text-sm">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 7.50 (leave empty to reset to unverified)"
                    value={newPackageInput}
                    onChange={(e) => setNewPackageInput(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 pl-8 pr-12 py-2 text-sm focus:border-crimson-600 focus:outline-none focus:ring-1 focus:ring-crimson-600 font-semibold"
                  />
                  <span className="absolute right-3 top-2 text-gray-400 text-xs font-semibold">LPA</span>
                </div>
                <p className="mt-1 text-[11px] text-gray-500">
                  Enter only official verified package information. Null or unverified records will be excluded from salary ranges.
                </p>
              </div>

              {modalFeedback && (
                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  modalFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {modalFeedback.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                  <span>{modalFeedback.text}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setVerifyModalRecord(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleSaveVerifiedPackage}
                className="rounded-lg bg-crimson-700 px-4 py-2 text-xs font-semibold text-white hover:bg-crimson-800 disabled:opacity-50"
              >
                {isUpdating ? 'Saving…' : 'Save Verified Package'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;