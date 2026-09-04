import { frequencyWordEntries } from "../data/wordList";
import { keyHintId, keySequenceFor } from "./nida";
import type { LessonStep } from "./types";

export const LESSON_EXERCISE_LENGTH = 20;

function mappingsFor(step: LessonStep): string[] {
  return step.keySequence.map(keyHintId);
}

function repeatToLength<T>(items: readonly T[], length: number): T[] {
  return Array.from({ length }, (_, index) => items[index % items.length]);
}

function fallbackSteps(authoredSteps: readonly LessonStep[]): LessonStep[] {
  return authoredSteps.flatMap<LessonStep>((step) => {
    if (step.kind === "key") return [step];

    return step.prompt
      .split(/\s+/u)
      .filter(Boolean)
      .map((prompt, index) => ({
        ...step,
        id: `${step.id}-part-${index + 1}`,
        prompt,
        keySequence: keySequenceFor(prompt),
      }));
  });
}

/**
 * Builds the final 20-item lesson exercise from words that use only mappings taught so far and
 * exercise at least one mapping from the current lesson. Symbol-only lessons reuse their drills.
 */
export function createLessonExercise(
  lessonId: string,
  authoredSteps: readonly LessonStep[],
  previouslyTaughtMappings: ReadonlySet<string>,
): LessonStep[] {
  const lessonMappings = new Set(authoredSteps.flatMap(mappingsFor));
  const introducedMappings = new Set(
    [...lessonMappings].filter((mapping) => !previouslyTaughtMappings.has(mapping)),
  );
  const focusMappings = introducedMappings.size > 0 ? introducedMappings : lessonMappings;
  const taughtMappings = taughtMappingsAfter(previouslyTaughtMappings, authoredSteps);
  const words: string[] = [];

  for (const { word } of frequencyWordEntries) {
    const sequence = keySequenceFor(word);
    const mappingIds = sequence.map(keyHintId);
    if (
      sequence.length > 0 &&
      mappingIds.every((mapping) => taughtMappings.has(mapping)) &&
      mappingIds.some((mapping) => focusMappings.has(mapping))
    ) {
      words.push(word);
      if (words.length === LESSON_EXERCISE_LENGTH) break;
    }
  }

  const candidates: LessonStep[] = words.length
    ? words.map((prompt, index) => ({
        id: `${lessonId}-word-${index + 1}`,
        kind: "typing",
        prompt,
        keySequence: keySequenceFor(prompt),
      }))
    : fallbackSteps(authoredSteps);

  if (candidates.length === 0) return [];

  return repeatToLength(candidates, LESSON_EXERCISE_LENGTH).map((step, index) => ({
    ...step,
    id: `exercise-${String(index + 1).padStart(2, "0")}`,
    review: true,
  }));
}

export function taughtMappingsAfter(
  current: ReadonlySet<string>,
  steps: readonly LessonStep[],
): Set<string> {
  return new Set([...current, ...steps.flatMap(mappingsFor)]);
}
