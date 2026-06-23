import { describe, expect, it } from "bun:test";
import { InvalidIdError } from "../../errors/errors.js";
import { ProjectId } from "./project-id.js";

describe("ProjectId", () => {
  it("creates from valid format", () => {
    const id = ProjectId.from("PROJ-0001");
    expect(id.toString()).toBe("PROJ-0001");
  });

  it("throws on invalid format", () => {
    expect(() => ProjectId.from("proj-0001")).toThrow(InvalidIdError);
    expect(() => ProjectId.from("PROJ-1")).toThrow(InvalidIdError);
    expect(() => ProjectId.from("PROJ-ABCD")).toThrow(InvalidIdError);
    expect(() => ProjectId.from("")).toThrow(InvalidIdError);
  });

  it("generates from counter", () => {
    expect(ProjectId.generate(1).toString()).toBe("PROJ-0001");
    expect(ProjectId.generate(42).toString()).toBe("PROJ-0042");
    expect(ProjectId.generate(9999).toString()).toBe("PROJ-9999");
  });

  it("equals works", () => {
    const a = ProjectId.from("PROJ-0001");
    const b = ProjectId.from("PROJ-0001");
    const c = ProjectId.from("PROJ-0002");
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
