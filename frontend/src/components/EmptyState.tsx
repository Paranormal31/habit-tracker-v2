export function EmptyState() {
  return (
    <div className="rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--bg-card)] p-8 text-center">
      <h2 className="text-lg font-semibold">No habits yet</h2>
      <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
        Add your first habit to start building a streak.
      </p>
    </div>
  );
}
