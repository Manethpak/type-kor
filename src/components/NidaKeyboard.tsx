import { useEffect, useState } from "react";
import { displayNidaOutput, NIDA_KEY_ROWS, outputForLayer, type NidaLayer } from "../learning/nida";
import type { PhysicalKeyHint } from "../learning/types";
import { cx } from "../utils/classNames";

export type NidaKeyboardMode = "follow" | "interactable";

interface NidaKeyboardProps {
  active: PhysicalKeyHint | undefined;
  defaultMode?: NidaKeyboardMode;
}

const layerLabel: Record<NidaLayer, string> = {
  base: "Base",
  shift: "Shift",
  altGr: "AltGr",
};

const layoutKeys = NIDA_KEY_ROWS.flat();
const layoutCodes = new Set(layoutKeys.map((layoutKey) => layoutKey.code));

function layerForHint(active: PhysicalKeyHint | undefined): NidaLayer {
  if (active?.altGr) return "altGr";
  if (active?.shift) return "shift";
  return "base";
}

function layerForEvent(event: KeyboardEvent): NidaLayer {
  if (event.altKey) return "altGr";
  if (event.shiftKey) return "shift";
  return "base";
}

function isShiftCode(code: string) {
  return code === "ShiftLeft" || code === "ShiftRight";
}

function isAltCode(code: string) {
  return code === "AltLeft" || code === "AltRight";
}

