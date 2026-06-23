import { describe, expect, it } from "bun:test";
import { InvalidIdError } from "../../errors/errors.js";
import { IssueId } from "./issue-id.js";

describe("IssueId", () => {
  it("creates from valid format", () => {
    const id = IssueId.from("ISSUE-0001");
    expect(id.toString()).toBe("ISSUE-0001");
  });

  it("throws on invalid format", () => {
    expect(() => IssueId.from("issue-0001")).toThrow(InvalidIdError);
    expect(() => IssueId.from("ISSUE-1")).toThrow(InvalidIdError);
    expect(() => IssueId.from("ISSUE-ABCD")).toThrow(InvalidIdError);
    expect(() => IssueId.from("")).toThrow(InvalidIdError);
  });

  it("generates from counter", () => {
    expect(IssueId.generate(1).toString()).toBe("ISSUE-0001");
    expect(IssueId.generate(42).toString()).toBe("ISSUE-0042");
    expect(IssueId.generate(9999).toString()).toBe("ISSUE-9999");
  });

  it("equals works", () => {
    const a = IssueId.from("ISSUE-0001");
    const b = IssueId.from("ISSUE-0001");
    const c = IssueId.from("ISSUE-0002");
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
