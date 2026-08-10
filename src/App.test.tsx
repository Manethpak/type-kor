import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("timed typing test", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-10T09:00:00Z"));
    localStorage.clear();
    localStorage.setItem("typkh:settings", JSON.stringify({ mode: "time", modeValue: 1 }));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    localStorage.clear();
  });

  it("starts from input when beforeinput is unavailable and stops at the deadline", async () => {
    const { container } = render(<App />);
    const capture = screen.getByLabelText("Type the displayed Khmer text");
    const firstCluster = container.querySelector<HTMLElement>("[data-cluster='0']")!;

    fireEvent.input(capture, {
      target: { value: firstCluster.textContent },
      inputType: "insertText",
      data: firstCluster.textContent,
    });

    expect(screen.getByTestId("countdown")).toHaveTextContent("1");
    await act(() => vi.advanceTimersByTimeAsync(1_100));
    expect(screen.getByText("លទ្ធផលរបស់អ្នក")).toBeVisible();
    expect(screen.getByRole("img", { name: /Per-second typing speed chart, peak \d+ cpm/ })).toBeVisible();
  });

  it("switches the live counter between CPM and WPM", () => {
    render(<App />);
    const switcher = screen.getByRole("group", { name: "Speed unit" });
    const cpm = switcher.querySelector<HTMLButtonElement>("button[aria-pressed='true']")!;
    expect(cpm).toHaveTextContent("cpm");

    fireEvent.click(within(switcher).getByRole("button", { name: "wpm" }));
    expect(within(switcher).getByRole("button", { name: "wpm" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("live-speed").nextElementSibling).toHaveTextContent("wpm");
  });
});
