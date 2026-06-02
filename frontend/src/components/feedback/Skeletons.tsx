export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-border/60 shadow-card p-5">
      <div className="flex items-start gap-3">
        <div className="skeleton h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-2/3" />
          <div className="skeleton h-3 w-1/2" />
        </div>
        <div className="skeleton h-5 w-14" />
      </div>
      <div className="skeleton mt-5 h-3 w-1/2" />
      <div className="mt-5 pt-4 border-t border-border/60 flex items-center gap-2">
        <div className="skeleton h-10 flex-1" />
        <div className="skeleton h-10 w-10" />
        <div className="skeleton h-10 w-10" />
      </div>
    </div>
  );
}

export function CardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ListRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 border-b border-border/60 last:border-b-0">
      <div className="skeleton h-9 w-9 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-3 w-1/4" />
      </div>
      <div className="skeleton h-6 w-20" />
    </div>
  );
}
