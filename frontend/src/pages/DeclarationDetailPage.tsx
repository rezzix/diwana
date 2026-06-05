import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getDeclaration, deleteDeclaration, submitDeclaration, resubmitDeclaration, rejectDeclaration, approveDeclaration, requestInfoDeclaration, getAuditLog, type DeclarationDto, type AuditLogDto } from '@/api/declarations';
import { getAttachments, deleteAttachment, type AttachmentDto } from '@/api/attachments';
import { getDocumentTypes, type DocumentTypeDto } from '@/api/documentTypes';
import SupportingDocumentsSection from '@/components/SupportingDocumentsSection';
import { useAuthStore } from '@/stores/authStore';

export default function DeclarationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [decl, setDecl] = useState<DeclarationDto | null>(null);
  const [attachments, setAttachments] = useState<AttachmentDto[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadType, setUploadType] = useState('COMMERCIAL_INVOICE');
  const [uploading, setUploading] = useState(false);
  const [docTypes, setDocTypes] = useState<DocumentTypeDto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [requestingInfo, setRequestingInfo] = useState(false);
  const [infoNote, setInfoNote] = useState('');
  const [showInfoDialog, setShowInfoDialog] = useState(false);

  const isOwner = user?.role === 'DECLARANT';
  const isController = user?.role === 'CONTROLLER';
  const canEditDocs = isOwner && (decl?.status === 'DRAFT' || decl?.status === 'REJECTED' || decl?.status === 'INFO_REQUESTED');

  const fetchData = async (signal?: AbortSignal) => {
    if (!id) return;
    try {
      const d = await getDeclaration(Number(id), signal);
      if (signal?.aborted) return;
      setDecl(d);
      const [atts, logs] = await Promise.all([
        getAttachments(Number(id), signal),
        getAuditLog(Number(id), signal),
      ]);
      if (signal?.aborted) return;
      setAttachments(atts);
      setAuditLog(logs);
    } catch (err) {
      if (axios.isCancel(err)) return;
      setError('Failed to load declaration');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    getDocumentTypes().then(setDocTypes).catch(() => {});
  }, []);

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

  const handleDeleteDecl = async () => {
    if (!id || !decl) return;
    if (!confirm(`Delete declaration ${decl.declarationNumber}? This cannot be undone.`)) return;
    try {
      await deleteDeclaration(Number(id));
      navigate('/declarations');
    } catch {
      setError('Failed to delete declaration');
    }
  };

  const handleSubmitDecl = async () => {
    if (!id || !decl) return;
    if (!confirm(`Submit declaration ${decl.declarationNumber} for customs review? This cannot be undone.`)) return;
    setSubmitting(true);
    setError('');
    try {
      const updated = await submitDeclaration(Number(id));
      setDecl(updated);
      getAuditLog(Number(id)).then(setAuditLog).catch(() => {});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit declaration');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResubmit = async () => {
    if (!id || !decl) return;
    if (!confirm(`Resubmit declaration ${decl.declarationNumber}? It will be moved back to draft so you can make corrections.`)) return;
    setResubmitting(true);
    setError('');
    try {
      const updated = await resubmitDeclaration(Number(id));
      setDecl(updated);
      getAuditLog(Number(id)).then(setAuditLog).catch(() => {});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resubmit declaration');
    } finally {
      setResubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!id || !decl || !rejectReason.trim()) return;
    setRejecting(true);
    setError('');
    try {
      const updated = await rejectDeclaration(Number(id), rejectReason.trim());
      setDecl(updated);
      getAuditLog(Number(id)).then(setAuditLog).catch(() => {});
      setRejectReason('');
      setShowRejectDialog(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reject declaration');
    } finally {
      setRejecting(false);
    }
  };

  const handleApprove = async () => {
    if (!id || !decl) return;
    if (!confirm(`Approve declaration ${decl.declarationNumber}?`)) return;
    setApproving(true);
    setError('');
    try {
      const updated = await approveDeclaration(Number(id));
      setDecl(updated);
      getAuditLog(Number(id)).then(setAuditLog).catch(() => {});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to approve declaration');
    } finally {
      setApproving(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!id || !decl || !infoNote.trim()) return;
    setRequestingInfo(true);
    setError('');
    try {
      const updated = await requestInfoDeclaration(Number(id), infoNote.trim());
      setDecl(updated);
      getAuditLog(Number(id)).then(setAuditLog).catch(() => {});
      setInfoNote('');
      setShowInfoDialog(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to request additional info');
    } finally {
      setRequestingInfo(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-surface flex items-center justify-center"><div className="text-gray-400">Loading...</div></div>;
  }

  if (!decl) {
    return <div className="min-h-screen bg-surface p-6 text-center text-gray-500">Declaration not found.</div>;
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/declarations" className="text-sm text-primary-600 hover:underline">&larr; Declarations</Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-lg font-bold text-gray-900">{decl.declarationNumber}</h1>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              decl.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' :
              decl.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
              decl.status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-700' :
              decl.status === 'INFO_REQUESTED' ? 'bg-purple-100 text-purple-700' :
              decl.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
              'bg-red-100 text-red-700'
            }`}>{decl.status}</span>
          </div>
          <div className="flex gap-2">
            {isOwner && decl.status === 'DRAFT' && (
              <>
                <button onClick={handleSubmitDecl} disabled={submitting}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 transition-colors">
                  {submitting ? 'Submitting...' : 'Submit for Review'}
                </button>
                <Link to={`/declarations/${id}/edit`}
                  className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors">
                  Edit
                </Link>
                <button onClick={handleDeleteDecl}
                  className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 transition-colors">
                  Delete
                </button>
              </>
            )}
            {isOwner && (decl.status === 'REJECTED' || decl.status === 'INFO_REQUESTED') && (
              <>
                <button onClick={handleResubmit} disabled={resubmitting}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 transition-colors">
                  {resubmitting ? 'Resubmitting...' : 'Resubmit'}
                </button>
                <Link to={`/declarations/${id}/edit`}
                  className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors">
                  Edit &amp; Correct
                </Link>
              </>
            )}
            {isController && (decl.status === 'SUBMITTED' || decl.status === 'UNDER_REVIEW') && (
              <>
                <button onClick={handleApprove} disabled={approving}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 transition-colors">
                  {approving ? 'Approving...' : 'Approve'}
                </button>
                <button onClick={() => setShowInfoDialog(true)}
                  className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 transition-colors">
                  Request Info
                </button>
                <button onClick={() => setShowRejectDialog(true)}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">
                  Reject
                </button>
              </>
            )}
            {isController && decl.status === 'INFO_REQUESTED' && (
              <>
                <button onClick={handleApprove} disabled={approving}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 transition-colors">
                  {approving ? 'Approving...' : 'Approve'}
                </button>
                <button onClick={() => setShowRejectDialog(true)}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

        {/* Rejection reason */}
        {decl.status === 'REJECTED' && decl.rejectionReason && (
          <section className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="font-semibold text-red-900 mb-2">Rejection Reason</h2>
            <p className="text-sm text-red-700 whitespace-pre-wrap">{decl.rejectionReason}</p>
            {isOwner && (
              <p className="mt-3 text-xs text-red-500">You can correct the declaration and resubmit it for review.</p>
            )}
            {isController && (
              <p className="mt-3 text-xs text-red-500">The declarant has been notified and can correct and resubmit the declaration.</p>
            )}
          </section>
        )}

        {/* Info request note */}
        {decl.status === 'INFO_REQUESTED' && decl.infoRequestNote && (
          <section className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h2 className="font-semibold text-purple-900 mb-2">Additional Information Requested</h2>
            <p className="text-sm text-purple-700 whitespace-pre-wrap">{decl.infoRequestNote}</p>
            {isOwner && (
              <p className="mt-3 text-xs text-purple-500">The customs controller has requested additional information. You can edit the declaration to provide it, then resubmit.</p>
            )}
            {isController && (
              <p className="mt-3 text-xs text-purple-500">This declaration is awaiting the declarant's response.</p>
            )}
          </section>
        )}

        {/* Reject dialog */}
        {showRejectDialog && (
          <section className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="font-semibold text-red-900 mb-2">Reject Declaration</h2>
            <p className="text-sm text-red-700 mb-3">Provide a reason for rejecting this declaration. The declarant will see this reason.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm mb-3"
              placeholder="Enter rejection reason..."
            />
            <div className="flex gap-2">
              <button onClick={handleReject} disabled={rejecting || !rejectReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 transition-colors">
                {rejecting ? 'Rejecting...' : 'Confirm Reject'}
              </button>
              <button onClick={() => { setShowRejectDialog(false); setRejectReason(''); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </section>
        )}

        {/* Request info dialog */}
        {showInfoDialog && (
          <section className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <h2 className="font-semibold text-amber-900 mb-2">Request Additional Information</h2>
            <p className="text-sm text-amber-700 mb-3">Describe what additional information is needed from the declarant.</p>
            <textarea
              value={infoNote}
              onChange={(e) => setInfoNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm mb-3"
              placeholder="e.g. Please provide the commercial invoice for goods line 2..."
            />
            <div className="flex gap-2">
              <button onClick={handleRequestInfo} disabled={requestingInfo || !infoNote.trim()}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 disabled:opacity-50 transition-colors">
                {requestingInfo ? 'Requesting...' : 'Confirm Request'}
              </button>
              <button onClick={() => { setShowInfoDialog(false); setInfoNote(''); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </section>
        )}

        {/* Declaration Overview */}
        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Declaration Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div><span className="text-gray-500 block">Declarant</span><span className="font-medium">{decl.declarantName}</span></div>
            <div><span className="text-gray-500 block">Company</span><span className="font-medium">{decl.companyName}</span></div>
            <div><span className="text-gray-500 block">Customs Office</span><span className="font-medium">{decl.customsOffice || '—'}</span></div>
            <div><span className="text-gray-500 block">Total Value</span><span className="font-medium">{decl.totalValue?.toFixed(2) || '—'}</span></div>
            <div><span className="text-gray-500 block">Total Duty</span><span className="font-medium">{decl.totalDuty?.toFixed(2) || '—'}</span></div>
            <div><span className="text-gray-500 block">Total VAT</span><span className="font-medium">{decl.totalVat?.toFixed(2) || '—'}</span></div>
          </div>
          {decl.notes && <div className="mt-3 text-sm text-gray-600"><span className="text-gray-500 block">Notes:</span>{decl.notes}</div>}
        </section>

        {/* Supporting Documents */}
        <SupportingDocumentsSection
          declarationId={Number(id)}
          attachments={attachments}
          docTypes={docTypes}
          uploadType={uploadType}
          setUploadType={setUploadType}
          uploading={uploading}
          setUploading={setUploading}
          canEdit={canEditDocs}
          onUpload={handleUpload}
          onDelete={handleDeleteAtt}
          onReplace={handleReplaceAtt}
          error={error}
          setError={setError}
        />

        {/* Line Items */}
        <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900">Goods Lines ({decl.lineItems.length})</h2>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-2 font-medium text-gray-700">HS Code</th>
              <th className="text-left px-4 py-2 font-medium text-gray-700">Description</th>
              <th className="text-right px-4 py-2 font-medium text-gray-700">Qty</th>
              <th className="text-right px-4 py-2 font-medium text-gray-700">Unit Price</th>
              <th className="text-right px-4 py-2 font-medium text-gray-700">Total</th>
              <th className="text-right px-4 py-2 font-medium text-gray-700">Duty</th>
              <th className="text-right px-4 py-2 font-medium text-gray-700">VAT</th>
            </tr></thead>
            <tbody>
              {decl.lineItems.map((li, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="px-4 py-2 font-mono text-xs">{li.hsCode}</td>
                  <td className="px-4 py-2">{li.description}</td>
                  <td className="px-4 py-2 text-right">{li.quantity}</td>
                  <td className="px-4 py-2 text-right">{li.unitPrice.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">{li.totalValue.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">{li.dutyAmount?.toFixed(2) || '—'}</td>
                  <td className="px-4 py-2 text-right">{li.vatAmount?.toFixed(2) || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Audit Trail */}
        {auditLog.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="font-semibold text-gray-900">Audit Trail</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {auditLog.map((log) => {
                const actionLabels: Record<string, string> = {
                  CREATED: 'Created',
                  UPDATED: 'Updated',
                  SUBMITTED: 'Submitted for review',
                  APPROVED: 'Approved',
                  REJECTED: 'Rejected',
                  RESUBMITTED: 'Resubmitted',
                  INFO_REQUESTED: 'Additional info requested',
                  DELETED: 'Deleted',
                };
                const actionColors: Record<string, string> = {
                  CREATED: 'bg-gray-100 text-gray-700',
                  UPDATED: 'bg-gray-100 text-gray-700',
                  SUBMITTED: 'bg-blue-100 text-blue-700',
                  APPROVED: 'bg-green-100 text-green-700',
                  REJECTED: 'bg-red-100 text-red-700',
                  RESUBMITTED: 'bg-blue-100 text-blue-700',
                  INFO_REQUESTED: 'bg-purple-100 text-purple-700',
                  DELETED: 'bg-red-100 text-red-700',
                };
                return (
                  <div key={log.id} className="px-4 py-3 flex items-start gap-3">
                    <div className="mt-0.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${actionColors[log.action] || 'bg-gray-100 text-gray-700'}`}>
                        {actionLabels[log.action] || log.action}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 text-sm">
                        <span className="font-medium text-gray-900">{log.userName}</span>
                        {log.fromStatus && log.toStatus && (
                          <span className="text-gray-400">
                            {log.fromStatus} → {log.toStatus}
                          </span>
                        )}
                      </div>
                      {log.note && (
                        <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{log.note}</p>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}