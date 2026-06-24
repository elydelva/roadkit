import { MilestoneId, type MilestoneStatus } from "@roadkit/core";
import type { Container } from "../../container.js";
import { setJsonMode } from "../json-mode.js";
import { getFormatter } from "../output.js";
import { fail, resolveAuthor, serializeMilestone } from "../shared.js";

const MILESTONE_STATUSES: ReadonlySet<string> = new Set(["pending", "active", "done"]);

interface StatusOptions {
  json?: boolean;
}

export async function runMilestoneStatus(
  container: Container,
  idRaw: string,
  statusRaw: string,
  opts: StatusOptions = {}
): Promise<void> {
  setJsonMode(opts.json ?? false);
  if (!MILESTONE_STATUSES.has(statusRaw)) {
    fail(`Invalid status: ${statusRaw} (expected pending|active|done)`);
  }

  const milestone = await container.setMilestoneStatus.execute({
    id: MilestoneId.from(idRaw),
    to: statusRaw as MilestoneStatus,
    actor: resolveAuthor(),
  });

  getFormatter(opts.json ?? false).emit({
    json: serializeMilestone(milestone),
    human: () => console.log(`✓ ${milestone.id.toString()} → ${milestone.status}`),
  });
}

export async function runMilestoneStart(
  container: Container,
  idRaw: string,
  opts: StatusOptions = {}
): Promise<void> {
  await runMilestoneStatus(container, idRaw, "active", opts);
}
