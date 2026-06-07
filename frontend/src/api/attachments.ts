import { apiGet, apiPut, apiDelete } from './client';

export interface AttachmentDto {
  id: number;
  docType: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  imported: boolean;
  vlmText: string | null;
  vlmStatus: 'PROCESSING' | 'COMPLETED' | 'FAILED' | null;
  vlmError: string | null;
  vlmDate: string | null;
  createdAt: string;
}

export interface SmartImportResult {
  id: number;
  docType: string;
  fileName: string;
  imported: boolean;
  vlmText: string;
  vlmModel: string | null;
  vlmUrl: string | null;
  vlmProcessingTimeMs: number | null;
  vlmStatus: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  vlmError: string | null;
  vlmDate: string | null;
}

export function getAttachments(declarationId: number, signal?: AbortSignal): Promise<AttachmentDto[]> {
  return apiGet<AttachmentDto[]>(`/declarations/${declarationId}/attachments`, undefined, signal);
}

export function markAttachmentImported(declarationId: number, attachmentId: number): Promise<AttachmentDto> {
  return apiPut<AttachmentDto>(`/declarations/${declarationId}/attachments/${attachmentId}/import`);
}

export function smartImportAttachment(declarationId: number, attachmentId: number, signal?: AbortSignal): Promise<SmartImportResult> {
  return apiPut<SmartImportResult>(`/declarations/${declarationId}/attachments/${attachmentId}/smart-import`, undefined, signal);
}

export async function deleteAttachment(declarationId: number, attachmentId: number): Promise<void> {
  await apiDelete(`/declarations/${declarationId}/attachments/${attachmentId}`);
}

export function getAttachmentViewUrl(declarationId: number, attachmentId: number): string {
  return `/api/declarations/${declarationId}/attachments/view/${attachmentId}`;
}

export function getAttachmentDownloadUrl(declarationId: number, attachmentId: number): string {
  return `/api/declarations/${declarationId}/attachments/download/${attachmentId}`;
}