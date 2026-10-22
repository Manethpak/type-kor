import { describe, expect, it } from "vitest";
import {
  canonicalizeKhmer,
  khmerTextEngine,
  normalizeTestBoundaries,
  clusterKhmerText,
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

describe("Khmer Character Clusters (KCC), not word segmentation", () => {
  it.each([
    ["ខ្ញុំ", ["ខ្ញុំ"]],
    ["ច្រើន", ["ច្រើ", "ន"]],
    ["សង្គ្រាម", ["ស", "ង្គ្រា", "ម"]],
    ["សញ្ញា", ["ស", "ញ្ញា"]],
    ["ស៊ី", ["ស៊ី"]],
  ])("clusters %s into KCCs", (input, expected) => {
    expect(clusterKhmerText(input).map((cluster) => cluster.display)).toEqual(expected);
  });

  it("round trips display text without structural reordering", () => {
    const input = "ខ្ញុំ ស្រឡាញ់ ភាសាខ្មែរ។";
    expect(
      clusterKhmerText(input)
        .map((cluster) => cluster.display)
        .join(""),
    ).toBe(normalizeTestBoundaries(input));
  });

  it("clusters zero-width space as the same logical boundary as visible space", () => {
    const clusters = clusterKhmerText("ខ្មែរ\u200Bល្អ");
    const boundary = clusters.find((cluster) => cluster.kind === "space");
    expect(boundary).toMatchObject({ display: " ", comparisonKey: " ", kind: "space" });
  });

  it("accepts visible, zero-width, and non-breaking space for the same boundary", () => {
    const target = clusterKhmerText(" ")[0];
    expect(khmerTextEngine.compare(target, " ")).toBe("correct");
    expect(khmerTextEngine.compare(target, "\u200B")).toBe("correct");
    expect(khmerTextEngine.compare(target, "\u00A0")).toBe("correct");
    expect(khmerTextEngine.compare(target, "\u202F")).toBe("correct");
  });

  it("matches prefixes only within the current cluster", () => {
    const target = clusterKhmerText("ខ្ញុំ")[0];
    expect(khmerTextEngine.compare(target, "ខ្")).toBe("prefix");
    expect(khmerTextEngine.compare(target, "ខ្ញុំ")).toBe("correct");
    expect(khmerTextEngine.compare(target, "ក")).toBe("incorrect");
  });

  it("flags a wrong base immediately while keeping a valid base as a prefix", () => {
    const target = clusterKhmerText("ជា")[0];
    expect(khmerTextEngine.compare(target, "ជ")).toBe("prefix");
    expect(khmerTextEngine.compare(target, "ច")).toBe("incorrect");
  });

  it.each([
    ["ក", ["ក"]],
    ["ឥ", ["ឥ"]],
    ["ក\u17CC", ["ក\u17CC"]],
    ["ស\u17CAី", ["ស\u17CAី"]],
    ["ក\u17D2ឥ", ["ក\u17D2ឥ"]],
    ["ក\u17D2ខ\u17C9", ["ក\u17D2ខ\u17C9"]],
    ["ក\u17D2ឥ\u17C9", ["ក\u17D2ឥ\u17C9"]],
    ["ក\u17D2ខ\u17D2គា", ["ក\u17D2ខ\u17D2គា"]],
    ["ក\u200Dា", ["ក\u200Dា"]],
    ["ក\u200Cា", ["ក\u200Cា"]],
    ["កាំះ", ["កាំះ"]],
    ["កា\u200D\u17D2ខ", ["កា\u200D\u17D2ខ"]],
    ["ក\u17D2ខ\u17D2គាំះ\u200D\u17D2ឥ", ["ក\u17D2ខ\u17D2គាំះ\u200D\u17D2ឥ"]],
  ])("supports KCC grammar combinations in %s", (input, expected) => {
    expect(clusterKhmerText(input).map((cluster) => cluster.display)).toEqual(expected);
  });

  it.each([
    ["ក\u17D2ខ\u17D2គ\u17D2ឃ", ["ក\u17D2ខ\u17D2គ", "\u17D2", "ឃ"]],
    ["កំំំ", ["កំំ", "ំ"]],
    ["កាិ", ["កា", "ិ"]],
    ["ាក", ["ា", "ក"]],
    ["ក\u17D2", ["ក", "\u17D2"]],
    ["ក\u200D", ["ក", "\u200D"]],
    ["ក\u200C\u17D2ខ", ["ក", "\u200C", "\u17D2", "ខ"]],
    ["កា\u17D2ខ", ["កា", "\u17D2", "ខ"]],
  ])("preserves unmatched characters and enforces grammar limits in %s", (input, expected) => {
    expect(clusterKhmerText(input).map((cluster) => cluster.display)).toEqual(expected);
  });

  it("preserves mixed text and boundary-normalized UTF-16 offsets", () => {
    const input = "ខ្ញុំ\u200B🙂A។១";
    const normalized = normalizeTestBoundaries(input);
    const clusters = khmerTextEngine.cluster(input);
    expect(clusters.map((cluster) => cluster.display)).toEqual(["ខ្ញុំ", " ", "🙂", "A", "។", "១"]);
    expect(clusters.map((cluster) => cluster.display).join("")).toBe(normalized);
    let offset = 0;
    for (const cluster of clusters) {
      expect(cluster.start).toBe(offset);
      expect(normalized.slice(cluster.start, cluster.end)).toBe(cluster.display);
      offset = cluster.end;
    }
    expect(offset).toBe(normalized.length);
  });

  it("returns no tokens for empty input", () => {
    expect(clusterKhmerText("")).toEqual([]);
  });

  it.each(["ក\u200Dា", "ក\u17D2ខ\u17C9", "កា\u200D\u17D2ខ"])(
    "accepts every display prefix of %s before normalization reorders it",
    (input) => {
      const target = clusterKhmerText(input)[0];
      const characters = Array.from(input);
      for (let length = 0; length < characters.length; length += 1) {
        expect(khmerTextEngine.compare(target, characters.slice(0, length).join(""))).toBe(
          "prefix",
        );
      }
      expect(khmerTextEngine.compare(target, input)).toBe("correct");
    },
  );

  it("normalizes comparison keys without changing display text or source offsets", () => {
    const input = "ក\u17D2រ\u17D2ម ក\u200Dា ក\u17D2ដ កេី";
    const clusters = clusterKhmerText(input);
    expect(clusters.map((cluster) => cluster.display).join("")).toBe(input);
    for (const cluster of clusters) {
      expect(input.slice(cluster.start, cluster.end)).toBe(cluster.display);
      expect(cluster.comparisonKey).toBe(canonicalizeKhmer(cluster.display));
      expect(khmerTextEngine.compare(cluster, cluster.display)).toBe("correct");
    }
  });
});

describe("Khmer validation", () => {
  it("still detects duplicate vowels when KCC clustering separates them", () => {
    expect(validateKhmer("កាិ").issues).toContainEqual({
      index: 0,
      code: "duplicate-vowel",
      message: "Cluster contains multiple dependent vowels",
    });
  });

  it("rejects a dangling coeng", () => {
    expect(validateKhmer("ក\u17D2").issues.some((issue) => issue.code === "dangling-coeng")).toBe(
      true,
    );
  });

  it("accepts representative modern Khmer", () => {
    expect(validateKhmer("ខ្ញុំស្រឡាញ់ភាសាខ្មែរ").valid).toBe(true);
  });
});
