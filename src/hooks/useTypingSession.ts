import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { khmerTextEngine } from "../engine/khmer";
import type { TestResult } from "../storage/types";
import { countInsertedInputErrors, getInputDelta } from "../typing/input";
import { createTypingPrompt } from "../typing/prompt";
import { calculateResult, createTypingState, typingReducer } from "../typing/reducer";
import type { TestSettings } from "../typing/types";

function playTick() {
  const AudioContextClass =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = 520;
  gain.gain.setValueAtTime(0.035, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.045);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.05);
  oscillator.addEventListener("ended", () => context.close());
}

export function useTypingSession(settings: TestSettings, onComplete: (result: TestResult) => void) {
  const [seed, setSeed] = useState(() => Date.now());
  const promptSettingsKey = `${settings.mode}:${settings.modeValue}:${settings.punctuation}:${settings.wordDifficulty}`;
  const prompt = useMemo(
    () => createTypingPrompt(settings, seed),
    [seed, settings.mode, settings.modeValue, settings.punctuation, settings.wordDifficulty],
  );
  const [typing, dispatch] = useReducer(typingReducer, prompt, createTypingState);
  const [result, setResult] = useState<TestResult | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const composingRef = useRef(false);
  const compositionStartValueRef = useRef("");
  const savingRef = useRef(false);
  const promptSettingsKeyRef = useRef(promptSettingsKey);

  useEffect(() => {
    if (promptSettingsKeyRef.current === promptSettingsKey) return;
    promptSettingsKeyRef.current = promptSettingsKey;
    setSeed((current) => current + Date.now() + 1);
  }, [promptSettingsKey]);

  useEffect(() => {
    setResult(null);
    savingRef.current = false;
    dispatch({ type: "reset", prompt });
  }, [prompt]);

  useEffect(() => {
    if (typing.startedAt === null || typing.finished) return;
    const timer = window.setInterval(() => setClock(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, [typing.finished, typing.startedAt]);

  useEffect(() => {
    if (settings.mode !== "time" || typing.startedAt === null || typing.finished) return;
    if (clock - typing.startedAt >= settings.modeValue * 1_000) {
      dispatch({ type: "finish", at: typing.startedAt + settings.modeValue * 1_000 });
    }
  }, [clock, settings.mode, settings.modeValue, typing.finished, typing.startedAt]);

  useEffect(() => {
    if (!typing.finished || result || savingRef.current) return;
    savingRef.current = true;
    const completed = calculateResult(
      typing,
      settings.mode,
      settings.modeValue,
      Date.now(),
      settings.wordDifficulty,
    );
    setResult(completed);
    onComplete(completed);
  }, [onComplete, result, settings.mode, settings.modeValue, settings.wordDifficulty, typing]);

  const restart = useCallback(() => {
    const nextSeed = Date.now();
    const nextPrompt = createTypingPrompt(settings, nextSeed);
    setSeed(nextSeed);
    setResult(null);
    savingRef.current = false;
    dispatch({ type: "reset", prompt: nextPrompt });
  }, [settings]);

  const processInput = useCallback(
    (rawValue: string, at: number) => {
      if (typing.finished) return;
      let remaining = rawValue;
      let index = typing.currentIndex;

      while (remaining && index < typing.prompt.length) {
        const target = typing.prompt[index];
        const match = khmerTextEngine.compare(target, remaining);
        if (match === "correct") {
          dispatch({ type: "commit", at, attempt: remaining, correct: true });
          if (settings.sound && target.kind === "khmer") playTick();
          remaining = "";
          index += 1;
          break;
        }
        if (match === "prefix") {
          dispatch({ type: "pending", value: remaining, status: "prefix" });
          break;
        }

        const attempts = khmerTextEngine.segment(remaining);
        if (attempts.length > 1) {
          const first = attempts[0];
          const consumed = remaining.slice(0, first.end);
          const firstMatch = khmerTextEngine.compare(target, consumed);
          const correct = firstMatch === "correct";
          dispatch({ type: "commit", at, attempt: consumed, correct });
          if (correct && settings.sound && target.kind === "khmer") playTick();
          remaining = remaining.slice(first.end);
          index += 1;
          continue;
        }
        dispatch({ type: "pending", value: remaining, status: "incorrect" });
        break;
      }

      if (!remaining) dispatch({ type: "pending", value: "", status: "prefix" });
    },
    [settings.sound, typing.currentIndex, typing.finished, typing.prompt],
  );

  const startTest = useCallback(
    (at = Date.now()) => {
      if (typing.startedAt !== null || typing.finished) return;
      setClock(at);
      dispatch({ type: "start", at });
    },
    [typing.finished, typing.startedAt],
  );

  const recordInputChange = useCallback(
    (previousValue: string, nextValue: string, at: number) => {
      const delta = getInputDelta(previousValue, nextValue);
      if (delta.inserted.length === 0 && delta.deletedUnits === 0) return;
      dispatch({
        type: "input",
        at,
        insertedUnits: delta.inserted.length,
        errorUnits: countInsertedInputErrors(
          typing.prompt,
          typing.currentIndex,
          delta.retainedPrefix,
          delta.inserted,
        ),
        correctionUnits: delta.deletedUnits,
      });
    },
    [typing.currentIndex, typing.prompt],
  );

  const handleBeforeInput = useCallback(
    (event: FormEvent<HTMLTextAreaElement>) => {
      const native = event.nativeEvent as InputEvent;
      if (native.inputType === "deleteContentBackward" && typing.pendingInput.length === 0) {
        event.preventDefault();
        const at = Date.now();
        dispatch({ type: "input", at, insertedUnits: 0, errorUnits: 0, correctionUnits: 1 });
        dispatch({ type: "reopen", at });
      }
    },
    [typing.pendingInput.length],
  );

  const handleInput = useCallback(
    (event: FormEvent<HTMLTextAreaElement>) => {
      const value = event.currentTarget.value;
      if (composingRef.current) {
        dispatch({ type: "pending", value, status: "prefix" });
        return;
      }
      const at = Date.now();
      if (value) {
        startTest(at);
      }
      recordInputChange(typing.pendingInput, value, at);
      processInput(value, at);
    },
    [processInput, recordInputChange, startTest, typing.pendingInput],
  );

  const handleCompositionStart = useCallback((event: FormEvent<HTMLTextAreaElement>) => {
    composingRef.current = true;
    compositionStartValueRef.current = event.currentTarget.value;
  }, []);

  const handleCompositionEnd = useCallback(
    (event: FormEvent<HTMLTextAreaElement>) => {
      composingRef.current = false;
      const at = Date.now();
      if (event.currentTarget.value) {
        startTest(at);
      }
      recordInputChange(compositionStartValueRef.current, event.currentTarget.value, at);
      processInput(event.currentTarget.value, at);
    },
    [processInput, recordInputChange, startTest],
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
      if (
        event.key === "Backspace" &&
        !composingRef.current &&
        typing.pendingInput.length === 0 &&
        typing.currentIndex > 0
      ) {
        // Empty text controls do not consistently emit beforeinput for Backspace.
        event.preventDefault();
        const at = Date.now();
        dispatch({ type: "input", at, insertedUnits: 0, errorUnits: 0, correctionUnits: 1 });
        dispatch({ type: "reopen", at });
        return;
      }
      if (event.key === "Enter") event.preventDefault();
    },
    [typing.currentIndex, typing.pendingInput.length],
  );

  const elapsedMs =
    typing.startedAt === null ? 0 : Math.max(0, (typing.endedAt ?? clock) - typing.startedAt);
  const remainingSeconds =
    settings.mode === "time"
      ? Math.max(0, Math.ceil(settings.modeValue - elapsedMs / 1_000))
      : null;
  return {
    handleBeforeInput,
    handleCompositionEnd,
    handleCompositionStart,
    handleInput,
    handleKeyDown,
    remainingSeconds,
    restart,
    result,
    typing,
  };
}

export type TypingSession = ReturnType<typeof useTypingSession>;
