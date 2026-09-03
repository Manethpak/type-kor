import type { ReactNode } from "react";

interface SettingCardProps {
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
}

export function SettingCard({ icon, title, description, children }: SettingCardProps) {
  return (
    <div className="flex min-h-24 flex-col gap-4 border-b border-app-line px-4 py-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-app-accent-soft font-khmer text-app-accent [&_svg]:size-4">
          {icon}
        </span>
        <div className="min-w-0 pt-0.5">
          <h3 className="text-sm font-semibold text-app-text">{title}</h3>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-app-dim">{description}</p>
        </div>
      </div>
      <div className="shrink-0 self-end sm:self-auto">{children}</div>
    </div>
  );
}
