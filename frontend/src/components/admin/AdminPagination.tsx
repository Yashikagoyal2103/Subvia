import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdminPaginationProps {
  page: number;
  limit: number;
  total: number;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
}

export function AdminPagination({
  page,
  limit,
  total,
  hasNextPage,
  onPageChange,
}: AdminPaginationProps) {
  if (total === 0) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-3 border-t border-[var(--a-border)] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs text-[var(--a-ink-3)]">
        Showing {start}–{end} of {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 rounded-full border border-[var(--a-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--a-ink)] transition hover:border-[var(--a-border-strong)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Previous
        </button>
        <span className="min-w-16 text-center text-xs font-medium text-[var(--a-ink-2)]">
          Page {page}
        </span>
        <button
          type="button"
          disabled={!hasNextPage}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 rounded-full border border-[var(--a-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--a-ink)] transition hover:border-[var(--a-border-strong)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
