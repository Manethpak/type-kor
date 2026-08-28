import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { KeyboardKey } from "./KeyboardKey";

afterEach(cleanup);

describe("KeyboardKey", () => {
  it("uses the width supplied by its caller", () => {
    render(<KeyboardKey width={96}>Shift</KeyboardKey>);

    expect(screen.getByRole("button", { name: "Shift" })).toHaveStyle({
      width: "96px",
    });
  });
});
