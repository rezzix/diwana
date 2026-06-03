import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPrefillData, createDeclaration, type TariffRateDto, type CompanyPrefill } from '@/api/declarations';

export default function CreateDeclarationPage() {
  const navigate = useNavigate();
  const [company, setCompany] = useState<CompanyPrefill | null>(null);
  const [tariffRates, setTariffRates] = useState<TariffRateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedHsRate, setSelectedHsRate] = useState<TariffRateDto | null>(null);

  const [form, setForm] = useState({
    hsCode: '',
    description: '',
    countryOfOrigin: '',
    quantity: '',
    unit: '',
    unitPrice: '',
    totalValue: '',
    currency: 'MAD',
    customsOffice: '',
    notes: '',
  });

  useEffect(() => {
    getPrefillData()
      .then((data) => {
        setCompany(data.company);
        setTariffRates(data.tariffRates);
      })
      .catch(() => setError('Failed to load prefill data'))
      .finally(() => setLoading(false));
  }, []);

  const handleHsSelect = (rate: TariffRateDto) => {
    setSelectedHsRate(rate);
    setForm((prev) => ({
      ...prev,
      hsCode: rate.hsCode,
      description: rate.description,
      unit: rate.unit,
    }));
  };

  const handleCalculate = () => {
    const qty = parseFloat(form.quantity) || 0;
    const price = parseFloat(form.unitPrice) || 0;
    const total = qty * price;
    setForm((prev) => ({ ...prev, totalValue: total.toFixed(2) }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.totalValue || parseFloat(form.totalValue) <= 0) {
      handleCalculate();
    }
    setSaving(true);
    setError('');
    try {
      const result = await createDeclaration({
        hsCode: form.hsCode,
        description: form.description,
        countryOfOrigin: form.countryOfOrigin || undefined,
        quantity: parseFloat(form.quantity),
        unit: form.unit || undefined,
        unitPrice: parseFloat(form.unitPrice),
        totalValue: parseFloat(form.totalValue || '0'),
        dutyRate: selectedHsRate?.dutyRate,
        vatRate: selectedHsRate?.vatRate,
        currency: form.currency,
        customsOffice: form.customsOffice || undefined,
        notes: form.notes || undefined,
      });
      navigate(`/declarations/${result.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create declaration');
    } finally {
      setSaving(false);
    }
  };

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
            <Link to="/declarations" className="text-sm text-primary-600 hover:underline">&larr; Declarations</Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-lg font-bold text-gray-900">New Declaration</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
        )}

        {company && (
          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-lg px-4 py-2">
            Declaring for: <strong>{company.name}</strong> (ICE: {company.ice || '—'})
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Select HS Code from reference */}
          <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Select Tariff Rate</h2>
            <p className="text-xs text-gray-500">Choose an HS code from the reference table to auto-fill duty/VAT rates.</p>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-3 py-2 font-medium text-gray-700 text-xs">HS Code</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-700 text-xs">Description</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-700 text-xs">Duty</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-700 text-xs">VAT</th>
                    <th className="w-10 px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {tariffRates.map((rate) => (
                    <tr key={rate.id} className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${selectedHsRate?.id === rate.id ? 'bg-primary-50' : ''}`}
                        onClick={() => handleHsSelect(rate)}>
                      <td className="px-3 py-2 font-mono text-xs text-gray-900">{rate.hsCode}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">{rate.description}</td>
                      <td className="px-3 py-2 text-xs text-right text-gray-900">{rate.dutyRate}%</td>
                      <td className="px-3 py-2 text-xs text-right text-gray-900">{rate.vatRate}%</td>
                      <td className="px-3 py-2 text-xs">
                        {selectedHsRate?.id === rate.id && <span className="text-primary-600">✓</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Goods details */}
          <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Goods Details</h2>

            {!selectedHsRate && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">HS Code *</label>
                  <input type="text" required value={form.hsCode}
                    onChange={(e) => setForm({ ...form, hsCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <input type="text" required value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country of Origin</label>
                <input type="text" value={form.countryOfOrigin}
                  onChange={(e) => setForm({ ...form, countryOfOrigin: e.target.value })}
                  placeholder="e.g. France, China"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="MAD">MAD</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input type="number" step="0.001" required value={form.quantity}
                  onChange={(e) => {
                    setForm({ ...form, quantity: e.target.value });
                    setTimeout(handleCalculate, 0);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <input type="text" value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="kg, pcs, L"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price *</label>
                <input type="number" step="0.001" required value={form.unitPrice}
                  onChange={(e) => {
                    setForm({ ...form, unitPrice: e.target.value });
                    setTimeout(handleCalculate, 0);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Value *</label>
                <input type="number" step="0.001" required value={form.totalValue}
                  onChange={(e) => setForm({ ...form, totalValue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50" />
              </div>
            </div>
          </section>

          {/* Customs info */}
          <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Customs Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customs Office</label>
                <input type="text" value={form.customsOffice}
                  onChange={(e) => setForm({ ...form, customsOffice: e.target.value })}
                  placeholder="e.g. Casablanca Port"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={2} value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
          </section>

          {selectedHsRate && (
            <section className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p><strong>Estimated duties:</strong> {selectedHsRate.dutyRate}% duty + {selectedHsRate.vatRate}% VAT on {form.totalValue || '—'} {form.currency}</p>
            </section>
          )}

          <div className="flex justify-end gap-3">
            <Link to="/declarations"
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </Link>
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
              {saving ? 'Creating...' : 'Create Declaration (Draft)'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
