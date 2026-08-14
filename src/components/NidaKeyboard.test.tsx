import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { NidaKeyboard } from "./NidaKeyboard";

afterEach(cleanup);

describe("NidaKeyboard", () => {
  it("shows the complete base, Shift, and AltGr layers", () => {
    render(<NidaKeyboard active={undefined} />);

    expect(screen.getByTitle("K: ក")).toBeInTheDocument();
    expect(screen.getByTitle("1: ១")).toBeInTheDocument();
    expect(screen.getByTitle("=: ឲ")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Shift" }));
    expect(screen.getByTitle("K: គ")).toBeInTheDocument();
    expect(screen.getByTitle("1: !")).toBeInTheDocument();
    expect(screen.getByTitle("/: ?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "AltGr" }));
    expect(screen.getByTitle("O: ឱ")).toBeInTheDocument();
    expect(screen.getByTitle("2: @")).toBeInTheDocument();
    expect(screen.getByTitle("`: ZWJ")).toBeInTheDocument();
  });

  it("highlights physical keys and follows held Shift and Alt layers", () => {
    render(<NidaKeyboard active={undefined} />);

    fireEvent.keyDown(window, { code: "KeyK", key: "k" });
    expect(screen.getByTitle("K: ក")).toHaveAttribute("data-pressed", "true");
    fireEvent.keyUp(window, { code: "KeyK", key: "k" });
    expect(screen.getByTitle("K: ក")).toHaveAttribute("data-pressed", "false");

    fireEvent.keyDown(window, { code: "ShiftLeft", key: "Shift", shiftKey: true });
    expect(screen.getByTitle("K: គ")).toBeInTheDocument();
    fireEvent.keyUp(window, { code: "ShiftLeft", key: "Shift", shiftKey: false });
    expect(screen.getByTitle("K: ក")).toBeInTheDocument();

    fireEvent.keyDown(window, { code: "AltRight", key: "Alt", altKey: true });
    expect(screen.getByTitle("O: ឱ")).toBeInTheDocument();
    fireEvent.keyUp(window, { code: "AltRight", key: "Alt", altKey: false });
    expect(screen.getByTitle("O: ◌ោ")).toBeInTheDocument();
  });

  it("follows the lesson target, reports attempts, and becomes interactable on focus", () => {
    render(
      <NidaKeyboard
        active={{ code: "KeyK", key: "K", output: "គ", shift: true, altGr: false }}
        defaultMode="follow"
      />,
    );

    const keyboard = screen.getByTestId("nida-keyboard");
    expect(keyboard).toHaveAttribute("data-mode", "follow");
    expect(screen.getByTitle("K: គ")).toHaveAttribute("data-target", "true");

    fireEvent.keyDown(window, { code: "KeyL", key: "l" });
    expect(screen.getByTitle("L: ឡ")).toHaveAttribute("data-feedback", "incorrect");
    fireEvent.keyUp(window, { code: "KeyL", key: "l" });

    fireEvent.keyDown(window, { code: "ShiftLeft", key: "Shift", shiftKey: true });
    fireEvent.keyDown(window, { code: "KeyK", key: "K", shiftKey: true });
    expect(screen.getByTitle("K: គ")).toHaveAttribute("data-feedback", "correct");
    fireEvent.keyUp(window, { code: "KeyK", key: "K", shiftKey: true });
    fireEvent.keyUp(window, { code: "ShiftLeft", key: "Shift", shiftKey: false });

    fireEvent.focus(keyboard);
    expect(keyboard).toHaveAttribute("data-mode", "interactable");
  });
});
