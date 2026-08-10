/**
 * Modern Khmer structural normalization.
 *
 * Ported from the reference algorithm in Unicode Technical Note #61 v2,
 * Copyright (c) 2021-2024 SIL Global, used under the MIT License.
 * https://www.unicode.org/notes/tn61/
 */
import type {
  KhmerTextEngine,
  MatchStatus,
  OrthographicCluster,
  ValidationIssue,
  ValidationResult,
} from "./types";

enum Category {
  Other = 0,
  Base = 1,
  Robat = 2,
  Coeng = 3,
  Shift = 4,
  Z = 5,
  VPre = 6,
  VBelow = 7,
  VAbove = 8,
  VPost = 9,
  Modifier = 10,
  Final = 11,
  FinalCoeng = 12,
}

const BASE = /[\u1780-\u17A2\u17A5-\u17B3]/u;
const KHMER_RUN = /[\u1780-\u17FF\u19E0-\u19FF\u200C\u200D]+/gu;
const KHMER_CHAR = /[\u1780-\u17FF\u19E0-\u19FF]/u;
const KHMER_MARK = /[\u17B4-\u17D3\u17DD]/u;
const CONTROL = /[\p{Cc}\p{Cf}]/u;

/**
 * Input methods use different space characters for Khmer boundaries. Unicode
 * explicitly recommends U+200B as an invisible word-boundary opportunity for
 * Khmer, while U+0020 is used for visible phrase spacing. Inside a typing test
 * they are equivalent actions, so comparison uses one stable boundary key.
 *
 * ZWNJ and ZWJ are deliberately excluded: they participate in Khmer shaping.
 */
const TEST_BOUNDARY = /[\u00A0\u200B\u202F]/gu;

export function normalizeTestBoundaries(input: string): string {
  return input.replace(TEST_BOUNDARY, " ");
}

function categoryFor(character: string): Category {
  const code = character.codePointAt(0)!;
  if ((code >= 0x1780 && code <= 0x17a2) || (code >= 0x17a5 && code <= 0x17b3)) {
    return Category.Base;
  }
  if (code === 0x17cc) return Category.Robat;
  if (code === 0x17d2) return Category.Coeng;
  if (code === 0x17c9 || code === 0x17ca) return Category.Shift;
  if (code === 0x200c) return Category.Z;
  if (code === 0x200d) return Category.FinalCoeng;
  if (code >= 0x17be && code <= 0x17c5) return Category.VPre;
  if (code >= 0x17bb && code <= 0x17bd) return Category.VBelow;
  if (code >= 0x17b7 && code <= 0x17ba) return Category.VAbove;
  if (code === 0x17b6) return Category.VPost;
  if (code === 0x17c7 || code === 0x17c8) return Category.Final;
  if (
    code === 0x17c6 || code === 0x17cb ||
    (code >= 0x17cd && code <= 0x17d1) || code === 0x17d3 || code === 0x17dd
  ) return Category.Modifier;
  return Category.Other;
}

function lunarSymbol(tens: string, digit: string, base: number, original: string): string {
  const value = (tens ? 10 : 0) + (digit.codePointAt(0)! - 0x17e0);
  return value <= 15 ? String.fromCodePoint(base + value) : original;
}

const S1 = "[\\u1780-\\u1783\\u1785-\\u1788\\u178A-\\u178D\\u178F-\\u1792\\u1795-\\u1797\\u179E-\\u17A0\\u17A2]";
const S2 = "[\\u1784\\u1789\\u178E\\u1793\\u1794\\u1798-\\u179D\\u17A1\\u17A5-\\u17B3]";
const B = "[\\u1780-\\u17A2\\u17A5-\\u17B3]";
const NON_RO = "[\\u1780-\\u1799\\u179B-\\u17A2\\u17A5-\\u17B3]";
const NON_BA = "[\\u1780-\\u1793\\u1795-\\u17A2\\u17A5-\\u17B3]";
const COENG = `(?:(?:\\u17D2${NON_RO})?\\u17D2${B})`;
const STRONG = `(?:${S1}\\u17CC?(?:\\u17D2${NON_BA}(?:\\u17D2${NON_BA})?)?|${NON_BA}\\u17CC?(?:\\u17D2${S1}(?:\\u17D2${NON_BA})?|\\u17D2${NON_BA}\\u17D2${S1}))`;
const NON_STRONG = `(?:${S2}\\u17CC?(?:\\u17D2${S2}(?:\\u17D2${S2})?)?|\\u1794\\u17CC?(?:${COENG}(?:${COENG})?)?|${B}\\u17CC?(?:\\u17D2${NON_RO}\\u17D2\\u1794|\\u17D2\\u1794(?:\\u17D2${B})))`;
const FOLLOWING_VOWEL = "[\\u17B7-\\u17BA\\u17BE\\u17BF\\u17DD]|\\u17B6\\u17C6";

function normalizeSyllable(input: string): string {
  let output = input
    .replace(/(\u200D?\u17D2)[\u17D2\u200C\u200D]+/gu, "$1")
    .replace(/\u17BE\u17B6/gu, "\u17C4\u17B8")
    .replace(/\u17C1([\u17BB-\u17BD]?)\u17B8/gu, "\u17BE$1")
    .replace(/\u17C1([\u17BB-\u17BD]?)\u17B6/gu, "\u17C4$1")
    .replace(/(\u17BE)(\u17BB)/gu, "$2$1");

  output = output.replace(
    new RegExp(`(${STRONG}[\\u17C1-\\u17C5]?)\\u17BB(?=${FOLLOWING_VOWEL}|\\u17D0)`, "gu"),
    "$1\u17CA",
  );
  output = output.replace(
    new RegExp(`(${NON_STRONG}[\\u17C1-\\u17C5]?)\\u17BB(?=${FOLLOWING_VOWEL}|\\u17D0)`, "gu"),
    "$1\u17C9",
  );

  return output
    .replace(/(\u17D2\u179A)(\u17D2[\u1780-\u17B3])/gu, "$2$1")
    .replace(/\u17D2\u178A/gu, "\u17D2\u178F");
}

