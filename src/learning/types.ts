export type ExperienceMode = "learn" | "test";

export interface LocalizedText {
  km: string;
  en?: string;
}

export interface PhysicalKeyHint {
  code: string;
  key: string;
  shift: boolean;
  altGr: boolean;
  output: string;
}

export type CurriculumTier = "core" | "advanced" | "technical";

export interface TypingLessonStep {
  id: string;
  kind: "typing";
  prompt: string;
  keySequence: PhysicalKeyHint[];
  review?: boolean;
}

export interface KeyLessonStep {
  id: string;
  kind: "key";
  label: LocalizedText;
  target: PhysicalKeyHint;
  keySequence: PhysicalKeyHint[];
  review?: boolean;
}

export type LessonStep = TypingLessonStep | KeyLessonStep;

export interface Lesson {
  schemaVersion: 1;
  id: string;
  revision: number;
  unitId: string;
  order: number;
  title: LocalizedText;
  description: LocalizedText;
  masteryAccuracy: number;
  steps: LessonStep[];
}

export interface LessonUnit {
  schemaVersion: 1;
  id: string;
  order: number;
  tier: CurriculumTier;
  title: LocalizedText;
  description: LocalizedText;
  lessons: Lesson[];
}

export interface LessonProgress {
  attempts: number;
  bestAccuracy: number;
  completedAt: string | null;
  masteredAt: string | null;
}

export interface LessonCheckpoint {
  lessonId: string;
  lessonRevision: number;
  stepId: string;
  errors: number;
}

export interface LearningState {
  schemaVersion: 2;
  progress: Record<string, LessonProgress>;
  checkpoint: LessonCheckpoint | null;
}
