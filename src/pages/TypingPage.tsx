import { useCallback, useEffect, useRef, type CSSProperties, type Dispatch, type SetStateAction } from "react";
import { ResultView } from "../components/ResultView";
import { RestartIcon } from "../components/Icons";
import { SpeedUnitToggle } from "../components/SpeedUnitToggle";
import { khmerTextEngine } from "../engine/khmer";
import { useCaretPosition } from "../hooks/useCaretPosition";
import type { TypingSession } from "../hooks/useTypingSession";
import type { TestSettings } from "../typing/types";
import { cx } from "../utils/classNames";

const modeButtonClass = "cursor-pointer rounded-lg px-2.5 py-[7px] text-sm font-medium text-app-dim transition-colors hover:bg-app-accent-soft hover:text-app-accent";
const selectedButtonClass = "bg-app-accent-soft text-app-accent!";

export function TypingPage({
  session,
  settings,
  onSettingsChange,
}: {
  session: TypingSession;
  settings: TestSettings;
  onSettingsChange: Dispatch<SetStateAction<TestSettings>>;
}) {
  const captureRef = useRef<HTMLTextAreaElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLSpanElement>(null);
  const caret = useCaretPosition(
    surfaceRef,
    activeRef,
    `${session.typing.currentIndex}-${settings.fontSize}-${settings.lineHeight}`,
  );

  const focusCapture = useCallback(() => {
    if (!session.typing.finished) captureRef.current?.focus({ preventScroll: true });
  }, [session.typing.finished]);

  const restart = useCallback(() => {
    session.restart();
    window.setTimeout(() => captureRef.current?.focus(), 0);
  }, [session]);

  useEffect(() => {
    const listener = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      restart();
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [restart]);

  const activeTarget = session.typing.prompt[session.typing.currentIndex];
  const pendingKey = session.typing.pendingInput ? khmerTextEngine.canonicalize(session.typing.pendingInput) : "";
  const pendingUnits = Array.from(pendingKey).length;
  const targetUnits = activeTarget ? Array.from(activeTarget.comparisonKey).length : 0;
  const pendingProgress = targetUnits === 0 ? 0 : Math.min(100, pendingUnits / targetUnits * 100);

  return (
    <section className="w-full animate-arrive" aria-label="Khmer typing test">
      {!session.result && (
        <>
          <div className="mb-7 flex min-h-12 items-end justify-between max-[760px]:items-start max-[760px]:gap-[18px]">
            <div className="flex items-center gap-[3px] rounded-xl border border-app-line bg-app-raised p-[5px] max-[760px]:flex-wrap">
              <button className={cx(modeButtonClass, settings.mode === "time" && selectedButtonClass)} onClick={() => onSettingsChange((value) => ({ ...value, mode: "time", modeValue: 30 }))}>ពេលវេលា</button>
              <button className={cx(modeButtonClass, settings.mode === "words" && selectedButtonClass)} onClick={() => onSettingsChange((value) => ({ ...value, mode: "words", modeValue: 25 }))}>ពាក្យ</button>
              <i className="mx-1 h-4 w-px bg-app-line" />
              {(settings.mode === "time" ? [15, 30, 60] : [10, 25, 50]).map((value) => (
                <button key={value} className={cx(modeButtonClass, settings.modeValue === value && selectedButtonClass)} onClick={() => onSettingsChange((current) => ({ ...current, modeValue: value }))}>{value}</button>
              ))}
            </div>

            <div className="flex items-center gap-[26px] [&>span]:flex [&>span]:items-baseline [&>span]:gap-1.5 [&_b]:text-[29px] [&_b]:font-[420] [&_b]:leading-none [&_b]:text-app-accent [&_b]:[font-variant-numeric:tabular-nums] [&_small]:text-[10px] [&_small]:font-semibold [&_small]:uppercase [&_small]:tracking-[.15em] [&_small]:text-app-dim" aria-live="polite">
              {session.remainingSeconds !== null && <span className="max-[760px]:!hidden"><b data-testid="countdown">{session.remainingSeconds}</b><small>sec</small></span>}
              <span><b data-testid="live-speed">{session.liveSpeed}</b><small>{settings.speedUnit}</small></span>
              <SpeedUnitToggle
                label="Speed unit"
                value={settings.speedUnit}
                onChange={(speedUnit) => onSettingsChange((current) => ({ ...current, speedUnit }))}
              />
            </div>
          </div>

          <div className="group relative cursor-text" onClick={focusCapture} data-error={session.typing.pendingStatus === "incorrect"}>
            <div
              ref={surfaceRef}
              className="prompt-scrollbar relative h-[calc(var(--prompt-size)*var(--prompt-leading)*3.15)] overflow-x-hidden overflow-y-auto px-1 pb-7 pt-3 [mask-image:linear-gradient(to_bottom,transparent,#000_8%,#000_88%,transparent)] [scrollbar-width:none]"
              style={{ "--prompt-size": `${settings.fontSize}px`, "--prompt-leading": settings.lineHeight } as CSSProperties}
            >
              <div className="select-none text-pretty font-khmer text-[length:var(--prompt-size)] font-normal leading-[var(--prompt-leading)] tracking-[.012em] text-app-dim [word-spacing:.12em] max-[760px]:text-[min(var(--prompt-size),42px)]">
                {session.typing.prompt.map((cluster, index) => {
                  const active = index === session.typing.currentIndex;
                  const clusterState = session.typing.states[index];
                  const incorrect = clusterState === "incorrect" || (active && session.typing.pendingStatus === "incorrect");
                  return (
                    <span
                      key={`${index}-${cluster.start}`}
                      ref={active ? activeRef : undefined}
                      className={cx(
                        "relative transition-colors duration-150",
                        clusterState === "correct" && "text-app-correct",
                        incorrect && "text-app-error underline decoration-[color-mix(in_srgb,var(--error)_65%,transparent)] decoration-2 underline-offset-[.2em]",
                        active && "[text-shadow:0_0_24px_var(--accent-soft)]",
                        active && session.typing.pendingInput && session.typing.pendingStatus === "prefix" && "text-[color-mix(in_srgb,var(--accent)_72%,var(--text-soft))] underline decoration-[color-mix(in_srgb,var(--accent)_38%,transparent)] decoration-2 decoration-dotted underline-offset-[.2em]",
                      )}
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
                data-visible={caret.visible && !session.typing.finished}
                style={{ transform: `translate3d(${caret.x}px, ${caret.y}px, 0)`, height: caret.height }}
              />

              {session.typing.pendingInput && !session.typing.finished && (
                <span
                  className="pointer-events-none absolute left-0 top-0 z-[3] flex h-[22px] min-w-11 animate-echo-in items-center gap-[5px] overflow-hidden rounded-md border border-[color-mix(in_srgb,var(--accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--bg-raised)_94%,transparent)] px-1.5 pb-0.5 pt-px text-app-accent shadow-[0_8px_24px_var(--shadow)] transition-[transform,color,border-color] duration-[90ms] ease-[cubic-bezier(.22,.78,.36,1)] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-[var(--attempt-progress)] after:bg-current after:content-[''] after:transition-[width] after:duration-150 data-[status=incorrect]:border-[color-mix(in_srgb,var(--error)_38%,transparent)] data-[status=incorrect]:text-app-error"
                  data-status={session.typing.pendingStatus}
                  data-testid="attempt-feedback"
                  role="status"
                  aria-live="polite"
                  aria-label={session.typing.pendingStatus === "incorrect" ? `Incorrect input: ${session.typing.pendingInput}` : `Matching cluster prefix: ${session.typing.pendingInput}`}
                  style={{
                    "--attempt-progress": `${pendingProgress}%`,
                    transform: `translate3d(${caret.x}px, ${caret.y + caret.height + 2}px, 0)`,
                  } as CSSProperties}
                >
                  <b className="font-khmer text-base font-normal leading-none">{session.typing.pendingInput}</b>
                  <small className="text-[9px] opacity-70 [font-variant-numeric:tabular-nums]">{pendingUnits}/{targetUnits}</small>
                  <i className="text-[9px] not-italic" aria-hidden="true">{session.typing.pendingStatus === "incorrect" ? "×" : "●"}</i>
                </span>
              )}
            </div>

            <textarea
              ref={captureRef}
              className="absolute left-1/2 top-1/2 size-0.5 overflow-hidden whitespace-nowrap border-0 p-0 [clip-path:inset(50%)]"
              value={session.typing.pendingInput}
              onBeforeInput={session.handleBeforeInput}
              onInput={session.handleInput}
              onChange={() => undefined}
              onCompositionStart={session.handleCompositionStart}
              onCompositionEnd={session.handleCompositionEnd}
              onKeyDown={session.handleKeyDown}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Type the displayed Khmer text"
            />

            <div className="mx-auto mt-[9px] flex w-max items-center gap-[9px] text-[13px] text-app-dim transition-colors group-focus-within:text-app-soft">
              <span className="size-[5px] rounded-full bg-app-accent shadow-[0_0_0_4px_var(--accent-soft)] group-data-[error=true]:bg-app-error group-data-[error=true]:shadow-[0_0_0_4px_color-mix(in_srgb,var(--error)_15%,transparent)]" />
              {session.typing.startedAt === null ? "ចុចទីនេះ ហើយចាប់ផ្ដើមវាយ" : session.typing.pendingStatus === "incorrect" ? "អក្សរនេះមិនត្រូវគ្នា — លុបដើម្បីកែ" : "កំពុងវាយជាចង្កោមអក្សរខ្មែរ"}
            </div>
          </div>

          <button className="mx-auto mt-[30px] flex cursor-pointer items-center gap-[9px] rounded-[10px] px-3 py-2 text-[13px] text-app-dim transition-colors hover:bg-app-accent-soft hover:text-app-accent [&_svg]:w-3.5" onClick={restart}>
            <RestartIcon /> <span>ចាប់ផ្ដើមឡើងវិញ</span><kbd className="rounded-[5px] border border-b-2 border-app-line bg-app-surface px-1.5 py-0.5 font-ui text-[10px] uppercase text-app-soft">esc</kbd>
          </button>
        </>
      )}

      {session.result && (
        <ResultView
          result={session.result}
          speedUnit={settings.speedUnit}
          theme={settings.theme}
          onSpeedUnitChange={(speedUnit) => onSettingsChange((current) => ({ ...current, speedUnit }))}
          onRestart={restart}
        />
      )}
    </section>
  );
}
