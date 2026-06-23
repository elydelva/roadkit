import { Trace } from "../../entities/index.js";
import type { Spec } from "../../entities/index.js";
import { SpecNotFoundError } from "../../errors/index.js";
import type { IGitAdapter, IRealmRepository } from "../../ports/index.js";
import { StateMachineService } from "../../services/index.js";
import { TraceId } from "../../value-objects/index.js";
import type { SpecId, SpecStatus } from "../../value-objects/index.js";

interface SetSpecStatusInput {
  id: SpecId;
  to: SpecStatus;
  actor: string;
  actorType?: "human" | "agent";
}

export class SetSpecStatusUseCase {
  private readonly stateMachine = new StateMachineService();

  constructor(
    private readonly repo: IRealmRepository,
    private readonly git?: IGitAdapter
  ) {}

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

    const trace = Trace.create({
      id: TraceId.generate(),
      projectId: spec.projectId,
      specId: spec.id,
      actor: input.actor,
      actorType: input.actorType ?? "human",
      event: "spec_status_changed",
      from: spec.status,
      to: input.to,
    });
    await this.repo.appendTrace(trace);

    if (this.git) {
      await this.git.stage([`projects/${spec.projectId.toString()}/specs/${spec.id.toString()}`]);
    }

    return updated;
  }
}
