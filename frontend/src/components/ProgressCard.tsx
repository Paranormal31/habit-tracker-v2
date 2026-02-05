type ProgressCardProps = {
  percentage: number;
  completed: number;
  total: number;
};

export function ProgressCard({ percentage, completed, total }: ProgressCardProps) {
  return (
    <div className="w-full max-w-sm rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--bg-card)] p-6">
      <p className="text-sm text-[color:var(--text-secondary)]">Monthly progress</p>
      <div className="mt-3 text-4xl font-semibold">{percentage}%</div>
      <p className="mt-2 text-sm text-[color:var(--text-muted)]">
        {completed} of {total} checks completed
      </p>
      <div className="mt-4 h-2 w-full rounded-full bg-[color:var(--border-subtle)]">
        <div
          className="h-2 rounded-full bg-[color:var(--accent)] transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
