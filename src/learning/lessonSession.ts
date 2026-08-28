export interface LessonSessionState {
  stepIndex: number;
  errors: number;
  stepErrors: number;
  input: string;
  status: "prefix" | "incorrect";
  completedAccuracy: number | null;
}

export type LessonSessionAction =
  | { type: "inputChanged"; input: string; status: "prefix" | "incorrect" }
  | { type: "stepCompleted"; stepIndex: number }
  | { type: "lessonCompleted"; accuracy: number }
  | { type: "restart" };

export function createLessonSessionState(stepIndex = 0, errors = 0): LessonSessionState {
  return {
    stepIndex,
    errors,
    stepErrors: 0,
    input: "",
    status: "prefix",
    completedAccuracy: null,
  };
}

export function lessonSessionReducer(
  state: LessonSessionState,
  action: LessonSessionAction,
): LessonSessionState {
  switch (action.type) {
    case "inputChanged":
      return {
        ...state,
        input: action.input,
        status: action.status,
        errors: state.errors + (action.status === "incorrect" ? 1 : 0),
        stepErrors: state.stepErrors + (action.status === "incorrect" ? 1 : 0),
      };
    case "stepCompleted":
      return {
        ...state,
        stepIndex: action.stepIndex,
        stepErrors: 0,
        input: "",
        status: "prefix",
      };
    case "lessonCompleted":
      return { ...state, input: "", completedAccuracy: action.accuracy };
    case "restart":
      return createLessonSessionState();
  }
}
