import { apiGet, apiPost, apiPut, apiDelete } from './client';

export interface DocumentTypeDto {
  id: number;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getDocumentTypes(signal?: AbortSignal): Promise<DocumentTypeDto[]> {
  return apiGet<DocumentTypeDto[]>('/document-types', undefined, signal);
}

export async function getAllDocumentTypes(signal?: AbortSignal): Promise<DocumentTypeDto[]> {
  return apiGet<DocumentTypeDto[]>('/document-types/all', undefined, signal);
}

export async function createDocumentType(data: { code: string; name: string; description?: string }): Promise<DocumentTypeDto> {
  return apiPost<DocumentTypeDto>('/document-types', data);
}

export async function updateDocumentType(id: number, data: { code: string; name: string; description?: string; active?: boolean }): Promise<DocumentTypeDto> {
  return apiPut<DocumentTypeDto>(`/document-types/${id}`, data);
}

export async function deleteDocumentType(id: number): Promise<void> {
  await apiDelete(`/document-types/${id}`);
}