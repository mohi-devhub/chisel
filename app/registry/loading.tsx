export default function RegistryLoading() {
  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
      {/* Nav skeleton */}
      <div className="flex items-center justify-between py-5">
        <div className="h-8 w-20 animate-pulse rounded-lg bg-muted/40" />
        <div className="flex gap-2">
          <div className="h-8 w-20 animate-pulse rounded-lg bg-muted/40" />
          <div className="h-8 w-20 animate-pulse rounded-lg bg-muted/40" />
        </div>
      </div>

      <div className="py-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="mb-4 h-10 w-10 animate-pulse rounded-xl bg-muted/40" />
          <div className="h-9 w-32 animate-pulse rounded-lg bg-muted/40" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-muted/30" />
        </div>

        {/* Tabs skeleton */}
        <div className="mb-5 h-10 w-48 animate-pulse rounded-lg bg-muted/40" />

        {/* Filters skeleton */}
        <div className="mb-6 flex gap-2">
          <div className="h-9 w-48 animate-pulse rounded-lg bg-muted/40" />
          <div className="h-9 w-32 animate-pulse rounded-lg bg-muted/40" />
          <div className="h-9 w-32 animate-pulse rounded-lg bg-muted/40" />
        </div>

        {/* Grid skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl border border-border/40 bg-muted/20"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
