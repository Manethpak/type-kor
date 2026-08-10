import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { HistoryIcon, KeyboardIcon, MoonIcon, RestartIcon, SettingsIcon, SoundIcon, SunIcon, TrashIcon } from "./components/Icons";
import { ReportSpeedChart } from "./components/ReportSpeedChart";
import { commonKhmerWords, generateWords } from "./data/wordList";
import { khmerTextEngine } from "./engine/khmer";
import type { OrthographicCluster } from "./engine/types";
import { useCaretPosition } from "./hooks/useCaretPosition";
import { historyRepository } from "./storage/history";
import type { TestResult } from "./storage/types";
import { calculateResult, createTypingState, typingReducer } from "./typing/reducer";
import type { TestSettings } from "./typing/types";

const DEFAULT_SETTINGS: TestSettings = {
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

type Screen = "test" | "history" | "settings";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const navButtonClass = "grid h-[34px] w-[38px] cursor-pointer place-items-center rounded-[9px] text-app-dim transition-[color,background,transform] duration-200 hover:bg-app-accent-soft hover:text-app-accent active:translate-y-px [&_svg]:size-[17px]";
const modeButtonClass = "cursor-pointer rounded-lg px-2.5 py-[7px] text-sm font-medium text-app-dim transition-colors hover:bg-app-accent-soft hover:text-app-accent";
const selectedButtonClass = "bg-app-accent-soft text-app-accent!";
const metricButtonClass = "cursor-pointer rounded-[5px] px-1.5 py-1 text-[8px] font-semibold uppercase tracking-[.08em] text-app-dim transition-colors hover:text-app-accent";
const segmentedButtonClass = "flex cursor-pointer items-center gap-1.5 rounded-[7px] px-2 py-1.5 text-left text-[10px] text-app-dim transition-colors hover:bg-app-accent-soft hover:text-app-accent [&_svg]:size-3";
const settingCardClass = "flex min-h-28 items-center justify-between gap-5 rounded-[14px] border border-app-line bg-[color-mix(in_srgb,var(--bg-raised)_88%,transparent)] p-[17px]";
const settingLeadClass = "flex items-center gap-3";
const settingIconClass = "grid size-9 shrink-0 place-items-center rounded-[10px] bg-app-accent-soft font-khmer text-app-accent [&_svg]:size-4";
const settingCopyClass = "[&_h2]:mb-[3px] [&_h2]:text-sm [&_h2]:font-[560] [&_p]:m-0 [&_p]:max-w-[220px] [&_p]:text-[11px] [&_p]:leading-normal [&_p]:text-app-dim";

function readSettings(): TestSettings {
  try {
    const saved = JSON.parse(localStorage.getItem("typkh:settings") ?? "{}") as Partial<TestSettings> & { schemaVersion?: number };
    // Migrate browsers that persisted the original, undersized 43px default.
    if (saved.schemaVersion !== SETTINGS_SCHEMA_VERSION && (saved.fontSize === undefined || saved.fontSize === 43)) {
      saved.fontSize = DEFAULT_SETTINGS.fontSize;
    }
    return { ...DEFAULT_SETTINGS, ...saved };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function createPrompt(settings: TestSettings, seed: number): OrthographicCluster[] {
  const count = settings.mode === "words" ? settings.modeValue : 90;
  const words = generateWords(commonKhmerWords, count, seed).map((word, index) =>
    settings.punctuation && index > 0 && (index + 1) % 12 === 0 ? `${word}។` : word,
  );
  return khmerTextEngine.segment(words.join(" "));
}

function playTick() {
  const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = 520;
  gain.gain.setValueAtTime(0.035, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.045);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.05);
  oscillator.addEventListener("ended", () => context.close());
}

export default function App() {
  const [settings, setSettings] = useState<TestSettings>(readSettings);
  const [seed, setSeed] = useState(() => Date.now());
  const prompt = useMemo(() => createPrompt(settings, seed), [seed, settings.mode, settings.modeValue, settings.punctuation]);
  const [typing, dispatch] = useReducer(typingReducer, prompt, createTypingState);
  const [screen, setScreen] = useState<Screen>("test");
  const [history, setHistory] = useState<TestResult[]>([]);
  const [result, setResult] = useState<TestResult | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const captureRef = useRef<HTMLTextAreaElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLSpanElement>(null);
  const composingRef = useRef(false);
  const savingRef = useRef(false);
  const beforeInputRecordedRef = useRef(false);
  const lastSampledSecondRef = useRef(0);
  const caret = useCaretPosition(surfaceRef, activeRef, `${typing.currentIndex}-${settings.fontSize}-${settings.lineHeight}`);

  const focusCapture = useCallback(() => {
    if (!typing.finished && screen === "test") captureRef.current?.focus({ preventScroll: true });
  }, [screen, typing.finished]);

  const loadHistory = useCallback(async () => {
    try {
      setHistory(await historyRepository.list());
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("typkh:settings", JSON.stringify({ ...settings, schemaVersion: SETTINGS_SCHEMA_VERSION }));
    document.documentElement.dataset.theme = settings.theme;
  }, [settings]);

  useEffect(() => {
    setResult(null);
    savingRef.current = false;
    lastSampledSecondRef.current = 0;
    dispatch({ type: "reset", prompt });
  }, [prompt]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (typing.startedAt === null || typing.finished) return;
    const timer = window.setInterval(() => setClock(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, [typing.finished, typing.startedAt]);

  useEffect(() => {
    if (typing.startedAt === null || typing.finished) return;
    const elapsedSecond = Math.floor((clock - typing.startedAt) / 1_000);
    if (elapsedSecond <= lastSampledSecondRef.current) return;
    for (let second = lastSampledSecondRef.current + 1; second <= elapsedSecond; second += 1) {
      dispatch({ type: "sample", elapsedMs: second * 1_000 });
    }
    lastSampledSecondRef.current = elapsedSecond;
  }, [clock, typing.finished, typing.startedAt]);

  useEffect(() => {
    if (settings.mode !== "time" || typing.startedAt === null || typing.finished) return;
    if (clock - typing.startedAt >= settings.modeValue * 1_000) {
      dispatch({ type: "finish", at: typing.startedAt + settings.modeValue * 1_000 });
    }
  }, [clock, settings.mode, settings.modeValue, typing.finished, typing.startedAt]);

  useEffect(() => {
    if (!typing.finished || result || savingRef.current) return;
    savingRef.current = true;
    const completed = calculateResult(typing, settings.mode, settings.modeValue, Date.now());
    setResult(completed);
    historyRepository.save(completed).then(loadHistory).catch(() => undefined);
  }, [loadHistory, result, settings.mode, settings.modeValue, typing]);

  const restart = useCallback(() => {
    const nextSeed = Date.now();
    const nextPrompt = createPrompt(settings, nextSeed);
    setSeed(nextSeed);
    setResult(null);
    savingRef.current = false;
    lastSampledSecondRef.current = 0;
    dispatch({ type: "reset", prompt: nextPrompt });
    window.setTimeout(() => captureRef.current?.focus(), 0);
  }, [settings]);

  useEffect(() => {
    const listener = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && screen === "test") {
        event.preventDefault();
        restart();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [restart, screen]);

  const processInput = useCallback((rawValue: string) => {
    if (typing.finished) return;
    let remaining = rawValue;
    let index = typing.currentIndex;

    while (remaining && index < typing.prompt.length) {
      const target = typing.prompt[index];
      const match = khmerTextEngine.compare(target, remaining);
      if (match === "correct") {
        dispatch({ type: "commit", attempt: remaining, correct: true });
        if (settings.sound && target.kind === "khmer") playTick();
        remaining = "";
        index += 1;
        break;
      }
      if (match === "prefix") {
        dispatch({ type: "pending", value: remaining, status: "prefix" });
        break;
      }

      const attempts = khmerTextEngine.segment(remaining);
      if (attempts.length > 1) {
        const first = attempts[0];
        const consumed = remaining.slice(0, first.end);
        const firstMatch = khmerTextEngine.compare(target, consumed);
        const correct = firstMatch === "correct";
        dispatch({ type: "commit", attempt: consumed, correct });
        if (correct && settings.sound && target.kind === "khmer") playTick();
        remaining = remaining.slice(first.end);
        index += 1;
        continue;
      }
      dispatch({ type: "pending", value: remaining, status: "incorrect" });
      break;
    }

    if (!remaining) dispatch({ type: "pending", value: "", status: "prefix" });
  }, [settings.sound, typing.currentIndex, typing.finished, typing.prompt]);

  const startTest = useCallback(() => {
    if (typing.startedAt !== null || typing.finished) return;
    const startedAt = Date.now();
    setClock(startedAt);
    dispatch({ type: "start", at: startedAt });
  }, [typing.finished, typing.startedAt]);

  const handleBeforeInput = (event: FormEvent<HTMLTextAreaElement>) => {
    const native = event.nativeEvent as InputEvent;
    if (native.inputType?.startsWith("insert") && !composingRef.current && !native.isComposing) {
      beforeInputRecordedRef.current = true;
      startTest();
      dispatch({ type: "keystrokes", count: Array.from(native.data ?? "").length || 1 });
    }
    if (native.inputType === "deleteContentBackward" && typing.pendingInput.length === 0) {
      event.preventDefault();
      dispatch({ type: "reopen" });
    }
  };

  const handleInput = (event: FormEvent<HTMLTextAreaElement>) => {
    const value = event.currentTarget.value;
    if (composingRef.current) {
      dispatch({ type: "pending", value, status: "prefix" });
      return;
    }
    if (value) {
      startTest();
      if (!beforeInputRecordedRef.current) {
        const native = event.nativeEvent as InputEvent;
        dispatch({ type: "keystrokes", count: Array.from(native.data ?? "").length || 1 });
      }
    }
    beforeInputRecordedRef.current = false;
    processInput(value);
  };

  const switchScreen = (next: Screen) => {
    setScreen(next);
    if (next === "test") window.setTimeout(focusCapture, 0);
  };

  const elapsedMs = typing.startedAt === null ? 0 : Math.max(0, (typing.endedAt ?? clock) - typing.startedAt);
  const remainingSeconds = settings.mode === "time"
    ? Math.max(0, Math.ceil(settings.modeValue - elapsedMs / 1_000))
    : null;
  const liveCpm = typing.startedAt === null || elapsedMs < 1_000 ? 0 : Math.round(typing.correctClusters / (elapsedMs / 60_000));
  const liveWpm = typing.startedAt === null || elapsedMs < 1_000 ? 0 : Math.round((typing.correctCodePoints / 5) / (elapsedMs / 60_000));
  const liveSpeed = settings.speedUnit === "cpm" ? liveCpm : liveWpm;
  const activeTarget = typing.prompt[typing.currentIndex];
  const pendingKey = typing.pendingInput ? khmerTextEngine.canonicalize(typing.pendingInput) : "";
  const pendingUnits = Array.from(pendingKey).length;
  const targetUnits = activeTarget ? Array.from(activeTarget.comparisonKey).length : 0;
  const pendingProgress = targetUnits === 0 ? 0 : Math.min(100, pendingUnits / targetUnits * 100);

  return (
    <div className="app-scene relative isolate flex min-h-screen flex-col overflow-hidden text-app-text">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden font-khmer text-app-accent" aria-hidden="true">
        <span className="absolute right-[-5%] top-[4%] rotate-[8deg] text-[clamp(15rem,28vw,32rem)] leading-none opacity-[.018] blur-[1px]">ក</span>
        <span className="absolute bottom-[-14%] left-[-5%] -rotate-[7deg] text-[clamp(15rem,28vw,32rem)] leading-none opacity-[.018] blur-[1px]">ខ</span>
        <span className="absolute left-[48%] top-[42%] text-[11rem] leading-none opacity-[.018] blur-[1px]">្មែ</span>
      </div>
      <header className="mx-auto grid w-[min(1180px,calc(100%_-_48px))] grid-cols-[1fr_auto_1fr] items-center pt-[26px] max-[760px]:w-[calc(100%_-_30px)] max-[760px]:grid-cols-[1fr_auto]">
        <button className="inline-flex cursor-pointer items-center justify-self-start gap-3 p-0 text-left" onClick={() => switchScreen("test")} aria-label="Go to typing test">
          <span className="grid size-10 place-items-center rounded-[11px_11px_11px_3px] border border-[color-mix(in_srgb,var(--accent)_45%,transparent)] bg-app-accent-soft font-khmer text-2xl text-app-accent shadow-[inset_0_0_20px_var(--accent-soft)]">ច</span>
          <span>
            <strong className="block font-khmer text-[22px] font-bold leading-[1.2] tracking-[.01em]">ចង្វាក់</strong>
            <small className="mt-0.5 block text-[9px] font-semibold tracking-[.24em] text-app-dim">KHMER TYPE</small>
          </span>
        </button>
        <nav className="flex gap-1 rounded-[14px] border border-app-line bg-[color-mix(in_srgb,var(--surface)_70%,transparent)] p-[5px] shadow-[0_12px_40px_var(--shadow)] backdrop-blur-[14px] max-[760px]:fixed max-[760px]:bottom-[18px] max-[760px]:right-1/2 max-[760px]:z-10 max-[760px]:translate-x-1/2" aria-label="Primary navigation">
          <button className={cx(navButtonClass, screen === "test" && selectedButtonClass)} onClick={() => switchScreen("test")} title="Typing test"><KeyboardIcon /></button>
          <button className={cx(navButtonClass, screen === "history" && selectedButtonClass)} onClick={() => switchScreen("history")} title="Local history"><HistoryIcon /></button>
          <button className={cx(navButtonClass, screen === "settings" && selectedButtonClass)} onClick={() => switchScreen("settings")} title="Settings"><SettingsIcon /></button>
        </nav>
        <button
          className={cx(navButtonClass, "justify-self-end border border-app-line bg-app-surface max-[760px]:hidden")}
          onClick={() => setSettings((current) => ({ ...current, theme: current.theme === "saffron" ? "paper" : "saffron" }))}
          aria-label="Toggle color theme"
        >
          {settings.theme === "saffron" ? <SunIcon /> : <MoonIcon />}
        </button>
      </header>

      <main className="mx-auto grid w-[min(1080px,calc(100%_-_48px))] flex-1 [place-items:center_stretch] py-9 pt-[54px] max-[760px]:w-[calc(100%_-_30px)] max-[760px]:pt-10">
        {screen === "test" && (
          <section className="w-full animate-arrive" aria-label="Khmer typing test">
            {!result && (
              <>
                <div className="mb-7 flex min-h-12 items-end justify-between max-[760px]:items-start max-[760px]:gap-[18px]">
                  <div className="flex items-center gap-[3px] rounded-xl border border-app-line bg-app-raised p-[5px] max-[760px]:flex-wrap">
                    <button className={cx(modeButtonClass, settings.mode === "time" && selectedButtonClass)} onClick={() => setSettings((value) => ({ ...value, mode: "time", modeValue: 30 }))}>ពេលវេលា</button>
                    <button className={cx(modeButtonClass, settings.mode === "words" && selectedButtonClass)} onClick={() => setSettings((value) => ({ ...value, mode: "words", modeValue: 25 }))}>ពាក្យ</button>
                    <i className="mx-1 h-4 w-px bg-app-line" />
                    {(settings.mode === "time" ? [15, 30, 60] : [10, 25, 50]).map((value) => (
                      <button key={value} className={cx(modeButtonClass, settings.modeValue === value && selectedButtonClass)} onClick={() => setSettings((current) => ({ ...current, modeValue: value }))}>{value}</button>
                    ))}
                  </div>
                  <div className="flex items-center gap-[26px] [&>span]:flex [&>span]:items-baseline [&>span]:gap-1.5 [&_b]:text-[29px] [&_b]:font-[420] [&_b]:leading-none [&_b]:text-app-accent [&_b]:[font-variant-numeric:tabular-nums] [&_small]:text-[10px] [&_small]:font-semibold [&_small]:uppercase [&_small]:tracking-[.15em] [&_small]:text-app-dim" aria-live="polite">
                    {remainingSeconds !== null && <span className="max-[760px]:!hidden"><b data-testid="countdown">{remainingSeconds}</b><small>sec</small></span>}
                    <span><b data-testid="live-speed">{liveSpeed}</b><small>{settings.speedUnit}</small></span>
                    <div className="flex gap-0.5 rounded-lg border border-app-line bg-app-raised p-[3px]" role="group" aria-label="Speed unit">
                      {(["cpm", "wpm"] as const).map((unit) => (
                        <button
                          key={unit}
                          className={cx(metricButtonClass, settings.speedUnit === unit && selectedButtonClass)}
                          onClick={() => setSettings((current) => ({ ...current, speedUnit: unit }))}
                          aria-pressed={settings.speedUnit === unit}
                          title={unit === "cpm" ? "Khmer clusters per minute" : "Five-code-point words per minute"}
                        >{unit}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="group relative cursor-text" onClick={focusCapture} data-error={typing.pendingStatus === "incorrect"}>
                  <div
                    ref={surfaceRef}
                    className="prompt-scrollbar relative h-[calc(var(--prompt-size)*var(--prompt-leading)*3.15)] overflow-x-hidden overflow-y-auto px-1 pb-7 pt-3 [mask-image:linear-gradient(to_bottom,transparent,#000_8%,#000_88%,transparent)] [scrollbar-width:none]"
                    style={{ "--prompt-size": `${settings.fontSize}px`, "--prompt-leading": settings.lineHeight } as React.CSSProperties}
                  >
                    <div className="select-none text-pretty font-khmer text-[length:var(--prompt-size)] font-normal leading-[var(--prompt-leading)] tracking-[.012em] text-app-dim [word-spacing:.12em] max-[760px]:text-[min(var(--prompt-size),42px)]">
                      {typing.prompt.map((cluster, index) => {
                        const active = index === typing.currentIndex;
                        const clusterState = typing.states[index];
                        const incorrect = clusterState === "incorrect" || (active && typing.pendingStatus === "incorrect");
                        const classNames = cx(
                          "relative transition-colors duration-150",
                          clusterState === "correct" && "text-app-correct",
                          incorrect && "text-app-error underline decoration-[color-mix(in_srgb,var(--error)_65%,transparent)] decoration-2 underline-offset-[.2em]",
                          active && "[text-shadow:0_0_24px_var(--accent-soft)]",
                          active && typing.pendingInput && typing.pendingStatus === "prefix" && "text-[color-mix(in_srgb,var(--accent)_72%,var(--text-soft))] underline decoration-[color-mix(in_srgb,var(--accent)_38%,transparent)] decoration-2 decoration-dotted underline-offset-[.2em]",
                        );
                        return (
                          <span
                            key={`${index}-${cluster.start}`}
                            ref={active ? activeRef : undefined}
                            className={classNames}
                            data-cluster={index}
                            data-state={clusterState}
                            data-active={active}
                          >
                            {cluster.display}
                          </span>
                        );
                      })}
                    </div>
                    <span
                      className="pointer-events-none absolute left-0 top-0 w-[3px] rounded bg-app-accent opacity-0 shadow-[0_0_14px_color-mix(in_srgb,var(--accent)_48%,transparent)] transition-[transform,height,opacity] duration-[90ms] ease-[cubic-bezier(.22,.78,.36,1)] data-[visible=true]:animate-blink data-[visible=true]:opacity-100 group-data-[error=true]:bg-app-error group-data-[error=true]:shadow-[0_0_14px_color-mix(in_srgb,var(--error)_48%,transparent)]"
                      data-visible={caret.visible && !typing.finished}
                      style={{ transform: `translate3d(${caret.x}px, ${caret.y}px, 0)`, height: caret.height }}
                    />
                    {typing.pendingInput && !typing.finished && (
                      <span
                        className="pointer-events-none absolute left-0 top-0 z-[3] flex h-[22px] min-w-11 animate-echo-in items-center gap-[5px] overflow-hidden rounded-md border border-[color-mix(in_srgb,var(--accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--bg-raised)_94%,transparent)] px-1.5 pb-0.5 pt-px text-app-accent shadow-[0_8px_24px_var(--shadow)] transition-[transform,color,border-color] duration-[90ms] ease-[cubic-bezier(.22,.78,.36,1)] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-[var(--attempt-progress)] after:bg-current after:content-[''] after:transition-[width] after:duration-150 data-[status=incorrect]:border-[color-mix(in_srgb,var(--error)_38%,transparent)] data-[status=incorrect]:text-app-error"
                        data-status={typing.pendingStatus}
                        data-testid="attempt-feedback"
                        role="status"
                        aria-live="polite"
                        aria-label={typing.pendingStatus === "incorrect" ? `Incorrect input: ${typing.pendingInput}` : `Matching cluster prefix: ${typing.pendingInput}`}
                        style={{
                          "--attempt-progress": `${pendingProgress}%`,
                          transform: `translate3d(${caret.x}px, ${caret.y + caret.height + 2}px, 0)`,
                        } as React.CSSProperties}
                      >
                        <b className="font-khmer text-base font-normal leading-none">{typing.pendingInput}</b>
                        <small className="text-[9px] opacity-70 [font-variant-numeric:tabular-nums]">{pendingUnits}/{targetUnits}</small>
                        <i className="text-[9px] not-italic" aria-hidden="true">{typing.pendingStatus === "incorrect" ? "×" : "●"}</i>
                      </span>
                    )}
                  </div>
                  <textarea
                    ref={captureRef}
                    className="absolute left-1/2 top-1/2 size-0.5 overflow-hidden whitespace-nowrap border-0 p-0 [clip-path:inset(50%)]"
                    value={typing.pendingInput}
                    onBeforeInput={handleBeforeInput}
                    onInput={handleInput}
                    onChange={() => undefined}
                    onCompositionStart={() => { composingRef.current = true; }}
                    onCompositionEnd={(event) => {
                      composingRef.current = false;
                      if (event.currentTarget.value) {
                        startTest();
                        dispatch({ type: "keystrokes", count: Array.from(event.currentTarget.value).length });
                      }
                      beforeInputRecordedRef.current = false;
                      processInput(event.currentTarget.value);
                    }}
                    onKeyDown={(event: ReactKeyboardEvent) => {
                      if (
                        event.key === "Backspace" &&
                        !composingRef.current &&
                        typing.pendingInput.length === 0 &&
                        typing.currentIndex > 0
                      ) {
                        // Empty text controls do not consistently emit beforeinput for
                        // Backspace. Treat this as cluster navigation, not text capture.
                        event.preventDefault();
                        dispatch({ type: "reopen" });
                        return;
                      }
                      if (event.key === "Enter") event.preventDefault();
                    }}
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-label="Type the displayed Khmer text"
                  />
                  <div className="mx-auto mt-[9px] flex w-max items-center gap-[9px] text-[13px] text-app-dim transition-colors group-focus-within:text-app-soft">
                    <span className="size-[5px] rounded-full bg-app-accent shadow-[0_0_0_4px_var(--accent-soft)] group-data-[error=true]:bg-app-error group-data-[error=true]:shadow-[0_0_0_4px_color-mix(in_srgb,var(--error)_15%,transparent)]" />
                    {typing.startedAt === null ? "ចុចទីនេះ ហើយចាប់ផ្ដើមវាយ" : typing.pendingStatus === "incorrect" ? "អក្សរនេះមិនត្រូវគ្នា — លុបដើម្បីកែ" : "កំពុងវាយជាចង្កោមអក្សរខ្មែរ"}
                  </div>
                </div>

                <button className="mx-auto mt-[30px] flex cursor-pointer items-center gap-[9px] rounded-[10px] px-3 py-2 text-[13px] text-app-dim transition-colors hover:bg-app-accent-soft hover:text-app-accent [&_svg]:w-3.5" onClick={restart}>
                  <RestartIcon /> <span>ចាប់ផ្ដើមឡើងវិញ</span><kbd className="rounded-[5px] border border-b-2 border-app-line bg-app-surface px-1.5 py-0.5 font-ui text-[10px] uppercase text-app-soft">esc</kbd>
                </button>
              </>
            )}

            {result && (
              <ResultView
                result={result}
                speedUnit={settings.speedUnit}
                theme={settings.theme}
                onSpeedUnitChange={(speedUnit) => setSettings((current) => ({ ...current, speedUnit }))}
                onRestart={restart}
              />
            )}
          </section>
        )}

        {screen === "history" && (
          <HistoryView history={history} speedUnit={settings.speedUnit} onClear={async () => { await historyRepository.clear(); await loadHistory(); }} />
        )}

        {screen === "settings" && (
          <SettingsView settings={settings} onChange={setSettings} />
        )}
      </main>

      <footer className="mx-auto flex w-[min(1180px,calc(100%_-_48px))] justify-between border-t border-app-line py-6 pt-[18px] text-[11px] tracking-[.08em] text-app-dim max-[760px]:w-[calc(100%_-_30px)] max-[760px]:pb-20">
        <span>Unicode Khmer · orthographic cluster engine</span>
        <span className="text-[color-mix(in_srgb,var(--accent)_60%,var(--text-dim))] max-[760px]:hidden">បញ្ជីពាក្យសាកល្បង · រង់ចាំការពិនិត្យ</span>
      </footer>
    </div>
  );
}

function ResultView({
  result,
  speedUnit,
  theme,
  onSpeedUnitChange,
  onRestart,
}: {
  result: TestResult;
  speedUnit: "cpm" | "wpm";
  theme: "saffron" | "paper";
  onSpeedUnitChange: (unit: "cpm" | "wpm") => void;
  onRestart: () => void;
}) {
  const timeline = result.timeline ?? [];
  const resultWpm = result.wordsPerMinute ?? Math.round(result.clustersPerMinute / 5);
  const selectedSpeed = speedUnit === "cpm" ? result.clustersPerMinute : resultWpm;
  const selectedBursts = timeline.map((sample) => speedUnit === "cpm" ? sample.burstCpm : (sample.burstWpm ?? Math.round(sample.burstCpm / 5)));
  const peakSpeed = Math.max(selectedSpeed, ...selectedBursts, 0);

  return (
    <div className="mx-auto w-[min(780px,100%)] animate-arrive">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[.13em] text-app-accent">លទ្ធផលរបស់អ្នក</p>
      <div className="grid grid-cols-[220px_1fr] items-end gap-[42px] border-b border-app-line pb-9 pt-5 max-[760px]:grid-cols-1">
        <div>
          <strong className="block text-[88px] font-light leading-none tracking-[-.05em] text-app-accent">{selectedSpeed}</strong>
          <span className="mt-[9px] block text-sm text-app-dim">{speedUnit === "cpm" ? "ចង្កោម / នាទី" : "ពាក្យ / នាទី"}</span>
          <div className="mt-3.5 flex w-max gap-0.5 rounded-lg border border-app-line bg-app-raised p-[3px]" role="group" aria-label="Result speed unit">
            {(["cpm", "wpm"] as const).map((unit) => <button className={cx(metricButtonClass, speedUnit === unit && selectedButtonClass)} key={unit} onClick={() => onSpeedUnitChange(unit)} aria-pressed={speedUnit === unit}>{unit}</button>)}
          </div>
        </div>
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center justify-between text-[10px] text-app-dim"><span>ល្បឿនតាមវិនាទី · {speedUnit}</span><b className="font-medium uppercase tracking-[.05em] text-app-accent">peak {peakSpeed}</b></div>
          <div className="relative h-[150px] w-full max-[760px]:h-[140px]">
            <ReportSpeedChart durationMs={result.durationMs} peakSpeed={peakSpeed} speedUnit={speedUnit} theme={theme} timeline={timeline} />
          </div>
        </div>
      </div>
      <div className="my-[30px] grid grid-cols-4 gap-px overflow-hidden rounded-[14px] border border-app-line bg-app-line max-[760px]:grid-cols-2 [&>div]:bg-app-raised [&>div]:p-[18px] [&_span]:block [&_span]:min-h-[34px] [&_span]:text-xs [&_span]:text-app-dim [&_b]:mt-1 [&_b]:block [&_b]:text-2xl [&_b]:font-[450] [&_b]:text-app-text">
        <div><span>ភាពត្រឹមត្រូវ</span><b>{result.accuracy}%</b></div>
        <div><span>CPM</span><b>{result.clustersPerMinute}</b></div>
        <div><span>WPM</span><b>{resultWpm}</b></div>
        <div><span>ល្បឿនខ្ពស់បំផុត · {speedUnit}</span><b>{peakSpeed}</b></div>
        <div><span>ចង្កោមត្រឹមត្រូវ</span><b>{result.correctClusters}</b></div>
        <div><span>កំហុស</span><b>{result.incorrectClusters}</b></div>
        <div><span>គ្រាប់ចុច</span><b>{result.rawKeystrokes}</b></div>
        <div><span>ទិន្នន័យតាមវិនាទី</span><b>{timeline.length}</b></div>
      </div>
      <button className="ml-auto flex cursor-pointer items-center gap-2.5 rounded-[10px] bg-app-accent px-[17px] py-[11px] text-sm font-semibold text-app-bg shadow-[0_10px_35px_color-mix(in_srgb,var(--accent)_18%,transparent)] transition-transform hover:-translate-y-0.5 [&_svg]:w-[15px]" onClick={onRestart}><RestartIcon /> សាកល្បងម្ដងទៀត</button>
    </div>
  );
}

function HistoryView({ history, speedUnit, onClear }: { history: TestResult[]; speedUnit: "cpm" | "wpm"; onClear: () => void }) {
  return (
    <section className="mx-auto w-[min(880px,100%)] animate-[arrive_.4s_ease_both]">
      <div className="mb-[35px] flex items-end justify-between border-b border-app-line pb-[22px]">
        <div><p className="mb-2 text-xs font-semibold uppercase tracking-[.13em] text-app-accent">រក្សាទុកក្នុងឧបករណ៍នេះ</p><h1 className="m-0 font-khmer text-[34px] font-medium">ប្រវត្តិការវាយ</h1></div>
        {history.length > 0 && <button className="flex cursor-pointer items-center gap-[7px] p-2 text-xs text-app-dim transition-colors hover:text-app-error [&_svg]:w-3.5" onClick={onClear}><TrashIcon /> លុបទាំងអស់</button>}
      </div>
      {history.length === 0 ? (
        <div className="grid min-h-[280px] place-items-center content-center rounded-[18px] border border-dashed border-app-line bg-[color-mix(in_srgb,var(--surface)_45%,transparent)] p-10 text-center [&>svg]:w-[35px] [&>svg]:text-app-accent [&>svg]:opacity-70 [&_h2]:mb-1 [&_h2]:mt-[15px] [&_h2]:font-khmer [&_h2]:text-[22px] [&_h2]:font-medium [&_p]:m-0 [&_p]:text-[13px] [&_p]:text-app-dim"><HistoryIcon /><h2>មិនទាន់មានលទ្ធផល</h2><p>បញ្ចប់ការសាកល្បងមួយ ដើម្បីឃើញចង្វាក់របស់អ្នកនៅទីនេះ។</p></div>
      ) : (
        <div className="grid gap-2">
          {history.map((item) => (
            <article className="grid grid-cols-[1.5fr_1fr_1fr_1fr] items-center rounded-xl border border-app-line bg-app-raised px-[18px] py-[15px] transition-[border-color,transform] hover:translate-x-[3px] hover:border-[color-mix(in_srgb,var(--accent)_35%,transparent)] max-[760px]:grid-cols-2 max-[760px]:gap-2" key={item.id}>
              <time className="text-xs text-app-dim">{new Intl.DateTimeFormat("km-KH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.startedAt))}</time>
              <strong className="text-[22px] font-[450] text-app-accent">{speedUnit === "cpm" ? item.clustersPerMinute : (item.wordsPerMinute ?? Math.round(item.clustersPerMinute / 5))}<small className="text-[10px] font-medium"> {speedUnit}</small></strong>
              <span className="text-xs text-app-dim">{item.accuracy}% ត្រឹមត្រូវ</span>
              <span className="text-xs text-app-dim">{item.mode === "time" ? `${item.modeValue} វិនាទី` : `${item.modeValue} ពាក្យ`}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function SettingsView({ settings, onChange }: { settings: TestSettings; onChange: (settings: TestSettings) => void }) {
  const update = <K extends keyof TestSettings>(key: K, value: TestSettings[K]) => onChange({ ...settings, [key]: value });
  return (
    <section className="mx-auto w-[min(880px,100%)] animate-[arrive_.4s_ease_both]">
      <div className="mb-[35px] flex items-end justify-between border-b border-app-line pb-[22px]"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[.13em] text-app-accent">សម្រួលឱ្យស្របនឹងអ្នក</p><h1 className="m-0 font-khmer text-[34px] font-medium">ការកំណត់</h1></div></div>
      <div className="grid grid-cols-2 gap-2.5 max-[760px]:grid-cols-1">
        <div className={settingCardClass}>
          <div className={settingLeadClass}><span className={settingIconClass}>↗</span><div className={settingCopyClass}><h2>ឯកតាល្បឿន</h2><p>CPM សម្រាប់ចង្កោមខ្មែរ ឬ WPM ស្តង់ដារ ៥ តួអក្សរ</p></div></div>
          <div className="grid shrink-0 gap-1">
            <button className={cx(segmentedButtonClass, settings.speedUnit === "cpm" && selectedButtonClass)} onClick={() => update("speedUnit", "cpm")}>CPM</button>
            <button className={cx(segmentedButtonClass, settings.speedUnit === "wpm" && selectedButtonClass)} onClick={() => update("speedUnit", "wpm")}>WPM</button>
          </div>
        </div>
        <div className={settingCardClass}>
          <div className={settingLeadClass}><span className={settingIconClass}><SunIcon /></span><div className={settingCopyClass}><h2>រូបរាង</h2><p>ពណ៌ស្រទន់សម្រាប់ការផ្តោតអារម្មណ៍</p></div></div>
          <div className="grid shrink-0 gap-1">
            <button className={cx(segmentedButtonClass, settings.theme === "saffron" && selectedButtonClass)} onClick={() => update("theme", "saffron")}><MoonIcon /> Saffron Ink</button>
            <button className={cx(segmentedButtonClass, settings.theme === "paper" && selectedButtonClass)} onClick={() => update("theme", "paper")}><SunIcon /> Rice Paper</button>
          </div>
        </div>
        <div className={settingCardClass}>
          <div className={settingLeadClass}><span className={settingIconClass}>ក</span><div className={settingCopyClass}><h2>ទំហំអក្សរ</h2><p>រក្សារូបរាងចង្កោមឱ្យច្បាស់</p></div></div>
          <label className="flex w-[140px] shrink-0 items-center gap-[9px]"><input className="w-[95px] accent-app-accent" type="range" min="38" max="64" value={settings.fontSize} onChange={(event) => update("fontSize", Number(event.target.value))} /><output className="text-xs text-app-accent [font-variant-numeric:tabular-nums]">{settings.fontSize}px</output></label>
        </div>
        <div className={settingCardClass}>
          <div className={settingLeadClass}><span className={settingIconClass}>↕</span><div className={settingCopyClass}><h2>គម្លាតបន្ទាត់</h2><p>បន្ថែមកន្លែងសម្រាប់ស្រៈលើ និងក្រោម</p></div></div>
          <label className="flex w-[140px] shrink-0 items-center gap-[9px]"><input className="w-[95px] accent-app-accent" type="range" min="1.5" max="2.2" step="0.05" value={settings.lineHeight} onChange={(event) => update("lineHeight", Number(event.target.value))} /><output className="text-xs text-app-accent [font-variant-numeric:tabular-nums]">{settings.lineHeight.toFixed(2)}</output></label>
        </div>
        <div className={settingCardClass}>
          <div className={settingLeadClass}><span className={settingIconClass}><SoundIcon /></span><div className={settingCopyClass}><h2>សំឡេង</h2><p>សញ្ញាស្រាលពេលបញ្ចប់ចង្កោមត្រឹមត្រូវ</p></div></div>
          <button className="group relative h-[22px] w-[38px] shrink-0 cursor-pointer rounded-xl bg-app-hover p-[3px] transition-colors data-[on=true]:bg-app-accent-soft" data-on={settings.sound} onClick={() => update("sound", !settings.sound)} aria-pressed={settings.sound}><span className="block size-4 rounded-full bg-app-dim transition-[transform,background] group-data-[on=true]:translate-x-4 group-data-[on=true]:bg-app-accent" /></button>
        </div>
        <div className={settingCardClass}>
          <div className={settingLeadClass}><span className={settingIconClass}>។</span><div className={settingCopyClass}><h2>សញ្ញាវណ្ណយុត្ត</h2><p>បន្ថែមសញ្ញាខ្មែរទៅក្នុងលំហាត់</p></div></div>
          <button className="group relative h-[22px] w-[38px] shrink-0 cursor-pointer rounded-xl bg-app-hover p-[3px] transition-colors data-[on=true]:bg-app-accent-soft" data-on={settings.punctuation} onClick={() => update("punctuation", !settings.punctuation)} aria-pressed={settings.punctuation}><span className="block size-4 rounded-full bg-app-dim transition-[transform,background] group-data-[on=true]:translate-x-4 group-data-[on=true]:bg-app-accent" /></button>
        </div>
        <div className={settingCardClass}>
          <div className={settingLeadClass}><span className={settingIconClass}><RestartIcon /></span><div className={settingCopyClass}><h2>ចាប់ផ្ដើមឡើងវិញ</h2><p>ប្រើផ្លូវកាត់ពីអេក្រង់សាកល្បង</p></div></div>
          <kbd className="rounded-[5px] border border-b-2 border-app-line bg-app-surface px-1.5 py-0.5 font-ui text-xs uppercase text-app-soft">esc</kbd>
        </div>
      </div>
    </section>
  );
}
