import { MoonIcon, RestartIcon, SoundIcon, SunIcon } from "../components/Icons";
import { SettingCard } from "../components/settings/SettingCard";
import { SettingsGroup } from "../components/settings/SettingsGroup";
import type { TestSettings } from "../typing/types";
import { cx } from "../utils/classNames";

const optionButtonClass =
  "inline-flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium text-app-dim transition-[color,background,box-shadow] hover:bg-app-hover hover:text-app-text [&_svg]:size-3.5";
const selectedButtonClass = "bg-app-raised text-app-accent! shadow-sm ring-1 ring-app-line";
const toggleClass =
  "group relative h-6 w-11 shrink-0 cursor-pointer rounded-full bg-app-hover p-1 transition-colors data-[on=true]:bg-app-accent-soft";

export function SettingsPage({
  settings,
  onChange,
}: {
  settings: TestSettings;
  onChange: (settings: TestSettings) => void;
}) {
  const update = <K extends keyof TestSettings>(key: K, value: TestSettings[K]) =>
    onChange({ ...settings, [key]: value });

  return (
    <section className="mx-auto w-full max-w-5xl animate-arrive">
      <header className="mb-8 border-b border-app-line pb-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-app-accent">
          Personal workspace
        </p>
        <h1 className="mt-2 font-khmer text-4xl font-medium text-app-text">ការកំណត់</h1>
        <p className="mt-2 max-w-xl font-khmer text-sm leading-relaxed text-app-dim">
          កែសម្រួលការបង្ហាញ ការវាស់ល្បឿន និងសញ្ញាជំនួយ ឱ្យសមនឹងរបៀបវាយរបស់អ្នក។
        </p>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SettingsGroup
            id="appearance-settings"
            eyebrow="Reading"
            title="ការបង្ហាញអត្ថបទ"
            description="កំណត់ពណ៌ ទំហំ និងគម្លាតអក្សរ ដើម្បីឱ្យការអានកាន់តែងាយស្រួល។"
          >
            <div className="border-b border-app-line bg-[color-mix(in_srgb,var(--surface)_45%,transparent)] px-5 py-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-app-dim">
                មើលជាមុន
              </span>
              <p
                className="mt-3 overflow-hidden font-khmer text-app-text"
                style={{ fontSize: settings.fontSize, lineHeight: settings.lineHeight }}
              >
                អក្សរខ្មែរ
              </p>
            </div>

            <SettingCard icon={<SunIcon />} title="រូបរាង" description="ជ្រើសពណ៌ស្រទន់ដែលងាយស្រួលមើល។">
              <div
                className="grid w-52 grid-cols-2 rounded-lg bg-app-surface p-1"
                role="group"
                aria-label="Color theme"
              >
                <button
                  type="button"
                  className={cx(
                    optionButtonClass,
                    settings.theme === "saffron" && selectedButtonClass,
                  )}
                  onClick={() => update("theme", "saffron")}
                  aria-pressed={settings.theme === "saffron"}
                >
                  <MoonIcon /> Saffron
                </button>
                <button
                  type="button"
                  className={cx(
                    optionButtonClass,
                    settings.theme === "paper" && selectedButtonClass,
                  )}
                  onClick={() => update("theme", "paper")}
                  aria-pressed={settings.theme === "paper"}
                >
                  <SunIcon /> Paper
                </button>
              </div>
            </SettingCard>

            <SettingCard icon="ក" title="ទំហំអក្សរ" description="ធ្វើឱ្យចង្កោមអក្សរខ្មែរមើលឃើញច្បាស់។">
              <label className="flex w-48 items-center gap-3">
                <span className="sr-only">ទំហំអក្សរ</span>
                <input
                  className="h-1.5 min-w-0 flex-1 cursor-pointer accent-app-accent"
                  type="range"
                  min="38"
                  max="64"
                  value={settings.fontSize}
                  onChange={(event) => update("fontSize", Number(event.target.value))}
                />
                <output className="w-12 rounded-md bg-app-accent-soft px-2 py-1 text-center text-xs font-semibold text-app-accent [font-variant-numeric:tabular-nums]">
                  {settings.fontSize}px
                </output>
              </label>
            </SettingCard>

            <SettingCard
              icon="↕"
              title="គម្លាតបន្ទាត់"
              description="ទុកកន្លែងគ្រប់គ្រាន់សម្រាប់ស្រៈខាងលើ និងខាងក្រោម។"
            >
              <label className="flex w-48 items-center gap-3">
                <span className="sr-only">គម្លាតបន្ទាត់</span>
                <input
                  className="h-1.5 min-w-0 flex-1 cursor-pointer accent-app-accent"
                  type="range"
                  min="1.5"
                  max="2.2"
                  step="0.05"
                  value={settings.lineHeight}
                  onChange={(event) => update("lineHeight", Number(event.target.value))}
                />
                <output className="w-12 rounded-md bg-app-accent-soft px-2 py-1 text-center text-xs font-semibold text-app-accent [font-variant-numeric:tabular-nums]">
                  {settings.lineHeight.toFixed(2)}
                </output>
              </label>
            </SettingCard>
          </SettingsGroup>
        </div>

        <div className="space-y-5 lg:col-span-2">
          <SettingsGroup
            id="typing-settings"
            eyebrow="Typing"
            title="បទពិសោធន៍វាយ"
            description="ជ្រើសរបៀបវាស់ល្បឿន និងសញ្ញាជំនួយក្នុងលំហាត់។"
          >
            <SettingCard
              icon="↗"
              title="ឯកតាល្បឿន"
              description="CPM រាប់ចង្កោមខ្មែរ។ WPM ប្រើស្តង់ដារ ៥ តួអក្សរ។"
            >
              <div
                className="grid w-36 grid-cols-2 rounded-lg bg-app-surface p-1"
                role="group"
                aria-label="Speed unit"
              >
                <button
                  type="button"
                  className={cx(
                    optionButtonClass,
                    settings.speedUnit === "cpm" && selectedButtonClass,
                  )}
                  onClick={() => update("speedUnit", "cpm")}
                  aria-pressed={settings.speedUnit === "cpm"}
                >
                  CPM
                </button>
                <button
                  type="button"
                  className={cx(
                    optionButtonClass,
                    settings.speedUnit === "wpm" && selectedButtonClass,
                  )}
                  onClick={() => update("speedUnit", "wpm")}
                  aria-pressed={settings.speedUnit === "wpm"}
                >
                  WPM
                </button>
              </div>
            </SettingCard>

            <SettingCard
              icon={<SoundIcon />}
              title="សំឡេង"
              description="បន្លឺសញ្ញាស្រាលពេលវាយចង្កោមបានត្រឹមត្រូវ។"
            >
              <button
                type="button"
                className={toggleClass}
                data-on={settings.sound}
                onClick={() => update("sound", !settings.sound)}
                aria-pressed={settings.sound}
                aria-label="សំឡេងពេលវាយ"
              >
                <span className="block size-4 rounded-full bg-app-dim transition-[transform,background] group-data-[on=true]:translate-x-5 group-data-[on=true]:bg-app-accent" />
              </button>
            </SettingCard>

            <SettingCard icon="។" title="សញ្ញាវណ្ណយុត្ត" description="បន្ថែមសញ្ញាខ្មែរទៅក្នុងលំហាត់វាយ។">
              <button
                type="button"
                className={toggleClass}
                data-on={settings.punctuation}
                onClick={() => update("punctuation", !settings.punctuation)}
                aria-pressed={settings.punctuation}
                aria-label="សញ្ញាវណ្ណយុត្តខ្មែរ"
              >
                <span className="block size-4 rounded-full bg-app-dim transition-[transform,background] group-data-[on=true]:translate-x-5 group-data-[on=true]:bg-app-accent" />
              </button>
            </SettingCard>
          </SettingsGroup>

          <SettingsGroup
            id="shortcut-settings"
            eyebrow="Shortcut"
            title="ផ្លូវកាត់"
            description="បញ្ជាលំហាត់ដោយមិនចាំបាច់ចាកចេញពីក្ដារចុច។"
          >
            <SettingCard icon={<RestartIcon />} title="ចាប់ផ្ដើមឡើងវិញ" description="ប្រើពីអេក្រង់សាកល្បង។">
              <kbd className="rounded-md border border-b-2 border-app-line bg-app-surface px-2 py-1 font-ui text-xs font-semibold uppercase text-app-soft">
                esc
              </kbd>
            </SettingCard>
          </SettingsGroup>
        </div>
      </div>

      <section
        className="mt-10 grid gap-5 border-t border-app-line pt-8 md:grid-cols-3"
        aria-labelledby="acknowledgement-heading"
      >
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-app-accent">
            Data source
          </p>
          <h2
            id="acknowledgement-heading"
            className="mt-1 font-khmer text-xl font-medium text-app-text"
          >
            ការទទួលស្គាល់
          </h2>
          <p className="mt-2 max-w-xs font-khmer text-xs leading-relaxed text-app-dim">
            ប្រភពពាក្យដែលប្រើសម្រាប់បង្កើតលំហាត់វាយអក្សរ។
          </p>
        </header>

        <article className="rounded-2xl border border-app-line bg-[color-mix(in_srgb,var(--bg-raised)_72%,transparent)] p-5 md:col-span-2">
          <div className="flex items-start gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-app-accent-soft text-sm text-app-accent">
              ↗
            </span>
            <div>
              <h3 className="font-khmer text-base font-semibold text-app-text">បញ្ជីពាក្យខ្មែរ</h3>
              <p className="mt-2 max-w-prose font-khmer text-sm leading-7 text-app-soft">
                បញ្ជីពាក្យ ១០០, ២៥០ និង ៥០០ ពាក្យ ត្រូវបានបង្កើតពីទិន្នន័យស្វែងរកខ្មែរ របស់ seanghay
                ដើម្បីជ្រើសពាក្យដែលគេប្រើញឹកញាប់។
              </p>
              <a
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-app-accent underline decoration-app-accent/35 underline-offset-4 transition-colors hover:decoration-app-accent"
                href="https://huggingface.co/datasets/seanghay/khmer-search-frequency"
                target="_blank"
                rel="noreferrer"
              >
                មើល dataset នៅ Hugging Face <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </article>
      </section>
    </section>
  );
}
