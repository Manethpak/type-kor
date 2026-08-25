import { describe, expect, it } from "vitest";
import {
  advancedDifficultyWords,
  beginnerDifficultyWords,
  frequencyWordEntries,
  generateMixedWords,
  generateWords,
  intermediateDifficultyWords,
} from "./wordList";

describe("word list", () => {
  it("loads the complete frequency dataset with usage metadata", () => {
    expect(frequencyWordEntries).toHaveLength(9428);
    expect(frequencyWordEntries[0]).toMatchObject({
      word: "អនុវត្ត",
      sessions: 1469,
      clients: 788,
    });
  });

  it("scores difficulty from NIDA key presses and coeng usage", () => {
    for (const entry of frequencyWordEntries) {
      expect(entry.difficultyScore).toBe(entry.keyPressCount + entry.coengCount * 2);
      expect(entry.keyPressCount).toBeGreaterThan(0);
    }
  });

  it("partitions every word into stable difficulty lists", () => {
    expect(beginnerDifficultyWords.words).toHaveLength(4073);
    expect(intermediateDifficultyWords.words).toHaveLength(2890);
    expect(advancedDifficultyWords.words).toHaveLength(2465);

    const allDifficultyWords = [
      ...beginnerDifficultyWords.words,
      ...intermediateDifficultyWords.words,
      ...advancedDifficultyWords.words,
    ];
    expect(allDifficultyWords).toHaveLength(frequencyWordEntries.length);
    expect(new Set(allDifficultyWords).size).toBe(frequencyWordEntries.length);
  });

  it("generates deterministic tests without adjacent duplicates", () => {
    const first = generateWords(beginnerDifficultyWords, 25, 42);
    const second = generateWords(beginnerDifficultyWords, 25, 42);
    expect(first).toEqual(second);
    expect(first.every((word, index) => index === 0 || word !== first[index - 1])).toBe(true);
  });

  it("generates a deterministic 50/30/20 mixed difficulty test", () => {
    const first = generateMixedWords(10, 42);
    const second = generateMixedWords(10, 42);
    const difficultyByWord = new Map(
      frequencyWordEntries.map(({ word, difficulty }) => [word, difficulty]),
    );

    expect(first).toEqual(second);
    expect(first).toHaveLength(10);
    expect(first.filter((word) => difficultyByWord.get(word) === "beginner")).toHaveLength(5);
    expect(first.filter((word) => difficultyByWord.get(word) === "intermediate")).toHaveLength(3);
    expect(first.filter((word) => difficultyByWord.get(word) === "advanced")).toHaveLength(2);
  });

  it("shuffles the selected pool before repeating words", () => {
    const generated = generateWords(
      beginnerDifficultyWords,
      beginnerDifficultyWords.words.length,
      42,
    );
    expect(new Set(generated).size).toBe(beginnerDifficultyWords.words.length);
    expect(generated).not.toEqual(beginnerDifficultyWords.words);
  });
});
