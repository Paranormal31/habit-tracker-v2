import { useState } from "react";

type AddHabitInputProps = {
  onAdd: (name: string) => Promise<void> | void;
  disabled?: boolean;
};

export function AddHabitInput({ onAdd, disabled }: AddHabitInputProps) {
  const [name, setName] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await onAdd(trimmed);
    setName("");
  }

  return (
    <div className="rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--bg-card)] p-4">
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New habit..."
          className="flex-1 rounded-lg border border-[color:var(--border-default)] bg-[color:var(--bg-surface)] px-4 py-2.5 text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/40 focus:border-[color:var(--accent)]"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={disabled || !name.trim()}
          className="w-full rounded-lg bg-[color:var(--accent)] px-5 py-2.5 text-sm font-medium text-black transition hover:bg-[color:var(--accent-muted)] disabled:opacity-50 sm:w-auto"
        >
          Add Habit
        </button>
      </form>
    </div>
  );
}
