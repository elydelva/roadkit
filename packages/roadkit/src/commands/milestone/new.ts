import { ProjectId } from "@roadkit/core";
import type { Container } from "../../container.js";
import { fail, resolveAuthor } from "../shared.js";

interface MilestoneNewOptions {
  project?: string;
  title?: string;
  order?: string;
  targetDate?: string;
  body?: string;
}

export async function runMilestoneNew(
  container: Container,
  opts: MilestoneNewOptions
): Promise<void> {
  if (!opts.project) fail("--project is required");
  if (!opts.title) fail("--title is required");
  if (opts.order === undefined) fail("--order is required");

  const order = Number.parseInt(opts.order, 10);
  if (Number.isNaN(order)) fail(`Invalid --order: ${opts.order}`);

  let targetDate: Date | undefined;
  if (opts.targetDate) {
    const d = new Date(opts.targetDate);
    if (Number.isNaN(d.getTime())) fail(`Invalid --target-date: ${opts.targetDate}`);
    targetDate = d;
  }

  const author = resolveAuthor();
  const milestone = await container.createMilestone.execute({
    projectId: ProjectId.from(opts.project),
    title: opts.title,
    order,
    author,
    ...(targetDate ? { targetDate } : {}),
    body: opts.body ?? "",
  });

  console.log(`✓ Created ${milestone.id.toString()} — ${milestone.title}`);
  console.log(`  Project: ${milestone.projectId.toString()}`);
}
