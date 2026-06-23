import type { Issue, IssueStatus, Priority, Rule } from "@roadkit/core";
import { IssueId, MilestoneId, ProjectId } from "@roadkit/core";
import { parseFrontmatter } from "./frontmatter.parser.js";

function toStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val.filter((v): v is string => typeof v === "string");
}

function toRuleArray(val: unknown): Rule[] {
  if (!Array.isArray(val)) return [];
  return val.filter(
    (v): v is Rule =>
      typeof v === "object" &&
      v !== null &&
      typeof (v as Record<string, unknown>).trigger === "string" &&
      typeof (v as Record<string, unknown>).instruction === "string"
  );
}

function toDate(val: unknown): Date {
  if (val instanceof Date) return val;
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

function toDateOrNull(val: unknown): Date | null {
  if (val instanceof Date) return val;
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function toIssueStatus(val: unknown): IssueStatus {
  const valid: IssueStatus[] = [
    "not-started",
    "in-progress",
    "completed",
    "abandoned",
    "blocked",
    "skipped",
  ];
  if (typeof val === "string" && valid.includes(val as IssueStatus)) {
    return val as IssueStatus;
  }
  return "not-started";
}

function toPriority(val: unknown): Priority {
  const valid: Priority[] = ["urgent", "high", "medium", "low", "none"];
  if (typeof val === "string" && valid.includes(val as Priority)) {
    return val as Priority;
  }
  return "none";
}

function toNumberOrNull(val: unknown): number | null {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string" && val.length > 0) {
    const n = Number(val);
    if (Number.isFinite(n)) return n;
  }
  return null;
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

function toMilestoneIdOrNull(val: unknown): MilestoneId | null {
  if (typeof val !== "string" || val.length === 0) return null;
  try {
    return MilestoneId.from(val);
  } catch {
    return null;
  }
}

/**
 * Gates can reference a same-project IssueId or a cross-project string like
 * `PROJ-0001/ISSUE-0003`. Local issue ids round-trip as IssueId; anything else
 * is preserved verbatim as a string.
 */
function toGatesArray(val: unknown): Array<IssueId | string> {
  if (!Array.isArray(val)) return [];
  const result: Array<IssueId | string> = [];
  for (const v of val) {
    if (typeof v !== "string" || v.length === 0) continue;
    const id = toIssueIdOrNull(v);
    result.push(id ?? v);
  }
  return result;
}

export function parseIssue(content: string): Issue {
  const { data, body } = parseFrontmatter(content);

  return {
    id: IssueId.from(String(data.id ?? "")),
    projectId: ProjectId.from(String(data.projectId ?? "")),
    milestoneId: toMilestoneIdOrNull(data.milestoneId),
    title: typeof data.title === "string" ? data.title : "",
    status: toIssueStatus(data.status),
    priority: toPriority(data.priority),
    estimate: toNumberOrNull(data.estimate),
    labels: toStringArray(data.labels),
    parentId: toIssueIdOrNull(data.parentId),
    gates: toGatesArray(data.gates),
    rules: toRuleArray(data.rules),
    assignee: toStringOrNull(data.assignee),
    author: typeof data.author === "string" ? data.author : "",
    startedAt: toDateOrNull(data.startedAt),
    completedAt: toDateOrNull(data.completedAt),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    body,
  };
}
