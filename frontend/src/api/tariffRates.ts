import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { TariffRateDto } from './declarations';

export type { TariffRateDto };

export async function getTariffRates(signal?: AbortSignal): Promise<TariffRateDto[]> {
  return apiGet<TariffRateDto[]>('/tariff-rates', undefined, signal);
}

export async function getAllTariffRates(signal?: AbortSignal): Promise<TariffRateDto[]> {
  return apiGet<TariffRateDto[]>('/tariff-rates/all', undefined, signal);
}

export async function createTariffRate(data: {
  originCode?: string;
  hsCode: string;
  description: string;
  dutyRate: number;
  vatRate: number;
  unit?: string;
}): Promise<TariffRateDto> {
  return apiPost<TariffRateDto>('/tariff-rates', data);
}

export async function updateTariffRate(id: number, data: {
  originCode?: string;
  hsCode: string;
  description: string;
  dutyRate: number;
  vatRate: number;
  unit?: string;
  active?: boolean;
}): Promise<TariffRateDto> {
  return apiPut<TariffRateDto>(`/tariff-rates/${id}`, data);
}

export async function deactivateTariffRate(id: number): Promise<void> {
  await apiDelete(`/tariff-rates/${id}`);
}