import { describe, expect, it } from "vitest";

import {
  bestForeground,
  contrastRatio,
  ensureContrast,
  parseHex,
  relativeLuminance,
  toHex,
} from "@/lib/color";

const LIGHT_GROUND = "#f4f6f9";
const DARK_GROUND = "#0b0f15";

function ratio(a: string, b: string): number {
  const fg = parseHex(a);
  const bg = parseHex(b);
  if (!fg || !bg) throw new Error("bad hex in test");
  return contrastRatio(fg, bg);
}

describe("parseHex", () => {
  it("reads six-digit hex", () => {
    expect(parseHex("#1e4fd8")).toEqual({ r: 30, g: 79, b: 216 });
  });

  it("expands three-digit shorthand", () => {
    expect(parseHex("#fff")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("tolerates a missing hash and surrounding space", () => {
    expect(parseHex("  1e4fd8 ")).toEqual({ r: 30, g: 79, b: 216 });
  });

  it("rejects anything that is not a hex colour", () => {
    expect(parseHex("rebeccapurple")).toBeNull();
    expect(parseHex("#12345")).toBeNull();
    expect(parseHex("")).toBeNull();
  });
});

describe("contrastRatio", () => {
  it("gives 21 for black on white", () => {
    expect(ratio("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });

  it("gives 1 for a colour against itself", () => {
    expect(ratio("#1e4fd8", "#1e4fd8")).toBeCloseTo(1, 5);
  });

  it("is symmetric", () => {
    expect(ratio("#1e4fd8", "#ffffff")).toBeCloseTo(ratio("#ffffff", "#1e4fd8"), 5);
  });
});

describe("relativeLuminance", () => {
  it("is 0 for black and 1 for white", () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 5);
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5);
  });
});

describe("ensureContrast", () => {
  it("leaves a colour alone when it already passes", () => {
    expect(ensureContrast("#1e4fd8", LIGHT_GROUND, 4.5)).toBe("#1e4fd8");
  });

  it("lightens a dark brand until it is readable on a dark ground", () => {
    const adjusted = ensureContrast("#1e4fd8", DARK_GROUND, 6);
    expect(ratio(adjusted, DARK_GROUND)).toBeGreaterThanOrEqual(6);
  });

  it("darkens a pale brand until it is readable on a light ground", () => {
    const adjusted = ensureContrast("#b9d4ff", LIGHT_GROUND, 4.5);
    expect(ratio(adjusted, LIGHT_GROUND)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the result close to the original hue", () => {
    const adjusted = parseHex(ensureContrast("#1e4fd8", DARK_GROUND, 6));
    expect(adjusted).not.toBeNull();
    // Still recognisably blue: blue channel remains the dominant one.
    expect(adjusted!.b).toBeGreaterThan(adjusted!.r);
    expect(adjusted!.b).toBeGreaterThan(adjusted!.g);
  });

  it("handles every colour the admin colour picker can produce", () => {
    const samples = [
      "#000000",
      "#ffffff",
      "#ff0000",
      "#00ff00",
      "#0000ff",
      "#1e4fd8",
      "#0ea5a4",
      "#7c3aed",
      "#f59e0b",
      "#111827",
      "#fef3c7",
    ];
    for (const colour of samples) {
      for (const ground of [LIGHT_GROUND, DARK_GROUND]) {
        const adjusted = ensureContrast(colour, ground, 4.5);
        expect(
          ratio(adjusted, ground),
          `${colour} on ${ground} became ${adjusted}`,
        ).toBeGreaterThanOrEqual(4.49);
      }
    }
  });

  it("returns the input unchanged when it is not a colour", () => {
    expect(ensureContrast("not-a-colour", LIGHT_GROUND)).toBe("not-a-colour");
  });
});

describe("bestForeground", () => {
  it("picks white on a dark fill", () => {
    expect(bestForeground("#1e4fd8")).toBe("#ffffff");
  });

  it("picks the dark ink on a pale fill", () => {
    expect(bestForeground("#f59e0b")).toBe("#0b0f15");
  });
});

describe("toHex", () => {
  it("round-trips", () => {
    expect(toHex({ r: 30, g: 79, b: 216 })).toBe("#1e4fd8");
  });

  it("clamps out-of-range channels", () => {
    expect(toHex({ r: -20, g: 300, b: 128 })).toBe("#00ff80");
  });
});
