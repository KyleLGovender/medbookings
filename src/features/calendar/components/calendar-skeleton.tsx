export function CalendarSkeleton() {
  return (
    <div className="rounded-lg bg-white p-4 shadow">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
        <div className="flex gap-2">
          <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Week days */}
        {[...Array(7)].map((_, i) => (
          <div
            key={`weekday-${i}`}
            className="h-6 animate-pulse rounded bg-gray-200"
          />
        ))}

        {/* Calendar cells */}
        {[...Array(35)].map((_, i) => (
          <div
            key={`cell-${i}`}
            className="aspect-square animate-pulse rounded bg-gray-100 p-2"
          >
            <div className="mb-2 h-4 w-4 rounded bg-gray-200" />
            <div className="h-3 w-16 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
