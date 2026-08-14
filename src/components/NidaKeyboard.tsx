import type { PhysicalKeyHint } from "../learning/types";
import { cx } from "../utils/classNames";

const rows = [
  [
    ["KeyQ", "Q", "ឆ"],
    ["KeyW", "W", "ឹ"],
    ["KeyE", "E", "េ"],
    ["KeyR", "R", "រ"],
    ["KeyT", "T", "ត"],
    ["KeyY", "Y", "យ"],
    ["KeyU", "U", "ុ"],
    ["KeyI", "I", "ិ"],
    ["KeyO", "O", "ោ"],
    ["KeyP", "P", "ផ"],
  ],
  [
    ["KeyA", "A", "ា"],
    ["KeyS", "S", "ស"],
    ["KeyD", "D", "ដ"],
    ["KeyF", "F", "ថ"],
    ["KeyG", "G", "ង"],
    ["KeyH", "H", "ហ"],
    ["KeyJ", "J", "្"],
    ["KeyK", "K", "ក"],
    ["KeyL", "L", "ល"],
    ["Semicolon", ";", "ើ"],
  ],
  [
    ["KeyZ", "Z", "ឋ"],
    ["KeyX", "X", "ខ"],
    ["KeyC", "C", "ច"],
    ["KeyV", "V", "វ"],
    ["KeyB", "B", "ប"],
    ["KeyN", "N", "ន"],
    ["KeyM", "M", "ម"],
    ["Comma", ",", "ុំ"],
    ["Period", ".", "។"],
  ],
] as const;

export function NidaKeyboard({ active }: { active: PhysicalKeyHint | undefined }) {
  return (
    <div className="mx-auto hidden w-[min(660px,100%)] md:block" aria-hidden="true">
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={cx(
            "mb-1.5 flex justify-center gap-1.5",
            rowIndex === 1 && "pl-5",
            rowIndex === 2 && "pl-10",
          )}
        >
          {row.map(([code, latin, khmer]) => {
            const selected = active?.code === code;
            return (
              <span
                key={code}
                className="relative grid h-10 w-12 place-items-center rounded-md border border-app-line bg-app-surface text-app-dim shadow-[0_3px_0_var(--line)] transition-[color,background,transform,box-shadow] data-[active=true]:-translate-y-0.5 data-[active=true]:border-[color-mix(in_srgb,var(--accent)_55%,transparent)] data-[active=true]:bg-app-accent-soft data-[active=true]:text-app-accent data-[active=true]:shadow-[0_5px_16px_var(--accent-soft)]"
                data-active={selected}
              >
                <small className="absolute left-1.5 top-0.5 text-[7px] font-semibold opacity-55">
                  {latin}
                </small>
                <b className="font-khmer text-base font-normal">
                  {selected ? active.output : khmer}
                </b>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
