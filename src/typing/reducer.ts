import type { OrthographicCluster } from "../engine/types";
import type { WordDifficultySelection } from "../data/wordList";
import type { PerformanceSample, TestResult } from "../storage/types";
import type { TypingAction, TypingAnalyticsEvent, TypingState } from "./types";

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
    insertedUnits: 0,
    errorUnits: 0,
    correctionUnits: 0,
    clusterAttempts: 0,
    analyticsEvents: [],
    finished: false,
  };
}

function analyticsEvent(
  state: TypingState,
  at: number,
  values: Partial<Omit<TypingAnalyticsEvent, "elapsedMs">>,
): TypingAnalyticsEvent {
  return {
    elapsedMs: Math.max(0, at - (state.startedAt ?? at)),
    insertedUnits: 0,
    errorUnits: 0,
    correctionUnits: 0,
    correctClustersDelta: 0,
    correctCodePointsDelta: 0,
    incorrectClustersDelta: 0,
    clusterAttemptsDelta: 0,
    ...values,
  };
}

export function typingReducer(state: TypingState, action: TypingAction): TypingState {
  switch (action.type) {
    case "start":
      return state.startedAt === null ? { ...state, startedAt: action.at } : state;
    case "input": {
      const insertedUnits = Math.max(0, action.insertedUnits);
      const errorUnits = Math.min(insertedUnits, Math.max(0, action.errorUnits));
      const correctionUnits = Math.max(0, action.correctionUnits);
      if (insertedUnits === 0 && correctionUnits === 0) return state;
      return {
        ...state,
        rawKeystrokes: state.rawKeystrokes + insertedUnits,
        insertedUnits: state.insertedUnits + insertedUnits,
        errorUnits: state.errorUnits + errorUnits,
        correctionUnits: state.correctionUnits + correctionUnits,
        analyticsEvents: [
          ...state.analyticsEvents,
          analyticsEvent(state, action.at, { insertedUnits, errorUnits, correctionUnits }),
        ],
      };
    }
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
        clusterAttempts: state.clusterAttempts + (scored ? 1 : 0),
        analyticsEvents: [
          ...state.analyticsEvents,
          analyticsEvent(state, action.at, {
            correctClustersDelta: scored && action.correct ? 1 : 0,
            correctCodePointsDelta: action.correct ? codePoints : 0,
            incorrectClustersDelta: scored && !action.correct ? 1 : 0,
            clusterAttemptsDelta: scored ? 1 : 0,
          }),
        ],
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
        incorrectClusters:
          state.incorrectClusters - (scored && previousState === "incorrect" ? 1 : 0),
        analyticsEvents: [
          ...state.analyticsEvents,
          analyticsEvent(state, action.at, {
            correctClustersDelta: scored && previousState === "correct" ? -1 : 0,
            correctCodePointsDelta: previousState === "correct" ? -codePoints : 0,
            incorrectClustersDelta: scored && previousState === "incorrect" ? -1 : 0,
          }),
        ],
        finished: false,
        endedAt: null,
      };
    }
    case "finish":
      return state.finished && state.endedAt !== null
        ? state
        : { ...state, finished: true, endedAt: action.at };
    case "reset":
      return createTypingState(action.prompt);
  }
}

