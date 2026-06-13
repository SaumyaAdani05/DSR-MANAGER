import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import Header from '../components/layout/Header';
import SideDrawer from '../components/layout/SideDrawer';
import ShiftTabs from '../components/shift/ShiftTabs';
import ShiftGrid from '../components/shift/ShiftGrid';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { getShift } from '../services/shiftService';
import { isEditable } from '../utils/dateUtils';
import { formatDisplayDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

const HistoryPage = () => {
  const { date } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { stationName, allNozzles, nozzles, allEmployees, employees } = useSettings();

  const [activeShift, setActiveShift] = useState(1);
  const [shiftData, setShiftData] = useState({ shift1: null, shift2: null, shift3: null });
  const [shiftStatuses, setShiftStatuses] = useState([{}, {}, {}]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      const data = {};
      const statuses = [];
      let lastSaved = 1;

      for (let i = 1; i <= 3; i++) {
        const s = await getShift(date, i);
        data[`shift${i}`] = s;
        statuses.push({
          isSaved: s?.isSaved || false,
          isLocked: s?.isSaved && !isEditable(s),
        });
        if (s?.isSaved) lastSaved = i;
      }

      setShiftData(data);
      setShiftStatuses(statuses);
      setActiveShift(lastSaved);
      setLoading(false);
    };
    loadAll();
  }, [date]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-adani-lightGray">
      <Header stationName={stationName} onMenuClick={() => setDrawerOpen(true)} />
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} onLogout={handleLogout} />

      <main className="max-w-[1320px] mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/')}>← Dashboard</Button>
            <h1 className="text-lg font-bold text-adani-navy">
              History — {formatDisplayDate(date)}
            </h1>
            <Badge text="Read-Only" variant="info" />
          </div>
        </div>

        <ShiftTabs
          activeShift={activeShift}
          onShiftChange={setActiveShift}
          shiftStatuses={shiftStatuses}
        />

        {loading ? (
          <div className="flex items-center justify-center py-20 bg-white rounded-b-lg shadow-card">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-adani-navy" />
          </div>
        ) : shiftData[`shift${activeShift}`] ? (
          <ShiftGrid
            date={date}
            shiftNumber={activeShift}
            shiftData={shiftData[`shift${activeShift}`]}
            nozzles={allNozzles || nozzles}
            employees={allEmployees || employees}
            onSave={() => {}}
            readOnly={true}
          />
        ) : (
          <div className="flex items-center justify-center py-20 bg-white rounded-b-lg shadow-card">
            <p className="text-adani-gray">No records found for Shift {activeShift} on this date.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default HistoryPage;
