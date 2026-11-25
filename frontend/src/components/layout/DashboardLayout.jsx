import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const DashboardLayout = () => {
  return (
    <div className="flex h-screen bg-[#f8f9fa] overflow-hidden">
      <div className="flex-1 flex flex-col relative min-h-screen">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
