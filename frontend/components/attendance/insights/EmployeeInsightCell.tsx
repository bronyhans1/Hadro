"use client";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return (name[0] ?? "?").toUpperCase();
}

export function EmployeeInsightCell({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold"
        style={{ background: "var(--ds-color-primary-muted)", color: "var(--ds-color-primary)" }}
        aria-hidden
      >
        {initials(name)}
      </div>
      <span className="font-medium">{name}</span>
    </div>
  );
}
