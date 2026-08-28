import { describe, expect, it } from "vitest";
import { getAltGrModifierLabel, isMacOS } from "./platform";

describe("platform labels", () => {
  it("uses Option on macOS", () => {
    const mac = { platform: "MacIntel", userAgent: "" };

    expect(isMacOS(mac)).toBe(true);
    expect(getAltGrModifierLabel(mac)).toBe("Option");
  });

  it("uses Right Alt on other operating systems", () => {
    const windows = { platform: "Win32", userAgent: "" };

    expect(isMacOS(windows)).toBe(false);
    expect(getAltGrModifierLabel(windows)).toBe("Right Alt");
  });
});
