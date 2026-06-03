import { apiGet, apiPost } from './client';

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
  hsCode: string;
  description: string;
  dutyRate: number;
  vatRate: number;
  unit: string;
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
  lineItems: LineItemDto[];
  createdAt: string;
}

export interface CreateDeclarationRequest {
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
