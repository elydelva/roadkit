import { IssueId, MilestoneId, type Priority, ProjectId } from "@roadkit/core";
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

const PRIORITIES: ReadonlySet<string> = new Set(["urgent", "high", "medium", "low", "none"]);

export async function runIssueAdd(container: Container, opts: IssueAddOptions): Promise<void> {
  if (!opts.project) fail("--project is required");
  if (!opts.title) fail("--title is required");

  let priority: Priority | undefined;
  if (opts.priority !== undefined) {
    if (!PRIORITIES.has(opts.priority)) {
      fail(`Invalid --priority: ${opts.priority} (expected urgent|high|medium|low|none)`);
    }
    priority = opts.priority as Priority;
  }

  let estimate: number | undefined;
  if (opts.estimate !== undefined) {
    const n = Number.parseFloat(opts.estimate);
    if (Number.isNaN(n)) fail(`Invalid --estimate: ${opts.estimate}`);
    estimate = n;
  }

  const author = resolveAuthor();
  const issue = await container.createIssue.execute({
    projectId: ProjectId.from(opts.project),
    title: opts.title,
    author,
    ...(opts.milestone ? { milestoneId: MilestoneId.from(opts.milestone) } : {}),
    ...(priority ? { priority } : {}),
    ...(estimate !== undefined ? { estimate } : {}),
    labels: parseList(opts.labels),
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
