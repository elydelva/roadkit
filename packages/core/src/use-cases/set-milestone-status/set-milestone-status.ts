import { Trace } from "../../entities/index.js";
import type { Milestone } from "../../entities/index.js";
import { MilestoneNotFoundError } from "../../errors/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { StateMachineService } from "../../services/index.js";
import { TraceId } from "../../value-objects/index.js";
import type { MilestoneId, MilestoneStatus } from "../../value-objects/index.js";

interface SetMilestoneStatusInput {
  id: MilestoneId;
  to: MilestoneStatus;
  actor: string;
  actorType?: "human" | "agent";
}

export class SetMilestoneStatusUseCase {
  private readonly stateMachine = new StateMachineService();

  constructor(private readonly repo: IRealmRepository) {}

  async execute(input: SetMilestoneStatusInput): Promise<Milestone> {
    const milestone = await this.repo.findMilestone(input.id);
    if (!milestone) {
      throw new MilestoneNotFoundError(input.id.toString());
    }

    this.stateMachine.validateMilestoneTransition(milestone.status, input.to);

    const now = new Date();
    const updated: Milestone = {
      ...milestone,
      status: input.to,
      updatedAt: now,
    };
    await this.repo.saveMilestone(updated);

    const trace = Trace.create({
      id: TraceId.generate(),
      projectId: milestone.projectId,
      actor: input.actor,
      actorType: input.actorType ?? "human",
      event: "milestone_status_changed",
      ref: milestone.id.toString(),
      from: milestone.status,
      to: input.to,
    });
    await this.repo.appendTrace(trace);

    return updated;
  }
}
