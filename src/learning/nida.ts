import type { PhysicalKeyHint } from "./types";

type KeyDefinition = Omit<PhysicalKeyHint, "output">;

const NIDA_KEYS: Record<string, KeyDefinition> = {
  "១": { code: "Digit1", key: "1", shift: false },
  "២": { code: "Digit2", key: "2", shift: false },
  "៣": { code: "Digit3", key: "3", shift: false },
  "៤": { code: "Digit4", key: "4", shift: false },
  "៥": { code: "Digit5", key: "5", shift: false },
  "៦": { code: "Digit6", key: "6", shift: false },
  "៧": { code: "Digit7", key: "7", shift: false },
  "៨": { code: "Digit8", key: "8", shift: false },
  "៩": { code: "Digit9", key: "9", shift: false },
  "០": { code: "Digit0", key: "0", shift: false },
  ឆ: { code: "KeyQ", key: "Q", shift: false },
  "ឹ": { code: "KeyW", key: "W", shift: false },
  "េ": { code: "KeyE", key: "E", shift: false },
  រ: { code: "KeyR", key: "R", shift: false },
  ត: { code: "KeyT", key: "T", shift: false },
  យ: { code: "KeyY", key: "Y", shift: false },
  "ុ": { code: "KeyU", key: "U", shift: false },
  "ិ": { code: "KeyI", key: "I", shift: false },
  "ោ": { code: "KeyO", key: "O", shift: false },
  ផ: { code: "KeyP", key: "P", shift: false },
  "ៀ": { code: "BracketLeft", key: "[", shift: false },
  ឪ: { code: "BracketRight", key: "]", shift: false },
  "ា": { code: "KeyA", key: "A", shift: false },
  ស: { code: "KeyS", key: "S", shift: false },
  ដ: { code: "KeyD", key: "D", shift: false },
  ថ: { code: "KeyF", key: "F", shift: false },
  ង: { code: "KeyG", key: "G", shift: false },
  ហ: { code: "KeyH", key: "H", shift: false },
  "្": { code: "KeyJ", key: "J", shift: false },
  ក: { code: "KeyK", key: "K", shift: false },
  ល: { code: "KeyL", key: "L", shift: false },
  "ើ": { code: "Semicolon", key: ";", shift: false },
  "់": { code: "Quote", key: "'", shift: false },
  ឋ: { code: "KeyZ", key: "Z", shift: false },
  ខ: { code: "KeyX", key: "X", shift: false },
  ច: { code: "KeyC", key: "C", shift: false },
  វ: { code: "KeyV", key: "V", shift: false },
  ប: { code: "KeyB", key: "B", shift: false },
  ន: { code: "KeyN", key: "N", shift: false },
  ម: { code: "KeyM", key: "M", shift: false },
  "ុំ": { code: "Comma", key: ",", shift: false },
  "។": { code: "Period", key: ".", shift: false },
  "៊": { code: "Slash", key: "/", shift: false },
  ឈ: { code: "KeyQ", key: "Q", shift: true },
  "ឺ": { code: "KeyW", key: "W", shift: true },
  "ែ": { code: "KeyE", key: "E", shift: true },
  ឬ: { code: "KeyR", key: "R", shift: true },
  ទ: { code: "KeyT", key: "T", shift: true },
  "ួ": { code: "KeyY", key: "Y", shift: true },
  "ូ": { code: "KeyU", key: "U", shift: true },
  "ី": { code: "KeyI", key: "I", shift: true },
  "ៅ": { code: "KeyO", key: "O", shift: true },
  ភ: { code: "KeyP", key: "P", shift: true },
  "ឿ": { code: "BracketLeft", key: "[", shift: true },
  ឧ: { code: "BracketRight", key: "]", shift: true },
  "ាំ": { code: "KeyA", key: "A", shift: true },
  "ៃ": { code: "KeyS", key: "S", shift: true },
  ឌ: { code: "KeyD", key: "D", shift: true },
  ធ: { code: "KeyF", key: "F", shift: true },
  អ: { code: "KeyG", key: "G", shift: true },
  "ះ": { code: "KeyH", key: "H", shift: true },
  ញ: { code: "KeyJ", key: "J", shift: true },
  គ: { code: "KeyK", key: "K", shift: true },
  ឡ: { code: "KeyL", key: "L", shift: true },
  "ោះ": { code: "Semicolon", key: ";", shift: true },
  "៉": { code: "Quote", key: "'", shift: true },
  ឍ: { code: "KeyZ", key: "Z", shift: true },
  ឃ: { code: "KeyX", key: "X", shift: true },
  ជ: { code: "KeyC", key: "C", shift: true },
  "េះ": { code: "KeyV", key: "V", shift: true },
  ព: { code: "KeyB", key: "B", shift: true },
  ណ: { code: "KeyN", key: "N", shift: true },
  "ំ": { code: "KeyM", key: "M", shift: true },
  "ុះ": { code: "Comma", key: ",", shift: true },
  "៕": { code: "Period", key: ".", shift: true },
  " ": { code: "Space", key: "Space", shift: false },
};

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
  return `Press ${hint.shift ? "Shift + " : ""}${hint.key}`;
}
