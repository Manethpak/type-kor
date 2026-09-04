import { describe, expect, it } from "vitest";
import { khmerTextEngine } from "../engine/khmer";
import { lessons } from "./curriculum";
import { LESSON_EXERCISE_LENGTH } from "./lessonExercise";
import { keyHintId, NIDA_KEY_ROWS } from "./nida";

describe("learning curriculum", () => {
  it("provides complete NIDA guidance for every lesson target", () => {
    for (const lesson of lessons) {
      for (const step of lesson.steps) {
        const stepName = step.kind === "typing" ? step.prompt : step.label.en;
        expect(step.keySequence.length, `${lesson.id}: ${stepName}`).toBeGreaterThan(0);
        if (step.kind === "key") {
          expect(step.keySequence).toEqual([step.target]);
          continue;
        }
        expect(
          khmerTextEngine.canonicalize(step.keySequence.map((hint) => hint.output).join("")),
          `${lesson.id}: ${step.prompt}`,
        ).toBe(khmerTextEngine.canonicalize(step.prompt));
      }
    }
  });

  it("covers every Base, Shift, and AltGr key mapping", () => {
    const expected = NIDA_KEY_ROWS.flat().flatMap((layoutKey) =>
      (["base", "shift", "altGr"] as const)
        .filter((layer) => layoutKey[layer])
        .map((layer) => `${layoutKey.code}:${layer}`),
    );
    const covered = new Set(
      lessons.flatMap((lesson) => lesson.steps.flatMap((step) => step.keySequence.map(keyHintId))),
    );

    expect(covered.size).toBe(123);
    expect(expected.every((mapping) => covered.has(mapping))).toBe(true);
  });

  it("keeps lesson and step identifiers unique", () => {
    expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(lessons.length);
    for (const lesson of lessons) {
      expect(new Set(lesson.steps.map((step) => step.id)).size).toBe(lesson.steps.length);
    }
  });

  it("ends every lesson with a 20-item focused exercise", () => {
    const taughtMappings = new Set<string>();

    for (const lesson of lessons) {
      const exercise = lesson.steps.filter((step) => step.review);
      const authoredSteps = lesson.steps.filter((step) => !step.review);
      const lessonMappings = new Set(
        authoredSteps.flatMap((step) => step.keySequence.map(keyHintId)),
      );
      const introducedMappings = new Set(
        [...lessonMappings].filter((mapping) => !taughtMappings.has(mapping)),
      );
      const focusMappings = introducedMappings.size > 0 ? introducedMappings : lessonMappings;
      for (const mapping of lessonMappings) taughtMappings.add(mapping);

      expect(exercise, lesson.id).toHaveLength(LESSON_EXERCISE_LENGTH);
      expect(lesson.steps.slice(-LESSON_EXERCISE_LENGTH), lesson.id).toEqual(exercise);
      for (const step of exercise) {
        const mappings = step.keySequence.map(keyHintId);
        expect(
          mappings.every((mapping) => taughtMappings.has(mapping)),
          lesson.id,
        ).toBe(true);
        expect(
          mappings.some((mapping) => focusMappings.has(mapping)),
          lesson.id,
        ).toBe(true);
      }
    }
  });
});
