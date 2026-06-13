import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import Header from '../components/layout/Header';
import SideDrawer from '../components/layout/SideDrawer';
import DatePicker from '../components/calendar/DatePicker';
import ShiftTabs from '../components/shift/ShiftTabs';
import ShiftGrid from '../components/shift/ShiftGrid';
import ExportDSR from '../components/export/ExportDSR';
import MonthlyReport from '../components/export/MonthlyReport';
import { getCalendarData, getShift, saveShift as saveShiftService, forceUpdateCarryover } from '../services/shiftService';
import { cleanOldRecords } from '../services/cleanupService';
import { getTodayStr, isToday, isEditable, getPreviousDateStr } from '../utils/dateUtils';

const DashboardPage = () => {
  const { logout } = useAuth();
  const { stationName, nozzles, allNozzles, employees, allEmployees } = useSettings();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [activeShift, setActiveShift] = useState(1);
  const [shiftData, setShiftData] = useState({ shift1: null, shift2: null, shift3: null });
  const [datesWithData, setDatesWithData] = useState([]);
  const [carryoverData, setCarryoverData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [monthlyOpen, setMonthlyOpen] = useState(false);

  // Load calendar metadata + cleanup on mount
  useEffect(() => {
    const init = async () => {
      try {
        await cleanOldRecords();
        const dates = await getCalendarData();
        setDatesWithData(dates);
      } catch (error) {
        console.error('Init error:', error);
      }
    };
    init();
  }, []);

  // Load shift data when date or active shift changes
  const loadShiftData = useCallback(async () => {
    setLoading(true);
    try {
      const shift = await getShift(selectedDate, activeShift);
      setShiftData((prev) => ({ ...prev, [`shift${activeShift}`]: shift }));

      // Load carryover if shift has no data
      if (!shift) {
        let carryover = null;
        if (activeShift === 1) {
          // Carryover from previous day's Shift 3
          const prevDate = getPreviousDateStr(selectedDate);
          const prevShift3 = await getShift(prevDate, 3);
          if (prevShift3?.rows) {
            carryover = prevShift3.rows.map((r) => ({
              openingReading: r.closingReading,
            }));
          }
          // Check carryover price
          if (prevShift3?.price) {
            carryover = carryover || [];
            carryover.price = prevShift3.price;
          }
        } else {
          // Carryover from previous shift same day
          const prevShift = await getShift(selectedDate, activeShift - 1);
          if (prevShift?.rows) {
            carryover = prevShift.rows.map((r) => ({
              openingReading: r.closingReading,
            }));
          }
          if (prevShift?.price) {
            carryover = carryover || [];
            carryover.price = prevShift.price;
          }
        }
        setCarryoverData(carryover);
      } else {
        setCarryoverData(null);
      }

      // Determine active tab: last saved shift
      if (activeShift === 1) {
        for (let i = 3; i >= 1; i--) {
          const s = i === activeShift ? shift : await getShift(selectedDate, i);
          if (s?.isSaved) {
            setActiveShift(i);
            break;
          }
        }
      }
    } catch (error) {
      console.error('Load shift error:', error);
      toast.error('Failed to load shift data');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, activeShift]);

  useEffect(() => {
    loadShiftData();
  }, [selectedDate, activeShift, loadShiftData]);

  // Load all shift statuses for tabs
  const [shiftStatuses, setShiftStatuses] = useState([{}, {}, {}]);
  useEffect(() => {
    const loadStatuses = async () => {
      const statuses = [];
      for (let i = 1; i <= 3; i++) {
        const s = shiftData[`shift${i}`] || (await getShift(selectedDate, i));
        statuses.push({
          isSaved: s?.isSaved || false,
          isLocked: s?.isSaved && !isEditable(s),
        });
      }
      setShiftStatuses(statuses);
    };
    loadStatuses();
  }, [selectedDate, shiftData]);

  const handleDateSelect = (dateStr) => {
    if (!isToday(dateStr)) {
      navigate(`/history/${dateStr}`);
      return;
    }
    setSelectedDate(dateStr);
    setActiveShift(1);
  };

  const handleSave = async (date, shiftNum, shiftPayload) => {
    const savedDoc = await saveShiftService(date, shiftNum, shiftPayload);
    setShiftData((prev) => ({ ...prev, [`shift${shiftNum}`]: savedDoc }));

    // Update calendar
    if (!datesWithData.includes(date)) {
      setDatesWithData((prev) => [...prev, date]);
    }

    // Force-update carryover on next shift
    const carryoverUpdated = await forceUpdateCarryover(date, shiftNum, shiftPayload.rows);
    return { carryoverUpdated };
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentShift = shiftData[`shift${activeShift}`];
  const isReadOnly = !isToday(selectedDate);

  return (
    <div className="min-h-screen bg-adani-lightGray">
      <Header stationName={stationName} onMenuClick={() => setDrawerOpen(true)} />

      <SideDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onExportDSR={() => { setDrawerOpen(false); setExportOpen(true); }}
        onMonthlyReport={() => { setDrawerOpen(false); setMonthlyOpen(true); }}
        onLogout={handleLogout}
      />

      <main className="max-w-[1320px] mx-auto px-4 py-6">
        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Calendar */}
          <div className="flex-shrink-0">
            <DatePicker
              selectedDate={selectedDate}
              datesWithData={datesWithData}
              onDateSelect={handleDateSelect}
            />
          </div>

          {/* Shift area */}
          <div className="flex-1 min-w-0">
            <ShiftTabs
              activeShift={activeShift}
              onShiftChange={setActiveShift}
              shiftStatuses={shiftStatuses}
            />

            {loading ? (
              <div className="flex items-center justify-center py-20 bg-white rounded-b-lg shadow-card">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-adani-navy" />
              </div>
            ) : (
              <ShiftGrid
                date={selectedDate}
                shiftNumber={activeShift}
                shiftData={currentShift}
                nozzles={allNozzles || nozzles}
                employees={allEmployees || employees}
                onSave={handleSave}
                readOnly={isReadOnly}
                carryoverData={carryoverData}
              />
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <ExportDSR isOpen={exportOpen} onClose={() => setExportOpen(false)} stationName={stationName} />
      <MonthlyReport isOpen={monthlyOpen} onClose={() => setMonthlyOpen(false)} stationName={stationName} />
    </div>
  );
};

export default DashboardPage;
