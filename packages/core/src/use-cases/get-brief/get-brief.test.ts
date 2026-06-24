import { beforeEach, describe, expect, it } from "bun:test";
import { Issue, Milestone, Project, Spec } from "../../entities/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { IssueId, MilestoneId, ProjectId, SpecId } from "../../value-objects/index.js";
import { makeInMemoryRepo } from "../in-memory-repo.test-helper.js";
import { GetBriefUseCase } from "./get-brief.js";

describe("GetBriefUseCase", () => {
  let repo: IRealmRepository;
  let useCase: GetBriefUseCase;
  const projectId = ProjectId.generate(1);

  beforeEach(async () => {
    repo = makeInMemoryRepo();
    useCase = new GetBriefUseCase(repo);
    await repo.saveProject({
      ...Project.create({ id: projectId, title: "P", author: "a" }),
      status: "active",
    });
  });

  it("returns an empty brief for an empty realm", async () => {
    const brief = await useCase.execute();
    expect(brief.issue).toBeNull();
    expect(brief.next).toBeNull();
    expect(brief.rules).toEqual([]);
  });

  it("focuses the requested issue and aggregates rules by trigger", async () => {
    await repo.saveIssue({
      ...Issue.create({ id: IssueId.generate(1), projectId, title: "I", author: "a" }),
      rules: [
        { trigger: "before_edit", instruction: "use db helper" },
        { trigger: "before_complete", instruction: "run tests" },
      ],
    });
    await repo.saveSpec({
      ...Spec.create({ id: SpecId.generate(1), projectId, title: "S", author: "a" }),
      rules: [{ trigger: "before_edit", instruction: "camelCase in TS" }],
    });

    const brief = await useCase.execute({ issueId: IssueId.from("ISSUE-0001") });
    expect(brief.issue?.id.toString()).toBe("ISSUE-0001");
    const beforeEdit = brief.rules.find((r) => r.trigger === "before_edit");
    expect(beforeEdit?.instructions).toEqual(["use db helper", "camelCase in TS"]);
    expect(brief.rules.find((r) => r.trigger === "before_complete")?.instructions).toEqual([
      "run tests",
    ]);
  });

  it("reports the blocked reason and unmet gates", async () => {
    await repo.saveIssue(
      Issue.create({ id: IssueId.generate(1), projectId, title: "dep", author: "a" })
    );
    await repo.saveIssue({
      ...Issue.create({ id: IssueId.generate(2), projectId, title: "blocked", author: "a" }),
      gates: [IssueId.from("ISSUE-0001")],
    });

    const brief = await useCase.execute({ issueId: IssueId.from("ISSUE-0002") });
    expect(brief.blockedReason).toContain("ISSUE-0001");
    expect(brief.gatesOn).toEqual([{ gate: "ISSUE-0001", status: "not-started" }]);
  });

  it("lists issues unblocked by the focus issue", async () => {
    await repo.saveIssue(
      Issue.create({ id: IssueId.generate(1), projectId, title: "blocker", author: "a" })
    );
    await repo.saveIssue({
      ...Issue.create({ id: IssueId.generate(2), projectId, title: "dependent", author: "a" }),
      gates: [IssueId.from("ISSUE-0001")],
    });

    const brief = await useCase.execute({ issueId: IssueId.from("ISSUE-0001") });
    expect(brief.unblocks.map((i) => i.id.toString())).toEqual(["ISSUE-0002"]);
    expect(brief.blockedReason).toBeNull();
  });

  it("defaults the focus to the next eligible issue", async () => {
    await repo.saveIssue({
      ...Issue.create({ id: IssueId.generate(1), projectId, title: "eligible", author: "a" }),
      priority: "high",
    });
    const brief = await useCase.execute();
    expect(brief.issue?.id.toString()).toBe("ISSUE-0001");
    expect(brief.next?.issue.id.toString()).toBe("ISSUE-0001");
  });

  it("inherits rules from the parent chain and resolves the milestone", async () => {
    const milestoneId = MilestoneId.generate(1);
    await repo.saveMilestone(
      Milestone.create({ id: milestoneId, projectId, title: "M", order: 1 })
    );
    await repo.saveIssue({
      ...Issue.create({ id: IssueId.generate(1), projectId, title: "parent", author: "a" }),
      rules: [{ trigger: "before_edit", instruction: "parent rule" }],
    });
    await repo.saveIssue({
      ...Issue.create({ id: IssueId.generate(2), projectId, title: "child", author: "a" }),
      parentId: IssueId.from("ISSUE-0001"),
      milestoneId,
      rules: [{ trigger: "before_edit", instruction: "child rule" }],
    });

    const brief = await useCase.execute({ issueId: IssueId.from("ISSUE-0002") });
    expect(brief.milestone?.id.toString()).toBe("MILE-0001");
    expect(brief.rules.find((r) => r.trigger === "before_edit")?.instructions).toEqual([
      "child rule",
      "parent rule",
    ]);
  });

  it("returns no focus issue when the requested id is missing", async () => {
    const brief = await useCase.execute({ issueId: IssueId.from("ISSUE-9999") });
    expect(brief.issue).toBeNull();
    expect(brief.rules).toEqual([]);
  });

  it("marks external string gates without blocking", async () => {
    await repo.saveIssue({
      ...Issue.create({ id: IssueId.generate(1), projectId, title: "x", author: "a" }),
      gates: ["PROJ-0009/ISSUE-0001"],
    });
    const brief = await useCase.execute({ issueId: IssueId.from("ISSUE-0001") });
    expect(brief.gatesOn).toEqual([{ gate: "PROJ-0009/ISSUE-0001", status: "external" }]);
    expect(brief.blockedReason).toBeNull();
  });
});
