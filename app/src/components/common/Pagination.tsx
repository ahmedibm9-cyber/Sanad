import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showFirstLast?: boolean
}

/**
 * Generate page numbers with ellipsis for large ranges.
 * Shows at most 7 page buttons: [1] [2] [...] [5] [6] [7] [8]
 * Always includes first, last, current-1, current, current+1.
 */
function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | '...')[] = []
  const left = Math.max(2, current - 1)
  const right = Math.min(total - 1, current + 1)

  pages.push(1)

  if (left > 2) {
    pages.push('...')
  }

  for (let i = left; i <= right; i++) {
    pages.push(i)
  }

  if (right < total - 1) {
    pages.push('...')
  }

  if (total > 1) {
    pages.push(total)
  }

  return pages
}

export default function Pagination({ currentPage, totalPages, onPageChange, showFirstLast = false }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = getPageNumbers(currentPage, totalPages)

  return (
    <nav aria-label="Pagination" className="flex items-center gap-1">
      {showFirstLast && (
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="btn-ghost p-2 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
      )}

      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="btn-ghost px-2 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((page, idx) =>
        page === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-2 py-1.5 text-sm text-gray-400 select-none">
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors ${
              page === currentPage
                ? 'btn-primary'
                : 'btn-ghost hover:bg-gray-100'
            }`}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="btn-ghost px-2 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {showFirstLast && (
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="btn-ghost p-2 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      )}
    </nav>
  )
}
