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
import { commonKhmerWords, generateWords } from "../data/wordList";
import { khmerTextEngine } from "../engine/khmer";
import type { OrthographicCluster } from "../engine/types";
import type { TestResult } from "../storage/types";
import { calculateResult, createTypingState, typingReducer } from "../typing/reducer";
import type { TestSettings } from "../typing/types";

function createPrompt(settings: TestSettings, seed: number): OrthographicCluster[] {
  const count = settings.mode === "words" ? settings.modeValue : 90;
  const words = generateWords(commonKhmerWords, count, seed).map((word, index) =>
    settings.punctuation && index > 0 && (index + 1) % 12 === 0 ? `${word}។` : word,
  );
  return khmerTextEngine.segment(words.join(" "));
}

function playTick() {
  const AudioContextClass = window.AudioContext ??
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
  const prompt = useMemo(
    () => createPrompt(settings, seed),
    [seed, settings.mode, settings.modeValue, settings.punctuation],
  );
  const [typing, dispatch] = useReducer(typingReducer, prompt, createTypingState);
  const [result, setResult] = useState<TestResult | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const composingRef = useRef(false);
  const savingRef = useRef(false);
  const beforeInputRecordedRef = useRef(false);
  const lastSampledSecondRef = useRef(0);

  useEffect(() => {
    setResult(null);
    savingRef.current = false;
    lastSampledSecondRef.current = 0;
    dispatch({ type: "reset", prompt });
  }, [prompt]);

  useEffect(() => {
    if (typing.startedAt === null || typing.finished) return;
    const timer = window.setInterval(() => setClock(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, [typing.finished, typing.startedAt]);

  useEffect(() => {
    if (typing.startedAt === null || typing.finished) return;
    const elapsedSecond = Math.floor((clock - typing.startedAt) / 1_000);
    if (elapsedSecond <= lastSampledSecondRef.current) return;

    for (let second = lastSampledSecondRef.current + 1; second <= elapsedSecond; second += 1) {
      dispatch({ type: "sample", elapsedMs: second * 1_000 });
    }
    lastSampledSecondRef.current = elapsedSecond;
  }, [clock, typing.finished, typing.startedAt]);

  useEffect(() => {
    if (settings.mode !== "time" || typing.startedAt === null || typing.finished) return;
    if (clock - typing.startedAt >= settings.modeValue * 1_000) {
      dispatch({ type: "finish", at: typing.startedAt + settings.modeValue * 1_000 });
    }
  }, [clock, settings.mode, settings.modeValue, typing.finished, typing.startedAt]);

  useEffect(() => {
    if (!typing.finished || result || savingRef.current) return;
    savingRef.current = true;
    const completed = calculateResult(typing, settings.mode, settings.modeValue, Date.now());
    setResult(completed);
    onComplete(completed);
  }, [onComplete, result, settings.mode, settings.modeValue, typing]);

  const restart = useCallback(() => {
    const nextSeed = Date.now();
    const nextPrompt = createPrompt(settings, nextSeed);
    setSeed(nextSeed);
    setResult(null);
    savingRef.current = false;
    lastSampledSecondRef.current = 0;
    dispatch({ type: "reset", prompt: nextPrompt });
  }, [settings]);

  const processInput = useCallback((rawValue: string) => {
    if (typing.finished) return;
    let remaining = rawValue;
    let index = typing.currentIndex;

    while (remaining && index < typing.prompt.length) {
      const target = typing.prompt[index];
      const match = khmerTextEngine.compare(target, remaining);
      if (match === "correct") {
        dispatch({ type: "commit", attempt: remaining, correct: true });
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
        dispatch({ type: "commit", attempt: consumed, correct });
        if (correct && settings.sound && target.kind === "khmer") playTick();
        remaining = remaining.slice(first.end);
        index += 1;
        continue;
      }
      dispatch({ type: "pending", value: remaining, status: "incorrect" });
      break;
    }

    if (!remaining) dispatch({ type: "pending", value: "", status: "prefix" });
  }, [settings.sound, typing.currentIndex, typing.finished, typing.prompt]);

  const startTest = useCallback(() => {
    if (typing.startedAt !== null || typing.finished) return;
    const startedAt = Date.now();
    setClock(startedAt);
    dispatch({ type: "start", at: startedAt });
  }, [typing.finished, typing.startedAt]);

  const handleBeforeInput = useCallback((event: FormEvent<HTMLTextAreaElement>) => {
    const native = event.nativeEvent as InputEvent;
    if (native.inputType?.startsWith("insert") && !composingRef.current && !native.isComposing) {
      beforeInputRecordedRef.current = true;
      startTest();
      dispatch({ type: "keystrokes", count: Array.from(native.data ?? "").length || 1 });
    }
    if (native.inputType === "deleteContentBackward" && typing.pendingInput.length === 0) {
      event.preventDefault();
      dispatch({ type: "reopen" });
    }
  }, [startTest, typing.pendingInput.length]);

  const handleInput = useCallback((event: FormEvent<HTMLTextAreaElement>) => {
    const value = event.currentTarget.value;
    if (composingRef.current) {
      dispatch({ type: "pending", value, status: "prefix" });
      return;
    }
    if (value) {
      startTest();
      if (!beforeInputRecordedRef.current) {
        const native = event.nativeEvent as InputEvent;
        dispatch({ type: "keystrokes", count: Array.from(native.data ?? "").length || 1 });
      }
    }
    beforeInputRecordedRef.current = false;
    processInput(value);
  }, [processInput, startTest]);

  const handleCompositionStart = useCallback(() => {
    composingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback((event: FormEvent<HTMLTextAreaElement>) => {
    composingRef.current = false;
    if (event.currentTarget.value) {
      startTest();
      dispatch({ type: "keystrokes", count: Array.from(event.currentTarget.value).length });
    }
    beforeInputRecordedRef.current = false;
    processInput(event.currentTarget.value);
  }, [processInput, startTest]);

  const handleKeyDown = useCallback((event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === "Backspace" &&
      !composingRef.current &&
      typing.pendingInput.length === 0 &&
      typing.currentIndex > 0
    ) {
      // Empty text controls do not consistently emit beforeinput for Backspace.
      event.preventDefault();
      dispatch({ type: "reopen" });
      return;
    }
    if (event.key === "Enter") event.preventDefault();
  }, [typing.currentIndex, typing.pendingInput.length]);

  const elapsedMs = typing.startedAt === null ? 0 : Math.max(0, (typing.endedAt ?? clock) - typing.startedAt);
  const remainingSeconds = settings.mode === "time"
    ? Math.max(0, Math.ceil(settings.modeValue - elapsedMs / 1_000))
    : null;
  const liveCpm = typing.startedAt === null || elapsedMs < 1_000
    ? 0
    : Math.round(typing.correctClusters / (elapsedMs / 60_000));
  const liveWpm = typing.startedAt === null || elapsedMs < 1_000
    ? 0
    : Math.round((typing.correctCodePoints / 5) / (elapsedMs / 60_000));

  return {
    handleBeforeInput,
    handleCompositionEnd,
    handleCompositionStart,
    handleInput,
    handleKeyDown,
    liveSpeed: settings.speedUnit === "cpm" ? liveCpm : liveWpm,
    remainingSeconds,
    restart,
    result,
    typing,
  };
}

export type TypingSession = ReturnType<typeof useTypingSession>;
