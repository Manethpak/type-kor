import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, normalizeSettings } from "./useAppSettings";

describe("application settings normalization", () => {
  it("accepts supported persisted values", () => {
    expect(
      normalizeSettings({
        schemaVersion: 4,
        mode: "words",
        modeValue: 50,
        wordDifficulty: "mixed",
        speedUnit: "wpm",
        theme: "paper",
        fontSize: "large",
        lineHeight: 2.2,
        sound: true,
        punctuation: true,
      }),
    ).toEqual({
      mode: "words",
      modeValue: 50,
      wordDifficulty: "mixed",
      speedUnit: "wpm",
      theme: "paper",
      fontSize: "large",
      lineHeight: 2.2,
      sound: true,
      punctuation: true,
    });
  });

  it("replaces malformed values with safe defaults", () => {
    expect(
      normalizeSettings({
        schemaVersion: 4,
        mode: "endless",
        modeValue: -1,
        speedUnit: "fast",
        theme: "unknown",
        fontSize: Infinity,
        lineHeight: "wide",
        sound: "yes",
        punctuation: null,
      }),
    ).toEqual(DEFAULT_SETTINGS);
  });

  it("migrates legacy word-list sizes and font settings", () => {
    expect(normalizeSettings({ schemaVersion: 2, wordListSize: 500, fontSize: 43 })).toMatchObject({
      wordDifficulty: "intermediate",
      fontSize: "small",
    });
  });

  it("preserves valid custom test lengths", () => {
    expect(normalizeSettings({ mode: "time", modeValue: 1 })).toMatchObject({
      mode: "time",
      modeValue: 1,
    });
  });
});
