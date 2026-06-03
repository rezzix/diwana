import { apiGet, apiPut } from './client';
import type { CompanyDto } from '@/types';

export async function getCompany(id: number): Promise<CompanyDto> {
  return apiGet<CompanyDto>(`/companies/${id}`);
}

export async function getMyCompany(): Promise<CompanyDto | null> {
  return apiGet<CompanyDto | null>('/companies/my');
}

export async function updateCompany(id: number, data: Record<string, unknown>): Promise<CompanyDto> {
  return apiPut<CompanyDto>(`/companies/${id}`, data);
}
