import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { companyApi } from '../api/companyApi';
import { driveApi } from '../api/driveApi';
import { studentApi } from '../api/studentApi';
import { applicationApi } from '../api/applicationApi';
import { notificationApi } from '../api/notificationApi';
import { coordinatorApi } from '../api/coordinatorApi';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();

  const [data, setData] = useState({
    users: [],
    students: [],
    companies: [],
    jobs: [],
    applications: [],
    drives: [],
    interviews: [],
    notifications: [],
    placementHistory: [],
    eligibilityCriteria: []
  });

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const mapCompany = c => ({
    id: c.company_id,
    company_id: c.company_id,
    name: c.name,
    contactEmail: c.email || '',
    rolesOffered: c.roles_offered || '',
    industry: c.type || 'Company',
    type: c.type || 'Company',
    website: '',
    headquarters: '',
    contactPerson: '',
    hasMOU: false,
    previousVisits: 0
  });

  const mapDrive = d => {
    const branches = (d.criteria?.allowed_branch || '')
      .split(',')
      .map(b => b.trim())
      .filter(Boolean);

    const salLpa = Number(d.sal_lpa) || 0;

    return {
      id: d.drive_id,
      driveId: d.drive_id,
      drive_id: d.drive_id,
      companyId: d.company_id,
      company_id: d.company_id,
      companyName: d.company_name || d.company_id,
      company: d.company_name || d.company_id,
      name: d.name,
      title: d.role_for || d.name,
      role: d.role_for || d.name,
      package: Math.round(salLpa * 100000),
      salLpa: salLpa,
      type: d.is_internship ? 'Internship' : 'Full Time',
      isInternship: Boolean(d.is_internship),
      minCGPA: d.criteria ? Number(d.criteria.min_cgpa) : 0,
      maxBacklogs: d.criteria ? Number(d.criteria.max_backlog) : 0,
      semester: d.criteria ? Number(d.criteria.sem) : 7,
      min_sslc: d.criteria ? Number(d.criteria.min_sslc ?? 0) : 0,
      min_puc: d.criteria ? Number(d.criteria.min_puc ?? 0) : 0,
      minSslc: d.criteria ? Number(d.criteria.min_sslc ?? 0) : 0,
      minPuc: d.criteria ? Number(d.criteria.min_puc ?? 0) : 0,
      branches,
      eligibleBranches: branches,
      requirements: {
        minCGPA: d.criteria ? Number(d.criteria.min_cgpa) : 0,
        minCgpa: d.criteria ? Number(d.criteria.min_cgpa) : 0,
        maxBacklogs: d.criteria ? Number(d.criteria.max_backlog) : 0,
        eligibleBranches: branches,
        branches,
        min_sslc: d.criteria ? Number(d.criteria.min_sslc ?? 0) : 0,
        min_puc: d.criteria ? Number(d.criteria.min_puc ?? 0) : 0,
        minSslc: d.criteria ? Number(d.criteria.min_sslc ?? 0) : 0,
        minPuc: d.criteria ? Number(d.criteria.min_puc ?? 0) : 0,
        otherCriteria: d.criteria?.other || '',
        other: d.criteria?.other || ''
      },
      otherCriteria: d.criteria?.other || '',
      description: d.criteria?.other || d.role_for || d.name,
      deadline: d.application_deadline || d.deadline || '',
      application_deadline: d.application_deadline || d.deadline || '',
      arrivalDate: d.arrival_date || d.arrivalDate || '',
      status: d.status || 'Active'
    };
  };

  const mapStudent = s => {
    const fullName = [s.fname, s.mname, s.lname].filter(Boolean).join(' ') || s.usn;
    return {
      id: s.usn,
      studentId: s.usn,
      userId: s.usn,
      usn: s.usn,
      rollNo: s.roll_no,
      name: fullName,
      dob: s.dob || null,
      email: s.email,
      phone: s.phone,
      resume: s.resume,
      resumeUploaded: Boolean(s.resume),
      branch: s.branch,
      semester: Number(s.sem) || 0,
      cgpa: Number(s.cgpa) || 0,
      backlogs: Number(s.active_backlog) || 0,
      sslcPercentage: Number(s.sslc_percentage) || 0,
      pucPercentage: Number(s.puc_percentage) || 0,
      sslc_percentage: Number(s.sslc_percentage) || 0,
      puc_percentage: Number(s.puc_percentage) || 0,
      placementStatus: s.status === 'Placed' ? 'Placed' : 'Unplaced',
      status: s.status,
      isEligible: Boolean(s.is_elg),
      degree: 'B.E.',
      skills: []
    };
  };

  const mapApplication = a => ({
    id: a.app_id,
    app_id: a.app_id,
    studentId: a.usn,
    usn: a.usn,
    studentName: a.student_name || a.usn,
    rollNo: a.roll_no,
    branch: a.branch,
    semester: a.semester,
    cgpa: a.cgpa,
    activeBacklogs: a.active_backlog,
    email: a.email,
    phone: a.phone,
    dob: a.dob,
    sslcPercentage: a.sslc_percentage,
    pucPercentage: a.puc_percentage,
    resume: a.resume || a.application_resume || null,
    applicationResume: a.application_resume || a.resume || null,
    studentResume: a.student_resume || null,
    jobId: a.drive_id,
    driveId: a.drive_id,
    driveName: a.drive_name || a.drive_id,
    companyId: a.company_id,
    companyName: a.company_name || 'Company',
    jobTitle: a.role || a.drive_name || 'Placement Opportunity',
    title: a.role || a.drive_name || 'Placement Opportunity',
    role: a.role,
    salLpa: a.sal_lpa,
    packageOffered: Math.round(Number(a.sal_lpa || 0) * 100000),
    isInternship: Boolean(a.is_internship),
    status: a.status,
    eligibilityStatus: a.elg_status || 'Eligible',
    appliedDate: a.date,
    lastUpdated: a.status_date,
    statusChangedBy: a.status_changed_by,
    registrationVerified: true
  });

  const mapNotification = n => ({
    id: n.n_id,
    applicationId: n.aid,
    userId: n.usn,
    title: n.title,
    message: n.message,
    read: String(n.read_status).toLowerCase() === 'read',
    createdAt: n.sent_at,
    type: 'info'
  });

  const mapPlacement = p => {
    const rawPkg = p.package_lpa !== undefined ? p.package_lpa : (p.packageLpa !== undefined ? p.packageLpa : null);
    const validPkg = rawPkg !== null && rawPkg !== undefined && rawPkg !== '' && !isNaN(Number(rawPkg))
      ? Number(Number(rawPkg).toFixed(2))
      : null;

    return {
      id: p.placement_id || p.plac_id,
      placementId: p.placement_id || p.plac_id,
      placId: p.placement_id || p.plac_id,
      studentId: p.usn,
      usn: p.usn,
      studentName: p.student_name,
      branch: p.branch || 'N/A',
      cgpa: p.cgpa || 0,
      companyId: p.company_id,
      companyName: p.company_name || p.company_id,
      academicYear: p.academic_year || '—',
      role: p.role || 'Placed Role',
      packageLpa: validPkg,
      package: validPkg !== null ? Math.round(validPkg * 100000) : null
    };
  };

  const refreshData = useCallback(async () => {
    try {
      setLoadError('');

      // Fetch common data (companies and placement drives)
      const [rawCompanies, rawDrives] = await Promise.all([
        companyApi.getCompanies().catch(() => []),
        driveApi.getDrives().catch(() => [])
      ]);

      const companies = (rawCompanies || []).map(mapCompany);
      const drives = (rawDrives || []).map(mapDrive);

      let students = [];
      let applications = [];
      let notifications = [];
      let placementHistory = [];

      if (isAuthenticated && currentUser) {
        if (currentUser.role === 'student') {
          // Student role data
          const [myProfile, myApps, myNotifs] = await Promise.all([
            studentApi.getProfile().catch(() => null),
            applicationApi.getMyApplications().catch(() => []),
            notificationApi.getMyNotifications().catch(() => [])
          ]);

          if (myProfile) {
            students = [mapStudent(myProfile)];
          }
          applications = (myApps || []).map(mapApplication);
          notifications = (myNotifs || []).map(mapNotification);

        } else if (currentUser.role === 'officer') {
          // Officer role data
          const [allStudents, allApps, allPlacements] = await Promise.all([
            studentApi.getAllStudents().catch(() => []),
            applicationApi.getAllApplications().catch(() => []),
            coordinatorApi.getPlacements().catch(() => [])
          ]);

          students = (allStudents || []).map(mapStudent);
          applications = (allApps || []).map(mapApplication);
          placementHistory = (allPlacements || []).map(mapPlacement);

        } else if (currentUser.role === 'coordinator') {
          // Coordinator role data
          const [allStudents, allApps, allPlacements] = await Promise.all([
            studentApi.getAllStudents().catch(() => []),
            applicationApi.getAllApplications().catch(() => []),
            coordinatorApi.getPlacements().catch(() => [])
          ]);

          students = (allStudents || []).map(mapStudent);
          applications = (allApps || []).map(mapApplication);
          placementHistory = (allPlacements || []).map(mapPlacement);
        }
      }

      setData({
        users: [],
        students,
        companies,
        jobs: drives,
        drives,
        applications,
        interviews: [],
        notifications,
        placementHistory,
        eligibilityCriteria: []
      });

    } catch (err) {
      console.error('Failed to load placement data from backend:', err);
      setLoadError(err.message || 'Unable to retrieve placement data from the backend.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, isAuthenticated]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Mutation functions backed by real API calls
  const addCompany = async item => {
    try {
      const created = await companyApi.createCompany({
        name: item.name,
        email: item.contactEmail || item.email,
        roles_offered: item.rolesOffered || item.roles_offered,
        type: item.type || item.industry
      });
      await refreshData();
      return created;
    } catch (err) {
      alert(`Failed to add company: ${err.message}`);
      throw err;
    }
  };

  const updateCompany = async (id, updates) => {
    try {
      const updated = await companyApi.updateCompany(id, {
        name: updates.name,
        email: updates.contactEmail || updates.email,
        roles_offered: updates.rolesOffered || updates.roles_offered,
        type: updates.type || updates.industry
      });
      await refreshData();
      return updated;
    } catch (err) {
      alert(`Failed to update company: ${err.message}`);
      throw err;
    }
  };

  const deleteCompany = async id => {
    try {
      await companyApi.deleteCompany(id);
      await refreshData();
    } catch (err) {
      alert(`Failed to delete company: ${err.message}`);
      throw err;
    }
  };

  const addJob = async item => {
    try {
      const created = await driveApi.createDrive({
        company_id: item.companyId || item.company_id,
        name: item.title || item.name,
        sal_lpa: item.packageLpa !== undefined ? Number(item.packageLpa) : (Number(item.package || 0) / 100000),
        role_for: item.title || item.role,
        is_internship: Boolean(item.isInternship || item.type === 'Internship'),
        status: item.status || 'Active',
        application_deadline: item.deadline || item.application_deadline || null,
        arrival_date: item.arrivalDate || item.arrival_date || null,
        criteria: {
          min_cgpa: Number(item.minCGPA || 0),
          max_backlog: Number(item.maxBacklogs || 0),
          allowed_branch: item.branches || item.eligibleBranches,
          sem: item.semester || 7,
          min_sslc: Number(item.min_sslc ?? item.minSslc ?? 60),
          min_puc: Number(item.min_puc ?? item.minPuc ?? 60)
        }
      });
      await refreshData();
      return created;
    } catch (err) {
      alert(`Failed to publish placement opportunity: ${err.message}`);
      throw err;
    }
  };

  const updateJob = async (id, updates) => {
    try {
      const updated = await driveApi.updateDrive(id, {
        name: updates.title || updates.name,
        sal_lpa: updates.packageLpa !== undefined ? Number(updates.packageLpa) : (updates.package ? Number(updates.package) / 100000 : undefined),
        role_for: updates.title || updates.role,
        is_internship: updates.isInternship !== undefined ? Boolean(updates.isInternship) : undefined,
        status: updates.status,
        application_deadline: updates.deadline !== undefined ? updates.deadline : updates.application_deadline,
        arrival_date: updates.arrivalDate !== undefined ? updates.arrivalDate : updates.arrival_date,
        criteria: {
          min_cgpa: updates.minCGPA !== undefined ? Number(updates.minCGPA) : undefined,
          max_backlog: updates.maxBacklogs !== undefined ? Number(updates.maxBacklogs) : undefined,
          allowed_branch: updates.branches || updates.eligibleBranches,
          sem: updates.semester,
          min_sslc: (updates.min_sslc !== undefined || updates.minSslc !== undefined) ? Number(updates.min_sslc ?? updates.minSslc) : undefined,
          min_puc: (updates.min_puc !== undefined || updates.minPuc !== undefined) ? Number(updates.min_puc ?? updates.minPuc) : undefined
        }
      });
      await refreshData();
      return updated;
    } catch (err) {
      alert(`Failed to update placement opportunity: ${err.message}`);
      throw err;
    }
  };

  const deleteJob = async id => {
    try {
      await driveApi.deleteDrive(id);
      await refreshData();
    } catch (err) {
      alert(`Failed to remove placement opportunity: ${err.message}`);
      throw err;
    }
  };

  const addApplication = async item => {
    try {
      const driveId = item.jobId || item.driveId || item.drive_id;
      const resume = item.resume || item.registrationDetails?.resume || null;
      const created = await applicationApi.apply(driveId, resume);
      await refreshData();
      return Boolean(created);
    } catch (err) {
      alert(`Application failed: ${err.message}`);
      return false;
    }
  };

  const updateApplication = async (id, updates) => {
    try {
      const updated = await applicationApi.updateStatus(id, updates.status);
      await refreshData();
      return updated;
    } catch (err) {
      alert(`Failed to update application status: ${err.message}`);
      throw err;
    }
  };

  const markNotificationRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      setData(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n)
      }));
    } catch (err) {
      console.warn('Failed to mark notification read:', err.message);
    }
  };

  const addNotifications = async items => {
    try {
      if (!items || !items.length) return;
      const sample = items[0];
      await notificationApi.broadcastNotice({
        title: sample.title,
        message: sample.message,
        audience: sample.audience || 'eligible',
        driveId: sample.driveId || sample.jobId
      });
      await refreshData();
    } catch (err) {
      console.warn('Failed to broadcast notifications:', err.message);
    }
  };

  const updatePlacementPackage = async (placId, packageLpa) => {
    try {
      const res = await coordinatorApi.updatePlacementPackage(placId, packageLpa);
      await refreshData();
      return res;
    } catch (err) {
      console.error('Failed to update placement package:', err);
      throw err;
    }
  };

  const value = {
    data,
    refreshData,
    loading,

    // students
    students: data.students,
    getStudents: () => data.students,
    getStudentById: id => data.students.find(s => s.id === id || s.usn === id),
    updateStudent: () => {},

    // companies
    companies: data.companies,
    getCompanies: () => data.companies,
    getCompanyById: id => data.companies.find(c => c.id === id),
    addCompany,
    updateCompany,
    deleteCompany,

    // jobs / drives
    jobs: data.jobs,
    getJobs: () => data.jobs,
    getJobById: id => data.jobs.find(j => j.id === id),
    addJob,
    updateJob,
    deleteJob,

    drives: data.drives,
    getDrives: () => data.drives,
    getDriveById: id => data.drives.find(d => d.id === id),
    addDrive: addJob,
    updateDrive: updateJob,
    deleteDrive: deleteJob,

    // applications
    applications: data.applications,
    getApplications: () => data.applications,
    getApplicationById: id => data.applications.find(a => a.id === id),
    getApplicationsByStudent: studentId => data.applications.filter(a => a.studentId === studentId),
    getApplicationsByJob: jobId => data.applications.filter(a => a.jobId === jobId),
    addApplication,
    updateApplication,

    // notifications & history
    notifications: data.notifications,
    placementHistory: data.placementHistory,
    eligibilityCriteria: data.eligibilityCriteria,
    getNotifications: () => data.notifications,
    markNotificationRead,
    addNotification: () => {},
    addNotifications,
    setPlacementHistory: () => {},
    setNotifications: () => {},
    updatePlacementPackage
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-gray-50 text-sm font-medium text-gray-500">
        Connecting to university placement database…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="m-8 rounded-xl border border-red-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-red-900">Database Connection Error</h2>
        <p className="mt-2 text-sm text-red-700">{loadError}</p>
        <button
          onClick={() => { setLoading(true); refreshData(); }}
          className="mt-4 rounded-lg bg-red-800 px-4 py-2 text-sm font-semibold text-white hover:bg-red-900"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
