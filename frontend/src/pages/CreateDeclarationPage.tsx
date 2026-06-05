import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { getPrefillData, createDeclaration } from '@/api/declarations';
import { getAttachments, deleteAttachment, type AttachmentDto } from '@/api/attachments';
import { getDocumentTypes, type DocumentTypeDto } from '@/api/documentTypes';
import { getCustomsOffices, type CustomsOfficeDto } from '@/api/customsOffices';
import SupportingDocumentsSection from '@/components/SupportingDocumentsSection';

export default function CreateDeclarationPage() {
  const [company, setCompany] = useState<{ name: string; ice: string | null } | null>(null);
  const [customsOffices, setCustomsOffices] = useState<CustomsOfficeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [customsOffice, setCustomsOffice] = useState('');
  const [notes, setNotes] = useState('');

  // Supporting documents state (available after creation)
  const [createdId, setCreatedId] = useState<number | null>(null);
  const [attachments, setAttachments] = useState<AttachmentDto[]>([]);
  const [docTypes, setDocTypes] = useState<DocumentTypeDto[]>([]);
  const [uploadType, setUploadType] = useState('COMMERCIAL_INVOICE');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getPrefillData(controller.signal),
      getCustomsOffices(controller.signal),
    ]).then(([data, officeData]) => {
      if (controller.signal.aborted) return;
      setCompany(data.company ? { name: data.company.name, ice: data.company.ice } : null);
      setCustomsOffices(officeData);
    })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setError('Failed to load prefill data');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    getDocumentTypes().then(setDocTypes).catch(() => {});
  }, []);

  // Fetch attachments after declaration is created
  useEffect(() => {
    if (createdId) {
      getAttachments(createdId).then(setAttachments).catch(() => {});
    }
  }, [createdId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!customsOffice) {
      setError('Please select a customs office');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const result = await createDeclaration({
        lineItems: [],
        customsOffice,
        notes: notes || undefined,
      });
      setCreatedId(result.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create declaration');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (formData: FormData) => {
    if (!createdId) return;
    setUploading(true);
    setError('');
    try {
      const res = await fetch(`/api/declarations/${createdId}/attachments`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.data || 'Upload failed');
      }
      const atts = await getAttachments(createdId);
      setAttachments(atts);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAtt = async (attId: number) => {
    if (!createdId) return;
    try {
      await deleteAttachment(createdId, attId);
      setAttachments(attachments.filter((a) => a.id !== attId));
    } catch {
      setError('Failed to delete attachment');
    }
  };

  const handleReplaceAtt = async (attId: number, file: File) => {
    if (!createdId) return;
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/declarations/${createdId}/attachments/${attId}`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || json.data || 'Replace failed');
      }
      const attRes = await fetch(`/api/declarations/${createdId}/attachments`, { credentials: 'include' });
      const attJson = await attRes.json();
      setAttachments(attJson.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to replace document');
    }
  };

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
          {createdId && (
            <Link to={`/declarations/${createdId}`}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              View Declaration
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

        {!createdId && company && (
          <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-1">
            <h2 className="font-semibold text-gray-900">Company</h2>
            <div className="text-sm text-gray-700"><strong>{company.name}</strong></div>
            {company.ice && <div className="text-sm text-gray-500">ICE: {company.ice}</div>}
          </section>
        )}

        {createdId && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-2">
            Declaration created successfully! Upload supporting documents below, then{' '}
            <Link to={`/declarations/${createdId}/edit`} className="underline font-medium">add goods lines</Link>.
          </div>
        )}

        {!createdId && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customs information */}
            <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Customs Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customs Office <span className="text-red-500">*</span></label>
                  <select value={customsOffice} onChange={(e) => { setCustomsOffice(e.target.value); if (error) setError(''); }} required
                    className={`w-full px-3 py-2 rounded-lg text-sm ${!customsOffice ? 'border-red-300 bg-red-50' : 'border border-gray-300'}`}>
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
              <button type="submit" disabled={saving || !customsOffice}
                className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
                {saving ? 'Creating...' : 'Create Declaration'}
              </button>
            </div>
          </form>
        )}

        {createdId && (
          <div className="space-y-6">
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
              declarationId={createdId}
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
              error={error}
              setError={setError}
            />

            <div className="flex justify-end gap-3">
              <Link to="/declarations" className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">Back to Declarations</Link>
              <Link to={`/declarations/${createdId}/edit`}
                className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
                Add Goods Lines
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}