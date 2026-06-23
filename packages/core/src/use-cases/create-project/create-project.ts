import { Project } from "../../entities/index.js";
import type { CreateProjectParams } from "../../entities/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { ProjectId } from "../../value-objects/index.js";
import { recordTrace } from "../record-trace.js";
import type { UseCase } from "../use-case.js";

type CreateProjectInput = Omit<CreateProjectParams, "id"> & {
  actor?: string;
  actorType?: "human" | "agent";
};

export class CreateProjectUseCase implements UseCase<CreateProjectInput, Project> {
  constructor(private readonly repo: IRealmRepository) {}

  async execute(input: CreateProjectInput): Promise<Project> {
    const counter = await this.repo.incrementCounter("project");
    const id = ProjectId.generate(counter);

    const project = Project.create({ ...input, id });
    await this.repo.saveProject(project);

    await recordTrace(this.repo, {
      projectId: id,
      actor: input.actor ?? input.author,
      actorType: input.actorType ?? "human",
      event: "project_created",
    });

    return project;
  }
}
