import { describe, expect, it } from "vitest";
import { commonKhmerWords, generateWords, validateWordList } from "./wordList";

describe("word list", () => {
  it("contains structurally valid, unique entries", () => {
    expect(validateWordList(commonKhmerWords)).toEqual({ valid: true, errors: [] });
  });

  it("generates deterministic tests without adjacent duplicates", () => {
    const first = generateWords(commonKhmerWords, 25, 42);
    const second = generateWords(commonKhmerWords, 25, 42);
    expect(first).toEqual(second);
    expect(first.every((word, index) => index === 0 || word !== first[index - 1])).toBe(true);
  });
});
