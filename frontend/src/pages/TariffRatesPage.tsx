import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { getTariffRates, type TariffRateDto } from '@/api/tariffRates';

export default function TariffRatesPage() {
  const [rates, setRates] = useState<TariffRateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    getTariffRates(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setRates(data);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setError('Failed to load tariff rates');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const filtered = search.trim()
    ? rates.filter((r) =>
        (r.hsCode || '').toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase()) ||
        (r.originName || '').toLowerCase().includes(search.toLowerCase())
      )
    : rates;

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
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-primary-600 hover:underline">&larr; Dashboard</Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-lg font-bold text-gray-900">Reference Tariff Rates</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
        )}

        <div className="mb-4 flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by HS code, description, or origin..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <span className="text-sm text-gray-500">{filtered.length} rate{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-2.5 font-medium text-gray-700">HS Code</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-700">Description</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-700">Origin</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-700">Duty Rate</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-700">VAT Rate</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-700">Unit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    {search ? 'No matching tariff rates found.' : 'No tariff rates available.'}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs">{r.hsCode || '—'}</td>
                    <td className="px-4 py-2">{r.description}</td>
                    <td className="px-4 py-2 text-gray-600">{r.originName || 'All'}</td>
                    <td className="px-4 py-2 text-right font-medium text-amber-700">{r.dutyRate}%</td>
                    <td className="px-4 py-2 text-right font-medium text-blue-700">{r.vatRate}%</td>
                    <td className="px-4 py-2 text-gray-500">{r.unit || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-gray-400">
          These rates are indicative. Final duty and VAT amounts are determined upon customs review.
        </p>
      </main>
    </div>
  );
}