import { Spec } from "../../entities/index.js";
import type { CreateSpecParams } from "../../entities/index.js";
import { ProjectNotFoundError } from "../../errors/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { SpecId } from "../../value-objects/index.js";
import { recordTrace } from "../record-trace.js";
import type { UseCase } from "../use-case.js";

type CreateSpecInput = Omit<CreateSpecParams, "id"> & {
  actor?: string;
  actorType?: "human" | "agent";
  note?: string;
};

export class CreateSpecUseCase implements UseCase<CreateSpecInput, Spec> {
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

    await recordTrace(this.repo, {
      projectId: input.projectId,
      specId: id,
      actor: input.actor ?? input.author,
      actorType: input.actorType ?? "human",
      event: "spec_created",
      body: input.note,
    });

    return spec;
  }
}
