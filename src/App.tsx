import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router";
import { AppShell } from "./components/AppShell";
import { useAppSettings } from "./hooks/useAppSettings";
import { useAppState } from "./hooks/useAppState";
import { useLearningProgress } from "./hooks/useLearningProgress";
import { useTypingSession } from "./hooks/useTypingSession";
import { HistoryPage } from "./pages/HistoryPage";
import { KeyboardPlaygroundPage } from "./pages/KeyboardPlaygroundPage";
import { LearnPage } from "./pages/LearnPage";
import { LessonPage } from "./pages/LessonPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TypingPage } from "./pages/TypingPage";
import { historyRepository } from "./storage/history";
import type { TestResult } from "./storage/types";
import type { ExperienceMode } from "./learning/types";

function ExperienceRoute({
  experience,
  onVisit,
  children,
}: {
  experience: ExperienceMode;
  onVisit: (experience: ExperienceMode) => void;
  children: ReactNode;
}) {
  useEffect(() => onVisit(experience), [experience, onVisit]);
  return children;
}

export default function App() {
  const navigate = useNavigate();
  const [settings, setSettings] = useAppSettings();
  const { appState, completeOnboarding, setLastExperience } = useAppState();
  const { learningState, saveCheckpoint, completeLesson } = useLearningProgress();
  const [history, setHistory] = useState<TestResult[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      setHistory(await historyRepository.list());
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const saveResult = useCallback(
    (result: TestResult) => {
      void historyRepository
        .save(result)
        .then(loadHistory)
        .catch(() => undefined);
    },
    [loadHistory],
  );

  const typingSession = useTypingSession(settings, saveResult);

  const clearHistory = useCallback(() => {
    void historyRepository
      .clear()
      .then(loadHistory)
      .catch(() => undefined);
  }, [loadHistory]);

  const learnResumePath = learningState.checkpoint
    ? `/learn/${learningState.checkpoint.lessonId}`
    : "/learn";
  const practicePath = appState.lastExperience === "learn" ? learnResumePath : "/test";

  const handleOnboardingSelect = useCallback(
    (experience: ExperienceMode) => {
      completeOnboarding(experience);
      navigate(experience === "learn" ? learnResumePath : "/test", { replace: true });
    },
    [completeOnboarding, learnResumePath, navigate],
  );

  const toggleTheme = useCallback(
    () =>
      setSettings((current) => ({
        ...current,
        theme: current.theme === "saffron" ? "paper" : "saffron",
      })),
    [setSettings],
  );

  if (!appState.onboardingCompleted) {
    return (
      <OnboardingPage
        theme={settings.theme}
        onThemeToggle={toggleTheme}
        onSelect={handleOnboardingSelect}
      />
    );
  }

  return (
    <AppShell
      theme={settings.theme}
      onThemeToggle={toggleTheme}
      practicePath={practicePath}
      learnPath={learnResumePath}
    >
      <Routes>
        <Route path="/" element={<Navigate to={practicePath} replace />} />
        <Route
          path="/test"
          element={
            <ExperienceRoute experience="test" onVisit={setLastExperience}>
              <TypingPage
                session={typingSession}
                settings={settings}
                onSettingsChange={setSettings}
              />
            </ExperienceRoute>
          }
        />
        <Route
          path="/learn"
          element={
            <ExperienceRoute experience="learn" onVisit={setLastExperience}>
              <LearnPage learningState={learningState} onCheckpoint={saveCheckpoint} />
            </ExperienceRoute>
          }
        />
        <Route
          path="/learn/:lessonId"
          element={
            <ExperienceRoute experience="learn" onVisit={setLastExperience}>
              <LessonPage
                learningState={learningState}
                onCheckpoint={saveCheckpoint}
                onComplete={completeLesson}
              />
            </ExperienceRoute>
          }
        />
        <Route
          path="/history"
          element={
            <HistoryPage history={history} speedUnit={settings.speedUnit} onClear={clearHistory} />
          }
        />
        <Route path="/keyboard" element={<KeyboardPlaygroundPage />} />
        <Route
          path="/settings"
          element={<SettingsPage settings={settings} onChange={setSettings} />}
        />
        <Route path="*" element={<Navigate to={practicePath} replace />} />
      </Routes>
    </AppShell>
  );
}
