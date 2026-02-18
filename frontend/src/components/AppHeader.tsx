type AppHeaderProps = {
  userName: string;
  currentDate: Date;
  timezone: string;
  onLogout: () => void;
};

export function AppHeader({ userName, currentDate, timezone, onLogout }: AppHeaderProps) {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: timezone,
  }).format(currentDate);

  return (
    <header className="sticky top-0 z-20 border-b border-[color:var(--border-subtle)] bg-[color:var(--bg-header)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <img
              src="/icons/icon-192.png"
              alt="HabitForge logo"
              className="h-8 w-8 rounded-md"
            />
            <h1 className="text-xl font-semibold">HabitForge</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[color:var(--text-secondary)]">
            <span>
              Welcome, <span className="text-[color:var(--text-primary)]">{userName}</span>
            </span>
            <span className="text-[color:var(--text-muted)]">|</span>
            <span>{formattedDate}</span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="rounded-lg border border-[color:var(--danger)]/40 px-3 py-2 text-sm text-[color:var(--danger)] hover:bg-[color:var(--danger)]/10"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
