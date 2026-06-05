import { apiGet } from './client';

export interface CustomsOfficeDto {
  id: number;
  code: string;
  name: string;
}

export async function getCustomsOffices(signal?: AbortSignal): Promise<CustomsOfficeDto[]> {
  return apiGet<CustomsOfficeDto[]>('/customs-offices', undefined, signal);
}