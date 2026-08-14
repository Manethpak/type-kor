import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { NidaKeyboard } from "../components/NidaKeyboard";
import { getLesson, getNextLesson } from "../learning/curriculum";
import { keyInstruction } from "../learning/nida";
import type { LearningState, Lesson, LessonCheckpoint } from "../learning/types";
import { khmerTextEngine } from "../engine/khmer";

function activeHintIndex(lesson: Lesson, stepIndex: number, input: string): number {
  const hints = lesson.steps[stepIndex].keySequence;
  const normalizedInput = khmerTextEngine.canonicalize(input);
  let produced = "";
  for (let index = 0; index < hints.length; index += 1) {
    produced += hints[index].output;
    if (khmerTextEngine.canonicalize(produced).length > normalizedInput.length) return index;
  }
  return Math.max(0, hints.length - 1);
}

function LessonSession({
  lesson,
  learningState,
  onCheckpoint,
  onComplete,
}: {
  lesson: Lesson;
  learningState: LearningState;
  onCheckpoint: (checkpoint: LessonCheckpoint) => void;
  onComplete: (lessonId: string, accuracy: number) => void;
}) {
  const navigate = useNavigate();
  const resumed =
    learningState.checkpoint?.lessonId === lesson.id ? learningState.checkpoint : null;
  const resumedStepIndex = resumed
    ? lesson.steps.findIndex((step) => step.id === resumed.stepId)
    : -1;
  const [stepIndex, setStepIndex] = useState(resumedStepIndex >= 0 ? resumedStepIndex : 0);
  const [errors, setErrors] = useState(resumed?.errors ?? 0);
  const [stepErrors, setStepErrors] = useState(0);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"prefix" | "incorrect">("prefix");
  const [completedAccuracy, setCompletedAccuracy] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const composingRef = useRef(false);
  const checkpointInitializedRef = useRef(false);

  useEffect(() => {
    if (checkpointInitializedRef.current) return;
    checkpointInitializedRef.current = true;
    if (!resumed) {
      onCheckpoint({
        lessonId: lesson.id,
        lessonRevision: lesson.revision,
        stepId: lesson.steps[0].id,
        errors: 0,
      });
    }
  }, [lesson.id, onCheckpoint, resumed]);

  const step = lesson.steps[stepIndex];
  const hintIndex = useMemo(
    () => (step ? activeHintIndex(lesson, stepIndex, input) : 0),
    [input, lesson, step, stepIndex],
  );
  const activeHint = step?.keySequence[hintIndex];

  const focusInput = useCallback(() => inputRef.current?.focus({ preventScroll: true }), []);

  const processInput = useCallback(
    (nextInput: string) => {
      if (!step || completedAccuracy !== null) return;
      const attempt = khmerTextEngine.canonicalize(nextInput);
      const target = khmerTextEngine.canonicalize(step.prompt);
      setInput(nextInput);

      if (attempt === target) {
        const nextStep = stepIndex + 1;
        if (nextStep >= lesson.steps.length) {
          const accuracy = Math.round((lesson.steps.length / (lesson.steps.length + errors)) * 100);
          setCompletedAccuracy(accuracy);
          setInput("");
          onComplete(lesson.id, accuracy);
          return;
        }
        setStepIndex(nextStep);
        setStepErrors(0);
        setInput("");
        setStatus("prefix");
        onCheckpoint({
          lessonId: lesson.id,
          lessonRevision: lesson.revision,
          stepId: lesson.steps[nextStep].id,
          errors,
        });
        return;
      }

      if (!attempt || target.startsWith(attempt)) {
        setStatus("prefix");
        return;
      }

      const nextErrors = errors + 1;
      setErrors(nextErrors);
      setStepErrors((value) => value + 1);
      setStatus("incorrect");
      onCheckpoint({
        lessonId: lesson.id,
        lessonRevision: lesson.revision,
        stepId: step.id,
        errors: nextErrors,
      });
    },
    [
      completedAccuracy,
      errors,
      lesson.id,
      lesson.steps.length,
      onCheckpoint,
      onComplete,
      step,
      stepIndex,
    ],
  );

  const handleChange = (event: FormEvent<HTMLTextAreaElement>) => {
    const value = event.currentTarget.value;
    if (composingRef.current) {
      setInput(value);
      return;
    }
    processInput(value);
  };

  const repeatLesson = () => {
    setStepIndex(0);
    setErrors(0);
    setStepErrors(0);
    setInput("");
    setStatus("prefix");
    setCompletedAccuracy(null);
    onCheckpoint({
      lessonId: lesson.id,
      lessonRevision: lesson.revision,
      stepId: lesson.steps[0].id,
      errors: 0,
    });
    window.setTimeout(focusInput, 0);
  };

  const nextLesson = getNextLesson(lesson.id);

  if (completedAccuracy !== null) {
    const mastered = completedAccuracy >= lesson.masteryAccuracy;
    return (
      <section
        className="mx-auto w-[min(760px,100%)] animate-arrive text-center"
        aria-label="Lesson complete"
      >
        <div className="rounded-[22px] border border-app-line bg-[color-mix(in_srgb,var(--bg-raised)_90%,transparent)] px-7 py-12 shadow-[0_28px_80px_var(--shadow)]">
          <span className="mx-auto mb-5 grid size-14 place-items-center rounded-full border border-[color-mix(in_srgb,var(--accent)_36%,transparent)] bg-app-accent-soft text-xl text-app-accent">
            {mastered ? "✓" : "↗"}
          </span>
          <p className="mb-2 text-[9px] font-bold uppercase tracking-[.2em] text-app-accent">
            Lesson complete
          </p>
          <h1 className="m-0 font-khmer text-[36px] font-medium">
            {mastered ? "អ្នកបានស្ទាត់មេរៀននេះ" : "ហាត់ម្ដងទៀតដើម្បីស្ទាត់"}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-app-dim">
            ភាពត្រឹមត្រូវរបស់អ្នកគឺ <strong className="text-app-accent">{completedAccuracy}%</strong>។
            ត្រូវការ {lesson.masteryAccuracy}% ដើម្បីសម្គាល់ថាស្ទាត់។
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <button
              className="cursor-pointer rounded-[10px] border border-app-line bg-app-surface px-4 py-2.5 text-xs text-app-soft transition-colors hover:text-app-accent"
              onClick={repeatLesson}
            >
              រៀនម្ដងទៀត
            </button>
            {nextLesson ? (
              <button
                className="cursor-pointer rounded-[10px] bg-app-accent px-4 py-2.5 text-xs font-semibold text-app-bg transition-[filter,transform] hover:brightness-110 active:translate-y-px"
                onClick={() => {
                  onCheckpoint({
                    lessonId: nextLesson.id,
                    lessonRevision: nextLesson.revision,
                    stepId: nextLesson.steps[0].id,
                    errors: 0,
                  });
                  navigate(`/learn/${nextLesson.id}`);
                }}
              >
                មេរៀនបន្ទាប់ →
              </button>
            ) : (
              <button
                className="cursor-pointer rounded-[10px] bg-app-accent px-4 py-2.5 text-xs font-semibold text-app-bg"
                onClick={() => navigate("/learn")}
              >
                មើលមេរៀនទាំងអស់
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="mx-auto w-[min(880px,100%)] animate-arrive"
      aria-label={`Lesson: ${lesson.title.km}`}
    >
      <div className="mb-6 flex items-start justify-between gap-5" data-focus-fade>
        <div className="flex items-start gap-3">
          <button
            className="mt-0.5 grid size-8 cursor-pointer place-items-center rounded-lg border border-app-line bg-app-surface text-app-dim transition-colors hover:text-app-accent"
            onClick={() => navigate("/learn")}
            aria-label="Back to lessons"
          >
            ←
          </button>
          <div>
            <p className="mb-1 text-[9px] font-bold uppercase tracking-[.18em] text-app-accent">
              Khmer NIDA · Lesson
            </p>
            <h1 className="m-0 font-khmer text-[28px] font-medium">{lesson.title.km}</h1>
            <p className="mb-0 mt-1 text-[11px] text-app-dim">{lesson.description.km}</p>
          </div>
        </div>
        <div className="min-w-24 text-right">
          <b className="text-lg font-medium text-app-accent [font-variant-numeric:tabular-nums]">
            {stepIndex + 1}
          </b>
          <small className="text-[10px] text-app-dim"> / {lesson.steps.length}</small>
          <div className="mt-2 h-1 overflow-hidden rounded bg-app-surface">
            <span
              className="block h-full bg-app-accent transition-[width] duration-300"
              style={{ width: `${((stepIndex + 1) / lesson.steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div
        className="group relative cursor-text rounded-[20px] border border-app-line bg-[color-mix(in_srgb,var(--bg-raised)_72%,transparent)] px-6 py-9 text-center shadow-[0_24px_70px_var(--shadow)] transition-[border-color] focus-within:border-[color-mix(in_srgb,var(--accent)_34%,transparent)] data-[status=incorrect]:border-[color-mix(in_srgb,var(--error)_42%,transparent)]"
        data-status={status}
        onClick={focusInput}
      >
        <small className="text-[9px] font-semibold uppercase tracking-[.17em] text-app-dim">
          Type this
        </small>
        <div className="my-5 min-h-[86px] font-khmer text-[clamp(48px,9vw,72px)] leading-[1.45] text-app-text [text-shadow:0_0_28px_var(--accent-soft)]">
          {step.prompt}
        </div>
        <div className="mx-auto min-h-9 w-[min(520px,100%)] border-b border-app-line pb-2 font-khmer text-[26px] text-app-accent">
          {input || <span className="text-app-dim opacity-30">…</span>}
        </div>
        <p className="mb-0 mt-3 min-h-5 text-[11px] text-app-dim" role="status" aria-live="polite">
          {status === "incorrect"
            ? stepErrors >= 2
              ? `${keyInstruction(activeHint)} — look for the highlighted key`
              : "មិនទាន់ត្រូវទេ — លុប ហើយសាកម្ដងទៀត"
            : keyInstruction(activeHint)}
        </p>
        <textarea
          ref={inputRef}
          className="absolute left-1/2 top-1/2 size-0.5 overflow-hidden whitespace-nowrap border-0 p-0 [clip-path:inset(50%)]"
          value={input}
          onInput={handleChange}
          onChange={() => undefined}
          onCompositionStart={() => {
            composingRef.current = true;
          }}
          onCompositionEnd={(event) => {
            composingRef.current = false;
            processInput(event.currentTarget.value);
          }}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label={`Type ${step.prompt}`}
        />
      </div>

      <div className="mt-6" data-help={stepErrors >= 2}>
        <div
          className="mb-4 flex flex-wrap items-center justify-center gap-1.5"
          aria-label={`Key sequence: ${step.keySequence.map(keyInstruction).join(", ")}`}
        >
          {step.keySequence.map((hint, index) => (
            <span
              key={`${hint.code}-${index}`}
              className="rounded-md border border-app-line bg-app-surface px-2 py-1 text-[10px] text-app-dim transition-[color,border-color,background] data-[active=true]:border-[color-mix(in_srgb,var(--accent)_48%,transparent)] data-[active=true]:bg-app-accent-soft data-[active=true]:text-app-accent"
              data-active={index === hintIndex}
            >
              {hint.altGr && <span className="mr-1 opacity-60">AltGr +</span>}
              {hint.shift && <span className="mr-1 opacity-60">Shift +</span>}
              {hint.key}
            </span>
          ))}
        </div>
        <NidaKeyboard active={activeHint} />
        <p className="hidden text-center text-[11px] leading-relaxed text-app-dim max-md:block">
          មេរៀនគ្រាប់ចុច NIDA ត្រូវបានរចនាសម្រាប់កុំព្យូទ័រដែលមានក្ដារចុច។ សូមបន្តលើអេក្រង់ធំដើម្បីមើលផែនទីគ្រាប់ចុច។
        </p>
      </div>
    </section>
  );
}

export function LessonPage(props: Omit<Parameters<typeof LessonSession>[0], "lesson">) {
  const { lessonId } = useParams();
  const lesson = getLesson(lessonId);
  if (!lesson) return <Navigate to="/learn" replace />;
  return <LessonSession key={lesson.id} lesson={lesson} {...props} />;
}
