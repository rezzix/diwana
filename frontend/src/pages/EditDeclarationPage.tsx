import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { getDeclaration, updateDeclaration, getPrefillData, type TariffRateDto, type LineItemRequest } from '@/api/declarations';
import { getOrigins, type OriginDto } from '@/api/origins';
import { getCustomsOffices, type CustomsOfficeDto } from '@/api/customsOffices';
import { getAttachments, deleteAttachment, type AttachmentDto } from '@/api/attachments';
import { getDocumentTypes, type DocumentTypeDto } from '@/api/documentTypes';
import { resolveTariffRate } from '@/api/tariffEstimate';
import SupportingDocumentsSection from '@/components/SupportingDocumentsSection';

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

export default function EditDeclarationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [origins, setOrigins] = useState<OriginDto[]>([]);
  const [tariffRates, setTariffRates] = useState<TariffRateDto[]>([]);
  const [customsOffices, setCustomsOffices] = useState<CustomsOfficeDto[]>([]);
  const [error, setError] = useState('');
  const [declarationNumber, setDeclarationNumber] = useState('');
  const [lines, setLines] = useState<LineItemRequest[]>([]);
  const [lineForm, setLineForm] = useState<LineForm>(emptyLine());
  const [customsOffice, setCustomsOffice] = useState('');
  const [notes, setNotes] = useState('');
  const [company, setCompany] = useState<{ name: string; ice: string | null } | null>(null);

  // Supporting documents state
  const [attachments, setAttachments] = useState<AttachmentDto[]>([]);
  const [docTypes, setDocTypes] = useState<DocumentTypeDto[]>([]);
  const [uploadType, setUploadType] = useState('COMMERCIAL_INVOICE');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    getDeclaration(Number(id), controller.signal).then((decl) => {
      if (controller.signal.aborted) return;
      Promise.all([getOrigins(controller.signal), getPrefillData(controller.signal), getCustomsOffices(controller.signal)]).then(([originData, prefillData, officeData]) => {
        if (controller.signal.aborted) return;
        setOrigins(originData);
        setTariffRates(prefillData.tariffRates);
        setCustomsOffices(officeData);
        setCompany(prefillData.company ? { name: prefillData.company.name, ice: prefillData.company.ice } : null);
      }).catch((err) => {
        if (axios.isCancel(err)) return;
      });
      setDeclarationNumber(decl.declarationNumber);
      setCustomsOffice(decl.customsOffice || '');
      setNotes(decl.notes || '');
      setLines(decl.lineItems.map((li) => ({
        hsCode: li.hsCode,
        description: li.description,
        countryOfOrigin: li.countryOfOrigin || undefined,
        quantity: li.quantity,
        unit: li.unit || undefined,
        unitPrice: li.unitPrice,
        totalValue: li.totalValue,
        dutyRate: li.dutyRate || undefined,
        vatRate: li.vatRate || undefined,
        currency: li.currency,
      })));
    }).catch((err) => {
      if (axios.isCancel(err)) return;
      setError('Failed to load declaration');
    })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    getAttachments(Number(id)).then(setAttachments).catch(() => {});
    getDocumentTypes().then(setDocTypes).catch(() => {});
  }, [id]);

  const calcTotal = (q: string, p: string) => ((parseFloat(q) || 0) * (parseFloat(p) || 0)).toFixed(2);

  const HS_CODE_PATTERN = /^\d{4}(\.\d{2,6})?$/;

  const handleAddLine = () => {
    const qty = parseFloat(lineForm.quantity);
    const price = parseFloat(lineForm.unitPrice);
    const total = parseFloat(lineForm.totalValue || calcTotal(lineForm.quantity, lineForm.unitPrice));
    if (!lineForm.hsCode || !lineForm.description || !qty || !price) {
      setError('Fill in HS code, description, quantity, and unit price');
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

  const handleRemoveLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || lines.length === 0) return;
    if (!customsOffice) {
      setError('Please select a customs office');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await updateDeclaration(Number(id), { lineItems: lines, customsOffice, notes: notes || undefined });
      navigate(`/declarations/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update declaration');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (formData: FormData) => {
    if (!id) return;
    setUploading(true);
    setError('');
    try {
      const res = await fetch(`/api/declarations/${id}/attachments`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.data || 'Upload failed');
      }
      const atts = await getAttachments(Number(id));
      setAttachments(atts);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAtt = async (attId: number) => {
    if (!id) return;
    try {
      await deleteAttachment(Number(id), attId);
      setAttachments(attachments.filter((a) => a.id !== attId));
    } catch {
      setError('Failed to delete attachment');
    }
  };

  const handleReplaceAtt = async (attId: number, file: File) => {
    if (!id) return;
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/declarations/${id}/attachments/${attId}`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || json.data || 'Replace failed');
      }
      const attRes = await fetch(`/api/declarations/${id}/attachments`, { credentials: 'include' });
      const attJson = await attRes.json();
      setAttachments(attJson.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to replace document');
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
            <Link to={`/declarations/${id}`} className="text-sm text-primary-600 hover:underline">&larr; Back</Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-lg font-bold text-gray-900">Edit Declaration</h1>
            {declarationNumber && <span className="text-xs text-gray-400 font-mono">{declarationNumber}</span>}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Compact summary: company + customs info */}
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {company && (
              <>
                <span className="text-gray-500">Company:</span>
                <span className="font-medium text-gray-900">{company.name}</span>
                {company.ice && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-500">ICE:</span>
                    <span className="text-gray-700">{company.ice}</span>
                  </>
                )}
              </>
            )}
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">Customs Office:</span>
            <span className="font-medium text-gray-900">{customsOffice}</span>
            {notes && (
              <>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500">Notes:</span>
                <span className="text-gray-700">{notes}</span>
              </>
            )}
          </div>

          {/* Supporting Documents */}
          <SupportingDocumentsSection
            declarationId={Number(id)}
            attachments={attachments}
            docTypes={docTypes}
            uploadType={uploadType}
            setUploadType={setUploadType}
            uploading={uploading}
            setUploading={setUploading}
            canEdit={true}
            onUpload={handleUpload}
            onDelete={handleDeleteAtt}
            onReplace={handleReplaceAtt}
            onAttachmentsChanged={() => { if (id) getAttachments(Number(id)).then(setAttachments).catch(() => {}); }}
            error={error}
            setError={setError}
          />

          {/* Add line */}
          <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Add Goods Line</h2>
              <Link to="/tariff-rates" target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary-600 hover:underline">
                📋 View Reference Tariff Rates
              </Link>
            </div>
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
                <input type="number" readOnly value={calcTotal(lineForm.quantity, lineForm.unitPrice)}
                  className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50" />
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
                Goods Lines ({lines.length})
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

          <div className="flex justify-end gap-3">
            <Link to={`/declarations/${id}`}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</Link>
            <button type="submit" disabled={saving || lines.length === 0}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : `Save Changes (${lines.length} line${lines.length !== 1 ? 's' : ''})`}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}