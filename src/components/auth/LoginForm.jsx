import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { checkLockout, recordFailure, resetAttempts } from '../../utils/rateLimiter';

export default function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // CAPTCHA state
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
    if (email.trim()) {
      const lockout = checkLockout(email.trim());
      setAttemptsCount(lockout.attempts);
      if (lockout.attempts >= 3 && !captchaChallenge) {
        generateCaptcha();
      }
    }
  }, [email]);

  const handleLogin = async (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password.trim()) {
      toast.error('Please enter both email and password');
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
      // Apply progressive delay if needed
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
        toast.error(err.message || 'Invalid email or password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-5">
      {/* Username */}
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Username
        </label>
        <input
          id="username"
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your username"
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
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Password
        </label>
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

      {/* Math CAPTCHA Challenge */}
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
    </form>
  );
}
