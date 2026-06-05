import axios from 'axios';
import type { TariffRateDto } from './declarations';

export async function getTariffRates(signal?: AbortSignal): Promise<TariffRateDto[]> {
  const res = await axios.get<{ data: TariffRateDto[] }>('/api/tariff-rates', {
    signal,
  });
  return res.data.data;
}