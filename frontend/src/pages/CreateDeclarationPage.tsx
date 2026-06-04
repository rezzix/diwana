import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPrefillData, createDeclaration, type TariffRateDto, type LineItemRequest } from '@/api/declarations';
import { getOrigins, type OriginDto } from '@/api/origins';
import { getCustomsOffices, type CustomsOfficeDto } from '@/api/customsOffices';
import { resolveTariffRate } from '@/api/tariffEstimate';

interface LineForm {
  hsCode: string;
  description: string;
  countryOfOrigin: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  totalValue: string;
  currency: string;
}

const emptyLine = (): LineForm => ({
  hsCode: '', description: '', countryOfOrigin: '',
  quantity: '', unit: '', unitPrice: '', totalValue: '', currency: 'MAD',
});

export default function CreateDeclarationPage() {
  const navigate = useNavigate();
  const [company, setCompany] = useState<{ name: string; ice: string | null } | null>(null);
  const [tariffRates, setTariffRates] = useState<TariffRateDto[]>([]);
  const [origins, setOrigins] = useState<OriginDto[]>([]);
  const [customsOffices, setCustomsOffices] = useState<CustomsOfficeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lineForm, setLineForm] = useState<LineForm>(emptyLine());
  const [lines, setLines] = useState<LineItemRequest[]>([]);
  const [customsOffice, setCustomsOffice] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    Promise.all([
      getPrefillData(),
      getOrigins(),
      getCustomsOffices(),
    ]).then(([data, originData, officeData]) => {
      setCompany(data.company ? { name: data.company.name, ice: data.company.ice } : null);
      setTariffRates(data.tariffRates);
      setOrigins(originData);
      setCustomsOffices(officeData);
    })
      .catch(() => setError('Failed to load prefill data'))
      .finally(() => setLoading(false));
  }, []);

  const calcTotal = (q: string, p: string) => {
    const qty = parseFloat(q) || 0;
    const price = parseFloat(p) || 0;
    return (qty * price).toFixed(2);
  };

  const HS_CODE_PATTERN = /^\d{4}(\.\d{2,6})?$/;

  const handleAddLine = () => {
    const qty = parseFloat(lineForm.quantity);
    const price = parseFloat(lineForm.unitPrice);
    const total = parseFloat(lineForm.totalValue || calcTotal(lineForm.quantity, lineForm.unitPrice));
    if (!lineForm.hsCode || !lineForm.description || !qty || !price) {
      setError('Fill in HS code, description, quantity, and unit price before adding');
      return;
    }
    if (!HS_CODE_PATTERN.test(lineForm.hsCode)) {
      setError('HS code must be in format XXXX or XXXX.XX (e.g. 8471.30)');
      return;
    }
    setLines([...lines, {
      hsCode: lineForm.hsCode,
      description: lineForm.description,
      countryOfOrigin: lineForm.countryOfOrigin || undefined,
      quantity: qty,
      unit: lineForm.unit || undefined,
      unitPrice: price,
      totalValue: total,
      currency: lineForm.currency,
    }]);
    setLineForm(emptyLine());
    setError('');
  };

  const handleRemoveLine = (i: number) => {
    setLines(lines.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      setError('Add at least one goods line before submitting');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const result = await createDeclaration({
        lineItems: lines,
        customsOffice: customsOffice || undefined,
        notes: notes || undefined,
      });
      navigate(`/declarations/${result.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create declaration');
    } finally {
      setSaving(false);
    }
  };

  const totals = lines.reduce((acc, li) => {
    const est = resolveTariffRate(li.hsCode, li.countryOfOrigin, li.totalValue, tariffRates);
    return {
      value: acc.value + li.totalValue,
      duty: acc.duty + est.dutyAmount,
      vat: acc.vat + est.vatAmount,
      count: acc.count + 1,
    };
  }, { value: 0, duty: 0, vat: 0, count: 0 });

  if (loading) {
    return <div className="min-h-screen bg-surface flex items-center justify-center"><div className="text-gray-400">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/declarations" className="text-sm text-primary-600 hover:underline">&larr; Declarations</Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-lg font-bold text-gray-900">New Declaration</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
        {company && (
          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-lg px-4 py-2">
            Declaring for: <strong>{company.name}</strong> (ICE: {company.ice || '—'})
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tariff rate picker */}
          <section className="bg-white border border-gray-200 rounded-lg p-6">
            <details className="text-sm text-gray-500 cursor-pointer">
              <summary className="font-medium text-gray-700 mb-2">Reference Tariff Rates — click to expand</summary>
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg mt-2">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50"><tr className="border-b border-gray-200">
                    <th className="text-left px-3 py-1.5 font-medium">HS Code</th>
                    <th className="text-left px-3 py-1.5 font-medium">Description</th>
                    <th className="text-left px-3 py-1.5 font-medium">Origin</th>
                    <th className="text-right px-3 py-1.5 font-medium">Duty</th>
                    <th className="text-right px-3 py-1.5 font-medium">VAT</th>
                  </tr></thead>
                  <tbody>
                    {tariffRates.map((r) => (
                      <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                          onClick={() => { if (r.hsCode) setLineForm({ ...lineForm, hsCode: r.hsCode, description: r.description, unit: r.unit }); }}>
                        <td className="px-3 py-1.5 font-mono">{r.hsCode || '—'}</td>
                        <td className="px-3 py-1.5">{r.description}</td>
                        <td className="px-3 py-1.5 text-gray-500">{r.originName || 'All'}</td>
                        <td className="px-3 py-1.5 text-right">{r.dutyRate}%</td>
                        <td className="px-3 py-1.5 text-right">{r.vatRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </section>

          {/* Add line item form */}
          <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Add Goods Line</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">HS Code *</label>
                <input type="text" value={lineForm.hsCode} onChange={(e) => setLineForm({ ...lineForm, hsCode: e.target.value })}
                  className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g. 8471.30" />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
                <input type="text" value={lineForm.description} onChange={(e) => setLineForm({ ...lineForm, description: e.target.value })}
                  className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Origin</label>
                <select value={lineForm.countryOfOrigin} onChange={(e) => setLineForm({ ...lineForm, countryOfOrigin: e.target.value })}
                  className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">— Select origin —</option>
                  {origins.map((o) => <option key={o.code} value={o.name}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Qty *</label>
                <input type="number" step="0.001" value={lineForm.quantity}
                  onChange={(e) => {
                    setLineForm({ ...lineForm, quantity: e.target.value, totalValue: calcTotal(e.target.value, lineForm.unitPrice) });
                  }}
                  className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                <input type="text" value={lineForm.unit} onChange={(e) => setLineForm({ ...lineForm, unit: e.target.value })}
                  className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Unit Price *</label>
                <input type="number" step="0.001" value={lineForm.unitPrice}
                  onChange={(e) => {
                    setLineForm({ ...lineForm, unitPrice: e.target.value, totalValue: calcTotal(lineForm.quantity, e.target.value) });
                  }}
                  className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Total</label>
                <input type="number" step="0.01" value={calcTotal(lineForm.quantity, lineForm.unitPrice)} readOnly
                  className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-700" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Curr</label>
                <select value={lineForm.currency} onChange={(e) => setLineForm({ ...lineForm, currency: e.target.value })}
                  className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm">
                  <option>MAD</option><option>EUR</option><option>USD</option>
                </select>
              </div>
            </div>
            <button type="button" onClick={handleAddLine}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
              + Add Goods Line
            </button>
          </section>

          {/* Lines table with estimates */}
          {lines.length > 0 && (
            <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-3 border-b border-gray-200 bg-gray-50 text-sm font-semibold text-gray-900">
                Added Goods Lines ({lines.length})
              </div>
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-3 py-2 font-medium text-gray-700">HS Code</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-700">Description</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-700">Qty</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-700">Unit Price</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-700">Total</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-700">Est. Duty</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-700">Est. VAT</th>
                  <th className="text-center px-3 py-2 font-medium text-gray-700">Curr</th>
                  <th className="w-10"></th>
                </tr></thead>
                <tbody>
                  {lines.map((li, i) => {
                    const est = resolveTariffRate(li.hsCode, li.countryOfOrigin, li.totalValue, tariffRates);
                    return (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="px-3 py-2 font-mono text-xs">{li.hsCode}</td>
                        <td className="px-3 py-2">{li.description}</td>
                        <td className="px-3 py-2 text-right">{li.quantity}</td>
                        <td className="px-3 py-2 text-right">{li.unitPrice.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-medium">{li.totalValue.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-amber-700">{est.dutyAmount.toFixed(2)} <span className="text-xs text-gray-400">({est.dutyRate}%)</span></td>
                        <td className="px-3 py-2 text-right text-blue-700">{est.vatAmount.toFixed(2)} <span className="text-xs text-gray-400">({est.vatRate}%)</span></td>
                        <td className="px-3 py-2 text-center text-xs text-gray-500">{li.currency}</td>
                        <td className="px-3 py-2 text-center">
                          <button type="button" onClick={() => handleRemoveLine(i)} className="text-red-500 hover:text-red-700 text-xs">✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan={4} className="px-3 py-2 text-right text-gray-700">Total ({lines.length} lines):</td>
                    <td className="px-3 py-2 text-right text-gray-900">{totals.value.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right text-amber-700">{totals.duty.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right text-blue-700">{totals.vat.toFixed(2)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
              </div>
            </section>
          )}

          {/* Estimated duties summary */}
          {lines.length > 0 && (
            <section className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h2 className="font-semibold text-amber-900 mb-3">Estimated Duties &amp; Taxes</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div><span className="text-amber-700 block">Total Goods Value</span><span className="font-medium text-gray-900">{totals.value.toFixed(2)}</span></div>
                <div><span className="text-amber-700 block">Estimated Duty</span><span className="font-medium text-amber-900">{totals.duty.toFixed(2)}</span></div>
                <div><span className="text-amber-700 block">Estimated VAT</span><span className="font-medium text-blue-900">{totals.vat.toFixed(2)}</span></div>
              </div>
              <div className="mt-3 pt-3 border-t border-amber-200 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-amber-900">Estimated Total (Value + Duty + VAT)</span>
                  <span className="font-bold text-gray-900">{(totals.value + totals.duty + totals.vat).toFixed(2)}</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-amber-600">These are indicative estimates based on current tariff rates. Final amounts are determined upon customs review.</p>
            </section>
          )}

          {/* Customs info */}
          <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Customs Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customs Office</label>
                <select value={customsOffice} onChange={(e) => setCustomsOffice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">— Select customs office —</option>
                  {customsOffices.map((o) => <option key={o.code} value={o.name}>{o.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <Link to="/declarations" className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</Link>
            <button type="submit" disabled={saving || lines.length === 0}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
              {saving ? 'Creating...' : `Create Declaration (${lines.length} line${lines.length !== 1 ? 's' : ''})`}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}