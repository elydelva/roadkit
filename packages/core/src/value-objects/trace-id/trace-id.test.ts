import { describe, expect, it } from "bun:test";
import { InvalidIdError } from "../../errors/errors.js";
import { TraceId } from "./trace-id.js";

describe("TraceId", () => {
  it("creates from valid format", () => {
    const id = TraceId.from("TRACE-20260623T1430-a1b2c3");
    expect(id.toString()).toBe("TRACE-20260623T1430-a1b2c3");
  });

  it("throws on invalid format", () => {
    expect(() => TraceId.from("trace-20260623T1430-a1b2c3")).toThrow(InvalidIdError);
    expect(() => TraceId.from("TRACE-0001")).toThrow(InvalidIdError);
    expect(() => TraceId.from("TRACE-20260623T1430-ABCDEF")).toThrow(InvalidIdError);
    expect(() => TraceId.from("TRACE-20260623T1430-a1b2")).toThrow(InvalidIdError);
    expect(() => TraceId.from("")).toThrow(InvalidIdError);
  });

  it("generates a well-formed id", () => {
    const id = TraceId.generate();
    expect(id.toString()).toMatch(/^TRACE-\d{8}T\d{4}-[0-9a-f]{6}$/);
  });

  it("generated ids round-trip through from", () => {
    const id = TraceId.generate();
    expect(() => TraceId.from(id.toString())).not.toThrow();
  });

  it("equals works", () => {
    const a = TraceId.from("TRACE-20260623T1430-a1b2c3");
    const b = TraceId.from("TRACE-20260623T1430-a1b2c3");
    const c = TraceId.from("TRACE-20260623T1430-d4e5f6");
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
