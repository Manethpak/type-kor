import { useEffect, useState } from "react";
import type { TestSettings } from "../typing/types";

export const DEFAULT_SETTINGS: TestSettings = {
  mode: "time",
  modeValue: 30,
  wordListSize: 500,
  speedUnit: "cpm",
  theme: "saffron",
  fontSize: 49,
  lineHeight: 1.85,
  sound: false,
  punctuation: false,
};

const SETTINGS_SCHEMA_VERSION = 2;
const STORAGE_KEY = "typekor:settings";

function readSettings(): TestSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<TestSettings> & {
      schemaVersion?: number;
    };

    // Migrate browsers that persisted the original, undersized 43px default.
    if (
      saved.schemaVersion !== SETTINGS_SCHEMA_VERSION &&
      (saved.fontSize === undefined || saved.fontSize === 43)
    ) {
      saved.fontSize = DEFAULT_SETTINGS.fontSize;
    }

    const wordListSize =
      saved.wordListSize === 250 || saved.wordListSize === 500 || saved.wordListSize === 1000
        ? saved.wordListSize
        : DEFAULT_SETTINGS.wordListSize;

    return { ...DEFAULT_SETTINGS, ...saved, wordListSize };
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
