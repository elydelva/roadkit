import { beforeEach, describe, expect, it } from "bun:test";
import { Issue } from "../../entities/index.js";
import { IssueNotFoundError } from "../../errors/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { IssueId, ProjectId } from "../../value-objects/index.js";
import { makeInMemoryRepo } from "../in-memory-repo.test-helper.js";
import { DeleteIssueUseCase } from "./delete-issue.js";

describe("DeleteIssueUseCase", () => {
  let repo: IRealmRepository;
  let useCase: DeleteIssueUseCase;
  const projectId = ProjectId.generate(1);

  beforeEach(() => {
    repo = makeInMemoryRepo();
    useCase = new DeleteIssueUseCase(repo);
  });

  it("throws when the issue is missing", async () => {
    await expect(useCase.execute({ id: IssueId.generate(1), actor: "a" })).rejects.toBeInstanceOf(
      IssueNotFoundError
    );
  });

  it("deletes the issue and records a trace", async () => {
    await repo.saveIssue(
      Issue.create({ id: IssueId.generate(1), projectId, title: "I", author: "a" })
    );
    const deleted = await useCase.execute({ id: IssueId.generate(1), actor: "a" });
    expect(deleted.id.toString()).toBe("ISSUE-0001");
    expect(await repo.findIssue(IssueId.generate(1))).toBeNull();
    const traces = await repo.findTraces({});
    expect(traces.at(-1)?.event).toBe("issue_deleted");
  });
});
