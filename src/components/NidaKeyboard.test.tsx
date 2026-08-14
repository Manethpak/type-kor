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
});
