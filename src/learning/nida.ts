import type { PhysicalKeyHint } from "./types";

export type NidaLayer = "base" | "shift" | "altGr";

export interface NidaLayoutKey {
  code: string;
  key: string;
  base: string;
  shift: string;
  altGr: string;
}

const key = (
  code: string,
  latin: string,
  base: string,
  shift: string,
  altGr = "",
): NidaLayoutKey => ({ code, key: latin, base, shift, altGr });

/**
 * Khmer (NIDA), CLDR id km-t-k0-windows-extended.
 * Source: https://unicode.org/cldr/charts/40/keyboards/layouts/km.html
 */
export const NIDA_KEY_ROWS: NidaLayoutKey[][] = [
  [
    key("Backquote", "`", "«", "»", "\u200D"),
    key("Digit1", "1", "១", "!", "\u200C"),
    key("Digit2", "2", "២", "ៗ", "@"),
    key("Digit3", "3", "៣", '"', "៑"),
    key("Digit4", "4", "៤", "៛", "$"),
    key("Digit5", "5", "៥", "%", "€"),
    key("Digit6", "6", "៦", "៍", "៙"),
    key("Digit7", "7", "៧", "័", "៚"),
    key("Digit8", "8", "៨", "៏", "*"),
    key("Digit9", "9", "៩", "(", "{"),
    key("Digit0", "0", "០", ")", "}"),
    key("Minus", "-", "ឥ", "៌", "×"),
    key("Equal", "=", "ឲ", "=", "៎"),
  ],
  [
    key("KeyQ", "Q", "ឆ", "ឈ"),
    key("KeyW", "W", "ឹ", "ឺ"),
    key("KeyE", "E", "េ", "ែ", "ឯ"),
    key("KeyR", "R", "រ", "ឬ", "ឫ"),
    key("KeyT", "T", "ត", "ទ"),
    key("KeyY", "Y", "យ", "ួ"),
    key("KeyU", "U", "ុ", "ូ"),
    key("KeyI", "I", "ិ", "ី", "ឦ"),
    key("KeyO", "O", "ោ", "ៅ", "ឱ"),
    key("KeyP", "P", "ផ", "ភ", "ឰ"),
    key("BracketLeft", "[", "ៀ", "ឿ", "ឩ"),
    key("BracketRight", "]", "ឪ", "ឧ", "ឳ"),
  ],
  [
    key("KeyA", "A", "ា", "ាំ"),
    key("KeyS", "S", "ស", "ៃ"),
    key("KeyD", "D", "ដ", "ឌ"),
    key("KeyF", "F", "ថ", "ធ"),
    key("KeyG", "G", "ង", "អ"),
    key("KeyH", "H", "ហ", "ះ"),
    key("KeyJ", "J", "្", "ញ"),
    key("KeyK", "K", "ក", "គ"),
    key("KeyL", "L", "ល", "ឡ"),
    key("Semicolon", ";", "ើ", "ោះ", "៖"),
    key("Quote", "'", "់", "៉", "ៈ"),
    key("Backslash", "\\", "ឮ", "ឭ", "\\"),
  ],
  [
    key("KeyZ", "Z", "ឋ", "ឍ"),
    key("KeyX", "X", "ខ", "ឃ"),
    key("KeyC", "C", "ច", "ជ"),
    key("KeyV", "V", "វ", "េះ"),
    key("KeyB", "B", "ប", "ព"),
    key("KeyN", "N", "ន", "ណ"),
    key("KeyM", "M", "ម", "ំ"),
    key("Comma", ",", "ុំ", "ុះ", ","),
    key("Period", ".", "។", "៕", "."),
    key("Slash", "/", "៊", "?", "/"),
  ],
  [key("Space", "Space", "\u200B", " ", "\u00A0")],
];

const NIDA_KEYS: Record<string, Omit<PhysicalKeyHint, "output">> = {};

for (const layoutKey of NIDA_KEY_ROWS.flat()) {
  for (const layer of ["base", "shift", "altGr"] as const) {
    const output = layoutKey[layer];
    if (!output || NIDA_KEYS[output]) continue;
    NIDA_KEYS[output] = {
      code: layoutKey.code,
      key: layoutKey.key,
      shift: layer === "shift",
      altGr: layer === "altGr",
    };
  }
}

// Visible test spaces accept the NIDA Space key's zero-width boundary output.
NIDA_KEYS[" "] = { code: "Space", key: "Space", shift: false, altGr: false };

const MULTI_OUTPUTS = Object.keys(NIDA_KEYS)
  .filter((output) => Array.from(output).length > 1)
  .sort((left, right) => right.length - left.length);

export function keySequenceFor(output: string): PhysicalKeyHint[] {
  const hints: PhysicalKeyHint[] = [];
  let remaining = output;

  while (remaining) {
    const combined = MULTI_OUTPUTS.find((candidate) => remaining.startsWith(candidate));
    const character = combined ?? Array.from(remaining)[0];
    const definition = NIDA_KEYS[character];
    if (definition) hints.push({ ...definition, output: character });
    remaining = remaining.slice(character.length);
  }

  return hints;
}

export function keyInstruction(hint: PhysicalKeyHint | undefined): string {
  if (!hint) return "Key guidance unavailable";
  const modifiers = [hint.altGr && "Right Alt (AltGr)", hint.shift && "Shift"].filter(Boolean);
  return `Press ${[...modifiers, hint.key].join(" + ")}`;
}

export function outputForLayer(layoutKey: NidaLayoutKey, layer: NidaLayer): string {
  return layoutKey[layer];
}

export function displayNidaOutput(output: string): string {
  const names: Record<string, string> = {
    "\u200B": "ZWSP",
    "\u200C": "ZWNJ",
    "\u200D": "ZWJ",
    "\u00A0": "NBSP",
    " ": "Space",
  };
  if (names[output]) return names[output];
  if (/^\p{M}+$/u.test(output)) return `◌${output}`;
  return output;
}
