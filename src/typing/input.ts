import { khmerTextEngine } from "../engine/khmer";
import type { OrthographicCluster } from "../engine/types";

export function getInputDelta(previousValue: string, nextValue: string) {
  const previous = Array.from(previousValue);
  const next = Array.from(nextValue);
  let prefix = 0;
  while (prefix < previous.length && prefix < next.length && previous[prefix] === next[prefix]) {
    prefix += 1;
  }

  let suffix = 0;
  while (
    suffix < previous.length - prefix &&
    suffix < next.length - prefix &&
    previous[previous.length - 1 - suffix] === next[next.length - 1 - suffix]
  ) {
    suffix += 1;
  }

  return {
    retainedPrefix: next.slice(0, prefix).join(""),
    inserted: next.slice(prefix, next.length - suffix),
    deletedUnits: previous.length - prefix - suffix,
  };
}

function classifyPendingInput(prompt: OrthographicCluster[], startIndex: number, rawValue: string) {
  let remaining = rawValue;
  let index = startIndex;
  let status: "prefix" | "incorrect" = "prefix";

  while (remaining && index < prompt.length) {
    const target = prompt[index];
    const match = khmerTextEngine.compare(target, remaining);
    if (match === "correct") {
      remaining = "";
      index += 1;
      status = "prefix";
      break;
    }
    if (match === "prefix") {
      status = "prefix";
      break;
    }

    const attempts = khmerTextEngine.segment(remaining);
    if (attempts.length > 1) {
      remaining = remaining.slice(attempts[0].end);
      index += 1;
      continue;
    }
    status = "incorrect";
    break;
  }

  if (remaining && index >= prompt.length) status = "incorrect";
  return { index, remaining, status };
}

export function countInsertedInputErrors(
  prompt: OrthographicCluster[],
  currentIndex: number,
  retainedPrefix: string,
  inserted: string[],
): number {
  let analysis = classifyPendingInput(prompt, currentIndex, retainedPrefix);
  let errors = 0;
  for (const unit of inserted) {
    analysis = classifyPendingInput(prompt, analysis.index, `${analysis.remaining}${unit}`);
    if (analysis.status === "incorrect") errors += 1;
  }
  return errors;
}
