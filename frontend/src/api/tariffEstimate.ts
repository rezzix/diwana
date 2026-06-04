import type { TariffRateDto } from './declarations';

export interface DutyVatEstimate {
  dutyRate: number;
  vatRate: number;
  dutyAmount: number;
  vatAmount: number;
}

/**
 * Resolves the applicable tariff rate for a given HS code and country of origin
 * using the same 6-level cascade lookup as the backend:
 *   1. Same origin + exact HS code
 *   2. Same origin + parent HS code (chapter)
 *   3. Same origin + no HS code (origin-wide default)
 *   4. No origin + exact HS code (HS-specific default)
 *   5. No origin + parent HS code (HS-category default)
 *   6. No origin + no HS code (global default)
 */
export function resolveTariffRate(
  hsCode: string,
  countryOfOrigin: string | undefined,
  totalValue: number,
  tariffRates: TariffRateDto[],
): DutyVatEstimate {
  const hsChapter = hsCode.length >= 4 ? hsCode.substring(0, 4) : hsCode;

  let matched: TariffRateDto | null = null;

  if (countryOfOrigin) {
    // Level 1: same origin + exact HS code
    matched = tariffRates.find(
      (r) => r.originName === countryOfOrigin && r.hsCode === hsCode,
    ) ?? null;

    // Level 2: same origin + parent HS code
    if (!matched) {
      matched =
        tariffRates.find(
          (r) =>
            r.originName === countryOfOrigin &&
            r.hsCode !== null &&
            r.hsCode.startsWith(hsChapter) &&
            r.hsCode !== hsCode,
        ) ?? null;
    }

    // Level 3: same origin + no HS code (origin-wide default)
    if (!matched) {
      matched =
        tariffRates.find(
          (r) => r.originName === countryOfOrigin && r.hsCode === null,
        ) ?? null;
    }
  }

  // Level 4: no origin + exact HS code (HS-specific default)
  if (!matched) {
    matched =
      tariffRates.find(
        (r) => r.originCode === null && r.hsCode === hsCode,
      ) ?? null;
  }

  // Level 5: no origin + parent HS code (HS-category default)
  if (!matched) {
    matched =
      tariffRates.find(
        (r) =>
          r.originCode === null &&
          r.hsCode !== null &&
          r.hsCode.startsWith(hsChapter) &&
          r.hsCode !== hsCode,
      ) ?? null;
  }

  // Level 6: no origin + no HS code (global default)
  if (!matched) {
    matched =
      tariffRates.find(
        (r) => r.originCode === null && r.hsCode === null,
      ) ?? null;
  }

  const dutyRate = matched ? matched.dutyRate : 0;
  const vatRate = matched ? matched.vatRate : 0;
  const dutyAmount = totalValue * (dutyRate / 100);
  const vatAmount = totalValue * (vatRate / 100);

  return { dutyRate, vatRate, dutyAmount, vatAmount };
}