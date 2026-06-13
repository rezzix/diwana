import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { listUsers, createUser, deactivateUser, type CreateUserRequest } from '@/api/users';
import { getCustomsOffices, type CustomsOfficeDto } from '@/api/customsOffices';
import { listCompanies, type CompanyDto } from '@/api/companies';
import { getAllDocumentTypes, createDocumentType, updateDocumentType, deleteDocumentType, formatMandatoryFor, type DocumentTypeDto } from '@/api/documentTypes';
import { getAllTariffRates, createTariffRate, updateTariffRate, deactivateTariffRate } from '@/api/tariffRates';
import type { TariffRateDto } from '@/api/declarations';
import { getOrigins, type OriginDto } from '@/api/origins';
import { listJobs, toggleJob, type JobConfigDto } from '@/api/jobs';
import { listAiModels, createAiModel, updateAiModel, deleteAiModel, getModelResponseTimes, type AiModelDto, type CreateAiModelRequest } from '@/api/aiModels';
import HsCodeAutocomplete from '@/components/HsCodeAutocomplete';
import type { UserDto, PaginationInfo } from '@/types';

const roleBadge: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  DECLARANT: 'bg-blue-100 text-blue-700',
  CONTROLLER: 'bg-green-100 text-green-700',
};

export default function AdminPage({ defaultTab, tabs }: { defaultTab?: string; tabs?: readonly string[] }) {
  // Tab navigation
  const allTabs = ['users', 'document-types', 'tariff-rates', 'jobs', 'ai-models'] as const;
  const allowedTabs = tabs ? allTabs.filter((t) => tabs.includes(t)) : [...allTabs];
  type Tab = typeof allTabs[number];
  const initialTab = (defaultTab && allowedTabs.includes(defaultTab as Tab)) ? defaultTab as Tab : allowedTabs[0] || 'users';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // Users state
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
  const [companies, setCompanies] = useState<CompanyDto[]>([]);
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

  // Document types state
  const [docTypes, setDocTypes] = useState<DocumentTypeDto[]>([]);
  const [docTypesLoading, setDocTypesLoading] = useState(true);
  const [showCreateDocType, setShowCreateDocType] = useState(false);
  const [docTypeForm, setDocTypeForm] = useState({ code: '', name: '', description: '', mandatoryFor: '', importOrder: '' });
  const [docTypeCreating, setDocTypeCreating] = useState(false);
  const [editingDocType, setEditingDocType] = useState<DocumentTypeDto | null>(null);
  const [editDocTypeForm, setEditDocTypeForm] = useState({ code: '', name: '', description: '', mandatoryFor: '', importOrder: '', active: true });

  // Tariff rates state
  const [tariffRates, setTariffRates] = useState<TariffRateDto[]>([]);
  const [tariffRatesLoading, setTariffRatesLoading] = useState(true);
  const [origins, setOrigins] = useState<OriginDto[]>([]);
  const [showCreateTariffRate, setShowCreateTariffRate] = useState(false);
  const [tariffRateForm, setTariffRateForm] = useState({ originCode: '', hsCode: '', description: '', dutyRate: '', vatRate: '', unit: '' });
  const [tariffRateCreating, setTariffRateCreating] = useState(false);
  const [editingTariffRate, setEditingTariffRate] = useState<TariffRateDto | null>(null);
  const [editTariffRateForm, setEditTariffRateForm] = useState({ originCode: '', hsCode: '', description: '', dutyRate: '', vatRate: '', unit: '', active: true });

  // Jobs state
  const [jobs, setJobs] = useState<JobConfigDto[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [togglingJobId, setTogglingJobId] = useState<number | null>(null);

  // AI Models state
  const [aiModels, setAiModels] = useState<AiModelDto[]>([]);
  const [aiModelsLoading, setAiModelsLoading] = useState(true);
  const [responseTimes, setResponseTimes] = useState<Record<string, number>>({});
  const [showCreateAiModel, setShowCreateAiModel] = useState(false);
  const [aiModelForm, setAiModelForm] = useState({ provider: '', model: '', url: '', apiKey: '', type: 'VLM', active: true, deployment: '', callOrder: '', maxTokens: '' });
  const [aiModelCreating, setAiModelCreating] = useState(false);
  const [editingAiModel, setEditingAiModel] = useState<AiModelDto | null>(null);
  const [editAiModelForm, setEditAiModelForm] = useState({ provider: '', model: '', url: '', apiKey: '', type: 'VLM', active: true, deployment: '', callOrder: '', maxTokens: '' });

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

  const fetchDocTypes = async () => {
    setDocTypesLoading(true);
    try {
      const data = await getAllDocumentTypes();
      setDocTypes(data);
    } catch {
      setError('Failed to load document types');
    } finally {
      setDocTypesLoading(false);
    }
  };

  const fetchTariffRates = async () => {
    setTariffRatesLoading(true);
    try {
      const data = await getAllTariffRates();
      setTariffRates(data);
    } catch {
      setError('Failed to load tariff rates');
    } finally {
      setTariffRatesLoading(false);
    }
  };

  const fetchJobs = async () => {
    setJobsLoading(true);
    try {
      const data = await listJobs();
      setJobs(data);
    } catch {
      setError('Failed to load jobs');
    } finally {
      setJobsLoading(false);
    }
  };

  const fetchAiModels = async () => {
    setAiModelsLoading(true);
    try {
      const [data, times] = await Promise.all([listAiModels(), getModelResponseTimes()]);
      setAiModels(data);
      setResponseTimes(times);
    } catch {
      setError('Failed to load AI models');
    } finally {
      setAiModelsLoading(false);
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
    listCompanies()
      .then((data) => {
        if (!controller.signal.aborted) setCompanies(data);
      })
      .catch(() => {});
    getOrigins()
      .then((data) => {
        if (!controller.signal.aborted) setOrigins(data);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (activeTab === 'document-types') {
      fetchDocTypes();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'tariff-rates') {
      fetchTariffRates();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'jobs') {
      fetchJobs();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'ai-models') {
      fetchAiModels();
    }
  }, [activeTab]);

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

  // Document type handlers
  const handleCreateDocType = async (e: FormEvent) => {
    e.preventDefault();
    setDocTypeCreating(true);
    setError('');
    setSuccess('');
    try {
      const { importOrder, ...rest } = docTypeForm;
      await createDocumentType({ ...rest, importOrder: importOrder ? Number(importOrder) : null });
      setSuccess(`Document type "${docTypeForm.name}" created`);
      setShowCreateDocType(false);
      setDocTypeForm({ code: '', name: '', description: '', mandatoryFor: '', importOrder: '' });
      fetchDocTypes();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create document type');
    } finally {
      setDocTypeCreating(false);
    }
  };

  const handleEditDocType = (dt: DocumentTypeDto) => {
    setEditingDocType(dt);
    setEditDocTypeForm({ code: dt.code, name: dt.name, description: dt.description || '', mandatoryFor: dt.mandatoryFor || '', importOrder: dt.importOrder != null ? String(dt.importOrder) : '', active: dt.active });
  };

  const handleUpdateDocType = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingDocType) return;
    setError('');
    setSuccess('');
    try {
      const { importOrder, ...rest } = editDocTypeForm;
      await updateDocumentType(editingDocType.id, { ...rest, importOrder: importOrder ? Number(importOrder) : null });
      setSuccess(`Document type "${editDocTypeForm.name}" updated`);
      setEditingDocType(null);
      fetchDocTypes();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update document type');
    }
  };

  const handleDeleteDocType = async (dt: DocumentTypeDto) => {
    if (!confirm(`Deactivate document type "${dt.name}"?`)) return;
    setError('');
    setSuccess('');
    try {
      await deleteDocumentType(dt.id);
      setSuccess(`Document type "${dt.name}" deactivated`);
      fetchDocTypes();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate document type');
    }
  };

  // Tariff rate handlers
  const handleCreateTariffRate = async (e: FormEvent) => {
    e.preventDefault();
    setTariffRateCreating(true);
    setError('');
    setSuccess('');
    try {
      await createTariffRate({
        originCode: tariffRateForm.originCode || undefined,
        hsCode: tariffRateForm.hsCode,
        description: tariffRateForm.description,
        dutyRate: Number(tariffRateForm.dutyRate),
        vatRate: Number(tariffRateForm.vatRate),
        unit: tariffRateForm.unit || undefined,
      });
      setSuccess(`Tariff rate for "${tariffRateForm.hsCode}" created`);
      setShowCreateTariffRate(false);
      setTariffRateForm({ originCode: '', hsCode: '', description: '', dutyRate: '', vatRate: '', unit: '' });
      fetchTariffRates();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create tariff rate');
    } finally {
      setTariffRateCreating(false);
    }
  };

  const handleEditTariffRate = (tr: TariffRateDto) => {
    setEditingTariffRate(tr);
    setEditTariffRateForm({
      originCode: tr.originCode || '',
      hsCode: tr.hsCode || '',
      description: tr.description,
      dutyRate: String(tr.dutyRate),
      vatRate: String(tr.vatRate),
      unit: tr.unit || '',
      active: tr.active,
    });
  };

  const handleUpdateTariffRate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingTariffRate) return;
    setError('');
    setSuccess('');
    try {
      await updateTariffRate(editingTariffRate.id, {
        originCode: editTariffRateForm.originCode || undefined,
        hsCode: editTariffRateForm.hsCode,
        description: editTariffRateForm.description,
        dutyRate: Number(editTariffRateForm.dutyRate),
        vatRate: Number(editTariffRateForm.vatRate),
        unit: editTariffRateForm.unit || undefined,
        active: editTariffRateForm.active,
      });
      setSuccess(`Tariff rate for "${editTariffRateForm.hsCode}" updated`);
      setEditingTariffRate(null);
      fetchTariffRates();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update tariff rate');
    }
  };

  const handleDeactivateTariffRate = async (tr: TariffRateDto) => {
    if (!confirm(`Deactivate tariff rate for "${tr.hsCode || 'default'}"?`)) return;
    setError('');
    setSuccess('');
    try {
      await deactivateTariffRate(tr.id);
      setSuccess(`Tariff rate for "${tr.hsCode || 'default'}" deactivated`);
      fetchTariffRates();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate tariff rate');
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

        {/* Tab navigation */}
        <div className="flex border-b border-gray-200">
          {allowedTabs.map((tab) => (
            <button key={tab}
              onClick={() => setActiveTab(tab as Tab)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${
                activeTab === tab ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'ai-models' ? 'AI Models' : tab.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Users tab */}
        {activeTab === 'users' && (
          <>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company {form.role === 'DECLARANT' ? '*' : '(optional)'}</label>
                    <select value={form.companyId}
                      onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">{form.role === 'DECLARANT' ? 'Select company...' : 'Not needed for controllers'}</option>
                      {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
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
          </>
        )}

        {/* Document Types tab */}
        {activeTab === 'document-types' && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Manage document types available for declaration attachments.</p>
              <button
                onClick={() => { setShowCreateDocType(!showCreateDocType); setEditingDocType(null); }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
              >
                {showCreateDocType ? 'Cancel' : '+ Add Document Type'}
              </button>
            </div>

            {showCreateDocType && (
              <form onSubmit={handleCreateDocType} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">Add Document Type</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                    <input type="text" required value={docTypeForm.code}
                      onChange={(e) => setDocTypeForm({ ...docTypeForm, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. BILL_OF_LADING"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input type="text" required value={docTypeForm.name}
                      onChange={(e) => setDocTypeForm({ ...docTypeForm, name: e.target.value })}
                      placeholder="e.g. Bill of Lading"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input type="text" value={docTypeForm.description}
                      onChange={(e) => setDocTypeForm({ ...docTypeForm, description: e.target.value })}
                      placeholder="Optional description"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mandatory For</label>
                    <input type="text" value={docTypeForm.mandatoryFor}
                      onChange={(e) => setDocTypeForm({ ...docTypeForm, mandatoryFor: e.target.value })}
                      placeholder="* for all, or HS prefixes: 8471,6109"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    <p className="mt-1 text-xs text-gray-400">Empty = optional, * = all goods, comma-separated HS prefixes = specific goods</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Import Order</label>
                    <input type="number" min="1" value={docTypeForm.importOrder}
                      onChange={(e) => setDocTypeForm({ ...docTypeForm, importOrder: e.target.value })}
                      placeholder="e.g. 1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    <p className="mt-1 text-xs text-gray-400">Empty = not importable. Lower number = higher priority (imported first)</p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="submit" disabled={docTypeCreating}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50 transition-colors">
                    {docTypeCreating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            )}

            {editingDocType && (
              <form onSubmit={handleUpdateDocType} className="bg-amber-50 border border-amber-200 rounded-lg p-6 space-y-4">
                <h2 className="font-semibold text-amber-900">Edit Document Type</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                    <input type="text" required value={editDocTypeForm.code}
                      onChange={(e) => setEditDocTypeForm({ ...editDocTypeForm, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input type="text" required value={editDocTypeForm.name}
                      onChange={(e) => setEditDocTypeForm({ ...editDocTypeForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input type="text" value={editDocTypeForm.description}
                      onChange={(e) => setEditDocTypeForm({ ...editDocTypeForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mandatory For</label>
                    <input type="text" value={editDocTypeForm.mandatoryFor}
                      onChange={(e) => setEditDocTypeForm({ ...editDocTypeForm, mandatoryFor: e.target.value })}
                      placeholder="* for all, or HS prefixes: 8471,6109"
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    <p className="mt-1 text-xs text-amber-600">Empty = optional, * = all goods, comma-separated HS prefixes = specific goods</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Import Order</label>
                    <input type="number" min="1" value={editDocTypeForm.importOrder}
                      onChange={(e) => setEditDocTypeForm({ ...editDocTypeForm, importOrder: e.target.value })}
                      placeholder="e.g. 1"
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    <p className="mt-1 text-xs text-amber-600">Empty = not importable. Lower number = higher priority</p>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editDocTypeForm.active}
                        onChange={(e) => setEditDocTypeForm({ ...editDocTypeForm, active: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setEditingDocType(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50 transition-colors">
                    Save
                  </button>
                </div>
              </form>
            )}

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Code</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Description</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Mandatory For</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-700">Import Order</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-700">Active</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {docTypesLoading ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading...</td></tr>
                  ) : docTypes.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">No document types found</td></tr>
                  ) : docTypes.map((dt) => (
                    <tr key={dt.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{dt.code}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{dt.name}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{dt.description || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          !dt.mandatoryFor ? 'bg-gray-100 text-gray-600' :
                          dt.mandatoryFor === '*' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {formatMandatoryFor(dt.mandatoryFor)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">{dt.importOrder != null ? dt.importOrder : '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block w-2 h-2 rounded-full ${dt.active ? 'bg-green-500' : 'bg-red-500'}`} />
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button onClick={() => { handleEditDocType(dt); setShowCreateDocType(false); }}
                          className="text-xs px-2 py-1 bg-primary-50 text-primary-600 rounded hover:bg-primary-100 transition-colors">
                          Edit
                        </button>
                        {dt.active && (
                          <button onClick={() => handleDeleteDocType(dt)}
                            className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors">
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Tariff Rates tab */}
        {activeTab === 'tariff-rates' && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Manage tariff rates for duty and VAT calculation.</p>
              <button
                onClick={() => { setShowCreateTariffRate(!showCreateTariffRate); setEditingTariffRate(null); }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
              >
                {showCreateTariffRate ? 'Cancel' : '+ Add Tariff Rate'}
              </button>
            </div>

            {showCreateTariffRate && (
              <form onSubmit={handleCreateTariffRate} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">Add Tariff Rate</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
                    <select value={tariffRateForm.originCode}
                      onChange={(e) => setTariffRateForm({ ...tariffRateForm, originCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">None (global default)</option>
                      {origins.map((o) => <option key={o.code} value={o.code}>{o.name} ({o.code})</option>)}
                    </select>
                    <p className="mt-1 text-xs text-gray-400">Leave empty for rates that apply regardless of origin</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">HS Code *</label>
                    <HsCodeAutocomplete
                      tariffRates={tariffRates}
                      value={tariffRateForm.hsCode}
                      onChange={(v) => setTariffRateForm({ ...tariffRateForm, hsCode: v })}
                      onSelect={(_code, desc) => setTariffRateForm({ ...tariffRateForm, description: desc || tariffRateForm.description })}
                      placeholder="e.g. 8471.30"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <input type="text" required value={tariffRateForm.description}
                      onChange={(e) => setTariffRateForm({ ...tariffRateForm, description: e.target.value })}
                      placeholder="e.g. Automatic data processing machines"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duty Rate (%) *</label>
                    <input type="number" step="0.01" min="0" required value={tariffRateForm.dutyRate}
                      onChange={(e) => setTariffRateForm({ ...tariffRateForm, dutyRate: e.target.value })}
                      placeholder="e.g. 5.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">VAT Rate (%) *</label>
                    <input type="number" step="0.01" min="0" required value={tariffRateForm.vatRate}
                      onChange={(e) => setTariffRateForm({ ...tariffRateForm, vatRate: e.target.value })}
                      placeholder="e.g. 20.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <input type="text" value={tariffRateForm.unit}
                      onChange={(e) => setTariffRateForm({ ...tariffRateForm, unit: e.target.value })}
                      placeholder="e.g. kg, pc, m²"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    <p className="mt-1 text-xs text-gray-400">Measurement unit for specific duties</p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="submit" disabled={tariffRateCreating}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50 transition-colors">
                    {tariffRateCreating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            )}

            {editingTariffRate && (
              <form onSubmit={handleUpdateTariffRate} className="bg-amber-50 border border-amber-200 rounded-lg p-6 space-y-4">
                <h2 className="font-semibold text-amber-900">Edit Tariff Rate</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
                    <select value={editTariffRateForm.originCode}
                      onChange={(e) => setEditTariffRateForm({ ...editTariffRateForm, originCode: e.target.value })}
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">None (global default)</option>
                      {origins.map((o) => <option key={o.code} value={o.code}>{o.name} ({o.code})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">HS Code *</label>
                    <HsCodeAutocomplete
                      tariffRates={tariffRates}
                      value={editTariffRateForm.hsCode}
                      onChange={(v) => setEditTariffRateForm({ ...editTariffRateForm, hsCode: v })}
                      onSelect={(_code, desc) => setEditTariffRateForm({ ...editTariffRateForm, description: desc || editTariffRateForm.description })}
                      placeholder="e.g. 8471.30"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <input type="text" required value={editTariffRateForm.description}
                      onChange={(e) => setEditTariffRateForm({ ...editTariffRateForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duty Rate (%) *</label>
                    <input type="number" step="0.01" min="0" required value={editTariffRateForm.dutyRate}
                      onChange={(e) => setEditTariffRateForm({ ...editTariffRateForm, dutyRate: e.target.value })}
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">VAT Rate (%) *</label>
                    <input type="number" step="0.01" min="0" required value={editTariffRateForm.vatRate}
                      onChange={(e) => setEditTariffRateForm({ ...editTariffRateForm, vatRate: e.target.value })}
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <input type="text" value={editTariffRateForm.unit}
                      onChange={(e) => setEditTariffRateForm({ ...editTariffRateForm, unit: e.target.value })}
                      placeholder="e.g. kg, pc, m²"
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editTariffRateForm.active}
                        onChange={(e) => setEditTariffRateForm({ ...editTariffRateForm, active: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setEditingTariffRate(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50 transition-colors">
                    Save
                  </button>
                </div>
              </form>
            )}

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-700">HS Code</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Description</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Origin</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-700">Duty %</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-700">VAT %</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Unit</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-700">Active</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tariffRatesLoading ? (
                    <tr><td colSpan={8} className="text-center py-8 text-gray-400">Loading...</td></tr>
                  ) : tariffRates.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-8 text-gray-400">No tariff rates found</td></tr>
                  ) : tariffRates.map((tr) => (
                    <tr key={tr.id} className={`border-b border-gray-100 hover:bg-gray-50 ${!tr.active ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{tr.hsCode || '—'}</td>
                      <td className="px-4 py-3 text-gray-900">{tr.description}</td>
                      <td className="px-4 py-3 text-gray-600">{tr.originName || <span className="text-gray-400 italic">Global</span>}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{tr.dutyRate}%</td>
                      <td className="px-4 py-3 text-right text-gray-600">{tr.vatRate}%</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{tr.unit || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block w-2 h-2 rounded-full ${tr.active ? 'bg-green-500' : 'bg-red-500'}`} />
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button onClick={() => { handleEditTariffRate(tr); setShowCreateTariffRate(false); }}
                          className="text-xs px-2 py-1 bg-primary-50 text-primary-600 rounded hover:bg-primary-100 transition-colors">
                          Edit
                        </button>
                        {tr.active && (
                          <button onClick={() => handleDeactivateTariffRate(tr)}
                            className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors">
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Jobs tab */}
        {activeTab === 'jobs' && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Manage scheduled jobs. Disabled jobs will not run until re-enabled.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Job Name</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-700">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Last Run</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobsLoading ? (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400">Loading...</td></tr>
                  ) : jobs.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400">No jobs found</td></tr>
                  ) : jobs.map((job) => (
                    <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900 font-mono text-xs">{job.name}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                          job.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${job.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                          {job.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {job.lastRunAt ? new Date(job.lastRunAt).toLocaleString() : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={async () => {
                            setTogglingJobId(job.id);
                            try {
                              await toggleJob(job.id);
                              await fetchJobs();
                            } catch {
                              setError('Failed to toggle job');
                            } finally {
                              setTogglingJobId(null);
                            }
                          }}
                          disabled={togglingJobId === job.id}
                          className={`text-xs px-2 py-1 rounded transition-colors ${
                            job.enabled
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          } disabled:opacity-50`}
                        >
                          {togglingJobId === job.id ? 'Toggling...' : job.enabled ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* AI Models tab */}
        {activeTab === 'ai-models' && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Manage AI models used for VLM/LLM inference. Models are used for smart import and other AI features.</p>
              <button
                onClick={() => { setShowCreateAiModel(!showCreateAiModel); setEditingAiModel(null); }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
              >
                {showCreateAiModel ? 'Cancel' : '+ Add AI Model'}
              </button>
            </div>

            {showCreateAiModel && (
              <form onSubmit={async (e) => {
                e.preventDefault();
                setAiModelCreating(true);
                setError('');
                setSuccess('');
                try {
                  await createAiModel({
                    provider: aiModelForm.provider,
                    model: aiModelForm.model,
                    url: aiModelForm.url,
                    apiKey: aiModelForm.apiKey,
                    type: aiModelForm.type,
                    active: aiModelForm.active,
                    deployment: aiModelForm.deployment || null,
                    callOrder: aiModelForm.callOrder ? Number(aiModelForm.callOrder) : null,
                    maxTokens: aiModelForm.maxTokens ? Number(aiModelForm.maxTokens) : null,
                  });
                  setSuccess(`AI model "${aiModelForm.model}" created`);
                  setShowCreateAiModel(false);
                  setAiModelForm({ provider: '', model: '', url: '', apiKey: '', type: 'VLM', active: true, deployment: '', callOrder: '', maxTokens: '' });
                  fetchAiModels();
                } catch (err: unknown) {
                  setError(err instanceof Error ? err.message : 'Failed to create AI model');
                } finally {
                  setAiModelCreating(false);
                }
              }} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">Add AI Model</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provider *</label>
                    <input type="text" required value={aiModelForm.provider}
                      onChange={(e) => setAiModelForm({ ...aiModelForm, provider: e.target.value })}
                      placeholder="e.g. Together AI"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                    <input type="text" required value={aiModelForm.model}
                      onChange={(e) => setAiModelForm({ ...aiModelForm, model: e.target.value })}
                      placeholder="e.g. google/gemma-4-31B-it"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                    <input type="url" required value={aiModelForm.url}
                      onChange={(e) => setAiModelForm({ ...aiModelForm, url: e.target.value })}
                      placeholder="e.g. https://api.together.ai/v1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key *</label>
                    <input type="password" required value={aiModelForm.apiKey}
                      onChange={(e) => setAiModelForm({ ...aiModelForm, apiKey: e.target.value })}
                      placeholder="API key"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select value={aiModelForm.type}
                      onChange={(e) => setAiModelForm({ ...aiModelForm, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="VLM">VLM (Vision)</option>
                      <option value="LLM">LLM (Text only)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deployment</label>
                    <select value={aiModelForm.deployment}
                      onChange={(e) => setAiModelForm({ ...aiModelForm, deployment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">— Select —</option>
                      <option value="local">Local</option>
                      <option value="remote">Remote</option>
                      <option value="serverless">Serverless</option>
                      <option value="dedicated">Dedicated</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Call Order</label>
                    <input type="number" min="1" value={aiModelForm.callOrder}
                      onChange={(e) => setAiModelForm({ ...aiModelForm, callOrder: e.target.value })}
                      placeholder="e.g. 1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    <p className="mt-1 text-xs text-gray-400">Empty = not auto-used. Lower = higher priority.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Tokens</label>
                    <input type="number" min="1" value={aiModelForm.maxTokens}
                      onChange={(e) => setAiModelForm({ ...aiModelForm, maxTokens: e.target.value })}
                      placeholder="e.g. 16384"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    <p className="mt-1 text-xs text-gray-400">Max output tokens. Empty = default (4096).</p>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={aiModelForm.active}
                        onChange={(e) => setAiModelForm({ ...aiModelForm, active: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="submit" disabled={aiModelCreating}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50 transition-colors">
                    {aiModelCreating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            )}

            {editingAiModel && (
              <form onSubmit={async (e) => {
                e.preventDefault();
                setError('');
                setSuccess('');
                try {
                  await updateAiModel(editingAiModel.id, {
                    provider: editAiModelForm.provider,
                    model: editAiModelForm.model,
                    url: editAiModelForm.url,
                    apiKey: editAiModelForm.apiKey,
                    type: editAiModelForm.type,
                    active: editAiModelForm.active,
                    deployment: editAiModelForm.deployment || null,
                    callOrder: editAiModelForm.callOrder ? Number(editAiModelForm.callOrder) : null,
                    maxTokens: editAiModelForm.maxTokens ? Number(editAiModelForm.maxTokens) : null,
                  });
                  setSuccess(`AI model "${editAiModelForm.model}" updated`);
                  setEditingAiModel(null);
                  fetchAiModels();
                } catch (err: unknown) {
                  setError(err instanceof Error ? err.message : 'Failed to update AI model');
                }
              }} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">Edit AI Model</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                    <input type="text" required value={editAiModelForm.provider}
                      onChange={(e) => setEditAiModelForm({ ...editAiModelForm, provider: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <input type="text" required value={editAiModelForm.model}
                      onChange={(e) => setEditAiModelForm({ ...editAiModelForm, model: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                    <input type="url" required value={editAiModelForm.url}
                      onChange={(e) => setEditAiModelForm({ ...editAiModelForm, url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                    <input type="password" required value={editAiModelForm.apiKey}
                      onChange={(e) => setEditAiModelForm({ ...editAiModelForm, apiKey: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select value={editAiModelForm.type}
                      onChange={(e) => setEditAiModelForm({ ...editAiModelForm, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="VLM">VLM (Vision)</option>
                      <option value="LLM">LLM (Text only)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deployment</label>
                    <select value={editAiModelForm.deployment}
                      onChange={(e) => setEditAiModelForm({ ...editAiModelForm, deployment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">— Select —</option>
                      <option value="local">Local</option>
                      <option value="remote">Remote</option>
                      <option value="serverless">Serverless</option>
                      <option value="dedicated">Dedicated</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Call Order</label>
                    <input type="number" min="1" value={editAiModelForm.callOrder}
                      onChange={(e) => setEditAiModelForm({ ...editAiModelForm, callOrder: e.target.value })}
                      placeholder="e.g. 1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    <p className="mt-1 text-xs text-gray-400">Empty = not auto-used. Lower = higher priority.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Tokens</label>
                    <input type="number" min="1" value={editAiModelForm.maxTokens}
                      onChange={(e) => setEditAiModelForm({ ...editAiModelForm, maxTokens: e.target.value })}
                      placeholder="e.g. 16384"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    <p className="mt-1 text-xs text-gray-400">Max output tokens. Empty = default (4096).</p>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editAiModelForm.active}
                        onChange={(e) => setEditAiModelForm({ ...editAiModelForm, active: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setEditingAiModel(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors">Save</button>
                </div>
              </form>
            )}

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Provider</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Model</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-700">Type</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-700">Deployment</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-700">Order</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-700">Max Tokens</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-700">Avg Time</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-700">Active</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {aiModelsLoading ? (
                    <tr><td colSpan={9} className="text-center py-8 text-gray-400">Loading...</td></tr>
                  ) : aiModels.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-8 text-gray-400">No AI models found</td></tr>
                  ) : aiModels.map((m) => (
                    <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{m.provider}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{m.model}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          m.type === 'VLM' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>{m.type}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                          {m.deployment || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">
                        {m.callOrder != null ? m.callOrder : '—'}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">
                        {responseTimes[m.model] != null
                          ? responseTimes[m.model] >= 1000
                            ? `${(responseTimes[m.model] / 1000).toFixed(1)}s`
                            : `${responseTimes[m.model]}ms`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block w-2 h-2 rounded-full ${m.active ? 'bg-green-500' : 'bg-red-500'}`} />
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {m.callOrder !== 1 && (
                          <button onClick={async () => {
                            setError(''); setSuccess('');
                            try {
                              // Promote this model to order 1, shift all other ordered models up by 1
                              const updates = aiModels
                                .filter((o) => o.callOrder != null || o.id === m.id)
                                .map((o) => updateAiModel(o.id, {
                                  provider: o.provider, model: o.model, url: o.url, apiKey: o.apiKey,
                                  type: o.type, active: o.active, deployment: o.deployment,
                                  callOrder: o.id === m.id ? 1 : (o.callOrder ?? 0) + 1,
                                  maxTokens: o.maxTokens,
                                }));
                              await Promise.all(updates);
                              setSuccess(`"${m.model}" set as default`);
                              fetchAiModels();
                            } catch { setError('Failed to set default model'); }
                          }}
                            className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded hover:bg-amber-100 transition-colors"
                            title="Set as default (order 1)">
                            Set default
                          </button>
                        )}
                        {m.callOrder === 1 && (
                          <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded font-medium">Default</span>
                        )}
                        <button onClick={() => {
                          setEditingAiModel(m);
                          setEditAiModelForm({ provider: m.provider, model: m.model, url: m.url, apiKey: m.apiKey, type: m.type, active: m.active, deployment: m.deployment || '', callOrder: m.callOrder != null ? String(m.callOrder) : '', maxTokens: m.maxTokens != null ? String(m.maxTokens) : '' });
                          setShowCreateAiModel(false);
                        }}
                          className="text-xs px-2 py-1 bg-primary-50 text-primary-600 rounded hover:bg-primary-100 transition-colors">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}