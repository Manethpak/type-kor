import { useCallback, useState } from "react";
import type { ExperienceMode } from "../learning/types";

export interface AppState {
  schemaVersion: 1;
  onboardingCompleted: boolean;
  lastExperience: ExperienceMode;
}

const STORAGE_KEY = "typkh:app-state";
const DEFAULT_APP_STATE: AppState = {
  schemaVersion: 1,
  onboardingCompleted: false,
  lastExperience: "test",
};

function isExperience(value: unknown): value is ExperienceMode {
  return value === "learn" || value === "test";
}

function readAppState(): AppState {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "null",
    ) as Partial<AppState> | null;
    if (!saved || saved.schemaVersion !== 1) return DEFAULT_APP_STATE;
    return {
      schemaVersion: 1,
      onboardingCompleted: saved.onboardingCompleted === true,
      lastExperience: isExperience(saved.lastExperience) ? saved.lastExperience : "test",
    };
  } catch {
    return DEFAULT_APP_STATE;
  }
}

function persistAppState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // State remains usable in memory when storage is unavailable.
  }
}

export function useAppState() {
  const [appState, setAppStateValue] = useState<AppState>(readAppState);

  const updateAppState = useCallback((update: (current: AppState) => AppState) => {
    setAppStateValue((current) => {
      const next = update(current);
      persistAppState(next);
      return next;
    });
  }, []);

  const completeOnboarding = useCallback(
    (lastExperience: ExperienceMode) =>
      updateAppState(() => ({ schemaVersion: 1, onboardingCompleted: true, lastExperience })),
    [updateAppState],
  );

  const setLastExperience = useCallback(
    (lastExperience: ExperienceMode) =>
      updateAppState((current) =>
        current.lastExperience === lastExperience ? current : { ...current, lastExperience },
      ),
    [updateAppState],
  );

  return { appState, completeOnboarding, setLastExperience };
}
