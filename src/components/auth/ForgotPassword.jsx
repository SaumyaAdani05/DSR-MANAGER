import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { db } from '../../db/localDB.js';
import { verifySecurityAnswer, resetPassword } from '../../services/authService.js';
import { validatePassword, getPasswordErrors } from '../../utils/validators.js';
import { checkLockout, recordFailure, resetAttempts } from '../../utils/rateLimiter.js';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Username, 2: Question & Answer, 3: Reset Password
  
  const [username, setUsername] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Step 1: Submit Username
  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    const trimmedUser = username.trim();
    if (!trimmedUser) {
      toast.error('Please enter your username');
      return;
    }

    setIsLoading(true);
    try {
      const owner = await db.auth.get('owner');
      if (!owner || owner.username !== trimmedUser) {
        throw new Error('Username not found');
      }
      if (!owner.securityQuestion) {
        throw new Error('Security question has not been set up for this account.');
      }
      
      setSecurityQuestion(owner.securityQuestion);
      setStep(2);
      toast.success('Username verified');
    } catch (err) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify Answer
  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    const trimmedAnswer = answer.trim();
    if (!trimmedAnswer) {
      toast.error('Please enter your answer');
      return;
    }

    // Rate-limit security question recovery attempts using username
    const lockout = checkLockout(username);
    if (lockout.locked) {
      toast.error(`Too many failed attempts. Try again in ${lockout.remainingTime} seconds.`);
      return;
    }

    setIsLoading(true);
    try {
      if (lockout.delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, lockout.delayMs));
      }

      await verifySecurityAnswer(trimmedAnswer);
      resetAttempts(username);
      setStep(3);
      toast.success('Security answer verified');
    } catch (err) {
      recordFailure(username);
      toast.error(err.message || 'Incorrect answer');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Settle password
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error('Please enter a new password');
      return;
    }
    if (!validatePassword(newPassword)) {
      toast.error('New password does not meet strength requirements');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(newPassword);
      toast.success('Password updated successfully');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-adani-navy px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white opacity-[0.04]" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-white opacity-[0.03]" />
      </div>

      <div className="relative z-10 mb-8 text-center">
        <h1 className="text-3xl font-bold text-white tracking-tight">DSR Manager</h1>
        <p className="mt-2 text-sm text-blue-200/80">Account Recovery</p>
      </div>

      <div className="relative z-10 w-full max-w-[440px] bg-white rounded-2xl shadow-card p-8">
        {step === 1 && (
          <form onSubmit={handleUsernameSubmit} className="flex flex-col gap-5">
            <h2 className="text-lg font-bold text-adani-navy text-center">Find Your Account</h2>
            <p className="text-sm text-gray-500 text-center -mt-2">
              Enter your username to begin the recovery process.
            </p>

            <div>
              <label htmlFor="recovery-username" className="block text-sm font-medium text-gray-700 mb-1.5">
                Username
              </label>
              <input
                id="recovery-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={isLoading}
                autoComplete="username"
                className="w-full h-10 px-3 text-sm text-gray-900 placeholder-gray-400
                           border border-adani-border rounded-md
                           focus:outline-none focus:ring-2 focus:ring-adani-navy focus:border-adani-navy
                           disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 bg-adani-red text-white text-sm font-semibold rounded-lg
                         hover:bg-adani-redDark active:scale-[0.98] transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                'Find Account'
              )}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleAnswerSubmit} className="flex flex-col gap-5">
            <h2 className="text-lg font-bold text-adani-navy text-center">Verify Identity</h2>
            <p className="text-sm text-gray-500 text-center -mt-2">
              Solve the recovery challenge configured for your account.
            </p>

            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100/60">
              <span className="block text-[11px] font-bold text-adani-navy uppercase tracking-wider mb-1">
                Security Question:
              </span>
              <p className="text-sm font-bold text-gray-800 leading-relaxed">
                {securityQuestion}
              </p>
            </div>

            <div>
              <label htmlFor="recovery-answer" className="block text-sm font-medium text-gray-700 mb-1.5">
                Your Answer
              </label>
              <input
                id="recovery-answer"
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type configured answer"
                disabled={isLoading}
                autoComplete="off"
                className="w-full h-10 px-3 text-sm text-gray-900 placeholder-gray-400
                           border border-adani-border rounded-md
                           focus:outline-none focus:ring-2 focus:ring-adani-navy focus:border-adani-navy
                           disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 bg-adani-red text-white text-sm font-semibold rounded-lg
                         hover:bg-adani-redDark active:scale-[0.98] transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                'Verify Answer'
              )}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetSubmit} className="flex flex-col gap-5">
            <h2 className="text-lg font-bold text-adani-navy text-center">Reset Password</h2>
            <p className="text-sm text-gray-500 text-center -mt-2">
              Identity verified. Choose a strong new password.
            </p>

            {/* Password rules list */}
            <ul className="space-y-1.5 bg-gray-50 p-3 rounded-lg border border-gray-150">
              {['Minimum 6 characters', 'Maximum 12 characters', 'At least one lowercase letter', 'At least one uppercase letter', 'At least one number', 'At least one special character (@, #, $)'].map((rule, idx) => {
                const passwordErrors = getPasswordErrors(newPassword);
                const passes = newPassword.length > 0 && !passwordErrors.includes(rule);
                return (
                  <li key={idx} className="flex items-center gap-2 text-[11px]">
                    {newPassword.length > 0 ? (
                      passes ? (
                        <span className="text-green-600 font-bold">✓</span>
                      ) : (
                        <span className="text-red-500 font-bold">✗</span>
                      )
                    ) : (
                      <span className="h-3 w-3 rounded-full border border-gray-350 shrink-0 bg-white" />
                    )}
                    <span className={passes ? 'text-green-700 font-medium' : newPassword.length > 0 ? 'text-red-650 font-medium' : 'text-gray-500'}>
                      {rule}
                    </span>
                  </li>
                );
              })}
            </ul>

            {/* New Password input */}
            <div className="relative">
              <label htmlFor="reset-new-pw" className="block text-sm font-medium text-gray-700 mb-1.5">
                New Password
              </label>
              <input
                id="reset-new-pw"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                disabled={isLoading}
                className="w-full h-10 px-3 pr-10 text-sm text-gray-900 placeholder-gray-400
                           border border-adani-border rounded-md
                           focus:outline-none focus:ring-2 focus:ring-adani-navy focus:border-adani-navy"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showNew ? '🙈' : '👁'}
              </button>
            </div>

            {/* Confirm Password input */}
            <div className="relative">
              <label htmlFor="reset-confirm-pw" className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm Password
              </label>
              <input
                id="reset-confirm-pw"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                disabled={isLoading}
                className="w-full h-10 px-3 pr-10 text-sm text-gray-900 placeholder-gray-400
                           border border-adani-border rounded-md
                           focus:outline-none focus:ring-2 focus:ring-adani-navy focus:border-adani-navy"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showConfirm ? '🙈' : '👁'}
              </button>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-650 mt-1" role="alert">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 bg-adani-red text-white text-sm font-semibold rounded-lg
                         hover:bg-adani-redDark active:scale-[0.98] transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        )}

        {/* Back to login */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm text-adani-navy hover:text-adani-navyLight underline
                       focus:outline-none focus:ring-2 focus:ring-adani-navy rounded"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
