import { useEffect, useState } from "react";
import { displayNidaOutput, NIDA_KEY_ROWS, outputForLayer, type NidaLayer } from "../learning/nida";
import type { PhysicalKeyHint } from "../learning/types";
import { cx } from "../utils/classNames";

const layerLabel: Record<NidaLayer, string> = {
  base: "Base",
  shift: "Shift",
  altGr: "AltGr",
};

function layerForHint(active: PhysicalKeyHint | undefined): NidaLayer {
  if (active?.altGr) return "altGr";
  if (active?.shift) return "shift";
  return "base";
}

export function NidaKeyboard({ active }: { active: PhysicalKeyHint | undefined }) {
  const activeLayer = layerForHint(active);
  const [layer, setLayer] = useState<NidaLayer>(activeLayer);

  useEffect(() => setLayer(activeLayer), [active?.altGr, active?.code, active?.shift, activeLayer]);

  const characterRows = NIDA_KEY_ROWS.slice(0, -1);
  const spaceKey = NIDA_KEY_ROWS.at(-1)![0];

  return (
    <div
      className="mx-auto hidden w-[min(780px,100%)] md:block"
      aria-label={`Khmer NIDA keyboard, ${layerLabel[layer]} layer`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="m-0 text-[9px] font-semibold uppercase tracking-[.14em] text-app-dim">
          Khmer NIDA · Complete layout
        </p>
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
              onClick={() => setLayer(option)}
            >
              {layerLabel[option]}
            </button>
          ))}
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
            const selected = active?.code === layoutKey.code;
            const output = outputForLayer(layoutKey, layer);
            return (
              <span
                key={layoutKey.code}
                className="relative grid h-12 min-w-0 max-w-[50px] flex-1 place-items-center rounded-md border border-app-line bg-app-surface text-app-dim shadow-[0_3px_0_var(--line)] transition-[color,background,transform,box-shadow] data-[active=true]:-translate-y-0.5 data-[active=true]:border-[color-mix(in_srgb,var(--accent)_55%,transparent)] data-[active=true]:bg-app-accent-soft data-[active=true]:text-app-accent data-[active=true]:shadow-[0_5px_16px_var(--accent-soft)]"
                data-active={selected}
                title={`${layoutKey.key}: ${displayNidaOutput(output) || "No output"}`}
              >
                <small className="absolute left-1.5 top-0.5 text-[7px] font-semibold opacity-55">
                  {layoutKey.key}
                </small>
                <b className="font-khmer text-[15px] font-normal leading-none">
                  {output ? displayNidaOutput(output) : "·"}
                </b>
              </span>
            );
          })}
        </div>
      ))}

      <div className="mt-2 flex items-end justify-center gap-2">
        <span
          className="grid h-9 w-24 place-items-center rounded-md border border-app-line bg-app-surface text-[8px] font-semibold uppercase tracking-[.08em] text-app-dim data-[active=true]:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] data-[active=true]:bg-app-accent-soft data-[active=true]:text-app-accent"
          data-active={active?.shift}
        >
          Shift
        </span>
        <span
          className="grid h-9 w-64 place-items-center rounded-md border border-app-line bg-app-surface font-khmer text-[10px] text-app-dim shadow-[0_3px_0_var(--line)] data-[active=true]:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] data-[active=true]:bg-app-accent-soft data-[active=true]:text-app-accent"
          data-active={active?.code === "Space"}
        >
          {displayNidaOutput(outputForLayer(spaceKey, layer))}
        </span>
        <span
          className="grid h-9 w-24 place-items-center rounded-md border border-app-line bg-app-surface text-[8px] font-semibold uppercase tracking-[.08em] text-app-dim data-[active=true]:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] data-[active=true]:bg-app-accent-soft data-[active=true]:text-app-accent"
          data-active={active?.altGr}
        >
          AltGr
        </span>
      </div>
    </div>
  );
}
