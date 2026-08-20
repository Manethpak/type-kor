import { describe, expect, it } from "vitest";
import {
  common100Words,
  common250Words,
  common500Words,
  commonKhmerWords,
  generateWords,
  validateWordList,
} from "./wordList";

describe("word list", () => {
  it("contains structurally valid, unique entries", () => {
    for (const list of [common100Words, common250Words, common500Words]) {
      expect(validateWordList(list)).toEqual({ valid: true, errors: [] });
    }
  });

  it("provides cumulative 100, 250, and 500 word pools", () => {
    expect(common100Words.words).toHaveLength(100);
    expect(common250Words.words).toHaveLength(250);
    expect(common500Words.words).toHaveLength(500);
    expect(common250Words.words.slice(0, 100)).toEqual(common100Words.words);
    expect(common500Words.words.slice(0, 250)).toEqual(common250Words.words);
  });

  it("generates deterministic tests without adjacent duplicates", () => {
    const first = generateWords(commonKhmerWords, 25, 42);
    const second = generateWords(commonKhmerWords, 25, 42);
    expect(first).toEqual(second);
    expect(first.every((word, index) => index === 0 || word !== first[index - 1])).toBe(true);
  });
});
