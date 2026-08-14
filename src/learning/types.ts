export type ExperienceMode = "learn" | "test";

export interface PhysicalKeyHint {
  code: string;
  key: string;
  shift: boolean;
  output: string;
}

export interface LessonStep {
  id: string;
  prompt: string;
  keySequence: PhysicalKeyHint[];
}

export interface Lesson {
  id: string;
  unitId: string;
  title: string;
  description: string;
  steps: LessonStep[];
}

export interface LessonUnit {
  id: string;
  index: number;
  title: string;
  description: string;
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
  stepIndex: number;
  errors: number;
}

export interface LearningState {
  schemaVersion: 1;
  progress: Record<string, LessonProgress>;
  checkpoint: LessonCheckpoint | null;
}
