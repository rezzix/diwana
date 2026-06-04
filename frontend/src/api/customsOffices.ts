import { apiGet } from './client';

export interface CustomsOfficeDto {
  id: number;
  code: string;
  name: string;
}

export async function getCustomsOffices(): Promise<CustomsOfficeDto[]> {
  return apiGet<CustomsOfficeDto[]>('/customs-offices');
}