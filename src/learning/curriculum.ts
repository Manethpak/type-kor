import generatedCurriculum from "../generated/curriculum.json";
import { keySequenceFor } from "./nida";
import type { Lesson, LessonUnit, LocalizedText } from "./types";

interface GeneratedStep {
  id: string;
  prompt: string;
}

interface GeneratedLesson {
  schemaVersion: 1;
  id: string;
  revision: number;
  unitId: string;
  order: number;
  title: LocalizedText;
  description: LocalizedText;
  masteryAccuracy: number;
  steps: GeneratedStep[];
}

interface GeneratedUnit {
  schemaVersion: 1;
  id: string;
  order: number;
  title: LocalizedText;
  description: LocalizedText;
}

interface GeneratedCurriculum {
  schemaVersion: 1;
  units: GeneratedUnit[];
  lessons: GeneratedLesson[];
}

const source = generatedCurriculum as GeneratedCurriculum;

export const lessons: Lesson[] = source.lessons.map((lesson) => ({
  ...lesson,
  steps: lesson.steps.map((step) => ({
    ...step,
    keySequence: keySequenceFor(step.prompt),
  })),
}));

export const curriculum: LessonUnit[] = source.units.map((unit) => ({
  ...unit,
  lessons: lessons.filter((lesson) => lesson.unitId === unit.id),
}));

export function getLesson(lessonId: string | undefined): Lesson | undefined {
  return lessons.find((item) => item.id === lessonId);
}

export function getNextLesson(lessonId: string): Lesson | undefined {
  const index = lessons.findIndex((item) => item.id === lessonId);
  return index >= 0 ? lessons[index + 1] : undefined;
}
