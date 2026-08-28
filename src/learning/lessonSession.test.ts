import { describe, expect, it } from "vitest";
import { createLessonSessionState, lessonSessionReducer } from "./lessonSession";

describe("lesson session reducer", () => {
  it("updates related error fields atomically", () => {
    const state = lessonSessionReducer(createLessonSessionState(2, 3), {
      type: "inputChanged",
      input: "x",
      status: "incorrect",
    });

    expect(state).toMatchObject({
      stepIndex: 2,
      errors: 4,
      stepErrors: 1,
      input: "x",
      status: "incorrect",
    });
  });

  it("resets step state without losing cumulative errors", () => {
    const incorrect = lessonSessionReducer(createLessonSessionState(), {
      type: "inputChanged",
      input: "x",
      status: "incorrect",
    });
    const next = lessonSessionReducer(incorrect, { type: "stepCompleted", stepIndex: 1 });

    expect(next).toMatchObject({
      stepIndex: 1,
      errors: 1,
      stepErrors: 0,
      input: "",
      status: "prefix",
    });
  });
});
