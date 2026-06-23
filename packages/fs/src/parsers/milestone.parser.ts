import type { Milestone, MilestoneStatus } from "@roadkit/core";
import { MilestoneId, ProjectId } from "@roadkit/core";
import { parseFrontmatter } from "./frontmatter.parser.js";

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

function toMilestoneStatus(val: unknown): MilestoneStatus {
  const valid: MilestoneStatus[] = ["pending", "active", "done"];
  if (typeof val === "string" && valid.includes(val as MilestoneStatus)) {
    return val as MilestoneStatus;
  }
  return "pending";
}

function toNumber(val: unknown): number {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string") {
    const n = Number(val);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

export function parseMilestone(content: string): Milestone {
  const { data, body } = parseFrontmatter(content);

  return {
    id: MilestoneId.from(String(data.id ?? "")),
    projectId: ProjectId.from(String(data.projectId ?? "")),
    title: typeof data.title === "string" ? data.title : "",
    status: toMilestoneStatus(data.status),
    targetDate: toDateOrNull(data.targetDate),
    order: toNumber(data.order),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    body,
  };
}