function normalizeKhmerRun(run: string): string {
  const characters = Array.from(run);
  const categories = characters.map(categoryFor);

  for (let index = 1; index < characters.length; index += 1) {
    if (
      (characters[index - 1] === "\u17D2" || characters[index - 1] === "\u200D") &&
      (categories[index] === Category.Base || categories[index] === Category.Coeng)
    ) {
      categories[index] = categories[index - 1];
    }
  }

  const output: string[] = [];
  let index = 0;
  while (index < characters.length) {
    if (categories[index] !== Category.Base) {
      output.push(characters[index]);
      index += 1;
      continue;
    }

    let end = index + 1;
    while (end < characters.length && categories[end] > Category.Base) end += 1;
    const ordered = Array.from({ length: end - index }, (_, offset) => index + offset)
      .sort((a, b) => categories[a] - categories[b] || a - b)
      .map((position) => characters[position])
      .join("");
    output.push(normalizeSyllable(ordered));
    index = end;
  }

  return output.join("")
    .replace(/(\u17E1?)([\u17E0-\u17E9])\u17D2\u17D4/gu, (match, tens: string, digit: string) =>
      lunarSymbol(tens, digit, 0x19e0, match))
    .replace(/\u17D4\u17D2(\u17E1?)([\u17E0-\u17E9])/gu, (match, tens: string, digit: string) =>
      lunarSymbol(tens, digit, 0x19f0, match))
    .replace(/\u17D4\u17D2\u17D4/gu, "\u19F0");
}

export function canonicalizeKhmer(input: string): string {
  input = normalizeTestBoundaries(input);
  let result = "";
  let previousEnd = 0;
  for (const match of input.matchAll(KHMER_RUN)) {
    const start = match.index;
    result += input.slice(previousEnd, start).normalize("NFC");
    result += normalizeKhmerRun(match[0]);
    previousEnd = start + match[0].length;
  }
  return result + input.slice(previousEnd).normalize("NFC");
}

function segmentNormalized(input: string): OrthographicCluster[] {
  const characters = Array.from(input);
  const offsets: number[] = [];
  let utf16Offset = 0;
  for (const character of characters) {
    offsets.push(utf16Offset);
    utf16Offset += character.length;
  }
  offsets.push(utf16Offset);

  const categories = characters.map(categoryFor);
  for (let index = 1; index < characters.length; index += 1) {
    if (
      (characters[index - 1] === "\u17D2" || characters[index - 1] === "\u200D") &&
      categories[index] === Category.Base
    ) categories[index] = categories[index - 1];
  }

  const clusters: OrthographicCluster[] = [];
  let index = 0;
  while (index < characters.length) {
    const start = index;
    const isBase = categories[index] === Category.Base;
    if (isBase) {
      index += 1;
      while (index < characters.length && categories[index] > Category.Base) index += 1;
    } else {
      index += 1;
    }
    const display = characters.slice(start, index).join("");
    clusters.push({
      display,
      comparisonKey: display,
      start: offsets[start],
      end: offsets[index],
      kind: /^\s+$/u.test(display) ? "space" : KHMER_CHAR.test(display) ? "khmer" : "punctuation",
    });
  }
  return clusters;
}

export function segmentKhmer(input: string): OrthographicCluster[] {
  return segmentNormalized(canonicalizeKhmer(input));
}

export function validateKhmer(input: string): ValidationResult {
  const normalized = canonicalizeKhmer(input);
  const issues: ValidationIssue[] = [];
  const characters = Array.from(normalized);
  let offset = 0;

  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index];
    if (CONTROL.test(character) && character !== "\n" && character !== "\t" && character !== "\u200C" && character !== "\u200D") {
      issues.push({ index: offset, code: "unsupported-control", message: "Unsupported control character" });
    }
    if (character === "\u17D2" && !BASE.test(characters[index + 1] ?? "")) {
      issues.push({ index: offset, code: "dangling-coeng", message: "COENG must be followed by a Khmer base" });
    }
    if (KHMER_MARK.test(character) && (index === 0 || (!BASE.test(characters[index - 1]) && categoryFor(characters[index - 1]) === Category.Other))) {
      issues.push({ index: offset, code: "orphan-mark", message: "Khmer mark has no base" });
    }
    offset += character.length;
  }

  for (const cluster of segmentNormalized(normalized)) {
    if (cluster.kind !== "khmer") continue;
    const vowels = Array.from(cluster.display).filter((character) => {
      const category = categoryFor(character);
      return category >= Category.VPre && category <= Category.VPost;
    });
    if (vowels.length > 1) {
      issues.push({ index: cluster.start, code: "duplicate-vowel", message: "Cluster contains multiple dependent vowels" });
    }
  }

  return { valid: issues.length === 0, normalized, issues };
}

export const khmerTextEngine: KhmerTextEngine = {
  canonicalize: canonicalizeKhmer,
  validate: validateKhmer,
  segment: segmentKhmer,
  compare(target, rawAttempt): MatchStatus {
    const attempt = canonicalizeKhmer(rawAttempt);
    if (attempt === target.comparisonKey) return "correct";
    if (attempt.length === 0 || target.comparisonKey.startsWith(attempt)) return "prefix";
    return "incorrect";
  },
};
