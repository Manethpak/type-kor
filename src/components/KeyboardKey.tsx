import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import { cx } from "../utils/classNames";

interface KeyboardKeyProps extends ComponentPropsWithoutRef<"button"> {
  width: CSSProperties["width"];
}

export function KeyboardKey({ width, className, style, ...props }: KeyboardKeyProps) {
  return (
    <button
      className={cx(
        "relative grid h-12 min-w-0 shrink cursor-pointer place-items-center rounded-md border border-app-line bg-app-surface p-0 text-app-dim shadow-[0_3px_0_var(--line)] transition-[color,background,transform,box-shadow,border-color] hover:border-[color-mix(in_srgb,var(--accent)_28%,transparent)] hover:text-app-soft data-[target=true]:-translate-y-0.5 data-[target=true]:border-[color-mix(in_srgb,var(--accent)_55%,transparent)] data-[target=true]:bg-app-accent-soft data-[target=true]:text-app-accent data-[target=true]:shadow-[0_5px_16px_var(--accent-soft)] data-[pressed=true]:translate-y-[2px] data-[pressed=true]:shadow-none data-[highlight=true]:border-[color-mix(in_srgb,var(--accent)_65%,transparent)] data-[highlight=true]:bg-app-accent-soft data-[highlight=true]:text-app-accent data-[feedback=correct]:border-[color-mix(in_srgb,var(--correct)_72%,transparent)] data-[feedback=correct]:bg-[color-mix(in_srgb,var(--correct)_14%,var(--surface))] data-[feedback=correct]:text-app-correct data-[feedback=incorrect]:border-[color-mix(in_srgb,var(--error)_65%,transparent)] data-[feedback=incorrect]:bg-[color-mix(in_srgb,var(--error)_13%,var(--surface))] data-[feedback=incorrect]:text-app-error",
        className,
      )}
      style={{ ...style, width }}
      type="button"
      {...props}
    />
  );
}
