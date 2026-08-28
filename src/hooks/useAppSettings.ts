import { useEffect, useState } from "react";
import type { TestSettings } from "../typing/types";

export const DEFAULT_SETTINGS: TestSettings = {
  mode: "time",
  modeValue: 30,
  wordDifficulty: "beginner",
  speedUnit: "cpm",
  theme: "saffron",
  fontSize: 49,
  lineHeight: 1.85,
  sound: false,
  punctuation: false,
};

const SETTINGS_SCHEMA_VERSION = 3;
const STORAGE_KEY = "typekor:settings";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function numberInRange(value: unknown, minimum: number, maximum: number, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= maximum
    ? value
    : fallback;
}

export function normalizeSettings(value: unknown): TestSettings {
  const saved = isRecord(value) ? value : {};
  const mode = saved.mode === "words" || saved.mode === "time" ? saved.mode : DEFAULT_SETTINGS.mode;
  const defaultModeValue = mode === "time" ? DEFAULT_SETTINGS.modeValue : 25;
  const modeValue =
    typeof saved.modeValue === "number" &&
    Number.isInteger(saved.modeValue) &&
    saved.modeValue >= 1 &&
    saved.modeValue <= (mode === "time" ? 3_600 : 1_000)
      ? saved.modeValue
      : defaultModeValue;
  const legacyDifficulty =
    saved.wordListSize === 250
      ? "beginner"
      : saved.wordListSize === 500
        ? "intermediate"
        : saved.wordListSize === 1000
          ? "advanced"
          : DEFAULT_SETTINGS.wordDifficulty;
  const wordDifficulty =
    saved.wordDifficulty === "beginner" ||
    saved.wordDifficulty === "intermediate" ||
    saved.wordDifficulty === "advanced" ||
    saved.wordDifficulty === "mixed"
      ? saved.wordDifficulty
      : legacyDifficulty;
  const migratedFontSize =
    saved.schemaVersion !== SETTINGS_SCHEMA_VERSION &&
    (saved.fontSize === undefined || saved.fontSize === 43)
      ? DEFAULT_SETTINGS.fontSize
      : saved.fontSize;

  return {
    mode,
    modeValue,
    wordDifficulty,
    speedUnit: saved.speedUnit === "wpm" || saved.speedUnit === "cpm" ? saved.speedUnit : "cpm",
    theme: saved.theme === "paper" || saved.theme === "saffron" ? saved.theme : "saffron",
    fontSize: numberInRange(migratedFontSize, 38, 64, DEFAULT_SETTINGS.fontSize),
    lineHeight: numberInRange(saved.lineHeight, 1.5, 2.2, DEFAULT_SETTINGS.lineHeight),
    sound: typeof saved.sound === "boolean" ? saved.sound : DEFAULT_SETTINGS.sound,
    punctuation:
      typeof saved.punctuation === "boolean" ? saved.punctuation : DEFAULT_SETTINGS.punctuation,
  };
}

function readSettings(): TestSettings {
  try {
    return normalizeSettings(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useAppSettings() {
  const [settings, setSettings] = useState<TestSettings>(readSettings);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...settings, schemaVersion: SETTINGS_SCHEMA_VERSION }),
      );
    } catch {
      // Keep settings available in memory when browser storage is unavailable.
    }
    document.documentElement.dataset.theme = settings.theme;
  }, [settings]);

  return [settings, setSettings] as const;
}
