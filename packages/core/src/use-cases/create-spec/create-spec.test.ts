import { beforeEach, describe, expect, it } from "bun:test";
import { Project } from "../../entities/index.js";
import { ProjectNotFoundError } from "../../errors/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { ProjectId } from "../../value-objects/index.js";
import { makeInMemoryRepo } from "../in-memory-repo.test-helper.js";
import { CreateSpecUseCase } from "./create-spec.js";

describe("CreateSpecUseCase", () => {
  let repo: IRealmRepository;
  let useCase: CreateSpecUseCase;
  const projectId = ProjectId.generate(1);

  beforeEach(() => {
    repo = makeInMemoryRepo();
    useCase = new CreateSpecUseCase(repo);
  });

  it("throws ProjectNotFoundError when project does not exist", async () => {
    await expect(
      useCase.execute({ projectId, title: "Spec", author: "alice" })
    ).rejects.toBeInstanceOf(ProjectNotFoundError);
  });

  it("creates and persists a spec", async () => {
    await repo.saveProject(Project.create({ id: projectId, title: "P", author: "alice" }));
    const spec = await useCase.execute({ projectId, title: "A decision", author: "alice" });
    expect(spec.id.toString()).toBe("SPEC-0001");
    expect(spec.status).toBe("draft");
  });

  it("appends a spec_created trace", async () => {
    await repo.saveProject(Project.create({ id: projectId, title: "P", author: "alice" }));
    const spec = await useCase.execute({ projectId, title: "S", author: "alice" });
    const traces = await repo.findTraces({});
    expect(traces).toHaveLength(1);
    expect(traces[0]?.event).toBe("spec_created");
    expect(traces[0]?.specId?.equals(spec.id)).toBe(true);
  });
});
