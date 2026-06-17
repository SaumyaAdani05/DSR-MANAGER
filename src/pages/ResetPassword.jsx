import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/forgot-password', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-adani-navy text-white text-sm">
      Redirecting to recovery portal...
    </div>
  );
}
