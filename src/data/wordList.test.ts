import { describe, expect, it } from "vitest";
import {
  common1000Words,
  common250Words,
  common500Words,
  commonKhmerWords,
  generateWords,
  validateWordList,
} from "./wordList";

describe("word list", () => {
  it("contains structurally valid, unique entries", () => {
    for (const list of [common250Words, common500Words, common1000Words]) {
      expect(validateWordList(list)).toEqual({ valid: true, errors: [] });
    }
  });

  it("provides cumulative 250, 500, and 1000 word pools", () => {
    expect(common250Words.words).toHaveLength(250);
    expect(common500Words.words).toHaveLength(500);
    expect(common1000Words.words).toHaveLength(1000);
    expect(common500Words.words.slice(0, 250)).toEqual(common250Words.words);
    expect(common1000Words.words.slice(0, 500)).toEqual(common500Words.words);
  });

  it("generates deterministic tests without adjacent duplicates", () => {
    const first = generateWords(commonKhmerWords, 25, 42);
    const second = generateWords(commonKhmerWords, 25, 42);
    expect(first).toEqual(second);
    expect(first.every((word, index) => index === 0 || word !== first[index - 1])).toBe(true);
  });

  it("shuffles the selected pool before repeating words", () => {
    const generated = generateWords(common250Words, 250, 42);
    expect(new Set(generated).size).toBe(250);
    expect(generated).not.toEqual(common250Words.words);
  });
});
