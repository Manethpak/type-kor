import type { OrthographicCluster } from "../engine/types";
import type { PerformanceSample, TestResult } from "../storage/types";
import type { TypingAction, TypingState } from "./types";

export function createTypingState(prompt: OrthographicCluster[]): TypingState {
  return {
    prompt,
    states: prompt.map(() => "pending"),
    attempts: prompt.map(() => ""),
    currentIndex: 0,
    pendingInput: "",
    pendingStatus: "prefix",
    startedAt: null,
    endedAt: null,
    correctClusters: 0,
    correctCodePoints: 0,
    incorrectClusters: 0,
    rawKeystrokes: 0,
    timeline: [],
    finished: false,
  };
}

export function typingReducer(state: TypingState, action: TypingAction): TypingState {
  switch (action.type) {
    case "start":
      return state.startedAt === null ? { ...state, startedAt: action.at } : state;
    case "keystrokes":
      return { ...state, rawKeystrokes: state.rawKeystrokes + action.count };
    case "pending":
      return { ...state, pendingInput: action.value, pendingStatus: action.status };
    case "commit": {
      if (state.finished || state.currentIndex >= state.prompt.length) return state;
      const states = [...state.states];
      const attempts = [...state.attempts];
      states[state.currentIndex] = action.correct ? "correct" : "incorrect";
      attempts[state.currentIndex] = action.attempt;
      const cluster = state.prompt[state.currentIndex];
      const scored = cluster.kind === "khmer";
      const codePoints = Array.from(cluster.comparisonKey).length;
      const currentIndex = state.currentIndex + 1;
      return {
        ...state,
        states,
        attempts,
        currentIndex,
        pendingInput: "",
        pendingStatus: "prefix",
        correctClusters: state.correctClusters + (scored && action.correct ? 1 : 0),
        correctCodePoints: state.correctCodePoints + (action.correct ? codePoints : 0),
        incorrectClusters: state.incorrectClusters + (scored && !action.correct ? 1 : 0),
        finished: currentIndex >= state.prompt.length,
      };
    }
    case "reopen": {
      if (state.currentIndex === 0 || state.pendingInput.length > 0) return state;
      const currentIndex = state.currentIndex - 1;
      const states = [...state.states];
      const attempts = [...state.attempts];
      const previousState = states[currentIndex];
      const scored = state.prompt[currentIndex].kind === "khmer";
      const previousAttempt = attempts[currentIndex];
      const codePoints = Array.from(state.prompt[currentIndex].comparisonKey).length;
      states[currentIndex] = "pending";
      attempts[currentIndex] = "";
      return {
        ...state,
        states,
        attempts,
        currentIndex,
        pendingInput: Array.from(previousAttempt).slice(0, -1).join(""),
        pendingStatus: "prefix",
        correctClusters: state.correctClusters - (scored && previousState === "correct" ? 1 : 0),
        correctCodePoints: state.correctCodePoints - (previousState === "correct" ? codePoints : 0),
        incorrectClusters: state.incorrectClusters - (scored && previousState === "incorrect" ? 1 : 0),
        finished: false,
        endedAt: null,
      };
    }
    case "sample": {
      const elapsedMs = Math.max(1, Math.round(action.elapsedMs));
      const previous = state.timeline.at(-1);
      if (previous && previous.elapsedMs >= elapsedMs) return state;
      return { ...state, timeline: [...state.timeline, createPerformanceSample(state, elapsedMs, previous)] };
    }
    case "finish":
      return state.finished && state.endedAt !== null ? state : { ...state, finished: true, endedAt: action.at };
    case "reset":
      return createTypingState(action.prompt);
  }
}

export function createPerformanceSample(
  state: Pick<TypingState, "correctClusters" | "correctCodePoints" | "incorrectClusters" | "rawKeystrokes">,
  elapsedMs: number,
  previous?: PerformanceSample,
): PerformanceSample {
  const safeElapsed = Math.max(1, elapsedMs);
  const attempts = state.correctClusters + state.incorrectClusters;
  const deltaMs = Math.max(1, safeElapsed - (previous?.elapsedMs ?? 0));
  const deltaCorrect = Math.max(0, state.correctClusters - (previous?.correctClusters ?? 0));
  const deltaCodePoints = Math.max(0, state.correctCodePoints - (previous?.correctCodePoints ?? 0));
  return {
    second: Math.max(1, Math.ceil(safeElapsed / 1_000)),
    elapsedMs: safeElapsed,
    cpm: Math.round(state.correctClusters / (safeElapsed / 60_000)),
    burstCpm: Math.round(deltaCorrect / (deltaMs / 60_000)),
    wpm: Math.round((state.correctCodePoints / 5) / (safeElapsed / 60_000)),
    burstWpm: Math.round((deltaCodePoints / 5) / (deltaMs / 60_000)),
    accuracy: attempts === 0 ? 100 : Math.round(state.correctClusters / attempts * 100),
    correctClusters: state.correctClusters,
    correctCodePoints: state.correctCodePoints,
    incorrectClusters: state.incorrectClusters,
    rawKeystrokes: state.rawKeystrokes,
  };
}

export function calculateResult(
  state: TypingState,
  mode: "time" | "words",
  modeValue: number,
  now: number,
): TestResult {
  const startedAt = state.startedAt ?? now;
  const endedAt = state.endedAt ?? now;
  const durationMs = Math.max(1, endedAt - startedAt);
  const attempts = state.correctClusters + state.incorrectClusters;
  const timeline = [...state.timeline];
  const previousSample = timeline.at(-1);
  if (!previousSample || previousSample.elapsedMs < durationMs) {
    timeline.push(createPerformanceSample(state, durationMs, previousSample));
  }
  return {
    id: `${new Date(startedAt).toISOString()}-${Math.random().toString(36).slice(2, 8)}`,
    startedAt: new Date(startedAt).toISOString(),
    mode,
    modeValue,
    durationMs,
    clustersPerMinute: Math.round(state.correctClusters / (durationMs / 60_000)),
    wordsPerMinute: Math.round((state.correctCodePoints / 5) / (durationMs / 60_000)),
    accuracy: attempts === 0 ? 100 : Math.round(state.correctClusters / attempts * 100),
    correctClusters: state.correctClusters,
    correctCodePoints: state.correctCodePoints,
    incorrectClusters: state.incorrectClusters,
    rawKeystrokes: state.rawKeystrokes,
    timeline,
  };
}
