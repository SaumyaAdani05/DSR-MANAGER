import { useState } from 'react';
import toast from 'react-hot-toast';
import { addNozzle, removeNozzle } from '../../services/settingsService';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { MAX_NOZZLES } from '../../utils/constants';

export default function NozzleManager({ nozzles = [], onNozzleChange }) {
  const [newNozzle, setNewNozzle] = useState('');
  const [removeTarget, setRemoveTarget] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const activeNozzles = nozzles.filter((n) => n.isActive);

  const handleAdd = async () => {
    const name = newNozzle.trim();
    if (!name) {
      toast.error('Nozzle name cannot be empty');
      return;
    }

    setIsAdding(true);
    try {
      await addNozzle(name);
      setNewNozzle('');
      if (onNozzleChange) await onNozzleChange();
      toast.success(`Nozzle "${name}" added`);
    } catch (err) {
      toast.error(err.message || 'Failed to add nozzle');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveConfirm = async () => {
    if (!removeTarget) return;
    setIsRemoving(true);
    try {
      await removeNozzle(removeTarget.id);
      if (onNozzleChange) await onNozzleChange();
      toast.success(`Nozzle "${removeTarget.name}" removed`);
    } catch (err) {
      toast.error('Failed to remove nozzle');
    } finally {
      setIsRemoving(false);
      setRemoveTarget(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div>
      <p className="text-xs text-adani-gray mb-3">
        {activeNozzles.length}/{MAX_NOZZLES} nozzles
      </p>

      {/* Nozzle list */}
      {activeNozzles.length === 0 ? (
        <p className="text-sm text-gray-400 italic py-4 text-center">
          No nozzles added. Add your first nozzle to get started.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeNozzles.map((nozzle) => (
            <div
              key={nozzle.id}
              className="flex items-center gap-2 bg-adani-lightGray border border-adani-border rounded-lg px-3 py-2 text-sm text-gray-800"
            >
              <span className="font-medium">{nozzle.name}</span>
              <button
                type="button"
                onClick={() => setRemoveTarget(nozzle)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded p-0.5 transition-colors"
                aria-label={`Remove nozzle ${nozzle.name}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newNozzle}
          onChange={(e) => setNewNozzle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. N1, Nozzle A"
          disabled={isAdding || activeNozzles.length >= MAX_NOZZLES}
          className="flex-1 h-10 px-3 text-sm border border-adani-border rounded-md focus:outline-none focus:ring-2 focus:ring-adani-navy disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <Button onClick={handleAdd} loading={isAdding} disabled={activeNozzles.length >= MAX_NOZZLES}>
          Add
        </Button>
      </div>

      {/* Remove confirmation */}
      <Modal
        isOpen={!!removeTarget}
        onClose={() => !isRemoving && setRemoveTarget(null)}
        title="Remove Nozzle"
      >
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to remove <strong>"{removeTarget?.name}"</strong>?
          This nozzle will no longer appear in shift dropdowns. Historical records will be preserved.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setRemoveTarget(null)} disabled={isRemoving}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleRemoveConfirm} loading={isRemoving}>
            Remove
          </Button>
        </div>
      </Modal>
    </div>
  );
}
