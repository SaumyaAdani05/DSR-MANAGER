import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { verifyUsername as verifyUsernameService, verifySecurityAnswer as verifySecurityAnswerService, resetPassword } from '../../services/authService';
import { validatePassword } from '../../utils/validators';

const PASSWORD_RULES = [
  { id: 'length', label: '6–12 characters', test: (p) => p.length >= 6 && p.length <= 12 },
  { id: 'upper', label: 'At least one uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'At least one lowercase letter', test: (p) => /[a-z]/.test(p) },
  { id: 'digit', label: 'At least one number', test: (p) => /\d/.test(p) },
  { id: 'special', label: 'At least one special character (@, #, $)', test: (p) => /[@#$]/.test(p) },
];

export default function ForgotPassword() {
  const navigate = useNavigate();

  // Step state: 1 = verify username, 2 = answer security question, 3 = reset password
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1 state
  const [username, setUsername] = useState('');

  // Step 2 state
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');

  // Step 3 state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 1 — Verify username
  const handleVerifyUsername = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('Please enter your username');
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyUsernameService(username.trim());
      setSecurityQuestion(result.securityQuestion);
      if (!result.hasSecurityQuestion) {
        toast.error('No security question set up. Contact administrator.');
        return;
      }
      setStep(2);
    } catch (err) {
      toast.error(err.message || 'Username not found');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 — Verify security answer
  const handleVerifyAnswer = async (e) => {
    e.preventDefault();
    if (!securityAnswer.trim()) {
      toast.error('Please enter your answer');
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifySecurityAnswerService(securityAnswer.trim());
      setCurrentPassword('(verified)');
      setStep(3);
    } catch (err) {
      toast.error(err.message || 'Incorrect answer');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3 — Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword) {
      toast.error('Please enter a new password');
      return;
    }
    if (!validatePassword(newPassword)) {
      toast.error('New password does not meet the requirements');
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
      toast.error(err.message || 'Password reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Password eye-toggle button
  const EyeToggle = ({ show, onToggle }) => (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
      aria-label={show ? 'Hide password' : 'Show password'}
      tabIndex={-1}
    >
      {show ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-adani-navy px-4">
      <h1 className="text-white text-[28px] font-bold mb-8 tracking-tight">
        DSR Manager
      </h1>

      <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-card p-8">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s === step
                  ? 'w-8 bg-adani-red'
                  : s < step
                  ? 'w-2 bg-adani-navy'
                  : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* STEP 1 — Verify Username */}
        {step === 1 && (
          <form onSubmit={handleVerifyUsername} className="flex flex-col gap-5">
            <h2 className="text-lg font-bold text-adani-navy text-center">
              Forgot Password
            </h2>
            <p className="text-sm text-gray-500 text-center -mt-2">
              Enter your username to get started
            </p>

            <div>
              <label htmlFor="fp-username" className="block text-sm font-medium text-gray-700 mb-1.5">
                Username
              </label>
              <input
                id="fp-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={isLoading}
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
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                'Verify'
              )}
            </button>
          </form>
        )}

        {/* STEP 2 — Security Question */}
        {step === 2 && (
          <form onSubmit={handleVerifyAnswer} className="flex flex-col gap-5">
            <h2 className="text-lg font-bold text-adani-navy text-center">
              Security Question
            </h2>

            <div className="bg-adani-lightGray rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700">{securityQuestion}</p>
            </div>

            <div>
              <label htmlFor="fp-answer" className="block text-sm font-medium text-gray-700 mb-1.5">
                Your Answer
              </label>
              <input
                id="fp-answer"
                type="text"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                placeholder="Enter your answer"
                disabled={isLoading}
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
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                'Verify'
              )}
            </button>
          </form>
        )}

        {/* STEP 3 — Reset Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
            <h2 className="text-lg font-bold text-adani-navy text-center">
              Account Recovery
            </h2>

            {/* Revealed credentials */}
            <div className="bg-adani-lightGray rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Username</span>
                <span className="font-semibold text-gray-900">{username}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Current Password</span>
                <span className="font-semibold text-gray-900">{currentPassword || '••••••'}</span>
              </div>
            </div>

            <hr className="border-adani-border" />

            <h3 className="text-sm font-semibold text-adani-navy">Set New Password</h3>

            {/* Password rules */}
            <ul className="space-y-1">
              {PASSWORD_RULES.map((rule) => {
                const passes = newPassword.length > 0 && rule.test(newPassword);
                return (
                  <li key={rule.id} className="flex items-center gap-2 text-xs">
                    {newPassword.length > 0 ? (
                      passes ? (
                        <svg className="h-3.5 w-3.5 text-green-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-3.5 w-3.5 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )
                    ) : (
                      <span className="h-3.5 w-3.5 rounded-full border border-gray-300 shrink-0" />
                    )}
                    <span className={passes ? 'text-green-700' : newPassword.length > 0 ? 'text-red-600' : 'text-gray-500'}>
                      {rule.label}
                    </span>
                  </li>
                );
              })}
            </ul>

            {/* New password */}
            <div>
              <label htmlFor="fp-new-pw" className="block text-sm font-medium text-gray-700 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  id="fp-new-pw"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  disabled={isLoading}
                  className="w-full h-10 px-3 pr-10 text-sm text-gray-900 placeholder-gray-400
                             border border-adani-border rounded-md
                             focus:outline-none focus:ring-2 focus:ring-adani-navy focus:border-adani-navy
                             disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <EyeToggle show={showNewPassword} onToggle={() => setShowNewPassword((v) => !v)} />
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="fp-confirm-pw" className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="fp-confirm-pw"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={isLoading}
                  className="w-full h-10 px-3 pr-10 text-sm text-gray-900 placeholder-gray-400
                             border border-adani-border rounded-md
                             focus:outline-none focus:ring-2 focus:ring-adani-navy focus:border-adani-navy
                             disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <EyeToggle show={showConfirmPassword} onToggle={() => setShowConfirmPassword((v) => !v)} />
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-600 mt-1" role="alert">Passwords do not match</p>
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
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        )}

        {/* Back to login */}
        <div className="mt-5 text-center">
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
