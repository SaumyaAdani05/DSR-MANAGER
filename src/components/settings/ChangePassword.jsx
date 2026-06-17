import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { updatePassword } from '../../services/authService';
import { validatePassword, getPasswordErrors } from '../../utils/validators';
import { useAuth } from '../../context/AuthContext';

const ChangePassword = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordErrors = newPassword ? getPasswordErrors(newPassword) : [];
  const isValid = validatePassword(newPassword) && newPassword === confirmPassword && currentPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    try {
      await updatePassword(currentPassword, newPassword);
      toast.success('Password updated successfully. Please log in again.');
      logout();
      navigate('/login');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <Input
          label="Current Password"
          type={showCurrent ? 'text' : 'password'}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Enter current password"
        />
        <button
          type="button"
          onClick={() => setShowCurrent(!showCurrent)}
          className="absolute right-3 top-9 text-adani-gray hover:text-adani-navy"
          aria-label="Toggle current password visibility"
        >
          {showCurrent ? '🙈' : '👁'}
        </button>
      </div>

      <div className="relative">
        <Input
          label="New Password"
          type={showNew ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
        />
        <button
          type="button"
          onClick={() => setShowNew(!showNew)}
          className="absolute right-3 top-9 text-adani-gray hover:text-adani-navy"
          aria-label="Toggle new password visibility"
        >
          {showNew ? '🙈' : '👁'}
        </button>
      </div>

      {newPassword && (
        <div className="text-xs space-y-1 pl-1">
          {['Minimum 6 characters', 'Maximum 12 characters', 'At least one lowercase letter', 'At least one uppercase letter', 'At least one number', 'At least one special character (@, #, $)'].map((rule) => (
            <div key={rule} className={`flex items-center gap-1.5 ${passwordErrors.includes(rule) ? 'text-error' : 'text-success'}`}>
              <span>{passwordErrors.includes(rule) ? '✕' : '✓'}</span>
              <span>{rule}</span>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <Input
          label="Confirm Password"
          type={showConfirm ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          error={confirmPassword && newPassword !== confirmPassword ? 'Passwords do not match' : ''}
        />
        <button
          type="button"
          onClick={() => setShowConfirm(!showConfirm)}
          className="absolute right-3 top-9 text-adani-gray hover:text-adani-navy"
          aria-label="Toggle confirm password visibility"
        >
          {showConfirm ? '🙈' : '👁'}
        </button>
      </div>

      <Button type="submit" disabled={!isValid} loading={loading}>
        Update Password
      </Button>
    </form>
  );
};

export default ChangePassword;
