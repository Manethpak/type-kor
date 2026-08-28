import { MoonIcon, RestartIcon, SoundIcon, SunIcon } from "../components/Icons";
import type { TestSettings } from "../typing/types";
import { cx } from "../utils/classNames";

const settingCardClass =
  "flex min-h-28 items-center justify-between gap-5 rounded-[14px] border border-app-line bg-[color-mix(in_srgb,var(--bg-raised)_88%,transparent)] p-[17px]";
const settingLeadClass = "flex items-center gap-3";
const settingIconClass =
  "grid size-9 shrink-0 place-items-center rounded-[10px] bg-app-accent-soft font-khmer text-app-accent [&_svg]:size-4";
const settingCopyClass =
  "[&_h2]:mb-[3px] [&_h2]:text-sm [&_h2]:font-[560] [&_p]:m-0 [&_p]:max-w-[220px] [&_p]:text-[11px] [&_p]:leading-normal [&_p]:text-app-dim";
const segmentedButtonClass =
  "flex cursor-pointer items-center gap-1.5 rounded-[7px] px-2 py-1.5 text-left text-[10px] text-app-dim transition-colors hover:bg-app-accent-soft hover:text-app-accent [&_svg]:size-3";
const selectedButtonClass = "bg-app-accent-soft text-app-accent!";

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
    <section className="mx-auto w-[min(880px,100%)] animate-[arrive_.4s_ease_both]">
      <div className="mb-[35px] flex items-end justify-between border-b border-app-line pb-[22px]">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[.13em] text-app-accent">
            សម្រួលឱ្យស្របនឹងអ្នក
          </p>
          <h1 className="m-0 font-khmer text-[34px] font-medium">ការកំណត់</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 max-[760px]:grid-cols-1">
        <div className={settingCardClass}>
          <div className={settingLeadClass}>
            <span className={settingIconClass}>↗</span>
            <div className={settingCopyClass}>
              <h2>ឯកតាល្បឿន</h2>
              <p>CPM សម្រាប់ចង្កោមខ្មែរ ឬ WPM ស្តង់ដារ ៥ តួអក្សរ</p>
            </div>
          </div>
          <div className="grid shrink-0 gap-1" role="group" aria-label="Speed unit">
            <button
              className={cx(
                segmentedButtonClass,
                settings.speedUnit === "cpm" && selectedButtonClass,
              )}
              onClick={() => update("speedUnit", "cpm")}
              aria-pressed={settings.speedUnit === "cpm"}
            >
              CPM
            </button>
            <button
              className={cx(
                segmentedButtonClass,
                settings.speedUnit === "wpm" && selectedButtonClass,
              )}
              onClick={() => update("speedUnit", "wpm")}
              aria-pressed={settings.speedUnit === "wpm"}
            >
              WPM
            </button>
          </div>
        </div>

        <div className={settingCardClass}>
          <div className={settingLeadClass}>
            <span className={settingIconClass}>
              <SunIcon />
            </span>
            <div className={settingCopyClass}>
              <h2>រូបរាង</h2>
              <p>ពណ៌ស្រទន់សម្រាប់ការផ្តោតអារម្មណ៍</p>
            </div>
          </div>
          <div className="grid shrink-0 gap-1">
            <button
              className={cx(
                segmentedButtonClass,
                settings.theme === "saffron" && selectedButtonClass,
              )}
              onClick={() => update("theme", "saffron")}
            >
              <MoonIcon /> Saffron Ink
            </button>
            <button
              className={cx(
                segmentedButtonClass,
                settings.theme === "paper" && selectedButtonClass,
              )}
              onClick={() => update("theme", "paper")}
            >
              <SunIcon /> Rice Paper
            </button>
          </div>
        </div>

        <div className={settingCardClass}>
          <div className={settingLeadClass}>
            <span className={settingIconClass}>ក</span>
            <div className={settingCopyClass}>
              <h2>ទំហំអក្សរ</h2>
              <p>រក្សារូបរាងចង្កោមឱ្យច្បាស់</p>
            </div>
          </div>
          <label className="flex w-[140px] shrink-0 items-center gap-[9px]">
            <input
              className="w-[95px] accent-app-accent"
              type="range"
              min="38"
              max="64"
              value={settings.fontSize}
              onChange={(event) => update("fontSize", Number(event.target.value))}
            />
            <output className="text-xs text-app-accent [font-variant-numeric:tabular-nums]">
              {settings.fontSize}px
            </output>
          </label>
        </div>

        <div className={settingCardClass}>
          <div className={settingLeadClass}>
            <span className={settingIconClass}>↕</span>
            <div className={settingCopyClass}>
              <h2>គម្លាតបន្ទាត់</h2>
              <p>បន្ថែមកន្លែងសម្រាប់ស្រៈលើ និងក្រោម</p>
            </div>
          </div>
          <label className="flex w-[140px] shrink-0 items-center gap-[9px]">
            <input
              className="w-[95px] accent-app-accent"
              type="range"
              min="1.5"
              max="2.2"
              step="0.05"
              value={settings.lineHeight}
              onChange={(event) => update("lineHeight", Number(event.target.value))}
            />
            <output className="text-xs text-app-accent [font-variant-numeric:tabular-nums]">
              {settings.lineHeight.toFixed(2)}
            </output>
          </label>
        </div>

        <div className={settingCardClass}>
          <div className={settingLeadClass}>
            <span className={settingIconClass}>
              <SoundIcon />
            </span>
            <div className={settingCopyClass}>
              <h2>សំឡេង</h2>
              <p>សញ្ញាស្រាលពេលបញ្ចប់ចង្កោមត្រឹមត្រូវ</p>
            </div>
          </div>
          <button
            className="group relative h-[22px] w-[38px] shrink-0 cursor-pointer rounded-xl bg-app-hover p-[3px] transition-colors data-[on=true]:bg-app-accent-soft"
            data-on={settings.sound}
            onClick={() => update("sound", !settings.sound)}
            aria-pressed={settings.sound}
            aria-label="Typing sound"
          >
            <span className="block size-4 rounded-full bg-app-dim transition-[transform,background] group-data-[on=true]:translate-x-4 group-data-[on=true]:bg-app-accent" />
          </button>
        </div>

        <div className={settingCardClass}>
          <div className={settingLeadClass}>
            <span className={settingIconClass}>។</span>
            <div className={settingCopyClass}>
              <h2>សញ្ញាវណ្ណយុត្ត</h2>
              <p>បន្ថែមសញ្ញាខ្មែរទៅក្នុងលំហាត់</p>
            </div>
          </div>
          <button
            className="group relative h-[22px] w-[38px] shrink-0 cursor-pointer rounded-xl bg-app-hover p-[3px] transition-colors data-[on=true]:bg-app-accent-soft"
            data-on={settings.punctuation}
            onClick={() => update("punctuation", !settings.punctuation)}
            aria-pressed={settings.punctuation}
            aria-label="Khmer punctuation"
          >
            <span className="block size-4 rounded-full bg-app-dim transition-[transform,background] group-data-[on=true]:translate-x-4 group-data-[on=true]:bg-app-accent" />
          </button>
        </div>

        <div className={settingCardClass}>
          <div className={settingLeadClass}>
            <span className={settingIconClass}>
              <RestartIcon />
            </span>
            <div className={settingCopyClass}>
              <h2>ចាប់ផ្ដើមឡើងវិញ</h2>
              <p>ប្រើផ្លូវកាត់ពីអេក្រង់សាកល្បង</p>
            </div>
          </div>
          <kbd className="rounded-[5px] border border-b-2 border-app-line bg-app-surface px-1.5 py-0.5 font-ui text-xs uppercase text-app-soft">
            esc
          </kbd>
        </div>
      </div>

      <aside className="mt-7 rounded-[14px] border border-app-line bg-[color-mix(in_srgb,var(--bg-raised)_62%,transparent)] px-[17px] py-[15px] text-[11px] leading-relaxed text-app-dim">
        <p className="m-0">
          <strong className="font-[560] text-app-soft">ការទទួលស្គាល់ប្រភពទិន្នន័យ៖ </strong>
          បញ្ជីពាក្យ ១០០, ២៥០ និង ៥០០ ពាក្យត្រូវបានបង្កើតពីទិន្នន័យស្វែងរកខ្មែររបស់{" "}
          <a
            className="text-app-accent underline decoration-app-accent/35 underline-offset-2 transition-colors hover:decoration-app-accent"
            href="https://huggingface.co/datasets/seanghay/khmer-search-frequency"
            target="_blank"
            rel="noreferrer"
          >
            seanghay/khmer-search-frequency
          </a>{" "}
          នៅលើ Hugging Face។
        </p>
      </aside>
    </section>
  );
}
