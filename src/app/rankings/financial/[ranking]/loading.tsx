export default function FinancialRankingLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-3xl space-y-3">
        <div className="h-4 w-40 rounded-full bg-muted/60" />
        <div className="h-10 w-80 rounded-full bg-muted/60" />
        <div className="h-4 w-full max-w-2xl rounded-full bg-muted/40" />
      </div>

      <div className="rounded-2xl border border-border p-4">
        <div className="mb-4 h-6 w-44 rounded-full bg-muted/60" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="grid gap-3 rounded-xl border border-border/60 p-3 md:grid-cols-4">
              <div className="h-4 rounded-full bg-muted/40" />
              <div className="h-4 rounded-full bg-muted/40" />
              <div className="h-4 rounded-full bg-muted/40" />
              <div className="h-4 rounded-full bg-muted/40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
