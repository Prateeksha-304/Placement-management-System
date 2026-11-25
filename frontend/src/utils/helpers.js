import { APPLICATION_STATUS } from './constants';

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const isDeadlinePassed = (dateValue) => {
  if (!dateValue) return false;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(String(dateValue));
  const deadline = new Date(dateOnly ? `${dateValue}T23:59:59` : dateValue);
  return !Number.isNaN(deadline.getTime()) && deadline.getTime() < Date.now();
};

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const getStatusColor = (status) => {
  switch (status) {
    case APPLICATION_STATUS.APPLIED:
      return 'bg-blue-100 text-blue-800';
    case APPLICATION_STATUS.SELECTED:
      return 'bg-emerald-100 text-emerald-800';
    case APPLICATION_STATUS.REJECTED:
      return 'bg-red-100 text-red-800';
    case APPLICATION_STATUS.WITHDRAWN:
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const checkEligibility = (student, job) => {
  if (!student || !job) return false;

  const criteria = job.requirements || job;
  const minCgpa = criteria.minCGPA ?? criteria.minCgpa ?? 0;
  const maxBacklogs = criteria.maxBacklogs ?? 0;
  const eligibleBranches = criteria.eligibleBranches || criteria.branches || [];
  const hasMinCgpa = Number(student.cgpa) >= Number(minCgpa);
  const inEligibleBranch = eligibleBranches.length === 0 || eligibleBranches.includes(student.branch);
  const underMaxBacklogs = Number(student.backlogs || 0) <= Number(maxBacklogs);

  if (!hasMinCgpa || !inEligibleBranch || !underMaxBacklogs) {
    return false;
  }

  // Check 10th (SSLC) and 12th (PUC) percentage requirement if specified
  const minSslc = criteria.min_sslc ?? criteria.minSslc ?? 0;
  const minPuc = criteria.min_puc ?? criteria.minPuc ?? 0;
  const sslc = Number(student.sslcPercentage ?? student.sslc_percentage ?? 0);
  const puc = Number(student.pucPercentage ?? student.puc_percentage ?? 0);

  if (Number(minSslc) > 0 && sslc < Number(minSslc)) {
    return false;
  }
  if (Number(minPuc) > 0 && puc < Number(minPuc)) {
    return false;
  }

  const otherText = String(criteria.otherCriteria || criteria.other || criteria.description || '');
  if (otherText) {
    const jointMatch = otherText.match(/10th\/12th\s*>=\s*(\d+(?:\.\d+)?)\s*%/i);
    if (jointMatch) {
      const required = parseFloat(jointMatch[1]);
      if (sslc < required || puc < required) {
        return false;
      }
    }

    const tenthMatch = otherText.match(/10th\s*>=\s*(\d+(?:\.\d+)?)\s*%/i);
    if (tenthMatch) {
      const requiredTenth = parseFloat(tenthMatch[1]);
      if (sslc < requiredTenth) {
        return false;
      }
    }

    const twelfthMatch = otherText.match(/12th(?:\/Diploma)?\s*>=\s*(\d+(?:\.\d+)?)\s*%/i);
    if (twelfthMatch) {
      const requiredTwelfth = parseFloat(twelfthMatch[1]);
      if (puc < requiredTwelfth) {
        return false;
      }
    }
  }

  return true;
};

export const generateId = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

export const getInitials = (name) => {
  if (!name) return '';
  const parts = name.split(' ');
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const filterBySearch = (items, searchTerm, keys) => {
  if (!searchTerm) return items;
  const lowerSearch = searchTerm.toLowerCase();
  
  return items.filter((item) => {
    return keys.some((key) => {
      const value = item[key];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(lowerSearch);
      }
      return false;
    });
  });
};

export const sortByField = (items, field, order = 'asc') => {
  return [...items].sort((a, b) => {
    const valueA = a[field];
    const valueB = b[field];
    
    if (valueA < valueB) return order === 'asc' ? -1 : 1;
    if (valueA > valueB) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

export const calculatePlacementStats = (students, applications, jobs = []) => {
  const totalStudents = students.length;
  const selectedApps = applications.filter((a) => a.status === APPLICATION_STATUS.SELECTED);
  const placedStudentIds = new Set([
    ...students.filter(student => student.placementStatus === 'Placed').map(student => student.id),
    ...selectedApps.map(application => application.studentId)
  ]);
  const placedStudents = placedStudentIds.size;
  const placementPercentage = totalStudents > 0 ? (placedStudents / totalStudents) * 100 : 0;
  const totalOffers = selectedApps.length;
  const packages = selectedApps.map(application => Number(application.packageOffered || jobs.find(job => job.id === application.jobId)?.package || 0)).filter(Boolean);
  const avgPackage = packages.length ? packages.reduce((sum, amount) => sum + amount, 0) / packages.length : 0;
  const highestPackage = packages.length ? Math.max(...packages) : 0;
  return {
    totalStudents,
    placedStudents,
    placementPercentage: placementPercentage.toFixed(1),
    avgPackage,
    highestPackage,
    totalOffers
  };
};
