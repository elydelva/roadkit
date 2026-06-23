import type { Project } from "../../entities/index.js";
import { ProjectNotFoundError } from "../../errors/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { StateMachineService } from "../../services/index.js";
import type { ProjectId, ProjectStatus } from "../../value-objects/index.js";
import { recordTrace } from "../record-trace.js";
import type { UseCase } from "../use-case.js";

interface SetProjectStatusInput {
  id: ProjectId;
  to: ProjectStatus;
  actor: string;
  actorType?: "human" | "agent";
}

export class SetProjectStatusUseCase implements UseCase<SetProjectStatusInput, Project> {
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

    await recordTrace(this.repo, {
      projectId: project.id,
      actor: input.actor,
      actorType: input.actorType ?? "human",
      event: "project_status_changed",
      from: project.status,
      to: input.to,
    });

    return updated;
  }
}
