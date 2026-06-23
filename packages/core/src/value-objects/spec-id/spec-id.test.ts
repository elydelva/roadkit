import { describe, expect, it } from "bun:test";
import { InvalidIdError } from "../../errors/errors.js";
import { SpecId } from "./spec-id.js";

describe("SpecId", () => {
  it("creates from valid format", () => {
    const id = SpecId.from("SPEC-0001");
    expect(id.toString()).toBe("SPEC-0001");
  });

  it("throws on invalid format", () => {
    expect(() => SpecId.from("spec-0001")).toThrow(InvalidIdError);
    expect(() => SpecId.from("SPEC-1")).toThrow(InvalidIdError);
    expect(() => SpecId.from("SPEC-ABCD")).toThrow(InvalidIdError);
    expect(() => SpecId.from("")).toThrow(InvalidIdError);
  });

  it("generates from counter", () => {
    expect(SpecId.generate(1).toString()).toBe("SPEC-0001");
    expect(SpecId.generate(42).toString()).toBe("SPEC-0042");
    expect(SpecId.generate(9999).toString()).toBe("SPEC-9999");
  });

  it("equals works", () => {
    const a = SpecId.from("SPEC-0001");
    const b = SpecId.from("SPEC-0001");
    const c = SpecId.from("SPEC-0002");
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
