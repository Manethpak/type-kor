import type { ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { BookIcon, HistoryIcon, KeyboardIcon, MoonIcon, SettingsIcon, SunIcon } from "./Icons";
import type { TestSettings } from "../typing/types";
import { cx } from "../utils/classNames";

const navLinkClass =
  "grid h-[34px] w-[38px] cursor-pointer place-items-center rounded-[9px] text-app-dim transition-[color,background,transform] duration-200 hover:bg-app-accent-soft hover:text-app-accent active:translate-y-px [&_svg]:size-[17px]";
const selectedLinkClass = "bg-app-accent-soft text-app-accent!";

export function AppShell({
  children,
  theme,
  onThemeToggle,
  practicePath,
  learnPath,
}: {
  children: ReactNode;
  theme: TestSettings["theme"];
  onThemeToggle: () => void;
  practicePath: string;
  learnPath: string;
}) {
  const location = useLocation();
  const navigation = [
    {
      to: "/test",
      label: "Typing test",
      icon: <KeyboardIcon />,
      active: location.pathname === "/test",
    },
    {
      to: learnPath,
      label: "Learn",
      icon: <BookIcon />,
      active: location.pathname.startsWith("/learn"),
    },
    {
      to: "/history",
      label: "Local history",
      icon: <HistoryIcon />,
      active: location.pathname === "/history",
    },
    {
      to: "/settings",
      label: "Settings",
      icon: <SettingsIcon />,
      active: location.pathname === "/settings",
    },
  ];

  return (
    <div className="app-scene relative isolate flex min-h-screen flex-col overflow-hidden text-app-text">
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden font-khmer text-app-accent"
        data-focus-fade
        aria-hidden="true"
      >
        <span className="absolute right-[-5%] top-[4%] rotate-[8deg] text-[clamp(15rem,28vw,32rem)] leading-none opacity-[.018] blur-[1px]">
          ក
        </span>
        <span className="absolute bottom-[-14%] left-[-5%] -rotate-[7deg] text-[clamp(15rem,28vw,32rem)] leading-none opacity-[.018] blur-[1px]">
          ខ
        </span>
        <span className="absolute left-[48%] top-[42%] text-[11rem] leading-none opacity-[.018] blur-[1px]">
          ្មែ
        </span>
      </div>

      <header
        className="mx-auto grid w-[min(1180px,calc(100%_-_48px))] grid-cols-[1fr_auto_1fr] items-center pt-[26px] max-[760px]:w-[calc(100%_-_30px)] max-[760px]:grid-cols-[1fr_auto]"
        data-focus-fade
      >
        <Link
          className="inline-flex cursor-pointer items-center justify-self-start gap-3 p-0 text-left"
          to={practicePath}
          aria-label="Go to typing practice"
        >
          <span className="grid size-10 place-items-center rounded-[11px_11px_11px_3px] border border-[color-mix(in_srgb,var(--accent)_45%,transparent)] bg-app-accent-soft font-khmer text-2xl text-app-accent shadow-[inset_0_0_20px_var(--accent-soft)]">
            ច
          </span>
          <span>
            <strong className="block font-khmer text-[22px] font-bold leading-[1.2] tracking-[.01em]">
              ចង្វាក់
            </strong>
            <small className="mt-0.5 block text-[9px] font-semibold tracking-[.24em] text-app-dim">
              KHMER TYPE
            </small>
          </span>
        </Link>

        <nav
          className="flex gap-1 rounded-[14px] border border-app-line bg-[color-mix(in_srgb,var(--surface)_70%,transparent)] p-[5px] shadow-[0_12px_40px_var(--shadow)] backdrop-blur-[14px] max-[760px]:fixed max-[760px]:bottom-[18px] max-[760px]:right-1/2 max-[760px]:z-10 max-[760px]:translate-x-1/2"
          aria-label="Primary navigation"
        >
          {navigation.map(({ to, label, icon, active }) => (
            <NavLink
              key={label}
              to={to}
              className={() => cx(navLinkClass, active && selectedLinkClass)}
              title={label}
              aria-label={label}
            >
              {icon}
            </NavLink>
          ))}
        </nav>

        <button
          className={cx(
            navLinkClass,
            "justify-self-end border border-app-line bg-app-surface max-[760px]:hidden",
          )}
          onClick={onThemeToggle}
          aria-label="Toggle color theme"
        >
          {theme === "saffron" ? <SunIcon /> : <MoonIcon />}
        </button>
      </header>

      <main className="mx-auto grid w-[min(1080px,calc(100%_-_48px))] flex-1 [place-items:center_stretch] py-9 pt-[54px] max-[760px]:w-[calc(100%_-_30px)] max-[760px]:pt-10">
        {children}
      </main>

      <footer
        className="mx-auto flex w-[min(1180px,calc(100%_-_48px))] justify-between border-t border-app-line py-6 pt-[18px] text-[11px] tracking-[.08em] text-app-dim max-[760px]:w-[calc(100%_-_30px)] max-[760px]:pb-20"
        data-focus-fade
      >
        <span>Unicode Khmer · orthographic cluster engine</span>
        <span className="text-[color-mix(in_srgb,var(--accent)_60%,var(--text-dim))] max-[760px]:hidden">
          បញ្ជីពាក្យសាកល្បង · រង់ចាំការពិនិត្យ
        </span>
      </footer>
    </div>
  );
}
