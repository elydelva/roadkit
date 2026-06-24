import { Trace } from "../entities/index.js";
import type { TraceEvent } from "../entities/index.js";
import type { IRealmRepository } from "../ports/index.js";
import { TraceId } from "../value-objects/index.js";
import type { IssueId, ProjectId, SpecId } from "../value-objects/index.js";

export interface RecordTraceParams {
  projectId: ProjectId;
  event: TraceEvent;
  actor: string;
  actorType?: "human" | "agent";
  issueId?: IssueId | null;
  specId?: SpecId | null;
  ref?: string | null;
  from?: string | null;
  to?: string | null;
  body?: string | undefined;
}

/**
 * Build an immutable trace entry and append it to the realm log. Centralizes
 * the `TraceId.generate()` + `Trace.create(...)` + `appendTrace(...)` sequence
 * that every mutation use case otherwise repeats inline.
 */
export async function recordTrace(
  repo: IRealmRepository,
  params: RecordTraceParams
): Promise<void> {
  const trace = Trace.create({
    id: TraceId.generate(),
    projectId: params.projectId,
    event: params.event,
    actor: params.actor,
    actorType: params.actorType ?? "human",
    issueId: params.issueId ?? null,
    specId: params.specId ?? null,
    ref: params.ref ?? null,
    from: params.from ?? null,
    to: params.to ?? null,
    body: params.body ?? "",
  });
  await repo.appendTrace(trace);
}
