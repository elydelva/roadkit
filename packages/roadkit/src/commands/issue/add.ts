import { IssueId, MilestoneId } from "@roadkit/core";
import type { Container } from "../../container.js";
import { parseList, resolveAuthor } from "../shared.js";
import {
  parseProjectId,
  requireOption,
  resolveEstimate,
  resolvePriority,
  validateLabelsAgainstTaxonomy,
} from "../validators.js";

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
  const projectId = parseProjectId(opts.project);
  const title = requireOption(opts.title, "--title");

  const priority = resolvePriority(opts.priority, container.config);
  const estimate = resolveEstimate(opts.estimate, container.config);

  const labels = parseList(opts.labels);
  validateLabelsAgainstTaxonomy(labels, container.config);

  const author = resolveAuthor();
  const issue = await container.createIssue.execute({
    projectId,
    title,
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
