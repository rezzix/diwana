import { apiGet } from './client';

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

export async function getPrefillData(): Promise<PrefillData> {
  return apiGet<PrefillData>('/declarations/prefill');
}
