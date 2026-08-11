import { ReportSpeedChart } from "./ReportSpeedChart";
import { RestartIcon } from "./Icons";
import { SpeedUnitToggle } from "./SpeedUnitToggle";
import type { TestResult } from "../storage/types";
import type { TestSettings } from "../typing/types";

export function ResultView({
  result,
  speedUnit,
  theme,
  onSpeedUnitChange,
  onRestart,
}: {
  result: TestResult;
  speedUnit: TestSettings["speedUnit"];
  theme: TestSettings["theme"];
  onSpeedUnitChange: (unit: TestSettings["speedUnit"]) => void;
  onRestart: () => void;
}) {
  const timeline = result.timeline ?? [];
  const resultWpm = result.wordsPerMinute ?? Math.round(result.clustersPerMinute / 5);
  const selectedSpeed = speedUnit === "cpm" ? result.clustersPerMinute : resultWpm;
  const selectedBursts = timeline.map((sample) =>
    speedUnit === "cpm" ? sample.burstCpm : (sample.burstWpm ?? Math.round(sample.burstCpm / 5)),
  );
  const peakSpeed = Math.max(selectedSpeed, ...selectedBursts, 0);

  const metricGroups = [
    {
      label: "សមត្ថភាព",
      highlighted: true,
      metrics: [
        ["ភាពត្រឹមត្រូវ", `${result.accuracy}%`],
        ["CPM", result.clustersPerMinute],
        ["WPM", resultWpm],
        [`ខ្ពស់បំផុត · ${speedUnit}`, peakSpeed],
      ],
    },
    {
      label: "សកម្មភាព",
      highlighted: false,
      metrics: [
        ["ចង្កោមត្រឹមត្រូវ", result.correctClusters],
        ["កំហុស", result.incorrectClusters],
        ["គ្រាប់ចុច", result.rawKeystrokes],
        ["ទិន្នន័យតាមវិនាទី", timeline.length],
      ],
    },
  ] as const;

  return (
    <div className="mx-auto w-[min(960px,100%)] animate-arrive">
      <p className="text-xs font-semibold uppercase tracking-[.13em] text-app-accent">លទ្ធផលរបស់អ្នក</p>
      <div className="flex items-end justify-between gap-6 pb-4 pt-3 max-[560px]:items-center">
        <div className="flex items-end gap-4">
          <strong className="block text-[72px] font-light leading-[.86] tracking-[-.055em] text-app-accent max-[560px]:text-[58px]">
            {selectedSpeed}
          </strong>
          <span className="mb-0.5 block max-w-24 text-xs leading-relaxed text-app-dim max-[560px]:hidden">
            {speedUnit === "cpm" ? "ចង្កោមក្នុងមួយនាទី" : "ពាក្យក្នុងមួយនាទី"}
          </span>
        </div>
        <div className="mb-0.5 w-max">
          <SpeedUnitToggle
            label="Result speed unit"
            value={speedUnit}
            onChange={onSpeedUnitChange}
          />
        </div>
      </div>

      <div className="border-b border-app-line pb-5">
        <div className="mb-1.5 flex items-center justify-between text-[10px] text-app-dim">
          <span>ល្បឿនតាមវិនាទី · {speedUnit}</span>
          <b className="font-medium uppercase tracking-[.05em] text-app-accent">peak {peakSpeed}</b>
        </div>
        <div className="relative h-[230px] w-full rounded-xl bg-[color-mix(in_srgb,var(--surface)_34%,transparent)] px-1 pt-2 max-[760px]:h-[190px]">
          <ReportSpeedChart
            durationMs={result.durationMs}
            peakSpeed={peakSpeed}
            speedUnit={speedUnit}
            theme={theme}
            timeline={timeline}
          />
        </div>
      </div>

      <div className="my-4 grid grid-cols-2 gap-2.5 max-[760px]:grid-cols-1">
        {metricGroups.map((group) => (
          <section
            key={group.label}
            className={
              group.highlighted
                ? "overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--accent)_24%,transparent)] bg-[color-mix(in_srgb,var(--accent)_5%,var(--bg-raised))]"
                : "overflow-hidden rounded-xl border border-app-line bg-app-raised"
            }
            aria-label={group.label}
          >
            <h2
              className={
                group.highlighted
                  ? "flex items-center gap-1.5 border-b border-[color-mix(in_srgb,var(--accent)_14%,transparent)] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[.15em] text-app-accent"
                  : "flex items-center gap-1.5 border-b border-app-line px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[.15em] text-app-dim"
              }
            >
              <span className="size-1 rounded-full bg-current" />
              {group.label}
            </h2>
            <dl className="grid grid-cols-4 divide-x divide-app-line max-[480px]:grid-cols-2 max-[480px]:divide-x-0">
              {group.metrics.map(([label, value]) => (
                <div
                  key={label}
                  className="min-w-0 px-3 py-2.5 max-[480px]:border-b max-[480px]:border-app-line max-[480px]:odd:border-r"
                >
                  <dt className="truncate text-[10px] text-app-dim" title={label}>
                    {label}
                  </dt>
                  <dd className="mt-0.5 text-xl font-[460] leading-tight text-app-text [font-variant-numeric:tabular-nums]">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <button
        className="ml-auto flex cursor-pointer items-center gap-2.5 rounded-[10px] bg-app-accent px-[17px] py-[11px] text-sm font-semibold text-app-bg shadow-[0_10px_35px_color-mix(in_srgb,var(--accent)_18%,transparent)] transition-transform hover:-translate-y-0.5 max-[760px]:size-11 max-[760px]:justify-center max-[760px]:p-0 [&_svg]:w-[15px]"
        onClick={onRestart}
        aria-label="សាកល្បងម្ដងទៀត"
      >
        <RestartIcon /> <span className="max-[760px]:hidden">សាកល្បងម្ដងទៀត</span>
      </button>
    </div>
  );
}
