import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { getAllStations, LINES } from '../../data/static/index.js';
import { matchScore } from '../../lib/text.js';
import { useTransitStore } from '../../store/useTransitStore.js';
import { LineBadge } from '../ui/primitives.js';

const COLOR_BY_LINE = new Map(LINES.map((l) => [l.id, l]));
const ALL_STATIONS = getAllStations();

/** Buscador con autocomplete fuzzy que ignora tildes (§9). Enter selecciona. */
export function SearchBox(): JSX.Element {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectStation = useTransitStore((s) => s.selectStation);
  const focusSignal = useTransitStore((s) => s.searchFocusSignal);

  useEffect(() => {
    if (focusSignal > 0) inputRef.current?.focus();
  }, [focusSignal]);

  const results = useMemo(() => {
    if (query.trim() === '') return [];
    return ALL_STATIONS.map((s) => ({ s, score: matchScore(query, s.name) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [query]);

  const choose = (stationId: string) => {
    selectStation(stationId);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className="relative p-2">
      <div className="flex items-center gap-2 rounded-control border border-border bg-base px-2">
        <Search size={15} className="text-text-muted" aria-hidden />
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Buscar estación…  (/)"
          aria-label="Buscar estación"
          className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-text-muted"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') setHighlight((h) => Math.min(h + 1, results.length - 1));
            else if (e.key === 'ArrowUp') setHighlight((h) => Math.max(h - 1, 0));
            else if (e.key === 'Enter' && results[highlight]) choose(results[highlight]!.s.id);
          }}
        />
      </div>

      {open && results.length > 0 && (
        <ul className="absolute left-2 right-2 z-20 mt-1 overflow-hidden rounded-control border border-border bg-elevated shadow-subtle">
          {results.map((r, i) => {
            const line = COLOR_BY_LINE.get(r.s.lineId);
            return (
              <li key={`${r.s.id}`}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(r.s.id)}
                  className={`flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm ${
                    i === highlight ? 'bg-surface' : ''
                  }`}
                >
                  {line && (
                    <LineBadge
                      color={line.color}
                      textColor={line.textColor}
                      label={line.shortName}
                      size="sm"
                    />
                  )}
                  <span className="truncate">{r.s.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
