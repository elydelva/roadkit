import { beforeEach, describe, expect, it } from "bun:test";
import { Issue } from "../../entities/index.js";
import { IssueNotFoundError } from "../../errors/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { IssueId, MilestoneId, ProjectId } from "../../value-objects/index.js";
import { makeInMemoryRepo } from "../in-memory-repo.test-helper.js";
import { EditIssueUseCase } from "./edit-issue.js";

describe("EditIssueUseCase", () => {
  let repo: IRealmRepository;
  let useCase: EditIssueUseCase;
  const projectId = ProjectId.generate(1);

  beforeEach(async () => {
    repo = makeInMemoryRepo();
    useCase = new EditIssueUseCase(repo);
    await repo.saveIssue(
      Issue.create({
        id: IssueId.generate(1),
        projectId,
        title: "Old",
        author: "a",
        assignee: "bob",
        milestoneId: MilestoneId.generate(1),
      })
    );
  });

  it("throws when the issue is missing", async () => {
    await expect(
      useCase.execute({ id: IssueId.generate(99), actor: "alice", title: "X" })
    ).rejects.toBeInstanceOf(IssueNotFoundError);
  });

  it("patches only the provided fields", async () => {
    const updated = await useCase.execute({
      id: IssueId.generate(1),
      actor: "alice",
      title: "New",
      priority: "high",
    });
    expect(updated.title).toBe("New");
    expect(updated.priority).toBe("high");
    expect(updated.assignee).toBe("bob"); // untouched
  });

  it("clears nullable fields when set to null", async () => {
    const updated = await useCase.execute({
      id: IssueId.generate(1),
      actor: "alice",
      assignee: null,
      milestoneId: null,
    });
    expect(updated.assignee).toBeNull();
    expect(updated.milestoneId).toBeNull();
  });

  it("appends an issue_edited trace", async () => {
    await useCase.execute({ id: IssueId.generate(1), actor: "alice", title: "New" });
    const traces = await repo.findTraces({});
    expect(traces.at(-1)?.event).toBe("issue_edited");
  });
});
