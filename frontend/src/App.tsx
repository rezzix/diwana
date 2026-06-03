import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import LoadingScreen from '@/components/common/LoadingScreen';
import LoginPage from '@/pages/LoginPage';
import AdminPage from '@/pages/AdminPage';
import AuthGuard from '@/components/guards/AuthGuard';
import AdminGuard from '@/components/guards/AdminGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import AccessDenied from '@/components/common/AccessDenied';

function HomePage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900 tracking-tight">Diwana</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {user?.firstName} {user?.lastName}
              {user?.companyName && <span className="text-gray-400"> ({user.companyName})</span>}
              <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700">
                {user?.role}
              </span>
            </span>
            <button
              onClick={() => logout()}
              className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome to Diwana customs declaration management.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin"
            className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold text-gray-900">Admin Panel</h2>
            <p className="text-sm text-gray-500 mt-1">ADMIN only</p>
          </Link>
          <Link
            to="/declarations"
            className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold text-gray-900">Declarations</h2>
            <p className="text-sm text-gray-500 mt-1">DECLARANT only</p>
          </Link>
          <Link
            to="/control"
            className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold text-gray-900">Control Desk</h2>
            <p className="text-sm text-gray-500 mt-1">CONTROLLER only</p>
          </Link>
        </div>
      </main>
    </div>
  );
}

function DeclarationsPage() {
  return (
    <div className="min-h-screen bg-surface p-6">
      <Link to="/" className="text-sm text-primary-600 hover:underline">&larr; Back</Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-4">Declarations</h1>
      <p className="text-gray-500 mt-2">Manage customs declarations — DECLARANT only.</p>
    </div>
  );
}

function ControlDeskPage() {
  return (
    <div className="min-h-screen bg-surface p-6">
      <Link to="/" className="text-sm text-primary-600 hover:underline">&larr; Back</Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-4">Control Desk</h1>
      <p className="text-gray-500 mt-2">Review and approve declarations — CONTROLLER only.</p>
    </div>
  );
}

function AppRoutes() {
  const checkSession = useAuthStore((s) => s.checkSession);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <AuthGuard>
            <HomePage />
          </AuthGuard>
        }
      />
      <Route
        path="/admin"
        element={
          <AuthGuard>
            <AdminGuard>
              <AdminPage />
            </AdminGuard>
          </AuthGuard>
        }
      />
      <Route
        path="/declarations"
        element={
          <AuthGuard>
            <RoleGuard roles={['DECLARANT']}>
              <DeclarationsPage />
            </RoleGuard>
          </AuthGuard>
        }
      />
      <Route
        path="/control"
        element={
          <AuthGuard>
            <RoleGuard roles={['CONTROLLER']}>
              <ControlDeskPage />
            </RoleGuard>
          </AuthGuard>
        }
      />
      <Route path="/access-denied" element={<AccessDenied />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
