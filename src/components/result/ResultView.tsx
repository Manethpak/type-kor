import { ReportSpeedChart } from "./ReportSpeedChart";
import { RestartIcon } from "../Icons";
import type { TestResult } from "../../storage/types";
import type { TestSettings } from "../../typing/types";

export function ResultView({
  result,
  theme,
  onRestart,
}: {
  result: TestResult;
  theme: TestSettings["theme"];
  onRestart: () => void;
}) {
  const timeline = result.timeline ?? [];
  const netWpm = result.wordsPerMinute ?? Math.round(result.clustersPerMinute / 5);
  const rawCpm = result.rawClustersPerMinute ?? result.clustersPerMinute;
  const rawWpm = result.rawWordsPerMinute ?? netWpm;
  const burstCpm =
    result.burstClustersPerMinute ?? Math.max(...timeline.map((sample) => sample.burstCpm), 0);
  const burstWpm =
    result.burstWordsPerMinute ?? Math.max(...timeline.map((sample) => sample.burstWpm ?? 0), 0);
  const inputAccuracy = result.inputAccuracy ?? result.accuracy;

  const activityMetrics = [
    {
      label: "ឯកតាបញ្ចូល",
      value: result.insertedUnits ?? result.rawKeystrokes,
      detail: "អក្សរ និងសញ្ញាដែលបានបញ្ចូល",
      tone: "accent",
    },
    {
      label: "កំហុសពេលវាយ",
      value: result.errorUnits ?? result.incorrectClusters,
      detail: "រាប់ទោះបីបានលុបកែរួចក៏ដោយ",
      tone: "error",
    },
    {
      label: "ការកែ",
      value: result.correctionUnits ?? 0,
      detail: "ឯកតាដែលបានលុប ឬវាយឡើងវិញ",
      tone: "neutral",
    },
    {
      label: "ចង្កោមខុសនៅសល់",
      value: result.incorrectClusters,
      detail: "កំហុសដែលនៅសល់ពេលបញ្ចប់",
      tone: "error",
    },
    {
      label: "ចង្កោមត្រឹមត្រូវ",
      value: result.correctClusters,
      detail: "ចង្កោមអក្សរខ្មែរដែលវាយត្រូវ",
      tone: "correct",
    },
    {
      label: "រយៈពេល",
      value: `${(result.durationMs / 1_000).toFixed(result.durationMs % 1_000 === 0 ? 0 : 1)}s`,
      detail: `${timeline.length} ចំណុចទិន្នន័យក្នុងក្រាហ្វ`,
      tone: "neutral",
    },
  ] as const;

  return (
    <div className="mx-auto w-[min(1040px,100%)] animate-arrive">
      <header className="mb-6 flex items-end justify-between gap-5 border-b border-app-line pb-5">
        <div>
          <h1 className="mt-2 font-khmer text-2xl font-medium leading-tight md:text-3xl">
            ចង្វាក់នៃការវាយរបស់អ្នក
          </h1>
        </div>
        <button
          className="flex shrink-0 cursor-pointer items-center gap-2.5 rounded-md bg-app-accent px-2 py-1.5 text-sm font-semibold text-app-bg shadow-[0_10px_35px_color-mix(in_srgb,var(--accent)_18%,transparent)] transition-transform hover:-translate-y-0.5 max-[560px]:size-11 max-[560px]:justify-center max-[560px]:p-0 [&_svg]:w-[15px]"
          onClick={onRestart}
          aria-label="retry"
        >
          <RestartIcon /> <span className="max-[560px]:hidden text-sm">ម្ដងទៀត</span>
        </button>
      </header>

      <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-stretch">
        <section
          className="grid w-full max-w-55 shrink-0 grid-cols-1 overflow-hidden rounded-xl border border-app-line bg-app-raised shadow-[0_16px_50px_var(--shadow)]"
          aria-label="Result overview"
        >
          <article className="relative min-h-36 border-b border-app-line p-4">
            <span className="absolute inset-x-0 top-0 h-0.5 bg-app-accent" />
            <p className="text-xs font-semibold uppercase tracking-widest text-app-accent">
              Net cluster pace
            </p>
            <div className="mt-4 flex items-end gap-1.5">
              <strong className="text-5xl font-light leading-none tracking-tighter text-app-text [font-variant-numeric:tabular-nums]">
                {result.clustersPerMinute}
              </strong>
              <span className="pb-1 text-xs font-bold uppercase tracking-widest text-app-accent">
                CPM
              </span>
            </div>
            <div className="mt-4 flex gap-4 border-t border-app-line pt-2 text-xs">
              <span className="text-app-dim">
                raw <b className="ml-1 font-semibold text-app-text">{rawCpm}</b>
              </span>
              <span className="text-app-dim">
                5s burst <b className="ml-1 font-semibold text-app-text">{burstCpm}</b>
              </span>
            </div>
          </article>

          <article className="relative min-h-36 border-b border-app-line p-4">
            <span className="absolute inset-x-0 top-0 h-0.5 bg-app-correct" />
            <p className="text-xs font-semibold uppercase tracking-widest text-app-correct">
              Net word pace
            </p>
            <div className="mt-4 flex items-end gap-1.5">
              <strong className="text-5xl font-light leading-none tracking-tighter text-app-text [font-variant-numeric:tabular-nums]">
                {netWpm}
              </strong>
              <span className="pb-1 text-xs font-bold uppercase tracking-widest text-app-correct">
                WPM
              </span>
            </div>
            <div className="mt-4 flex gap-4 border-t border-app-line pt-2 text-xs">
              <span className="text-app-dim">
                raw <b className="ml-1 font-semibold text-app-text">{rawWpm}</b>
              </span>
              <span className="text-app-dim">
                5s burst <b className="ml-1 font-semibold text-app-text">{burstWpm}</b>
              </span>
            </div>
          </article>

          <article className="relative flex min-h-28 flex-col bg-[color-mix(in_srgb,var(--surface)_55%,transparent)] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-app-soft">
                Input accuracy
              </p>
              <span className="size-1.5 rounded-full bg-app-correct shadow-[0_0_0_4px_color-mix(in_srgb,var(--correct)_12%,transparent)]" />
            </div>
            <div className="mt-2 flex items-end gap-1">
              <strong className="text-5xl font-light leading-none tracking-tighter text-app-text [font-variant-numeric:tabular-nums]">
                {inputAccuracy}
              </strong>
              <span className="pb-0.5 text-base font-light text-app-dim">%</span>
            </div>
          </article>
        </section>

        <section className="flex w-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-app-line bg-app-raised p-4">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-app-dim">
                Pace over time
              </p>
              <h2 className="mt-1 font-khmer text-lg font-medium text-app-text">
                ល្បឿន និងភាពត្រឹមត្រូវ
              </h2>
            </div>
            <div
              className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold uppercase tracking-wider text-app-dim"
              aria-label="Chart legend"
            >
              <span className="flex items-center gap-2 text-app-accent">
                <i className="h-0.5 w-5 rounded bg-current" /> CPM
              </span>
              <span className="flex items-center gap-2 text-app-correct">
                <i className="h-0.5 w-5 rounded bg-current" /> WPM
              </span>
              <span className="flex items-center gap-2">
                <i className="w-5 border-t border-dashed border-current" /> Accuracy
              </span>
            </div>
          </div>
          <div className="relative min-h-60 w-full flex-1 rounded-lg bg-[color-mix(in_srgb,var(--surface)_34%,transparent)] px-1 py-2 lg:min-h-48">
            <ReportSpeedChart durationMs={result.durationMs} theme={theme} timeline={timeline} />
          </div>
          <div className="mt-2 flex justify-between px-1 text-xs text-app-dim">
            <span className="text-app-accent">← CPM scale</span>
            <span className="text-app-correct">WPM scale →</span>
          </div>
        </section>
      </div>

      <section className="my-4" aria-labelledby="activity-heading">
        <div className="my-2 flex items-baseline justify-between gap-4 px-1">
          <h2 id="activity-heading" className="font-khmer text-xl font-medium text-app-text">
            ព័ត៌មានលម្អិត
          </h2>
        </div>
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {activityMetrics.map((metric) => (
            <div
              key={metric.label}
              className="group relative min-h-24 overflow-hidden rounded-lg border border-app-line bg-app-raised p-3 transition-[border-color,transform] hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--accent)_28%,transparent)]"
              data-tone={metric.tone}
            >
              <span className="absolute right-3 top-3 size-1.5 rounded-full bg-app-dim group-data-[tone=accent]:bg-app-accent group-data-[tone=correct]:bg-app-correct group-data-[tone=error]:bg-app-error" />
              <dt className="pr-5 text-base font-medium text-app-soft tracking-wide">
                {metric.label}
              </dt>
              <dd className="mt-2 text-3xl tracking-tight text-app-text [font-variant-numeric:tabular-nums]">
                {metric.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
