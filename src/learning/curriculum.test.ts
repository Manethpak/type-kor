import { describe, expect, it } from "vitest";
import { khmerTextEngine } from "../engine/khmer";
import { lessons } from "./curriculum";

describe("learning curriculum", () => {
  it("provides complete NIDA guidance for every lesson target", () => {
    for (const lesson of lessons) {
      for (const step of lesson.steps) {
        expect(step.keySequence.length, `${lesson.id}: ${step.prompt}`).toBeGreaterThan(0);
        expect(
          khmerTextEngine.canonicalize(step.keySequence.map((hint) => hint.output).join("")),
          `${lesson.id}: ${step.prompt}`,
        ).toBe(khmerTextEngine.canonicalize(step.prompt));
      }
    }
  });

  it("keeps lesson and step identifiers unique", () => {
    expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(lessons.length);
    for (const lesson of lessons) {
      expect(new Set(lesson.steps.map((step) => step.id)).size).toBe(lesson.steps.length);
    }
  });
});
