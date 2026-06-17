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
import { isEditable, getPreviousDateStr } from '../utils/dateUtils';
import { formatDisplayDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';

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
  const [carryoverData, setCarryoverData] = useState(null);

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

  // Compute carryover data for HistoryPage
  useEffect(() => {
    const checkCarryover = async () => {
      let carryover = null;
      if (activeShift === 1) {
        const prevDate = getPreviousDateStr(date);
        const prevShift3 = await getShift(prevDate, 3);
        if (prevShift3?.rows) {
          carryover = prevShift3.rows.map((r) => ({
            nozzleId: r.nozzleId,
            openingReading: r.closingReading,
          }));
        }
        if (prevShift3?.price) {
          carryover = carryover || [];
          carryover.price = prevShift3.price;
        }
      } else {
        const prevShift = shiftData[`shift${activeShift - 1}`];
        if (prevShift?.rows) {
          carryover = prevShift.rows.map((r) => ({
            nozzleId: r.nozzleId,
            openingReading: r.closingReading,
          }));
        }
        if (prevShift?.price) {
          carryover = carryover || [];
          carryover.price = prevShift.price;
        }
      }
      setCarryoverData(carryover);
    };
    if (!loading) {
      checkCarryover();
    }
  }, [date, activeShift, shiftData, loading]);

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
            <LoadingSpinner size="lg" label="Loading history" />
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
            carryoverData={carryoverData}
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