export function NidaKeyboard({ active, defaultMode = "interactable" }: NidaKeyboardProps) {
  const activeLayer = layerForHint(active);
  const [mode, setMode] = useState<NidaKeyboardMode>(defaultMode);
  const [selectedLayer, setSelectedLayer] = useState<NidaLayer>("base");
  const [heldLayer, setHeldLayer] = useState<NidaLayer | null>(null);
  const [pressedCodes, setPressedCodes] = useState<Set<string>>(() => new Set());
  const [lastCode, setLastCode] = useState<string | null>(null);

  const layer = heldLayer ?? (mode === "follow" ? activeLayer : selectedLayer);
  const physicalLayer = heldLayer ?? "base";
  const characterRows = NIDA_KEY_ROWS.slice(0, -1);
  const spaceKey = NIDA_KEY_ROWS.at(-1)![0];
  const lastLayoutKey = lastCode
    ? layoutKeys.find((layoutKey) => layoutKey.code === lastCode)
    : undefined;
  const lastOutput = lastLayoutKey ? outputForLayer(lastLayoutKey, layer) : "";

  useEffect(() => {
    const press = (event: KeyboardEvent) => {
      const eventLayer = layerForEvent(event);
      setHeldLayer(eventLayer === "base" ? null : eventLayer);

      if (!layoutCodes.has(event.code) && !isShiftCode(event.code) && !isAltCode(event.code)) {
        return;
      }

      setPressedCodes((current) => new Set(current).add(event.code));
      if (layoutCodes.has(event.code)) setLastCode(event.code);
    };

    const release = (event: KeyboardEvent) => {
      const eventLayer = layerForEvent(event);
      setHeldLayer(eventLayer === "base" ? null : eventLayer);
      setPressedCodes((current) => {
        const next = new Set(current);
        next.delete(event.code);
        return next;
      });
    };

    const reset = () => {
      setHeldLayer(null);
      setPressedCodes(new Set());
    };

    window.addEventListener("keydown", press);
    window.addEventListener("keyup", release);
    window.addEventListener("blur", reset);
    return () => {
      window.removeEventListener("keydown", press);
      window.removeEventListener("keyup", release);
      window.removeEventListener("blur", reset);
    };
  }, []);

  const pressPointerKey = (code: string, modifier?: NidaLayer) => {
    setMode("interactable");
    setPressedCodes((current) => new Set(current).add(code));
    if (modifier) setHeldLayer(modifier);
    if (layoutCodes.has(code)) setLastCode(code);
  };

  const releasePointerKey = (code: string) => {
    setPressedCodes((current) => {
      const next = new Set(current);
      next.delete(code);
      return next;
    });
    if (isShiftCode(code) || isAltCode(code)) setHeldLayer(null);
  };

  const feedbackFor = (code: string): "correct" | "incorrect" | undefined => {
    if (mode !== "follow" || !pressedCodes.has(code)) return undefined;
    return active?.code === code && activeLayer === physicalLayer ? "correct" : "incorrect";
  };

  return (
    <div
      className="mx-auto hidden w-[min(780px,100%)] rounded-2xl border border-transparent px-3 py-2 transition-[border-color,background] focus-within:border-[color-mix(in_srgb,var(--accent)_20%,transparent)] focus-within:bg-[color-mix(in_srgb,var(--bg-raised)_48%,transparent)] md:block"
      aria-label={`Khmer NIDA keyboard, ${mode} mode, ${layerLabel[layer]} layer`}
      data-mode={mode}
      data-testid="nida-keyboard"
      onFocusCapture={() => setMode("interactable")}
      tabIndex={0}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-[9px] font-semibold uppercase tracking-[.14em] text-app-dim">
            Khmer NIDA · Complete layout
          </p>
          <p className="m-0 mt-1 truncate text-[9px] text-app-dim" aria-live="polite">
            {mode === "follow"
              ? `Following lesson · ${active ? `next: ${keyInstructionLabel(active)}` : "waiting for a target"}`
              : lastOutput
                ? `${lastLayoutKey?.key} produces ${displayNidaOutput(lastOutput)}`
                : "Press or click a key to explore"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="flex gap-0.5 rounded-lg border border-app-line bg-app-raised p-[3px]"
            role="group"
            aria-label="Keyboard mode"
          >
            {(["follow", "interactable"] as const).map((option) => (
              <button
                key={option}
                className="cursor-pointer rounded-[5px] px-2 py-1 text-[8px] font-semibold uppercase tracking-[.08em] text-app-dim transition-colors hover:text-app-accent data-[selected=true]:bg-app-accent-soft data-[selected=true]:text-app-accent"
                data-selected={mode === option}
                aria-pressed={mode === option}
                onClick={() => setMode(option)}
                type="button"
              >
                {option === "follow" ? "Follow" : "Interact"}
              </button>
            ))}
          </div>
          <div
            className="flex gap-0.5 rounded-lg border border-app-line bg-app-raised p-[3px]"
            role="group"
            aria-label="Keyboard layer"
          >
            {(Object.keys(layerLabel) as NidaLayer[]).map((option) => (
              <button
                key={option}
                className="cursor-pointer rounded-[5px] px-2 py-1 text-[8px] font-semibold uppercase tracking-[.08em] text-app-dim transition-colors hover:text-app-accent data-[selected=true]:bg-app-accent-soft data-[selected=true]:text-app-accent"
                data-selected={layer === option}
                aria-pressed={layer === option}
                onClick={() => {
                  setMode("interactable");
                  setSelectedLayer(option);
                }}
                type="button"
              >
                {layerLabel[option]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {characterRows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={cx(
            "mb-1.5 flex justify-center gap-1.5",
            rowIndex === 1 && "px-5",
            rowIndex === 2 && "px-8",
            rowIndex === 3 && "px-14",
          )}
        >
          {row.map((layoutKey) => {
            const target = mode === "follow" && active?.code === layoutKey.code;
            const pressed = pressedCodes.has(layoutKey.code);
            const output = outputForLayer(layoutKey, layer);
            return (
              <button
                key={layoutKey.code}
                className="relative grid h-12 min-w-0 max-w-[50px] flex-1 cursor-pointer place-items-center rounded-md border border-app-line bg-app-surface p-0 text-app-dim shadow-[0_3px_0_var(--line)] transition-[color,background,transform,box-shadow,border-color] hover:border-[color-mix(in_srgb,var(--accent)_28%,transparent)] hover:text-app-soft data-[target=true]:-translate-y-0.5 data-[target=true]:border-[color-mix(in_srgb,var(--accent)_55%,transparent)] data-[target=true]:bg-app-accent-soft data-[target=true]:text-app-accent data-[target=true]:shadow-[0_5px_16px_var(--accent-soft)] data-[pressed=true]:translate-y-[2px] data-[pressed=true]:shadow-none data-[feedback=correct]:border-[color-mix(in_srgb,var(--correct)_72%,transparent)] data-[feedback=correct]:bg-[color-mix(in_srgb,var(--correct)_14%,var(--surface))] data-[feedback=correct]:text-app-correct data-[feedback=incorrect]:border-[color-mix(in_srgb,var(--error)_65%,transparent)] data-[feedback=incorrect]:bg-[color-mix(in_srgb,var(--error)_13%,var(--surface))] data-[feedback=incorrect]:text-app-error"
                data-feedback={feedbackFor(layoutKey.code)}
                data-pressed={pressed}
                data-target={target}
                title={`${layoutKey.key}: ${displayNidaOutput(output) || "No output"}`}
                aria-label={`${layoutKey.key}: ${displayNidaOutput(output) || "No output"}`}
                onPointerDown={() => pressPointerKey(layoutKey.code)}
                onPointerUp={() => releasePointerKey(layoutKey.code)}
                onPointerCancel={() => releasePointerKey(layoutKey.code)}
                onPointerLeave={() => releasePointerKey(layoutKey.code)}
                type="button"
              >
                <small className="absolute left-1.5 top-0.5 text-[7px] font-semibold opacity-55">
                  {layoutKey.key}
                </small>
                <b className="font-khmer text-[15px] font-normal leading-none">
                  {output ? displayNidaOutput(output) : "·"}
                </b>
              </button>
            );
          })}
        </div>
      ))}

      <div className="mt-2 flex items-end justify-center gap-2">
        <button
          className="grid h-9 w-24 cursor-pointer place-items-center rounded-md border border-app-line bg-app-surface text-[8px] font-semibold uppercase tracking-[.08em] text-app-dim transition-[transform,color,background,border-color] data-[pressed=true]:translate-y-px data-[pressed=true]:bg-app-accent-soft data-[pressed=true]:text-app-accent data-[target=true]:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] data-[target=true]:text-app-accent"
          data-pressed={pressedCodes.has("ShiftLeft") || pressedCodes.has("ShiftRight")}
          data-target={mode === "follow" && active?.shift}
          aria-label="Hold Shift"
          onPointerDown={() => pressPointerKey("ShiftLeft", "shift")}
          onPointerUp={() => releasePointerKey("ShiftLeft")}
          onPointerCancel={() => releasePointerKey("ShiftLeft")}
          onPointerLeave={() => releasePointerKey("ShiftLeft")}
          type="button"
        >
          Shift
        </button>
        <button
          className="grid h-9 w-64 cursor-pointer place-items-center rounded-md border border-app-line bg-app-surface font-khmer text-[10px] text-app-dim shadow-[0_3px_0_var(--line)] transition-[transform,color,background,border-color,box-shadow] data-[pressed=true]:translate-y-[2px] data-[pressed=true]:bg-app-accent-soft data-[pressed=true]:text-app-accent data-[pressed=true]:shadow-none data-[target=true]:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] data-[target=true]:text-app-accent"
          data-feedback={feedbackFor("Space")}
          data-pressed={pressedCodes.has("Space")}
          data-target={mode === "follow" && active?.code === "Space"}
          aria-label={`Space key: ${displayNidaOutput(outputForLayer(spaceKey, layer))}`}
          onPointerDown={() => pressPointerKey("Space")}
          onPointerUp={() => releasePointerKey("Space")}
          onPointerCancel={() => releasePointerKey("Space")}
          onPointerLeave={() => releasePointerKey("Space")}
          type="button"
        >
          {displayNidaOutput(outputForLayer(spaceKey, layer))}
        </button>
        <button
          className="grid h-9 w-24 cursor-pointer place-items-center rounded-md border border-app-line bg-app-surface text-[8px] font-semibold uppercase tracking-[.08em] text-app-dim transition-[transform,color,background,border-color] data-[pressed=true]:translate-y-px data-[pressed=true]:bg-app-accent-soft data-[pressed=true]:text-app-accent data-[target=true]:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] data-[target=true]:text-app-accent"
          data-pressed={pressedCodes.has("AltLeft") || pressedCodes.has("AltRight")}
          data-target={mode === "follow" && active?.altGr}
          aria-label="Hold Alt"
          onPointerDown={() => pressPointerKey("AltRight", "altGr")}
          onPointerUp={() => releasePointerKey("AltRight")}
          onPointerCancel={() => releasePointerKey("AltRight")}
          onPointerLeave={() => releasePointerKey("AltRight")}
          type="button"
        >
          Alt
        </button>
      </div>
    </div>
  );
}

function keyInstructionLabel(hint: PhysicalKeyHint): string {
  return [hint.altGr && "Alt", hint.shift && "Shift", hint.key].filter(Boolean).join(" + ");
}
