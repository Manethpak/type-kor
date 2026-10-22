export type MatchStatus = "prefix" | "correct" | "incorrect";

/** A Khmer Character Cluster (KCC), or a standalone boundary/non-cluster token. */
export interface KhmerCharacterCluster {
  display: string;
  comparisonKey: string;
  /** UTF-16 offsets into input after test-boundary normalization (which preserves length). */
  start: number;
  end: number;
  kind: "khmer" | "space" | "punctuation";
}

export interface ValidationIssue {
  index: number;
  code: "unsupported-control" | "orphan-mark" | "dangling-coeng" | "duplicate-vowel";
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  normalized: string;
  issues: ValidationIssue[];
}

export interface KhmerTextEngine {
  canonicalize(input: string): string;
  validate(input: string): ValidationResult;
  cluster(input: string): KhmerCharacterCluster[];
  compare(target: KhmerCharacterCluster, rawAttempt: string): MatchStatus;
}
