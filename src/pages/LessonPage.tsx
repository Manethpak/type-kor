import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { NidaKeyboard } from "../components/NidaKeyboard";
import { getLesson, getNextLesson } from "../learning/curriculum";
import { createLessonSessionState, lessonSessionReducer } from "../learning/lessonSession";
import { LESSON_EXERCISE_LENGTH } from "../learning/lessonExercise";
import { keyInstruction } from "../learning/nida";
import type { LearningState, Lesson, LessonCheckpoint } from "../learning/types";
import { khmerTextEngine } from "../engine/khmer";
import { getAltGrModifierLabel } from "../utils/platform";

function activeHintIndex(lesson: Lesson, stepIndex: number, input: string): number {
  const step = lesson.steps[stepIndex];
  if (step.kind === "key") return 0;
  const hints = step.keySequence;
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
  const altGrModifierLabel = getAltGrModifierLabel();
  const navigate = useNavigate();
  const resumed =
    learningState.checkpoint?.lessonId === lesson.id ? learningState.checkpoint : null;
  const resumedStepIndex = resumed
    ? lesson.steps.findIndex((step) => step.id === resumed.stepId)
    : -1;
  const [session, dispatch] = useReducer(
    lessonSessionReducer,
    createLessonSessionState(resumedStepIndex >= 0 ? resumedStepIndex : 0, resumed?.errors ?? 0),
  );
  const [keyboardVisible, setKeyboardVisible] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingAreaRef = useRef<HTMLDivElement>(null);
  const primaryActionRef = useRef<HTMLButtonElement>(null);
  const composingRef = useRef(false);
  const checkpointInitializedRef = useRef(false);
  const nextLesson = getNextLesson(lesson.id);

  const focusInput = useCallback(() => inputRef.current?.focus({ preventScroll: true }), []);

  const step = lesson.steps[session.stepIndex];
  const exerciseStartIndex = lesson.steps.findIndex((item) => item.review);
  const exerciseItem = step.review ? session.stepIndex - exerciseStartIndex + 1 : null;

  useEffect(() => {
    if (session.completedAccuracy !== null || step.kind === "key") return;
    focusInput();
  }, [focusInput, lesson.id, session.completedAccuracy, step.id, step.kind]);

  useEffect(() => {
    const blurInputOutsideTypingArea = (event: PointerEvent) => {
      const input = inputRef.current;
      const target = event.target;
      if (
        !input ||
        input !== document.activeElement ||
        !(target instanceof Node) ||
        typingAreaRef.current?.contains(target)
      ) {
        return;
      }
      input.blur();
    };

    document.addEventListener("pointerdown", blurInputOutsideTypingArea, true);
    return () => document.removeEventListener("pointerdown", blurInputOutsideTypingArea, true);
  }, []);

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

  const hintIndex = useMemo(
    () => (step ? activeHintIndex(lesson, session.stepIndex, session.input) : 0),
    [lesson, session.input, session.stepIndex, step],
  );
  const activeHint = step?.keySequence[hintIndex];

  const completeStep = useCallback(() => {
    const nextStep = session.stepIndex + 1;
    if (nextStep >= lesson.steps.length) {
      const accuracy = Math.round(
        (lesson.steps.length / (lesson.steps.length + session.errors)) * 100,
      );
      dispatch({ type: "lessonCompleted", accuracy });
      onComplete(lesson.id, accuracy);
      return;
    }
    dispatch({ type: "stepCompleted", stepIndex: nextStep });
    onCheckpoint({
      lessonId: lesson.id,
      lessonRevision: lesson.revision,
      stepId: lesson.steps[nextStep].id,
      errors: session.errors,
    });
  }, [
    lesson.id,
    lesson.revision,
    lesson.steps,
    onCheckpoint,
    onComplete,
    session.errors,
    session.stepIndex,
  ]);

  const processInput = useCallback(
    (nextInput: string) => {
      if (step.kind !== "typing" || session.completedAccuracy !== null) return;
      const attempt = khmerTextEngine.canonicalize(nextInput);
      const target = khmerTextEngine.canonicalize(step.prompt);

      if (attempt === target) {
        completeStep();
        return;
      }

      if (!attempt || target.startsWith(attempt)) {
        dispatch({ type: "inputChanged", input: nextInput, status: "prefix" });
        return;
      }

      const nextErrors = session.errors + 1;
      dispatch({ type: "inputChanged", input: nextInput, status: "incorrect" });
      onCheckpoint({
        lessonId: lesson.id,
        lessonRevision: lesson.revision,
        stepId: step.id,
        errors: nextErrors,
      });
    },
    [
      lesson.id,
      completeStep,
      onCheckpoint,
      session.completedAccuracy,
      session.errors,
      session.stepIndex,
      step,
    ],
  );

  useEffect(() => {
    if (step.kind !== "key" || session.completedAccuracy !== null) return;
    const handleKeyDrill = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        event.isComposing ||
        event.metaKey ||
        /^(Shift|Alt|Control)/u.test(event.key)
      ) {
        return;
      }
      event.preventDefault();
      const altGr = event.getModifierState("AltGraph") || event.altKey;
      const layerMatches = step.target.altGr
        ? altGr && !event.shiftKey
        : step.target.shift
          ? event.shiftKey && !altGr
          : !event.shiftKey && !altGr;
      if (event.code === step.target.code && layerMatches) {
        completeStep();
        return;
      }
      const nextErrors = session.errors + 1;
      dispatch({ type: "inputChanged", input: "", status: "incorrect" });
      onCheckpoint({
        lessonId: lesson.id,
        lessonRevision: lesson.revision,
        stepId: step.id,
        errors: nextErrors,
      });
    };
    window.addEventListener("keydown", handleKeyDrill);
    return () => window.removeEventListener("keydown", handleKeyDrill);
  }, [
    completeStep,
    lesson.id,
    lesson.revision,
    onCheckpoint,
    session.completedAccuracy,
    session.errors,
    step,
  ]);

  const handleChange = (event: FormEvent<HTMLTextAreaElement>) => {
    const value = event.currentTarget.value;
    if (composingRef.current) {
      dispatch({ type: "inputChanged", input: value, status: "prefix" });
      return;
    }
    processInput(value);
  };

  const repeatLesson = useCallback(() => {
    dispatch({ type: "restart" });
    onCheckpoint({
      lessonId: lesson.id,
      lessonRevision: lesson.revision,
      stepId: lesson.steps[0].id,
      errors: 0,
    });
  }, [lesson.id, lesson.revision, lesson.steps, onCheckpoint]);

  const continueLesson = useCallback(() => {
    if (!nextLesson) {
      navigate("/learn");
      return;
    }

    onCheckpoint({
      lessonId: nextLesson.id,
      lessonRevision: nextLesson.revision,
      stepId: nextLesson.steps[0].id,
      errors: 0,
    });
    navigate(`/learn/${nextLesson.id}`);
  }, [navigate, nextLesson, onCheckpoint]);

  useEffect(() => {
    if (session.completedAccuracy === null) return;
    primaryActionRef.current?.focus({ preventScroll: true });

    const handleCompletionShortcut = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return;
      }

      const target = event.target;
      const isTextEntryTarget =
        target instanceof HTMLElement &&
        (target.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName));
      const isInteractiveTarget =
        isTextEntryTarget || (target instanceof HTMLElement && /^(BUTTON|A)$/.test(target.tagName));

      if (event.code === "KeyR" && !isTextEntryTarget) {
        event.preventDefault();
        repeatLesson();
        return;
      }

      if (event.key === "Enter" && !isInteractiveTarget) {
        event.preventDefault();
        continueLesson();
      }
    };

    window.addEventListener("keydown", handleCompletionShortcut);
    return () => window.removeEventListener("keydown", handleCompletionShortcut);
  }, [continueLesson, repeatLesson, session.completedAccuracy]);

  if (session.completedAccuracy !== null) {
    const mastered = session.completedAccuracy >= lesson.masteryAccuracy;
    return (
      <section
        className="mx-auto w-[min(760px,100%)] animate-arrive text-center"
        aria-label="Lesson complete"
      >
        <div className="rounded-[22px] border border-app-line bg-[color-mix(in_srgb,var(--bg-raised)_90%,transparent)] px-7 py-12 shadow-[0_28px_80px_var(--shadow)]">
          <span className="mx-auto mb-5 grid size-14 place-items-center rounded-full border border-[color-mix(in_srgb,var(--accent)_36%,transparent)] bg-app-accent-soft text-xl text-app-accent">
            {mastered ? "✓" : "↗"}
          </span>
          <p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-app-accent">
            Lesson complete
          </p>
          <h1 className="m-0 font-khmer text-3xl font-medium">
            {mastered ? "អ្នកស្ទាត់មេរៀននេះហើយ" : "ហាត់បន្ថែមទៀត"}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-app-dim">
            ភាពត្រឹមត្រូវរបស់អ្នកបាន{" "}
            <strong className="text-app-accent">{session.completedAccuracy}%</strong>។ ត្រូវការ{" "}
            <span className="text-app-text">{lesson.masteryAccuracy}% </span>
            ឡ់ើងដើម្បីកាន់តែស្ទាត់ច្បាស់។
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <button
              className="cursor-pointer rounded-[10px] border border-app-line bg-app-surface px-4 py-2.5 text-xs text-app-soft transition-colors hover:text-app-accent"
              onClick={repeatLesson}
              type="button"
            >
              រៀនម្ដងទៀត
              <kbd className="ml-2 rounded border border-app-line px-1.5 py-0.5 font-ui text-xs uppercase">
                R
              </kbd>
            </button>
            {nextLesson ? (
              <button
                ref={primaryActionRef}
                className="cursor-pointer rounded-[10px] bg-app-accent px-4 py-2.5 text-xs font-semibold text-app-bg transition-[filter,transform] hover:brightness-110 active:translate-y-px"
                onClick={continueLesson}
                type="button"
              >
                មេរៀនបន្ទាប់ →
                <kbd className="ml-2 rounded border border-[color-mix(in_srgb,var(--bg)_38%,transparent)] px-1.5 py-0.5 font-ui text-xs uppercase">
                  Enter
                </kbd>
              </button>
            ) : (
              <button
                ref={primaryActionRef}
                className="cursor-pointer rounded-[10px] bg-app-accent px-4 py-2.5 text-xs font-semibold text-app-bg"
                onClick={continueLesson}
                type="button"
              >
                មើលមេរៀនទាំងអស់
                <kbd className="ml-2 rounded border border-[color-mix(in_srgb,var(--bg)_38%,transparent)] px-1.5 py-0.5 font-ui text-xs uppercase">
                  Enter
                </kbd>
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
            <h1 className="m-0 font-khmer text-3xl font-medium">{lesson.title.km}</h1>
            <p className="mb-0 mt-1 text-sm text-app-soft">{lesson.description.km}</p>
          </div>
        </div>
        <div className="min-w-24 text-right">
          <b className="text-lg font-medium text-app-accent [font-variant-numeric:tabular-nums]">
            {session.stepIndex + 1}
          </b>
          <small className="text-xs text-app-dim"> / {lesson.steps.length}</small>
          <div className="mt-2 h-1 overflow-hidden rounded bg-app-surface">
            <span
              className="block h-full bg-app-accent transition-[width] duration-300"
              style={{ width: `${((session.stepIndex + 1) / lesson.steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div
        ref={typingAreaRef}
        className="group relative rounded-[20px] border border-app-line bg-[color-mix(in_srgb,var(--bg-raised)_72%,transparent)] px-6 py-9 text-center shadow-[0_24px_70px_var(--shadow)] transition-[border-color,background-color,box-shadow] focus-within:border-[color-mix(in_srgb,var(--accent)_34%,transparent)] data-[status=incorrect]:border-app-error data-[status=incorrect]:bg-[color-mix(in_srgb,var(--error)_5%,var(--bg-raised))] data-[status=incorrect]:shadow-[0_0_0_3px_color-mix(in_srgb,var(--error)_14%,transparent),0_24px_70px_var(--shadow)] data-[typing=true]:cursor-text"
        data-status={session.status}
        data-typing={step.kind === "typing"}
        onClick={step.kind === "typing" ? focusInput : undefined}
      >
        <small className="text-xs font-semibold uppercase tracking-widest text-app-dim">
          {exerciseItem
            ? `លំហាត់ចុងមេរៀន · ${exerciseItem} / ${LESSON_EXERCISE_LENGTH}`
            : step.kind === "typing"
              ? "Type this"
              : "Press this key"}
        </small>
        <div className="my-5 min-h-28 font-khmer text-5xl leading-[1.45] text-app-text [text-shadow:0_0_28px_var(--accent-soft)] sm:text-6xl md:text-7xl">
          {step.kind === "typing" ? step.prompt : step.label.km}
        </div>
        {step.kind === "typing" ? (
          <div className="mx-auto min-h-9 w-[min(520px,100%)] border-b border-app-line pb-2 font-khmer text-3xl text-app-accent transition-colors group-data-[status=incorrect]:border-app-error group-data-[status=incorrect]:text-app-error">
            {session.input || <span className="text-app-dim opacity-30">…</span>}
          </div>
        ) : (
          <div className="mx-auto min-h-9 w-[min(520px,100%)] border-b border-app-line pb-2 text-xs text-app-dim">
            {step.label.en}
          </div>
        )}
        <div className="mt-3">
          <div
            className="flex flex-wrap items-center justify-center gap-1.5"
            aria-label={`Key sequence: ${step.keySequence
              .map((hint) => keyInstruction(hint, altGrModifierLabel))
              .join(", ")}`}
          >
            {step.keySequence.map((hint, index) => (
              <span
                key={`${hint.code}-${index}`}
                className="rounded-md border border-app-line bg-app-surface px-2 py-1 text-xs text-app-dim transition-[color,border-color,background] data-[active=true]:border-[color-mix(in_srgb,var(--accent)_48%,transparent)] data-[active=true]:bg-app-accent-soft data-[active=true]:text-app-accent"
                data-active={index === hintIndex}
              >
                {hint.altGr && <span className="mr-1 opacity-60">{altGrModifierLabel} +</span>}
                {hint.shift && <span className="mr-1 opacity-60">Shift +</span>}
                {hint.key}
              </span>
            ))}
          </div>
          <div className="mx-auto mt-4 h-20 max-w-lg sm:h-20">
            {session.status === "incorrect" ? (
              <div
                key={session.errors}
                className="flex h-full animate-error-nudge items-center gap-3 rounded-xl border border-[color-mix(in_srgb,var(--error)_52%,transparent)] bg-[color-mix(in_srgb,var(--error)_13%,transparent)] px-4 py-3 text-left text-app-error shadow-[0_8px_24px_color-mix(in_srgb,var(--error)_10%,transparent)]"
                role="alert"
              >
                <span
                  className="grid size-7 shrink-0 place-items-center rounded-full bg-app-error font-ui text-sm font-bold text-app-bg"
                  aria-hidden="true"
                >
                  !
                </span>
                <span className="min-w-0 text-xs leading-relaxed">
                  <strong className="block font-khmer text-sm">មានកំហុស</strong>
                  {session.stepErrors >= 2
                    ? `${keyInstruction(activeHint, altGrModifierLabel)} · មើលគ្រាប់ចុចដែលបានបន្លិច។`
                    : "លុបតួអក្សរខុស រួចសាកម្ដងទៀត។"}
                </span>
              </div>
            ) : (
              <></>
            )}
          </div>
        </div>
        {step.kind === "typing" && (
          <textarea
            ref={inputRef}
            className="absolute left-1/2 top-1/2 size-0.5 overflow-hidden whitespace-nowrap border-0 p-0 [clip-path:inset(50%)]"
            value={session.input}
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
        )}
      </div>

      <div className="mt-6" data-help={session.stepErrors >= 2}>
        <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
          <button
            className="cursor-pointer rounded-md border border-app-line bg-app-raised px-2.5 py-1 text-xs font-semibold text-app-dim transition-[color,border-color,background] hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)] hover:text-app-accent"
            type="button"
            aria-controls="lesson-nida-keyboard"
            aria-expanded={keyboardVisible}
            onClick={() => setKeyboardVisible((visible) => !visible)}
          >
            {keyboardVisible ? "Hide keyboard" : "Show keyboard"}
          </button>
        </div>

        <div id="lesson-nida-keyboard" hidden={!keyboardVisible}>
          {keyboardVisible && (
            <>
              <NidaKeyboard active={activeHint} mode="follow" />
              <p className="hidden text-center text-xs leading-relaxed text-app-dim max-md:block">
                សូមប្រើប្រាស់នៅលើអេក្រង់ធំ​ឬ​កុំព្យូទ័រដែលមានក្ដារចុច។
              </p>
            </>
          )}
        </div>
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
