import { describe, expect, it } from "bun:test";
import {
  DEFAULT_CONFIG,
  type RealmConfig,
  expandScale,
  formatEstimate,
  priorityRank,
  resolveEstimate,
  validatePriority,
} from "./realm-config.js";

function cfg(overrides: Partial<RealmConfig> = {}): RealmConfig {
  return { ...DEFAULT_CONFIG, ...overrides };
}

describe("expandScale", () => {
  it("returns the linear table", () => {
    expect(expandScale({ scale: "linear", default: null }).map((p) => p.points)).toEqual([
      1, 2, 3, 4, 5,
    ]);
  });

  it("returns the fibonacci table", () => {
    expect(expandScale({ scale: "fibonacci", default: null }).map((p) => p.points)).toEqual([
      1, 2, 3, 5, 8, 13, 21,
    ]);
  });

  it("returns the t-shirt table with labels", () => {
    const points = expandScale({ scale: "tshirt", default: null });
    expect(points).toEqual([
      { label: "XS", points: 1 },
      { label: "S", points: 2 },
      { label: "M", points: 3 },
      { label: "L", points: 5 },
      { label: "XL", points: 8 },
    ]);
  });

  it("returns the exponential table", () => {
    expect(expandScale({ scale: "exponential", default: null }).map((p) => p.points)).toEqual([
      1, 2, 4, 8, 16,
    ]);
  });

  it("returns an empty table for none and hours", () => {
    expect(expandScale({ scale: "none", default: null })).toEqual([]);
    expect(expandScale({ scale: "hours", default: null })).toEqual([]);
  });

  it("honours an explicit values override", () => {
    const values = [{ label: "tiny", points: 1 }];
    expect(expandScale({ scale: "fibonacci", default: null, values })).toEqual(values);
  });
});

describe("resolveEstimate", () => {
  it("resolves a label (case-insensitive) to points", () => {
    const c = cfg({ estimation: { scale: "tshirt", default: null } });
    expect(resolveEstimate(c, "M")).toBe(3);
    expect(resolveEstimate(c, "m")).toBe(3);
    expect(resolveEstimate(c, " L ")).toBe(5);
  });

  it("resolves a numeric points value present in the scale", () => {
    const c = cfg({ estimation: { scale: "fibonacci", default: null } });
    expect(resolveEstimate(c, "8")).toBe(8);
  });

  it("accepts any non-negative real for the hours scale", () => {
    const c = cfg({ estimation: { scale: "hours", default: null } });
    expect(resolveEstimate(c, "2.5")).toBe(2.5);
    expect(resolveEstimate(c, "0")).toBe(0);
  });

  it("rejects negative or non-numeric hours", () => {
    const c = cfg({ estimation: { scale: "hours", default: null } });
    expect(() => resolveEstimate(c, "-1")).toThrow(/non-negative/);
    expect(() => resolveEstimate(c, "abc")).toThrow(/non-negative/);
  });

  it("throws when estimation is disabled (none)", () => {
    const c = cfg({ estimation: { scale: "none", default: null } });
    expect(() => resolveEstimate(c, "3")).toThrow(/disabled/);
  });

  it("throws on an unknown label, listing permitted labels", () => {
    const c = cfg({ estimation: { scale: "tshirt", default: null } });
    expect(() => resolveEstimate(c, "XXL")).toThrow(/XS, S, M, L, XL/);
  });

  it("throws on a number not present in the scale", () => {
    const c = cfg({ estimation: { scale: "fibonacci", default: null } });
    expect(() => resolveEstimate(c, "4")).toThrow(/Invalid estimate/);
  });

  it("uses a values override when scale is none", () => {
    const c = cfg({
      estimation: { scale: "none", default: null, values: [{ label: "Z", points: 9 }] },
    });
    expect(resolveEstimate(c, "Z")).toBe(9);
  });

  it("uses a values override when scale is hours", () => {
    const c = cfg({
      estimation: { scale: "hours", default: null, values: [{ label: "Q", points: 7 }] },
    });
    expect(resolveEstimate(c, "Q")).toBe(7);
  });
});

describe("formatEstimate", () => {
  it("formats points to a label", () => {
    const c = cfg({ estimation: { scale: "tshirt", default: null } });
    expect(formatEstimate(c, 3)).toBe("M");
    expect(formatEstimate(c, 5)).toBe("L");
  });

  it("returns an empty string for null", () => {
    expect(formatEstimate(DEFAULT_CONFIG, null)).toBe("");
  });

  it("falls back to the numeric string when no label matches", () => {
    const c = cfg({ estimation: { scale: "tshirt", default: null } });
    expect(formatEstimate(c, 99)).toBe("99");
  });
});

describe("priorityRank", () => {
  it("ranks by index in custom levels", () => {
    const c = cfg({ priority: { levels: ["P0", "P1", "P2", "P3"], default: "P2" } });
    const rank = priorityRank(c);
    expect(rank("P0")).toBe(0);
    expect(rank("P3")).toBe(3);
  });

  it("ranks unknown values last", () => {
    const c = cfg({ priority: { levels: ["P0", "P1"], default: "P1" } });
    expect(priorityRank(c)("none")).toBe(2);
  });
});

describe("validatePriority", () => {
  it("accepts a configured level and rejects others", () => {
    const c = cfg({ priority: { levels: ["P0", "P1"], default: "P1" } });
    expect(validatePriority(c, "P0")).toBe(true);
    expect(validatePriority(c, "P9")).toBe(false);
  });
});
