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
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-app-accent">
            លទ្ធផលរបស់អ្នក
          </p>
          <h1 className="mt-2 font-khmer text-[clamp(25px,4vw,38px)] font-medium leading-tight text-app-text">
            ចង្វាក់នៃការវាយរបស់អ្នក
          </h1>
        </div>
        <button
          className="flex shrink-0 cursor-pointer items-center gap-2.5 rounded-[10px] bg-app-accent px-[17px] py-[11px] text-sm font-semibold text-app-bg shadow-[0_10px_35px_color-mix(in_srgb,var(--accent)_18%,transparent)] transition-transform hover:-translate-y-0.5 max-[560px]:size-11 max-[560px]:justify-center max-[560px]:p-0 [&_svg]:w-[15px]"
          onClick={onRestart}
          aria-label="សាកល្បងម្ដងទៀត"
        >
          <RestartIcon /> <span className="max-[560px]:hidden">សាកល្បងម្ដងទៀត</span>
        </button>
      </header>

      <section
        className="grid grid-cols-[1fr_1fr_.82fr] overflow-hidden rounded-2xl border border-app-line bg-app-raised shadow-[0_22px_70px_var(--shadow)] max-[720px]:grid-cols-2 max-[480px]:grid-cols-1"
        aria-label="Result overview"
      >
        <article className="relative min-h-[120px] border-r border-app-line p-5 max-[720px]:min-h-[170px] max-[480px]:border-b max-[480px]:border-r-0">
          <span className="absolute inset-x-0 top-0 h-0.5 bg-app-accent" />
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-app-accent">
            Net cluster pace
          </p>
          <div className="mt-5 flex items-end gap-2">
            <strong className="text-[clamp(50px,7vw,72px)] font-light leading-[.78] tracking-[-.065em] text-app-text [font-variant-numeric:tabular-nums]">
              {result.clustersPerMinute}
            </strong>
            <span className="pb-1 text-xs font-bold uppercase tracking-[.14em] text-app-accent">
              CPM
            </span>
          </div>
          <div className="mt-7 flex gap-6 border-t border-app-line pt-3 text-xs">
            <span className="text-app-dim">
              raw <b className="ml-1 font-semibold text-app-text">{rawCpm}</b>
            </span>
            <span className="text-app-dim">
              5s burst <b className="ml-1 font-semibold text-app-text">{burstCpm}</b>
            </span>
          </div>
        </article>

        <article className="relative min-h-[190px] border-r border-app-line p-5 max-[720px]:min-h-[170px] max-[720px]:border-r-0 max-[480px]:border-b">
          <span className="absolute inset-x-0 top-0 h-0.5 bg-app-correct" />
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-app-correct">
            Net word pace
          </p>
          <div className="mt-5 flex items-end gap-2">
            <strong className="text-[clamp(50px,7vw,72px)] font-light leading-[.78] tracking-[-.065em] text-app-text [font-variant-numeric:tabular-nums]">
              {netWpm}
            </strong>
            <span className="pb-1 text-xs font-bold uppercase tracking-[.14em] text-app-correct">
              WPM
            </span>
          </div>
          <div className="mt-7 flex gap-6 border-t border-app-line pt-3 text-xs">
            <span className="text-app-dim">
              raw <b className="ml-1 font-semibold text-app-text">{rawWpm}</b>
            </span>
            <span className="text-app-dim">
              5s burst <b className="ml-1 font-semibold text-app-text">{burstWpm}</b>
            </span>
          </div>
        </article>

        <article className="relative flex min-h-[190px] flex-col justify-between bg-[color-mix(in_srgb,var(--surface)_55%,transparent)] p-5 max-[720px]:col-span-2 max-[720px]:min-h-0 max-[720px]:border-t max-[720px]:border-app-line max-[480px]:col-span-1 max-[480px]:border-t-0">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-app-dim">
              Input accuracy
            </p>
            <span className="size-2 rounded-full bg-app-correct shadow-[0_0_0_5px_color-mix(in_srgb,var(--correct)_12%,transparent)]" />
          </div>
          <div className="mt-5 flex items-end gap-1.5">
            <strong className="text-[clamp(48px,6.5vw,64px)] font-light leading-[.8] tracking-[-.06em] text-app-text [font-variant-numeric:tabular-nums]">
              {inputAccuracy}
            </strong>
            <span className="pb-1 text-xl font-light text-app-dim">%</span>
          </div>
          <p className="mt-5 max-w-44 text-[11px] leading-relaxed text-app-dim">
            រាល់កំហុសត្រូវបានរាប់ ទោះបានកែត្រឹមត្រូវវិញក៏ដោយ។
          </p>
        </article>
      </section>

      <section className="mt-4 overflow-hidden rounded-2xl border border-app-line bg-app-raised p-4 sm:p-5">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-app-dim">
              Pace over time
            </p>
            <h2 className="mt-1.5 font-khmer text-xl font-medium text-app-text">
              ល្បឿន និងភាពត្រឹមត្រូវ
            </h2>
          </div>
          <div
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-semibold uppercase tracking-[.08em] text-app-dim"
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
        <div className="relative h-[300px] w-full rounded-xl bg-[color-mix(in_srgb,var(--surface)_34%,transparent)] px-1 py-2 max-[760px]:h-[240px]">
          <ReportSpeedChart durationMs={result.durationMs} theme={theme} timeline={timeline} />
        </div>
        <div className="mt-3 flex justify-between px-1 text-[10px] text-app-dim">
          <span className="text-app-accent">← CPM scale</span>
          <span className="text-app-correct">WPM scale →</span>
        </div>
      </section>

      <section className="mt-4" aria-labelledby="activity-heading">
        <div className="mb-3 flex items-baseline justify-between gap-4 px-1">
          <h2 id="activity-heading" className="font-khmer text-lg font-medium text-app-text">
            ព័ត៌មានលម្អិត
          </h2>
          <span className="text-[10px] uppercase tracking-[.12em] text-app-dim">Input audit</span>
        </div>
        <dl className="grid grid-cols-3 gap-3 max-[720px]:grid-cols-2 max-[420px]:grid-cols-1">
          {activityMetrics.map((metric) => (
            <div
              key={metric.label}
              className="group relative min-h-[132px] overflow-hidden rounded-xl border border-app-line bg-app-raised p-4 transition-[border-color,transform] hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--accent)_28%,transparent)]"
              data-tone={metric.tone}
            >
              <span className="absolute right-3 top-3 size-1.5 rounded-full bg-app-dim group-data-[tone=accent]:bg-app-accent group-data-[tone=correct]:bg-app-correct group-data-[tone=error]:bg-app-error" />
              <dt className="pr-5 text-[11px] font-medium text-app-dim">{metric.label}</dt>
              <dd className="mt-3 text-[38px] font-light leading-none tracking-[-.04em] text-app-text [font-variant-numeric:tabular-nums]">
                {metric.value}
              </dd>
              <p className="mt-3 text-[10px] leading-relaxed text-app-dim">{metric.detail}</p>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
