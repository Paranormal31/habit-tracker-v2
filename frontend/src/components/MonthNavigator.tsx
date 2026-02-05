type MonthNavigatorProps = {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
};

export function MonthNavigator({ label, onPrevious, onNext }: MonthNavigatorProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--bg-card)] px-4 py-3">
      <button
        onClick={onPrevious}
        className="rounded-lg border border-[color:var(--border-default)] px-3 py-1.5 text-sm text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-surface)]"
      >
        Prev
      </button>
      <div className="text-sm font-medium">{label}</div>
      <button
        onClick={onNext}
        className="rounded-lg border border-[color:var(--border-default)] px-3 py-1.5 text-sm text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-surface)]"
      >
        Next
      </button>
    </div>
  );
}
