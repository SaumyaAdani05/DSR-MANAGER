import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/auth/LoginForm';

const LoginPage = () => {
  const { isAuthenticated, isFirstLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      if (isFirstLogin) {
        navigate('/setup', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, isFirstLogin, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center header-gradient px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white opacity-[0.04]" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-white opacity-[0.03]" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-adani-red opacity-[0.06] blur-3xl" />
      </div>

      {/* Title with staggered animation */}
      <div className="relative z-10 mb-8 text-center animate-fade-in-up" style={{ animationDelay: '0ms' }}>
        {/* Logo icon */}
        <div className="flex items-center justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 shadow-lg">
            <svg
              className="h-8 w-8 text-white"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          DSR Manager
        </h1>
        <p className="mt-2 text-sm text-blue-200/80">
          Daily Sales Record Management
        </p>
      </div>

      {/* Login card with staggered animation */}
      <div
        className="relative z-10 w-full max-w-[400px] bg-white rounded-2xl shadow-2xl p-8 ring-1 ring-black/5 animate-fade-in-up"
        style={{ animationDelay: '100ms', animationFillMode: 'both' }}
      >
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-adani-navy tracking-tight">Welcome Back</h2>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to your account
          </p>
        </div>

        <LoginForm />

      </div>

      {/* Footer with staggered animation */}
      <p
        className="relative z-10 mt-8 text-xs text-blue-200/50 text-center animate-fade-in-up"
        style={{ animationDelay: '200ms', animationFillMode: 'both' }}
      >
        Gas Station DSR Manager &middot; v3.0
      </p>
    </div>
  );
};

export default LoginPage;
