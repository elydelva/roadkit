import { Milestone, Trace } from "../../entities/index.js";
import type { CreateMilestoneParams } from "../../entities/index.js";
import { ProjectNotFoundError } from "../../errors/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { MilestoneId, TraceId } from "../../value-objects/index.js";

type CreateMilestoneInput = Omit<CreateMilestoneParams, "id"> & {
  author: string;
  actor?: string;
  actorType?: "human" | "agent";
};

export class CreateMilestoneUseCase {
  constructor(private readonly repo: IRealmRepository) {}

  async execute(input: CreateMilestoneInput): Promise<Milestone> {
    const project = await this.repo.findProject(input.projectId);
    if (!project) {
      throw new ProjectNotFoundError(input.projectId.toString());
    }

    const counter = await this.repo.incrementCounter("milestone");
    const id = MilestoneId.generate(counter);

    const milestone = Milestone.create({ ...input, id });
    await this.repo.saveMilestone(milestone);

    const trace = Trace.create({
      id: TraceId.generate(),
      projectId: input.projectId,
      actor: input.actor ?? input.author,
      actorType: input.actorType ?? "human",
      event: "milestone_created",
      ref: id.toString(),
    });
    await this.repo.appendTrace(trace);

    return milestone;
  }
}
