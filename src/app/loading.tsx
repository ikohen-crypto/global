export default function GlobalLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-40 rounded-full bg-muted" />
        <div className="h-12 w-80 rounded-2xl bg-muted" />
        <div className="h-5 w-full max-w-3xl rounded-full bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-44 rounded-[2rem] border border-border bg-card/60"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
