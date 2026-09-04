import { describe, expect, it } from "vitest";
import { keyHintFor, keyInstruction, keySequenceFor, NIDA_KEY_ROWS } from "./nida";

function layoutKey(code: string) {
  return NIDA_KEY_ROWS.flat().find((item) => item.code === code)!;
}

describe("Khmer NIDA keyboard", () => {
  it("maps every physical character key across base, Shift, and AltGr layers", () => {
    expect(layoutKey("KeyK")).toMatchObject({ base: "ក", shift: "គ" });
    expect(layoutKey("Digit1")).toMatchObject({ base: "១", shift: "!", altGr: "\u200C" });
    expect(layoutKey("Digit2")).toMatchObject({ base: "២", shift: "ៗ", altGr: "@" });
    expect(layoutKey("Minus")).toMatchObject({ base: "ឥ", shift: "៌", altGr: "×" });
    expect(layoutKey("Equal")).toMatchObject({ base: "ឲ", shift: "=", altGr: "៎" });
    expect(layoutKey("Backslash")).toMatchObject({ base: "ឮ", shift: "ឭ", altGr: "\\" });
    expect(layoutKey("Slash")).toMatchObject({ base: "៊", shift: "?", altGr: "/" });
  });

  it("derives accurate lesson hints from the complete layout", () => {
    expect(keySequenceFor("ក")[0]).toMatchObject({
      code: "KeyK",
      shift: false,
      altGr: false,
    });
    expect(keySequenceFor("គ")[0]).toMatchObject({
      code: "KeyK",
      shift: true,
      altGr: false,
    });
    expect(keySequenceFor("ឱ")[0]).toMatchObject({
      code: "KeyO",
      shift: false,
      altGr: true,
    });
    expect(keyInstruction(keySequenceFor("ឱ")[0])).toBe("Press Right Alt (AltGr) + O");
  });

  it("includes the complete US physical key rows plus Space", () => {
    expect(NIDA_KEY_ROWS.map((row) => row.length)).toEqual([13, 13, 11, 10, 1]);
    expect(NIDA_KEY_ROWS.flat().map((item) => item.code)).toContain("Backquote");
    expect(NIDA_KEY_ROWS.flat().map((item) => item.code)).toContain("BracketLeft");
    expect(NIDA_KEY_ROWS.flat().map((item) => item.code)).toContain("Quote");
    expect(NIDA_KEY_ROWS.flat().map((item) => item.code)).toContain("Space");
  });

  it("creates exact modifier-aware targets for key drills", () => {
    expect(keyHintFor("Space", "base")).toMatchObject({ output: "\u200B", shift: false });
    expect(keyHintFor("Space", "shift")).toMatchObject({ output: " ", shift: true });
    expect(keyHintFor("Space", "altGr")).toMatchObject({ output: "\u00A0", altGr: true });
  });
});
