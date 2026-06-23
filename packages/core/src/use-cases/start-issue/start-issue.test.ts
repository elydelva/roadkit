import { beforeEach, describe, expect, it } from "bun:test";
import { Issue } from "../../entities/index.js";
import { InvalidTransitionError, IssueNotFoundError } from "../../errors/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { IssueId, ProjectId } from "../../value-objects/index.js";
import { makeInMemoryRepo } from "../in-memory-repo.test-helper.js";
import { StartIssueUseCase } from "./start-issue.js";

describe("StartIssueUseCase", () => {
  let repo: IRealmRepository;
  let useCase: StartIssueUseCase;
  const projectId = ProjectId.generate(1);

  beforeEach(() => {
    repo = makeInMemoryRepo();
    useCase = new StartIssueUseCase(repo);
  });

  it("throws IssueNotFoundError when issue is missing", async () => {
    await expect(
      useCase.execute({ id: IssueId.generate(1), actor: "alice" })
    ).rejects.toBeInstanceOf(IssueNotFoundError);
  });

  it("transitions a not-started issue to in-progress", async () => {
    const issue = Issue.create({ id: IssueId.generate(1), projectId, title: "I", author: "a" });
    await repo.saveIssue(issue);
    const updated = await useCase.execute({ id: issue.id, actor: "alice" });
    expect(updated.status).toBe("in-progress");
    expect(updated.startedAt).not.toBeNull();
  });

  it("rejects invalid transitions", async () => {
    const issue = Issue.create({ id: IssueId.generate(1), projectId, title: "I", author: "a" });
    await repo.saveIssue({ ...issue, status: "completed" });
    await expect(useCase.execute({ id: issue.id, actor: "alice" })).rejects.toBeInstanceOf(
      InvalidTransitionError
    );
  });

  it("appends an issue_started trace", async () => {
    const issue = Issue.create({ id: IssueId.generate(1), projectId, title: "I", author: "a" });
    await repo.saveIssue(issue);
    await useCase.execute({ id: issue.id, actor: "alice" });
    const traces = await repo.findTraces({});
    expect(traces).toHaveLength(1);
    expect(traces[0]?.event).toBe("issue_started");
    expect(traces[0]?.to).toBe("in-progress");
  });
});
