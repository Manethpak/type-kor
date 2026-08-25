import { describe, expect, it } from "vitest";
import { segmentKhmer } from "../engine/khmer";
import { countInsertedInputErrors } from "./useTypingSession";

describe("input-unit error classification", () => {
  it("accepts each code point in a correct Khmer cluster", () => {
    const prompt = segmentKhmer("ខ្ញុំ");
    expect(countInsertedInputErrors(prompt, 0, "", Array.from("ខ្ញុំ"))).toBe(0);
  });

  it("counts incorrect inserted units before they become a committed cluster", () => {
    const prompt = segmentKhmer("ខ្ញុំ");
    expect(countInsertedInputErrors(prompt, 0, "", ["x"])).toBe(1);
    expect(countInsertedInputErrors(prompt, 0, "x", ["y"])).toBe(1);
  });
});
