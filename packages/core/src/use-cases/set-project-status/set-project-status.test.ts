import { beforeEach, describe, expect, it } from "bun:test";
import { Project } from "../../entities/index.js";
import { InvalidTransitionError, ProjectNotFoundError } from "../../errors/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { ProjectId } from "../../value-objects/index.js";
import { makeInMemoryRepo } from "../in-memory-repo.test-helper.js";
import { SetProjectStatusUseCase } from "./set-project-status.js";

describe("SetProjectStatusUseCase", () => {
  let repo: IRealmRepository;
  let useCase: SetProjectStatusUseCase;

  beforeEach(() => {
    repo = makeInMemoryRepo();
    useCase = new SetProjectStatusUseCase(repo);
  });

  it("throws ProjectNotFoundError when project is missing", async () => {
    await expect(
      useCase.execute({ id: ProjectId.generate(1), to: "active", actor: "alice" })
    ).rejects.toBeInstanceOf(ProjectNotFoundError);
  });

  it("transitions a planned project to active", async () => {
    const project = Project.create({ id: ProjectId.generate(1), title: "P", author: "a" });
    await repo.saveProject(project);
    const updated = await useCase.execute({ id: project.id, to: "active", actor: "alice" });
    expect(updated.status).toBe("active");
    expect(await repo.findProject(project.id).then((p) => p?.status)).toBe("active");
  });

  it("rejects invalid transitions", async () => {
    const project = Project.create({ id: ProjectId.generate(1), title: "P", author: "a" });
    await repo.saveProject(project);
    await expect(
      useCase.execute({ id: project.id, to: "completed", actor: "alice" })
    ).rejects.toBeInstanceOf(InvalidTransitionError);
  });

  it("appends a project_status_changed trace", async () => {
    const project = Project.create({ id: ProjectId.generate(1), title: "P", author: "a" });
    await repo.saveProject(project);
    await useCase.execute({ id: project.id, to: "active", actor: "alice" });
    const traces = await repo.findTraces({});
    expect(traces).toHaveLength(1);
    expect(traces[0]?.event).toBe("project_status_changed");
    expect(traces[0]?.from).toBe("planned");
    expect(traces[0]?.to).toBe("active");
  });
});
