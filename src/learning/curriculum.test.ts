import { describe, expect, it } from "vitest";
import { khmerTextEngine } from "../engine/khmer";
import { lessons } from "./curriculum";
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
});
