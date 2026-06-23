import type { Rule, Spec, SpecStatus } from "@roadkit/core";
import { ProjectId, SpecId } from "@roadkit/core";
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

function toSpecStatus(val: unknown): SpecStatus {
  const valid: SpecStatus[] = [
    "draft",
    "proposed",
    "accepted",
    "superseded",
    "deferred",
    "abandoned",
  ];
  if (typeof val === "string" && valid.includes(val as SpecStatus)) {
    return val as SpecStatus;
  }
  return "draft";
}

function toSpecIdOrNull(val: unknown): SpecId | null {
  if (typeof val !== "string" || val.length === 0) return null;
  try {
    return SpecId.from(val);
  } catch {
    return null;
  }
}

function toSpecIdArray(val: unknown): SpecId[] {
  if (!Array.isArray(val)) return [];
  return val.flatMap((v) => {
    const id = toSpecIdOrNull(v);
    return id !== null ? [id] : [];
  });
}

export function parseSpec(content: string): Spec {
  const { data, body } = parseFrontmatter(content);

  return {
    id: SpecId.from(String(data.id ?? "")),
    projectId: ProjectId.from(String(data.projectId ?? "")),
    title: typeof data.title === "string" ? data.title : "",
    status: toSpecStatus(data.status),
    supersedes: toSpecIdOrNull(data.supersedes),
    supersededBy: toSpecIdOrNull(data.supersededBy),
    relatedTo: toSpecIdArray(data.relatedTo),
    tags: toStringArray(data.tags),
    rules: toRuleArray(data.rules),
    author: typeof data.author === "string" ? data.author : "",
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    body,
  };
}
