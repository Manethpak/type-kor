import { canonicalizeKhmer, validateKhmer } from "../engine/khmer";

export interface WordList {
  id: string;
  name: string;
  version: number;
  difficulty: "common" | "intermediate" | "advanced";
  words: string[];
  source: string;
  reviewedBy: string;
}

// Development seed only. Replace with the owner-supplied, native-reviewed list before launch.
export const commonKhmerWords: WordList = {
  id: "km-demo-common",
  name: "ពាក្យទូទៅ",
  version: 1,
  difficulty: "common",
  source: "Development seed list",
  reviewedBy: "Pending owner and native-speaker review",
  words: [
    "ខ្ញុំ", "អ្នក", "យើង", "គេ", "នេះ", "នោះ", "មួយ", "ពីរ", "បី", "ច្រើន",
    "តិច", "មាន", "គ្មាន", "ជា", "នៅ", "ទៅ", "មក", "ធ្វើ", "និយាយ", "សរសេរ",
    "អាន", "រៀន", "ស្គាល់", "គិត", "ឃើញ", "ស្តាប់", "ស្រឡាញ់", "ចង់", "អាច", "ត្រូវ",
    "ថ្ងៃ", "យប់", "ពេល", "ឆ្នាំ", "ថ្មី", "ល្អ", "ធំ", "តូច", "វែង", "ខ្លី",
    "ផ្ទះ", "សាលា", "ការងារ", "មនុស្ស", "កុមារ", "មិត្ត", "គ្រួសារ", "ប្រទេស", "ទីក្រុង", "ភូមិ",
    "ទឹក", "បាយ", "ម្ហូប", "ផ្លែឈើ", "ផ្លូវ", "ឡាន", "កង់", "ដើរ", "រត់", "លេង",
    "ភាសា", "ខ្មែរ", "អក្សរ", "ពាក្យ", "សំឡេង", "ចំណេះ", "គំនិត", "សំណួរ", "ចម្លើយ", "រឿង",
    "ស្អាត", "សប្បាយ", "រីករាយ", "ស្ងប់", "រហ័ស", "យឺត", "ងាយ", "ពិបាក", "ត្រឹមត្រូវ", "សំខាន់",
  ],
};

export interface WordListValidation {
  valid: boolean;
  errors: string[];
}

export function validateWordList(list: WordList): WordListValidation {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const word of list.words) {
    const validation = validateKhmer(word);
    if (!validation.valid) errors.push(`${word}: ${validation.issues.map((issue) => issue.code).join(", ")}`);
    if (/[\s\u200B]/u.test(word)) errors.push(`${word}: entries must be single whitespace-free tokens`);
    const key = canonicalizeKhmer(word);
    if (seen.has(key)) errors.push(`${word}: duplicate normalization key`);
    seen.add(key);
  }
  return { valid: errors.length === 0, errors };
}

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = seed + 0x6d2b79f5 | 0;
    let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
    value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
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
