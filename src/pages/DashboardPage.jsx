import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useShift } from '../context/ShiftContext';
import { useSettings } from '../context/SettingsContext';
import Header from '../components/layout/Header';
import SideDrawer from '../components/layout/SideDrawer';
import ShiftTabs from '../components/shift/ShiftTabs';
import ShiftGrid from '../components/shift/ShiftGrid';
import DailySalesBar from '../components/shift/DailySalesBar';
import ExportDSR from '../components/export/ExportDSR';
import MonthlyReport from '../components/export/MonthlyReport';
import { getShift, saveShift as saveShiftService, forceUpdateCarryover } from '../services/shiftService';
import { cleanOldRecords } from '../services/cleanupService';
import { isToday, isWithinRetention, getPreviousDateStr } from '../utils/dateUtils';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const DashboardPage = () => {
  const { logout } = useAuth();
  const { date: routeDate } = useParams();
  const {
    selectedDate,
    selectDate,
    activeShift,
    switchShift,
    shiftData,
    datesWithData,
    loadCalendar,
    loadAllShifts,
    shiftLoading: loading,
    updateLocalShiftData,
  } = useShift();

  const { stationName, nozzles, allNozzles, employees, allEmployees } = useSettings();
  const navigate = useNavigate();

  const [carryoverData, setCarryoverData] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [monthlyOpen, setMonthlyOpen] = useState(false);

  // Sync route date param with context selectedDate
  useEffect(() => {
    if (routeDate && routeDate !== selectedDate) {
      selectDate(routeDate);
    }
  }, [routeDate, selectedDate, selectDate]);

  // Load calendar metadata + cleanup on mount
  useEffect(() => {
    const init = async () => {
      try {
        await cleanOldRecords();
        await loadCalendar();
      } catch (error) {
        console.error('Init error:', error);
      }
    };
    init();
  }, [loadCalendar]);

  // Load all shifts when date changes
  useEffect(() => {
    loadAllShifts(selectedDate);
  }, [selectedDate, loadAllShifts]);

  // Compute carryover data
  useEffect(() => {
    const checkCarryover = async () => {
      const currentShift = shiftData[activeShift];
      if (!currentShift) {
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
          if (prevShift3?.price) {
            carryover = carryover || [];
            carryover.price = prevShift3.price;
          }
        } else {
          // Carryover from previous shift same day
          const prevShift = shiftData[activeShift - 1];
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
    };
    checkCarryover();
  }, [selectedDate, activeShift, shiftData]);

  // Calculate shift statuses for tabs
  const shiftStatuses = [1, 2, 3].map((i) => {
    const s = shiftData[i];
    return {
      isSaved: s?.isSaved || false,
      isLocked: false, // Shifts are never locked in v2.0
    };
  });

  const handleSave = async (date, shiftNum, shiftPayload) => {
    const savedDoc = await saveShiftService(date, shiftNum, shiftPayload);
    updateLocalShiftData(shiftNum, savedDoc);

    // Update calendar
    await loadCalendar();

    // Force-update carryover on next shift
    const carryoverUpdated = await forceUpdateCarryover(date, shiftNum, shiftPayload.rows);

    // Reload all shifts to get the updated carryover values in subsequent shifts
    await loadAllShifts(date);

    return { carryoverUpdated };
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentShift = shiftData[activeShift];
  const isReadOnly = !isWithinRetention(selectedDate);

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
        <div className="flex flex-col gap-6">
          {/* Shift area */}
          <div className="flex-1 min-w-0">
            <ShiftTabs
              activeShift={activeShift}
              onShiftChange={switchShift}
              shiftStatuses={shiftStatuses}
            />

            {loading ? (
              <div className="flex items-center justify-center py-20 bg-white rounded-b-lg shadow-card">
                <LoadingSpinner size="lg" label="Loading shift data" />
              </div>
            ) : (
              <>
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
                <DailySalesBar shiftData={shiftData} />
              </>
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
