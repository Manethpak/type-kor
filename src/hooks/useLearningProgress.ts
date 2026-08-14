import { useCallback, useState } from "react";
import { getLesson, lessons } from "../learning/curriculum";
import type { LearningState, LessonCheckpoint, LessonProgress } from "../learning/types";

const STORAGE_KEY = "typkh:learning";
const DEFAULT_LEARNING_STATE: LearningState = {
  schemaVersion: 1,
  progress: {},
  checkpoint: null,
};

function validProgress(value: unknown): value is LessonProgress {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<LessonProgress>;
  return (
    typeof item.attempts === "number" &&
    Number.isFinite(item.attempts) &&
    typeof item.bestAccuracy === "number" &&
    Number.isFinite(item.bestAccuracy) &&
    (item.completedAt === null || typeof item.completedAt === "string") &&
    (item.masteredAt === null || typeof item.masteredAt === "string")
  );
}

function validCheckpoint(value: unknown): value is LessonCheckpoint {
  if (!value || typeof value !== "object") return false;
  const checkpoint = value as Partial<LessonCheckpoint>;
  const lesson = getLesson(checkpoint.lessonId);
  return Boolean(
    lesson &&
    Number.isInteger(checkpoint.stepIndex) &&
    checkpoint.stepIndex! >= 0 &&
    checkpoint.stepIndex! < lesson.steps.length &&
    Number.isInteger(checkpoint.errors) &&
    checkpoint.errors! >= 0,
  );
}

function readLearningState(): LearningState {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "null",
    ) as Partial<LearningState> | null;
    if (!saved || saved.schemaVersion !== 1) return DEFAULT_LEARNING_STATE;

    const progress: Record<string, LessonProgress> = {};
    for (const lesson of lessons) {
      const candidate = saved.progress?.[lesson.id];
      if (validProgress(candidate)) progress[lesson.id] = candidate;
    }

    return {
      schemaVersion: 1,
      progress,
      checkpoint: validCheckpoint(saved.checkpoint) ? saved.checkpoint : null,
    };
  } catch {
    return DEFAULT_LEARNING_STATE;
  }
}

function persistLearningState(state: LearningState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // State remains usable in memory when storage is unavailable.
  }
}

export function useLearningProgress() {
  const [learningState, setLearningStateValue] = useState<LearningState>(readLearningState);

  const update = useCallback((updater: (current: LearningState) => LearningState) => {
    setLearningStateValue((current) => {
      const next = updater(current);
      persistLearningState(next);
      return next;
    });
  }, []);

  const saveCheckpoint = useCallback(
    (checkpoint: LessonCheckpoint) => update((current) => ({ ...current, checkpoint })),
    [update],
  );

  const clearCheckpoint = useCallback(
    () => update((current) => ({ ...current, checkpoint: null })),
    [update],
  );

  const completeLesson = useCallback(
    (lessonId: string, accuracy: number) => {
      const now = new Date().toISOString();
      update((current) => {
        const previous = current.progress[lessonId];
        return {
          ...current,
          checkpoint: null,
          progress: {
            ...current.progress,
            [lessonId]: {
              attempts: (previous?.attempts ?? 0) + 1,
              bestAccuracy: Math.max(previous?.bestAccuracy ?? 0, accuracy),
              completedAt: previous?.completedAt ?? now,
              masteredAt:
                accuracy >= 90 ? (previous?.masteredAt ?? now) : (previous?.masteredAt ?? null),
            },
          },
        };
      });
    },
    [update],
  );

  return { learningState, saveCheckpoint, clearCheckpoint, completeLesson };
}
