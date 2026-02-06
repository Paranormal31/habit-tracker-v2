import Link from "next/link";

type PageTabsProps = {
  active: "dashboard" | "planner";
};

const baseClass =
  "rounded-full border px-4 py-2 text-sm transition-colors";

export function PageTabs({ active }: PageTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href="/dashboard"
        className={`${baseClass} ${
          active === "dashboard"
            ? "border-[color:var(--accent)]/40 bg-[color:var(--accent)]/15 text-[color:var(--accent)]"
            : "border-[color:var(--border-default)] text-[color:var(--text-secondary)] hover:border-[color:var(--accent)]/40 hover:text-[color:var(--text-primary)]"
        }`}
      >
        Dashboard
      </Link>
      <Link
        href="/day-planner"
        className={`${baseClass} ${
          active === "planner"
            ? "border-[color:var(--accent)]/40 bg-[color:var(--accent)]/15 text-[color:var(--accent)]"
            : "border-[color:var(--border-default)] text-[color:var(--text-secondary)] hover:border-[color:var(--accent)]/40 hover:text-[color:var(--text-primary)]"
        }`}
      >
        Day Planner
      </Link>
    </div>
  );
}
