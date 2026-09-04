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

function typeLessonPrompt(prompt: string) {
  fireEvent.input(screen.getByLabelText(`Type ${prompt}`), {
    target: { value: prompt },
    inputType: "insertText",
    data: prompt,
  });
}

function completeHomeAnchorsLesson() {
  for (const prompt of ["ក", "ល", "ស", "ហ", "កល", "សក", "ហល", "សាលា"]) {
    typeLessonPrompt(prompt);
  }

  for (let index = 0; index < 20; index += 1) {
    const input = screen.getByLabelText(/^Type /);
    typeLessonPrompt(input.getAttribute("aria-label")!.slice(5));
  }
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
    localStorage.setItem("typekor:settings", JSON.stringify({ mode: "time", modeValue: 1 }));
    localStorage.setItem("typekor:app-state", JSON.stringify(completedOnboarding));
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
    for (let elapsed = 0; elapsed < 1_100; elapsed += 100) {
      await act(() => vi.advanceTimersByTimeAsync(100));
    }
    expect(screen.getByRole("heading", { name: "ចង្វាក់នៃការវាយរបស់អ្នក" })).toBeVisible();
    expect(
      screen.getByRole("img", {
        name: /Typing analytics chart: peak \d+ CPM, \d+ WPM, \d+% accuracy/,
      }),
    ).toBeVisible();
  });

  it("switches and persists the preferred speed unit", () => {
    renderApp("/settings");
    const switcher = screen.getByRole("group", { name: "Speed unit" });
    const cpm = switcher.querySelector<HTMLButtonElement>("button[aria-pressed='true']")!;
    expect(cpm).toHaveTextContent("CPM");

    fireEvent.click(within(switcher).getByRole("button", { name: "WPM" }));
    expect(within(switcher).getByRole("button", { name: "WPM" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(JSON.parse(localStorage.getItem("typekor:settings")!)).toMatchObject({
      speedUnit: "wpm",
    });
  });

  it("renders route pages and supports browser-style navigation", () => {
    renderApp("/settings");
    expect(screen.getByRole("heading", { name: "ការកំណត់" })).toBeVisible();

    fireEvent.click(screen.getByTitle("Local history"));
    expect(screen.getByRole("heading", { name: "ប្រវត្តិលទ្ធផលវាយអក្សរ" })).toBeVisible();

    fireEvent.click(screen.getByTitle("Typing test"));
    expect(screen.getByLabelText("Khmer typing test")).toBeVisible();
  });

  it("switches and persists the typing difficulty", () => {
    renderApp("/test");
    const difficulty = screen.getByRole("combobox", { name: "Word difficulty" });

    expect(difficulty).toHaveValue("beginner");

    fireEvent.change(difficulty, { target: { value: "mixed" } });

    expect(difficulty).toHaveValue("mixed");
    expect(JSON.parse(localStorage.getItem("typekor:settings")!)).toMatchObject({
      wordDifficulty: "mixed",
    });
  });

  it("migrates legacy word-list sizes to difficulty", () => {
    localStorage.setItem(
      "typekor:settings",
      JSON.stringify({ schemaVersion: 2, wordListSize: 500 }),
    );
    renderApp("/test");

    expect(screen.getByRole("combobox", { name: "Word difficulty" })).toHaveValue("intermediate");
    expect(JSON.parse(localStorage.getItem("typekor:settings")!)).toMatchObject({
      schemaVersion: 3,
      wordDifficulty: "intermediate",
    });
    expect(JSON.parse(localStorage.getItem("typekor:settings")!)).not.toHaveProperty(
      "wordListSize",
    );
  });

  it("opens the keyboard guide from primary navigation", () => {
    renderApp("/test");
    fireEvent.click(screen.getByTitle("Keyboard guide"));

    expect(screen.getByRole("heading", { name: "មគ្គុទ្ទេសក៍ក្ដារចុច / Keyboard Guide" })).toBeVisible();
    expect(screen.getByTestId("nida-keyboard")).toHaveAttribute("data-mode", "interactable");
    expect(screen.getByRole("group", { name: "Keyboard layer" })).toBeVisible();
  });

  it("redirects the old keyboard route to the keyboard guide", () => {
    renderApp("/keyboard");

    expect(screen.getByRole("heading", { name: "មគ្គុទ្ទេសក៍ក្ដារចុច / Keyboard Guide" })).toBeVisible();
  });

  it("onboards once and remembers the selected learning experience", () => {
    localStorage.removeItem("typekor:app-state");
    renderApp();

    expect(screen.getByRole("heading", { name: "Type ក" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /រៀន Learning mode/ }));

    expect(screen.getByRole("heading", { name: "រៀនវាយអក្សរខ្មែរ" })).toBeVisible();
    expect(JSON.parse(localStorage.getItem("typekor:app-state")!)).toMatchObject({
      onboardingCompleted: true,
      lastExperience: "learn",
    });
  });

  it("resumes a validated learning checkpoint from the root route", () => {
    localStorage.setItem(
      "typekor:app-state",
      JSON.stringify({ ...completedOnboarding, lastExperience: "learn" }),
    );
    localStorage.setItem(
      "typekor:learning",
      JSON.stringify({
        schemaVersion: 1,
        progress: {},
        checkpoint: { lessonId: "home-anchors", stepIndex: 3, errors: 1 },
      }),
    );

    renderApp();
    expect(screen.getByLabelText("Type ហ")).toBeVisible();
    expect(JSON.parse(localStorage.getItem("typekor:learning")!)).toMatchObject({
      schemaVersion: 2,
      checkpoint: {
        lessonId: "home-anchors",
        lessonRevision: 1,
        stepId: "ha",
        errors: 1,
      },
    });
  });

  it("checkpoints each completed lesson target independently from test history", () => {
    renderApp("/learn/home-anchors");
    const input = screen.getByLabelText("Type ក");
    fireEvent.input(input, { target: { value: "ក" }, inputType: "insertText", data: "ក" });

    expect(screen.getByLabelText("Type ល")).toBeVisible();
    expect(JSON.parse(localStorage.getItem("typekor:learning")!)).toMatchObject({
      schemaVersion: 2,
      checkpoint: {
        lessonId: "home-anchors",
        lessonRevision: 1,
        stepId: "lo",
        errors: 0,
      },
    });
  });

  it("starts a 20-item exercise after the authored lesson steps", () => {
    renderApp("/learn/home-anchors");
    for (const prompt of ["ក", "ល", "ស", "ហ", "កល", "សក", "ហល", "សាលា"]) {
      typeLessonPrompt(prompt);
    }

    expect(screen.getByText("លំហាត់ចុងមេរៀន · 1 / 20")).toBeVisible();
    const input = screen.getByLabelText(/^Type /);
    typeLessonPrompt(input.getAttribute("aria-label")!.slice(5));
    expect(screen.getByText("លំហាត់ចុងមេរៀន · 2 / 20")).toBeVisible();
  });

  it("discards a checkpoint when its stable step no longer exists", () => {
    localStorage.setItem(
      "typekor:learning",
      JSON.stringify({
        schemaVersion: 2,
        progress: {},
        checkpoint: {
          lessonId: "home-anchors",
          lessonRevision: 1,
          stepId: "removed-step",
          errors: 2,
        },
      }),
    );

    renderApp("/learn");
    expect(screen.getByRole("heading", { name: "រៀនវាយអក្សរខ្មែរ" })).toBeVisible();
    expect(screen.getByText("Recommended next")).toBeVisible();
  });

  it("keeps Learn and Test in primary navigation instead of the work surface", () => {
    renderApp("/test");
    expect(screen.queryByRole("group", { name: "Practice mode" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Learn"));
    expect(screen.getByRole("heading", { name: "រៀនវាយអក្សរខ្មែរ" })).toBeVisible();
    expect(JSON.parse(localStorage.getItem("typekor:app-state")!)).toMatchObject({
      lastExperience: "learn",
    });

    fireEvent.click(screen.getByTitle("Typing test"));
    expect(screen.getByLabelText("Khmer typing test")).toBeVisible();
  });

  it("records mastery after a lesson is completed at full accuracy", () => {
    renderApp("/learn/home-anchors");
    completeHomeAnchorsLesson();

    expect(screen.getByLabelText("Lesson complete")).toBeVisible();
    expect(JSON.parse(localStorage.getItem("typekor:learning")!)).toMatchObject({
      checkpoint: null,
      progress: {
        "home-anchors": { attempts: 1, bestAccuracy: 100 },
      },
    });
  });

  it("focuses each lesson typing area until the learner clicks elsewhere", () => {
    renderApp("/learn/home-anchors");
    const input = screen.getByLabelText("Type ក");
    expect(input).toHaveFocus();

    fireEvent.pointerDown(screen.getByRole("heading", { name: "ក · ល · ស · ហ" }));
    expect(input).not.toHaveFocus();

    fireEvent.click(screen.getByText("Type this"));
    expect(input).toHaveFocus();
  });

  it("makes lesson mistakes prominent and announces how to recover", () => {
    renderApp("/learn/home-anchors");
    const input = screen.getByLabelText("Type ក");

    fireEvent.input(input, { target: { value: "x" }, inputType: "insertText", data: "x" });

    expect(screen.getByRole("alert")).toHaveTextContent("មានកំហុស");
    expect(screen.getByRole("alert")).toHaveTextContent("លុបតួអក្សរខុស រួចសាកម្ដងទៀត។");
    expect(input.closest("[data-status]")).toHaveAttribute("data-status", "incorrect");

    fireEvent.input(input, { target: { value: "" }, inputType: "deleteContentBackward" });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("lets learners show and hide the NIDA keyboard", () => {
    renderApp("/learn/home-anchors");
    const toggle = screen.getByRole("button", { name: "Hide keyboard" });

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("nida-keyboard")).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.queryByTestId("nida-keyboard")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show keyboard" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    fireEvent.click(screen.getByRole("button", { name: "Show keyboard" }));
    expect(screen.getByTestId("nida-keyboard")).toHaveAttribute("data-mode", "follow");
  });

  it("grades exact modifier layers in key-drill lessons", () => {
    renderApp("/learn/spacing-keys");

    expect(screen.getByText("ព្រំដែនពាក្យ ZWSP")).toBeVisible();
    fireEvent.keyDown(window, { key: " ", code: "Space" });
    expect(screen.getByText("ចន្លោះធម្មតា")).toBeVisible();

    fireEvent.keyDown(window, { key: " ", code: "Space", shiftKey: true });
    expect(screen.getByText("ព្រំដែនពាក្យ ZWSP")).toBeVisible();
  });

  it("continues with Enter and repeats with R after completing a lesson", () => {
    renderApp("/learn/home-anchors");
    completeHomeAnchorsLesson();

    const continueButton = screen.getByRole("button", { name: /មេរៀនបន្ទាប់/ });
    expect(continueButton).toHaveFocus();

    fireEvent.keyDown(window, { key: "r", code: "KeyR" });
    expect(screen.getByLabelText("Type ក")).toHaveFocus();

    completeHomeAnchorsLesson();

    screen.getByRole("button", { name: /មេរៀនបន្ទាប់/ }).blur();
    fireEvent.keyDown(window, { key: "Enter", code: "Enter" });
    expect(screen.getByLabelText("Type ម")).toHaveFocus();
  });

  it("falls back to onboarding when app state is malformed", () => {
    localStorage.setItem("typekor:app-state", "not-json");
    renderApp();
    expect(screen.getByRole("heading", { name: "Type ក" })).toBeVisible();
  });
});
