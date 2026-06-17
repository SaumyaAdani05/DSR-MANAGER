import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ShiftProvider } from './context/ShiftContext';
import { SyncProvider } from './context/SyncContext';
import { SettingsProvider } from './context/SettingsContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import SecuritySetup from './components/auth/SecuritySetup';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import HistoryPage from './pages/HistoryPage';
import CalendarPage from './pages/CalendarPage';
import PartyManagementPage from './pages/PartyManagementPage';
import BillsPage from './pages/BillsPage';
import AttendancePage from './pages/AttendancePage';
import EmployeeProfilePage from './pages/EmployeeProfilePage';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import OfflineBanner from './components/layout/OfflineBanner';

function App() {
  const isOnline = useOnlineStatus();

  return (
    <BrowserRouter>
      <AuthProvider>
        <ShiftProvider>
          <SyncProvider>
            <SettingsProvider>
              {!isOnline && <OfflineBanner />}
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
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
              path="/dashboard/:date"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <CalendarPage />
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
            <Route
              path="/parties"
              element={
                <ProtectedRoute>
                  <PartyManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bills"
              element={
                <ProtectedRoute>
                  <BillsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute>
                  <AttendancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance/employee/:id"
              element={
                <ProtectedRoute>
                  <EmployeeProfilePage />
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
       </SyncProvider>
      </ShiftProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
