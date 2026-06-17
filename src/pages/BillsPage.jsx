import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import Header from '../components/layout/Header.jsx';
import SideDrawer from '../components/layout/SideDrawer.jsx';
import Button from '../components/ui/Button.jsx';
import DailyBillView from '../components/bills/DailyBillView.jsx';
import PartyBillDetail from '../components/bills/PartyBillDetail.jsx';
import { getPartiesWithBalance } from '../services/billService.js';
import { formatDisplayDate, formatINR } from '../utils/formatters.js';

export default function BillsPage() {
  const { logout } = useAuth();
  const { stationName } = useSettings();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'daily' | 'detail'
  const [selectedParty, setSelectedParty] = useState(null);
  const [partiesSummary, setPartiesSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await getPartiesWithBalance();
      // Only show active parties, or inactive parties with outstanding balances
      setPartiesSummary(data.filter(p => p.isActive !== false || p.outstanding > 0));
    } catch (err) {
      console.error('Failed to load credit summary:', err);
      toast.error('Failed to load credit summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'summary') {
      loadSummary();
    }
  }, [activeTab]);

  const handleViewDetails = (party) => {
    setSelectedParty(party);
    setActiveTab('detail');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const netOutstandingTotal = partiesSummary.reduce((s, p) => s + (p.outstanding || 0), 0);

  return (
    <div className="min-h-screen bg-adani-lightGray">
      <Header stationName={stationName} onMenuClick={() => setDrawerOpen(true)} />
      <SideDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLogout={handleLogout}
      />

      <main className="max-w-[1200px] mx-auto px-4 py-6 space-y-6">
        {activeTab !== 'detail' && (
          <div className="flex items-center justify-between no-print">
            <h1 className="text-xl font-bold text-adani-navy">Credit & Billing</h1>
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'summary' ? 'primary' : 'secondary'}
                onClick={() => setActiveTab('summary')}
              >
                Parties Summary
              </Button>
              <Button
                variant={activeTab === 'daily' ? 'primary' : 'secondary'}
                onClick={() => setActiveTab('daily')}
              >
                Daily Bills
              </Button>
              <Button variant="ghost" onClick={() => navigate('/')}>
                \u2190 Back to Dashboard
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Summary Banner Card */}
            <div className="bg-white rounded-lg shadow-card p-6 border-l-[4px] border-l-adani-navy flex justify-between items-center">
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Outstanding Credit</h2>
                <p className="text-3xl font-extrabold text-adani-red mt-1">{formatINR(netOutstandingTotal)}</p>
              </div>
              <div className="bg-blue-50/50 p-3 rounded-full text-adani-navy">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l2-2 4 4m0-7l-2 2-4-4M3 12h.01M3 8h.01M3 16h.01M21 12h.01M21 8h.01M21 16h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {/* Parties Table */}
            <section className="bg-white rounded-lg shadow-card p-6">
              <h2 className="text-sm font-semibold text-adani-navy mb-4">Credit Balance sheet</h2>

              {loading ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin h-6 w-6 border-2 border-adani-navy border-t-transparent rounded-full" />
                </div>
              ) : partiesSummary.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No credit transactions recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 font-medium pb-2">
                        <th className="py-2">Party Name</th>
                        <th className="py-2 text-right">Total Credit Given</th>
                        <th className="py-2 text-right">Total Settled</th>
                        <th className="py-2 text-right">Net Outstanding</th>
                        <th className="py-2 text-center">Last Active</th>
                        <th className="py-2 text-center w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {partiesSummary.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 font-medium text-gray-900">
                            {p.name}
                            {p.isActive === false && (
                              <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-500 rounded">
                                Deleted
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right text-gray-700">{formatINR(p.totalAmount || 0)}</td>
                          <td className="py-3 text-right text-green-600 font-semibold">{formatINR(p.totalPaid || 0)}</td>
                          <td className="py-3 text-right font-extrabold">
                            <span className={p.outstanding > 0 ? 'text-adani-red' : 'text-green-600'}>
                              {formatINR(p.outstanding || 0)}
                            </span>
                          </td>
                          <td className="py-3 text-center text-gray-500">{p.lastDate ? formatDisplayDate(p.lastDate) : '\u2014'}</td>
                          <td className="py-3 text-center">
                            <Button size="sm" onClick={() => handleViewDetails(p)}>
                              View Bill
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'daily' && (
          <DailyBillView stationName={stationName} />
        )}

        {activeTab === 'detail' && selectedParty && (
          <PartyBillDetail
            party={selectedParty}
            stationName={stationName}
            onBack={() => {
              setSelectedParty(null);
              setActiveTab('summary');
            }}
          />
        )}
      </main>
    </div>
  );
}
