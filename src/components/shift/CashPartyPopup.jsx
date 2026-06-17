import { useState, useEffect } from 'react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import { getParties, addParty } from '../../services/partyService.js';
import toast from 'react-hot-toast';

export default function CashPartyPopup({ isOpen, onClose, onSelect, onCancel }) {
  const [parties, setParties] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newPartyName, setNewPartyName] = useState('');
  const [savingParty, setSavingParty] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadParties();
      setSearch('');
      setShowAddNew(false);
      setNewPartyName('');
    }
  }, [isOpen]);

  const loadParties = async () => {
    setLoading(true);
    try {
      const list = await getParties();
      setParties(list);
    } catch (err) {
      toast.error('Failed to load parties');
    } finally {
      setLoading(false);
    }
  };

  const filtered = parties.filter(p => p.name.toLowerCase().includes(search.toLowerCase().trim()));

  const handleCreateParty = async (e) => {
    e.preventDefault();
    if (!newPartyName.trim()) return;
    setSavingParty(true);
    try {
      const party = await addParty(newPartyName.trim());
      toast.success(`Party "${party.name}" created`);
      onSelect(party);
    } catch (err) {
      toast.error(err.message || 'Failed to create party');
    } finally {
      setSavingParty(false);
    }
  };

  const handleClose = () => {
    onClose();
    if (onCancel) onCancel();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Assign Credit Party">
      <div className="space-y-4">
        {!showAddNew ? (
          <>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search party name..."
              autoFocus
            />

            <div className="max-h-60 overflow-y-auto border border-gray-150 rounded-md divide-y divide-gray-100 bg-gray-50/50">
              {loading ? (
                <div className="p-4 text-center text-sm text-gray-500">Loading parties...</div>
              ) : filtered.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">No matching parties found.</div>
              ) : (
                filtered.map((party) => (
                  <button
                    key={party.id}
                    type="button"
                    onClick={() => onSelect(party)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-adani-navy/5 text-gray-800 font-medium transition-colors focus:bg-adani-navy/5 focus:outline-none"
                  >
                    {party.name}
                  </button>
                ))
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setShowAddNew(true)}
                className="text-sm font-semibold text-adani-navy hover:text-adani-navyLight underline focus:outline-none"
              >
                + Add New Party
              </button>
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={handleCreateParty} className="space-y-4">
            <p className="text-xs text-gray-500 font-medium">Create a new credit party name immediately:</p>
            <Input
              value={newPartyName}
              onChange={(e) => setNewPartyName(e.target.value)}
              placeholder="Enter new party name"
              autoFocus
              disabled={savingParty}
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowAddNew(false)} disabled={savingParty}>
                Back
              </Button>
              <Button type="submit" loading={savingParty} disabled={!newPartyName.trim()}>
                Create & Select
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
