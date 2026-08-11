import { describe, expect, it } from "vitest";
import {
  canonicalizeKhmer,
  khmerTextEngine,
  normalizeTestBoundaries,
  segmentKhmer,
  validateKhmer,
} from "./khmer";

describe("Khmer structural normalization", () => {
  it("is idempotent", () => {
    const fixtures = ["ខ្ញុំ", "ច្រើន", "សង្គ្រាម", "សញ្ញា", "ស៊ី"];
    for (const fixture of fixtures) {
      const once = canonicalizeKhmer(fixture);
      expect(canonicalizeKhmer(once)).toBe(once);
    }
  });

  it("moves coeng ro to the second coeng position", () => {
    expect(canonicalizeKhmer("ក\u17D2រ\u17D2ម")).toBe("ក\u17D2ម\u17D2រ");
  });

  it("folds the deprecated coeng da spelling to coeng ta", () => {
    expect(canonicalizeKhmer("ក\u17D2ដ")).toBe("ក\u17D2ត");
  });

  it("does not use compatibility normalization for non-Khmer text", () => {
    expect(canonicalizeKhmer("① ខ្មែរ")).toBe("① ខ្មែរ");
  });

  it("folds common Khmer keyboard boundaries to one test-space key", () => {
    expect(normalizeTestBoundaries("ខ្មែរ\u200Bល្អ")).toBe("ខ្មែរ ល្អ");
    expect(canonicalizeKhmer("ខ្មែរ\u00A0ល្អ")).toBe("ខ្មែរ ល្អ");
    expect(canonicalizeKhmer("ខ្មែរ\u202Fល្អ")).toBe("ខ្មែរ ល្អ");
  });
});

describe("Khmer orthographic clusters", () => {
  it.each([
    ["ខ្ញុំ", ["ខ្ញុំ"]],
    ["ច្រើន", ["ច្រើ", "ន"]],
    ["សង្គ្រាម", ["ស", "ង្គ្រា", "ម"]],
    ["សញ្ញា", ["ស", "ញ្ញា"]],
    ["ស៊ី", ["ស៊ី"]],
  ])("segments %s by Khmer orthographic unit", (input, expected) => {
    expect(segmentKhmer(input).map((cluster) => cluster.display)).toEqual(expected);
  });

  it("round trips every fixture", () => {
    const input = "ខ្ញុំ ស្រឡាញ់ ភាសាខ្មែរ។";
    expect(
      segmentKhmer(input)
        .map((cluster) => cluster.display)
        .join(""),
    ).toBe(canonicalizeKhmer(input));
  });

  it("segments zero-width space as the same logical boundary as visible space", () => {
    const clusters = segmentKhmer("ខ្មែរ\u200Bល្អ");
    const boundary = clusters.find((cluster) => cluster.kind === "space");
    expect(boundary).toMatchObject({ display: " ", comparisonKey: " ", kind: "space" });
  });

  it("accepts visible, zero-width, and non-breaking space for the same boundary", () => {
    const target = segmentKhmer(" ")[0];
    expect(khmerTextEngine.compare(target, " ")).toBe("correct");
    expect(khmerTextEngine.compare(target, "\u200B")).toBe("correct");
    expect(khmerTextEngine.compare(target, "\u00A0")).toBe("correct");
    expect(khmerTextEngine.compare(target, "\u202F")).toBe("correct");
  });

  it("matches prefixes only within the current cluster", () => {
    const target = segmentKhmer("ខ្ញុំ")[0];
    expect(khmerTextEngine.compare(target, "ខ្")).toBe("prefix");
    expect(khmerTextEngine.compare(target, "ខ្ញុំ")).toBe("correct");
    expect(khmerTextEngine.compare(target, "ក")).toBe("incorrect");
  });

  it("flags a wrong base immediately while keeping a valid base as a prefix", () => {
    const target = segmentKhmer("ជា")[0];
    expect(khmerTextEngine.compare(target, "ជ")).toBe("prefix");
    expect(khmerTextEngine.compare(target, "ច")).toBe("incorrect");
  });
});

describe("Khmer validation", () => {
  it("rejects a dangling coeng", () => {
    expect(validateKhmer("ក\u17D2").issues.some((issue) => issue.code === "dangling-coeng")).toBe(
      true,
    );
  });

  it("accepts representative modern Khmer", () => {
    expect(validateKhmer("ខ្ញុំស្រឡាញ់ភាសាខ្មែរ").valid).toBe(true);
  });
});
