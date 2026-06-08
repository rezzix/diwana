import type { LineItemRequest } from '@/api/declarations';
import type { OriginDto } from '@/api/origins';

/**
 * A single line item extracted by VLM — all fields are strings or null.
 */
export interface VlmLineItem {
  hsCode: string | null;
  description: string | null;
  quantity: string | null;
  unit: string | null;
  unitPrice: string | null;
  totalValue: string | null;
  currency: string | null;
  countryOfOrigin: string | null;
}

/**
 * Validate a VLM line item for required fields.
 * Returns { valid, errors } where errors lists the missing field names.
 */
export function validateVlmLine(item: VlmLineItem): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!item.hsCode || item.hsCode.trim() === '') errors.push('hsCode');
  if (!item.description || item.description.trim() === '') errors.push('description');
  if (!parseNumber(item.quantity) || parseNumber(item.quantity)! <= 0) errors.push('quantity');
  if (!parseNumber(item.unitPrice) || parseNumber(item.unitPrice)! <= 0) errors.push('unitPrice');
  // totalValue can be computed from quantity × unitPrice
  const qty = parseNumber(item.quantity);
  const up = parseNumber(item.unitPrice);
  const tv = parseNumber(item.totalValue);
  if ((!tv || tv <= 0) && (!qty || !up)) errors.push('totalValue');

  return { valid: errors.length === 0, errors };
}

/**
 * Map a VLM line item to a LineItemRequest suitable for the declaration API.
 * Always returns a LineItemRequest — lines with missing fields get default values
 * and are marked with hasIssues=true so the UI can flag them and block submission.
 */
export function mapVlmLineToLineItemRequest(
  item: VlmLineItem,
  origins: OriginDto[],
): LineItemRequest {
  const { valid } = validateVlmLine(item);

  const quantity = parseNumber(item.quantity) || 0;
  const unitPrice = parseNumber(item.unitPrice) || 0;
  const totalValue = parseNumber(item.totalValue) || (quantity > 0 && unitPrice > 0 ? quantity * unitPrice : 0);
  const countryOfOrigin = mapCountryCode(item.countryOfOrigin, origins);

  return {
    hsCode: item.hsCode?.trim() || '',
    description: item.description?.trim() || '',
    countryOfOrigin: countryOfOrigin || undefined,
    quantity,
    unit: item.unit?.trim() || undefined,
    unitPrice,
    totalValue,
    currency: item.currency?.trim() || 'MAD',
    hasIssues: !valid,
  };
}

/**
 * Parse a VLM numeric string (may include commas) to a number.
 * Returns null if not parseable.
 */
function parseNumber(value: string | null | undefined): number | null {
  if (value == null) return null;
  const cleaned = value.replace(/,/g, '').trim();
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Map an ISO alpha-2 country code to the country name used by the origins API.
 * Falls back to the raw code if no match found.
 */
function mapCountryCode(code: string | null | undefined, origins: OriginDto[]): string | undefined {
  if (!code) return undefined;
  const match = origins.find((o) => o.code === code);
  return match ? match.name : undefined;
}