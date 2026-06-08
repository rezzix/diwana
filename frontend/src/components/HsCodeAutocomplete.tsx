import { useState, useRef, useEffect, useMemo } from 'react';
import { getHsCodes, type HsCodeDto } from '@/api/hsCodes';
import type { TariffRateDto } from '@/api/declarations';

interface HsCodeOption {
  code: string;
  description: string;
  dutyRate?: number;
  vatRate?: number;
  source: 'tariff' | 'hscode';
}

interface HsCodeAutocompleteProps {
  tariffRates: TariffRateDto[];
  value: string;
  onChange: (hsCode: string) => void;
  onSelect: (hsCode: string, description: string) => void;
  placeholder?: string;
  className?: string;
}

export default function HsCodeAutocomplete({ tariffRates, value, onChange, onSelect, placeholder, className }: HsCodeAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [hsCodes, setHsCodes] = useState<HsCodeDto[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    getHsCodes(controller.signal).then(setHsCodes).catch(() => {});
    return () => controller.abort();
  }, []);

  // Merge tariff rates and HS code reference, dedup by code (tariff rates take priority)
  const unifiedOptions = useMemo(() => {
    const map = new Map<string, HsCodeOption>();
    // First: add tariff rate entries (these have duty/VAT info)
    for (const tr of tariffRates) {
      if (!tr.hsCode) continue;
      if (!map.has(tr.hsCode) || tr.originCode === null) {
        map.set(tr.hsCode, {
          code: tr.hsCode,
          description: tr.description,
          dutyRate: tr.dutyRate,
          vatRate: tr.vatRate,
          source: 'tariff',
        });
      }
    }
    // Then: add HsCode reference entries for codes not already covered
    for (const hc of hsCodes) {
      if (!map.has(hc.code)) {
        map.set(hc.code, {
          code: hc.code,
          description: hc.description,
          source: 'hscode',
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [tariffRates, hsCodes]);

  const query = value.trim().toLowerCase();
  const matches = query.length >= 1
    ? unifiedOptions.filter((opt) => {
        const code = opt.code.toLowerCase();
        const desc = opt.description.toLowerCase();
        return code.startsWith(query) || desc.includes(query);
      }).slice(0, 15)
    : [];

  // Reset highlight when matches change
  useEffect(() => {
    setHighlightIndex(-1);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (opt: HsCodeOption) => {
    onChange(opt.code);
    onSelect(opt.code, opt.description);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || matches.length === 0) {
      if (e.key === 'ArrowDown' && matches.length > 0) {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, matches.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < matches.length) {
          handleSelect(matches[highlightIndex]);
        }
        break;
      case 'Escape':
        setOpen(false);
        break;
    }
  };

  const showDropdown = open && matches.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => { if (matches.length > 0) setOpen(true); }}
        onKeyDown={handleKeyDown}
        className={`w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm ${className ?? ''}`}
        placeholder={placeholder ?? 'e.g. 8471.30'}
        autoComplete="off"
      />
      {showDropdown && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {matches.map((opt, i) => (
            <li key={opt.code}
              className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer ${i === highlightIndex ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
              onMouseEnter={() => setHighlightIndex(i)}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(opt); }}
            >
              <span className="font-mono text-xs text-gray-900 shrink-0">{opt.code}</span>
              <span className="text-gray-600 truncate">{opt.description}</span>
              {opt.source === 'tariff' && opt.dutyRate != null && opt.vatRate != null && (
                <span className="text-xs text-gray-400 shrink-0 ml-auto">{opt.dutyRate}%D {opt.vatRate}%V</span>
              )}
              {opt.source === 'hscode' && (
                <span className="text-xs text-blue-400 shrink-0 ml-auto">Ref</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}