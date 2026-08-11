import { describe, expect, it } from "vitest";
import { segmentKhmer } from "../engine/khmer";
import { calculateResult, createTypingState, typingReducer } from "./reducer";

describe("typing reducer", () => {
  it("starts on first input and commits one orthographic cluster", () => {
    let state = createTypingState(segmentKhmer("ខ្ញុំ អ្នក"));
    state = typingReducer(state, { type: "start", at: 1_000 });
    state = typingReducer(state, { type: "pending", value: "ខ្", status: "prefix" });
    expect(state.currentIndex).toBe(0);
    state = typingReducer(state, { type: "commit", attempt: "ខ្ញុំ", correct: true });
    expect(state.currentIndex).toBe(1);
    expect(state.correctClusters).toBe(1);
    expect(state.correctCodePoints).toBe(5);
  });

  it("reopens a committed cluster and removes its score", () => {
    let state = createTypingState(segmentKhmer("ស៊ី"));
    state = typingReducer(state, { type: "commit", attempt: "ស៊ី", correct: true });
    state = typingReducer(state, { type: "reopen" });
    expect(state.currentIndex).toBe(0);
    expect(state.correctClusters).toBe(0);
    expect(state.correctCodePoints).toBe(0);
    // ស៊ី is three code points: ស + ៊ + ី. Backspace removes only the last one.
    expect(state.pendingInput).toBe("ស៊");
  });

  it("calculates clusters per minute and cluster accuracy", () => {
    let state = createTypingState(segmentKhmer("ខ្មែរ"));
    state = { ...state, startedAt: 0, endedAt: 60_000, correctClusters: 9, incorrectClusters: 1 };
    const result = calculateResult(state, "time", 60, 60_000);
    expect(result.clustersPerMinute).toBe(9);
    expect(result.accuracy).toBe(90);
  });

  it("finishes a running timed test at the supplied deadline", () => {
    let state = createTypingState(segmentKhmer("ខ្មែរ"));
    state = typingReducer(state, { type: "start", at: 1_000 });
    state = typingReducer(state, { type: "finish", at: 16_000 });
    expect(state).toMatchObject({ startedAt: 1_000, endedAt: 16_000, finished: true });
  });

  it("records cumulative and burst analytics for each elapsed second", () => {
    let state = {
      ...createTypingState(segmentKhmer("ខ្មែរ")),
      correctClusters: 2,
      correctCodePoints: 10,
      incorrectClusters: 1,
      rawKeystrokes: 5,
    };
    state = typingReducer(state, { type: "sample", elapsedMs: 1_000 });
    expect(state.timeline[0]).toMatchObject({
      second: 1,
      cpm: 120,
      burstCpm: 120,
      wpm: 120,
      burstWpm: 120,
      accuracy: 67,
    });

    state = { ...state, correctClusters: 3, correctCodePoints: 15, rawKeystrokes: 7 };
    state = typingReducer(state, { type: "sample", elapsedMs: 2_000 });
    expect(state.timeline[1]).toMatchObject({
      second: 2,
      cpm: 90,
      burstCpm: 60,
      wpm: 90,
      burstWpm: 60,
      rawKeystrokes: 7,
    });
  });

  it("adds a final partial-second sample to completed results", () => {
    const state = {
      ...createTypingState(segmentKhmer("ខ្មែរ")),
      startedAt: 1_000,
      endedAt: 2_500,
      correctClusters: 2,
      correctCodePoints: 10,
      timeline: [],
    };
    const result = calculateResult(state, "words", 10, 2_500);
    expect(result.timeline).toHaveLength(1);
    expect(result.timeline[0]).toMatchObject({ second: 2, elapsedMs: 1_500, correctClusters: 2 });
    expect(result.wordsPerMinute).toBe(80);
  });

  it("counts correct normalized code points as conventional five-character words", () => {
    let state = createTypingState(segmentKhmer("ខ្ញុំ អ្នក"));
    state = typingReducer(state, { type: "start", at: 0 });
    state = typingReducer(state, { type: "commit", attempt: "ខ្ញុំ", correct: true });
    state = typingReducer(state, { type: "commit", attempt: " ", correct: true });
    state = { ...state, endedAt: 60_000 };
    const result = calculateResult(state, "time", 60, 60_000);
    expect(result.correctCodePoints).toBe(6);
    expect(result.wordsPerMinute).toBe(1);
  });
});
