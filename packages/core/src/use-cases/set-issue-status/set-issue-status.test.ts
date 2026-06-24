import { beforeEach, describe, expect, it } from "bun:test";
import { Issue } from "../../entities/index.js";
import { GatesNotClearedError, InvalidTransitionError } from "../../errors/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { IssueId, ProjectId } from "../../value-objects/index.js";
import { makeInMemoryRepo } from "../in-memory-repo.test-helper.js";
import { SetIssueStatusUseCase } from "./set-issue-status.js";

describe("SetIssueStatusUseCase", () => {
  let repo: IRealmRepository;
  let useCase: SetIssueStatusUseCase;
  const projectId = ProjectId.generate(1);

  beforeEach(() => {
    repo = makeInMemoryRepo();
    useCase = new SetIssueStatusUseCase(repo);
  });

  const seed = async (over = {}): Promise<Issue> => {
    const issue = Issue.create({ id: IssueId.generate(1), projectId, title: "I", author: "a" });
    const final = { ...issue, ...over };
    await repo.saveIssue(final);
    return final;
  };

  it("blocks an in-progress issue and stamps a trace", async () => {
    await seed({ status: "in-progress" });
    const updated = await useCase.execute({ id: IssueId.generate(1), to: "blocked", actor: "a" });
    expect(updated.status).toBe("blocked");
    const traces = await repo.findTraces({});
    expect(traces.at(-1)?.event).toBe("issue_status_changed");
    expect(traces.at(-1)?.to).toBe("blocked");
  });

  it("rejects an invalid transition", async () => {
    await seed({ status: "not-started" });
    await expect(
      useCase.execute({ id: IssueId.generate(1), to: "completed", actor: "a" })
    ).rejects.toBeInstanceOf(InvalidTransitionError);
  });

  it("enforces gates when transitioning to completed", async () => {
    await repo.saveIssue(
      Issue.create({ id: IssueId.generate(2), projectId, title: "Gate", author: "a" })
    );
    await seed({ status: "in-progress", gates: [IssueId.generate(2)] });
    await expect(
      useCase.execute({ id: IssueId.generate(1), to: "completed", actor: "a" })
    ).rejects.toBeInstanceOf(GatesNotClearedError);
  });
});
