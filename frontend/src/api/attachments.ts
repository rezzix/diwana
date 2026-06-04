import { apiGet, apiDelete } from './client';

export interface AttachmentDto {
  id: number;
  docType: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
}

export function getAttachments(declarationId: number): Promise<AttachmentDto[]> {
  return apiGet<AttachmentDto[]>(`/declarations/${declarationId}/attachments`);
}

export function deleteAttachment(declarationId: number, attachmentId: number): Promise<void> {
  return apiDelete(`/declarations/${declarationId}/attachments/${attachmentId}`);
}

export function getAttachmentViewUrl(declarationId: number, attachmentId: number): string {
  return `/api/declarations/${declarationId}/attachments/view/${attachmentId}`;
}

export function getAttachmentDownloadUrl(declarationId: number, attachmentId: number): string {
  return `/api/declarations/${declarationId}/attachments/download/${attachmentId}`;
}