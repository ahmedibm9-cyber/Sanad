interface SkeletonProps {
  className?: string
  lines?: number
}

export default function Skeleton({ className = '', lines }: SkeletonProps) {
  if (lines) {
    return (
      <div className={`space-y-2 ${className}`} aria-busy="true" aria-label="Loading">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={`skeleton h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
        ))}
      </div>
    )
  }
  return <div className={`skeleton ${className}`} aria-busy="true" />
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex gap-4">
          {Array.from({ length: cols }).map((_, col) => (
            <div key={col} className={`skeleton h-4 ${col === 0 ? 'w-1/4' : col === cols - 1 ? 'w-1/6' : 'w-1/3'}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="card p-5 space-y-3" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-5 w-1/3" />
      <div className="skeleton h-8 w-1/4" />
      <div className="skeleton h-3 w-1/2" />
    </div>
  )
}
