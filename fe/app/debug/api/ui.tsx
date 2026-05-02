'use client';

import { useEffect, useMemo, useState } from 'react';

type ApiLogEntry = {
  ts: number;
  method: string;
  url: string;
  status?: number;
  ok?: boolean;
  durationMs: number;
  errorCause?: string;
  hasAuthHeader: boolean;
};

function getBuffer(): ApiLogEntry[] {
  const w = window as unknown as { __apiLog?: ApiLogEntry[] };
  return Array.isArray(w.__apiLog) ? w.__apiLog : [];
}

function fmtTs(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return String(ts);
  }
}

export function ApiDebugPageClient() {
  const [q, setQ] = useState('');
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [minMs, setMinMs] = useState<number>(0);
  const [buf, setBuf] = useState<ApiLogEntry[]>(() => (typeof window === 'undefined' ? [] : getBuffer()));

  // Poll lightly so it updates as you navigate around the app.
  useEffect(() => {
    const id = window.setInterval(() => setBuf(getBuffer()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const rows = useMemo(() => {
    const raw = buf.slice().reverse();
    const query = q.trim().toLowerCase();
    return raw.filter((e) => {
      if (onlyErrors && (e.status ? e.status < 400 : !e.errorCause)) return false;
      if (minMs > 0 && e.durationMs < minMs) return false;
      if (!query) return true;
      return (
        e.url.toLowerCase().includes(query) ||
        e.method.toLowerCase().includes(query) ||
        String(e.status ?? '').includes(query) ||
        (e.errorCause ?? '').toLowerCase().includes(query)
      );
    });
  }, [buf, q, onlyErrors, minMs]);

  return (
    <main style={{ padding: 16, fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>/debug/api</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Dev-only API call log from <code>window.__apiLog</code>. Authorization header is not stored.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', margin: '12px 0' }}>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ opacity: 0.85 }}>Filter</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="method / url / status / error…"
            style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: 6, minWidth: 260 }}
          />
        </label>

        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={onlyErrors} onChange={(e) => setOnlyErrors(e.target.checked)} />
          <span style={{ opacity: 0.85 }}>Only errors</span>
        </label>

        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ opacity: 0.85 }}>Min ms</span>
          <input
            type="number"
            value={minMs}
            onChange={(e) => setMinMs(Number(e.target.value) || 0)}
            style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: 6, width: 120 }}
          />
        </label>

        <button
          type="button"
          onClick={() => {
            (window as unknown as { __apiLog?: ApiLogEntry[] }).__apiLog = [];
            setBuf([]);
          }}
          style={{ padding: '6px 10px', border: '1px solid #ccc', borderRadius: 6, background: '#fff' }}
        >
          Clear
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Time</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Method</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Status</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Ms</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>URL</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Error</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Auth?</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e, idx) => {
              const isError = e.status ? e.status >= 400 : Boolean(e.errorCause);
              return (
                <tr key={idx} style={{ background: isError ? 'rgba(255,0,0,0.05)' : undefined }}>
                  <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8, whiteSpace: 'nowrap' }}>
                    {fmtTs(e.ts)}
                  </td>
                  <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8, whiteSpace: 'nowrap' }}>
                    <code>{e.method}</code>
                  </td>
                  <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8, whiteSpace: 'nowrap' }}>
                    <code>{e.status ?? 'ERR'}</code>
                  </td>
                  <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8, whiteSpace: 'nowrap' }}>
                    <code>{Math.round(e.durationMs)}</code>
                  </td>
                  <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>
                    <code>{e.url}</code>
                  </td>
                  <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>
                    {e.errorCause ? <code>{e.errorCause}</code> : ''}
                  </td>
                  <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8, whiteSpace: 'nowrap' }}>
                    {e.hasAuthHeader ? 'yes' : 'no'}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 12, opacity: 0.7 }}>
                  No entries yet. Navigate around the app to generate API calls.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}

