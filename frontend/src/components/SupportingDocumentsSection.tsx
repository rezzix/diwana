import { useState, useRef, useEffect, type FormEvent } from 'react';
import { smartImportAttachment, getAttachments, getAttachmentViewUrl, getAttachmentDownloadUrl, markAttachmentImported, type AttachmentDto, type SmartImportResult } from '@/api/attachments';
import { formatMandatoryFor, type DocumentTypeDto } from '@/api/documentTypes';
import type { LineItemRequest } from '@/api/declarations';
import type { OriginDto } from '@/api/origins';
import { validateVlmLine, mapVlmLineToLineItemRequest, type VlmLineItem } from '@/utils/vlmMapping';

function EditActionsDropdown({ onReplace, onDelete }: {
  onReplace: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button onClick={() => setOpen(!open)}
        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
        Edit ▾
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
          <button onClick={() => { setOpen(false); onReplace(); }}
            className="w-full text-left px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50 transition-colors">
            Replace
          </button>
          <button onClick={() => { setOpen(false); onDelete(); }}
            className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors">
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

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

interface InvoiceData {
  invoice: {
    date: string | null;
    seller: string | null;
    client: string | null;
    countryOfOrigin: string | null;
    grandTotal: string | null;
    tax: string | null;
    currency: string | null;
  };
  lineItems: Array<{
    hsCode: string | null;
    description: string | null;
    quantity: string | null;
    unit: string | null;
    unitPrice: string | null;
    totalValue: string | null;
    currency: string | null;
    countryOfOrigin: string | null;
  }>;
}

function SmartImportModal({ attachment, declarationId, onClose, onImported, onAddLines, origins }: {
  attachment: AttachmentDto;
  declarationId: number;
  onClose: () => void;
  onImported: () => void;
  onAddLines?: (lines: LineItemRequest[]) => void;
  origins?: OriginDto[];
}) {
  const [vlmText, setVlmText] = useState<string | null>(attachment.vlmStatus === 'COMPLETED' ? attachment.vlmText : null);
  const [vlmModel, setVlmModel] = useState<string | null>(null);
  const [vlmUrl, setVlmUrl] = useState<string | null>(null);
  const [vlmProcessingTimeMs, setVlmProcessingTimeMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(attachment.vlmStatus === 'PROCESSING' || attachment.vlmStatus === null);
  const [vlmError, setVlmError] = useState(attachment.vlmStatus === 'FAILED' ? (attachment.vlmError || 'VLM import failed') : '');
  const [selectedLines, setSelectedLines] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Already completed — show data
    if (attachment.vlmStatus === 'COMPLETED' && attachment.vlmText) {
      return;
    }

    // Processing — poll until done
    if (attachment.vlmStatus === 'PROCESSING') {
      const interval = setInterval(async () => {
        try {
          const atts = await getAttachments(declarationId);
          const updated = atts.find((a) => a.id === attachment.id);
          if (updated?.vlmStatus === 'COMPLETED' && updated.vlmText) {
            setVlmText(updated.vlmText);
            setLoading(false);
            onImported();
            clearInterval(interval);
          } else if (updated?.vlmStatus === 'FAILED') {
            setVlmError(updated.vlmError || 'VLM import failed');
            setLoading(false);
            clearInterval(interval);
          }
        } catch { /* ignore polling errors */ }
      }, 5000);
      return () => clearInterval(interval);
    }

    // Failed — show error (no polling, user clicks retry)
    if (attachment.vlmStatus === 'FAILED') {
      return;
    }

    // Not started — trigger VLM import (returns immediately with PROCESSING)
    const controller = new AbortController();
    smartImportAttachment(declarationId, attachment.id, controller.signal)
      .then(() => {
        // Now poll until complete
        const poll = setInterval(async () => {
          try {
            const atts = await getAttachments(declarationId);
            const updated = atts.find((a) => a.id === attachment.id);
            if (updated?.vlmStatus === 'COMPLETED' && updated.vlmText) {
              setVlmText(updated.vlmText);
              setLoading(false);
              onImported();
              clearInterval(poll);
            } else if (updated?.vlmStatus === 'FAILED') {
              setVlmError(updated.vlmError || 'VLM import failed');
              setLoading(false);
              clearInterval(poll);
            }
          } catch { /* ignore */ }
        }, 5000);
        return () => clearInterval(poll);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        let message = 'VLM analysis failed. Please try again.';
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosErr = err as { response?: { data?: { data?: string } } };
          if (axiosErr.response?.data?.data) {
            message = axiosErr.response.data.data;
          }
        } else if (err instanceof Error) {
          message = err.message;
        }
        setVlmError(message);
        setLoading(false);
      });
    return () => controller.abort();
  }, [attachment.id, attachment.vlmStatus, attachment.vlmText, declarationId, onImported]);

  let parsedData: InvoiceData | null = null;
  if (vlmText) {
    try {
      parsedData = JSON.parse(vlmText);
    } catch {
      parsedData = null;
    }
  }

  // Compute line item validation
  const lineValidations = parsedData?.lineItems?.map((item) => validateVlmLine(item as VlmLineItem)) ?? [];
  const validLineIndices = lineValidations
    .map((v, i) => v.valid ? i : -1)
    .filter((i) => i >= 0);

  // Auto-select all lines when data arrives
  useEffect(() => {
    if (parsedData?.lineItems && parsedData.lineItems.length > 0 && selectedLines.size === 0) {
      setSelectedLines(new Set(parsedData.lineItems.map((_, i) => i)));
    }
  }, [parsedData?.lineItems?.length]);

  const toggleLine = (index: number) => {
    setSelectedLines((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const selectAllValid = () => setSelectedLines(new Set(parsedData?.lineItems?.map((_, i) => i) ?? []));
  const deselectAll = () => setSelectedLines(new Set());

  const handleAddLines = () => {
    if (!onAddLines || !parsedData?.lineItems || !origins) return;
    const linesToAdd: LineItemRequest[] = [];
    for (const index of Array.from(selectedLines).sort()) {
      const item = parsedData.lineItems[index] as VlmLineItem;
      const mapped = mapVlmLineToLineItemRequest(item, origins);
      linesToAdd.push(mapped);
    }
    if (linesToAdd.length > 0) {
      onAddLines(linesToAdd);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium text-gray-900">Smart Import</span>
            <span className="text-sm text-gray-500 truncate">{attachment.fileName}</span>
          </div>
          <button onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <svg className="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-600 text-sm">Analysing document with VLM...</p>
            </div>
          )}

          {vlmError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {vlmError}
              <button onClick={onClose}
                className="ml-2 text-xs underline">Close</button>
            </div>
          )}

          {!loading && !vlmError && parsedData && (
            <div className="space-y-4">
              {(vlmModel || vlmProcessingTimeMs != null) && (
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  {vlmModel && <span className="bg-gray-100 px-2 py-1 rounded">Model: {vlmModel}</span>}
                  {vlmProcessingTimeMs != null && <span className="bg-gray-100 px-2 py-1 rounded">Processing time: {(vlmProcessingTimeMs / 1000).toFixed(1)}s</span>}
                </div>
              )}
              <h3 className="font-semibold text-gray-900">Invoice Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-gray-50 rounded-lg p-3">
                {parsedData.invoice.date && (
                  <div><span className="text-xs text-gray-500">Date</span><br /><span className="text-sm font-medium">{parsedData.invoice.date}</span></div>
                )}
                {parsedData.invoice.seller && (
                  <div><span className="text-xs text-gray-500">Seller</span><br /><span className="text-sm font-medium">{parsedData.invoice.seller}</span></div>
                )}
                {parsedData.invoice.client && (
                  <div><span className="text-xs text-gray-500">Client</span><br /><span className="text-sm font-medium">{parsedData.invoice.client}</span></div>
                )}
                {parsedData.invoice.countryOfOrigin && (
                  <div><span className="text-xs text-gray-500">Country of Origin</span><br /><span className="text-sm font-medium">{parsedData.invoice.countryOfOrigin}</span></div>
                )}
                {parsedData.invoice.grandTotal && (
                  <div><span className="text-xs text-gray-500">Grand Total</span><br /><span className="text-sm font-medium">{parsedData.invoice.grandTotal}</span></div>
                )}
                {parsedData.invoice.tax && (
                  <div><span className="text-xs text-gray-500">Tax</span><br /><span className="text-sm font-medium">{parsedData.invoice.tax}</span></div>
                )}
                {parsedData.invoice.currency && (
                  <div><span className="text-xs text-gray-500">Currency</span><br /><span className="text-sm font-medium">{parsedData.invoice.currency}</span></div>
                )}
              </div>

              {parsedData.lineItems && parsedData.lineItems.length > 0 && (
                <>
                  <h3 className="font-semibold text-gray-900">Line Items ({parsedData.lineItems.length})</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-gray-200 rounded-lg">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          {onAddLines && <th className="w-8 px-2 py-2"></th>}
                          <th className="text-left px-3 py-2 font-medium text-gray-700">HS Code</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-700">Description</th>
                          <th className="text-right px-3 py-2 font-medium text-gray-700">Qty</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-700">Unit</th>
                          <th className="text-right px-3 py-2 font-medium text-gray-700">Unit Price</th>
                          <th className="text-right px-3 py-2 font-medium text-gray-700">Total</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-700">Currency</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-700">Origin</th>
                          {onAddLines && <th className="px-2 py-2"></th>}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.lineItems.map((item, i) => {
                          const validation = lineValidations[i];
                          const isValid = validation?.valid ?? false;
                          return (
                            <tr key={i} className={`border-b border-gray-100 ${!isValid ? 'bg-red-50/50' : selectedLines.has(i) ? 'bg-primary-50/50' : ''}`}>
                              {onAddLines && (
                                <td className="px-2 py-1.5 text-center">
                                  <input type="checkbox"
                                    checked={selectedLines.has(i)}
                                    onChange={() => toggleLine(i)}
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                  />
                                </td>
                              )}
                              <td className="px-3 py-1.5 font-mono text-xs">{item.hsCode || '—'}</td>
                              <td className="px-3 py-1.5">{item.description || '—'}</td>
                              <td className="px-3 py-1.5 text-right">{item.quantity || '—'}</td>
                              <td className="px-3 py-1.5 text-xs">{item.unit || '—'}</td>
                              <td className="px-3 py-1.5 text-right">{item.unitPrice || '—'}</td>
                              <td className="px-3 py-1.5 text-right font-medium">{item.totalValue || '—'}</td>
                              <td className="px-3 py-1.5 text-xs">{item.currency || '—'}</td>
                              <td className="px-3 py-1.5 text-xs">{item.countryOfOrigin || '—'}</td>
                              {onAddLines && (
                                <td className="px-2 py-1.5">
                                  {!isValid && validation && (
                                    <span className="text-xs text-red-600" title={validation.errors.join(', ')}>
                                      ⚠ Missing: {validation.errors.join(', ')}
                                    </span>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {onAddLines && origins && (
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3">
                        <button onClick={selectAllValid}
                          className="text-xs text-primary-600 hover:underline">
                          Select all valid
                        </button>
                        <button onClick={deselectAll}
                          className="text-xs text-gray-500 hover:underline">
                          Deselect all
                        </button>
                        <span className="text-xs text-gray-500">
                          {selectedLines.size} of {parsedData?.lineItems?.length ?? 0} line{(parsedData?.lineItems?.length ?? 0) !== 1 ? 's' : ''} selected
                          {validLineIndices.length < (parsedData?.lineItems?.length ?? 0) && (
                            <span className="ml-1 text-amber-600">({(parsedData?.lineItems?.length ?? 0) - validLineIndices.length} with missing data)</span>
                          )}
                        </span>
                      </div>
                      <button onClick={handleAddLines}
                        disabled={selectedLines.size === 0}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        Add {selectedLines.size} line{selectedLines.size !== 1 ? 's' : ''} to declaration
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {!loading && !vlmError && vlmText && !parsedData && (
            <div className="space-y-2">
              {(vlmModel || vlmProcessingTimeMs != null) && (
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  {vlmModel && <span className="bg-gray-100 px-2 py-1 rounded">Model: {vlmModel}</span>}
                  {vlmProcessingTimeMs != null && <span className="bg-gray-100 px-2 py-1 rounded">Processing time: {(vlmProcessingTimeMs / 1000).toFixed(1)}s</span>}
                </div>
              )}
              <h3 className="font-semibold text-gray-900">Raw VLM Output</h3>
              <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs overflow-auto max-h-[60vh] whitespace-pre-wrap">{vlmText}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const ALLOWED_FILE_TYPES = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.tif', '.webp'];
const ALLOWED_MIME_PREFIXES = ['application/pdf', 'image/'];

function validateFileType(file: File): boolean {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  const extOk = ALLOWED_FILE_TYPES.includes(ext);
  const mimeOk = ALLOWED_MIME_PREFIXES.some((p) => file.type.startsWith(p));
  return extOk || mimeOk;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

interface SupportingDocumentsSectionProps {
  declarationId: number;
  attachments: AttachmentDto[];
  docTypes: DocumentTypeDto[];
  uploadType: string;
  setUploadType: (type: string) => void;
  uploading: boolean;
  setUploading: (uploading: boolean) => void;
  canEdit: boolean;
  hideImport?: boolean;
  onUpload: (formData: FormData) => Promise<void>;
  onDelete: (attachmentId: number) => Promise<void>;
  onReplace: (attachmentId: number, file: File) => Promise<void>;
  onAttachmentsChanged?: () => void;
  onAddLines?: (lines: LineItemRequest[]) => void;
  origins?: OriginDto[];
  error?: string;
  setError?: (error: string) => void;
}

type DocRow =
  | { key: string; docType: DocumentTypeDto; attachment: AttachmentDto; mandatory: boolean }
  | { key: string; docType: DocumentTypeDto; attachment: null; mandatory: boolean };

export default function SupportingDocumentsSection({
  declarationId,
  attachments,
  docTypes,
  uploadType,
  setUploadType,
  uploading,
  canEdit,
  onUpload,
  onDelete,
  onReplace,
  onAttachmentsChanged,
  onAddLines,
  origins,
  hideImport,
  error,
  setError,
}: SupportingDocumentsSectionProps) {
  const [viewingAttachment, setViewingAttachment] = useState<AttachmentDto | null>(null);
  const [importingAttachment, setImportingAttachment] = useState<AttachmentDto | null>(null);

  // Poll for VLM status updates every 5 seconds when any attachment is PROCESSING
  useEffect(() => {
    if (hideImport) return;
    const hasProcessing = attachments.some((a) => a.vlmStatus === 'PROCESSING');
    if (!hasProcessing || !declarationId) return;
    const interval = setInterval(() => {
      // Directly refresh attachments via onAttachmentsChanged callback
      onAttachmentsChanged?.();
    }, 5000);
    return () => clearInterval(interval);
  }, [attachments, declarationId]);

  const mandatoryDocTypes = docTypes
    .filter((dt) => dt.mandatoryFor)
    .sort((a, b) => {
      if (a.importOrder != null && b.importOrder == null) return -1;
      if (a.importOrder == null && b.importOrder != null) return 1;
      if (a.importOrder != null && b.importOrder != null) return a.importOrder - b.importOrder;
      return a.name.localeCompare(b.name);
    });

  const attachmentsByType: Record<string, AttachmentDto> = {};
  for (const att of attachments) {
    if (!attachmentsByType[att.docType]) {
      attachmentsByType[att.docType] = att;
    }
  }

  const shownInMandatoryRows = new Set<string>();
  for (const dt of mandatoryDocTypes) {
    const att = attachmentsByType[dt.code];
    if (att) shownInMandatoryRows.add(String(att.id));
  }

  const importableDocTypes = docTypes
    .filter((dt) => dt.importOrder != null)
    .sort((a, b) => (a.importOrder ?? 0) - (b.importOrder ?? 0));

  const importedDocTypeCodes = new Set<string>();
  for (const att of attachments) {
    if (att.imported) {
      importedDocTypeCodes.add(att.docType);
    }
  }

  function canImport(docTypeCode: string): boolean {
    const dt = docTypes.find((d) => d.code === docTypeCode);
    if (!dt || dt.importOrder == null) return false;
    return importableDocTypes
      .filter((t) => (t.importOrder ?? 0) < (dt.importOrder ?? 0))
      .every((t) => importedDocTypeCodes.has(t.code));
  }

  const rows: DocRow[] = [];

  for (const dt of mandatoryDocTypes) {
    rows.push({
      key: `mandatory-${dt.code}`,
      docType: dt,
      attachment: attachmentsByType[dt.code] || null,
      mandatory: true,
    });
  }

  for (const att of attachments) {
    if (!shownInMandatoryRows.has(String(att.id))) {
      const dt = docTypes.find((d) => d.code === att.docType);
      rows.push({
        key: `extra-${att.id}`,
        docType: dt || { code: att.docType, name: att.docType, mandatoryFor: null, importOrder: null },
        attachment: att,
        mandatory: false,
      });
    }
  }

  const triggerUpload = (docTypeCode: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        if (!validateFileType(file)) {
          setError?.('Only PDF and image files (JPEG, PNG, TIFF) are allowed');
          return;
        }
        const formData = new FormData();
        formData.append('file', file);
        formData.append('docType', docTypeCode);
        onUpload(formData);
      }
    };
    input.click();
  };

  const triggerReplace = (attId: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        if (!validateFileType(file)) {
          setError?.('Only PDF and image files (JPEG, PNG, TIFF) are allowed');
          return;
        }
        onReplace(attId, file);
      }
    };
    input.click();
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    const fileInput = document.getElementById('doc-file-input') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) return;
    if (!validateFileType(file)) {
      setError?.('Only PDF and image files (JPEG, PNG, TIFF) are allowed');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', uploadType);
    await onUpload(formData);
    fileInput.value = '';
  };

  const handleDelete = async (attId: number) => {
    if (!confirm('Delete this document?')) return;
    await onDelete(attId);
  };

  const handleSmartImport = (att: AttachmentDto) => {
    setImportingAttachment(att);
  };

  const hasRows = rows.length > 0;

  return (
    <>
      {viewingAttachment && (
        <DocumentViewer
          attachment={viewingAttachment}
          declarationId={declarationId}
          onClose={() => setViewingAttachment(null)}
        />
      )}

      {importingAttachment && (
        <SmartImportModal
          attachment={importingAttachment}
          declarationId={declarationId}
          onClose={() => setImportingAttachment(null)}
          onImported={onAttachmentsChanged}
          onAddLines={onAddLines}
          origins={origins}
        />
      )}

      <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Supporting Documents</h2>
            <p className="text-xs text-gray-500 mt-0.5">PDF or image files only, max 10MB per file</p>
          </div>
        </div>

        {/* Unified documents table */}
        {hasRows ? (
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-2 font-medium text-gray-700">Document Type</th>
              <th className="text-left px-4 py-2 font-medium text-gray-700">File Name</th>
              <th className="text-right px-4 py-2 font-medium text-gray-700">Size</th>
              <th className="text-right px-4 py-2 font-medium text-gray-700">Uploaded</th>
              <th className="text-right px-4 py-2 font-medium text-gray-700">Actions</th>
            </tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-b border-gray-100">
                  <td className="px-4 py-2 text-gray-700">
                    <div className="flex items-center gap-2">
                      {row.mandatory && (
                        <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-amber-100 text-amber-700 whitespace-nowrap">
                          {formatMandatoryFor(row.docType.mandatoryFor)}
                        </span>
                      )}
                      <span>{row.docType.name}</span>
                    </div>
                  </td>
                  {row.attachment ? (
                    <>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setViewingAttachment(row.attachment!)}
                            className="text-primary-600 hover:underline font-medium">
                            {row.attachment.fileName}
                          </button>
                          {!hideImport && row.attachment.vlmStatus === 'COMPLETED' && (
                            <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-green-100 text-green-700">Imported</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right text-gray-600">{formatSize(row.attachment.fileSize)}</td>
                      <td className="px-4 py-2 text-right text-gray-400 text-xs">{new Date(row.attachment.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-2 text-right space-x-2">
                        <button onClick={() => setViewingAttachment(row.attachment!)}
                          className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors">
                          View
                        </button>
                        {(() => {
                          if (hideImport) return null;
                          const status = row.attachment!.vlmStatus;
                          const isImportable = row.docType.importOrder != null;
                          if (!isImportable) return null;
                          // PROCESSING state
                          if (status === 'PROCESSING') {
                            return (
                              <button disabled
                                className="text-xs px-2 py-1 bg-gray-200 text-gray-500 rounded cursor-not-allowed transition-colors">
                                <span className="inline-flex items-center gap-1">
                                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                  Importing...
                                </span>
                              </button>
                            );
                          }
                          // FAILED state — show retry
                          if (status === 'FAILED') {
                            return (
                              <button onClick={() => handleSmartImport(row.attachment!)}
                                title={row.attachment!.vlmError || 'VLM import failed. Click to retry.'}
                                className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors">
                                Import ↻
                              </button>
                            );
                          }
                          // COMPLETED — show View Data
                          if (status === 'COMPLETED' || row.attachment!.imported) {
                            return (
                              <button onClick={() => handleSmartImport(row.attachment!)}
                                className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100 transition-colors">
                                View Data
                              </button>
                            );
                          }
                          // Not started — show Import button
                          return (
                            <button onClick={() => handleSmartImport(row.attachment!)}
                              disabled={!canImport(row.docType.code)}
                              title={canImport(row.docType.code) ? 'Smart import with VLM' : 'Higher-priority documents must be imported first'}
                              className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                              Import
                            </button>
                          );
                        })()}
                        {canEdit && (
                          <EditActionsDropdown
                            onReplace={() => triggerReplace(row.attachment!.id)}
                            onDelete={() => handleDelete(row.attachment!.id)}
                          />
                        )}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2 text-gray-400 italic">Not uploaded</td>
                      <td className="px-4 py-2 text-right text-gray-400">—</td>
                      <td className="px-4 py-2 text-right text-gray-400">—</td>
                      <td className="px-4 py-2 text-right">
                        {canEdit && (
                          <button onClick={() => triggerUpload(row.docType.code)} disabled={uploading}
                            className="text-xs px-2 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 transition-colors">
                            {uploading ? 'Uploading...' : 'Upload'}
                          </button>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-center text-sm text-gray-400">No documents attached yet.</div>
        )}

        {/* Upload form for additional documents */}
        {canEdit && (
          <form onSubmit={handleUpload} className="p-4 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Document Type</label>
                <select value={uploadType} onChange={(e) => setUploadType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  {docTypes.map((dt) => <option key={dt.code} value={dt.code}>{dt.name}{dt.mandatoryFor ? ' *' : ''}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">File</label>
                <input id="doc-file-input" type="file" accept=".pdf,image/*"
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
              </div>
              <button type="submit" disabled={uploading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50 transition-colors">
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </form>
        )}
      </section>
    </>
  );
}