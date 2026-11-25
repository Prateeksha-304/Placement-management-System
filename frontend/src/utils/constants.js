export const ROLES = {
  STUDENT: 'student',
  OFFICER: 'officer',
  COORDINATOR: 'coordinator'
};

export const APPLICATION_STATUS = {
  APPLIED: 'Applied',
  SELECTED: 'Selected',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn'
};

export const BRANCHES = [
  'CSE',
  'CSE(AI)',
  'ECE',
  'EE(VD&T)',
  'EEE',
  'Mech'
];

export const DEGREE_TYPES = [
  'B.E.',
  'M.Tech',
  'MCA',
  'MBA'
];

export const JOB_TYPES = [
  'Full Time',
  'Internship',
  'PPO'
];

export const PLACEMENT_STATUS = {
  UNPLACED: 'Unplaced',
  PLACED: 'Placed',
  OPT_OUT: 'Opted Out'
};

export const NAV_ITEMS = {
  student: [
    { label: 'Dashboard', path: '/student', icon: 'LayoutDashboard' },
    { label: 'Eligible Companies', path: '/student/jobs', icon: 'Briefcase' },
    { label: 'Notifications', path: '/student/notifications', icon: 'BellRing' },
    { label: 'Profile', path: '/student/profile', icon: 'User' }
  ],
  officer: [
    { label: 'Companies', path: '/officer/companies', icon: 'Building2' },
    { label: 'Placement Opportunities', path: '/officer/drives', icon: 'Target' },
    { label: 'Eligibility', path: '/officer/eligibility', icon: 'ListFilter' },
    { label: 'Applications & Results', path: '/officer/results', icon: 'Award' },
    { label: 'Notices', path: '/officer/notices', icon: 'BellRing' }
  ],
  coordinator: [
    { label: 'Placement Overview', path: '/coordinator', icon: 'LayoutDashboard' },
    { label: 'Placement Records', path: '/coordinator/records', icon: 'FileText' }
  ]
};

