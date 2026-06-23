import type { Trace, TraceEvent } from "@roadkit/core";
import { IssueId, ProjectId, SpecId, TraceId } from "@roadkit/core";
import { parseFrontmatter } from "./frontmatter.parser.js";

function toTraceEvent(val: unknown): TraceEvent {
  const valid: TraceEvent[] = [
    "project_created",
    "milestone_created",
    "issue_created",
    "issue_started",
    "issue_completed",
    "issue_abandoned",
    "spec_created",
    "spec_status_changed",
    "rules_acknowledged",
    "note",
    "synced",
  ];
  if (typeof val === "string" && valid.includes(val as TraceEvent)) {
    return val as TraceEvent;
  }
  return "note";
}

function toDate(val: unknown): Date {
  if (val instanceof Date) return val;
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

function toActorType(val: unknown): "human" | "agent" {
  if (val === "agent") return "agent";
  return "human";
}

function toStringOrNull(val: unknown): string | null {
  if (typeof val === "string" && val.length > 0) return val;
  return null;
}

function toIssueIdOrNull(val: unknown): IssueId | null {
  if (typeof val !== "string" || val.length === 0) return null;
  try {
    return IssueId.from(val);
  } catch {
    return null;
  }
}

function toSpecIdOrNull(val: unknown): SpecId | null {
  if (typeof val !== "string" || val.length === 0) return null;
  try {
    return SpecId.from(val);
  } catch {
    return null;
  }
}

export function parseTrace(content: string): Trace {
  const { data, body } = parseFrontmatter(content);

  return {
    id: TraceId.from(String(data.id ?? "")),
    projectId: ProjectId.from(String(data.projectId ?? "")),
    issueId: toIssueIdOrNull(data.issueId),
    specId: toSpecIdOrNull(data.specId),
    at: toDate(data.at),
    actor: typeof data.actor === "string" ? data.actor : "unknown",
    actorType: toActorType(data.actorType),
    event: toTraceEvent(data.event),
    ref: toStringOrNull(data.ref),
    from: toStringOrNull(data.from),
    to: toStringOrNull(data.to),
    body,
  };
}
