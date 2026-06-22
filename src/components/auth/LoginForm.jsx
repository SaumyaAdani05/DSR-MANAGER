import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { checkLockout, recordFailure, resetAttempts } from '../../utils/rateLimiter';
import { validatePassword, getPasswordErrors } from '../../utils/validators.js';

export default function LoginForm() {
  const navigate = useNavigate();
  const { login, register, loginGoogle } = useAuth();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' or 'register'

  // Common inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register-only inputs
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [regSuccessMessage, setRegSuccessMessage] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // CAPTCHA state for Login
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [captchaChallenge, setCaptchaChallenge] = useState(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 9) + 2;
    const num2 = Math.floor(Math.random() * 9) + 2;
    setCaptchaChallenge({ num1, num2, result: num1 + num2 });
    setCaptchaAnswer('');
  };

  useEffect(() => {
    if (activeTab === 'signin' && email.trim()) {
      const lockout = checkLockout(email.trim());
      setAttemptsCount(lockout.attempts);
      if (lockout.attempts >= 3 && !captchaChallenge) {
        generateCaptcha();
      }
    }
  }, [email, activeTab]);

  const handleLogin = async (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password.trim()) {
      toast.error('Please enter both email/username and password');
      return;
    }

    // Check rate limit lockout
    const lockout = checkLockout(trimmedEmail);
    if (lockout.locked) {
      toast.error(`Too many failed attempts. Try again in ${lockout.remainingTime} seconds.`);
      return;
    }

    // Check CAPTCHA if attempts are high
    if (lockout.attempts >= 3) {
      if (!captchaChallenge) {
        generateCaptcha();
        toast.error('Please solve the CAPTCHA to continue.');
        return;
      }
      if (parseInt(captchaAnswer) !== captchaChallenge.result) {
        toast.error('Incorrect CAPTCHA answer.');
        generateCaptcha();
        recordFailure(trimmedEmail);
        return;
      }
    }

    setIsLoading(true);
    try {
      if (lockout.delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, lockout.delayMs));
      }

      const session = await login(trimmedEmail, password);
      resetAttempts(trimmedEmail);
      toast.success('Successfully logged in');

      if (session.isFirstLogin) {
        navigate('/setup');
      } else {
        navigate('/');
      }
    } catch (err) {
      recordFailure(trimmedEmail);
      const updatedLockout = checkLockout(trimmedEmail);
      setAttemptsCount(updatedLockout.attempts);

      if (updatedLockout.attempts >= 3) {
        generateCaptcha();
      }

      if (!navigator.onLine) {
        toast.error('No internet connection');
      } else {
        toast.error(err.message || 'Invalid credentials');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password.trim()) {
      toast.error('Please enter email and password');
      return;
    }

    // Validate email formatting
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate password rules
    if (!validatePassword(password)) {
      toast.error('Password does not meet strength requirements');
      return;
    }

    // Confirm passwords match
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const result = await register(trimmedEmail, password);
      if (result.requiresVerification) {
        setRegSuccessMessage('Registration successful! Please check your email to verify your account.');
        toast.success('Account created! Verification email sent.');
      } else {
        toast.success('Successfully registered and logged in');
        navigate('/setup');
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await loginGoogle();
    } catch (err) {
      toast.error(err.message || 'Google login failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Selectors */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => {
            setActiveTab('signin');
            setRegSuccessMessage('');
          }}
          className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'signin'
              ? 'border-adani-navy text-adani-navy'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('register');
            setRegSuccessMessage('');
          }}
          className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'register'
              ? 'border-adani-navy text-adani-navy'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Register
        </button>
      </div>

      {regSuccessMessage ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-5 text-center animate-fade-in">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-3">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 19v-8.93a2 2 0 01.89-1.664l8-4.615a2 2 0 012.22 0l8 4.615A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-green-800 mb-1">Check your email</h3>
          <p className="text-xs text-green-700 leading-relaxed">
            {regSuccessMessage}
          </p>
          <button
            onClick={() => {
              setRegSuccessMessage('');
              setActiveTab('signin');
            }}
            className="mt-4 text-xs font-semibold text-adani-navy hover:text-adani-navyLight underline"
          >
            Back to Sign In
          </button>
        </div>
      ) : activeTab === 'signin' ? (
        /* SIGN IN FORM */
        <form onSubmit={handleLogin} className="flex flex-col gap-5 animate-fade-in">
          {/* Email / Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Email or Username
            </label>
            <input
              id="username"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email or username"
              autoComplete="username"
              disabled={isLoading}
              className="w-full h-10 px-3 text-sm text-gray-900 placeholder-gray-400
                         border border-adani-border rounded-md
                         focus:outline-none focus:ring-2 focus:ring-adani-navy focus:border-adani-navy
                         disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-adani-navy hover:text-adani-navyLight hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={isLoading}
                className="w-full h-10 px-3 pr-10 text-sm text-gray-900 placeholder-gray-400
                           border border-adani-border rounded-md
                           focus:outline-none focus:ring-2 focus:ring-adani-navy focus:border-adani-navy
                           disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500
                           hover:text-gray-700 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? (
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
            </div>
          </div>

          {/* CAPTCHA Challenge */}
          {attemptsCount >= 3 && captchaChallenge && (
            <div className="bg-gray-50 border border-adani-border rounded-md p-3.5 space-y-2 animate-fade-in">
              <label htmlFor="captcha" className="block text-xs font-semibold text-gray-700">
                Security Check: Solve the math puzzle
              </label>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-adani-navy tracking-wide select-none">
                  {captchaChallenge.num1} + {captchaChallenge.num2} =
                </span>
                <input
                  id="captcha"
                  type="number"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder="?"
                  disabled={isLoading}
                  className="w-20 h-8 px-2 text-center text-sm text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-adani-navy"
                />
              </div>
            </div>
          )}

          {/* Login button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 mt-1 bg-adani-red text-white text-sm font-semibold rounded-lg
                       hover:bg-adani-redDark active:scale-[0.98] transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              'LOGIN'
            )}
          </button>

          {/* Social login divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-xs font-medium uppercase tracking-wider">or sign in with</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Google Login button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-10 bg-white border border-gray-300 rounded-lg flex items-center justify-center gap-2.5
                       text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.98]
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign in with Google
          </button>
        </form>
      ) : (
        /* REGISTER FORM */
        <form onSubmit={handleRegister} className="flex flex-col gap-5 animate-fade-in">
          {/* Email */}
          <div>
            <label
              htmlFor="reg-email"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Email Address
            </label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              disabled={isLoading}
              className="w-full h-10 px-3 text-sm text-gray-900 placeholder-gray-400
                         border border-adani-border rounded-md
                         focus:outline-none focus:ring-2 focus:ring-adani-navy focus:border-adani-navy
                         disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="reg-password"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                autoComplete="new-password"
                disabled={isLoading}
                className="w-full h-10 px-3 pr-10 text-sm text-gray-900 placeholder-gray-400
                           border border-adani-border rounded-md
                           focus:outline-none focus:ring-2 focus:ring-adani-navy focus:border-adani-navy
                           disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500
                           hover:text-gray-700 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="reg-confirm-password"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="reg-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                autoComplete="new-password"
                disabled={isLoading}
                className="w-full h-10 px-3 pr-10 text-sm text-gray-900 placeholder-gray-400
                           border border-adani-border rounded-md
                           focus:outline-none focus:ring-2 focus:ring-adani-navy focus:border-adani-navy
                           disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500
                           hover:text-gray-700 focus:outline-none"
                tabIndex={-1}
              >
                {showConfirmPassword ? '🙈' : '👁'}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-650 mt-1" role="alert">Passwords do not match</p>
            )}
          </div>

          {/* Password Checklist */}
          <ul className="space-y-1.5 bg-gray-50 p-3.5 rounded-lg border border-gray-200">
            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Password Strength Checklist</span>
            {[
              'Minimum 6 characters',
              'Maximum 12 characters',
              'At least one lowercase letter',
              'At least one uppercase letter',
              'At least one number',
              'At least one special character (@, #, $)'
            ].map((rule, idx) => {
              const passwordErrors = getPasswordErrors(password);
              const passes = password.length > 0 && !passwordErrors.includes(rule);
              return (
                <li key={idx} className="flex items-center gap-2 text-[11px]">
                  {password.length > 0 ? (
                    passes ? (
                      <span className="text-green-600 font-bold">✓</span>
                    ) : (
                      <span className="text-red-500 font-bold">✗</span>
                    )
                  ) : (
                    <span className="h-3 w-3 rounded-full border border-gray-350 shrink-0 bg-white" />
                  )}
                  <span className={passes ? 'text-green-700 font-medium' : password.length > 0 ? 'text-red-650 font-medium' : 'text-gray-500'}>
                    {rule}
                  </span>
                </li>
              );
            })}
          </ul>

          {/* Register button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 bg-adani-navy text-white text-sm font-semibold rounded-lg
                       hover:bg-adani-navyDark active:scale-[0.98] transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              'REGISTER'
            )}
          </button>
        </form>
      )}
    </div>
  );
}
