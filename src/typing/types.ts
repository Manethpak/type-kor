import type { WordDifficulty } from "../data/wordList";
import type { WordDifficultySelection } from "../data/wordList";
import type { OrthographicCluster } from "../engine/types";
import type { TestResult } from "../storage/types";

export type ClusterState = "pending" | "correct" | "incorrect";

export interface TypingAnalyticsEvent {
  elapsedMs: number;
  insertedUnits: number;
  errorUnits: number;
  correctionUnits: number;
  correctClustersDelta: number;
  correctCodePointsDelta: number;
  incorrectClustersDelta: number;
  clusterAttemptsDelta: number;
}

export interface TypingState {
  prompt: OrthographicCluster[];
  states: ClusterState[];
  attempts: string[];
  currentIndex: number;
  pendingInput: string;
  pendingStatus: "prefix" | "incorrect";
  startedAt: number | null;
  endedAt: number | null;
  correctClusters: number;
  correctCodePoints: number;
  incorrectClusters: number;
  rawKeystrokes: number;
  insertedUnits: number;
  errorUnits: number;
  correctionUnits: number;
  clusterAttempts: number;
  analyticsEvents: TypingAnalyticsEvent[];
  finished: boolean;
}

export type TypingAction =
  | { type: "start"; at: number }
  | {
      type: "input";
      at: number;
      insertedUnits: number;
      errorUnits: number;
      correctionUnits: number;
    }
  | { type: "pending"; value: string; status: "prefix" | "incorrect" }
  | { type: "commit"; at: number; attempt: string; correct: boolean }
  | { type: "reopen"; at: number }
  | { type: "finish"; at: number }
  | { type: "reset"; prompt: OrthographicCluster[] };

export interface TestSettings {
  mode: "time" | "words";
  modeValue: number;
  wordDifficulty: WordDifficultySelection;
  speedUnit: "cpm" | "wpm";
  theme: "saffron" | "paper";
  fontSize: number;
  lineHeight: number;
  sound: boolean;
  punctuation: boolean;
}

export interface Completion {
  result: TestResult;
  state: TypingState;
}
