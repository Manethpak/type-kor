import { describe, expect, it } from "vitest";
import { segmentKhmer } from "../engine/khmer";
import { calculateResult, createTypingState, typingReducer } from "./reducer";

describe("typing reducer", () => {
  it("starts on first input and commits one orthographic cluster", () => {
    let state = createTypingState(segmentKhmer("ខ្ញុំ អ្នក"));
    state = typingReducer(state, { type: "start", at: 1_000 });
    state = typingReducer(state, { type: "pending", value: "ខ្", status: "prefix" });
    expect(state.currentIndex).toBe(0);
    state = typingReducer(state, { type: "commit", at: 1_100, attempt: "ខ្ញុំ", correct: true });
    expect(state.currentIndex).toBe(1);
    expect(state.correctClusters).toBe(1);
    expect(state.correctCodePoints).toBe(5);
    expect(state.clusterAttempts).toBe(1);
  });

  it("reopens a committed cluster without erasing the cumulative attempt", () => {
    let state = createTypingState(segmentKhmer("ស៊ី"));
    state = typingReducer(state, { type: "start", at: 1_000 });
    state = typingReducer(state, { type: "commit", at: 1_100, attempt: "ស៊ី", correct: true });
    state = typingReducer(state, { type: "reopen", at: 1_200 });
    expect(state.currentIndex).toBe(0);
    expect(state.correctClusters).toBe(0);
    expect(state.correctCodePoints).toBe(0);
    expect(state.clusterAttempts).toBe(1);
    // ស៊ី is three code points: ស + ៊ + ី. Backspace removes only the last one.
    expect(state.pendingInput).toBe("ស៊");
  });

  it("uses input-unit accuracy and retains corrected errors", () => {
    let state = createTypingState(segmentKhmer("ខ្ញុំ"));
    state = typingReducer(state, { type: "start", at: 1_000 });
    state = typingReducer(state, {
      type: "input",
      at: 1_100,
      insertedUnits: 1,
      errorUnits: 1,
      correctionUnits: 0,
    });
    state = typingReducer(state, {
      type: "input",
      at: 1_200,
      insertedUnits: 0,
      errorUnits: 0,
      correctionUnits: 1,
    });
    state = typingReducer(state, {
      type: "input",
      at: 1_500,
      insertedUnits: 5,
      errorUnits: 0,
      correctionUnits: 0,
    });
    state = typingReducer(state, { type: "commit", at: 1_500, attempt: "ខ្ញុំ", correct: true });
    state = typingReducer(state, { type: "finish", at: 2_000 });

    const result = calculateResult(state, "time", 1, 2_000);
    expect(result).toMatchObject({
      accuracy: 83,
      inputAccuracy: 83,
      insertedUnits: 6,
      errorUnits: 1,
      correctionUnits: 1,
      incorrectClusters: 0,
    });
  });

  it("includes the selected word difficulty in completed results", () => {
    const state = {
      ...createTypingState(segmentKhmer("ខ្មែរ")),
      startedAt: 1_000,
      endedAt: 2_000,
      finished: true,
    };

    expect(calculateResult(state, "time", 30, 2_000, "mixed")).toMatchObject({
      mode: "time",
      modeValue: 30,
      wordDifficulty: "mixed",
    });
  });

  it("finishes a running timed test at the supplied deadline", () => {
    let state = createTypingState(segmentKhmer("ខ្មែរ"));
    state = typingReducer(state, { type: "start", at: 1_000 });
    state = typingReducer(state, { type: "finish", at: 16_000 });
    expect(state).toMatchObject({ startedAt: 1_000, endedAt: 16_000, finished: true });
  });

  it("derives cumulative and raw interval analytics from timestamped events", () => {
    const state = {
      ...createTypingState(segmentKhmer("ខ្មែរ")),
      startedAt: 0,
      endedAt: 2_000,
      correctClusters: 3,
      correctCodePoints: 15,
      incorrectClusters: 1,
      rawKeystrokes: 7,
      insertedUnits: 7,
      errorUnits: 1,
      clusterAttempts: 4,
      analyticsEvents: [
        {
          elapsedMs: 500,
          insertedUnits: 5,
          errorUnits: 1,
          correctionUnits: 0,
          correctClustersDelta: 2,
          correctCodePointsDelta: 10,
          incorrectClustersDelta: 1,
          clusterAttemptsDelta: 3,
        },
        {
          elapsedMs: 1_500,
          insertedUnits: 2,
          errorUnits: 0,
          correctionUnits: 0,
          correctClustersDelta: 1,
          correctCodePointsDelta: 5,
          incorrectClustersDelta: 0,
          clusterAttemptsDelta: 1,
        },
      ],
    };
    const result = calculateResult(state, "time", 2, 2_000);

    expect(result.timeline[0]).toMatchObject({
      second: 1,
      cpm: 120,
      rawCpm: 180,
      burstCpm: 180,
      wpm: 120,
      burstWpm: 60,
      accuracy: 80,
    });
    expect(result.timeline[1]).toMatchObject({
      second: 2,
      cpm: 90,
      rawCpm: 120,
      burstCpm: 60,
      wpm: 90,
      burstWpm: 24,
      accuracy: 86,
    });
  });

  it("adds a final partial-second sample to completed results", () => {
    const prompt = segmentKhmer("ខ្មែរ ខ្មែរ");
    let state = createTypingState(prompt);
    state = typingReducer(state, { type: "start", at: 1_000 });
    prompt.forEach((cluster, index) => {
      state = typingReducer(state, {
        type: "commit",
        at: 1_500 + index * 100,
        attempt: cluster.display,
        correct: true,
      });
    });
    state = typingReducer(state, { type: "finish", at: 2_500 });
    const result = calculateResult(state, "words", 2, 2_500);
    expect(result.timeline).toHaveLength(2);
    expect(result.timeline[1]).toMatchObject({
      second: 2,
      elapsedMs: 1_500,
      correctClusters: prompt.filter((cluster) => cluster.kind === "khmer").length,
    });
    const codePoints = prompt.reduce(
      (total, cluster) => total + Array.from(cluster.comparisonKey).length,
      0,
    );
    expect(result.wordsPerMinute).toBe(Math.round(codePoints / 5 / (1_500 / 60_000)));
  });

  it("calculates burst speed over a rolling five-second window", () => {
    let state = createTypingState(segmentKhmer("ខ្មែរ"));
    state = typingReducer(state, { type: "start", at: 1_000 });
    state = typingReducer(state, {
      type: "input",
      at: 1_000,
      insertedUnits: 25,
      errorUnits: 0,
      correctionUnits: 0,
    });
    state = typingReducer(state, { type: "finish", at: 6_000 });
    const result = calculateResult(state, "time", 5, 6_000);
    expect(result.burstWordsPerMinute).toBe(60);
  });

  it("counts correct normalized code points as conventional five-character words", () => {
    let state = createTypingState(segmentKhmer("ខ្ញុំ អ្នក"));
    state = typingReducer(state, { type: "start", at: 0 });
    state = typingReducer(state, { type: "commit", at: 1_000, attempt: "ខ្ញុំ", correct: true });
    state = typingReducer(state, { type: "commit", at: 1_100, attempt: " ", correct: true });
    state = typingReducer(state, { type: "finish", at: 60_000 });
    const result = calculateResult(state, "time", 60, 60_000);
    expect(result.correctCodePoints).toBe(6);
    expect(result.wordsPerMinute).toBe(1);
  });
});
