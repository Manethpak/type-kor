export type MatchStatus = "prefix" | "correct" | "incorrect";

export interface OrthographicCluster {
  display: string;
  comparisonKey: string;
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
  segment(input: string): OrthographicCluster[];
  compare(target: OrthographicCluster, rawAttempt: string): MatchStatus;
}
