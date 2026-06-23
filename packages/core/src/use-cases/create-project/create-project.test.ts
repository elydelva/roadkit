import { beforeEach, describe, expect, it } from "bun:test";
import type { IRealmRepository } from "../../ports/index.js";
import { makeInMemoryRepo } from "../in-memory-repo.test-helper.js";
import { CreateProjectUseCase } from "./create-project.js";

describe("CreateProjectUseCase", () => {
  let repo: IRealmRepository;
  let useCase: CreateProjectUseCase;

  beforeEach(() => {
    repo = makeInMemoryRepo();
    useCase = new CreateProjectUseCase(repo);
  });

  it("creates and persists a project", async () => {
    const project = await useCase.execute({ title: "My Project", author: "alice" });
    expect(project.id.toString()).toBe("PROJ-0001");
    expect(project.status).toBe("planned");
    expect(await repo.findProject(project.id)).not.toBeNull();
  });

  it("appends a project_created trace", async () => {
    const project = await useCase.execute({ title: "Traced", author: "alice" });
    const traces = await repo.findTraces({});
    expect(traces).toHaveLength(1);
    expect(traces[0]?.event).toBe("project_created");
    expect(traces[0]?.projectId.equals(project.id)).toBe(true);
  });
});
