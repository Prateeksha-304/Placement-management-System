import React, { useState, useEffect } from 'react';
import { useData } from '../../hooks/useData';
import { Save, AlertTriangle } from 'lucide-react';

const SystemSettings = () => {
  const { setUsers, resetData } = useData();
  
  const [settings, setSettings] = useState({
    academicYear: '2023-2024',
    placementSeason: '2024',
    maxOffers: 2,
    allowMultiple: true,
    minCgpaRegistration: 6.0,
    emailNotifications: true,
    smsNotifications: false
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem('pms_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('pms_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleResetData = () => {
    if (window.confirm('WARNING: This will reset all system data to initial mock state. Are you absolutely sure?')) {
      resetData();
      alert('System data has been reset to defaults.');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-500">Configure global system parameters</p>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Save size={18} /> {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Academic Settings</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Academic Year</label>
            <input type="text" name="academicYear" value={settings.academicYear} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Placement Season</label>
            <input type="text" name="placementSeason" value={settings.placementSeason} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 outline-none focus:border-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Placement Policy</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Offers Per Student</label>
            <input type="number" name="maxOffers" value={settings.maxOffers} onChange={handleChange} min="1" className="w-full rounded-md border border-gray-300 p-2 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum CGPA for Registration</label>
            <input type="number" name="minCgpaRegistration" value={settings.minCgpaRegistration} onChange={handleChange} step="0.1" min="0" max="10" className="w-full rounded-md border border-gray-300 p-2 outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" name="allowMultiple" checked={settings.allowMultiple} onChange={handleChange} className="rounded text-blue-600 w-4 h-4" />
            <label className="text-sm font-medium text-gray-700">Allow Multiple Offer Selection</label>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Notifications</h2>
          
          <div className="flex items-center gap-2">
            <input type="checkbox" name="emailNotifications" checked={settings.emailNotifications} onChange={handleChange} className="rounded text-blue-600 w-4 h-4" />
            <label className="text-sm font-medium text-gray-700">Enable Email Notifications</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="smsNotifications" checked={settings.smsNotifications} onChange={handleChange} className="rounded text-blue-600 w-4 h-4" />
            <label className="text-sm font-medium text-gray-700">Enable SMS Notifications</label>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200 bg-red-50 space-y-4">
          <h2 className="text-lg font-semibold text-red-800 border-b border-red-200 pb-2 flex items-center gap-2">
            <AlertTriangle size={18} /> Danger Zone
          </h2>
          <p className="text-sm text-red-600">Resetting data will remove all users, applications, and jobs except initial mock data.</p>
          <button onClick={handleResetData} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 w-full font-medium">
            Reset All System Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
