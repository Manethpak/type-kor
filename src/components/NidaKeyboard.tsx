import { useEffect, useRef, useState } from "react";
import { displayNidaOutput, NIDA_KEY_ROWS, outputForLayer, type NidaLayer } from "../learning/nida";
import type { PhysicalKeyHint } from "../learning/types";
import { cx } from "../utils/classNames";
import { getAltGrModifierLabel } from "../utils/platform";
import { KeyboardKey } from "./KeyboardKey";

export type NidaKeyboardMode = "follow" | "interactable";

interface NidaKeyboardProps {
  active: PhysicalKeyHint | undefined;
  mode?: NidaKeyboardMode;
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

function isShiftCode(code: string) {
  return code === "ShiftLeft" || code === "ShiftRight";
}

export function NidaKeyboard({ active, mode = "interactable" }: NidaKeyboardProps) {
  const altGrModifierLabel = getAltGrModifierLabel();
  const activeLayer = layerForHint(active);
  const [selectedLayer, setSelectedLayer] = useState<NidaLayer>("base");
  const [heldLayer, setHeldLayer] = useState<NidaLayer | null>(null);
  const [pressedCodes, setPressedCodes] = useState<Set<string>>(() => new Set());
  const [lastCode, setLastCode] = useState<string | null>(null);
  const rightAltHeldRef = useRef(false);
  const shiftHeldRef = useRef(false);

  const layer = heldLayer ?? (mode === "follow" ? activeLayer : selectedLayer);
  const physicalLayer = heldLayer ?? "base";
  const characterRows = NIDA_KEY_ROWS.slice(0, -1);
  const spaceKey = NIDA_KEY_ROWS.at(-1)![0];
  const lastLayoutKey = lastCode
    ? layoutKeys.find((layoutKey) => layoutKey.code === lastCode)
    : undefined;
  const lastOutput = lastLayoutKey ? outputForLayer(lastLayoutKey, layer) : "";

  useEffect(() => {
    const syncHeldLayer = () => {
      setHeldLayer(rightAltHeldRef.current ? "altGr" : shiftHeldRef.current ? "shift" : null);
    };

    const press = (event: KeyboardEvent) => {
      const isAltGr =
        event.code === "AltRight" || event.getModifierState("AltGraph") || rightAltHeldRef.current;
      const isBrowserShortcut = event.metaKey || (event.ctrlKey && !isAltGr);
      const isInteractiveKey = layoutCodes.has(event.code) || event.code === "AltRight";

      if (mode === "interactable" && isInteractiveKey && !isBrowserShortcut) {
        event.preventDefault();
      }
      if (event.code === "AltRight" || event.getModifierState("AltGraph")) {
        rightAltHeldRef.current = true;
      }
      shiftHeldRef.current = event.shiftKey;
      syncHeldLayer();

      if (!layoutCodes.has(event.code) && !isShiftCode(event.code) && event.code !== "AltRight") {
        return;
      }

      setPressedCodes((current) => new Set(current).add(event.code));
      if (layoutCodes.has(event.code)) setLastCode(event.code);
    };

    const release = (event: KeyboardEvent) => {
      if (event.code === "AltRight") {
        event.preventDefault();
      }
      if (event.code === "AltRight") rightAltHeldRef.current = false;
      shiftHeldRef.current = event.shiftKey;
      syncHeldLayer();
      setPressedCodes((current) => {
        const next = new Set(current);
        next.delete(event.code);
        return next;
      });
    };

    const reset = () => {
      rightAltHeldRef.current = false;
      shiftHeldRef.current = false;
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
  }, [mode]);

  const pressPointerKey = (code: string, modifier?: NidaLayer) => {
    setPressedCodes((current) => new Set(current).add(code));
    if (modifier === "shift") shiftHeldRef.current = true;
    if (modifier === "altGr") rightAltHeldRef.current = true;
    if (modifier) setHeldLayer(modifier);
    if (layoutCodes.has(code)) setLastCode(code);
  };

  const releasePointerKey = (code: string) => {
    setPressedCodes((current) => {
      const next = new Set(current);
      next.delete(code);
      return next;
    });
    if (isShiftCode(code)) shiftHeldRef.current = false;
    if (code === "AltRight") rightAltHeldRef.current = false;
    if (isShiftCode(code) || code === "AltRight") {
      setHeldLayer(rightAltHeldRef.current ? "altGr" : shiftHeldRef.current ? "shift" : null);
    }
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
      tabIndex={0}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-xs font-semibold uppercase tracking-[.14em] text-app-dim">
            Khmer NIDA · Complete layout
          </p>
          <p className="m-0 mt-1 truncate text-xs text-app-dim" aria-live="polite">
            {mode === "follow"
              ? `Following lesson · ${active ? `next: ${keyInstructionLabel(active, altGrModifierLabel)}` : "waiting for a target"}`
              : lastOutput
                ? `${lastLayoutKey?.key} produces ${displayNidaOutput(lastOutput)}`
                : "Press or click a key to explore"}
          </p>
        </div>

        {mode === "interactable" && (
          <div
            className="flex gap-0.5 rounded-lg border border-app-line bg-app-raised p-[3px]"
            role="group"
            aria-label="Keyboard layer"
          >
            {(Object.keys(layerLabel) as NidaLayer[]).map((option) => (
              <button
                key={option}
                className="cursor-pointer rounded-[5px] px-2 py-1 text-xs font-semibold uppercase tracking-[.08em] text-app-dim transition-colors hover:text-app-accent data-[selected=true]:bg-app-accent-soft data-[selected=true]:text-app-accent"
                data-selected={layer === option}
                aria-pressed={layer === option}
                onClick={() => setSelectedLayer(option)}
                type="button"
              >
                {layerLabel[option]}
              </button>
            ))}
          </div>
        )}
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
              <KeyboardKey
                key={layoutKey.code}
                width={layoutKey.width ?? 50}
                data-feedback={feedbackFor(layoutKey.code)}
                data-highlight={mode === "interactable" && pressed}
                data-pressed={pressed}
                data-target={target}
                title={`${layoutKey.key}: ${displayNidaOutput(output) || "No output"}`}
                aria-label={`${layoutKey.key}: ${displayNidaOutput(output) || "No output"}`}
                onPointerDown={() => pressPointerKey(layoutKey.code)}
                onPointerUp={() => releasePointerKey(layoutKey.code)}
                onPointerCancel={() => releasePointerKey(layoutKey.code)}
                onPointerLeave={() => releasePointerKey(layoutKey.code)}
              >
                <small className="absolute left-1.5 top-0.5 text-xs font-semibold opacity-55">
                  {layoutKey.key}
                </small>
                <b className="font-khmer text-sm font-normal leading-none">
                  {output ? displayNidaOutput(output) : "·"}
                </b>
              </KeyboardKey>
            );
          })}
        </div>
      ))}

      <div className="mt-2 flex items-end justify-center gap-2">
        <KeyboardKey
          width={96}
          data-highlight={
            mode === "interactable" &&
            (pressedCodes.has("ShiftLeft") || pressedCodes.has("ShiftRight"))
          }
          data-pressed={pressedCodes.has("ShiftLeft") || pressedCodes.has("ShiftRight")}
          data-target={mode === "follow" && active?.shift}
          aria-label="Hold Shift"
          onPointerDown={() => pressPointerKey("ShiftLeft", "shift")}
          onPointerUp={() => releasePointerKey("ShiftLeft")}
          onPointerCancel={() => releasePointerKey("ShiftLeft")}
          onPointerLeave={() => releasePointerKey("ShiftLeft")}
        >
          Shift
        </KeyboardKey>
        <KeyboardKey
          width={256}
          data-feedback={feedbackFor("Space")}
          data-highlight={mode === "interactable" && pressedCodes.has("Space")}
          data-pressed={pressedCodes.has("Space")}
          data-target={mode === "follow" && active?.code === "Space"}
          aria-label={`Space key: ${displayNidaOutput(outputForLayer(spaceKey, layer))}`}
          onPointerDown={() => pressPointerKey("Space")}
          onPointerUp={() => releasePointerKey("Space")}
          onPointerCancel={() => releasePointerKey("Space")}
          onPointerLeave={() => releasePointerKey("Space")}
        >
          {displayNidaOutput(outputForLayer(spaceKey, layer))}
        </KeyboardKey>
        <KeyboardKey
          width={96}
          data-highlight={mode === "interactable" && pressedCodes.has("AltRight")}
          data-pressed={pressedCodes.has("AltRight")}
          data-target={mode === "follow" && active?.altGr}
          aria-label={`Hold ${altGrModifierLabel}`}
          onPointerDown={() => pressPointerKey("AltRight", "altGr")}
          onPointerUp={() => releasePointerKey("AltRight")}
          onPointerCancel={() => releasePointerKey("AltRight")}
          onPointerLeave={() => releasePointerKey("AltRight")}
        >
          {altGrModifierLabel}
        </KeyboardKey>
      </div>
    </div>
  );
}

function keyInstructionLabel(hint: PhysicalKeyHint, altGrModifierLabel: string): string {
  return [hint.altGr && altGrModifierLabel, hint.shift && "Shift", hint.key]
    .filter(Boolean)
    .join(" + ");
}
