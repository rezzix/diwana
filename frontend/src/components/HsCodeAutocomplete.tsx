import { useState, useRef, useEffect } from 'react';
import type { TariffRateDto } from '@/api/declarations';

interface HsCodeAutocompleteProps {
  tariffRates: TariffRateDto[];
  value: string;
  onChange: (hsCode: string) => void;
  onSelect: (hsCode: string, description: string) => void;
  placeholder?: string;
}

export default function HsCodeAutocomplete({ tariffRates, value, onChange, onSelect, placeholder }: HsCodeAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Deduplicate by hsCode, preferring null-origin entries (global defaults)
  const uniqueRates = (() => {
    const map = new Map<string, TariffRateDto>();
    for (const tr of tariffRates) {
      if (!tr.hsCode) continue;
      if (!map.has(tr.hsCode) || tr.originCode === null) {
        map.set(tr.hsCode, tr);
      }
    }
    return Array.from(map.values()).sort((a, b) => (a.hsCode ?? '').localeCompare(b.hsCode ?? ''));
  })();

  const query = value.trim().toLowerCase();
  const matches = query.length >= 1
    ? uniqueRates.filter((tr) => {
        const code = (tr.hsCode ?? '').toLowerCase();
        const desc = (tr.description ?? '').toLowerCase();
        return code.startsWith(query) || desc.includes(query);
      }).slice(0, 10)
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

  const handleSelect = (tr: TariffRateDto) => {
    onChange(tr.hsCode ?? '');
    onSelect(tr.hsCode ?? '', tr.description ?? '');
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
        className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm"
        placeholder={placeholder ?? 'e.g. 8471.30'}
        autoComplete="off"
      />
      {showDropdown && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {matches.map((tr, i) => (
            <li key={tr.hsCode}
              className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer ${i === highlightIndex ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
              onMouseEnter={() => setHighlightIndex(i)}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(tr); }}
            >
              <span className="font-mono text-xs text-gray-900 shrink-0">{tr.hsCode}</span>
              <span className="text-gray-600 truncate">{tr.description}</span>
              <span className="text-xs text-gray-400 shrink-0 ml-auto">{tr.dutyRate}%D {tr.vatRate}%V</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}