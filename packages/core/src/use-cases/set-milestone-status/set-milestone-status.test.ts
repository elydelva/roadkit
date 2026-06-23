import { beforeEach, describe, expect, it } from "bun:test";
import { Milestone } from "../../entities/index.js";
import { InvalidTransitionError, MilestoneNotFoundError } from "../../errors/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { MilestoneId, ProjectId } from "../../value-objects/index.js";
import { makeInMemoryRepo } from "../in-memory-repo.test-helper.js";
import { SetMilestoneStatusUseCase } from "./set-milestone-status.js";

describe("SetMilestoneStatusUseCase", () => {
  let repo: IRealmRepository;
  let useCase: SetMilestoneStatusUseCase;
  const projectId = ProjectId.generate(1);

  function makeMilestone(): Milestone {
    return Milestone.create({ id: MilestoneId.generate(1), projectId, title: "M", order: 1 });
  }

  beforeEach(() => {
    repo = makeInMemoryRepo();
    useCase = new SetMilestoneStatusUseCase(repo);
  });

  it("throws MilestoneNotFoundError when milestone is missing", async () => {
    await expect(
      useCase.execute({ id: MilestoneId.generate(1), to: "active", actor: "alice" })
    ).rejects.toBeInstanceOf(MilestoneNotFoundError);
  });

  it("transitions a pending milestone to active", async () => {
    const milestone = makeMilestone();
    await repo.saveMilestone(milestone);
    const updated = await useCase.execute({ id: milestone.id, to: "active", actor: "alice" });
    expect(updated.status).toBe("active");
  });

  it("rejects invalid transitions", async () => {
    const milestone = makeMilestone();
    await repo.saveMilestone(milestone);
    await expect(
      useCase.execute({ id: milestone.id, to: "done", actor: "alice" })
    ).rejects.toBeInstanceOf(InvalidTransitionError);
  });

  it("appends a milestone_status_changed trace with milestone id in ref", async () => {
    const milestone = makeMilestone();
    await repo.saveMilestone(milestone);
    await useCase.execute({ id: milestone.id, to: "active", actor: "alice" });
    const traces = await repo.findTraces({});
    expect(traces).toHaveLength(1);
    expect(traces[0]?.event).toBe("milestone_status_changed");
    expect(traces[0]?.ref).toBe(milestone.id.toString());
    expect(traces[0]?.from).toBe("pending");
    expect(traces[0]?.to).toBe("active");
    expect(traces[0]?.projectId.equals(projectId)).toBe(true);
  });
});
