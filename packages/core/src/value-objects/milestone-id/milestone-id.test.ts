import { describe, expect, it } from "bun:test";
import { InvalidIdError } from "../../errors/errors.js";
import { MilestoneId } from "./milestone-id.js";

describe("MilestoneId", () => {
  it("creates from valid format", () => {
    const id = MilestoneId.from("MILE-0001");
    expect(id.toString()).toBe("MILE-0001");
  });

  it("throws on invalid format", () => {
    expect(() => MilestoneId.from("mile-0001")).toThrow(InvalidIdError);
    expect(() => MilestoneId.from("MILE-1")).toThrow(InvalidIdError);
    expect(() => MilestoneId.from("MILE-ABCD")).toThrow(InvalidIdError);
    expect(() => MilestoneId.from("")).toThrow(InvalidIdError);
  });

  it("generates from counter", () => {
    expect(MilestoneId.generate(1).toString()).toBe("MILE-0001");
    expect(MilestoneId.generate(42).toString()).toBe("MILE-0042");
    expect(MilestoneId.generate(9999).toString()).toBe("MILE-9999");
  });

  it("equals works", () => {
    const a = MilestoneId.from("MILE-0001");
    const b = MilestoneId.from("MILE-0001");
    const c = MilestoneId.from("MILE-0002");
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
