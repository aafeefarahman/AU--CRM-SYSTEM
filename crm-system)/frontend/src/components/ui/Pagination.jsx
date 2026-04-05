import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pages, total, onPage }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-600">
      <span>{total} total records</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1)
          .reduce((acc, p, i, arr) => {
            if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === '...' ? (
              <span key={i} className="px-2">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPage(p)}
                className={`w-8 h-8 rounded text-sm ${p === page ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100'}`}
              >
                {p}
              </button>
            )
          )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === pages}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
