import { useState, useRef, useEffect, type FormEvent } from 'react';
import { getAttachmentViewUrl, getAttachmentDownloadUrl, markAttachmentImported, type AttachmentDto } from '@/api/attachments';
import { formatMandatoryFor, type DocumentTypeDto } from '@/api/documentTypes';

function EditActionsDropdown({ onReplace, onDelete, canImport, importDisabled, importTitle, onImport }: {
  onReplace: () => void;
  onDelete: () => void;
  canImport: boolean;
  importDisabled: boolean;
  importTitle: string;
  onImport: () => void;
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
          {canImport && (
            <button onClick={() => { setOpen(false); onImport(); }}
              disabled={importDisabled}
              title={importTitle}
              className="w-full text-left px-3 py-1.5 text-xs text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              Import
            </button>
          )}
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

const ALLOWED_FILE_TYPES = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.tif'];
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
  onUpload: (formData: FormData) => Promise<void>;
  onDelete: (attachmentId: number) => Promise<void>;
  onReplace: (attachmentId: number, file: File) => Promise<void>;
  onAttachmentsChanged?: () => void;
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
  error,
  setError,
}: SupportingDocumentsSectionProps) {
  const [viewingAttachment, setViewingAttachment] = useState<AttachmentDto | null>(null);

  const mandatoryDocTypes = docTypes
    .filter((dt) => dt.mandatoryFor)
    .sort((a, b) => {
      // Sort by importOrder ascending; null importOrder goes last
      if (a.importOrder != null && b.importOrder == null) return -1;
      if (a.importOrder == null && b.importOrder != null) return 1;
      if (a.importOrder != null && b.importOrder != null) return a.importOrder - b.importOrder;
      return a.name.localeCompare(b.name);
    });

  // Map first attachment per docType
  const attachmentsByType: Record<string, AttachmentDto> = {};
  for (const att of attachments) {
    if (!attachmentsByType[att.docType]) {
      attachmentsByType[att.docType] = att;
    }
  }

  // Track first attachment per mandatory type (already shown in mandatory rows)
  const shownInMandatoryRows = new Set<string>();
  for (const dt of mandatoryDocTypes) {
    const att = attachmentsByType[dt.code];
    if (att) shownInMandatoryRows.add(String(att.id));
  }

  // Doc types with importOrder, sorted by importOrder ascending
  const importableDocTypes = docTypes
    .filter((dt) => dt.importOrder != null)
    .sort((a, b) => (a.importOrder ?? 0) - (b.importOrder ?? 0));

  // For each importable doc type, check if it has at least one imported attachment
  const importedDocTypeCodes = new Set<string>();
  for (const att of attachments) {
    if (att.imported) {
      importedDocTypeCodes.add(att.docType);
    }
  }

  // An attachment's doc type can be imported if all doc types with lower importOrder are already imported
  function canImport(docTypeCode: string): boolean {
    const dt = docTypes.find((d) => d.code === docTypeCode);
    if (!dt || dt.importOrder == null) return false;
    // All doc types with a lower importOrder must be imported
    return importableDocTypes
      .filter((t) => (t.importOrder ?? 0) < (dt.importOrder ?? 0))
      .every((t) => importedDocTypeCodes.has(t.code));
  }

  // Build unified row list: mandatory types first, then extra attachments
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

  const handleMarkImported = async (attId: number) => {
    try {
      await markAttachmentImported(declarationId, attId);
      onAttachmentsChanged?.();
    } catch {
      setError?.('Failed to mark document as imported');
    }
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
                          {row.attachment.imported && (
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
                        <a href={getAttachmentDownloadUrl(declarationId, row.attachment.id)}
                          className="text-xs px-2 py-1 bg-gray-50 text-primary-600 rounded hover:bg-gray-100 transition-colors">
                          Download
                        </a>
                        {canEdit && (
                          <EditActionsDropdown
                            onReplace={() => triggerReplace(row.attachment!.id)}
                            onDelete={() => handleDelete(row.attachment!.id)}
                            canImport={row.docType.importOrder != null && !row.attachment.imported}
                            importDisabled={row.docType.importOrder != null && !row.attachment.imported && !canImport(row.docType.code)}
                            importTitle={
                              canImport(row.docType.code)
                                ? 'Mark as imported'
                                : 'Higher-priority documents must be imported first'
                            }
                            onImport={() => handleMarkImported(row.attachment!.id)}
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