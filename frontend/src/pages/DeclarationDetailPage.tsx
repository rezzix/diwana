import { useState, useEffect, type FormEvent } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getDeclaration, deleteDeclaration, submitDeclaration, resubmitDeclaration, rejectDeclaration, approveDeclaration, type DeclarationDto } from '@/api/declarations';
import { getAttachments, deleteAttachment, getAttachmentViewUrl, getAttachmentDownloadUrl, type AttachmentDto } from '@/api/attachments';
import { useAuthStore } from '@/stores/authStore';

function DocumentViewer({ attachment, declarationId, onClose }: {
  attachment: AttachmentDto;
  declarationId: number;
  onClose: () => void;
}) {
  const url = getAttachmentViewUrl(declarationId, attachment.id);
  const isImage = attachment.contentType.startsWith('image/');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium text-gray-900 truncate">{attachment.fileName}</span>
            <span className="text-xs text-gray-400">{attachment.contentType}</span>
          </div>
          <div className="flex items-center gap-2">
            <a href={getAttachmentDownloadUrl(declarationId, attachment.id)}
              className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
              Download
            </a>
            <button onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-2">
          {isImage ? (
            <img src={url} alt={attachment.fileName} className="max-w-full max-h-[75vh] mx-auto block" />
          ) : (
            <iframe src={url} title={attachment.fileName} className="w-full border-0" style={{ height: '75vh' }} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function DeclarationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [decl, setDecl] = useState<DeclarationDto | null>(null);
  const [attachments, setAttachments] = useState<AttachmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadType, setUploadType] = useState('COMMERCIAL_INVOICE');
  const [uploading, setUploading] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState<AttachmentDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const isOwner = user?.role === 'DECLARANT';
  const isController = user?.role === 'CONTROLLER';

  const fetchData = async () => {
    if (!id) return;
    try {
      const d = await getDeclaration(Number(id));
      setDecl(d);
      const atts = await getAttachments(Number(id));
      setAttachments(atts);
    } catch {
      setError('Failed to load declaration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const ALLOWED_FILE_TYPES = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.tif'];
  const ALLOWED_MIME_PREFIXES = ['application/pdf', 'image/'];

  const validateFileType = (file: File): boolean => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const extOk = ALLOWED_FILE_TYPES.includes(ext);
    const mimeOk = ALLOWED_MIME_PREFIXES.some((p) => file.type.startsWith(p));
    return extOk || mimeOk;
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file || !id) return;
    if (!validateFileType(file)) {
      setError('Only PDF and image files (JPEG, PNG, TIFF) are allowed');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docType', uploadType);
      const res = await fetch(`/api/declarations/${id}/attachments`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.data || 'Upload failed');
      }
      fileInput.value = '';
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
    if (!confirm('Delete this document?')) return;
    try {
      await deleteAttachment(Number(id), attId);
      setAttachments(attachments.filter((a) => a.id !== attId));
    } catch {
      setError('Failed to delete attachment');
    }
  };

  const handleReplaceAtt = async (attId: number, file: File) => {
    if (!id) return;
    if (!validateFileType(file)) {
      setError('Only PDF and image files (JPEG, PNG, TIFF) are allowed');
      return;
    }
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

  const triggerReplaceInput = (attId: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) handleReplaceAtt(attId, file);
    };
    input.click();
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to approve declaration');
    } finally {
      setApproving(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return <div className="min-h-screen bg-surface flex items-center justify-center"><div className="text-gray-400">Loading...</div></div>;
  }

  if (!decl) {
    return <div className="min-h-screen bg-surface p-6 text-center text-gray-500">Declaration not found.</div>;
  }

  const docTypeLabels: Record<string, string> = {
    COMMERCIAL_INVOICE: 'Commercial Invoice',
    PACKING_LIST: 'Packing List',
    CERTIFICATE_OF_ORIGIN: 'Certificate of Origin',
    OTHER: 'Other',
  };

  return (
    <div className="min-h-screen bg-surface">
      {viewingAttachment && id && (
        <DocumentViewer
          attachment={viewingAttachment}
          declarationId={Number(id)}
          onClose={() => setViewingAttachment(null)}
        />
      )}

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
            {isOwner && decl.status === 'REJECTED' && (
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
            <p className="mt-3 text-xs text-red-500">You can correct the declaration and resubmit it for review.</p>
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

        {/* Documents */}
        <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Supporting Documents</h2>
              <p className="text-xs text-gray-500 mt-0.5">PDF or image files only, max 10MB per file</p>
            </div>
          </div>

          {/* Upload form */}
          {isOwner && (decl.status === 'DRAFT' || decl.status === 'REJECTED') && (
            <form onSubmit={handleUpload} className="p-4 border-b border-gray-200 bg-gray-50/50">
              <div className="flex items-end gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Document Type</label>
                  <select value={uploadType} onChange={(e) => setUploadType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    {Object.entries(docTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">File</label>
                  <input id="file-input" type="file" accept=".pdf,image/*"
                    className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                </div>
                <button type="submit" disabled={uploading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50 transition-colors">
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          )}

          {/* Attachment list */}
          {attachments.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">No documents attached yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-2 font-medium text-gray-700">Document Type</th>
                <th className="text-left px-4 py-2 font-medium text-gray-700">File Name</th>
                <th className="text-right px-4 py-2 font-medium text-gray-700">Size</th>
                <th className="text-right px-4 py-2 font-medium text-gray-700">Uploaded</th>
                <th className="text-right px-4 py-2 font-medium text-gray-700">Actions</th>
              </tr></thead>
              <tbody>
                {attachments.map((att) => (
                  <tr key={att.id} className="border-b border-gray-100">
                    <td className="px-4 py-2 text-gray-700">{docTypeLabels[att.docType] || att.docType}</td>
                    <td className="px-4 py-2">
                      <button onClick={() => setViewingAttachment(att)}
                        className="text-primary-600 hover:underline font-medium">
                        {att.fileName}
                      </button>
                    </td>
                    <td className="px-4 py-2 text-right text-gray-600">{formatSize(att.fileSize)}</td>
                    <td className="px-4 py-2 text-right text-gray-400 text-xs">{new Date(att.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right space-x-2">
                      <button onClick={() => setViewingAttachment(att)}
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors">
                        View
                      </button>
                      <a href={getAttachmentDownloadUrl(Number(id), att.id)}
                        className="text-xs px-2 py-1 bg-gray-50 text-primary-600 rounded hover:bg-gray-100 transition-colors">
                        Download
                      </a>
                      {isOwner && (decl.status === 'DRAFT' || decl.status === 'REJECTED') && (
                        <button onClick={() => triggerReplaceInput(att.id)}
                          className="text-xs px-2 py-1 bg-amber-50 text-amber-600 rounded hover:bg-amber-100 transition-colors">
                          Replace
                        </button>
                      )}
                      {isOwner && (decl.status === 'DRAFT' || decl.status === 'REJECTED') && (
                        <button onClick={() => handleDeleteAtt(att.id)}
                          className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors">
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}