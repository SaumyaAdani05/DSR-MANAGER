import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import ForgotPassword from './components/auth/ForgotPassword';
import SecuritySetup from './components/auth/SecuritySetup';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import HistoryPage from './pages/HistoryPage';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import OfflineBanner from './components/layout/OfflineBanner';

function App() {
  const isOnline = useOnlineStatus();

  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          {!isOnline && <OfflineBanner />}
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/setup"
              element={
                <ProtectedRoute>
                  <SecuritySetup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history/:date"
              element={
                <ProtectedRoute>
                  <HistoryPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '8px',
                background: '#003087',
                color: '#fff',
                fontSize: '14px',
              },
              success: {
                style: { background: '#16A34A' },
              },
              error: {
                style: { background: '#DC2626' },
              },
            }}
          />
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
