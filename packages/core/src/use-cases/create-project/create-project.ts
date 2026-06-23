import { Project, Trace } from "../../entities/index.js";
import type { CreateProjectParams } from "../../entities/index.js";
import type { IGitAdapter, IRealmRepository } from "../../ports/index.js";
import { ProjectId, TraceId } from "../../value-objects/index.js";

type CreateProjectInput = Omit<CreateProjectParams, "id"> & {
  actor?: string;
  actorType?: "human" | "agent";
};

export class CreateProjectUseCase {
  constructor(
    private readonly repo: IRealmRepository,
    private readonly git?: IGitAdapter
  ) {}

  async execute(input: CreateProjectInput): Promise<Project> {
    const counter = await this.repo.incrementCounter("project");
    const id = ProjectId.generate(counter);

    const project = Project.create({ ...input, id });
    await this.repo.saveProject(project);

    const trace = Trace.create({
      id: TraceId.generate(),
      projectId: id,
      actor: input.actor ?? input.author,
      actorType: input.actorType ?? "human",
      event: "project_created",
    });
    await this.repo.appendTrace(trace);

    if (this.git) {
      await this.git.stage([`projects/${id.toString()}`]);
    }

    return project;
  }
}
