import type { IssueId } from "../../value-objects/issue-id/issue-id.js";
import type { ProjectId } from "../../value-objects/project-id/project-id.js";
import type { SpecId } from "../../value-objects/spec-id/spec-id.js";
import type { TraceId } from "../../value-objects/trace-id/trace-id.js";

export type TraceEvent =
  | "project_created"
  | "milestone_created"
  | "issue_created"
  | "issue_started"
  | "issue_completed"
  | "issue_abandoned"
  | "spec_created"
  | "spec_status_changed"
  | "project_status_changed"
  | "milestone_status_changed"
  | "rules_acknowledged"
  | "note"
  | "synced";

export interface Trace {
  id: TraceId;
  projectId: ProjectId;
  issueId: IssueId | null;
  specId: SpecId | null;
  at: Date;
  actor: string;
  actorType: "human" | "agent";
  event: TraceEvent;
  ref: string | null;
  from: string | null;
  to: string | null;
  body: string;
}

export interface CreateTraceParams {
  id: TraceId;
  projectId: ProjectId;
  issueId?: IssueId | null;
  specId?: SpecId | null;
  actor: string;
  actorType: "human" | "agent";
  event: TraceEvent;
  ref?: string | null;
  from?: string | null;
  to?: string | null;
  body?: string;
}

export const Trace = {
  create(params: CreateTraceParams): Trace {
    return {
      id: params.id,
      projectId: params.projectId,
      issueId: params.issueId ?? null,
      specId: params.specId ?? null,
      at: new Date(),
      actor: params.actor,
      actorType: params.actorType,
      event: params.event,
      ref: params.ref ?? null,
      from: params.from ?? null,
      to: params.to ?? null,
      body: params.body ?? "",
    };
  },
};
