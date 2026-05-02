'use client';

import { useEffect, useRef, useState } from 'react';

import { formsButtonOutline } from './formsButtonStyles';

interface FormsToolbarProps {
  onSearch(query: string): void;
  onRefresh(): void;
  onLoadActive(): void;
  onLoadSubmissions(): void;
  debounceMs?: number;
}

export function FormsToolbar({
  onSearch,
  onRefresh,
  onLoadActive,
  onLoadSubmissions,
  debounceMs = 300,
}: FormsToolbarProps) {
  const [query, setQuery] = useState('');
  const latestOnSearch = useRef(onSearch);
  /**
   * Skip debounced `onSearch('')` until the user edits the field.
   * Otherwise React Strict Mode runs this effect twice on mount: the first pass
   * would set a "has run" ref and return, and the second pass would schedule
   * `onSearch('')` → duplicate `refreshForms` / `listPage` after `setMode`.
   */
  const userEditedSearch = useRef(false);

  useEffect(() => {
    latestOnSearch.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    if (query === '' && !userEditedSearch.current) {
      return;
    }
    const handle = window.setTimeout(() => {
      latestOnSearch.current(query);
    }, debounceMs);
    return () => window.clearTimeout(handle);
  }, [debounceMs, query]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-xl font-semibold">Forms</h2>
      <div className="flex gap-2">
        <input
          aria-label="Search forms"
          className="rounded-lg border border-zinc-300 px-3 py-2"
          placeholder="Search"
          value={query}
          onChange={(event) => {
            userEditedSearch.current = true;
            setQuery(event.target.value);
          }}
        />
        <button className={`${formsButtonOutline} px-3 py-2`} onClick={onRefresh}>
          Refresh
        </button>
        <button className={`${formsButtonOutline} px-3 py-2`} onClick={onLoadActive}>
          Active
        </button>
        <button className={`${formsButtonOutline} px-3 py-2`} onClick={onLoadSubmissions}>
          Submissions
        </button>
      </div>
    </div>
  );
}

