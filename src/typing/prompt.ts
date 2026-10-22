import { difficultyWordLists, generateMixedWords, generateWords } from "../data/wordList";
import { khmerTextEngine } from "../engine/khmer";
import type { KhmerCharacterCluster } from "../engine/types";
import type { TestSettings } from "./types";

export function createTypingPrompt(settings: TestSettings, seed: number): KhmerCharacterCluster[] {
  const count = settings.mode === "words" ? settings.modeValue : 90;
  const selectedWords =
    settings.wordDifficulty === "mixed"
      ? generateMixedWords(count, seed)
      : generateWords(difficultyWordLists[settings.wordDifficulty], count, seed);
  const words = selectedWords.map((word, index) =>
    settings.punctuation && index > 0 && (index + 1) % 12 === 0 ? `${word}។` : word,
  );
  return khmerTextEngine.cluster(words.join(" "));
}
