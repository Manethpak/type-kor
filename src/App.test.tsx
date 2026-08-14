import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

function renderApp(initialEntry = "/") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <App />
    </MemoryRouter>,
  );
}

const completedOnboarding = {
  schemaVersion: 1,
  onboardingCompleted: true,
  lastExperience: "test",
};

describe("timed typing test", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-10T09:00:00Z"));
    localStorage.clear();
    localStorage.setItem("typkh:settings", JSON.stringify({ mode: "time", modeValue: 1 }));
    localStorage.setItem("typkh:app-state", JSON.stringify(completedOnboarding));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    localStorage.clear();
  });

  it("starts from input when beforeinput is unavailable and stops at the deadline", async () => {
    const { container } = renderApp();
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
    expect(
      screen.getByRole("img", { name: /Per-second typing speed chart, peak \d+ cpm/ }),
    ).toBeVisible();
  });

  it("switches the live counter between CPM and WPM", () => {
    renderApp();
    const switcher = screen.getByRole("group", { name: "Speed unit" });
    const cpm = switcher.querySelector<HTMLButtonElement>("button[aria-pressed='true']")!;
    expect(cpm).toHaveTextContent("cpm");

    fireEvent.click(within(switcher).getByRole("button", { name: "wpm" }));
    expect(within(switcher).getByRole("button", { name: "wpm" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("live-speed").nextElementSibling).toHaveTextContent("wpm");
  });

  it("renders route pages and supports browser-style navigation", () => {
    renderApp("/settings");
    expect(screen.getByRole("heading", { name: "ការកំណត់" })).toBeVisible();

    fireEvent.click(screen.getByTitle("Local history"));
    expect(screen.getByRole("heading", { name: "ប្រវត្តិការវាយ" })).toBeVisible();

    fireEvent.click(screen.getByTitle("Typing test"));
    expect(screen.getByLabelText("Khmer typing test")).toBeVisible();
  });

  it("onboards once and remembers the selected learning experience", () => {
    localStorage.removeItem("typkh:app-state");
    renderApp();

    expect(screen.getByRole("heading", { name: "តើអ្នកចង់ចាប់ផ្ដើមដោយរបៀបណា?" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /រៀន Learn/ }));

    expect(screen.getByRole("heading", { name: "រៀនវាយអក្សរខ្មែរ" })).toBeVisible();
    expect(JSON.parse(localStorage.getItem("typkh:app-state")!)).toMatchObject({
      onboardingCompleted: true,
      lastExperience: "learn",
    });
  });

  it("resumes a validated learning checkpoint from the root route", () => {
    localStorage.setItem(
      "typkh:app-state",
      JSON.stringify({ ...completedOnboarding, lastExperience: "learn" }),
    );
    localStorage.setItem(
      "typkh:learning",
      JSON.stringify({
        schemaVersion: 1,
        progress: {},
        checkpoint: { lessonId: "home-anchors", stepIndex: 3, errors: 1 },
      }),
    );

    renderApp();
    expect(screen.getByLabelText("Type ហ")).toBeVisible();
  });

  it("checkpoints each completed lesson target independently from test history", () => {
    renderApp("/learn/home-anchors");
    const input = screen.getByLabelText("Type ក");
    fireEvent.input(input, { target: { value: "ក" }, inputType: "insertText", data: "ក" });

    expect(screen.getByLabelText("Type ល")).toBeVisible();
    expect(JSON.parse(localStorage.getItem("typkh:learning")!)).toMatchObject({
      checkpoint: { lessonId: "home-anchors", stepIndex: 1, errors: 0 },
    });
  });

  it("keeps Learn and Test in primary navigation instead of the work surface", () => {
    renderApp("/test");
    expect(screen.queryByRole("group", { name: "Practice mode" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Learn"));
    expect(screen.getByRole("heading", { name: "រៀនវាយអក្សរខ្មែរ" })).toBeVisible();
    expect(JSON.parse(localStorage.getItem("typkh:app-state")!)).toMatchObject({
      lastExperience: "learn",
    });

    fireEvent.click(screen.getByTitle("Typing test"));
    expect(screen.getByLabelText("Khmer typing test")).toBeVisible();
  });

  it("records mastery after a lesson is completed at full accuracy", () => {
    renderApp("/learn/home-anchors");
    for (const prompt of ["ក", "ល", "ស", "ហ", "កល", "សក", "ហល", "សាលា"]) {
      fireEvent.input(screen.getByLabelText(`Type ${prompt}`), {
        target: { value: prompt },
        inputType: "insertText",
        data: prompt,
      });
    }

    expect(screen.getByLabelText("Lesson complete")).toBeVisible();
    expect(JSON.parse(localStorage.getItem("typkh:learning")!)).toMatchObject({
      checkpoint: null,
      progress: {
        "home-anchors": { attempts: 1, bestAccuracy: 100 },
      },
    });
  });

  it("falls back to onboarding when app state is malformed", () => {
    localStorage.setItem("typkh:app-state", "not-json");
    renderApp();
    expect(screen.getByRole("heading", { name: "តើអ្នកចង់ចាប់ផ្ដើមដោយរបៀបណា?" })).toBeVisible();
  });
});
