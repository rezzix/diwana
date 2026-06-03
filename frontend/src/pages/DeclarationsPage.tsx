import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPrefillData, type CompanyPrefill, type TariffRateDto } from '@/api/declarations';
import { useAuthStore } from '@/stores/authStore';

export default function DeclarationsPage() {
  const user = useAuthStore((s) => s.user);
  const [company, setCompany] = useState<CompanyPrefill | null>(null);
  const [tariffRates, setTariffRates] = useState<TariffRateDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPrefillData()
      .then((data) => {
        setCompany(data.company);
        setTariffRates(data.tariffRates);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-primary-600 hover:underline">&larr; Dashboard</Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-lg font-bold text-gray-900">Declarations</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Pre-filled Company Info */}
        {company && (
          <section className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Declarant Company — Pre-filled from Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500 block">Company</span>
                <span className="font-medium text-gray-900">{company.name}</span>
              </div>
              <div>
                <span className="text-gray-500 block">ICE</span>
                <span className="font-medium text-gray-900">{company.ice || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">RC</span>
                <span className="font-medium text-gray-900">{company.rc || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">NIF</span>
                <span className="font-medium text-gray-900">{company.nif || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">VAT</span>
                <span className="font-medium text-gray-900">{company.vatNumber || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Address</span>
                <span className="font-medium text-gray-900">{company.address || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Phone</span>
                <span className="font-medium text-gray-900">{company.phone || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Email</span>
                <span className="font-medium text-gray-900">{company.email || '—'}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Customs Code</span>
                <span className="font-medium text-gray-900">{company.customsCode || '—'}</span>
              </div>
            </div>
          </section>
        )}

        {!company && (
          <section className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-gray-500 text-sm">
              No company profile found. {user?.role === 'DECLARANT' ? 'Contact an admin to assign you to a company.' : ''}
            </p>
          </section>
        )}

        {/* Available Tariff Rates */}
        <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900">Reference Tariff Rates</h2>
            <p className="text-xs text-gray-500 mt-0.5">Pre-filled for new declarations — {tariffRates.length} rates available</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 font-medium text-gray-700">HS Code</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-700">Description</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-700">Duty Rate</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-700">VAT Rate</th>
                  <th className="text-center px-4 py-2.5 font-medium text-gray-700">Unit</th>
                </tr>
              </thead>
              <tbody>
                {tariffRates.map((rate) => (
                  <tr key={rate.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs text-gray-900">{rate.hsCode}</td>
                    <td className="px-4 py-2 text-gray-700">{rate.description}</td>
                    <td className="px-4 py-2 text-right text-gray-900">{rate.dutyRate}%</td>
                    <td className="px-4 py-2 text-right text-gray-900">{rate.vatRate}%</td>
                    <td className="px-4 py-2 text-center text-gray-500">{rate.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Bank Info for declarations */}
        {company && company.bankName && (
          <section className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Bank Details (for payment reference)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500 block">Bank</span>
                <span className="font-medium text-gray-900">{company.bankName}</span>
              </div>
              <div>
                <span className="text-gray-500 block">IBAN</span>
                <span className="font-medium text-gray-900 font-mono text-xs">{company.bankIban}</span>
              </div>
              <div>
                <span className="text-gray-500 block">SWIFT</span>
                <span className="font-medium text-gray-900">{company.bankSwift}</span>
              </div>
            </div>
          </section>
        )}

        <p className="text-xs text-gray-400 text-center pt-2">
          Company profile data is automatically attached to new declarations. Update your profile from the Company Profile page.
        </p>
      </main>
    </div>
  );
}
