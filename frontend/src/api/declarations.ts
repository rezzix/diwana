import { apiGet, apiPost, apiPut, apiDelete } from './client';

export interface CompanyPrefill {
  name: string;
  ice: string | null;
  rc: string | null;
  nif: string | null;
  vatNumber: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  bankName: string | null;
  bankIban: string | null;
  bankSwift: string | null;
  customsCode: string | null;
}

export interface TariffRateDto {
  id: number;
  hsCode: string | null;
  description: string;
  dutyRate: number;
  vatRate: number;
  unit: string;
  originCode: string | null;
  originName: string | null;
}

export interface PrefillData {
  company: CompanyPrefill | null;
  tariffRates: TariffRateDto[];
}

export interface LineItemDto {
  id: number;
  hsCode: string;
  description: string;
  countryOfOrigin: string | null;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  totalValue: number;
  dutyRate: number | null;
  dutyAmount: number | null;
  vatRate: number | null;
  vatAmount: number | null;
  currency: string;
}

export interface DeclarationDto {
  id: number;
  declarationNumber: string;
  status: string;
  declarantName: string;
  companyName: string;
  customsOffice: string | null;
  totalDuty: number | null;
  totalVat: number | null;
  totalValue: number | null;
  notes: string | null;
  rejectionReason: string | null;
  lineItems: LineItemDto[];
  createdAt: string;
}

export interface LineItemRequest {
  hsCode: string;
  description: string;
  countryOfOrigin?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  totalValue: number;
  dutyRate?: number;
  vatRate?: number;
  currency?: string;
}

export interface CreateDeclarationRequest {
  lineItems: LineItemRequest[];
  customsOffice?: string;
  notes?: string;
}

export interface UpdateDeclarationRequest {
  lineItems: LineItemRequest[];
  customsOffice?: string;
  notes?: string;
}

export async function getPrefillData(): Promise<PrefillData> {
  return apiGet<PrefillData>('/declarations/prefill');
}

export async function createDeclaration(request: CreateDeclarationRequest): Promise<DeclarationDto> {
  return apiPost<DeclarationDto>('/declarations', request);
}

export async function getDeclaration(id: number): Promise<DeclarationDto> {
  return apiGet<DeclarationDto>(`/declarations/${id}`);
}

export async function updateDeclaration(id: number, request: UpdateDeclarationRequest): Promise<DeclarationDto> {
  return apiPut<DeclarationDto>(`/declarations/${id}`, request);
}

export async function deleteDeclaration(id: number): Promise<void> {
  await apiDelete(`/declarations/${id}`);
}

export async function getPendingReviewDeclarations(): Promise<DeclarationDto[]> {
  return apiGet<DeclarationDto[]>('/declarations/pending-review');
}

export async function submitDeclaration(id: number): Promise<DeclarationDto> {
  return apiPost<DeclarationDto>(`/declarations/${id}/submit`);
}

export async function rejectDeclaration(id: number, reason: string): Promise<DeclarationDto> {
  return apiPost<DeclarationDto>(`/declarations/${id}/reject`, { reason });
}

export async function approveDeclaration(id: number): Promise<DeclarationDto> {
  return apiPost<DeclarationDto>(`/declarations/${id}/approve`);
}

export async function resubmitDeclaration(id: number): Promise<DeclarationDto> {
  return apiPost<DeclarationDto>(`/declarations/${id}/resubmit`);
}
