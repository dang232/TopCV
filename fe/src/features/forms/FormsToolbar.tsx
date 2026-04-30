'use client';

interface FormsToolbarProps {
  onSearch(query: string): void;
  onRefresh(): void;
  onLoadActive(): void;
  onLoadSubmissions(): void;
}

export function FormsToolbar({ onSearch, onRefresh, onLoadActive, onLoadSubmissions }: FormsToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-xl font-semibold">Forms</h2>
      <div className="flex gap-2">
        <input
          aria-label="Search forms"
          className="rounded-lg border border-zinc-300 px-3 py-2"
          placeholder="Search"
          onChange={(event) => onSearch(event.target.value)}
        />
        <button className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" onClick={onRefresh}>
          Refresh
        </button>
        <button className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" onClick={onLoadActive}>
          Active
        </button>
        <button className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" onClick={onLoadSubmissions}>
          Submissions
        </button>
      </div>
    </div>
  );
}
