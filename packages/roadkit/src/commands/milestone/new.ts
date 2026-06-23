import type { Container } from "../../container.js";
import { fail, resolveAuthor } from "../shared.js";
import { parseProjectId, requireOption } from "../validators.js";

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
  const projectId = parseProjectId(opts.project);
  const title = requireOption(opts.title, "--title");
  const orderRaw = requireOption(opts.order, "--order");

  const order = Number.parseInt(orderRaw, 10);
  if (Number.isNaN(order)) fail(`Invalid --order: ${orderRaw}`);

  let targetDate: Date | undefined;
  if (opts.targetDate) {
    const d = new Date(opts.targetDate);
    if (Number.isNaN(d.getTime())) fail(`Invalid --target-date: ${opts.targetDate}`);
    targetDate = d;
  }

  const author = resolveAuthor();
  const milestone = await container.createMilestone.execute({
    projectId,
    title,
    order,
    author,
    ...(targetDate ? { targetDate } : {}),
    body: opts.body ?? "",
  });

  console.log(`✓ Created ${milestone.id.toString()} — ${milestone.title}`);
  console.log(`  Project: ${milestone.projectId.toString()}`);
}
