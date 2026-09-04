import generatedCurriculum from "../generated/curriculum.json";
import { keyHintFor, keySequenceFor, type NidaLayer } from "./nida";
import type { Lesson, LessonUnit, LocalizedText } from "./types";

interface GeneratedTypingStep {
  id: string;
  prompt: string;
}

interface GeneratedKeyStep {
  id: string;
  kind: "key";
  label: LocalizedText;
  target: { code: string; layer: NidaLayer };
}

type GeneratedStep = GeneratedTypingStep | GeneratedKeyStep;

function isGeneratedKeyStep(step: GeneratedStep): step is GeneratedKeyStep {
  return "kind" in step && step.kind === "key";
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
  tier: "core" | "advanced" | "technical";
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
  steps: lesson.steps.map((step) => {
    if (isGeneratedKeyStep(step)) {
      const target = keyHintFor(step.target.code, step.target.layer);
      if (!target) throw new Error(`Invalid key target in ${lesson.id}/${step.id}`);
      return { ...step, target, keySequence: [target] };
    }
    return {
      id: step.id,
      prompt: step.prompt,
      kind: "typing" as const,
      keySequence: keySequenceFor(step.prompt),
    };
  }),
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
