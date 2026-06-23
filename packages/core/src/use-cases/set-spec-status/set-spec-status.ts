import type { Spec } from "../../entities/index.js";
import { SpecNotFoundError } from "../../errors/index.js";
import type { IRealmRepository } from "../../ports/index.js";
import { StateMachineService } from "../../services/index.js";
import type { SpecId, SpecStatus } from "../../value-objects/index.js";
import { recordTrace } from "../record-trace.js";
import type { UseCase } from "../use-case.js";

interface SetSpecStatusInput {
  id: SpecId;
  to: SpecStatus;
  actor: string;
  actorType?: "human" | "agent";
}

export class SetSpecStatusUseCase implements UseCase<SetSpecStatusInput, Spec> {
  private readonly stateMachine = new StateMachineService();

  constructor(private readonly repo: IRealmRepository) {}

  async execute(input: SetSpecStatusInput): Promise<Spec> {
    const spec = await this.repo.findSpec(input.id);
    if (!spec) {
      throw new SpecNotFoundError(input.id.toString());
    }

    this.stateMachine.validateSpecTransition(spec.status, input.to);

    const now = new Date();
    const updated: Spec = {
      ...spec,
      status: input.to,
      updatedAt: now,
    };
    await this.repo.saveSpec(updated);

    await recordTrace(this.repo, {
      projectId: spec.projectId,
      specId: spec.id,
      actor: input.actor,
      actorType: input.actorType ?? "human",
      event: "spec_status_changed",
      from: spec.status,
      to: input.to,
    });

    return updated;
  }
}
