import { useNavigate } from "react-router";
import { curriculum, lessons } from "../learning/curriculum";
import type { LearningState, Lesson, LessonCheckpoint } from "../learning/types";
import { cx } from "../utils/classNames";

export function LearnPage({
  learningState,
  onCheckpoint,
}: {
  learningState: LearningState;
  onCheckpoint: (checkpoint: LessonCheckpoint) => void;
}) {
  const navigate = useNavigate();
  const mastered = lessons.filter((lesson) => learningState.progress[lesson.id]?.masteredAt).length;
  const recommended =
    (learningState.checkpoint &&
      lessons.find((lesson) => lesson.id === learningState.checkpoint?.lessonId)) ||
    lessons.find((lesson) => !learningState.progress[lesson.id]?.masteredAt) ||
    lessons[0];

  const openLesson = (lesson: Lesson) => {
    const resume = learningState.checkpoint?.lessonId === lesson.id;
    if (!resume) {
      onCheckpoint({
        lessonId: lesson.id,
        lessonRevision: lesson.revision,
        stepId: lesson.steps[0].id,
        errors: 0,
      });
    }
    navigate(`/learn/${lesson.id}`);
  };

  return (
    <section className="mx-auto w-[min(920px,100%)] animate-arrive" aria-labelledby="learn-title">
      <div className="mb-8 grid grid-cols-[1fr_auto] items-end gap-5 border-b border-app-line pb-6 max-[680px]:grid-cols-1">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[.19em] text-app-accent">
            NIDA learning path
          </p>
          <h1 id="learn-title" className="m-0 font-khmer text-[38px] font-medium">
            រៀនវាយអក្សរខ្មែរ
          </h1>
        </div>
        <div className="rounded-xl border border-app-line bg-app-raised px-4 py-3 text-right">
          <b className="block text-xl font-medium text-app-accent [font-variant-numeric:tabular-nums]">
            {mastered}/{lessons.length}
          </b>
          <small className="text-[9px] uppercase tracking-[.14em] text-app-dim">mastered</small>
        </div>
      </div>

      {recommended && (
        <button
          className="group mb-7 grid w-full cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-4 overflow-hidden rounded-[17px] border border-[color-mix(in_srgb,var(--accent)_32%,var(--line))] bg-app-accent-soft p-4 text-left transition-[border-color,transform] hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--accent)_58%,transparent)] max-[620px]:grid-cols-[auto_1fr]"
          onClick={() => openLesson(recommended)}
        >
          <span className="grid size-11 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--bg-raised)_78%,transparent)] font-khmer text-xl text-app-accent">
            {learningState.checkpoint?.lessonId === recommended.id ? "↳" : "១"}
          </span>
          <span>
            <small className="text-[9px] font-bold uppercase tracking-[.16em] text-app-accent">
              {learningState.checkpoint?.lessonId === recommended.id
                ? "Continue where you left off"
                : "Recommended next"}
            </small>
            <strong className="mt-1 block font-khmer text-lg font-medium">
              {recommended.title.km}
            </strong>
            <span className="mt-0.5 block text-[11px] text-app-dim">
              {recommended.description.km}
            </span>
          </span>
          <span
            className="text-sm text-app-accent transition-transform group-hover:translate-x-1 max-[620px]:hidden"
            aria-hidden="true"
          >
            →
          </span>
        </button>
      )}

      <div className="space-y-8">
        {curriculum.map((unit) => (
          <section key={unit.id} aria-labelledby={`${unit.id}-title`}>
            <div className="mb-3 flex items-start gap-3">
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border border-app-line bg-app-surface text-[10px] font-semibold text-app-accent">
                {String(unit.order).padStart(2, "0")}
              </span>
              <div>
                <h2 id={`${unit.id}-title`} className="m-0 font-khmer text-xl font-medium">
                  {unit.title.km}
                </h2>
                <p className="mb-0 mt-0.5 text-[11px] text-app-dim">{unit.description.km}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 max-[620px]:grid-cols-1">
              {unit.lessons.map((lesson, lessonIndex) => {
                const progress = learningState.progress[lesson.id];
                const isMastered = Boolean(progress?.masteredAt);
                const isCurrent = learningState.checkpoint?.lessonId === lesson.id;
                return (
                  <button
                    key={lesson.id}
                    className="group min-h-[126px] cursor-pointer rounded-[14px] border border-app-line bg-[color-mix(in_srgb,var(--bg-raised)_86%,transparent)] p-4 text-left transition-[border-color,background,transform] hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--accent)_36%,transparent)] hover:bg-app-raised"
                    onClick={() => openLesson(lesson)}
                  >
                    <span className="mb-5 flex items-center justify-between">
                      <small className="text-[9px] font-semibold uppercase tracking-[.13em] text-app-dim">
                        Lesson {unit.order}.{lessonIndex + 1}
                      </small>
                      <span
                        className={cx(
                          "grid size-5 place-items-center rounded-full border border-app-line text-[9px] text-app-dim",
                          isMastered &&
                            "border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-app-accent-soft text-app-accent",
                          isCurrent &&
                            !isMastered &&
                            "animate-blink border-app-accent text-app-accent",
                        )}
                        aria-label={
                          isMastered ? "Mastered" : isCurrent ? "In progress" : "Not started"
                        }
                      >
                        {isMastered ? "✓" : isCurrent ? "•" : ""}
                      </span>
                    </span>
                    <strong className="block font-khmer text-lg font-medium transition-colors group-hover:text-app-accent">
                      {lesson.title.km}
                    </strong>
                    <span className="mt-1 block text-[11px] leading-normal text-app-dim">
                      {lesson.description.km}
                    </span>
                    {progress && (
                      <small className="mt-2 block text-[9px] text-app-accent">
                        Best {progress.bestAccuracy}% · {progress.attempts} attempt
                        {progress.attempts === 1 ? "" : "s"}
                      </small>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
