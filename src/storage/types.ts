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
}

export interface TestResult {
  id: string;
  startedAt: string;
  mode: "time" | "words";
  modeValue: number;
  durationMs: number;
  clustersPerMinute: number;
  wordsPerMinute: number;
  accuracy: number;
  correctClusters: number;
  correctCodePoints: number;
  incorrectClusters: number;
  rawKeystrokes: number;
  timeline: PerformanceSample[];
}

export interface HistoryRepository {
  list(): Promise<TestResult[]>;
  save(result: TestResult): Promise<void>;
  clear(): Promise<void>;
}