function buildTimeline(events: TypingAnalyticsEvent[], durationMs: number): PerformanceSample[] {
  const sampleTimes: number[] = [];
  for (let elapsedMs = 1_000; elapsedMs < durationMs; elapsedMs += 1_000) {
    sampleTimes.push(elapsedMs);
  }
  sampleTimes.push(durationMs);

  let eventIndex = 0;
  let previousElapsedMs = 0;
  let previousClusterAttempts = 0;
  let previousInsertedUnits = 0;
  let correctClusters = 0;
  let correctCodePoints = 0;
  let incorrectClusters = 0;
  let clusterAttempts = 0;
  let insertedUnits = 0;
  let errorUnits = 0;
  let correctionUnits = 0;

  return sampleTimes.map((elapsedMs, index) => {
    while (eventIndex < events.length && events[eventIndex].elapsedMs <= elapsedMs) {
      const event = events[eventIndex];
      correctClusters += event.correctClustersDelta;
      correctCodePoints += event.correctCodePointsDelta;
      incorrectClusters += event.incorrectClustersDelta;
      clusterAttempts += event.clusterAttemptsDelta;
      insertedUnits += event.insertedUnits;
      errorUnits += event.errorUnits;
      correctionUnits += event.correctionUnits;
      eventIndex += 1;
    }

    const safeElapsed = Math.max(1, elapsedMs);
    const deltaMs = Math.max(1, elapsedMs - previousElapsedMs);
    const deltaClusterAttempts = clusterAttempts - previousClusterAttempts;
    const deltaInsertedUnits = insertedUnits - previousInsertedUnits;
    const inputAccuracy =
      insertedUnits === 0 ? 100 : Math.round(((insertedUnits - errorUnits) / insertedUnits) * 100);
    const sample: PerformanceSample = {
      second: index + 1,
      elapsedMs,
      cpm: Math.round(correctClusters / (safeElapsed / 60_000)),
      burstCpm: Math.round(deltaClusterAttempts / (deltaMs / 60_000)),
      wpm: Math.round(correctCodePoints / 5 / (safeElapsed / 60_000)),
      burstWpm: Math.round(deltaInsertedUnits / 5 / (deltaMs / 60_000)),
      rawCpm: Math.round(clusterAttempts / (safeElapsed / 60_000)),
      rawWpm: Math.round(insertedUnits / 5 / (safeElapsed / 60_000)),
      accuracy: inputAccuracy,
      inputAccuracy,
      correctClusters,
      correctCodePoints,
      incorrectClusters,
      rawKeystrokes: insertedUnits,
      insertedUnits,
      errorUnits,
      correctionUnits,
      clusterAttempts,
    };
    previousElapsedMs = elapsedMs;
    previousClusterAttempts = clusterAttempts;
    previousInsertedUnits = insertedUnits;
    return sample;
  });
}

function calculateRollingBurst(
  events: TypingAnalyticsEvent[],
  durationMs: number,
  value: "clusterAttemptsDelta" | "insertedUnits",
  divisor: number,
): number {
  const windowMs = Math.min(5_000, durationMs);
  const endpoints = [...new Set([...events.map((event) => event.elapsedMs), durationMs])]
    .filter((elapsedMs) => elapsedMs >= windowMs)
    .sort((a, b) => a - b);

  return endpoints.reduce((peak, elapsedMs) => {
    const start = elapsedMs - windowMs;
    const units = events.reduce(
      (total, event) =>
        event.elapsedMs >= start && event.elapsedMs <= elapsedMs ? total + event[value] : total,
      0,
    );
    return Math.max(peak, Math.round(units / divisor / (windowMs / 60_000)));
  }, 0);
}

export function calculateResult(
  state: TypingState,
  mode: "time" | "words",
  modeValue: number,
  now: number,
  wordDifficulty?: WordDifficultySelection,
): TestResult {
  const startedAt = state.startedAt ?? now;
  const endedAt = state.endedAt ?? now;
  const durationMs = Math.max(1, endedAt - startedAt);
  const inputAccuracy =
    state.insertedUnits === 0
      ? 100
      : Math.round(((state.insertedUnits - state.errorUnits) / state.insertedUnits) * 100);
  const timeline = buildTimeline(state.analyticsEvents, durationMs);
  return {
    id: `${new Date(startedAt).toISOString()}-${Math.random().toString(36).slice(2, 8)}`,
    startedAt: new Date(startedAt).toISOString(),
    mode,
    modeValue,
    wordDifficulty,
    durationMs,
    clustersPerMinute: Math.round(state.correctClusters / (durationMs / 60_000)),
    wordsPerMinute: Math.round(state.correctCodePoints / 5 / (durationMs / 60_000)),
    accuracy: inputAccuracy,
    correctClusters: state.correctClusters,
    correctCodePoints: state.correctCodePoints,
    incorrectClusters: state.incorrectClusters,
    rawKeystrokes: state.rawKeystrokes,
    timeline,
    analyticsVersion: 2,
    rawClustersPerMinute: Math.round(state.clusterAttempts / (durationMs / 60_000)),
    rawWordsPerMinute: Math.round(state.insertedUnits / 5 / (durationMs / 60_000)),
    burstClustersPerMinute: calculateRollingBurst(
      state.analyticsEvents,
      durationMs,
      "clusterAttemptsDelta",
      1,
    ),
    burstWordsPerMinute: calculateRollingBurst(
      state.analyticsEvents,
      durationMs,
      "insertedUnits",
      5,
    ),
    inputAccuracy,
    insertedUnits: state.insertedUnits,
    errorUnits: state.errorUnits,
    correctionUnits: state.correctionUnits,
    clusterAttempts: state.clusterAttempts,
  };
}
