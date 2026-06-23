import { beforeEach, describe, expect, it } from "bun:test";
import { Issue } from "../../entities/index.js";
import { GatesNotClearedError, IssueNotFoundError } from "../../errors/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { IssueId, ProjectId } from "../../value-objects/index.js";
import { makeInMemoryRepo } from "../in-memory-repo.test-helper.js";
import { CompleteIssueUseCase } from "./complete-issue.js";

describe("CompleteIssueUseCase", () => {
  let repo: IRealmRepository;
  let useCase: CompleteIssueUseCase;
  const projectId = ProjectId.generate(1);

  beforeEach(() => {
    repo = makeInMemoryRepo();
    useCase = new CompleteIssueUseCase(repo);
  });

  it("throws IssueNotFoundError when issue is missing", async () => {
    await expect(
      useCase.execute({ id: IssueId.generate(1), actor: "alice" })
    ).rejects.toBeInstanceOf(IssueNotFoundError);
  });

  it("completes an in-progress issue", async () => {
    const issue = Issue.create({ id: IssueId.generate(1), projectId, title: "I", author: "a" });
    await repo.saveIssue({ ...issue, status: "in-progress" });
    const updated = await useCase.execute({ id: issue.id, actor: "alice" });
    expect(updated.status).toBe("completed");
    expect(updated.completedAt).not.toBeNull();
  });

  it("throws GatesNotClearedError when a gate is not completed", async () => {
    const dep = Issue.create({ id: IssueId.generate(1), projectId, title: "Dep", author: "a" });
    await repo.saveIssue({ ...dep, status: "in-progress" });
    const issue = Issue.create({
      id: IssueId.generate(2),
      projectId,
      title: "I",
      author: "a",
      gates: [dep.id],
    });
    await repo.saveIssue({ ...issue, status: "in-progress" });
    await expect(useCase.execute({ id: issue.id, actor: "alice" })).rejects.toBeInstanceOf(
      GatesNotClearedError
    );
  });

  it("appends an issue_completed trace", async () => {
    const issue = Issue.create({ id: IssueId.generate(1), projectId, title: "I", author: "a" });
    await repo.saveIssue({ ...issue, status: "in-progress" });
    await useCase.execute({ id: issue.id, actor: "alice" });
    const traces = await repo.findTraces({});
    expect(traces).toHaveLength(1);
    expect(traces[0]?.event).toBe("issue_completed");
    expect(traces[0]?.to).toBe("completed");
  });
});
