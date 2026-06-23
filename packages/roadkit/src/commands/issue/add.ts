import { IssueId, MilestoneId, ProjectId, resolveEstimate } from "@roadkit/core";
import type { Container } from "../../container.js";
import { fail, parseList, resolveAuthor } from "../shared.js";

interface IssueAddOptions {
  project?: string;
  milestone?: string;
  title?: string;
  priority?: string;
  estimate?: string;
  labels?: string;
  parent?: string;
  gates?: string;
  assignee?: string;
  body?: string;
}

export async function runIssueAdd(container: Container, opts: IssueAddOptions): Promise<void> {
  if (!opts.project) fail("--project is required");
  if (!opts.title) fail("--title is required");

  const { levels, default: defaultPriority } = container.config.priority;

  let priority: string;
  if (opts.priority !== undefined) {
    if (!levels.includes(opts.priority)) {
      fail(`Invalid --priority: ${opts.priority} (expected ${levels.join("|")})`);
    }
    priority = opts.priority;
  } else {
    priority = defaultPriority;
  }

  let estimate: number | undefined;
  if (opts.estimate !== undefined) {
    try {
      estimate = resolveEstimate(container.config, opts.estimate);
    } catch (err) {
      fail(`Invalid --estimate: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const labels = parseList(opts.labels);
  const taxonomy = container.config.labels;
  if (taxonomy.length > 0) {
    const allowed = new Set(taxonomy.map((l) => l.name));
    const unknown = labels.filter((l) => !allowed.has(l));
    if (unknown.length > 0) {
      fail(
        `Invalid --labels: ${unknown.join(", ")} (allowed: ${taxonomy.map((l) => l.name).join(", ")})`
      );
    }
  }

  const author = resolveAuthor();
  const issue = await container.createIssue.execute({
    projectId: ProjectId.from(opts.project),
    title: opts.title,
    author,
    priority,
    ...(opts.milestone ? { milestoneId: MilestoneId.from(opts.milestone) } : {}),
    ...(estimate !== undefined ? { estimate } : {}),
    labels,
    ...(opts.parent ? { parentId: IssueId.from(opts.parent) } : {}),
    gates: parseList(opts.gates),
    ...(opts.assignee ? { assignee: opts.assignee } : {}),
    body: opts.body ?? "",
  });

  console.log(`✓ Created ${issue.id.toString()} — ${issue.title}`);
  console.log(`  Project: ${issue.projectId.toString()}`);
  if (issue.milestoneId) {
    console.log(`  Milestone: ${issue.milestoneId.toString()}`);
  }
}
