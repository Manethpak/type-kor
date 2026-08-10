import { useEffect, useState } from "react";
import type { TestSettings } from "../typing/types";

export const DEFAULT_SETTINGS: TestSettings = {
  mode: "time",
  modeValue: 30,
  speedUnit: "cpm",
  theme: "saffron",
  fontSize: 49,
  lineHeight: 1.85,
  sound: false,
  punctuation: false,
};

const SETTINGS_SCHEMA_VERSION = 2;

function readSettings(): TestSettings {
  try {
    const saved = JSON.parse(localStorage.getItem("typkh:settings") ?? "{}") as Partial<TestSettings> & {
      schemaVersion?: number;
    };

    // Migrate browsers that persisted the original, undersized 43px default.
    if (saved.schemaVersion !== SETTINGS_SCHEMA_VERSION && (saved.fontSize === undefined || saved.fontSize === 43)) {
      saved.fontSize = DEFAULT_SETTINGS.fontSize;
    }

    return { ...DEFAULT_SETTINGS, ...saved };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useAppSettings() {
  const [settings, setSettings] = useState<TestSettings>(readSettings);

  useEffect(() => {
    localStorage.setItem("typkh:settings", JSON.stringify({ ...settings, schemaVersion: SETTINGS_SCHEMA_VERSION }));
    document.documentElement.dataset.theme = settings.theme;
  }, [settings]);

  return [settings, setSettings] as const;
}
