import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { getDashboardStats, type DashboardStats } from '@/api/dashboard';
import LoadingScreen from '@/components/common/LoadingScreen';
import LoginPage from '@/pages/LoginPage';
import AdminPage from '@/pages/AdminPage';
import CompanyProfilePage from '@/pages/CompanyProfilePage';
import DeclarationsPage from '@/pages/DeclarationsPage';
import CreateDeclarationPage from '@/pages/CreateDeclarationPage';
import EditDeclarationPage from '@/pages/EditDeclarationPage';
import DeclarationDetailPage from '@/pages/DeclarationDetailPage';
import ControlDeskPage from '@/pages/ControlDeskPage';
import AuthGuard from '@/components/guards/AuthGuard';
import AdminGuard from '@/components/guards/AdminGuard';
import RoleGuard from '@/components/guards/RoleGuard';
import AccessDenied from '@/components/common/AccessDenied';

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  INFO_REQUESTED: 'Info Requested',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700',
  INFO_REQUESTED: 'bg-purple-100 text-purple-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const statusCardBg: Record<string, string> = {
  DRAFT: 'bg-gray-50 border-gray-200',
  SUBMITTED: 'bg-blue-50 border-blue-200',
  UNDER_REVIEW: 'bg-amber-50 border-amber-200',
  INFO_REQUESTED: 'bg-purple-50 border-purple-200',
  APPROVED: 'bg-green-50 border-green-200',
  REJECTED: 'bg-red-50 border-red-200',
};

function HomePage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const role = user?.role;
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    getDashboardStats().then(setStats).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900 tracking-tight">Diwana</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {user?.firstName} {user?.lastName}
              {user?.companyName && <span className="text-gray-400"> ({user.companyName})</span>}
              {user?.customsOfficeName && <span className="text-gray-400"> ({user.customsOfficeName})</span>}
              <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700">
                {role}
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

        {/* Stats overview */}
        {stats && role === 'ADMIN' && stats.adminStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{stats.adminStats.totalUsers}</div>
              <div className="text-xs text-gray-500">Total Users</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-700">{stats.adminStats.activeUsers}</div>
              <div className="text-xs text-green-600">Active</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-700">{stats.adminStats.inactiveUsers}</div>
              <div className="text-xs text-red-600">Inactive</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex flex-wrap gap-1">
                {Object.entries(stats.adminStats.byRole).map(([r, c]) => (
                  <span key={r} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary-50 text-primary-700">{r}: {c}</span>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-1">By Role</div>
            </div>
          </div>
        )}

        {stats && role === 'DECLARANT' && stats.declarantStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{stats.declarantStats.totalDeclarations}</div>
              <div className="text-xs text-gray-500">Total Declarations</div>
            </div>
            {Object.entries(stats.declarantStats.byStatus).map(([s, c]) => (
              <div key={s} className={`${statusCardBg[s] || 'bg-gray-50 border-gray-200'} border rounded-lg p-4`}>
                <div className={`text-2xl font-bold ${(statusColors[s] || 'text-gray-700').split(' ')[1]}`}>{c}</div>
                <div className={`text-xs ${(statusColors[s] || 'text-gray-500').split(' ')[1]}`}>{statusLabels[s] || s}</div>
              </div>
            ))}
          </div>
        )}

        {stats && role === 'CONTROLLER' && stats.controllerStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{stats.controllerStats.totalPending}</div>
              <div className="text-xs text-gray-500">Pending Review</div>
            </div>
            {stats.controllerStats.officeName && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm font-bold text-green-700">{stats.controllerStats.officeName}</div>
                <div className="text-xs text-green-600">Your Office</div>
              </div>
            )}
            {Object.entries(stats.controllerStats.byStatus).map(([s, c]) => (
              <div key={s} className={`${statusCardBg[s] || 'bg-gray-50 border-gray-200'} border rounded-lg p-4`}>
                <div className={`text-2xl font-bold ${(statusColors[s] || 'text-gray-700').split(' ')[1]}`}>{c}</div>
                <div className={`text-xs ${(statusColors[s] || 'text-gray-500').split(' ')[1]}`}>{statusLabels[s] || s}</div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {role === 'DECLARANT' && (
            <Link
              to="/company-profile"
              className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <h2 className="font-semibold text-gray-900">Company Profile</h2>
              <p className="text-sm text-gray-500 mt-1">View and edit your company details</p>
            </Link>
          )}
          {role === 'ADMIN' && (
            <Link
              to="/admin"
              className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <h2 className="font-semibold text-gray-900">Admin Panel</h2>
              <p className="text-sm text-gray-500 mt-1">Manage users and system configuration</p>
            </Link>
          )}
          {role === 'DECLARANT' && (
            <Link
              to="/declarations"
              className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <h2 className="font-semibold text-gray-900">Declarations</h2>
              <p className="text-sm text-gray-500 mt-1">Create and manage customs declarations</p>
            </Link>
          )}
          {role === 'CONTROLLER' && (
            <Link
              to="/control"
              className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <h2 className="font-semibold text-gray-900">Control Desk</h2>
              <p className="text-sm text-gray-500 mt-1">Review and process incoming declarations</p>
            </Link>
          )}
        </div>
      </main>
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
        path="/company-profile"
        element={
          <AuthGuard>
            <CompanyProfilePage />
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
        path="/declarations/new"
        element={
          <AuthGuard>
            <RoleGuard roles={['DECLARANT']}>
              <CreateDeclarationPage />
            </RoleGuard>
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
        path="/declarations/:id/edit"
        element={<AuthGuard><RoleGuard roles={['DECLARANT']}><EditDeclarationPage /></RoleGuard></AuthGuard>}
      />
      <Route
        path="/declarations/:id"
        element={<AuthGuard><RoleGuard roles={['DECLARANT', 'CONTROLLER', 'ADMIN']}><DeclarationDetailPage /></RoleGuard></AuthGuard>}
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
