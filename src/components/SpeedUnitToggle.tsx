import type { TestSettings } from "../typing/types";
import { cx } from "../utils/classNames";

const buttonClass =
  "cursor-pointer rounded-[5px] px-1.5 py-1 text-[8px] font-semibold uppercase tracking-[.08em] text-app-dim transition-colors hover:text-app-accent";
const selectedClass = "bg-app-accent-soft text-app-accent!";

export function SpeedUnitToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: TestSettings["speedUnit"];
  onChange: (unit: TestSettings["speedUnit"]) => void;
}) {
  return (
    <div
      className="flex gap-0.5 rounded-lg border border-app-line bg-app-raised p-[3px]"
      role="group"
      aria-label={label}
    >
      {(["cpm", "wpm"] as const).map((unit) => (
        <button
          key={unit}
          className={cx(buttonClass, value === unit && selectedClass)}
          onClick={() => onChange(unit)}
          aria-pressed={value === unit}
          title={unit === "cpm" ? "Khmer clusters per minute" : "Five-code-point words per minute"}
        >
          {unit}
        </button>
      ))}
    </div>
  );
}
