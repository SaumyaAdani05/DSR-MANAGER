import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Header from '../components/layout/Header';
import SideDrawer from '../components/layout/SideDrawer';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import NozzleManager from '../components/settings/NozzleManager';
import EmployeeManager from '../components/settings/EmployeeManager';
import ChangePassword from '../components/settings/ChangePassword';
import SecurityQuestion from '../components/settings/SecurityQuestion';

import { updateStationName } from '../services/settingsService';
import { getOwnerData } from '../services/authService';

const SettingsPage = () => {
  const { logout } = useAuth();
  const { stationName, setStationName, nozzles, employees, refreshNozzles, refreshEmployees, allNozzles, allEmployees } = useSettings();
  const navigate = useNavigate();

  const [editName, setEditName] = useState(stationName);
  const [savingName, setSavingName] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ownerData, setOwnerData] = useState(null);

  useEffect(() => {
    setEditName(stationName);
  }, [stationName]);

  useEffect(() => {
    const loadOwner = async () => {
      try {
        const data = await getOwnerData();
        setOwnerData(data);
      } catch (err) {
        console.error('Failed to load owner data', err);
      }
    };
    loadOwner();
  }, []);

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    setSavingName(true);
    try {
      await updateStationName(editName.trim());
      setStationName(editName.trim());
      toast.success('Station name updated');
    } catch (error) {
      toast.error('Failed to update station name');
    } finally {
      setSavingName(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-adani-lightGray">
      <Header stationName={stationName} onMenuClick={() => setDrawerOpen(true)} />
      <SideDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLogout={handleLogout}
      />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-adani-navy">Settings</h1>
          <Button variant="ghost" onClick={() => navigate('/')}>← Back to Dashboard</Button>
        </div>

        {/* Station Name */}
        <section className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-sm font-semibold text-adani-navy mb-3">Station Name</h2>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter station name"
              />
            </div>
            <Button onClick={handleSaveName} loading={savingName} disabled={editName === stationName}>
              Save
            </Button>
          </div>
        </section>

        {/* Nozzle Management */}
        <section className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-sm font-semibold text-adani-navy mb-3">Nozzle Management</h2>
          <NozzleManager nozzles={allNozzles || nozzles} onNozzleChange={refreshNozzles} />
        </section>

        {/* Employee Management */}
        <section className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-sm font-semibold text-adani-navy mb-3">Employee Management</h2>
          <EmployeeManager employees={allEmployees || employees} onEmployeeChange={refreshEmployees} />
        </section>



        {/* Change Password */}
        <section className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-sm font-semibold text-adani-navy mb-3">Change Password</h2>
          <ChangePassword />
        </section>

        {/* Security Question */}
        <section className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-sm font-semibold text-adani-navy mb-3">Security Question</h2>
          <SecurityQuestion currentQuestion={ownerData?.securityQuestion} />
        </section>

        {/* Account Info */}
        <section className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-sm font-semibold text-adani-navy mb-3">Account Info</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-adani-gray">Username:</span>
            <span className="text-sm font-semibold text-gray-800">{ownerData?.username || '—'}</span>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SettingsPage;
