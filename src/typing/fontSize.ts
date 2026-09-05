import type { FontSize } from "./types";

interface FontSizeOption {
  value: FontSize;
  label: string;
  promptClass: string;
  previewClass: string;
}

export const FONT_SIZE_OPTIONS: readonly FontSizeOption[] = [
  {
    value: "small",
    label: "តូច",
    promptClass: "text-4xl sm:text-5xl",
    previewClass: "text-2xl",
  },
  {
    value: "medium",
    label: "មធ្យម",
    promptClass: "text-5xl sm:text-6xl",
    previewClass: "text-3xl",
  },
  {
    value: "large",
    label: "ធំ",
    promptClass: "text-6xl sm:text-7xl",
    previewClass: "text-4xl",
  },
];

export function getFontSizeOption(fontSize: FontSize): FontSizeOption {
  return FONT_SIZE_OPTIONS.find((option) => option.value === fontSize) ?? FONT_SIZE_OPTIONS[1];
}
