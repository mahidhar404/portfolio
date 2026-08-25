/**
 * The runtime half of the backend->frontend contract.
 *
 * `schema.d.ts` catches shape breaks at compile time; these prove the Zod guards
 * catch the ones that only show up at runtime, when a deployed backend starts
 * returning something the build never saw.
 */
import { describe, expect, it } from "vitest";

import { parsePortfolio, parseProjectDetail } from "@/api/schemas";
import { makePortfolio } from "@/test/fixtures";

describe("parsePortfolio", () => {
  it("accepts a well-formed payload", () => {
    expect(() => parsePortfolio(makePortfolio())).not.toThrow();
  });

  it("rejects a payload missing a whole section", () => {
    const broken = { ...makePortfolio() } as Record<string, unknown>;
    delete broken["experience"];
    expect(() => parsePortfolio(broken)).toThrow();
  });

  it("rejects a section that changed from a list to an object", () => {
    const broken = { ...makePortfolio(), projects: { count: 2 } };
    expect(() => parsePortfolio(broken)).toThrow();
  });

  it("rejects a field whose type changed", () => {
    const payload = makePortfolio();
    const broken = {
      ...payload,
      profile: { ...payload.profile, full_name: 42 },
    };
    expect(() => parsePortfolio(broken)).toThrow();
  });

  it("tolerates unknown extra fields, so adding one to the API is not breaking", () => {
    const payload = { ...makePortfolio(), brand_new_section: [{ id: 1 }] };
    expect(() => parsePortfolio(payload)).not.toThrow();
  });

  it("accepts null for the nullable image fields", () => {
    const payload = makePortfolio();
    const withNulls = { ...payload, profile: { ...payload.profile, photo: null } };
    expect(() => parsePortfolio(withNulls)).not.toThrow();
  });
});

describe("parseProjectDetail", () => {
  it("accepts a detail payload", () => {
    const project = makePortfolio().projects[0];
    expect(() =>
      parseProjectDetail({ ...project, description: "d", case_study: "c", images: [] }),
    ).not.toThrow();
  });

  it("rejects a detail payload with no images array", () => {
    const project = makePortfolio().projects[0];
    expect(() => parseProjectDetail({ ...project, case_study: "c" })).toThrow();
  });
});
