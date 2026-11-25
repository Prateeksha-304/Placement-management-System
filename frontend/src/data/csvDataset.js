// CSV files under public/data are the sole source of placement records.
const parseCsv = text => {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"' && quoted && text[i + 1] === '"') { cell += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell); if (row.some(value => value !== '')) rows.push(row);
      row = []; cell = '';
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const headers = (rows.shift() || []).map(value => value.replace(/^\uFEFF/, '').trim());
  return rows.map(values => Object.fromEntries(headers.map((header, index) => [header, (values[index] || '').trim()])));
};

const getCsv = async name => {
  const response = await fetch(`/data/${name}.csv`);
  if (!response.ok) throw new Error(`Could not load /data/${name}.csv`);
  return parseCsv(await response.text());
};
const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const truth = value => String(value).toLowerCase() === 'true' || value === '1';

export async function loadCsvDataset() {
  const [studentRows, companyRows, driveRows, eligibilityRows, applicationRows, notificationRows, historyRows] = await Promise.all([
    getCsv('students'), getCsv('company'), getCsv('placement_drives'), getCsv('eligibility_criteria'),
    getCsv('application'), getCsv('notification'), getCsv('placement_history')
  ]);
  const companies = companyRows.map(row => ({
    id: row.company_id, name: row.name, contactEmail: row.email, rolesOffered: row.roles_offered,
    industry: row.type, website: '', headquarters: '', contactPerson: '', hasMOU: false, previousVisits: 0
  }));
  const criteriaByDrive = Object.fromEntries(eligibilityRows.map(row => [row.drive_id, row]));
  const companyById = Object.fromEntries(companies.map(row => [row.id, row]));
  const drives = driveRows.map(row => {
    const company = companyById[row.company_id] || {};
    const criteria = criteriaByDrive[row.drive_id] || {};
    const branches = (criteria.allowed_branch || '').split(',').map(value => value.trim()).filter(Boolean);
    return {
      id: row.drive_id, driveId: row.drive_id, companyId: row.company_id,
      companyName: company.name || row.company_id, company: company.name || row.company_id,
      name: row.name, title: row.role_for || row.name, role: row.role_for,
      package: Math.round(number(row.sal_lpa) * 100000), salLpa: number(row.sal_lpa),
      type: truth(row.is_internship) ? 'Internship' : 'Full Time',
      isInternship: truth(row.is_internship), minCGPA: number(criteria.min_cgpa),
      maxBacklogs: number(criteria.max_backlog), semester: number(criteria.sem),
      branches, eligibleBranches: branches, otherCriteria: criteria.other || '',
      description: criteria.other || row.role_for || row.name, deadline: '', status: 'Active'
    };
  });
  const driveById = Object.fromEntries(drives.map(row => [row.id, row]));
  const historyByUsn = new Map();
  historyRows.forEach(row => {
    const items = historyByUsn.get(row.usn) || [];
    items.push(row); historyByUsn.set(row.usn, items);
  });
  const students = studentRows.map(row => {
    const name = [row.fname, row.mname, row.lname].filter(Boolean).join(' ');
    const placements = historyByUsn.get(row.usn) || [];
    return {
      id: row.usn, userId: row.usn, usn: row.usn, rollNo: row.roll_no, name,
      email: row.email, phone: row.phone, resume: row.resume,
      resumeUploaded: Boolean(row.resume), branch: row.branch, semester: number(row.sem),
      cgpa: number(row.cgpa), backlogs: number(row.active_backlog),
      placementStatus: placements.length || row.status === 'Placed' ? 'Placed' : 'Unplaced',
      status: row.status, isEligible: truth(row.is_elg), placements,
      batch: placements[0]?.academic_year || '',
      degree: 'B.E.', skills: []
    };
  });
  const studentByUsn = Object.fromEntries(students.map(row => [row.usn, row]));
  const applications = applicationRows.map(row => {
    const drive = driveById[row.drive_id] || {};
    const student = studentByUsn[row.usn] || {};
    return {
      id: row.app_id, studentId: row.usn, usn: row.usn,
      studentName: student.name || row.usn, jobId: row.drive_id, driveId: row.drive_id,
      companyId: drive.companyId, companyName: drive.companyName,
      jobTitle: drive.title, title: drive.title, packageOffered: drive.package,
      status: row.status === 'Shortlisted_Not_Selected' ? 'Rejected' : row.status,
      eligibilityStatus: row.elg_status,
      appliedDate: row.date, lastUpdated: row.status_date,
      statusChangedBy: row.status_changed_by, registrationVerified: false
    };
  });
  const notifications = notificationRows.map(row => ({
    id: row.n_id, applicationId: row.aid, userId: row.usn,
    title: row.title, message: row.message,
    read: String(row.read_status).toLowerCase() === 'read',
    createdAt: row.sent_at, type: 'info'
  }));
  const placementHistory = historyRows.map(row => ({
    id: row.plac_id, studentId: row.usn, usn: row.usn,
    companyId: row.company_id, companyName: companyById[row.company_id]?.name || row.company_id,
    academicYear: row.academic_year, role: row.roles
  }));
  return { students, companies, jobs: drives, drives, applications, notifications, placementHistory, eligibilityCriteria: eligibilityRows };
}
