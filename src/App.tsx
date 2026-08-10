import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router";
import { AppShell } from "./components/AppShell";
import { useAppSettings } from "./hooks/useAppSettings";
import { useTypingSession } from "./hooks/useTypingSession";
import { HistoryPage } from "./pages/HistoryPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TypingPage } from "./pages/TypingPage";
import { historyRepository } from "./storage/history";
import type { TestResult } from "./storage/types";

export default function App() {
  const [settings, setSettings] = useAppSettings();
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

  const saveResult = useCallback((result: TestResult) => {
    void historyRepository.save(result).then(loadHistory).catch(() => undefined);
  }, [loadHistory]);

  const typingSession = useTypingSession(settings, saveResult);

  const clearHistory = useCallback(() => {
    void historyRepository.clear().then(loadHistory).catch(() => undefined);
  }, [loadHistory]);

  return (
    <AppShell
      theme={settings.theme}
      onThemeToggle={() => setSettings((current) => ({
        ...current,
        theme: current.theme === "saffron" ? "paper" : "saffron",
      }))}
    >
      <Routes>
        <Route
          path="/"
          element={<TypingPage session={typingSession} settings={settings} onSettingsChange={setSettings} />}
        />
        <Route
          path="/history"
          element={<HistoryPage history={history} speedUnit={settings.speedUnit} onClear={clearHistory} />}
        />
        <Route
          path="/settings"
          element={<SettingsPage settings={settings} onChange={setSettings} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
