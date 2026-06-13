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
    <div className="min-h-screen flex flex-col items-center justify-center bg-adani-navy px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-adani-navyLight opacity-20" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-adani-navyLight opacity-10" />
      </div>

      {/* Title */}
      <div className="relative z-10 mb-8 text-center">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          DSR Manager
        </h1>
        <p className="mt-2 text-sm text-blue-200 opacity-80">
          Daily Sales Record Management
        </p>
      </div>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-[400px] bg-white rounded-2xl shadow-2xl p-8">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-adani-navy">Welcome Back</h2>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to your account
          </p>
        </div>

        <LoginForm />

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/forgot-password')}
            className="text-sm text-adani-navy hover:text-adani-navyLight font-medium underline-offset-2 hover:underline transition-colors"
          >
            Forgot Password / Username?
          </button>
        </div>
      </div>

      {/* Footer */}
      <p className="relative z-10 mt-8 text-xs text-blue-200 opacity-60 text-center">
        Gas Station DSR Manager &middot; v1.0
      </p>
    </div>
  );
};

export default LoginPage;
