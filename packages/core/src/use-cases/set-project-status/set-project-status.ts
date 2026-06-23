import { Trace } from "../../entities/index.js";
import type { Project } from "../../entities/index.js";
import { ProjectNotFoundError } from "../../errors/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { StateMachineService } from "../../services/index.js";
import { TraceId } from "../../value-objects/index.js";
import type { ProjectId, ProjectStatus } from "../../value-objects/index.js";

interface SetProjectStatusInput {
  id: ProjectId;
  to: ProjectStatus;
  actor: string;
  actorType?: "human" | "agent";
}

export class SetProjectStatusUseCase {
  private readonly stateMachine = new StateMachineService();

  constructor(private readonly repo: IRealmRepository) {}

  async execute(input: SetProjectStatusInput): Promise<Project> {
    const project = await this.repo.findProject(input.id);
    if (!project) {
      throw new ProjectNotFoundError(input.id.toString());
    }

    this.stateMachine.validateProjectTransition(project.status, input.to);

    const now = new Date();
    const updated: Project = {
      ...project,
      status: input.to,
      updatedAt: now,
    };
    await this.repo.saveProject(updated);

    const trace = Trace.create({
      id: TraceId.generate(),
      projectId: project.id,
      actor: input.actor,
      actorType: input.actorType ?? "human",
      event: "project_status_changed",
      from: project.status,
      to: input.to,
    });
    await this.repo.appendTrace(trace);

    return updated;
  }
}
