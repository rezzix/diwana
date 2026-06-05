import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { getMyCompany, updateCompany } from '@/api/companies';
import type { CompanyDto } from '@/types';
import { useAuthStore } from '@/stores/authStore';

export default function CompanyProfilePage() {
  const user = useAuthStore((s) => s.user);
  const [company, setCompany] = useState<CompanyDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    ice: '',
    rc: '',
    nif: '',
    vatNumber: '',
    address: '',
    phone: '',
    email: '',
    bankName: '',
    bankIban: '',
    bankSwift: '',
    customsCode: '',
  });

  useEffect(() => {
    const controller = new AbortController();
    getMyCompany(controller.signal)
      .then((c) => {
        if (controller.signal.aborted) return;
        if (c) {
          setCompany(c);
          setForm({
            name: c.name || '',
            ice: c.ice || '',
            rc: c.rc || '',
            nif: c.nif || '',
            vatNumber: c.vatNumber || '',
            address: c.address || '',
            phone: c.phone || '',
            email: c.email || '',
            bankName: c.bankName || '',
            bankIban: c.bankIban || '',
            bankSwift: c.bankSwift || '',
            customsCode: c.customsCode || '',
          });
        }
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setError('Failed to load company profile');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await updateCompany(company.id, form);
      setCompany(updated);
      setSuccess('Company profile updated successfully');
    } catch {
      setError('Failed to update company profile');
    } finally {
      setSaving(false);
    }
  };

  const isDeclarant = user?.role === 'DECLARANT' || user?.role === 'ADMIN';

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-surface">
        <header className="bg-white border-b border-gray-200 px-6 py-3">
          <Link to="/" className="text-sm text-primary-600 hover:underline">&larr; Dashboard</Link>
        </header>
        <main className="max-w-2xl mx-auto p-6 text-center text-gray-500">
          <p className="mt-8">No company profile available for your account.</p>
          <p className="text-sm text-gray-400 mt-2">Only declarant users assigned to a company have a profile.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-primary-600 hover:underline">&larr; Dashboard</Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-lg font-bold text-gray-900">Company Profile</h1>
          </div>
          {company && (
            <span className="text-xs text-gray-400 font-mono">{company.key}</span>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company info */}
          <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Company Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input type="text" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={!isDeclarant}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input type="text" value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  disabled={!isDeclarant}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500" />
              </div>
            </div>
          </section>

          {/* Legal & Tax Info */}
          <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Legal & Tax Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ICE</label>
                <input type="text" value={form.ice}
                  onChange={(e) => setForm({ ...form, ice: e.target.value })}
                  disabled={!isDeclarant}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RC</label>
                <input type="text" value={form.rc}
                  onChange={(e) => setForm({ ...form, rc: e.target.value })}
                  disabled={!isDeclarant}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIF</label>
                <input type="text" value={form.nif}
                  onChange={(e) => setForm({ ...form, nif: e.target.value })}
                  disabled={!isDeclarant}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">VAT Number</label>
                <input type="text" value={form.vatNumber}
                  onChange={(e) => setForm({ ...form, vatNumber: e.target.value })}
                  disabled={!isDeclarant}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="text" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  disabled={!isDeclarant}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={!isDeclarant}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500" />
              </div>
            </div>
          </section>

          {/* Bank Details */}
          <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Bank Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                <input type="text" value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  disabled={!isDeclarant}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
                <input type="text" value={form.bankIban}
                  onChange={(e) => setForm({ ...form, bankIban: e.target.value })}
                  disabled={!isDeclarant}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500 font-mono text-xs" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SWIFT/BIC</label>
                <input type="text" value={form.bankSwift}
                  onChange={(e) => setForm({ ...form, bankSwift: e.target.value })}
                  disabled={!isDeclarant}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customs Code</label>
                <input type="text" value={form.customsCode}
                  onChange={(e) => setForm({ ...form, customsCode: e.target.value })}
                  disabled={!isDeclarant}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500" />
              </div>
            </div>
          </section>

          {isDeclarant && (
            <div className="flex justify-end gap-3">
              <button type="submit" disabled={saving}
                className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
