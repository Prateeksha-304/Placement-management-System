import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { useData } from '../../hooks/useData';
import StatsCard from '../../components/common/StatsCard';
import { AlertCircle, BarChart3, CheckCircle2, TrendingUp, Info } from 'lucide-react';

const formatCurrency = (value) => {
  if (!value || isNaN(value)) return '₹0';
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  return `₹${Number(value).toLocaleString()}`;
};

const SALARY_RANGES = [
  { label: '0–5 LPA', min: 0, max: 5 },
  { label: '5–10 LPA', min: 5, max: 10 },
  { label: '10–15 LPA', min: 10, max: 15 },
  { label: '15–20 LPA', min: 15, max: 20 },
  { label: '20–25 LPA', min: 20, max: 25 },
  { label: '25–30 LPA', min: 25, max: 30 },
  { label: '30+ LPA', min: 30, max: Infinity }
];

const Analytics = () => {
  const contextData = useData();
  const placementHistory = contextData?.placementHistory || contextData?.data?.placementHistory || [];
  const students = contextData?.students || contextData?.data?.students || [];
  const applications = contextData?.applications || contextData?.data?.applications || [];
  const jobs = contextData?.jobs || contextData?.drives || contextData?.data?.jobs || contextData?.data?.drives || [];
  const companies = contextData?.companies || contextData?.data?.companies || [];

  // Selected applications
  const selectedApps = useMemo(() => applications.filter(a => a.status === 'Selected'), [applications]);

  // Distinct placed student IDs across all sources
  const placedStudentIds = useMemo(() => new Set([
    ...students.filter(student => student.placementStatus === 'Placed' || student.status === 'Placed').map(s => s.id || s.usn),
    ...selectedApps.map(a => a.studentId || a.usn),
    ...placementHistory.map(p => p.studentId || p.usn)
  ]), [students, selectedApps, placementHistory]);

  const totalStudents = students.length;
  const placedStudents = placedStudentIds.size;
  const placementPercentage = totalStudents ? ((placedStudents / totalStudents) * 100).toFixed(1) : 0;

  // Package statistics (from placement_history package_lpa and selected applications)
  const allVerifiedPackages = useMemo(() => {
    const pkgs = [];
    placementHistory.forEach(h => {
      const p = h.packageLpa !== undefined && h.packageLpa !== null ? Number(h.packageLpa) : null;
      if (p !== null && !isNaN(p) && p > 0) pkgs.push(p * 100000);
    });
    selectedApps.forEach(a => {
      const job = jobs.find(j => j.id === a.jobId || j.drive_id === a.driveId);
      const pkg = job?.package || (job?.salLpa ? Number(job.salLpa) * 100000 : 0);
      if (pkg > 0) pkgs.push(pkg);
    });
    return pkgs;
  }, [placementHistory, selectedApps, jobs]);

  const avgPackage = allVerifiedPackages.length > 0
    ? (allVerifiedPackages.reduce((sum, p) => sum + p, 0) / allVerifiedPackages.length)
    : 0;

  const highestPackage = allVerifiedPackages.length > 0
    ? Math.max(...allVerifiedPackages)
    : 0;

  // 1. Academic Year-wise statistics from placement_history
  const yearStats = useMemo(() => {
    const groups = {};
    placementHistory.forEach(record => {
      const year = record.academicYear || record.academic_year || 'Not provided';
      if (!groups[year]) {
        groups[year] = {
          year,
          academicYear: year,
          placedStudents: new Set(),
          records: [],
          offers: 0
        };
      }
      const studentId = record.studentId || record.usn;
      if (studentId) groups[year].placedStudents.add(studentId);
      groups[year].records.push(record);
      groups[year].offers += 1;
    });

    return Object.values(groups)
      .map(group => ({
        year: group.year,
        academicYear: group.year,
        placed: group.placedStudents.size,
        offers: group.offers,
        records: group.records
      }))
      .sort((a, b) => b.year.localeCompare(a.year));
  }, [placementHistory]);

  // Selected Academic Year State (defaults to first available academic year)
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    if (yearStats.length > 0 && (!selectedYear || !yearStats.some(y => y.year === selectedYear))) {
      setSelectedYear(yearStats[0].year);
    }
  }, [yearStats, selectedYear]);

  // 2. Salary-wise Placement Analytics for the Selected Academic Year
  // Requirement 3:
  // - Divide placements into 7 ranges: 0-5, 5-10, 10-15, 15-20, 20-25, 25-30, 30+ LPA
  // - Display actual number of students in each range
  // - Use placement_history.package_lpa for aggregation
  // - Exclude NULL package values from salary ranges
  // - Show how many historical records have missing package info
  // - Avoid duplicate student counting
  const salaryRangeAnalysis = useMemo(() => {
    if (!selectedYear) {
      return {
        chartData: SALARY_RANGES.map(r => ({ range: r.label, students: 0 })),
        missingPackageCount: 0,
        totalRecordsInYear: 0,
        totalUniqueStudentsInYear: 0,
        studentsWithPackage: 0
      };
    }

    const yearRecords = placementHistory.filter(r => (r.academicYear || r.academic_year) === selectedYear);
    const totalRecordsInYear = yearRecords.length;

    let missingPackageCount = 0;
    // Map each student USN in this year to their highest verified package_lpa
    const studentPackageMap = new Map();
    const allStudentsInYear = new Set();

    yearRecords.forEach(record => {
      const usn = record.studentId || record.usn;
      if (usn) allStudentsInYear.add(usn);

      const rawPkg = record.packageLpa !== undefined && record.packageLpa !== null
        ? record.packageLpa
        : (record.package_lpa !== undefined ? record.package_lpa : null);

      if (rawPkg === null || rawPkg === undefined || rawPkg === '' || isNaN(Number(rawPkg))) {
        missingPackageCount++;
      } else {
        const pkgVal = Number(Number(rawPkg).toFixed(2));
        if (usn) {
          const currentBest = studentPackageMap.get(usn);
          if (currentBest === undefined || pkgVal > currentBest) {
            studentPackageMap.set(usn, pkgVal);
          }
        }
      }
    });

    // Partition distinct students into the 7 salary ranges
    const rangeCounts = {};
    SALARY_RANGES.forEach(r => { rangeCounts[r.label] = 0; });

    studentPackageMap.forEach((pkgVal) => {
      for (const range of SALARY_RANGES) {
        if (pkgVal >= range.min && (range.max === Infinity ? true : pkgVal < range.max)) {
          rangeCounts[range.label]++;
          break;
        }
      }
    });

    const chartData = SALARY_RANGES.map(r => ({
      range: r.label,
      students: rangeCounts[r.label]
    }));

    return {
      chartData,
      missingPackageCount,
      totalRecordsInYear,
      totalUniqueStudentsInYear: allStudentsInYear.size,
      studentsWithPackage: studentPackageMap.size
    };
  }, [placementHistory, selectedYear]);

  // Branch-wise Placement Chart
  const branchData = useMemo(() => {
    const branches = {};
    students.forEach(s => {
      if (!s.branch) return;
      const b = s.branch;
      if (!branches[b]) branches[b] = { name: b, total: 0, placed: 0 };
      branches[b].total++;
      if (placedStudentIds.has(s.id || s.usn)) branches[b].placed++;
    });
    
    return Object.values(branches).map(b => ({
      name: b.name,
      Placed: b.placed,
      Unplaced: b.total - b.placed
    }));
  }, [students, placedStudentIds]);

  // Package Distribution Pie Chart
  const packageData = useMemo(() => {
    const ranges = { '<4L': 0, '4-6L': 0, '6-10L': 0, '10-20L': 0, '>20L': 0 };
    
    selectedApps.forEach(app => {
      const job = jobs.find(j => j.id === app.jobId || j.drive_id === app.driveId);
      if (job && job.package) {
        const pkg = parseFloat(job.package);
        if (pkg < 400000) ranges['<4L']++;
        else if (pkg <= 600000) ranges['4-6L']++;
        else if (pkg <= 1000000) ranges['6-10L']++;
        else if (pkg <= 2000000) ranges['10-20L']++;
        else ranges['>20L']++;
      }
    });

    return Object.keys(ranges).map(k => ({ name: k, value: ranges[k] })).filter(d => d.value > 0);
  }, [selectedApps, jobs]);
  
  const COLORS = ['#c51622', '#970e18', '#5a0c11', '#e3545e', '#2a2a2a'];

  // Company-wise offers and top companies
  const companyStats = useMemo(() => {
    const stats = {};
    selectedApps.forEach(app => {
      const job = jobs.find(j => j.id === app.jobId || j.drive_id === app.driveId);
      if (job) {
        const cId = job.companyId || job.company_id;
        if (!stats[cId]) stats[cId] = { id: cId, name: job.companyName || job.company || 'Company', offers: 0, totalPkg: 0, highestPkg: 0 };
        stats[cId].offers++;
        const pkg = parseFloat(job.package || (job.salLpa ? job.salLpa * 100000 : 0));
        stats[cId].totalPkg += pkg;
        if (pkg > stats[cId].highestPkg) stats[cId].highestPkg = pkg;
      }
    });
    
    return Object.values(stats).map(s => {
      const c = companies.find(comp => comp.id === s.id || comp.company_id === s.id);
      return {
        name: c ? c.name : s.name,
        offers: s.offers,
        avgPackage: s.offers > 0 ? s.totalPkg / s.offers : 0,
        highestPackage: s.highestPkg
      };
    }).sort((a, b) => b.offers - a.offers);
  }, [selectedApps, jobs, companies]);

  const topCompanies = companyStats.slice(0, 5);

  // Monthly Placement Trend
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map(m => ({ name: m, Offers: 0 }));
    
    selectedApps.forEach(app => {
      if (app.lastUpdated || app.appliedDate) {
        const d = new Date(app.lastUpdated || app.appliedDate);
        if (!isNaN(d.getTime())) {
          data[d.getMonth()].Offers++;
        }
      }
    });
    return data;
  }, [selectedApps]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-crimson-800">Placement Analytics</h1>
          <p className="text-sm text-gray-500">Comprehensive university placement trends, salary breakdowns, and institutional statistics.</p>
        </div>
      </div>
      
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Students" value={totalStudents} icon="users" color="blue" />
        <StatsCard title="Placed Students" value={placedStudents} icon="check-circle" color="green" />
        <StatsCard title="Placement %" value={`${placementPercentage}%`} icon="pie-chart" color="orange" />
        <StatsCard title="Average Package" value={formatCurrency(avgPackage)} icon="dollar-sign" color="crimson" />
      </div>

      {/* REQUIREMENT 3: Academic-Year-wise Bar Graph & Salary-wise Range Analytics (Compact & Static) */}
      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="text-crimson-700" size={20} />
              <h2 className="text-base font-bold text-gray-900">Academic Year & Salary-wise Placement Analytics</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Select any academic year below to inspect its salary-range distribution.
            </p>
          </div>

          {/* Academic Year Selector Pills */}
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mr-1">Active Year:</span>
            {yearStats.map(y => (
              <button
                key={y.year}
                onClick={() => setSelectedYear(y.year)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-none ${
                  selectedYear === y.year
                    ? 'bg-crimson-700 text-white shadow-sm ring-1 ring-crimson-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {y.year}
              </button>
            ))}
          </div>
        </div>

        {/* Dual Bar Charts Grid - Compact & Without Animation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
          {/* Chart 1: Academic-Year-wise Bar Graph */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-bold text-gray-800">
                Academic-Year-wise Placement Trend
              </h3>
              <span className="text-[11px] text-crimson-700 font-medium">Click a bar to inspect</span>
            </div>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={yearStats}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  onClick={(state) => {
                    if (state && state.activePayload && state.activePayload.length > 0) {
                      const clickedYear = state.activePayload[0].payload.year;
                      if (clickedYear) setSelectedYear(clickedYear);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="year" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#4b5563', fontSize: 11, fontWeight: 500 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 11 }} 
                  />
                  <Tooltip 
                    isAnimationActive={false}
                    cursor={{ fill: 'rgba(197, 22, 34, 0.05)' }}
                    contentStyle={{ borderRadius: '0.375rem', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', fontSize: '11px', padding: '6px 10px' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '4px', fontSize: '11px' }} />
                  <Bar 
                    dataKey="placed" 
                    name="Placed Students (Distinct)" 
                    fill="#c51622" 
                    radius={[3, 3, 0, 0]} 
                    cursor="pointer"
                    isAnimationActive={false}
                  >
                    {yearStats.map((entry, index) => (
                      <Cell 
                        key={`cell-year-${index}`} 
                        fill={entry.year === selectedYear ? '#970e18' : '#c51622'} 
                        stroke={entry.year === selectedYear ? '#5a0c11' : 'none'}
                        strokeWidth={entry.year === selectedYear ? 1.5 : 0}
                      />
                    ))}
                  </Bar>
                  <Bar 
                    dataKey="offers" 
                    name="Total Offers" 
                    fill="#6b7280" 
                    radius={[3, 3, 0, 0]} 
                    cursor="pointer"
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Selected Year Salary Range Bar Graph */}
          <div className="flex flex-col border-t lg:border-t-0 lg:border-l border-gray-100 lg:pl-4 pt-3 lg:pt-0">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-bold text-gray-800">
                Salary Range Distribution for <span className="text-crimson-800">{selectedYear || 'Selected Year'}</span>
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                {salaryRangeAnalysis.studentsWithPackage} Verified Students
              </span>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={salaryRangeAnalysis.chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 18 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="range" 
                    axisLine={false} 
                    tickLine={false} 
                    angle={-20}
                    textAnchor="end"
                    dy={4}
                    tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 500 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    allowDecimals={false}
                    tick={{ fill: '#6b7280', fontSize: 11 }} 
                  />
                  <Tooltip 
                    isAnimationActive={false}
                    cursor={{ fill: 'rgba(197, 22, 34, 0.05)' }}
                    formatter={(value) => [`${value} Students`, 'Placed Students']}
                    contentStyle={{ borderRadius: '0.375rem', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', fontSize: '11px', padding: '6px 10px' }}
                  />
                  <Bar 
                    dataKey="students" 
                    name="Students in Range" 
                    fill="#c51622" 
                    radius={[3, 3, 0, 0]}
                    isAnimationActive={false}
                  >
                    {salaryRangeAnalysis.chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-range-${index}`} 
                        fill={index === 0 ? '#b91c1c' : index === 1 ? '#c51622' : index === 2 ? '#dc2626' : index === 3 ? '#b91c1c' : '#991b1b'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Requirement 3: Informational notice for missing/null package historical records */}
            <div className="mt-2 rounded-md border border-amber-200 bg-amber-50/80 px-2.5 py-1.5 text-[11px] text-amber-900 flex items-start gap-1.5">
              <Info className="text-amber-600 mt-0.5 flex-shrink-0" size={14} />
              <div>
                <span className="font-semibold">Historical Package Integrity: </span>
                {salaryRangeAnalysis.missingPackageCount > 0 ? (
                  <>
                    In <span className="font-semibold">{selectedYear}</span>, exactly{' '}
                    <span className="font-bold underline">{salaryRangeAnalysis.missingPackageCount} record(s)</span>{' '}
                    have unverified package values (<code className="bg-amber-100 px-1 py-0.2 rounded text-[10px]">package_lpa IS NULL</code>) 
                    and are excluded from salary range bars.
                  </>
                ) : (
                  <>
                    All records in <span className="font-semibold">{selectedYear}</span> have verified package data.
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch-wise Bar Chart */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Branch-wise Placement</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer>
              <BarChart data={branchData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#4b5563' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Legend />
                <Bar dataKey="Placed" stackId="a" fill="#c51622" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Unplaced" stackId="a" fill="#6b7280" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Package Distribution Pie Chart */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Package Distribution (Current Drives)</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={packageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#c51622"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {packageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Academic Year Statistics Table */}
      <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Year-wise Placement Statistics & Audit</h2>
            <p className="mt-1 text-sm text-gray-500">Calculated from institutional placement history records.</p>
          </div>
          <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium self-start sm:self-auto">
            Total Academic Batches: {yearStats.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Academic Year</th>
                <th className="px-5 py-3 font-semibold">Placed Students (Unique)</th>
                <th className="px-5 py-3 font-semibold">Total Offers</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {yearStats.map(row => (
                <tr 
                  key={row.year} 
                  className={`transition-colors hover:bg-gray-50 ${selectedYear === row.year ? 'bg-red-50/40 font-medium' : ''}`}
                >
                  <td className="px-5 py-3 font-semibold text-gray-900 flex items-center gap-2">
                    {selectedYear === row.year && <span className="w-2 h-2 rounded-full bg-crimson-700"></span>}
                    {row.year}
                  </td>
                  <td className="px-5 py-3 text-gray-700">{row.placed}</td>
                  <td className="px-5 py-3 text-gray-700">{row.offers}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                      Active Batch
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setSelectedYear(row.year)}
                      className={`text-xs px-3 py-1 rounded font-semibold transition ${
                        selectedYear === row.year
                          ? 'bg-crimson-700 text-white'
                          : 'text-crimson-700 hover:bg-red-50'
                      }`}
                    >
                      {selectedYear === row.year ? 'Inspecting' : 'View Salary Graph'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!yearStats.length && <p className="p-8 text-center text-sm text-gray-500">No placement statistics available yet.</p>}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Offer Trend</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <LineChart data={monthlyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="Offers" stroke="#b91c1c" strokeWidth={3} dot={{ r: 4, fill: '#b91c1c' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top companies */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Companies by Offers</h2>
          <div className="space-y-4">
            {topCompanies.map((comp, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-crimson-100 text-crimson-700 flex items-center justify-center font-bold">
                    {comp.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{comp.name}</p>
                    <p className="text-sm text-gray-500">{comp.offers} Offers</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">{formatCurrency(comp.highestPackage)}</p>
                  <p className="text-xs text-gray-500">Highest</p>
                </div>
              </div>
            ))}
            {topCompanies.length === 0 && (
              <p className="text-center text-gray-500 py-4">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Company Wise Full Table */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Company-wise Offers</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm">
                <th className="py-3 px-4 font-medium">Company Name</th>
                <th className="py-3 px-4 font-medium text-center">Total Offers</th>
                <th className="py-3 px-4 font-medium text-right">Avg Package</th>
                <th className="py-3 px-4 font-medium text-right">Highest Package</th>
              </tr>
            </thead>
            <tbody>
              {companyStats.map((comp, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-800">{comp.name}</td>
                  <td className="py-3 px-4 text-center text-gray-700">{comp.offers}</td>
                  <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(comp.avgPackage)}</td>
                  <td className="py-3 px-4 text-right font-medium text-green-600">{formatCurrency(comp.highestPackage)}</td>
                </tr>
              ))}
              {companyStats.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-gray-500">No company statistics available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;