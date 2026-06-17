import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import Header from '../components/layout/Header.jsx';
import SideDrawer from '../components/layout/SideDrawer.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import AddAdvancePopup from '../components/attendance/AddAdvancePopup.jsx';
import PaySalaryPopup from '../components/attendance/PaySalaryPopup.jsx';
import { getPerShiftWage, updatePerShiftWage, buildAttendanceRegister } from '../services/attendanceService.js';
import { updateDeduction } from '../services/advanceService.js';
import { exportAttendancePDF, exportAttendanceExcel } from '../services/exportService.js';
import { formatINR, formatDisplayDate, getTodayIST } from '../utils/formatters.js';

export default function AttendancePage() {
  const { logout } = useAuth();
  const { stationName, employees } = useSettings();
  const navigate = useNavigate();

  const getStartOfMonth = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  };

  const [startDate, setStartDate] = useState(getStartOfMonth());
  const [endDate, setEndDate] = useState(getTodayIST());
  const [wage, setWage] = useState(0);
  const [register, setRegister] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Popups state
  const [selectedRow, setSelectedRow] = useState(null);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  // Date range generation helper
  const getDatesInRange = (start, end) => {
    const dates = [];
    let curr = new Date(start);
    const last = new Date(end);
    let count = 0;
    while (curr <= last && count < 32) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, '0');
      const d = String(curr.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${d}`);
      curr.setDate(curr.getDate() + 1);
      count++;
    }
    return dates;
  };

  const dateCols = getDatesInRange(startDate, endDate);

  const loadRegister = useCallback(async () => {
    setLoading(true);
    try {
      const currentWage = await getPerShiftWage();
      setWage(currentWage);
      const data = await buildAttendanceRegister(startDate, endDate, employees, currentWage);
      setRegister(data);
    } catch (err) {
      console.error('Failed to load register:', err);
      toast.error('Failed to load attendance register');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, employees]);

  useEffect(() => {
    loadRegister();
  }, [loadRegister]);

  const handleWageBlur = async (e) => {
    const val = parseFloat(e.target.value) || 0;
    try {
      await updatePerShiftWage(val);
      setWage(val);
      toast.success(`Wage updated to ${formatINR(val)} per shift`);
      loadRegister();
    } catch (err) {
      toast.error('Failed to update shift wage');
    }
  };

  const handleDeductionChange = async (empId, empName, value) => {
    const val = parseFloat(value) || 0;
    
    // Update local register state live
    setRegister(prev => prev.map(row => {
      if (row.employee.id === empId) {
        const net = parseFloat((row.totalWage - val).toFixed(2));
        return {
          ...row,
          deductionAmount: val,
          netPayable: net,
        };
      }
      return row;
    }));

    try {
      await updateDeduction(empId, empName, startDate, endDate, val);
    } catch (err) {
      console.error('Failed to save deduction:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    try {
      exportAttendancePDF(register, stationName, startDate, endDate, wage);
      toast.success('Attendance PDF exported');
    } catch (err) {
      toast.error('Failed to export PDF');
    }
  };

  const handleExportExcel = () => {
    try {
      exportAttendanceExcel(register, stationName, startDate, endDate, wage);
      toast.success('Attendance Excel exported');
    } catch (err) {
      toast.error('Failed to export Excel');
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

      <main className="max-w-[1400px] mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 no-print">
          <h1 className="text-xl font-bold text-adani-navy">Attendance & Payroll</h1>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handlePrint} disabled={register.length === 0}>
              Print Register
            </Button>
            <Button variant="secondary" onClick={handleExportExcel} disabled={register.length === 0}>
              Excel Export
            </Button>
            <Button onClick={handleExportPDF} disabled={register.length === 0}>
              PDF Export
            </Button>
            <Button variant="ghost" onClick={() => navigate('/')}>
              \u2190 Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Configurations Bar */}
        <div className="flex flex-wrap items-end justify-between gap-4 bg-white p-4 rounded-lg shadow-card border border-gray-100 no-print">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-40">
              <label htmlFor="per-shift-wage" className="block text-xs font-semibold text-gray-700 mb-1.5">
                Per Shift Wage (\u20B9)
              </label>
              <Input
                id="per-shift-wage"
                type="number"
                step="1"
                min="0"
                value={wage || ''}
                onChange={(e) => setWage(parseFloat(e.target.value) || 0)}
                onBlur={handleWageBlur}
                placeholder="\u20B9300"
              />
            </div>
            <div className="w-44">
              <label htmlFor="reg-start" className="block text-xs font-semibold text-gray-700 mb-1.5">
                Start Date
              </label>
              <Input
                id="reg-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="w-44">
              <label htmlFor="reg-end" className="block text-xs font-semibold text-gray-700 mb-1.5">
                End Date
              </label>
              <Input
                id="reg-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Button
              variant="secondary"
              onClick={() => {
                setStartDate(getStartOfMonth());
                setEndDate(getTodayIST());
              }}
            >
              This Month
            </Button>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-xl font-bold text-gray-900">{stationName}</h1>
          <p className="text-sm text-gray-600">Attendance & Payroll Register</p>
          <p className="text-xs text-gray-500">Period: {formatDisplayDate(startDate)} to {formatDisplayDate(endDate)} | Wage: {formatINR(wage)} / shift</p>
        </div>

        {/* Register Matrix Grid */}
        <section className="bg-white rounded-lg shadow-card overflow-hidden p-6">
          <h2 className="text-sm font-semibold text-adani-navy mb-4 no-print">
            Attendance Grid (capping date selection at 31 days)
          </h2>

          {loading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin h-6 w-6 border-2 border-adani-navy border-t-transparent rounded-full" />
            </div>
          ) : register.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No active employees configured.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[1200px]">
                <thead>
                  <tr className="bg-adani-navy text-white text-center select-none font-semibold">
                    <th className="px-3 py-2.5 text-left sticky left-0 z-10 bg-adani-navy border-r border-white/20 w-44">Employee Name</th>
                    {dateCols.map((dateStr) => (
                      <th key={dateStr} className="px-1.5 py-2.5 border-r border-white/10 w-9" title={formatDisplayDate(dateStr)}>
                        {dateStr.split('-')[2]}
                      </th>
                    ))}
                    <th className="px-2 py-2.5 border-l border-white/20 w-16">Shifts</th>
                    <th className="px-2 py-2.5 w-20 text-right">Wage</th>
                    <th className="px-2 py-2.5 w-20 text-right">Advance</th>
                    <th className="px-2 py-2.5 w-24 text-right no-print">Deduction</th>
                    <th className="px-2 py-2.5 w-20 text-right">Net</th>
                    <th className="px-2 py-2.5 w-24">Status</th>
                    <th className="px-2 py-2.5 w-36 no-print">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {register.map((row) => (
                    <tr key={row.employee.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Clickable name */}
                      <td className="px-3 py-3 font-semibold text-gray-900 sticky left-0 z-10 bg-white group-hover:bg-gray-50/50 border-r border-gray-200">
                        <button
                          type="button"
                          onClick={() => navigate(`/attendance/employee/${row.employee.id}`)}
                          className="hover:underline text-adani-navy hover:text-adani-navyLight font-bold text-left focus:outline-none"
                        >
                          {row.employee.name}
                        </button>
                      </td>

                      {/* Dates presence */}
                      {dateCols.map((dateStr) => {
                        const shiftsWorked = row.byDate[dateStr] || [];
                        return (
                          <td key={dateStr} className="px-1 py-3 text-center border-r border-gray-100 font-semibold text-gray-800">
                            {shiftsWorked.sort().join(',')}
                          </td>
                        );
                      })}

                      {/* Summary calculations */}
                      <td className="px-2 py-3 text-center font-bold text-gray-800 border-l border-gray-200">{row.totalShifts}</td>
                      <td className="px-2 py-3 text-right text-gray-700 font-semibold">{formatINR(row.totalWage)}</td>
                      <td className="px-2 py-3 text-right text-amber-600 font-semibold">{formatINR(row.advanceGiven)}</td>
                      
                      {/* Inline editable deduction */}
                      <td className="px-2 py-3 text-right no-print">
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={row.deductionAmount || ''}
                          onChange={(e) => handleDeductionChange(row.employee.id, row.employee.name, e.target.value)}
                          className="w-20 h-8 px-2 text-right border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-adani-navy font-semibold text-gray-800"
                        />
                      </td>

                      {/* Net Payable */}
                      <td className={`px-2 py-3 text-right font-bold ${row.netPayable < 0 ? 'text-adani-red' : 'text-green-600'}`}>
                        {formatINR(row.netPayable)}
                      </td>

                      {/* Status */}
                      <td className="px-2 py-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          row.status === 'paid'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-adani-red border border-red-200'
                        }`}>
                          {row.status === 'paid' ? 'PAID' : 'DUE'}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="px-2 py-3 text-center no-print">
                        <div className="flex justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRow(row);
                              setShowAdvanceModal(true);
                            }}
                            className="border border-adani-navy text-adani-navy hover:bg-blue-50 text-[10px] font-bold px-2 py-1 rounded transition-colors"
                          >
                            + Adv
                          </button>

                          {row.status !== 'paid' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRow(row);
                                setShowPayModal(true);
                              }}
                              className="bg-adani-red hover:bg-adani-redDark text-white text-[10px] font-bold px-2 py-1 rounded transition-colors"
                            >
                              Pay
                            </button>
                          ) : (
                            <span className="text-[10px] text-green-600 font-bold flex items-center gap-0.5">
                              \u2713 Paid
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Popups */}
      {selectedRow && (
        <>
          <AddAdvancePopup
            isOpen={showAdvanceModal}
            onClose={() => {
              setShowAdvanceModal(false);
              setSelectedRow(null);
            }}
            employee={selectedRow.employee}
            onSuccess={loadRegister}
          />
          <PaySalaryPopup
            isOpen={showPayModal}
            onClose={() => {
              setShowPayModal(false);
              setSelectedRow(null);
            }}
            row={selectedRow}
            startDate={startDate}
            endDate={endDate}
            onSuccess={loadRegister}
          />
        </>
      )}
    </div>
  );
}
