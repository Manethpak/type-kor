import type { WordDifficultySelection } from "../data/wordList";

export interface PerformanceSample {
  second: number;
  elapsedMs: number;
  cpm: number;
  burstCpm: number;
  wpm: number;
  burstWpm: number;
  accuracy: number;
  correctClusters: number;
  correctCodePoints: number;
  incorrectClusters: number;
  rawKeystrokes: number;
  rawCpm?: number;
  rawWpm?: number;
  inputAccuracy?: number;
  insertedUnits?: number;
  errorUnits?: number;
  correctionUnits?: number;
  clusterAttempts?: number;
}

export interface TestResult {
  id: string;
  startedAt: string;
  mode: "time" | "words";
  modeValue: number;
  wordDifficulty?: WordDifficultySelection;
  durationMs: number;
  clustersPerMinute: number;
  wordsPerMinute: number;
  accuracy: number;
  correctClusters: number;
  correctCodePoints: number;
  incorrectClusters: number;
  rawKeystrokes: number;
  timeline: PerformanceSample[];
  analyticsVersion?: 2;
  rawClustersPerMinute?: number;
  rawWordsPerMinute?: number;
  burstClustersPerMinute?: number;
  burstWordsPerMinute?: number;
  inputAccuracy?: number;
  insertedUnits?: number;
  errorUnits?: number;
  correctionUnits?: number;
  clusterAttempts?: number;
}

export interface HistoryRepository {
  list(): Promise<TestResult[]>;
  save(result: TestResult): Promise<void>;
  clear(): Promise<void>;
}
