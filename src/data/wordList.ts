import { canonicalizeKhmer, validateKhmer } from "../engine/khmer";
import { frequencyWords1000 } from "./wordLists.generated";

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
    words: [...frequencyWords1000.slice(0, count)],
  };
}

export const common250Words = createWordList("km-common-250", "ពាក្យទូទៅ ២៥០", 250);
export const common500Words = createWordList("km-common-500", "ពាក្យទូទៅ ៥០០", 500);
export const common1000Words = createWordList("km-common-1000", "ពាក្យទូទៅ ១០០០", 1000);

export const commonWordLists = {
  250: common250Words,
  500: common500Words,
  1000: common1000Words,
} as const;

export const commonKhmerWords = common500Words;

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
  let pool: string[] = [];

  const refill = () => {
    pool = [...list.words];
    for (let index = pool.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
    }

    if (pool.length > 1 && pool[pool.length - 1] === previous) {
      [pool[pool.length - 1], pool[pool.length - 2]] = [
        pool[pool.length - 2],
        pool[pool.length - 1],
      ];
    }
  };

  while (result.length < count) {
    if (pool.length === 0) refill();
    const word = pool.pop()!;
    result.push(word);
    previous = word;
  }
  return result;
}
