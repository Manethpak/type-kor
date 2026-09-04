import { HistoryIcon, TrashIcon } from "../components/Icons";
import type { TestResult } from "../storage/types";
import type { TestSettings } from "../typing/types";

const difficultyLabels = {
  beginner: "ដំបូង",
  intermediate: "មធ្យម",
  advanced: "ខ្ពស់",
  mixed: "ចម្រុះ",
} as const;

export function HistoryPage({
  history,
  speedUnit,
  onClear,
}: {
  history: TestResult[];
  speedUnit: TestSettings["speedUnit"];
  onClear: () => void;
}) {
  return (
    <section className="mx-auto w-[min(880px,100%)] animate-[arrive_.4s_ease_both]">
      <div className="mb-9 flex items-end justify-between border-b border-app-line pb-5">
        <div>
          <h1 className="m-0 font-khmer text-4xl font-medium text-app-accent">ប្រវត្តិលទ្ធផលវាយអក្សរ</h1>
        </div>
        {history.length > 0 && (
          <button
            className="flex cursor-pointer items-center gap-2 p-2 text-xs text-app-dim transition-colors hover:text-app-error [&_svg]:w-3.5"
            onClick={onClear}
          >
            <TrashIcon /> លុបទាំងអស់
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="grid min-h-[280px] place-items-center content-center rounded-[18px] border border-dashed border-app-line bg-[color-mix(in_srgb,var(--surface)_45%,transparent)] p-10 text-center [&>svg]:w-[35px] [&>svg]:text-app-accent [&>svg]:opacity-70 [&_h2]:mb-1 [&_h2]:mt-[15px] [&_h2]:font-khmer [&_h2]:text-2xl [&_h2]:font-medium [&_p]:m-0 [&_p]:text-sm [&_p]:text-app-dim">
          <HistoryIcon />
          <h2>មិនទាន់មានលទ្ធផល</h2>
          <p>សាកល្បងវាយអក្សរម្តង ដើម្បីមើលលទ្ធផលរបស់អ្នកនៅទីនេះ។</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {history.map((item) => (
            <article
              className="grid grid-cols-[1.5fr_1fr_1fr_1fr] items-center rounded-xl border border-app-line bg-app-raised px-[18px] py-[15px] transition-[border-color,transform] hover:translate-x-[3px] hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)] max-[760px]:grid-cols-2 max-[760px]:gap-2"
              key={item.id}
            >
              <time className="text-xs text-app-dim">
                {new Intl.DateTimeFormat("km-KH", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(item.startedAt))}
              </time>
              <strong className="text-2xl font-[450] text-app-accent">
                {speedUnit === "cpm"
                  ? item.clustersPerMinute
                  : (item.wordsPerMinute ?? Math.round(item.clustersPerMinute / 5))}
                <small className="text-xs font-medium"> {speedUnit}</small>
              </strong>
              <span className="text-xs text-app-dim">{item.accuracy}% ត្រឹមត្រូវ</span>
              <span className="text-xs text-app-dim">
                {item.mode === "time" ? `${item.modeValue} វិនាទី` : `${item.modeValue} ពាក្យ`}
                {item.wordDifficulty ? ` · ${difficultyLabels[item.wordDifficulty]}` : ""}
              </span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
