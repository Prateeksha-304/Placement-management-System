import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const StudentProfile = lazy(() => import('./pages/student/StudentProfile'));
const EligibleJobs = lazy(() => import('./pages/student/EligibleJobs'));
const MyApplications = lazy(() => import('./pages/student/MyApplications'));
const StudentNotifications = lazy(() => import('./pages/student/StudentNotifications'));
const ManageCompanies = lazy(() => import('./pages/tpo/ManageCompanies'));
const PlacementOpportunityManager = lazy(() => import('./pages/tpo/PlacementOpportunityManager'));
const EligibilityManager = lazy(() => import('./pages/tpo/EligibilityManager'));
const Results = lazy(() => import('./pages/tpo/Results'));
const ApplicationReview = lazy(() => import('./pages/tpo/ApplicationReview'));
const Analytics = lazy(() => import('./pages/tpo/Analytics'));
const PlacementNotices = lazy(() => import('./pages/tpo/PlacementNotices'));

function App() {
  return <BrowserRouter><AuthProvider><DataProvider><Suspense fallback={<div className="grid min-h-screen place-items-center text-sm text-gray-500">Loading placement workspace…</div>}><Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route element={<ProtectedRoute allowedRoles={['student']} />}><Route element={<DashboardLayout />}>
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="/student/profile" element={<StudentProfile />} />
      <Route path="/student/jobs" element={<EligibleJobs />} />
      <Route path="/student/notifications" element={<StudentNotifications />} />
      <Route path="/student/applications" element={<MyApplications />} />
    </Route></Route>
    <Route element={<ProtectedRoute allowedRoles={['officer']} />}><Route element={<DashboardLayout />}>
      <Route path="/officer" element={<Navigate to="/officer/companies" replace />} />
      <Route path="/officer/companies" element={<ManageCompanies />} />
      <Route path="/officer/drives" element={<PlacementOpportunityManager />} />
      <Route path="/officer/eligibility" element={<EligibilityManager />} />
      <Route path="/officer/results" element={<ApplicationReview />} />
      <Route path="/officer/records" element={<Results />} />
      <Route path="/officer/notices" element={<PlacementNotices />} />
    </Route></Route>
    <Route element={<ProtectedRoute allowedRoles={['coordinator', 'officer']} />}><Route element={<DashboardLayout />}>
      <Route path="/coordinator" element={<Analytics />} />
      <Route path="/coordinator/records" element={<Results />} />
    </Route></Route>
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes></Suspense></DataProvider></AuthProvider></BrowserRouter>;
}

export default App;
