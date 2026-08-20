import { canonicalizeKhmer, validateKhmer } from "../engine/khmer";
import { frequencyWords500 } from "./wordLists.generated";

export interface WordList {
  id: string;
  name: string;
  version: number;
  difficulty: "common" | "intermediate" | "advanced";
  words: string[];
  source: string;
  reviewedBy: string;
}

const source = "Hugging Face: seanghay/khmer-search-frequency (ranked by search frequency)";
const reviewedBy = "Frequency-derived; native-speaker review pending";

function createWordList(id: string, name: string, count: number): WordList {
  return {
    id,
    name,
    version: 1,
    difficulty: "common",
    source,
    reviewedBy,
    words: [...frequencyWords500.slice(0, count)],
  };
}

export const common100Words = createWordList("km-common-100", "ពាក្យទូទៅ ១០០", 100);
export const common250Words = createWordList("km-common-250", "ពាក្យទូទៅ ២៥០", 250);
export const common500Words = createWordList("km-common-500", "ពាក្យទូទៅ ៥០០", 500);

export const commonWordLists = {
  100: common100Words,
  250: common250Words,
  500: common500Words,
} as const;

// The mid-sized pool remains the default for existing typing sessions.
export const commonKhmerWords = common250Words;

export interface WordListValidation {
  valid: boolean;
  errors: string[];
}

export function validateWordList(list: WordList): WordListValidation {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const word of list.words) {
    const validation = validateKhmer(word);
    if (!validation.valid)
      errors.push(`${word}: ${validation.issues.map((issue) => issue.code).join(", ")}`);
    if (/[\s\u200B]/u.test(word))
      errors.push(`${word}: entries must be single whitespace-free tokens`);
    const key = canonicalizeKhmer(word);
    if (seen.has(key)) errors.push(`${word}: duplicate normalization key`);
    seen.add(key);
  }
  return { valid: errors.length === 0, errors };
}

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateWords(list: WordList, count: number, seed: number): string[] {
  const random = mulberry32(seed);
  const result: string[] = [];
  let previous = "";
  while (result.length < count) {
    const word = list.words[Math.floor(random() * list.words.length)];
    if (word !== previous || list.words.length === 1) {
      result.push(word);
      previous = word;
    }
  }
  return result;
}
