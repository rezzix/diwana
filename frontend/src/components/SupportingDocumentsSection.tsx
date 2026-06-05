import { useState, type FormEvent } from 'react';
import { getAttachmentViewUrl, getAttachmentDownloadUrl, type AttachmentDto } from '@/api/attachments';
import { formatMandatoryFor, type DocumentTypeDto } from '@/api/documentTypes';

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
  error,
  setError,
}: SupportingDocumentsSectionProps) {
  const [viewingAttachment, setViewingAttachment] = useState<AttachmentDto | null>(null);

  const docTypeLabels: Record<string, string> = Object.fromEntries(
    docTypes.map((dt) => [dt.code, dt.name])
  );

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
                  <td className="px-4 py-2 text-gray-700">
                    {docTypeLabels[att.docType] || att.docType}
                    {docTypes.find((dt) => dt.code === att.docType)?.mandatoryFor && (
                      <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                        {formatMandatoryFor(docTypes.find((dt) => dt.code === att.docType)?.mandatoryFor || null)}
                      </span>
                    )}
                  </td>
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
                    <a href={getAttachmentDownloadUrl(declarationId, att.id)}
                      className="text-xs px-2 py-1 bg-gray-50 text-primary-600 rounded hover:bg-gray-100 transition-colors">
                      Download
                    </a>
                    {canEdit && (
                      <button onClick={() => triggerReplace(att.id)}
                        className="text-xs px-2 py-1 bg-amber-50 text-amber-600 rounded hover:bg-amber-100 transition-colors">
                        Replace
                      </button>
                    )}
                    {canEdit && (
                      <button onClick={() => handleDelete(att.id)}
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
    </>
  );
}