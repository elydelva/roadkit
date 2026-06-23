import { beforeEach, describe, expect, it } from "bun:test";
import { Milestone, Project } from "../../entities/index.js";
import { MilestoneNotFoundError, ProjectNotFoundError } from "../../errors/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { MilestoneId, ProjectId } from "../../value-objects/index.js";
import { makeInMemoryRepo } from "../in-memory-repo.test-helper.js";
import { CreateIssueUseCase } from "./create-issue.js";

describe("CreateIssueUseCase", () => {
  let repo: IRealmRepository;
  let useCase: CreateIssueUseCase;
  const projectId = ProjectId.generate(1);

  beforeEach(() => {
    repo = makeInMemoryRepo();
    useCase = new CreateIssueUseCase(repo);
  });

  it("throws ProjectNotFoundError when project does not exist", async () => {
    await expect(
      useCase.execute({ projectId, title: "Issue", author: "alice" })
    ).rejects.toBeInstanceOf(ProjectNotFoundError);
  });

  it("throws MilestoneNotFoundError when milestone does not exist", async () => {
    await repo.saveProject(Project.create({ id: projectId, title: "P", author: "alice" }));
    await expect(
      useCase.execute({
        projectId,
        milestoneId: MilestoneId.generate(99),
        title: "Issue",
        author: "alice",
      })
    ).rejects.toBeInstanceOf(MilestoneNotFoundError);
  });

  it("creates and persists an issue", async () => {
    await repo.saveProject(Project.create({ id: projectId, title: "P", author: "alice" }));
    const issue = await useCase.execute({ projectId, title: "First issue", author: "alice" });
    expect(issue.id.toString()).toBe("ISSUE-0001");
    expect(issue.status).toBe("not-started");
    expect(issue.priority).toBe("none");
  });

  it("accepts a valid milestone reference", async () => {
    await repo.saveProject(Project.create({ id: projectId, title: "P", author: "alice" }));
    const milestoneId = MilestoneId.generate(1);
    await repo.saveMilestone(
      Milestone.create({ id: milestoneId, projectId, title: "M", order: 0 })
    );
    const issue = await useCase.execute({ projectId, milestoneId, title: "I", author: "alice" });
    expect(issue.milestoneId?.equals(milestoneId)).toBe(true);
  });

  it("appends an issue_created trace", async () => {
    await repo.saveProject(Project.create({ id: projectId, title: "P", author: "alice" }));
    await useCase.execute({ projectId, title: "I", author: "alice" });
    const traces = await repo.findTraces({});
    expect(traces).toHaveLength(1);
    expect(traces[0]?.event).toBe("issue_created");
  });
});
