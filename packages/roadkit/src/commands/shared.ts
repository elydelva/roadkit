import type { Issue, Milestone, Project, RealmContext, Spec, Trace } from "@roadkit/core";

export { formatEstimate } from "@roadkit/core";

/** Resolve the acting author/actor from the environment. */
export function resolveAuthor(): string {
  return process.env.GIT_AUTHOR_NAME ?? process.env.USER ?? "unknown";
}

/** Parse a comma-separated list into a trimmed, non-empty string array. */
export function parseList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Print an error to stderr and exit with code 1. */
export function fail(message: string): never {
  console.error(`Error: ${message}`);
  process.exit(1);
}

export function serializeProject(p: Project): Record<string, unknown> {
  return {
    id: p.id.toString(),
    title: p.title,
    status: p.status,
    leads: p.leads,
    author: p.author,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    body: p.body,
  };
}

export function serializeMilestone(m: Milestone): Record<string, unknown> {
  return {
    id: m.id.toString(),
    projectId: m.projectId.toString(),
    title: m.title,
    status: m.status,
    order: m.order,
    targetDate: m.targetDate ? m.targetDate.toISOString() : null,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
    body: m.body,
  };
}

export function serializeIssue(i: Issue): Record<string, unknown> {
  return {
    id: i.id.toString(),
    projectId: i.projectId.toString(),
    milestoneId: i.milestoneId ? i.milestoneId.toString() : null,
    title: i.title,
    status: i.status,
    priority: i.priority,
    estimate: i.estimate,
    labels: i.labels,
    parentId: i.parentId ? i.parentId.toString() : null,
    gates: i.gates.map((g) => (typeof g === "string" ? g : g.toString())),
    rules: i.rules,
    assignee: i.assignee,
    author: i.author,
    startedAt: i.startedAt ? i.startedAt.toISOString() : null,
    completedAt: i.completedAt ? i.completedAt.toISOString() : null,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
    body: i.body,
  };
}

export function serializeSpec(s: Spec): Record<string, unknown> {
  return {
    id: s.id.toString(),
    projectId: s.projectId.toString(),
    title: s.title,
    status: s.status,
    supersedes: s.supersedes ? s.supersedes.toString() : null,
    supersededBy: s.supersededBy ? s.supersededBy.toString() : null,
    relatedTo: s.relatedTo.map((r) => r.toString()),
    tags: s.tags,
    rules: s.rules,
    author: s.author,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    body: s.body,
  };
}

export function serializeTrace(t: Trace): Record<string, unknown> {
  return {
    id: t.id.toString(),
    projectId: t.projectId.toString(),
    issueId: t.issueId ? t.issueId.toString() : null,
    specId: t.specId ? t.specId.toString() : null,
    at: t.at.toISOString(),
    actor: t.actor,
    actorType: t.actorType,
    event: t.event,
    ref: t.ref,
    from: t.from,
    to: t.to,
    body: t.body,
  };
}

export function serializeContext(ctx: RealmContext): Record<string, unknown> {
  return {
    projects: ctx.projects.map(serializeProject),
    milestones: ctx.milestones.map(serializeMilestone),
    issues: ctx.issues.map(serializeIssue),
    specs: ctx.specs.map(serializeSpec),
    traces: ctx.traces.map(serializeTrace),
  };
}
