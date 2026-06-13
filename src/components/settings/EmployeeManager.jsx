import { useState } from 'react';
import toast from 'react-hot-toast';
import { addEmployee, removeEmployee } from '../../services/settingsService';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { MAX_EMPLOYEES } from '../../utils/constants';

export default function EmployeeManager({ employees = [], onEmployeeChange }) {
  const [newEmployee, setNewEmployee] = useState('');
  const [removeTarget, setRemoveTarget] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const activeEmployees = employees.filter((e) => e.isActive);

  const handleAdd = async () => {
    const name = newEmployee.trim();
    if (!name) {
      toast.error('Employee name cannot be empty');
      return;
    }

    setIsAdding(true);
    try {
      await addEmployee(name);
      setNewEmployee('');
      if (onEmployeeChange) await onEmployeeChange();
      toast.success(`Employee "${name}" added`);
    } catch (err) {
      toast.error(err.message || 'Failed to add employee');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveConfirm = async () => {
    if (!removeTarget) return;
    setIsRemoving(true);
    try {
      await removeEmployee(removeTarget.id);
      if (onEmployeeChange) await onEmployeeChange();
      toast.success(`Employee "${removeTarget.name}" removed`);
    } catch (err) {
      toast.error('Failed to remove employee');
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
        {activeEmployees.length}/{MAX_EMPLOYEES} employees
      </p>

      {activeEmployees.length === 0 ? (
        <p className="text-sm text-gray-400 italic py-4 text-center">
          No employees added. Add your first employee to get started.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeEmployees.map((emp) => (
            <div
              key={emp.id}
              className="flex items-center gap-2 bg-adani-lightGray border border-adani-border rounded-lg px-3 py-2 text-sm text-gray-800"
            >
              <span className="font-medium">{emp.name}</span>
              <button
                type="button"
                onClick={() => setRemoveTarget(emp)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded p-0.5 transition-colors"
                aria-label={`Remove employee ${emp.name}`}
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
          value={newEmployee}
          onChange={(e) => setNewEmployee(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Rajesh, Priya"
          disabled={isAdding || activeEmployees.length >= MAX_EMPLOYEES}
          className="flex-1 h-10 px-3 text-sm border border-adani-border rounded-md focus:outline-none focus:ring-2 focus:ring-adani-navy disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <Button onClick={handleAdd} loading={isAdding} disabled={activeEmployees.length >= MAX_EMPLOYEES}>
          Add
        </Button>
      </div>

      {/* Remove confirmation */}
      <Modal
        isOpen={!!removeTarget}
        onClose={() => !isRemoving && setRemoveTarget(null)}
        title="Remove Employee"
      >
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to remove <strong>"{removeTarget?.name}"</strong>?
          Historical records will be preserved.
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
