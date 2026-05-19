export default function WorkspaceLoading() {
  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between py-5">
        <div className="h-8 w-20 animate-pulse rounded-lg bg-muted/40" />
        <div className="flex gap-2">
          <div className="h-8 w-20 animate-pulse rounded-lg bg-muted/40" />
          <div className="h-8 w-20 animate-pulse rounded-lg bg-muted/40" />
        </div>
      </div>

      <div className="py-8">
        <div className="mb-6">
          <div className="h-5 w-16 animate-pulse rounded bg-muted/40" />
          <div className="mt-3 h-9 w-48 animate-pulse rounded-lg bg-muted/40" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted/30" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-3">
            <div className="h-10 w-56 animate-pulse rounded-lg bg-muted/40" />
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-44 animate-pulse rounded-xl border border-border/40 bg-muted/20"
                  style={{ animationDelay: `${i * 60}ms` }}
                />
              ))}
            </div>
          </div>
          <div className="h-80 animate-pulse rounded-xl border border-border/40 bg-muted/20" />
        </div>
      </div>
    </div>
  );
}
