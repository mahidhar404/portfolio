import { describe, expect, it } from "vitest";

import {
  formatDuration,
  formatFullDate,
  formatMonthYear,
  formatRange,
  formatYear,
  initials,
  mediaUrl,
} from "@/lib/format";

const LABELS = { year: "yr", years: "yrs", month: "mo", months: "mos" };

describe("formatMonthYear", () => {
  it("formats an ISO date", () => {
    expect(formatMonthYear("2022-09-01", "en")).toBe("Sep 2022");
  });

  it("returns an empty string for null, undefined, and nonsense", () => {
    expect(formatMonthYear(null)).toBe("");
    expect(formatMonthYear(undefined)).toBe("");
    expect(formatMonthYear("not-a-date")).toBe("");
  });
});

describe("formatRange", () => {
  it("uses the present label when there is no end date", () => {
    expect(formatRange("2022-09-01", null, "Present", "en")).toBe("Sep 2022 — Present");
  });

  it("shows both ends when the role has finished", () => {
    expect(formatRange("2020-02-01", "2022-08-01", "Present", "en")).toBe("Feb 2020 — Aug 2022");
  });

  it("degrades to just the end when the start is missing", () => {
    expect(formatRange(null, "2022-08-01", "Present", "en")).toBe("Aug 2022");
  });
});

describe("formatDuration", () => {
  it("reports years and months together", () => {
    expect(formatDuration("2020-01-01", "2022-04-30", LABELS)).toBe("2 yrs 4 mos");
  });

  it("uses singular labels for one", () => {
    expect(formatDuration("2020-01-01", "2020-01-31", LABELS)).toBe("1 mo");
  });

  it("returns empty when the end precedes the start", () => {
    expect(formatDuration("2022-01-01", "2020-01-01", LABELS)).toBe("");
  });

  it("returns empty without a start date", () => {
    expect(formatDuration(null, "2022-01-01", LABELS)).toBe("");
  });
});

describe("formatFullDate", () => {
  it("writes the month out in full", () => {
    expect(formatFullDate("1993-04-18", "en")).toBe("April 18, 1993");
  });

  it("follows the locale's own date order", () => {
    expect(formatFullDate("1993-04-18", "de")).toBe("18. April 1993");
  });

  it("returns empty for missing dates", () => {
    expect(formatFullDate(null)).toBe("");
  });
});

describe("formatYear", () => {
  it("extracts the year", () => {
    expect(formatYear("2018-04-24")).toBe("2018");
  });
});

describe("initials", () => {
  it("takes the first letter of the first two words", () => {
    expect(initials("Alexandra Reinhardt")).toBe("AR");
  });

  it("copes with a single name", () => {
    expect(initials("Prince")).toBe("P");
  });

  it("ignores extra whitespace", () => {
    expect(initials("  Ada   Lovelace  ")).toBe("AL");
  });
});

describe("mediaUrl", () => {
  it("passes absolute URLs through untouched", () => {
    expect(mediaUrl("https://cdn.example/x.jpg")).toBe("https://cdn.example/x.jpg");
  });

  it("returns undefined for empty input", () => {
    expect(mediaUrl(null)).toBeUndefined();
    expect(mediaUrl("")).toBeUndefined();
  });

  it("prefixes relative paths", () => {
    expect(mediaUrl("/media/x.jpg")).toContain("/media/x.jpg");
  });
});
