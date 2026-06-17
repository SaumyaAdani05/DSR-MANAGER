import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import Header from '../components/layout/Header.jsx';
import SideDrawer from '../components/layout/SideDrawer.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Modal from '../components/ui/Modal.jsx';
import { getParties, addParty, removeParty } from '../services/partyService.js';
import { getPartiesWithBalance } from '../services/billService.js';
import { formatINR } from '../utils/formatters.js';

export default function PartyManagementPage() {
  const { logout } = useAuth();
  const { stationName } = useSettings();
  const navigate = useNavigate();

  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPartyName, setNewPartyName] = useState('');
  const [adding, setAdding] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Deletion verification
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);
  const [outstandingDues, setOutstandingDues] = useState(0);

  const loadParties = async () => {
    setLoading(true);
    try {
      const partiesList = await getPartiesWithBalance();
      setParties(partiesList.filter(p => p.isActive !== false));
    } catch (err) {
      console.error('Failed to load parties:', err);
      toast.error('Failed to load parties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParties();
  }, []);

  const handleAddParty = async (e) => {
    e.preventDefault();
    if (!newPartyName.trim()) {
      toast.error('Please enter a party name');
      return;
    }
    setAdding(true);
    try {
      await addParty(newPartyName.trim());
      setNewPartyName('');
      toast.success('Party added successfully');
      loadParties();
    } catch (err) {
      toast.error(err.message || 'Failed to add party');
    } finally {
      setAdding(false);
    }
  };

  const initiateDelete = (party) => {
    setSelectedParty(party);
    setOutstandingDues(party.outstanding || 0);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedParty) return;
    try {
      await removeParty(selectedParty.id);
      toast.success('Party removed successfully');
      setShowConfirmModal(false);
      setSelectedParty(null);
      loadParties();
    } catch (err) {
      toast.error('Failed to remove party');
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
          <h1 className="text-xl font-bold text-adani-navy">Party Management</h1>
          <Button variant="ghost" onClick={() => navigate('/')}>\u2190 Back to Dashboard</Button>
        </div>

        {/* Add Party */}
        <section className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-sm font-semibold text-adani-navy mb-3">Add New Credit Party</h2>
          <form onSubmit={handleAddParty} className="flex gap-3">
            <div className="flex-1">
              <Input
                value={newPartyName}
                onChange={(e) => setNewPartyName(e.target.value)}
                placeholder="Enter party name (e.g. Ramesh Trucking)"
                disabled={adding}
              />
            </div>
            <Button type="submit" loading={adding}>
              Add Party
            </Button>
          </form>
        </section>

        {/* Parties List */}
        <section className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-sm font-semibold text-adani-navy mb-4">Registered Credit Parties</h2>

          {loading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin h-6 w-6 border-2 border-adani-navy border-t-transparent rounded-full" />
            </div>
          ) : parties.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No credit parties registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-medium pb-2">
                    <th className="py-2">Party Name</th>
                    <th className="py-2 text-right">Outstanding Dues</th>
                    <th className="py-2 text-center w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {parties.map((party) => (
                    <tr key={party.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 font-medium text-gray-900">{party.name}</td>
                      <td className="py-3 text-right font-semibold">
                        <span className={party.outstanding > 0 ? 'text-adani-red' : 'text-green-600'}>
                          {formatINR(party.outstanding || 0)}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <button
                          type="button"
                          onClick={() => initiateDelete(party)}
                          className="text-gray-400 hover:text-adani-red p-1 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-adani-red"
                          aria-label={`Delete ${party.name}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Remove Credit Party"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to remove <span className="font-semibold text-gray-900">{selectedParty?.name}</span>?
          </p>

          {outstandingDues > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-md p-3.5 text-xs text-adani-red font-medium">
              <div className="flex gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>
                  Warning: This party has outstanding dues of <strong>{formatINR(outstandingDues)}</strong>. Removing this party will hide it from future shift listings, but all historical bills and transaction records will be preserved.
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
