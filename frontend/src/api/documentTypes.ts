import { apiGet, apiPost, apiPut, apiDelete } from './client';

export interface DocumentTypeDto {
  id: number;
  code: string;
  name: string;
  description: string | null;
  mandatoryFor: string | null;
  importOrder: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export function formatMandatoryFor(value: string | null): string {
  if (!value) return 'Optional';
  if (value === '*') return 'All goods';
  return `HS: ${value}`;
}

export function isDocumentMandatoryForHsCode(docType: DocumentTypeDto, hsCode: string): boolean {
  if (!docType.mandatoryFor) return false;
  if (docType.mandatoryFor === '*') return true;
  const prefixes = docType.mandatoryFor.split(',').map((s) => s.trim()).filter(Boolean);
  return prefixes.some((prefix) => hsCode.startsWith(prefix));
}

export async function getDocumentTypes(signal?: AbortSignal): Promise<DocumentTypeDto[]> {
  return apiGet<DocumentTypeDto[]>('/document-types', undefined, signal);
}

export async function getAllDocumentTypes(signal?: AbortSignal): Promise<DocumentTypeDto[]> {
  return apiGet<DocumentTypeDto[]>('/document-types/all', undefined, signal);
}

export async function createDocumentType(data: { code: string; name: string; description?: string; mandatoryFor?: string; importOrder?: number | null }): Promise<DocumentTypeDto> {
  return apiPost<DocumentTypeDto>('/document-types', data);
}

export async function updateDocumentType(id: number, data: { code: string; name: string; description?: string; mandatoryFor?: string; importOrder?: number | null; active?: boolean }): Promise<DocumentTypeDto> {
  return apiPut<DocumentTypeDto>(`/document-types/${id}`, data);
}

export async function deleteDocumentType(id: number): Promise<void> {
  await apiDelete(`/document-types/${id}`);
}