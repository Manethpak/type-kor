import type { ReactNode } from "react";

interface SettingsGroupProps {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function SettingsGroup({ id, eyebrow, title, description, children }: SettingsGroupProps) {
  return (
    <section aria-labelledby={id}>
      <header className="mb-3 px-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-app-accent">{eyebrow}</p>
        <h2 id={id} className="mt-1 font-khmer text-xl font-medium text-app-text">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-app-soft">{description}</p>
      </header>
      <div className="overflow-hidden rounded-2xl border border-app-line bg-app-raised shadow-[0_18px_55px_var(--shadow)]">
        {children}
      </div>
    </section>
  );
}
