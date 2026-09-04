import { BookIcon, KeyboardIcon, MoonIcon, SunIcon } from "../components/Icons";
import type { ExperienceMode } from "../learning/types";
import type { TestSettings } from "../typing/types";

const choiceClass =
  "group relative min-h-[290px] cursor-pointer overflow-hidden rounded-[24px] border border-app-line bg-[color-mix(in_srgb,var(--bg-raised)_90%,transparent)] p-7 text-left shadow-[0_28px_80px_var(--shadow)] transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--accent)_42%,transparent)] hover:shadow-[0_34px_90px_var(--shadow)] focus-visible:outline-offset-4";

export function OnboardingPage({
  theme,
  onThemeToggle,
  onSelect,
}: {
  theme: TestSettings["theme"];
  onThemeToggle: () => void;
  onSelect: (experience: ExperienceMode) => void;
}) {
  return (
    <main className="app-scene relative isolate grid min-h-screen place-items-center overflow-hidden px-5 py-10 text-app-text">
      <span
        className="pointer-events-none absolute right-[-4%] top-[-6%] -z-10 font-khmer text-[clamp(18rem,38vw,38rem)] leading-none text-app-accent opacity-[.025]"
        aria-hidden="true"
      >
        រ
      </span>
      <button
        className="absolute right-6 top-6 grid size-10 cursor-pointer place-items-center rounded-[10px] border border-app-line bg-app-surface text-app-dim transition-colors hover:text-app-accent [&_svg]:size-4"
        onClick={onThemeToggle}
        aria-label="Toggle color theme"
      >
        {theme === "saffron" ? <SunIcon /> : <MoonIcon />}
      </button>

      <section className="w-[min(900px,100%)] animate-arrive" aria-labelledby="welcome-title">
        <div className="mb-9 text-center">
          <div className="mx-auto mb-2 grid size-13 place-items-center rounded-[14px_14px_14px_4px] border border-[color-mix(in_srgb,var(--accent)_45%,transparent)] bg-app-accent-soft font-khmer text-3xl text-app-accent shadow-[inset_0_0_24px_var(--accent-soft)]">
            ក
          </div>
          <h1
            id="welcome-title"
            className="text-lg font-semibold uppercase tracking-widest text-app-accent"
          >
            Type ក
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-3 max-[700px]:grid-cols-1">
          <button className={choiceClass} onClick={() => onSelect("learn")}>
            <span
              className="absolute right-5 top-3 font-khmer text-8xl leading-none text-app-accent opacity-[.035] transition-opacity group-hover:opacity-[.07]"
              aria-hidden="true"
            >
              ក
            </span>
            <span className="mb-12 grid size-11 place-items-center rounded-xl bg-app-accent-soft text-app-accent [&_svg]:size-5">
              <BookIcon />
            </span>
            <small className="text-xs font-bold uppercase tracking-widest text-app-accent">
              Guided learning
            </small>
            <h2 className="mb-2 mt-2 font-khmer text-3xl font-medium">
              រៀន <span className="font-ui text-sm font-medium text-app-dim">Learning mode</span>
            </h2>
            <p className="max-w-77.5 text-sm leading-relaxed text-app-soft">
              រៀន typing ខ្មែរជាមួយក្តារចុច NIDA តាមមេរៀន
            </p>
            <span className="mt-7 inline-flex items-center gap-2 text-xs font-semibold text-app-accent">
              ចាប់ផ្ដើមរៀន <span aria-hidden="true">→</span>
            </span>
          </button>

          <button className={choiceClass} onClick={() => onSelect("test")}>
            <span
              className="absolute right-4 top-5 h-px w-24 rotate-[-18deg] bg-app-accent opacity-15"
              aria-hidden="true"
            />
            <span className="mb-12 grid size-11 place-items-center rounded-xl bg-app-accent-soft text-app-accent [&_svg]:size-5">
              <KeyboardIcon />
            </span>
            <small className="text-xs font-bold uppercase tracking-widest text-app-accent">
              Practice & Measure
            </small>
            <h2 className="mb-2 mt-2 font-khmer text-3xl font-medium">
              សាកល្បង <span className="font-ui text-sm font-medium text-app-dim">Testing mode</span>
            </h2>
            <p className="max-w-77.5 text-sm leading-relaxed text-app-soft">
              វាស់ល្បឿន និងភាពត្រឹមត្រូវតាមពេលវេលា ឬចំនួនពាក្យ ដោយគ្មានជំនួយ។
            </p>
            <span className="mt-7 inline-flex items-center gap-2 text-xs font-semibold text-app-accent">
              ចូលសាកល្បង <span aria-hidden="true">→</span>
            </span>
          </button>
        </div>
      </section>
    </main>
  );
}
