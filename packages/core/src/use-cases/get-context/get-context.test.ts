import { beforeEach, describe, expect, it } from "bun:test";
import { Issue, Milestone, Project, Spec } from "../../entities/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { IssueId, MilestoneId, ProjectId, SpecId } from "../../value-objects/index.js";
import { makeInMemoryRepo } from "../in-memory-repo.test-helper.js";
import { GetContextUseCase } from "./get-context.js";

describe("GetContextUseCase", () => {
  let repo: IRealmRepository;
  let useCase: GetContextUseCase;
  const projectId = ProjectId.generate(1);

  beforeEach(async () => {
    repo = makeInMemoryRepo();
    useCase = new GetContextUseCase(repo);
    await repo.saveProject({
      ...Project.create({ id: projectId, title: "P", author: "a" }),
      status: "active",
    });
    await repo.saveMilestone(
      Milestone.create({ id: MilestoneId.generate(1), projectId, title: "M", order: 0 })
    );
    await repo.saveIssue(
      Issue.create({ id: IssueId.generate(1), projectId, title: "I", author: "a" })
    );
    await repo.saveSpec(
      Spec.create({ id: SpecId.generate(1), projectId, title: "S", author: "a" })
    );
  });

  it("returns full realm context", async () => {
    const ctx = await useCase.execute();
    expect(ctx.projects).toHaveLength(1);
    expect(ctx.milestones).toHaveLength(1);
    expect(ctx.issues).toHaveLength(1);
    expect(ctx.specs).toHaveLength(1);
  });

  it("scopes to a single project", async () => {
    const otherId = ProjectId.generate(2);
    await repo.saveProject(Project.create({ id: otherId, title: "Other", author: "a" }));
    await repo.saveIssue(
      Issue.create({ id: IssueId.generate(2), projectId: otherId, title: "X", author: "a" })
    );
    const ctx = await useCase.execute({ projectId });
    expect(ctx.projects).toHaveLength(1);
    expect(ctx.issues).toHaveLength(1);
  });

  it("filters to active projects only", async () => {
    const plannedId = ProjectId.generate(2);
    await repo.saveProject(Project.create({ id: plannedId, title: "Planned", author: "a" }));
    const ctx = await useCase.execute({ activeOnly: true });
    expect(ctx.projects).toHaveLength(1);
    expect(ctx.projects[0]?.id.equals(projectId)).toBe(true);
  });
});
