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

  return (
    <div className="mx-auto w-[min(780px,100%)] animate-arrive">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[.13em] text-app-accent">
        លទ្ធផលរបស់អ្នក
      </p>
      <div className="grid grid-cols-[220px_1fr] items-end gap-[42px] border-b border-app-line pb-9 pt-5 max-[760px]:grid-cols-1">
        <div>
          <strong className="block text-[88px] font-light leading-none tracking-[-.05em] text-app-accent">
            {selectedSpeed}
          </strong>
          <span className="mt-[9px] block text-sm text-app-dim">
            {speedUnit === "cpm" ? "ចង្កោម / នាទី" : "ពាក្យ / នាទី"}
          </span>
          <div className="mt-3.5 w-max">
            <SpeedUnitToggle
              label="Result speed unit"
              value={speedUnit}
              onChange={onSpeedUnitChange}
            />
          </div>
        </div>
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center justify-between text-[10px] text-app-dim">
            <span>ល្បឿនតាមវិនាទី · {speedUnit}</span>
            <b className="font-medium uppercase tracking-[.05em] text-app-accent">
              peak {peakSpeed}
            </b>
          </div>
          <div className="relative h-[150px] w-full max-[760px]:h-[140px]">
            <ReportSpeedChart
              durationMs={result.durationMs}
              peakSpeed={peakSpeed}
              speedUnit={speedUnit}
              theme={theme}
              timeline={timeline}
            />
          </div>
        </div>
      </div>

      <div className="my-[30px] grid grid-cols-4 gap-px overflow-hidden rounded-[14px] border border-app-line bg-app-line max-[760px]:grid-cols-2 [&>div]:bg-app-raised [&>div]:p-[18px] [&_span]:block [&_span]:min-h-[34px] [&_span]:text-xs [&_span]:text-app-dim [&_b]:mt-1 [&_b]:block [&_b]:text-2xl [&_b]:font-[450] [&_b]:text-app-text">
        <div>
          <span>ភាពត្រឹមត្រូវ</span>
          <b>{result.accuracy}%</b>
        </div>
        <div>
          <span>CPM</span>
          <b>{result.clustersPerMinute}</b>
        </div>
        <div>
          <span>WPM</span>
          <b>{resultWpm}</b>
        </div>
        <div>
          <span>ល្បឿនខ្ពស់បំផុត · {speedUnit}</span>
          <b>{peakSpeed}</b>
        </div>
        <div>
          <span>ចង្កោមត្រឹមត្រូវ</span>
          <b>{result.correctClusters}</b>
        </div>
        <div>
          <span>កំហុស</span>
          <b>{result.incorrectClusters}</b>
        </div>
        <div>
          <span>គ្រាប់ចុច</span>
          <b>{result.rawKeystrokes}</b>
        </div>
        <div>
          <span>ទិន្នន័យតាមវិនាទី</span>
          <b>{timeline.length}</b>
        </div>
      </div>

      <button
        className="ml-auto flex cursor-pointer items-center gap-2.5 rounded-[10px] bg-app-accent px-[17px] py-[11px] text-sm font-semibold text-app-bg shadow-[0_10px_35px_color-mix(in_srgb,var(--accent)_18%,transparent)] transition-transform hover:-translate-y-0.5 [&_svg]:w-[15px]"
        onClick={onRestart}
      >
        <RestartIcon /> សាកល្បងម្ដងទៀត
      </button>
    </div>
  );
}
