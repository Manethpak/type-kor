import { canonicalizeKhmer, validateKhmer } from "../engine/khmer";
import { keySequenceFor } from "../learning/nida";
import frequencyWordsCsv from "./khmer-search-frequency.csv?raw";

export type WordDifficulty = "beginner" | "intermediate" | "advanced";
export type WordDifficultySelection = WordDifficulty | "mixed";

export interface FrequencyWordEntry {
  word: string;
  sessions: number;
  clients: number;
  keyPressCount: number;
  coengCount: number;
  difficultyScore: number;
  difficulty: WordDifficulty;
}

export const BEGINNER_MAX_DIFFICULTY_SCORE = 6;
export const INTERMEDIATE_MAX_DIFFICULTY_SCORE = 8;

function classifyDifficulty(score: number): WordDifficulty {
  if (score <= BEGINNER_MAX_DIFFICULTY_SCORE) return "beginner";
  if (score <= INTERMEDIATE_MAX_DIFFICULTY_SCORE) return "intermediate";
  return "advanced";
}

function parseFrequencyWords(csv: string): FrequencyWordEntry[] {
  const [header, ...rows] = csv.trim().split(/\r?\n/u);
  if (header !== "word,sessions,clients") throw new Error(`Unexpected word-list header: ${header}`);

  const entries = rows.map((row, index) => {
    const [word, sessionsValue, clientsValue, ...extra] = row.split(",");
    const sessions = Number(sessionsValue);
    const clients = Number(clientsValue);
    if (
      extra.length > 0 ||
      !word ||
      /\s/u.test(word) ||
      !/^\d+$/u.test(sessionsValue ?? "") ||
      !/^\d+$/u.test(clientsValue ?? "") ||
      !Number.isInteger(sessions) ||
      !Number.isInteger(clients)
    ) {
      throw new Error(`Invalid word-list row ${index + 2}: ${row}`);
    }
    const keyPressCount = keySequenceFor(word).length;
    const coengCount = Array.from(word).filter((character) => character === "\u17D2").length;
    const difficultyScore = keyPressCount + coengCount * 2;
    return {
      word,
      sessions,
      clients,
      keyPressCount,
      coengCount,
      difficultyScore,
      difficulty: classifyDifficulty(difficultyScore),
    };
  });

  if (new Set(entries.map(({ word }) => word)).size !== entries.length) {
    throw new Error("Word list contains duplicate words");
  }
  return entries;
}

export const frequencyWordEntries = parseFrequencyWords(frequencyWordsCsv);
export const frequencyWords = frequencyWordEntries.map(({ word }) => word);

export interface WordList {
  id: string;
  name: string;
  version: number;
  difficulty: WordDifficulty;
  words: string[];
  source: string;
  reviewedBy: string;
}

const source = "Hugging Face: seanghay/khmer-search-frequency (ranked by search frequency)";

function createDifficultyWordList(difficulty: WordDifficulty, name: string): WordList {
  return {
    id: `km-difficulty-${difficulty}`,
    name,
    version: 1,
    difficulty,
    source,
    reviewedBy: "Difficulty derived from NIDA key-press length and coeng count",
    words: frequencyWordEntries
      .filter((entry) => entry.difficulty === difficulty)
      .map(({ word }) => word),
  };
}

export const beginnerDifficultyWords = createDifficultyWordList("beginner", "ពាក្យកម្រិតដំបូង");
export const intermediateDifficultyWords = createDifficultyWordList("intermediate", "ពាក្យកម្រិតមធ្យម");
export const advancedDifficultyWords = createDifficultyWordList("advanced", "ពាក្យកម្រិតខ្ពស់");

export const difficultyWordLists = {
  beginner: beginnerDifficultyWords,
  intermediate: intermediateDifficultyWords,
  advanced: advancedDifficultyWords,
} as const;

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

export function generateMixedWords(count: number, seed: number): string[] {
  const total = Math.max(0, Math.floor(count));
  const weights = [0.5, 0.3, 0.2];
  const counts = weights.map((weight) => Math.floor(total * weight));
  const priorities = weights
    .map((weight, index) => ({ index, remainder: total * weight - counts[index] }))
    .sort((left, right) => right.remainder - left.remainder || left.index - right.index);
  const unassigned = total - counts.reduce((sum, value) => sum + value, 0);
  for (let index = 0; index < unassigned; index += 1) {
    counts[priorities[index].index] += 1;
  }

  const [beginnerCount, intermediateCount, advancedCount] = counts;
  const words = [
    ...generateWords(beginnerDifficultyWords, beginnerCount, seed),
    ...generateWords(intermediateDifficultyWords, intermediateCount, seed + 1),
    ...generateWords(advancedDifficultyWords, advancedCount, seed + 2),
  ];
  const random = mulberry32(seed + 3);

  for (let index = words.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [words[index], words[swapIndex]] = [words[swapIndex], words[index]];
  }
  return words;
}
