import type { OrthographicCluster } from "../engine/types";
import type { TestResult } from "../storage/types";
import type { PerformanceSample } from "../storage/types";

export type ClusterState = "pending" | "correct" | "incorrect";

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
  timeline: PerformanceSample[];
  finished: boolean;
}

export type TypingAction =
  | { type: "start"; at: number }
  | { type: "keystrokes"; count: number }
  | { type: "pending"; value: string; status: "prefix" | "incorrect" }
  | { type: "commit"; attempt: string; correct: boolean }
  | { type: "reopen" }
  | { type: "sample"; elapsedMs: number }
  | { type: "finish"; at: number }
  | { type: "reset"; prompt: OrthographicCluster[] };

export interface TestSettings {
  mode: "time" | "words";
  modeValue: number;
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
