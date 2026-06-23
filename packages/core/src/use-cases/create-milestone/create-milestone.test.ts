import { beforeEach, describe, expect, it } from "bun:test";
import { Project } from "../../entities/index.js";
import { ProjectNotFoundError } from "../../errors/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { ProjectId } from "../../value-objects/index.js";
import { makeInMemoryRepo } from "../in-memory-repo.test-helper.js";
import { CreateMilestoneUseCase } from "./create-milestone.js";

describe("CreateMilestoneUseCase", () => {
  let repo: IRealmRepository;
  let useCase: CreateMilestoneUseCase;
  const projectId = ProjectId.generate(1);

  beforeEach(() => {
    repo = makeInMemoryRepo();
    useCase = new CreateMilestoneUseCase(repo);
  });

  it("throws ProjectNotFoundError when project does not exist", async () => {
    await expect(
      useCase.execute({ projectId, title: "M1", order: 0, author: "alice" })
    ).rejects.toBeInstanceOf(ProjectNotFoundError);
  });

  it("creates a milestone under an existing project", async () => {
    await repo.saveProject(Project.create({ id: projectId, title: "P", author: "alice" }));
    const milestone = await useCase.execute({
      projectId,
      title: "Phase 1",
      order: 1,
      author: "alice",
    });
    expect(milestone.id.toString()).toBe("MILE-0001");
    expect(milestone.status).toBe("pending");
    expect(milestone.order).toBe(1);
  });

  it("appends a milestone_created trace", async () => {
    await repo.saveProject(Project.create({ id: projectId, title: "P", author: "alice" }));
    await useCase.execute({ projectId, title: "Phase 1", order: 0, author: "alice" });
    const traces = await repo.findTraces({});
    expect(traces).toHaveLength(1);
    expect(traces[0]?.event).toBe("milestone_created");
  });
});
