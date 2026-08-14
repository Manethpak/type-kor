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

export interface LessonStep {
  id: string;
  prompt: string;
  keySequence: PhysicalKeyHint[];
}

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
