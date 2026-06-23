import { MilestoneId, type MilestoneStatus } from "@roadkit/core";
import type { Container } from "../../container.js";
import { fail, resolveAuthor } from "../shared.js";

const MILESTONE_STATUSES: ReadonlySet<string> = new Set(["pending", "active", "done"]);

export async function runMilestoneStatus(
  container: Container,
  idRaw: string,
  statusRaw: string
): Promise<void> {
  if (!MILESTONE_STATUSES.has(statusRaw)) {
    fail(`Invalid status: ${statusRaw} (expected pending|active|done)`);
  }

  const milestone = await container.setMilestoneStatus.execute({
    id: MilestoneId.from(idRaw),
    to: statusRaw as MilestoneStatus,
    actor: resolveAuthor(),
  });

  console.log(`✓ ${milestone.id.toString()} → ${milestone.status}`);
}

export async function runMilestoneStart(container: Container, idRaw: string): Promise<void> {
  await runMilestoneStatus(container, idRaw, "active");
}
