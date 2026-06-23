import { Spec, Trace } from "../../entities/index.js";
import type { CreateSpecParams } from "../../entities/index.js";
import { ProjectNotFoundError } from "../../errors/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { SpecId, TraceId } from "../../value-objects/index.js";

type CreateSpecInput = Omit<CreateSpecParams, "id"> & {
  actor?: string;
  actorType?: "human" | "agent";
};

export class CreateSpecUseCase {
  constructor(private readonly repo: IRealmRepository) {}

  async execute(input: CreateSpecInput): Promise<Spec> {
    const project = await this.repo.findProject(input.projectId);
    if (!project) {
      throw new ProjectNotFoundError(input.projectId.toString());
    }

    const counter = await this.repo.incrementCounter("spec");
    const id = SpecId.generate(counter);

    const spec = Spec.create({ ...input, id });
    await this.repo.saveSpec(spec);

    const trace = Trace.create({
      id: TraceId.generate(),
      projectId: input.projectId,
      specId: id,
      actor: input.actor ?? input.author,
      actorType: input.actorType ?? "human",
      event: "spec_created",
    });
    await this.repo.appendTrace(trace);

    return spec;
  }
}
