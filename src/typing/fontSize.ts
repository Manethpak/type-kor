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
    promptClass: "text-[1.8rem] sm:text-[2rem]",
    previewClass: "text-[2rem]",
  },
  {
    value: "medium",
    label: "មធ្យម",
    promptClass: "text-[2.3rem] sm:text-[2.5rem]",
    previewClass: "text-[2.5rem]",
  },
  {
    value: "large",
    label: "ធំ",
    promptClass: "text-[2.8rem] sm:text-[3rem]",
    previewClass: "text-[3rem]",
  },
];

export function getFontSizeOption(fontSize: FontSize): FontSizeOption {
  return FONT_SIZE_OPTIONS.find((option) => option.value === fontSize) ?? FONT_SIZE_OPTIONS[1];
}
