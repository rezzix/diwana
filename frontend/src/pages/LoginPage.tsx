import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { getDevUsers, getAuthConfig, type AuthConfig } from '@/api/auth';
import type { DevUserDto } from '@/types';
import Spinner from '@/components/common/Spinner';

const roleBadge: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  DECLARANT: 'bg-blue-100 text-blue-700',
  CONTROLLER: 'bg-green-100 text-green-700',
};

const roleOrder = ['ADMIN', 'DECLARANT', 'CONTROLLER'];

// Paths that require specific roles — used to prevent redirecting a newly logged-in user to a page they can't access
const pathRoleMap: Record<string, string[]> = {
  '/admin': ['ADMIN'],
  '/declarations/new': ['DECLARANT'],
};

function canAccessPath(path: string, role: string): boolean {
  // Check exact matches first
  if (pathRoleMap[path] && !pathRoleMap[path].includes(role)) return false;
  // Check prefix matches (e.g. /declarations/123/edit requires DECLARANT)
  if (path.startsWith('/declarations/') && path.endsWith('/edit') && role !== 'DECLARANT') return false;
  return true;
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [devUsers, setDevUsers] = useState<DevUserDto[]>([]);
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
  const [showQuickLogin, setShowQuickLogin] = useState(false);
  const { login, error, clearError, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  const safeNavigate = (path: string) => {
    const user = useAuthStore.getState().user;
    if (user && canAccessPath(path, user.role)) {
      navigate(path, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    getAuthConfig(controller.signal).then((config) => {
      if (!controller.signal.aborted) { setAuthConfig(config); useAuthStore.getState().setVersion(config.version); }
    }).catch(() => {});
    getDevUsers(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setDevUsers(data);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const handleSelectUser = async (u: DevUserDto) => {
    setUsername(u.username);
    clearError();
    if (authConfig?.relaxedAuth) {
      // Dev mode: auto-login with known password
      setPassword('ADII4321');
      try {
        await login(u.username, 'ADII4321');
        safeNavigate(from);
      } catch {
        // login will set error state
      }
    }
    // Demo mode: just fill username, user must type password
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      safeNavigate(from);
    } catch {
      // login will set error state
    }
  };

  const relaxedAuth = authConfig?.relaxedAuth ?? false;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900 tracking-tight">Diwana</span>
            {authConfig?.version && (
              <span className="text-xs text-gray-400 font-mono">v{authConfig.version}</span>
            )}
          </div>
          {authConfig && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
              relaxedAuth
                ? 'bg-amber-100 text-amber-800 border-amber-200'
                : 'bg-blue-100 text-blue-800 border-blue-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                relaxedAuth ? 'bg-amber-500' : 'bg-blue-500'
              }`} />
              {authConfig.mode === 'demo' ? 'Demo Mode' : authConfig.mode === 'dev' ? 'Dev Mode' : ''}
            </span>
          )}
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Left branded panel — hidden on mobile */}
        <div className="hidden md:flex md:w-[40%] lg:w-[45%] bg-primary-600 flex-col justify-between p-10 lg:p-14">
          <div>
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center text-lg font-bold backdrop-blur-sm">
                D
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Diwana</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight mb-3">
              Customs Declaration<br />Management
            </h2>
            <p className="text-primary-200 text-sm lg:text-base leading-relaxed max-w-xs">
              Manage customs declarations, track tariff rates, and streamline import/export operations.
            </p>
          </div>

          <ul className="space-y-2.5">
            <li className="flex items-center gap-2.5 text-primary-100 text-sm lg:text-base">
              <span className="text-primary-300 font-medium">▸</span>
              Declaration Management
            </li>
            <li className="flex items-center gap-2.5 text-primary-100 text-sm lg:text-base">
              <span className="text-primary-300 font-medium">▸</span>
              Tariff Rate Lookup
            </li>
            <li className="flex items-center gap-2.5 text-primary-100 text-sm lg:text-base">
              <span className="text-primary-300 font-medium">▸</span>
              Company & User Management
            </li>
          </ul>
        </div>

        {/* Right form panel */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
          <div className="w-full max-w-sm">
            {/* Mobile-only logo */}
            <div className="flex md:hidden items-center gap-2.5 mb-8 justify-center">
              <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center text-lg font-bold">
                D
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">Diwana</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome</h1>
            <p className="text-sm text-gray-500 mb-7">Sign in to your workspace</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              {/* Quick login for dev / demo mode */}
              {authConfig && devUsers.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowQuickLogin(!showQuickLogin)}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5 hover:text-primary-600 transition-colors"
                  >
                    <span className={`text-xs transition-transform ${showQuickLogin ? 'rotate-90' : ''}`}>▸</span>
                    Quick login
                  </button>
                  {showQuickLogin && (
                    <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-2">
                      {(() => {
                        const groups = devUsers.reduce<Record<string, DevUserDto[]>>((acc, u) => {
                          (acc[u.role] ??= []).push(u);
                          return acc;
                        }, {});
                        const orderedRoles = roleOrder.filter(r => groups[r]);
                        const otherRoles = Object.keys(groups).filter(r => !roleOrder.includes(r)).sort();
                        return [...orderedRoles, ...otherRoles].map(role => (
                          <div key={role}>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold mb-1 ${roleBadge[role] || 'bg-gray-100 text-gray-600'}`}>
                              {role}
                            </span>
                            <div className="grid grid-cols-2 gap-1">
                              {groups[role].map((u) => (
                                <button
                                  key={u.username}
                                  type="button"
                                  onClick={() => handleSelectUser(u)}
                                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-left transition-colors ${
                                    username === u.username
                                      ? 'bg-primary-50 border border-primary-300 text-primary-800'
                                      : 'hover:bg-gray-50 border border-transparent text-gray-700'
                                  }`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <span className="truncate font-medium block">{u.displayName}</span>
                                    {u.company && <span className="truncate text-[10px] text-gray-400 block">{u.company}</span>}
                                    {u.customsOffice && <span className="truncate text-[10px] text-green-600 block">{u.customsOffice}</span>}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); clearError(); }}
                  required
                  autoComplete="username"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError(); }}
                  required
                  autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {isLoading && <Spinner className="h-4 w-4" />}
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
