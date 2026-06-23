import type { Project, ProjectStatus } from "@roadkit/core";
import { ProjectId } from "@roadkit/core";
import { parseFrontmatter } from "./frontmatter.parser.js";

function toStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val.filter((v): v is string => typeof v === "string");
}

function toDate(val: unknown): Date {
  if (val instanceof Date) return val;
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

function toProjectStatus(val: unknown): ProjectStatus {
  const valid: ProjectStatus[] = ["planned", "active", "paused", "completed", "cancelled"];
  if (typeof val === "string" && valid.includes(val as ProjectStatus)) {
    return val as ProjectStatus;
  }
  return "planned";
}

export function parseProject(content: string): Project {
  const { data, body } = parseFrontmatter(content);

  return {
    id: ProjectId.from(String(data.id ?? "")),
    title: typeof data.title === "string" ? data.title : "",
    status: toProjectStatus(data.status),
    leads: toStringArray(data.leads),
    author: typeof data.author === "string" ? data.author : "",
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    body,
  };
}
