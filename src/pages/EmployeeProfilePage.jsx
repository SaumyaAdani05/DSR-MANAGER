import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import Header from '../components/layout/Header.jsx';
import SideDrawer from '../components/layout/SideDrawer.jsx';
import Button from '../components/ui/Button.jsx';
import { db } from '../db/localDB.js';
import { getEmployeeAdvances, getEmployeeSalaryPayments } from '../services/advanceService.js';
import { formatINR, formatDisplayDate } from '../utils/formatters.js';

export default function EmployeeProfilePage() {
  const { logout } = useAuth();
  const { stationName } = useSettings();
  const { id: employeeId } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [advances, setAdvances] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const emp = await db.employees.get(employeeId);
        if (!emp) {
          toast.error('Employee not found');
          navigate('/attendance');
          return;
        }
        setEmployee(emp);

        const advList = await getEmployeeAdvances(employeeId);
        setAdvances(advList);

        const payList = await getEmployeeSalaryPayments(employeeId);
        setPayments(payList.sort((a,b) => b.periodStart.localeCompare(a.periodStart)));
      } catch (err) {
        console.error('Failed to load profile:', err);
        toast.error('Failed to load profile details');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [employeeId, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Computations
  const totalAdvancesGiven = advances.reduce((s, a) => s + (parseFloat(a.amount) || 0), 0);
  const totalDeductionsMade = payments.reduce((s, p) => s + (parseFloat(p.deductionAmount) || 0), 0);
  const outstandingAdvance = parseFloat((totalAdvancesGiven - totalDeductionsMade).toFixed(2));

  // Build running total advances list
  let runningSum = 0;
  const advancesWithRunning = advances.map((a) => {
    runningSum += parseFloat(a.amount) || 0;
    return {
      ...a,
      runningTotal: runningSum,
    };
  }).reverse(); // Latest at top for table

  return (
    <div className="min-h-screen bg-adani-lightGray">
      <Header stationName={stationName} onMenuClick={() => setDrawerOpen(true)} />
      <SideDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLogout={handleLogout}
      />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/attendance')}>\u2190 Back to Register</Button>
            <h1 className="text-xl font-bold text-adani-navy">{employee?.name}'s Profile</h1>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-adani-navy border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Balance Card */}
            <div className="bg-white rounded-lg shadow-card p-6 border-l-[4px] border-l-adani-navy grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Advances Given</h2>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatINR(totalAdvancesGiven)}</p>
              </div>
              <div>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Deductions Settled</h2>
                <p className="text-2xl font-bold text-green-600 mt-1">{formatINR(totalDeductionsMade)}</p>
              </div>
              <div>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Outstanding Advance Due</h2>
                <p className="text-2xl font-extrabold text-adani-red mt-1">{formatINR(outstandingAdvance)}</p>
              </div>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Advances History */}
              <section className="bg-white rounded-lg shadow-card p-6 space-y-4">
                <h2 className="text-sm font-semibold text-adani-navy border-b border-gray-100 pb-2">Advances History</h2>
                {advancesWithRunning.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">No advance records found.</p>
                ) : (
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 font-semibold pb-1.5">
                          <th className="py-1.5">Date</th>
                          <th className="py-1.5 text-right">Amount (\u20B9)</th>
                          <th className="py-1.5 text-right">Running (\u20B9)</th>
                          <th className="py-1.5 pl-3">Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {advancesWithRunning.map((adv) => (
                          <tr key={adv.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-2.5 font-medium text-gray-900">{formatDisplayDate(adv.date)}</td>
                            <td className="py-2.5 text-right text-gray-700 font-semibold">{formatINR(adv.amount)}</td>
                            <td className="py-2.5 text-right text-gray-500">{formatINR(adv.runningTotal)}</td>
                            <td className="py-2.5 pl-3 text-gray-600 italic max-w-[140px] truncate" title={adv.note}>
                              {adv.note || '\u2014'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Salary Payments History */}
              <section className="bg-white rounded-lg shadow-card p-6 space-y-4">
                <h2 className="text-sm font-semibold text-adani-navy border-b border-gray-100 pb-2">Salary Payouts History</h2>
                {payments.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">No salary payments recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 font-semibold pb-1.5">
                          <th className="py-1.5">Period</th>
                          <th className="py-1.5 text-center">Shifts</th>
                          <th className="py-1.5 text-right">Deducted</th>
                          <th className="py-1.5 text-right font-bold">Net Paid</th>
                          <th className="py-1.5 text-center">Paid Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {payments.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-2.5 font-medium text-gray-900">
                              {formatDisplayDate(p.periodStart).split('/').slice(0,2).join('/')} - {formatDisplayDate(p.periodEnd).split('/').slice(0,2).join('/')}
                            </td>
                            <td className="py-2.5 text-center text-gray-700 font-medium">{p.totalShifts}</td>
                            <td className="py-2.5 text-right text-amber-600">{formatINR(p.deductionAmount)}</td>
                            <td className="py-2.5 text-right font-bold text-green-600">{formatINR(p.netPayable)}</td>
                            <td className="py-2.5 text-center text-gray-500">{formatDisplayDate(p.paidAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
