import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { listUsers, createUser, deactivateUser, type CreateUserRequest } from '@/api/users';
import { getCustomsOffices, type CustomsOfficeDto } from '@/api/customsOffices';
import type { UserDto, PaginationInfo } from '@/types';

const roleBadge: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  DECLARANT: 'bg-blue-100 text-blue-700',
  CONTROLLER: 'bg-green-100 text-green-700',
};

export default function AdminPage() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create user form
  const [showCreate, setShowCreate] = useState(false);
  const [customsOffices, setCustomsOffices] = useState<CustomsOfficeDto[]>([]);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'DECLARANT' as 'DECLARANT' | 'CONTROLLER',
    companyId: '',
    customsOfficeId: '',
  });
  const [creating, setCreating] = useState(false);

  const fetchUsers = async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = { page, size: 20 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await listUsers(params, signal);
      if (signal?.aborted) return;
      setUsers(res.data);
      setPagination(res.pagination);
    } catch (err) {
      if (axios.isCancel(err)) return;
      if (!signal?.aborted) setError('Failed to load users');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchUsers(controller.signal);
    return () => controller.abort();
  }, [page, roleFilter]);

  useEffect(() => {
    const controller = new AbortController();
    getCustomsOffices(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setCustomsOffices(data);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
      });
    return () => controller.abort();
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchUsers();
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccess('');
    try {
      const data: CreateUserRequest = {
        username: form.username,
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        role: form.role,
        companyId: form.companyId ? Number(form.companyId) : null,
        customsOfficeId: form.customsOfficeId ? Number(form.customsOfficeId) : null,
      };
      await createUser(data);
      setSuccess(`User ${form.username} created successfully`);
      setShowCreate(false);
      setForm({ username: '', email: '', password: '', firstName: '', lastName: '', role: 'DECLARANT', companyId: '', customsOfficeId: '' });
      fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (user: UserDto) => {
    if (!confirm(`Deactivate ${user.firstName} ${user.lastName} (${user.username})?`)) return;
    setError('');
    setSuccess('');
    try {
      await deactivateUser(user.id);
      setSuccess(`User ${user.username} deactivated`);
      fetchUsers();
    } catch {
      setError('Failed to deactivate user');
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-primary-600 hover:underline">&larr; Dashboard</Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">{success}</div>
        )}

        {/* Actions bar */}
        <div className="flex items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="flex items-center gap-3 flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
            />
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All roles</option>
              <option value="ADMIN">Admin</option>
              <option value="DECLARANT">Declarant</option>
              <option value="CONTROLLER">Controller</option>
            </select>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors">
              Search
            </button>
          </form>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
          >
            {showCreate ? 'Cancel' : '+ Create User'}
          </button>
        </div>

        {/* Create user form */}
        {showCreate && (
          <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Create New User</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <input type="text" required value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" required value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input type="text" required value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input type="text" required value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input type="password" required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as 'DECLARANT' | 'CONTROLLER' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="DECLARANT">Declarant</option>
                  <option value="CONTROLLER">Controller</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company ID {form.role === 'DECLARANT' ? '*' : '(optional)'}</label>
                <input type="number" value={form.companyId}
                  onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                  placeholder={form.role === 'DECLARANT' ? 'Required for declarants' : 'Not needed for controllers'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              {form.role === 'CONTROLLER' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customs Office *</label>
                  <select value={form.customsOfficeId}
                    onChange={(e) => setForm({ ...form, customsOfficeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="">Select office...</option>
                    {customsOffices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowCreate(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={creating}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50 transition-colors">
                {creating ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        )}

        {/* Users table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-700">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Username</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Company / Office</th>
                <th className="text-center px-4 py-3 font-medium text-gray-700">Active</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No users found</td></tr>
              ) : users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{user.firstName} {user.lastName}</td>
                  <td className="px-4 py-3 text-gray-600">{user.username}</td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${roleBadge[user.role] || 'bg-gray-100 text-gray-600'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {user.role === 'CONTROLLER' ? (user.customsOfficeName || '—') : (user.companyName || '—')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block w-2 h-2 rounded-full ${user.active ? 'bg-green-500' : 'bg-red-500'}`} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {user.active && user.role !== 'ADMIN' && (
                      <button
                        onClick={() => handleDeactivate(user)}
                        className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Showing page {pagination.page + 1} of {pagination.totalPages} ({pagination.total} total)</span>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
